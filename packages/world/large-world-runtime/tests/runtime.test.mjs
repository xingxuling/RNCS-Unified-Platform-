import assert from 'node:assert/strict';
import test from 'node:test';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LARGE_WORLD_CHUNK_FORMAT,
  LARGE_WORLD_REGION_FORMAT,
  LARGE_WORLD_PROCEDURAL_PROVIDER_ID,
  LARGE_WORLD_WIREFRAME_PROVIDER_ID,
  LargeWorldRuntime,
  createLargeWorldRuntime,
  generateChunk,
  generateRegion,
  replayLargeWorldTrace,
  verifyChunk,
  verifyMaterializationBatch,
  verifyDurableBundle,
  verifyDurableRestoreReceipt,
  verifyReplicationDelta,
  verifyReplicationReceipt,
  verifyReplicationSnapshot,
  verifyRegion,
  verifyRuntimeSnapshot,
  verifyStreamResolutionReceipt
} from '../src/index.mjs';

test('generates the same chunk root for the same world seed and a different root for a different seed', () => {
  const a = generateChunk({worldId: 'world:test', seed: 'seed:same', x: 2, z: -1});
  const b = generateChunk({worldId: 'world:test', seed: 'seed:same', x: 2, z: -1});
  const c = generateChunk({worldId: 'world:test', seed: 'seed:other', x: 2, z: -1});
  assert.equal(a.format, LARGE_WORLD_CHUNK_FORMAT);
  assert.equal(a.chunk_root, b.chunk_root);
  assert.deepEqual(a.mesh, b.mesh);
  assert.notEqual(a.chunk_root, c.chunk_root);
  assert.equal(verifyChunk(a).valid, true);
});

test('generates and verifies a default 9 by 9 region with unique chunk roots', () => {
  const region = generateRegion({worldId: 'world:region-test', seed: 'seed:region'});
  assert.equal(region.format, LARGE_WORLD_REGION_FORMAT);
  assert.equal(region.chunks.length, 81);
  assert.equal(new Set(region.chunks.map(chunk => chunk.chunk_id)).size, 81);
  assert.equal(new Set(region.chunks.map(chunk => chunk.chunk_root)).size, 81);
  assert.equal(region.chunks.every(chunk => verifyChunk(chunk).valid), true);
  assert.equal(verifyRegion(region).valid, true);
});

test('shares terrain boundary samples between neighboring chunks', () => {
  const left = generateChunk({worldId: 'world:boundary', seed: 'seed:boundary', x: 0, z: 0, sampleResolution: 8});
  const right = generateChunk({worldId: 'world:boundary', seed: 'seed:boundary', x: 1, z: 0, sampleResolution: 8});
  const leftStride = 9 * 3;
  const rightStride = 9 * 3;
  for (let row = 0; row <= 8; row++) {
    const leftIndex = row * leftStride + 8 * 3 + 1;
    const rightIndex = row * rightStride + 0 * 3 + 1;
    assert.equal(left.mesh.positions[leftIndex], right.mesh.positions[rightIndex]);
  }
});

test('streams a bounded active working set with enter, exit, and hysteresis evidence', () => {
  const runtime = createLargeWorldRuntime({worldId: 'world:stream', seed: 'seed:stream', loadRadius: 1, unloadRadius: 2, maxActiveChunks: 12});
  const first = runtime.observe({x: 0, z: 0});
  assert.equal(first.active_chunk_ids.length, 9);
  assert.equal(first.entered_chunk_ids.length, 9);
  assert.equal(first.exited_chunk_ids.length, 0);
  assert.equal(first.working_set_bytes <= first.max_working_set_bytes, true);
  assert.equal(verifyStreamResolutionReceipt(first).valid, true);

  const held = runtime.observe({x: 256, z: 0});
  assert.equal(held.active_chunk_ids.includes('chunk:world:stream:0:0'), true);
  assert.equal(held.exited_chunk_ids.length, 0);
  assert.equal(verifyStreamResolutionReceipt(held).valid, true);

  const moved = runtime.observe({x: 1024, z: 1024});
  assert.equal(moved.active_chunk_ids.length <= 12, true);
  assert.equal(moved.exited_chunk_ids.length > 0, true);
  assert.equal(verifyStreamResolutionReceipt(moved).valid, true);
});

