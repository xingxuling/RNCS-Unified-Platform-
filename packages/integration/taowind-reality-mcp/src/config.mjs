import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const defaultRepoRoot=path.resolve(packageRoot,'../../..');
const truthy=value=>['1','true','yes','on'].includes(String(value??'').trim().toLowerCase());
const enabledByDefault=value=>!['0','false','off','no'].includes(String(value??'true').trim().toLowerCase());
const list=value=>String(value??'').split(',').map(item=>item.trim()).filter(Boolean);
const int=(value,fallback,{min=1,max=Number.MAX_SAFE_INTEGER}={})=>{const parsed=Number(value);return Number.isSafeInteger(parsed)&&parsed>=min&&parsed<=max?parsed:fallback;};

export function loadConfig(env=process.env,overrides={}){
 const repoRoot=path.resolve(overrides.repoRoot??env.TAOWIND_REPO_ROOT??defaultRepoRoot);
 const host=String(overrides.host??env.TAOWIND_MCP_HOST??'127.0.0.1');
 const port=Number(overrides.port??env.TAOWIND_MCP_PORT??8787);
 const pathToken=String(overrides.pathToken??env.TAOWIND_MCP_PATH_TOKEN??'').trim();
 if(pathToken&&!/^[A-Za-z0-9_-]{24,}$/.test(pathToken))throw new Error('TAOWIND_MCP_PATH_TOKEN must contain at least 24 URL-safe characters.');
 const mcpPath=String(overrides.mcpPath??env.TAOWIND_MCP_PATH??(pathToken?`/mcp/${pathToken}`:'/mcp'));
 if(!mcpPath.startsWith('/'))throw new Error('TAOWIND_MCP_PATH must start with /.');
 const authMode=String(overrides.authMode??env.TAOWIND_MCP_AUTH_MODE??'none').toLowerCase();
 if(!['none','bearer'].includes(authMode))throw new Error('TAOWIND_MCP_AUTH_MODE must be none or bearer.');
 const bearerToken=String(overrides.bearerToken??env.TAOWIND_MCP_BEARER_TOKEN??'');
 if(authMode==='bearer'&&bearerToken.length<24)throw new Error('Bearer authentication requires TAOWIND_MCP_BEARER_TOKEN with at least 24 characters.');
 const authorityMode=String(overrides.authorityMode??env.TAOWIND_MCP_AUTHORITY_MODE??'founder').trim().toLowerCase();
 if(!['read','candidate','founder'].includes(authorityMode))throw new Error('TAOWIND_MCP_AUTHORITY_MODE must be read, candidate, or founder.');
 const candidateWritesEnabled=authorityMode!=='read'&&Boolean(overrides.candidateWritesEnabled??enabledByDefault(env.TAOWIND_MCP_ENABLE_CANDIDATE_WRITES));
 const authorityWritesEnabled=authorityMode==='founder'&&Boolean(overrides.authorityWritesEnabled??enabledByDefault(env.TAOWIND_MCP_ENABLE_AUTHORITY_WRITES));
 const requireStatePreconditions=Boolean(overrides.requireStatePreconditions??enabledByDefault(env.TAOWIND_MCP_REQUIRE_STATE_PRECONDITIONS));
 const executionMode=String(overrides.executionMode??env.TAOWIND_EXECUTION_MODE??'founder').trim().toLowerCase();
 if(!['disabled','project','founder','founder-unrestricted'].includes(executionMode))throw new Error('TAOWIND_EXECUTION_MODE must be disabled, project, founder, or founder-unrestricted.');
 const executionToolsEnabled=authorityWritesEnabled&&executionMode!=='disabled'&&Boolean(overrides.executionToolsEnabled??enabledByDefault(env.TAOWIND_MCP_ENABLE_EXECUTION_TOOLS));
 const executionShellEnabled=executionToolsEnabled&&executionMode==='founder-unrestricted'&&Boolean(overrides.executionShellEnabled??truthy(env.TAOWIND_EXECUTION_ENABLE_SHELL));
 const executionProvider=String(overrides.executionProvider??env.TAOWIND_EXECUTION_PROVIDER??(env.TAOWIND_EXECUTION_WORKER_URL?'remote':'local')).trim().toLowerCase();
 if(!['local','remote'].includes(executionProvider))throw new Error('TAOWIND_EXECUTION_PROVIDER must be local or remote.');
 const founderSubjectId=String(overrides.founderSubjectId??env.TAOWIND_MCP_FOUNDER_SUBJECT_ID??'subject:duhengjie').trim();
 if(founderSubjectId.length<3)throw new Error('TAOWIND_MCP_FOUNDER_SUBJECT_ID must contain at least 3 characters.');
 const founderApprovalRoles=overrides.founderApprovalRoles??list(env.TAOWIND_MCP_FOUNDER_APPROVAL_ROLES||'owner,security');
 if(!founderApprovalRoles.length)throw new Error('TAOWIND_MCP_FOUNDER_APPROVAL_ROLES must contain at least one role.');
 const publicBinding=!['127.0.0.1','localhost','::1'].includes(host);
 const allowPublicNoAuth=Boolean(overrides.allowPublicNoAuth??truthy(env.TAOWIND_MCP_ALLOW_PUBLIC_NO_AUTH));
 if(publicBinding&&authMode==='none'&&!pathToken&&!allowPublicNoAuth)throw new Error('Public no-auth mode requires a path token or TAOWIND_MCP_ALLOW_PUBLIC_NO_AUTH=true.');
 if(publicBinding&&authorityWritesEnabled&&authMode==='none'&&pathToken.length<32)throw new Error('Public founder-authority mode without bearer authentication requires TAOWIND_MCP_PATH_TOKEN with at least 32 characters.');
 const allowedOrigins=overrides.allowedOrigins??list(env.TAOWIND_MCP_ALLOWED_ORIGINS||'https://chatgpt.com,https://chat.openai.com,http://localhost,http://127.0.0.1');
 const platformHosts=[env.RENDER_EXTERNAL_HOSTNAME,env.RAILWAY_PUBLIC_DOMAIN,env.VERCEL_URL,env.VERCEL_PROJECT_PRODUCTION_URL].map(value=>String(value??'').trim()).filter(Boolean);
 const configuredHosts=overrides.allowedHosts??[...list(env.TAOWIND_MCP_ALLOWED_HOSTS),...platformHosts];
 const allowedHosts=[...new Set(configuredHosts.length?configuredHosts:(publicBinding?[]:['127.0.0.1','localhost','[::1]']))];
 if(publicBinding&&!allowedHosts.length)throw new Error('Public binding requires TAOWIND_MCP_ALLOWED_HOSTS or a supported platform hostname.');
 return Object.freeze({
  name:'TaoWind Reality MCP',version:'0.3.0-alpha.1',repoRoot,host,port:Number.isInteger(port)&&port>=0&&port<=65535?port:8787,mcpPath,pathToken,
  authMode,bearerToken,authorityMode,candidateWritesEnabled,authorityWritesEnabled,requireStatePreconditions,executionMode,executionProvider,executionToolsEnabled,executionShellEnabled,founderSubjectId,founderApprovalRoles,
  publicBinding,allowPublicNoAuth,allowedOrigins,allowedHosts,trustProxy:Boolean(overrides.trustProxy??truthy(env.TAOWIND_MCP_TRUST_PROXY)),
  publicBaseUrl:String(overrides.publicBaseUrl??env.TAOWIND_MCP_PUBLIC_BASE_URL??(env.VERCEL_PROJECT_PRODUCTION_URL?`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`:env.VERCEL_URL?`https://${env.VERCEL_URL}`:'')).replace(/\/$/,''),
  dataDir:path.resolve(overrides.dataDir??env.TAOWIND_MCP_DATA_DIR??path.join(repoRoot,'output/taowind-reality-mcp')),
  manifestDirs:(overrides.manifestDirs??list(env.TAOWIND_MCP_MANIFEST_DIRS)).length?(overrides.manifestDirs??list(env.TAOWIND_MCP_MANIFEST_DIRS)).map(item=>path.resolve(item)):[path.join(repoRoot,'packages/control/reality-one-gateway/runtimes')],
  sessionTtlMs:int(overrides.sessionTtlMs??env.TAOWIND_MCP_SESSION_TTL_MS,30*60*1000,{min:60_000,max:24*60*60*1000}),
  rateLimitPerMinute:int(overrides.rateLimitPerMinute??env.TAOWIND_MCP_RATE_LIMIT_PER_MINUTE,120,{min:1,max:10_000}),
  maxKnowledgeFileBytes:int(overrides.maxKnowledgeFileBytes??env.TAOWIND_MCP_MAX_KNOWLEDGE_FILE_BYTES,512_000,{min:4_096,max:5_000_000}),
  maxKnowledgeBytes:int(overrides.maxKnowledgeBytes??env.TAOWIND_MCP_MAX_KNOWLEDGE_BYTES,24_000_000,{min:100_000,max:200_000_000}),
  maxFetchChars:int(overrides.maxFetchChars??env.TAOWIND_MCP_MAX_FETCH_CHARS,200_000,{min:1_000,max:2_000_000}),
  jsonResponses:Boolean(overrides.jsonResponses??enabledByDefault(env.TAOWIND_MCP_JSON_RESPONSES))
 });
}
