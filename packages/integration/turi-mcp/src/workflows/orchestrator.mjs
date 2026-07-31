import { sha256 } from '../canonical.mjs';
import { DOMAIN_EVIDENCE_ROLES, DOMAIN_RESEARCH_PROFILE, researchOutputContract, researchTokenBudget } from '../adapters/updia.mjs';
import {
  HOST_PERMISSION_MODEL,
  assistedExperienceCandidate,
  createHostResumeToken,
  readHostResumeToken,
  validateHostContribution,
} from '../host/intervention.mjs';

function capabilityError(code, message, details = null) {
  const error = new Error(message);
  error.code = code;
  error.classification = 'capability';
  error.details = details;
  return error;
}

function groundedFacts(sourceEvidence) {
  return (sourceEvidence?.packet?.claims ?? []).map((claim) => ({
    claimId: claim.claimId,
    statement: claim.statement,
    claimType: claim.claimType,
    sourceRefs: claim.sourceRefs ?? [],
    confidence: claim.confidence ?? null,
    status: claim.status ?? null,
  }));
}

function researchTargetCount(input = {}) {
  if (Number.isInteger(input.targetCount)) return Math.max(1, Math.min(12, input.targetCount));
  const question = String(input.question ?? '');
  const numeric = question.match(/(?:列出|找出|识别|identify|list)?\s*(\d{1,2})\s*(?:个|项|类|条|problems?|questions?|issues?)/i);
  if (numeric) return Math.max(1, Math.min(12, Number(numeric[1])));
  const chinese = question.match(/(?:列出|找出|识别)?\s*([一二三四五六七八九十])\s*(?:个|项|类|条)/);
  if (chinese) return { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }[chinese[1]];
  return 6;
}

export class TuriOrchestrator {
  constructor({ config, adapters, artifacts, growthStore = null }) {
    this.config = config;
    this.adapters = adapters;
    this.artifacts = artifacts;
    this.growthStore = growthStore;
    this.dynamicRoutes = new Map();
  }

  registerDynamic(manifest, routeCapability) {
    this.dynamicRoutes.set(manifest.capabilityId, routeCapability ?? manifest.capabilityId);
  }

  unregisterDynamic(capabilityId) { this.dynamicRoutes.delete(capabilityId); }

  reasoningMode(input = {}) {
    const mode = String(input.reasoningMode ?? this.config.reasoningMode ?? 'host').trim().toLowerCase();
    if (!['host', 'local'].includes(mode)) throw capabilityError('REASONING_MODE_INVALID', 'reasoningMode must be host or local.');
    return mode;
  }

