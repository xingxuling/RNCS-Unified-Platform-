import test from 'node:test';
import assert from 'node:assert/strict';
import { runBeyondEngineVerticalSlice } from '../examples/beyond-engine-vertical-slice-v01/runtime.mjs';

test('G1 beyond-engine vertical slice preserves cross-runtime evidence', async () => {
  const first = await runBeyondEngineVerticalSlice({ outDir: 'artifacts/test-beyond-engine-vertical-slice-v01-a' });
  const replay = await runBeyondEngineVerticalSlice({ outDir: 'artifacts/test-beyond-engine-vertical-slice-v01-b' });
  assert.equal(Object.values(first.evidence.acceptance).every(Boolean), true);
  assert.equal(first.evidence.replay_invariant_root, replay.evidence.replay_invariant_root);
  assert.notEqual(first.evidence.composite_root, replay.evidence.composite_root, 'asset sessions keep unique artifact roots');
  assert.equal(first.evidence.metrics.earthOrganisms, 100);
  assert.equal(first.evidence.metrics.rclObjects, 1);
  assert.equal(first.evidence.metrics.rclBehaviors, 1);
  assert.equal(first.evidence.metrics.rclOperations, 1);
  assert.ok(first.assetPreviewPng.byteLength > 100);
  assert.ok(first.spatialPreviewPng.byteLength > 100);
});
