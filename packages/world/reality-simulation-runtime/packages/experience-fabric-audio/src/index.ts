import { semanticHash } from '../../spec/src/index.js';
import { Q, type AudioBusSpec, type AudioCueEvent, type AudioCueSpec, type AudioVoiceSpec, type ExperienceFabricConfig, type ExperienceSnapshot, type ListenerSpec, type Vec2 } from '../../experience-fabric/src/index.js';

export interface AudioRenderOptions {
  sampleRate?: number;
  durationSeconds?: number;
  masterGainQ?: number;
  maxVoices?: number;
  normalize?: boolean;
}
export interface AudioRenderDiagnostics {
  sampleRate: number;
  frames: number;
  scheduledVoices: number;
  renderedVoices: number;
  droppedVoices: number;
  peakBeforeNormalize: number;
  normalizeGain: number;
  buses: number;
}
export interface AudioRenderResult {
  wav: Uint8Array;
  wavHash: string;
  planRoot: string;
  diagnostics: AudioRenderDiagnostics;
}
interface ScheduledVoice { event: AudioCueEvent; cue: AudioCueSpec; voice: AudioVoiceSpec; startFrame: number; endFrame: number; priority: number }
interface StereoBuffer { left: Float64Array; right: Float64Array }

function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }
function deterministicNoise(seed: string, index: number): number { let h = 2166136261 >>> 0; const text = `${seed}:${index}`; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) / 0xffffffff) * 2 - 1; }
function oscillator(waveform: AudioVoiceSpec['source'] extends infer _ ? string : never, phase: number, seed: string, index: number): number {
  if (waveform === 'square') return Math.sin(phase) >= 0 ? 1 : -1;
  if (waveform === 'triangle') return 2 / Math.PI * Math.asin(Math.sin(phase));
  if (waveform === 'saw') return 2 * (phase / (Math.PI * 2) - Math.floor(phase / (Math.PI * 2) + 0.5));
  if (waveform === 'noise') return deterministicNoise(seed, index);
  return Math.sin(phase);
}
function envelope(voice: AudioVoiceSpec, timeMs: number): number {
  const duration = Math.max(1, voice.durationMs); const env = voice.envelope ?? {}; const attack = Math.max(0, env.attackMs ?? 4); const decay = Math.max(0, env.decayMs ?? 30); const release = Math.max(0, env.releaseMs ?? 50); const sustain = clamp((env.sustainQ ?? Q) / Q, 0, 1);
  if (attack > 0 && timeMs < attack) return timeMs / attack;
  if (decay > 0 && timeMs < attack + decay) return 1 - (1 - sustain) * ((timeMs - attack) / decay);
  if (timeMs > duration - release && release > 0) return sustain * clamp((duration - timeMs) / release, 0, 1);
  return sustain;
}
function spatialPan(listener: ListenerSpec | undefined, source: Vec2, voice: AudioVoiceSpec): { left: number; right: number; attenuation: number } {
  const explicitPan = clamp((voice.panQ ?? 0) / Q, -1, 1); if (!voice.spatial) { const angle = (explicitPan + 1) * Math.PI / 4; return { left: Math.cos(angle), right: Math.sin(angle), attenuation: 1 }; }
  const lp = listener?.position ?? { x: 0, y: 0 }; const position = voice.spatial.position ?? source; const dx = position.x - lp.x; const dy = position.y - lp.y; const distance = Math.hypot(dx, dy); const minD = Math.max(1, voice.spatial.minDistance ?? 1); const maxD = Math.max(minD, voice.spatial.maxDistance ?? 1000); const rolloff = Math.max(0, (voice.spatial.rolloffQ ?? Q) / Q); const norm = clamp((distance - minD) / Math.max(1, maxD - minD), 0, 1); const attenuation = Math.pow(1 - norm, rolloff || 1); const pan = clamp(explicitPan + dx / maxD, -1, 1); const angle = (pan + 1) * Math.PI / 4; return { left: Math.cos(angle), right: Math.sin(angle), attenuation };
}
function buildSchedule(config: ExperienceFabricConfig, events: AudioCueEvent[], sampleRate: number, maxVoices: number): { voices: ScheduledVoice[]; dropped: number } {
  const cueMap = new Map((config.audioCues ?? []).map(c => [c.id, c])); const all: ScheduledVoice[] = [];
  for (const event of events) { const cue = cueMap.get(event.cueId); if (!cue) continue; for (const voice of cue.voices) { const startFrame = Math.max(0, Math.round(event.tick / config.tickHz * sampleRate)); const endFrame = startFrame + Math.ceil(voice.durationMs / 1000 * sampleRate); all.push({ event, cue, voice, startFrame, endFrame, priority: voice.priority ?? 0 }); } }
  all.sort((a, b) => b.priority - a.priority || a.startFrame - b.startFrame || `${a.event.id}/${a.voice.id}`.localeCompare(`${b.event.id}/${b.voice.id}`));
  if (all.length <= maxVoices) return { voices: all.sort((a, b) => a.startFrame - b.startFrame), dropped: 0 };
  return { voices: all.slice(0, maxVoices).sort((a, b) => a.startFrame - b.startFrame), dropped: all.length - maxVoices };
}
function busOrder(buses: AudioBusSpec[]): AudioBusSpec[] {
  const byId = new Map(buses.map(b => [b.id, b])); const depth = (bus: AudioBusSpec, seen = new Set<string>()): number => { if (!bus.parentId || seen.has(bus.id)) return 0; const parent = byId.get(bus.parentId); if (!parent) return 0; seen.add(bus.id); return 1 + depth(parent, seen); }; return [...buses].sort((a, b) => depth(b) - depth(a) || a.id.localeCompare(b.id));
}
function applyLowPass(buffer: StereoBuffer, cutoff: number, sampleRate: number): void { const c = clamp(cutoff, 20, sampleRate / 2 - 1); const alpha = 1 - Math.exp(-2 * Math.PI * c / sampleRate); let l = 0; let r = 0; for (let i = 0; i < buffer.left.length; i++) { l += alpha * (buffer.left[i]! - l); r += alpha * (buffer.right[i]! - r); buffer.left[i] = l; buffer.right[i] = r; } }
function applyDelay(buffer: StereoBuffer, delayMs: number, feedbackQ: number, sampleRate: number): void { const delay = Math.max(1, Math.round(delayMs / 1000 * sampleRate)); const feedback = clamp(feedbackQ / Q, 0, 0.95); for (let i = delay; i < buffer.left.length; i++) { buffer.left[i] = buffer.left[i]! + buffer.left[i - delay]! * feedback; buffer.right[i] = buffer.right[i]! + buffer.right[i - delay]! * feedback; } }
function writeWav(left: Float64Array, right: Float64Array, sampleRate: number): Uint8Array {
  const frames = left.length; const bytes = new Uint8Array(44 + frames * 4); const view = new DataView(bytes.buffer); const text = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i); };
  text(0, 'RIFF'); view.setUint32(4, 36 + frames * 4, true); text(8, 'WAVE'); text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, frames * 4, true);
  for (let i = 0; i < frames; i++) { view.setInt16(44 + i * 4, Math.round(clamp(left[i]!, -1, 1) * 32767), true); view.setInt16(46 + i * 4, Math.round(clamp(right[i]!, -1, 1) * 32767), true); }
  return bytes;
}

