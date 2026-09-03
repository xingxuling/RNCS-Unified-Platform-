import { cryptographicHash } from '../../spec/src/index.js';
import type { Vec3, VSRSpatialMaterial, VSRSpatialMesh, VSRSpatialNode, VSRSpatialScene3D } from './index.js';

export const VSR_SPATIAL_PARTICLE_SCENE_FORMAT = 'vsr.spatial-particle-scene.v0.1' as const;
export const VSR_SPATIAL_PARTICLE_SCENE_VERSION = '0.1.0' as const;
export const VSR_SPATIAL_PARTICLE_INSTANCE_LIMIT = 8192;
type NumberRange = [number, number];
type NumericCurve = Array<[number, number]>;
type ColorCurve = Array<[number, string]>;

export interface VSRSpatialParticleEmitterInput {
  format?: 'vsr.particle-emitter.v0.1';
  version?: '0.1.0';
  componentId: string;
  presetId?: string;
  emitterRoot?: string;
  candidateOnly?: true;
  authoritative?: false;
  emitter: {
    shape: string;
    burst: number;
    rate: number;
    lifetime: NumberRange;
    speed: NumberRange;
    angle_degrees: NumberRange;
    gravity: NumberRange;
    drag: number;
  };
  curves: {size: NumericCurve; opacity: NumericCurve; color: ColorCurve};
  budget: {max_particles: number; quality: string};
}

export interface VSRSpatialParticleRecord {
  id: string;
  spawnTime: number;
  age: number;
  lifetime: number;
  position: Vec3;
  velocity: Vec3;
  size: number;
  opacity: number;
  color: [number, number, number, number];
}

export interface VSRSpatialParticleLoweringOptions {
  baseScene?: VSRSpatialScene3D;
  sceneId?: string;
  title?: string;
  timeSeconds?: number;
  origin?: Vec3;
  maxParticles?: number;
  sizeScale?: number;
  seed?: string;
  idPrefix?: string;
}

export interface VSRSpatialParticleSceneResult {
  format: typeof VSR_SPATIAL_PARTICLE_SCENE_FORMAT;
  version: typeof VSR_SPATIAL_PARTICLE_SCENE_VERSION;
  status: 'EXECUTED';
  componentId: string;
  sceneId: string;
  timeSeconds: number;
  origin: Vec3;
  emittedCount: number;
  aliveCount: number;
  renderableCount: number;
  maxParticles: number;
  particles: VSRSpatialParticleRecord[];
  sourceEmitterRoot?: string;
  particleRoot: string;
  scene: VSRSpatialScene3D;
  sceneRoot: string;
  candidateOnly: true;
  authoritative: false;
  root: string;
}

const EPS = 1e-9;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isRoot = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);

function range(value: unknown, name: string, min = -Infinity): NumberRange {
  if (!Array.isArray(value) || value.length !== 2 || value.some(component => typeof component !== 'number' || !Number.isFinite(component) || component < min)) throw new Error(`VSR spatial particle ${name} must be a finite ordered range.`);
  const result = [value[0] as number, value[1] as number] as NumberRange;
  if (result[1] < result[0]) throw new Error(`VSR spatial particle ${name} must be ordered.`);
  return result;
}

function number(value: unknown, name: string, min = -Infinity, max = Infinity): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`VSR spatial particle ${name} is outside its finite bounds.`);
  return value;
}

function hexColor(value: unknown): [number, number, number, number] {
  if (typeof value !== 'string') throw new Error('VSR spatial particle color curve values must be hex colors.');
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(value.trim());
  if (!match) throw new Error(`VSR spatial particle color ${value} is invalid.`);
  const raw = match[1]!;
  return [parseInt(raw.slice(0, 2), 16) / 255, parseInt(raw.slice(2, 4), 16) / 255, parseInt(raw.slice(4, 6), 16) / 255, match[2] ? parseInt(match[2], 16) / 255 : 1];
}

