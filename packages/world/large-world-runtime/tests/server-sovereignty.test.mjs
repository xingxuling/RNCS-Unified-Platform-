import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAuthorityLease,
  createAuthorityLeaseRevocation,
  createRealityConsistencyProfile,
  rootHash,
  verifyServerSovereigntyHandoffReceipt,
  verifyServerSovereigntyMigration
} from '@taowind/rncs-core-contract';
import {LargeWorldRuntime} from '../src/index.mjs';

const options = {
  worldId: 'world:server-sovereignty-test',
  seed: 'seed:server-sovereignty-test',
  width: 5,
  depth: 5,
  chunkSize: 64,
  sampleResolution: 8,
  loadRadius: 1,
  unloadRadius: 1,
  maxActiveChunks: 9
};

function lease(ownerNode, epoch, fencingToken) {
  return createAuthorityLease({
    authority_id: 'authority:world',
    shard_id: 'shard:server-sovereignty-test',
    semantic_scope: 'world:simulation',
    owner_node: ownerNode,
    epoch,
    fencing_token: fencingToken,
    valid_from_tick: 0,
    valid_until_tick: 100,
    provenance_ref: 'urn:test:server-sovereignty:lease',
    authority_ref: 'urn:test:server-sovereignty:authority',
    evidence_refs: ['evidence:test:server-sovereignty']
  });
}

function consistency() {
  return createRealityConsistencyProfile({
    profile_id: 'consistency:server-sovereignty-test',
    mode: 'causal',
    evidence_refs: ['evidence:test:server-sovereignty']
  });
}

function profileFields() {
  return {
    sovereignty_id: 'sovereignty:server-sovereignty-test',
    level: 'CITY_SHARD',
    territory: {kind: 'grid', region: 'city-01'},
    semantic_scope: {include: ['simulation', 'representation']},
    simulation_scope: {include: ['city-01']},
    authority_scope: {operations: ['observe', 'replicate', 'hydrate']},
    resources: {compute_units: 8, memory_mb: 1024, transport_kbps: 1000, energy_milli: 500},
    neighbors: ['shard:city-02'],
    replication_peers: ['node:target'],
    migration_policy: {enabled: true, allowed_targets: ['node:target']},
    failover_policy: {enabled: true, allowed_targets: ['node:target']},
    evidence_refs: ['evidence:test:server-sovereignty']
  };
}

test('executes failover hydration and preserves canonical world truth while fencing the old lease', () => {
  const sourceLease = lease('node:source', 1, 10);
  const targetLease = lease('node:target', 2, 20);
  const source = new LargeWorldRuntime({...options, nodeId: 'node:source', shardId: sourceLease.shard_id, consistencyProfile: consistency(), authorityLease: sourceLease});
  const target = new LargeWorldRuntime({...options, nodeId: 'node:target', shardId: targetLease.shard_id, consistencyProfile: consistency(), authorityLease: targetLease});
  source.createServerSovereigntyProfile({...profileFields(), register: true});
  target.createServerSovereigntyProfile({...profileFields(), register: true});
  source.observe({x: 0, z: 0});
  const eventAuthority = {status: 'committed', receipt_root: rootHash({scope: 'source-event', lease_root: sourceLease.lease_root})};
  source.recordWorldEvent({
    eventId: 'event:server-sovereignty:weather',
    mutation: {operations: [{op: 'set', path: 'weather', value: 'storm'}]},
    authorityReceipt: eventAuthority,
    evidenceRef: rootHash({evidence: 'server-sovereignty:event'})
  });
  const bundle = source.exportDurableBundle();
  const sourceSnapshotRoot = source.exportReplicationSnapshot().snapshot_root;
  const revocation = createAuthorityLeaseRevocation({
    lease: sourceLease,
    revoked_at_tick: source.worldTime.simulation_tick,
    reason: 'source node failure',
    authority_ref: 'urn:test:server-sovereignty:failover',
    evidence_refs: ['evidence:test:server-sovereignty:failure']
  });
  const migration = source.createSovereigntyMigration(target.serverSovereigntyProfile(), {
    kind: 'FAILOVER',
    source_snapshot_root: sourceSnapshotRoot,
    source_revocation: revocation,
    reason: 'source node failure',
    evidence_refs: ['evidence:test:server-sovereignty:migration']
  });
  assert.equal(verifyServerSovereigntyMigration(migration).valid, true);
  const migrationAuthority = {
    status: 'committed',
    receipt_root: rootHash({scope: 'failover', migration_root: migration.migration_root, lease_root: targetLease.lease_root}),
    lease_root: targetLease.lease_root,
    migration_root: migration.migration_root
  };
  const result = target.executeSovereigntyHandoff(migration, {
    durableBundle: bundle,
    authorityReceipt: migrationAuthority,
    evidenceRefs: ['evidence:test:server-sovereignty:handoff']
  });
  assert.equal(result.status, 'COMPLETED');
  assert.equal(verifyServerSovereigntyHandoffReceipt(result.handoff_receipt).valid, true);
  assert.equal(result.handoff_receipt.canonical_owner, 'RNCS');
  assert.equal(result.handoff_receipt.canonical_state_mutated, false);
  assert.equal(target.exportReplicationSnapshot().snapshot_root, sourceSnapshotRoot);
  assert.equal(target.getRegion().world_root, source.getRegion().world_root);

  const base = source.exportReplicationSnapshot();
  source.recordWorldEvent({
    eventId: 'event:server-sovereignty:stale-writer',
    mutation: {operations: [{op: 'set', path: 'weather', value: 'clear'}]},
    authorityReceipt: {status: 'committed', receipt_root: rootHash({scope: 'stale-writer', lease_root: sourceLease.lease_root})},
    evidenceRef: rootHash({evidence: 'server-sovereignty:stale-writer'})
  });
  const staleDelta = source.createReplicationDelta(base, {targetNode: 'node:target'});
  assert.throws(
    () => target.applyReplicationDelta(staleDelta, {authorityReceipt: {status: 'committed', receipt_root: rootHash({scope: 'stale-delta'}), lease_root: sourceLease.lease_root}}),
    /STALE_EPOCH|STALE_FENCING/
  );
});

console.log('large-world server pseudo-sovereignty tests: 1 PASS');
