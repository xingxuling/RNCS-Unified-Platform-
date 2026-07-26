import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {createHash,randomUUID,timingSafeEqual} from 'node:crypto';
import JSZip from 'jszip';

const DEFAULT_EXECUTABLES=['node','npm','npx','python','python3','git','java','javac','gradle','./gradlew','zip'];
const SECRET_BASENAMES=new Set(['.env','.npmrc','.pypirc','.git-credentials','credentials','credentials.json','id_rsa','id_ed25519']);
const SECRET_EXTENSIONS=new Set(['.pem','.key','.p12','.pfx','.jks','.keystore']);
const SECRET_FRAGMENTS=['service-account','service_account','signing-key','signing_key','private-key','private_key'];
const SENSITIVE_ENV_PATTERN=/(TOKEN|SECRET|PASSWORD|PRIVATE|CREDENTIAL|AUTH|COOKIE|SESSION|KEY)/i;
const CHILD_ENV_ALLOWLIST=new Set(['PATH','HOME','USER','USERNAME','SHELL','TMP','TEMP','TMPDIR','LANG','LC_ALL','CI','TERM','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','JAVA_HOME','ANDROID_HOME','ANDROID_SDK_ROOT','GRADLE_HOME']);
const PROFILE_COMMANDS=Object.freeze({
 'node-test':{executable:'npm',args:['test']},
 'node-build':{executable:'npm',args:['run','build']},
 'python-test':{executable:'python3',args:['-m','pytest']},
 'gradle-test':{executable:'./gradlew',args:['test']},
 'android-debug':{executable:'./gradlew',args:['assembleDebug']},
 'android-release':{executable:'./gradlew',args:['assembleRelease']},
 'rncs-mcp-test':{executable:'npm',args:['run','test:mcp']},
 'rncs-test':{executable:'npm',args:['test']},
 'rsr-test':{executable:'npm',args:['test','--workspace','@taowind/reality-simulation-runtime']},
 'rsr-simulate':{executable:'npm',args:['run','demo:simulation','--workspace','@taowind/reality-simulation-runtime']},
 'vsr-test':{executable:'npm',args:['test','--workspace','@taowind/visual-state-runtime']},
 'vsr-render-demo':{executable:'npm',args:['run','demo','--workspace','@taowind/visual-state-runtime']}
});

function runtimeError(code,message,details){return Object.assign(new Error(message),{code,details});}
const sha256=value=>createHash('sha256').update(value).digest('hex');
const isWithin=(root,target)=>target===root||target.startsWith(`${root}${path.sep}`);
const normalizeRelative=value=>String(value??'.').replaceAll('\\','/');
const constantTimeEqual=(left,right)=>{const a=Buffer.from(String(left)),b=Buffer.from(String(right));return a.length===b.length&&timingSafeEqual(a,b);};

function assertNonSecret(relativePath){
 const normalized=normalizeRelative(relativePath).toLowerCase();
 const base=path.posix.basename(normalized);
 if(base.endsWith('.example')||base.endsWith('.sample')||base.endsWith('.template'))return;
 if(SECRET_BASENAMES.has(base)||SECRET_EXTENSIONS.has(path.posix.extname(base))||SECRET_FRAGMENTS.some(fragment=>base.includes(fragment))){
  throw runtimeError('SECRET_PATH_DENIED',`Secret-bearing path is not available through the execution runtime: ${relativePath}`);
 }
}

function resolveWorkspacePath(root,relativePath,{allowMissing=false,secretCheck=true}={}){
 const relative=normalizeRelative(relativePath);
 if(relative.includes('\0')||path.isAbsolute(relative)||relative.split('/').includes('..'))throw runtimeError('WORKSPACE_PATH_ESCAPE',`Path escapes workspace: ${relativePath}`);
 if(secretCheck)assertNonSecret(relative);
 const target=path.resolve(root,relative);
 if(!isWithin(root,target))throw runtimeError('WORKSPACE_PATH_ESCAPE',`Path escapes workspace: ${relativePath}`);
 let probe=target;
 while(!fs.existsSync(probe)){
  const parent=path.dirname(probe);
  if(parent===probe)break;
  probe=parent;
 }
 const realRoot=fs.realpathSync(root);
 const realProbe=fs.realpathSync(probe);
 if(!isWithin(realRoot,realProbe))throw runtimeError('WORKSPACE_SYMLINK_ESCAPE',`Symlink escapes workspace: ${relativePath}`);
 if(fs.existsSync(target)){
  const realTarget=fs.realpathSync(target);
  if(!isWithin(realRoot,realTarget))throw runtimeError('WORKSPACE_SYMLINK_ESCAPE',`Symlink escapes workspace: ${relativePath}`);
 }else if(!allowMissing){
  throw runtimeError('WORKSPACE_PATH_NOT_FOUND',`Workspace path does not exist: ${relativePath}`);
 }
 return target;
}

