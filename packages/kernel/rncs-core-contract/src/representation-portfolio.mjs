import {ContractError, rootHash} from './index.mjs';

export const REALITY_REPRESENTATION_PORTFOLIO_VERSION = '0.3.0';
export const REALITY_REPRESENTATION_PORTFOLIO_FORMAT = 'rncs.reality-representation-portfolio.v0.3';
export const REALITY_REPRESENTATION_SLOT_FORMAT = 'rncs.reality-representation-slot.v0.3';
export const REALITY_VISUAL_QUALITY_PROFILES = Object.freeze([
  'PROXY',
  'MOBILE',
  'STANDARD',
  'CINEMATIC',
  'REFERENCE'
]);
export const REALITY_PORTFOLIO_MODES = Object.freeze([
  'MINIMUM',
  'BALANCED',
  'DIVERSE',
  'CINEMATIC',
  'CUSTOM'
]);
export const REALITY_DIVERSITY_AXES = Object.freeze([
  'MODALITY',
  'DETAIL',
  'MATERIAL',
  'LIGHTING',
  'ENVIRONMENT',
  'STYLE',
  'MOTION',
  'VIEW'
]);
export const REALITY_PORTFOLIO_COST_FIELDS = Object.freeze([
  'CPU_MILLI',
  'GPU_MILLI',
  'NPU_MILLI',
  'VRAM_MB',
  'RAM_MB',
  'STORAGE_KB',
  'NETWORK_KB',
  'ENERGY_MILLI'
]);

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
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
const root = (value, code) => {
  const result = String(value ?? '').toLowerCase();
  fail(hex64(result), code);
  return result;
};
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(value => String(value).trim()).filter(Boolean))].sort(keySort);
const orderedUnique = (values, allowed, code) => {
  const result = [...new Set((Array.isArray(values) ? values : []).map(value => String(value).trim().toUpperCase()).filter(Boolean))];
  for (const value of result) fail(allowed.includes(value), code);
  return result.sort((a, b) => allowed.indexOf(a) - allowed.indexOf(b));
};
const qualityRank = value => REALITY_VISUAL_QUALITY_PROFILES.indexOf(value);
const axesRank = value => REALITY_DIVERSITY_AXES.indexOf(value);

function normalizeResourceCosts(input = {}) {
  const value = record(input);
  return Object.fromEntries(REALITY_PORTFOLIO_COST_FIELDS.map(field => [field, integer(
    value[field] ?? value[field.toLowerCase()] ?? 0,
    `RNCS_PORTFOLIO_${field}_INVALID`,
    0,
    {max: Number.MAX_SAFE_INTEGER}
  )]));
}

function normalizeRenderProfile(input = {}) {
  const value = record(input);
  return {
    renderer_id: text(value.renderer_id ?? value.rendererId, 'RNCS_PORTFOLIO_RENDERER_ID_REQUIRED', 'provider-defined'),
    shading_model: text(value.shading_model ?? value.shadingModel, 'RNCS_PORTFOLIO_SHADING_MODEL_REQUIRED', 'provider-defined'),
    lighting_profile: text(value.lighting_profile ?? value.lightingProfile, 'RNCS_PORTFOLIO_LIGHTING_PROFILE_REQUIRED', 'provider-defined'),
    camera_profile: text(value.camera_profile ?? value.cameraProfile, 'RNCS_PORTFOLIO_CAMERA_PROFILE_REQUIRED', 'default'),
    resolution_class: text(value.resolution_class ?? value.resolutionClass, 'RNCS_PORTFOLIO_RESOLUTION_CLASS_REQUIRED', 'preview'),
    width: integer(value.width, 'RNCS_PORTFOLIO_RENDER_WIDTH_INVALID', 640, {min: 1, max: 16384}),
    height: integer(value.height, 'RNCS_PORTFOLIO_RENDER_HEIGHT_INVALID', 360, {min: 1, max: 16384}),
    post_process: text(value.post_process ?? value.postProcess, 'RNCS_PORTFOLIO_POST_PROCESS_REQUIRED', 'none'),
    options: clone(value.options ?? {})
  };
}