  async requestHostReasoning(input = {}) {
    const task = String(input.task ?? input.question ?? input.intent ?? '').trim();
    if (!task) throw capabilityError('HOST_TASK_REQUIRED', 'A host reasoning task is required.');
    const taskType = String(input.taskType ?? 'general');
    const completedSteps = Array.isArray(input.completedSteps) ? [...input.completedSteps] : [];
    const failedSteps = Array.isArray(input.failedSteps) ? [...input.failedSteps] : [];
    const knowledgeGaps = Array.isArray(input.knowledgeGaps) ? [...input.knowledgeGaps] : [];
    const retrievalQuery = String(input.retrievalQuery ?? task).trim();
    const retrievalBudget = input.retrievalBudget ?? 20;
    const domains = Array.isArray(input.domains) ? input.domains : [];
    const evidenceRoles = Array.isArray(input.evidenceRoles) && input.evidenceRoles.length
      ? input.evidenceRoles
      : taskType === 'research' ? DOMAIN_EVIDENCE_ROLES : [];
    let subject = null;
    let sourceEvidence = null;

    if (this.adapters.updia.configured()) {
      try {
        subject = await this.adapters.updia.subjectStatus();
        completedSteps.push({ step: 'updia.subject_status', status: 'completed' });
      } catch (error) {
        failedSteps.push({ step: 'updia.subject_status', code: error.code ?? error.name, message: error.message });
      }
      if (retrievalQuery) {
        try {
          sourceEvidence = await this.adapters.updia.memorySearch({
            query: retrievalQuery,
            retrievalBudget,
            profile: taskType === 'research' ? DOMAIN_RESEARCH_PROFILE : 'research',
            domains,
            evidenceRoles,
            callerContext: { workflow: 'turi_request_host_reasoning', taskType },
          });
          completedSteps.push({
            step: 'updia.memory_search',
            status: 'completed',
            packetId: sourceEvidence?.packet?.packetId ?? null,
            traceId: sourceEvidence?.trace?.traceId ?? null,
          });
        } catch (error) {
          failedSteps.push({ step: 'updia.memory_search', code: error.code ?? error.name, message: error.message });
          knowledgeGaps.push({ gap: 'evidence_retrieval_failed', code: error.code ?? error.name });
        }
      }
    } else {
      knowledgeGaps.push({ gap: 'updia_not_configured', effect: 'No continuity or evidence packet is available.' });
    }

    const knownFacts = groundedFacts(sourceEvidence);
    const supportingEvidence = (sourceEvidence?.packet?.supportingEvidence ?? []).map((source) => ({
      sourceId: source.sourceId,
      title: source.title,
      uriOrPath: source.uriOrPath,
      content: source.content,
      evidenceRole: source.evidenceRole ?? source.metadata?.evidenceRole ?? null,
      authority: source.authority ?? null,
      root: source.root ?? null,
    }));
    const evidence = {
      packetId: sourceEvidence?.packet?.packetId ?? null,
      traceId: sourceEvidence?.trace?.traceId ?? null,
      claimIds: knownFacts.map((fact) => fact.claimId),
      sourceIds: supportingEvidence.map((source) => source.sourceId),
      root: sourceEvidence?.root ?? sourceEvidence?.packet?.root ?? sourceEvidence?.index?.root ?? null,
    };
    const requiredOutput = input.requiredOutput && typeof input.requiredOutput === 'object'
      ? input.requiredOutput
      : { type: 'structured-host-contribution', fields: ['analysis', 'assumptions', 'proposal', 'unknowns'] };
    const continuation = createHostResumeToken({
      task,
      taskType,
      reason: input.reason ?? 'host_reasoning_is_primary',
      completedSteps,
      failedSteps,
      knowledgeGaps,
      requiredOutput,
      evidence,
      allowedActions: input.allowedActions,
    }, { ttlMs: this.config.hostResumeTtlMs, secret: this.config.hostResumeSecret });

    return {
      format: 'turi.host-intervention-request.v0.1',
      status: 'REQUIRES_HOST_REASONING',
      reason: input.reason ?? 'host_reasoning_is_primary',
      task,
      taskType,
      completedSteps,
      failedSteps,
      knowledgeGaps,
      requiredOutput,
      evidencePacket: {
        packetId: evidence.packetId,
        traceId: evidence.traceId,
        root: evidence.root,
        knownFacts,
        supportingEvidence,
      },
      subject: subject ? {
        subjectId: subject.subjectId ?? null,
        identityRoot: subject.identityRoot ?? null,
        lineageId: subject.lineageId ?? null,
      } : null,
      permissionBoundary: {
        currentLevel: 'L0',
        resumeCeiling: 'L2',
        levels: HOST_PERMISSION_MODEL,
        formalWritesGranted: false,
        externalEffectsGranted: false,
      },
      resumeToken: continuation.token,
      resumeTokenSecurity: continuation.security,
      allowedActions: continuation.payload.allowedActions,
      next: {
        capabilityId: 'turi.host.resume-with-contribution',
        tool: 'turi_resume_with_host_contribution',
        arguments: { resumeToken: continuation.token },
      },
      limitations: [
        'The MCP server cannot initiate a new host turn; the current host must read this request and call the resume tool.',
        'The resume token is an integrity envelope, not an authority credential and not encrypted.',
      ],
    };
  }

  async resumeWithHostContribution(input = {}, context = {}) {
    const session = readHostResumeToken(input.resumeToken, { secret: this.config.hostResumeSecret });
    const validation = validateHostContribution(session, input);
    if (!validation.accepted) {
      return {
        format: 'turi.host-intervention-resume.v0.1',
        status: 'HOST_CONTRIBUTION_REJECTED',
        interventionId: session.interventionId,
        validation,
        rcl: null,
        rncs: null,
        next: { action: 'correct_host_contribution', capabilityId: 'turi.host.resume-with-contribution' },
      };
    }

    const requestedActions = validation.permissionCheck.requestedActions.length
      ? validation.permissionCheck.requestedActions
      : ['accept_analysis'];
    let rcl = null;
    let rncs = null;
    if (requestedActions.includes('compile')) {
      try {
        const compiledPlan = await this.adapters.rcl.compileRealityPlan({ source: input.rclSource, language: input.language ?? 'RCL' });
        rcl = { status: 'compiled', compiledPlan, sourceHash: `sha256:${sha256(input.rclSource)}` };
      } catch (error) {
        return {
          format: 'turi.host-intervention-resume.v0.1',
          status: 'HOST_CONTRIBUTION_REJECTED',
          interventionId: session.interventionId,
          validation,
          rcl: { status: 'failed', error: { code: error.code ?? error.name, message: error.message } },
          rncs: null,
          next: { action: 'repair_rcl_source', capabilityId: 'turi.host.resume-with-contribution' },
        };
      }
    }
    if (requestedActions.includes('simulate')) {
      try {
        rncs = await this.candidateExecute({
          source: input.rclSource,
          language: input.language ?? 'RCL',
          subject_id: input.subjectId,
        }, context);
      } catch (error) {
        return {
          format: 'turi.host-intervention-resume.v0.1',
          status: 'HOST_CONTRIBUTION_REJECTED',
          interventionId: session.interventionId,
          validation,
          rcl,
          rncs: { status: 'failed', error: { code: error.code ?? error.name, message: error.message, details: error.details ?? null } },
          next: { action: 'repair_candidate', capabilityId: 'turi.host.resume-with-contribution' },
        };
      }
    }

    const result = {
      format: 'turi.host-intervention-resume.v0.1',
      status: 'HOST_CONTRIBUTION_ACCEPTED',
      interventionId: session.interventionId,
      task: session.task,
      validation,
      hostContribution: {
        analysis: input.analysis ?? null,
        structuredPlan: input.structuredPlan ?? null,
        hostEvidence: input.hostEvidence ?? [],
        contributionHash: validation.contributionHash,
      },
      rcl,
      rncs,
      authorityBoundary: {
        level: 'L2',
        formalStateChanged: rncs ? rncs.authorityInvariant?.unchanged !== true : false,
        formalWritesGranted: false,
        externalEffectsGranted: false,
      },
      next: {
        capabilityId: 'turi.host.record-assisted-experience',
        tool: 'turi_record_assisted_experience',
        requiresPolicyForPersistence: true,
      },
    };
    result.experienceCandidate = assistedExperienceCandidate(session, {
      hostContribution: result.hostContribution,
      compilerVerification: rcl,
      simulationVerification: rncs,
      outcome: { status: 'accepted' },
    }, result);
    return result;
  }

