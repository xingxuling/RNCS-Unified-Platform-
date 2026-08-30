import {ContractError, rootHash, without} from './index.mjs';

export const WORLD_TIME_FORMAT = 'rncs.world-time.v0.3';
export const WORLD_EVENT_FORMAT = 'rncs.world-event.v0.3';
export const WORLD_EVENT_LOG_FORMAT = 'rncs.canonical-event-log.v0.3';
export const WORLD_FACT_FORMAT = 'rncs.world-fact.v0.3';
export const FACT_WORLD_TREE_FORMAT = 'rncs.fact-world-tree.v0.3';
export const WORLD_TRUTH_VERSION = '0.3.0';
export const WORLD_TIME_STATUSES = Object.freeze(['running', 'paused', 'resuming', 'stopped']);
export const WORLD_FACT_CONFIDENCE = Object.freeze(['canonical', 'candidate', 'disputed']);
export const ZERO_ROOT = '0'.repeat(64);

const keySort = (a, b) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);
const integer = (value, code, fallback = 0) => {
  const number = value === undefined || value === null ? fallback : Number(value);
  fail(Number.isSafeInteger(number) && number >= 0, code);
  return number;
};
const root = (value, code, fallback = ZERO_ROOT) => {
  const result = String(value ?? fallback);
  fail(hex64(result), code);
  return result.toLowerCase();
};
const decimal = (value, code, fallback = '1') => {
  const result = String(value ?? fallback);
  fail(/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(result), code);
  return result;
};

function normalizeWorldTime(input = {}) {
  const value = record(input);
  const world_id = String(value.world_id ?? value.worldId ?? '');
  fail(world_id, 'WORLD_TIME_WORLD_ID_REQUIRED');
  const status = String(value.status ?? 'running');
  fail(WORLD_TIME_STATUSES.includes(status), 'WORLD_TIME_STATUS_INVALID');
  const simulation_rate = String(value.simulation_rate ?? value.simulationRate ?? '1hz');
  fail(simulation_rate, 'WORLD_TIME_SIMULATION_RATE_REQUIRED');
  return {
    format: WORLD_TIME_FORMAT,
    version: WORLD_TRUTH_VERSION,
    world_id,
    epoch: integer(value.epoch, 'WORLD_TIME_EPOCH_INVALID'),
    logical_clock: integer(value.logical_clock ?? value.logicalClock, 'WORLD_TIME_LOGICAL_CLOCK_INVALID'),
    simulation_tick: integer(value.simulation_tick ?? value.simulationTick, 'WORLD_TIME_SIMULATION_TICK_INVALID'),
    causal_sequence: integer(value.causal_sequence ?? value.causalSequence, 'WORLD_TIME_CAUSAL_SEQUENCE_INVALID'),
    simulation_rate,
    time_scale: decimal(value.time_scale ?? value.timeScale, 'WORLD_TIME_SCALE_INVALID'),
    status,
    causal_root: root(value.causal_root ?? value.causalRoot, 'WORLD_TIME_CAUSAL_ROOT_INVALID'),
    historical_reference: clone(value.historical_reference ?? value.historicalReference ?? null)
  };
}

export function createWorldTime(input = {}) {
  const base = normalizeWorldTime(input);
  return {...base, time_root: rootHash(base)};
}

