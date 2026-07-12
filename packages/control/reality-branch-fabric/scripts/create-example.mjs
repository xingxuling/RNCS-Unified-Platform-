import fs from 'node:fs';
import {createWorkspace} from '../src/index.mjs';

const branches = [
  {
    branch_id: 'branch:safe',
    parent_branch_id: 'branch:main',
    label: '稳健推进',
    hypothesis: '优先稳定性和可回滚性',
    assumptions: [{claim: '现有团队容量稳定', uncertainty: 300}],
    operations: [
      {operation_id: 'op:safe-progress', op: 'set', path: 'project.progress', value: 72, capability_id: 'project.update', impact: {benefit: 4800, cost: 1500, risk: 900, duration: 2600}},
      {operation_id: 'op:safe-tests', op: 'increment', path: 'project.tests', value: 24, capability_id: 'test.run', impact: {benefit: 1800, cost: 500, risk: -200, confidence_delta: 900, duration: 900}},
    ],
    constraints: {max_risk: 4200, min_confidence: 5000, max_cost: 5000},
    invariants: [{path: 'project.tests', operator: 'gte', value: 24, code: 'TESTS_REQUIRED'}],
    predicted_metrics: {confidence: 1500},
    tags: ['stable', 'reversible'],
  },
  {
    branch_id: 'branch:fast',
    parent_branch_id: 'branch:main',
    label: '快速推进',
    hypothesis: '接受更高风险换取更快交付',
    assumptions: [{claim: '外部依赖按时到位', uncertainty: 1000}],
    operations: [
      {operation_id: 'op:fast-progress', op: 'set', path: 'project.progress', value: 96, capability_id: 'project.update', reversible: false, impact: {benefit: 8200, cost: 4700, risk: 5000, duration: 900}},
      {operation_id: 'op:fast-mode', op: 'set', path: 'project.release_mode', value: 'fast', capability_id: 'release.configure', impact: {benefit: 500, cost: 200, risk: 1000, duration: 100}},
    ],
    constraints: {max_risk: 8500, min_confidence: 3000, max_cost: 8500},
    invariants: [{path: 'project.progress', operator: 'gte', value: 90, code: 'FAST_TARGET_REQUIRED'}],
    predicted_metrics: {confidence: 500},
    tags: ['speed'],
  },
  {
    branch_id: 'branch:fast-cache',
    parent_branch_id: 'branch:fast',
    label: '快速推进＋缓存保护',
    hypothesis: '在快速方案上增加缓存和回滚保护',
    assumptions: [{claim: '缓存策略能降低失败成本', uncertainty: 350}],
    operations: [
      {operation_id: 'op:cache-enable', op: 'set', path: 'project.cache.enabled', value: true, capability_id: 'cache.configure', impact: {benefit: 900, cost: 800, risk: -1400, confidence_delta: 800, duration: 500}},
      {operation_id: 'op:snapshot', op: 'append', path: 'project.snapshots', value: 'pre-release', capability_id: 'snapshot.create', impact: {benefit: 400, cost: 300, risk: -700, confidence_delta: 500, duration: 300}},
    ],
    constraints: {max_risk: 7200, min_confidence: 4000},
    invariants: [{path: 'project.cache.enabled', operator: 'equals', value: true, code: 'CACHE_MUST_BE_ENABLED'}],
    predicted_metrics: {confidence: 700},
    tags: ['speed', 'resilient'],
  },
];

const workspace = createWorkspace({
  reality_id: 'reality:rncs-demo',
  base_generation: 12,
  base_generation_root: 'a'.repeat(64),
  base_branch_id: 'branch:main',
  project_root: 'b'.repeat(64),
  base_state: {project: {progress: 50, tests: 0, release_mode: 'stable', cache: {enabled: false}, snapshots: []}},
  branches,
  metadata: {title: 'RNCS项目推进候选现实'},
});

fs.writeFileSync(new URL('../examples/strategy-workspace.v0.2.json', import.meta.url), `${JSON.stringify(workspace, null, 2)}\n`);
