import assert from 'node:assert/strict';
import test from 'node:test';
import {createRepresentationRef, createRealityLawBindings, createRealityPropertySet, rootHash} from '@taowind/rncs-core-contract';
import {
  RealityRepresentationFabric,
  verifyMaterializationPlan,
  verifyMaterializationReceipt,
  verifyRealityObject
} from '../src/index.mjs';

const providerRoot = value => value.repeat(64);

function provider(id, root, materialize) {
  return {
    manifest: {
      id,
      version: 'property-law-test',
      manifest_root: providerRoot(root),
      runtimeStatus: materialize ? 'AVAILABLE' : 'CONTRACT_ONLY',
      capabilities: ['representation.visual.render', 'property.query'],
      authority: {owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection']},
      representation: {kinds: ['mesh'], profiles: [{profile_id: 'mesh.test', formats: ['application/mesh']}]}
    },
    ...(materialize ? {materialize} : {})
  };
}

function reference(providerValue, contentRoot) {
  return createRepresentationRef({
    provider_id: providerValue.manifest.id,
    provider_root: providerValue.manifest.manifest_root,
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

function realityContracts(objectId) {
  const refs = {provenance_ref: 'urn:test:property', authority_ref: 'urn:test:rncs', evidence_refs: ['evidence:test']};
  return {
    property_set: createRealityPropertySet({
      object_id: objectId,
      revision: '1',
      intrinsic_properties: {
        density: {domain: 'physical', value: '7850', unit: 'kg/m³', dimension: 'density', ...refs}
      },
      dynamic_state: {
        temperature: {domain: 'thermal', value: '27', unit: '°C', dimension: 'temperature', ...refs}
      }
    }),
    law_bindings: createRealityLawBindings({
      object_id: objectId,
      world_law_set_id: 'world-law:earth',
      world_laws: [{law_id: 'gravity', domain: 'physical', model: 'constant-gravity', parameters: {g: '9.81'}, ...refs}],
      constitutive_laws: [{law_id: 'elastic', domain: 'physical', model: 'linear-elastic', ...refs}]
    })
  };
}

test('binds queryable PropertySet/LawBindings into materialization without changing ownership', async () => {
  let observed;
  const mesh = provider('provider:test:property-mesh', 'a', async input => {
    observed = input;
    return {status: 'EXECUTED', output_root: 'b'.repeat(64), evidence_root: 'c'.repeat(64), runtime: 'property-aware-mesh'};
  });
  const fabric = new RealityRepresentationFabric({providers: [mesh]});
  const objectId = 'reality-object:property-bound';
  const contracts = realityContracts(objectId);
  const object = fabric.registerRealityObject({
    object_id: objectId,
    state_root: 'd'.repeat(64),
    representations: [reference(mesh, 'e'.repeat(64))],
    ...contracts
  });
  assert.equal(object.property_root, contracts.property_set.property_root);
  assert.equal(object.law_bindings_root, contracts.law_bindings.bindings_root);
  assert.equal(verifyRealityObject(object).valid, true);
  assert.equal(fabric.queryProperty(objectId, 'density').quantity.dimension, 'density');
  assert.equal(fabric.queryLaw(objectId, 'gravity').model, 'constant-gravity');
  const plan = fabric.selectRepresentation({object_id: objectId, representation_kind: 'mesh'});
  assert.equal(verifyMaterializationPlan(plan).valid, true);
  assert.equal(plan.property_root, contracts.property_set.property_root);
  const receipt = await fabric.materialize(plan);
  assert.equal(receipt.status, 'EXECUTED');
  assert.equal(receipt.property_root, contracts.property_set.property_root);
  assert.equal(receipt.law_bindings_root, contracts.law_bindings.bindings_root);
  assert.equal(observed.property_set.property_root, contracts.property_set.property_root);
  assert.equal(observed.authority.provider_can_write_canonical_property, false);
  assert.equal(observed.authority.provider_can_write_canonical_law, false);
  assert.equal(verifyMaterializationReceipt(receipt).valid, true);
});

test('turns provider property mutation attempts into a failed candidate receipt', async () => {
  const malicious = provider('provider:test:property-escalation', 'f', async () => ({
    status: 'EXECUTED',
    output_root: '1'.repeat(64),
    canonical_property_mutated: true
  }));
  const fabric = new RealityRepresentationFabric({providers: [malicious]});
  const objectId = 'reality-object:property-escalation';
  const contracts = realityContracts(objectId);
  const object = fabric.registerRealityObject({object_id: objectId, state_root: '2'.repeat(64), representations: [reference(malicious, '3'.repeat(64))], ...contracts});
  const receipt = await fabric.materialize({object_id: object.object_id, representation_kind: 'mesh'});
  assert.equal(receipt.status, 'FAILED');
  assert.equal(receipt.failure.code, 'URRF_PROVIDER_AUTHORITY_ESCALATION');
  assert.equal(receipt.canonical_state_mutated, false);
  assert.equal(verifyMaterializationReceipt(receipt).valid, true);
});

test('records property transitions as candidate-only and keeps canonical roots unchanged', () => {
  const mesh = provider('provider:test:property-transition', '4');
  const fabric = new RealityRepresentationFabric({providers: [mesh]});
  const objectId = 'reality-object:property-transition';
  const contracts = realityContracts(objectId);
  const object = fabric.registerRealityObject({object_id: objectId, state_root: '5'.repeat(64), representations: [reference(mesh, '6'.repeat(64))], ...contracts});
  const candidate = fabric.createPropertyTransitionCandidate({
    object_id: objectId,
    transition_id: 'property-transition:test',
    law_binding: {law_id: 'elastic', law_root: rootHash({law_id: 'elastic'})},
    applied_input: {temperature: '100', unit: '°C'},
    predicted_output: {damage: 'candidate'},
    provider: {provider_id: mesh.manifest.id, provider_root: mesh.manifest.manifest_root}
  });
  assert.equal(fabric.verifyPropertyTransition(candidate).valid, true);
  assert.equal(candidate.authority.canonical_state_mutation_allowed, false);
  assert.equal(fabric.getRealityObject(objectId).property_root, contracts.property_set.property_root);
  assert.throws(() => fabric.createPropertyTransitionCandidate({object_id: objectId, law_id: 'missing-law', provider: {provider_id: mesh.manifest.id}}), /URRF_PROPERTY_TRANSITION_LAW_NOT_BOUND/);
});
