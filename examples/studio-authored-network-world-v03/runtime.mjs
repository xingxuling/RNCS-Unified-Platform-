import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import {
  RealityNetworkRuntime,
  verifyNetworkWorldCompilationEnvelope,
} from '@taowind/reality-network-runtime';
import {
  renderNetworkAssetViewport,
  verifyNetworkWorldCompilation,
} from '@taowind/reality-studio-native';
import { rootHash } from '@taowind/rfe-core-sdk';
import { createStudioNetworkWorld } from './project.mjs';

export const STUDIO_NETWORK_PACKAGE_FORMAT = 'rncs.studio-authored-network-world-package.v0.3';
export const STUDIO_NETWORK_PACKAGE_VERSION = '0.3.0-alpha.1';

const FIXED_TIME = '2026-07-18T00:00:00.000Z';
const CLOCK = () => FIXED_TIME;
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const clone = value => structuredClone(value);
const NETWORK_PROFILE = Object.freeze({
  seed: 37,
  fixedLatencyTicks: 1,
  jitterTicks: 1,
  lossRatePpm: 100_000,
  duplicateRatePpm: 75_000,
  reorderRatePpm: 120_000,
});

const seal = (value, field) => {
  const output = clone(value);
  delete output[field];
  output[field] = rootHash(output);
  return output;
};

const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

