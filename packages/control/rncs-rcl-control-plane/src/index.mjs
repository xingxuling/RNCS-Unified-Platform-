import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  bootstrapCompilerStage5,
  compileRealityToBytecode,
  compileSourceSelfHosted,
  DEFAULT_GENERAL_SELFHOST_COMPILER_ARTIFACT_PATH,
  decodeBytecode,
  runNativeBytecode,
  verifyNativeParity,
  EmbeddedNativeVm,
  RCL_BYTECODE_VERSION,
  RCL_LANGUAGE_VERSION,
  toRncsProposalInput,
  FOUNDATION_CONTRACT_FORMAT,
  FOUNDATION_CONTRACT_VERSION,
  FOUNDATION_MANIFEST_ROOT,
  foundationContractSummary,
  compileTypedNativeLink,
  compileTypedNativeLinkFromPackage,
  replayTypedNativeLink,
  realityRoot,
  verifyTypedNativeLink,
} from '@taowind/reality-computation-language';
import { discoverRuntimeManifests } from '@taowind/reality-one-gateway';

export { RCL_BYTECODE_VERSION, RCL_LANGUAGE_VERSION, FOUNDATION_CONTRACT_FORMAT, FOUNDATION_CONTRACT_VERSION, FOUNDATION_MANIFEST_ROOT, foundationContractSummary };

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = path.dirname(HERE);
export const RCL_ROOT = path.join(PACKAGE_ROOT, 'rcl');
export const RCL_SPATIAL_COMMAND_PLAN_FORMAT = 'rncs.rcl-spatial-command-plan.v0.1';
export const RCL_SPATIAL_COMMAND_PLAN_VERSION = '0.1.0';

export const CONTROL_PLANE_EDGES = Object.freeze([
  ['core', 'rfe'],
  ['rfe', 'aaf'],
  ['aaf', 'branch'],
  ['branch', 'behavior'],
  ['behavior', 'icar'],
  ['icar', 'cnp'],
  ['core', 'laf'],
  ['cnp', 'hnac'],
  ['laf', 'runtime_registry'],
  ['runtime_registry', 'gateway'],
  ['gateway', 'aether_earth'],
]);

export const LEGACY_MODULES = Object.freeze({
  core: { id: 'rncs-core', version: '0.1.0', manifest: 'packages/kernel/rncs-core-contract/rncs.module.json' },
  rfe: { id: 'rfe-sdk', version: '0.1.0', manifest: 'packages/kernel/rfe-core-sdk/rncs.module.json' },
  aaf: { id: 'aaf', version: '0.1.0', manifest: 'packages/control/agent-authority-fabric/rncs.module.json' },
  branch: { id: 'rbf', version: '0.2.0-alpha.1', manifest: 'packages/control/reality-branch-fabric/rncs.module.json' },
  behavior: { id: 'behavior', version: '0.1.0-alpha.1', manifest: 'packages/control/reality-behavior-fabric/rncs.module.json' },
  icar: { id: 'icar', version: '0.5.0', manifest: 'packages/control/icar-native-envelope-runtime/rncs.module.json' },
  cnp: { id: 'cnp', version: '0.1.0', manifest: 'packages/control/capability-negotiation-protocol/rncs.module.json' },
  laf: { id: 'laf', version: '1.0.0', manifest: 'packages/kernel/living-artifact-format/rncs.module.json' },
  hnac: { id: '@taowind/hnaf-hnac-host', version: '0.8.0', manifest: 'packages/host/hnaf-hnac/package.json', idField: 'name' },
  runtime_registry: { id: 'reality-one.runtime-registry', version: '0.3.0', manifestDir: 'packages/control/reality-one-gateway/runtimes', idField: 'format', idTransform: 'registry-format', versionField: 'gateway_protocol' },
  gateway: { id: 'gateway', version: '0.3.1-unified.1', manifest: 'packages/control/reality-one-gateway/rncs.module.json' },
  aether_earth: { id: 'aether-earth-runtime', version: '0.1.0-alpha.1', manifest: 'packages/world/aether-earth-runtime/rncs.module.json' },
});

