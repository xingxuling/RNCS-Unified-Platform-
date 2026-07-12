import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('stdio runtime responds to Gateway-style invocation', () => {
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'dml-stdio-'));
  const run = spawnSync(process.execPath, [path.join(root, 'src/stdio-runtime.mjs')], {
    input: JSON.stringify({ action: 'health', payload: {} }) + '\n',
    encoding: 'utf8', env: { ...process.env, DML_STATE_DIR: state },
  });
  assert.equal(run.status, 0, run.stderr);
  const parsed = JSON.parse(run.stdout.trim());
  assert.equal(parsed.result.status, 'ok');
  assert.equal(parsed.result.protocol, 'dml.runtime.v0.5');
});
