import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { AtomicRealityCoordinator } from '../src/cross-domain-atomic-v060.js';

const iterations = Number.parseInt(process.argv[2] ?? '1000', 10);
const vector = JSON.parse(readFileSync(new URL('../../conformance/vectors/c8-cross-domain-atomic.json', import.meta.url)));
const started = performance.now();
let resultHash = null;
for (let index = 0; index < iterations; index += 1) {
  const coordinator = new AtomicRealityCoordinator(vector.participants);
  const result = coordinator.runAcceptanceScenario(vector.abortTransaction, vector.commitTransaction);
  resultHash = result.crossDomainAtomicResultHash;
}
const totalMilliseconds = performance.now() - started;
console.log(JSON.stringify({
  runtime: 'node',
  nodeVersion: process.version,
  iterations,
  totalMilliseconds,
  averageMilliseconds: totalMilliseconds / iterations,
  transactionsPerIteration: 2,
  participantsCommittedPerIteration: 3,
  resultHash,
}, null, 2));
