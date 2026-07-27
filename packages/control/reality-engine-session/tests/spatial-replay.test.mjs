import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareSpatialReplayBranches,
  createSpatialReplayBranch,
  createSpatialReplayBundle,
  replaySpatialReplayBundle,
  verifySpatialReplayBundle,
} from '../src/spatial-replay.mjs';
import {
  createEngineProposalInput,
  createSpatialRealityEngineSession,
} from '../src/spatial.mjs';

const GENERATION_ROOT = '1'.repeat(64);

function spatialConfig() {
  return {
    format: 'rsr.spatial-embodiment-world.v0.6',
    worldId: 'world:rncs-spatial-replay-test',
    stepHz: 60,
    gravity: { x: 0, y: -9_810, z: 0 },
    floorY: 0,
    bodies: [
      {
        id: 'floor',
        kind: 'static',
        position: { x: 0, y: 0, z: 0 },
        fixtures: [{ id: 'floor-box', shape: { type: 'box', halfExtents: { x: 8_000, y: 250, z: 8_000 } } }],
      },
      {
        id: 'avatar',
        kind: 'dynamic',
        position: { x: 0, y: 1_200, z: 0 },
        fixtures: [{ id: 'avatar-capsule', shape: { type: 'capsule', radius: 250, halfHeight: 450 } }],
        massQ: 1_000_000,
      },
    ],
    reality: { generation: 0, realityRoot: GENERATION_ROOT, evidenceRoot: '2'.repeat(64) },
  };
}

function projectionOptions() {
  return { width: 320, height: 200, qualityTier: 'economy' };
}

function commands() {
  return [
    { id: 'command:replay-x', tick: 1, type: 'set-velocity', bodyId: 'avatar', velocity: { x: 360, y: 0, z: 0 } },
    { id: 'command:replay-z', tick: 3, type: 'set-velocity', bodyId: 'avatar', velocity: { x: 0, y: 0, z: 360 } },
  ];
}

function bundle(overrides = {}) {
  return createSpatialReplayBundle({
    spatialConfig: spatialConfig(),
    ticks: 4,
    checkpointEvery: 2,
    commands: commands(),
    projectionOptions: projectionOptions(),
    ...overrides,
  });
}

test('spatial replay bundle verifies RSR, VSR and causal roots by replaying the trace', () => {
  const value = bundle();
  const verification = verifySpatialReplayBundle(value);
  assert.equal(verification.valid, true, verification.errors.join(','));
  assert.equal(verification.deterministic, true);
  assert.equal(value.checkpoints.length, 2);

  const replay = replaySpatialReplayBundle(value);
  assert.equal(replay.deterministic, true);
  assert.equal(replay.final_state_root, value.final_snapshot.stateRoot);
  assert.equal(replay.final_frame_root, value.final_projection.frame_root);
  assert.equal(replay.checkpoints.length, value.checkpoints.length);
});

test('same spatial trace and projection contract produce the same bundle root', () => {
  assert.equal(bundle().bundle_root, bundle().bundle_root);
  assert.equal(bundle().final_projection.frame_root, bundle().final_projection.frame_root);
});

test('tampering with a command or frame invalidates the replay bundle', () => {
  const tamperedCommand = bundle();
  tamperedCommand.commands[0].velocity.x += 1;
  const commandVerification = verifySpatialReplayBundle(tamperedCommand);
  assert.equal(commandVerification.valid, false);
  assert.ok(commandVerification.errors.some(error => error.includes('COMMAND_ROOT_MISMATCH') || error.includes('ROOT_MISMATCH')));

  const tamperedFrame = bundle();
  tamperedFrame.checkpoints[0].frame_plan.commandRoot = 'e'.repeat(64);
  const frameVerification = verifySpatialReplayBundle(tamperedFrame);
  assert.equal(frameVerification.valid, false);
  assert.ok(frameVerification.errors.some(error => error.includes('FRAME_INVALID') || error.includes('FRAME_ROOT_MISMATCH')));
});

test('branches fork from a verified checkpoint and compare as counterfactual worlds', () => {
  const parent = bundle({ checkpointEvery: 1 });
  const left = createSpatialReplayBranch(parent, {
    fromCheckpoint: 1,
    branchId: 'branch:counterfactual-left',
    ticks: 2,
    commands: [{ id: 'command:left', tick: 3, type: 'set-velocity', bodyId: 'avatar', velocity: { x: 450, y: 0, z: 0 } }],
  });
  const right = createSpatialReplayBranch(parent, {
    fromCheckpoint: 1,
    branchId: 'branch:counterfactual-right',
    ticks: 2,
    commands: [{ id: 'command:right', tick: 3, type: 'set-velocity', bodyId: 'avatar', velocity: { x: 0, y: 0, z: 450 } }],
  });
  assert.equal(verifySpatialReplayBundle(parent).valid, true);
  assert.equal(verifySpatialReplayBundle(left).valid, true);
  assert.equal(verifySpatialReplayBundle(right).valid, true);
  assert.equal(left.parent_bundle_root, parent.bundle_root);
  assert.equal(left.base_checkpoint_root, parent.checkpoints[1].checkpoint_root);
  const comparison = compareSpatialReplayBranches(left, right);
  assert.equal(comparison.same_state, false);
  assert.equal(comparison.same_frame, false);
  assert.ok(comparison.changed_body_ids.includes('avatar'));
});

test('committed RNCS spatial sessions can export a verified replay branch without mutating authority', async () => {
  const session = createSpatialRealityEngineSession({
    sessionId: 'engine-session:spatial-replay-test',
    realityId: 'reality:spatial-replay-test',
    generationRoot: GENERATION_ROOT,
    spatialConfig: spatialConfig(),
    spatialCommands: [{ id: 'command:session-step', tick: 1, type: 'set-velocity', bodyId: 'avatar', velocity: { x: 240, y: 0, z: 0 } }],
    spatialTicks: 1,
    spatialProjectionOptions: projectionOptions(),
  });
  session.propose(createEngineProposalInput({
    realityId: 'reality:spatial-replay-test',
    baseGeneration: 0,
    baseGenerationRoot: GENERATION_ROOT,
    transitionId: 'transition:spatial-replay-test',
    subject: { subject_id: 'subject:replay-test', kind: 'root-authority', roles: ['planner'] },
    intent: { intent_id: 'intent:spatial-replay-test', source: 'replay integration test', goals: [{ type: 'rsr.spatial-step' }], constraints: ['simulate-before-commit'] },
    capabilityPlan: { plan_id: 'plan:spatial-replay-test', capabilities: [{ capability_id: 'rncs.spatial-engine-session.transition' }], host_bindings: [], required_scopes: ['rncs.engine-session.commit'] },
  }));
  session.simulate();
  session.authorize({ resolver: 'subject:replay-test', claims: [{ kind: 'test-root-approval' }] });
  await session.commit({ startNetwork: false });
  const before = session.spatialSnapshot().stateRoot;
  const replay = session.createReplayBundle({
    branchId: 'branch:session-counterfactual',
    ticks: 2,
    commands: [{ id: 'command:session-counterfactual', tick: 2, type: 'set-velocity', bodyId: 'avatar', velocity: { x: 0, y: 0, z: 180 } }],
  });
  const verification = verifySpatialReplayBundle(replay);
  assert.equal(verification.valid, true, verification.errors.join(','));
  assert.equal(session.spatialSnapshot().stateRoot, before);
});
