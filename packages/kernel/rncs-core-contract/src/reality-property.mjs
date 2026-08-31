import {ContractError, rootHash, without} from './index.mjs';

export const REALITY_QUANTITY_FORMAT = 'rncs.reality-quantity.v0.3';
export const REALITY_PROPERTY_SET_FORMAT = 'rncs.reality-property-set.v0.3';
export const REALITY_LAW_BINDINGS_FORMAT = 'rncs.reality-law-bindings.v0.3';
export const REALITY_PROPERTY_TRANSITION_FORMAT = 'rncs.reality-property-transition.v0.3';
export const REALITY_PROPERTY_VERSION = '0.3.0';

export const REALITY_PROPERTY_STATUSES = Object.freeze(['CANONICAL', 'CANDIDATE', 'REJECTED']);
export const REALITY_PROPERTY_KINDS = Object.freeze(['intrinsic', 'dynamic', 'field', 'custom']);
export const REALITY_LAW_TYPES = Object.freeze(['world', 'constitutive', 'interaction']);
export const REALITY_PROPERTY_DOMAINS = Object.freeze([
  'physical', 'thermal', 'electrical', 'magnetic', 'optical', 'acoustic',
  'chemical', 'fluid', 'biological', 'semantic', 'custom'
]);

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);

const VECTOR_KEYS = Object.freeze([
  'Length', 'Mass', 'Time', 'Temperature', 'ElectricCurrent', 'AmountOfSubstance', 'LuminousIntensity'
]);

const DIMENSION_VECTORS = Object.freeze({
  length: {Length: 1},
  mass: {Mass: 1},
  time: {Time: 1},
  temperature: {Temperature: 1},
  electric_current: {ElectricCurrent: 1},
  amount_of_substance: {AmountOfSubstance: 1},
  luminous_intensity: {LuminousIntensity: 1},
  area: {Length: 2},
  volume: {Length: 3},
  velocity: {Length: 1, Time: -1},
  acceleration: {Length: 1, Time: -2},
  force: {Mass: 1, Length: 1, Time: -2},
  energy: {Mass: 1, Length: 2, Time: -2},
  power: {Mass: 1, Length: 2, Time: -3},
  pressure: {Mass: 1, Length: -1, Time: -2},
  density: {Mass: 1, Length: -3},
  charge: {ElectricCurrent: 1, Time: 1},
  voltage: {Mass: 1, Length: 2, Time: -3, ElectricCurrent: -1},
  resistance: {Mass: 1, Length: 2, Time: -3, ElectricCurrent: -2},
  conductance: {Mass: -1, Length: -2, Time: 3, ElectricCurrent: 2},
  frequency: {Time: -1},
  viscosity: {Mass: 1, Length: -1, Time: -1},
  specific_heat: {Length: 2, Time: -2, Temperature: -1},
  thermal_conductivity: {Mass: 1, Length: 1, Time: -3, Temperature: -1},
  electrical_conductivity: {Mass: -1, Length: -3, Time: 3, ElectricCurrent: 2},
  magnetic_permeability: {Mass: 1, Length: 1, Time: -2, ElectricCurrent: -2},
  acoustic_impedance: {Mass: 1, Length: -2, Time: -1},
  dimensionless: {},
  information: {}
});

const UNIT_DEFINITIONS = Object.freeze({
  m: {dimension: 'length', scale: '1', offset: '0'},
  mm: {dimension: 'length', scale: '0.001', offset: '0'},
  cm: {dimension: 'length', scale: '0.01', offset: '0'},
  km: {dimension: 'length', scale: '1000', offset: '0'},
  kg: {dimension: 'mass', scale: '1', offset: '0'},
  g: {dimension: 'mass', scale: '0.001', offset: '0'},
  mg: {dimension: 'mass', scale: '0.000001', offset: '0'},
  s: {dimension: 'time', scale: '1', offset: '0'},
  ms: {dimension: 'time', scale: '0.001', offset: '0'},
  min: {dimension: 'time', scale: '60', offset: '0'},
  h: {dimension: 'time', scale: '3600', offset: '0'},
  K: {dimension: 'temperature', scale: '1', offset: '0'},
  '°C': {dimension: 'temperature', scale: '1', offset: '273.15'},
  A: {dimension: 'electric_current', scale: '1', offset: '0'},
  mol: {dimension: 'amount_of_substance', scale: '1', offset: '0'},
  cd: {dimension: 'luminous_intensity', scale: '1', offset: '0'},
  'm²': {dimension: 'area', scale: '1', offset: '0'},
  m2: {dimension: 'area', scale: '1', offset: '0'},
  'm^2': {dimension: 'area', scale: '1', offset: '0'},
  'm³': {dimension: 'volume', scale: '1', offset: '0'},
  m3: {dimension: 'volume', scale: '1', offset: '0'},
  'm^3': {dimension: 'volume', scale: '1', offset: '0'},
  'm/s': {dimension: 'velocity', scale: '1', offset: '0'},
  'km/h': {dimension: 'velocity', scale: '0.2777777777777778', offset: '0'},
  'm/s²': {dimension: 'acceleration', scale: '1', offset: '0'},
  'm/s2': {dimension: 'acceleration', scale: '1', offset: '0'},
  m_s2: {dimension: 'acceleration', scale: '1', offset: '0'},
  N: {dimension: 'force', scale: '1', offset: '0'},
  kN: {dimension: 'force', scale: '1000', offset: '0'},
  J: {dimension: 'energy', scale: '1', offset: '0'},
  kJ: {dimension: 'energy', scale: '1000', offset: '0'},
  W: {dimension: 'power', scale: '1', offset: '0'},
  kW: {dimension: 'power', scale: '1000', offset: '0'},
  Pa: {dimension: 'pressure', scale: '1', offset: '0'},
  kPa: {dimension: 'pressure', scale: '1000', offset: '0'},
  MPa: {dimension: 'pressure', scale: '1000000', offset: '0'},
  GPa: {dimension: 'pressure', scale: '1000000000', offset: '0'},
  'kg/m³': {dimension: 'density', scale: '1', offset: '0'},
  'kg/m3': {dimension: 'density', scale: '1', offset: '0'},
  kg_m3: {dimension: 'density', scale: '1', offset: '0'},
  'g/cm³': {dimension: 'density', scale: '1000', offset: '0'},
  'g/cm3': {dimension: 'density', scale: '1000', offset: '0'},
  g_cm3: {dimension: 'density', scale: '1000', offset: '0'},
  C: {dimension: 'charge', scale: '1', offset: '0'},
  V: {dimension: 'voltage', scale: '1', offset: '0'},
  Ω: {dimension: 'resistance', scale: '1', offset: '0'},
  ohm: {dimension: 'resistance', scale: '1', offset: '0'},
  S: {dimension: 'conductance', scale: '1', offset: '0'},
  Hz: {dimension: 'frequency', scale: '1', offset: '0'},
  'Pa·s': {dimension: 'viscosity', scale: '1', offset: '0'},
  'Pa*s': {dimension: 'viscosity', scale: '1', offset: '0'},
  'J/(kg*K)': {dimension: 'specific_heat', scale: '1', offset: '0'},
  'J/(kg·K)': {dimension: 'specific_heat', scale: '1', offset: '0'},
  'W/(m*K)': {dimension: 'thermal_conductivity', scale: '1', offset: '0'},
  'W/(m·K)': {dimension: 'thermal_conductivity', scale: '1', offset: '0'},
  'S/m': {dimension: 'electrical_conductivity', scale: '1', offset: '0'},
  'H/m': {dimension: 'magnetic_permeability', scale: '1', offset: '0'},
  'Pa/(m/s)': {dimension: 'acoustic_impedance', scale: '1', offset: '0'},
  bit: {dimension: 'information', scale: '1', offset: '0'},
  bits: {dimension: 'information', scale: '1', offset: '0'}
});

