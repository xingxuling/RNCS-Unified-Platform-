import fs from 'node:fs';
import path from 'node:path';
import { canonicalJson, clone, nowIso, randomId, sha256 } from '../canonical.mjs';

function atomicJson(file, value) {
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, file);
}

function boundedConfidence(value, fallback = 0) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`${field} is required.`);
    error.code = 'GROWTH_INPUT_INVALID';
    throw error;
  }
  return value.trim();
}

export class GrowthStore {
  constructor(dataDir) {
    this.file = path.resolve(dataDir, 'growth', 'state.json');
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    this.state = { format: 'turi.growth-state.v0.1', experiences: [], patterns: [], protocols: [], candidates: [], evaluations: [], promotions: [], lineage: {}, reports: [], registryVersions: [] };
    if (fs.existsSync(this.file)) {
      try { this.state = { ...this.state, ...JSON.parse(fs.readFileSync(this.file, 'utf8')) }; } catch { /* retain an empty usable state if a prior report is corrupt */ }
    }
  }

  save() { atomicJson(this.file, this.state); }

  recordExperience(input = {}) {
    if (input.rawChat || input.chatText || input.conversation) {
      const error = new Error('Raw chat text is not an ExperienceRecord. Submit structured execution evidence instead.');
      error.code = 'UNVERIFIED_CHAT_NOT_EXPERIENCE';
      throw error;
    }
    const taskType = requireText(input.taskType, 'taskType');
    const goal = requireText(input.goal, 'goal');
    const capabilitiesUsed = Array.isArray(input.capabilitiesUsed) ? [...new Set(input.capabilitiesUsed.map(String))] : [];
    const evidenceReceipts = Array.isArray(input.evidenceReceipts) ? [...new Set(input.evidenceReceipts.map(String))] : [];
    const experience = {
      format: 'turi.experience-record.v0.1', experienceId: randomId('experience'), taskType, goal,
      contextFingerprint: input.contextFingerprint ?? `sha256:${sha256({ taskType, goal, context: input.context ?? null })}`,
      capabilitiesUsed, protocolRefs: Array.isArray(input.protocolRefs) ? input.protocolRefs.map(String) : [],
      successfulSteps: clone(input.successfulSteps ?? []), failedSteps: clone(input.failedSteps ?? []), rejectedAlternatives: clone(input.rejectedAlternatives ?? []), residuals: clone(input.residuals ?? []), userFeedback: clone(input.userFeedback ?? []), evidenceReceipts, artifactRefs: Array.isArray(input.artifactRefs) ? input.artifactRefs.map(String) : [],
      reusableConfidence: boundedConfidence(input.reusableConfidence, evidenceReceipts.length ? 0.5 : 0), generalizationScope: Array.isArray(input.generalizationScope) ? input.generalizationScope.map(String) : [], knownFailureBoundaries: Array.isArray(input.knownFailureBoundaries) ? input.knownFailureBoundaries.map(String) : [], createdAt: nowIso(), verification: evidenceReceipts.length ? 'receipt-backed' : 'unverified',
    };
    this.state.experiences.push(experience);
    this.save();
    return clone(experience);
  }

  getExperience(experienceId) { return clone(this.state.experiences.find((item) => item.experienceId === experienceId) ?? null); }

  searchExperiences({ query = '', taskType, limit = 50 } = {}) {
    const needle = String(query).toLowerCase();
    return clone(this.state.experiences.filter((item) => (!taskType || item.taskType === taskType) && (!needle || JSON.stringify(item).toLowerCase().includes(needle))).slice(-Math.min(Math.max(Number(limit) || 50, 1), 200)));
  }

  compareExperiences(ids = []) {
    const items = ids.map((id) => this.state.experiences.find((item) => item.experienceId === id)).filter(Boolean);
    const sets = items.map((item) => new Set(item.capabilitiesUsed));
    const commonCapabilities = sets.length ? [...sets[0]].filter((capability) => sets.every((set) => set.has(capability))) : [];
    return { experienceIds: items.map((item) => item.experienceId), count: items.length, commonCapabilities, taskTypes: [...new Set(items.map((item) => item.taskType))], failureBoundaries: [...new Set(items.flatMap((item) => item.knownFailureBoundaries))], receiptCoverage: items.length ? items.filter((item) => item.evidenceReceipts.length).length / items.length : 0 };
  }

