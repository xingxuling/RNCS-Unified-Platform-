import { deepClone, semanticHash, type VSRValue } from '../../spec/src/index.js';

export const EMBODIED_DYNAMICS_VERSION = '0.3.0-alpha.1';
export const DEFAULT_POSITION_SCALE = 1_000;
export const ANGLE_TURN_SCALE = 1_000_000;
export const Q = 1_000_000;

export interface IntVector2 { x: number; y: number }
export interface FloatVector2 { x: number; y: number }
export interface Aabb { minX: number; minY: number; maxX: number; maxY: number }
export type BodyKind = 'static' | 'dynamic' | 'kinematic';
export type BroadPhaseKind = 'sweep-and-prune' | 'uniform-grid';

export type ConvexShape =
  | { type: 'circle'; radius: number }
  | { type: 'box'; halfExtents: IntVector2; cornerRadius?: number }
  | { type: 'polygon'; vertices: IntVector2[]; radius?: number }
  | { type: 'capsule'; halfLength: number; radius: number }
  | { type: 'segment'; a: IntVector2; b: IntVector2; radius?: number; oneSided?: boolean };

export interface CollisionFilter {
  categoryBits?: number;
  maskBits?: number;
  groupIndex?: number;
}

export interface MaterialSpec {
  id: string;
  densityQ?: number;
  frictionQ?: number;
  restitutionQ?: number;
  rollingResistanceQ?: number;
  linearDampingQ?: number;
  angularDampingQ?: number;
}

export interface MaterialInteractionSpec {
  materialA: string;
  materialB: string;
  enabled?: boolean;
  sensorOnly?: boolean;
  frictionQ?: number;
  restitutionQ?: number;
  rollingResistanceQ?: number;
}

export interface FixtureSpec {
  id: string;
  shape: ConvexShape;
  localPosition?: IntVector2;
  localAngle?: number;
  materialId?: string;
  densityQ?: number;
  frictionQ?: number;
  restitutionQ?: number;
  sensor?: boolean;
  filter?: CollisionFilter;
  tags?: string[];
  data?: Record<string, VSRValue>;
}

export interface BodySpec {
  id: string;
  kind: BodyKind;
  position: IntVector2;
  angle?: number;
  velocity?: IntVector2;
  angularVelocity?: number;
  fixtures: FixtureSpec[];
  inverseMassQ?: number;
  inverseInertiaQ?: number;
  fixedRotation?: boolean;
  bullet?: boolean;
  enabled?: boolean;
  allowSleep?: boolean;
  sleepLinearThreshold?: number;
  sleepAngularThreshold?: number;
  sleepTicks?: number;
  gravityScaleQ?: number;
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
  falloff?: 'constant' | 'linear' | 'inverse-square';
  enabled?: boolean;
  tagsAny?: string[];
  categoryMask?: number;
}
export interface DragFieldSpec {
  id: string;
  type: 'drag';
  linearQ?: number;
  quadraticQ?: number;
  angularQ?: number;
  enabled?: boolean;
  tagsAny?: string[];
  categoryMask?: number;
}
export interface VortexFieldSpec {
  id: string;
  type: 'vortex';
  center: IntVector2;
  radius: number;
  tangentialStrength: number;
  radialStrength?: number;
  enabled?: boolean;
  tagsAny?: string[];
  categoryMask?: number;
}
export interface BuoyancyFieldSpec {
  id: string;
  type: 'buoyancy';
  surfaceY: number;
  densityQ: number;
  linearDragQ?: number;
  angularDragQ?: number;
  gravity: IntVector2;
  enabled?: boolean;
  tagsAny?: string[];
  categoryMask?: number;
}
export type FieldSpec = UniformFieldSpec | RadialFieldSpec | DragFieldSpec | VortexFieldSpec | BuoyancyFieldSpec;

export interface DistanceJointSpec {
  id: string;
  type: 'distance';
  bodyA: string;
  bodyB: string;
  localAnchorA?: IntVector2;
  localAnchorB?: IntVector2;
  restLength: number;
  minLength?: number;
  maxLength?: number;
  stiffnessQ?: number;
  dampingQ?: number;
  breakForce?: number;
  collideConnected?: boolean;
  enabled?: boolean;
  data?: Record<string, VSRValue>;
}
export interface RevoluteJointSpec {
  id: string;
  type: 'revolute';
  bodyA: string;
  bodyB: string;
  localAnchorA?: IntVector2;
  localAnchorB?: IntVector2;
  referenceAngle?: number;
  lowerAngle?: number;
  upperAngle?: number;
  motorSpeed?: number;
  maxMotorTorque?: number;
  stiffnessQ?: number;
  dampingQ?: number;
  breakForce?: number;
  breakTorque?: number;
  collideConnected?: boolean;
  enabled?: boolean;
  data?: Record<string, VSRValue>;
}
export interface PrismaticJointSpec {
  id: string;
  type: 'prismatic';
  bodyA: string;
  bodyB: string;
  localAnchorA?: IntVector2;
  localAnchorB?: IntVector2;
  localAxisA: IntVector2;
  lowerTranslation?: number;
  upperTranslation?: number;
  motorSpeed?: number;
  maxMotorForce?: number;
  stiffnessQ?: number;
  dampingQ?: number;
  breakForce?: number;
  collideConnected?: boolean;
  enabled?: boolean;
  data?: Record<string, VSRValue>;
}
export interface WeldJointSpec {
  id: string;
  type: 'weld';
  bodyA: string;
  bodyB: string;
  localAnchorA?: IntVector2;
  localAnchorB?: IntVector2;
  referenceAngle?: number;
  stiffnessQ?: number;
  dampingQ?: number;
  breakForce?: number;
  breakTorque?: number;
  collideConnected?: boolean;
  enabled?: boolean;
  data?: Record<string, VSRValue>;
}
export type JointSpec = DistanceJointSpec | RevoluteJointSpec | PrismaticJointSpec | WeldJointSpec;

export interface EmbodiedDynamicsWorldConfig {
  format: 'rsr.embodied-dynamics-world.v0.3';
  worldId: string;
  positionScale?: number;
  stepHz: number;
  gravity?: IntVector2;
  velocityIterations?: number;
  positionIterations?: number;
  broadPhase?: BroadPhaseKind;
  gridCellSize?: number;
  maxSubsteps?: number;
  ccdTargetFractionQ?: number;
  warmStart?: boolean;
  materials?: MaterialSpec[];
  materialInteractions?: MaterialInteractionSpec[];
  fields?: FieldSpec[];
  joints?: JointSpec[];
  bodies: BodySpec[];
}

export interface RuntimeFixture {
  id: string;
  shape: ConvexShape;
  localPosition: IntVector2;
  localAngle: number;
  materialId: string;
  densityQ: number;
  frictionQ: number;
  restitutionQ: number;
  sensor: boolean;
  filter: Required<CollisionFilter>;
  tags: string[];
  data: Record<string, VSRValue>;
}
export interface RuntimeBody {
  id: string;
  kind: BodyKind;
  position: IntVector2;
  angle: number;
  velocity: IntVector2;
  angularVelocity: number;
  fixtures: RuntimeFixture[];
  inverseMassQ: number;
  inverseInertiaQ: number;
  massQ: number;
  inertiaQ: number;
  fixedRotation: boolean;
  bullet: boolean;
  enabled: boolean;
  allowSleep: boolean;
  sleepLinearThreshold: number;
  sleepAngularThreshold: number;
  sleepTicks: number;
  sleepCounter: number;
  awake: boolean;
  gravityScaleQ: number;
  tags: string[];
  data: Record<string, VSRValue>;
}

export interface RuntimeJointBase {
  id: string;
  type: JointSpec['type'];
  bodyA: string;
  bodyB: string;
  enabled: boolean;
  broken: boolean;
  collideConnected: boolean;
  breakForce: number | null;
  breakTorque: number | null;
  lastForce: number;
  lastTorque: number;
  data: Record<string, VSRValue>;
}
export type RuntimeJoint = RuntimeJointBase & Record<string, VSRValue>;

export interface ContactPoint {
  point: IntVector2;
  separation: number;
  normalImpulse: number;
  tangentImpulse: number;
  featureId: string;
}
export interface ContactManifold {
  key: string;
  bodyA: string;
  bodyB: string;
  fixtureA: string;
  fixtureB: string;
  normalQ: IntVector2;
  points: ContactPoint[];
  sensor: boolean;
  materialPair: string;
  microstep: number;
  touching: boolean;
}

export type DynamicsEventPhase = 'begin' | 'persist' | 'end' | 'break' | 'sleep' | 'wake';
export type DynamicsEventKind = 'contact' | 'sensor' | 'joint' | 'body';
export interface DynamicsEvent {
  id: string;
  tick: number;
  kind: DynamicsEventKind;
  phase: DynamicsEventPhase;
  subjects: string[];
  pair?: string;
  jointId?: string;
  manifold?: ContactManifold;
  evidenceHash: string;
}

export interface DynamicsIsland {
  id: string;
  bodyIds: string[];
  contactKeys: string[];
  jointIds: string[];
  awake: boolean;
}

export interface RayCastHit {
  bodyId: string;
  fixtureId: string;
  fractionQ: number;
  point: IntVector2;
  normalQ: IntVector2;
}
export interface ShapeCastHit extends RayCastHit { iterations: number }

export type DynamicsCommand =
  | { id: string; tick: number; type: 'apply-impulse'; bodyId: string; impulse: IntVector2; worldPoint?: IntVector2 }
  | { id: string; tick: number; type: 'apply-force'; bodyId: string; force: IntVector2; worldPoint?: IntVector2 }
  | { id: string; tick: number; type: 'apply-torque'; bodyId: string; torque: number }
  | { id: string; tick: number; type: 'set-velocity'; bodyId: string; velocity: IntVector2 }
  | { id: string; tick: number; type: 'set-angular-velocity'; bodyId: string; angularVelocity: number }
  | { id: string; tick: number; type: 'set-kinematic-velocity'; bodyId: string; velocity: IntVector2; angularVelocity?: number }
  | { id: string; tick: number; type: 'set-transform'; bodyId: string; position: IntVector2; angle?: number; clearVelocity?: boolean }
  | { id: string; tick: number; type: 'wake'; bodyId: string }
  | { id: string; tick: number; type: 'set-joint-enabled'; jointId: string; enabled: boolean }
  | { id: string; tick: number; type: 'set-joint-motor'; jointId: string; motorSpeed: number; maxForceOrTorque: number };

export interface DynamicsDiagnostics {
  microsteps: number;
  fixtureProxies: number;
  candidatePairs: number;
  narrowPhaseTests: number;
  gjkCalls: number;
  epaCalls: number;
  resolvedContacts: number;
  warmStartedContacts: number;
  ccdBodies: number;
  velocityIterations: number;
  positionIterations: number;
  rayTests: number;
}

