import {
  createMinimumViableReality,
  createRealityFault,
  createRealityLoadSheddingPlan,
  createRealityPowerProfile,
  createRealityResourceBudget,
  createRealityResourceDemand,
  rootHash,
  verifyMinimumViableReality,
  verifyRealityFault,
  verifyRealityLoadSheddingPlan,
  verifyRealityPowerProfile,
  verifyRealityResourceBudget,
  verifyRealityResourceDemand
} from '@taowind/rncs-core-contract';

export const URRF_RESOURCE_GOVERNOR_FORMAT = 'urrf.reality-resource-governor.v0.1';
export const URRF_RESOURCE_GOVERNOR_VERSION = '0.1.0';

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const fail = (condition, code) => { if (!condition) throw new Error(code); };

function rootedCandidate(value, rootField, create, verify, code) {
  const candidate = record(value)[rootField] ? clone(value) : create(value);
  const verification = verify(candidate);
  fail(verification.valid, `${code}:${verification.errors.join(',')}`);
  return candidate;
}

export class RealityResourceGovernor {
  constructor(input = {}) {
    const value = record(input);
    this.nodeId = String(value.node_id ?? value.nodeId ?? 'node:local');
    fail(this.nodeId.length > 0, 'URRF_RESOURCE_GOVERNOR_NODE_REQUIRED');
    this.tick = Number(value.tick ?? 0);
    fail(Number.isSafeInteger(this.tick) && this.tick >= 0, 'URRF_RESOURCE_GOVERNOR_TICK_INVALID');
    this.powerProfile = null;
    this.resourceBudget = null;
    this.minimumReality = null;
    this.demands = new Map();
    this.faults = new Map();
    this.plans = new Map();
    this.registerPowerProfile(value.power_profile ?? value.powerProfile ?? {
      node_id: this.nodeId,
      power_state: 'GRID',
      grid_connected: true,
      battery_percent: 100,
      thermal_celsius_milli: 25000
    });
    this.registerResourceBudget(value.resource_budget ?? value.resourceBudget ?? {
      node_id: this.nodeId,
      power_profile_root: this.powerProfile.power_root
    });
    if (value.minimum_reality ?? value.minimumReality) this.registerMinimumReality(value.minimum_reality ?? value.minimumReality);
    for (const demand of value.demands ?? value.resource_demands ?? value.resourceDemands ?? []) this.submitDemand(demand);
    for (const fault of value.faults ?? []) this.registerFault(fault);
  }

  registerPowerProfile(input = {}) {
    const profile = rootedCandidate(input, 'power_root', value => createRealityPowerProfile({...value, node_id: value.node_id ?? value.nodeId ?? this.nodeId}), verifyRealityPowerProfile, 'URRF_RESOURCE_GOVERNOR_POWER_PROFILE_INVALID');
    fail(profile.node_id === this.nodeId, 'URRF_RESOURCE_GOVERNOR_POWER_NODE_MISMATCH');
    this.powerProfile = profile;
    return clone(profile);
  }

  registerResourceBudget(input = {}) {
    const value = record(input);
    const budget = rootedCandidate(value, 'budget_root', candidate => createRealityResourceBudget({
      ...candidate,
      node_id: candidate.node_id ?? candidate.nodeId ?? this.nodeId,
      power_profile_root: candidate.power_profile_root ?? candidate.powerProfileRoot ?? this.powerProfile?.power_root
    }), verifyRealityResourceBudget, 'URRF_RESOURCE_GOVERNOR_RESOURCE_BUDGET_INVALID');
    fail(budget.node_id === this.nodeId, 'URRF_RESOURCE_GOVERNOR_BUDGET_NODE_MISMATCH');
    if (this.powerProfile && budget.power_profile_root !== '0'.repeat(64)) fail(budget.power_profile_root === this.powerProfile.power_root, 'URRF_RESOURCE_GOVERNOR_BUDGET_POWER_ROOT_MISMATCH');
    this.resourceBudget = budget;
    return clone(budget);
  }

