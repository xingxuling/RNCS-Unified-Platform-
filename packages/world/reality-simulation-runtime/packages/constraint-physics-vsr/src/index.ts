import { renderPng } from '../../backend-canvas/src/index.js';
import { evaluateAt, prepareDocument, type VSRPreparedDocument } from '../../core/src/index.js';
import { projectDisplayForObserver, verifyObserverProjectionSet, type VSRObserverProfile, type VSRObserverProjection } from '../../observer-projection/src/index.js';
import { documentHash, semanticHash, type VSRDocument, type VSRNode, type VSRValue } from '../../spec/src/index.js';
import {
  fromConstraintFixed,
  type ConstraintPhysicsSnapshot,
  type ConstraintPhysicsWorldConfig,
  type RuntimeConstraintBody
} from '../../constraint-physics/src/index.js';

export interface ConstraintPhysicsVisualOptions {
  width?: number;
  height?: number;
  title?: string;
  maxContactMarkers?: number;
  background?: string;
  dynamicFill?: string;
  staticFill?: string;
  kinematicFill?: string;
  sensorFill?: string;
  debugFill?: string;
}

export interface ConstraintPhysicsRenderView {
  observer: VSRObserverProfile;
  projection: VSRObserverProjection;
  png: Uint8Array;
  pngHash: string;
}

export interface ConstraintPhysicsRenderSet {
  sourceDocumentHash: string;
  sourceDisplayHash: string;
  simulationRoot: string;
  invariantHash: string;
  verification: ReturnType<typeof verifyObserverProjectionSet>;
  views: ConstraintPhysicsRenderView[];
}

const debugPolicy = {
  format: 'vsr.observer-policy.v0.1',
  anyRole: ['debugger', 'auditor'],
  deny: 'hide',
  reason: 'constraint-physics-debug-only'
};

export function createConstraintPhysicsObserverProfile(kind: 'player' | 'debugger' | 'auditor'): VSRObserverProfile {
  return {
    format: 'vsr.observer-profile.v0.1',
    observerId: `constraint-physics:${kind}`,
    roles: [kind],
    scopes: kind === 'player' ? ['simulation.view'] : ['simulation.view', 'simulation.debug', 'simulation.evidence'],
    clearance: kind === 'player' ? 0 : 3
  };
}

function bodyBounds(body: { position: { x: number; y: number }; shape: RuntimeConstraintBody['shape'] }, scale: number): { x: number; y: number; width: number; height: number } {
  if (body.shape.type === 'box') {
    return {
      x: fromConstraintFixed(body.position.x - body.shape.halfExtents.x, scale),
      y: fromConstraintFixed(body.position.y - body.shape.halfExtents.y, scale),
      width: fromConstraintFixed(body.shape.halfExtents.x * 2, scale),
      height: fromConstraintFixed(body.shape.halfExtents.y * 2, scale)
    };
  }
  return {
    x: fromConstraintFixed(body.position.x - body.shape.radius, scale),
    y: fromConstraintFixed(body.position.y - body.shape.radius, scale),
    width: fromConstraintFixed(body.shape.radius * 2, scale),
    height: fromConstraintFixed(body.shape.radius * 2, scale)
  };
}

function fillForBody(body: ConstraintPhysicsWorldConfig['bodies'][number], options: ConstraintPhysicsVisualOptions): string {
  if (body.sensor) return options.sensorFill ?? '#8b5cf6';
  if (body.kind === 'static') return options.staticFill ?? '#334155';
  if (body.kind === 'kinematic') return options.kinematicFill ?? '#0891b2';
  return options.dynamicFill ?? '#2563eb';
}

