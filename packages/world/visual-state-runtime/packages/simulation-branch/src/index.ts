import { cryptographicHash, deepClone, type VSRValue } from '../../spec/src/index.js';
import {
  DeterministicSimulationWorld,
  snapshotToCausalDelta,
  type CollisionEvent,
  type RFECausalDelta,
  type RuntimeBody,
  type SimulationCommand,
  type SimulationSnapshot,
} from '../../simulation-core/src/index.js';

export const VSR_SIMULATION_BRANCH_VERSION = '0.1.0-alpha.12';

export interface VSRSimulationBranchPlan {
  format: 'vsr.simulation-branch-plan.v0.1';
  branchId: string;
  label: string;
  createdBy: string;
  logicalTime: number;
  baseRealityRoot: string;
  steps: number;
  commands: SimulationCommand[];
  tags?: string[];
  metadata?: Record<string, VSRValue>;
}

export interface VSRSimulationBranchMetrics {
  changedBodyCount: number;
  dynamicBodyCount: number;
  awakeBodyCount: number;
  totalDisplacement: number;
  maxSpeed: number;
  collisionBeginCount: number;
  collisionPersistCount: number;
  collisionEndCount: number;
  finalContactCount: number;
  riskScore: number;
}

export interface VSRSimulationBranchResult {
  format: 'vsr.simulation-branch-result.v0.1';
  runtime: 'vsr@0.1.0-alpha.12';
  branchId: string;
  label: string;
  createdBy: string;
  logicalTime: number;
  baseRealityRoot: string;
  baseSimulationRoot: string;
  baseTick: number;
  finalTick: number;
  steps: number;
  tags: string[];
  metadata: Record<string, VSRValue>;
  commandRoot: string;
  eventRoot: string;
  finalSnapshot: SimulationSnapshot;
  causalDelta: RFECausalDelta;
  metrics: VSRSimulationBranchMetrics;
  branchRoot: string;
}

export interface VSRSimulationBodyDifference {
  bodyId: string;
  positionDelta: { x: number; y: number };
  velocityDelta: { x: number; y: number };
  awakeChanged: boolean;
}

export interface VSRSimulationBranchComparison {
  format: 'vsr.simulation-branch-comparison.v0.1';
  leftBranchId: string;
  rightBranchId: string;
  leftBranchRoot: string;
  rightBranchRoot: string;
  sameBaseSimulationRoot: boolean;
  bodyDifferences: VSRSimulationBodyDifference[];
  eventRootEqual: boolean;
  causalDeltaEqual: boolean;
  riskDelta: number;
  comparisonRoot: string;
}

export interface VSRSimulationBranchSet {
  format: 'vsr.simulation-branch-set.v0.1';
  runtime: 'vsr@0.1.0-alpha.12';
  baseSimulationRoot: string;
  baseTick: number;
  branchCount: number;
  branches: VSRSimulationBranchResult[];
  comparisons: VSRSimulationBranchComparison[];
  setRoot: string;
}

export interface VSRSimulationBranchSelection {
  format: 'vsr.simulation-branch-selection.v0.1';
  provisional: true;
  selectedBranchId: string;
  selectedBranchRoot: string;
  selectedCausalDeltaRoot: string;
  rejectedBranchRoots: string[];
  selectedBy: string;
  logicalTime: number;
  reason?: string;
  selectionRoot: string;
}

function validatePlan(base: SimulationSnapshot, plan: VSRSimulationBranchPlan): void {
  if (plan.format !== 'vsr.simulation-branch-plan.v0.1') throw new Error('不支持的模拟分支计划格式。');
  if (!plan.branchId || !plan.label || !plan.createdBy) throw new Error('模拟分支必须包含 branchId、label 与 createdBy。');
  if (!Number.isInteger(plan.steps) || plan.steps < 0) throw new Error('模拟分支 steps 必须是非负整数。');
  if (!Number.isFinite(plan.logicalTime) || plan.logicalTime < 0) throw new Error('模拟分支 logicalTime 无效。');
  if (!plan.baseRealityRoot) throw new Error('模拟分支必须绑定 baseRealityRoot。');
  const ids = new Set<string>();
  for (const command of plan.commands) {
    if (!command.id || ids.has(command.id)) throw new Error(`模拟命令 id 无效或重复：${command.id}`);
    ids.add(command.id);
    if (command.tick < base.tick || command.tick >= base.tick + plan.steps) {
      throw new Error(`模拟命令 ${command.id} 的 tick ${command.tick} 不在分支执行区间内。`);
    }
  }
}

function bodyMap(bodies: RuntimeBody[]): Map<string, RuntimeBody> {
  return new Map(bodies.map(body => [body.id, body]));
}

