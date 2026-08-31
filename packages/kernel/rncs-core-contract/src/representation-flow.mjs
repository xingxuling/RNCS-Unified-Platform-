import {ContractError, rootHash} from './index.mjs';

export const REPRESENTATION_FLOW_FORMAT = 'rncs.representation-flow.v0.3';
export const REPRESENTATION_FLOW_SAMPLE_FORMAT = 'rncs.representation-flow-sample.v0.3';
export const REPRESENTATION_FLOW_VERSION = '0.3.0';
export const REALITY_REPRESENTATION_FLOW_FORMAT = REPRESENTATION_FLOW_FORMAT;
export const REALITY_REPRESENTATION_FLOW_SAMPLE_FORMAT = REPRESENTATION_FLOW_SAMPLE_FORMAT;
export const REPRESENTATION_FLOW_MOTION_KINDS = Object.freeze(['TRANSLATION', 'ROTATION', 'SCALE', 'DEFORMATION', 'OPTICAL_FLOW', 'AUDIO', 'LIGHT', 'PARTICLE', 'CUSTOM']);
export const REPRESENTATION_FLOW_INTERPOLATION_MODES = Object.freeze(['STEP', 'LINEAR']);
export const REPRESENTATION_FLOW_EXTRAPOLATION_MODES = Object.freeze(['DISALLOW', 'BOUNDED']);
export const REPRESENTATION_FLOW_SAMPLE_STATUSES = Object.freeze(['STEP', 'INTERPOLATED', 'EXTRAPOLATED']);

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const text = (value, code, fallback = '') => {
  const result = String(value ?? fallback).trim();
  fail(result.length > 0, code);
  return result;
};
const integer = (value, code, fallback = 0, {min = 0, max = Number.MAX_SAFE_INTEGER} = {}) => {
  const result = value === undefined || value === null ? fallback : Number(value);
  fail(Number.isSafeInteger(result) && result >= min && result <= max, code);
  return result;
};
const bool = (value, code, fallback) => {
  const result = value === undefined ? fallback : value;
  fail(typeof result === 'boolean', code);
  return result;
};
const root = (value, code, fallback = '0'.repeat(64)) => {
  const result = String(value ?? fallback).toLowerCase();
  fail(hex64(result), code);
  return result;
};
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(value => String(value).trim()).filter(Boolean))].sort(keySort);

function vector(input, code) {
  fail(Array.isArray(input) && input.length >= 1 && input.length <= 4, `${code}_SHAPE_INVALID`);
  fail(input.every(component => component !== undefined && component !== null), `${code}_COMPONENT_MISSING`);
  return input.map((component, index) => integer(component, `${code}_${index}_INVALID`, 0, {min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER}));
}

function normalizeMotionField(input) {
  const value = record(input);
  const kind = text(value.kind ?? value.motion_kind ?? value.motionKind, 'RNCS_FLOW_MOTION_KIND_REQUIRED', 'TRANSLATION').toUpperCase();
  fail(REPRESENTATION_FLOW_MOTION_KINDS.includes(kind), 'RNCS_FLOW_MOTION_KIND_INVALID');
  const source = vector(value.source ?? value.source_value ?? value.sourceValue, 'RNCS_FLOW_MOTION_SOURCE');
  const target = vector(value.target ?? value.target_value ?? value.targetValue, 'RNCS_FLOW_MOTION_TARGET');
  fail(source.length === target.length, 'RNCS_FLOW_MOTION_DIMENSION_MISMATCH');
  return {
    kind,
    space: text(value.space, 'RNCS_FLOW_MOTION_SPACE_REQUIRED', 'world'),
    unit: text(value.unit ?? value.component_unit ?? value.componentUnit, 'RNCS_FLOW_MOTION_UNIT_REQUIRED', 'millimeter'),
    source,
    target
  };
}

