import fs from 'node:fs';
import { hash } from '../src/replicated-authority-v050.js';
import { FederatedRealityConsensus } from '../src/federated-reality-consensus-v070.js';

const iterations = Number.parseInt(process.argv[2] ?? '1000', 10);
const vector = JSON.parse(fs.readFileSync(new URL('../../conformance/vectors/c9-federated-reality-consensus.json', import.meta.url)));

function bind(transaction, engine, sequence) {
  const operations = [...transaction.operations].sort((a, b) => a.clusterId.localeCompare(b.clusterId));
  const proposalHash = hash({
    format: 'rfe.federation-proposal.v0.7',
    proposalId: transaction.proposalId,
    baseFederationRoot: engine.currentFederationRoot(),
    requiredClusterIds: [...transaction.requiredClusterIds].sort(),
    operationHashes: operations.map((operation) => ({ clusterId: operation.clusterId, operationHash: hash(operation.operation) })),
    proposalSequence: sequence,
  });
  return {
    ...transaction,
    votes: transaction.votes.map((vote) => ({
      ...vote,
      proposalHash,
      authorityProofHash: engine.clusterState(vote.clusterId).authorityProofHash,
      policyHash: engine.clusterState(vote.clusterId).policyHash,
    })),
  };
}

const started = performance.now();
for (let index = 0; index < iterations; index += 1) {
  const engine = new FederatedRealityConsensus(vector.clusters, vector.quorumWeight);
  engine.runAcceptanceScenario(
    bind(vector.noQuorumProposal, engine, 1),
    bind(vector.commitProposal, engine, 2),
  );
}
const elapsed = performance.now() - started;
console.log(JSON.stringify({
  implementation: 'javascript-reference-memory',
  iterations,
  averageMilliseconds: elapsed / iterations,
}, null, 2));
