import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {createTaoWindRealityService} from '../src/service.mjs';
import {loadConfig} from '../src/config.mjs';

const repoRoot=path.resolve(import.meta.dirname,'../../../..');
const source='创建一座小型以太岛，包含两个玩家出生点、一扇门、一盏蓝色能量灯和一个感应区。进入感应区后门打开、灯增强并播放环境声音。';

async function withClient(fn,overrides={}){
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-mcp-test-'));
 const config=loadConfig({}, {repoRoot,host:'127.0.0.1',port:0,dataDir,allowedOrigins:['https://chatgpt.com'],allowedHosts:['127.0.0.1','localhost'],...overrides});
 const service=await createTaoWindRealityService({config});
 await service.start();
 const client=new Client({name:'taowind-test-client',version:'1.0.0'});
 await client.connect(new StreamableHTTPClientTransport(new URL(service.mcpUrl)));
 try{return await fn({service,client});}finally{await client.close().catch(()=>{});await service.stop();}
}

const resultOf=response=>response.structuredContent?.result;

test('private founder profile exposes authority and project execution tools while break-glass shell stays hidden',async()=>withClient(async({client})=>{
 const tools=await client.listTools();
 const names=tools.tools.map(tool=>tool.name);
 for(const expected of ['rncs_candidate_workflow','rncs_authorize_candidate','rncs_merge_candidate','rncs_rollback_generation','rncs_replay_generation','rncs_runtime_action','rncs_rcl_compile_execute','rncs_rcl_compile_authority_plan','rncs_rcl_authority_workflow','rncs_execute_behavior','developer_execution_status','workspace_read_file','workspace_write_file','workspace_export_artifact','execution_run_command','git_commit','github_create_pr','vercel_deploy','rsr_simulate','vsr_render','rncs_engineering_workflow'])assert.ok(names.includes(expected),expected);
 for(const forbidden of ['execute_shell','read_arbitrary_file','write_arbitrary_file','execution_run_shell'])assert.ok(!names.includes(forbidden));
 assert.equal(tools.tools.find(tool=>tool.name==='rncs_merge_candidate').annotations.destructiveHint,true);
}));

test('RCL MCP bridge compiles, executes native RBC, and reports parity',async()=>withClient(async({client})=>{
 const response=await client.callTool({name:'rncs_rcl_compile_execute',arguments:{source:'reality McpRclBridge { facet world.ready : Truth = true facet world.value : Number = 7 }'}});
 assert.equal(response.isError,undefined);
 const result=resultOf(response);
 assert.equal(result.format,'rncs.rcl-native-execution.v0.1');
 assert.equal(result.parity.ok,true);
 assert.equal(result.native.state['world.ready'],true);
 assert.equal(result.native.state['world.value'],7);
}));

test('RCL MCP authority tool commits native state through AAF and RFE',async()=>withClient(async({client})=>{
 const before=resultOf(await client.callTool({name:'rncs_world_status',arguments:{}}));
 const response=await client.callTool({name:'rncs_rcl_authority_workflow',arguments:{source:'reality McpRclAuthority { facet rncs.world.world_id : Text = "world:aether-island" facet rncs.world.title : Text = "MCP RCL authoritative title" facet rncs.world.rcl_marker : Truth = true }',commit:true,expected_state_root:before.state_root,expected_revision:before.revision,approval_roles:['owner','security']}});
 assert.equal(response.isError,undefined);
 const result=resultOf(response);
 assert.equal(result.status,'committed');
 assert.equal(result.authority.authorized,true);
 assert.equal(result.changed,true);
 assert.equal(result.candidate.candidate_root.length,64);
 assert.equal(result.merge.evidence.rcl_native_evidence.parity_verified,true);
 assert.ok(result.merge.evidence.rfe_commit_receipt.integrityHash);
}));



test('developer execution runtime is reachable through MCP and runs a real command',async()=>withClient(async({client})=>{
 const status=await client.callTool({name:'developer_execution_status',arguments:{}});
 assert.equal(status.isError,undefined);
 assert.equal(resultOf(status).status,'ready');
 const command=await client.callTool({name:'execution_run_command',arguments:{executable:'node',args:['-e','process.stdout.write("mcp-exec-ok")']}});
 assert.equal(command.isError,undefined);
 assert.equal(resultOf(command).exit_code,0);
 assert.equal(resultOf(command).stdout,'mcp-exec-ok');
}));

