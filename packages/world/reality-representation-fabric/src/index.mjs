import {
  createCognitiveWorkingSet,
  createRealityDetailVector,
  createRealityHorizon,
  createRealityInterestGraph,
  createRealityQuery,
  REALITY_DETAIL_VECTOR_FORMAT,
  REALITY_HORIZON_FORMAT,
  REALITY_INTEREST_GRAPH_FORMAT,
  REALITY_QUERY_FORMAT,
  createRealityLawBindings,
  createRealityPropertySet,
  createRealityPropertyTransitionCandidate,
  evaluateRealityQuery,
  queryRealityLaw,
  queryRealityProperty,
  listRealityProperties,
  verifyCognitiveWorkingSet,
  verifyRealityDetailVector,
  verifyRealityHorizon,
  verifyRealityInterestGraph,
  verifyRealityQuery,
  verifyRealityQueryResult,
  REALITY_LAW_BINDINGS_FORMAT,
  REALITY_PROPERTY_SET_FORMAT,
  REALITY_PROPERTY_TRANSITION_FORMAT,
  verifyRealityLawBindings,
  verifyRealityPropertySet,
  verifyRealityPropertyTransition,
  applyRepresentationTransition,
  createRepresentationTransitionCandidate,
  rootHash,
  rollbackRepresentationTransition,
  verifyRepresentationRef,
  verifyRepresentationTransition
} from '@taowind/rncs-core-contract';

export const URRF_RUNTIME_FORMAT = 'urrf.reality-representation-runtime.v0.1';
export const URRF_RUNTIME_VERSION = '0.1.0';
export const URRF_REALITY_OBJECT_FORMAT = 'urrf.reality-object.v0.1';
export const URRF_MATERIALIZATION_PLAN_FORMAT = 'urrf.materialization-plan.v0.1';
export const URRF_MATERIALIZATION_RECEIPT_FORMAT = 'urrf.materialization-receipt.v0.1';
export const URRF_PROPERTY_SET_FORMAT = REALITY_PROPERTY_SET_FORMAT;
export const URRF_LAW_BINDINGS_FORMAT = REALITY_LAW_BINDINGS_FORMAT;
export const URRF_PROPERTY_TRANSITION_FORMAT = REALITY_PROPERTY_TRANSITION_FORMAT;
export const URRF_DETAIL_VECTOR_FORMAT = REALITY_DETAIL_VECTOR_FORMAT;
export const URRF_HORIZON_FORMAT = REALITY_HORIZON_FORMAT;
export const URRF_INTEREST_GRAPH_FORMAT = REALITY_INTEREST_GRAPH_FORMAT;
export const URRF_QUERY_FORMAT = REALITY_QUERY_FORMAT;
export const URRF_MATERIALIZATION_STATUSES = Object.freeze(['EXECUTED', 'NOT_EXECUTED', 'FAILED']);

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const strings = value => [...new Set((Array.isArray(value) ? value : []).map(String).filter(Boolean))].sort((a, b) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8')));
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new Error(code); };
const without = (value, field) => Object.fromEntries(Object.entries(value).filter(([key]) => key !== field));
const rootOf = (value, field) => rootHash(without(value, field));

function normalizePropertySet(input, objectId) {
  const value = record(input);
  const propertySet = value.property_root
    ? clone(value)
    : createRealityPropertySet({...value, object_id: objectId});
  fail(propertySet.object_id === objectId, 'URRF_OBJECT_PROPERTY_SET_OBJECT_ID_MISMATCH');
  const verification = verifyRealityPropertySet(propertySet);
  fail(verification.valid, `URRF_OBJECT_PROPERTY_SET_INVALID:${verification.errors.join(',')}`);
  return propertySet;
}

function normalizeLawBindings(input, objectId) {
  const value = record(input);
  const bindings = value.bindings_root
    ? clone(value)
    : createRealityLawBindings({...value, object_id: objectId});
  fail(bindings.object_id === objectId, 'URRF_OBJECT_LAW_BINDINGS_OBJECT_ID_MISMATCH');
  const verification = verifyRealityLawBindings(bindings);
  fail(verification.valid, `URRF_OBJECT_LAW_BINDINGS_INVALID:${verification.errors.join(',')}`);
  return bindings;
}

function normalizeDetailVector(input) {
  const value = record(input);
  const vector = value.vector_root ? clone(value) : createRealityDetailVector(value);
  const verification = verifyRealityDetailVector(vector);
  fail(verification.valid, `URRF_DETAIL_VECTOR_INVALID:${verification.errors.join(',')}`);
  return vector;
}

function normalizeHorizon(input) {
  const value = record(input);
  const horizon = value.horizon_root ? clone(value) : createRealityHorizon(value);
  const verification = verifyRealityHorizon(horizon);
  fail(verification.valid, `URRF_HORIZON_INVALID:${verification.errors.join(',')}`);
  return horizon;
}

function normalizeInterestGraph(input) {
  if (input === null || input === undefined) return null;
  const value = record(input);
  const graph = value.graph_root ? clone(value) : createRealityInterestGraph(value);
  const verification = verifyRealityInterestGraph(graph);
  fail(verification.valid, `URRF_INTEREST_GRAPH_INVALID:${verification.errors.join(',')}`);
  return graph;
}

function normalizeQuery(input) {
  const value = record(input);
  const query = value.query_root ? clone(value) : createRealityQuery(value);
  const verification = verifyRealityQuery(query);
  fail(verification.valid, `URRF_QUERY_INVALID:${verification.errors.join(',')}`);
  return query;
}

function providerKinds(manifest) {
  const representation = record(manifest.representation);
  return strings(representation.kinds ?? representation.representation_kinds);
}

