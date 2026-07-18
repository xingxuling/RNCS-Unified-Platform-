import {
  FOUNDATION_NATIVE_BATCH_A,
  FOUNDATION_NATIVE_PROVIDER_ID,
  runFoundationNativeBatchA,
} from '../../../languages/reality-computation-language/src/foundation-native-bridge.mjs';
import {
  authorize,
  commit,
  newProposal,
  rootHash,
  verify,
} from '../../../kernel/rncs-core-contract/src/index.mjs';

export const RCL_FOUNDATION_RNCS_BRIDGE_FORMAT = 'rncs.rcl-foundation-native-bridge.v0.1';
export const RCL_FOUNDATION_RNCS_BRIDGE_VERSION = '0.1.0-alpha.1';

export class RclFoundationRncsBridgeError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RclFoundationRncsBridgeError';
    this.code = code;
    this.details = details;
  }
}

function stableId(prefix, root) {
  return `${prefix}:${root.slice(0, 32)}`;
}

function uniqueSorted(values) {
  return [...new Set(values.map(String))].sort((left, right) => Buffer.compare(
    Buffer.from(left, 'utf8'),
    Buffer.from(right, 'utf8'),
  ));
}

function assertHexRoot(value, label) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
    throw new RclFoundationRncsBridgeError('RNCS_FOUNDATION_ROOT_INVALID', `${label} must be a SHA-256 root`);
  }
}

function buildFoundationGovernance(execution) {
  const authorityScopes = uniqueSorted(execution.results.flatMap(item => item.authorityRequired));
  return {
    explicitVariables: [
      { name: 'rcl.request_root', value: execution.requestRoot },
      { name: 'rcl.bytecode_root', value: execution.bytecodeRoot },
      { name: 'rcl.final_state_root', value: execution.finalStateRoot },
    ],
    uncertainty: {
      status: 'bounded-by-native-provider-results',
      variables: execution.results.map(item => ({
        domain: item.domain,
        confidence: Number(item.confidence).toFixed(2),
      })),
    },
    providerCapabilities: {
      required: execution.results.map(item => ({
        provider: FOUNDATION_NATIVE_PROVIDER_ID,
        capability: item.replayMetadata.capability,
        mode: 'bridge',
        status: 'verified',
      })),
      externalSideEffects: false,
      providerAbi: execution.providerHost.providerAbi,
    },
    authorityRequirements: authorityScopes.map(scope => ({
      action: 'commit-foundation-candidate',
      scope,
      riskLevel: 'high',
    })),
    irreversibleEffects: [{
      effect: 'advance-rncs-generation',
      reversible: false,
      status: 'pending-human-confirmation',
    }],
    invariants: [
      {
        name: 'native-receipt-bound',
        expected: execution.deterministicReceiptRoot,
      },
      {
        name: 'causal-chain-contiguous',
        expected: 'all beforeRoot values equal the preceding afterRoot',
      },
      {
        name: 'standard-result-format',
        expected: 'taowind.rcl-foundation-runtime-result.v0.1',
      },
    ],
    adaptiveInvariantField: {
      enabled: true,
      mode: 'native-provider-result-gate',
      version: 1,
      active: ['authority', 'evidence', 'causal-order', 'stable-aif'],
    },
    causalParents: execution.results.map(item => ({
      domain: item.domain,
      root: item.stateDelta.beforeRoot,
      relation: 'precedes',
    })),
    evidenceRequirements: [{
      kind: 'rcl-foundation-native-receipt',
      root: execution.deterministicReceiptRoot,
      required: true,
    }],
    nativeReceipt: {
      providerId: FOUNDATION_NATIVE_PROVIDER_ID,
      providerAbi: execution.providerHost.providerAbi,
      bytecodeVersion: execution.bytecodeVersion,
      bytecodeRoot: execution.bytecodeRoot,
      receiptRoot: execution.deterministicReceiptRoot,
      finalStateRoot: execution.finalStateRoot,
      replayVerified: execution.replayVerified,
    },
  };
}

