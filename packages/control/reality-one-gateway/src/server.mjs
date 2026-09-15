import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RealityOneGateway } from './gateway.mjs';
import { runIntentAuthorityPipeline } from './pipeline.mjs';
import { loadPipelineConfig } from './config.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const send = (res, code, body, type = 'application/json; charset=utf-8') => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' }); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body, null, 2)); };
const body = req => new Promise((resolve, reject) => { let s = ''; req.on('data', d => { s += d; if (s.length > 5_000_000) { req.destroy(); reject(new Error('body too large')); } }); req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } }); });

export async function startServer({ port = 17303, host = '127.0.0.1', manifestDirs = [path.join(root, 'runtimes')], dataDir = path.join(root, 'output/server'), capabilityRegistryPath = path.join(root, 'capabilities', 'capabilities.v0.1.json') } = {}) {
  const gateway = new RealityOneGateway({ manifestDirs, dataDir, capabilityRegistryPath });
  await gateway.discover();
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return send(res, 204, '');
      const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      if (req.method === 'GET' && u.pathname === '/api/runtimes') return send(res, 200, gateway.registry);
      if (req.method === 'GET' && u.pathname === '/api/health') return send(res, 200, await gateway.health());
      if (req.method === 'GET' && u.pathname === '/api/capabilities') {
        const filters = Object.fromEntries([...u.searchParams.entries()].filter(([, value]) => value !== ''));
        return send(res, 200, await gateway.listCapabilities(filters));
      }
      if (req.method === 'GET' && u.pathname.startsWith('/api/capabilities/')) {
        const capabilityId = decodeURIComponent(u.pathname.slice('/api/capabilities/'.length));
        return send(res, 200, await gateway.describeCapability(capabilityId));
      }
      if (req.method === 'POST' && u.pathname === '/api/capabilities/match') return send(res, 200, await gateway.matchCapabilities(await body(req)));
      if (req.method === 'POST' && u.pathname === '/api/capabilities/invoke') {
        const b = await body(req);
        return send(res, 200, await gateway.invokeCapability(b.capability_id, b.invocation ?? b));
      }
      if (req.method === 'POST' && u.pathname === '/api/invoke') { const b = await body(req); return send(res, 200, await gateway.invoke(b.runtime_id, b.action, b.payload ?? {}, b.options ?? {})); }
      if (req.method === 'POST' && u.pathname === '/api/demo') { const cfg = loadPipelineConfig(path.join(root, 'examples/input/pipeline.json')); cfg.rfe_store_path = path.join(root, 'output/server-demo/rfe-store'); fs.rmSync(path.dirname(cfg.rfe_store_path), { recursive: true, force: true }); return send(res, 200, await runIntentAuthorityPipeline(gateway, cfg, { outDir: path.join(root, 'output/server-demo') })); }
      const file = u.pathname === '/' ? 'index.html' : u.pathname.slice(1), p = path.join(root, 'web', file);
      if (p.startsWith(path.join(root, 'web')) && fs.existsSync(p) && fs.statSync(p).isFile()) { const ext = path.extname(p); return send(res, 200, fs.readFileSync(p), ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'text/javascript; charset=utf-8' : 'text/css; charset=utf-8'); }
      return send(res, 404, { error: 'not found' });
    } catch (e) {
      const code = ['CAPABILITY_NOT_FOUND', 'RUNTIME_NOT_FOUND'].includes(e.code) ? 404 : 400;
      send(res, code, { error: { code: e.code ?? 'ERROR', message: e.message, details: e.details ?? {} } });
    }
  });
  await new Promise(r => server.listen(port, host, r));
  const actual = server.address().port;
  return { server, url: `http://${host}:${actual}`, gateway };
}
