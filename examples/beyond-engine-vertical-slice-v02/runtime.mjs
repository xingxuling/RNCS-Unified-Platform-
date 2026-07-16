import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createServer as createTcpServer } from 'node:net';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import {
  RealityNetworkRuntime,
} from '@taowind/reality-network-runtime';
import {
  authorize as authorizeRncs,
  commit as commitRncs,
  newProposal,
  verify as verifyRncs,
} from '@taowind/rncs-core-contract';
import {
  buildProject,
  normalizeBuildRequest,
  readJson,
  rootHash,
  seal as sealBuild,
  verifyBuild,
  writeJson,
} from '@taowind/reality-build-fabric';
import {
  createLocalAssetRecord,
  seal as sealStudio,
  sealUnifiedProject,
} from '@taowind/reality-studio-native';
import { createPlayableWorldConfig, runPlayableWorld } from '../playable-spatial-world-v08/runtime.mjs';

export const SOVEREIGN_WORLD_PACKAGE_FORMAT = 'rncs.sovereign-world-package.v0.2';
export const SOVEREIGN_WORLD_PACKAGE_VERSION = '0.2.0-alpha.1';

const FIXED_TIME = '2026-07-17T00:00:00.000Z';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../..');
const SAMPLE_PROJECT_FILE = path.join(REPO_ROOT, 'apps', 'reality-build', 'examples', '冰境试炼.unified-project.json');

