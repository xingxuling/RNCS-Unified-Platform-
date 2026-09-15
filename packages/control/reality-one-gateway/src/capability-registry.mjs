import fs from 'node:fs';
import path from 'node:path';
import { clone, hash, seal, GatewayError } from './canonical.mjs';

const READINESS = new Set(['ready', 'experimental', 'partial', 'unavailable', 'blocked']);
const EFFECTS = new Set(['READ_ONLY', 'SIMULATION', 'PROVISIONAL', 'AUTHORIZED', 'AUTHORITATIVE', 'PROJECTION', 'NETWORK_STATE']);
const VERBS = new Set(['inspect', 'discover', 'validate', 'simulate', 'compare', 'propose', 'authorize', 'execute', 'commit', 'project', 'replay', 'reconcile', 'rollback']);
const AUTHORITY_MODES = new Set(['none', 'scope', 'explicit-approval', 'commit-gate']);

const text = value => String(value ?? '').trim();
const list = value => [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))];
const lower = value => text(value).toLowerCase();
const tokens = value => lower(value).split(/[^\p{L}\p{N}._:-]+/u).filter(Boolean);

function normalizeCapability(raw) {
  const readiness = clone(raw.readiness ?? {});
  const authority = clone(raw.authority ?? {});
  const evidence = clone(raw.evidence ?? {});
  const reversibility = clone(raw.reversibility ?? {});
  const capability = {
    format: 'rncs.agent-capability.v0.1',
    capability_id: text(raw.capability_id),
    runtime_id: text(raw.runtime_id),
    runtime_version: text(raw.runtime_version),
    action: text(raw.action),
    title: text(raw.title),
    semantic_role: text(raw.semantic_role),
    standard_verb: text(raw.standard_verb),
    effect_class: text(raw.effect_class),
    readiness: {
      status: text(readiness.status),
      ...(readiness.reason ? { reason: text(readiness.reason) } : {}),
    },
    authority: {
      mode: text(authority.mode),
      required_scopes: list(authority.required_scopes),
      approval_roles: list(authority.approval_roles),
      ...(authority.policy_runtime ? { policy_runtime: text(authority.policy_runtime) } : {}),
      ...(authority.decision_action ? { decision_action: text(authority.decision_action) } : {}),
    },
    evidence: {
      gateway_receipt: evidence.gateway_receipt === true,
      domain_receipts: list(evidence.domain_receipts),
      required_roots: list(evidence.required_roots),
      ...(evidence.ledger_target ? { ledger_target: text(evidence.ledger_target) } : {}),
    },
    reversibility: {
      class: text(reversibility.class),
      ...(reversibility.rollback_capability_id ? { rollback_capability_id: text(reversibility.rollback_capability_id) } : {}),
    },
    dependencies: list(raw.dependencies),
    aliases: list(raw.aliases),
    input_schema_ref: raw.input_schema_ref == null ? null : text(raw.input_schema_ref),
    output_schema_ref: raw.output_schema_ref == null ? null : text(raw.output_schema_ref),
    preconditions: list(raw.preconditions),
    postconditions: list(raw.postconditions),
    failure_modes: list(raw.failure_modes),
  };
  if (raw.format && raw.format !== capability.format) throw new GatewayError('CAPABILITY_FORMAT_UNSUPPORTED', raw.format);
  if (!capability.capability_id) throw new GatewayError('CAPABILITY_ID_REQUIRED');
  if (!capability.runtime_id) throw new GatewayError('CAPABILITY_RUNTIME_REQUIRED', capability.capability_id);
  if (!capability.action) throw new GatewayError('CAPABILITY_ACTION_REQUIRED', capability.capability_id);
  if (!VERBS.has(capability.standard_verb)) throw new GatewayError('CAPABILITY_VERB_INVALID', capability.capability_id);
  if (!EFFECTS.has(capability.effect_class)) throw new GatewayError('CAPABILITY_EFFECT_INVALID', capability.capability_id);
  if (!READINESS.has(capability.readiness.status)) throw new GatewayError('CAPABILITY_READINESS_INVALID', capability.capability_id);
  if (!AUTHORITY_MODES.has(capability.authority.mode)) throw new GatewayError('CAPABILITY_AUTHORITY_INVALID', capability.capability_id);
  if (['unavailable', 'blocked'].includes(capability.readiness.status) && !capability.readiness.reason) throw new GatewayError('CAPABILITY_READINESS_REASON_REQUIRED', capability.capability_id);
  return capability;
}

