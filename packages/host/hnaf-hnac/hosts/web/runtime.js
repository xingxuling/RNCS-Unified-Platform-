import { computeStateRoot } from './state-fabric.js';
import { compileAdaptiveInterface, renderAdaptiveInterface, routeAdaptiveEvent, validateAdaptiveGraph } from './adaptive-interface.js';
const RUNTIME_VERSION = '0.7.0-web';
const CAPABILITY_CATALOG = {
  'host.log': { versions: ['1'], methods: ['write'] },
  'host.clock': { versions: ['1'], methods: ['now', 'now-unix-ms'] },
  'environment.summary': { versions: ['1'], methods: ['get'] },
  'storage.kv': { versions: ['1', '2'], methods: ['get', 'set', 'delete'] },
  'storage.state': { versions: ['1'], methods: ['get', 'set', 'delete', 'snapshot', 'status'] },
};
const IMPORT_TO_CAPABILITY = {
  log_write: 'host.log', clock_now: 'host.clock', environment_summary: 'environment.summary', kv_get: 'storage.kv', kv_set: 'storage.kv',
};

export class HNACError extends Error {}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object' && !(value instanceof Uint8Array) && !(value instanceof ArrayBuffer)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])]));
  }
  return value;
}

function canonicalJson(value) { return new TextEncoder().encode(JSON.stringify(sortObject(value))); }
function hex(buffer) { return [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, '0')).join(''); }
async function sha256(data) { return hex(await crypto.subtle.digest('SHA-256', data)); }
function b64(value) { return Uint8Array.from(atob(value), (char) => char.charCodeAt(0)); }
function u16(view, offset) { return view.getUint16(offset, true); }
function u32(view, offset) { return view.getUint32(offset, true); }
function safeLogicalPath(name) {
  const normalized = name.replaceAll('\\', '/');
  if (!normalized || normalized.startsWith('/') || normalized.endsWith('/') || normalized.split('/').includes('..')) throw new HNACError(`Unsafe logical path: ${name}`);
  return normalized;
}
function findEocd(bytes, view) {
  const minimum = Math.max(0, bytes.length - 65557);
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) if (u32(view, offset) === 0x06054b50) return offset;
  throw new HNACError('Invalid ZIP: EOCD not found');
}
async function inflateRaw(data) {
  if (!globalThis.DecompressionStream) throw new HNACError('This browser lacks DecompressionStream support');
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZipUnique(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer); const view = new DataView(arrayBuffer);
  const eocd = findEocd(bytes, view); const count = u16(view, eocd + 10); let cursor = u32(view, eocd + 16);
  const files = new Map(); const decoder = new TextDecoder();
  for (let index = 0; index < count; index += 1) {
    if (u32(view, cursor) !== 0x02014b50) throw new HNACError('Invalid ZIP central directory');
    const method = u16(view, cursor + 10); const compressedSize = u32(view, cursor + 20); const uncompressedSize = u32(view, cursor + 24);
    const nameLength = u16(view, cursor + 28); const extraLength = u16(view, cursor + 30); const commentLength = u16(view, cursor + 32); const localOffset = u32(view, cursor + 42);
    const name = safeLogicalPath(decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength)));
    if (files.has(name)) throw new HNACError(`Duplicate logical path: ${name}`);
    if (u32(view, localOffset) !== 0x04034b50) throw new HNACError('Invalid ZIP local header');
    const localNameLength = u16(view, localOffset + 26); const localExtraLength = u16(view, localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength; const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
    const data = method === 0 ? compressed : (method === 8 ? await inflateRaw(compressed) : null);
    if (!data) throw new HNACError(`Unsupported ZIP compression method: ${method}`);
    if (data.length !== uncompressedSize) throw new HNACError(`ZIP size mismatch: ${name}`);
    files.set(name, data); cursor += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

function parseJson(files, name) {
  if (!files.has(name)) throw new HNACError(`Missing required file: ${name}`);
  try { return JSON.parse(new TextDecoder().decode(files.get(name))); } catch { throw new HNACError(`Invalid JSON: ${name}`); }
}
function executionCandidates(manifest) {
  if (manifest.format_version === '0.1') return [manifest.execution.primary, ...(manifest.execution.alternatives ?? [])].map((profile) => ({ profile, entry: manifest.app.entry }));
  return [manifest.execution.primary, ...(manifest.execution.alternatives ?? [])];
}

function versionTuple(value) {
  if (!/^\d+(\.\d+)*$/.test(String(value))) throw new HNACError(`Invalid numeric version: ${value}`);
  return String(value).split('.').map(Number);
}
function versionGreater(left, right) {
  const a = versionTuple(left); const b = versionTuple(right); const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) { const av = a[index] ?? 0; const bv = b[index] ?? 0; if (av !== bv) return av > bv; }
  return false;
}
function validateManifest(manifest) {
  if (!['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7'].includes(manifest?.format_version)) throw new HNACError(`Unsupported format_version: ${manifest?.format_version}`);
  if (!manifest.app || !manifest.execution || !Array.isArray(manifest.capabilities) || !manifest.security || !manifest.compatibility) throw new HNACError('Manifest missing required sections');
  for (const key of ['id', 'name', 'version']) if (typeof manifest.app[key] !== 'string' || !manifest.app[key]) throw new HNACError(`Invalid app.${key}`);
  if (manifest.security.sandbox !== 'deny-by-default') throw new HNACError('HNAC requires security.sandbox=deny-by-default');
  if (versionGreater(manifest.compatibility.min_runtime, '0.7.0')) throw new HNACError('Capsule requires a newer runtime');
  const seen = new Set();
  for (const request of manifest.capabilities) {
    if (!request || typeof request.id !== 'string' || typeof request.required !== 'boolean') throw new HNACError('Invalid capability declaration');
    if (seen.has(request.id)) throw new HNACError(`Duplicate capability declaration: ${request.id}`);
    seen.add(request.id);
  }
  for (const candidate of executionCandidates(manifest)) {
    if (!candidate || typeof candidate.profile !== 'string' || typeof candidate.entry !== 'string') throw new HNACError('Invalid execution candidate');
    safeLogicalPath(candidate.entry); if (candidate.contract) safeLogicalPath(candidate.contract);
    if (candidate.profile === 'wasm-component@1' && !candidate.world) throw new HNACError('wasm-component@1 requires execution world metadata');
  }
}