export async function runBeyondEngineVerticalSliceV02(options = {}) {
  const outDir = path.resolve(options.outDir ?? path.join(REPO_ROOT, 'artifacts', 'beyond-engine-vertical-slice-v02'));
  const memoryStart = process.memoryUsage().rss;
  const metrics = [];
  const measure = async (phase, operation) => {
    const started = performance.now();
    const value = await operation();
    metrics.push({ phase, duration_ms: Number((performance.now() - started).toFixed(3)) });
    return value;
  };
  fs.mkdirSync(outDir, { recursive: true });

  const gameBrainModule = await loadGameBrainModule(options);
  const gameBrain = await measure('gamebrain-provider-lifecycle', () => gameBrainModule.runSovereignWorldProviderScenario());
  const rncs = await measure('rncs-core-4r-commit', () => Promise.resolve(runCanonicalRncsLifecycle(gameBrain)));
  const [spatial, network] = await measure('spatial-and-network-runtime', () => Promise.all([
    runPlayableWorld(),
    runDisconnectRecoveryScenario(),
  ]));
  const assets = await measure('asset-import', () => Promise.resolve(createSovereignAssets(outDir)));
  const project = await measure('unified-project-seal', () => Promise.resolve(createSovereignProject({
    outDir,
    assets,
    gameBrain,
    rncs,
    network,
    spatial,
  })));
  const build = await measure('multi-target-build', () => Promise.resolve(buildSovereignProject({
    outDir,
    project,
    gameBrain,
    rncs,
    network,
  })));
  const executable = await measure('product-executable-verification', () => verifyProductExecutables(build.output_dir));

  const assetManifest = readJson(path.join(build.output_dir, 'asset-manifest.json'));
  const modelFile = assetManifest.records[assets.model.asset_id]?.files.find((file) => file.mime === 'model/gltf-binary');
  const audioFile = assetManifest.records[assets.audio.asset_id]?.files.find((file) => file.mime === 'audio/wav');
  const buildVerification = verifyBuild(build.output_dir);
  const bakedFiles = Object.values(assetManifest.records).flatMap((record) => record.files);
  const uniqueBakedFiles = [...new Map(bakedFiles.map((file) => [file.store_path, file])).values()];
  const uniqueBakedBytes = uniqueBakedFiles.reduce((sum, file) => sum + file.size, 0);
  const declaredBakedBytes = bakedFiles.reduce((sum, file) => sum + file.size, 0);
  const acceptance = {
    realGameBrainProvider: Object.values(gameBrain.acceptance).every(Boolean),
    languageChangedWorldAction: gameBrain.acceptance.languageChangedWorldAction,
    fivePlanesPrecedeExecution: gameBrain.acceptance.fivePlanesExecutedBeforeAction,
    canonicalRncsProposalCommitted: rncs.verification.valid && rncs.committed.phase === 'committed',
    unauthorizedCommitRejected: rncs.negative.unauthorizedCommitRejected,
    malformed4RGateRejected: rncs.negative.malformed4RGateRejected,
    modelImportedAndBaked: assets.model.kind === 'model-3d' && assets.validation.glb.valid && Boolean(modelFile),
    audioImportedAndBaked: assets.audio.kind === 'audio' && assets.validation.wav.valid && Boolean(audioFile),
    viewportRenderedRealSpatialAsset: spatial.acceptance.gltfAssetProjected && spatial.png.byteLength > 100,
    twoClientDisconnectRecovery: Object.values(network.acceptance).every(Boolean),
    deterministicMultiTargetBuild: buildVerification.valid && build.runtime_deterministic === true,
    clientHeadlessReplayShareProject: executable.headless.health.project_root === project.project_root
      && executable.headless.health.replay_root === build.runtime_replay_root
      && executable.replay.expected_replay_root === build.runtime_replay_root,
    replayBundleExecutes: executable.replay.ok === true,
    headlessServerExecutes: executable.headless.health.status === 'healthy'
      && executable.headless.replay.deterministic === true
      && executable.headless.replay.replay_root === build.runtime_replay_root,
  };
  const failed = Object.entries(acceptance).filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length > 0) {
    throw new Error(`SOVEREIGN_WORLD_PACKAGE_ACCEPTANCE_FAILED:${failed.join(',')}:${JSON.stringify({
      network: network.acceptance,
      expectedReplayRoot: build.runtime_replay_root,
      headlessHealth: executable.headless.health,
      headlessReplay: executable.headless.replay,
    })}`);
  }

  const packagePayload = {
    format: SOVEREIGN_WORLD_PACKAGE_FORMAT,
    version: SOVEREIGN_WORLD_PACKAGE_VERSION,
    product: {
      id: 'taowind-sovereign-world-v02',
      level: 'G1-verified-vertical-workflow',
      project_id: project.identity.project_id,
      targets: build.targets.map((target) => ({ target: target.target, target_root: target.target_root })),
    },
    roots: {
      gamebrain_semantic: gameBrain.semanticRoot,
      foundation_run: gameBrain.roots.foundationRun,
      rncs_proposal: rncs.proposal.proposal_root,
      rncs_authority: rncs.authorized.authority.decision_root,
      rncs_commit: rncs.committed.commit.commit_root,
      network_recovery: network.evidence_root,
      spatial_authority: spatial.authorityRoot,
      viewport_pixels: spatial.pixelRoot,
      project: project.project_root,
      model_asset: assets.model.asset_root,
      audio_asset: assets.audio.asset_root,
      build_receipt: build.receipt_root,
      build_runtime_replay: build.runtime_replay_root,
    },
    assets: {
      model: { asset_id: assets.model.asset_id, sha256: modelFile.sha256, mime: modelFile.mime, bytes: modelFile.size },
      audio: { asset_id: assets.audio.asset_id, sha256: audioFile.sha256, mime: audioFile.mime, bytes: audioFile.size },
    },
    runtime: {
      gamebrain_provider_calls: 1,
      network_tick: network.tick,
      disconnected_input_count: network.disconnected_input_count,
      foundation_plane_order: gameBrain.language.planeOrder,
      replay_verified: executable.replay.ok,
      headless_tick: executable.headless.health.tick,
    },
    acceptance,
  };
  const sovereignPackage = sealBuild(packagePayload, 'package_root');
  const memoryEnd = process.memoryUsage().rss;
  const performanceReport = {
    format: 'rncs.sovereign-world-performance.v0.2',
    compile_time_ms: metrics.find((item) => item.phase === 'rncs-core-4r-commit')?.duration_ms ?? null,
    runtime_latency_ms: Number(metrics
      .filter((item) => ['gamebrain-provider-lifecycle', 'spatial-and-network-runtime'].includes(item.phase))
      .reduce((sum, item) => sum + item.duration_ms, 0).toFixed(3)),
    replay_and_headless_verification_ms: metrics.find((item) => item.phase === 'product-executable-verification')?.duration_ms ?? null,
    memory_rss_start_bytes: memoryStart,
    memory_rss_end_bytes: memoryEnd,
    memory_rss_delta_bytes: memoryEnd - memoryStart,
    event_count: network.tick + gameBrain.language.runtimeResults.length,
    provider_call_count: 1,
    cache_hit_rate: build.cache_hit ? 1 : 0,
    asset_store_file_count: assetManifest.store.file_count,
    asset_store_total_bytes: uniqueBakedBytes,
    compression_ratio: uniqueBakedBytes > 0 ? Number((declaredBakedBytes / uniqueBakedBytes).toFixed(6)) : 1,
    phases: metrics,
    deterministic_root_excludes_wall_clock_metrics: true,
  };
  const audit = {
    format: 'rncs.sovereign-world-audit.v0.2',
    version: SOVEREIGN_WORLD_PACKAGE_VERSION,
    status: 'pass',
    package_root: sovereignPackage.package_root,
    claims: {
      native: ['RNCS Core proposal/authority/commit', 'Reality Network two-client authority', 'Reality Build runtime replay'],
      bridge: ['GameBrain Foundation cognition through canonical RNCS proposal input'],
      projection: ['software spatial viewport from authoritative spatial state'],
      asset: ['deterministic GLB and PCM WAV source files'],
      none: ['Android APK not built in this workflow', 'full RCL 14+5+3+2 Native VM lowering not claimed'],
    },
    counterfactuals: rncs.negative,
    acceptance,
    performance: performanceReport,
    limitations: [
      'This is one verified G1 workflow, not proof of feature parity across every Godot or Unity subsystem.',
      'The GameBrain integration is a verified provider bridge; it is not relabeled as RNCS-native cognition.',
      'The generated Windows target is portable browser-host mode; a native executable is outside this workflow.',
    ],
    rollback: 'RNCS local rollback restores the GameBrain authority root and preserves administrative receipts.',
    generated_at: FIXED_TIME,
  };

  writeJson(path.join(outDir, 'gamebrain-provider-evidence.json'), gameBrain);
  writeJson(path.join(outDir, 'rncs-core-envelope.json'), rncs);
  writeJson(path.join(outDir, 'network-recovery-evidence.json'), network);
  writeJson(path.join(outDir, 'asset-import-evidence.json'), assets.validation);
  writeJson(path.join(outDir, 'sovereign-world-package.json'), sovereignPackage);
  writeJson(path.join(outDir, 'audit-report.json'), audit);
  writeJson(path.join(outDir, 'performance-report.json'), performanceReport);
  fs.writeFileSync(path.join(outDir, 'spatial-preview.png'), spatial.png);
  return {
    package: sovereignPackage,
    audit,
    performance: performanceReport,
    build,
    executable,
    projectFile: project.__file,
    spatialPreviewPng: spatial.png,
  };
}

