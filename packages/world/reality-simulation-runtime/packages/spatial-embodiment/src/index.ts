import { deepClone, semanticHash, type VSRValue } from '../../spec/src/index.js';

export const SPATIAL_EMBODIMENT_VERSION = '0.9.0-alpha.1';
export const SPATIAL_EMBODIMENT_FORMAT = 'rsr.spatial-embodiment-world.v0.6' as const;
export const LEGACY_SPATIAL_EMBODIMENT_FORMAT = 'rsr.spatial-embodiment-world.v0.5' as const;
export const POSITION_SCALE = 1_000;
export const ROTATION_SCALE = 1_000;
export const Q = 1_000_000;

export interface IntVector3 { x: number; y: number; z: number }
export interface FloatVector3 { x: number; y: number; z: number }
export type SpatialBodyKind = 'static' | 'dynamic' | 'kinematic';
export type SpatialShape =
  | { type: 'sphere'; radius: number }
  | { type: 'box'; halfExtents: IntVector3 }
  | { type: 'capsule'; radius: number; halfHeight: number };

export interface SpatialMaterialSpec {
  id: string;
  densityQ?: number;
  frictionQ?: number;
  restitutionQ?: number;
  impactSound?: string;
  impactHaptic?: string;
}

export interface SpatialFixtureSpec {
  id: string;
  shape: SpatialShape;
  localPosition?: IntVector3;
  materialId?: string;
  sensor?: boolean;
  categoryBits?: number;
  maskBits?: number;
  bodyZone?: string;
  tags?: string[];
  data?: Record<string, VSRValue>;
  oneWay?: { normal?: IntVector3; minApproachSpeed?: number; skin?: number };
}

export interface SpatialBodySpec {
  id: string;
  kind: SpatialBodyKind;
  position: IntVector3;
  rotationDeg?: IntVector3;
  velocity?: IntVector3;
  angularVelocityDeg?: IntVector3;
  fixtures: SpatialFixtureSpec[];
  massQ?: number;
  inverseMassQ?: number;
  gravityScaleQ?: number;
  linearDampingQ?: number;
  angularDampingQ?: number;
  frictionQ?: number;
  restitutionQ?: number;
  fixedRotation?: boolean;
  enabled?: boolean;
  allowSleep?: boolean;
  sleepSpeedThreshold?: number;
  sleepTicks?: number;
  bullet?: boolean;
  tags?: string[];
  data?: Record<string, VSRValue>;
}

export interface SpatialCharacterSpec {
  id: string;
  bodyId: string;
  walkSpeed: number;
  acceleration: number;
  airControlQ?: number;
  jumpSpeed: number;
  groundProbe?: number;
  maxSlopeDeg?: number;
  footstepDistance?: number;
  leftFootZone?: string;
  rightFootZone?: string;
  stepHeight?: number;
  groundSnapDistance?: number;
  skinWidth?: number;
  platformInheritanceQ?: number;
  coyoteTicks?: number;
  jumpBufferTicks?: number;
}

export type SpatialJointSpec =
  | { id: string; type: 'distance'; bodyA: string; bodyB: string; restLength: number; stiffnessQ?: number; dampingQ?: number; breakForce?: number; enabled?: boolean }
  | { id: string; type: 'ball'; bodyA: string; bodyB: string; localAnchorA?: IntVector3; localAnchorB?: IntVector3; stiffnessQ?: number; dampingQ?: number; breakForce?: number; enabled?: boolean }
  | { id: string; type: 'hinge'; bodyA: string; bodyB: string; localAnchorA?: IntVector3; localAnchorB?: IntVector3; axis?: IntVector3; motorSpeedDeg?: number; maxMotorTorque?: number; lowerAngleDeg?: number; upperAngleDeg?: number; breakForce?: number; enabled?: boolean };

export interface SpatialListenerSpec {
  id: string;
  position: IntVector3;
  forward?: IntVector3;
  up?: IntVector3;
}

export interface SpatialEmbodimentWorldConfig {
  format: typeof SPATIAL_EMBODIMENT_FORMAT | typeof LEGACY_SPATIAL_EMBODIMENT_FORMAT;
  worldId: string;
  stepHz: number;
  gravity?: IntVector3;
  floorY?: number;
  velocityIterations?: number;
  positionIterations?: number;
  maxSubsteps?: number;
  broadPhaseCellSize?: number;
  contactPersistenceDistance?: number;
  bodies: SpatialBodySpec[];
  characters?: SpatialCharacterSpec[];
  joints?: SpatialJointSpec[];
  materials?: SpatialMaterialSpec[];
  listeners?: SpatialListenerSpec[];
  reality?: { generation?: number; realityRoot?: string; evidenceRoot?: string };
}

export type SpatialCommand =
  | { id: string; tick: number; type: 'apply-impulse'; bodyId: string; impulse: IntVector3; worldPoint?: IntVector3 }
  | { id: string; tick: number; type: 'set-velocity'; bodyId: string; velocity: IntVector3 }
  | { id: string; tick: number; type: 'teleport'; bodyId: string; position: IntVector3; rotationDeg?: IntVector3 }
  | { id: string; tick: number; type: 'move-character'; characterId: string; direction: IntVector3; speedQ?: number }
  | { id: string; tick: number; type: 'jump-character'; characterId: string }
  | { id: string; tick: number; type: 'set-joint-motor'; jointId: string; motorSpeedDeg: number; maxMotorTorque?: number }
  | { id: string; tick: number; type: 'set-listener'; listenerId: string; position: IntVector3; forward?: IntVector3 };

export interface SpatialContactPoint {
  id: string;
  bodyA: string;
  fixtureA: string;
  bodyB: string;
  fixtureB: string;
  point: IntVector3;
  normal: IntVector3;
  penetration: number;
  impulse: number;
  sensor: boolean;
  zoneA?: string;
  zoneB?: string;
  manifoldId: string;
  normalImpulse: number;
  tangentImpulse: number;
  tangent: IntVector3;
  warmStarted: boolean;
}

export interface SpatialContactEvent {
  kind: 'contact';
  phase: 'begin' | 'persist' | 'end';
  tick: number;
  contactId: string;
  bodyA: string;
  bodyB: string;
  point: IntVector3;
  normal: IntVector3;
  impulse: number;
  sensor: boolean;
}

export interface SpatialAudioEvent {
  kind: 'spatial-audio';
  id: string;
  tick: number;
  cue: string;
  position: IntVector3;
  gainQ: number;
  pitchQ: number;
  minDistance: number;
  maxDistance: number;
  occlusionQ: number;
  sourceBodyId?: string;
}

export interface SpatialHapticEvent {
  kind: 'haptic';
  id: string;
  tick: number;
  bodyId: string;
  zone: string;
  amplitudeQ: number;
  frequencyHz: number;
  durationMs: number;
  direction: IntVector3;
  sourceContactId?: string;
}

export interface SpatialFootstepEvent {
  kind: 'footstep';
  id: string;
  tick: number;
  characterId: string;
  bodyId: string;
  foot: 'left' | 'right';
  position: IntVector3;
  materialId: string;
}

export type SpatialEmbodimentEvent = SpatialContactEvent | SpatialAudioEvent | SpatialHapticEvent | SpatialFootstepEvent | { kind: 'joint'; phase: 'break'; tick: number; jointId: string; force: number };

export interface RuntimeSpatialFixture extends SpatialFixtureSpec {
  localPosition: IntVector3;
  categoryBits: number;
  maskBits: number;
}
export interface RuntimeSpatialBody extends Omit<SpatialBodySpec, 'fixtures'> {
  rotationDeg: IntVector3;
  velocity: IntVector3;
  angularVelocityDeg: IntVector3;
  fixtures: RuntimeSpatialFixture[];
  inverseMassQ: number;
  gravityScaleQ: number;
  linearDampingQ: number;
  angularDampingQ: number;
  frictionQ: number;
  restitutionQ: number;
  enabled: boolean;
  allowSleep: boolean;
  sleepSpeedThreshold: number;
  sleepTicks: number;
  awake: boolean;
  sleepCounter: number;
  grounded: boolean;
  groundNormal: IntVector3;
  accumulatedImpulse: IntVector3;
  accumulatedTorque: IntVector3;
}

export interface RuntimeSpatialCharacter extends SpatialCharacterSpec {
  airControlQ: number;
  groundProbe: number;
  maxSlopeDeg: number;
  footstepDistance: number;
  desiredDirection: IntVector3;
  desiredSpeedQ: number;
  jumpQueued: boolean;
  grounded: boolean;
  distanceSinceFootstep: number;
  nextFoot: 'left' | 'right';
  stepHeight: number;
  groundSnapDistance: number;
  skinWidth: number;
  platformInheritanceQ: number;
  supportBodyId?: string;
  supportVelocity: IntVector3;
  coyoteTicks: number;
  jumpBufferTicks: number;
  ticksSinceGrounded: number;
  jumpBufferRemaining: number;
}

export type RuntimeSpatialJoint = SpatialJointSpec & { enabled: boolean; broken: boolean; lastForce: number }
export interface RuntimeSpatialListener extends SpatialListenerSpec { forward: IntVector3; up: IntVector3 }

export interface SpatialEmbodimentDiagnostics {
  broadPhasePairs: number;
  narrowPhaseTests: number;
  contacts: number;
  sensorContacts: number;
  groundedBodies: number;
  sleepingBodies: number;
  characterControllers: number;
  jointConstraints: number;
  microsteps: number;
  ccdBodies: number;
  audioEvents: number;
  hapticEvents: number;
  footstepEvents: number;
  broadPhaseCells: number;
  persistentManifolds: number;
  warmStartedContacts: number;
  steppedCharacters: number;
  snappedCharacters: number;
  movingPlatformTransfers: number;
  solverIslands: number;
  largestSolverIsland: number;
  sleepingIslands: number;
  warmStartedFrictionContacts: number;
  coyoteJumps: number;
  bufferedJumps: number;
  capsuleObbContacts: number;
}

export interface SpatialEmbodimentSnapshot {
  format: 'rsr.spatial-embodiment-snapshot.v0.6';
  runtimeVersion: typeof SPATIAL_EMBODIMENT_VERSION;
  worldId: string;
  tick: number;
  stepHz: number;
  positionScale: number;
  floorY: number;
  gravity: IntVector3;
  velocityIterations: number;
  positionIterations: number;
  maxSubsteps: number;
  broadPhaseCellSize: number;
  contactPersistenceDistance: number;
  materials: SpatialMaterialSpec[];
  reality: { generation?: number; realityRoot?: string; evidenceRoot?: string };
  bodies: RuntimeSpatialBody[];
  characters: RuntimeSpatialCharacter[];
  joints: RuntimeSpatialJoint[];
  listeners: RuntimeSpatialListener[];
  contacts: SpatialContactPoint[];
  events: SpatialEmbodimentEvent[];
  diagnostics: SpatialEmbodimentDiagnostics;
  bodyRoot: string;
  contactRoot: string;
  characterRoot: string;
  sensoryRoot: string;
  jointRoot: string;
  stateRoot: string;
}

