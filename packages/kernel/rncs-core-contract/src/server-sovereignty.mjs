import {ContractError, rootHash} from './index.mjs';
import {
  AUTHORITY_LEASE_FORMAT,
  REALITY_DISTRIBUTION_VERSION,
  createAuthorityLease,
  verifyAuthorityLease,
  verifyAuthorityLeaseRevocation
} from './reality-distribution.mjs';

export const SERVER_PSEUDO_SOVEREIGNTY_VERSION = REALITY_DISTRIBUTION_VERSION;
export const SERVER_PSEUDO_SOVEREIGNTY_PROFILE_FORMAT = 'rncs.server-pseudo-sovereignty.v0.3';
export const SERVER_SOVEREIGNTY_MIGRATION_FORMAT = 'rncs.server-sovereignty-migration.v0.3';
export const SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_FORMAT = 'rncs.server-sovereignty-handoff-receipt.v0.3';

export const SERVER_PSEUDO_SOVEREIGNTY_LEVELS = Object.freeze([
  'WORLD_FEDERATION',
  'SUPER_REGION',
  'REGIONAL_SHARD',
  'CITY_SHARD',
  'DISTRICT_SHARD',
  'LOCAL_EXECUTION_UNIT'
]);

export const SERVER_SOVEREIGNTY_MIGRATION_KINDS = Object.freeze(['MIGRATION', 'FAILOVER']);
export const SERVER_SOVEREIGNTY_MIGRATION_STATUSES = Object.freeze(['PLANNED', 'COMPLETED']);

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

function descriptor(value, code) {
  fail(value !== undefined && value !== null, code);
  if (typeof value === 'string') {
    fail(value.length > 0, code);
    return value;
  }
  fail(typeof value === 'object', code);
  return clone(value);
}
function mapDescriptor(value, code) {
  const result = record(value);
  fail(Object.keys(result).length > 0, code);
  return clone(result);
}

function normalizeLease(value) {
  const lease = record(value).lease_root ? clone(value) : createAuthorityLease(value);
  const verification = verifyAuthorityLease(lease);
  fail(verification.valid, `RNCS_SERVER_SOVEREIGNTY_LEASE_INVALID:${verification.errors.join(',')}`);
  return lease;
}