export function createConstraintPhysicsVisualDocument(config: ConstraintPhysicsWorldConfig, options: ConstraintPhysicsVisualOptions = {}): VSRDocument {
  const width = options.width ?? 720;
  const height = options.height ?? 420;
  const maxContacts = options.maxContactMarkers ?? 32;
  const scale = config.scale ?? 1_000;
  const nodes: VSRNode[] = [];

  for (const constraint of [...(config.constraints ?? [])].sort((a, b) => a.id.localeCompare(b.id))) {
    nodes.push({
      id: `constraint:${constraint.id}`,
      type: 'line',
      zIndex: 14,
      layout: { x: 0, y: 0, width, height },
      appearance: { stroke: { type: 'solid', color: '#fbbf24' }, strokeWidth: 2 },
      content: { x1: 0, y1: 0, x2: 0, y2: 0 },
      extensions: { 'vsr:observer-policy': debugPolicy },
      data: { constraintId: constraint.id, type: constraint.type }
    });
  }

  for (const body of [...config.bodies].sort((a, b) => a.id.localeCompare(b.id))) {
    const bounds = bodyBounds(body, scale);
    nodes.push({
      id: `body:${body.id}`,
      type: body.shape.type === 'circle' ? 'ellipse' : 'rect',
      zIndex: body.kind === 'static' ? 10 : body.kind === 'kinematic' ? 18 : 20,
      layout: bounds,
      appearance: {
        fill: { type: 'solid', color: fillForBody(body, options) },
        stroke: { type: 'solid', color: body.sensor ? '#ddd6fe' : '#e2e8f0' },
        strokeWidth: body.sensor ? 2 : 1,
        opacity: body.sensor ? 0.45 : 1
      },
      content: body.shape.type === 'box' ? { cornerRadius: body.kind === 'static' ? 2 : 6 } : {},
      tags: ['constraint-physics-body', body.kind, body.shape.type, ...(body.tags ?? [])],
      data: { bodyId: body.id, kind: body.kind, shape: body.shape.type, sensor: Boolean(body.sensor) }
    });
    nodes.push({
      id: `label:${body.id}`,
      type: 'text',
      zIndex: 45,
      layout: { x: bounds.x, y: bounds.y - 18, width: Math.max(90, bounds.width + 60), height: 16 },
      appearance: { fill: { type: 'solid', color: '#f8fafc' } },
      content: { text: body.id, fontSize: 11 },
      extensions: { 'vsr:observer-policy': debugPolicy }
    });
    nodes.push({
      id: `velocity:${body.id}`,
      type: 'line',
      zIndex: 40,
      layout: { x: 0, y: 0, width, height },
      appearance: { stroke: { type: 'solid', color: options.debugFill ?? '#f97316' }, strokeWidth: 2 },
      content: { x1: 0, y1: 0, x2: 0, y2: 0 },
      extensions: { 'vsr:observer-policy': debugPolicy }
    });
  }

  for (let index = 0; index < maxContacts; index++) {
    nodes.push({
      id: `contact:${index}`,
      type: 'ellipse',
      visible: false,
      zIndex: 55,
      layout: { x: 0, y: 0, width: 8, height: 8 },
      appearance: { fill: { type: 'solid', color: '#ef4444' }, stroke: { type: 'solid', color: '#fff' }, strokeWidth: 1 },
      extensions: { 'vsr:observer-policy': debugPolicy },
      data: { contactSlot: index }
    });
  }

  nodes.push({
    id: 'debug:status',
    type: 'text',
    zIndex: 70,
    layout: { x: 12, y: 10, width: width - 24, height: 42 },
    appearance: { fill: { type: 'solid', color: '#f8fafc' } },
    content: { text: 'Constraint Physics', fontSize: 14 },
    extensions: { 'vsr:observer-policy': debugPolicy }
  });

  return {
    specVersion: '0.1',
    runtimeTarget: 'rsr-constraint-physics-vsr-v0.2',
    metadata: {
      id: `constraint-physics:${config.worldId}`,
      title: options.title ?? `Constraint Physics · ${config.worldId}`,
      duration: 86_400,
      defaultFps: config.stepHz,
      seed: 1,
      description: '现实约束与因果响应织构的稳定 Visual IR。'
    },
    canvas: { width, height, background: { type: 'solid', color: options.background ?? '#0f172a' } },
    variables: { worldId: config.worldId, tick: 0, stateRoot: '' },
    nodes,
    extensions: {
      'rsr:constraint-world': {
        format: config.format,
        worldId: config.worldId,
        configHash: semanticHash(config),
        stableVisualIr: true
      }
    }
  };
}