async function loadGameBrainModule(options) {
  if (options.gameBrainModule) return assertGameBrainModule(options.gameBrainModule);
  const requested = options.gameBrainModulePath ?? process.env.GAMEBRAIN_MODULE_PATH;
  if (!requested) {
    const error = new Error('GAMEBRAIN_PROVIDER_REQUIRED: set GAMEBRAIN_MODULE_PATH to the zhinao src/index.mjs module');
    error.code = 'GAMEBRAIN_PROVIDER_REQUIRED';
    throw error;
  }
  const specifier = requested.startsWith('file:')
    ? requested
    : path.isAbsolute(requested) || requested.startsWith('.')
      ? pathToFileURL(path.resolve(requested)).href
      : requested;
  return assertGameBrainModule(await import(specifier));
}

function assertGameBrainModule(module) {
  if (typeof module?.runSovereignWorldProviderScenario !== 'function') {
    const error = new Error('GAMEBRAIN_PROVIDER_INCOMPATIBLE: runSovereignWorldProviderScenario is missing');
    error.code = 'GAMEBRAIN_PROVIDER_INCOMPATIBLE';
    throw error;
  }
  return module;
}

function runCanonicalRncsLifecycle(gameBrain) {
  const proposal = newProposal(gameBrain.proposalInput);
  const proposalVerification = verifyRncs(proposal);
  let unauthorizedCommitRejected = false;
  try {
    commitRncs(proposal, {
      generation: proposal.base_generation.generation + 1,
      generation_root: gameBrain.commit.afterAuthorityStateRoot,
    });
  } catch (error) {
    unauthorizedCommitRejected = /PHASE|AUTHORITY/.test(error.message);
  }

  const malformedInput = structuredClone(gameBrain.proposalInput);
  malformedInput.transition_id += ':invalid-4r';
  malformedInput.intent.intent_id += ':invalid-4r';
  malformedInput.foundation_governance.invariants = 'invalid';
  const malformedProposal = newProposal(malformedInput);
  const malformedAuthorized = authorizeRncs(malformedProposal, {
    status: 'approved',
    resolver: 'human:sovereign-world-v02-negative-test',
  });
  let malformed4RGateRejected = false;
  try {
    commitRncs(malformedAuthorized, {
      generation: malformedAuthorized.base_generation.generation + 1,
      generation_root: gameBrain.commit.afterAuthorityStateRoot,
    });
  } catch (error) {
    malformed4RGateRejected = /FOUNDATION_4R_GATE_FAILED/.test(error.message);
  }

  const authorized = authorizeRncs(proposal, {
    status: 'approved',
    resolver: 'human:sovereign-world-v02',
    claims: ['gamebrain-provider-simulation-verified', 'product-acceptance-explicit'],
    constraints: ['no-external-provider-side-effects', 'rollback-root-required'],
    reason: 'explicit human authority after isolated provider simulation',
  });
  const committed = commitRncs(authorized, {
    generation: proposal.base_generation.generation + 1,
    generation_root: gameBrain.commit.afterAuthorityStateRoot,
    receipt_refs: [gameBrain.roots.commitEffect, gameBrain.roots.providerOutput],
  });
  return {
    proposal,
    authorized,
    committed,
    verification: verifyRncs(committed),
    proposal_verification: proposalVerification,
    negative: { unauthorizedCommitRejected, malformed4RGateRejected },
  };
}

