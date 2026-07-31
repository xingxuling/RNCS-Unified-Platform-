import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '../../..');
const RUNTIME_REPO_ROOT = fs.existsSync(path.join(process.cwd(), 'packages')) ? process.cwd() : REPO_ROOT;

const truthy = (value, fallback = false) => value === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
const list = (value) => String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
const integer = (value, fallback, min, max) => {
  const parsed = Number(value ?? fallback);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
};

export function loadConfig(env = process.env, overrides = {}) {
  const repoRoot = path.resolve(overrides.repoRoot ?? env.TURI_REPO_ROOT ?? RUNTIME_REPO_ROOT);
  const host = String(overrides.host ?? env.TURI_HOST ?? '127.0.0.1');
  const port = integer(overrides.port ?? env.TURI_PORT ?? env.PORT, 8797, 0, 65535);
  const mcpPath = String(overrides.mcpPath ?? env.TURI_MCP_PATH ?? '/mcp');
  if (!mcpPath.startsWith('/') || mcpPath.includes('..')) throw new Error('TURI_MCP_PATH must be an absolute URL path without traversal.');
  const authMode = String(overrides.authMode ?? env.TURI_AUTH_MODE ?? 'none').toLowerCase();
  if (!['none', 'bearer'].includes(authMode)) throw new Error('TURI_AUTH_MODE must be none or bearer.');
  const bearerToken = String(overrides.bearerToken ?? env.TURI_BEARER_TOKEN ?? '');
  if (authMode === 'bearer' && bearerToken.length < 24) throw new Error('TURI_BEARER_TOKEN must contain at least 24 characters.');
  const configuredHostResumeSecret = String(overrides.hostResumeSecret ?? env.TURI_HOST_RESUME_SECRET ?? bearerToken).trim();
  const authorityToken = String(overrides.authorityToken ?? env.TURI_AUTHORITY_TOKEN ?? '');
  const authorityMode = String(overrides.authorityMode ?? env.TURI_AUTHORITY_MODE ?? 'candidate').toLowerCase();
  if (!['read_only', 'candidate', 'authorized'].includes(authorityMode)) throw new Error('TURI_AUTHORITY_MODE must be read_only, candidate, or authorized.');
  const authorizedWritesEnabled = authorityMode === 'authorized' && truthy(overrides.authorizedWritesEnabled ?? env.TURI_ENABLE_AUTHORIZED_WRITES);
  const externalEffectsEnabled = authorizedWritesEnabled && truthy(overrides.externalEffectsEnabled ?? env.TURI_ENABLE_EXTERNAL_EFFECTS);
  if ((authorizedWritesEnabled || externalEffectsEnabled) && authorityToken.length < 24) throw new Error('Authorized TURI modes require TURI_AUTHORITY_TOKEN with at least 24 characters.');
  const publicBinding = !['127.0.0.1', 'localhost', '::1'].includes(host);
  const allowedOrigins = overrides.allowedOrigins ?? list(env.TURI_ALLOWED_ORIGINS || 'https://chatgpt.com,https://chat.openai.com,http://localhost,http://127.0.0.1');
  const configuredHosts = overrides.allowedHosts ?? list(env.TURI_ALLOWED_HOSTS);
  const allowedHosts = configuredHosts.length ? [...new Set(configuredHosts)] : publicBinding ? [] : ['127.0.0.1', 'localhost', '[::1]'];
  if (publicBinding && !allowedHosts.length) throw new Error('Public TURI binding requires TURI_ALLOWED_HOSTS.');
  if (publicBinding && authMode === 'none' && !truthy(overrides.allowPublicNoAuth ?? env.TURI_ALLOW_PUBLIC_NO_AUTH)) throw new Error('Public no-auth TURI requires TURI_ALLOW_PUBLIC_NO_AUTH=true.');
  if (publicBinding && configuredHostResumeSecret.length < 32) throw new Error('Public TURI host intervention requires TURI_HOST_RESUME_SECRET with at least 32 characters.');
  const dataDir = path.resolve(overrides.dataDir ?? env.TURI_DATA_DIR ?? path.join(repoRoot, 'output/turi-mcp'));
  const hostResumeSecret = configuredHostResumeSecret || crypto.createHash('sha256').update(`turi-local-host-resume:${repoRoot}:${dataDir}`).digest('hex');
  const updiaRoot = String(overrides.updiaRoot ?? env.TURI_UPDIA_ROOT ?? '').trim();
  const gamebrainRoot = String(overrides.gamebrainRoot ?? env.TURI_GAMEBRAIN_ROOT ?? updiaRoot).trim();
  const updiaEntry = String(overrides.updiaEntry ?? env.TURI_UPDIA_ENTRY ?? (updiaRoot ? path.join(updiaRoot, 'src/updia/local-interaction/cli.mjs') : '')).trim();
  const updiaStateDir = String(overrides.updiaStateDir ?? env.TURI_UPDIA_STATE_DIR ?? '').trim();
  const updiaCheckpoint = String(overrides.updiaCheckpoint ?? env.TURI_UPDIA_CHECKPOINT ?? env.TURI_UPDIA_BOOTSTRAP_CHECKPOINT ?? '').trim();
  const updiaKnowledgeStorePath = String(overrides.updiaKnowledgeStorePath ?? env.TURI_UPDIA_KNOWLEDGE_STORE ?? env.TURI_UPDIA_KNOWLEDGE_STORE_PATH ?? '').trim();
  const updiaBridgeUrl = String(overrides.updiaBridgeUrl ?? env.TURI_UPDIA_BRIDGE_URL ?? '').trim().replace(/\/+$/, '');
  const updiaBridgeDiscoveryUrl = String(overrides.updiaBridgeDiscoveryUrl ?? env.TURI_UPDIA_BRIDGE_DISCOVERY_URL ?? '').trim();
  const updiaBridgeDiscoveryFile = String(overrides.updiaBridgeDiscoveryFile ?? env.TURI_UPDIA_BRIDGE_DISCOVERY_FILE ?? 'updia-bridge-route.json').trim();
  const updiaBridgeAllowedHostSuffixes = overrides.updiaBridgeAllowedHostSuffixes ?? list(env.TURI_UPDIA_BRIDGE_ALLOWED_HOST_SUFFIXES || '.trycloudflare.com');
  const updiaBridgeToken = String(overrides.updiaBridgeToken ?? env.TURI_UPDIA_BRIDGE_TOKEN ?? '').trim();
  const updiaDefaultModel = String(overrides.updiaDefaultModel ?? env.TURI_UPDIA_DEFAULT_MODEL ?? '').trim();
  const reasoningMode = String(overrides.reasoningMode ?? env.TURI_REASONING_MODE ?? 'host').trim().toLowerCase();
  if (!['host', 'local'].includes(reasoningMode)) throw new Error('TURI_REASONING_MODE must be host or local.');
  if (updiaBridgeUrl) {
    let parsedBridgeUrl;
    try { parsedBridgeUrl = new URL(updiaBridgeUrl); } catch { throw new Error('TURI_UPDIA_BRIDGE_URL must be an absolute HTTP(S) URL.'); }
    if (!['http:', 'https:'].includes(parsedBridgeUrl.protocol)) throw new Error('TURI_UPDIA_BRIDGE_URL must use http or https.');
  }
  if (updiaBridgeDiscoveryUrl) {
    let parsedDiscoveryUrl;
    try { parsedDiscoveryUrl = new URL(updiaBridgeDiscoveryUrl); } catch { throw new Error('TURI_UPDIA_BRIDGE_DISCOVERY_URL must be an absolute HTTPS URL.'); }
    if (parsedDiscoveryUrl.protocol !== 'https:') throw new Error('TURI_UPDIA_BRIDGE_DISCOVERY_URL must use https.');
  }
  const updiaEndpoints = overrides.updiaEndpoints ?? list(env.TURI_UPDIA_ENDPOINTS || 'http://127.0.0.1:11435');
  const gamebrainCli = String(overrides.gamebrainCli ?? env.TURI_GAMEBRAIN_CLI ?? (gamebrainRoot ? path.join(gamebrainRoot, 'src/cli.mjs') : '')).trim();
  const rclRoot = path.resolve(overrides.rclRoot ?? env.TURI_RCL_ROOT ?? path.join(repoRoot, 'packages/languages/reality-computation-language'));
  const rclControlPlaneDir = path.resolve(overrides.rclControlPlaneDir ?? env.TURI_RCL_CONTROL_PLANE_DIR ?? path.join(repoRoot, 'packages/control/rncs-rcl-control-plane'));
  const manifestDirs = (overrides.manifestDirs ?? list(env.TURI_MANIFEST_DIRS)).length
    ? (overrides.manifestDirs ?? list(env.TURI_MANIFEST_DIRS)).map((item) => path.resolve(item))
    : [path.join(repoRoot, 'packages/control/reality-one-gateway/runtimes')];
  return Object.freeze({
    name: 'TaoWind Unified Reality Intelligence MCP',
    version: '0.1.0-alpha.2',
    repoRoot,
    rclRoot,
    rclControlPlaneDir,
    host,
    port,
    mcpPath,
    authMode,
    bearerToken,
    authorityToken,
    authorityMode,
    authorizedWritesEnabled,
    externalEffectsEnabled,
    publicBinding,
    allowedOrigins,
    allowedHosts,
    trustProxy: truthy(overrides.trustProxy ?? env.TURI_TRUST_PROXY),
    dataDir,
    manifestDirs,
    updiaRoot: updiaRoot || null,
    updiaEntry: updiaEntry || null,
    updiaStateDir: updiaStateDir || null,
    updiaCheckpoint: updiaCheckpoint || null,
    updiaKnowledgeStorePath: updiaKnowledgeStorePath || null,
    updiaBridgeUrl: updiaBridgeUrl || null,
    updiaBridgeDiscoveryUrl: updiaBridgeDiscoveryUrl || null,
    updiaBridgeDiscoveryFile: updiaBridgeDiscoveryFile || 'updia-bridge-route.json',
    updiaBridgeAllowedHostSuffixes: [...new Set(updiaBridgeAllowedHostSuffixes.map((item) => String(item).trim().toLowerCase()).filter(Boolean))],
    updiaBridgeDiscoveryCacheMs: integer(overrides.updiaBridgeDiscoveryCacheMs ?? env.TURI_UPDIA_BRIDGE_DISCOVERY_CACHE_MS, 30_000, 1_000, 300_000),
    updiaBridgeDiscoveryCacheBustMs: integer(overrides.updiaBridgeDiscoveryCacheBustMs ?? env.TURI_UPDIA_BRIDGE_DISCOVERY_CACHE_BUST_MS, 0, 0, 3_600_000),
    updiaBridgeToken: updiaBridgeToken || null,
    updiaBridgeAsync: truthy(overrides.updiaBridgeAsync ?? env.TURI_UPDIA_BRIDGE_ASYNC, true),
    updiaBridgePollMs: integer(overrides.updiaBridgePollMs ?? env.TURI_UPDIA_BRIDGE_POLL_MS, 1_000, 100, 10_000),
    updiaDefaultMaxTokens: integer(overrides.updiaDefaultMaxTokens ?? env.TURI_UPDIA_DEFAULT_MAX_TOKENS, 512, 64, 4_096),
    updiaDefaultModel: updiaDefaultModel || null,
    reasoningMode,
    hostResumeTtlMs: integer(overrides.hostResumeTtlMs ?? env.TURI_HOST_RESUME_TTL_MS, 2 * 60 * 60_000, 60_000, 24 * 60 * 60_000),
    hostResumeSecret,
    hostResumeSecretSource: configuredHostResumeSecret ? (bearerToken && configuredHostResumeSecret === bearerToken ? 'bearer-token' : 'configured') : 'local-derived',
    updiaEndpoints,
    gamebrainRoot: gamebrainRoot || null,
    gamebrainCli: gamebrainCli || null,
    maxOutputBytes: integer(overrides.maxOutputBytes ?? env.TURI_MAX_OUTPUT_BYTES, 200_000, 4_096, 5_000_000),
    maxArtifactBytes: integer(overrides.maxArtifactBytes ?? env.TURI_MAX_ARTIFACT_BYTES, 20_000_000, 4_096, 100_000_000),
    jobTimeoutMs: integer(overrides.jobTimeoutMs ?? env.TURI_JOB_TIMEOUT_MS, 30 * 60_000, 1_000, 24 * 60 * 60_000),
    maxJobRetries: integer(overrides.maxJobRetries ?? env.TURI_MAX_JOB_RETRIES, 1, 0, 3),
    sessionTtlMs: integer(overrides.sessionTtlMs ?? env.TURI_SESSION_TTL_MS, 30 * 60_000, 60_000, 24 * 60 * 60_000),
    rateLimitPerMinute: integer(overrides.rateLimitPerMinute ?? env.TURI_RATE_LIMIT_PER_MINUTE, 120, 1, 10_000),
    jsonResponses: truthy(overrides.jsonResponses ?? env.TURI_JSON_RESPONSES, true),
    statelessHttp: truthy(overrides.statelessHttp ?? env.TURI_MCP_STATELESS, false),
  });
}

export { PACKAGE_ROOT, REPO_ROOT };