export const REALITY_UNIT_DEFINITIONS = Object.freeze(clone(UNIT_DEFINITIONS));

function scalar(value, code) {
  if (typeof value === 'number') {
    fail(Number.isSafeInteger(value), code);
    return value;
  }
  if (typeof value === 'string' && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return value;
  throw new ContractError(code);
}

function interval(value) {
  const source = record(value);
  const start = source.start ?? source.from ?? null;
  const end = source.end ?? source.to ?? null;
  if (start !== null) scalar(start, 'RNCS_PROPERTY_VALIDITY_START_INVALID');
  if (end !== null) scalar(end, 'RNCS_PROPERTY_VALIDITY_END_INVALID');
  return {start, end};
}

function vector(value = {}) {
  const source = record(value);
  const output = {};
  for (const key of VECTOR_KEYS) {
    const exponent = Number(source[key] ?? 0);
    fail(Number.isSafeInteger(exponent), 'RNCS_DIMENSION_EXPONENT_INVALID');
    if (exponent !== 0) output[key] = exponent;
  }
  return output;
}

function vectorKey(value = {}) {
  const normalized = vector(value);
  return VECTOR_KEYS.filter(key => normalized[key] !== undefined)
    .map(key => `${key}^${normalized[key]}`).join('|') || '1';
}

function dimension(value, unitDefinition = null) {
  if (typeof value === 'string' && DIMENSION_VECTORS[value]) {
    const name = value;
    return {name, vector: vector(DIMENSION_VECTORS[name])};
  }
  if (typeof value === 'object' && value !== null) {
    const normalized = vector(value);
    const match = Object.entries(DIMENSION_VECTORS).find(([, candidate]) => vectorKey(candidate) === vectorKey(normalized));
    return {name: match?.[0] ?? `derived:${vectorKey(normalized)}`, vector: normalized};
  }
  if (unitDefinition) {
    const unitVector = unitDefinition.vector ?? DIMENSION_VECTORS[unitDefinition.dimension] ?? {};
    const normalized = vector(unitVector);
    const match = Object.entries(DIMENSION_VECTORS).find(([, candidate]) => vectorKey(candidate) === vectorKey(normalized));
    return {name: match?.[0] ?? unitDefinition.dimension, vector: normalized};
  }
  throw new ContractError('RNCS_DIMENSION_REQUIRED');
}

function propertyStatus(value) {
  const status = String(value ?? 'CANONICAL').toUpperCase();
  fail(REALITY_PROPERTY_STATUSES.includes(status), 'RNCS_PROPERTY_STATUS_INVALID');
  return status;
}

function authorityFor(status, input = {}) {
  const candidate = status === 'CANDIDATE';
  return {
    provider_can_write_canonical_property: false,
    rncs_authority_required: true,
    candidate_only: candidate,
    authoritative: !candidate,
    authority_ref: String(input.authority_ref ?? input.authority ?? '')
  };
}

function quantityBase(input = {}) {
  const value = record(input);
  const unit = String(value.unit ?? '');
  const definition = UNIT_DEFINITIONS[unit];
  fail(definition, 'RNCS_UNIT_UNKNOWN');
  const resolvedDimension = dimension(value.dimension, definition);
  const expectedVector = vector(definition.vector ?? DIMENSION_VECTORS[definition.dimension] ?? {});
  fail(vectorKey(resolvedDimension.vector) === vectorKey(expectedVector), 'RNCS_DIMENSION_UNIT_MISMATCH');
  const status = propertyStatus(value.status ?? (value.candidate_only ? 'CANDIDATE' : 'CANONICAL'));
  const provenance_ref = String(value.provenance_ref ?? value.provenance ?? '');
  const authority_ref = String(value.authority_ref ?? value.authority ?? '');
  fail(provenance_ref.length > 0, 'RNCS_QUANTITY_PROVENANCE_REQUIRED');
  fail(authority_ref.length > 0, 'RNCS_QUANTITY_AUTHORITY_REQUIRED');
  const uncertainty = value.uncertainty === null || value.uncertainty === undefined
    ? null
    : scalar(value.uncertainty, 'RNCS_QUANTITY_UNCERTAINTY_INVALID');
  const base = {
    format: REALITY_QUANTITY_FORMAT,
    version: REALITY_PROPERTY_VERSION,
    value: scalar(value.value, 'RNCS_QUANTITY_VALUE_INVALID'),
    unit,
    dimension: resolvedDimension.name,
    dimension_vector: resolvedDimension.vector,
    uncertainty,
    reference_frame: String(value.reference_frame ?? 'world'),
    validity_interval: interval(value.validity_interval ?? value.validityInterval),
    provenance_ref,
    authority_ref,
    evidence_refs: strings(value.evidence_refs ?? value.evidence),
    status,
    candidate_only: status === 'CANDIDATE',
    authoritative: status === 'CANONICAL',
    commit_status: status === 'CANONICAL' ? 'COMMITTED' : 'NOT_COMMITTED'
  };
  return base;
}

export function createRealityQuantity(input = {}) {
  const base = quantityBase(input);
  return {...base, quantity_root: rootHash(base)};
}

export function verifyRealityQuantity(quantityValue) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!quantityValue || typeof quantityValue !== 'object') return {valid: false, errors: ['RNCS_QUANTITY_NOT_OBJECT']};
  try {
    check(quantityValue.format === REALITY_QUANTITY_FORMAT, 'RNCS_QUANTITY_FORMAT_INVALID');
    check(quantityValue.version === REALITY_PROPERTY_VERSION, 'RNCS_QUANTITY_VERSION_INVALID');
    check(quantityValue.unit in UNIT_DEFINITIONS, 'RNCS_UNIT_UNKNOWN');
    const definition = UNIT_DEFINITIONS[quantityValue.unit];
    const resolved = dimension(quantityValue.dimension, definition);
    check(vectorKey(resolved.vector) === vectorKey(quantityValue.dimension_vector), 'RNCS_DIMENSION_VECTOR_MISMATCH');
    check(vectorKey(resolved.vector) === vectorKey(definition.vector ?? DIMENSION_VECTORS[definition.dimension] ?? {}), 'RNCS_DIMENSION_UNIT_MISMATCH');
    try { scalar(quantityValue.value, 'RNCS_QUANTITY_VALUE_INVALID'); } catch { check(false, 'RNCS_QUANTITY_VALUE_INVALID'); }
    if (quantityValue.uncertainty !== null) {
      try { scalar(quantityValue.uncertainty, 'RNCS_QUANTITY_UNCERTAINTY_INVALID'); } catch { check(false, 'RNCS_QUANTITY_UNCERTAINTY_INVALID'); }
    }
    check(typeof quantityValue.reference_frame === 'string' && quantityValue.reference_frame.length > 0, 'RNCS_QUANTITY_REFERENCE_FRAME_REQUIRED');
    check(quantityValue.validity_interval && typeof quantityValue.validity_interval === 'object', 'RNCS_QUANTITY_VALIDITY_INTERVAL_REQUIRED');
    check(typeof quantityValue.provenance_ref === 'string' && quantityValue.provenance_ref.length > 0, 'RNCS_QUANTITY_PROVENANCE_REQUIRED');
    check(typeof quantityValue.authority_ref === 'string' && quantityValue.authority_ref.length > 0, 'RNCS_QUANTITY_AUTHORITY_REQUIRED');
    check(Array.isArray(quantityValue.evidence_refs), 'RNCS_QUANTITY_EVIDENCE_REFS_INVALID');
    check(REALITY_PROPERTY_STATUSES.includes(quantityValue.status), 'RNCS_PROPERTY_STATUS_INVALID');
    check(quantityValue.candidate_only === (quantityValue.status === 'CANDIDATE'), 'RNCS_QUANTITY_CANDIDATE_FLAG_MISMATCH');
    check(quantityValue.authoritative === (quantityValue.status === 'CANONICAL'), 'RNCS_QUANTITY_AUTHORITY_FLAG_MISMATCH');
    check(quantityValue.commit_status === (quantityValue.status === 'CANONICAL' ? 'COMMITTED' : 'NOT_COMMITTED'), 'RNCS_QUANTITY_COMMIT_STATUS_INVALID');
    check(hex64(quantityValue.quantity_root), 'RNCS_QUANTITY_ROOT_INVALID');
    check(rootHash(without(quantityValue, 'quantity_root')) === quantityValue.quantity_root, 'RNCS_QUANTITY_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_QUANTITY_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, quantity_root: quantityValue.quantity_root};
}

function requireQuantity(value) {
  const verification = verifyRealityQuantity(value);
  fail(verification.valid, `RNCS_QUANTITY_INVALID:${verification.errors.join(',')}`);
  return value;
}

function quantityVector(value) {
  return vector(value.dimension_vector ?? DIMENSION_VECTORS[value.dimension] ?? {});
}

export function validateRealityQuantityOperation(operator, left, right) {
  const a = requireQuantity(left);
  const b = requireQuantity(right);
  const aVector = quantityVector(a);
  const bVector = quantityVector(b);
  if (operator === '+' || operator === '-') {
    fail(vectorKey(aVector) === vectorKey(bVector), 'RNCS_QUANTITY_DIMENSION_MISMATCH');
    fail(a.unit === b.unit, 'RNCS_QUANTITY_UNIT_MISMATCH');
    return {operator, dimension: a.dimension, dimension_vector: aVector, unit: a.unit};
  }
  if (operator === '*' || operator === '/') {
    const output = {};
    for (const key of VECTOR_KEYS) {
      const exponent = (aVector[key] ?? 0) + (operator === '*' ? 1 : -1) * (bVector[key] ?? 0);
      if (exponent !== 0) output[key] = exponent;
    }
    const known = Object.entries(DIMENSION_VECTORS).find(([, candidate]) => vectorKey(candidate) === vectorKey(output));
    return {operator, dimension: known?.[0] ?? `derived:${vectorKey(output)}`, dimension_vector: output, unit: null};
  }
  throw new ContractError('RNCS_QUANTITY_OPERATOR_UNKNOWN');
}

function propertyValue(input, context) {
  const value = record(input);
  const status = propertyStatus(value.status ?? (value.candidate_only ? 'CANDIDATE' : 'CANONICAL'));
  const provenance_ref = String(value.provenance_ref ?? value.provenance ?? context.provenance_ref ?? '');
  const authority_ref = String(value.authority_ref ?? value.authority ?? context.authority_ref ?? '');
  fail(provenance_ref.length > 0, 'RNCS_PROPERTY_PROVENANCE_REQUIRED');
  fail(authority_ref.length > 0, 'RNCS_PROPERTY_AUTHORITY_REQUIRED');
  const hasQuantity = value.quantity && typeof value.quantity === 'object' || value.unit !== undefined || value.dimension !== undefined;
  const quantity = hasQuantity
    ? createRealityQuantity({
      ...(value.quantity && typeof value.quantity === 'object' ? value.quantity : value),
      status,
      provenance_ref,
      authority_ref,
      evidence_refs: value.evidence_refs ?? value.evidence ?? context.evidence_refs
    })
    : null;
  const value_kind = quantity ? 'quantity' : String(value.value_kind ?? 'symbolic');
  fail(quantity || value.value !== undefined, 'RNCS_PROPERTY_VALUE_REQUIRED');
  const base = {
    property_id: String(value.property_id ?? value.id ?? context.property_id ?? ''),
    domain: String(value.domain ?? context.domain ?? 'custom'),
    kind: String(value.kind ?? context.kind ?? 'custom'),
    value_kind,
    quantity,
    value: quantity ? null : clone(value.value),
    version: String(value.version ?? REALITY_PROPERTY_VERSION),
    status,
    validity_interval: interval(value.validity_interval ?? value.validityInterval),
    provenance_ref,
    authority_ref,
    evidence_refs: strings(value.evidence_refs ?? value.evidence ?? context.evidence_refs),
    constraints: clone(value.constraints ?? {}),
    metadata: clone(value.metadata ?? {}),
    candidate_only: status === 'CANDIDATE',
    authoritative: status === 'CANONICAL',
    commit_status: status === 'CANONICAL' ? 'COMMITTED' : 'NOT_COMMITTED'
  };
  fail(base.property_id.length > 0, 'RNCS_PROPERTY_ID_REQUIRED');
  fail(REALITY_PROPERTY_KINDS.includes(base.kind), 'RNCS_PROPERTY_KIND_INVALID');
  fail(REALITY_PROPERTY_DOMAINS.includes(base.domain), 'RNCS_PROPERTY_DOMAIN_INVALID');
  return {...base, property_root: rootHash(base)};
}

function propertyMap(input, kind, context = {}) {
  const source = Array.isArray(input)
    ? Object.fromEntries(input.map(item => [String(record(item).property_id ?? record(item).id ?? ''), item]))
    : record(input);
  const output = {};
  for (const [propertyId, raw] of Object.entries(source).sort(([a], [b]) => keySort(a, b))) {
    const entry = propertyValue(raw, {...context, property_id: propertyId, kind});
    fail(entry.property_id === propertyId || !propertyId, 'RNCS_PROPERTY_ID_KEY_MISMATCH');
    fail(!output[entry.property_id], 'RNCS_PROPERTY_DUPLICATE_ID');
    output[entry.property_id] = entry;
  }
  return output;
}

function anyNonCanonical(maps) {
  return Object.values(maps).some(map => Object.values(map).some(property => property.status !== 'CANONICAL'));
}

export function createRealityPropertySet(input = {}) {
  const value = record(input);
  const object_id = String(value.object_id ?? value.id ?? '');
  const property_set_id = String(value.property_set_id ?? value.id ?? `property-set:${object_id}`);
  fail(object_id, 'RNCS_PROPERTY_SET_OBJECT_ID_REQUIRED');
  const context = {
    provenance_ref: String(value.provenance_ref ?? value.provenance ?? 'rncs:property-set'),
    authority_ref: String(value.authority_ref ?? value.authority ?? 'rncs:authority'),
    evidence_refs: strings(value.evidence_refs ?? value.evidence)
  };
  const intrinsic_properties = propertyMap(value.intrinsic_properties ?? value.intrinsic ?? {}, 'intrinsic', {domain: 'physical', ...context});
  const dynamic_state = propertyMap(value.dynamic_state ?? value.dynamic ?? {}, 'dynamic', {domain: 'physical', ...context});
  const field_state = propertyMap(value.field_state ?? value.fields ?? {}, 'field', {domain: 'custom', ...context});
  const custom_properties = propertyMap(value.custom_properties ?? value.custom ?? {}, 'custom', {domain: 'custom', ...context});
  const maps = {intrinsic_properties, dynamic_state, field_state, custom_properties};
  const ids = [];
  for (const map of Object.values(maps)) ids.push(...Object.keys(map));
  fail(new Set(ids).size === ids.length, 'RNCS_PROPERTY_DUPLICATE_ID');
  const candidate_only = anyNonCanonical(maps);
  const base = {
    format: REALITY_PROPERTY_SET_FORMAT,
    version: REALITY_PROPERTY_VERSION,
    object_id,
    property_set_id,
    revision: String(value.revision ?? '0'),
    intrinsic_properties,
    dynamic_state,
    field_state,
    custom_properties,
    canonical_owner: 'RNCS',
    authority: {
      provider_can_write_canonical_property: false,
      rncs_authority_required: true,
      candidate_only,
      authoritative: !candidate_only
    },
    candidate_only,
    authoritative: !candidate_only,
    commit_status: candidate_only ? 'NOT_COMMITTED' : 'COMMITTED',
    evidence_refs: strings(value.evidence_refs ?? value.evidence)
  };
  return {...base, property_root: rootHash(base)};
}

function verifyPropertyEntry(entry, expectedKind, errors) {
  const check = (condition, code) => { if (!condition) errors.push(code); };
  check(entry && typeof entry === 'object', 'RNCS_PROPERTY_ENTRY_INVALID');
  if (!entry || typeof entry !== 'object') return;
  check(typeof entry.property_id === 'string' && entry.property_id.length > 0, 'RNCS_PROPERTY_ID_REQUIRED');
  check(entry.kind === expectedKind, 'RNCS_PROPERTY_KIND_MISMATCH');
  check(REALITY_PROPERTY_DOMAINS.includes(entry.domain), 'RNCS_PROPERTY_DOMAIN_INVALID');
  check(typeof entry.version === 'string' && entry.version.length > 0, 'RNCS_PROPERTY_VERSION_REQUIRED');
  check(REALITY_PROPERTY_STATUSES.includes(entry.status), 'RNCS_PROPERTY_STATUS_INVALID');
  check(entry.candidate_only === (entry.status === 'CANDIDATE'), 'RNCS_PROPERTY_CANDIDATE_FLAG_MISMATCH');
  check(entry.authoritative === (entry.status === 'CANONICAL'), 'RNCS_PROPERTY_AUTHORITY_FLAG_MISMATCH');
  check(typeof entry.provenance_ref === 'string' && entry.provenance_ref.length > 0, 'RNCS_PROPERTY_PROVENANCE_REQUIRED');
  check(typeof entry.authority_ref === 'string' && entry.authority_ref.length > 0, 'RNCS_PROPERTY_AUTHORITY_REQUIRED');
  check(Array.isArray(entry.evidence_refs), 'RNCS_PROPERTY_EVIDENCE_REFS_INVALID');
  if (entry.value_kind === 'quantity') check(verifyRealityQuantity(entry.quantity).valid, 'RNCS_PROPERTY_QUANTITY_INVALID');
  else check(entry.value !== undefined && entry.value !== null, 'RNCS_PROPERTY_VALUE_REQUIRED');
  check(hex64(entry.property_root), 'RNCS_PROPERTY_ROOT_INVALID');
  check(rootHash(without(entry, 'property_root')) === entry.property_root, 'RNCS_PROPERTY_ROOT_MISMATCH');
}

export function verifyRealityPropertySet(propertySet) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!propertySet || typeof propertySet !== 'object') return {valid: false, errors: ['RNCS_PROPERTY_SET_NOT_OBJECT']};
  try {
    check(propertySet.format === REALITY_PROPERTY_SET_FORMAT, 'RNCS_PROPERTY_SET_FORMAT_INVALID');
    check(propertySet.version === REALITY_PROPERTY_VERSION, 'RNCS_PROPERTY_SET_VERSION_INVALID');
    check(typeof propertySet.object_id === 'string' && propertySet.object_id.length > 0, 'RNCS_PROPERTY_SET_OBJECT_ID_REQUIRED');
    check(typeof propertySet.property_set_id === 'string' && propertySet.property_set_id.length > 0, 'RNCS_PROPERTY_SET_ID_REQUIRED');
    check(typeof propertySet.revision === 'string' && propertySet.revision.length > 0, 'RNCS_PROPERTY_SET_REVISION_REQUIRED');
    check(propertySet.canonical_owner === 'RNCS', 'RNCS_PROPERTY_SET_CANONICAL_OWNER_INVALID');
    check(propertySet.authority?.provider_can_write_canonical_property === false, 'RNCS_PROPERTY_SET_AUTHORITY_ESCALATION');
    check(propertySet.authority?.rncs_authority_required === true, 'RNCS_PROPERTY_SET_RNCS_AUTHORITY_REQUIRED');
    check(propertySet.authority?.candidate_only === propertySet.candidate_only, 'RNCS_PROPERTY_SET_AUTHORITY_STATUS_MISMATCH');
    check(propertySet.authority?.authoritative === propertySet.authoritative, 'RNCS_PROPERTY_SET_AUTHORITY_FLAG_MISMATCH');
    check(propertySet.candidate_only === (propertySet.authoritative === false), 'RNCS_PROPERTY_SET_STATUS_MISMATCH');
    check(propertySet.commit_status === (propertySet.candidate_only ? 'NOT_COMMITTED' : 'COMMITTED'), 'RNCS_PROPERTY_SET_COMMIT_STATUS_INVALID');
    check(Array.isArray(propertySet.evidence_refs), 'RNCS_PROPERTY_SET_EVIDENCE_REFS_INVALID');
    const ids = [];
    for (const [mapName, kind] of [['intrinsic_properties', 'intrinsic'], ['dynamic_state', 'dynamic'], ['field_state', 'field'], ['custom_properties', 'custom']]) {
      const map = propertySet[mapName];
      check(map && typeof map === 'object' && !Array.isArray(map), `RNCS_PROPERTY_SET_${mapName.toUpperCase()}_INVALID`);
      if (!map || typeof map !== 'object' || Array.isArray(map)) continue;
      for (const [propertyId, entry] of Object.entries(map)) {
        ids.push(propertyId);
        check(propertyId === entry?.property_id, 'RNCS_PROPERTY_ID_KEY_MISMATCH');
        verifyPropertyEntry(entry, kind, errors);
      }
    }
    check(new Set(ids).size === ids.length, 'RNCS_PROPERTY_DUPLICATE_ID');
    const candidate = ids.some(id => ['intrinsic_properties', 'dynamic_state', 'field_state', 'custom_properties'].some(mapName => {
      const property = propertySet[mapName]?.[id];
      return property && property.status !== 'CANONICAL';
    }));
    check(propertySet.candidate_only === candidate, 'RNCS_PROPERTY_SET_CANDIDATE_DERIVATION_MISMATCH');
    check(hex64(propertySet.property_root), 'RNCS_PROPERTY_SET_ROOT_INVALID');
    check(rootHash(without(propertySet, 'property_root')) === propertySet.property_root, 'RNCS_PROPERTY_SET_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_PROPERTY_SET_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, property_root: propertySet.property_root};
}

export function queryRealityProperty(propertySet, propertyId) {
  const verification = verifyRealityPropertySet(propertySet);
  fail(verification.valid, `RNCS_PROPERTY_SET_INVALID:${verification.errors.join(',')}`);
  const id = String(propertyId);
  for (const mapName of ['intrinsic_properties', 'dynamic_state', 'field_state', 'custom_properties']) {
    const entry = propertySet[mapName]?.[id];
    if (entry) return clone(entry);
  }
  return null;
}

export function listRealityProperties(propertySet) {
  const verification = verifyRealityPropertySet(propertySet);
  fail(verification.valid, `RNCS_PROPERTY_SET_INVALID:${verification.errors.join(',')}`);
  return ['intrinsic_properties', 'dynamic_state', 'field_state', 'custom_properties']
    .flatMap(mapName => Object.values(propertySet[mapName] ?? {}))
    .sort((a, b) => keySort(a.property_id, b.property_id))
    .map(clone);
}

function lawEntry(input, lawType, context = {}) {
  const value = record(input);
  const law_id = String(value.law_id ?? value.id ?? context.law_id ?? '');
  const provenance_ref = String(value.provenance_ref ?? value.provenance ?? context.provenance_ref ?? '');
  const authority_ref = String(value.authority_ref ?? value.authority ?? context.authority_ref ?? '');
  fail(law_id, 'RNCS_LAW_ID_REQUIRED');
  fail(provenance_ref, 'RNCS_LAW_PROVENANCE_REQUIRED');
  fail(authority_ref, 'RNCS_LAW_AUTHORITY_REQUIRED');
  const status = propertyStatus(value.status ?? (value.candidate_only ? 'CANDIDATE' : 'CANONICAL'));
  const base = {
    law_id,
    law_type: lawType,
    domain: String(value.domain ?? context.domain ?? 'custom'),
    model: String(value.model ?? 'provider-defined'),
    version: String(value.version ?? REALITY_PROPERTY_VERSION),
    parameters: clone(value.parameters ?? {}),
    valid_range: clone(value.valid_range ?? value.validRange ?? {}),
    supported_property_ids: strings(value.supported_property_ids ?? value.property_ids),
    evidence_refs: strings(value.evidence_refs ?? value.evidence ?? context.evidence_refs),
    provenance_ref,
    authority_ref,
    provider_policy: clone(value.provider_policy ?? {provider_may_approximate: true, provider_may_rewrite_canonical: false}),
    status,
    candidate_only: status === 'CANDIDATE',
    authoritative: status === 'CANONICAL',
    commit_status: status === 'CANONICAL' ? 'COMMITTED' : 'NOT_COMMITTED'
  };
  fail(REALITY_PROPERTY_DOMAINS.includes(base.domain), 'RNCS_LAW_DOMAIN_INVALID');
  return {...base, law_root: rootHash(base)};
}

function lawMap(input, lawType, context) {
  const source = Array.isArray(input)
    ? Object.fromEntries(input.map(item => [String(record(item).law_id ?? record(item).id ?? ''), item]))
    : record(input);
  const output = {};
  for (const [lawId, raw] of Object.entries(source).sort(([a], [b]) => keySort(a, b))) {
    const entry = lawEntry(raw, lawType, {...context, law_id: lawId});
    fail(entry.law_id === lawId || !lawId, 'RNCS_LAW_ID_KEY_MISMATCH');
    fail(!output[entry.law_id], 'RNCS_LAW_DUPLICATE_ID');
    output[entry.law_id] = entry;
  }
  return output;
}

export function createRealityLawBindings(input = {}) {
  const value = record(input);
  const object_id = String(value.object_id ?? value.id ?? '');
  const law_bindings_id = String(value.law_bindings_id ?? value.id ?? `law-bindings:${object_id}`);
  fail(object_id, 'RNCS_LAW_BINDINGS_OBJECT_ID_REQUIRED');
  const context = {
    provenance_ref: String(value.provenance_ref ?? value.provenance ?? 'rncs:law-bindings'),
    authority_ref: String(value.authority_ref ?? value.authority ?? 'rncs:authority'),
    evidence_refs: strings(value.evidence_refs ?? value.evidence)
  };
  const world_laws = lawMap(value.world_laws ?? value.world ?? {}, 'world', context);
  const constitutive_laws = lawMap(value.constitutive_laws ?? value.constitutive ?? {}, 'constitutive', context);
  const interaction_laws = lawMap(value.interaction_laws ?? value.interaction ?? {}, 'interaction', context);
  const maps = {world_laws, constitutive_laws, interaction_laws};
  const ids = Object.values(maps).flatMap(map => Object.keys(map));
  fail(new Set(ids).size === ids.length, 'RNCS_LAW_DUPLICATE_ID');
  const candidate_only = Object.values(maps).some(map => Object.values(map).some(law => law.status !== 'CANONICAL'));
  const base = {
    format: REALITY_LAW_BINDINGS_FORMAT,
    version: REALITY_PROPERTY_VERSION,
    object_id,
    law_bindings_id,
    revision: String(value.revision ?? '0'),
    world_law_set_id: String(value.world_law_set_id ?? value.worldLawSetId ?? 'default'),
    world_laws,
    constitutive_laws,
    interaction_laws,
    canonical_owner: 'RNCS',
    authority: {
      provider_can_write_canonical_law: false,
      rncs_authority_required: true,
      candidate_only,
      authoritative: !candidate_only
    },
    candidate_only,
    authoritative: !candidate_only,
    commit_status: candidate_only ? 'NOT_COMMITTED' : 'COMMITTED',
    evidence_refs: strings(value.evidence_refs ?? value.evidence)
  };
  return {...base, bindings_root: rootHash(base)};
}

function verifyLawEntry(entry, expectedType, errors) {
  const check = (condition, code) => { if (!condition) errors.push(code); };
  check(entry && typeof entry === 'object', 'RNCS_LAW_ENTRY_INVALID');
  if (!entry || typeof entry !== 'object') return;
  check(typeof entry.law_id === 'string' && entry.law_id.length > 0, 'RNCS_LAW_ID_REQUIRED');
  check(entry.law_type === expectedType, 'RNCS_LAW_TYPE_MISMATCH');
  check(REALITY_PROPERTY_DOMAINS.includes(entry.domain), 'RNCS_LAW_DOMAIN_INVALID');
  check(typeof entry.model === 'string' && entry.model.length > 0, 'RNCS_LAW_MODEL_REQUIRED');
  check(typeof entry.version === 'string' && entry.version.length > 0, 'RNCS_LAW_VERSION_REQUIRED');
  check(typeof entry.provenance_ref === 'string' && entry.provenance_ref.length > 0, 'RNCS_LAW_PROVENANCE_REQUIRED');
  check(typeof entry.authority_ref === 'string' && entry.authority_ref.length > 0, 'RNCS_LAW_AUTHORITY_REQUIRED');
  check(REALITY_PROPERTY_STATUSES.includes(entry.status), 'RNCS_LAW_STATUS_INVALID');
  check(entry.candidate_only === (entry.status === 'CANDIDATE'), 'RNCS_LAW_CANDIDATE_FLAG_MISMATCH');
  check(entry.authoritative === (entry.status === 'CANONICAL'), 'RNCS_LAW_AUTHORITY_FLAG_MISMATCH');
  check(entry.provider_policy?.provider_may_rewrite_canonical === false, 'RNCS_LAW_PROVIDER_AUTHORITY_ESCALATION');
  check(hex64(entry.law_root), 'RNCS_LAW_ROOT_INVALID');
  check(rootHash(without(entry, 'law_root')) === entry.law_root, 'RNCS_LAW_ROOT_MISMATCH');
}

export function verifyRealityLawBindings(bindings) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!bindings || typeof bindings !== 'object') return {valid: false, errors: ['RNCS_LAW_BINDINGS_NOT_OBJECT']};
  try {
    check(bindings.format === REALITY_LAW_BINDINGS_FORMAT, 'RNCS_LAW_BINDINGS_FORMAT_INVALID');
    check(bindings.version === REALITY_PROPERTY_VERSION, 'RNCS_LAW_BINDINGS_VERSION_INVALID');
    check(typeof bindings.object_id === 'string' && bindings.object_id.length > 0, 'RNCS_LAW_BINDINGS_OBJECT_ID_REQUIRED');
    check(typeof bindings.law_bindings_id === 'string' && bindings.law_bindings_id.length > 0, 'RNCS_LAW_BINDINGS_ID_REQUIRED');
    check(typeof bindings.revision === 'string' && bindings.revision.length > 0, 'RNCS_LAW_BINDINGS_REVISION_REQUIRED');
    check(typeof bindings.world_law_set_id === 'string' && bindings.world_law_set_id.length > 0, 'RNCS_WORLD_LAW_SET_ID_REQUIRED');
    check(bindings.canonical_owner === 'RNCS', 'RNCS_LAW_BINDINGS_CANONICAL_OWNER_INVALID');
    check(bindings.authority?.provider_can_write_canonical_law === false, 'RNCS_LAW_BINDINGS_AUTHORITY_ESCALATION');
    check(bindings.authority?.rncs_authority_required === true, 'RNCS_LAW_BINDINGS_RNCS_AUTHORITY_REQUIRED');
    check(bindings.authority?.candidate_only === bindings.candidate_only, 'RNCS_LAW_BINDINGS_AUTHORITY_STATUS_MISMATCH');
    check(bindings.authority?.authoritative === bindings.authoritative, 'RNCS_LAW_BINDINGS_AUTHORITY_FLAG_MISMATCH');
    check(bindings.candidate_only === (bindings.authoritative === false), 'RNCS_LAW_BINDINGS_STATUS_MISMATCH');
    check(bindings.commit_status === (bindings.candidate_only ? 'NOT_COMMITTED' : 'COMMITTED'), 'RNCS_LAW_BINDINGS_COMMIT_STATUS_INVALID');
    check(Array.isArray(bindings.evidence_refs), 'RNCS_LAW_BINDINGS_EVIDENCE_REFS_INVALID');
    const ids = [];
    for (const [mapName, lawType] of [['world_laws', 'world'], ['constitutive_laws', 'constitutive'], ['interaction_laws', 'interaction']]) {
      const map = bindings[mapName];
      check(map && typeof map === 'object' && !Array.isArray(map), `RNCS_${mapName.toUpperCase()}_INVALID`);
      if (!map || typeof map !== 'object' || Array.isArray(map)) continue;
      for (const [lawId, entry] of Object.entries(map)) {
        ids.push(lawId);
        check(lawId === entry?.law_id, 'RNCS_LAW_ID_KEY_MISMATCH');
        verifyLawEntry(entry, lawType, errors);
      }
    }
    check(new Set(ids).size === ids.length, 'RNCS_LAW_DUPLICATE_ID');
    const candidate = ids.some(id => ['world_laws', 'constitutive_laws', 'interaction_laws'].some(mapName => {
      const law = bindings[mapName]?.[id];
      return law && law.status !== 'CANONICAL';
    }));
    check(bindings.candidate_only === candidate, 'RNCS_LAW_BINDINGS_CANDIDATE_DERIVATION_MISMATCH');
    check(hex64(bindings.bindings_root), 'RNCS_LAW_BINDINGS_ROOT_INVALID');
    check(rootHash(without(bindings, 'bindings_root')) === bindings.bindings_root, 'RNCS_LAW_BINDINGS_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_LAW_BINDINGS_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, bindings_root: bindings.bindings_root};
}

export function queryRealityLaw(bindings, lawId) {
  const verification = verifyRealityLawBindings(bindings);
  fail(verification.valid, `RNCS_LAW_BINDINGS_INVALID:${verification.errors.join(',')}`);
  const id = String(lawId);
  for (const mapName of ['world_laws', 'constitutive_laws', 'interaction_laws']) {
    const entry = bindings[mapName]?.[id];
    if (entry) return clone(entry);
  }
  return null;
}

export function createRealityPropertyTransitionCandidate(input = {}) {
  const value = record(input);
  const propertySet = value.property_set ?? value.propertySet;
  const propertyVerification = verifyRealityPropertySet(propertySet);
  fail(propertyVerification.valid, `RNCS_PROPERTY_SET_INVALID:${propertyVerification.errors.join(',')}`);
  const lawBinding = clone(value.law_binding ?? value.lawBinding ?? {});
  fail(typeof lawBinding.law_id === 'string' && lawBinding.law_id.length > 0, 'RNCS_PROPERTY_TRANSITION_LAW_REQUIRED');
  if (lawBinding.law_root !== undefined) fail(hex64(lawBinding.law_root), 'RNCS_PROPERTY_TRANSITION_LAW_ROOT_INVALID');
  const source_state_root = String(value.source_state_root ?? value.state_root ?? '');
  fail(hex64(source_state_root), 'RNCS_PROPERTY_TRANSITION_STATE_ROOT_INVALID');
  const provider = record(value.provider);
  const provider_id = String(provider.provider_id ?? provider.id ?? '');
  fail(provider_id, 'RNCS_PROPERTY_TRANSITION_PROVIDER_ID_REQUIRED');
  if (provider.provider_root !== undefined && provider.provider_root !== null) fail(hex64(provider.provider_root), 'RNCS_PROPERTY_TRANSITION_PROVIDER_ROOT_INVALID');
  const transition_id = String(value.transition_id ?? `property-transition:${propertySet.object_id}:${propertySet.revision}`);
  const base = {
    format: REALITY_PROPERTY_TRANSITION_FORMAT,
    version: REALITY_PROPERTY_VERSION,
    transition_id,
    phase: 'candidate',
    object_id: propertySet.object_id,
    source_property_root: propertySet.property_root,
    source_state_root,
    law_binding: lawBinding,
    applied_input: clone(value.applied_input ?? {}),
    provider: {
      provider_id,
      provider_root: provider.provider_root ?? null,
      deterministic: provider.deterministic ?? null,
      runtime: provider.runtime ?? null
    },
    predicted_output: clone(value.predicted_output ?? null),
    uncertainty: clone(value.uncertainty ?? null),
    constraint_check: clone(value.constraint_check ?? {status: 'NOT_RUN', evidence_refs: []}),
    authority: {
      provider_can_write_canonical_property: false,
      rncs_authority_required: true,
      canonical_state_mutation_allowed: false,
      candidate_only: true
    },
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, transition_root: rootHash(base)};
}

export function verifyRealityPropertyTransition(transition) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!transition || typeof transition !== 'object') return {valid: false, errors: ['RNCS_PROPERTY_TRANSITION_NOT_OBJECT']};
  try {
    check(transition.format === REALITY_PROPERTY_TRANSITION_FORMAT, 'RNCS_PROPERTY_TRANSITION_FORMAT_INVALID');
    check(transition.version === REALITY_PROPERTY_VERSION, 'RNCS_PROPERTY_TRANSITION_VERSION_INVALID');
    check(typeof transition.transition_id === 'string' && transition.transition_id.length > 0, 'RNCS_PROPERTY_TRANSITION_ID_REQUIRED');
    check(transition.phase === 'candidate', 'RNCS_PROPERTY_TRANSITION_PHASE_INVALID');
    check(typeof transition.object_id === 'string' && transition.object_id.length > 0, 'RNCS_PROPERTY_TRANSITION_OBJECT_ID_REQUIRED');
    check(hex64(transition.source_property_root), 'RNCS_PROPERTY_TRANSITION_PROPERTY_ROOT_INVALID');
    check(hex64(transition.source_state_root), 'RNCS_PROPERTY_TRANSITION_STATE_ROOT_INVALID');
    check(typeof transition.law_binding?.law_id === 'string' && transition.law_binding.law_id.length > 0, 'RNCS_PROPERTY_TRANSITION_LAW_REQUIRED');
    if (transition.law_binding?.law_root !== undefined) check(hex64(transition.law_binding.law_root), 'RNCS_PROPERTY_TRANSITION_LAW_ROOT_INVALID');
    check(typeof transition.provider?.provider_id === 'string' && transition.provider.provider_id.length > 0, 'RNCS_PROPERTY_TRANSITION_PROVIDER_ID_REQUIRED');
    if (transition.provider?.provider_root !== undefined && transition.provider.provider_root !== null) check(hex64(transition.provider.provider_root), 'RNCS_PROPERTY_TRANSITION_PROVIDER_ROOT_INVALID');
    check(transition.authority?.provider_can_write_canonical_property === false, 'RNCS_PROPERTY_TRANSITION_AUTHORITY_ESCALATION');
    check(transition.authority?.rncs_authority_required === true, 'RNCS_PROPERTY_TRANSITION_RNCS_AUTHORITY_REQUIRED');
    check(transition.authority?.canonical_state_mutation_allowed === false, 'RNCS_PROPERTY_TRANSITION_CANONICAL_MUTATION');
    check(transition.candidate_only === true, 'RNCS_PROPERTY_TRANSITION_MUST_BE_CANDIDATE_ONLY');
    check(transition.authoritative === false, 'RNCS_PROPERTY_TRANSITION_CANNOT_BE_AUTHORITATIVE');
    check(transition.commit_status === 'NOT_COMMITTED', 'RNCS_PROPERTY_TRANSITION_COMMIT_STATUS_INVALID');
    check(hex64(transition.transition_root), 'RNCS_PROPERTY_TRANSITION_ROOT_INVALID');
    check(rootHash(without(transition, 'transition_root')) === transition.transition_root, 'RNCS_PROPERTY_TRANSITION_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_PROPERTY_TRANSITION_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, transition_root: transition.transition_root};
}