interface Aabb3 { min: IntVector3; max: IntVector3 }
interface CollisionResult { point: IntVector3; normal: IntVector3; penetration: number; feature?: 'capsule-obb' }

const v3 = (x = 0, y = 0, z = 0): IntVector3 => ({ x, y, z });
const add = (a: IntVector3, b: IntVector3): IntVector3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: IntVector3, b: IntVector3): IntVector3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const mul = (a: IntVector3, s: number): IntVector3 => v3(Math.round(a.x * s), Math.round(a.y * s), Math.round(a.z * s));
const dot = (a: IntVector3, b: IntVector3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const length = (a: IntVector3): number => Math.hypot(a.x, a.y, a.z);
const distance = (a: IntVector3, b: IntVector3): number => length(sub(a, b));
const normalizeQ = (a: IntVector3): IntVector3 => { const l = length(a); return l < 1e-9 ? v3(0, Q, 0) : v3(Math.round(a.x / l * Q), Math.round(a.y / l * Q), Math.round(a.z / l * Q)); };
const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));
const qmul = (value: number, q: number): number => Math.round(value * q / Q);
const canonicalId = (...parts: string[]): string => parts.sort().join('|');
const quantize = (n: number): number => Math.round(n);

export const toSpatialFixed = (value: number): number => Math.round(value * POSITION_SCALE);
export const fromSpatialFixed = (value: number): number => value / POSITION_SCALE;
export const degrees = (value: number): number => Math.round(value * ROTATION_SCALE);
export const fromDegrees = (value: number): number => value / ROTATION_SCALE;

