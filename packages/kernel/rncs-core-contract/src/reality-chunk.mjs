import {ContractError, rootHash} from './index.mjs';
import {
  REALITY_CONSISTENCY_PROFILE_FORMAT,
  createRealityConsistencyProfile,
  verifyRealityConsistencyProfile
} from './reality-distribution.mjs';

export const REALITY_CHUNK_VERSION = '0.3.0';
export const REALITY_CHUNK_FORMAT = 'rncs.reality-chunk.v0.3';
export const REALITY_CHUNK_DELTA_FORMAT = 'rncs.reality-chunk-delta.v0.3';
export const REALITY_CHUNK_DELTA_RECEIPT_FORMAT = 'rncs.reality-chunk-delta-receipt.v0.3';
export const REALITY_CHUNK_SNAPSHOT_RECEIPT_FORMAT = 'rncs.reality-chunk-snapshot-receipt.v0.3';

export const REALITY_CHUNK_REPLICATION_CLASSES = Object.freeze(['PRIMARY', 'REPLICA', 'EDGE_CACHE', 'ARCHIVE']);
export const REALITY_CHUNK_PRIORITY_CLASSES = Object.freeze(['AUTHORITY', 'STATE', 'REPRESENTATION', 'BACKGROUND']);
export const REALITY_CHUNK_DELTA_STATUSES = Object.freeze(['APPLIED', 'DUPLICATE']);
export const REALITY_CHUNK_SNAPSHOT_STATUSES = Object.freeze(['APPLIED', 'DUPLICATE']);

const ZERO_ROOT = '0'.repeat(64);
const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const text = (value, code, fallback = '') => {
  const result = String(value ?? fallback);
  fail(result.length > 0, code);
  return result;
};
const integer = (value, code, fallback = 0) => {
  const result = value === undefined || value === null ? fallback : Number(value);
  fail(Number.isSafeInteger(result) && result >= 0, code);
  return result;
};
const root = (value, code, fallback = ZERO_ROOT) => {
  const result = String(value ?? fallback).toLowerCase();
  fail(hex64(result), code);
  return result;
};

function descriptor(value, code, fallback) {
  const source = value === undefined || value === null ? fallback : value;
  fail(source !== undefined && source !== null && typeof source === 'object' && !Array.isArray(source), code);
  return clone(source);
}

function normalizeCost(value) {
  const source = record(value);
  return {
    CPU_MILLI: integer(source.CPU_MILLI ?? source.cpu_milli, 'RNCS_REALITY_CHUNK_COST_CPU_INVALID', 0),
    RAM_MB: integer(source.RAM_MB ?? source.ram_mb, 'RNCS_REALITY_CHUNK_COST_RAM_INVALID', 0),
    NETWORK_KB: integer(source.NETWORK_KB ?? source.network_kb, 'RNCS_REALITY_CHUNK_COST_NETWORK_INVALID', 0),
    ENERGY_MILLI: integer(source.ENERGY_MILLI ?? source.energy_milli, 'RNCS_REALITY_CHUNK_COST_ENERGY_INVALID', 0)
  };
}

function normalizeRetention(value) {
  const source = record(value);
  const mode = String(source.mode ?? 'HOLD').toUpperCase();
  fail(['HOLD', 'TTL', 'LRU', 'PINNED'].includes(mode), 'RNCS_REALITY_CHUNK_RETENTION_MODE_INVALID');
  return {
    mode,
    ttl_ticks: integer(source.ttl_ticks ?? source.ttlTicks, 'RNCS_REALITY_CHUNK_RETENTION_TTL_INVALID', 0),
    evictable: source.evictable === undefined ? mode !== 'PINNED' : Boolean(source.evictable)
  };
}

function normalizeConsistency(value, chunkId) {
  if (value === undefined || value === null) return null;
  const profile = record(value).profile_root
    ? clone(value)
    : createRealityConsistencyProfile({profile_id: `consistency:chunk:${chunkId}`, ...record(value)});
  const verification = verifyRealityConsistencyProfile(profile);
  fail(verification.valid, `RNCS_REALITY_CHUNK_CONSISTENCY_PROFILE_INVALID:${verification.errors.join(',')}`);
  return profile;
}

function authorityBoundary() {
  return {
    canonical_owner: 'RNCS',
    provider_can_write_authoritative_world_state: false,
    rncs_authority_required: true,
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    commit_status: 'NOT_COMMITTED'
  };
}