  async recordAssistedExperience(input = {}) {
    if (!this.growthStore) throw capabilityError('GROWTH_STORE_UNAVAILABLE', 'The assisted experience candidate store is unavailable.');
    const session = readHostResumeToken(input.resumeToken, { secret: this.config.hostResumeSecret });
    const candidate = assistedExperienceCandidate(session, input);
    const outcomeStatus = String(candidate.components.outcome?.status ?? 'unknown');
    const contextFingerprint = `sha256:${sha256({ interventionId: candidate.interventionId, evidence: session.evidence })}`;
    const existing = this.growthStore.state?.experiences?.find((item) => item.contextFingerprint === contextFingerprint);
    if (existing) {
      return {
        format: 'turi.assisted-experience-record.v0.1',
        status: 'EXPERIENCE_CANDIDATE_ALREADY_RECORDED',
        candidate,
        experience: existing,
        storage: { store: 'turi-growth-store', formalUpdiaMemoryCommitted: false, idempotentReplay: true },
      };
    }
    const experience = this.growthStore.recordExperience({
      taskType: candidate.taskType,
      goal: candidate.goal,
      contextFingerprint,
      capabilitiesUsed: ['turi.host.request-reasoning', 'turi.host.resume-with-contribution'],
      successfulSteps: outcomeStatus === 'success' || outcomeStatus === 'accepted'
        ? [{ step: 'host_intervention', interventionId: candidate.interventionId }]
        : [],
      failedSteps: outcomeStatus === 'failed' ? [candidate.components.outcome] : [],
      residuals: candidate.components.outcome?.residuals ?? [],
      evidenceReceipts: candidate.evidenceReceipts,
      reusableConfidence: candidate.evidenceReceipts.length ? 0.6 : 0.25,
      generalizationScope: [candidate.taskType, 'host-assisted'],
      knownFailureBoundaries: candidate.components.outcome?.failureBoundaries ?? [],
      assistance: { interventionId: candidate.interventionId, ...candidate.components },
    });
    return {
      format: 'turi.assisted-experience-record.v0.1',
      status: 'EXPERIENCE_CANDIDATE_RECORDED',
      candidate,
      experience,
      storage: {
        store: 'turi-growth-store',
        formalUpdiaMemoryCommitted: false,
        durability: String(this.config.dataDir ?? '').replaceAll('\\', '/').startsWith('/tmp/') ? 'serverless-instance-ephemeral' : 'configured-filesystem',
      },
      next: {
        formalMemoryWrite: 'updia.memory_write_candidate',
        formalMemoryCommit: 'updia.memory_commit',
        authorityRequiredForCommit: true,
      },
    };
  }

  async intentCompile(input = {}, context = {}) {
    const limitations = [];
    const analysis = { status: 'not_configured' };
    let subject = null;
    const reasoningMode = this.reasoningMode(input);
    if (reasoningMode === 'host') {
      if (input.rclSource) {
        analysis.status = 'host_source_supplied';
        analysis.response = { status: 'HOST_CONTRIBUTION_SUPPLIED', sourceHash: `sha256:${sha256(input.rclSource)}` };
        if (this.adapters.updia.configured()) {
          try { subject = await this.adapters.updia.subjectStatus(); }
          catch (error) { limitations.push(`UPDIA subject status failed: ${error.code ?? error.message}`); }
        }
      } else {
        analysis.status = 'requires_host_reasoning';
        analysis.response = await this.requestHostReasoning({
          task: input.intent,
          taskType: 'formal_protocol',
          reason: 'formal_protocol_generation_requires_host_reasoning',
          retrievalQuery: input.intent,
          requiredOutput: {
            type: 'intent-to-rcl-contribution',
            fields: ['analysis', 'structuredPlan', 'rclSource'],
            factInferenceSeparationRequired: true,
          },
          allowedActions: ['accept_analysis', 'compile', 'simulate', 'record_experience'],
        });
        subject = analysis.response.subject;
        limitations.push('No local generation model was called; the current host must supply the missing formal contribution.');
      }
    } else if (this.adapters.updia.configured()) {
      try {
        subject = await this.adapters.updia.subjectStatus();
        analysis.status = 'executed_local_fallback';
        analysis.response = await this.adapters.updia.think({ goal: input.intent, outputContract: { type: 'intent-analysis', fields: ['goal', 'assumptions', 'acceptance', 'risks'] } });
      } catch (error) {
        limitations.push(`UPDIA local fallback analysis failed: ${error.code ?? error.message}`);
        analysis.status = 'failed';
      }
    } else {
      limitations.push('UPDIA is not configured; intent was not silently converted into a model-generated plan.');
    }
    let compiledPlan = null;
    if (input.rclSource) compiledPlan = await this.adapters.rcl.compileRealityPlan({ source: input.rclSource, language: input.language ?? 'RCL' });
    else limitations.push('No rclSource was supplied; RCL compilation is pending and the intent remains a bounded proposal.');
    return {
      format: 'turi.intent-compile.v0.2',
      intent: input.intent,
      mode: input.mode ?? 'read_only',
      reasoningMode,
      subject,
      analysis,
      compiledPlan,
      sourceRequired: !compiledPlan,
      limitations,
      next: compiledPlan && input.mode === 'candidate'
        ? 'turi.candidate.execute'
        : compiledPlan
          ? 'review-plan'
          : analysis.response?.next ?? 'provide-rclSource',
    };
  }