export function constraintSnapshotToRuntimeOverrides(snapshot: ConstraintPhysicsSnapshot, maxContactMarkers = 32): Record<string, VSRValue> {
  const overrides: Record<string, VSRValue> = {};
  const bodyById = new Map(snapshot.bodies.map(body => [body.id, body]));
  for (const body of snapshot.bodies) {
    const bounds = bodyBounds(body, snapshot.scale);
    const centerX = fromConstraintFixed(body.position.x, snapshot.scale);
    const centerY = fromConstraintFixed(body.position.y, snapshot.scale);
    const velocityScale = 0.06;
    overrides[`body:${body.id}.layout.x`] = bounds.x;
    overrides[`body:${body.id}.layout.y`] = bounds.y;
    overrides[`body:${body.id}.layout.width`] = bounds.width;
    overrides[`body:${body.id}.layout.height`] = bounds.height;
    overrides[`label:${body.id}.layout.x`] = bounds.x;
    overrides[`label:${body.id}.layout.y`] = bounds.y - 18;
    overrides[`label:${body.id}.content.text`] = `${body.id} · ${body.shape.type} · v=(${fromConstraintFixed(body.velocity.x, snapshot.scale).toFixed(1)}, ${fromConstraintFixed(body.velocity.y, snapshot.scale).toFixed(1)})`;
    overrides[`velocity:${body.id}.content.x1`] = centerX;
    overrides[`velocity:${body.id}.content.y1`] = centerY;
    overrides[`velocity:${body.id}.content.x2`] = centerX + fromConstraintFixed(body.velocity.x, snapshot.scale) * velocityScale;
    overrides[`velocity:${body.id}.content.y2`] = centerY + fromConstraintFixed(body.velocity.y, snapshot.scale) * velocityScale;
  }

  for (const constraint of snapshot.constraints) {
    const a = bodyById.get(constraint.bodyA);
    const b = bodyById.get(constraint.bodyB);
    if (!a || !b) continue;
    overrides[`constraint:${constraint.id}.visible`] = constraint.enabled && !constraint.broken;
    overrides[`constraint:${constraint.id}.content.x1`] = fromConstraintFixed(a.position.x, snapshot.scale);
    overrides[`constraint:${constraint.id}.content.y1`] = fromConstraintFixed(a.position.y, snapshot.scale);
    overrides[`constraint:${constraint.id}.content.x2`] = fromConstraintFixed(b.position.x, snapshot.scale);
    overrides[`constraint:${constraint.id}.content.y2`] = fromConstraintFixed(b.position.y, snapshot.scale);
  }

  for (let index = 0; index < maxContactMarkers; index++) {
    const contact = snapshot.contacts[index];
    overrides[`contact:${index}.visible`] = Boolean(contact);
    if (contact) {
      overrides[`contact:${index}.layout.x`] = fromConstraintFixed(contact.point.x, snapshot.scale) - 4;
      overrides[`contact:${index}.layout.y`] = fromConstraintFixed(contact.point.y, snapshot.scale) - 4;
    }
  }
  overrides['debug:status.content.text'] = `RSR Constraint Physics ${snapshot.runtimeVersion} · tick ${snapshot.tick} · microsteps ${snapshot.diagnostics.microsteps} · pairs ${snapshot.diagnostics.candidatePairs} · contacts ${snapshot.contacts.length} · islands ${snapshot.islands.length} · root ${snapshot.stateRoot.slice(-12)}`;
  return overrides;
}

export class ConstraintPhysicsVSRBridge {
  readonly document: VSRDocument;
  readonly prepared: VSRPreparedDocument;
  readonly maxContactMarkers: number;

  constructor(config: ConstraintPhysicsWorldConfig, options: ConstraintPhysicsVisualOptions = {}) {
    this.maxContactMarkers = options.maxContactMarkers ?? 32;
    this.document = createConstraintPhysicsVisualDocument(config, options);
    this.prepared = prepareDocument(this.document);
  }

  evaluate(snapshot: ConstraintPhysicsSnapshot) {
    return evaluateAt({
      document: this.prepared,
      time: snapshot.tick / snapshot.stepHz,
      initialState: { variables: { worldId: snapshot.worldId, tick: snapshot.tick, stateRoot: snapshot.stateRoot } },
      runtimeOverrides: constraintSnapshotToRuntimeOverrides(snapshot, this.maxContactMarkers)
    });
  }

  render(snapshot: ConstraintPhysicsSnapshot, observers: VSRObserverProfile[] = [createConstraintPhysicsObserverProfile('player'), createConstraintPhysicsObserverProfile('debugger')]): ConstraintPhysicsRenderSet {
    const evaluated = this.evaluate(snapshot);
    const invariant = {
      format: 'rsr.constraint-reality-invariant.v0.2',
      worldId: snapshot.worldId,
      tick: snapshot.tick,
      stateRoot: snapshot.stateRoot,
      contactRoot: snapshot.contactRoot,
      constraintRoot: snapshot.constraintRoot,
      islandRoot: snapshot.islandRoot
    };
    const projections = observers.map(observer => projectDisplayForObserver(this.document, evaluated.displayState, observer, { invariant }));
    const verification = verifyObserverProjectionSet(projections);
    const views = projections.map(projection => {
      const png = renderPng(projection.displayState);
      return { observer: projection.observer, projection, png, pngHash: semanticHash([...png]) };
    });
    return {
      sourceDocumentHash: documentHash(this.document),
      sourceDisplayHash: evaluated.displayState.semanticHash,
      simulationRoot: snapshot.stateRoot,
      invariantHash: projections[0]?.manifest.invariantHash ?? semanticHash(invariant),
      verification,
      views
    };
  }
}
