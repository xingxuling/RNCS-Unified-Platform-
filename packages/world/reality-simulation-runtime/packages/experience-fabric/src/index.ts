import { deepClone, semanticHash, type VSRValue } from '../../spec/src/index.js';

export const EXPERIENCE_FABRIC_VERSION = '0.4.0-alpha.1';
export const Q = 1_000_000;

export interface Vec2 { x: number; y: number }
export interface ColorRgba { r: number; g: number; b: number; a: number }
export type Interpolation = 'step' | 'linear' | 'smooth' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';

export interface ScalarKeyframe {
  tick: number;
  value: number;
  interpolation?: Interpolation;
  inTangent?: number;
  outTangent?: number;
}
export interface AnimationTrackSpec { target: string; keyframes: ScalarKeyframe[] }
export interface AnimationMarkerSpec { id: string; tick: number; eventType: string; data?: Record<string, VSRValue> }
export interface AnimationClipSpec {
  id: string;
  durationTicks: number;
  loop?: boolean;
  tracks: AnimationTrackSpec[];
  markers?: AnimationMarkerSpec[];
}
export interface AnimationStateSpec { id: string; clipId: string; speedQ?: number; loop?: boolean; tags?: string[] }
export type ConditionOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'truthy' | 'falsy' | 'trigger';
export interface TransitionConditionSpec { parameter: string; op: ConditionOp; value?: number | boolean }
export interface AnimationTransitionSpec {
  id: string;
  from: string | '*';
  to: string;
  durationTicks?: number;
  exitTimeQ?: number;
  priority?: number;
  conditions?: TransitionConditionSpec[];
}
export interface AnimatorLayerSpec {
  id: string;
  initialState: string;
  weightQ?: number;
  mode?: 'override' | 'additive';
  states: AnimationStateSpec[];
  transitions?: AnimationTransitionSpec[];
}
export interface AnimatorSpec { id: string; layers: AnimatorLayerSpec[]; parameters?: Record<string, number | boolean> }

export interface BoneSpec {
  id: string;
  parentId?: string;
  length: number;
  restPosition?: Vec2;
  restRotation?: number;
  restScale?: Vec2;
}
export interface TwoBoneIkSpec {
  id: string;
  rootBone: string;
  midBone: string;
  endBone: string;
  targetXParameter: string;
  targetYParameter: string;
  weightParameter?: string;
  bend?: 1 | -1;
}
export interface SkeletonSpec { id: string; bones: BoneSpec[]; ik?: TwoBoneIkSpec[] }
export interface BonePose {
  id: string;
  localPosition: Vec2;
  localRotation: number;
  localScale: Vec2;
  worldPosition: Vec2;
  worldRotation: number;
  worldScale: Vec2;
  endpoint: Vec2;
}
export interface SkeletonPose { skeletonId: string; bones: BonePose[]; poseRoot: string }

export type Waveform = 'sine' | 'square' | 'triangle' | 'saw' | 'noise';
export interface AudioEnvelopeSpec { attackMs?: number; decayMs?: number; sustainQ?: number; releaseMs?: number }
export interface AudioVoiceSpec {
  id: string;
  source: { type: 'oscillator'; waveform: Waveform; frequencyHz: number; frequencyEndHz?: number }
    | { type: 'sample'; samples: number[]; sampleRate: number; loop?: boolean };
  durationMs: number;
  gainQ?: number;
  panQ?: number;
  priority?: number;
  busId?: string;
  envelope?: AudioEnvelopeSpec;
  detuneCents?: number;
  spatial?: { position?: Vec2; minDistance?: number; maxDistance?: number; rolloffQ?: number };
}
export interface AudioCueSpec { id: string; voices: AudioVoiceSpec[]; maxInstances?: number; cooldownTicks?: number }
export interface AudioBusSpec {
  id: string;
  parentId?: string;
  gainQ?: number;
  lowPassHz?: number;
  delayMs?: number;
  delayFeedbackQ?: number;
}
export interface ListenerSpec { position: Vec2; facing?: Vec2 }

export interface NumberCurvePoint { tQ: number; value: number }
export interface ColorCurvePoint { tQ: number; color: ColorRgba }
export interface ParticleEmitterSpec {
  id: string;
  rateQ?: number;
  bursts?: Array<{ tick: number; count: number }>;
  maxParticles: number;
  lifetimeTicks: { min: number; max: number };
  spawn: { type: 'point' | 'box' | 'circle' | 'line'; offset?: Vec2; extents?: Vec2; radius?: number; a?: Vec2; b?: Vec2 };
  speed: { min: number; max: number };
  angleTurnsQ: { min: number; max: number };
  gravity?: Vec2;
  dragQ?: number;
  angularVelocity?: { min: number; max: number };
  sizeCurve?: NumberCurvePoint[];
  opacityCurve?: NumberCurvePoint[];
  colorCurve?: ColorCurvePoint[];
  collision?: { min?: Vec2; max?: Vec2; restitutionQ?: number; killOutside?: boolean };
  blend?: 'normal' | 'additive' | 'screen';
  tags?: string[];
}
export interface ScreenEffectSpec {
  type: 'shake' | 'flash' | 'chromatic-aberration' | 'time-dilation';
  startTick?: number;
  durationTicks: number;
  intensityQ: number;
  color?: ColorRgba;
}
export interface EffectGraphSpec {
  id: string;
  durationTicks: number;
  emitters?: ParticleEmitterSpec[];
  screenEffects?: ScreenEffectSpec[];
  maxInstances?: number;
}

