import assert from 'node:assert/strict';
import test from 'node:test';
import {createLargeWorldRuntime, verifyRuntimeSnapshot} from '@taowind/large-world-runtime';
import {materializeKernelStateBatch, replaySpatialEmbodiment, SpatialEmbodimentWorld, verifySpatialEmbodimentSnapshot} from '@taowind/reality-simulation-runtime/spatial-embodiment';
import {spatialEmbodimentSnapshotToVSRScene} from '@taowind/reality-simulation-runtime/spatial-embodiment-vsr';
import {
  createLargeWorldRsrTerrainCandidate,
  planLargeWorldRsrTerrainResidency,
  applyLargeWorldRsrTerrainCandidate,
  verifyLargeWorldRsrTerrainCandidate,
  verifyLargeWorldRsrTerrainResidencyAdmission,
  verifyLargeWorldRsrTerrainResidencyTransition,
  LargeWorldRsrTerrainBridgeError,
} from '../src/index.mjs';

function runtimeFixture() {
  const runtime = createLargeWorldRuntime({
    worldId: 'world:large-world-rsr-bridge',
    seed: 'seed:large-world-rsr-bridge',
    width: 3,
    depth: 3,
    chunkSize: 64,
    sampleResolution: 4,
    loadRadius: 1,
    unloadRadius: 1,
    maxActiveChunks: 9,
  });
  const stream = runtime.observe({x: 0, z: 0});
  return {runtime, region: runtime.getRegion(), stream};
}

test('lowers only active Large World chunk samples into the existing Kernel heightfield contract', () => {
  const {region, stream} = runtimeFixture();
  const candidate = createLargeWorldRsrTerrainCandidate({region, streamResolution: stream, tick: 7});
  const verification = verifyLargeWorldRsrTerrainCandidate(candidate, {region});
  assert.equal(verification.valid, true, verification.errors.join(','));
  const admission = planLargeWorldRsrTerrainResidency(candidate, {region, residencyBudget: {maxManagedBodies: 9, maxManagedFixtures: 9, maxHeightfieldSamples: 225}});
  assert.equal(admission.status, 'READY');
  assert.equal(admission.usage.heightfield_sample_count, 225);
  assert.equal(verifyLargeWorldRsrTerrainResidencyAdmission(admission, {candidate, region}).valid, true);
  assert.equal(candidate.active_chunk_ids.length, 9);
  assert.equal(candidate.lowered_chunk_ids.length, 9);
  assert.equal(candidate.batch.format, 'rncs.entity-state-batch.v0.1');
  assert.equal(candidate.source.region_root, region.region_root);
  assert.equal(candidate.source.world_root, region.world_root);
  assert.equal(candidate.source.stream_root, stream.stream_root);
  assert.equal(candidate.source.stream_transition_root, stream.stream_transition.transition_root);
  assert.deepEqual(admission.source_released_chunk_ids, []);
  assert.equal(admission.source_stream_transition_root, stream.stream_transition.transition_root);
  assert.equal(candidate.authority.adapter_authority, 'candidate-artifact-generation-only-no-commit');
  const materialization = materializeKernelStateBatch(candidate.batch);
  assert.equal(materialization.config.bodies.length, 9);
  const terrainBody = materialization.config.bodies.find(body => body.id === 'terrain:chunk:world:large-world-rsr-bridge:0:0');
  assert.ok(terrainBody);
  assert.equal(terrainBody?.kind, 'static');
  assert.equal(terrainBody?.fixtures[0]?.shape.type, 'heightfield');
  if (terrainBody?.fixtures[0]?.shape.type === 'heightfield') {
    assert.equal(terrainBody.fixtures[0].shape.sampleSpacing, 16_000);
    assert.equal(terrainBody.fixtures[0].shape.columns, 5);
    assert.equal(terrainBody.fixtures[0].shape.rows, 5);
    assert.equal(terrainBody.fixtures[0].shape.heights.length, 25);
  }
});

