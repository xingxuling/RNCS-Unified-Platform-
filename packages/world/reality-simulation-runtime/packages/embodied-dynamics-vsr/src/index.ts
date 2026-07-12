import { renderPng } from '../../backend-canvas/src/index.js';
import { evaluateAt, prepareDocument, type VSRPreparedDocument } from '../../core/src/index.js';
import { projectDisplayForObserver, verifyObserverProjectionSet, type VSRObserverProfile, type VSRObserverProjection } from '../../observer-projection/src/index.js';
import { documentHash, semanticHash, type VSRDocument, type VSRNode, type VSRValue } from '../../spec/src/index.js';
import {
  ANGLE_TURN_SCALE,
  DEFAULT_POSITION_SCALE,
  fromDynamicsFixed,
  type ConvexShape,
  type EmbodiedDynamicsSnapshot,
  type EmbodiedDynamicsWorldConfig,
  type IntVector2,
  type RuntimeBody,
  type RuntimeFixture
} from '../../embodied-dynamics/src/index.js';

export interface EmbodiedDynamicsVisualOptions {
  width?: number;
  height?: number;
  title?: string;
  maxContactMarkers?: number;
  background?: string;
  dynamicFill?: string;
  staticFill?: string;
  kinematicFill?: string;
  sensorFill?: string;
}
export interface EmbodiedDynamicsRenderView { observer: VSRObserverProfile; projection: VSRObserverProjection; png: Uint8Array; pngHash: string }
export interface EmbodiedDynamicsRenderSet { sourceDocumentHash: string; sourceDisplayHash: string; simulationRoot: string; invariantHash: string; verification: ReturnType<typeof verifyObserverProjectionSet>; views: EmbodiedDynamicsRenderView[] }

