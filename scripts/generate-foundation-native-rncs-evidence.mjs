#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  authorizeFoundationNativeRncsTransition,
  commitFoundationNativeRncsTransition,
  foundationNativeRncsReceiptRoot,
  prepareFoundationNativeBatchCRncsTransition,
  prepareFoundationNativeBatchDRncsTransition,
  prepareFoundationNativeBatchERncsTransition,
  prepareFoundationNativeMetaRncsTransition,
  prepareFoundationNativeRncsTransition,
  verifyFoundationNativeRncsTransition,
} from '../packages/integration/rcl-foundation-rncs-bridge/src/index.mjs';
import {
  RealityOneGateway,
} from '../packages/control/reality-one-gateway/src/gateway.mjs';
import * as foundationBridgeModule from '../packages/integration/rcl-foundation-rncs-bridge/src/index.mjs';
import { rootHash } from '../packages/kernel/rncs-core-contract/src/index.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const JSON_PATH = path.join(
  ROOT,
  'docs',
  'foundation-native-rncs-evidence.json',
);
const MARKDOWN_PATH = path.join(
  ROOT,
  'docs',
  'foundation-native-rncs-evidence.md',
);
const RCL_ROOT = path.join(
  ROOT,
  'packages',
  'languages',
  'reality-computation-language',
);
const RCL_SOURCE_RECEIPT_PATH = path.join(
  RCL_ROOT,
  'FOUNDATION-NATIVE-BRIDGE-SOURCE.json',
);
const GATEWAY_RUNTIME_DIR = path.join(
  ROOT,
  'packages',
  'control',
  'reality-one-gateway',
  'runtimes',
);
const GATEWAY_MANIFEST_PATH = path.join(
  GATEWAY_RUNTIME_DIR,
  'rcl-foundation-native.runtime.json',
);
const GATEWAY_BRIDGE_PATH = path.join(
  ROOT,
  'packages',
  'control',
  'reality-one-gateway',
  'src',
  'bridges',
  'rcl-foundation-native.bridge.mjs',
);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function computeRclScopeRoot(receipt) {
  const hash = crypto.createHash('sha256');
  for (const relativePath of receipt.synchronizedFiles) {
    const bytes = fs.readFileSync(path.join(RCL_ROOT, relativePath));
    const scoped = relativePath.endsWith('.exe')
      ? bytes
      : Buffer.from(bytes.toString('utf8').replaceAll('\r\n', '\n'));
    hash.update(relativePath);
    hash.update('\0');
    hash.update(scoped);
    hash.update('\0');
  }
  return hash.digest('hex');
}

function executionEvidence(committed) {
  const metrics = committed.execution.metrics;
  return {
    providerId: committed.execution.providerHost.providerId,
    providerAbi: committed.execution.providerHost.providerAbi,
    mode: committed.execution.mode,
    nativeVm: committed.execution.nativeVm,
    bytecodeVersion: committed.execution.bytecodeVersion,
    bytecodeRoot: committed.execution.bytecodeRoot,
    domains: committed.execution.results.map(item => item.domain),
    selectedActions: committed.execution.results.map(
      item => item.proposal.selectedAction,
    ),
    finalStateRoot: committed.execution.finalStateRoot,
    deterministicReceiptRoot:
      committed.execution.deterministicReceiptRoot,
    replayVerified: committed.execution.replayVerified,
    semanticStateRoot: committed.roots.semanticStateRoot ?? null,
    performance: {
      compileMs: metrics.compileMs.toFixed(3),
      runtimeMs: metrics.runtimeMs.toFixed(3),
      replayMs: metrics.replayMs.toFixed(3),
      sourceBytes: metrics.sourceBytes,
      bytecodeBytes: metrics.bytecodeBytes,
      estimatedWorkingSetBytes: metrics.estimatedWorkingSetBytes,
      nativeInstructionCount: metrics.nativeInstructionCount,
      resultCount: metrics.resultCount,
      providerCallCount: metrics.providerCallCount,
      cacheHitRate: metrics.cacheHitRate.toFixed(2),
      compressionRatio: metrics.compressionRatio.toFixed(6),
    },
  };
}

