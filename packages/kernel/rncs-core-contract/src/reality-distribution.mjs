import {ContractError, rootHash, without} from './index.mjs';

export const REALITY_DISTRIBUTION_VERSION = '0.3.0';
export const REALITY_CONSISTENCY_PROFILE_FORMAT = 'rncs.reality-consistency-profile.v0.3';
export const AUTHORITY_LEASE_FORMAT = 'rncs.authority-lease.v0.3';
export const AUTHORITY_LEASE_REVOCATION_FORMAT = 'rncs.authority-lease-revocation.v0.3';
export const REALITY_REPLICATION_ENVELOPE_FORMAT = 'rncs.reality-replication-envelope.v0.3';

export const REALITY_CONSISTENCY_MODES = Object.freeze([
  'LINEARIZABLE',
  'SERIALIZABLE',
  'CAUSAL',
  'SNAPSHOT',
  'EVENTUAL',
  'BEST_EFFORT_PROJECTION'
]);

export const REALITY_REPLICATION_MESSAGE_TYPES = Object.freeze([
  'STATE_SNAPSHOT',
  'STATE_DELTA',
  'EVENT_DELTA',
  'REPRESENTATION_DELTA',
  'INVALIDATE',
  'LEASE_UPDATE',
  'AUTHORITY_REVOKE',
  'ACK',
  'NACK',
  'RESYNC_REQUEST'
]);

export const AUTHORITY_LEASE_STATUSES = Object.freeze(['ACTIVE', 'REVOKED', 'EXPIRED']);

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);
const integer = (value, code, fallback = 0) => {
  const number = value === undefined || value === null ? fallback : Number(value);
  fail(Number.isSafeInteger(number) && number >= 0, code);
  return number;
};
const text = (value, code, fallback = '') => {
  const result = String(value ?? fallback);
  fail(result.length > 0, code);
  return result;
};
const root = (value, code, fallback = '0'.repeat(64)) => {
  const result = String(value ?? fallback).toLowerCase();
  fail(hex64(result), code);
  return result;
};
const bool = (value, code, fallback) => {
  const result = value === undefined ? fallback : value;
  fail(typeof result === 'boolean', code);
  return result;
};

function normalizeRetryPolicy(value) {
  const source = record(value);
  return {
    max_attempts: integer(source.max_attempts ?? source.maxAttempts, 'RNCS_CONSISTENCY_RETRY_MAX_ATTEMPTS_INVALID', 3),
    backoff_ms: integer(source.backoff_ms ?? source.backoffMs, 'RNCS_CONSISTENCY_RETRY_BACKOFF_INVALID', 10),
    mode: text(source.mode, 'RNCS_CONSISTENCY_RETRY_MODE_REQUIRED', 'exponential')
  };
}

