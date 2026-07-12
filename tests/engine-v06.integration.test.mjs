import test from 'node:test';
import assert from 'node:assert/strict';
import { RSR_VERSION, health as rsrHealth, spatial } from '@taowind/reality-simulation-runtime';
import { VSR_VERSION, health as vsrHealth, spatial3d } from '@taowind/visual-state-runtime';

function box(id, x, y, z, kind = 'dynamic', hx = 500, hy = 500, hz = 500) {
  return {
    id,
    kind,
    position: { x, y, z },
    fixtures: [{
      id: `${id}:shape`,
      shape: { type: 'box', halfExtents: { x: hx, y: hy, z: hz } },
      bodyZone: `${id}:body`,
    }],
  };
}

test('RSR v0.8 preserves deterministic oriented-box SAT collision', async () => {
  assert.equal(RSR_VERSION, '0.9.0-alpha.1');
  assert.equal(rsrHealth().version, RSR_VERSION);
  const { SpatialEmbodimentWorld, SPATIAL_EMBODIMENT_FORMAT, degrees } = await spatial();
  const a = box('a', 0, 1000, 0, 'static', 1000, 100, 100);
  const b = box('b', 200, 1000, 200, 'dynamic', 1000, 100, 100);
  a.rotationDeg = { x: 0, y: degrees(45), z: 0 };
  b.rotationDeg = { x: 0, y: degrees(45), z: 0 };
  const config = {
    format: SPATIAL_EMBODIMENT_FORMAT,
    worldId: 'engine-v06-obb',
    stepHz: 60,
    gravity: { x: 0, y: 0, z: 0 },
    floorY: -100_000,
    velocityIterations: 6,
    positionIterations: 4,
    maxSubsteps: 16,
    bodies: [a, b],
    reality: { generation: 1, realityRoot: 'rfe:engine-v06' },
  };
  const first = new SpatialEmbodimentWorld(config).step().snapshot;
  const replay = new SpatialEmbodimentWorld(config).step().snapshot;
  assert.equal(first.contacts.length, 0, 'SAT must reject false AABB overlap');
  assert.equal(first.stateRoot, replay.stateRoot, 'oriented collision replay must be deterministic');
});

test('VSR v0.7 preserves deterministic Cook-Torrance GGX PBR', async () => {
  assert.equal(VSR_VERSION, '0.8.0-alpha.1');
  assert.equal(vsrHealth().version, VSR_VERSION);
  const { evaluatePBRLighting, VSR_SPATIAL_FRAGMENT_WGSL_V04 } = await spatial3d();
  const input = {
    baseColor: [0.8, 0.2, 0.1],
    metallic: 0.35,
    roughness: 0.4,
    ior: 1.5,
    clearcoat: 0.2,
    clearcoatRoughness: 0.12,
    normal: [0, 1, 0],
    view: [0, 1, 1],
    light: [0, 1, 0.5],
    radiance: [3, 2.8, 2.5],
  };
  const first = evaluatePBRLighting(input);
  const replay = evaluatePBRLighting(input);
  assert.deepEqual(first, replay);
  assert.ok(first.every(value => Number.isFinite(value) && value >= 0 && value < 10));
  for (const stage of ['distributionGGX', 'geometrySmith', 'fresnelSchlick']) {
    assert.match(VSR_SPATIAL_FRAGMENT_WGSL_V04, new RegExp(stage));
  }
});

test('RSR authority packets feed VSR temporal presentation without mutating authority', async () => {
  const { RealityNetworkRuntime, createTwoPlayerWorldConfig, NETWORK_PROTOCOL } = await import('@taowind/reality-network-runtime');
  const { networkPacketToTemporalState, TemporalPresentationBuffer, VSR_TEMPORAL_PRESENTATION_PROTOCOL } = await import('@taowind/visual-state-runtime/temporal-presentation');
  const runtime = new RealityNetworkRuntime();
  const sessionId = 'session:engine-v06-authority-presentation';
  await runtime.createSession({
    sessionId,
    worldConfig: createTwoPlayerWorldConfig({ worldId: 'world:engine-v06-authority-presentation' }),
    network: { seed: 606, fixedLatencyTicks: 0 },
    clock: () => '2026-07-03T12:00:00.000Z',
  });
  await runtime.joinSession({
    sessionId,
    subjectId: 'subject:a',
    playerId: 'a',
    characterId: 'character:blue',
    bodyId: 'player-blue',
  });
  const buffer = new TemporalPresentationBuffer({ interpolationDelayTicks: 1, maximumExtrapolationTicks: 2 });
  const initial = runtime.pullSnapshot({ sessionId, reason: 'temporal-initial' });
  assert.equal(initial.protocol, NETWORK_PROTOCOL);
  assert.equal(initial.rsrAuthorityProtocol, 'rsr.authoritative-state.v0.7');
  buffer.push(networkPacketToTemporalState(initial));
  for (let i = 0; i < 5; i++) {
    runtime.submitInput({ sessionId, playerId: 'a', command: { type: 'move', x: 1_000_000, z: i % 2 ? 500_000 : 0 } });
    runtime.advanceServerTick({ sessionId });
    buffer.push(networkPacketToTemporalState(runtime.pullSnapshot({ sessionId, reason: `temporal-${i}` })));
  }
  const authorityBefore = runtime.require(sessionId).server.lastSnapshot.stateRoot;
  const frame = buffer.sampleFrame(runtime.require(sessionId).server.rsrWorld.tick);
  assert.equal(frame.protocol, VSR_TEMPORAL_PRESENTATION_PROTOCOL);
  assert.equal(frame.authorityStateRoot, authorityBefore);
  assert.ok(frame.objects.some(object => object.objectId === 'player-blue'));
  assert.notEqual(frame.frameRoot, authorityBefore, 'presentation proof must remain separate from authority proof');
  assert.equal(runtime.require(sessionId).server.lastSnapshot.stateRoot, authorityBefore, 'presentation cannot mutate RSR authority');
});
