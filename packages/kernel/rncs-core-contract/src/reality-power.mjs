import {ContractError, rootHash} from './index.mjs';

export const REALITY_POWER_VERSION = '0.3.0';
export const REALITY_POWER_PROFILE_FORMAT = 'rncs.reality-power-profile.v0.3';
export const REALITY_RESOURCE_BUDGET_FORMAT = 'rncs.reality-resource-budget.v0.3';
export const REALITY_RESOURCE_DEMAND_FORMAT = 'rncs.reality-resource-demand.v0.3';
export const REALITY_FAULT_FORMAT = 'rncs.reality-fault.v0.3';
export const REALITY_MINIMUM_REALITY_FORMAT = 'rncs.minimum-viable-reality.v0.3';
export const REALITY_LOAD_SHEDDING_PLAN_FORMAT = 'rncs.reality-load-shedding-plan.v0.3';

export const REALITY_POWER_STATES = Object.freeze(['GRID', 'BATTERY', 'CHARGING', 'OFFLINE']);
export const REALITY_THERMAL_STATES = Object.freeze(['NOMINAL', 'WARM', 'HOT', 'CRITICAL']);
export const REALITY_POWER_MODES = Object.freeze(['ABUNDANT', 'CONSTRAINED', 'SURVIVAL', 'OFFLINE']);
export const REALITY_LOAD_SHEDDING_LEVELS = Object.freeze(['NONE', 'LIGHT', 'MODERATE', 'SEVERE', 'SURVIVAL']);
export const REALITY_POWER_PRIORITY_CLASSES = Object.freeze([
  'SAFETY',
  'AUTHORITY',
  'CONTROL',
  'MINIMUM_REALITY',
  'COLLISION',
  'SEMANTIC',
  'VISUAL',
  'PHYSICS',
  'AGENT',
  'AUDIO',
  'REFINEMENT'
]);
export const REALITY_RESOURCE_NAMES = Object.freeze([
  'CPU',
  'GPU',
  'NPU',
  'VRAM',
  'RAM',
  'STORAGE',
  'NETWORK',
  'AGENT_COMPUTE',
  'SIMULATION',
  'ENERGY'
]);
export const REALITY_FAULT_KINDS = Object.freeze([
  'NETWORK_PARTITION',
  'NODE_CRASH',
  'BATTERY_CRITICAL',
  'POWER_LOST',
  'THERMAL_THROTTLING',
  'GPU_MEMORY_PRESSURE',
  'REALITY_FAULT',
  'PROVIDER_CRASH',
  'BLUETOOTH_DISCONNECT',
  'RDN_OUTAGE',
  'WORLD_TIME_DRIFT'
]);
export const REALITY_FAULT_STATUSES = Object.freeze(['OPEN', 'ACKNOWLEDGED', 'RECOVERED']);
export const REALITY_MINIMUM_REALITY_LAYERS = Object.freeze([
  'WORLD_PROXY',
  'VISUAL',
  'COLLISION',
  'SEMANTIC',
  'AGENT',
  'AUDIO',
  'REFINEMENT'
]);
export const REALITY_LOAD_ACTIONS = Object.freeze([
  'KEEP',
  'REDUCE_DETAIL',
  'REDUCE_FREQUENCY',
  'FREEZE',
  'OFFLOAD',
  'DEFER',
  'DROP',
  'RECOVER_MINIMUM'
]);

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);
const ordered = (values, allowed, code) => {
  const result = [...new Set((Array.isArray(values) ? values : []).map(value => String(value).toUpperCase()))];
  for (const value of result) fail(allowed.includes(value), code);
  return result.sort((a, b) => allowed.indexOf(a) - allowed.indexOf(b));
};
const integer = (value, code, fallback = 0, {min = 0, max = Number.MAX_SAFE_INTEGER} = {}) => {
  const result = value === undefined || value === null ? fallback : Number(value);
  fail(Number.isSafeInteger(result) && result >= min && result <= max, code);
  return result;
};
const text = (value, code, fallback = '') => {
  const result = String(value ?? fallback);
  fail(result.length > 0, code);
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
const roots = (values, code) => (Array.isArray(values) ? values : []).map(value => root(value, code));

function thermalState(temperature, throttle, critical) {
  if (temperature >= critical) return 'CRITICAL';
  if (temperature >= throttle) return 'HOT';
  if (temperature >= throttle - 10000) return 'WARM';
  return 'NOMINAL';
}
function powerMode(powerState, batteryPercent, thermal) {
  if (powerState === 'OFFLINE' || batteryPercent <= 0) return 'OFFLINE';
  if (thermal === 'CRITICAL' || batteryPercent <= 5) return 'SURVIVAL';
  if (thermal === 'HOT' || batteryPercent <= 20 || powerState === 'BATTERY') return 'CONSTRAINED';
  return 'ABUNDANT';
}

function loadSheddingLevel(mode, thermal) {
  if (mode === 'OFFLINE' || mode === 'SURVIVAL') return 'SURVIVAL';
  if (mode === 'CONSTRAINED' && thermal === 'HOT') return 'SEVERE';
  if (mode === 'CONSTRAINED') return 'MODERATE';
  if (thermal === 'WARM') return 'LIGHT';
  return 'NONE';
}

const defaultPriorityOrder = [
  'SAFETY',
  'AUTHORITY',
  'CONTROL',
  'MINIMUM_REALITY',
  'COLLISION',
  'SEMANTIC',
  'VISUAL',
  'PHYSICS',
  'AGENT',
  'AUDIO',
  'REFINEMENT'
];

function normalizePowerProfile(input = {}) {
  const value = record(input);
  const node_id = text(value.node_id ?? value.nodeId, 'RNCS_POWER_NODE_ID_REQUIRED', 'node:local');
  const profile_id = text(value.profile_id ?? value.profileId, 'RNCS_POWER_PROFILE_ID_REQUIRED', `power:${node_id}`);
  const explicitState = value.power_state ?? value.powerState;
  const requestedState = explicitState === undefined ? null : String(explicitState).toUpperCase();
  if (requestedState !== null) fail(REALITY_POWER_STATES.includes(requestedState), 'RNCS_POWER_STATE_INVALID');
  const defaultBattery = requestedState === 'OFFLINE' ? 0 : requestedState === 'GRID' || requestedState === 'CHARGING' ? 100 : 50;
  const battery_capacity_mwh = integer(value.battery_capacity_mwh ?? value.batteryCapacityMwh, 'RNCS_POWER_BATTERY_CAPACITY_INVALID', 100000);
  const battery_percent = integer(value.battery_percent ?? value.batteryPercent, 'RNCS_POWER_BATTERY_PERCENT_INVALID', defaultBattery, {max: 100});
  const grid_connected = bool(value.grid_connected ?? value.gridConnected, 'RNCS_POWER_GRID_CONNECTION_INVALID', requestedState === 'GRID' || requestedState === 'CHARGING');
  const charging = bool(value.charging, 'RNCS_POWER_CHARGING_INVALID', requestedState === 'CHARGING');
  const power_state = requestedState ?? (grid_connected ? charging ? 'CHARGING' : 'GRID' : battery_percent > 0 ? 'BATTERY' : 'OFFLINE');
  if (power_state === 'GRID') fail(grid_connected && !charging, 'RNCS_POWER_GRID_STATE_MISMATCH');
  if (power_state === 'CHARGING') fail(grid_connected && charging, 'RNCS_POWER_CHARGING_STATE_MISMATCH');
  if (power_state === 'OFFLINE') fail(!grid_connected, 'RNCS_POWER_OFFLINE_STATE_MISMATCH');
  const energy_remaining_mwh = integer(value.energy_remaining_mwh ?? value.energyRemainingMwh, 'RNCS_POWER_ENERGY_REMAINING_INVALID', power_state === 'OFFLINE' ? 0 : Math.floor(battery_capacity_mwh * battery_percent / 100));
  const emergency_reserve_mwh = integer(value.emergency_reserve_mwh ?? value.emergencyReserveMwh, 'RNCS_POWER_EMERGENCY_RESERVE_INVALID', Math.floor(battery_capacity_mwh * 5 / 100));
  fail(energy_remaining_mwh <= battery_capacity_mwh, 'RNCS_POWER_ENERGY_EXCEEDS_CAPACITY');
  fail(emergency_reserve_mwh <= battery_capacity_mwh, 'RNCS_POWER_RESERVE_EXCEEDS_CAPACITY');
  const thermal_celsius_milli = integer(value.thermal_celsius_milli ?? value.thermalCelsiusMilli, 'RNCS_POWER_THERMAL_VALUE_INVALID', 25000, {min: -100000, max: 300000});
  const thermal_throttle_celsius_milli = integer(value.thermal_throttle_celsius_milli ?? value.thermalThrottleCelsiusMilli, 'RNCS_POWER_THERMAL_THROTTLE_INVALID', 70000, {min: -100000, max: 300000});
  const thermal_critical_celsius_milli = integer(value.thermal_critical_celsius_milli ?? value.thermalCriticalCelsiusMilli, 'RNCS_POWER_THERMAL_CRITICAL_INVALID', 85000, {min: -100000, max: 300000});
  const thermal_limit_celsius_milli = integer(value.thermal_limit_celsius_milli ?? value.thermalLimitCelsiusMilli, 'RNCS_POWER_THERMAL_LIMIT_INVALID', 90000, {min: -100000, max: 300000});
  fail(thermal_throttle_celsius_milli < thermal_critical_celsius_milli && thermal_critical_celsius_milli <= thermal_limit_celsius_milli, 'RNCS_POWER_THERMAL_ENVELOPE_INVALID');
  const derivedThermal = thermalState(thermal_celsius_milli, thermal_throttle_celsius_milli, thermal_critical_celsius_milli);
  if (value.thermal_state ?? value.thermalState) fail(String(value.thermal_state ?? value.thermalState).toUpperCase() === derivedThermal, 'RNCS_POWER_THERMAL_STATE_MISMATCH');
  const thermal_state = derivedThermal;
  const derivedMode = powerMode(power_state, battery_percent, thermal_state);
  if (value.power_mode ?? value.powerMode) fail(String(value.power_mode ?? value.powerMode).toUpperCase() === derivedMode, 'RNCS_POWER_MODE_MISMATCH');
  const power_mode = derivedMode;
  const derivedLoadLevel = loadSheddingLevel(power_mode, thermal_state);
  const priority_order = ordered(value.priority_order ?? value.priorityOrder ?? defaultPriorityOrder, REALITY_POWER_PRIORITY_CLASSES, 'RNCS_POWER_PRIORITY_CLASS_INVALID');
  for (const required of ['SAFETY', 'AUTHORITY', 'CONTROL', 'MINIMUM_REALITY']) fail(priority_order.includes(required), 'RNCS_POWER_PRIORITY_CLASS_REQUIRED');
  const subject_id = value.subject_id ?? value.subjectId ?? null;
  if (subject_id !== null) text(subject_id, 'RNCS_POWER_SUBJECT_ID_INVALID');
  const subject_identity_root = value.subject_identity_root ?? value.subjectIdentityRoot ?? null;
  if (subject_identity_root !== null) root(subject_identity_root, 'RNCS_POWER_SUBJECT_IDENTITY_ROOT_INVALID');
  return {
    format: REALITY_POWER_PROFILE_FORMAT,
    version: REALITY_POWER_VERSION,
    profile_id,
    node_id,
    subject_id: subject_id === null ? null : String(subject_id),
    subject_identity_root: subject_identity_root === null ? null : String(subject_identity_root).toLowerCase(),
    power_state,
    grid_connected,
    charging,
    battery_percent,
    battery_capacity_mwh,
    energy_remaining_mwh,
    emergency_reserve_mwh,
    current_draw_mw: integer(value.current_draw_mw ?? value.currentDrawMw, 'RNCS_POWER_CURRENT_DRAW_INVALID', 0),
    thermal_celsius_milli,
    thermal_throttle_celsius_milli,
    thermal_critical_celsius_milli,
    thermal_limit_celsius_milli,
    thermal_state,
    thermal_headroom_celsius_milli: Math.max(thermal_limit_celsius_milli - thermal_celsius_milli, 0),
    power_mode,
    load_shedding_level: derivedLoadLevel,
    priority_order,
    body_available: power_state !== 'OFFLINE',
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityPowerProfile(input = {}) {
  const base = normalizePowerProfile(input);
  return {...base, power_root: rootHash(base)};
}

export function verifyRealityPowerProfile(profile) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!profile || typeof profile !== 'object') return {valid: false, errors: ['RNCS_POWER_PROFILE_NOT_OBJECT']};
  try {
    const copy = clone(profile);
    const profileRoot = copy.power_root;
    delete copy.power_root;
    check(profile.format === REALITY_POWER_PROFILE_FORMAT, 'RNCS_POWER_PROFILE_FORMAT_INVALID');
    check(profile.version === REALITY_POWER_VERSION, 'RNCS_POWER_PROFILE_VERSION_INVALID');
    check(typeof profile.profile_id === 'string' && profile.profile_id.length > 0, 'RNCS_POWER_PROFILE_ID_REQUIRED');
    check(typeof profile.node_id === 'string' && profile.node_id.length > 0, 'RNCS_POWER_NODE_ID_REQUIRED');
    check(profile.subject_id === null || typeof profile.subject_id === 'string', 'RNCS_POWER_SUBJECT_ID_INVALID');
    check(profile.subject_identity_root === null || hex64(profile.subject_identity_root), 'RNCS_POWER_SUBJECT_IDENTITY_ROOT_INVALID');
    check(REALITY_POWER_STATES.includes(profile.power_state), 'RNCS_POWER_STATE_INVALID');
    check(typeof profile.grid_connected === 'boolean' && typeof profile.charging === 'boolean', 'RNCS_POWER_CONNECTION_FIELDS_INVALID');
    if (profile.power_state === 'GRID') check(profile.grid_connected && !profile.charging, 'RNCS_POWER_GRID_STATE_MISMATCH');
    if (profile.power_state === 'CHARGING') check(profile.grid_connected && profile.charging, 'RNCS_POWER_CHARGING_STATE_MISMATCH');
    if (profile.power_state === 'OFFLINE') check(!profile.grid_connected, 'RNCS_POWER_OFFLINE_STATE_MISMATCH');
    for (const field of ['battery_percent', 'battery_capacity_mwh', 'energy_remaining_mwh', 'emergency_reserve_mwh', 'current_draw_mw']) check(Number.isSafeInteger(profile[field]) && profile[field] >= 0, `RNCS_POWER_${field.toUpperCase()}_INVALID`);
    check(profile.battery_percent <= 100, 'RNCS_POWER_BATTERY_PERCENT_INVALID');
    check(profile.energy_remaining_mwh <= profile.battery_capacity_mwh, 'RNCS_POWER_ENERGY_EXCEEDS_CAPACITY');
    check(profile.emergency_reserve_mwh <= profile.battery_capacity_mwh, 'RNCS_POWER_RESERVE_EXCEEDS_CAPACITY');
    for (const field of ['thermal_celsius_milli', 'thermal_throttle_celsius_milli', 'thermal_critical_celsius_milli', 'thermal_limit_celsius_milli', 'thermal_headroom_celsius_milli']) check(Number.isSafeInteger(profile[field]), `RNCS_POWER_${field.toUpperCase()}_INVALID`);
    check(profile.thermal_throttle_celsius_milli < profile.thermal_critical_celsius_milli && profile.thermal_critical_celsius_milli <= profile.thermal_limit_celsius_milli, 'RNCS_POWER_THERMAL_ENVELOPE_INVALID');
    check(profile.thermal_headroom_celsius_milli === Math.max(profile.thermal_limit_celsius_milli - profile.thermal_celsius_milli, 0), 'RNCS_POWER_THERMAL_HEADROOM_MISMATCH');
    check(REALITY_THERMAL_STATES.includes(profile.thermal_state), 'RNCS_POWER_THERMAL_STATE_INVALID');
    check(profile.thermal_state === thermalState(profile.thermal_celsius_milli, profile.thermal_throttle_celsius_milli, profile.thermal_critical_celsius_milli), 'RNCS_POWER_THERMAL_STATE_MISMATCH');
    check(REALITY_POWER_MODES.includes(profile.power_mode), 'RNCS_POWER_MODE_INVALID');
    check(profile.power_mode === powerMode(profile.power_state, profile.battery_percent, profile.thermal_state), 'RNCS_POWER_MODE_MISMATCH');
    check(REALITY_LOAD_SHEDDING_LEVELS.includes(profile.load_shedding_level), 'RNCS_POWER_LOAD_LEVEL_INVALID');
    check(profile.load_shedding_level === loadSheddingLevel(profile.power_mode, profile.thermal_state), 'RNCS_POWER_LOAD_LEVEL_MISMATCH');
    check(Array.isArray(profile.priority_order), 'RNCS_POWER_PRIORITY_ORDER_INVALID');
    const priorityOrder = ordered(profile.priority_order, REALITY_POWER_PRIORITY_CLASSES, 'RNCS_POWER_PRIORITY_CLASS_INVALID');
    check(priorityOrder.length === profile.priority_order.length && priorityOrder.every((value, index) => value === profile.priority_order[index]), 'RNCS_POWER_PRIORITY_ORDER_UNCANONICAL');
    for (const required of ['SAFETY', 'AUTHORITY', 'CONTROL', 'MINIMUM_REALITY']) check(profile.priority_order.includes(required), 'RNCS_POWER_PRIORITY_CLASS_REQUIRED');
    check(profile.body_available === (profile.power_state !== 'OFFLINE'), 'RNCS_POWER_BODY_AVAILABILITY_MISMATCH');
    check(profile.candidate_only === true && profile.authoritative === false, 'RNCS_POWER_CANDIDATE_REQUIRED');
    check(profile.commit_status === 'NOT_COMMITTED', 'RNCS_POWER_COMMIT_STATUS_INVALID');
    check(hex64(profileRoot) && rootHash(copy) === profileRoot, 'RNCS_POWER_PROFILE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_POWER_PROFILE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, power_root: profile.power_root ?? null};
}

const defaultCapacities = Object.freeze({CPU: 1000, GPU: 1000, NPU: 500, VRAM: 2048, RAM: 8192, STORAGE: 100000, NETWORK: 10000, AGENT_COMPUTE: 500, SIMULATION: 1000, ENERGY: 1000});

function resourceValue(source, name, fallback) {
  const value = record(source);
  const snake = name.toLowerCase();
  return value[name] ?? value[snake] ?? fallback;
}

function normalizeResourceVector(input, code, defaults = {}) {
  const source = record(input);
  return Object.fromEntries(REALITY_RESOURCE_NAMES.map(name => [name, integer(resourceValue(source, name, defaults[name] ?? 0), `${code}_${name}_INVALID`)]));
}

function deriveBudgetMode(capacities, used, reserved, minimum) {
  let pressured = false;
  for (const name of REALITY_RESOURCE_NAMES) {
    const committed = used[name] + reserved[name];
    if (committed > capacities[name]) return 'OVERCOMMITTED';
    const available = capacities[name] - committed;
    if (available < minimum[name] || (capacities[name] > 0 && available * 4 < capacities[name])) pressured = true;
  }
  return pressured ? 'PRESSURED' : 'AVAILABLE';
}

function normalizeResourceBudget(input = {}) {
  const value = record(input);
  const node_id = text(value.node_id ?? value.nodeId, 'RNCS_RESOURCE_BUDGET_NODE_ID_REQUIRED', 'node:local');
  const budget_id = text(value.budget_id ?? value.budgetId, 'RNCS_RESOURCE_BUDGET_ID_REQUIRED', `budget:${node_id}`);
  const capacities = normalizeResourceVector(value.capacities ?? value.capacity ?? value.capacity_vector, 'RNCS_RESOURCE_BUDGET_CAPACITY', defaultCapacities);
  const used = normalizeResourceVector(value.used ?? value.usage ?? value.used_vector, 'RNCS_RESOURCE_BUDGET_USED');
  const reserved = normalizeResourceVector(value.reserved ?? value.reservations ?? value.reserved_vector, 'RNCS_RESOURCE_BUDGET_RESERVED');
  const minimum_reserve = normalizeResourceVector(value.minimum_reserve ?? value.minimumReserve ?? value.minimum_reserve_vector, 'RNCS_RESOURCE_BUDGET_MINIMUM_RESERVE');
  const available = Object.fromEntries(REALITY_RESOURCE_NAMES.map(name => [name, Math.max(capacities[name] - used[name] - reserved[name], 0)]));
  const pressure_by_resource = Object.fromEntries(REALITY_RESOURCE_NAMES.map(name => {
    const committed = used[name] + reserved[name];
    const pressure = committed > capacities[name] ? 'OVERCOMMITTED' : available[name] < minimum_reserve[name] ? 'RESERVE_BREACH' : capacities[name] > 0 && available[name] * 4 < capacities[name] ? 'PRESSURED' : 'AVAILABLE';
    return [name, pressure];
  }));
  return {
    format: REALITY_RESOURCE_BUDGET_FORMAT,
    version: REALITY_POWER_VERSION,
    budget_id,
    node_id,
    window_ticks: integer(value.window_ticks ?? value.windowTicks, 'RNCS_RESOURCE_BUDGET_WINDOW_INVALID', 1, {min: 1}),
    power_profile_root: root(value.power_profile_root ?? value.powerProfileRoot, 'RNCS_RESOURCE_BUDGET_POWER_ROOT_INVALID'),
    transport_profile_roots: roots(value.transport_profile_roots ?? value.transportProfileRoots, 'RNCS_RESOURCE_BUDGET_TRANSPORT_ROOT_INVALID'),
    capacities,
    used,
    reserved,
    minimum_reserve,
    available,
    pressure_by_resource,
    budget_mode: deriveBudgetMode(capacities, used, reserved, minimum_reserve),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityResourceBudget(input = {}) {
  const base = normalizeResourceBudget(input);
  return {...base, budget_root: rootHash(base)};
}

export function verifyRealityResourceBudget(budget) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!budget || typeof budget !== 'object') return {valid: false, errors: ['RNCS_RESOURCE_BUDGET_NOT_OBJECT']};
  try {
    const copy = clone(budget);
    const budgetRoot = copy.budget_root;
    delete copy.budget_root;
    check(budget.format === REALITY_RESOURCE_BUDGET_FORMAT, 'RNCS_RESOURCE_BUDGET_FORMAT_INVALID');
    check(budget.version === REALITY_POWER_VERSION, 'RNCS_RESOURCE_BUDGET_VERSION_INVALID');
    check(typeof budget.budget_id === 'string' && budget.budget_id.length > 0, 'RNCS_RESOURCE_BUDGET_ID_REQUIRED');
    check(typeof budget.node_id === 'string' && budget.node_id.length > 0, 'RNCS_RESOURCE_BUDGET_NODE_ID_REQUIRED');
    check(Number.isSafeInteger(budget.window_ticks) && budget.window_ticks >= 1, 'RNCS_RESOURCE_BUDGET_WINDOW_INVALID');
    check(hex64(budget.power_profile_root), 'RNCS_RESOURCE_BUDGET_POWER_ROOT_INVALID');
    check(Array.isArray(budget.transport_profile_roots) && budget.transport_profile_roots.every(hex64), 'RNCS_RESOURCE_BUDGET_TRANSPORT_ROOT_INVALID');
    for (const field of ['capacities', 'used', 'reserved', 'minimum_reserve', 'available']) {
      check(budget[field] && typeof budget[field] === 'object' && !Array.isArray(budget[field]), `RNCS_RESOURCE_BUDGET_${field.toUpperCase()}_INVALID`);
      for (const name of REALITY_RESOURCE_NAMES) check(Number.isSafeInteger(budget[field]?.[name]) && budget[field][name] >= 0, `RNCS_RESOURCE_BUDGET_${field.toUpperCase()}_${name}_INVALID`);
    }
    for (const name of REALITY_RESOURCE_NAMES) {
      const expected = Math.max(budget.capacities[name] - budget.used[name] - budget.reserved[name], 0);
      check(budget.available[name] === expected, `RNCS_RESOURCE_BUDGET_AVAILABLE_${name}_MISMATCH`);
      const committed = budget.used[name] + budget.reserved[name];
      const expectedPressure = committed > budget.capacities[name] ? 'OVERCOMMITTED' : budget.available[name] < budget.minimum_reserve[name] ? 'RESERVE_BREACH' : budget.capacities[name] > 0 && budget.available[name] * 4 < budget.capacities[name] ? 'PRESSURED' : 'AVAILABLE';
      check(budget.pressure_by_resource?.[name] === expectedPressure, `RNCS_RESOURCE_BUDGET_PRESSURE_${name}_MISMATCH`);
    }
    check(['AVAILABLE', 'PRESSURED', 'OVERCOMMITTED'].includes(budget.budget_mode), 'RNCS_RESOURCE_BUDGET_MODE_INVALID');
    check(budget.budget_mode === deriveBudgetMode(budget.capacities, budget.used, budget.reserved, budget.minimum_reserve), 'RNCS_RESOURCE_BUDGET_MODE_MISMATCH');
    check(Array.isArray(budget.evidence_refs), 'RNCS_RESOURCE_BUDGET_EVIDENCE_REFS_INVALID');
    check(budget.candidate_only === true && budget.authoritative === false, 'RNCS_RESOURCE_BUDGET_CANDIDATE_REQUIRED');
    check(budget.commit_status === 'NOT_COMMITTED', 'RNCS_RESOURCE_BUDGET_COMMIT_STATUS_INVALID');
    check(hex64(budgetRoot) && rootHash(copy) === budgetRoot, 'RNCS_RESOURCE_BUDGET_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_RESOURCE_BUDGET_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, budget_root: budget.budget_root ?? null};
}

function normalizeResourceDemand(input = {}) {
  const value = record(input);
  const candidate_id = text(value.candidate_id ?? value.candidateId ?? value.demand_id ?? value.demandId, 'RNCS_RESOURCE_DEMAND_ID_REQUIRED');
  const candidate_kind = String(value.candidate_kind ?? value.candidateKind ?? 'REFINEMENT').toUpperCase();
  fail(REALITY_POWER_PRIORITY_CLASSES.includes(candidate_kind), 'RNCS_RESOURCE_DEMAND_KIND_INVALID');
  const authority_critical = bool(value.authority_critical ?? value.authorityCritical, 'RNCS_RESOURCE_DEMAND_AUTHORITY_CRITICAL_INVALID', ['SAFETY', 'AUTHORITY', 'CONTROL'].includes(candidate_kind));
  const preserve_minimum_reality = bool(value.preserve_minimum_reality ?? value.preserveMinimumReality, 'RNCS_RESOURCE_DEMAND_MINIMUM_PRESERVE_INVALID', authority_critical || candidate_kind === 'MINIMUM_REALITY' || candidate_kind === 'COLLISION');
  const task_relevance = integer(value.task_relevance ?? value.taskRelevance, 'RNCS_RESOURCE_DEMAND_TASK_RELEVANCE_INVALID', 0, {max: 100});
  const subject_attention = integer(value.subject_attention ?? value.subjectAttention, 'RNCS_RESOURCE_DEMAND_SUBJECT_ATTENTION_INVALID', 0, {max: 100});
  const risk = integer(value.risk, 'RNCS_RESOURCE_DEMAND_RISK_INVALID', 0, {max: 100});
  const interaction_probability = integer(value.interaction_probability ?? value.interactionProbability, 'RNCS_RESOURCE_DEMAND_INTERACTION_INVALID', 0, {max: 100});
  const authority_criticality = integer(value.authority_criticality ?? value.authorityCriticality, 'RNCS_RESOURCE_DEMAND_AUTHORITY_CRITICALITY_INVALID', authority_critical ? 100 : 0, {max: 100});
  const utility_score = integer(value.utility_score ?? value.utilityScore, 'RNCS_RESOURCE_DEMAND_UTILITY_INVALID', task_relevance + subject_attention + risk + interaction_probability + authority_criticality, {min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER});
  const canonical_state_root = value.canonical_state_root ?? value.canonicalStateRoot ?? null;
  if (canonical_state_root !== null) root(canonical_state_root, 'RNCS_RESOURCE_DEMAND_CANONICAL_ROOT_INVALID');
  return {
    format: REALITY_RESOURCE_DEMAND_FORMAT,
    version: REALITY_POWER_VERSION,
    candidate_id,
    candidate_kind,
    priority: integer(value.priority, 'RNCS_RESOURCE_DEMAND_PRIORITY_INVALID', authority_critical ? 100 : candidate_kind === 'MINIMUM_REALITY' ? 95 : 50, {max: 100}),
    task_relevance,
    subject_attention,
    risk,
    interaction_probability,
    authority_criticality,
    utility_score,
    authority_critical,
    preserve_minimum_reality,
    detail_level: integer(value.detail_level ?? value.detailLevel, 'RNCS_RESOURCE_DEMAND_DETAIL_INVALID', candidate_kind === 'VISUAL' ? 100 : 50, {max: 100}),
    frequency_hz: integer(value.frequency_hz ?? value.frequencyHz, 'RNCS_RESOURCE_DEMAND_FREQUENCY_INVALID', candidate_kind === 'PHYSICS' ? 60 : 1),
    resource_costs: normalizeResourceVector(value.resource_costs ?? value.resourceCosts, 'RNCS_RESOURCE_DEMAND_COST'),
    fallback_candidate_id: value.fallback_candidate_id ?? value.fallbackCandidateId ? String(value.fallback_candidate_id ?? value.fallbackCandidateId) : null,
    canonical_state_root: canonical_state_root === null ? null : String(canonical_state_root).toLowerCase(),
    preserves_world_truth: true,
    canonical_write_authorized: false,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityResourceDemand(input = {}) {
  const base = normalizeResourceDemand(input);
  return {...base, demand_root: rootHash(base)};
}

export function verifyRealityResourceDemand(demand) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!demand || typeof demand !== 'object') return {valid: false, errors: ['RNCS_RESOURCE_DEMAND_NOT_OBJECT']};
  try {
    const copy = clone(demand);
    const demandRoot = copy.demand_root;
    delete copy.demand_root;
    check(demand.format === REALITY_RESOURCE_DEMAND_FORMAT, 'RNCS_RESOURCE_DEMAND_FORMAT_INVALID');
    check(demand.version === REALITY_POWER_VERSION, 'RNCS_RESOURCE_DEMAND_VERSION_INVALID');
    check(typeof demand.candidate_id === 'string' && demand.candidate_id.length > 0, 'RNCS_RESOURCE_DEMAND_ID_REQUIRED');
    check(REALITY_POWER_PRIORITY_CLASSES.includes(demand.candidate_kind), 'RNCS_RESOURCE_DEMAND_KIND_INVALID');
    for (const field of ['priority', 'task_relevance', 'subject_attention', 'risk', 'interaction_probability', 'authority_criticality', 'detail_level', 'frequency_hz']) check(Number.isSafeInteger(demand[field]) && demand[field] >= 0, `RNCS_RESOURCE_DEMAND_${field.toUpperCase()}_INVALID`);
    check(demand.priority <= 100 && demand.task_relevance <= 100 && demand.subject_attention <= 100 && demand.risk <= 100 && demand.interaction_probability <= 100 && demand.authority_criticality <= 100 && demand.detail_level <= 100, 'RNCS_RESOURCE_DEMAND_RANGE_INVALID');
    check(Number.isSafeInteger(demand.utility_score), 'RNCS_RESOURCE_DEMAND_UTILITY_INVALID');
    for (const field of ['authority_critical', 'preserve_minimum_reality', 'preserves_world_truth', 'canonical_write_authorized', 'candidate_only', 'authoritative']) check(typeof demand[field] === 'boolean', `RNCS_RESOURCE_DEMAND_${field.toUpperCase()}_INVALID`);
    check(demand.canonical_write_authorized === false && demand.preserves_world_truth === true, 'RNCS_RESOURCE_DEMAND_AUTHORITY_BOUNDARY_INVALID');
    check(demand.canonical_state_root === null || hex64(demand.canonical_state_root), 'RNCS_RESOURCE_DEMAND_CANONICAL_ROOT_INVALID');
    check(demand.fallback_candidate_id === null || typeof demand.fallback_candidate_id === 'string', 'RNCS_RESOURCE_DEMAND_FALLBACK_INVALID');
    for (const name of REALITY_RESOURCE_NAMES) check(Number.isSafeInteger(demand.resource_costs?.[name]) && demand.resource_costs[name] >= 0, `RNCS_RESOURCE_DEMAND_COST_${name}_INVALID`);
    check(demand.commit_status === 'NOT_COMMITTED', 'RNCS_RESOURCE_DEMAND_COMMIT_STATUS_INVALID');
    check(hex64(demandRoot) && rootHash(copy) === demandRoot, 'RNCS_RESOURCE_DEMAND_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_RESOURCE_DEMAND_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, demand_root: demand.demand_root ?? null};
}

function normalizeFault(input = {}) {
  const value = record(input);
  const fault_kind = String(value.fault_kind ?? value.faultKind ?? 'REALITY_FAULT').toUpperCase();
  fail(REALITY_FAULT_KINDS.includes(fault_kind), 'RNCS_REALITY_FAULT_KIND_INVALID');
  const severity = integer(value.severity, 'RNCS_REALITY_FAULT_SEVERITY_INVALID', 50, {max: 100});
  const status = String(value.status ?? 'OPEN').toUpperCase();
  fail(REALITY_FAULT_STATUSES.includes(status), 'RNCS_REALITY_FAULT_STATUS_INVALID');
  const recovered_at_tick = value.recovered_at_tick ?? value.recoveredAtTick ?? null;
  if (recovered_at_tick !== null) integer(recovered_at_tick, 'RNCS_REALITY_FAULT_RECOVERED_TICK_INVALID');
  fail(status === 'RECOVERED' ? recovered_at_tick !== null : recovered_at_tick === null, 'RNCS_REALITY_FAULT_RECOVERED_TICK_MISMATCH');
  const affected_resources = (Array.isArray(value.affected_resources ?? value.affectedResources) ? value.affected_resources ?? value.affectedResources : []).map(resource => String(resource).toUpperCase());
  for (const resource of affected_resources) fail(REALITY_RESOURCE_NAMES.includes(resource), 'RNCS_REALITY_FAULT_RESOURCE_INVALID');
  const affects_minimum_reality = bool(value.affects_minimum_reality ?? value.affectsMinimumReality, 'RNCS_REALITY_FAULT_MINIMUM_IMPACT_INVALID', severity >= 70 || ['POWER_LOST', 'BATTERY_CRITICAL', 'NODE_CRASH', 'REALITY_FAULT'].includes(fault_kind));
  return {
    format: REALITY_FAULT_FORMAT,
    version: REALITY_POWER_VERSION,
    fault_id: text(value.fault_id ?? value.faultId, 'RNCS_REALITY_FAULT_ID_REQUIRED', `fault:${fault_kind.toLowerCase()}`),
    node_id: text(value.node_id ?? value.nodeId, 'RNCS_REALITY_FAULT_NODE_ID_REQUIRED', 'node:local'),
    fault_kind,
    severity,
    status,
    opened_at_tick: integer(value.opened_at_tick ?? value.openedAtTick, 'RNCS_REALITY_FAULT_OPENED_TICK_INVALID', 0),
    recovered_at_tick,
    affected_resources: [...new Set(affected_resources)].sort(keySort),
    affected_scopes: strings(value.affected_scopes ?? value.affectedScopes),
    affects_minimum_reality,
    requires_load_shedding: bool(value.requires_load_shedding ?? value.requiresLoadShedding, 'RNCS_REALITY_FAULT_SHEDDING_REQUIRED_INVALID', severity >= 50 || affects_minimum_reality),
    reason: text(value.reason, 'RNCS_REALITY_FAULT_REASON_REQUIRED', fault_kind.toLowerCase()),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityFault(input = {}) {
  const base = normalizeFault(input);
  return {...base, fault_root: rootHash(base)};
}

export function verifyRealityFault(fault) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!fault || typeof fault !== 'object') return {valid: false, errors: ['RNCS_REALITY_FAULT_NOT_OBJECT']};
  try {
    const copy = clone(fault);
    const faultRoot = copy.fault_root;
    delete copy.fault_root;
    check(fault.format === REALITY_FAULT_FORMAT, 'RNCS_REALITY_FAULT_FORMAT_INVALID');
    check(fault.version === REALITY_POWER_VERSION, 'RNCS_REALITY_FAULT_VERSION_INVALID');
    for (const field of ['fault_id', 'node_id', 'reason']) check(typeof fault[field] === 'string' && fault[field].length > 0, `RNCS_REALITY_FAULT_${field.toUpperCase()}_REQUIRED`);
    check(REALITY_FAULT_KINDS.includes(fault.fault_kind), 'RNCS_REALITY_FAULT_KIND_INVALID');
    check(Number.isSafeInteger(fault.severity) && fault.severity >= 0 && fault.severity <= 100, 'RNCS_REALITY_FAULT_SEVERITY_INVALID');
    check(REALITY_FAULT_STATUSES.includes(fault.status), 'RNCS_REALITY_FAULT_STATUS_INVALID');
    check(Number.isSafeInteger(fault.opened_at_tick) && fault.opened_at_tick >= 0, 'RNCS_REALITY_FAULT_OPENED_TICK_INVALID');
    check(fault.recovered_at_tick === null || Number.isSafeInteger(fault.recovered_at_tick), 'RNCS_REALITY_FAULT_RECOVERED_TICK_INVALID');
    check((fault.status === 'RECOVERED') === (fault.recovered_at_tick !== null), 'RNCS_REALITY_FAULT_RECOVERED_TICK_MISMATCH');
    check(Array.isArray(fault.affected_resources) && fault.affected_resources.every(resource => REALITY_RESOURCE_NAMES.includes(resource)), 'RNCS_REALITY_FAULT_RESOURCE_INVALID');
    check(Array.isArray(fault.affected_scopes) && Array.isArray(fault.evidence_refs), 'RNCS_REALITY_FAULT_ARRAY_INVALID');
    check(typeof fault.affects_minimum_reality === 'boolean' && typeof fault.requires_load_shedding === 'boolean', 'RNCS_REALITY_FAULT_IMPACT_INVALID');
    check(fault.candidate_only === true && fault.authoritative === false, 'RNCS_REALITY_FAULT_CANDIDATE_REQUIRED');
    check(fault.commit_status === 'NOT_COMMITTED', 'RNCS_REALITY_FAULT_COMMIT_STATUS_INVALID');
    check(hex64(faultRoot) && rootHash(copy) === faultRoot, 'RNCS_REALITY_FAULT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_REALITY_FAULT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, fault_root: fault.fault_root ?? null};
}

function normalizeMinimumReality(input = {}) {
  const value = record(input);
  const required_layers = ordered(value.required_layers ?? value.requiredLayers ?? ['WORLD_PROXY', 'COLLISION', 'SEMANTIC'], REALITY_MINIMUM_REALITY_LAYERS, 'RNCS_MINIMUM_REALITY_LAYER_INVALID');
  fail(required_layers.includes('WORLD_PROXY'), 'RNCS_MINIMUM_REALITY_WORLD_PROXY_REQUIRED');
  const available_layers = ordered(value.available_layers ?? value.availableLayers ?? required_layers, REALITY_MINIMUM_REALITY_LAYERS, 'RNCS_MINIMUM_REALITY_LAYER_INVALID');
  for (const layer of available_layers) fail(required_layers.includes(layer) || layer === 'VISUAL' || layer === 'AGENT' || layer === 'AUDIO' || layer === 'REFINEMENT', 'RNCS_MINIMUM_REALITY_AVAILABLE_LAYER_INVALID');
  const missing_layers = required_layers.filter(layer => !available_layers.includes(layer));
  const recovery_status = missing_layers.length === 0 ? 'READY' : available_layers.includes('WORLD_PROXY') ? 'RECOVERING' : 'BLOCKED';
  return {
    format: REALITY_MINIMUM_REALITY_FORMAT,
    version: REALITY_POWER_VERSION,
    reality_id: text(value.reality_id ?? value.realityId, 'RNCS_MINIMUM_REALITY_ID_REQUIRED', 'reality:local'),
    scope_id: text(value.scope_id ?? value.scopeId, 'RNCS_MINIMUM_REALITY_SCOPE_REQUIRED', 'scope:local'),
    canonical_state_root: root(value.canonical_state_root ?? value.canonicalStateRoot, 'RNCS_MINIMUM_REALITY_CANONICAL_ROOT_INVALID'),
    world_time_tick: integer(value.world_time_tick ?? value.worldTimeTick, 'RNCS_MINIMUM_REALITY_WORLD_TIME_INVALID', 0),
    required_layers,
    available_layers,
    missing_layers,
    protected_classes: ordered(value.protected_classes ?? value.protectedClasses ?? ['SAFETY', 'AUTHORITY', 'CONTROL'], REALITY_POWER_PRIORITY_CLASSES, 'RNCS_MINIMUM_REALITY_PROTECTED_CLASS_INVALID'),
    fault_roots: roots(value.fault_roots ?? value.faultRoots, 'RNCS_MINIMUM_REALITY_FAULT_ROOT_INVALID'),
    recovery_status,
    preserves_canonical_truth: true,
    canonical_write_authorized: false,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createMinimumViableReality(input = {}) {
  const base = normalizeMinimumReality(input);
  return {...base, minimum_reality_root: rootHash(base)};
}

export function verifyMinimumViableReality(reality) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!reality || typeof reality !== 'object') return {valid: false, errors: ['RNCS_MINIMUM_REALITY_NOT_OBJECT']};
  try {
    const copy = clone(reality);
    const realityRoot = copy.minimum_reality_root;
    delete copy.minimum_reality_root;
    check(reality.format === REALITY_MINIMUM_REALITY_FORMAT, 'RNCS_MINIMUM_REALITY_FORMAT_INVALID');
    check(reality.version === REALITY_POWER_VERSION, 'RNCS_MINIMUM_REALITY_VERSION_INVALID');
    for (const field of ['reality_id', 'scope_id']) check(typeof reality[field] === 'string' && reality[field].length > 0, `RNCS_MINIMUM_REALITY_${field.toUpperCase()}_REQUIRED`);
    check(hex64(reality.canonical_state_root), 'RNCS_MINIMUM_REALITY_CANONICAL_ROOT_INVALID');
    check(Number.isSafeInteger(reality.world_time_tick) && reality.world_time_tick >= 0, 'RNCS_MINIMUM_REALITY_WORLD_TIME_INVALID');
    check(Array.isArray(reality.required_layers) && reality.required_layers.includes('WORLD_PROXY'), 'RNCS_MINIMUM_REALITY_REQUIRED_LAYERS_INVALID');
    check(Array.isArray(reality.available_layers) && Array.isArray(reality.missing_layers), 'RNCS_MINIMUM_REALITY_AVAILABLE_LAYERS_INVALID');
    check(reality.missing_layers.every(layer => reality.required_layers.includes(layer) && !reality.available_layers.includes(layer)), 'RNCS_MINIMUM_REALITY_MISSING_LAYERS_INVALID');
    check(reality.required_layers.every(layer => reality.available_layers.includes(layer) || reality.missing_layers.includes(layer)), 'RNCS_MINIMUM_REALITY_LAYER_ACCOUNTING_INVALID');
    check(['READY', 'RECOVERING', 'BLOCKED'].includes(reality.recovery_status), 'RNCS_MINIMUM_REALITY_RECOVERY_STATUS_INVALID');
    check(Array.isArray(reality.protected_classes) && reality.protected_classes.includes('SAFETY') && reality.protected_classes.includes('AUTHORITY') && reality.protected_classes.includes('CONTROL'), 'RNCS_MINIMUM_REALITY_PROTECTED_CLASSES_INVALID');
    check(Array.isArray(reality.fault_roots) && reality.fault_roots.every(hex64), 'RNCS_MINIMUM_REALITY_FAULT_ROOT_INVALID');
    check(reality.preserves_canonical_truth === true && reality.canonical_write_authorized === false, 'RNCS_MINIMUM_REALITY_AUTHORITY_BOUNDARY_INVALID');
    check(reality.candidate_only === true && reality.authoritative === false, 'RNCS_MINIMUM_REALITY_CANDIDATE_REQUIRED');
    check(reality.commit_status === 'NOT_COMMITTED', 'RNCS_MINIMUM_REALITY_COMMIT_STATUS_INVALID');
    check(hex64(realityRoot) && rootHash(copy) === realityRoot, 'RNCS_MINIMUM_REALITY_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_MINIMUM_REALITY_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, minimum_reality_root: reality.minimum_reality_root ?? null};
}

const protectedKinds = new Set(['SAFETY', 'AUTHORITY', 'CONTROL', 'MINIMUM_REALITY']);
const reductionAction = Object.freeze({VISUAL: 'REDUCE_DETAIL', COLLISION: 'REDUCE_FREQUENCY', SEMANTIC: 'OFFLOAD', PHYSICS: 'REDUCE_FREQUENCY', AGENT: 'FREEZE', AUDIO: 'DEFER', REFINEMENT: 'DEFER'});
const scaleFor = (mode, kind, hard) => {
  if (hard) return 100;
  if (mode === 'ABUNDANT') return 100;
  if (mode === 'CONSTRAINED') return ['VISUAL', 'PHYSICS', 'AGENT', 'AUDIO', 'REFINEMENT'].includes(kind) ? 70 : 85;
  if (mode === 'SURVIVAL') return ['VISUAL', 'PHYSICS', 'AGENT', 'AUDIO', 'REFINEMENT'].includes(kind) ? 25 : 50;
  return 0;
};
const scaledVector = (vector, scale) => Object.fromEntries(REALITY_RESOURCE_NAMES.map(name => [name, Math.floor(vector[name] * scale / 100)]));
const fitsVector = (available, cost) => REALITY_RESOURCE_NAMES.every(name => available[name] >= cost[name]);
const subtractVector = (available, cost) => Object.fromEntries(REALITY_RESOURCE_NAMES.map(name => [name, available[name] - cost[name]]));

function normalizeDemandList(values) {
  return (Array.isArray(values) ? values : []).map(value => {
    const demand = record(value).demand_root ? clone(value) : createRealityResourceDemand(value);
    const verification = verifyRealityResourceDemand(demand);
    fail(verification.valid, `RNCS_LOAD_SHEDDING_DEMAND_INVALID:${verification.errors.join(',')}`);
    return demand;
  });
}

function normalizeFaultList(values) {
  return (Array.isArray(values) ? values : []).map(value => {
    const fault = record(value).fault_root ? clone(value) : createRealityFault(value);
    const verification = verifyRealityFault(fault);
    fail(verification.valid, `RNCS_LOAD_SHEDDING_FAULT_INVALID:${verification.errors.join(',')}`);
    return fault;
  });
}

function normalizeMinimumInput(value, fallback) {
  const reality = record(value).minimum_reality_root ? clone(value) : createMinimumViableReality(value ?? fallback);
  const verification = verifyMinimumViableReality(reality);
  fail(verification.valid, `RNCS_LOAD_SHEDDING_MINIMUM_REALITY_INVALID:${verification.errors.join(',')}`);
  return reality;
}

function normalizePowerInput(value) {
  const profile = record(value).power_root ? clone(value) : createRealityPowerProfile(value);
  const verification = verifyRealityPowerProfile(profile);
  fail(verification.valid, `RNCS_LOAD_SHEDDING_POWER_PROFILE_INVALID:${verification.errors.join(',')}`);
  return profile;
}

function normalizeBudgetInput(value) {
  const budget = record(value).budget_root ? clone(value) : createRealityResourceBudget(value);
  const verification = verifyRealityResourceBudget(budget);
  fail(verification.valid, `RNCS_LOAD_SHEDDING_RESOURCE_BUDGET_INVALID:${verification.errors.join(',')}`);
  return budget;
}

function decisionFor(demand, mode, available, forcedMinimum, criticalFault) {
  const hard = demand.authority_critical || protectedKinds.has(demand.candidate_kind) || (demand.preserve_minimum_reality && forcedMinimum && ['COLLISION', 'SEMANTIC'].includes(demand.candidate_kind));
  const scale = scaleFor(mode, demand.candidate_kind, hard);
  const allocated = scaledVector(demand.resource_costs, scale);
  const fits = fitsVector(available, allocated);
  let action = 'KEEP';
  let admitted = fits;
  const reason_codes = [];
  if (hard && demand.candidate_kind === 'MINIMUM_REALITY') {
    action = 'RECOVER_MINIMUM';
    reason_codes.push('MINIMUM_REALITY_REQUIRED');
  } else if (hard) {
    action = 'KEEP';
    reason_codes.push(demand.authority_critical ? 'AUTHORITY_OR_SAFETY_PROTECTED' : 'MINIMUM_REALITY_PROTECTED');
  } else if (mode === 'ABUNDANT' && fits && !criticalFault) {
    action = 'KEEP';
    reason_codes.push('POWER_ABUNDANT');
  } else if (mode === 'OFFLINE' || mode === 'SURVIVAL' || criticalFault || !fits) {
    action = reductionAction[demand.candidate_kind] ?? 'DEFER';
    reason_codes.push(criticalFault ? 'FAULT_SHEDDING' : mode === 'OFFLINE' || mode === 'SURVIVAL' ? 'POWER_CONSTRAINED' : 'RESOURCE_PRESSURE');
    if (scale === 0 || !fits) {
      action = demand.fallback_candidate_id ? 'OFFLOAD' : demand.candidate_kind === 'REFINEMENT' || demand.candidate_kind === 'AUDIO' ? 'DEFER' : 'DROP';
      admitted = false;
      reason_codes.push(demand.fallback_candidate_id ? 'FALLBACK_REQUIRED' : 'NO_LOCAL_CAPACITY');
    }
  } else if (!fits) {
    action = demand.fallback_candidate_id ? 'OFFLOAD' : 'DEFER';
    admitted = false;
    reason_codes.push('RESOURCE_PRESSURE');
  } else {
    action = reductionAction[demand.candidate_kind] ?? 'KEEP';
    reason_codes.push('POWER_LOAD_SHED');
  }
  if (hard && !fits) {
    action = demand.candidate_kind === 'MINIMUM_REALITY' ? 'RECOVER_MINIMUM' : 'KEEP';
    admitted = false;
    reason_codes.push('PROTECTED_RESOURCE_SHORTFALL');
  }
  return {
    candidate_id: demand.candidate_id,
    candidate_kind: demand.candidate_kind,
    priority: demand.priority,
    utility_score: demand.utility_score,
    action,
    admitted,
    allocation_scale_percent: scale,
    resource_costs: clone(demand.resource_costs),
    allocated_costs: admitted ? allocated : Object.fromEntries(REALITY_RESOURCE_NAMES.map(name => [name, 0])),
    fallback_candidate_id: demand.fallback_candidate_id,
    authority_critical: demand.authority_critical,
    preserves_world_truth: true,
    canonical_write_authorized: false,
    reason_codes: strings(reason_codes)
  };
}

export function createRealityLoadSheddingPlan(input = {}) {
  const value = record(input);
  const power_profile = normalizePowerInput(value.power_profile ?? value.powerProfile);
  const resource_budget = normalizeBudgetInput(value.resource_budget ?? value.resourceBudget);
  const faults = normalizeFaultList(value.faults);
  const minimum_reality = normalizeMinimumInput(value.minimum_reality ?? value.minimumReality, {
    reality_id: value.reality_id ?? value.realityId ?? `reality:${power_profile.node_id}`,
    scope_id: value.scope_id ?? value.scopeId ?? `scope:${power_profile.node_id}`,
    canonical_state_root: value.canonical_state_root ?? value.canonicalStateRoot,
    world_time_tick: value.tick ?? 0,
    fault_roots: faults.map(fault => fault.fault_root)
  });
  const demands = normalizeDemandList(value.demands ?? value.resource_demands ?? value.resourceDemands);
  const criticalFault = faults.some(fault => fault.status !== 'RECOVERED' && (fault.severity >= 70 || fault.affects_minimum_reality));
  const mode = power_profile.power_mode;
  const demandOrder = [...demands].sort((a, b) => {
    const hardA = a.authority_critical || protectedKinds.has(a.candidate_kind) ? 1 : 0;
    const hardB = b.authority_critical || protectedKinds.has(b.candidate_kind) ? 1 : 0;
    return hardB - hardA || b.priority - a.priority || b.utility_score - a.utility_score || keySort(a.candidate_id, b.candidate_id);
  });
  let available = clone(resource_budget.available);
  const decisions = [];
  for (const demand of demandOrder) {
    const decision = decisionFor(demand, mode, available, minimum_reality.recovery_status !== 'READY' || criticalFault, criticalFault);
    if (decision.admitted) available = subtractVector(available, decision.allocated_costs);
    decisions.push(decision);
  }
  decisions.sort((a, b) => keySort(a.candidate_id, b.candidate_id));
  const load_shedding_level = criticalFault && mode === 'ABUNDANT' ? 'SEVERE' : ['SURVIVAL', 'OFFLINE'].includes(mode) ? 'SURVIVAL' : mode === 'CONSTRAINED' ? power_profile.load_shedding_level === 'SEVERE' ? 'SEVERE' : 'MODERATE' : power_profile.load_shedding_level;
  const fault_roots = faults.map(fault => fault.fault_root).sort(keySort);
  const base = {
    format: REALITY_LOAD_SHEDDING_PLAN_FORMAT,
    version: REALITY_POWER_VERSION,
    plan_id: text(value.plan_id ?? value.planId, 'RNCS_LOAD_SHEDDING_PLAN_ID_REQUIRED', `plan:${power_profile.node_id}:${value.tick ?? 0}`),
    node_id: power_profile.node_id,
    tick: integer(value.tick, 'RNCS_LOAD_SHEDDING_TICK_INVALID', 0),
    power_profile_root: power_profile.power_root,
    resource_budget_root: resource_budget.budget_root,
    fault_roots,
    minimum_reality_root: minimum_reality.minimum_reality_root,
    power_mode: mode,
    load_shedding_level,
    decisions,
    resource_remaining: available,
    stable_window_ticks: integer(value.stable_window_ticks ?? value.stableWindowTicks, 'RNCS_LOAD_SHEDDING_STABLE_WINDOW_INVALID', 5, {min: 1}),
    cooldown_ticks: integer(value.cooldown_ticks ?? value.cooldownTicks, 'RNCS_LOAD_SHEDDING_COOLDOWN_INVALID', 3, {min: 0}),
    thrash_guard: {
      enabled: true,
      state_key: rootHash({power_profile_root: power_profile.power_root, resource_budget_root: resource_budget.budget_root, fault_roots, demand_ids: demands.map(demand => demand.candidate_id).sort(keySort)}),
      replan_on: ['POWER_MODE_CHANGE', 'THERMAL_STATE_CHANGE', 'FAULT_OPEN', 'BUDGET_WINDOW_ROLLOVER']
    },
    preserves_canonical_truth: true,
    canonical_write_authorized: false,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED',
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs)
  };
  return {...base, plan_root: rootHash(base)};
}

export function verifyRealityLoadSheddingPlan(plan) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!plan || typeof plan !== 'object') return {valid: false, errors: ['RNCS_LOAD_SHEDDING_PLAN_NOT_OBJECT']};
  try {
    const copy = clone(plan);
    const planRoot = copy.plan_root;
    delete copy.plan_root;
    check(plan.format === REALITY_LOAD_SHEDDING_PLAN_FORMAT, 'RNCS_LOAD_SHEDDING_PLAN_FORMAT_INVALID');
    check(plan.version === REALITY_POWER_VERSION, 'RNCS_LOAD_SHEDDING_PLAN_VERSION_INVALID');
    for (const field of ['plan_id', 'node_id']) check(typeof plan[field] === 'string' && plan[field].length > 0, `RNCS_LOAD_SHEDDING_${field.toUpperCase()}_REQUIRED`);
    check(Number.isSafeInteger(plan.tick) && plan.tick >= 0, 'RNCS_LOAD_SHEDDING_TICK_INVALID');
    for (const field of ['power_profile_root', 'resource_budget_root', 'minimum_reality_root']) check(hex64(plan[field]), `RNCS_LOAD_SHEDDING_${field.toUpperCase()}_INVALID`);
    check(Array.isArray(plan.fault_roots) && plan.fault_roots.every(hex64), 'RNCS_LOAD_SHEDDING_FAULT_ROOT_INVALID');
    check(REALITY_POWER_MODES.includes(plan.power_mode), 'RNCS_LOAD_SHEDDING_POWER_MODE_INVALID');
    check(REALITY_LOAD_SHEDDING_LEVELS.includes(plan.load_shedding_level), 'RNCS_LOAD_SHEDDING_LEVEL_INVALID');
    check(Array.isArray(plan.decisions), 'RNCS_LOAD_SHEDDING_DECISIONS_INVALID');
    for (const decision of plan.decisions ?? []) {
      check(typeof decision.candidate_id === 'string' && decision.candidate_id.length > 0, 'RNCS_LOAD_SHEDDING_DECISION_ID_REQUIRED');
      check(REALITY_POWER_PRIORITY_CLASSES.includes(decision.candidate_kind), 'RNCS_LOAD_SHEDDING_DECISION_KIND_INVALID');
      check(REALITY_LOAD_ACTIONS.includes(decision.action), 'RNCS_LOAD_SHEDDING_DECISION_ACTION_INVALID');
      for (const field of ['priority', 'allocation_scale_percent']) check(Number.isSafeInteger(decision[field]) && decision[field] >= 0 && decision[field] <= 100, `RNCS_LOAD_SHEDDING_DECISION_${field.toUpperCase()}_INVALID`);
      check(typeof decision.admitted === 'boolean' && typeof decision.authority_critical === 'boolean', 'RNCS_LOAD_SHEDDING_DECISION_ADMISSION_INVALID');
      check(decision.preserves_world_truth === true && decision.canonical_write_authorized === false, 'RNCS_LOAD_SHEDDING_DECISION_AUTHORITY_BOUNDARY_INVALID');
      check(Array.isArray(decision.reason_codes), 'RNCS_LOAD_SHEDDING_DECISION_REASON_INVALID');
      for (const field of ['resource_costs', 'allocated_costs']) for (const name of REALITY_RESOURCE_NAMES) check(Number.isSafeInteger(decision[field]?.[name]) && decision[field][name] >= 0, `RNCS_LOAD_SHEDDING_DECISION_${field.toUpperCase()}_${name}_INVALID`);
    }
    check(plan.resource_remaining && typeof plan.resource_remaining === 'object', 'RNCS_LOAD_SHEDDING_REMAINING_INVALID');
    for (const name of REALITY_RESOURCE_NAMES) check(Number.isSafeInteger(plan.resource_remaining?.[name]) && plan.resource_remaining[name] >= 0, `RNCS_LOAD_SHEDDING_REMAINING_${name}_INVALID`);
    check(Number.isSafeInteger(plan.stable_window_ticks) && plan.stable_window_ticks >= 1, 'RNCS_LOAD_SHEDDING_STABLE_WINDOW_INVALID');
    check(Number.isSafeInteger(plan.cooldown_ticks) && plan.cooldown_ticks >= 0, 'RNCS_LOAD_SHEDDING_COOLDOWN_INVALID');
    check(plan.thrash_guard?.enabled === true && typeof plan.thrash_guard?.state_key === 'string' && Array.isArray(plan.thrash_guard?.replan_on), 'RNCS_LOAD_SHEDDING_THRASH_GUARD_INVALID');
    check(plan.preserves_canonical_truth === true && plan.canonical_write_authorized === false, 'RNCS_LOAD_SHEDDING_AUTHORITY_BOUNDARY_INVALID');
    check(plan.candidate_only === true && plan.authoritative === false, 'RNCS_LOAD_SHEDDING_CANDIDATE_REQUIRED');
    check(plan.commit_status === 'NOT_COMMITTED', 'RNCS_LOAD_SHEDDING_COMMIT_STATUS_INVALID');
    check(Array.isArray(plan.evidence_refs), 'RNCS_LOAD_SHEDDING_EVIDENCE_REFS_INVALID');
    check(hex64(planRoot) && rootHash(copy) === planRoot, 'RNCS_LOAD_SHEDDING_PLAN_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_LOAD_SHEDDING_PLAN_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, plan_root: plan.plan_root ?? null};
}
