import { mkdirSync, writeFileSync } from 'node:fs';
import { ConstraintCausalPhysicsWorld, type ConstraintPhysicsWorldConfig } from '../packages/constraint-physics/src/index.js';

function percentile(values: number[], ratio: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0;
}

function makeWorld(count: number, spacing: number, gravityY: number): ConstraintPhysicsWorldConfig {
  const bodies: ConstraintPhysicsWorldConfig['bodies'] = [
    {
      id: 'ground',
      kind: 'static',
      position: { x: Math.floor((count * spacing) / 2), y: 240000 },
      shape: { type: 'box', halfExtents: { x: Math.max(300000, Math.floor((count * spacing) / 2) + 50000), y: 10000 } },
      frictionQ: 800
    }
  ];
  for (let index = 0; index < count; index++) {
    bodies.push({
      id: `body-${String(index).padStart(4, '0')}`,
      kind: 'dynamic',
      position: { x: index * spacing, y: 20000 + (index % 5) * 14000 },
      shape: index % 2 === 0 ? { type: 'circle', radius: 5000 } : { type: 'box', halfExtents: { x: 5000, y: 5000 } },
      velocity: { x: index % 3 === 0 ? 25000 : -15000, y: 0 },
      inverseMassQ: 1000,
      continuous: index % 16 === 0,
      frictionQ: 500,
      restitutionQ: 100
    });
  }
  return {
    format: 'rsr.constraint-world.v0.2',
    worldId: `benchmark-${count}-${spacing}`,
    scale: 1000,
    stepHz: 60,
    gravity: { x: 0, y: gravityY },
    solverIterations: 4,
    gridCellSize: 32000,
    maxSubsteps: 8,
    bodies
  };
}

function runCase(name: string, config: ConstraintPhysicsWorldConfig, steps: number) {
  const world = new ConstraintCausalPhysicsWorld(config);
  const times: number[] = [];
  let candidatePairs = 0;
  let narrowPhaseTests = 0;
  let microsteps = 0;
  for (let index = 0; index < steps; index++) {
    const started = performance.now();
    const result = world.step();
    times.push(performance.now() - started);
    candidatePairs += result.snapshot.diagnostics.candidatePairs;
    narrowPhaseTests += result.snapshot.diagnostics.narrowPhaseTests;
    microsteps += result.snapshot.diagnostics.microsteps;
  }
  const totalMs = times.reduce((sum, value) => sum + value, 0);
  const bodyCount = config.bodies.length;
  const naivePairsPerIteration = bodyCount * (bodyCount - 1) / 2;
  return {
    name,
    steps,
    bodyCount,
    totalMs,
    averageStepMs: totalMs / steps,
    p50StepMs: percentile(times, 0.5),
    p95StepMs: percentile(times, 0.95),
    p99StepMs: percentile(times, 0.99),
    stepsPerSecond: steps / (totalMs / 1000),
    averageMicrosteps: microsteps / steps,
    averageCandidatePairs: candidatePairs / steps,
    averageNarrowPhaseTests: narrowPhaseTests / steps,
    naivePairsPerIteration,
    broadPhaseCompression: naivePairsPerIteration === 0 ? 1 : 1 - (candidatePairs / steps) / (naivePairsPerIteration * (config.solverIterations ?? 1)),
    finalStateRoot: world.snapshot().stateRoot
  };
}

const report = {
  format: 'rsr.constraint-physics-benchmark.v0.2',
  runtime: process.version,
  cases: [
    runCase('128 sparse mixed shapes', makeWorld(128, 42000, 980000), 240),
    runCase('128 dense mixed shapes', makeWorld(128, 11000, 980000), 120),
    runCase('512 sparse broad-phase', makeWorld(512, 50000, 0), 60)
  ]
};
mkdirSync('outputs', { recursive: true });
writeFileSync('outputs/benchmark-constraint-physics-alpha1.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
