import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authorizeFoundationNativeRncsTransition,
  commitFoundationNativeRncsTransition,
  foundationNativeRncsReceiptRoot,
  prepareFoundationNativeMetaRncsTransition,
  prepareFoundationNativeRncsTransition,
  RCL_FOUNDATION_RNCS_META_BATCH_B,
  RclFoundationRncsBridgeError,
  verifyFoundationNativeRncsTransition,
} from '../src/index.mjs';
import {
  proposalPayload,
  reseal,
  rootHash,
} from '../../../kernel/rncs-core-contract/src/index.mjs';

const REQUEST = {
  authorized: true,
  aifDecision: 'stable',
  input: {
    speechAct: 'create',
    timeline: {
      tick: 5,
      observerFrame: 'subjective-bounded',
      eventCount: 2,
    },
    acceleration: {
      requestedFactor: 12,
      fidelityFloor: 0.9,
    },
    compression: {
      codec: 'content-addressed',
      restoreRequired: true,
    },
  },
  evidence: [{
    type: 'integration-test',
    id: 'rncs-foundation-native-meta-batch-b',
  }],
};

let preparedFixture;

function prepared() {
  preparedFixture ??= prepareFoundationNativeMetaRncsTransition(REQUEST);
  return preparedFixture;
}

function assertBridgeError(code, callback) {
  assert.throws(
    callback,
    error => (
      error instanceof RclFoundationRncsBridgeError
      && error.code === code
    ),
  );
}

test('Meta Batch B becomes one valid RNCS proposal with bound semantic state', { timeout: 300_000 }, () => {
  const value = prepared();
  const verification = verifyFoundationNativeRncsTransition(value);
  assert.equal(verification.ok, true);
  assert.equal(verification.batch, RCL_FOUNDATION_RNCS_META_BATCH_B);
  assert.equal(value.status, 'proposed');
  assert.equal(value.execution.results.length, 3);
  assert.equal(value.envelope.phase, 'proposed');
  assert.deepEqual(
    value.envelope.provisional_delta.operations.map(item => item.path),
    [
      'foundation.meta-spacetime',
      'foundation.meta-acceleration',
      'foundation.meta-compression',
    ],
  );
  assert.equal(
    value.envelope.provisional_delta.operations.every(
      item => /^[a-f0-9]{64}$/.test(item.semantic_parameters_root),
    ),
    true,
  );
  assert.equal(
    value.envelope.provisional_delta.operations[1]
      .semantic_parameters.acceleration.fidelityFloor,
    '0.9',
  );
  assert.equal(
    value.envelope.foundation_governance.semanticContract.stateRoot,
    value.roots.semanticStateRoot,
  );
  assert.equal(
    value.envelope.extensions.rclFoundationNativeBridge.semanticStateRoot,
    value.roots.semanticStateRoot,
  );
  assert.equal(
    value.envelope.foundation_governance.providerCapabilities.required.length,
    3,
  );
  assert.equal(
    value.envelope.foundation_governance.invariants
      .some(item => item.name === 'meta-compression-lossless-restore'),
    true,
  );
});

test('same Meta execution compiles to the same RNCS proposal and receipt roots', { timeout: 300_000 }, () => {
  const first = prepared();
  const second = prepareFoundationNativeRncsTransition(REQUEST, {
    batch: RCL_FOUNDATION_RNCS_META_BATCH_B,
  });
  assert.equal(
    first.execution.deterministicReceiptRoot,
    second.execution.deterministicReceiptRoot,
  );
  assert.equal(first.envelope.proposal_root, second.envelope.proposal_root);
  assert.equal(first.envelope.envelope_root, second.envelope.envelope_root);
  assert.equal(first.roots.semanticStateRoot, second.roots.semanticStateRoot);
  assert.equal(
    foundationNativeRncsReceiptRoot(first),
    foundationNativeRncsReceiptRoot(second),
  );
});

test('tampering native semantic parameters breaks RNCS delta and semantic roots', { timeout: 300_000 }, () => {
  const tampered = structuredClone(prepared());
  tampered.execution.results[1]
    .proposal.parameters.acceleration.effectiveFactor = 7;
  const verification = verifyFoundationNativeRncsTransition(tampered);
  assert.equal(verification.ok, false);
  assert.equal(
    verification.errors.includes('SEMANTIC_PARAMETERS_BINDING_MISMATCH:2'),
    true,
  );
  assert.equal(
    verification.errors.includes('META_ACCELERATION_SEMANTICS_INVALID'),
    true,
  );
  assert.equal(
    verification.errors.includes('META_SEMANTIC_STATE_ROOT_MISMATCH'),
    true,
  );
  assertBridgeError(
    'RNCS_FOUNDATION_BRIDGE_INVALID',
    () => authorizeFoundationNativeRncsTransition(tampered, {
      approved: true,
      roles: ['owner'],
    }),
  );
});