const debugPolicy = { format: 'vsr.observer-policy.v0.1', anyRole: ['debugger', 'auditor'], deny: 'hide', reason: 'embodied-dynamics-debug-only' };
export function createEmbodiedObserverProfile(kind: 'player' | 'debugger' | 'auditor'): VSRObserverProfile {
  return { format: 'vsr.observer-profile.v0.1', observerId: `embodied-dynamics:${kind}`, roles: [kind], scopes: kind === 'player' ? ['simulation.view'] : ['simulation.view', 'simulation.debug', 'simulation.evidence'], clearance: kind === 'player' ? 0 : 4 };
}
function rotate(v: { x: number; y: number }, turns: number): { x: number; y: number } { const r = turns * Math.PI * 2; const c = Math.cos(r); const s = Math.sin(r); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; }
function worldPoint(body: Pick<RuntimeBody, 'position' | 'angle'>, fixture: Pick<RuntimeFixture, 'localPosition' | 'localAngle'>, local: { x: number; y: number }, scale: number): { x: number; y: number } {
  const bodyAngle = body.angle / ANGLE_TURN_SCALE; const fixtureAngle = fixture.localAngle / ANGLE_TURN_SCALE; const fixtureCenterOffset = rotate({ x: fixture.localPosition.x / scale, y: fixture.localPosition.y / scale }, bodyAngle); const shapeOffset = rotate(local, bodyAngle + fixtureAngle);
  return { x: body.position.x / scale + fixtureCenterOffset.x + shapeOffset.x, y: body.position.y / scale + fixtureCenterOffset.y + shapeOffset.y };
}
function localOutline(shape: ConvexShape, scale: number): Array<{ x: number; y: number }> {
  if (shape.type === 'box') { const x = shape.halfExtents.x / scale; const y = shape.halfExtents.y / scale; return [{ x: -x, y: -y }, { x, y: -y }, { x, y }, { x: -x, y }]; }
  if (shape.type === 'polygon') return shape.vertices.map(v => ({ x: v.x / scale, y: v.y / scale }));
  if (shape.type === 'segment') { const a = { x: shape.a.x / scale, y: shape.a.y / scale }; const b = { x: shape.b.x / scale, y: shape.b.y / scale }; const radius = (shape.radius ?? 2) / scale; const dx = b.x - a.x; const dy = b.y - a.y; const length = Math.max(1e-9, Math.hypot(dx, dy)); const nx = -dy / length * radius; const ny = dx / length * radius; return [{ x: a.x + nx, y: a.y + ny }, { x: b.x + nx, y: b.y + ny }, { x: b.x - nx, y: b.y - ny }, { x: a.x - nx, y: a.y - ny }]; }
  if (shape.type === 'capsule') { const points: Array<{ x: number; y: number }> = []; const h = shape.halfLength / scale; const r = shape.radius / scale; for (let i = 0; i <= 8; i++) { const angle = -Math.PI / 2 + i * Math.PI / 8; points.push({ x: h + Math.cos(angle) * r, y: Math.sin(angle) * r }); } for (let i = 0; i <= 8; i++) { const angle = Math.PI / 2 + i * Math.PI / 8; points.push({ x: -h + Math.cos(angle) * r, y: Math.sin(angle) * r }); } return points; }
  const points: Array<{ x: number; y: number }> = []; const r = shape.radius / scale; for (let i = 0; i < 24; i++) { const angle = i / 24 * Math.PI * 2; points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r }); } return points;
}
function pathFor(body: Pick<RuntimeBody, 'position' | 'angle'>, fixture: RuntimeFixture, scale: number): string { const points = localOutline(fixture.shape, scale).map(p => worldPoint(body, fixture, p, scale)); return points.length ? `M ${points.map((p, i) => `${i ? 'L ' : ''}${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' ')} Z` : ''; }
function boundsFor(body: Pick<RuntimeBody, 'position' | 'angle'>, fixture: RuntimeFixture, scale: number): { x: number; y: number; width: number; height: number } { const points = localOutline(fixture.shape, scale).map(p => worldPoint(body, fixture, p, scale)); const xs = points.map(p => p.x); const ys = points.map(p => p.y); const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys); return { x: minX, y: minY, width: Math.max(0.001, maxX - minX), height: Math.max(0.001, maxY - minY) }; }
function fillFor(kind: RuntimeBody['kind'], sensor: boolean, options: EmbodiedDynamicsVisualOptions): string { if (sensor) return options.sensorFill ?? '#a855f7'; if (kind === 'static') return options.staticFill ?? '#334155'; if (kind === 'kinematic') return options.kinematicFill ?? '#0891b2'; return options.dynamicFill ?? '#2563eb'; }

export function createEmbodiedDynamicsVisualDocument(config: EmbodiedDynamicsWorldConfig, options: EmbodiedDynamicsVisualOptions = {}): VSRDocument {
  const width = options.width ?? 960; const height = options.height ?? 540; const scale = config.positionScale ?? DEFAULT_POSITION_SCALE; const maxContacts = options.maxContactMarkers ?? 64; const nodes: VSRNode[] = [];
  for (const joint of [...(config.joints ?? [])].sort((a, b) => a.id.localeCompare(b.id))) nodes.push({ id: `joint:${joint.id}`, type: 'line', zIndex: 12, layout: { x: 0, y: 0, width, height }, appearance: { stroke: { type: 'solid', color: '#fbbf24' }, strokeWidth: 2 }, content: { x1: 0, y1: 0, x2: 0, y2: 0 }, extensions: { 'vsr:observer-policy': debugPolicy }, data: { jointId: joint.id, type: joint.type } });
  for (const bodySpec of [...config.bodies].sort((a, b) => a.id.localeCompare(b.id))) {
    const runtimeLike: Pick<RuntimeBody, 'position' | 'angle'> = { position: bodySpec.position, angle: bodySpec.angle ?? 0 };
    for (const fixtureSpec of bodySpec.fixtures) {
      const fixture: RuntimeFixture = { id: fixtureSpec.id, shape: fixtureSpec.shape, localPosition: fixtureSpec.localPosition ?? { x: 0, y: 0 }, localAngle: fixtureSpec.localAngle ?? 0, materialId: fixtureSpec.materialId ?? 'default', densityQ: fixtureSpec.densityQ ?? 1_000_000, frictionQ: fixtureSpec.frictionQ ?? 500_000, restitutionQ: fixtureSpec.restitutionQ ?? 0, sensor: Boolean(fixtureSpec.sensor), filter: { categoryBits: fixtureSpec.filter?.categoryBits ?? 1, maskBits: fixtureSpec.filter?.maskBits ?? 0xffffffff, groupIndex: fixtureSpec.filter?.groupIndex ?? 0 }, tags: fixtureSpec.tags ?? [], data: fixtureSpec.data ?? {} };
      const bounds = boundsFor(runtimeLike, fixture, scale);
      nodes.push({ id: `fixture:${bodySpec.id}:${fixture.id}`, type: 'path', zIndex: bodySpec.kind === 'static' ? 10 : bodySpec.kind === 'kinematic' ? 18 : 20, layout: { x: 0, y: 0, width, height }, appearance: { fill: { type: 'solid', color: fillFor(bodySpec.kind, fixture.sensor, options) }, stroke: { type: 'solid', color: fixture.sensor ? '#e9d5ff' : '#e2e8f0' }, strokeWidth: fixture.sensor ? 2 : 1, opacity: fixture.sensor ? 0.45 : 1 }, content: { d: pathFor(runtimeLike, fixture, scale) }, tags: ['embodied-fixture', bodySpec.kind, fixture.shape.type, ...(fixture.tags ?? [])], data: { bodyId: bodySpec.id, fixtureId: fixture.id, shape: fixture.shape.type, sensor: fixture.sensor } });
      nodes.push({ id: `label:${bodySpec.id}:${fixture.id}`, type: 'text', zIndex: 45, layout: { x: bounds.x, y: bounds.y - 18, width: Math.max(120, bounds.width + 80), height: 16 }, appearance: { fill: { type: 'solid', color: '#f8fafc' } }, content: { text: `${bodySpec.id}/${fixture.id}`, fontSize: 11 }, extensions: { 'vsr:observer-policy': debugPolicy } });
    }
    nodes.push({ id: `velocity:${bodySpec.id}`, type: 'line', zIndex: 40, layout: { x: 0, y: 0, width, height }, appearance: { stroke: { type: 'solid', color: '#f97316' }, strokeWidth: 2 }, content: { x1: 0, y1: 0, x2: 0, y2: 0 }, extensions: { 'vsr:observer-policy': debugPolicy } });
  }
  for (let i = 0; i < maxContacts; i++) nodes.push({ id: `contact:${i}`, type: 'ellipse', visible: false, zIndex: 60, layout: { x: 0, y: 0, width: 8, height: 8 }, appearance: { fill: { type: 'solid', color: '#ef4444' }, stroke: { type: 'solid', color: '#fff' }, strokeWidth: 1 }, extensions: { 'vsr:observer-policy': debugPolicy } });
  nodes.push({ id: 'debug:status', type: 'text', zIndex: 80, layout: { x: 12, y: 10, width: width - 24, height: 52 }, appearance: { fill: { type: 'solid', color: '#f8fafc' } }, content: { text: 'Embodied Dynamics', fontSize: 14 }, extensions: { 'vsr:observer-policy': debugPolicy } });
  return { specVersion: '0.1', runtimeTarget: 'rsr-embodied-dynamics-vsr-v0.3', metadata: { id: `embodied-dynamics:${config.worldId}`, title: options.title ?? `Embodied Dynamics · ${config.worldId}`, duration: 86_400, defaultFps: config.stepHz, seed: 1, description: '具身动力学与现实约束求解层的观察者相对 Visual IR。' }, canvas: { width, height, background: { type: 'solid', color: options.background ?? '#0f172a' } }, variables: { worldId: config.worldId, tick: 0, stateRoot: '' }, nodes, extensions: { 'rsr:embodied-dynamics-world': { format: config.format, worldId: config.worldId, configHash: semanticHash(config), stableVisualIr: true } } };
}

export function embodiedSnapshotToRuntimeOverrides(snapshot: EmbodiedDynamicsSnapshot, maxContacts = 64): Record<string, VSRValue> {
  const overrides: Record<string, VSRValue> = {}; const bodyById = new Map(snapshot.bodies.map(b => [b.id, b]));
  for (const body of snapshot.bodies) {
    for (const fixture of body.fixtures) { const bounds = boundsFor(body, fixture, snapshot.positionScale); overrides[`fixture:${body.id}:${fixture.id}.content.d`] = pathFor(body, fixture, snapshot.positionScale); overrides[`label:${body.id}:${fixture.id}.layout.x`] = bounds.x; overrides[`label:${body.id}:${fixture.id}.layout.y`] = bounds.y - 18; overrides[`label:${body.id}:${fixture.id}.content.text`] = `${body.id}/${fixture.id} · ${fixture.shape.type} · θ=${(body.angle / ANGLE_TURN_SCALE * 360).toFixed(1)}°`; }
    const cx = fromDynamicsFixed(body.position.x, snapshot.positionScale); const cy = fromDynamicsFixed(body.position.y, snapshot.positionScale); overrides[`velocity:${body.id}.content.x1`] = cx; overrides[`velocity:${body.id}.content.y1`] = cy; overrides[`velocity:${body.id}.content.x2`] = cx + fromDynamicsFixed(body.velocity.x, snapshot.positionScale) * 0.08; overrides[`velocity:${body.id}.content.y2`] = cy + fromDynamicsFixed(body.velocity.y, snapshot.positionScale) * 0.08;
  }
  for (const joint of snapshot.joints) { const a = bodyById.get(joint.bodyA); const b = bodyById.get(joint.bodyB); if (!a || !b) continue; overrides[`joint:${joint.id}.visible`] = joint.enabled && !joint.broken; overrides[`joint:${joint.id}.content.x1`] = fromDynamicsFixed(a.position.x, snapshot.positionScale); overrides[`joint:${joint.id}.content.y1`] = fromDynamicsFixed(a.position.y, snapshot.positionScale); overrides[`joint:${joint.id}.content.x2`] = fromDynamicsFixed(b.position.x, snapshot.positionScale); overrides[`joint:${joint.id}.content.y2`] = fromDynamicsFixed(b.position.y, snapshot.positionScale); }
  const points = snapshot.contacts.flatMap(c => c.points.map(p => p.point)); for (let i = 0; i < maxContacts; i++) { const point = points[i]; overrides[`contact:${i}.visible`] = Boolean(point); if (point) { overrides[`contact:${i}.layout.x`] = fromDynamicsFixed(point.x, snapshot.positionScale) - 4; overrides[`contact:${i}.layout.y`] = fromDynamicsFixed(point.y, snapshot.positionScale) - 4; } }
  overrides['debug:status.content.text'] = `Embodied Dynamics ${snapshot.runtimeVersion} · tick ${snapshot.tick} · bodies ${snapshot.bodies.length} · fixtures ${snapshot.diagnostics.fixtureProxies} · contacts ${snapshot.contacts.length} · islands ${snapshot.islands.length} · substeps ${snapshot.diagnostics.microsteps} · GJK/EPA ${snapshot.diagnostics.gjkCalls}/${snapshot.diagnostics.epaCalls} · root ${snapshot.stateRoot.slice(-12)}`;
  return overrides;
}

export class EmbodiedDynamicsVSRBridge {
  readonly document: VSRDocument; readonly prepared: VSRPreparedDocument; readonly maxContacts: number;
  constructor(config: EmbodiedDynamicsWorldConfig, options: EmbodiedDynamicsVisualOptions = {}) { this.maxContacts = options.maxContactMarkers ?? 64; this.document = createEmbodiedDynamicsVisualDocument(config, options); this.prepared = prepareDocument(this.document); }
  evaluate(snapshot: EmbodiedDynamicsSnapshot) { return evaluateAt({ document: this.prepared, time: snapshot.tick / snapshot.stepHz, initialState: { variables: { worldId: snapshot.worldId, tick: snapshot.tick, stateRoot: snapshot.stateRoot } }, runtimeOverrides: embodiedSnapshotToRuntimeOverrides(snapshot, this.maxContacts) }); }
  render(snapshot: EmbodiedDynamicsSnapshot, observers: VSRObserverProfile[] = [createEmbodiedObserverProfile('player'), createEmbodiedObserverProfile('debugger')]): EmbodiedDynamicsRenderSet { const evaluated = this.evaluate(snapshot); const invariant = { format: 'rsr.embodied-dynamics-reality-invariant.v0.3', worldId: snapshot.worldId, tick: snapshot.tick, stateRoot: snapshot.stateRoot, bodyRoot: snapshot.bodyRoot, contactRoot: snapshot.contactRoot, jointRoot: snapshot.jointRoot, islandRoot: snapshot.islandRoot }; const projections = observers.map(observer => projectDisplayForObserver(this.document, evaluated.displayState, observer, { invariant })); const verification = verifyObserverProjectionSet(projections); const views = projections.map(projection => { const png = renderPng(projection.displayState); return { observer: projection.observer, projection, png, pngHash: semanticHash([...png]) }; }); return { sourceDocumentHash: documentHash(this.document), sourceDisplayHash: evaluated.displayState.semanticHash, simulationRoot: snapshot.stateRoot, invariantHash: projections[0]?.manifest.invariantHash ?? semanticHash(invariant), verification, views }; }
}