  minePattern({ taskType, threshold = 3 } = {}) {
    const support = this.state.experiences.filter((item) => !taskType || item.taskType === taskType);
    if (support.length < threshold) return { status: 'insufficient_support', required: threshold, supportCount: support.length, pattern: null };
    const stepFrequency = new Map();
    for (const experience of support) for (const step of experience.successfulSteps) {
      const key = typeof step === 'string' ? step : step.stepId ?? step.name ?? JSON.stringify(step);
      const item = stepFrequency.get(key) ?? { key, count: 0, examples: [] };
      item.count += 1; if (item.examples.length < 3) item.examples.push(clone(step)); stepFrequency.set(key, item);
    }
    const commonCapabilities = this.compareExperiences(support.map((item) => item.experienceId)).commonCapabilities;
    const evidenceCoverage = support.filter((item) => item.evidenceReceipts.length).length / support.length;
    const pattern = { format: 'turi.reusable-pattern-candidate.v0.1', patternId: randomId('pattern'), supportingExperienceIds: support.map((item) => item.experienceId), recurringStructure: { commonCapabilities, repeatedSteps: [...stepFrequency.values()].filter((item) => item.count >= threshold).map((item) => item.examples[0]) }, triggeringConditions: support.map((item) => ({ taskType: item.taskType, contextFingerprint: item.contextFingerprint })), successfulActions: support.flatMap((item) => item.successfulSteps).slice(0, 100), failureConditions: support.flatMap((item) => [...item.failedSteps, ...item.residuals]).slice(0, 100), proposedInvariants: [...new Set(support.flatMap((item) => item.knownFailureBoundaries))].map((boundary) => ({ boundary })), confidence: boundedConfidence(support.reduce((sum, item) => sum + item.reusableConfidence, 0) / support.length) * evidenceCoverage, evidenceCoverage, status: 'candidate', createdAt: nowIso() };
    this.state.patterns.push(pattern); this.save(); return clone(pattern);
  }

  getPattern(patternId) { return clone(this.state.patterns.find((item) => item.patternId === patternId) ?? null); }
  patternStatus(patternId) { return patternId ? this.getPattern(patternId) : clone(this.state.patterns.slice(-20)); }
  patternEvidence(patternId) { const pattern = this.getPattern(patternId); return pattern ? { pattern, experiences: pattern.supportingExperienceIds.map((id) => this.getExperience(id)).filter(Boolean) } : null; }

  createProtocol(input = {}) {
    const patternIds = Array.isArray(input.derivedFromPatterns) ? input.derivedFromPatterns.map(String) : [];
    if (!patternIds.length) { const error = new Error('At least one derived pattern is required.'); error.code = 'GROWTH_INPUT_INVALID'; throw error; }
    const protocol = { format: 'turi.generative-protocol-candidate.v0.1', protocolId: randomId('protocol'), version: String(input.version ?? '0.1.0'), derivedFromPatterns: patternIds, inputContract: clone(input.inputContract ?? { type: 'object' }), stateModel: clone(input.stateModel ?? {}), generationOperators: clone(input.generationOperators ?? []), routingRules: clone(input.routingRules ?? []), evaluationRules: clone(input.evaluationRules ?? []), repairRules: clone(input.repairRules ?? []), terminationConditions: clone(input.terminationConditions ?? []), invariants: clone(input.invariants ?? []), permissions: clone(input.permissions ?? [{ executionMode: 'candidate' }]), evidenceRequirements: clone(input.evidenceRequirements ?? ['EvidenceReceipt']), rollbackPolicy: clone(input.rollbackPolicy ?? { mode: 'reality_branch' }), implementationLevel: input.implementationLevel ?? 'spec_only', status: 'candidate', source: clone(input.source ?? null), createdAt: nowIso(), compiled: null, diff: null };
    this.state.protocols.push(protocol); this.save(); return clone(protocol);
  }

