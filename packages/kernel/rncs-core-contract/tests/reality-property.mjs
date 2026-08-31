import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRealityLawBindings,
  createRealityPropertySet,
  createRealityPropertyTransitionCandidate,
  createRealityQuantity,
  queryRealityLaw,
  queryRealityProperty,
  validateRealityQuantityOperation,
  verifyRealityLawBindings,
  verifyRealityPropertySet,
  verifyRealityPropertyTransition,
  verifyRealityQuantity
} from '../src/index.mjs';

const refs = {
  provenance_ref: 'urn:test:measurement:fixture',
  authority_ref: 'urn:test:authority:fixture',
  evidence_refs: ['evidence:test:fixture']
};

function propertySet() {
  return createRealityPropertySet({
    object_id: 'reality-object:steel-ball',
    property_set_id: 'property-set:steel-ball',
    revision: '1',
    evidence_refs: ['evidence:test:property-set'],
    intrinsic_properties: {
      density: {domain: 'physical', unit: 'kg/m³', dimension: 'density', value: '7850', ...refs},
      material_class: {domain: 'semantic', value_kind: 'symbolic', value: 'steel', ...refs}
    },
    dynamic_state: {
      temperature: {domain: 'thermal', unit: '°C', dimension: 'temperature', value: '27', ...refs}
    },
    field_state: {}
  });
}

test('seals and queries canonical and symbolic RealityObject properties', () => {
  const properties = propertySet();
  assert.equal(verifyRealityPropertySet(properties).valid, true);
  assert.equal(queryRealityProperty(properties, 'density').quantity.unit, 'kg/m³');
  assert.equal(queryRealityProperty(properties, 'material_class').value, 'steel');
  assert.equal(queryRealityProperty(properties, 'missing'), null);
});

test('rejects dimensionally illegal operations and unit-dimension mismatches', () => {
  const mass = createRealityQuantity({...refs, value: '10', unit: 'kg', dimension: 'mass'});
  const length = createRealityQuantity({...refs, value: '5', unit: 'm', dimension: 'length'});
  assert.throws(() => validateRealityQuantityOperation('+', mass, length), /RNCS_QUANTITY_DIMENSION_MISMATCH/);
  assert.throws(() => createRealityQuantity({...refs, value: '5', unit: 'm', dimension: 'mass'}), /RNCS_DIMENSION_UNIT_MISMATCH/);
  assert.equal(validateRealityQuantityOperation('+', mass, createRealityQuantity({...refs, value: '2', unit: 'kg', dimension: 'mass'})).dimension, 'mass');
});

test('keeps candidate properties explicitly uncommitted', () => {
  const candidate = createRealityPropertySet({
    object_id: 'reality-object:observed',
    intrinsic_properties: {
      density: {domain: 'physical', value: '7850', unit: 'kg/m³', dimension: 'density', status: 'CANDIDATE', ...refs}
    }
  });
  assert.equal(candidate.candidate_only, true);
  assert.equal(candidate.authoritative, false);
  assert.equal(candidate.commit_status, 'NOT_COMMITTED');
  assert.equal(verifyRealityPropertySet(candidate).valid, true);
});

test('seals world, constitutive, and interaction law bindings without provider authority', () => {
  const laws = createRealityLawBindings({
    object_id: 'reality-object:steel-ball',
    world_law_set_id: 'world-law:earth',
    world_laws: [{law_id: 'gravity', domain: 'physical', model: 'constant-gravity', parameters: {g: '9.81', unit: 'm/s²'}, ...refs}],
    constitutive_laws: [{law_id: 'elastic-steel', domain: 'physical', model: 'linear-elastic', parameters: {youngs_modulus: '200', poisson_ratio: '0.30'}, ...refs}],
    interaction_laws: [{law_id: 'contact', domain: 'physical', model: 'coulomb-friction', parameters: {coefficient: '0.40'}, ...refs}]
  });
  assert.equal(verifyRealityLawBindings(laws).valid, true);
  assert.equal(queryRealityLaw(laws, 'elastic-steel').model, 'linear-elastic');
  assert.equal(laws.authority.provider_can_write_canonical_law, false);
});

test('creates a property transition candidate with law and provider evidence', () => {
  const properties = propertySet();
  const candidate = createRealityPropertyTransitionCandidate({
    property_set: properties,
    source_state_root: 'a'.repeat(64),
    law_binding: {law_id: 'elastic-steel', law_root: 'b'.repeat(64)},
    applied_input: {strain: '0.01', unit: 'ratio'},
    predicted_output: {property_id: 'damage_state', status: 'CANDIDATE'},
    provider: {provider_id: 'provider:physics:reference', provider_root: 'c'.repeat(64), deterministic: true}
  });
  assert.equal(verifyRealityPropertyTransition(candidate).valid, true);
  assert.equal(candidate.authority.canonical_state_mutation_allowed, false);
  candidate.commit_status = 'COMMITTED';
  assert.equal(verifyRealityPropertyTransition(candidate).valid, false);
});

test('detects tampering in a quantity root', () => {
  const quantity = createRealityQuantity({...refs, value: '10', unit: 'kg', dimension: 'mass'});
  quantity.value = '11';
  assert.equal(verifyRealityQuantity(quantity).valid, false);
});

console.log('reality property contract tests: 6 PASS');
