import { semanticHash, type VSRValue } from '../../spec/src/index.js';
import {
  SPATIAL_EMBODIMENT_FORMAT,
  type SpatialBodyKind,
  type SpatialEmbodimentWorldConfig,
  type SpatialListenerSpec
} from './index.js';

export const RSR_RAGF_EMBODIMENT_MATERIALIZATION_FORMAT = 'rsr.ragf-embodiment-materialization.v0.1' as const;

export interface RagfEmbodimentProfile {
  format: 'ragf.rsr-embodiment-profile.v0.4';
  version: '0.4.0';
  asset_id: string;
  variant: string;
  units?: { distance?: 'meters'; mass?: 'kilograms'; fixed_point_scale?: number };
  body: {
    kind?: string;
    runtime_kind?: SpatialBodyKind;
    shape?: string;
    shape_spec?: { type: 'capsule'; radius: number; height: number; halfHeight?: number };
    radius: number;
    height: number;
    mass: number;
    center?: [number, number, number];
    position?: [number, number, number];
    material_id?: string;
  };
  movement: { max_speed: number; acceleration: number; jump_speed: number; ground_probe?: number; max_slope_deg?: number; step_height?: number; ground_snap_distance?: number; skin_width?: number };
  collision?: { source_root?: string | null; layer?: string; mask?: string[] };
  skeleton?: { profile?: string; bones?: string[]; sockets?: Array<Record<string, VSRValue>> };
  audio_listener?: { enabled?: boolean };
  runtime?: { body_id?: string; character_id?: string; tags?: string[] };
  compatibility: { target_format: 'rsr.spatial-embodiment-world.v0.6'; minimum_runtime?: string };
  profile_root: string;
}

export interface RagfEmbodimentMaterializationOptions {
  worldId?: string;
  generation?: number;
  stepHz?: number;
  floorY?: number;
  gravity?: { x: number; y: number; z: number };
}

export interface RagfEmbodimentMaterialization {
  format: typeof RSR_RAGF_EMBODIMENT_MATERIALIZATION_FORMAT;
  version: '0.1.0';
  source: { assetId: string; variant: string; profileRoot: string; collisionRoot?: string | null };
  bodyId: string;
  characterId: string;
  config: SpatialEmbodimentWorldConfig;
  bindingRoot: string;
}

function fail(condition: unknown, code: string): asserts condition {
  if (!condition) throw new Error(code);
}

function finitePositive(value: unknown, code: string): number {
  fail(typeof value === 'number' && Number.isFinite(value) && value > 0, code);
  return value;
}

function finiteNonNegative(value: unknown, code: string): number {
  fail(typeof value === 'number' && Number.isFinite(value) && value >= 0, code);
  return value;
}

function fixed(value: number, scale: number): number {
  const result = Math.round(value * scale);
  fail(Number.isSafeInteger(result), 'RSR_RAGF_FIXED_POINT_OVERFLOW');
  return result;
}

function fixedVector(value: [number, number, number] | undefined, scale: number): { x: number; y: number; z: number } {
  const source = value ?? [0, 0, 0];
  fail(source.length === 3 && source.every(component => typeof component === 'number' && Number.isFinite(component)), 'RSR_RAGF_POSITION_INVALID');
  return { x: fixed(source[0], scale), y: fixed(source[1], scale), z: fixed(source[2], scale) };
}