function readJsonResponse(response){return response.text().then(text=>{let body;try{body=text?JSON.parse(text):{};}catch{throw runtimeError('PROVIDER_RESPONSE_INVALID',`Provider returned non-JSON response (${response.status}).`,{body:text.slice(0,500)});}if(!response.ok)throw runtimeError(body?.error?.code??'PROVIDER_REQUEST_FAILED',body?.error?.message??`Provider request failed (${response.status}).`,body);return body;});}

function npmCliPath(executable){
 const cli=executable==='npx'?'npx-cli.js':'npm-cli.js';
 const candidates=[
  executable==='npm'?process.env.npm_execpath:null,
  path.join(path.dirname(process.execPath),'node_modules','npm','bin',cli),
  path.join(path.dirname(process.execPath),'..','lib','node_modules','npm','bin',cli)
 ].filter(Boolean);
 return candidates.find(candidate=>fs.existsSync(candidate))??null;
}

function resolveProcessInvocation(executable,args,absoluteCwd){
 if(executable==='npm'||executable==='npx'){
  const cli=npmCliPath(executable);
  if(cli)return{executable:process.execPath,args:[cli,...args],mode:`node-${executable}-cli`};
  if(process.platform==='win32')return{executable:`${executable}.cmd`,args,mode:`windows-${executable}-cmd`};
 }
 if(process.platform==='win32'&&(executable==='./gradlew'||executable==='gradlew')){
  const wrapper=path.join(absoluteCwd,'gradlew.bat');
  if(fs.existsSync(wrapper))return{executable:process.env.ComSpec||'cmd.exe',args:['/d','/s','/c','call',wrapper,...args],mode:'windows-gradle-wrapper'};
 }
 return{executable,args,mode:'direct'};
}

async function zipDirectory(source){
 const archive=new JSZip();
 const visit=(absolute,base='')=>{
  for(const entry of fs.readdirSync(absolute,{withFileTypes:true})){
   const relative=path.posix.join(base,entry.name);
   try{assertNonSecret(relative);}catch{continue;}
   const full=path.join(absolute,entry.name),info=fs.lstatSync(full);
   if(info.isSymbolicLink())continue;
   if(entry.isDirectory())visit(full,relative);
   else if(entry.isFile())archive.file(relative,fs.readFileSync(full));
  }
 };
 visit(source);
 return archive.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:6},platform:'UNIX'});
}

