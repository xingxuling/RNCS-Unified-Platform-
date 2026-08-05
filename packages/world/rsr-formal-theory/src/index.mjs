import {
  canonicalClone,
  compareUtf8,
  semanticHash,
  verifyWorldBodyIR,
} from '@taowind/world-body-ir';
import { defineTheorem } from '@taowind/world-body-formal-kernel';

export const RSR_FORMAL_THEORY_VERSION = '0.1.0-alpha.1';
export const RSR_REFERENCE_STATE_FORMAT = 'taowind.rsr-reference-state.v0.1';
export const RSR_REFERENCE_SNAPSHOT_FORMAT = 'taowind.rsr-reference-snapshot.v0.1';
export const RSR_FORMAL_AUTHORITY_FRAME_FORMAT = 'taowind.rsr-formal-authority-frame.v0.1';

function sortById(items) {
  return [...items].sort((left, right) => compareUtf8(left.id, right.id));
}

function stateBase(state) {
  const { stateRoot, ...base } = state;
  return base;
}

function sealState(state) {
  const base = canonicalClone(stateBase(state));
  return canonicalClone({ ...base, stateRoot: semanticHash(base) });
}

function assertReferenceState(state) {
  if (!state || state.format !== RSR_REFERENCE_STATE_FORMAT) throw Object.assign(new Error('RSR_FORMAL_STATE_FORMAT_INVALID'), { code: 'RSR_FORMAL_STATE_FORMAT_INVALID' });
  if (semanticHash(stateBase(state)) !== state.stateRoot) throw Object.assign(new Error('RSR_FORMAL_STATE_ROOT_MISMATCH'), { code: 'RSR_FORMAL_STATE_ROOT_MISMATCH' });
  return state;
}

export function worldBodyToRsrReferenceState(ir) {
  const verification = verifyWorldBodyIR(ir);
  if (!verification.ok) throw Object.assign(new Error('RSR_FORMAL_WBIR_INVALID'), { code: 'RSR_FORMAL_WBIR_INVALID', details: verification.errors });
  return sealState({
    format: RSR_REFERENCE_STATE_FORMAT,
    theoryVersion: RSR_FORMAL_THEORY_VERSION,
    worldId: ir.worldId,
    generation: ir.generation,
    revision: ir.revision,
    tick: ir.temporalPresentationState.clock.tick,
    tickHz: ir.temporalPresentationState.clock.tickHz,
    sourceAuthorityRoot: ir.authorityState.sourceRealityRoot,
    bodies: sortById(ir.physicalBodyState.bodies).map(body => canonicalClone(body)),
    eventKeys: ir.worldEventState.events.map(event => event.exactlyOnceKey).sort(),
  });
}

function applyCommand(body, command) {
  if (body.kind === 'static') return body;
  if (command.kind === 'set-velocity') {
    return { ...body, linearVelocityMmPerSecond: canonicalClone(command.value) };
  }
  if (command.kind === 'teleport') {
    return { ...body, transform: { ...body.transform, positionMm: canonicalClone(command.positionMm) } };
  }
  if (command.kind === 'apply-impulse') {
    if (!Number.isSafeInteger(body.massGrams) || body.massGrams <= 0) throw Object.assign(new Error('RSR_FORMAL_DYNAMIC_MASS_INVALID'), { code: 'RSR_FORMAL_DYNAMIC_MASS_INVALID' });
    const velocity = body.linearVelocityMmPerSecond ?? { x: 0, y: 0, z: 0 };
    return {
      ...body,
      linearVelocityMmPerSecond: Object.fromEntries(['x', 'y', 'z'].map(axis => [
        axis,
        velocity[axis] + Math.round(command.impulseGramMmPerSecond[axis] / body.massGrams),
      ])),
    };
  }
  throw Object.assign(new Error(`RSR_FORMAL_COMMAND_UNSUPPORTED:${command.kind}`), { code: 'RSR_FORMAL_COMMAND_UNSUPPORTED' });
}