export async function verifyCapsule(arrayBuffer, requireSignature = false) {
  const files = await readZipUnique(arrayBuffer); const manifest = parseJson(files, 'hnac.json'); validateManifest(manifest); const index = parseJson(files, 'integrity/index.json');
  const payload = [...files.keys()].filter((name) => !/^(integrity|signatures|attestations)\//.test(name)).sort(); const indexed = Object.keys(index.files ?? {}).sort();
  if (JSON.stringify(payload) !== JSON.stringify(indexed)) throw new HNACError('Integrity file-set mismatch');
  for (const name of indexed) {
    const record = index.files[name]; const data = files.get(name);
    if (record.size !== data.length || record.sha256 !== await sha256(data)) throw new HNACError(`Integrity mismatch: ${name}`);
  }
  let signature = { status: 'absent' };
  if (files.has('signatures/ed25519.json')) {
    const envelope = parseJson(files, 'signatures/ed25519.json'); const signed = canonicalJson(index);
    if (envelope.signed_sha256 !== await sha256(signed)) throw new HNACError('Signature object hash mismatch');
    try {
      const key = await crypto.subtle.importKey('raw', b64(envelope.public_key), { name: 'Ed25519' }, false, ['verify']);
      const valid = await crypto.subtle.verify({ name: 'Ed25519' }, key, b64(envelope.signature), signed);
      if (!valid) throw new Error('invalid');
      signature = { status: 'valid', signer: envelope.signer ?? 'unknown', public_key_sha256: await sha256(b64(envelope.public_key)) };
    } catch (error) {
      if (requireSignature) throw new HNACError(`Signature verification unavailable or failed: ${error.message}`);
      signature = { status: 'unverified', reason: 'webcrypto-ed25519-unavailable-or-invalid' };
    }
  } else if (requireSignature) throw new HNACError('Signature required but absent');
  for (const candidate of executionCandidates(manifest)) if (!files.has(candidate.entry)) throw new HNACError(`Execution entry missing: ${candidate.entry}`);
  if (['0.6', '0.7'].includes(manifest.interface?.version)) {
    const graphPath = manifest.interface.graph;
    if (!graphPath || !files.has(graphPath)) throw new HNACError(`Adaptive interface graph missing: ${graphPath}`);
    validateAdaptiveGraph(parseJson(files, graphPath));
  }
  return { files, manifest, index, signature };
}

export function defaultHostProfile(overrides = {}) {
  const width = Number(globalThis.innerWidth ?? 1280);
  const touch = Number(navigator.maxTouchPoints ?? 0) > 0;
  const forcedColors = Boolean(globalThis.matchMedia?.('(forced-colors: active)').matches);
  const reducedMotion = Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const base = {
    id: 'hnaf.javascript.browser', family: 'web', execution_profiles: ['wasm-core@1', 'declarative-v0'],
    capabilities: Object.fromEntries(Object.entries(CAPABILITY_CATALOG).map(([key, value]) => [key, value.versions])),
    interaction_modes: [...(touch ? ['touch'] : []), 'pointer', 'keyboard'],
    resources: {
      user_agent: navigator.userAgent, language: navigator.language, online: navigator.onLine,
      memory_class: navigator.deviceMemory ?? 'unknown', viewport_width: width,
      viewport_height: Number(globalThis.innerHeight ?? 720), screen_reader: false, spatial: false,
    },
    policies: {
      require_signature: false, network_default: 'deny', storage: 'origin-scoped',
      fuel_enforcement: 'unavailable', accessibility_mode: forcedColors, reduced_motion: reducedMotion,
    },
  };
  return {
    ...base,
    ...overrides,
    resources: { ...base.resources, ...(overrides.resources ?? {}) },
    policies: { ...base.policies, ...(overrides.policies ?? {}) },
    interaction_modes: overrides.interaction_modes ?? base.interaction_modes,
  };
}

export function negotiate(manifest, host = defaultHostProfile()) {
  let execution = null; const unsupported_profiles = [];
  for (const candidate of executionCandidates(manifest)) {
    if (host.execution_profiles.includes(candidate.profile)) { execution = candidate; break; }
    unsupported_profiles.push(candidate.profile);
  }
  const grants = []; const fallbacks = []; const unresolved = [];
  for (const request of manifest.capabilities ?? []) {
    const versions = host.capabilities[request.id] ?? []; const major = String(request.version ?? versions.at(-1) ?? '').split('.')[0];
    const version = versions.filter((item) => item.split('.')[0] === major).at(-1);
    if (version) grants.push({ lease_id: crypto.randomUUID(), capability: request.id, version, scope: request.scope ?? 'session', expires: 'session-end' });
    else if (request.required) unresolved.push(request.id); else fallbacks.push({ capability: request.id, fallback: request.fallback ?? 'unavailable' });
  }
  if (!execution) unresolved.push('execution-profile');
  return { status: unresolved.length ? 'blocked' : (fallbacks.length ? 'degraded' : 'ready'), host, execution, grants, fallbacks, unresolved, unsupported_profiles };
}

class BrowserBroker {
  constructor(appId, grants, emit, schemaVersion = '1') {
    this.appId = appId;
    this.grants = Object.fromEntries(grants.map((item) => [item.capability, item]));
    this.emit = emit;
    this.schemaVersion = String(schemaVersion);
    this.ephemeral = {};
    this.metadataKey = `hnac:${this.appId}:state:metadata`;
    this.legacyKey = `hnac:${this.appId}:kv`;
    const existing = localStorage.getItem(this.metadataKey);
    this.metadata = existing ? JSON.parse(existing) : {
      format: 'hnaf.portable-state.v0.5',
      app_id: this.appId,
      schema_version: this.schemaVersion,
      replica_id: `replica-${crypto.randomUUID()}`,
      generation: 0,
      current_snapshot_root: null,
      created_utc: new Date().toISOString(),
      updated_utc: new Date().toISOString(),
    };
    if (this.metadata.app_id !== this.appId) throw new HNACError('State root belongs to a different application');
    this.saveMetadata();
    for (const name of ['portable', 'device_private', 'secret', 'cache']) {
      const key = this.partitionKey(name);
      if (localStorage.getItem(key) === null) {
        const legacy = name === 'portable' ? localStorage.getItem(this.legacyKey) : null;
        localStorage.setItem(key, legacy ?? '{}');
      }
    }
  }
  partitionKey(name) {
    if (!['portable', 'device_private', 'secret', 'cache'].includes(name)) throw new HNACError(`Unknown persisted state partition: ${name}`);
    return `hnac:${this.appId}:state:${name}`;
  }
  saveMetadata() {
    localStorage.setItem(this.metadataKey, JSON.stringify(sortObject(this.metadata)));
  }
  readPartition(name) {
    if (name === 'ephemeral') return structuredClone(this.ephemeral);
    return JSON.parse(localStorage.getItem(this.partitionKey(name)) ?? '{}');
  }
  writePartition(name, value) {
    if (name === 'ephemeral') { this.ephemeral = structuredClone(value); return; }
    localStorage.setItem(this.partitionKey(name), JSON.stringify(sortObject(value)));
    if (name === 'portable') localStorage.setItem(this.legacyKey, JSON.stringify(sortObject(value)));
    this.metadata.updated_utc = new Date().toISOString();
    this.saveMetadata();
  }
  partitions() {
    return Object.fromEntries(['portable', 'device_private', 'secret', 'cache'].map((name) => [name, this.readPartition(name)]));
  }
  async stateStatus() {
    const partitions = this.partitions();
    return {
      format: 'hnaf.portable-state.v0.5', app_id: this.appId, schema_version: this.schemaVersion,
      replica_id: this.metadata.replica_id, generation: this.metadata.generation,
      current_snapshot_root: this.metadata.current_snapshot_root,
      state_root: await computeStateRoot(this.appId, this.schemaVersion, partitions),
      partition_keys: Object.fromEntries(Object.entries(partitions).map(([name, value]) => [name, Object.keys(value).length])),
    };
  }
  async snapshot(label = null) {
    const partitions = this.partitions();
    const core = {
      format: 'hnaf.portable-state.v0.5', app_id: this.appId, schema_version: this.schemaVersion,
      replica_id: this.metadata.replica_id, generation: Number(this.metadata.generation ?? 0) + 1,
      parent_snapshot_root: this.metadata.current_snapshot_root,
      state_root: await computeStateRoot(this.appId, this.schemaVersion, partitions), partitions, label,
    };
    const snapshotRoot = await sha256(canonicalJson(core));
    localStorage.setItem(`hnac:${this.appId}:snapshot:${snapshotRoot}`, JSON.stringify(sortObject({ ...core, snapshot_root: snapshotRoot, created_utc: new Date().toISOString() })));
    this.metadata.generation = core.generation;
    this.metadata.current_snapshot_root = snapshotRoot;
    this.metadata.updated_utc = new Date().toISOString();
    this.saveMetadata();
    return { ...core, snapshot_root: snapshotRoot };
  }
  require(capability, method) {
    if (!this.grants[capability]) throw new HNACError(`No capability lease: ${capability}`);
    if (!CAPABILITY_CATALOG[capability]?.methods.includes(method)) throw new HNACError(`Unknown method: ${capability}/${method}`);
  }
  call(capability, method, args = {}) {
    this.require(capability, method); this.emit({ event: 'capability.call', capability, method });
    if (capability === 'host.log') { this.emit({ event: 'application.log', message: String(args.message ?? '') }); return { written: true }; }
    if (capability === 'host.clock' && method === 'now') return new Date().toISOString();
    if (capability === 'host.clock' && method === 'now-unix-ms') return Date.now();
    if (capability === 'environment.summary') return { system: navigator.platform, release: navigator.userAgent, machine: 'browser', runtime: RUNTIME_VERSION };
    if (capability === 'storage.kv' || capability === 'storage.state') {
      const partition = String(args.partition ?? 'portable');
      const store = this.readPartition(partition); const key = String(args.key ?? '');
      if (method === 'get') return Object.hasOwn(store, key) ? structuredClone(store[key]) : args.default;
      if (method === 'set') { store[key] = structuredClone(args.value); this.writePartition(partition, store); return { stored: true, partition, key }; }
      if (method === 'delete') { const existed = Object.hasOwn(store, key); delete store[key]; this.writePartition(partition, store); return { deleted: existed, partition, key }; }
    }
    throw new HNACError(`Unsupported synchronous capability: ${capability}/${method}`);
  }
  async callAsync(capability, method, args = {}) {
    if (capability === 'storage.state' && method === 'snapshot') { this.require(capability, method); this.emit({ event: 'capability.call', capability, method }); return this.snapshot(args.label ?? null); }
    if (capability === 'storage.state' && method === 'status') { this.require(capability, method); this.emit({ event: 'capability.call', capability, method }); return this.stateStatus(); }
    return this.call(capability, method, args);
  }
}

async function executeWasm(payload, broker) {
  const module = await WebAssembly.compile(payload); let instance;
  for (const item of WebAssembly.Module.imports(module)) {
    const capability = item.module === 'hnaf' ? IMPORT_TO_CAPABILITY[item.name] : null;
    if (!capability || !broker.grants[capability]) throw new HNACError(`Forbidden or ungranted import: ${item.module}/${item.name}`);
  }
  const memory = () => { const value = instance?.exports?.memory; if (!(value instanceof WebAssembly.Memory)) throw new HNACError('Wasm must export memory'); return value; };
  const read = (ptr, len) => new TextDecoder().decode(new Uint8Array(memory().buffer, ptr, len));
  const write = (ptr, cap, text) => { const value = new TextEncoder().encode(text); if (value.length > cap) return value.length; new Uint8Array(memory().buffer).set(value, ptr); return value.length; };
  instance = await WebAssembly.instantiate(module, { hnaf: {
    log_write: (ptr, len) => { broker.call('host.log', 'write', { message: read(ptr, len) }); return 0; },
    clock_now: (ptr, cap) => write(ptr, cap, broker.call('host.clock', 'now', {})),
    environment_summary: (ptr, cap) => write(ptr, cap, JSON.stringify(broker.call('environment.summary', 'get', {}))),
    kv_get: (kp, kl, op, oc) => write(op, oc, String(broker.call('storage.kv', 'get', { key: read(kp, kl), default: 'first portable launch' }))),
    kv_set: (kp, kl, vp, vl) => { broker.call('storage.kv', 'set', { key: read(kp, kl), value: read(vp, vl) }); return 0; },
  } });
  const code = instance.exports.run(); if (code !== 0) throw new HNACError(`Wasm returned ${code}`);
  return { profile: 'wasm-core@1', status_code: code };
}

async function executeDeclarative(payload, broker) {
  const value = JSON.parse(new TextDecoder().decode(payload));
  for (const operation of value.operations ?? []) if (operation.op === 'capability_call') await broker.callAsync(operation.capability, operation.method, operation.args ?? {});
  return { profile: 'declarative-v0', operations: value.operations?.length ?? 0 };
}

export async function runCapsule(arrayBuffer, emit = () => {}, options = {}) {
  const verified = await verifyCapsule(arrayBuffer, Boolean(options.requireSignature)); const host = options.host ?? defaultHostProfile(); const plan = negotiate(verified.manifest, host);
  emit({ event: 'host.context', host }); emit({ event: 'capsule.verified', app: verified.manifest.app, signature: verified.signature }); emit({ event: 'capability.negotiated', plan });
  if (plan.status === 'blocked' || !plan.execution) throw new HNACError(`Launch blocked: ${plan.unresolved.join(', ')}`);
  const broker = new BrowserBroker(verified.manifest.app.id, plan.grants, emit, verified.manifest.state?.schema_version ?? '1'); emit({ event: 'execution.started', profile: plan.execution.profile });
  const payload = verified.files.get(plan.execution.entry); const result = plan.execution.profile === 'wasm-core@1' ? await executeWasm(payload, broker) : await executeDeclarative(payload, broker);
  emit({ event: 'execution.completed', result });
  const snapshot = (verified.manifest.state?.autosnapshot ?? ['0.5', '0.6', '0.7'].includes(verified.manifest.format_version)) ? await broker.snapshot('capsule-run') : null;
  const state = await broker.stateStatus();
  let interfaceProjection = null;
  if (['0.6', '0.7'].includes(verified.manifest.interface?.version)) {
    const graph = parseJson(verified.files, verified.manifest.interface.graph);
    interfaceProjection = await compileAdaptiveInterface(graph, host);
    emit({ event: 'interface.projected', profile: interfaceProjection.profile, semantic_snapshot: interfaceProjection.semantic_snapshot });
  }
  return {
    runtime: RUNTIME_VERSION, app: verified.manifest.app, signature: verified.signature, negotiation: plan,
    execution: result, state, interface_projection: interfaceProjection,
    snapshot: snapshot ? { snapshot_root: snapshot.snapshot_root, state_root: snapshot.state_root, generation: snapshot.generation } : null,
    files: verified.files,
  };
}

export async function renderAip(container, files, manifest, options = {}) {
  container.replaceChildren(); const graphPath = manifest.interface?.graph;
  if (!graphPath || !files.has(graphPath)) return null;
  const graph = parseJson(files, graphPath);
  if (['0.6', '0.7'].includes(manifest.interface?.version) && ['0.6', '0.7'].includes(graph.version)) {
    const host = options.host ?? defaultHostProfile();
    const plan = await compileAdaptiveInterface(graph, host);
    renderAdaptiveInterface(container, graph, plan, options.context ?? { app: manifest.app }, options.onIntent ?? (() => {}));
    return { graph, plan };
  }
  const heading = document.createElement('h2'); heading.textContent = manifest.app.name; container.append(heading);
  for (const [id, node] of Object.entries(graph.nodes ?? {})) {
    const article = document.createElement('article'); article.className = 'semantic-node'; article.dataset.node = id;
    const title = document.createElement('h3'); title.textContent = node.label ?? id; article.append(title);
    const meta = document.createElement('p'); meta.textContent = `${node.kind ?? 'node'} · ${node.priority ?? 'normal'}`; article.append(meta);
    container.append(article);
  }
  return { graph, plan: null };
}

export { compileAdaptiveInterface, renderAdaptiveInterface, routeAdaptiveEvent, validateAdaptiveGraph };
