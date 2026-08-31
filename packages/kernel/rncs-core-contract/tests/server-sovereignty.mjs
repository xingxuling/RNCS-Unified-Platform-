import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SERVER_PSEUDO_SOVEREIGNTY_LEVELS,
  createAuthorityLease,
  createAuthorityLeaseRevocation,
  createServerPseudoSovereigntyProfile,
  createServerSovereigntyHandoffReceipt,
  createServerSovereigntyMigration,
  verifyServerPseudoSovereigntyProfile,
  verifyServerSovereigntyHandoffReceipt,
  verifyServerSovereigntyMigration
} from '../src/index.mjs';

const root = letter => letter.repeat(64);

function lease(ownerNode, overrides = {}) {
  return createAuthorityLease({
    authority_id: 'authority:world',
    shard_id: 'shard:city-01',
    semantic_scope: 'world:simulation',
    owner_node: ownerNode,
    epoch: 1,
    fencing_token: 10,
    valid_from_tick: 0,
    valid_until_tick: 100,
    provenance_ref: 'urn:test:sovereignty:lease',
    authority_ref: 'urn:test:sovereignty:authority',
    evidence_refs: ['evidence:test:sovereignty'],
    ...overrides
  });
}

function profile(ownerNode, overrides = {}) {
  return createServerPseudoSovereigntyProfile({
    sovereignty_id: 'sovereignty:city-01',
    world_id: 'world:test',
    shard_id: 'shard:city-01',
    level: 'CITY_SHARD',
    territory: {kind: 'grid', region: 'city-01'},
    semantic_scope: {include: ['simulation', 'representation']},
    simulation_scope: {include: ['city-01']},
    authority_scope: {operations: ['observe', 'replicate']},
    lease: lease(ownerNode),
    resources: {compute_units: 8, memory_mb: 1024, transport_kbps: 1000, energy_milli: 500},
    neighbors: ['shard:city-02'],
    replication_peers: ['node:standby'],
    migration_policy: {enabled: true, allowed_targets: ['node:target']},
    failover_policy: {enabled: true, allowed_targets: ['node:target']},
    canonical_world_root: root('a'),
    evidence_refs: ['evidence:test:profile'],
    ...overrides
  });
}

test('seals the six-level server pseudo-sovereignty profile and keeps RNCS canonical ownership', () => {
  const value = profile('node:source');
  assert.equal(verifyServerPseudoSovereigntyProfile(value).valid, true);
  assert.deepEqual(SERVER_PSEUDO_SOVEREIGNTY_LEVELS, ['WORLD_FEDERATION', 'SUPER_REGION', 'REGIONAL_SHARD', 'CITY_SHARD', 'DISTRICT_SHARD', 'LOCAL_EXECUTION_UNIT']);
  assert.equal(value.epoch, value.lease.epoch);
  assert.equal(value.authority.canonical_owner, 'RNCS');
  assert.equal(value.authority.canonical_write_authorized, false);
  const tampered = structuredClone(value);
  tampered.authority.canonical_write_authorized = true;
  assert.equal(verifyServerPseudoSovereigntyProfile(tampered).valid, false);
});

test('requires a strictly newer epoch and fencing token for a migration', () => {
  const source = profile('node:source');
  const target = profile('node:target', {lease: lease('node:target', {epoch: 2, fencing_token: 20})});
  const migration = createServerSovereigntyMigration({
    kind: 'MIGRATION',
    source_profile: source,
    target_profile: target,
    source_snapshot_root: root('b'),
    reason: 'planned drain',
    evidence_refs: ['evidence:test:migration']
  });
  assert.equal(verifyServerSovereigntyMigration(migration).valid, true);
  assert.equal(migration.source_status, 'DRAINING');
  const stale = structuredClone(migration);
  stale.target_epoch = 1;
  assert.equal(verifyServerSovereigntyMigration(stale).valid, false);
});

test('requires a lease revocation for failover and fences the old writer', () => {
  const sourceLease = lease('node:source');
  const source = profile('node:source', {lease: sourceLease});
  const target = profile('node:target', {lease: lease('node:target', {epoch: 2, fencing_token: 20})});
  const revocation = createAuthorityLeaseRevocation({
    lease: sourceLease,
    revoked_at_tick: 12,
    reason: 'source node failure',
    authority_ref: 'urn:test:sovereignty:failover-authority',
    evidence_refs: ['evidence:test:failure']
  });
  const failover = createServerSovereigntyMigration({
    kind: 'FAILOVER',
    source_profile: source,
    target_profile: target,
    source_snapshot_root: root('c'),
    source_revocation: revocation,
    reason: 'source node failure',
    evidence_refs: ['evidence:test:failover']
  });
  assert.equal(verifyServerSovereigntyMigration(failover).valid, true);
  assert.equal(failover.source_status, 'FAILED');
  const missing = structuredClone(failover);
  missing.source_revocation = null;
  assert.equal(verifyServerSovereigntyMigration(missing).valid, false);
});

test('seals a hydration receipt without transferring canonical ownership', () => {
  const source = profile('node:source');
  const target = profile('node:target', {lease: lease('node:target', {epoch: 2, fencing_token: 20})});
  const migration = createServerSovereigntyMigration({
    kind: 'MIGRATION',
    source_profile: source,
    target_profile: target,
    source_snapshot_root: root('d'),
    reason: 'planned drain'
  });
  const receipt = createServerSovereigntyHandoffReceipt({
    migration,
    source_snapshot_root: root('d'),
    target_snapshot_root: root('e'),
    durable_bundle_root: root('f'),
    restore_receipt_root: root('0'),
    authority_receipt: {status: 'committed', receipt_root: root('1')},
    evidence_refs: ['evidence:test:handoff']
  });
  assert.equal(verifyServerSovereigntyHandoffReceipt(receipt).valid, true);
  assert.equal(receipt.state_hydrated, true);
  assert.equal(receipt.canonical_state_mutated, false);
  assert.equal(receipt.authority.canonical_owner, 'RNCS');
  const tampered = structuredClone(receipt);
  tampered.target_node = 'node:intruder';
  assert.equal(verifyServerSovereigntyHandoffReceipt(tampered).valid, false);
});

console.log('server pseudo-sovereignty contract tests: 4 PASS');
