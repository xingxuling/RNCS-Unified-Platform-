import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { Q, SPATIAL_EMBODIMENT_FORMAT, SpatialEmbodimentWorld, type SpatialBodySpec, type SpatialEmbodimentWorldConfig } from '../packages/spatial-embodiment/src/index.js';
import { projectSpatialEmbodiment } from '../packages/spatial-embodiment-vsr/src/index.js';

function makeBodies(count: number): SpatialBodySpec[] {
  const side = Math.ceil(Math.sqrt(count)); const bodies: SpatialBodySpec[] = [];
  for (let i = 0; i < count; i++) {
    const x = i % side, z = Math.floor(i / side), shape = i % 3;
    bodies.push({
      id: `body-${String(i).padStart(4, '0')}`,
      kind: 'dynamic',
      position: { x: (x - side / 2) * 780, y: 600 + Math.floor(i / (side * side)) * 700, z: (z - side / 2) * 780 },
      velocity: { x: ((i * 97) % 400) - 200, y: 0, z: ((i * 193) % 400) - 200 },
      fixtures: [{ id: 'shape', shape: shape === 0 ? { type: 'sphere', radius: 280 } : shape === 1 ? { type: 'box', halfExtents: { x: 260, y: 260, z: 260 } } : { type: 'capsule', radius: 190, halfHeight: 300 }, bodyZone: 'body' }],
      allowSleep: true,
      sleepTicks: 120
    });
  }
  return bodies;
}
function runCase(bodyCount: number, ticks: number) {
  const cfg: SpatialEmbodimentWorldConfig = { format: SPATIAL_EMBODIMENT_FORMAT, worldId: `spatial-bench-${bodyCount}`, stepHz: 60, gravity: { x: 0, y: -9810, z: 0 }, floorY: 0, velocityIterations: 4, positionIterations: 2, maxSubsteps: 8, bodies: makeBodies(bodyCount), reality: { generation: 1, realityRoot: `rfe:bench:${bodyCount}` } };
  const world = new SpatialEmbodimentWorld(cfg); const start = performance.now(); let pairs = 0, narrow = 0, contacts = 0, sensory = 0, maxSubsteps = 0;
  for (let i = 0; i < ticks; i++) { const s = world.step().snapshot; pairs += s.diagnostics.broadPhasePairs; narrow += s.diagnostics.narrowPhaseTests; contacts += s.contacts.length; sensory += s.diagnostics.audioEvents + s.diagnostics.hapticEvents; maxSubsteps = Math.max(maxSubsteps, s.diagnostics.microsteps); }
  const elapsedMs = performance.now() - start; const brute = bodyCount * (bodyCount - 1) / 2;
  return { bodyCount, ticks, elapsedMs: Number(elapsedMs.toFixed(3)), millisecondsPerTick: Number((elapsedMs / ticks).toFixed(4)), ticksPerSecond: Number((ticks / elapsedMs * 1000).toFixed(2)), averageCandidatePairs: Number((pairs / ticks).toFixed(2)), averageNarrowPhaseTests: Number((narrow / ticks).toFixed(2)), averageContacts: Number((contacts / ticks).toFixed(2)), averageSensoryEvents: Number((sensory / ticks).toFixed(2)), broadPhaseCompression: Number((1 - pairs / ticks / Math.max(1, brute)).toFixed(6)), maxSubsteps, stateRoot: world.snapshot().stateRoot };
}
function characterCase() {
  const bodies = Array.from({ length: 32 }, (_, i): SpatialBodySpec => ({ id: `avatar-${i}`, kind: 'dynamic', position: { x: (i % 8) * 1000, y: 1000, z: Math.floor(i / 8) * 1200 }, fixtures: [{ id: 'capsule', shape: { type: 'capsule', radius: 300, halfHeight: 700 }, bodyZone: 'torso' }], allowSleep: false }));
  const cfg: SpatialEmbodimentWorldConfig = { format: SPATIAL_EMBODIMENT_FORMAT, worldId: 'character-bench', stepHz: 60, gravity: { x: 0, y: -9810, z: 0 }, floorY: 0, bodies, characters: bodies.map((body, i) => ({ id: `character-${i}`, bodyId: body.id, walkSpeed: 3600, acceleration: 14000, airControlQ: 250000, jumpSpeed: 5200, footstepDistance: 800 })) };
  const world = new SpatialEmbodimentWorld(cfg); const commands = cfg.characters!.map((character, i) => ({ id: `move-${i}`, tick: 1, type: 'move-character' as const, characterId: character.id, direction: { x: i % 2 ? Q : -Q, y: 0, z: i % 3 ? Q / 3 : -Q / 3 } })); const start = performance.now(); world.run(180, commands); const elapsedMs = performance.now() - start; const snapshot = world.snapshot(); return { characters: 32, ticks: 180, elapsedMs: Number(elapsedMs.toFixed(3)), millisecondsPerTick: Number((elapsedMs / 180).toFixed(4)), footstepEventsLastTick: snapshot.diagnostics.footstepEvents, groundedBodies: snapshot.diagnostics.groundedBodies, stateRoot: snapshot.stateRoot };
}
function projectionCase() {
  const cfg: SpatialEmbodimentWorldConfig = { format: SPATIAL_EMBODIMENT_FORMAT, worldId: 'projection-bench', stepHz: 60, gravity: { x: 0, y: -9810, z: 0 }, floorY: 0, bodies: makeBodies(48), reality: { generation: 2, realityRoot: 'rfe:projection-bench' } };
  const snapshot = new SpatialEmbodimentWorld(cfg).run(30); const start = performance.now(); const projected = projectSpatialEmbodiment(snapshot, { width: 480, height: 270, qualityTier: 'economy', includeSensoryEvents: false }); const elapsedMs = performance.now() - start; return { bodies: 48, drawCalls: projected.framePlan.stats.visibleDraws, triangles: projected.framePlan.stats.triangleCount, elapsedMs: Number(elapsedMs.toFixed(3)), frameVerified: projected.frameVerified, pixelRoot: projected.pixelRoot };
}
const report = { format: 'rsr.spatial-embodiment-benchmark.v0.5', node: process.version, cases: [runCase(64, 90), runCase(144, 60), runCase(256, 30)], characters: characterCase(), projection: projectionCase() };
writeFileSync('outputs/benchmark-spatial-embodiment-alpha1.json', `${JSON.stringify(report, null, 2)}\n`); console.log(JSON.stringify(report, null, 2));