  registerMinimumReality(input = {}) {
    const reality = rootedCandidate(input, 'minimum_reality_root', value => createMinimumViableReality({
      ...value,
      reality_id: value.reality_id ?? value.realityId ?? `reality:${this.nodeId}`,
      scope_id: value.scope_id ?? value.scopeId ?? `scope:${this.nodeId}`,
      world_time_tick: value.world_time_tick ?? value.worldTimeTick ?? this.tick
    }), verifyMinimumViableReality, 'URRF_RESOURCE_GOVERNOR_MINIMUM_REALITY_INVALID');
    this.minimumReality = reality;
    return clone(reality);
  }

  submitDemand(input = {}) {
    const demand = rootedCandidate(input, 'demand_root', createRealityResourceDemand, verifyRealityResourceDemand, 'URRF_RESOURCE_GOVERNOR_DEMAND_INVALID');
    this.demands.set(demand.candidate_id, demand);
    return clone(demand);
  }

  registerFault(input = {}) {
    const fault = rootedCandidate(input, 'fault_root', createRealityFault, verifyRealityFault, 'URRF_RESOURCE_GOVERNOR_FAULT_INVALID');
    this.faults.set(fault.fault_id, fault);
    return clone(fault);
  }

  clearFault(faultId, recoveredAtTick = this.tick) {
    const current = this.faults.get(String(faultId));
    fail(current, 'URRF_RESOURCE_GOVERNOR_FAULT_NOT_FOUND');
    const recovered = createRealityFault({...current, status: 'RECOVERED', recovered_at_tick: recoveredAtTick});
    this.faults.set(recovered.fault_id, recovered);
    return clone(recovered);
  }

  setMinimumReality(input = {}) {
    return this.registerMinimumReality(input);
  }

  plan(input = {}) {
    const value = record(input);
    if (value.power_profile ?? value.powerProfile) this.registerPowerProfile(value.power_profile ?? value.powerProfile);
    if (value.resource_budget ?? value.resourceBudget) this.registerResourceBudget(value.resource_budget ?? value.resourceBudget);
    if (value.minimum_reality ?? value.minimumReality) this.registerMinimumReality(value.minimum_reality ?? value.minimumReality);
    const demands = value.demands ?? value.resource_demands ?? value.resourceDemands ?? [...this.demands.values()];
    const faults = value.faults ?? [...this.faults.values()];
    const minimum = this.minimumReality ?? createMinimumViableReality({
      reality_id: `reality:${this.nodeId}`,
      scope_id: `scope:${this.nodeId}`,
      world_time_tick: this.tick,
      canonical_state_root: '0'.repeat(64),
      fault_roots: faults.map(fault => fault.fault_root)
    });
    const plan = createRealityLoadSheddingPlan({
      ...value,
      plan_id: value.plan_id ?? value.planId ?? `plan:${this.nodeId}:${this.tick}:${this.plans.size + 1}`,
      node_id: this.nodeId,
      tick: value.tick ?? this.tick,
      power_profile: this.powerProfile,
      resource_budget: this.resourceBudget,
      minimum_reality: minimum,
      demands,
      faults
    });
    const verification = verifyRealityLoadSheddingPlan(plan);
    fail(verification.valid, `URRF_RESOURCE_GOVERNOR_PLAN_INVALID:${verification.errors.join(',')}`);
    this.plans.set(plan.plan_root, plan);
    return clone(plan);
  }

  getPlan(planRoot) {
    return clone(this.plans.get(String(planRoot)) ?? null);
  }

  getDecision(candidateId, plan = null) {
    const selected = plan ?? [...this.plans.values()].at(-1);
    if (!selected) return null;
    const verification = verifyRealityLoadSheddingPlan(selected);
    fail(verification.valid, `URRF_RESOURCE_GOVERNOR_PLAN_INVALID:${verification.errors.join(',')}`);
    return clone(selected.decisions.find(decision => decision.candidate_id === String(candidateId)) ?? null);
  }

