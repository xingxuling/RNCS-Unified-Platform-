import fs from 'node:fs';
import { hash } from './reference-js/src/replicated-authority-v050.js';
import { FederatedRealityConsensus } from './reference-js/src/federated-reality-consensus-v070.js';

const c8Root = 'ac594e674adb8e6d3c770a18ac9126de87148c1fef7bdbf1535cb38e853d5c5b';
const c8Proof = '74cb358b84bd9560a0d564745dcaba3d2fdf9a9b2664b6156030a32ba7019cfd';
const definitions = [
  ['cluster:aurora', 4],
  ['cluster:forge', 3],
  ['cluster:harbor', 2],
  ['cluster:mirror', 1],
];
const clusters = definitions.map(([clusterId, weight]) => ({
  clusterId,
  weight,
  sovereignRoot: hash({ clusterId, c8Root }),
  authorityProofHash: c8Proof,
  policyHash: hash({ clusterId, policy: 'rfe.sovereign-policy.v0.7' }),
}));
const quorumWeight = 7;
const noQuorumProposal = {
  proposalId: 'proposal:c9:no-quorum',
  requiredClusterIds: ['cluster:aurora', 'cluster:forge'],
  operations: [
    { clusterId: 'cluster:aurora', operation: { type: 'reserve-federated-gateway', gatewayId: 'gateway:a-f', capacity: 3 } },
    { clusterId: 'cluster:forge', operation: { type: 'reserve-federated-ledger-slot', ledgerId: 'ledger:forge', slot: 11 } },
  ],
  votes: [
    { clusterId: 'cluster:aurora', decision: 'approve' },
    { clusterId: 'cluster:harbor', decision: 'approve' },
  ],
};
const commitProposal = {
  proposalId: 'proposal:c9:commit-after-recovery',
  requiredClusterIds: ['cluster:aurora', 'cluster:forge'],
  operations: [
    { clusterId: 'cluster:aurora', operation: { type: 'open-federated-gateway', gatewayId: 'gateway:a-f', route: 'aurora-to-forge' } },
    { clusterId: 'cluster:forge', operation: { type: 'anchor-federated-ledger', ledgerId: 'ledger:forge', anchor: 'gateway:a-f' } },
  ],
  votes: [
    { clusterId: 'cluster:aurora', decision: 'approve' },
    { clusterId: 'cluster:forge', decision: 'approve' },
  ],
  offlineClusters: ['cluster:harbor', 'cluster:mirror'],
};

const engine = new FederatedRealityConsensus(clusters, quorumWeight);
function bind(transaction, sequence) {
  const operations = [...transaction.operations].sort((a, b) => a.clusterId.localeCompare(b.clusterId));
  const proposalBody = {
    format: 'rfe.federation-proposal.v0.7',
    proposalId: transaction.proposalId,
    baseFederationRoot: engine.currentFederationRoot(),
    requiredClusterIds: [...transaction.requiredClusterIds].sort(),
    operationHashes: operations.map((operation) => ({ clusterId: operation.clusterId, operationHash: hash(operation.operation) })),
    proposalSequence: sequence,
  };
  const proposalHash = hash(proposalBody);
  return {
    ...transaction,
    votes: transaction.votes.map((vote) => {
      const state = engine.clusterState(vote.clusterId);
      return {
        ...vote,
        proposalHash,
        authorityProofHash: state.authorityProofHash,
        policyHash: state.policyHash,
      };
    }),
  };
}
const boundNoQuorum = bind(noQuorumProposal, 1);
const boundCommit = bind(commitProposal, 2);
const expected = engine.runAcceptanceScenario(boundNoQuorum, boundCommit);
const helpers = {
  operationHashes: Object.fromEntries([noQuorumProposal, commitProposal].map((transaction) => [
    transaction.proposalId,
    Object.fromEntries(transaction.operations.map((operation) => [operation.clusterId, hash(operation.operation)])),
  ])),
  proposalHashes: {
    [noQuorumProposal.proposalId]: boundNoQuorum.votes[0].proposalHash,
    [commitProposal.proposalId]: boundCommit.votes[0].proposalHash,
  },
};
const vector = {
  format: 'rfe.conformance.federated-reality-consensus.v0.7',
  scenario: 'insufficient-quorum-abort-then-durable-quorum-certificate-recovery',
  clusters,
  quorumWeight,
  noQuorumProposal,
  commitProposal,
  helpers,
  expected,
};
fs.writeFileSync('conformance/vectors/c9-federated-reality-consensus.json', `${JSON.stringify(vector, null, 2)}\n`);
console.log(JSON.stringify({
  resultHash: expected.federatedRealityConsensusResultHash,
  initialFederationRoot: expected.initialFederationRoot,
  finalFederationRoot: expected.finalFederationRoot,
  approvalWeight: expected.commitReceipt.approvalWeight,
  quorumWeight: expected.commitReceipt.quorumWeight,
}, null, 2));
