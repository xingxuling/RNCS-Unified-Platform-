import {randomUUID} from 'node:crypto';
import {createMcpExpressApp} from '@modelcontextprotocol/sdk/server/express.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {isInitializeRequest} from '@modelcontextprotocol/sdk/types.js';
import {RealityOneGateway} from '@taowind/reality-one-gateway';
import {loadConfig} from './config.mjs';
import {KnowledgeIndex} from './knowledge-index.mjs';
import {authMiddleware,originMiddleware,rateLimitMiddleware,redactPath} from './security.mjs';
import {createTaoWindMcpServer,getToolCatalog} from './tools.mjs';

const jsonRpcError=(res,status,message,code=-32000)=>res.status(status).json({jsonrpc:'2.0',error:{code,message},id:null});
const sessionIdOf=req=>{const raw=req.headers['mcp-session-id'];return Array.isArray(raw)?raw[0]:raw;};

export async function createTaoWindRealityService(options={}){
 const config=options.config??loadConfig(options.env,options);
 const gateway=options.gateway??new RealityOneGateway({manifestDirs:config.manifestDirs,dataDir:config.dataDir});
 await gateway.discover();
 const exposedTools=getToolCatalog(config);
 const authorityProfile=config.authorityWritesEnabled?'founder-authority':config.candidateWritesEnabled?'candidate':'read';
 const artifactBaseUrl=config.publicBaseUrl?`${config.publicBaseUrl}${config.mcpPath}/artifacts`:'';
 const knowledge=options.knowledge??new KnowledgeIndex({repoRoot:config.repoRoot,publicBaseUrl:config.publicBaseUrl,artifactBaseUrl,maxFileBytes:config.maxKnowledgeFileBytes,maxTotalBytes:config.maxKnowledgeBytes,maxFetchChars:config.maxFetchChars});
 if(!knowledge.generatedAt)knowledge.build();
 const app=createMcpExpressApp({host:config.host,allowedHosts:config.allowedHosts});
 const sessions=new Map();
 app.set('trust proxy',config.trustProxy);
 let httpServer=null,cleanupTimer=null;
 app.disable('x-powered-by');
 app.use(rateLimitMiddleware(config));
 app.use(originMiddleware(config));
 app.use(config.mcpPath,authMiddleware(config));
 app.get('/healthz',(req,res)=>res.json({status:'ok',name:config.name,version:config.version,mcp_path:config.mcpPath,runtime_count:gateway.registry.runtimes.length,tool_count:exposedTools.length,authority_profile:authorityProfile,knowledge:knowledge.stats()}));
 app.get('/readyz',async(req,res)=>{try{const report=await gateway.health();res.status(report.status==='healthy'?200:503).json({status:report.status,runtime_count:report.runtimes.length,health_root:report.health_root});}catch(error){res.status(503).json({status:'unhealthy'});}});
 app.get(`${config.mcpPath}/manifest`,(req,res)=>res.json({name:config.name,version:config.version,mcp_endpoint:config.publicBaseUrl?`${config.publicBaseUrl}${config.mcpPath}`:config.mcpPath,transport:'streamable-http',auth_mode:config.authMode,authority_profile:authorityProfile,safety_boundary:config.authorityWritesEnabled?'founder-authority-with-state-preconditions':config.candidateWritesEnabled?'read-and-candidate-only':'read-only',tools:exposedTools}));
 app.get(`${config.mcpPath}/artifacts/:id`,(req,res)=>{try{const artifact=knowledge.fetch(req.params.id);res.type('text/plain; charset=utf-8').set('x-content-sha256',artifact.metadata.sha256).send(artifact.text);}catch(error){res.status(404).json({error:error.code??'ARTIFACT_NOT_FOUND'});}});
 const createSession=async transport=>{const mcp=createTaoWindMcpServer({gateway,knowledge,config});await mcp.connect(transport);return mcp;};
 app.post(config.mcpPath,async(req,res)=>{try{const sessionId=sessionIdOf(req);if(sessionId){const session=sessions.get(sessionId);if(!session)return jsonRpcError(res,404,'Session not found.');session.lastAccess=Date.now();await session.transport.handleRequest(req,res,req.body);return;}if(!isInitializeRequest(req.body))return jsonRpcError(res,400,'Initialization request or valid MCP session id required.');let mcp;const transport=new StreamableHTTPServerTransport({sessionIdGenerator:()=>randomUUID(),enableJsonResponse:config.jsonResponses,onsessioninitialized:id=>sessions.set(id,{transport,mcp,lastAccess:Date.now()})});transport.onclose=()=>{if(transport.sessionId)sessions.delete(transport.sessionId);};mcp=await createSession(transport);await transport.handleRequest(req,res,req.body);}catch(error){console.error('[taowind-mcp] POST failed',error);if(!res.headersSent)jsonRpcError(res,500,'Internal MCP server error.',-32603);}});
 app.get(config.mcpPath,async(req,res)=>{const id=sessionIdOf(req),session=id?sessions.get(id):null;if(!session)return jsonRpcError(res,400,'Valid MCP session id required.');session.lastAccess=Date.now();try{await session.transport.handleRequest(req,res);}catch(error){console.error('[taowind-mcp] GET failed',error);if(!res.headersSent)jsonRpcError(res,500,'Internal MCP server error.',-32603);}});
 app.delete(config.mcpPath,async(req,res)=>{const id=sessionIdOf(req),session=id?sessions.get(id):null;if(!session)return jsonRpcError(res,404,'Session not found.');try{await session.transport.handleRequest(req,res);await session.transport.close();await session.mcp.close();sessions.delete(id);}catch(error){console.error('[taowind-mcp] DELETE failed',error);if(!res.headersSent)jsonRpcError(res,500,'Internal MCP server error.',-32603);}});
 const start=async()=>{if(httpServer)return service;await new Promise((resolve,reject)=>{httpServer=app.listen(config.port,config.host,error=>error?reject(error):resolve());});const address=httpServer.address(),actualPort=typeof address==='object'&&address?address.port:config.port;service.url=`http://${config.host}:${actualPort}`;service.mcpUrl=`${service.url}${config.mcpPath}`;cleanupTimer=setInterval(async()=>{const cutoff=Date.now()-config.sessionTtlMs;for(const [id,session] of sessions)if(session.lastAccess<cutoff){sessions.delete(id);await session.transport.close().catch(()=>{});await session.mcp.close().catch(()=>{});}},Math.min(60_000,Math.max(10_000,Math.floor(config.sessionTtlMs/2))));cleanupTimer.unref();return service;};
 const stop=async()=>{if(cleanupTimer)clearInterval(cleanupTimer);for(const [id,session] of sessions){sessions.delete(id);await session.transport.close().catch(()=>{});await session.mcp.close().catch(()=>{});}if(httpServer)await new Promise(resolve=>httpServer.close(resolve));httpServer=null;};
 const service={config,gateway,knowledge,exposedTools,authorityProfile,app,sessions,url:null,mcpUrl:null,start,stop,redactedMcpPath:redactPath(config.mcpPath)};
 return service;
}
