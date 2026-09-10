import { deepClone, semanticHash, type VSRValue } from '../../spec/src/index.js';
import {
  SPATIAL_EMBODIMENT_FORMAT,
  type IntVector3,
  type SpatialBodyKind,
  type SpatialCharacterSpec,
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
  mass_q?: string;
  rotation?: string;
  velocity?: string;
  angular_velocity?: string;
  tags?: string;
  enabled?: string;
}

export interface KernelSpatialFixtureFields {
  id?: string;
  shape: string;
  local_position?: string;
  sensor?: string;
  material_id?: string;
  body_zone?: string;
  category_bits?: string;
  mask_bits?: string;
  tags?: string;
}

export interface KernelSpatialCharacterFields {
  id: string;
  body_id?: string;
  walk_speed: string;
  acceleration: string;
  air_control_q?: string;
  jump_speed: string;
  ground_probe?: string;
  max_slope_deg?: string;
  footstep_distance?: string;
  left_foot_zone?: string;
  right_foot_zone?: string;
  step_height?: string;
  ground_snap_distance?: string;
  skin_width?: string;
  platform_inheritance_q?: string;
  coyote_ticks?: string;
  jump_buffer_ticks?: string;
}

export interface KernelSpatialBindingOptions {
  world_id?: string;
  body_fragment_id?: string;
  fixture_fragment_id?: string;
  fixtures_fragment_id?: string;
  fixtures_collection_field?: string;
  body_fields?: Partial<KernelSpatialBodyFields>;
  fixture_fields?: Partial<KernelSpatialFixtureFields>;
  character_fragment_id?: string;
  character_fields?: Partial<KernelSpatialCharacterFields>;
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
  fixture_ids?: string[];
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
const SHAPE_TYPES = new Set<SpatialShape['type']>(['sphere', 'box', 'capsule', 'convex', 'heightfield']);

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

function optionalUnsignedInteger(fragment: Record<string, VSRValue>, field: string | undefined, path: string): number | undefined {
  if (!field || fragment[field] === undefined) return undefined;
  const value = integer(fragment[field], `${path}.${field}`);
  fail(value >= 0 && value <= 0xffff_ffff, 'KERNEL_BINDING_UNSIGNED_INTEGER_INVALID', `${path}.${field}`);
  return value;
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
  if (type === 'heightfield') {
    const columns = integer(item.columns, `${path}.columns`), rows = integer(item.rows, `${path}.rows`), sampleSpacing = integer(item.sampleSpacing ?? item.sample_spacing, `${path}.sampleSpacing`), heightsValue = item.heights;
    fail(columns >= 2 && columns <= 4_096 && rows >= 2 && rows <= 4_096 && columns * rows <= 1_000_000 && sampleSpacing > 0, 'KERNEL_BINDING_HEIGHTFIELD_DIMENSION_INVALID', path);
    fail(Array.isArray(heightsValue) && heightsValue.length === columns * rows, 'KERNEL_BINDING_HEIGHTFIELD_SAMPLES_INVALID', path);
    const heights = heightsValue.map((height, index) => integer(height, `${path}.heights[${index}]`));
    return { type, columns, rows, sampleSpacing, heights };
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

function optionalFragment(row: KernelStateRow, fragmentId: string, path: string): Record<string, VSRValue> | null {
  const value = row.fragments?.[fragmentId];
  if (value === undefined) return null;
  fail(value && typeof value === 'object' && !Array.isArray(value), 'KERNEL_BINDING_FRAGMENT_REQUIRED', `${path}.${fragmentId}`);
  return value;
}

function fixtureCollection(
  row: KernelStateRow,
  fragmentId: string,
  collectionField: string,
  path: string,
): Record<string, VSRValue>[] | null {
  const value = row.fragments?.[fragmentId];
  if (value === undefined) return null;
  const collection = record(value, `${path}.${fragmentId}`);
  const items = collection[collectionField];
  fail(Array.isArray(items) && items.length > 0, 'KERNEL_BINDING_FIXTURE_COLLECTION_REQUIRED', `${path}.${fragmentId}.${collectionField}`);
  return items.map((item, index) => record(item, `${path}.${fragmentId}.${collectionField}[${index}]`) as Record<string, VSRValue>);
}

function uniqueSorted(values: string[]): string[] { return [...new Set(values)].sort(); }

function materializeBody(
  row: KernelStateRow,
  bodyFragment: Record<string, VSRValue>,
  fixtureFragments: Record<string, VSRValue>[],
  bodyFields: KernelSpatialBodyFields,
  fixtureFields: KernelSpatialFixtureFields,
  source: KernelSpatialMaterialization['source']
) {
  const bodyId = row.entity_id;
  fail(fixtureFragments.length > 0, 'KERNEL_BINDING_FIXTURE_REQUIRED', `entity:${bodyId}`);
  const kind = text(bodyFragment[bodyFields.kind], `entity:${bodyId}.${bodyFields.kind}`) as SpatialBodyKind;
  fail(BODY_KINDS.has(kind), 'KERNEL_BINDING_BODY_KIND_INVALID', `${bodyId}.${bodyFields.kind}`);
  const position = vector(bodyFragment[bodyFields.position], `entity:${bodyId}.${bodyFields.position}`);
  const massQ = bodyFields.mass_q && bodyFragment[bodyFields.mass_q] !== undefined
    ? integer(bodyFragment[bodyFields.mass_q], `entity:${bodyId}.${bodyFields.mass_q}`)
    : undefined;
  if (massQ !== undefined) fail(massQ > 0, 'KERNEL_BINDING_MASS_INVALID', `${bodyId}.${bodyFields.mass_q}`);
  const bodyTags = optionalStringList(bodyFragment, bodyFields.tags, `entity:${bodyId}`);
  const rowTags = Array.isArray(row.tags) ? stringList(row.tags, `entity:${bodyId}.tags`) : [];
  const kernelTags = [`kernel-entity:${bodyId}`];
  const fixtureIds = new Set<string>();
  const fixtures = fixtureFragments.map((fixtureFragment, index) => {
    const fixtureId = fixtureFields.id && fixtureFragment[fixtureFields.id] !== undefined
      ? text(fixtureFragment[fixtureFields.id], `entity:${bodyId}.${fixtureFields.id}`)
      : index === 0 ? `fixture:${bodyId}` : `fixture:${bodyId}:${index}`;
    fail(!fixtureIds.has(fixtureId), 'KERNEL_BINDING_FIXTURE_DUPLICATE', `${bodyId}:${fixtureId}`);
    fixtureIds.add(fixtureId);
    const fixtureTags = optionalStringList(fixtureFragment, fixtureFields.tags, `entity:${bodyId}`);
    const categoryBits = optionalUnsignedInteger(fixtureFragment, fixtureFields.category_bits, `entity:${bodyId}`);
    const maskBits = optionalUnsignedInteger(fixtureFragment, fixtureFields.mask_bits, `entity:${bodyId}`);
    return {
      id: fixtureId,
      shape: shape(fixtureFragment[fixtureFields.shape], `entity:${bodyId}.${fixtureFields.shape}`),
      localPosition: optionalVector(fixtureFragment, fixtureFields.local_position, { x: 0, y: 0, z: 0 }, `entity:${bodyId}`),
      sensor: fixtureFields.sensor && fixtureFragment[fixtureFields.sensor] !== undefined ? booleanValue(fixtureFragment[fixtureFields.sensor], `entity:${bodyId}.${fixtureFields.sensor}`) : false,
      ...(fixtureFields.material_id && fixtureFragment[fixtureFields.material_id] !== undefined ? { materialId: text(fixtureFragment[fixtureFields.material_id], `entity:${bodyId}.${fixtureFields.material_id}`) } : {}),
      ...(fixtureFields.body_zone && fixtureFragment[fixtureFields.body_zone] !== undefined ? { bodyZone: text(fixtureFragment[fixtureFields.body_zone], `entity:${bodyId}.${fixtureFields.body_zone}`) } : {}),
      ...(categoryBits === undefined ? {} : { categoryBits }),
      ...(maskBits === undefined ? {} : { maskBits }),
      tags: uniqueSorted([...kernelTags, ...rowTags, ...fixtureTags]),
      data: { kernel_entity_id: bodyId, kernel_entity_root: row.entity_root, kernel_state_root: source.state_root }
    };
  });
  return {
    id: bodyId,
    kind,
    position,
    ...(massQ === undefined ? {} : { massQ }),
    rotationDeg: optionalVector(bodyFragment, bodyFields.rotation, { x: 0, y: 0, z: 0 }, `entity:${bodyId}`),
    velocity: optionalVector(bodyFragment, bodyFields.velocity, { x: 0, y: 0, z: 0 }, `entity:${bodyId}`),
    angularVelocityDeg: optionalVector(bodyFragment, bodyFields.angular_velocity, { x: 0, y: 0, z: 0 }, `entity:${bodyId}`),
    fixtures,
    enabled: bodyFields.enabled && bodyFragment[bodyFields.enabled] !== undefined ? booleanValue(bodyFragment[bodyFields.enabled], `entity:${bodyId}.${bodyFields.enabled}`) : true,
    tags: uniqueSorted([...kernelTags, ...rowTags, ...bodyTags]),
    data: { kernel_entity_id: bodyId, kernel_entity_root: row.entity_root, kernel_state_root: source.state_root }
  };
}

function materializeCharacter(
  row: KernelStateRow,
  body: ReturnType<typeof materializeBody>,
  characterFragment: Record<string, VSRValue>,
  characterFields: KernelSpatialCharacterFields
): SpatialCharacterSpec {
  const characterId = text(characterFragment[characterFields.id], `entity:${row.entity_id}.${characterFields.id}`);
  const bodyId = characterFields.body_id && characterFragment[characterFields.body_id] !== undefined
    ? text(characterFragment[characterFields.body_id], `entity:${row.entity_id}.${characterFields.body_id}`)
    : body.id;
  fail(bodyId === body.id, 'KERNEL_BINDING_CHARACTER_BODY_MISMATCH', `${characterId}:${bodyId}:${body.id}`);
  const walkSpeed = integer(characterFragment[characterFields.walk_speed], `entity:${row.entity_id}.${characterFields.walk_speed}`);
  const acceleration = integer(characterFragment[characterFields.acceleration], `entity:${row.entity_id}.${characterFields.acceleration}`);
  const jumpSpeed = integer(characterFragment[characterFields.jump_speed], `entity:${row.entity_id}.${characterFields.jump_speed}`);
  fail(walkSpeed >= 0 && acceleration >= 0 && jumpSpeed >= 0, 'KERNEL_BINDING_CHARACTER_VALUE_INVALID', characterId);
  const optionalInteger = (field: string | undefined): number | undefined => field && characterFragment[field] !== undefined
    ? integer(characterFragment[field], `entity:${row.entity_id}.${field}`)
    : undefined;
  const optionalText = (field: string | undefined): string | undefined => field && characterFragment[field] !== undefined
    ? text(characterFragment[field], `entity:${row.entity_id}.${field}`)
    : undefined;
  const airControlQ = optionalInteger(characterFields.air_control_q);
  const groundProbe = optionalInteger(characterFields.ground_probe);
  const maxSlopeDeg = optionalInteger(characterFields.max_slope_deg);
  const footstepDistance = optionalInteger(characterFields.footstep_distance);
  const stepHeight = optionalInteger(characterFields.step_height);
  const groundSnapDistance = optionalInteger(characterFields.ground_snap_distance);
  const skinWidth = optionalInteger(characterFields.skin_width);
  const platformInheritanceQ = optionalInteger(characterFields.platform_inheritance_q);
  const coyoteTicks = optionalInteger(characterFields.coyote_ticks);
  const jumpBufferTicks = optionalInteger(characterFields.jump_buffer_ticks);
  const leftFootZone = optionalText(characterFields.left_foot_zone);
  const rightFootZone = optionalText(characterFields.right_foot_zone);
  return {
    id: characterId,
    bodyId,
    walkSpeed,
    acceleration,
    jumpSpeed,
    ...(airControlQ === undefined ? {} : { airControlQ }),
    ...(groundProbe === undefined ? {} : { groundProbe }),
    ...(maxSlopeDeg === undefined ? {} : { maxSlopeDeg }),
    ...(footstepDistance === undefined ? {} : { footstepDistance }),
    ...(stepHeight === undefined ? {} : { stepHeight }),
    ...(groundSnapDistance === undefined ? {} : { groundSnapDistance }),
    ...(skinWidth === undefined ? {} : { skinWidth }),
    ...(platformInheritanceQ === undefined ? {} : { platformInheritanceQ }),
    ...(coyoteTicks === undefined ? {} : { coyoteTicks }),
    ...(jumpBufferTicks === undefined ? {} : { jumpBufferTicks }),
    ...(leftFootZone === undefined ? {} : { leftFootZone }),
    ...(rightFootZone === undefined ? {} : { rightFootZone }),
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
  const fixturesFragmentId = options.fixtures_fragment_id ?? 'spatial.fixtures';
  const fixturesCollectionField = options.fixtures_collection_field ?? 'items';
  const characterFragmentId = options.character_fragment_id ?? 'spatial.character';
  const bodyFields: KernelSpatialBodyFields = { kind: 'kind', position: 'position', mass_q: 'mass_q', rotation: 'rotation', velocity: 'velocity', angular_velocity: 'angular_velocity', tags: 'tags', enabled: 'enabled', ...options.body_fields };
  const fixtureFields: KernelSpatialFixtureFields = { id: 'fixture_id', shape: 'shape', local_position: 'local_position', sensor: 'sensor', material_id: 'material_id', body_zone: 'body_zone', category_bits: 'category_bits', mask_bits: 'mask_bits', tags: 'tags', ...options.fixture_fields };
  const characterFields: KernelSpatialCharacterFields = { id: 'character_id', body_id: 'body_id', walk_speed: 'walk_speed', acceleration: 'acceleration', air_control_q: 'air_control_q', jump_speed: 'jump_speed', ground_probe: 'ground_probe', max_slope_deg: 'max_slope_deg', footstep_distance: 'footstep_distance', left_foot_zone: 'left_foot_zone', right_foot_zone: 'right_foot_zone', step_height: 'step_height', ground_snap_distance: 'ground_snap_distance', skin_width: 'skin_width', platform_inheritance_q: 'platform_inheritance_q', coyote_ticks: 'coyote_ticks', jump_buffer_ticks: 'jump_buffer_ticks', ...options.character_fields };
  const rows = [...batch.rows].sort((a, b) => a.entity_id.localeCompare(b.entity_id));
  const seen = new Set<string>();
  const entityBindings: KernelSpatialEntityBinding[] = [];
  const characters: SpatialCharacterSpec[] = [];
  const bodies = rows.map(row => {
    const entityId = text(row.entity_id, 'row.entity_id');
    fail(!seen.has(entityId), 'KERNEL_BINDING_ENTITY_DUPLICATE', entityId);
    seen.add(entityId);
    fail(HEX64.test(row.entity_root), 'KERNEL_BINDING_ENTITY_ROOT_INVALID', entityId);
    const collectionPresent = row.fragments?.[fixturesFragmentId] !== undefined;
    const singularPresent = row.fragments?.[fixtureFragmentId] !== undefined;
    fail(!(collectionPresent && singularPresent && fixturesFragmentId !== fixtureFragmentId), 'KERNEL_BINDING_FIXTURE_SOURCES_AMBIGUOUS', entityId);
    const collection = fixtureCollection(row, fixturesFragmentId, fixturesCollectionField, `entity:${entityId}`);
    const singular = collection === null ? [fragment(row, fixtureFragmentId, `entity:${entityId}`)] : null;
    const body = materializeBody(row, fragment(row, bodyFragmentId, `entity:${entityId}`), collection ?? singular!, bodyFields, fixtureFields, source);
    const characterFragment = optionalFragment(row, characterFragmentId, `entity:${entityId}`);
    if (characterFragment) characters.push(materializeCharacter(row, body, characterFragment, characterFields));
    entityBindings.push({
      entity_id: entityId,
      entity_root: row.entity_root,
      body_id: body.id,
      fixture_id: body.fixtures[0]!.id,
      ...(body.fixtures.length > 1 ? { fixture_ids: body.fixtures.map(fixture => fixture.id) } : {}),
      body_fragment_id: bodyFragmentId,
      fixture_fragment_id: collection === null ? fixtureFragmentId : fixturesFragmentId,
    });
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
    ...(characters.length > 0 ? { characters: characters.sort((a, b) => a.id.localeCompare(b.id)) } : {}),
    reality: { generation: source.generation, realityRoot: source.state_root, evidenceRoot: source.batch_root }
  };
  const base = { format: KERNEL_RSR_BINDING_FORMAT, version: '0.1.0' as const, source, entity_bindings: entityBindings, config: deepClone(config) };
  return { ...base, binding_root: semanticHash(base) };
}
