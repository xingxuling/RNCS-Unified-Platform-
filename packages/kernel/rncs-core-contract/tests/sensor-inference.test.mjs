import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  createAuthorityLease,
  createRealityPropertySet,
  createRealitySensorInferenceAcceptance,
  createRealitySensorInferenceAuthorityReceipt,
  createRealitySensorInferenceCandidate,
  promoteRealitySensorInferenceCandidate,
  rootHash,
  verifyRealityPropertySet,
  verifyRealitySensorInferenceAcceptance,
  verifyRealitySensorInferenceCandidate
} from '../src/index.mjs';

const root = letter => letter.repeat(64);

function sourcePropertySet() {
  return createRealityPropertySet({
    object_id: 'reality-object:sensor-target',
    property_set_id: 'property-set:sensor-target',
    revision: '4',
    evidence_refs: ['evidence:source-property'],
    intrinsic_properties: {
      material_class: {
        property_id: 'material_class',
        domain: 'semantic',
        value_kind: 'symbolic',
        value: 'unknown',
        provenance_ref: 'urn:test:source-property',
        authority_ref: 'urn:test:source-authority',
        evidence_refs: ['evidence:source-property']
      }
    }
  });
}

function lease(overrides = {}) {
  return createAuthorityLease({
    authority_id: 'authority:sensor-gate',
    shard_id: 'shard:sensor-gate',
    semantic_scope: 'reality-property-acceptance',
    owner_node: 'node:rncs-acceptance',
    epoch: 2,
    fencing_token: 11,
    valid_from_tick: 0,
    valid_until_tick: 100,
    status: 'ACTIVE',
    provenance_ref: 'urn:test:authority-lease',
    authority_ref: 'urn:test:authority',
    evidence_refs: ['evidence:authority-lease'],
    ...overrides
  });
}

function candidateInput(overrides = {}) {
  return {
    object_id: 'reality-object:sensor-target',
    candidate_id: 'sensor-candidate:temperature-01',
    source_property_set: sourcePropertySet(),
    source_state_root: root('a'),
    observation: {
      observation_id: 'observation:thermal-camera-01',
      sensor_id: 'sensor:thermal-camera',
      capture_tick: 12,
      modality: 'thermal-image',
      reference_frame: 'world',
      sample: {peak_temperature: '301', unit: 'K', pixel_count: '64'},
      quality: {signal_to_noise: '42'},
      validity_interval: {start: 12, end: 13},
      evidence_refs: ['evidence:thermal-frame-01']
    },
    calibration: {
      calibration_id: 'calibration:thermal-camera:v2',
      version: '2',
      status: 'VERIFIED',
      reference_frame: 'world',
      uncertainty_model: {absolute_kelvin: '1'},
      valid_interval: {start: 0, end: 1000},
      evidence_refs: ['evidence:thermal-calibration-v2']
    },
    inference: {
      inference_id: 'inference:surface-temperature-01',
      method_id: 'method:thermal-segmentation',
      method_version: '1.3',
      output_property_id: 'surface_temperature',
      confidence: '0.98',
      deterministic: true,
      output_constraints: {dimension: 'temperature', unit: 'K'},
      evidence_refs: ['evidence:thermal-inference-01']
    },
    predicted_property: {
      property_id: 'surface_temperature',
      domain: 'thermal',
      kind: 'dynamic',
      value: '301',
      unit: 'K',
      dimension: 'temperature',
      reference_frame: 'world',
      uncertainty: '1',
      provenance_ref: 'provider:thermal-reference',
      authority_ref: 'provider:thermal-reference',
      evidence_refs: ['evidence:thermal-inference-01']
    },
    provider: {
      provider_id: 'provider:thermal-reference',
      provider_root: root('b'),
      deterministic: true,
      runtime: 'cpu-reference'
    },
    evidence_refs: ['evidence:sensor-inference-chain'],
    ...overrides
  };
}

function candidate(overrides = {}) {
  return createRealitySensorInferenceCandidate(candidateInput(overrides));
}

function acceptanceFor(candidateValue, overrides = {}) {
  const authority_lease = overrides.authority_lease ?? lease();
  const accepted_at_tick = overrides.accepted_at_tick ?? 20;
  const decision = overrides.decision ?? 'ACCEPT';
  const authority_receipt = overrides.authority_receipt ?? createRealitySensorInferenceAuthorityReceipt({
    candidate: candidateValue,
    authority_lease,
    tick: accepted_at_tick,
    decision
  });
  return createRealitySensorInferenceAcceptance({
    candidate: candidateValue,
    authority_lease,
    authority_receipt,
    accepted_at_tick,
    acceptance_id: 'sensor-acceptance:temperature-01',
    decision
  });
}

test('sensor inference stays candidate-only until an RNCS acceptance gate promotes it', () => {
  const source = sourcePropertySet();
  const value = candidate();
  assert.equal(verifyRealitySensorInferenceCandidate(value).valid, true);
  assert.equal(value.source_property_root, source.property_root);
  assert.equal(value.proposed_property_set.candidate_only, true);
  assert.equal(value.proposed_property_set.authoritative, false);
  assert.equal(value.acceptance.status, 'PENDING');
  assert.equal(value.authority.provider_can_write_canonical_property, false);

  const acceptance = acceptanceFor(value);
  assert.equal(verifyRealitySensorInferenceAcceptance(acceptance).valid, true);
  assert.equal(acceptance.status, 'ACCEPTED');
  assert.equal(acceptance.promotion_allowed, true);
  assert.equal(acceptance.canonical_property_mutation_performed, false);

  const promoted = promoteRealitySensorInferenceCandidate(value, acceptance, {revision: '5'});
  assert.equal(verifyRealityPropertySet(promoted).valid, true);
  assert.equal(promoted.candidate_only, false);
  assert.equal(promoted.authoritative, true);
  assert.equal(promoted.commit_status, 'COMMITTED');
  assert.equal(promoted.dynamic_state.surface_temperature.status, 'CANONICAL');
  assert.ok(promoted.evidence_refs.includes(`sensor-inference-acceptance:${acceptance.acceptance_root}`));
  assert.equal(value.acceptance.status, 'PENDING');
});

