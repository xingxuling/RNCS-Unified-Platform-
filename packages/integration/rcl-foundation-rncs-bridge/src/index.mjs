import {
  FOUNDATION_NATIVE_BATCH_A,
  FOUNDATION_NATIVE_PROVIDER_ID,
  runFoundationNativeBatchA,
} from '../../../languages/reality-computation-language/src/foundation-native-bridge.mjs';
import {
  FOUNDATION_NATIVE_META_BATCH_B,
  FOUNDATION_NATIVE_META_PROVIDER_ID,
  runFoundationNativeMetaBatchB,
} from '../../../languages/reality-computation-language/src/foundation-native-meta-bridge.mjs';
import {
  authorize,
  commit,
  newProposal,
  rootHash,
  verify,
} from '../../../kernel/rncs-core-contract/src/index.mjs';

export const RCL_FOUNDATION_RNCS_BRIDGE_FORMAT =
  'rncs.rcl-foundation-native-bridge.v0.1';
export const RCL_FOUNDATION_RNCS_BRIDGE_VERSION = '0.2.0-alpha.1';
export const RCL_FOUNDATION_RNCS_BATCH_A = 'batch-a';
export const RCL_FOUNDATION_RNCS_META_BATCH_B = 'meta-batch-b';

const BATCHES = Object.freeze({
  [RCL_FOUNDATION_RNCS_BATCH_A]: Object.freeze({
    id: RCL_FOUNDATION_RNCS_BATCH_A,
    providerId: FOUNDATION_NATIVE_PROVIDER_ID,
    entries: FOUNDATION_NATIVE_BATCH_A,
    run: runFoundationNativeBatchA,
    realityId: 'reality:foundation-native-batch-a',
    rule: 'rcl-foundation-native-batch-a',
  }),
  [RCL_FOUNDATION_RNCS_META_BATCH_B]: Object.freeze({
    id: RCL_FOUNDATION_RNCS_META_BATCH_B,
    providerId: FOUNDATION_NATIVE_META_PROVIDER_ID,
    entries: FOUNDATION_NATIVE_META_BATCH_B,
    run: runFoundationNativeMetaBatchB,
    realityId: 'reality:foundation-native-meta-batch-b',
    rule: 'rcl-foundation-native-meta-batch-b',
  }),
});

export const RCL_FOUNDATION_RNCS_BATCHES = Object.freeze(
  Object.fromEntries(Object.values(BATCHES).map(batch => [
    batch.id,
    Object.freeze({
      id: batch.id,
      providerId: batch.providerId,
      resultCount: batch.entries.length,
      domains: Object.freeze(batch.entries.map(entry => entry.domain)),
    }),
  ])),
);

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
    throw new RclFoundationRncsBridgeError(
      'RNCS_FOUNDATION_ROOT_INVALID',
      `${label} must be a SHA-256 root`,
    );
  }
}

function rncsHashable(value, path = 'value') {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new RclFoundationRncsBridgeError(
        'RNCS_FOUNDATION_SEMANTIC_NUMBER_INVALID',
        `${path} must be finite`,
      );
    }
    return Number.isSafeInteger(value) ? value : value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => rncsHashable(
      item,
      `${path}[${index}]`,
    ));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      rncsHashable(item, `${path}.${key}`),
    ]));
  }
  throw new RclFoundationRncsBridgeError(
    'RNCS_FOUNDATION_SEMANTIC_VALUE_INVALID',
    `${path} contains unsupported ${typeof value} data`,
  );
}

function resolveBatch(selection = RCL_FOUNDATION_RNCS_BATCH_A) {
  const normalized = selection ?? RCL_FOUNDATION_RNCS_BATCH_A;
  const batch = BATCHES[normalized]
    ?? Object.values(BATCHES).find(item => item.providerId === normalized);
  if (!batch) {
    throw new RclFoundationRncsBridgeError(
      'RNCS_FOUNDATION_BATCH_UNSUPPORTED',
      `Unsupported RCL Foundation Native batch: ${normalized}`,
      { supported: Object.keys(BATCHES) },
    );
  }
  return batch;
}

function batchForExecution(execution) {
  return Object.values(BATCHES).find(
    batch => batch.providerId === execution?.providerHost?.providerId,
  ) ?? null;
}

