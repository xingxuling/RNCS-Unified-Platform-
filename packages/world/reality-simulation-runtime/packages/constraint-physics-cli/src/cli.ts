import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ConstraintCausalPhysicsWorld,
  constraintSnapshotToCausalDelta,
  replayConstraintPhysics,
  type ConstraintPhysicsCommand,
  type ConstraintPhysicsWorldConfig
} from '../../constraint-physics/src/index.js';
import {
  ConstraintPhysicsVSRBridge,
  createConstraintPhysicsObserverProfile
} from '../../constraint-physics-vsr/src/index.js';

function saveJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function commands(): ConstraintPhysicsCommand[] {
  return [
    { id: 'platform-reverse', tick: 90, type: 'set-kinematic-velocity', bodyId: 'moving-platform', velocity: { x: -65000, y: 0 } },
    { id: 'crate-kick', tick: 55, type: 'apply-impulse', bodyId: 'crate', impulse: { x: 70000, y: -90000 } }
  ];
}

function renderViews(bridge: ConstraintPhysicsVSRBridge, snapshot: ReturnType<ConstraintCausalPhysicsWorld['snapshot']>, outDir: string, prefix: string): { playerHash: string; debuggerHash: string; verification: unknown } {
  const rendered = bridge.render(snapshot, [
    createConstraintPhysicsObserverProfile('player'),
    createConstraintPhysicsObserverProfile('debugger')
  ]);
  const player = rendered.views.find(view => view.observer.observerId.endsWith(':player'))!;
  const debuggerView = rendered.views.find(view => view.observer.observerId.endsWith(':debugger'))!;
  writeFileSync(resolve(outDir, `${prefix}-player.png`), player.png);
  writeFileSync(resolve(outDir, `${prefix}-debugger.png`), debuggerView.png);
  return { playerHash: player.pngHash, debuggerHash: debuggerView.pngHash, verification: rendered.verification };
}

function runDemo(outDir: string): void {
  mkdirSync(outDir, { recursive: true });
  const config = JSON.parse(readFileSync('examples/constraint-physics/constraint-playground.world.json', 'utf8')) as ConstraintPhysicsWorldConfig;
  const allCommands = commands();
  const world = new ConstraintCausalPhysicsWorld(config);
  const initial = world.snapshot();
  world.run(60, allCommands);
  const checkpoint = world.snapshot();
  world.run(120, allCommands);
  const final = world.snapshot();
  const replay = replayConstraintPhysics(config, 180, allCommands);
  const restored = ConstraintCausalPhysicsWorld.fromSnapshot(checkpoint);
  restored.run(120, allCommands);
  const recovered = restored.snapshot();
  const bridge = new ConstraintPhysicsVSRBridge(config, { width: 720, height: 420, title: '现实约束与因果响应织构' });
  const initialViews = renderViews(bridge, initial, outDir, 'initial');
  const finalViews = renderViews(bridge, final, outDir, 'final');
  const delta = constraintSnapshotToCausalDelta(final, 'rfe:demo:base-root');

  saveJson(resolve(outDir, 'world.json'), config);
  saveJson(resolve(outDir, 'checkpoint-snapshot.json'), checkpoint);
  saveJson(resolve(outDir, 'final-snapshot.json'), final);
  saveJson(resolve(outDir, 'causal-delta.json'), delta);
  saveJson(resolve(outDir, 'render-document.vsr.json'), bridge.document);
  saveJson(resolve(outDir, 'demo-evidence.json'), {
    format: 'rsr.constraint-physics-demo-evidence.v0.2',
    runtimeVersion: final.runtimeVersion,
    worldId: final.worldId,
    deterministicReplay: final.stateRoot === replay.stateRoot,
    deterministicRecovery: final.stateRoot === recovered.stateRoot,
    initialStateRoot: initial.stateRoot,
    checkpointStateRoot: checkpoint.stateRoot,
    finalStateRoot: final.stateRoot,
    replayStateRoot: replay.stateRoot,
    recoveredStateRoot: recovered.stateRoot,
    contactRoot: final.contactRoot,
    constraintRoot: final.constraintRoot,
    islandRoot: final.islandRoot,
    causalDeltaRoot: delta.deltaRoot,
    diagnostics: final.diagnostics,
    counts: {
      bodies: final.bodies.length,
      constraints: final.constraints.length,
      contacts: final.contacts.length,
      events: final.events.length,
      islands: final.islands.length
    },
    initialViews,
    finalViews
  });
  console.log(JSON.stringify({
    outDir,
    deterministicReplay: final.stateRoot === replay.stateRoot,
    deterministicRecovery: final.stateRoot === recovered.stateRoot,
    finalStateRoot: final.stateRoot,
    diagnostics: final.diagnostics,
    contacts: final.contacts.length,
    events: final.events.length
  }, null, 2));
}

const mode = process.argv[2] ?? 'demo';
const outDir = resolve(process.argv[3] ?? 'outputs/constraint-physics-demo');
if (mode !== 'demo' && mode !== 'verify') throw new Error(`未知模式：${mode}`);
runDemo(outDir);
const evidence = JSON.parse(readFileSync(resolve(outDir, 'demo-evidence.json'), 'utf8')) as { deterministicReplay: boolean; deterministicRecovery: boolean; finalViews: { verification: { ok?: boolean } } };
if (mode === 'verify' && (!evidence.deterministicReplay || !evidence.deterministicRecovery || evidence.finalViews.verification.ok !== true)) process.exitCode = 1;
