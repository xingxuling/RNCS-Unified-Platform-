import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {createTaoWindRealityService} from '../src/service.mjs';
import {loadConfig} from '../src/config.mjs';

const repoRoot=path.resolve(import.meta.dirname,'../../../..');
const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'taowind-mcp-smoke-'));
const config=loadConfig({}, {repoRoot,host:'127.0.0.1',port:0,dataDir,allowedHosts:['127.0.0.1','localhost'],authorityMode:'founder'});
const service=await createTaoWindRealityService({config});
await service.start();
const client=new Client({name:'taowind-smoke',version:'2.0.0'});
await client.connect(new StreamableHTTPClientTransport(new URL(service.mcpUrl)));
try{
 const tools=await client.listTools();
 const runtimes=await client.callTool({name:'rncs_list_runtimes',arguments:{}});
 const health=await client.callTool({name:'rncs_runtime_health',arguments:{runtime_id:'rncs.aetherworld-native'}});
 const before=await client.callTool({name:'rncs_world_status',arguments:{}});
 const workflow=await client.callTool({name:'rncs_authoritative_workflow',arguments:{source:'创建一座小型以太岛，包含两个玩家出生点、一扇门、一盏蓝色灯和感应区；进入后门打开、灯增强并播放环境声音。',run_loopback:false}});
 const after=await client.callTool({name:'rncs_world_status',arguments:{}});
 const receipts=await client.callTool({name:'rncs_invocation_receipts',arguments:{limit:10}});
 const report={
  format:'taowind-reality-mcp.smoke.v0.3',
  status:workflow.isError?'FAIL':'PASS',
  mcp_url:service.mcpUrl,
  authority_profile:service.authorityProfile,
  tool_count:tools.tools.length,
  runtime_count:runtimes.structuredContent?.result?.runtime_count,
  runtime_health:health.structuredContent?.result?.status,
  formal_world_changed:before.structuredContent?.result?.state_root!==after.structuredContent?.result?.state_root&&after.structuredContent?.result?.revision>before.structuredContent?.result?.revision,
  candidate_id:workflow.structuredContent?.result?.candidate?.candidate_id,
  authority_root:workflow.structuredContent?.result?.authority?.authority_root,
  receipt_count:receipts.structuredContent?.result?.receipt_count,
  structured_content_is_object:!Array.isArray(runtimes.structuredContent)&&!Array.isArray(receipts.structuredContent)
 };
 console.log(JSON.stringify(report,null,2));
 if(report.status!=='PASS'||!report.formal_world_changed||!report.structured_content_is_object||report.tool_count<47)process.exitCode=1;
}finally{
 await client.close().catch(()=>{});
 await service.stop();
}
