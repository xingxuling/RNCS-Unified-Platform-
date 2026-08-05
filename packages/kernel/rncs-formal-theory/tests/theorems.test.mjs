import assert from 'node:assert/strict';
import test from 'node:test';
import {
  actionsIndependent,
  advanceBranch,
  applyAuthorizedTransition,
  applyDeltaOrQuarantine,
  applyDeterministicPatch,
  canonicalJson,
  compileProjection,
  createAction,
  createAuthorityDecision,
  createClosureCertificate,
  createMetaState,
  createRealityState,
  deterministicReplay,
  evolveMetaState,
  forkReality,
  semanticRoot,
  verifyBranchIsolation,
  verifyClosureCertificate,
  verifyIdentityContinuity,
  verifyIndependentConfluence,
  verifyLevel5Composition,
  verifyRealityState,
  rollbackBranch,
} from '../src/index.mjs';

const authorityRoot = semanticRoot({ authority: 'rfe', epoch: 7 });
const subjectRoot = semanticRoot({ subject: 'subject:founder', identity: 'continuous' });

const base = () => createRealityState({
  generation: 7,
  authority_root: authorityRoot,
  subject_root: subjectRoot,
  payload: { world: { energy: 10, mode: 'stable' }, ui: { theme: 'dark' } },
  evidence: [{ kind: 'genesis', id: 'e:0' }],
});

const action = (overrides = {}) => createAction({
  action_id: overrides.action_id ?? 'action:energy:raise',
  subject_id: 'subject:founder',
  capability: overrides.capability ?? 'world.energy.set',
  required_scopes: overrides.required_scopes ?? ['world.write'],
  reads: overrides.reads ?? ['world.energy'],
  writes: overrides.writes ?? ['world.energy'],
  reversible: overrides.reversible ?? true,
  risk: overrides.risk ?? 'medium',
  intent: overrides.intent ?? { target: 12 },
});

const approve = (candidate) => createAuthorityDecision({
  decision_id: `decision:${candidate.action_id}`,
  proposal_root: candidate.proposal_root,
  subject_id: candidate.subject_id,
  scopes: ['world.write', 'ui.write', 'law.write'],
  status: 'approved',
  authority_epoch: 7,
  evidence: [{ kind: 'quorum', weight: 1 }],
});

const invariants = [{ id: 'energy-nonnegative', check: (state) => state.payload.world.energy >= 0 }];

test('T1.1 canonical semantic identity ignores object key order', () => {
  assert.equal(canonicalJson({ b: 2, a: 1 }), canonicalJson({ a: 1, b: 2 }));
  assert.equal(semanticRoot({ b: 2, a: 1 }), semanticRoot({ a: 1, b: 2 }));
});

test('T1.2 valid state has a reproducible root and nonnegative generation', () => {
  const state = base();
  assert.equal(verifyRealityState(state).valid, true);
  assert.equal(state.generation, 7);
});

test('T2.1 denied authority cannot create a formal transition', () => {
  const candidate = action();
  const denied = createAuthorityDecision({
    decision_id: 'decision:denied',
    proposal_root: candidate.proposal_root,
    subject_id: candidate.subject_id,
    scopes: ['world.write'],
    status: 'denied',
  });
  assert.throws(() => applyAuthorizedTransition({
    state: base(),
    action: candidate,
    decision: denied,
    next_payload: { world: { energy: 12 } },
  }), /UNAUTHORIZED_TRANSITION/);
});

test('T2.2 authorized transition advances exactly one generation and preserves invariants', () => {
  const candidate = action();
  const result = applyAuthorizedTransition({
    state: base(),
    action: candidate,
    decision: approve(candidate),
    next_payload: { world: { energy: 12, mode: 'stable' }, ui: { theme: 'dark' } },
    invariants,
  });
  assert.equal(result.state.generation, 8);
  assert.equal(result.receipt.generation_delta, 1);
  assert.equal(result.receipt.passed, true);
});

test('T3.1 candidate branch changes do not mutate authoritative state', () => {
  const authoritative = base();
  const candidate = action();
  let branch = forkReality(authoritative, 'branch:safe');
  branch = advanceBranch(branch, applyDeterministicPatch(branch.head, candidate, approve(candidate), { 'world.energy': 12 }, invariants));
  const receipt = verifyBranchIsolation(authoritative, branch);
  assert.equal(receipt.passed, true);
  assert.equal(authoritative.payload.world.energy, 10);
  assert.equal(branch.head.payload.world.energy, 12);
});

test('T3.2 rollback restores the exact branch base root', () => {
  const authoritative = base();
  const candidate = action();
  let branch = forkReality(authoritative, 'branch:rollback');
  branch = advanceBranch(branch, applyDeterministicPatch(branch.head, candidate, approve(candidate), { 'world.energy': 13 }, invariants));
  const rollback = rollbackBranch(branch);
  assert.equal(rollback.receipt.passed, true);
  assert.equal(rollback.state.state_root, authoritative.state_root);
});

