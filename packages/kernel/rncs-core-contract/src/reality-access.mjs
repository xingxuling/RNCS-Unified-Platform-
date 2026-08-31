import {ContractError, rootHash, without} from './index.mjs';

export const REALITY_ACCESS_VERSION = '0.3.0';
export const REALITY_DETAIL_VECTOR_FORMAT = 'rncs.reality-detail-vector.v0.3';
export const REALITY_HORIZON_FORMAT = 'rncs.reality-horizon.v0.3';
export const REALITY_INTEREST_GRAPH_FORMAT = 'rncs.reality-interest-graph.v0.3';
export const REALITY_QUERY_FORMAT = 'rncs.reality-query.v0.3';
export const REALITY_COGNITIVE_WORKING_SET_FORMAT = 'rncs.cognitive-working-set.v0.3';

export const REALITY_DETAIL_AXES = Object.freeze([
  'visual', 'physical', 'causal', 'semantic', 'behavioral', 'audio', 'temporal', 'cognitive', 'representation_flow'
]);
export const REALITY_HORIZON_AXES = Object.freeze([
  'visual', 'auditory', 'spatial', 'semantic', 'social', 'temporal', 'causal', 'cognitive', 'actionable'
]);
export const REALITY_INTEREST_EDGE_TYPES = Object.freeze([
  'visual_interest', 'audio_interest', 'task_interest', 'social_interest',
  'threat_interest', 'causal_interest', 'authority_interest', 'semantic_interest', 'history_interest'
]);
export const REALITY_QUERY_OPERATORS = Object.freeze(['==', '!=', '<', '<=', '>', '>=', 'in', 'contains']);

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);
const rootOf = (value, field) => rootHash(without(value, field));