test('runs the lowered terrain through RSR replay and VSR projection without changing source roots', () => {
  const {region, stream} = runtimeFixture();
  const candidate = createLargeWorldRsrTerrainCandidate({region, streamResolution: stream, chunkIds: ['chunk:world:large-world-rsr-bridge:0:0']});
  const materialization = materializeKernelStateBatch(candidate.batch);
  const terrain = materialization.config.bodies[0];
  assert.ok(terrain);
  const avatar = {
    id: 'avatar',
    kind: 'dynamic',
    position: {x: 8_000, y: 4_000, z: 8_000},
    fixtures: [{id: 'avatar:sphere', shape: {type: 'sphere', radius: 500}, tags: ['subject']}],
    tags: ['subject'],
  };
  const config = {
    ...materialization.config,
    worldId: candidate.world_id,
    floorY: -100_000,
    bodies: [terrain, avatar],
    gravity: {x: 0, y: -9_810, z: 0},
    reality: {generation: candidate.generation, realityRoot: candidate.source.world_root, evidenceRoot: candidate.source.stream_root},
  };
  const queryWorld = new SpatialEmbodimentWorld(config);
  const ray = queryWorld.rayCast({x: 24_000, y: 100_000, z: 24_000}, {x: 0, y: -1_000_000, z: 0})[0];
  assert.ok(ray);
  assert.equal(ray?.bodyId, terrain.id);
  assert.ok((ray?.normal?.y ?? 0) > 0);
  const cast = queryWorld.shapeCast({type: 'sphere', radius: 500}, {x: 24_000, y: 100_000, z: 24_000}, {x: 0, y: -1_000_000, z: 0})[0];
  assert.ok(cast);
  assert.equal(cast?.bodyId, terrain.id);
  assert.equal(cast?.method, 'bounded-heightfield-sphere-sweep');
  const snapshot = new SpatialEmbodimentWorld(config).run(120);
  const avatarState = snapshot.bodies.find(body => body.id === 'avatar');
  assert.ok(avatarState);
  assert.equal(avatarState?.grounded, true);
  assert.ok(snapshot.contacts.some(contact => contact.bodyB?.startsWith('terrain:') && contact.fixtureB?.endsWith(':heightfield')));
  assert.equal(replaySpatialEmbodiment(config, 120).stateRoot, snapshot.stateRoot);
  const scene = spatialEmbodimentSnapshotToVSRScene(snapshot);
  assert.ok(scene.meshes.some(mesh => mesh.id === 'mesh:heightfield:terrain:chunk:world:large-world-rsr-bridge:0:0:terrain:chunk:world:large-world-rsr-bridge:0:0:heightfield'));
  assert.equal(candidate.source.region_root, region.region_root);
  assert.equal(candidate.stream_resolution.stream_root, stream.stream_root);
});

test('preserves Large World shared boundary samples across adjacent physical terrain chunks', () => {
  const {region, stream} = runtimeFixture();
  const candidate = createLargeWorldRsrTerrainCandidate({region, streamResolution: stream});
  const materialization = materializeKernelStateBatch(candidate.batch);
  const left = materialization.config.bodies.find(body => body.id === 'terrain:chunk:world:large-world-rsr-bridge:0:0');
  const right = materialization.config.bodies.find(body => body.id === 'terrain:chunk:world:large-world-rsr-bridge:1:0');
  assert.ok(left && right);
  const leftShape = left?.fixtures[0]?.shape;
  const rightShape = right?.fixtures[0]?.shape;
  assert.equal(leftShape?.type, 'heightfield');
  assert.equal(rightShape?.type, 'heightfield');
  if (leftShape?.type === 'heightfield' && rightShape?.type === 'heightfield') {
    for (let row = 0; row < leftShape.rows; row++) {
      assert.equal(leftShape.heights[row * leftShape.columns + leftShape.columns - 1], rightShape.heights[row * rightShape.columns]);
    }
  }
});

