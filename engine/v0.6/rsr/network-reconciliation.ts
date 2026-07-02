import { deepClone, semanticHash } from '../../spec/src/index.js';
import {
  SpatialEmbodimentWorld,
  computeSpatialEmbodimentStateRoot,
  verifySpatialEmbodimentSnapshot,
  type IntVector3,
  type RuntimeSpatialBody,
  type SpatialCommand,
  type SpatialEmbodimentSnapshot,
} from '../../spatial-embodiment/src/index.js';

export const RSR_AUTHORITY_PROTOCOL = 'rsr.authoritative-state.v0.7' as const;
export const RSR_AUTHORITY_FRAME_FORMAT = 'rsr.authoritative-state-frame.v0.7' as const;
export const RSR_AUTHORITY_DELTA_FORMAT = 'rsr.authoritative-state-delta.v0.7' as const;
export const ZERO_ROOT = '0'.repeat(64);

export interface AuthoritativeObjectState {
  objectId: string;
  position: IntVector3;
  rotationDeg: IntVector3;
  velocity: IntVector3;
  angularVelocityDeg: IntVector3;
  grounded: boolean;
  awake: boolean;
  enabled: boolean;
  tags: string[];
  bodyRoot: string;
}

export interface RsrAuthoritativeStateFrame {
  format: typeof RSR_AUTHORITY_FRAME_FORMAT;
  protocol: typeof RSR_AUTHORITY_PROTOCOL;
  worldId: string;
  tick: number;
  stepHz: number;
  reason: string;
  sourceStateRoot: string;
  previousStateRoot: string;
  objects: AuthoritativeObjectState[];
  events: SpatialEmbodimentSnapshot['events'];
  diagnostics: SpatialEmbodimentSnapshot['diagnostics'];
  roots: {
    bodyRoot: string;
    contactRoot: string;
    characterRoot: string;
    sensoryRoot: string;
    jointRoot: string;
  };
  frameRoot: string;
}

export interface RsrAuthoritativeStateDelta {
  format: typeof RSR_AUTHORITY_DELTA_FORMAT;
  protocol: typeof RSR_AUTHORITY_PROTOCOL;
  worldId: string;
  fromTick: number;
  toTick: number;
  baseStateRoot: string;
  targetStateRoot: string;
  changedBodies: RuntimeSpatialBody[];
  removedBodyIds: string[];
  characters: SpatialEmbodimentSnapshot['characters'];
  joints: SpatialEmbodimentSnapshot['joints'];
  listeners: SpatialEmbodimentSnapshot['listeners'];
  contacts: SpatialEmbodimentSnapshot['contacts'];
  events: SpatialEmbodimentSnapshot['events'];
  diagnostics: SpatialEmbodimentSnapshot['diagnostics'];
  materials: SpatialEmbodimentSnapshot['materials'];
  reality: SpatialEmbodimentSnapshot['reality'];
  roots: {
    bodyRoot: string;
    contactRoot: string;
    characterRoot: string;
    sensoryRoot: string;
    jointRoot: string;
  };
  deltaRoot: string;
}

export interface RsrReconciliationReceipt {
  format: 'rsr.reconciliation-receipt.v0.7';
  protocol: typeof RSR_AUTHORITY_PROTOCOL;
  worldId: string;
  authoritativeTick: number;
  predictedStateRoot: string;
  authoritativeStateRoot: string;
  replayedCommandIds: string[];
  finalStateRoot: string;
  corrected: boolean;
  receiptRoot: string;
}

function bodyToObject(body: RuntimeSpatialBody): AuthoritativeObjectState {
  const base = {
    objectId: body.id,
    position: deepClone(body.position),
    rotationDeg: deepClone(body.rotationDeg),
    velocity: deepClone(body.velocity),
    angularVelocityDeg: deepClone(body.angularVelocityDeg),
    grounded: body.grounded,
    awake: body.awake,
    enabled: body.enabled,
    tags: [...(body.tags ?? [])],
  };
  return { ...base, bodyRoot: semanticHash(base) };
}

function roots(snapshot: SpatialEmbodimentSnapshot): RsrAuthoritativeStateFrame['roots'] {
  return {
    bodyRoot: snapshot.bodyRoot,
    contactRoot: snapshot.contactRoot,
    characterRoot: snapshot.characterRoot,
    sensoryRoot: snapshot.sensoryRoot,
    jointRoot: snapshot.jointRoot,
  };
}