async function runDisconnectRecoveryScenario() {
  const runtime = new RealityNetworkRuntime();
  const sessionId = 'session:sovereign-world-v02';
  await runtime.createSession({
    sessionId,
    worldConfig: createPlayableWorldConfig(),
    network: { seed: 20260717, fixedLatencyTicks: 1, jitterTicks: 1 },
    clock: () => FIXED_TIME,
  });
  await runtime.joinSession({ sessionId, subjectId: 'subject:blue', playerId: 'blue', characterId: 'character:blue', bodyId: 'player-blue' });
  await runtime.joinSession({ sessionId, subjectId: 'subject:red', playerId: 'red', characterId: 'character:red', bodyId: 'player-red' });
  for (let tick = 0; tick < 18; tick += 1) {
    runtime.submitInput({ sessionId, playerId: 'blue', command: { type: 'move', x: 1_000_000, z: 0 } });
    runtime.submitInput({ sessionId, playerId: 'red', command: { type: 'move', x: -1_000_000, z: 0 } });
    runtime.advanceServerTick({ sessionId });
  }
  for (let tick = 0; tick < 8; tick += 1) runtime.advanceServerTick({ sessionId });
  const disconnect = runtime.disconnect({ sessionId, playerId: 'blue' });
  runtime.submitInput({ sessionId, playerId: 'blue', command: { type: 'move', x: 0, z: 1_000_000 } });
  for (let tick = 0; tick < 4; tick += 1) runtime.advanceServerTick({ sessionId });
  const disconnectedInputCount = runtime.require(sessionId).clients.get('blue').unacknowledged.length;
  const reconnect = runtime.reconnect({ sessionId, playerId: 'blue' });
  for (let tick = 0; tick < 24; tick += 1) runtime.advanceServerTick({ sessionId });
  const health = runtime.getSessionHealth({ sessionId });
  const acceptance = {
    disconnectedInputRetained: disconnectedInputCount === 1,
    reconnectEvidenceProduced: Boolean(disconnect.evidenceRoot) && Boolean(reconnect.evidence.evidenceRoot),
    blueConverged: health.clients.blue.unacknowledgedInputs === 0
      && health.clients.blue.clientStateRoot === health.server.stateRoot,
    redConverged: health.clients.red.unacknowledgedInputs === 0
      && health.clients.red.clientStateRoot === health.server.stateRoot,
  };
  const payload = {
    format: 'rncs.sovereign-world-network-recovery.v0.2',
    session_id: sessionId,
    tick: health.server.tick,
    authority_root: health.server.stateRoot,
    client_roots: { blue: health.clients.blue.clientStateRoot, red: health.clients.red.clientStateRoot },
    disconnected_input_count: disconnectedInputCount,
    disconnect_evidence_root: disconnect.evidenceRoot,
    reconnect_evidence_root: reconnect.evidence.evidenceRoot,
    acceptance,
  };
  return { ...payload, evidence_root: rootHash(payload) };
}