function rncsEvidence(committed) {
  return {
    status: committed.status,
    realityId: committed.envelope.base_generation.reality_id,
    baseGeneration: committed.envelope.base_generation.generation,
    baseGenerationRoot:
      committed.envelope.base_generation.generation_root,
    proposalRoot: committed.envelope.proposal_root,
    decisionRoot: committed.envelope.authority.decision_root,
    commitRoot: committed.envelope.commit.commit_root,
    envelopeRoot: committed.envelope.envelope_root,
    generation: committed.envelope.commit.result_generation.generation,
    generationRoot:
      committed.envelope.commit.result_generation.generation_root,
    bridgeReceiptRoot: foundationNativeRncsReceiptRoot(committed),
  };
}

function maskWallClock(batch) {
  return {
    ...batch,
    execution: {
      ...batch.execution,
      performance: {
        ...batch.execution.performance,
        compileMs: 'excluded-from-deterministic-root',
        runtimeMs: 'excluded-from-deterministic-root',
        replayMs: 'excluded-from-deterministic-root',
      },
    },
  };
}

function undefinedPaths(value, currentPath = 'evidence', output = []) {
  if (value === undefined) {
    output.push(currentPath);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => undefinedPaths(
      item,
      `${currentPath}[${index}]`,
      output,
    ));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => undefinedPaths(
      item,
      `${currentPath}.${key}`,
      output,
    ));
  }
  return output;
}

const sourceReceipt = JSON.parse(
  fs.readFileSync(RCL_SOURCE_RECEIPT_PATH, 'utf8'),
);
const computedScopeRoot = computeRclScopeRoot(sourceReceipt);
const gatewayManifest = JSON.parse(
  fs.readFileSync(GATEWAY_MANIFEST_PATH, 'utf8'),
);
const gatewayBridgeSha256 = sha256(fs.readFileSync(GATEWAY_BRIDGE_PATH));
const gatewayRuntimeCount = fs.readdirSync(GATEWAY_RUNTIME_DIR)
  .filter(name => name.endsWith('.runtime.json'))
  .length;

const realityId = 'reality:foundation-native-stack';
const batchARequest = {
  authorized: true,
  aifDecision: 'stable',
  input: {
    speechAct: 'create',
    utterance: 'Create one bounded RNCS Foundation evidence candidate.',
  },
  evidence: [{
    type: 'evidence-generation',
    id: 'rncs-foundation-native-batch-a',
  }],
};
const batchAPrepared = prepareFoundationNativeRncsTransition(
  batchARequest,
  { realityId },
);
const batchAAuthorized = authorizeFoundationNativeRncsTransition(
  batchAPrepared,
  {
    approved: true,
    roles: ['owner'],
    resolver: 'evidence-human-owner',
  },
);
const batchACommitted = commitFoundationNativeRncsTransition(
  batchAAuthorized,
  { confirmed: true },
);
const batchAVerification = verifyFoundationNativeRncsTransition(
  batchACommitted,
);

const metaRequest = {
  authorized: true,
  aifDecision: 'stable',
  causalParents: [batchACommitted.roots.finalStateRoot],
  input: {
    speechAct: 'create',
    timeline: {
      tick: 20,
      observerFrame: 'subjective-bounded',
      eventCount: 4,
    },
    acceleration: {
      requestedFactor: 12,
      fidelityFloor: 0.95,
    },
    compression: {
      codec: 'content-addressed',
      restoreRequired: true,
    },
  },
  evidence: [{
    type: 'evidence-generation',
    id: 'rncs-foundation-native-meta-batch-b',
  }],
};
const metaPrepared = prepareFoundationNativeMetaRncsTransition(
  metaRequest,
  {
    realityId,
    baseGeneration: 1,
    baseGenerationRoot: batchACommitted.roots.finalStateRoot,
  },
);
const metaAuthorized = authorizeFoundationNativeRncsTransition(
  metaPrepared,
  {
    approved: true,
    roles: ['owner'],
    resolver: 'evidence-human-owner',
  },
);
const metaCommitted = commitFoundationNativeRncsTransition(
  metaAuthorized,
  { confirmed: true },
);
const metaVerification = verifyFoundationNativeRncsTransition(
  metaCommitted,
);