  getProtocol(protocolId) { return clone(this.state.protocols.find((item) => item.protocolId === protocolId) ?? null); }
  diffProtocol(protocolId, next = null) { const current = this.getProtocol(protocolId); if (!current) return null; return { protocolId, changed: next ? canonicalJson(current) !== canonicalJson(next) : false, current, proposed: clone(next) }; }
  updateProtocol(protocolId, patch = {}) { const item = this.state.protocols.find((candidate) => candidate.protocolId === protocolId); if (!item) return null; Object.assign(item, clone(patch), { updatedAt: nowIso() }); this.save(); return clone(item); }

  buildCapabilityCandidate(input = {}) {
    const protocol = this.getProtocol(input.protocolId);
    if (!protocol) { const error = new Error(`Unknown protocol: ${input.protocolId}`); error.code = 'PROTOCOL_NOT_FOUND'; throw error; }
    const capabilityId = requireText(input.capabilityId ?? `${input.domain ?? 'research'}.${String(input.slug ?? protocol.protocolId).replace(/[^A-Za-z0-9_.-]/g, '-')}`, 'capabilityId');
    const candidate = { format: 'turi.capability-candidate.v0.1', candidateId: randomId('capability-candidate'), capabilityId, displayName: input.displayName ?? capabilityId, domain: input.domain ?? 'research', description: input.description ?? `Candidate derived from ${protocol.protocolId}.`, inputSchema: clone(input.inputSchema ?? protocol.inputContract), outputSchema: clone(input.outputSchema ?? { type: 'object' }), executionMode: 'candidate', rollbackSupport: input.rollbackSupport ?? 'reality_branch', evidenceLevel: 'declared', implementation: input.implementation ?? 'adapter', timeoutMs: Number(input.timeoutMs ?? 30_000), outputLimitBytes: Number(input.outputLimitBytes ?? 200_000), routeCapability: input.routeCapability ?? 'turi.workflow.research-task', sourceProtocols: [protocol.protocolId], sourcePatterns: protocol.derivedFromPatterns, sourceExperiences: protocol.derivedFromPatterns.flatMap((id) => this.getPattern(id)?.supportingExperienceIds ?? []), status: 'candidate', createdAt: nowIso() };
    this.state.candidates.push(candidate); this.save(); return clone(candidate);
  }

  getCandidate(candidateId) { return clone(this.state.candidates.find((item) => item.candidateId === candidateId) ?? null); }
  diffCandidate(candidateId, next = null) { const current = this.getCandidate(candidateId); return current ? { candidateId, changed: next ? canonicalJson(current) !== canonicalJson(next) : false, current, proposed: clone(next) } : null; }

  evaluate(candidateId, input = {}) {
    const candidate = this.getCandidate(candidateId);
    if (!candidate) { const error = new Error(`Unknown capability candidate: ${candidateId}`); error.code = 'CAPABILITY_CANDIDATE_NOT_FOUND'; throw error; }
    const cases = Array.isArray(input.cases) ? input.cases : [];
    const passed = cases.filter((item) => item.passed === true || (item.expected !== undefined && canonicalJson(item.expected) === canonicalJson(item.observed))).length;
    const total = cases.length;
    const regressionCases = cases.filter((item) => item.kind === 'regression');
    const failures = cases.filter((item) => item.passed === false || (item.expected !== undefined && canonicalJson(item.expected) !== canonicalJson(item.observed)));
    const securityCases = cases.filter((item) => item.kind === 'security');
    const rollbackCases = cases.filter((item) => item.kind === 'rollback');
    const securityPass = securityCases.length > 0 && securityCases.every((item) => item.passed === true);
    const rollbackPass = rollbackCases.length > 0 && rollbackCases.every((item) => item.passed === true);
    const evaluation = { format: 'turi.capability-evaluation.v0.1', evaluationId: randomId('evaluation'), candidateId, executionGrade: 'STATIC_VERIFIED', successRate: total ? passed / total : 0, regressionRate: regressionCases.length ? regressionCases.filter((item) => item.passed !== true).length / regressionCases.length : 0, falsePositiveRate: total ? cases.filter((item) => item.falsePositive === true).length / total : 0, falseNegativeRate: total ? cases.filter((item) => item.falseNegative === true).length / total : 0, determinismScore: Number(input.determinismScore ?? 0), evidenceCompleteness: total ? cases.filter((item) => item.evidenceReceiptId).length / total : 0, securityStatus: securityPass ? 'pass' : 'insufficient', rollbackStatus: rollbackPass ? 'pass' : 'insufficient', testedCases: cases.map((item) => String(item.caseId ?? item.kind ?? 'case')), failedCases: clone(failures), unsupportedScopes: clone(input.unsupportedScopes ?? []), recommendation: total >= 3 && passed / total >= 0.8 && evaluationSafe({ regressionRate: regressionCases.length ? regressionCases.filter((item) => item.passed !== true).length / regressionCases.length : 0, determinismScore: Number(input.determinismScore ?? 0), evidenceCompleteness: total ? cases.filter((item) => item.evidenceReceiptId).length / total : 0, securityPass, rollbackPass }) ? 'PROMOTE' : total >= 3 ? 'RESTRICT_SCOPE' : 'RETRY', testedAt: nowIso(), cases: clone(cases), coverage: { total, securityCases: securityCases.length, rollbackCases: rollbackCases.length, regressionCases: regressionCases.length } };
    this.state.evaluations.push(evaluation); this.save(); return clone(evaluation);
  }

