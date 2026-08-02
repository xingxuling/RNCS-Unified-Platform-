import { createHash } from 'node:crypto';

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function canonicalize(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('NON_FINITE_NUMBER');
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isPlainObject(value)) throw new TypeError('UNSUPPORTED_CANONICAL_VALUE');
  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right, 'en'))
      .map((key) => [key, canonicalize(value[key])]),
  );
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function semanticRoot(value) {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

export function deepClone(value) {
  return structuredClone(value);
}

export function deepEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function withoutKey(value, key) {
  const copy = { ...value };
  delete copy[key];
  return copy;
}

function assertString(value, code) {
  if (typeof value !== 'string' || value.length === 0) throw new TypeError(code);
}

function assertNonNegativeInteger(value, code) {
  if (!Number.isInteger(value) || value < 0) throw new TypeError(code);
}

function uniqueSorted(values = []) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, 'en'));
}

function statePayload(state) {
  return {
    generation: state.generation,
    authority_root: state.authority_root,
    subject_root: state.subject_root,
    payload: state.payload,
    evidence: state.evidence,
  };
}

export function createRealityState({
  generation = 0,
  authority_root,
  subject_root,
  payload = {},
  evidence = [],
}) {
  assertNonNegativeInteger(generation, 'INVALID_GENERATION');
  assertString(authority_root, 'INVALID_AUTHORITY_ROOT');
  assertString(subject_root, 'INVALID_SUBJECT_ROOT');
  if (!Array.isArray(evidence)) throw new TypeError('INVALID_EVIDENCE');
  const state = {
    format: 'rncs.formal-state.v0.1',
    generation,
    authority_root,
    subject_root,
    payload: canonicalize(payload),
    evidence: canonicalize(evidence),
  };
  state.state_root = semanticRoot(statePayload(state));
  return state;
}

