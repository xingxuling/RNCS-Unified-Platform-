import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startServer } from '../src/server.mjs';

const root = path.resolve(import.meta.dirname, '..');

test('HTTP gateway exposes capability discovery, match and invocation', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reality-one-capability-server-'));
  const runtimeDir = path.join(dir, 'runtimes');
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(path.join(runtimeDir, 'echo.runtime.json'), JSON.stringify({
    format: 'reality-one.runtime-manifest.v0.3', runtime_id: 'rncs.echo', runtime_version: '1.0.0', gateway_protocol_versions: ['0.3.0'],
    transport: { kind: 'stdio', command: process.execPath, args: [path.join(root, 'tests', 'mock-stdio.mjs')] }, actions: ['health', 'echo'], protocols: ['test.echo.v1'], requires: [],
  }));
  const capabilityPath = path.join(dir, 'capabilities.json');
  fs.writeFileSync(capabilityPath, JSON.stringify({ format: 'rncs.agent-capability-registry.v0.1', capabilities: [{
    format: 'rncs.agent-capability.v0.1', capability_id: 'test.echo', runtime_id: 'rncs.echo', runtime_version: '1.0.0', action: 'echo', title: 'Echo Payload', semantic_role: 'Echo test', standard_verb: 'inspect', effect_class: 'READ_ONLY', readiness: { status: 'ready' }, authority: { mode: 'none', required_scopes: [], approval_roles: [] }, evidence: { gateway_receipt: true, domain_receipts: [], required_roots: [] }, reversibility: { class: 'none-needed' }, dependencies: [], aliases: ['echo'], input_schema_ref: null, output_schema_ref: null, preconditions: [], postconditions: [], failure_modes: [],
  }] }));
  const x = await startServer({ port: 0, host: '127.0.0.1', manifestDirs: [runtimeDir], dataDir: path.join(dir, 'data'), capabilityRegistryPath: capabilityPath });
  try {
    const listed = await fetch(`${x.url}/api/capabilities`).then(r => r.json());
    assert.equal(listed.count, 1);
    const described = await fetch(`${x.url}/api/capabilities/test.echo`).then(r => r.json());
    assert.equal(described.capability_id, 'test.echo');
    const matched = await fetch(`${x.url}/api/capabilities/match`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'echo' }) }).then(r => r.json());
    assert.equal(matched.matches[0].capability.capability_id, 'test.echo');
    const invoked = await fetch(`${x.url}/api/capabilities/invoke`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ capability_id: 'test.echo', invocation: { format: 'rncs.agent-capability-invocation.v0.1', capability_id: 'test.echo', actor: { subject_id: 'subject:http', scopes: [] }, inputs: { http: true }, expected_effect: 'READ_ONLY' } }) }).then(r => r.json());
    assert.equal(invoked.status, 'invoked');
    assert.deepEqual(invoked.result.echo, { http: true });
  } finally { x.server.close(); }
});
