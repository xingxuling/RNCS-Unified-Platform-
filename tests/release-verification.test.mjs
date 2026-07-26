import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test('release verification audits tracked source instead of local installed dependencies', () => {
  const result = spawnSync(process.execPath, ['scripts/verify-release.mjs'], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.valid, true);
  assert.equal(report.inventory, 'git-index');
  assert.deepEqual(report.banned, []);
  assert.deepEqual(report.duplicates, []);
});
