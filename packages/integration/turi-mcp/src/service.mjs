import { randomUUID } from 'node:crypto';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { RealityOneGateway } from '@taowind/reality-one-gateway';
import { loadConfig } from './config.mjs';
import { ArtifactStore } from './artifacts/store.mjs';
import { ReceiptStore } from './evidence/receipt.mjs';
import { JobManager, JobStore } from './jobs/store.mjs';
import { CapabilityRegistry } from './registry/capability-registry.mjs';
import { ResourceRegistry } from './registry/resource-registry.mjs';
import { checkHttpRequest } from './security/policy.mjs';
import { RclAdapter } from './adapters/rcl.mjs';
import { RncsAdapter } from './adapters/rncs.mjs';
import { UpdiaAdapter } from './adapters/updia.mjs';
import { GameBrainAdapter } from './adapters/gamebrain.mjs';
import { TuriOrchestrator } from './workflows/orchestrator.mjs';
import { ALIAS_TO_CAPABILITY, createTuriMcpServer } from './server/mcp-server.mjs';
import { GrowthStore } from './growth/store.mjs';
import { GrowthEngine } from './growth/engine.mjs';

const jsonRpcError = (res, status, message, code = -32000) => res.status(status).json({ jsonrpc: '2.0', error: { code, message }, id: null });
const sessionIdOf = (req) => { const value = req.headers['mcp-session-id']; return Array.isArray(value) ? value[0] : value; };