export function readRclModule(name, options = {}) {
  const source = fs.readFileSync(path.join(RCL_ROOT, `${name}.rcl`), 'utf8').trim();
  if (!options.interfaceOnly) return source;
  return source.split(/\r?\n/).filter(line => !/^import\s|^require\s/.test(line.trim())).join('\n');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function selectNamespace(state, namespace) {
  const prefix = `${namespace}::`;
  return Object.fromEntries(Object.entries(state).filter(([key]) => key.startsWith(prefix)));
}

export async function compileRclSource(source, options = {}) {
  if (typeof source !== 'string' || source.trim().length === 0) throw new TypeError('RCL source must be a non-empty string');
  const timeout = options.timeout ?? 30_000;
  const bytecode = Buffer.from(compileSourceSelfHosted(source, { timeout }));
  const referenceBytecode = Buffer.from(compileRealityToBytecode(source));
  const compilerParity = bytecode.equals(referenceBytecode);
  if (!compilerParity) {
    throw Object.assign(new Error('RCL_SELFHOST_BYTECODE_MISMATCH'), {
      code: 'RCL_SELFHOST_BYTECODE_MISMATCH',
      details: {
        native_hash: sha256(bytecode),
        reference_hash: sha256(referenceBytecode),
        native_length: bytecode.length,
        reference_length: referenceBytecode.length,
      },
    });
  }
  const decoded = decodeBytecode(bytecode);
  const native = runNativeBytecode(bytecode, { timeout });
  if (native.stateRootVerified !== true || typeof native.nativeStateRoot !== 'string') {
    throw Object.assign(new Error('RCL_NATIVE_AUTHORITY_STATE_ROOT_REQUIRED'), {
      code: 'RCL_NATIVE_AUTHORITY_STATE_ROOT_REQUIRED',
      details: { stateRoot: native.stateRoot ?? null, nativeStateRoot: native.nativeStateRoot ?? null },
    });
  }
  const parity = options.verifyParity === false
    ? null
    : await verifyNativeParity(source, { nativeRuntime: { timeout } });
  const execution = {
    format: 'rncs.rcl-native-execution.v0.2',
    foundationContract: foundationContractSummary(),
    languageVersion: RCL_LANGUAGE_VERSION,
    bytecodeVersion: RCL_BYTECODE_VERSION,
    bytecodeHash: sha256(bytecode),
    byteLength: bytecode.length,
    instructionCount: decoded.instructions.length,
    compiler: {
      kind: 'rcl-native-selfhost',
      artifact: 'selfhost/compiler.rbc',
      artifactHash: sha256(fs.readFileSync(DEFAULT_GENERAL_SELFHOST_COMPILER_ARTIFACT_PATH)),
    },
    compilerParity: {
      ok: compilerParity,
      reference: 'rcl-js-bootstrap',
      referenceBytecodeHash: sha256(referenceBytecode),
    },
    native: {
      program: native.program,
      sourceRoot: native.sourceRoot,
      stateRootAlgorithm: native.stateRootAlgorithm,
      state: native.state,
      stateRoot: native.stateRoot,
      nativeStateRoot: native.nativeStateRoot,
      stateRootVerified: native.stateRootVerified,
      projections: native.projections,
      history: native.history,
    },
    parity: parity ? { ok: parity.ok, checks: parity.parity } : null,
  };
  const authorityEvidence = collectRclNativeAuthorityEvidence(execution, options);
  execution.authorityEvidence = authorityEvidence;
  execution.native.authorityEvidence = authorityEvidence;
  return execution;
}

function createRclTypedCandidate(link) {
  const packageLockRoot = link.package?.lock_root ?? null;
  const source = {
    language: 'RCL',
    source_root: link.source.source_root,
    type_module_root: link.type_modules.ir_root,
    program_root: link.program.program_root,
  };
  const roots = {
    typed_link_root: link.link_root,
    type_module_root: link.type_modules.ir_root,
    program_root: link.program.program_root,
    bytecode_root: link.bytecode.sha256,
    reference_semantic_state_root: link.execution.reference.semantic_state_root,
    native_semantic_state_root: link.execution.native.semantic_state_root,
    native_state_root: link.execution.native.native_state_root,
  };
  if (packageLockRoot !== null) {
    source.package_lock_root = packageLockRoot;
    roots.package_lock_root = packageLockRoot;
  }
  const base = {
    format: 'rncs.rcl-typed-native-candidate.v0.1',
    version: '0.1.0',
    status: link.status,
    source,
    typed_link: link,
    roots,
    authority: {
      candidate_only: true,
      canonical_write_authorized: false,
      commit_requires_explicit_rncs_authority: true,
      native_authority_plan: 'NOT_COMPILED_BY_TYPED_LINK',
    },
    boundary: 'RNCS control-plane typed candidate only: the existing typed compiler/native VM is root-bound for candidate execution; native authority-plan compilation and canonical commit remain separate and explicit.',
  };
  return { ...base, candidate_root: rclJsonRoot(base) };
}

function throwTypedCandidateFailure(typed) {
  if (!typed.ok) {
    const first = typed.diagnostics?.[0] ?? { code: 'RCL_TYPED_CANDIDATE_COMPILATION_FAILURE', message: 'Typed candidate compilation failed' };
    throw Object.assign(new Error(first.message), { code: first.code, details: { diagnostics: typed.diagnostics ?? [] } });
  }
  return createRclTypedCandidate(typed.receipt);
}

export async function compileRclTypedCandidate(source, options = {}) {
  return throwTypedCandidateFailure(await compileTypedNativeLink(source, options));
}

export async function compileRclTypedCandidateFromPackage(packageDir, options = {}) {
  return throwTypedCandidateFailure(await compileTypedNativeLinkFromPackage(packageDir, options));
}

export function verifyRclTypedCandidate(candidate, options = {}) {
  const errors = [];
  if (!candidate || typeof candidate !== 'object') return { ok: false, errors: ['RCL_TYPED_CANDIDATE_REQUIRED'] };
  const rootless = { ...candidate };
  delete rootless.candidate_root;
  if (candidate.candidate_root !== rclJsonRoot(rootless)) errors.push('RCL_TYPED_CANDIDATE_ROOT_MISMATCH');
  if (candidate.format !== 'rncs.rcl-typed-native-candidate.v0.1') errors.push('RCL_TYPED_CANDIDATE_FORMAT_INVALID');
  if (candidate.status !== 'CANDIDATE_EXECUTION_VERIFIED') errors.push('RCL_TYPED_CANDIDATE_STATUS_INVALID');
  if (candidate.authority?.candidate_only !== true) errors.push('RCL_TYPED_CANDIDATE_ONLY_REQUIRED');
  if (candidate.authority?.canonical_write_authorized !== false) errors.push('RCL_TYPED_CANDIDATE_CANONICAL_WRITE_FORBIDDEN');
  if (candidate.authority?.commit_requires_explicit_rncs_authority !== true) errors.push('RCL_TYPED_CANDIDATE_COMMIT_GATE_REQUIRED');
  if (candidate.roots?.typed_link_root !== candidate.typed_link?.link_root) errors.push('RCL_TYPED_CANDIDATE_TYPED_LINK_ROOT_MISMATCH');
  if (candidate.source?.package_lock_root !== undefined && candidate.source.package_lock_root !== candidate.typed_link?.package?.lock_root) errors.push('RCL_TYPED_CANDIDATE_PACKAGE_ROOT_MISMATCH');
  if (candidate.roots?.package_lock_root !== undefined && candidate.roots.package_lock_root !== candidate.typed_link?.package?.lock_root) errors.push('RCL_TYPED_CANDIDATE_PACKAGE_ROOT_MISMATCH');
  const typed = verifyTypedNativeLink(candidate.typed_link, options);
  if (!typed.ok) errors.push(...typed.errors);
  return { ok: errors.length === 0, errors };
}

export function replayRclTypedCandidate(candidate, bytecodeOrPath, options = {}) {
  const candidateVerification = verifyRclTypedCandidate(candidate, options);
  if (!candidateVerification.ok) return { ok: false, diagnostics: candidateVerification.errors.map(code => ({ code, message: code, severity: 'error' })), replay: null };
  const typedReplay = replayTypedNativeLink(candidate.typed_link, bytecodeOrPath, options);
  if (!typedReplay.ok) return { ok: false, diagnostics: typedReplay.diagnostics ?? [], replay: null };
  const base = {
    format: 'rncs.rcl-typed-native-replay.v0.1',
    version: '0.1.0',
    status: typedReplay.replay.status,
    candidate_root: candidate.candidate_root,
    typed_link_root: candidate.typed_link.link_root,
    replay: typedReplay.replay,
    authority: {
      candidate_only: true,
      canonical_write_authorized: false,
      commit_requires_explicit_rncs_authority: true,
      replay_only: true,
    },
    boundary: 'RNCS replay admission only: the sealed typed link is re-consumed by the native VM and its roots are compared; native authority-plan compilation, canonical mutation and promotion remain separate.',
  };
  return { ok: true, ...base, replay_root: rclJsonRoot(base) };
}

export function verifyRclTypedReplay(replay, options = {}) {
  const errors = [];
  if (!replay || typeof replay !== 'object') return { ok: false, errors: ['RCL_TYPED_REPLAY_REQUIRED'] };
  const rootless = { ...replay };
  delete rootless.replay_root;
  delete rootless.ok;
  if (replay.replay_root !== rclJsonRoot(rootless)) errors.push('RCL_TYPED_REPLAY_ROOT_MISMATCH');
  if (replay.format !== 'rncs.rcl-typed-native-replay.v0.1') errors.push('RCL_TYPED_REPLAY_FORMAT_INVALID');
  if (replay.status !== 'CANDIDATE_REPLAY_VERIFIED') errors.push('RCL_TYPED_REPLAY_STATUS_INVALID');
  if (replay.authority?.candidate_only !== true) errors.push('RCL_TYPED_REPLAY_CANDIDATE_ONLY_REQUIRED');
  if (replay.authority?.canonical_write_authorized !== false) errors.push('RCL_TYPED_REPLAY_CANONICAL_WRITE_FORBIDDEN');
  if (replay.authority?.replay_only !== true) errors.push('RCL_TYPED_REPLAY_ONLY_REQUIRED');
  if (options.candidateRoot !== undefined && replay.candidate_root !== options.candidateRoot) errors.push('RCL_TYPED_REPLAY_CANDIDATE_ROOT_MISMATCH');
  if (replay.typed_link_root !== replay.replay?.link_root) errors.push('RCL_TYPED_REPLAY_TYPED_LINK_ROOT_MISMATCH');
  const replayPayload = { ...replay.replay };
  delete replayPayload.replay_root;
  if (replay.replay?.replay_root !== realityRoot(replayPayload)) errors.push('RCL_TYPED_REPLAY_PAYLOAD_ROOT_MISMATCH');
  return { ok: errors.length === 0, errors };
}

const RCL_RNCS_WORLD_PREFIX = 'rncs.world.';
const RCL_RNCS_OBJECT_PREFIX = 'rncs.world.object.';
const RCL_RNCS_BEHAVIOR_PREFIX = 'rncs.world.behavior.';
const RCL_RNCS_CHANGE_PREFIX = 'rncs.world.change.';
const RCL_RNCS_SPATIAL_COMMAND_PREFIX = 'rncs.spatial.command.';
const RCL_RNCS_CHANGE_OPS = new Set(['set', 'remove', 'append', 'increment', 'merge']);
const RCL_RNCS_FORBIDDEN_PATH = /(^|\.)(authority|generation|revision|state_root|evidence_root)(\.|$)/i;
const RCL_RNCS_ALIAS = /^[A-Za-z0-9_-]+$/;
const RCL_SPATIAL_COMMAND_MAX = 256;
const RCL_SPATIAL_PATCH_SAMPLE_MAX = 4096;

function isJsonValue(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (value && typeof value === 'object') return Object.values(value).every(isJsonValue);
  return false;
}

function setNestedValue(target, parts, value, pathName) {
  let cursor = target;
  for (const part of parts.slice(0, -1)) {
    if (!RCL_RNCS_ALIAS.test(part) || RCL_RNCS_FORBIDDEN_PATH.test(part)) {
      throw new Error(`RCL_RNCS_ENTITY_PATH_FORBIDDEN:${pathName}`);
    }
    if (cursor[part] === undefined) cursor[part] = {};
    if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
      throw new Error(`RCL_RNCS_ENTITY_PATH_CONFLICT:${pathName}`);
    }
    cursor = cursor[part];
  }
  const leaf = parts.at(-1);
  if (!leaf || !RCL_RNCS_ALIAS.test(leaf) || RCL_RNCS_FORBIDDEN_PATH.test(leaf)) {
    throw new Error(`RCL_RNCS_ENTITY_PATH_FORBIDDEN:${pathName}`);
  }
  if (Object.prototype.hasOwnProperty.call(cursor, leaf)) {
    throw new Error(`RCL_RNCS_ENTITY_FIELD_DUPLICATE:${pathName}`);
  }
  cursor[leaf] = value;
}

