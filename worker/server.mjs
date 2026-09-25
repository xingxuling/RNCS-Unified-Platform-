import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash, randomBytes, randomUUID, timingSafeEqual} from 'node:crypto';

const VERSION = '0.3.0-alpha.1';
const HOST = process.env.TAOWIND_EXECUTION_WORKER_HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || process.env.TAOWIND_EXECUTION_WORKER_PORT || 8790);
const TOKEN = String(process.env.TAOWIND_EXECUTION_WORKER_TOKEN || '');
const ROOT = path.resolve(process.env.TAOWIND_EXECUTION_WORKSPACE_ROOT || '/workspace');
const RECEIPTS = path.resolve(process.env.TAOWIND_EXECUTION_RECEIPT_DIR || '/var/lib/taowind/receipts');
const ARTIFACTS = path.resolve(process.env.TAOWIND_EXECUTION_ARTIFACT_DIR || '/var/lib/taowind/artifacts');
const MAX_BODY = Math.min(Math.max(Number(process.env.TAOWIND_EXECUTION_MAX_REQUEST_BYTES || 16_777_216), 102_400), 67_108_864);
const MAX_OUTPUT = Math.min(Math.max(Number(process.env.TAOWIND_EXECUTION_MAX_OUTPUT_BYTES || 1_000_000), 16_384), 16_777_216);
const DEFAULT_TIMEOUT = Math.min(Math.max(Number(process.env.TAOWIND_EXECUTION_TIMEOUT_MS || 120_000), 1_000), 1_800_000);
const MAX_CONCURRENCY = Math.min(Math.max(Number(process.env.TAOWIND_EXECUTION_MAX_CONCURRENCY || 2), 1), 8);
const ALLOWED = new Set(String(process.env.TAOWIND_EXECUTION_ALLOWED_EXECUTABLES || 'node,npm,npx,python,python3,git,java,javac,gradle,./gradlew,zip,unzip').split(',').map(v => v.trim()).filter(Boolean));
const SECRET_NAMES = new Set(['.env','.npmrc','.pypirc','.git-credentials','credentials','credentials.json','id_rsa','id_ed25519']);
const SECRET_EXTS = new Set(['.pem','.key','.p12','.pfx','.jks','.keystore']);
const SENSITIVE_ENV = /(TOKEN|SECRET|PASSWORD|PRIVATE|CREDENTIAL|AUTH|COOKIE|SESSION|KEY)/i;
const CHILD_ENV_ALLOW = new Set(['PATH','HOME','USER','USERNAME','SHELL','TMP','TEMP','TMPDIR','LANG','LC_ALL','CI','TERM','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','JAVA_HOME','ANDROID_HOME','ANDROID_SDK_ROOT','GRADLE_HOME']);
const PROFILES = Object.freeze({
  'node-test': ['npm',['test']],
  'node-build': ['npm',['run','build']],
  'python-test': ['python3',['-m','pytest']],
  'gradle-test': ['./gradlew',['test']],
  'android-debug': ['./gradlew',['assembleDebug']],
  'android-release': ['./gradlew',['assembleRelease']],
  'rncs-test': ['npm',['test']],
  'rncs-mcp-test': ['npm',['run','test:mcp']],
  'rsr-test': ['npm',['test','--workspace','@taowind/reality-simulation-runtime']],
  'vsr-test': ['npm',['test','--workspace','@taowind/visual-state-runtime']]
});

if (TOKEN.length < 24) throw new Error('TAOWIND_EXECUTION_WORKER_TOKEN must be at least 24 characters.');
for (const dir of [ROOT, RECEIPTS, ARTIFACTS]) fs.mkdirSync(dir, {recursive:true});

