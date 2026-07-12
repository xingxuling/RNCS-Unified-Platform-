import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EmbodiedDynamicsWorld,
  embodiedSnapshotToCausalDelta,
  replayEmbodiedDynamics,
  type DynamicsCommand,
  type EmbodiedDynamicsWorldConfig
} from '../../embodied-dynamics/src/index.js';
import { EmbodiedDynamicsVSRBridge, createEmbodiedObserverProfile } from '../../embodied-dynamics-vsr/src/index.js';

function saveJson(path: string, value: unknown): void { writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); }
function commands(): DynamicsCommand[] {
  return [
    { id: 'pendulum-kick', tick: 5, type: 'apply-impulse', bodyId: 'pendulum', impulse: { x: 70000, y: -12000 }, worldPoint: { x: 345000, y: 300000 } },
    { id: 'slider-reverse', tick: 150, type: 'set-joint-motor', jointId: 'slider-joint', motorSpeed: -26000, maxForceOrTorque: 220000 },
    { id: 'vortex-spin', tick: 60, type: 'apply-torque', bodyId: 'vortex-capsule', torque: 140000 },
    { id: 'float-kick', tick: 100, type: 'apply-impulse', bodyId: 'buoyant-box', impulse: { x: 38000, y: -52000 }, worldPoint: { x: 820000, y: 430000 } }
  ];
}
function render(bridge: EmbodiedDynamicsVSRBridge, snapshot: ReturnType<EmbodiedDynamicsWorld['snapshot']>, outDir: string, prefix: string) {
  const rendered = bridge.render(snapshot, [createEmbodiedObserverProfile('player'), createEmbodiedObserverProfile('debugger')]);
  const player = rendered.views.find(v => v.observer.observerId.endsWith(':player'))!;
  const debuggerView = rendered.views.find(v => v.observer.observerId.endsWith(':debugger'))!;
  writeFileSync(resolve(outDir, `${prefix}-player.png`), player.png);
  writeFileSync(resolve(outDir, `${prefix}-debugger.png`), debuggerView.png);
  return { playerHash: player.pngHash, debuggerHash: debuggerView.pngHash, verification: rendered.verification, invariantHash: rendered.invariantHash };
}
function run(outDir: string): void {
  mkdirSync(outDir, { recursive: true });
  const cfg = JSON.parse(readFileSync('examples/embodied-dynamics/advanced-playground.world.json', 'utf8')) as EmbodiedDynamicsWorldConfig;
  const allCommands = commands(); const world = new EmbodiedDynamicsWorld(cfg); const initial = world.snapshot();
  world.run(120, allCommands); const checkpoint = world.snapshot(); world.run(120, allCommands); const final = world.snapshot();
  const replay = replayEmbodiedDynamics(cfg, 240, allCommands); const restored = EmbodiedDynamicsWorld.fromSnapshot(checkpoint); restored.run(120, allCommands); const recovered = restored.snapshot();
  const bridge = new EmbodiedDynamicsVSRBridge(cfg, { width: 960, height: 540, title: '现实原生具身动力学织构' });
  const initialViews = render(bridge, initial, outDir, 'initial'); const finalViews = render(bridge, final, outDir, 'final');
  const aabbQuery = world.queryAabb({ min: { x: 680000, y: 120000 }, max: { x: 920000, y: 490000 } });
  const pointQuery = world.queryPoint({ x: 880000, y: 430000 });
  const rayHits = world.rayCast({ x: 40000, y: 180000 }, { x: 860000, y: 0 }, false);
  const shapeCastHits = world.shapeCastCircle({ x: 50000, y: 120000 }, 10000, { x: 840000, y: 250000 });
  const queried = world.snapshot(); const delta = embodiedSnapshotToCausalDelta(queried, 'rfe:embodied-demo:base');
  saveJson(resolve(outDir, 'world.json'), cfg); saveJson(resolve(outDir, 'checkpoint-snapshot.json'), checkpoint); saveJson(resolve(outDir, 'final-snapshot.json'), final); saveJson(resolve(outDir, 'queried-snapshot.json'), queried); saveJson(resolve(outDir, 'causal-delta.json'), delta); saveJson(resolve(outDir, 'render-document.vsr.json'), bridge.document);
  const evidence = {
    format: 'rsr.embodied-dynamics-demo-evidence.v0.3', runtimeVersion: final.runtimeVersion, worldId: final.worldId,
    deterministicReplay: final.stateRoot === replay.stateRoot, deterministicRecovery: final.stateRoot === recovered.stateRoot,
    initialStateRoot: initial.stateRoot, checkpointStateRoot: checkpoint.stateRoot, finalStateRoot: final.stateRoot, replayStateRoot: replay.stateRoot, recoveredStateRoot: recovered.stateRoot,
    bodyRoot: final.bodyRoot, contactRoot: final.contactRoot, jointRoot: final.jointRoot, islandRoot: final.islandRoot, queryRoot: queried.queryRoot, causalDeltaRoot: delta.deltaRoot,
    diagnostics: final.diagnostics, counts: { bodies: final.bodies.length, fixtures: final.bodies.reduce((n, b) => n + b.fixtures.length, 0), joints: final.joints.length, contacts: final.contacts.length, events: final.events.length, islands: final.islands.length },
    queries: { aabbQuery, pointQuery, rayHits, shapeCastHits }, initialViews, finalViews
  };
  saveJson(resolve(outDir, 'demo-evidence.json'), evidence);
  console.log(JSON.stringify({ outDir, deterministicReplay: evidence.deterministicReplay, deterministicRecovery: evidence.deterministicRecovery, finalStateRoot: final.stateRoot, diagnostics: final.diagnostics, counts: evidence.counts, queryCounts: { aabb: aabbQuery.length, point: pointQuery.length, ray: rayHits.length, shapeCast: shapeCastHits.length } }, null, 2));
}
const mode = process.argv[2] ?? 'demo'; const outDir = resolve(process.argv[3] ?? 'outputs/embodied-dynamics-demo'); if (mode !== 'demo' && mode !== 'verify') throw new Error(`未知模式：${mode}`); run(outDir);
if (mode === 'verify') { const evidence = JSON.parse(readFileSync(resolve(outDir, 'demo-evidence.json'), 'utf8')) as { deterministicReplay: boolean; deterministicRecovery: boolean; finalViews: { verification: { ok?: boolean } }; queries: { rayHits: unknown[]; shapeCastHits: unknown[] } }; if (!evidence.deterministicReplay || !evidence.deterministicRecovery || evidence.finalViews.verification.ok !== true || !evidence.queries.rayHits.length || !evidence.queries.shapeCastHits.length) process.exitCode = 1; }