function calculateMetrics(base: SimulationSnapshot, finalSnapshot: SimulationSnapshot, allEvents: CollisionEvent[]): VSRSimulationBranchMetrics {
  const before = bodyMap(base.bodies);
  let changedBodyCount = 0;
  let totalDisplacement = 0;
  let maxSpeed = 0;
  let dynamicBodyCount = 0;
  let awakeBodyCount = 0;
  for (const body of finalSnapshot.bodies) {
    const original = before.get(body.id);
    if (body.kind === 'dynamic') dynamicBodyCount++;
    if (body.awake) awakeBodyCount++;
    maxSpeed = Math.max(maxSpeed, Math.abs(body.velocity.x) + Math.abs(body.velocity.y));
    if (!original) continue;
    const displacement = Math.abs(body.position.x - original.position.x) + Math.abs(body.position.y - original.position.y);
    totalDisplacement += displacement;
    if (displacement > 0 || body.velocity.x !== original.velocity.x || body.velocity.y !== original.velocity.y || body.awake !== original.awake) changedBodyCount++;
  }
  const collisionBeginCount = allEvents.filter(event => event.phase === 'begin').length;
  const collisionPersistCount = allEvents.filter(event => event.phase === 'persist').length;
  const collisionEndCount = allEvents.filter(event => event.phase === 'end').length;
  const speedComponent = Math.min(400, Math.trunc(maxSpeed / Math.max(1, finalSnapshot.scale * 2)));
  const displacementComponent = Math.min(250, Math.trunc(totalDisplacement / Math.max(1, finalSnapshot.scale * 4)));
  const collisionComponent = Math.min(300, collisionBeginCount * 100 + finalSnapshot.contacts.length * 20);
  const awakeComponent = Math.min(50, awakeBodyCount * 5);
  return {
    changedBodyCount,
    dynamicBodyCount,
    awakeBodyCount,
    totalDisplacement,
    maxSpeed,
    collisionBeginCount,
    collisionPersistCount,
    collisionEndCount,
    finalContactCount: finalSnapshot.contacts.length,
    riskScore: Math.min(1000, speedComponent + displacementComponent + collisionComponent + awakeComponent),
  };
}

export function simulateBranch(base: SimulationSnapshot, plan: VSRSimulationBranchPlan): VSRSimulationBranchResult {
  validatePlan(base, plan);
  const world = DeterministicSimulationWorld.fromSnapshot(base);
  const commandsByTick = new Map<number, SimulationCommand[]>();
  for (const command of plan.commands) {
    const list = commandsByTick.get(command.tick) ?? [];
    list.push(deepClone(command));
    commandsByTick.set(command.tick, list);
  }
  const allEvents: CollisionEvent[] = [];
  for (let step = 0; step < plan.steps; step++) {
    const result = world.step(commandsByTick.get(world.tick) ?? []);
    allEvents.push(...result.events);
  }
  const finalSnapshot = world.snapshot();
  const causalDelta = snapshotToCausalDelta(finalSnapshot, plan.baseRealityRoot);
  const commandRoot = cryptographicHash([...plan.commands].sort((a, b) => a.id.localeCompare(b.id)));
  const eventRoot = cryptographicHash(allEvents);
  const metrics = calculateMetrics(base, finalSnapshot, allEvents);
  const baseResult = {
    format: 'vsr.simulation-branch-result.v0.1' as const,
    runtime: 'vsr@0.1.0-alpha.12' as const,
    branchId: plan.branchId,
    label: plan.label,
    createdBy: plan.createdBy,
    logicalTime: plan.logicalTime,
    baseRealityRoot: plan.baseRealityRoot,
    baseSimulationRoot: base.stateRoot,
    baseTick: base.tick,
    finalTick: finalSnapshot.tick,
    steps: plan.steps,
    tags: [...new Set(plan.tags ?? [])].sort(),
    metadata: deepClone(plan.metadata ?? {}),
    commandRoot,
    eventRoot,
    finalSnapshot,
    causalDelta,
    metrics,
  };
  return { ...baseResult, branchRoot: cryptographicHash(baseResult) };
}

