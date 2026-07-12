import { readFileSync } from 'node:fs';
import { hash as hashValue } from '../reference-js/src/replicated-authority-v050.js';
import { verifyPartitionHealingRealityResult } from '../reference-js/src/partition-healing-reality-v090.js';

const root = new URL('../conformance/vectors/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('index.json', root), 'utf8'));
const levels = Object.fromEntries(
  Object.entries(index.levels).map(([level, file]) => [level.toLowerCase(), JSON.parse(readFileSync(new URL(file, root), 'utf8'))]),
);
const vector = levels.c11;
verifyPartitionHealingRealityResult(vector.expected);
const vectorHash = hashValue(levels);
if (vectorHash !== index.vectorHash) {
  console.error(`vectorHash mismatch: ${vectorHash} != ${index.vectorHash}`);
  process.exit(1);
}
console.log(JSON.stringify({
  format: index.format,
  levels: Object.keys(index.levels),
  vectorHash,
  c11ResultHash: vector.expected.partitionHealingRealityResultHash,
  initialFederationRoot: vector.expected.initialFederationRoot,
  finalFederationRoot: vector.expected.finalFederationRoot,
  timeoutCertificateHash: vector.expected.timeoutCertificate.timeoutCertificateHash,
  commitCertificateHash: vector.expected.commitCertificate.commitCertificateHash,
  finalView: vector.expected.finalView,
  status: 'PASS',
}, null, 2));