export interface EmbodiedDynamicsSnapshot {
  format: 'rsr.embodied-dynamics-snapshot.v0.3';
  runtimeVersion: string;
  worldId: string;
  tick: number;
  logicalTime: { numerator: number; denominator: number };
  positionScale: number;
  angleTurnScale: number;
  stepHz: number;
  gravity: IntVector2;
  broadPhase: BroadPhaseKind;
  velocityIterations: number;
  positionIterations: number;
  gridCellSize: number;
  maxSubsteps: number;
  ccdTargetFractionQ: number;
  warmStart: boolean;
  materials: Required<MaterialSpec>[];
  materialInteractions: MaterialInteractionSpec[];
  configHash: string;
  bodies: RuntimeBody[];
  joints: RuntimeJoint[];
  fields: FieldSpec[];
  contacts: ContactManifold[];
  events: DynamicsEvent[];
  islands: DynamicsIsland[];
  diagnostics: DynamicsDiagnostics;
  bodyRoot: string;
  contactRoot: string;
  jointRoot: string;
  islandRoot: string;
  queryRoot: string;
  stateRoot: string;
}

export interface EmbodiedDynamicsStepResult {
  snapshot: EmbodiedDynamicsSnapshot;
  appliedCommandIds: string[];
  contacts: ContactManifold[];
  events: DynamicsEvent[];
}

export interface EmbodiedDynamicsCausalDelta {
  format: 'rfe.embodied-dynamics-causal-delta.v0.3';
  provisional: true;
  baseRealityRoot: string;
  sourceRuntime: string;
  worldId: string;
  tick: number;
  simulationRoot: string;
  facts: Array<{ subject: string; predicate: string; value: VSRValue; evidence: string }>;
  events: Array<{ type: string; subjects: string[]; payload: Record<string, VSRValue>; evidence: string }>;
  diagnostics: DynamicsDiagnostics;
  deltaRoot: string;
}

interface FBody {
  runtime: RuntimeBody;
  p: FloatVector2;
  a: number;
  v: FloatVector2;
  w: number;
  invM: number;
  invI: number;
  force: FloatVector2;
  torque: number;
}
interface FFixture {
  body: FBody;
  fixture: RuntimeFixture;
  center: FloatVector2;
  angle: number;
}
interface Proxy { bodyId: string; fixtureId: string; aabb: Aabb; fixture: FFixture }
interface PairMaterial { enabled: boolean; sensorOnly: boolean; friction: number; restitution: number; rollingResistance: number; key: string }
interface GjkVertex { p: FloatVector2; a: FloatVector2; b: FloatVector2 }
interface CollisionGeometry { normal: FloatVector2; depth: number; point: FloatVector2; featureId: string }
interface SolverContact {
  manifold: ContactManifold;
  a: FBody;
  b: FBody;
  point: FloatVector2;
  normal: FloatVector2;
  tangent: FloatVector2;
  rA: FloatVector2;
  rB: FloatVector2;
  penetration: number;
  normalMass: number;
  tangentMass: number;
  bias: number;
  restitutionBias: number;
  accumulatedNormal: number;
  accumulatedTangent: number;
  friction: number;
  rollingResistance: number;
}

const EPS = 1e-9;
const TWO_PI = Math.PI * 2;
function finite(n: number, label: string): number { if (!Number.isFinite(n)) throw new Error(`${label} 必须是有限数。`); return n; }
function safeInt(n: number, label: string): number { if (!Number.isSafeInteger(n)) throw new Error(`${label} 必须是安全整数。`); return n; }
function q(n: number, scale = Q): number { return Math.round(finite(n, '量化输入') * scale) / scale; }
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
function pairKey(a: string, b: string): string { return a < b ? `${a}|${b}` : `${b}|${a}`; }
function materialPairKey(a: string, b: string): string { return a < b ? `${a}|${b}` : `${b}|${a}`; }
function add(a: FloatVector2, b: FloatVector2): FloatVector2 { return { x: a.x + b.x, y: a.y + b.y }; }
function sub(a: FloatVector2, b: FloatVector2): FloatVector2 { return { x: a.x - b.x, y: a.y - b.y }; }
function mul(a: FloatVector2, s: number): FloatVector2 { return { x: a.x * s, y: a.y * s }; }
function dot(a: FloatVector2, b: FloatVector2): number { return a.x * b.x + a.y * b.y; }
function cross(a: FloatVector2, b: FloatVector2): number { return a.x * b.y - a.y * b.x; }
function crossSV(s: number, v: FloatVector2): FloatVector2 { return { x: -s * v.y, y: s * v.x }; }
function len2(v: FloatVector2): number { return dot(v, v); }
function len(v: FloatVector2): number { return Math.sqrt(len2(v)); }
function normalize(v: FloatVector2, fallback: FloatVector2 = { x: 1, y: 0 }): FloatVector2 { const l = len(v); return l > EPS ? mul(v, 1 / l) : fallback; }
function perp(v: FloatVector2): FloatVector2 { return { x: -v.y, y: v.x }; }
function triple(a: FloatVector2, b: FloatVector2, c: FloatVector2): FloatVector2 { return sub(mul(b, dot(c, a)), mul(a, dot(c, b))); }
function rotate(v: FloatVector2, turns: number): FloatVector2 { const r = turns * TWO_PI; const c = Math.cos(r); const s = Math.sin(r); return { x: q(v.x * c - v.y * s), y: q(v.x * s + v.y * c) }; }
function invRotate(v: FloatVector2, turns: number): FloatVector2 { return rotate(v, -turns); }
function turnIntToTurns(angle: number): number { return angle / ANGLE_TURN_SCALE; }
function turnsToTurnInt(turns: number): number { return Math.round((((turns % 1) + 1) % 1) * ANGLE_TURN_SCALE); }
function signedTurnsToInt(turns: number): number { return Math.round(turns * ANGLE_TURN_SCALE); }
function wrapSignedTurns(turns: number): number { return ((turns + 0.5) % 1 + 1) % 1 - 0.5; }
function intVecToFloat(v: IntVector2, scale: number): FloatVector2 { return { x: v.x / scale, y: v.y / scale }; }
function floatVecToInt(v: FloatVector2, scale: number): IntVector2 { return { x: Math.round(v.x * scale), y: Math.round(v.y * scale) }; }
function requiredFilter(filter?: CollisionFilter): Required<CollisionFilter> { return { categoryBits: (filter?.categoryBits ?? 1) >>> 0, maskBits: (filter?.maskBits ?? 0xffffffff) >>> 0, groupIndex: Math.trunc(filter?.groupIndex ?? 0) }; }
function aabbOverlap(a: Aabb, b: Aabb): boolean { return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY; }
function aabbContainsPoint(a: Aabb, p: FloatVector2): boolean { return p.x >= a.minX && p.x <= a.maxX && p.y >= a.minY && p.y <= a.maxY; }
function expandAabb(a: Aabb, amount: number): Aabb { return { minX: a.minX - amount, minY: a.minY - amount, maxX: a.maxX + amount, maxY: a.maxY + amount }; }
function unionAabb(a: Aabb, b: Aabb): Aabb { return { minX: Math.min(a.minX, b.minX), minY: Math.min(a.minY, b.minY), maxX: Math.max(a.maxX, b.maxX), maxY: Math.max(a.maxY, b.maxY) }; }
function closestPointSegment(p: FloatVector2, a: FloatVector2, b: FloatVector2): FloatVector2 { const ab = sub(b, a); const d = len2(ab); if (d <= EPS) return a; return add(a, mul(ab, clamp(dot(sub(p, a), ab) / d, 0, 1))); }
function pointInPolygon(point: FloatVector2, vertices: FloatVector2[]): boolean { let sign = 0; for (let i = 0; i < vertices.length; i++) { const a = vertices[i]!; const b = vertices[(i + 1) % vertices.length]!; const c = cross(sub(b, a), sub(point, a)); if (Math.abs(c) <= EPS) continue; const s = Math.sign(c); if (sign === 0) sign = s; else if (s !== sign) return false; } return true; }
function polygonArea(vertices: FloatVector2[]): number { let area = 0; for (let i = 0; i < vertices.length; i++) area += cross(vertices[i]!, vertices[(i + 1) % vertices.length]!); return area / 2; }
function ensureCCW(vertices: FloatVector2[]): FloatVector2[] { return polygonArea(vertices) < 0 ? [...vertices].reverse() : vertices; }
function convexHull(points: FloatVector2[]): FloatVector2[] { const unique = [...new Map(points.map(p => [`${q(p.x)}:${q(p.y)}`, { x: q(p.x), y: q(p.y) }])).values()].sort((a, b) => a.x - b.x || a.y - b.y); if (unique.length < 3) throw new Error('凸多边形至少需要 3 个非共线顶点。'); const lower: FloatVector2[] = []; for (const p of unique) { while (lower.length >= 2 && cross(sub(lower[lower.length - 1]!, lower[lower.length - 2]!), sub(p, lower[lower.length - 1]!)) <= 0) lower.pop(); lower.push(p); } const upper: FloatVector2[] = []; for (let i = unique.length - 1; i >= 0; i--) { const p = unique[i]!; while (upper.length >= 2 && cross(sub(upper[upper.length - 1]!, upper[upper.length - 2]!), sub(p, upper[upper.length - 1]!)) <= 0) upper.pop(); upper.push(p); } lower.pop(); upper.pop(); const hull = lower.concat(upper); if (Math.abs(polygonArea(hull)) <= EPS) throw new Error('凸多边形顶点不能共线。'); return ensureCCW(hull); }

export function toDynamicsFixed(value: number, scale = DEFAULT_POSITION_SCALE): number { return Math.round(finite(value, '固定点输入') * scale); }
export function fromDynamicsFixed(value: number, scale = DEFAULT_POSITION_SCALE): number { return value / scale; }
export function dynamicsVec(x: number, y: number, scale = DEFAULT_POSITION_SCALE): IntVector2 { return { x: toDynamicsFixed(x, scale), y: toDynamicsFixed(y, scale) }; }
export function turns(value: number): number { return turnsToTurnInt(value); }
export function signedTurns(value: number): number { return signedTurnsToInt(value); }

function validateShape(shape: ConvexShape, scale: number, label: string): ConvexShape {
  if (shape.type === 'circle') { safeInt(shape.radius, `${label}.radius`); if (shape.radius <= 0) throw new Error(`${label}.radius 必须大于 0。`); return deepClone(shape); }
  if (shape.type === 'box') { safeInt(shape.halfExtents.x, `${label}.halfExtents.x`); safeInt(shape.halfExtents.y, `${label}.halfExtents.y`); if (shape.halfExtents.x <= 0 || shape.halfExtents.y <= 0) throw new Error(`${label} 半尺寸必须大于 0。`); return deepClone(shape); }
  if (shape.type === 'capsule') { safeInt(shape.halfLength, `${label}.halfLength`); safeInt(shape.radius, `${label}.radius`); if (shape.halfLength < 0 || shape.radius <= 0) throw new Error(`${label} 胶囊参数无效。`); return deepClone(shape); }
  if (shape.type === 'segment') { safeInt(shape.a.x, `${label}.a.x`); safeInt(shape.a.y, `${label}.a.y`); safeInt(shape.b.x, `${label}.b.x`); safeInt(shape.b.y, `${label}.b.y`); if (shape.a.x === shape.b.x && shape.a.y === shape.b.y) throw new Error(`${label} 线段端点不能重合。`); return deepClone(shape); }
  if (shape.vertices.length < 3 || shape.vertices.length > 16) throw new Error(`${label} 凸多边形顶点数必须为 3..16。`);
  const hull = convexHull(shape.vertices.map(v => intVecToFloat(v, scale)));
  return { type: 'polygon', vertices: hull.map(v => floatVecToInt(v, scale)), radius: shape.radius ?? 0 };
}

