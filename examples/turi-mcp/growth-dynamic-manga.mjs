import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CapabilityRegistry } from '../../packages/integration/turi-mcp/src/registry/capability-registry.mjs';
import { GrowthStore } from '../../packages/integration/turi-mcp/src/growth/store.mjs';
import { GrowthEngine } from '../../packages/integration/turi-mcp/src/growth/engine.mjs';
import { TuriOrchestrator } from '../../packages/integration/turi-mcp/src/workflows/orchestrator.mjs';
import { ReceiptStore, createEvidenceReceipt } from '../../packages/integration/turi-mcp/src/evidence/receipt.mjs';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'turi-dynamic-manga-'));
const receipts = new ReceiptStore(dataDir);
const receiptManifest = { capabilityId: 'turi.workflow.cinematic-task', implementation: 'adapter', evidenceLevel: 'static' };
const adapters = {
  rcl: { adapterPlan: (kind, intent) => ({ format: 'turi.adapter-plan.v0.1', kind, intent }) },
  updia: { configured: () => false },
  rncs: {},
  gamebrain: { status: () => ({ configured: false }) },
};
const orchestrator = new TuriOrchestrator({ config: {}, adapters, artifacts: null });
const store = new GrowthStore(dataDir);
const registry = new CapabilityRegistry();
const engine = new GrowthEngine({ store, registry, orchestrator, rcl: adapters.rcl, config: {} });

try {
  const experiences = [];
  for (const index of [1, 2, 3]) {
    const receipt = receipts.save(createEvidenceReceipt(receiptManifest, { scene: 'dynamic-manga', index }, { status: index === 3 ? 'render-provider-boundary' : 'candidate-plan-ready' }, { executed: true, executionGrade: 'STATIC_VERIFIED', limitations: ['VSR provider is not configured in this example.'] }));
    experiences.push(store.recordExperience({
      taskType: 'dynamic-manga', goal: '保持角色、镜头和世界状态连续', contextFingerprint: `manga:${index}`,
      capabilitiesUsed: ['turi.workflow.cinematic-task', 'rncs.simulate_candidate'], successfulSteps: ['compile', 'candidate-simulate'],
      failedSteps: index === 3 ? ['vsr-render-provider-unavailable'] : [], residuals: ['VSR runtime not configured'], rejectedAlternatives: ['direct formal merge'],
      evidenceReceipts: [receipt.receiptId], reusableConfidence: 0.9, generalizationScope: ['candidate cinematic adapter'], knownFailureBoundaries: ['authority required for formal merge'],
    }));
  }
  const pattern = store.minePattern({ taskType: 'dynamic-manga', threshold: 3 });
  const protocol = store.createProtocol({ derivedFromPatterns: [pattern.patternId], version: '0.1.0', invariants: ['formal merge requires authority'] });
  const candidate = store.buildCapabilityCandidate({ protocolId: protocol.protocolId, capabilityId: 'cinematic.dynamic-manga', routeCapability: 'turi.workflow.cinematic-task', domain: 'cinematic', displayName: 'Dynamic Manga Candidate' });
  const evaluation = store.evaluate(candidate.candidateId, {
    determinismScore: 1,
    cases: [
      { kind: 'success', caseId: 'success', passed: true, evidenceReceiptId: experiences[0].evidenceReceipts[0] },
      { kind: 'failure', caseId: 'failure-boundary', expected: 'blocked', observed: 'blocked', passed: true, evidenceReceiptId: experiences[2].evidenceReceipts[0] },
      { kind: 'control', caseId: 'control', passed: true, evidenceReceiptId: experiences[1].evidenceReceipts[0] },
      { kind: 'regression', caseId: 'regression', passed: true, evidenceReceiptId: experiences[0].evidenceReceipts[0] },
      { kind: 'security', caseId: 'security', passed: true, evidenceReceiptId: experiences[1].evidenceReceipts[0] },
      { kind: 'rollback', caseId: 'rollback', passed: true, evidenceReceiptId: experiences[2].evidenceReceipts[0] },
    ],
  });
  const promotion = store.requestPromotion(candidate.candidateId, evaluation.evaluationId);
  store.reviewPromotion(promotion.promotionId, { reviewer: 'human-owner', verdict: 'approved', reason: 'bounded static adapter evidence' });
  const promoted = engine.promote(promotion.promotionId);
  const reused = await engine.invokeCandidate(candidate.candidateId, { intent: '复用上一版漫画角色和镜头连续性' });
  const rolledBack = engine.rollbackPromotion(candidate.capabilityId, promoted.lineage.currentVersion);
  console.log(JSON.stringify({
    status: 'PARTIAL', executionGrade: 'STATIC_VERIFIED', experiences: experiences.length, pattern: pattern.patternId,
    evaluation: evaluation.recommendation, promoted: promoted.manifest.capabilityId, directReuse: reused.format,
    lineageVersion: promoted.lineage.currentVersion, rollback: rolledBack, limitations: ['No VSR runtime or external ChatGPT session was used; this does not prove production self-improvement.'],
  }, null, 2));
} finally {
  fs.rmSync(dataDir, { recursive: true, force: true });
}
