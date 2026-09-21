import {ContractError, rootHash, without} from './index.mjs';
import {createRealityPropertySet, verifyRealityPropertySet} from './reality-property.mjs';
import {checkAuthorityLease, verifyAuthorityLease} from './reality-distribution.mjs';

export const REALITY_SENSOR_INFERENCE_FORMAT = 'rncs.reality-sensor-inference-candidate.v0.3';
export const REALITY_SENSOR_INFERENCE_ACCEPTANCE_FORMAT = 'rncs.reality-sensor-inference-acceptance.v0.3';
export const REALITY_SENSOR_INFERENCE_AUTHORITY_RECEIPT_FORMAT = 'rncs.reality-sensor-inference-authority-receipt.v0.3';
export const REALITY_SENSOR_INFERENCE_VERSION = '0.3.0';
export const REALITY_SENSOR_INFERENCE_DECISIONS = Object.freeze(['ACCEPT', 'REJECT']);

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const text = (value, code, fallback = '') => {
  const output = String(value ?? fallback);
  fail(output.length > 0, code);
  return output;
};
const integer = (value, code, fallback = null) => {
  const output = value === undefined || value === null ? fallback : Number(value);
  fail(Number.isSafeInteger(output) && output >= 0, code);
  return output;
};
const tickInterval = (input, code) => {
  const value = record(input);
  const start = value.start === undefined || value.start === null ? null : integer(value.start, `${code}_START_INVALID`);
  const end = value.end === undefined || value.end === null ? null : integer(value.end, `${code}_END_INVALID`);
  fail(start === null || end === null || end > start, `${code}_ORDER_INVALID`);
  return {start, end};
};
const tickIntervalValid = value => {
  const source = record(value);
  const start = source.start === undefined || source.start === null ? null : Number(source.start);
  const end = source.end === undefined || source.end === null ? null : Number(source.end);
  return (start === null || Number.isSafeInteger(start) && start >= 0) &&
    (end === null || Number.isSafeInteger(end) && end >= 0) &&
    (start === null || end === null || end > start);
};
const tickInInterval = (value, tick) => {
  if (!tickIntervalValid(value)) return false;
  const start = value.start === undefined || value.start === null ? null : Number(value.start);
  const end = value.end === undefined || value.end === null ? null : Number(value.end);
  return (start === null || tick >= start) && (end === null || tick < end);
};
const rooted = (value, field) => {
  const base = clone(value);
  delete base[field];
  return {...base, [field]: rootHash(base)};
};
const verifyRoot = (value, field) => hex64(value?.[field]) && rootHash(without(value, field)) === value[field];

const PROPERTY_MAP_BY_KIND = Object.freeze({
  intrinsic: 'intrinsic_properties',
  dynamic: 'dynamic_state',
  field: 'field_state',
  custom: 'custom_properties'
});

function normalizeObservation(input = {}) {
  const value = record(input);
  const sample = clone(value.sample ?? value.measurement ?? value.payload ?? {});
  fail(sample && typeof sample === 'object', 'RNCS_SENSOR_INFERENCE_OBSERVATION_SAMPLE_REQUIRED');
  const evidence_refs = strings(value.evidence_refs ?? value.evidence);
  fail(evidence_refs.length > 0, 'RNCS_SENSOR_INFERENCE_OBSERVATION_EVIDENCE_REQUIRED');
  return rooted({
    observation_id: text(value.observation_id ?? value.id, 'RNCS_SENSOR_INFERENCE_OBSERVATION_ID_REQUIRED'),
    sensor_id: text(value.sensor_id ?? value.sensor, 'RNCS_SENSOR_INFERENCE_SENSOR_ID_REQUIRED'),
    capture_tick: integer(value.capture_tick ?? value.tick, 'RNCS_SENSOR_INFERENCE_CAPTURE_TICK_INVALID'),
    modality: text(value.modality, 'RNCS_SENSOR_INFERENCE_MODALITY_REQUIRED'),
    reference_frame: text(value.reference_frame ?? value.referenceFrame, 'RNCS_SENSOR_INFERENCE_OBSERVATION_REFERENCE_FRAME_REQUIRED'),
    sample,
    sample_root: rootHash(sample),
    quality: clone(value.quality ?? {}),
    validity_interval: clone(value.validity_interval ?? value.validityInterval ?? {start: null, end: null}),
    evidence_refs
  }, 'observation_root');
}

function normalizeCalibration(input = {}) {
  const value = record(input);
  const status = String(value.status ?? value.calibration_status ?? '').toUpperCase();
  fail(status === 'VERIFIED', 'RNCS_SENSOR_INFERENCE_CALIBRATION_NOT_VERIFIED');
  const evidence_refs = strings(value.evidence_refs ?? value.evidence);
  fail(evidence_refs.length > 0, 'RNCS_SENSOR_INFERENCE_CALIBRATION_EVIDENCE_REQUIRED');
  return rooted({
    calibration_id: text(value.calibration_id ?? value.id, 'RNCS_SENSOR_INFERENCE_CALIBRATION_ID_REQUIRED'),
    version: text(value.version, 'RNCS_SENSOR_INFERENCE_CALIBRATION_VERSION_REQUIRED'),
    status,
    reference_frame: text(value.reference_frame ?? value.referenceFrame, 'RNCS_SENSOR_INFERENCE_CALIBRATION_REFERENCE_FRAME_REQUIRED'),
    uncertainty_model: clone(value.uncertainty_model ?? value.uncertaintyModel ?? {}),
    valid_interval: tickInterval(value.valid_interval ?? value.validInterval ?? {start: null, end: null}, 'RNCS_SENSOR_INFERENCE_CALIBRATION_INTERVAL'),
    evidence_refs
  }, 'calibration_root');
}

