import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import http from 'node:http';
import {DeveloperExecutionRuntime} from '../src/runtime.mjs';

const tempRoot=()=>fs.mkdtempSync(path.join(os.tmpdir(),'taowind-exec-'));
const createRuntime=(root,overrides={})=>new DeveloperExecutionRuntime({
  workspaceRoot:root,
  mode:'founder',
  allowedExecutables:['node','git'],
  defaultTimeoutMs:5_000,
  maxOutputBytes:200_000,
  ...overrides
});

test('workspace writes and reads files only inside the bound project',async()=>{
 const root=tempRoot();
 const runtime=createRuntime(root);
 const written=await runtime.invoke('writeFile',{path:'src/hello.txt',content:'hello'});
 assert.equal(written.path,'src/hello.txt');
 assert.equal((await runtime.invoke('readFile',{path:'src/hello.txt'})).content,'hello');
 await assert.rejects(()=>runtime.invoke('readFile',{path:'../outside.txt'}),error=>error.code==='WORKSPACE_PATH_ESCAPE');
});

test('secret files and symlink escapes are rejected',async()=>{
 const root=tempRoot();
 const outside=tempRoot();
 fs.writeFileSync(path.join(outside,'token.txt'),'secret');
 fs.symlinkSync(outside,path.join(root,'linked'),'dir');
 const runtime=createRuntime(root);
 await assert.rejects(()=>runtime.invoke('writeFile',{path:'.env',content:'TOKEN=x'}),error=>error.code==='SECRET_PATH_DENIED');
 await assert.rejects(()=>runtime.invoke('readFile',{path:'linked/token.txt'}),error=>error.code==='WORKSPACE_SYMLINK_ESCAPE');
});

test('command execution uses argv without a shell and records a receipt',async()=>{
 const root=tempRoot();
 const runtime=createRuntime(root);
 const result=await runtime.invoke('runCommand',{executable:'node',args:['-e','process.stdout.write("ok")']});
 assert.equal(result.exit_code,0);
 assert.equal(result.stdout,'ok');
 assert.match(result.receipt_id,/^exec-/);
 await assert.rejects(()=>runtime.invoke('runCommand',{executable:'bash',args:['-lc','echo nope']}),error=>error.code==='EXECUTABLE_NOT_ALLOWED');
});



test('child processes do not inherit provider or MCP secrets',async()=>{
 const root=tempRoot();
 const old=process.env.TAOWIND_GITHUB_TOKEN;
 process.env.TAOWIND_GITHUB_TOKEN='should-not-leak';
 try{
  const runtime=createRuntime(root);
  const result=await runtime.invoke('runCommand',{executable:'node',args:['-e','process.stdout.write(process.env.TAOWIND_GITHUB_TOKEN||"redacted")']});
  assert.equal(result.stdout,'redacted');
 }finally{
  if(old===undefined)delete process.env.TAOWIND_GITHUB_TOKEN;else process.env.TAOWIND_GITHUB_TOKEN=old;
 }
});

test('break-glass shell is available only in founder-unrestricted mode',async()=>{
 const root=tempRoot();
 await assert.rejects(()=>createRuntime(root).invoke('runShell',{script:'printf ok'}),error=>error.code==='SHELL_DISABLED');
 const runtime=createRuntime(root,{mode:'founder-unrestricted',enableShell:true,allowedExecutables:['node','git','bash']});
 const result=await runtime.invoke('runShell',{script:'printf ok'});
 assert.equal(result.stdout,'ok');
});

test('git branch, diff and commit form a real local engineering transaction',async()=>{
 const root=tempRoot();
 execFileSync('git',['init'],{cwd:root});
 execFileSync('git',['config','user.email','test@example.invalid'],{cwd:root});
 execFileSync('git',['config','user.name','TaoWind Test'],{cwd:root});
 fs.writeFileSync(path.join(root,'README.md'),'base\n');
 execFileSync('git',['add','README.md'],{cwd:root});
 execFileSync('git',['commit','-m','base'],{cwd:root});
 const runtime=createRuntime(root);
 await runtime.invoke('gitCreateBranch',{branch:'task/execution-plane'});
 await runtime.invoke('writeFile',{path:'README.md',content:'base\nchanged\n'});
 const diff=await runtime.invoke('gitDiff',{});
 assert.match(diff.stdout,/\+changed/);
 const commit=await runtime.invoke('gitCommit',{message:'feat: change readme',paths:['README.md']});
 assert.equal(commit.exit_code,0);
 assert.match((await runtime.invoke('gitStatus',{})).stdout,/^$/);
});

test('build profiles run declared project commands and reject unknown profiles',async()=>{
 const root=tempRoot();
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({scripts:{test:'node -e "process.stdout.write(\\"tests-ok\\")"'}}));
 const runtime=createRuntime(root,{allowedExecutables:['node','npm','git']});
 const result=await runtime.invoke('runBuild',{profile:'node-test'});
 assert.equal(result.exit_code,0);
 assert.match(result.stdout,/tests-ok/);
 await assert.rejects(()=>runtime.invoke('runBuild',{profile:'unknown'}),error=>error.code==='BUILD_PROFILE_UNKNOWN');
});





