import fs from 'node:fs';
import { ByzantineFederatedReality, signByzantineAttestation } from '../src/byzantine-federated-reality-v080.js';

const iterations = Number.parseInt(process.argv[2] ?? '1000', 10);
const vector = JSON.parse(fs.readFileSync(new URL('../../conformance/vectors/c10-byzantine-federated-reality.json', import.meta.url)));
const started = process.hrtime.bigint();
let result;
for (let index = 0; index < iterations; index += 1) {
  const engine = new ByzantineFederatedReality(vector.clusters, vector.quorumWeight, vector.byzantineBudgetWeight, vector.parentCertificateHash);
  const main = engine.proposal(vector.mainProposal);
  const fork = engine.proposal(vector.forkProposal);
  const byId = new Map(vector.clusters.map((cluster) => [cluster.clusterId, cluster]));
  const attestations = [
    ['cluster:aurora', main], ['cluster:forge', main], ['cluster:harbor', main], ['cluster:harbor', fork], ['cluster:mirror', fork],
  ].map(([clusterId, proposal]) => signByzantineAttestation(byId.get(clusterId), {
    epoch: 1, round: 1, parentFederationRoot: engine.federationRoot,
    proposalId: proposal.proposalId, proposalHash: proposal.proposalHash, decision: 'approve',
  }));
  result = engine.runAcceptanceScenario(vector.mainProposal, vector.forkProposal, attestations);
}
const totalMs = Number(process.hrtime.bigint() - started) / 1e6;
console.log(JSON.stringify({ runtime: 'javascript-reference-memory', version: '0.8.0', iterations, totalMs, averageMs: totalMs / iterations, resultHash: result.byzantineFederatedRealityResultHash }));
