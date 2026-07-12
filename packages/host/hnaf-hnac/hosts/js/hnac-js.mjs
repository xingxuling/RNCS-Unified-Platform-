#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import os from 'node:os';
import { computeStateRoot } from './state-fabric.mjs';
import { compileAdaptiveInterface, validateAdaptiveGraph } from './adaptive-interface.mjs';
import { bindIntent } from './intent-binding.mjs';

const RUNTIME_VERSION = '0.8.0-js';
const EXECUTION_PROFILES = ['wasm-core@1', 'declarative-v0'];
const CAPABILITY_CATALOG = {
  'host.log': { versions: ['1'], methods: ['write'] },
  'host.clock': { versions: ['1'], methods: ['now', 'now-unix-ms'] },
  'environment.summary': { versions: ['1'], methods: ['get'] },
  'storage.kv': { versions: ['1', '2'], methods: ['get', 'set', 'delete'] },
  'storage.state': { versions: ['1'], methods: ['get', 'set', 'delete', 'snapshot', 'status'] },
};
const IMPORT_TO_CAPABILITY = {
  log_write: 'host.log',
  clock_now: 'host.clock',
  environment_summary: 'environment.summary',
  kv_get: 'storage.kv',
  kv_set: 'storage.kv',
};

class HNACError extends Error {}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object' && !(value instanceof Uint8Array) && !Buffer.isBuffer(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])]));
  }
  return value;
}

function canonicalJson(value) {
  return Buffer.from(JSON.stringify(sortObject(value)), 'utf8');
}

function safeLogicalPath(name) {
  if (!name || name.startsWith('/') || name.endsWith('/') || name.split('/').includes('..')) {
    throw new HNACError(`Unsafe logical path: ${name}`);
  }
  return name.replaceAll('\\', '/');
}

function findEocd(buffer) {
  const signature = 0x06054b50;
  const minimum = Math.max(0, buffer.length - 65557);
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) return offset;
  }
  throw new HNACError('Invalid ZIP: EOCD not found');
}