export class DeveloperExecutionRuntime{
 constructor(options={}){
  this.workspaceRoot=path.resolve(options.workspaceRoot??process.env.TAOWIND_EXECUTION_WORKSPACE_ROOT??process.cwd());
  fs.mkdirSync(this.workspaceRoot,{recursive:true});
  this.mode=String(options.mode??process.env.TAOWIND_EXECUTION_MODE??'founder').toLowerCase();
  if(!['disabled','project','founder','founder-unrestricted'].includes(this.mode))throw runtimeError('EXECUTION_MODE_INVALID',`Unsupported execution mode: ${this.mode}`);
  this.enableShell=Boolean(options.enableShell??['1','true','yes','on'].includes(String(process.env.TAOWIND_EXECUTION_ENABLE_SHELL??'').toLowerCase()));
  this.allowedExecutables=new Set(options.allowedExecutables??String(process.env.TAOWIND_EXECUTION_ALLOWED_EXECUTABLES??DEFAULT_EXECUTABLES.join(',')).split(',').map(item=>item.trim()).filter(Boolean));
  this.defaultTimeoutMs=Number(options.defaultTimeoutMs??process.env.TAOWIND_EXECUTION_TIMEOUT_MS??120_000);
  this.maxOutputBytes=Number(options.maxOutputBytes??process.env.TAOWIND_EXECUTION_MAX_OUTPUT_BYTES??1_000_000);
  this.githubToken=String(options.githubToken??process.env.TAOWIND_GITHUB_TOKEN??'');
  this.githubOwner=String(options.githubOwner??process.env.TAOWIND_GITHUB_OWNER??'');
  this.githubRepo=String(options.githubRepo??process.env.TAOWIND_GITHUB_REPO??'');
  this.githubApiBase=String(options.githubApiBase??process.env.TAOWIND_GITHUB_API_BASE??'https://api.github.com').replace(/\/$/,'');
  this.vercelToken=String(options.vercelToken??process.env.TAOWIND_VERCEL_TOKEN??'');
  this.vercelProjectId=String(options.vercelProjectId??process.env.TAOWIND_VERCEL_PROJECT_ID??'');
  this.vercelTeamId=String(options.vercelTeamId??process.env.TAOWIND_VERCEL_TEAM_ID??'');
  this.vercelDeployHook=String(options.vercelDeployHook??process.env.TAOWIND_VERCEL_DEPLOY_HOOK??'');
  this.receiptDir=path.resolve(options.receiptDir??process.env.TAOWIND_EXECUTION_RECEIPT_DIR??path.join(os.tmpdir(),'taowind-execution-receipts',sha256(this.workspaceRoot).slice(0,16)));
  this.exportDir=path.resolve(options.exportDir??process.env.TAOWIND_EXECUTION_EXPORT_DIR??path.join(this.receiptDir,'exports'));
  this.exportTtlMs=Math.max(60_000,Math.min(Number(options.exportTtlMs??process.env.TAOWIND_EXECUTION_EXPORT_TTL_MS??60*60_000),24*60*60_000));
  this.exports=new Map();
  fs.mkdirSync(this.receiptDir,{recursive:true});
  fs.mkdirSync(this.exportDir,{recursive:true});
 }
 assertEnabled(){if(this.mode==='disabled')throw runtimeError('EXECUTION_DISABLED','Developer execution runtime is disabled.');}
 status(){return{status:this.mode==='disabled'?'disabled':'ready',provider:'local',mode:this.mode,workspace_root:this.workspaceRoot,shell_enabled:this.mode==='founder-unrestricted'&&this.enableShell,allowed_executables:[...this.allowedExecutables].sort(),profiles:Object.keys(PROFILE_COMMANDS),github:{configured:Boolean(this.githubToken&&this.githubOwner&&this.githubRepo),repository:this.githubOwner&&this.githubRepo?`${this.githubOwner}/${this.githubRepo}`:null},vercel:{configured:Boolean(this.vercelDeployHook||this.vercelToken&&this.vercelProjectId),project_id:this.vercelProjectId||null}};}
 async invoke(action,payload={}){
  if(action==='health'||action==='status')return this.status();
  this.assertEnabled();
  const handlers={
   listFiles:()=>this.listFiles(payload),readFile:()=>this.readFile(payload),writeFile:()=>this.writeFile(payload),applyPatch:()=>this.applyPatch(payload),removePath:()=>this.removePath(payload),exportArtifact:()=>this.exportArtifact(payload),
   runCommand:()=>this.runCommand(payload),runShell:()=>this.runShell(payload),runBuild:()=>this.runBuild(payload),
   gitStatus:()=>this.gitStatus(payload),gitDiff:()=>this.gitDiff(payload),gitCreateBranch:()=>this.gitCreateBranch(payload),gitCommit:()=>this.gitCommit(payload),gitPush:()=>this.gitPush(payload),
   githubCreatePullRequest:()=>this.githubCreatePullRequest(payload),githubTriggerWorkflow:()=>this.githubTriggerWorkflow(payload),
   vercelDeploy:()=>this.vercelDeploy(payload),vercelGetDeployment:()=>this.vercelGetDeployment(payload),
   rsrSimulate:()=>this.rsrSimulate(payload),vsrRender:()=>this.vsrRender(payload),engineeringWorkflow:()=>this.engineeringWorkflow(payload)
  };
  const handler=handlers[action];
  if(!handler)throw runtimeError('EXECUTION_ACTION_UNSUPPORTED',`Unsupported developer execution action: ${action}`);
  return handler();
 }
 listFiles({path:relative='.',max_entries=500}={}){
  const target=resolveWorkspacePath(this.workspaceRoot,relative);
  const output=[];
  const visit=(absolute,base)=>{
   for(const entry of fs.readdirSync(absolute,{withFileTypes:true})){
    const rel=path.posix.join(base,entry.name);
    try{assertNonSecret(rel);}catch{continue;}
    const full=path.join(absolute,entry.name);
    const stat=fs.lstatSync(full);
    if(stat.isSymbolicLink()){output.push({path:rel,type:'symlink'});continue;}
    output.push({path:rel,type:entry.isDirectory()?'directory':'file',size:entry.isFile()?stat.size:undefined});
    if(output.length>=max_entries)return;
    if(entry.isDirectory())visit(full,rel);
    if(output.length>=max_entries)return;
   }
  };
  const stat=fs.statSync(target);
  if(stat.isDirectory())visit(target,normalizeRelative(relative)==='.'?'':normalizeRelative(relative));
  else output.push({path:normalizeRelative(relative),type:'file',size:stat.size});
  return{count:output.length,truncated:output.length>=max_entries,items:output};
 }
 readFile({path:relative,max_bytes=1_000_000,encoding='utf8'}={}){
  const target=resolveWorkspacePath(this.workspaceRoot,relative);
  const stat=fs.statSync(target);
  if(!stat.isFile())throw runtimeError('WORKSPACE_NOT_FILE',`Not a file: ${relative}`);
  if(stat.size>max_bytes)throw runtimeError('WORKSPACE_FILE_TOO_LARGE',`File exceeds max_bytes: ${relative}`,{size:stat.size,max_bytes});
  const buffer=fs.readFileSync(target);
  return{path:normalizeRelative(relative),size:buffer.length,sha256:sha256(buffer),encoding,content:encoding==='base64'?buffer.toString('base64'):buffer.toString('utf8')};
 }
 writeFile({path:relative,content,encoding='utf8',create=true}={}){
  if(typeof content!=='string')throw runtimeError('CONTENT_REQUIRED','writeFile requires string content.');
  const target=resolveWorkspacePath(this.workspaceRoot,relative,{allowMissing:create});
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const buffer=Buffer.from(content,encoding==='base64'?'base64':'utf8');
  const temp=`${target}.tmp-${process.pid}-${randomUUID()}`;
  fs.writeFileSync(temp,buffer,{mode:0o600});
  fs.renameSync(temp,target);
  return{path:normalizeRelative(relative),size:buffer.length,sha256:sha256(buffer)};
 }
 applyPatch({path:relative,replacements}={}){
  if(!Array.isArray(replacements)||!replacements.length)throw runtimeError('PATCH_REPLACEMENTS_REQUIRED','applyPatch requires at least one exact replacement.');
  const current=this.readFile({path:relative}).content;
  let next=current;
  const applied=[];
  for(const [index,item] of replacements.entries()){
   const search=String(item.search??''),replace=String(item.replace??'');
   if(!search)throw runtimeError('PATCH_SEARCH_REQUIRED',`Replacement ${index} has an empty search string.`);
   const occurrences=next.split(search).length-1;
   const expected=item.expected_occurrences??1;
   if(occurrences!==expected)throw runtimeError('PATCH_CONTEXT_MISMATCH',`Replacement ${index} expected ${expected} occurrence(s), found ${occurrences}.`,{path:relative,index,expected,found:occurrences});
   next=item.all?next.split(search).join(replace):next.replace(search,replace);
   applied.push({index,occurrences});
  }
  const write=this.writeFile({path:relative,content:next});
  return{...write,applied,changed:current!==next};
 }
 removePath({path:relative,recursive=false}={}){
  const target=resolveWorkspacePath(this.workspaceRoot,relative);
  if(target===this.workspaceRoot)throw runtimeError('WORKSPACE_ROOT_DELETE_DENIED','Cannot delete the workspace root.');
  const stat=fs.lstatSync(target);
  if(stat.isDirectory()&&!recursive)throw runtimeError('RECURSIVE_REQUIRED',`Directory removal requires recursive=true: ${relative}`);
  fs.rmSync(target,{recursive,force:false});
  return{path:normalizeRelative(relative),removed:true};
 }
 cleanupExports(){
  const now=Date.now();
  for(const [id,item] of this.exports)if(item.expires_at_ms<=now||!fs.existsSync(item.absolute_path)){
   this.exports.delete(id);
   try{fs.rmSync(item.absolute_path,{force:true,recursive:true});}catch{}
  }
 }
 async exportArtifact({path:relative,filename}={}){
  this.cleanupExports();
  const source=resolveWorkspacePath(this.workspaceRoot,relative);
  const stat=fs.statSync(source);
  const exportId=`artifact-${randomUUID()}`;
  const token=randomUUID().replaceAll('-','')+randomUUID().replaceAll('-','');
  const safeName=String(filename??`${path.basename(source)}${stat.isDirectory()?'.zip':''}`).replace(/[^A-Za-z0-9._-]+/g,'_').slice(0,180)||'artifact.bin';
  const destination=path.join(this.exportDir,`${exportId}-${safeName}`);
  if(stat.isFile())fs.copyFileSync(source,destination);
  else if(stat.isDirectory()){
   fs.writeFileSync(destination,await zipDirectory(source));
  }else throw runtimeError('ARTIFACT_TYPE_UNSUPPORTED',`Unsupported artifact type: ${relative}`);
  const output=fs.statSync(destination),expiresAtMs=Date.now()+this.exportTtlMs;
  const record={export_id:exportId,filename:safeName,absolute_path:destination,size:output.size,sha256:sha256(fs.readFileSync(destination)),token,expires_at_ms:expiresAtMs};
  this.exports.set(exportId,record);
  return{format:'taowind.execution-artifact.v0.1',export_id:exportId,filename:safeName,size:record.size,sha256:record.sha256,expires_at:new Date(expiresAtMs).toISOString(),download_token:token,local_path:destination};
 }
 openExport(exportId,token){
  this.cleanupExports();
  const item=this.exports.get(String(exportId));
  if(!item||!constantTimeEqual(token,item.token))throw runtimeError('ARTIFACT_NOT_FOUND','Execution artifact not found or token invalid.');
  return item;
 }
 async runProcess({executable,args=[],cwd='.',timeout_ms=this.defaultTimeoutMs,env={},allow_failure=false,shell=false,stdin}={}){
  const started=Date.now();
  const absoluteCwd=resolveWorkspacePath(this.workspaceRoot,cwd,{secretCheck:false});
  const base=path.basename(executable);
  const allowed=this.allowedExecutables.has(executable)||this.allowedExecutables.has(base);
  if(!allowed&&this.mode!=='founder-unrestricted')throw runtimeError('EXECUTABLE_NOT_ALLOWED',`Executable is not allowed in ${this.mode} mode: ${executable}`);
  if(shell&&!(this.mode==='founder-unrestricted'&&this.enableShell))throw runtimeError('SHELL_DISABLED','Shell execution requires founder-unrestricted mode and TAOWIND_EXECUTION_ENABLE_SHELL=true.');
  const safeEnv={};
  for(const [key,value] of Object.entries(process.env)){
   if(CHILD_ENV_ALLOWLIST.has(key.toUpperCase())&&!SENSITIVE_ENV_PATTERN.test(key))safeEnv[key]=value;
  }
  for(const [key,value] of Object.entries(env??{})){
   if(SENSITIVE_ENV_PATTERN.test(key))throw runtimeError('EXECUTION_ENV_SECRET_DENIED',`Secret-like environment variable cannot be supplied through MCP: ${key}`);
   safeEnv[key]=String(value);
  }
  const detached=process.platform!=='win32';
  const requestedArgs=args.map(String);
  const invocation=resolveProcessInvocation(executable,requestedArgs,absoluteCwd);
  const child=spawn(invocation.executable,invocation.args,{cwd:absoluteCwd,env:safeEnv,shell,windowsHide:true,detached,stdio:['pipe','pipe','pipe']});
  let stdout='',stderr='',truncated=false,timedOut=false;
  const append=(current,chunk)=>{const next=current+chunk.toString('utf8');if(Buffer.byteLength(next)<=this.maxOutputBytes)return next;truncated=true;return next.slice(-this.maxOutputBytes);};
  child.stdout.on('data',chunk=>stdout=append(stdout,chunk));
  child.stderr.on('data',chunk=>stderr=append(stderr,chunk));
  if(stdin!==undefined)child.stdin.end(String(stdin));else child.stdin.end();
  const exitCode=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{timedOut=true;try{if(detached&&child.pid)process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{child.kill('SIGKILL');}},Math.max(100,Math.min(Number(timeout_ms)||this.defaultTimeoutMs,30*60_000)));
   child.on('error',error=>{clearTimeout(timer);reject(runtimeError('PROCESS_SPAWN_FAILED',error.message));});
   child.on('close',code=>{clearTimeout(timer);resolve(code??-1);});
  });
  const receipt={receipt_id:`exec-${randomUUID()}`,action:'process',executable,resolved_executable:invocation.executable,invocation_mode:invocation.mode,path_args_hash:sha256(JSON.stringify(requestedArgs)),cwd:normalizeRelative(cwd),exit_code:exitCode,timed_out:timedOut,truncated,duration_ms:Date.now()-started,created_at:new Date().toISOString()};
  fs.writeFileSync(path.join(this.receiptDir,`${receipt.receipt_id}.json`),JSON.stringify(receipt,null,2)+'\n');
  const result={...receipt,stdout,stderr};
  if((exitCode!==0||timedOut)&&!allow_failure)throw runtimeError(timedOut?'PROCESS_TIMEOUT':'PROCESS_EXIT_NONZERO',`${executable} exited with code ${exitCode}.`,result);
  return result;
 }
 runCommand(payload={}){return this.runProcess({...payload,shell:false});}
 runShell({script,cwd='.',timeout_ms=this.defaultTimeoutMs,allow_failure=false}={}){
  if(!(this.mode==='founder-unrestricted'&&this.enableShell))throw runtimeError('SHELL_DISABLED','Shell execution requires founder-unrestricted mode and explicit enablement.');
  if(typeof script!=='string'||!script.trim())throw runtimeError('SHELL_SCRIPT_REQUIRED','runShell requires a non-empty script.');
  if(process.platform==='win32')return this.runProcess({executable:'cmd.exe',args:['/d','/s','/c',script],cwd,timeout_ms,allow_failure,shell:false});
  return this.runProcess({executable:'/bin/bash',args:['-lc',script],cwd,timeout_ms,allow_failure,shell:false});
 }
 runBuild({profile,cwd='.',extra_args=[],timeout_ms}={}){
  const command=PROFILE_COMMANDS[profile];
  if(!command)throw runtimeError('BUILD_PROFILE_UNKNOWN',`Unknown build profile: ${profile}`,{profiles:Object.keys(PROFILE_COMMANDS)});
  return this.runProcess({executable:command.executable,args:[...command.args,...extra_args],cwd,timeout_ms:timeout_ms??this.defaultTimeoutMs});
 }
 gitStatus({cwd='.'}={}){return this.runProcess({executable:'git',args:['status','--short'],cwd});}
 gitDiff({cwd='.',staged=false}={}){return this.runProcess({executable:'git',args:['diff',...(staged?['--cached']:[])],cwd});}
 gitCreateBranch({branch,cwd='.',start_point}={}){if(!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,199}$/.test(String(branch??''))||String(branch).includes('..'))throw runtimeError('GIT_BRANCH_INVALID',`Invalid branch name: ${branch}`);return this.runProcess({executable:'git',args:['switch','-c',branch,...(start_point?[start_point]:[])],cwd});}
 async gitCommit({message,paths=['.'],cwd='.'}={}){
  if(typeof message!=='string'||!message.trim())throw runtimeError('GIT_COMMIT_MESSAGE_REQUIRED','Commit message is required.');
  for(const item of paths)resolveWorkspacePath(resolveWorkspacePath(this.workspaceRoot,cwd,{secretCheck:false}),item,{allowMissing:true});
  await this.runProcess({executable:'git',args:['add','--',...paths],cwd});
  return this.runProcess({executable:'git',args:['commit','-m',message],cwd});
 }
 gitPush({remote='origin',branch,set_upstream=true,force_with_lease=false,cwd='.'}={}){
  if(!/^[A-Za-z0-9._-]+$/.test(remote))throw runtimeError('GIT_REMOTE_INVALID',`Invalid remote: ${remote}`);
  const args=['push'];if(set_upstream)args.push('-u');if(force_with_lease)args.push('--force-with-lease');args.push(remote,branch);
  return this.runProcess({executable:'git',args,cwd,timeout_ms:10*60_000});
 }
 async githubRequest(method,pathname,body){
  if(!this.githubToken||!this.githubOwner||!this.githubRepo)throw runtimeError('GITHUB_PROVIDER_NOT_CONFIGURED','GitHub provider requires TAOWIND_GITHUB_TOKEN, TAOWIND_GITHUB_OWNER and TAOWIND_GITHUB_REPO.');
  const response=await fetch(`${this.githubApiBase}${pathname}`,{method,headers:{accept:'application/vnd.github+json',authorization:`Bearer ${this.githubToken}`,'x-github-api-version':'2022-11-28','user-agent':'taowind-developer-execution-runtime'},body:body===undefined?undefined:JSON.stringify(body)});
  return readJsonResponse(response);
 }
 githubCreatePullRequest({head,base='main',title,body='',draft=false}={}){return this.githubRequest('POST',`/repos/${encodeURIComponent(this.githubOwner)}/${encodeURIComponent(this.githubRepo)}/pulls`,{head,base,title,body,draft});}
 async githubTriggerWorkflow({workflow_id,ref='main',inputs={}}={}){await this.githubRequest('POST',`/repos/${encodeURIComponent(this.githubOwner)}/${encodeURIComponent(this.githubRepo)}/actions/workflows/${encodeURIComponent(workflow_id)}/dispatches`,{ref,inputs});return{triggered:true,workflow_id,ref};}
 async vercelDeploy({ref='main',name,environment='preview',meta={}}={}){
  if(this.vercelDeployHook){const response=await fetch(this.vercelDeployHook,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ref,environment,meta})});return readJsonResponse(response);}
  if(!this.vercelToken||!this.vercelProjectId)throw runtimeError('VERCEL_PROVIDER_NOT_CONFIGURED','Vercel provider requires a deploy hook or TAOWIND_VERCEL_TOKEN and TAOWIND_VERCEL_PROJECT_ID.');
  const query=this.vercelTeamId?`?teamId=${encodeURIComponent(this.vercelTeamId)}`:'';
  const body={name:name||this.vercelProjectId,project:this.vercelProjectId,target:environment==='production'?'production':undefined,gitSource:{type:'github',ref,repoId:meta.repo_id},meta};
  const response=await fetch(`https://api.vercel.com/v13/deployments${query}`,{method:'POST',headers:{authorization:`Bearer ${this.vercelToken}`,'content-type':'application/json'},body:JSON.stringify(body)});
  return readJsonResponse(response);
 }
 async vercelGetDeployment({deployment_id}={}){
  if(!this.vercelToken)throw runtimeError('VERCEL_PROVIDER_NOT_CONFIGURED','Vercel token is not configured.');
  const query=this.vercelTeamId?`?teamId=${encodeURIComponent(this.vercelTeamId)}`:'';
  const response=await fetch(`https://api.vercel.com/v13/deployments/${encodeURIComponent(deployment_id)}${query}`,{headers:{authorization:`Bearer ${this.vercelToken}`}});
  return readJsonResponse(response);
 }
 async rsrSimulate({cwd='.',out='output/rsr-simulation',timeout_ms=10*60_000,rebuild=false}={}){
  const packageCwd='packages/world/reality-simulation-runtime';
  const cli='dist/packages/simulation-cli/src/cli.js';
  const cliPath=resolveWorkspacePath(this.workspaceRoot,`${packageCwd}/${cli}`,{allowMissing:true,secretCheck:false});
  if(rebuild||!fs.existsSync(cliPath))await this.runProcess({executable:'npm',args:['run','build'],cwd:packageCwd,timeout_ms});
  const outputPath=resolveWorkspacePath(this.workspaceRoot,out,{allowMissing:true});fs.mkdirSync(path.dirname(outputPath),{recursive:true});
  const result=await this.runProcess({executable:'node',args:[cli,'demo',outputPath],cwd:packageCwd,timeout_ms});
  const artifact=fs.existsSync(outputPath)?{path:normalizeRelative(out),type:fs.statSync(outputPath).isDirectory()?'directory':'file'}:null;
  return{...result,artifact};
 }
 async vsrRender({scene='packages/world/visual-state-runtime/examples/hello-title.vsr.json',time=1.5,out='output/vsr-render.png',cwd='.',timeout_ms=10*60_000,rebuild=false}={}){
  const packageCwd='packages/world/visual-state-runtime';
  const cli='dist/packages/cli/src/cli.js';
  const cliPath=resolveWorkspacePath(this.workspaceRoot,`${packageCwd}/${cli}`,{allowMissing:true,secretCheck:false});
  if(rebuild||!fs.existsSync(cliPath))await this.runProcess({executable:'npm',args:['run','build'],cwd:packageCwd,timeout_ms});
  const outputPath=resolveWorkspacePath(this.workspaceRoot,out,{allowMissing:true});fs.mkdirSync(path.dirname(outputPath),{recursive:true});
  const scenePath=resolveWorkspacePath(this.workspaceRoot,scene);
  const result=await this.runProcess({executable:'node',args:[cli,'render-frame',scenePath,'--time',String(time),'--out',outputPath],cwd:packageCwd,timeout_ms});
  const artifact=fs.existsSync(outputPath)?{path:normalizeRelative(out),size:fs.statSync(outputPath).size,sha256:sha256(fs.readFileSync(outputPath))}:null;
  return{...result,artifact};
 }
 async engineeringWorkflow({branch,changes=[],test_profiles=[],commit_message,push=false,create_pr=false,pr={},deploy=false,deployment={},allow_dirty=false,rollback_on_failure=true}={}){
  const startedAt=new Date().toISOString();
  const workflowId=`workflow-${randomUUID()}`;
  const before=await this.gitStatus({});
  if(before.stdout.trim()&&!allow_dirty)throw runtimeError('WORKSPACE_DIRTY','Engineering workflow requires a clean Git workspace unless allow_dirty=true.',{status:before.stdout});
  const originalBranch=(await this.runProcess({executable:'git',args:['branch','--show-current']})).stdout.trim();
  const originalHead=(await this.runProcess({executable:'git',args:['rev-parse','HEAD']})).stdout.trim();
  let branchCreated=false;
  const applied=[],tests=[];
  try{
   if(branch){await this.gitCreateBranch({branch});branchCreated=true;}
   for(const change of changes){if(change.replacements)applied.push(await this.applyPatch(change));else applied.push(await this.writeFile(change));}
   for(const profile of test_profiles)tests.push({profile,result:await this.runBuild({profile})});
   const diff=await this.gitDiff({});
   let commit=null,pushed=null,pull_request=null,deployment_result=null;
   if(commit_message)commit=await this.gitCommit({message:commit_message,paths:changes.map(item=>item.path)});
   if(push){if(!branch)throw runtimeError('WORKFLOW_BRANCH_REQUIRED','push requires a branch.');pushed=await this.gitPush({branch});}
   if(create_pr){if(!branch)throw runtimeError('WORKFLOW_BRANCH_REQUIRED','create_pr requires a branch.');pull_request=await this.githubCreatePullRequest({head:branch,base:pr.base??'main',title:pr.title??commit_message??branch,body:pr.body??'',draft:Boolean(pr.draft)});}
   if(deploy)deployment_result=await this.vercelDeploy({...deployment,ref:deployment.ref??branch??'main'});
   const receipt={format:'taowind.engineering-workflow-receipt.v0.1',workflow_id:workflowId,started_at:startedAt,completed_at:new Date().toISOString(),before,original_branch:originalBranch,original_head:originalHead,branch:branch??null,applied,tests,diff,commit,pushed,pull_request,deployment:deployment_result,status:'completed',rollback_performed:false};
   fs.writeFileSync(path.join(this.receiptDir,`${receipt.workflow_id}.json`),JSON.stringify(receipt,null,2)+'\n');
   return receipt;
  }catch(error){
   let rollback={performed:false,errors:[]};
   if(rollback_on_failure){
    rollback.performed=true;
    try{await this.runProcess({executable:'git',args:['reset','--hard',originalHead],allow_failure:false});}catch(item){rollback.errors.push(item.message);}
    const paths=changes.map(item=>item.path).filter(Boolean);
    if(paths.length)try{await this.runProcess({executable:'git',args:['clean','-fd','--',...paths],allow_failure:false});}catch(item){rollback.errors.push(item.message);}
    if(branchCreated&&originalBranch){
     try{await this.runProcess({executable:'git',args:['switch',originalBranch],allow_failure:false});}catch(item){rollback.errors.push(item.message);}
     try{await this.runProcess({executable:'git',args:['branch','-D',branch],allow_failure:false});}catch(item){rollback.errors.push(item.message);}
    }
   }
   const receipt={format:'taowind.engineering-workflow-receipt.v0.1',workflow_id:workflowId,started_at:startedAt,completed_at:new Date().toISOString(),before,original_branch:originalBranch,original_head:originalHead,branch:branch??null,applied,tests,status:'failed',error:{code:error.code??'WORKFLOW_FAILED',message:error.message},rollback_performed:rollback.performed,rollback_errors:rollback.errors};
   fs.writeFileSync(path.join(this.receiptDir,`${receipt.workflow_id}.json`),JSON.stringify(receipt,null,2)+'\n');
   throw runtimeError(error.code??'WORKFLOW_FAILED',error.message,{...error.details,workflow_receipt:receipt});
  }
 }
}