function collectRclEntities(state, prefix, kind) {
  const groups = new Map();
  for (const [key, value] of Object.entries(state ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (!key.startsWith(prefix)) continue;
    const suffix = key.slice(prefix.length);
    const [alias, ...fieldParts] = suffix.split('.');
    if (!alias || !fieldParts.length || !RCL_RNCS_ALIAS.test(alias)) {
      throw new Error(`RCL_RNCS_ENTITY_DECLARATION_INVALID:${key}`);
    }
    const normalized = normalizeRclAuthorityValue(value);
    if (!isJsonValue(normalized)) throw new TypeError(`RCL_RNCS_ENTITY_VALUE_NOT_JSON:${key}`);
    const entity = groups.get(alias) ?? {};
    setNestedValue(entity, fieldParts, normalized, key);
    groups.set(alias, entity);
  }
  const entities = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, entity]) => entity);
  if (kind === 'object') {
    for (const entity of entities) {
      if (typeof entity.id !== 'string' || !entity.id.trim()) throw new Error('RCL_RNCS_OBJECT_ID_REQUIRED');
      if (typeof entity.kind !== 'string' || !entity.kind.trim()) throw new Error(`RCL_RNCS_OBJECT_KIND_REQUIRED:${entity.id}`);
    }
    return entities.map(entity => ({...entity, id: entity.id.trim(), kind: entity.kind.trim()}));
  }
  for (const entity of entities) {
    const behaviorId = entity.behavior_id ?? entity.id;
    if (typeof behaviorId !== 'string' || !behaviorId.trim()) throw new Error('RCL_RNCS_BEHAVIOR_ID_REQUIRED');
    if (typeof entity.version !== 'string' || !entity.version.trim()) throw new Error(`RCL_RNCS_BEHAVIOR_VERSION_REQUIRED:${behaviorId}`);
  }
  return entities.map(entity => ({...entity, behavior_id: (entity.behavior_id ?? entity.id).trim(), version: entity.version.trim()}));
}

function validateRclWorldPath(pathName, key) {
  if (typeof pathName !== 'string' || !/^world(?:\.[A-Za-z0-9_-]+)+$/.test(pathName) || RCL_RNCS_FORBIDDEN_PATH.test(pathName)) {
    throw new Error(`RCL_RNCS_CHANGE_PATH_FORBIDDEN:${key}`);
  }
  return pathName;
}

function collectRclChanges(state) {
  const groups = new Map();
  for (const [key, value] of Object.entries(state ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (!key.startsWith(RCL_RNCS_CHANGE_PREFIX)) continue;
    const suffix = key.slice(RCL_RNCS_CHANGE_PREFIX.length);
    const [alias, ...fieldParts] = suffix.split('.');
    if (!alias || !fieldParts.length || !RCL_RNCS_ALIAS.test(alias)) {
      throw new Error(`RCL_RNCS_CHANGE_DECLARATION_INVALID:${key}`);
    }
    const normalized = normalizeRclAuthorityValue(value);
    if (!isJsonValue(normalized)) throw new TypeError(`RCL_RNCS_CHANGE_VALUE_NOT_JSON:${key}`);
    const change = groups.get(alias) ?? {};
    setNestedValue(change, fieldParts, normalized, key);
    groups.set(alias, change);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([alias, change]) => {
    if (!RCL_RNCS_CHANGE_OPS.has(change.op)) throw new Error(`RCL_RNCS_CHANGE_OP_INVALID:${alias}`);
    const pathName = validateRclWorldPath(change.path, `rncs.world.change.${alias}.path`);
    const operation = {op: change.op, path: pathName, operation_id: `rcl-change:${alias}`};
    if (change.op !== 'remove' && !Object.prototype.hasOwnProperty.call(change, 'value')) {
      throw new Error(`RCL_RNCS_CHANGE_VALUE_REQUIRED:${alias}`);
    }
    if (Object.prototype.hasOwnProperty.call(change, 'value')) operation.value = change.value;
    if (change.preconditions !== undefined) {
      if (!Array.isArray(change.preconditions) || !isJsonValue(change.preconditions)) throw new Error(`RCL_RNCS_CHANGE_PRECONDITIONS_INVALID:${alias}`);
      operation.preconditions = change.preconditions;
    }
    return operation;
  });
}

const RCL_INTERNAL_METADATA_KEYS = new Set(['__rclKind', '__rclType', '__rclObjectId', '__rclFieldOffsets']);

function normalizeRclAuthorityValue(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('RCL_RNCS_DOMAIN_NUMBER_NOT_FINITE');
    return Number.isSafeInteger(value) ? value : String(value);
  }
  if (Array.isArray(value)) return value.map(normalizeRclAuthorityValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !RCL_INTERNAL_METADATA_KEYS.has(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, nested]) => [key, normalizeRclAuthorityValue(nested)]));
}