function readZipUnique(filename) {
  const buffer = fs.readFileSync(filename);
  const eocd = findEocd(buffer);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  const files = new Map();
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new HNACError('Invalid ZIP central directory');
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = safeLogicalPath(buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8'));
    if (files.has(name)) throw new HNACError(`Duplicate logical path: ${name}`);
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new HNACError('Invalid ZIP local header');
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let data;
    if (method === 0) data = Buffer.from(compressed);
    else if (method === 8) data = zlib.inflateRawSync(compressed);
    else throw new HNACError(`Unsupported ZIP compression method: ${method}`);
    if (data.length !== uncompressedSize) throw new HNACError(`ZIP size mismatch: ${name}`);
    files.set(name, data);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

function parseJson(files, name) {
  if (!files.has(name)) throw new HNACError(`Missing required file: ${name}`);
  try { return JSON.parse(files.get(name).toString('utf8')); }
  catch (error) { throw new HNACError(`Invalid JSON: ${name}`); }
}

function verifyCapsule(filename, requireSignature = false) {
  const files = readZipUnique(filename);
  const manifest = parseJson(files, 'hnac.json');
  validateManifest(manifest);
  const index = parseJson(files, 'integrity/index.json');
  if (!index.files || typeof index.files !== 'object') throw new HNACError('Invalid integrity index');
  const payload = [...files.keys()].filter((name) => !name.startsWith('integrity/') && !name.startsWith('signatures/') && !name.startsWith('attestations/')).sort();
  const indexed = Object.keys(index.files).sort();
  if (JSON.stringify(payload) !== JSON.stringify(indexed)) throw new HNACError('Integrity file-set mismatch');
  for (const name of indexed) {
    const data = files.get(name);
    const record = index.files[name];
    if (record.size !== data.length || record.sha256 !== sha256(data)) throw new HNACError(`Integrity mismatch: ${name}`);
  }
  let signature = { status: 'absent' };
  if (files.has('signatures/ed25519.json')) {
    const envelope = parseJson(files, 'signatures/ed25519.json');
    const signed = canonicalJson(index);
    if (envelope.signed_sha256 !== sha256(signed)) throw new HNACError('Signature object hash mismatch');
    const rawKey = Buffer.from(envelope.public_key, 'base64');
    const rawSignature = Buffer.from(envelope.signature, 'base64');
    if (rawKey.length !== 32 || rawSignature.length !== 64) throw new HNACError('Invalid Ed25519 key or signature size');
    const spkiPrefix = Buffer.from('302a300506032b6570032100', 'hex');
    const publicKey = crypto.createPublicKey({ key: Buffer.concat([spkiPrefix, rawKey]), format: 'der', type: 'spki' });
    if (!crypto.verify(null, signed, publicKey, rawSignature)) throw new HNACError('Signature verification failed');
    signature = { status: 'valid', signer: envelope.signer ?? 'unknown', public_key_sha256: sha256(rawKey) };
  } else if (requireSignature) {
    throw new HNACError('Signature required but absent');
  }
  for (const candidate of executionCandidates(manifest)) {
    if (!files.has(candidate.entry)) throw new HNACError(`Execution entry missing: ${candidate.entry}`);
    if (candidate.contract && !files.has(candidate.contract)) throw new HNACError(`Execution contract missing: ${candidate.contract}`);
  }
  if (['0.6','0.7'].includes(manifest.interface?.version)) {
    const graphPath = manifest.interface.graph;
    if (!graphPath || !files.has(graphPath)) throw new HNACError(`Adaptive interface graph missing: ${graphPath}`);
    validateAdaptiveGraph(parseJson(files, graphPath));
  }
  return { files, manifest, index, signature };
}

function executionCandidates(manifest) {
  if (manifest.format_version === '0.1') {
    const values = [manifest.execution.primary, ...(manifest.execution.alternatives ?? [])];
    return values.map((profile) => ({ profile, entry: manifest.app.entry }));
  }
  return [manifest.execution.primary, ...(manifest.execution.alternatives ?? [])];
}

function versionTuple(value) {
  if (!/^\d+(\.\d+)*$/.test(String(value))) throw new HNACError(`Invalid numeric version: ${value}`);
  return String(value).split('.').map(Number);
}

function versionGreater(left, right) {
  const a = versionTuple(left); const b = versionTuple(right); const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) { const av = a[i] ?? 0; const bv = b[i] ?? 0; if (av !== bv) return av > bv; }
  return false;
}

function validateManifest(manifest) {
  if (!['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8'].includes(manifest?.format_version)) throw new HNACError(`Unsupported format_version: ${manifest?.format_version}`);
  if (!manifest.app || !manifest.execution || !Array.isArray(manifest.capabilities) || !manifest.security || !manifest.compatibility) throw new HNACError('Manifest missing required sections');
  for (const key of ['id', 'name', 'version']) if (typeof manifest.app[key] !== 'string' || !manifest.app[key]) throw new HNACError(`Invalid app.${key}`);
  if (manifest.security.sandbox !== 'deny-by-default') throw new HNACError('HNAC requires security.sandbox=deny-by-default');
  if (versionGreater(manifest.compatibility.min_runtime, '0.8.0')) throw new HNACError('Capsule requires a newer runtime');
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

function compatibleVersion(requested, versions) {
  const major = String(requested ?? versions.at(-1)).split('.')[0];
  return versions.filter((item) => item.split('.')[0] === major).at(-1) ?? null;
}

function defaultHostProfile() {
  return {
    id: 'hnaf.javascript.node',
    family: 'desktop',
    execution_profiles: EXECUTION_PROFILES,
    capabilities: Object.fromEntries(Object.entries(CAPABILITY_CATALOG).map(([key, value]) => [key, value.versions])),
    interaction_modes: ['cli', 'keyboard', 'pointer'],
    resources: { system: os.platform(), release: os.release(), machine: os.arch(), memory_class: 'host-managed', viewport_width: 1440, viewport_height: 900, screen_reader: false, spatial: false },
    policies: { require_signature: false, network_default: 'deny', fuel_enforcement: 'unavailable', wasm_memory_limits: 'module-declared', accessibility_mode: false },
  };
}

function negotiate(manifest, host = defaultHostProfile()) {
  let execution = null;
  const unsupported_profiles = [];
  for (const candidate of executionCandidates(manifest)) {
    if (EXECUTION_PROFILES.includes(candidate.profile) && host.execution_profiles.includes(candidate.profile)) { execution = candidate; break; }
    unsupported_profiles.push(candidate.profile);
  }
  const grants = [];
  const fallbacks = [];
  const unresolved = [];
  for (const request of manifest.capabilities ?? []) {
    const implementation = CAPABILITY_CATALOG[request.id];
    const hostVersions = host.capabilities[request.id] ?? [];
    const mutual = implementation ? hostVersions.filter((v) => implementation.versions.includes(v)) : [];
    const version = compatibleVersion(request.version, mutual);
    if (version) {
      grants.push({ lease_id: crypto.randomBytes(12).toString('hex'), capability: request.id, version, scope: request.scope ?? 'session', issued_utc: new Date().toISOString(), expires: 'session-end' });
    } else if (request.required) unresolved.push(request.id);
    else fallbacks.push({ capability: request.id, fallback: request.fallback ?? 'unavailable' });
  }
  if (!execution) unresolved.push('execution-profile');
  const status = unresolved.length ? 'blocked' : (fallbacks.length ? 'degraded' : 'ready');
  return {
    status,
    host: { id: host.id, family: host.family, interaction_modes: host.interaction_modes, resources: host.resources, policies: host.policies },
    execution,
    grants,
    fallbacks,
    unresolved,
    unsupported_profiles,
  };
}

class TraceRecorder {
  constructor(filename = null) { this.filename = filename; this.events = []; if (filename) fs.mkdirSync(path.dirname(filename), { recursive: true }); }
  emit(event, fields = {}) {
    const record = { time: new Date().toISOString(), event, ...fields };
    this.events.push(record);
    if (this.filename) fs.appendFileSync(this.filename, `${JSON.stringify(sortObject(record))}\n`, 'utf8');
  }
}

class CapabilityBroker {
  constructor(appId, grants, stateRoot, trace, schemaVersion = '1') {
    this.appId = appId;
    this.grants = Object.fromEntries(grants.map((item) => [item.capability, item]));
    this.stateRoot = stateRoot;
    this.trace = trace;
    this.schemaVersion = String(schemaVersion);
    this.partitionsDir = path.join(stateRoot, 'partitions');
    this.snapshotsDir = path.join(stateRoot, 'snapshots');
    this.metadataFile = path.join(stateRoot, 'metadata.json');
    this.legacyKvFile = path.join(stateRoot, 'kv.json');
    this.ephemeral = {};
    fs.mkdirSync(this.partitionsDir, { recursive: true });
    fs.mkdirSync(this.snapshotsDir, { recursive: true });
    if (fs.existsSync(this.metadataFile)) {
      this.metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
      if (this.metadata.app_id !== appId) throw new HNACError('State root belongs to a different application');
    } else {
      this.metadata = {
        format: 'hnaf.portable-state.v0.5', app_id: appId, schema_version: this.schemaVersion,
        replica_id: `replica-${crypto.randomBytes(12).toString('hex')}`,
        generation: 0, current_snapshot_root: null, created_utc: new Date().toISOString(), updated_utc: new Date().toISOString(),
      };
      this.writeJson(this.metadataFile, this.metadata);
    }
    for (const name of ['portable', 'device_private', 'secret', 'cache']) {
      const file = this.partitionFile(name);
      if (!fs.existsSync(file)) {
        if (name === 'portable' && fs.existsSync(this.legacyKvFile)) this.writeJson(file, JSON.parse(fs.readFileSync(this.legacyKvFile, 'utf8')));
        else this.writeJson(file, {});
      }
    }
  }
  writeJson(filename, value) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    const temp = `${filename}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify(sortObject(value), null, 2)}\n`, 'utf8');
    fs.renameSync(temp, filename);
  }
  partitionFile(name) {
    if (!['portable', 'device_private', 'secret', 'cache'].includes(name)) throw new HNACError(`Unknown persisted state partition: ${name}`);
    return path.join(this.partitionsDir, `${name}.json`);
  }
  readPartition(name) {
    if (name === 'ephemeral') return structuredClone(this.ephemeral);
    return JSON.parse(fs.readFileSync(this.partitionFile(name), 'utf8'));
  }
  writePartition(name, value) {
    if (name === 'ephemeral') { this.ephemeral = structuredClone(value); return; }
    this.writeJson(this.partitionFile(name), value);
    if (name === 'portable') this.writeJson(this.legacyKvFile, value);
    this.metadata.updated_utc = new Date().toISOString();
    this.writeJson(this.metadataFile, this.metadata);
  }
  stateStatus() {
    const partitions = Object.fromEntries(['portable', 'device_private', 'secret', 'cache'].map((name) => [name, this.readPartition(name)]));
    return {
      format: 'hnaf.portable-state.v0.5', app_id: this.appId, schema_version: this.schemaVersion,
      replica_id: this.metadata.replica_id, generation: this.metadata.generation,
      current_snapshot_root: this.metadata.current_snapshot_root,
      state_root: computeStateRoot(this.appId, this.schemaVersion, partitions),
      partition_keys: Object.fromEntries(Object.entries(partitions).map(([name, value]) => [name, Object.keys(value).length])),
    };
  }
  snapshot(label = null) {
    const partitions = Object.fromEntries(['portable', 'device_private', 'secret', 'cache'].map((name) => [name, this.readPartition(name)]));
    const core = {
      format: 'hnaf.portable-state.v0.5', app_id: this.appId, schema_version: this.schemaVersion,
      replica_id: this.metadata.replica_id, generation: Number(this.metadata.generation ?? 0) + 1,
      parent_snapshot_root: this.metadata.current_snapshot_root,
      state_root: computeStateRoot(this.appId, this.schemaVersion, partitions), partitions, label,
    };
    const snapshotRoot = sha256(canonicalJson(core));
    this.writeJson(path.join(this.snapshotsDir, `${snapshotRoot}.json`), { ...core, snapshot_root: snapshotRoot, created_utc: new Date().toISOString() });
    this.metadata.generation = core.generation;
    this.metadata.current_snapshot_root = snapshotRoot;
    this.metadata.updated_utc = new Date().toISOString();
    this.writeJson(this.metadataFile, this.metadata);
    return { ...core, snapshot_root: snapshotRoot };
  }
  require(capability, method) {
    if (!this.grants[capability]) { this.trace.emit('capability.denied', { capability, method, reason: 'no-lease' }); throw new HNACError(`Undeclared or ungranted capability use: ${capability}`); }
    if (!CAPABILITY_CATALOG[capability]?.methods.includes(method)) throw new HNACError(`Unsupported capability method: ${capability}/${method}`);
  }
  call(capability, method, args = {}) {
    this.require(capability, method);
    this.trace.emit('capability.call', { capability, method, lease_id: this.grants[capability].lease_id });
    if (capability === 'host.log' && method === 'write') { process.stderr.write(`${String(args.message ?? '')}\n`); return { written: true }; }
    if (capability === 'host.clock' && method === 'now') return new Date().toISOString();
    if (capability === 'host.clock' && method === 'now-unix-ms') return Date.now();
    if (capability === 'environment.summary' && method === 'get') return { system: os.platform(), release: os.release(), machine: os.arch(), runtime: RUNTIME_VERSION, execution: 'javascript-webassembly' };
    if (capability === 'storage.kv' || capability === 'storage.state') {
      const partition = String(args.partition ?? 'portable');
      const store = this.readPartition(partition);
      const key = String(args.key ?? '');
      if (method === 'get') return Object.hasOwn(store, key) ? structuredClone(store[key]) : args.default;
      if (method === 'set') { store[key] = structuredClone(args.value); this.writePartition(partition, store); return { stored: true, partition, key, state_root: this.stateStatus().state_root }; }
      if (method === 'delete') { const existed = Object.hasOwn(store, key); delete store[key]; this.writePartition(partition, store); return { deleted: existed, partition, key, state_root: this.stateStatus().state_root }; }
      if (method === 'snapshot') return this.snapshot(args.label ?? null);
      if (method === 'status') return this.stateStatus();
    }
    throw new HNACError(`Unsupported capability method: ${capability}/${method}`);
  }
}