export function loadCapabilityRegistry(file, runtimeRegistry = null) {
  const registryFile = path.resolve(file);
  if (!fs.existsSync(registryFile)) throw new GatewayError('CAPABILITY_REGISTRY_NOT_FOUND', registryFile);
  const raw = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  if (raw.format && raw.format !== 'rncs.agent-capability-registry.v0.1') throw new GatewayError('CAPABILITY_REGISTRY_FORMAT_UNSUPPORTED', raw.format);
  const capabilities = (raw.capabilities ?? []).map(normalizeCapability);
  const seen = new Set();
  const runtimeMap = new Map((runtimeRegistry?.runtimes ?? []).map(runtime => [runtime.runtime_id, runtime]));
  for (const capability of capabilities) {
    if (seen.has(capability.capability_id)) throw new GatewayError('CAPABILITY_ID_DUPLICATE', capability.capability_id);
    seen.add(capability.capability_id);
    const runtime = runtimeMap.get(capability.runtime_id);
    if (runtime && !runtime.actions.includes(capability.action)) {
      throw new GatewayError('CAPABILITY_ACTION_NOT_DECLARED', `${capability.capability_id} -> ${capability.runtime_id}:${capability.action}`);
    }
  }
  return seal({
    format: 'rncs.agent-capability-registry.v0.1',
    generated_from: text(raw.generated_from || path.basename(registryFile)),
    capabilities,
    source_root: hash(raw),
  }, 'registry_root');
}

function runtimeAware(capability, runtimeRegistry) {
  const result = clone(capability);
  const runtime = (runtimeRegistry?.runtimes ?? []).find(item => item.runtime_id === capability.runtime_id);
  if (!runtime) {
    result.readiness = { status: 'unavailable', reason: `runtime ${capability.runtime_id} is not selected by the gateway` };
    return result;
  }
  result.runtime_version = runtime.runtime_version;
  return result;
}

export class AgentCapabilityRegistry {
  constructor({ file, runtimeRegistry = null } = {}) {
    if (!file) throw new GatewayError('CAPABILITY_REGISTRY_FILE_REQUIRED');
    this.file = path.resolve(file);
    this.runtimeRegistry = runtimeRegistry;
    this.registry = loadCapabilityRegistry(this.file, runtimeRegistry);
    this.byId = new Map(this.registry.capabilities.map(capability => [capability.capability_id, capability]));
  }
  setRuntimeRegistry(runtimeRegistry) { this.runtimeRegistry = runtimeRegistry; }
  list(filters = {}) {
    const query = typeof filters === 'string' ? { text: filters } : (filters ?? {});
    let capabilities = this.registry.capabilities.map(capability => runtimeAware(capability, this.runtimeRegistry));
    if (query.runtime_id) capabilities = capabilities.filter(capability => capability.runtime_id === query.runtime_id);
    if (query.standard_verb) capabilities = capabilities.filter(capability => capability.standard_verb === query.standard_verb);
    if (query.effect_class) capabilities = capabilities.filter(capability => capability.effect_class === query.effect_class);
    if (query.readiness) capabilities = capabilities.filter(capability => capability.readiness.status === query.readiness);
    if (query.text) {
      const needle = lower(query.text);
      capabilities = capabilities.filter(capability => [capability.capability_id, capability.title, capability.semantic_role, capability.runtime_id, capability.action, ...capability.aliases].some(value => lower(value).includes(needle)));
    }
    return capabilities;
  }
  describe(capabilityId) {
    const capability = this.byId.get(String(capabilityId));
    if (!capability) throw new GatewayError('CAPABILITY_NOT_FOUND', String(capabilityId));
    return runtimeAware(capability, this.runtimeRegistry);
  }
  match(query = {}) {
    const request = typeof query === 'string' ? { text: query } : (query ?? {});
    const candidates = this.list({
      runtime_id: request.runtime_id,
      standard_verb: request.standard_verb,
      effect_class: request.effect_class,
      readiness: request.readiness,
    });
    const queryTokens = tokens(request.text ?? request.goal ?? '');
    const scored = candidates.map(capability => {
      let score = 0;
      const reasons = [];
      const fields = [capability.capability_id, capability.title, capability.semantic_role, capability.runtime_id, capability.action, capability.standard_verb, capability.effect_class, ...capability.aliases];
      const haystack = lower(fields.join(' '));
      if (queryTokens.length) {
        for (const token of queryTokens) if (haystack.includes(token)) score += 5;
        const phrase = lower(request.text ?? request.goal ?? '');
        if (phrase && haystack.includes(phrase)) { score += 15; reasons.push('phrase-match'); }
      } else score += 1;
      if (request.standard_verb && capability.standard_verb === request.standard_verb) { score += 20; reasons.push('verb-match'); }
      if (request.effect_class && capability.effect_class === request.effect_class) { score += 15; reasons.push('effect-match'); }
      if (capability.readiness.status === 'ready') { score += 4; reasons.push('ready'); }
      else if (capability.readiness.status === 'experimental') score += 2;
      else if (capability.readiness.status === 'partial') score += 1;
      return { capability, score, reasons };
    }).filter(item => item.score > 0 || queryTokens.length === 0);
    scored.sort((a, b) => b.score - a.score || a.capability.capability_id.localeCompare(b.capability.capability_id));
    const limit = Math.max(1, Math.min(50, Number(request.limit ?? 10)));
    return seal({
      format: 'rncs.agent-capability-match.v0.1',
      query: clone(request),
      count: Math.min(scored.length, limit),
      matches: scored.slice(0, limit),
    }, 'match_root');
  }
}