function providerProfiles(manifest) {
  const representation = record(manifest.representation);
  return (Array.isArray(representation.profiles) ? representation.profiles : [])
    .map(profile => String(record(profile).profile_id ?? ''))
    .filter(Boolean)
    .sort((a, b) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8')));
}

function providerScope(manifest) {
  const authority = record(manifest.authority);
  const representation = record(manifest.representation);
  return strings(authority.scope ?? manifest.authority_scope ?? representation.authority_scope);
}

function normalizeProvider(input = {}) {
  const value = record(input);
  const manifest = clone(record(value.manifest).id ? value.manifest : value);
  const provider_id = String(manifest.id ?? manifest.provider_id ?? '');
  const provider_root = String(manifest.manifest_root ?? manifest.provider_root ?? '');
  const runtime_status = String(manifest.runtimeStatus ?? manifest.runtime_status ?? 'CONTRACT_ONLY');
  const representation_kinds = providerKinds(manifest);
  const authority = record(manifest.authority);
  const owns_authoritative_world_state = authority.owns_authoritative_world_state ?? manifest.owns_authoritative_world_state ?? false;
  const materialize = value.materialize ?? value.executor ?? value.runtime ?? null;
  fail(provider_id, 'URRF_PROVIDER_ID_REQUIRED');
  fail(hex64(provider_root), 'URRF_PROVIDER_ROOT_INVALID');
  fail(representation_kinds.length > 0, 'URRF_PROVIDER_REPRESENTATION_KINDS_REQUIRED');
  fail(owns_authoritative_world_state !== true, 'URRF_PROVIDER_AUTHORITY_ESCALATION');
  fail(materialize === null || typeof materialize === 'function', 'URRF_PROVIDER_ADAPTER_INVALID');
  return {
    provider_id,
    provider_root,
    runtime_status,
    representation_kinds,
    profile_ids: providerProfiles(manifest),
    capabilities: strings(manifest.capabilities),
    authority: {
      owns_authoritative_world_state: false,
      scope: providerScope(manifest),
      provider_can_write_authoritative_world_state: false,
      rncs_authority_required: true
    },
    manifest,
    materialize
  };
}

function publicProvider(provider) {
  return {
    provider_id: provider.provider_id,
    provider_root: provider.provider_root,
    runtime_status: provider.runtime_status,
    representation_kinds: [...provider.representation_kinds],
    profile_ids: [...provider.profile_ids],
    capabilities: [...provider.capabilities],
    authority: clone(provider.authority),
    adapter_registered: typeof provider.materialize === 'function'
  };
}

function representationFor(object, selector) {
  const value = record(selector);
  const representation_id = value.representation_id ?? value.id ?? null;
  const representation_root = value.representation_root ?? value.root ?? null;
  const found = object.representations.find(reference =>
    (representation_id && reference.representation_id === representation_id) ||
    (representation_root && reference.representation_root === representation_root)
  );
  return found ?? null;
}

function availabilityRank(reference, provider) {
  if (typeof provider?.materialize === 'function') return 5;
  return ({EXECUTED: 4, AVAILABLE: 3, CONFIGURED: 2, CONTRACT_ONLY: 1, UNAVAILABLE: 0})[reference.availability] ?? 0;
}

function candidateScore(reference, provider, request) {
  const profileId = reference.representation_profile?.profile_id;
  return [
    request.representation_id && request.representation_id === reference.representation_id ? 1 : 0,
    request.preferred_provider_id && request.preferred_provider_id === reference.provider_id ? 1 : 0,
    request.profile_id && request.profile_id === profileId ? 1 : 0,
    request.detail_mode && request.detail_mode === reference.detail_policy?.mode ? 1 : 0,
    request.residency_mode && request.residency_mode === reference.residency_policy?.mode ? 1 : 0,
    request.format && reference.representation_formats.includes(request.format) ? 1 : 0,
    availabilityRank(reference, provider)
  ];
}

function compareScore(a, b) {
  for (let index = 0; index < a.score.length; index++) {
    if (a.score[index] !== b.score[index]) return b.score[index] - a.score[index];
  }
  return Buffer.compare(Buffer.from(a.reference.representation_id, 'utf8'), Buffer.from(b.reference.representation_id, 'utf8'));
}

function normalizeEquivalence(input, object, source, target) {
  const value = record(input);
  const identityEvidence = rootHash({object_id: object.object_id, state_root: object.state_root, content_root: object.content_root});
  const authorityEvidence = rootHash({
    source: source.authority,
    target: target.authority,
    provider_can_write_authoritative_world_state: false
  });
  return {
    identity: value.identity ?? {status: 'PASS', evidence_root: identityEvidence},
    authority: value.authority ?? {status: 'PASS', evidence_root: authorityEvidence},
    constraint: value.constraint ?? 'UNKNOWN',
    semantic: value.semantic ?? 'UNKNOWN',
    spatial: value.spatial ?? 'UNKNOWN',
    perceptual: value.perceptual ?? 'NOT_RUN',
    behavioral: value.behavioral ?? 'NOT_RUN',
    temporal: value.temporal ?? 'NOT_RUN',
    task: value.task ?? 'NOT_RUN'
  };
}

function assertReference(reference, provider) {
  const verification = verifyRepresentationRef(reference);
  fail(verification.valid, `URRF_REPRESENTATION_REF_INVALID:${verification.errors.join(',')}`);
  fail(reference.provider_id === provider.provider_id, 'URRF_REPRESENTATION_PROVIDER_ID_MISMATCH');
  fail(reference.provider_root === provider.provider_root, 'URRF_REPRESENTATION_PROVIDER_ROOT_MISMATCH');
  fail(provider.representation_kinds.includes(reference.representation_kind), 'URRF_REPRESENTATION_KIND_UNSUPPORTED');
}

function publicObject(object, activeRoot) {
  return {
    ...clone(object),
    active_representation_root: activeRoot
  };
}

export function verifyMaterializationPlan(plan) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!plan || typeof plan !== 'object') return {valid: false, errors: ['URRF_PLAN_NOT_OBJECT']};
  try {
    check(plan.format === URRF_MATERIALIZATION_PLAN_FORMAT, 'URRF_PLAN_FORMAT_INVALID');
    check(plan.version === URRF_RUNTIME_VERSION, 'URRF_PLAN_VERSION_INVALID');
    check(typeof plan.plan_id === 'string' && plan.plan_id.length > 0, 'URRF_PLAN_ID_REQUIRED');
    check(typeof plan.object_id === 'string' && plan.object_id.length > 0, 'URRF_PLAN_OBJECT_ID_REQUIRED');
    check(hex64(plan.state_root), 'URRF_PLAN_STATE_ROOT_INVALID');
    check(hex64(plan.content_root), 'URRF_PLAN_CONTENT_ROOT_INVALID');
    if (plan.detail_vector !== undefined) {
      check(verifyRealityDetailVector(plan.detail_vector).valid, 'URRF_PLAN_DETAIL_VECTOR_INVALID');
      check(plan.detail_vector_root === plan.detail_vector?.vector_root, 'URRF_PLAN_DETAIL_VECTOR_ROOT_MISMATCH');
    } else if (plan.detail_vector_root !== undefined) {
      check(hex64(plan.detail_vector_root), 'URRF_PLAN_DETAIL_VECTOR_ROOT_INVALID');
    }
    if (plan.property_set !== undefined) {
      check(verifyRealityPropertySet(plan.property_set).valid, 'URRF_PLAN_PROPERTY_SET_INVALID');
      check(plan.property_root === plan.property_set?.property_root, 'URRF_PLAN_PROPERTY_ROOT_MISMATCH');
    } else if (plan.property_root !== undefined) {
      check(hex64(plan.property_root), 'URRF_PLAN_PROPERTY_ROOT_INVALID');
    }
    if (plan.law_bindings !== undefined) {
      check(verifyRealityLawBindings(plan.law_bindings).valid, 'URRF_PLAN_LAW_BINDINGS_INVALID');
      check(plan.law_bindings_root === plan.law_bindings?.bindings_root, 'URRF_PLAN_LAW_BINDINGS_ROOT_MISMATCH');
    } else if (plan.law_bindings_root !== undefined) {
      check(hex64(plan.law_bindings_root), 'URRF_PLAN_LAW_BINDINGS_ROOT_INVALID');
    }
    check(verifyRepresentationRef(plan.representation).valid, 'URRF_PLAN_REPRESENTATION_INVALID');
    check(plan.representation?.representation_root === plan.representation_root, 'URRF_PLAN_REPRESENTATION_ROOT_MISMATCH');
    check(plan.provider_id === plan.representation?.provider_id, 'URRF_PLAN_PROVIDER_ID_MISMATCH');
    check(plan.provider_root === plan.representation?.provider_root, 'URRF_PLAN_PROVIDER_ROOT_MISMATCH');
    check(plan.authority?.provider_can_write_authoritative_world_state === false, 'URRF_PLAN_AUTHORITY_ESCALATION');
    if (plan.authority?.provider_can_write_canonical_property !== undefined) check(plan.authority.provider_can_write_canonical_property === false, 'URRF_PLAN_PROPERTY_AUTHORITY_ESCALATION');
    if (plan.authority?.provider_can_write_canonical_law !== undefined) check(plan.authority.provider_can_write_canonical_law === false, 'URRF_PLAN_LAW_AUTHORITY_ESCALATION');
    check(plan.authority?.rncs_authority_required === true, 'URRF_PLAN_RNCS_AUTHORITY_REQUIRED');
    if (plan.resource_decision?.detail_vector_root !== undefined) check(plan.resource_decision.detail_vector_root === plan.detail_vector_root, 'URRF_PLAN_RESOURCE_DETAIL_VECTOR_ROOT_MISMATCH');
    check(plan.candidate_only === true, 'URRF_PLAN_MUST_BE_CANDIDATE_ONLY');
    check(plan.authoritative === false, 'URRF_PLAN_CANNOT_BE_AUTHORITATIVE');
    check(plan.commit_status === 'NOT_COMMITTED', 'URRF_PLAN_COMMIT_STATUS_INVALID');
    check(hex64(plan.plan_root), 'URRF_PLAN_ROOT_INVALID');
    check(rootOf(plan, 'plan_root') === plan.plan_root, 'URRF_PLAN_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`URRF_PLAN_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, plan_root: plan.plan_root};
}

export function verifyMaterializationReceipt(receipt) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!receipt || typeof receipt !== 'object') return {valid: false, errors: ['URRF_RECEIPT_NOT_OBJECT']};
  try {
    check(receipt.format === URRF_MATERIALIZATION_RECEIPT_FORMAT, 'URRF_RECEIPT_FORMAT_INVALID');
    check(receipt.version === URRF_RUNTIME_VERSION, 'URRF_RECEIPT_VERSION_INVALID');
    check(typeof receipt.receipt_id === 'string' && receipt.receipt_id.length > 0, 'URRF_RECEIPT_ID_REQUIRED');
    check(URRF_MATERIALIZATION_STATUSES.includes(receipt.status), 'URRF_RECEIPT_STATUS_INVALID');
    check(hex64(receipt.state_root), 'URRF_RECEIPT_STATE_ROOT_INVALID');
    check(hex64(receipt.content_root), 'URRF_RECEIPT_CONTENT_ROOT_INVALID');
    check(hex64(receipt.representation_root), 'URRF_RECEIPT_REPRESENTATION_ROOT_INVALID');
    check(hex64(receipt.provider_root), 'URRF_RECEIPT_PROVIDER_ROOT_INVALID');
    if (receipt.detail_vector !== undefined) {
      check(verifyRealityDetailVector(receipt.detail_vector).valid, 'URRF_RECEIPT_DETAIL_VECTOR_INVALID');
      check(receipt.detail_vector_root === receipt.detail_vector?.vector_root, 'URRF_RECEIPT_DETAIL_VECTOR_ROOT_MISMATCH');
    } else if (receipt.detail_vector_root !== undefined) {
      check(hex64(receipt.detail_vector_root), 'URRF_RECEIPT_DETAIL_VECTOR_ROOT_INVALID');
    }
    if (receipt.property_root !== undefined) check(hex64(receipt.property_root), 'URRF_RECEIPT_PROPERTY_ROOT_INVALID');
    if (receipt.law_bindings_root !== undefined) check(hex64(receipt.law_bindings_root), 'URRF_RECEIPT_LAW_BINDINGS_ROOT_INVALID');
    check(receipt.authority?.provider_can_write_authoritative_world_state === false, 'URRF_RECEIPT_AUTHORITY_ESCALATION');
    if (receipt.authority?.provider_can_write_canonical_property !== undefined) check(receipt.authority.provider_can_write_canonical_property === false, 'URRF_RECEIPT_PROPERTY_AUTHORITY_ESCALATION');
    if (receipt.authority?.provider_can_write_canonical_law !== undefined) check(receipt.authority.provider_can_write_canonical_law === false, 'URRF_RECEIPT_LAW_AUTHORITY_ESCALATION');
    check(receipt.authority?.rncs_authority_required === true, 'URRF_RECEIPT_RNCS_AUTHORITY_REQUIRED');
    check(receipt.canonical_state_mutated === false, 'URRF_RECEIPT_CANONICAL_MUTATION');
    check(receipt.candidate_only === true, 'URRF_RECEIPT_MUST_BE_CANDIDATE_ONLY');
    check(receipt.authoritative === false, 'URRF_RECEIPT_CANNOT_BE_AUTHORITATIVE');
    check(receipt.commit_status === 'NOT_COMMITTED', 'URRF_RECEIPT_COMMIT_STATUS_INVALID');
    if (receipt.status === 'EXECUTED') check(hex64(receipt.output_root), 'URRF_RECEIPT_OUTPUT_ROOT_INVALID');
    check(hex64(receipt.receipt_root), 'URRF_RECEIPT_ROOT_INVALID');
    check(rootOf(receipt, 'receipt_root') === receipt.receipt_root, 'URRF_RECEIPT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`URRF_RECEIPT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root};
}

export function verifyFabricSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !hex64(snapshot.fabric_root)) return false;
  return rootOf(snapshot, 'fabric_root') === snapshot.fabric_root;
}

