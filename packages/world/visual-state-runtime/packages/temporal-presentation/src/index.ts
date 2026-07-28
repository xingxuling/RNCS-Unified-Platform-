import { cryptographicHash, deepClone, semanticHash } from '../../spec/src/index.js';

export const VSR_TEMPORAL_PRESENTATION_PROTOCOL = 'vsr.temporal-presentation.v0.6' as const;
export const VSR_TEMPORAL_PACKET_FORMAT = 'vsr.temporal-state-packet.v0.6' as const;
export const VSR_TEMPORAL_FRAME_FORMAT = 'vsr.temporal-presentation-frame.v0.6' as const;
const FULL_ROTATION = 360_000;

export interface TemporalVector3 { x: number; y: number; z: number }
export interface TemporalAuthorityState {
  bodyRoot: string;
  grounded: boolean;
  awake: boolean;
  enabled: boolean;
  tags: string[];
}
export interface TemporalObjectState {
  objectId: string;
  position: TemporalVector3;
  rotationDeg: TemporalVector3;
  velocity: TemporalVector3;
  angularVelocityDeg?: TemporalVector3;
  animationState?: string;
  characterState?: Record<string, unknown>;
  authority?: TemporalAuthorityState;
}
export interface TemporalStatePacket {
  format: typeof VSR_TEMPORAL_PACKET_FORMAT;
  protocol: typeof VSR_TEMPORAL_PRESENTATION_PROTOCOL;
  worldId: string;
  tick: number;
  stepHz: number;
  sourceStateRoot: string;
  sourcePacketRoot: string;
  objects: TemporalObjectState[];
  discontinuities?: string[];
  packetRoot: string;
}
export type TemporalPresentationMode = 'hold' | 'interpolate' | 'extrapolate' | 'snap';
export interface TemporalPresentedObject extends TemporalObjectState {
  sourceTickA: number;
  sourceTickB: number;
  targetTick: number;
  mode: TemporalPresentationMode;
  authorityStateRoot: string;
  presentationRoot: string;
}
export interface TemporalPresentationFrame {
  format: typeof VSR_TEMPORAL_FRAME_FORMAT;
  protocol: typeof VSR_TEMPORAL_PRESENTATION_PROTOCOL;
  worldId: string;
  serverTick: number;
  presentationTick: number;
  authorityStateRoot: string;
  objects: TemporalPresentedObject[];
  modes: Record<TemporalPresentationMode, number>;
  frameRoot: string;
}
export interface TemporalCorrectionPlan {
  format: 'vsr.temporal-correction-plan.v0.6';
  objectId: string;
  mode: 'none' | 'blend' | 'snap';
  positionError: TemporalVector3;
  rotationErrorDeg: TemporalVector3;
  distance: number;
  blendTicks: number;
  predictedRoot: string;
  authorityRoot: string;
  planRoot: string;
}

const v3 = (value?: Partial<TemporalVector3>): TemporalVector3 => ({ x: Math.round(value?.x ?? 0), y: Math.round(value?.y ?? 0), z: Math.round(value?.z ?? 0) });
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const distance = (a: TemporalVector3, b: TemporalVector3): number => Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
const lerp = (a: number, b: number, t: number): number => Math.round(a + (b - a) * t);
function shortestAngleDelta(from: number, to: number): number {
  let delta = (to - from) % FULL_ROTATION;
  if (delta > FULL_ROTATION / 2) delta -= FULL_ROTATION;
  if (delta < -FULL_ROTATION / 2) delta += FULL_ROTATION;
  return delta;
}
function interpolateRotation(a: TemporalVector3, b: TemporalVector3, t: number): TemporalVector3 {
  return {
    x: Math.round(a.x + shortestAngleDelta(a.x, b.x) * t),
    y: Math.round(a.y + shortestAngleDelta(a.y, b.y) * t),
    z: Math.round(a.z + shortestAngleDelta(a.z, b.z) * t),
  };
}
function hermite(a: number, b: number, velocityA: number, velocityB: number, t: number, seconds: number): number {
  const t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return Math.round(h00 * a + h10 * velocityA * seconds + h01 * b + h11 * velocityB * seconds);
}
function objectRoot(object: TemporalObjectState): string { return cryptographicHash(object); }

export interface RsrAuthoritativeStateFrameLike {
  format: 'rsr.authoritative-state-frame.v0.7';
  protocol: 'rsr.authoritative-state.v0.7';
  worldId: string;
  tick: number;
  stepHz: number;
  sourceStateRoot: string;
  previousStateRoot: string;
  frameRoot: string;
  objects: Array<{
    objectId: string;
    position: TemporalVector3;
    rotationDeg: TemporalVector3;
    velocity: TemporalVector3;
    angularVelocityDeg: TemporalVector3;
    grounded: boolean;
    awake: boolean;
    enabled: boolean;
    tags: string[];
    bodyRoot: string;
  }>;
}