function normalizeInterval(input) {
  const value = record(input);
  const source_time_ms = integer(value.source_time_ms ?? value.sourceTimeMs, 'RNCS_FLOW_SOURCE_TIME_INVALID');
  const target_time_ms = integer(value.target_time_ms ?? value.targetTimeMs, 'RNCS_FLOW_TARGET_TIME_INVALID', source_time_ms + 1);
  const source_tick = integer(value.source_tick ?? value.sourceTick, 'RNCS_FLOW_SOURCE_TICK_INVALID');
  const target_tick = integer(value.target_tick ?? value.targetTick, 'RNCS_FLOW_TARGET_TICK_INVALID', source_tick + 1);
  fail(target_time_ms > source_time_ms, 'RNCS_FLOW_TIME_NOT_MONOTONIC');
  fail(target_tick > source_tick, 'RNCS_FLOW_TICK_NOT_MONOTONIC');
  return {source_time_ms, target_time_ms, source_tick, target_tick, monotonic: true};
}

function normalizeInterpolation(input, prediction) {
  const value = record(input);
  const mode = text(value.mode, 'RNCS_FLOW_INTERPOLATION_MODE_REQUIRED', 'LINEAR').toUpperCase();
  fail(REPRESENTATION_FLOW_INTERPOLATION_MODES.includes(mode), 'RNCS_FLOW_INTERPOLATION_MODE_INVALID');
  const extrapolation = text(value.extrapolation, 'RNCS_FLOW_EXTRAPOLATION_MODE_REQUIRED', 'DISALLOW').toUpperCase();
  fail(REPRESENTATION_FLOW_EXTRAPOLATION_MODES.includes(extrapolation), 'RNCS_FLOW_EXTRAPOLATION_MODE_INVALID');
  const max_extrapolation_ms = integer(value.max_extrapolation_ms ?? value.maxExtrapolationMs, 'RNCS_FLOW_MAX_EXTRAPOLATION_MS_INVALID', prediction.max_extrapolation_ms, {max: Number.MAX_SAFE_INTEGER});
  const max_extrapolation_ticks = integer(value.max_extrapolation_ticks ?? value.maxExtrapolationTicks, 'RNCS_FLOW_MAX_EXTRAPOLATION_TICKS_INVALID', prediction.max_extrapolation_ticks, {max: Number.MAX_SAFE_INTEGER});
  fail(extrapolation === 'DISALLOW' || (max_extrapolation_ms >= 0 && max_extrapolation_ticks >= 0), 'RNCS_FLOW_EXTRAPOLATION_BUDGET_INVALID');
  return {mode, extrapolation, max_extrapolation_ms, max_extrapolation_ticks, clamp_to_interval: bool(value.clamp_to_interval ?? value.clampToInterval, 'RNCS_FLOW_CLAMP_INVALID', false)};
}

function normalizePredictionBudget(input) {
  const value = record(input);
  return {
    max_extrapolation_ms: integer(value.max_extrapolation_ms ?? value.maxExtrapolationMs, 'RNCS_FLOW_PREDICTION_EXTRAPOLATION_MS_INVALID', 0),
    max_extrapolation_ticks: integer(value.max_extrapolation_ticks ?? value.maxExtrapolationTicks, 'RNCS_FLOW_PREDICTION_EXTRAPOLATION_TICKS_INVALID', 0),
    max_prediction_error_mm: integer(value.max_prediction_error_mm ?? value.maxPredictionErrorMm, 'RNCS_FLOW_PREDICTION_ERROR_MM_INVALID', 0),
    max_prediction_error_mdeg: integer(value.max_prediction_error_mdeg ?? value.maxPredictionErrorMdeg, 'RNCS_FLOW_PREDICTION_ERROR_MDEG_INVALID', 0)
  };
}

function normalizeErrorBudget(input) {
  const value = record(input);
  return {
    max_position_error_mm: integer(value.max_position_error_mm ?? value.maxPositionErrorMm, 'RNCS_FLOW_ERROR_POSITION_MM_INVALID', 0),
    max_rotation_error_mdeg: integer(value.max_rotation_error_mdeg ?? value.maxRotationErrorMdeg, 'RNCS_FLOW_ERROR_ROTATION_MDEG_INVALID', 0),
    stale_after_ms: integer(value.stale_after_ms ?? value.staleAfterMs, 'RNCS_FLOW_ERROR_STALE_AFTER_INVALID', 250)
  };
}

