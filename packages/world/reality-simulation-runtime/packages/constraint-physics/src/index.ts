import { deepClone, semanticHash, type VSRValue } from '../../spec/src/index.js';

export const CONSTRAINT_PHYSICS_VERSION = '0.2.0-alpha.1';
export const DEFAULT_SCALE = 1_000;
export const Q = 1_000;

export interface IntVector2 { x: number; y: number }
export type ConstraintBodyKind = 'static' | 'dynamic' | 'kinematic';
export type ConstraintShape =
  | { type: 'box'; halfExtents: IntVector2 }
  | { type: 'circle'; radius: number };

export interface CollisionFilter {
  categoryBits?: number;
  maskBits?: number;
  groupIndex?: number;
}

export interface ConstraintMaterialSpec {
  id: string;
  restitutionQ?: number;
  frictionQ?: number;
  linearDampingQ?: number;
}

export interface MaterialInteractionSpec {
  materialA: string;
  materialB: string;
  enabled?: boolean;
  sensorOnly?: boolean;
  restitutionQ?: number;
  frictionQ?: number;
}

export interface ConstraintBodySpec {
  id: string;
  kind: ConstraintBodyKind;
  position: IntVector2;
  shape: ConstraintShape;
  velocity?: IntVector2;
  acceleration?: IntVector2;
  inverseMassQ?: number;
  materialId?: string;
  restitutionQ?: number;
  frictionQ?: number;
  linearDampingQ?: number;
  sensor?: boolean;
  continuous?: boolean;
  filter?: CollisionFilter;
  sleepThreshold?: number;
  sleepTicks?: number;
  tags?: string[];
  data?: Record<string, VSRValue>;
}

export interface UniformFieldSpec {
  id: string;
  type: 'uniform';
  acceleration: IntVector2;
  enabled?: boolean;
  tagsAny?: string[];
  categoryMask?: number;
}

export interface RadialFieldSpec {
  id: string;
  type: 'radial';
  center: IntVector2;
  radius: number;
  strength: number;
  enabled?: boolean;
  tagsAny?: string[];
  categoryMask?: number;
}

export interface LinearDragFieldSpec {
  id: string;
  type: 'linear-drag';
  coefficientQ: number;
  enabled?: boolean;
  tagsAny?: string[];
  categoryMask?: number;
}

export type ConstraintFieldSpec = UniformFieldSpec | RadialFieldSpec | LinearDragFieldSpec;

export interface DistanceConstraintSpec {
  id: string;
  type: 'distance';
  bodyA: string;
  bodyB: string;
  restLength: number;
  stiffnessQ?: number;
  dampingQ?: number;
  breakImpulse?: number;
  enabled?: boolean;
  data?: Record<string, VSRValue>;
}

export type ConstraintSpec = DistanceConstraintSpec;

export interface ConstraintPhysicsWorldConfig {
  format: 'rsr.constraint-world.v0.2';
  worldId: string;
  scale?: number;
  stepHz: number;
  gravity?: IntVector2;
  solverIterations?: number;
  gridCellSize?: number;
  maxSubsteps?: number;
  materials?: ConstraintMaterialSpec[];
  materialInteractions?: MaterialInteractionSpec[];
  fields?: ConstraintFieldSpec[];
  constraints?: ConstraintSpec[];
  bodies: ConstraintBodySpec[];
}

export interface RuntimeConstraintBody {
  id: string;
  kind: ConstraintBodyKind;
  position: IntVector2;
  shape: ConstraintShape;
  velocity: IntVector2;
  acceleration: IntVector2;
  inverseMassQ: number;
  materialId: string;
  restitutionQ: number;
  frictionQ: number;
  linearDampingQ: number;
  sensor: boolean;
  continuous: boolean;
  filter: Required<CollisionFilter>;
  sleepThreshold: number;
  sleepTicks: number;
  sleepCounter: number;
  awake: boolean;
  tags: string[];
  data: Record<string, VSRValue>;
}

export interface RuntimeDistanceConstraint {
  id: string;
  type: 'distance';
  bodyA: string;
  bodyB: string;
  restLength: number;
  stiffnessQ: number;
  dampingQ: number;
  breakImpulse: number | null;
  enabled: boolean;
  broken: boolean;
  lastImpulse: number;
  data: Record<string, VSRValue>;
}

export interface ConstraintContact {
  key: string;
  bodyA: string;
  bodyB: string;
  normalQ: IntVector2;
  penetration: number;
  point: IntVector2;
  normalImpulse: number;
  tangentImpulse: number;
  sensor: boolean;
  materialPair: string;
  microstep: number;
}

export type InteractionPhase = 'begin' | 'persist' | 'end' | 'break';
export type InteractionKind = 'contact' | 'sensor' | 'constraint';

export interface ConstraintInteractionEvent {
  id: string;
  tick: number;
  kind: InteractionKind;
  phase: InteractionPhase;
  subjects: string[];
  pair?: string;
  constraintId?: string;
  contact?: ConstraintContact;
  evidenceHash: string;
}

export interface ConstraintIsland {
  id: string;
  bodyIds: string[];
  contactKeys: string[];
  constraintIds: string[];
  awake: boolean;
}

export type ConstraintPhysicsCommand =
  | { id: string; tick: number; type: 'apply-impulse'; bodyId: string; impulse: IntVector2 }
  | { id: string; tick: number; type: 'apply-force'; bodyId: string; force: IntVector2 }
  | { id: string; tick: number; type: 'set-velocity'; bodyId: string; velocity: IntVector2 }
  | { id: string; tick: number; type: 'set-kinematic-velocity'; bodyId: string; velocity: IntVector2 }
  | { id: string; tick: number; type: 'teleport'; bodyId: string; position: IntVector2; clearVelocity?: boolean }
  | { id: string; tick: number; type: 'wake'; bodyId: string }
  | { id: string; tick: number; type: 'set-constraint-enabled'; constraintId: string; enabled: boolean };

export interface ConstraintPhysicsSnapshot {
  format: 'rsr.constraint-snapshot.v0.2';
  runtimeVersion: string;
  worldId: string;
  tick: number;
  logicalTime: { numerator: number; denominator: number };
  scale: number;
  stepHz: number;
  gravity: IntVector2;
  solverIterations: number;
  gridCellSize: number;
  maxSubsteps: number;
  configHash: string;
  bodies: RuntimeConstraintBody[];
  constraints: RuntimeDistanceConstraint[];
  fields: ConstraintFieldSpec[];
  materialInteractions: MaterialInteractionSpec[];
  contacts: ConstraintContact[];
  events: ConstraintInteractionEvent[];
  islands: ConstraintIsland[];
  diagnostics: {
    microsteps: number;
    candidatePairs: number;
    narrowPhaseTests: number;
    resolvedContacts: number;
  };
  contactRoot: string;
  constraintRoot: string;
  islandRoot: string;
  stateRoot: string;
}

export interface ConstraintPhysicsStepResult {
  snapshot: ConstraintPhysicsSnapshot;
  appliedCommandIds: string[];
  contacts: ConstraintContact[];
  events: ConstraintInteractionEvent[];
}

export interface ConstraintRFECausalDelta {
  format: 'rfe.constraint-causal-delta.v0.2';
  provisional: true;
  baseRealityRoot: string;
  sourceRuntime: string;
  worldId: string;
  tick: number;
  simulationRoot: string;
  facts: Array<{ subject: string; predicate: string; value: VSRValue; evidence: string }>;
  events: Array<{ type: string; subjects: string[]; payload: Record<string, VSRValue>; evidence: string }>;
  diagnostics: ConstraintPhysicsSnapshot['diagnostics'];
  deltaRoot: string;
}

interface Aabb { minX: number; minY: number; maxX: number; maxY: number }
interface PairMaterial { enabled: boolean; sensorOnly: boolean; restitutionQ: number; frictionQ: number; key: string }
interface ContactGeometry { normalQ: IntVector2; penetration: number; point: IntVector2 }

function assertInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} 必须是安全整数。`);
}
function assertVector(value: IntVector2, label: string): void {
  assertInteger(value.x, `${label}.x`);
  assertInteger(value.y, `${label}.y`);
}
function truncDiv(numerator: number, denominator: number): number {
  if (denominator === 0) throw new Error('除数不能为 0。');
  return Math.trunc(numerator / denominator);
}
function ceilDivPositive(numerator: number, denominator: number): number {
  if (numerator <= 0) return 0;
  return Math.floor((numerator + denominator - 1) / denominator);
}
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
function abs(value: number): number { return value < 0 ? -value : value; }
function signNonZero(value: number, fallback = 1): number { return value < 0 ? -1 : value > 0 ? 1 : fallback; }
function pairKey(a: string, b: string): string { return a < b ? `${a}|${b}` : `${b}|${a}`; }
function materialPairKey(a: string, b: string): string { return a < b ? `${a}|${b}` : `${b}|${a}`; }
function floorDiv(value: number, divisor: number): number { return Math.floor(value / divisor); }
function integerSqrt(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('integerSqrt 输入必须是非负安全整数。');
  if (value < 2) return value;
  let x = Math.floor(Math.sqrt(value));
  while ((x + 1) * (x + 1) <= value) x++;
  while (x * x > value) x--;
  return x;
}
function lengthInt(vector: IntVector2): number {
  return integerSqrt(vector.x * vector.x + vector.y * vector.y);
}
function normalQFromDelta(delta: IntVector2, fallback: IntVector2 = { x: Q, y: 0 }): { normalQ: IntVector2; distance: number } {
  const distance = lengthInt(delta);
  if (distance === 0) return { normalQ: fallback, distance: 0 };
  return {
    normalQ: { x: truncDiv(delta.x * Q, distance), y: truncDiv(delta.y * Q, distance) },
    distance
  };
}
function dotNormal(vector: IntVector2, normalQ: IntVector2): number {
  return truncDiv(vector.x * normalQ.x + vector.y * normalQ.y, Q);
}
function scaleNormal(normalQ: IntVector2, scalar: number): IntVector2 {
  return { x: truncDiv(normalQ.x * scalar, Q), y: truncDiv(normalQ.y * scalar, Q) };
}
function categoryBits(filter: CollisionFilter | undefined): number { return (filter?.categoryBits ?? 0x0001) >>> 0; }
function maskBits(filter: CollisionFilter | undefined): number { return (filter?.maskBits ?? 0xffffffff) >>> 0; }
function normalizedFilter(filter: CollisionFilter | undefined): Required<CollisionFilter> {
  return { categoryBits: categoryBits(filter), maskBits: maskBits(filter), groupIndex: Math.trunc(filter?.groupIndex ?? 0) };
}

export function toConstraintFixed(value: number, scale = DEFAULT_SCALE): number {
  if (!Number.isFinite(value)) throw new Error('固定点输入必须是有限数。');
  return Math.round(value * scale);
}
export function fromConstraintFixed(value: number, scale = DEFAULT_SCALE): number { return value / scale; }
export function constraintVec(x: number, y: number, scale = DEFAULT_SCALE): IntVector2 {
  return { x: toConstraintFixed(x, scale), y: toConstraintFixed(y, scale) };
}

function shapeSemantic(shape: ConstraintShape): unknown {
  return shape.type === 'box'
    ? { type: shape.type, halfExtents: shape.halfExtents }
    : { type: shape.type, radius: shape.radius };
}
function bodySemantic(body: RuntimeConstraintBody): unknown {
  return {
    id: body.id,
    kind: body.kind,
    position: body.position,
    shape: shapeSemantic(body.shape),
    velocity: body.velocity,
    acceleration: body.acceleration,
    inverseMassQ: body.inverseMassQ,
    materialId: body.materialId,
    restitutionQ: body.restitutionQ,
    frictionQ: body.frictionQ,
    linearDampingQ: body.linearDampingQ,
    sensor: body.sensor,
    continuous: body.continuous,
    filter: body.filter,
    sleepThreshold: body.sleepThreshold,
    sleepTicks: body.sleepTicks,
    sleepCounter: body.sleepCounter,
    awake: body.awake,
    tags: body.tags,
    data: body.data
  };
}
function constraintSemantic(constraint: RuntimeDistanceConstraint): unknown {
  return {
    id: constraint.id,
    type: constraint.type,
    bodyA: constraint.bodyA,
    bodyB: constraint.bodyB,
    restLength: constraint.restLength,
    stiffnessQ: constraint.stiffnessQ,
    dampingQ: constraint.dampingQ,
    breakImpulse: constraint.breakImpulse,
    enabled: constraint.enabled,
    broken: constraint.broken,
    lastImpulse: constraint.lastImpulse,
    data: constraint.data
  };
}
function contactSemantic(contact: ConstraintContact): unknown {
  return {
    key: contact.key,
    bodyA: contact.bodyA,
    bodyB: contact.bodyB,
    normalQ: contact.normalQ,
    penetration: contact.penetration,
    point: contact.point,
    normalImpulse: contact.normalImpulse,
    tangentImpulse: contact.tangentImpulse,
    sensor: contact.sensor,
    materialPair: contact.materialPair,
    microstep: contact.microstep
  };
}
function eventSemantic(event: ConstraintInteractionEvent): unknown {
  return {
    id: event.id,
    tick: event.tick,
    kind: event.kind,
    phase: event.phase,
    subjects: event.subjects,
    pair: event.pair ?? null,
    constraintId: event.constraintId ?? null,
    contact: event.contact ?? null,
    evidenceHash: event.evidenceHash
  };
}

export function validateConstraintWorldConfig(config: ConstraintPhysicsWorldConfig): void {
  if (config.format !== 'rsr.constraint-world.v0.2') throw new Error('不支持的约束物理世界格式。');
  if (!config.worldId) throw new Error('worldId 不能为空。');
  if (!Number.isInteger(config.stepHz) || config.stepHz <= 0 || config.stepHz > 1_000) throw new Error('stepHz 必须是 1..1000 的整数。');
  const scale = config.scale ?? DEFAULT_SCALE;
  if (!Number.isInteger(scale) || scale <= 0) throw new Error('scale 必须是正整数。');
  assertVector(config.gravity ?? { x: 0, y: 0 }, 'gravity');
  const gridCellSize = config.gridCellSize ?? 64 * scale;
  if (!Number.isSafeInteger(gridCellSize) || gridCellSize <= 0) throw new Error('gridCellSize 必须是正安全整数。');
  const maxSubsteps = config.maxSubsteps ?? 8;
  if (!Number.isInteger(maxSubsteps) || maxSubsteps < 1 || maxSubsteps > 64) throw new Error('maxSubsteps 必须是 1..64。');

  const materialIds = new Set<string>(['default']);
  for (const material of config.materials ?? []) {
    if (!material.id || materialIds.has(material.id)) throw new Error(`材质 id 无效或重复：${material.id}`);
    materialIds.add(material.id);
  }

  const bodyIds = new Set<string>();
  for (const body of config.bodies) {
    if (!body.id || bodyIds.has(body.id)) throw new Error(`body id 无效或重复：${body.id}`);
    bodyIds.add(body.id);
    assertVector(body.position, `${body.id}.position`);
    if (body.velocity) assertVector(body.velocity, `${body.id}.velocity`);
    if (body.acceleration) assertVector(body.acceleration, `${body.id}.acceleration`);
    if (body.shape.type === 'box') {
      assertVector(body.shape.halfExtents, `${body.id}.shape.halfExtents`);
      if (body.shape.halfExtents.x <= 0 || body.shape.halfExtents.y <= 0) throw new Error(`${body.id} box 尺寸必须大于 0。`);
    } else {
      assertInteger(body.shape.radius, `${body.id}.shape.radius`);
      if (body.shape.radius <= 0) throw new Error(`${body.id} circle 半径必须大于 0。`);
    }
    if (body.materialId && !materialIds.has(body.materialId)) throw new Error(`${body.id} 引用了不存在的材质：${body.materialId}`);
    const inverseMassQ = body.kind === 'dynamic' ? (body.inverseMassQ ?? Q) : 0;
    if (!Number.isInteger(inverseMassQ) || inverseMassQ < 0) throw new Error(`${body.id}.inverseMassQ 无效。`);
    if (body.kind === 'dynamic' && inverseMassQ === 0) throw new Error(`${body.id} 是动态实体但 inverseMassQ 为 0。`);
  }

  const constraintIds = new Set<string>();
  for (const constraint of config.constraints ?? []) {
    if (!constraint.id || constraintIds.has(constraint.id)) throw new Error(`constraint id 无效或重复：${constraint.id}`);
    constraintIds.add(constraint.id);
    if (!bodyIds.has(constraint.bodyA) || !bodyIds.has(constraint.bodyB)) throw new Error(`${constraint.id} 引用了不存在的实体。`);
    if (constraint.bodyA === constraint.bodyB) throw new Error(`${constraint.id} 不能连接同一实体。`);
    if (!Number.isSafeInteger(constraint.restLength) || constraint.restLength < 0) throw new Error(`${constraint.id}.restLength 无效。`);
  }

  const fieldIds = new Set<string>();
  for (const field of config.fields ?? []) {
    if (!field.id || fieldIds.has(field.id)) throw new Error(`field id 无效或重复：${field.id}`);
    fieldIds.add(field.id);
    if (field.type === 'uniform') assertVector(field.acceleration, `${field.id}.acceleration`);
    if (field.type === 'radial') {
      assertVector(field.center, `${field.id}.center`);
      assertInteger(field.radius, `${field.id}.radius`);
      assertInteger(field.strength, `${field.id}.strength`);
      if (field.radius <= 0) throw new Error(`${field.id}.radius 必须大于 0。`);
    }
    if (field.type === 'linear-drag' && (!Number.isInteger(field.coefficientQ) || field.coefficientQ < 0 || field.coefficientQ > 20 * Q)) {
      throw new Error(`${field.id}.coefficientQ 无效。`);
    }
  }
}

function materialMap(config: ConstraintPhysicsWorldConfig): Map<string, ConstraintMaterialSpec> {
  const map = new Map<string, ConstraintMaterialSpec>();
  map.set('default', { id: 'default', restitutionQ: 50, frictionQ: 500, linearDampingQ: 0 });
  for (const material of config.materials ?? []) map.set(material.id, deepClone(material));
  return map;
}

function runtimeBody(spec: ConstraintBodySpec, materials: Map<string, ConstraintMaterialSpec>): RuntimeConstraintBody {
  const materialId = spec.materialId ?? 'default';
  const material = materials.get(materialId) ?? materials.get('default')!;
  return {
    id: spec.id,
    kind: spec.kind,
    position: deepClone(spec.position),
    shape: deepClone(spec.shape),
    velocity: deepClone(spec.velocity ?? { x: 0, y: 0 }),
    acceleration: deepClone(spec.acceleration ?? { x: 0, y: 0 }),
    inverseMassQ: spec.kind === 'dynamic' ? (spec.inverseMassQ ?? Q) : 0,
    materialId,
    restitutionQ: clamp(spec.restitutionQ ?? material.restitutionQ ?? 50, 0, Q),
    frictionQ: clamp(spec.frictionQ ?? material.frictionQ ?? 500, 0, 4 * Q),
    linearDampingQ: clamp(spec.linearDampingQ ?? material.linearDampingQ ?? 0, 0, 20 * Q),
    sensor: Boolean(spec.sensor),
    continuous: Boolean(spec.continuous),
    filter: normalizedFilter(spec.filter),
    sleepThreshold: Math.max(0, spec.sleepThreshold ?? 2 * DEFAULT_SCALE),
    sleepTicks: Math.max(1, spec.sleepTicks ?? 30),
    sleepCounter: 0,
    awake: spec.kind !== 'static',
    tags: [...(spec.tags ?? [])].sort(),
    data: deepClone(spec.data ?? {})
  };
}

function runtimeConstraint(spec: ConstraintSpec): RuntimeDistanceConstraint {
  return {
    id: spec.id,
    type: 'distance',
    bodyA: spec.bodyA,
    bodyB: spec.bodyB,
    restLength: spec.restLength,
    stiffnessQ: clamp(spec.stiffnessQ ?? 850, 0, Q),
    dampingQ: clamp(spec.dampingQ ?? 150, 0, Q),
    breakImpulse: spec.breakImpulse === undefined ? null : Math.max(0, spec.breakImpulse),
    enabled: spec.enabled !== false,
    broken: false,
    lastImpulse: 0,
    data: deepClone(spec.data ?? {})
  };
}

function configSemantic(config: ConstraintPhysicsWorldConfig): unknown {
  return {
    format: config.format,
    worldId: config.worldId,
    scale: config.scale ?? DEFAULT_SCALE,
    stepHz: config.stepHz,
    gravity: config.gravity ?? { x: 0, y: 0 },
    solverIterations: config.solverIterations ?? 6,
    gridCellSize: config.gridCellSize ?? 64 * (config.scale ?? DEFAULT_SCALE),
    maxSubsteps: config.maxSubsteps ?? 8,
    materials: [...(config.materials ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
    materialInteractions: [...(config.materialInteractions ?? [])].sort((a, b) => materialPairKey(a.materialA, a.materialB).localeCompare(materialPairKey(b.materialA, b.materialB))),
    fields: [...(config.fields ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
    constraints: [...(config.constraints ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
    bodies: [...config.bodies].sort((a, b) => a.id.localeCompare(b.id))
  };
}

function bodyAabb(body: RuntimeConstraintBody): Aabb {
  if (body.shape.type === 'box') {
    return {
      minX: body.position.x - body.shape.halfExtents.x,
      minY: body.position.y - body.shape.halfExtents.y,
      maxX: body.position.x + body.shape.halfExtents.x,
      maxY: body.position.y + body.shape.halfExtents.y
    };
  }
  return {
    minX: body.position.x - body.shape.radius,
    minY: body.position.y - body.shape.radius,
    maxX: body.position.x + body.shape.radius,
    maxY: body.position.y + body.shape.radius
  };
}

function filtersAllow(a: RuntimeConstraintBody, b: RuntimeConstraintBody): boolean {
  if (a.filter.groupIndex !== 0 && a.filter.groupIndex === b.filter.groupIndex) return a.filter.groupIndex > 0;
  return Boolean((a.filter.maskBits & b.filter.categoryBits) !== 0 && (b.filter.maskBits & a.filter.categoryBits) !== 0);
}

function fieldApplies(field: ConstraintFieldSpec, body: RuntimeConstraintBody): boolean {
  if (field.enabled === false) return false;
  if (field.tagsAny?.length && !field.tagsAny.some(tag => body.tags.includes(tag))) return false;
  if (field.categoryMask !== undefined && ((field.categoryMask >>> 0) & body.filter.categoryBits) === 0) return false;
  return true;
}

function boxBoxGeometry(a: RuntimeConstraintBody, b: RuntimeConstraintBody): ContactGeometry | undefined {
  if (a.shape.type !== 'box' || b.shape.type !== 'box') return undefined;
  const dx = b.position.x - a.position.x;
  const dy = b.position.y - a.position.y;
  const overlapX = a.shape.halfExtents.x + b.shape.halfExtents.x - abs(dx);
  const overlapY = a.shape.halfExtents.y + b.shape.halfExtents.y - abs(dy);
  if (overlapX <= 0 || overlapY <= 0) return undefined;
  if (overlapX <= overlapY) {
    const normalQ = { x: signNonZero(dx, a.id < b.id ? 1 : -1) * Q, y: 0 };
    return {
      normalQ,
      penetration: overlapX,
      point: {
        x: truncDiv(a.position.x + b.position.x, 2),
        y: clamp(truncDiv(a.position.y + b.position.y, 2), Math.max(a.position.y - a.shape.halfExtents.y, b.position.y - b.shape.halfExtents.y), Math.min(a.position.y + a.shape.halfExtents.y, b.position.y + b.shape.halfExtents.y))
      }
    };
  }
  const normalQ = { x: 0, y: signNonZero(dy, a.id < b.id ? 1 : -1) * Q };
  return {
    normalQ,
    penetration: overlapY,
    point: {
      x: clamp(truncDiv(a.position.x + b.position.x, 2), Math.max(a.position.x - a.shape.halfExtents.x, b.position.x - b.shape.halfExtents.x), Math.min(a.position.x + a.shape.halfExtents.x, b.position.x + b.shape.halfExtents.x)),
      y: truncDiv(a.position.y + b.position.y, 2)
    }
  };
}

function circleCircleGeometry(a: RuntimeConstraintBody, b: RuntimeConstraintBody): ContactGeometry | undefined {
  if (a.shape.type !== 'circle' || b.shape.type !== 'circle') return undefined;
  const delta = { x: b.position.x - a.position.x, y: b.position.y - a.position.y };
  const radii = a.shape.radius + b.shape.radius;
  const distSq = delta.x * delta.x + delta.y * delta.y;
  if (distSq >= radii * radii) return undefined;
  const fallback = { x: (a.id < b.id ? 1 : -1) * Q, y: 0 };
  const { normalQ, distance } = normalQFromDelta(delta, fallback);
  const penetration = radii - distance;
  const offset = scaleNormal(normalQ, a.shape.radius - truncDiv(penetration, 2));
  return { normalQ, penetration, point: { x: a.position.x + offset.x, y: a.position.y + offset.y } };
}

function boxCircleGeometry(box: RuntimeConstraintBody, circle: RuntimeConstraintBody): ContactGeometry | undefined {
  if (box.shape.type !== 'box' || circle.shape.type !== 'circle') return undefined;
  const minX = box.position.x - box.shape.halfExtents.x;
  const maxX = box.position.x + box.shape.halfExtents.x;
  const minY = box.position.y - box.shape.halfExtents.y;
  const maxY = box.position.y + box.shape.halfExtents.y;
  const closest = { x: clamp(circle.position.x, minX, maxX), y: clamp(circle.position.y, minY, maxY) };
  const delta = { x: circle.position.x - closest.x, y: circle.position.y - closest.y };
  const distSq = delta.x * delta.x + delta.y * delta.y;
  if (distSq > 0) {
    if (distSq >= circle.shape.radius * circle.shape.radius) return undefined;
    const { normalQ, distance } = normalQFromDelta(delta);
    return { normalQ, penetration: circle.shape.radius - distance, point: closest };
  }

  const left = circle.position.x - minX;
  const right = maxX - circle.position.x;
  const top = circle.position.y - minY;
  const bottom = maxY - circle.position.y;
  const minFace = Math.min(left, right, top, bottom);
  if (minFace === left) return { normalQ: { x: -Q, y: 0 }, penetration: circle.shape.radius + left, point: { x: minX, y: circle.position.y } };
  if (minFace === right) return { normalQ: { x: Q, y: 0 }, penetration: circle.shape.radius + right, point: { x: maxX, y: circle.position.y } };
  if (minFace === top) return { normalQ: { x: 0, y: -Q }, penetration: circle.shape.radius + top, point: { x: circle.position.x, y: minY } };
  return { normalQ: { x: 0, y: Q }, penetration: circle.shape.radius + bottom, point: { x: circle.position.x, y: maxY } };
}

function detectGeometry(a: RuntimeConstraintBody, b: RuntimeConstraintBody): ContactGeometry | undefined {
  if (a.shape.type === 'box' && b.shape.type === 'box') return boxBoxGeometry(a, b);
  if (a.shape.type === 'circle' && b.shape.type === 'circle') return circleCircleGeometry(a, b);
  if (a.shape.type === 'box' && b.shape.type === 'circle') return boxCircleGeometry(a, b);
  const geometry = boxCircleGeometry(b, a);
  if (!geometry) return undefined;
  return {
    normalQ: { x: -geometry.normalQ.x, y: -geometry.normalQ.y },
    penetration: geometry.penetration,
    point: geometry.point
  };
}

function minimumFeature(body: RuntimeConstraintBody): number {
  return body.shape.type === 'circle'
    ? body.shape.radius
    : Math.min(body.shape.halfExtents.x, body.shape.halfExtents.y);
}

export class ConstraintCausalPhysicsWorld {
  readonly worldId: string;
  readonly scale: number;
  readonly stepHz: number;
  readonly gravity: IntVector2;
  readonly solverIterations: number;
  readonly gridCellSize: number;
  readonly maxSubsteps: number;
  readonly configHash: string;

  private tickValue = 0;
  private readonly bodiesById: Map<string, RuntimeConstraintBody>;
  private readonly constraintsById: Map<string, RuntimeDistanceConstraint>;
  private readonly fields: ConstraintFieldSpec[];
  private readonly interactionSpecs: MaterialInteractionSpec[];
  private readonly interactions: Map<string, MaterialInteractionSpec>;
  private contactsValue: ConstraintContact[] = [];
  private eventsValue: ConstraintInteractionEvent[] = [];
  private islandsValue: ConstraintIsland[] = [];
  private previousContacts = new Map<string, ConstraintContact>();
  private diagnosticsValue: ConstraintPhysicsSnapshot['diagnostics'] = { microsteps: 1, candidatePairs: 0, narrowPhaseTests: 0, resolvedContacts: 0 };

  constructor(config: ConstraintPhysicsWorldConfig, identity?: { configHash?: string }) {
    validateConstraintWorldConfig(config);
    this.worldId = config.worldId;
    this.scale = config.scale ?? DEFAULT_SCALE;
    this.stepHz = config.stepHz;
    this.gravity = deepClone(config.gravity ?? { x: 0, y: 0 });
    this.solverIterations = clamp(Math.trunc(config.solverIterations ?? 6), 1, 24);
    this.gridCellSize = config.gridCellSize ?? 64 * this.scale;
    this.maxSubsteps = config.maxSubsteps ?? 8;
    this.configHash = identity?.configHash ?? semanticHash(configSemantic(config));
    const materials = materialMap(config);
    this.bodiesById = new Map(config.bodies.map(spec => [spec.id, runtimeBody(spec, materials)]));
    this.constraintsById = new Map((config.constraints ?? []).map(spec => [spec.id, runtimeConstraint(spec)]));
    this.fields = [...(config.fields ?? [])].sort((a, b) => a.id.localeCompare(b.id)).map(deepClone);
    this.interactionSpecs = [...(config.materialInteractions ?? [])]
      .sort((a, b) => materialPairKey(a.materialA, a.materialB).localeCompare(materialPairKey(b.materialA, b.materialB)))
      .map(deepClone);
    this.interactions = new Map(this.interactionSpecs.map(item => [materialPairKey(item.materialA, item.materialB), deepClone(item)]));
  }

  static fromSnapshot(snapshot: ConstraintPhysicsSnapshot): ConstraintCausalPhysicsWorld {
    const config: ConstraintPhysicsWorldConfig = {
      format: 'rsr.constraint-world.v0.2',
      worldId: snapshot.worldId,
      scale: snapshot.scale,
      stepHz: snapshot.stepHz,
      gravity: snapshot.gravity,
      solverIterations: snapshot.solverIterations,
      gridCellSize: snapshot.gridCellSize,
      maxSubsteps: snapshot.maxSubsteps,
      materials: [...new Set(snapshot.bodies.map(body => body.materialId))].sort().filter(id => id !== 'default').map(id => ({ id })),
      materialInteractions: snapshot.materialInteractions,
      fields: snapshot.fields,
      bodies: snapshot.bodies.map(body => ({
        id: body.id,
        kind: body.kind,
        position: body.position,
        shape: body.shape,
        velocity: body.velocity,
        acceleration: body.acceleration,
        inverseMassQ: body.inverseMassQ,
        materialId: body.materialId,
        restitutionQ: body.restitutionQ,
        frictionQ: body.frictionQ,
        linearDampingQ: body.linearDampingQ,
        sensor: body.sensor,
        continuous: body.continuous,
        filter: body.filter,
        sleepThreshold: body.sleepThreshold,
        sleepTicks: body.sleepTicks,
        tags: body.tags,
        data: body.data
      })),
      constraints: snapshot.constraints.map(constraint => ({
        id: constraint.id,
        type: 'distance',
        bodyA: constraint.bodyA,
        bodyB: constraint.bodyB,
        restLength: constraint.restLength,
        stiffnessQ: constraint.stiffnessQ,
        dampingQ: constraint.dampingQ,
        breakImpulse: constraint.breakImpulse ?? undefined,
        enabled: constraint.enabled,
        data: constraint.data
      }))
    };
    const world = new ConstraintCausalPhysicsWorld(config, { configHash: snapshot.configHash });
    world.tickValue = snapshot.tick;
    for (const source of snapshot.bodies) {
      const target = world.bodiesById.get(source.id)!;
      target.sleepCounter = source.sleepCounter;
      target.awake = source.awake;
    }
    for (const source of snapshot.constraints) {
      const target = world.constraintsById.get(source.id)!;
      target.broken = source.broken;
      target.lastImpulse = source.lastImpulse;
    }
    world.contactsValue = deepClone(snapshot.contacts);
    world.eventsValue = deepClone(snapshot.events);
    world.islandsValue = deepClone(snapshot.islands);
    world.diagnosticsValue = deepClone(snapshot.diagnostics);
    world.previousContacts = new Map(snapshot.contacts.map(contact => [contact.key, deepClone(contact)]));
    return world;
  }

  get tick(): number { return this.tickValue; }
  body(id: string): RuntimeConstraintBody {
    const body = this.bodiesById.get(id);
    if (!body) throw new Error(`实体不存在：${id}`);
    return deepClone(body);
  }
  bodies(): RuntimeConstraintBody[] { return [...this.bodiesById.values()].sort((a, b) => a.id.localeCompare(b.id)).map(deepClone); }
  constraints(): RuntimeDistanceConstraint[] { return [...this.constraintsById.values()].sort((a, b) => a.id.localeCompare(b.id)).map(deepClone); }
  contacts(): ConstraintContact[] { return deepClone(this.contactsValue); }
  events(): ConstraintInteractionEvent[] { return deepClone(this.eventsValue); }
  islands(): ConstraintIsland[] { return deepClone(this.islandsValue); }

  private mutableBody(id: string): RuntimeConstraintBody {
    const body = this.bodiesById.get(id);
    if (!body) throw new Error(`命令引用了不存在的实体：${id}`);
    return body;
  }
  private mutableConstraint(id: string): RuntimeDistanceConstraint {
    const constraint = this.constraintsById.get(id);
    if (!constraint) throw new Error(`命令引用了不存在的约束：${id}`);
    return constraint;
  }

  private applyCommand(command: ConstraintPhysicsCommand, forces: Map<string, IntVector2>): void {
    if (command.type === 'set-constraint-enabled') {
      const constraint = this.mutableConstraint(command.constraintId);
      constraint.enabled = command.enabled;
      if (command.enabled) constraint.broken = false;
      return;
    }
    const body = this.mutableBody(command.bodyId);
    if (command.type === 'apply-impulse') {
      if (body.kind !== 'dynamic') throw new Error(`${body.id} 不是动态实体，不能施加冲量。`);
      assertVector(command.impulse, `${command.id}.impulse`);
      body.velocity.x += truncDiv(command.impulse.x * body.inverseMassQ, Q);
      body.velocity.y += truncDiv(command.impulse.y * body.inverseMassQ, Q);
      body.awake = true;
      body.sleepCounter = 0;
    } else if (command.type === 'apply-force') {
      if (body.kind !== 'dynamic') throw new Error(`${body.id} 不是动态实体，不能施加力。`);
      assertVector(command.force, `${command.id}.force`);
      const previous = forces.get(body.id) ?? { x: 0, y: 0 };
      forces.set(body.id, { x: previous.x + command.force.x, y: previous.y + command.force.y });
      body.awake = true;
      body.sleepCounter = 0;
    } else if (command.type === 'set-velocity') {
      if (body.kind !== 'dynamic') throw new Error(`${body.id} 不是动态实体，不能设置动态速度。`);
      assertVector(command.velocity, `${command.id}.velocity`);
      body.velocity = deepClone(command.velocity);
      body.awake = true;
      body.sleepCounter = 0;
    } else if (command.type === 'set-kinematic-velocity') {
      if (body.kind !== 'kinematic') throw new Error(`${body.id} 不是运动学实体。`);
      assertVector(command.velocity, `${command.id}.velocity`);
      body.velocity = deepClone(command.velocity);
      body.awake = true;
    } else if (command.type === 'teleport') {
      assertVector(command.position, `${command.id}.position`);
      body.position = deepClone(command.position);
      if (command.clearVelocity) body.velocity = { x: 0, y: 0 };
      body.awake = body.kind !== 'static';
      body.sleepCounter = 0;
    } else if (command.type === 'wake') {
      if (body.kind === 'dynamic') {
        body.awake = true;
        body.sleepCounter = 0;
      }
    }
  }

  private selectSubsteps(): number {
    let required = 1;
    for (const body of this.bodiesById.values()) {
      if (!body.continuous || body.kind === 'static') continue;
      const displacement = ceilDivPositive(Math.max(abs(body.velocity.x), abs(body.velocity.y)), this.stepHz);
      const safeTravel = Math.max(1, truncDiv(minimumFeature(body), 2));
      required = Math.max(required, ceilDivPositive(displacement, safeTravel));
    }
    return clamp(required, 1, this.maxSubsteps);
  }

  private fieldAcceleration(body: RuntimeConstraintBody): IntVector2 {
    const result = { x: this.gravity.x + body.acceleration.x, y: this.gravity.y + body.acceleration.y };
    for (const field of this.fields) {
      if (!fieldApplies(field, body)) continue;
      if (field.type === 'uniform') {
        result.x += field.acceleration.x;
        result.y += field.acceleration.y;
      } else if (field.type === 'radial') {
        const delta = { x: field.center.x - body.position.x, y: field.center.y - body.position.y };
        const { normalQ, distance } = normalQFromDelta(delta);
        if (distance >= field.radius) continue;
        const magnitude = truncDiv(field.strength * (field.radius - distance), field.radius);
        const acceleration = scaleNormal(normalQ, magnitude);
        result.x += acceleration.x;
        result.y += acceleration.y;
      }
    }
    return result;
  }

  private applyDrag(body: RuntimeConstraintBody, denominator: number): void {
    let totalQ = body.linearDampingQ;
    for (const field of this.fields) if (field.type === 'linear-drag' && fieldApplies(field, body)) totalQ += field.coefficientQ;
    if (totalQ <= 0) return;
    const decrementQ = clamp(truncDiv(totalQ, denominator), 0, Q);
    const keepQ = Q - decrementQ;
    body.velocity.x = truncDiv(body.velocity.x * keepQ, Q);
    body.velocity.y = truncDiv(body.velocity.y * keepQ, Q);
  }

  private integrate(denominator: number, forces: Map<string, IntVector2>): void {
    for (const body of [...this.bodiesById.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      if (body.kind === 'static') continue;
      if (body.kind === 'kinematic') {
        body.position.x += truncDiv(body.velocity.x, denominator);
        body.position.y += truncDiv(body.velocity.y, denominator);
        continue;
      }
      if (!body.awake) continue;
      const acceleration = this.fieldAcceleration(body);
      const force = forces.get(body.id);
      if (force) {
        acceleration.x += truncDiv(force.x * body.inverseMassQ, Q);
        acceleration.y += truncDiv(force.y * body.inverseMassQ, Q);
      }
      body.velocity.x += truncDiv(acceleration.x, denominator);
      body.velocity.y += truncDiv(acceleration.y, denominator);
      this.applyDrag(body, denominator);
      body.position.x += truncDiv(body.velocity.x, denominator);
      body.position.y += truncDiv(body.velocity.y, denominator);
    }
  }

  private pairMaterial(a: RuntimeConstraintBody, b: RuntimeConstraintBody): PairMaterial {
    const key = materialPairKey(a.materialId, b.materialId);
    const override = this.interactions.get(key);
    return {
      enabled: override?.enabled !== false,
      sensorOnly: Boolean(override?.sensorOnly),
      restitutionQ: clamp(override?.restitutionQ ?? Math.min(a.restitutionQ, b.restitutionQ), 0, Q),
      frictionQ: clamp(override?.frictionQ ?? Math.min(a.frictionQ, b.frictionQ), 0, 4 * Q),
      key
    };
  }

  private candidatePairs(): Array<[RuntimeConstraintBody, RuntimeConstraintBody]> {
    const grid = new Map<string, string[]>();
    const sortedBodies = [...this.bodiesById.values()].sort((a, b) => a.id.localeCompare(b.id));
    for (const body of sortedBodies) {
      const aabb = bodyAabb(body);
      const minCellX = floorDiv(aabb.minX, this.gridCellSize);
      const maxCellX = floorDiv(aabb.maxX, this.gridCellSize);
      const minCellY = floorDiv(aabb.minY, this.gridCellSize);
      const maxCellY = floorDiv(aabb.maxY, this.gridCellSize);
      const cellCount = (maxCellX - minCellX + 1) * (maxCellY - minCellY + 1);
      if (cellCount > 4_096) throw new Error(`${body.id} 跨越过多空间网格：${cellCount}`);
      for (let x = minCellX; x <= maxCellX; x++) {
        for (let y = minCellY; y <= maxCellY; y++) {
          const key = `${x},${y}`;
          const list = grid.get(key) ?? [];
          list.push(body.id);
          grid.set(key, list);
        }
      }
    }
    const pairIds = new Set<string>();
    for (const key of [...grid.keys()].sort()) {
      const ids = [...new Set(grid.get(key)!)].sort();
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) pairIds.add(pairKey(ids[i]!, ids[j]!));
      }
    }
    const result: Array<[RuntimeConstraintBody, RuntimeConstraintBody]> = [];
    for (const key of [...pairIds].sort()) {
      const [aId, bId] = key.split('|');
      const a = this.bodiesById.get(aId!)!;
      const b = this.bodiesById.get(bId!)!;
      if (a.kind === 'static' && b.kind === 'static') continue;
      if (!filtersAllow(a, b)) continue;
      result.push([a, b]);
    }
    return result;
  }

  private resolveContact(a: RuntimeConstraintBody, b: RuntimeConstraintBody, geometry: ContactGeometry, microstep: number): ConstraintContact {
    const material = this.pairMaterial(a, b);
    const sensor = a.sensor || b.sensor || material.sensorOnly;
    const totalInv = a.inverseMassQ + b.inverseMassQ;
    let normalImpulse = 0;
    let tangentImpulse = 0;

    if (!sensor && totalInv > 0) {
      const correction = Math.max(0, geometry.penetration - 1);
      const moveA = truncDiv(correction * a.inverseMassQ, totalInv);
      const moveB = correction - moveA;
      const offsetA = scaleNormal(geometry.normalQ, moveA);
      const offsetB = scaleNormal(geometry.normalQ, moveB);
      if (a.kind === 'dynamic') {
        a.position.x -= offsetA.x;
        a.position.y -= offsetA.y;
        a.awake = true;
      }
      if (b.kind === 'dynamic') {
        b.position.x += offsetB.x;
        b.position.y += offsetB.y;
        b.awake = true;
      }

      const relativeVelocity = { x: b.velocity.x - a.velocity.x, y: b.velocity.y - a.velocity.y };
      const normalVelocity = dotNormal(relativeVelocity, geometry.normalQ);
      if (normalVelocity < 0) {
        normalImpulse = truncDiv(-normalVelocity * (Q + material.restitutionQ), totalInv);
        const deltaA = truncDiv(normalImpulse * a.inverseMassQ, Q);
        const deltaB = truncDiv(normalImpulse * b.inverseMassQ, Q);
        const impulseA = scaleNormal(geometry.normalQ, deltaA);
        const impulseB = scaleNormal(geometry.normalQ, deltaB);
        if (a.kind === 'dynamic') {
          a.velocity.x -= impulseA.x;
          a.velocity.y -= impulseA.y;
        }
        if (b.kind === 'dynamic') {
          b.velocity.x += impulseB.x;
          b.velocity.y += impulseB.y;
        }

        const tangentQ = { x: -geometry.normalQ.y, y: geometry.normalQ.x };
        const tangentVelocity = dotNormal(relativeVelocity, tangentQ);
        const rawTangent = truncDiv(-tangentVelocity * Q, totalInv);
        const maxTangent = truncDiv(abs(normalImpulse) * material.frictionQ, Q);
        tangentImpulse = clamp(rawTangent, -maxTangent, maxTangent);
        const tangentDeltaA = truncDiv(tangentImpulse * a.inverseMassQ, Q);
        const tangentDeltaB = truncDiv(tangentImpulse * b.inverseMassQ, Q);
        const tangentA = scaleNormal(tangentQ, tangentDeltaA);
        const tangentB = scaleNormal(tangentQ, tangentDeltaB);
        if (a.kind === 'dynamic') {
          a.velocity.x -= tangentA.x;
          a.velocity.y -= tangentA.y;
        }
        if (b.kind === 'dynamic') {
          b.velocity.x += tangentB.x;
          b.velocity.y += tangentB.y;
        }
      }
    }

    return {
      key: pairKey(a.id, b.id),
      bodyA: a.id,
      bodyB: b.id,
      normalQ: geometry.normalQ,
      penetration: geometry.penetration,
      point: geometry.point,
      normalImpulse,
      tangentImpulse,
      sensor,
      materialPair: material.key,
      microstep
    };
  }

  private solveContacts(microstep: number, diagnostics: ConstraintPhysicsSnapshot['diagnostics']): ConstraintContact[] {
    const contacts = new Map<string, ConstraintContact>();
    for (let iteration = 0; iteration < this.solverIterations; iteration++) {
      const pairs = this.candidatePairs();
      diagnostics.candidatePairs += pairs.length;
      let iterationContacts = 0;
      for (const [a, b] of pairs) {
        const material = this.pairMaterial(a, b);
        if (!material.enabled) continue;
        diagnostics.narrowPhaseTests++;
        const geometry = detectGeometry(a, b);
        if (!geometry) continue;
        const contact = this.resolveContact(a, b, geometry, microstep);
        contacts.set(contact.key, contact);
        iterationContacts++;
      }
      if (iterationContacts === 0) break;
    }
    diagnostics.resolvedContacts += contacts.size;
    return [...contacts.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  private solveConstraints(microstep: number, brokenEvents: ConstraintInteractionEvent[]): void {
    for (const constraint of [...this.constraintsById.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      if (!constraint.enabled || constraint.broken) continue;
      const a = this.bodiesById.get(constraint.bodyA)!;
      const b = this.bodiesById.get(constraint.bodyB)!;
      const totalInv = a.inverseMassQ + b.inverseMassQ;
      if (totalInv === 0) continue;
      const delta = { x: b.position.x - a.position.x, y: b.position.y - a.position.y };
      const fallback = { x: (a.id < b.id ? 1 : -1) * Q, y: 0 };
      const { normalQ, distance } = normalQFromDelta(delta, fallback);
      const error = distance - constraint.restLength;
      const correction = truncDiv(error * constraint.stiffnessQ, Q);
      const moveA = truncDiv(correction * a.inverseMassQ, totalInv);
      const moveB = correction - moveA;
      const offsetA = scaleNormal(normalQ, moveA);
      const offsetB = scaleNormal(normalQ, moveB);
      if (a.kind === 'dynamic') {
        a.position.x += offsetA.x;
        a.position.y += offsetA.y;
        a.awake = true;
      }
      if (b.kind === 'dynamic') {
        b.position.x -= offsetB.x;
        b.position.y -= offsetB.y;
        b.awake = true;
      }

      const relativeVelocity = { x: b.velocity.x - a.velocity.x, y: b.velocity.y - a.velocity.y };
      const axisVelocity = dotNormal(relativeVelocity, normalQ);
      const dampingImpulse = truncDiv(-axisVelocity * constraint.dampingQ, totalInv);
      const deltaA = truncDiv(dampingImpulse * a.inverseMassQ, Q);
      const deltaB = truncDiv(dampingImpulse * b.inverseMassQ, Q);
      const velocityA = scaleNormal(normalQ, deltaA);
      const velocityB = scaleNormal(normalQ, deltaB);
      if (a.kind === 'dynamic') {
        a.velocity.x -= velocityA.x;
        a.velocity.y -= velocityA.y;
      }
      if (b.kind === 'dynamic') {
        b.velocity.x += velocityB.x;
        b.velocity.y += velocityB.y;
      }

      constraint.lastImpulse = abs(correction) + abs(dampingImpulse);
      if (constraint.breakImpulse !== null && constraint.lastImpulse > constraint.breakImpulse) {
        constraint.broken = true;
        const base = {
          tick: this.tickValue + 1,
          kind: 'constraint' as const,
          phase: 'break' as const,
          subjects: [constraint.bodyA, constraint.bodyB].sort(),
          constraintId: constraint.id,
          microstep,
          impulse: constraint.lastImpulse
        };
        const evidenceHash = semanticHash(base);
        brokenEvents.push({
          id: `${this.worldId}:${this.tickValue + 1}:constraint:break:${constraint.id}`,
          tick: this.tickValue + 1,
          kind: 'constraint',
          phase: 'break',
          subjects: base.subjects,
          constraintId: constraint.id,
          evidenceHash
        });
      }
    }
  }

  private buildIslands(contacts: ConstraintContact[]): ConstraintIsland[] {
    const adjacency = new Map<string, Set<string>>();
    const contactByBody = new Map<string, Set<string>>();
    const constraintByBody = new Map<string, Set<string>>();
    for (const body of this.bodiesById.values()) adjacency.set(body.id, new Set());
    for (const contact of contacts) {
      adjacency.get(contact.bodyA)!.add(contact.bodyB);
      adjacency.get(contact.bodyB)!.add(contact.bodyA);
      for (const bodyId of [contact.bodyA, contact.bodyB]) {
        const set = contactByBody.get(bodyId) ?? new Set<string>();
        set.add(contact.key);
        contactByBody.set(bodyId, set);
      }
    }
    for (const constraint of this.constraintsById.values()) {
      if (!constraint.enabled || constraint.broken) continue;
      adjacency.get(constraint.bodyA)!.add(constraint.bodyB);
      adjacency.get(constraint.bodyB)!.add(constraint.bodyA);
      for (const bodyId of [constraint.bodyA, constraint.bodyB]) {
        const set = constraintByBody.get(bodyId) ?? new Set<string>();
        set.add(constraint.id);
        constraintByBody.set(bodyId, set);
      }
    }
    const visited = new Set<string>();
    const islands: ConstraintIsland[] = [];
    for (const bodyId of [...adjacency.keys()].sort()) {
      const body = this.bodiesById.get(bodyId)!;
      if (visited.has(bodyId) || body.kind === 'static') continue;
      const queue = [bodyId];
      const bodyIds: string[] = [];
      const contactKeys = new Set<string>();
      const constraintIds = new Set<string>();
      while (queue.length) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        bodyIds.push(current);
        for (const key of contactByBody.get(current) ?? []) contactKeys.add(key);
        for (const id of constraintByBody.get(current) ?? []) constraintIds.add(id);
        for (const neighbour of [...(adjacency.get(current) ?? [])].sort()) {
          if (!visited.has(neighbour) && this.bodiesById.get(neighbour)?.kind !== 'static') queue.push(neighbour);
        }
      }
      bodyIds.sort();
      islands.push({
        id: `island:${semanticHash(bodyIds)}`,
        bodyIds,
        contactKeys: [...contactKeys].sort(),
        constraintIds: [...constraintIds].sort(),
        awake: bodyIds.some(id => this.bodiesById.get(id)!.awake)
      });
    }
    return islands.sort((a, b) => a.id.localeCompare(b.id));
  }

  private updateSleeping(contacts: ConstraintContact[]): void {
    const touching = new Set<string>();
    for (const contact of contacts) if (!contact.sensor) {
      touching.add(contact.bodyA);
      touching.add(contact.bodyB);
    }
    for (const body of this.bodiesById.values()) {
      if (body.kind !== 'dynamic') continue;
      const speed = abs(body.velocity.x) + abs(body.velocity.y);
      if (touching.has(body.id) && speed <= body.sleepThreshold) {
        body.sleepCounter++;
        if (body.sleepCounter >= body.sleepTicks) {
          body.awake = false;
          body.velocity = { x: 0, y: 0 };
        }
      } else {
        body.sleepCounter = 0;
      }
    }
  }

  private interactionEvents(contacts: ConstraintContact[], brokenEvents: ConstraintInteractionEvent[]): ConstraintInteractionEvent[] {
    const current = new Map(contacts.map(contact => [contact.key, contact]));
    const events: ConstraintInteractionEvent[] = [...brokenEvents];
    for (const contact of contacts) {
      const phase: InteractionPhase = this.previousContacts.has(contact.key) ? 'persist' : 'begin';
      const kind: InteractionKind = contact.sensor ? 'sensor' : 'contact';
      const base = {
        tick: this.tickValue + 1,
        kind,
        phase,
        subjects: [contact.bodyA, contact.bodyB].sort(),
        pair: contact.key,
        contact
      };
      const evidenceHash = semanticHash(base);
      events.push({
        id: `${this.worldId}:${this.tickValue + 1}:${kind}:${phase}:${contact.key}`,
        ...base,
        evidenceHash
      });
    }
    for (const [key, previous] of this.previousContacts) {
      if (current.has(key)) continue;
      const kind: InteractionKind = previous.sensor ? 'sensor' : 'contact';
      const base = {
        tick: this.tickValue + 1,
        kind,
        phase: 'end' as const,
        subjects: [previous.bodyA, previous.bodyB].sort(),
        pair: key
      };
      const evidenceHash = semanticHash(base);
      events.push({
        id: `${this.worldId}:${this.tickValue + 1}:${kind}:end:${key}`,
        ...base,
        evidenceHash
      });
    }
    this.previousContacts = current;
    return events.sort((a, b) => a.id.localeCompare(b.id));
  }

  step(commands: ConstraintPhysicsCommand[] = []): ConstraintPhysicsStepResult {
    const applicable = commands.filter(command => command.tick === this.tickValue).sort((a, b) => a.id.localeCompare(b.id));
    const duplicate = applicable.find((command, index) => index > 0 && applicable[index - 1]!.id === command.id);
    if (duplicate) throw new Error(`命令 id 重复：${duplicate.id}`);
    const forces = new Map<string, IntVector2>();
    for (const command of applicable) this.applyCommand(command, forces);

    const microsteps = this.selectSubsteps();
    const denominator = this.stepHz * microsteps;
    const contactsAcrossTick = new Map<string, ConstraintContact>();
    const brokenEvents: ConstraintInteractionEvent[] = [];
    const diagnostics: ConstraintPhysicsSnapshot['diagnostics'] = { microsteps, candidatePairs: 0, narrowPhaseTests: 0, resolvedContacts: 0 };

    for (let microstep = 0; microstep < microsteps; microstep++) {
      this.integrate(denominator, forces);
      const contacts = this.solveContacts(microstep, diagnostics);
      for (let iteration = 0; iteration < this.solverIterations; iteration++) this.solveConstraints(microstep, brokenEvents);
      for (const contact of contacts) contactsAcrossTick.set(contact.key, contact);
    }

    const contacts = [...contactsAcrossTick.values()].sort((a, b) => a.key.localeCompare(b.key));
    this.updateSleeping(contacts);
    const events = this.interactionEvents(contacts, brokenEvents);
    const islands = this.buildIslands(contacts);
    this.tickValue++;
    this.contactsValue = contacts;
    this.eventsValue = events;
    this.islandsValue = islands;
    this.diagnosticsValue = diagnostics;
    return {
      snapshot: this.snapshot(),
      appliedCommandIds: applicable.map(command => command.id),
      contacts: deepClone(contacts),
      events: deepClone(events)
    };
  }

  run(steps: number, commands: ConstraintPhysicsCommand[] = []): ConstraintPhysicsSnapshot {
    if (!Number.isInteger(steps) || steps < 0) throw new Error('steps 必须是非负整数。');
    const byTick = new Map<number, ConstraintPhysicsCommand[]>();
    for (const command of commands) {
      if (!Number.isInteger(command.tick) || command.tick < 0) throw new Error(`命令 tick 无效：${command.id}`);
      const list = byTick.get(command.tick) ?? [];
      list.push(command);
      byTick.set(command.tick, list);
    }
    for (let index = 0; index < steps; index++) this.step(byTick.get(this.tickValue) ?? []);
    return this.snapshot();
  }

  snapshot(): ConstraintPhysicsSnapshot {
    const bodies = this.bodies();
    const constraints = this.constraints();
    const contacts = this.contacts();
    const events = this.events();
    const islands = this.islands();
    const contactRoot = semanticHash(contacts.map(contactSemantic));
    const constraintRoot = semanticHash(constraints.map(constraintSemantic));
    const islandRoot = semanticHash(islands);
    const stateView = {
      runtimeVersion: CONSTRAINT_PHYSICS_VERSION,
      worldId: this.worldId,
      tick: this.tickValue,
      scale: this.scale,
      stepHz: this.stepHz,
      gravity: this.gravity,
      solverIterations: this.solverIterations,
      gridCellSize: this.gridCellSize,
      maxSubsteps: this.maxSubsteps,
      configHash: this.configHash,
      bodies: bodies.map(bodySemantic),
      constraints: constraints.map(constraintSemantic),
      fields: this.fields,
      materialInteractions: this.interactionSpecs,
      contacts: contacts.map(contactSemantic),
      events: events.map(eventSemantic),
      islands,
      diagnostics: this.diagnosticsValue,
      contactRoot,
      constraintRoot,
      islandRoot
    };
    return {
      format: 'rsr.constraint-snapshot.v0.2',
      runtimeVersion: CONSTRAINT_PHYSICS_VERSION,
      worldId: this.worldId,
      tick: this.tickValue,
      logicalTime: { numerator: this.tickValue, denominator: this.stepHz },
      scale: this.scale,
      stepHz: this.stepHz,
      gravity: deepClone(this.gravity),
      solverIterations: this.solverIterations,
      gridCellSize: this.gridCellSize,
      maxSubsteps: this.maxSubsteps,
      configHash: this.configHash,
      bodies,
      constraints,
      fields: deepClone(this.fields),
      materialInteractions: deepClone(this.interactionSpecs),
      contacts,
      events,
      islands,
      diagnostics: deepClone(this.diagnosticsValue),
      contactRoot,
      constraintRoot,
      islandRoot,
      stateRoot: semanticHash(stateView)
    };
  }
}

export function replayConstraintPhysics(config: ConstraintPhysicsWorldConfig, steps: number, commands: ConstraintPhysicsCommand[] = []): ConstraintPhysicsSnapshot {
  return new ConstraintCausalPhysicsWorld(config).run(steps, commands);
}

function vectorValue(vector: IntVector2): Record<string, VSRValue> { return { x: vector.x, y: vector.y }; }
function shapeValue(shape: ConstraintShape): Record<string, VSRValue> {
  return shape.type === 'box'
    ? { type: shape.type, halfExtents: vectorValue(shape.halfExtents) }
    : { type: shape.type, radius: shape.radius };
}
function contactValue(contact: ConstraintContact): Record<string, VSRValue> {
  return {
    key: contact.key,
    bodyA: contact.bodyA,
    bodyB: contact.bodyB,
    normalQ: vectorValue(contact.normalQ),
    penetration: contact.penetration,
    point: vectorValue(contact.point),
    normalImpulse: contact.normalImpulse,
    tangentImpulse: contact.tangentImpulse,
    sensor: contact.sensor,
    materialPair: contact.materialPair,
    microstep: contact.microstep
  };
}

export function constraintSnapshotToCausalDelta(snapshot: ConstraintPhysicsSnapshot, baseRealityRoot: string): ConstraintRFECausalDelta {
  if (!baseRealityRoot) throw new Error('baseRealityRoot 不能为空。');
  const facts: ConstraintRFECausalDelta['facts'] = [];
  for (const body of snapshot.bodies) {
    const value: Record<string, VSRValue> = {
      position: vectorValue(body.position),
      velocity: vectorValue(body.velocity),
      shape: shapeValue(body.shape),
      awake: body.awake,
      materialId: body.materialId,
      sensor: body.sensor
    };
    const evidence = semanticHash({ worldId: snapshot.worldId, tick: snapshot.tick, body: bodySemantic(body), stateRoot: snapshot.stateRoot });
    facts.push({ subject: `body:${body.id}`, predicate: 'simulation.embodiment-state', value, evidence });
  }
  for (const constraint of snapshot.constraints) {
    const value: Record<string, VSRValue> = {
      type: constraint.type,
      bodyA: constraint.bodyA,
      bodyB: constraint.bodyB,
      restLength: constraint.restLength,
      enabled: constraint.enabled,
      broken: constraint.broken,
      lastImpulse: constraint.lastImpulse
    };
    const evidence = semanticHash({ worldId: snapshot.worldId, tick: snapshot.tick, constraint: constraintSemantic(constraint), stateRoot: snapshot.stateRoot });
    facts.push({ subject: `constraint:${constraint.id}`, predicate: 'simulation.constraint-state', value, evidence });
  }
  const events: ConstraintRFECausalDelta['events'] = snapshot.events.map(event => ({
    type: `simulation.${event.kind}.${event.phase}`,
    subjects: event.subjects.map(subject => `body:${subject}`),
    payload: {
      tick: event.tick,
      pair: event.pair ?? null,
      constraintId: event.constraintId ?? null,
      contact: event.contact ? contactValue(event.contact) : null
    },
    evidence: event.evidenceHash
  }));
  const base = {
    format: 'rfe.constraint-causal-delta.v0.2' as const,
    provisional: true as const,
    baseRealityRoot,
    sourceRuntime: `RSR-ConstraintPhysics/${CONSTRAINT_PHYSICS_VERSION}`,
    worldId: snapshot.worldId,
    tick: snapshot.tick,
    simulationRoot: snapshot.stateRoot,
    facts,
    events,
    diagnostics: snapshot.diagnostics
  };
  return { ...base, deltaRoot: semanticHash(base) };
}
