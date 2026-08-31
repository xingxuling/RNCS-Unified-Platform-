import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE,
  LARGE_WORLD_SPATIAL_GLB_TEXTURE_RESIDENCY_PROFILE,
  LargeWorldRuntime,
  createLargeWorldSpatialGlbBundle,
  resolveLargeWorldTextureResidency,
  verifyLargeWorldTextureResidency,
  verifyLargeWorldSpatialGlbBundle,
  verifyLargeWorldSpatialScene,
  verifyPortfolioSelectionEnvelope
} from '@taowind/large-world-runtime';
import {
  VSRSpatialAssetStreamer,
  compileSpatialFrame,
  renderSpatialReference,
  verifySpatialAssetStreamingReceipt,
  verifySpatialFrame
} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {decodeGltfImageToSpatialTexture, importGlbToSpatialSceneAsync, verifyGltfImportReceipt} from '@taowind/visual-state-runtime/gltf-asset';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_TEXTURE_RESIDENCY_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_TEXTURE_RESIDENCY'));

test('streams and imports progressive KTX2 texture residency for a large-world GLB candidate', async () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-large-world-texture-residency',
    seed: 'seed:urrf-large-world-texture-residency',
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
    scene_id: 'urrf-large-world-texture-residency-v01',
    visual_scale: 1,
    evidence_root: rootHash({stream_root: stream.stream_root, selection_root: selection.selection_root, renderer: 'vsr-ragf-ktx2-residency'})
  });
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);
  const bundle = createLargeWorldSpatialGlbBundle(scene, {
    texture_profile: LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE,
    texture_size: 32
  });
  assert.equal(verifyLargeWorldSpatialGlbBundle(bundle, {sceneRoot: scene.scene_root}).valid, true);
  assert.equal(bundle.manifest.texture_profile, LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE);
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

  const sourceEntry = bundle.assets.find(entry => entry.record.metadata.lod === 0 && entry.record.metadata.asset_role === undefined);
  assert.ok(sourceEntry);
  const nearResidency = resolveLargeWorldTextureResidency(sourceEntry.record.metadata.texture_residency, {distance_m: 18, screen_coverage_percent: 92});
  const farResidency = resolveLargeWorldTextureResidency(sourceEntry.record.metadata.texture_residency, {distance_m: 260, screen_coverage_percent: 12});
  assert.equal(verifyLargeWorldTextureResidency(nearResidency), true);
  assert.equal(verifyLargeWorldTextureResidency(farResidency), true);
  assert.equal(nearResidency.selected_level, 0);
  assert.equal(farResidency.selected_level, 2);
  const imported = await importGlbToSpatialSceneAsync(sourceEntry.payload, {
    sceneId: 'urrf-large-world-texture-residency-import-v01',
    sourceRoot: scene.scene_root,
    imageDecoder: input => decodeGltfImageToSpatialTexture(input)
  });
  assert.equal(verifyGltfImportReceipt(imported.receipt), true);
  assert.equal(imported.receipt.textureCount, 1);
  assert.equal(imported.scene.textures?.length, 1);
  assert.equal(imported.scene.textures?.[0]?.width, 32);
  assert.equal(imported.scene.textures?.[0]?.height, 32);
  assert.equal(imported.scene.textures?.[0]?.mipmaps?.length, 5);
  assert.equal(imported.receipt.warnings.length, 0);
  imported.scene.background = '#07111e';
  imported.scene.cameras[0].transform = {translation: [32, 14, 78], rotationEulerDeg: [-18, 0, 0]};
  imported.scene.lights = [
    {id: 'light:ktx2:ambient', kind: 'ambient', color: '#d9e7ff', intensity: .35},
    {id: 'light:ktx2:sun', kind: 'directional', color: '#fff0ce', intensity: 1.2, direction: [-.45, -1, -.35], castShadow: false}
  ];
  const frame = compileSpatialFrame(imported.scene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
  assert.equal(verifySpatialFrame(frame).ok, true);
  assert.ok(frame.stats.triangleCount > 0);
  const rendered = renderSpatialReference(imported.scene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
  assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);
  const worldMetadata = sourceEntry.record.metadata;
  const report = {
    format: 'urrf.large-world-texture-residency-report.v0.1',
    world_id: scene.large_world.world_id,
    scene_root: scene.scene_root,
    selection_root: selection.selection_root,
    manifest_root: bundle.manifest.manifest_root,
    bundle_root: bundle.bundle_root,
    asset_count: bundle.manifest.asset_count,
    total_bytes: totalBytes,
    texture_profile: bundle.manifest.texture_profile,
    texture_residency_profile: bundle.manifest.texture_residency_profile,
    texture_level_count: worldMetadata.texture_level_count,
    texture_byte_length: worldMetadata.texture_byte_length,
    texture_levels: worldMetadata.texture_residency.levels,
    near_residency_root: nearResidency.root,
    near_selected_level: nearResidency.selected_level,
    far_residency_root: farResidency.root,
    far_selected_level: farResidency.selected_level,
    streaming_root: streamingReceipt.resolution.root,
    streaming_receipt_root: streamingReceipt.receiptRoot,
    imported_asset_id: sourceEntry.record.id,
    imported_texture_width: imported.scene.textures[0].width,
    imported_texture_height: imported.scene.textures[0].height,
    imported_texture_mip_count: imported.scene.textures[0].mipmaps?.length ?? 0,
    imported_gltf_receipt_root: imported.receipt.receiptRoot,
    imported_frame_root: frame.frameRoot,
    imported_triangle_count: frame.stats.triangleCount,
    pixel_root: rendered.pixelRoot,
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', encoder_provider: 'RAGF', provider_can_write_authoritative_world_state: false, candidate_only: true, authoritative: false},
    notes: 'Candidate-only native RGBA8 KTX2 mip container embedded in binary GLB; progressive mip residency metadata, SHA-256 streaming, asynchronous VSR KTX2 decode, frame compile, and CPU reference pixels execute locally. BasisU supercompression, target-device/GPU residency, CDN delivery, and production performance remain unproven.'
  };
  report.report_root = rootHash(report);
  writeFileSync(join(outputDir, 'large-world-texture-residency-manifest.json'), `${JSON.stringify(bundle.manifest, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-texture-residency-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-texture-residency-reference.png'), rendered.png);
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'large-world-texture-residency-reference.png')).byteLength > 1000);
});
