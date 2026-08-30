import {ContractError, rootHash, without} from './index.mjs';
import {verifyRepresentationRef} from './representation-ref.mjs';

export const REPRESENTATION_TRANSITION_FORMAT = 'rncs.representation-transition.v0.1';
export const REPRESENTATION_TRANSITION_VERSION = '0.1.0';
export const REPRESENTATION_TRANSITION_PHASES = Object.freeze(['candidate', 'applied', 'rolled_back']);
export const REPRESENTATION_TRANSITION_OPERATIONS = Object.freeze([
  'derive', 'materialize', 'approximate', 'fuse', 'split', 'handoff', 'freeze', 'thaw', 'reconcile', 'rollback'
]);
export const REPRESENTATION_EQUIVALENCE_DIMENSIONS = Object.freeze([
  'identity', 'authority', 'constraint', 'semantic', 'spatial', 'perceptual', 'behavioral', 'temporal', 'task'
]);
export const REPRESENTATION_EQUIVALENCE_STATUSES = Object.freeze(['PASS', 'FAIL', 'UNKNOWN', 'NOT_RUN']);

const clone = value => structuredClone(value);
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

function normalizeEquivalence(input = {}) {
  const value = record(input);
  const output = {};
  for (const dimension of REPRESENTATION_EQUIVALENCE_DIMENSIONS) {
    const raw = record(value[dimension]);
    const status = String(raw.status ?? value[dimension] ?? 'UNKNOWN');
    fail(REPRESENTATION_EQUIVALENCE_STATUSES.includes(status), `REPRESENTATION_EQUIVALENCE_STATUS_INVALID:${dimension}`);
    output[dimension] = {
      status,
      evidence_root: raw.evidence_root ?? null,
      notes: raw.notes ?? null
    };
  }
  return output;
}

function normalizeResourceDecision(input, source, target) {
  const value = record(input);
  const selected = String(value.selected_representation_root ?? target.representation_root);
  fail(selected === source.representation_root || selected === target.representation_root, 'REPRESENTATION_RESOURCE_SELECTION_INVALID');
  const selectedReference = selected === source.representation_root ? source : target;
  const detailPolicyRoot = String(value.detail_policy_root ?? rootHash(selectedReference.detail_policy));
  const residencyPolicyRoot = String(value.residency_policy_root ?? rootHash(selectedReference.residency_policy));
  fail(hex64(detailPolicyRoot), 'REPRESENTATION_DETAIL_POLICY_ROOT_INVALID');
  fail(hex64(residencyPolicyRoot), 'REPRESENTATION_RESIDENCY_POLICY_ROOT_INVALID');
  fail(detailPolicyRoot === rootHash(selectedReference.detail_policy), 'REPRESENTATION_DETAIL_POLICY_ROOT_MISMATCH');
  fail(residencyPolicyRoot === rootHash(selectedReference.residency_policy), 'REPRESENTATION_RESIDENCY_POLICY_ROOT_MISMATCH');
  return {
    mode: String(value.mode ?? 'handoff'),
    selected_representation_root: selected,
    source_representation_root: source.representation_root,
    target_representation_root: target.representation_root,
    detail_policy_root: detailPolicyRoot,
    residency_policy_root: residencyPolicyRoot,
    resource_budget: clone(value.resource_budget ?? {}),
    reason: String(value.reason ?? '')
  };
}

function normalizeRollback(input, source, target) {
  const value = record(input);
  return {
    available: value.available !== false,
    strategy: String(value.strategy ?? 'restore-source-representation'),
    source_representation_root: source.representation_root,
    target_representation_root: target.representation_root,
    status: 'AVAILABLE',
    reason: String(value.reason ?? 'candidate transition remains reversible')
  };
}

function transitionBase(value) {
  const source = value.source_representation;
  const target = value.target_representation;
  fail(verifyRepresentationRef(source).valid, 'REPRESENTATION_TRANSITION_SOURCE_INVALID');
  fail(verifyRepresentationRef(target).valid, 'REPRESENTATION_TRANSITION_TARGET_INVALID');
  fail(source.representation_root !== target.representation_root, 'REPRESENTATION_TRANSITION_IDENTICAL_REPRESENTATIONS');
  fail(source.content_root === target.content_root, 'REPRESENTATION_TRANSITION_CONTENT_ROOT_MISMATCH');
  const transition_id = String(value.transition_id ?? '');
  const operation = String(value.operation ?? 'handoff');
  const object_id = String(value.object_id ?? '');
  const branch = String(value.branch ?? 'main');
  const state_root = String(value.state_root ?? '');
  fail(transition_id, 'REPRESENTATION_TRANSITION_ID_REQUIRED');
  fail(REPRESENTATION_TRANSITION_OPERATIONS.includes(operation), 'REPRESENTATION_TRANSITION_OPERATION_INVALID');
  fail(object_id, 'REPRESENTATION_TRANSITION_OBJECT_ID_REQUIRED');
  fail(hex64(state_root), 'REPRESENTATION_TRANSITION_STATE_ROOT_INVALID');
  return {
    format: REPRESENTATION_TRANSITION_FORMAT,
    version: REPRESENTATION_TRANSITION_VERSION,
    transition_id,
    phase: 'candidate',
    operation,
    identity: {
      object_id,
      branch,
      state_root,
      content_root: source.content_root,
      source_representation_root: source.representation_root,
      target_representation_root: target.representation_root
    },
    source_representation: clone(source),
    target_representation: clone(target),
    equivalence: normalizeEquivalence(value.equivalence),
    resource_decision: normalizeResourceDecision(value.resource_decision, source, target),
    rollback: normalizeRollback(value.rollback, source, target),
    active_representation_root: source.representation_root,
    authority: {
      provider_can_write_authoritative_world_state: false,
      rncs_authority_required: true,
      candidate_only: true,
      source_scope: [...source.authority_scope],
      target_scope: [...target.authority_scope]
    },
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED',
    execution_status: 'CANDIDATE_ONLY'
  };
}

