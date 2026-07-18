import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authorizeFoundationNativeRncsTransition,
  commitFoundationNativeRncsTransition,
  foundationNativeRncsReceiptRoot,
  prepareFoundationNativeRncsTransition,
  RclFoundationRncsBridgeError,
  verifyFoundationNativeRncsTransition,
} from '../src/index.mjs';
import {
  commit,
  proposalPayload,
  reseal,
  rootHash,
  without,
} from '../../../kernel/rncs-core-contract/src/index.mjs';

const REQUEST = {
  authorized: true,
  aifDecision: 'stable',
  input: {
    speechAct: 'create',
    utterance: 'Create one bounded RNCS world candidate.',
  },
  evidence: [{ type: 'integration-test', id: 'rncs-foundation-native' }],
};

let preparedFixture;

function prepared() {
  preparedFixture ??= prepareFoundationNativeRncsTransition(REQUEST);
  return preparedFixture;
}

function assertBridgeError(code, callback) {
  assert.throws(
    callback,
    error => error instanceof RclFoundationRncsBridgeError && error.code === code,
  );
}

test('Native Batch A compiles into one valid RNCS proposal and complete 4R governance', { timeout: 300_000 }, () => {
  const value = prepared();
  const verification = verifyFoundationNativeRncsTransition(value);
  assert.equal(verification.ok, true);
  assert.equal(value.status, 'proposed');
  assert.equal(value.execution.results.length, 6);
  assert.equal(value.envelope.phase, 'proposed');
  assert.equal(value.envelope.foundation_governance.providerCapabilities.required.length, 6);
  assert.equal(value.envelope.foundation_governance.authorityRequirements.length > 0, true);
  assert.equal(value.envelope.foundation_governance.evidenceRequirements.length, 1);
  assert.equal(value.envelope.foundation_governance.nativeReceipt.receiptRoot, value.roots.receiptRoot);
});

test('same Native receipt compiles to the same deterministic RNCS proposal root', { timeout: 300_000 }, () => {
  const first = prepared();
  const second = prepareFoundationNativeRncsTransition(REQUEST);
  assert.equal(first.execution.deterministicReceiptRoot, second.execution.deterministicReceiptRoot);
  assert.equal(first.envelope.proposal_root, second.envelope.proposal_root);
  assert.equal(first.envelope.envelope_root, second.envelope.envelope_root);
  assert.equal(foundationNativeRncsReceiptRoot(first), foundationNativeRncsReceiptRoot(second));
});

test('tampering a displayed Native result breaks its sealed RNCS delta binding', { timeout: 300_000 }, () => {
  const tampered = structuredClone(prepared());
  tampered.execution.results[5].proposal.selectedAction = 'forged-auto-commit';
  const verification = verifyFoundationNativeRncsTransition(tampered);
  assert.equal(verification.ok, false);
  assert.equal(verification.errors.includes('RESULT_DELTA_BINDING_MISMATCH:6'), true);
  assertBridgeError(
    'RNCS_FOUNDATION_BRIDGE_INVALID',
    () => authorizeFoundationNativeRncsTransition(tampered, { approved: true, roles: ['owner'] }),
  );
});

test('human approval and commit confirmation remain separate authority gates', { timeout: 300_000 }, () => {
  const value = prepared();
  assertBridgeError(
    'RNCS_FOUNDATION_HUMAN_APPROVAL_REQUIRED',
    () => authorizeFoundationNativeRncsTransition(value, { approved: false }),
  );
  assertBridgeError(
    'RNCS_FOUNDATION_APPROVER_ROLE_REQUIRED',
    () => authorizeFoundationNativeRncsTransition(value, { approved: true, roles: ['observer'] }),
  );
  const authorized = authorizeFoundationNativeRncsTransition(value, {
    approved: true,
    roles: ['owner'],
    resolver: 'test-human-owner',
  });
  assert.equal(authorized.envelope.phase, 'authorized');
  assertBridgeError(
    'RNCS_FOUNDATION_COMMIT_CONFIRMATION_REQUIRED',
    () => commitFoundationNativeRncsTransition(authorized, { confirmed: false }),
  );
  const committed = commitFoundationNativeRncsTransition(authorized, { confirmed: true });
  assert.equal(committed.envelope.phase, 'committed');
  assert.equal(committed.envelope.commit.result_generation.generation_root, value.roots.finalStateRoot);
  assert.deepEqual(committed.envelope.commit.receipt_refs, [value.roots.receiptRoot]);
  assert.equal(verifyFoundationNativeRncsTransition(committed).ok, true);
});

test('RNCS 4R commit gate rejects a resealed proposal with missing evidence requirements', { timeout: 300_000 }, () => {
  const authorized = authorizeFoundationNativeRncsTransition(prepared(), {
    approved: true,
    roles: ['reviewer'],
  });
  const tampered = structuredClone(authorized.envelope);
  tampered.foundation_governance.evidenceRequirements = null;
  tampered.proposal_root = rootHash(proposalPayload(tampered));
  tampered.authority.proposal_root = tampered.proposal_root;
  delete tampered.authority.decision_root;
  tampered.authority.decision_root = rootHash(without(tampered.authority, 'decision_root'));
  const resealed = reseal(tampered);
  assert.throws(
    () => commit(resealed, {
      generation: 1,
      generation_root: authorized.roots.finalStateRoot,
      receipt_refs: [authorized.roots.receiptRoot],
    }),
    /FOUNDATION_4R_GATE_FAILED/,
  );
});

test('RCL authority, AIF, and missing-provider failures cannot become RNCS proposals', { timeout: 300_000 }, () => {
  assert.throws(
    () => prepareFoundationNativeRncsTransition({ ...REQUEST, authorized: false }),
    error => error.code === 'RCL_FOUNDATION_AUTHORITY_DENIED',
  );
  assert.throws(
    () => prepareFoundationNativeRncsTransition({ ...REQUEST, aifDecision: 'unstable' }),
    error => error.code === 'RCL_FOUNDATION_AIF_REJECTED',
  );
  assert.throws(
    () => prepareFoundationNativeRncsTransition(REQUEST, { native: { disableProvider: true } }),
    error => error.code === 'RCL_NATIVE_PROVIDER_MISSING',
  );
});

test('speech-act counterfactual changes the Native candidate and RNCS proposal root', { timeout: 300_000 }, () => {
  const create = prepared();
  const inspect = prepareFoundationNativeRncsTransition({
    ...REQUEST,
    input: {
      speechAct: 'inspect',
      utterance: 'Inspect the world without creating it.',
    },
  });
  assert.notEqual(create.execution.finalCandidate.selectedAction, inspect.execution.finalCandidate.selectedAction);
  assert.notEqual(create.execution.finalStateRoot, inspect.execution.finalStateRoot);
  assert.notEqual(create.envelope.proposal_root, inspect.envelope.proposal_root);
});