export type ExperienceActionSpec =
  | { type: 'animation-trigger'; animatorId: string; parameter: string }
  | { type: 'set-animation-parameter'; animatorId: string; parameter: string; value: number | boolean }
  | { type: 'audio-cue'; cueId: string; gainFromIntensity?: boolean }
  | { type: 'effect'; effectId: string; atEventPosition?: boolean }
  | { type: 'emit-event'; eventType: string; data?: Record<string, VSRValue> };
export interface ExperienceBindingSpec { id: string; eventType: string; minIntensityQ?: number; actions: ExperienceActionSpec[] }

export interface ExperienceFabricConfig {
  format: 'rsr.experience-fabric.v0.4';
  experienceId: string;
  tickHz: number;
  seed: number;
  durationTicks?: number;
  animators?: AnimatorSpec[];
  clips?: AnimationClipSpec[];
  skeletons?: SkeletonSpec[];
  audioCues?: AudioCueSpec[];
  audioBuses?: AudioBusSpec[];
  listener?: ListenerSpec;
  effects?: EffectGraphSpec[];
  bindings?: ExperienceBindingSpec[];
  initialEvents?: ExperienceInputEvent[];
}

export interface ExperienceInputEvent {
  id: string;
  tick: number;
  type: string;
  position?: Vec2;
  intensityQ?: number;
  subjectId?: string;
  data?: Record<string, VSRValue>;
}
export interface ExperienceOutputEvent extends ExperienceInputEvent { source: 'input' | 'binding' | 'animation-marker' | 'effect' }
export interface AudioCueEvent { id: string; tick: number; cueId: string; position: Vec2; gainQ: number; sourceEventId: string }
export interface ParticleState {
  id: string;
  effectInstanceId: string;
  emitterId: string;
  position: Vec2;
  velocity: Vec2;
  rotation: number;
  angularVelocity: number;
  ageTicks: number;
  lifetimeTicks: number;
  sizeQ: number;
  opacityQ: number;
  color: ColorRgba;
  blend: 'normal' | 'additive' | 'screen';
  tags: string[];
}
export interface EffectInstanceState {
  id: string;
  effectId: string;
  startTick: number;
  ageTicks: number;
  position: Vec2;
  intensityQ: number;
  emitterAccumulatorsQ: Record<string, number>;
  emittedCounts: Record<string, number>;
  completed: boolean;
}
export interface ScreenSignal {
  id: string;
  effectInstanceId: string;
  type: ScreenEffectSpec['type'];
  intensityQ: number;
  progressQ: number;
  color?: ColorRgba;
}
export interface LayerRuntimeState {
  animatorId: string;
  layerId: string;
  currentState: string;
  localTickQ: number;
  previousLocalTick: number;
  transition?: { id: string; from: string; to: string; elapsedTicks: number; durationTicks: number; toLocalTickQ: number };
}
export interface ExperienceDiagnostics {
  animationTracksSampled: number;
  transitionsStarted: number;
  markersEmitted: number;
  activeEffectInstances: number;
  activeParticles: number;
  particlesSpawned: number;
  particlesKilled: number;
  audioCueEvents: number;
  screenSignals: number;
}
export interface ExperienceSnapshot {
  format: 'rsr.experience-snapshot.v0.4';
  runtimeVersion: string;
  experienceId: string;
  tick: number;
  configHash: string;
  parameters: Record<string, number | boolean>;
  layerStates: LayerRuntimeState[];
  properties: Record<string, number>;
  skeletonPoses: SkeletonPose[];
  effectInstances: EffectInstanceState[];
  particles: ParticleState[];
  screenSignals: ScreenSignal[];
  audioEvents: AudioCueEvent[];
  events: ExperienceOutputEvent[];
  diagnostics: ExperienceDiagnostics;
  animationRoot: string;
  skeletonRoot: string;
  audioPlanRoot: string;
  effectRoot: string;
  eventRoot: string;
  stateRoot: string;
}
export interface ExperienceCausalDelta {
  format: 'rfe.experience-causal-delta.v0.4';
  provisional: true;
  experienceId: string;
  tick: number;
  baseRealityRoot: string;
  candidateStateRoot: string;
  facts: Array<{ subject: string; predicate: string; value: VSRValue }>;
  events: ExperienceOutputEvent[];
  evidenceRoots: Record<string, string>;
  deltaRoot: string;
}

