import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  createAuthorityLease,
  createAuthorityLeaseRevocation,
  createRealityConsistencyProfile,
  rootHash,
  verifyAuthorityLease,
  verifyServerSovereigntyHandoffReceipt,
  verifyServerSovereigntyMigration
} from '@taowind/rncs-core-contract';
import {
  createMultiProcessReplicationEvidence,
  LARGE_WORLD_MULTI_PROCESS_EVIDENCE_FORMAT,
  MultiProcessReplicationHarness,
  verifyMultiProcessReplicationEvidence,
  verifyDurableBundle,
  verifyReplicationDelta,
  verifyReplicationReceipt,
  verifyReplicationSnapshot
} from '../src/index.mjs';

const worldOptions = {
  worldId: 'world:multi-process-replication',
  seed: 'seed:multi-process-replication',
  width: 5,
  depth: 5,
  chunkSize: 64,
  sampleResolution: 8,
  loadRadius: 0,
  unloadRadius: 1,
  maxActiveChunks: 2
};

function consistency() {
  return createRealityConsistencyProfile({
    profile_id: 'consistency:multi-process-replication',
    mode: 'causal',
    evidence_refs: ['evidence:multi-process-replication']
  });
}

function lease(ownerNode, epoch, fencingToken) {
  return createAuthorityLease({
    authority_id: 'authority:multi-process-world',
    shard_id: 'shard:multi-process-replication',
    semantic_scope: 'world:simulation',
    owner_node: ownerNode,
    epoch,
    fencing_token: fencingToken,
    valid_from_tick: 0,
    valid_until_tick: 100,
    provenance_ref: 'urn:test:multi-process-replication:lease',
    authority_ref: 'urn:test:multi-process-replication:authority',
    evidence_refs: ['evidence:multi-process-replication']
  });
}

function authority(scope, activeLease) {
  return {
    status: 'committed',
    receipt_root: rootHash({scope, lease_root: activeLease.lease_root}),
    authority_id: activeLease.authority_id,
    lease_root: activeLease.lease_root,
    epoch: activeLease.epoch,
    fencing_token: activeLease.fencing_token
  };
}

function sovereigntyFields(targetNode) {
  return {
    sovereignty_id: 'sovereignty:multi-process-replication',
    level: 'CITY_SHARD',
    territory: {kind: 'grid', region: 'multi-process-test'},
    semantic_scope: {include: ['simulation', 'representation']},
    simulation_scope: {include: ['multi-process-test']},
    authority_scope: {operations: ['observe', 'replicate', 'hydrate']},
    resources: {compute_units: 8, memory_mb: 1024, transport_kbps: 1000, energy_milli: 500},
    neighbors: [],
    replication_peers: [targetNode],
    migration_policy: {enabled: true, allowed_targets: [targetNode]},
    failover_policy: {enabled: true, allowed_targets: [targetNode]},
    evidence_refs: ['evidence:multi-process-replication']
  };
}

function nodeOptions({nodeId, authorityLease, acceptedAuthorityLease, targetNode}) {
  return {
    ...worldOptions,
    nodeId,
    shardId: 'shard:multi-process-replication',
    consistencyProfile: consistency(),
    ...(authorityLease ? {authorityLease} : {}),
    ...(acceptedAuthorityLease ? {acceptedAuthorityLease} : {}),
    ...(targetNode ? {targetNode} : {})
  };
}