function collectRclDomainState(state) {
  const domainState = {};
  for (const [key, value] of Object.entries(state ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (key.startsWith(RCL_RNCS_WORLD_PREFIX) || key.startsWith('world.')) continue;
    const normalized = normalizeRclAuthorityValue(value);
    if (!isJsonValue(normalized)) throw new TypeError(`RCL_RNCS_DOMAIN_VALUE_NOT_JSON:${key}`);
    domainState[key] = normalized;
  }
  return domainState;
}

function rclJsonRoot(value) {
  return sha256(Buffer.from(JSON.stringify(value), 'utf8'));
}

export const RCL_PHYSICAL_COMMAND_PROFILE_FORMAT = 'rcl.physical-command-profile.v0.1';
export const RCL_PHYSICAL_COMMAND_PROFILE_VERSION = '0.1.0';

const RCL_PHYSICAL_COMMAND_PROFILE_PAYLOAD = {
  format: RCL_PHYSICAL_COMMAND_PROFILE_FORMAT,
  version: RCL_PHYSICAL_COMMAND_PROFILE_VERSION,
  profile_id: 'rcl.physical.spatial.v0.1',
  domain: 'spatial',
  candidate_only: true,
  temporal_encoding: 'integer-tick',
  spatial_encoding: 'integer-fixed-point',
  command_families: [
    { id: 'world-editing', command_types: ['patch-heightfield'] },
    { id: 'destructible-surface', command_types: ['patch-heightfield'] },
    { id: 'correction-replay', command_types: ['set-velocity'] },
  ],
  command_types: [
    { type: 'patch-heightfield', root_bound: true, candidate_only: true, required_fields: ['id', 'tick', 'body_id', 'fixture_id', 'indices', 'heights'] },
    { type: 'set-velocity', root_bound: true, candidate_only: true, required_fields: ['id', 'tick', 'body_id', 'velocity_x', 'velocity_y', 'velocity_z'] },
  ],
  limits: { max_commands: RCL_SPATIAL_COMMAND_MAX, max_samples: RCL_SPATIAL_PATCH_SAMPLE_MAX },
};

export const RCL_PHYSICAL_COMMAND_PROFILE = Object.freeze({
  ...RCL_PHYSICAL_COMMAND_PROFILE_PAYLOAD,
  root: rclJsonRoot(RCL_PHYSICAL_COMMAND_PROFILE_PAYLOAD),
});
export const RCL_PHYSICAL_COMMAND_PROFILE_ROOT = RCL_PHYSICAL_COMMAND_PROFILE.root;

export function rclPhysicalCommandProfileRoot(profile = RCL_PHYSICAL_COMMAND_PROFILE) {
  const payload = { ...profile };
  delete payload.root;
  return rclJsonRoot(payload);
}

export function assertRclPhysicalCommandProfile(profile) {
  if (!profile || profile.format !== RCL_PHYSICAL_COMMAND_PROFILE_FORMAT || profile.version !== RCL_PHYSICAL_COMMAND_PROFILE_VERSION) throw new Error('RCL_PHYSICAL_COMMAND_PROFILE_FORMAT_INVALID');
  if (profile.root !== rclPhysicalCommandProfileRoot(profile)) throw new Error('RCL_PHYSICAL_COMMAND_PROFILE_ROOT_MISMATCH');
  if (profile.profile_id !== RCL_PHYSICAL_COMMAND_PROFILE.profile_id || profile.domain !== 'spatial' || profile.candidate_only !== true) throw new Error('RCL_PHYSICAL_COMMAND_PROFILE_IDENTITY_INVALID');
  if (JSON.stringify(profile.command_families) !== JSON.stringify(RCL_PHYSICAL_COMMAND_PROFILE.command_families)) throw new Error('RCL_PHYSICAL_COMMAND_PROFILE_FAMILIES_INVALID');
  if (JSON.stringify(profile.command_types) !== JSON.stringify(RCL_PHYSICAL_COMMAND_PROFILE.command_types)) throw new Error('RCL_PHYSICAL_COMMAND_PROFILE_COMMAND_TYPES_INVALID');
  if (JSON.stringify(profile.limits) !== JSON.stringify(RCL_PHYSICAL_COMMAND_PROFILE.limits)) throw new Error('RCL_PHYSICAL_COMMAND_PROFILE_LIMITS_INVALID');
  return profile;
}

export function verifyRclPhysicalCommandProfile(profile) {
  try {
    assertRclPhysicalCommandProfile(profile);
    return true;
  } catch {
    return false;
  }
}

function spatialCommandPlanPayload(commands) {
  return {
    format: RCL_SPATIAL_COMMAND_PLAN_FORMAT,
    version: RCL_SPATIAL_COMMAND_PLAN_VERSION,
    commands,
  };
}

export function rclSpatialCommandPlanRoot(commands) {
  return rclJsonRoot(spatialCommandPlanPayload(commands));
}

function requireSpatialText(value, code) {
  if (typeof value !== 'string' || value.trim().length === 0 || value !== value.trim()) throw new Error(code);
  return value;
}

function requireSpatialSafeInteger(value, code, minimum = null) {
  if (!Number.isSafeInteger(value) || (minimum !== null && value < minimum)) throw new Error(code);
  return value;
}

function normalizeRclSpatialCommandDeclaration(command, alias) {
  if (!command || typeof command !== 'object' || Array.isArray(command)) throw new Error(`RCL_RNCS_SPATIAL_COMMAND_INVALID:${alias}`);
  const id = requireSpatialText(command.id, `RCL_RNCS_SPATIAL_COMMAND_ID_REQUIRED:${alias}`);
  const type = requireSpatialText(command.type, `RCL_RNCS_SPATIAL_COMMAND_TYPE_REQUIRED:${alias}`);
  const tick = requireSpatialSafeInteger(command.tick, `RCL_RNCS_SPATIAL_COMMAND_TICK_INVALID:${alias}`, 1);
  const bodyId = requireSpatialText(command.body_id, `RCL_RNCS_SPATIAL_COMMAND_BODY_REQUIRED:${alias}`);
  if (type === 'patch-heightfield') {
    const allowed = new Set(['id', 'type', 'tick', 'body_id', 'fixture_id', 'indices', 'heights', 'expected_heightfield_root']);
    for (const key of Object.keys(command)) if (!allowed.has(key)) throw new Error(`RCL_RNCS_SPATIAL_COMMAND_FIELD_UNSUPPORTED:${alias}:${key}`);
    const fixtureId = requireSpatialText(command.fixture_id, `RCL_RNCS_SPATIAL_COMMAND_FIXTURE_REQUIRED:${alias}`);
    if (!Array.isArray(command.indices) || !Array.isArray(command.heights) || command.indices.length === 0 || command.indices.length !== command.heights.length || command.indices.length > RCL_SPATIAL_PATCH_SAMPLE_MAX) {
      throw new Error(`RCL_RNCS_SPATIAL_COMMAND_SAMPLES_INVALID:${alias}`);
    }
    const samples = command.indices.map((index, sampleIndex) => ({
      index: requireSpatialSafeInteger(index, `RCL_RNCS_SPATIAL_COMMAND_INDEX_INVALID:${alias}:${sampleIndex}`, 0),
      height: requireSpatialSafeInteger(command.heights[sampleIndex], `RCL_RNCS_SPATIAL_COMMAND_HEIGHT_INVALID:${alias}:${sampleIndex}`),
    })).sort((left, right) => left.index - right.index);
    for (let index = 1; index < samples.length; index += 1) {
      if (samples[index].index === samples[index - 1].index) throw new Error(`RCL_RNCS_SPATIAL_COMMAND_INDEX_DUPLICATE:${alias}:${samples[index].index}`);
    }
    const normalized = { id, tick, type, bodyId, fixtureId, samples };
    if (command.expected_heightfield_root !== undefined) normalized.expectedHeightfieldRoot = requireSpatialText(command.expected_heightfield_root, `RCL_RNCS_SPATIAL_COMMAND_EXPECTED_ROOT_INVALID:${alias}`);
    return normalized;
  }
  if (type === 'set-velocity') {
    const allowed = new Set(['id', 'type', 'tick', 'body_id', 'velocity_x', 'velocity_y', 'velocity_z']);
    for (const key of Object.keys(command)) if (!allowed.has(key)) throw new Error(`RCL_RNCS_SPATIAL_COMMAND_FIELD_UNSUPPORTED:${alias}:${key}`);
    const velocity = {
      x: requireSpatialSafeInteger(command.velocity_x, `RCL_RNCS_SPATIAL_COMMAND_VELOCITY_X_INVALID:${alias}`),
      y: requireSpatialSafeInteger(command.velocity_y, `RCL_RNCS_SPATIAL_COMMAND_VELOCITY_Y_INVALID:${alias}`),
      z: requireSpatialSafeInteger(command.velocity_z, `RCL_RNCS_SPATIAL_COMMAND_VELOCITY_Z_INVALID:${alias}`),
    };
    return { id, tick, type, bodyId, velocity };
  }
  throw new Error(`RCL_RNCS_SPATIAL_COMMAND_TYPE_UNSUPPORTED:${type}`);
}

function validateRclSpatialCommand(command) {
  if (!command || typeof command !== 'object' || Array.isArray(command)) throw new Error('RCL_SPATIAL_COMMAND_PLAN_COMMAND_INVALID');
  const id = requireSpatialText(command.id, 'RCL_SPATIAL_COMMAND_PLAN_ID_REQUIRED');
  const type = requireSpatialText(command.type, 'RCL_SPATIAL_COMMAND_PLAN_TYPE_REQUIRED');
  const tick = requireSpatialSafeInteger(command.tick, 'RCL_SPATIAL_COMMAND_PLAN_TICK_INVALID', 1);
  const bodyId = requireSpatialText(command.bodyId, 'RCL_SPATIAL_COMMAND_PLAN_BODY_REQUIRED');
  let normalized;
  if (type === 'patch-heightfield') {
    const fixtureId = requireSpatialText(command.fixtureId, 'RCL_SPATIAL_COMMAND_PLAN_FIXTURE_REQUIRED');
    if (!Array.isArray(command.samples) || command.samples.length === 0 || command.samples.length > RCL_SPATIAL_PATCH_SAMPLE_MAX) throw new Error('RCL_SPATIAL_COMMAND_PLAN_SAMPLES_INVALID');
    let previous = -1;
    const samples = command.samples.map(sample => {
      if (!sample || !Number.isSafeInteger(sample.index) || sample.index < 0 || sample.index <= previous || !Number.isSafeInteger(sample.height)) throw new Error('RCL_SPATIAL_COMMAND_PLAN_SAMPLE_INVALID');
      previous = sample.index;
      return { index: sample.index, height: sample.height };
    });
    normalized = { id, tick, type, bodyId, fixtureId, samples };
    if (command.expectedHeightfieldRoot !== undefined) normalized.expectedHeightfieldRoot = requireSpatialText(command.expectedHeightfieldRoot, 'RCL_SPATIAL_COMMAND_PLAN_EXPECTED_ROOT_INVALID');
  } else if (type === 'set-velocity') {
    const allowed = new Set(['id', 'tick', 'type', 'bodyId', 'velocity']);
    for (const key of Object.keys(command)) if (!allowed.has(key)) throw new Error(`RCL_SPATIAL_COMMAND_PLAN_FIELD_UNSUPPORTED:${key}`);
    const velocity = command.velocity;
    if (!velocity || typeof velocity !== 'object' || Array.isArray(velocity) || !Number.isSafeInteger(velocity.x) || !Number.isSafeInteger(velocity.y) || !Number.isSafeInteger(velocity.z)) throw new Error('RCL_SPATIAL_COMMAND_PLAN_VELOCITY_INVALID');
    normalized = { id, tick, type, bodyId, velocity: { x: velocity.x, y: velocity.y, z: velocity.z } };
  } else {
    throw new Error(`RCL_SPATIAL_COMMAND_PLAN_TYPE_UNSUPPORTED:${type}`);
  }
  if (JSON.stringify(normalized) !== JSON.stringify(command)) throw new Error('RCL_SPATIAL_COMMAND_PLAN_NON_CANONICAL');
  return normalized;
}

export function assertRclSpatialCommandPlan(commandPlan) {
  if (!commandPlan || commandPlan.format !== RCL_SPATIAL_COMMAND_PLAN_FORMAT || commandPlan.version !== RCL_SPATIAL_COMMAND_PLAN_VERSION) throw new Error('RCL_SPATIAL_COMMAND_PLAN_FORMAT_INVALID');
  if (!Array.isArray(commandPlan.commands) || commandPlan.commands.length === 0 || commandPlan.commands.length > RCL_SPATIAL_COMMAND_MAX) throw new Error('RCL_SPATIAL_COMMAND_PLAN_COMMANDS_INVALID');
  const ids = new Set();
  const commands = commandPlan.commands.map(command => {
    const normalized = validateRclSpatialCommand(command);
    if (ids.has(normalized.id)) throw new Error(`RCL_SPATIAL_COMMAND_PLAN_ID_DUPLICATE:${normalized.id}`);
    ids.add(normalized.id);
    return normalized;
  });
  if (commandPlan.root !== rclSpatialCommandPlanRoot(commands)) throw new Error('RCL_SPATIAL_COMMAND_PLAN_ROOT_MISMATCH');
  return commandPlan;
}

export function verifyRclSpatialCommandPlan(commandPlan) {
  try {
    assertRclSpatialCommandPlan(commandPlan);
    return true;
  } catch {
    return false;
  }
}

function collectRclSpatialCommandPlan(state) {
  const groups = new Map();
  for (const [key, value] of Object.entries(state ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (!key.startsWith(RCL_RNCS_SPATIAL_COMMAND_PREFIX)) continue;
    const suffix = key.slice(RCL_RNCS_SPATIAL_COMMAND_PREFIX.length);
    const [alias, ...fieldParts] = suffix.split('.');
    if (!alias || !fieldParts.length || !RCL_RNCS_ALIAS.test(alias)) throw new Error(`RCL_RNCS_SPATIAL_COMMAND_DECLARATION_INVALID:${key}`);
    const normalized = normalizeRclAuthorityValue(value);
    if (!isJsonValue(normalized)) throw new TypeError(`RCL_RNCS_SPATIAL_COMMAND_VALUE_NOT_JSON:${key}`);
    const command = groups.get(alias) ?? {};
    setNestedValue(command, fieldParts, normalized, key);
    groups.set(alias, command);
  }
  const commands = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([alias, command]) => normalizeRclSpatialCommandDeclaration(command, alias));
  if (!commands.length) return null;
  const plan = spatialCommandPlanPayload(commands);
  return { ...plan, root: rclSpatialCommandPlanRoot(commands) };
}

function normalizeRclAuthorityEvidenceValue(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : String(value);
  if (Array.isArray(value)) return value.map(normalizeRclAuthorityEvidenceValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeRclAuthorityEvidenceValue(entry)]));
  }
  return value;
}

