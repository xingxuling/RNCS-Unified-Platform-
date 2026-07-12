import { readFileSync } from 'node:fs';
import { hash as hashValue } from '../reference-js/src/replicated-authority-v050.js';
import { verifyFederatedRealityConsensusResult } from '../reference-js/src/federated-reality-consensus-v070.js';

const root = new URL('../conformance/vectors/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('index.json', root), 'utf8'));
const levels = Object.fromEntries(
  Object.entries(index.levels).map(([level, file]) => [level.toLowerCase(), JSON.parse(readFileSync(new URL(file, root), 'utf8'))]),
);
const vector = levels.c9;
verifyFederatedRealityConsensusResult(vector.expected);
const vectorHash = hashValue(levels);
if (vectorHash !== index.vectorHash) {
  console.error(`vectorHash mismatch: ${vectorHash} != ${index.vectorHash}`);
  process.exit(1);
}
console.log(JSON.stringify({
  format: index.format,
  levels: Object.keys(index.levels),
  vectorHash,
  c9ResultHash: vector.expected.federatedRealityConsensusResultHash,
  initialFederationRoot: vector.expected.initialFederationRoot,
  finalFederationRoot: vector.expected.finalFederationRoot,
  approvalWeight: vector.expected.commitReceipt.approvalWeight,
  quorumWeight: vector.expected.commitReceipt.quorumWeight,
  offlineClusters: vector.expected.offlineClusters,
  status: 'PASS',
}, null, 2));