export class RemoteDeveloperExecutionRuntime{
 constructor({url,token,timeoutMs=30*60_000}={}){this.url=String(url??'').replace(/\/$/,'');this.token=String(token??'');this.timeoutMs=timeoutMs;if(!this.url)throw runtimeError('EXECUTION_WORKER_URL_REQUIRED','Remote execution provider requires a worker URL.');if(this.token.length<24)throw runtimeError('EXECUTION_WORKER_TOKEN_REQUIRED','Remote execution provider requires a token of at least 24 characters.');}
 async invoke(action,payload={},options={}){
  const controller=new AbortController();const timeoutMs=Math.max(100,Math.min(Number(options.timeoutMs??this.timeoutMs)||this.timeoutMs,30*60_000));const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{const response=await fetch(`${this.url}/v1/invoke`,{method:'POST',headers:{authorization:`Bearer ${this.token}`,'content-type':'application/json'},body:JSON.stringify({action,payload}),signal:controller.signal});const body=await readJsonResponse(response);return body.result;}finally{clearTimeout(timer);}
 }
 status(){return this.invoke('status',{});}
}

export function createDeveloperExecutionRuntime(env=process.env,overrides={}){
 const provider=String(overrides.provider??env.TAOWIND_EXECUTION_PROVIDER??(env.TAOWIND_EXECUTION_WORKER_URL?'remote':'local')).toLowerCase();
 if(provider==='remote')return new RemoteDeveloperExecutionRuntime({url:overrides.workerUrl??env.TAOWIND_EXECUTION_WORKER_URL,token:overrides.workerToken??env.TAOWIND_EXECUTION_WORKER_TOKEN,timeoutMs:Number(overrides.timeoutMs??env.TAOWIND_EXECUTION_REMOTE_TIMEOUT_MS??30*60_000)});
 if(provider!=='local')throw runtimeError('EXECUTION_PROVIDER_INVALID',`Unsupported execution provider: ${provider}`);
 return new DeveloperExecutionRuntime({...overrides,workspaceRoot:overrides.workspaceRoot??env.TAOWIND_EXECUTION_WORKSPACE_ROOT,mode:overrides.mode??env.TAOWIND_EXECUTION_MODE,enableShell:overrides.enableShell??['1','true','yes','on'].includes(String(env.TAOWIND_EXECUTION_ENABLE_SHELL??'').toLowerCase()),githubToken:overrides.githubToken??env.TAOWIND_GITHUB_TOKEN,githubOwner:overrides.githubOwner??env.TAOWIND_GITHUB_OWNER,githubRepo:overrides.githubRepo??env.TAOWIND_GITHUB_REPO,vercelToken:overrides.vercelToken??env.TAOWIND_VERCEL_TOKEN,vercelProjectId:overrides.vercelProjectId??env.TAOWIND_VERCEL_PROJECT_ID,vercelTeamId:overrides.vercelTeamId??env.TAOWIND_VERCEL_TEAM_ID,vercelDeployHook:overrides.vercelDeployHook??env.TAOWIND_VERCEL_DEPLOY_HOOK});
}

export function verifyWorkerToken(header,expected){const [scheme,token]=String(header??'').split(/\s+/,2);return scheme?.toLowerCase()==='bearer'&&token&&expected&&constantTimeEqual(token,expected);}