function normalizeChunk(input = {}) {
  const value = record(input);
  const chunkId = text(value.chunk_id ?? value.chunkId, 'RNCS_REALITY_CHUNK_ID_REQUIRED');
  const worldId = text(value.world_id ?? value.worldId, 'RNCS_REALITY_CHUNK_WORLD_ID_REQUIRED');
  const representationRefs = (value.representation_refs ?? value.representationRefs) === undefined
    ? []
    : (value.representation_refs ?? value.representationRefs);
  fail(Array.isArray(representationRefs), 'RNCS_REALITY_CHUNK_REPRESENTATION_REFS_REQUIRED');
  const normalizedRepresentationRefs = strings(representationRefs);
  const contentHash = root(value.content_hash ?? value.contentHash, 'RNCS_REALITY_CHUNK_CONTENT_HASH_INVALID', rootHash({chunk_id: chunkId, representation_refs: normalizedRepresentationRefs}));
  const parentVersion = value.parent_version ?? value.parentVersion ?? null;
  if (parentVersion !== null) root(parentVersion, 'RNCS_REALITY_CHUNK_PARENT_VERSION_INVALID');
  const dependencies = strings(value.dependencies ?? value.dependency_ids ?? value.dependencyIds);
  const dependencyGraphRef = root(value.dependency_graph_ref ?? value.dependencyGraphRef, 'RNCS_REALITY_CHUNK_DEPENDENCY_GRAPH_INVALID', rootHash({chunk_id: chunkId, dependencies}));
  const compressionProfile = descriptor(value.compression_profile ?? value.compressionProfile, 'RNCS_REALITY_CHUNK_COMPRESSION_PROFILE_REQUIRED', {codec: 'none', level: 0});
  const replicationClass = String(value.replication_class ?? value.replicationClass ?? 'PRIMARY').toUpperCase();
  fail(REALITY_CHUNK_REPLICATION_CLASSES.includes(replicationClass), 'RNCS_REALITY_CHUNK_REPLICATION_CLASS_INVALID');
  const priorityClass = String(value.priority_class ?? value.priorityClass ?? 'REPRESENTATION').toUpperCase();
  fail(REALITY_CHUNK_PRIORITY_CLASSES.includes(priorityClass), 'RNCS_REALITY_CHUNK_PRIORITY_CLASS_INVALID');
  const evidenceRefs = strings(value.evidence_refs ?? value.evidenceRefs);
  const base = {
    format: REALITY_CHUNK_FORMAT,
    version: REALITY_CHUNK_VERSION,
    chunk_id: chunkId,
    world_id: worldId,
    branch_id: text(value.branch_id ?? value.branchId, 'RNCS_REALITY_CHUNK_BRANCH_REQUIRED', 'main'),
    spatial_bounds: descriptor(value.spatial_bounds ?? value.spatialBounds, 'RNCS_REALITY_CHUNK_SPATIAL_BOUNDS_REQUIRED', {}),
    temporal_bounds: descriptor(value.temporal_bounds ?? value.temporalBounds, 'RNCS_REALITY_CHUNK_TEMPORAL_BOUNDS_REQUIRED', {}),
    semantic_bounds: descriptor(value.semantic_bounds ?? value.semanticBounds, 'RNCS_REALITY_CHUNK_SEMANTIC_BOUNDS_REQUIRED', {}),
    canonical_state_root: root(value.canonical_state_root ?? value.canonicalStateRoot, 'RNCS_REALITY_CHUNK_CANONICAL_STATE_ROOT_INVALID'),
    representation_refs: normalizedRepresentationRefs,
    authority_scope: strings(value.authority_scope ?? value.authorityScope ?? ['read']),
    dependencies,
    residency: descriptor(value.residency, 'RNCS_REALITY_CHUNK_RESIDENCY_REQUIRED', {tier: 'RAM', status: 'COLD'}),
    content_hash: contentHash,
    delta_root: root(value.delta_root ?? value.deltaRoot, 'RNCS_REALITY_CHUNK_DELTA_ROOT_INVALID'),
    parent_version: parentVersion,
    dependency_graph_ref: dependencyGraphRef,
    compression_profile: compressionProfile,
    replication_class: replicationClass,
    consistency_profile: normalizeConsistency(value.consistency_profile ?? value.consistencyProfile, chunkId),
    retention_policy: normalizeRetention(value.retention_policy ?? value.retentionPolicy),
    reconstruction_cost: normalizeCost(value.reconstruction_cost ?? value.reconstructionCost),
    priority_class: priorityClass,
    evidence_refs: evidenceRefs,
    evidence_root: root(value.evidence_root ?? value.evidenceRoot, 'RNCS_REALITY_CHUNK_EVIDENCE_ROOT_INVALID', rootHash(evidenceRefs)),
    authority: authorityBoundary()
  };
  const versionRoot = rootHash(base);
  return {...base, version_root: versionRoot, chunk_root: rootHash({...base, version_root: versionRoot})};
}

