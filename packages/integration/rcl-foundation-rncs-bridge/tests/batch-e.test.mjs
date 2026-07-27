import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authorizeFoundationNativeRncsTransition,
  commitFoundationNativeRncsTransition,
  foundationNativeRncsReceiptRoot,
  prepareFoundationNativeBatchERncsTransition,
  RCL_FOUNDATION_RNCS_BATCH_E,
  RclFoundationRncsBridgeError,
  verifyFoundationNativeRncsTransition,
} from '../src/index.mjs';

const REQUEST = {
  authorized: true,
  aifDecision: 'stable',
  input: {
    speechAct: 'create',
    metacomputation: {
      planId: 'plan:sum-v1',
      strategy: 'bounded-step',
      requestedSteps: 12,
      maximumSteps: 8,
      tick: 12,
    },
    computation: {
      programId: 'program:sum-v1',
      operation: 'sum',
      leftOperand: 21,
      rightOperand: 21,
      instructionBudget: 64,
    },
  },
  evidence: [{
    type: 'integration-test',
    id: 'rncs-foundation-native-batch-e',
  }],
};

let preparedFixture;

function prepared() {
  preparedFixture ??= prepareFoundationNativeBatchERncsTransition(REQUEST);
  return preparedFixture;
}

function assertBridgeError(code, callback) {
  assert.throws(
    callback,
    error => error instanceof RclFoundationRncsBridgeError && error.code === code,
  );
}

test('Batch E becomes one valid RNCS proposal with metacomputation-to-computation bindings', { timeout: 300_000 }, () => {
  const value = prepared();
  const verification = verifyFoundationNativeRncsTransition(value);
  assert.equal(verification.ok, true);
  assert.equal(verification.batch, RCL_FOUNDATION_RNCS_BATCH_E);
  assert.equal(value.execution.results.length, 2);
  assert.deepEqual(
    value.envelope.provisional_delta.operations.map(item => item.path),
    ['foundation.metacomputation', 'foundation.computation'],
  );
  assert.equal(
    value.envelope.provisional_delta.operations[0].semantic_parameters.metacomputation.effectiveSteps,
    8,
  );
  assert.equal(
    value.envelope.provisional_delta.operations[1].semantic_parameters.computation.result,
    42,
  );
  assert.equal(
    value.envelope.provisional_delta.operations[1].semantic_parameters.computation.metacomputationParentRoot,
    value.execution.results[1].stateDelta.beforeRoot,
  );
  assert.equal(
    value.envelope.foundation_governance.nativeReceipt.providerId,
    'rcl.foundation.batch-e',
  );
});

test('same Batch E receipt produces the same RNCS proposal roots', { timeout: 300_000 }, () => {
  const first = prepared();
  const second = prepareFoundationNativeBatchERncsTransition(REQUEST);
  assert.equal(first.execution.deterministicReceiptRoot, second.execution.deterministicReceiptRoot);
  assert.equal(first.envelope.proposal_root, second.envelope.proposal_root);
  assert.equal(first.envelope.envelope_root, second.envelope.envelope_root);
  assert.equal(foundationNativeRncsReceiptRoot(first), foundationNativeRncsReceiptRoot(second));
});

test('Batch E semantic tampering cannot pass RNCS verification or authority', { timeout: 300_000 }, () => {
  const tampered = structuredClone(prepared());
  tampered.execution.results[1].proposal.parameters.computation.result = 7;
  const verification = verifyFoundationNativeRncsTransition(tampered);
  assert.equal(verification.ok, false);
  assert.equal(verification.errors.includes('SEMANTIC_PARAMETERS_BINDING_MISMATCH:2'), true);
  assert.equal(verification.errors.includes('COMPUTATION_SEMANTICS_INVALID'), true);
  assertBridgeError(
    'RNCS_FOUNDATION_BRIDGE_INVALID',
    () => authorizeFoundationNativeRncsTransition(tampered, {
      approved: true,
      roles: ['owner'],
    }),
  );
});

test('Batch E keeps human approval and commit confirmation as separate gates', { timeout: 300_000 }, () => {
  const value = prepared();
  assertBridgeError(
    'RNCS_FOUNDATION_HUMAN_APPROVAL_REQUIRED',
    () => authorizeFoundationNativeRncsTransition(value, { approved: false }),
  );
  const authorized = authorizeFoundationNativeRncsTransition(value, {
    approved: true,
    roles: ['owner'],
  });
  assertBridgeError(
    'RNCS_FOUNDATION_COMMIT_CONFIRMATION_REQUIRED',
    () => commitFoundationNativeRncsTransition(authorized, { confirmed: false }),
  );
  const committed = commitFoundationNativeRncsTransition(authorized, {
    confirmed: true,
  });
  assert.equal(committed.status, 'committed');
  assert.equal(verifyFoundationNativeRncsTransition(committed).ok, true);
  assert.equal(
    committed.envelope.commit.result_generation.generation_root,
    value.execution.finalStateRoot,
  );
});