function curve(value: unknown, name: string): NumericCurve;
function curve(value: unknown, name: string, color: true): ColorCurve;
function curve(value: unknown, name: string, color = false): NumericCurve | ColorCurve {
  if (!Array.isArray(value) || value.length < 2) throw new Error(`VSR spatial particle ${name} needs at least two points.`);
  let previous = -Infinity;
  const points: Array<[number, number] | [number, string]> = value.map((point, index) => {
    if (!Array.isArray(point) || point.length !== 2) throw new Error(`VSR spatial particle ${name}[${index}] is not a time/value pair.`);
    const time = number(point[0], `${name}[${index}].time`, 0, 1);
    if (time < previous) throw new Error(`VSR spatial particle ${name} times must be ordered.`);
    previous = time;
    if (color) {
      hexColor(point[1]);
      return [time, String(point[1])] as [number, string];
    }
    return [time, number(point[1], `${name}[${index}].value`, 0)] as [number, number];
  });
  return color ? points as ColorCurve : points as NumericCurve;
}

function normalizeInput(input: VSRSpatialParticleEmitterInput): VSRSpatialParticleEmitterInput {
  if (!input || !nonEmpty(input.componentId)) throw new Error('VSR spatial particle componentId is required.');
  if (input.format !== undefined && input.format !== 'vsr.particle-emitter.v0.1') throw new Error('VSR spatial particle emitter format is unsupported.');
  if (input.version !== undefined && input.version !== '0.1.0') throw new Error('VSR spatial particle emitter version is unsupported.');
  if (input.candidateOnly !== undefined && input.candidateOnly !== true) throw new Error('VSR spatial particle emitter cannot clear candidate_only.');
  if (input.authoritative !== undefined && input.authoritative !== false) throw new Error('VSR spatial particle emitter cannot become authoritative.');
  if (input.emitterRoot !== undefined && !isRoot(input.emitterRoot)) throw new Error('VSR spatial particle emitterRoot is invalid.');
  if (!input.emitter || typeof input.emitter !== 'object' || !nonEmpty(input.emitter.shape)) throw new Error('VSR spatial particle emitter settings are required.');
  const shape = input.emitter.shape.trim().toLowerCase().replace(/_/g, '-');
  if (!['point', 'cone', 'sphere', 'circle', 'box'].includes(shape)) throw new Error(`VSR spatial particle shape ${shape} is not supported by the bounded spatial lowerer.`);
  const burst = number(input.emitter.burst, 'emitter.burst', 0, 1000000);
  if (!Number.isSafeInteger(burst)) throw new Error('VSR spatial particle emitter.burst must be an integer.');
  const budget = number(input.budget?.max_particles, 'budget.max_particles', 1, 1000000);
  if (!Number.isSafeInteger(budget)) throw new Error('VSR spatial particle budget.max_particles must be an integer.');
  const curves = input.curves;
  if (!curves || typeof curves !== 'object') throw new Error('VSR spatial particle curves are required.');
  return {
    ...input,
    emitter: {
      ...input.emitter,
      shape,
      burst,
      rate: number(input.emitter.rate, 'emitter.rate', 0),
      lifetime: range(input.emitter.lifetime, 'emitter.lifetime', 0),
      speed: range(input.emitter.speed, 'emitter.speed', 0),
      angle_degrees: range(input.emitter.angle_degrees, 'emitter.angle_degrees'),
      gravity: range(input.emitter.gravity, 'emitter.gravity', 0),
      drag: number(input.emitter.drag, 'emitter.drag', 0, 1)
    },
    curves: {
      size: curve(curves.size, 'curves.size'),
      opacity: curve(curves.opacity, 'curves.opacity'),
      color: curve(curves.color, 'curves.color', true)
    },
    budget: {...input.budget, max_particles: budget}
  };
}

function seedOf(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
}

function random01(seed: number, index: number, salt: number): number {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b9) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

function sampleNumeric(points: NumericCurve, time: number): number {
  if (time <= points[0]![0]) return points[0]![1];
  for (let index = 1; index < points.length; index++) {
    const left = points[index - 1]!;
    const right = points[index]!;
    if (time <= right[0]) return lerp(left[1], right[1], (time - left[0]) / Math.max(EPS, right[0] - left[0]));
  }
  return points.at(-1)![1];
}

