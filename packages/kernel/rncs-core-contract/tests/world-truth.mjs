import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  advanceWorldTime,
  appendWorldEvent,
  applyWorldMutation,
  createFactWorldTree,
  createWorldEvent,
  createWorldEventLog,
  createWorldFact,
  createWorldTime,
  rebuildFactWorldTree,
  replayWorldEvents,
  verifyFactWorldTree,
  verifyWorldEvent,
  verifyWorldEventLog,
  verifyWorldFact,
  verifyWorldTime,
  worldStateRoot
} from '../src/index.mjs';

let pass = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log('ok', ++pass, '-', name);
  } catch (error) {
    console.error('not ok -', name, error);
    process.exitCode = 1;
  }
};

const worldId = 'world:v03-truth';
const authorityRoot = 'a'.repeat(64);
const evidenceRoot = 'b'.repeat(64);
const realityRoot = 'c'.repeat(64);

function fixture() {
  const initialState = {city: {power: 'on', rain: 'clear'}, version: 0};
  const initialTime = createWorldTime({
    world_id: worldId,
    epoch: 7,
    logical_clock: 100,
    simulation_tick: 200,
    causal_sequence: 0,
    simulation_rate: '20hz',
    time_scale: '1',
    causal_root: authorityRoot,
    status: 'running',
    historical_reference: {kind: 'fixture', id: 'v03'}
  });
  const mutationOne = {operations: [{op: 'set', path: 'city.power', value: 'off'}]};
  const stateOne = applyWorldMutation(initialState, mutationOne);
  const timeOne = advanceWorldTime(initialTime, {logical_clock_delta: 1, simulation_tick_delta: 1, causal_sequence_delta: 1});
  const eventOne = createWorldEvent({
    event_id: 'event:power-off',
    world_id: worldId,
    branch_id: 'main',
    world_time: timeOne,
    causal_parents: [],
    subjects: ['subject:storm'],
    objects: ['object:city-grid'],
    mutation: mutationOne,
    previous_state_root: worldStateRoot(initialState),
    next_state_root: worldStateRoot(stateOne),
    authority_receipt: {status: 'committed', receipt_root: authorityRoot, epoch: 7},
    evidence_ref: {root: evidenceRoot, kind: 'weather-observation'}
  });
  const mutationTwo = {operations: [{op: 'set', path: 'city.rain', value: 'heavy'}, {op: 'set', path: 'version', value: 1}]};
  const stateTwo = applyWorldMutation(stateOne, mutationTwo);
  const timeTwo = advanceWorldTime(timeOne, {logical_clock_delta: 1, simulation_tick_delta: 1, causal_sequence_delta: 1});
  const eventTwo = createWorldEvent({
    event_id: 'event:heavy-rain',
    world_id: worldId,
    branch_id: 'main',
    world_time: timeTwo,
    causal_parents: [eventOne.event_id],
    subjects: ['subject:storm'],
    objects: ['object:city'],
    mutation: mutationTwo,
    previous_state_root: worldStateRoot(stateOne),
    next_state_root: worldStateRoot(stateTwo),
    authority_receipt: {status: 'committed', receipt_root: authorityRoot, epoch: 7},
    evidence_ref: evidenceRoot
  });
  const log = createWorldEventLog({world_id: worldId, branch_id: 'main', initial_state: initialState, initial_world_time: initialTime});
  const withOne = appendWorldEvent(log, eventOne);
  const withTwo = appendWorldEvent(withOne, eventTwo);
  return {initialState, initialTime, eventOne, eventTwo, log: withTwo, stateTwo};
}

test('WorldTime keeps simulation, logical and causal clocks distinct and rooted', () => {
  const {initialTime} = fixture();
  assert.equal(verifyWorldTime(initialTime).valid, true);
  const next = advanceWorldTime(initialTime, {logical_clock_delta: 2, simulation_tick_delta: 3, causal_sequence_delta: 1, time_scale: '0.5'});
  assert.equal(next.logical_clock, 102);
  assert.equal(next.simulation_tick, 203);
  assert.equal(next.causal_sequence, 1);
  assert.equal(next.time_scale, '0.5');
  assert.notEqual(next.time_root, initialTime.time_root);
  assert.equal(verifyWorldTime(next).valid, true);
});

