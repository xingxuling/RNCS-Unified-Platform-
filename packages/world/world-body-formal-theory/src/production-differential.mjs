import {
  SPATIAL_EMBODIMENT_FORMAT,
  SPATIAL_EMBODIMENT_VERSION,
  SpatialEmbodimentWorld,
  verifySpatialEmbodimentSnapshot,
} from '@taowind/reality-simulation-runtime/spatial-embodiment';
import {
  RSR_AUTHORITY_PROTOCOL,
  applyAuthoritativeStateDelta,
  createAuthoritativeStateDelta,
  createAuthoritativeStateFrame,
  verifyAuthoritativeStateDelta,
  verifyAuthoritativeStateFrame,
} from '@taowind/reality-simulation-runtime/network-reconciliation';
import { spatialEmbodimentSnapshotToVSRScene } from '@taowind/reality-simulation-runtime/spatial-embodiment-vsr';
import {
  TemporalPresentationBuffer,
  VSR_TEMPORAL_PRESENTATION_PROTOCOL,
} from '@taowind/visual-state-runtime/temporal-presentation';
import {
  VSR_SPATIAL_REALITY_VERSION,
  compileSpatialFrame,
  evaluatePBRLighting,
  verifySpatialFrame,
} from '@taowind/visual-state-runtime/spatial-reality-3d';
import { canonicalClone, compareUtf8, semanticHash, verifyWorldBodyIR } from '@taowind/world-body-ir';
import {
  rsrReferenceStep,
  verifyRsrTraceRefinement,
  worldBodyToRsrReferenceState,
} from '@taowind/rsr-formal-theory';
import {
  verifyVsrProjectionRefinement,
  worldBodyToVsrReferenceProjection,
} from '@taowind/vsr-formal-theory';

export const WORLD_BODY_PRODUCTION_DIFFERENTIAL_FORMAT = 'taowind.world-body-production-differential.v0.1';

function adaptRsrSnapshot(snapshot, declaredTick) {
  return {
    worldId: snapshot.worldId,
    tick: declaredTick + snapshot.tick,
    bodies: snapshot.bodies.map(body => ({
      id: body.id,
      kind: body.kind,
      transform: { positionMm: canonicalClone(body.position) },
    })),
  };
}

function adaptVsrScene(scene, bindings) {
  return {
    worldId: scene.reality.worldId,
    sourceAuthorityRoot: scene.reality.realityRoot,
    objects: bindings.map(binding => {
      const node = scene.nodes.find(candidate => candidate.id === `body:${binding.physicalBodyId}`);
      if (!node) throw Object.assign(new Error(`WORLD_BODY_PRODUCTION_NODE_MISSING:${binding.physicalBodyId}`), { code: 'WORLD_BODY_PRODUCTION_NODE_MISSING' });
      const translation = node.transform?.translation ?? [0, 0, 0];
      return {
        entityId: binding.entityId,
        visualBodyId: binding.visualBodyId,
        positionMm: {
          x: Math.round(translation[0] * 1000),
          y: Math.round(translation[1] * 1000),
          z: Math.round(translation[2] * 1000),
        },
      };
    }),
  };
}

function check(id, passed, observations = {}) {
  return { id, passed: Boolean(passed), observations: canonicalClone(observations) };
}

function sealReport(report) {
  const canonical = canonicalClone(report);
  return canonicalClone({ ...canonical, evidenceRoot: semanticHash(canonical) });
}

