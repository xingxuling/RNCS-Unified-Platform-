#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RealityOneGateway } from './gateway.mjs';
import { runIntentAuthorityPipeline } from './pipeline.mjs';
import { loadPipelineConfig } from './config.mjs';
import { startServer } from './server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), cmd = args.shift();
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const manifests = (opt('--runtimes') ?? path.join(root, 'runtimes')).split(path.delimiter);
const dataDir = opt('--data') ?? path.join(root, 'output/gateway-data');
const capabilityRegistryPath = opt('--capabilities') ?? path.join(root, 'capabilities', 'capabilities.v0.1.json');
const readJson = file => JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const out = v => process.stdout.write(JSON.stringify(v, null, 2) + '\n');

try {
  if (cmd === 'serve') {
    const { url } = await startServer({ port: Number(opt('--port') ?? 17303), host: opt('--host') ?? '127.0.0.1', manifestDirs: manifests, dataDir, capabilityRegistryPath });
    console.log(`Reality One Gateway: ${url}`);
  } else {
    const g = new RealityOneGateway({ manifestDirs: manifests, dataDir, capabilityRegistryPath });
    await g.discover();
    if (cmd === 'discover') out(g.registry);
    else if (cmd === 'health') out(await g.health());
    else if (cmd === 'capabilities') out(await g.listCapabilities({ text: opt('--text'), runtime_id: opt('--runtime'), standard_verb: opt('--verb'), effect_class: opt('--effect'), readiness: opt('--readiness') }));
    else if (cmd === 'capability') out(await g.describeCapability(opt('--id')));
    else if (cmd === 'match') out(await g.matchCapabilities({ text: opt('--text') ?? args.join(' '), standard_verb: opt('--verb'), effect_class: opt('--effect'), limit: Number(opt('--limit') ?? 10) }));
    else if (cmd === 'invoke-capability') { const invocation = opt('--invocation') ? readJson(opt('--invocation')) : { format: 'rncs.agent-capability-invocation.v0.1', capability_id: opt('--id'), actor: { subject_id: 'subject:cli', scopes: [] }, inputs: {} }; out(await g.invokeCapability(opt('--id') ?? invocation.capability_id, invocation)); }
    else if (cmd === 'invoke') { const runtime = opt('--runtime'), action = opt('--action'), payload = opt('--payload') ? readJson(opt('--payload')) : {}; out(await g.invoke(runtime, action, payload)); }
    else if (cmd === 'pipeline') { const cfg = loadPipelineConfig(opt('--config') ?? path.join(root, 'examples/input/pipeline.json')), dir = path.resolve(opt('--out') ?? path.join(root, 'output/demo')); out(await runIntentAuthorityPipeline(g, cfg, { outDir: dir })); }
    else { console.log('Usage: reality-one discover|health|capabilities|capability|match|invoke-capability|invoke|pipeline|serve'); process.exitCode = 2; }
  }
} catch (e) {
  console.error(JSON.stringify({ error: { code: e.code ?? 'ERROR', message: e.message, details: e.details ?? {} } }, null, 2));
  process.exitCode = 1;
}