function createSovereignAssets(outDir) {
  const projectDir = path.join(outDir, 'project');
  const assetDir = path.join(projectDir, 'assets');
  fs.mkdirSync(assetDir, { recursive: true });
  const modelFile = path.join(assetDir, 'sovereign-beacon.glb');
  const audioFile = path.join(assetDir, 'sovereign-signal.wav');
  fs.writeFileSync(modelFile, createMinimalGlb());
  fs.writeFileSync(audioFile, createPcmWav());
  fs.utimesSync(modelFile, new Date(0), new Date(0));
  fs.utimesSync(audioFile, new Date(0), new Date(0));
  const model = portableAssetRecord(modelFile, projectDir, 'asset:sovereign-beacon', 'Sovereign Beacon');
  const audio = portableAssetRecord(audioFile, projectDir, 'asset:sovereign-signal', 'Sovereign Signal');
  return {
    projectDir,
    model,
    audio,
    validation: {
      format: 'rncs.sovereign-world-asset-validation.v0.2',
      glb: verifyGlb(fs.readFileSync(modelFile)),
      wav: verifyWav(fs.readFileSync(audioFile)),
      roots: { model: model.asset_root, audio: audio.asset_root },
    },
  };
}

function portableAssetRecord(file, sourceRoot, assetId, name) {
  const relativePath = path.relative(sourceRoot, file).replaceAll('\\', '/');
  const record = createLocalAssetRecord(file, { sourceRoot, assetId, name, copyPath: relativePath });
  record.source.kind = 'generated-deterministic';
  delete record.source.absolute_path;
  delete record.source.source_root;
  delete record.source.mtime_ms;
  record.files = record.files.map((item) => ({ ...item, path: relativePath, absolute_path: null }));
  record.imported_at = FIXED_TIME;
  record.import_state = {
    ...record.import_state,
    first_imported_at: FIXED_TIME,
    last_imported_at: FIXED_TIME,
    changed: true,
    stale: false,
    history: [],
  };
  record.extensions.asset_continuity = {
    ...record.extensions.asset_continuity,
    content_addressed: true,
    reimportable: false,
  };
  return sealStudio(record, 'asset_root');
}

