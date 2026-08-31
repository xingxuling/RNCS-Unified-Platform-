import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAuthorityLease,
  createAuthorityLeaseRevocation,
  createRealityConsistencyProfile,
  rootHash,
  verifyServerSovereigntyHandoffReceipt,
  verifyServerSovereigntyMigration
} from '@taowind/rncs-core-contract';
import {LargeWorldRuntime} from '@taowind/large-world-runtime';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_SERVER_SOVEREIGNTY_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_V03_SERVER_SOVEREIGNTY'));
const options = {
  worldId: 'world:urrf-v03-server-sovereignty',
  seed: 'seed:urrf-v03-server-sovereignty',
  width: 5,
  depth: 5,
  chunkSize: 64,
  sampleResolution: 8,
  loadRadius: 1,
  unloadRadius: 1,
  maxActiveChunks: 9
};

const lease = (ownerNode, epoch, fencingToken) => createAuthorityLease({
  authority_id: 'authority:urrf-v03-world',
  shard_id: 'shard:urrf-v03-city-01',
  semantic_scope: 'world:simulation',
  owner_node: ownerNode,
  epoch,
  fencing_token: fencingToken,
  valid_from_tick: 0,
  valid_until_tick: 100,
  provenance_ref: 'urn:urrf:v03:server-sovereignty:lease',
  authority_ref: 'urn:urrf:v03:server-sovereignty:authority',
  evidence_refs: ['evidence:urrf:v03:server-sovereignty']
});

const profileFields = {
  sovereignty_id: 'sovereignty:urrf-v03-city-01',
  level: 'CITY_SHARD',
  territory: {kind: 'grid', region: 'city-01'},
  semantic_scope: {include: ['simulation', 'representation']},
  simulation_scope: {include: ['city-01']},
  authority_scope: {operations: ['observe', 'replicate', 'hydrate']},
  resources: {compute_units: 8, memory_mb: 1024, transport_kbps: 1000, energy_milli: 500},
  neighbors: ['shard:urrf-v03-city-02'],
  replication_peers: ['node:standby'],
  migration_policy: {enabled: true, allowed_targets: ['node:standby']},
  failover_policy: {enabled: true, allowed_targets: ['node:standby']},
  evidence_refs: ['evidence:urrf:v03:server-sovereignty']
};

