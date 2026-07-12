import test from 'node:test';
import assert from 'node:assert/strict';
import { AetherEarthRuntime } from '../src/index.mjs';

test('losslessly compresses and restores an evolved world', () => {
  const runtime = new AetherEarthRuntime({ seed: 8181 });
  runtime.advance(180, { crystalInterval: 45 });
  const capsule = runtime.compress();
  const restored = AetherEarthRuntime.fromCapsule(capsule);
  assert.equal(capsule.reversible, true);
  assert.ok(capsule.compressedBytes < capsule.originalBytes);
  assert.equal(restored.root(), runtime.root());
  assert.deepEqual(restored.report(), runtime.report());
});

test('detects capsule corruption through reality root mismatch', () => {
  const runtime = new AetherEarthRuntime({ seed: 9191 });
  runtime.advance(10);
  const capsule = runtime.compress();
  const corrupted = { ...capsule, realityRoot: '0'.repeat(64) };
  assert.throws(() => AetherEarthRuntime.fromCapsule(corrupted), /root mismatch/);
});
