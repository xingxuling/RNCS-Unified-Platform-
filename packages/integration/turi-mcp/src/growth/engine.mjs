import { clone, nowIso } from '../canonical.mjs';

export class GrowthEngine {
  constructor({ store, registry, orchestrator, rcl, config }) {
    this.store = store;
    this.registry = registry;
    this.orchestrator = orchestrator;
    this.rcl = rcl;
    this.config = config;
    this.hydratePromoted();
  }

  hydratePromoted() {
    for (const promotion of this.store.state.promotions.filter((item) => item.status === 'promoted')) {
      const candidate = this.store.getCandidate(promotion.candidateId);
      if (!candidate || this.registry.has(candidate.capabilityId)) continue;
      this.registerCandidate(candidate);
    }
  }

  registerCandidate(candidate) {
    const manifest = {
      capabilityId: candidate.capabilityId,
      displayName: candidate.displayName,
      domain: candidate.domain,
      description: candidate.description,
      inputSchema: candidate.inputSchema,
      outputSchema: candidate.outputSchema,
      executionMode: candidate.executionMode,
      rollbackSupport: candidate.rollbackSupport,
      evidenceLevel: candidate.evidenceLevel,
      implementation: candidate.implementation,
      timeoutMs: candidate.timeoutMs,
      outputLimitBytes: candidate.outputLimitBytes,
      level: 'C',
      lineage: { sourceExperiences: candidate.sourceExperiences, sourcePatterns: candidate.sourcePatterns, sourceProtocols: candidate.sourceProtocols },
    };
    if (!this.registry.has(manifest.capabilityId)) this.registry.registerDynamic(manifest);
    this.orchestrator.registerDynamic(manifest, candidate.routeCapability);
    return manifest;
  }

  compileProtocol(protocolId, input = {}) {
    const protocol = this.store.getProtocol(protocolId);
    if (!protocol) throw Object.assign(new Error(`Unknown protocol: ${protocolId}`), { code: 'PROTOCOL_NOT_FOUND' });
    if (!input.source) return protocol;
    return this.rcl.compileRealityPlan({ source: input.source }).then((compiled) => this.store.updateProtocol(protocolId, { status: 'validated', implementationLevel: 'adapter', compiled, compiledAt: nowIso() }));
  }

  invokeCandidate(candidateId, input = {}) {
    const candidate = this.store.getCandidate(candidateId);
    if (!candidate) throw Object.assign(new Error(`Unknown capability candidate: ${candidateId}`), { code: 'CAPABILITY_CANDIDATE_NOT_FOUND' });
    return this.orchestrator.invoke(candidate.routeCapability, input);
  }

  requestPromotion(candidateId, evaluationId) { return this.store.requestPromotion(candidateId, evaluationId); }

  promote(promotionId) {
    const promotion = this.store.getPromotion(promotionId);
    if (!promotion) throw Object.assign(new Error(`Unknown promotion: ${promotionId}`), { code: 'PROMOTION_NOT_FOUND' });
    if (promotion.status === 'promoted') throw Object.assign(new Error('Promotion has already been applied.'), { code: 'PROMOTION_ALREADY_APPLIED' });
    const candidate = this.store.getCandidate(promotion.candidateId);
    const evaluation = this.store.getEvaluation(promotion.evaluationId);
    if (promotion.review?.verdict !== 'approved') throw Object.assign(new Error('Promotion Court requires an explicit approved review.'), { code: 'PROMOTION_REVIEW_REQUIRED' });
    if (!evaluation || evaluation.recommendation !== 'PROMOTE') throw Object.assign(new Error('Promotion requires a PROMOTE evaluation.'), { code: 'PROMOTION_EVALUATION_REQUIRED' });
    if (!Array.isArray(candidate.sourceExperiences) || new Set(candidate.sourceExperiences).size < 2) throw Object.assign(new Error('Promotion requires multiple independent supporting experiences.'), { code: 'PROMOTION_SUPPORT_INSUFFICIENT' });
    if (candidate.implementation === 'mock' || candidate.implementation === 'evidence_only' || candidate.executionMode === 'external_effect') throw Object.assign(new Error('Only a real adapter/provider/native candidate with bounded candidate execution can be promoted.'), { code: 'PROMOTION_IMPLEMENTATION_UNSAFE' });
    const manifest = this.registerCandidate({ ...candidate, evidenceLevel: 'verified', status: 'promoted' });
    const version = `${candidate.capabilityId}@${candidate.createdAt}`;
    this.store.saveVersion(candidate.capabilityId, version, manifest, { evaluationReceipt: evaluation.evaluationId, promotionId });
    this.store.setLineage(candidate.capabilityId, { currentVersion: version, parentCapabilities: [candidate.routeCapability], sourceExperiences: candidate.sourceExperiences, sourcePatterns: candidate.sourcePatterns, sourceProtocols: candidate.sourceProtocols, evaluationReceipts: [evaluation.evaluationId], promotions: [{ promotionId, at: nowIso() }], status: 'promoted' });
    this.store.markPromotion(promotionId, 'promoted', version);
    return { promotion: this.store.getPromotion(promotionId), manifest, lineage: this.store.lineage(candidate.capabilityId) };
  }

  rejectPromotion(promotionId, reason) { return this.store.markPromotion(promotionId, 'rejected', reason); }

  rollbackPromotion(capabilityId, version) {
    const restored = this.store.restoreVersion(capabilityId, version);
    if (!restored) throw Object.assign(new Error(`No stored capability version: ${capabilityId}@${version}`), { code: 'CAPABILITY_VERSION_NOT_FOUND' });
    this.registry.removeDynamic(capabilityId);
    const candidate = this.store.state.candidates.find((item) => item.capabilityId === capabilityId);
    if (candidate) this.registerCandidate({ ...candidate, ...restored.manifest });
    this.store.setLineage(capabilityId, { currentVersion: version, rollbacks: [...(this.store.lineage(capabilityId)?.rollbacks ?? []), { version, at: nowIso() }], status: 'promoted' });
    return { capabilityId, restoredVersion: version, historyRetained: true };
  }

  report() { return this.store.learningReport(); }
}