export function verifyRealityState(state) {
  const errors = [];
  try {
    const normalized = createRealityState(state);
    if (normalized.state_root !== state.state_root) errors.push('STATE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(error.message);
  }
  return { valid: errors.length === 0, errors };
}

function actionPayload(action) {
  return {
    action_id: action.action_id,
    subject_id: action.subject_id,
    capability: action.capability,
    required_scopes: action.required_scopes,
    reads: action.reads,
    writes: action.writes,
    reversible: action.reversible,
    risk: action.risk,
    intent: action.intent,
  };
}

export function createAction({
  action_id,
  subject_id,
  capability,
  required_scopes = [],
  reads = [],
  writes = [],
  reversible = true,
  risk = 'low',
  intent = {},
}) {
  assertString(action_id, 'INVALID_ACTION_ID');
  assertString(subject_id, 'INVALID_SUBJECT_ID');
  assertString(capability, 'INVALID_CAPABILITY');
  const action = {
    format: 'rncs.formal-action.v0.1',
    action_id,
    subject_id,
    capability,
    required_scopes: uniqueSorted(required_scopes),
    reads: uniqueSorted(reads),
    writes: uniqueSorted(writes),
    reversible: Boolean(reversible),
    risk,
    intent: canonicalize(intent),
  };
  action.proposal_root = semanticRoot(actionPayload(action));
  return action;
}

export function createAuthorityDecision({
  decision_id,
  proposal_root,
  subject_id,
  scopes = [],
  status = 'approved',
  authority_epoch = 0,
  evidence = [],
}) {
  assertString(decision_id, 'INVALID_DECISION_ID');
  assertString(proposal_root, 'INVALID_PROPOSAL_ROOT');
  assertString(subject_id, 'INVALID_DECISION_SUBJECT');
  assertNonNegativeInteger(authority_epoch, 'INVALID_AUTHORITY_EPOCH');
  if (!['approved', 'denied'].includes(status)) throw new TypeError('INVALID_DECISION_STATUS');
  const decision = {
    format: 'rncs.formal-authority-decision.v0.1',
    decision_id,
    proposal_root,
    subject_id,
    scopes: uniqueSorted(scopes),
    status,
    authority_epoch,
    evidence: canonicalize(evidence),
  };
  decision.decision_root = semanticRoot(decision);
  return decision;
}

function containsAll(haystack, needles) {
  const values = new Set(haystack);
  return needles.every((item) => values.has(item));
}

export function verifyAuthority(action, decision) {
  const errors = [];
  if (decision.status !== 'approved') errors.push('AUTHORITY_DENIED');
  if (decision.proposal_root !== action.proposal_root) errors.push('PROPOSAL_ROOT_MISMATCH');
  if (decision.subject_id !== action.subject_id) errors.push('SUBJECT_MISMATCH');
  if (!containsAll(decision.scopes, action.required_scopes)) errors.push('MISSING_SCOPE');
  return { valid: errors.length === 0, errors };
}

export function evaluateInvariants(state, invariants = []) {
  return invariants.map((invariant) => {
    const passed = Boolean(invariant.check(state));
    return { id: invariant.id, passed };
  });
}

export function applyAuthorizedTransition({
  state,
  action,
  decision,
  next_payload,
  evidence = [],
  invariants = [],
}) {
  const stateVerification = verifyRealityState(state);
  if (!stateVerification.valid) throw new Error(`INVALID_SOURCE_STATE:${stateVerification.errors.join(',')}`);
  const authority = verifyAuthority(action, decision);
  if (!authority.valid) throw new Error(`UNAUTHORIZED_TRANSITION:${authority.errors.join(',')}`);

  const pre = evaluateInvariants(state, invariants);
  if (pre.some((item) => !item.passed)) throw new Error('SOURCE_INVARIANT_FAILED');

  const next = createRealityState({
    generation: state.generation + 1,
    authority_root: state.authority_root,
    subject_root: state.subject_root,
    payload: next_payload,
    evidence: [
      ...state.evidence,
      ...evidence,
      {
        kind: 'rncs.formal-transition',
        action_root: action.proposal_root,
        decision_root: decision.decision_root,
        from_state_root: state.state_root,
      },
    ],
  });

  const post = evaluateInvariants(next, invariants);
  if (post.some((item) => !item.passed)) throw new Error('TARGET_INVARIANT_FAILED');

  return {
    state: next,
    receipt: {
      format: 'rncs.formal-transition-receipt.v0.1',
      theorem: 'T2.2-authorized-invariant-preservation',
      action_root: action.proposal_root,
      decision_root: decision.decision_root,
      from_state_root: state.state_root,
      to_state_root: next.state_root,
      generation_delta: next.generation - state.generation,
      pre_invariants: pre,
      post_invariants: post,
      passed: true,
    },
  };
}

export function forkReality(state, branch_id) {
  assertString(branch_id, 'INVALID_BRANCH_ID');
  const base = deepClone(state);
  return {
    format: 'rncs.formal-branch.v0.1',
    branch_id,
    base_state_root: state.state_root,
    base,
    head: deepClone(base),
    receipts: [],
  };
}

export function advanceBranch(branch, transition) {
  if (branch.head.state_root !== transition.receipt.from_state_root) throw new Error('BRANCH_HEAD_MISMATCH');
  return {
    ...branch,
    head: deepClone(transition.state),
    receipts: [...branch.receipts, deepClone(transition.receipt)],
  };
}

export function verifyBranchIsolation(authoritativeState, branch) {
  const passed = authoritativeState.state_root === branch.base_state_root
    && deepEqual(authoritativeState, branch.base)
    && authoritativeState.state_root !== branch.head.state_root;
  return {
    theorem: 'T3.1-branch-isolation',
    passed,
    authority_state_root: authoritativeState.state_root,
    branch_head_root: branch.head.state_root,
  };
}

export function rollbackBranch(branch) {
  const restored = deepClone(branch.base);
  return {
    state: restored,
    receipt: {
      theorem: 'T3.2-exact-sandbox-rollback',
      branch_id: branch.branch_id,
      expected_root: branch.base_state_root,
      restored_root: restored.state_root,
      passed: restored.state_root === branch.base_state_root,
    },
  };
}

function intersects(left, right) {
  const rightSet = new Set(right);
  return left.some((item) => rightSet.has(item));
}

export function actionsIndependent(left, right) {
  return !intersects(left.writes, right.writes)
    && !intersects(left.writes, right.reads)
    && !intersects(right.writes, left.reads);
}

function writePaths(payload, patch) {
  const result = deepClone(payload);
  for (const [path, value] of Object.entries(patch)) {
    const segments = path.split('.').filter(Boolean);
    if (segments.length === 0) throw new Error('EMPTY_PATCH_PATH');
    let cursor = result;
    for (const segment of segments.slice(0, -1)) {
      if (!isPlainObject(cursor[segment])) cursor[segment] = {};
      cursor = cursor[segment];
    }
    cursor[segments.at(-1)] = canonicalize(value);
  }
  return result;
}

export function applyDeterministicPatch(state, action, decision, patch, invariants = []) {
  return applyAuthorizedTransition({
    state,
    action,
    decision,
    next_payload: writePaths(state.payload, patch),
    invariants,
  });
}

export function verifyIndependentConfluence({ state, left, right, leftDecision, rightDecision, leftPatch, rightPatch }) {
  if (!actionsIndependent(left, right)) {
    return { theorem: 'T3.3-independent-confluence', passed: false, reason: 'ACTIONS_NOT_INDEPENDENT' };
  }
  const leftThenRightFirst = applyDeterministicPatch(state, left, leftDecision, leftPatch).state;
  const leftThenRight = applyDeterministicPatch(leftThenRightFirst, right, rightDecision, rightPatch).state;
  const rightThenLeftFirst = applyDeterministicPatch(state, right, rightDecision, rightPatch).state;
  const rightThenLeft = applyDeterministicPatch(rightThenLeftFirst, left, leftDecision, leftPatch).state;
  const passed = deepEqual(leftThenRight.payload, rightThenLeft.payload);
  return {
    theorem: 'T3.3-independent-confluence',
    passed,
    left_then_right_payload_root: semanticRoot(leftThenRight.payload),
    right_then_left_payload_root: semanticRoot(rightThenLeft.payload),
  };
}

export function deterministicReplay(initialState, events = []) {
  let current = deepClone(initialState);
  const ordered = [...events].sort((left, right) => left.sequence - right.sequence || left.event_id.localeCompare(right.event_id, 'en'));
  const seen = new Set();
  for (const event of ordered) {
    if (seen.has(event.event_id)) continue;
    if (event.base_state_root !== current.state_root) throw new Error('REPLAY_BASE_MISMATCH');
    current = createRealityState({
      generation: current.generation + 1,
      authority_root: current.authority_root,
      subject_root: current.subject_root,
      payload: writePaths(current.payload, event.patch),
      evidence: [...current.evidence, { kind: 'rncs.formal-replay-event', event_id: event.event_id }],
    });
    seen.add(event.event_id);
  }
  return {
    state: current,
    receipt: {
      theorem: 'T4.1-deterministic-replay-convergence',
      event_count: seen.size,
      final_state_root: current.state_root,
      passed: true,
    },
  };
}

export function applyDeltaOrQuarantine(state, delta) {
  if (delta.base_state_root !== state.state_root) {
    return {
      status: 'quarantined',
      state: deepClone(state),
      receipt: {
        theorem: 'T4.2-stale-delta-quarantine-safety',
        passed: true,
        reason: 'BASE_STATE_ROOT_MISMATCH',
        authority_state_unchanged: true,
      },
    };
  }
  const next = createRealityState({
    generation: state.generation + 1,
    authority_root: state.authority_root,
    subject_root: state.subject_root,
    payload: writePaths(state.payload, delta.patch),
    evidence: [...state.evidence, { kind: 'rncs.formal-delta', delta_id: delta.delta_id }],
  });
  return { status: 'applied', state: next };
}

export function compileProjection(state, projectionInput) {
  const authoritySnapshot = deepClone(state);
  const presentation = canonicalize(projectionInput(authoritySnapshot));
  const authorityUnchanged = deepEqual(authoritySnapshot, state);
  if (!authorityUnchanged) throw new Error('PROJECTION_MUTATED_AUTHORITY_STATE');
  return {
    format: 'rncs.formal-projection.v0.1',
    authority_state_root: state.state_root,
    presentation_root: semanticRoot(presentation),
    presentation,
    receipt: {
      theorem: 'T4.3-authority-presentation-separation',
      authority_state_root: state.state_root,
      authority_unchanged: authorityUnchanged,
      passed: authorityUnchanged,
    },
  };
}

function metaInvariantPayload(meta) {
  return {
    identity_root: meta.identity_root,
    constitution_root: meta.constitution_root,
    authority_model_root: meta.authority_model_root,
    evidence_policy_root: meta.evidence_policy_root,
  };
}

export function createMetaState({
  revision = 0,
  identity_root,
  constitution_root,
  authority_model_root,
  evidence_policy_root,
  laws = [],
  capabilities = [],
  evidence_ledger = [],
  parent_revision_root = null,
}) {
  assertNonNegativeInteger(revision, 'INVALID_META_REVISION');
  for (const [value, code] of [
    [identity_root, 'INVALID_IDENTITY_ROOT'],
    [constitution_root, 'INVALID_CONSTITUTION_ROOT'],
    [authority_model_root, 'INVALID_AUTHORITY_MODEL_ROOT'],
    [evidence_policy_root, 'INVALID_EVIDENCE_POLICY_ROOT'],
  ]) assertString(value, code);
  const meta = {
    format: 'rncs.formal-meta-state.v0.1',
    revision,
    identity_root,
    constitution_root,
    authority_model_root,
    evidence_policy_root,
    laws: uniqueSorted(laws),
    capabilities: uniqueSorted(capabilities),
    evidence_ledger: canonicalize(evidence_ledger),
    parent_revision_root,
  };
  meta.meta_invariant_root = semanticRoot(metaInvariantPayload(meta));
  meta.revision_root = semanticRoot(withoutKey(meta, 'revision_root'));
  return meta;
}

export function evolveMetaState(meta, {
  add_laws = [],
  remove_laws = [],
  add_capabilities = [],
  remove_capabilities = [],
  evidence,
  authority_decision,
}) {
  if (authority_decision?.status !== 'approved') throw new Error('META_EVOLUTION_NOT_AUTHORIZED');
  if (!evidence) throw new Error('META_EVOLUTION_EVIDENCE_REQUIRED');
  const nextLaws = meta.laws.filter((item) => !new Set(remove_laws).has(item)).concat(add_laws);
  const nextCapabilities = meta.capabilities
    .filter((item) => !new Set(remove_capabilities).has(item))
    .concat(add_capabilities);
  const next = createMetaState({
    revision: meta.revision + 1,
    identity_root: meta.identity_root,
    constitution_root: meta.constitution_root,
    authority_model_root: meta.authority_model_root,
    evidence_policy_root: meta.evidence_policy_root,
    laws: nextLaws,
    capabilities: nextCapabilities,
    evidence_ledger: [...meta.evidence_ledger, evidence],
    parent_revision_root: meta.revision_root,
  });
  const metaInvariantPreserved = next.meta_invariant_root === meta.meta_invariant_root;
  const evidenceMonotone = next.evidence_ledger.length === meta.evidence_ledger.length + 1;
  if (!metaInvariantPreserved) throw new Error('META_INVARIANT_CHANGED');
  if (!evidenceMonotone) throw new Error('EVIDENCE_NOT_MONOTONE');
  return {
    meta: next,
    receipt: {
      theorem: 'T5.1-bounded-self-evolution',
      previous_revision_root: meta.revision_root,
      next_revision_root: next.revision_root,
      meta_invariant_preserved: metaInvariantPreserved,
      evidence_monotone: evidenceMonotone,
      passed: metaInvariantPreserved && evidenceMonotone,
    },
  };
}

export function verifyIdentityContinuity(lineage = []) {
  if (lineage.length === 0) return { theorem: 'T5.2-identity-continuity', passed: false, reason: 'EMPTY_LINEAGE' };
  const identityRoot = lineage[0].identity_root;
  let passed = true;
  for (let index = 0; index < lineage.length; index += 1) {
    const current = lineage[index];
    if (current.identity_root !== identityRoot) passed = false;
    if (index > 0 && current.parent_revision_root !== lineage[index - 1].revision_root) passed = false;
  }
  return { theorem: 'T5.2-identity-continuity', identity_root: identityRoot, passed };
}

export function createClosureCertificate({
  goal_root,
  outcome,
  final_state_root = null,
  rollback_state_root = null,
  reason = null,
  evidence = [],
}) {
  assertString(goal_root, 'INVALID_GOAL_ROOT');
  if (!['committed', 'aborted'].includes(outcome)) throw new Error('NON_TERMINAL_OUTCOME');
  if (!Array.isArray(evidence) || evidence.length === 0) throw new Error('CLOSURE_EVIDENCE_REQUIRED');
  if (outcome === 'committed' && !final_state_root) throw new Error('FINAL_STATE_ROOT_REQUIRED');
  if (outcome === 'aborted' && (!rollback_state_root || !reason)) throw new Error('ABORT_DATA_REQUIRED');
  const certificate = {
    format: 'rncs.formal-closure-certificate.v0.1',
    goal_root,
    outcome,
    final_state_root,
    rollback_state_root,
    reason,
    evidence: canonicalize(evidence),
  };
  certificate.certificate_root = semanticRoot(certificate);
  return certificate;
}

export function verifyClosureCertificate(certificate) {
  const errors = [];
  if (!['committed', 'aborted'].includes(certificate.outcome)) errors.push('NON_TERMINAL_OUTCOME');
  if (!Array.isArray(certificate.evidence) || certificate.evidence.length === 0) errors.push('CLOSURE_EVIDENCE_REQUIRED');
  if (certificate.outcome === 'committed' && !certificate.final_state_root) errors.push('FINAL_STATE_ROOT_REQUIRED');
  if (certificate.outcome === 'aborted' && (!certificate.rollback_state_root || !certificate.reason)) errors.push('ABORT_DATA_REQUIRED');
  const expected = semanticRoot(withoutKey(certificate, 'certificate_root'));
  if (certificate.certificate_root !== expected) errors.push('CERTIFICATE_ROOT_MISMATCH');
  return { theorem: 'T5.3-explicit-reality-closure', passed: errors.length === 0, errors };
}

export function verifyLevel5Composition({
  transition_receipt,
  branch_receipt,
  replay_receipt,
  projection_receipt,
  evolution_receipt,
  identity_receipt,
  closure_receipt,
}) {
  const witnesses = [
    transition_receipt,
    branch_receipt,
    replay_receipt,
    projection_receipt,
    evolution_receipt,
    identity_receipt,
    closure_receipt,
  ];
  const passed = witnesses.every((receipt) => receipt?.passed === true);
  return {
    theorem: 'T5.4-compositional-reality-closure',
    passed,
    witnesses: witnesses.map((receipt) => ({ theorem: receipt?.theorem ?? null, passed: receipt?.passed === true })),
  };
}

export const theoremCatalogue = Object.freeze([
  { id: 'T1.1', level: 1, name: 'Canonical semantic identity' },
  { id: 'T1.2', level: 1, name: 'Generation monotonicity' },
  { id: 'T2.1', level: 2, name: 'No authority, no formal transition' },
  { id: 'T2.2', level: 2, name: 'Authorized invariant preservation' },
  { id: 'T3.1', level: 3, name: 'Candidate branch isolation' },
  { id: 'T3.2', level: 3, name: 'Exact sandbox rollback' },
  { id: 'T3.3', level: 3, name: 'Independent transition confluence' },
  { id: 'T4.1', level: 4, name: 'Deterministic replay convergence' },
  { id: 'T4.2', level: 4, name: 'Stale delta quarantine safety' },
  { id: 'T4.3', level: 4, name: 'Authority-presentation separation' },
  { id: 'T5.1', level: 5, name: 'Bounded self-evolution' },
  { id: 'T5.2', level: 5, name: 'Identity continuity' },
  { id: 'T5.3', level: 5, name: 'Explicit reality closure' },
  { id: 'T5.4', level: 5, name: 'Compositional reality closure' },
]);