test('keeps forced chunks in the working set and records unknown force requests', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:force', seed: 'seed:force', loadRadius: 0, unloadRadius: 0, maxActiveChunks: 2});
  const region = runtime.getRegion();
  const far = region.chunks.find(chunk => chunk.coordinates.x === 4 && chunk.coordinates.z === 4);
  const resolution = runtime.observe({x: 0, z: 0, forcedChunkIds: [far.chunk_id, 'chunk:unknown']});
  assert.equal(resolution.active_chunk_ids.includes(far.chunk_id), true);
  assert.deepEqual(resolution.unknown_forced_chunk_ids, ['chunk:unknown']);
  assert.equal(resolution.diagnostics.includes('unknown-forced-chunk:chunk:unknown'), true);
});

test('materializes active chunks through URRF without granting canonical authority', async () => {
  const runtime = new LargeWorldRuntime({
    worldId: 'world:materialize',
    seed: 'seed:materialize',
    loadRadius: 0,
    maxActiveChunks: 1,
    materializeChunk: async ({chunk, authority}) => {
      assert.equal(authority.canonical_state_mutation_allowed, false);
      return {status: 'EXECUTED', runtime: 'procedural-grid-test', output_root: chunk.content_root, evidence_root: rootHash({chunk_root: chunk.chunk_root, provider: 'test'})};
    }
  });
  runtime.observe({x: 0, z: 0});
  const batch = await runtime.materializeActive();
  assert.equal(batch.status, 'EXECUTED');
  assert.equal(batch.receipts.length, 1);
  assert.equal(batch.receipts[0].status, 'EXECUTED');
  assert.equal(batch.canonical_state_mutated, false);
  assert.equal(verifyMaterializationBatch(batch).valid, true);
  const object = runtime.getRepresentationObject(batch.active_chunk_ids[0]);
  assert.equal(object.canonical_owner, 'RNCS');
  assert.equal(object.representation_owner, 'URRF');
  assert.equal(object.object_root.length, 64);
});

test('keeps contract-only materialization explicit when no adapter is present', async () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:contract', seed: 'seed:contract', loadRadius: 0, maxActiveChunks: 1});
  runtime.observe({x: 0, z: 0});
  const batch = await runtime.materializeActive();
  assert.equal(batch.status, 'NOT_EXECUTED');
  assert.equal(batch.receipts[0].status, 'NOT_EXECUTED');
  assert.equal(verifyMaterializationBatch(batch).valid, true);
});

test('keeps procedural and wireframe representations as separate URRF candidates', async () => {
  const runtime = new LargeWorldRuntime({
    worldId: 'world:providers',
    seed: 'seed:providers',
    loadRadius: 0,
    maxActiveChunks: 1,
    materializeWireframeChunk: async ({chunk, authority}) => {
      assert.equal(authority.canonical_state_mutation_allowed, false);
      return {status: 'EXECUTED', runtime: 'wireframe-grid-test', output_root: chunk.content_root, evidence_root: rootHash({chunk_root: chunk.chunk_root, provider: 'wireframe'})};
    }
  });
  const object = runtime.getRepresentationObject('chunk:world:providers:0:0');
  assert.deepEqual(object.representations.map(reference => reference.provider_id).sort(), [LARGE_WORLD_PROCEDURAL_PROVIDER_ID, LARGE_WORLD_WIREFRAME_PROVIDER_ID].sort());
  runtime.observe({x: 0, z: 0});
  const batch = await runtime.materializeActive({providerId: LARGE_WORLD_WIREFRAME_PROVIDER_ID});
  assert.equal(batch.receipts[0].provider_id, LARGE_WORLD_WIREFRAME_PROVIDER_ID);
  assert.equal(batch.receipts[0].chunk_id, 'chunk:world:providers:0:0');
  assert.equal(verifyMaterializationBatch(batch).valid, true);
});

