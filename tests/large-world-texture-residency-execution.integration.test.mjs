import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE,
  LARGE_WORLD_SPATIAL_GLB_TEXTURE_RESIDENCY_PROFILE,
  LargeWorldRuntime,
  createLargeWorldSpatialGlbBundle,
  resolveLargeWorldTextureResidency,
  verifyLargeWorldSpatialGlbBundle,
  verifyLargeWorldSpatialScene,
  verifyLargeWorldTextureResidency,
  verifyPortfolioSelectionEnvelope
} from '@taowind/large-world-runtime';
import {
  VSRSpatialAssetStreamer,
  applySpatialTextureResidency,
  compileSpatialFrame,
  renderSpatialReference,
  verifySpatialAssetStreamingReceipt,
  verifySpatialFrame,
  verifySpatialTextureResidencyReceipt
} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {decodeGltfImageToSpatialTexture, importGlbToSpatialSceneAsync, verifyGltfImportReceipt} from '@taowind/visual-state-runtime/gltf-asset';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_TEXTURE_RESIDENCY_EXECUTION_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_TEXTURE_RESIDENCY_EXECUTION'));

function lowerTextureSet(scene, textureResidency, input) {
  const maps = Array.isArray(textureResidency.maps) ? textureResidency.maps : [textureResidency];
  assert.equal(maps.length, scene.textures?.length ?? 0);
  const plans = maps.map(map => resolveLargeWorldTextureResidency({...textureResidency, ...map, levels: map.levels}, input));
  const selections = scene.textures.map((texture, index) => {
    const plan = plans[index];
    return applySpatialTextureResidency(texture, {
      selectedLevel: plan.selected_level,
      residentLevels: plan.resident_levels,
      planRoot: plan.root
    });
  });
  return {
    scene: {...scene, textures: selections.map(selection => selection.texture)},
    plans,
    receipts: selections.map(selection => selection.receipt)
  };
}

function configurePresentation(scene) {
  return {
    ...scene,
    background: '#07111e',
    cameras: scene.cameras.map((camera, index) => index === 0 ? {...camera, transform: {translation: [32, 14, 78], rotationEulerDeg: [-18, 0, 0]}} : camera),
    lights: [
      {id: 'light:residency:ambient', kind: 'ambient', color: '#d9e7ff', intensity: .35},
      {id: 'light:residency:sun', kind: 'directional', color: '#fff0ce', intensity: 1.2, direction: [-.45, -1, -.35], castShadow: false}
    ]
  };
}

function selectionReport(selection, rendered) {
  return {
    plans: selection.plans.map(plan => ({root: plan.root, selected_level: plan.selected_level, resident_levels: plan.resident_levels, prefetch_levels: plan.prefetch_levels})),
    receipts: selection.receipts.map(receipt => ({texture_id: receipt.textureId, root: receipt.root, source_root: receipt.sourceRoot, texture_root: receipt.textureRoot, selected_level: receipt.selectedLevel, resident_levels: receipt.residentLevels, deferred_levels: receipt.deferredLevels, source_level_count: receipt.sourceLevelCount, retained_level_count: receipt.retainedLevelCount, source_byte_length: receipt.sourceByteLength, retained_byte_length: receipt.retainedByteLength, plan_root: receipt.planRoot})),
    frame_root: rendered.framePlan.frameRoot,
    texture_root: rendered.framePlan.textureRoot,
    texture_resources: rendered.framePlan.resources.filter(resource => resource.kind === 'texture-2d').map(resource => ({id: resource.id, byte_length: resource.byteLength, mip_level_count: resource.mipLevelCount, resource_root: resource.resourceRoot})),
    material_texture_bindings: rendered.framePlan.stats.materialTextureBindings,
    triangle_count: rendered.framePlan.stats.triangleCount,
    pixel_root: rendered.pixelRoot
  };
}