function normalizeDiversityAxes(input, representationKind, qualityProfile) {
  const value = record(input);
  const values = {};
  for (const [rawAxis, rawValue] of Object.entries(value)) {
    const axis = String(rawAxis).trim().toUpperCase();
    fail(REALITY_DIVERSITY_AXES.includes(axis), 'RNCS_PORTFOLIO_DIVERSITY_AXIS_INVALID');
    values[axis] = text(rawValue, 'RNCS_PORTFOLIO_DIVERSITY_VALUE_REQUIRED').toUpperCase();
  }
  values.MODALITY ??= String(representationKind).toUpperCase();
  values.DETAIL ??= qualityProfile;
  return Object.fromEntries(Object.keys(values).sort((a, b) => axesRank(a) - axesRank(b)).map(axis => [axis, values[axis]]));
}

function normalizeSlot(input = {}) {
  const value = record(input);
  const reference = record(value.reference ?? value.representation);
  const representation_id = text(value.representation_id ?? value.representationId ?? reference.representation_id ?? reference.id, 'RNCS_PORTFOLIO_REPRESENTATION_ID_REQUIRED');
  const representation_root = root(value.representation_root ?? value.representationRoot ?? reference.representation_root, 'RNCS_PORTFOLIO_REPRESENTATION_ROOT_INVALID');
  const representation_kind = text(value.representation_kind ?? value.representationKind ?? reference.representation_kind ?? reference.kind, 'RNCS_PORTFOLIO_REPRESENTATION_KIND_REQUIRED');
  const quality_profile = text(value.quality_profile ?? value.qualityProfile, 'RNCS_PORTFOLIO_QUALITY_PROFILE_REQUIRED', 'STANDARD').toUpperCase();
  fail(REALITY_VISUAL_QUALITY_PROFILES.includes(quality_profile), 'RNCS_PORTFOLIO_QUALITY_PROFILE_INVALID');
  const slot_id = text(value.slot_id ?? value.slotId, 'RNCS_PORTFOLIO_SLOT_ID_REQUIRED', `slot:${representation_id}:${quality_profile.toLowerCase()}`);
  const fallback = value.fallback_slot_id ?? value.fallbackSlotId ?? null;
  if (fallback !== null) text(fallback, 'RNCS_PORTFOLIO_FALLBACK_SLOT_ID_INVALID');
  const base = {
    format: REALITY_REPRESENTATION_SLOT_FORMAT,
    version: REALITY_REPRESENTATION_PORTFOLIO_VERSION,
    slot_id,
    representation_id,
    representation_root,
    representation_kind,
    quality_profile,
    quality_rank: qualityRank(quality_profile),
    diversity_axes: normalizeDiversityAxes(value.diversity_axes ?? value.diversityAxes, representation_kind, quality_profile),
    render_profile: normalizeRenderProfile(value.render_profile ?? value.renderProfile),
    resource_costs: normalizeResourceCosts(value.resource_costs ?? value.resourceCosts),
    fallback_slot_id: fallback === null ? null : String(fallback).trim(),
    required_for_minimum: bool(value.required_for_minimum ?? value.requiredForMinimum, 'RNCS_PORTFOLIO_REQUIRED_FOR_MINIMUM_INVALID', false),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, slot_root: rootHash(base)};
}

function normalizeComposition(input, slots) {
  const value = record(input);
  const min_slots = integer(value.min_slots ?? value.minSlots, 'RNCS_PORTFOLIO_MIN_SLOTS_INVALID', 1, {min: 1, max: 64});
  const max_slots = integer(value.max_slots ?? value.maxSlots, 'RNCS_PORTFOLIO_MAX_SLOTS_INVALID', Math.max(min_slots, 8), {min: 1, max: 64});
  fail(min_slots <= max_slots, 'RNCS_PORTFOLIO_SLOT_RANGE_INVALID');
  const quality_ladder = orderedUnique(value.quality_ladder ?? value.qualityLadder ?? slots.map(slot => slot.quality_profile), REALITY_VISUAL_QUALITY_PROFILES, 'RNCS_PORTFOLIO_QUALITY_LADDER_INVALID');
  fail(quality_ladder.length > 0, 'RNCS_PORTFOLIO_QUALITY_LADDER_REQUIRED');
  const required_quality_profiles = orderedUnique(value.required_quality_profiles ?? value.requiredQualityProfiles, REALITY_VISUAL_QUALITY_PROFILES, 'RNCS_PORTFOLIO_REQUIRED_QUALITY_INVALID');
  fail(required_quality_profiles.every(profile => quality_ladder.includes(profile)), 'RNCS_PORTFOLIO_REQUIRED_QUALITY_NOT_IN_LADDER');
  const diversity_targets = {};
  const rawTargets = record(value.diversity_targets ?? value.diversityTargets);
  for (const [rawAxis, rawTarget] of Object.entries(rawTargets)) {
    const axis = String(rawAxis).trim().toUpperCase();
    fail(REALITY_DIVERSITY_AXES.includes(axis), 'RNCS_PORTFOLIO_DIVERSITY_TARGET_AXIS_INVALID');
    diversity_targets[axis] = integer(rawTarget, 'RNCS_PORTFOLIO_DIVERSITY_TARGET_INVALID', 0, {max: 64});
  }
  const orderedTargets = Object.fromEntries(Object.keys(diversity_targets).sort((a, b) => axesRank(a) - axesRank(b)).map(axis => [axis, diversity_targets[axis]]));
  const required_kinds = strings(value.required_kinds ?? value.requiredKinds);
  const mode = text(value.mode, 'RNCS_PORTFOLIO_MODE_REQUIRED', 'BALANCED').toUpperCase();
  fail(REALITY_PORTFOLIO_MODES.includes(mode), 'RNCS_PORTFOLIO_MODE_INVALID');
  return {
    mode,
    min_slots,
    max_slots,
    required_kinds,
    required_quality_profiles,
    quality_ladder,
    diversity_targets: orderedTargets
  };
}