test('keeps source and candidate roots fail-closed across inactive chunks and tampering', () => {
  const runtime = createLargeWorldRuntime({
    worldId: 'world:large-world-rsr-bridge-negative',
    seed: 'seed:large-world-rsr-bridge-negative',
    width: 3,
    depth: 3,
    chunkSize: 64,
    sampleResolution: 4,
    loadRadius: 0,
    unloadRadius: 0,
    maxActiveChunks: 1,
  });
  const region = runtime.getRegion();
  const stream = runtime.observe({x: 0, z: 0});
  const outside = region.chunks.find(chunk => chunk.coordinates.x === 1 && chunk.coordinates.z === 1);
  assert.ok(outside);
  assert.throws(
    () => createLargeWorldRsrTerrainCandidate({region, streamResolution: stream, chunks: [outside]}),
    error => error instanceof LargeWorldRsrTerrainBridgeError && error.code === 'LARGE_WORLD_RSR_CHUNK_NOT_ACTIVE',
  );
  const candidate = createLargeWorldRsrTerrainCandidate({region, streamResolution: stream});
  const tampered = structuredClone(candidate);
  tampered.batch.rows[0].fragments['spatial.fixtures'].items[0].shape.heights[0] += 1;
  const verification = verifyLargeWorldRsrTerrainCandidate(tampered, {region});
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.some(error => error.includes('BATCH_ROOT') || error.includes('CANDIDATE_ROOT')));
  const tamperedTransition = structuredClone(candidate);
  tamperedTransition.stream_resolution.stream_transition.released_chunk_ids = ['chunk:forged'];
  const transitionVerification = verifyLargeWorldRsrTerrainCandidate(tamperedTransition, {region});
  assert.equal(transitionVerification.valid, false);
  assert.ok(transitionVerification.errors.includes('LARGE_WORLD_RSR_STREAM_INVALID') || transitionVerification.errors.includes('LARGE_WORLD_RSR_STREAM_TRANSITION_INVALID'));
  const materialization = materializeKernelStateBatch(candidate.batch);
  const world = new SpatialEmbodimentWorld({...materialization.config, worldId: candidate.world_id, floorY: -100_000});
  const before = world.snapshot();
  const blockedAdmission = planLargeWorldRsrTerrainResidency(candidate, {region, residencyBudget: {maxManagedBodies: 0, maxManagedFixtures: 0, maxHeightfieldSamples: 0}});
  assert.equal(blockedAdmission.status, 'BLOCKED_RESOURCE');
  assert.deepEqual(blockedAdmission.exceeded_limits, ['max_managed_bodies', 'max_managed_fixtures', 'max_heightfield_samples']);
  assert.equal(verifyLargeWorldRsrTerrainResidencyAdmission(blockedAdmission, {candidate, region}).valid, true);
  assert.throws(
    () => applyLargeWorldRsrTerrainCandidate(world, candidate, {region, residencyBudget: {maxManagedBodies: 0, maxManagedFixtures: 0, maxHeightfieldSamples: 0}}),
    error => error instanceof LargeWorldRsrTerrainBridgeError && error.code === 'LARGE_WORLD_RSR_PHYSICAL_RESIDENCY_BUDGET_EXCEEDED',
  );
  assert.equal(world.snapshot().stateRoot, before.stateRoot);
});