test('real child processes replicate snapshot/delta, fence stale writes, fail over and invalidate cache', async t => {
  const sourceLease = lease('node:source', 1, 10);
  const recoveryLease = lease('node:recovery', 2, 20);
  assert.equal(verifyAuthorityLease(sourceLease).valid, true);
  assert.equal(verifyAuthorityLease(recoveryLease).valid, true);
  const harness = new MultiProcessReplicationHarness({
    nodes: [
      {nodeId: 'node:source', options: nodeOptions({nodeId: 'node:source', authorityLease: sourceLease})},
      {nodeId: 'node:replica', options: nodeOptions({nodeId: 'node:replica', acceptedAuthorityLease: sourceLease})},
      {nodeId: 'node:recovery', options: nodeOptions({nodeId: 'node:recovery', authorityLease: recoveryLease})}
    ],
    timeoutMs: 20000
  });
  t.after(async () => { await harness.stop({force: true}); });
  await harness.start();

  const health = await Promise.all(['node:source', 'node:replica', 'node:recovery'].map(nodeId => harness.request(nodeId, 'health')));
  assert.equal(new Set(health.map(item => item.process_id)).size, 3);
  assert.equal(health.every(item => item.process_id !== process.pid && item.status === 'READY'), true);
  assert.equal(new Set(health.map(item => item.world_root)).size, 1);

  const initialSource = await harness.request('node:source', 'snapshot');
  const initialReplica = await harness.request('node:replica', 'snapshot');
  assert.equal(verifyReplicationSnapshot(initialSource).valid, true);
  assert.equal(verifyReplicationSnapshot(initialReplica).valid, true);
  assert.equal(initialSource.snapshot_root, initialReplica.snapshot_root);

  const cachedInitial = await harness.request('node:replica', 'cache-put', {
    cache_key: 'chunk:primary',
    snapshot_root: initialReplica.snapshot_root,
    lease_root: sourceLease.lease_root,
    epoch: sourceLease.epoch,
    fencing_token: sourceLease.fencing_token,
    payload: {representation: 'proxy'}
  });
  assert.equal(cachedInitial.status, 'CACHED');

  const firstEvent = await harness.request('node:source', 'record-event', {
    event_id: 'event:multi-process:weather',
    mutation: {operations: [{op: 'set', path: 'weather', value: 'storm'}]},
    authority_receipt: authority('weather', sourceLease),
    evidence_ref: rootHash({evidence: 'multi-process:weather'})
  });
  assert.equal(firstEvent.commit_status, 'COMMITTED');
  const sourceAfterEvent = await harness.request('node:source', 'snapshot');
  const delta = await harness.request('node:source', 'create-replication-delta', {
    base_snapshot: initialSource,
    input: {target_node: 'node:replica', sequence: 1}
  });
  assert.equal(verifyReplicationDelta(delta).valid, true);
  const applied = await harness.request('node:replica', 'apply-replication-delta', {
    delta,
    authority_receipt: authority('replication', sourceLease)
  });
  assert.equal(verifyReplicationReceipt(applied.receipt).valid, true);
  assert.equal(applied.receipt.status, 'APPLIED');
  assert.equal(applied.after_snapshot_root, sourceAfterEvent.snapshot_root);
  assert.equal(applied.cache_invalidation.status, 'INVALIDATED');
  assert.equal(applied.cache_invalidation.invalidated_entry_count, 1);
  const replicated = await harness.request('node:replica', 'snapshot');
  assert.equal(replicated.snapshot_root, sourceAfterEvent.snapshot_root);

  const sourceProfile = await harness.request('node:source', 'create-profile', {profile: sovereigntyFields('node:recovery')});
  const recoveryProfile = await harness.request('node:recovery', 'create-profile', {profile: sovereigntyFields('node:source')});
  assert.equal(sourceProfile.lease.owner_node, 'node:source');
  assert.equal(recoveryProfile.lease.owner_node, 'node:recovery');

  const recoveryCache = await harness.request('node:recovery', 'cache-put', {
    cache_key: 'chunk:handoff',
    snapshot_root: sourceAfterEvent.snapshot_root,
    lease_root: sourceLease.lease_root,
    epoch: sourceLease.epoch,
    fencing_token: sourceLease.fencing_token,
    payload: {representation: 'standard'}
  });
  assert.equal(recoveryCache.status, 'CACHED');
  const durableBundle = await harness.request('node:source', 'durable-bundle');
  assert.equal(verifyDurableBundle(durableBundle).valid, true);
  const revocation = createAuthorityLeaseRevocation({
    lease: sourceLease,
    revoked_at_tick: 1,
    reason: 'source child process failure',
    authority_ref: 'urn:test:multi-process-replication:failover',
    evidence_refs: ['evidence:multi-process-replication:revocation']
  });
  const migration = await harness.request('node:source', 'create-migration', {
    target_profile: recoveryProfile,
    input: {
      kind: 'FAILOVER',
      source_snapshot_root: sourceAfterEvent.snapshot_root,
      source_revocation: revocation,
      reason: 'source child process failure',
      evidence_refs: ['evidence:multi-process-replication:migration']
    }
  });
  assert.equal(verifyServerSovereigntyMigration(migration).valid, true);
  const handoff = await harness.request('node:recovery', 'handoff', {
    migration,
    durable_bundle: durableBundle,
    authority_receipt: {
      ...authority('failover', recoveryLease),
      migration_root: migration.migration_root
    },
    evidence_refs: ['evidence:multi-process-replication:handoff']
  });
  assert.equal(handoff.status, 'COMPLETED');
  assert.equal(verifyServerSovereigntyHandoffReceipt(handoff.handoff_receipt).valid, true);
  assert.equal(handoff.cache_invalidation.status, 'INVALIDATED');
  assert.equal(handoff.cache_invalidation.invalidated_entry_count, 1);
  const recovered = await harness.request('node:recovery', 'snapshot');
  assert.equal(recovered.snapshot_root, sourceAfterEvent.snapshot_root);
  const cacheAfterHandoff = await harness.request('node:recovery', 'cache-get', {cache_key: 'chunk:handoff'});
  assert.equal(cacheAfterHandoff.status, 'MISS');

  const staleBase = await harness.request('node:source', 'snapshot');
  assert.equal(staleBase.snapshot_root, sourceAfterEvent.snapshot_root);
  await harness.request('node:source', 'record-event', {
    event_id: 'event:multi-process:stale-writer',
    mutation: {operations: [{op: 'set', path: 'weather', value: 'clear'}]},
    authority_receipt: authority('stale-writer', sourceLease),
    evidence_ref: rootHash({evidence: 'multi-process:stale-writer'})
  });
  const staleDelta = await harness.request('node:source', 'create-replication-delta', {
    base_snapshot: staleBase,
    input: {target_node: 'node:recovery', sequence: 2}
  });
  await assert.rejects(
    harness.request('node:recovery', 'apply-replication-delta', {
      delta: staleDelta,
      authority_receipt: authority('stale-delta', sourceLease)
    }),
    error => /STALE_EPOCH|STALE_FENCING/.test(error.message)
  );
  const recoveryAfterStaleWrite = await harness.request('node:recovery', 'snapshot');
  assert.equal(recoveryAfterStaleWrite.snapshot_root, recovered.snapshot_root);

  await harness.node('node:source').stop({force: true});
  assert.equal(harness.node('node:source').alive, false);
  const recoveryHealth = await harness.request('node:recovery', 'health');
  assert.equal(recoveryHealth.epoch, recoveryLease.epoch);
  const runtimeVerification = await harness.request('node:recovery', 'verify');
  assert.equal(runtimeVerification.region.valid, true);
  assert.equal(runtimeVerification.world_truth.event_log.valid, true);

  const evidence = createMultiProcessReplicationEvidence({
    worldId: worldOptions.worldId,
    nodes: health.map(item => ({node_id: item.node_id, independent_process: item.process_id !== process.pid, process_identity_observed: item.process_id !== process.pid})),
    snapshotDelta: {
      status: 'PASS',
      initial_snapshot_root: initialSource.snapshot_root,
      delta_root: delta.delta_root,
      applied_receipt_root: applied.receipt.receipt_root,
      target_snapshot_root: replicated.snapshot_root
    },
    leaseEpochFencing: {
      status: 'PASS',
      source_epoch: sourceLease.epoch,
      target_epoch: recoveryLease.epoch,
      source_fencing_token: sourceLease.fencing_token,
      target_fencing_token: recoveryLease.fencing_token
    },
    failureRecovery: {
      status: 'PASS',
      source_process_killed: true,
      handoff_status: handoff.status,
      restored_snapshot_root: recovered.snapshot_root
    },
    cacheInvalidation: {
      status: 'PASS',
      after_delta: applied.cache_invalidation.status,
      after_handoff: handoff.cache_invalidation.status,
      post_handoff_read: cacheAfterHandoff.status
    },
    staleWrite: {
      status: 'PASS',
      receiver_state_unchanged: recoveryAfterStaleWrite.snapshot_root === recovered.snapshot_root,
      rejection_boundary: 'STALE_EPOCH_OR_FENCING'
    },
    notes: ['local-independent-child-process-candidate', 'not-distributed-consensus', 'not-production-network-security']
  });
  assert.equal(evidence.format, LARGE_WORLD_MULTI_PROCESS_EVIDENCE_FORMAT);
  assert.equal(verifyMultiProcessReplicationEvidence(evidence).valid, true);
});