function scalar(value, code) {
  if (typeof value === 'number') {
    fail(Number.isSafeInteger(value), code);
    return value;
  }
  if (typeof value === 'string' && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return value;
  throw new ContractError(code);
}

function nullableScalar(value, code) {
  return value === null || value === undefined ? null : scalar(value, code);
}

function level(value, code) {
  const normalized = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  fail(Number.isSafeInteger(normalized) && normalized >= 0 && normalized <= 5, code);
  return normalized;
}

function coordinates(value, code = 'RNCS_QUERY_POSITION_INVALID') {
  const source = record(value);
  const output = {};
  for (const axis of ['x', 'y', 'z']) {
    if (source[axis] !== undefined && source[axis] !== null) output[axis] = scalar(source[axis], code);
  }
  fail(Object.keys(output).length === 3, code);
  return output;
}

function normalizeDetailAxes(input = {}) {
  const source = record(input);
  const axes = {};
  for (const axis of REALITY_DETAIL_AXES) axes[axis] = level(source[axis] ?? 0, `RNCS_DETAIL_AXIS_INVALID:${axis}`);
  return axes;
}

export function createRealityDetailVector(input = {}) {
  const value = record(input);
  const axes = normalizeDetailAxes(value.axes ?? value);
  const base = {
    format: REALITY_DETAIL_VECTOR_FORMAT,
    version: REALITY_ACCESS_VERSION,
    axes,
    independent_axes: [...REALITY_DETAIL_AXES],
    axis_metadata: clone(value.axis_metadata ?? {}),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, vector_root: rootHash(base)};
}

export function verifyRealityDetailVector(detailVector) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!detailVector || typeof detailVector !== 'object') return {valid: false, errors: ['RNCS_DETAIL_VECTOR_NOT_OBJECT']};
  try {
    check(detailVector.format === REALITY_DETAIL_VECTOR_FORMAT, 'RNCS_DETAIL_VECTOR_FORMAT_INVALID');
    check(detailVector.version === REALITY_ACCESS_VERSION, 'RNCS_DETAIL_VECTOR_VERSION_INVALID');
    check(detailVector.axes && typeof detailVector.axes === 'object' && !Array.isArray(detailVector.axes), 'RNCS_DETAIL_AXES_INVALID');
    for (const axis of REALITY_DETAIL_AXES) check(level(detailVector.axes?.[axis], `RNCS_DETAIL_AXIS_INVALID:${axis}`) === detailVector.axes?.[axis], `RNCS_DETAIL_AXIS_INVALID:${axis}`);
    check(rootHash(detailVector.independent_axes ?? []) === rootHash(REALITY_DETAIL_AXES), 'RNCS_DETAIL_AXIS_SET_INVALID');
    check(detailVector.candidate_only === true, 'RNCS_DETAIL_VECTOR_MUST_BE_CANDIDATE_ONLY');
    check(detailVector.authoritative === false, 'RNCS_DETAIL_VECTOR_CANNOT_BE_AUTHORITATIVE');
    check(detailVector.commit_status === 'NOT_COMMITTED', 'RNCS_DETAIL_VECTOR_COMMIT_STATUS_INVALID');
    check(hex64(detailVector.vector_root), 'RNCS_DETAIL_VECTOR_ROOT_INVALID');
    check(rootOf(detailVector, 'vector_root') === detailVector.vector_root, 'RNCS_DETAIL_VECTOR_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_DETAIL_VECTOR_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, vector_root: detailVector.vector_root};
}

export function adjustRealityDetailVector(detailVector, patch = {}) {
  const verification = verifyRealityDetailVector(detailVector);
  fail(verification.valid, `RNCS_DETAIL_VECTOR_INVALID:${verification.errors.join(',')}`);
  const next = createRealityDetailVector({
    ...clone(detailVector),
    axes: {...detailVector.axes, ...record(patch.axes ?? patch)},
    axis_metadata: clone(detailVector.axis_metadata ?? {})
  });
  return next;
}

function horizonAxis(input, axis) {
  const value = record(input);
  const maxResults = value.max_results ?? value.maxObjects ?? null;
  const maxDepth = value.max_depth ?? value.maxDepth ?? null;
  if (maxResults !== null) fail(Number.isSafeInteger(maxResults) && maxResults > 0, `RNCS_HORIZON_MAX_RESULTS_INVALID:${axis}`);
  if (maxDepth !== null) fail(Number.isSafeInteger(maxDepth) && maxDepth >= 0, `RNCS_HORIZON_MAX_DEPTH_INVALID:${axis}`);
  return {
    mode: String(value.mode ?? 'bounded'),
    radius: nullableScalar(value.radius ?? value.radius_m, `RNCS_HORIZON_RADIUS_INVALID:${axis}`),
    unit: String(value.unit ?? 'm'),
    tags: strings(value.tags ?? value.semantic_tags),
    scopes: strings(value.scopes ?? value.scope),
    max_results: maxResults,
    max_depth: maxDepth,
    risk_multiplier: nullableScalar(value.risk_multiplier ?? value.riskMultiplier, `RNCS_HORIZON_RISK_MULTIPLIER_INVALID:${axis}`),
    permission_required: value.permission_required !== false
  };
}

export function createRealityHorizon(input = {}) {
  const value = record(input);
  const subject_id = String(value.subject_id ?? value.subjectId ?? '');
  fail(subject_id, 'RNCS_HORIZON_SUBJECT_ID_REQUIRED');
  const source = record(value.axes ?? value);
  const axes = {};
  for (const axis of REALITY_HORIZON_AXES) axes[axis] = horizonAxis(source[axis], axis);
  const base = {
    format: REALITY_HORIZON_FORMAT,
    version: REALITY_ACCESS_VERSION,
    subject_id,
    axes,
    permission_scope: strings(value.permission_scope ?? value.permissionScope),
    authority: {
      canonical_owner: 'RNCS',
      permission_filter_required: true,
      subject_scope_only: true
    },
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, horizon_root: rootHash(base)};
}

export function verifyRealityHorizon(horizon) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!horizon || typeof horizon !== 'object') return {valid: false, errors: ['RNCS_HORIZON_NOT_OBJECT']};
  try {
    check(horizon.format === REALITY_HORIZON_FORMAT, 'RNCS_HORIZON_FORMAT_INVALID');
    check(horizon.version === REALITY_ACCESS_VERSION, 'RNCS_HORIZON_VERSION_INVALID');
    check(typeof horizon.subject_id === 'string' && horizon.subject_id.length > 0, 'RNCS_HORIZON_SUBJECT_ID_REQUIRED');
    for (const axis of REALITY_HORIZON_AXES) {
      const value = horizon.axes?.[axis];
      check(value && typeof value === 'object' && !Array.isArray(value), `RNCS_HORIZON_AXIS_INVALID:${axis}`);
      if (!value || typeof value !== 'object') continue;
      check(typeof value.mode === 'string' && value.mode.length > 0, `RNCS_HORIZON_MODE_INVALID:${axis}`);
      if (value.radius !== null) {
        try { scalar(value.radius, `RNCS_HORIZON_RADIUS_INVALID:${axis}`); } catch { check(false, `RNCS_HORIZON_RADIUS_INVALID:${axis}`); }
      }
      check(Array.isArray(value.tags) && Array.isArray(value.scopes), `RNCS_HORIZON_AXIS_LISTS_INVALID:${axis}`);
      if (value.max_results !== null) check(Number.isSafeInteger(value.max_results) && value.max_results > 0, `RNCS_HORIZON_MAX_RESULTS_INVALID:${axis}`);
      if (value.max_depth !== null) check(Number.isSafeInteger(value.max_depth) && value.max_depth >= 0, `RNCS_HORIZON_MAX_DEPTH_INVALID:${axis}`);
      check(typeof value.permission_required === 'boolean', `RNCS_HORIZON_PERMISSION_FLAG_INVALID:${axis}`);
    }
    check(Array.isArray(horizon.permission_scope), 'RNCS_HORIZON_PERMISSION_SCOPE_INVALID');
    check(horizon.authority?.canonical_owner === 'RNCS', 'RNCS_HORIZON_CANONICAL_OWNER_INVALID');
    check(horizon.authority?.permission_filter_required === true, 'RNCS_HORIZON_PERMISSION_FILTER_REQUIRED');
    check(horizon.authority?.subject_scope_only === true, 'RNCS_HORIZON_SUBJECT_SCOPE_INVALID');
    check(horizon.candidate_only === true, 'RNCS_HORIZON_MUST_BE_CANDIDATE_ONLY');
    check(horizon.authoritative === false, 'RNCS_HORIZON_CANNOT_BE_AUTHORITATIVE');
    check(horizon.commit_status === 'NOT_COMMITTED', 'RNCS_HORIZON_COMMIT_STATUS_INVALID');
    check(hex64(horizon.horizon_root), 'RNCS_HORIZON_ROOT_INVALID');
    check(rootOf(horizon, 'horizon_root') === horizon.horizon_root, 'RNCS_HORIZON_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_HORIZON_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, horizon_root: horizon.horizon_root};
}

function weight(value, code) {
  const normalized = scalar(value ?? '0', code);
  const numeric = Number(normalized);
  fail(Number.isFinite(numeric) && numeric >= 0, code);
  return normalized;
}

function interestNode(input = {}) {
  const value = record(input);
  const object_id = String(value.object_id ?? value.id ?? '');
  fail(object_id, 'RNCS_INTEREST_NODE_OBJECT_ID_REQUIRED');
  const weights = {};
  for (const type of REALITY_INTEREST_EDGE_TYPES) weights[type] = weight(value.weights?.[type] ?? value[type], `RNCS_INTEREST_WEIGHT_INVALID:${type}`);
  return {
    object_id,
    weights,
    required: value.required === true,
    reasons: strings(value.reasons),
    evidence_refs: strings(value.evidence_refs ?? value.evidence)
  };
}

function interestEdge(input = {}) {
  const value = record(input);
  const from = String(value.from ?? value.subject_id ?? '');
  const to = String(value.to ?? value.object_id ?? '');
  const type = String(value.type ?? 'semantic_interest');
  fail(from && to, 'RNCS_INTEREST_EDGE_ENDPOINT_REQUIRED');
  fail(REALITY_INTEREST_EDGE_TYPES.includes(type), 'RNCS_INTEREST_EDGE_TYPE_INVALID');
  return {from, to, type, weight: weight(value.weight ?? '0', 'RNCS_INTEREST_EDGE_WEIGHT_INVALID'), evidence_refs: strings(value.evidence_refs ?? value.evidence)};
}

export function createRealityInterestGraph(input = {}) {
  const value = record(input);
  const subject_id = String(value.subject_id ?? value.subjectId ?? '');
  fail(subject_id, 'RNCS_INTEREST_GRAPH_SUBJECT_ID_REQUIRED');
  const nodes = (Array.isArray(value.nodes) ? value.nodes : []).map(interestNode).sort((a, b) => keySort(a.object_id, b.object_id));
  const edges = (Array.isArray(value.edges) ? value.edges : []).map(interestEdge).sort((a, b) => keySort(a.from, b.from) || keySort(a.to, b.to) || keySort(a.type, b.type));
  const base = {
    format: REALITY_INTEREST_GRAPH_FORMAT,
    version: REALITY_ACCESS_VERSION,
    subject_id,
    graph_revision: String(value.graph_revision ?? value.revision ?? '0'),
    nodes,
    edges,
    authority: {canonical_owner: 'RNCS', ranking_only: true, cannot_mutate_canonical_state: true},
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, graph_root: rootHash(base)};
}

export function verifyRealityInterestGraph(graph) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!graph || typeof graph !== 'object') return {valid: false, errors: ['RNCS_INTEREST_GRAPH_NOT_OBJECT']};
  try {
    check(graph.format === REALITY_INTEREST_GRAPH_FORMAT, 'RNCS_INTEREST_GRAPH_FORMAT_INVALID');
    check(graph.version === REALITY_ACCESS_VERSION, 'RNCS_INTEREST_GRAPH_VERSION_INVALID');
    check(typeof graph.subject_id === 'string' && graph.subject_id.length > 0, 'RNCS_INTEREST_GRAPH_SUBJECT_ID_REQUIRED');
    check(Array.isArray(graph.nodes), 'RNCS_INTEREST_GRAPH_NODES_INVALID');
    check(Array.isArray(graph.edges), 'RNCS_INTEREST_GRAPH_EDGES_INVALID');
    const nodeIds = new Set();
    for (const node of graph.nodes ?? []) {
      check(typeof node.object_id === 'string' && node.object_id.length > 0, 'RNCS_INTEREST_NODE_OBJECT_ID_REQUIRED');
      check(!nodeIds.has(node.object_id), 'RNCS_INTEREST_NODE_DUPLICATE');
      nodeIds.add(node.object_id);
      check(node.weights && typeof node.weights === 'object', 'RNCS_INTEREST_NODE_WEIGHTS_INVALID');
      for (const type of REALITY_INTEREST_EDGE_TYPES) {
        try { weight(node.weights?.[type], `RNCS_INTEREST_WEIGHT_INVALID:${type}`); } catch { check(false, `RNCS_INTEREST_WEIGHT_INVALID:${type}`); }
      }
      check(Array.isArray(node.reasons) && Array.isArray(node.evidence_refs), 'RNCS_INTEREST_NODE_EVIDENCE_INVALID');
    }
    for (const edge of graph.edges ?? []) {
      check(typeof edge.from === 'string' && edge.from.length > 0 && typeof edge.to === 'string' && edge.to.length > 0, 'RNCS_INTEREST_EDGE_ENDPOINT_REQUIRED');
      check(REALITY_INTEREST_EDGE_TYPES.includes(edge.type), 'RNCS_INTEREST_EDGE_TYPE_INVALID');
      try { weight(edge.weight, 'RNCS_INTEREST_EDGE_WEIGHT_INVALID'); } catch { check(false, 'RNCS_INTEREST_EDGE_WEIGHT_INVALID'); }
      check(Array.isArray(edge.evidence_refs), 'RNCS_INTEREST_EDGE_EVIDENCE_INVALID');
    }
    check(graph.authority?.canonical_owner === 'RNCS', 'RNCS_INTEREST_GRAPH_CANONICAL_OWNER_INVALID');
    check(graph.authority?.ranking_only === true, 'RNCS_INTEREST_GRAPH_RANKING_ONLY_REQUIRED');
    check(graph.authority?.cannot_mutate_canonical_state === true, 'RNCS_INTEREST_GRAPH_AUTHORITY_ESCALATION');
    check(graph.candidate_only === true && graph.authoritative === false, 'RNCS_INTEREST_GRAPH_STATUS_INVALID');
    check(graph.commit_status === 'NOT_COMMITTED', 'RNCS_INTEREST_GRAPH_COMMIT_STATUS_INVALID');
    check(hex64(graph.graph_root), 'RNCS_INTEREST_GRAPH_ROOT_INVALID');
    check(rootOf(graph, 'graph_root') === graph.graph_root, 'RNCS_INTEREST_GRAPH_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_INTEREST_GRAPH_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, graph_root: graph.graph_root};
}

function normalizeStateFilters(input) {
  const values = Array.isArray(input) ? input : [];
  return values.map(raw => {
    const value = record(raw);
    const property_id = String(value.property_id ?? value.propertyId ?? '');
    const operator = String(value.operator ?? '==');
    fail(property_id, 'RNCS_QUERY_STATE_PROPERTY_ID_REQUIRED');
    fail(REALITY_QUERY_OPERATORS.includes(operator), 'RNCS_QUERY_STATE_OPERATOR_INVALID');
    fail(value.value !== undefined, 'RNCS_QUERY_STATE_VALUE_REQUIRED');
    return {property_id, operator, value: clone(value.value), unit: value.unit === undefined ? null : String(value.unit), dimension: value.dimension === undefined ? null : String(value.dimension)};
  }).sort((a, b) => keySort(a.property_id, b.property_id) || keySort(a.operator, b.operator) || keySort(JSON.stringify(a.value), JSON.stringify(b.value)));
}

function normalizeRelations(input) {
  return (Array.isArray(input) ? input : []).map(raw => {
    const value = record(raw);
    return {
      type: String(value.type ?? value.relation ?? ''),
      from: value.from === undefined ? null : String(value.from),
      to: value.to === undefined ? null : String(value.to),
      direction: String(value.direction ?? 'outgoing')
    };
  }).sort((a, b) => keySort(a.type, b.type) || keySort(a.from ?? '', b.from ?? '') || keySort(a.to ?? '', b.to ?? ''));
}

function normalizeQueryFilters(input = {}) {
  const value = record(input);
  const spatial = record(value.spatial);
  const semantic = record(value.semantic);
  const temporal = record(value.temporal ?? value.time);
  return {
    spatial: Object.keys(spatial).length === 0 ? null : {
      origin: spatial.origin ? coordinates(spatial.origin) : null,
      radius: nullableScalar(spatial.radius ?? spatial.radius_m, 'RNCS_QUERY_SPATIAL_RADIUS_INVALID'),
      unit: String(spatial.unit ?? 'm')
    },
    state: normalizeStateFilters(value.state ?? value.state_filters),
    relations: normalizeRelations(value.relations ?? value.relation ?? value.relation_filters),
    temporal: Object.keys(temporal).length === 0 ? null : {
      from: nullableScalar(temporal.from ?? temporal.start, 'RNCS_QUERY_TEMPORAL_FROM_INVALID'),
      to: nullableScalar(temporal.to ?? temporal.end, 'RNCS_QUERY_TEMPORAL_TO_INVALID')
    },
    semantic: {
      tags: strings(semantic.tags ?? semantic.semantic_tags),
      mode: String(semantic.mode ?? 'any')
    }
  };
}

export function createRealityQuery(input = {}) {
  const value = record(input);
  const query_id = String(value.query_id ?? value.queryId ?? `query:${rootHash({subject_id: value.subject_id ?? value.subjectId ?? '', filters: value.filters ?? {}}).slice(0, 24)}`);
  const subject_id = String(value.subject_id ?? value.subjectId ?? '');
  fail(subject_id, 'RNCS_QUERY_SUBJECT_ID_REQUIRED');
  const horizon = clone(value.horizon ?? {});
  const horizonVerification = verifyRealityHorizon(horizon);
  fail(horizonVerification.valid, `RNCS_QUERY_HORIZON_INVALID:${horizonVerification.errors.join(',')}`);
  fail(horizon.subject_id === subject_id, 'RNCS_QUERY_HORIZON_SUBJECT_MISMATCH');
  const graph = value.interest_graph ?? value.interestGraph ?? null;
  if (graph) fail(verifyRealityInterestGraph(graph).valid, 'RNCS_QUERY_INTEREST_GRAPH_INVALID');
  const limit = Number(value.limit ?? value.max_results ?? 100);
  fail(Number.isSafeInteger(limit) && limit > 0, 'RNCS_QUERY_LIMIT_INVALID');
  const base = {
    format: REALITY_QUERY_FORMAT,
    version: REALITY_ACCESS_VERSION,
    query_id,
    subject_id,
    horizon,
    interest_graph: graph ? clone(graph) : null,
    filters: normalizeQueryFilters(value.filters ?? value),
    permission_scope: strings(value.permission_scope ?? value.permissionScope ?? horizon.permission_scope),
    limit,
    freshness_budget: nullableScalar(value.freshness_budget ?? value.freshnessBudget, 'RNCS_QUERY_FRESHNESS_BUDGET_INVALID'),
    revalidate_canonical: value.revalidate_canonical !== false,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, query_root: rootHash(base)};
}

export function verifyRealityQuery(query) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!query || typeof query !== 'object') return {valid: false, errors: ['RNCS_QUERY_NOT_OBJECT']};
  try {
    check(query.format === REALITY_QUERY_FORMAT, 'RNCS_QUERY_FORMAT_INVALID');
    check(query.version === REALITY_ACCESS_VERSION, 'RNCS_QUERY_VERSION_INVALID');
    check(typeof query.query_id === 'string' && query.query_id.length > 0, 'RNCS_QUERY_ID_REQUIRED');
    check(typeof query.subject_id === 'string' && query.subject_id.length > 0, 'RNCS_QUERY_SUBJECT_ID_REQUIRED');
    check(verifyRealityHorizon(query.horizon).valid, 'RNCS_QUERY_HORIZON_INVALID');
    check(query.horizon?.subject_id === query.subject_id, 'RNCS_QUERY_HORIZON_SUBJECT_MISMATCH');
    if (query.interest_graph !== null) check(verifyRealityInterestGraph(query.interest_graph).valid, 'RNCS_QUERY_INTEREST_GRAPH_INVALID');
    check(query.filters && typeof query.filters === 'object', 'RNCS_QUERY_FILTERS_INVALID');
    check(Array.isArray(query.permission_scope), 'RNCS_QUERY_PERMISSION_SCOPE_INVALID');
    check(Number.isSafeInteger(query.limit) && query.limit > 0, 'RNCS_QUERY_LIMIT_INVALID');
    check(typeof query.revalidate_canonical === 'boolean', 'RNCS_QUERY_REVALIDATION_FLAG_INVALID');
    check(query.candidate_only === true && query.authoritative === false, 'RNCS_QUERY_STATUS_INVALID');
    check(query.commit_status === 'NOT_COMMITTED', 'RNCS_QUERY_COMMIT_STATUS_INVALID');
    check(hex64(query.query_root), 'RNCS_QUERY_ROOT_INVALID');
    check(rootOf(query, 'query_root') === query.query_root, 'RNCS_QUERY_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_QUERY_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, query_root: query.query_root};
}

function numeric(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return Number(value);
  return null;
}

function indexedObject(object) {
  const value = record(object);
  const index = record(value.query_index ?? value.index ?? {});
  return {
    object_id: String(value.object_id ?? value.id ?? ''),
    object_root: value.object_root ?? null,
    position: index.position ?? value.position ?? null,
    semantic_tags: strings(index.semantic_tags ?? index.tags ?? value.semantic_tags ?? value.tags),
    state: record(index.state ?? value.state ?? {}),
    relations: Array.isArray(index.relations ?? value.relations) ? clone(index.relations ?? value.relations) : [],
    temporal: record(index.temporal ?? value.temporal ?? {}),
    authority_scope: strings(index.authority_scope ?? value.authority_scope),
    freshness: index.freshness ?? value.freshness ?? null,
    evidence_refs: strings(index.evidence_refs ?? value.evidence_refs),
    object: value
  };
}

function findProperty(object, propertyId) {
  const propertySet = record(object.property_set);
  for (const mapName of ['intrinsic_properties', 'dynamic_state', 'field_state', 'custom_properties']) {
    const entry = propertySet[mapName]?.[propertyId];
    if (entry) return entry;
  }
  const state = record(object.query_index ?? object.index ?? {}).state;
  return state[propertyId] === undefined ? null : {value_kind: 'symbolic', value: state[propertyId]};
}

function propertyComparable(entry) {
  if (!entry) return null;
  if (entry.value_kind === 'quantity' && entry.quantity) return entry.quantity;
  return entry.value;
}

function compareValue(left, operator, right, condition = {}) {
  const a = propertyComparable(left);
  const b = right && typeof right === 'object' && right.value !== undefined ? right : right;
  const leftIsQuantity = a && typeof a === 'object' && a.format === 'rncs.reality-quantity.v0.3';
  const rightIsQuantity = b && typeof b === 'object' && b.format === 'rncs.reality-quantity.v0.3';
  if (leftIsQuantity) {
    if (condition.dimension !== null && condition.dimension !== undefined && a.dimension !== condition.dimension) return false;
    if (condition.unit !== null && condition.unit !== undefined && a.unit !== condition.unit) return false;
    if (!rightIsQuantity && (condition.dimension === null || condition.dimension === undefined) && (condition.unit === null || condition.unit === undefined)) return false;
  }
  if (leftIsQuantity && rightIsQuantity && a.dimension !== b.dimension) return false;
  if (leftIsQuantity && rightIsQuantity && a.unit !== b.unit && ['<', '<=', '>', '>='].includes(operator)) return false;
  const an = numeric(a?.value ?? a);
  const bn = numeric(b?.value ?? b);
  if (operator === 'contains') return Array.isArray(a) ? a.includes(b) : String(a ?? '').includes(String(b ?? ''));
  if (operator === 'in') return Array.isArray(b) && b.includes(a?.value ?? a);
  if (operator === '==' || operator === '!=') {
    const equal = an !== null && bn !== null ? an === bn : String(a?.value ?? a) === String(b?.value ?? b);
    return operator === '==' ? equal : !equal;
  }
  if (an === null || bn === null) return false;
  if (operator === '<') return an < bn;
  if (operator === '<=') return an <= bn;
  if (operator === '>') return an > bn;
  if (operator === '>=') return an >= bn;
  return false;
}

function relationMatch(index, condition) {
  return index.relations.some(raw => {
    const relation = record(raw);
    if (String(relation.type ?? relation.relation ?? '') !== condition.type) return false;
    if (condition.from !== null && String(relation.from ?? relation.subject_id ?? '') !== condition.from) return false;
    if (condition.to !== null && String(relation.to ?? relation.object_id ?? '') !== condition.to) return false;
    return true;
  });
}

function overlap(temporal, filter) {
  if (!filter) return true;
  const from = numeric(temporal.from ?? temporal.start);
  const to = numeric(temporal.to ?? temporal.end);
  const filterFrom = numeric(filter.from);
  const filterTo = numeric(filter.to);
  if (filterFrom !== null && to !== null && to < filterFrom) return false;
  if (filterTo !== null && from !== null && from > filterTo) return false;
  return true;
}

function distanceSquared(a, b) {
  if (!a || !b) return null;
  const ax = numeric(a.x); const ay = numeric(a.y); const az = numeric(a.z);
  const bx = numeric(b.x); const by = numeric(b.y); const bz = numeric(b.z);
  if ([ax, ay, az, bx, by, bz].some(value => value === null)) return null;
  return (ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2;
}

function fixedDecimal(value) {
  if (!Number.isFinite(value)) return null;
  return String(Math.round(value * 1000000) / 1000000);
}

function scoreMicros(value) {
  return Math.max(0, Math.round(value * 1000000));
}

function interestScore(graph, objectId) {
  if (!graph) return {score: 0, required: false, reasons: []};
  const node = graph.nodes.find(candidate => candidate.object_id === objectId);
  if (!node) return {score: 0, required: false, reasons: []};
  const score = REALITY_INTEREST_EDGE_TYPES.reduce((sum, type) => sum + (numeric(node.weights[type]) ?? 0), 0);
  return {score, required: node.required === true, reasons: [...node.reasons]};
}

function permissionAllowed(query, index) {
  const required = index.authority_scope;
  if (required.length === 0 || required.includes('public')) return true;
  if (query.permission_scope.length === 0) return false;
  return required.some(scope => query.permission_scope.includes(scope));
}

function horizonAllowed(query, index) {
  const semantic = query.horizon.axes.semantic;
  if (semantic.tags.length > 0 && !semantic.tags.some(tag => index.semantic_tags.includes(tag))) return false;
  const spatial = query.filters.spatial;
  const origin = spatial?.origin ?? null;
  const radius = spatial?.radius !== null && spatial?.radius !== undefined
    ? numeric(spatial.radius)
    : numeric(query.horizon.axes.spatial.radius ?? query.horizon.axes.visual.radius);
  const distance = distanceSquared(origin, index.position);
  if (origin && radius !== null && distance === null) return false;
  if (origin && radius !== null && distance > radius * radius) return false;
  return true;
}

function queryMatch(query, index) {
  if (!permissionAllowed(query, index)) return {matched: false, reason: 'PERMISSION_FILTERED'};
  if (!horizonAllowed(query, index)) return {matched: false, reason: 'HORIZON_FILTERED'};
  const filters = query.filters;
  const semantic = filters.semantic;
  if (semantic.tags.length > 0) {
    const count = semantic.tags.filter(tag => index.semantic_tags.includes(tag)).length;
    if (semantic.mode === 'all' ? count !== semantic.tags.length : count === 0) return {matched: false, reason: 'SEMANTIC_FILTERED'};
  }
  if (filters.spatial) {
    const distance = distanceSquared(filters.spatial.origin, index.position);
    const radius = numeric(filters.spatial.radius);
    if (radius !== null && (distance === null || distance > radius * radius)) return {matched: false, reason: 'SPATIAL_FILTERED'};
  }
  if (!filters.state.every(condition => compareValue(findProperty(index.object, condition.property_id), condition.operator, condition.value, condition))) return {matched: false, reason: 'STATE_FILTERED'};
  if (!filters.relations.every(condition => relationMatch(index, condition))) return {matched: false, reason: 'RELATION_FILTERED'};
  if (!overlap(index.temporal, filters.temporal)) return {matched: false, reason: 'TEMPORAL_FILTERED'};
  return {matched: true, reason: null};
}

export function evaluateRealityQuery(query, objects = []) {
  const verification = verifyRealityQuery(query);
  fail(verification.valid, `RNCS_QUERY_INVALID:${verification.errors.join(',')}`);
  const candidates = [];
  const omitted = [];
  for (const object of Array.isArray(objects) ? objects : []) {
    const index = indexedObject(object);
    if (!index.object_id) continue;
    const match = queryMatch(query, index);
    if (!match.matched) {
      omitted.push({object_id: index.object_id, reason: match.reason});
      continue;
    }
    const interest = interestScore(query.interest_graph, index.object_id);
    const distance = distanceSquared(query.filters.spatial?.origin ?? null, index.position);
    const semanticMatches = query.filters.semantic.tags.filter(tag => index.semantic_tags.includes(tag)).length;
    const proximity = distance === null ? 0 : 1 / (1 + distance);
    const score = interest.score + semanticMatches * 10 + proximity;
    candidates.push({
      object_id: index.object_id,
      object_root: index.object_root,
      property_root: index.object.property_root ?? null,
      law_bindings_root: index.object.law_bindings_root ?? null,
      score: fixedDecimal(score),
      score_micros: scoreMicros(score),
      required: interest.required,
      reasons: [...interest.reasons],
      semantic_matches: semanticMatches,
      distance: fixedDecimal(distance),
      freshness: index.freshness,
      evidence_refs: index.evidence_refs
    });
  }
  candidates.sort((a, b) => b.score_micros - a.score_micros || keySort(a.object_id, b.object_id));
  const selected = candidates.slice(0, query.limit).map((candidate, index) => ({rank: index + 1, ...candidate}));
  const base = {
    format: 'rncs.reality-query-result.v0.3',
    version: REALITY_ACCESS_VERSION,
    query_id: query.query_id,
    query_root: query.query_root,
    subject_id: query.subject_id,
    selected,
    omitted: omitted.sort((a, b) => keySort(a.object_id, b.object_id)),
    canonical_revalidation_required: query.revalidate_canonical,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, result_root: rootHash(base)};
}

export function verifyRealityQueryResult(result) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!result || typeof result !== 'object') return {valid: false, errors: ['RNCS_QUERY_RESULT_NOT_OBJECT']};
  try {
    check(result.format === 'rncs.reality-query-result.v0.3', 'RNCS_QUERY_RESULT_FORMAT_INVALID');
    check(result.version === REALITY_ACCESS_VERSION, 'RNCS_QUERY_RESULT_VERSION_INVALID');
    check(hex64(result.query_root), 'RNCS_QUERY_RESULT_QUERY_ROOT_INVALID');
    check(Array.isArray(result.selected) && Array.isArray(result.omitted), 'RNCS_QUERY_RESULT_ROWS_INVALID');
    check(result.candidate_only === true && result.authoritative === false, 'RNCS_QUERY_RESULT_STATUS_INVALID');
    check(result.commit_status === 'NOT_COMMITTED', 'RNCS_QUERY_RESULT_COMMIT_STATUS_INVALID');
    check(hex64(result.result_root), 'RNCS_QUERY_RESULT_ROOT_INVALID');
    check(rootOf(result, 'result_root') === result.result_root, 'RNCS_QUERY_RESULT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_QUERY_RESULT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, result_root: result.result_root};
}

export function createCognitiveWorkingSet(input = {}) {
  const value = record(input);
  const queryResult = value.query_result ?? value.queryResult;
  const resultVerification = verifyRealityQueryResult(queryResult);
  fail(resultVerification.valid, `RNCS_QUERY_RESULT_INVALID:${resultVerification.errors.join(',')}`);
  const capacity = Number(value.capacity ?? value.max_objects ?? value.maxObjects ?? queryResult.selected.length);
  fail(Number.isSafeInteger(capacity) && capacity > 0, 'RNCS_COGNITIVE_CAPACITY_INVALID');
  const objects = queryResult.selected.slice(0, capacity).map(clone);
  const base = {
    format: REALITY_COGNITIVE_WORKING_SET_FORMAT,
    version: REALITY_ACCESS_VERSION,
    subject_id: String(value.subject_id ?? queryResult.subject_id),
    source_query_root: queryResult.query_root,
    capacity,
    objects,
    truncated: queryResult.selected.length > objects.length,
    canonical_revalidation_required: true,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, working_set_root: rootHash(base)};
}

export function verifyCognitiveWorkingSet(workingSet) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!workingSet || typeof workingSet !== 'object') return {valid: false, errors: ['RNCS_COGNITIVE_WORKING_SET_NOT_OBJECT']};
  try {
    check(workingSet.format === REALITY_COGNITIVE_WORKING_SET_FORMAT, 'RNCS_COGNITIVE_WORKING_SET_FORMAT_INVALID');
    check(workingSet.version === REALITY_ACCESS_VERSION, 'RNCS_COGNITIVE_WORKING_SET_VERSION_INVALID');
    check(typeof workingSet.subject_id === 'string' && workingSet.subject_id.length > 0, 'RNCS_COGNITIVE_SUBJECT_ID_REQUIRED');
    check(hex64(workingSet.source_query_root), 'RNCS_COGNITIVE_QUERY_ROOT_INVALID');
    check(Number.isSafeInteger(workingSet.capacity) && workingSet.capacity > 0, 'RNCS_COGNITIVE_CAPACITY_INVALID');
    check(Array.isArray(workingSet.objects) && workingSet.objects.length <= workingSet.capacity, 'RNCS_COGNITIVE_OBJECT_CAPACITY_INVALID');
    check(workingSet.canonical_revalidation_required === true, 'RNCS_COGNITIVE_REVALIDATION_REQUIRED');
    check(workingSet.candidate_only === true && workingSet.authoritative === false, 'RNCS_COGNITIVE_STATUS_INVALID');
    check(workingSet.commit_status === 'NOT_COMMITTED', 'RNCS_COGNITIVE_COMMIT_STATUS_INVALID');
    check(hex64(workingSet.working_set_root), 'RNCS_COGNITIVE_ROOT_INVALID');
    check(rootOf(workingSet, 'working_set_root') === workingSet.working_set_root, 'RNCS_COGNITIVE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_COGNITIVE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, working_set_root: workingSet.working_set_root};
}
