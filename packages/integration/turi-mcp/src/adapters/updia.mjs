import fs from 'node:fs';
import path from 'node:path';
import { spawn as defaultSpawn } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';

function bridgeError(code, message, details = null) {
  const error = new Error(message);
  error.code = code;
  error.classification = 'provider';
  error.details = details;
  return error;
}

const withoutUndefined = (value) => Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

export class UpdiaAdapter {
  constructor({ config, spawn = defaultSpawn, fetchImpl = globalThis.fetch, invokeBridge = null } = {}) {
    this.config = config;
    this.spawn = spawn;
    this.fetchImpl = fetchImpl;
    this.invokeBridge = invokeBridge;
  }

  configurationStatus() {
    if (this.config.updiaBridgeUrl) {
      return { configured: true, mode: 'remote', bridgeUrl: this.config.updiaBridgeUrl, reasons: [] };
    }
    const reasons = [];
    const entry = this.config.updiaEntry ? path.resolve(this.config.updiaEntry) : null;
    const stateDir = this.config.updiaStateDir ? path.resolve(this.config.updiaStateDir) : null;
    if (!entry) reasons.push('TURI_UPDIA_ENTRY is missing.');
    else if (!fs.existsSync(entry)) reasons.push(`UPDIA entry does not exist: ${entry}`);
    else if (!entry.endsWith('.mjs')) reasons.push('UPDIA entry must be an .mjs file.');
    if (!stateDir) reasons.push('TURI_UPDIA_STATE_DIR is missing.');
    const checkpointPaths = [];
    if (this.config.updiaCheckpoint) checkpointPaths.push(path.resolve(this.config.updiaCheckpoint));
    if (stateDir) checkpointPaths.push(path.join(stateDir, 'checkpoint.json'));
    const validCheckpoint = checkpointPaths.some((checkpointPath) => {
      if (!fs.existsSync(checkpointPath)) return false;
      try {
        const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
        return Boolean(
          checkpoint &&
          typeof checkpoint === 'object' &&
          String(checkpoint.format ?? '').startsWith('updia.subject-checkpoint.') &&
          typeof checkpoint.identityRoot === 'string' &&
          typeof checkpoint.lineageId === 'string',
        );
      } catch {
        return false;
      }
    });
    if (!validCheckpoint) reasons.push('A valid bootstrap checkpoint (explicit or persisted) is missing.');
    return {
      configured: reasons.length === 0,
      mode: 'local-process',
      entry,
      stateDir,
      checkpoint: checkpointPaths.find((checkpointPath) => fs.existsSync(checkpointPath)) ?? null,
      reasons,
    };
  }

  configured() {
    return this.configurationStatus().configured;
  }

  async call(method, params = {}, { timeoutMs = 300_000 } = {}) {
    if (this.invokeBridge) return this.invokeBridge(method, params);
    if (this.config.updiaBridgeUrl) return this.callRemote(method, params, { timeoutMs });
    const configuration = this.configurationStatus();
    if (!configuration.configured) {
      throw bridgeError(
        'UPDIA_NOT_CONFIGURED',
        'TURI_UPDIA_ENTRY, TURI_UPDIA_STATE_DIR, and a valid bootstrap checkpoint (explicit or persisted) are required to call the real UPDIA bridge.',
        configuration,
      );
    }
    const entry = path.resolve(this.config.updiaEntry);
    const args = [entry, '--state-dir', path.resolve(this.config.updiaStateDir)];
    if (this.config.updiaCheckpoint) args.push('--checkpoint', path.resolve(this.config.updiaCheckpoint));
    if (this.config.updiaKnowledgeStorePath) args.push('--knowledge-store', path.resolve(this.config.updiaKnowledgeStorePath));
    for (const endpoint of this.config.updiaEndpoints ?? []) args.push('--endpoint', endpoint);
    return new Promise((resolve, reject) => {
      const child = this.spawn(process.execPath, args, { cwd: this.config.updiaRoot ?? path.dirname(entry), stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
      const decoder = new StringDecoder('utf8');
      let stdout = '';
      let stderr = '';
      let settled = false;
      const requestId = `turi-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      let timer = null;
      const finish = (fn, value) => { if (settled) return; settled = true; clearTimeout(timer); fn(value); };
      const handleLine = (line) => {
        if (!line.trim()) return;
        let payload;
        try { payload = JSON.parse(line); } catch { return; }
        if (payload.id !== requestId || payload.event) return;
        if (!payload.ok) finish(reject, bridgeError(payload.error?.code ?? 'UPDIA_BRIDGE_ERROR', payload.error?.message ?? 'UPDIA bridge request failed.', payload.error?.details));
        else finish(resolve, payload.result);
      };
      child.stdout.on('data', (chunk) => {
        stdout += decoder.write(chunk);
        const lines = stdout.split(/\r?\n/);
        stdout = lines.pop() ?? '';
        for (const line of lines) handleLine(line);
      });
      child.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk.toString('utf8')}`.slice(-4_000); });
      child.on('error', (error) => finish(reject, bridgeError('UPDIA_SPAWN_FAILED', error.message)));
      child.on('close', (code) => {
        if (!settled) finish(reject, bridgeError('UPDIA_BRIDGE_EXITED', `UPDIA bridge exited before responding (code ${code}).`, { stderr, stdout: stdout.slice(0, 1_000) }));
      });
      timer = setTimeout(() => { child.kill(); finish(reject, bridgeError('UPDIA_TIMEOUT', `UPDIA bridge exceeded ${timeoutMs}ms.`)); }, timeoutMs);
      child.stdin.end(`${JSON.stringify({ id: requestId, method, params: withoutUndefined(params) })}\n`);
    });
  }