export function runWorldBodyProductionDifferential({
  ir,
  rsrWorldConfig,
  applyWorldBodyVisualBindings,
  visualBindings,
  bindAuthoritativeFrame,
}) {
  const irVerification = verifyWorldBodyIR(ir);
  if (!irVerification.ok) throw Object.assign(new Error('WORLD_BODY_PRODUCTION_IR_INVALID'), { code: 'WORLD_BODY_PRODUCTION_IR_INVALID', details: irVerification.errors });
  if (rsrWorldConfig.format !== SPATIAL_EMBODIMENT_FORMAT) throw Object.assign(new Error('WORLD_BODY_PRODUCTION_RSR_FORMAT_MISMATCH'), { code: 'WORLD_BODY_PRODUCTION_RSR_FORMAT_MISMATCH' });

  const worldA = new SpatialEmbodimentWorld(rsrWorldConfig);
  const worldB = new SpatialEmbodimentWorld(rsrWorldConfig);
  const initialA = worldA.snapshot();
  const initialB = worldB.snapshot();
  const nextA = worldA.step().snapshot;
  const nextB = worldB.step().snapshot;

  const authorityFrameA = createAuthoritativeStateFrame(initialA, { reason: 'world-body-production-differential' });
  const authorityFrameB = createAuthoritativeStateFrame(nextA, { previousStateRoot: initialA.stateRoot, reason: 'world-body-production-differential' });
  const delta = createAuthoritativeStateDelta(initialA, nextA);
  const restored = applyAuthoritativeStateDelta(initialA, delta);

  const generatedTemporalA = bindAuthoritativeFrame(authorityFrameA);
  const generatedTemporalB = bindAuthoritativeFrame(authorityFrameB);
  const policy = ir.temporalPresentationState.policies[0];
  const temporalBuffer = new TemporalPresentationBuffer({
    interpolationDelayTicks: policy.interpolationDelayTicks,
    maximumExtrapolationTicks: policy.maximumExtrapolationTicks,
    teleportDistance: policy.snapDistanceMm,
  });
  temporalBuffer.push(generatedTemporalA.packet);
  temporalBuffer.push(generatedTemporalB.packet);
  const temporalFrame = temporalBuffer.sampleFrame(nextA.tick);

  const sourceScene = spatialEmbodimentSnapshotToVSRScene(initialA);
  const authorityRootBeforeProjection = initialA.stateRoot;
  const boundScene = applyWorldBodyVisualBindings(sourceScene);
  const framePlan = compileSpatialFrame(boundScene);
  const frameVerification = verifySpatialFrame(framePlan);

  const rsrReferenceInitial = worldBodyToRsrReferenceState(ir);
  const rsrReferenceNext = rsrReferenceStep(rsrReferenceInitial);
  const rsrInitialRefinement = verifyRsrTraceRefinement(
    rsrReferenceInitial,
    adaptRsrSnapshot(initialA, ir.temporalPresentationState.clock.tick),
    { toleranceMm: 0 },
  );
  const rsrStepRefinement = verifyRsrTraceRefinement(
    rsrReferenceNext,
    adaptRsrSnapshot(nextA, ir.temporalPresentationState.clock.tick),
    { toleranceMm: 1 },
  );

  const vsrReference = worldBodyToVsrReferenceProjection(ir);
  const vsrProduction = adaptVsrScene(boundScene, visualBindings);
  const vsrRefinement = verifyVsrProjectionRefinement(vsrReference, vsrProduction, { toleranceMm: 0 });

  const pbrInput = {
    baseColor: [0.8, 0.2, 0.1], metallic: 0.35, roughness: 0.5, ior: 1.5,
    clearcoat: 0.1, clearcoatRoughness: 0.3,
    normal: [0, 1, 0], view: [0, 1, 1], light: [0, 1, 0], radiance: [1, 0.9, 0.8],
  };
  const pbrA = evaluatePBRLighting(pbrInput);
  const pbrB = evaluatePBRLighting(pbrInput);
  const pbrQ = pbrA.map(value => Math.round(value * 1_000_000));

  const checks = [
    check('WB-PD-01-IR-VERIFIED', irVerification.ok, { worldBodyRoot: ir.roots.worldBodyRoot }),
    check('WB-PD-02-RSR-SNAPSHOTS-VERIFIED', [initialA, nextA].every(verifySpatialEmbodimentSnapshot), { initialStateRoot: initialA.stateRoot, nextStateRoot: nextA.stateRoot }),
    check('WB-PD-03-RSR-DETERMINISTIC-REPLAY', initialA.stateRoot === initialB.stateRoot && nextA.stateRoot === nextB.stateRoot, { initialStateRoot: initialA.stateRoot, nextStateRoot: nextA.stateRoot }),
    check('WB-PD-04-AUTHORITY-FRAMES-VERIFIED', verifyAuthoritativeStateFrame(authorityFrameA) && verifyAuthoritativeStateFrame(authorityFrameB), { frameRoots: [authorityFrameA.frameRoot, authorityFrameB.frameRoot] }),
    check('WB-PD-05-DELTA-ROUNDTRIP', verifyAuthoritativeStateDelta(delta) && restored.stateRoot === nextA.stateRoot, { deltaRoot: delta.deltaRoot, targetStateRoot: nextA.stateRoot }),
    check('WB-PD-06-TEMPORAL-AUTHORITY-BINDING', temporalFrame.authorityStateRoot === nextA.stateRoot && generatedTemporalB.packet.sourceStateRoot === nextA.stateRoot, { temporalFrameRoot: temporalFrame.frameRoot, authorityStateRoot: temporalFrame.authorityStateRoot }),
    check('WB-PD-07-VSR-FRAME-VERIFIED', frameVerification.ok, { frameRoot: framePlan.frameRoot, commandRoot: framePlan.commandRoot, diagnosticCount: frameVerification.diagnostics.length }),
    check('WB-PD-08-PRESENTATION-NONINTERFERENCE', initialA.stateRoot === authorityRootBeforeProjection && boundScene.reality.realityRoot === ir.authorityState.sourceRealityRoot, { authorityStateRoot: initialA.stateRoot, sourceRealityRoot: boundScene.reality.realityRoot }),
    check('WB-PD-09-RSR-INITIAL-REFINEMENT', rsrInitialRefinement.ok, { toleranceMm: rsrInitialRefinement.toleranceMm, errorCount: rsrInitialRefinement.errors.length }),
    check('WB-PD-10-RSR-STEP-REFINEMENT', rsrStepRefinement.ok, { toleranceMm: rsrStepRefinement.toleranceMm, errorCount: rsrStepRefinement.errors.length }),
    check('WB-PD-11-VSR-PROJECTION-REFINEMENT', vsrRefinement.ok, { toleranceMm: vsrRefinement.toleranceMm, errorCount: vsrRefinement.errors.length }),
    check('WB-PD-12-CPU-PBR-DETERMINISM', pbrA.every((value, index) => Number.isFinite(value) && value >= 0 && value === pbrB[index]), { pbrQ }),
  ].sort((left, right) => compareUtf8(left.id, right.id));

  return sealReport({
    format: WORLD_BODY_PRODUCTION_DIFFERENTIAL_FORMAT,
    evidenceClass: 'PARTIAL_PRODUCTION_DIFFERENTIAL',
    status: checks.every(item => item.passed) ? 'PASS' : 'FAIL',
    runtimeFacts: {
      rsrPackageVersion: SPATIAL_EMBODIMENT_VERSION,
      rsrWorldFormat: SPATIAL_EMBODIMENT_FORMAT,
      authorityProtocol: RSR_AUTHORITY_PROTOCOL,
      vsrPackageVersion: VSR_SPATIAL_REALITY_VERSION,
      temporalProtocol: VSR_TEMPORAL_PRESENTATION_PROTOCOL,
    },
    selectedScope: [
      'generated RSR configuration', 'RSR deterministic step and sealed snapshots',
      'authoritative frames and deltas', 'VSR temporal authority binding',
      'generated visual binding', 'VSR CPU frame-plan verification',
      'selected RSR/VSR formal refinement observables', 'CPU PBR function determinism',
    ],
    excludedScope: [
      'real browser or target GPU execution', 'pixel equivalence', 'external physics engines',
      'packet-loss network recovery', 'production asset providers', 'target-hardware performance',
    ],
    checks,
  });
}
