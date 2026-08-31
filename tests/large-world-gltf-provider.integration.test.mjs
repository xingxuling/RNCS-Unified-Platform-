import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LargeWorldRuntime,
  createLargeWorldSpatialGltfBundle,
  verifyLargeWorldSpatialGltfBundle,
  verifyLargeWorldSpatialScene,
  verifyPortfolioSelectionEnvelope
} from '@taowind/large-world-runtime';
import {
  VSRSpatialAssetStreamer,
  compileSpatialFrame,
  generateSpatialHLOD,
  generateSpatialHLODForStreamingCells,
  renderSpatialReference,
  verifySpatialAssetStreamingReceipt,
  verifySpatialFrame
} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {importGltfToSpatialScene, verifyGltfImportReceipt} from '@taowind/visual-state-runtime/gltf-asset';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_GLTF_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_GLTF_PROVIDER'));

test('streams and imports the large-world glTF candidate bundle, then compiles cell-ready HLOD evidence', async () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-large-world-gltf-provider',
    seed: 'seed:urrf-large-world-gltf-provider',
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
  const qualityByChunk = Object.fromEntries(active.map(chunk => [chunk.chunk_id, 'STANDARD']));
  const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: qualityByChunk});
  assert.equal(verifyPortfolioSelectionEnvelope(selection).valid, true);
  const scene = runtime.createSpatialScene({
    selection,
    scene_id: 'urrf-large-world-gltf-provider-v01',
    visual_scale: 1,
    evidence_root: rootHash({stream_root: stream.stream_root, selection_root: selection.selection_root, renderer: 'vsr-gltf-provider'})
  });
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);

  const bundle = createLargeWorldSpatialGltfBundle(scene);
  assert.equal(verifyLargeWorldSpatialGltfBundle(bundle, {sceneRoot: scene.scene_root}).valid, true);
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

  const sourceEntry = bundle.assets.find(entry => entry.record.metadata.lod === 0 && String(entry.record.metadata.source_mesh_id).includes(':prototype:grove'))
    ?? bundle.assets.find(entry => entry.record.metadata.lod === 0 && String(entry.record.metadata.source_mesh_id).includes(':terrain'))
    ?? bundle.assets.find(entry => entry.record.metadata.lod === 0);
  assert.ok(sourceEntry);
  const showcaseIsTerrain = String(sourceEntry.record.metadata.source_mesh_id).includes(':terrain');
  const imported = importGltfToSpatialScene(JSON.parse(new TextDecoder().decode(sourceEntry.payload)), {
    sceneId: 'urrf-large-world-gltf-import-v01',
    sourceRoot: scene.scene_root
  });
  assert.equal(verifyGltfImportReceipt(imported.receipt), true);
  assert.equal(imported.scene.meshes.length, 1);
  assert.equal(imported.scene.textures?.length, 1);
  assert.equal(imported.receipt.textureCount, 1);
  assert.equal(imported.receipt.meshCount, 1);
  imported.scene.background = '#07111e';
  imported.scene.cameras[0].transform = showcaseIsTerrain
    ? {translation: [32, 14, 78], rotationEulerDeg: [-18, 0, 0]}
    : {translation: [0, 1.6, 3], rotationEulerDeg: [-8, 0, 0]};
  imported.scene.lights = [
    {id: 'light:gltf:ambient', kind: 'ambient', color: '#d9e7ff', intensity: .35},
    {id: 'light:gltf:sun', kind: 'directional', color: '#fff0ce', intensity: 1.2, direction: [-.45, -1, -.35], castShadow: false}
  ];

  const importedFrame = compileSpatialFrame(imported.scene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
  assert.equal(verifySpatialFrame(importedFrame).ok, true);
  assert.ok(importedFrame.stats.triangleCount > 0);
  const sourceNodeIds = imported.scene.nodes.filter(node => node.meshId).map(node => node.id);
  const hlod = generateSpatialHLOD(imported.scene, {
    clusterId: 'world:urrf-large-world-gltf-provider:terrain',
    sourceNodeIds,
    levels: showcaseIsTerrain
      ? [{maxDistance: 24, maxTriangles: 64}, {maxDistance: 128, maxTriangles: 16}]
      : [{maxDistance: 3, maxTriangles: 64}, {maxDistance: 24, maxTriangles: 16}]
  });
  const hlodFrame = compileSpatialFrame(hlod.scene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
  assert.equal(hlodFrame.hlod?.clusters.length, 1);
  assert.equal(hlodFrame.hlod?.clusters[0]?.selectedLevel, 0);
  assert.equal(hlodFrame.stats.hlodProxyDraws, 1);
  assert.equal(verifySpatialFrame(hlodFrame).ok, true);
  const cellHlod = generateSpatialHLODForStreamingCells(scene, {
    clusterIdPrefix: 'world:urrf-large-world-gltf-provider:cells',
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
  assert.equal(cellHlod.report.clusters.every(cluster => cluster.generatedNodeIds.length > 0), true);
  assert.equal(cellHlodFrame.hlod?.clusters.length, scene.streaming.cells.length);
  assert.equal(cellHlodFrame.stats.hlodProxyDraws, scene.streaming.cells.length);
  assert.equal(verifySpatialFrame(cellHlodFrame).ok, true);
  const rendered = renderSpatialReference(imported.scene, {width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true});
  assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);

  const report = {
    format: 'urrf.large-world-gltf-provider-report.v0.1',
    world_id: scene.large_world.world_id,
    scene_root: scene.scene_root,
    selection_root: selection.selection_root,
    manifest_root: bundle.manifest.manifest_root,
    bundle_root: bundle.bundle_root,
    asset_count: bundle.manifest.asset_count,
    total_bytes: totalBytes,
    mesh_count: bundle.manifest.mesh_count,
    lod_level_count: bundle.manifest.lod_level_count,
    texture_count: bundle.manifest.texture_count,
    streaming_root: streamingReceipt.resolution.root,
    streaming_receipt_root: streamingReceipt.receiptRoot,
    imported_asset_id: sourceEntry.record.id,
    imported_gltf_receipt_root: imported.receipt.receiptRoot,
    imported_frame_root: importedFrame.frameRoot,
    imported_triangle_count: importedFrame.stats.triangleCount,
    hlod_generation_root: hlod.report.root,
    hlod_frame_root: hlodFrame.frameRoot,
    hlod_triangle_count: hlodFrame.stats.triangleCount,
    cell_hlod_generation_root: cellHlod.report.root,
    cell_hlod_frame_root: cellHlodFrame.frameRoot,
    cell_hlod_proxy_draws: cellHlodFrame.stats.hlodProxyDraws,
    pixel_root: rendered.pixelRoot,
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', provider_can_write_authoritative_world_state: false, candidate_only: true, authoritative: false},
    notes: 'Candidate-only glTF 2.0 lowering with inline VSR RGBA swatches; streaming, import, frame compile, and static HLOD execute locally. This is not AAA asset quality or target-device performance proof.'
  };
  report.report_root = rootHash(report);
  writeFileSync(join(outputDir, 'large-world-gltf-provider-manifest.json'), `${JSON.stringify(bundle.manifest, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-gltf-provider-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-gltf-provider-reference.png'), rendered.png);
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'large-world-gltf-provider-reference.png')).byteLength > 1000);
});