function cloneVec(value: IntVector3 | undefined, fallback = v3()): IntVector3 { return value ? v3(value.x, value.y, value.z) : v3(fallback.x, fallback.y, fallback.z); }
function validateFiniteVec(name: string, value: IntVector3): void { for (const key of ['x', 'y', 'z'] as const) if (!Number.isFinite(value[key])) throw new Error(`${name}.${key} must be finite`); }
function shapeRadius(shape: SpatialShape): number { if (shape.type === 'sphere') return shape.radius; if (shape.type === 'capsule') return shape.radius + shape.halfHeight; return Math.hypot(shape.halfExtents.x, shape.halfExtents.y, shape.halfExtents.z); }
function bodyMassInverseQ(body: SpatialBodySpec): number { if (body.kind !== 'dynamic') return 0; if (body.inverseMassQ !== undefined) return clamp(Math.round(body.inverseMassQ), 0, Q); const massQ = Math.max(1, body.massQ ?? Q); return clamp(Math.round(Q * Q / massQ), 1, Q * 1000); }
interface OrientedBox3 { center: FloatVector3; axes: [FloatVector3, FloatVector3, FloatVector3]; halfExtents: FloatVector3 }
const toFloat3 = (value: IntVector3): FloatVector3 => ({ x: value.x, y: value.y, z: value.z });
const fadd = (a: FloatVector3, b: FloatVector3): FloatVector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const fsub = (a: FloatVector3, b: FloatVector3): FloatVector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const fscale = (a: FloatVector3, scale: number): FloatVector3 => ({ x: a.x * scale, y: a.y * scale, z: a.z * scale });
const fdot = (a: FloatVector3, b: FloatVector3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const fcross = (a: FloatVector3, b: FloatVector3): FloatVector3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const flength = (a: FloatVector3): number => Math.hypot(a.x, a.y, a.z);
const fnormalize = (a: FloatVector3): FloatVector3 => { const value = flength(a); return value < 1e-9 ? { x: 1, y: 0, z: 0 } : fscale(a, 1 / value); };
const fromFloat3 = (value: FloatVector3): IntVector3 => v3(Math.round(value.x), Math.round(value.y), Math.round(value.z));
function rotationAxes(rotationDeg: IntVector3): [FloatVector3, FloatVector3, FloatVector3] {
  const rx = fromDegrees(rotationDeg.x) * Math.PI / 180, ry = fromDegrees(rotationDeg.y) * Math.PI / 180, rz = fromDegrees(rotationDeg.z) * Math.PI / 180;
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  // Rz * Ry * Rx, matching VSR transformToMat4.
  return [
    { x: cz * cy, y: sz * cy, z: -sy },
    { x: cz * sy * sx - sz * cx, y: sz * sy * sx + cz * cx, z: cy * sx },
    { x: cz * sy * cx + sz * sx, y: sz * sy * cx - cz * sx, z: cy * cx }
  ];
}
function rotateLocal(body: RuntimeSpatialBody, local: IntVector3): IntVector3 {
  const axes = rotationAxes(body.rotationDeg), point = toFloat3(local);
  return fromFloat3(fadd(fadd(fscale(axes[0], point.x), fscale(axes[1], point.y)), fscale(axes[2], point.z)));
}
function fixtureWorldPosition(body: RuntimeSpatialBody, fixture: RuntimeSpatialFixture): IntVector3 { return add(body.position, rotateLocal(body, fixture.localPosition)); }
function fixtureObb(body: RuntimeSpatialBody, fixture: RuntimeSpatialFixture & { shape: Extract<SpatialShape, { type: 'box' }> }): OrientedBox3 {
  return { center: toFloat3(fixtureWorldPosition(body, fixture)), axes: rotationAxes(body.rotationDeg), halfExtents: toFloat3(fixture.shape.halfExtents) };
}
function obbAabb(box: OrientedBox3): Aabb3 {
  const [x, y, z] = box.axes, h = box.halfExtents;
  const extent = { x: Math.abs(x.x) * h.x + Math.abs(y.x) * h.y + Math.abs(z.x) * h.z, y: Math.abs(x.y) * h.x + Math.abs(y.y) * h.y + Math.abs(z.y) * h.z, z: Math.abs(x.z) * h.x + Math.abs(y.z) * h.y + Math.abs(z.z) * h.z };
  return { min: v3(Math.floor(box.center.x - extent.x), Math.floor(box.center.y - extent.y), Math.floor(box.center.z - extent.z)), max: v3(Math.ceil(box.center.x + extent.x), Math.ceil(box.center.y + extent.y), Math.ceil(box.center.z + extent.z)) };
}
function closestPointObb(point: IntVector3, box: OrientedBox3): IntVector3 {
  const delta = fsub(toFloat3(point), box.center); let result = box.center;
  for (let index = 0; index < 3; index++) { const axis = box.axes[index]!, extent = index === 0 ? box.halfExtents.x : index === 1 ? box.halfExtents.y : box.halfExtents.z; result = fadd(result, fscale(axis, clamp(fdot(delta, axis), -extent, extent))); }
  return fromFloat3(result);
}
function pointToObbLocal(point: IntVector3, box: OrientedBox3): FloatVector3 {
  const delta=fsub(toFloat3(point),box.center);return{x:fdot(delta,box.axes[0]),y:fdot(delta,box.axes[1]),z:fdot(delta,box.axes[2])};
}
function pointFromObbLocal(point: FloatVector3, box: OrientedBox3): IntVector3 {
  return fromFloat3(fadd(box.center,fadd(fadd(fscale(box.axes[0],point.x),fscale(box.axes[1],point.y)),fscale(box.axes[2],point.z))));
}
function closestSegmentAabbLocal(start:FloatVector3,end:FloatVector3,half:FloatVector3):{segment:FloatVector3;box:FloatVector3;distance:number;inside:boolean}{
  const d=fsub(end,start),breaks=[0,1];for(const axis of ['x','y','z'] as const){if(Math.abs(d[axis])<1e-12)continue;for(const boundary of [-half[axis],half[axis]]){const t=(boundary-start[axis])/d[axis];if(t>0&&t<1)breaks.push(t)}}breaks.sort((a,b)=>a-b);const candidates=[...breaks];
  for(let i=0;i<breaks.length-1;i++){const lo=breaks[i]!,hi=breaks[i+1]!,mid=(lo+hi)/2;let numerator=0,denominator=0;for(const axis of ['x','y','z'] as const){const value=start[axis]+d[axis]*mid,boundary=value<-half[axis]?-half[axis]:value>half[axis]?half[axis]:undefined;if(boundary===undefined)continue;numerator+=d[axis]*(start[axis]-boundary);denominator+=d[axis]*d[axis]}if(denominator>1e-12){const t=clamp(-numerator/denominator,lo,hi);candidates.push(t)}}
  let best:{segment:FloatVector3;box:FloatVector3;distance:number}|undefined;for(const t of candidates){const segment=fadd(start,fscale(d,clamp(t,0,1))),boxPoint={x:clamp(segment.x,-half.x,half.x),y:clamp(segment.y,-half.y,half.y),z:clamp(segment.z,-half.z,half.z)},distance=flength(fsub(boxPoint,segment));if(!best||distance<best.distance-1e-9)best={segment,box:boxPoint,distance}}
  const result=best!;if(result.distance>1e-9)return{...result,inside:false};const faceDistances=[{axis:'x' as const,distance:half.x-Math.abs(result.segment.x)},{axis:'y' as const,distance:half.y-Math.abs(result.segment.y)},{axis:'z' as const,distance:half.z-Math.abs(result.segment.z)}].sort((a,b)=>a.distance-b.distance||a.axis.localeCompare(b.axis));const face=faceDistances[0]!,boxPoint={...result.segment};boxPoint[face.axis]=(result.segment[face.axis]>=0?1:-1)*half[face.axis];return{segment:result.segment,box:boxPoint,distance:Math.max(0,face.distance),inside:true};
}
function capsuleObbCollision(capsuleCenter:IntVector3,capsule:Extract<SpatialShape,{type:'capsule'}>,box:OrientedBox3):CollisionResult|undefined{
  const [worldStart,worldEnd]=capsuleSegment(capsuleCenter,capsule),closest=closestSegmentAabbLocal(pointToObbLocal(worldStart,box),pointToObbLocal(worldEnd,box),box.halfExtents);if(!closest.inside&&closest.distance>=capsule.radius)return undefined;const segmentWorld=pointFromObbLocal(closest.segment,box),boxWorld=pointFromObbLocal(closest.box,box),delta=sub(boxWorld,segmentWorld),normal=length(delta)<1e-9?v3(Q,0,0):normalizeQ(delta),penetration=Math.max(0,Math.round(closest.inside?capsule.radius+closest.distance:capsule.radius-closest.distance));return{point:boxWorld,normal,penetration,feature:'capsule-obb'};
}
function obbCollision(a: OrientedBox3, b: OrientedBox3): CollisionResult | undefined {
  const axes: FloatVector3[] = [...a.axes, ...b.axes];
  for (const axisA of a.axes) for (const axisB of b.axes) { const cross = fcross(axisA, axisB); if (flength(cross) > 1e-7) axes.push(fnormalize(cross)); }
  const delta = fsub(b.center, a.center); let bestAxis: FloatVector3 | undefined; let bestPenetration = Infinity;
  const radius = (box: OrientedBox3, axis: FloatVector3): number => Math.abs(fdot(box.axes[0], axis)) * box.halfExtents.x + Math.abs(fdot(box.axes[1], axis)) * box.halfExtents.y + Math.abs(fdot(box.axes[2], axis)) * box.halfExtents.z;
  for (const rawAxis of axes) {
    const axis = fnormalize(rawAxis), distanceOnAxis = Math.abs(fdot(delta, axis)), penetration = radius(a, axis) + radius(b, axis) - distanceOnAxis;
    if (penetration <= 0) return undefined;
    if (penetration < bestPenetration) { bestPenetration = penetration; bestAxis = fdot(delta, axis) >= 0 ? axis : fscale(axis, -1); }
  }
  const normal = bestAxis ?? { x: 1, y: 0, z: 0 };
  const point = fscale(fadd(a.center, b.center), .5);
  return { point: fromFloat3(point), normal: v3(Math.round(normal.x * Q), Math.round(normal.y * Q), Math.round(normal.z * Q)), penetration: Math.max(0, Math.round(bestPenetration)) };
}
function fixtureAabb(body: RuntimeSpatialBody, fixture: RuntimeSpatialFixture): Aabb3 {
  const p = fixtureWorldPosition(body, fixture), s = fixture.shape;
  if (s.type === 'sphere') return { min: v3(p.x - s.radius, p.y - s.radius, p.z - s.radius), max: v3(p.x + s.radius, p.y + s.radius, p.z + s.radius) };
  if (s.type === 'capsule') return { min: v3(p.x - s.radius, p.y - s.halfHeight - s.radius, p.z - s.radius), max: v3(p.x + s.radius, p.y + s.halfHeight + s.radius, p.z + s.radius) };
  return obbAabb(fixtureObb(body, fixture as RuntimeSpatialFixture & { shape: Extract<SpatialShape, { type: 'box' }> }));
}
function overlaps(a: Aabb3, b: Aabb3): boolean { return a.min.x <= b.max.x && a.max.x >= b.min.x && a.min.y <= b.max.y && a.max.y >= b.min.y && a.min.z <= b.max.z && a.max.z >= b.min.z; }
function filterPair(a: RuntimeSpatialFixture, b: RuntimeSpatialFixture): boolean { return (a.maskBits & b.categoryBits) !== 0 && (b.maskBits & a.categoryBits) !== 0; }
function closestPointAabb(point: IntVector3, aabb: Aabb3): IntVector3 { return v3(clamp(point.x, aabb.min.x, aabb.max.x), clamp(point.y, aabb.min.y, aabb.max.y), clamp(point.z, aabb.min.z, aabb.max.z)); }
function axisCollision(a: Aabb3, b: Aabb3): CollisionResult | undefined {
  if (!overlaps(a, b)) return undefined;
  const overlapsAxis = [
    { axis: 'x' as const, amount: Math.min(a.max.x - b.min.x, b.max.x - a.min.x), sign: (a.min.x + a.max.x) < (b.min.x + b.max.x) ? 1 : -1 },
    { axis: 'y' as const, amount: Math.min(a.max.y - b.min.y, b.max.y - a.min.y), sign: (a.min.y + a.max.y) < (b.min.y + b.max.y) ? 1 : -1 },
    { axis: 'z' as const, amount: Math.min(a.max.z - b.min.z, b.max.z - a.min.z), sign: (a.min.z + a.max.z) < (b.min.z + b.max.z) ? 1 : -1 }
  ].sort((x, y) => x.amount - y.amount || x.axis.localeCompare(y.axis));
  const best = overlapsAxis[0]!; const normal = v3(); normal[best.axis] = best.sign * Q;
  return { point: v3(Math.round((Math.max(a.min.x, b.min.x) + Math.min(a.max.x, b.max.x)) / 2), Math.round((Math.max(a.min.y, b.min.y) + Math.min(a.max.y, b.max.y)) / 2), Math.round((Math.max(a.min.z, b.min.z) + Math.min(a.max.z, b.max.z)) / 2)), normal, penetration: Math.max(0, best.amount) };
}
function capsuleSegment(center: IntVector3, shape: Extract<SpatialShape, { type: 'capsule' }>): [IntVector3, IntVector3] { return [v3(center.x, center.y - shape.halfHeight, center.z), v3(center.x, center.y + shape.halfHeight, center.z)]; }
function closestVerticalSegments(a0: IntVector3, a1: IntVector3, b0: IntVector3, b1: IntVector3): [IntVector3, IntVector3] {
  const ay = clamp((b0.y + b1.y) / 2, a0.y, a1.y), by = clamp(ay, b0.y, b1.y);
  return [v3(a0.x, Math.round(ay), a0.z), v3(b0.x, Math.round(by), b0.z)];
}
function collideFixtures(bodyA: RuntimeSpatialBody, fixtureA: RuntimeSpatialFixture, bodyB: RuntimeSpatialBody, fixtureB: RuntimeSpatialFixture): CollisionResult | undefined {
  const aPos = fixtureWorldPosition(bodyA, fixtureA), bPos = fixtureWorldPosition(bodyB, fixtureB), a = fixtureA.shape, b = fixtureB.shape;
  if (a.type === 'sphere' && b.type === 'sphere') {
    const delta = sub(bPos, aPos), d = length(delta), radius = a.radius + b.radius; if (d >= radius) return undefined;
    const normal = d < 1e-9 ? v3(Q, 0, 0) : normalizeQ(delta); return { point: add(aPos, mul(normal, a.radius / Q)), normal, penetration: Math.round(radius - d) };
  }
  if (a.type === 'sphere' && b.type === 'box') {
    const closest = closestPointObb(aPos, fixtureObb(bodyB, fixtureB as RuntimeSpatialFixture & { shape: Extract<SpatialShape, { type: 'box' }> })), delta = sub(closest, aPos), d = length(delta); if (d >= a.radius) return undefined;
    const normal = d < 1e-9 ? axisCollision(fixtureAabb(bodyA, fixtureA), fixtureAabb(bodyB, fixtureB))?.normal ?? v3(Q, 0, 0) : normalizeQ(delta); return { point: closest, normal, penetration: Math.round(a.radius - d) };
  }
  if (a.type === 'box' && b.type === 'sphere') { const result = collideFixtures(bodyB, fixtureB, bodyA, fixtureA); return result ? { ...result, normal: mul(result.normal, -1) } : undefined; }
  if (a.type === 'capsule' && b.type === 'capsule') {
    const [a0, a1] = capsuleSegment(aPos, a), [b0, b1] = capsuleSegment(bPos, b), [pa, pb] = closestVerticalSegments(a0, a1, b0, b1), delta = sub(pb, pa), d = length(delta), radius = a.radius + b.radius; if (d >= radius) return undefined;
    const normal = d < 1e-9 ? v3(Q, 0, 0) : normalizeQ(delta); return { point: add(pa, mul(normal, a.radius / Q)), normal, penetration: Math.round(radius - d) };
  }
  if (a.type === 'sphere' && b.type === 'capsule') {
    const [b0, b1] = capsuleSegment(bPos, b), closest = v3(bPos.x, clamp(aPos.y, b0.y, b1.y), bPos.z), delta = sub(closest, aPos), d = length(delta), radius = a.radius + b.radius; if (d >= radius) return undefined;
    const normal = d < 1e-9 ? v3(Q, 0, 0) : normalizeQ(delta); return { point: add(aPos, mul(normal, a.radius / Q)), normal, penetration: Math.round(radius - d) };
  }
  if (a.type === 'capsule' && b.type === 'sphere') { const result = collideFixtures(bodyB, fixtureB, bodyA, fixtureA); return result ? { ...result, normal: mul(result.normal, -1) } : undefined; }
  if (a.type === 'capsule' && b.type === 'box') return capsuleObbCollision(aPos,a,fixtureObb(bodyB,fixtureB as RuntimeSpatialFixture & {shape:Extract<SpatialShape,{type:'box'}>}));
  if (a.type === 'box' && b.type === 'capsule') { const result=collideFixtures(bodyB,fixtureB,bodyA,fixtureA);return result?{...result,normal:mul(result.normal,-1)}:undefined; }
  if (a.type === 'box' && b.type === 'box') return obbCollision(fixtureObb(bodyA, fixtureA as RuntimeSpatialFixture & { shape: Extract<SpatialShape, { type: 'box' }> }), fixtureObb(bodyB, fixtureB as RuntimeSpatialFixture & { shape: Extract<SpatialShape, { type: 'box' }> }));
  return axisCollision(fixtureAabb(bodyA, fixtureA), fixtureAabb(bodyB, fixtureB));
}
function bottomOf(body: RuntimeSpatialBody, fixture: RuntimeSpatialFixture): number { const aabb = fixtureAabb(body, fixture); return aabb.min.y; }
function pointVelocity(body: RuntimeSpatialBody): IntVector3 { return body.velocity; }

function canonicalBody(body: RuntimeSpatialBody): RuntimeSpatialBody {
  return { ...body, position: cloneVec(body.position), rotationDeg: cloneVec(body.rotationDeg), velocity: cloneVec(body.velocity), angularVelocityDeg: cloneVec(body.angularVelocityDeg), fixtures: body.fixtures.map(f => ({ ...f, localPosition: cloneVec(f.localPosition), shape: deepClone(f.shape) })), groundNormal: cloneVec(body.groundNormal), accumulatedImpulse: cloneVec(body.accumulatedImpulse), accumulatedTorque: cloneVec(body.accumulatedTorque), tags: [...(body.tags ?? [])], data: deepClone(body.data ?? {}) };
}
function makeRuntimeBody(spec: SpatialBodySpec): RuntimeSpatialBody {
  validateFiniteVec(`body:${spec.id}.position`, spec.position);
  if (!spec.fixtures.length) throw new Error(`body ${spec.id} must have at least one fixture`);
  return {
    ...deepClone(spec), rotationDeg: cloneVec(spec.rotationDeg), velocity: cloneVec(spec.velocity), angularVelocityDeg: cloneVec(spec.angularVelocityDeg),
    fixtures: spec.fixtures.map(f => ({ ...deepClone(f), localPosition: cloneVec(f.localPosition), categoryBits: f.categoryBits ?? 1, maskBits: f.maskBits ?? 0xffff_ffff })),
    inverseMassQ: bodyMassInverseQ(spec), gravityScaleQ: spec.gravityScaleQ ?? Q, linearDampingQ: spec.linearDampingQ ?? 12_000, angularDampingQ: spec.angularDampingQ ?? 20_000,
    frictionQ: spec.frictionQ ?? 500_000, restitutionQ: spec.restitutionQ ?? 0, enabled: spec.enabled ?? true, allowSleep: spec.allowSleep ?? true,
    sleepSpeedThreshold: spec.sleepSpeedThreshold ?? 8, sleepTicks: spec.sleepTicks ?? 60, awake: spec.kind === 'dynamic', sleepCounter: 0, grounded: false, groundNormal: v3(0, Q, 0), accumulatedImpulse: v3(), accumulatedTorque: v3()
  };
}
function makeCharacter(spec: SpatialCharacterSpec): RuntimeSpatialCharacter { const coyoteTicks=Math.max(0,Math.round(spec.coyoteTicks??6)),jumpBufferTicks=Math.max(0,Math.round(spec.jumpBufferTicks??6));return { ...deepClone(spec), airControlQ: spec.airControlQ ?? 250_000, groundProbe: spec.groundProbe ?? 80, maxSlopeDeg: spec.maxSlopeDeg ?? 50, footstepDistance: spec.footstepDistance ?? 900, stepHeight: spec.stepHeight ?? 450, groundSnapDistance: spec.groundSnapDistance ?? 180, skinWidth: spec.skinWidth ?? 8, platformInheritanceQ: spec.platformInheritanceQ ?? Q, coyoteTicks, jumpBufferTicks, ticksSinceGrounded:coyoteTicks+1, jumpBufferRemaining:0, desiredDirection: v3(), desiredSpeedQ: Q, jumpQueued: false, grounded: false, distanceSinceFootstep: 0, nextFoot: 'left', supportVelocity: v3() }; }
function makeListener(spec: SpatialListenerSpec): RuntimeSpatialListener { return { ...deepClone(spec), forward: cloneVec(spec.forward, v3(0, 0, -Q)), up: cloneVec(spec.up, v3(0, Q, 0)) }; }

export class SpatialEmbodimentWorld {
  readonly config: SpatialEmbodimentWorldConfig;
  readonly gravity: IntVector3;
  readonly floorY: number;
  readonly velocityIterations: number;
  readonly positionIterations: number;
  readonly maxSubsteps: number;
  readonly broadPhaseCellSize: number;
  readonly contactPersistenceDistance: number;
  private tickValue = 0;
  private readonly bodyMap = new Map<string, RuntimeSpatialBody>();
  private readonly characterMap = new Map<string, RuntimeSpatialCharacter>();
  private readonly jointMap = new Map<string, RuntimeSpatialJoint>();
  private readonly listenerMap = new Map<string, RuntimeSpatialListener>();
  private readonly materialMap = new Map<string, SpatialMaterialSpec>();
  private previousContactIds = new Set<string>();
  private readonly contactImpulseCache = new Map<string, { normalImpulse: number; tangentImpulse: number; tangent: IntVector3 }>();
  private currentContacts: SpatialContactPoint[] = [];
  private currentEvents: SpatialEmbodimentEvent[] = [];
  private diagnosticsValue: SpatialEmbodimentDiagnostics = { broadPhasePairs: 0, narrowPhaseTests: 0, contacts: 0, sensorContacts: 0, groundedBodies: 0, sleepingBodies: 0, characterControllers: 0, jointConstraints: 0, microsteps: 1, ccdBodies: 0, audioEvents: 0, hapticEvents: 0, footstepEvents: 0, broadPhaseCells: 0, persistentManifolds: 0, warmStartedContacts: 0, steppedCharacters: 0, snappedCharacters: 0, movingPlatformTransfers: 0, solverIslands:0, largestSolverIsland:0, sleepingIslands:0, warmStartedFrictionContacts:0, coyoteJumps:0, bufferedJumps:0, capsuleObbContacts:0 };

  constructor(config: SpatialEmbodimentWorldConfig) {
    if (config.format !== SPATIAL_EMBODIMENT_FORMAT && config.format !== LEGACY_SPATIAL_EMBODIMENT_FORMAT) throw new Error(`unsupported spatial embodiment format: ${config.format}`);
    if (!Number.isFinite(config.stepHz) || config.stepHz <= 0) throw new Error('stepHz must be positive');
    this.config = { ...deepClone(config), format: SPATIAL_EMBODIMENT_FORMAT }; this.gravity = cloneVec(config.gravity, v3(0, -9_810, 0)); this.floorY = config.floorY ?? 0; this.velocityIterations = config.velocityIterations ?? 6; this.positionIterations = config.positionIterations ?? 4; this.maxSubsteps = config.maxSubsteps ?? 16; this.broadPhaseCellSize = Math.max(250, Math.round(config.broadPhaseCellSize ?? 4_000)); this.contactPersistenceDistance = Math.max(0, Math.round(config.contactPersistenceDistance ?? 12));
    for (const material of config.materials ?? []) { if (this.materialMap.has(material.id)) throw new Error(`duplicate material ${material.id}`); this.materialMap.set(material.id, deepClone(material)); }
    for (const body of config.bodies) { if (this.bodyMap.has(body.id)) throw new Error(`duplicate body ${body.id}`); this.bodyMap.set(body.id, makeRuntimeBody(body)); }
    for (const character of config.characters ?? []) { if (!this.bodyMap.has(character.bodyId)) throw new Error(`character ${character.id} missing body ${character.bodyId}`); this.characterMap.set(character.id, makeCharacter(character)); }
    for (const joint of config.joints ?? []) { if (!this.bodyMap.has(joint.bodyA) || !this.bodyMap.has(joint.bodyB)) throw new Error(`joint ${joint.id} references missing body`); this.jointMap.set(joint.id, { ...deepClone(joint), enabled: joint.enabled ?? true, broken: false, lastForce: 0 }); }
    for (const listener of config.listeners ?? []) this.listenerMap.set(listener.id, makeListener(listener));
  }

  get tick(): number { return this.tickValue; }
  getBody(id: string): RuntimeSpatialBody | undefined { const body = this.bodyMap.get(id); return body ? canonicalBody(body) : undefined; }

  private applyCommand(command: SpatialCommand): void {
    if (command.type === 'set-listener') { const listener = this.listenerMap.get(command.listenerId); if (!listener) throw new Error(`listener ${command.listenerId} missing`); listener.position = cloneVec(command.position); if (command.forward) listener.forward = cloneVec(command.forward); return; }
    if (command.type === 'move-character') { const character = this.characterMap.get(command.characterId); if (!character) throw new Error(`character ${command.characterId} missing`); character.desiredDirection = cloneVec(command.direction); character.desiredSpeedQ = command.speedQ ?? Q; return; }
    if (command.type === 'jump-character') { const character = this.characterMap.get(command.characterId); if (!character) throw new Error(`character ${command.characterId} missing`); character.jumpQueued = true; character.jumpBufferRemaining=Math.max(character.jumpBufferRemaining,character.jumpBufferTicks); return; }
    if (command.type === 'set-joint-motor') { const joint = this.jointMap.get(command.jointId); if (!joint || joint.type !== 'hinge') throw new Error(`hinge joint ${command.jointId} missing`); joint.motorSpeedDeg = command.motorSpeedDeg; if (command.maxMotorTorque !== undefined) joint.maxMotorTorque = command.maxMotorTorque; return; }
    const body = this.bodyMap.get(command.bodyId); if (!body) throw new Error(`body ${command.bodyId} missing`);
    body.awake = true; body.sleepCounter = 0;
    if (command.type === 'set-velocity') body.velocity = cloneVec(command.velocity);
    else if (command.type === 'teleport') { body.position = cloneVec(command.position); if (command.rotationDeg) body.rotationDeg = cloneVec(command.rotationDeg); }
    else if (command.type === 'apply-impulse' && body.kind === 'dynamic') {
      body.velocity = add(body.velocity, mul(command.impulse, body.inverseMassQ / Q));
      if (command.worldPoint && !body.fixedRotation) { const r = sub(command.worldPoint, body.position); body.angularVelocityDeg = add(body.angularVelocityDeg, v3(Math.round((r.y * command.impulse.z - r.z * command.impulse.y) / 10_000), Math.round((r.z * command.impulse.x - r.x * command.impulse.z) / 10_000), Math.round((r.x * command.impulse.y - r.y * command.impulse.x) / 10_000))); }
    }
  }

  private applyCharacterControllers(): void {
    for (const character of this.characterMap.values()) {
      const body = this.bodyMap.get(character.bodyId)!,wasGrounded=body.grounded;character.grounded=wasGrounded;character.ticksSinceGrounded=wasGrounded?0:character.ticksSinceGrounded+1;
      const direction = normalizeQ(v3(character.desiredDirection.x, 0, character.desiredDirection.z));
      const targetSpeed = qmul(character.walkSpeed, character.desiredSpeedQ); const target = mul(direction, targetSpeed / Q);
      const controlQ = wasGrounded ? Q : character.airControlQ; const maxDelta = Math.max(1, qmul(Math.round(character.acceleration / this.config.stepHz), controlQ));
      for (const axis of ['x', 'z'] as const) { const delta = clamp(target[axis] - body.velocity[axis], -maxDelta, maxDelta); body.velocity[axis] += Math.round(delta); }
      const canCoyote=!wasGrounded&&character.ticksSinceGrounded<=character.coyoteTicks,canJump=wasGrounded||canCoyote;
      if(character.jumpBufferRemaining>0&&canJump){body.velocity.y=character.jumpSpeed;body.grounded=false;character.grounded=false;body.awake=true;if(canCoyote)this.diagnosticsValue.coyoteJumps++;if(!character.jumpQueued)this.diagnosticsValue.bufferedJumps++;character.jumpBufferRemaining=0;character.ticksSinceGrounded=character.coyoteTicks+1;}
      else if(character.jumpBufferRemaining>0)character.jumpBufferRemaining--;
      character.jumpQueued = false;
    }
  }

  private integrateVelocity(body: RuntimeSpatialBody, hz: number): void {
    if (body.kind !== 'dynamic' || !body.enabled || !body.awake) return;
    body.velocity.x += Math.round(qmul(this.gravity.x, body.gravityScaleQ) / hz); body.velocity.y += Math.round(qmul(this.gravity.y, body.gravityScaleQ) / hz); body.velocity.z += Math.round(qmul(this.gravity.z, body.gravityScaleQ) / hz);
    body.velocity = add(body.velocity, mul(body.accumulatedImpulse, body.inverseMassQ / Q)); body.accumulatedImpulse = v3();
    const linearKeepQ = clamp(Q - Math.round(body.linearDampingQ / hz), 0, Q); const angularKeepQ = clamp(Q - Math.round(body.angularDampingQ / hz), 0, Q);
    body.velocity = mul(body.velocity, linearKeepQ / Q); body.angularVelocityDeg = mul(body.angularVelocityDeg, angularKeepQ / Q);
  }
  private integratePosition(body: RuntimeSpatialBody, hz: number): void {
    if (body.kind === 'static' || !body.enabled || !body.awake) return;
    body.position.x += Math.round(body.velocity.x / hz); body.position.y += Math.round(body.velocity.y / hz); body.position.z += Math.round(body.velocity.z / hz);
    if (!body.fixedRotation) { body.rotationDeg.x += Math.round(body.angularVelocityDeg.x / hz); body.rotationDeg.y += Math.round(body.angularVelocityDeg.y / hz); body.rotationDeg.z += Math.round(body.angularVelocityDeg.z / hz); }
  }

  private floorContacts(): SpatialContactPoint[] {
    const contacts: SpatialContactPoint[] = [];
    for (const body of this.bodyMap.values()) {
      if (body.kind === 'static' || !body.enabled) continue;
      for (const fixture of body.fixtures) {
        const bottom = bottomOf(body, fixture); if (bottom > this.floorY + this.contactPersistenceDistance || body.velocity.y > 0) continue;
        const penetration = Math.max(0, this.floorY - bottom); const point = fixtureWorldPosition(body, fixture); point.y = this.floorY;
        contacts.push(this.makeContact(body, fixture, undefined, undefined, { point, normal: v3(0, -Q, 0), penetration }, true));
      }
    }
    return contacts;
  }

  private bodyCharacter(bodyId: string): RuntimeSpatialCharacter | undefined { return [...this.characterMap.values()].find(character => character.bodyId === bodyId); }

  private resetGrounding(): void {
    for (const body of this.bodyMap.values()) { body.grounded = false; body.groundNormal = v3(0, Q, 0); }
    for (const character of this.characterMap.values()) { character.grounded = false; character.supportBodyId = undefined; character.supportVelocity = v3(); }
  }

  private applyMovingPlatformInheritance(): void {
    for (const character of this.characterMap.values()) {
      if (!character.supportBodyId) continue;
      const body = this.bodyMap.get(character.bodyId), support = this.bodyMap.get(character.supportBodyId);
      if (!body || !support || support.kind !== 'kinematic') continue;
      const transfer = mul(support.velocity, character.platformInheritanceQ / Q / this.config.stepHz);
      body.position = add(body.position, transfer); character.supportVelocity = cloneVec(support.velocity); this.diagnosticsValue.movingPlatformTransfers++;
    }
  }

  private cellKeys(aabb: Aabb3): string[] {
    const c = this.broadPhaseCellSize, keys: string[] = [];
    const minX = Math.floor(aabb.min.x / c), maxX = Math.floor(aabb.max.x / c), minY = Math.floor(aabb.min.y / c), maxY = Math.floor(aabb.max.y / c), minZ = Math.floor(aabb.min.z / c), maxZ = Math.floor(aabb.max.z / c);
    for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) for (let z = minZ; z <= maxZ; z++) keys.push(`${x}:${y}:${z}`);
    return keys;
  }

  private oneWayAllows(platformBody: RuntimeSpatialBody, platformFixture: RuntimeSpatialFixture, otherBody: RuntimeSpatialBody): boolean {
    const rule = platformFixture.oneWay; if (!rule) return true;
    const localNormal = rule.normal ?? v3(0, Q, 0), normal = normalizeQ(rotateLocal(platformBody, localNormal));
    const platformPosition = fixtureWorldPosition(platformBody, platformFixture), relativePosition = sub(otherBody.position, platformPosition), side = dot(relativePosition, normal) / Q;
    const relativeVelocity = sub(otherBody.velocity, platformBody.velocity), approach = dot(relativeVelocity, normal) / Q;
    return side >= -(rule.skin ?? 20) && approach <= (rule.minApproachSpeed ?? 40);
  }

  private makeContact(bodyA: RuntimeSpatialBody, fixtureA: RuntimeSpatialFixture, bodyB: RuntimeSpatialBody | undefined, fixtureB: RuntimeSpatialFixture | undefined, result: CollisionResult, floor = false): SpatialContactPoint {
    const idValue = floor ? canonicalId('floor', bodyA.id, fixtureA.id) : canonicalId(bodyA.id, fixtureA.id, bodyB!.id, fixtureB!.id);
    const cached = this.contactImpulseCache.get(idValue);
    return { id: idValue, manifoldId: idValue, bodyA: bodyA.id, fixtureA: fixtureA.id, bodyB: floor ? '__floor__' : bodyB!.id, fixtureB: floor ? '__floor__' : fixtureB!.id, point: result.point, normal: result.normal, penetration: result.penetration, impulse: cached?.normalImpulse ?? 0, normalImpulse: cached?.normalImpulse ?? 0, tangentImpulse: cached?.tangentImpulse ?? 0, tangent: cloneVec(cached?.tangent), warmStarted: Boolean(cached), sensor: Boolean(fixtureA.sensor || fixtureB?.sensor), zoneA: fixtureA.bodyZone, zoneB: floor ? 'ground' : fixtureB?.bodyZone };
  }

  private broadPhasePairs(proxies: Array<{ body: RuntimeSpatialBody; fixture: RuntimeSpatialFixture; aabb: Aabb3 }>): Array<[number, number]> {
    const cells = new Map<string, number[]>();
    for (let index = 0; index < proxies.length; index++) for (const key of this.cellKeys(proxies[index]!.aabb)) { const bucket = cells.get(key) ?? []; bucket.push(index); cells.set(key, bucket); }
    this.diagnosticsValue.broadPhaseCells = cells.size;
    const pairKeys = new Set<string>(); const pairs: Array<[number, number]> = [];
    for (const key of [...cells.keys()].sort()) { const bucket = cells.get(key)!.sort((a,b)=>a-b); for (let i=0;i<bucket.length;i++) for(let j=i+1;j<bucket.length;j++){const a=bucket[i]!,b=bucket[j]!,pair=`${Math.min(a,b)}:${Math.max(a,b)}`;if(pairKeys.has(pair))continue;pairKeys.add(pair);pairs.push([Math.min(a,b),Math.max(a,b)]);} }
    return pairs.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  }

  private pairContacts(): SpatialContactPoint[] {
    const bodies = [...this.bodyMap.values()].filter(body => body.enabled).sort((a,b)=>a.id.localeCompare(b.id));
    const proxies: Array<{ body: RuntimeSpatialBody; fixture: RuntimeSpatialFixture; aabb: Aabb3 }> = [];
    for (const body of bodies) for (const fixture of body.fixtures) proxies.push({ body, fixture, aabb: fixtureAabb(body, fixture) });
    const contacts: SpatialContactPoint[] = [];
    for (const [i,j] of this.broadPhasePairs(proxies)) {
      const a=proxies[i]!, b=proxies[j]!; this.diagnosticsValue.broadPhasePairs++;
      if (a.body.id===b.body.id || (a.body.kind==='static'&&b.body.kind==='static') || !filterPair(a.fixture,b.fixture) || !overlaps(a.aabb,b.aabb)) continue;
      if (!this.oneWayAllows(a.body,a.fixture,b.body) || !this.oneWayAllows(b.body,b.fixture,a.body)) continue;
      this.diagnosticsValue.narrowPhaseTests++; const result=collideFixtures(a.body,a.fixture,b.body,b.fixture); if(!result)continue;if(result.feature==='capsule-obb')this.diagnosticsValue.capsuleObbContacts++;
      contacts.push(this.makeContact(a.body,a.fixture,b.body,b.fixture,result));
    }
    return contacts.sort((a,b)=>a.id.localeCompare(b.id));
  }

  private applyCachedImpulse(contact: SpatialContactPoint): void {
    if (contact.sensor || (contact.normalImpulse <= 0&&contact.tangentImpulse<=0)) return;
    const a=this.bodyForContact(contact.bodyA), b=this.bodyForContact(contact.bodyB), invA=a?.inverseMassQ??0, invB=b?.inverseMassQ??0;
    if(contact.normalImpulse>0){const impulseVec=mul(contact.normal,contact.normalImpulse/Q);if(a?.kind==='dynamic')a.velocity=sub(a.velocity,mul(impulseVec,invA/Q));if(b?.kind==='dynamic')b.velocity=add(b.velocity,mul(impulseVec,invB/Q));this.diagnosticsValue.warmStartedContacts++;}
    if(contact.tangentImpulse>0&&length(contact.tangent)>0){const frictionVec=mul(contact.tangent,contact.tangentImpulse/Q);if(a?.kind==='dynamic')a.velocity=add(a.velocity,mul(frictionVec,invA/Q));if(b?.kind==='dynamic')b.velocity=sub(b.velocity,mul(frictionVec,invB/Q));this.diagnosticsValue.warmStartedFrictionContacts++;}
  }

  private markGroundSupport(contact: SpatialContactPoint): void {
    if (contact.sensor) return;
    const candidates: Array<{ body: RuntimeSpatialBody | undefined; support: RuntimeSpatialBody | undefined; normal: IntVector3 }> = [
      {body:this.bodyForContact(contact.bodyA),support:this.bodyForContact(contact.bodyB),normal:mul(contact.normal,-1)},
      {body:this.bodyForContact(contact.bodyB),support:this.bodyForContact(contact.bodyA),normal:contact.normal}
    ];
    for(const candidate of candidates){const body=candidate.body;if(!body||body.kind!=='dynamic')continue;const character=this.bodyCharacter(body.id),maxSlope=character?.maxSlopeDeg??50,minimum=Math.cos(maxSlope*Math.PI/180)*Q;if(candidate.normal.y<minimum)continue;body.grounded=true;body.groundNormal=cloneVec(candidate.normal);if(body.velocity.y<0)body.velocity.y=0;if(character){character.grounded=true;character.supportBodyId=candidate.support?.id;character.supportVelocity=cloneVec(candidate.support?.velocity);}}
  }

  private tryCharacterSteps(contacts: SpatialContactPoint[]): SpatialContactPoint[] {
    const removed=new Set<string>();
    for(const character of this.characterMap.values()){
      const body=this.bodyMap.get(character.bodyId)!;if(character.stepHeight<=0)continue;
      for(const contact of contacts){if(contact.sensor||removed.has(contact.id)||!(contact.bodyA===body.id||contact.bodyB===body.id))continue;const bodyIsA=contact.bodyA===body.id,supportNormal=bodyIsA?mul(contact.normal,-1):contact.normal;if(Math.abs(supportNormal.y)>Q*.45)continue;const obstacle=this.bodyForContact(bodyIsA?contact.bodyB:contact.bodyA);if(!obstacle||obstacle.kind==='dynamic')continue;
        const bodyBottom=Math.min(...body.fixtures.map(f=>fixtureAabb(body,f).min.y)), obstacleTop=Math.max(...obstacle.fixtures.filter(f=>!f.sensor).map(f=>fixtureAabb(obstacle,f).max.y));const rise=obstacleTop-bodyBottom;if(rise<=0||rise>character.stepHeight)continue;
        const original=body.position.y;body.position.y+=Math.round(rise+character.skinWidth);let blocked=false;for(const other of this.bodyMap.values()){if(other.id===body.id||!other.enabled)continue;for(const own of body.fixtures)for(const foreign of other.fixtures){if(own.sensor||foreign.sensor||!filterPair(own,foreign))continue;if(collideFixtures(body,own,other,foreign)){blocked=true;break}}if(blocked)break}
        if(blocked){body.position.y=original;continue}body.grounded=true;character.grounded=true;removed.add(contact.id);this.diagnosticsValue.steppedCharacters++;break;
      }
    }
    return contacts.filter(contact=>!removed.has(contact.id));
  }

  private snapCharactersToGround(): void {
    for(const character of this.characterMap.values()){
      const body=this.bodyMap.get(character.bodyId)!;if(body.grounded||body.velocity.y>0||character.groundSnapDistance<=0)continue;
      const bodyBounds=body.fixtures.map(f=>fixtureAabb(body,f)),bottom=Math.min(...bodyBounds.map(a=>a.min.y));let bestTop=this.floorY,bestSupport:RuntimeSpatialBody|undefined;
      for(const support of this.bodyMap.values()){if(support.id===body.id||support.kind==='dynamic'||!support.enabled)continue;for(const fixture of support.fixtures){if(fixture.sensor)continue;const aabb=fixtureAabb(support,fixture),horizontal=bodyBounds.some(bounds=>bounds.max.x>=aabb.min.x&&bounds.min.x<=aabb.max.x&&bounds.max.z>=aabb.min.z&&bounds.min.z<=aabb.max.z);if(horizontal&&aabb.max.y<=bottom&&aabb.max.y>bestTop){bestTop=aabb.max.y;bestSupport=support;}}}
      const gap=bottom-bestTop;if(gap<0||gap>character.groundSnapDistance)continue;body.position.y-=gap;body.velocity.y=0;body.grounded=true;body.groundNormal=v3(0,Q,0);character.grounded=true;character.supportBodyId=bestSupport?.id;character.supportVelocity=cloneVec(bestSupport?.velocity);this.diagnosticsValue.snappedCharacters++;
    }
  }

  private updateContactCache(contacts: SpatialContactPoint[]): void {
    this.contactImpulseCache.clear();
    for(const contact of contacts){
      if(contact.sensor)continue;
      const a=this.bodyForContact(contact.bodyA),b=this.bodyForContact(contact.bodyB);const dynamic=[a,b].filter((body): body is RuntimeSpatialBody=>Boolean(body&&body.kind==='dynamic'));
      const minInverse=dynamic.length?Math.min(...dynamic.map(body=>Math.max(1,body.inverseMassQ))):Q;const supportImpulse=Math.round(length(this.gravity)/this.config.stepHz*Q/minInverse);
      const persistent=Math.abs(contact.normal.y)>=Q*.5?Math.min(contact.normalImpulse,supportImpulse):Math.min(contact.normalImpulse,100),frictionQ=Math.round(((a?.frictionQ??500_000)+(b?.frictionQ??500_000))/2),maximumTangent=qmul(persistent,frictionQ);
      if(persistent>0)this.contactImpulseCache.set(contact.id,{normalImpulse:persistent,tangentImpulse:Math.min(contact.tangentImpulse,maximumTangent),tangent:cloneVec(contact.tangent)});
    }
    this.diagnosticsValue.persistentManifolds=this.contactImpulseCache.size;
  }

  private bodyForContact(id: string): RuntimeSpatialBody | undefined { return id === '__floor__' ? undefined : this.bodyMap.get(id); }
  private correctContactPosition(contact: SpatialContactPoint): void {
    if (contact.sensor) return;
    const a=this.bodyForContact(contact.bodyA),b=this.bodyForContact(contact.bodyB),invA=a?.inverseMassQ??0,invB=b?.inverseMassQ??0,invTotal=invA+invB;if(invTotal<=0)return;
    const correction=Math.max(0,contact.penetration-1);if(correction<=0)return;
    if(a?.kind==='dynamic')a.position=sub(a.position,mul(contact.normal,correction*invA/Math.max(1,invTotal)/Q));
    if(b?.kind==='dynamic')b.position=add(b.position,mul(contact.normal,correction*invB/Math.max(1,invTotal)/Q));
  }

  private resolveContact(contact: SpatialContactPoint): void {
    if (contact.sensor) return;
    const a = this.bodyForContact(contact.bodyA), b = this.bodyForContact(contact.bodyB); const invA = a?.inverseMassQ ?? 0, invB = b?.inverseMassQ ?? 0, invTotal = invA + invB; if (invTotal <= 0) return;
    const normal = contact.normal; const va = a ? pointVelocity(a) : v3(), vb = b ? pointVelocity(b) : v3(); const relative = sub(vb, va); const normalVelocity = dot(relative, normal) / Q;
    const restitutionQ = Math.max(a?.restitutionQ ?? 0, b?.restitutionQ ?? 0); const deltaImpulse = normalVelocity < 0 ? Math.round(-(normalVelocity) * (Q + restitutionQ) / Math.max(1, invTotal)) : 0; contact.normalImpulse = Math.max(0, contact.normalImpulse + deltaImpulse); contact.impulse = contact.normalImpulse;
    const impulseVec = mul(normal, deltaImpulse / Q);
    if (a?.kind === 'dynamic') a.velocity = sub(a.velocity, mul(impulseVec, invA / Q));
    if (b?.kind === 'dynamic') b.velocity = add(b.velocity, mul(impulseVec, invB / Q));
    const tangentVelocity = sub(relative, mul(normal, normalVelocity / Q)); const tangentLength = length(tangentVelocity); if (tangentLength > 0) {
      const tangent = normalizeQ(tangentVelocity);if(contact.tangentImpulse>0&&dot(tangent,contact.tangent)<0)contact.tangentImpulse=0;contact.tangent=cloneVec(tangent);const frictionQ = Math.round(((a?.frictionQ ?? 500_000) + (b?.frictionQ ?? 500_000)) / 2); const maxFriction = qmul(Math.abs(contact.normalImpulse), frictionQ); const desiredFriction = qmul(Math.round(tangentLength), frictionQ); const frictionImpulse = Math.min(Math.max(0, maxFriction - contact.tangentImpulse), desiredFriction); contact.tangentImpulse += frictionImpulse; const f = mul(tangent, frictionImpulse / Q);
      if (a?.kind === 'dynamic') a.velocity = add(a.velocity, mul(f, invA / Q)); if (b?.kind === 'dynamic') b.velocity = sub(b.velocity, mul(f, invB / Q));
    }
    this.markGroundSupport(contact);
  }

  private solveJoints(): void {
    for (const joint of [...this.jointMap.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      if (!joint.enabled || joint.broken) continue; const a = this.bodyMap.get(joint.bodyA)!, b = this.bodyMap.get(joint.bodyB)!; const invA = a.inverseMassQ, invB = b.inverseMassQ, invTotal = invA + invB; if (invTotal <= 0) continue;
      let error = 0; let normal = normalizeQ(sub(b.position, a.position));
      if (joint.type === 'distance') error = distance(a.position, b.position) - joint.restLength;
      else { const pa = add(a.position, joint.localAnchorA ?? v3()), pb = add(b.position, joint.localAnchorB ?? v3()); normal = normalizeQ(sub(pb, pa)); error = distance(pa, pb); }
      const stiffnessQ = joint.type === 'hinge' ? 900_000 : (joint.stiffnessQ ?? 850_000); const force = Math.abs(qmul(Math.round(error), stiffnessQ)); joint.lastForce = force;
      if (joint.breakForce !== undefined && force > joint.breakForce) { joint.broken = true; this.currentEvents.push({ kind: 'joint', phase: 'break', tick: this.tickValue, jointId: joint.id, force }); continue; }
      const correction = qmul(Math.round(error), stiffnessQ); if (a.kind === 'dynamic') a.position = add(a.position, mul(normal, correction * invA / Math.max(1, invTotal) / Q)); if (b.kind === 'dynamic') b.position = sub(b.position, mul(normal, correction * invB / Math.max(1, invTotal) / Q));
      if (joint.type === 'hinge' && (joint.motorSpeedDeg ?? 0) !== 0) { const axis = normalizeQ(joint.axis ?? v3(0, Q, 0)); const target = joint.motorSpeedDeg ?? 0; const current = (dot(sub(b.angularVelocityDeg, a.angularVelocityDeg), axis) / Q); const maxTorque = joint.maxMotorTorque ?? Math.abs(target); const delta = clamp(target - current, -maxTorque, maxTorque); if (a.kind === 'dynamic') a.angularVelocityDeg = sub(a.angularVelocityDeg, mul(axis, delta * invA / Math.max(1, invTotal) / Q)); if (b.kind === 'dynamic') b.angularVelocityDeg = add(b.angularVelocityDeg, mul(axis, delta * invB / Math.max(1, invTotal) / Q)); }
      this.diagnosticsValue.jointConstraints++;
    }
  }

  private contactLifecycleAndSensory(contacts: SpatialContactPoint[]): void {
    const currentIds = new Set(contacts.map(c => c.id));
    for (const contact of contacts) {
      const phase: SpatialContactEvent['phase'] = this.previousContactIds.has(contact.id) ? 'persist' : 'begin';
      this.currentEvents.push({ kind: 'contact', phase, tick: this.tickValue, contactId: contact.id, bodyA: contact.bodyA, bodyB: contact.bodyB, point: cloneVec(contact.point), normal: cloneVec(contact.normal), impulse: contact.impulse, sensor: contact.sensor });
      if (phase === 'begin' && !contact.sensor) {
        const bodyA = this.bodyForContact(contact.bodyA), bodyB = this.bodyForContact(contact.bodyB); const fixtureA = bodyA?.fixtures.find(f => f.id === contact.fixtureA), fixtureB = bodyB?.fixtures.find(f => f.id === contact.fixtureB); const materialA = fixtureA?.materialId ? this.materialMap.get(fixtureA.materialId) : undefined, materialB = fixtureB?.materialId ? this.materialMap.get(fixtureB.materialId) : undefined;
        const sourceBodyId = bodyA?.kind === 'dynamic' ? bodyA.id : bodyB?.id; const cue = materialA?.impactSound ?? materialB?.impactSound ?? 'impact.generic'; const strengthQ = clamp(Math.round(contact.impulse * 200), 80_000, Q);
        this.currentEvents.push({ kind: 'spatial-audio', id: `audio:${this.tickValue}:${contact.id}`, tick: this.tickValue, cue, position: cloneVec(contact.point), gainQ: strengthQ, pitchQ: clamp(850_000 + Math.round(contact.impulse * 20), 700_000, 1_300_000), minDistance: 300, maxDistance: 12_000, occlusionQ: 0, sourceBodyId });
        for (const [body, zone, direction] of [[bodyA, contact.zoneA, mul(contact.normal, -1)], [bodyB, contact.zoneB, contact.normal]] as const) if (body && body.kind !== 'static') this.currentEvents.push({ kind: 'haptic', id: `haptic:${this.tickValue}:${contact.id}:${body.id}`, tick: this.tickValue, bodyId: body.id, zone: zone ?? 'body', amplitudeQ: strengthQ, frequencyHz: clamp(45 + Math.round(contact.impulse / 50), 45, 220), durationMs: clamp(30 + Math.round(contact.impulse / 20), 30, 220), direction: cloneVec(direction), sourceContactId: contact.id });
      }
    }
    for (const id of this.previousContactIds) if (!currentIds.has(id)) this.currentEvents.push({ kind: 'contact', phase: 'end', tick: this.tickValue, contactId: id, bodyA: '', bodyB: '', point: v3(), normal: v3(), impulse: 0, sensor: false });
    this.previousContactIds = currentIds;
  }

  private emitFootsteps(previousPositions: Map<string, IntVector3>): void {
    for (const character of this.characterMap.values()) {
      const body = this.bodyMap.get(character.bodyId)!, previous = previousPositions.get(body.id) ?? body.position; const planar = Math.hypot(body.position.x - previous.x, body.position.z - previous.z); if (body.grounded) character.distanceSinceFootstep += planar;
      if (body.grounded && character.distanceSinceFootstep >= character.footstepDistance && Math.hypot(body.velocity.x, body.velocity.z) > 20) {
        const foot = character.nextFoot; character.nextFoot = foot === 'left' ? 'right' : 'left'; character.distanceSinceFootstep = 0;
        const position = v3(body.position.x + (foot === 'left' ? -100 : 100), this.floorY, body.position.z); const event: SpatialFootstepEvent = { kind: 'footstep', id: `footstep:${this.tickValue}:${character.id}:${foot}`, tick: this.tickValue, characterId: character.id, bodyId: body.id, foot, position, materialId: 'ground' }; this.currentEvents.push(event);
        this.currentEvents.push({ kind: 'spatial-audio', id: `audio:${event.id}`, tick: this.tickValue, cue: 'footstep.ground', position, gainQ: 300_000, pitchQ: foot === 'left' ? 970_000 : 1_030_000, minDistance: 200, maxDistance: 8_000, occlusionQ: 0, sourceBodyId: body.id });
        this.currentEvents.push({ kind: 'haptic', id: `haptic:${event.id}`, tick: this.tickValue, bodyId: body.id, zone: foot === 'left' ? (character.leftFootZone ?? 'foot.left') : (character.rightFootZone ?? 'foot.right'), amplitudeQ: 180_000, frequencyHz: 65, durationMs: 45, direction: v3(0, Q, 0) });
      }
    }
  }

  private constraintIslands(contacts:SpatialContactPoint[]):RuntimeSpatialBody[][]{
    const dynamics=[...this.bodyMap.values()].filter(body=>body.kind==='dynamic'&&body.enabled).sort((a,b)=>a.id.localeCompare(b.id)),adjacency=new Map(dynamics.map(body=>[body.id,new Set<string>()]));
    const connect=(aId:string,bId:string)=>{const a=this.bodyMap.get(aId),b=this.bodyMap.get(bId);if(a?.kind!=='dynamic'||b?.kind!=='dynamic'||!adjacency.has(a.id)||!adjacency.has(b.id))return;adjacency.get(a.id)!.add(b.id);adjacency.get(b.id)!.add(a.id)};
    for(const contact of contacts)if(!contact.sensor)connect(contact.bodyA,contact.bodyB);for(const joint of this.jointMap.values())if(joint.enabled&&!joint.broken)connect(joint.bodyA,joint.bodyB);
    const visited=new Set<string>(),islands:RuntimeSpatialBody[][]=[];for(const body of dynamics){if(visited.has(body.id))continue;const pending=[body.id],members:RuntimeSpatialBody[]=[];visited.add(body.id);while(pending.length){const id=pending.shift()!,member=this.bodyMap.get(id)!;members.push(member);for(const next of [...(adjacency.get(id)??[])].sort())if(!visited.has(next)){visited.add(next);pending.push(next)}}islands.push(members.sort((a,b)=>a.id.localeCompare(b.id)))}
    this.diagnosticsValue.solverIslands=islands.length;this.diagnosticsValue.largestSolverIsland=Math.max(0,...islands.map(island=>island.length));return islands;
  }

  private updateSleep(islands:RuntimeSpatialBody[][]): void {
    for(const island of islands){const eligible=island.filter(body=>body.allowSleep);if(!eligible.length)continue;const active=eligible.some(body=>length(body.velocity)+length(body.angularVelocityDeg)/1000>body.sleepSpeedThreshold||!body.grounded);if(active){for(const body of island){body.sleepCounter=0;if(length(body.velocity)+length(body.angularVelocityDeg)/1000>body.sleepSpeedThreshold)body.awake=true}continue}for(const body of eligible)body.sleepCounter++;if(eligible.every(body=>body.sleepCounter>=body.sleepTicks)){for(const body of eligible){body.awake=false;body.velocity=v3();body.angularVelocityDeg=v3()}this.diagnosticsValue.sleepingIslands++;}}
  }

  step(commands: SpatialCommand[] = []): { snapshot: SpatialEmbodimentSnapshot; events: SpatialEmbodimentEvent[] } {
    this.tickValue++; this.currentEvents = []; this.currentContacts = []; this.diagnosticsValue = { broadPhasePairs: 0, narrowPhaseTests: 0, contacts: 0, sensorContacts: 0, groundedBodies: 0, sleepingBodies: 0, characterControllers: this.characterMap.size, jointConstraints: 0, microsteps: 1, ccdBodies: 0, audioEvents: 0, hapticEvents: 0, footstepEvents: 0, broadPhaseCells: 0, persistentManifolds: this.contactImpulseCache.size, warmStartedContacts: 0, steppedCharacters: 0, snappedCharacters: 0, movingPlatformTransfers: 0, solverIslands:0, largestSolverIsland:0, sleepingIslands:0, warmStartedFrictionContacts:0, coyoteJumps:0, bufferedJumps:0, capsuleObbContacts:0 };
    this.applyMovingPlatformInheritance();
    for (const command of commands.filter(c => c.tick === this.tickValue).sort((a, b) => a.id.localeCompare(b.id))) this.applyCommand(command);
    this.applyCharacterControllers(); this.resetGrounding(); const previousPositions = new Map([...this.bodyMap.values()].map(body => [body.id, cloneVec(body.position)]));
    const fastest = Math.max(0, ...[...this.bodyMap.values()].filter(b => b.kind === 'dynamic').map(b => length(b.velocity))); const bullets = [...this.bodyMap.values()].filter(b => b.bullet && b.kind === 'dynamic').length; const substeps = clamp(Math.max(1, bullets ? Math.ceil(fastest / Math.max(1, this.config.stepHz * 400)) : 1), 1, this.maxSubsteps); this.diagnosticsValue.microsteps = substeps; this.diagnosticsValue.ccdBodies = bullets;
    const subHz = this.config.stepHz * substeps;
    for (let substep = 0; substep < substeps; substep++) {
      for (const body of this.bodyMap.values()) this.integrateVelocity(body, subHz);
      for (const body of this.bodyMap.values()) this.integratePosition(body, subHz);
      for (let i = 0; i < this.positionIterations; i++) this.solveJoints();
      let contacts = [...this.floorContacts(), ...this.pairContacts()]; contacts = this.tryCharacterSteps(contacts);
      for (const contact of contacts) { this.applyCachedImpulse(contact); this.correctContactPosition(contact); }
      for (let i = 0; i < this.velocityIterations; i++) for (const contact of contacts) this.resolveContact(contact);
      this.currentContacts = contacts;
    }
    this.snapCharactersToGround(); this.updateContactCache(this.currentContacts); this.contactLifecycleAndSensory(this.currentContacts); this.emitFootsteps(previousPositions); const solverIslands=this.constraintIslands(this.currentContacts);this.updateSleep(solverIslands);
    this.diagnosticsValue.contacts = this.currentContacts.length; this.diagnosticsValue.sensorContacts = this.currentContacts.filter(c => c.sensor).length; this.diagnosticsValue.groundedBodies = [...this.bodyMap.values()].filter(b => b.grounded).length; this.diagnosticsValue.sleepingBodies = [...this.bodyMap.values()].filter(b => b.kind === 'dynamic' && !b.awake).length; this.diagnosticsValue.audioEvents = this.currentEvents.filter(e => e.kind === 'spatial-audio').length; this.diagnosticsValue.hapticEvents = this.currentEvents.filter(e => e.kind === 'haptic').length; this.diagnosticsValue.footstepEvents = this.currentEvents.filter(e => e.kind === 'footstep').length;
    const snapshot = this.snapshot(); return { snapshot, events: deepClone(this.currentEvents) };
  }

  run(ticks: number, commands: SpatialCommand[] = []): SpatialEmbodimentSnapshot { for (let i = 0; i < ticks; i++) this.step(commands); return this.snapshot(); }

  queryPoint(point: IntVector3): Array<{ bodyId: string; fixtureId: string }> {
    const hits: Array<{ bodyId: string; fixtureId: string }> = []; for (const body of this.bodyMap.values()) for (const fixture of body.fixtures) { const aabb = fixtureAabb(body, fixture); if (point.x >= aabb.min.x && point.x <= aabb.max.x && point.y >= aabb.min.y && point.y <= aabb.max.y && point.z >= aabb.min.z && point.z <= aabb.max.z) hits.push({ bodyId: body.id, fixtureId: fixture.id }); } return hits.sort((a, b) => a.bodyId.localeCompare(b.bodyId) || a.fixtureId.localeCompare(b.fixtureId));
  }
  queryAabb(bounds: Aabb3): Array<{ bodyId: string; fixtureId: string }> { const hits: Array<{ bodyId: string; fixtureId: string }> = []; for (const body of this.bodyMap.values()) for (const fixture of body.fixtures) if (overlaps(bounds, fixtureAabb(body, fixture))) hits.push({ bodyId: body.id, fixtureId: fixture.id }); return hits.sort((a, b) => a.bodyId.localeCompare(b.bodyId) || a.fixtureId.localeCompare(b.fixtureId)); }
  rayCast(origin: IntVector3, direction: IntVector3, maxDistance = 100_000): Array<{ bodyId: string; fixtureId: string; distance: number; point: IntVector3 }> {
    const dir = normalizeQ(direction), hits: Array<{ bodyId: string; fixtureId: string; distance: number; point: IntVector3 }> = [];
    for (const body of this.bodyMap.values()) for (const fixture of body.fixtures) { const aabb = fixtureAabb(body, fixture); let tmin = 0, tmax = maxDistance; let valid = true; for (const axis of ['x', 'y', 'z'] as const) { const d = dir[axis] / Q; if (Math.abs(d) < 1e-9) { if (origin[axis] < aabb.min[axis] || origin[axis] > aabb.max[axis]) valid = false; continue; } const t1 = (aabb.min[axis] - origin[axis]) / d, t2 = (aabb.max[axis] - origin[axis]) / d; tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2)); if (tmin > tmax) valid = false; } if (valid && tmin >= 0 && tmin <= maxDistance) hits.push({ bodyId: body.id, fixtureId: fixture.id, distance: Math.round(tmin), point: add(origin, mul(dir, tmin / Q)) }); }
    return hits.sort((a, b) => a.distance - b.distance || a.bodyId.localeCompare(b.bodyId));
  }

  snapshot(): SpatialEmbodimentSnapshot {
    const bodies = [...this.bodyMap.values()].sort((a, b) => a.id.localeCompare(b.id)).map(canonicalBody), characters = [...this.characterMap.values()].sort((a, b) => a.id.localeCompare(b.id)).map(x => deepClone(x)), joints = [...this.jointMap.values()].sort((a, b) => a.id.localeCompare(b.id)).map(x => deepClone(x)), listeners = [...this.listenerMap.values()].sort((a, b) => a.id.localeCompare(b.id)).map(x => deepClone(x)), contacts = deepClone(this.currentContacts), events = deepClone(this.currentEvents), reality = deepClone(this.config.reality ?? {});
    const bodyRoot = semanticHash(bodies), contactRoot = semanticHash(contacts), characterRoot = semanticHash(characters), sensoryRoot = semanticHash(events.filter(e => e.kind === 'spatial-audio' || e.kind === 'haptic' || e.kind === 'footstep')), jointRoot = semanticHash(joints);
    const base = { format: 'rsr.spatial-embodiment-snapshot.v0.6' as const, runtimeVersion: SPATIAL_EMBODIMENT_VERSION as typeof SPATIAL_EMBODIMENT_VERSION, worldId: this.config.worldId, tick: this.tickValue, stepHz: this.config.stepHz, positionScale: POSITION_SCALE, floorY: this.floorY, gravity: cloneVec(this.gravity), velocityIterations: this.velocityIterations, positionIterations: this.positionIterations, maxSubsteps: this.maxSubsteps, broadPhaseCellSize: this.broadPhaseCellSize, contactPersistenceDistance: this.contactPersistenceDistance, materials: [...this.materialMap.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(x=>deepClone(x)), reality, bodies, characters, joints, listeners, contacts, events, diagnostics: deepClone(this.diagnosticsValue), bodyRoot, contactRoot, characterRoot, sensoryRoot, jointRoot };
    return { ...base, stateRoot: semanticHash(base) };
  }

  static fromSnapshot(snapshot: SpatialEmbodimentSnapshot): SpatialEmbodimentWorld {
    if (!verifySpatialEmbodimentSnapshot(snapshot)) throw new Error('SPATIAL_SNAPSHOT_INTEGRITY_MISMATCH');
    const config: SpatialEmbodimentWorldConfig = { format: SPATIAL_EMBODIMENT_FORMAT, worldId: snapshot.worldId, stepHz: snapshot.stepHz, floorY: snapshot.floorY, gravity: cloneVec(snapshot.gravity), velocityIterations: snapshot.velocityIterations, positionIterations: snapshot.positionIterations, maxSubsteps: snapshot.maxSubsteps, broadPhaseCellSize: snapshot.broadPhaseCellSize, contactPersistenceDistance: snapshot.contactPersistenceDistance, materials: snapshot.materials.map(x => deepClone(x)), bodies: snapshot.bodies.map(body => ({ ...deepClone(body), fixtures: body.fixtures.map(f => deepClone(f)) })), characters: snapshot.characters.map(x => deepClone(x)), joints: snapshot.joints.map(x => deepClone(x)), listeners: snapshot.listeners.map(x => deepClone(x)), reality: deepClone(snapshot.reality) };
    const world = new SpatialEmbodimentWorld(config); world.tickValue = snapshot.tick; world.bodyMap.clear(); for (const body of snapshot.bodies) world.bodyMap.set(body.id, canonicalBody(body)); world.characterMap.clear(); for (const character of snapshot.characters) world.characterMap.set(character.id, deepClone(character)); world.jointMap.clear(); for (const joint of snapshot.joints) world.jointMap.set(joint.id, deepClone(joint)); world.listenerMap.clear(); for (const listener of snapshot.listeners) world.listenerMap.set(listener.id, deepClone(listener)); world.currentContacts = deepClone(snapshot.contacts); world.currentEvents = deepClone(snapshot.events); world.previousContactIds = new Set(snapshot.contacts.map(c => c.id)); for (const contact of snapshot.contacts) if (!contact.sensor) world.contactImpulseCache.set(contact.id, { normalImpulse: contact.normalImpulse ?? contact.impulse, tangentImpulse: contact.tangentImpulse ?? 0, tangent: cloneVec(contact.tangent) }); world.diagnosticsValue = deepClone(snapshot.diagnostics); return world;
  }
}