function compositionResult(composition, slots) {
  const kinds = new Set(slots.map(slot => slot.representation_kind));
  const qualities = new Set(slots.map(slot => slot.quality_profile));
  const missing_kinds = composition.required_kinds.filter(kind => !kinds.has(kind));
  const missing_quality_profiles = composition.required_quality_profiles.filter(profile => !qualities.has(profile));
  const distinct_by_axis = Object.fromEntries(REALITY_DIVERSITY_AXES.map(axis => [axis, new Set(slots.map(slot => slot.diversity_axes[axis]).filter(Boolean)).size]));
  const count_satisfied = slots.length >= composition.min_slots && slots.length <= composition.max_slots;
  const diversity_satisfied = Object.entries(composition.diversity_targets).every(([axis, target]) => distinct_by_axis[axis] >= target);
  const requirements_satisfied = missing_kinds.length === 0 && missing_quality_profiles.length === 0;
  return {
    slot_count: slots.length,
    count_satisfied,
    missing_kinds,
    missing_quality_profiles,
    distinct_by_axis,
    diversity_satisfied,
    requirements_satisfied,
    composition_status: count_satisfied && diversity_satisfied && requirements_satisfied ? 'READY' : 'INCOMPLETE'
  };
}

export function createRepresentationSlot(input = {}) {
  const value = record(input);
  fail(value.authoritative !== true, 'RNCS_PORTFOLIO_SLOT_CANNOT_BE_AUTHORITATIVE');
  fail(value.candidate_only !== false, 'RNCS_PORTFOLIO_SLOT_MUST_BE_CANDIDATE_ONLY');
  return normalizeSlot(value);
}