  admit(candidateId, plan = null) {
    const decision = this.getDecision(candidateId, plan);
    fail(decision, 'URRF_RESOURCE_GOVERNOR_CANDIDATE_NOT_FOUND');
    return {
      candidate_id: decision.candidate_id,
      admitted: decision.admitted,
      action: decision.action,
      preserves_world_truth: decision.preserves_world_truth,
      canonical_write_authorized: false,
      candidate_only: true
    };
  }

  recoverMinimumReality(input = {}) {
    const value = record(input);
    const activeFaultRoots = [...this.faults.values()].filter(fault => fault.status !== 'RECOVERED').map(fault => fault.fault_root);
    return this.registerMinimumReality({...value, fault_roots: value.fault_roots ?? value.faultRoots ?? activeFaultRoots});
  }

  advance(ticks = 1) {
    const delta = Number(ticks);
    fail(Number.isSafeInteger(delta) && delta >= 0, 'URRF_RESOURCE_GOVERNOR_ADVANCE_INVALID');
    this.tick += delta;
    return this.tick;
  }

  snapshot() {
    const base = {
      format: URRF_RESOURCE_GOVERNOR_FORMAT,
      version: URRF_RESOURCE_GOVERNOR_VERSION,
      node_id: this.nodeId,
      tick: this.tick,
      power_profile_root: this.powerProfile?.power_root ?? null,
      power_mode: this.powerProfile?.power_mode ?? null,
      resource_budget_root: this.resourceBudget?.budget_root ?? null,
      resource_budget_mode: this.resourceBudget?.budget_mode ?? null,
      minimum_reality_root: this.minimumReality?.minimum_reality_root ?? null,
      demands: [...this.demands.values()].sort((a, b) => keySort(a.candidate_id, b.candidate_id)).map(demand => ({candidate_id: demand.candidate_id, demand_root: demand.demand_root, candidate_kind: demand.candidate_kind})),
      faults: [...this.faults.values()].sort((a, b) => keySort(a.fault_id, b.fault_id)).map(fault => ({fault_id: fault.fault_id, fault_root: fault.fault_root, status: fault.status})),
      plans: [...this.plans.values()].sort((a, b) => keySort(a.plan_root, b.plan_root)).map(plan => ({plan_id: plan.plan_id, plan_root: plan.plan_root, load_shedding_level: plan.load_shedding_level})),
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    };
    return {...base, governor_root: rootHash(base)};
  }

  verify() {
    fail(this.powerProfile && verifyRealityPowerProfile(this.powerProfile).valid, 'URRF_RESOURCE_GOVERNOR_POWER_PROFILE_VERIFY_FAILED');
    fail(this.resourceBudget && verifyRealityResourceBudget(this.resourceBudget).valid, 'URRF_RESOURCE_GOVERNOR_RESOURCE_BUDGET_VERIFY_FAILED');
    if (this.minimumReality) fail(verifyMinimumViableReality(this.minimumReality).valid, 'URRF_RESOURCE_GOVERNOR_MINIMUM_REALITY_VERIFY_FAILED');
    for (const demand of this.demands.values()) fail(verifyRealityResourceDemand(demand).valid, 'URRF_RESOURCE_GOVERNOR_DEMAND_VERIFY_FAILED');
    for (const fault of this.faults.values()) fail(verifyRealityFault(fault).valid, 'URRF_RESOURCE_GOVERNOR_FAULT_VERIFY_FAILED');
    for (const plan of this.plans.values()) fail(verifyRealityLoadSheddingPlan(plan).valid, 'URRF_RESOURCE_GOVERNOR_PLAN_VERIFY_FAILED');
    return this.snapshot();
  }
}

export function createRealityResourceGovernor(options = {}) {
  return new RealityResourceGovernor(options);
}
