import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { runPartitionHealingAcceptanceScenario } from '../src/partition-healing-reality-v090.js';

const vector = JSON.parse(fs.readFileSync(new URL('../../conformance/vectors/c11-partition-healing-reality.json', import.meta.url)));
const iterations = Number(process.env.RFE_BENCH_ITERATIONS ?? 200);
const samples = [];
for (let index = 0; index < iterations; index += 1) {
  const durable = path.join(os.tmpdir(), `rfe-c11-bench-${process.pid}-${index}.json`);
  const start = performance.now();
  runPartitionHealingAcceptanceScenario(vector, durable);
  samples.push(performance.now() - start);
  fs.rmSync(durable, { force: true });
}
samples.sort((left, right) => left - right);
const percentile = (ratio) => samples[Math.min(samples.length - 1, Math.floor(samples.length * ratio))];
const report = {
  format: 'rfe.benchmark.partition-healing-reality.js.v0.9',
  runtime: process.version,
  iterations,
  meanMilliseconds: samples.reduce((sum, value) => sum + value, 0) / samples.length,
  p50Milliseconds: percentile(0.50),
  p95Milliseconds: percentile(0.95),
  p99Milliseconds: percentile(0.99),
};
console.log(JSON.stringify(report, null, 2));
