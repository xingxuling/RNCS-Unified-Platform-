import fs from 'node:fs';
import {
  simulateBranch, compareBranches, explainRecommendation,
  createExecutionPlan, executePlan, createMergeProposal,
  createAuthorityRequest, issueAuthorityDecision, createTransitionDraft,
  createRfeCommitReceipt, createStudioProjection, rebaseWorkspace,
} from '../src/index.mjs';

const workspace = JSON.parse(fs.readFileSync(new URL('../examples/strategy-workspace.v0.2.json', import.meta.url), 'utf8'));
const simulations = workspace.branches.map(branch => simulateBranch(workspace, branch.branch_id));
const comparison = compareBranches(workspace, simulations);
const selectedSimulation = simulations.find(item => item.branch_id === comparison.recommended_branch_id);
const plan = createExecutionPlan(workspace, selectedSimulation, {mode: 'provider-sandbox'});
const providerCalls = [];
const providers = Object.fromEntries([...new Set(plan.steps.map(step => step.capability_id))].map(capability => [capability, {
  execute: async ({step}) => { providerCalls.push(`execute:${step.step_id}`); return {ok: true, receipt: {job_id: `job:${step.step_id}`}, evidence: [{kind:'provider-execution', root:'d'.repeat(64)}]}; },
  rollback: async ({step}) => { providerCalls.push(`rollback:${step.step_id}`); return {ok: true}; },
}]));
const execution = await executePlan(workspace.base_state, plan, {providers});
const proposal = createMergeProposal(workspace, comparison, comparison.recommended_branch_id, {execution_receipt: execution.receipt});
const request = createAuthorityRequest(proposal, {risk_class:'medium'});
const decision = issueAuthorityDecision(request, {decision:'approved', authority_actor:'authority:acceptance', reason:'全部硬约束通过，沙箱执行完成'});
const transition = createTransitionDraft(workspace, proposal, {authority_decision: decision});
const commitReceipt = createRfeCommitReceipt(transition, {new_generation:13, new_generation_root:'e'.repeat(64), committed_by:'rfe:acceptance'});
const driftedBase = structuredClone(workspace.base_state);
driftedBase.project.progress = 58;
const rebase = rebaseWorkspace(workspace, {new_base_state: driftedBase, new_generation:13, new_generation_root:'f'.repeat(64)});
const output = {
  generated_at: new Date().toISOString(),
  summary: {
    branch_count: workspace.branches.length,
    scenario_count: workspace.scenarios.length,
    recommended_branch_id: comparison.recommended_branch_id,
    recommendation_stability_bps: comparison.recommendation_stability_bps,
    execution_status: execution.receipt.status,
    authority_decision: decision.decision,
    transition_phase: transition.phase,
    committed_generation: commitReceipt.new_generation,
    rebase_clean: rebase.clean,
    rebase_conflict_count: rebase.conflicts.length,
  },
  explanation: explainRecommendation(comparison),
  studio_projection: createStudioProjection(workspace, comparison),
  roots: {
    workspace_root: workspace.workspace_root,
    comparison_root: comparison.comparison_root,
    plan_root: plan.plan_root,
    execution_receipt_root: execution.receipt.receipt_root,
    proposal_root: proposal.proposal_root,
    authority_decision_root: decision.decision_root,
    transition_root: transition.envelope_root,
    rfe_commit_receipt_root: commitReceipt.commit_receipt_root,
  },
  provider_calls: providerCalls,
  simulations,
  comparison,
  execution_plan: plan,
  execution_receipt: execution.receipt,
  merge_proposal: proposal,
  authority_request: request,
  authority_decision: decision,
  transition,
  rfe_commit_receipt: commitReceipt,
  rebase_report: rebase,
};
fs.writeFileSync(new URL('../examples/acceptance-flow.v0.2.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
