import test from 'node:test';
import assert from 'node:assert/strict';
import { AetherEarthRuntime } from '../src/index.mjs';

test('creates a deterministic 16x16 Earth with 100 organisms', () => {
  const a = new AetherEarthRuntime({ seed: 1234 });
  const b = new AetherEarthRuntime({ seed: 1234 });
  assert.equal(a.state.world.tiles.length, 256);
  assert.equal(a.state.organisms.length, 100);
  assert.equal(a.encyclopedia.size, 512);
  assert.equal(a.root(), b.root());
});

test('advances organisms and preserves population through generational rebirth', () => {
  const runtime = new AetherEarthRuntime({ seed: 42 });
  const result = runtime.advance(720, { crystalInterval: 60 });
  assert.equal(result.day, 720);
  assert.equal(runtime.state.organisms.length, 100);
  assert.equal(runtime.state.metrics.population, 100);
  assert.ok(runtime.state.metrics.averageEnergy > 0);
  assert.ok(runtime.encyclopedia.size >= 512);
  assert.notEqual(result.beforeRoot, result.afterRoot);
});

test('same seed and schedule produces the same reality root', () => {
  const a = new AetherEarthRuntime({ seed: 90210 });
  const b = new AetherEarthRuntime({ seed: 90210 });
  a.advance(365, { crystalInterval: 45 });
  b.advance(365, { crystalInterval: 45 });
  assert.equal(a.root(), b.root());
  assert.deepEqual(a.report().activeStrategies, b.report().activeStrategies);
});

test('different seeds produce different worlds', () => {
  const a = new AetherEarthRuntime({ seed: 1 });
  const b = new AetherEarthRuntime({ seed: 2 });
  assert.notEqual(a.root(), b.root());
});

test('supports 1x, 10x and 100x logical time', () => {
  const runtime = new AetherEarthRuntime({ seed: 5 });
  runtime.setTimeScale(100);
  runtime.advance(10);
  assert.equal(runtime.state.day, 10);
  assert.equal(runtime.state.logicalTime, 1000);
  assert.throws(() => runtime.setTimeScale(3), /time scale/);
});