export async function runStudioAuthoredNetworkWorldV03(options = {}) {
  const outDir = path.resolve(options.outDir ?? path.join(repoRoot, 'artifacts', 'studio-authored-network-world-v03'));
  const metrics = [];
  const measure = async (phase, operation) => {
    const started = performance.now();
    const value = await operation();
    metrics.push({ phase, duration_ms: Number((performance.now() - started).toFixed(3)) });
    return value;
  };
  fs.mkdirSync(outDir, { recursive: true });

  const authored = await measure('studio-authoring-and-compilation', () => Promise.resolve(createStudioNetworkWorld({
    transport: NETWORK_PROFILE,
  })));
  const { session, compilation } = authored;
  const regenerated = createStudioNetworkWorld({ transport: NETWORK_PROFILE });
  const baseProject = clone(session.project);
  const studioVerification = verifyNetworkWorldCompilation(compilation);
  const networkVerification = verifyNetworkWorldCompilationEnvelope(compilation);
  const exported = session.exportArtifacts();

  const first = await measure('authoritative-two-client-session', () => runAuthoritativeSession(compilation));
  const replay = await measure('deterministic-network-replay', () => runAuthoritativeSession(compilation));
  const viewport = await measure('authoritative-gltf-viewport', () => renderNetworkAssetViewport({
    project: baseProject,
    compilation,
    snapshot: first.finalSnapshot,
    width: 480,
    height: 270,
    qualityTier: 'balanced',
  }));

  const tampered = clone(compilation);
  tampered.world_config.bodies.find(body => body.id === 'studio-player-blue').position.x += 1;
  const tamperRejection = await captureError(() => new RealityNetworkRuntime().createSessionFromCompilation({
    sessionId: 'session:studio-v03-tampered',
    compilation: tampered,
    clock: CLOCK,
  }));
  const slotGuardRejection = await captureError(async () => {
    const runtime = new RealityNetworkRuntime();
    await runtime.createSessionFromCompilation({
      sessionId: 'session:studio-v03-slot-guard',
      compilation,
      clock: CLOCK,
    });
    await runtime.joinCompiledSlot({
      sessionId: 'session:studio-v03-slot-guard',
      slotId: 'slot:blue',
      subjectId: 'subject:forged',
    });
  });

  const baseBlue = compilation.world_config.bodies.find(body => body.id === 'studio-player-blue');
  session.spatialPatchBody('studio-player-blue', {
    position: { x: -4200, y: 1100, z: -1200 },
  });
  const editedCompilation = session.networkCompile();
  const editedRuntime = new RealityNetworkRuntime();
  await editedRuntime.createSessionFromCompilation({
    sessionId: 'session:studio-v03-edited',
    compilation: editedCompilation,
    clock: CLOCK,
  });
  const editedInitialSnapshot = editedRuntime.pullSnapshot({
    sessionId: 'session:studio-v03-edited',
    reason: 'editor-counterfactual',
  }).rsrSnapshot;
  const editedBlue = editedCompilation.world_config.bodies.find(body => body.id === 'studio-player-blue');
  const counterfactual = seal({
    format: 'rncs.studio-network-editor-counterfactual.v0.3',
    source_project_root: compilation.project_root,
    source_compilation_root: compilation.compilation_root,
    source_world_config_root: compilation.world_config_root,
    source_initial_state_root: first.initialSnapshot.stateRoot,
    edited_project_root: editedCompilation.project_root,
    edited_compilation_root: editedCompilation.compilation_root,
    edited_world_config_root: editedCompilation.world_config_root,
    edited_initial_state_root: editedInitialSnapshot.stateRoot,
    body_id: 'studio-player-blue',
    source_position: clone(baseBlue.position),
    edited_position: clone(editedBlue.position),
    tampered_compilation_rejection: tamperRejection,
    forged_slot_subject_rejection: slotGuardRejection,
  }, 'counterfactual_root');

  const viewportReceipt = {
    format: viewport.format,
    version: viewport.version,
    viewport_root: viewport.viewport_root,
    project_root: viewport.project_root,
    compilation_root: viewport.compilation_root,
    source_state_root: viewport.source_state_root,
    frame_root: viewport.frame_root,
    pixel_root: viewport.pixel_root,
    imported_asset_roots: viewport.imported_asset_roots,
    gltf_receipt_roots: viewport.gltf_receipt_roots,
    imported_asset_count: viewport.imported_asset_count,
    asset_draw_count: viewport.asset_draw_count,
    frame_verified: viewport.frame_verified,
    viewport: viewport.viewport,
  };
  const acceptance = {
    studioCompilationVerified: studioVerification.valid,
    networkIndependentVerification: networkVerification.valid,
    exportPublishesCompilation: exported.network_world_compilation?.compilation_root === compilation.compilation_root
      && exported.build_plan.files.includes('network-world-compilation.json'),
    sceneAssetsBindPhysicsAndPlayers: compilation.counts.asset_bindings === 2
      && compilation.counts.player_slots === 2
      && compilation.asset_bindings.every(binding => binding.valid),
    runtimeUsesCompiledSourceRoots: first.health.source?.compilationRoot === compilation.compilation_root
      && first.health.source?.projectRoot === compilation.project_root
      && first.health.source?.worldConfigRoot === compilation.world_config_root,
    twoClientsConverge: first.acceptance.twoClientsConverge,
    disconnectedInputPreserved: first.acceptance.disconnectedInputPreserved,
    disconnectedInputCommittedExactlyOnce: first.acceptance.disconnectedInputCommittedExactlyOnce,
    deterministicNetworkReplay: first.evidence.evidence_root === replay.evidence.evidence_root
      && first.finalSnapshot.stateRoot === replay.finalSnapshot.stateRoot,
    authoritativeGlbViewport: viewport.frame_verified
      && viewport.imported_asset_count === 2
      && viewport.asset_draw_count >= 2
      && viewport.png.byteLength > 100,
    sameProjectRecompileDeterministic: exported.network_world_compilation?.compilation_root === compilation.compilation_root,
    freshProjectRegenerationDeterministic: regenerated.session.project.project_root === baseProject.project_root
      && regenerated.compilation.compilation_root === compilation.compilation_root,
    editorMutationChangesCompiledAuthority: counterfactual.source_project_root !== counterfactual.edited_project_root
      && counterfactual.source_compilation_root !== counterfactual.edited_compilation_root
      && counterfactual.source_world_config_root !== counterfactual.edited_world_config_root
      && counterfactual.source_initial_state_root !== counterfactual.edited_initial_state_root,
    tamperedCompilationRejected: tamperRejection === 'NETWORK_COMPILATION_ROOT_MISMATCH',
    forgedSlotSubjectRejected: slotGuardRejection === 'COMPILED_SLOT_SUBJECT_MISMATCH',
  };
  const failed = Object.entries(acceptance).filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length > 0) {
    throw new Error(`STUDIO_NETWORK_V03_ACCEPTANCE_FAILED:${failed.join(',')}`);
  }

  const packagePayload = {
    format: STUDIO_NETWORK_PACKAGE_FORMAT,
    version: STUDIO_NETWORK_PACKAGE_VERSION,
    product: {
      id: 'taowind-studio-authored-network-world-v03',
      level: 'G2-studio-to-authority-vertical-workflow',
      project_id: baseProject.identity.project_id,
      world_id: compilation.world_id,
    },
    roots: {
      studio_project: compilation.project_root,
      spatial_workspace: compilation.spatial_workspace_root,
      source_world: compilation.source_world_root,
      active_scene: compilation.active_scene_root,
      network_authoring: compilation.authoring_root,
      network_compilation: compilation.compilation_root,
      world_config: compilation.world_config_root,
      initial_authoritative_state: first.initialSnapshot.stateRoot,
      final_authoritative_state: first.finalSnapshot.stateRoot,
      network_replay: first.evidence.evidence_root,
      viewport: viewport.viewport_root,
      viewport_pixels: viewport.pixel_root,
      editor_counterfactual: counterfactual.counterfactual_root,
      edited_network_compilation: editedCompilation.compilation_root,
      edited_initial_authoritative_state: editedInitialSnapshot.stateRoot,
    },
    counts: {
      bodies: compilation.counts.bodies,
      characters: compilation.counts.characters,
      joints: compilation.counts.joints,
      player_slots: compilation.counts.player_slots,
      asset_bindings: compilation.counts.asset_bindings,
      network_ticks: first.health.server.tick,
      authoritative_world_instances: first.health.server.authoritativeWorldInstances,
    },
    acceptance,
    generated_at: FIXED_TIME,
  };
  const productPackage = seal(packagePayload, 'package_root');
  const performanceReport = {
    format: 'rncs.studio-authored-network-world-performance.v0.3',
    phases: metrics,
    total_duration_ms: Number(metrics.reduce((sum, metric) => sum + metric.duration_ms, 0).toFixed(3)),
    deterministic_root_excludes_wall_clock_metrics: true,
  };
  const audit = {
    format: 'rncs.studio-authored-network-world-audit.v0.3',
    version: STUDIO_NETWORK_PACKAGE_VERSION,
    status: 'pass',
    package_root: productPackage.package_root,
    claims: {
      native: [
        'Studio-authored RSR world compilation',
        'Network independent compilation verification',
        'server-authoritative two-client prediction and recovery',
        'deterministic network replay',
      ],
      projection: ['authoritative GLB-backed VSR viewport'],
      counterfactual: ['Studio body edit changes compiled world and initial authoritative State Root'],
      none: [
        'complete Godot or Unity editor parity is not claimed',
        'large-scale public internet multiplayer is not claimed',
        'Android APK and console export are not part of this package',
      ],
    },
    acceptance,
    limitations: [
      'This package proves one real Studio-to-network authority workflow, not full engine feature parity.',
      'The network test uses deterministic loopback fault injection rather than a public WAN deployment.',
      'The GLB viewport is a verified software projection; a complete interactive 3D editor viewport remains future work.',
    ],
    generated_at: FIXED_TIME,
  };

  writeJson(path.join(outDir, 'studio-project.json'), baseProject);
  writeJson(path.join(outDir, 'network-world-compilation.json'), compilation);
  writeJson(path.join(outDir, 'network-runtime-evidence.json'), first.evidence);
  writeJson(path.join(outDir, 'network-replay-evidence.json'), replay.evidence);
  writeJson(path.join(outDir, 'authoritative-snapshot.json'), first.finalSnapshot);
  writeJson(path.join(outDir, 'viewport-receipt.json'), viewportReceipt);
  writeJson(path.join(outDir, 'editor-counterfactual.json'), counterfactual);
  writeJson(path.join(outDir, 'studio-network-package.json'), productPackage);
  writeJson(path.join(outDir, 'audit-report.json'), audit);
  writeJson(path.join(outDir, 'performance-report.json'), performanceReport);
  fs.writeFileSync(path.join(outDir, 'authoritative-viewport.png'), viewport.png);

  return {
    package: productPackage,
    audit,
    performance: performanceReport,
    compilation,
    editedCompilation,
    network: first,
    replay,
    counterfactual,
    viewport: viewportReceipt,
    viewportPng: viewport.png,
    outDir,
  };
}

