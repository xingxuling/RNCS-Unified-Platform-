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
  constructor({ config, spawn = defaultSpawn, invokeBridge = null } = {}) {
    this.config = config;
    this.spawn = spawn;
    this.invokeBridge = invokeBridge;
  }

  configured() {
    if (!this.config.updiaEntry || !this.config.updiaStateDir) return false;
    const explicitCheckpoint = this.config.updiaCheckpoint && fs.existsSync(path.resolve(this.config.updiaCheckpoint));
    const persistedCheckpoint = fs.existsSync(path.join(path.resolve(this.config.updiaStateDir), 'checkpoint.json'));
    return Boolean(explicitCheckpoint || persistedCheckpoint);
  }

  async call(method, params = {}, { timeoutMs = 300_000 } = {}) {
    if (this.invokeBridge) return this.invokeBridge(method, params);
    if (!this.configured()) throw bridgeError('UPDIA_NOT_CONFIGURED', 'TURI_UPDIA_ENTRY, TURI_UPDIA_STATE_DIR, and a bootstrap checkpoint (explicit or persisted) are required to call the real UPDIA bridge.');
    const entry = path.resolve(this.config.updiaEntry);
    if (!fs.existsSync(entry)) throw bridgeError('UPDIA_ENTRY_NOT_FOUND', `UPDIA bridge entry does not exist: ${entry}`);
    if (!entry.endsWith('.mjs')) throw bridgeError('UPDIA_ENTRY_INVALID', 'UPDIA bridge entry must be an .mjs file.');
    const args = [entry, '--state-dir', path.resolve(this.config.updiaStateDir)];
    if (this.config.updiaCheckpoint) args.push('--checkpoint', path.resolve(this.config.updiaCheckpoint));
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

  health() { return this.call('health', {}); }
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

  async think({ goal, contextRefs = [], budget = null, allowedOrgans = [], evidencePolicy = {}, outputContract = {} } = {}) {
    const contract = JSON.stringify({ contextRefs, evidencePolicy, outputContract });
    return this.call('generate', withoutUndefined({ text: `${goal}\n\nTURI output contract:\n${contract}`, organId: allowedOrgans[0], maxTokens: budget ?? undefined, grounding: true, stream: false }));
  }

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