function resolveTemplate(value, variables) {
  if (typeof value === 'string') {
    let result = value;
    for (const [key, item] of Object.entries(variables)) result = result.replaceAll(`{{${key}}}`, typeof item === 'object' ? JSON.stringify(item) : String(item));
    return result;
  }
  if (Array.isArray(value)) return value.map((item) => resolveTemplate(item, variables));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveTemplate(item, variables)]));
  return value;
}

async function executeDeclarative(payload, broker, manifest, limits = {}) {
  const component = JSON.parse(payload.toString('utf8'));
  if (component.profile !== 'declarative-v0' || !Array.isArray(component.operations)) throw new HNACError('Invalid declarative component');
  if (component.operations.length > Number(limits.operations ?? 10000)) throw new HNACError('Declarative operation limit exceeded');
  const variables = { 'app.name': manifest.app.name, 'app.version': manifest.app.version };
  for (const [index, operation] of component.operations.entries()) {
    if (operation.op === 'set') variables[String(operation.name)] = resolveTemplate(operation.value, variables);
    else if (operation.op === 'capability_call') {
      const value = broker.call(String(operation.capability), String(operation.method), resolveTemplate(operation.args ?? {}, variables));
      if (operation.save_as) variables[String(operation.save_as)] = value;
    } else if (operation.op === 'print') process.stderr.write(`${resolveTemplate(operation.text ?? '', variables)}\n`);
    else if (operation.op === 'assert') {
      const left = resolveTemplate(operation.left, variables); const right = resolveTemplate(operation.right, variables);
      if (JSON.stringify(left) !== JSON.stringify(right)) throw new HNACError(`Assertion failed at operation ${index}`);
    } else throw new HNACError(`Unknown operation at index ${index}: ${operation.op}`);
  }
  return { profile: 'declarative-v0', operations: component.operations.length, variables };
}