function shapeMassData(shape: ConvexShape, density: number, scale: number): { mass: number; inertia: number } {
  if (density <= 0) return { mass: 0, inertia: 0 };
  if (shape.type === 'circle') { const r = shape.radius / scale; const mass = Math.PI * r * r * density; return { mass, inertia: 0.5 * mass * r * r }; }
  if (shape.type === 'box') { const w = shape.halfExtents.x * 2 / scale; const h = shape.halfExtents.y * 2 / scale; const mass = w * h * density; return { mass, inertia: mass * (w * w + h * h) / 12 }; }
  if (shape.type === 'capsule') { const l = shape.halfLength * 2 / scale; const r = shape.radius / scale; const rectMass = l * (2 * r) * density; const circleMass = Math.PI * r * r * density; const mass = rectMass + circleMass; const rectI = rectMass * (l * l + 4 * r * r) / 12; const capI = 0.5 * circleMass * r * r + circleMass * (l * l / 4); return { mass, inertia: rectI + capI }; }
  if (shape.type === 'segment') { const l = len(sub(intVecToFloat(shape.b, scale), intVecToFloat(shape.a, scale))); const r = (shape.radius ?? Math.max(1, Math.round(scale / 1000))) / scale; const mass = l * 2 * r * density; return { mass, inertia: mass * l * l / 12 }; }
  const verts = shape.vertices.map(v => intVecToFloat(v, scale)); let area = 0; let inertiaIntegral = 0; for (let i = 0; i < verts.length; i++) { const a = verts[i]!; const b = verts[(i + 1) % verts.length]!; const cr = cross(a, b); area += cr; inertiaIntegral += cr * (dot(a, a) + dot(a, b) + dot(b, b)); } area = Math.abs(area) / 2; const mass = area * density; const inertia = Math.abs(density * inertiaIntegral / 12); return { mass, inertia };
}

function materialMap(config: EmbodiedDynamicsWorldConfig): Map<string, Required<MaterialSpec>> {
  const map = new Map<string, Required<MaterialSpec>>();
  map.set('default', { id: 'default', densityQ: Q, frictionQ: 500_000, restitutionQ: 0, rollingResistanceQ: 0, linearDampingQ: 0, angularDampingQ: 0 });
  for (const m of config.materials ?? []) map.set(m.id, { id: m.id, densityQ: m.densityQ ?? Q, frictionQ: m.frictionQ ?? 500_000, restitutionQ: m.restitutionQ ?? 0, rollingResistanceQ: m.rollingResistanceQ ?? 0, linearDampingQ: m.linearDampingQ ?? 0, angularDampingQ: m.angularDampingQ ?? 0 });
  return map;
}

function normalizeBody(spec: BodySpec, config: EmbodiedDynamicsWorldConfig, materials: Map<string, Required<MaterialSpec>>): RuntimeBody {
  const scale = config.positionScale ?? DEFAULT_POSITION_SCALE;
  if (!spec.id) throw new Error('Body id 不能为空。');
  if (!spec.fixtures.length) throw new Error(`Body ${spec.id} 至少需要一个 fixture。`);
  const fixtures: RuntimeFixture[] = spec.fixtures.map((f, i) => {
    const materialId = f.materialId ?? 'default';
    const material = materials.get(materialId); if (!material) throw new Error(`Body ${spec.id} fixture ${f.id} 引用了未知材质 ${materialId}。`);
    return {
      id: f.id || `fixture-${i}`,
      shape: validateShape(f.shape, scale, `${spec.id}.${f.id}.shape`),
      localPosition: deepClone(f.localPosition ?? { x: 0, y: 0 }),
      localAngle: f.localAngle ?? 0,
      materialId,
      densityQ: f.densityQ ?? material.densityQ,
      frictionQ: f.frictionQ ?? material.frictionQ,
      restitutionQ: f.restitutionQ ?? material.restitutionQ,
      sensor: Boolean(f.sensor),
      filter: requiredFilter(f.filter),
      tags: [...(f.tags ?? [])],
      data: deepClone(f.data ?? {})
    };
  });
  let mass = 0; let inertia = 0;
  for (const f of fixtures) {
    const md = shapeMassData(f.shape, f.densityQ / Q, scale);
    const local = intVecToFloat(f.localPosition, scale);
    mass += md.mass;
    inertia += md.inertia + md.mass * len2(local);
  }
  const dynamic = spec.kind === 'dynamic';
  const invM = spec.inverseMassQ !== undefined ? spec.inverseMassQ / Q : dynamic && mass > EPS ? 1 / mass : 0;
  const invI = spec.fixedRotation ? 0 : spec.inverseInertiaQ !== undefined ? spec.inverseInertiaQ / Q : dynamic && inertia > EPS ? 1 / inertia : 0;
  return {
    id: spec.id,
    kind: spec.kind,
    position: deepClone(spec.position),
    angle: spec.angle ?? 0,
    velocity: deepClone(spec.velocity ?? { x: 0, y: 0 }),
    angularVelocity: spec.angularVelocity ?? 0,
    fixtures,
    inverseMassQ: Math.round(invM * Q),
    inverseInertiaQ: Math.round(invI * Q),
    massQ: invM > EPS ? Math.round((1 / invM) * Q) : 0,
    inertiaQ: invI > EPS ? Math.round((1 / invI) * Q) : 0,
    fixedRotation: Boolean(spec.fixedRotation),
    bullet: Boolean(spec.bullet),
    enabled: spec.enabled !== false,
    allowSleep: spec.allowSleep !== false,
    sleepLinearThreshold: spec.sleepLinearThreshold ?? Math.round(scale * 0.02),
    sleepAngularThreshold: spec.sleepAngularThreshold ?? signedTurnsToInt(0.002),
    sleepTicks: spec.sleepTicks ?? Math.max(1, Math.round(config.stepHz / 2)),
    sleepCounter: 0,
    awake: spec.kind !== 'static',
    gravityScaleQ: spec.gravityScaleQ ?? Q,
    tags: [...(spec.tags ?? [])],
    data: deepClone(spec.data ?? {})
  };
}

function toFBody(body: RuntimeBody, scale: number): FBody {
  return { runtime: body, p: intVecToFloat(body.position, scale), a: turnIntToTurns(body.angle), v: intVecToFloat(body.velocity, scale), w: body.angularVelocity / ANGLE_TURN_SCALE, invM: body.inverseMassQ / Q, invI: body.inverseInertiaQ / Q, force: { x: 0, y: 0 }, torque: 0 };
}
function commitFBody(body: FBody, scale: number): void { body.runtime.position = floatVecToInt({ x: q(body.p.x), y: q(body.p.y) }, scale); body.runtime.angle = turnsToTurnInt(q(body.a)); body.runtime.velocity = floatVecToInt({ x: q(body.v.x), y: q(body.v.y) }, scale); body.runtime.angularVelocity = signedTurnsToInt(q(body.w)); }
function fixtureWorld(body: FBody, fixture: RuntimeFixture, scale: number): FFixture { const local = intVecToFloat(fixture.localPosition, scale); return { body, fixture, center: add(body.p, rotate(local, body.a)), angle: body.a + turnIntToTurns(fixture.localAngle) }; }

function shapeVertices(ff: FFixture, scale: number): FloatVector2[] {
  const s = ff.fixture.shape;
  let local: FloatVector2[];
  if (s.type === 'box') { const hx = s.halfExtents.x / scale; const hy = s.halfExtents.y / scale; local = [{ x: -hx, y: -hy }, { x: hx, y: -hy }, { x: hx, y: hy }, { x: -hx, y: hy }]; }
  else if (s.type === 'polygon') local = s.vertices.map(v => intVecToFloat(v, scale));
  else if (s.type === 'segment') local = [intVecToFloat(s.a, scale), intVecToFloat(s.b, scale)];
  else return [];
  return local.map(v => add(ff.center, rotate(v, ff.angle)));
}
function support(ff: FFixture, direction: FloatVector2, scale: number): FloatVector2 {
  const dir = normalize(direction);
  const s = ff.fixture.shape;
  if (s.type === 'circle') return add(ff.center, mul(dir, s.radius / scale));
  if (s.type === 'capsule') { const axis = rotate({ x: 1, y: 0 }, ff.angle); const endpoint = dot(axis, dir) >= 0 ? add(ff.center, mul(axis, s.halfLength / scale)) : sub(ff.center, mul(axis, s.halfLength / scale)); return add(endpoint, mul(dir, s.radius / scale)); }
  if (s.type === 'segment') { const verts = shapeVertices(ff, scale); const best = dot(verts[0]!, dir) > dot(verts[1]!, dir) ? verts[0]! : verts[1]!; return add(best, mul(dir, (s.radius ?? 0) / scale)); }
  const verts = shapeVertices(ff, scale); let best = verts[0]!; let bestDot = dot(best, dir); for (let i = 1; i < verts.length; i++) { const d = dot(verts[i]!, dir); if (d > bestDot) { best = verts[i]!; bestDot = d; } } const radius = s.type === 'box' ? (s.cornerRadius ?? 0) / scale : (s.radius ?? 0) / scale; return add(best, mul(dir, radius));
}
function fixtureCenter(ff: FFixture): FloatVector2 { return ff.center; }
function fixtureAabb(ff: FFixture, scale: number): Aabb { const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]; const px = support(ff, dirs[0]!, scale); const nx = support(ff, dirs[1]!, scale); const py = support(ff, dirs[2]!, scale); const ny = support(ff, dirs[3]!, scale); return { minX: nx.x, minY: ny.y, maxX: px.x, maxY: py.y }; }
function supportMinkowski(a: FFixture, b: FFixture, direction: FloatVector2, scale: number): GjkVertex { const pa = support(a, direction, scale); const pb = support(b, mul(direction, -1), scale); return { p: sub(pa, pb), a: pa, b: pb }; }