const batchCRequest = {
  authorized: true,
  aifDecision: 'stable',
  causalParents: [metaCommitted.roots.finalStateRoot],
  input: {
    speechAct: 'create',
    physical: {
      tick: 24,
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
    type: 'evidence-generation',
    id: 'rncs-foundation-native-batch-c',
  }],
};
const batchCPrepared = prepareFoundationNativeBatchCRncsTransition(
  batchCRequest,
  {
    realityId,
    baseGeneration: 2,
    baseGenerationRoot: metaCommitted.roots.finalStateRoot,
  },
);
const batchCAuthorized = authorizeFoundationNativeRncsTransition(
  batchCPrepared,
  {
    approved: true,
    roles: ['owner'],
    resolver: 'evidence-human-owner',
  },
);
const batchCCommitted = commitFoundationNativeRncsTransition(
  batchCAuthorized,
  { confirmed: true },
);
const batchCVerification = verifyFoundationNativeRncsTransition(
  batchCCommitted,
);

const batchDRequest = {
  authorized: true,
  aifDecision: 'stable',
  causalParents: [batchCCommitted.roots.finalStateRoot],
  input: {
    speechAct: 'create',
    energy: {
      availableMilliJoules: 120_000,
      requestedMilliJoules: 75_000,
      lossPpm: 10_000,
      tick: 28,
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
    type: 'evidence-generation',
    id: 'rncs-foundation-native-batch-d',
  }],
};
const batchDPrepared = prepareFoundationNativeBatchDRncsTransition(
  batchDRequest,
  {
    realityId,
    baseGeneration: 3,
    baseGenerationRoot: batchCCommitted.roots.finalStateRoot,
  },
);
const batchDAuthorized = authorizeFoundationNativeRncsTransition(
  batchDPrepared,
  {
    approved: true,
    roles: ['owner'],
    resolver: 'evidence-human-owner',
  },
);
const batchDCommitted = commitFoundationNativeRncsTransition(
  batchDAuthorized,
  { confirmed: true },
);
const batchDVerification = verifyFoundationNativeRncsTransition(
  batchDCommitted,
);

const batchERequest = {
  authorized: true,
  aifDecision: 'stable',
  causalParents: [batchDCommitted.roots.finalStateRoot],
  input: {
    speechAct: 'create',
    metacomputation: {
      planId: 'plan:sum-v1',
      strategy: 'bounded-step',
      requestedSteps: 12,
      maximumSteps: 8,
      tick: 32,
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
    type: 'evidence-generation',
    id: 'rncs-foundation-native-batch-e',
  }],
};
const batchEPrepared = prepareFoundationNativeBatchERncsTransition(
  batchERequest,
  {
    realityId,
    baseGeneration: 4,
    baseGenerationRoot: batchDCommitted.roots.finalStateRoot,
  },
);
const batchEAuthorized = authorizeFoundationNativeRncsTransition(
  batchEPrepared,
  {
    approved: true,
    roles: ['owner'],
    resolver: 'evidence-human-owner',
  },
);
const batchECommitted = commitFoundationNativeRncsTransition(
  batchEAuthorized,
  { confirmed: true },
);
const batchEVerification = verifyFoundationNativeRncsTransition(
  batchECommitted,
);

