import assert from 'node:assert/strict';
import test from 'node:test';
import {
  prepareFoundationNativeRncsTransition,
} from '../../../integration/rcl-foundation-rncs-bridge/src/index.mjs';
import { rootHash } from '@taowind/rncs-core-contract';
import {
  createEngineProposalInput,
  createSpatialRealityEngineSession,
  verifySpatialEngineSessionSnapshot,
} from '../src/spatial.mjs';

const GENERATION_ROOT = '1'.repeat(64);

function spatialConfig() {
  return {
    format: 'rsr.spatial-embodiment-world.v0.6',
    worldId: 'world:rncs-spatial-session-test',
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

function foundationTransition() {
  return prepareFoundationNativeRncsTransition({
    authorized: true,
    aifDecision: 'stable',
    input: { speechAct: 'create', utterance: 'Create one bounded spatial world candidate.' },
    evidence: [{ type: 'integration-test', id: 'rncs-spatial-engine-session' }],
  }, { baseGenerationRoot: GENERATION_ROOT });
}

function resourceRuntime(log) {
  let sequence = 0;
  return {
    walPath: 'memory://rcl-resource-wal',
    recordOperation(type, input, fn) {
      const result = fn();
      sequence += 1;
      const succeeded = { root: rootHash({ format: 'test-resource-wal', sequence, type, input, result }) };
      const checkpoint = { root: rootHash({ format: 'test-resource-checkpoint', sequence, succeeded: succeeded.root }) };
      log.push({ type, input, result, succeeded, checkpoint });
      return { result, wal: { succeeded, checkpoint } };
    },
  };
}

function proposalInput(realityId = 'reality:rncs-spatial-session-test') {
  return createEngineProposalInput({
    realityId,
    baseGeneration: 0,
    baseGenerationRoot: GENERATION_ROOT,
    transitionId: 'transition:rncs-spatial-session-test',
    subject: {
      subject_id: 'subject:test-root',
      kind: 'updia-root',
      roles: ['planner', 'root-authority'],
      responsibility_boundary: 'candidate-only-until-authorized',
    },
    intent: {
      intent_id: 'intent:rncs-spatial-session-test',
      source: 'RCL governed spatial candidate',
      goals: [{ type: 'rsr.spatial-step' }],
      constraints: ['simulate-before-commit', 'root-authority-required'],
    },
    capabilityPlan: {
      plan_id: 'plan:rncs-spatial-session-test',
      capabilities: [{ capability_id: 'rncs.spatial-engine-session.transition' }],
      host_bindings: [{ host_id: 'rsr-vsr-rcl-bridge' }],
      required_scopes: ['rncs.engine-session.commit'],
    },
    evidence: { nodes: [{ evidence_id: 'evidence:test-intent', kind: 'test-intent' }], edges: [] },
  });
}

function createFixture(command, overrides = {}) {
  const resourceLog = [];
  const session = createSpatialRealityEngineSession({
    sessionId: 'engine-session:rncs-spatial-test',
    realityId: 'reality:rncs-spatial-session-test',
    spatialConfig: spatialConfig(),
    spatialCommands: [command],
    spatialTicks: 1,
    spatialProjectionOptions: { width: 320, height: 200, qualityTier: 'economy' },
    foundationTransition: foundationTransition(),
    resourceRuntime: resourceRuntime(resourceLog),
    ...overrides,
  });
  return { session, resourceLog };
}

test('spatial RNCS session keeps RSR authoritative state inert until commit', async () => {
  const { session, resourceLog } = createFixture({
    id: 'command:avatar-velocity',
    tick: 1,
    type: 'set-velocity',
    bodyId: 'avatar',
    velocity: { x: 450, y: 0, z: 0 },
  });
  const before = session.spatialSnapshot();
  const proposal = session.propose(proposalInput());
  assert.equal(proposal.foundation_governance.evidenceRequirements.some(item => item.kind === 'rcl-foundation-native-receipt'), true);
  assert.equal(proposal.foundation_governance.providerCapabilities.required.some(item => item.mode === 'bridge'), true);
  assert.equal(session.spatialSnapshot().stateRoot, before.stateRoot);

  const simulation = session.simulate();
  assert.equal(simulation.valid, true);
  assert.equal(simulation.spatial.frameVerification.ok, true);
  assert.notEqual(simulation.spatial.afterStateRoot, before.stateRoot);
  assert.equal(simulation.spatial.authorityFrame.sourceStateRoot, simulation.spatial.rsrAfterStateRoot);
  assert.equal(simulation.spatial.temporalPacket.sourceStateRoot, simulation.spatial.rsrAfterStateRoot);
  assert.equal(simulation.spatial.temporalPacket.sourcePacketRoot, simulation.spatial.authorityFrame.frameRoot);
  assert.equal(session.spatialSnapshot().stateRoot, before.stateRoot);
  assert.equal(resourceLog.length, 1);

  await assert.rejects(() => session.commit({ startNetwork: false }), error => error.code === 'SPATIAL_COMMIT_PHASE_INVALID');
  session.authorize({ resolver: 'subject:test-root', claims: [{ kind: 'human-root-review' }] });
  const committed = await session.commit({ startNetwork: false });

  assert.equal(committed.snapshot.status, 'committed');
  assert.equal(committed.applied.stateRoot, simulation.spatial.afterStateRoot);
  assert.equal(committed.applied.frameRoot, simulation.spatial.frameRoot);
  assert.equal(committed.snapshot.state_root, simulation.spatial.afterStateRoot);
  assert.equal(committed.snapshot.spatial.authoritative_snapshot.stateRoot, simulation.spatial.rsrAfterStateRoot);
  assert.equal(committed.applied.authorityFrame.frameRoot, simulation.spatial.authorityFrame.frameRoot);
  assert.equal(committed.applied.temporalPacket.packetRoot, simulation.spatial.temporalPacket.packetRoot);
  assert.equal(resourceLog.length, 2);
  assert.equal(verifySpatialEngineSessionSnapshot(committed.snapshot).valid, true);
  assert.equal(session.verify().valid, true);
});

test('spatial command counterfactuals change proposal, state, and frame roots', () => {
  const left = createFixture({ id: 'command:left', tick: 1, type: 'set-velocity', bodyId: 'avatar', velocity: { x: 450, y: 0, z: 0 } }).session;
  const right = createFixture({ id: 'command:right', tick: 1, type: 'set-velocity', bodyId: 'avatar', velocity: { x: 0, y: 0, z: 450 } }).session;
  const leftProposal = left.propose(proposalInput());
  const rightProposal = right.propose(proposalInput());
  const leftSimulation = left.simulate();
  const rightSimulation = right.simulate();

  assert.notEqual(leftProposal.proposal_root, rightProposal.proposal_root);
  assert.notEqual(leftSimulation.spatial.afterStateRoot, rightSimulation.spatial.afterStateRoot);
  assert.notEqual(leftSimulation.spatial.frameRoot, rightSimulation.spatial.frameRoot);
});

test('spatial commit rejects a generation root diverging from the verified simulation', async () => {
  const { session } = createFixture({ id: 'command:root-check', tick: 1, type: 'set-velocity', bodyId: 'avatar', velocity: { x: 300, y: 0, z: 0 } });
  session.propose(proposalInput());
  session.simulate();
  session.authorize({ resolver: 'subject:test-root' });
  await assert.rejects(
    () => session.commit({ generationRoot: 'f'.repeat(64), startNetwork: false }),
    error => error.code === 'SPATIAL_COMMIT_ROOT_MISMATCH',
  );
  assert.equal(session.status, 'authorized');
  assert.equal(session.spatialSnapshot().stateRoot, session.snapshot().spatial.initial_state_root);
});

test('spatial commit preserves the RNCS network-start boundary', async () => {
  let networkStarted = 0;
  const compilation = {
    compilation_root: 'a'.repeat(64),
    project_root: 'b'.repeat(64),
    world_config_root: 'c'.repeat(64),
  };
  const networkRuntime = {
    async createSessionFromCompilation({ sessionId, compilation: input }) {
      networkStarted += 1;
      return {
        sessionId,
        compilationRoot: input.compilation_root,
        projectRoot: input.project_root,
        worldConfigRoot: input.world_config_root,
      };
    },
  };
  const { session } = createFixture(
    { id: 'command:network-check', tick: 1, type: 'set-velocity', bodyId: 'avatar', velocity: { x: 240, y: 0, z: 0 } },
    { networkRuntime, networkCompilation: compilation },
  );
  session.propose(proposalInput());
  session.simulate({ networkCompilation: compilation });
  session.authorize({ resolver: 'subject:test-root' });
  const committed = await session.commit();

  assert.equal(networkStarted, 1);
  assert.equal(committed.network.session_id, 'engine-session:rncs-spatial-test');
  assert.equal(committed.network.compilation_root, compilation.compilation_root);
  assert.equal(committed.snapshot.spatial.authoritative_snapshot.stateRoot, committed.applied.rsrStateRoot);
});

test('spatial snapshot verifier catches a tampered VSR frame plan', () => {
  const { session } = createFixture({ id: 'command:tamper-check', tick: 1, type: 'set-velocity', bodyId: 'avatar', velocity: { x: 300, y: 0, z: 0 } });
  session.propose(proposalInput());
  session.simulate();
  const tampered = structuredClone(session.snapshot());
  tampered.spatial.simulation.framePlan.commandRoot = 'e'.repeat(64);
  const verification = verifySpatialEngineSessionSnapshot(tampered);
  assert.equal(verification.valid, false);
  assert.equal(verification.errors.some(error => error.startsWith('SPATIAL_FRAME_INVALID:')), true);
});
