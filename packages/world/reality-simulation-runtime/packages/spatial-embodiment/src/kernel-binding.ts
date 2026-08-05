import { deepClone, semanticHash, type VSRValue } from '../../spec/src/index.js';
import {
  SPATIAL_EMBODIMENT_FORMAT,
  type IntVector3,
  type SpatialBodyKind,
  type SpatialEmbodimentWorldConfig,
  type SpatialShape
} from './index.js';

export const KERNEL_RSR_BINDING_FORMAT = 'rncs.kernel-rsr-binding.v0.1' as const;

export interface KernelStateRow {
  entity_id: string;
  tags?: string[];
  fragments: Record<string, Record<string, VSRValue>>;
  composition?: Record<string, VSRValue>;
  entity_root: string;
}

export interface KernelStateBatch {
  format: 'rncs.entity-state-batch.v0.1';
  version: string;
  world_id: string;
  generation: number;
  generation_root: string;
  tick: number;
  state_root: string;
  batch_root: string;
  rows: KernelStateRow[];
}

export interface KernelSpatialBodyFields {
  kind: string;
  position: string;
  rotation?: string;
  velocity?: string;
  angular_velocity?: string;
  tags?: string;
  enabled?: string;
}

export interface KernelSpatialFixtureFields {
  shape: string;
  local_position?: string;
  sensor?: string;
  material_id?: string;
  body_zone?: string;
  tags?: string;
}

export interface KernelSpatialBindingOptions {
  world_id?: string;
  body_fragment_id?: string;
  fixture_fragment_id?: string;
  body_fields?: Partial<KernelSpatialBodyFields>;
  fixture_fields?: Partial<KernelSpatialFixtureFields>;
  step_hz?: number;
  floor_y?: number;
  gravity?: IntVector3;
  velocity_iterations?: number;
  position_iterations?: number;
  max_substeps?: number;
}

export interface KernelSpatialEntityBinding {
  entity_id: string;
  entity_root: string;
  body_id: string;
  fixture_id: string;
  body_fragment_id: string;
  fixture_fragment_id: string;
}

export interface KernelSpatialMaterialization {
  format: typeof KERNEL_RSR_BINDING_FORMAT;
  version: '0.1.0';
  source: {
    world_id: string;
    generation: number;
    generation_root: string;
    tick: number;
    state_root: string;
    batch_root: string;
  };
  entity_bindings: KernelSpatialEntityBinding[];
  config: SpatialEmbodimentWorldConfig;
  binding_root: string;
}

const HEX64 = /^[0-9a-f]{64}$/;
const BODY_KINDS = new Set<SpatialBodyKind>(['static', 'dynamic', 'kinematic']);
const SHAPE_TYPES = new Set<SpatialShape['type']>(['sphere', 'box', 'capsule', 'convex']);