export function materializeRagfEmbodimentProfile(profile: RagfEmbodimentProfile, options: RagfEmbodimentMaterializationOptions = {}): RagfEmbodimentMaterialization {
  fail(profile?.format === 'ragf.rsr-embodiment-profile.v0.4', 'RSR_RAGF_PROFILE_FORMAT_INVALID');
  fail(profile.version === '0.4.0', 'RSR_RAGF_PROFILE_VERSION_INVALID');
  fail(typeof profile.asset_id === 'string' && profile.asset_id.length > 0, 'RSR_RAGF_ASSET_ID_REQUIRED');
  fail(typeof profile.profile_root === 'string' && /^[a-f0-9]{64}$/i.test(profile.profile_root), 'RSR_RAGF_PROFILE_ROOT_INVALID');
  fail(profile.compatibility?.target_format === SPATIAL_EMBODIMENT_FORMAT, 'RSR_RAGF_TARGET_FORMAT_INVALID');

  const scale = profile.units?.fixed_point_scale ?? 1000;
  fail(Number.isSafeInteger(scale) && scale > 0, 'RSR_RAGF_SCALE_INVALID');
  const radius = finitePositive(profile.body.radius, 'RSR_RAGF_RADIUS_INVALID');
  const height = finitePositive(profile.body.height, 'RSR_RAGF_HEIGHT_INVALID');
  const mass = finitePositive(profile.body.mass, 'RSR_RAGF_MASS_INVALID');
  const halfHeight = profile.body.shape_spec?.halfHeight ?? (height - radius * 2) / 2;
  fail(halfHeight > 0, 'RSR_RAGF_CAPSULE_HEIGHT_INVALID');
  const requestedKind = profile.body.runtime_kind ?? (profile.body.kind === 'static' ? 'static' : 'dynamic');
  fail(requestedKind === 'static' || requestedKind === 'dynamic' || requestedKind === 'kinematic', 'RSR_RAGF_BODY_KIND_INVALID');
  const bodyId = profile.runtime?.body_id ?? `body:${profile.asset_id}`;
  const characterId = profile.runtime?.character_id ?? `character:${profile.asset_id}`;
  const materialId = profile.body.material_id ?? `material:${profile.asset_id}:${profile.variant}`;
  const bodyPosition = fixedVector(profile.body.position ?? profile.body.center, scale);
  const tags = [...new Set(['ragf', `asset:${profile.asset_id}`, `variant:${profile.variant}`, ...(profile.runtime?.tags ?? [])])].sort();
  const fixture = {
    id: `fixture:${profile.asset_id}`,
    shape: { type: 'capsule' as const, radius: fixed(radius, scale), halfHeight: fixed(halfHeight, scale) },
    localPosition: { x: 0, y: 0, z: 0 },
    materialId,
    bodyZone: 'body',
    tags,
    data: { ragf_asset_id: profile.asset_id, ragf_profile_root: profile.profile_root } as Record<string, VSRValue>
  };
  const body = {
    id: bodyId,
    kind: requestedKind,
    position: bodyPosition,
    rotationDeg: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocityDeg: { x: 0, y: 0, z: 0 },
    fixtures: [fixture],
    massQ: fixed(mass, scale),
    gravityScaleQ: 1_000_000,
    linearDampingQ: 80_000,
    angularDampingQ: 80_000,
    frictionQ: 700_000,
    restitutionQ: 100_000,
    fixedRotation: true,
    allowSleep: false,
    bullet: true,
    tags,
    data: { ragf_asset_id: profile.asset_id, ragf_profile_root: profile.profile_root } as Record<string, VSRValue>
  };
  const movement = profile.movement;
  const characters = requestedKind === 'static' ? [] : [{
    id: characterId,
    bodyId,
    walkSpeed: fixed(finiteNonNegative(movement.max_speed, 'RSR_RAGF_MAX_SPEED_INVALID'), scale),
    acceleration: fixed(finiteNonNegative(movement.acceleration, 'RSR_RAGF_ACCELERATION_INVALID'), scale),
    jumpSpeed: fixed(finiteNonNegative(movement.jump_speed, 'RSR_RAGF_JUMP_SPEED_INVALID'), scale),
    groundProbe: fixed(movement.ground_probe ?? 0.08, scale),
    maxSlopeDeg: movement.max_slope_deg ?? 50,
    stepHeight: fixed(movement.step_height ?? 0.45, scale),
    groundSnapDistance: fixed(movement.ground_snap_distance ?? 0.18, scale),
    skinWidth: fixed(movement.skin_width ?? 0.008, scale),
    leftFootZone: 'foot_l',
    rightFootZone: 'foot_r'
  }];
  const listeners: SpatialListenerSpec[] = profile.audio_listener?.enabled ? [{ id: `listener:${profile.asset_id}`, position: bodyPosition }] : [];
  const config: SpatialEmbodimentWorldConfig = {
    format: SPATIAL_EMBODIMENT_FORMAT,
    worldId: options.worldId ?? `world:${profile.asset_id}`,
    stepHz: options.stepHz ?? 60,
    floorY: options.floorY ?? 0,
    gravity: options.gravity ?? { x: 0, y: -9_810, z: 0 },
    bodies: [body],
    characters,
    listeners,
    materials: [{ id: materialId, densityQ: fixed(mass, scale), frictionQ: 700_000, restitutionQ: 100_000 }],
    reality: { generation: options.generation, realityRoot: profile.profile_root, evidenceRoot: profile.collision?.source_root ?? profile.profile_root }
  };
  const base = {
    format: RSR_RAGF_EMBODIMENT_MATERIALIZATION_FORMAT,
    version: '0.1.0' as const,
    source: { assetId: profile.asset_id, variant: profile.variant, profileRoot: profile.profile_root, collisionRoot: profile.collision?.source_root ?? null },
    bodyId,
    characterId,
    config
  };
  return { ...base, bindingRoot: semanticHash(base) };
}

export function verifyRagfEmbodimentMaterialization(materialization: RagfEmbodimentMaterialization): boolean {
  const { bindingRoot, ...base } = materialization;
  return materialization.format === RSR_RAGF_EMBODIMENT_MATERIALIZATION_FORMAT && semanticHash(base) === bindingRoot;
}