  async candidateExecute(input = {}, context = {}) {
    const before = await this.adapters.rncs.worldStatus();
    context.event?.('rncs.compile', { status: 'RUNNING' });
    const plan = await this.adapters.rncs.compilePlan(input);
    const validated = await this.adapters.rncs.validatePlan({ plan });
    if (!validated?.valid) throw capabilityError('RNCS_PLAN_VALIDATION_FAILED', 'RNCS rejected the compiled plan before candidate creation.', { validation: validated, semanticFidelity: plan.semantic_fidelity ?? null });
    context.event?.('rncs.create-candidate', { status: 'RUNNING' });
    const candidate = await this.adapters.rncs.createCandidate({ plan }, { idempotencyKey: `turi-candidate:${plan.plan_id ?? sha256(plan)}` });
    context.event?.('rncs.simulate-candidate', { candidateId: candidate.candidate_id, status: 'RUNNING' });
    const simulation = await this.adapters.rncs.simulateCandidate({ candidate_id: candidate.candidate_id }, { idempotencyKey: `turi-simulate:${candidate.candidate_id}` });
    const diff = await this.adapters.rncs.diffCandidate({ candidate_id: candidate.candidate_id });
    const after = await this.adapters.rncs.worldStatus();
    const unchanged = before.state_root === after.state_root && before.revision === after.revision;
    if (!unchanged) throw capabilityError('AUTHORITY_INVARIANT_FAILED', 'Candidate workflow changed formal RNCS state.', { before, after });
    return {
      format: 'turi.candidate-workflow.v0.1',
      plan: { plan_id: plan.plan_id, source: plan.source, validation: validated, semanticFidelity: plan.semantic_fidelity ?? validated.semanticFidelity?.gate ?? null },
      candidate: { candidate_id: candidate.candidate_id, status: candidate.status, baseline_root: candidate.baseline_root, baseline_revision: candidate.baseline_revision },
      simulation: { status: simulation.execution_receipt?.status ?? simulation.status, evidence_root: simulation.evidence_root, receipt: simulation.execution_receipt },
      diff,
      authorityInvariant: { unchanged, before: { stateRoot: before.state_root, revision: before.revision }, after: { stateRoot: after.state_root, revision: after.revision } },
      next: 'turi.candidate.review',
    };
  }

  async candidateReview({ candidate_id: candidateId } = {}) {
    return { format: 'turi.candidate-review.v0.1', candidate: await this.adapters.rncs.getCandidate({ candidate_id: candidateId }), diff: await this.adapters.rncs.diffCandidate({ candidate_id: candidateId }) };
  }

  async authorize(input = {}) { return { format: 'turi.authority-request.v0.1', authority: await this.adapters.rncs.authorizeCandidate(input), next: 'turi.merge' }; }

  async merge(input = {}) {
    const before = await this.adapters.rncs.worldStatus();
    if (before.state_root !== input.expected_state_root || Number(before.revision) !== Number(input.expected_revision)) throw capabilityError('STATE_PRECONDITION_FAILED', 'RNCS state root or revision is stale.', { expected: { stateRoot: input.expected_state_root, revision: input.expected_revision }, actual: { stateRoot: before.state_root, revision: before.revision } });
    const merged = await this.adapters.rncs.mergeCandidate(input, { idempotencyKey: `turi-merge:${input.candidate_id}:${before.state_root}` });
    const after = await this.adapters.rncs.worldStatus();
    return { format: 'turi.merge-result.v0.1', before, merged, after, changed: before.state_root !== after.state_root && Number(after.revision) > Number(before.revision) };
  }

  async rollback(input = {}) {
    const before = await this.adapters.rncs.worldStatus();
    if (before.state_root !== input.expected_state_root || Number(before.revision) !== Number(input.expected_revision)) throw capabilityError('STATE_PRECONDITION_FAILED', 'RNCS state root or revision is stale.', { expected: { stateRoot: input.expected_state_root, revision: input.expected_revision }, actual: { stateRoot: before.state_root, revision: before.revision } });
    const result = await this.adapters.rncs.rollbackGeneration(input);
    const after = await this.adapters.rncs.worldStatus();
    return { format: 'turi.rollback-result.v0.1', before, rollback: result, after, rollbackRef: result?.generation_id ?? input.generation_id };
  }

