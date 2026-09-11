import assert from 'node:assert/strict';
import test from 'node:test';
import { compileRclAuthorityPlan } from '@taowind/rncs-rcl-control-plane';
import {
  createRclSpatialEngineProposalInput,
  createRclSpatialRealityEngineSession,
  lowerRclSpatialCommandPlan,
  verifyRclRsrSpatialLowering,
} from '../src/index.mjs';
import {
  replaySpatialReplayBundle,
  verifySpatialReplayBundle,
} from '@taowind/reality-engine-session/spatial';

const GENERATION_ROOT = '1'.repeat(64);

function spatialConfig() {
  return {
    format: 'rsr.spatial-embodiment-world.v0.6',
    worldId: 'world:rcl-rsr-spatial-bridge',
    stepHz: 60,
    gravity: { x: 0, y: -9_810, z: 0 },
    floorY: 0,
    bodies: [
      {
        id: 'terrain',
        kind: 'static',
        position: { x: 0, y: 0, z: 0 },
        fixtures: [{
          id: 'terrain:heightfield',
          shape: { type: 'heightfield', columns: 3, rows: 3, sampleSpacing: 1_000, heights: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
        }],
      },
      {
        id: 'avatar',
        kind: 'dynamic',
        position: { x: 500, y: 499, z: 500 },
        fixtures: [{ id: 'avatar:sphere', shape: { type: 'sphere', radius: 500 } }],
        massQ: 1_000_000,
      },
    ],
    reality: { generation: 0, realityRoot: GENERATION_ROOT, evidenceRoot: '2'.repeat(64) },
  };
}

async function authorityPlan() {
  return compileRclAuthorityPlan(`reality RclRsrTerrainCandidate {
    facet rncs.world.world_id : Text = "world:rcl-rsr-spatial-bridge"
    facet rncs.spatial.command.raise.type : Text = "patch-heightfield"
    facet rncs.spatial.command.raise.id : Text = "command:rcl-rsr-raise"
    facet rncs.spatial.command.raise.tick : Number = 1
    facet rncs.spatial.command.raise.body_id : Text = "terrain"
    facet rncs.spatial.command.raise.fixture_id : Text = "terrain:heightfield"
    facet rncs.spatial.command.raise.indices : Sequence = sequence_append(empty_sequence(), 4)
    facet rncs.spatial.command.raise.heights : Sequence = sequence_append(empty_sequence(), 600)
  }`);
}

test('RCL authority plan lowers into the existing RSR/VSR session and replays', async () => {
  const plan = await authorityPlan();
  const { session, lowering } = createRclSpatialRealityEngineSession({
    authorityPlan: plan,
    spatialConfig: spatialConfig(),
    spatialProjectionOptions: { width: 320, height: 200, qualityTier: 'economy' },
  });
  assert.equal(verifyRclRsrSpatialLowering(lowering), true);
  assert.equal(lowering.source_state_root, plan.stateRoot);

  const before = session.spatialSnapshot();
  const proposal = createRclSpatialEngineProposalInput({
    authorityPlan: plan,
    snapshot: before,
    baseGenerationRoot: GENERATION_ROOT,
    projectionOptions: { width: 320, height: 200, qualityTier: 'economy' },
  });
  assert.equal(proposal.extensions.rclSpatialCommandLowering.lowering_root, lowering.lowering_root);
  session.propose(proposal);
  const simulation = session.simulate();

  assert.equal(session.status, 'simulated');
  assert.equal(session.spatialSnapshot().stateRoot, before.stateRoot);
  assert.notEqual(simulation.spatial.rsrAfterStateRoot, before.stateRoot);
  assert.equal(simulation.spatial.frameVerification.ok, true);
  assert.equal(simulation.spatial.causalDelta.facts.some(fact => fact.predicate === 'spatial.heightfield.patch'), true);
  assert.equal(simulation.spatial.plan.commands[0].type, 'patch-heightfield');

  const replayBundle = session.createReplayBundle({
    commands: lowering.commands,
    ticks: 1,
    checkpointEvery: 1,
    metadata: { source_lowering_root: lowering.lowering_root },
  });
  const replayVerification = verifySpatialReplayBundle(replayBundle);
  assert.equal(replayVerification.valid, true);
  const replay = replaySpatialReplayBundle(replayBundle);
  assert.equal(replay.deterministic, true);
  assert.equal(replay.final_state_root, simulation.spatial.rsrAfterStateRoot);
});

test('RCL to RSR lowering rejects tampered command payloads before session execution', async () => {
  const plan = await authorityPlan();
  const lowering = lowerRclSpatialCommandPlan(plan);
  const tampered = structuredClone(lowering);
  tampered.commands[0].samples[0].height = 601;
  assert.equal(verifyRclRsrSpatialLowering(tampered), false);
});
