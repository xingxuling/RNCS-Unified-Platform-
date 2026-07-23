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
  prepareFoundationNativeMetaRncsTransition,
  prepareFoundationNativeRncsTransition,
  verifyFoundationNativeRncsTransition,
} from '../packages/integration/rcl-foundation-rncs-bridge/src/index.mjs';
import {
  RealityOneGateway,
} from '../packages/control/reality-one-gateway/src/gateway.mjs';
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

const gatewayData = fs.mkdtempSync(
  path.join(os.tmpdir(), 'rncs-foundation-meta-evidence-'),
);
let gatewayPrepared;
let gatewayCommitted;
let gatewayVerification;
try {
  const gateway = new RealityOneGateway({
    manifestDirs: [GATEWAY_RUNTIME_DIR],
    dataDir: gatewayData,
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
  },
  generationContinuity: {
    realityId,
    batchAGeneration: batchA.rncs.generation,
    batchAFinalRoot: batchA.rncs.generationRoot,
    metaBaseGeneration: metaBatchB.rncs.baseGeneration,
    metaBaseRoot: metaBatchB.rncs.baseGenerationRoot,
    metaGeneration: metaBatchB.rncs.generation,
    metaFinalRoot: metaBatchB.rncs.generationRoot,
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
    nativeReplay:
      batchACommitted.execution.replayVerified === true
      && metaCommitted.execution.replayVerified === true,
    proposalsVerified:
      batchAVerification.ok && metaVerification.ok,
    humanApprovalRecorded:
      batchACommitted.envelope.authority.status === 'approved'
      && metaCommitted.envelope.authority.status === 'approved',
    commitReceiptsBound:
      batchACommitted.envelope.commit.receipt_refs
        .includes(batchACommitted.roots.receiptRoot)
      && metaCommitted.envelope.commit.receipt_refs
        .includes(metaCommitted.roots.receiptRoot),
    generationContinuity:
      batchA.rncs.generation === 1
      && metaBatchB.rncs.baseGeneration === 1
      && metaBatchB.rncs.baseGenerationRoot
        === batchA.rncs.generationRoot
      && metaBatchB.rncs.generation === 2,
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
  'Batch A and Meta Batch B remain bridge mode. Human approval and commit confirmation are separate calls. Declared Foundation syntax is not counted as Native VM lowering.',
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
