import {ContractError, rootHash} from './index.mjs';

export const REALITY_CAUSAL_PHYSICAL_VERSION = '0.3.0';
export const REALITY_CAUSAL_PHYSICAL_PROFILE_FORMAT = 'rncs.causal-physical-profile.v0.3';
export const CAUSAL_DETAIL_LEVELS = Object.freeze(['C0', 'C1', 'C2', 'C3', 'C4', 'C5']);
export const PHYSICAL_DETAIL_LEVELS = Object.freeze(['P0', 'P1', 'P2', 'P3', 'P4', 'P5']);
export const CAUSAL_PHYSICAL_RESOURCE_KEYS = Object.freeze(['CPU_MILLI', 'GPU_MILLI', 'RAM_MB', 'VRAM_MB', 'ENERGY_MILLI']);

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
const root = (value, code, fallback = null) => {
  const result = String(value ?? fallback ?? '').toLowerCase();
  fail(hex64(result), code);
  return result;
};

const DEFAULT_RESOURCES = Object.freeze({CPU_MILLI: 1_000_000_000, GPU_MILLI: 1_000_000_000, RAM_MB: 1_000_000_000, VRAM_MB: 1_000_000_000, ENERGY_MILLI: 1_000_000_000});

const CAUSAL_EXECUTION = Object.freeze([
  {mode: 'macro-statistical', aggregation: 'macro', behavior: 'macro-statistics', event_frequency_hz: 1, cpu: 10, gpu: 0, ram: 4, vram: 0, energy: 1},
  {mode: 'system-causal', aggregation: 'system', behavior: 'system-causal', event_frequency_hz: 2, cpu: 20, gpu: 0, ram: 8, vram: 0, energy: 2},
  {mode: 'group-agent', aggregation: 'group-agent', behavior: 'group-agent', event_frequency_hz: 5, cpu: 40, gpu: 5, ram: 16, vram: 1, energy: 4},
  {mode: 'individual-event', aggregation: 'individual', behavior: 'individual-event', event_frequency_hz: 10, cpu: 80, gpu: 10, ram: 32, vram: 2, energy: 8},
  {mode: 'local-interaction', aggregation: 'local-interaction', behavior: 'local-interaction', event_frequency_hz: 30, cpu: 160, gpu: 20, ram: 64, vram: 4, energy: 16},
  {mode: 'continuous-high-fidelity', aggregation: 'continuous', behavior: 'continuous-causal', event_frequency_hz: 60, cpu: 320, gpu: 40, ram: 128, vram: 8, energy: 32}
]);

const PHYSICAL_EXECUTION = Object.freeze([
  {mode: 'statistical', collision: 'none', interaction: 'none', physics_frequency_hz: 0, topology: false, field: false, cpu: 0, gpu: 0, ram: 0, vram: 0, energy: 0},
  {mode: 'occupancy-proxy', collision: 'occupancy', interaction: 'broad-phase', physics_frequency_hz: 1, topology: false, field: false, cpu: 20, gpu: 5, ram: 8, vram: 1, energy: 2},
  {mode: 'stable-rigid-proxy', collision: 'stable-rigid', interaction: 'rigid-proxy', physics_frequency_hz: 10, topology: false, field: false, cpu: 60, gpu: 10, ram: 16, vram: 2, energy: 6},
  {mode: 'precise-rigid-soft', collision: 'precise-rigid-soft', interaction: 'rigid-soft', physics_frequency_hz: 30, topology: false, field: false, cpu: 140, gpu: 25, ram: 48, vram: 6, energy: 14},
  {mode: 'destruction-topology', collision: 'destruction-topology', interaction: 'material-topology', physics_frequency_hz: 60, topology: true, field: false, cpu: 280, gpu: 50, ram: 96, vram: 12, energy: 28},
  {mode: 'field-high-fidelity', collision: 'field', interaction: 'field-coupled', physics_frequency_hz: 120, topology: true, field: true, cpu: 560, gpu: 120, ram: 256, vram: 32, energy: 56}
]);

function percentage(value, code, fallback = 0) {
  return integer(value, code, fallback, {min: 0, max: 100});
}

function levelFromScore(score) {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 55) return 3;
  if (score >= 30) return 2;
  if (score >= 10) return 1;
  return 0;
}