test('executes server pseudo-sovereignty failover without losing canonical ownership', () => {
  mkdirSync(outputDir, {recursive: true});
  const sourceLease = lease('node:source', 1, 10);
  const targetLease = lease('node:standby', 2, 20);
  const consistency = createRealityConsistencyProfile({profile_id: 'consistency:urrf-v03-server-sovereignty', mode: 'causal', evidence_refs: ['evidence:urrf:v03:server-sovereignty']});
  const source = new LargeWorldRuntime({...options, nodeId: sourceLease.owner_node, shardId: sourceLease.shard_id, consistencyProfile: consistency, authorityLease: sourceLease});
  const target = new LargeWorldRuntime({...options, nodeId: targetLease.owner_node, shardId: targetLease.shard_id, consistencyProfile: consistency, authorityLease: targetLease});
  source.createServerSovereigntyProfile({...profileFields, register: true});
  target.createServerSovereigntyProfile({...profileFields, replication_peers: ['node:source'], register: true});
  source.observe({x: 0, z: 0});
  source.recordWorldEvent({
    eventId: 'event:urrf-v03:server-sovereignty:weather',
    mutation: {operations: [{op: 'set', path: 'weather', value: 'storm'}]},
    authorityReceipt: {status: 'committed', receipt_root: rootHash({scope: 'event', lease_root: sourceLease.lease_root})},
    evidenceRef: rootHash({evidence: 'urrf-v03:server-sovereignty:event'})
  });
  const bundle = source.exportDurableBundle();
  const sourceSnapshot = source.exportReplicationSnapshot();
  const sourceRevocation = createAuthorityLeaseRevocation({
    lease: sourceLease,
    revoked_at_tick: source.worldTime.simulation_tick,
    reason: 'source node failure',
    authority_ref: 'urn:urrf:v03:server-sovereignty:failover',
    evidence_refs: ['evidence:urrf:v03:server-sovereignty:failure']
  });
  const migration = source.createSovereigntyMigration(target.serverSovereigntyProfile(), {
    kind: 'FAILOVER',
    source_snapshot_root: sourceSnapshot.snapshot_root,
    source_revocation: sourceRevocation,
    reason: 'source node failure',
    evidence_refs: ['evidence:urrf:v03:server-sovereignty:migration']
  });
  assert.equal(verifyServerSovereigntyMigration(migration).valid, true);
  const authorityReceipt = {
    status: 'committed',
    receipt_root: rootHash({scope: 'failover', migration_root: migration.migration_root, lease_root: targetLease.lease_root}),
    lease_root: targetLease.lease_root,
    migration_root: migration.migration_root
  };
  const handoff = target.executeSovereigntyHandoff(migration, {durableBundle: bundle, authorityReceipt, evidenceRefs: ['evidence:urrf:v03:server-sovereignty:handoff']});
  assert.equal(handoff.status, 'COMPLETED');
  assert.equal(verifyServerSovereigntyHandoffReceipt(handoff.handoff_receipt).valid, true);
  const targetSnapshot = target.exportReplicationSnapshot();
  assert.equal(targetSnapshot.snapshot_root, sourceSnapshot.snapshot_root);
  assert.equal(target.getRegion().world_root, source.getRegion().world_root);
  assert.equal(handoff.handoff_receipt.canonical_owner, 'RNCS');
  assert.equal(handoff.handoff_receipt.canonical_state_mutated, false);

  const base = source.exportReplicationSnapshot();
  source.recordWorldEvent({
    eventId: 'event:urrf-v03:server-sovereignty:stale-writer',
    mutation: {operations: [{op: 'set', path: 'weather', value: 'clear'}]},
    authorityReceipt: {status: 'committed', receipt_root: rootHash({scope: 'stale-writer', lease_root: sourceLease.lease_root})},
    evidenceRef: rootHash({evidence: 'urrf-v03:server-sovereignty:stale-writer'})
  });
  const staleDelta = source.createReplicationDelta(base, {targetNode: target.nodeId});
  let staleError = null;
  try {
    target.applyReplicationDelta(staleDelta, {authorityReceipt: {status: 'committed', receipt_root: rootHash({scope: 'stale-delta'}), lease_root: sourceLease.lease_root}});
  } catch (error) {
    staleError = error.message;
  }
  assert.match(staleError ?? '', /STALE_EPOCH|STALE_FENCING/);

  const reportBase = {
    format: 'urrf.v03.server-pseudo-sovereignty-report.v0.1',
    world_id: source.options.worldId,
    shard_id: source.shardId,
    level: migration.level,
    region_root: source.getRegion().region_root,
    world_root: source.getRegion().world_root,
    source_profile_root: migration.source_profile_root,
    target_profile_root: migration.target_profile_root,
    source_lease_root: migration.source_lease_root,
    target_lease_root: migration.target_lease_root,
    source_snapshot_root: sourceSnapshot.snapshot_root,
    target_snapshot_root: targetSnapshot.snapshot_root,
    durable_bundle_root: bundle.bundle_root,
    migration_root: migration.migration_root,
    revocation_root: sourceRevocation.revocation_root,
    handoff_receipt_root: handoff.handoff_receipt.receipt_root,
    restore_receipt_root: handoff.restore_receipt.receipt_root,
    stale_writer_rejected: true,
    stale_writer_error: staleError,
    authority: {
      canonical_owner: 'RNCS',
      regional_execution_authority: 'LEASE_SCOPED_AND_REVOCABLE',
      canonical_write_authorized: false,
      world_root_unchanged: source.getRegion().world_root === target.getRegion().world_root,
      candidate_only: true,
      commit_status: 'NOT_COMMITTED'
    },
    notes: 'Bounded local candidate: a City Shard failover hydrates a pristine standby from a durable canonical snapshot under a newer lease epoch/fencing token. The old lease is rejected after handoff. This is not distributed consensus, production cryptography, network-partition proof, or a legal/political sovereignty claim.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'server-pseudo-sovereignty-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'server-pseudo-sovereignty-report.json')).byteLength > 1500);
});
