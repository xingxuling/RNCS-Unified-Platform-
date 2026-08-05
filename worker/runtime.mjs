import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';

const DEFAULT_EXECUTABLES=['node','npm','npx','python','python3','git','java','javac','gradle','./gradlew','zip','unzip'];
const SECRET_BASENAMES=new Set(['.env','.npmrc','.pypirc','.git-credentials','credentials','credentials.json','id_rsa','id_ed25519']);
const SECRET_EXTENSIONS=new Set(['.pem','.key','.p12','.pfx','.jks','.keystore']);
const SECRET_FRAGMENTS=['service-account','service_account','signing-key','signing_key','private-key','private_key'];
const SENSITIVE_ENV_PATTERN=/(TOKEN|SECRET|PASSWORD|PRIVATE|CREDENTIAL|AUTH|COOKIE|SESSION|KEY)/i;
const CHILD_ENV_ALLOWLIST=new Set(['PATH','HOME','USER','USERNAME','SHELL','TMP','TEMP','TMPDIR','LANG','LC_ALL','CI','TERM','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','JAVA_HOME','ANDROID_HOME','ANDROID_SDK_ROOT','GRADLE_HOME']);
const PROFILE_COMMANDS=Object.freeze({
 'node-test':{executable:'npm',args:['test']},'node-build':{executable:'npm',args:['run','build']},'python-test':{executable:'python3',args:['-m','pytest']},
 'gradle-test':{executable:'./gradlew',args:['test']},'android-debug':{executable:'./gradlew',args:['assembleDebug']},'android-release':{executable:'./gradlew',args:['assembleRelease']},
 'rncs-mcp-test':{executable:'npm',args:['run','test:mcp']},'rncs-test':{executable:'npm',args:['test']},
 'rsr-test':{executable:'npm',args:['test','--workspace','@taowind/reality-simulation-runtime']},'rsr-simulate':{executable:'npm',args:['run','demo:simulation','--workspace','@taowind/reality-simulation-runtime']},
 'vsr-test':{executable:'npm',args:['test','--workspace','@taowind/visual-state-runtime']},'vsr-render-demo':{executable:'npm',args:['run','demo','--workspace','@taowind/visual-state-runtime']}
});

export const VERSION='0.3.0-alpha.2';
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export const workerError=(code,message,details)=>Object.assign(new Error(message),{code,details});
const normalizeRelative=value=>String(value??'.').replaceAll('\\','/');
const isWithin=(root,target)=>target===root||target.startsWith(`${root}${path.sep}`);
const constantTimeEqual=(left,right)=>{const a=Buffer.from(String(left)),b=Buffer.from(String(right));return a.length===b.length&&timingSafeEqual(a,b);};
export const verifyBearer=(header,expected)=>{const [scheme,token]=String(header??'').split(/\s+/,2);return scheme?.toLowerCase()==='bearer'&&token&&expected&&constantTimeEqual(token,expected);};

