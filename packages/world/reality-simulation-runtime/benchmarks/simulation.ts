import { readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildRealityAssets } from '../packages/build-pipeline/src/index.js';
import { DeterministicSimulationWorld, type SimulationWorldConfig } from '../packages/simulation-core/src/index.js';
import { createSimulationObserverProfile, SimulationVSRBridge } from '../packages/simulation-vsr/src/index.js';

function percentile(values: number[], ratio: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0;
}
function sampleStats(samples: number[]) {
  const totalMs = samples.reduce((sum, value) => sum + value, 0);
  return {
    samples: samples.length,
    totalMs,
    averageMs: totalMs / samples.length,
    p50Ms: percentile(samples, 0.50),
    p95Ms: percentile(samples, 0.95),
    p99Ms: percentile(samples, 0.99)
  };
}
function benchmarkPhysics(name: string, config: SimulationWorldConfig, steps: number) {
  const world = new DeterministicSimulationWorld(config);
  const samples: number[] = [];
  const started = performance.now();
  for (let index = 0; index < steps; index++) {
    const before = performance.now();
    world.step();
    samples.push(performance.now() - before);
  }
  const totalMs = performance.now() - started;
  return {
    name, steps, bodyCount: config.bodies.length, totalMs,
    averageStepMs: totalMs / steps,
    p50StepMs: percentile(samples, 0.50),
    p95StepMs: percentile(samples, 0.95),
    p99StepMs: percentile(samples, 0.99),
    stepsPerSecond: steps / (totalMs / 1000),
    finalStateRoot: world.snapshot().stateRoot
  };
}

const scale = 1_000;
const fallingBox = JSON.parse(readFileSync('examples/simulation-assets/falling-box.world.json', 'utf8')) as SimulationWorldConfig;
const stackBodies: SimulationWorldConfig['bodies'] = [
  { id: 'ground', kind: 'static', position: { x: 320 * scale, y: 340 * scale }, halfSize: { x: 310 * scale, y: 10 * scale } }
];
for (let row = 0; row < 8; row++) for (let column = 0; column < 8; column++) stackBodies.push({
  id: `box-${row}-${column}`,
  kind: 'dynamic',
  position: { x: (180 + column * 40) * scale, y: (20 + row * 36) * scale },
  halfSize: { x: 15 * scale, y: 15 * scale },
  restitutionQ: 20, frictionQ: 600, sleepTicks: 20
});
const stack: SimulationWorldConfig = {
  format: 'rsr.world.v0.1', worldId: 'benchmark-stack-64', scale, stepHz: 60,
  gravity: { x: 0, y: 980 * scale }, solverIterations: 4, bodies: stackBodies
};

const renderWorld = new DeterministicSimulationWorld(fallingBox);
const bridge = new SimulationVSRBridge(fallingBox, { width: 320, height: 180 });
const renderSamples: number[] = [];
let renderedBytes = 0;
for (let frame = 0; frame < 120; frame++) {
  const snapshot = renderWorld.step().snapshot;
  const before = performance.now();
  const view = bridge.render(snapshot, [createSimulationObserverProfile('player')]).views[0]!;
  renderSamples.push(performance.now() - before);
  renderedBytes += view.png.byteLength;
}

const pipelineOut = resolve('outputs/benchmark-pipeline');
rmSync(pipelineOut, { recursive: true, force: true });
const request = {
  format: 'reality-build.request.v0.1' as const,
  projectId: 'benchmark-pipeline', target: 'node' as const,
  rootDir: process.cwd(), outDir: pipelineOut,
  assets: [
    { id: 'world', source: 'examples/simulation-assets/falling-box.world.json', type: 'json' as const },
    { id: 'style', source: 'examples/simulation-assets/render-style.json', type: 'json' as const, dependencies: ['world'] }
  ]
};
const pipelineFirstStart = performance.now();
const firstBuild = buildRealityAssets(request);
const pipelineFirstMs = performance.now() - pipelineFirstStart;
const pipelineNoopStart = performance.now();
const secondBuild = buildRealityAssets(request);
const pipelineNoopMs = performance.now() - pipelineNoopStart;

const report = {
  format: 'rsr.benchmark.v0.1',
  runtime: process.version,
  physics: [
    benchmarkPhysics('single-falling-box', fallingBox, 10_000),
    benchmarkPhysics('64-body-stack-naive-pair-scan', stack, 1_000)
  ],
  rendering: {
    profile: 'VSR software PNG · 320x180 · player projection',
    ...sampleStats(renderSamples),
    averagePngBytes: renderedBytes / renderSamples.length,
    finalDisplayRoot: bridge.render(renderWorld.snapshot(), [createSimulationObserverProfile('player')]).sourceDisplayHash
  },
  pipeline: {
    assetCount: firstBuild.manifest.assets.length,
    coldBuildMs: pipelineFirstMs,
    noOpBuildMs: pipelineNoopMs,
    coldBuiltAssetIds: firstBuild.builtAssetIds,
    noOpReusedAssetIds: secondBuild.reusedAssetIds,
    buildRoot: firstBuild.manifest.buildRoot
  }
};
mkdirSync('outputs', { recursive: true });
writeFileSync(resolve('outputs/benchmark-simulation-alpha1.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