function handleSimplex(simplex: GjkVertex[], direction: FloatVector2): { contains: boolean; direction: FloatVector2 } {
  const a = simplex[simplex.length - 1]!.p; const ao = mul(a, -1);
  if (simplex.length === 2) { const b = simplex[0]!.p; const ab = sub(b, a); if (dot(ab, ao) > 0) { let d = triple(ab, ao, ab); if (len2(d) <= EPS) d = perp(ab); return { contains: false, direction: d }; } simplex.splice(0, 1); return { contains: false, direction: ao }; }
  const b = simplex[1]!.p; const c = simplex[0]!.p; const ab = sub(b, a); const ac = sub(c, a); const abPerp = triple(ac, ab, ab); if (dot(abPerp, ao) > 0) { simplex.splice(0, 1); return { contains: false, direction: abPerp }; } const acPerp = triple(ab, ac, ac); if (dot(acPerp, ao) > 0) { simplex.splice(1, 1); return { contains: false, direction: acPerp }; } return { contains: true, direction };
}
function gjk(a: FFixture, b: FFixture, scale: number, diagnostics?: DynamicsDiagnostics): { hit: boolean; simplex: GjkVertex[] } {
  diagnostics && diagnostics.gjkCalls++;
  let direction = sub(fixtureCenter(b), fixtureCenter(a)); if (len2(direction) <= EPS) direction = { x: 1, y: 0 };
  const simplex: GjkVertex[] = [supportMinkowski(a, b, direction, scale)]; direction = mul(simplex[0]!.p, -1);
  for (let i = 0; i < 24; i++) { const v = supportMinkowski(a, b, direction, scale); if (dot(v.p, direction) <= 1e-10) return { hit: false, simplex }; simplex.push(v); const result = handleSimplex(simplex, direction); direction = result.direction; if (result.contains) return { hit: true, simplex }; }
  return { hit: true, simplex };
}
function epa(a: FFixture, b: FFixture, simplexInput: GjkVertex[], scale: number, diagnostics?: DynamicsDiagnostics): CollisionGeometry | undefined {
  diagnostics && diagnostics.epaCalls++;
  const poly = [...simplexInput]; if (poly.length < 3) return undefined;
  if (cross(sub(poly[1]!.p, poly[0]!.p), sub(poly[2]!.p, poly[0]!.p)) < 0) [poly[1], poly[2]] = [poly[2]!, poly[1]!];
  for (let iteration = 0; iteration < 32; iteration++) {
    let minDistance = Infinity; let minIndex = 0; let bestNormal: FloatVector2 = { x: 1, y: 0 };
    for (let i = 0; i < poly.length; i++) { const j = (i + 1) % poly.length; const edge = sub(poly[j]!.p, poly[i]!.p); let normal = normalize({ x: edge.y, y: -edge.x }); let distance = dot(normal, poly[i]!.p); if (distance < 0) { normal = mul(normal, -1); distance = -distance; } if (distance < minDistance) { minDistance = distance; minIndex = j; bestNormal = normal; } }
    const vertex = supportMinkowski(a, b, bestNormal, scale); const distance = dot(vertex.p, bestNormal);
    if (distance - minDistance < 1e-6) { let normal = bestNormal; const centerDelta = sub(fixtureCenter(b), fixtureCenter(a)); if (dot(normal, centerDelta) < 0) normal = mul(normal, -1); const pa = support(a, normal, scale); const pb = support(b, mul(normal, -1), scale); return { normal, depth: Math.max(0, distance), point: mul(add(pa, pb), 0.5), featureId: `epa:${minIndex}` }; }
    poly.splice(minIndex, 0, vertex);
  }
  return undefined;
}
function circleCircle(a: FFixture, b: FFixture, scale: number): CollisionGeometry | undefined { const sa = a.fixture.shape; const sb = b.fixture.shape; if (sa.type !== 'circle' || sb.type !== 'circle') return undefined; const delta = sub(b.center, a.center); const distance = len(delta); const total = (sa.radius + sb.radius) / scale; if (distance >= total) return undefined; const normal = normalize(delta, { x: 1, y: 0 }); return { normal, depth: total - distance, point: add(a.center, mul(normal, sa.radius / scale - (total - distance) / 2)), featureId: 'circle-circle' }; }
function collide(a: FFixture, b: FFixture, scale: number, diagnostics?: DynamicsDiagnostics): CollisionGeometry | undefined { const direct = circleCircle(a, b, scale); if (direct) return direct; const result = gjk(a, b, scale, diagnostics); return result.hit ? epa(a, b, result.simplex, scale, diagnostics) : undefined; }

function canCollide(a: RuntimeFixture, b: RuntimeFixture): boolean { if (a.filter.groupIndex !== 0 && a.filter.groupIndex === b.filter.groupIndex) return a.filter.groupIndex > 0; return (a.filter.maskBits & b.filter.categoryBits) !== 0 && (b.filter.maskBits & a.filter.categoryBits) !== 0; }
function bodyFixtureKey(bodyId: string, fixtureId: string): string { return `${bodyId}/${fixtureId}`; }

function rayAabb(origin: FloatVector2, delta: FloatVector2, aabb: Aabb): number | undefined { let tmin = 0; let tmax = 1; for (const axis of ['x', 'y'] as const) { const o = origin[axis]; const d = delta[axis]; const min = axis === 'x' ? aabb.minX : aabb.minY; const max = axis === 'x' ? aabb.maxX : aabb.maxY; if (Math.abs(d) < EPS) { if (o < min || o > max) return undefined; } else { const inv = 1 / d; let t1 = (min - o) * inv; let t2 = (max - o) * inv; if (t1 > t2) [t1, t2] = [t2, t1]; tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if (tmin > tmax) return undefined; } } return tmin; }
function pointInFixture(point: FloatVector2, ff: FFixture, scale: number): boolean { const local = invRotate(sub(point, ff.center), ff.angle); const s = ff.fixture.shape; if (s.type === 'circle') return len2(local) <= (s.radius / scale) ** 2; if (s.type === 'box') return Math.abs(local.x) <= s.halfExtents.x / scale && Math.abs(local.y) <= s.halfExtents.y / scale; if (s.type === 'capsule') { const a = { x: -s.halfLength / scale, y: 0 }; const b = { x: s.halfLength / scale, y: 0 }; return len2(sub(local, closestPointSegment(local, a, b))) <= (s.radius / scale) ** 2; } if (s.type === 'segment') { const a = intVecToFloat(s.a, scale); const b = intVecToFloat(s.b, scale); const r = (s.radius ?? 0) / scale; return len2(sub(local, closestPointSegment(local, a, b))) <= r * r; } return pointInPolygon(local, s.vertices.map(v => intVecToFloat(v, scale))); }

function createRuntimeJoint(spec: JointSpec): RuntimeJoint {
  const common: RuntimeJoint = {
    id: spec.id, type: spec.type, bodyA: spec.bodyA, bodyB: spec.bodyB,
    enabled: spec.enabled !== false, broken: false, collideConnected: Boolean(spec.collideConnected),
    breakForce: spec.breakForce ?? null, breakTorque: 'breakTorque' in spec ? spec.breakTorque ?? null : null,
    lastForce: 0, lastTorque: 0, data: deepClone(spec.data ?? {})
  };
  return Object.assign(common, deepClone(spec)) as RuntimeJoint;
}

export class EmbodiedDynamicsWorld {
  configHash: string;
  readonly worldId: string;
  readonly positionScale: number;
  readonly stepHz: number;
  readonly gravity: IntVector2;
  readonly velocityIterations: number;
  readonly positionIterations: number;
  readonly broadPhase: BroadPhaseKind;
  readonly gridCellSize: number;
  readonly maxSubsteps: number;
  readonly ccdTargetFractionQ: number;
  readonly warmStart: boolean;
  private readonly bodies = new Map<string, RuntimeBody>();
  private readonly joints = new Map<string, RuntimeJoint>();
  private readonly fields: FieldSpec[];
  private readonly materials: Map<string, Required<MaterialSpec>>;
  private readonly interactions: MaterialInteractionSpec[];
  private tickValue = 0;
  private previousContacts = new Map<string, ContactManifold>();
  private contactCache = new Map<string, { normal: number; tangent: number }>();
  private eventsValue: DynamicsEvent[] = [];
  private contactsValue: ContactManifold[] = [];
  private islandsValue: DynamicsIsland[] = [];
  private diagnosticsValue: DynamicsDiagnostics = { microsteps: 1, fixtureProxies: 0, candidatePairs: 0, narrowPhaseTests: 0, gjkCalls: 0, epaCalls: 0, resolvedContacts: 0, warmStartedContacts: 0, ccdBodies: 0, velocityIterations: 0, positionIterations: 0, rayTests: 0 };
  private queryLog: Array<Record<string, VSRValue>> = [];

  constructor(config: EmbodiedDynamicsWorldConfig) {
    if (config.format !== 'rsr.embodied-dynamics-world.v0.3') throw new Error(`不支持世界格式 ${config.format}。`);
    this.worldId = config.worldId;
    this.positionScale = config.positionScale ?? DEFAULT_POSITION_SCALE;
    this.stepHz = config.stepHz;
    if (!Number.isInteger(this.stepHz) || this.stepHz <= 0) throw new Error('stepHz 必须是正整数。');
    this.gravity = deepClone(config.gravity ?? { x: 0, y: Math.round(this.positionScale * 9.8) });
    this.velocityIterations = config.velocityIterations ?? 8;
    this.positionIterations = config.positionIterations ?? 3;
    this.broadPhase = config.broadPhase ?? 'sweep-and-prune';
    this.gridCellSize = config.gridCellSize ?? this.positionScale * 2;
    this.maxSubsteps = config.maxSubsteps ?? 32;
    this.ccdTargetFractionQ = config.ccdTargetFractionQ ?? 350_000;
    this.warmStart = config.warmStart !== false;
    this.materials = materialMap(config);
    this.interactions = deepClone(config.materialInteractions ?? []);
    this.fields = deepClone(config.fields ?? []);
    this.configHash = semanticHash(config);
    for (const spec of config.bodies) { if (this.bodies.has(spec.id)) throw new Error(`重复 body id ${spec.id}。`); this.bodies.set(spec.id, normalizeBody(spec, config, this.materials)); }
    for (const spec of config.joints ?? []) { if (!this.bodies.has(spec.bodyA) || !this.bodies.has(spec.bodyB)) throw new Error(`Joint ${spec.id} 引用了不存在的 body。`); this.joints.set(spec.id, createRuntimeJoint(spec)); }
  }