function runStreamResidencyTransition() {
  const runtime = createLargeWorldRuntime({
    worldId: 'world:large-world-rsr-residency',
    seed: 'seed:large-world-rsr-residency',
    width: 3,
    depth: 3,
    chunkSize: 64,
    sampleResolution: 4,
    loadRadius: 0,
    unloadRadius: 0,
    maxActiveChunks: 1,
  });
  const region = runtime.getRegion();
  const firstStream = runtime.observe({x: 0, z: 0});
  const firstCandidate = createLargeWorldRsrTerrainCandidate({region, streamResolution: firstStream, tick: 0});
  const firstMaterialization = materializeKernelStateBatch(firstCandidate.batch);
  const avatar = {
    id: 'avatar',
    kind: 'dynamic',
    position: {x: 8_000, y: 4_000, z: 8_000},
    fixtures: [{id: 'avatar:sphere', shape: {type: 'sphere', radius: 500}, tags: ['subject']}],
    tags: ['subject'],
  };
  const world = new SpatialEmbodimentWorld({
    ...firstMaterialization.config,
    worldId: firstCandidate.world_id,
    floorY: -100_000,
    bodies: [...firstMaterialization.config.bodies, avatar],
    reality: {generation: firstCandidate.generation, realityRoot: firstCandidate.source.world_root, evidenceRoot: firstCandidate.source.stream_root},
  });
  world.run(30);
  const before = world.snapshot();
  const nextStream = runtime.observe({x: 64, z: 0});
  const nextCandidate = createLargeWorldRsrTerrainCandidate({region, streamResolution: nextStream, tick: world.tick});
  const residencyBudget = {maxManagedBodies: 1, maxManagedFixtures: 1, maxHeightfieldSamples: 25};
  const transition = applyLargeWorldRsrTerrainCandidate(world, nextCandidate, {region, residencyBudget});
  const after = world.snapshot();
  return {region, firstStream, nextStream, firstCandidate, nextCandidate, before, after, transition, world, residencyBudget, largeWorldSnapshot: runtime.snapshot(), largeWorldReplay: runtime.replay()};
}

test('applies Large World stream enter/exit to the same RSR world with deterministic replay', () => {
  const result = runStreamResidencyTransition();
  const {region, nextCandidate, nextStream, before, after, transition, world} = result;
  const beforeTerrain = before.bodies.find(body => body.tags?.includes('large-world-terrain'));
  const afterTerrain = after.bodies.find(body => body.tags?.includes('large-world-terrain'));
  assert.ok(beforeTerrain);
  assert.ok(afterTerrain);
  assert.notEqual(afterTerrain?.id, beforeTerrain?.id);
  assert.equal(after.tick, before.tick);
  assert.deepEqual(after.bodies.find(body => body.id === 'avatar')?.position, before.bodies.find(body => body.id === 'avatar')?.position);
  assert.equal(transition.entered_body_ids.length, 1);
  assert.equal(transition.exited_body_ids.length, 1);
  assert.equal(transition.retained_body_ids.length, 0);
  assert.equal(transition.residency_admission?.status, 'READY');
  assert.equal(transition.residency_admission?.usage.heightfield_sample_count, 25);
  assert.equal(transition.source_candidate_root, nextCandidate.candidate_root);
  assert.equal(transition.source_stream_transition_root, nextStream.stream_transition.transition_root);
  assert.deepEqual(transition.source_released_chunk_ids, nextStream.stream_transition.released_chunk_ids);
  assert.equal(transition.source_released_chunk_ids.length, 1);
  assert.equal(result.largeWorldReplay.ok, true);
  assert.equal(verifyRuntimeSnapshot(result.largeWorldSnapshot).valid, true);
  assert.equal(verifySpatialEmbodimentSnapshot(before), true);
  const verification = verifyLargeWorldRsrTerrainResidencyTransition(transition, {candidate: nextCandidate, region});
  assert.equal(verification.valid, true, verification.errors.join(','));
  const mismatchedTick = createLargeWorldRsrTerrainCandidate({region, streamResolution: result.nextStream, tick: result.before.tick + 1});
  assert.throws(
    () => applyLargeWorldRsrTerrainCandidate(world, mismatchedTick, {region}),
    error => error instanceof LargeWorldRsrTerrainBridgeError && error.code === 'LARGE_WORLD_RSR_TICK_MISMATCH',
  );
  const restoredWorld = SpatialEmbodimentWorld.fromSnapshot(before);
  const restoredTransition = applyLargeWorldRsrTerrainCandidate(restoredWorld, nextCandidate, {region, residencyBudget: result.residencyBudget});
  assert.deepEqual(restoredTransition, transition);
  assert.equal(restoredWorld.step().snapshot.stateRoot, world.step().snapshot.stateRoot);
  const replay = runStreamResidencyTransition();
  assert.deepEqual(replay.transition, transition);
  assert.equal(replay.after.stateRoot, after.stateRoot);
});

console.log('large-world RSR bridge tests: 5 PASS');