  async engineeringTask(input = {}, context = {}) {
    if (input.push || input.create_pr || input.deploy) {
      if (!this.config.externalEffectsEnabled) throw capabilityError('EXTERNAL_EFFECT_DISABLED', 'Push, PR, and deploy are disabled in TURI v0.1 unless external effects are explicitly enabled.');
    }
    context.event?.('engineering.workflow', { status: 'RUNNING' });
    const result = await this.adapters.rncs.developerEngineeringWorkflow({ push: false, create_pr: false, deploy: false, rollback_on_failure: true, allow_dirty: false, ...input });
    return { format: 'turi.engineering-workflow.v0.1', result, externalEffects: { push: Boolean(input.push), createPr: Boolean(input.create_pr), deploy: Boolean(input.deploy) } };
  }

  async worldTask(input = {}, context = {}) {
    const reasoningMode = this.reasoningMode(input);
    const result = { format: 'turi.world-workflow.v0.2', intent: input.intent, reasoningMode, cognition: null, candidate: null, gamebrain: null, limitations: [] };
    if (reasoningMode === 'host') {
      result.cognition = input.source
        ? { status: 'HOST_OR_USER_SOURCE_SUPPLIED', sourceHash: `sha256:${sha256(input.source)}` }
        : await this.requestHostReasoning({
            task: input.intent,
            taskType: 'world',
            reason: 'world_hypothesis_and_protocol_require_host_reasoning',
            retrievalQuery: input.intent,
            requiredOutput: { type: 'world-task-contribution', fields: ['analysis', 'structuredPlan', 'rclSource'], factInferenceSeparationRequired: true },
            allowedActions: ['accept_analysis', 'compile', 'simulate', 'record_experience'],
          });
      if (!input.source) result.limitations.push('No local generation model was called; RNCS execution is deferred until the host supplies a candidate source.');
    } else if (this.adapters.updia.configured()) {
      result.cognition = await this.adapters.updia.think({ goal: input.intent, outputContract: { type: 'world-task', fields: ['hypothesis', 'action', 'evidence'] } });
    } else result.limitations.push('UPDIA is not configured.');
    if (input.source) result.candidate = await this.candidateExecute({ source: input.source, language: input.language, subject_id: input.subject_id }, context);
    else result.limitations.push('No RCL/RNCS source was supplied; no candidate world was created.');
    if (input.run_gamebrain) {
      if (!this.adapters.gamebrain.status().configured) result.limitations.push('GameBrain provider is not configured.');
      else if (!input.seed) result.limitations.push('GameBrain requires a seed path inside the configured WorldSeed root.');
      else result.gamebrain = await this.adapters.gamebrain.simulate({ seed: input.seed, ticks: input.ticks ?? 1 });
    }
    return result;
  }

  async cinematicTask(input = {}) {
    const result = { format: 'turi.cinematic-workflow.v0.1', plan: this.adapters.rcl.adapterPlan('cinematic-ir', input.intent), render: null, limitations: [] };
    if (input.render) {
      if (!this.config.authorizedWritesEnabled && !this.config.externalEffectsEnabled) result.limitations.push('VSR render requires the configured Developer Execution Runtime and explicit candidate/authority policy.');
      else result.render = await this.adapters.rncs.vsrRender(input);
    } else result.limitations.push('Render was not requested; cinematic IR is adapter/static evidence only.');
    return result;
  }

