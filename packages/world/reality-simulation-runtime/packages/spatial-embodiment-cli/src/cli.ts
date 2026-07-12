import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SpatialEmbodimentWorld,
  replaySpatialEmbodiment,
  spatialEmbodimentSnapshotToCausalDelta,
  type SpatialCommand,
  type SpatialEmbodimentWorldConfig
} from '../../spatial-embodiment/src/index.js';
import { projectSpatialEmbodiment } from '../../spatial-embodiment-vsr/src/index.js';

function saveJson(path: string, value: unknown): void { writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); }
function commands(): SpatialCommand[] {
  return [
    { id: 'walk-forward', tick: 2, type: 'move-character', characterId: 'subject:player', direction: { x: 1_000_000, y: 0, z: 120_000 }, speedQ: 1_000_000 },
    { id: 'avatar-jump', tick: 72, type: 'jump-character', characterId: 'subject:player' },
    { id: 'crate-kick', tick: 40, type: 'apply-impulse', bodyId: 'crate-a', impulse: { x: 5000, y: 2200, z: 900 }, worldPoint: { x: 500, y: 900, z: 300 } },
    { id: 'arm-wave-reverse', tick: 100, type: 'set-joint-motor', jointId: 'joint:right-shoulder', motorSpeedDeg: -45_000, maxMotorTorque: 7000 },
    { id: 'listener-follow', tick: 120, type: 'set-listener', listenerId: 'listener:player', position: { x: 800, y: 1800, z: 300 }, forward: { x: 1_000_000, y: 0, z: 0 } }
  ];
}
function render(snapshot: ReturnType<SpatialEmbodimentWorld['snapshot']>, outDir: string, prefix: string) {
  const projected = projectSpatialEmbodiment(snapshot, { width: 960, height: 540, qualityTier: 'balanced', cameraPosition: [8.5, 5.8, 10.5], cameraRotationDeg: [-19, 40, 0] });
  writeFileSync(resolve(outDir, `${prefix}.png`), projected.png);
  saveJson(resolve(outDir, `${prefix}.scene.vsr3d.json`), projected.scene);
  saveJson(resolve(outDir, `${prefix}.frame-plan.json`), projected.framePlan);
  return { pixelRoot: projected.pixelRoot, projectionRoot: projected.projectionRoot, frameRoot: projected.framePlan.frameRoot, frameVerified: projected.frameVerified, drawCalls: projected.framePlan.stats.visibleDraws, triangles: projected.framePlan.stats.triangleCount };
}
function run(outDir: string): void {
  mkdirSync(outDir, { recursive: true });
  const cfg = JSON.parse(readFileSync('examples/spatial-embodiment/embodied-world.world.json', 'utf8')) as SpatialEmbodimentWorldConfig;
  const allCommands = commands(); const world = new SpatialEmbodimentWorld(cfg); const initial = world.snapshot(); const observedEvents = [];
  for (let tick = 0; tick < 90; tick++) observedEvents.push(...world.step(allCommands).events); const checkpoint = world.snapshot();
  for (let tick = 0; tick < 90; tick++) observedEvents.push(...world.step(allCommands).events); const final = world.snapshot();
  const replay = replaySpatialEmbodiment(cfg, 180, allCommands); const restored = SpatialEmbodimentWorld.fromSnapshot(checkpoint); restored.run(90, allCommands); const recovered = restored.snapshot();
  const initialProjection = render(initial, outDir, 'initial'); const finalProjection = render(final, outDir, 'final');
  const causalDelta = spatialEmbodimentSnapshotToCausalDelta(final, cfg.reality?.realityRoot ?? 'rfe:unknown');
  const aabbQuery = world.queryAabb({ min: { x: -1000, y: 0, z: -1500 }, max: { x: 2500, y: 2500, z: 1500 } });
  const pointQuery = world.queryPoint({ x: final.bodies.find(body => body.id === 'avatar')!.position.x, y: final.bodies.find(body => body.id === 'avatar')!.position.y, z: final.bodies.find(body => body.id === 'avatar')!.position.z });
  const rayHits = world.rayCast({ x: -6000, y: 1000, z: 0 }, { x: 1_000_000, y: 0, z: 0 }, 14_000);
  saveJson(resolve(outDir, 'world.json'), cfg); saveJson(resolve(outDir, 'commands.json'), allCommands); saveJson(resolve(outDir, 'checkpoint-snapshot.json'), checkpoint); saveJson(resolve(outDir, 'final-snapshot.json'), final); saveJson(resolve(outDir, 'causal-delta.json'), causalDelta);
  const sensory = observedEvents.filter(event => event.kind === 'spatial-audio' || event.kind === 'haptic' || event.kind === 'footstep'); saveJson(resolve(outDir, 'final-sensory-events.json'), sensory);
  const evidence = {
    format: 'rsr.spatial-embodiment-demo-evidence.v0.5', runtimeVersion: final.runtimeVersion, worldId: final.worldId,
    deterministicReplay: final.stateRoot === replay.stateRoot, deterministicRecovery: final.stateRoot === recovered.stateRoot,
    initialStateRoot: initial.stateRoot, checkpointStateRoot: checkpoint.stateRoot, finalStateRoot: final.stateRoot, replayStateRoot: replay.stateRoot, recoveredStateRoot: recovered.stateRoot,
    roots: { bodyRoot: final.bodyRoot, contactRoot: final.contactRoot, characterRoot: final.characterRoot, jointRoot: final.jointRoot, sensoryRoot: final.sensoryRoot, causalDeltaRoot: causalDelta.deltaRoot },
    reality: final.reality, diagnostics: final.diagnostics,
    counts: { bodies: final.bodies.length, fixtures: final.bodies.reduce((sum, body) => sum + body.fixtures.length, 0), characters: final.characters.length, joints: final.joints.length, contacts: final.contacts.length, events: observedEvents.length, spatialAudio: observedEvents.filter(event => event.kind === 'spatial-audio').length, haptics: observedEvents.filter(event => event.kind === 'haptic').length, footsteps: observedEvents.filter(event => event.kind === 'footstep').length },
    queries: { aabbQuery, pointQuery, rayHits }, initialProjection, finalProjection
  };
  saveJson(resolve(outDir, 'demo-evidence.json'), evidence);
  console.log(JSON.stringify({ outDir, deterministicReplay: evidence.deterministicReplay, deterministicRecovery: evidence.deterministicRecovery, finalStateRoot: final.stateRoot, roots: evidence.roots, diagnostics: final.diagnostics, counts: evidence.counts, projections: { initial: initialProjection, final: finalProjection }, queryCounts: { aabb: aabbQuery.length, point: pointQuery.length, ray: rayHits.length } }, null, 2));
}
const mode = process.argv[2] ?? 'demo'; const outDir = resolve(process.argv[3] ?? 'outputs/spatial-embodiment-demo'); if (mode !== 'demo' && mode !== 'verify') throw new Error(`未知模式：${mode}`); run(outDir);
if (mode === 'verify') { const evidence = JSON.parse(readFileSync(resolve(outDir, 'demo-evidence.json'), 'utf8')) as { deterministicReplay: boolean; deterministicRecovery: boolean; finalProjection: { frameVerified: boolean }; queries: { rayHits: unknown[] }; roots: { sensoryRoot: string } }; if (!evidence.deterministicReplay || !evidence.deterministicRecovery || evidence.finalProjection.frameVerified !== true || !evidence.queries.rayHits.length || !evidence.roots.sensoryRoot) process.exitCode = 1; }
