import { readFileSync } from 'node:fs';
import { hash as hashValue } from '../reference-js/src/replicated-authority-v050.js';
import { verifyConstitutionalRealityResult } from '../reference-js/src/constitutional-reality-v100.js';

const root = new URL('../conformance/vectors/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('index.json', root), 'utf8'));
const levels = Object.fromEntries(
  Object.entries(index.levels).map(([level, file]) => [level.toLowerCase(), JSON.parse(readFileSync(new URL(file, root), 'utf8'))]),
);
const vector = levels.c12;
verifyConstitutionalRealityResult(vector.expected);
const vectorHash = hashValue(levels);
if (vectorHash !== index.vectorHash) {
  console.error(`vectorHash mismatch: ${vectorHash} != ${index.vectorHash}`);
  process.exit(1);
}
console.log(JSON.stringify({
  format: index.format,
  levels: Object.keys(index.levels),
  vectorHash,
  c12ResultHash: vector.expected.constitutionalRealityResultHash,
  oldConfigurationHash: vector.expected.oldConfiguration.configurationHash,
  newConfigurationHash: vector.expected.newConfiguration.configurationHash,
  jointActivationCertificateHash: vector.expected.jointActivationCertificate.jointActivationCertificateHash,
  finalTopologyRoot: vector.expected.finalTopologyRoot,
  finalFederationRoot: vector.expected.finalFederationRoot,
  finalEpoch: vector.expected.finalEpoch,
  status: 'PASS',
}, null, 2));