function levelCode(value, prefix, code, fallback = 0) {
  const raw = value === undefined || value === null ? fallback : value;
  const numeric = typeof raw === 'string' && new RegExp(`^${prefix}[0-5]$`, 'i').test(raw) ? Number(raw.slice(1)) : Number(raw);
  fail(Number.isSafeInteger(numeric) && numeric >= 0 && numeric <= 5, code);
  return `${prefix}${numeric}`;
}

function levelNumber(value, prefix, code) {
  const normalized = levelCode(value, prefix, code);
  return Number(normalized.slice(1));
}

function normalizeResources(input) {
  const value = record(input);
  const available = {};
  for (const key of CAUSAL_PHYSICAL_RESOURCE_KEYS) available[key] = integer(value[key] ?? value[key.toLowerCase()] ?? DEFAULT_RESOURCES[key], `RNCS_CAUSAL_PHYSICAL_RESOURCE_${key}_INVALID`, DEFAULT_RESOURCES[key]);
  return available;
}

function taskSignals(task) {
  const value = String(task).toLowerCase();
  if (/(field|fluid|destruction|high.?fidelity|science|simulation)/.test(value)) return {causal: 5, physical: 5, reason: 'task:high-fidelity-simulation'};
  if (/(combat|battle|collision|damage|physics|construction)/.test(value)) return {causal: 4, physical: 4, reason: 'task:interactive-physics'};
  if (/(npc|social|family|group|workplace)/.test(value)) return {causal: 3, physical: 2, reason: 'task:agent-causality'};
  if (/(economy|logistics|industry|migration|price|trade)/.test(value)) return {causal: 2, physical: 1, reason: 'task:system-causality'};
  if (/(navigation|ambient|background|far|overview)/.test(value)) return {causal: 0, physical: 0, reason: 'task:macro-proxy'};
  return {causal: 1, physical: 1, reason: 'task:default'};
}

function normalizeDemand(input = {}) {
  const value = record(input);
  const task = text(value.task ?? value.intent ?? value.activity, 'RNCS_CAUSAL_PHYSICAL_TASK_REQUIRED', 'ambient');
  return {
    task,
    interaction_probability: percentage(value.interaction_probability ?? value.interactionProbability, 'RNCS_CAUSAL_PHYSICAL_INTERACTION_INVALID'),
    risk: percentage(value.risk, 'RNCS_CAUSAL_PHYSICAL_RISK_INVALID'),
    observation: percentage(value.observation ?? value.observed ?? value.observation_priority, 'RNCS_CAUSAL_PHYSICAL_OBSERVATION_INVALID'),
    authority: percentage(value.authority ?? value.authority_criticality, 'RNCS_CAUSAL_PHYSICAL_AUTHORITY_INVALID'),
    event_intensity: percentage(value.event_intensity ?? value.eventIntensity, 'RNCS_CAUSAL_PHYSICAL_EVENT_INTENSITY_INVALID'),
    available_resources: normalizeResources(value.available_resources ?? value.availableResources ?? value.resources)
  };
}

export function deriveCausalPhysicalRequirement(input = {}) {
  const demand = normalizeDemand(input);
  const task = taskSignals(demand.task);
  const causalFactors = [
    task.causal,
    levelFromScore(demand.interaction_probability),
    levelFromScore(demand.risk),
    levelFromScore(demand.event_intensity),
    Math.min(5, levelFromScore(demand.authority) + (demand.authority >= 70 ? 1 : 0)),
    Math.max(0, levelFromScore(demand.observation) - 1)
  ];
  const physicalFactors = [
    task.physical,
    levelFromScore(demand.interaction_probability),
    levelFromScore(demand.risk),
    levelFromScore(demand.observation),
    levelFromScore(demand.event_intensity)
  ];
  const causalLevel = Math.max(...causalFactors);
  const physicalLevel = Math.max(...physicalFactors);
  const rationale = [task.reason];
  if (demand.interaction_probability >= 55) rationale.push('interaction>=55');
  if (demand.risk >= 55) rationale.push('risk>=55');
  if (demand.observation >= 55) rationale.push('observation>=55');
  if (demand.authority >= 70) rationale.push('authority>=70');
  if (demand.event_intensity >= 55) rationale.push('event-intensity>=55');
  return {
    causal_level: `C${causalLevel}`,
    physical_level: `P${physicalLevel}`,
    score: {causal: causalLevel, physical: physicalLevel},
    rationale: [...new Set(rationale)].sort(keySort)
  };
}