function authorityBoundary() {
  return {
    canonical_owner: 'RNCS',
    canonical_write_authorized: false,
    execution_authority: 'LEASE_SCOPED_AND_REVOCABLE',
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
}

function normalizePolicy(value, fallback) {
  const source = record(value);
  return {
    enabled: source.enabled === undefined ? true : Boolean(source.enabled),
    require_new_epoch: source.require_new_epoch === undefined ? fallback.require_new_epoch : Boolean(source.require_new_epoch),
    require_fencing_advance: source.require_fencing_advance === undefined ? fallback.require_fencing_advance : Boolean(source.require_fencing_advance),
    drain_timeout_ticks: integer(source.drain_timeout_ticks ?? source.drainTimeoutTicks, 'RNCS_SERVER_SOVEREIGNTY_DRAIN_TIMEOUT_INVALID', fallback.drain_timeout_ticks),
    allowed_targets: strings(source.allowed_targets ?? source.allowedTargets),
    evidence_refs: strings(source.evidence_refs ?? source.evidenceRefs)
  };
}

function normalizeProfile(input = {}) {
  const value = record(input);
  const lease = normalizeLease(value.lease ?? value.authority_lease ?? value.authorityLease);
  const epoch = integer(value.epoch, 'RNCS_SERVER_SOVEREIGNTY_EPOCH_INVALID', lease.epoch);
  fail(epoch === lease.epoch, 'RNCS_SERVER_SOVEREIGNTY_EPOCH_LEASE_MISMATCH');
  const level = String(value.level ?? 'REGIONAL_SHARD').toUpperCase();
  fail(SERVER_PSEUDO_SOVEREIGNTY_LEVELS.includes(level), 'RNCS_SERVER_SOVEREIGNTY_LEVEL_INVALID');
  return {
    format: SERVER_PSEUDO_SOVEREIGNTY_PROFILE_FORMAT,
    version: SERVER_PSEUDO_SOVEREIGNTY_VERSION,
    sovereignty_id: text(value.sovereignty_id ?? value.sovereigntyId, 'RNCS_SERVER_SOVEREIGNTY_ID_REQUIRED'),
    world_id: text(value.world_id ?? value.worldId, 'RNCS_SERVER_SOVEREIGNTY_WORLD_ID_REQUIRED'),
    shard_id: text(value.shard_id ?? value.shardId, 'RNCS_SERVER_SOVEREIGNTY_SHARD_ID_REQUIRED'),
    level,
    parent_sovereignty_id: value.parent_sovereignty_id ?? value.parentSovereigntyId ?? null,
    territory: descriptor(value.territory, 'RNCS_SERVER_SOVEREIGNTY_TERRITORY_REQUIRED'),
    semantic_scope: descriptor(value.semantic_scope ?? value.semanticScope, 'RNCS_SERVER_SOVEREIGNTY_SEMANTIC_SCOPE_REQUIRED'),
    simulation_scope: descriptor(value.simulation_scope ?? value.simulationScope, 'RNCS_SERVER_SOVEREIGNTY_SIMULATION_SCOPE_REQUIRED'),
    authority_scope: descriptor(value.authority_scope ?? value.authorityScope, 'RNCS_SERVER_SOVEREIGNTY_AUTHORITY_SCOPE_REQUIRED'),
    lease,
    epoch,
    resources: mapDescriptor(value.resources, 'RNCS_SERVER_SOVEREIGNTY_RESOURCES_REQUIRED'),
    neighbors: strings(value.neighbors),
    replication_peers: strings(value.replication_peers ?? value.replicationPeers),
    migration_policy: normalizePolicy(value.migration_policy ?? value.migrationPolicy, {require_new_epoch: true, require_fencing_advance: true, drain_timeout_ticks: 30}),
    failover_policy: normalizePolicy(value.failover_policy ?? value.failoverPolicy, {require_new_epoch: true, require_fencing_advance: true, drain_timeout_ticks: 0}),
    canonical_world_root: text(value.canonical_world_root ?? value.canonicalWorldRoot, 'RNCS_SERVER_SOVEREIGNTY_CANONICAL_WORLD_ROOT_REQUIRED').toLowerCase(),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs),
    authority: authorityBoundary()
  };
}

export function createServerPseudoSovereigntyProfile(input = {}) {
  const base = normalizeProfile(input);
  fail(hex64(base.canonical_world_root), 'RNCS_SERVER_SOVEREIGNTY_CANONICAL_WORLD_ROOT_INVALID');
  return {...base, profile_root: rootHash(base)};
}