  async researchTask(input = {}, context = {}) {
    const targetCount = researchTargetCount(input);
    const retrievalBudget = input.retrievalBudget ?? 20;
    const generationBudget = researchTokenBudget(input.budget, targetCount);
    const domains = Array.isArray(input.domains) ? input.domains : [];
    const reasoningMode = this.reasoningMode(input);
    if (reasoningMode === 'host') {
      const requiredOutput = {
        ...researchOutputContract(targetCount),
        hostShape: {
          analysis: {
            items: [{ knownFacts: [{ statement: 'string', evidenceIds: ['claim:<id> or source:<id>'] }], inference: 'string', falsifiableHypothesis: 'string', minimalExperiment: 'string', unknowns: ['string'], priority: 'P1|P2|P3' }],
          },
        },
      };
      const hostRequest = await this.requestHostReasoning({
        task: input.question,
        taskType: 'research',
        reason: 'high_order_research_requires_host_reasoning',
        retrievalQuery: input.question,
        retrievalBudget,
        domains,
        evidenceRoles: DOMAIN_EVIDENCE_ROLES,
        requiredOutput,
        allowedActions: ['accept_analysis', 'compile', 'simulate', 'record_experience'],
      });
      return {
        ...hostRequest,
        format: 'turi.research-workflow-host.v0.1',
        question: input.question,
        executionMode: 'host',
        reasoningMode,
        researchContract: {
          targetCount,
          retrievalBudget,
          generationBudget: null,
          profile: DOMAIN_RESEARCH_PROFILE,
          evidenceRoles: DOMAIN_EVIDENCE_ROLES,
          requiredOutput,
        },
        candidate: input.source ? { status: 'deferred', reason: 'Host contribution must be validated before the optional RNCS experiment.' } : null,
        limitations: [
          ...(hostRequest.limitations ?? []),
          'Generative Ollama is outside the primary path; use reasoningMode=local only for explicit offline fallback.',
        ],
      };
    }
    if (
      input.waitForCompletion !== true
      && this.adapters.updia.configured()
      && typeof this.adapters.updia.researchStart === 'function'
    ) {
      try {
        const started = await this.adapters.updia.researchStart({
          question: input.question,
          retrievalBudget,
          budget: generationBudget,
          targetCount,
          allowedOrgans: input.allowedOrgans ?? [],
          domains,
          callerContext: { workflow: 'turi_research_task', targetCount },
        });
        const candidateDeferred = Boolean(input.source);
        return {
          format: 'turi.research-workflow-job.v0.3',
          question: input.question,
          status: started.status,
          executionMode: 'bridge_async',
          jobId: started.jobId,
          pollAfterMs: started.pollAfterMs,
          knownFacts: started.knownFacts ?? groundedFacts(started.sourceEvidence),
          sourceEvidence: started.sourceEvidence ?? null,
          candidate: candidateDeferred
            ? {
                status: 'deferred',
                reason: 'The research job must complete before the optional RNCS experiment is started.',
              }
            : null,
          grounding: {
            requested: true,
            performed: Boolean(started.sourceEvidence?.packet?.packetId),
            retrieval: {
              status: started.sourceEvidence?.packet?.packetId ? 'executed' : 'returned_without_packet',
              packetId: started.sourceEvidence?.packet?.packetId ?? null,
              traceId: started.sourceEvidence?.trace?.traceId ?? null,
              claimCount: (started.knownFacts ?? groundedFacts(started.sourceEvidence)).length,
              storeRoot: started.sourceEvidence?.storeRoot ?? started.sourceEvidence?.index?.root ?? null,
            },
            reasoning: { status: started.status, jobId: started.jobId },
          },
          researchContract: started.researchContract ?? {
            targetCount,
            retrievalBudget,
            generationBudget,
            profile: DOMAIN_RESEARCH_PROFILE,
            evidenceRoles: DOMAIN_EVIDENCE_ROLES,
          },
          next: {
            capabilityId: 'updia.research_status',
            tool: 'updia_research_status',
            arguments: { jobId: started.jobId },
            terminalStatuses: ['completed', 'failed', 'cancelled'],
          },
          limitations: candidateDeferred
            ? ['Optional RNCS experiment source was retained but not executed while research reasoning is still running.']
            : [],
        };
      } catch (error) {
        if (!['UPDIA_REMOTE_ASYNC_REQUIRED', 'UPDIA_REMOTE_ASYNC_UNSUPPORTED'].includes(error.code)) throw error;
      }
    }
    const result = {
      format: 'turi.research-workflow.v0.2',
      question: input.question,
      status: 'ungrounded',
      knownFacts: [],
      sourceEvidence: null,
      hypothesis: null,
      subject: null,
      candidate: null,
      grounding: {
        requested: true,
        performed: false,
        retrieval: { status: 'not_attempted' },
        reasoning: { status: 'not_attempted' },
      },
      researchContract: {
        targetCount,
        retrievalBudget,
        generationBudget,
        profile: DOMAIN_RESEARCH_PROFILE,
        evidenceRoles: DOMAIN_EVIDENCE_ROLES,
      },
      limitations: [],
    };
    if (this.adapters.updia.configured()) {
      try {
        result.subject = await this.adapters.updia.subjectStatus();
      } catch (error) {
        result.limitations.push(`UPDIA subject status failed: ${error.code ?? error.message}`);
      }
      try {
        result.sourceEvidence = await this.adapters.updia.memorySearch({
          query: input.question,
          retrievalBudget,
          profile: DOMAIN_RESEARCH_PROFILE,
          domains,
          evidenceRoles: DOMAIN_EVIDENCE_ROLES,
          callerContext: { workflow: 'turi_research_task', targetCount },
        });
        result.knownFacts = groundedFacts(result.sourceEvidence);
        result.grounding.retrieval = {
          status: result.sourceEvidence?.packet?.packetId ? 'executed' : 'returned_without_packet',
          packetId: result.sourceEvidence?.packet?.packetId ?? null,
          traceId: result.sourceEvidence?.trace?.traceId ?? null,
          claimCount: result.knownFacts.length,
          storeRoot: result.sourceEvidence?.storeRoot ?? result.sourceEvidence?.index?.root ?? null,
        };
        result.grounding.performed = Boolean(result.sourceEvidence?.packet?.packetId);
      } catch (error) {
        result.grounding.retrieval = { status: 'failed', error: { code: error.code ?? error.name, message: error.message } };
        result.limitations.push(`UPDIA memory retrieval failed: ${error.code ?? error.message}`);
      }
      try {
        result.hypothesis = await this.adapters.updia.think({
          goal: input.question,
          groundingQuery: input.question,
          contextRefs: result.knownFacts.map((fact) => fact.claimId),
          budget: generationBudget,
          retrievalBudget,
          profile: DOMAIN_RESEARCH_PROFILE,
          domains,
          evidenceRoles: DOMAIN_EVIDENCE_ROLES,
          callerContext: { workflow: 'turi_research_task', targetCount },
          evidencePolicy: {
            factualClaimsRequireEvidenceIds: true,
            nonFactualTypes: ['inference', 'hypothesis', 'experiment_design', 'value_judgment', 'unknown'],
          },
          outputContract: researchOutputContract(targetCount),
        });
        result.grounding.reasoning = {
          status: 'executed',
          outputRoot: result.hypothesis?.outputRoot ?? result.hypothesis?.root ?? null,
        };
      } catch (error) {
        result.grounding.reasoning = { status: 'failed', error: { code: error.code ?? error.name, message: error.message } };
        result.limitations.push(`UPDIA reasoning failed: ${error.code ?? error.message}`);
      }
      result.status = result.grounding.performed
        ? result.grounding.reasoning.status === 'executed' ? 'grounded' : 'grounded_degraded'
        : 'ungrounded';
    } else {
      result.limitations.push('UPDIA is not configured; research result remains ungrounded.');
    }
    if (input.source) result.candidate = await this.candidateExecute({ source: input.source, language: input.language, subject_id: input.subject_id }, context);
    return result;
  }