function normalizeSafetyBound(input) {
  const value = record(input);
  return {
    collision_preserving: bool(value.collision_preserving ?? value.collisionPreserving, 'RNCS_FLOW_COLLISION_PRESERVING_INVALID', true),
    max_displacement_mm: integer(value.max_displacement_mm ?? value.maxDisplacementMm, 'RNCS_FLOW_MAX_DISPLACEMENT_INVALID', Number.MAX_SAFE_INTEGER),
    bounded: true,
    notes: value.notes === undefined || value.notes === null ? null : String(value.notes)
  };
}

function normalizeRollback(input, source, target) {
  const value = record(input);
  return {
    compatible: bool(value.compatible, 'RNCS_FLOW_ROLLBACK_COMPATIBLE_INVALID', true),
    source_state_root: source,
    target_state_root: target,
    strategy: text(value.strategy, 'RNCS_FLOW_ROLLBACK_STRATEGY_REQUIRED', 'restore-source-state'),
    reason: value.reason === undefined || value.reason === null ? null : String(value.reason)
  };
}

function normalizeAuthority(input) {
  const value = record(input);
  return {
    scope: strings(value.scope ?? value.authority_scope ?? value.authorityScope ?? ['representation_candidate', 'visual_projection']),
    provider_can_write_authoritative_world_state: false,
    rncs_authority_required: true,
    candidate_only: true
  };
}

