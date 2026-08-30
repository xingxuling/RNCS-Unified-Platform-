import assert from 'node:assert/strict';
import test from 'node:test';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LARGE_WORLD_CHUNK_FORMAT,
  LARGE_WORLD_REGION_FORMAT,
  LargeWorldRuntime,
  createLargeWorldRuntime,
  generateChunk,
  generateRegion,
  replayLargeWorldTrace,
  verifyChunk,
  verifyMaterializationBatch,
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

test('rejects invalid world dimensions and verifies tamper evidence', () => {
  assert.throws(() => generateRegion({width: 0}), /LARGE_WORLD_INTEGER_INVALID/);
  const region = generateRegion({worldId: 'world:tamper', seed: 'seed:tamper'});
  const tampered = structuredClone(region);
  tampered.chunks[0].biome = 'tampered';
  assert.equal(verifyRegion(tampered).valid, false);
});
