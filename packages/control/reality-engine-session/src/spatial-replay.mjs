import { rootHash } from '@taowind/rncs-core-contract';
import {
  SpatialEmbodimentWorld,
  spatialEmbodimentSnapshotToCausalDelta,
  verifySpatialEmbodimentSnapshot,
} from '@taowind/reality-simulation-runtime/spatial-embodiment';
import {
  spatialEmbodimentSceneRoot,
  spatialEmbodimentSnapshotToVSRScene,
} from '@taowind/reality-simulation-runtime/spatial-embodiment-vsr';
import {
  compileSpatialFrame,
  verifySpatialFrame,
} from '@taowind/visual-state-runtime/spatial-reality-3d';

export const SPATIAL_REPLAY_BUNDLE_FORMAT = 'rncs.spatial-replay-bundle.v0.1';
export const SPATIAL_REPLAY_CHECKPOINT_FORMAT = 'rncs.spatial-replay-checkpoint.v0.1';
export const SPATIAL_REPLAY_RESULT_FORMAT = 'rncs.spatial-replay-result.v0.1';
export const SPATIAL_REPLAY_VERSION = '0.1.0';

const clone = value => value === undefined ? undefined : structuredClone(value);
const isRoot = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const requireCondition = (condition, code, details = null) => {
  if (!condition) throw new SpatialReplayError(code, code, details);
};

export class SpatialReplayError extends Error {
  constructor(code, message = code, details = null) {
    super(message);
    this.name = 'SpatialReplayError';
    this.code = code;
    this.details = details;
  }
}

// RNCS roots intentionally reject floats. Replay metadata may contain camera
// decimals, so encode non-integer numbers as stable decimal strings before
// hashing while leaving fixed-point RSR integers as integers.
function rootSafe(value) {
  if (value === undefined) return null;
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value;
    return Number.isFinite(value) ? value.toString() : String(value);
  }
  if (Array.isArray(value)) return value.map(rootSafe);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, rootSafe(value[key])]));
  }
  return value;
}

function canonicalRoot(value) {
  return rootHash(rootSafe(value));
}

function projection(snapshot, options) {
  const scene = spatialEmbodimentSnapshotToVSRScene(snapshot, options);
  const framePlan = compileSpatialFrame(scene, options);
  const frameVerification = verifySpatialFrame(framePlan);
  requireCondition(frameVerification.ok, 'SPATIAL_REPLAY_FRAME_INVALID', frameVerification);
  return {
    scene,
    sceneRoot: spatialEmbodimentSceneRoot(scene),
    framePlan,
    frameRoot: framePlan.frameRoot,
    frameVerification,
  };
}

function normalizeCommands(initialSnapshot, ticks, commands) {
  const count = Number(ticks);
  requireCondition(Number.isSafeInteger(count) && count > 0, 'SPATIAL_REPLAY_TICKS_INVALID');
  requireCondition(Array.isArray(commands), 'SPATIAL_REPLAY_COMMANDS_INVALID');
  const start = initialSnapshot.tick + 1;
  const end = initialSnapshot.tick + count;
  const ids = new Set();
  const normalized = clone(commands).map(command => {
    requireCondition(command && typeof command === 'object', 'SPATIAL_REPLAY_COMMAND_INVALID');
    requireCondition(typeof command.id === 'string' && command.id.length > 0, 'SPATIAL_REPLAY_COMMAND_ID_REQUIRED');
    requireCondition(!ids.has(command.id), 'SPATIAL_REPLAY_COMMAND_ID_DUPLICATE', { id: command.id });
    ids.add(command.id);
    const tick = Number(command.tick);
    requireCondition(Number.isSafeInteger(tick) && tick >= start && tick <= end, 'SPATIAL_REPLAY_COMMAND_TICK_INVALID', { id: command.id, tick, start, end });
    return { ...command, tick };
  }).sort((left, right) => left.tick - right.tick || left.id.localeCompare(right.id));
  return { ticks: count, commands: normalized, commandRoot: canonicalRoot(normalized) };
}

