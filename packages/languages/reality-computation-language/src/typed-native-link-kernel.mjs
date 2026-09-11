import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { compileTypedPackage, verifyTypedPackageLock } from './typed-package-kernel.mjs';
import { tryCompileReality } from './compiler.mjs';
import { compileRealityToBytecode, decodeBytecode, OPCODES } from './bytecode.mjs';
import { runNativeBytecode } from './native-vm.mjs';
import { runReality } from './runtime.mjs';
import { compileTypedModuleGraph } from './type-module-kernel.mjs';
import { realityRoot } from './canonical.mjs';

export const RCL_TYPED_NATIVE_LINK_VERSION = '0.1.0-alpha.1';
export const RCL_TYPED_NATIVE_LINK_FORMAT = 'rcl.typed-native-link.v0.1';
export const RCL_TYPED_NATIVE_LINK_REPLAY_FORMAT = 'rcl.typed-native-link-replay.v0.1';

const TYPED_OPCODE_SET = new Set([
  OPCODES.MAKE_TYPED_RECORD,
  OPCODES.MAKE_TYPED_UNION,
  OPCODES.GET_TYPED_FIELD,
  OPCODES.IS_UNION_VARIANT,
  OPCODES.GET_UNION_PAYLOAD,
]);

export class RCLTypedNativeLinkError extends Error {
  constructor(message, diagnostics = []) {
    super(message);
    this.name = 'RCLTypedNativeLinkError';
    this.code = diagnostics[0]?.code ?? 'RCL_TYPED_NATIVE_LINK_ERROR';
    this.diagnostics = diagnostics;
  }
}

function diagnostic(code, message, details = {}) {
  return { code, message, severity: 'error', ...details };
}

function sha256Buffer(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sha256Text(value) {
  return sha256Buffer(Buffer.from(value, 'utf8'));
}

function withoutRoot(value, key) {
  const result = { ...value };
  delete result[key];
  return result;
}

function semanticValue(value) {
  if (Array.isArray(value)) return value.map(semanticValue);
  if (!value || typeof value !== 'object') return value;
  if (value.__rclKind === 'Record') {
    const fields = Object.fromEntries(Object.entries(value)
      .filter(([key]) => !key.startsWith('__rcl'))
      .map(([key, nested]) => [key, semanticValue(nested)]));
    return {
      __rclKind: 'Record',
      __rclType: value.__rclType ?? null,
      fields,
    };
  }
  if (value.__rclKind === 'Union') {
    return {
      __rclKind: 'Union',
      __rclType: value.__rclType ?? null,
      variant: value.variant ?? null,
      payload: semanticValue(value.payload ?? []),
    };
  }
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['__rclObjectId', '__rclFieldOffsets', '__rclRecord'].includes(key))
    .map(([key, nested]) => [key, semanticValue(nested)]));
}

function semanticState(state) {
  return Object.fromEntries(Object.entries(state ?? {}).map(([key, value]) => [key, semanticValue(value)]));
}

function typedInstructionCount(decoded) {
  return (decoded.instructions ?? []).filter(instruction => TYPED_OPCODE_SET.has(instruction.op)).length;
}