test('Android build profile invokes the bound project Gradle wrapper',async()=>{
 const root=tempRoot();
 const wrapper=path.join(root,'gradlew');
 fs.writeFileSync(wrapper,'#!/bin/sh\nprintf "gradle:%s" "$1"\n');
 fs.chmodSync(wrapper,0o755);
 const runtime=createRuntime(root,{allowedExecutables:['./gradlew','git']});
 const result=await runtime.invoke('runBuild',{profile:'android-debug'});
 assert.equal(result.exit_code,0);
 assert.equal(result.stdout,'gradle:assembleDebug');
});

test('artifacts export as files or secret-filtered directory archives',async()=>{
 const root=tempRoot();
 fs.mkdirSync(path.join(root,'out'),{recursive:true});
 fs.writeFileSync(path.join(root,'out','app.apk'),'apk-bytes');
 fs.writeFileSync(path.join(root,'out','.env'),'TOKEN=hidden');
 const runtime=createRuntime(root,{allowedExecutables:['node','git','zip']});
 const file=await runtime.invoke('exportArtifact',{path:'out/app.apk'});
 assert.equal(fs.readFileSync(file.local_path,'utf8'),'apk-bytes');
 assert.equal(runtime.openExport(file.export_id,file.download_token).sha256,file.sha256);
 const archive=await runtime.invoke('exportArtifact',{path:'out',filename:'out.zip'});
 const listing=execFileSync('unzip',['-l',archive.local_path],{encoding:'utf8'});
 assert.match(listing,/app\.apk/);
 assert.doesNotMatch(listing,/\.env/);
});



test('GitHub and Vercel provider adapters perform authenticated writes against configured endpoints',async()=>{
 const root=tempRoot();
 const requests=[];
 const server=http.createServer((req,res)=>{
  let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>{
   requests.push({method:req.method,url:req.url,authorization:req.headers.authorization,body:body?JSON.parse(body):{}});
   if(req.url.includes('/pulls')){res.writeHead(201,{'content-type':'application/json'});res.end(JSON.stringify({number:7,html_url:'https://example.invalid/pr/7'}));return;}
   if(req.url==='/deploy-hook'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({id:'deployment-1',url:'https://preview.example.invalid'}));return;}
   res.writeHead(204);res.end();
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();const base=`http://127.0.0.1:${address.port}`;
 try{
  const runtime=createRuntime(root,{githubToken:'github-test-token',githubOwner:'owner',githubRepo:'repo',githubApiBase:base,vercelDeployHook:`${base}/deploy-hook`});
  const pr=await runtime.invoke('githubCreatePullRequest',{head:'task/test',base:'main',title:'Test PR'});
  assert.equal(pr.number,7);
  await runtime.invoke('githubTriggerWorkflow',{workflow_id:'ci.yml',ref:'task/test',inputs:{mode:'full'}});
  const deployment=await runtime.invoke('vercelDeploy',{ref:'task/test',environment:'preview'});
  assert.equal(deployment.id,'deployment-1');
  assert.equal(requests[0].authorization,'Bearer github-test-token');
  assert.equal(requests[1].authorization,'Bearer github-test-token');
  assert.equal(requests[2].url,'/deploy-hook');
 }finally{await new Promise(resolve=>server.close(resolve));}
});



test('engineering workflow modifies, tests and commits a real task branch',async()=>{
 const root=tempRoot();
 execFileSync('git',['init','-b','main'],{cwd:root});
 execFileSync('git',['config','user.email','test@example.invalid'],{cwd:root});
 execFileSync('git',['config','user.name','TaoWind Test'],{cwd:root});
 fs.writeFileSync(path.join(root,'app.txt'),'stable\n');
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({scripts:{test:'node -e "process.stdout.write(\\"workflow-tests-ok\\")"'}}));
 execFileSync('git',['add','.'],{cwd:root});
 execFileSync('git',['commit','-m','base'],{cwd:root});
 const runtime=createRuntime(root,{allowedExecutables:['node','npm','git']});
 const receipt=await runtime.invoke('engineeringWorkflow',{branch:'task/success',changes:[{path:'app.txt',content:'upgraded\n'}],test_profiles:['node-test'],commit_message:'feat: upgrade app'});
 assert.equal(receipt.status,'completed');
 assert.equal(receipt.tests[0].result.exit_code,0);
 assert.equal(execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),'task/success');
 assert.equal(execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}),'');
 assert.equal(fs.readFileSync(path.join(root,'app.txt'),'utf8'),'upgraded\n');
});

test('engineering workflow rolls back a failed task branch',async()=>{
 const root=tempRoot();
 execFileSync('git',['init','-b','main'],{cwd:root});
 execFileSync('git',['config','user.email','test@example.invalid'],{cwd:root});
 execFileSync('git',['config','user.name','TaoWind Test'],{cwd:root});
 fs.writeFileSync(path.join(root,'app.txt'),'stable\n');
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({scripts:{test:'node -e "process.exit(1)"'}}));
 execFileSync('git',['add','.'],{cwd:root});
 execFileSync('git',['commit','-m','base'],{cwd:root});
 const runtime=createRuntime(root,{allowedExecutables:['node','npm','git']});
 await assert.rejects(()=>runtime.invoke('engineeringWorkflow',{branch:'task/fail',changes:[{path:'app.txt',content:'broken\n'}],test_profiles:['node-test'],commit_message:'broken'}),error=>error.code==='PROCESS_EXIT_NONZERO');
 assert.equal(fs.readFileSync(path.join(root,'app.txt'),'utf8'),'stable\n');
 assert.equal(execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),'main');
 assert.equal(execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}),'');
});
