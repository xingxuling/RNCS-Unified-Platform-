import { clone } from '../canonical.mjs';
import { CAPABILITY_BY_ID, CAPABILITY_MANIFESTS } from './manifests.mjs';

export class CapabilityRegistryError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'CapabilityRegistryError';
    this.code = code;
    this.classification = 'capability';
    this.details = details;
  }
}

function matchesQuery(manifest, query) {
  if (!query) return true;
  const needle = String(query).toLowerCase();
  return [manifest.capabilityId, manifest.displayName, manifest.domain, manifest.description, ...manifest.compatibilityAliases]
    .some((value) => String(value).toLowerCase().includes(needle));
}

function validateValue(value, descriptor, key) {
  if (!descriptor) return;
  if (descriptor.type === 'string' && typeof value !== 'string') throw new CapabilityRegistryError('INVALID_CAPABILITY_INPUT', `${key} must be a string.`);
  if (descriptor.type === 'integer' && (!Number.isInteger(value))) throw new CapabilityRegistryError('INVALID_CAPABILITY_INPUT', `${key} must be an integer.`);
  if (descriptor.type === 'boolean' && typeof value !== 'boolean') throw new CapabilityRegistryError('INVALID_CAPABILITY_INPUT', `${key} must be a boolean.`);
  if (descriptor.type === 'object' && (!value || typeof value !== 'object' || Array.isArray(value))) throw new CapabilityRegistryError('INVALID_CAPABILITY_INPUT', `${key} must be an object.`);
  if (descriptor.type === 'array' && !Array.isArray(value)) throw new CapabilityRegistryError('INVALID_CAPABILITY_INPUT', `${key} must be an array.`);
  if (descriptor.minLength !== undefined && value.length < descriptor.minLength) throw new CapabilityRegistryError('INVALID_CAPABILITY_INPUT', `${key} is shorter than the minimum length.`);
}

export class CapabilityRegistry {
  constructor(manifests = CAPABILITY_MANIFESTS) {
    this.manifests = new Map(manifests.map((manifest) => [manifest.capabilityId, manifest]));
    this.dynamicIds = new Set();
  }

  get(capabilityId) {
    const manifest = this.manifests.get(capabilityId);
    if (!manifest) throw new CapabilityRegistryError('CAPABILITY_NOT_FOUND', `Unknown capability: ${capabilityId}`);
    return manifest;
  }

  has(capabilityId) { return this.manifests.has(capabilityId); }

  registerDynamic(manifest) {
    if (!manifest?.capabilityId || !manifest?.implementation || !manifest?.evidenceLevel || !manifest?.executionMode || !manifest?.authorityLevel || !manifest?.rollbackSupport) throw new CapabilityRegistryError('MANIFEST_INCOMPLETE', 'Dynamic capability manifest is missing a required safety field.');
    if (this.manifests.has(manifest.capabilityId)) throw new CapabilityRegistryError('CAPABILITY_EXISTS', `Capability already exists: ${manifest.capabilityId}`);
    this.manifests.set(manifest.capabilityId, Object.freeze(clone(manifest)));
    this.dynamicIds.add(manifest.capabilityId);
    return this.publicManifest(manifest);
  }

  removeDynamic(capabilityId) {
    if (!this.dynamicIds.has(capabilityId)) return false;
    this.manifests.delete(capabilityId);
    this.dynamicIds.delete(capabilityId);
    return true;
  }

  search({ query = '', domain, executionMode, implementation, limit = 30 } = {}) {
    const boundedLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
    return [...this.manifests.values()]
      .filter((manifest) => matchesQuery(manifest, query))
      .filter((manifest) => !domain || manifest.domain === domain)
      .filter((manifest) => !executionMode || manifest.executionMode === executionMode)
      .filter((manifest) => !implementation || manifest.implementation === implementation)
      .slice(0, boundedLimit)
      .map((manifest) => this.publicManifest(manifest));
  }

  describe(capabilityId) { return this.publicManifest(this.get(capabilityId)); }

  publicManifest(manifest) {
    return clone(manifest);
  }

  validateInput(manifestOrId, input = {}) {
    const manifest = typeof manifestOrId === 'string' ? this.get(manifestOrId) : manifestOrId;
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new CapabilityRegistryError('INVALID_CAPABILITY_INPUT', 'Capability input must be an object.');
    const schema = manifest.inputSchema ?? {};
    for (const key of schema.required ?? []) if (input[key] === undefined || input[key] === null || input[key] === '') throw new CapabilityRegistryError('INVALID_CAPABILITY_INPUT', `Missing required input: ${key}.`);
    for (const [key, value] of Object.entries(input)) {
      if (key === 'confirmation_token') continue;
      const descriptor = schema.properties?.[key];
      if (!descriptor && schema.additionalProperties === false) throw new CapabilityRegistryError('INVALID_CAPABILITY_INPUT', `Unknown input: ${key}.`);
      validateValue(value, descriptor, key);
    }
    return clone(input);
  }

  summary() {
    const domains = {};
    const implementations = {};
    for (const manifest of this.manifests.values()) {
      domains[manifest.domain] = (domains[manifest.domain] ?? 0) + 1;
      implementations[manifest.implementation] = (implementations[manifest.implementation] ?? 0) + 1;
    }
    return { count: this.manifests.size, domains, implementations };
  }
}

export { CAPABILITY_BY_ID };
