import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AetherEarthRuntime } from '@taowind/aether-earth-runtime';
import { RealityOneGateway } from '../packages/control/reality-one-gateway/src/gateway.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Aether Earth runs 100 small-data organisms with reversible reality compression', () => {
  const runtime = new AetherEarthRuntime({ seed: 197 });
  runtime.advance(120, { crystalInterval: 30 });
  const capsule = runtime.compress();
  const restored = AetherEarthRuntime.fromCapsule(capsule);
  assert.equal(runtime.state.organisms.length, 100);
  assert.ok(runtime.encyclopedia.size >= 512);
  assert.ok(runtime.state.crystals.length > 0);
  assert.equal(restored.root(), runtime.root());
});

test('Reality One Gateway discovers and invokes Aether Earth', async () => {
  const gateway = new RealityOneGateway({
    manifestDirs: [path.join(ROOT, 'packages/control/reality-one-gateway/runtimes')],
    dataDir: path.join(ROOT, 'artifacts/aether-earth-gateway-test'),
  });
  const registry = await gateway.discover();
  assert.ok(registry.runtime_order.includes('rncs.aether-earth'));
  const health = await gateway.invoke('rncs.aether-earth', 'health');
  assert.equal(health.status, 'ok');
  assert.equal(health.organisms, 100);
  const report = await gateway.invoke('rncs.aether-earth', 'advance', { days: 5 });
  assert.equal(report.day, 5);
});
