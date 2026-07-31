import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GrowthStore } from '../src/growth/store.mjs';
import {
  createHostResumeToken,
  readHostResumeToken,
  validateHostContribution,
} from '../src/host/intervention.mjs';
import { TuriOrchestrator } from '../src/workflows/orchestrator.mjs';

const SECRET = 'turi-host-intervention-test-secret-0123456789';
const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'turi-host-test-'));

function evidencePacket() {
  return {
    root: 'root:bci',
    packet: {
      packetId: 'packet:bci',
      claims: [{
        claimId: 'claim:bci:1',
        statement: 'Decoder drift remains unresolved.',
        claimType: 'fact',
        sourceRefs: ['source:bci:1'],
        confidence: 0.9,
      }],
      supportingEvidence: [{
        sourceId: 'source:bci:1',
        title: 'BCI drift evidence',
        uriOrPath: 'https://example.test/bci-drift',
        content: 'Longitudinal decoder drift is reported.',
        evidenceRole: 'domain_evidence',
      }],
    },
    trace: { traceId: 'trace:bci' },
  };
}

function researchAnalysis(count = 2, evidenceId = 'claim:bci:1') {
  return {
    items: Array.from({ length: count }, (_, index) => ({
      title: `Problem ${index + 1}`,
      knownFacts: [{ statement: 'Decoder drift remains unresolved.', evidenceIds: [evidenceId] }],
      inference: `Inference ${index + 1}`,
      falsifiableHypothesis: `Hypothesis ${index + 1} can be falsified by a preregistered comparison.`,
      minimalExperiment: `Run experiment ${index + 1} with an intervention, control, metric, and failure threshold.`,
      unknowns: ['Cross-subject generalization remains unknown.'],
      priority: index === 0 ? 'P1' : 'P2',
    })),
  };
}

