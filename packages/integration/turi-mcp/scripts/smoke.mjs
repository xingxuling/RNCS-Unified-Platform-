import { createTuriService } from '../src/service.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const service = await createTuriService({ config: { host: '127.0.0.1', port: 0, authMode: 'none', allowedHosts: ['127.0.0.1'], allowedOrigins: ['http://localhost'], repoRoot, dataDir: path.join(repoRoot, 'output/turi-smoke') } });
const info = service.createServer().__turi.serverInfo();
console.log(JSON.stringify({ ok: true, version: info.version, registry: info.registry, toolCount: service.exposedTools.length }, null, 2));
await service.stop();
