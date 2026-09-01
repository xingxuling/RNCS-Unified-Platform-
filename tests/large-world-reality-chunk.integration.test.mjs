import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {
  rootHash,
  verifyRealityChunk,
  verifyRealityChunkDelta,
  verifyRealityChunkDeltaReceipt
} from '@taowind/rncs-core-contract';
import {LargeWorldRuntime} from '@taowind/large-world-runtime';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_REALITY_CHUNK_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_REALITY_CHUNK'));

test('runs RealityChunk v0.3 snapshot and delta replication across two large-world runtimes', () => {
  mkdirSync(outputDir, {recursive: true});
  const options = {
    worldId: 'world:urrf-v03-reality-chunk',
    seed: 'seed:urrf-v03-reality-chunk',
    width: 5,
    depth: 5,
    chunkSize: 64,
    sampleResolution: 8,
    loadRadius: 1,
    unloadRadius: 1,
    maxActiveChunks: 9
  };
  const source = new LargeWorldRuntime({...options, nodeId: 'node:urrf-chunk-source'});
  const target = new LargeWorldRuntime({...options, nodeId: 'node:urrf-chunk-target'});
  source.observe({x: 0, z: 0});
  target.observe({x: 0, z: 0});
  const chunkId = 'chunk:world:urrf-v03-reality-chunk:0:0';
  const base = target.exportRealityChunkSnapshot(chunkId);
  assert.equal(verifyRealityChunk(base).valid, true);
  const targetChunk = source.exportRealityChunkSnapshot(chunkId, {
    forceCanonical: true,
    parent_version: base.version_root,
    content_hash: rootHash({base_content_hash: base.content_hash, material: 'wetland-night'}),
    delta_root: rootHash({base_version_root: base.version_root, material: 'wetland-night'}),
    replication_class: 'REPLICA',
    priority_class: 'STATE',
    residency: {tier: 'RAM', status: 'HOT'}
  });
  const delta = source.createRealityChunkDelta(base, {
    deltaId: 'delta:urrf-v03-reality-chunk:night',
    targetNode: target.nodeId,
    sequence: 1,
    targetChunk,
    operations: [{op: 'replace', path: 'representation.material', value: 'wetland-night'}]
  });
  assert.equal(verifyRealityChunkDelta(delta).valid, true);
  const receipt = target.applyRealityChunkDelta(delta, {evidenceRefs: [base.chunk_root, targetChunk.chunk_root]});
  assert.equal(receipt.status, 'APPLIED');
  assert.equal(verifyRealityChunkDeltaReceipt(receipt).valid, true);
  const duplicate = target.applyRealityChunkDelta(delta);
  assert.equal(duplicate.status, 'DUPLICATE');
  assert.equal(verifyRealityChunkDeltaReceipt(duplicate).valid, true);
  const replica = target.exportRealityChunkSnapshot(chunkId);
  assert.equal(replica.version_root, targetChunk.version_root);
  assert.equal(replica.chunk_root, targetChunk.chunk_root);
  assert.equal(source.getRegion().world_root, target.getRegion().world_root);
  assert.equal(target.getChunk(chunkId).state_root, replica.canonical_state_root);
  assert.equal(replica.authority.canonical_owner, 'RNCS');
  assert.equal(replica.authority.canonical_write_authorized, false);
  assert.equal(replica.authority.authoritative, false);

  const reportBase = {
    format: 'urrf.v03.large-world-reality-chunk-report.v0.1',
    world_id: options.worldId,
    region_root: source.getRegion().region_root,
    world_root: source.getRegion().world_root,
    chunk_id: chunkId,
    base_chunk_root: base.chunk_root,
    base_version_root: base.version_root,
    target_chunk_root: targetChunk.chunk_root,
    target_version_root: targetChunk.version_root,
    delta_root: delta.delta_root,
    applied_receipt_root: receipt.receipt_root,
    duplicate_receipt_root: duplicate.receipt_root,
    source_node: source.nodeId,
    target_node: target.nodeId,
    canonical_world_root_unchanged: source.getRegion().world_root === target.getRegion().world_root,
    canonical_chunk_state_unchanged: target.getChunk(chunkId).state_root === replica.canonical_state_root,
    replica_status: 'APPLIED_THEN_DUPLICATE',
    authority: {
      canonical_owner: 'RNCS',
      canonical_write_authorized: false,
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    },
    evidence_level: 'LOCAL_RUNTIME_AND_CONTRACT_TEST',
    notes: 'This proves deterministic local snapshot/delta replication and idempotent candidate replica application. It does not prove distributed consensus, production transport, hardware rendering, or provider authority.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'reality-chunk-replication-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
});