  static fromSnapshot(snapshot: EmbodiedDynamicsSnapshot): EmbodiedDynamicsWorld {
    const config: EmbodiedDynamicsWorldConfig = {
      format: 'rsr.embodied-dynamics-world.v0.3', worldId: snapshot.worldId, positionScale: snapshot.positionScale,
      stepHz: snapshot.stepHz, gravity: snapshot.gravity, broadPhase: snapshot.broadPhase, velocityIterations: snapshot.velocityIterations, positionIterations: snapshot.positionIterations, gridCellSize: snapshot.gridCellSize, maxSubsteps: snapshot.maxSubsteps, ccdTargetFractionQ: snapshot.ccdTargetFractionQ, warmStart: snapshot.warmStart, materials: snapshot.materials, materialInteractions: snapshot.materialInteractions,
      bodies: snapshot.bodies.map(b => ({ id: b.id, kind: b.kind, position: b.position, angle: b.angle, velocity: b.velocity, angularVelocity: b.angularVelocity, fixtures: b.fixtures, inverseMassQ: b.inverseMassQ, inverseInertiaQ: b.inverseInertiaQ, fixedRotation: b.fixedRotation, bullet: b.bullet, enabled: b.enabled, allowSleep: b.allowSleep, sleepLinearThreshold: b.sleepLinearThreshold, sleepAngularThreshold: b.sleepAngularThreshold, sleepTicks: b.sleepTicks, gravityScaleQ: b.gravityScaleQ, tags: b.tags, data: b.data })),
      fields: snapshot.fields, joints: snapshot.joints.map(j => deepClone(j) as unknown as JointSpec)
    };
    const world = new EmbodiedDynamicsWorld(config);
    world.tickValue = snapshot.tick;
    world.configHash = snapshot.configHash;
    world.bodies.clear(); for (const body of snapshot.bodies) world.bodies.set(body.id, deepClone(body));
    world.joints.clear(); for (const joint of snapshot.joints) world.joints.set(joint.id, deepClone(joint));
    world.contactsValue = deepClone(snapshot.contacts); world.previousContacts = new Map(snapshot.contacts.map(c => [c.key, deepClone(c)]));
    world.contactCache = new Map(snapshot.contacts.map(c => [c.key, { normal: (c.points[0]?.normalImpulse ?? 0) / snapshot.positionScale, tangent: (c.points[0]?.tangentImpulse ?? 0) / snapshot.positionScale }]));
    world.eventsValue = deepClone(snapshot.events); world.islandsValue = deepClone(snapshot.islands); world.diagnosticsValue = deepClone(snapshot.diagnostics);
    return world;
  }

  get tick(): number { return this.tickValue; }
  getBody(id: string): RuntimeBody | undefined { const b = this.bodies.get(id); return b ? deepClone(b) : undefined; }

  private pairMaterial(a: RuntimeFixture, b: RuntimeFixture): PairMaterial {
    const ma = this.materials.get(a.materialId) ?? this.materials.get('default')!; const mb = this.materials.get(b.materialId) ?? this.materials.get('default')!;
    const interaction = this.interactions.find(i => materialPairKey(i.materialA, i.materialB) === materialPairKey(a.materialId, b.materialId));
    return {
      enabled: interaction?.enabled !== false,
      sensorOnly: Boolean(interaction?.sensorOnly),
      friction: (interaction?.frictionQ ?? Math.round(Math.sqrt(a.frictionQ * b.frictionQ))) / Q,
      restitution: (interaction?.restitutionQ ?? Math.max(a.restitutionQ, b.restitutionQ)) / Q,
      rollingResistance: (interaction?.rollingResistanceQ ?? Math.round(Math.sqrt(ma.rollingResistanceQ * mb.rollingResistanceQ))) / Q,
      key: materialPairKey(a.materialId, b.materialId)
    };
  }

  private fieldApplies(field: FieldSpec, body: RuntimeBody): boolean { if (field.enabled === false) return false; if (field.tagsAny?.length && !field.tagsAny.some(t => body.tags.includes(t))) return false; const mask = field.categoryMask; if (mask !== undefined && !body.fixtures.some(f => (f.filter.categoryBits & mask) !== 0)) return false; return true; }
  private applyFields(fb: FBody): void {
    const body = fb.runtime; if (body.kind !== 'dynamic' || !body.awake) return;
    const gScale = body.gravityScaleQ / Q; fb.force = add(fb.force, mul(intVecToFloat(this.gravity, this.positionScale), gScale / Math.max(fb.invM, EPS)));
    for (const field of this.fields) {
      if (!this.fieldApplies(field, body)) continue;
      if (field.type === 'uniform') fb.force = add(fb.force, mul(intVecToFloat(field.acceleration, this.positionScale), 1 / Math.max(fb.invM, EPS)));
      else if (field.type === 'radial') { const delta = sub(intVecToFloat(field.center, this.positionScale), fb.p); const distance = len(delta); if (distance > EPS && distance <= field.radius / this.positionScale) { const ratio = distance / (field.radius / this.positionScale); const factor = field.falloff === 'inverse-square' ? 1 / Math.max(0.05, ratio * ratio) : field.falloff === 'linear' ? 1 - ratio : 1; fb.force = add(fb.force, mul(normalize(delta), (field.strength / this.positionScale) * factor / Math.max(fb.invM, EPS))); } }
      else if (field.type === 'drag') { const speed = len(fb.v); const drag = (field.linearQ ?? 0) / Q + ((field.quadraticQ ?? 0) / Q) * speed; fb.force = add(fb.force, mul(fb.v, -drag / Math.max(fb.invM, EPS))); fb.torque += -fb.w * ((field.angularQ ?? 0) / Q) / Math.max(fb.invI, EPS); }
      else if (field.type === 'vortex') { const delta = sub(fb.p, intVecToFloat(field.center, this.positionScale)); const distance = len(delta); if (distance > EPS && distance <= field.radius / this.positionScale) { const radial = normalize(delta); const tangent = perp(radial); const accel = add(mul(tangent, field.tangentialStrength / this.positionScale), mul(radial, (field.radialStrength ?? 0) / this.positionScale)); fb.force = add(fb.force, mul(accel, 1 / Math.max(fb.invM, EPS))); } }
      else if (field.type === 'buoyancy') { if (fb.p.y > field.surfaceY / this.positionScale) { const buoyancy = mul(intVecToFloat(field.gravity, this.positionScale), -(field.densityQ / Q) / Math.max(fb.invM, EPS)); fb.force = add(fb.force, buoyancy); fb.force = add(fb.force, mul(fb.v, -((field.linearDragQ ?? 100_000) / Q) / Math.max(fb.invM, EPS))); fb.torque += -fb.w * ((field.angularDragQ ?? 100_000) / Q) / Math.max(fb.invI, EPS); } }
    }
  }

  private executeCommands(fbodies: Map<string, FBody>, commands: DynamicsCommand[]): string[] {
    const applied: string[] = [];
    for (const command of commands.filter(c => c.tick === this.tickValue + 1).sort((a, b) => a.id.localeCompare(b.id))) {
      if (command.type === 'set-joint-enabled' || command.type === 'set-joint-motor') { const joint = this.joints.get(command.jointId); if (!joint) continue; if (command.type === 'set-joint-enabled') joint.enabled = command.enabled; else { joint.motorSpeed = command.motorSpeed; if (joint.type === 'revolute') joint.maxMotorTorque = command.maxForceOrTorque; else if (joint.type === 'prismatic') joint.maxMotorForce = command.maxForceOrTorque; } applied.push(command.id); continue; }
      const fb = fbodies.get(command.bodyId); if (!fb || fb.runtime.kind === 'static') continue;
      if (command.type === 'apply-impulse') { const impulse = intVecToFloat(command.impulse, this.positionScale); fb.v = add(fb.v, mul(impulse, fb.invM)); if (command.worldPoint && fb.invI > 0) fb.w += cross(sub(intVecToFloat(command.worldPoint, this.positionScale), fb.p), impulse) * fb.invI; }
      else if (command.type === 'apply-force') { const force = intVecToFloat(command.force, this.positionScale); fb.force = add(fb.force, force); if (command.worldPoint && fb.invI > 0) fb.torque += cross(sub(intVecToFloat(command.worldPoint, this.positionScale), fb.p), force); }
      else if (command.type === 'apply-torque') fb.torque += command.torque / this.positionScale;
      else if (command.type === 'set-velocity' || command.type === 'set-kinematic-velocity') { fb.v = intVecToFloat(command.velocity, this.positionScale); if ('angularVelocity' in command && command.angularVelocity !== undefined) fb.w = command.angularVelocity / ANGLE_TURN_SCALE; }
      else if (command.type === 'set-angular-velocity') fb.w = command.angularVelocity / ANGLE_TURN_SCALE;
      else if (command.type === 'set-transform') { fb.p = intVecToFloat(command.position, this.positionScale); if (command.angle !== undefined) fb.a = turnIntToTurns(command.angle); if (command.clearVelocity) { fb.v = { x: 0, y: 0 }; fb.w = 0; } }
      else if (command.type === 'wake') { /* state below */ }
      fb.runtime.awake = true; fb.runtime.sleepCounter = 0; applied.push(command.id);
    }
    return applied;
  }

  private calculateSubsteps(fbodies: Map<string, FBody>): number {
    let maxRequired = 1;
    for (const fb of fbodies.values()) {
      if (fb.runtime.kind === 'static' || !fb.runtime.enabled || !fb.runtime.awake) continue;
      let minFeature = Infinity;
      for (const fixture of fb.runtime.fixtures) { const s = fixture.shape; const feature = s.type === 'circle' ? s.radius : s.type === 'capsule' ? s.radius : s.type === 'box' ? Math.min(s.halfExtents.x, s.halfExtents.y) : s.type === 'segment' ? Math.max(1, s.radius ?? 1) : Math.max(1, Math.min(...s.vertices.map(v => Math.hypot(v.x, v.y))) / 2); minFeature = Math.min(minFeature, feature / this.positionScale); }
      const linearTravel = len(fb.v) / this.stepHz; const angularTravel = Math.abs(fb.w) * TWO_PI * Math.max(minFeature, 0.01) / this.stepHz; const target = Math.max(minFeature * (this.ccdTargetFractionQ / Q), 0.002); const required = Math.ceil((linearTravel + angularTravel) / target); maxRequired = Math.max(maxRequired, required); if (fb.runtime.bullet) this.diagnosticsValue.ccdBodies++;
    }
    return clamp(maxRequired, 1, this.maxSubsteps);
  }

