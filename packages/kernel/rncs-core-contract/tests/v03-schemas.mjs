import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  advanceWorldTime,
  createAuthorityLease,
  createCausalPhysicalProfile,
  createFactWorldTree,
  createFactWorldTreeRef,
  createRealityChunk,
  createRealityConsistencyProfile,
  createRealityHorizon,
  createRealityInterestGraph,
  createRealityPowerProfile,
  createRealityReplicationEnvelope,
  createRealityResourceBudget,
  createRealityTransportProfile,
  createRepresentationFlow,
  createWorldEvent,
  createWorldFact,
  createWorldTime,
  worldStateRoot
} from '../src/index.mjs';

const root = letter => letter.repeat(64);
const schemaDefinitions = [
  ['world-time.v0.3.schema.json', 'rncs.world-time.v0.3'],
  ['world-event.v0.3.schema.json', 'rncs.world-event.v0.3'],
  ['world-fact.v0.3.schema.json', 'rncs.world-fact.v0.3'],
  ['fact-world-tree.v0.3.schema.json', 'rncs.fact-world-tree.v0.3'],
  ['fact-world-tree-ref.v0.3.schema.json', 'rncs.fact-world-tree-ref.v0.3'],
  ['representation-flow.v0.3.schema.json', 'https://taowind.dev/rncs/representation-flow.v0.3.schema.json'],
  ['causal-physical-profile.v0.3.schema.json', 'https://taowind.dev/rncs/causal-physical-profile.v0.3.schema.json'],
  ['reality-horizon.v0.3.schema.json', 'rncs.reality-horizon.v0.3'],
  ['reality-interest-graph.v0.3.schema.json', 'rncs.reality-interest-graph.v0.3'],
  ['reality-consistency-profile.v0.3.schema.json', 'rncs.reality-consistency-profile.v0.3'],
  ['authority-lease.v0.3.schema.json', 'rncs.authority-lease.v0.3'],
  ['reality-chunk.v0.3.schema.json', 'https://taowind.dev/rncs/reality-chunk.v0.3.schema.json'],
  ['reality-replication-envelope.v0.3.schema.json', 'rncs.reality-replication-envelope.v0.3'],
  ['reality-transport-profile.v0.3.schema.json', 'rncs.reality-transport-profile.v0.3'],
  ['reality-power-profile.v0.3.schema.json', 'rncs.reality-power-profile.v0.3'],
  ['reality-resource-budget.v0.3.schema.json', 'rncs.reality-resource-budget.v0.3']
];

function loadSchemas() {
  const ajv = new Ajv2020({strict: false, allErrors: true});
  const schemas = new Map();
  for (const [name, id] of schemaDefinitions) {
    const schema = JSON.parse(fs.readFileSync(new URL(`../schemas/${name}`, import.meta.url), 'utf8'));
    ajv.addSchema(schema, id);
    schemas.set(name, ajv.getSchema(id));
  }
  return schemas;
}

