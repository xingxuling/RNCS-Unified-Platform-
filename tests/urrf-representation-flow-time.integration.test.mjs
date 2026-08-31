import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRepresentationRef, rootHash, verifyRepresentationFlow, verifyRepresentationFlowSample} from '@taowind/rncs-core-contract';
import {
  RealityRepresentationFabric,
  verifyFabricSnapshot
} from '@taowind/reality-representation-fabric';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_REPRESENTATION_FLOW_TIME_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_REPRESENTATION_FLOW_TIME'));
const root = letter => letter.repeat(64);

test('executes Representation Flow Time through URRF without changing canonical history', () => {
  mkdirSync(outputDir, {recursive: true});
  const provider = {
    manifest: {
      id: 'provider:flow:integration',
      version: 'test',
      manifest_root: root('a'),
      runtimeStatus: 'AVAILABLE',
      capabilities: ['representation.visual.render'],
      authority: {owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection']},
      representation: {kinds: ['mesh'], profiles: [{profile_id: 'mesh.flow.integration', formats: ['model/gltf+json']}]}
    }
  };
  const reference = createRepresentationRef({
    representation_id: 'representation:flow:integration',
    provider_id: provider.manifest.id,
    provider_root: provider.manifest.manifest_root,
    representation_kind: 'mesh',
    representation_formats: ['model/gltf+json'],
    content_root: root('b'),
    representation_profile: {profile_id: 'mesh.flow.integration', formats: ['model/gltf+json']},
    detail_policy: {mode: 'distance-lod', selectors: ['screen-space-size']},
    residency_policy: {mode: 'paged-streaming', selectors: ['working-set']},
    authority_scope: ['representation_candidate', 'visual_projection'],
    availability: 'AVAILABLE'
  });
  const fabric = new RealityRepresentationFabric({providers: [provider]});
  const object = fabric.registerRealityObject({object_id: 'object:flow:integration', state_root: root('c'), representations: [reference]});
  const flow = fabric.createRepresentationFlow({
    flow_id: 'flow:integration:translation',
    object_id: object.object_id,
    source_representation_id: reference.representation_id,
    target_representation_id: reference.representation_id,
    target_state_root: root('d'),
    interval: {source_time_ms: 1000, target_time_ms: 1050, source_tick: 40, target_tick: 41},
    motion_field: {kind: 'TRANSLATION', space: 'world', unit: 'millimeter', source: [0, 0, 0], target: [100, 0, 0]},
    interpolation_policy: {mode: 'LINEAR', extrapolation: 'BOUNDED', max_extrapolation_ms: 5, max_extrapolation_ticks: 1},
    prediction_budget: {max_extrapolation_ms: 5, max_extrapolation_ticks: 1, max_prediction_error_mm: 5, max_prediction_error_mdeg: 25},
    error_budget: {max_position_error_mm: 5, max_rotation_error_mdeg: 25, stale_after_ms: 50},
    safety_bound: {collision_preserving: true, max_displacement_mm: 110},
    evidence_refs: ['integration:deterministic-flow-time']
  });
  const midpoint = fabric.sampleRepresentationFlow({flow_id: flow.flow_id, sample_time_ms: 1025, now_time_ms: 1025, observed_value: [50, 0, 0]});
  const extrapolated = fabric.sampleRepresentationFlow({flow_id: flow.flow_id, sample_time_ms: 1055, now_time_ms: 1055});
  assert.equal(verifyRepresentationFlow(flow).valid, true);
  assert.equal(verifyRepresentationFlowSample(midpoint).valid, true);
  assert.equal(verifyRepresentationFlowSample(extrapolated).valid, true);
  assert.equal(midpoint.interpolation.status, 'INTERPOLATED');
  assert.equal(extrapolated.interpolation.status, 'EXTRAPOLATED');
  assert.equal(midpoint.prediction_error.status, 'PASS');
  assert.throws(() => fabric.sampleRepresentationFlow({flow_id: flow.flow_id, sample_time_ms: 1050, now_time_ms: 1101}), /RNCS_FLOW_STALE_STATE/);
  const after = fabric.getRealityObject(object.object_id);
  assert.equal(after.state_root, root('c'));
  assert.equal(after.object_root, object.object_root);
  const snapshot = fabric.snapshot();
  assert.equal(verifyFabricSnapshot(snapshot), true);

  const reportBase = {
    format: 'urrf.representation-flow-time-report.v0.1',
    object_id: object.object_id,
    canonical_state_root: object.state_root,
    object_root: object.object_root,
    flow_root: flow.flow_root,
    source_state_root: flow.source_state_root,
    target_state_root: flow.target_state_root,
    source_representation_root: flow.source_representation_root,
    target_representation_root: flow.target_representation_root,
    samples: {
      midpoint: {sample_root: midpoint.sample_root, status: midpoint.interpolation.status, value: midpoint.value, prediction: midpoint.prediction_error.status},
      extrapolated: {sample_root: extrapolated.sample_root, status: extrapolated.interpolation.status, alpha_milli: extrapolated.interpolation.alpha_milli}
    },
    gate_results: {
      identity_continuity: flow.identity_continuity.continuous,
      temporal_monotonicity: flow.interval.monotonic,
      max_extrapolation_window: extrapolated.interpolation.status === 'EXTRAPOLATED',
      prediction_error: midpoint.prediction_error.status === 'PASS',
      collision_safety: midpoint.collision_safety.status === 'PASS' && extrapolated.collision_safety.status === 'PASS',
      stale_state: true,
      rollback_compatibility: flow.rollback_compatibility.compatible
    },
    authority: {
      canonical_owner: 'RNCS',
      representation_owner: 'URRF',
      provider_can_write_authoritative_world_state: false,
      canonical_state_mutated: false,
      canonical_write_authorized: false,
      candidate_only: true,
      commit_status: 'NOT_COMMITTED'
    },
    snapshot_root: snapshot.fabric_root,
    notes: 'Candidate-only local Representation Flow Time evidence. The flow preserves object identity across a monotonic interval, permits only bounded extrapolation, records prediction/safety/stale-state checks, and never mutates canonical RNCS history. No sensor truth, real renderer timing, distributed clock synchronization, or production visual-quality claim is made.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'representation-flow-time-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'representation-flow-time-report.json')).byteLength > 1000);
});