async function executeWasmCore(payload, broker) {
  const module = await WebAssembly.compile(payload);
  for (const item of WebAssembly.Module.imports(module)) {
    if (item.module !== 'hnaf' || !IMPORT_TO_CAPABILITY[item.name]) throw new HNACError(`Forbidden Wasm import: ${item.module}/${item.name}`);
    const capability = IMPORT_TO_CAPABILITY[item.name];
    if (!broker.grants[capability]) throw new HNACError(`Wasm imports capability without a granted lease: ${capability}`);
  }
  let instance;
  const memory = () => {
    const value = instance?.exports?.memory;
    if (!(value instanceof WebAssembly.Memory)) throw new HNACError('Wasm guest must export memory');
    return value;
  };
  const readUtf8 = (ptr, length) => {
    const view = new Uint8Array(memory().buffer);
    if (ptr < 0 || length < 0 || ptr + length > view.length) throw new HNACError('Invalid Wasm memory range');
    return new TextDecoder().decode(view.subarray(ptr, ptr + length));
  };
  const writeUtf8 = (ptr, capacity, value) => {
    const bytes = new TextEncoder().encode(value);
    const view = new Uint8Array(memory().buffer);
    if (ptr < 0 || capacity < 0 || ptr + capacity > view.length) throw new HNACError('Invalid Wasm output range');
    if (bytes.length > capacity) return bytes.length;
    view.set(bytes, ptr); return bytes.length;
  };
  const imports = { hnaf: {
    log_write: (ptr, length) => { broker.call('host.log', 'write', { message: readUtf8(ptr, length) }); return 0; },
    clock_now: (ptr, capacity) => writeUtf8(ptr, capacity, String(broker.call('host.clock', 'now', {}))),
    environment_summary: (ptr, capacity) => writeUtf8(ptr, capacity, JSON.stringify(sortObject(broker.call('environment.summary', 'get', {})))),
    kv_get: (keyPtr, keyLen, outPtr, outCapacity) => writeUtf8(outPtr, outCapacity, String(broker.call('storage.kv', 'get', { key: readUtf8(keyPtr, keyLen), default: 'first portable launch' }))),
    kv_set: (keyPtr, keyLen, valuePtr, valueLen) => { broker.call('storage.kv', 'set', { key: readUtf8(keyPtr, keyLen), value: readUtf8(valuePtr, valueLen) }); return 0; },
  } };
  instance = await WebAssembly.instantiate(module, imports);
  if (typeof instance.exports.run !== 'function') throw new HNACError('Wasm guest must export run()');
  const code = instance.exports.run();
  if (code !== 0) throw new HNACError(`Wasm guest returned non-zero status: ${code}`);
  return { profile: 'wasm-core@1', status_code: code, imports: WebAssembly.Module.imports(module).map((item) => `${item.module}/${item.name}`), resource_enforcement: { fuel: 'unavailable', memory: 'module-declared' } };
}

