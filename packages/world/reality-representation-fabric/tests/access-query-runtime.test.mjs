import assert from 'node:assert/strict';
import test from 'node:test';
import {createRealityLawBindings, createRealityPropertySet, createRepresentationRef} from '@taowind/rncs-core-contract';
import {
  RealityRepresentationFabric,
  verifyMaterializationPlan,
  verifyMaterializationReceipt,
  verifyRealityObject
} from '../src/index.mjs';

const refs = {provenance_ref: 'urn:test:access', authority_ref: 'urn:test:rncs', evidence_refs: ['evidence:access']};

function provider(id, root, materialize) {
  return {
    manifest: {
      id,
      version: 'access-query-test',
      manifest_root: root.repeat(64),
      runtimeStatus: materialize ? 'AVAILABLE' : 'CONTRACT_ONLY',
      capabilities: ['representation.visual.render'],
      authority: {owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection']},
      representation: {kinds: ['mesh'], profiles: [{profile_id: 'mesh.test', formats: ['application/mesh']}]}
    },
    ...(materialize ? {materialize} : {})
  };
}

function reference(value, contentRoot) {
  return createRepresentationRef({
    provider_id: value.manifest.id,
    provider_root: value.manifest.manifest_root,
    representation_kind: 'mesh',
    representation_formats: ['application/mesh'],
    content_root: contentRoot,
    representation_profile: {profile_id: 'mesh.test', formats: ['application/mesh']},
    detail_policy: {mode: 'distance-lod', selectors: ['screen-space-size']},
    residency_policy: {mode: 'asset-resident', selectors: ['working-set']},
    authority_scope: ['representation_candidate', 'visual_projection'],
    availability: 'AVAILABLE'
  });
}

function contracts(objectId) {
  return {
    property_set: createRealityPropertySet({object_id: objectId, intrinsic_properties: {mass: {domain: 'physical', value: '10', unit: 'kg', dimension: 'mass', ...refs}}}),
    law_bindings: createRealityLawBindings({object_id: objectId, world_laws: [{law_id: 'gravity', domain: 'physical', model: 'constant-gravity', ...refs}]})
  };
}

function index(position, tags, price, scope = ['public']) {
  return {position, semantic_tags: tags, state: {price}, relations: [{type: 'friend', from: 'subject:alice'}], temporal: {from: '0', to: '100'}, authority_scope: scope, freshness: '1', evidence_refs: ['evidence:index']};
}

test('binds DetailVector into a materialization plan and receipt', async () => {
  let observed;
  const mesh = provider('provider:test:detail-vector', 'a', async input => {
    observed = input.detail_vector;
    return {status: 'EXECUTED', output_root: 'b'.repeat(64)};
  });
  const fabric = new RealityRepresentationFabric({providers: [mesh]});
  const objectId = 'reality-object:detail-vector';
  const object = fabric.registerRealityObject({object_id: objectId, state_root: 'c'.repeat(64), representations: [reference(mesh, 'd'.repeat(64))], ...contracts(objectId), query_index: index({x: 0, y: 0, z: 0}, ['city'], '100')});
  assert.equal(verifyRealityObject(object).valid, true);
  const plan = fabric.selectRepresentation({object_id: objectId, detail_vector: {visual: 1, physical: 4, causal: 2}});
  assert.equal(plan.detail_vector.axes.visual, 1);
  assert.equal(plan.detail_vector.axes.physical, 4);
  assert.equal(plan.detail_vector.axes.causal, 2);
  assert.equal(verifyMaterializationPlan(plan).valid, true);
  const receipt = await fabric.materialize(plan);
  assert.equal(receipt.status, 'EXECUTED');
  assert.equal(receipt.detail_vector_root, plan.detail_vector_root);
  assert.equal(observed.axes.physical, 4);
  assert.equal(verifyMaterializationReceipt(receipt).valid, true);
});

test('runs URRF Reality Query and bounds the Cognitive Working Set', () => {
  const mesh = provider('provider:test:query', 'e');
  const fabric = new RealityRepresentationFabric({providers: [mesh]});
  const forgeId = 'reality-object:forge';
  const marketId = 'reality-object:market';
  fabric.registerRealityObject({object_id: forgeId, state_root: '1'.repeat(64), representations: [reference(mesh, '2'.repeat(64))], ...contracts(forgeId), query_index: index({x: 10, y: 0, z: 0}, ['city', 'forge'], '150')});
  fabric.registerRealityObject({object_id: marketId, state_root: '3'.repeat(64), representations: [reference(mesh, '4'.repeat(64))], ...contracts(marketId), query_index: index({x: 20, y: 0, z: 0}, ['city', 'market'], '100')});
  const horizon = fabric.createHorizon({subject_id: 'subject:alice', spatial: {radius: '100'}, semantic: {tags: ['city']}, permission_scope: ['public', 'friend']});
  const graph = fabric.createInterestGraph({subject_id: 'subject:alice', nodes: [{object_id: forgeId, required: true, weights: {task_interest: '10'}, reasons: ['task']}]});
  const result = fabric.queryReality({
    subject_id: 'subject:alice',
    horizon,
    interest_graph: graph,
    filters: {spatial: {origin: {x: 0, y: 0, z: 0}, radius: '100'}, semantic: {tags: ['forge']}, state: [{property_id: 'price', operator: '<', value: '200'}], relations: [{type: 'friend', from: 'subject:alice'}]},
    permission_scope: ['public'],
    limit: 5
  });
  assert.deepEqual(result.selected.map(row => row.object_id), [forgeId]);
  const workingSet = fabric.createCognitiveWorkingSet({query_result: result, capacity: 1});
  assert.equal(workingSet.objects.length, 1);
  assert.equal(workingSet.objects[0].object_id, forgeId);
});

test('permission filtering prevents a private object from entering the query result', () => {
  const mesh = provider('provider:test:permission', 'f');
  const fabric = new RealityRepresentationFabric({providers: [mesh]});
  const objectId = 'reality-object:private';
  fabric.registerRealityObject({object_id: objectId, state_root: '5'.repeat(64), representations: [reference(mesh, '6'.repeat(64))], ...contracts(objectId), query_index: index({x: 1, y: 0, z: 0}, ['city', 'forge'], '100', ['private'])});
  const horizon = fabric.createHorizon({subject_id: 'subject:alice', spatial: {radius: '10'}, permission_scope: ['public']});
  const result = fabric.queryReality({subject_id: 'subject:alice', horizon, filters: {semantic: {tags: ['forge']}}, permission_scope: ['public'], limit: 5});
  assert.equal(result.selected.length, 0);
  assert.deepEqual(result.omitted, [{object_id: objectId, reason: 'PERMISSION_FILTERED'}]);
});