export function verifyWorldTime(time) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!time || typeof time !== 'object') return {valid: false, errors: ['WORLD_TIME_NOT_OBJECT']};
  try {
    check(time.format === WORLD_TIME_FORMAT, 'WORLD_TIME_FORMAT_INVALID');
    check(time.version === WORLD_TRUTH_VERSION, 'WORLD_TIME_VERSION_INVALID');
    check(typeof time.world_id === 'string' && time.world_id.length > 0, 'WORLD_TIME_WORLD_ID_REQUIRED');
    check(Number.isSafeInteger(time.epoch) && time.epoch >= 0, 'WORLD_TIME_EPOCH_INVALID');
    check(Number.isSafeInteger(time.logical_clock) && time.logical_clock >= 0, 'WORLD_TIME_LOGICAL_CLOCK_INVALID');
    check(Number.isSafeInteger(time.simulation_tick) && time.simulation_tick >= 0, 'WORLD_TIME_SIMULATION_TICK_INVALID');
    check(Number.isSafeInteger(time.causal_sequence) && time.causal_sequence >= 0, 'WORLD_TIME_CAUSAL_SEQUENCE_INVALID');
    check(typeof time.simulation_rate === 'string' && time.simulation_rate.length > 0, 'WORLD_TIME_SIMULATION_RATE_REQUIRED');
    check(typeof time.time_scale === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(time.time_scale), 'WORLD_TIME_SCALE_INVALID');
    check(WORLD_TIME_STATUSES.includes(time.status), 'WORLD_TIME_STATUS_INVALID');
    check(hex64(time.causal_root), 'WORLD_TIME_CAUSAL_ROOT_INVALID');
    check(hex64(time.time_root), 'WORLD_TIME_ROOT_INVALID');
    check(rootHash(without(time, 'time_root')) === time.time_root, 'WORLD_TIME_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`WORLD_TIME_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, time_root: time.time_root ?? null};
}

export function advanceWorldTime(time, delta = {}) {
  const verification = verifyWorldTime(time);
  fail(verification.valid, `WORLD_TIME_INVALID:${verification.errors.join(',')}`);
  const value = record(delta);
  const next = {
    ...clone(time),
    logical_clock: time.logical_clock + integer(value.logical_clock_delta ?? value.logicalClockDelta, 'WORLD_TIME_LOGICAL_CLOCK_DELTA_INVALID'),
    simulation_tick: time.simulation_tick + integer(value.simulation_tick_delta ?? value.simulationTickDelta, 'WORLD_TIME_SIMULATION_TICK_DELTA_INVALID'),
    causal_sequence: time.causal_sequence + integer(value.causal_sequence_delta ?? value.causalSequenceDelta, 'WORLD_TIME_CAUSAL_SEQUENCE_DELTA_INVALID')
  };
  if (value.causal_root !== undefined || value.causalRoot !== undefined) next.causal_root = root(value.causal_root ?? value.causalRoot, 'WORLD_TIME_CAUSAL_ROOT_INVALID');
  if (value.status !== undefined) {
    next.status = String(value.status);
    fail(WORLD_TIME_STATUSES.includes(next.status), 'WORLD_TIME_STATUS_INVALID');
  }
  if (value.time_scale !== undefined || value.timeScale !== undefined) next.time_scale = decimal(value.time_scale ?? value.timeScale, 'WORLD_TIME_SCALE_INVALID');
  delete next.time_root;
  return {...next, time_root: rootHash(next)};
}

function normalizeMutation(input = {}) {
  const value = Array.isArray(input) ? {operations: input} : record(input);
  const operations = (value.operations ?? []).map((raw, index) => {
    const operation = record(raw);
    const op = String(operation.op ?? '');
    const path = String(operation.path ?? '');
    fail(['set', 'delete'].includes(op), `WORLD_MUTATION_OP_INVALID:${index}`);
    fail(path && path.split('.').every(part => part && !['__proto__', 'prototype', 'constructor'].includes(part)), `WORLD_MUTATION_PATH_INVALID:${index}`);
    const normalized = {op, path};
    if (op === 'set') {
      fail(Object.prototype.hasOwnProperty.call(operation, 'value'), `WORLD_MUTATION_VALUE_REQUIRED:${index}`);
      normalized.value = clone(operation.value);
    }
    return normalized;
  });
  return {operations};
}

export function applyWorldMutation(state, mutation = {}) {
  const next = clone(state ?? {});
  const normalized = normalizeMutation(mutation);
  for (const operation of normalized.operations) {
    const parts = operation.path.split('.');
    let cursor = next;
    for (const part of parts.slice(0, -1)) {
      if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) cursor[part] = {};
      cursor = cursor[part];
    }
    const leaf = parts.at(-1);
    if (operation.op === 'set') cursor[leaf] = clone(operation.value);
    else if (cursor && typeof cursor === 'object') delete cursor[leaf];
  }
  return next;
}

export const worldStateRoot = state => rootHash(state ?? {});

function normalizeWorldTimeRef(value) {
  const time = value && typeof value === 'object' && value.time_root ? clone(value) : createWorldTime(value);
  const verification = verifyWorldTime(time);
  fail(verification.valid, `WORLD_EVENT_TIME_INVALID:${verification.errors.join(',')}`);
  return time;
}

