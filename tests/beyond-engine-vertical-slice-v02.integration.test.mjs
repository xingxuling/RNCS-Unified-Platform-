import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { runBeyondEngineVerticalSliceV02 } from '../examples/beyond-engine-vertical-slice-v02/runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(root, 'output');
const gameBrainModulePath = path.resolve(root, '..', 'zhinao', 'src', 'index.mjs');

test('v0.2 refuses to claim G1 without a real GameBrain provider', async () => {
  const outDir = path.join(outputRoot, 'beyond-engine-v02-provider-required');
  await assert.rejects(
    () => runBeyondEngineVerticalSliceV02({ outDir, gameBrainModulePath: '' }),
    /GAMEBRAIN_PROVIDER_REQUIRED/,
  );
  safeRemove(outDir);
});

test('sovereign world package binds GameBrain, RNCS, assets, network and product targets', async (context) => {
  if (!fs.existsSync(gameBrainModulePath)) {
    context.skip(`real sibling GameBrain provider missing: ${gameBrainModulePath}`);
    return;
  }
  const outDir = path.join(outputRoot, `beyond-engine-v02-${process.pid}`);
  safeRemove(outDir);
  context.after(() => safeRemove(outDir));
  const first = await runBeyondEngineVerticalSliceV02({ outDir, gameBrainModulePath });
  const replay = await runBeyondEngineVerticalSliceV02({ outDir, gameBrainModulePath });

  assert.equal(first.audit.status, 'pass');
  assert.ok(Object.values(first.package.acceptance).every(Boolean));
  assert.equal(first.package.package_root, replay.package.package_root);
  assert.equal(first.executable.replay.ok, true);
  assert.equal(first.executable.headless.health.status, 'healthy');
  assert.equal(first.executable.headless.replay.replay_root, first.build.runtime_replay_root);
  assert.deepEqual(first.build.targets.map((target) => target.target), [
    'web-release',
    'windows-portable',
    'headless-server',
    'replay-bundle',
  ]);
  assert.ok(first.spatialPreviewPng.byteLength > 100);
  assert.ok(fs.existsSync(path.join(outDir, 'sovereign-world-package.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'audit-report.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'build', 'web-release', 'index.html')));
  assert.ok(fs.existsSync(path.join(outDir, 'build', 'headless-server', 'server.mjs')));
  assert.ok(fs.existsSync(path.join(outDir, 'build', 'replay-bundle', 'verify-replay.mjs')));
});

function safeRemove(target) {
  const resolved = path.resolve(target);
  const allowed = `${path.resolve(outputRoot)}${path.sep}`;
  if (!resolved.startsWith(allowed)) throw new Error(`unsafe test output path: ${resolved}`);
  fs.rmSync(resolved, { recursive: true, force: true });
}