export function spatialEmbodimentSnapshotBase(snapshot: SpatialEmbodimentSnapshot): Omit<SpatialEmbodimentSnapshot, 'stateRoot'> {
  return {
    format: snapshot.format,
    runtimeVersion: snapshot.runtimeVersion,
    worldId: snapshot.worldId,
    tick: snapshot.tick,
    stepHz: snapshot.stepHz,
    positionScale: snapshot.positionScale,
    floorY: snapshot.floorY,
    gravity: deepClone(snapshot.gravity),
    velocityIterations: snapshot.velocityIterations,
    positionIterations: snapshot.positionIterations,
    maxSubsteps: snapshot.maxSubsteps,
    broadPhaseCellSize: snapshot.broadPhaseCellSize,
    contactPersistenceDistance: snapshot.contactPersistenceDistance,
    materials: deepClone(snapshot.materials),
    reality: deepClone(snapshot.reality),
    bodies: deepClone(snapshot.bodies),
    characters: deepClone(snapshot.characters),
    joints: deepClone(snapshot.joints),
    listeners: deepClone(snapshot.listeners),
    contacts: deepClone(snapshot.contacts),
    events: deepClone(snapshot.events),
    diagnostics: deepClone(snapshot.diagnostics),
    bodyRoot: snapshot.bodyRoot,
    contactRoot: snapshot.contactRoot,
    characterRoot: snapshot.characterRoot,
    sensoryRoot: snapshot.sensoryRoot,
    jointRoot: snapshot.jointRoot,
  };
}

