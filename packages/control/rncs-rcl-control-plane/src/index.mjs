import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  bootstrapCompilerStage5,
  compileRealityToBytecode,
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
  const bytecode = compileRealityToBytecode(source);
  const decoded = decodeBytecode(bytecode);
  const timeout = options.timeout ?? 30_000;
  const native = runNativeBytecode(bytecode, { timeout });
  const parity = options.verifyParity === false
    ? null
    : await verifyNativeParity(source, { nativeRuntime: { timeout } });
  return {
    format: 'rncs.rcl-native-execution.v0.1',
    languageVersion: RCL_LANGUAGE_VERSION,
    bytecodeVersion: RCL_BYTECODE_VERSION,
    bytecodeHash: sha256(bytecode),
    byteLength: bytecode.length,
    instructionCount: decoded.instructions.length,
    native: {
      state: native.state,
      projections: native.projections,
      history: native.history,
    },
    parity: parity ? { ok: parity.ok, checks: parity.parity } : null,
  };
}

const RCL_RNCS_WORLD_PREFIX = 'rncs.world.';
const RCL_RNCS_FORBIDDEN_PATH = /(^|\.)(authority|generation|revision|state_root|evidence_root)(\.|$)/i;

function isJsonValue(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (value && typeof value === 'object') return Object.values(value).every(isJsonValue);
  return false;
}

function rclWorldChanges(state) {
  const changes = [];
  for (const [key, value] of Object.entries(state ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (!key.startsWith(RCL_RNCS_WORLD_PREFIX)) continue;
    const pathName = `world.${key.slice(RCL_RNCS_WORLD_PREFIX.length)}`;
    if (!pathName.slice('world.'.length) || RCL_RNCS_FORBIDDEN_PATH.test(pathName)) {
      throw new Error(`RCL_RNCS_WORLD_PATH_FORBIDDEN:${pathName}`);
    }
    if (!isJsonValue(value)) throw new TypeError(`RCL_RNCS_WORLD_VALUE_NOT_JSON:${pathName}`);
    changes.push({ op: 'set', path: pathName, value });
  }
  return changes;
}

export async function compileRclAuthorityPlan(source, options = {}) {
  const execution = options.execution ?? await compileRclSource(source, options);
  const changes = rclWorldChanges(execution.native?.state);
  if (!changes.length) throw new Error('RCL_RNCS_WORLD_CHANGE_REQUIRED');
  const sourceRoot = execution.bytecodeHash;
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
    },
    subject: {
      subject_id: subjectId,
      roles: options.roles ?? ['rcl-author'],
      responsibility_boundary: 'world-authority',
    },
    artifacts: [],
    behaviors: [],
    candidate_branch: {
      branch_id: `branch:rcl-${sourceRoot.slice(0, 24)}`,
      baseline_generation: baselineGeneration,
      risk_level: riskLevel,
      reason: 'RCL native state transition must be simulated before authority commit',
    },
    authority_requirements: [
      { action: 'create_world_object', scope: 'world.object.create', risk_level: 'medium' },
      { action: 'register_behavior', scope: 'behavior.register', risk_level: 'medium' },
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
      { kind: 'rcl-native-bytecode', root: execution.bytecodeHash },
      { kind: 'rcl-native-parity', verified: execution.parity?.ok === true },
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
