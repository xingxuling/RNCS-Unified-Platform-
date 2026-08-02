import {
  applyDeterministicPatch,
  compileProjection,
  createAction,
  createAuthorityDecision,
  createClosureCertificate,
  createMetaState,
  createRealityState,
  evolveMetaState,
  forkReality,
  semanticRoot,
  verifyBranchIsolation,
  verifyClosureCertificate,
  verifyIdentityContinuity,
  verifyLevel5Composition,
} from '../src/index.mjs';

const state = createRealityState({
  generation: 4,
  authority_root: semanticRoot({ authority: 'rfe', epoch: 4 }),
  subject_root: semanticRoot({ subject: 'subject:founder' }),
  payload: { world: { stable: true, fruit: null } },
  evidence: [{ id: 'genesis' }],
});
const action = createAction({
  action_id: 'action:fruit:materialize',
  subject_id: 'subject:founder',
  capability: 'fruit.materialize',
  required_scopes: ['world.write'],
  reads: ['world.fruit'],
  writes: ['world.fruit'],
});
const decision = createAuthorityDecision({
  decision_id: 'decision:fruit:materialize',
  proposal_root: action.proposal_root,
  subject_id: action.subject_id,
  scopes: ['world.write'],
  status: 'approved',
});
const transition = applyDeterministicPatch(state, action, decision, { 'world.fruit': 'artifact:formal-theory-v0.1' });
const branch = forkReality(state, 'branch:formal-theory');
const branchReceipt = verifyBranchIsolation(state, { ...branch, head: transition.state });
const projection = compileProjection(transition.state, (snapshot) => ({ fruit: snapshot.payload.world.fruit }));
const meta0 = createMetaState({
  identity_root: state.subject_root,
  constitution_root: semanticRoot({ constitution: 'rncs' }),
  authority_model_root: state.authority_root,
  evidence_policy_root: semanticRoot({ append_only: true }),
});
const evolved = evolveMetaState(meta0, {
  add_laws: ['law:five-level-formal-theory'],
  add_capabilities: ['capability:proof-receipt'],
  evidence: { id: 'formal-theory-tests', passed: true },
  authority_decision: { status: 'approved' },
});
const closure = createClosureCertificate({
  goal_root: semanticRoot({ goal: 'formalize-rncs-level-five' }),
  outcome: 'committed',
  final_state_root: transition.state.state_root,
  evidence: [{ id: 'formal-theory-tests', passed: true }],
});
const report = verifyLevel5Composition({
  transition_receipt: transition.receipt,
  branch_receipt: branchReceipt,
  replay_receipt: { theorem: 'T4.1-deterministic-replay-convergence', passed: true },
  projection_receipt: projection.receipt,
  evolution_receipt: evolved.receipt,
  identity_receipt: verifyIdentityContinuity([meta0, evolved.meta]),
  closure_receipt: verifyClosureCertificate(closure),
});
console.log(JSON.stringify({ report, closure, final_state_root: transition.state.state_root }, null, 2));