async function runCapsule(filename, options = {}) {
  const host = options.host ?? defaultHostProfile();
  const effectiveSignature = Boolean(options.requireSignature || host.policies?.require_signature);
  const verified = verifyCapsule(filename, effectiveSignature);
  const plan = negotiate(verified.manifest, host);
  const trace = new TraceRecorder(options.trace ?? null);
  trace.emit('host.context', { host });
  trace.emit('capsule.verified', { app_id: verified.manifest.app.id, signature: verified.signature });
  trace.emit('capability.negotiated', plan);
  if (plan.status === 'blocked' || !plan.execution) throw new HNACError(`Launch blocked; unresolved=${plan.unresolved.join(',')}`);
  const stateRoot = options.stateRoot ?? path.join(os.homedir(), '.hnac-js', 'apps', verified.manifest.app.id);
  const broker = new CapabilityBroker(verified.manifest.app.id, plan.grants, stateRoot, trace, verified.manifest.state?.schema_version ?? '1');
  const payload = verified.files.get(plan.execution.entry);
  const limits = verified.manifest.execution?.limits ?? {};
  trace.emit('execution.started', { profile: plan.execution.profile, entry: plan.execution.entry, limits });
  let execution;
  if (plan.execution.profile === 'wasm-core@1') execution = await executeWasmCore(payload, broker, verified.manifest, limits);
  else if (plan.execution.profile === 'declarative-v0') execution = await executeDeclarative(payload, broker, verified.manifest, limits);
  else throw new HNACError(`No JavaScript executor for ${plan.execution.profile}`);
  trace.emit('execution.completed', { result: execution });
  const snapshot = (verified.manifest.state?.autosnapshot ?? ['0.5', '0.6', '0.7', '0.8'].includes(verified.manifest.format_version)) ? broker.snapshot('capsule-run') : null;
  let interfaceProjection = null;
  if (['0.6','0.7'].includes(verified.manifest.interface?.version)) {
    interfaceProjection = await compileAdaptiveInterface(parseJson(verified.files, verified.manifest.interface.graph), host);
    trace.emit('interface.projected', { profile: interfaceProjection.profile, semantic_snapshot: interfaceProjection.semantic_snapshot });
  }
  return { runtime: RUNTIME_VERSION, app: verified.manifest.app, signature: verified.signature, negotiation: plan, execution, state: broker.stateStatus(), interface_projection: interfaceProjection, snapshot: snapshot ? { snapshot_root: snapshot.snapshot_root, state_root: snapshot.state_root, generation: snapshot.generation } : null, trace_events: trace.events.length };
}