test('snapshot and replay seal deterministic streaming evidence', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:replay', seed: 'seed:replay', loadRadius: 1, maxActiveChunks: 9});
  runtime.observe({x: 0, z: 0});
  runtime.observe({x: 400, z: 0});
  runtime.observe({x: 900, z: 700, forcedChunkIds: ['chunk:world:replay:1:1']});
  const snapshot = runtime.snapshot();
  assert.equal(verifyRuntimeSnapshot(snapshot).valid, true);
  const replay = runtime.replay();
  assert.equal(replay.ok, true);
  assert.equal(replay.replay_root.length, 64);
  assert.equal(replayLargeWorldTrace({worldId: 'world:replay', seed: 'seed:replay', loadRadius: 1, maxActiveChunks: 9}, runtime.trace).ok, true);
});

test('binds canonical world time, authority-gated events, and Fact World Tree roots', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:truth', seed: 'seed:truth', loadRadius: 0, maxActiveChunks: 1});
  const authorityReceipt = {status: 'committed', receipt_root: 'a'.repeat(64), decision_root: null, epoch: 0};
  const first = runtime.recordWorldEvent({
    authorityReceipt,
    subjects: ['subject:weather-system'],
    objects: ['object:region'],
    mutation: {operations: [{op: 'set', path: 'weather', value: 'rain'}]},
    fact: {claim: {weather: 'rain'}, authority_domain: 'world.weather', confidence: 'canonical'}
  });
  assert.equal(first.event.world_time.simulation_tick, 1);
  assert.equal(first.event.authority_receipt.status, 'committed');
  assert.equal(first.canonical_state_mutated, true);
  assert.equal(first.fact.source_events.includes(first.event.event_id), true);
  assert.equal(runtime.eventLog.event_count, 1);
  assert.equal(runtime.factTree.canonical_facts.length, 1);
  assert.equal(runtime.verify().world_truth.time.valid, true);
  assert.equal(runtime.verify().world_truth.event_log.valid, true);
  assert.equal(runtime.verify().world_truth.fact_tree.valid, true);

  const second = runtime.recordWorldEvent({
    authorityReceipt,
    mutation: {operations: [{op: 'set', path: 'weather', value: 'clear'}]}
  });
  assert.ok(second.world_time.simulation_tick > first.world_time.simulation_tick);
  assert.equal(runtime.eventLog.event_count, 2);
  assert.equal(runtime.eventLog.head_event_id, second.event.event_id);
  assert.equal(runtime.verify().world_truth.event_log.valid, true);
  const snapshot = runtime.snapshot();
  assert.equal(snapshot.event_log_root, runtime.eventLog.log_root);
  assert.equal(snapshot.fact_tree_root, runtime.factTree.tree_root);
  assert.equal(verifyRuntimeSnapshot(snapshot).valid, true);
});

test('does not create a canonical world event without an explicit committed authority receipt', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:truth-gate', seed: 'seed:truth-gate'});
  assert.throws(() => runtime.recordWorldEvent({mutation: {operations: [{op: 'set', path: 'weather', value: 'storm'}]}}), /LARGE_WORLD_EVENT_AUTHORITY_RECEIPT_REQUIRED/);
  assert.equal(runtime.eventLog.event_count, 0);
});

