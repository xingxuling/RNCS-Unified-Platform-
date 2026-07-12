import test from 'node:test';
import assert from 'node:assert/strict';
import { AetherEarthRuntime, buildCrystalSource, selectCrystalCandidate } from '../src/index.mjs';

test('selects a supported collective pattern', () => {
  const ledger = new Map([
    ['temperate|forage', { climate: 'temperate', action: 'forage', count: 30, reward: 120 }],
    ['arid|experiment', { climate: 'arid', action: 'experiment', count: 8, reward: 2 }],
  ]);
  const candidate = selectCrystalCandidate(ledger);
  assert.equal(candidate.climate, 'temperate');
  assert.equal(candidate.action, 'forage');
  assert.equal(candidate.averageReward, 4);
});

test('builds executable RCL source for the candidate', () => {
  const source = buildCrystalSource({ climate: 'temperate', action: 'forage', count: 30, averageReward: 4 }, 1);
  assert.match(source.source, /reality CollectiveCrystal_1/);
  assert.match(source.source, /crystal\.confidence/);
});

test('collective intelligence creates native-verified runnable crystals', () => {
  const runtime = new AetherEarthRuntime({ seed: 20260704 });
  runtime.advance(240, { crystalInterval: 30 });
  assert.ok(runtime.state.crystals.length >= 1);
  const crystal = runtime.state.crystals[0];
  assert.equal(crystal.nativeState['crystal.candidate'], true);
  assert.equal(typeof crystal.bytecodeHash, 'string');
  assert.equal(crystal.bytecodeHash.length, 64);
  assert.ok(crystal.instructionCount >= 8);
  assert.equal(crystal.promoted, true);
  assert.ok(runtime.state.activeStrategies.length >= 1);
});
