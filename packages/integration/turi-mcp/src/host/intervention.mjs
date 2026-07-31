import crypto from 'node:crypto';
import { canonicalJson, clone, nowIso, randomId, sha256 } from '../canonical.mjs';

const TOKEN_FORMAT = 'turi.host-resume-token.v0.1';
const TOKEN_DOMAIN = 'taowind-host-intervention-v0.1';
const MAX_TOKEN_BYTES = 96 * 1024;
const ALLOWED_RESUME_ACTIONS = new Set(['accept_analysis', 'compile', 'simulate', 'record_experience']);

export const HOST_PERMISSION_MODEL = Object.freeze([
  Object.freeze({ level: 'L0', scope: 'retrieve_read_analyze', additionalAuthorization: false }),
  Object.freeze({ level: 'L1', scope: 'host_reasoning_and_rcl_draft', additionalAuthorization: false }),
  Object.freeze({ level: 'L2', scope: 'compile_test_and_isolated_simulation', additionalAuthorization: false }),
  Object.freeze({ level: 'L3', scope: 'persistent_experience_or_knowledge_candidate', additionalAuthorization: 'policy' }),
  Object.freeze({ level: 'L4', scope: 'formal_capability_state_or_external_effect', additionalAuthorization: true }),
]);

function interventionError(code, message, details = null) {
  const error = new Error(message);
  error.name = 'HostInterventionError';
  error.code = code;
  error.classification = 'protocol';
  error.details = details;
  return error;
}

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(String).map((value) => value.trim()).filter(Boolean))];
}

function safeActions(values = []) {
  return uniqueStrings(values).filter((value) => ALLOWED_RESUME_ACTIONS.has(value));
}

function asNonEmpty(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value && typeof value === 'object' && Object.keys(value).length > 0);
}

function evidenceRefsOf(fact = {}) {
  return uniqueStrings([
    ...(Array.isArray(fact.evidenceIds) ? fact.evidenceIds : []),
    ...(Array.isArray(fact.claimIds) ? fact.claimIds : []),
    ...(Array.isArray(fact.sourceRefs) ? fact.sourceRefs : []),
  ]);
}

export function createHostResumeToken({
  task,
  taskType = 'general',
  reason = 'host_reasoning_is_primary',
  completedSteps = [],
  failedSteps = [],
  knowledgeGaps = [],
  requiredOutput = {},
  evidence = {},
  allowedActions = ['accept_analysis', 'compile', 'simulate', 'record_experience'],
} = {}, { ttlMs = 2 * 60 * 60_000, now = Date.now(), secret } = {}) {
  if (typeof task !== 'string' || !task.trim()) throw interventionError('HOST_TASK_REQUIRED', 'A host reasoning task is required.');
  const boundedTtl = Math.min(Math.max(Number(ttlMs) || 2 * 60 * 60_000, 60_000), 24 * 60 * 60_000);
  const payload = {
    format: TOKEN_FORMAT,
    interventionId: randomId('host-intervention'),
    task: task.trim(),
    taskType: String(taskType || 'general'),
    reason: String(reason || 'host_reasoning_is_primary'),
    completedSteps: clone(completedSteps),
    failedSteps: clone(failedSteps),
    knowledgeGaps: clone(knowledgeGaps),
    requiredOutput: clone(requiredOutput),
    evidence: {
      packetId: evidence.packetId ?? null,
      traceId: evidence.traceId ?? null,
      claimIds: uniqueStrings(evidence.claimIds),
      sourceIds: uniqueStrings(evidence.sourceIds),
      root: evidence.root ?? null,
    },
    allowedActions: safeActions(allowedActions),
    authorityCeiling: 'L2',
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + boundedTtl).toISOString(),
  };
  const encoded = Buffer.from(canonicalJson(payload), 'utf8').toString('base64url');
  if (typeof secret !== 'string' || secret.length < 24) {
    throw interventionError('HOST_RESUME_SECRET_REQUIRED', 'A host resume signing secret of at least 24 characters is required.');
  }
  const signature = crypto.createHmac('sha256', secret).update(`${TOKEN_DOMAIN}:${encoded}`).digest('hex');
  return {
    token: `${encoded}.${signature}`,
    payload: clone(payload),
    security: {
      integrity: 'hmac-sha256',
      confidentiality: 'none',
      authority: 'none',
      note: 'The signed token resumes an L0-L2 candidate workflow; it cannot authorize persistent or external effects.',
    },
  };
}