test('executes URRF mip residency plans through VSR frame resources and pixels', async () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-large-world-texture-residency-execution',
    seed: 'seed:urrf-large-world-texture-residency-execution',
    width: 5,
    depth: 5,
    chunkSize: 64,
    sampleResolution: 8,
    loadRadius: 1,
    unloadRadius: 2,
    maxActiveChunks: 9
  });
  const stream = runtime.observe({x: 0, z: 0});
  const active = runtime.listActiveChunks();
  const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: Object.fromEntries(active.map(chunk => [chunk.chunk_id, 'STANDARD']))});
  assert.equal(verifyPortfolioSelectionEnvelope(selection).valid, true);
  const scene = runtime.createSpatialScene({
    selection,
    scene_id: 'urrf-large-world-texture-residency-execution-v01',
    visual_scale: 1,
    evidence_root: rootHash({stream_root: stream.stream_root, selection_root: selection.selection_root, renderer: 'vsr-ragf-pbr-mip-execution'})
  });
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);
  const bundle = createLargeWorldSpatialGlbBundle(scene, {texture_profile: LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE, texture_size: 32});
  assert.equal(verifyLargeWorldSpatialGlbBundle(bundle, {sceneRoot: scene.scene_root}).valid, true);
  assert.equal(bundle.manifest.texture_residency_profile, LARGE_WORLD_SPATIAL_GLB_TEXTURE_RESIDENCY_PROFILE);
  const byId = new Map(bundle.assets.map(entry => [entry.record.id, entry]));
  const catalog = bundle.assets.map(entry => entry.record);
  const totalBytes = catalog.reduce((sum, asset) => sum + asset.byteLength, 0);
  const streamer = new VSRSpatialAssetStreamer(catalog, asset => byId.get(asset.id).payload, {maxConcurrent: 4});
  const streamingReceipt = await streamer.acquire({
    activeCellIds: scene.streaming.cells.map(cell => cell.id),
    requestedAssetIds: bundle.manifest.asset_ids,
    maxAssets: catalog.length,
    maxBytes: totalBytes,
    lease: false
  });
  assert.equal(verifySpatialAssetStreamingReceipt(streamingReceipt), true);
  assert.equal(streamingReceipt.failedAssetIds.length, 0);
  assert.equal(streamingReceipt.blockedAssetIds.length, 0);
  assert.equal(streamingReceipt.readyAssetIds.length, catalog.length);
  const sourceEntry = bundle.assets.find(entry => entry.record.metadata.lod === 0);
  assert.ok(sourceEntry);
  const worldMetadata = sourceEntry.record.metadata;
  const textureResidency = worldMetadata.texture_residency;
  assert.equal(textureResidency.maps.length, 4);
  assert.deepEqual(textureResidency.maps.map(map => map.map_role), ['base-color', 'normal', 'metallic-roughness', 'emissive']);
  const imported = await importGlbToSpatialSceneAsync(sourceEntry.payload, {
    sceneId: 'urrf-large-world-texture-residency-execution-import-v01',
    sourceRoot: scene.scene_root,
    imageDecoder: input => decodeGltfImageToSpatialTexture(input)
  });
  assert.equal(verifyGltfImportReceipt(imported.receipt), true);
  assert.equal(imported.receipt.textureCount, 4);
  assert.equal(imported.receipt.materialTextureBindingCount, 5);
  assert.equal(imported.receipt.warnings.length, 0);
  assert.equal(imported.scene.textures?.every(texture => texture.width === 32 && texture.height === 32 && texture.mipmaps?.length === 5), true);
  const nearSelection = lowerTextureSet(imported.scene, textureResidency, {distance_m: 18, screen_coverage_percent: 92});
  const farSelection = lowerTextureSet(imported.scene, textureResidency, {distance_m: 260, screen_coverage_percent: 12});
  assert.equal(nearSelection.plans.every(plan => verifyLargeWorldTextureResidency(plan) && plan.selected_level === 0), true);
  assert.equal(farSelection.plans.every(plan => verifyLargeWorldTextureResidency(plan) && plan.selected_level === 2), true);
  assert.equal(nearSelection.receipts.every(receipt => verifySpatialTextureResidencyReceipt(receipt)), true);
  assert.equal(farSelection.receipts.every(receipt => verifySpatialTextureResidencyReceipt(receipt)), true);
  assert.equal(nearSelection.scene.textures.every(texture => texture.width === 32 && texture.mipmaps === undefined), true);
  assert.equal(farSelection.scene.textures.every(texture => texture.width === 8 && texture.mipmaps === undefined), true);
  assert.equal(imported.scene.textures.every(texture => texture.width === 32 && texture.mipmaps?.length === 5), true);
  const nearScene = configurePresentation(nearSelection.scene);
  const farScene = configurePresentation(farSelection.scene);
  const nearFrame = compileSpatialFrame(nearScene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
  const farFrame = compileSpatialFrame(farScene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
  assert.equal(verifySpatialFrame(nearFrame).ok, true);
  assert.equal(verifySpatialFrame(farFrame).ok, true);
  assert.equal(nearFrame.stats.materialTextureBindings, 5);
  assert.equal(farFrame.stats.materialTextureBindings, 5);
  assert.equal(nearFrame.geometryRoot, farFrame.geometryRoot);
  assert.equal(nearFrame.sourceRealityRoot, farFrame.sourceRealityRoot);
  assert.notEqual(nearFrame.textureRoot, farFrame.textureRoot);
  assert.equal(nearFrame.resources.filter(resource => resource.kind === 'texture-2d').every(resource => resource.mipLevelCount === 1 && resource.byteLength === 32 * 32 * 4), true);
  assert.equal(farFrame.resources.filter(resource => resource.kind === 'texture-2d').every(resource => resource.mipLevelCount === 1 && resource.byteLength === 8 * 8 * 4), true);
  const nearRendered = renderSpatialReference(nearScene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
  const farRendered = renderSpatialReference(farScene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
  assert.equal(verifySpatialFrame(nearRendered.framePlan).ok, true);
  assert.equal(verifySpatialFrame(farRendered.framePlan).ok, true);
  assert.equal(nearRendered.framePlan.sourceRealityRoot, farRendered.framePlan.sourceRealityRoot);
  assert.notEqual(nearRendered.pixelRoot, farRendered.pixelRoot);
  const reportBase = {
    format: 'urrf.large-world-texture-residency-execution-report.v0.1',
    world_id: scene.large_world.world_id,
    scene_root: scene.scene_root,
    selection_root: selection.selection_root,
    manifest_root: bundle.manifest.manifest_root,
    bundle_root: bundle.bundle_root,
    asset_count: bundle.manifest.asset_count,
    total_bytes: totalBytes,
    texture_profile: bundle.manifest.texture_profile,
    texture_residency_profile: bundle.manifest.texture_residency_profile,
    source_asset_id: sourceEntry.record.id,
    source_texture_level_count: worldMetadata.texture_level_count,
    source_texture_byte_length: worldMetadata.texture_byte_length,
    source_texture_roles: worldMetadata.texture_roles,
    source_texture_color_spaces: worldMetadata.texture_color_spaces,
    source_imported_texture_count: imported.scene.textures.length,
    source_imported_mip_count: imported.scene.textures[0].mipmaps?.length ?? 0,
    source_material_texture_binding_count: imported.receipt.materialTextureBindingCount,
    near: selectionReport(nearSelection, nearRendered),
    far: selectionReport(farSelection, farRendered),
    texture_bytes_saved_far_vs_near: nearFrame.resources.filter(resource => resource.kind === 'texture-2d').reduce((sum, resource) => sum + resource.byteLength, 0) - farFrame.resources.filter(resource => resource.kind === 'texture-2d').reduce((sum, resource) => sum + resource.byteLength, 0),
    streaming_root: streamingReceipt.resolution.root,
    streaming_receipt_root: streamingReceipt.receiptRoot,
    imported_gltf_receipt_root: imported.receipt.receiptRoot,
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', execution_owner: 'VSR', encoder_provider: 'RAGF', provider_can_write_authoritative_world_state: false, candidate_only: true, authoritative: false},
    notes: 'Candidate-only execution of URRF progressive mip plans: RAGF native RGBA8 KTX2 PBR maps are decoded to VSR, near/far selected levels are lowered into separate presentation resources, frame texture byte/mip roots change, geometry and source reality roots remain stable, and CPU reference pixels differ. The selected-only VSR resource keeps deferred levels out of the executor input; BasisU supercompression, target-device/GPU timing, CDN delivery, and production-scale performance remain unproven.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'large-world-texture-residency-execution-manifest.json'), `${JSON.stringify(bundle.manifest, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-texture-residency-execution-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-texture-residency-execution-near.png'), nearRendered.png);
  writeFileSync(join(outputDir, 'large-world-texture-residency-execution-far.png'), farRendered.png);
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'large-world-texture-residency-execution-near.png')).byteLength > 1000);
  assert.ok(readFileSync(join(outputDir, 'large-world-texture-residency-execution-far.png')).byteLength > 1000);
});
