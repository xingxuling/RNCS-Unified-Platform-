import fs from 'node:fs';
import { hash } from './reference-js/src/replicated-authority-v050.js';
import {
  ByzantineFederatedReality,
  signByzantineAttestation,
} from './reference-js/src/byzantine-federated-reality-v080.js';

const c9 = JSON.parse(fs.readFileSync('./conformance/vectors/c9-federated-reality-consensus.json'));
const ids = ['cluster:aurora', 'cluster:forge', 'cluster:harbor', 'cluster:mirror'];
const verifierKeys = {
  'cluster:aurora': 'fixture-key-aurora-v080',
  'cluster:forge': 'fixture-key-forge-v080',
  'cluster:harbor': 'fixture-key-harbor-v080',
  'cluster:mirror': 'fixture-key-mirror-v080',
};
const clusters = ids.map((clusterId) => ({
  clusterId,
  weight: c9.expected.clusterStates[clusterId].weight,
  revision: c9.expected.clusterStates[clusterId].revision,
  sovereignRoot: c9.expected.clusterStates[clusterId].sovereignRoot,
  authorityProofHash: c9.expected.clusterStates[clusterId].authorityProofHash,
  policyHash: c9.expected.clusterStates[clusterId].policyHash,
  verifierKey: verifierKeys[clusterId],
}));
const mainProposal = {
  proposalId: 'proposal:c10:canonical-main',
  requiredClusterIds: ['cluster:aurora', 'cluster:forge'],
  operations: [
    { clusterId: 'cluster:aurora', operation: { type: 'activate-reality-bridge', bridgeId: 'bridge:c10', route: 'aurora-forge' } },
    { clusterId: 'cluster:forge', operation: { type: 'anchor-reality-bridge', bridgeId: 'bridge:c10', ledgerSlot: 12 } },
  ],
};
const forkProposal = {
  proposalId: 'proposal:c10:malicious-fork',
  requiredClusterIds: ['cluster:harbor', 'cluster:mirror'],
  operations: [
    { clusterId: 'cluster:harbor', operation: { type: 'redirect-reality-bridge', bridgeId: 'bridge:c10', route: 'harbor-mirror' } },
    { clusterId: 'cluster:mirror', operation: { type: 'claim-reality-bridge', bridgeId: 'bridge:c10', owner: 'mirror' } },
  ],
};
const engine = new ByzantineFederatedReality(clusters, 7, 3, c9.expected.commitReceipt.quorumCertificateHash);
const main = engine.proposal(mainProposal);
const fork = engine.proposal(forkProposal);
const byId = new Map(clusters.map((cluster) => [cluster.clusterId, cluster]));
const attestations = [
  ['cluster:aurora', main],
  ['cluster:forge', main],
  ['cluster:harbor', main],
  ['cluster:harbor', fork],
  ['cluster:mirror', fork],
].map(([clusterId, proposal]) => signByzantineAttestation(byId.get(clusterId), {
  epoch: 1,
  round: 1,
  parentFederationRoot: engine.federationRoot,
  proposalId: proposal.proposalId,
  proposalHash: proposal.proposalHash,
  decision: 'approve',
}));

const result = engine.runAcceptanceScenario(mainProposal, forkProposal, attestations);
const vector = {
  format: 'rfe.conformance.byzantine-federated-reality.v0.8',
  scenario: 'equivocation-quarantine-conflicting-fork-rejection-and-durable-certificate-recovery',
  parentCertificateHash: c9.expected.commitReceipt.quorumCertificateHash,
  clusters,
  totalWeight: 10,
  byzantineBudgetWeight: 3,
  quorumWeight: 7,
  mainProposal,
  forkProposal,
  helpers: {
    initialFederationRoot: result.initialFederationRoot,
    mainProposalHash: result.mainProposalHash,
    forkProposalHash: result.forkProposalHash,
    attestationHashes: attestations.map((item) => item.attestationHash),
  },
  expected: result,
};
fs.writeFileSync('./conformance/vectors/c10-byzantine-federated-reality.json', `${JSON.stringify(vector, null, 2)}\n`);
console.log(JSON.stringify({
  resultHash: result.byzantineFederatedRealityResultHash,
  initialFederationRoot: result.initialFederationRoot,
  finalFederationRoot: result.finalFederationRoot,
  certificateHash: result.certificate.byzantineCertificateHash,
  mainApprovalWeight: result.certificate.approvalWeight,
  forkEffectiveWeight: result.rejectedFork.effectiveApprovalWeight,
  evidenceHash: result.equivocationEvidence[0].evidenceHash,
}, null, 2));
