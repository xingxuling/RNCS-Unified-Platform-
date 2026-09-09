import assert from 'node:assert/strict';
import test from 'node:test';
import { createStudioNetworkWorld } from '../../../../examples/studio-authored-network-world-v03/project.mjs';
import {
  StudioWorldBodyBridgeError,
  compileStudioWorldBodyAetherProjection,
  compileStudioWorldBodyCandidate,
  createWorldBodyDeclarationFromStudioProject,
  inspectStudioWorldBodyAetherProjection,
  projectStudioWorldBodyCandidateToRealityCell,
  verifyStudioWorldBodyAetherProjection,
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

test('Aether projection reports and blocks semantic losses by default', () => {
  const { project, networkCompilation } = fixture();
  const bundle = compileStudioWorldBodyCandidate(project, { networkCompilation });
  const inspection = inspectStudioWorldBodyAetherProjection(bundle);
  const codes = inspection.losses.map(loss => loss.code);
  assert.equal(codes.includes('RCL_GAP_WB_AETHER_MASS'), false);
  assert.equal(codes.includes('RCL_GAP_WB_AETHER_CHARACTER_FACETS'), false);
  assert.ok(codes.includes('RCL_GAP_WB_AETHER_VISUAL_ASSET_BINDING'));
  assert.ok(codes.includes('RCL_GAP_WB_AETHER_NETWORK_BINDING'));
  assert.throws(
    () => compileStudioWorldBodyAetherProjection(bundle),
    error => error instanceof StudioWorldBodyBridgeError && error.code === 'STUDIO_WB_AETHER_LOSSY_PROJECTION_BLOCKED',
  );
});

test('explicit lossy Aether projection executes the existing RSR, Cell, and VSR runtime', async () => {
  const { project, networkCompilation } = fixture();
  const bundle = compileStudioWorldBodyCandidate(project, { networkCompilation });
  const projection = compileStudioWorldBodyAetherProjection(bundle, { allowLossyProjection: true });
  const bodyIds = projection.batch.entity_ids;
  const dynamicBody = bundle.worldBody.ir.physicalBodyState.bodies.find(body => body.kind === 'dynamic');
  assert.ok(dynamicBody);
  const dynamicRow = projection.batch.rows.find(row => row.entity_id === dynamicBody.entityId);
  assert.equal(dynamicRow.fragments['spatial.body'].mass_q, dynamicBody.massGrams * 1000);
  const result = await projectStudioWorldBodyCandidateToRealityCell(bundle, {
    allowLossyProjection: true,
    cellCatalog: [{ id: 'cell:studio-world', center: [0, 0, 0], radius: 1_000_000, bodyIds, priority: 10 }],
    observerPosition: [0, 0, 0],
    cameraPosition: [7, 5, 9],
    focusBodyIds: bodyIds,
    causalBodyIds: bodyIds,
    maxObjects: bodyIds.length,
    width: 320,
    height: 180,
    qualityTier: 'balanced',
  });
  assert.equal(result.projectionRoot, projection.projectionRoot);
  assert.equal(result.receipt.cellStateVerified, true);
  assert.equal(verifyStudioWorldBodyAetherProjection(result), true);
  assert.equal(result.runtime.snapshot.bodies.length, bodyIds.length);
  assert.equal(result.runtime.snapshot.bodies.reduce((sum, body) => sum + body.fixtures.length, 0), bodyIds.length);
  assert.equal(result.runtime.snapshot.bodies.find(body => body.id === dynamicBody.entityId).massQ, dynamicBody.massGrams * 1000);
  assert.deepEqual(result.runtime.snapshot.characters.map(character => character.id), ['studio-character:blue', 'studio-character:red', 'subject:player']);
  assert.equal(result.runtime.snapshot.characters.find(character => character.id === 'subject:player').bodyId, 'entity:studio:avatar');
  assert.equal(result.runtime.cellState.activeCellIds.includes('cell:studio-world'), true);
  assert.equal(typeof result.runtime.projection.framePlan.frameRoot, 'string');
  assert.equal(typeof result.runtime.projection.pixelRoot, 'string');
});

test('Aether projection receipt tampering is detected', async () => {
  const { project, networkCompilation } = fixture();
  const bundle = compileStudioWorldBodyCandidate(project, { networkCompilation });
  const projection = compileStudioWorldBodyAetherProjection(bundle, { allowLossyProjection: true });
  const result = await projectStudioWorldBodyCandidateToRealityCell(bundle, {
    allowLossyProjection: true,
    cellCatalog: [{ id: 'cell:studio-world', center: [0, 0, 0], radius: 1_000_000, bodyIds: projection.batch.entity_ids }],
    observerPosition: [0, 0, 0],
    cameraPosition: [7, 5, 9],
    maxObjects: projection.batch.entity_ids.length,
    width: 160,
    height: 96,
    qualityTier: 'economy',
  });
  const tampered = structuredClone(result);
  tampered.receipt.runtimeRoots.vsr_frame_root = '0'.repeat(64);
  assert.equal(verifyStudioWorldBodyAetherProjection(tampered), false);
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
