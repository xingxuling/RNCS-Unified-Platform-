import {createWorkspace} from '../src/index.mjs';

export const branches = [
  {
    branch_id: 'branch:safe', parent_branch_id: 'branch:main', label: '稳健', hypothesis: '稳定推进',
    assumptions: [{claim: '团队稳定', uncertainty: 200}],
    operations: [
      {operation_id: 'op:safe-progress', op: 'set', path: 'project.progress', value: 70, capability_id: 'project.update', impact: {benefit: 5000, cost: 1200, risk: 700, duration: 2200}},
      {operation_id: 'op:safe-tests', op: 'increment', path: 'project.tests', value: 24, capability_id: 'test.run', impact: {benefit: 1500, cost: 500, risk: -200, confidence_delta: 800, duration: 800}},
    ],
    constraints: {max_risk: 4000, min_confidence: 5000},
    invariants: [{path: 'project.tests', operator: 'gte', value: 24, code: 'TESTS_REQUIRED'}],
    predicted_metrics: {confidence: 1200},
  },
  {
    branch_id: 'branch:fast', parent_branch_id: 'branch:main', label: '快速', hypothesis: '速度优先',
    assumptions: [{claim: '依赖按时', uncertainty: 900}],
    operations: [
      {operation_id: 'op:fast-progress', op: 'set', path: 'project.progress', value: 95, capability_id: 'project.update', reversible: false, impact: {benefit: 8200, cost: 4500, risk: 4700, duration: 700}},
      {operation_id: 'op:fast-mode', op: 'set', path: 'project.mode', value: 'fast', capability_id: 'release.configure', impact: {benefit: 500, cost: 300, risk: 900, duration: 100}},
    ],
    constraints: {max_risk: 8500, min_confidence: 2500},
    invariants: [{path: 'project.progress', operator: 'gte', value: 90, code: 'FAST_TARGET'}],
    predicted_metrics: {confidence: 500},
  },
  {
    branch_id: 'branch:fast-cache', parent_branch_id: 'branch:fast', label: '快速缓存', hypothesis: '速度与保护',
    assumptions: [{claim: '缓存有效', uncertainty: 300}],
    operations: [
      {operation_id: 'op:cache', op: 'set', path: 'project.cache.enabled', value: true, capability_id: 'cache.configure', impact: {benefit: 800, cost: 700, risk: -1200, confidence_delta: 900, duration: 400}},
      {operation_id: 'op:snapshot', op: 'append', path: 'project.snapshots', value: 'before-release', capability_id: 'snapshot.create', impact: {benefit: 400, cost: 200, risk: -600, confidence_delta: 400, duration: 200}},
    ],
    constraints: {max_risk: 7200, min_confidence: 3500},
    invariants: [{path: 'project.cache.enabled', operator: 'equals', value: true, code: 'CACHE_REQUIRED'}],
    predicted_metrics: {confidence: 600},
  },
];

export function workspace(overrides = {}) {
  return createWorkspace({
    reality_id: 'reality:test',
    base_generation: 3,
    base_generation_root: 'a'.repeat(64),
    base_branch_id: 'branch:main',
    project_root: 'b'.repeat(64),
    base_state: {project: {progress: 50, tests: 0, mode: 'stable', cache: {enabled: false}, snapshots: []}},
    branches,
    ...overrides,
  });
}
