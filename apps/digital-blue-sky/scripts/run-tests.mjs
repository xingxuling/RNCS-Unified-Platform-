#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testsDir = path.join(root, 'tests');
const files = fs.readdirSync(testsDir)
  .filter((name) => name.endsWith('.test.mjs'))
  .sort()
  .map((name) => path.join(testsDir, name));
let failed = 0;
for (const file of files) {
  process.stdout.write(`\n=== ${path.basename(file)} ===\n`);
  const result = spawnSync(process.execPath, ['--test', '--test-concurrency=1', file], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    timeout: 120_000,
  });
  if (result.error) {
    process.stderr.write(`${result.error.code || 'TEST_PROCESS_ERROR'}: ${result.error.message}\n`);
    failed += 1;
    continue;
  }
  if (result.status !== 0) failed += 1;
}
if (failed) {
  process.stderr.write(`\n${failed}/${files.length} test files failed.\n`);
  process.exit(1);
}
process.stdout.write(`\nAll ${files.length} test files passed.\n`);
