import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DeveloperExecutionRuntime,RemoteDeveloperExecutionRuntime} from '../src/runtime.mjs';
import {createExecutionWorker} from '../src/worker.mjs';

test('remote worker authenticates and executes inside its workspace',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-worker-'));
 const token='abcdefghijklmnopqrstuvwxyz1234567890';
 const runtime=new DeveloperExecutionRuntime({workspaceRoot:root,mode:'founder',allowedExecutables:['node']});
 const worker=createExecutionWorker({host:'127.0.0.1',port:0,token,runtime});
 await worker.start();
 try{
  const health=await fetch(`${worker.url}/healthz`).then(response=>response.json());
  assert.deepEqual(health,{status:'ok',service:'taowind-execution-worker',version:'0.1.0-alpha.1'});
  const remote=new RemoteDeveloperExecutionRuntime({url:worker.url,token});
  await remote.invoke('writeFile',{path:'hello.txt',content:'remote-ok'});
  assert.equal((await remote.invoke('readFile',{path:'hello.txt'})).content,'remote-ok');
  const exported=await remote.invoke('exportArtifact',{path:'hello.txt'});
  assert.match(exported.download_url,/\/v1\/artifacts\//);
  const downloaded=await fetch(exported.download_url);
  assert.equal(downloaded.status,200);
  assert.equal(await downloaded.text(),'remote-ok');
  const denied=await fetch(`${worker.url}/v1/invoke`,{method:'POST',headers:{authorization:'Bearer wrong','content-type':'application/json'},body:JSON.stringify({action:'status',payload:{}})});
  assert.equal(denied.status,401);
 }finally{await worker.stop();}
});