export function verifyRealityObject(object) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!object || typeof object !== 'object') return {valid: false, errors: ['URRF_OBJECT_NOT_OBJECT']};
  try {
    check(object.format === URRF_REALITY_OBJECT_FORMAT, 'URRF_OBJECT_FORMAT_INVALID');
    check(object.version === URRF_RUNTIME_VERSION, 'URRF_OBJECT_VERSION_INVALID');
    check(typeof object.object_id === 'string' && object.object_id.length > 0, 'URRF_OBJECT_ID_REQUIRED');
    check(typeof object.branch === 'string' && object.branch.length > 0, 'URRF_OBJECT_BRANCH_REQUIRED');
    check(hex64(object.state_root), 'URRF_OBJECT_STATE_ROOT_INVALID');
    check(hex64(object.content_root), 'URRF_OBJECT_CONTENT_ROOT_INVALID');
    check(Array.isArray(object.representations) && object.representations.length > 0, 'URRF_OBJECT_REPRESENTATIONS_REQUIRED');
    for (const reference of object.representations ?? []) {
      check(verifyRepresentationRef(reference).valid, 'URRF_OBJECT_REPRESENTATION_INVALID');
      check(reference.content_root === object.content_root, 'URRF_OBJECT_CONTENT_ROOT_MISMATCH');
    }
    check(verifyRealityPropertySet(object.property_set).valid, 'URRF_OBJECT_PROPERTY_SET_INVALID');
    check(verifyRealityLawBindings(object.law_bindings).valid, 'URRF_OBJECT_LAW_BINDINGS_INVALID');
    check(object.property_set?.object_id === object.object_id, 'URRF_OBJECT_PROPERTY_SET_OBJECT_ID_MISMATCH');
    check(object.law_bindings?.object_id === object.object_id, 'URRF_OBJECT_LAW_BINDINGS_OBJECT_ID_MISMATCH');
    check(object.property_root === object.property_set?.property_root, 'URRF_OBJECT_PROPERTY_ROOT_MISMATCH');
    check(object.law_bindings_root === object.law_bindings?.bindings_root, 'URRF_OBJECT_LAW_BINDINGS_ROOT_MISMATCH');
    if (object.query_index !== null && object.query_index !== undefined) {
      check(hex64(object.query_index_root), 'URRF_OBJECT_QUERY_INDEX_ROOT_INVALID');
      check(rootHash(object.query_index) === object.query_index_root, 'URRF_OBJECT_QUERY_INDEX_ROOT_MISMATCH');
    } else check(object.query_index_root === null, 'URRF_OBJECT_QUERY_INDEX_NULL_ROOT_INVALID');
    check(object.canonical_owner === 'RNCS', 'URRF_OBJECT_CANONICAL_OWNER_INVALID');
    check(object.representation_owner === 'URRF', 'URRF_OBJECT_REPRESENTATION_OWNER_INVALID');
    check(object.authority?.provider_can_write_authoritative_world_state === false, 'URRF_OBJECT_AUTHORITY_ESCALATION');
    check(object.authority?.rncs_authority_required === true, 'URRF_OBJECT_RNCS_AUTHORITY_REQUIRED');
    check(object.candidate_only === true && object.authoritative === false && object.commit_status === 'NOT_COMMITTED', 'URRF_OBJECT_STATUS_INVALID');
    const base = Object.fromEntries(Object.entries(object).filter(([key]) => !['object_root', 'active_representation_root'].includes(key)));
    check(hex64(object.object_root), 'URRF_OBJECT_ROOT_INVALID');
    check(rootHash(base) === object.object_root, 'URRF_OBJECT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`URRF_OBJECT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, object_root: object.object_root};
}

export class RealityRepresentationFabric {
  constructor({providers = [], objects = []} = {}) {
    this.providers = new Map();
    this.objects = new Map();
    this.activeRoots = new Map();
    this.transitions = new Map();
    this.propertyTransitions = new Map();
    for (const provider of providers) this.registerProvider(provider);
    for (const object of objects) this.registerRealityObject(object);
  }

  registerProvider(input) {
    const provider = normalizeProvider(input);
    const existing = this.providers.get(provider.provider_id);
    if (existing) {
      fail(existing.provider_root === provider.provider_root, 'URRF_PROVIDER_ROOT_CONFLICT');
      if (!existing.materialize && provider.materialize) existing.materialize = provider.materialize;
      return publicProvider(existing);
    }
    this.providers.set(provider.provider_id, provider);
    return publicProvider(provider);
  }

  getProvider(providerId) {
    const provider = this.providers.get(String(providerId));
    return provider ? publicProvider(provider) : null;
  }

  registerRealityObject(input = {}) {
    const value = record(input);
    const object_id = String(value.object_id ?? value.id ?? '');
    const branch = String(value.branch ?? 'main');
    const state_root = String(value.state_root ?? '');
    const rawReferences = value.representations ?? value.representation_refs ?? [];
    const references = Array.isArray(rawReferences) ? rawReferences.map(clone) : [];
    fail(object_id, 'URRF_OBJECT_ID_REQUIRED');
    fail(hex64(state_root), 'URRF_OBJECT_STATE_ROOT_INVALID');
    fail(references.length > 0, 'URRF_OBJECT_REPRESENTATIONS_REQUIRED');
    const providers = references.map(reference => {
      const provider = this.providers.get(reference.provider_id);
      fail(provider, `URRF_OBJECT_PROVIDER_NOT_REGISTERED:${reference.provider_id}`);
      assertReference(reference, provider);
      return provider;
    });
    const content_root = String(value.content_root ?? references[0].content_root);
    fail(hex64(content_root), 'URRF_OBJECT_CONTENT_ROOT_INVALID');
    fail(references.every(reference => reference.content_root === content_root), 'URRF_OBJECT_CONTENT_ROOT_MISMATCH');
    const property_set = normalizePropertySet(value.property_set ?? value.propertySet, object_id);
    const law_bindings = normalizeLawBindings(value.law_bindings ?? value.lawBindings, object_id);
    const rawQueryIndex = value.query_index ?? value.queryIndex ?? value.index;
    const query_index = rawQueryIndex === undefined ? null : clone(rawQueryIndex);
    const query_index_root = query_index === null ? null : rootHash(query_index);
    const representationIds = new Set();
    for (const reference of references) {
      fail(!representationIds.has(reference.representation_id), 'URRF_OBJECT_DUPLICATE_REPRESENTATION_ID');
      representationIds.add(reference.representation_id);
    }
    const sortedReferences = references.sort((a, b) => Buffer.compare(Buffer.from(a.representation_id, 'utf8'), Buffer.from(b.representation_id, 'utf8')));
    const base = {
      format: URRF_REALITY_OBJECT_FORMAT,
      version: URRF_RUNTIME_VERSION,
      object_id,
      branch,
      state_root,
      content_root,
      representations: sortedReferences,
      property_set,
      property_root: property_set.property_root,
      law_bindings,
      law_bindings_root: law_bindings.bindings_root,
      query_index,
      query_index_root,
      canonical_owner: 'RNCS',
      representation_owner: 'URRF',
      authority: {
        provider_can_write_authoritative_world_state: false,
        rncs_authority_required: true
      },
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    };
    const object = {...base, object_root: rootHash(base)};
    const existing = this.objects.get(object_id);
    if (existing) {
      fail(existing.object_root === object.object_root, 'URRF_OBJECT_ROOT_CONFLICT');
      return publicObject(existing, this.activeRoots.get(object_id));
    }
    const requestedActive = value.active_representation_root ?? value.active_representation_id;
    const activeReference = requestedActive
      ? representationFor(object, typeof requestedActive === 'string' ? {representation_root: requestedActive, representation_id: requestedActive} : requestedActive)
      : sortedReferences[0];
    fail(activeReference, 'URRF_OBJECT_ACTIVE_REPRESENTATION_NOT_FOUND');
    this.objects.set(object_id, object);
    this.activeRoots.set(object_id, activeReference.representation_root);
    return publicObject(object, activeReference.representation_root);
  }

  getRealityObject(objectId) {
    const object = this.objects.get(String(objectId));
    return object ? publicObject(object, this.activeRoots.get(object.object_id)) : null;
  }

  listRealityObjects() {
    return [...this.objects.keys()].sort((a, b) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))).map(id => this.getRealityObject(id));
  }

  selectRepresentation(input = {}) {
    const request = record(input);
    const object_id = String(request.object_id ?? request.id ?? '');
    const object = this.objects.get(object_id);
    fail(object, `URRF_OBJECT_NOT_REGISTERED:${object_id}`);
    const candidates = object.representations
      .map(reference => ({reference, provider: this.providers.get(reference.provider_id)}))
      .filter(({reference}) => reference.availability !== 'UNAVAILABLE')
      .filter(({reference}) => !request.representation_id || reference.representation_id === request.representation_id)
      .filter(({reference}) => !request.representation_kind || reference.representation_kind === request.representation_kind)
      .filter(({reference}) => !request.profile_id || reference.representation_profile?.profile_id === request.profile_id)
      .filter(({reference}) => !request.format || reference.representation_formats.includes(String(request.format)))
      .map(candidate => ({...candidate, score: candidateScore(candidate.reference, candidate.provider, request)}))
      .sort(compareScore);
    fail(candidates.length > 0, 'URRF_NO_REPRESENTATION_CANDIDATE');
    const selected = candidates[0];
    const reference = selected.reference;
    const detail_policy_root = rootHash(reference.detail_policy);
    const residency_policy_root = rootHash(reference.residency_policy);
    const detail_vector = normalizeDetailVector(request.detail_vector ?? request.detailVector ?? {});
    const resource_budget = clone(request.resource_budget ?? {});
    const fingerprint = rootHash({object_id, representation_root: reference.representation_root, detail_policy_root, residency_policy_root, detail_vector_root: detail_vector.vector_root, resource_budget});
    const plan_id = String(request.plan_id ?? `plan:${fingerprint.slice(0, 24)}`);
    const base = {
      format: URRF_MATERIALIZATION_PLAN_FORMAT,
      version: URRF_RUNTIME_VERSION,
      plan_id,
      object_id,
      branch: object.branch,
      state_root: object.state_root,
      content_root: object.content_root,
      property_set: clone(object.property_set),
      property_root: object.property_root,
      law_bindings: clone(object.law_bindings),
      law_bindings_root: object.law_bindings_root,
      detail_vector,
      detail_vector_root: detail_vector.vector_root,
      representation: clone(reference),
      representation_id: reference.representation_id,
      representation_root: reference.representation_root,
      provider_id: reference.provider_id,
      provider_root: reference.provider_root,
      selection: {
        requested_representation_id: request.representation_id ?? null,
        requested_representation_kind: request.representation_kind ?? null,
        requested_profile_id: request.profile_id ?? null,
        requested_format: request.format ?? null,
        requested_detail_mode: request.detail_mode ?? null,
        requested_residency_mode: request.residency_mode ?? null,
        selected_score: selected.score
      },
      detail_policy: clone(reference.detail_policy),
      residency_policy: clone(reference.residency_policy),
      resource_decision: {
        mode: 'materialize',
        selected_representation_root: reference.representation_root,
        detail_policy_root,
        residency_policy_root,
        detail_vector_root: detail_vector.vector_root,
        resource_budget,
        reason: typeof selected.provider?.materialize === 'function' ? 'registered-provider-adapter' : `provider-runtime-${selected.provider?.runtime_status ?? 'unknown'}`
      },
      authority: {
        provider_can_write_authoritative_world_state: false,
        provider_can_write_canonical_property: false,
        provider_can_write_canonical_law: false,
        rncs_authority_required: true,
        candidate_only: true
      },
      execution_status: 'PLANNED',
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    };
    return {...base, plan_root: rootHash(base)};
  }

  async materialize(input = {}, options = {}) {
    const plan = input.plan_root ? clone(input) : this.selectRepresentation(input);
    const verification = verifyMaterializationPlan(plan);
    fail(verification.valid, `URRF_PLAN_INVALID:${verification.errors.join(',')}`);
    const object = this.objects.get(plan.object_id);
    const provider = this.providers.get(plan.provider_id);
    fail(object, `URRF_OBJECT_NOT_REGISTERED:${plan.object_id}`);
    fail(provider, `URRF_PROVIDER_NOT_REGISTERED:${plan.provider_id}`);
    const propertyRoot = plan.property_root ?? object.property_root;
    const lawBindingsRoot = plan.law_bindings_root ?? object.law_bindings_root;
    const detailVector = plan.detail_vector ? normalizeDetailVector(plan.detail_vector) : normalizeDetailVector({});
    const detailVectorRoot = plan.detail_vector_root ?? detailVector.vector_root;
    fail(propertyRoot === object.property_root, 'URRF_PLAN_PROPERTY_ROOT_OBJECT_MISMATCH');
    fail(lawBindingsRoot === object.law_bindings_root, 'URRF_PLAN_LAW_BINDINGS_ROOT_OBJECT_MISMATCH');
    fail(detailVectorRoot === detailVector.vector_root, 'URRF_PLAN_DETAIL_VECTOR_ROOT_MISMATCH');
    const adapterInput = {
      object: clone(object),
      property_set: clone(object.property_set),
      law_bindings: clone(object.law_bindings),
      detail_vector: clone(detailVector),
      reference: clone(plan.representation),
      plan: clone(plan),
      context: clone(record(options).context ?? {}),
      authority: {
        provider_can_write_authoritative_world_state: false,
        provider_can_write_canonical_property: false,
        provider_can_write_canonical_law: false,
        rncs_authority_required: true,
        canonical_state_mutation_allowed: false,
        canonical_property_mutation_allowed: false,
        canonical_law_mutation_allowed: false
      }
    };
    let status = 'NOT_EXECUTED';
    let output_root = null;
    let evidence_root = null;
    let runtime = provider.runtime_status;
    let failure = null;
    let output_kind = plan.representation.representation_kind;
    if (plan.representation.availability === 'UNAVAILABLE') {
      failure = {code: 'REPRESENTATION_UNAVAILABLE', message: 'representation reference is unavailable'};
    } else if (typeof provider.materialize !== 'function') {
      failure = {code: 'PROVIDER_RUNTIME_NOT_EXECUTED', message: 'provider has no registered runtime adapter'};
    } else {
      try {
        const result = await provider.materialize(adapterInput);
        const value = record(result);
        runtime = String(value.runtime ?? runtime);
        output_kind = String(value.output_kind ?? output_kind);
        if (value.authoritative === true || value.canonical_state_mutated === true || value.provider_can_write_authoritative_world_state === true || value.canonical_property_mutated === true || value.canonical_law_mutated === true || value.provider_can_write_canonical_property === true || value.provider_can_write_canonical_law === true) {
          throw new Error('URRF_PROVIDER_AUTHORITY_ESCALATION');
        }
        if (value.status === 'FAILED' || value.execution_status === 'FAILED') {
          status = 'FAILED';
          failure = {code: String(value.failure?.code ?? 'PROVIDER_ADAPTER_FAILED'), message: String(value.failure?.message ?? 'provider adapter failed')};
        } else if (value.status === 'NOT_EXECUTED' || value.execution_status === 'NOT_EXECUTED' || value.result === null) {
          failure = {code: String(value.failure?.code ?? 'PROVIDER_RUNTIME_NOT_EXECUTED'), message: String(value.failure?.message ?? 'provider adapter did not execute')};
        } else {
          output_root = String(value.output_root ?? value.result_root ?? value.frame_root ?? value.scene_root ?? value.root ?? '');
          fail(hex64(output_root), 'URRF_PROVIDER_OUTPUT_ROOT_REQUIRED');
          if (value.evidence_root !== undefined && value.evidence_root !== null) {
            fail(hex64(value.evidence_root), 'URRF_PROVIDER_EVIDENCE_ROOT_INVALID');
            evidence_root = value.evidence_root;
          }
          status = 'EXECUTED';
        }
      } catch (error) {
        status = 'FAILED';
        failure = {code: error.message === 'URRF_PROVIDER_AUTHORITY_ESCALATION' ? error.message : 'URRF_PROVIDER_ADAPTER_FAILED', message: String(error.message ?? error)};
      }
    }
    const base = {
      format: URRF_MATERIALIZATION_RECEIPT_FORMAT,
      version: URRF_RUNTIME_VERSION,
      receipt_id: String(options.receipt_id ?? `receipt:${plan.plan_id}`),
      plan_id: plan.plan_id,
      object_id: plan.object_id,
      branch: plan.branch,
      state_root: plan.state_root,
      content_root: plan.content_root,
      property_root: propertyRoot,
      law_bindings_root: lawBindingsRoot,
      detail_vector: clone(detailVector),
      detail_vector_root: detailVectorRoot,
      representation_id: plan.representation_id,
      representation_root: plan.representation_root,
      provider_id: plan.provider_id,
      provider_root: plan.provider_root,
      representation_kind: plan.representation.representation_kind,
      output_kind,
      runtime,
      status,
      output_root,
      evidence_root,
      resource_decision: clone(plan.resource_decision),
      detail_policy_root: plan.resource_decision.detail_policy_root,
      residency_policy_root: plan.resource_decision.residency_policy_root,
      authority: {
        provider_can_write_authoritative_world_state: false,
        provider_can_write_canonical_property: false,
        provider_can_write_canonical_law: false,
        rncs_authority_required: true,
        canonical_state_mutation_allowed: false,
        canonical_property_mutation_allowed: false,
        canonical_law_mutation_allowed: false
      },
      canonical_state_mutated: false,
      failure,
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    };
    return {...base, receipt_root: rootHash(base)};
  }

  createTransitionCandidate(input = {}) {
    const request = record(input);
    const object = this.objects.get(String(request.object_id ?? request.id ?? ''));
    fail(object, `URRF_OBJECT_NOT_REGISTERED:${request.object_id ?? request.id ?? ''}`);
    const source = representationFor(object, request.source_representation ?? {representation_id: request.source_representation_id ?? request.source_id});
    const target = representationFor(object, request.target_representation ?? {representation_id: request.target_representation_id ?? request.target_id});
    fail(source, 'URRF_TRANSITION_SOURCE_NOT_FOUND');
    fail(target, 'URRF_TRANSITION_TARGET_NOT_FOUND');
    const transition_id = String(request.transition_id ?? `transition:${object.object_id}:${source.representation_id}:${target.representation_id}`);
    const candidateInput = {
      transition_id,
      operation: String(request.operation ?? 'handoff'),
      object_id: object.object_id,
      branch: object.branch,
      state_root: object.state_root,
      source_representation: clone(source),
      target_representation: clone(target),
      equivalence: normalizeEquivalence(request.equivalence, object, source, target),
      resource_decision: request.resource_decision ?? {
        mode: 'handoff',
        selected_representation_root: target.representation_root,
        resource_budget: clone(request.resource_budget ?? {}),
        reason: 'URRF candidate transition'
      }
    };
    const candidate = createRepresentationTransitionCandidate(candidateInput);
    const withRealityRoots = value => {
      const {transition_root: _transitionRoot, ...base} = value;
      return {...base, property_root: object.property_root, law_bindings_root: object.law_bindings_root, transition_root: rootHash({...base, property_root: object.property_root, law_bindings_root: object.law_bindings_root})};
    };
    const materializationReceipt = request.materialization_receipt ?? request.target_materialization_receipt;
    if (materializationReceipt) {
      const receiptVerification = verifyMaterializationReceipt(materializationReceipt);
      fail(receiptVerification.valid, `URRF_TRANSITION_RECEIPT_INVALID:${receiptVerification.errors.join(',')}`);
      fail(materializationReceipt.object_id === object.object_id, 'URRF_TRANSITION_RECEIPT_OBJECT_MISMATCH');
      fail(materializationReceipt.representation_root === target.representation_root, 'URRF_TRANSITION_RECEIPT_TARGET_MISMATCH');
      if (materializationReceipt.property_root !== undefined) fail(materializationReceipt.property_root === object.property_root, 'URRF_TRANSITION_RECEIPT_PROPERTY_ROOT_MISMATCH');
      if (materializationReceipt.law_bindings_root !== undefined) fail(materializationReceipt.law_bindings_root === object.law_bindings_root, 'URRF_TRANSITION_RECEIPT_LAW_BINDINGS_ROOT_MISMATCH');
      const {transition_root: _candidateRoot, ...candidateBase} = withRealityRoots(candidate);
      const withEvidence = {...candidateBase, runtime_evidence: {target_materialization_receipt_root: materializationReceipt.receipt_root, status: materializationReceipt.status}};
      const evidenced = {...withEvidence, transition_root: rootHash(withEvidence)};
      this.transitions.set(transition_id, evidenced);
      return evidenced;
    }
    const evidencedCandidate = withRealityRoots(candidate);
    this.transitions.set(transition_id, evidencedCandidate);
    return evidencedCandidate;
  }

  applyTransition(transition) {
    const verification = verifyRepresentationTransition(transition);
    fail(verification.valid, `URRF_TRANSITION_INVALID:${verification.errors.join(',')}`);
    const applied = applyRepresentationTransition(transition);
    const objectId = applied.identity.object_id;
    fail(this.objects.has(objectId), `URRF_OBJECT_NOT_REGISTERED:${objectId}`);
    this.transitions.set(applied.transition_id, applied);
    this.activeRoots.set(objectId, applied.active_representation_root);
    return applied;
  }

  rollbackTransition(transition, reason = 'URRF candidate transition rolled back') {
    const verification = verifyRepresentationTransition(transition);
    fail(verification.valid, `URRF_TRANSITION_INVALID:${verification.errors.join(',')}`);
    const rolledBack = rollbackRepresentationTransition(transition, reason);
    const objectId = rolledBack.identity.object_id;
    fail(this.objects.has(objectId), `URRF_OBJECT_NOT_REGISTERED:${objectId}`);
    this.transitions.set(rolledBack.transition_id, rolledBack);
    this.activeRoots.set(objectId, rolledBack.active_representation_root);
    return rolledBack;
  }

  getPropertySet(objectId) {
    const object = this.objects.get(String(objectId));
    return object ? clone(object.property_set) : null;
  }

  queryProperty(objectId, propertyId) {
    const propertySet = this.getPropertySet(objectId);
    fail(propertySet, `URRF_OBJECT_NOT_REGISTERED:${objectId}`);
    return queryRealityProperty(propertySet, propertyId);
  }

  listProperties(objectId) {
    const propertySet = this.getPropertySet(objectId);
    fail(propertySet, `URRF_OBJECT_NOT_REGISTERED:${objectId}`);
    return listRealityProperties(propertySet);
  }

  getLawBindings(objectId) {
    const object = this.objects.get(String(objectId));
    return object ? clone(object.law_bindings) : null;
  }

  queryLaw(objectId, lawId) {
    const bindings = this.getLawBindings(objectId);
    fail(bindings, `URRF_OBJECT_NOT_REGISTERED:${objectId}`);
    return queryRealityLaw(bindings, lawId);
  }

  createPropertyTransitionCandidate(input = {}) {
    const request = record(input);
    const objectId = String(request.object_id ?? request.id ?? '');
    const object = this.objects.get(objectId);
    fail(object, `URRF_OBJECT_NOT_REGISTERED:${objectId}`);
    const requestedLaw = request.law_binding ?? request.lawBinding;
    const lawId = String(requestedLaw?.law_id ?? request.law_id ?? request.lawId ?? '');
    const boundLaw = lawId ? queryRealityLaw(object.law_bindings, lawId) : null;
    fail(boundLaw || requestedLaw, 'URRF_PROPERTY_TRANSITION_LAW_NOT_BOUND');
    const candidate = createRealityPropertyTransitionCandidate({
      ...request,
      property_set: request.property_set ?? request.propertySet ?? object.property_set,
      law_binding: boundLaw ?? requestedLaw,
      source_state_root: request.source_state_root ?? object.state_root
    });
    this.propertyTransitions.set(candidate.transition_id, candidate);
    return clone(candidate);
  }

  getPropertyTransition(transitionId) {
    return clone(this.propertyTransitions.get(String(transitionId)) ?? null);
  }

  verifyPropertyTransition(transition) {
    return verifyRealityPropertyTransition(transition);
  }

  getQueryIndex(objectId) {
    const object = this.objects.get(String(objectId));
    return object ? clone(object.query_index) : null;
  }

  queryReality(input = {}) {
    const request = record(input);
    const query = normalizeQuery(request.query ?? request);
    return evaluateRealityQuery(query, this.listRealityObjects());
  }

  createCognitiveWorkingSet(input = {}) {
    const request = record(input);
    const queryResult = request.query_result ?? request.queryResult ?? this.queryReality(request.query ?? request);
    const workingSet = createCognitiveWorkingSet({...request, query_result: queryResult});
    const verification = verifyCognitiveWorkingSet(workingSet);
    fail(verification.valid, `URRF_COGNITIVE_WORKING_SET_INVALID:${verification.errors.join(',')}`);
    return workingSet;
  }

  createDetailVector(input = {}) {
    return normalizeDetailVector(input);
  }

  createHorizon(input = {}) {
    return normalizeHorizon(input);
  }

  createInterestGraph(input = {}) {
    return normalizeInterestGraph(input);
  }

  getTransition(transitionId) {
    return clone(this.transitions.get(String(transitionId)) ?? null);
  }

  snapshot() {
    const base = {
      format: URRF_RUNTIME_FORMAT,
      version: URRF_RUNTIME_VERSION,
      providers: [...this.providers.values()].map(publicProvider).sort((a, b) => Buffer.compare(Buffer.from(a.provider_id, 'utf8'), Buffer.from(b.provider_id, 'utf8'))),
      objects: [...this.objects.values()].map(object => ({object_id: object.object_id, object_root: object.object_root, state_root: object.state_root, content_root: object.content_root, property_root: object.property_root, law_bindings_root: object.law_bindings_root, query_index_root: object.query_index_root})).sort((a, b) => Buffer.compare(Buffer.from(a.object_id, 'utf8'), Buffer.from(b.object_id, 'utf8'))),
      active_representations: [...this.activeRoots.entries()].map(([object_id, representation_root]) => ({object_id, representation_root})).sort((a, b) => Buffer.compare(Buffer.from(a.object_id, 'utf8'), Buffer.from(b.object_id, 'utf8'))),
      transitions: [...this.transitions.values()].map(transition => ({transition_id: transition.transition_id, transition_root: transition.transition_root, phase: transition.phase, active_representation_root: transition.active_representation_root, property_root: transition.property_root ?? null, law_bindings_root: transition.law_bindings_root ?? null})).sort((a, b) => Buffer.compare(Buffer.from(a.transition_id, 'utf8'), Buffer.from(b.transition_id, 'utf8'))),
      property_transitions: [...this.propertyTransitions.values()].map(transition => ({transition_id: transition.transition_id, transition_root: transition.transition_root, phase: transition.phase, source_property_root: transition.source_property_root})).sort((a, b) => Buffer.compare(Buffer.from(a.transition_id, 'utf8'), Buffer.from(b.transition_id, 'utf8')))
    };
    return {...base, fabric_root: rootHash(base)};
  }
}

export function createRealityRepresentationFabric(options = {}) {
  return new RealityRepresentationFabric(options);
}