function normalizeConsistencyProfile(input = {}) {
  const value = record(input);
  const mode = String(value.mode ?? 'CAUSAL').toUpperCase();
  fail(REALITY_CONSISTENCY_MODES.includes(mode), 'RNCS_CONSISTENCY_MODE_INVALID');
  const profile_id = text(value.profile_id ?? value.profileId, 'RNCS_CONSISTENCY_PROFILE_ID_REQUIRED', 'consistency:default');
  return {
    format: REALITY_CONSISTENCY_PROFILE_FORMAT,
    version: REALITY_DISTRIBUTION_VERSION,
    profile_id,
    mode,
    stale_read_budget_ms: integer(value.stale_read_budget_ms ?? value.staleReadBudgetMs, 'RNCS_CONSISTENCY_STALE_READ_BUDGET_INVALID', 0),
    authority_required: bool(value.authority_required ?? value.authorityRequired, 'RNCS_CONSISTENCY_AUTHORITY_REQUIRED_INVALID', true),
    conflict_policy: text(value.conflict_policy ?? value.conflictPolicy, 'RNCS_CONSISTENCY_CONFLICT_POLICY_REQUIRED', 'reject-stale'),
    lease_required: bool(value.lease_required ?? value.leaseRequired, 'RNCS_CONSISTENCY_LEASE_REQUIRED_INVALID', true),
    fencing_required: bool(value.fencing_required ?? value.fencingRequired, 'RNCS_CONSISTENCY_FENCING_REQUIRED_INVALID', true),
    retry_policy: normalizeRetryPolicy(value.retry_policy ?? value.retryPolicy),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityConsistencyProfile(input = {}) {
  const base = normalizeConsistencyProfile(input);
  return {...base, profile_root: rootHash(base)};
}

export function verifyRealityConsistencyProfile(profile) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!profile || typeof profile !== 'object') return {valid: false, errors: ['RNCS_CONSISTENCY_PROFILE_NOT_OBJECT']};
  try {
    const copy = clone(profile);
    const profileRoot = copy.profile_root;
    delete copy.profile_root;
    check(profile.format === REALITY_CONSISTENCY_PROFILE_FORMAT, 'RNCS_CONSISTENCY_PROFILE_FORMAT_INVALID');
    check(profile.version === REALITY_DISTRIBUTION_VERSION, 'RNCS_CONSISTENCY_PROFILE_VERSION_INVALID');
    check(typeof profile.profile_id === 'string' && profile.profile_id.length > 0, 'RNCS_CONSISTENCY_PROFILE_ID_REQUIRED');
    check(REALITY_CONSISTENCY_MODES.includes(profile.mode), 'RNCS_CONSISTENCY_MODE_INVALID');
    check(Number.isSafeInteger(profile.stale_read_budget_ms) && profile.stale_read_budget_ms >= 0, 'RNCS_CONSISTENCY_STALE_READ_BUDGET_INVALID');
    check(typeof profile.authority_required === 'boolean', 'RNCS_CONSISTENCY_AUTHORITY_REQUIRED_INVALID');
    check(typeof profile.conflict_policy === 'string' && profile.conflict_policy.length > 0, 'RNCS_CONSISTENCY_CONFLICT_POLICY_REQUIRED');
    check(typeof profile.lease_required === 'boolean', 'RNCS_CONSISTENCY_LEASE_REQUIRED_INVALID');
    check(typeof profile.fencing_required === 'boolean', 'RNCS_CONSISTENCY_FENCING_REQUIRED_INVALID');
    check(Number.isSafeInteger(profile.retry_policy?.max_attempts) && profile.retry_policy.max_attempts >= 0, 'RNCS_CONSISTENCY_RETRY_MAX_ATTEMPTS_INVALID');
    check(Number.isSafeInteger(profile.retry_policy?.backoff_ms) && profile.retry_policy.backoff_ms >= 0, 'RNCS_CONSISTENCY_RETRY_BACKOFF_INVALID');
    check(typeof profile.retry_policy?.mode === 'string' && profile.retry_policy.mode.length > 0, 'RNCS_CONSISTENCY_RETRY_MODE_REQUIRED');
    check(Array.isArray(profile.evidence_refs), 'RNCS_CONSISTENCY_EVIDENCE_REFS_REQUIRED');
    check(profile.candidate_only === true && profile.authoritative === false, 'RNCS_CONSISTENCY_CANDIDATE_REQUIRED');
    check(profile.commit_status === 'NOT_COMMITTED', 'RNCS_CONSISTENCY_COMMIT_STATUS_INVALID');
    check(hex64(profileRoot) && rootHash(copy) === profileRoot, 'RNCS_CONSISTENCY_PROFILE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_CONSISTENCY_PROFILE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, profile_root: profile.profile_root ?? null};
}

function normalizeAuthorityLease(input = {}) {
  const value = record(input);
  const valid_from_tick = integer(value.valid_from_tick ?? value.validFromTick, 'RNCS_AUTHORITY_LEASE_VALID_FROM_INVALID');
  const valid_until_tick = integer(value.valid_until_tick ?? value.validUntilTick, 'RNCS_AUTHORITY_LEASE_VALID_UNTIL_INVALID', valid_from_tick + 1);
  fail(valid_until_tick > valid_from_tick, 'RNCS_AUTHORITY_LEASE_INTERVAL_INVALID');
  const status = String(value.status ?? 'ACTIVE').toUpperCase();
  fail(AUTHORITY_LEASE_STATUSES.includes(status), 'RNCS_AUTHORITY_LEASE_STATUS_INVALID');
  const revoked_at_tick = value.revoked_at_tick ?? value.revokedAtTick ?? null;
  if (revoked_at_tick !== null) integer(revoked_at_tick, 'RNCS_AUTHORITY_LEASE_REVOKED_AT_INVALID');
  fail(status !== 'REVOKED' || revoked_at_tick !== null, 'RNCS_AUTHORITY_LEASE_REVOKED_AT_REQUIRED');
  fail(status === 'REVOKED' || revoked_at_tick === null, 'RNCS_AUTHORITY_LEASE_REVOKED_AT_UNEXPECTED');
  const renewal_of = value.renewal_of ?? value.renewalOf ?? null;
  if (renewal_of !== null) root(renewal_of, 'RNCS_AUTHORITY_LEASE_RENEWAL_ROOT_INVALID');
  return {
    format: AUTHORITY_LEASE_FORMAT,
    version: REALITY_DISTRIBUTION_VERSION,
    authority_id: text(value.authority_id ?? value.authorityId, 'RNCS_AUTHORITY_LEASE_AUTHORITY_ID_REQUIRED'),
    shard_id: text(value.shard_id ?? value.shardId, 'RNCS_AUTHORITY_LEASE_SHARD_ID_REQUIRED'),
    semantic_scope: text(value.semantic_scope ?? value.semanticScope, 'RNCS_AUTHORITY_LEASE_SEMANTIC_SCOPE_REQUIRED'),
    owner_node: text(value.owner_node ?? value.ownerNode, 'RNCS_AUTHORITY_LEASE_OWNER_NODE_REQUIRED'),
    epoch: integer(value.epoch, 'RNCS_AUTHORITY_LEASE_EPOCH_INVALID'),
    fencing_token: integer(value.fencing_token ?? value.fencingToken, 'RNCS_AUTHORITY_LEASE_FENCING_TOKEN_INVALID'),
    valid_from_tick,
    valid_until_tick,
    status,
    revoked_at_tick,
    renewal_of,
    provenance_ref: text(value.provenance_ref ?? value.provenanceRef, 'RNCS_AUTHORITY_LEASE_PROVENANCE_REQUIRED'),
    authority_ref: text(value.authority_ref ?? value.authorityRef, 'RNCS_AUTHORITY_LEASE_AUTHORITY_REF_REQUIRED'),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createAuthorityLease(input = {}) {
  const base = normalizeAuthorityLease(input);
  return {...base, lease_root: rootHash(base)};
}

export function verifyAuthorityLease(lease) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!lease || typeof lease !== 'object') return {valid: false, errors: ['RNCS_AUTHORITY_LEASE_NOT_OBJECT']};
  try {
    const copy = clone(lease);
    const leaseRoot = copy.lease_root;
    delete copy.lease_root;
    for (const field of ['format', 'version', 'authority_id', 'shard_id', 'semantic_scope', 'owner_node', 'provenance_ref', 'authority_ref']) check(typeof lease[field] === 'string' && lease[field].length > 0, `RNCS_AUTHORITY_LEASE_${field.toUpperCase()}_REQUIRED`);
    check(lease.format === AUTHORITY_LEASE_FORMAT, 'RNCS_AUTHORITY_LEASE_FORMAT_INVALID');
    check(lease.version === REALITY_DISTRIBUTION_VERSION, 'RNCS_AUTHORITY_LEASE_VERSION_INVALID');
    for (const field of ['epoch', 'fencing_token', 'valid_from_tick', 'valid_until_tick']) check(Number.isSafeInteger(lease[field]) && lease[field] >= 0, `RNCS_AUTHORITY_LEASE_${field.toUpperCase()}_INVALID`);
    check(lease.valid_until_tick > lease.valid_from_tick, 'RNCS_AUTHORITY_LEASE_INTERVAL_INVALID');
    check(AUTHORITY_LEASE_STATUSES.includes(lease.status), 'RNCS_AUTHORITY_LEASE_STATUS_INVALID');
    check((lease.status === 'REVOKED') === (lease.revoked_at_tick !== null), 'RNCS_AUTHORITY_LEASE_REVOKED_AT_INVALID');
    if (lease.revoked_at_tick !== null) check(Number.isSafeInteger(lease.revoked_at_tick) && lease.revoked_at_tick >= lease.valid_from_tick, 'RNCS_AUTHORITY_LEASE_REVOKED_AT_INVALID');
    check(lease.renewal_of === null || hex64(lease.renewal_of), 'RNCS_AUTHORITY_LEASE_RENEWAL_ROOT_INVALID');
    check(Array.isArray(lease.evidence_refs), 'RNCS_AUTHORITY_LEASE_EVIDENCE_REFS_REQUIRED');
    check(lease.candidate_only === true && lease.authoritative === false, 'RNCS_AUTHORITY_LEASE_CANDIDATE_REQUIRED');
    check(lease.commit_status === 'NOT_COMMITTED', 'RNCS_AUTHORITY_LEASE_COMMIT_STATUS_INVALID');
    check(hex64(leaseRoot) && rootHash(copy) === leaseRoot, 'RNCS_AUTHORITY_LEASE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_AUTHORITY_LEASE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, lease_root: lease.lease_root ?? null};
}

export function checkAuthorityLease(lease, input = {}) {
  const errors = [];
  const verification = verifyAuthorityLease(lease);
  if (!verification.valid) errors.push(...verification.errors);
  const value = record(input);
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (verification.valid) {
    if (value.authority_id !== undefined) check(lease.authority_id === String(value.authority_id), 'RNCS_AUTHORITY_LEASE_AUTHORITY_ID_MISMATCH');
    if (value.shard_id !== undefined) check(lease.shard_id === String(value.shard_id), 'RNCS_AUTHORITY_LEASE_SHARD_ID_MISMATCH');
    if (value.semantic_scope !== undefined) check(lease.semantic_scope === String(value.semantic_scope), 'RNCS_AUTHORITY_LEASE_SCOPE_MISMATCH');
    if (value.owner_node !== undefined) check(lease.owner_node === String(value.owner_node), 'RNCS_AUTHORITY_LEASE_OWNER_NODE_MISMATCH');
    if (value.epoch !== undefined) check(lease.epoch === Number(value.epoch), 'RNCS_AUTHORITY_LEASE_EPOCH_MISMATCH');
    if (value.fencing_token !== undefined) check(lease.fencing_token === Number(value.fencing_token), 'RNCS_AUTHORITY_LEASE_FENCING_TOKEN_MISMATCH');
    const tick = value.tick === undefined ? null : Number(value.tick);
    if (tick !== null) {
      check(Number.isSafeInteger(tick) && tick >= 0, 'RNCS_AUTHORITY_LEASE_TICK_INVALID');
      check(lease.status === 'ACTIVE', 'RNCS_AUTHORITY_LEASE_NOT_ACTIVE');
      check(tick >= lease.valid_from_tick && tick < lease.valid_until_tick, 'RNCS_AUTHORITY_LEASE_EXPIRED');
      if (lease.revoked_at_tick !== null) check(tick < lease.revoked_at_tick, 'RNCS_AUTHORITY_LEASE_REVOKED');
    }
    const current = value.current_lease ?? value.currentLease;
    if (current !== undefined && current !== null) {
      const currentVerification = verifyAuthorityLease(current);
      if (!currentVerification.valid) errors.push(...currentVerification.errors.map(code => `RNCS_CURRENT_${code}`));
      else {
        check(current.authority_id === lease.authority_id && current.shard_id === lease.shard_id && current.semantic_scope === lease.semantic_scope, 'RNCS_AUTHORITY_LEASE_CURRENT_SCOPE_MISMATCH');
        check(current.epoch === lease.epoch, 'RNCS_AUTHORITY_LEASE_STALE_EPOCH');
        check(current.fencing_token === lease.fencing_token, 'RNCS_AUTHORITY_LEASE_STALE_FENCING_TOKEN');
        check(current.status === 'ACTIVE', 'RNCS_AUTHORITY_LEASE_CURRENT_NOT_ACTIVE');
      }
    }
  }
  return {valid: errors.length === 0, errors, lease_root: lease?.lease_root ?? null};
}

export function assertAuthorityLease(lease, input = {}) {
  const result = checkAuthorityLease(lease, input);
  fail(result.valid, `RNCS_AUTHORITY_LEASE_ADMISSION_FAILED:${result.errors.join(',')}`);
  return clone(lease);
}

export function createAuthorityLeaseRevocation(input = {}) {
  const value = record(input);
  const lease = clone(value.lease ?? value.authority_lease ?? value.authorityLease);
  const verification = verifyAuthorityLease(lease);
  fail(verification.valid, `RNCS_AUTHORITY_LEASE_INVALID:${verification.errors.join(',')}`);
  const base = {
    format: AUTHORITY_LEASE_REVOCATION_FORMAT,
    version: REALITY_DISTRIBUTION_VERSION,
    revocation_id: text(value.revocation_id ?? value.revocationId, 'RNCS_AUTHORITY_REVOCATION_ID_REQUIRED', `revoke:${lease.lease_root.slice(0, 24)}`),
    lease_root: lease.lease_root,
    authority_id: lease.authority_id,
    shard_id: lease.shard_id,
    owner_node: lease.owner_node,
    epoch: lease.epoch,
    fencing_token: lease.fencing_token,
    revoked_at_tick: integer(value.revoked_at_tick ?? value.revokedAtTick, 'RNCS_AUTHORITY_REVOCATION_TICK_INVALID'),
    reason: text(value.reason, 'RNCS_AUTHORITY_REVOCATION_REASON_REQUIRED'),
    authority_ref: text(value.authority_ref ?? value.authorityRef, 'RNCS_AUTHORITY_REVOCATION_AUTHORITY_REF_REQUIRED'),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, revocation_root: rootHash(base)};
}

export function verifyAuthorityLeaseRevocation(revocation) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!revocation || typeof revocation !== 'object') return {valid: false, errors: ['RNCS_AUTHORITY_REVOCATION_NOT_OBJECT']};
  try {
    const copy = clone(revocation);
    const revocationRoot = copy.revocation_root;
    delete copy.revocation_root;
    check(revocation.format === AUTHORITY_LEASE_REVOCATION_FORMAT, 'RNCS_AUTHORITY_REVOCATION_FORMAT_INVALID');
    check(revocation.version === REALITY_DISTRIBUTION_VERSION, 'RNCS_AUTHORITY_REVOCATION_VERSION_INVALID');
    check(typeof revocation.revocation_id === 'string' && revocation.revocation_id.length > 0, 'RNCS_AUTHORITY_REVOCATION_ID_REQUIRED');
    check(hex64(revocation.lease_root), 'RNCS_AUTHORITY_REVOCATION_LEASE_ROOT_INVALID');
    for (const field of ['authority_id', 'shard_id', 'owner_node', 'authority_ref', 'reason']) check(typeof revocation[field] === 'string' && revocation[field].length > 0, `RNCS_AUTHORITY_REVOCATION_${field.toUpperCase()}_REQUIRED`);
    for (const field of ['epoch', 'fencing_token', 'revoked_at_tick']) check(Number.isSafeInteger(revocation[field]) && revocation[field] >= 0, `RNCS_AUTHORITY_REVOCATION_${field.toUpperCase()}_INVALID`);
    check(Array.isArray(revocation.evidence_refs), 'RNCS_AUTHORITY_REVOCATION_EVIDENCE_REFS_REQUIRED');
    check(revocation.candidate_only === true && revocation.authoritative === false, 'RNCS_AUTHORITY_REVOCATION_CANDIDATE_REQUIRED');
    check(revocation.commit_status === 'NOT_COMMITTED', 'RNCS_AUTHORITY_REVOCATION_COMMIT_STATUS_INVALID');
    check(hex64(revocationRoot) && rootHash(copy) === revocationRoot, 'RNCS_AUTHORITY_REVOCATION_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_AUTHORITY_REVOCATION_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, revocation_root: revocation.revocation_root ?? null};
}

function normalizeReplicationEnvelope(input = {}) {
  const value = record(input);
  const message_type = String(value.message_type ?? value.messageType ?? 'STATE_DELTA').toUpperCase();
  fail(REALITY_REPLICATION_MESSAGE_TYPES.includes(message_type), 'RNCS_REPLICATION_MESSAGE_TYPE_INVALID');
  const payload = clone(value.payload ?? {});
  const consistency_profile = value.consistency_profile ?? value.consistencyProfile ?? null;
  const authority_lease = value.authority_lease ?? value.authorityLease ?? null;
  if (consistency_profile !== null) fail(verifyRealityConsistencyProfile(consistency_profile).valid, 'RNCS_REPLICATION_CONSISTENCY_PROFILE_INVALID');
  if (authority_lease !== null) fail(verifyAuthorityLease(authority_lease).valid, 'RNCS_REPLICATION_AUTHORITY_LEASE_INVALID');
  const profileRoot = consistency_profile?.profile_root ?? null;
  const leaseRoot = authority_lease?.lease_root ?? null;
  if (consistency_profile?.lease_required === true) fail(authority_lease !== null, 'RNCS_REPLICATION_LEASE_REQUIRED');
  if (consistency_profile?.fencing_required === true) fail(authority_lease !== null, 'RNCS_REPLICATION_FENCING_REQUIRED');
  return {
    format: REALITY_REPLICATION_ENVELOPE_FORMAT,
    version: REALITY_DISTRIBUTION_VERSION,
    message_type,
    message_id: text(value.message_id ?? value.messageId, 'RNCS_REPLICATION_MESSAGE_ID_REQUIRED', `replication:${rootHash(payload).slice(0, 24)}`),
    world_id: text(value.world_id ?? value.worldId, 'RNCS_REPLICATION_WORLD_ID_REQUIRED'),
    shard_id: text(value.shard_id ?? value.shardId, 'RNCS_REPLICATION_SHARD_ID_REQUIRED'),
    source_node: text(value.source_node ?? value.sourceNode, 'RNCS_REPLICATION_SOURCE_NODE_REQUIRED'),
    target_node: text(value.target_node ?? value.targetNode, 'RNCS_REPLICATION_TARGET_NODE_REQUIRED'),
    sequence: integer(value.sequence, 'RNCS_REPLICATION_SEQUENCE_INVALID'),
    version_root: root(value.version_root ?? value.versionRoot, 'RNCS_REPLICATION_VERSION_ROOT_INVALID'),
    base_version_root: root(value.base_version_root ?? value.baseVersionRoot, 'RNCS_REPLICATION_BASE_VERSION_ROOT_INVALID'),
    consistency_profile,
    consistency_profile_root: profileRoot,
    authority_lease,
    authority_lease_root: leaseRoot,
    epoch: authority_lease?.epoch ?? integer(value.epoch, 'RNCS_REPLICATION_EPOCH_INVALID'),
    fencing_token: authority_lease?.fencing_token ?? integer(value.fencing_token ?? value.fencingToken, 'RNCS_REPLICATION_FENCING_TOKEN_INVALID'),
    authority_receipt_root: value.authority_receipt_root ?? value.authorityReceiptRoot ?? null,
    payload,
    payload_root: rootHash(payload),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

export function createRealityReplicationEnvelope(input = {}) {
  const base = normalizeReplicationEnvelope(input);
  return {...base, envelope_root: rootHash(base)};
}

export function verifyRealityReplicationEnvelope(envelope) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!envelope || typeof envelope !== 'object') return {valid: false, errors: ['RNCS_REPLICATION_ENVELOPE_NOT_OBJECT']};
  try {
    const copy = clone(envelope);
    const envelopeRoot = copy.envelope_root;
    delete copy.envelope_root;
    check(envelope.format === REALITY_REPLICATION_ENVELOPE_FORMAT, 'RNCS_REPLICATION_ENVELOPE_FORMAT_INVALID');
    check(envelope.version === REALITY_DISTRIBUTION_VERSION, 'RNCS_REPLICATION_ENVELOPE_VERSION_INVALID');
    check(REALITY_REPLICATION_MESSAGE_TYPES.includes(envelope.message_type), 'RNCS_REPLICATION_MESSAGE_TYPE_INVALID');
    for (const field of ['message_id', 'world_id', 'shard_id', 'source_node', 'target_node']) check(typeof envelope[field] === 'string' && envelope[field].length > 0, `RNCS_REPLICATION_${field.toUpperCase()}_REQUIRED`);
    check(Number.isSafeInteger(envelope.sequence) && envelope.sequence >= 0, 'RNCS_REPLICATION_SEQUENCE_INVALID');
    check(hex64(envelope.version_root) && hex64(envelope.base_version_root), 'RNCS_REPLICATION_VERSION_ROOT_INVALID');
    if (envelope.consistency_profile !== null) {
      const profileVerification = verifyRealityConsistencyProfile(envelope.consistency_profile);
      check(profileVerification.valid, `RNCS_REPLICATION_CONSISTENCY_PROFILE_INVALID:${profileVerification.errors.join(',')}`);
      check(envelope.consistency_profile_root === envelope.consistency_profile.profile_root, 'RNCS_REPLICATION_CONSISTENCY_PROFILE_ROOT_MISMATCH');
    } else check(envelope.consistency_profile_root === null, 'RNCS_REPLICATION_CONSISTENCY_PROFILE_NULL_ROOT');
    if (envelope.authority_lease !== null) {
      const leaseVerification = verifyAuthorityLease(envelope.authority_lease);
      check(leaseVerification.valid, `RNCS_REPLICATION_AUTHORITY_LEASE_INVALID:${leaseVerification.errors.join(',')}`);
      check(envelope.authority_lease_root === envelope.authority_lease.lease_root, 'RNCS_REPLICATION_AUTHORITY_LEASE_ROOT_MISMATCH');
      check(envelope.epoch === envelope.authority_lease.epoch, 'RNCS_REPLICATION_EPOCH_LEASE_MISMATCH');
      check(envelope.fencing_token === envelope.authority_lease.fencing_token, 'RNCS_REPLICATION_FENCING_LEASE_MISMATCH');
    } else {
      check(envelope.authority_lease_root === null, 'RNCS_REPLICATION_LEASE_NULL_ROOT');
      check(Number.isSafeInteger(envelope.epoch) && envelope.epoch >= 0, 'RNCS_REPLICATION_EPOCH_INVALID');
      check(Number.isSafeInteger(envelope.fencing_token) && envelope.fencing_token >= 0, 'RNCS_REPLICATION_FENCING_TOKEN_INVALID');
    }
    if (envelope.consistency_profile?.lease_required === true) check(envelope.authority_lease !== null, 'RNCS_REPLICATION_LEASE_REQUIRED');
    if (envelope.consistency_profile?.fencing_required === true) check(envelope.authority_lease !== null, 'RNCS_REPLICATION_FENCING_REQUIRED');
    check(envelope.authority_receipt_root === null || hex64(envelope.authority_receipt_root), 'RNCS_REPLICATION_AUTHORITY_RECEIPT_ROOT_INVALID');
    check(envelope.payload && typeof envelope.payload === 'object', 'RNCS_REPLICATION_PAYLOAD_REQUIRED');
    check(rootHash(envelope.payload) === envelope.payload_root, 'RNCS_REPLICATION_PAYLOAD_ROOT_MISMATCH');
    check(envelope.candidate_only === true && envelope.authoritative === false, 'RNCS_REPLICATION_CANDIDATE_REQUIRED');
    check(envelope.commit_status === 'NOT_COMMITTED', 'RNCS_REPLICATION_COMMIT_STATUS_INVALID');
    check(hex64(envelopeRoot) && rootHash(copy) === envelopeRoot, 'RNCS_REPLICATION_ENVELOPE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_REPLICATION_ENVELOPE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, envelope_root: envelope.envelope_root ?? null};
}

export function checkRealityReplicationAdmission(envelope, input = {}) {
  const errors = [];
  const verification = verifyRealityReplicationEnvelope(envelope);
  if (!verification.valid) errors.push(...verification.errors);
  const value = record(input);
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (verification.valid) {
    check(envelope.target_node === String(value.target_node ?? value.targetNode ?? envelope.target_node), 'RNCS_REPLICATION_TARGET_NODE_MISMATCH');
    check(envelope.shard_id === String(value.shard_id ?? value.shardId ?? envelope.shard_id), 'RNCS_REPLICATION_SHARD_ID_MISMATCH');
    const profile = envelope.consistency_profile;
    if (profile?.authority_required === true || profile?.lease_required === true || profile?.fencing_required === true) {
      const receipt = record(value.authority_receipt ?? value.authorityReceipt);
      check(receipt.status === 'committed' && hex64(receipt.receipt_root), 'RNCS_REPLICATION_AUTHORITY_RECEIPT_REQUIRED');
      if (envelope.authority_receipt_root !== null) check(receipt.receipt_root === envelope.authority_receipt_root, 'RNCS_REPLICATION_AUTHORITY_RECEIPT_ROOT_MISMATCH');
    }
    if (profile?.lease_required === true || profile?.fencing_required === true) {
      const leaseResult = checkAuthorityLease(envelope.authority_lease, {
        authority_id: value.authority_id,
        shard_id: envelope.shard_id,
        semantic_scope: value.semantic_scope,
        owner_node: envelope.source_node,
        tick: value.tick,
        current_lease: value.current_lease ?? value.currentLease
      });
      if (!leaseResult.valid) errors.push(...leaseResult.errors);
    }
  }
  return {valid: errors.length === 0, errors, envelope_root: envelope?.envelope_root ?? null};
}
