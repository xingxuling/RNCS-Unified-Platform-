import { renderPng } from '../../backend-canvas/src/index.js';
import { evaluateAt, prepareDocument, type VSRPreparedDocument } from '../../core/src/index.js';
import { projectDisplayForObserver, verifyObserverProjectionSet, type VSRObserverProfile, type VSRObserverProjection } from '../../observer-projection/src/index.js';
import { cryptographicHash, documentHash, semanticHash, type VSRDocument, type VSRNode, type VSRValue } from '../../spec/src/index.js';
import { fromFixed, type SimulationSnapshot, type SimulationWorldConfig } from '../../simulation-core/src/index.js';

export interface SimulationVisualOptions {
  width?: number;
  height?: number;
  title?: string;
  maxContactMarkers?: number;
  background?: string;
  dynamicFill?: string;
  staticFill?: string;
  debugFill?: string;
}

export interface SimulationRenderView {
  observer: VSRObserverProfile;
  projection: VSRObserverProjection;
  png: Uint8Array;
  pngHash: string;
}

export interface SimulationRenderSet {
  sourceDocumentHash: string;
  sourceDisplayHash: string;
  simulationRoot: string;
  invariantHash: string;
  verification: ReturnType<typeof verifyObserverProjectionSet>;
  views: SimulationRenderView[];
}

const debugPolicy = {
  format: 'vsr.observer-policy.v0.1',
  anyRole: ['debugger', 'auditor'],
  deny: 'hide',
  reason: 'simulation-debug-only'
};

export function createSimulationObserverProfile(kind: 'player' | 'debugger' | 'auditor'): VSRObserverProfile {
  return {
    format: 'vsr.observer-profile.v0.1',
    observerId: `simulation:${kind}`,
    roles: [kind],
    scopes: kind === 'player' ? ['simulation.view'] : ['simulation.view', 'simulation.debug'],
    clearance: kind === 'player' ? 0 : 2
  };
}

export function createSimulationVisualDocument(config: SimulationWorldConfig, options: SimulationVisualOptions = {}): VSRDocument {
  const width = options.width ?? 640;
  const height = options.height ?? 360;
  const maxContacts = options.maxContactMarkers ?? 16;
  const nodes: VSRNode[] = [];
  for (const body of [...config.bodies].sort((a, b) => a.id.localeCompare(b.id))) {
    const x = fromFixed(body.position.x - body.halfSize.x, config.scale);
    const y = fromFixed(body.position.y - body.halfSize.y, config.scale);
    const bodyWidth = fromFixed(body.halfSize.x * 2, config.scale);
    const bodyHeight = fromFixed(body.halfSize.y * 2, config.scale);
    nodes.push({
      id: `body:${body.id}`,
      type: 'rect',
      zIndex: body.kind === 'static' ? 10 : 20,
      layout: { x, y, width: bodyWidth, height: bodyHeight },
      appearance: {
        fill: { type: 'solid', color: body.kind === 'static' ? (options.staticFill ?? '#334155') : (options.dynamicFill ?? '#2563eb') },
        stroke: { type: 'solid', color: '#e2e8f0' },
        strokeWidth: 1
      },
      content: { cornerRadius: body.kind === 'static' ? 2 : 5 },
      tags: ['simulation-body', body.kind, ...(body.tags ?? [])],
      data: { bodyId: body.id, kind: body.kind }
    });
    nodes.push({
      id: `label:${body.id}`,
      type: 'text',
      zIndex: 40,
      layout: { x, y: y - 18, width: Math.max(80, bodyWidth + 40), height: 16 },
      appearance: { fill: { type: 'solid', color: '#f8fafc' } },
      content: { text: body.id, fontSize: 11 },
      extensions: { 'vsr:observer-policy': debugPolicy }
    });
    nodes.push({
      id: `velocity:${body.id}`,
      type: 'line',
      zIndex: 35,
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
      zIndex: 50,
      layout: { x: 0, y: 0, width: 8, height: 8 },
      appearance: { fill: { type: 'solid', color: '#ef4444' }, stroke: { type: 'solid', color: '#fff' }, strokeWidth: 1 },
      extensions: { 'vsr:observer-policy': debugPolicy },
      data: { contactSlot: index }
    });
  }
  nodes.push({
    id: 'debug:status',
    type: 'text',
    zIndex: 60,
    layout: { x: 12, y: 10, width: width - 24, height: 36 },
    appearance: { fill: { type: 'solid', color: '#f8fafc' } },
    content: { text: 'RSR', fontSize: 14 },
    extensions: { 'vsr:observer-policy': debugPolicy }
  });
  return {
    specVersion: '0.1',
    runtimeTarget: 'rsr-vsr-bridge-v0.1',
    metadata: {
      id: `simulation:${config.worldId}`,
      title: options.title ?? `Reality Simulation · ${config.worldId}`,
      duration: 86_400,
      defaultFps: config.stepHz,
      seed: 1,
      description: '由 Reality Simulation Runtime 驱动的稳定 Visual IR。'
    },
    canvas: { width, height, background: { type: 'solid', color: options.background ?? '#0f172a' } },
    variables: { worldId: config.worldId, tick: 0, stateRoot: '' },
    nodes,
    extensions: {
      'rsr:world': {
        format: config.format,
        worldId: config.worldId,
        configHash: semanticHash(config),
        stableVisualIr: true
      }
    }
  };
}