function commandsAtTick(commands, tick) {
  return commands.filter(command => command.tick === tick).map(clone);
}

function checkpointRootPayload(checkpoint) {
  return {
    format: SPATIAL_REPLAY_CHECKPOINT_FORMAT,
    version: SPATIAL_REPLAY_VERSION,
    index: checkpoint.index,
    tick: checkpoint.tick,
    before_state_root: checkpoint.before_state_root,
    state_root: checkpoint.state_root,
    command_root: checkpoint.command_root,
    cumulative_command_root: checkpoint.cumulative_command_root,
    scene_root: checkpoint.scene_root,
    frame_root: checkpoint.frame_root,
    causal_delta_root: checkpoint.causal_delta_root,
  };
}

function bundleRootPayload(bundle) {
  return {
    format: SPATIAL_REPLAY_BUNDLE_FORMAT,
    version: SPATIAL_REPLAY_VERSION,
    bundle_id: bundle.bundle_id,
    branch_id: bundle.branch_id,
    parent_bundle_root: bundle.parent_bundle_root,
    base_checkpoint_root: bundle.base_checkpoint_root,
    initial: {
      tick: bundle.initial_snapshot.tick,
      state_root: bundle.initial_snapshot.stateRoot,
      scene_root: bundle.initial_projection.scene_root,
      frame_root: bundle.initial_projection.frame_root,
    },
    ticks: bundle.ticks,
    checkpoint_every: bundle.checkpoint_every,
    command_root: bundle.command_root,
    metadata_root: bundle.metadata_root,
    projection_options_root: bundle.projection_options_root,
    checkpoint_roots: bundle.checkpoints.map(checkpoint => checkpoint.checkpoint_root),
    final: {
      tick: bundle.final_snapshot.tick,
      state_root: bundle.final_snapshot.stateRoot,
      scene_root: bundle.final_projection.scene_root,
      frame_root: bundle.final_projection.frame_root,
      causal_delta_root: bundle.final_causal_delta.deltaRoot,
    },
  };
}

function createWorld({ initialSnapshot, spatialConfig }) {
  const world = initialSnapshot
    ? SpatialEmbodimentWorld.fromSnapshot(initialSnapshot)
    : new SpatialEmbodimentWorld(spatialConfig);
  const snapshot = world.snapshot();
  requireCondition(verifySpatialEmbodimentSnapshot(snapshot), 'SPATIAL_REPLAY_INITIAL_SNAPSHOT_INVALID');
  return { world, snapshot };
}

function checkpointFor({ index, before, snapshot, tickCommands, cumulativeCommands, projectionResult }) {
  const causalDelta = spatialEmbodimentSnapshotToCausalDelta(snapshot, before.stateRoot);
  const checkpoint = {
    format: SPATIAL_REPLAY_CHECKPOINT_FORMAT,
    version: SPATIAL_REPLAY_VERSION,
    index,
    tick: snapshot.tick,
    before_state_root: before.stateRoot,
    state_root: snapshot.stateRoot,
    command_root: canonicalRoot(tickCommands),
    cumulative_command_root: canonicalRoot(cumulativeCommands),
    scene_root: projectionResult.sceneRoot,
    frame_root: projectionResult.frameRoot,
    causal_delta_root: causalDelta.deltaRoot,
    snapshot: clone(snapshot),
    scene: clone(projectionResult.scene),
    frame_plan: clone(projectionResult.framePlan),
    causal_delta: clone(causalDelta),
  };
  checkpoint.checkpoint_root = canonicalRoot(checkpointRootPayload(checkpoint));
  return checkpoint;
}

