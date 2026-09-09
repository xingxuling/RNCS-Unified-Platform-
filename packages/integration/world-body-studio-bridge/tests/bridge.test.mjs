import assert from 'node:assert/strict';
import test from 'node:test';
import { createStudioNetworkWorld } from '../../../../examples/studio-authored-network-world-v03/project.mjs';
import {
  StudioWorldBodyBridgeError,
  compileStudioWorldBodyCandidate,
  createWorldBodyDeclarationFromStudioProject,
  verifyStudioWorldBodyCandidate,
} from '../src/index.mjs';

function fixture() {
  const created = createStudioNetworkWorld();
  return { project: created.session.project, networkCompilation: created.compilation };
}

test('Studio network fixture enters the existing World Body codegen spine', () => {
  const { project, networkCompilation } = fixture();
  const bundle = compileStudioWorldBodyCandidate(project, { networkCompilation });
  assert.equal(verifyStudioWorldBodyCandidate(bundle), true);
  assert.equal(bundle.worldBody.ir.physicalBodyState.bodies.length, 6);
  assert.equal(bundle.worldBody.ir.visualBodyState.bodies.length, 6);
  assert.equal(bundle.worldBody.manifest.metrics.generatedArtifactCount, 9);
  assert.equal(bundle.sidecar.coverage.scene_bound_body_count, 2);
  assert.equal(bundle.sidecar.coverage.synthetic_body_visual_count, 4);
  assert.equal(bundle.sidecar.network.supplied, true);
  assert.equal(bundle.sidecar.source_roots.compilation_root, networkCompilation.compilation_root);
  assert.equal(bundle.authority, 'candidate-artifact-generation-only-no-commit');
  assert.equal(bundle.declaration.world.authorityClass, 'candidate');
  assert.equal(bundle.declaration.world.commitRoot, undefined);
});

test('closed asset-kind lowering and 2D transform preservation are explicit', () => {
  const { project, networkCompilation } = fixture();
  const bundle = compileStudioWorldBodyCandidate(project, { networkCompilation });
  const assetMapping = bundle.sidecar.asset_mappings.find(item => item.source_asset_id === 'asset:studio-network-player');
  assert.equal(assetMapping.source_kind, 'model-3d');
  assert.equal(assetMapping.world_body_kind, 'mesh');
  assert.match(assetMapping.mapping_reason, /lowered/);
  const blue = bundle.sidecar.body_bindings.find(item => item.source_body_id === 'studio-player-blue');
  assert.deepEqual(blue.source_scene_transform, { x: -250, y: -120, rotation_mdeg: 0, scale_x_milli: 1000, scale_y_milli: 1000 });
  const blueEntity = bundle.declaration.entities.find(item => item.physical.bodyId === 'studio-player-blue');
  assert.deepEqual(blueEntity.visual.offset.positionMm, { x: 0, y: 0, z: 0 });
  assert.equal(bundle.sidecar.mapping_policy.source_scene_2d_transform, 'preserved-only-not-converted-to-3d');
});

test('default temporal policy is visible as a reviewable gap', () => {
  const { project, networkCompilation } = fixture();
  const bundle = compileStudioWorldBodyCandidate(project, { networkCompilation });
  assert.equal(bundle.declaration.entities[0].temporal.mode, 'hold');
  assert.ok(bundle.manifest.gaps.some(gap => gap.includes('temporal presentation policy')));
});

test('tampering with generated content invalidates the candidate bundle', () => {
  const { project, networkCompilation } = fixture();
  const bundle = compileStudioWorldBodyCandidate(project, { networkCompilation });
  const tampered = structuredClone(bundle);
  tampered.worldBody.artifacts[0].content += 'tampered';
  assert.equal(verifyStudioWorldBodyCandidate(tampered), false);
});

test('tampering with the declaration cannot be detached from its generated compilation', () => {
  const { project, networkCompilation } = fixture();
  const bundle = compileStudioWorldBodyCandidate(project, { networkCompilation });
  const tampered = structuredClone(bundle);
  tampered.declaration.world.revision = 99;
  assert.equal(verifyStudioWorldBodyCandidate(tampered), false);
});

test('network compilation is optional but its absence remains an explicit gap', () => {
  const { project } = fixture();
  const bundle = compileStudioWorldBodyCandidate(project);
  assert.equal(verifyStudioWorldBodyCandidate(bundle), true);
  assert.equal(bundle.sidecar.network.supplied, false);
  assert.ok(bundle.manifest.gaps.some(gap => gap.includes('network compilation was not supplied')));
});


test('network compilation roots are verified before ingress', () => {
  const { project, networkCompilation } = fixture();
  const tampered = structuredClone(networkCompilation);
  tampered.compilation_root = '0'.repeat(64);
  assert.throws(
    () => createWorldBodyDeclarationFromStudioProject(project, { networkCompilation: tampered }),
    error => error instanceof StudioWorldBodyBridgeError && error.code === 'STUDIO_WB_NETWORK_COMPILATION_INVALID',
  );
});

test('unsupported Studio asset kinds do not silently enter World Body IR', () => {
  const { project, networkCompilation } = fixture();
  const tampered = structuredClone(project);
  tampered.assets.registry['asset:studio-network-player'].kind = 'mystery-3d-container';
  assert.throws(
    () => createWorldBodyDeclarationFromStudioProject(tampered, { networkCompilation }),
    error => error instanceof StudioWorldBodyBridgeError && error.code === 'STUDIO_WB_ASSET_KIND_UNSUPPORTED',
  );
});

test('missing active world is a hard ingress error', () => {
  const { project } = fixture();
  const tampered = structuredClone(project);
  tampered.spatial3d.active_world_id = 'world:missing';
  assert.throws(
    () => createWorldBodyDeclarationFromStudioProject(tampered),
    error => error instanceof StudioWorldBodyBridgeError && error.code === 'STUDIO_WB_ACTIVE_WORLD_MISSING',
  );
});
