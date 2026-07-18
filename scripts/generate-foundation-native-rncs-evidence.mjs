#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  authorizeFoundationNativeRncsTransition,
  commitFoundationNativeRncsTransition,
  foundationNativeRncsReceiptRoot,
  prepareFoundationNativeRncsTransition,
  verifyFoundationNativeRncsTransition,
} from '../packages/integration/rcl-foundation-rncs-bridge/src/index.mjs';
import { rootHash } from '../packages/kernel/rncs-core-contract/src/index.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const JSON_PATH = path.join(ROOT, 'docs', 'foundation-native-rncs-evidence.json');
const MARKDOWN_PATH = path.join(ROOT, 'docs', 'foundation-native-rncs-evidence.md');
const GATEWAY_RUNTIME_DIR = path.join(
  ROOT,
  'packages',
  'control',
  'reality-one-gateway',
  'runtimes',
);
const GATEWAY_MANIFEST_PATH = path.join(GATEWAY_RUNTIME_DIR, 'rcl-foundation-native.runtime.json');
const GATEWAY_BRIDGE_PATH = path.join(
  ROOT,
  'packages',
  'control',
  'reality-one-gateway',
  'src',
  'bridges',
  'rcl-foundation-native.bridge.mjs',
);

const gatewayManifest = JSON.parse(fs.readFileSync(GATEWAY_MANIFEST_PATH, 'utf8'));
const gatewayBridgeSha256 = createHash('sha256')
  .update(fs.readFileSync(GATEWAY_BRIDGE_PATH))
  .digest('hex');
const gatewayRuntimeCount = fs.readdirSync(GATEWAY_RUNTIME_DIR)
  .filter(name => name.endsWith('.runtime.json'))
  .length;

const request = {
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
const prepared = prepareFoundationNativeRncsTransition(request);
const authorized = authorizeFoundationNativeRncsTransition(prepared, {
  approved: true,
  roles: ['owner'],
  resolver: 'evidence-human-owner',
});
const committed = commitFoundationNativeRncsTransition(authorized, { confirmed: true });
const verification = verifyFoundationNativeRncsTransition(committed);
const metrics = committed.execution.metrics;

const evidence = {
  format: 'rncs.rcl-foundation-native-evidence.v0.1',
  version: '0.1.0-alpha.1',
  canonicalRcl: {
    repository: 'xingxuling/RCL',
    branch: 'codex/foundation-native-batch-a',
    commit: '43b6755',
    providerId: committed.execution.providerHost.providerId,
    providerAbi: committed.execution.providerHost.providerAbi,
  },
  execution: {
    mode: committed.execution.mode,
    nativeVm: committed.execution.nativeVm,
    bytecodeVersion: committed.execution.bytecodeVersion,
    bytecodeRoot: committed.execution.bytecodeRoot,
    domains: committed.execution.results.map(item => item.domain),
    selectedAction: committed.execution.finalCandidate.selectedAction,
    finalStateRoot: committed.execution.finalStateRoot,
    deterministicReceiptRoot: committed.execution.deterministicReceiptRoot,
    replayVerified: committed.execution.replayVerified,
  },
  rncs: {
    status: committed.status,
    proposalRoot: committed.envelope.proposal_root,
    decisionRoot: committed.envelope.authority.decision_root,
    commitRoot: committed.envelope.commit.commit_root,
    envelopeRoot: committed.envelope.envelope_root,
    generationRoot: committed.envelope.commit.result_generation.generation_root,
    bridgeReceiptRoot: foundationNativeRncsReceiptRoot(committed),
  },
  gateway: {
    runtimeId: gatewayManifest.runtime_id,
    mode: gatewayManifest.metadata.mode,
    actions: gatewayManifest.actions,
    runtimeManifestCount: gatewayRuntimeCount,
    manifestSourceRoot: rootHash(gatewayManifest),
    bridgeSha256: gatewayBridgeSha256,
  },
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
  checks: {
    standardResultCount: committed.execution.results.length === 6,
    nativeReplay: committed.execution.replayVerified === true,
    proposalVerified: verification.ok,
    humanApprovalRecorded: committed.envelope.authority.status === 'approved',
    commitReceiptBound: committed.envelope.commit.receipt_refs.includes(committed.roots.receiptRoot),
    finalRootBound: committed.envelope.commit.result_generation.generation_root === committed.roots.finalStateRoot,
    gatewayRuntimeRegistered: gatewayManifest.runtime_id === 'rncs.rcl-foundation-native',
    gatewayBridgeModeExplicit: gatewayManifest.metadata.mode === 'bridge',
    gatewayAuthoritySeparated: ['prepare', 'authorize', 'commit', 'verify']
      .every(action => gatewayManifest.actions.includes(action)),
  },
};
evidence.evidenceRootScope = 'all fields except wall-clock compileMs, runtimeMs, and replayMs';
evidence.evidenceRoot = rootHash({
  ...evidence,
  performance: {
    ...evidence.performance,
    compileMs: 'excluded-from-deterministic-root',
    runtimeMs: 'excluded-from-deterministic-root',
    replayMs: 'excluded-from-deterministic-root',
  },
});

const markdown = [
  '# RCL Foundation Native RNCS Evidence',
  '',
  `- status: **${verification.ok ? 'pass' : 'fail'}**`,
  `- canonical RCL commit: \`${evidence.canonicalRcl.commit}\``,
  `- provider: \`${evidence.canonicalRcl.providerId}\` ABI ${evidence.canonicalRcl.providerAbi}`,
  `- domains: ${evidence.execution.domains.join(', ')}`,
  `- RCL receipt: \`${evidence.execution.deterministicReceiptRoot}\``,
  `- RNCS proposal: \`${evidence.rncs.proposalRoot}\``,
  `- RNCS commit: \`${evidence.rncs.commitRoot}\``,
  `- final generation root: \`${evidence.rncs.generationRoot}\``,
  `- Gateway runtime: \`${evidence.gateway.runtimeId}\` (${evidence.gateway.runtimeManifestCount} registered runtimes)`,
  `- Gateway source root: \`${evidence.gateway.manifestSourceRoot}\``,
  `- evidence root: \`${evidence.evidenceRoot}\``,
  '',
  '| Check | Status |',
  '| --- | --- |',
  ...Object.entries(evidence.checks).map(([key, passed]) => `| ${key} | ${passed ? 'pass' : 'fail'} |`),
  '',
  'Batch A remains bridge mode. Human approval and commit confirmation are separate gates.',
  '',
].join('\n');

fs.writeFileSync(JSON_PATH, `${JSON.stringify(evidence, null, 2)}\n`);
fs.writeFileSync(MARKDOWN_PATH, markdown);
console.log(JSON.stringify({
  status: verification.ok ? 'pass' : 'fail',
  json: JSON_PATH,
  markdown: MARKDOWN_PATH,
  evidenceRoot: evidence.evidenceRoot,
}, null, 2));
if (!verification.ok || Object.values(evidence.checks).some(value => !value)) process.exitCode = 1;
