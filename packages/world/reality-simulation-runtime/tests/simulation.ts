import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildRealityAssets, verifyRealityBuildManifest } from '../packages/build-pipeline/src/index.js';
import { DeterministicSimulationWorld, replaySimulation, snapshotToCausalDelta, type SimulationCommand, type SimulationWorldConfig } from '../packages/simulation-core/src/index.js';
import { createSimulationObserverProfile, createSimulationVisualDocument, SimulationVSRBridge, snapshotToRuntimeOverrides } from '../packages/simulation-vsr/src/index.js';
import { evaluateAt } from '../packages/core/src/index.js';
import { documentHash, validateDocument } from '../packages/spec/src/index.js';

const tests: Array<{ name: string; fn: () => void }> = [];
const test = (name: string, fn: () => void) => tests.push({ name, fn });
const config = JSON.parse(readFileSync('examples/simulation-assets/falling-box.world.json', 'utf8')) as SimulationWorldConfig;

function run(steps = 180) { const world = new DeterministicSimulationWorld(config); return { world, snapshot: world.run(steps) }; }

test('fixed-step replay produces the same state root', () => {
  const a = replaySimulation(config, 180);
  const b = replaySimulation(config, 180);
  assert.equal(a.stateRoot, b.stateRoot);
  assert.deepEqual(a.bodies, b.bodies);
});

test('falling body collides with the ground without tunnelling or energy explosion', () => {
  const { snapshot } = run(180);
  const box = snapshot.bodies.find(body => body.id === 'falling-box')!;
  const ground = snapshot.bodies.find(body => body.id === 'ground')!;
  const boxBottom = box.position.y + box.halfSize.y;
  const groundTop = ground.position.y - ground.halfSize.y;
  assert.ok(boxBottom <= groundTop + 2, `boxBottom=${boxBottom}, groundTop=${groundTop}`);
  assert.ok(box.position.y < ground.position.y);
  assert.ok(box.position.y > 0, `box escaped world: ${box.position.y}`);
  assert.ok(Math.abs(box.velocity.y) < 2_000_000, `velocity exploded: ${box.velocity.y}`);
});

test('collision begin evidence is stable and content-addressed', () => {
  const events = [];
  const world = new DeterministicSimulationWorld(config);
  for (let index = 0; index < 120; index++) events.push(...world.step().events.filter(event => event.phase === 'begin'));
  assert.ok(events.length >= 1);
  const again = new DeterministicSimulationWorld(config);
  const second = [];
  for (let index = 0; index < 120; index++) second.push(...again.step().events.filter(event => event.phase === 'begin'));
  assert.equal(events[0]!.evidenceHash, second[0]!.evidenceHash);
  assert.equal(events[0]!.pair, 'falling-box|ground');
});

test('snapshot recovery continues to the exact same state root', () => {
  const world = new DeterministicSimulationWorld(config);
  world.run(60);
  const checkpoint = world.snapshot();
  world.run(120);
  const expected = world.snapshot();
  const restored = DeterministicSimulationWorld.fromSnapshot(checkpoint);
  restored.run(120);
  assert.equal(restored.snapshot().stateRoot, expected.stateRoot);
});

test('commands are ordered by id and replay deterministically', () => {
  const commands: SimulationCommand[] = [
    { id: 'b', tick: 90, type: 'apply-impulse', bodyId: 'falling-box', impulse: { x: 50000, y: -180000 } },
    { id: 'a', tick: 90, type: 'wake', bodyId: 'falling-box' }
  ];
  const first = replaySimulation(config, 180, commands);
  const second = replaySimulation(config, 180, [...commands].reverse());
  assert.equal(first.stateRoot, second.stateRoot);
  assert.notEqual(first.stateRoot, replaySimulation(config, 180).stateRoot);
});

test('RFE bridge emits a provisional causal delta instead of mutating authority', () => {
  const snapshot = replaySimulation(config, 100);
  const delta = snapshotToCausalDelta(snapshot, 'rfe:test:root');
  assert.equal(delta.provisional, true);
  assert.equal(delta.baseRealityRoot, 'rfe:test:root');
  assert.equal(delta.simulationRoot, snapshot.stateRoot);
  assert.ok(delta.facts.some(fact => fact.subject === 'body:falling-box'));
  assert.ok(delta.deltaRoot.startsWith('fnv1a64:'));
});

