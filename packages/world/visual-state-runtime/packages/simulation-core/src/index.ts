import { cryptographicHash, deepClone, type VSRValue } from '../../spec/src/index.js';

export const RSR_VERSION = '0.1.0-alpha.2-vsr-alpha.10';
export const DEFAULT_SCALE = 1_000;
export const Q = 1_000;

export interface IntVector2 { x: number; y: number }
export type BodyKind = 'static' | 'dynamic';

export interface SimulationBodySpec {
  id: string;
  kind: BodyKind;
  position: IntVector2;
  halfSize: IntVector2;
  velocity?: IntVector2;
  acceleration?: IntVector2;
  inverseMassQ?: number;
  restitutionQ?: number;
  frictionQ?: number;
  sleepThreshold?: number;
  sleepTicks?: number;
  tags?: string[];
  data?: Record<string, VSRValue>;
}

export interface SimulationWorldConfig {
  format: 'rsr.world.v0.1';
  worldId: string;
  scale?: number;
  stepHz: number;
  gravity: IntVector2;
  solverIterations?: number;
  bodies: SimulationBodySpec[];
}

export interface RuntimeBody {
  id: string;
  kind: BodyKind;
  position: IntVector2;
  halfSize: IntVector2;
  velocity: IntVector2;
  acceleration: IntVector2;
  inverseMassQ: number;
  restitutionQ: number;
  frictionQ: number;
  sleepThreshold: number;
  sleepTicks: number;
  sleepCounter: number;
  awake: boolean;
  tags: string[];
  data: Record<string, VSRValue>;
}

export interface SimulationContact {
  key: string;
  a: string;
  b: string;
  normal: IntVector2;
  penetration: number;
  point: IntVector2;
  normalImpulse: number;
  tangentImpulse: number;
}

export type CollisionPhase = 'begin' | 'persist' | 'end';
export interface CollisionEvent {
  id: string;
  tick: number;
  phase: CollisionPhase;
  pair: string;
  bodyA: string;
  bodyB: string;
  contact?: SimulationContact;
  evidenceHash: string;
}

export type SimulationCommand =
  | { id: string; tick: number; type: 'apply-impulse'; bodyId: string; impulse: IntVector2 }
  | { id: string; tick: number; type: 'set-velocity'; bodyId: string; velocity: IntVector2 }
  | { id: string; tick: number; type: 'teleport'; bodyId: string; position: IntVector2; clearVelocity?: boolean }
  | { id: string; tick: number; type: 'wake'; bodyId: string };

export interface SimulationSnapshot {
  format: 'rsr.snapshot.v0.1';
  runtimeVersion: string;
  worldId: string;
  tick: number;
  logicalTime: { numerator: number; denominator: number };
  scale: number;
  stepHz: number;
  gravity: IntVector2;
  solverIterations: number;
  configHash: string;
  bodies: RuntimeBody[];
  contacts: SimulationContact[];
  events: CollisionEvent[];
  contactRoot: string;
  stateRoot: string;
}

export interface SimulationStepResult {
  snapshot: SimulationSnapshot;
  appliedCommandIds: string[];
  contacts: SimulationContact[];
  events: CollisionEvent[];
}

export interface RFECausalDelta {
  format: 'rfe.causal-delta.v0.1';
  provisional: true;
  baseRealityRoot: string;
  sourceRuntime: string;
  worldId: string;
  tick: number;
  simulationRoot: string;
  facts: Array<{
    subject: string;
    predicate: string;
    value: VSRValue;
    evidence: string;
  }>;
  events: Array<{
    type: string;
    subjects: string[];
    payload: Record<string, VSRValue>;
    evidence: string;
  }>;
  deltaRoot: string;
}

function assertInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} 必须是安全整数。`);
}
function assertVector(value: IntVector2, label: string): void {
  assertInteger(value.x, `${label}.x`); assertInteger(value.y, `${label}.y`);
}
function truncDiv(numerator: number, denominator: number): number {
  if (denominator === 0) throw new Error('除数不能为 0。');
  return Math.trunc(numerator / denominator);
}
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
function pairKey(a: string, b: string): string { return a < b ? `${a}|${b}` : `${b}|${a}`; }
function abs(value: number): number { return value < 0 ? -value : value; }
function sign(value: number): number { return value < 0 ? -1 : 1; }
function bodySemanticView(body: RuntimeBody): unknown {
  return {
    id: body.id, kind: body.kind, position: body.position, halfSize: body.halfSize,
    velocity: body.velocity, acceleration: body.acceleration, inverseMassQ: body.inverseMassQ,
    restitutionQ: body.restitutionQ, frictionQ: body.frictionQ,
    sleepThreshold: body.sleepThreshold, sleepTicks: body.sleepTicks,
    sleepCounter: body.sleepCounter, awake: body.awake, tags: body.tags, data: body.data
  };
}
function contactSemanticView(contact: SimulationContact): unknown {
  return {
    key: contact.key, a: contact.a, b: contact.b, normal: contact.normal,
    penetration: contact.penetration, point: contact.point,
    normalImpulse: contact.normalImpulse, tangentImpulse: contact.tangentImpulse
  };
}
function eventSemanticView(event: CollisionEvent): unknown {
  return { id: event.id, tick: event.tick, phase: event.phase, pair: event.pair, bodyA: event.bodyA, bodyB: event.bodyB, contact: event.contact, evidenceHash: event.evidenceHash };
}

export function toFixed(value: number, scale = DEFAULT_SCALE): number {
  if (!Number.isFinite(value)) throw new Error('固定点输入必须是有限数。');
  return Math.round(value * scale);
}
export function fromFixed(value: number, scale = DEFAULT_SCALE): number { return value / scale; }
export function vec(x: number, y: number, scale = DEFAULT_SCALE): IntVector2 { return { x: toFixed(x, scale), y: toFixed(y, scale) }; }

export function validateWorldConfig(config: SimulationWorldConfig): void {
  if (config.format !== 'rsr.world.v0.1') throw new Error('不支持的世界格式。');
  if (!config.worldId) throw new Error('worldId 不能为空。');
  if (!Number.isInteger(config.stepHz) || config.stepHz <= 0 || config.stepHz > 1_000) throw new Error('stepHz 必须是 1..1000 的整数。');
  const scale = config.scale ?? DEFAULT_SCALE;
  if (!Number.isInteger(scale) || scale <= 0) throw new Error('scale 必须是正整数。');
  assertVector(config.gravity, 'gravity');
  const ids = new Set<string>();
  for (const body of config.bodies) {
    if (!body.id || ids.has(body.id)) throw new Error(`body id 无效或重复：${body.id}`);
    ids.add(body.id);
    assertVector(body.position, `${body.id}.position`);
    assertVector(body.halfSize, `${body.id}.halfSize`);
    if (body.halfSize.x <= 0 || body.halfSize.y <= 0) throw new Error(`${body.id}.halfSize 必须大于 0。`);
    if (body.velocity) assertVector(body.velocity, `${body.id}.velocity`);
    if (body.acceleration) assertVector(body.acceleration, `${body.id}.acceleration`);
    const inverseMassQ = body.kind === 'static' ? 0 : (body.inverseMassQ ?? Q);
    if (!Number.isInteger(inverseMassQ) || inverseMassQ < 0) throw new Error(`${body.id}.inverseMassQ 无效。`);
    if (body.kind === 'dynamic' && inverseMassQ === 0) throw new Error(`${body.id} 是动态刚体但 inverseMassQ 为 0。`);
  }
}

function runtimeBody(spec: SimulationBodySpec): RuntimeBody {
  return {
    id: spec.id,
    kind: spec.kind,
    position: deepClone(spec.position),
    halfSize: deepClone(spec.halfSize),
    velocity: deepClone(spec.velocity ?? { x: 0, y: 0 }),
    acceleration: deepClone(spec.acceleration ?? { x: 0, y: 0 }),
    inverseMassQ: spec.kind === 'static' ? 0 : (spec.inverseMassQ ?? Q),
    restitutionQ: clamp(spec.restitutionQ ?? 50, 0, Q),
    frictionQ: clamp(spec.frictionQ ?? 500, 0, Q),
    sleepThreshold: Math.max(0, spec.sleepThreshold ?? 2 * DEFAULT_SCALE),
    sleepTicks: Math.max(1, spec.sleepTicks ?? 30),
    sleepCounter: 0,
    awake: spec.kind === 'dynamic',
    tags: [...(spec.tags ?? [])].sort(),
    data: deepClone(spec.data ?? {})
  };
}

function configSemanticView(config: SimulationWorldConfig): unknown {
  return {
    format: config.format, worldId: config.worldId, scale: config.scale ?? DEFAULT_SCALE,
    stepHz: config.stepHz, gravity: config.gravity, solverIterations: config.solverIterations ?? 4,
    bodies: [...config.bodies].sort((a, b) => a.id.localeCompare(b.id))
  };
}

export class DeterministicSimulationWorld {
  readonly worldId: string;
  readonly scale: number;
  readonly stepHz: number;
  readonly gravity: IntVector2;
  readonly solverIterations: number;
  readonly configHash: string;
  private tickValue = 0;
  private readonly bodiesById: Map<string, RuntimeBody>;
  private contactsValue: SimulationContact[] = [];
  private eventsValue: CollisionEvent[] = [];
  private previousContacts = new Map<string, SimulationContact>();

  constructor(config: SimulationWorldConfig, identity?: { configHash?: string }) {
    validateWorldConfig(config);
    this.worldId = config.worldId;
    this.scale = config.scale ?? DEFAULT_SCALE;
    this.stepHz = config.stepHz;
    this.gravity = deepClone(config.gravity);
    this.solverIterations = Math.max(1, Math.min(16, config.solverIterations ?? 4));
    this.configHash = identity?.configHash ?? cryptographicHash(configSemanticView(config));
    this.bodiesById = new Map(config.bodies.map(spec => [spec.id, runtimeBody(spec)]));
  }

  static fromSnapshot(snapshot: SimulationSnapshot): DeterministicSimulationWorld {
    const world = new DeterministicSimulationWorld({
      format: 'rsr.world.v0.1', worldId: snapshot.worldId, scale: snapshot.scale,
      stepHz: snapshot.stepHz, gravity: snapshot.gravity, solverIterations: snapshot.solverIterations,
      bodies: snapshot.bodies.map(body => ({
        id: body.id, kind: body.kind, position: body.position, halfSize: body.halfSize,
        velocity: body.velocity, acceleration: body.acceleration, inverseMassQ: body.inverseMassQ,
        restitutionQ: body.restitutionQ, frictionQ: body.frictionQ,
        sleepThreshold: body.sleepThreshold, sleepTicks: body.sleepTicks, tags: body.tags, data: body.data
      }))
    }, { configHash: snapshot.configHash });
    world.tickValue = snapshot.tick;
    for (const source of snapshot.bodies) {
      const target = world.bodiesById.get(source.id)!;
      target.sleepCounter = source.sleepCounter;
      target.awake = source.awake;
    }
    world.contactsValue = deepClone(snapshot.contacts);
    world.eventsValue = deepClone(snapshot.events);
    world.previousContacts = new Map(snapshot.contacts.map(contact => [contact.key, deepClone(contact)]));
    return world;
  }

  get tick(): number { return this.tickValue; }
  body(id: string): RuntimeBody {
    const body = this.bodiesById.get(id);
    if (!body) throw new Error(`刚体不存在：${id}`);
    return deepClone(body);
  }
  bodies(): RuntimeBody[] { return [...this.bodiesById.values()].sort((a, b) => a.id.localeCompare(b.id)).map(deepClone); }
  contacts(): SimulationContact[] { return deepClone(this.contactsValue); }
  events(): CollisionEvent[] { return deepClone(this.eventsValue); }

  private mutableBody(id: string): RuntimeBody {
    const body = this.bodiesById.get(id);
    if (!body) throw new Error(`命令引用了不存在的刚体：${id}`);
    return body;
  }

  private applyCommand(command: SimulationCommand): void {
    const body = this.mutableBody(command.bodyId);
    if (body.kind === 'static' && command.type !== 'teleport') throw new Error(`静态刚体不接受 ${command.type}：${body.id}`);
    if (command.type === 'apply-impulse') {
      assertVector(command.impulse, `${command.id}.impulse`);
      body.velocity.x += truncDiv(command.impulse.x * body.inverseMassQ, Q);
      body.velocity.y += truncDiv(command.impulse.y * body.inverseMassQ, Q);
      body.awake = true; body.sleepCounter = 0;
    } else if (command.type === 'set-velocity') {
      assertVector(command.velocity, `${command.id}.velocity`);
      body.velocity = deepClone(command.velocity); body.awake = true; body.sleepCounter = 0;
    } else if (command.type === 'teleport') {
      assertVector(command.position, `${command.id}.position`);
      body.position = deepClone(command.position);
      if (command.clearVelocity) body.velocity = { x: 0, y: 0 };
      body.awake = body.kind === 'dynamic'; body.sleepCounter = 0;
    } else if (command.type === 'wake') {
      body.awake = true; body.sleepCounter = 0;
    }
  }

  private integrate(): void {
    for (const body of [...this.bodiesById.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      if (body.kind !== 'dynamic' || !body.awake) continue;
      body.velocity.x += truncDiv(this.gravity.x + body.acceleration.x, this.stepHz);
      body.velocity.y += truncDiv(this.gravity.y + body.acceleration.y, this.stepHz);
      body.position.x += truncDiv(body.velocity.x, this.stepHz);
      body.position.y += truncDiv(body.velocity.y, this.stepHz);
    }
  }

  private overlapping(a: RuntimeBody, b: RuntimeBody): { overlapX: number; overlapY: number } | undefined {
    const overlapX = a.halfSize.x + b.halfSize.x - abs(b.position.x - a.position.x);
    const overlapY = a.halfSize.y + b.halfSize.y - abs(b.position.y - a.position.y);
    if (overlapX <= 0 || overlapY <= 0) return undefined;
    return { overlapX, overlapY };
  }

  private resolvePair(a: RuntimeBody, b: RuntimeBody): SimulationContact | undefined {
    if (a.inverseMassQ === 0 && b.inverseMassQ === 0) return undefined;
    const overlap = this.overlapping(a, b);
    if (!overlap) return undefined;
    const useX = overlap.overlapX <= overlap.overlapY;
    const normal: IntVector2 = useX
      ? { x: sign(b.position.x - a.position.x), y: 0 }
      : { x: 0, y: sign(b.position.y - a.position.y) };
    const penetration = useX ? overlap.overlapX : overlap.overlapY;
    const totalInv = a.inverseMassQ + b.inverseMassQ;
    const moveA = totalInv === 0 ? 0 : truncDiv(penetration * a.inverseMassQ, totalInv);
    const moveB = penetration - moveA;
    if (a.inverseMassQ > 0) {
      a.position.x -= normal.x * moveA; a.position.y -= normal.y * moveA;
      a.awake = true;
    }
    if (b.inverseMassQ > 0) {
      b.position.x += normal.x * moveB; b.position.y += normal.y * moveB;
      b.awake = true;
    }

    const relativeX = b.velocity.x - a.velocity.x;
    const relativeY = b.velocity.y - a.velocity.y;
    const normalVelocity = relativeX * normal.x + relativeY * normal.y;
    let normalImpulse = 0;
    let tangentImpulse = 0;
    if (normalVelocity < 0 && totalInv > 0) {
      const restitutionQ = Math.min(a.restitutionQ, b.restitutionQ);
      normalImpulse = truncDiv(-normalVelocity * (Q + restitutionQ), totalInv);
      const deltaA = truncDiv(normalImpulse * a.inverseMassQ, Q);
      const deltaB = truncDiv(normalImpulse * b.inverseMassQ, Q);
      a.velocity.x -= normal.x * deltaA; a.velocity.y -= normal.y * deltaA;
      b.velocity.x += normal.x * deltaB; b.velocity.y += normal.y * deltaB;

      const tangent = { x: -normal.y, y: normal.x };
      const tangentVelocity = relativeX * tangent.x + relativeY * tangent.y;
      const rawTangentImpulse = truncDiv(-tangentVelocity * Q, totalInv);
      const frictionQ = Math.min(a.frictionQ, b.frictionQ);
      const maxTangent = truncDiv(abs(normalImpulse) * frictionQ, Q);
      tangentImpulse = clamp(rawTangentImpulse, -maxTangent, maxTangent);
      const tangentDeltaA = truncDiv(tangentImpulse * a.inverseMassQ, Q);
      const tangentDeltaB = truncDiv(tangentImpulse * b.inverseMassQ, Q);
      a.velocity.x -= tangent.x * tangentDeltaA; a.velocity.y -= tangent.y * tangentDeltaA;
      b.velocity.x += tangent.x * tangentDeltaB; b.velocity.y += tangent.y * tangentDeltaB;
    }

    const point = {
      x: truncDiv(a.position.x + b.position.x, 2),
      y: truncDiv(a.position.y + b.position.y, 2)
    };
    return {
      key: pairKey(a.id, b.id), a: a.id < b.id ? a.id : b.id, b: a.id < b.id ? b.id : a.id,
      normal: a.id < b.id ? normal : { x: -normal.x, y: -normal.y },
      penetration, point, normalImpulse, tangentImpulse
    };
  }

  private solveContacts(): SimulationContact[] {
    const bodies = [...this.bodiesById.values()].sort((a, b) => a.id.localeCompare(b.id));
    let contacts = new Map<string, SimulationContact>();
    for (let iteration = 0; iteration < this.solverIterations; iteration++) {
      const iterationContacts = new Map<string, SimulationContact>();
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i]!; const b = bodies[j]!;
          const contact = this.resolvePair(a, b);
          if (contact) iterationContacts.set(contact.key, contact);
        }
      }
      for (const [key, contact] of iterationContacts) contacts.set(key, contact);
      if (iterationContacts.size === 0) break;
    }
    return [...contacts.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  private updateSleeping(contacts: SimulationContact[]): void {
    const touching = new Set<string>();
    for (const contact of contacts) { touching.add(contact.a); touching.add(contact.b); }
    for (const body of this.bodiesById.values()) {
      if (body.kind !== 'dynamic') continue;
      const speed = abs(body.velocity.x) + abs(body.velocity.y);
      if (touching.has(body.id) && speed <= body.sleepThreshold) {
        body.sleepCounter++;
        if (body.sleepCounter >= body.sleepTicks) {
          body.awake = false; body.velocity = { x: 0, y: 0 };
        }
      } else {
        body.sleepCounter = 0;
      }
    }
  }

  private collisionEvents(contacts: SimulationContact[]): CollisionEvent[] {
    const current = new Map(contacts.map(contact => [contact.key, contact]));
    const events: CollisionEvent[] = [];
    for (const contact of contacts) {
      const phase: CollisionPhase = this.previousContacts.has(contact.key) ? 'persist' : 'begin';
      const base = { tick: this.tickValue + 1, phase, pair: contact.key, bodyA: contact.a, bodyB: contact.b, contact };
      const evidenceHash = cryptographicHash(base);
      events.push({ id: `${this.worldId}:${this.tickValue + 1}:${phase}:${contact.key}`, ...base, evidenceHash });
    }
    for (const [key, previous] of this.previousContacts) {
      if (current.has(key)) continue;
      const base = { tick: this.tickValue + 1, phase: 'end' as const, pair: key, bodyA: previous.a, bodyB: previous.b };
      const evidenceHash = cryptographicHash(base);
      events.push({ id: `${this.worldId}:${this.tickValue + 1}:end:${key}`, ...base, evidenceHash });
    }
    this.previousContacts = current;
    return events.sort((a, b) => a.id.localeCompare(b.id));
  }

  step(commands: SimulationCommand[] = []): SimulationStepResult {
    const applicable = commands
      .filter(command => command.tick === this.tickValue)
      .sort((a, b) => a.id.localeCompare(b.id));
    const duplicate = applicable.find((command, index) => index > 0 && applicable[index - 1]!.id === command.id);
    if (duplicate) throw new Error(`命令 id 重复：${duplicate.id}`);
    for (const command of applicable) this.applyCommand(command);
    this.integrate();
    const contacts = this.solveContacts();
    this.updateSleeping(contacts);
    const events = this.collisionEvents(contacts);
    this.tickValue++;
    this.contactsValue = contacts;
    this.eventsValue = events;
    return { snapshot: this.snapshot(), appliedCommandIds: applicable.map(command => command.id), contacts: deepClone(contacts), events: deepClone(events) };
  }

  run(steps: number, commands: SimulationCommand[] = []): SimulationSnapshot {
    if (!Number.isInteger(steps) || steps < 0) throw new Error('steps 必须是非负整数。');
    const commandTicks = new Map<number, SimulationCommand[]>();
    for (const command of commands) {
      if (!Number.isInteger(command.tick) || command.tick < 0) throw new Error(`命令 tick 无效：${command.id}`);
      const list = commandTicks.get(command.tick) ?? []; list.push(command); commandTicks.set(command.tick, list);
    }
    for (let i = 0; i < steps; i++) this.step(commandTicks.get(this.tickValue) ?? []);
    return this.snapshot();
  }

  snapshot(): SimulationSnapshot {
    const bodies = this.bodies();
    const contacts = this.contacts();
    const events = this.events();
    const contactRoot = cryptographicHash(contacts.map(contactSemanticView));
    const stateView = {
      runtimeVersion: RSR_VERSION, worldId: this.worldId, tick: this.tickValue,
      scale: this.scale, stepHz: this.stepHz, gravity: this.gravity,
      solverIterations: this.solverIterations, configHash: this.configHash,
      bodies: bodies.map(bodySemanticView), contacts: contacts.map(contactSemanticView),
      events: events.map(eventSemanticView), contactRoot
    };
    return {
      format: 'rsr.snapshot.v0.1', runtimeVersion: RSR_VERSION, worldId: this.worldId,
      tick: this.tickValue, logicalTime: { numerator: this.tickValue, denominator: this.stepHz },
      scale: this.scale, stepHz: this.stepHz, gravity: deepClone(this.gravity),
      solverIterations: this.solverIterations, configHash: this.configHash,
      bodies, contacts, events, contactRoot, stateRoot: cryptographicHash(stateView)
    };
  }
}

export function replaySimulation(config: SimulationWorldConfig, steps: number, commands: SimulationCommand[] = []): SimulationSnapshot {
  const world = new DeterministicSimulationWorld(config);
  return world.run(steps, commands);
}

function vectorValue(vector: IntVector2): Record<string, VSRValue> {
  return { x: vector.x, y: vector.y };
}

function contactValue(contact: SimulationContact): Record<string, VSRValue> {
  return {
    key: contact.key,
    a: contact.a,
    b: contact.b,
    normal: vectorValue(contact.normal),
    penetration: contact.penetration,
    point: vectorValue(contact.point),
    normalImpulse: contact.normalImpulse,
    tangentImpulse: contact.tangentImpulse
  };
}

export function snapshotToCausalDelta(snapshot: SimulationSnapshot, baseRealityRoot: string): RFECausalDelta {
  if (!baseRealityRoot) throw new Error('baseRealityRoot 不能为空。');
  const facts: RFECausalDelta['facts'] = [];
  for (const body of snapshot.bodies) {
    const evidence = cryptographicHash({ worldId: snapshot.worldId, tick: snapshot.tick, body: bodySemanticView(body), stateRoot: snapshot.stateRoot });
    const value: Record<string, VSRValue> = {
      position: vectorValue(body.position),
      velocity: vectorValue(body.velocity),
      awake: body.awake
    };
    facts.push({ subject: `body:${body.id}`, predicate: 'simulation.transform', value, evidence });
  }
  const events: RFECausalDelta['events'] = snapshot.events.map(event => {
    const payload: Record<string, VSRValue> = {
      tick: event.tick,
      pair: event.pair,
      contact: event.contact ? contactValue(event.contact) : null
    };
    return {
      type: `simulation.collision.${event.phase}`,
      subjects: [`body:${event.bodyA}`, `body:${event.bodyB}`],
      payload,
      evidence: event.evidenceHash
    };
  });
  const base = {
    format: 'rfe.causal-delta.v0.1' as const, provisional: true as const,
    baseRealityRoot, sourceRuntime: `RSR/${RSR_VERSION}`, worldId: snapshot.worldId,
    tick: snapshot.tick, simulationRoot: snapshot.stateRoot, facts, events
  };
  return { ...base, deltaRoot: cryptographicHash(base) };
}