function normalizeInference(input = {}, observationRoot) {
  const value = record(input);
  const evidence_refs = strings(value.evidence_refs ?? value.evidence);
  fail(evidence_refs.length > 0, 'RNCS_SENSOR_INFERENCE_RESULT_EVIDENCE_REQUIRED');
  const deterministic = value.deterministic;
  fail(typeof deterministic === 'boolean', 'RNCS_SENSOR_INFERENCE_DETERMINISM_REQUIRED');
  return rooted({
    inference_id: text(value.inference_id ?? value.id, 'RNCS_SENSOR_INFERENCE_ID_REQUIRED'),
    method_id: text(value.method_id ?? value.method, 'RNCS_SENSOR_INFERENCE_METHOD_REQUIRED'),
    method_version: text(value.method_version ?? value.version, 'RNCS_SENSOR_INFERENCE_METHOD_VERSION_REQUIRED'),
    input_observation_root: observationRoot,
    output_property_id: text(value.output_property_id ?? value.property_id ?? value.propertyId, 'RNCS_SENSOR_INFERENCE_OUTPUT_PROPERTY_REQUIRED'),
    confidence: value.confidence === undefined ? null : String(value.confidence),
    deterministic,
    output_constraints: clone(value.output_constraints ?? value.constraints ?? {}),
    evidence_refs
  }, 'inference_root');
}

function normalizeProvider(input = {}) {
  const value = record(input);
  const provider_root = value.provider_root === undefined || value.provider_root === null ? null : String(value.provider_root);
  if (provider_root !== null) fail(hex64(provider_root), 'RNCS_SENSOR_INFERENCE_PROVIDER_ROOT_INVALID');
  return {
    provider_id: text(value.provider_id ?? value.id, 'RNCS_SENSOR_INFERENCE_PROVIDER_ID_REQUIRED'),
    provider_root,
    deterministic: value.deterministic === undefined ? null : Boolean(value.deterministic),
    runtime: value.runtime === undefined ? null : String(value.runtime),
    can_write_canonical_property: false
  };
}