export function createSpatialReplayBundle({
  initialSnapshot = null,
  spatialConfig = null,
  commands = [],
  ticks = 1,
  checkpointEvery = 1,
  projectionOptions = {},
  bundleId = null,
  branchId = 'branch:main',
  parentBundleRoot = null,
  baseCheckpointRoot = null,
  metadata = {},
} = {}) {
  const { world, snapshot: initial } = createWorld({ initialSnapshot, spatialConfig });
  const plan = normalizeCommands(initial, ticks, commands);
  const every = Number(checkpointEvery);
  requireCondition(Number.isSafeInteger(every) && every > 0 && every <= plan.ticks, 'SPATIAL_REPLAY_CHECKPOINT_INTERVAL_INVALID');
  const initialProjection = projection(initial, projectionOptions);
  const byTick = new Map();
  for (const command of plan.commands) {
    const list = byTick.get(command.tick) ?? [];
    list.push(command);
    byTick.set(command.tick, list);
  }
  let current = initial;
  let cumulativeCommands = [];
  const checkpoints = [];
  for (let tick = initial.tick + 1; tick <= initial.tick + plan.ticks; tick += 1) {
    const tickCommands = byTick.get(tick) ?? [];
    cumulativeCommands = [...cumulativeCommands, ...tickCommands];
    const before = current;
    current = world.step(tickCommands).snapshot;
    if ((tick - initial.tick) % every === 0 || tick === initial.tick + plan.ticks) {
      checkpoints.push(checkpointFor({
        index: checkpoints.length,
        before,
        snapshot: current,
        tickCommands,
        cumulativeCommands,
        projectionResult: projection(current, projectionOptions),
      }));
    }
  }
  const finalProjection = projection(current, projectionOptions);
  const finalCausalDelta = spatialEmbodimentSnapshotToCausalDelta(current, initial.stateRoot);
  const metadataRoot = canonicalRoot(metadata);
  const normalizedBundleId = String(bundleId ?? `replay:${branchId}:${initial.stateRoot.slice(0, 16)}:${plan.commandRoot.slice(0, 16)}`);
  const bundle = {
    format: SPATIAL_REPLAY_BUNDLE_FORMAT,
    version: SPATIAL_REPLAY_VERSION,
    bundle_id: normalizedBundleId,
    branch_id: String(branchId),
    parent_bundle_root: parentBundleRoot,
    base_checkpoint_root: baseCheckpointRoot,
    initial_snapshot: clone(initial),
    initial_projection: {
      scene_root: initialProjection.sceneRoot,
      frame_root: initialProjection.frameRoot,
      scene: clone(initialProjection.scene),
      frame_plan: clone(initialProjection.framePlan),
    },
    ticks: plan.ticks,
    checkpoint_every: every,
    commands: clone(plan.commands),
    command_root: plan.commandRoot,
    projection_options: clone(projectionOptions),
    projection_options_root: canonicalRoot(projectionOptions),
    metadata: clone(metadata),
    metadata_root: metadataRoot,
    checkpoints,
    final_snapshot: clone(current),
    final_projection: {
      scene_root: finalProjection.sceneRoot,
      frame_root: finalProjection.frameRoot,
      scene: clone(finalProjection.scene),
      frame_plan: clone(finalProjection.framePlan),
    },
    final_causal_delta: clone(finalCausalDelta),
  };
  bundle.bundle_root = canonicalRoot(bundleRootPayload(bundle));
  return bundle;
}

function checkProjection(errors, projectionValue, label, expectedSceneRoot, expectedFrameRoot) {
  if (!projectionValue || typeof projectionValue !== 'object') {
    errors.push(`${label}_MISSING`);
    return;
  }
  const frameVerification = projectionValue.frame_plan
    ? verifySpatialFrame(projectionValue.frame_plan)
    : { ok: false, diagnostics: ['frame plan missing'] };
  if (!frameVerification.ok) errors.push(...frameVerification.diagnostics.map(code => `${label}_FRAME_INVALID:${code}`));
  if (spatialEmbodimentSceneRoot(projectionValue.scene) !== expectedSceneRoot) errors.push(`${label}_SCENE_ROOT_MISMATCH`);
  if (projectionValue.frame_plan?.frameRoot !== expectedFrameRoot) errors.push(`${label}_FRAME_ROOT_MISMATCH`);
}

