import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { ComputeRouter } from '../src/routing/compute-router.mjs';
import { GameBrainAdapter } from '../src/adapters/gamebrain.mjs';

test('Compute Router selects configured GameBrain and never implies Ollama fallback', () => {
  const router = new ComputeRouter({
    config: { reasoningMode: 'host' },
    adapters: {
      updia: { configured: () => true },
      rcl: {},
      rncs: {},
      gamebrain: { status: () => ({ configured: true, limitations: [] }) },
    },
  });
  const route = router.route({ taskType: 'world_simulation', seed: 'seed.json', ticks: 42, actors: 4, deadlineMs: 5_000 });
  assert.equal(route.decision.status, 'selected');
  assert.equal(route.decision.selectedResource, 'gamebrain.world-simulator');
  assert.equal(route.budget.ticks, 42);
  assert.equal(route.budget.actors, 4);
  assert.equal(route.budget.deadlineMs, 5_000);
  assert.equal(route.fallbackPolicy, 'explicit_only_no_implicit_ollama');
  assert.equal(route.resourceSnapshot.resources.find((resource) => resource.resourceId === 'ollama.generation').implicit, false);
});

test('Compute Router reports missing or unavailable GameBrain explicitly', () => {
  const router = new ComputeRouter({ config: { reasoningMode: 'host' }, adapters: { gamebrain: { status: () => ({ configured: false, limitations: ['not configured'] }) } } });
  const missingSeed = router.route({ taskType: 'world_simulation' });
  assert.equal(missingSeed.decision.status, 'needs_input');
  assert.equal(missingSeed.decision.code, 'COMPUTE_REQUIRED_INPUT_MISSING');

  const unavailable = router.route({ taskType: 'world_simulation', seed: 'seed.json' });
  assert.equal(unavailable.decision.status, 'resource_unavailable');
  assert.equal(unavailable.decision.code, 'GAMEBRAIN_NOT_CONFIGURED');
  assert.equal(unavailable.decision.selectedResource, null);
  assert.equal(unavailable.resourceSnapshot.resources.find((resource) => resource.resourceId === 'ollama.generation').available, false);
});

test('GameBrain adapter validates actor budget and returns replay evidence hashes', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'turi-gamebrain-test-'));
  try {
    const cli = path.join(root, 'gamebrain-cli.mjs');
    const seed = path.join(root, 'seed.json');
    fs.writeFileSync(cli, '// fake GameBrain CLI\n');
    fs.writeFileSync(seed, JSON.stringify({ actors: { alpha: {}, beta: {} } }));
    const spawn = (_command, args) => {
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = () => {};
      queueMicrotask(() => {
        const output = args[args.indexOf('--output') + 1];
        fs.writeFileSync(output, JSON.stringify({ status: 'ok', ticks: Number(args[args.indexOf('--ticks') + 1]) }));
        child.stdout.emit('data', Buffer.from('fake gamebrain output\n'));
        child.emit('close', 0);
      });
      return child;
    };
    const adapter = new GameBrainAdapter({ config: { gamebrainRoot: root, gamebrainCli: cli }, dataDir: root, spawn });
    const result = await adapter.simulate({ seed: 'seed.json', ticks: 3, actors: 2 }, { timeoutMs: 5_000 });
    assert.equal(result.status, 'completed');
    assert.equal(result.ticks, 3);
    assert.equal(result.actors, 2);
    assert.equal(result.actorBudget, 2);
    assert.match(result.seedHash, /^sha256:/);
    assert.match(result.outputHash, /^sha256:/);

    await assert.rejects(
      () => adapter.simulate({ seed: 'seed.json', ticks: 3, actors: 1 }, { timeoutMs: 5_000 }),
      (error) => error.code === 'GAMEBRAIN_ACTOR_BUDGET_EXCEEDED',
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