export function createRealityChunk(input = {}) { return normalizeChunk(input); }

export function verifyRealityChunk(chunk) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!chunk || typeof chunk !== 'object' || Array.isArray(chunk)) return {valid: false, errors: ['RNCS_REALITY_CHUNK_NOT_OBJECT']};
  try {
    const copy = clone(chunk);
    const chunkRoot = copy.chunk_root;
    const versionRoot = copy.version_root;
    delete copy.chunk_root;
    delete copy.version_root;
    check(chunk.format === REALITY_CHUNK_FORMAT, 'RNCS_REALITY_CHUNK_FORMAT_INVALID');
    check(chunk.version === REALITY_CHUNK_VERSION, 'RNCS_REALITY_CHUNK_VERSION_INVALID');
    for (const field of ['chunk_id', 'world_id', 'branch_id']) check(typeof chunk[field] === 'string' && chunk[field].length > 0, `RNCS_REALITY_CHUNK_${field.toUpperCase()}_REQUIRED`);
    for (const field of ['spatial_bounds', 'temporal_bounds', 'semantic_bounds', 'residency', 'compression_profile', 'retention_policy', 'reconstruction_cost']) check(chunk[field] && typeof chunk[field] === 'object' && !Array.isArray(chunk[field]), `RNCS_REALITY_CHUNK_${field.toUpperCase()}_REQUIRED`);
    check(hex64(chunk.canonical_state_root), 'RNCS_REALITY_CHUNK_CANONICAL_STATE_ROOT_INVALID');
    check(Array.isArray(chunk.representation_refs) && chunk.representation_refs.every(hex64), 'RNCS_REALITY_CHUNK_REPRESENTATION_REFS_INVALID');
    check(Array.isArray(chunk.authority_scope), 'RNCS_REALITY_CHUNK_AUTHORITY_SCOPE_INVALID');
    check(Array.isArray(chunk.dependencies), 'RNCS_REALITY_CHUNK_DEPENDENCIES_INVALID');
    check(hex64(chunk.content_hash), 'RNCS_REALITY_CHUNK_CONTENT_HASH_INVALID');
    check(hex64(chunk.delta_root), 'RNCS_REALITY_CHUNK_DELTA_ROOT_INVALID');
    check(chunk.parent_version === null || hex64(chunk.parent_version), 'RNCS_REALITY_CHUNK_PARENT_VERSION_INVALID');
    check(hex64(chunk.dependency_graph_ref), 'RNCS_REALITY_CHUNK_DEPENDENCY_GRAPH_INVALID');
    check(REALITY_CHUNK_REPLICATION_CLASSES.includes(chunk.replication_class), 'RNCS_REALITY_CHUNK_REPLICATION_CLASS_INVALID');
    check(chunk.consistency_profile === null || (verifyRealityConsistencyProfile(chunk.consistency_profile).valid && chunk.consistency_profile.format === REALITY_CONSISTENCY_PROFILE_FORMAT), 'RNCS_REALITY_CHUNK_CONSISTENCY_PROFILE_INVALID');
    check(['HOLD', 'TTL', 'LRU', 'PINNED'].includes(chunk.retention_policy?.mode), 'RNCS_REALITY_CHUNK_RETENTION_MODE_INVALID');
    check(Number.isSafeInteger(chunk.retention_policy?.ttl_ticks) && chunk.retention_policy.ttl_ticks >= 0, 'RNCS_REALITY_CHUNK_RETENTION_TTL_INVALID');
    check(typeof chunk.retention_policy?.evictable === 'boolean', 'RNCS_REALITY_CHUNK_RETENTION_EVICTABLE_INVALID');
    for (const field of ['CPU_MILLI', 'RAM_MB', 'NETWORK_KB', 'ENERGY_MILLI']) check(Number.isSafeInteger(chunk.reconstruction_cost?.[field]) && chunk.reconstruction_cost[field] >= 0, `RNCS_REALITY_CHUNK_COST_${field}_INVALID`);
    check(REALITY_CHUNK_PRIORITY_CLASSES.includes(chunk.priority_class), 'RNCS_REALITY_CHUNK_PRIORITY_CLASS_INVALID');
    check(Array.isArray(chunk.evidence_refs) && hex64(chunk.evidence_root), 'RNCS_REALITY_CHUNK_EVIDENCE_INVALID');
    check(hex64(chunk.evidence_root) && rootHash(chunk.evidence_refs) === chunk.evidence_root, 'RNCS_REALITY_CHUNK_EVIDENCE_ROOT_MISMATCH');
    check(chunk.authority?.canonical_owner === 'RNCS' && chunk.authority?.provider_can_write_authoritative_world_state === false && chunk.authority?.rncs_authority_required === true, 'RNCS_REALITY_CHUNK_AUTHORITY_INVALID');
    check(chunk.authority?.candidate_only === true && chunk.authority?.authoritative === false && chunk.authority?.canonical_write_authorized === false, 'RNCS_REALITY_CHUNK_CANDIDATE_REQUIRED');
    check(chunk.authority?.commit_status === 'NOT_COMMITTED', 'RNCS_REALITY_CHUNK_COMMIT_STATUS_INVALID');
    check(hex64(versionRoot) && rootHash(copy) === versionRoot, 'RNCS_REALITY_CHUNK_VERSION_ROOT_MISMATCH');
    check(hex64(chunkRoot) && rootHash({...copy, version_root: versionRoot}) === chunkRoot, 'RNCS_REALITY_CHUNK_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_REALITY_CHUNK_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, chunk_root: chunk.chunk_root ?? null, version_root: chunk.version_root ?? null};
}

function normalizeDelta(input = {}) {
  const value = record(input);
  const baseChunk = clone(value.base_chunk ?? value.baseChunk);
  const targetChunk = clone(value.target_chunk ?? value.targetChunk);
  const baseVerification = verifyRealityChunk(baseChunk);
  const targetVerification = verifyRealityChunk(targetChunk);
  fail(baseVerification.valid, `RNCS_REALITY_CHUNK_DELTA_BASE_INVALID:${baseVerification.errors.join(',')}`);
  fail(targetVerification.valid, `RNCS_REALITY_CHUNK_DELTA_TARGET_INVALID:${targetVerification.errors.join(',')}`);
  fail(baseChunk.chunk_id === targetChunk.chunk_id && baseChunk.world_id === targetChunk.world_id, 'RNCS_REALITY_CHUNK_DELTA_IDENTITY_MISMATCH');
  fail(targetChunk.parent_version === baseChunk.version_root, 'RNCS_REALITY_CHUNK_DELTA_PARENT_VERSION_MISMATCH');
  const operations = clone(value.operations ?? value.ops ?? []);
  fail(Array.isArray(operations), 'RNCS_REALITY_CHUNK_DELTA_OPERATIONS_REQUIRED');
  const profile = value.consistency_profile ?? value.consistencyProfile ?? targetChunk.consistency_profile ?? baseChunk.consistency_profile ?? null;
  if (profile !== null) {
    const verification = verifyRealityConsistencyProfile(profile);
    fail(verification.valid, `RNCS_REALITY_CHUNK_DELTA_CONSISTENCY_PROFILE_INVALID:${verification.errors.join(',')}`);
  }
  const authorityReceiptRoot = value.authority_receipt_root ?? value.authorityReceiptRoot ?? null;
  if (authorityReceiptRoot !== null) root(authorityReceiptRoot, 'RNCS_REALITY_CHUNK_DELTA_AUTHORITY_RECEIPT_ROOT_INVALID');
  const base = {
    format: REALITY_CHUNK_DELTA_FORMAT,
    version: REALITY_CHUNK_VERSION,
    delta_id: text(value.delta_id ?? value.deltaId, 'RNCS_REALITY_CHUNK_DELTA_ID_REQUIRED', `chunk-delta:${baseChunk.chunk_id}:${baseChunk.version_root.slice(0, 24)}:${targetChunk.version_root.slice(0, 24)}`),
    chunk_id: baseChunk.chunk_id,
    world_id: baseChunk.world_id,
    source_node: text(value.source_node ?? value.sourceNode, 'RNCS_REALITY_CHUNK_DELTA_SOURCE_NODE_REQUIRED'),
    target_node: text(value.target_node ?? value.targetNode, 'RNCS_REALITY_CHUNK_DELTA_TARGET_NODE_REQUIRED'),
    sequence: integer(value.sequence, 'RNCS_REALITY_CHUNK_DELTA_SEQUENCE_INVALID', 1),
    base_chunk: baseChunk,
    target_chunk: targetChunk,
    base_chunk_root: baseChunk.chunk_root,
    target_chunk_root: targetChunk.chunk_root,
    base_version_root: baseChunk.version_root,
    target_version_root: targetChunk.version_root,
    canonical_state_root: targetChunk.canonical_state_root,
    content_hash: targetChunk.content_hash,
    dependency_graph_ref: targetChunk.dependency_graph_ref,
    consistency_profile: profile,
    authority_receipt_root: authorityReceiptRoot,
    operations,
    canonical_state_mutated: false,
    authority: authorityBoundary()
  };
  return {...base, delta_root: rootHash(base)};
}

export function createRealityChunkDelta(input = {}) { return normalizeDelta(input); }

export function verifyRealityChunkDelta(delta) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!delta || typeof delta !== 'object' || Array.isArray(delta)) return {valid: false, errors: ['RNCS_REALITY_CHUNK_DELTA_NOT_OBJECT']};
  try {
    const copy = clone(delta);
    const deltaRoot = copy.delta_root;
    delete copy.delta_root;
    check(delta.format === REALITY_CHUNK_DELTA_FORMAT, 'RNCS_REALITY_CHUNK_DELTA_FORMAT_INVALID');
    check(delta.version === REALITY_CHUNK_VERSION, 'RNCS_REALITY_CHUNK_DELTA_VERSION_INVALID');
    for (const field of ['delta_id', 'chunk_id', 'world_id', 'source_node', 'target_node']) check(typeof delta[field] === 'string' && delta[field].length > 0, `RNCS_REALITY_CHUNK_DELTA_${field.toUpperCase()}_REQUIRED`);
    check(Number.isSafeInteger(delta.sequence) && delta.sequence > 0, 'RNCS_REALITY_CHUNK_DELTA_SEQUENCE_INVALID');
    const baseVerification = verifyRealityChunk(delta.base_chunk);
    const targetVerification = verifyRealityChunk(delta.target_chunk);
    check(baseVerification.valid, `RNCS_REALITY_CHUNK_DELTA_BASE_INVALID:${baseVerification.errors.join(',')}`);
    check(targetVerification.valid, `RNCS_REALITY_CHUNK_DELTA_TARGET_INVALID:${targetVerification.errors.join(',')}`);
    check(delta.base_chunk_root === delta.base_chunk?.chunk_root && delta.target_chunk_root === delta.target_chunk?.chunk_root, 'RNCS_REALITY_CHUNK_DELTA_CHUNK_ROOT_MISMATCH');
    check(delta.base_version_root === delta.base_chunk?.version_root && delta.target_version_root === delta.target_chunk?.version_root, 'RNCS_REALITY_CHUNK_DELTA_VERSION_ROOT_MISMATCH');
    check(delta.chunk_id === delta.base_chunk?.chunk_id && delta.chunk_id === delta.target_chunk?.chunk_id, 'RNCS_REALITY_CHUNK_DELTA_IDENTITY_MISMATCH');
    check(delta.world_id === delta.base_chunk?.world_id && delta.world_id === delta.target_chunk?.world_id, 'RNCS_REALITY_CHUNK_DELTA_WORLD_MISMATCH');
    check(delta.target_chunk?.parent_version === delta.base_version_root, 'RNCS_REALITY_CHUNK_DELTA_PARENT_VERSION_MISMATCH');
    check(hex64(delta.canonical_state_root) && delta.canonical_state_root === delta.target_chunk?.canonical_state_root, 'RNCS_REALITY_CHUNK_DELTA_CANONICAL_ROOT_INVALID');
    check(hex64(delta.content_hash) && delta.content_hash === delta.target_chunk?.content_hash, 'RNCS_REALITY_CHUNK_DELTA_CONTENT_HASH_INVALID');
    check(hex64(delta.dependency_graph_ref) && delta.dependency_graph_ref === delta.target_chunk?.dependency_graph_ref, 'RNCS_REALITY_CHUNK_DELTA_DEPENDENCY_GRAPH_INVALID');
    if (delta.consistency_profile !== null) check(verifyRealityConsistencyProfile(delta.consistency_profile).valid, 'RNCS_REALITY_CHUNK_DELTA_CONSISTENCY_PROFILE_INVALID');
    check(delta.authority_receipt_root === null || hex64(delta.authority_receipt_root), 'RNCS_REALITY_CHUNK_DELTA_AUTHORITY_RECEIPT_ROOT_INVALID');
    check(Array.isArray(delta.operations), 'RNCS_REALITY_CHUNK_DELTA_OPERATIONS_REQUIRED');
    check(delta.canonical_state_mutated === false, 'RNCS_REALITY_CHUNK_DELTA_CANONICAL_MUTATION');
    check(delta.authority?.canonical_owner === 'RNCS' && delta.authority?.provider_can_write_authoritative_world_state === false, 'RNCS_REALITY_CHUNK_DELTA_AUTHORITY_INVALID');
    check(delta.authority?.candidate_only === true && delta.authority?.authoritative === false && delta.authority?.canonical_write_authorized === false, 'RNCS_REALITY_CHUNK_DELTA_CANDIDATE_REQUIRED');
    check(delta.authority?.commit_status === 'NOT_COMMITTED', 'RNCS_REALITY_CHUNK_DELTA_COMMIT_STATUS_INVALID');
    check(hex64(deltaRoot) && rootHash(copy) === deltaRoot, 'RNCS_REALITY_CHUNK_DELTA_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_REALITY_CHUNK_DELTA_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, delta_root: delta.delta_root ?? null};
}

export function createRealityChunkDeltaReceipt(input = {}) {
  const value = record(input);
  const delta = clone(value.delta);
  const verification = verifyRealityChunkDelta(delta);
  fail(verification.valid, `RNCS_REALITY_CHUNK_DELTA_RECEIPT_DELTA_INVALID:${verification.errors.join(',')}`);
  const status = String(value.status ?? 'APPLIED').toUpperCase();
  fail(REALITY_CHUNK_DELTA_STATUSES.includes(status), 'RNCS_REALITY_CHUNK_DELTA_RECEIPT_STATUS_INVALID');
  const base = {
    format: REALITY_CHUNK_DELTA_RECEIPT_FORMAT,
    version: REALITY_CHUNK_VERSION,
    receipt_id: text(value.receipt_id ?? value.receiptId, 'RNCS_REALITY_CHUNK_DELTA_RECEIPT_ID_REQUIRED', `chunk-delta-receipt:${delta.delta_root}`),
    status,
    delta_id: delta.delta_id,
    delta_root: delta.delta_root,
    chunk_id: delta.chunk_id,
    world_id: delta.world_id,
    source_node: delta.source_node,
    target_node: delta.target_node,
    base_version_root: delta.base_version_root,
    target_version_root: delta.target_version_root,
    target_chunk_root: delta.target_chunk_root,
    canonical_state_root: delta.canonical_state_root,
    canonical_state_mutated: false,
    authority: authorityBoundary(),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs)
  };
  return {...base, receipt_root: rootHash(base)};
}

