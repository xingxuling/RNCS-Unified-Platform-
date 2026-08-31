import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createMinimumViableReality,
  createRealityFault,
  createRealityPowerProfile,
  createRealityResourceBudget,
  createRealityResourceDemand,
  rootHash,
  verifyRealityLoadSheddingPlan,
  verifyRealityPowerProfile
} from '@taowind/rncs-core-contract';
import {RealityResourceGovernor} from '../src/index.mjs';

const root = letter => letter.repeat(64);

test('governor combines power, resource and fault pressure while preserving protected work', () => {
  const power = createRealityPowerProfile({node_id: 'node:governor', power_state: 'battery', grid_connected: false, battery_percent: 18, thermal_celsius_milli: 55000});
  const budget = createRealityResourceBudget({node_id: 'node:governor', power_profile_root: power.power_root, capacities: {CPU: 1000, GPU: 1000, VRAM: 1000, RAM: 1000, NETWORK: 1000, ENERGY: 1000}, used: {CPU: 100, ENERGY: 100}});
  const governor = new RealityResourceGovernor({nodeId: 'node:governor', tick: 12, powerProfile: power, resourceBudget: budget});
  governor.submitDemand(createRealityResourceDemand({candidate_id: 'authority:tick', candidate_kind: 'authority', priority: 100, resource_costs: {CPU: 50, ENERGY: 5}}));
  governor.submitDemand(createRealityResourceDemand({candidate_id: 'visual:nearby', candidate_kind: 'visual', priority: 70, resource_costs: {GPU: 400, VRAM: 400, NETWORK: 50}}));
  governor.submitDemand(createRealityResourceDemand({candidate_id: 'refinement:far', candidate_kind: 'refinement', priority: 5, resource_costs: {GPU: 400, VRAM: 400, NETWORK: 50}, fallback_candidate_id: 'visual:proxy'}));
  const plan = governor.plan({planId: 'plan:governor'});
  assert.equal(verifyRealityPowerProfile(power).valid, true);
  assert.equal(verifyRealityLoadSheddingPlan(plan).valid, true);
  assert.equal(governor.admit('authority:tick', plan).action, 'KEEP');
  assert.equal(governor.admit('visual:nearby', plan).action, 'REDUCE_DETAIL');
  assert.equal(governor.admit('refinement:far', plan).action, 'DEFER');
  assert.equal(plan.canonical_write_authorized, false);
  assert.equal(governor.verify().candidate_only, true);
});

test('governor restores a bounded minimum reality on provider and thermal faults', () => {
  const power = createRealityPowerProfile({node_id: 'node:recovery', power_state: 'battery', grid_connected: false, battery_percent: 3, thermal_celsius_milli: 90000});
  const budget = createRealityResourceBudget({node_id: 'node:recovery', power_profile_root: power.power_root, capacities: {CPU: 500, RAM: 500, ENERGY: 200}, used: {CPU: 20, RAM: 20, ENERGY: 10}});
  const fault = createRealityFault({fault_id: 'fault:provider', node_id: 'node:recovery', fault_kind: 'provider_crash', severity: 85, affected_resources: ['GPU', 'VRAM'], reason: 'visual provider unavailable'});
  const minimum = createMinimumViableReality({reality_id: 'reality:recovery', scope_id: 'room:recovery', canonical_state_root: root('e'), world_time_tick: 30, required_layers: ['WORLD_PROXY', 'COLLISION', 'SEMANTIC'], available_layers: ['WORLD_PROXY'], fault_roots: [fault.fault_root]});
  const governor = new RealityResourceGovernor({nodeId: 'node:recovery', tick: 30, powerProfile: power, resourceBudget: budget, minimumReality: minimum, faults: [fault]});
  governor.submitDemand({candidate_id: 'minimum:recovery', candidate_kind: 'minimum_reality', priority: 100, preserve_minimum_reality: true, resource_costs: {CPU: 100, RAM: 100, ENERGY: 20}});
  const plan = governor.plan({planId: 'plan:recovery'});
  const decision = governor.getDecision('minimum:recovery', plan);
  assert.equal(decision.action, 'RECOVER_MINIMUM');
  assert.equal(decision.admitted, true);
  assert.equal(plan.power_mode, 'SURVIVAL');
  assert.equal(plan.fault_roots.includes(fault.fault_root), true);
  const recovered = governor.clearFault('fault:provider', 31);
  assert.equal(recovered.status, 'RECOVERED');
  governor.advance(2);
  const snapshot = governor.verify();
  const snapshotBody = structuredClone(snapshot);
  delete snapshotBody.governor_root;
  assert.equal(snapshot.governor_root, rootHash(snapshotBody));
});
