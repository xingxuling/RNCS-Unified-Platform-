import { readFileSync } from 'node:fs';
import { hash as hashValue } from '../reference-js/src/replicated-authority-v050.js';
import { AtomicRealityCoordinator, verifyCrossDomainAtomicResult } from '../reference-js/src/cross-domain-atomic-v060.js';

const root = new URL('../conformance/vectors/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('index.json', root), 'utf8'));
const levels = Object.fromEntries(
  Object.entries(index.levels).map(([level, file]) => [level.toLowerCase(), JSON.parse(readFileSync(new URL(file, root), 'utf8'))]),
);
const vector = levels.c8;
const coordinator = new AtomicRealityCoordinator(vector.participants);
const generated = coordinator.runAcceptanceScenario(vector.abortTransaction, vector.commitTransaction);
if (JSON.stringify(generated) !== JSON.stringify(vector.expected)) {
  console.error('C8 generated result differs from frozen expected result');
  process.exit(1);
}
const verification = verifyCrossDomainAtomicResult(vector.expected);
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
  c8ResultHash: verification.resultHash,
  initialGlobalRoot: vector.expected.initialGlobalRoot,
  finalGlobalRoot: vector.expected.finalGlobalRoot,
  committedParticipants: Object.keys(vector.expected.participantStates).length,
  status: 'PASS',
}, null, 2));