function buildProposalInput(execution, options) {
  const receiptRoot = execution.deterministicReceiptRoot;
  const baseGenerationRoot = options.baseGenerationRoot ?? execution.request.causalParents[0];
  assertHexRoot(baseGenerationRoot, 'baseGenerationRoot');
  const authorityScopes = uniqueSorted(execution.results.flatMap(item => item.authorityRequired));
  const transitionId = options.transitionId ?? stableId('transition:rcl-foundation', receiptRoot);
  const subject = options.subject ?? {
    subject_id: 'subject:rncs-human-operator',
    kind: 'human',
    roles: ['owner'],
    responsibility_boundary: 'foundation-candidate-authorization',
  };
  const evidenceId = stableId('evidence:rcl-foundation', receiptRoot);

  return {
    transition_id: transitionId,
    reality_id: options.realityId ?? 'reality:foundation-native-batch-a',
    base_generation: options.baseGeneration ?? 0,
    base_generation_root: baseGenerationRoot,
    subject,
    intent: {
      intent_id: stableId('intent:rcl-foundation', receiptRoot),
      source: 'rcl-foundation-native-provider',
      goals: ['review-foundation-candidate', execution.finalCandidate.selectedAction],
      constraints: ['proposal-only', 'human-authority-required', 'aif-stable'],
    },
    capability_plan: {
      plan_id: stableId('plan:rcl-foundation', receiptRoot),
      capabilities: execution.results.map(item => ({
        provider: FOUNDATION_NATIVE_PROVIDER_ID,
        capability: item.replayMetadata.capability,
        result_root: item.stateDelta.afterRoot,
      })),
      host_bindings: [{
        provider_id: FOUNDATION_NATIVE_PROVIDER_ID,
        provider_abi: execution.providerHost.providerAbi,
        host: 'native/rclfoundation',
      }],
      required_scopes: authorityScopes,
    },
    inputs: [{
      kind: 'rcl-foundation-native-request',
      request_root: execution.requestRoot,
      receipt_root: receiptRoot,
    }],
    provisional_delta: {
      operations: execution.results.map((item, index) => ({
        op: 'propose',
        sequence: index + 1,
        path: `foundation.${item.domain}`,
        before_root: item.stateDelta.beforeRoot,
        after_root: item.stateDelta.afterRoot,
        selected_action: item.proposal.selectedAction,
      })),
    },
    causal_basis: {
      events: execution.results.map((item, index) => ({
        sequence: index + 1,
        domain: item.domain,
        before_root: item.stateDelta.beforeRoot,
        after_root: item.stateDelta.afterRoot,
      })),
      rules: ['rcl-foundation-native-batch-a', 'rncs-foundation-human-authority'],
      simulation_refs: [receiptRoot],
    },
    evidence: {
      nodes: [{
        evidence_id: evidenceId,
        kind: 'rcl-foundation-native-receipt',
        source: FOUNDATION_NATIVE_PROVIDER_ID,
        request_root: execution.requestRoot,
        bytecode_root: execution.bytecodeRoot,
        receipt_root: receiptRoot,
        final_state_root: execution.finalStateRoot,
        domains: execution.results.map(item => item.domain),
        mode: 'bridge',
      }],
      edges: [{
        from: evidenceId,
        to: transitionId,
        relation: 'supports',
      }],
    },
    foundation_governance: buildFoundationGovernance(execution),
    extensions: {
      rclFoundationNativeBridge: {
        format: execution.format,
        mode: execution.mode,
        providerId: FOUNDATION_NATIVE_PROVIDER_ID,
        receiptRoot,
        finalStateRoot: execution.finalStateRoot,
      },
    },
  };
}

function assertBridgeValue(value, expectedStatus) {
  if (!value || value.format !== RCL_FOUNDATION_RNCS_BRIDGE_FORMAT) {
    throw new RclFoundationRncsBridgeError('RNCS_FOUNDATION_BRIDGE_FORMAT', 'Invalid RCL Foundation RNCS bridge value');
  }
  if (expectedStatus && value.status !== expectedStatus) {
    throw new RclFoundationRncsBridgeError(
      'RNCS_FOUNDATION_BRIDGE_PHASE',
      `Expected ${expectedStatus}, received ${value.status}`,
    );
  }
  const verification = verifyFoundationNativeRncsTransition(value);
  if (!verification.ok) {
    throw new RclFoundationRncsBridgeError(
      'RNCS_FOUNDATION_BRIDGE_INVALID',
      verification.errors.join(', '),
      verification,
    );
  }
}