function sampleColor(points: ColorCurve, time: number): [number, number, number, number] {
  if (time <= points[0]![0]) return hexColor(points[0]![1]);
  for (let index = 1; index < points.length; index++) {
    const left = points[index - 1]!;
    const right = points[index]!;
    if (time <= right[0]) {
      const alpha = (time - left[0]) / Math.max(EPS, right[0] - left[0]);
      const a = hexColor(left[1]);
      const b = hexColor(right[1]);
      return [lerp(a[0], b[0], alpha), lerp(a[1], b[1], alpha), lerp(a[2], b[2], alpha), lerp(a[3], b[3], alpha)];
    }
  }
  return hexColor(points.at(-1)![1]);
}

function particleOffset(shape: string, index: number, seed: number): Vec3 {
  const a = random01(seed, index, 0);
  const b = random01(seed, index, 1);
  const c = random01(seed, index, 2);
  if (shape === 'sphere') {
    const z = 1 - 2 * a;
    const radius = 0.08 * Math.cbrt(c);
    const ring = Math.sqrt(Math.max(0, 1 - z * z));
    const phi = b * Math.PI * 2;
    return [radius * ring * Math.cos(phi), radius * z, radius * ring * Math.sin(phi)];
  }
  if (shape === 'circle') {
    const radius = 0.08 * Math.sqrt(a);
    const phi = b * Math.PI * 2;
    return [radius * Math.cos(phi), 0, radius * Math.sin(phi)];
  }
  if (shape === 'box') return [(a - 0.5) * 0.16, (b - 0.5) * 0.16, (c - 0.5) * 0.16];
  if (shape === 'point') return [0, 0, 0];
  const radius = 0.04 * Math.sqrt(a);
  const phi = b * Math.PI * 2;
  return [radius * Math.cos(phi), 0, radius * Math.sin(phi)];
}

function particleDirection(shape: string, index: number, seed: number, angles: NumberRange, offset: Vec3): Vec3 {
  if (shape === 'sphere' && Math.hypot(offset[0], offset[1], offset[2]) > EPS) {
    const length = Math.hypot(offset[0], offset[1], offset[2]);
    return [offset[0] / length, offset[1] / length, offset[2] / length];
  }
  const angle = (lerp(angles[0], angles[1], random01(seed, index, 3)) * Math.PI) / 180;
  const azimuth = random01(seed, index, 4) * Math.PI * 2;
  return [Math.sin(angle) * Math.cos(azimuth), Math.cos(angle), Math.sin(angle) * Math.sin(azimuth)];
}