export function sealTemporalStatePacket(input: Omit<TemporalStatePacket, 'packetRoot'>): TemporalStatePacket {
  const normalized = {
    ...deepClone(input),
    objects: input.objects.map(object => ({
      ...deepClone(object),
      position: v3(object.position),
      rotationDeg: v3(object.rotationDeg),
      velocity: v3(object.velocity),
      angularVelocityDeg: v3(object.angularVelocityDeg),
    })).sort((a, b) => a.objectId.localeCompare(b.objectId)),
    discontinuities: [...(input.discontinuities ?? [])].sort(),
  };
  return { ...normalized, packetRoot: cryptographicHash(normalized) };
}
export function verifyTemporalStatePacket(packet: TemporalStatePacket): boolean {
  const { packetRoot, ...base } = packet;
  return cryptographicHash(base) === packetRoot;
}

export function networkPacketToTemporalState(packet: Record<string, any>, fallbackStepHz = 60): TemporalStatePacket {
  const rsrFrame = packet.rsrFrame as RsrAuthoritativeStateFrameLike | undefined;
  const sourceRoot = String(packet.stateRoot ?? packet.sourceStateRoot ?? rsrFrame?.sourceStateRoot ?? '');
  const packetRoot = String(packet.snapshotRoot ?? packet.deltaRoot ?? rsrFrame?.frameRoot ?? packet.rsrDelta?.deltaRoot ?? sourceRoot);
  const objects = (packet.objects ?? packet.rsrFrame?.objects ?? []).map((object: Record<string, any>) => ({
    objectId: String(object.objectId),
    position: v3(object.position),
    rotationDeg: v3(object.rotationDeg ?? object.rotation),
    velocity: v3(object.velocity),
    angularVelocityDeg: v3(object.angularVelocityDeg),
    animationState: object.animationState,
    characterState: deepClone(object.characterState ?? {}),
    ...(object.bodyRoot !== undefined || object.grounded !== undefined || object.awake !== undefined || object.enabled !== undefined || object.tags !== undefined
      ? {
        authority: {
          bodyRoot: String(object.bodyRoot ?? ''),
          grounded: Boolean(object.grounded),
          awake: Boolean(object.awake),
          enabled: object.enabled !== false,
          tags: Array.isArray(object.tags) ? object.tags.map(String).sort() : [],
        },
      }
      : {}),
  }));
  return sealTemporalStatePacket({
    format: VSR_TEMPORAL_PACKET_FORMAT,
    protocol: VSR_TEMPORAL_PRESENTATION_PROTOCOL,
    worldId: String(packet.worldId ?? packet.rsrSnapshot?.worldId ?? packet.rsrFrame?.worldId ?? 'world:unknown'),
    tick: Number(packet.tick ?? 0),
    stepHz: Number(packet.stepHz ?? packet.rsrSnapshot?.stepHz ?? packet.rsrFrame?.stepHz ?? fallbackStepHz),
    sourceStateRoot: sourceRoot,
    sourcePacketRoot: packetRoot,
    objects,
    discontinuities: [...(packet.discontinuities ?? [])],
  });
}

export function authoritativeFrameToTemporalState(frame: RsrAuthoritativeStateFrameLike): TemporalStatePacket {
  if (frame?.format !== 'rsr.authoritative-state-frame.v0.7' || frame?.protocol !== 'rsr.authoritative-state.v0.7') {
    throw new Error('VSR_RSR_AUTHORITY_FRAME_FORMAT_INVALID');
  }
  if (!frame.worldId || !Number.isSafeInteger(frame.tick) || frame.tick < 0 || !Number.isFinite(frame.stepHz) || frame.stepHz <= 0) {
    throw new Error('VSR_RSR_AUTHORITY_FRAME_METADATA_INVALID');
  }
  if (!frame.sourceStateRoot || !frame.frameRoot || !Array.isArray(frame.objects)) {
    throw new Error('VSR_RSR_AUTHORITY_FRAME_ROOTS_INVALID');
  }
  const ids = new Set<string>();
  for (const object of frame.objects) {
    if (!object.objectId || ids.has(object.objectId)) throw new Error('VSR_RSR_AUTHORITY_OBJECT_ID_INVALID');
    ids.add(object.objectId);
    const { bodyRoot, ...body } = object;
    if (!bodyRoot || semanticHash(body) !== bodyRoot) throw new Error('VSR_RSR_AUTHORITY_BODY_ROOT_INVALID');
  }
  return networkPacketToTemporalState({ rsrFrame: frame });
}