function verifyBundleStructure(bundle) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  check(bundle?.format === SPATIAL_REPLAY_BUNDLE_FORMAT, 'SPATIAL_REPLAY_FORMAT_INVALID');
  check(bundle?.version === SPATIAL_REPLAY_VERSION, 'SPATIAL_REPLAY_VERSION_INVALID');
  check(typeof bundle?.bundle_id === 'string' && bundle.bundle_id.length > 0, 'SPATIAL_REPLAY_BUNDLE_ID_INVALID');
  check(isRoot(bundle?.bundle_root), 'SPATIAL_REPLAY_ROOT_INVALID');
  if (bundle?.bundle_root) {
    try { check(canonicalRoot(bundleRootPayload(bundle)) === bundle.bundle_root, 'SPATIAL_REPLAY_ROOT_MISMATCH'); }
    catch (error) { errors.push(`SPATIAL_REPLAY_ROOT_UNHASHABLE:${error.message}`); }
  }
  check(verifySpatialEmbodimentSnapshot(bundle?.initial_snapshot), 'SPATIAL_REPLAY_INITIAL_SNAPSHOT_INVALID');
  check(verifySpatialEmbodimentSnapshot(bundle?.final_snapshot), 'SPATIAL_REPLAY_FINAL_SNAPSHOT_INVALID');
  if (!Array.isArray(bundle?.commands)) errors.push('SPATIAL_REPLAY_COMMANDS_INVALID');
  else {
    try { check(canonicalRoot(bundle.commands) === bundle.command_root, 'SPATIAL_REPLAY_COMMAND_ROOT_MISMATCH'); }
    catch (error) { errors.push(`SPATIAL_REPLAY_COMMAND_ROOT_UNHASHABLE:${error.message}`); }
  }
  try { check(canonicalRoot(bundle?.metadata ?? {}) === bundle?.metadata_root, 'SPATIAL_REPLAY_METADATA_ROOT_MISMATCH'); }
  catch (error) { errors.push(`SPATIAL_REPLAY_METADATA_ROOT_UNHASHABLE:${error.message}`); }
  try { check(canonicalRoot(bundle?.projection_options ?? {}) === bundle?.projection_options_root, 'SPATIAL_REPLAY_PROJECTION_ROOT_MISMATCH'); }
  catch (error) { errors.push(`SPATIAL_REPLAY_PROJECTION_ROOT_UNHASHABLE:${error.message}`); }
  checkProjection(errors, bundle?.initial_projection, 'SPATIAL_REPLAY_INITIAL_PROJECTION', bundle?.initial_projection?.scene_root, bundle?.initial_projection?.frame_root);
  checkProjection(errors, bundle?.final_projection, 'SPATIAL_REPLAY_FINAL_PROJECTION', bundle?.final_projection?.scene_root, bundle?.final_projection?.frame_root);
  check(Boolean(bundle?.final_causal_delta), 'SPATIAL_REPLAY_FINAL_CAUSAL_MISSING');
  if (bundle?.final_snapshot && bundle?.final_causal_delta) {
    const expectedFinalCausal = spatialEmbodimentSnapshotToCausalDelta(bundle.final_snapshot, bundle.initial_snapshot?.stateRoot);
    check(expectedFinalCausal.deltaRoot === bundle.final_causal_delta.deltaRoot, 'SPATIAL_REPLAY_FINAL_CAUSAL_ROOT_MISMATCH');
    check(bundle.final_causal_delta.tick === bundle.final_snapshot.tick, 'SPATIAL_REPLAY_FINAL_CAUSAL_TICK_MISMATCH');
  }
  if (!Array.isArray(bundle?.checkpoints) || bundle.checkpoints.length === 0) errors.push('SPATIAL_REPLAY_CHECKPOINTS_MISSING');
  else {
    let priorTick = bundle.initial_snapshot?.tick ?? -1;
    for (let index = 0; index < bundle.checkpoints.length; index += 1) {
      const checkpoint = bundle.checkpoints[index];
      check(checkpoint?.index === index, `SPATIAL_REPLAY_CHECKPOINT_INDEX_INVALID:${index}`);
      check(Number(checkpoint?.tick) > priorTick, `SPATIAL_REPLAY_CHECKPOINT_ORDER_INVALID:${index}`);
      priorTick = Number(checkpoint?.tick);
      check(verifySpatialEmbodimentSnapshot(checkpoint?.snapshot), `SPATIAL_REPLAY_CHECKPOINT_SNAPSHOT_INVALID:${index}`);
      check(checkpoint?.snapshot?.stateRoot === checkpoint?.state_root, `SPATIAL_REPLAY_CHECKPOINT_STATE_ROOT_MISMATCH:${index}`);
      check(checkpoint?.snapshot?.tick === checkpoint?.tick, `SPATIAL_REPLAY_CHECKPOINT_TICK_MISMATCH:${index}`);
      try { check(canonicalRoot(checkpointRootPayload(checkpoint)) === checkpoint.checkpoint_root, `SPATIAL_REPLAY_CHECKPOINT_ROOT_MISMATCH:${index}`); }
      catch (error) { errors.push(`SPATIAL_REPLAY_CHECKPOINT_ROOT_UNHASHABLE:${index}:${error.message}`); }
      checkProjection(errors, { scene: checkpoint?.scene, frame_plan: checkpoint?.frame_plan }, `SPATIAL_REPLAY_CHECKPOINT_${index}`, checkpoint?.scene_root, checkpoint?.frame_root);
      const causal = checkpoint?.causal_delta;
      if (!causal || causal.deltaRoot !== checkpoint?.causal_delta_root) errors.push(`SPATIAL_REPLAY_CHECKPOINT_CAUSAL_ROOT_MISMATCH:${index}`);
      if (causal && checkpoint?.snapshot && checkpoint?.before_state_root) {
        const expectedCausal = spatialEmbodimentSnapshotToCausalDelta(checkpoint.snapshot, checkpoint.before_state_root);
        if (expectedCausal.deltaRoot !== causal.deltaRoot) errors.push(`SPATIAL_REPLAY_CHECKPOINT_CAUSAL_CONTENT_MISMATCH:${index}`);
      }
      if (bundle.commands && checkpoint?.cumulative_command_root) {
        const tickCommands = bundle.commands.filter(command => command.tick === checkpoint.tick);
        try { check(canonicalRoot(tickCommands) === checkpoint.command_root, `SPATIAL_REPLAY_CHECKPOINT_TICK_COMMAND_ROOT_MISMATCH:${index}`); }
        catch (error) { errors.push(`SPATIAL_REPLAY_CHECKPOINT_TICK_COMMAND_ROOT_UNHASHABLE:${index}:${error.message}`); }
        const cumulative = bundle.commands.filter(command => command.tick <= checkpoint.tick);
        try { check(canonicalRoot(cumulative) === checkpoint.cumulative_command_root, `SPATIAL_REPLAY_CHECKPOINT_COMMAND_ROOT_MISMATCH:${index}`); }
        catch (error) { errors.push(`SPATIAL_REPLAY_CHECKPOINT_COMMAND_ROOT_UNHASHABLE:${index}:${error.message}`); }
      }
    }
  }
  return errors;
}

