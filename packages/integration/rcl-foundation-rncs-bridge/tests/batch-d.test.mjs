import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authorizeFoundationNativeRncsTransition,
  commitFoundationNativeRncsTransition,
  foundationNativeRncsReceiptRoot,
  prepareFoundationNativeBatchDRncsTransition,
  RCL_FOUNDATION_RNCS_BATCH_D,
  RclFoundationRncsBridgeError,
  verifyFoundationNativeRncsTransition,
} from '../src/index.mjs';

const REQUEST = {
  authorized: true,
  aifDecision: 'stable',
  input: {
    speechAct: 'create',
    energy: {
      availableMilliJoules: 120_000,
      requestedMilliJoules: 75_000,
      lossPpm: 10_000,
      tick: 12,
    },
    elemental: {
      materialId: 'material:steel',
      massMg: 250_000,
      purityPpm: 950_000,
      temperatureMilliK: 300_000,
      energyUseMilliJoules: 50_000,
    },
    neural: {
      signalId: 'signal:operator',
      amplitudePpm: 850_000,
      memoryBudgetBytes: 4_096,
      attentionWindow: 32,
      inhibitionPpm: 100_000,
    },
  },
  evidence: [{
    type: 'integration-test',
    id: 'rncs-foundation-native-batch-d',
  }],
};

let preparedFixture;

function prepared() {
  preparedFixture ??= prepareFoundationNativeBatchDRncsTransition(REQUEST);
  return preparedFixture;
}

function assertBridgeError(code, callback) {
  assert.throws(
    callback,
    error => error instanceof RclFoundationRncsBridgeError && error.code === code,
  );
}

test('Batch D becomes one valid RNCS proposal with energy-to-neural bindings', { timeout: 300_000 }, () => {
  const value = prepared();
  const verification = verifyFoundationNativeRncsTransition(value);
  assert.equal(verification.ok, true);
  assert.equal(verification.batch, RCL_FOUNDATION_RNCS_BATCH_D);
  assert.equal(value.execution.results.length, 3);
  assert.deepEqual(
    value.envelope.provisional_delta.operations.map(item => item.path),
    ['foundation.energy', 'foundation.elemental', 'foundation.neural'],
  );
  assert.equal(
    value.envelope.provisional_delta.operations[1].semantic_parameters.elemental.energyParentRoot,
    value.execution.results[1].stateDelta.beforeRoot,
  );
  assert.equal(
    value.envelope.provisional_delta.operations[2].semantic_parameters.neural.elementalParentRoot,
    value.execution.results[2].stateDelta.beforeRoot,
  );
  assert.equal(
    value.envelope.foundation_governance.nativeReceipt.providerId,
    'rcl.foundation.batch-d',
  );
});

test('same Batch D receipt produces the same RNCS proposal roots', { timeout: 300_000 }, () => {
  const first = prepared();
  const second = prepareFoundationNativeBatchDRncsTransition(REQUEST);
  assert.equal(first.execution.deterministicReceiptRoot, second.execution.deterministicReceiptRoot);
  assert.equal(first.envelope.proposal_root, second.envelope.proposal_root);
  assert.equal(first.envelope.envelope_root, second.envelope.envelope_root);
  assert.equal(foundationNativeRncsReceiptRoot(first), foundationNativeRncsReceiptRoot(second));
});

test('Batch D semantic tampering cannot pass RNCS verification or authority', { timeout: 300_000 }, () => {
  const tampered = structuredClone(prepared());
  tampered.execution.results[0].proposal.parameters.energy.effectiveMilliJoules = 1;
  const verification = verifyFoundationNativeRncsTransition(tampered);
  assert.equal(verification.ok, false);
  assert.equal(verification.errors.includes('SEMANTIC_PARAMETERS_BINDING_MISMATCH:1'), true);
  assert.equal(verification.errors.includes('ENERGY_SEMANTICS_INVALID'), true);
  assertBridgeError(
    'RNCS_FOUNDATION_BRIDGE_INVALID',
    () => authorizeFoundationNativeRncsTransition(tampered, {
      approved: true,
      roles: ['owner'],
    }),
  );
});

test('Batch D keeps human approval and commit confirmation as separate gates', { timeout: 300_000 }, () => {
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