const gatewayData = fs.mkdtempSync(
  path.join(os.tmpdir(), 'rncs-foundation-meta-evidence-'),
);
let gatewayPrepared;
let gatewayCommitted;
let gatewayVerification;
let gatewayBatchCPrepared;
let gatewayBatchCCommitted;
let gatewayBatchCVerification;
let gatewayBatchDPrepared;
let gatewayBatchDCommitted;
let gatewayBatchDVerification;
let gatewayBatchEPrepared;
let gatewayBatchECommitted;
let gatewayBatchEVerification;
try {
  const gateway = new RealityOneGateway({
    manifestDirs: [GATEWAY_RUNTIME_DIR],
    dataDir: gatewayData,
    moduleOverrides: {
      'rncs.rcl-foundation-native': foundationBridgeModule,
    },
  });
  gatewayPrepared = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'prepare',
    { batch: 'meta-batch-b', request: metaRequest },
  );
  const gatewayAuthorized = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'authorize',
    {
      prepared: gatewayPrepared,
      approval: {
        approved: true,
        roles: ['owner'],
        resolver: 'gateway-evidence-owner',
      },
    },
  );
  gatewayCommitted = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'commit',
    {
      authorized: gatewayAuthorized,
      confirmation: { confirmed: true },
    },
  );
  gatewayVerification = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'verify',
    { transition: gatewayCommitted },
  );
  gatewayBatchCPrepared = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'prepare',
    {
      batch: 'batch-c',
      request: batchCRequest,
      options: {
        realityId,
        baseGeneration: 2,
        baseGenerationRoot: metaCommitted.roots.finalStateRoot,
      },
    },
  );
  const gatewayBatchCAuthorized = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'authorize',
    {
      prepared: gatewayBatchCPrepared,
      approval: {
        approved: true,
        roles: ['owner'],
        resolver: 'gateway-evidence-owner',
      },
    },
  );
  gatewayBatchCCommitted = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'commit',
    {
      authorized: gatewayBatchCAuthorized,
      confirmation: { confirmed: true },
    },
  );
  gatewayBatchCVerification = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'verify',
    { transition: gatewayBatchCCommitted },
  );
  gatewayBatchDPrepared = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'prepare',
    {
      batch: 'batch-d',
      request: batchDRequest,
      options: {
        realityId,
        baseGeneration: 3,
        baseGenerationRoot: batchCCommitted.roots.finalStateRoot,
      },
    },
  );
  const gatewayBatchDAuthorized = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'authorize',
    {
      prepared: gatewayBatchDPrepared,
      approval: {
        approved: true,
        roles: ['owner'],
        resolver: 'gateway-evidence-owner',
      },
    },
  );
  gatewayBatchDCommitted = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'commit',
    {
      authorized: gatewayBatchDAuthorized,
      confirmation: { confirmed: true },
    },
  );
  gatewayBatchDVerification = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'verify',
    { transition: gatewayBatchDCommitted },
  );
  gatewayBatchEPrepared = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'prepare',
    {
      batch: 'batch-e',
      request: batchERequest,
      options: {
        realityId,
        baseGeneration: 4,
        baseGenerationRoot: batchDCommitted.roots.finalStateRoot,
      },
    },
  );
  const gatewayBatchEAuthorized = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'authorize',
    {
      prepared: gatewayBatchEPrepared,
      approval: {
        approved: true,
        roles: ['owner'],
        resolver: 'gateway-evidence-owner',
      },
    },
  );
  gatewayBatchECommitted = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'commit',
    {
      authorized: gatewayBatchEAuthorized,
      confirmation: { confirmed: true },
    },
  );
  gatewayBatchEVerification = await gateway.invoke(
    'rncs.rcl-foundation-native',
    'verify',
    { transition: gatewayBatchECommitted },
  );
} finally {
  fs.rmSync(gatewayData, { recursive: true, force: true });
}