export function verifyRepresentationSlot(slot) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!slot || typeof slot !== 'object') return {valid: false, errors: ['RNCS_PORTFOLIO_SLOT_NOT_OBJECT']};
  try {
    const copy = clone(slot);
    const slotRoot = copy.slot_root;
    delete copy.slot_root;
    check(slot.format === REALITY_REPRESENTATION_SLOT_FORMAT, 'RNCS_PORTFOLIO_SLOT_FORMAT_INVALID');
    check(slot.version === REALITY_REPRESENTATION_PORTFOLIO_VERSION, 'RNCS_PORTFOLIO_SLOT_VERSION_INVALID');
    for (const field of ['slot_id', 'representation_id', 'representation_kind']) check(typeof slot[field] === 'string' && slot[field].length > 0, `RNCS_PORTFOLIO_${field.toUpperCase()}_REQUIRED`);
    check(hex64(slot.representation_root), 'RNCS_PORTFOLIO_REPRESENTATION_ROOT_INVALID');
    check(REALITY_VISUAL_QUALITY_PROFILES.includes(slot.quality_profile), 'RNCS_PORTFOLIO_QUALITY_PROFILE_INVALID');
    check(slot.quality_rank === qualityRank(slot.quality_profile), 'RNCS_PORTFOLIO_QUALITY_RANK_MISMATCH');
    check(slot.diversity_axes && typeof slot.diversity_axes === 'object' && !Array.isArray(slot.diversity_axes), 'RNCS_PORTFOLIO_DIVERSITY_AXES_INVALID');
    for (const [axis, value] of Object.entries(slot.diversity_axes ?? {})) {
      check(REALITY_DIVERSITY_AXES.includes(axis), 'RNCS_PORTFOLIO_DIVERSITY_AXIS_INVALID');
      check(typeof value === 'string' && value.length > 0, 'RNCS_PORTFOLIO_DIVERSITY_VALUE_INVALID');
    }
    check(typeof slot.diversity_axes?.MODALITY === 'string' && slot.diversity_axes.MODALITY.length > 0, 'RNCS_PORTFOLIO_MODALITY_REQUIRED');
    check(typeof slot.diversity_axes?.DETAIL === 'string' && slot.diversity_axes.DETAIL.length > 0, 'RNCS_PORTFOLIO_DETAIL_AXIS_REQUIRED');
    const render = slot.render_profile;
    check(render && typeof render === 'object' && !Array.isArray(render), 'RNCS_PORTFOLIO_RENDER_PROFILE_INVALID');
    for (const field of ['renderer_id', 'shading_model', 'lighting_profile', 'camera_profile', 'resolution_class', 'post_process']) check(typeof render?.[field] === 'string' && render[field].length > 0, `RNCS_PORTFOLIO_RENDER_${field.toUpperCase()}_INVALID`);
    for (const field of ['width', 'height']) check(Number.isSafeInteger(render?.[field]) && render[field] >= 1 && render[field] <= 16384, `RNCS_PORTFOLIO_RENDER_${field.toUpperCase()}_INVALID`);
    for (const field of REALITY_PORTFOLIO_COST_FIELDS) check(Number.isSafeInteger(slot.resource_costs?.[field]) && slot.resource_costs[field] >= 0, `RNCS_PORTFOLIO_${field}_INVALID`);
    check(slot.fallback_slot_id === null || (typeof slot.fallback_slot_id === 'string' && slot.fallback_slot_id.length > 0), 'RNCS_PORTFOLIO_FALLBACK_SLOT_ID_INVALID');
    check(typeof slot.required_for_minimum === 'boolean', 'RNCS_PORTFOLIO_REQUIRED_FOR_MINIMUM_INVALID');
    check(Array.isArray(slot.evidence_refs), 'RNCS_PORTFOLIO_SLOT_EVIDENCE_REFS_INVALID');
    check(slot.candidate_only === true && slot.authoritative === false, 'RNCS_PORTFOLIO_SLOT_CANDIDATE_REQUIRED');
    check(slot.commit_status === 'NOT_COMMITTED', 'RNCS_PORTFOLIO_SLOT_COMMIT_STATUS_INVALID');
    check(hex64(slotRoot) && rootHash(copy) === slotRoot, 'RNCS_PORTFOLIO_SLOT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_PORTFOLIO_SLOT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, slot_root: slot.slot_root ?? null};
}

export function evaluateRepresentationPortfolioComposition(composition, slots) {
  const normalized = normalizeComposition(composition, slots);
  return compositionResult(normalized, slots);
}

export function createRepresentationPortfolio(input = {}) {
  const value = record(input);
  fail(value.authoritative !== true, 'RNCS_PORTFOLIO_CANNOT_BE_AUTHORITATIVE');
  fail(value.candidate_only !== false, 'RNCS_PORTFOLIO_MUST_BE_CANDIDATE_ONLY');
  const object_id = text(value.object_id ?? value.objectId, 'RNCS_PORTFOLIO_OBJECT_ID_REQUIRED');
  const canonical_state_root = root(value.canonical_state_root ?? value.canonicalStateRoot ?? value.state_root ?? value.stateRoot, 'RNCS_PORTFOLIO_CANONICAL_STATE_ROOT_INVALID');
  const slots = (Array.isArray(value.slots) ? value.slots : []).map(slot => slot?.slot_root ? clone(slot) : createRepresentationSlot(slot));
  for (const slot of slots) fail(verifyRepresentationSlot(slot).valid, `RNCS_PORTFOLIO_SLOT_INVALID:${slot.slot_id}`);
  const orderedSlots = [...slots].sort((a, b) => keySort(a.slot_id, b.slot_id));
  const slotIds = orderedSlots.map(slot => slot.slot_id);
  fail(new Set(slotIds).size === slotIds.length, 'RNCS_PORTFOLIO_SLOT_ID_DUPLICATE');
  const composition = normalizeComposition(value.composition ?? value.composition_policy ?? value.compositionPolicy, orderedSlots);
  const active_slot_id = value.active_slot_id ?? value.activeSlotId ?? null;
  if (active_slot_id !== null) fail(slotIds.includes(String(active_slot_id)), 'RNCS_PORTFOLIO_ACTIVE_SLOT_UNKNOWN');
  const content_root = value.content_root ?? value.contentRoot ?? rootHash({object_id, canonical_state_root, slot_roots: orderedSlots.map(slot => slot.slot_root)});
  const normalizedContentRoot = root(content_root, 'RNCS_PORTFOLIO_CONTENT_ROOT_INVALID');
  const base = {
    format: REALITY_REPRESENTATION_PORTFOLIO_FORMAT,
    version: REALITY_REPRESENTATION_PORTFOLIO_VERSION,
    portfolio_id: text(value.portfolio_id ?? value.portfolioId, 'RNCS_PORTFOLIO_ID_REQUIRED', `portfolio:${object_id}`),
    object_id,
    canonical_state_root,
    content_root: normalizedContentRoot,
    composition,
    composition_result: compositionResult(composition, orderedSlots),
    slots: orderedSlots,
    active_slot_id: active_slot_id === null ? null : String(active_slot_id),
    fallback_policy: {
      enabled: bool(value.fallback_policy?.enabled ?? value.fallbackPolicy?.enabled, 'RNCS_PORTFOLIO_FALLBACK_POLICY_ENABLED_INVALID', true),
      preserve_minimum_reality: bool(value.fallback_policy?.preserve_minimum_reality ?? value.fallbackPolicy?.preserveMinimumReality, 'RNCS_PORTFOLIO_FALLBACK_PRESERVE_MINIMUM_INVALID', true),
      selection_order: 'quality-desc-then-slot-id'
    },
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs),
    authority: {
      portfolio_may_write_authoritative_world_state: false,
      canonical_write_authorized: false,
      rncs_authority_required: true
    },
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, portfolio_root: rootHash(base)};
}

