import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import {
  generateWorldBodyArtifacts,
  measureCodeReduction,
} from '../src/index.mjs';
import { applyWorldBodyVisualBindings } from '../examples/generated/minimal/vsr-bindings.generated.mjs';

const declarationSource = readFileSync(new URL('../examples/minimal-world.declaration.json', import.meta.url), 'utf8');
const declaration = JSON.parse(declarationSource);
const bundle = generateWorldBodyArtifacts(declaration);
const reduction = measureCodeReduction(declarationSource, bundle);
const scene = {
  nodes: [
    { id: 'body:body:hero', transform: { translation: [0, 1.5, 0], rotationEulerDeg: [0, 45, 0] }, tags: [] },
    { id: 'body:body:floor', transform: { translation: [0, -0.25, 0], rotationEulerDeg: [0, 0, 0] }, tags: [] },
  ],
};

function applyHandwrittenEquivalent(input) {
  const output = structuredClone(input);
  const hero = output.nodes.find(node => node.id === 'body:body:hero');
  const floor = output.nodes.find(node => node.id === 'body:body:floor');
  hero.transform.translation = [0, 1.45, 0];
  hero.transform.rotationEulerDeg = [0, 45, 0];
  hero.transform.scale = [1, 1, 1];
  hero.tags = ['player-visual', 'world-body-entity:entity:hero'];
  floor.transform.translation = [0, -0.25, 0];
  floor.transform.rotationEulerDeg = [0, 0, 0];
  floor.transform.scale = [1, 1, 1];
  floor.tags = ['ground-visual', 'world-body-entity:entity:floor'];
  return output;
}

assert.deepEqual(applyWorldBodyVisualBindings(scene), applyHandwrittenEquivalent(scene));

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function benchmark(operation, { batches, iterations }) {
  for (let index = 0; index < Math.min(20, iterations); index++) operation();
  const samples = [];
  for (let batch = 0; batch < batches; batch++) {
    const start = performance.now();
    for (let index = 0; index < iterations; index++) operation();
    samples.push((performance.now() - start) * 1000 / iterations);
  }
  return Number(median(samples).toFixed(3));
}

const generatedBindingMicroseconds = benchmark(() => applyWorldBodyVisualBindings(scene), { batches: 7, iterations: 5_000 });
const handwrittenBindingMicroseconds = benchmark(() => applyHandwrittenEquivalent(scene), { batches: 7, iterations: 5_000 });
const generationMicroseconds = benchmark(() => generateWorldBodyArtifacts(declaration), { batches: 5, iterations: 100 });

const report = {
  format: 'taowind.world-body-code-reduction-benchmark.v0.1',
  status: 'PASS',
  host: { platform: process.platform, arch: process.arch, node: process.version },
  scope: 'diagnostic microbenchmark; timings are not a proof or release gate',
  parity: { generatedVsHandwrittenVisualBinding: true },
  timing: {
    generationMicrosecondsPerBundleMedian: generationMicroseconds,
    generatedVisualBindingMicrosecondsPerCallMedian: generatedBindingMicroseconds,
    handwrittenVisualBindingMicrosecondsPerCallMedian: handwrittenBindingMicroseconds,
    generatedToHandwrittenVisualBindingRatio: Number((generatedBindingMicroseconds / handwrittenBindingMicroseconds).toFixed(3)),
  },
  deterministicReduction: reduction,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