function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
function q(value: number): number { return Math.round(value); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function ease(kind: Interpolation, t: number): number {
  const x = clamp(t, 0, 1);
  if (kind === 'step') return 0;
  if (kind === 'smooth') return x * x * (3 - 2 * x);
  if (kind === 'ease-in') return x * x;
  if (kind === 'ease-out') return 1 - (1 - x) * (1 - x);
  if (kind === 'ease-in-out') return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  if (kind === 'spring') return clamp(1 - Math.exp(-6 * x) * Math.cos(10 * x), 0, 1.2);
  return x;
}
function sampleTrack(track: AnimationTrackSpec, tick: number): number {
  const frames = [...track.keyframes].sort((a, b) => a.tick - b.tick);
  if (!frames.length) return 0;
  if (tick <= frames[0]!.tick) return frames[0]!.value;
  const last = frames[frames.length - 1]!;
  if (tick >= last.tick) return last.value;
  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i]!; const b = frames[i + 1]!;
    if (tick < a.tick || tick > b.tick) continue;
    const span = Math.max(1, b.tick - a.tick); const raw = (tick - a.tick) / span;
    if (a.outTangent !== undefined || b.inTangent !== undefined) {
      const t = raw; const t2 = t * t; const t3 = t2 * t;
      const m0 = (a.outTangent ?? (b.value - a.value)) * span;
      const m1 = (b.inTangent ?? (b.value - a.value)) * span;
      return q((2 * t3 - 3 * t2 + 1) * a.value + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b.value + (t3 - t2) * m1);
    }
    return q(lerp(a.value, b.value, ease(a.interpolation ?? 'linear', raw)));
  }
  return last.value;
}
function compareCondition(value: number | boolean | undefined, condition: TransitionConditionSpec, triggers: Set<string>): boolean {
  if (condition.op === 'trigger') return triggers.has(condition.parameter);
  if (condition.op === 'truthy') return Boolean(value);
  if (condition.op === 'falsy') return !value;
  const target = condition.value;
  if (condition.op === 'eq') return value === target;
  if (condition.op === 'neq') return value !== target;
  if (typeof value !== 'number' || typeof target !== 'number') return false;
  if (condition.op === 'gt') return value > target;
  if (condition.op === 'gte') return value >= target;
  if (condition.op === 'lt') return value < target;
  return value <= target;
}
function deterministicUnit(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 0xffffffff;
}
function range(seed: string, min: number, max: number): number { return q(min + (max - min) * deterministicUnit(seed)); }
function normalizeColor(color: ColorRgba): ColorRgba { return { r: clamp(q(color.r), 0, 255), g: clamp(q(color.g), 0, 255), b: clamp(q(color.b), 0, 255), a: clamp(q(color.a), 0, 255) }; }
function sampleNumberCurve(points: NumberCurvePoint[] | undefined, tQ: number, fallback: number): number {
  if (!points?.length) return fallback;
  const sorted = [...points].sort((a, b) => a.tQ - b.tQ);
  if (tQ <= sorted[0]!.tQ) return sorted[0]!.value;
  const last = sorted[sorted.length - 1]!; if (tQ >= last.tQ) return last.value;
  for (let i = 0; i < sorted.length - 1; i++) { const a = sorted[i]!; const b = sorted[i + 1]!; if (tQ >= a.tQ && tQ <= b.tQ) return q(lerp(a.value, b.value, (tQ - a.tQ) / Math.max(1, b.tQ - a.tQ))); }
  return fallback;
}
function sampleColorCurve(points: ColorCurvePoint[] | undefined, tQ: number): ColorRgba {
  if (!points?.length) return { r: 255, g: 255, b: 255, a: 255 };
  const sorted = [...points].sort((a, b) => a.tQ - b.tQ);
  if (tQ <= sorted[0]!.tQ) return normalizeColor(sorted[0]!.color);
  const last = sorted[sorted.length - 1]!; if (tQ >= last.tQ) return normalizeColor(last.color);
  for (let i = 0; i < sorted.length - 1; i++) { const a = sorted[i]!; const b = sorted[i + 1]!; if (tQ >= a.tQ && tQ <= b.tQ) { const t = (tQ - a.tQ) / Math.max(1, b.tQ - a.tQ); return normalizeColor({ r: lerp(a.color.r, b.color.r, t), g: lerp(a.color.g, b.color.g, t), b: lerp(a.color.b, b.color.b, t), a: lerp(a.color.a, b.color.a, t) }); } }
  return normalizeColor(last.color);
}
function spawnPosition(spawn: ParticleEmitterSpec['spawn'], origin: Vec2, key: string): Vec2 {
  const offset = spawn.offset ?? { x: 0, y: 0 };
  if (spawn.type === 'box') { const e = spawn.extents ?? { x: 0, y: 0 }; return { x: origin.x + offset.x + range(`${key}:x`, -e.x, e.x), y: origin.y + offset.y + range(`${key}:y`, -e.y, e.y) }; }
  if (spawn.type === 'circle') { const angle = deterministicUnit(`${key}:a`) * Math.PI * 2; const radius = Math.sqrt(deterministicUnit(`${key}:r`)) * (spawn.radius ?? 0); return { x: origin.x + offset.x + Math.cos(angle) * radius, y: origin.y + offset.y + Math.sin(angle) * radius }; }
  if (spawn.type === 'line') { const a = spawn.a ?? { x: 0, y: 0 }; const b = spawn.b ?? { x: 0, y: 0 }; const t = deterministicUnit(`${key}:line`); return { x: origin.x + offset.x + lerp(a.x, b.x, t), y: origin.y + offset.y + lerp(a.y, b.y, t) }; }
  return { x: origin.x + offset.x, y: origin.y + offset.y };
}
function qualified(animatorId: string, parameter: string): string { return `${animatorId}:${parameter}`; }