function collectRclNativeAuthorityEvidence(execution, options = {}) {
  const transitions = (execution.native?.history ?? []).filter(record => record?.status === 'realized');
  if (!transitions.length) return null;
  const program = {
    name: execution.native?.program ?? 'RCLNativeAuthority',
    programRoot: execution.bytecodeHash,
    languageVersion: execution.languageVersion ?? RCL_LANGUAGE_VERSION,
  };
  const proposals = transitions.map((transition, index) => ({
    sequence: index + 1,
    ...toRncsProposalInput(program, transition, {
      realityId: `rcl:${program.name}`,
      baseGeneration: options.baselineGeneration ?? 0,
      baseGenerationRoot: options.baselineGenerationRoot ?? '0'.repeat(64),
      subjectId: options.subjectId ?? 'rcl:system',
      roles: options.roles ?? ['reality-program-actor'],
    }),
  })).map(normalizeRclAuthorityEvidenceValue);
  const evidence = normalizeRclAuthorityEvidenceValue({
    format: 'rcl.native-authority-evidence.v0.1',
    program,
    state_root: execution.native.nativeStateRoot ?? execution.native.stateRoot,
    state_root_algorithm: execution.native.stateRootAlgorithm ?? 'rcl.semantic-state-root.v1',
    raw_transition_count: transitions.length,
    transitions: proposals,
  });
  return { ...evidence, root: rclJsonRoot(evidence) };
}