export function prepareFoundationNativeRncsTransition(request = {}, options = {}) {
  const execution = runFoundationNativeBatchA(request, options.native ?? {});
  const proposal = newProposal(buildProposalInput(execution, options));
  const proposalVerification = verify(proposal);
  if (!proposalVerification.valid) {
    throw new RclFoundationRncsBridgeError(
      'RNCS_FOUNDATION_PROPOSAL_INVALID',
      proposalVerification.errors.join(', '),
    );
  }
  const value = {
    format: RCL_FOUNDATION_RNCS_BRIDGE_FORMAT,
    version: RCL_FOUNDATION_RNCS_BRIDGE_VERSION,
    status: 'proposed',
    execution,
    envelope: proposal,
    roots: {
      receiptRoot: execution.deterministicReceiptRoot,
      proposalRoot: proposal.proposal_root,
      finalStateRoot: execution.finalStateRoot,
    },
  };
  assertBridgeValue(value, 'proposed');
  return value;
}

export function authorizeFoundationNativeRncsTransition(prepared, approval = {}) {
  assertBridgeValue(prepared, 'proposed');
  if (approval.approved !== true) {
    throw new RclFoundationRncsBridgeError(
      'RNCS_FOUNDATION_HUMAN_APPROVAL_REQUIRED',
      'A human authority must explicitly approve the Foundation candidate',
    );
  }
  const roles = uniqueSorted(approval.roles ?? []);
  if (!roles.some(role => ['owner', 'operator', 'reviewer'].includes(role))) {
    throw new RclFoundationRncsBridgeError(
      'RNCS_FOUNDATION_APPROVER_ROLE_REQUIRED',
      'Approval requires an owner, operator, or reviewer role',
    );
  }
  const envelope = authorize(prepared.envelope, {
    status: 'approved',
    resolver: approval.resolver ?? 'human-foundation-review',
    claims: [
      { type: 'rcl-foundation-native-receipt', root: prepared.roots.receiptRoot },
      { type: 'human-approval-roles', roles },
    ],
    constraints: [{
      type: 'commit-confirmation-required',
      final_state_root: prepared.roots.finalStateRoot,
    }],
    reason: approval.reason ?? 'Foundation Native candidate approved for bounded RNCS commit',
  });
  const value = { ...prepared, status: 'authorized', envelope };
  assertBridgeValue(value, 'authorized');
  return value;
}

export function commitFoundationNativeRncsTransition(authorized, confirmation = {}) {
  assertBridgeValue(authorized, 'authorized');
  if (confirmation.confirmed !== true) {
    throw new RclFoundationRncsBridgeError(
      'RNCS_FOUNDATION_COMMIT_CONFIRMATION_REQUIRED',
      'RNCS commit requires an explicit confirmation separate from proposal approval',
    );
  }
  const generation = confirmation.generation ?? authorized.envelope.base_generation.generation + 1;
  const generationRoot = confirmation.generationRoot ?? authorized.roots.finalStateRoot;
  assertHexRoot(generationRoot, 'generationRoot');
  if (generationRoot !== authorized.roots.finalStateRoot) {
    throw new RclFoundationRncsBridgeError(
      'RNCS_FOUNDATION_COMMIT_ROOT_DIVERGENCE',
      'The committed generation root must equal the verified Foundation final state root',
    );
  }
  const envelope = commit(authorized.envelope, {
    generation,
    generation_root: generationRoot,
    receipt_refs: [authorized.roots.receiptRoot],
  });
  const value = { ...authorized, status: 'committed', envelope };
  assertBridgeValue(value, 'committed');
  return value;
}

