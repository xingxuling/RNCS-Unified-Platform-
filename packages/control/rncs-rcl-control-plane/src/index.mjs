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
} from '@taowind/reality-computation-language';

export { RCL_BYTECODE_VERSION, RCL_LANGUAGE_VERSION };

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = path.dirname(HERE);
export const RCL_ROOT = path.join(PACKAGE_ROOT, 'rcl');

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
  runtime_registry: { id: 'reality-one.runtime-registry', version: '0.3.0', manifest: 'artifacts/gateway-health/runtime-registry.json', idField: 'format', idTransform: 'registry-format', versionField: 'gateway_protocol' },
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
  const parity = options.verifyParity === false
    ? null
    : await verifyNativeParity(source, { nativeRuntime: { timeout } });
  return {
    format: 'rncs.rcl-native-execution.v0.2',
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
      state: native.state,
      projections: native.projections,
      history: native.history,
    },
    parity: parity ? { ok: parity.ok, checks: parity.parity } : null,
  };
}

const RCL_RNCS_WORLD_PREFIX = 'rncs.world.';
const RCL_RNCS_OBJECT_PREFIX = 'rncs.world.object.';
const RCL_RNCS_BEHAVIOR_PREFIX = 'rncs.world.behavior.';
const RCL_RNCS_CHANGE_PREFIX = 'rncs.world.change.';
const RCL_RNCS_CHANGE_OPS = new Set(['set', 'remove', 'append', 'increment', 'merge']);
const RCL_RNCS_FORBIDDEN_PATH = /(^|\.)(authority|generation|revision|state_root|evidence_root)(\.|$)/i;
const RCL_RNCS_ALIAS = /^[A-Za-z0-9_-]+$/;

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
  const worldModel = rclWorldChanges(execution.native?.state);
  const changes = worldModel.changes;
  if (!changes.length) throw new Error('RCL_RNCS_WORLD_CHANGE_REQUIRED');
  const sourceRoot = execution.bytecodeHash;
  const domainStateRoot = Object.keys(worldModel.domainState).length
    ? sha256(Buffer.from(JSON.stringify(worldModel.domainState), 'utf8'))
    : null;
  const planId = `plan:rcl:${sourceRoot.slice(0, 24)}`;
  const subjectId = String(options.subjectId ?? 'subject:rcl-native');
  const baselineGeneration = Number(options.baselineGeneration ?? 0);
  const riskLevel = options.riskLevel ?? 'high';
  const plan = {
    format: 'rncs.compilation-plan.v0.2',
    version: '0.2.0',
    plan_id: planId,
    source: {
      language: 'RCL',
      version: RCL_LANGUAGE_VERSION,
      text: source,
      source_root: sourceRoot,
      bytecode_hash: execution.bytecodeHash,
      bytecode_version: execution.bytecodeVersion,
      instruction_count: execution.instructionCount,
      compiler: execution.compiler,
      compiler_parity: execution.compilerParity,
      rcl_domain_state_root: domainStateRoot,
    },
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
      { action: 'merge_candidate_branch', scope: 'branch.merge', risk_level: riskLevel },
      { action: 'rollback_generation', scope: 'rfe.rollback', risk_level: 'high' },
    ],
    world_state_changes: changes,
    simulation_requirements: [
      { runtime: 'rcl.native', mode: 'native-bytecode-parity' },
      { runtime: 'rncs.rsr', mode: 'candidate-isolated', fixed_step_hz: 60 },
      { runtime: 'rncs.vsr', mode: 'presentation-only' },
    ],
    projection_targets: ['aetherworld', 'rncs.rsr', 'rncs.vsr'],
    evidence_requirements: [
      { kind: 'rcl-native-selfhost-compiler', root: execution.compiler?.artifactHash },
      { kind: 'rcl-native-bytecode', root: execution.bytecodeHash },
      { kind: 'rcl-native-parity', verified: execution.parity?.ok === true },
      ...(domainStateRoot ? [{ kind: 'rcl-native-domain-state', root: domainStateRoot }] : []),
      { kind: 'rbf-simulation-receipt' },
      { kind: 'aaf-decision' },
      { kind: 'rfe-commit-receipt' },
    ],
    rollback_policy: { mode: 'generation-restore', restore_baseline: true, retain_evidence: true },
    acceptance_rules: [
      { rule: 'rcl-native-parity-before-candidate' },
      { rule: 'candidate-before-commit' },
      { rule: 'all-mutating-actions-authorized' },
      { rule: 'state-precondition-must-match' },
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
    domainState: worldModel.domainState,
    domainStateRoot,
    stateRoot: sha256(Buffer.from(JSON.stringify(execution.native.state), 'utf8')),
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
    const manifestPath = path.join(repoRoot, expected.manifest);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const idField = expected.idField ?? 'id';
    const versionField = expected.versionField ?? 'version';
    let actualId = manifest[idField];
    if (expected.idTransform === 'registry-format') actualId = actualId === 'reality-one.runtime-registry.v0.3' ? 'reality-one.runtime-registry' : actualId;
    checks.push({
      name, path: expected.manifest, expectedId: expected.id, actualId,
      expectedVersion: expected.version, actualVersion: manifest[versionField],
      passed: actualId === expected.id && manifest[versionField] === expected.version,
    });
  }
  return { passed: checks.every(check => check.passed), checks };
}
