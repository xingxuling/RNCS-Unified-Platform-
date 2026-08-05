import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {createRemoteJWKSet,jwtVerify} from 'jose';
import {createDeveloperExecutionRuntime,verifyWorkerToken} from './runtime.mjs';

const sha256=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const send=(res,status,body)=>{const payload=JSON.stringify(body);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(payload),'cache-control':'no-store'});res.end(payload);};
const contentDisposition=filename=>`attachment; filename="${String(filename).replace(/["\\\r\n]/g,'_')}"`;

function bodyReader(limit){return req=>new Promise((resolve,reject)=>{let size=0;const chunks=[];req.on('data',chunk=>{size+=chunk.length;if(size>limit){reject(Object.assign(new Error('Request too large.'),{code:'REQUEST_TOO_LARGE'}));req.destroy();return;}chunks.push(chunk);});req.on('end',()=>{try{const raw=Buffer.concat(chunks).toString('utf8');resolve(raw?JSON.parse(raw):{});}catch{reject(Object.assign(new Error('Invalid JSON.'),{code:'INVALID_JSON'}));}});req.on('error',reject);});}

function makeAuthenticator({staticToken,issuer,audience,subject}){
 const jwks=issuer?createRemoteJWKSet(new URL('/.well-known/jwks',issuer)):null;
 return async header=>{
  const [scheme,token]=String(header??'').split(/\s+/,2);
  if(scheme?.toLowerCase()!=='bearer'||!token)return null;
  if(staticToken&&verifyWorkerToken(header,staticToken))return{kind:'static',subject:'founder-operator'};
  if(!jwks)return null;
  try{
   const result=await jwtVerify(token,jwks,{issuer,audience,subject,clockTolerance:10});
   return{kind:'vercel-oidc',subject:String(result.payload.sub??'')};
  }catch{return null;}
 };
}

const ROUTES=new Map([
 ['POST /v1/workspaces/prepare','prepareWorkspace'],
 ['POST /v1/files/list','listFiles'],
 ['POST /v1/files/read','readFile'],
 ['POST /v1/files/write','writeFile'],
 ['POST /v1/files/patch','applyPatch'],
 ['POST /v1/git/status','gitStatus'],
 ['POST /v1/git/diff','gitDiff'],
 ['POST /v1/git/branch','gitCreateBranch'],
 ['POST /v1/git/commit','gitCommit'],
 ['POST /v1/git/push','gitPush'],
 ['POST /v1/process/run','runCommand'],
 ['POST /v1/tests/run','runBuild'],
 ['POST /v1/build/run','runBuild'],
 ['POST /v1/artifacts/export','exportArtifact']
]);
const MUTATING=new Set(['prepareWorkspace','writeFile','applyPatch','gitCreateBranch','gitCommit','gitPush','runCommand','runBuild','exportArtifact','engineeringWorkflow']);