test('break-glass shell tool is catalogued only when founder-unrestricted mode explicitly enables it',async()=>withClient(async({client})=>{
 const names=(await client.listTools()).tools.map(tool=>tool.name);
 assert.ok(names.includes('execution_run_shell'));
},{executionMode:'founder-unrestricted',executionShellEnabled:true}));

test('candidate and read profiles hide higher authority tools',async()=>{
 await withClient(async({client})=>{
  const names=(await client.listTools()).tools.map(tool=>tool.name);
  assert.ok(names.includes('rncs_candidate_workflow'));
  assert.ok(!names.includes('rncs_merge_candidate'));
 },{authorityMode:'candidate'});
 await withClient(async({client})=>{
  const names=(await client.listTools()).tools.map(tool=>tool.name);
  assert.ok(!names.includes('rncs_candidate_workflow'));
  assert.ok(!names.includes('rncs_merge_candidate'));
  assert.ok(names.includes('rncs_world_status'));
 },{authorityMode:'read'});
});

test('runtime discovery always returns dictionary structuredContent, including filtered results',async()=>withClient(async({client})=>{
 const all=await client.callTool({name:'rncs_list_runtimes',arguments:{}});
 assert.equal(all.isError,undefined);
 assert.equal(Array.isArray(all.structuredContent),false);
 assert.ok(resultOf(all).runtimes.length>=14);
 assert.ok(resultOf(all).runtime_order.includes('rncs.aetherworld-native'));
 const one=await client.callTool({name:'rncs_list_runtimes',arguments:{runtime_id:'rncs.aetherworld-native'}});
 assert.equal(Array.isArray(one.structuredContent),false);
 assert.equal(resultOf(one).runtime_count,1);
 assert.equal(resultOf(one).runtimes[0].runtime_id,'rncs.aetherworld-native');
}));

test('history and invocation receipts are object-wrapped rather than top-level arrays',async()=>withClient(async({client})=>{
 const history=await client.callTool({name:'rncs_history',arguments:{}});
 assert.equal(Array.isArray(history.structuredContent),false);
 assert.ok(Array.isArray(resultOf(history).generations));
 const receipts=await client.callTool({name:'rncs_invocation_receipts',arguments:{limit:10}});
 assert.equal(Array.isArray(receipts.structuredContent),false);
 assert.ok(Array.isArray(resultOf(receipts).receipts));
}));

test('candidate workflow preserves authoritative generation and state root',async()=>withClient(async({client})=>{
 const before=await client.callTool({name:'rncs_world_status',arguments:{}});
 const workflow=await client.callTool({name:'rncs_candidate_workflow',arguments:{source}});
 assert.equal(workflow.isError,undefined);
 assert.equal(resultOf(workflow).authority_invariant.unchanged,true);
 assert.equal(resultOf(workflow).simulation.status,'completed');
 const after=await client.callTool({name:'rncs_world_status',arguments:{}});
 assert.equal(resultOf(after).revision,resultOf(before).revision);
 assert.equal(resultOf(after).state_root,resultOf(before).state_root);
}));

test('founder authoritative workflow changes formal generation through AAF and RFE',async()=>withClient(async({client})=>{
 const before=await client.callTool({name:'rncs_world_status',arguments:{}});
 const workflow=await client.callTool({name:'rncs_authoritative_workflow',arguments:{source,run_loopback:false}});
 assert.equal(workflow.isError,undefined);
 assert.equal(resultOf(workflow).changed,true);
 assert.ok(resultOf(workflow).authority.authority_root);
 const after=await client.callTool({name:'rncs_world_status',arguments:{}});
 assert.ok(resultOf(after).revision>resultOf(before).revision);
 assert.notEqual(resultOf(after).state_root,resultOf(before).state_root);
}));

