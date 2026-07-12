import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateBranch, compareBranches, createExecutionPlan, verifyExecutionPlan, executePlan, verifyExecutionReceipt, createMergeProposal, verifyMergeProposal, createAuthorityRequest, issueAuthorityDecision, verifyAuthorityDecision, applyMergeProposal, createTransitionDraft, createRfeCommitReceipt, createStudioProjection} from '../src/index.mjs';
import {workspace} from './fixture.mjs';

function selectedFlow() {
  const w = workspace();
  const c = compareBranches(w);
  const s = simulateBranch(w, c.recommended_branch_id);
  const p = createExecutionPlan(w, s);
  return {w, c, s, p};
}

test('execution plan is sealed', () => assert.equal(verifyExecutionPlan(selectedFlow().p), true));
test('execution plan contains expected operation count', () => { const {p} = selectedFlow(); assert.ok(p.steps.length >= 2); });
test('sandbox execution completes', async () => { const {w, p} = selectedFlow(); const r = await executePlan(w.base_state, p); assert.equal(r.receipt.status, 'completed'); assert.equal(r.receipt.final_state_root, p.expected_final_state_root); });
test('execution receipt is sealed', async () => { const {w, p} = selectedFlow(); const r = await executePlan(w.base_state, p); assert.equal(verifyExecutionReceipt(r.receipt), true); });
test('provider evidence is captured', async () => { const {w, p} = selectedFlow(); const providers = {'project.update': async () => ({ok: true, evidence: [{kind: 'provider', root: 'd'.repeat(64)}]}), 'test.run': async () => ({ok: true})}; const r = await executePlan(w.base_state, p, {providers}); assert.ok(r.receipt.step_receipts.some(x => x.provider_evidence.length)); });
test('provider rejection rolls back state', async () => { const {w, p} = selectedFlow(); const capability = p.steps[0].capability_id; const r = await executePlan(w.base_state, p, {providers: {[capability]: async () => ({ok: false, code: 'NO'})}}); assert.equal(r.receipt.status, 'rolled_back'); assert.deepEqual(r.state, w.base_state); });
test('injected failure rolls back state', async () => { const {w, p} = selectedFlow(); const r = await executePlan(w.base_state, p, {failAtStep: p.steps[1].step_id}); assert.equal(r.receipt.status, 'rolled_back'); assert.deepEqual(r.state, w.base_state); });
test('wrong execution base is rejected', async () => { const {p} = selectedFlow(); await assert.rejects(() => executePlan({x: 1}, p), /RBF_EXECUTION_BASE_MISMATCH/); });
test('merge proposal binds successful execution receipt', async () => { const {w, c, p} = selectedFlow(); const e = await executePlan(w.base_state, p); const m = createMergeProposal(w, c, c.recommended_branch_id, {execution_receipt: e.receipt}); assert.equal(verifyMergeProposal(m), true); assert.equal(m.execution_receipt_root, e.receipt.receipt_root); });
test('rolled back execution cannot bind proposal', async () => { const {w, c, p} = selectedFlow(); const e = await executePlan(w.base_state, p, {failAtStep: p.steps[0].step_id}); assert.throws(() => createMergeProposal(w, c, c.recommended_branch_id, {execution_receipt: e.receipt}), /RBF_EXECUTION_NOT_COMPLETED/); });
test('authority request and approval are sealed', async () => { const {w, c, p} = selectedFlow(); const e = await executePlan(w.base_state, p); const m = createMergeProposal(w, c, c.recommended_branch_id, {execution_receipt: e.receipt}); const q = createAuthorityRequest(m); const d = issueAuthorityDecision(q, {decision: 'approved'}); assert.equal(verifyAuthorityDecision(d, m), true); });
test('denied authority decision is not valid approval', async () => { const {w, c, p} = selectedFlow(); const e = await executePlan(w.base_state, p); const m = createMergeProposal(w, c, c.recommended_branch_id, {execution_receipt: e.receipt}); const q = createAuthorityRequest(m); const d = issueAuthorityDecision(q, {decision: 'denied'}); assert.equal(verifyAuthorityDecision(d, m), false); });
test('merge requires authority by default', async () => { const {w, c, p} = selectedFlow(); const e = await executePlan(w.base_state, p); const m = createMergeProposal(w, c, c.recommended_branch_id, {execution_receipt: e.receipt}); assert.throws(() => applyMergeProposal(w.base_state, m, {current_generation_root: w.base.generation_root}), /RBF_AUTHORITY_REQUIRED/); });
test('approved merge produces candidate state', async () => { const {w, c, p} = selectedFlow(); const e = await executePlan(w.base_state, p); const m = createMergeProposal(w, c, c.recommended_branch_id, {execution_receipt: e.receipt}); const q = createAuthorityRequest(m); const d = issueAuthorityDecision(q, {decision: 'approved'}); const merged = applyMergeProposal(w.base_state, m, {current_generation_root: w.base.generation_root, authority_decision: d}); assert.equal(merged.state_root, m.expected_candidate_state_root); });
test('stale generation blocks merge', async () => { const {w, c, p} = selectedFlow(); const e = await executePlan(w.base_state, p); const m = createMergeProposal(w, c, c.recommended_branch_id, {execution_receipt: e.receipt, require_authority: false}); assert.throws(() => applyMergeProposal(w.base_state, m, {current_generation_root: 'c'.repeat(64)}), /RBF_STALE_BASE/); });
test('tampered proposal is rejected', async () => { const {w, c, p} = selectedFlow(); const e = await executePlan(w.base_state, p); const m = createMergeProposal(w, c, c.recommended_branch_id, {execution_receipt: e.receipt, require_authority: false}); m.operations[0].value = 1; assert.throws(() => applyMergeProposal(w.base_state, m), /RBF_PROPOSAL_TAMPERED/); });
test('transition draft binds authority and execution evidence', async () => { const {w, c, p} = selectedFlow(); const e = await executePlan(w.base_state, p); const m = createMergeProposal(w, c, c.recommended_branch_id, {execution_receipt: e.receipt}); const q = createAuthorityRequest(m); const d = issueAuthorityDecision(q, {decision: 'approved'}); const t = createTransitionDraft(w, m, {authority_decision: d}); assert.equal(t.phase, 'authorized'); assert.ok(t.evidence.items.some(x => x.kind === 'execution-receipt')); assert.ok(t.evidence.items.some(x => x.kind === 'authority-decision')); });
test('RFE commit receipt binds transition', async () => { const {w, c, p} = selectedFlow(); const e = await executePlan(w.base_state, p); const m = createMergeProposal(w, c, c.recommended_branch_id, {execution_receipt: e.receipt}); const q = createAuthorityRequest(m); const d = issueAuthorityDecision(q, {decision: 'approved'}); const t = createTransitionDraft(w, m, {authority_decision: d}); const r = createRfeCommitReceipt(t, {new_generation: 4, new_generation_root: 'e'.repeat(64)}); assert.equal(r.transition_root, t.envelope_root); });
test('Studio projection includes recommendation', () => { const w = workspace(); const c = compareBranches(w); const p = createStudioProjection(w, c); assert.equal(p.recommended_branch_id, c.recommended_branch_id); assert.equal(p.branches.length, w.branches.length); });
test('provider rollback hook is called after later failure', async () => {
  const {w, p} = selectedFlow();
  const calls = [];
  const first = p.steps[0];
  const providers = {
    [first.capability_id]: {
      execute: async () => ({ok: true, receipt: {external_id: 'x'}}),
      rollback: async ({provider_receipt}) => { calls.push(provider_receipt.external_id); return {ok: true, evidence: [{kind: 'rollback'}]}; },
    },
  };
  const result = await executePlan(w.base_state, p, {providers, failAtStep: p.steps[1].step_id});
  assert.equal(result.receipt.status, 'rolled_back');
  assert.deepEqual(calls, ['x']);
  assert.equal(result.receipt.rollback.complete, true);
});

test('missing provider rollback marks receipt incomplete', async () => {
  const {w, p} = selectedFlow();
  const first = p.steps[0];
  const providers = {[first.capability_id]: async () => ({ok: true})};
  const result = await executePlan(w.base_state, p, {providers, failAtStep: p.steps[1].step_id});
  assert.equal(result.receipt.status, 'rollback_incomplete');
  assert.equal(result.receipt.rollback.complete, false);
});
