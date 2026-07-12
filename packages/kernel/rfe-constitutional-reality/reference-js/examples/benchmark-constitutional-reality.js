import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { runConstitutionalAcceptanceScenario } from '../src/constitutional-reality-v100.js';

const vector = JSON.parse(fs.readFileSync(new URL('../../conformance/vectors/c12-constitutional-reality.json', import.meta.url)));
const iterations = Number(process.env.RFE_BENCH_ITERATIONS ?? 200);
const samples = [];
for (let index = 0; index < iterations; index += 1) {
  const durable = path.join(os.tmpdir(), `rfe-c12-bench-${process.pid}-${index}.json`);
  const start = performance.now();
  runConstitutionalAcceptanceScenario(vector, durable);
  samples.push(performance.now() - start);
  fs.rmSync(durable, { force: true });
}
samples.sort((left, right) => left - right);
const percentile = (ratio) => samples[Math.min(samples.length - 1, Math.floor(samples.length * ratio))];
const report = {
  format: 'rfe.benchmark.constitutional-reality.js.v1.0',
  runtime: process.version,
  iterations,
  meanMilliseconds: samples.reduce((sum, value) => sum + value, 0) / samples.length,
  p50Milliseconds: percentile(0.50),
  p95Milliseconds: percentile(0.95),
  p99Milliseconds: percentile(0.99),
};
console.log(JSON.stringify(report, null, 2));