function assertNonSecret(relativePath){
 const normalized=normalizeRelative(relativePath).toLowerCase(),base=path.posix.basename(normalized);
 if(base.endsWith('.example')||base.endsWith('.sample')||base.endsWith('.template'))return;
 if(SECRET_BASENAMES.has(base)||SECRET_EXTENSIONS.has(path.posix.extname(base))||SECRET_FRAGMENTS.some(fragment=>base.includes(fragment)))throw workerError('SECRET_PATH_DENIED',`Secret-bearing path is not available: ${relativePath}`);
}
function resolveWorkspacePath(root,relativePath,{allowMissing=false,secretCheck=true}={}){
 const relative=normalizeRelative(relativePath);
 if(relative.includes('\0')||path.isAbsolute(relative)||relative.split('/').includes('..'))throw workerError('WORKSPACE_PATH_ESCAPE',`Path escapes workspace: ${relativePath}`);
 if(secretCheck)assertNonSecret(relative);
 const target=path.resolve(root,relative);if(!isWithin(root,target))throw workerError('WORKSPACE_PATH_ESCAPE',`Path escapes workspace: ${relativePath}`);
 let probe=target;while(!fs.existsSync(probe)){const parent=path.dirname(probe);if(parent===probe)break;probe=parent;}
 const realRoot=fs.realpathSync(root),realProbe=fs.realpathSync(probe);if(!isWithin(realRoot,realProbe))throw workerError('WORKSPACE_SYMLINK_ESCAPE',`Symlink escapes workspace: ${relativePath}`);
 if(fs.existsSync(target)){const realTarget=fs.realpathSync(target);if(!isWithin(realRoot,realTarget))throw workerError('WORKSPACE_SYMLINK_ESCAPE',`Symlink escapes workspace: ${relativePath}`);}else if(!allowMissing)throw workerError('WORKSPACE_PATH_NOT_FOUND',`Path does not exist: ${relativePath}`);
 return target;
}
function safeChildEnv(extra={}){
 const output={};for(const [key,value] of Object.entries(process.env))if(CHILD_ENV_ALLOWLIST.has(key)&&!SENSITIVE_ENV_PATTERN.test(key))output[key]=value;
 for(const [key,value] of Object.entries(extra)){if(SENSITIVE_ENV_PATTERN.test(key))throw workerError('PROCESS_ENV_DENIED',`Sensitive child environment key denied: ${key}`);output[key]=String(value);}return output;
}