function packageBinding(options, typeModuleRoot, programRoot, sourceRoot) {
  const lock = options.packageLock ?? null;
  const lockRoot = options.packageLockRoot ?? lock?.lockRoot ?? null;
  if (lock && lock.roots?.typeModuleRoot !== typeModuleRoot) {
    throw new RCLTypedNativeLinkError('Typed package lock does not bind the compiled type-module root', [diagnostic('RCL_TYPED_LINK_PACKAGE_TYPE_ROOT_MISMATCH', 'Typed package lock does not bind the compiled type-module root', { expected: typeModuleRoot, actual: lock.roots?.typeModuleRoot ?? null })]);
  }
  if (lock && lock.roots?.programRoot !== programRoot) {
    throw new RCLTypedNativeLinkError('Typed package lock does not bind the compiled program root', [diagnostic('RCL_TYPED_LINK_PACKAGE_PROGRAM_ROOT_MISMATCH', 'Typed package lock does not bind the compiled program root', { expected: programRoot, actual: lock.roots?.programRoot ?? null })]);
  }
  if (lock && Array.isArray(lock.files)) {
    const entry = lock.files.find(item => item.role === 'entry' && item.path === lock.package?.entry);
    if (!entry || entry.sha256 !== sourceRoot) {
      throw new RCLTypedNativeLinkError('Typed package lock does not bind the compiled entry source', [diagnostic('RCL_TYPED_LINK_PACKAGE_ENTRY_ROOT_MISMATCH', 'Typed package lock does not bind the compiled entry source', { expected: sourceRoot, actual: entry?.sha256 ?? null })]);
    }
  }
  return {
    lock_root: lockRoot,
    manifest_name: lock?.package?.name ?? null,
    manifest_version: lock?.package?.version ?? null,
  };
}

function failure(error) {
  return {
    ok: false,
    diagnostics: error.diagnostics?.length
      ? error.diagnostics
      : [diagnostic(error.code ?? 'RCL_TYPED_NATIVE_LINK_FAILURE', error.message)],
    receipt: null,
  };
}

export async function compileTypedNativeLink(source, options = {}) {
  try {
    if (typeof source !== 'string' || source.trim().length === 0) {
      throw new RCLTypedNativeLinkError('Typed native link source must be a non-empty string', [diagnostic('RCL_TYPED_LINK_SOURCE_REQUIRED', 'Typed native link source must be a non-empty string')]);
    }
    const typeModuleReport = options.typeModuleReport ?? (options.typeModuleSources ? compileTypedModuleGraph(options.typeModuleSources) : null);
    if (!typeModuleReport) {
      throw new RCLTypedNativeLinkError('Typed native link requires a typed module graph', [diagnostic('RCL_TYPED_LINK_TYPE_MODULES_REQUIRED', 'Typed native link requires typeModuleSources or typeModuleReport')]);
    }
    if (!typeModuleReport.ok) return { ok: false, diagnostics: typeModuleReport.diagnostics, receipt: null };

    const linked = tryCompileReality(source, { typeModuleReport });
    if (!linked.ok) return { ok: false, diagnostics: linked.diagnostics, receipt: null };
    const bytecode = Buffer.from(compileRealityToBytecode(linked.program));
    const decoded = decodeBytecode(bytecode);
    const native = runNativeBytecode(bytecode, options.nativeRuntime ?? {});
    const reference = await runReality(linked.program, options.referenceRuntime ?? {});
    const referenceState = semanticState(reference.state);
    const nativeState = semanticState(native.state);
    const referenceSemanticStateRoot = realityRoot(referenceState);
    const nativeSemanticStateRoot = realityRoot(nativeState);
    const semanticStateParity = referenceSemanticStateRoot === nativeSemanticStateRoot;
    const sourceRoot = sha256Text(source);
    const packageInfo = packageBinding(options, typeModuleReport.irRoot, linked.program.programRoot, sourceRoot);
    const base = {
      format: RCL_TYPED_NATIVE_LINK_FORMAT,
      version: RCL_TYPED_NATIVE_LINK_VERSION,
      status: native.stateRootVerified === true && native.stateRootParity === true && semanticStateParity
        ? 'CANDIDATE_EXECUTION_VERIFIED'
        : 'CANDIDATE_EXECUTION_BLOCKED',
      source: {
        language: 'RCL',
        source_root: sourceRoot,
        source_bytes: Buffer.byteLength(source, 'utf8'),
      },
      package: packageInfo,
      type_modules: {
        format: typeModuleReport.ir.format,
        version: typeModuleReport.ir.version,
        ir_root: typeModuleReport.irRoot,
        report_root: typeModuleReport.root ?? null,
        module_count: typeModuleReport.ir.moduleCount,
        declaration_count: typeModuleReport.ir.declarationCount,
      },
      program: {
        name: linked.program.name,
        program_root: linked.program.programRoot,
        semantic_map_format: linked.program.semanticMap.format,
        semantic_map_root: realityRoot(linked.program.semanticMap),
        type_bindings_root: realityRoot(linked.program.typeBindings),
        source_map_root: realityRoot(linked.program.sourceMap),
        typed_facet_count: linked.program.semanticMap.typedFacetCount,
        constructor_count: linked.program.semanticMap.constructorCount,
      },
      bytecode: {
        version: decoded.version,
        sha256: sha256Buffer(bytecode),
        byte_length: bytecode.length,
        instruction_count: decoded.instructions.length,
        typed_instruction_count: typedInstructionCount(decoded),
      },
      execution: {
        reference: {
          format: reference.format,
          semantic_state_root: referenceSemanticStateRoot,
        },
        native: {
          semantic_state_root: nativeSemanticStateRoot,
          native_state_root: native.nativeStateRoot ?? null,
          state_root_verified: native.stateRootVerified === true,
          state_root_parity: native.stateRootParity === true,
          state_root_algorithm: native.stateRootAlgorithm ?? null,
        },
        semantic_state_parity: semanticStateParity,
      },
      authority: {
        candidate_only: true,
        canonical_write_authorized: false,
        commit_requires_explicit_rncs_authority: true,
        native_authority_plan: 'NOT_COMPILED_BY_TYPED_LINK',
      },
      boundary: 'Candidate typed link only: type-module graph, typed compiler, RBC/native VM and reference-state parity are rooted; native RCL authority-plan compilation, canonical mutation and promotion remain separate.',
    };
    const receipt = { ...base, link_root: realityRoot(base) };
    const verification = verifyTypedNativeLink(receipt, { source, typeModuleReport, packageLock: options.packageLock, packageLockRoot: options.packageLockRoot });
    if (!verification.ok) return { ok: false, diagnostics: verification.errors.map(code => diagnostic(code, code)), receipt: null };
    return { ok: true, receipt, program: linked.program, bytecode, reference, native, diagnostics: [] };
  } catch (error) {
    return failure(error);
  }
}

