import {performance} from 'node:perf_hooks';
import fs from 'node:fs';
import {
  simulateBranch,
  compareBranches,
  createExecutionPlan,
  executePlan,
  rebaseWorkspace,
} from '../src/index.mjs';

const workspace = JSON.parse(fs.readFileSync(new URL('../examples/strategy-workspace.v0.2.json', import.meta.url), 'utf8'));
const runs = Number(process.env.RBF_BENCH_RUNS ?? 1000);
const compareTimes = [];
const flowTimes = [];

for (let i = 0; i < runs; i++) {
  let start = performance.now();
  const simulations = workspace.branches.map(branch => simulateBranch(workspace, branch.branch_id));
  const comparison = compareBranches(workspace, simulations);
  compareTimes.push(performance.now() - start);

  start = performance.now();
  const selected = simulations.find(item => item.branch_id === comparison.recommended_branch_id);
  const plan = createExecutionPlan(workspace, selected);
  await executePlan(workspace.base_state, plan);
  const nextBase = structuredClone(workspace.base_state);
  nextBase.project.new_observation = i;
  rebaseWorkspace(workspace, {new_base_state: nextBase, new_generation: 13, new_generation_root: 'f'.repeat(64)});
  flowTimes.push(performance.now() - start);
}

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min_ms: sorted[0],
    median_ms: sorted[Math.floor(sorted.length * 0.5)],
    p95_ms: sorted[Math.floor(sorted.length * 0.95)],
    max_ms: sorted.at(-1),
  };
}

console.log(JSON.stringify({
  node: process.version,
  platform: `${process.platform}-${process.arch}`,
  runs,
  branch_count: workspace.branches.length,
  scenario_count: workspace.scenarios.length,
  simulation_and_comparison: stats(compareTimes),
  execution_and_clean_rebase: stats(flowTimes),
}, null, 2));
