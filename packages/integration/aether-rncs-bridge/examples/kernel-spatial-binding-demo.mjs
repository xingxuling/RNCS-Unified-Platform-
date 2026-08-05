import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { materializeKernelStateToRSR, projectKernelStateToReality } from '../src/index.mjs';
import { createKernel } from './kernel-spatial-binding-fixture.mjs';

const outDir = path.resolve(process.argv[2] ?? 'outputs/kernel-rsr-vsr-binding');
const writeJson = (name, value) => writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
const kernel = createKernel();
const batch = kernel.readStateBatch();
const materialization = await materializeKernelStateToRSR(kernel);
const result = await projectKernelStateToReality(kernel, { width: 320, height: 180, qualityTier: 'balanced' });
mkdirSync(outDir, { recursive: true });
writeJson('kernel-state-batch.json', batch);
writeJson('rsr-materialization.json', materialization);
writeJson('rsr-snapshot.json', result.snapshot);
writeJson('scene.vsr3d.json', result.projection.scene);
writeJson('frame-plan.json', result.projection.framePlan);
writeJson('evidence.json', {
  format: 'rncs.kernel-rsr-vsr-binding-evidence.v0.1',
  source: { world_id: batch.world_id, state_root: batch.state_root, batch_root: batch.batch_root },
  roots: result.roots,
  binding_root: result.binding_root,
  frame_verified: result.projection.frameVerified,
  counts: { kernel_entities: batch.rows.length, rsr_bodies: result.snapshot.bodies.length, rsr_fixtures: result.snapshot.bodies.reduce((total, body) => total + body.fixtures.length, 0), vsr_nodes: result.projection.scene.nodes.length, vsr_draws: result.projection.framePlan.stats.visibleDraws },
  deterministic: true
});
writeFileSync(path.join(outDir, 'reference.png'), result.projection.png);
console.log(JSON.stringify({ outDir, ...result.roots, binding_root: result.binding_root, frame_verified: result.projection.frameVerified }, null, 2));