export function validateExperienceConfig(config: ExperienceFabricConfig): string[] {
  const errors: string[] = [];
  if (config.format !== 'rsr.experience-fabric.v0.4') errors.push('Unsupported format.');
  if (!config.experienceId) errors.push('experienceId is required.');
  if (!Number.isInteger(config.tickHz) || config.tickHz <= 0) errors.push('tickHz must be a positive integer.');
  const clipIds = new Set<string>();
  for (const clip of config.clips ?? []) { if (clipIds.has(clip.id)) errors.push(`Duplicate clip: ${clip.id}`); clipIds.add(clip.id); if (clip.durationTicks <= 0) errors.push(`Clip duration must be positive: ${clip.id}`); }
  for (const animator of config.animators ?? []) for (const layer of animator.layers) { if (!layer.states.some(s => s.id === layer.initialState)) errors.push(`Missing initial state ${animator.id}/${layer.id}/${layer.initialState}`); for (const state of layer.states) if (!clipIds.has(state.clipId)) errors.push(`Missing clip ${state.clipId}`); }
  const cueIds = new Set((config.audioCues ?? []).map(c => c.id)); const effectIds = new Set((config.effects ?? []).map(e => e.id));
  for (const binding of config.bindings ?? []) for (const action of binding.actions) { if (action.type === 'audio-cue' && !cueIds.has(action.cueId)) errors.push(`Missing audio cue ${action.cueId}`); if (action.type === 'effect' && !effectIds.has(action.effectId)) errors.push(`Missing effect ${action.effectId}`); }
  return errors;
}

export class ExperienceFabricWorld {
  readonly config: ExperienceFabricConfig;
  private tickValue = 0;
  private parameters = new Map<string, number | boolean>();
  private triggers = new Set<string>();
  private layerStates = new Map<string, LayerRuntimeState>();
  private properties: Record<string, number> = {};
  private effectInstances: EffectInstanceState[] = [];
  private particles: ParticleState[] = [];
  private audioEvents: AudioCueEvent[] = [];
  private events: ExperienceOutputEvent[] = [];
  private screenSignals: ScreenSignal[] = [];
  private cueLastTick = new Map<string, number>();
  private diagnostics: ExperienceDiagnostics = { animationTracksSampled: 0, transitionsStarted: 0, markersEmitted: 0, activeEffectInstances: 0, activeParticles: 0, particlesSpawned: 0, particlesKilled: 0, audioCueEvents: 0, screenSignals: 0 };

  constructor(config: ExperienceFabricConfig) {
    const errors = validateExperienceConfig(config); if (errors.length) throw new Error(errors.join('\n'));
    this.config = deepClone(config);
    for (const animator of this.config.animators ?? []) {
      for (const [name, value] of Object.entries(animator.parameters ?? {})) this.parameters.set(qualified(animator.id, name), value);
      for (const layer of animator.layers) this.layerStates.set(`${animator.id}/${layer.id}`, { animatorId: animator.id, layerId: layer.id, currentState: layer.initialState, localTickQ: 0, previousLocalTick: 0 });
    }
  }
  get tick(): number { return this.tickValue; }
  setParameter(animatorId: string, parameter: string, value: number | boolean): void { this.parameters.set(qualified(animatorId, parameter), value); }
  trigger(animatorId: string, parameter: string): void { this.triggers.add(qualified(animatorId, parameter)); }
  emit(event: ExperienceInputEvent): void { this.processEvent(event, 'input'); }

