import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { EmbodiedDynamicsWorld, type BodySpec, type EmbodiedDynamicsWorldConfig } from '../packages/embodied-dynamics/src/index.js';

function makeBodies(count: number, columns: number): BodySpec[] {
  const bodies: BodySpec[] = [{ id: 'ground', kind: 'static', position: { x: columns * 650, y: 7600 }, fixtures: [{ id: 'ground', shape: { type: 'box', halfExtents: { x: columns * 700, y: 200 } } }] }];
  for (let i = 0; i < count; i++) {
    const col = i % columns; const row = Math.floor(i / columns); const kind = i % 4 === 0 ? 'capsule' : i % 4 === 1 ? 'circle' : i % 4 === 2 ? 'box' : 'polygon';
    const shape = kind === 'capsule' ? { type: 'capsule' as const, halfLength: 180, radius: 130 } : kind === 'circle' ? { type: 'circle' as const, radius: 190 } : kind === 'box' ? { type: 'box' as const, halfExtents: { x: 180, y: 180 } } : { type: 'polygon' as const, vertices: [{ x: -190, y: -150 }, { x: 160, y: -190 }, { x: 210, y: 120 }, { x: -120, y: 210 }] };
    bodies.push({ id: `body-${i.toString().padStart(4, '0')}`, kind: 'dynamic', position: { x: 600 + col * 520, y: 400 + row * 470 }, angle: (i * 17321) % 1_000_000, fixtures: [{ id: 'shape', shape }], allowSleep: true });
  }
  return bodies;
}
function runCase(bodyCount: number, ticks: number) {
  const columns = Math.ceil(Math.sqrt(bodyCount)); const cfg: EmbodiedDynamicsWorldConfig = { format: 'rsr.embodied-dynamics-world.v0.3', worldId: `bench-${bodyCount}`, stepHz: 60, gravity: { x: 0, y: 9000 }, velocityIterations: 6, positionIterations: 2, broadPhase: 'sweep-and-prune', maxSubsteps: 8, bodies: makeBodies(bodyCount, columns) };
  const world = new EmbodiedDynamicsWorld(cfg); const start = performance.now(); let totalPairs = 0; let totalNarrow = 0; let totalContacts = 0; let maxSubsteps = 0;
  for (let i = 0; i < ticks; i++) { const s = world.step().snapshot; totalPairs += s.diagnostics.candidatePairs; totalNarrow += s.diagnostics.narrowPhaseTests; totalContacts += s.contacts.length; maxSubsteps = Math.max(maxSubsteps, s.diagnostics.microsteps); }
  const elapsedMs = performance.now() - start; const brutePairsPerTick = bodyCount * (bodyCount - 1) / 2;
  return { bodyCount, ticks, elapsedMs: Number(elapsedMs.toFixed(3)), millisecondsPerTick: Number((elapsedMs / ticks).toFixed(4)), ticksPerSecond: Number((ticks / elapsedMs * 1000).toFixed(2)), averageCandidatePairs: Number((totalPairs / ticks).toFixed(2)), averageNarrowPhaseTests: Number((totalNarrow / ticks).toFixed(2)), averageContacts: Number((totalContacts / ticks).toFixed(2)), broadPhaseCompression: Number((1 - (totalPairs / ticks) / Math.max(1, brutePairsPerTick)).toFixed(6)), maxSubsteps, stateRoot: world.snapshot().stateRoot };
}
function queryCase() {
  const cfg: EmbodiedDynamicsWorldConfig = { format: 'rsr.embodied-dynamics-world.v0.3', worldId: 'query-bench', stepHz: 60, gravity: { x: 0, y: 0 }, bodies: makeBodies(180, 15) };
  const world = new EmbodiedDynamicsWorld(cfg); const start = performance.now(); let hits = 0;
  for (let i = 0; i < 30; i++) { hits += world.queryAabb({ min: { x: i * 20, y: i * 10 }, max: { x: i * 20 + 5000, y: i * 10 + 3000 } }).length; hits += world.rayCast({ x: 0, y: i * 20 }, { x: 16000, y: 5000 }, true).length; }
  const elapsedMs = performance.now() - start; return { bodies: 180, operations: 60, elapsedMs: Number(elapsedMs.toFixed(3)), operationsPerSecond: Number((60 / elapsedMs * 1000).toFixed(2)), hits, queryRoot: world.snapshot().queryRoot };
}
const report = { format: 'rsr.embodied-dynamics-benchmark.v0.3', node: process.version, cases: [runCase(80, 60), runCase(160, 40), runCase(280, 24)], queries: queryCase() };
writeFileSync('outputs/benchmark-embodied-dynamics-alpha1.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
