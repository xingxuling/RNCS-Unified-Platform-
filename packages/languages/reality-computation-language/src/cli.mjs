#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { compileReality, runReality } from './index.mjs';
import { compileRealityToBytecode, decodeBytecode } from './bytecode.mjs';
import { runNativeBytecode, runRealityNative } from './native-vm.mjs';
import { bootstrapCompilerSeed, bootstrapCompilerStage2, bootstrapCompilerStage3, bootstrapCompilerStage4, bootstrapCompilerStage5 } from './bootstrap.mjs';

const [command, file, output] = process.argv.slice(2);
const commands = new Set(['compile', 'run', 'bytecode', 'disasm', 'native-run', 'native', 'bootstrap', 'bootstrap2', 'bootstrap3', 'bootstrap4', 'bootstrap5']);
if (!command || !commands.has(command) || (!file && !['bootstrap', 'bootstrap2', 'bootstrap3', 'bootstrap4', 'bootstrap5'].includes(command))) {
  console.error('Usage: rcl <compile|run|bytecode|disasm|native-run|native> <file> [output.rbc]\n       rcl bootstrap|bootstrap2|bootstrap3|bootstrap4|bootstrap5');
  process.exit(2);
}

try {
  if (command === 'disasm') {
    console.log(JSON.stringify(decodeBytecode(fs.readFileSync(file)), null, 2));
  } else if (command === 'native-run') {
    console.log(JSON.stringify(runNativeBytecode(file), null, 2));
  } else if (command === 'bootstrap5') {
    const result = bootstrapCompilerStage5();
    console.log(JSON.stringify({
      stage: result.stage,
      modules: result.modules,
      symbolCount: result.symbols.length,
      semanticCount: result.semantic.length,
      irCount: result.ir.length,
      targetBytes: result.targetBytecode.length,
      deterministic: result.deterministic,
      referenceParity: result.referenceParity,
      targetState: result.targetRun.state,
      boundary: result.boundary,
    }, null, 2));
  } else if (command === 'bootstrap4') {
    const result = bootstrapCompilerStage4();
    console.log(JSON.stringify({
      stage: result.stage,
      modules: result.modules,
      imports: result.imports,
      coreAstCount: result.coreAst.length,
      appAstCount: result.appAst.length,
      symbolCount: result.symbols.length,
      semanticCount: result.semantic.length,
      irCount: result.ir.length,
      targetState: result.targetRun.state,
      boundary: result.boundary,
    }, null, 2));
  } else if (command === 'bootstrap3') {
    const result = bootstrapCompilerStage3();
    console.log(JSON.stringify({
      stage: result.stage,
      tokenCount: result.tokens.length,
      astCount: result.ast.length,
      symbolCount: result.symbols.length,
      semanticCount: result.semantic.length,
      irCount: result.ir.length,
      targetState: result.targetRun.state,
      boundary: result.boundary,
    }, null, 2));
  } else if (command === 'bootstrap2') {
    const result = bootstrapCompilerStage2();
    console.log(JSON.stringify({
      stage: result.stage, tokenCount: result.tokens.length, ast: result.ast,
      targetState: result.targetRun.state, boundary: result.boundary,
    }, null, 2));
  } else if (command === 'bootstrap') {
    const result = bootstrapCompilerSeed();
    console.log(JSON.stringify({
      stage: result.stage,
      compilerState: result.compilerRun.state,
      targetState: result.targetRun.state,
      boundary: result.boundary,
    }, null, 2));
  } else {
    const source = fs.readFileSync(file, 'utf8');
    if (command === 'compile') console.log(JSON.stringify(compileReality(source), null, 2));
    else if (command === 'run') console.log(JSON.stringify(await runReality(source), null, 2));
    else if (command === 'native') console.log(JSON.stringify(runRealityNative(source), null, 2));
    else if (command === 'bytecode') {
      const bytecode = compileRealityToBytecode(source);
      const target = output ?? path.join(path.dirname(file), `${path.basename(file, path.extname(file))}.rbc`);
      fs.writeFileSync(target, bytecode);
      console.log(JSON.stringify({ status: 'ok', output: target, bytes: bytecode.length }, null, 2));
    }
  }
} catch (error) {
  console.error(error.stack ?? String(error));
  process.exit(1);
}