export function createExecutionWorker(options={}){
 const host=String(options.host??process.env.TAOWIND_EXECUTION_WORKER_HOST??'0.0.0.0');
 const port=Number(options.port??process.env.PORT??process.env.TAOWIND_EXECUTION_WORKER_PORT??8790);
 const staticToken=String(options.token??process.env.TAOWIND_EXECUTION_WORKER_TOKEN??'');
 const issuer=String(options.oidcIssuer??process.env.TAOWIND_VERCEL_OIDC_ISSUER??'https://oidc.vercel.com/xingxulings-projects').replace(/\/$/,'');
 const audience=String(options.oidcAudience??process.env.TAOWIND_VERCEL_OIDC_AUDIENCE??'https://vercel.com/xingxulings-projects');
 const subject=String(options.oidcSubject??process.env.TAOWIND_VERCEL_OIDC_SUBJECT??'owner:xingxulings-projects:project:taowind:environment:production');
 const publicBaseUrl=String(options.publicBaseUrl??process.env.TAOWIND_EXECUTION_WORKER_PUBLIC_BASE_URL??'').replace(/\/$/,'');
 const maxRequestBytes=Math.max(100_000,Math.min(Number(options.maxRequestBytes??process.env.TAOWIND_EXECUTION_MAX_REQUEST_BYTES??16_777_216),64*1024*1024));
 const maxConcurrency=Math.max(1,Math.min(Number(options.maxConcurrency??process.env.TAOWIND_EXECUTION_MAX_CONCURRENCY??2),16));
 if(staticToken&&staticToken.length<24)throw new Error('TAOWIND_EXECUTION_WORKER_TOKEN must contain at least 24 characters when set.');
 const authenticate=makeAuthenticator({staticToken,issuer,audience,subject});
 const runtime=options.runtime??createDeveloperExecutionRuntime(process.env,{provider:'local',workspaceRoot:options.workspaceRoot,mode:options.mode,enableShell:options.enableShell});
 const readBody=bodyReader(maxRequestBytes);
 let active=0,actualPort=port;

 async function snapshotGit(){
  if(!fs.existsSync(path.join(runtime.workspaceRoot,'.git')))return null;
  try{
   const branch=(await runtime.runProcess({executable:'git',args:['branch','--show-current'],allow_failure:true})).stdout.trim();
   const head=(await runtime.runProcess({executable:'git',args:['rev-parse','HEAD'],allow_failure:true})).stdout.trim();
   const status=(await runtime.gitStatus({})).stdout;
   return{branch,head,status,clean:!status.trim()};
  }catch{return null;}
 }
 async function rollbackGit(snapshot){
  if(!snapshot?.clean||!snapshot.head)return{performed:false,reason:'no-clean-git-snapshot'};
  const errors=[];
  try{await runtime.runProcess({executable:'git',args:['reset','--hard',snapshot.head]});}catch(error){errors.push(error.message);}
  try{await runtime.runProcess({executable:'git',args:['clean','-fd']});}catch(error){errors.push(error.message);}
  if(snapshot.branch)try{await runtime.runProcess({executable:'git',args:['switch',snapshot.branch]});}catch(error){errors.push(error.message);}
  return{performed:true,errors};
 }
 function recordReceipt({id,action,route,auth,status,started,input,result,error,rollback}){
  const receipt={format:'taowind.execution-receipt.v0.3',receipt_id:id,action,route,actor:auth?.kind??'unknown',status,duration_ms:Date.now()-started,input_sha256:sha256(input??{}),result_sha256:result===undefined?null:sha256(result),error:error?{code:error.code??'EXECUTION_ERROR',message:error.message}:null,rollback:rollback??null,created_at:new Date().toISOString()};
  fs.mkdirSync(runtime.receiptDir,{recursive:true});
  fs.writeFileSync(path.join(runtime.receiptDir,`${id}.json`),JSON.stringify(receipt,null,2)+'\n');
  return receipt;
 }

 const server=http.createServer(async(req,res)=>{
  const requestUrl=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(requestUrl.pathname==='/livez'&&req.method==='GET')return send(res,200,{status:'ok',service:'taowind-execution-worker',version:'0.3.0-alpha.1'});
  const artifactMatch=requestUrl.pathname.match(/^\/v1\/artifacts\/([^/]+)$/);
  const auth=await authenticate(req.headers.authorization);
  if(!auth)return send(res,401,{ok:false,error:{code:'UNAUTHORIZED',message:'A valid Founder token or Vercel OIDC bearer token is required.'}});
  if(requestUrl.pathname==='/healthz'&&req.method==='GET')return send(res,200,{status:'ready',service:'taowind-execution-worker',version:'0.3.0-alpha.1',runtime:runtime.status(),limits:{max_request_bytes:maxRequestBytes,max_concurrency:maxConcurrency}});
  if(artifactMatch&&req.method==='GET'){
   try{
    const item=runtime.openExport(decodeURIComponent(artifactMatch[1]),requestUrl.searchParams.get('token')||'');
    res.writeHead(200,{'content-type':'application/octet-stream','content-disposition':contentDisposition(item.filename),'content-length':item.size,'x-content-sha256':item.sha256,'cache-control':'no-store'});
    return fs.createReadStream(item.absolute_path).pipe(res);
   }catch(error){return send(res,404,{ok:false,error:{code:error.code??'ARTIFACT_NOT_FOUND',message:'Artifact not found.'}});}
  }
  const routeKey=`${req.method} ${requestUrl.pathname}`;
  let action=ROUTES.get(routeKey);
  if(routeKey==='POST /v1/invoke')action='__legacy__';
  if(!action)return send(res,404,{ok:false,error:{code:'NOT_FOUND',message:'Not found.'}});
  if(active>=maxConcurrency)return send(res,429,{ok:false,error:{code:'CONCURRENCY_LIMIT',message:'Worker concurrency limit reached.'}});
  active++;
  const started=Date.now(),receiptId=`exec-${randomUUID()}`;
  let input={},snapshot=null;
  try{
   input=await readBody(req);
   let payload=input;
   if(action==='__legacy__'){action=String(input.action??'');payload=input.payload??{};}
   if(MUTATING.has(action))snapshot=await snapshotGit();
   const result=await runtime.invoke(action,payload);
   if(action==='exportArtifact'&&result?.export_id){
    const base=publicBaseUrl||`${req.headers['x-forwarded-proto']||'http'}://${req.headers['x-forwarded-host']||req.headers.host}`;
    result.download_url=`${String(base).replace(/\/$/,'')}/v1/artifacts/${encodeURIComponent(result.export_id)}?token=${encodeURIComponent(result.download_token)}`;
    delete result.local_path;
   }
   const receipt=recordReceipt({id:receiptId,action,route:routeKey,auth,status:'completed',started,input:payload,result});
   return send(res,200,{ok:true,result,execution_receipt:receipt});
  }catch(error){
   const rollback=MUTATING.has(action)?await rollbackGit(snapshot):null;
   const receipt=recordReceipt({id:receiptId,action,route:routeKey,auth,status:'failed',started,input,error,rollback});
   return send(res,400,{ok:false,error:{code:error.code??'EXECUTION_ERROR',message:error.message,details:error.details},execution_receipt:receipt});
  }finally{active--;}
 });
 return{runtime,server,get url(){return`http://${host}:${actualPort}`;},start:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{const address=server.address();actualPort=typeof address==='object'&&address?address.port:port;resolve();});}),stop:()=>new Promise(resolve=>server.close(resolve))};
}