export function snapshotToRuntimeOverrides(snapshot: SimulationSnapshot, maxContactMarkers = 16): Record<string, VSRValue> {
  const overrides: Record<string, VSRValue> = {};
  for (const body of snapshot.bodies) {
    const x = fromFixed(body.position.x - body.halfSize.x, snapshot.scale);
    const y = fromFixed(body.position.y - body.halfSize.y, snapshot.scale);
    const centerX = fromFixed(body.position.x, snapshot.scale);
    const centerY = fromFixed(body.position.y, snapshot.scale);
    const velocityScale = 0.08;
    overrides[`body:${body.id}.layout.x`] = x;
    overrides[`body:${body.id}.layout.y`] = y;
    overrides[`label:${body.id}.layout.x`] = x;
    overrides[`label:${body.id}.layout.y`] = y - 18;
    overrides[`label:${body.id}.content.text`] = `${body.id}  v=(${fromFixed(body.velocity.x, snapshot.scale).toFixed(1)}, ${fromFixed(body.velocity.y, snapshot.scale).toFixed(1)})`;
    overrides[`velocity:${body.id}.content.x1`] = centerX;
    overrides[`velocity:${body.id}.content.y1`] = centerY;
    overrides[`velocity:${body.id}.content.x2`] = centerX + fromFixed(body.velocity.x, snapshot.scale) * velocityScale;
    overrides[`velocity:${body.id}.content.y2`] = centerY + fromFixed(body.velocity.y, snapshot.scale) * velocityScale;
  }
  for (let index = 0; index < maxContactMarkers; index++) {
    const contact = snapshot.contacts[index];
    overrides[`contact:${index}.visible`] = Boolean(contact);
    if (contact) {
      overrides[`contact:${index}.layout.x`] = fromFixed(contact.point.x, snapshot.scale) - 4;
      overrides[`contact:${index}.layout.y`] = fromFixed(contact.point.y, snapshot.scale) - 4;
    }
  }
  overrides['debug:status.content.text'] = `RSR ${snapshot.runtimeVersion} · tick ${snapshot.tick} · contacts ${snapshot.contacts.length} · root ${snapshot.stateRoot.slice(-12)}`;
  return overrides;
}

export class SimulationVSRBridge {
  readonly document: VSRDocument;
  readonly prepared: VSRPreparedDocument;
  readonly maxContactMarkers: number;
  constructor(config: SimulationWorldConfig, options: SimulationVisualOptions = {}) {
    this.maxContactMarkers = options.maxContactMarkers ?? 16;
    this.document = createSimulationVisualDocument(config, options);
    this.prepared = prepareDocument(this.document);
  }

  evaluate(snapshot: SimulationSnapshot) {
    return evaluateAt({
      document: this.prepared,
      time: snapshot.tick / snapshot.stepHz,
      initialState: { variables: { worldId: snapshot.worldId, tick: snapshot.tick, stateRoot: snapshot.stateRoot } },
      runtimeOverrides: snapshotToRuntimeOverrides(snapshot, this.maxContactMarkers)
    });
  }

  render(snapshot: SimulationSnapshot, observers: VSRObserverProfile[] = [createSimulationObserverProfile('player'), createSimulationObserverProfile('debugger')]): SimulationRenderSet {
    const evaluated = this.evaluate(snapshot);
    const invariant = {
      format: 'rsr.reality-invariant.v0.1',
      worldId: snapshot.worldId,
      tick: snapshot.tick,
      stateRoot: snapshot.stateRoot,
      contactRoot: snapshot.contactRoot
    };
    const projections = observers.map(observer => projectDisplayForObserver(this.document, evaluated.displayState, observer, { invariant }));
    const verification = verifyObserverProjectionSet(projections);
    const views = projections.map(projection => {
      const png = renderPng(projection.displayState);
      return { observer: projection.observer, projection, png, pngHash: cryptographicHash([...png]) };
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