function flowBase(input) {
  const value = record(input);
  const source_state_root = root(value.source_state_root ?? value.sourceStateRoot, 'RNCS_FLOW_SOURCE_STATE_ROOT_INVALID');
  const target_state_root = root(value.target_state_root ?? value.targetStateRoot, 'RNCS_FLOW_TARGET_STATE_ROOT_INVALID');
  const prediction_budget = normalizePredictionBudget(value.prediction_budget ?? value.predictionBudget);
  const error_budget = normalizeErrorBudget(value.error_budget ?? value.errorBudget);
  const interval = normalizeInterval(value.interval ?? value.time_interval ?? value.timeInterval ?? value);
  const interpolation_policy = normalizeInterpolation(value.interpolation_policy ?? value.interpolationPolicy, prediction_budget);
  const motion_field = normalizeMotionField(value.motion_field ?? value.motionField);
  const safety_bound = normalizeSafetyBound(value.safety_bound ?? value.safetyBound);
  const flow_id = text(value.flow_id ?? value.flowId, 'RNCS_FLOW_ID_REQUIRED');
  const object_id = text(value.object_id ?? value.objectId, 'RNCS_FLOW_OBJECT_ID_REQUIRED');
  const branch = text(value.branch, 'RNCS_FLOW_BRANCH_REQUIRED', 'main');
  const source_representation_root = root(value.source_representation_root ?? value.sourceRepresentationRoot, 'RNCS_FLOW_SOURCE_REPRESENTATION_ROOT_INVALID');
  const target_representation_root = root(value.target_representation_root ?? value.targetRepresentationRoot, 'RNCS_FLOW_TARGET_REPRESENTATION_ROOT_INVALID');
  const identity_continuity = {
    object_id,
    source_state_root,
    target_state_root,
    source_representation_root,
    target_representation_root,
    continuous: bool(value.identity_continuity?.continuous, 'RNCS_FLOW_IDENTITY_CONTINUITY_INVALID', true)
  };
  fail(identity_continuity.continuous, 'RNCS_FLOW_IDENTITY_CONTINUITY_REQUIRED');
  return {
    format: REPRESENTATION_FLOW_FORMAT,
    version: REPRESENTATION_FLOW_VERSION,
    flow_id,
    object_id,
    branch,
    source_state_root,
    target_state_root,
    source_representation_root,
    target_representation_root,
    interval,
    identity_continuity,
    motion_field,
    interpolation_policy,
    prediction_budget,
    error_budget,
    safety_bound,
    rollback_compatibility: normalizeRollback(value.rollback_compatibility ?? value.rollbackCompatibility, source_state_root, target_state_root),
    authority: normalizeAuthority(value.authority ?? value.authority_scope ?? value.authorityScope),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs),
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRepresentationFlow(input = {}) {
  const base = flowBase(input);
  const flow = {...base, flow_root: rootHash(base)};
  const verification = verifyRepresentationFlow(flow);
  fail(verification.valid, `RNCS_FLOW_INVALID:${verification.errors.join(',')}`);
  return flow;
}

function verifyVector(value, code, length = null) {
  const valid = Array.isArray(value) && value.length >= 1 && value.length <= 4 && value.every(component => Number.isSafeInteger(component));
  if (!valid) return false;
  return length === null || value.length === length;
}

export function verifyRepresentationFlow(flow) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!flow || typeof flow !== 'object' || Array.isArray(flow)) return {valid: false, errors: ['RNCS_FLOW_NOT_OBJECT']};
  try {
    const copy = clone(flow);
    const flowRoot = copy.flow_root;
    delete copy.flow_root;
    check(flow.format === REPRESENTATION_FLOW_FORMAT, 'RNCS_FLOW_FORMAT_INVALID');
    check(flow.version === REPRESENTATION_FLOW_VERSION, 'RNCS_FLOW_VERSION_INVALID');
    for (const field of ['flow_id', 'object_id', 'branch']) check(typeof flow[field] === 'string' && flow[field].length > 0, `RNCS_FLOW_${field.toUpperCase()}_REQUIRED`);
    for (const field of ['source_state_root', 'target_state_root', 'source_representation_root', 'target_representation_root']) check(hex64(flow[field]), `RNCS_FLOW_${field.toUpperCase()}_INVALID`);
    const interval = flow.interval ?? {};
    for (const field of ['source_time_ms', 'target_time_ms', 'source_tick', 'target_tick']) check(Number.isSafeInteger(interval[field]) && interval[field] >= 0, `RNCS_FLOW_INTERVAL_${field.toUpperCase()}_INVALID`);
    check(interval.target_time_ms > interval.source_time_ms && interval.target_tick > interval.source_tick && interval.monotonic === true, 'RNCS_FLOW_INTERVAL_NOT_MONOTONIC');
    const motion = flow.motion_field ?? {};
    check(REPRESENTATION_FLOW_MOTION_KINDS.includes(motion.kind), 'RNCS_FLOW_MOTION_KIND_INVALID');
    check(typeof motion.space === 'string' && motion.space.length > 0 && typeof motion.unit === 'string' && motion.unit.length > 0, 'RNCS_FLOW_MOTION_METADATA_INVALID');
    check(verifyVector(motion.source, 'RNCS_FLOW_MOTION_SOURCE'), 'RNCS_FLOW_MOTION_SOURCE_INVALID');
    check(verifyVector(motion.target, 'RNCS_FLOW_MOTION_TARGET', motion.source?.length ?? null), 'RNCS_FLOW_MOTION_TARGET_INVALID');
    const interpolation = flow.interpolation_policy ?? {};
    check(REPRESENTATION_FLOW_INTERPOLATION_MODES.includes(interpolation.mode), 'RNCS_FLOW_INTERPOLATION_MODE_INVALID');
    check(REPRESENTATION_FLOW_EXTRAPOLATION_MODES.includes(interpolation.extrapolation), 'RNCS_FLOW_EXTRAPOLATION_MODE_INVALID');
    for (const field of ['max_extrapolation_ms', 'max_extrapolation_ticks']) check(Number.isSafeInteger(interpolation[field]) && interpolation[field] >= 0, `RNCS_FLOW_INTERPOLATION_${field.toUpperCase()}_INVALID`);
    check(typeof interpolation.clamp_to_interval === 'boolean', 'RNCS_FLOW_CLAMP_INVALID');
    const prediction = flow.prediction_budget ?? {};
    for (const field of ['max_extrapolation_ms', 'max_extrapolation_ticks', 'max_prediction_error_mm', 'max_prediction_error_mdeg']) check(Number.isSafeInteger(prediction[field]) && prediction[field] >= 0, `RNCS_FLOW_PREDICTION_${field.toUpperCase()}_INVALID`);
    check(interpolation.max_extrapolation_ms === prediction.max_extrapolation_ms && interpolation.max_extrapolation_ticks === prediction.max_extrapolation_ticks, 'RNCS_FLOW_EXTRAPOLATION_BUDGET_MISMATCH');
    const errorBudget = flow.error_budget ?? {};
    for (const field of ['max_position_error_mm', 'max_rotation_error_mdeg', 'stale_after_ms']) check(Number.isSafeInteger(errorBudget[field]) && errorBudget[field] >= 0, `RNCS_FLOW_ERROR_${field.toUpperCase()}_INVALID`);
    const safety = flow.safety_bound ?? {};
    check(safety.collision_preserving === true && safety.bounded === true && Number.isSafeInteger(safety.max_displacement_mm) && safety.max_displacement_mm >= 0, 'RNCS_FLOW_SAFETY_BOUND_INVALID');
    check(flow.identity_continuity?.object_id === flow.object_id, 'RNCS_FLOW_IDENTITY_OBJECT_MISMATCH');
    check(flow.identity_continuity?.source_state_root === flow.source_state_root && flow.identity_continuity?.target_state_root === flow.target_state_root, 'RNCS_FLOW_IDENTITY_STATE_MISMATCH');
    check(flow.identity_continuity?.source_representation_root === flow.source_representation_root && flow.identity_continuity?.target_representation_root === flow.target_representation_root, 'RNCS_FLOW_IDENTITY_REPRESENTATION_MISMATCH');
    check(flow.identity_continuity?.continuous === true, 'RNCS_FLOW_IDENTITY_CONTINUITY_REQUIRED');
    check(flow.rollback_compatibility?.compatible === true, 'RNCS_FLOW_ROLLBACK_COMPATIBILITY_REQUIRED');
    check(flow.rollback_compatibility?.source_state_root === flow.source_state_root && flow.rollback_compatibility?.target_state_root === flow.target_state_root, 'RNCS_FLOW_ROLLBACK_STATE_MISMATCH');
    check(flow.authority?.provider_can_write_authoritative_world_state === false && flow.authority?.rncs_authority_required === true && flow.authority?.candidate_only === true, 'RNCS_FLOW_AUTHORITY_BOUNDARY_INVALID');
    check(flow.candidate_only === true && flow.authoritative === false && flow.canonical_write_authorized === false, 'RNCS_FLOW_CANDIDATE_REQUIRED');
    check(flow.commit_status === 'NOT_COMMITTED', 'RNCS_FLOW_COMMIT_STATUS_INVALID');
    check(Array.isArray(flow.evidence_refs), 'RNCS_FLOW_EVIDENCE_REFS_INVALID');
    check(hex64(flowRoot) && rootHash(copy) === flowRoot, 'RNCS_FLOW_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_FLOW_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, flow_root: flow.flow_root ?? null};
}

function roundedDivision(numerator, denominator) {
  const n = typeof numerator === 'bigint' ? numerator : BigInt(numerator);
  const d = BigInt(denominator);
  const sign = n < 0n ? -1n : 1n;
  const absolute = n < 0n ? -n : n;
  return Number(sign * ((absolute + d / 2n) / d));
}

function sampleValue(flow, numerator, denominator) {
  if (flow.interpolation_policy.mode === 'STEP') return numerator < denominator ? [...flow.motion_field.source] : [...flow.motion_field.target];
  return flow.motion_field.source.map((source, index) => {
    const result = source + roundedDivision((BigInt(flow.motion_field.target[index]) - BigInt(source)) * BigInt(numerator), denominator);
    fail(Number.isSafeInteger(result), 'RNCS_FLOW_SAMPLE_VALUE_OVERFLOW');
    return result;
  });
}

export function createRepresentationFlowSample(flowInput, input = {}) {
  const flow = clone(flowInput?.flow ?? flowInput);
  const verification = verifyRepresentationFlow(flow);
  fail(verification.valid, `RNCS_FLOW_INVALID:${verification.errors.join(',')}`);
  const value = record(input);
  const sourceTime = flow.interval.source_time_ms;
  const targetTime = flow.interval.target_time_ms;
  const duration = targetTime - sourceTime;
  const sampleTime = integer(value.sample_time_ms ?? value.sampleTimeMs, 'RNCS_FLOW_SAMPLE_TIME_INVALID', sourceTime);
  const nowTime = integer(value.now_time_ms ?? value.nowTimeMs, 'RNCS_FLOW_NOW_TIME_INVALID', sampleTime);
  fail(nowTime >= sampleTime, 'RNCS_FLOW_SAMPLE_NOW_BEFORE_SAMPLE');
  fail(nowTime <= targetTime + flow.error_budget.stale_after_ms, 'RNCS_FLOW_STALE_STATE');
  const before = sampleTime < sourceTime;
  const after = sampleTime > targetTime;
  const outside = before || after;
  const distance = before ? sourceTime - sampleTime : after ? sampleTime - targetTime : 0;
  if (outside) {
    fail(flow.interpolation_policy.extrapolation === 'BOUNDED', 'RNCS_FLOW_EXTRAPOLATION_DISALLOWED');
    fail(distance <= flow.interpolation_policy.max_extrapolation_ms, 'RNCS_FLOW_EXTRAPOLATION_WINDOW_EXCEEDED');
    const tickSpan = flow.interval.target_tick - flow.interval.source_tick;
    const tickDistance = Number((BigInt(distance) * BigInt(tickSpan) + BigInt(duration) - 1n) / BigInt(duration));
    fail(tickDistance <= flow.interpolation_policy.max_extrapolation_ticks, 'RNCS_FLOW_EXTRAPOLATION_TICK_WINDOW_EXCEEDED');
  }
  const clamped = outside && flow.interpolation_policy.clamp_to_interval;
  const effectiveTime = clamped ? Math.min(Math.max(sampleTime, sourceTime), targetTime) : sampleTime;
  const numerator = effectiveTime - sourceTime;
  const status = flow.interpolation_policy.mode === 'STEP' ? 'STEP' : outside && !clamped ? 'EXTRAPOLATED' : 'INTERPOLATED';
  const valueVector = sampleValue(flow, numerator, duration);
  const observed = value.observed_value ?? value.observedValue;
  let prediction_error;
  if (observed === undefined || observed === null) {
    prediction_error = {status: 'NOT_RUN', max_component_error: 0, allowed_error: flow.motion_field.kind === 'ROTATION' ? flow.prediction_budget.max_prediction_error_mdeg : flow.prediction_budget.max_prediction_error_mm};
  } else {
    const observedVector = vector(observed, 'RNCS_FLOW_OBSERVED_VALUE');
    fail(observedVector.length === valueVector.length, 'RNCS_FLOW_OBSERVED_DIMENSION_MISMATCH');
    const max_component_error = Math.max(...observedVector.map((component, index) => Math.abs(component - valueVector[index])));
    const allowed_error = flow.motion_field.kind === 'ROTATION' ? flow.prediction_budget.max_prediction_error_mdeg : flow.prediction_budget.max_prediction_error_mm;
    fail(max_component_error <= allowed_error, 'RNCS_FLOW_PREDICTION_ERROR_EXCEEDED');
    prediction_error = {status: 'PASS', max_component_error, allowed_error};
  }
  const displacement = Math.max(...valueVector.map((component, index) => Math.abs(component - flow.motion_field.source[index])));
  fail(flow.motion_field.kind !== 'TRANSLATION' || displacement <= flow.safety_bound.max_displacement_mm, 'RNCS_FLOW_COLLISION_SAFETY_BOUND_EXCEEDED');
  const base = {
    format: REPRESENTATION_FLOW_SAMPLE_FORMAT,
    version: REPRESENTATION_FLOW_VERSION,
    flow_root: flow.flow_root,
    flow_id: flow.flow_id,
    object_id: flow.object_id,
    source_state_root: flow.source_state_root,
    target_state_root: flow.target_state_root,
    sample_time_ms: sampleTime,
    now_time_ms: nowTime,
    interpolation: {
      mode: flow.interpolation_policy.mode,
      status,
      clamped,
      fraction: {numerator, denominator: duration},
      alpha_milli: roundedDivision(BigInt(numerator) * 1000n, duration)
    },
    value: valueVector,
    prediction_error,
    collision_safety: {
      status: 'PASS',
      max_displacement_mm: displacement,
      bound_mm: flow.safety_bound.max_displacement_mm
    },
    canonical_state_mutated: false,
    canonical_write_authorized: false,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, sample_root: rootHash(base)};
}

export function verifyRepresentationFlowSample(sample) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!sample || typeof sample !== 'object' || Array.isArray(sample)) return {valid: false, errors: ['RNCS_FLOW_SAMPLE_NOT_OBJECT']};
  try {
    const copy = clone(sample);
    const sampleRoot = copy.sample_root;
    delete copy.sample_root;
    check(sample.format === REPRESENTATION_FLOW_SAMPLE_FORMAT, 'RNCS_FLOW_SAMPLE_FORMAT_INVALID');
    check(sample.version === REPRESENTATION_FLOW_VERSION, 'RNCS_FLOW_SAMPLE_VERSION_INVALID');
    check(hex64(sample.flow_root), 'RNCS_FLOW_SAMPLE_FLOW_ROOT_INVALID');
    for (const field of ['flow_id', 'object_id']) check(typeof sample[field] === 'string' && sample[field].length > 0, `RNCS_FLOW_SAMPLE_${field.toUpperCase()}_REQUIRED`);
    for (const field of ['source_state_root', 'target_state_root']) check(hex64(sample[field]), `RNCS_FLOW_SAMPLE_${field.toUpperCase()}_INVALID`);
    for (const field of ['sample_time_ms', 'now_time_ms']) check(Number.isSafeInteger(sample[field]) && sample[field] >= 0, `RNCS_FLOW_SAMPLE_${field.toUpperCase()}_INVALID`);
    check(REPRESENTATION_FLOW_SAMPLE_STATUSES.includes(sample.interpolation?.status), 'RNCS_FLOW_SAMPLE_STATUS_INVALID');
    check(REPRESENTATION_FLOW_INTERPOLATION_MODES.includes(sample.interpolation?.mode), 'RNCS_FLOW_SAMPLE_MODE_INVALID');
    check(typeof sample.interpolation?.clamped === 'boolean', 'RNCS_FLOW_SAMPLE_CLAMP_INVALID');
    check(Number.isSafeInteger(sample.interpolation?.fraction?.numerator) && Number.isSafeInteger(sample.interpolation?.fraction?.denominator) && sample.interpolation.fraction.denominator > 0, 'RNCS_FLOW_SAMPLE_FRACTION_INVALID');
    check(Number.isSafeInteger(sample.interpolation?.alpha_milli), 'RNCS_FLOW_SAMPLE_ALPHA_INVALID');
    check(verifyVector(sample.value, 'RNCS_FLOW_SAMPLE_VALUE'), 'RNCS_FLOW_SAMPLE_VALUE_INVALID');
    check(['NOT_RUN', 'PASS'].includes(sample.prediction_error?.status), 'RNCS_FLOW_SAMPLE_PREDICTION_STATUS_INVALID');
    check(Number.isSafeInteger(sample.prediction_error?.max_component_error) && sample.prediction_error.max_component_error >= 0, 'RNCS_FLOW_SAMPLE_PREDICTION_ERROR_INVALID');
    check(Number.isSafeInteger(sample.prediction_error?.allowed_error) && sample.prediction_error.allowed_error >= 0, 'RNCS_FLOW_SAMPLE_PREDICTION_BUDGET_INVALID');
    check(sample.collision_safety?.status === 'PASS' && Number.isSafeInteger(sample.collision_safety?.max_displacement_mm) && sample.collision_safety.max_displacement_mm >= 0 && Number.isSafeInteger(sample.collision_safety?.bound_mm) && sample.collision_safety.bound_mm >= 0, 'RNCS_FLOW_SAMPLE_SAFETY_INVALID');
    check(sample.canonical_state_mutated === false && sample.canonical_write_authorized === false && sample.candidate_only === true && sample.authoritative === false && sample.commit_status === 'NOT_COMMITTED', 'RNCS_FLOW_SAMPLE_AUTHORITY_BOUNDARY_INVALID');
    check(hex64(sampleRoot) && rootHash(copy) === sampleRoot, 'RNCS_FLOW_SAMPLE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_FLOW_SAMPLE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, sample_root: sample.sample_root ?? null};
}