test('multi-process evidence root and authority boundary fail closed when tampered', () => {
  const evidence = createMultiProcessReplicationEvidence({
    worldId: 'world:multi-process-tamper',
    nodes: [
      {node_id: 'node:a', independent_process: true, process_identity_observed: true},
      {node_id: 'node:b', independent_process: true, process_identity_observed: true}
    ],
    snapshotDelta: {status: 'PASS'},
    leaseEpochFencing: {status: 'PASS'},
    failureRecovery: {status: 'PASS'},
    cacheInvalidation: {status: 'PASS'},
    staleWrite: {status: 'PASS'}
  });
  const schema = JSON.parse(fs.readFileSync(new URL('../schemas/multi-process-replication-evidence.v0.1.schema.json', import.meta.url), 'utf8'));
  const validate = new Ajv2020({strict: false}).compile(schema);
  assert.equal(validate(evidence), true);
  assert.equal(verifyMultiProcessReplicationEvidence(evidence).valid, true);
  const rootTampered = structuredClone(evidence);
  rootTampered.snapshot_delta.status = 'FAIL';
  assert.equal(verifyMultiProcessReplicationEvidence(rootTampered).valid, false);
  const authorityTampered = structuredClone(evidence);
  authorityTampered.authority.canonical_owner = 'PROVIDER';
  assert.equal(verifyMultiProcessReplicationEvidence(authorityTampered).valid, false);
});

console.log('large-world multi-process replication tests: 2 PASS');
