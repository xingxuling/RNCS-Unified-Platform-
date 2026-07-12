#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  simulateBranch,
  compareBranches,
  explainRecommendation,
  createExecutionPlan,
  executePlan,
  createMergeProposal,
  createAuthorityRequest,
  issueAuthorityDecision,
  createTransitionDraft,
  rebaseWorkspace,
  validateWorkspace,
  createStudioProjection,
} from './index.mjs';

const args = process.argv.slice(2);
const command = args.shift() ?? 'demo';
const read = file => JSON.parse(fs.readFileSync(file instanceof URL ? file : path.resolve(file), 'utf8'));
const write = value => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);

async function runDemo() {
  const workspace = read(new URL('../examples/strategy-workspace.v0.2.json', import.meta.url));
  const simulations = workspace.branches.map(branch => simulateBranch(workspace, branch.branch_id));
  const comparison = compareBranches(workspace, simulations);
  const selected = simulations.find(item => item.branch_id === comparison.recommended_branch_id);
  const plan = createExecutionPlan(workspace, selected);
  const execution = await executePlan(workspace.base_state, plan);
  const proposal = createMergeProposal(workspace, comparison, comparison.recommended_branch_id, {execution_receipt: execution.receipt});
  const request = createAuthorityRequest(proposal);
  const decision = issueAuthorityDecision(request, {decision: 'approved', authority_actor: 'authority:demo'});
  write({workspace_validation: validateWorkspace(workspace), simulations, comparison, explanation: explainRecommendation(comparison), plan, execution_receipt: execution.receipt, proposal, authority_request: request, authority_decision: decision, transition: createTransitionDraft(workspace, proposal, {authority_decision: decision}), studio_projection: createStudioProjection(workspace, comparison)});
}

if (command === 'demo') await runDemo();
else if (command === 'validate') write(validateWorkspace(read(args[0])));
else if (command === 'simulate') write(simulateBranch(read(args[0]), args[1]));
else if (command === 'compare') write(compareBranches(read(args[0])));
else if (command === 'execute') {
  const workspace = read(args[0]);
  const simulation = simulateBranch(workspace, args[1]);
  const plan = createExecutionPlan(workspace, simulation);
  write(await executePlan(workspace.base_state, plan));
} else if (command === 'rebase') {
  const workspace = read(args[0]);
  const next = read(args[1]);
  write(rebaseWorkspace(workspace, next));
} else {
  console.error('Usage: reality-branch demo | validate <workspace> | simulate <workspace> <branch> | compare <workspace> | execute <workspace> <branch> | rebase <workspace> <next-base.json>');
  process.exitCode = 2;
}