  getEvaluation(evaluationId) { return clone(this.state.evaluations.find((item) => item.evaluationId === evaluationId) ?? null); }
  latestEvaluation(candidateId) { return clone(this.state.evaluations.filter((item) => item.candidateId === candidateId).at(-1) ?? null); }

  requestPromotion(candidateId, evaluationId) {
    const candidate = this.getCandidate(candidateId); const evaluation = this.getEvaluation(evaluationId) ?? this.latestEvaluation(candidateId);
    if (!candidate || !evaluation) { const error = new Error('Promotion requires an existing candidate and evaluation.'); error.code = 'PROMOTION_INPUT_INVALID'; throw error; }
    const promotion = { format: 'turi.capability-promotion.v0.1', promotionId: randomId('promotion'), candidateId, evaluationId: evaluation.evaluationId, status: 'requested', requestedAt: nowIso(), review: null, promotedVersion: null };
    this.state.promotions.push(promotion); this.save(); return clone(promotion);
  }

  reviewPromotion(promotionId, input = {}) { const item = this.state.promotions.find((candidate) => candidate.promotionId === promotionId); if (!item) return null; item.review = { reviewer: input.reviewer ?? 'unknown', verdict: input.verdict, reason: input.reason ?? '', at: nowIso() }; item.status = 'reviewed'; this.save(); return clone(item); }
  getPromotion(promotionId) { return clone(this.state.promotions.find((item) => item.promotionId === promotionId) ?? null); }
  markPromotion(promotionId, status, version = null) { const item = this.state.promotions.find((candidate) => candidate.promotionId === promotionId); if (!item) return null; item.status = status; item.promotedVersion = version; item.updatedAt = nowIso(); this.save(); return clone(item); }

  setLineage(capabilityId, lineage) { this.state.lineage[capabilityId] = { ...(this.state.lineage[capabilityId] ?? {}), ...clone(lineage), capabilityId, updatedAt: nowIso() }; this.save(); return clone(this.state.lineage[capabilityId]); }
  lineage(capabilityId) { return clone(this.state.lineage[capabilityId] ?? null); }
  versions(capabilityId) { return clone((this.state.registryVersions ?? []).filter((item) => item.capabilityId === capabilityId)); }
  compareVersions(capabilityId, left, right) { const a = this.versions(capabilityId).find((item) => item.version === left); const b = this.versions(capabilityId).find((item) => item.version === right); return a && b ? { capabilityId, left: a, right: b, changed: canonicalJson(a.manifest) !== canonicalJson(b.manifest) } : null; }
  restoreVersion(capabilityId, version) { const item = this.versions(capabilityId).find((candidate) => candidate.version === version); if (!item) return null; return clone(item); }
  saveVersion(capabilityId, version, manifest, metadata = {}) { const item = { capabilityId, version, manifest: clone(manifest), ...clone(metadata), savedAt: nowIso() }; this.state.registryVersions.push(item); this.save(); return clone(item); }