test('calibration, authority, lease and provider boundaries fail closed', () => {
  assert.throws(
    () => createRealitySensorInferenceCandidate(candidateInput({calibration: undefined})),
    error => error.message === 'RNCS_SENSOR_INFERENCE_CALIBRATION_NOT_VERIFIED'
  );
  assert.throws(
    () => createRealitySensorInferenceCandidate(candidateInput({calibration: {...candidateInput().calibration, status: 'UNVERIFIED'}})),
    error => error.message === 'RNCS_SENSOR_INFERENCE_CALIBRATION_NOT_VERIFIED'
  );
  assert.throws(
    () => createRealitySensorInferenceCandidate(candidateInput({calibration: {...candidateInput().calibration, valid_interval: {start: 50, end: 100}}})),
    error => error.message === 'RNCS_SENSOR_INFERENCE_CALIBRATION_INTERVAL_MISMATCH'
  );

  const value = candidate();
  const providerEscalation = structuredClone(value);
  providerEscalation.provider.can_write_canonical_property = true;
  assert.equal(verifyRealitySensorInferenceCandidate(providerEscalation).valid, false);
  assert.ok(verifyRealitySensorInferenceCandidate(providerEscalation).errors.includes('RNCS_SENSOR_INFERENCE_PROVIDER_AUTHORITY_INVALID'));

  const canonicalShortcut = structuredClone(value);
  canonicalShortcut.proposed_property_set.dynamic_state.surface_temperature.status = 'CANONICAL';
  assert.equal(verifyRealitySensorInferenceCandidate(canonicalShortcut).valid, false);

  assert.throws(
    () => createRealitySensorInferenceAcceptance({candidate: value, authority_lease: lease(), accepted_at_tick: 20, decision: 'ACCEPT'}),
    error => error.message === 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_REQUIRED'
  );
  const expiredLease = lease({valid_until_tick: 20});
  assert.throws(
    () => acceptanceFor(value, {authority_lease: expiredLease, accepted_at_tick: 20}),
    error => error.message.includes('RNCS_SENSOR_INFERENCE_AUTHORITY_LEASE_ADMISSION_FAILED')
  );
});

test('rejection, stale acceptance and root tampering cannot promote canonical state', () => {
  const value = candidate();
  const rejected = acceptanceFor(value, {decision: 'REJECT'});
  assert.equal(verifyRealitySensorInferenceAcceptance(rejected).valid, true);
  assert.equal(rejected.promotion_allowed, false);
  assert.throws(
    () => promoteRealitySensorInferenceCandidate(value, rejected),
    error => error.message === 'RNCS_SENSOR_INFERENCE_PROMOTION_NOT_ACCEPTED'
  );

  const tampered = structuredClone(acceptanceFor(value));
  tampered.promotion_allowed = false;
  const verification = verifyRealitySensorInferenceAcceptance(tampered);
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.includes('RNCS_SENSOR_INFERENCE_ACCEPTANCE_PROMOTION_FLAG_INVALID'));

  const staleCandidate = structuredClone(value);
  staleCandidate.source_state_root = root('c');
  assert.equal(verifyRealitySensorInferenceCandidate(staleCandidate).valid, false);
  assert.throws(
    () => promoteRealitySensorInferenceCandidate(staleCandidate, acceptanceFor(value)),
    error => error.message.includes('RNCS_SENSOR_INFERENCE_CANDIDATE_INVALID')
  );
});

test('sensor inference candidate and acceptance schemas validate the sealed contracts', () => {
  const value = candidate();
  const acceptance = acceptanceFor(value);
  const schemaNames = [
    ['reality-quantity.v0.3.schema.json', 'rncs.reality-quantity.v0.3'],
    ['reality-property-set.v0.3.schema.json', 'rncs.reality-property-set.v0.3'],
    ['authority-lease.v0.3.schema.json', 'rncs.authority-lease.v0.3'],
    ['reality-sensor-inference-candidate.v0.3.schema.json', 'rncs.reality-sensor-inference-candidate.v0.3'],
    ['reality-sensor-inference-acceptance.v0.3.schema.json', 'rncs.reality-sensor-inference-acceptance.v0.3']
  ];
  const ajv = new Ajv2020({strict: false, allErrors: true});
  for (const [name, id] of schemaNames) {
    const schema = JSON.parse(fs.readFileSync(new URL(`../schemas/${name}`, import.meta.url), 'utf8'));
    ajv.addSchema(schema, id);
  }
  assert.equal(ajv.getSchema('rncs.reality-sensor-inference-candidate.v0.3')(value), true);
  assert.equal(ajv.getSchema('rncs.reality-sensor-inference-acceptance.v0.3')(acceptance), true);

  const escalated = structuredClone(value);
  escalated.authority.provider_can_write_canonical_property = true;
  assert.equal(ajv.getSchema('rncs.reality-sensor-inference-candidate.v0.3')(escalated), false);
  const mutated = structuredClone(acceptance);
  mutated.canonical_property_mutation_performed = true;
  assert.equal(ajv.getSchema('rncs.reality-sensor-inference-acceptance.v0.3')(mutated), false);
  assert.equal(rootHash({status: 'candidate'}).length, 64);
});

console.log('sensor inference contract tests: 4 PASS');