function createSovereignProject({ outDir, assets, gameBrain, rncs, network, spatial }) {
  const project = readJson(SAMPLE_PROJECT_FILE);
  project.identity = {
    project_id: 'unified-project:sovereign-world-v02',
    title: 'TaoWind Sovereign World v0.2',
    created_at: FIXED_TIME,
    updated_at: FIXED_TIME,
  };
  project.assets.registry[assets.model.asset_id] = assets.model;
  project.assets.registry[assets.audio.asset_id] = assets.audio;
  project.assets.order = [...new Set([...project.assets.order, assets.model.asset_id, assets.audio.asset_id])];
  project.evidence.events = [
    { kind: 'gamebrain-foundation', root: gameBrain.semanticRoot },
    { kind: 'rncs-commit', root: rncs.committed.commit.commit_root },
    { kind: 'network-recovery', root: network.evidence_root },
    { kind: 'viewport', root: spatial.pixelRoot },
  ];
  project.metadata = {
    ...project.metadata,
    sovereign_world_package: SOVEREIGN_WORLD_PACKAGE_VERSION,
    gamebrain_provider_root: gameBrain.semanticRoot,
    rncs_commit_root: rncs.committed.commit.commit_root,
    network_recovery_root: network.evidence_root,
    spatial_pixel_root: spatial.pixelRoot,
  };
  project.build = {
    ...project.build,
    targets: ['web-release', 'windows-portable', 'headless-server', 'replay-bundle'],
    quality_profile: 'balanced',
  };
  const sealed = sealUnifiedProject(project, { touch: false });
  const projectFile = path.join(assets.projectDir, 'sovereign-world.unified-project.json');
  writeJson(projectFile, sealed);
  return Object.assign(sealed, { __file: projectFile, __out_dir: outDir });
}

function buildSovereignProject({ outDir, project, gameBrain, rncs, network }) {
  const request = normalizeBuildRequest({
    project_file: project.__file,
    output_dir: path.join(outDir, 'build'),
    targets: ['web-release', 'windows-portable', 'headless-server', 'replay-bundle'],
    mode: 'release',
    quality_profile: 'balanced',
    app: {
      app_id: 'com.taowind.sovereignworld',
      title: 'TaoWind Sovereign World',
      version_name: '0.2.0',
      version_code: 2,
      orientation: 'landscape',
      fullscreen: true,
    },
    policy: { missing_asset: 'fallback', embed_assets: true, deterministic: true },
    build_time: FIXED_TIME,
    runtime_trace: [
      { move_right: true },
      { attack: true },
      { move_left: true },
    ],
    metadata: {
      sovereign_world_package: SOVEREIGN_WORLD_PACKAGE_VERSION,
      gamebrain_root: gameBrain.semanticRoot,
      rncs_commit_root: rncs.committed.commit.commit_root,
      network_recovery_root: network.evidence_root,
    },
  });
  return buildProject(request);
}