const batchA = {
  execution: executionEvidence(batchACommitted),
  rncs: rncsEvidence(batchACommitted),
};
const metaBatchB = {
  execution: executionEvidence(metaCommitted),
  rncs: rncsEvidence(metaCommitted),
  semanticState: metaCommitted.envelope.provisional_delta.operations
    .map(operation => ({
      path: operation.path,
      parameters: operation.semantic_parameters,
      parametersRoot: operation.semantic_parameters_root,
    })),
};
const batchC = {
  execution: executionEvidence(batchCCommitted),
  rncs: rncsEvidence(batchCCommitted),
  semanticState: batchCCommitted.envelope.provisional_delta.operations
    .map(operation => ({
      path: operation.path,
      parameters: operation.semantic_parameters,
      parametersRoot: operation.semantic_parameters_root,
    })),
};
const batchD = {
  execution: executionEvidence(batchDCommitted),
  rncs: rncsEvidence(batchDCommitted),
  semanticState: batchDCommitted.envelope.provisional_delta.operations
    .map(operation => ({
      path: operation.path,
      parameters: operation.semantic_parameters,
      parametersRoot: operation.semantic_parameters_root,
    })),
};
const batchE = {
  execution: executionEvidence(batchECommitted),
  rncs: rncsEvidence(batchECommitted),
  semanticState: batchECommitted.envelope.provisional_delta.operations
    .map(operation => ({
      path: operation.path,
      parameters: operation.semantic_parameters,
      parametersRoot: operation.semantic_parameters_root,
    })),
};
const evidence = {
  format: 'rncs.rcl-foundation-native-evidence.v0.2',
  version: '0.2.0-alpha.1',
  canonicalRcl: {
    repository: sourceReceipt.canonicalRepository,
    branch: sourceReceipt.canonicalBranch,
    commit: sourceReceipt.canonicalCommit,
    synchronizedFileCount: sourceReceipt.synchronizedFiles.length,
    scopeRoot: computedScopeRoot,
    wholePackageByteIdentityClaimed:
      sourceReceipt.byteIdentityClaimedForWholePackage,
    downstreamDeltaFiles: sourceReceipt.downstreamDeltaFiles,
  },
  batches: {
    batchA,
    metaBatchB,
    batchC,
    batchD,
    batchE,
  },
  generationContinuity: {
    realityId,
    batchAGeneration: batchA.rncs.generation,
    batchAFinalRoot: batchA.rncs.generationRoot,
    metaBaseGeneration: metaBatchB.rncs.baseGeneration,
    metaBaseRoot: metaBatchB.rncs.baseGenerationRoot,
    metaGeneration: metaBatchB.rncs.generation,
    metaFinalRoot: metaBatchB.rncs.generationRoot,
    batchCBaseGeneration: batchC.rncs.baseGeneration,
    batchCBaseRoot: batchC.rncs.baseGenerationRoot,
    batchCGeneration: batchC.rncs.generation,
    batchCFinalRoot: batchC.rncs.generationRoot,
    batchDBaseGeneration: batchD.rncs.baseGeneration,
    batchDBaseRoot: batchD.rncs.baseGenerationRoot,
    batchDGeneration: batchD.rncs.generation,
    batchDFinalRoot: batchD.rncs.generationRoot,
    batchEBaseGeneration: batchE.rncs.baseGeneration,
    batchEBaseRoot: batchE.rncs.baseGenerationRoot,
    batchEGeneration: batchE.rncs.generation,
    batchEFinalRoot: batchE.rncs.generationRoot,
  },
  gateway: {
    runtimeId: gatewayManifest.runtime_id,
    mode: gatewayManifest.metadata.mode,
    actions: gatewayManifest.actions,
    selectableBatches: gatewayManifest.metadata.selectable_batches,
    runtimeManifestCount: gatewayRuntimeCount,
    manifestSourceRoot: rootHash(gatewayManifest),
    bridgeSha256: gatewayBridgeSha256,
    preparedProposalRoot: gatewayPrepared.envelope.proposal_root,
    committedGenerationRoot:
      gatewayCommitted.envelope.commit.result_generation.generation_root,
    verification: gatewayVerification,
    batchCPreparedProposalRoot: gatewayBatchCPrepared.envelope.proposal_root,
    batchCCommittedGenerationRoot:
      gatewayBatchCCommitted.envelope.commit.result_generation.generation_root,
    batchCVerification: gatewayBatchCVerification,
    batchDPreparedProposalRoot: gatewayBatchDPrepared.envelope.proposal_root,
    batchDCommittedGenerationRoot:
      gatewayBatchDCommitted.envelope.commit.result_generation.generation_root,
    batchDVerification: gatewayBatchDVerification,
    batchEPreparedProposalRoot: gatewayBatchEPrepared.envelope.proposal_root,
    batchECommittedGenerationRoot:
      gatewayBatchECommitted.envelope.commit.result_generation.generation_root,
    batchEVerification: gatewayBatchEVerification,
  },
  checks: {
    rclSourceScopeVerified:
      computedScopeRoot === sourceReceipt.scopeRoot,
    wholePackageIdentityNotClaimed:
      sourceReceipt.byteIdentityClaimedForWholePackage === false,
    batchAStandardResultCount:
      batchACommitted.execution.results.length === 6,
    metaStandardResultCount:
      metaCommitted.execution.results.length === 3,
    batchCStandardResultCount:
      batchCCommitted.execution.results.length === 2,
    batchDStandardResultCount:
      batchDCommitted.execution.results.length === 3,
    batchEStandardResultCount:
      batchECommitted.execution.results.length === 2,
    nativeReplay:
      batchACommitted.execution.replayVerified === true
      && metaCommitted.execution.replayVerified === true
      && batchCCommitted.execution.replayVerified === true
      && batchDCommitted.execution.replayVerified === true
      && batchECommitted.execution.replayVerified === true,
    proposalsVerified:
      batchAVerification.ok
      && metaVerification.ok
      && batchCVerification.ok
      && batchDVerification.ok
      && batchEVerification.ok,
    humanApprovalRecorded:
      batchACommitted.envelope.authority.status === 'approved'
      && metaCommitted.envelope.authority.status === 'approved'
      && batchCCommitted.envelope.authority.status === 'approved'
      && batchDCommitted.envelope.authority.status === 'approved'
      && batchECommitted.envelope.authority.status === 'approved',
    commitReceiptsBound:
      batchACommitted.envelope.commit.receipt_refs
        .includes(batchACommitted.roots.receiptRoot)
      && metaCommitted.envelope.commit.receipt_refs
        .includes(metaCommitted.roots.receiptRoot)
      && batchCCommitted.envelope.commit.receipt_refs
        .includes(batchCCommitted.roots.receiptRoot)
      && batchDCommitted.envelope.commit.receipt_refs
        .includes(batchDCommitted.roots.receiptRoot)
      && batchECommitted.envelope.commit.receipt_refs
        .includes(batchECommitted.roots.receiptRoot),
    generationContinuity:
      batchA.rncs.generation === 1
      && metaBatchB.rncs.baseGeneration === 1
      && metaBatchB.rncs.baseGenerationRoot
        === batchA.rncs.generationRoot
      && metaBatchB.rncs.generation === 2
      && batchC.rncs.baseGeneration === 2
      && batchC.rncs.baseGenerationRoot === metaBatchB.rncs.generationRoot
      && batchC.rncs.generation === 3
      && batchD.rncs.baseGeneration === 3
      && batchD.rncs.baseGenerationRoot === batchC.rncs.generationRoot
      && batchD.rncs.generation === 4
      && batchE.rncs.baseGeneration === 4
      && batchE.rncs.baseGenerationRoot === batchD.rncs.generationRoot
      && batchE.rncs.generation === 5,
    metaTimelineMutation:
      metaBatchB.semanticState[0].parameters.timeline.tickBefore === 20
      && metaBatchB.semanticState[0].parameters.timeline.tickAfter === 24,
    metaAccelerationBound:
      metaBatchB.semanticState[1]
        .parameters.acceleration.effectiveFactor === 8
      && metaBatchB.semanticState[1]
        .parameters.acceleration.clamped === true,
    metaCompressionRestore:
      metaBatchB.semanticState[2]
        .parameters.compression.restoreVerified === true
      && metaBatchB.semanticState[2]
        .parameters.compression.sourceRoot
        === metaBatchB.semanticState[2]
          .parameters.compression.restoreRoot,
    gatewayRuntimeRegistered:
      gatewayManifest.runtime_id === 'rncs.rcl-foundation-native',
    gatewayAuthoritySeparated:
      ['prepare', 'authorize', 'commit', 'verify']
        .every(action => gatewayManifest.actions.includes(action)),
    gatewayMetaCommitted:
      gatewayVerification.ok === true
      && gatewayVerification.batch === 'meta-batch-b'
      && gatewayCommitted.status === 'committed',
    gatewayBatchCCommitted:
      gatewayBatchCVerification.ok === true
      && gatewayBatchCVerification.batch === 'batch-c'
      && gatewayBatchCCommitted.status === 'committed',
    gatewayBatchDCommitted:
      gatewayBatchDVerification.ok === true
      && gatewayBatchDVerification.batch === 'batch-d'
      && gatewayBatchDCommitted.status === 'committed',
    gatewayBatchECommitted:
      gatewayBatchEVerification.ok === true
      && gatewayBatchEVerification.batch === 'batch-e'
      && gatewayBatchECommitted.status === 'committed',
  },
};
evidence.evidenceRootScope = (
  'all fields except wall-clock compileMs, runtimeMs, and replayMs'
);
const deterministicEvidence = {
  ...evidence,
  batches: {
    batchA: maskWallClock(batchA),
    metaBatchB: maskWallClock(metaBatchB),
    batchC: maskWallClock(batchC),
    batchD: maskWallClock(batchD),
    batchE: maskWallClock(batchE),
  },
};
const invalidPaths = undefinedPaths(deterministicEvidence);
if (invalidPaths.length > 0) {
  throw new Error(`FOUNDATION_EVIDENCE_UNDEFINED:${invalidPaths.join(',')}`);
}
evidence.evidenceRoot = rootHash(deterministicEvidence);