export async function compileTypedNativeLinkFromPackage(packageDir, options = {}) {
  try {
    if (typeof packageDir !== 'string' || packageDir.trim().length === 0) {
      throw new RCLTypedNativeLinkError('Typed native package link requires a package directory', [diagnostic('RCL_TYPED_LINK_PACKAGE_DIR_REQUIRED', 'Typed native package link requires a package directory')]);
    }
    const root = path.resolve(packageDir);
    const manifestPath = options.manifestPath;
    const lockPath = options.lockPath;
    const packageVerification = verifyTypedPackageLock(root, { manifestPath, lockPath });
    if (!packageVerification.ok) {
      return {
        ok: false,
        diagnostics: packageVerification.diagnostics ?? [diagnostic('RCL_TYPED_LINK_PACKAGE_LOCK_INVALID', 'Typed package lock verification failed')],
        receipt: null,
        packageVerification,
      };
    }
    const packageBuild = compileTypedPackage(root, { manifestPath, lockPath, writeLock: false });
    if (!packageBuild.ok) {
      return {
        ok: false,
        diagnostics: packageBuild.diagnostics ?? [diagnostic('RCL_TYPED_LINK_PACKAGE_BUILD_FAILED', 'Typed package build failed')],
        receipt: null,
        packageVerification,
        packageBuild,
      };
    }
    if (packageBuild.lock.lockRoot !== packageVerification.expectedLockRoot) {
      return {
        ok: false,
        diagnostics: [diagnostic('RCL_TYPED_LINK_PACKAGE_LOCK_CHANGED', 'Typed package lock changed between verification and link compilation', { expected: packageVerification.expectedLockRoot, actual: packageBuild.lock.lockRoot })],
        receipt: null,
        packageVerification,
        packageBuild,
      };
    }
    const typed = await compileTypedNativeLink(packageBuild.source, {
      ...options,
      typeModuleSources: packageBuild.typeModuleSources,
      typeModuleReport: packageBuild.typeModuleReport,
      packageLock: packageBuild.lock,
      packageLockRoot: options.packageLockRoot ?? packageVerification.expectedLockRoot,
    });
    return { ...typed, packageVerification, packageBuild };
  } catch (error) {
    return { ...failure(error), packageDir: typeof packageDir === 'string' ? path.resolve(packageDir) : null };
  }
}

