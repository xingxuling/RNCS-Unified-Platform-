import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  PartitionHealingReality,
  runPartitionHealingAcceptanceScenario,
  signPartitionTimeoutVote,
  verifyPartitionHealingRealityResult,
} from '../src/partition-healing-reality-v090.js';

const vector = JSON.parse(fs.readFileSync(new URL('../../conformance/vectors/c11-partition-healing-reality.json', import.meta.url)));

function temporaryState(label) {
  return path.join(os.tmpdir(), `rfe-c11-${label}-${process.pid}-${Math.random().toString(16).slice(2)}.json`);
}

function run(label) {
  const file = temporaryState(label);
  try {
    return runPartitionHealingAcceptanceScenario(vector, file);
  } finally {
    fs.rmSync(file, { force: true });
  }
}

test('C11 reference runtime matches frozen vector', () => {
  assert.deepStrictEqual(run('golden'), vector.expected);
});

test('C11 verifier accepts frozen result', () => {
  assert.equal(verifyPartitionHealingRealityResult(vector.expected), true);
});

test('C11 deterministic rerun preserves all authoritative hashes', () => {
  const left = run('determinism-left');
  const right = run('determinism-right');
  assert.deepStrictEqual(left, right);
  assert.equal(left.partitionHealingRealityResultHash, vector.expected.partitionHealingRealityResultHash);
});

test('C11 preserves the prepared lock across timeout and view change', () => {
  assert.equal(
    vector.expected.timeoutCertificate.highestPreparedCertificateHash,
    vector.expected.firstPrepareCertificate.prepareCertificateHash,
  );
  assert.equal(
    vector.expected.healingPrepareCertificate.extendsPreparedCertificateHash,
    vector.expected.firstPrepareCertificate.prepareCertificateHash,
  );
  assert.equal(vector.expected.healingPrepareCertificate.changeHash, vector.expected.firstPrepareCertificate.changeHash);
});

test('C11 rejects stale-view and conflicting locked changes', () => {
  assert.equal(vector.expected.staleViewRejection.code, 'STALE_PARTITION_VIEW');
  assert.equal(vector.expected.lockedConflictRejection.code, 'LOCKED_CHANGE_CONFLICT');
  assert.equal(vector.expected.metrics.staleViewMessagesRejected, 1);
  assert.equal(vector.expected.metrics.lockedConflictRejections, 1);
});

test('C11 recovery is idempotent after a partial durable commit', () => {
  assert.equal(vector.expected.interruptedCommitState.committedClusters, 1);
  assert.equal(vector.expected.interruptedCommitState.preparedClusters, 1);
  assert.equal(vector.expected.commitReceipt.recovered, true);
  assert.deepStrictEqual(vector.expected.commitReceipt, vector.expected.recoveryReplayReceipt);
  assert.equal(vector.expected.metrics.recoveries, 1);
  assert.equal(vector.expected.metrics.idempotentRecoveryReplays, 1);
});

test('C11 rejects unsafe Byzantine quorum geometry', () => {
  assert.throws(
    () => new PartitionHealingReality(vector.clusters, 6, 3, vector.parentCertificateHash),
    { code: 'UNSAFE_BYZANTINE_QUORUM' },
  );
});

test('C11 rejects forged timeout keyed proofs', () => {
  const engine = new PartitionHealingReality(
    vector.clusters,
    vector.quorumWeight,
    vector.byzantineBudgetWeight,
    vector.parentCertificateHash,
  );
  const cluster = vector.clusters[0];
  const vote = signPartitionTimeoutVote(cluster, {
    epoch: engine.epoch,
    view: engine.view,
    parentFederationRoot: engine.federationRoot,
  });
  vote.keyedProof = 'forged';
  assert.throws(() => engine.registerTimeoutVote(vote), { code: 'TIMEOUT_KEYED_PROOF_MISMATCH' });
});

test('C11 verifier rejects a timeout certificate that drops the highest prepared lock', () => {
  const tampered = structuredClone(vector.expected);
  tampered.timeoutCertificate.highestPreparedCertificateHash = null;
  assert.throws(() => verifyPartitionHealingRealityResult(tampered), { code: 'TIMEOUT_CERTIFICATE_HASH_MISMATCH' });
});