  async callRemote(method, params = {}, { timeoutMs = 300_000 } = {}) {
    if (typeof this.fetchImpl !== 'function') throw bridgeError('UPDIA_REMOTE_FETCH_UNAVAILABLE', 'TURI UPDIA remote bridge requires a fetch implementation.');
    const requestId = `turi-remote-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const url = `${String(this.config.updiaBridgeUrl).replace(/\/+$/, '')}/invoke`;
    const startedAt = Date.now();
    try {
      const { response, payload } = await this.remoteJson(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          ...(method === 'generate' && this.config.updiaBridgeAsync !== false ? { prefer: 'respond-async' } : {}),
          ...(this.config.updiaBridgeToken ? { authorization: `Bearer ${this.config.updiaBridgeToken}` } : {}),
        },
        body: JSON.stringify({ id: requestId, method, params: withoutUndefined(params) }),
      }, timeoutMs);
      if (!response.ok) throw bridgeError('UPDIA_REMOTE_HTTP_ERROR', `UPDIA remote bridge returned HTTP ${response.status}.`, { status: response.status, payload });
      if (!payload || payload.id !== requestId || typeof payload.ok !== 'boolean') throw bridgeError('UPDIA_REMOTE_PROTOCOL_ERROR', 'UPDIA remote bridge returned an invalid bridge envelope.', { payload });
      if (!payload.ok) throw bridgeError(payload.error?.code ?? 'UPDIA_REMOTE_BRIDGE_ERROR', payload.error?.message ?? 'UPDIA remote bridge request failed.', payload.error?.details);
      if (payload.result?.format === 'updia.http-bridge-async-job.v0.1') {
        return this.pollRemoteJob(payload.result, { requestId, timeoutMs, startedAt });
      }
      return payload.result;
    } catch (error) {
      if (error?.name === 'AbortError') throw bridgeError('UPDIA_TIMEOUT', `UPDIA remote bridge exceeded ${timeoutMs}ms.`);
      if (error?.code?.startsWith('UPDIA_')) throw error;
      throw bridgeError('UPDIA_REMOTE_UNREACHABLE', String(error?.message ?? error));
    }
  }

  async startRemoteJob(method, params = {}, { timeoutMs = 30_000 } = {}) {
    if (!this.config.updiaBridgeUrl) {
      throw bridgeError('UPDIA_REMOTE_ASYNC_REQUIRED', 'Externally pollable UPDIA jobs require TURI_UPDIA_BRIDGE_URL.');
    }
    if (typeof this.fetchImpl !== 'function') {
      throw bridgeError('UPDIA_REMOTE_FETCH_UNAVAILABLE', 'TURI UPDIA remote bridge requires a fetch implementation.');
    }
    const requestId = `turi-remote-job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const url = `${String(this.config.updiaBridgeUrl).replace(/\/+$/, '')}/invoke`;
    const { response, payload } = await this.remoteJson(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        prefer: 'respond-async',
        ...(this.config.updiaBridgeToken ? { authorization: `Bearer ${this.config.updiaBridgeToken}` } : {}),
      },
      body: JSON.stringify({ id: requestId, method, params: withoutUndefined(params) }),
    }, timeoutMs);
    if (!response.ok) {
      throw bridgeError('UPDIA_REMOTE_HTTP_ERROR', `UPDIA remote bridge returned HTTP ${response.status}.`, { status: response.status, payload });
    }
    if (!payload || payload.id !== requestId || payload.ok !== true) {
      throw bridgeError(payload?.error?.code ?? 'UPDIA_REMOTE_PROTOCOL_ERROR', payload?.error?.message ?? 'UPDIA remote bridge returned an invalid async job envelope.', payload?.error?.details ?? { payload });
    }
    if (payload.result?.format !== 'updia.http-bridge-async-job.v0.1' || !payload.result.jobId || !payload.result.pollPath) {
      throw bridgeError('UPDIA_REMOTE_ASYNC_UNSUPPORTED', 'UPDIA remote bridge did not return an externally pollable async job.', { payload });
    }
    return payload.result;
  }

  async remoteJobStatus(jobId, { timeoutMs = 30_000 } = {}) {
    if (!this.config.updiaBridgeUrl) {
      throw bridgeError('UPDIA_REMOTE_ASYNC_REQUIRED', 'Externally pollable UPDIA jobs require TURI_UPDIA_BRIDGE_URL.');
    }
    if (!jobId || typeof jobId !== 'string') throw bridgeError('UPDIA_JOB_ID_REQUIRED', 'UPDIA async job id is required.');
    const baseUrl = `${String(this.config.updiaBridgeUrl).replace(/\/+$/, '')}/`;
    const url = new URL(`/jobs/${encodeURIComponent(jobId)}`, baseUrl).toString();
    const { response, payload } = await this.remoteJson(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        ...(this.config.updiaBridgeToken ? { authorization: `Bearer ${this.config.updiaBridgeToken}` } : {}),
      },
    }, timeoutMs);
    if (!response.ok) {
      throw bridgeError('UPDIA_REMOTE_HTTP_ERROR', `UPDIA async job status returned HTTP ${response.status}.`, { status: response.status, payload, jobId });
    }
    if (!payload || payload.jobId !== jobId || typeof payload.status !== 'string') {
      throw bridgeError('UPDIA_REMOTE_PROTOCOL_ERROR', 'UPDIA async job status returned an invalid envelope.', { payload, jobId });
    }
    const envelope = payload.response;
    return {
      format: 'updia.remote-research-job-status.v0.1',
      jobId: payload.jobId,
      requestId: payload.requestId ?? null,
      status: payload.status,
      createdAt: payload.createdAt ?? null,
      updatedAt: payload.updatedAt ?? null,
      result: envelope?.ok === true ? envelope.result : null,
      error: envelope?.ok === false ? envelope.error : null,
    };
  }

  async remoteJson(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
    try {
      const response = await this.fetchImpl(url, { ...options, signal: controller.signal });
      const raw = await response.text();
      let payload;
      try { payload = JSON.parse(raw); }
      catch { throw bridgeError('UPDIA_REMOTE_PROTOCOL_ERROR', 'UPDIA remote bridge returned invalid JSON.', { status: response.status, body: raw.slice(0, 500) }); }
      return { response, payload, raw };
    } finally {
      clearTimeout(timer);
    }
  }

  async pollRemoteJob(job, { requestId, timeoutMs, startedAt }) {
    if (!job.pollPath || !job.jobId) {
      throw bridgeError('UPDIA_REMOTE_PROTOCOL_ERROR', 'UPDIA async bridge job is missing its poll path or id.', { job });
    }
    const pollUrl = new URL(job.pollPath, `${String(this.config.updiaBridgeUrl).replace(/\/+$/, '')}/`).toString();
    const pollMs = Math.max(100, Number(this.config.updiaBridgePollMs ?? job.pollAfterMs ?? 1_000));
    while (Date.now() - startedAt < timeoutMs) {
      const remainingBeforeDelay = timeoutMs - (Date.now() - startedAt);
      await new Promise((resolve) => setTimeout(resolve, Math.min(pollMs, Math.max(1, remainingBeforeDelay))));
      const remaining = timeoutMs - (Date.now() - startedAt);
      if (remaining <= 0) break;
      const { response, payload } = await this.remoteJson(pollUrl, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          ...(this.config.updiaBridgeToken ? { authorization: `Bearer ${this.config.updiaBridgeToken}` } : {}),
        },
      }, remaining);
      if (!response.ok) {
        throw bridgeError('UPDIA_REMOTE_HTTP_ERROR', `UPDIA async job poll returned HTTP ${response.status}.`, { status: response.status, payload, jobId: job.jobId });
      }
      if (!payload || payload.jobId !== job.jobId || typeof payload.status !== 'string') {
        throw bridgeError('UPDIA_REMOTE_PROTOCOL_ERROR', 'UPDIA async job poll returned an invalid status envelope.', { payload, jobId: job.jobId });
      }
      if (['queued', 'running'].includes(payload.status)) continue;
      const envelope = payload.response;
      if (!envelope || envelope.id !== requestId || typeof envelope.ok !== 'boolean') {
        throw bridgeError('UPDIA_REMOTE_PROTOCOL_ERROR', 'UPDIA async job completed without a valid bridge response.', { payload, jobId: job.jobId });
      }
      if (!envelope.ok) {
        throw bridgeError(envelope.error?.code ?? 'UPDIA_REMOTE_BRIDGE_ERROR', envelope.error?.message ?? 'UPDIA async bridge job failed.', envelope.error?.details);
      }
      return envelope.result;
    }
    throw bridgeError('UPDIA_TIMEOUT', `UPDIA remote bridge exceeded ${timeoutMs}ms.`, { jobId: job.jobId });
  }

  async health() {
    const health = await this.call('health', {});
    if (health?.knowledge) return health;
    try {
      const status = await this.call('status', {});
      return { ...health, knowledge: status?.knowledge ?? { enabled: false } };
    } catch (error) {
      return { ...health, knowledge: { enabled: false, error: { code: error.code ?? error.name, message: error.message } } };
    }
  }
  status() { return this.call('status', {}); }
  async models(input = {}) { return this.call('models', input); }
  async listOrgans(input = {}) { return this.models(input); }
  async describeOrgan(organId) { return (await this.models({ includeMissing: true })).models?.find((item) => item.organId === organId || item.id === organId || item.model === organId) ?? null; }
  subjectStatus() { return this.status(); }
  subjectLoad() { return this.status(); }
  subjectCheckpoint() { return this.status(); }
  subjectRestore() { return this.status(); }
  subjectClose() { return this.call('shutdown', {}); }
  sparseSchedulerStatus() { return this.status(); }

  thinkParams({ goal, contextRefs = [], budget = null, allowedOrgans = [], evidencePolicy = {}, outputContract = {} } = {}) {
    const contract = JSON.stringify({ contextRefs, evidencePolicy, outputContract });
    const maxTokens = budget ?? this.config.updiaDefaultMaxTokens ?? 512;
    const model = allowedOrgans[0] ? undefined : this.config.updiaDefaultModel ?? undefined;
    const text = `${goal}\n\nTURI output contract:\n${contract}\n\nReturn a concise, complete answer within ${maxTokens} tokens. Preserve evidence ids and mark inference, hypothesis, and unknown separately.`;
    return withoutUndefined({ text, organId: allowedOrgans[0], model, maxTokens, grounding: true, stream: false });
  }

  async think(input = {}) { return this.call('generate', this.thinkParams(input)); }

  async researchStart({ question, retrievalBudget = 12, budget = null, allowedOrgans = [] } = {}) {
    const sourceEvidence = await this.memorySearch({ query: question, retrievalBudget });
    const reasoningJob = await this.startRemoteJob('generate', this.thinkParams({
      goal: question,
      budget,
      allowedOrgans,
      outputContract: {
        type: 'research',
        fields: ['known_facts', 'source_evidence', 'current_bottlenecks', 'testable_hypotheses', 'minimum_viable_experiments', 'unknowns'],
      },
    }));
    return {
      format: 'updia.public-research-job.v0.1',
      question,
      status: reasoningJob.status,
      jobId: reasoningJob.jobId,
      pollAfterMs: reasoningJob.pollAfterMs,
      sourceEvidence,
      knownFacts: (sourceEvidence?.packet?.claims ?? []).map((claim) => ({
        claimId: claim.claimId,
        statement: claim.statement,
        claimType: claim.claimType,
        sourceRefs: claim.sourceRefs ?? [],
        confidence: claim.confidence ?? null,
      })),
    };
  }

  async researchStatus({ jobId } = {}) { return this.remoteJobStatus(jobId); }

  async plan(input) { return this.think({ ...input, outputContract: input.outputContract ?? { type: 'bounded-plan', fields: ['goal', 'assumptions', 'steps', 'evidence'] } }); }
  async organInvoke({ organId, text, ...rest }) { return this.call('generate', { text, organId, grounding: rest.grounding ?? true, stream: false }); }
  async memorySearch({ query, retrievalBudget = 20, profile = 'research', callerContext = {} }) { return this.call('knowledge_query', { query, retrievalBudget, profile, callerContext }); }
  async memoryRead({ packetId }) { return this.call('knowledge_explain', { packetId }); }
  async memoryWriteCandidate({ statement, claimType, sourceRefs, packetId } = {}) { return this.call('knowledge_writeback', withoutUndefined({ operation: 'propose', statement, claimType, sourceRefs, packetId })); }
  async memoryCommit({ writebackId, actor = 'turi-authorized' }) { return this.call('knowledge_writeback', { operation: 'commit', writebackId, actor }); }
  async actionPropose({ turnId, tool, arguments: actionArguments, agentMode, approval } = {}) { return this.call('adjudicate_action', withoutUndefined({ turnId, tool, arguments: actionArguments, agentMode, approval })); }
  async actionResultIngest({ permitId, ok, resultRoot, errorCode, metadata } = {}) { return this.call('record_execution', withoutUndefined({ permitId, ok, resultRoot, errorCode, metadata })); }
  async learnFromResult({ turnId, organId, success, rating, learning } = {}) { return this.call('feedback', withoutUndefined({ turnId, organId, success, rating, learning })); }
  async writebacks(input) { return this.call('writebacks', input); }
}