  private proxies(fbodies: Map<string, FBody>, dt: number): Proxy[] {
    const proxies: Proxy[] = [];
    for (const fb of fbodies.values()) if (fb.runtime.enabled) for (const fixture of fb.runtime.fixtures) { const ff = fixtureWorld(fb, fixture, this.positionScale); let aabb = fixtureAabb(ff, this.positionScale); const displacement = mul(fb.v, dt); aabb = unionAabb(aabb, { minX: aabb.minX + displacement.x, minY: aabb.minY + displacement.y, maxX: aabb.maxX + displacement.x, maxY: aabb.maxY + displacement.y }); aabb = expandAabb(aabb, 0.01); proxies.push({ bodyId: fb.runtime.id, fixtureId: fixture.id, aabb, fixture: ff }); }
    this.diagnosticsValue.fixtureProxies = Math.max(this.diagnosticsValue.fixtureProxies, proxies.length);
    return proxies.sort((a, b) => a.aabb.minX - b.aabb.minX || a.bodyId.localeCompare(b.bodyId) || a.fixtureId.localeCompare(b.fixtureId));
  }
  private candidatePairs(proxies: Proxy[]): Array<[Proxy, Proxy]> {
    const result: Array<[Proxy, Proxy]> = [];
    if (this.broadPhase === 'uniform-grid') {
      const size = this.gridCellSize / this.positionScale; const cells = new Map<string, Proxy[]>();
      for (const p of proxies) for (let x = Math.floor(p.aabb.minX / size); x <= Math.floor(p.aabb.maxX / size); x++) for (let y = Math.floor(p.aabb.minY / size); y <= Math.floor(p.aabb.maxY / size); y++) { const key = `${x},${y}`; const list = cells.get(key) ?? []; list.push(p); cells.set(key, list); }
      const seen = new Set<string>();
      for (const list of cells.values()) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) { const a = list[i]!; const b = list[j]!; const key = pairKey(bodyFixtureKey(a.bodyId, a.fixtureId), bodyFixtureKey(b.bodyId, b.fixtureId)); if (seen.has(key)) continue; seen.add(key); result.push([a, b]); }
    } else {
      const active: Proxy[] = [];
      for (const p of proxies) { for (let i = active.length - 1; i >= 0; i--) if (active[i]!.aabb.maxX < p.aabb.minX) active.splice(i, 1); for (const a of active) if (a.aabb.maxY >= p.aabb.minY && a.aabb.minY <= p.aabb.maxY) result.push([a, p]); active.push(p); }
    }
    return result.filter(([a, b]) => a.bodyId !== b.bodyId && !(a.fixture.body.runtime.kind !== 'dynamic' && b.fixture.body.runtime.kind !== 'dynamic') && canCollide(a.fixture.fixture, b.fixture.fixture) && aabbOverlap(a.aabb, b.aabb)).sort((x, y) => pairKey(bodyFixtureKey(x[0].bodyId, x[0].fixtureId), bodyFixtureKey(x[1].bodyId, x[1].fixtureId)).localeCompare(pairKey(bodyFixtureKey(y[0].bodyId, y[0].fixtureId), bodyFixtureKey(y[1].bodyId, y[1].fixtureId))));
  }

  private prepareContacts(fbodies: Map<string, FBody>, microstep: number, dt: number): SolverContact[] {
    const solver: SolverContact[] = [];
    const pairs = this.candidatePairs(this.proxies(fbodies, dt)); this.diagnosticsValue.candidatePairs += pairs.length;
    for (const [pa, pb] of pairs) {
      const a = pa.fixture; const b = pb.fixture;
      const jointBlocks = [...this.joints.values()].some(j => j.enabled && !j.broken && !j.collideConnected && pairKey(j.bodyA, j.bodyB) === pairKey(a.body.runtime.id, b.body.runtime.id)); if (jointBlocks) continue;
      const material = this.pairMaterial(a.fixture, b.fixture); if (!material.enabled) continue;
      this.diagnosticsValue.narrowPhaseTests++;
      const geometry = collide(a, b, this.positionScale, this.diagnosticsValue); if (!geometry) continue;
      const sensor = a.fixture.sensor || b.fixture.sensor || material.sensorOnly;
      const key = pairKey(bodyFixtureKey(a.body.runtime.id, a.fixture.id), bodyFixtureKey(b.body.runtime.id, b.fixture.id));
      const normal = geometry.normal; const tangent = perp(normal); const point = geometry.point; const rA = sub(point, a.body.p); const rB = sub(point, b.body.p);
      const rnA = cross(rA, normal); const rnB = cross(rB, normal); const kN = a.body.invM + b.body.invM + rnA * rnA * a.body.invI + rnB * rnB * b.body.invI;
      const rtA = cross(rA, tangent); const rtB = cross(rB, tangent); const kT = a.body.invM + b.body.invM + rtA * rtA * a.body.invI + rtB * rtB * b.body.invI;
      const cache = this.warmStart ? this.contactCache.get(key) : undefined;
      const manifold: ContactManifold = { key, bodyA: a.body.runtime.id, bodyB: b.body.runtime.id, fixtureA: a.fixture.id, fixtureB: b.fixture.id, normalQ: { x: Math.round(normal.x * Q), y: Math.round(normal.y * Q) }, points: [{ point: floatVecToInt(point, this.positionScale), separation: -Math.round(geometry.depth * this.positionScale), normalImpulse: Math.round((cache?.normal ?? 0) * this.positionScale), tangentImpulse: Math.round((cache?.tangent ?? 0) * this.positionScale), featureId: geometry.featureId }], sensor, materialPair: material.key, microstep, touching: true };
      if (sensor) { solver.push({ manifold, a: a.body, b: b.body, point, normal, tangent, rA, rB, penetration: geometry.depth, normalMass: 0, tangentMass: 0, bias: 0, restitutionBias: 0, accumulatedNormal: 0, accumulatedTangent: 0, friction: material.friction, rollingResistance: material.rollingResistance }); continue; }
      const rv = sub(add(b.body.v, crossSV(b.body.w * TWO_PI, rB)), add(a.body.v, crossSV(a.body.w * TWO_PI, rA))); const vn = dot(rv, normal); const restitutionBias = vn < -1 ? -material.restitution * vn : 0;
      const sc: SolverContact = { manifold, a: a.body, b: b.body, point, normal, tangent, rA, rB, penetration: geometry.depth, normalMass: kN > EPS ? 1 / kN : 0, tangentMass: kT > EPS ? 1 / kT : 0, bias: Math.max(0, geometry.depth - 0.003) * 0.25 / dt, restitutionBias, accumulatedNormal: cache?.normal ?? 0, accumulatedTangent: cache?.tangent ?? 0, friction: material.friction, rollingResistance: material.rollingResistance };
      if (cache && (cache.normal !== 0 || cache.tangent !== 0)) { this.applyContactImpulse(sc, cache.normal, cache.tangent); this.diagnosticsValue.warmStartedContacts++; }
      solver.push(sc);
    }
    return solver;
  }
  private applyContactImpulse(c: SolverContact, normalImpulse: number, tangentImpulse: number): void { const impulse = add(mul(c.normal, normalImpulse), mul(c.tangent, tangentImpulse)); if (c.a.runtime.kind === 'dynamic') { c.a.v = sub(c.a.v, mul(impulse, c.a.invM)); c.a.w -= cross(c.rA, impulse) * c.a.invI / TWO_PI; } if (c.b.runtime.kind === 'dynamic') { c.b.v = add(c.b.v, mul(impulse, c.b.invM)); c.b.w += cross(c.rB, impulse) * c.b.invI / TWO_PI; } }
  private solveVelocityContacts(contacts: SolverContact[]): void {
    for (let iteration = 0; iteration < this.velocityIterations; iteration++) {
      for (const c of contacts) { if (c.manifold.sensor) continue; const rv = sub(add(c.b.v, crossSV(c.b.w * TWO_PI, c.rB)), add(c.a.v, crossSV(c.a.w * TWO_PI, c.rA))); const vn = dot(rv, c.normal); let lambda = c.normalMass * (-(vn) + c.bias + c.restitutionBias); const oldN = c.accumulatedNormal; c.accumulatedNormal = Math.max(0, oldN + lambda); lambda = c.accumulatedNormal - oldN; this.applyContactImpulse(c, lambda, 0); const rv2 = sub(add(c.b.v, crossSV(c.b.w * TWO_PI, c.rB)), add(c.a.v, crossSV(c.a.w * TWO_PI, c.rA))); const vt = dot(rv2, c.tangent); let tLambda = -c.tangentMass * vt; const maxFriction = c.friction * c.accumulatedNormal; const oldT = c.accumulatedTangent; c.accumulatedTangent = clamp(oldT + tLambda, -maxFriction, maxFriction); tLambda = c.accumulatedTangent - oldT; this.applyContactImpulse(c, 0, tLambda); const relativeW = c.b.w - c.a.w; const roll = clamp(-relativeW * c.rollingResistance, -c.accumulatedNormal, c.accumulatedNormal); if (c.a.runtime.kind === 'dynamic') c.a.w -= roll * c.a.invI; if (c.b.runtime.kind === 'dynamic') c.b.w += roll * c.b.invI; }
    }
    this.diagnosticsValue.velocityIterations += this.velocityIterations;
  }
  private solvePositionContacts(contacts: SolverContact[]): void {
    for (let iteration = 0; iteration < this.positionIterations; iteration++) for (const c of contacts) { if (c.manifold.sensor) continue; const total = c.a.invM + c.b.invM; if (total <= EPS) continue; const correction = Math.max(0, c.penetration - 0.002) * 0.25; const impulse = correction / total; if (c.a.runtime.kind === 'dynamic') c.a.p = sub(c.a.p, mul(c.normal, impulse * c.a.invM)); if (c.b.runtime.kind === 'dynamic') c.b.p = add(c.b.p, mul(c.normal, impulse * c.b.invM)); }
    this.diagnosticsValue.positionIterations += this.positionIterations;
  }

  private solveJoints(fbodies: Map<string, FBody>, dt: number, broken: DynamicsEvent[]): void {
    const joints = [...this.joints.values()].sort((a, b) => a.id.localeCompare(b.id));
    for (let iteration = 0; iteration < this.velocityIterations; iteration++) for (const joint of joints) {
      if (!joint.enabled || joint.broken) continue; const a = fbodies.get(joint.bodyA); const b = fbodies.get(joint.bodyB); if (!a || !b) continue;
      const anchorA = add(a.p, rotate(intVecToFloat((joint.localAnchorA as unknown as IntVector2 | undefined) ?? { x: 0, y: 0 }, this.positionScale), a.a)); const anchorB = add(b.p, rotate(intVecToFloat((joint.localAnchorB as unknown as IntVector2 | undefined) ?? { x: 0, y: 0 }, this.positionScale), b.a)); const delta = sub(anchorB, anchorA); const distance = len(delta); const axis = normalize(delta); const relV = sub(b.v, a.v); const stiffness = Number(joint.stiffnessQ ?? 800_000) / Q; const damping = Number(joint.dampingQ ?? 150_000) / Q; let force = 0; let torque = 0;
      if (joint.type === 'distance') { const rest = Number(joint.restLength) / this.positionScale; const minL = Number(joint.minLength ?? joint.restLength) / this.positionScale; const maxL = Number(joint.maxLength ?? joint.restLength) / this.positionScale; const target = clamp(rest, minL, maxL); const error = distance - target; const denom = a.invM + b.invM; if (denom > EPS) { force = -(error * stiffness / Math.max(dt, EPS) + dot(relV, axis) * damping) / denom; const impulse = mul(axis, force * dt); if (a.runtime.kind === 'dynamic') a.v = sub(a.v, mul(impulse, a.invM)); if (b.runtime.kind === 'dynamic') b.v = add(b.v, mul(impulse, b.invM)); } }
      else if (joint.type === 'revolute' || joint.type === 'weld') { const denom = a.invM + b.invM; if (denom > EPS) { const correctionV = add(mul(delta, stiffness / Math.max(dt, EPS)), mul(relV, damping)); const impulse = mul(correctionV, -dt / denom); force = len(impulse) / Math.max(dt, EPS); if (a.runtime.kind === 'dynamic') a.v = sub(a.v, mul(impulse, a.invM)); if (b.runtime.kind === 'dynamic') b.v = add(b.v, mul(impulse, b.invM)); } const reference = Number(joint.referenceAngle ?? 0) / ANGLE_TURN_SCALE; const relativeAngle = wrapSignedTurns(b.a - a.a - reference); const relativeW = b.w - a.w; if (joint.type === 'weld' || joint.lowerAngle !== undefined || joint.upperAngle !== undefined) { let error = joint.type === 'weld' ? relativeAngle : relativeAngle < Number(joint.lowerAngle ?? -Infinity) / ANGLE_TURN_SCALE ? relativeAngle - Number(joint.lowerAngle) / ANGLE_TURN_SCALE : relativeAngle > Number(joint.upperAngle ?? Infinity) / ANGLE_TURN_SCALE ? relativeAngle - Number(joint.upperAngle) / ANGLE_TURN_SCALE : 0; const denomI = a.invI + b.invI; if (denomI > EPS) { const angularImpulse = -(relativeW * damping + error * stiffness / Math.max(dt, EPS)) / denomI / this.velocityIterations; torque = angularImpulse / Math.max(dt, EPS); if (a.runtime.kind === 'dynamic') a.w -= angularImpulse * a.invI; if (b.runtime.kind === 'dynamic') b.w += angularImpulse * b.invI; } } if (joint.type === 'revolute' && Number(joint.maxMotorTorque ?? 0) > 0) { const target = Number(joint.motorSpeed ?? 0) / ANGLE_TURN_SCALE; const denomI = a.invI + b.invI; if (denomI > EPS) { const motorImpulse = clamp((target - relativeW) / denomI, -Number(joint.maxMotorTorque) * dt / this.positionScale, Number(joint.maxMotorTorque) * dt / this.positionScale); if (a.runtime.kind === 'dynamic') a.w -= motorImpulse * a.invI; if (b.runtime.kind === 'dynamic') b.w += motorImpulse * b.invI; torque = Math.max(Math.abs(torque), Math.abs(motorImpulse / dt)); } } }
      else if (joint.type === 'prismatic') { const axisA = normalize(rotate(intVecToFloat(joint.localAxisA as unknown as IntVector2, this.positionScale), a.a)); const normal = perp(axisA); const perpError = dot(delta, normal); const perpV = dot(relV, normal); const denom = a.invM + b.invM; if (denom > EPS) { const impulseN = -(perpError * stiffness / Math.max(dt, EPS) + perpV * damping) * dt / denom; const iv = mul(normal, impulseN); if (a.runtime.kind === 'dynamic') a.v = sub(a.v, mul(iv, a.invM)); if (b.runtime.kind === 'dynamic') b.v = add(b.v, mul(iv, b.invM)); force = Math.abs(impulseN / dt); const translation = dot(delta, axisA); let limitError = 0; const lower = joint.lowerTranslation === undefined ? -Infinity : Number(joint.lowerTranslation) / this.positionScale; const upper = joint.upperTranslation === undefined ? Infinity : Number(joint.upperTranslation) / this.positionScale; if (translation < lower) limitError = translation - lower; else if (translation > upper) limitError = translation - upper; let targetV = Number(joint.motorSpeed ?? 0) / this.positionScale; if (limitError !== 0) targetV = -limitError * stiffness / Math.max(dt, EPS); const axisV = dot(relV, axisA); const maxForce = Number(joint.maxMotorForce ?? Infinity) / this.positionScale; const impulseA = clamp((targetV - axisV) / denom, -maxForce * dt, maxForce * dt); const ia = mul(axisA, impulseA); if (a.runtime.kind === 'dynamic') a.v = sub(a.v, mul(ia, a.invM)); if (b.runtime.kind === 'dynamic') b.v = add(b.v, mul(ia, b.invM)); force = Math.max(force, Math.abs(impulseA / dt)); } }
      joint.lastForce = Math.round(Math.abs(force) * this.positionScale); joint.lastTorque = Math.round(Math.abs(torque) * this.positionScale);
      if ((joint.breakForce !== null && joint.lastForce > joint.breakForce) || (joint.breakTorque !== null && joint.lastTorque > joint.breakTorque)) { joint.broken = true; const base = { tick: this.tickValue + 1, kind: 'joint' as const, phase: 'break' as const, subjects: [joint.bodyA, joint.bodyB].sort(), jointId: joint.id }; broken.push({ id: `${this.worldId}:${this.tickValue + 1}:joint:break:${joint.id}`, ...base, evidenceHash: semanticHash({ ...base, force: joint.lastForce, torque: joint.lastTorque }) }); }
    }
  }

  private integrate(fbodies: Map<string, FBody>, dt: number): void {
    for (const fb of fbodies.values()) {
      const r = fb.runtime; if (!r.enabled || !r.awake) continue;
      if (r.kind === 'dynamic') { this.applyFields(fb); fb.v = add(fb.v, mul(fb.force, fb.invM * dt)); fb.w += fb.torque * fb.invI * dt / TWO_PI; const materialDamping = r.fixtures.reduce((sum, f) => sum + (this.materials.get(f.materialId)?.linearDampingQ ?? 0), 0) / Math.max(1, r.fixtures.length) / Q; const angularDamping = r.fixtures.reduce((sum, f) => sum + (this.materials.get(f.materialId)?.angularDampingQ ?? 0), 0) / Math.max(1, r.fixtures.length) / Q; fb.v = mul(fb.v, 1 / (1 + materialDamping * dt)); fb.w /= 1 + angularDamping * dt; }
      if (r.kind !== 'static') { fb.p = add(fb.p, mul(fb.v, dt)); fb.a += fb.w * dt; }
    }
  }

  private buildIslands(contacts: ContactManifold[]): DynamicsIsland[] {
    const adjacency = new Map<string, Set<string>>(); const contactByBody = new Map<string, Set<string>>(); const jointByBody = new Map<string, Set<string>>();
    for (const body of this.bodies.values()) adjacency.set(body.id, new Set());
    for (const c of contacts) if (!c.sensor) { adjacency.get(c.bodyA)?.add(c.bodyB); adjacency.get(c.bodyB)?.add(c.bodyA); for (const id of [c.bodyA, c.bodyB]) { const set = contactByBody.get(id) ?? new Set<string>(); set.add(c.key); contactByBody.set(id, set); } }
    for (const j of this.joints.values()) if (j.enabled && !j.broken) { adjacency.get(j.bodyA)?.add(j.bodyB); adjacency.get(j.bodyB)?.add(j.bodyA); for (const id of [j.bodyA, j.bodyB]) { const set = jointByBody.get(id) ?? new Set<string>(); set.add(j.id); jointByBody.set(id, set); } }
    const visited = new Set<string>(); const islands: DynamicsIsland[] = [];
    for (const id of [...adjacency.keys()].sort()) { const body = this.bodies.get(id)!; if (visited.has(id) || body.kind === 'static') continue; const queue = [id]; const ids: string[] = []; const cs = new Set<string>(); const js = new Set<string>(); while (queue.length) { const current = queue.shift()!; if (visited.has(current)) continue; visited.add(current); ids.push(current); for (const c of contactByBody.get(current) ?? []) cs.add(c); for (const j of jointByBody.get(current) ?? []) js.add(j); for (const n of [...(adjacency.get(current) ?? [])].sort()) if (!visited.has(n) && this.bodies.get(n)?.kind !== 'static') queue.push(n); } ids.sort(); islands.push({ id: `island:${semanticHash(ids)}`, bodyIds: ids, contactKeys: [...cs].sort(), jointIds: [...js].sort(), awake: ids.some(b => this.bodies.get(b)!.awake) }); }
    return islands.sort((a, b) => a.id.localeCompare(b.id));
  }
  private updateSleeping(islands: DynamicsIsland[], events: DynamicsEvent[]): void {
    for (const island of islands) {
      const bodies = island.bodyIds.map(id => this.bodies.get(id)!).filter(b => b.kind === 'dynamic' && b.allowSleep); if (!bodies.length) continue;
      const stable = bodies.every(b => Math.abs(b.velocity.x) + Math.abs(b.velocity.y) <= b.sleepLinearThreshold && Math.abs(b.angularVelocity) <= b.sleepAngularThreshold);
      for (const b of bodies) { const was = b.awake; if (stable) b.sleepCounter++; else { b.sleepCounter = 0; b.awake = true; } if (b.sleepCounter >= b.sleepTicks) { b.awake = false; b.velocity = { x: 0, y: 0 }; b.angularVelocity = 0; } if (was !== b.awake) { const phase = b.awake ? 'wake' : 'sleep'; const base = { tick: this.tickValue + 1, kind: 'body' as const, phase: phase as DynamicsEventPhase, subjects: [b.id] }; events.push({ id: `${this.worldId}:${this.tickValue + 1}:body:${phase}:${b.id}`, ...base, evidenceHash: semanticHash(base) }); } }
    }
  }
  private interactionEvents(contacts: ContactManifold[], broken: DynamicsEvent[]): DynamicsEvent[] {
    const current = new Map(contacts.map(c => [c.key, c])); const events = [...broken];
    for (const c of contacts) { const phase: DynamicsEventPhase = this.previousContacts.has(c.key) ? 'persist' : 'begin'; const kind: DynamicsEventKind = c.sensor ? 'sensor' : 'contact'; const base = { tick: this.tickValue + 1, kind, phase, subjects: [c.bodyA, c.bodyB].sort(), pair: c.key, manifold: c }; events.push({ id: `${this.worldId}:${this.tickValue + 1}:${kind}:${phase}:${c.key}`, ...base, evidenceHash: semanticHash(base) }); }
    for (const [key, c] of this.previousContacts) if (!current.has(key)) { const kind: DynamicsEventKind = c.sensor ? 'sensor' : 'contact'; const base = { tick: this.tickValue + 1, kind, phase: 'end' as const, subjects: [c.bodyA, c.bodyB].sort(), pair: key }; events.push({ id: `${this.worldId}:${this.tickValue + 1}:${kind}:end:${key}`, ...base, evidenceHash: semanticHash(base) }); }
    this.previousContacts = current; return events.sort((a, b) => a.id.localeCompare(b.id));
  }

  step(commands: DynamicsCommand[] = []): EmbodiedDynamicsStepResult {
    const fbodies = new Map([...this.bodies.values()].map(b => [b.id, toFBody(b, this.positionScale)]));
    const applied = this.executeCommands(fbodies, commands); this.diagnosticsValue = { microsteps: 1, fixtureProxies: 0, candidatePairs: 0, narrowPhaseTests: 0, gjkCalls: 0, epaCalls: 0, resolvedContacts: 0, warmStartedContacts: 0, ccdBodies: 0, velocityIterations: 0, positionIterations: 0, rayTests: 0 };
    const microsteps = this.calculateSubsteps(fbodies); this.diagnosticsValue.microsteps = microsteps; const dt = 1 / this.stepHz / microsteps; const allContacts = new Map<string, ContactManifold>(); const broken: DynamicsEvent[] = [];
    for (let micro = 0; micro < microsteps; micro++) {
      this.integrate(fbodies, dt);
      const contacts = this.prepareContacts(fbodies, micro, dt);
      this.solveVelocityContacts(contacts); this.solveJoints(fbodies, dt, broken); this.solvePositionContacts(contacts);
      for (const c of contacts) { c.manifold.points[0]!.normalImpulse = Math.round(c.accumulatedNormal * this.positionScale); c.manifold.points[0]!.tangentImpulse = Math.round(c.accumulatedTangent * this.positionScale); allContacts.set(c.manifold.key, c.manifold); if (!c.manifold.sensor) this.contactCache.set(c.manifold.key, { normal: c.accumulatedNormal, tangent: c.accumulatedTangent }); }
      for (const fb of fbodies.values()) commitFBody(fb, this.positionScale);
    }
    this.contactsValue = [...allContacts.values()].sort((a, b) => a.key.localeCompare(b.key)); this.diagnosticsValue.resolvedContacts = this.contactsValue.length;
    const liveContactKeys = new Set(this.contactsValue.filter(contact => !contact.sensor).map(contact => contact.key));
    this.contactCache = new Map([...this.contactCache.entries()].filter(([key]) => liveContactKeys.has(key)));
    this.eventsValue = this.interactionEvents(this.contactsValue, broken); this.islandsValue = this.buildIslands(this.contactsValue); this.updateSleeping(this.islandsValue, this.eventsValue); this.tickValue++;
    return { snapshot: this.snapshot(), appliedCommandIds: applied, contacts: deepClone(this.contactsValue), events: deepClone(this.eventsValue) };
  }
  run(ticks: number, commands: DynamicsCommand[] = []): EmbodiedDynamicsSnapshot { for (let i = 0; i < ticks; i++) this.step(commands); return this.snapshot(); }

  queryAabb(aabbInt: { min: IntVector2; max: IntVector2 }): Array<{ bodyId: string; fixtureId: string }> {
    const aabb: Aabb = { minX: aabbInt.min.x / this.positionScale, minY: aabbInt.min.y / this.positionScale, maxX: aabbInt.max.x / this.positionScale, maxY: aabbInt.max.y / this.positionScale }; const result: Array<{ bodyId: string; fixtureId: string }> = [];
    const fbodies = new Map([...this.bodies.values()].map(b => [b.id, toFBody(b, this.positionScale)])); for (const p of this.proxies(fbodies, 0)) if (aabbOverlap(aabb, p.aabb)) result.push({ bodyId: p.bodyId, fixtureId: p.fixtureId }); result.sort((a, b) => a.bodyId.localeCompare(b.bodyId) || a.fixtureId.localeCompare(b.fixtureId)); this.queryLog.push({ type: 'aabb', aabb: deepClone(aabbInt) as unknown as VSRValue, result: deepClone(result) as unknown as VSRValue }); return result;
  }
  queryPoint(pointInt: IntVector2): Array<{ bodyId: string; fixtureId: string }> { const point = intVecToFloat(pointInt, this.positionScale); const result: Array<{ bodyId: string; fixtureId: string }> = []; for (const body of this.bodies.values()) { const fb = toFBody(body, this.positionScale); for (const fixture of body.fixtures) { const ff = fixtureWorld(fb, fixture, this.positionScale); if (pointInFixture(point, ff, this.positionScale)) result.push({ bodyId: body.id, fixtureId: fixture.id }); } } result.sort((a, b) => a.bodyId.localeCompare(b.bodyId) || a.fixtureId.localeCompare(b.fixtureId)); this.queryLog.push({ type: 'point', point: deepClone(pointInt) as unknown as VSRValue, result: deepClone(result) as unknown as VSRValue }); return result; }
  rayCast(originInt: IntVector2, translationInt: IntVector2, firstHitOnly = false): RayCastHit[] {
    const origin = intVecToFloat(originInt, this.positionScale); const delta = intVecToFloat(translationInt, this.positionScale); const hits: RayCastHit[] = []; const fbodies = new Map([...this.bodies.values()].map(b => [b.id, toFBody(b, this.positionScale)]));
    for (const p of this.proxies(fbodies, 0)) { this.diagnosticsValue.rayTests++; const broad = rayAabb(origin, delta, p.aabb); if (broad === undefined) continue; let lo = Math.max(0, broad); let hi = 1; let found = false; let previous = lo; for (let sample = 0; sample <= 96; sample++) { const t = lo + (1 - lo) * (sample / 96); const samplePoint = add(origin, mul(delta, t)); if (pointInFixture(samplePoint, p.fixture, this.positionScale)) { hi = t; lo = previous; found = true; break; } previous = t; } if (!found) continue; for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; const point = add(origin, mul(delta, mid)); if (pointInFixture(point, p.fixture, this.positionScale)) hi = mid; else lo = mid; } const point = add(origin, mul(delta, hi)); const centerNormal = normalize(sub(point, p.fixture.center), mul(normalize(delta), -1)); hits.push({ bodyId: p.bodyId, fixtureId: p.fixtureId, fractionQ: Math.round(hi * Q), point: floatVecToInt(point, this.positionScale), normalQ: { x: Math.round(centerNormal.x * Q), y: Math.round(centerNormal.y * Q) } }); }
    hits.sort((a, b) => a.fractionQ - b.fractionQ || a.bodyId.localeCompare(b.bodyId)); const result = firstHitOnly ? hits.slice(0, 1) : hits; this.queryLog.push({ type: 'ray', origin: deepClone(originInt) as unknown as VSRValue, translation: deepClone(translationInt) as unknown as VSRValue, result: deepClone(result) as unknown as VSRValue }); return result;
  }
  shapeCastCircle(centerInt: IntVector2, radius: number, translationInt: IntVector2): ShapeCastHit[] {
    const center = intVecToFloat(centerInt, this.positionScale); const translation = intVecToFloat(translationInt, this.positionScale); const hits: ShapeCastHit[] = []; const probeBody = toFBody(normalizeBody({ id: '__query__', kind: 'kinematic', position: centerInt, fixtures: [{ id: '__shape__', shape: { type: 'circle', radius } }] }, { format: 'rsr.embodied-dynamics-world.v0.3', worldId: '__query__', positionScale: this.positionScale, stepHz: this.stepHz, bodies: [] }, this.materials), this.positionScale); const probe = fixtureWorld(probeBody, probeBody.runtime.fixtures[0]!, this.positionScale);
    for (const body of this.bodies.values()) { const fb = toFBody(body, this.positionScale); for (const fixture of body.fixtures) { const target = fixtureWorld(fb, fixture, this.positionScale); let lo = 0; let hi = 1; let found = false; let iterations = 0; for (let sample = 0; sample <= 32; sample++) { const t = sample / 32; probe.center = add(center, mul(translation, t)); if (collide(probe, target, this.positionScale)) { hi = t; lo = Math.max(0, t - 1 / 32); found = true; break; } } if (!found) continue; for (iterations = 0; iterations < 20; iterations++) { const mid = (lo + hi) / 2; probe.center = add(center, mul(translation, mid)); if (collide(probe, target, this.positionScale)) hi = mid; else lo = mid; } probe.center = add(center, mul(translation, hi)); const geometry = collide(probe, target, this.positionScale)!; hits.push({ bodyId: body.id, fixtureId: fixture.id, fractionQ: Math.round(hi * Q), point: floatVecToInt(geometry.point, this.positionScale), normalQ: { x: Math.round(geometry.normal.x * Q), y: Math.round(geometry.normal.y * Q) }, iterations }); } }
    hits.sort((a, b) => a.fractionQ - b.fractionQ || a.bodyId.localeCompare(b.bodyId)); this.queryLog.push({ type: 'shape-cast-circle', center: deepClone(centerInt) as unknown as VSRValue, radius, translation: deepClone(translationInt) as unknown as VSRValue, result: deepClone(hits) as unknown as VSRValue }); return hits;
  }

  snapshot(): EmbodiedDynamicsSnapshot {
    const bodies = [...this.bodies.values()].map(deepClone).sort((a, b) => a.id.localeCompare(b.id)); const joints = [...this.joints.values()].map(deepClone).sort((a, b) => a.id.localeCompare(b.id)); const contacts = deepClone(this.contactsValue); const islands = deepClone(this.islandsValue); const events = deepClone(this.eventsValue); const diagnostics = deepClone(this.diagnosticsValue);
    const bodyRoot = semanticHash(bodies); const contactRoot = semanticHash(contacts); const jointRoot = semanticHash(joints); const islandRoot = semanticHash(islands); const queryRoot = semanticHash(this.queryLog);
    const base = { format: 'rsr.embodied-dynamics-snapshot.v0.3' as const, runtimeVersion: EMBODIED_DYNAMICS_VERSION, worldId: this.worldId, tick: this.tickValue, logicalTime: { numerator: this.tickValue, denominator: this.stepHz }, positionScale: this.positionScale, angleTurnScale: ANGLE_TURN_SCALE, stepHz: this.stepHz, gravity: deepClone(this.gravity), broadPhase: this.broadPhase, velocityIterations: this.velocityIterations, positionIterations: this.positionIterations, gridCellSize: this.gridCellSize, maxSubsteps: this.maxSubsteps, ccdTargetFractionQ: this.ccdTargetFractionQ, warmStart: this.warmStart, materials: [...this.materials.values()].map(deepClone).sort((a, b) => a.id.localeCompare(b.id)), materialInteractions: deepClone(this.interactions), configHash: this.configHash, bodies, joints, fields: deepClone(this.fields), contacts, events, islands, diagnostics, bodyRoot, contactRoot, jointRoot, islandRoot, queryRoot };
    return { ...base, stateRoot: semanticHash(base) };
  }
}

