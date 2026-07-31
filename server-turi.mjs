import { createTuriService } from './packages/integration/turi-mcp/src/service.mjs';

const vercelTaskRoot = process.env.VERCEL === '1' || process.env.VERCEL_URL ? '/var/task' : null;
const vercelRepoDefaults = vercelTaskRoot
  ? {
      TURI_REPO_ROOT: `${vercelTaskRoot}`,
      TURI_MANIFEST_DIRS: `${vercelTaskRoot}/packages/control/reality-one-gateway/runtimes`,
      TURI_RCL_ROOT: `${vercelTaskRoot}/packages/languages/reality-computation-language`,
      TURI_RCL_CONTROL_PLANE_DIR: `${vercelTaskRoot}/packages/control/rncs-rcl-control-plane`,
    }
  : {};

const env = {
  ...vercelRepoDefaults,
  ...process.env,
  TURI_HOST: process.env.TURI_HOST ?? '0.0.0.0',
  TURI_PORT: process.env.TURI_PORT ?? process.env.PORT ?? '3000',
  TURI_MCP_PATH: process.env.TURI_MCP_PATH ?? '/mcp',
  TURI_MCP_STATELESS: vercelTaskRoot ? 'true' : (process.env.TURI_MCP_STATELESS ?? 'false'),
  TURI_AUTH_MODE: process.env.TURI_AUTH_MODE ?? 'none',
  TURI_ALLOW_PUBLIC_NO_AUTH: process.env.TURI_ALLOW_PUBLIC_NO_AUTH ?? 'true',
  TURI_ALLOWED_HOSTS: process.env.TURI_ALLOWED_HOSTS ?? '*',
  TURI_ALLOWED_ORIGINS: process.env.TURI_ALLOWED_ORIGINS ?? 'https://chatgpt.com,https://chat.openai.com',
  TURI_AUTHORITY_MODE: process.env.TURI_AUTHORITY_MODE ?? 'candidate',
  TURI_ENABLE_AUTHORIZED_WRITES: process.env.TURI_ENABLE_AUTHORIZED_WRITES ?? 'false',
  TURI_ENABLE_EXTERNAL_EFFECTS: process.env.TURI_ENABLE_EXTERNAL_EFFECTS ?? 'false',
  TURI_DATA_DIR: process.env.TURI_DATA_DIR ?? '/tmp/turi-mcp',
  // Do not pin a rotating quick-tunnel URL here. The stable discovery
  // document is also defaulted in code because file-based Vercel API
  // deployments do not always project vercel.json env values at runtime.
  TURI_UPDIA_BRIDGE_URL: process.env.TURI_UPDIA_BRIDGE_URL?.trim() || '',
  TURI_UPDIA_BRIDGE_DISCOVERY_URL: process.env.TURI_UPDIA_BRIDGE_DISCOVERY_URL?.trim()
    || (vercelTaskRoot ? 'https://gist.githubusercontent.com/xingxuling/6b9edb59043baed2488bcbe3f5031146/raw/updia-bridge-route.json' : ''),
  TURI_UPDIA_BRIDGE_DISCOVERY_FILE: process.env.TURI_UPDIA_BRIDGE_DISCOVERY_FILE?.trim()
    || 'updia-bridge-route.json',
  TURI_UPDIA_BRIDGE_ALLOWED_HOST_SUFFIXES: process.env.TURI_UPDIA_BRIDGE_ALLOWED_HOST_SUFFIXES?.trim()
    || '.trycloudflare.com',
  TURI_UPDIA_BRIDGE_DISCOVERY_CACHE_MS: process.env.TURI_UPDIA_BRIDGE_DISCOVERY_CACHE_MS ?? '30000',
  TURI_UPDIA_BRIDGE_DISCOVERY_CACHE_BUST_MS: process.env.TURI_UPDIA_BRIDGE_DISCOVERY_CACHE_BUST_MS ?? '60000',
  TURI_UPDIA_BRIDGE_ASYNC: process.env.TURI_UPDIA_BRIDGE_ASYNC ?? 'true',
  TURI_UPDIA_BRIDGE_POLL_MS: process.env.TURI_UPDIA_BRIDGE_POLL_MS ?? '1000',
  TURI_UPDIA_DEFAULT_MAX_TOKENS: process.env.TURI_UPDIA_DEFAULT_MAX_TOKENS ?? '512',
  TURI_UPDIA_DEFAULT_MODEL: process.env.TURI_UPDIA_DEFAULT_MODEL?.trim()
    || (vercelTaskRoot ? 'qwen3.5:latest' : ''),
};

let servicePromise;

async function getApp() {
  servicePromise ??= createTuriService({ env }).then((service) => service.app);
  return servicePromise;
}

export default async function turiVercelHandler(request, response, next) {
  try {
    const app = await getApp();
    return app(request, response, next);
  } catch (error) {
    console.error('[turi-vercel-init] failed', error);
    if (!response.headersSent) {
      response.status(500).json({ error: 'TURI_INITIALIZATION_FAILED', message: String(error?.message ?? error).slice(0, 500) });
    }
    return undefined;
  }
}
