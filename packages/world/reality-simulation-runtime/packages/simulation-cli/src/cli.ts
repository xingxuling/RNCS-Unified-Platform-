#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildRealityAssets, verifyRealityBuildManifest } from '../../build-pipeline/src/index.js';
import { DeterministicSimulationWorld, replaySimulation, snapshotToCausalDelta, type SimulationWorldConfig } from '../../simulation-core/src/index.js';
import { createSimulationObserverProfile, SimulationVSRBridge } from '../../simulation-vsr/src/index.js';

function sha256(data: any): string { return createHash('sha256').update(data).digest('hex'); }
function readWorld(path: string): SimulationWorldConfig { return JSON.parse(readFileSync(path, 'utf8')) as SimulationWorldConfig; }
function writeJson(path: string, value: unknown): void { writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); }

function runDemo(outArgument?: string): void {
  const root = process.cwd();
  const outDir = resolve(outArgument ?? 'outputs/simulation-demo');
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const worldPath = resolve(root, 'examples/simulation-assets/falling-box.world.json');
  const stylePath = resolve(root, 'examples/simulation-assets/render-style.json');
  if (!existsSync(worldPath) || !existsSync(stylePath)) throw new Error('示例资产不存在。');

  const firstBuild = buildRealityAssets({
    format: 'reality-build.request.v0.1', projectId: 'falling-box-demo', target: 'node', rootDir: root,
    outDir: resolve(outDir, 'build'),
    assets: [
      { id: 'world', source: 'examples/simulation-assets/falling-box.world.json', type: 'json' },
      { id: 'style', source: 'examples/simulation-assets/render-style.json', type: 'json', dependencies: ['world'] }
    ]
  });
  const secondBuild = buildRealityAssets({
    format: 'reality-build.request.v0.1', projectId: 'falling-box-demo', target: 'node', rootDir: root,
    outDir: resolve(outDir, 'build'),
    assets: [
      { id: 'world', source: 'examples/simulation-assets/falling-box.world.json', type: 'json' },
      { id: 'style', source: 'examples/simulation-assets/render-style.json', type: 'json', dependencies: ['world'] }
    ]
  });
  const buildVerification = verifyRealityBuildManifest(firstBuild.manifestPath);

  const config = readWorld(worldPath);
  const world = new DeterministicSimulationWorld(config);
  const checkpointTick = 60;
  const finalTick = 180;
  let checkpoint = world.snapshot();
  let collisionSnapshot = world.snapshot();
  let capturedCollision = false;
  const eventEvidence: unknown[] = [];
  for (let tick = 0; tick < finalTick; tick++) {
    const result = world.step();
    if (result.events.some(event => event.phase === 'begin')) {
      eventEvidence.push(...result.events.filter(event => event.phase === 'begin'));
      if (!capturedCollision) { collisionSnapshot = result.snapshot; capturedCollision = true; }
    }
    if (world.tick === checkpointTick) checkpoint = world.snapshot();
  }
  const final = world.snapshot();
  const replay = replaySimulation(config, finalTick);
  const restored = DeterministicSimulationWorld.fromSnapshot(checkpoint);
  restored.run(finalTick - checkpointTick);
  const restoredFinal = restored.snapshot();
  const causalDelta = snapshotToCausalDelta(final, 'rfe:demo:genesis');

  const style = JSON.parse(readFileSync(stylePath, 'utf8')) as { canvas: { width: number; height: number }; colors: Record<string, string> };
  const bridge = new SimulationVSRBridge(config, {
    width: style.canvas.width, height: style.canvas.height,
    background: style.colors.background, dynamicFill: style.colors.dynamic,
    staticFill: style.colors.static, debugFill: style.colors.debug
  });
  const observers = [createSimulationObserverProfile('player'), createSimulationObserverProfile('debugger')];
  const renderSet = bridge.render(final, observers);
  const collisionRenderSet = bridge.render(collisionSnapshot, observers);
  for (const view of renderSet.views) {
    const kind = view.observer.observerId.split(':').at(-1) ?? 'observer';
    writeFileSync(resolve(outDir, `${kind}.png`), view.png);
    writeJson(resolve(outDir, `${kind}.projection.json`), view.projection.manifest);
  }
  for (const view of collisionRenderSet.views) {
    const kind = view.observer.observerId.split(':').at(-1) ?? 'observer';
    writeFileSync(resolve(outDir, `collision-${kind}.png`), view.png);
  }

  const evidence = {
    format: 'rsr.demo-evidence.v0.1',
    finalTick,
    checkpointTick,
    finalStateRoot: final.stateRoot,
    replayStateRoot: replay.stateRoot,
    restoredStateRoot: restoredFinal.stateRoot,
    deterministicReplay: final.stateRoot === replay.stateRoot,
    deterministicRecovery: final.stateRoot === restoredFinal.stateRoot,
    collisionBeginEvidence: eventEvidence,
    collisionSnapshot: { tick: collisionSnapshot.tick, stateRoot: collisionSnapshot.stateRoot, contactRoot: collisionSnapshot.contactRoot },
    causalDeltaRoot: causalDelta.deltaRoot,
    sourceDocumentHash: renderSet.sourceDocumentHash,
    sourceDisplayHash: renderSet.sourceDisplayHash,
    invariantHash: renderSet.invariantHash,
    observerVerification: renderSet.verification,
    views: renderSet.views.map(view => ({ observerId: view.observer.observerId, pngHash: sha256(view.png), projectionHash: view.projection.manifest.projectedDisplayHash })),
    collisionViews: collisionRenderSet.views.map(view => ({ observerId: view.observer.observerId, pngHash: sha256(view.png), projectionHash: view.projection.manifest.projectedDisplayHash })),
    build: {
      buildRoot: firstBuild.manifest.buildRoot,
      firstBuilt: firstBuild.builtAssetIds,
      secondReused: secondBuild.reusedAssetIds,
      verification: buildVerification
    }
  };
  writeJson(resolve(outDir, 'final-snapshot.json'), final);
  writeJson(resolve(outDir, 'checkpoint-snapshot.json'), checkpoint);
  writeJson(resolve(outDir, 'collision-snapshot.json'), collisionSnapshot);
  writeJson(resolve(outDir, 'causal-delta.json'), causalDelta);
  writeJson(resolve(outDir, 'demo-evidence.json'), evidence);
  writeJson(resolve(outDir, 'render-document.vsr.json'), bridge.document);

  if (!evidence.deterministicReplay || !evidence.deterministicRecovery || !renderSet.verification.ok || !buildVerification.ok) {
    throw new Error('端到端验证失败。');
  }
  console.log(JSON.stringify(evidence, null, 2));
}

const command = process.argv[2] ?? 'demo';
if (command === 'demo' || command === 'verify') runDemo(process.argv[3]);
else {
  console.error(`未知命令：${command}`);
  process.exitCode = 1;
}