function collectRclKnowledgeGraph(domainState) {
  const claimEntries = Object.entries(domainState)
    .filter(([, value]) => value && typeof value === 'object' && value.kind === 'Knowledge')
    .sort(([a], [b]) => a.localeCompare(b));
  if (!claimEntries.length) return null;

  const claims = claimEntries.map(([pathName, value]) => {
    const claim = {
      path: pathName,
      base_type: value.baseType,
      value: value.value,
      confidence: value.confidence,
      status: value.status,
      source: value.source,
      scope: value.scope,
      evidence: [...(value.evidence ?? [])],
      dependencies: [...(value.dependencies ?? [])],
      revision: value.revision,
      alternatives: value.alternatives ?? [],
      formed_at_root: value.formedAtRoot ?? null,
    };
    return { ...claim, claim_root: rclJsonRoot(claim) };
  });
  const claimPaths = new Set(claims.map(claim => claim.path));
  const evidenceReferences = new Map();
  for (const claim of claims) {
    for (const reference of claim.evidence) {
      const entry = evidenceReferences.get(reference) ?? { reference, claims: [] };
      entry.claims.push(claim.path);
      evidenceReferences.set(reference, entry);
    }
  }
  const evidenceNodes = [...evidenceReferences.values()]
    .sort((a, b) => a.reference.localeCompare(b.reference))
    .map(entry => ({
      id: `rcl:evidence:${rclJsonRoot(entry.reference).slice(0, 24)}`,
      kind: 'rcl-evidence-reference',
      reference: entry.reference,
      claims: [...entry.claims].sort(),
    }));
  const dependencyEdges = claims.flatMap(claim => claim.dependencies.map(target => ({
    from: claim.path,
    to: target,
    resolved: claimPaths.has(target),
  }))).sort((a, b) => `${a.from}:${a.to}`.localeCompare(`${b.from}:${b.to}`));
  const graph = {
    format: 'rcl.knowledge-authority-graph.v0.1',
    claims,
    evidence_nodes: evidenceNodes,
    dependency_edges: dependencyEdges,
  };
  return {
    ...graph,
    root: rclJsonRoot(graph),
    unresolved_dependencies: dependencyEdges.filter(edge => !edge.resolved).map(edge => `${edge.from}->${edge.to}`),
  };
}

