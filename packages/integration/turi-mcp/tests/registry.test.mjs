import test from 'node:test';
import assert from 'node:assert/strict';
import { CAPABILITY_MANIFESTS } from '../src/registry/manifests.mjs';
import { CapabilityRegistry } from '../src/registry/capability-registry.mjs';

test('every TURI manifest exposes the safety and evidence contract', () => {
  assert.ok(CAPABILITY_MANIFESTS.length >= 140);
  for (const manifest of CAPABILITY_MANIFESTS) {
    for (const field of ['capabilityId', 'displayName', 'domain', 'inputSchema', 'outputSchema', 'executionMode', 'rollbackSupport', 'evidenceLevel', 'implementation']) {
      assert.ok(manifest[field] !== undefined, `${manifest.capabilityId} is missing ${field}`);
    }
  }
  const evidenceOnly = CAPABILITY_MANIFESTS.filter((item) => item.implementation === 'evidence_only');
  assert.ok(evidenceOnly.length >= 10);
  assert.ok(evidenceOnly.every((item) => item.evidenceLevel === 'static'));
});

test('registry searches, validates, and controls dynamic capability registration', () => {
  const registry = new CapabilityRegistry();
  assert.equal(registry.removeDynamic('turi.health'), false);
  assert.equal(registry.has('turi.health'), true);
  assert.ok(registry.search({ query: 'UPDIA', limit: 100 }).length >= 20);
  assert.equal(registry.validateInput('turi.candidate.execute', { source: '创建一座小型岛屿。' }).source, '创建一座小型岛屿。');
  assert.throws(() => registry.validateInput('turi.candidate.execute', {}), (error) => error.code === 'INVALID_CAPABILITY_INPUT');

  const dynamic = {
    capabilityId: 'research.test.dynamic', displayName: 'Dynamic Test', domain: 'research', description: 'Test route',
    inputSchema: { type: 'object', properties: {}, additionalProperties: true }, outputSchema: { type: 'object' },
    executionMode: 'candidate', rollbackSupport: 'logical', evidenceLevel: 'declared', implementation: 'adapter',
  };
  registry.registerDynamic(dynamic);
  assert.equal(registry.describe(dynamic.capabilityId).implementation, 'adapter');
  assert.throws(() => registry.registerDynamic(dynamic), (error) => error.code === 'CAPABILITY_EXISTS');
  assert.equal(registry.removeDynamic(dynamic.capabilityId), true);
  assert.equal(registry.has(dynamic.capabilityId), false);
});
