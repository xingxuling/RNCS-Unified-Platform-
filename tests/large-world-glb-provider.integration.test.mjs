import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LargeWorldRuntime,
  createLargeWorldSpatialGlbBundle,
  verifyLargeWorldSpatialGlbBundle,
  verifyLargeWorldSpatialScene,
  verifyPortfolioSelectionEnvelope
} from '@taowind/large-world-runtime';
import {
  VSRSpatialAssetStreamer,
  compileSpatialFrame,
  generateSpatialHLODForStreamingCells,
  renderSpatialReference,
  verifySpatialAssetStreamingReceipt,
  verifySpatialFrame
} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {importGlbToSpatialScene, verifyGltfImportReceipt} from '@taowind/visual-state-runtime/gltf-asset';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_GLB_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_GLB_PROVIDER'));

test('streams and imports the RAGF-encoded binary GLB candidate bundle, then compiles cell-ready evidence', async () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-large-world-glb-provider',
    seed: 'seed:urrf-large-world-glb-provider',
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
    scene_id: 'urrf-large-world-glb-provider-v01',
    visual_scale: 1,
    evidence_root: rootHash({stream_root: stream.stream_root, selection_root: selection.selection_root, renderer: 'vsr-ragf-glb-provider'})
  });
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);

  const bundle = createLargeWorldSpatialGlbBundle(scene, {includeRagfShowcase: true});
  assert.equal(verifyLargeWorldSpatialGlbBundle(bundle, {sceneRoot: scene.scene_root}).valid, true);
  assert.equal(bundle.manifest.provider_asset_count, 1);
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

  const sourceEntry = bundle.assets.find(entry => entry.record.metadata.asset_role === 'ragf-showcase')
    ?? bundle.assets.find(entry => entry.record.metadata.lod === 0 && String(entry.record.metadata.source_mesh_id).includes(':prototype:grove'))
    ?? bundle.assets.find(entry => entry.record.metadata.lod === 0 && String(entry.record.metadata.source_mesh_id).includes(':terrain'))
    ?? bundle.assets.find(entry => entry.record.metadata.lod === 0);
  assert.ok(sourceEntry);
  const showcaseIsTerrain = String(sourceEntry.record.metadata.source_mesh_id).includes(':terrain');
  const showcaseIsRagf = sourceEntry.record.metadata.asset_role === 'ragf-showcase';
  const imported = importGlbToSpatialScene(sourceEntry.payload, {
    sceneId: 'urrf-large-world-glb-import-v01',
    sourceRoot: scene.scene_root,
    ...(showcaseIsRagf ? {imageResolver: ({id, imageIndex}) => ({id, width: 2, height: 2, pixels: [
      72 + imageIndex * 24, 142 + imageIndex * 18, 214 - imageIndex * 12, 255,
      72 + imageIndex * 24, 142 + imageIndex * 18, 214 - imageIndex * 12, 255,
      36 + imageIndex * 16, 86 + imageIndex * 14, 142 - imageIndex * 9, 255,
      36 + imageIndex * 16, 86 + imageIndex * 14, 142 - imageIndex * 9, 255
    ], colorSpace: 'srgb', filter: 'linear', wrapU: 'repeat', wrapV: 'repeat'})} : {})
  });
  assert.equal(verifyGltfImportReceipt(imported.receipt), true);
  assert.equal(imported.scene.meshes.length, 1);
  assert.equal(imported.scene.textures?.length, showcaseIsRagf ? 4 : 1);
  assert.equal(imported.receipt.textureCount, showcaseIsRagf ? 4 : 1);
  assert.equal(imported.receipt.meshCount, 1);
  imported.scene.background = '#07111e';
  imported.scene.cameras[0].transform = showcaseIsTerrain
    ? {translation: [32, 14, 78], rotationEulerDeg: [-18, 0, 0]}
    : {translation: [0, 1.35, 4.2], rotationEulerDeg: [-6, 0, 0]};
  imported.scene.lights = [
    {id: 'light:glb:ambient', kind: 'ambient', color: '#d9e7ff', intensity: .35},
    {id: 'light:glb:sun', kind: 'directional', color: '#fff0ce', intensity: 1.2, direction: [-.45, -1, -.35], castShadow: false}
  ];

  const importedFrame = compileSpatialFrame(imported.scene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
  assert.equal(verifySpatialFrame(importedFrame).ok, true);
  assert.ok(importedFrame.stats.triangleCount > 0);
  const cellHlod = generateSpatialHLODForStreamingCells(scene, {
    clusterIdPrefix: 'world:urrf-large-world-glb-provider:cells',
    levels: [{maxDistance: 64, maxTriangles: 64}, {maxDistance: 192, maxTriangles: 16}]
  });
  const cellHlodFrame = compileSpatialFrame(cellHlod.scene, {
    width: 320,
    height: 180,
    enableShadows: false,
    gpuDrivenCulling: true,
    streaming: {loadRadius: 0, unloadRadius: 0, forcedCellIds: scene.streaming.cells.map(cell => cell.id)}
  });
  assert.equal(cellHlod.report.clusters.length, scene.streaming.cells.length);
  assert.equal(cellHlodFrame.hlod?.clusters.length, scene.streaming.cells.length);
  assert.equal(cellHlodFrame.stats.hlodProxyDraws, scene.streaming.cells.length);
  assert.equal(verifySpatialFrame(cellHlodFrame).ok, true);
  const rendered = renderSpatialReference(imported.scene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
  assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);

  const report = {
    format: 'urrf.large-world-glb-provider-report.v0.1',
    world_id: scene.large_world.world_id,
    scene_root: scene.scene_root,
    selection_root: selection.selection_root,
    manifest_root: bundle.manifest.manifest_root,
    bundle_root: bundle.bundle_root,
    provider_id: bundle.manifest.provider_id,
    encoder_provider_id: bundle.manifest.encoder_provider_id,
    asset_count: bundle.manifest.asset_count,
    provider_asset_count: bundle.manifest.provider_asset_count,
    total_bytes: totalBytes,
    mesh_count: bundle.manifest.mesh_count,
    lod_level_count: bundle.manifest.lod_level_count,
    texture_count: bundle.manifest.texture_count,
    streaming_root: streamingReceipt.resolution.root,
    streaming_receipt_root: streamingReceipt.receiptRoot,
    imported_asset_id: sourceEntry.record.id,
    imported_asset_role: sourceEntry.record.metadata.asset_role ?? 'world-mesh',
    imported_asset_triangle_count: sourceEntry.record.metadata.triangle_count,
    imported_asset_texture_count: sourceEntry.record.metadata.texture_count,
    imported_gltf_receipt_root: imported.receipt.receiptRoot,
    imported_frame_root: importedFrame.frameRoot,
    imported_triangle_count: importedFrame.stats.triangleCount,
    cell_hlod_generation_root: cellHlod.report.root,
    cell_hlod_frame_root: cellHlodFrame.frameRoot,
    cell_hlod_proxy_draws: cellHlodFrame.stats.hlodProxyDraws,
    pixel_root: rendered.pixelRoot,
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', encoder_provider: 'RAGF', provider_can_write_authoritative_world_state: false, candidate_only: true, authoritative: false},
    notes: 'Candidate-only binary glTF 2.0 lowering through the reusable RAGF GLB builder; embedded PNG base-color bytes, streaming, VSR binary import, frame compile, and cell HLOD execute locally. This is not AAA asset quality, compressed-texture, target-device, CDN, or production performance proof.'
  };
  report.report_root = rootHash(report);
  writeFileSync(join(outputDir, 'large-world-glb-provider-manifest.json'), `${JSON.stringify(bundle.manifest, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-glb-provider-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-glb-provider-reference.png'), rendered.png);
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'large-world-glb-provider-reference.png')).byteLength > 1000);
});
