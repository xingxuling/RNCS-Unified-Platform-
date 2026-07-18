import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runStudioAuthoredNetworkWorldV03 } from '../examples/studio-authored-network-world-v03/runtime.mjs';

test('Studio-authored GLB world compiles into deterministic two-client authority and changes under editor mutation', async context => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rncs-studio-network-v03-'));
  context.after(() => fs.rmSync(outDir, { recursive: true, force: true }));
  const result = await runStudioAuthoredNetworkWorldV03({ outDir });

  assert.equal(result.audit.status, 'pass');
  assert.ok(Object.values(result.package.acceptance).every(Boolean));
  assert.equal(result.network.evidence.evidence_root, result.replay.evidence.evidence_root);
  assert.equal(result.network.finalSnapshot.stateRoot, result.replay.finalSnapshot.stateRoot);
  assert.notEqual(result.counterfactual.source_compilation_root, result.counterfactual.edited_compilation_root);
  assert.notEqual(result.counterfactual.source_initial_state_root, result.counterfactual.edited_initial_state_root);
  assert.equal(result.viewport.imported_asset_count, 2);
  assert.ok(result.viewport.asset_draw_count >= 2);
  assert.ok(result.viewportPng.byteLength > 100);
  for (const file of [
    'studio-project.json',
    'network-world-compilation.json',
    'network-runtime-evidence.json',
    'network-replay-evidence.json',
    'authoritative-snapshot.json',
    'viewport-receipt.json',
    'editor-counterfactual.json',
    'studio-network-package.json',
    'audit-report.json',
    'performance-report.json',
    'authoritative-viewport.png',
  ]) {
    assert.ok(fs.existsSync(path.join(outDir, file)), file);
  }
});
