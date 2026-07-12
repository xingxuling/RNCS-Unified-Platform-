import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  runPartitionHealingAcceptanceScenario,
  verifyPartitionHealingRealityResult,
} from './reference-js/src/partition-healing-reality-v090.js';

const c10 = JSON.parse(fs.readFileSync('./conformance/vectors/c10-byzantine-federated-reality.json', 'utf8'));
const ids = ['cluster:aurora', 'cluster:forge', 'cluster:harbor', 'cluster:mirror'];
const verifierKeys = Object.fromEntries(ids.map((clusterId) => [clusterId, `fixture-key-${clusterId.split(':')[1]}-v090`]));
const clusters = ids.map((clusterId) => {
  const previous = c10.expected.clusterStates[clusterId];
  return {
    clusterId,
    weight: previous.weight,
    revision: previous.revision,
    sovereignRoot: previous.sovereignRoot,
    authorityProofHash: previous.authorityProofHash,
    policyHash: previous.policyHash,
    verifierKey: verifierKeys[clusterId],
  };
});

const initialProposal = {
  proposalId: 'proposal:c11:view1-prepared-route',
  requiredClusterIds: ['cluster:aurora', 'cluster:forge'],
  operations: [
    {
      clusterId: 'cluster:aurora',
      operation: { type: 'advance-reality-route', routeId: 'route:c11', target: 'forge' },
    },
    {
      clusterId: 'cluster:forge',
      operation: { type: 'anchor-reality-route', routeId: 'route:c11', slot: 13 },
    },
  ],
};
const healingProposal = {
  ...initialProposal,
  proposalId: 'proposal:c11:view2-healing-route',
};
const conflictingProposal = {
  proposalId: 'proposal:c11:conflicting-route',
  requiredClusterIds: ['cluster:harbor', 'cluster:mirror'],
  operations: [
    {
      clusterId: 'cluster:harbor',
      operation: { type: 'redirect-reality-route', routeId: 'route:c11', target: 'mirror' },
    },
    {
      clusterId: 'cluster:mirror',
      operation: { type: 'claim-reality-route', routeId: 'route:c11', owner: 'mirror' },
    },
  ],
};

const vector = {
  format: 'rfe.conformance.partition-healing-reality.v0.9',
  scenario: 'prepared-lock-survives-partition-timeout-view-change-conflict-and-crash-recovery',
  parentCertificateHash: c10.expected.certificate.byzantineCertificateHash,
  clusters,
  totalWeight: 10,
  byzantineBudgetWeight: 3,
  quorumWeight: 7,
  partitionLabel: 'partition:aurora-harbor-visible',
  partitionedReachableClusterIds: ['cluster:aurora', 'cluster:harbor'],
  healedLabel: 'partition:healed-majority-visible',
  healedReachableClusterIds: ['cluster:aurora', 'cluster:forge', 'cluster:harbor'],
  prepareVoters: ['cluster:aurora', 'cluster:forge'],
  timeoutVoters: ['cluster:aurora', 'cluster:forge'],
  commitVoters: ['cluster:aurora', 'cluster:forge'],
  crashAfterCommittedClusters: 1,
  initialProposal,
  healingProposal,
  conflictingProposal,
};

const durableStatePath = path.join(os.tmpdir(), `rfe-c11-generate-${process.pid}.json`);
try {
  const expected = runPartitionHealingAcceptanceScenario(vector, durableStatePath);
  verifyPartitionHealingRealityResult(expected);
  vector.helpers = {
    initialFederationRoot: expected.initialFederationRoot,
    firstPrepareCertificateHash: expected.firstPrepareCertificate.prepareCertificateHash,
    timeoutCertificateHash: expected.timeoutCertificate.timeoutCertificateHash,
    healingProposalHash: expected.healingProposalHash,
    healingPrepareCertificateHash: expected.healingPrepareCertificate.prepareCertificateHash,
    commitCertificateHash: expected.commitCertificate.commitCertificateHash,
    finalFederationRoot: expected.finalFederationRoot,
  };
  vector.expected = expected;
  fs.writeFileSync('./conformance/vectors/c11-partition-healing-reality.json', `${JSON.stringify(vector, null, 2)}\n`);
  fs.writeFileSync('./evidence/C11_RESULT_v0.9.0.json', `${JSON.stringify(expected, null, 2)}\n`);
  console.log(JSON.stringify({
    resultHash: expected.partitionHealingRealityResultHash,
    initialFederationRoot: expected.initialFederationRoot,
    finalFederationRoot: expected.finalFederationRoot,
    firstPrepareCertificateHash: expected.firstPrepareCertificate.prepareCertificateHash,
    timeoutCertificateHash: expected.timeoutCertificate.timeoutCertificateHash,
    commitCertificateHash: expected.commitCertificate.commitCertificateHash,
    finalView: expected.finalView,
    viewChanges: expected.metrics.viewChanges,
    recoveries: expected.metrics.recoveries,
  }, null, 2));
} finally {
  fs.rmSync(durableStatePath, { force: true });
}