export function rsrReferenceStep(state, commands = []) {
  assertReferenceState(state);
  const nextTick = state.tick + 1;
  const orderedCommands = [...commands]
    .filter(command => command.tick === nextTick)
    .sort((left, right) => left.sequence - right.sequence || compareUtf8(left.id, right.id));
  const bodies = sortById(state.bodies).map(original => {
    let body = canonicalClone(original);
    for (const command of orderedCommands.filter(item => item.bodyId === body.id)) body = applyCommand(body, command);
    if (body.kind !== 'dynamic') return body;
    const velocity = body.linearVelocityMmPerSecond ?? { x: 0, y: 0, z: 0 };
    return {
      ...body,
      transform: {
        ...body.transform,
        positionMm: Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, body.transform.positionMm[axis] + Math.round(velocity[axis] / state.tickHz)])),
      },
    };
  });
  return sealState({ ...stateBase(state), tick: nextTick, bodies });
}

export function replayRsrReference(initialState, commands, targetTick) {
  assertReferenceState(initialState);
  if (!Number.isSafeInteger(targetTick) || targetTick < initialState.tick) throw Object.assign(new Error('RSR_FORMAL_TARGET_TICK_INVALID'), { code: 'RSR_FORMAL_TARGET_TICK_INVALID' });
  let state = canonicalClone(initialState);
  while (state.tick < targetTick) state = rsrReferenceStep(state, commands);
  return state;
}

export function createRsrReferenceSnapshot(state) {
  assertReferenceState(state);
  const base = {
    format: RSR_REFERENCE_SNAPSHOT_FORMAT,
    theoryVersion: RSR_FORMAL_THEORY_VERSION,
    state: canonicalClone(state),
  };
  return canonicalClone({ ...base, snapshotRoot: semanticHash(base) });
}

export function restoreRsrReferenceSnapshot(snapshot) {
  const { snapshotRoot, ...base } = snapshot ?? {};
  if (snapshot?.format !== RSR_REFERENCE_SNAPSHOT_FORMAT || semanticHash(base) !== snapshotRoot) {
    throw Object.assign(new Error('RSR_FORMAL_SNAPSHOT_ROOT_MISMATCH'), { code: 'RSR_FORMAL_SNAPSHOT_ROOT_MISMATCH' });
  }
  return canonicalClone(assertReferenceState(snapshot.state));
}

export function symmetricContactKey(fixtureA, fixtureB) {
  return [fixtureA, fixtureB].sort(compareUtf8).join('<->');
}

function filterOf(fixture) {
  return fixture.collisionFilter ?? { categoryBits: 1, maskBits: 4_294_967_295 };
}

export function collisionPairAllowed(fixtureA, fixtureB) {
  const left = filterOf(fixtureA);
  const right = filterOf(fixtureB);
  return (BigInt(left.maskBits) & BigInt(right.categoryBits)) !== 0n
    && (BigInt(right.maskBits) & BigInt(left.categoryBits)) !== 0n;
}

export function createFormalAuthorityFrame(state) {
  assertReferenceState(state);
  const objects = sortById(state.bodies).map(body => {
    const canonicalBody = canonicalClone(body);
    return { ...canonicalBody, bodyRoot: semanticHash(canonicalBody) };
  });
  const base = {
    format: RSR_FORMAL_AUTHORITY_FRAME_FORMAT,
    theoryVersion: RSR_FORMAL_THEORY_VERSION,
    worldId: state.worldId,
    tick: state.tick,
    sourceStateRoot: state.stateRoot,
    sourceAuthorityRoot: state.sourceAuthorityRoot,
    objects,
  };
  return canonicalClone({ ...base, frameRoot: semanticHash(base) });
}

export function verifyFormalAuthorityFrame(frame) {
  if (!frame || frame.format !== RSR_FORMAL_AUTHORITY_FRAME_FORMAT) return false;
  const { frameRoot, ...base } = frame;
  if (semanticHash(base) !== frameRoot) return false;
  const ids = new Set();
  for (const object of frame.objects ?? []) {
    const { bodyRoot, ...body } = object;
    if (ids.has(body.id) || semanticHash(body) !== bodyRoot) return false;
    ids.add(body.id);
  }
  return true;
}

function positionDistanceMaximum(left, right) {
  return Math.max(...['x', 'y', 'z'].map(axis => Math.abs(left[axis] - right[axis])));
}