export function readHostResumeToken(token, { now = Date.now(), secret } = {}) {
  if (typeof secret !== 'string' || secret.length < 24) throw interventionError('HOST_RESUME_SECRET_REQUIRED', 'A host resume signing secret of at least 24 characters is required.');
  if (typeof token !== 'string' || !token.trim()) throw interventionError('RESUME_TOKEN_REQUIRED', 'resumeToken is required.');
  if (Buffer.byteLength(token, 'utf8') > MAX_TOKEN_BYTES) throw interventionError('RESUME_TOKEN_TOO_LARGE', 'resumeToken exceeds the protocol limit.');
  const [encoded, signature, ...extra] = token.split('.');
  if (!encoded || !signature || extra.length || !/^[a-f0-9]{64}$/i.test(signature)) throw interventionError('RESUME_TOKEN_INVALID', 'resumeToken has an invalid envelope.');
  const expected = crypto.createHmac('sha256', secret).update(`${TOKEN_DOMAIN}:${encoded}`).digest('hex');
  const actualBytes = Buffer.from(signature.toLowerCase(), 'hex');
  const expectedBytes = Buffer.from(expected, 'hex');
  if (actualBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(actualBytes, expectedBytes)) throw interventionError('RESUME_TOKEN_INTEGRITY_FAILED', 'resumeToken signature does not match.');
  let payload;
  try { payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); }
  catch { throw interventionError('RESUME_TOKEN_INVALID', 'resumeToken payload is not valid JSON.'); }
  if (payload?.format !== TOKEN_FORMAT || payload.authorityCeiling !== 'L2') throw interventionError('RESUME_TOKEN_UNSUPPORTED', 'resumeToken format or authority ceiling is unsupported.');
  if (!Number.isFinite(Date.parse(payload.expiresAt)) || Date.parse(payload.expiresAt) <= now) throw interventionError('RESUME_TOKEN_EXPIRED', 'resumeToken has expired.', { expiresAt: payload.expiresAt });
  return clone(payload);
}