function normalizeAuthorityReceipt(input) {
  const value = typeof input === 'string' ? {receipt_root: input} : record(input);
  const status = String(value.status ?? 'committed');
  fail(status === 'committed', 'WORLD_EVENT_AUTHORITY_NOT_COMMITTED');
  const receipt_root = root(value.receipt_root ?? value.authority_receipt_root, 'WORLD_EVENT_AUTHORITY_ROOT_INVALID', '');
  fail(receipt_root !== '', 'WORLD_EVENT_AUTHORITY_RECEIPT_REQUIRED');
  return {
    status,
    receipt_root,
    decision_root: value.decision_root === undefined || value.decision_root === null ? null : root(value.decision_root, 'WORLD_EVENT_DECISION_ROOT_INVALID'),
    lease_id: value.lease_id === undefined || value.lease_id === null ? null : String(value.lease_id),
    epoch: integer(value.epoch, 'WORLD_EVENT_AUTHORITY_EPOCH_INVALID')
  };
}

function normalizeEvidenceRef(input) {
  if (input === undefined || input === null) return null;
  if (typeof input === 'string') return {root: root(input, 'WORLD_EVENT_EVIDENCE_ROOT_INVALID'), kind: 'evidence'};
  const value = record(input);
  return {root: root(value.root ?? value.evidence_root, 'WORLD_EVENT_EVIDENCE_ROOT_INVALID'), kind: String(value.kind ?? 'evidence')};
}

export function createWorldEvent(input = {}) {
  const value = record(input);
  const world_id = String(value.world_id ?? value.worldId ?? '');
  const branch_id = String(value.branch_id ?? value.branchId ?? 'main');
  fail(world_id, 'WORLD_EVENT_WORLD_ID_REQUIRED');
  fail(branch_id, 'WORLD_EVENT_BRANCH_ID_REQUIRED');
  const world_time = normalizeWorldTimeRef(value.world_time ?? value.worldTime);
  fail(world_time.world_id === world_id, 'WORLD_EVENT_TIME_WORLD_MISMATCH');
  const mutation = normalizeMutation(value.mutation ?? {operations: []});
  const mutation_ref = root(value.mutation_ref ?? value.mutationRef ?? rootHash(mutation), 'WORLD_EVENT_MUTATION_ROOT_INVALID');
  fail(mutation_ref === rootHash(mutation), 'WORLD_EVENT_MUTATION_ROOT_MISMATCH');
  const previous_state_root = root(value.previous_state_root ?? value.previousStateRoot, 'WORLD_EVENT_PREVIOUS_STATE_ROOT_INVALID');
  const hasOperations = mutation.operations.length > 0;
  const next_state_root = root(value.next_state_root ?? value.nextStateRoot ?? (hasOperations ? null : previous_state_root), 'WORLD_EVENT_NEXT_STATE_ROOT_INVALID', '');
  fail(next_state_root !== '', 'WORLD_EVENT_NEXT_STATE_ROOT_REQUIRED');
  fail(value.authority_receipt !== undefined || value.authorityReceipt !== undefined, 'WORLD_EVENT_AUTHORITY_RECEIPT_REQUIRED');
  const authority_receipt = normalizeAuthorityReceipt(value.authority_receipt ?? value.authorityReceipt);
  const evidence_ref = normalizeEvidenceRef(value.evidence_ref ?? value.evidenceRef);
  const seed = {world_id, branch_id, world_time_root: world_time.time_root, previous_state_root, next_state_root, mutation_ref};
  const event_id = String(value.event_id ?? value.eventId ?? `event:${rootHash(seed).slice(0, 24)}`);
  fail(event_id, 'WORLD_EVENT_ID_REQUIRED');
  const base = {
    format: WORLD_EVENT_FORMAT,
    version: WORLD_TRUTH_VERSION,
    event_id,
    world_id,
    branch_id,
    world_time,
    causal_parents: strings(value.causal_parents ?? value.causalParents),
    subjects: strings(value.subjects),
    objects: strings(value.objects),
    mutation,
    mutation_ref,
    authority_receipt,
    previous_state_root,
    next_state_root,
    evidence_ref
  };
  return {...base, event_root: rootHash(base)};
}

