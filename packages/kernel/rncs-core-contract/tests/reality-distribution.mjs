import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkAuthorityLease,
  checkRealityReplicationAdmission,
  createAuthorityLease,
  createAuthorityLeaseRevocation,
  createRealityConsistencyProfile,
  createRealityReplicationEnvelope,
  verifyAuthorityLease,
  verifyAuthorityLeaseRevocation,
  verifyRealityConsistencyProfile,
  verifyRealityReplicationEnvelope
} from '../src/index.mjs';

const refs = {
  provenance_ref: 'urn:test:lease-provenance',
  authority_ref: 'urn:test:lease-authority',
  evidence_refs: ['evidence:test:lease']
};

function profile() {
  return createRealityConsistencyProfile({
    profile_id: 'consistency:simulation',
    mode: 'causal',
    stale_read_budget_ms: 500,
    conflict_policy: 'reject-stale',
    retry_policy: {max_attempts: 4, backoff_ms: 25, mode: 'exponential'},
    evidence_refs: ['evidence:test:consistency']
  });
}

function lease(overrides = {}) {
  return createAuthorityLease({
    authority_id: 'authority:world',
    shard_id: 'shard:hk-03',
    semantic_scope: 'simulation',
    owner_node: 'node:source',
    epoch: 7,
    fencing_token: 99,
    valid_from_tick: 0,
    valid_until_tick: 100,
    ...refs,
    ...overrides
  });
}

test('seals consistency profiles and rejects tampering', () => {
  const value = profile();
  assert.equal(verifyRealityConsistencyProfile(value).valid, true);
  value.retry_policy.max_attempts = 99;
  assert.equal(verifyRealityConsistencyProfile(value).valid, false);
});

test('admits an active lease and fences stale, expired, or revoked authority', () => {
  const current = lease();
  assert.equal(verifyAuthorityLease(current).valid, true);
  assert.equal(checkAuthorityLease(current, {
    authority_id: 'authority:world',
    shard_id: 'shard:hk-03',
    semantic_scope: 'simulation',
    owner_node: 'node:source',
    tick: 10,
    current_lease: current
  }).valid, true);
  const stale = lease({epoch: 6, fencing_token: 98});
  const staleResult = checkAuthorityLease(stale, {tick: 10, current_lease: current});
  assert.equal(staleResult.valid, false);
  assert.ok(staleResult.errors.includes('RNCS_AUTHORITY_LEASE_STALE_EPOCH'));
  const revoked = lease({status: 'REVOKED', revoked_at_tick: 20});
  assert.equal(checkAuthorityLease(revoked, {tick: 21}).valid, false);
  const expired = lease({valid_until_tick: 10});
  assert.equal(checkAuthorityLease(expired, {tick: 10}).valid, false);
});

test('seals an explicit lease revocation without granting commit authority', () => {
  const value = createAuthorityLeaseRevocation({
    lease: lease(),
    revoked_at_tick: 40,
    reason: 'operator rotation',
    authority_ref: 'urn:test:revocation-authority',
    evidence_refs: ['evidence:test:revocation']
  });
  assert.equal(verifyAuthorityLeaseRevocation(value).valid, true);
  assert.equal(value.candidate_only, true);
  assert.equal(value.commit_status, 'NOT_COMMITTED');
});

test('binds replication to version roots, lease fencing, and an authority receipt', () => {
  const consistency_profile = profile();
  const authority_lease = lease();
  const authority_receipt_root = 'c'.repeat(64);
  const envelope = createRealityReplicationEnvelope({
    message_type: 'STATE_DELTA',
    message_id: 'replication:state:1',
    world_id: 'world:test',
    shard_id: authority_lease.shard_id,
    source_node: authority_lease.owner_node,
    target_node: 'node:target',
    sequence: 1,
    version_root: 'a'.repeat(64),
    base_version_root: 'b'.repeat(64),
    consistency_profile,
    authority_lease,
    authority_receipt_root,
    payload: {events: [{event_id: 'event:1', state_root: 'a'.repeat(64)}]}
  });
  assert.equal(verifyRealityReplicationEnvelope(envelope).valid, true);
  assert.equal(checkRealityReplicationAdmission(envelope, {
    target_node: 'node:target',
    authority_id: authority_lease.authority_id,
    semantic_scope: authority_lease.semantic_scope,
    tick: 12,
    current_lease: authority_lease,
    authority_receipt: {status: 'committed', receipt_root: authority_receipt_root}
  }).valid, true);
  const tampered = structuredClone(envelope);
  tampered.fencing_token += 1;
  assert.equal(verifyRealityReplicationEnvelope(tampered).valid, false);
});

console.log('reality distribution contract tests: 4 PASS');
