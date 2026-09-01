import assert from 'node:assert/strict';
import test from 'node:test';
import {rootHash, verifyRealityChunk, verifyRealityChunkDelta, verifyRealityChunkDeltaReceipt} from '@taowind/rncs-core-contract';
import {LargeWorldRuntime} from '../src/index.mjs';

const options = {
  worldId: 'world:reality-chunk-runtime',
  seed: 'seed:reality-chunk-runtime',
  width: 3,
  depth: 3,
  chunkSize: 64,
  sampleResolution: 8,
  loadRadius: 1,
  unloadRadius: 1,
  maxActiveChunks: 9
};

test('replicates a RealityChunk v0.3 snapshot into an isolated candidate replica', () => {
  const source = new LargeWorldRuntime({...options, nodeId: 'node:reality-source'});
  const target = new LargeWorldRuntime({...options, nodeId: 'node:reality-target'});
  source.observe({x: 0, z: 0});
  target.observe({x: 0, z: 0});
  const chunkId = 'chunk:world:reality-chunk-runtime:0:0';
  const base = target.exportRealityChunkSnapshot(chunkId);
  assert.equal(verifyRealityChunk(base).valid, true);
  assert.equal(base.replication_class, 'PRIMARY');
  assert.equal(base.residency.status, 'HOT');

  const targetChunk = source.exportRealityChunkSnapshot(chunkId, {
    forceCanonical: true,
    parent_version: base.version_root,
    content_hash: rootHash({base_content_hash: base.content_hash, variant: 'night'}),
    delta_root: rootHash({base_version_root: base.version_root, variant: 'night'}),
    replication_class: 'REPLICA',
    priority_class: 'STATE',
    residency: {tier: 'RAM', status: 'HOT'}
  });
  const delta = source.createRealityChunkDelta(base, {
    targetNode: target.nodeId,
    targetChunk,
    sequence: 1,
    operations: [{op: 'replace', path: 'representation.content_hash', value: targetChunk.content_hash}]
  });
  assert.equal(verifyRealityChunkDelta(delta).valid, true);
  const receipt = target.applyRealityChunkDelta(delta, {evidenceRefs: [delta.target_chunk.chunk_root]});
  assert.equal(receipt.status, 'APPLIED');
  assert.equal(verifyRealityChunkDeltaReceipt(receipt).valid, true);
  assert.equal(target.exportRealityChunkSnapshot(chunkId).version_root, targetChunk.version_root);
  assert.equal(target.listRealityChunkReplicas()[0].chunk_root, targetChunk.chunk_root);
  assert.equal(target.getChunk(chunkId).chunk_root, source.getChunk(chunkId).chunk_root);
  assert.equal(target.getChunk(chunkId).state_root, base.canonical_state_root);

  const duplicate = target.applyRealityChunkDelta(delta);
  assert.equal(duplicate.status, 'DUPLICATE');
  assert.equal(verifyRealityChunkDeltaReceipt(duplicate).valid, true);

  const tampered = structuredClone(delta);
  tampered.operations.push({op: 'replace', path: 'representation.content_hash', value: base.content_hash});
  assert.throws(() => target.applyRealityChunkDelta(tampered), /LARGE_WORLD_REALITY_CHUNK_DELTA_INVALID/);
});

test('rejects a stale RealityChunk parent and a cross-node target', () => {
  const source = new LargeWorldRuntime({...options, nodeId: 'node:reality-source-stale'});
  const target = new LargeWorldRuntime({...options, nodeId: 'node:reality-target-stale'});
  const chunkId = 'chunk:world:reality-chunk-runtime:1:0';
  const base = source.exportRealityChunkSnapshot(chunkId);
  const staleTarget = source.exportRealityChunkSnapshot(chunkId, {
    forceCanonical: true,
    parent_version: rootHash({stale: true}),
    content_hash: rootHash({stale: true}),
    delta_root: rootHash({stale: true}),
    replication_class: 'REPLICA'
  });
  assert.throws(() => source.createRealityChunkDelta(base, {
    targetNode: target.nodeId,
    targetChunk: staleTarget,
    operations: []
  }), /PARENT_VERSION_MISMATCH/);
  const delta = source.createRealityChunkDelta(base, {targetNode: target.nodeId, operations: []});
  assert.throws(() => source.applyRealityChunkDelta(delta), /TARGET_NODE_MISMATCH/);
});

console.log('large-world reality chunk tests: 2 PASS');
