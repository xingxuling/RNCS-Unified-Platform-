import test from 'node:test';
import assert from 'node:assert/strict';
import { materializeKernelStateToRSR, projectKernelStateToReality } from '../src/index.mjs';
import { createKernel } from '../examples/kernel-spatial-binding-fixture.mjs';

test('Kernel batch materializes into authoritative RSR bodies and fixtures', async () => {
  const value = createKernel();
  const batch = value.readStateBatch();
  const materialization = await materializeKernelStateToRSR(value);
  assert.equal(materialization.source.state_root, batch.state_root);
  assert.equal(materialization.source.batch_root, batch.batch_root);
  assert.deepEqual(materialization.config.bodies.map(body => body.id), ['body:crate', 'body:ground']);
  assert.equal(materialization.config.bodies[0].data.kernel_entity_id, 'body:crate');
  assert.equal(materialization.config.bodies[0].fixtures[0].id, 'fixture:body:crate');
  assert.equal(materialization.config.reality.realityRoot, batch.state_root);
  assert.equal(materialization.entity_bindings.length, 2);
  assert.match(materialization.binding_root, /^fnv1a64:[0-9a-f]{16}$/);
});

test('Kernel to RSR to VSR preserves roots and renders a verified frame', async () => {
  const value = createKernel();
  const first = await projectKernelStateToReality(value, { width: 160, height: 90, qualityTier: 'economy' });
  const second = await projectKernelStateToReality(value, { width: 160, height: 90, qualityTier: 'economy' });
  assert.equal(first.roots.kernel_state_root, value.readStateBatch().state_root);
  assert.equal(first.snapshot.reality.realityRoot, first.roots.kernel_state_root);
  assert.equal(first.snapshot.bodies.find(body => body.id === 'body:crate').data.kernel_entity_id, 'body:crate');
  assert.ok(first.projection.scene.nodes.find(node => node.id === 'body:body:crate').tags.includes('kernel-entity:body:crate'));
  assert.equal(first.projection.frameVerified, true);
  assert.ok(first.projection.png.byteLength > 100);
  assert.match(first.roots.rsr_state_root, /^fnv1a64:[a-f0-9]{16}$/);
  assert.match(first.roots.vsr_frame_root, /^[a-f0-9]+$/);
  assert.match(first.roots.vsr_pixel_root, /^[a-f0-9]{64}$/);
  assert.equal(first.binding_root, second.binding_root);
  assert.equal(first.projection.framePlan.frameRoot, second.projection.framePlan.frameRoot);
  assert.equal(first.projection.pixelRoot, second.projection.pixelRoot);
});

test('bridge rejects a tampered sealed Kernel batch before RSR materialization', async () => {
  const batch = createKernel().readStateBatch();
  const tampered = structuredClone(batch);
  tampered.rows[0].tags.push('tampered');
  await assert.rejects(() => materializeKernelStateToRSR(tampered), /KERNEL_STATE_BATCH_ROOT_MISMATCH/);
});
