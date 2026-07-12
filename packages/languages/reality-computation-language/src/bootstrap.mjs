import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileRealityToBytecode, assembleLiteralProgram, assembleAstProgram, assembleIrProgram } from './bytecode.mjs';
import { runNativeBytecode } from './native-vm.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const DEFAULT_COMPILER_SEED_PATH = path.join(ROOT, 'bootstrap', 'compiler-seed.rcl');
export const DEFAULT_COMPILER_STAGE2_PATH = path.join(ROOT, 'bootstrap', 'compiler-stage2.rcl');
export const DEFAULT_COMPILER_STAGE3_PATH = path.join(ROOT, 'bootstrap', 'compiler-stage3.rcl');
export const DEFAULT_COMPILER_STAGE4_PATH = path.join(ROOT, 'bootstrap', 'compiler-stage4.rcl');
export const DEFAULT_COMPILER_STAGE5_PATH = path.join(ROOT, 'bootstrap', 'compiler-stage5.rcl');

/**
 * Stage-1 self-hosting seed.
 *
 * The RCL source performs lexical classification and lowering decisions inside
 * the native VM. A small Stage-0 bridge still serializes the resulting tuple
 * into the RBC binary container. This is intentionally not described as a
 * complete self-hosted compiler.
 */
export function bootstrapCompilerSeed(options = {}) {
  const seedPath = options.seedPath ?? DEFAULT_COMPILER_SEED_PATH;
  const source = options.source ?? fs.readFileSync(seedPath, 'utf8');
  const compilerBytecode = compileRealityToBytecode(source);
  const compilerRun = runNativeBytecode(compilerBytecode, options.nativeRuntime);
  const state = compilerRun.state;

  if (state['compiler.opcode'] !== 1 || state['compiler.type'] !== 'Number') {
    throw new Error('Stage-1 compiler seed did not lower a Number literal assignment');
  }

  const targetBytecode = assembleLiteralProgram({
    program: options.program ?? 'RCLSelfHostedLiteral',
    path: state['compiler.path'],
    value: state['compiler.constant'],
    sourceRoot: compilerRun.history[0]?.afterRoot ?? 'rcl:selfhost-stage1',
  });
  const targetRun = runNativeBytecode(targetBytecode, options.nativeRuntime);

  return {
    stage: 'self-hosting-seed-v0.1',
    compilerBytecode,
    compilerRun,
    targetBytecode,
    targetRun,
    boundary: 'RCL performs token classification and lowering decisions; Stage-0 JavaScript still encodes the RBC container.',
  };
}


/**
 * Stage-2 self-hosting core.
 *
 * RCL code performs recursive tokenization, creates native Token/Span values,
 * validates a small facet grammar and emits typed FacetDecl AST nodes. The
 * Stage-0 bridge only writes the already-formed AST into the RBC container.
 */
export function bootstrapCompilerStage2(options = {}) {
  const stage2Path = options.stage2Path ?? DEFAULT_COMPILER_STAGE2_PATH;
  let compilerSource = fs.readFileSync(stage2Path, 'utf8');
  const targetSource = options.source ?? 'facet world.value : Number = 7\nfacet world.flag : Truth = true\nfacet world.name : Text = "Aster"';
  compilerSource = compilerSource.replace(
    /^  facet source\.text : Text = .*$/m,
    `  facet source.text : Text = ${JSON.stringify(targetSource)}`,
  );
  const compilerBytecode = compileRealityToBytecode(compilerSource);
  const compilerRun = runNativeBytecode(compilerBytecode, options.nativeRuntime);
  const ast = compilerRun.state['compiler.ast'];
  const tokens = compilerRun.state['compiler.tokens'];
  if (!Array.isArray(tokens) || !Array.isArray(ast) || ast.length === 0) {
    throw new Error('Stage-2 compiler did not produce Token and AST sequences');
  }
  const targetBytecode = assembleAstProgram({
    program: options.program ?? 'RCLSelfHostedCore',
    ast,
    sourceRoot: compilerRun.sourceRoot ?? 'rcl:selfhost-stage2',
  });
  const targetRun = runNativeBytecode(targetBytecode, options.nativeRuntime);
  return {
    stage: 'self-hosting-core-v0.2',
    source: targetSource,
    compilerSource,
    compilerBytecode,
    compilerRun,
    tokens,
    ast,
    targetBytecode,
    targetRun,
    boundary: 'RCL performs recursive tokenization and core facet parsing into typed AST; Stage-0 JavaScript only serializes the AST into RBC 1.1.',
  };
}