  private clip(id: string): AnimationClipSpec { const clip = (this.config.clips ?? []).find(c => c.id === id); if (!clip) throw new Error(`Unknown clip ${id}`); return clip; }
  private processEvent(event: ExperienceInputEvent, source: ExperienceOutputEvent['source']): void {
    const normalized: ExperienceOutputEvent = { ...deepClone(event), intensityQ: event.intensityQ ?? Q, position: event.position ?? { x: 0, y: 0 }, source };
    this.events.push(normalized);
    const bindings = [...(this.config.bindings ?? [])].filter(b => b.eventType === event.type && (event.intensityQ ?? Q) >= (b.minIntensityQ ?? 0)).sort((a, b) => a.id.localeCompare(b.id));
    for (const binding of bindings) for (const action of binding.actions) {
      if (action.type === 'animation-trigger') this.trigger(action.animatorId, action.parameter);
      else if (action.type === 'set-animation-parameter') this.setParameter(action.animatorId, action.parameter, action.value);
      else if (action.type === 'audio-cue') this.scheduleCue(action.cueId, normalized, action.gainFromIntensity ? (normalized.intensityQ ?? Q) : Q);
      else if (action.type === 'effect') this.startEffect(action.effectId, action.atEventPosition === false ? { x: 0, y: 0 } : (normalized.position ?? { x: 0, y: 0 }), normalized.intensityQ ?? Q, normalized.id);
      else this.events.push({ id: `${normalized.id}:${binding.id}:${action.eventType}`, tick: this.tickValue, type: action.eventType, position: normalized.position, intensityQ: normalized.intensityQ, data: action.data, source: 'binding' });
    }
  }
  private scheduleCue(cueId: string, source: ExperienceOutputEvent, gainQ: number): void {
    const cue = (this.config.audioCues ?? []).find(c => c.id === cueId); if (!cue) return;
    const last = this.cueLastTick.get(cueId); if (last !== undefined && this.tickValue - last < (cue.cooldownTicks ?? 0)) return;
    const count = this.audioEvents.filter(e => e.cueId === cueId && e.tick === this.tickValue).length; if (count >= (cue.maxInstances ?? Number.MAX_SAFE_INTEGER)) return;
    this.cueLastTick.set(cueId, this.tickValue);
    this.audioEvents.push({ id: `audio:${cueId}:${this.tickValue}:${this.audioEvents.length}`, tick: this.tickValue, cueId, position: source.position ?? { x: 0, y: 0 }, gainQ, sourceEventId: source.id });
    this.diagnostics.audioCueEvents++;
  }
  private startEffect(effectId: string, position: Vec2, intensityQ: number, sourceId: string): void {
    const effect = (this.config.effects ?? []).find(e => e.id === effectId); if (!effect) return;
    const active = this.effectInstances.filter(i => i.effectId === effectId && !i.completed); if (active.length >= (effect.maxInstances ?? Number.MAX_SAFE_INTEGER)) active[0]!.completed = true;
    this.effectInstances.push({ id: `effect:${effectId}:${this.tickValue}:${sourceId}:${this.effectInstances.length}`, effectId, startTick: this.tickValue, ageTicks: 0, position: { ...position }, intensityQ, emitterAccumulatorsQ: {}, emittedCounts: {}, completed: false });
  }
  private stateAndLayer(runtime: LayerRuntimeState): { animator: AnimatorSpec; layer: AnimatorLayerSpec; state: AnimationStateSpec } {
    const animator = this.config.animators!.find(a => a.id === runtime.animatorId)!; const layer = animator.layers.find(l => l.id === runtime.layerId)!; const state = layer.states.find(s => s.id === runtime.currentState)!; return { animator, layer, state };
  }
  private clipLocalTick(state: AnimationStateSpec, runtimeTickQ: number): number {
    const clip = this.clip(state.clipId); const raw = Math.floor(runtimeTickQ / Q); const loop = state.loop ?? clip.loop ?? false; return loop ? raw % clip.durationTicks : Math.min(raw, clip.durationTicks);
  }
  private chooseTransition(runtime: LayerRuntimeState, layer: AnimatorLayerSpec, state: AnimationStateSpec): AnimationTransitionSpec | undefined {
    const local = this.clipLocalTick(state, runtime.localTickQ); const clip = this.clip(state.clipId); const normalizedQ = q(local / Math.max(1, clip.durationTicks) * Q);
    return [...(layer.transitions ?? [])].filter(t => (t.from === '*' || t.from === runtime.currentState) && normalizedQ >= (t.exitTimeQ ?? 0) && (t.conditions ?? []).every(c => compareCondition(this.parameters.get(qualified(runtime.animatorId, c.parameter)), { ...c, parameter: qualified(runtime.animatorId, c.parameter) }, this.triggers))).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id))[0];
  }
  private emitMarkers(animatorId: string, layerId: string, clip: AnimationClipSpec, previous: number, current: number, looped: boolean): void {
    for (const marker of [...(clip.markers ?? [])].sort((a, b) => a.tick - b.tick || a.id.localeCompare(b.id))) {
      const crossed = looped ? marker.tick > previous || marker.tick <= current : marker.tick > previous && marker.tick <= current;
      if (!crossed) continue;
      this.diagnostics.markersEmitted++;
      this.processEvent({ id: `marker:${animatorId}:${layerId}:${marker.id}:${this.tickValue}`, tick: this.tickValue, type: marker.eventType, data: marker.data, position: { x: this.properties[`${animatorId}.position.x`] ?? 0, y: this.properties[`${animatorId}.position.y`] ?? 0 }, intensityQ: Q }, 'animation-marker');
    }
  }
  private advanceAnimations(): void {
    const layerOutputs: Array<{ layer: AnimatorLayerSpec; values: Record<string, number> }> = [];
    for (const runtime of [...this.layerStates.values()].sort((a, b) => `${a.animatorId}/${a.layerId}`.localeCompare(`${b.animatorId}/${b.layerId}`))) {
      const { layer, state } = this.stateAndLayer(runtime);
      if (!runtime.transition) { const transition = this.chooseTransition(runtime, layer, state); if (transition) { runtime.transition = { id: transition.id, from: runtime.currentState, to: transition.to, elapsedTicks: 0, durationTicks: Math.max(1, transition.durationTicks ?? 1), toLocalTickQ: 0 }; this.diagnostics.transitionsStarted++; } }
      const speedQ = state.speedQ ?? Q; runtime.previousLocalTick = this.clipLocalTick(state, runtime.localTickQ); runtime.localTickQ += speedQ;
      const currentClip = this.clip(state.clipId); const currentTick = this.clipLocalTick(state, runtime.localTickQ); const looped = currentTick < runtime.previousLocalTick; this.emitMarkers(runtime.animatorId, runtime.layerId, currentClip, runtime.previousLocalTick, currentTick, looped);
      const currentValues: Record<string, number> = {}; for (const track of currentClip.tracks) { currentValues[track.target] = sampleTrack(track, currentTick); this.diagnostics.animationTracksSampled++; }
      let output = currentValues;
      if (runtime.transition) {
        const targetState = layer.states.find(s => s.id === runtime.transition!.to)!; const targetClip = this.clip(targetState.clipId); runtime.transition.toLocalTickQ += targetState.speedQ ?? Q; const targetTick = this.clipLocalTick(targetState, runtime.transition.toLocalTickQ); const targetValues: Record<string, number> = {}; for (const track of targetClip.tracks) { targetValues[track.target] = sampleTrack(track, targetTick); this.diagnostics.animationTracksSampled++; }
        runtime.transition.elapsedTicks++; const blend = clamp(runtime.transition.elapsedTicks / runtime.transition.durationTicks, 0, 1); output = {}; for (const key of new Set([...Object.keys(currentValues), ...Object.keys(targetValues)])) output[key] = q(lerp(currentValues[key] ?? 0, targetValues[key] ?? currentValues[key] ?? 0, blend));
        if (runtime.transition.elapsedTicks >= runtime.transition.durationTicks) { runtime.currentState = runtime.transition.to; runtime.localTickQ = runtime.transition.toLocalTickQ; runtime.previousLocalTick = this.clipLocalTick(targetState, runtime.localTickQ); runtime.transition = undefined; }
      }
      layerOutputs.push({ layer, values: output });
    }
    const combined: Record<string, number> = {};
    for (const { layer, values } of layerOutputs) { const weight = (layer.weightQ ?? Q) / Q; for (const [key, value] of Object.entries(values)) combined[key] = layer.mode === 'additive' ? q((combined[key] ?? 0) + value * weight) : q(lerp(combined[key] ?? value, value, weight)); }
    this.properties = combined;
  }
  private buildSkeletonPoses(): SkeletonPose[] {
    const poses: SkeletonPose[] = [];
    for (const skeleton of this.config.skeletons ?? []) {
      const byId = new Map<string, BonePose>();
      for (const bone of skeleton.bones) {
        const prefix = `skeleton:${skeleton.id}/bone:${bone.id}`;
        const localPosition = { x: this.properties[`${prefix}.position.x`] ?? bone.restPosition?.x ?? 0, y: this.properties[`${prefix}.position.y`] ?? bone.restPosition?.y ?? 0 };
        const localRotation = this.properties[`${prefix}.rotation`] ?? bone.restRotation ?? 0;
        const localScale = { x: this.properties[`${prefix}.scale.x`] ?? bone.restScale?.x ?? Q, y: this.properties[`${prefix}.scale.y`] ?? bone.restScale?.y ?? Q };
        const parent = bone.parentId ? byId.get(bone.parentId) : undefined;
        const parentRot = (parent?.worldRotation ?? 0) / Q * Math.PI * 2; const px = parent?.endpoint.x ?? 0; const py = parent?.endpoint.y ?? 0;
        const rx = localPosition.x * Math.cos(parentRot) - localPosition.y * Math.sin(parentRot); const ry = localPosition.x * Math.sin(parentRot) + localPosition.y * Math.cos(parentRot);
        const worldPosition = { x: q(px + rx), y: q(py + ry) }; const worldRotation = q((parent?.worldRotation ?? 0) + localRotation); const worldScale = { x: q((parent?.worldScale.x ?? Q) * localScale.x / Q), y: q((parent?.worldScale.y ?? Q) * localScale.y / Q) };
        const angle = worldRotation / Q * Math.PI * 2; const endpoint = { x: q(worldPosition.x + Math.cos(angle) * bone.length * worldScale.x / Q), y: q(worldPosition.y + Math.sin(angle) * bone.length * worldScale.y / Q) };
        byId.set(bone.id, { id: bone.id, localPosition, localRotation, localScale, worldPosition, worldRotation, worldScale, endpoint });
      }
      for (const ik of skeleton.ik ?? []) {
        const root = byId.get(ik.rootBone); const mid = byId.get(ik.midBone); const end = byId.get(ik.endBone); if (!root || !mid || !end) continue;
        const targetX = Number(this.parameters.get(ik.targetXParameter) ?? end.endpoint.x); const targetY = Number(this.parameters.get(ik.targetYParameter) ?? end.endpoint.y); const weight = Number(this.parameters.get(ik.weightParameter ?? '') ?? Q) / Q;
        const dx = targetX - root.worldPosition.x; const dy = targetY - root.worldPosition.y; const d = Math.max(1, Math.hypot(dx, dy)); const l1 = Math.max(1, Math.hypot(mid.endpoint.x - root.worldPosition.x, mid.endpoint.y - root.worldPosition.y)); const l2 = Math.max(1, Math.hypot(end.endpoint.x - mid.worldPosition.x, end.endpoint.y - mid.worldPosition.y));
        const c2 = clamp((d * d - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1); const a2 = Math.acos(c2) * (ik.bend ?? 1); const a1 = Math.atan2(dy, dx) - Math.atan2(l2 * Math.sin(a2), l1 + l2 * Math.cos(a2));
        const rootTurns = a1 / (Math.PI * 2) * Q; const midTurns = a2 / (Math.PI * 2) * Q; root.worldRotation = q(lerp(root.worldRotation, rootTurns, weight)); mid.worldRotation = q(lerp(mid.worldRotation, root.worldRotation + midTurns, weight));
        const ra = root.worldRotation / Q * Math.PI * 2; root.endpoint = { x: q(root.worldPosition.x + Math.cos(ra) * l1), y: q(root.worldPosition.y + Math.sin(ra) * l1) }; mid.worldPosition = { ...root.endpoint }; const ma = mid.worldRotation / Q * Math.PI * 2; mid.endpoint = { x: q(mid.worldPosition.x + Math.cos(ma) * l2), y: q(mid.worldPosition.y + Math.sin(ma) * l2) }; end.worldPosition = { ...mid.endpoint }; end.endpoint = { ...mid.endpoint };
      }
      const bones = skeleton.bones.map(b => byId.get(b.id)!).filter(Boolean); poses.push({ skeletonId: skeleton.id, bones, poseRoot: semanticHash(bones) });
    }
    return poses;
  }
  private spawnParticle(instance: EffectInstanceState, emitter: ParticleEmitterSpec, index: number): void {
    if (this.particles.filter(p => p.effectInstanceId === instance.id && p.emitterId === emitter.id).length >= emitter.maxParticles) return;
    const key = `${this.config.seed}:${instance.id}:${emitter.id}:${index}`; const position = spawnPosition(emitter.spawn, instance.position, key); const speed = range(`${key}:speed`, emitter.speed.min, emitter.speed.max); const turnsQ = range(`${key}:angle`, emitter.angleTurnsQ.min, emitter.angleTurnsQ.max); const angle = turnsQ / Q * Math.PI * 2;
    this.particles.push({ id: `particle:${instance.id}:${emitter.id}:${index}`, effectInstanceId: instance.id, emitterId: emitter.id, position, velocity: { x: q(Math.cos(angle) * speed), y: q(Math.sin(angle) * speed) }, rotation: turnsQ, angularVelocity: range(`${key}:angular`, emitter.angularVelocity?.min ?? 0, emitter.angularVelocity?.max ?? 0), ageTicks: 0, lifetimeTicks: Math.max(1, range(`${key}:life`, emitter.lifetimeTicks.min, emitter.lifetimeTicks.max)), sizeQ: sampleNumberCurve(emitter.sizeCurve, 0, Q), opacityQ: sampleNumberCurve(emitter.opacityCurve, 0, Q), color: sampleColorCurve(emitter.colorCurve, 0), blend: emitter.blend ?? 'normal', tags: emitter.tags ?? [] });
    this.diagnostics.particlesSpawned++;
  }
  private updateEffects(): void {
    this.screenSignals = [];
    for (const instance of this.effectInstances) {
      if (instance.completed) continue; const effect = (this.config.effects ?? []).find(e => e.id === instance.effectId)!;
      for (const emitter of effect.emitters ?? []) {
        let count = 0; for (const burst of emitter.bursts ?? []) if (burst.tick === instance.ageTicks) count += burst.count;
        const accumulator = (instance.emitterAccumulatorsQ[emitter.id] ?? 0) + (emitter.rateQ ?? 0); count += Math.floor(accumulator / Q); instance.emitterAccumulatorsQ[emitter.id] = accumulator % Q;
        for (let i = 0; i < count; i++) { const emitted = instance.emittedCounts[emitter.id] ?? 0; this.spawnParticle(instance, emitter, emitted); instance.emittedCounts[emitter.id] = emitted + 1; }
      }
      for (const screen of effect.screenEffects ?? []) { const start = screen.startTick ?? 0; const local = instance.ageTicks - start; if (local >= 0 && local <= screen.durationTicks) { const progressQ = q(local / Math.max(1, screen.durationTicks) * Q); const envelope = Math.sin(progressQ / Q * Math.PI); this.screenSignals.push({ id: `screen:${instance.id}:${screen.type}`, effectInstanceId: instance.id, type: screen.type, intensityQ: q(screen.intensityQ * envelope * instance.intensityQ / Q), progressQ, color: screen.color }); } }
      instance.ageTicks++; if (instance.ageTicks > effect.durationTicks) instance.completed = true;
    }
    const emitterMap = new Map<string, ParticleEmitterSpec>(); for (const effect of this.config.effects ?? []) for (const emitter of effect.emitters ?? []) emitterMap.set(`${effect.id}/${emitter.id}`, emitter);
    const survivors: ParticleState[] = [];
    for (const particle of this.particles) {
      const instance = this.effectInstances.find(i => i.id === particle.effectInstanceId); const emitter = instance ? emitterMap.get(`${instance.effectId}/${particle.emitterId}`) : undefined; if (!emitter) continue;
      particle.ageTicks++; if (particle.ageTicks >= particle.lifetimeTicks) { this.diagnostics.particlesKilled++; continue; }
      const drag = (emitter.dragQ ?? 0) / Q; particle.velocity.x = q(particle.velocity.x * (1 - drag) + (emitter.gravity?.x ?? 0) / this.config.tickHz); particle.velocity.y = q(particle.velocity.y * (1 - drag) + (emitter.gravity?.y ?? 0) / this.config.tickHz); particle.position.x = q(particle.position.x + particle.velocity.x / this.config.tickHz); particle.position.y = q(particle.position.y + particle.velocity.y / this.config.tickHz); particle.rotation = q(particle.rotation + particle.angularVelocity / this.config.tickHz);
      const collision = emitter.collision; if (collision) {
        const min = collision.min; const max = collision.max; let outside = false;
        if (min && particle.position.x < min.x) { particle.position.x = min.x; particle.velocity.x = q(Math.abs(particle.velocity.x) * (collision.restitutionQ ?? 0) / Q); outside = true; }
        if (max && particle.position.x > max.x) { particle.position.x = max.x; particle.velocity.x = -q(Math.abs(particle.velocity.x) * (collision.restitutionQ ?? 0) / Q); outside = true; }
        if (min && particle.position.y < min.y) { particle.position.y = min.y; particle.velocity.y = q(Math.abs(particle.velocity.y) * (collision.restitutionQ ?? 0) / Q); outside = true; }
        if (max && particle.position.y > max.y) { particle.position.y = max.y; particle.velocity.y = -q(Math.abs(particle.velocity.y) * (collision.restitutionQ ?? 0) / Q); outside = true; }
        if (outside && collision.killOutside) { this.diagnostics.particlesKilled++; continue; }
      }
      const progressQ = q(particle.ageTicks / particle.lifetimeTicks * Q); particle.sizeQ = sampleNumberCurve(emitter.sizeCurve, progressQ, Q); particle.opacityQ = sampleNumberCurve(emitter.opacityCurve, progressQ, Q); particle.color = sampleColorCurve(emitter.colorCurve, progressQ); survivors.push(particle);
    }
    this.particles = survivors; this.effectInstances = this.effectInstances.filter(i => !i.completed || this.particles.some(p => p.effectInstanceId === i.id));
    this.diagnostics.activeEffectInstances = this.effectInstances.filter(i => !i.completed).length; this.diagnostics.activeParticles = this.particles.length; this.diagnostics.screenSignals = this.screenSignals.length;
  }
  step(inputEvents: ExperienceInputEvent[] = []): ExperienceSnapshot {
    this.diagnostics = { animationTracksSampled: 0, transitionsStarted: 0, markersEmitted: 0, activeEffectInstances: this.effectInstances.length, activeParticles: this.particles.length, particlesSpawned: 0, particlesKilled: 0, audioCueEvents: 0, screenSignals: 0 };
    const scheduled = [...(this.config.initialEvents ?? []), ...inputEvents].filter(e => e.tick === this.tickValue).sort((a, b) => a.id.localeCompare(b.id)); for (const event of scheduled) this.processEvent(event, 'input');
    this.advanceAnimations(); this.updateEffects(); this.tickValue++; this.triggers.clear(); return this.snapshot();
  }
  run(ticks: number, events: ExperienceInputEvent[] = []): ExperienceSnapshot { let snapshot = this.snapshot(); for (let i = 0; i < ticks; i++) snapshot = this.step(events); return snapshot; }
  snapshot(): ExperienceSnapshot {
    const skeletonPoses = this.buildSkeletonPoses(); const parameters = Object.fromEntries([...this.parameters.entries()].sort(([a], [b]) => a.localeCompare(b)));
    const layerStates = [...this.layerStates.values()].sort((a, b) => `${a.animatorId}/${a.layerId}`.localeCompare(`${b.animatorId}/${b.layerId}`)).map(deepClone); const properties = Object.fromEntries(Object.entries(this.properties).sort(([a], [b]) => a.localeCompare(b)));
    const animationRoot = semanticHash({ parameters, layerStates, properties }); const skeletonRoot = semanticHash(skeletonPoses); const audioPlanRoot = semanticHash(this.audioEvents); const effectRoot = semanticHash({ instances: this.effectInstances, particles: this.particles, screenSignals: this.screenSignals }); const eventRoot = semanticHash(this.events);
    const base = { format: 'rsr.experience-snapshot.v0.4' as const, runtimeVersion: EXPERIENCE_FABRIC_VERSION, experienceId: this.config.experienceId, tick: this.tickValue, configHash: semanticHash(this.config), parameters, layerStates, properties, skeletonPoses, effectInstances: deepClone(this.effectInstances), particles: deepClone(this.particles), screenSignals: deepClone(this.screenSignals), audioEvents: deepClone(this.audioEvents), events: deepClone(this.events), diagnostics: deepClone(this.diagnostics), animationRoot, skeletonRoot, audioPlanRoot, effectRoot, eventRoot };
    return { ...base, stateRoot: semanticHash(base) };
  }
  static fromSnapshot(config: ExperienceFabricConfig, snapshot: ExperienceSnapshot): ExperienceFabricWorld {
    if (semanticHash(config) !== snapshot.configHash) throw new Error('Snapshot config hash mismatch.'); const world = new ExperienceFabricWorld(config); world.tickValue = snapshot.tick; world.parameters = new Map(Object.entries(snapshot.parameters)); world.layerStates = new Map(snapshot.layerStates.map(s => [`${s.animatorId}/${s.layerId}`, deepClone(s)])); world.properties = deepClone(snapshot.properties); world.effectInstances = deepClone(snapshot.effectInstances); world.particles = deepClone(snapshot.particles); world.screenSignals = deepClone(snapshot.screenSignals); world.audioEvents = deepClone(snapshot.audioEvents); for (const event of world.audioEvents) world.cueLastTick.set(event.cueId, Math.max(world.cueLastTick.get(event.cueId) ?? -1, event.tick)); world.events = deepClone(snapshot.events); world.diagnostics = deepClone(snapshot.diagnostics); return world;
  }
}