export function verifyRealityChunkDeltaReceipt(receipt) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) return {valid: false, errors: ['RNCS_REALITY_CHUNK_DELTA_RECEIPT_NOT_OBJECT']};
  try {
    const copy = clone(receipt);
    const receiptRoot = copy.receipt_root;
    delete copy.receipt_root;
    check(receipt.format === REALITY_CHUNK_DELTA_RECEIPT_FORMAT, 'RNCS_REALITY_CHUNK_DELTA_RECEIPT_FORMAT_INVALID');
    check(receipt.version === REALITY_CHUNK_VERSION, 'RNCS_REALITY_CHUNK_DELTA_RECEIPT_VERSION_INVALID');
    check(REALITY_CHUNK_DELTA_STATUSES.includes(receipt.status), 'RNCS_REALITY_CHUNK_DELTA_RECEIPT_STATUS_INVALID');
    for (const field of ['delta_root', 'base_version_root', 'target_version_root', 'target_chunk_root', 'canonical_state_root']) check(hex64(receipt[field]), `RNCS_REALITY_CHUNK_DELTA_RECEIPT_${field.toUpperCase()}_INVALID`);
    check(typeof receipt.receipt_id === 'string' && receipt.receipt_id.length > 0, 'RNCS_REALITY_CHUNK_DELTA_RECEIPT_ID_REQUIRED');
    check(receipt.canonical_state_mutated === false, 'RNCS_REALITY_CHUNK_DELTA_RECEIPT_CANONICAL_MUTATION');
    check(receipt.authority?.canonical_owner === 'RNCS' && receipt.authority?.canonical_write_authorized === false, 'RNCS_REALITY_CHUNK_DELTA_RECEIPT_AUTHORITY_INVALID');
    check(receipt.authority?.candidate_only === true && receipt.authority?.authoritative === false && receipt.authority?.commit_status === 'NOT_COMMITTED', 'RNCS_REALITY_CHUNK_DELTA_RECEIPT_CANDIDATE_REQUIRED');
    check(Array.isArray(receipt.evidence_refs), 'RNCS_REALITY_CHUNK_DELTA_RECEIPT_EVIDENCE_REQUIRED');
    check(hex64(receiptRoot) && rootHash(copy) === receiptRoot, 'RNCS_REALITY_CHUNK_DELTA_RECEIPT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_REALITY_CHUNK_DELTA_RECEIPT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root ?? null};
}

export function createRealityChunkSnapshotReceipt(input = {}) {
  const value = record(input);
  const snapshot = clone(value.snapshot);
  const verification = verifyRealityChunk(snapshot);
  fail(verification.valid, `RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_SNAPSHOT_INVALID:${verification.errors.join(',')}`);
  const status = String(value.status ?? 'APPLIED').toUpperCase();
  fail(REALITY_CHUNK_SNAPSHOT_STATUSES.includes(status), 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_STATUS_INVALID');
  const base = {
    format: REALITY_CHUNK_SNAPSHOT_RECEIPT_FORMAT,
    version: REALITY_CHUNK_VERSION,
    receipt_id: text(value.receipt_id ?? value.receiptId, 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_ID_REQUIRED', `chunk-snapshot-receipt:${snapshot.chunk_root}`),
    status,
    chunk_id: snapshot.chunk_id,
    world_id: snapshot.world_id,
    source_node: text(value.source_node ?? value.sourceNode, 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_SOURCE_NODE_REQUIRED'),
    target_node: text(value.target_node ?? value.targetNode, 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_TARGET_NODE_REQUIRED'),
    chunk_root: snapshot.chunk_root,
    version_root: snapshot.version_root,
    canonical_state_root: snapshot.canonical_state_root,
    canonical_state_mutated: false,
    authority: authorityBoundary(),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs)
  };
  return {...base, receipt_root: rootHash(base)};
}

export function verifyRealityChunkSnapshotReceipt(receipt) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) return {valid: false, errors: ['RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_NOT_OBJECT']};
  try {
    const copy = clone(receipt);
    const receiptRoot = copy.receipt_root;
    delete copy.receipt_root;
    check(receipt.format === REALITY_CHUNK_SNAPSHOT_RECEIPT_FORMAT, 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_FORMAT_INVALID');
    check(receipt.version === REALITY_CHUNK_VERSION, 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_VERSION_INVALID');
    check(REALITY_CHUNK_SNAPSHOT_STATUSES.includes(receipt.status), 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_STATUS_INVALID');
    for (const field of ['chunk_root', 'version_root', 'canonical_state_root']) check(hex64(receipt[field]), `RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_${field.toUpperCase()}_INVALID`);
    for (const field of ['receipt_id', 'chunk_id', 'world_id', 'source_node', 'target_node']) check(typeof receipt[field] === 'string' && receipt[field].length > 0, `RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_${field.toUpperCase()}_REQUIRED`);
    check(receipt.canonical_state_mutated === false, 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_CANONICAL_MUTATION');
    check(receipt.authority?.canonical_owner === 'RNCS' && receipt.authority?.canonical_write_authorized === false, 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_AUTHORITY_INVALID');
    check(receipt.authority?.candidate_only === true && receipt.authority?.authoritative === false && receipt.authority?.commit_status === 'NOT_COMMITTED', 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_CANDIDATE_REQUIRED');
    check(Array.isArray(receipt.evidence_refs), 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_EVIDENCE_REQUIRED');
    check(hex64(receiptRoot) && rootHash(copy) === receiptRoot, 'RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_REALITY_CHUNK_SNAPSHOT_RECEIPT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root ?? null};
}