export function verifyFoundationNativeRncsTransition(value) {
  const errors = [];
  if (!value || value.format !== RCL_FOUNDATION_RNCS_BRIDGE_FORMAT) {
    return { ok: false, errors: ['BRIDGE_FORMAT_INVALID'] };
  }
  if (value.version !== RCL_FOUNDATION_RNCS_BRIDGE_VERSION) errors.push('BRIDGE_VERSION_INVALID');
  if (!['proposed', 'authorized', 'committed'].includes(value.status)) errors.push('BRIDGE_STATUS_INVALID');
  const envelopeVerification = verify(value.envelope);
  if (!envelopeVerification.valid) errors.push(...envelopeVerification.errors);
  if (value.execution?.mode !== 'bridge') errors.push('RCL_MODE_NOT_BRIDGE');
  if (value.execution?.providerHost?.providerId !== FOUNDATION_NATIVE_PROVIDER_ID) errors.push('RCL_PROVIDER_ID_INVALID');
  if (value.execution?.results?.length !== FOUNDATION_NATIVE_BATCH_A.length) errors.push('RCL_RESULT_COUNT_INVALID');
  if (value.execution?.replayVerified !== true) errors.push('RCL_REPLAY_NOT_VERIFIED');
  if (value.roots?.receiptRoot !== value.execution?.deterministicReceiptRoot) errors.push('RECEIPT_ROOT_MISMATCH');
  if (value.roots?.proposalRoot !== value.envelope?.proposal_root) errors.push('PROPOSAL_ROOT_MISMATCH');
  if (value.roots?.finalStateRoot !== value.execution?.finalStateRoot) errors.push('FINAL_STATE_ROOT_MISMATCH');
  if (
    value.envelope?.foundation_governance?.nativeReceipt?.receiptRoot
    !== value.roots?.receiptRoot
  ) errors.push('GOVERNANCE_RECEIPT_ROOT_MISMATCH');
  const operations = value.envelope?.provisional_delta?.operations ?? [];
  if (operations.length !== value.execution?.results?.length) {
    errors.push('RESULT_DELTA_COUNT_MISMATCH');
  } else {
    for (let index = 0; index < operations.length; index++) {
      const operation = operations[index];
      const result = value.execution.results[index];
      if (
        operation.sequence !== index + 1
        || operation.path !== `foundation.${result.domain}`
        || operation.before_root !== result.stateDelta.beforeRoot
        || operation.after_root !== result.stateDelta.afterRoot
        || operation.selected_action !== result.proposal.selectedAction
      ) {
        errors.push(`RESULT_DELTA_BINDING_MISMATCH:${index + 1}`);
      }
    }
  }
  if (value.status === 'proposed' && value.envelope?.phase !== 'proposed') errors.push('PROPOSAL_PHASE_MISMATCH');
  if (value.status === 'authorized' && value.envelope?.phase !== 'authorized') errors.push('AUTHORITY_PHASE_MISMATCH');
  if (value.status === 'committed') {
    if (value.envelope?.phase !== 'committed') errors.push('COMMIT_PHASE_MISMATCH');
    if (value.envelope?.commit?.result_generation?.generation_root !== value.roots?.finalStateRoot) {
      errors.push('COMMIT_FINAL_STATE_ROOT_MISMATCH');
    }
    if (!value.envelope?.commit?.receipt_refs?.includes(value.roots?.receiptRoot)) {
      errors.push('COMMIT_RECEIPT_MISSING');
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    status: value.status,
    envelopeRoot: value.envelope?.envelope_root ?? null,
    proposalRoot: value.envelope?.proposal_root ?? null,
    receiptRoot: value.roots?.receiptRoot ?? null,
  };
}

export function foundationNativeRncsReceiptRoot(value) {
  assertBridgeValue(value);
  return rootHash({
    format: value.format,
    version: value.version,
    status: value.status,
    receiptRoot: value.roots.receiptRoot,
    proposalRoot: value.envelope.proposal_root,
    envelopeRoot: value.envelope.envelope_root,
    finalStateRoot: value.roots.finalStateRoot,
  });
}