function executionFor(causalLevel, physicalLevel) {
  const causal = CAUSAL_EXECUTION[levelNumber(causalLevel, 'C', 'RNCS_CAUSAL_PHYSICAL_CAUSAL_LEVEL_INVALID')];
  const physical = PHYSICAL_EXECUTION[levelNumber(physicalLevel, 'P', 'RNCS_CAUSAL_PHYSICAL_PHYSICAL_LEVEL_INVALID')];
  return {
    causal_mode: causal.mode,
    physical_mode: physical.mode,
    behavior_mode: `${causal.behavior}+${physical.interaction}`,
    aggregation_mode: causal.aggregation,
    collision_mode: physical.collision,
    interaction_resolution: physical.interaction,
    event_frequency_hz: causal.event_frequency_hz,
    physics_frequency_hz: physical.physics_frequency_hz,
    topology_mutation_allowed: physical.topology,
    field_solver_enabled: physical.field,
    causal_detail: causalLevel,
    physical_detail: physicalLevel
  };
}

function resourceCosts(causalLevel, physicalLevel) {
  const causal = CAUSAL_EXECUTION[levelNumber(causalLevel, 'C', 'RNCS_CAUSAL_PHYSICAL_CAUSAL_LEVEL_INVALID')];
  const physical = PHYSICAL_EXECUTION[levelNumber(physicalLevel, 'P', 'RNCS_CAUSAL_PHYSICAL_PHYSICAL_LEVEL_INVALID')];
  return {
    CPU_MILLI: causal.cpu + physical.cpu,
    GPU_MILLI: causal.gpu + physical.gpu,
    RAM_MB: causal.ram + physical.ram,
    VRAM_MB: causal.vram + physical.vram,
    ENERGY_MILLI: causal.energy + physical.energy
  };
}

function resourceAdmission(costs, available) {
  const missing_resources = CAUSAL_PHYSICAL_RESOURCE_KEYS.filter(key => costs[key] > available[key]).sort(keySort);
  return {
    status: missing_resources.length === 0 ? 'ADMITTED' : 'RESOURCE_INSUFFICIENT',
    missing_resources,
    available_resources: clone(available)
  };
}

