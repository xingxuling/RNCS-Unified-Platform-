import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RealityOneGateway, loadCapabilityRegistry } from '../src/index.mjs';

const root = path.resolve(import.meta.dirname, '..');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'reality-one-capability-'));

function writeEchoFixture(dir, { scope = false, readiness = 'ready' } = {}) {
  const runtime = {
    format: 'reality-one.runtime-manifest.v0.3',
    runtime_id: 'rncs.echo',
    runtime_version: '1.0.0',
    gateway_protocol_versions: ['0.3.0'],
    transport: { kind: 'stdio', command: process.execPath, args: [path.join(root, 'tests', 'mock-stdio.mjs')] },
    actions: ['health', 'echo'],
    protocols: ['test.echo.v1'],
    requires: [],
  };
  const registry = {
    format: 'rncs.agent-capability-registry.v0.1',
    generated_from: 'test-fixture',
    capabilities: [{
      format: 'rncs.agent-capability.v0.1',
      capability_id: 'test.echo',
      runtime_id: 'rncs.echo',
      runtime_version: '1.0.0',
      action: 'echo',
      title: 'Echo Payload',
      semantic_role: 'Return the payload for deterministic capability tests',
      standard_verb: 'inspect',
      effect_class: 'READ_ONLY',
      readiness: readiness === 'ready' ? { status: 'ready' } : { status: readiness, reason: 'test unstable capability' },
      authority: { mode: scope ? 'scope' : 'none', required_scopes: scope ? ['test.echo'] : [], approval_roles: [], policy_runtime: 'rncs.aaf', decision_action: 'evaluate' },
      evidence: { gateway_receipt: true, domain_receipts: ['test.echo.v1'], required_roots: [], ledger_target: 'Evidence Ledger' },
      reversibility: { class: 'none-needed' },
      dependencies: ['rncs.echo'],
      aliases: ['echo', 'repeat payload'],
      input_schema_ref: null,
      output_schema_ref: null,
      preconditions: [],
      postconditions: ['no mutation'],
      failure_modes: [],
    }],
  };
  const runtimeDir = path.join(dir, 'runtimes');
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(path.join(runtimeDir, 'echo.runtime.json'), JSON.stringify(runtime, null, 2));
  const registryPath = path.join(dir, 'capabilities.json');
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  return { runtimeDir, registryPath };
}

test('curated RNCS capability registry only references declared packaged runtime actions', () => {
  const gateway = new RealityOneGateway({ manifestDirs: [path.join(root, 'runtimes')], dataDir: tmp(), capabilityRegistryPath: path.join(root, 'capabilities', 'capabilities.v0.1.json') });
  return gateway.discover().then(runtimeRegistry => {
    const registry = loadCapabilityRegistry(path.join(root, 'capabilities', 'capabilities.v0.1.json'), runtimeRegistry);
    assert.equal(registry.capabilities.length, 6);
    assert.match(registry.registry_root, /^[0-9a-f]{64}$/);
  });
});

test('list, describe and match capabilities use the semantic overlay', async () => {
  const dir = tmp();
  const fixture = writeEchoFixture(dir);
  const gateway = new RealityOneGateway({ manifestDirs: [fixture.runtimeDir], dataDir: path.join(dir, 'data'), capabilityRegistryPath: fixture.registryPath });
  await gateway.discover();
  const list = await gateway.listCapabilities();
  assert.equal(list.count, 1);
  assert.equal(list.capabilities[0].capability_id, 'test.echo');
  assert.equal((await gateway.describeCapability('test.echo')).action, 'echo');
  const match = await gateway.matchCapabilities({ text: 'repeat payload' });
  assert.equal(match.matches[0].capability.capability_id, 'test.echo');
  assert.ok(match.matches[0].score > 0);
});

test('dry-run performs capability preflight without invoking runtime', async () => {
  const dir = tmp();
  const fixture = writeEchoFixture(dir);
  const gateway = new RealityOneGateway({ manifestDirs: [fixture.runtimeDir], dataDir: path.join(dir, 'data'), capabilityRegistryPath: fixture.registryPath });
  await gateway.discover();
  const result = await gateway.invokeCapability('test.echo', {
    format: 'rncs.agent-capability-invocation.v0.1',
    capability_id: 'test.echo',
    actor: { subject_id: 'subject:test', scopes: [] },
    inputs: { value: 1 },
    dry_run: true,
    expected_effect: 'READ_ONLY',
  });
  assert.equal(result.status, 'preflight-only');
  assert.equal(result.gateway_receipt, null);
});

test('invokeCapability lowers to gateway invoke and returns a receipt-bearing result', async () => {
  const dir = tmp();
  const fixture = writeEchoFixture(dir);
  const gateway = new RealityOneGateway({ manifestDirs: [fixture.runtimeDir], dataDir: path.join(dir, 'data'), capabilityRegistryPath: fixture.registryPath });
  await gateway.discover();
  const invocation = {
    format: 'rncs.agent-capability-invocation.v0.1',
    capability_id: 'test.echo',
    actor: { subject_id: 'subject:test', scopes: [] },
    goal_ref: 'goal:test',
    inputs: { message: 'hello' },
    expected_effect: 'READ_ONLY',
    idempotency_key: 'echo-1',
  };
  const first = await gateway.invokeCapability('test.echo', invocation);
  assert.equal(first.status, 'invoked');
  assert.deepEqual(first.result.echo, { message: 'hello' });
  assert.equal(first.gateway_receipt.runtime_id, 'rncs.echo');
  assert.match(first.gateway_receipt.receipt_root, /^[0-9a-f]{64}$/);
  const second = await gateway.invokeCapability('test.echo', invocation);
  assert.equal(second.cached, true);
  assert.deepEqual(second.result, first.result);
});

test('scope authority blocks missing scopes before runtime invocation', async () => {
  const dir = tmp();
  const fixture = writeEchoFixture(dir, { scope: true });
  const gateway = new RealityOneGateway({ manifestDirs: [fixture.runtimeDir], dataDir: path.join(dir, 'data'), capabilityRegistryPath: fixture.registryPath });
  await gateway.discover();
  await assert.rejects(() => gateway.invokeCapability('test.echo', {
    format: 'rncs.agent-capability-invocation.v0.1',
    capability_id: 'test.echo',
    actor: { subject_id: 'subject:test', scopes: [] },
    inputs: {},
  }), error => error.code === 'CAPABILITY_SCOPE_MISSING');
});

test('experimental and partial capabilities require explicit unstable opt-in', async () => {
  const dir = tmp();
  const fixture = writeEchoFixture(dir, { readiness: 'experimental' });
  const gateway = new RealityOneGateway({ manifestDirs: [fixture.runtimeDir], dataDir: path.join(dir, 'data'), capabilityRegistryPath: fixture.registryPath });
  await gateway.discover();
  await assert.rejects(() => gateway.invokeCapability('test.echo', {
    format: 'rncs.agent-capability-invocation.v0.1',
    capability_id: 'test.echo',
    actor: { subject_id: 'subject:test', scopes: [] },
    inputs: {},
  }), error => error.code === 'CAPABILITY_UNSTABLE_OPT_IN_REQUIRED');
});
