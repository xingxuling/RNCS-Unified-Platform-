import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceWorldTime,
  appendWorldEvent,
  applyWorldMutation,
  createWorldEvent,
  createWorldEventLog,
  createWorldFact,
  createWorldTime,
  rebuildFactWorldTree,
  replayWorldEvents,
  verifyFactWorldTree,
  verifyWorldEventLog,
  verifyWorldTime,
  worldStateRoot
} from '../packages/kernel/rncs-core-contract/src/index.mjs';

const worldId = 'world:urrf-v03-integration';
const authorityRoot = 'a'.repeat(64);
const realityRoot = 'b'.repeat(64);

function buildRuntime() {
  const initialState = {city: {power: 'on'}, weather: 'clear'};
  const initialTime = createWorldTime({world_id: worldId, epoch: 1, logical_clock: 10, simulation_tick: 20, causal_sequence: 0, simulation_rate: '20hz', time_scale: '1', causal_root: authorityRoot});
  const mutation = {operations: [{op: 'set', path: 'city.power', value: 'off'}, {op: 'set', path: 'weather', value: 'heavy-rain'}]};
  const nextState = applyWorldMutation(initialState, mutation);
  const eventTime = advanceWorldTime(initialTime, {logical_clock_delta: 1, simulation_tick_delta: 1, causal_sequence_delta: 1});
  const event = createWorldEvent({
    event_id: 'event:storm-power-loss',
    world_id: worldId,
    branch_id: 'main',
    world_time: eventTime,
    subjects: ['subject:storm'],
    objects: ['object:city-grid', 'object:weather'],
    mutation,
    previous_state_root: worldStateRoot(initialState),
    next_state_root: worldStateRoot(nextState),
    authority_receipt: {status: 'committed', receipt_root: authorityRoot, epoch: 1}
  });
  const log = appendWorldEvent(createWorldEventLog({world_id: worldId, initial_state: initialState, initial_world_time: initialTime}), event);
  const fact = createWorldFact({
    fact_id: 'fact:city-without-power',
    world_id: worldId,
    branch_id: 'main',
    subject_scope: {kind: 'object', id: 'object:city-grid'},
    object_scope: {kind: 'property', path: 'power'},
    claim: {value: 'off'},
    validity_interval: {start: eventTime.time_root, end: null},
    source_events: [event.event_id],
    authority_domain: 'world.state',
    confidence: 'canonical'
  });
  return {initialState, initialTime, event, log, fact, nextState};
}

test('v0.3 truth vertical preserves time, event replay and authority receipt boundaries', () => {
  const {initialTime, event, log, initialState, nextState} = buildRuntime();
  assert.equal(verifyWorldTime(initialTime).valid, true);
  assert.equal(verifyWorldEventLog(log).valid, true);
  const replay = replayWorldEvents(initialState, log.events);
  assert.deepEqual(replay.state, nextState);
  assert.equal(replay.last_event_id, event.event_id);
  assert.equal(log.head_state_root, worldStateRoot(nextState));
});

test('v0.3 Fact World Tree traces canonical history and never imports subject memory', () => {
  const {log, fact} = buildRuntime();
  const tree = rebuildFactWorldTree({eventLog: log, reality_root: realityRoot, facts: [fact]});
  assert.equal(verifyFactWorldTree(tree).valid, true);
  assert.deepEqual(tree.canonical_facts, [fact.fact_id]);
  assert.equal(tree.memory_world_tree_ref, null);
});

test('v0.3 tampered state roots and out-of-order events are rejected', () => {
  const {initialState, event, log} = buildRuntime();
  const tampered = structuredClone(log);
  tampered.events[0].next_state_root = 'c'.repeat(64);
  assert.equal(verifyWorldEventLog(tampered).valid, false);
  assert.throws(() => replayWorldEvents(initialState, [structuredClone(event), structuredClone(event)]), /WORLD_REPLAY_PREVIOUS_STATE_MISMATCH|WORLD_REPLAY_TIME_ORDER_INVALID/);
});