export function renderExperienceAudio(config: ExperienceFabricConfig, snapshot: ExperienceSnapshot, options: AudioRenderOptions = {}): AudioRenderResult {
  const sampleRate = options.sampleRate ?? 48_000; const inferredDuration = Math.max(snapshot.tick / config.tickHz + 1, ...snapshot.audioEvents.map(e => e.tick / config.tickHz + 2), config.durationTicks ? config.durationTicks / config.tickHz : 0); const duration = options.durationSeconds ?? inferredDuration; const frames = Math.max(1, Math.ceil(duration * sampleRate)); const maxVoices = options.maxVoices ?? 256; const schedule = buildSchedule(config, snapshot.audioEvents, sampleRate, maxVoices);
  const buses = (config.audioBuses?.length ? config.audioBuses : [{ id: 'master' }]) as AudioBusSpec[]; const busBuffers = new Map<string, StereoBuffer>(); for (const bus of buses) busBuffers.set(bus.id, { left: new Float64Array(frames), right: new Float64Array(frames) }); if (!busBuffers.has('master')) busBuffers.set('master', { left: new Float64Array(frames), right: new Float64Array(frames) });
  for (const scheduled of schedule.voices) {
    const voice = scheduled.voice; const bus = busBuffers.get(voice.busId ?? 'master') ?? busBuffers.get('master')!; const gain = (voice.gainQ ?? Q) / Q * scheduled.event.gainQ / Q; const pan = spatialPan(config.listener, scheduled.event.position, voice); const detune = Math.pow(2, (voice.detuneCents ?? 0) / 1200); let phase = 0;
    for (let frame = scheduled.startFrame; frame < Math.min(frames, scheduled.endFrame); frame++) {
      const local = frame - scheduled.startFrame; const t = local / Math.max(1, scheduled.endFrame - scheduled.startFrame - 1); const timeMs = local / sampleRate * 1000; let sample = 0;
      if (voice.source.type === 'sample') { const sourceIndex = local * voice.source.sampleRate / sampleRate; const i0 = Math.floor(sourceIndex); const i1 = i0 + 1; const count = voice.source.samples.length; if (count) { const a = voice.source.samples[(voice.source.loop ? i0 % count : i0)] ?? 0; const b = voice.source.samples[(voice.source.loop ? i1 % count : i1)] ?? a; sample = a + (b - a) * (sourceIndex - i0); } }
      else { const frequency = (voice.source.frequencyHz + ((voice.source.frequencyEndHz ?? voice.source.frequencyHz) - voice.source.frequencyHz) * t) * detune; phase += Math.PI * 2 * frequency / sampleRate; sample = oscillator(voice.source.waveform, phase, `${scheduled.event.id}:${voice.id}`, local); }
      const amp = sample * envelope(voice, timeMs) * gain * pan.attenuation; bus.left[frame] = bus.left[frame]! + amp * pan.left; bus.right[frame] = bus.right[frame]! + amp * pan.right;
    }
  }
  const byId = new Map(buses.map(b => [b.id, b])); for (const busSpec of busOrder(buses)) { const buffer = busBuffers.get(busSpec.id); if (!buffer) continue; if (busSpec.lowPassHz) applyLowPass(buffer, busSpec.lowPassHz, sampleRate); if (busSpec.delayMs) applyDelay(buffer, busSpec.delayMs, busSpec.delayFeedbackQ ?? 250_000, sampleRate); const gain = (busSpec.gainQ ?? Q) / Q; for (let i = 0; i < frames; i++) { buffer.left[i] = buffer.left[i]! * gain; buffer.right[i] = buffer.right[i]! * gain; } if (busSpec.parentId) { const parent = busBuffers.get(busSpec.parentId); if (parent) for (let i = 0; i < frames; i++) { parent.left[i] = parent.left[i]! + buffer.left[i]!; parent.right[i] = parent.right[i]! + buffer.right[i]!; } } }
  const master = busBuffers.get('master')!; const masterGain = (options.masterGainQ ?? Q) / Q; let peak = 0; for (let i = 0; i < frames; i++) { master.left[i] = master.left[i]! * masterGain; master.right[i] = master.right[i]! * masterGain; peak = Math.max(peak, Math.abs(master.left[i]!), Math.abs(master.right[i]!)); }
  const normalizeGain = options.normalize !== false && peak > 0.98 ? 0.98 / peak : 1; for (let i = 0; i < frames; i++) { master.left[i] = Math.tanh(master.left[i]! * normalizeGain); master.right[i] = Math.tanh(master.right[i]! * normalizeGain); }
  const wav = writeWav(master.left, master.right, sampleRate); return { wav, wavHash: semanticHash([...wav]), planRoot: snapshot.audioPlanRoot, diagnostics: { sampleRate, frames, scheduledVoices: snapshot.audioEvents.reduce((n, e) => n + ((config.audioCues ?? []).find(c => c.id === e.cueId)?.voices.length ?? 0), 0), renderedVoices: schedule.voices.length, droppedVoices: schedule.dropped, peakBeforeNormalize: peak, normalizeGain, buses: byId.size } };
}