export function preflightCapabilityInvocation(capability, invocation = {}) {
  if (invocation.format !== 'rncs.agent-capability-invocation.v0.1') throw new GatewayError('CAPABILITY_INVOCATION_FORMAT_INVALID');
  if (invocation.capability_id !== capability.capability_id) throw new GatewayError('CAPABILITY_INVOCATION_ID_MISMATCH', `${invocation.capability_id} != ${capability.capability_id}`);
  if (invocation.expected_effect && invocation.expected_effect !== capability.effect_class) throw new GatewayError('CAPABILITY_EXPECTED_EFFECT_MISMATCH', `${invocation.expected_effect} != ${capability.effect_class}`);
  const readiness = capability.readiness.status;
  if (['unavailable', 'blocked'].includes(readiness)) throw new GatewayError('CAPABILITY_NOT_READY', capability.capability_id, { readiness: capability.readiness });
  if (['experimental', 'partial'].includes(readiness) && invocation.allow_unstable !== true) throw new GatewayError('CAPABILITY_UNSTABLE_OPT_IN_REQUIRED', capability.capability_id, { readiness: capability.readiness });
  const scopes = new Set(list(invocation.actor?.scopes));
  const missingScopes = capability.authority.required_scopes.filter(scope => !scopes.has(scope));
  if (capability.authority.mode === 'scope' && missingScopes.length) throw new GatewayError('CAPABILITY_SCOPE_MISSING', capability.capability_id, { missing_scopes: missingScopes });
  if (capability.authority.mode === 'explicit-approval') {
    const approval = invocation.approval ?? {};
    if (approval.approved !== true) throw new GatewayError('CAPABILITY_APPROVAL_REQUIRED', capability.capability_id);
    if (capability.authority.approval_roles.length && !capability.authority.approval_roles.includes(String(approval.role ?? ''))) throw new GatewayError('CAPABILITY_APPROVAL_ROLE_INVALID', capability.capability_id);
  }
  if (capability.authority.mode === 'commit-gate' && invocation.commit_gate?.approved !== true) throw new GatewayError('CAPABILITY_COMMIT_GATE_REQUIRED', capability.capability_id);
  return seal({
    format: 'rncs.agent-capability-preflight.v0.1',
    capability_id: capability.capability_id,
    runtime_id: capability.runtime_id,
    action: capability.action,
    effect_class: capability.effect_class,
    readiness: clone(capability.readiness),
    authority_mode: capability.authority.mode,
    scopes_checked: [...scopes].sort(),
    missing_scopes: missingScopes,
    dry_run: invocation.dry_run === true,
  }, 'preflight_root');
}
