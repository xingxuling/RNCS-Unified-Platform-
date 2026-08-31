import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createMinimumViableReality,
  createRealityFault,
  createRealityLoadSheddingPlan,
  createRealityPowerProfile,
  createRealityResourceBudget,
  createRealityResourceDemand,
  verifyMinimumViableReality,
  verifyRealityFault,
  verifyRealityLoadSheddingPlan,
  verifyRealityPowerProfile,
  verifyRealityResourceBudget,
  verifyRealityResourceDemand
} from '../src/index.mjs';

const root = (letter) => letter.repeat(64);

test('seals power state, thermal envelope and safe identity/body boundary', () => {
  const abundant = createRealityPowerProfile({
    profile_id: 'power:grid',
    node_id: 'node:power',
    power_state: 'grid',
    grid_connected: true,
    battery_percent: 90,
    thermal_celsius_milli: 30000
  });
  assert.equal(verifyRealityPowerProfile(abundant).valid, true);
  assert.equal(abundant.power_mode, 'ABUNDANT');
  assert.equal(abundant.thermal_state, 'NOMINAL');
  assert.equal(abundant.body_available, true);

  const constrained = createRealityPowerProfile({
    profile_id: 'power:battery',
    node_id: 'node:power',
    power_state: 'battery',
    grid_connected: false,
    battery_percent: 12,
    thermal_celsius_milli: 72000
  });
  assert.equal(verifyRealityPowerProfile(constrained).valid, true);
  assert.equal(constrained.power_mode, 'CONSTRAINED');
  assert.equal(constrained.thermal_state, 'HOT');
  assert.equal(constrained.load_shedding_level, 'SEVERE');

  const offline = createRealityPowerProfile({profile_id: 'power:offline', node_id: 'node:power', power_state: 'offline', grid_connected: false, battery_percent: 0});
  assert.equal(offline.body_available, false);
  const tampered = structuredClone(constrained);
  tampered.battery_percent = 99;
  assert.equal(verifyRealityPowerProfile(tampered).valid, false);
  assert.throws(() => createRealityPowerProfile({node_id: 'node:power', thermal_throttle_celsius_milli: 90000, thermal_critical_celsius_milli: 80000}), /RNCS_POWER_THERMAL_ENVELOPE_INVALID/);
});
test('binds compute, memory, transport and energy budget pressure deterministically', () => {
  const budget = createRealityResourceBudget({
    budget_id: 'budget:pressure',
    node_id: 'node:power',
    window_ticks: 10,
    power_profile_root: root('a'),
    capacities: {CPU: 1000, GPU: 1000, VRAM: 2048, RAM: 8192, NETWORK: 10000, ENERGY: 1000},
    used: {CPU: 850, GPU: 500, VRAM: 1800, ENERGY: 700},
    reserved: {CPU: 100, ENERGY: 100},
    minimum_reserve: {CPU: 50, ENERGY: 50},
    transport_profile_roots: [root('b')]
  });
  assert.equal(verifyRealityResourceBudget(budget).valid, true);
  assert.equal(budget.available.CPU, 50);
  assert.equal(budget.available.ENERGY, 200);
  assert.equal(budget.budget_mode, 'PRESSURED');
  assert.equal(budget.pressure_by_resource.CPU, 'PRESSURED');
  const tampered = structuredClone(budget);
  tampered.available.CPU = 51;
  assert.equal(verifyRealityResourceBudget(tampered).valid, false);
});

