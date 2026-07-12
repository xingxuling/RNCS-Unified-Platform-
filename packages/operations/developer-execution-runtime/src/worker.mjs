import http from 'node:http';
import fs from 'node:fs';
import {createDeveloperExecutionRuntime,verifyWorkerToken} from './runtime.mjs';

const send=(res,status,body)=>{const payload=JSON.stringify(body);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(payload)});res.end(payload);};
const readBody=req=>new Promise((resolve,reject)=>{let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>8_000_000){reject(Object.assign(new Error('Request too large.'),{code:'REQUEST_TOO_LARGE'}));req.destroy();}});req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{});}catch{reject(Object.assign(new Error('Invalid JSON.'),{code:'INVALID_JSON'}));}});req.on('error',reject);});
const contentDisposition=filename=>`attachment; filename="${String(filename).replace(/["\\\r\n]/g,'_')}"`;

export function createExecutionWorker(options={}){
 const host=String(options.host??process.env.TAOWIND_EXECUTION_WORKER_HOST??'127.0.0.1');
 const port=Number(options.port??process.env.TAOWIND_EXECUTION_WORKER_PORT??8790);
 const token=String(options.token??process.env.TAOWIND_EXECUTION_WORKER_TOKEN??'');
 const publicBaseUrl=String(options.publicBaseUrl??process.env.TAOWIND_EXECUTION_WORKER_PUBLIC_BASE_URL??'').replace(/\/$/,'');
 if(token.length<24)throw new Error('TAOWIND_EXECUTION_WORKER_TOKEN must contain at least 24 characters.');
 const runtime=options.runtime??createDeveloperExecutionRuntime(process.env,{provider:'local',workspaceRoot:options.workspaceRoot,mode:options.mode,enableShell:options.enableShell});
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/healthz'&&req.method==='GET')return send(res,200,{status:'ok',service:'taowind-execution-worker',version:'0.1.0-alpha.1'});
  const requestUrl=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  const artifactMatch=requestUrl.pathname.match(/^\/v1\/artifacts\/([^/]+)$/);
  if(artifactMatch&&req.method==='GET'){
   try{
    const item=runtime.openExport(decodeURIComponent(artifactMatch[1]),requestUrl.searchParams.get('token')||'');
    res.writeHead(200,{'content-type':'application/octet-stream','content-disposition':contentDisposition(item.filename),'content-length':item.size,'x-content-sha256':item.sha256});
    return fs.createReadStream(item.absolute_path).pipe(res);
   }catch(error){return send(res,404,{error:{code:error.code??'ARTIFACT_NOT_FOUND',message:'Artifact not found.'}});}
  }
  if(requestUrl.pathname!=='/v1/invoke'||req.method!=='POST')return send(res,404,{error:{code:'NOT_FOUND',message:'Not found.'}});
  if(!verifyWorkerToken(req.headers.authorization,token))return send(res,401,{error:{code:'UNAUTHORIZED',message:'Invalid worker token.'}});
  try{
   const {action,payload}=await readBody(req);
   const result=await runtime.invoke(action,payload??{});
   if(action==='exportArtifact'&&result?.export_id){
    const base=publicBaseUrl||`${req.headers['x-forwarded-proto']||'http'}://${req.headers['x-forwarded-host']||req.headers.host}`;
    result.download_url=`${String(base).replace(/\/$/,'')}/v1/artifacts/${encodeURIComponent(result.export_id)}?token=${encodeURIComponent(result.download_token)}`;
    delete result.download_token;
    delete result.local_path;
   }
   return send(res,200,{ok:true,result});
  }catch(error){return send(res,400,{ok:false,error:{code:error.code??'EXECUTION_ERROR',message:error.message,details:error.details}});}
 });
 let actualPort=port;
 return{runtime,server,get url(){return`http://${host}:${actualPort}`;},start:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{const address=server.address();actualPort=typeof address==='object'&&address?address.port:port;resolve();});}),stop:()=>new Promise(resolve=>server.close(resolve))};
}