  async invoke(capabilityId, input = {}, context = {}) {
    if (this.dynamicRoutes.has(capabilityId)) return this.invoke(this.dynamicRoutes.get(capabilityId), input, context);
    switch (capabilityId) {
      case 'turi.server.info': return context.serverInfo();
      case 'turi.health': return context.health();
      case 'turi.subject.status': case 'updia.status': case 'updia.subject_load': case 'updia.subject_checkpoint': case 'updia.sparse_scheduler_status': case 'updia.memory_checkpoint': return this.adapters.updia.status();
      case 'updia.health': return this.adapters.updia.health();
      case 'updia.list_organs': return this.adapters.updia.listOrgans(input);
      case 'updia.describe_organ': return this.adapters.updia.describeOrgan(input.organId);
      case 'updia.subject_close': return this.adapters.updia.subjectClose();
      case 'updia.think': return this.adapters.updia.think(input);
      case 'updia.plan': return this.adapters.updia.plan(input);
      case 'updia.organ_invoke': return this.adapters.updia.organInvoke(input);
      case 'updia.research_start': return this.adapters.updia.researchStart(input);
      case 'updia.research_status': return this.adapters.updia.researchStatus(input);
      case 'updia.memory_search': return this.adapters.updia.memorySearch(input);
      case 'updia.memory_read': return this.adapters.updia.memoryRead(input);
      case 'updia.memory_write_candidate': return this.adapters.updia.memoryWriteCandidate(input);
      case 'updia.memory_commit': return this.adapters.updia.memoryCommit(input);
      case 'updia.action_propose': return this.adapters.updia.actionPropose(input);
      case 'updia.action_result_ingest': return this.adapters.updia.actionResultIngest(input);
      case 'updia.learn_from_result': return this.adapters.updia.learnFromResult(input);
      case 'rcl.status': return this.adapters.rcl.status();
      case 'rcl.search': return this.adapters.rcl.search(input);
      case 'rcl.read_file': return this.adapters.rcl.readFile(input);
      case 'rcl.list_examples': return this.adapters.rcl.listExamples(input);
      case 'rcl.package_metadata': return this.adapters.rcl.packageMetadata();
      case 'rcl.native_vm_status': return this.adapters.rcl.nativeVmStatus();
      case 'rcl.compile_source': return this.adapters.rcl.compileSource(input);
      case 'rcl.compile_file': return this.adapters.rcl.compileFile(input);
      case 'rcl.disassemble_source': return this.adapters.rcl.disassembleSource(input);
      case 'rcl.disassemble_file': return this.adapters.rcl.disassembleFile(input);
      case 'rcl.run_source': return this.adapters.rcl.runSource(input);
      case 'rcl.run_file': return this.adapters.rcl.runFile(input);
      case 'rcl.selfhost_inventory': return this.adapters.rcl.selfhostInventory();
      case 'rcl.bootstrap_smoke': return this.adapters.rcl.bootstrapSmoke();
      case 'rcl.validate_reality_spec': return this.adapters.rcl.validateRealitySpec(input);
      case 'rcl.compile_reality_plan': return this.adapters.rcl.compileRealityPlan(input);
      case 'rcl.compile_cinematic_ir': return this.adapters.rcl.adapterPlan('cinematic-ir', input.intent);
      case 'rcl.compile_game_rule': return this.adapters.rcl.adapterPlan('game-rule', input.rule);
      case 'rcl.compile_asset_protocol': return this.adapters.rcl.adapterPlan('asset-protocol', input.intent);
      case 'rncs.status': return this.adapters.rncs.status();
      case 'rncs.list_runtimes': return this.adapters.rncs.runtimes();
      case 'rncs.runtime_health': return this.adapters.rncs.runtimeHealth(input.runtime_id);
      case 'rncs.runtime_action': return this.adapters.rncs.runtimeAction(input);
      case 'rncs.compile_plan': return this.adapters.rncs.compilePlan(input);
      case 'rncs.validate_plan': return this.adapters.rncs.validatePlan(input);
      case 'rncs.create_candidate': return this.adapters.rncs.createCandidate(input);
      case 'rncs.get_candidate': return this.adapters.rncs.getCandidate(input);
      case 'rncs.diff_candidate': return this.adapters.rncs.diffCandidate(input);
      case 'rncs.simulate_candidate': return this.adapters.rncs.simulateCandidate(input);
      case 'rncs.authorize_candidate': return this.adapters.rncs.authorizeCandidate(input);
      case 'rncs.reject_candidate': return this.adapters.rncs.rejectCandidate(input);
      case 'rncs.merge_candidate': return this.merge(input);
      case 'rncs.history': return this.adapters.rncs.history();
      case 'rncs.replay_generation': return this.replayGeneration(input);
      case 'rncs.rcl_compile_execute': return this.adapters.rncs.rclCompileExecute(input);
      case 'rncs.rcl_compile_authority_plan': return this.adapters.rncs.rclCompileAuthorityPlan(input);
      case 'rncs.rollback_generation': return this.rollback(input);
      case 'rncs.register_behavior': return this.adapters.rncs.registerBehavior(input);
      case 'rncs.update_behavior': return this.adapters.rncs.updateBehavior(input);
      case 'rncs.enable_behavior': return this.adapters.rncs.enableBehavior(input);
      case 'rncs.materialize_rsr': return this.adapters.rncs.materializeRsr(input);
      case 'rncs.rsr_simulate': return this.adapters.rncs.rsrSimulate(input);
      case 'rncs.vsr_render': return this.adapters.rncs.vsrRender(input);
      case 'rncs.run_loopback': return this.adapters.rncs.runLoopback(input);
      case 'rncs.invocation_receipts': return this.adapters.rncs.invocationReceipts(input.limit);
      case 'engineering.status': return this.adapters.rncs.developerStatus();
      case 'engineering.apply_patch': return this.adapters.rncs.applyPatch(input);
      case 'engineering.run_build': return this.adapters.rncs.runBuild(input);
      case 'engineering.git_status': return this.adapters.rncs.gitStatus(input);
      case 'engineering.commit': return this.adapters.rncs.gitCommit(input);
      case 'gamebrain.status': return this.adapters.gamebrain.status();
      case 'gamebrain.simulate': return this.adapters.gamebrain.simulate(input);
      case 'turi.host.request-reasoning': return this.requestHostReasoning(input);
      case 'turi.host.resume-with-contribution': return this.resumeWithHostContribution(input, context);
      case 'turi.host.record-assisted-experience': return this.recordAssistedExperience(input);
      case 'turi.intent.compile': return this.intentCompile(input, context);
      case 'turi.candidate.execute': return this.candidateExecute(input, context);
      case 'turi.candidate.review': return this.candidateReview(input);
      case 'turi.authorize': return this.authorize(input);
      case 'turi.merge': return this.merge(input);
      case 'turi.rollback': return this.rollback(input);
      case 'turi.workflow.intent-to-reality': return this.intentToReality(input, context);
      case 'turi.workflow.engineering-task': return this.engineeringTask(input, context);
      case 'turi.workflow.world-task': return this.worldTask(input, context);
      case 'turi.workflow.cinematic-task': return this.cinematicTask(input, context);
      case 'turi.workflow.research-task': return this.researchTask(input, context);
      default: throw capabilityError('CAPABILITY_NOT_IMPLEMENTED', `${capabilityId} has no executable adapter in TURI v0.1.`);
    }
  }