export function validateHostContribution(session, input = {}) {
  const analysis = input.analysis && typeof input.analysis === 'object' ? input.analysis : null;
  const structuredPlan = input.structuredPlan && typeof input.structuredPlan === 'object' ? input.structuredPlan : null;
  const rclSource = typeof input.rclSource === 'string' ? input.rclSource.trim() : '';
  const hostEvidence = Array.isArray(input.hostEvidence) ? input.hostEvidence : [];
  const suppliedActions = uniqueStrings(input.requestedActions);
  const requestedActions = suppliedActions.length ? suppliedActions : ['accept_analysis'];
  const deniedActions = requestedActions.filter((action) => !session.allowedActions.includes(action));
  const missingFields = [];
  const unsupportedEvidenceIds = [];
  const missingEvidence = [];
  const updiaEvidenceIds = uniqueStrings([...(session.evidence?.claimIds ?? []), ...(session.evidence?.sourceIds ?? [])]);
  const hostEvidenceIds = [];
  const invalidHostEvidence = [];
  hostEvidence.forEach((item, index) => {
    const evidenceId = typeof item?.evidenceId === 'string' ? item.evidenceId.trim() : '';
    const uri = typeof item?.uri === 'string' ? item.uri.trim() : '';
    let parsedUri = null;
    try { parsedUri = new URL(uri); } catch { /* reported below */ }
    if (!evidenceId) invalidHostEvidence.push(`hostEvidence[${index}].evidenceId`);
    if (!parsedUri || !['http:', 'https:'].includes(parsedUri.protocol)) invalidHostEvidence.push(`hostEvidence[${index}].uri`);
    if (!asNonEmpty(item?.title) || !asNonEmpty(item?.statement)) invalidHostEvidence.push(`hostEvidence[${index}].title|statement`);
    if (evidenceId && parsedUri && ['http:', 'https:'].includes(parsedUri.protocol) && asNonEmpty(item?.title) && asNonEmpty(item?.statement)) hostEvidenceIds.push(evidenceId);
  });
  const duplicateHostEvidenceIds = hostEvidenceIds.filter((id, index) => hostEvidenceIds.indexOf(id) !== index);
  if (duplicateHostEvidenceIds.length) invalidHostEvidence.push(...uniqueStrings(duplicateHostEvidenceIds).map((id) => `duplicate:${id}`));
  const allowedEvidence = new Set([...updiaEvidenceIds, ...hostEvidenceIds]);
  const required = session.requiredOutput ?? {};
  const researchContract = required.type === 'evidence-aligned-research-brief';

  if (!analysis && !structuredPlan && !rclSource) missingFields.push('analysis|structuredPlan|rclSource');
  if ((requestedActions.includes('compile') || requestedActions.includes('simulate')) && !rclSource) missingFields.push('rclSource');
  if (researchContract) {
    const items = Array.isArray(analysis?.items) ? analysis.items : [];
    const targetCount = Math.max(1, Number(required.targetCount ?? 1));
    if (items.length < targetCount) missingFields.push(`analysis.items>=${targetCount}`);
    items.forEach((item, index) => {
      const facts = Array.isArray(item?.knownFacts) ? item.knownFacts : [];
      if (!facts.length) missingFields.push(`analysis.items[${index}].knownFacts`);
      for (const fact of facts) {
        const refs = evidenceRefsOf(fact);
        if (!refs.length) missingEvidence.push(`analysis.items[${index}].knownFacts`);
        for (const ref of refs) if (!allowedEvidence.has(ref)) unsupportedEvidenceIds.push(ref);
      }
      if (!asNonEmpty(item?.inference)) missingFields.push(`analysis.items[${index}].inference`);
      if (!asNonEmpty(item?.falsifiableHypothesis)) missingFields.push(`analysis.items[${index}].falsifiableHypothesis`);
      if (!asNonEmpty(item?.minimalExperiment)) missingFields.push(`analysis.items[${index}].minimalExperiment`);
      if (!asNonEmpty(item?.unknowns)) missingFields.push(`analysis.items[${index}].unknowns`);
      if (!asNonEmpty(item?.priority)) missingFields.push(`analysis.items[${index}].priority`);
    });
  }

  const uniqueUnsupported = uniqueStrings(unsupportedEvidenceIds);
  const accepted = missingFields.length === 0 && missingEvidence.length === 0 && uniqueUnsupported.length === 0 && invalidHostEvidence.length === 0 && deniedActions.length === 0;
  return {
    format: 'turi.host-contribution-validation.v0.1',
    accepted,
    interventionId: session.interventionId,
    contributionHash: sha256({ analysis, structuredPlan, rclSource, hostEvidence, requestedActions }),
    supportCheck: {
      allowedEvidenceCount: allowedEvidence.size,
      updiaEvidenceIds,
      hostEvidenceIds: uniqueStrings(hostEvidenceIds),
      hostEvidenceStatus: hostEvidence.length ? 'structurally_valid_not_independently_verified' : 'not_supplied',
      invalidHostEvidence,
      unsupportedEvidenceIds: uniqueUnsupported,
      missingEvidence,
    },
    contractCheck: { type: required.type ?? 'generic', missingFields },
    permissionCheck: { authorityCeiling: session.authorityCeiling, requestedActions, deniedActions },
    negativeControls: {
      unknownEvidenceRejected: uniqueUnsupported.length > 0,
      invalidHostEvidenceRejected: invalidHostEvidence.length > 0,
      untypedResearchSectionsRejected: researchContract && missingFields.length > 0,
      formalWriteAuthorityGranted: false,
      externalEffectAuthorityGranted: false,
    },
  };
}

export function assistedExperienceCandidate(session, input = {}, resumeResult = null) {
  const outcome = input.outcome && typeof input.outcome === 'object' ? clone(input.outcome) : { status: 'unknown' };
  return {
    format: 'turi.assisted-experience-candidate.v0.1',
    candidateId: randomId('assisted-experience'),
    interventionId: session.interventionId,
    taskType: session.taskType,
    goal: session.task,
    components: {
      updiaIndependent: clone(session.completedSteps ?? []),
      hostContribution: clone(input.hostContribution ?? {}),
      compilerVerification: clone(input.compilerVerification ?? resumeResult?.rcl ?? null),
      simulationVerification: clone(input.simulationVerification ?? resumeResult?.rncs ?? null),
      userAuthorization: clone(input.userAuthorization ?? { level: 'none', granted: false }),
      outcome,
    },
    evidenceReceipts: uniqueStrings(input.evidenceReceipts),
    formalMemoryCommitted: false,
    authorityLevel: 'L3-candidate',
    createdAt: nowIso(),
  };
}