  candidateIdsFor(capabilityId) { return new Set(this.state.candidates.filter((item) => item.capabilityId === capabilityId || item.candidateId === capabilityId).map((item) => item.candidateId)); }
  health(capabilityId) { const lineage = capabilityId ? this.lineage(capabilityId) : null; const candidateIds = capabilityId ? this.candidateIdsFor(capabilityId) : null; const evaluations = capabilityId ? this.state.evaluations.filter((item) => candidateIds.has(item.candidateId) || item.candidateId === capabilityId) : this.state.evaluations; return { capabilityId, status: lineage?.status ?? 'unknown', evaluations: evaluations.length, latest: evaluations.at(-1) ?? null }; }
  conflictScan() { const byDomain = new Map(); for (const candidate of [...this.state.candidates, ...Object.values(this.state.lineage)]) { const key = candidate.domain ?? 'unknown'; const list = byDomain.get(key) ?? []; list.push(candidate.capabilityId ?? candidate.candidateId); byDomain.set(key, list); } return { conflicts: [...byDomain.entries()].filter(([, ids]) => ids.length > 1).map(([domain, ids]) => ({ domain, ids })) }; }
  deprecate(capabilityId, reason) { this.state.lineage[capabilityId] = { ...(this.state.lineage[capabilityId] ?? { capabilityId }), status: 'deprecated', deprecation: { reason, at: nowIso() } }; this.save(); return clone(this.state.lineage[capabilityId]); }
  archive(capabilityId, reason) { this.state.lineage[capabilityId] = { ...(this.state.lineage[capabilityId] ?? { capabilityId }), status: 'archived', archive: { reason, at: nowIso() } }; this.save(); return clone(this.state.lineage[capabilityId]); }
  prune(capabilityId) { const candidateIds = this.candidateIdsFor(capabilityId); const matches = this.state.promotions.filter((item) => candidateIds.has(item.candidateId) || item.candidateId === capabilityId); this.state.promotions = this.state.promotions.map((item) => candidateIds.has(item.candidateId) || item.candidateId === capabilityId ? { ...item, status: 'archived', archivedAt: nowIso() } : item); this.state.lineage[capabilityId] = { ...(this.state.lineage[capabilityId] ?? { capabilityId }), status: 'archived', prunedAt: nowIso() }; this.save(); return { capabilityId, archivedPromotions: matches.length, historyRetained: true }; }
  learningReport() { const promoted = this.state.promotions.filter((item) => item.status === 'promoted'); const rejected = this.state.promotions.filter((item) => item.status === 'rejected'); const capabilityName = (candidateId) => this.state.candidates.find((item) => item.candidateId === candidateId)?.capabilityId ?? candidateId; const report = { format: 'turi.learning-report.v0.1', reportId: randomId('learning-report'), createdAt: nowIso(), experienceCount: this.state.experiences.length, patternCandidates: this.state.patterns.length, protocolCandidates: this.state.protocols.length, capabilityCandidates: this.state.candidates.length, promotedCapabilities: promoted.map((item) => capabilityName(item.candidateId)), rejectedCapabilities: rejected.map((item) => capabilityName(item.candidateId)), restrictedCapabilities: this.state.evaluations.filter((item) => item.recommendation === 'RESTRICT_SCOPE').map((item) => capabilityName(item.candidateId)), deprecatedCapabilities: Object.values(this.state.lineage).filter((item) => ['deprecated', 'archived'].includes(item.status)).map((item) => item.capabilityId), conflicts: this.conflictScan().conflicts, validationGaps: this.state.evaluations.flatMap((item) => item.unsupportedScopes ?? []) }; this.state.reports.push(report); this.save(); return clone(report); }
}

function evaluationSafe({ regressionRate, determinismScore, evidenceCompleteness, securityPass, rollbackPass }) {
  return regressionRate === 0 && determinismScore >= 0.95 && evidenceCompleteness >= 1 && securityPass && rollbackPass;
}
