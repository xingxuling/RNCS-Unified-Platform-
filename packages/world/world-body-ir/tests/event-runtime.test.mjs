import assert from 'node:assert/strict';
import test from 'node:test';
import { minimalWorldBodyIR } from '../examples/minimal-world-body.mjs';
import {
  createWorldBodyEventDeliveryPlan,
  createWorldBodyEventRuntime,
} from '../src/event-runtime.mjs';

test('shared World Body event delivery plan retains authority, order and tick', () => {
  const plan = createWorldBodyEventDeliveryPlan(minimalWorldBodyIR);
  assert.equal(plan.sourceWorldBodyRoot, minimalWorldBodyIR.roots.worldBodyRoot);
  assert.deepEqual(plan.deliveries.map(item => [item.tick, item.sequence, item.consumer, item.target]), [
    [12, 0, 'animation', 'animation:hero-land'],
    [12, 0, 'audio', 'audio:hero-contact'],
  ]);
  assert.ok(plan.deliveries.every(item => item.sourceAuthorityRoot === minimalWorldBodyIR.authorityState.sourceRealityRoot));
  assert.equal(new Set(plan.deliveries.map(item => item.deliveryKey)).size, plan.deliveries.length);
});

test('event runtime fails closed, retries after provider admission and suppresses duplicate delivery', () => {
  const calls = [];
  const runtime = createWorldBodyEventRuntime({ ir: minimalWorldBodyIR });
  const blocked = runtime.dispatchTick(12);
  assert.deepEqual(blocked.receipts.map(item => item.status), ['blocked-provider', 'blocked-provider']);
  runtime.setProvider('audio', {
    providerId: 'test.audio-provider',
    deliver: ({ delivery }) => { calls.push(delivery.deliveryKey); return { status: 'delivered' }; },
  });
  const delivered = runtime.dispatchTick(12);
  assert.equal(delivered.receipts.find(item => item.consumer === 'audio').status, 'delivered');
  assert.equal(delivered.receipts.find(item => item.consumer === 'animation').status, 'blocked-provider');
  const duplicate = runtime.dispatchTick(12);
  assert.equal(duplicate.receipts.find(item => item.consumer === 'audio').status, 'duplicate-suppressed');
  assert.equal(calls.length, 1);
  assert.equal(runtime.snapshot().deliveredKeys.length, 1);
});

test('event runtime dispatch roots are deterministic for the same provider result', () => {
  const create = () => createWorldBodyEventRuntime({
    ir: minimalWorldBodyIR,
    providers: {
      audio: { providerId: 'test.audio-provider', deliver: () => ({ status: 'delivered' }) },
      animation: { providerId: 'test.animation-provider', deliver: () => ({ status: 'delivered' }) },
    },
  });
  const left = create().dispatchTick(12);
  const right = create().dispatchTick(12);
  assert.deepEqual(left, right);
});

test('provider rejection and errors stay uncommitted until a later accepted attempt', () => {
  const runtime = createWorldBodyEventRuntime({ ir: minimalWorldBodyIR });
  runtime.setProvider('audio', { providerId: 'audio-rejecting', deliver: () => ({ status: 'blocked' }) });
  assert.equal(runtime.dispatchTick(12).receipts.find(receipt => receipt.consumer === 'audio')?.status, 'provider-rejected');
  runtime.setProvider('audio', { providerId: 'audio-failing', deliver: () => { throw new Error('decoder unavailable'); } });
  assert.equal(runtime.dispatchTick(12).receipts.find(receipt => receipt.consumer === 'audio')?.status, 'provider-error');
  runtime.setProvider('audio', { providerId: 'audio-ready', deliver: () => ({ status: 'delivered' }) });
  assert.equal(runtime.dispatchTick(12).receipts.find(receipt => receipt.consumer === 'audio')?.status, 'delivered');
  assert.equal(runtime.snapshot().deliveredKeys.length, 1);
});