export function createCausalPhysicalProfile(input = {}) {
  const value = record(input);
  const object_id = text(value.object_id ?? value.objectId, 'RNCS_CAUSAL_PHYSICAL_OBJECT_ID_REQUIRED');
  const demand = normalizeDemand(value.demand ?? value.requirement ?? value);
  const requirement = deriveCausalPhysicalRequirement(demand);
  const selectedInput = record(value.selected ?? value.selection ?? value.selected_detail);
  const selected_causal_level = levelCode(selectedInput.causal_level ?? selectedInput.causalLevel ?? value.selected_causal_level ?? value.selectedCausalLevel ?? value.causal_level ?? value.causalLevel, 'C', 'RNCS_CAUSAL_PHYSICAL_SELECTED_CAUSAL_LEVEL_INVALID', levelNumber(requirement.causal_level, 'C', 'RNCS_CAUSAL_PHYSICAL_REQUIREMENT_INVALID'));
  const selected_physical_level = levelCode(selectedInput.physical_level ?? selectedInput.physicalLevel ?? value.selected_physical_level ?? value.selectedPhysicalLevel ?? value.physical_level ?? value.physicalLevel, 'P', 'RNCS_CAUSAL_PHYSICAL_SELECTED_PHYSICAL_LEVEL_INVALID', levelNumber(requirement.physical_level, 'P', 'RNCS_CAUSAL_PHYSICAL_REQUIREMENT_INVALID'));
  fail(levelNumber(selected_causal_level, 'C', 'RNCS_CAUSAL_PHYSICAL_SELECTED_CAUSAL_LEVEL_INVALID') >= levelNumber(requirement.causal_level, 'C', 'RNCS_CAUSAL_PHYSICAL_REQUIREMENT_INVALID'), 'RNCS_CAUSAL_PHYSICAL_CAUSAL_BELOW_REQUIRED');
  fail(levelNumber(selected_physical_level, 'P', 'RNCS_CAUSAL_PHYSICAL_SELECTED_PHYSICAL_LEVEL_INVALID') >= levelNumber(requirement.physical_level, 'P', 'RNCS_CAUSAL_PHYSICAL_REQUIREMENT_INVALID'), 'RNCS_CAUSAL_PHYSICAL_PHYSICAL_BELOW_REQUIRED');
  const execution = executionFor(selected_causal_level, selected_physical_level);
  const resource_costs = resourceCosts(selected_causal_level, selected_physical_level);
  const resource_admission = resourceAdmission(resource_costs, demand.available_resources);
  const base = {
    format: REALITY_CAUSAL_PHYSICAL_PROFILE_FORMAT,
    version: REALITY_CAUSAL_PHYSICAL_VERSION,
    profile_id: text(value.profile_id ?? value.profileId, 'RNCS_CAUSAL_PHYSICAL_PROFILE_ID_REQUIRED', `causal-physical:${object_id}`),
    object_id,
    branch: text(value.branch, 'RNCS_CAUSAL_PHYSICAL_BRANCH_REQUIRED', 'main'),
    canonical_state_root: root(value.canonical_state_root ?? value.canonicalStateRoot ?? value.state_root ?? value.stateRoot, 'RNCS_CAUSAL_PHYSICAL_STATE_ROOT_REQUIRED'),
    demand,
    requirement,
    selected: {causal_level: selected_causal_level, physical_level: selected_physical_level},
    causal_level: selected_causal_level,
    physical_level: selected_physical_level,
    execution,
    resource_costs,
    resource_admission,
    execution_status: resource_admission.status === 'ADMITTED' ? 'READY' : 'BLOCKED_RESOURCE',
    fallback_policy: {
      on_insufficient_resources: text(value.fallback_policy?.on_insufficient_resources ?? value.fallbackPolicy?.onInsufficientResources, 'RNCS_CAUSAL_PHYSICAL_FALLBACK_POLICY_REQUIRED', 'HOLD_REQUIRED_DETAIL'),
      preserves_safety: true,
      preserves_authority: true
    },
    evidence_refs: [...new Set((Array.isArray(value.evidence_refs ?? value.evidenceRefs) ? (value.evidence_refs ?? value.evidenceRefs) : []).map(String).filter(Boolean))].sort(keySort),
    authority: {
      canonical_owner: 'RNCS',
      provider_can_write_authoritative_world_state: false,
      rncs_authority_required: true,
      candidate_only: true
    },
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    commit_status: 'NOT_COMMITTED'
  };
  const profile = {...base, profile_root: rootHash(base)};
  const verification = verifyCausalPhysicalProfile(profile);
  fail(verification.valid, `RNCS_CAUSAL_PHYSICAL_PROFILE_INVALID:${verification.errors.join(',')}`);
  return profile;
}