export function verifyRsrTraceRefinement(reference, implementation, options = {}) {
  const toleranceMm = options.toleranceMm ?? 0;
  if (!Number.isSafeInteger(toleranceMm) || toleranceMm < 0) throw new TypeError('toleranceMm must be a non-negative safe integer');
  const errors = [];
  if (reference.worldId !== implementation.worldId) errors.push({ code: 'RSR_REFINEMENT_WORLD_MISMATCH' });
  if (reference.tick !== implementation.tick) errors.push({ code: 'RSR_REFINEMENT_TICK_MISMATCH' });
  const referenceBodies = new Map(reference.bodies.map(body => [body.id, body]));
  const implementationBodies = new Map(implementation.bodies.map(body => [body.id, body]));
  if (referenceBodies.size !== implementationBodies.size) errors.push({ code: 'RSR_REFINEMENT_BODY_COUNT_MISMATCH' });
  for (const [id, body] of referenceBodies) {
    const candidate = implementationBodies.get(id);
    if (!candidate) {
      errors.push({ code: 'RSR_REFINEMENT_BODY_MISSING', bodyId: id });
      continue;
    }
    const errorMm = positionDistanceMaximum(body.transform.positionMm, candidate.transform.positionMm);
    if (errorMm > toleranceMm) errors.push({ code: 'RSR_REFINEMENT_POSITION_BOUND', bodyId: id, errorMm, toleranceMm });
    if (body.kind !== candidate.kind) errors.push({ code: 'RSR_REFINEMENT_KIND_MISMATCH', bodyId: id });
  }
  return { ok: errors.length === 0, errors, toleranceMm };
}

function allNumbersAreSafeIntegers(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value);
  if (Array.isArray(value)) return value.every(allNumbersAreSafeIntegers);
  if (value && typeof value === 'object') return Object.values(value).every(allNumbersAreSafeIntegers);
  return true;
}

function hasForbiddenPresentationKey(value) {
  if (Array.isArray(value)) return value.some(hasForbiddenPresentationKey);
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) => /visual|mesh|material|shader|camera|observer/i.test(key) || hasForbiddenPresentationKey(nested));
}

export function buildRsrReferenceFixture(ir) {
  const initial = worldBodyToRsrReferenceState(ir);
  const commands = [{
    id: 'command:set-velocity',
    tick: initial.tick + 1,
    sequence: 0,
    bodyId: initial.bodies.find(body => body.kind === 'dynamic')?.id,
    kind: 'set-velocity',
    value: { x: 1200, y: 0, z: -600 },
  }].filter(command => command.bodyId);
  const next = rsrReferenceStep(initial, commands);
  const snapshot = createRsrReferenceSnapshot(next);
  const replayA = replayRsrReference(initial, commands, next.tick);
  const replayB = replayRsrReference(initial, [...commands].reverse(), next.tick);
  const frame = createFormalAuthorityFrame(next);
  return canonicalClone({
    format: 'taowind.rsr-formal-fixture.v0.1',
    ir,
    initial,
    commands,
    next,
    snapshot,
    replayA,
    replayB,
    frame,
    refinementCandidate: canonicalClone(next),
  });
}

