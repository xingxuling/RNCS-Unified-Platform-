import { readFileSync } from 'node:fs';
import { hash as hashValue, verifyAgainstFrozenC7 } from '../reference-js/src/replicated-authority-v050.js';

const root = new URL('../conformance/vectors/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('index.json', root), 'utf8'));
const levels = Object.fromEntries(
  Object.entries(index.levels).map(([level, file]) => [level.toLowerCase(), JSON.parse(readFileSync(new URL(file, root), 'utf8'))]),
);
const verification = verifyAgainstFrozenC7(levels.c7);
if (!verification.ok) {
  console.error(JSON.stringify(verification.checks.filter((item) => !item.ok), null, 2));
  process.exit(1);
}
const vectorHash = hashValue(levels);
if (vectorHash !== index.vectorHash) {
  console.error(`vectorHash mismatch: ${vectorHash} != ${index.vectorHash}`);
  process.exit(1);
}
console.log(JSON.stringify({
  format: index.format,
  levels: Object.keys(index.levels),
  vectorHash,
  c7ResultHash: verification.resultHash,
  clusterLogHead: levels.c7.expected.clusterLogHead,
  finalLeader: levels.c7.expected.finalLeader,
  finalTerm: levels.c7.expected.finalTerm,
  status: 'PASS',
}, null, 2));