export function replayTypedNativeLink(receipt, bytecodeOrPath, options = {}) {
  try {
    const receiptVerification = verifyTypedNativeLink(receipt, options);
    if (!receiptVerification.ok) {
      return { ok: false, diagnostics: receiptVerification.errors.map(code => diagnostic(code, code)), replay: null };
    }
    let bytecode;
    if (Buffer.isBuffer(bytecodeOrPath) || bytecodeOrPath instanceof Uint8Array) bytecode = Buffer.from(bytecodeOrPath);
    else if (typeof bytecodeOrPath === 'string' && bytecodeOrPath.length > 0) bytecode = fs.readFileSync(bytecodeOrPath);
    else throw new RCLTypedNativeLinkError('Typed native link replay requires bytecode bytes or a bytecode path', [diagnostic('RCL_TYPED_LINK_REPLAY_BYTECODE_REQUIRED', 'Typed native link replay requires bytecode bytes or a bytecode path')]);

    const bytecodeRoot = sha256Buffer(bytecode);
    if (receipt.bytecode?.sha256 !== bytecodeRoot) {
      throw new RCLTypedNativeLinkError('Typed native link replay bytecode root does not match the sealed receipt', [diagnostic('RCL_TYPED_LINK_REPLAY_BYTECODE_ROOT_MISMATCH', 'Typed native link replay bytecode root does not match the sealed receipt', { expected: receipt.bytecode?.sha256 ?? null, actual: bytecodeRoot })]);
    }
    const decoded = decodeBytecode(bytecode);
    const decodedCounts = {
      byte_length: bytecode.length,
      instruction_count: decoded.instructions.length,
      typed_instruction_count: typedInstructionCount(decoded),
    };
    for (const key of ['byte_length', 'instruction_count', 'typed_instruction_count']) {
      if (receipt.bytecode?.[key] !== decodedCounts[key]) {
        throw new RCLTypedNativeLinkError(`Typed native link replay ${key} does not match the sealed receipt`, [diagnostic('RCL_TYPED_LINK_REPLAY_BYTECODE_METADATA_MISMATCH', `Typed native link replay ${key} does not match the sealed receipt`, { key, expected: receipt.bytecode?.[key] ?? null, actual: decodedCounts[key] })]);
      }
    }

    const native = runNativeBytecode(bytecode, options.nativeRuntime ?? {});
    const semanticStateRoot = realityRoot(semanticState(native.state));
    const expectedNative = receipt.execution?.native ?? {};
    const checks = {
      native_semantic_state_root: semanticStateRoot === expectedNative.semantic_state_root,
      native_state_root: native.nativeStateRoot === expectedNative.native_state_root,
      state_root_verified: native.stateRootVerified === expectedNative.state_root_verified,
      state_root_parity: native.stateRootParity === expectedNative.state_root_parity,
      semantic_state_parity: expectedNative.semantic_state_root === receipt.execution?.reference?.semantic_state_root
        && receipt.execution?.semantic_state_parity === true,
    };
    const mismatches = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
    if (mismatches.length > 0) {
      throw new RCLTypedNativeLinkError('Typed native link replay did not reproduce the sealed execution roots', [diagnostic('RCL_TYPED_LINK_REPLAY_EXECUTION_MISMATCH', 'Typed native link replay did not reproduce the sealed execution roots', { mismatches })]);
    }

    const base = {
      format: RCL_TYPED_NATIVE_LINK_REPLAY_FORMAT,
      version: RCL_TYPED_NATIVE_LINK_VERSION,
      status: 'CANDIDATE_REPLAY_VERIFIED',
      link_root: receipt.link_root,
      bytecode: { ...decodedCounts, sha256: bytecodeRoot, version: decoded.version },
      execution: {
        native_semantic_state_root: semanticStateRoot,
        native_state_root: native.nativeStateRoot,
        state_root_verified: native.stateRootVerified === true,
        state_root_parity: native.stateRootParity === true,
        semantic_state_parity: true,
      },
      authority: {
        candidate_only: true,
        canonical_write_authorized: false,
        commit_requires_explicit_rncs_authority: true,
        replay_only: true,
      },
      boundary: 'Replay of a sealed typed native link only: the native VM re-consumes bytecode and reproduces bound roots; native authority-plan compilation, canonical mutation and promotion remain separate.',
    };
    return {
      ok: true,
      replay: { ...base, replay_root: realityRoot(base) },
      decoded,
      native,
      diagnostics: [],
    };
  } catch (error) {
    return { ...failure(error), replay: null };
  }
}