/**
 * Stage-3 semantic compilation core.
 *
 * RCL code performs name resolution for the core facet subset, rejects
 * duplicate symbols, checks declared-vs-literal types and lowers validated
 * semantic nodes into typed RCL IR. Stage-0 JavaScript still serializes IR
 * nodes into the RBC binary container.
 */
export function bootstrapCompilerStage3(options = {}) {
  const stage3Path = options.stage3Path ?? DEFAULT_COMPILER_STAGE3_PATH;
  let compilerSource = fs.readFileSync(stage3Path, 'utf8');
  const targetSource = options.source ?? 'facet world.value : Number = 7\nfacet world.flag : Truth = true\nfacet world.name : Text = "Aster"';
  compilerSource = compilerSource.replace(
    /^  facet source\.text : Text = .*$/m,
    `  facet source.text : Text = ${JSON.stringify(targetSource)}`,
  );
  const compilerBytecode = compileRealityToBytecode(compilerSource);
  const compilerRun = runNativeBytecode(compilerBytecode, options.nativeRuntime);
  const { state } = compilerRun;
  const tokens = state['compiler.tokens'];
  const ast = state['compiler.ast'];
  const symbols = state['compiler.symbols'];
  const semantic = state['compiler.semantic'];
  const ir = state['compiler.ir'];
  if (![tokens, ast, symbols, semantic, ir].every(Array.isArray) || ir.length === 0) {
    throw new Error('Stage-3 compiler did not produce tokens, AST, symbols, semantic nodes and IR');
  }
  const targetBytecode = assembleIrProgram({
    program: options.program ?? 'RCLSelfHostedSemanticCore',
    ir,
    sourceRoot: compilerRun.sourceRoot ?? 'rcl:selfhost-stage3',
  });
  const targetRun = runNativeBytecode(targetBytecode, options.nativeRuntime);
  return {
    stage: 'self-hosting-semantic-core-v0.3',
    source: targetSource,
    compilerSource,
    compilerBytecode,
    compilerRun,
    tokens, ast, symbols, semantic, ir,
    targetBytecode, targetRun,
    boundary: 'RCL performs tokenization, parsing, core name resolution, type checking and AST-to-IR lowering; Stage-0 JavaScript only serializes validated IR into RBC 1.1.',
  };
}


/**
 * Stage-4 module and cross-file semantic core.
 *
 * RCL code parses module/import/require headers for two source modules, builds
 * qualified symbols, validates the module graph and imported symbol types, and
 * lowers the combined module graph into deterministic typed IR. Stage-0 still
 * serializes the validated IR into RBC 1.1.
 */
export function bootstrapCompilerStage4(options = {}) {
  const stage4Path = options.stage4Path ?? DEFAULT_COMPILER_STAGE4_PATH;
  let compilerSource = fs.readFileSync(stage4Path, 'utf8');
  const coreSource = options.coreSource ?? 'module core\nfacet world.value : Number = 7\nfacet world.name : Text = "Aster"';
  const appSource = options.appSource ?? 'module app\nimport core\nrequire core world.value : Number\nrequire core world.name : Text\nfacet app.ready : Truth = true';
  compilerSource = compilerSource.replace(
    /^  facet source\.core : Text = .*$/m,
    `  facet source.core : Text = ${JSON.stringify(coreSource)}`,
  ).replace(
    /^  facet source\.app : Text = .*$/m,
    `  facet source.app : Text = ${JSON.stringify(appSource)}`,
  );
  const compilerBytecode = compileRealityToBytecode(compilerSource);
  const compilerRun = runNativeBytecode(compilerBytecode, options.nativeRuntime);
  const { state } = compilerRun;
  const modules = state['compiler.modules'];
  const imports = state['compiler.app_imports'];
  const coreAst = state['compiler.core_ast'];
  const appAst = state['compiler.app_ast'];
  const symbols = state['compiler.symbols'];
  const semantic = state['compiler.semantic'];
  const ir = state['compiler.ir'];
  if (![modules, imports, coreAst, appAst, symbols, semantic, ir].every(Array.isArray) || ir.length === 0) {
    throw new Error('Stage-4 compiler did not produce module graph, AST, symbols, semantic nodes and IR');
  }
  const targetBytecode = assembleIrProgram({
    program: options.program ?? 'RCLSelfHostedModuleCore',
    ir,
    sourceRoot: compilerRun.sourceRoot ?? 'rcl:selfhost-stage4',
  });
  const targetRun = runNativeBytecode(targetBytecode, options.nativeRuntime);
  return {
    stage: 'self-hosting-module-core-v0.4',
    sources: { core: coreSource, app: appSource },
    compilerSource,
    compilerBytecode,
    compilerRun,
    modules,
    imports,
    coreAst,
    appAst,
    symbols,
    semantic,
    ir,
    targetBytecode,
    targetRun,
    boundary: 'RCL performs module header parsing, import graph validation, qualified cross-file name resolution, imported symbol type checking and combined IR lowering; Stage-0 JavaScript still serializes validated IR into RBC 1.1.',
  };
}