export function verifyServerPseudoSovereigntyProfile(profile) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return {valid: false, errors: ['RNCS_SERVER_SOVEREIGNTY_PROFILE_NOT_OBJECT']};
  try {
    const copy = clone(profile);
    const profileRoot = copy.profile_root;
    delete copy.profile_root;
    check(profile.format === SERVER_PSEUDO_SOVEREIGNTY_PROFILE_FORMAT, 'RNCS_SERVER_SOVEREIGNTY_PROFILE_FORMAT_INVALID');
    check(profile.version === SERVER_PSEUDO_SOVEREIGNTY_VERSION, 'RNCS_SERVER_SOVEREIGNTY_PROFILE_VERSION_INVALID');
    for (const field of ['sovereignty_id', 'world_id', 'shard_id']) check(typeof profile[field] === 'string' && profile[field].length > 0, `RNCS_SERVER_SOVEREIGNTY_${field.toUpperCase()}_REQUIRED`);
    check(SERVER_PSEUDO_SOVEREIGNTY_LEVELS.includes(profile.level), 'RNCS_SERVER_SOVEREIGNTY_LEVEL_INVALID');
    for (const field of ['territory', 'semantic_scope', 'simulation_scope', 'authority_scope']) check(profile[field] !== undefined && profile[field] !== null, `RNCS_SERVER_SOVEREIGNTY_${field.toUpperCase()}_REQUIRED`);
    const leaseVerification = verifyAuthorityLease(profile.lease);
    check(leaseVerification.valid, `RNCS_SERVER_SOVEREIGNTY_LEASE_INVALID:${leaseVerification.errors.join(',')}`);
    check(profile.lease?.format === AUTHORITY_LEASE_FORMAT, 'RNCS_SERVER_SOVEREIGNTY_LEASE_FORMAT_INVALID');
    check(profile.lease?.shard_id === profile.shard_id, 'RNCS_SERVER_SOVEREIGNTY_LEASE_SHARD_MISMATCH');
    check(Number.isSafeInteger(profile.epoch) && profile.epoch >= 0, 'RNCS_SERVER_SOVEREIGNTY_EPOCH_INVALID');
    check(profile.epoch === profile.lease?.epoch, 'RNCS_SERVER_SOVEREIGNTY_EPOCH_LEASE_MISMATCH');
    check(profile.resources && typeof profile.resources === 'object' && !Array.isArray(profile.resources), 'RNCS_SERVER_SOVEREIGNTY_RESOURCES_REQUIRED');
    for (const field of ['neighbors', 'replication_peers', 'evidence_refs']) check(Array.isArray(profile[field]), `RNCS_SERVER_SOVEREIGNTY_${field.toUpperCase()}_ARRAY_REQUIRED`);
    for (const field of ['migration_policy', 'failover_policy']) {
      check(profile[field] && typeof profile[field] === 'object' && !Array.isArray(profile[field]), `RNCS_SERVER_SOVEREIGNTY_${field.toUpperCase()}_REQUIRED`);
      check(typeof profile[field]?.enabled === 'boolean', `RNCS_SERVER_SOVEREIGNTY_${field.toUpperCase()}_ENABLED_INVALID`);
      check(typeof profile[field]?.require_new_epoch === 'boolean', `RNCS_SERVER_SOVEREIGNTY_${field.toUpperCase()}_EPOCH_POLICY_INVALID`);
      check(typeof profile[field]?.require_fencing_advance === 'boolean', `RNCS_SERVER_SOVEREIGNTY_${field.toUpperCase()}_FENCING_POLICY_INVALID`);
      check(Number.isSafeInteger(profile[field]?.drain_timeout_ticks) && profile[field].drain_timeout_ticks >= 0, `RNCS_SERVER_SOVEREIGNTY_${field.toUpperCase()}_DRAIN_TIMEOUT_INVALID`);
      check(Array.isArray(profile[field]?.allowed_targets) && Array.isArray(profile[field]?.evidence_refs), `RNCS_SERVER_SOVEREIGNTY_${field.toUpperCase()}_ARRAY_INVALID`);
    }
    check(hex64(profile.canonical_world_root), 'RNCS_SERVER_SOVEREIGNTY_CANONICAL_WORLD_ROOT_INVALID');
    check(profile.authority?.canonical_owner === 'RNCS', 'RNCS_SERVER_SOVEREIGNTY_CANONICAL_OWNER_INVALID');
    check(profile.authority?.canonical_write_authorized === false, 'RNCS_SERVER_SOVEREIGNTY_CANONICAL_WRITE_ESCALATION');
    check(profile.authority?.execution_authority === 'LEASE_SCOPED_AND_REVOCABLE', 'RNCS_SERVER_SOVEREIGNTY_EXECUTION_AUTHORITY_INVALID');
    check(profile.authority?.candidate_only === true && profile.authority?.authoritative === false, 'RNCS_SERVER_SOVEREIGNTY_CANDIDATE_REQUIRED');
    check(profile.authority?.commit_status === 'NOT_COMMITTED', 'RNCS_SERVER_SOVEREIGNTY_COMMIT_STATUS_INVALID');
    check(hex64(profileRoot) && rootHash(copy) === profileRoot, 'RNCS_SERVER_SOVEREIGNTY_PROFILE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_SERVER_SOVEREIGNTY_PROFILE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, profile_root: profile.profile_root ?? null};
}

function normalizeMigration(input = {}) {
  const value = record(input);
  const sourceProfile = clone(value.source_profile ?? value.sourceProfile);
  const targetProfile = clone(value.target_profile ?? value.targetProfile);
  const sourceVerification = verifyServerPseudoSovereigntyProfile(sourceProfile);
  const targetVerification = verifyServerPseudoSovereigntyProfile(targetProfile);
  fail(sourceVerification.valid, `RNCS_SERVER_SOVEREIGNTY_SOURCE_PROFILE_INVALID:${sourceVerification.errors.join(',')}`);
  fail(targetVerification.valid, `RNCS_SERVER_SOVEREIGNTY_TARGET_PROFILE_INVALID:${targetVerification.errors.join(',')}`);
  fail(sourceProfile.world_id === targetProfile.world_id, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_WORLD_MISMATCH');
  fail(sourceProfile.shard_id === targetProfile.shard_id, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_SHARD_MISMATCH');
  fail(sourceProfile.sovereignty_id === targetProfile.sovereignty_id, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_ID_MISMATCH');
  fail(sourceProfile.level === targetProfile.level, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_LEVEL_MISMATCH');
  fail(sourceProfile.canonical_world_root === targetProfile.canonical_world_root, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_WORLD_ROOT_MISMATCH');
  const kind = String(value.kind ?? 'MIGRATION').toUpperCase();
  fail(SERVER_SOVEREIGNTY_MIGRATION_KINDS.includes(kind), 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_KIND_INVALID');
  const sourceNode = text(value.source_node ?? value.sourceNode, 'RNCS_SERVER_SOVEREIGNTY_SOURCE_NODE_REQUIRED', sourceProfile.lease.owner_node);
  const targetNode = text(value.target_node ?? value.targetNode, 'RNCS_SERVER_SOVEREIGNTY_TARGET_NODE_REQUIRED', targetProfile.lease.owner_node);
  fail(sourceProfile.lease.owner_node === sourceNode, 'RNCS_SERVER_SOVEREIGNTY_SOURCE_NODE_LEASE_MISMATCH');
  fail(targetProfile.lease.owner_node === targetNode, 'RNCS_SERVER_SOVEREIGNTY_TARGET_NODE_LEASE_MISMATCH');
  fail(targetNode !== sourceNode, 'RNCS_SERVER_SOVEREIGNTY_TARGET_NODE_NOT_DISTINCT');
  fail(targetProfile.lease.status === 'ACTIVE', 'RNCS_SERVER_SOVEREIGNTY_TARGET_LEASE_NOT_ACTIVE');
  fail(targetProfile.epoch > sourceProfile.epoch, 'RNCS_SERVER_SOVEREIGNTY_TARGET_EPOCH_NOT_ADVANCED');
  fail(targetProfile.lease.fencing_token > sourceProfile.lease.fencing_token, 'RNCS_SERVER_SOVEREIGNTY_TARGET_FENCING_NOT_ADVANCED');
  const sourceRevocation = value.source_revocation ?? value.sourceRevocation ?? null;
  if (kind === 'FAILOVER') {
    const revocationVerification = verifyAuthorityLeaseRevocation(sourceRevocation);
    fail(revocationVerification.valid, `RNCS_SERVER_SOVEREIGNTY_SOURCE_REVOCATION_INVALID:${revocationVerification.errors.join(',')}`);
    fail(sourceRevocation.lease_root === sourceProfile.lease.lease_root, 'RNCS_SERVER_SOVEREIGNTY_SOURCE_REVOCATION_LEASE_MISMATCH');
    fail(sourceRevocation.epoch === sourceProfile.epoch && sourceRevocation.fencing_token === sourceProfile.lease.fencing_token, 'RNCS_SERVER_SOVEREIGNTY_SOURCE_REVOCATION_FENCE_MISMATCH');
  } else fail(sourceRevocation === null || sourceRevocation === undefined, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_REVOCATION_UNEXPECTED');
  const sourceSnapshotRoot = text(value.source_snapshot_root ?? value.sourceSnapshotRoot, 'RNCS_SERVER_SOVEREIGNTY_SOURCE_SNAPSHOT_ROOT_REQUIRED').toLowerCase();
  fail(hex64(sourceSnapshotRoot), 'RNCS_SERVER_SOVEREIGNTY_SOURCE_SNAPSHOT_ROOT_INVALID');
  return {
    format: SERVER_SOVEREIGNTY_MIGRATION_FORMAT,
    version: SERVER_PSEUDO_SOVEREIGNTY_VERSION,
    migration_id: text(value.migration_id ?? value.migrationId, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_ID_REQUIRED', `sovereignty:${kind.toLowerCase()}:${sourceSnapshotRoot.slice(0, 24)}`),
    kind,
    status: 'PLANNED',
    sovereignty_id: sourceProfile.sovereignty_id,
    world_id: sourceProfile.world_id,
    shard_id: sourceProfile.shard_id,
    level: sourceProfile.level,
    source_node: sourceNode,
    target_node: targetNode,
    source_profile: sourceProfile,
    target_profile: targetProfile,
    source_profile_root: sourceProfile.profile_root,
    target_profile_root: targetProfile.profile_root,
    source_lease_root: sourceProfile.lease.lease_root,
    target_lease_root: targetProfile.lease.lease_root,
    source_epoch: sourceProfile.epoch,
    target_epoch: targetProfile.epoch,
    source_fencing_token: sourceProfile.lease.fencing_token,
    target_fencing_token: targetProfile.lease.fencing_token,
    source_snapshot_root: sourceSnapshotRoot,
    target_snapshot_root: null,
    source_revocation: sourceRevocation ? clone(sourceRevocation) : null,
    reason: text(value.reason, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_REASON_REQUIRED'),
    source_status: kind === 'FAILOVER' ? 'FAILED' : 'DRAINING',
    canonical_world_root: sourceProfile.canonical_world_root,
    canonical_owner: 'RNCS',
    authority: authorityBoundary(),
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs)
  };
}

export function createServerSovereigntyMigration(input = {}) {
  const base = normalizeMigration(input);
  return {...base, migration_root: rootHash(base)};
}

export function verifyServerSovereigntyMigration(migration) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!migration || typeof migration !== 'object' || Array.isArray(migration)) return {valid: false, errors: ['RNCS_SERVER_SOVEREIGNTY_MIGRATION_NOT_OBJECT']};
  try {
    const copy = clone(migration);
    const migrationRoot = copy.migration_root;
    delete copy.migration_root;
    check(migration.format === SERVER_SOVEREIGNTY_MIGRATION_FORMAT, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_FORMAT_INVALID');
    check(migration.version === SERVER_PSEUDO_SOVEREIGNTY_VERSION, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_VERSION_INVALID');
    check(SERVER_SOVEREIGNTY_MIGRATION_KINDS.includes(migration.kind), 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_KIND_INVALID');
    check(SERVER_SOVEREIGNTY_MIGRATION_STATUSES.includes(migration.status), 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_STATUS_INVALID');
    for (const field of ['migration_id', 'sovereignty_id', 'world_id', 'shard_id', 'level', 'source_node', 'target_node', 'reason', 'canonical_owner']) check(typeof migration[field] === 'string' && migration[field].length > 0, `RNCS_SERVER_SOVEREIGNTY_MIGRATION_${field.toUpperCase()}_REQUIRED`);
    check(SERVER_PSEUDO_SOVEREIGNTY_LEVELS.includes(migration.level), 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_LEVEL_INVALID');
    const sourceVerification = verifyServerPseudoSovereigntyProfile(migration.source_profile);
    const targetVerification = verifyServerPseudoSovereigntyProfile(migration.target_profile);
    check(sourceVerification.valid, `RNCS_SERVER_SOVEREIGNTY_MIGRATION_SOURCE_PROFILE_INVALID:${sourceVerification.errors.join(',')}`);
    check(targetVerification.valid, `RNCS_SERVER_SOVEREIGNTY_MIGRATION_TARGET_PROFILE_INVALID:${targetVerification.errors.join(',')}`);
    check(migration.source_profile_root === migration.source_profile?.profile_root && migration.source_profile_root === sourceVerification.profile_root, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_SOURCE_PROFILE_ROOT_MISMATCH');
    check(migration.target_profile_root === migration.target_profile?.profile_root && migration.target_profile_root === targetVerification.profile_root, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_TARGET_PROFILE_ROOT_MISMATCH');
    check(migration.source_profile?.world_id === migration.target_profile?.world_id && migration.world_id === migration.source_profile?.world_id, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_WORLD_MISMATCH');
    check(migration.source_profile?.shard_id === migration.target_profile?.shard_id && migration.shard_id === migration.source_profile?.shard_id, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_SHARD_MISMATCH');
    check(migration.source_profile?.sovereignty_id === migration.target_profile?.sovereignty_id && migration.sovereignty_id === migration.source_profile?.sovereignty_id, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_ID_MISMATCH');
    check(migration.source_profile?.level === migration.target_profile?.level && migration.level === migration.source_profile?.level, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_LEVEL_MISMATCH');
    check(migration.source_node !== migration.target_node, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_TARGET_NODE_NOT_DISTINCT');
    check(migration.source_node === migration.source_profile?.lease?.owner_node, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_SOURCE_NODE_MISMATCH');
    check(migration.target_node === migration.target_profile?.lease?.owner_node, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_TARGET_NODE_MISMATCH');
    check(migration.source_lease_root === migration.source_profile?.lease?.lease_root, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_SOURCE_LEASE_ROOT_MISMATCH');
    check(migration.target_lease_root === migration.target_profile?.lease?.lease_root, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_TARGET_LEASE_ROOT_MISMATCH');
    check(migration.source_epoch === migration.source_profile?.epoch && migration.target_epoch === migration.target_profile?.epoch, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_EPOCH_BINDING_INVALID');
    check(migration.source_fencing_token === migration.source_profile?.lease?.fencing_token && migration.target_fencing_token === migration.target_profile?.lease?.fencing_token, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_FENCING_BINDING_INVALID');
    check(migration.target_profile?.lease?.status === 'ACTIVE', 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_TARGET_LEASE_NOT_ACTIVE');
    check(Number.isSafeInteger(migration.source_epoch) && Number.isSafeInteger(migration.target_epoch) && migration.target_epoch > migration.source_epoch, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_EPOCH_NOT_ADVANCED');
    check(Number.isSafeInteger(migration.source_fencing_token) && Number.isSafeInteger(migration.target_fencing_token) && migration.target_fencing_token > migration.source_fencing_token, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_FENCING_NOT_ADVANCED');
    check(hex64(migration.source_snapshot_root), 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_SOURCE_SNAPSHOT_ROOT_INVALID');
    check(migration.target_snapshot_root === null || hex64(migration.target_snapshot_root), 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_TARGET_SNAPSHOT_ROOT_INVALID');
    check(migration.canonical_world_root === migration.source_profile?.canonical_world_root && migration.canonical_world_root === migration.target_profile?.canonical_world_root, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_CANONICAL_ROOT_MISMATCH');
    if (migration.kind === 'FAILOVER') {
      const revocationVerification = verifyAuthorityLeaseRevocation(migration.source_revocation);
      check(revocationVerification.valid, `RNCS_SERVER_SOVEREIGNTY_MIGRATION_REVOCATION_INVALID:${revocationVerification.errors.join(',')}`);
      check(migration.source_revocation?.lease_root === migration.source_lease_root, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_REVOCATION_LEASE_MISMATCH');
      check(migration.source_status === 'FAILED', 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_FAILOVER_STATUS_INVALID');
    } else {
      check(migration.source_revocation === null, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_REVOCATION_UNEXPECTED');
      check(migration.source_status === 'DRAINING', 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_DRAIN_STATUS_INVALID');
    }
    check(Array.isArray(migration.evidence_refs), 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_EVIDENCE_REFS_REQUIRED');
    check(migration.canonical_owner === 'RNCS', 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_CANONICAL_OWNER_INVALID');
    check(migration.authority?.canonical_write_authorized === false && migration.authority?.candidate_only === true && migration.authority?.authoritative === false, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_AUTHORITY_ESCALATION');
    check(migration.authority?.commit_status === 'NOT_COMMITTED', 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_COMMIT_STATUS_INVALID');
    check(hex64(migrationRoot) && rootHash(copy) === migrationRoot, 'RNCS_SERVER_SOVEREIGNTY_MIGRATION_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_SERVER_SOVEREIGNTY_MIGRATION_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, migration_root: migration.migration_root ?? null};
}

export function createServerSovereigntyHandoffReceipt(input = {}) {
  const value = record(input);
  const migration = clone(value.migration);
  const migrationVerification = verifyServerSovereigntyMigration(migration);
  fail(migrationVerification.valid, `RNCS_SERVER_SOVEREIGNTY_HANDOFF_MIGRATION_INVALID:${migrationVerification.errors.join(',')}`);
  const authorityReceipt = clone(value.authority_receipt ?? value.authorityReceipt);
  fail(authorityReceipt?.status === 'committed' && hex64(authorityReceipt?.receipt_root), 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_AUTHORITY_RECEIPT_REQUIRED');
  const sourceSnapshotRoot = text(value.source_snapshot_root ?? value.sourceSnapshotRoot, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_SOURCE_SNAPSHOT_ROOT_REQUIRED').toLowerCase();
  const targetSnapshotRoot = text(value.target_snapshot_root ?? value.targetSnapshotRoot, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_TARGET_SNAPSHOT_ROOT_REQUIRED').toLowerCase();
  const bundleRoot = text(value.durable_bundle_root ?? value.durableBundleRoot, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_BUNDLE_ROOT_REQUIRED').toLowerCase();
  const restoreReceiptRoot = text(value.restore_receipt_root ?? value.restoreReceiptRoot, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RESTORE_ROOT_REQUIRED').toLowerCase();
  for (const [name, root] of [['source_snapshot_root', sourceSnapshotRoot], ['target_snapshot_root', targetSnapshotRoot], ['durable_bundle_root', bundleRoot], ['restore_receipt_root', restoreReceiptRoot]]) fail(hex64(root), `RNCS_SERVER_SOVEREIGNTY_HANDOFF_${name.toUpperCase()}_INVALID`);
  fail(sourceSnapshotRoot === migration.source_snapshot_root, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_SOURCE_SNAPSHOT_MISMATCH');
  const base = {
    format: SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_FORMAT,
    version: SERVER_PSEUDO_SOVEREIGNTY_VERSION,
    receipt_id: text(value.receipt_id ?? value.receiptId, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_ID_REQUIRED', `handoff:${migration.migration_root}`),
    migration_root: migration.migration_root,
    migration_id: migration.migration_id,
    kind: migration.kind,
    world_id: migration.world_id,
    shard_id: migration.shard_id,
    source_node: migration.source_node,
    target_node: migration.target_node,
    source_lease_root: migration.source_lease_root,
    target_lease_root: migration.target_lease_root,
    source_snapshot_root: sourceSnapshotRoot,
    target_snapshot_root: targetSnapshotRoot,
    durable_bundle_root: bundleRoot,
    restore_receipt_root: restoreReceiptRoot,
    authority_receipt: authorityReceipt,
    canonical_world_root: migration.canonical_world_root,
    canonical_owner: 'RNCS',
    state_hydrated: true,
    canonical_state_mutated: false,
    authority: {
      canonical_owner: 'RNCS',
      canonical_write_authorized: false,
      execution_authority: 'LEASE_SCOPED_AND_REVOCABLE',
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    },
    status: 'COMPLETED',
    evidence_refs: strings(value.evidence_refs ?? value.evidenceRefs)
  };
  return {...base, receipt_root: rootHash(base)};
}

export function verifyServerSovereigntyHandoffReceipt(receipt) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) return {valid: false, errors: ['RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_NOT_OBJECT']};
  try {
    const copy = clone(receipt);
    const receiptRoot = copy.receipt_root;
    delete copy.receipt_root;
    check(receipt.format === SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_FORMAT, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_FORMAT_INVALID');
    check(receipt.version === SERVER_PSEUDO_SOVEREIGNTY_VERSION, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_VERSION_INVALID');
    check(receipt.status === 'COMPLETED', 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_STATUS_INVALID');
    for (const field of ['migration_root', 'source_lease_root', 'target_lease_root', 'source_snapshot_root', 'target_snapshot_root', 'durable_bundle_root', 'restore_receipt_root', 'canonical_world_root']) check(hex64(receipt[field]), `RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_${field.toUpperCase()}_INVALID`);
    check(receipt.authority_receipt?.status === 'committed' && hex64(receipt.authority_receipt?.receipt_root), 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_AUTHORITY_INVALID');
    check(receipt.state_hydrated === true, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_HYDRATION_INVALID');
    check(receipt.canonical_state_mutated === false, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_CANONICAL_MUTATION');
    check(receipt.canonical_owner === 'RNCS' && receipt.authority?.canonical_owner === 'RNCS', 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_CANONICAL_OWNER_INVALID');
    check(receipt.authority?.canonical_write_authorized === false && receipt.authority?.candidate_only === true && receipt.authority?.authoritative === false, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_AUTHORITY_ESCALATION');
    check(receipt.authority?.commit_status === 'NOT_COMMITTED', 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_COMMIT_STATUS_INVALID');
    check(Array.isArray(receipt.evidence_refs), 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_EVIDENCE_REFS_REQUIRED');
    check(hex64(receiptRoot) && rootHash(copy) === receiptRoot, 'RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`RNCS_SERVER_SOVEREIGNTY_HANDOFF_RECEIPT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root ?? null};
}