export function verifyWorldEvent(event) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!event || typeof event !== 'object') return {valid: false, errors: ['WORLD_EVENT_NOT_OBJECT']};
  try {
    check(event.format === WORLD_EVENT_FORMAT, 'WORLD_EVENT_FORMAT_INVALID');
    check(event.version === WORLD_TRUTH_VERSION, 'WORLD_EVENT_VERSION_INVALID');
    check(typeof event.event_id === 'string' && event.event_id.length > 0, 'WORLD_EVENT_ID_REQUIRED');
    check(typeof event.world_id === 'string' && event.world_id.length > 0, 'WORLD_EVENT_WORLD_ID_REQUIRED');
    check(typeof event.branch_id === 'string' && event.branch_id.length > 0, 'WORLD_EVENT_BRANCH_ID_REQUIRED');
    const time = verifyWorldTime(event.world_time);
    check(time.valid, `WORLD_EVENT_TIME_INVALID:${time.errors.join(',')}`);
    check(event.world_time?.world_id === event.world_id, 'WORLD_EVENT_TIME_WORLD_MISMATCH');
    check(Array.isArray(event.causal_parents), 'WORLD_EVENT_CAUSAL_PARENTS_INVALID');
    check(Array.isArray(event.subjects), 'WORLD_EVENT_SUBJECTS_INVALID');
    check(Array.isArray(event.objects), 'WORLD_EVENT_OBJECTS_INVALID');
    check(event.mutation && typeof event.mutation === 'object' && Array.isArray(event.mutation.operations), 'WORLD_EVENT_MUTATION_INVALID');
    check(hex64(event.mutation_ref), 'WORLD_EVENT_MUTATION_ROOT_INVALID');
    if (event.mutation && typeof event.mutation === 'object') check(rootHash(event.mutation) === event.mutation_ref, 'WORLD_EVENT_MUTATION_ROOT_MISMATCH');
    check(event.authority_receipt?.status === 'committed', 'WORLD_EVENT_AUTHORITY_NOT_COMMITTED');
    check(hex64(event.authority_receipt?.receipt_root), 'WORLD_EVENT_AUTHORITY_ROOT_INVALID');
    check(hex64(event.authority_receipt?.decision_root) || event.authority_receipt?.decision_root === null, 'WORLD_EVENT_DECISION_ROOT_INVALID');
    check(hex64(event.previous_state_root), 'WORLD_EVENT_PREVIOUS_STATE_ROOT_INVALID');
    check(hex64(event.next_state_root), 'WORLD_EVENT_NEXT_STATE_ROOT_INVALID');
    check(event.evidence_ref === null || hex64(event.evidence_ref?.root), 'WORLD_EVENT_EVIDENCE_ROOT_INVALID');
    check(hex64(event.event_root), 'WORLD_EVENT_ROOT_INVALID');
    check(rootHash(without(event, 'event_root')) === event.event_root, 'WORLD_EVENT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`WORLD_EVENT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, event_root: event.event_root ?? null};
}

const timeTuple = time => [time.epoch, time.logical_clock, time.causal_sequence];
const tupleCompare = (a, b) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};

export function replayWorldEvents(initialState = {}, events = []) {
  let state = clone(initialState);
  let currentRoot = worldStateRoot(state);
  let previousTime = null;
  const eventRoots = [];
  let lastEvent = null;
  for (const event of events) {
    const verification = verifyWorldEvent(event);
    fail(verification.valid, `WORLD_REPLAY_EVENT_INVALID:${verification.errors.join(',')}`);
    fail(event.previous_state_root === currentRoot, `WORLD_REPLAY_PREVIOUS_STATE_MISMATCH:${event.event_id}`);
    if (previousTime) fail(tupleCompare(timeTuple(event.world_time), timeTuple(previousTime)) > 0, `WORLD_REPLAY_TIME_ORDER_INVALID:${event.event_id}`);
    if (lastEvent) fail(event.causal_parents.includes(lastEvent.event_id), `WORLD_REPLAY_CAUSAL_PARENT_MISSING:${event.event_id}`);
    state = applyWorldMutation(state, event.mutation);
    currentRoot = worldStateRoot(state);
    fail(event.next_state_root === currentRoot, `WORLD_REPLAY_NEXT_STATE_MISMATCH:${event.event_id}`);
    eventRoots.push(event.event_root);
    previousTime = event.world_time;
    lastEvent = event;
  }
  return {
    state,
    state_root: currentRoot,
    event_count: events.length,
    event_roots: eventRoots,
    last_event_id: lastEvent?.event_id ?? null,
    last_world_time: lastEvent?.world_time ?? null,
    replay_root: rootHash({state_root: currentRoot, event_roots: eventRoots})
  };
}

function sealEventLog(log) {
  const base = without(log, 'log_root');
  return {...base, log_root: rootHash(base)};
}

