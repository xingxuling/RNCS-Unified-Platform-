import fs from 'node:fs';
import path from 'node:path';
import { clone } from '../canonical.mjs';

function unavailable(code, message, details = null) {
  const error = new Error(message);
  error.code = code;
  error.classification = 'capability';
  error.details = details;
  return error;
}

const withoutUndefined = (value) => Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

export class RncsAdapter {
  constructor({ gateway, dataDir, config }) {
    this.gateway = gateway;
    this.dataDir = dataDir;
    this.config = config;
  }

  async discover() { return this.gateway.registry ?? this.gateway.discover(); }

  async invoke(runtimeId, action, payload = {}, options = {}) {
    return this.gateway.invoke(runtimeId, action, payload, options);
  }

  async status() { return this.worldStatus(); }
  async health() { return this.gateway.health(); }
  async runtimes() { return (await this.discover()).runtimes; }
  async runtimeHealth(runtimeId) { return runtimeId ? this.invoke(runtimeId, 'health', {}) : this.health(); }
  async worldStatus() { return this.invoke('rncs.aetherworld-native', 'worldStatus', {}); }
  async compilePlan({ source, language = 'NATURAL_LANGUAGE', subject_id: subjectId } = {}) { return this.invoke('rncs.aetherworld-native', 'compile', withoutUndefined({ source, language, subjectId })); }
  async validatePlan({ plan } = {}) { return this.invoke('rncs.aetherworld-native', 'validatePlan', { plan }); }
  async createCandidate({ plan } = {}, options = {}) { return this.invoke('rncs.aetherworld-native', 'createCandidate', { plan }, options); }
  async getCandidate({ candidate_id: candidateId } = {}) { return this.invoke('rncs.aetherworld-native', 'getCandidate', { candidateId }); }
  async diffCandidate({ candidate_id: candidateId } = {}) { return this.invoke('rncs.aetherworld-native', 'diffCandidate', { candidateId }); }
  async simulateCandidate({ candidate_id: candidateId } = {}, options = {}) { return this.invoke('rncs.aetherworld-native', 'simulateCandidate', { candidateId }, options); }
  async authorizeCandidate({ candidate_id: candidateId, approval_roles: approvalRoles } = {}) { return this.invoke('rncs.aetherworld-native', 'authorizeCandidate', withoutUndefined({ candidateId, approvalRoles })); }
  async rejectCandidate({ candidate_id: candidateId, reason = 'rejected-by-turi' } = {}) { return this.invoke('rncs.aetherworld-native', 'rejectCandidate', { candidateId, reason }); }
  async mergeCandidate({ candidate_id: candidateId } = {}, options = {}) { return this.invoke('rncs.aetherworld-native', 'mergeCandidate', { candidateId }, options); }
  async history() { return this.invoke('rncs.aetherworld-native', 'history', {}); }
  async replayGeneration({ generation_id: generationId, subject_id: subjectId, approval_roles: approvalRoles } = {}) { return this.invoke('rncs.aetherworld-native', 'replayGeneration', withoutUndefined({ generationId, subjectId, approvalRoles })); }
  async rollbackGeneration({ generation_id: generationId, subject_id: subjectId, approval_roles: approvalRoles } = {}) { return this.invoke('rncs.aetherworld-native', 'rollbackGeneration', withoutUndefined({ generationId, subjectId, approvalRoles })); }
  async registerBehavior({ candidate_id: candidateId } = {}) { return this.invoke('rncs.aetherworld-native', 'registerBehavior', { candidateId }); }
  async updateBehavior({ behavior_id: behaviorId, program } = {}) { return this.invoke('rncs.aetherworld-native', 'updateBehavior', { behaviorId, program }); }
  async enableBehavior({ behavior_id: behaviorId, enabled } = {}) { return this.invoke('rncs.aetherworld-native', 'setBehaviorEnabled', { behaviorId, enabled }); }
  async materializeRsr({ generation_id: generationId = null } = {}) { return this.invoke('rncs.aetherworld-native', 'materializeRSR', { generationId }); }
  async runLoopback({ ticks = 28, session_id: sessionId } = {}) { return this.invoke('rncs.aetherworld-native', 'runLoopback', withoutUndefined({ ticks, sessionId })); }
  async rclCompileExecute(input) { return this.invoke('rncs.rcl-control', 'compileExecute', input); }
  async rclCompileAuthorityPlan(input) { return this.invoke('rncs.rcl-control', 'compileAuthorityPlan', input); }

  async runtimeAction({ runtime_id: runtimeId, action, payload = {} } = {}, options = {}) {
    const manifest = (await this.discover()).runtimes.find((item) => item.runtime_id === runtimeId);
    if (!manifest) throw unavailable('RUNTIME_NOT_FOUND', `Unknown RNCS runtime: ${runtimeId}`);
    if (!manifest.actions.includes(action)) throw unavailable('RUNTIME_ACTION_NOT_DECLARED', `${runtimeId} does not declare ${action}.`);
    return this.invoke(runtimeId, action, payload, options);
  }

  async invocationReceipts(limit = 20) {
    const file = path.join(this.dataDir, 'journal', 'invocations.ndjson');
    if (!fs.existsSync(file)) return [];
    return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).slice(-Math.min(Math.max(Number(limit) || 20, 1), 100)).map((line) => JSON.parse(line));
  }

  async developer(action, payload = {}, options = {}) {
    return this.invoke('rncs.developer-execution', action, payload, { timeoutMs: options.timeoutMs ?? 30 * 60_000, ...options });
  }

  async developerStatus() { return this.developer('status'); }
  async developerEngineeringWorkflow(input) { return this.developer('engineeringWorkflow', input, { timeoutMs: 30 * 60_000 }); }
  async applyPatch(input) { return this.developer('applyPatch', input); }
  async runBuild(input) { return this.developer('runBuild', input, { timeoutMs: input.timeout_ms ?? 30 * 60_000 }); }
  async gitStatus(input) { return this.developer('gitStatus', input); }
  async gitCommit(input) { return this.developer('gitCommit', input); }
  async rsrSimulate(input) { return this.developer('rsrSimulate', input, { timeoutMs: input.timeout_ms ?? 30 * 60_000 }); }
  async vsrRender(input) { return this.developer('vsrRender', input, { timeoutMs: input.timeout_ms ?? 30 * 60_000 }); }

  async unsupported(capabilityId) {
    throw unavailable('CAPABILITY_NOT_IMPLEMENTED', `${capabilityId} has no native or verified adapter in TURI v0.1.`, { capabilityId, implementation: 'evidence_only' });
  }

  static roots(status) {
    return { stateRoot: status?.state_root ?? status?.stateRoot, revision: status?.revision, generation: status?.generation ?? status?.generation_id };
  }

  static clone(value) { return clone(value); }
}