test('replicates deterministic world truth between isolated instances with idempotent deltas', () => {
  const options = {worldId: 'world:replication', seed: 'seed:replication', loadRadius: 0, maxActiveChunks: 2};
  const source = new LargeWorldRuntime(options);
  const target = new LargeWorldRuntime(options);
  const baseSnapshot = target.exportReplicationSnapshot();
  assert.equal(verifyReplicationSnapshot(baseSnapshot).valid, true);

  source.observe({x: 0, z: 0});
  const authorityReceipt = {status: 'committed', receipt_root: 'a'.repeat(64), decision_root: null, epoch: 0};
  source.recordWorldEvent({
    authorityReceipt,
    mutation: {operations: [{op: 'set', path: 'weather', value: 'rain'}]},
    fact: {claim: {weather: 'rain'}, authority_domain: 'world.weather', confidence: 'canonical'}
  });
  const firstDelta = source.createReplicationDelta(baseSnapshot);
  assert.equal(firstDelta.events.length, 1);
  assert.equal(firstDelta.facts.length, 1);
  assert.equal(verifyReplicationDelta(firstDelta).valid, true);
  assert.throws(() => target.applyReplicationDelta(firstDelta), /LARGE_WORLD_REPLICATION_AUTHORITY_RECEIPT_REQUIRED/);

  const firstReceipt = target.applyReplicationDelta(firstDelta, {authorityReceipt});
  assert.equal(firstReceipt.status, 'APPLIED');
  assert.equal(verifyReplicationReceipt(firstReceipt).valid, true);
  assert.equal(source.exportReplicationSnapshot().snapshot_root, target.exportReplicationSnapshot().snapshot_root);

  source.recordWorldEvent({authorityReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'clear'}]}});
  const clearDelta = source.createReplicationDelta(target.exportReplicationSnapshot());
  const sourceBeforeStorm = source.exportReplicationSnapshot();
  source.recordWorldEvent({authorityReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'storm'}]}});
  const stormDelta = source.createReplicationDelta(sourceBeforeStorm);
  assert.equal(stormDelta.events.length, 1);
  assert.throws(() => target.applyReplicationDelta(stormDelta, {authorityReceipt}), /LARGE_WORLD_REPLICATION_BASE_SNAPSHOT_MISMATCH/);
  const clearReceipt = target.applyReplicationDelta(clearDelta, {authorityReceipt});
  assert.equal(clearReceipt.status, 'APPLIED');
  const secondReceipt = target.applyReplicationDelta(stormDelta, {authorityReceipt});
  assert.equal(secondReceipt.status, 'APPLIED');
  assert.equal(source.exportReplicationSnapshot().snapshot_root, target.exportReplicationSnapshot().snapshot_root);
  const duplicate = target.applyReplicationDelta(stormDelta, {authorityReceipt});
  assert.equal(duplicate.status, 'DUPLICATE');
  assert.equal(verifyReplicationReceipt(duplicate).valid, true);
});

test('round-trips a durable bundle across a fresh runtime and preserves the replication ledger', () => {
  const options = {worldId: 'world:durable', seed: 'seed:durable', loadRadius: 0, maxActiveChunks: 1};
  const source = new LargeWorldRuntime(options);
  const target = new LargeWorldRuntime(options);
  const base = target.exportReplicationSnapshot();
  const authorityReceipt = {status: 'committed', receipt_root: 'a'.repeat(64), decision_root: null, epoch: 0};
  source.recordWorldEvent({authorityReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'rain'}]}});
  const delta = source.createReplicationDelta(base);
  target.applyReplicationDelta(delta, {authorityReceipt});
  const bundle = JSON.parse(JSON.stringify(target.exportDurableBundle()));
  assert.equal(verifyDurableBundle(bundle).valid, true);

  const restarted = new LargeWorldRuntime(options);
  assert.throws(() => restarted.restoreDurableBundle(bundle), /LARGE_WORLD_REPLICATION_AUTHORITY_RECEIPT_REQUIRED/);
  const restoreReceipt = restarted.restoreDurableBundle(bundle, {authorityReceipt: {status: 'committed', receipt_root: 'b'.repeat(64), decision_root: null, epoch: 0}});
  assert.equal(restoreReceipt.status, 'RESTORED');
  assert.equal(verifyDurableRestoreReceipt(restoreReceipt).valid, true);
  assert.equal(restarted.exportReplicationSnapshot().snapshot_root, target.exportReplicationSnapshot().snapshot_root);
  const duplicate = restarted.applyReplicationDelta(delta, {authorityReceipt});
  assert.equal(duplicate.status, 'DUPLICATE');
  assert.equal(verifyReplicationReceipt(duplicate).valid, true);
});

test('rejects invalid world dimensions and verifies tamper evidence', () => {
  assert.throws(() => generateRegion({width: 0}), /LARGE_WORLD_INTEGER_INVALID/);
  const region = generateRegion({worldId: 'world:tamper', seed: 'seed:tamper'});
  const tampered = structuredClone(region);
  tampered.chunks[0].biome = 'tampered';
  assert.equal(verifyRegion(tampered).valid, false);
});