function replayBundleInternal(bundle) {
  const world = SpatialEmbodimentWorld.fromSnapshot(bundle.initial_snapshot);
  const checkpointByTick = new Map(bundle.checkpoints.map(checkpoint => [checkpoint.tick, checkpoint]));
  const commandsByTick = new Map();
  for (const command of bundle.commands) {
    const list = commandsByTick.get(command.tick) ?? [];
    list.push(command);
    commandsByTick.set(command.tick, list);
  }
  const checkpoints = [];
  for (let tick = bundle.initial_snapshot.tick + 1; tick <= bundle.initial_snapshot.tick + bundle.ticks; tick += 1) {
    const before = world.snapshot();
    world.step(commandsByTick.get(tick) ?? []);
    const snapshot = world.snapshot();
    const expected = checkpointByTick.get(tick);
    if (expected) {
      const projected = projection(snapshot, bundle.projection_options ?? {});
      const causal = spatialEmbodimentSnapshotToCausalDelta(snapshot, before.stateRoot);
      checkpoints.push({ tick, before, snapshot, projected, causal, expected });
    }
  }
  const finalSnapshot = world.snapshot();
  const finalProjection = projection(finalSnapshot, bundle.projection_options ?? {});
  const finalCausal = spatialEmbodimentSnapshotToCausalDelta(finalSnapshot, bundle.initial_snapshot.stateRoot);
  return { checkpoints, finalSnapshot, finalProjection, finalCausal };
}