async function runAuthoritativeSession(compilation) {
  const sessionId = 'session:studio-authored-network-v03';
  const runtime = new RealityNetworkRuntime();
  await runtime.createSessionFromCompilation({ sessionId, compilation, clock: CLOCK });
  await runtime.joinCompiledSlot({ sessionId, slotId: 'slot:blue', subjectId: 'subject:blue' });
  await runtime.joinCompiledSlot({ sessionId, slotId: 'slot:red', subjectId: 'subject:red' });
  const context = runtime.require(sessionId);
  const initialSnapshot = clone(context.server.lastSnapshot);

  for (let tick = 0; tick < 6; tick++) {
    runtime.submitInput({
      sessionId,
      playerId: 'blue',
      command: { type: 'move', x: tick % 2 === 0 ? 1_000_000 : 0, z: tick % 2 === 0 ? 0 : 1_000_000 },
    });
    runtime.submitInput({
      sessionId,
      playerId: 'red',
      command: { type: 'move', x: tick % 2 === 0 ? -1_000_000 : 0, z: tick % 2 === 0 ? 0 : -1_000_000 },
    });
    runtime.advanceServerTick({ sessionId });
  }

  runtime.disconnect({ sessionId, playerId: 'blue' });
  const disconnectedInput = runtime.submitInput({
    sessionId,
    playerId: 'blue',
    command: { type: 'move', x: 1_000_000, z: 0 },
    targetServerTick: context.server.rsrWorld.tick + 5,
  });
  runtime.advanceServerTick({ sessionId, ticks: 2 });
  const disconnectedInputPreserved = context.clients.get('blue').unacknowledged
    .some(entry => entry.input.inputSequence === disconnectedInput.inputSequence);
  runtime.reconnect({ sessionId, playerId: 'blue' });
  runtime.advanceServerTick({ sessionId, ticks: 18 });

  const disconnectedInputCommitCount = context.server.accepted
    .filter(input => input.playerId === 'blue' && input.inputSequence === disconnectedInput.inputSequence).length;
  const finalSnapshot = clone(context.server.lastSnapshot);
  const health = runtime.getSessionHealth({ sessionId });
  const evidence = seal({
    format: 'rncs.studio-authored-network-runtime-evidence.v0.3',
    session_id: sessionId,
    compilation_root: compilation.compilation_root,
    project_root: compilation.project_root,
    world_config_root: compilation.world_config_root,
    initial_state_root: initialSnapshot.stateRoot,
    final_state_root: finalSnapshot.stateRoot,
    final_tick: finalSnapshot.tick,
    disconnected_input_sequence: disconnectedInput.inputSequence,
    disconnected_input_target_tick: disconnectedInput.targetServerTick,
    disconnected_input_commit_count: disconnectedInputCommitCount,
    server_receipt_roots: context.server.receipts.map(receipt => receipt.networkReceiptRoot),
    client_state_roots: {
      blue: health.clients.blue.clientStateRoot,
      red: health.clients.red.clientStateRoot,
    },
    transport: clone(health.transport),
  }, 'evidence_root');
  return {
    runtime,
    health,
    initialSnapshot,
    finalSnapshot,
    evidence,
    acceptance: {
      twoClientsConverge: health.clients.blue.clientStateRoot === health.server.stateRoot
        && health.clients.red.clientStateRoot === health.server.stateRoot,
      disconnectedInputPreserved,
      disconnectedInputCommittedExactlyOnce: disconnectedInputCommitCount === 1,
    },
  };
}

async function captureError(operation) {
  try {
    await operation();
    return null;
  } catch (error) {
    return String(error?.message ?? error).split(':')[0];
  }
}