export function createAuthoritativeStateFrame(
  snapshot: SpatialEmbodimentSnapshot,
  options: { previousStateRoot?: string; reason?: string } = {},
): RsrAuthoritativeStateFrame {
  if (!verifySpatialEmbodimentSnapshot(snapshot)) throw new Error('RSR_SNAPSHOT_INTEGRITY_MISMATCH');
  const base = {
    format: RSR_AUTHORITY_FRAME_FORMAT,
    protocol: RSR_AUTHORITY_PROTOCOL,
    worldId: snapshot.worldId,
    tick: snapshot.tick,
    stepHz: snapshot.stepHz,
    reason: options.reason ?? 'tick',
    sourceStateRoot: snapshot.stateRoot,
    previousStateRoot: options.previousStateRoot ?? ZERO_ROOT,
    objects: snapshot.bodies.map(bodyToObject).sort((a, b) => a.objectId.localeCompare(b.objectId)),
    events: deepClone(snapshot.events),
    diagnostics: deepClone(snapshot.diagnostics),
    roots: roots(snapshot),
  };
  return { ...base, frameRoot: semanticHash(base) };
}

export function verifyAuthoritativeStateFrame(frame: RsrAuthoritativeStateFrame): boolean {
  const { frameRoot, ...base } = frame;
  return semanticHash(base) === frameRoot;
}

export function createAuthoritativeStateDelta(
  previous: SpatialEmbodimentSnapshot,
  current: SpatialEmbodimentSnapshot,
): RsrAuthoritativeStateDelta {
  if (!verifySpatialEmbodimentSnapshot(previous) || !verifySpatialEmbodimentSnapshot(current)) throw new Error('RSR_SNAPSHOT_INTEGRITY_MISMATCH');
  if (previous.worldId !== current.worldId) throw new Error('RSR_WORLD_ID_MISMATCH');
  if (current.tick <= previous.tick) throw new Error('RSR_DELTA_TICK_NOT_FORWARD');
  const previousBodies = new Map(previous.bodies.map(body => [body.id, body]));
  const currentIds = new Set(current.bodies.map(body => body.id));
  const changedBodies = current.bodies
    .filter(body => {
      const before = previousBodies.get(body.id);
      return !before || semanticHash(before) !== semanticHash(body);
    })
    .map(body => deepClone(body));
  const removedBodyIds = previous.bodies.map(body => body.id).filter(id => !currentIds.has(id)).sort();
  const base = {
    format: RSR_AUTHORITY_DELTA_FORMAT,
    protocol: RSR_AUTHORITY_PROTOCOL,
    worldId: current.worldId,
    fromTick: previous.tick,
    toTick: current.tick,
    baseStateRoot: previous.stateRoot,
    targetStateRoot: current.stateRoot,
    changedBodies,
    removedBodyIds,
    characters: deepClone(current.characters),
    joints: deepClone(current.joints),
    listeners: deepClone(current.listeners),
    contacts: deepClone(current.contacts),
    events: deepClone(current.events),
    diagnostics: deepClone(current.diagnostics),
    materials: deepClone(current.materials),
    reality: deepClone(current.reality),
    roots: roots(current),
  };
  return { ...base, deltaRoot: semanticHash(base) };
}

export function verifyAuthoritativeStateDelta(delta: RsrAuthoritativeStateDelta): boolean {
  const { deltaRoot, ...base } = delta;
  return semanticHash(base) === deltaRoot;
}

export function applyAuthoritativeStateDelta(
  previous: SpatialEmbodimentSnapshot,
  delta: RsrAuthoritativeStateDelta,
): SpatialEmbodimentSnapshot {
  if (!verifySpatialEmbodimentSnapshot(previous)) throw new Error('RSR_BASE_SNAPSHOT_INTEGRITY_MISMATCH');
  if (!verifyAuthoritativeStateDelta(delta)) throw new Error('RSR_DELTA_INTEGRITY_MISMATCH');
  if (previous.worldId !== delta.worldId || previous.tick !== delta.fromTick || previous.stateRoot !== delta.baseStateRoot) throw new Error('RSR_DELTA_BASE_MISMATCH');
  const bodyMap = new Map(previous.bodies.map(body => [body.id, deepClone(body)]));
  for (const bodyId of delta.removedBodyIds) bodyMap.delete(bodyId);
  for (const body of delta.changedBodies) bodyMap.set(body.id, deepClone(body));
  const candidate: SpatialEmbodimentSnapshot = {
    ...deepClone(previous),
    tick: delta.toTick,
    materials: deepClone(delta.materials),
    reality: deepClone(delta.reality),
    bodies: [...bodyMap.values()].sort((a, b) => a.id.localeCompare(b.id)),
    characters: deepClone(delta.characters),
    joints: deepClone(delta.joints),
    listeners: deepClone(delta.listeners),
    contacts: deepClone(delta.contacts),
    events: deepClone(delta.events),
    diagnostics: deepClone(delta.diagnostics),
    ...deepClone(delta.roots),
    stateRoot: delta.targetStateRoot,
  };
  const computed = computeSpatialEmbodimentStateRoot(candidate);
  if (computed !== delta.targetStateRoot) throw new Error('RSR_DELTA_TARGET_ROOT_MISMATCH');
  return candidate;
}