function emit(value) { process.stdout.write(`${JSON.stringify(sortObject(value), null, 2)}\n`); }

function parseArgs(argv) {
  const [command, capsule, ...rest] = argv;
  if (!command || !capsule) throw new HNACError('Usage: hnac-js <verify|plan|run|intent-bind> <capsule> [options]');
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--require-signature') options.requireSignature = true;
    else if (arg === '--trace') options.trace = rest[++i];
    else if (arg === '--state-root') options.stateRoot = rest[++i];
    else if (arg === '--host-profile') options.host = JSON.parse(fs.readFileSync(rest[++i], 'utf8'));
    else if (arg === '--intent') options.intent = rest[++i];
    else if (arg === '--subject') options.subject = JSON.parse(rest[++i].startsWith('@') ? fs.readFileSync(rest[i].slice(1), 'utf8') : rest[i]);
    else if (arg === '--payload') options.payload = JSON.parse(rest[++i].startsWith('@') ? fs.readFileSync(rest[i].slice(1), 'utf8') : rest[i]);
    else if (arg === '--approval') options.approval = JSON.parse(rest[++i].startsWith('@') ? fs.readFileSync(rest[i].slice(1), 'utf8') : rest[i]);
    else if (arg === '--approve') options.approve = true;
    else if (arg === '--now') options.now = rest[++i];
    else throw new HNACError(`Unknown option: ${arg}`);
  }
  return { command, capsule, options };
}