let active = 0;
const queue = [];
const acquire = () => new Promise(resolve => {
  if (active < MAX_CONCURRENCY) { active += 1; resolve(); }
  else queue.push(resolve);
});
const release = () => {
  active -= 1;
  const next = queue.shift();
  if (next) { active += 1; next(); }
};
const sha256 = value => createHash('sha256').update(value).digest('hex');
const err = (code, message, details) => Object.assign(new Error(message), {code, details});
const normalize = value => String(value ?? '.').replaceAll('\\','/');
const within = (root, target) => target === root || target.startsWith(`${root}${path.sep}`);
const safeEqual = (a,b) => { const x=Buffer.from(String(a)), y=Buffer.from(String(b)); return x.length===y.length && timingSafeEqual(x,y); };
const send = (res,status,body) => { const payload=JSON.stringify(body); res.writeHead(status, {'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(payload),'cache-control':'no-store'}); res.end(payload); };

function assertNonSecret(relative) {
  const n = normalize(relative).toLowerCase();
  const base = path.posix.basename(n);
  if (base.endsWith('.example') || base.endsWith('.sample') || base.endsWith('.template')) return;
  if (SECRET_NAMES.has(base) || SECRET_EXTS.has(path.posix.extname(base)) || ['service-account','service_account','signing-key','signing_key','private-key','private_key'].some(v=>base.includes(v))) throw err('SECRET_PATH_DENIED',`Secret-bearing path denied: ${relative}`);
}
function resolvePath(relative='.', {missing=false, secret=true}={}) {
  const rel = normalize(relative);
  if (rel.includes('\0') || path.isAbsolute(rel) || rel.split('/').includes('..')) throw err('WORKSPACE_PATH_ESCAPE',`Path escapes workspace: ${relative}`);
  if (secret) assertNonSecret(rel);
  const target = path.resolve(ROOT, rel);
  if (!within(ROOT,target)) throw err('WORKSPACE_PATH_ESCAPE',`Path escapes workspace: ${relative}`);
  let probe=target;
  while (!fs.existsSync(probe)) { const parent=path.dirname(probe); if(parent===probe) break; probe=parent; }
  const realRoot=fs.realpathSync(ROOT), realProbe=fs.realpathSync(probe);
  if (!within(realRoot,realProbe)) throw err('WORKSPACE_SYMLINK_ESCAPE',`Symlink escapes workspace: ${relative}`);
  if (fs.existsSync(target)) { const realTarget=fs.realpathSync(target); if(!within(realRoot,realTarget)) throw err('WORKSPACE_SYMLINK_ESCAPE',`Symlink escapes workspace: ${relative}`); }
  else if (!missing) throw err('WORKSPACE_PATH_NOT_FOUND',`Path not found: ${relative}`);
  return target;
}
function body(req) {
  return new Promise((resolve,reject)=>{
    const parts=[]; let size=0;
    req.on('data',chunk=>{ size+=chunk.length; if(size>MAX_BODY){ reject(err('REQUEST_TOO_LARGE','Request body exceeds configured limit.')); req.destroy(); return; } parts.push(chunk); });
    req.on('end',()=>{ try { const raw=Buffer.concat(parts).toString('utf8'); resolve(raw?JSON.parse(raw):{}); } catch { reject(err('INVALID_JSON','Invalid JSON body.')); } });
    req.on('error',reject);
  });
}
function authorized(req) {
  const [scheme,value] = String(req.headers.authorization || '').split(/\s+/,2);
  return scheme?.toLowerCase()==='bearer' && value && safeEqual(value,TOKEN);
}
function receipt(action, started, status, detail={}) {
  const item={format:'taowind.execution-receipt.v0.3',receipt_id:`exec-${randomUUID()}`,action,status,started_at:new Date(started).toISOString(),completed_at:new Date().toISOString(),...detail};
  fs.writeFileSync(path.join(RECEIPTS,`${item.receipt_id}.json`),JSON.stringify(item,null,2)+'\n',{mode:0o600});
  return item;
}
function childEnv(extra={}) {
  const output={};
  for(const [k,v] of Object.entries(process.env)) if(CHILD_ENV_ALLOW.has(k) && !SENSITIVE_ENV.test(k)) output[k]=v;
  for(const [k,v] of Object.entries(extra)) { if(SENSITIVE_ENV.test(k)) throw err('PROCESS_ENV_DENIED',`Sensitive child environment key denied: ${k}`); output[k]=String(v); }
  return output;
}
async function run({executable,args=[],cwd='.',timeout_ms=DEFAULT_TIMEOUT,env={},stdin,allow_failure=false,internal_env}={}) {
  if(!ALLOWED.has(executable)) throw err('EXECUTABLE_DENIED',`Executable is not allow-listed: ${executable}`);
  if(!Array.isArray(args) || args.some(v=>typeof v!=='string')) throw err('PROCESS_ARGS_INVALID','args must be an array of strings.');
  const absolute=resolvePath(cwd,{secret:false});
  const timeout=Math.min(Math.max(Number(timeout_ms)||DEFAULT_TIMEOUT,100),1_800_000);
  const started=Date.now(); let stdout='',stderr='',truncated=false,timedOut=false;
  const result=await new Promise((resolve,reject)=>{
    const proc=spawn(executable,args,{cwd:absolute,env:internal_env || childEnv(env),shell:false,windowsHide:true});
    const append=(kind,chunk)=>{ const text=chunk.toString(); const current=stdout.length+stderr.length; if(current>=MAX_OUTPUT){truncated=true;return;} const keep=text.slice(0,MAX_OUTPUT-current); if(keep.length<text.length)truncated=true; if(kind==='stdout')stdout+=keep;else stderr+=keep; };
    proc.stdout.on('data',c=>append('stdout',c)); proc.stderr.on('data',c=>append('stderr',c)); proc.on('error',reject);
    if(typeof stdin==='string'){proc.stdin.end(stdin);} else proc.stdin.end();
    const timer=setTimeout(()=>{timedOut=true;proc.kill('SIGTERM');setTimeout(()=>proc.kill('SIGKILL'),2000).unref();},timeout);
    proc.on('close',(code,signal)=>{clearTimeout(timer);resolve({executable,args,cwd:normalize(cwd),exit_code:code,signal,stdout,stderr,truncated,timed_out:timedOut,duration_ms:Date.now()-started});});
  });
  if((result.exit_code!==0||timedOut)&&!allow_failure) throw err(timedOut?'PROCESS_TIMEOUT':'PROCESS_EXIT_NONZERO',`${executable} exited with code ${result.exit_code}.`,result);
  return result;
}
async function git(args,cwd='.',options={}) { return run({executable:'git',args,cwd,...options}); }
async function head(cwd='.') { return (await git(['rev-parse','HEAD'],cwd)).stdout.trim(); }
async function branch(cwd='.') { return (await git(['branch','--show-current'],cwd)).stdout.trim(); }
async function cleanStatus(cwd='.') { return (await git(['status','--short'],cwd)).stdout.trim(); }

async function prepare(p={}) {
  const directory=normalize(p.directory || 'rncs');
  const target=resolvePath(directory,{missing:true,secret:false});
  const repo=String(p.repo_url || process.env.TAOWIND_GITHUB_REPOSITORY_URL || 'https://github.com/xingxuling/RNCS-Unified-Platform-.git');
  const ref=String(p.ref || process.env.TAOWIND_GITHUB_BRANCH || 'feat/taowind-founder-execution-plane-v0.14');
  if(!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(repo)) throw err('REPOSITORY_URL_DENIED','Only HTTPS GitHub repository URLs are allowed.');
  if(fs.existsSync(path.join(target,'.git'))){
    if(p.clean){await git(['reset','--hard','HEAD'],directory);await git(['clean','-fd'],directory);}
    await git(['fetch','--all','--prune'],directory,{timeout_ms:600000});
    await git(['checkout',ref],directory,{timeout_ms:600000});
    await git(['reset','--hard',`origin/${ref}`],directory,{timeout_ms:600000,allow_failure:true});
  } else {
    if(fs.existsSync(target) && fs.readdirSync(target).length) throw err('WORKSPACE_NOT_EMPTY',`Workspace directory is not empty: ${directory}`);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    const token=String(process.env.TAOWIND_GITHUB_TOKEN || '');
    let askpassDir, internalEnv;
    if(token){
      askpassDir=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-askpass-'));
      const askpass=path.join(askpassDir,'askpass.sh');
      fs.writeFileSync(askpass,'#!/bin/sh\ncase "$1" in *Username*) printf "%s" "x-access-token";; *) printf "%s" "$TAOWIND_GITHUB_TOKEN";; esac\n',{mode:0o700});
      internalEnv={...childEnv(),GIT_ASKPASS:askpass,GIT_TERMINAL_PROMPT:'0',TAOWIND_GITHUB_TOKEN:token};
    }
    try { await run({executable:'git',args:['clone','--branch',ref,'--single-branch',repo,directory],cwd:'.',timeout_ms:600000,internal_env:internalEnv}); }
    finally { if(askpassDir) fs.rmSync(askpassDir,{recursive:true,force:true}); }
  }
  return{status:'ready',directory,ref,head:await head(directory),clean:(await cleanStatus(directory))===''};
}
function listFiles(p={}) {
  const relative=p.path||'.', target=resolvePath(relative), max=Math.min(Math.max(Number(p.max_entries||500),1),5000), items=[];
  const walk=(absolute,base)=>{for(const entry of fs.readdirSync(absolute,{withFileTypes:true})){if(items.length>=max)return;const rel=path.posix.join(base,entry.name);try{assertNonSecret(rel);}catch{continue;}const full=path.join(absolute,entry.name),st=fs.lstatSync(full);if(st.isSymbolicLink()){items.push({path:rel,type:'symlink'});continue;}const item={path:rel,type:entry.isDirectory()?'directory':'file'};if(entry.isFile())item.size=st.size;items.push(item);if(entry.isDirectory())walk(full,rel);}};
  const st=fs.statSync(target); if(st.isDirectory())walk(target,normalize(relative)==='.'?'':normalize(relative));else items.push({path:normalize(relative),type:'file',size:st.size});
  return{count:items.length,truncated:items.length>=max,items};
}
function readFile(p={}) { const target=resolvePath(p.path),st=fs.statSync(target),max=Math.min(Number(p.max_bytes||1_000_000),16_777_216);if(!st.isFile())throw err('WORKSPACE_NOT_FILE',`Not a file: ${p.path}`);if(st.size>max)throw err('WORKSPACE_FILE_TOO_LARGE',`File exceeds max_bytes: ${p.path}`);const data=fs.readFileSync(target);return{path:normalize(p.path),size:data.length,sha256:sha256(data),encoding:p.encoding==='base64'?'base64':'utf8',content:p.encoding==='base64'?data.toString('base64'):data.toString('utf8')}; }
function writeFile(p={}) { if(typeof p.content!=='string')throw err('CONTENT_REQUIRED','content must be a string.');const target=resolvePath(p.path,{missing:true});fs.mkdirSync(path.dirname(target),{recursive:true});const data=Buffer.from(p.content,p.encoding==='base64'?'base64':'utf8'),tmp=`${target}.tmp-${randomUUID()}`;fs.writeFileSync(tmp,data,{mode:0o600});fs.renameSync(tmp,target);return{path:normalize(p.path),size:data.length,sha256:sha256(data)}; }
function patchFile(p={}) { if(!Array.isArray(p.replacements)||!p.replacements.length)throw err('PATCH_REPLACEMENTS_REQUIRED','replacements are required.');const current=readFile({path:p.path,max_bytes:16_777_216}).content;let next=current;for(const [index,item] of p.replacements.entries()){const search=String(item.search||''),replace=String(item.replace||''),count=next.split(search).length-1,expected=item.expected_occurrences??1;if(!search)throw err('PATCH_SEARCH_REQUIRED',`Replacement ${index} has empty search.`);if(count!==expected)throw err('PATCH_CONTEXT_MISMATCH',`Replacement ${index} expected ${expected}, found ${count}.`);next=item.all?next.split(search).join(replace):next.replace(search,replace);}return{...writeFile({path:p.path,content:next}),changed:next!==current}; }
async function build(p={}) { const item=PROFILES[p.profile];if(!item)throw err('BUILD_PROFILE_UNKNOWN',`Unknown profile: ${p.profile}`,{profiles:Object.keys(PROFILES)});return run({executable:item[0],args:[...item[1],...(p.extra_args||[])],cwd:p.cwd||'.',timeout_ms:p.timeout_ms||DEFAULT_TIMEOUT}); }
async function commit(p={}) { if(!String(p.message||'').trim())throw err('GIT_COMMIT_MESSAGE_REQUIRED','Commit message is required.');const cwd=p.cwd||'.';await git(['add','--',...(p.paths||['.'])],cwd);const result=await git(['commit','-m',p.message],cwd);return{...result,commit_sha:await head(cwd)}; }
async function push(p={}) { const remote=String(p.remote||'origin'),br=String(p.branch||await branch(p.cwd||'.'));if(!/^[A-Za-z0-9._-]+$/.test(remote))throw err('GIT_REMOTE_INVALID','Invalid remote.');const args=['push'];if(p.set_upstream!==false)args.push('-u');if(p.force_with_lease)args.push('--force-with-lease');args.push(remote,br);return git(args,p.cwd||'.',{timeout_ms:600000}); }
async function exportArtifact(p={}) { const source=resolvePath(p.path),st=fs.statSync(source),id=`artifact-${randomUUID()}`,filename=String(p.filename||`${path.basename(source)}${st.isDirectory()?'.zip':''}`).replace(/[^A-Za-z0-9._-]/g,'_').slice(0,180),destination=path.join(ARTIFACTS,`${id}-${filename}`);if(st.isFile())fs.copyFileSync(source,destination);else await run({executable:'zip',args:['-r','-q',destination,'.'],cwd:normalize(p.path),timeout_ms:600000});const data=fs.readFileSync(destination),downloadToken=randomBytes(32).toString('base64url');fs.writeFileSync(`${destination}.token`,sha256(downloadToken),{mode:0o600});return{export_id:id,filename,size:data.length,sha256:sha256(data),download_token:downloadToken,local_path:destination}; }
async function engineeringWorkflow(p={}) {
  const cwd=p.cwd||'rncs', originalBranch=await branch(cwd), originalHead=await head(cwd), before=await cleanStatus(cwd);if(before&&!p.allow_dirty)throw err('WORKSPACE_DIRTY','Engineering workflow requires a clean workspace.',{status:before});let created=false;const applied=[],tests=[];
  try { if(p.branch){await git(['switch','-c',p.branch],cwd);created=true;}for(const change of p.changes||[])applied.push(change.replacements?patchFile({...change,path:path.posix.join(cwd,change.path)}):writeFile({...change,path:path.posix.join(cwd,change.path)}));for(const profile of p.test_profiles||[])tests.push({profile,result:await build({profile,cwd})});const diff=await git(['diff'],cwd);let commitResult=null,pushResult=null;if(p.commit_message)commitResult=await commit({message:p.commit_message,paths:(p.changes||[]).map(v=>v.path),cwd});if(p.push)pushResult=await push({branch:p.branch,cwd});return{status:'completed',original_branch:originalBranch,original_head:originalHead,branch:p.branch||originalBranch,applied,tests,diff,commit:commitResult,push:pushResult,clean:(await cleanStatus(cwd))===''}; }
  catch(error){const rollback={performed:false,errors:[]};if(p.rollback_on_failure!==false){rollback.performed=true;try{await git(['reset','--hard',originalHead],cwd);}catch(e){rollback.errors.push(e.message);}try{await git(['clean','-fd'],cwd);}catch(e){rollback.errors.push(e.message);}if(created){try{await git(['switch',originalBranch],cwd);}catch(e){rollback.errors.push(e.message);}try{await git(['branch','-D',p.branch],cwd);}catch(e){rollback.errors.push(e.message);}}}throw err(error.code||'WORKFLOW_FAILED',error.message,{...(error.details||{}),rollback,original_branch:originalBranch,original_head:originalHead,current_head:await head(cwd).catch(()=>null),current_branch:await branch(cwd).catch(()=>null),clean:(await cleanStatus(cwd).catch(()=>''))===''});}
}

const directRoutes=new Map([
  ['/v1/workspaces/prepare','prepareWorkspace'],['/v1/files/list','listFiles'],['/v1/files/read','readFile'],['/v1/files/write','writeFile'],['/v1/files/patch','applyPatch'],
  ['/v1/git/status','gitStatus'],['/v1/git/diff','gitDiff'],['/v1/git/branch','gitCreateBranch'],['/v1/git/commit','gitCommit'],['/v1/git/push','gitPush'],
  ['/v1/process/run','runCommand'],['/v1/tests/run','runBuild'],['/v1/build/run','runBuild'],['/v1/artifacts/export','exportArtifact']
]);
async function invoke(action,p={}) {
  switch(action){
    case 'status': case 'health': return{status:'ready',version:VERSION,workspace_root:ROOT,max_concurrency:MAX_CONCURRENCY,active,queued:queue.length,allowed_executables:[...ALLOWED].sort(),profiles:Object.keys(PROFILES),github_token_configured:Boolean(process.env.TAOWIND_GITHUB_TOKEN),persistent_volume_guaranteed:false};
    case 'prepareWorkspace': return prepare(p);
    case 'listFiles': return listFiles(p);
    case 'readFile': return readFile(p);
    case 'writeFile': return writeFile(p);
    case 'applyPatch': return patchFile(p);
    case 'runCommand': return run(p);
    case 'runBuild': return build(p);
    case 'gitStatus': return git(['status','--short'],p.cwd||'.');
    case 'gitDiff': return git(['diff',...(p.staged?['--cached']:[])],p.cwd||'.');
    case 'gitCreateBranch': if(!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,199}$/.test(String(p.branch||''))||String(p.branch).includes('..'))throw err('GIT_BRANCH_INVALID','Invalid branch name.');return git(['switch','-c',p.branch,...(p.start_point?[p.start_point]:[])],p.cwd||'.');
    case 'gitCommit': return commit(p);
    case 'gitPush': return push(p);
    case 'exportArtifact': return exportArtifact(p);
    case 'engineeringWorkflow': return engineeringWorkflow(p);
    default: throw err('EXECUTION_ACTION_UNSUPPORTED',`Unsupported action: ${action}`);
  }
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(url.pathname==='/healthz'&&req.method==='GET')return send(res,200,{status:'ready',service:'taowind-execution-worker',version:VERSION,execution:await invoke('status')});
  const artifact=url.pathname.match(/^\/v1\/artifacts\/([^/]+)$/);
  if(artifact&&req.method==='GET'){
    const prefix=`artifact-${artifact[1].replace(/^artifact-/,'')}-`,name=fs.readdirSync(ARTIFACTS).find(v=>v.startsWith(prefix)&&!v.endsWith('.token'));if(!name)return send(res,404,{error:{code:'ARTIFACT_NOT_FOUND',message:'Artifact not found.'}});const file=path.join(ARTIFACTS,name),tokenFile=`${file}.token`,provided=url.searchParams.get('token')||'';if(!fs.existsSync(tokenFile)||!safeEqual(fs.readFileSync(tokenFile,'utf8'),sha256(provided)))return send(res,404,{error:{code:'ARTIFACT_NOT_FOUND',message:'Artifact not found.'}});const st=fs.statSync(file);res.writeHead(200,{'content-type':'application/octet-stream','content-length':st.size,'content-disposition':`attachment; filename="${name.slice(prefix.length).replace(/["\\\r\n]/g,'_')}"`,'x-content-sha256':sha256(fs.readFileSync(file))});return fs.createReadStream(file).pipe(res);
  }
  if(req.method!=='POST')return send(res,404,{error:{code:'NOT_FOUND',message:'Not found.'}});
  if(!authorized(req))return send(res,401,{error:{code:'UNAUTHORIZED',message:'Invalid worker token.'}});
  await acquire();const started=Date.now();let action='unknown';
  try { const payload=await body(req);if(url.pathname==='/v1/invoke'){action=payload.action;const result=await invoke(action,payload.payload||{});const rec=receipt(action,started,'completed',{result_summary:{type:typeof result}});return send(res,200,{ok:true,result,execution_receipt:rec});}action=directRoutes.get(url.pathname);if(!action)return send(res,404,{error:{code:'NOT_FOUND',message:'Not found.'}});let input=payload;if(url.pathname==='/v1/tests/run'&&!input.profile)input={...input,profile:'node-test'};const result=await invoke(action,input);if(action==='exportArtifact'&&result.download_token){const proto=req.headers['x-forwarded-proto']||'https',host=req.headers['x-forwarded-host']||req.headers.host;result.download_url=`${proto}://${host}/v1/artifacts/${encodeURIComponent(result.export_id)}?token=${encodeURIComponent(result.download_token)}`;delete result.download_token;delete result.local_path;}const rec=receipt(action,started,'completed',{result_summary:{type:typeof result}});return send(res,200,{ok:true,result,execution_receipt:rec}); }
  catch(error){const rec=receipt(action,started,'failed',{error:{code:error.code||'EXECUTION_ERROR',message:error.message},details:error.details});return send(res,400,{ok:false,error:{code:error.code||'EXECUTION_ERROR',message:error.message,details:error.details},execution_receipt:rec});}
  finally{release();}
});
server.listen(PORT,HOST,()=>console.log(JSON.stringify({event:'worker.ready',service:'taowind-execution-worker',version:VERSION,host:HOST,port:PORT,workspace_root:ROOT,max_concurrency:MAX_CONCURRENCY})));