function fail(condition: unknown, code: string, detail = ''): asserts condition {
  if (!condition) throw new Error(`${code}${detail ? `:${detail}` : ''}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  fail(value && typeof value === 'object' && !Array.isArray(value), 'KERNEL_BINDING_OBJECT_REQUIRED', path);
  return value as Record<string, unknown>;
}

function integer(value: unknown, path: string): number {
  fail(Number.isSafeInteger(value), 'KERNEL_BINDING_INTEGER_REQUIRED', path);
  return value as number;
}

function text(value: unknown, path: string): string {
  fail(typeof value === 'string' && value.length > 0, 'KERNEL_BINDING_TEXT_REQUIRED', path);
  return value;
}

function booleanValue(value: unknown, path: string): boolean {
  fail(typeof value === 'boolean', 'KERNEL_BINDING_BOOLEAN_REQUIRED', path);
  return value;
}

function vector(value: unknown, path: string): IntVector3 {
  const item = record(value, path);
  return { x: integer(item.x, `${path}.x`), y: integer(item.y, `${path}.y`), z: integer(item.z, `${path}.z`) };
}

function optionalVector(fragment: Record<string, VSRValue>, field: string | undefined, fallback: IntVector3, path: string): IntVector3 {
  return field && fragment[field] !== undefined ? vector(fragment[field], `${path}.${field}`) : { ...fallback };
}

function stringList(value: unknown, path: string): string[] {
  fail(Array.isArray(value), 'KERNEL_BINDING_STRING_LIST_REQUIRED', path);
  return [...new Set(value.map((item, index) => text(item, `${path}[${index}]`)))].sort();
}

function optionalStringList(fragment: Record<string, VSRValue>, field: string | undefined, path: string): string[] {
  return field && fragment[field] !== undefined ? stringList(fragment[field], `${path}.${field}`) : [];
}

function shape(value: unknown, path: string): SpatialShape {
  const item = record(value, path);
  const type = text(item.type, `${path}.type`) as SpatialShape['type'];
  fail(SHAPE_TYPES.has(type), 'KERNEL_BINDING_SHAPE_TYPE_INVALID', `${path}.type`);
  if (type === 'sphere') {
    const radius = integer(item.radius, `${path}.radius`);
    fail(radius > 0, 'KERNEL_BINDING_SHAPE_DIMENSION_INVALID', `${path}.radius`);
    return { type, radius };
  }
  if (type === 'box') {
    const halfExtents = vector(item.halfExtents ?? item.half_extents, `${path}.halfExtents`);
    fail(halfExtents.x > 0 && halfExtents.y > 0 && halfExtents.z > 0, 'KERNEL_BINDING_SHAPE_DIMENSION_INVALID', path);
    return { type, halfExtents };
  }
  if (type === 'capsule') {
    const radius = integer(item.radius, `${path}.radius`), halfHeight = integer(item.halfHeight ?? item.half_height, `${path}.halfHeight`);
    fail(radius > 0 && halfHeight > 0, 'KERNEL_BINDING_SHAPE_DIMENSION_INVALID', path);
    return { type, radius, halfHeight };
  }
  const verticesValue = item.vertices;
  fail(Array.isArray(verticesValue) && verticesValue.length >= 4, 'KERNEL_BINDING_CONVEX_VERTICES_INVALID', path);
  const vertices = verticesValue.map((vertex, index) => vector(vertex, `${path}.vertices[${index}]`));
  const indicesValue = item.indices;
  fail(Array.isArray(indicesValue) && indicesValue.length >= 12 && indicesValue.length % 3 === 0, 'KERNEL_BINDING_CONVEX_INDICES_INVALID', path);
  const indices = indicesValue.map((index, offset) => integer(index, `${path}.indices[${offset}]`));
  fail(indices.every(index => index >= 0 && index < vertices.length), 'KERNEL_BINDING_CONVEX_INDEX_OUT_OF_RANGE', path);
  return { type, vertices, indices };
}

function fragment(row: KernelStateRow, fragmentId: string, path: string): Record<string, VSRValue> {
  const value = row.fragments?.[fragmentId];
  fail(value && typeof value === 'object' && !Array.isArray(value), 'KERNEL_BINDING_FRAGMENT_REQUIRED', `${path}.${fragmentId}`);
  return value;
}

function uniqueSorted(values: string[]): string[] { return [...new Set(values)].sort(); }

function materializeBody(
  row: KernelStateRow,
  bodyFragment: Record<string, VSRValue>,
  fixtureFragment: Record<string, VSRValue>,
  bodyFields: KernelSpatialBodyFields,
  fixtureFields: KernelSpatialFixtureFields,
  source: KernelSpatialMaterialization['source']
) {
  const bodyId = row.entity_id;
  const fixtureId = `fixture:${bodyId}`;
  const kind = text(bodyFragment[bodyFields.kind], `entity:${bodyId}.${bodyFields.kind}`) as SpatialBodyKind;
  fail(BODY_KINDS.has(kind), 'KERNEL_BINDING_BODY_KIND_INVALID', `${bodyId}.${bodyFields.kind}`);
  const position = vector(bodyFragment[bodyFields.position], `entity:${bodyId}.${bodyFields.position}`);
  const fixtureShape = shape(fixtureFragment[fixtureFields.shape], `entity:${bodyId}.${fixtureFields.shape}`);
  const bodyTags = optionalStringList(bodyFragment, bodyFields.tags, `entity:${bodyId}`);
  const rowTags = Array.isArray(row.tags) ? stringList(row.tags, `entity:${bodyId}.tags`) : [];
  const fixtureTags = optionalStringList(fixtureFragment, fixtureFields.tags, `entity:${bodyId}`);
  const kernelTags = [`kernel-entity:${bodyId}`];
  const fixture = {
    id: fixtureId,
    shape: fixtureShape,
    localPosition: optionalVector(fixtureFragment, fixtureFields.local_position, { x: 0, y: 0, z: 0 }, `entity:${bodyId}`),
    sensor: fixtureFields.sensor && fixtureFragment[fixtureFields.sensor] !== undefined ? booleanValue(fixtureFragment[fixtureFields.sensor], `entity:${bodyId}.${fixtureFields.sensor}`) : false,
    ...(fixtureFields.material_id && fixtureFragment[fixtureFields.material_id] !== undefined ? { materialId: text(fixtureFragment[fixtureFields.material_id], `entity:${bodyId}.${fixtureFields.material_id}`) } : {}),
    ...(fixtureFields.body_zone && fixtureFragment[fixtureFields.body_zone] !== undefined ? { bodyZone: text(fixtureFragment[fixtureFields.body_zone], `entity:${bodyId}.${fixtureFields.body_zone}`) } : {}),
    tags: uniqueSorted([...kernelTags, ...rowTags, ...fixtureTags]),
    data: { kernel_entity_id: bodyId, kernel_entity_root: row.entity_root, kernel_state_root: source.state_root }
  };
  return {
    id: bodyId,
    kind,
    position,
    rotationDeg: optionalVector(bodyFragment, bodyFields.rotation, { x: 0, y: 0, z: 0 }, `entity:${bodyId}`),
    velocity: optionalVector(bodyFragment, bodyFields.velocity, { x: 0, y: 0, z: 0 }, `entity:${bodyId}`),
    angularVelocityDeg: optionalVector(bodyFragment, bodyFields.angular_velocity, { x: 0, y: 0, z: 0 }, `entity:${bodyId}`),
    fixtures: [fixture],
    enabled: bodyFields.enabled && bodyFragment[bodyFields.enabled] !== undefined ? booleanValue(bodyFragment[bodyFields.enabled], `entity:${bodyId}.${bodyFields.enabled}`) : true,
    tags: uniqueSorted([...kernelTags, ...rowTags, ...bodyTags]),
    data: { kernel_entity_id: bodyId, kernel_entity_root: row.entity_root, kernel_state_root: source.state_root }
  };
}

export function materializeKernelStateBatch(batch: KernelStateBatch, options: KernelSpatialBindingOptions = {}): KernelSpatialMaterialization {
  fail(batch?.format === 'rncs.entity-state-batch.v0.1', 'KERNEL_BINDING_BATCH_FORMAT_INVALID');
  fail(typeof batch.version === 'string' && batch.version.length > 0, 'KERNEL_BINDING_BATCH_VERSION_INVALID');
  fail(typeof batch.world_id === 'string' && batch.world_id.length > 0, 'KERNEL_BINDING_WORLD_ID_INVALID');
  fail(Number.isSafeInteger(batch.generation) && batch.generation >= 0, 'KERNEL_BINDING_GENERATION_INVALID');
  fail(HEX64.test(batch.generation_root), 'KERNEL_BINDING_GENERATION_ROOT_INVALID');
  fail(Number.isSafeInteger(batch.tick) && batch.tick >= 0, 'KERNEL_BINDING_TICK_INVALID');
  fail(HEX64.test(batch.state_root), 'KERNEL_BINDING_STATE_ROOT_INVALID');
  fail(HEX64.test(batch.batch_root), 'KERNEL_BINDING_BATCH_ROOT_INVALID');
  fail(Array.isArray(batch.rows), 'KERNEL_BINDING_ROWS_INVALID');
  const source = { world_id: options.world_id ?? batch.world_id, generation: batch.generation, generation_root: batch.generation_root, tick: batch.tick, state_root: batch.state_root, batch_root: batch.batch_root };
  const bodyFragmentId = options.body_fragment_id ?? 'spatial.body';
  const fixtureFragmentId = options.fixture_fragment_id ?? 'spatial.fixture';
  const bodyFields: KernelSpatialBodyFields = { kind: 'kind', position: 'position', rotation: 'rotation', velocity: 'velocity', angular_velocity: 'angular_velocity', tags: 'tags', enabled: 'enabled', ...options.body_fields };
  const fixtureFields: KernelSpatialFixtureFields = { shape: 'shape', local_position: 'local_position', sensor: 'sensor', material_id: 'material_id', body_zone: 'body_zone', tags: 'tags', ...options.fixture_fields };
  const rows = [...batch.rows].sort((a, b) => a.entity_id.localeCompare(b.entity_id));
  const seen = new Set<string>();
  const entityBindings: KernelSpatialEntityBinding[] = [];
  const bodies = rows.map(row => {
    const entityId = text(row.entity_id, 'row.entity_id');
    fail(!seen.has(entityId), 'KERNEL_BINDING_ENTITY_DUPLICATE', entityId);
    seen.add(entityId);
    fail(HEX64.test(row.entity_root), 'KERNEL_BINDING_ENTITY_ROOT_INVALID', entityId);
    const body = materializeBody(row, fragment(row, bodyFragmentId, `entity:${entityId}`), fragment(row, fixtureFragmentId, `entity:${entityId}`), bodyFields, fixtureFields, source);
    entityBindings.push({ entity_id: entityId, entity_root: row.entity_root, body_id: body.id, fixture_id: body.fixtures[0]!.id, body_fragment_id: bodyFragmentId, fixture_fragment_id: fixtureFragmentId });
    return body;
  });
  const config: SpatialEmbodimentWorldConfig = {
    format: SPATIAL_EMBODIMENT_FORMAT,
    worldId: source.world_id,
    stepHz: options.step_hz ?? 60,
    floorY: options.floor_y ?? 0,
    gravity: options.gravity ?? { x: 0, y: -9_810, z: 0 },
    velocityIterations: options.velocity_iterations ?? 6,
    positionIterations: options.position_iterations ?? 4,
    maxSubsteps: options.max_substeps ?? 16,
    bodies,
    reality: { generation: source.generation, realityRoot: source.state_root, evidenceRoot: source.batch_root }
  };
  const base = { format: KERNEL_RSR_BINDING_FORMAT, version: '0.1.0' as const, source, entity_bindings: entityBindings, config: deepClone(config) };
  return { ...base, binding_root: semanticHash(base) };
}