export async function createTuriService(options = {}) {
  const config = options.config?.version && options.config?.dataDir ? options.config : loadConfig(options.env, options.config ?? options);
  const gateway = options.gateway ?? new RealityOneGateway({ manifestDirs: config.manifestDirs, dataDir: config.dataDir });
  await gateway.discover();
  const adapters = options.adapters ?? {
    rcl: new RclAdapter({ rclRoot: config.rclRoot }),
    rncs: new RncsAdapter({ gateway, dataDir: config.dataDir, config }),
    updia: new UpdiaAdapter({ config }),
    gamebrain: new GameBrainAdapter({ config, dataDir: config.dataDir }),
  };
  const registry = options.registry ?? new CapabilityRegistry();
  const receipts = options.receipts ?? new ReceiptStore(config.dataDir);
  const artifacts = options.artifacts ?? new ArtifactStore(config.dataDir, config.maxArtifactBytes);
  const orchestrator = options.orchestrator ?? new TuriOrchestrator({ config, adapters, artifacts });
  const growthStore = options.growthStore ?? new GrowthStore(config.dataDir);
  const growth = options.growth ?? new GrowthEngine({ store: growthStore, registry, orchestrator, rcl: adapters.rcl, config });
  const jobStore = options.jobStore ?? new JobStore(config.dataDir);
  const workflowAliases = {
    'turi.workflow.intent-to-reality': (input, context) => orchestrator.intentToReality(input, context),
    'turi.workflow.engineering-task': (input, context) => orchestrator.engineeringTask(input, context),
    'turi.workflow.world-task': (input, context) => orchestrator.worldTask(input, context),
    'turi.workflow.cinematic-task': (input, context) => orchestrator.cinematicTask(input, context),
    'turi.workflow.research-task': (input, context) => orchestrator.researchTask(input, context),
    intent_to_reality: (input, context) => orchestrator.intentToReality(input, context),
    engineering_task: (input, context) => orchestrator.engineeringTask(input, context),
    world_task: (input, context) => orchestrator.worldTask(input, context),
    cinematic_task: (input, context) => orchestrator.cinematicTask(input, context),
    research_task: (input, context) => orchestrator.researchTask(input, context),
  };
  const jobs = options.jobs ?? new JobManager({ store: jobStore, workflows: workflowAliases, maxTimeoutMs: config.jobTimeoutMs });
  const resources = options.resources ?? new ResourceRegistry({ config, registry, adapters, receipts, artifacts, jobs, docs: { integration: 'TURI v0.1 reuses the RCL MCP JSON-RPC handler and RNCS Reality One Gateway. UPDIA is called through the WorldSeed LocalInteractionRoot JSONL bridge when configured.' } });

  const createServer = () => createTuriMcpServer({ config, registry, orchestrator, receipts, artifacts, jobs, resources, adapters, growth });
  // The MCP SDK performs exact Host matching and does not understand '*'.
  // Keep wildcard handling in TURI's Bearer/Origin policy for cloud platforms
  // whose public hostname is assigned after deployment.
  const sdkAllowedHosts = config.allowedHosts.includes('*') ? undefined : config.allowedHosts;
  const app = createMcpExpressApp({ host: config.host, allowedHosts: sdkAllowedHosts });
  const sessions = new Map();
  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');
  app.use(config.mcpPath, (req, res, next) => {
    try { checkHttpRequest(config, req); next(); } catch (error) { res.status(error.code === 'AUTHENTICATION_REQUIRED' ? 401 : 403).json({ error: error.code, message: error.message }); }
  });
  app.get('/health', async (req, res) => { try { res.status(200).json(await health()); } catch (error) { res.status(503).json({ status: 'unhealthy', error: error.code ?? error.message }); } });
  app.get('/healthz', async (req, res) => { try { res.status(200).json(await health()); } catch (error) { res.status(503).json({ status: 'unhealthy', error: error.code ?? error.message }); } });
  app.get('/version', (req, res) => res.json({ name: config.name, version: config.version, protocol: '2025-06-18' }));
  app.get(`${config.mcpPath}/manifest`, (req, res) => res.json({ name: config.name, version: config.version, transport: 'streamable-http', mcpEndpoint: `${config.mcpPath}`, authorityMode: config.authorityMode, toolCount: ALIAS_TO_CAPABILITY.size, registry: registry.summary() }));

  const createSession = async (transport) => { const server = createServer(); await server.connect(transport); return server; };
  app.post(config.mcpPath, async (req, res) => {
    try {
      const id = sessionIdOf(req);
      if (id) {
        const session = sessions.get(id);
        if (!session) return jsonRpcError(res, 404, 'Session not found.');
        session.lastAccess = Date.now();
        await session.transport.handleRequest(req, res, req.body);
        return;
      }
      if (!isInitializeRequest(req.body)) return jsonRpcError(res, 400, 'Initialization request or valid MCP session id required.', -32600);
      let server;
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID(), enableJsonResponse: config.jsonResponses, onsessioninitialized: (sessionId) => sessions.set(sessionId, { transport, server, lastAccess: Date.now() }) });
      transport.onclose = () => { if (transport.sessionId) sessions.delete(transport.sessionId); };
      server = await createSession(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[turi-mcp] POST failed', error);
      if (!res.headersSent) jsonRpcError(res, 500, 'Internal TURI MCP server error.', -32603);
    }
  });
  app.get(config.mcpPath, async (req, res) => {
    const id = sessionIdOf(req);
    const session = id ? sessions.get(id) : null;
    if (!session) return jsonRpcError(res, 400, 'Valid MCP session id required.', -32600);
    session.lastAccess = Date.now();
    try { await session.transport.handleRequest(req, res); } catch (error) { if (!res.headersSent) jsonRpcError(res, 500, 'Internal TURI MCP server error.', -32603); }
  });
  app.delete(config.mcpPath, async (req, res) => {
    const id = sessionIdOf(req);
    const session = id ? sessions.get(id) : null;
    if (!session) return jsonRpcError(res, 404, 'Session not found.');
    try { await session.transport.handleRequest(req, res); await session.transport.close(); await session.server.close(); sessions.delete(id); } catch (error) { if (!res.headersSent) jsonRpcError(res, 500, 'Internal TURI MCP server error.', -32603); }
  });

  let httpServer = null;
  let cleanupTimer = null;
  const health = async () => {
    const server = createServer();
    try { return await server.__turi.health(); } finally { await server.close().catch(() => {}); }
  };
  const service = {
    config, gateway, adapters, registry, receipts, artifacts, jobs, resources, orchestrator, growth, growthStore, app,
    get exposedTools() { return [...ALIAS_TO_CAPABILITY.keys()]; },
    async start() {
      if (httpServer) return service;
      await new Promise((resolve, reject) => { httpServer = app.listen(config.port, config.host, (error) => error ? reject(error) : resolve()); });
      const address = httpServer.address();
      service.url = `http://${config.host}:${typeof address === 'object' && address ? address.port : config.port}`;
      service.mcpUrl = `${service.url}${config.mcpPath}`;
      cleanupTimer = setInterval(async () => { const cutoff = Date.now() - config.sessionTtlMs; for (const [id, session] of sessions) if (session.lastAccess < cutoff) { sessions.delete(id); await session.transport.close().catch(() => {}); await session.server.close().catch(() => {}); } }, Math.min(60_000, config.sessionTtlMs));
      return service;
    },
    async stop() {
      if (cleanupTimer) clearInterval(cleanupTimer);
      for (const [id, session] of sessions) { await session.transport.close().catch(() => {}); await session.server.close().catch(() => {}); sessions.delete(id); }
      if (httpServer) await new Promise((resolve) => httpServer.close(() => resolve()));
      httpServer = null;
    },
    createServer,
    health,
  };
  return service;
}