export function createTemporalCorrectionPlan(
  predicted: TemporalObjectState,
  authoritative: TemporalObjectState,
  options: { softThreshold?: number; snapThreshold?: number; blendTicks?: number } = {},
): TemporalCorrectionPlan {
  if (predicted.objectId !== authoritative.objectId) throw new Error('VSR_CORRECTION_OBJECT_MISMATCH');
  const softThreshold = options.softThreshold ?? 50;
  const snapThreshold = options.snapThreshold ?? 4000;
  const d = distance(predicted.position, authoritative.position);
  const mode: TemporalCorrectionPlan['mode'] = d <= softThreshold ? 'none' : d >= snapThreshold ? 'snap' : 'blend';
  const base = {
    format: 'vsr.temporal-correction-plan.v0.6' as const,
    objectId: predicted.objectId,
    mode,
    positionError: {
      x: authoritative.position.x - predicted.position.x,
      y: authoritative.position.y - predicted.position.y,
      z: authoritative.position.z - predicted.position.z,
    },
    rotationErrorDeg: {
      x: shortestAngleDelta(predicted.rotationDeg.x, authoritative.rotationDeg.x),
      y: shortestAngleDelta(predicted.rotationDeg.y, authoritative.rotationDeg.y),
      z: shortestAngleDelta(predicted.rotationDeg.z, authoritative.rotationDeg.z),
    },
    distance: d,
    blendTicks: mode === 'blend' ? Math.max(1, Math.round(options.blendTicks ?? 4)) : 0,
    predictedRoot: objectRoot(predicted),
    authorityRoot: objectRoot(authoritative),
  };
  return { ...base, planRoot: cryptographicHash(base) };
}

export function applyTemporalCorrection(
  predicted: TemporalObjectState,
  authoritative: TemporalObjectState,
  plan: TemporalCorrectionPlan,
  progress = 1,
): TemporalObjectState {
  const { planRoot, ...base } = plan;
  if (cryptographicHash(base) !== planRoot) throw new Error('VSR_CORRECTION_PLAN_INTEGRITY_MISMATCH');
  if (predicted.objectId !== plan.objectId || authoritative.objectId !== plan.objectId) throw new Error('VSR_CORRECTION_OBJECT_MISMATCH');
  if (plan.mode === 'none') return deepClone(predicted);
  if (plan.mode === 'snap') return deepClone(authoritative);
  const t = clamp01(progress);
  return {
    ...deepClone(authoritative),
    position: {
      x: lerp(predicted.position.x, authoritative.position.x, t),
      y: lerp(predicted.position.y, authoritative.position.y, t),
      z: lerp(predicted.position.z, authoritative.position.z, t),
    },
    rotationDeg: interpolateRotation(predicted.rotationDeg, authoritative.rotationDeg, t),
  };
}

interface TimedObject { tick: number; stepHz: number; sourceStateRoot: string; object: TemporalObjectState; discontinuity: boolean }

export class TemporalPresentationBuffer {
  readonly interpolationDelayTicks: number;
  readonly maximumExtrapolationTicks: number;
  readonly teleportDistance: number;
  readonly capacityPerObject: number;
  private readonly buffers = new Map<string, TimedObject[]>();
  private latestPacket?: TemporalStatePacket;

  constructor(options: { interpolationDelayTicks?: number; maximumExtrapolationTicks?: number; teleportDistance?: number; capacityPerObject?: number } = {}) {
    this.interpolationDelayTicks = options.interpolationDelayTicks ?? 2;
    this.maximumExtrapolationTicks = options.maximumExtrapolationTicks ?? 4;
    this.teleportDistance = options.teleportDistance ?? 4000;
    this.capacityPerObject = options.capacityPerObject ?? 64;
    if (this.interpolationDelayTicks < 0 || this.maximumExtrapolationTicks < 0 || this.capacityPerObject < 2) throw new Error('VSR_TEMPORAL_BUFFER_OPTIONS_INVALID');
  }