function colorHex(color: [number, number, number, number]): string {
  return `#${color.slice(0, 3).map(channel => Math.round(clamp(channel, 0, 1) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function crossBillboardMesh(id: string): VSRSpatialMesh {
  return {
    id,
    positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, 0, -1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0],
    uvs: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1],
    indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7],
    topology: 'triangle-list'
  };
}

function safePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.:-]+/g, '-').slice(0, 96) || 'particle';
}

function particleBase(input: VSRSpatialParticleEmitterInput, options: VSRSpatialParticleLoweringOptions): {normalized: VSRSpatialParticleEmitterInput; timeSeconds: number; origin: Vec3; maxParticles: number; sizeScale: number; seed: number; emittedCount: number} {
  const normalized = normalizeInput(input);
  const timeSeconds = number(options.timeSeconds ?? 0, 'timeSeconds', 0, 1000000);
  const origin = options.origin ?? [0, 0, 0];
  if (!Array.isArray(origin) || origin.length !== 3 || origin.some(component => typeof component !== 'number' || !Number.isFinite(component))) throw new Error('VSR spatial particle origin must be a finite XYZ triple.');
  const sizeScale = number(options.sizeScale ?? 0.02, 'sizeScale', EPS, 1000);
  const maxParticles = Math.min(VSR_SPATIAL_PARTICLE_INSTANCE_LIMIT, normalized.budget.max_particles, Math.max(1, Math.floor(number(options.maxParticles ?? normalized.budget.max_particles, 'maxParticles', 1, VSR_SPATIAL_PARTICLE_INSTANCE_LIMIT))));
  const burst = Math.min(maxParticles, normalized.emitter.burst);
  const scheduledRate = normalized.emitter.rate > 0 ? Math.min(maxParticles, Math.floor(Math.min(timeSeconds, maxParticles / normalized.emitter.rate) * normalized.emitter.rate)) : 0;
  return {normalized, timeSeconds, origin: [...origin] as Vec3, maxParticles, sizeScale, seed: seedOf(`${options.seed ?? ''}:${normalized.componentId}:${normalized.presetId ?? ''}`), emittedCount: Math.min(maxParticles, burst + scheduledRate)};
}

function defaultScene(sceneId: string, title: string): VSRSpatialScene3D {
  return {
    format: 'vsr.spatial-scene.v0.4',
    sceneId,
    title,
    background: '#020611',
    environment: {diffuseColor: '#101d35', specularColor: '#ffffff', intensity: 0.5},
    activeCameraId: 'camera:particle:main',
    meshes: [],
    materials: [],
    nodes: [],
    cameras: [{id: 'camera:particle:main', projection: 'perspective', fovYDeg: 55, near: 0.01, far: 1000, transform: {translation: [0, 1.5, 6]}}],
    lights: [{id: 'light:particle:ambient', kind: 'ambient', color: '#ffffff', intensity: 0.2}],
    reality: {worldId: `world:${sceneId}`, generation: 0, realityRoot: cryptographicHash({sceneId, purpose: 'spatial-particle-candidate'})}
  };
}

export function lowerVsrParticleEmitterToSpatialScene(input: VSRSpatialParticleEmitterInput, options: VSRSpatialParticleLoweringOptions = {}): VSRSpatialParticleSceneResult {
  const base = particleBase(input, options);
  const {normalized, timeSeconds, origin, maxParticles, sizeScale, seed, emittedCount} = base;
  const sceneId = options.sceneId?.trim() || options.baseScene?.sceneId || `particle:${normalized.componentId}`;
  const namespace = safePart(options.idPrefix?.trim() || `particle:${normalized.componentId}:${sceneId}`);
  const meshId = `${namespace}:billboard-cross`;
  const baseScene = options.baseScene ? {...options.baseScene, meshes: [...options.baseScene.meshes], materials: [...options.baseScene.materials], nodes: [...options.baseScene.nodes]} : defaultScene(sceneId, options.title?.trim() || `VSR spatial particles: ${normalized.componentId}`);
  const existingMeshIds = new Set(baseScene.meshes.map(mesh => mesh.id));
  if (existingMeshIds.has(meshId)) throw new Error(`VSR spatial particle mesh id ${meshId} already exists in the base scene.`);
  const particles: VSRSpatialParticleRecord[] = [];
  const materials: VSRSpatialMaterial[] = [];
  const nodes: VSRSpatialNode[] = [];
  for (let index = 0; index < emittedCount; index++) {
    const spawnTime = index < normalized.emitter.burst ? 0 : (index - normalized.emitter.burst) / Math.max(EPS, normalized.emitter.rate);
    const age = timeSeconds - spawnTime;
    const lifetime = lerp(normalized.emitter.lifetime[0], normalized.emitter.lifetime[1], random01(seed, index, 5));
    if (age < 0 || age >= lifetime) continue;
    const offset = particleOffset(normalized.emitter.shape, index, seed);
    const direction = particleDirection(normalized.emitter.shape, index, seed, normalized.emitter.angle_degrees, offset);
    const speed = lerp(normalized.emitter.speed[0], normalized.emitter.speed[1], random01(seed, index, 6));
    const gravity = lerp(normalized.emitter.gravity[0], normalized.emitter.gravity[1], random01(seed, index, 7));
    const dragFactor = Math.exp(-normalized.emitter.drag * age);
    const travel = normalized.emitter.drag > EPS ? (1 - dragFactor) / normalized.emitter.drag : age;
    const velocity: Vec3 = [direction[0] * speed * dragFactor, direction[1] * speed * dragFactor - gravity * age, direction[2] * speed * dragFactor];
    const position: Vec3 = [origin[0] + offset[0] + direction[0] * speed * travel, origin[1] + offset[1] + direction[1] * speed * travel - gravity * age * age * 0.5, origin[2] + offset[2] + direction[2] * speed * travel];
    const normalizedAge = clamp(age / Math.max(EPS, lifetime), 0, 1);
    const size = Math.max(EPS, sampleNumeric(normalized.curves.size, normalizedAge) * sizeScale);
    const opacity = clamp(sampleNumeric(normalized.curves.opacity, normalizedAge), 0, 1);
    const color = sampleColor(normalized.curves.color, normalizedAge);
    const id = `${namespace}:particle:${index}`;
    particles.push({id, spawnTime, age, lifetime, position, velocity, size, opacity, color});
    const materialId = `${id}:material`;
    materials.push({id: materialId, baseColor: colorHex(color), emissive: colorHex(color), emissiveStrength: 1.8, roughness: 1, doubleSided: true, opacity: Math.max(EPS, opacity), alphaMode: 'BLEND', alphaCutoff: 0.01, temporalReactive: 1});
    nodes.push({id, meshId, materialId, transform: {translation: position, scale: [size, size, size]}, visible: opacity > EPS, castShadow: false, receiveShadow: false, tags: ['particle', `particle-component:${normalized.componentId}`, `particle-shape:${normalized.emitter.shape}`]});
  }
  const scene: VSRSpatialScene3D = {
    ...baseScene,
    sceneId,
    title: options.title?.trim() || baseScene.title,
    meshes: particles.length ? [...baseScene.meshes, crossBillboardMesh(meshId)] : baseScene.meshes,
    materials: [...baseScene.materials, ...materials],
    nodes: [...baseScene.nodes, ...nodes],
    ...(baseScene.streaming ? {streaming: {...baseScene.streaming, persistentNodeIds: [...new Set([...(baseScene.streaming.persistentNodeIds ?? []), ...nodes.map(node => node.id)])]}} : {})
  };
  const particlePayload = {format: VSR_SPATIAL_PARTICLE_SCENE_FORMAT, version: VSR_SPATIAL_PARTICLE_SCENE_VERSION, componentId: normalized.componentId, sceneId, timeSeconds, origin, emittedCount, maxParticles, particles};
  const particleRoot = cryptographicHash(particlePayload);
  const sceneRoot = cryptographicHash(scene);
  const resultBase = {format: VSR_SPATIAL_PARTICLE_SCENE_FORMAT, version: VSR_SPATIAL_PARTICLE_SCENE_VERSION, status: 'EXECUTED' as const, componentId: normalized.componentId, sceneId, timeSeconds, origin, emittedCount, aliveCount: particles.length, renderableCount: nodes.filter(node => node.visible !== false).length, maxParticles, particles, ...(normalized.emitterRoot ? {sourceEmitterRoot: normalized.emitterRoot} : {}), particleRoot, scene, sceneRoot, candidateOnly: true as const, authoritative: false as const};
  return {...resultBase, root: cryptographicHash(resultBase)};
}

export function verifyVsrSpatialParticleScene(result: VSRSpatialParticleSceneResult): boolean {
  try {
    if (!result || result.format !== VSR_SPATIAL_PARTICLE_SCENE_FORMAT || result.version !== VSR_SPATIAL_PARTICLE_SCENE_VERSION || result.status !== 'EXECUTED' || !nonEmpty(result.componentId) || !nonEmpty(result.sceneId) || !Number.isFinite(result.timeSeconds) || result.timeSeconds < 0 || !Array.isArray(result.particles) || result.aliveCount !== result.particles.length || result.renderableCount < 0 || result.renderableCount > result.aliveCount || result.candidateOnly !== true || result.authoritative !== false || !isRoot(result.particleRoot) || !isRoot(result.sceneRoot) || !isRoot(result.root)) return false;
    const particlePayload = {format: VSR_SPATIAL_PARTICLE_SCENE_FORMAT, version: VSR_SPATIAL_PARTICLE_SCENE_VERSION, componentId: result.componentId, sceneId: result.sceneId, timeSeconds: result.timeSeconds, origin: result.origin, emittedCount: result.emittedCount, maxParticles: result.maxParticles, particles: result.particles};
    if (cryptographicHash(particlePayload) !== result.particleRoot || cryptographicHash(result.scene) !== result.sceneRoot) return false;
    const {root: _root, ...base} = result;
    return cryptographicHash(base) === result.root;
  } catch {
    return false;
  }
}