test('destructive merge requires fresh state preconditions',async()=>withClient(async({client})=>{
 const plan=await client.callTool({name:'rncs_compile_plan',arguments:{source}});
 const candidate=await client.callTool({name:'rncs_create_candidate',arguments:{plan:resultOf(plan)}});
 const id=resultOf(candidate).candidate_id;
 await client.callTool({name:'rncs_simulate_candidate',arguments:{candidate_id:id}});
 await client.callTool({name:'rncs_authorize_candidate',arguments:{candidate_id:id}});
 const rejected=await client.callTool({name:'rncs_merge_candidate',arguments:{candidate_id:id}});
 assert.equal(rejected.isError,true);
 assert.match(rejected.content[0].text,/AUTHORITY_PRECONDITION_REQUIRED/);
}));

test('declared runtime action rejects undeclared action names',async()=>withClient(async({client})=>{
 const response=await client.callTool({name:'rncs_runtime_action',arguments:{runtime_id:'rncs.aetherworld-native',action:'executeShell',payload:{}}});
 assert.equal(response.isError,true);
 assert.match(response.content[0].text,/RUNTIME_ACTION_NOT_DECLARED/);
}));

test('knowledge search and fetch use opaque ids',async()=>withClient(async({client})=>{
 const search=await client.callTool({name:'search',arguments:{query:'Reality One Gateway',limit:3}});
 assert.ok(search.structuredContent.results.length>0);
 const item=search.structuredContent.results[0];
 assert.match(item.id,/^artifact-/);
 const fetched=await client.callTool({name:'fetch',arguments:{id:item.id}});
 assert.equal(fetched.structuredContent.id,item.id);
 assert.ok(fetched.structuredContent.text.length>0);
}));

test('invalid browser origins are rejected',async()=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-mcp-origin-'));
 const config=loadConfig({}, {repoRoot,host:'127.0.0.1',port:0,dataDir,allowedOrigins:['https://chatgpt.com'],allowedHosts:['127.0.0.1','localhost']});
 const service=await createTaoWindRealityService({config});
 await service.start();
 try{
  const response=await fetch(service.mcpUrl,{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'evil',version:'1'}}})});
  assert.equal(response.status,403);
 }finally{await service.stop();}
});

test('artifact HTTP route is nested under the protected MCP path',async()=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-mcp-artifact-'));
 const token='abcdefghijklmnopqrstuvwxyz123456';
 const config=loadConfig({}, {repoRoot,host:'127.0.0.1',port:0,dataDir,pathToken:token,publicBaseUrl:'https://mcp.example',allowedHosts:['127.0.0.1','localhost']});
 const service=await createTaoWindRealityService({config});
 await service.start();
 try{
  const item=service.knowledge.search('Reality One Gateway',{limit:1})[0];
  assert.ok(item);
  assert.match(item.url,new RegExp(`/mcp/${token}/artifacts/`));
  const oldRoute=await fetch(`${service.url}/artifacts/${item.id}`);
  assert.equal(oldRoute.status,404);
  const protectedRoute=await fetch(`${service.url}${config.mcpPath}/artifacts/${item.id}`);
  assert.equal(protectedRoute.status,200);
  assert.ok((await protectedRoute.text()).length>0);
 }finally{await service.stop();}
});

test('manifest reports founder authority without revealing private path publicly',async()=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-mcp-manifest-'));
 const token='abcdefghijklmnopqrstuvwxyz123456';
 const config=loadConfig({}, {repoRoot,host:'127.0.0.1',port:0,dataDir,pathToken:token,publicBaseUrl:'https://mcp.example',allowedHosts:['127.0.0.1','localhost']});
 const service=await createTaoWindRealityService({config});
 await service.start();
 try{
  const publicManifest=await fetch(`${service.url}/manifest`);
  assert.equal(publicManifest.status,404);
  const protectedManifest=await fetch(`${service.url}${config.mcpPath}/manifest`);
  assert.equal(protectedManifest.status,200);
  const body=await protectedManifest.json();
  assert.match(body.mcp_endpoint,new RegExp(token));
  assert.equal(body.authority_profile,'founder-authority');
  assert.ok(body.tools.some(tool=>tool.name==='rncs_merge_candidate'));
  const ready=await fetch(`${service.url}/readyz`);
  const readyBody=await ready.json();
  assert.equal('runtimes' in readyBody,false);
  assert.equal(readyBody.runtime_count,17);
 }finally{await service.stop();}
});