export function verifyCausalPhysicalProfile(profile) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return {valid: false, errors: ['RNCS_CAUSAL_PHYSICAL_PROFILE_NOT_OBJECT']};
  try {
    const copy = clone(profile);
    const profileRoot = copy.profile_root;
    delete copy.profile_root;
    check(profile.format === REALITY_CAUSAL_PHYSICAL_PROFILE_FORMAT, 'RNCS_CAUSAL_PHYSICAL_FORMAT_INVALID');
    check(profile.version === REALITY_CAUSAL_PHYSICAL_VERSION, 'RNCS_CAUSAL_PHYSICAL_VERSION_INVALID');
    for (const field of ['profile_id', 'object_id', 'branch']) check(typeof profile[field] === 'string' && profile[field].length > 0, `RNCS_CAUSAL_PHYSICAL_${field.toUpperCase()}_REQUIRED`);
    check(hex64(profile.canonical_state_root), 'RNCS_CAUSAL_PHYSICAL_STATE_ROOT_INVALID');
    const demand = normalizeDemand(profile.demand);
    check(rootHash(demand) === rootHash(profile.demand), 'RNCS_CAUSAL_PHYSICAL_DEMAND_MISMATCH');
    const requirement = deriveCausalPhysicalRequirement(demand);
    check(rootHash(requirement) === rootHash(profile.requirement), 'RNCS_CAUSAL_PHYSICAL_REQUIREMENT_MISMATCH');
    check(CAUSAL_DETAIL_LEVELS.includes(profile.selected?.causal_level), 'RNCS_CAUSAL_PHYSICAL_SELECTED_CAUSAL_LEVEL_INVALID');
    check(PHYSICAL_DETAIL_LEVELS.includes(profile.selected?.physical_level), 'RNCS_CAUSAL_PHYSICAL_SELECTED_PHYSICAL_LEVEL_INVALID');
    check(profile.causal_level === profile.selected?.causal_level && profile.physical_level === profile.selected?.physical_level, 'RNCS_CAUSAL_PHYSICAL_SELECTED_ALIAS_MISMATCH');
    if (CAUSAL_DETAIL_LEVELS.includes(profile.selected?.causal_level) && CAUSAL_DETAIL_LEVELS.includes(requirement.causal_level)) check(levelNumber(profile.selected.causal_level, 'C', 'RNCS_CAUSAL_PHYSICAL_SELECTED_CAUSAL_LEVEL_INVALID') >= levelNumber(requirement.causal_level, 'C', 'RNCS_CAUSAL_PHYSICAL_REQUIREMENT_INVALID'), 'RNCS_CAUSAL_PHYSICAL_CAUSAL_BELOW_REQUIRED');
    if (PHYSICAL_DETAIL_LEVELS.includes(profile.selected?.physical_level) && PHYSICAL_DETAIL_LEVELS.includes(requirement.physical_level)) check(levelNumber(profile.selected.physical_level, 'P', 'RNCS_CAUSAL_PHYSICAL_SELECTED_PHYSICAL_LEVEL_INVALID') >= levelNumber(requirement.physical_level, 'P', 'RNCS_CAUSAL_PHYSICAL_REQUIREMENT_INVALID'), 'RNCS_CAUSAL_PHYSICAL_PHYSICAL_BELOW_REQUIRED');
    const execution = executionFor(profile.selected?.causal_level, profile.selected?.physical_level);
    const costs = resourceCosts(profile.selected?.causal_level, profile.selected?.physical_level);
    check(rootHash(execution) === rootHash(profile.execution), 'RNCS_CAUSAL_PHYSICAL_EXECUTION_MISMATCH');
    check(rootHash(costs) === rootHash(profile.resource_costs), 'RNCS_CAUSAL_PHYSICAL_COST_MISMATCH');
    const admission = resourceAdmission(costs, demand.available_resources);
    check(rootHash(admission) === rootHash(profile.resource_admission), 'RNCS_CAUSAL_PHYSICAL_RESOURCE_ADMISSION_MISMATCH');
    check(profile.execution_status === (admission.status === 'ADMITTED' ? 'READY' : 'BLOCKED_RESOURCE'), 'RNCS_CAUSAL_PHYSICAL_EXECUTION_STATUS_MISMATCH');
    check(profile.fallback_policy?.preserves_safety === true && profile.fallback_policy?.preserves_authority === true, 'RNCS_CAUSAL_PHYSICAL_FALLBACK_SAFETY_INVALID');
    check(Array.isArray(profile.evidence_refs), 'RNCS_CAUSAL_PHYSICAL_EVIDENCE_REFS_INVALID');
    check(profile.authority?.canonical_owner === 'RNCS' && profile.authority?.provider_can_write_authoritative_world_state === false && profile.authority?.rncs_authority_required === true && profile.authority?.candidate_only === true, 'RNCS_CAUSAL_PHYSICAL_AUTHORITY_BOUNDARY_INVALID');
    check(profile.candidate_only === true && profile.authoritative === false && profile.canonical_write_authorized === false && profile.commit_status === 'NOT_COMMITTED', 'RNCS_CAUSAL_PHYSICAL_CANDIDATE_REQUIRED');
    check(hex64(profileRoot) && rootHash(copy) === profileRoot, 'RNCS_CAUSAL_PHYSICAL_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_CAUSAL_PHYSICAL_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, profile_root: profile.profile_root ?? null};
}

export const createRealityCausalPhysicalProfile = createCausalPhysicalProfile;
export const verifyRealityCausalPhysicalProfile = verifyCausalPhysicalProfile;