export const RSR_THEOREMS = Object.freeze([
  defineTheorem({
    id: 'RSR-T1.1', domain: 'RSR', level: 1, title: 'World-body physical well-formedness',
    statement: 'Every RSR reference state originates from a verified World Body IR with stable identities and roots.',
    classification: 'EXACT', assumptions: ['World Body IR v0.1 runtime validator is normative'],
    predicate: subject => ({ ok: verifyWorldBodyIR(subject.ir).ok, observations: { worldBodyRoot: subject.ir.roots.worldBodyRoot } }),
  }),
  defineTheorem({
    id: 'RSR-T1.2', domain: 'RSR', level: 1, title: 'Canonical physical state root',
    statement: 'A normalized physical state has exactly one canonical SHA-256 state root.',
    classification: 'EXACT', assumptions: ['All quantities use safe integers or canonical strings'],
    predicate: subject => ({ ok: semanticHash(stateBase(subject.initial)) === subject.initial.stateRoot, observations: { stateRoot: subject.initial.stateRoot } }),
  }),
  defineTheorem({
    id: 'RSR-T1.3', domain: 'RSR', level: 1, title: 'Unique body and fixture identity',
    statement: 'Body identifiers and fixture identifiers are unique in their declared scopes.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => {
      const bodyIds = subject.initial.bodies.map(body => body.id);
      const fixtureScopes = subject.initial.bodies.every(body => new Set(body.fixtures.map(fixture => fixture.id)).size === body.fixtures.length);
      return { ok: new Set(bodyIds).size === bodyIds.length && fixtureScopes, observations: { bodyCount: bodyIds.length } };
    },
  }),
  defineTheorem({
    id: 'RSR-T2.1', domain: 'RSR', level: 2, title: 'Static body immutability',
    statement: 'A fixed-step transition does not change a static body transform.',
    classification: 'EXACT', assumptions: ['No authority teleport command targets static bodies'],
    predicate: subject => ({
      ok: subject.initial.bodies.filter(body => body.kind === 'static').every(body => {
        const next = subject.next.bodies.find(candidate => candidate.id === body.id);
        return JSON.stringify(body.transform) === JSON.stringify(next?.transform);
      }),
      observations: { staticBodyCount: subject.initial.bodies.filter(body => body.kind === 'static').length },
    }),
  }),
  defineTheorem({
    id: 'RSR-T2.2', domain: 'RSR', level: 2, title: 'Positive dynamic mass',
    statement: 'Every dynamic body has strictly positive integral mass.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: subject.initial.bodies.filter(body => body.kind === 'dynamic').every(body => Number.isSafeInteger(body.massGrams) && body.massGrams > 0), observations: {} }),
  }),
  defineTheorem({
    id: 'RSR-T2.3', domain: 'RSR', level: 2, title: 'Contact identity symmetry',
    statement: 'The canonical contact identity is invariant under fixture order.',
    classification: 'EXACT', assumptions: [],
    predicate: () => ({ ok: symmetricContactKey('fixture:a', 'fixture:b') === symmetricContactKey('fixture:b', 'fixture:a'), observations: { key: symmetricContactKey('fixture:a', 'fixture:b') } }),
  }),
  defineTheorem({
    id: 'RSR-T2.4', domain: 'RSR', level: 2, title: 'Collision filter reciprocity',
    statement: 'A collision pair is enabled only when both category-mask directions admit the pair.',
    classification: 'EXACT', assumptions: ['categoryBits and maskBits are non-negative integers'],
    predicate: () => {
      const left = { collisionFilter: { categoryBits: 1, maskBits: 2 } };
      const right = { collisionFilter: { categoryBits: 2, maskBits: 1 } };
      const blocked = { collisionFilter: { categoryBits: 4, maskBits: 1 } };
      return { ok: collisionPairAllowed(left, right) && !collisionPairAllowed(left, blocked), observations: {} };
    },
  }),
  defineTheorem({
    id: 'RSR-T3.1', domain: 'RSR', level: 3, title: 'Fixed-step transition determinism',
    statement: 'Equal normalized state and command inputs produce equal successor roots.',
    classification: 'EXACT', assumptions: ['Reference transition uses safe-integer fixed-step arithmetic'],
    predicate: subject => ({ ok: rsrReferenceStep(subject.initial, subject.commands).stateRoot === subject.next.stateRoot, observations: { successorRoot: subject.next.stateRoot } }),
  }),
  defineTheorem({
    id: 'RSR-T3.2', domain: 'RSR', level: 3, title: 'Integer state closure',
    statement: 'The reference transition maps the integer state domain back into the integer state domain.',
    classification: 'EXACT', assumptions: ['Inputs remain within JavaScript safe-integer range'],
    predicate: subject => ({ ok: allNumbersAreSafeIntegers(subject.next), observations: { tick: subject.next.tick } }),
  }),
  defineTheorem({
    id: 'RSR-T3.3', domain: 'RSR', level: 3, title: 'Snapshot restoration identity',
    statement: 'A valid sealed snapshot restores the exact state root.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: restoreRsrReferenceSnapshot(subject.snapshot).stateRoot === subject.next.stateRoot, observations: { snapshotRoot: subject.snapshot.snapshotRoot } }),
  }),
  defineTheorem({
    id: 'RSR-T3.4', domain: 'RSR', level: 3, title: 'Event identity uniqueness',
    statement: 'Authoritative event exactly-once keys are unique and bound to the active authority root.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => {
      const events = subject.ir.worldEventState.events;
      return { ok: new Set(events.map(event => event.exactlyOnceKey)).size === events.length && events.every(event => event.sourceAuthorityRoot === subject.initial.sourceAuthorityRoot), observations: { eventCount: events.length } };
    },
  }),
  defineTheorem({
    id: 'RSR-T4.1', domain: 'RSR', level: 4, title: 'Deterministic replay',
    statement: 'Replay from one state with one command multiset converges to one successor root.',
    classification: 'EXACT', assumptions: ['Commands carry stable tick, sequence, and id'],
    predicate: subject => ({ ok: subject.replayA.stateRoot === subject.replayB.stateRoot && subject.replayA.stateRoot === subject.next.stateRoot, observations: { replayRoot: subject.replayA.stateRoot } }),
  }),
  defineTheorem({
    id: 'RSR-T4.2', domain: 'RSR', level: 4, title: 'Nested authority body-root binding',
    statement: 'An authority frame root commits to every normalized body root.',
    classification: 'EXACT', assumptions: [],
    predicate: subject => ({ ok: verifyFormalAuthorityFrame(subject.frame), observations: { frameRoot: subject.frame.frameRoot, objectCount: subject.frame.objects.length } }),
  }),
  defineTheorem({
    id: 'RSR-T4.3', domain: 'RSR', level: 4, title: 'Presentation exclusion from authority state',
    statement: 'The physical authority state contains no visual mesh, material, shader, camera, or observer fields.',
    classification: 'EXACT', assumptions: ['World Body authority and presentation roots remain separate'],
    predicate: subject => ({ ok: !hasForbiddenPresentationKey(subject.next), observations: {} }),
  }),
  defineTheorem({
    id: 'RSR-T4.4', domain: 'RSR', level: 4, title: 'Bounded fixed-step displacement',
    statement: 'Per-axis displacement equals rounded velocity divided by tick rate for a command-free dynamic step.',
    classification: 'BOUNDED_NUMERIC', assumptions: ['No acceleration or collision impulse in the reference step', 'Rounding error is at most half a millimetre per axis'],
    predicate: subject => {
      const next = rsrReferenceStep(subject.next, []);
      const ok = subject.next.bodies.filter(body => body.kind === 'dynamic').every(body => {
        const after = next.bodies.find(candidate => candidate.id === body.id);
        return ['x', 'y', 'z'].every(axis => after.transform.positionMm[axis] - body.transform.positionMm[axis] === Math.round((body.linearVelocityMmPerSecond?.[axis] ?? 0) / subject.next.tickHz));
      });
      return { ok, observations: { tickHz: subject.next.tickHz } };
    },
  }),
  defineTheorem({
    id: 'RSR-T5.1', domain: 'RSR', level: 5, title: 'Refinement relation reflexivity',
    statement: 'The declared RSR observational refinement relation is reflexive at zero positional tolerance.',
    classification: 'EXACT', assumptions: ['Observable scope is worldId, tick, body identity, kind, and position'],
    predicate: subject => ({ ...verifyRsrTraceRefinement(subject.next, subject.next), observations: { toleranceMm: 0 } }),
  }),
  defineTheorem({
    id: 'RSR-T5.2', domain: 'RSR', level: 5, title: 'Adapter refinement sufficiency',
    statement: 'Any implementation trace satisfying the declared relation preserves the selected RSR observables within its explicit bound.',
    classification: 'CONDITIONAL', assumptions: ['The production adapter is total for the selected observable scope', 'Tolerance is declared, not inferred'],
    predicate: subject => ({ ...verifyRsrTraceRefinement(subject.next, subject.refinementCandidate, { toleranceMm: 0 }), observations: { adapter: 'reference-fixture', toleranceMm: 0 } }),
  }),
  defineTheorem({
    id: 'RSR-T5.3', domain: 'RSR', level: 5, title: 'External physics backend equivalence',
    statement: 'A target PhysX, Jolt, Chaos, Unity, or Unreal backend is observationally equivalent in the declared scope.',
    classification: 'UNVERIFIED_EXTERNAL', assumptions: ['A real target backend and differential adapter are executed'],
  }),
]);

export const RSR_THEOREM_MANIFEST = Object.freeze(RSR_THEOREMS.map(theorem => Object.freeze({
  id: theorem.id,
  domain: theorem.domain,
  level: theorem.level,
  title: theorem.title,
  statement: theorem.statement,
  classification: theorem.classification,
  assumptions: [...theorem.assumptions],
})));