test('host resume tokens are signed, expire, and cannot be altered', () => {
  const issued = createHostResumeToken({
    task: 'research BCI',
    taskType: 'research',
    evidence: { claimIds: ['claim:bci:1'], sourceIds: ['source:bci:1'] },
  }, { now: 1_000, ttlMs: 60_000, secret: SECRET });
  assert.equal(readHostResumeToken(issued.token, { now: 2_000, secret: SECRET }).task, 'research BCI');

  const [encoded, signature] = issued.token.split('.');
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  payload.task = 'altered task';
  const altered = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${signature}`;
  assert.throws(() => readHostResumeToken(altered, { now: 2_000, secret: SECRET }), (error) => error.code === 'RESUME_TOKEN_INTEGRITY_FAILED');
  assert.throws(() => readHostResumeToken(issued.token, { now: 61_001, secret: SECRET }), (error) => error.code === 'RESUME_TOKEN_EXPIRED');
});

test('research defaults to host reasoning and never invokes local generation', async () => {
  const calls = { memorySearch: 0, think: 0, researchStart: 0 };
  const orchestrator = new TuriOrchestrator({
    config: { reasoningMode: 'host', hostResumeSecret: SECRET, hostResumeTtlMs: 120_000 },
    artifacts: null,
    adapters: {
      updia: {
        configured: () => true,
        subjectStatus: async () => ({ subjectId: 'subject:test', identityRoot: 'identity:test', lineageId: 'lineage:test' }),
        memorySearch: async () => { calls.memorySearch += 1; return evidencePacket(); },
        think: async () => { calls.think += 1; return {}; },
        researchStart: async () => { calls.researchStart += 1; return {}; },
      },
    },
  });

  const result = await orchestrator.researchTask({ question: '列出 2 个 AI 与脑机接口未解决问题', targetCount: 2 });
  assert.equal(result.status, 'REQUIRES_HOST_REASONING');
  assert.equal(result.executionMode, 'host');
  assert.equal(result.researchContract.targetCount, 2);
  assert.equal(result.evidencePacket.knownFacts.length, 1);
  assert.equal(result.resumeTokenSecurity.integrity, 'hmac-sha256');
  assert.equal(calls.memorySearch, 1);
  assert.equal(calls.think, 0);
  assert.equal(calls.researchStart, 0);
  assert.equal(readHostResumeToken(result.resumeToken, { secret: SECRET }).taskType, 'research');
});

test('host contribution validation enforces evidence, output completeness, and L2 source requirements', () => {
  const issued = createHostResumeToken({
    task: 'research BCI',
    taskType: 'research',
    requiredOutput: { type: 'evidence-aligned-research-brief', targetCount: 2 },
    evidence: { claimIds: ['claim:bci:1'], sourceIds: ['source:bci:1'] },
  }, { secret: SECRET });
  const session = readHostResumeToken(issued.token, { secret: SECRET });

  const valid = validateHostContribution(session, { analysis: researchAnalysis(2), requestedActions: ['accept_analysis'] });
  assert.equal(valid.accepted, true);
  const unsupported = validateHostContribution(session, { analysis: researchAnalysis(2, 'claim:invented'), requestedActions: ['accept_analysis'] });
  assert.equal(unsupported.accepted, false);
  assert.deepEqual(unsupported.supportCheck.unsupportedEvidenceIds, ['claim:invented']);
  const missingSource = validateHostContribution(session, { analysis: researchAnalysis(2), requestedActions: ['compile'] });
  assert.equal(missingSource.accepted, false);
  assert.ok(missingSource.contractCheck.missingFields.includes('rclSource'));

  const hostGrounded = validateHostContribution(session, {
    analysis: researchAnalysis(2, 'host-source:bci-review'),
    hostEvidence: [{ evidenceId: 'host-source:bci-review', uri: 'https://example.test/review', title: 'Host-retrieved review', statement: 'A review reports decoder drift.' }],
    requestedActions: ['accept_analysis'],
  });
  assert.equal(hostGrounded.accepted, true);
  assert.equal(hostGrounded.supportCheck.hostEvidenceStatus, 'structurally_valid_not_independently_verified');
  const malformedHostEvidence = validateHostContribution(session, {
    analysis: researchAnalysis(2, 'host-source:bad'),
    hostEvidence: [{ evidenceId: 'host-source:bad', uri: 'file:///secret', title: 'Bad source', statement: 'Not allowed.' }],
    requestedActions: ['accept_analysis'],
  });
  assert.equal(malformedHostEvidence.accepted, false);
  assert.equal(malformedHostEvidence.negativeControls.invalidHostEvidenceRejected, true);
});

test('accepted host contribution can be resumed and recorded as a separated L3 experience candidate', async () => {
  const dataDir = tempDir();
  try {
    const growthStore = new GrowthStore(dataDir);
    const orchestrator = new TuriOrchestrator({
      config: { reasoningMode: 'host', hostResumeSecret: SECRET, hostResumeTtlMs: 120_000, dataDir },
      artifacts: null,
      growthStore,
      adapters: {
        updia: {
          configured: () => true,
          subjectStatus: async () => ({ subjectId: 'subject:test' }),
          memorySearch: async () => evidencePacket(),
        },
      },
    });
    const request = await orchestrator.researchTask({ question: '列出 2 个 BCI 问题', targetCount: 2 });
    const resumed = await orchestrator.resumeWithHostContribution({
      resumeToken: request.resumeToken,
      analysis: researchAnalysis(2),
      requestedActions: ['accept_analysis'],
    });
    assert.equal(resumed.status, 'HOST_CONTRIBUTION_ACCEPTED');
    assert.equal(resumed.authorityBoundary.level, 'L2');
    assert.equal(resumed.authorityBoundary.formalStateChanged, false);

    const recorded = await orchestrator.recordAssistedExperience({
      resumeToken: request.resumeToken,
      hostContribution: resumed.hostContribution,
      outcome: { status: 'accepted', residuals: ['formal UPDIA memory not committed'] },
      evidenceReceipts: ['receipt:host-request', 'receipt:host-resume'],
    });
    assert.equal(recorded.status, 'EXPERIENCE_CANDIDATE_RECORDED');
    assert.equal(recorded.storage.formalUpdiaMemoryCommitted, false);
    assert.equal(recorded.experience.assistance.hostContribution.contributionHash, resumed.hostContribution.contributionHash);
    assert.equal(recorded.experience.verification, 'receipt-backed');
    const replay = await orchestrator.recordAssistedExperience({
      resumeToken: request.resumeToken,
      hostContribution: resumed.hostContribution,
      outcome: { status: 'accepted' },
      evidenceReceipts: ['receipt:host-request', 'receipt:host-resume'],
    });
    assert.equal(replay.status, 'EXPERIENCE_CANDIDATE_ALREADY_RECORDED');
    assert.equal(growthStore.state.experiences.length, 1);
  } finally {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