const markdown = [
  '# RCL Foundation Native RNCS Evidence',
  '',
  `- status: **${Object.values(evidence.checks).every(Boolean) ? 'pass' : 'fail'}**`,
  `- canonical RCL commit: \`${evidence.canonicalRcl.commit}\``,
  `- scoped source root: \`${evidence.canonicalRcl.scopeRoot}\` (${evidence.canonicalRcl.synchronizedFileCount} files)`,
  `- Batch A provider: \`${batchA.execution.providerId}\``,
  `- Batch A generation: ${batchA.rncs.generation} / \`${batchA.rncs.generationRoot}\``,
  `- Meta Batch B provider: \`${metaBatchB.execution.providerId}\``,
  `- Meta Batch B generation: ${metaBatchB.rncs.generation} / \`${metaBatchB.rncs.generationRoot}\``,
  `- Meta semantic state: \`${metaBatchB.execution.semanticStateRoot}\``,
  `- Batch C provider: \`${batchC.execution.providerId}\``,
  `- Batch C generation: ${batchC.rncs.generation} / \`${batchC.rncs.generationRoot}\``,
  `- Batch D provider: \`${batchD.execution.providerId}\``,
  `- Batch D generation: ${batchD.rncs.generation} / \`${batchD.rncs.generationRoot}\``,
  `- Batch E provider: \`${batchE.execution.providerId}\``,
  `- Batch E generation: ${batchE.rncs.generation} / \`${batchE.rncs.generationRoot}\``,
  `- Gateway runtime: \`${evidence.gateway.runtimeId}\` (${evidence.gateway.runtimeManifestCount} registered runtimes)`,
  `- Gateway committed root: \`${evidence.gateway.committedGenerationRoot}\``,
  `- evidence root: \`${evidence.evidenceRoot}\``,
  '',
  '| Check | Status |',
  '| --- | --- |',
  ...Object.entries(evidence.checks).map(
    ([key, passed]) => `| ${key} | ${passed ? 'pass' : 'fail'} |`,
  ),
  '',
  'Batch A, Meta Batch B, Batch C, Batch D, and Batch E remain bridge mode. Human approval and commit confirmation are separate calls. Declared Foundation syntax is not counted as Native VM lowering.',
  '',
].join('\n');

fs.writeFileSync(JSON_PATH, `${JSON.stringify(evidence, null, 2)}\n`);
fs.writeFileSync(MARKDOWN_PATH, markdown);
console.log(JSON.stringify({
  status: Object.values(evidence.checks).every(Boolean) ? 'pass' : 'fail',
  json: JSON_PATH,
  markdown: MARKDOWN_PATH,
  evidenceRoot: evidence.evidenceRoot,
  checks: evidence.checks,
}, null, 2));
if (Object.values(evidence.checks).some(value => !value)) {
  process.exitCode = 1;
}