function candidatePropertySet({object_id, candidate_id, predicted_property, observation, calibration, inference, provider}) {
  const raw = record(predicted_property);
  const property_id = text(raw.property_id ?? raw.id ?? inference.output_property_id, 'RNCS_SENSOR_INFERENCE_PROPERTY_ID_REQUIRED');
  const kind = String(raw.kind ?? 'dynamic');
  const mapName = PROPERTY_MAP_BY_KIND[kind];
  fail(mapName, 'RNCS_SENSOR_INFERENCE_PROPERTY_KIND_INVALID');
  const evidence_refs = strings([
    ...strings(raw.evidence_refs ?? raw.evidence),
    ...observation.evidence_refs,
    ...calibration.evidence_refs,
    ...inference.evidence_refs
  ]);
  const property = {
    ...clone(raw),
    property_id,
    kind,
    status: 'CANDIDATE',
    provenance_ref: String(raw.provenance_ref ?? `sensor:${observation.observation_id}`),
    authority_ref: String(raw.authority_ref ?? 'rncs:pending-sensor-acceptance'),
    evidence_refs,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return createRealityPropertySet({
    object_id,
    property_set_id: `sensor-inference:${candidate_id}`,
    revision: 'candidate-0',
    evidence_refs,
    [mapName]: {[property_id]: property}
  });
}

function verifyObservation(observation, errors) {
  const check = (condition, code) => { if (!condition) errors.push(code); };
  check(observation && typeof observation === 'object' && !Array.isArray(observation), 'RNCS_SENSOR_INFERENCE_OBSERVATION_INVALID');
  if (!observation || typeof observation !== 'object' || Array.isArray(observation)) return;
  check(typeof observation.observation_id === 'string' && observation.observation_id.length > 0, 'RNCS_SENSOR_INFERENCE_OBSERVATION_ID_REQUIRED');
  check(typeof observation.sensor_id === 'string' && observation.sensor_id.length > 0, 'RNCS_SENSOR_INFERENCE_SENSOR_ID_REQUIRED');
  check(Number.isSafeInteger(observation.capture_tick) && observation.capture_tick >= 0, 'RNCS_SENSOR_INFERENCE_CAPTURE_TICK_INVALID');
  check(typeof observation.modality === 'string' && observation.modality.length > 0, 'RNCS_SENSOR_INFERENCE_MODALITY_REQUIRED');
  check(typeof observation.reference_frame === 'string' && observation.reference_frame.length > 0, 'RNCS_SENSOR_INFERENCE_OBSERVATION_REFERENCE_FRAME_REQUIRED');
  check(observation.sample !== undefined, 'RNCS_SENSOR_INFERENCE_OBSERVATION_SAMPLE_REQUIRED');
  check(observation.sample_root === rootHash(observation.sample), 'RNCS_SENSOR_INFERENCE_SAMPLE_ROOT_MISMATCH');
  check(Array.isArray(observation.evidence_refs) && observation.evidence_refs.length > 0, 'RNCS_SENSOR_INFERENCE_OBSERVATION_EVIDENCE_REQUIRED');
  check(verifyRoot(observation, 'observation_root'), 'RNCS_SENSOR_INFERENCE_OBSERVATION_ROOT_MISMATCH');
}

function verifyCalibration(calibration, errors) {
  const check = (condition, code) => { if (!condition) errors.push(code); };
  check(calibration && typeof calibration === 'object' && !Array.isArray(calibration), 'RNCS_SENSOR_INFERENCE_CALIBRATION_INVALID');
  if (!calibration || typeof calibration !== 'object' || Array.isArray(calibration)) return;
  check(typeof calibration.calibration_id === 'string' && calibration.calibration_id.length > 0, 'RNCS_SENSOR_INFERENCE_CALIBRATION_ID_REQUIRED');
  check(typeof calibration.version === 'string' && calibration.version.length > 0, 'RNCS_SENSOR_INFERENCE_CALIBRATION_VERSION_REQUIRED');
  check(calibration.status === 'VERIFIED', 'RNCS_SENSOR_INFERENCE_CALIBRATION_NOT_VERIFIED');
  check(typeof calibration.reference_frame === 'string' && calibration.reference_frame.length > 0, 'RNCS_SENSOR_INFERENCE_CALIBRATION_REFERENCE_FRAME_REQUIRED');
  check(tickIntervalValid(calibration.valid_interval), 'RNCS_SENSOR_INFERENCE_CALIBRATION_INTERVAL_INVALID');
  check(Array.isArray(calibration.evidence_refs) && calibration.evidence_refs.length > 0, 'RNCS_SENSOR_INFERENCE_CALIBRATION_EVIDENCE_REQUIRED');
  check(verifyRoot(calibration, 'calibration_root'), 'RNCS_SENSOR_INFERENCE_CALIBRATION_ROOT_MISMATCH');
}

function verifyInference(inference, observationRoot, errors) {
  const check = (condition, code) => { if (!condition) errors.push(code); };
  check(inference && typeof inference === 'object' && !Array.isArray(inference), 'RNCS_SENSOR_INFERENCE_RESULT_INVALID');
  if (!inference || typeof inference !== 'object' || Array.isArray(inference)) return;
  check(typeof inference.inference_id === 'string' && inference.inference_id.length > 0, 'RNCS_SENSOR_INFERENCE_ID_REQUIRED');
  check(typeof inference.method_id === 'string' && inference.method_id.length > 0, 'RNCS_SENSOR_INFERENCE_METHOD_REQUIRED');
  check(typeof inference.method_version === 'string' && inference.method_version.length > 0, 'RNCS_SENSOR_INFERENCE_METHOD_VERSION_REQUIRED');
  check(inference.input_observation_root === observationRoot, 'RNCS_SENSOR_INFERENCE_INPUT_ROOT_MISMATCH');
  check(typeof inference.output_property_id === 'string' && inference.output_property_id.length > 0, 'RNCS_SENSOR_INFERENCE_OUTPUT_PROPERTY_REQUIRED');
  check(typeof inference.deterministic === 'boolean', 'RNCS_SENSOR_INFERENCE_DETERMINISM_REQUIRED');
  check(Array.isArray(inference.evidence_refs) && inference.evidence_refs.length > 0, 'RNCS_SENSOR_INFERENCE_RESULT_EVIDENCE_REQUIRED');
  check(verifyRoot(inference, 'inference_root'), 'RNCS_SENSOR_INFERENCE_RESULT_ROOT_MISMATCH');
}

function propertyEntries(propertySet) {
  return Object.entries(PROPERTY_MAP_BY_KIND).flatMap(([, mapName]) => Object.values(propertySet?.[mapName] ?? {}));
}

export function createRealitySensorInferenceCandidate(input = {}) {
  const value = record(input);
  const object_id = text(value.object_id ?? value.objectId, 'RNCS_SENSOR_INFERENCE_OBJECT_ID_REQUIRED');
  const candidate_id = text(value.candidate_id ?? value.candidateId, 'RNCS_SENSOR_INFERENCE_CANDIDATE_ID_REQUIRED', `sensor-inference:${object_id}`);
  const sourcePropertySet = value.source_property_set ?? value.sourcePropertySet ?? null;
  let source_property_root = value.source_property_root ?? value.sourcePropertyRoot ?? null;
  if (sourcePropertySet !== null) {
    const verification = verifyRealityPropertySet(sourcePropertySet);
    fail(verification.valid, `RNCS_SENSOR_INFERENCE_SOURCE_PROPERTY_SET_INVALID:${verification.errors.join(',')}`);
    fail(sourcePropertySet.object_id === object_id, 'RNCS_SENSOR_INFERENCE_SOURCE_OBJECT_MISMATCH');
    source_property_root = sourcePropertySet.property_root;
  }
  fail(hex64(source_property_root), 'RNCS_SENSOR_INFERENCE_SOURCE_PROPERTY_ROOT_INVALID');
  const source_state_root = text(value.source_state_root ?? value.sourceStateRoot, 'RNCS_SENSOR_INFERENCE_SOURCE_STATE_ROOT_REQUIRED').toLowerCase();
  fail(hex64(source_state_root), 'RNCS_SENSOR_INFERENCE_SOURCE_STATE_ROOT_INVALID');
  const observation = normalizeObservation(value.observation);
  const calibration = normalizeCalibration(value.calibration);
  fail(tickInInterval(calibration.valid_interval, observation.capture_tick), 'RNCS_SENSOR_INFERENCE_CALIBRATION_INTERVAL_MISMATCH');
  const inference = normalizeInference(value.inference, observation.observation_root);
  const provider = normalizeProvider(value.provider);
  const proposed_property_set = value.proposed_property_set ?? value.proposedPropertySet
    ? clone(value.proposed_property_set ?? value.proposedPropertySet)
    : candidatePropertySet({object_id, candidate_id, predicted_property: value.predicted_property ?? value.predictedProperty, observation, calibration, inference, provider});
  const proposedVerification = verifyRealityPropertySet(proposed_property_set);
  fail(proposedVerification.valid, `RNCS_SENSOR_INFERENCE_PROPOSED_PROPERTY_SET_INVALID:${proposedVerification.errors.join(',')}`);
  fail(proposed_property_set.object_id === object_id, 'RNCS_SENSOR_INFERENCE_PROPOSED_OBJECT_MISMATCH');
  fail(proposed_property_set.candidate_only === true && proposed_property_set.authoritative === false && proposed_property_set.commit_status === 'NOT_COMMITTED', 'RNCS_SENSOR_INFERENCE_PROPOSED_PROPERTY_MUST_BE_CANDIDATE');
  fail(propertyEntries(proposed_property_set).length > 0, 'RNCS_SENSOR_INFERENCE_PROPOSED_PROPERTY_REQUIRED');
  fail(propertyEntries(proposed_property_set).every(entry => entry.status === 'CANDIDATE'), 'RNCS_SENSOR_INFERENCE_PROPOSED_PROPERTY_MUST_BE_CANDIDATE');
  const evidence_refs = strings([
    ...strings(value.evidence_refs ?? value.evidence),
    ...observation.evidence_refs,
    ...calibration.evidence_refs,
    ...inference.evidence_refs
  ]);
  const evidence = rooted({
    observation_root: observation.observation_root,
    calibration_root: calibration.calibration_root,
    inference_root: inference.inference_root,
    evidence_refs
  }, 'evidence_root');
  const base = {
    format: REALITY_SENSOR_INFERENCE_FORMAT,
    version: REALITY_SENSOR_INFERENCE_VERSION,
    candidate_id,
    object_id,
    source_property_root: String(source_property_root).toLowerCase(),
    source_state_root,
    observation,
    calibration,
    inference,
    proposed_property_set,
    proposed_property_root: proposed_property_set.property_root,
    provider,
    evidence,
    acceptance: {
      status: 'PENDING',
      gate_id: null,
      authority_receipt_root: null,
      promotion_allowed: false,
      canonical_property_mutation_performed: false
    },
    authority: {
      canonical_owner: 'RNCS',
      provider_can_write_canonical_property: false,
      rncs_authority_required: true,
      canonical_write_authorized: false,
      candidate_only: true,
      authoritative: false
    },
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, candidate_root: rootHash(base)};
}

export function verifyRealitySensorInferenceCandidate(candidate) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return {valid: false, errors: ['RNCS_SENSOR_INFERENCE_CANDIDATE_NOT_OBJECT']};
  try {
    check(candidate.format === REALITY_SENSOR_INFERENCE_FORMAT, 'RNCS_SENSOR_INFERENCE_FORMAT_INVALID');
    check(candidate.version === REALITY_SENSOR_INFERENCE_VERSION, 'RNCS_SENSOR_INFERENCE_VERSION_INVALID');
    check(typeof candidate.candidate_id === 'string' && candidate.candidate_id.length > 0, 'RNCS_SENSOR_INFERENCE_CANDIDATE_ID_REQUIRED');
    check(typeof candidate.object_id === 'string' && candidate.object_id.length > 0, 'RNCS_SENSOR_INFERENCE_OBJECT_ID_REQUIRED');
    check(hex64(candidate.source_property_root), 'RNCS_SENSOR_INFERENCE_SOURCE_PROPERTY_ROOT_INVALID');
    check(hex64(candidate.source_state_root), 'RNCS_SENSOR_INFERENCE_SOURCE_STATE_ROOT_INVALID');
    verifyObservation(candidate.observation, errors);
    verifyCalibration(candidate.calibration, errors);
    check(tickInInterval(candidate.calibration?.valid_interval, candidate.observation?.capture_tick), 'RNCS_SENSOR_INFERENCE_CALIBRATION_INTERVAL_MISMATCH');
    verifyInference(candidate.inference, candidate.observation?.observation_root, errors);
    const propertyVerification = verifyRealityPropertySet(candidate.proposed_property_set);
    check(propertyVerification.valid, `RNCS_SENSOR_INFERENCE_PROPOSED_PROPERTY_SET_INVALID:${propertyVerification.errors.join(',')}`);
    check(candidate.proposed_property_set?.object_id === candidate.object_id, 'RNCS_SENSOR_INFERENCE_PROPOSED_OBJECT_MISMATCH');
    check(candidate.proposed_property_root === candidate.proposed_property_set?.property_root, 'RNCS_SENSOR_INFERENCE_PROPOSED_ROOT_MISMATCH');
    check(propertyEntries(candidate.proposed_property_set).length > 0, 'RNCS_SENSOR_INFERENCE_PROPOSED_PROPERTY_REQUIRED');
    check(propertyEntries(candidate.proposed_property_set).every(entry => entry.status === 'CANDIDATE'), 'RNCS_SENSOR_INFERENCE_PROPOSED_PROPERTY_MUST_BE_CANDIDATE');
    check(candidate.provider?.provider_id && candidate.provider.can_write_canonical_property === false, 'RNCS_SENSOR_INFERENCE_PROVIDER_AUTHORITY_INVALID');
    check(candidate.evidence?.observation_root === candidate.observation?.observation_root, 'RNCS_SENSOR_INFERENCE_EVIDENCE_OBSERVATION_ROOT_INVALID');
    check(candidate.evidence?.calibration_root === candidate.calibration?.calibration_root, 'RNCS_SENSOR_INFERENCE_EVIDENCE_CALIBRATION_ROOT_INVALID');
    check(candidate.evidence?.inference_root === candidate.inference?.inference_root, 'RNCS_SENSOR_INFERENCE_EVIDENCE_INFERENCE_ROOT_INVALID');
    check(Array.isArray(candidate.evidence?.evidence_refs) && candidate.evidence.evidence_refs.length > 0, 'RNCS_SENSOR_INFERENCE_EVIDENCE_REQUIRED');
    check(verifyRoot(candidate.evidence, 'evidence_root'), 'RNCS_SENSOR_INFERENCE_EVIDENCE_ROOT_MISMATCH');
    check(candidate.acceptance?.status === 'PENDING', 'RNCS_SENSOR_INFERENCE_CANDIDATE_ACCEPTANCE_STATE_INVALID');
    check(candidate.acceptance?.promotion_allowed === false, 'RNCS_SENSOR_INFERENCE_CANDIDATE_PROMOTION_ESCALATION');
    check(candidate.acceptance?.canonical_property_mutation_performed === false, 'RNCS_SENSOR_INFERENCE_CANDIDATE_CANONICAL_MUTATION');
    check(candidate.authority?.canonical_owner === 'RNCS', 'RNCS_SENSOR_INFERENCE_CANONICAL_OWNER_INVALID');
    check(candidate.authority?.provider_can_write_canonical_property === false, 'RNCS_SENSOR_INFERENCE_AUTHORITY_ESCALATION');
    check(candidate.authority?.rncs_authority_required === true, 'RNCS_SENSOR_INFERENCE_RNCS_AUTHORITY_REQUIRED');
    check(candidate.authority?.canonical_write_authorized === false, 'RNCS_SENSOR_INFERENCE_CANONICAL_WRITE_AUTHORIZED');
    check(candidate.authority?.candidate_only === true && candidate.authority?.authoritative === false, 'RNCS_SENSOR_INFERENCE_AUTHORITY_STATUS_INVALID');
    check(candidate.candidate_only === true, 'RNCS_SENSOR_INFERENCE_MUST_BE_CANDIDATE_ONLY');
    check(candidate.authoritative === false, 'RNCS_SENSOR_INFERENCE_CANNOT_BE_AUTHORITATIVE');
    check(candidate.commit_status === 'NOT_COMMITTED', 'RNCS_SENSOR_INFERENCE_COMMIT_STATUS_INVALID');
    check(verifyRoot(candidate, 'candidate_root'), 'RNCS_SENSOR_INFERENCE_CANDIDATE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_SENSOR_INFERENCE_CANDIDATE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, candidate_root: candidate.candidate_root ?? null};
}

function normalizedLease(value, tick, scope) {
  const lease = clone(value);
  const verification = verifyAuthorityLease(lease);
  fail(verification.valid, `RNCS_SENSOR_INFERENCE_AUTHORITY_LEASE_INVALID:${verification.errors.join(',')}`);
  fail(lease.semantic_scope === scope, 'RNCS_SENSOR_INFERENCE_AUTHORITY_SCOPE_MISMATCH');
  const admission = checkAuthorityLease(lease, {tick, semantic_scope: scope});
  fail(admission.valid, `RNCS_SENSOR_INFERENCE_AUTHORITY_LEASE_ADMISSION_FAILED:${admission.errors.join(',')}`);
  return lease;
}

function authorityReceiptBase({candidate, lease, decision, authority_id, authority_ref}) {
  const base = {
    format: REALITY_SENSOR_INFERENCE_AUTHORITY_RECEIPT_FORMAT,
    version: REALITY_SENSOR_INFERENCE_VERSION,
    status: 'committed',
    candidate_root: candidate.candidate_root,
    decision,
    authority_id,
    authority_ref,
    lease_root: lease.lease_root,
    epoch: lease.epoch,
    fencing_token: lease.fencing_token,
    canonical_owner: 'RNCS',
    provider_can_write_canonical_property: false
  };
  return {...base, decision_root: rootHash(base), receipt_root: rootHash({...base, decision_root: rootHash(base)})};
}

export function createRealitySensorInferenceAuthorityReceipt(input = {}) {
  const value = record(input);
  const candidate = clone(value.candidate);
  const candidateVerification = verifyRealitySensorInferenceCandidate(candidate);
  fail(candidateVerification.valid, `RNCS_SENSOR_INFERENCE_CANDIDATE_INVALID:${candidateVerification.errors.join(',')}`);
  const decision = String(value.decision ?? '').toUpperCase();
  fail(REALITY_SENSOR_INFERENCE_DECISIONS.includes(decision), 'RNCS_SENSOR_INFERENCE_DECISION_INVALID');
  const tick = integer(value.tick ?? value.accepted_at_tick, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_TICK_INVALID');
  const scope = text(value.semantic_scope ?? value.semanticScope, 'RNCS_SENSOR_INFERENCE_AUTHORITY_SCOPE_REQUIRED', 'reality-property-acceptance');
  const lease = normalizedLease(value.authority_lease ?? value.authorityLease, tick, scope);
  const authority_id = text(value.authority_id ?? value.authorityId, 'RNCS_SENSOR_INFERENCE_AUTHORITY_ID_REQUIRED', lease.authority_id);
  fail(authority_id === lease.authority_id, 'RNCS_SENSOR_INFERENCE_AUTHORITY_ID_MISMATCH');
  const authority_ref = text(value.authority_ref ?? value.authorityRef, 'RNCS_SENSOR_INFERENCE_AUTHORITY_REF_REQUIRED', lease.authority_ref);
  return authorityReceiptBase({candidate, lease, decision, authority_id, authority_ref});
}

function verifyAuthorityReceipt(receipt, candidate, lease, decision, errors) {
  const check = (condition, code) => { if (!condition) errors.push(code); };
  check(receipt?.format === REALITY_SENSOR_INFERENCE_AUTHORITY_RECEIPT_FORMAT, 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_FORMAT_INVALID');
  check(receipt?.version === REALITY_SENSOR_INFERENCE_VERSION, 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_VERSION_INVALID');
  check(receipt?.status === 'committed', 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_NOT_COMMITTED');
  check(receipt?.candidate_root === candidate.candidate_root, 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_CANDIDATE_MISMATCH');
  check(receipt?.decision === decision, 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_DECISION_MISMATCH');
  check(receipt?.lease_root === lease.lease_root, 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_LEASE_MISMATCH');
  check(receipt?.authority_id === lease.authority_id, 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_AUTHORITY_ID_MISMATCH');
  check(receipt?.canonical_owner === 'RNCS', 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_OWNER_INVALID');
  check(receipt?.provider_can_write_canonical_property === false, 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_PROVIDER_ESCALATION');
  const base = without(receipt, 'decision_root', 'receipt_root');
  check(hex64(receipt?.decision_root) && rootHash(base) === receipt.decision_root, 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_DECISION_ROOT_MISMATCH');
  check(hex64(receipt?.receipt_root) && rootHash({...base, decision_root: receipt?.decision_root}) === receipt.receipt_root, 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_ROOT_MISMATCH');
}

export function createRealitySensorInferenceAcceptance(input = {}) {
  const value = record(input);
  const candidate = clone(value.candidate);
  const candidateVerification = verifyRealitySensorInferenceCandidate(candidate);
  fail(candidateVerification.valid, `RNCS_SENSOR_INFERENCE_CANDIDATE_INVALID:${candidateVerification.errors.join(',')}`);
  const decision = String(value.decision ?? '').toUpperCase();
  fail(REALITY_SENSOR_INFERENCE_DECISIONS.includes(decision), 'RNCS_SENSOR_INFERENCE_DECISION_INVALID');
  const accepted_at_tick = integer(value.accepted_at_tick ?? value.tick, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_TICK_INVALID');
  const semantic_scope = text(value.semantic_scope ?? value.semanticScope, 'RNCS_SENSOR_INFERENCE_AUTHORITY_SCOPE_REQUIRED', 'reality-property-acceptance');
  const authority_lease = normalizedLease(value.authority_lease ?? value.authorityLease, accepted_at_tick, semantic_scope);
  const authority_receipt = clone(value.authority_receipt ?? value.authorityReceipt);
  fail(authority_receipt && typeof authority_receipt === 'object' && !Array.isArray(authority_receipt), 'RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_REQUIRED');
  const receiptErrors = [];
  verifyAuthorityReceipt(authority_receipt, candidate, authority_lease, decision, receiptErrors);
  fail(receiptErrors.length === 0, `RNCS_SENSOR_INFERENCE_AUTHORITY_RECEIPT_INVALID:${receiptErrors.join(',')}`);
  const status = decision === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
  const evidence_refs = strings([
    ...(candidate.evidence?.evidence_refs ?? []),
    ...strings(value.evidence_refs ?? value.evidence),
    `sensor-inference-authority:${authority_receipt.receipt_root}`
  ]);
  const base = {
    format: REALITY_SENSOR_INFERENCE_ACCEPTANCE_FORMAT,
    version: REALITY_SENSOR_INFERENCE_VERSION,
    acceptance_id: text(value.acceptance_id ?? value.acceptanceId, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_ID_REQUIRED', `sensor-acceptance:${candidate.candidate_id}:${accepted_at_tick}`),
    candidate_id: candidate.candidate_id,
    candidate_root: candidate.candidate_root,
    object_id: candidate.object_id,
    decision,
    status,
    accepted_at_tick,
    semantic_scope,
    authority_receipt,
    authority_lease,
    promotion_allowed: decision === 'ACCEPT',
    canonical_property_mutation_performed: false,
    canonical_owner: 'RNCS',
    authority: {
      canonical_owner: 'RNCS',
      provider_can_write_canonical_property: false,
      rncs_authority_required: true,
      canonical_write_authorized: false,
      candidate_only: true,
      authoritative: false
    },
    evidence_refs,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, acceptance_root: rootHash(base)};
}

export function verifyRealitySensorInferenceAcceptance(acceptance) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!acceptance || typeof acceptance !== 'object' || Array.isArray(acceptance)) return {valid: false, errors: ['RNCS_SENSOR_INFERENCE_ACCEPTANCE_NOT_OBJECT']};
  try {
    check(acceptance.format === REALITY_SENSOR_INFERENCE_ACCEPTANCE_FORMAT, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_FORMAT_INVALID');
    check(acceptance.version === REALITY_SENSOR_INFERENCE_VERSION, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_VERSION_INVALID');
    check(typeof acceptance.acceptance_id === 'string' && acceptance.acceptance_id.length > 0, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_ID_REQUIRED');
    check(typeof acceptance.candidate_id === 'string' && acceptance.candidate_id.length > 0, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_CANDIDATE_ID_REQUIRED');
    check(hex64(acceptance.candidate_root), 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_CANDIDATE_ROOT_INVALID');
    check(['ACCEPTED', 'REJECTED'].includes(acceptance.status), 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_STATUS_INVALID');
    check(REALITY_SENSOR_INFERENCE_DECISIONS.includes(acceptance.decision), 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_DECISION_INVALID');
    check(acceptance.status === (acceptance.decision === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED'), 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_DECISION_STATUS_MISMATCH');
    check(Number.isSafeInteger(acceptance.accepted_at_tick) && acceptance.accepted_at_tick >= 0, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_TICK_INVALID');
    check(typeof acceptance.semantic_scope === 'string' && acceptance.semantic_scope.length > 0, 'RNCS_SENSOR_INFERENCE_AUTHORITY_SCOPE_REQUIRED');
    const leaseVerification = verifyAuthorityLease(acceptance.authority_lease);
    check(leaseVerification.valid, `RNCS_SENSOR_INFERENCE_AUTHORITY_LEASE_INVALID:${leaseVerification.errors.join(',')}`);
    if (leaseVerification.valid) {
      check(acceptance.authority_lease.semantic_scope === acceptance.semantic_scope, 'RNCS_SENSOR_INFERENCE_AUTHORITY_SCOPE_MISMATCH');
      const admission = checkAuthorityLease(acceptance.authority_lease, {tick: acceptance.accepted_at_tick, semantic_scope: acceptance.semantic_scope});
      check(admission.valid, `RNCS_SENSOR_INFERENCE_AUTHORITY_LEASE_ADMISSION_FAILED:${admission.errors.join(',')}`);
    }
    verifyAuthorityReceipt(acceptance.authority_receipt, {candidate_root: acceptance.candidate_root}, acceptance.authority_lease, acceptance.decision, errors);
    check(acceptance.promotion_allowed === (acceptance.decision === 'ACCEPT'), 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_PROMOTION_FLAG_INVALID');
    check(acceptance.canonical_property_mutation_performed === false, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_CANONICAL_MUTATION');
    check(acceptance.canonical_owner === 'RNCS', 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_OWNER_INVALID');
    check(acceptance.authority?.canonical_owner === 'RNCS', 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_AUTHORITY_OWNER_INVALID');
    check(acceptance.authority?.provider_can_write_canonical_property === false, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_PROVIDER_ESCALATION');
    check(acceptance.authority?.canonical_write_authorized === false, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_CANONICAL_WRITE_AUTHORIZED');
    check(acceptance.authority?.candidate_only === true && acceptance.authority?.authoritative === false, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_AUTHORITY_STATUS_INVALID');
    check(acceptance.candidate_only === true && acceptance.authoritative === false, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_CANDIDATE_STATUS_INVALID');
    check(acceptance.commit_status === 'NOT_COMMITTED', 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_COMMIT_STATUS_INVALID');
    check(Array.isArray(acceptance.evidence_refs) && acceptance.evidence_refs.length > 0, 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_EVIDENCE_REQUIRED');
    check(verifyRoot(acceptance, 'acceptance_root'), 'RNCS_SENSOR_INFERENCE_ACCEPTANCE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_SENSOR_INFERENCE_ACCEPTANCE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, acceptance_root: acceptance.acceptance_root ?? null};
}

function canonicalPropertyMap(map, authorityRef, evidenceRefs) {
  return Object.fromEntries(Object.entries(map ?? {}).sort(([a], [b]) => keySort(a, b)).map(([propertyId, entry]) => {
    const property = clone(entry);
    delete property.property_root;
    property.status = 'CANONICAL';
    property.provenance_ref = `rncs:sensor-inference:${propertyId}`;
    property.authority_ref = authorityRef;
    property.evidence_refs = strings([...(property.evidence_refs ?? []), ...evidenceRefs]);
    property.candidate_only = false;
    property.authoritative = true;
    property.commit_status = 'COMMITTED';
    if (property.quantity && typeof property.quantity === 'object') {
      delete property.quantity.quantity_root;
      property.quantity.status = 'CANONICAL';
      property.quantity.provenance_ref = property.provenance_ref;
      property.quantity.authority_ref = authorityRef;
      property.quantity.evidence_refs = strings([...(property.quantity.evidence_refs ?? []), ...evidenceRefs]);
      property.quantity.candidate_only = false;
      property.quantity.authoritative = true;
      property.quantity.commit_status = 'COMMITTED';
    }
    return [propertyId, property];
  }));
}

export function promoteRealitySensorInferenceCandidate(candidateInput, acceptanceInput, options = {}) {
  const candidate = clone(candidateInput);
  const acceptance = clone(acceptanceInput);
  const candidateVerification = verifyRealitySensorInferenceCandidate(candidate);
  fail(candidateVerification.valid, `RNCS_SENSOR_INFERENCE_CANDIDATE_INVALID:${candidateVerification.errors.join(',')}`);
  const acceptanceVerification = verifyRealitySensorInferenceAcceptance(acceptance);
  fail(acceptanceVerification.valid, `RNCS_SENSOR_INFERENCE_ACCEPTANCE_INVALID:${acceptanceVerification.errors.join(',')}`);
  fail(acceptance.status === 'ACCEPTED' && acceptance.promotion_allowed === true, 'RNCS_SENSOR_INFERENCE_PROMOTION_NOT_ACCEPTED');
  fail(acceptance.candidate_root === candidate.candidate_root, 'RNCS_SENSOR_INFERENCE_PROMOTION_CANDIDATE_MISMATCH');
  const authority_ref = text(options.authority_ref ?? options.authorityRef, 'RNCS_SENSOR_INFERENCE_PROMOTION_AUTHORITY_REF_REQUIRED', acceptance.authority_receipt.authority_ref);
  const evidence_refs = strings([
    ...candidate.evidence.evidence_refs,
    ...strings(options.evidence_refs ?? options.evidence),
    `sensor-inference-candidate:${candidate.candidate_root}`,
    `sensor-inference-acceptance:${acceptance.acceptance_root}`
  ]);
  const source = candidate.proposed_property_set;
  const property_set = createRealityPropertySet({
    object_id: source.object_id,
    property_set_id: text(options.property_set_id ?? options.propertySetId, 'RNCS_SENSOR_INFERENCE_PROMOTION_PROPERTY_SET_ID_REQUIRED', source.property_set_id),
    revision: text(options.revision, 'RNCS_SENSOR_INFERENCE_PROMOTION_REVISION_REQUIRED', 'accepted-1'),
    provenance_ref: `rncs:sensor-inference:${candidate.candidate_id}`,
    authority_ref,
    evidence_refs,
    intrinsic_properties: canonicalPropertyMap(source.intrinsic_properties, authority_ref, evidence_refs),
    dynamic_state: canonicalPropertyMap(source.dynamic_state, authority_ref, evidence_refs),
    field_state: canonicalPropertyMap(source.field_state, authority_ref, evidence_refs),
    custom_properties: canonicalPropertyMap(source.custom_properties, authority_ref, evidence_refs)
  });
  const verification = verifyRealityPropertySet(property_set);
  fail(verification.valid, `RNCS_SENSOR_INFERENCE_PROMOTED_PROPERTY_SET_INVALID:${verification.errors.join(',')}`);
  fail(property_set.candidate_only === false && property_set.authoritative === true && property_set.commit_status === 'COMMITTED', 'RNCS_SENSOR_INFERENCE_PROMOTED_PROPERTY_SET_NOT_CANONICAL');
  return property_set;
}