export class ExecutionWorkerRuntime{
 constructor(options={}){
  this.workspaceRoot=path.resolve(options.workspaceRoot??process.env.TAOWIND_EXECUTION_WORKSPACE_ROOT??'/workspace');
  this.receiptDir=path.resolve(options.receiptDir??process.env.TAOWIND_EXECUTION_RECEIPT_DIR??'/var/lib/taowind/receipts');
  this.artifactDir=path.resolve(options.artifactDir??process.env.TAOWIND_EXECUTION_ARTIFACT_DIR??'/var/lib/taowind/artifacts');
  this.mode=String(options.mode??process.env.TAOWIND_EXECUTION_MODE??'founder').toLowerCase();
  this.allowedExecutables=new Set(options.allowedExecutables??String(process.env.TAOWIND_EXECUTION_ALLOWED_EXECUTABLES??DEFAULT_EXECUTABLES.join(',')).split(',').map(item=>item.trim()).filter(Boolean));
  this.defaultTimeoutMs=Math.min(Math.max(Number(options.defaultTimeoutMs??process.env.TAOWIND_EXECUTION_TIMEOUT_MS??120_000),1000),1_800_000);
  this.maxOutputBytes=Math.min(Math.max(Number(options.maxOutputBytes??process.env.TAOWIND_EXECUTION_MAX_OUTPUT_BYTES??1_000_000),16_384),16_777_216);
  this.githubToken=String(options.githubToken??process.env.TAOWIND_GITHUB_TOKEN??'');
  this.githubRepositoryUrl=String(options.githubRepositoryUrl??process.env.TAOWIND_GITHUB_REPOSITORY_URL??'https://github.com/xingxuling/RNCS-Unified-Platform-.git');
  this.defaultRef=String(options.defaultRef??process.env.TAOWIND_GITHUB_BRANCH??'feat/taowind-founder-execution-plane-v0.14');
  this.exports=new Map();
  for(const dir of [this.workspaceRoot,this.receiptDir,this.artifactDir])fs.mkdirSync(dir,{recursive:true});
 }
 status(){return{status:'ready',version:VERSION,provider:'manufact',mode:this.mode,workspace_root:this.workspaceRoot,persistent_volume_guaranteed:false,allowed_executables:[...this.allowedExecutables].sort(),profiles:Object.keys(PROFILE_COMMANDS),github_token_configured:Boolean(this.githubToken)};}
 resolve(relative='.',options={}){return resolveWorkspacePath(this.workspaceRoot,relative,options);}
 async runProcess({executable,args=[],cwd='.',timeout_ms=this.defaultTimeoutMs,env={},stdin,allow_failure=false,internalEnv}={}){
  if(!this.allowedExecutables.has(executable))throw workerError('EXECUTABLE_NOT_ALLOWED',`Executable is not allow-listed: ${executable}`);
  if(!Array.isArray(args)||args.some(value=>typeof value!=='string'))throw workerError('PROCESS_ARGS_INVALID','args must be an array of strings.');
  const absolute=this.resolve(cwd,{secretCheck:false});const timeout=Math.min(Math.max(Number(timeout_ms)||this.defaultTimeoutMs,100),1_800_000);const started=Date.now();let stdout='',stderr='',truncated=false,timedOut=false;
  const result=await new Promise((resolve,reject)=>{
   const child=spawn(executable,args,{cwd:absolute,env:internalEnv??safeChildEnv(env),shell:false,windowsHide:true});
   const append=(stream,chunk)=>{const text=chunk.toString(),current=stdout.length+stderr.length;if(current>=this.maxOutputBytes){truncated=true;return;}const kept=text.slice(0,this.maxOutputBytes-current);if(kept.length<text.length)truncated=true;if(stream==='stdout')stdout+=kept;else stderr+=kept;};
   child.stdout.on('data',chunk=>append('stdout',chunk));child.stderr.on('data',chunk=>append('stderr',chunk));child.on('error',reject);if(typeof stdin==='string')child.stdin.end(stdin);else child.stdin.end();
   const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');setTimeout(()=>child.kill('SIGKILL'),2000).unref();},timeout);
   child.on('close',(exitCode,signal)=>{clearTimeout(timer);resolve({executable,args,cwd:normalizeRelative(cwd),exit_code:exitCode,signal,stdout,stderr,truncated,timed_out:timedOut,duration_ms:Date.now()-started});});
  });
  if((result.exit_code!==0||timedOut)&&!allow_failure)throw workerError(timedOut?'PROCESS_TIMEOUT':'PROCESS_EXIT_NONZERO',`${executable} exited with code ${result.exit_code}.`,result);return result;
 }
 async withGitCredentials(callback){
  if(!this.githubToken)return callback(undefined);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-git-auth-')),askpass=path.join(dir,'askpass.sh');
  fs.writeFileSync(askpass,'#!/bin/sh\ncase "$1" in *Username*) printf "%s" "x-access-token";; *) printf "%s" "$TAOWIND_GITHUB_TOKEN";; esac\n',{mode:0o700});
  const env={...safeChildEnv(),GIT_ASKPASS:askpass,GIT_TERMINAL_PROMPT:'0',TAOWIND_GITHUB_TOKEN:this.githubToken};
  try{return await callback(env);}finally{fs.rmSync(dir,{recursive:true,force:true});}
 }
 runGit(args,cwd='.',{authenticated=false,...options}={}){return authenticated?this.withGitCredentials(internalEnv=>this.runProcess({executable:'git',args,cwd,internalEnv,...options})):this.runProcess({executable:'git',args,cwd,...options});}
 async prepareWorkspace({directory='rncs',repo_url=this.githubRepositoryUrl,ref=this.defaultRef,clean=false}={}){
  if(!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(repo_url))throw workerError('REPOSITORY_URL_DENIED','Only HTTPS GitHub repository URLs are allowed.');
  const relative=normalizeRelative(directory),target=this.resolve(relative,{allowMissing:true,secretCheck:false});
  if(fs.existsSync(path.join(target,'.git'))){if(clean){await this.runGit(['reset','--hard','HEAD'],relative);await this.runGit(['clean','-fd'],relative);}await this.runGit(['fetch','--all','--prune'],relative,{authenticated:true,timeout_ms:600_000});await this.runGit(['checkout',ref],relative,{timeout_ms:600_000});await this.runGit(['reset','--hard',`origin/${ref}`],relative,{timeout_ms:600_000});}
  else{if(fs.existsSync(target)&&fs.readdirSync(target).length)throw workerError('WORKSPACE_NOT_EMPTY',`Workspace is not empty: ${relative}`);fs.mkdirSync(path.dirname(target),{recursive:true});await this.runGit(['clone','--branch',ref,'--single-branch',repo_url,relative],'.',{authenticated:true,timeout_ms:600_000});}
  return{status:'ready',directory:relative,ref,head:(await this.runGit(['rev-parse','HEAD'],relative)).stdout.trim(),clean:(await this.runGit(['status','--short'],relative)).stdout.trim()===''};
 }
 listFiles({path:relative='.',max_entries=500}={}){const target=this.resolve(relative),items=[];const visit=(absolute,base)=>{for(const entry of fs.readdirSync(absolute,{withFileTypes:true})){if(items.length>=max_entries)return;const rel=path.posix.join(base,entry.name);try{assertNonSecret(rel);}catch{continue;}const full=path.join(absolute,entry.name),stat=fs.lstatSync(full);if(stat.isSymbolicLink()){items.push({path:rel,type:'symlink'});continue;}const item={path:rel,type:entry.isDirectory()?'directory':'file'};if(entry.isFile())item.size=stat.size;items.push(item);if(entry.isDirectory())visit(full,rel);}};const stat=fs.statSync(target);if(stat.isDirectory())visit(target,normalizeRelative(relative)==='.'?'':normalizeRelative(relative));else items.push({path:normalizeRelative(relative),type:'file',size:stat.size});return{count:items.length,truncated:items.length>=max_entries,items};}
 readFile({path:relative,encoding='utf8',max_bytes=1_000_000}={}){const target=this.resolve(relative),stat=fs.statSync(target),limit=Math.min(Number(max_bytes),16_777_216);if(!stat.isFile())throw workerError('WORKSPACE_NOT_FILE',`Not a file: ${relative}`);if(stat.size>limit)throw workerError('WORKSPACE_FILE_TOO_LARGE',`File exceeds max_bytes: ${relative}`);const buffer=fs.readFileSync(target);return{path:normalizeRelative(relative),size:buffer.length,sha256:sha256(buffer),encoding,content:encoding==='base64'?buffer.toString('base64'):buffer.toString('utf8')};}
 writeFile({path:relative,content,encoding='utf8'}={}){if(typeof content!=='string')throw workerError('CONTENT_REQUIRED','content must be a string.');const target=this.resolve(relative,{allowMissing:true}),buffer=Buffer.from(content,encoding==='base64'?'base64':'utf8'),temp=`${target}.tmp-${randomUUID()}`;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(temp,buffer,{mode:0o600});fs.renameSync(temp,target);return{path:normalizeRelative(relative),size:buffer.length,sha256:sha256(buffer)};}
 applyPatch({path:relative,replacements=[]}={}){if(!Array.isArray(replacements)||!replacements.length)throw workerError('PATCH_REPLACEMENTS_REQUIRED','replacements are required.');const current=this.readFile({path:relative,max_bytes:16_777_216}).content;let next=current;for(const [index,item] of replacements.entries()){const search=String(item.search??''),replace=String(item.replace??''),count=search?next.split(search).length-1:0,expected=item.expected_occurrences??1;if(!search)throw workerError('PATCH_SEARCH_REQUIRED',`Replacement ${index} has empty search.`);if(count!==expected)throw workerError('PATCH_CONTEXT_MISMATCH',`Replacement ${index} expected ${expected}, found ${count}.`);next=item.all?next.split(search).join(replace):next.replace(search,replace);}return{...this.writeFile({path:relative,content:next}),changed:next!==current};}
 removePath({path:relative,recursive=false}={}){const target=this.resolve(relative);fs.rmSync(target,{recursive:Boolean(recursive),force:false});return{path:normalizeRelative(relative),removed:true};}
 runCommand(payload={}){return this.runProcess(payload);}
 runBuild({profile,cwd='.',extra_args=[],timeout_ms=this.defaultTimeoutMs}={}){const command=PROFILE_COMMANDS[profile];if(!command)throw workerError('BUILD_PROFILE_UNKNOWN',`Unknown build profile: ${profile}`,{profiles:Object.keys(PROFILE_COMMANDS)});return this.runProcess({executable:command.executable,args:[...command.args,...extra_args],cwd,timeout_ms});}
 gitStatus({cwd='.'}={}){return this.runGit(['status','--short'],cwd);}
 gitDiff({cwd='.',staged=false}={}){return this.runGit(['diff',...(staged?['--cached']:[])],cwd);}
 gitCreateBranch({branch,start_point,cwd='.'}={}){if(!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,199}$/.test(String(branch??''))||String(branch).includes('..'))throw workerError('GIT_BRANCH_INVALID','Invalid branch name.');return this.runGit(['switch','-c',branch,...(start_point?[start_point]:[])],cwd);}
 async gitCommit({message,paths=['.'],cwd='.'}={}){if(!String(message??'').trim())throw workerError('GIT_COMMIT_MESSAGE_REQUIRED','Commit message is required.');await this.runGit(['add','--',...paths],cwd);const result=await this.runGit(['commit','-m',message],cwd);return{...result,commit_sha:(await this.runGit(['rev-parse','HEAD'],cwd)).stdout.trim()};}
 async gitPush({remote='origin',branch,cwd='.',set_upstream=true,force_with_lease=false}={}){if(!/^[A-Za-z0-9._-]+$/.test(remote))throw workerError('GIT_REMOTE_INVALID','Invalid remote.');const resolved=branch??(await this.runGit(['branch','--show-current'],cwd)).stdout.trim(),args=['push'];if(set_upstream)args.push('-u');if(force_with_lease)args.push('--force-with-lease');args.push(remote,resolved);return this.runGit(args,cwd,{authenticated:true,timeout_ms:600_000});}
 async exportArtifact({path:relative,filename}={}){
  const source=this.resolve(relative),stat=fs.statSync(source),id=`artifact-${randomUUID()}`,safeName=String(filename??`${path.basename(source)}${stat.isDirectory()?'.zip':''}`).replace(/[^A-Za-z0-9._-]/g,'_').slice(0,180),destination=path.join(this.artifactDir,`${id}-${safeName}`);
  if(stat.isFile())fs.copyFileSync(source,destination);else{
   const stage=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-export-'));const copy=(src,dst,base='')=>{fs.mkdirSync(dst,{recursive:true});for(const entry of fs.readdirSync(src,{withFileTypes:true})){const rel=path.posix.join(base,entry.name);try{assertNonSecret(rel);}catch{continue;}const from=path.join(src,entry.name),to=path.join(dst,entry.name),lstat=fs.lstatSync(from);if(lstat.isSymbolicLink())continue;if(entry.isDirectory())copy(from,to,rel);else if(entry.isFile())fs.copyFileSync(from,to);}};copy(source,stage);const child=spawn('zip',['-r','-q',destination,'.'],{cwd:stage,env:safeChildEnv(),shell:false});await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(workerError('ARTIFACT_ZIP_FAILED',`zip exited ${code}`)));});fs.rmSync(stage,{recursive:true,force:true});
  }
  const buffer=fs.readFileSync(destination),downloadToken=randomBytes(32).toString('base64url');this.exports.set(id,{path:destination,token_hash:sha256(downloadToken),expires_at:Date.now()+60*60_000});return{export_id:id,filename:safeName,size:buffer.length,sha256:sha256(buffer),download_token:downloadToken};
 }
 openExport(id,token){const item=this.exports.get(id);if(!item||item.expires_at<Date.now()||!constantTimeEqual(item.token_hash,sha256(token)))throw workerError('ARTIFACT_NOT_FOUND','Artifact not found.');return item;}
 async engineeringWorkflow({cwd='.',branch,changes=[],test_profiles=[],commit_message,push=false,allow_dirty=false,rollback_on_failure=true}={}){
  const startedAt=new Date().toISOString(),workflowId=`workflow-${randomUUID()}`,before=await this.gitStatus({cwd});if(before.stdout.trim()&&!allow_dirty)throw workerError('WORKSPACE_DIRTY','Engineering workflow requires a clean Git workspace.',{status:before.stdout});
  const originalBranch=(await this.runGit(['branch','--show-current'],cwd)).stdout.trim(),originalHead=(await this.runGit(['rev-parse','HEAD'],cwd)).stdout.trim();let branchCreated=false;const applied=[],tests=[];
  try{if(branch){await this.gitCreateBranch({branch,cwd});branchCreated=true;}for(const change of changes)applied.push(change.replacements?this.applyPatch({...change,path:path.posix.join(cwd,change.path)}):this.writeFile({...change,path:path.posix.join(cwd,change.path)}));for(const profile of test_profiles)tests.push({profile,result:await this.runBuild({profile,cwd})});const diff=await this.gitDiff({cwd});let commit=null,pushed=null;if(commit_message)commit=await this.gitCommit({message:commit_message,paths:changes.map(item=>item.path),cwd});if(push)pushed=await this.gitPush({branch,cwd});const receipt={format:'taowind.engineering-workflow-receipt.v0.3',workflow_id:workflowId,started_at:startedAt,completed_at:new Date().toISOString(),original_branch:originalBranch,original_head:originalHead,branch:branch??originalBranch,applied,tests,diff,commit,pushed,status:'completed',rollback_performed:false};this.writeReceipt(receipt);return receipt;}
  catch(error){const rollback={performed:false,errors:[]};if(rollback_on_failure){rollback.performed=true;try{await this.runGit(['reset','--hard',originalHead],cwd);}catch(item){rollback.errors.push(item.message);}try{await this.runGit(['clean','-fd'],cwd);}catch(item){rollback.errors.push(item.message);}if(branchCreated&&originalBranch){try{await this.runGit(['switch',originalBranch],cwd);}catch(item){rollback.errors.push(item.message);}try{await this.runGit(['branch','-D',branch],cwd);}catch(item){rollback.errors.push(item.message);}}}const receipt={format:'taowind.engineering-workflow-receipt.v0.3',workflow_id:workflowId,started_at:startedAt,completed_at:new Date().toISOString(),original_branch:originalBranch,original_head:originalHead,branch:branch??null,applied,tests,status:'failed',error:{code:error.code??'WORKFLOW_FAILED',message:error.message},rollback_performed:rollback.performed,rollback_errors:rollback.errors};this.writeReceipt(receipt);throw workerError(error.code??'WORKFLOW_FAILED',error.message,{...(error.details??{}),workflow_receipt:receipt});}
 }
 writeReceipt(receipt){fs.writeFileSync(path.join(this.receiptDir,`${receipt.workflow_id??receipt.receipt_id}.json`),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});}
 async invoke(action,payload={}){const handlers={status:()=>this.status(),health:()=>this.status(),prepareWorkspace:()=>this.prepareWorkspace(payload),listFiles:()=>this.listFiles(payload),readFile:()=>this.readFile(payload),writeFile:()=>this.writeFile(payload),applyPatch:()=>this.applyPatch(payload),removePath:()=>this.removePath(payload),runCommand:()=>this.runCommand(payload),runBuild:()=>this.runBuild(payload),gitStatus:()=>this.gitStatus(payload),gitDiff:()=>this.gitDiff(payload),gitCreateBranch:()=>this.gitCreateBranch(payload),gitCommit:()=>this.gitCommit(payload),gitPush:()=>this.gitPush(payload),exportArtifact:()=>this.exportArtifact(payload),engineeringWorkflow:()=>this.engineeringWorkflow(payload)};const handler=handlers[action];if(!handler)throw workerError('EXECUTION_ACTION_UNSUPPORTED',`Unsupported action: ${action}`);return handler();}
}
