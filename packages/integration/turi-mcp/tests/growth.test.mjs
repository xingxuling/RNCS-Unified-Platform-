import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CapabilityRegistry } from '../src/registry/capability-registry.mjs';
import { GrowthStore } from '../src/growth/store.mjs';
import { GrowthEngine } from '../src/growth/engine.mjs';

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'turi-growth-'));

test('growth loop keeps raw chat out and requires evidence-backed Promotion Court review', () => {
  const dataDir = tempDir();
  try {
    const store = new GrowthStore(dataDir);
    assert.throws(() => store.recordExperience({ taskType: 'manga', goal: 'raw', rawChat: 'pretend evidence' }), (error) => error.code === 'UNVERIFIED_CHAT_NOT_EXPERIENCE');
    const experiences = [1, 2, 3].map((index) => store.recordExperience({
      taskType: 'dynamic-manga', goal: '让分镜角色在候选世界中保持连续性', contextFingerprint: `manga-context-${index}`,
      capabilitiesUsed: ['turi.workflow.cinematic-task', 'rncs.simulate_candidate'], protocolRefs: [],
      successfulSteps: [{ stepId: 'compile', name: 'compile' }, { stepId: 'simulate', name: 'simulate' }],
      failedSteps: index === 3 ? [{ stepId: 'render', reason: 'provider unavailable' }] : [],
      residuals: ['VSR provider remains external'], rejectedAlternatives: ['direct formal merge'],
      evidenceReceipts: [`receipt:manga-${index}`], artifactRefs: [], reusableConfidence: 0.9,
      generalizationScope: ['candidate cinematic workflow'], knownFailureBoundaries: ['never merge without authority'],
    }));
    const pattern = store.minePattern({ taskType: 'dynamic-manga', threshold: 3 });
    assert.equal(pattern.supportingExperienceIds.length, 3);
    assert.equal(pattern.evidenceCoverage, 1);
    assert.deepEqual(store.compareExperiences(experiences.map((item) => item.experienceId)).commonCapabilities, ['turi.workflow.cinematic-task', 'rncs.simulate_candidate']);

    const protocol = store.createProtocol({ derivedFromPatterns: [pattern.patternId], version: '0.1.0', invariants: ['formal state unchanged before promotion'], permissions: [{ executionMode: 'candidate' }] });
    const candidate = store.buildCapabilityCandidate({ protocolId: protocol.protocolId, capabilityId: 'cinematic.dynamic-manga', routeCapability: 'turi.workflow.cinematic-task', domain: 'cinematic', displayName: 'Dynamic Manga Candidate' });
    const cases = [
      { caseId: 'success-1', kind: 'success', passed: true, evidenceReceiptId: 'receipt:manga-1' },
      { caseId: 'failure-1', kind: 'failure', expected: 'blocked-at-vsr-boundary', observed: 'blocked-at-vsr-boundary', passed: true, evidenceReceiptId: 'receipt:manga-2' },
      { caseId: 'control-1', kind: 'control', passed: true, evidenceReceiptId: 'receipt:manga-3' },
      { caseId: 'regression-1', kind: 'regression', passed: true, evidenceReceiptId: 'receipt:manga-1' },
      { caseId: 'adversarial-1', kind: 'security', passed: true, evidenceReceiptId: 'receipt:manga-2' },
      { caseId: 'rollback-1', kind: 'rollback', passed: true, evidenceReceiptId: 'receipt:manga-3' },
    ];
    const evaluation = store.evaluate(candidate.candidateId, { cases, determinismScore: 1 });
    assert.equal(evaluation.recommendation, 'PROMOTE');
    assert.equal(evaluation.coverage.securityCases, 1);
    assert.equal(evaluation.coverage.rollbackCases, 1);

    const promotion = store.requestPromotion(candidate.candidateId, evaluation.evaluationId);
    const registry = new CapabilityRegistry();
    const dynamicRoutes = new Map();
    const orchestrator = { registerDynamic: (manifest, route) => dynamicRoutes.set(manifest.capabilityId, route), unregisterDynamic: (id) => dynamicRoutes.delete(id) };
    const engine = new GrowthEngine({ store, registry, orchestrator, rcl: { compileRealityPlan: async (input) => input }, config: {} });
    assert.throws(() => engine.promote(promotion.promotionId), (error) => error.code === 'PROMOTION_REVIEW_REQUIRED');
    store.reviewPromotion(promotion.promotionId, { reviewer: 'human-owner', verdict: 'approved', reason: 'all bounded cases passed' });
    const promoted = engine.promote(promotion.promotionId);
    assert.equal(promoted.promotion.status, 'promoted');
    assert.equal(promoted.manifest.evidenceLevel, 'verified');
    assert.equal(registry.has(candidate.capabilityId), true);
    assert.equal(dynamicRoutes.get(candidate.capabilityId), 'turi.workflow.cinematic-task');
    const version = promoted.lineage.currentVersion;
    assert.equal(store.versions(candidate.capabilityId).length, 1);
    assert.deepEqual(engine.rollbackPromotion(candidate.capabilityId, version), { capabilityId: candidate.capabilityId, restoredVersion: version, historyRetained: true });
    assert.equal(store.lineage(candidate.capabilityId).currentVersion, version);
    assert.equal(store.learningReport().promotedCapabilities.length, 1);
  } finally {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