export function verifyRepresentationPortfolio(portfolio) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!portfolio || typeof portfolio !== 'object') return {valid: false, errors: ['RNCS_PORTFOLIO_NOT_OBJECT']};
  try {
    const copy = clone(portfolio);
    const portfolioRoot = copy.portfolio_root;
    delete copy.portfolio_root;
    check(portfolio.format === REALITY_REPRESENTATION_PORTFOLIO_FORMAT, 'RNCS_PORTFOLIO_FORMAT_INVALID');
    check(portfolio.version === REALITY_REPRESENTATION_PORTFOLIO_VERSION, 'RNCS_PORTFOLIO_VERSION_INVALID');
    check(typeof portfolio.portfolio_id === 'string' && portfolio.portfolio_id.length > 0, 'RNCS_PORTFOLIO_ID_REQUIRED');
    check(typeof portfolio.object_id === 'string' && portfolio.object_id.length > 0, 'RNCS_PORTFOLIO_OBJECT_ID_REQUIRED');
    check(hex64(portfolio.canonical_state_root), 'RNCS_PORTFOLIO_CANONICAL_STATE_ROOT_INVALID');
    check(hex64(portfolio.content_root), 'RNCS_PORTFOLIO_CONTENT_ROOT_INVALID');
    check(portfolio.composition && typeof portfolio.composition === 'object' && !Array.isArray(portfolio.composition), 'RNCS_PORTFOLIO_COMPOSITION_INVALID');
    if (portfolio.composition) {
      const composition = portfolio.composition;
      check(REALITY_PORTFOLIO_MODES.includes(composition.mode), 'RNCS_PORTFOLIO_MODE_INVALID');
      check(Number.isSafeInteger(composition.min_slots) && composition.min_slots >= 1 && composition.min_slots <= 64, 'RNCS_PORTFOLIO_MIN_SLOTS_INVALID');
      check(Number.isSafeInteger(composition.max_slots) && composition.max_slots >= composition.min_slots && composition.max_slots <= 64, 'RNCS_PORTFOLIO_MAX_SLOTS_INVALID');
      check(Array.isArray(composition.required_kinds) && composition.required_kinds.every(value => typeof value === 'string' && value.length > 0), 'RNCS_PORTFOLIO_REQUIRED_KINDS_INVALID');
      check(Array.isArray(composition.quality_ladder) && composition.quality_ladder.length > 0 && composition.quality_ladder.every(value => REALITY_VISUAL_QUALITY_PROFILES.includes(value)), 'RNCS_PORTFOLIO_QUALITY_LADDER_INVALID');
      check(Array.isArray(composition.required_quality_profiles) && composition.required_quality_profiles.every(value => composition.quality_ladder.includes(value)), 'RNCS_PORTFOLIO_REQUIRED_QUALITY_INVALID');
      check(composition.diversity_targets && typeof composition.diversity_targets === 'object' && !Array.isArray(composition.diversity_targets), 'RNCS_PORTFOLIO_DIVERSITY_TARGETS_INVALID');
      for (const [axis, target] of Object.entries(composition.diversity_targets ?? {})) {
        check(REALITY_DIVERSITY_AXES.includes(axis), 'RNCS_PORTFOLIO_DIVERSITY_TARGET_AXIS_INVALID');
        check(Number.isSafeInteger(target) && target >= 0 && target <= 64, 'RNCS_PORTFOLIO_DIVERSITY_TARGET_INVALID');
      }
    }
    check(Array.isArray(portfolio.slots), 'RNCS_PORTFOLIO_SLOTS_INVALID');
    const slots = portfolio.slots ?? [];
    const ids = slots.map(slot => slot?.slot_id);
    check(new Set(ids).size === ids.length, 'RNCS_PORTFOLIO_SLOT_ID_DUPLICATE');
    check(ids.every((id, index) => typeof id === 'string' && (index === 0 || keySort(ids[index - 1], id) <= 0)), 'RNCS_PORTFOLIO_SLOTS_UNSORTED');
    for (const slot of slots) {
      const verification = verifyRepresentationSlot(slot);
      check(verification.valid, `RNCS_PORTFOLIO_SLOT_INVALID:${slot?.slot_id ?? 'unknown'}`);
      check(slot?.fallback_slot_id === null || ids.includes(slot?.fallback_slot_id), 'RNCS_PORTFOLIO_FALLBACK_SLOT_UNKNOWN');
      check(slot?.fallback_slot_id !== slot?.slot_id, 'RNCS_PORTFOLIO_FALLBACK_SELF_REFERENCE');
    }
    check(portfolio.active_slot_id === null || ids.includes(portfolio.active_slot_id), 'RNCS_PORTFOLIO_ACTIVE_SLOT_UNKNOWN');
    const expectedResult = portfolio.composition ? compositionResult(portfolio.composition, slots) : null;
    check(JSON.stringify(portfolio.composition_result) === JSON.stringify(expectedResult), 'RNCS_PORTFOLIO_COMPOSITION_RESULT_MISMATCH');
    check(portfolio.fallback_policy?.enabled === true, 'RNCS_PORTFOLIO_FALLBACK_POLICY_INVALID');
    check(portfolio.fallback_policy?.preserve_minimum_reality === true, 'RNCS_PORTFOLIO_FALLBACK_MINIMUM_POLICY_INVALID');
    check(portfolio.fallback_policy?.selection_order === 'quality-desc-then-slot-id', 'RNCS_PORTFOLIO_FALLBACK_ORDER_INVALID');
    check(Array.isArray(portfolio.evidence_refs), 'RNCS_PORTFOLIO_EVIDENCE_REFS_INVALID');
    check(portfolio.authority?.portfolio_may_write_authoritative_world_state === false, 'RNCS_PORTFOLIO_AUTHORITY_ESCALATION');
    check(portfolio.authority?.canonical_write_authorized === false && portfolio.authority?.rncs_authority_required === true, 'RNCS_PORTFOLIO_AUTHORITY_BOUNDARY_INVALID');
    check(portfolio.candidate_only === true && portfolio.authoritative === false, 'RNCS_PORTFOLIO_CANDIDATE_REQUIRED');
    check(portfolio.commit_status === 'NOT_COMMITTED', 'RNCS_PORTFOLIO_COMMIT_STATUS_INVALID');
    check(hex64(portfolioRoot) && rootHash(copy) === portfolioRoot, 'RNCS_PORTFOLIO_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_PORTFOLIO_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, portfolio_root: portfolio.portfolio_root ?? null};
}
