import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runProjectScript } from '../src/experiment-runner.mjs';

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('candidate scripts inherit locked dependencies from their authoritative source', async () => {
  const sourcePath = tempDir('dml-dependency-source-');
  const candidatePath = tempDir('dml-dependency-candidate-');
  const dependencyPath = path.join(sourcePath, 'node_modules', 'fixture-dependency');
  fs.mkdirSync(dependencyPath, { recursive: true });
  fs.writeFileSync(path.join(dependencyPath, 'package.json'), JSON.stringify({ name: 'fixture-dependency', version: '1.0.0', main: 'index.cjs' }), 'utf8');
  fs.writeFileSync(path.join(dependencyPath, 'index.cjs'), 'module.exports = 42;\n', 'utf8');
  fs.writeFileSync(path.join(candidatePath, 'verify.cjs'), "if (require('fixture-dependency') !== 42) process.exit(2);\n", 'utf8');
  fs.writeFileSync(path.join(candidatePath, 'package.json'), JSON.stringify({ name: 'candidate', version: '1.0.0', scripts: { verify: 'node verify.cjs' } }), 'utf8');

  const receipt = await runProjectScript({ projectPath: candidatePath, dependencySourcePath: sourcePath, script: 'verify' });

  assert.equal(receipt.status, 'passed');
  assert.deepEqual(receipt.dependency_roots, [path.join(sourcePath, 'node_modules')]);
});
