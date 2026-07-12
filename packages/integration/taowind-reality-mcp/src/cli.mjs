#!/usr/bin/env node
import {createTaoWindRealityService} from './service.mjs';
const command=process.argv[2]??'serve';
if(command!=='serve'){console.error('Usage: taowind-reality-mcp serve');process.exit(2);}
try{
 const service=await createTaoWindRealityService();
 await service.start();
 console.log(JSON.stringify({
  status:'ready',name:service.config.name,version:service.config.version,url:service.url,mcp_path:service.redactedMcpPath,
  runtime_count:service.gateway.registry.runtimes.length,tool_count:service.exposedTools.length,authority_profile:service.authorityProfile,
  authority_tools:service.config.authorityWritesEnabled,state_preconditions:service.config.requireStatePreconditions,knowledge:service.knowledge.stats()
 },null,2));
 const shutdown=async()=>{await service.stop();process.exit(0);};
 process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
}catch(error){console.error(JSON.stringify({status:'failed',error:{code:error.code??'STARTUP_ERROR',message:error.message}},null,2));process.exit(1);}