export function createWorldEventLog({world_id, branch_id = 'main', initial_state = {}, initialState, initial_world_time, initialWorldTime, events = []} = {}) {
  const id = String(world_id ?? '');
  fail(id, 'WORLD_EVENT_LOG_WORLD_ID_REQUIRED');
  const state = clone(initialState ?? initial_state ?? {});
  const worldTime = normalizeWorldTimeRef(initialWorldTime ?? initial_world_time ?? {world_id: id});
  fail(worldTime.world_id === id, 'WORLD_EVENT_LOG_TIME_WORLD_MISMATCH');
  let log = sealEventLog({
    format: WORLD_EVENT_LOG_FORMAT,
    version: WORLD_TRUTH_VERSION,
    world_id: id,
    branch_id: String(branch_id),
    initial_state: state,
    initial_state_root: worldStateRoot(state),
    initial_world_time: worldTime,
    events: [],
    head_event_id: null,
    head_event_root: null,
    head_state_root: worldStateRoot(state),
    head_world_time: worldTime,
    event_count: 0
  });
  for (const event of events) log = appendWorldEvent(log, event);
  return log;
}

export function verifyWorldEventLog(log) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!log || typeof log !== 'object') return {valid: false, errors: ['WORLD_EVENT_LOG_NOT_OBJECT']};
  try {
    check(log.format === WORLD_EVENT_LOG_FORMAT, 'WORLD_EVENT_LOG_FORMAT_INVALID');
    check(log.version === WORLD_TRUTH_VERSION, 'WORLD_EVENT_LOG_VERSION_INVALID');
    check(typeof log.world_id === 'string' && log.world_id.length > 0, 'WORLD_EVENT_LOG_WORLD_ID_REQUIRED');
    check(typeof log.branch_id === 'string' && log.branch_id.length > 0, 'WORLD_EVENT_LOG_BRANCH_ID_REQUIRED');
    check(Array.isArray(log.events), 'WORLD_EVENT_LOG_EVENTS_INVALID');
    check(hex64(log.initial_state_root), 'WORLD_EVENT_LOG_INITIAL_STATE_ROOT_INVALID');
    check(log.initial_state_root === worldStateRoot(log.initial_state), 'WORLD_EVENT_LOG_INITIAL_STATE_ROOT_MISMATCH');
    const initialTime = verifyWorldTime(log.initial_world_time);
    check(initialTime.valid, `WORLD_EVENT_LOG_INITIAL_TIME_INVALID:${initialTime.errors.join(',')}`);
    check(log.initial_world_time?.world_id === log.world_id, 'WORLD_EVENT_LOG_INITIAL_TIME_WORLD_MISMATCH');
    const replay = replayWorldEvents(log.initial_state, log.events);
    for (const event of log.events) {
      check(event.world_id === log.world_id, `WORLD_EVENT_LOG_EVENT_WORLD_MISMATCH:${event.event_id}`);
      check(event.branch_id === log.branch_id, `WORLD_EVENT_LOG_EVENT_BRANCH_MISMATCH:${event.event_id}`);
    }
    if (log.events.length) {
      check(tupleCompare(timeTuple(log.events[0].world_time), timeTuple(log.initial_world_time)) > 0, 'WORLD_EVENT_LOG_INITIAL_TIME_ORDER_INVALID');
      check(log.head_event_id === replay.last_event_id, 'WORLD_EVENT_LOG_HEAD_EVENT_MISMATCH');
      check(log.head_event_root === log.events.at(-1).event_root, 'WORLD_EVENT_LOG_HEAD_EVENT_ROOT_MISMATCH');
      check(log.head_state_root === replay.state_root, 'WORLD_EVENT_LOG_HEAD_STATE_MISMATCH');
      check(log.head_world_time?.time_root === replay.last_world_time?.time_root, 'WORLD_EVENT_LOG_HEAD_TIME_MISMATCH');
    } else {
      check(log.head_event_id === null && log.head_event_root === null, 'WORLD_EVENT_LOG_EMPTY_HEAD_INVALID');
      check(log.head_state_root === log.initial_state_root, 'WORLD_EVENT_LOG_EMPTY_STATE_INVALID');
      check(log.head_world_time?.time_root === log.initial_world_time?.time_root, 'WORLD_EVENT_LOG_EMPTY_TIME_INVALID');
    }
    check(log.event_count === log.events.length, 'WORLD_EVENT_LOG_COUNT_MISMATCH');
    check(hex64(log.log_root), 'WORLD_EVENT_LOG_ROOT_INVALID');
    check(rootHash(without(log, 'log_root')) === log.log_root, 'WORLD_EVENT_LOG_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`WORLD_EVENT_LOG_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, log_root: log.log_root ?? null};
}

export function appendWorldEvent(log, event) {
  const logVerification = verifyWorldEventLog(log);
  fail(logVerification.valid, `WORLD_EVENT_LOG_INVALID:${logVerification.errors.join(',')}`);
  const eventVerification = verifyWorldEvent(event);
  fail(eventVerification.valid, `WORLD_EVENT_INVALID:${eventVerification.errors.join(',')}`);
  fail(event.world_id === log.world_id, 'WORLD_EVENT_LOG_EVENT_WORLD_MISMATCH');
  fail(event.branch_id === log.branch_id, 'WORLD_EVENT_LOG_EVENT_BRANCH_MISMATCH');
  fail(!log.events.some(item => item.event_id === event.event_id), 'WORLD_EVENT_LOG_EVENT_DUPLICATE');
  if (log.events.length) {
    fail(event.previous_state_root === log.head_state_root, 'WORLD_EVENT_LOG_PREVIOUS_STATE_MISMATCH');
    fail(event.causal_parents.includes(log.head_event_id), 'WORLD_EVENT_LOG_HEAD_CAUSAL_PARENT_REQUIRED');
    fail(tupleCompare(timeTuple(event.world_time), timeTuple(log.head_world_time)) > 0, 'WORLD_EVENT_LOG_TIME_ORDER_INVALID');
  } else {
    fail(event.previous_state_root === log.initial_state_root, 'WORLD_EVENT_LOG_INITIAL_STATE_MISMATCH');
    fail(tupleCompare(timeTuple(event.world_time), timeTuple(log.initial_world_time)) > 0, 'WORLD_EVENT_LOG_INITIAL_TIME_ORDER_INVALID');
  }
  const events = [...log.events, clone(event)];
  const replay = replayWorldEvents(log.initial_state, events);
  const next = {
    ...clone(log),
    events,
    head_event_id: event.event_id,
    head_event_root: event.event_root,
    head_state_root: replay.state_root,
    head_world_time: clone(event.world_time),
    event_count: events.length
  };
  return sealEventLog(next);
}

function normalizeValidityInterval(input) {
  const value = record(input);
  return {
    start: value.start ?? value.from ?? null,
    end: value.end ?? value.to ?? null,
    semantics: String(value.semantics ?? 'world-time')
  };
}

export function createWorldFact(input = {}) {
  const value = record(input);
  const world_id = String(value.world_id ?? value.worldId ?? '');
  const branch_id = String(value.branch_id ?? value.branchId ?? 'main');
  fail(world_id, 'WORLD_FACT_WORLD_ID_REQUIRED');
  fail(branch_id, 'WORLD_FACT_BRANCH_ID_REQUIRED');
  const authority_domain = String(value.authority_domain ?? value.authorityDomain ?? '');
  fail(authority_domain, 'WORLD_FACT_AUTHORITY_DOMAIN_REQUIRED');
  const confidence = String(value.confidence ?? 'candidate');
  fail(WORLD_FACT_CONFIDENCE.includes(confidence), 'WORLD_FACT_CONFIDENCE_INVALID');
  const claim = clone(value.claim ?? null);
  fail(claim !== null, 'WORLD_FACT_CLAIM_REQUIRED');
  const subject_scope = clone(value.subject_scope ?? value.subjectScope ?? null);
  const object_scope = clone(value.object_scope ?? value.objectScope ?? null);
  const source_events = strings(value.source_events ?? value.sourceEvents);
  const base = {
    format: WORLD_FACT_FORMAT,
    version: WORLD_TRUTH_VERSION,
    fact_id: String(value.fact_id ?? value.factId ?? `fact:${rootHash({world_id, branch_id, claim, source_events}).slice(0, 24)}`),
    world_id,
    branch_id,
    subject_scope,
    object_scope,
    claim,
    validity_interval: normalizeValidityInterval(value.validity_interval ?? value.validityInterval),
    source_events,
    authority_domain,
    confidence
  };
  fail(base.fact_id, 'WORLD_FACT_ID_REQUIRED');
  return {...base, version_root: rootHash(base)};
}

export function verifyWorldFact(fact) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!fact || typeof fact !== 'object') return {valid: false, errors: ['WORLD_FACT_NOT_OBJECT']};
  try {
    check(fact.format === WORLD_FACT_FORMAT, 'WORLD_FACT_FORMAT_INVALID');
    check(fact.version === WORLD_TRUTH_VERSION, 'WORLD_FACT_VERSION_INVALID');
    check(typeof fact.fact_id === 'string' && fact.fact_id.length > 0, 'WORLD_FACT_ID_REQUIRED');
    check(typeof fact.world_id === 'string' && fact.world_id.length > 0, 'WORLD_FACT_WORLD_ID_REQUIRED');
    check(typeof fact.branch_id === 'string' && fact.branch_id.length > 0, 'WORLD_FACT_BRANCH_ID_REQUIRED');
    check(Object.prototype.hasOwnProperty.call(fact, 'claim') && fact.claim !== null, 'WORLD_FACT_CLAIM_REQUIRED');
    check(Array.isArray(fact.source_events), 'WORLD_FACT_SOURCE_EVENTS_INVALID');
    check(typeof fact.authority_domain === 'string' && fact.authority_domain.length > 0, 'WORLD_FACT_AUTHORITY_DOMAIN_REQUIRED');
    check(WORLD_FACT_CONFIDENCE.includes(fact.confidence), 'WORLD_FACT_CONFIDENCE_INVALID');
    check(fact.validity_interval && typeof fact.validity_interval === 'object', 'WORLD_FACT_VALIDITY_INTERVAL_INVALID');
    check(hex64(fact.version_root), 'WORLD_FACT_ROOT_INVALID');
    check(rootHash(without(fact, 'version_root')) === fact.version_root, 'WORLD_FACT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`WORLD_FACT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, version_root: fact.version_root ?? null};
}

function sealFactTree(tree) {
  const base = without(tree, 'tree_root');
  return {...base, tree_root: rootHash(base)};
}

export function createFactWorldTree({world_id, reality_root, branch_id = 'main', events = [], facts = []} = {}) {
  const id = String(world_id ?? '');
  fail(id, 'FACT_TREE_WORLD_ID_REQUIRED');
  const reality = root(reality_root, 'FACT_TREE_REALITY_ROOT_INVALID', '');
  fail(reality !== '', 'FACT_TREE_REALITY_ROOT_REQUIRED');
  const normalizedEvents = events.map(event => {
    const verification = verifyWorldEvent(event);
    fail(verification.valid, `FACT_TREE_EVENT_INVALID:${verification.errors.join(',')}`);
    fail(event.world_id === id, `FACT_TREE_EVENT_WORLD_MISMATCH:${event.event_id}`);
    fail(event.branch_id === String(branch_id), `FACT_TREE_EVENT_BRANCH_MISMATCH:${event.event_id}`);
    return {event_id: event.event_id, event_root: event.event_root, epoch: event.world_time.epoch, logical_clock: event.world_time.logical_clock};
  });
  const eventIds = new Set(normalizedEvents.map(event => event.event_id));
  const normalizedFacts = facts.map(fact => {
    const verification = verifyWorldFact(fact);
    fail(verification.valid, `FACT_TREE_FACT_INVALID:${verification.errors.join(',')}`);
    fail(fact.world_id === id, `FACT_TREE_FACT_WORLD_MISMATCH:${fact.fact_id}`);
    fail(fact.branch_id === String(branch_id), `FACT_TREE_FACT_BRANCH_MISMATCH:${fact.fact_id}`);
    for (const source of fact.source_events) fail(eventIds.has(source), `FACT_TREE_SOURCE_EVENT_MISSING:${fact.fact_id}:${source}`);
    return clone(fact);
  });
  const epochs = [...new Set(normalizedEvents.map(event => event.epoch))].sort((a, b) => a - b);
  return sealFactTree({
    format: FACT_WORLD_TREE_FORMAT,
    version: WORLD_TRUTH_VERSION,
    world_id: id,
    reality_root: reality,
    branch_id: String(branch_id),
    epochs,
    accepted_events: normalizedEvents,
    canonical_facts: normalizedFacts.filter(fact => fact.confidence === 'canonical').map(fact => fact.fact_id).sort(keySort),
    candidate_facts: normalizedFacts.filter(fact => fact.confidence !== 'canonical').map(fact => fact.fact_id).sort(keySort),
    facts: normalizedFacts,
    current_canonical_canopy: {
      event_ids: normalizedEvents.map(event => event.event_id),
      fact_ids: normalizedFacts.map(fact => fact.fact_id)
    },
    memory_world_tree_ref: null
  });
}

export function rebuildFactWorldTree({eventLog, reality_root, realityRoot, facts = []} = {}) {
  const verification = verifyWorldEventLog(eventLog);
  fail(verification.valid, `FACT_TREE_EVENT_LOG_INVALID:${verification.errors.join(',')}`);
  return createFactWorldTree({
    world_id: eventLog.world_id,
    branch_id: eventLog.branch_id,
    reality_root: reality_root ?? realityRoot ?? eventLog.head_state_root,
    events: eventLog.events,
    facts
  });
}

export function verifyFactWorldTree(tree) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!tree || typeof tree !== 'object') return {valid: false, errors: ['FACT_TREE_NOT_OBJECT']};
  try {
    check(tree.format === FACT_WORLD_TREE_FORMAT, 'FACT_TREE_FORMAT_INVALID');
    check(tree.version === WORLD_TRUTH_VERSION, 'FACT_TREE_VERSION_INVALID');
    check(typeof tree.world_id === 'string' && tree.world_id.length > 0, 'FACT_TREE_WORLD_ID_REQUIRED');
    check(typeof tree.branch_id === 'string' && tree.branch_id.length > 0, 'FACT_TREE_BRANCH_ID_REQUIRED');
    check(hex64(tree.reality_root), 'FACT_TREE_REALITY_ROOT_INVALID');
    check(Array.isArray(tree.accepted_events), 'FACT_TREE_EVENTS_INVALID');
    check(Array.isArray(tree.facts), 'FACT_TREE_FACTS_INVALID');
    const eventIds = new Set();
    for (const event of tree.accepted_events ?? []) {
      check(typeof event.event_id === 'string' && event.event_id.length > 0, 'FACT_TREE_EVENT_ID_INVALID');
      check(hex64(event.event_root), `FACT_TREE_EVENT_ROOT_INVALID:${event.event_id}`);
      check(!eventIds.has(event.event_id), `FACT_TREE_EVENT_DUPLICATE:${event.event_id}`);
      eventIds.add(event.event_id);
    }
    const factIds = new Set();
    for (const fact of tree.facts ?? []) {
      const verification = verifyWorldFact(fact);
      check(verification.valid, `FACT_TREE_FACT_INVALID:${fact.fact_id}:${verification.errors.join(',')}`);
      check(fact.world_id === tree.world_id, `FACT_TREE_FACT_WORLD_MISMATCH:${fact.fact_id}`);
      check(fact.branch_id === tree.branch_id, `FACT_TREE_FACT_BRANCH_MISMATCH:${fact.fact_id}`);
      for (const source of fact.source_events ?? []) check(eventIds.has(source), `FACT_TREE_SOURCE_EVENT_MISSING:${fact.fact_id}:${source}`);
      check(!factIds.has(fact.fact_id), `FACT_TREE_FACT_DUPLICATE:${fact.fact_id}`);
      factIds.add(fact.fact_id);
    }
    const expectedCanonicalFacts = [...(tree.facts ?? []).filter(fact => fact.confidence === 'canonical').map(fact => fact.fact_id)].sort(keySort);
    const expectedCandidateFacts = [...(tree.facts ?? []).filter(fact => fact.confidence !== 'canonical').map(fact => fact.fact_id)].sort(keySort);
    check(rootHash(tree.canonical_facts ?? []) === rootHash(expectedCanonicalFacts), 'FACT_TREE_CANONICAL_FACT_INDEX_MISMATCH');
    check(rootHash(tree.candidate_facts ?? []) === rootHash(expectedCandidateFacts), 'FACT_TREE_CANDIDATE_FACT_INDEX_MISMATCH');
    check(rootHash(tree.current_canonical_canopy?.event_ids ?? []) === rootHash((tree.accepted_events ?? []).map(event => event.event_id)), 'FACT_TREE_CANOPY_EVENT_INDEX_MISMATCH');
    check(rootHash(tree.current_canonical_canopy?.fact_ids ?? []) === rootHash((tree.facts ?? []).map(fact => fact.fact_id)), 'FACT_TREE_CANOPY_FACT_INDEX_MISMATCH');
    check(tree.memory_world_tree_ref === null, 'FACT_TREE_MEMORY_REFERENCE_FORBIDDEN');
    check(hex64(tree.tree_root), 'FACT_TREE_ROOT_INVALID');
    check(rootHash(without(tree, 'tree_root')) === tree.tree_root, 'FACT_TREE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`FACT_TREE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, tree_root: tree.tree_root ?? null};
}