function metaSemanticState(execution) {
  if (
    execution?.providerHost?.providerId
    !== FOUNDATION_NATIVE_META_PROVIDER_ID
  ) {
    return null;
  }
  const [spacetime, acceleration, compression] = execution.results;
  return rncsHashable({
    timeline: spacetime.proposal.parameters.timeline,
    acceleration: acceleration.proposal.parameters.acceleration,
    compression: compression.proposal.parameters.compression,
  });
}

function semanticResultBindings(execution) {
  return execution.results
    .filter(result => result.proposal.parameters !== undefined)
    .map(result => ({
      domain: result.domain,
      parametersRoot: rootHash(rncsHashable(result.proposal.parameters)),
      afterRoot: result.stateDelta.afterRoot,
    }));
}

function buildFoundationGovernance(execution, batch) {
  const authorityScopes = uniqueSorted(
    execution.results.flatMap(item => item.authorityRequired),
  );
  const semanticState = metaSemanticState(execution);
  const explicitVariables = [
    { name: 'rcl.request_root', value: execution.requestRoot },
    { name: 'rcl.bytecode_root', value: execution.bytecodeRoot },
    { name: 'rcl.final_state_root', value: execution.finalStateRoot },
  ];
  if (semanticState) {
    explicitVariables.push(
      {
        name: 'meta.timeline.tick_after',
        value: semanticState.timeline.tickAfter,
      },
      {
        name: 'meta.acceleration.effective_factor',
        value: semanticState.acceleration.effectiveFactor,
      },
      {
        name: 'meta.compression.restore_root',
        value: semanticState.compression.restoreRoot,
      },
    );
  }

  const invariants = [
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
  ];
  if (semanticState) {
    invariants.push(
      {
        name: 'meta-spacetime-causal-order',
        expected: (
          `${semanticState.timeline.tickBefore}`
          + `<=${semanticState.timeline.tickAfter}`
        ),
      },
      {
        name: 'meta-acceleration-bounded',
        expected: (
          `effectiveFactor<=${semanticState.acceleration.maximumFactor}`
        ),
      },
      {
        name: 'meta-compression-lossless-restore',
        expected: semanticState.compression.restoreRoot,
      },
    );
  }

  return {
    explicitVariables,
    uncertainty: {
      status: 'bounded-by-native-provider-results',
      variables: execution.results.map(item => ({
        domain: item.domain,
        confidence: Number(item.confidence).toFixed(2),
      })),
    },
    providerCapabilities: {
      required: execution.results.map(item => ({
        provider: batch.providerId,
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
    invariants,
    adaptiveInvariantField: {
      enabled: true,
      mode: 'native-provider-result-gate',
      version: 1,
      active: [
        'authority',
        'evidence',
        'causal-order',
        'stable-aif',
        ...(semanticState ? [
          'meta-spacetime-order',
          'meta-acceleration-bound',
          'meta-compression-restore',
        ] : []),
      ],
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
      providerId: batch.providerId,
      providerAbi: execution.providerHost.providerAbi,
      bytecodeVersion: execution.bytecodeVersion,
      bytecodeRoot: execution.bytecodeRoot,
      receiptRoot: execution.deterministicReceiptRoot,
      finalStateRoot: execution.finalStateRoot,
      replayVerified: execution.replayVerified,
      ...(semanticState ? { batchId: batch.id } : {}),
    },
    ...(semanticState ? {
      semanticContract: {
        batchId: batch.id,
        stateRoot: rootHash(semanticState),
        resultBindings: semanticResultBindings(execution),
      },
    } : {}),
  };
}

function resultOperation(item, index) {
  const operation = {
    op: 'propose',
    sequence: index + 1,
    path: `foundation.${item.domain}`,
    before_root: item.stateDelta.beforeRoot,
    after_root: item.stateDelta.afterRoot,
    selected_action: item.proposal.selectedAction,
  };
  if (item.proposal.parameters !== undefined) {
    operation.semantic_parameters = rncsHashable(item.proposal.parameters);
    operation.semantic_parameters_root = rootHash(
      operation.semantic_parameters,
    );
  }
  return operation;
}

function buildProposalInput(execution, options, batch) {
  const receiptRoot = execution.deterministicReceiptRoot;
  const baseGenerationRoot = (
    options.baseGenerationRoot
    ?? execution.request.causalParents[0]
  );
  assertHexRoot(baseGenerationRoot, 'baseGenerationRoot');
  const authorityScopes = uniqueSorted(
    execution.results.flatMap(item => item.authorityRequired),
  );
  const transitionId = (
    options.transitionId
    ?? stableId('transition:rcl-foundation', receiptRoot)
  );
  const subject = options.subject ?? {
    subject_id: 'subject:rncs-human-operator',
    kind: 'human',
    roles: ['owner'],
    responsibility_boundary: 'foundation-candidate-authorization',
  };
  const evidenceId = stableId('evidence:rcl-foundation', receiptRoot);
  const semanticState = metaSemanticState(execution);
  const extension = {
    format: execution.format,
    mode: execution.mode,
    providerId: batch.providerId,
    receiptRoot,
    finalStateRoot: execution.finalStateRoot,
  };
  if (semanticState) {
    extension.batchId = batch.id;
    extension.semanticStateRoot = rootHash(semanticState);
  }

  return {
    transition_id: transitionId,
    reality_id: options.realityId ?? batch.realityId,
    base_generation: options.baseGeneration ?? 0,
    base_generation_root: baseGenerationRoot,
    subject,
    intent: {
      intent_id: stableId('intent:rcl-foundation', receiptRoot),
      source: 'rcl-foundation-native-provider',
      goals: [
        'review-foundation-candidate',
        execution.finalCandidate.selectedAction,
      ],
      constraints: [
        'proposal-only',
        'human-authority-required',
        'aif-stable',
      ],
    },
    capability_plan: {
      plan_id: stableId('plan:rcl-foundation', receiptRoot),
      capabilities: execution.results.map(item => ({
        provider: batch.providerId,
        capability: item.replayMetadata.capability,
        result_root: item.stateDelta.afterRoot,
      })),
      host_bindings: [{
        provider_id: batch.providerId,
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
      operations: execution.results.map(resultOperation),
    },
    causal_basis: {
      events: execution.results.map((item, index) => ({
        sequence: index + 1,
        domain: item.domain,
        before_root: item.stateDelta.beforeRoot,
        after_root: item.stateDelta.afterRoot,
      })),
      rules: [batch.rule, 'rncs-foundation-human-authority'],
      simulation_refs: [receiptRoot],
    },
    evidence: {
      nodes: [{
        evidence_id: evidenceId,
        kind: 'rcl-foundation-native-receipt',
        source: batch.providerId,
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
    foundation_governance: buildFoundationGovernance(execution, batch),
    extensions: {
      rclFoundationNativeBridge: extension,
    },
  };
}

function assertBridgeValue(value, expectedStatus) {
  if (!value || value.format !== RCL_FOUNDATION_RNCS_BRIDGE_FORMAT) {
    throw new RclFoundationRncsBridgeError(
      'RNCS_FOUNDATION_BRIDGE_FORMAT',
      'Invalid RCL Foundation RNCS bridge value',
    );
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

export function prepareFoundationNativeRncsTransition(
  request = {},
  options = {},
) {
  const batch = resolveBatch(
    options.batch
    ?? options.nativeBatch
    ?? RCL_FOUNDATION_RNCS_BATCH_A,
  );
  const execution = batch.run(request, options.native ?? {});
  const proposal = newProposal(buildProposalInput(execution, options, batch));
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
      ...(batch.id === RCL_FOUNDATION_RNCS_META_BATCH_B ? {
        semanticStateRoot: rootHash(metaSemanticState(execution)),
      } : {}),
    },
  };
  assertBridgeValue(value, 'proposed');
  return value;
}

export function prepareFoundationNativeMetaRncsTransition(
  request = {},
  options = {},
) {
  return prepareFoundationNativeRncsTransition(request, {
    ...options,
    batch: RCL_FOUNDATION_RNCS_META_BATCH_B,
  });
}

export function authorizeFoundationNativeRncsTransition(
  prepared,
  approval = {},
) {
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
      {
        type: 'rcl-foundation-native-receipt',
        root: prepared.roots.receiptRoot,
      },
      { type: 'human-approval-roles', roles },
    ],
    constraints: [{
      type: 'commit-confirmation-required',
      final_state_root: prepared.roots.finalStateRoot,
    }],
    reason: (
      approval.reason
      ?? 'Foundation Native candidate approved for bounded RNCS commit'
    ),
  });
  const value = { ...prepared, status: 'authorized', envelope };
  assertBridgeValue(value, 'authorized');
  return value;
}

export function commitFoundationNativeRncsTransition(
  authorized,
  confirmation = {},
) {
  assertBridgeValue(authorized, 'authorized');
  if (confirmation.confirmed !== true) {
    throw new RclFoundationRncsBridgeError(
      'RNCS_FOUNDATION_COMMIT_CONFIRMATION_REQUIRED',
      'RNCS commit requires an explicit confirmation separate from proposal approval',
    );
  }
  const generation = (
    confirmation.generation
    ?? authorized.envelope.base_generation.generation + 1
  );
  const generationRoot = (
    confirmation.generationRoot
    ?? authorized.roots.finalStateRoot
  );
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

function verifyMetaSemantics(execution, errors) {
  const [spacetime, acceleration, compression] = execution.results ?? [];
  const input = execution.request?.input;
  const createMode = ['create', 'generate', 'build'].includes(input?.speechAct);
  const timeline = spacetime?.proposal?.parameters?.timeline;
  const accelerationState = (
    acceleration?.proposal?.parameters?.acceleration
  );
  const compressionState = (
    compression?.proposal?.parameters?.compression
  );
  if (
    timeline?.ordering !== 'causal'
    || timeline?.tickBefore !== input?.timeline?.tick
    || timeline?.tickAfter !== (
      createMode
        ? input?.timeline?.tick + input?.timeline?.eventCount
        : input?.timeline?.tick
    )
    || timeline?.observerFrame !== input?.timeline?.observerFrame
    || timeline?.mutationApplied !== createMode
  ) {
    errors.push('META_SPACETIME_SEMANTICS_INVALID');
  }
  if (
    accelerationState?.requestedFactor
      !== input?.acceleration?.requestedFactor
    || accelerationState?.effectiveFactor !== (
      createMode
        ? Math.min(input?.acceleration?.requestedFactor, 8)
        : 1
    )
    || accelerationState?.maximumFactor !== 8
    || accelerationState?.fidelityFloor
      !== input?.acceleration?.fidelityFloor
    || accelerationState?.fidelityPreserved !== true
    || accelerationState?.mutationApplied !== createMode
  ) {
    errors.push('META_ACCELERATION_SEMANTICS_INVALID');
  }
  if (
    compressionState?.sourceTextBytes !== 64
    || compressionState?.compressedBytes !== 32
    || compressionState?.reversible !== true
    || compressionState?.restoreRequired !== true
    || compressionState?.sourceRoot !== compression?.stateDelta?.beforeRoot
    || compressionState?.restoreRoot !== compressionState?.sourceRoot
    || compressionState?.restoreVerified !== true
    || compressionState?.mutationApplied !== createMode
  ) {
    errors.push('META_COMPRESSION_SEMANTICS_INVALID');
  }
}

export function verifyFoundationNativeRncsTransition(value) {
  const errors = [];
  if (!value || value.format !== RCL_FOUNDATION_RNCS_BRIDGE_FORMAT) {
    return { ok: false, errors: ['BRIDGE_FORMAT_INVALID'] };
  }
  if (value.version !== RCL_FOUNDATION_RNCS_BRIDGE_VERSION) {
    errors.push('BRIDGE_VERSION_INVALID');
  }
  if (!['proposed', 'authorized', 'committed'].includes(value.status)) {
    errors.push('BRIDGE_STATUS_INVALID');
  }
  const envelopeVerification = verify(value.envelope);
  if (!envelopeVerification.valid) {
    errors.push(...envelopeVerification.errors);
  }
  const batch = batchForExecution(value.execution);
  if (!batch) errors.push('RCL_PROVIDER_ID_INVALID');
  if (value.execution?.mode !== 'bridge') errors.push('RCL_MODE_NOT_BRIDGE');
  if (batch) {
    if (value.execution?.results?.length !== batch.entries.length) {
      errors.push('RCL_RESULT_COUNT_INVALID');
    } else {
      for (let index = 0; index < batch.entries.length; index++) {
        const expected = batch.entries[index];
        const result = value.execution.results[index];
        if (
          result.domain !== expected.domain
          || result.replayMetadata?.providerId !== batch.providerId
          || result.replayMetadata?.capability !== expected.capability
        ) {
          errors.push(`RCL_RESULT_SEQUENCE_INVALID:${index + 1}`);
        }
      }
    }
  }
  if (value.execution?.replayVerified !== true) {
    errors.push('RCL_REPLAY_NOT_VERIFIED');
  }
  if (
    value.roots?.receiptRoot
    !== value.execution?.deterministicReceiptRoot
  ) {
    errors.push('RECEIPT_ROOT_MISMATCH');
  }
  if (value.roots?.proposalRoot !== value.envelope?.proposal_root) {
    errors.push('PROPOSAL_ROOT_MISMATCH');
  }
  if (value.roots?.finalStateRoot !== value.execution?.finalStateRoot) {
    errors.push('FINAL_STATE_ROOT_MISMATCH');
  }
  if (
    value.envelope?.foundation_governance?.nativeReceipt?.receiptRoot
    !== value.roots?.receiptRoot
  ) {
    errors.push('GOVERNANCE_RECEIPT_ROOT_MISMATCH');
  }
  if (
    batch
    && value.envelope?.foundation_governance?.nativeReceipt?.providerId
      !== batch.providerId
  ) {
    errors.push('GOVERNANCE_PROVIDER_ID_MISMATCH');
  }

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
      if (result.proposal.parameters !== undefined) {
        const expectedParametersRoot = rootHash(
          rncsHashable(result.proposal.parameters),
        );
        if (
          operation.semantic_parameters_root !== expectedParametersRoot
          || rootHash(operation.semantic_parameters)
            !== expectedParametersRoot
        ) {
          errors.push(`SEMANTIC_PARAMETERS_BINDING_MISMATCH:${index + 1}`);
        }
      } else if (
        operation.semantic_parameters !== undefined
        || operation.semantic_parameters_root !== undefined
      ) {
        errors.push(`UNEXPECTED_SEMANTIC_PARAMETERS:${index + 1}`);
      }
    }
  }

  if (batch?.id === RCL_FOUNDATION_RNCS_META_BATCH_B) {
    verifyMetaSemantics(value.execution, errors);
    const semanticState = metaSemanticState(value.execution);
    const semanticStateRoot = rootHash(semanticState);
    const semanticContract = (
      value.envelope?.foundation_governance?.semanticContract
    );
    if (
      value.roots?.semanticStateRoot !== semanticStateRoot
      || semanticContract?.batchId !== RCL_FOUNDATION_RNCS_META_BATCH_B
      || semanticContract?.stateRoot !== semanticStateRoot
      || value.envelope?.extensions?.rclFoundationNativeBridge
        ?.semanticStateRoot !== semanticStateRoot
    ) {
      errors.push('META_SEMANTIC_STATE_ROOT_MISMATCH');
    }
    const bindings = semanticResultBindings(value.execution);
    if (
      rootHash(semanticContract?.resultBindings ?? null)
      !== rootHash(bindings)
    ) {
      errors.push('META_SEMANTIC_RESULT_BINDINGS_MISMATCH');
    }
  }

  if (
    value.status === 'proposed'
    && value.envelope?.phase !== 'proposed'
  ) {
    errors.push('PROPOSAL_PHASE_MISMATCH');
  }
  if (
    value.status === 'authorized'
    && value.envelope?.phase !== 'authorized'
  ) {
    errors.push('AUTHORITY_PHASE_MISMATCH');
  }
  if (value.status === 'committed') {
    if (value.envelope?.phase !== 'committed') {
      errors.push('COMMIT_PHASE_MISMATCH');
    }
    if (
      value.envelope?.commit?.result_generation?.generation_root
      !== value.roots?.finalStateRoot
    ) {
      errors.push('COMMIT_FINAL_STATE_ROOT_MISMATCH');
    }
    if (
      !value.envelope?.commit?.receipt_refs
        ?.includes(value.roots?.receiptRoot)
    ) {
      errors.push('COMMIT_RECEIPT_MISSING');
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    status: value.status,
    batch: batch?.id ?? null,
    providerId: batch?.providerId ?? null,
    envelopeRoot: value.envelope?.envelope_root ?? null,
    proposalRoot: value.envelope?.proposal_root ?? null,
    receiptRoot: value.roots?.receiptRoot ?? null,
    semanticStateRoot: value.roots?.semanticStateRoot ?? null,
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
    ...(value.roots.semanticStateRoot ? {
      semanticStateRoot: value.roots.semanticStateRoot,
    } : {}),
  });
}