export function verifySpatialReplayBundle(bundle, { replay = true } = {}) {
  const errors = verifyBundleStructure(bundle);
  let deterministic = false;
  let replayed = null;
  if (errors.length === 0 && replay) {
    try {
      replayed = replayBundleInternal(bundle);
      for (const checkpoint of replayed.checkpoints) {
        if (checkpoint.snapshot.stateRoot !== checkpoint.expected.state_root) errors.push(`SPATIAL_REPLAY_STATE_ROOT_MISMATCH:${checkpoint.tick}`);
        if (checkpoint.projected.frameRoot !== checkpoint.expected.frame_root) errors.push(`SPATIAL_REPLAY_FRAME_ROOT_MISMATCH:${checkpoint.tick}`);
        if (checkpoint.causal.deltaRoot !== checkpoint.expected.causal_delta_root) errors.push(`SPATIAL_REPLAY_CAUSAL_ROOT_MISMATCH:${checkpoint.tick}`);
      }
      if (replayed.finalSnapshot.stateRoot !== bundle.final_snapshot.stateRoot) errors.push('SPATIAL_REPLAY_FINAL_STATE_ROOT_MISMATCH');
      if (replayed.finalProjection.frameRoot !== bundle.final_projection.frame_root) errors.push('SPATIAL_REPLAY_FINAL_FRAME_ROOT_MISMATCH');
      if (replayed.finalCausal.deltaRoot !== bundle.final_causal_delta.deltaRoot) errors.push('SPATIAL_REPLAY_FINAL_CAUSAL_ROOT_MISMATCH');
      deterministic = errors.length === 0;
    } catch (error) {
      errors.push(`SPATIAL_REPLAY_EXECUTION_FAILED:${error.code ?? error.message}`);
    }
  }
  return {
    valid: errors.length === 0,
    deterministic,
    errors,
    bundle_root: bundle?.bundle_root ?? null,
    initial_state_root: bundle?.initial_snapshot?.stateRoot ?? null,
    final_state_root: bundle?.final_snapshot?.stateRoot ?? null,
    final_frame_root: bundle?.final_projection?.frame_root ?? null,
    checkpoint_count: bundle?.checkpoints?.length ?? 0,
  };
}

export function replaySpatialReplayBundle(bundle) {
  const verification = verifySpatialReplayBundle(bundle);
  requireCondition(verification.valid, 'SPATIAL_REPLAY_BUNDLE_INVALID', verification);
  const replayed = replayBundleInternal(bundle);
  const replayPayload = {
    format: SPATIAL_REPLAY_RESULT_FORMAT,
    version: SPATIAL_REPLAY_VERSION,
    bundle_root: bundle.bundle_root,
    final_state_root: replayed.finalSnapshot.stateRoot,
    final_frame_root: replayed.finalProjection.frameRoot,
    checkpoint_roots: replayed.checkpoints.map(item => item.expected.checkpoint_root),
  };
  return {
    ...replayPayload,
    replay_root: canonicalRoot(replayPayload),
    deterministic: true,
    final_snapshot: clone(replayed.finalSnapshot),
    final_projection: {
      scene_root: replayed.finalProjection.sceneRoot,
      frame_root: replayed.finalProjection.frameRoot,
      scene: clone(replayed.finalProjection.scene),
      frame_plan: clone(replayed.finalProjection.framePlan),
    },
    checkpoints: replayed.checkpoints.map(item => ({
      tick: item.tick,
      state_root: item.snapshot.stateRoot,
      frame_root: item.projected.frameRoot,
      checkpoint_root: item.expected.checkpoint_root,
    })),
  };
}