  async intentToReality(input = {}, context = {}) {
    const compiled = await this.intentCompile(input, context);
    const result = { format: 'turi.intent-to-reality.v0.1', compiled, candidate: null, limitations: [...compiled.limitations] };
    if (compiled.compiledPlan && input.mode === 'candidate') result.candidate = await this.candidateExecute({ source: input.rclSource, language: input.language, subject_id: input.subjectId }, context);
    else if (!compiled.compiledPlan) result.limitations.push('Candidate stage was not started because an explicit RCL source is required.');
    return result;
  }

  async replayGeneration(input = {}) {
    const before = await this.adapters.rncs.worldStatus();
    if (input.expected_state_root !== undefined && (before.state_root !== input.expected_state_root || Number(before.revision) !== Number(input.expected_revision))) {
      throw capabilityError('STATE_PRECONDITION_FAILED', 'RNCS replay precondition is stale.', { expected: { stateRoot: input.expected_state_root, revision: input.expected_revision }, actual: { stateRoot: before.state_root, revision: before.revision } });
    }
    const replay = await this.adapters.rncs.replayGeneration(input);
    const after = await this.adapters.rncs.worldStatus();
    return { format: 'turi.replay-result.v0.1', before, replay, after, authorityInvariant: { stateRootBefore: before.state_root, stateRootAfter: after.state_root, revisionBefore: before.revision, revisionAfter: after.revision } };
  }
}