function fixtures() {
  const world_id = 'world:schema-closure';
  const initial_state = {version: 0};
  const initial_time = createWorldTime({world_id, causal_root: root('a')});
  const next_time = advanceWorldTime(initial_time, {logical_clock_delta: 1, simulation_tick_delta: 1, causal_sequence_delta: 1});
  const previous_state_root = worldStateRoot(initial_state);
  const event = createWorldEvent({
    event_id: 'event:schema-closure',
    world_id,
    branch_id: 'main',
    world_time: next_time,
    mutation: {operations: []},
    previous_state_root,
    next_state_root: previous_state_root,
    authority_receipt: {status: 'committed', receipt_root: root('b')}
  });
  const fact = createWorldFact({
    fact_id: 'fact:schema-closure',
    world_id,
    branch_id: 'main',
    claim: {status: 'stable'},
    source_events: [event.event_id],
    authority_domain: 'world.test'
  });
  const tree = createFactWorldTree({world_id, reality_root: root('c'), events: [event], facts: [fact]});
  const consistency_profile = createRealityConsistencyProfile({profile_id: 'consistency:schema-closure'});
  const authority_lease = createAuthorityLease({
    authority_id: 'authority:schema-closure',
    shard_id: 'shard:schema-closure',
    semantic_scope: 'simulation',
    owner_node: 'node:schema-closure',
    provenance_ref: 'urn:test:provenance',
    authority_ref: 'urn:test:authority',
    valid_from_tick: 0,
    valid_until_tick: 10
  });
  const transport_profile = createRealityTransportProfile({profile_id: 'transport:schema-closure'});
  const power_profile = createRealityPowerProfile({profile_id: 'power:schema-closure', node_id: 'node:schema-closure'});
  return new Map([
    ['world-time.v0.3.schema.json', initial_time],
    ['world-event.v0.3.schema.json', event],
    ['world-fact.v0.3.schema.json', fact],
    ['fact-world-tree.v0.3.schema.json', tree],
    ['fact-world-tree-ref.v0.3.schema.json', createFactWorldTreeRef({tree})],
    ['representation-flow.v0.3.schema.json', createRepresentationFlow({
      flow_id: 'flow:schema-closure',
      object_id: 'object:schema-closure',
      source_state_root: root('d'),
      target_state_root: root('e'),
      source_representation_root: root('f'),
      target_representation_root: root('1'),
      interval: {source_time_ms: 0, target_time_ms: 10, source_tick: 0, target_tick: 1},
      motion_field: {kind: 'TRANSLATION', space: 'world', unit: 'millimeter', source: [0, 0, 0], target: [1, 0, 0]},
      interpolation_policy: {mode: 'LINEAR', extrapolation: 'DISALLOW', max_extrapolation_ms: 0, max_extrapolation_ticks: 0, clamp_to_interval: true},
      prediction_budget: {max_extrapolation_ms: 0, max_extrapolation_ticks: 0, max_prediction_error_mm: 1, max_prediction_error_mdeg: 1},
      error_budget: {max_position_error_mm: 1, max_rotation_error_mdeg: 1, stale_after_ms: 10},
      safety_bound: {collision_preserving: true, max_displacement_mm: 1}
    })],
    ['causal-physical-profile.v0.3.schema.json', createCausalPhysicalProfile({object_id: 'object:schema-closure', canonical_state_root: root('2'), demand: {task: 'ambient'}})],
    ['reality-horizon.v0.3.schema.json', createRealityHorizon({subject_id: 'subject:schema-closure'})],
    ['reality-interest-graph.v0.3.schema.json', createRealityInterestGraph({subject_id: 'subject:schema-closure'})],
    ['reality-consistency-profile.v0.3.schema.json', consistency_profile],
    ['authority-lease.v0.3.schema.json', authority_lease],
    ['reality-chunk.v0.3.schema.json', createRealityChunk({chunk_id: 'chunk:schema-closure', world_id, canonical_state_root: root('3')})],
    ['reality-replication-envelope.v0.3.schema.json', createRealityReplicationEnvelope({
      world_id,
      shard_id: authority_lease.shard_id,
      source_node: authority_lease.owner_node,
      target_node: 'node:target',
      sequence: 1,
      version_root: root('4'),
      base_version_root: root('5'),
      consistency_profile,
      authority_lease,
      payload: {kind: 'schema-closure'}
    })],
    ['reality-transport-profile.v0.3.schema.json', transport_profile],
    ['reality-power-profile.v0.3.schema.json', power_profile],
    ['reality-resource-budget.v0.3.schema.json', createRealityResourceBudget({
      budget_id: 'budget:schema-closure',
      node_id: 'node:schema-closure',
      power_profile_root: power_profile.power_root,
      transport_profile_roots: [transport_profile.profile_root]
    })]
  ]);
}

test('v0.3 P0 schemas validate generated candidate contracts', () => {
  const schemas = loadSchemas();
  for (const [name, value] of fixtures()) {
    const validate = schemas.get(name);
    assert.ok(validate, `missing validator for ${name}`);
    assert.equal(validate(value), true, `${name}: ${JSON.stringify(validate.errors)}`);
  }
});

test('v0.3 P0 schemas reject authority escalation in candidate contracts', () => {
  const schemas = loadSchemas();
  for (const [name, value] of fixtures()) {
    const candidate = structuredClone(value);
    if (!Object.prototype.hasOwnProperty.call(candidate, 'candidate_only')) continue;
    candidate.candidate_only = false;
    assert.equal(schemas.get(name)(candidate), false, `${name} accepted candidate_only=false`);
  }
});

console.log('v0.3 P0 schema closure tests: 2 PASS');