async function verifyProductExecutables(buildDir) {
  const replayDir = path.join(buildDir, 'replay-bundle');
  const replayRun = spawnSync(process.execPath, [path.join(replayDir, 'verify-replay.mjs')], {
    cwd: replayDir,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30_000,
  });
  if (replayRun.status !== 0) {
    throw new Error(`REPLAY_BUNDLE_EXECUTION_FAILED:${replayRun.stderr || replayRun.stdout}`);
  }
  const replay = JSON.parse(replayRun.stdout.trim());
  const headlessDir = path.join(buildDir, 'headless-server');
  const port = await availablePort();
  const child = spawn(process.execPath, [path.join(headlessDir, 'server.mjs')], {
    cwd: headlessDir,
    env: { ...process.env, PORT: String(port) },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await waitForServer(child, port);
    const healthResponse = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(10_000) });
    const replayResponse = await fetch(`http://127.0.0.1:${port}/replay`, { signal: AbortSignal.timeout(10_000) });
    if (!healthResponse.ok || !replayResponse.ok) throw new Error('HEADLESS_SERVER_HTTP_VERIFICATION_FAILED');
    return { replay, headless: { health: await healthResponse.json(), replay: await replayResponse.json() } };
  } finally {
    child.kill();
    await Promise.race([
      new Promise((resolve) => child.once('exit', resolve)),
      new Promise((resolve) => setTimeout(resolve, 2_000)),
    ]);
  }
}

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createTcpServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function waitForServer(child, port) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => reject(new Error(`HEADLESS_SERVER_START_TIMEOUT:${stderr || stdout}`)), 10_000);
    const finish = (operation, value) => {
      clearTimeout(timeout);
      operation(value);
    };
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.includes(`http://127.0.0.1:${port}`)) finish(resolve);
    });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('exit', (code) => finish(reject, new Error(`HEADLESS_SERVER_EXITED:${code}:${stderr || stdout}`)));
  });
}

function createMinimalGlb() {
  const binary = Buffer.alloc(44);
  const positions = [-1, -1, 0, 1, -1, 0, 0, 1, 0];
  positions.forEach((value, index) => binary.writeFloatLE(value, index * 4));
  [0, 1, 2].forEach((value, index) => binary.writeUInt16LE(value, 36 + index * 2));
  const gltf = {
    asset: { version: '2.0', generator: 'TaoWind Sovereign World v0.2' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'Sovereign Beacon', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36, target: 34962 },
      { buffer: 0, byteOffset: 36, byteLength: 6, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1, -1, 0], max: [1, 1, 0] },
      { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR', min: [0], max: [2] },
    ],
  };
  const json = Buffer.from(JSON.stringify(gltf), 'utf8');
  const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  const totalLength = 12 + 8 + paddedJson.length + 8 + binary.length;
  const output = Buffer.alloc(totalLength);
  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(totalLength, 8);
  output.writeUInt32LE(paddedJson.length, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  paddedJson.copy(output, 20);
  const binHeader = 20 + paddedJson.length;
  output.writeUInt32LE(binary.length, binHeader);
  output.writeUInt32LE(0x004e4942, binHeader + 4);
  binary.copy(output, binHeader + 8);
  return output;
}

function verifyGlb(buffer) {
  const jsonLength = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8').trim());
  const binHeader = 20 + jsonLength;
  return {
    valid: buffer.readUInt32LE(0) === 0x46546c67
      && buffer.readUInt32LE(4) === 2
      && buffer.readUInt32LE(8) === buffer.length
      && buffer.readUInt32LE(16) === 0x4e4f534a
      && buffer.readUInt32LE(binHeader + 4) === 0x004e4942
      && json.asset.version === '2.0'
      && json.meshes.length === 1,
    bytes: buffer.length,
    mesh_count: json.meshes.length,
    node_count: json.nodes.length,
    generator: json.asset.generator,
  };
}

function createPcmWav() {
  const sampleRate = 22_050;
  const sampleCount = Math.floor(sampleRate / 4);
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < sampleCount; index += 1) {
    const envelope = Math.min(1, index / 256, (sampleCount - index) / 256);
    buffer.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * index / sampleRate) * 8_192 * envelope), 44 + index * 2);
  }
  return buffer;
}

function verifyWav(buffer) {
  return {
    valid: buffer.toString('ascii', 0, 4) === 'RIFF'
      && buffer.toString('ascii', 8, 12) === 'WAVE'
      && buffer.toString('ascii', 36, 40) === 'data'
      && buffer.readUInt16LE(20) === 1
      && buffer.readUInt16LE(34) === 16
      && buffer.readUInt32LE(40) === buffer.length - 44,
    bytes: buffer.length,
    sample_rate: buffer.readUInt32LE(24),
    channels: buffer.readUInt16LE(22),
    bits_per_sample: buffer.readUInt16LE(34),
  };
}