test('T3.3 independent deterministic patches are confluent at the payload level', () => {
  const left = action({ action_id: 'action:energy', reads: ['world.energy'], writes: ['world.energy'] });
  const right = action({ action_id: 'action:theme', capability: 'ui.theme.set', required_scopes: ['ui.write'], reads: ['ui.theme'], writes: ['ui.theme'] });
  assert.equal(actionsIndependent(left, right), true);
  const receipt = verifyIndependentConfluence({
    state: base(),
    left,
    right,
    leftDecision: approve(left),
    rightDecision: approve(right),
    leftPatch: { 'world.energy': 12 },
    rightPatch: { 'ui.theme': 'light' },
  });
  assert.equal(receipt.passed, true);
});

test('T4.1 replicas replaying the same ordered event set converge', () => {
  const firstBase = base();
  const event1State = createRealityState({
    generation: 8,
    authority_root: authorityRoot,
    subject_root: subjectRoot,
    payload: { world: { energy: 11, mode: 'stable' }, ui: { theme: 'dark' } },
    evidence: [...firstBase.evidence, { kind: 'rncs.formal-replay-event', event_id: 'e1' }],
  });
  const events = [
    { event_id: 'e1', sequence: 1, base_state_root: firstBase.state_root, patch: { 'world.energy': 11 } },
    { event_id: 'e2', sequence: 2, base_state_root: event1State.state_root, patch: { 'ui.theme': 'light' } },
  ];
  const replicaA = deterministicReplay(firstBase, events).state;
  const replicaB = deterministicReplay(firstBase, [...events].reverse()).state;
  assert.equal(replicaA.state_root, replicaB.state_root);
});

test('T4.2 stale delta is quarantined and cannot mutate authority state', () => {
  const state = base();
  const result = applyDeltaOrQuarantine(state, {
    delta_id: 'delta:stale',
    base_state_root: '0'.repeat(64),
    patch: { 'world.energy': 999 },
  });
  assert.equal(result.status, 'quarantined');
  assert.equal(result.receipt.passed, true);
  assert.equal(result.state.state_root, state.state_root);
});

test('T4.3 presentation compilation preserves authority root', () => {
  const state = base();
  const projection = compileProjection(state, (snapshot) => ({
    label: `energy:${snapshot.payload.world.energy}`,
    generation: snapshot.generation,
  }));
  assert.equal(projection.receipt.passed, true);
  assert.equal(projection.authority_state_root, state.state_root);
});

test('T5.1 bounded self-evolution changes laws and capabilities but preserves meta-invariants', () => {
  const meta0 = createMetaState({
    revision: 0,
    identity_root: subjectRoot,
    constitution_root: semanticRoot({ constitution: 'rncs-c1-c12' }),
    authority_model_root: authorityRoot,
    evidence_policy_root: semanticRoot({ append_only: true }),
    laws: ['law:authority-before-commit'],
    capabilities: ['capability:branch'],
    evidence_ledger: [{ id: 'meta:e0' }],
  });
  const evolved = evolveMetaState(meta0, {
    add_laws: ['law:presentation-cannot-authorize'],
    add_capabilities: ['capability:formal-proof-receipt'],
    evidence: { id: 'meta:e1', kind: 'verified-test-suite' },
    authority_decision: { status: 'approved' },
  });
  assert.equal(evolved.receipt.passed, true);
  assert.equal(evolved.meta.meta_invariant_root, meta0.meta_invariant_root);
  assert.equal(evolved.meta.evidence_ledger.length, 2);
});

test('T5.2 identity continuity requires one identity root and a connected revision chain', () => {
  const meta0 = createMetaState({
    identity_root: subjectRoot,
    constitution_root: semanticRoot({ c: 1 }),
    authority_model_root: authorityRoot,
    evidence_policy_root: semanticRoot({ append_only: true }),
  });
  const meta1 = evolveMetaState(meta0, {
    add_laws: ['law:new'],
    evidence: { id: 'meta:e1' },
    authority_decision: { status: 'approved' },
  }).meta;
  assert.equal(verifyIdentityContinuity([meta0, meta1]).passed, true);
  const forged = { ...meta1, identity_root: 'f'.repeat(64) };
  assert.equal(verifyIdentityContinuity([meta0, forged]).passed, false);
});

test('T5.3 every accepted workflow closes with committed or aborted evidence', () => {
  const certificate = createClosureCertificate({
    goal_root: semanticRoot({ goal: 'raise-energy' }),
    outcome: 'committed',
    final_state_root: base().state_root,
    evidence: [{ kind: 'acceptance', id: 'e:accept' }],
  });
  assert.equal(verifyClosureCertificate(certificate).passed, true);
  assert.throws(() => createClosureCertificate({
    goal_root: semanticRoot({ goal: 'pending' }),
    outcome: 'pending',
    evidence: [{ id: 'e' }],
  }), /NON_TERMINAL_OUTCOME/);
});

test('T5.4 level-five composition requires all lower-level proof receipts', () => {
  const receipt = verifyLevel5Composition({
    transition_receipt: { theorem: 'T2.2', passed: true },
    branch_receipt: { theorem: 'T3.1', passed: true },
    replay_receipt: { theorem: 'T4.1', passed: true },
    projection_receipt: { theorem: 'T4.3', passed: true },
    evolution_receipt: { theorem: 'T5.1', passed: true },
    identity_receipt: { theorem: 'T5.2', passed: true },
    closure_receipt: { theorem: 'T5.3', passed: true },
  });
  assert.equal(receipt.passed, true);
});