test('WorldEvent requires a committed authority receipt and verifies mutation/state roots', () => {
  const {eventOne} = fixture();
  assert.equal(verifyWorldEvent(eventOne).valid, true);
  assert.throws(() => createWorldEvent({world_id: worldId, world_time: eventOne.world_time, previous_state_root: eventOne.previous_state_root, next_state_root: eventOne.next_state_root, mutation: eventOne.mutation}), /WORLD_EVENT_AUTHORITY_RECEIPT_REQUIRED/);
  const tampered = structuredClone(eventOne);
  tampered.mutation.operations[0].value = 'on';
  assert.equal(verifyWorldEvent(tampered).valid, false);
});

test('Canonical event log replays state deterministically and enforces causal order', () => {
  const {log, initialState, eventOne, eventTwo, stateTwo} = fixture();
  assert.equal(verifyWorldEventLog(log).valid, true);
  const replay = replayWorldEvents(initialState, log.events);
  assert.deepEqual(replay.state, stateTwo);
  assert.equal(replay.state_root, worldStateRoot(stateTwo));
  assert.equal(log.head_state_root, worldStateRoot(stateTwo));
  const reordered = structuredClone(log.events).reverse();
  assert.throws(() => replayWorldEvents(initialState, reordered), /WORLD_REPLAY_PREVIOUS_STATE_MISMATCH|WORLD_REPLAY_TIME_ORDER_INVALID/);
  assert.equal(eventTwo.causal_parents.includes(eventOne.event_id), true);
});

test('FactWorldTree keeps canonical facts distinct from subject memory and traces source events', () => {
  const {log, eventOne, eventTwo} = fixture();
  const canonical = createWorldFact({
    fact_id: 'fact:city-power-off',
    world_id: worldId,
    branch_id: 'main',
    subject_scope: {kind: 'object', id: 'object:city-grid'},
    object_scope: {kind: 'property', path: 'power'},
    claim: {value: 'off'},
    validity_interval: {start: eventOne.world_time.time_root, end: null},
    source_events: [eventOne.event_id],
    authority_domain: 'world.state',
    confidence: 'canonical'
  });
  const candidate = createWorldFact({
    fact_id: 'fact:rain-forecast',
    world_id: worldId,
    branch_id: 'main',
    subject_scope: {kind: 'subject', id: 'subject:observer'},
    object_scope: {kind: 'weather', id: 'city'},
    claim: {value: 'heavy'},
    validity_interval: {start: eventTwo.world_time.time_root, end: null},
    source_events: [eventTwo.event_id],
    authority_domain: 'observation',
    confidence: 'candidate'
  });
  assert.equal(verifyWorldFact(canonical).valid, true);
  assert.equal(verifyWorldFact(candidate).valid, true);
  const tree = rebuildFactWorldTree({eventLog: log, reality_root: realityRoot, facts: [canonical, candidate]});
  assert.equal(verifyFactWorldTree(tree).valid, true);
  assert.deepEqual(tree.canonical_facts, ['fact:city-power-off']);
  assert.deepEqual(tree.candidate_facts, ['fact:rain-forecast']);
  assert.equal(tree.memory_world_tree_ref, null);
  const tampered = structuredClone(tree);
  tampered.canonical_facts = [];
  assert.equal(verifyFactWorldTree(tampered).valid, false);
  assert.throws(() => createFactWorldTree({world_id: worldId, reality_root: realityRoot, events: log.events, facts: [createWorldFact({...candidate, source_events: ['event:missing']})]}), /FACT_TREE_SOURCE_EVENT_MISSING/);
});

test('v0.3 schemas freeze the four P0 truth contracts', () => {
  const expected = [
    ['world-time.v0.3.schema.json', 'WORLD_TIME_FORMAT'],
    ['world-event.v0.3.schema.json', 'WORLD_EVENT_FORMAT'],
    ['world-fact.v0.3.schema.json', 'WORLD_FACT_FORMAT'],
    ['fact-world-tree.v0.3.schema.json', 'FACT_TREE_FORMAT']
  ];
  for (const [name, formatKey] of expected) {
    const schema = JSON.parse(fs.readFileSync(new URL(`../schemas/${name}`, import.meta.url), 'utf8'));
    assert.equal(schema.type, 'object');
    assert.ok(schema.required.length > 0);
    assert.ok(Object.keys(schema.properties).length > 0);
    assert.equal(schema.properties.format.const, {
      WORLD_TIME_FORMAT: 'rncs.world-time.v0.3',
      WORLD_EVENT_FORMAT: 'rncs.world-event.v0.3',
      WORLD_FACT_FORMAT: 'rncs.world-fact.v0.3',
      FACT_TREE_FORMAT: 'rncs.fact-world-tree.v0.3'
    }[formatKey]);
  }
});

console.log(`world truth tests: ${pass}/5 PASS`);