  push(packet: TemporalStatePacket): boolean {
    if (!verifyTemporalStatePacket(packet)) throw new Error('VSR_TEMPORAL_PACKET_INTEGRITY_MISMATCH');
    if (this.latestPacket && packet.worldId !== this.latestPacket.worldId) throw new Error('VSR_TEMPORAL_WORLD_MISMATCH');
    if (this.latestPacket && packet.tick < this.latestPacket.tick - this.capacityPerObject) return false;
    const discontinuities = new Set(packet.discontinuities ?? []);
    for (const object of packet.objects) {
      const list = this.buffers.get(object.objectId) ?? [];
      const entry: TimedObject = { tick: packet.tick, stepHz: packet.stepHz, sourceStateRoot: packet.sourceStateRoot, object: deepClone(object), discontinuity: discontinuities.has(object.objectId) };
      const sameIndex = list.findIndex(item => item.tick === packet.tick);
      if (sameIndex >= 0) list[sameIndex] = entry; else list.push(entry);
      list.sort((a, b) => a.tick - b.tick || a.sourceStateRoot.localeCompare(b.sourceStateRoot));
      while (list.length > this.capacityPerObject) list.shift();
      this.buffers.set(object.objectId, list);
    }
    if (!this.latestPacket || packet.tick >= this.latestPacket.tick) this.latestPacket = deepClone(packet);
    return true;
  }

  sampleObject(objectId: string, serverTick: number): TemporalPresentedObject | null {
    const list = this.buffers.get(objectId) ?? [];
    if (!list.length) return null;
    const targetTick = serverTick - this.interpolationDelayTicks;
    let a = list[0]!, b = list[list.length - 1]!;
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i]!.tick <= targetTick && list[i + 1]!.tick >= targetTick) { a = list[i]!; b = list[i + 1]!; break; }
    }
    let object: TemporalObjectState;
    let mode: TemporalPresentationMode;
    if (a.discontinuity || b.discontinuity || distance(a.object.position, b.object.position) >= this.teleportDistance) {
      object = deepClone(targetTick < b.tick ? a.object : b.object); mode = 'snap';
    } else if (targetTick <= a.tick || a.tick === b.tick) {
      object = deepClone(a.object); mode = 'hold';
    } else if (targetTick > b.tick) {
      const ticks = Math.min(targetTick - b.tick, this.maximumExtrapolationTicks);
      const seconds = ticks / Math.max(1, b.stepHz);
      object = {
        ...deepClone(b.object),
        position: {
          x: Math.round(b.object.position.x + b.object.velocity.x * seconds),
          y: Math.round(b.object.position.y + b.object.velocity.y * seconds),
          z: Math.round(b.object.position.z + b.object.velocity.z * seconds),
        },
        rotationDeg: {
          x: Math.round(b.object.rotationDeg.x + (b.object.angularVelocityDeg?.x ?? 0) * seconds),
          y: Math.round(b.object.rotationDeg.y + (b.object.angularVelocityDeg?.y ?? 0) * seconds),
          z: Math.round(b.object.rotationDeg.z + (b.object.angularVelocityDeg?.z ?? 0) * seconds),
        },
      };
      mode = 'extrapolate';
    } else {
      const t = (targetTick - a.tick) / Math.max(1, b.tick - a.tick);
      const seconds = (b.tick - a.tick) / Math.max(1, b.stepHz);
      object = {
        ...deepClone(b.object),
        position: {
          x: hermite(a.object.position.x, b.object.position.x, a.object.velocity.x, b.object.velocity.x, t, seconds),
          y: hermite(a.object.position.y, b.object.position.y, a.object.velocity.y, b.object.velocity.y, t, seconds),
          z: hermite(a.object.position.z, b.object.position.z, a.object.velocity.z, b.object.velocity.z, t, seconds),
        },
        rotationDeg: interpolateRotation(a.object.rotationDeg, b.object.rotationDeg, t),
      };
      mode = 'interpolate';
    }
    const base = {
      ...object,
      sourceTickA: a.tick,
      sourceTickB: b.tick,
      targetTick,
      mode,
      authorityStateRoot: b.sourceStateRoot,
    };
    return { ...base, presentationRoot: cryptographicHash(base) };
  }

  sampleFrame(serverTick: number): TemporalPresentationFrame {
    if (!this.latestPacket) throw new Error('VSR_TEMPORAL_BUFFER_EMPTY');
    const objects = [...this.buffers.keys()].sort().map(id => this.sampleObject(id, serverTick)).filter((value): value is TemporalPresentedObject => value !== null);
    const modes: Record<TemporalPresentationMode, number> = { hold: 0, interpolate: 0, extrapolate: 0, snap: 0 };
    for (const object of objects) modes[object.mode]++;
    const base = {
      format: VSR_TEMPORAL_FRAME_FORMAT,
      protocol: VSR_TEMPORAL_PRESENTATION_PROTOCOL,
      worldId: this.latestPacket.worldId,
      serverTick,
      presentationTick: serverTick - this.interpolationDelayTicks,
      authorityStateRoot: this.latestPacket.sourceStateRoot,
      objects,
      modes,
    };
    return { ...base, frameRoot: cryptographicHash(base) };
  }
}