export function compareSimulationBranches(left: VSRSimulationBranchResult, right: VSRSimulationBranchResult): VSRSimulationBranchComparison {
  const rightBodies = bodyMap(right.finalSnapshot.bodies);
  const bodyDifferences: VSRSimulationBodyDifference[] = [];
  for (const leftBody of left.finalSnapshot.bodies) {
    const rightBody = rightBodies.get(leftBody.id);
    if (!rightBody) continue;
    const difference: VSRSimulationBodyDifference = {
      bodyId: leftBody.id,
      positionDelta: { x: rightBody.position.x - leftBody.position.x, y: rightBody.position.y - leftBody.position.y },
      velocityDelta: { x: rightBody.velocity.x - leftBody.velocity.x, y: rightBody.velocity.y - leftBody.velocity.y },
      awakeChanged: leftBody.awake !== rightBody.awake,
    };
    if (difference.positionDelta.x || difference.positionDelta.y || difference.velocityDelta.x || difference.velocityDelta.y || difference.awakeChanged) bodyDifferences.push(difference);
  }
  const base = {
    format: 'vsr.simulation-branch-comparison.v0.1' as const,
    leftBranchId: left.branchId,
    rightBranchId: right.branchId,
    leftBranchRoot: left.branchRoot,
    rightBranchRoot: right.branchRoot,
    sameBaseSimulationRoot: left.baseSimulationRoot === right.baseSimulationRoot,
    bodyDifferences,
    eventRootEqual: left.eventRoot === right.eventRoot,
    causalDeltaEqual: left.causalDelta.deltaRoot === right.causalDelta.deltaRoot,
    riskDelta: right.metrics.riskScore - left.metrics.riskScore,
  };
  return { ...base, comparisonRoot: cryptographicHash(base) };
}

export function simulateBranchSet(base: SimulationSnapshot, plans: VSRSimulationBranchPlan[]): VSRSimulationBranchSet {
  const ids = new Set<string>();
  const branches = [...plans].sort((a, b) => a.branchId.localeCompare(b.branchId)).map(plan => {
    if (ids.has(plan.branchId)) throw new Error(`模拟分支 id 重复：${plan.branchId}`);
    ids.add(plan.branchId);
    return simulateBranch(base, plan);
  });
  const comparisons: VSRSimulationBranchComparison[] = [];
  for (let left = 0; left < branches.length; left++) {
    for (let right = left + 1; right < branches.length; right++) comparisons.push(compareSimulationBranches(branches[left]!, branches[right]!));
  }
  const baseSet = {
    format: 'vsr.simulation-branch-set.v0.1' as const,
    runtime: 'vsr@0.1.0-alpha.12' as const,
    baseSimulationRoot: base.stateRoot,
    baseTick: base.tick,
    branchCount: branches.length,
    branches,
    comparisons,
  };
  return { ...baseSet, setRoot: cryptographicHash(baseSet) };
}

export function selectSimulationBranch(set: VSRSimulationBranchSet, branchId: string, selectedBy: string, logicalTime: number, reason?: string): VSRSimulationBranchSelection {
  const selected = set.branches.find(branch => branch.branchId === branchId);
  if (!selected) throw new Error(`模拟分支不存在：${branchId}`);
  const base = {
    format: 'vsr.simulation-branch-selection.v0.1' as const,
    provisional: true as const,
    selectedBranchId: selected.branchId,
    selectedBranchRoot: selected.branchRoot,
    selectedCausalDeltaRoot: selected.causalDelta.deltaRoot,
    rejectedBranchRoots: set.branches.filter(branch => branch.branchId !== branchId).map(branch => branch.branchRoot).sort(),
    selectedBy,
    logicalTime,
    ...(reason ? { reason } : {}),
  };
  return { ...base, selectionRoot: cryptographicHash(base) };
}

export function verifySimulationBranchSet(set: VSRSimulationBranchSet): { ok: boolean; errors: string[]; recomputedRoot: string } {
  const errors: string[] = [];
  if (set.format !== 'vsr.simulation-branch-set.v0.1') errors.push('分支集合格式无效。');
  for (const branch of set.branches) {
    const { branchRoot: _branchRoot, ...base } = branch;
    if (cryptographicHash(base) !== branch.branchRoot) errors.push(`分支根不匹配：${branch.branchId}`);
    if (branch.baseSimulationRoot !== set.baseSimulationRoot) errors.push(`分支基础状态不一致：${branch.branchId}`);
    if (branch.causalDelta.simulationRoot !== branch.finalSnapshot.stateRoot) errors.push(`CausalDelta 未绑定最终快照：${branch.branchId}`);
  }
  for (const comparison of set.comparisons) {
    const { comparisonRoot: _comparisonRoot, ...base } = comparison;
    if (cryptographicHash(base) !== comparison.comparisonRoot) errors.push(`比较根不匹配：${comparison.leftBranchId}/${comparison.rightBranchId}`);
  }
  const { setRoot: _setRoot, ...baseSet } = set;
  const recomputedRoot = cryptographicHash(baseSet);
  if (recomputedRoot !== set.setRoot) errors.push('分支集合根不匹配。');
  return { ok: errors.length === 0, errors, recomputedRoot };
}
