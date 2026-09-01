import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  createRealityChunk,
  createRealityChunkDelta,
  createRealityChunkDeltaReceipt,
  verifyRealityChunk,
  verifyRealityChunkDelta,
  verifyRealityChunkDeltaReceipt
} from '../src/index.mjs';

const root = letter => letter.repeat(64);

function chunk(overrides = {}) {
  return createRealityChunk({
    chunk_id: 'chunk:world:0:0',
    world_id: 'world:test',
    branch_id: 'main',
    spatial_bounds: {x: 0, z: 0, width: 64, depth: 64},
    temporal_bounds: {from_tick: 0, to_tick: 100},
    semantic_bounds: {biome: 'forest'},
    canonical_state_root: root('a'),
    representation_refs: [root('b'), root('c')],
    authority_scope: ['read', 'replicate'],
    dependencies: ['chunk:world:-1:0'],
    residency: {tier: 'RAM', status: 'HOT'},
    content_hash: root('d'),
    delta_root: root('0'),
    dependency_graph_ref: root('e'),
    compression_profile: {codec: 'zstd', level: 3},
    replication_class: 'PRIMARY',
    retention_policy: {mode: 'TTL', ttl_ticks: 500, evictable: true},
    reconstruction_cost: {CPU_MILLI: 20, RAM_MB: 8, NETWORK_KB: 32, ENERGY_MILLI: 4},
    priority_class: 'REPRESENTATION',
    evidence_refs: [root('f')],
    ...overrides
  });
}

test('seals RealityChunk v0.3 metadata for content-addressed reconstruction', () => {
  const value = chunk();
  assert.equal(verifyRealityChunk(value).valid, true);
  assert.equal(value.parent_version, null);
  assert.equal(value.version_root.length, 64);
  assert.equal(value.chunk_root.length, 64);
  const tampered = structuredClone(value);
  tampered.reconstruction_cost.CPU_MILLI += 1;
  assert.equal(verifyRealityChunk(tampered).valid, false);
});

test('binds a delta to parent version, content hash and dependency graph', () => {
  const base = chunk();
  const target = chunk({
    parent_version: base.version_root,
    content_hash: root('1'),
    delta_root: root('2'),
    residency: {tier: 'SSD', status: 'COLD'},
    priority_class: 'BACKGROUND'
  });
  const delta = createRealityChunkDelta({
    base_chunk: base,
    target_chunk: target,
    source_node: 'node:source',
    target_node: 'node:target',
    sequence: 1,
    operations: [{op: 'replace', path: 'content_hash', value: root('1')}]
  });
  assert.equal(verifyRealityChunkDelta(delta).valid, true);
  const tampered = structuredClone(delta);
  tampered.target_chunk.parent_version = root('3');
  assert.equal(verifyRealityChunkDelta(tampered).valid, false);
});

test('seals an idempotent candidate delta receipt without canonical mutation', () => {
  const base = chunk();
  const target = chunk({parent_version: base.version_root, content_hash: root('4'), delta_root: root('5')});
  const delta = createRealityChunkDelta({
    base_chunk: base,
    target_chunk: target,
    source_node: 'node:source',
    target_node: 'node:target',
    sequence: 2,
    operations: [{op: 'replace', path: 'content_hash', value: root('4')}]
  });
  const receipt = createRealityChunkDeltaReceipt({delta, status: 'APPLIED', evidence_refs: [root('6')]});
  assert.equal(verifyRealityChunkDeltaReceipt(receipt).valid, true);
  assert.equal(receipt.canonical_state_mutated, false);
  const duplicate = createRealityChunkDeltaReceipt({delta, status: 'DUPLICATE'});
  assert.equal(verifyRealityChunkDeltaReceipt(duplicate).valid, true);
});

test('rejects a delta that changes chunk identity or world truth root', () => {
  const base = chunk();
  const target = chunk({chunk_id: 'chunk:world:1:0', parent_version: base.version_root});
  assert.throws(() => createRealityChunkDelta({base_chunk: base, target_chunk: target, source_node: 'node:source', target_node: 'node:target', operations: []}), /IDENTITY_MISMATCH/);
});

test('publishes RealityChunk v0.3 schemas with the same candidate-only formats', () => {
  const schemas = [
    ['reality-chunk.v0.3.schema.json', 'rncs.reality-chunk.v0.3'],
    ['reality-chunk-delta.v0.3.schema.json', 'rncs.reality-chunk-delta.v0.3'],
    ['reality-chunk-delta-receipt.v0.3.schema.json', 'rncs.reality-chunk-delta-receipt.v0.3']
  ];
  for (const [name, format] of schemas) {
    const schema = JSON.parse(fs.readFileSync(new URL(`../schemas/${name}`, import.meta.url), 'utf8'));
    assert.equal(schema.type, 'object');
    assert.ok(schema.required.length > 0);
    assert.equal(schema.properties.format.const, format);
    assert.equal(schema.properties.authority.properties.candidate_only.const, true);
    assert.equal(schema.properties.authority.properties.canonical_write_authorized.const, false);
  }
});

console.log('reality chunk contract tests: 5 PASS');