async function main() {
  const { command, capsule, options } = parseArgs(process.argv.slice(2));
  if (command === 'verify') {
    const value = verifyCapsule(capsule, options.requireSignature);
    emit({ runtime: RUNTIME_VERSION, app: value.manifest.app, signature: value.signature, files: Object.keys(value.index.files).length });
  } else if (command === 'plan') {
    const value = verifyCapsule(capsule, options.requireSignature);
    const host = options.host ?? defaultHostProfile();
    const interfaceProjection = ['0.6','0.7'].includes(value.manifest.interface?.version)
      ? await compileAdaptiveInterface(parseJson(value.files, value.manifest.interface.graph), host)
      : null;
    emit({ runtime: RUNTIME_VERSION, app: value.manifest.app, signature: value.signature, negotiation: negotiate(value.manifest, host), interface_projection: interfaceProjection });
  } else if (command === 'intent-bind') {
    const value = verifyCapsule(capsule, options.requireSignature);
    const host = options.host ?? defaultHostProfile();
    if (!options.intent) throw new HNACError('--intent is required');
    const graph = parseJson(value.files, value.manifest.interface.graph);
    emit(bindIntent({manifest:value.manifest,files:value.files,graph,intentId:options.intent,host,subject:options.subject??{subject_id:'subject:local-user',kind:'human',roles:['owner'],scopes:['*']},payload:options.payload??{},approval:options.approval??null,approve:Boolean(options.approve),now:options.now??null}));
  } else if (command === 'run') emit(await runCapsule(capsule, options));
  else throw new HNACError(`Unknown command: ${command}`);
}

main().catch((error) => { process.stderr.write(`HNAC JS error: ${error.message}\n`); process.exitCode = 2; });