test('simulation Visual IR remains stable while runtime overrides move bodies', () => {
  const document = createSimulationVisualDocument(config);
  assert.equal(validateDocument(document).ok, true);
  const beforeHash = documentHash(document);
  const snapshotA = replaySimulation(config, 1);
  const snapshotB = replaySimulation(config, 60);
  const a = evaluateAt({ document, time: snapshotA.tick / snapshotA.stepHz, runtimeOverrides: snapshotToRuntimeOverrides(snapshotA) });
  const b = evaluateAt({ document, time: snapshotB.tick / snapshotB.stepHz, runtimeOverrides: snapshotToRuntimeOverrides(snapshotB) });
  assert.equal(a.displayState.documentHash, beforeHash);
  assert.equal(b.displayState.documentHash, beforeHash);
  assert.notEqual(a.displayState.semanticHash, b.displayState.semanticHash);
});

test('player and debugger projections share one invariant but disclose different nodes', () => {
  const snapshot = replaySimulation(config, 90);
  const bridge = new SimulationVSRBridge(config);
  const set = bridge.render(snapshot, [createSimulationObserverProfile('player'), createSimulationObserverProfile('debugger')]);
  assert.equal(set.verification.ok, true);
  const player = set.views.find(view => view.observer.observerId === 'simulation:player')!;
  const debuggerView = set.views.find(view => view.observer.observerId === 'simulation:debugger')!;
  assert.equal(player.projection.manifest.invariantHash, debuggerView.projection.manifest.invariantHash);
  assert.ok(player.projection.manifest.hiddenNodeIds.some(id => id.startsWith('velocity:')));
  assert.ok(debuggerView.projection.manifest.shownNodeIds.some(id => id.startsWith('velocity:')));
  assert.notEqual(player.projection.manifest.projectedDisplayHash, debuggerView.projection.manifest.projectedDisplayHash);
});

test('VSR bridge emits deterministic real PNG bytes', () => {
  const snapshot = replaySimulation(config, 90);
  const bridge = new SimulationVSRBridge(config, { width: 320, height: 180 });
  const a = bridge.render(snapshot, [createSimulationObserverProfile('player')]).views[0]!;
  const b = bridge.render(snapshot, [createSimulationObserverProfile('player')]).views[0]!;
  assert.deepEqual([...a.png.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.deepEqual(a.png, b.png);
  assert.equal(a.pngHash, b.pngHash);
});

test('content-addressed build pipeline reuses unchanged assets', () => {
  const out = resolve('outputs/test-simulation-pipeline');
  rmSync(out, { recursive: true, force: true });
  const request = {
    format: 'reality-build.request.v0.1' as const,
    projectId: 'test-pipeline', target: 'node' as const, rootDir: process.cwd(), outDir: out,
    assets: [
      { id: 'world', source: 'examples/simulation-assets/falling-box.world.json', type: 'json' as const },
      { id: 'style', source: 'examples/simulation-assets/render-style.json', type: 'json' as const, dependencies: ['world'] }
    ]
  };
  const first = buildRealityAssets(request);
  const second = buildRealityAssets(request);
  assert.deepEqual(first.builtAssetIds, ['style', 'world']);
  assert.deepEqual(second.reusedAssetIds, ['style', 'world']);
  assert.equal(first.manifest.buildRoot, second.manifest.buildRoot);
  assert.equal(verifyRealityBuildManifest(first.manifestPath).ok, true);
});

test('build manifest detects tampered cached assets', () => {
  const out = resolve('outputs/test-simulation-pipeline-tamper');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const result = buildRealityAssets({
    format: 'reality-build.request.v0.1', projectId: 'tamper', target: 'node', rootDir: process.cwd(), outDir: out,
    assets: [{ id: 'world', source: 'examples/simulation-assets/falling-box.world.json', type: 'json' }]
  });
  const entry = result.manifest.assets[0]!;
  writeFileSync(resolve(out, entry.compiledPath), 'tampered');
  const verification = verifyRealityBuildManifest(result.manifestPath);
  assert.equal(verification.ok, false);
  assert.ok(verification.errors.some(error => error.includes('哈希不匹配')));
});

let passed = 0;
const started = performance.now();
for (const { name, fn } of tests) {
  try { fn(); passed++; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); console.error(error); process.exitCode = 1; }
}
console.log(`\n${passed}/${tests.length} simulation tests passed in ${(performance.now() - started).toFixed(1)}ms.`);
if (passed !== tests.length) process.exitCode = 1;