test('keeps authority and control while shedding visual and refinement demand', () => {
  const power = createRealityPowerProfile({node_id: 'node:governor', power_state: 'battery', grid_connected: false, battery_percent: 18, thermal_celsius_milli: 55000});
  const budget = createRealityResourceBudget({node_id: 'node:governor', power_profile_root: power.power_root, capacities: {CPU: 1000, GPU: 1000, VRAM: 1000, RAM: 1000, NETWORK: 1000, ENERGY: 1000}, used: {CPU: 100, ENERGY: 100}});
  const demands = [
    createRealityResourceDemand({candidate_id: 'safety:collision', candidate_kind: 'safety', priority: 100, resource_costs: {CPU: 20, ENERGY: 5}}),
    createRealityResourceDemand({candidate_id: 'authority:event', candidate_kind: 'authority', priority: 100, resource_costs: {CPU: 30, ENERGY: 5}}),
    createRealityResourceDemand({candidate_id: 'visual:nearby', candidate_kind: 'visual', priority: 60, resource_costs: {GPU: 400, VRAM: 400, NETWORK: 100}}),
    createRealityResourceDemand({candidate_id: 'refinement:background', candidate_kind: 'refinement', priority: 10, resource_costs: {GPU: 700, VRAM: 700, NETWORK: 100}, fallback_candidate_id: 'visual:proxy'})
  ];
  assert.equal(demands.every(demand => verifyRealityResourceDemand(demand).valid), true);
  const plan = createRealityLoadSheddingPlan({
    plan_id: 'plan:constrained',
    tick: 12,
    power_profile: power,
    resource_budget: budget,
    canonical_state_root: root('c'),
    demands
  });
  assert.equal(verifyRealityLoadSheddingPlan(plan).valid, true);
  const byId = Object.fromEntries(plan.decisions.map(decision => [decision.candidate_id, decision]));
  assert.equal(byId['safety:collision'].action, 'KEEP');
  assert.equal(byId['authority:event'].action, 'KEEP');
  assert.equal(byId['visual:nearby'].action, 'REDUCE_DETAIL');
  assert.equal(byId['refinement:background'].action, 'DEFER');
  assert.equal(plan.preserves_canonical_truth, true);
  assert.equal(plan.canonical_write_authorized, false);
});

test('recovers minimum viable reality during a critical fault without changing world truth', () => {
  const power = createRealityPowerProfile({node_id: 'node:fault', power_state: 'battery', grid_connected: false, battery_percent: 3, thermal_celsius_milli: 90000});
  const budget = createRealityResourceBudget({node_id: 'node:fault', power_profile_root: power.power_root, capacities: {CPU: 500, RAM: 500, ENERGY: 200}, used: {CPU: 50, RAM: 50, ENERGY: 20}});
  const fault = createRealityFault({fault_id: 'fault:gpu-pressure', node_id: 'node:fault', fault_kind: 'gpu_memory_pressure', severity: 90, affected_resources: ['gpu', 'vram'], reason: 'GPU memory pressure blocks high-detail pages'});
  const minimum = createMinimumViableReality({
    reality_id: 'reality:fault',
    scope_id: 'room:fault',
    canonical_state_root: root('d'),
    world_time_tick: 44,
    required_layers: ['world_proxy', 'collision', 'semantic'],
    available_layers: ['world_proxy'],
    fault_roots: [fault.fault_root]
  });
  assert.equal(verifyRealityFault(fault).valid, true);
  assert.equal(verifyMinimumViableReality(minimum).valid, true);
  const demand = createRealityResourceDemand({candidate_id: 'minimum:room', candidate_kind: 'minimum_reality', priority: 100, resource_costs: {CPU: 100, RAM: 100, ENERGY: 20}, preserve_minimum_reality: true});
  const plan = createRealityLoadSheddingPlan({plan_id: 'plan:fault-recovery', tick: 44, power_profile: power, resource_budget: budget, faults: [fault], minimum_reality: minimum, demands: [demand]});
  const decision = plan.decisions[0];
  assert.equal(decision.action, 'RECOVER_MINIMUM');
  assert.equal(decision.admitted, true);
  assert.equal(plan.power_mode, 'SURVIVAL');
  assert.deepEqual(plan.fault_roots, [fault.fault_root]);
  assert.equal(plan.preserves_canonical_truth, true);
  assert.equal(verifyRealityLoadSheddingPlan(plan).valid, true);
});