test('resealing a different semantic contract cannot pass bridge authorization', { timeout: 300_000 }, () => {
  const tampered = structuredClone(prepared());
  tampered.envelope.foundation_governance.semanticContract.stateRoot = (
    'f'.repeat(64)
  );
  tampered.envelope.proposal_root = rootHash(
    proposalPayload(tampered.envelope),
  );
  tampered.envelope = reseal(tampered.envelope);
  const verification = verifyFoundationNativeRncsTransition(tampered);
  assert.equal(verification.ok, false);
  assert.equal(
    verification.errors.includes('META_SEMANTIC_STATE_ROOT_MISMATCH'),
    true,
  );
  assertBridgeError(
    'RNCS_FOUNDATION_BRIDGE_INVALID',
    () => authorizeFoundationNativeRncsTransition(tampered, {
      approved: true,
      roles: ['reviewer'],
    }),
  );
});

test('human approval and commit confirmation advance the verified Meta generation', { timeout: 300_000 }, () => {
  const value = prepared();
  assertBridgeError(
    'RNCS_FOUNDATION_HUMAN_APPROVAL_REQUIRED',
    () => authorizeFoundationNativeRncsTransition(value, {
      approved: false,
    }),
  );
  const authorized = authorizeFoundationNativeRncsTransition(value, {
    approved: true,
    roles: ['owner'],
    resolver: 'test-meta-owner',
  });
  assertBridgeError(
    'RNCS_FOUNDATION_COMMIT_CONFIRMATION_REQUIRED',
    () => commitFoundationNativeRncsTransition(authorized, {
      confirmed: false,
    }),
  );
  assertBridgeError(
    'RNCS_FOUNDATION_COMMIT_ROOT_DIVERGENCE',
    () => commitFoundationNativeRncsTransition(authorized, {
      confirmed: true,
      generationRoot: '0'.repeat(64),
    }),
  );
  const committed = commitFoundationNativeRncsTransition(authorized, {
    confirmed: true,
  });
  assert.equal(committed.status, 'committed');
  assert.equal(committed.envelope.phase, 'committed');
  assert.equal(
    committed.envelope.commit.result_generation.generation_root,
    value.execution.finalStateRoot,
  );
  assert.deepEqual(
    committed.envelope.commit.receipt_refs,
    [value.roots.receiptRoot],
  );
  assert.equal(verifyFoundationNativeRncsTransition(committed).ok, true);
});

test('Meta provider, semantic, authority, AIF, and evidence failures stay outside RNCS', { timeout: 300_000 }, () => {
  assert.throws(
    () => prepareFoundationNativeMetaRncsTransition({
      ...REQUEST,
      authorized: false,
    }),
    error => error.code === 'RCL_FOUNDATION_AUTHORITY_DENIED',
  );
  assert.throws(
    () => prepareFoundationNativeMetaRncsTransition({
      ...REQUEST,
      aifDecision: 'unstable',
    }),
    error => error.code === 'RCL_FOUNDATION_AIF_REJECTED',
  );
  assert.throws(
    () => prepareFoundationNativeMetaRncsTransition({
      ...REQUEST,
      evidence: [],
    }),
    error => error.code === 'RCL_FOUNDATION_EVIDENCE_REQUIRED',
  );
  assert.throws(
    () => prepareFoundationNativeMetaRncsTransition({
      ...REQUEST,
      input: {
        ...REQUEST.input,
        compression: {
          codec: 'content-addressed',
          restoreRequired: false,
        },
      },
    }),
    error => error.code === 'RCL_FOUNDATION_META_COMPRESSION_INVALID',
  );
  assert.throws(
    () => prepareFoundationNativeMetaRncsTransition(
      REQUEST,
      { native: { disableProvider: true } },
    ),
    error => error.code === 'RCL_NATIVE_PROVIDER_MISSING',
  );
  assertBridgeError(
    'RNCS_FOUNDATION_BATCH_UNSUPPORTED',
    () => prepareFoundationNativeRncsTransition(REQUEST, {
      batch: 'imaginary-batch',
    }),
  );
});

test('inspect counterfactual changes actions, semantic state, and RNCS proposal', { timeout: 300_000 }, () => {
  const create = prepared();
  const inspect = prepareFoundationNativeMetaRncsTransition({
    ...REQUEST,
    input: {
      ...REQUEST.input,
      speechAct: 'inspect',
    },
  });
  assert.deepEqual(
    inspect.execution.results.map(item => item.proposal.selectedAction),
    [
      'inspect-causal-timeline',
      'measure-safe-acceleration',
      'verify-lossless-restore',
    ],
  );
  assert.equal(
    inspect.envelope.provisional_delta.operations[0]
      .semantic_parameters.timeline.tickAfter,
    REQUEST.input.timeline.tick,
  );
  assert.equal(
    inspect.envelope.provisional_delta.operations[1]
      .semantic_parameters.acceleration.effectiveFactor,
    1,
  );
  assert.notEqual(
    create.execution.finalStateRoot,
    inspect.execution.finalStateRoot,
  );
  assert.notEqual(create.roots.semanticStateRoot, inspect.roots.semanticStateRoot);
  assert.notEqual(create.envelope.proposal_root, inspect.envelope.proposal_root);
});