/**
 * Stage-5 self-hosted RBC encoder core.
 *
 * RCL code performs Stage-4 multi-module semantic compilation and then encodes
 * the validated IR into the exact RBC 1.1 byte sequence inside the native VM.
 * JavaScript only extracts the emitted byte Sequence into a Buffer and checks
 * parity; it no longer constructs the target RBC container.
 */
export function bootstrapCompilerStage5(options = {}) {
  const stage5Path = options.stage5Path ?? DEFAULT_COMPILER_STAGE5_PATH;
  let compilerSource = fs.readFileSync(stage5Path, 'utf8');
  const coreSource = options.coreSource ?? 'module core\nfacet world.value : Number = 7\nfacet world.name : Text = "Aster"';
  const appSource = options.appSource ?? 'module app\nimport core\nrequire core world.value : Number\nrequire core world.name : Text\nfacet app.ready : Truth = true';
  const program = options.program ?? 'RCLSelfHostedRbcTarget';
  const sourceRoot = options.sourceRoot ?? 'rcl:selfhost-stage5';
  compilerSource = compilerSource.replace(
    /^  facet source\.core : Text = .*$/m,
    `  facet source.core : Text = ${JSON.stringify(coreSource)}`,
  ).replace(
    /^  facet source\.app : Text = .*$/m,
    `  facet source.app : Text = ${JSON.stringify(appSource)}`,
  ).replace(
    /^  facet source\.program : Text = .*$/m,
    `  facet source.program : Text = ${JSON.stringify(program)}`,
  ).replace(
    /^  facet source\.root : Text = .*$/m,
    `  facet source.root : Text = ${JSON.stringify(sourceRoot)}`,
  );

  const compilerBytecode = compileRealityToBytecode(compilerSource);
  const firstRun = runNativeBytecode(compilerBytecode, options.nativeRuntime);
  const secondRun = runNativeBytecode(compilerBytecode, options.nativeRuntime);
  const { state } = firstRun;
  const ir = state['compiler.ir'];
  const rbcBytes = state['compiler.rbc_bytes'];
  if (!Array.isArray(ir) || ir.length === 0 || !Array.isArray(rbcBytes) || rbcBytes.length < 36) {
    throw new Error('Stage-5 compiler did not produce typed IR and RBC bytes');
  }
  for (const [index, value] of rbcBytes.entries()) {
    if (!Number.isInteger(value) || value < 0 || value > 255) throw new Error(`Invalid Stage-5 RBC byte at ${index}`);
  }
  const targetBytecode = Buffer.from(rbcBytes);
  const secondBytecode = Buffer.from(secondRun.state['compiler.rbc_bytes']);
  const referenceBytecode = assembleIrProgram({ program, ir, sourceRoot });
  if (!targetBytecode.equals(referenceBytecode)) throw new Error('Stage-5 RCL RBC encoder differs from Stage-0 reference encoder');
  if (!targetBytecode.equals(secondBytecode)) throw new Error('Stage-5 repeated RBC emission is not deterministic');
  const targetRun = runNativeBytecode(targetBytecode, options.nativeRuntime);
  return {
    stage: 'self-hosting-rbc-encoder-v0.5',
    sources: { core: coreSource, app: appSource },
    program,
    sourceRoot,
    compilerSource,
    compilerBytecode,
    compilerRun: firstRun,
    repeatedCompilerRun: secondRun,
    modules: state['compiler.modules'],
    symbols: state['compiler.symbols'],
    semantic: state['compiler.semantic'],
    ir,
    rbcStrings: state['compiler.rbc_strings'],
    rbcNumbers: state['compiler.rbc_numbers'],
    targetBytecode,
    referenceBytecode,
    targetRun,
    deterministic: targetBytecode.equals(secondBytecode),
    referenceParity: targetBytecode.equals(referenceBytecode),
    boundary: 'RCL performs tokenization, parsing, module validation, semantic analysis, IR lowering and exact RBC 1.1 byte encoding inside the native VM; Stage-0 JavaScript only extracts bytes and launches the target VM. Full compiler self-compilation is still pending.',
  };
}