export function createSpatialReplayBranch(bundle, {
  fromCheckpoint = null,
  branchId,
  bundleId = null,
  commands = [],
  ticks = 1,
  checkpointEvery = 1,
  projectionOptions = bundle?.projection_options ?? {},
  metadata = {},
} = {}) {
  const verification = verifySpatialReplayBundle(bundle);
  requireCondition(verification.valid, 'SPATIAL_REPLAY_PARENT_INVALID', verification);
  const checkpoint = typeof fromCheckpoint === 'number'
    ? bundle.checkpoints[fromCheckpoint]
    : typeof fromCheckpoint === 'string'
      ? bundle.checkpoints.find(item => item.checkpoint_root === fromCheckpoint || String(item.index) === fromCheckpoint)
      : bundle.checkpoints.at(-1);
  requireCondition(checkpoint, 'SPATIAL_REPLAY_CHECKPOINT_NOT_FOUND', { fromCheckpoint });
  const id = String(branchId ?? `branch:${bundle.bundle_id}:${checkpoint.index + 1}`);
  return createSpatialReplayBundle({
    initialSnapshot: checkpoint.snapshot,
    commands,
    ticks,
    checkpointEvery,
    projectionOptions,
    branchId: id,
    bundleId: bundleId ?? `${bundle.bundle_id}/${id}`,
    parentBundleRoot: bundle.bundle_root,
    baseCheckpointRoot: checkpoint.checkpoint_root,
    metadata: { ...clone(metadata), parent_branch_id: bundle.branch_id, parent_checkpoint_root: checkpoint.checkpoint_root },
  });
}

export function compareSpatialReplayBranches(left, right) {
  const leftVerification = verifySpatialReplayBundle(left);
  const rightVerification = verifySpatialReplayBundle(right);
  requireCondition(leftVerification.valid, 'SPATIAL_REPLAY_LEFT_INVALID', leftVerification);
  requireCondition(rightVerification.valid, 'SPATIAL_REPLAY_RIGHT_INVALID', rightVerification);
  const leftBodies = new Map(left.final_snapshot.bodies.map(body => [body.id, canonicalRoot(body)]));
  const rightBodies = new Map(right.final_snapshot.bodies.map(body => [body.id, canonicalRoot(body)]));
  const bodyIds = [...new Set([...leftBodies.keys(), ...rightBodies.keys()])].sort();
  const changedBodyIds = bodyIds.filter(id => leftBodies.get(id) !== rightBodies.get(id));
  const snapshotSections = ['bodies', 'characters', 'joints', 'contacts', 'events', 'diagnostics', 'reality'];
  const changedSnapshotSections = snapshotSections.filter(section => (
    canonicalRoot(left.final_snapshot[section] ?? null) !== canonicalRoot(right.final_snapshot[section] ?? null)
  ));
  const comparison = {
    format: 'rncs.spatial-replay-comparison.v0.1',
    left_bundle_root: left.bundle_root,
    right_bundle_root: right.bundle_root,
    left_branch_id: left.branch_id,
    right_branch_id: right.branch_id,
    left_state_root: left.final_snapshot.stateRoot,
    right_state_root: right.final_snapshot.stateRoot,
    left_frame_root: left.final_projection.frame_root,
    right_frame_root: right.final_projection.frame_root,
    same_state: left.final_snapshot.stateRoot === right.final_snapshot.stateRoot,
    same_frame: left.final_projection.frame_root === right.final_projection.frame_root,
    changed_body_ids: changedBodyIds,
    changed_snapshot_sections: changedSnapshotSections,
  };
  return { ...comparison, comparison_root: canonicalRoot(comparison) };
}