export function replayExperience(config: ExperienceFabricConfig, ticks: number, events: ExperienceInputEvent[] = []): ExperienceSnapshot { return new ExperienceFabricWorld(config).run(ticks, events); }
export function experienceSnapshotToCausalDelta(snapshot: ExperienceSnapshot, baseRealityRoot: string): ExperienceCausalDelta {
  const facts: ExperienceCausalDelta['facts'] = [
    { subject: snapshot.experienceId, predicate: 'experience.tick', value: snapshot.tick },
    { subject: snapshot.experienceId, predicate: 'experience.animation-root', value: snapshot.animationRoot },
    { subject: snapshot.experienceId, predicate: 'experience.audio-plan-root', value: snapshot.audioPlanRoot },
    { subject: snapshot.experienceId, predicate: 'experience.effect-root', value: snapshot.effectRoot },
    { subject: snapshot.experienceId, predicate: 'experience.active-particles', value: snapshot.particles.length },
    ...snapshot.layerStates.map(layer => ({ subject: `${layer.animatorId}/${layer.layerId}`, predicate: 'animation.state', value: layer.currentState as VSRValue }))
  ];
  const base = { format: 'rfe.experience-causal-delta.v0.4' as const, provisional: true as const, experienceId: snapshot.experienceId, tick: snapshot.tick, baseRealityRoot, candidateStateRoot: snapshot.stateRoot, facts, events: snapshot.events, evidenceRoots: { animation: snapshot.animationRoot, skeleton: snapshot.skeletonRoot, audioPlan: snapshot.audioPlanRoot, effects: snapshot.effectRoot, events: snapshot.eventRoot } };
  return { ...base, deltaRoot: semanticHash(base) };
}