function rclWorldChanges(state) {
  const changes = [];
  const directStateKeys = [];
  const domainState = collectRclDomainState(state);
  for (const [key, value] of Object.entries(state ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (!key.startsWith(RCL_RNCS_WORLD_PREFIX)) continue;
    if (key.startsWith(RCL_RNCS_OBJECT_PREFIX) || key.startsWith(RCL_RNCS_BEHAVIOR_PREFIX) || key.startsWith(RCL_RNCS_CHANGE_PREFIX)) continue;
    const pathName = `world.${key.slice(RCL_RNCS_WORLD_PREFIX.length)}`;
    if (!pathName.slice('world.'.length) || RCL_RNCS_FORBIDDEN_PATH.test(pathName)) {
      throw new Error(`RCL_RNCS_WORLD_PATH_FORBIDDEN:${pathName}`);
    }
    const normalized = normalizeRclAuthorityValue(value);
    if (!isJsonValue(normalized)) throw new TypeError(`RCL_RNCS_WORLD_VALUE_NOT_JSON:${pathName}`);
    directStateKeys.push(pathName);
    changes.push({op: 'set', path: pathName, value: normalized});
  }
  const objects = collectRclEntities(state, RCL_RNCS_OBJECT_PREFIX, 'object');
  const behaviors = collectRclEntities(state, RCL_RNCS_BEHAVIOR_PREFIX, 'behavior');
  const operations = collectRclChanges(state);
  if (objects.length && directStateKeys.includes('world.objects')) throw new Error('RCL_RNCS_OBJECTS_DECLARATION_CONFLICT');
  if (behaviors.length && directStateKeys.includes('world.behaviors')) throw new Error('RCL_RNCS_BEHAVIORS_DECLARATION_CONFLICT');
  const operationPaths = new Set(operations.map(operation => operation.path));
  for (const pathName of [...directStateKeys, ...(objects.length ? ['world.objects'] : []), ...(behaviors.length ? ['world.behaviors'] : [])]) {
    if (operationPaths.has(pathName)) throw new Error(`RCL_RNCS_CHANGE_CONFLICT:${pathName}`);
  }
  if (objects.length) changes.push({op: 'set', path: 'world.objects', value: objects});
  if (behaviors.length) changes.push({op: 'set', path: 'world.behaviors', value: behaviors});
  if (Object.keys(domainState).length) changes.push({op: 'set', path: 'world.rcl.state', value: domainState});
  changes.push(...operations);
  return {
    changes: changes.sort((a, b) => a.path.localeCompare(b.path)),
    objects,
    behaviors,
    operations,
    domainState,
  };
}

export async function compileRclAuthorityPlan(source, options = {}) {
  const execution = options.execution ?? await compileRclSource(source, options);
  const nativeStateRoot = execution.native?.nativeStateRoot ?? execution.native?.stateRoot;
  if (execution.native?.stateRootVerified !== true || typeof nativeStateRoot !== 'string') {
    throw Object.assign(new Error('RCL_NATIVE_AUTHORITY_STATE_ROOT_REQUIRED'), {
      code: 'RCL_NATIVE_AUTHORITY_STATE_ROOT_REQUIRED',
      details: { stateRoot: execution.native?.stateRoot ?? null, nativeStateRoot: nativeStateRoot ?? null },
    });
  }
  const worldModel = rclWorldChanges(execution.native?.state);
  const spatialCommandPlan = collectRclSpatialCommandPlan(execution.native?.state);
  const physicalCommandProfile = spatialCommandPlan ? RCL_PHYSICAL_COMMAND_PROFILE : null;
  const changes = worldModel.changes;
  if (!changes.length && !spatialCommandPlan) throw new Error('RCL_RNCS_WORLD_CHANGE_REQUIRED');
  const sourceRoot = execution.bytecodeHash;
  const domainStateRoot = Object.keys(worldModel.domainState).length
    ? sha256(Buffer.from(JSON.stringify(worldModel.domainState), 'utf8'))
    : null;
  const knowledgeGraph = collectRclKnowledgeGraph(worldModel.domainState);
  const authorityEvidence = execution.authorityEvidence
    ?? collectRclNativeAuthorityEvidence(execution, options);
  const planId = `plan:rcl:${sourceRoot.slice(0, 24)}`;
  const authorityTransition = [...(authorityEvidence?.transitions ?? [])]
    .reverse()
    .find(transition => transition.capability_plan?.required_scopes?.length)
    ?? authorityEvidence?.transitions?.[0];
  const subjectId = String(options.subjectId ?? authorityTransition?.subject?.subject_id ?? 'subject:rcl-native');
  const baselineGeneration = Number(options.baselineGeneration ?? 0);
  const riskLevel = options.riskLevel ?? 'high';
  const plan = {
    format: 'rncs.compilation-plan.v0.2',
    version: '0.2.0',
    plan_id: planId,
    source: {
      language: 'RCL',
      foundation_contract: foundationContractSummary(),
      version: RCL_LANGUAGE_VERSION,
      text: source,
      source_root: sourceRoot,
      bytecode_hash: execution.bytecodeHash,
      bytecode_version: execution.bytecodeVersion,
      instruction_count: execution.instructionCount,
      compiler: execution.compiler,
      compiler_parity: execution.compilerParity,
      rcl_native_state_root: nativeStateRoot,
      rcl_state_root_algorithm: execution.native?.stateRootAlgorithm ?? null,
      rcl_domain_state_root: domainStateRoot,
      rcl_knowledge_graph_root: knowledgeGraph?.root ?? null,
      rcl_authority_evidence_root: authorityEvidence?.root ?? null,
      rcl_spatial_command_plan_root: spatialCommandPlan?.root ?? null,
      rcl_physical_command_profile_root: physicalCommandProfile?.root ?? null,
    },
    rcl_authority_evidence: authorityEvidence,
    rcl_knowledge_graph: knowledgeGraph,
    subject: {
      subject_id: subjectId,
      roles: options.roles ?? ['rcl-author'],
      responsibility_boundary: 'world-authority',
    },
    artifacts: worldModel.objects.map(object => ({
      id: object.id,
      kind: object.kind,
      name: object.name ?? object.id,
      definition: object,
    })),
    behaviors: worldModel.behaviors,
    candidate_branch: {
      branch_id: `branch:rcl-${sourceRoot.slice(0, 24)}`,
      baseline_generation: baselineGeneration,
      risk_level: riskLevel,
      reason: 'RCL native state transition must be simulated before authority commit',
    },
    authority_requirements: [
      { action: 'create_world_object', scope: 'world.object.create', risk_level: 'medium' },
      ...((worldModel.objects.length || worldModel.operations.some(operation => operation.path === 'world.objects' || operation.path.startsWith('world.objects.'))) ? [{ action: 'modify_object_property', scope: 'world.object.write', risk_level: 'medium' }] : []),
      ...((worldModel.behaviors.length || worldModel.operations.some(operation => operation.path === 'world.behaviors' || operation.path.startsWith('world.behaviors.'))) ? [{ action: 'register_behavior', scope: 'behavior.register', risk_level: 'medium' }] : []),
      ...(domainStateRoot ? [{ action: 'commit_rcl_domain_state', scope: 'world.rcl.write', risk_level: 'medium' }] : []),
      ...(knowledgeGraph ? [{ action: 'commit_rcl_knowledge', scope: 'world.rcl.knowledge.write', risk_level: knowledgeGraph.unresolved_dependencies.length ? 'high' : 'medium' }] : []),
      ...(spatialCommandPlan ? [{ action: 'simulate_spatial_candidate', scope: 'rncs.rsr.simulate', risk_level: 'high' }] : []),
      ...(authorityEvidence ? [{ action: 'authorize_rcl_transition', scope: 'world.rcl.authority', risk_level: 'high' }] : []),
      { action: 'merge_candidate_branch', scope: 'branch.merge', risk_level: riskLevel },
      { action: 'rollback_generation', scope: 'rfe.rollback', risk_level: 'high' },
    ],
    world_state_changes: changes,
    simulation_requirements: [
      { runtime: 'rcl.native', mode: 'native-bytecode-parity' },
      { runtime: 'rncs.rsr', mode: 'candidate-isolated', fixed_step_hz: 60, ...(spatialCommandPlan ? { spatial_command_plan_root: spatialCommandPlan.root, physical_command_profile_root: physicalCommandProfile.root } : {}) },
      { runtime: 'rncs.vsr', mode: 'presentation-only' },
    ],
    projection_targets: ['aetherworld', 'rncs.rsr', 'rncs.vsr'],
    evidence_requirements: [
      { kind: 'rcl-native-selfhost-compiler', root: execution.compiler?.artifactHash },
      { kind: 'rcl-native-bytecode', root: execution.bytecodeHash },
      { kind: 'rcl-native-authority-state', root: nativeStateRoot, verified: true },
      { kind: 'rcl-native-parity', verified: execution.parity?.ok === true },
      ...(domainStateRoot ? [{ kind: 'rcl-native-domain-state', root: domainStateRoot }] : []),
      ...(knowledgeGraph ? [{
        kind: 'rcl-native-knowledge-graph',
        root: knowledgeGraph.root,
        claims: knowledgeGraph.claims.length,
        evidence_references: knowledgeGraph.evidence_nodes.length,
         dependency_edges: knowledgeGraph.dependency_edges.length,
       }] : []),
      ...(authorityEvidence ? [{
        kind: 'rcl-native-authority-evidence',
        root: authorityEvidence.root,
        transition_count: authorityEvidence.transitions.length,
      }] : []),
      ...(spatialCommandPlan ? [{
        kind: 'rcl-spatial-command-plan',
        root: spatialCommandPlan.root,
        command_count: spatialCommandPlan.commands.length,
        command_types: [...new Set(spatialCommandPlan.commands.map(command => command.type))].sort(),
      }] : []),
      ...(physicalCommandProfile ? [{
        kind: 'rcl-physical-command-profile',
        root: physicalCommandProfile.root,
        profile_id: physicalCommandProfile.profile_id,
        command_families: physicalCommandProfile.command_families.map(family => family.id),
      }] : []),
      { kind: 'rbf-simulation-receipt' },
      { kind: 'aaf-decision' },
      { kind: 'rfe-commit-receipt' },
    ],
    rollback_policy: { mode: 'generation-restore', restore_baseline: true, retain_evidence: true },
    acceptance_rules: [
      { rule: 'rcl-native-parity-before-candidate' },
      { rule: 'rcl-native-authority-state-root-bound' },
      ...(authorityEvidence ? [{ rule: 'rcl-authority-continuity-bound' }] : []),
      { rule: 'candidate-before-commit' },
      { rule: 'all-mutating-actions-authorized' },
      { rule: 'state-precondition-must-match' },
      ...(knowledgeGraph ? [{ rule: 'rcl-knowledge-evidence-bound' }, { rule: 'rcl-knowledge-dependencies-explicit' }] : []),
      ...(spatialCommandPlan ? [{ rule: 'rcl-spatial-command-lowering-bound' }, { rule: 'rcl-physical-command-profile-bound' }, { rule: 'rsr-command-root-bound' }] : []),
      { rule: 'rfe-receipt-required' },
    ],
  };
  return {
    format: 'rncs.rcl-authority-plan.v0.1',
    execution,
    plan,
    changes,
    objects: worldModel.objects,
    behaviors: worldModel.behaviors,
    operations: worldModel.operations,
    spatialCommandPlan,
    physicalCommandProfile,
    domainState: worldModel.domainState,
    knowledgeGraph,
    authorityEvidence,
    domainStateRoot,
    stateRoot: nativeStateRoot,
  };
}

export function compileControlPlaneEdge(from, to) {
  const result = bootstrapCompilerStage5({
    coreSource: readRclModule(from, { interfaceOnly: true }),
    appSource: readRclModule(to),
    program: `RNCSControl_${from}_${to}`,
    sourceRoot: `rncs:rcl-control:${from}->${to}`,
  });
  return {
    from,
    to,
    targetBytecode: result.targetBytecode,
    targetHash: sha256(result.targetBytecode),
    targetState: result.targetRun.state,
    dependencyState: selectNamespace(result.targetRun.state, from),
    moduleState: selectNamespace(result.targetRun.state, to),
    deterministic: result.deterministic,
    referenceParity: result.referenceParity,
    irCount: result.ir.length,
    byteLength: result.targetBytecode.length,
    compilerVm: result.compilerRun.vm,
  };
}


export function compileRuntimeBundle() {
  const result = bootstrapCompilerStage5({
    coreSource: readRclModule('runtime-base'),
    appSource: readRclModule('runtime-bundle'),
    program: 'RNCSControlPlaneAotBundle',
    sourceRoot: 'rncs:rcl-control:aot-bundle',
  });
  return {
    targetBytecode: result.targetBytecode,
    targetHash: sha256(result.targetBytecode),
    targetState: result.targetRun.state,
    byteLength: result.targetBytecode.length,
    deterministic: result.deterministic,
    referenceParity: result.referenceParity,
  };
}

export function buildRclControlPlane(options = {}) {
  const edges = CONTROL_PLANE_EDGES.map(([from, to]) => compileControlPlaneEdge(from, to));
  const state = {
    ...edges[0].dependencyState,
    ...Object.assign({}, ...edges.map(edge => edge.moduleState)),
  };
  const modules = Object.fromEntries(Object.keys(LEGACY_MODULES).map(name => [name, {
    name,
    id: state[`${name}::module.id`],
    version: state[`${name}::module.version`],
    ready: state[`${name}::module.ready`],
  }]));
  const runtimeBundle = compileRuntimeBundle();
  const result = {
    format: 'rncs.rcl-control-plane.v0.2',
    stage: 'embedded-aot-authority-mirror',
    modules,
    edges: edges.map(({ targetBytecode, ...edge }) => edge),
    state,
    allReady: Object.values(modules).every(module => module.ready === true),
    allDeterministic: edges.every(edge => edge.deterministic),
    allReferenceParity: edges.every(edge => edge.referenceParity),
    stateRoot: sha256(Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(state).sort(([a], [b]) => a.localeCompare(b)))), 'utf8')),
    runtimeBundle: { targetHash: runtimeBundle.targetHash, byteLength: runtimeBundle.byteLength, targetState: runtimeBundle.targetState, deterministic: runtimeBundle.deterministic, referenceParity: runtimeBundle.referenceParity },
  };

  if (options.artifactDir) {
    fs.mkdirSync(options.artifactDir, { recursive: true });
    for (const edge of edges) {
      fs.writeFileSync(path.join(options.artifactDir, `${edge.from}-${edge.to}.rbc`), edge.targetBytecode);
    }
    fs.writeFileSync(path.join(options.artifactDir, 'runtime-bundle.rbc'), runtimeBundle.targetBytecode);
    fs.writeFileSync(path.join(options.artifactDir, 'control-plane.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return { ...result, compiledEdges: edges, compiledRuntimeBundle: runtimeBundle };
}

export function replayRuntimeBundle(bundle) {
  return runNativeBytecode(bundle.targetBytecode);
}

export function createEmbeddedRuntimeBundle(bundle) {
  return new EmbeddedNativeVm(bundle.targetBytecode);
}

export function replayCompiledControlPlane(compiledEdges) {
  const states = compiledEdges.map(edge => runNativeBytecode(edge.targetBytecode).state);
  return {
    edgeCount: states.length,
    states,
    finalState: Object.assign({}, ...states),
  };
}

export function verifyLegacyManifestParity(repoRoot) {
  const checks = [];
  for (const [name, expected] of Object.entries(LEGACY_MODULES)) {
    const sourcePath = expected.manifest ?? expected.manifestDir;
    const manifest = expected.manifestDir
      ? discoverRuntimeManifests([path.join(repoRoot, expected.manifestDir)]).registry
      : JSON.parse(fs.readFileSync(path.join(repoRoot, expected.manifest), 'utf8'));
    const idField = expected.idField ?? 'id';
    const versionField = expected.versionField ?? 'version';
    let actualId = manifest[idField];
    if (expected.idTransform === 'registry-format') actualId = actualId === 'reality-one.runtime-registry.v0.3' ? 'reality-one.runtime-registry' : actualId;
    checks.push({
      name, path: sourcePath, expectedId: expected.id, actualId,
      expectedVersion: expected.version, actualVersion: manifest[versionField],
      passed: actualId === expected.id && manifest[versionField] === expected.version,
    });
  }
  return { passed: checks.every(check => check.passed), checks };
}