export class AuthoritativeStateHistory {
  readonly capacity: number;
  private readonly snapshots = new Map<number, SpatialEmbodimentSnapshot>();

  constructor(capacity = 128) {
    if (!Number.isInteger(capacity) || capacity < 2) throw new Error('RSR_HISTORY_CAPACITY_INVALID');
    this.capacity = capacity;
  }

  push(snapshot: SpatialEmbodimentSnapshot): void {
    if (!verifySpatialEmbodimentSnapshot(snapshot)) throw new Error('RSR_HISTORY_SNAPSHOT_INTEGRITY_MISMATCH');
    this.snapshots.set(snapshot.tick, deepClone(snapshot));
    while (this.snapshots.size > this.capacity) {
      const oldest = [...this.snapshots.keys()].sort((a, b) => a - b)[0];
      if (oldest === undefined) break;
      this.snapshots.delete(oldest);
    }
  }

  get(tick: number): SpatialEmbodimentSnapshot | undefined {
    const snapshot = this.snapshots.get(tick);
    return snapshot ? deepClone(snapshot) : undefined;
  }

  latest(): SpatialEmbodimentSnapshot | undefined {
    const tick = [...this.snapshots.keys()].sort((a, b) => b - a)[0];
    return tick === undefined ? undefined : this.get(tick);
  }

  ticks(): number[] { return [...this.snapshots.keys()].sort((a, b) => a - b); }

  delta(fromTick: number, toTick: number): RsrAuthoritativeStateDelta {
    const from = this.snapshots.get(fromTick);
    const to = this.snapshots.get(toTick);
    if (!from || !to) throw new Error('RSR_HISTORY_TICK_MISSING');
    return createAuthoritativeStateDelta(from, to);
  }
}

export function reconcilePredictedState({
  predicted,
  authoritative,
  pendingCommands = [],
}: {
  predicted: SpatialEmbodimentSnapshot;
  authoritative: SpatialEmbodimentSnapshot;
  pendingCommands?: SpatialCommand[];
}): { snapshot: SpatialEmbodimentSnapshot; receipt: RsrReconciliationReceipt } {
  if (!verifySpatialEmbodimentSnapshot(predicted) || !verifySpatialEmbodimentSnapshot(authoritative)) throw new Error('RSR_RECONCILIATION_SNAPSHOT_INVALID');
  if (predicted.worldId !== authoritative.worldId) throw new Error('RSR_RECONCILIATION_WORLD_MISMATCH');
  let finalSnapshot = deepClone(authoritative);
  const commands = pendingCommands
    .filter(command => command.tick > authoritative.tick)
    .sort((a, b) => a.tick - b.tick || a.id.localeCompare(b.id));
  if (commands.length) {
    const world = SpatialEmbodimentWorld.fromSnapshot(authoritative);
    const finalTick = Math.max(...commands.map(command => command.tick));
    while (world.tick < finalTick) world.step(commands);
    finalSnapshot = world.snapshot();
  }
  const receiptBase = {
    format: 'rsr.reconciliation-receipt.v0.7' as const,
    protocol: RSR_AUTHORITY_PROTOCOL,
    worldId: authoritative.worldId,
    authoritativeTick: authoritative.tick,
    predictedStateRoot: predicted.stateRoot,
    authoritativeStateRoot: authoritative.stateRoot,
    replayedCommandIds: commands.map(command => command.id),
    finalStateRoot: finalSnapshot.stateRoot,
    corrected: predicted.stateRoot !== finalSnapshot.stateRoot,
  };
  return { snapshot: finalSnapshot, receipt: { ...receiptBase, receiptRoot: semanticHash(receiptBase) } };
}