export function replayEmbodiedDynamics(config: EmbodiedDynamicsWorldConfig, ticks: number, commands: DynamicsCommand[] = []): EmbodiedDynamicsSnapshot { return new EmbodiedDynamicsWorld(config).run(ticks, commands); }
export function embodiedSnapshotToCausalDelta(snapshot: EmbodiedDynamicsSnapshot, baseRealityRoot: string): EmbodiedDynamicsCausalDelta {
  const facts = snapshot.bodies.flatMap(body => [
    { subject: body.id, predicate: 'embodied.position', value: body.position as unknown as VSRValue, evidence: snapshot.bodyRoot },
    { subject: body.id, predicate: 'embodied.angle', value: body.angle, evidence: snapshot.bodyRoot },
    { subject: body.id, predicate: 'embodied.velocity', value: body.velocity as unknown as VSRValue, evidence: snapshot.bodyRoot },
    { subject: body.id, predicate: 'embodied.angularVelocity', value: body.angularVelocity, evidence: snapshot.bodyRoot },
    { subject: body.id, predicate: 'embodied.awake', value: body.awake, evidence: snapshot.bodyRoot }
  ]);
  const events = snapshot.events.map(event => ({ type: `physics.${event.kind}.${event.phase}`, subjects: event.subjects, payload: { eventId: event.id, pair: event.pair ?? null, jointId: event.jointId ?? null } as Record<string, VSRValue>, evidence: event.evidenceHash }));
  const base = { format: 'rfe.embodied-dynamics-causal-delta.v0.3' as const, provisional: true as const, baseRealityRoot, sourceRuntime: EMBODIED_DYNAMICS_VERSION, worldId: snapshot.worldId, tick: snapshot.tick, simulationRoot: snapshot.stateRoot, facts, events, diagnostics: snapshot.diagnostics };
  return { ...base, deltaRoot: semanticHash(base) };
}
