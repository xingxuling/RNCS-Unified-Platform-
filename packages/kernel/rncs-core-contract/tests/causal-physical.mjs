import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAUSAL_DETAIL_LEVELS,
  PHYSICAL_DETAIL_LEVELS,
  createCausalPhysicalProfile,
  deriveCausalPhysicalRequirement,
  verifyCausalPhysicalProfile
} from '../src/index.mjs';

const root = letter => letter.repeat(64);

test('derives independent causal and physical levels from task and reality demand', () => {
  const ambient = createCausalPhysicalProfile({
    profile_id: 'profile:ambient',
    object_id: 'object:city:far',
    canonical_state_root: root('a'),
    demand: {task: 'far navigation', interaction_probability: 0, risk: 0, observation: 0, authority: 0, event_intensity: 0}
  });
  assert.equal(verifyCausalPhysicalProfile(ambient).valid, true);
  assert.deepEqual(ambient.requirement, {causal_level: 'C0', physical_level: 'P0', score: {causal: 0, physical: 0}, rationale: ['task:macro-proxy']});
  assert.equal(ambient.execution.collision_mode, 'none');
  assert.equal(ambient.execution.physics_frequency_hz, 0);
  assert.equal(ambient.resource_costs.CPU_MILLI, 10);

  const combat = createCausalPhysicalProfile({
    profile_id: 'profile:combat',
    object_id: 'object:city:near',
    canonical_state_root: root('b'),
    demand: {task: 'combat collision', interaction_probability: 90, risk: 80, observation: 90, authority: 80, event_intensity: 90}
  });
  assert.equal(verifyCausalPhysicalProfile(combat).valid, true);
  assert.equal(combat.requirement.causal_level, 'C5');
  assert.equal(combat.requirement.physical_level, 'P5');
  assert.equal(combat.execution.collision_mode, 'field');
  assert.equal(combat.execution.field_solver_enabled, true);
  assert.equal(combat.resource_costs.CPU_MILLI > ambient.resource_costs.CPU_MILLI, true);
  assert.equal(combat.resource_costs.GPU_MILLI > ambient.resource_costs.GPU_MILLI, true);
  assert.deepEqual(CAUSAL_DETAIL_LEVELS, ['C0', 'C1', 'C2', 'C3', 'C4', 'C5']);
  assert.deepEqual(PHYSICAL_DETAIL_LEVELS, ['P0', 'P1', 'P2', 'P3', 'P4', 'P5']);
});

test('requires selected detail to meet the derived risk floor and exposes resource blocking', () => {
  const demand = {task: 'combat', interaction_probability: 90, risk: 90, observation: 75, authority: 0, event_intensity: 75};
  const requirement = deriveCausalPhysicalRequirement(demand);
  assert.equal(requirement.causal_level, 'C5');
  assert.equal(requirement.physical_level, 'P5');
  assert.throws(() => createCausalPhysicalProfile({object_id: 'object:unsafe', canonical_state_root: root('c'), demand, selected: {causal_level: 'C1', physical_level: 'P1'}}), /RNCS_CAUSAL_PHYSICAL_CAUSAL_BELOW_REQUIRED/);

  const blocked = createCausalPhysicalProfile({
    profile_id: 'profile:blocked',
    object_id: 'object:blocked',
    canonical_state_root: root('d'),
    demand: {...demand, available_resources: {CPU_MILLI: 1, GPU_MILLI: 1, RAM_MB: 1, VRAM_MB: 1, ENERGY_MILLI: 1}}
  });
  assert.equal(verifyCausalPhysicalProfile(blocked).valid, true);
  assert.equal(blocked.resource_admission.status, 'RESOURCE_INSUFFICIENT');
  assert.equal(blocked.execution_status, 'BLOCKED_RESOURCE');
  assert.equal(blocked.fallback_policy.preserves_safety, true);
});

test('detects profile, execution and authority tampering', () => {
  const profile = createCausalPhysicalProfile({object_id: 'object:tamper', canonical_state_root: root('e'), demand: {task: 'ambient'}});
  const tampered = structuredClone(profile);
  tampered.execution.physics_frequency_hz += 1;
  assert.equal(verifyCausalPhysicalProfile(tampered).valid, false);
  const authority = structuredClone(profile);
  authority.authority.provider_can_write_authoritative_world_state = true;
  assert.equal(verifyCausalPhysicalProfile(authority).valid, false);
});
