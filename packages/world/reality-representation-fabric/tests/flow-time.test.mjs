import assert from 'node:assert/strict';
import test from 'node:test';
import {createRepresentationRef} from '@taowind/rncs-core-contract';
import {
  RealityRepresentationFabric,
  URRF_REPRESENTATION_FLOW_FORMAT,
  URRF_REPRESENTATION_FLOW_SAMPLE_FORMAT,
  verifyFabricSnapshot
} from '../src/index.mjs';

const root = letter => letter.repeat(64);

function makeProvider() {
  return {
    manifest: {
      id: 'provider:flow:test',
      version: 'test',
      manifest_root: root('a'),
      runtimeStatus: 'AVAILABLE',
      capabilities: ['representation.visual.render'],
      authority: {owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection']},
      representation: {kinds: ['mesh'], profiles: [{profile_id: 'mesh.flow.test', formats: ['model/gltf+json']}]}
    }
  };
}

function makeReference(provider) {
  return createRepresentationRef({
    representation_id: 'representation:flow:test',
    provider_id: provider.manifest.id,
    provider_root: provider.manifest.manifest_root,
    representation_kind: 'mesh',
    representation_formats: ['model/gltf+json'],
    content_root: root('b'),
    representation_profile: {profile_id: 'mesh.flow.test', formats: ['model/gltf+json']},
    detail_policy: {mode: 'distance-lod', selectors: ['screen-space-size']},
    residency_policy: {mode: 'paged-streaming', selectors: ['working-set']},
    authority_scope: ['representation_candidate', 'visual_projection'],
    availability: 'AVAILABLE'
  });
}

test('lowers an RNCS Representation Flow into URRF and keeps canonical state untouched', () => {
  const provider = makeProvider();
  const fabric = new RealityRepresentationFabric({providers: [provider]});
  const reference = makeReference(provider);
  const object = fabric.registerRealityObject({object_id: 'object:flow:test', state_root: root('c'), representations: [reference]});
  const flow = fabric.createRepresentationFlow({
    flow_id: 'flow:urrf:test',
    object_id: object.object_id,
    source_representation_id: reference.representation_id,
    target_representation_id: reference.representation_id,
    target_state_root: root('d'),
    interval: {source_time_ms: 1000, target_time_ms: 1050, source_tick: 10, target_tick: 11},
    motion_field: {kind: 'TRANSLATION', space: 'world', unit: 'millimeter', source: [0, 0, 0], target: [100, 0, 0]},
    interpolation_policy: {mode: 'LINEAR', extrapolation: 'BOUNDED', max_extrapolation_ms: 5, max_extrapolation_ticks: 1},
    prediction_budget: {max_extrapolation_ms: 5, max_extrapolation_ticks: 1, max_prediction_error_mm: 5, max_prediction_error_mdeg: 25},
    error_budget: {max_position_error_mm: 5, max_rotation_error_mdeg: 25, stale_after_ms: 50},
    safety_bound: {collision_preserving: true, max_displacement_mm: 110}
  });
  assert.equal(flow.format, URRF_REPRESENTATION_FLOW_FORMAT);
  assert.equal(fabric.getRepresentationFlow(flow.flow_id).flow_root, flow.flow_root);
  const sample = fabric.sampleRepresentationFlow({flow_id: flow.flow_id, sample_time_ms: 1025, now_time_ms: 1025, observed_value: [50, 0, 0]});
  assert.equal(sample.format, URRF_REPRESENTATION_FLOW_SAMPLE_FORMAT);
  assert.equal(sample.prediction_error.status, 'PASS');
  assert.deepEqual(sample.value, [50, 0, 0]);
  assert.equal(fabric.getRealityObject(object.object_id).state_root, root('c'));
  assert.equal(fabric.getRealityObject(object.object_id).object_root, object.object_root);
  const snapshot = fabric.snapshot();
  assert.equal(verifyFabricSnapshot(snapshot), true);
  assert.equal(snapshot.representation_flows[0].flow_root, flow.flow_root);
});

test('does not allow an unregistered flow to cross the URRF boundary', () => {
  const fabric = new RealityRepresentationFabric();
  assert.throws(() => fabric.sampleRepresentationFlow({flow_id: 'flow:missing', sample_time_ms: 1}), /URRF_FLOW_NOT_REGISTERED/);
});
