import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authorizeFoundationNativeRncsTransition,
  commitFoundationNativeRncsTransition,
  foundationNativeRncsReceiptRoot,
  prepareFoundationNativeBatchCRncsTransition,
  RCL_FOUNDATION_RNCS_BATCH_C,
  RclFoundationRncsBridgeError,
  verifyFoundationNativeRncsTransition,
} from '../src/index.mjs';

const REQUEST = {
  authorized: true,
  aifDecision: 'stable',
  input: {
    speechAct: 'create',
    physical: {
      tick: 12,
      dtMicros: 16667,
      bodyCount: 3,
      contactBudget: 8,
    },
    embodiment: {
      subjectId: 'body:avatar',
      command: 'walk',
    },
  },
  evidence: [{
    type: 'integration-test',
    id: 'rncs-foundation-native-batch-c',
  }],
};

let preparedFixture;

function prepared() {
  preparedFixture ??= prepareFoundationNativeBatchCRncsTransition(REQUEST);
  return preparedFixture;
}

function assertBridgeError(code, callback) {
  assert.throws(
    callback,
    error => error instanceof RclFoundationRncsBridgeError && error.code === code,
  );
}

test('Batch C becomes one valid RNCS proposal with physical-to-embodiment bindings', { timeout: 300_000 }, () => {
  const value = prepared();
  const verification = verifyFoundationNativeRncsTransition(value);
  assert.equal(verification.ok, true);
  assert.equal(verification.batch, RCL_FOUNDATION_RNCS_BATCH_C);
  assert.equal(value.execution.results.length, 2);
  assert.deepEqual(
    value.envelope.provisional_delta.operations.map(item => item.path),
    ['foundation.physical', 'foundation.embodiment'],
  );
  assert.equal(
    value.envelope.provisional_delta.operations[1].semantic_parameters.embodiment.physicalParentRoot,
    value.execution.results[1].stateDelta.beforeRoot,
  );
  assert.equal(
    value.envelope.foundation_governance.nativeReceipt.providerId,
    'rcl.foundation.batch-c',
  );
});

test('same Batch C receipt produces the same RNCS proposal roots', { timeout: 300_000 }, () => {
  const first = prepared();
  const second = prepareFoundationNativeBatchCRncsTransition(REQUEST);
  assert.equal(first.execution.deterministicReceiptRoot, second.execution.deterministicReceiptRoot);
  assert.equal(first.envelope.proposal_root, second.envelope.proposal_root);
  assert.equal(first.envelope.envelope_root, second.envelope.envelope_root);
  assert.equal(foundationNativeRncsReceiptRoot(first), foundationNativeRncsReceiptRoot(second));
});

test('Batch C semantic tampering cannot pass RNCS verification or authority', { timeout: 300_000 }, () => {
  const tampered = structuredClone(prepared());
  tampered.execution.results[0].proposal.parameters.physical.tickAfter = 99;
  const verification = verifyFoundationNativeRncsTransition(tampered);
  assert.equal(verification.ok, false);
  assert.equal(verification.errors.includes('SEMANTIC_PARAMETERS_BINDING_MISMATCH:1'), true);
  assert.equal(verification.errors.includes('PHYSICAL_SEMANTICS_INVALID'), true);
  assertBridgeError(
    'RNCS_FOUNDATION_BRIDGE_INVALID',
    () => authorizeFoundationNativeRncsTransition(tampered, {
      approved: true,
      roles: ['owner'],
    }),
  );
});

test('Batch C keeps human approval and commit confirmation as separate gates', { timeout: 300_000 }, () => {
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