export function createRepresentationTransitionCandidate(input = {}) {
  const base = transitionBase(record(input));
  return {...base, transition_root: rootHash(base)};
}

function verifyEquivalence(e, errors) {
  const equivalence = record(e.equivalence);
  for (const dimension of REPRESENTATION_EQUIVALENCE_DIMENSIONS) {
    const status = equivalence[dimension]?.status;
    if (!REPRESENTATION_EQUIVALENCE_STATUSES.includes(status)) errors.push(`REPRESENTATION_EQUIVALENCE_STATUS_INVALID:${dimension}`);
    const evidenceRoot = equivalence[dimension]?.evidence_root;
    if (evidenceRoot !== null && evidenceRoot !== undefined && !hex64(evidenceRoot)) errors.push(`REPRESENTATION_EQUIVALENCE_EVIDENCE_ROOT_INVALID:${dimension}`);
  }
}

export function verifyRepresentationTransition(transition) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!transition || typeof transition !== 'object') return {valid: false, errors: ['REPRESENTATION_TRANSITION_NOT_OBJECT']};
  try {
    check(transition.format === REPRESENTATION_TRANSITION_FORMAT, 'REPRESENTATION_TRANSITION_FORMAT_INVALID');
    check(transition.version === REPRESENTATION_TRANSITION_VERSION, 'REPRESENTATION_TRANSITION_VERSION_INVALID');
    check(typeof transition.transition_id === 'string' && transition.transition_id.length > 0, 'REPRESENTATION_TRANSITION_ID_REQUIRED');
    check(REPRESENTATION_TRANSITION_PHASES.includes(transition.phase), 'REPRESENTATION_TRANSITION_PHASE_INVALID');
    check(REPRESENTATION_TRANSITION_OPERATIONS.includes(transition.operation), 'REPRESENTATION_TRANSITION_OPERATION_INVALID');
    const source = transition.source_representation;
    const target = transition.target_representation;
    check(verifyRepresentationRef(source).valid, 'REPRESENTATION_TRANSITION_SOURCE_INVALID');
    check(verifyRepresentationRef(target).valid, 'REPRESENTATION_TRANSITION_TARGET_INVALID');
    if (verifyRepresentationRef(source).valid && verifyRepresentationRef(target).valid) {
      check(source.representation_root !== target.representation_root, 'REPRESENTATION_TRANSITION_IDENTICAL_REPRESENTATIONS');
      check(source.content_root === target.content_root, 'REPRESENTATION_TRANSITION_CONTENT_ROOT_MISMATCH');
      check(transition.identity?.content_root === source.content_root, 'REPRESENTATION_TRANSITION_IDENTITY_CONTENT_ROOT_MISMATCH');
      check(transition.identity?.source_representation_root === source.representation_root, 'REPRESENTATION_TRANSITION_IDENTITY_SOURCE_MISMATCH');
      check(transition.identity?.target_representation_root === target.representation_root, 'REPRESENTATION_TRANSITION_IDENTITY_TARGET_MISMATCH');
      check(transition.resource_decision?.source_representation_root === source.representation_root, 'REPRESENTATION_RESOURCE_SOURCE_MISMATCH');
      check(transition.resource_decision?.target_representation_root === target.representation_root, 'REPRESENTATION_RESOURCE_TARGET_MISMATCH');
      check(transition.rollback?.source_representation_root === source.representation_root, 'REPRESENTATION_ROLLBACK_SOURCE_MISMATCH');
      check(transition.rollback?.target_representation_root === target.representation_root, 'REPRESENTATION_ROLLBACK_TARGET_MISMATCH');
      check(transition.authority?.source_scope?.join('|') === source.authority_scope.join('|'), 'REPRESENTATION_TRANSITION_SOURCE_SCOPE_MISMATCH');
      check(transition.authority?.target_scope?.join('|') === target.authority_scope.join('|'), 'REPRESENTATION_TRANSITION_TARGET_SCOPE_MISMATCH');
    }
    check(typeof transition.identity?.object_id === 'string' && transition.identity.object_id.length > 0, 'REPRESENTATION_TRANSITION_OBJECT_ID_REQUIRED');
    check(hex64(transition.identity?.state_root), 'REPRESENTATION_TRANSITION_STATE_ROOT_INVALID');
    check(transition.candidate_only === true, 'REPRESENTATION_TRANSITION_MUST_BE_CANDIDATE_ONLY');
    check(transition.authoritative === false, 'REPRESENTATION_TRANSITION_CANNOT_BE_AUTHORITATIVE');
    check(transition.commit_status === 'NOT_COMMITTED', 'REPRESENTATION_TRANSITION_COMMIT_STATUS_INVALID');
    check(transition.authority?.provider_can_write_authoritative_world_state === false, 'REPRESENTATION_TRANSITION_AUTHORITY_ESCALATION');
    check(transition.authority?.rncs_authority_required === true, 'REPRESENTATION_TRANSITION_RNCS_AUTHORITY_REQUIRED');
    check(transition.authority?.candidate_only === true, 'REPRESENTATION_TRANSITION_AUTHORITY_CANDIDATE_ONLY_REQUIRED');
    check(['CANDIDATE_ONLY', 'CANDIDATE_APPLIED', 'CANDIDATE_ROLLED_BACK'].includes(transition.execution_status), 'REPRESENTATION_TRANSITION_EXECUTION_STATUS_INVALID');
    check(transition.active_representation_root === transition.source_representation.representation_root || transition.active_representation_root === transition.target_representation.representation_root, 'REPRESENTATION_TRANSITION_ACTIVE_ROOT_INVALID');
    check(transition.resource_decision?.selected_representation_root === transition.source_representation.representation_root || transition.resource_decision?.selected_representation_root === transition.target_representation.representation_root, 'REPRESENTATION_RESOURCE_SELECTION_INVALID');
    if (transition.resource_decision?.selected_representation_root === transition.source_representation.representation_root) {
      check(transition.resource_decision.detail_policy_root === rootHash(transition.source_representation.detail_policy), 'REPRESENTATION_DETAIL_POLICY_ROOT_MISMATCH');
      check(transition.resource_decision.residency_policy_root === rootHash(transition.source_representation.residency_policy), 'REPRESENTATION_RESIDENCY_POLICY_ROOT_MISMATCH');
    } else if (transition.resource_decision?.selected_representation_root === transition.target_representation.representation_root) {
      check(transition.resource_decision.detail_policy_root === rootHash(transition.target_representation.detail_policy), 'REPRESENTATION_DETAIL_POLICY_ROOT_MISMATCH');
      check(transition.resource_decision.residency_policy_root === rootHash(transition.target_representation.residency_policy), 'REPRESENTATION_RESIDENCY_POLICY_ROOT_MISMATCH');
    }
    check(transition.rollback?.available === true, 'REPRESENTATION_ROLLBACK_UNAVAILABLE');
    check(['AVAILABLE', 'ROLLED_BACK'].includes(transition.rollback?.status), 'REPRESENTATION_ROLLBACK_STATUS_INVALID');
    verifyEquivalence(transition, errors);
    check(hex64(transition.transition_root), 'REPRESENTATION_TRANSITION_ROOT_INVALID');
    check(rootHash(without(transition, 'transition_root')) === transition.transition_root, 'REPRESENTATION_TRANSITION_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`REPRESENTATION_TRANSITION_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, transition_root: transition.transition_root, phase: transition.phase};
}

export function applyRepresentationTransition(transition) {
  const verification = verifyRepresentationTransition(transition);
  fail(verification.valid, `REPRESENTATION_TRANSITION_INVALID:${verification.errors.join(',')}`);
  fail(transition.phase === 'candidate', 'REPRESENTATION_TRANSITION_PHASE_INVALID');
  fail(transition.equivalence.identity.status === 'PASS', 'REPRESENTATION_IDENTITY_EQUIVALENCE_REQUIRED');
  fail(transition.equivalence.authority.status === 'PASS', 'REPRESENTATION_AUTHORITY_EQUIVALENCE_REQUIRED');
  const output = clone(transition);
  output.phase = 'applied';
  output.active_representation_root = output.target_representation.representation_root;
  output.execution_status = 'CANDIDATE_APPLIED';
  output.rollback.status = 'AVAILABLE';
  delete output.transition_root;
  return {...output, transition_root: rootHash(output)};
}

export function rollbackRepresentationTransition(transition, reason = 'candidate transition rolled back') {
  const verification = verifyRepresentationTransition(transition);
  fail(verification.valid, `REPRESENTATION_TRANSITION_INVALID:${verification.errors.join(',')}`);
  fail(transition.phase === 'candidate' || transition.phase === 'applied', 'REPRESENTATION_ROLLBACK_PHASE_INVALID');
  const output = clone(transition);
  output.phase = 'rolled_back';
  output.active_representation_root = output.source_representation.representation_root;
  output.execution_status = 'CANDIDATE_ROLLED_BACK';
  output.rollback = {...output.rollback, status: 'ROLLED_BACK', reason: String(reason)};
  delete output.transition_root;
  return {...output, transition_root: rootHash(output)};
}