export function computeSpatialEmbodimentStateRoot(snapshot: SpatialEmbodimentSnapshot): string {
  return semanticHash(spatialEmbodimentSnapshotBase(snapshot));
}

export function verifySpatialEmbodimentSnapshot(snapshot: SpatialEmbodimentSnapshot): boolean {
  return computeSpatialEmbodimentStateRoot(snapshot) === snapshot.stateRoot;
}

export function replaySpatialEmbodiment(config: SpatialEmbodimentWorldConfig, ticks: number, commands: SpatialCommand[] = []): SpatialEmbodimentSnapshot { return new SpatialEmbodimentWorld(config).run(ticks, commands); }

export interface SpatialEmbodimentCausalDelta {
  format: 'rfe.spatial-embodiment-causal-delta.v0.6';
  worldId: string;
  baseRealityRoot: string;
  tick: number;
  facts: Array<{ subject: string; predicate: string; object: VSRValue }>;
  evidence: { stateRoot: string; bodyRoot: string; contactRoot: string; characterRoot: string; sensoryRoot: string; jointRoot: string };
  deltaRoot: string;
}
export function spatialEmbodimentSnapshotToCausalDelta(snapshot: SpatialEmbodimentSnapshot, baseRealityRoot: string): SpatialEmbodimentCausalDelta {
  const facts: SpatialEmbodimentCausalDelta['facts'] = [];
  for (const body of snapshot.bodies) { facts.push({ subject: `body:${body.id}`, predicate: 'spatial.position', object: deepClone(body.position) as unknown as VSRValue }); facts.push({ subject: `body:${body.id}`, predicate: 'spatial.rotation', object: deepClone(body.rotationDeg) as unknown as VSRValue }); facts.push({ subject: `body:${body.id}`, predicate: 'embodiment.grounded', object: body.grounded }); }
  for (const character of snapshot.characters) facts.push({ subject: `character:${character.id}`, predicate: 'embodiment.body', object: character.bodyId });
  const evidence = { stateRoot: snapshot.stateRoot, bodyRoot: snapshot.bodyRoot, contactRoot: snapshot.contactRoot, characterRoot: snapshot.characterRoot, sensoryRoot: snapshot.sensoryRoot, jointRoot: snapshot.jointRoot };
  const base = { format: 'rfe.spatial-embodiment-causal-delta.v0.6' as const, worldId: snapshot.worldId, baseRealityRoot, tick: snapshot.tick, facts, evidence }; return { ...base, deltaRoot: semanticHash(base) };
}