export function verifyTypedNativeLink(receipt, options = {}) {
  const errors = [];
  if (!receipt || typeof receipt !== 'object') return { ok: false, errors: ['RCL_TYPED_LINK_RECEIPT_REQUIRED'] };
  if (receipt.format !== RCL_TYPED_NATIVE_LINK_FORMAT) errors.push('RCL_TYPED_LINK_FORMAT_INVALID');
  if (receipt.version !== RCL_TYPED_NATIVE_LINK_VERSION) errors.push('RCL_TYPED_LINK_VERSION_INVALID');
  if (receipt.link_root !== realityRoot(withoutRoot(receipt, 'link_root'))) errors.push('RCL_TYPED_LINK_ROOT_MISMATCH');
  if (receipt.authority?.candidate_only !== true) errors.push('RCL_TYPED_LINK_CANDIDATE_ONLY_REQUIRED');
  if (receipt.authority?.canonical_write_authorized !== false) errors.push('RCL_TYPED_LINK_CANONICAL_WRITE_FORBIDDEN');
  if (receipt.authority?.commit_requires_explicit_rncs_authority !== true) errors.push('RCL_TYPED_LINK_COMMIT_GATE_REQUIRED');
  if (receipt.execution?.native?.state_root_verified !== true) errors.push('RCL_TYPED_LINK_NATIVE_STATE_ROOT_UNVERIFIED');
  if (receipt.execution?.native?.state_root_parity !== true) errors.push('RCL_TYPED_LINK_NATIVE_STATE_ROOT_PARITY_REQUIRED');
  if (receipt.execution?.semantic_state_parity !== true) errors.push('RCL_TYPED_LINK_REFERENCE_NATIVE_PARITY_REQUIRED');
  if (options.source !== undefined && receipt.source?.source_root !== sha256Text(options.source)) errors.push('RCL_TYPED_LINK_SOURCE_ROOT_MISMATCH');
  if (options.typeModuleReport && receipt.type_modules?.ir_root !== options.typeModuleReport.irRoot) errors.push('RCL_TYPED_LINK_TYPE_MODULE_ROOT_MISMATCH');
  const lockRoot = options.packageLockRoot ?? options.packageLock?.lockRoot;
  if (lockRoot !== undefined && receipt.package?.lock_root !== lockRoot) errors.push('RCL_TYPED_LINK_PACKAGE_ROOT_MISMATCH');
  if (options.packageLock && Array.isArray(options.packageLock.files)) {
    const entry = options.packageLock.files.find(item => item.role === 'entry' && item.path === options.packageLock.package?.entry);
    if (!entry || entry.sha256 !== receipt.source?.source_root) errors.push('RCL_TYPED_LINK_PACKAGE_ENTRY_ROOT_MISMATCH');
  }
  return { ok: errors.length === 0, errors };
}
