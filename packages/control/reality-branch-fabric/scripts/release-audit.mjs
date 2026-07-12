import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
  validateWorkspace,
  simulateBranch,
  verifySimulation,
  compareBranches,
  createExecutionPlan,
  verifyExecutionPlan,
  executePlan,
  verifyExecutionReceipt,
  createMergeProposal,
  verifyMergeProposal,
  createAuthorityRequest,
  issueAuthorityDecision,
  verifyAuthorityDecision,
  createTransitionDraft,
  createRfeCommitReceipt,
  rebaseWorkspace,
} from '../src/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
const check = (name, pass, detail = '') => checks.push({name, pass: Boolean(pass), detail});
const required = [
  'README.md','STATUS.md','CHANGELOG.md','LICENSE','package.json',
  'src/index.mjs','src/cli.mjs','src/server.mjs','web/index.html',
  'examples/strategy-workspace.v0.2.json','examples/acceptance-flow.v0.2.json',
  'docs/架构_v0.2.md','docs/多情景仿真协议_v0.2.md','docs/执行_权威_重基线协议_v0.2.md','docs/RNCS集成_v0.2.md',
];
for (const file of required) check(`file:${file}`, fs.existsSync(path.join(root, file)));

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
check('package-version', packageJson.version === '0.2.0-alpha.1', packageJson.version);
check('node-engine', packageJson.engines?.node === '>=20', packageJson.engines?.node);

const schemas = fs.readdirSync(path.join(root, 'schemas')).filter(file => file.endsWith('.json'));
check('schema-count', schemas.length === 9, String(schemas.length));
for (const file of schemas) {
  try { JSON.parse(fs.readFileSync(path.join(root, 'schemas', file), 'utf8')); check(`schema-json:${file}`, true); }
  catch (error) { check(`schema-json:${file}`, false, error.message); }
}

const workspace = JSON.parse(fs.readFileSync(path.join(root, 'examples/strategy-workspace.v0.2.json'), 'utf8'));
const validation = validateWorkspace(workspace);
check('workspace-valid', validation.valid, validation.errors.join(','));
check('branch-tree-present', workspace.branches.some(branch => branch.parent_branch_id !== workspace.base.branch_id));
check('scenario-probability', workspace.scenarios.reduce((sum, item) => sum + item.probability_bps, 0) === 10000);

const simulations = workspace.branches.map(branch => simulateBranch(workspace, branch.branch_id));
check('simulation-count', simulations.length === workspace.branches.length);
check('simulation-seals', simulations.every(verifySimulation));
check('multi-scenario', simulations.every(item => item.scenarios.length === workspace.scenarios.length));
check('candidate-diff', simulations.every(item => Array.isArray(item.candidate_diff) && item.candidate_diff.length > 0));

const comparison = compareBranches(workspace, simulations);
check('comparison-recommendation', Boolean(comparison.recommended_branch_id), comparison.recommended_branch_id ?? '');
check('pareto-frontier', comparison.pareto_frontier.length > 0);
check('sensitivity', comparison.sensitivity.length >= 4);
check('conflict-matrix', comparison.conflict_matrix.length === 3, String(comparison.conflict_matrix.length));

const selected = simulations.find(item => item.branch_id === comparison.recommended_branch_id);
const plan = createExecutionPlan(workspace, selected);
check('execution-plan-seal', verifyExecutionPlan(plan));
const execution = await executePlan(workspace.base_state, plan);
check('execution-completed', execution.receipt.status === 'completed', execution.receipt.status);
check('execution-receipt-seal', verifyExecutionReceipt(execution.receipt));

const proposal = createMergeProposal(workspace, comparison, comparison.recommended_branch_id, {execution_receipt: execution.receipt});
check('proposal-seal', verifyMergeProposal(proposal));
check('proposal-binds-execution', proposal.execution_receipt_root === execution.receipt.receipt_root);
const request = createAuthorityRequest(proposal);
const decision = issueAuthorityDecision(request, {decision:'approved', authority_actor:'authority:audit'});
check('authority-approval', verifyAuthorityDecision(decision, proposal));
const transition = createTransitionDraft(workspace, proposal, {authority_decision: decision});
check('transition-authorized', transition.phase === 'authorized');
const commit = createRfeCommitReceipt(transition, {new_generation:13, new_generation_root:'e'.repeat(64)});
check('rfe-commit-bound', commit.transition_root === transition.envelope_root);

const drifted = structuredClone(workspace.base_state);
drifted.project.progress = 58;
const rebase = rebaseWorkspace(workspace, {new_base_state:drifted,new_generation:13,new_generation_root:'f'.repeat(64)});
check('rebase-conflict-detected', !rebase.clean && rebase.conflicts.length > 0, String(rebase.conflicts.length));

const sourceText = fs.readdirSync(path.join(root,'src')).filter(file=>file.endsWith('.mjs')).map(file=>fs.readFileSync(path.join(root,'src',file),'utf8')).join('\n');
const webText = fs.readFileSync(path.join(root,'web','index.html'),'utf8');
check('no-eval-source', !/\beval\s*\(|new\s+Function\s*\(/.test(sourceText));
check('no-remote-web-dependency', !/<script[^>]+src=|<link[^>]+href=["']https?:/i.test(webText));
check('web-version', webText.includes('v0.2.0-alpha.1'));
check('web-chinese', webText.includes('候选现实执行工作台'));

const cli = spawnSync(process.execPath, [path.join(root,'src','cli.mjs'),'validate',path.join(root,'examples','strategy-workspace.v0.2.json')], {encoding:'utf8'});
check('cli-validate-exit', cli.status === 0, cli.stderr.trim());
check('cli-validate-result', cli.stdout.includes('"valid": true'));

const failed = checks.filter(item => !item.pass);
const report = {format:'reality-branch.release-audit.v0.2',version:'0.2.0-alpha.1',checks:checks.length,passed:checks.length-failed.length,failed:failed.length,status:failed.length?'FAIL':'PASS',results:checks};
console.log(JSON.stringify(report,null,2));
if (failed.length) process.exitCode = 1;
