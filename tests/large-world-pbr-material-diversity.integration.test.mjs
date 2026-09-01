import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE,
  LargeWorldRuntime,
  createLargeWorldSpatialGlbBundle,
  verifyLargeWorldSpatialGlbBundle,
  verifyLargeWorldSpatialScene,
  verifyPortfolioSelectionEnvelope
} from '@taowind/large-world-runtime';
import {
  VSRSpatialAssetStreamer,
  compileSpatialFrame,
  renderSpatialReference,
  verifySpatialAssetStreamingReceipt,
  verifySpatialFrame,
  verifySpatialWebGPUReceipt
} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {decodeGltfImageToSpatialTexture, importGlbToSpatialSceneAsync, verifyGltfImportReceipt} from '@taowind/visual-state-runtime/gltf-asset';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_PBR_MATERIAL_DIVERSITY_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_PBR_MATERIAL_DIVERSITY'));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function textureRoot(texture) {
  return rootHash({
    width: texture.width,
    height: texture.height,
    colorSpace: texture.colorSpace,
    pixels: texture.pixels,
    mipmaps: texture.mipmaps
  });
}

function materialRoot(materials) {
  return rootHash(materials.map(material => ({
    id: material.id,
    baseColor: material.baseColor ?? null,
    metallic: material.metallic === undefined ? null : String(material.metallic),
    roughness: material.roughness === undefined ? null : String(material.roughness),
    emissive: material.emissive ?? null,
    emissiveStrength: material.emissiveStrength === undefined ? null : String(material.emissiveStrength),
    textureIds: [material.baseColorTextureId, material.metallicRoughnessTextureId, material.normalTextureId, material.occlusionTextureId, material.emissiveTextureId]
  })));
}

function composePbrMaterialContactScene(importedEntries, sourceRoot) {
  const scene = {
    format: 'vsr.spatial-scene.v0.4',
    sceneId: 'urrf-large-world-pbr-material-diversity-contact-sheet-v01',
    title: 'URRF PBR Material Diversity Contact Sheet',
    activeCameraId: 'camera:pbr-diversity',
    meshes: [],
    materials: [],
    textures: [],
    animations: [],
    skins: [],
    nodes: [],
    cameras: [{
      id: 'camera:pbr-diversity',
      projection: 'perspective',
      fovYDeg: 52,
      near: 0.1,
      far: 200,
      transform: {translation: [0, 10, 28], rotationEulerDeg: [-18, 0, 0]}
    }],
    lights: [
      {id: 'light:pbr-diversity:ambient', kind: 'ambient', color: '#b8d9ff', intensity: 0.38},
      {id: 'light:pbr-diversity:key', kind: 'directional', color: '#fff0cf', intensity: 1.35, direction: [-0.45, -1, -0.35], castShadow: false}
    ],
    background: '#081421',
    reality: {worldId: 'world:urrf-large-world-pbr-material-diversity', realityRoot: sourceRoot}
  };
  for (const {id, imported, transform} of importedEntries) {
    const prefix = `pbr-diversity:${id}`;
    const meshIds = new Map(imported.scene.meshes.map((mesh, index) => [mesh.id, `${prefix}:mesh:${index}`]));
    const textureIds = new Map(imported.scene.textures.map((texture, index) => [texture.id, `${prefix}:texture:${index}`]));
    const materialIds = new Map(imported.scene.materials.map((material, index) => [material.id, `${prefix}:material:${index}`]));
    for (const mesh of imported.scene.meshes) scene.meshes.push({...clone(mesh), id: meshIds.get(mesh.id)});
    for (const texture of imported.scene.textures) scene.textures.push({...clone(texture), id: textureIds.get(texture.id)});
    for (const material of imported.scene.materials) {
      const remapped = {...clone(material), id: materialIds.get(material.id)};
      for (const key of ['baseColorTextureId', 'metallicRoughnessTextureId', 'normalTextureId', 'occlusionTextureId', 'emissiveTextureId', 'lightmapTextureId', 'reactiveMaskTextureId']) {
        if (remapped[key]) remapped[key] = textureIds.get(remapped[key]) ?? remapped[key];
      }
      scene.materials.push(remapped);
    }
    imported.scene.nodes.forEach((node, index) => {
      scene.nodes.push({
        ...clone(node),
        id: `${prefix}:node:${index}`,
        meshId: meshIds.get(node.meshId) ?? node.meshId,
        materialId: materialIds.get(node.materialId) ?? node.materialId,
        transform: clone(transform)
      });
    });
  }
  return scene;
}

function browserPage(scene, sourceRealityRoot, referencePath, options) {
  const sceneJson = JSON.stringify(scene).replaceAll('<', '\\u003c');
  const optionsJson = JSON.stringify(options);
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>URRF PBR Material Diversity · WebGPU</title>
<style>:root{font-family:Inter,"Noto Sans SC",system-ui,sans-serif;color:#e8f0ff;background:#050914;color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:24px;background:radial-gradient(circle at 20% 0,#173c63,#050914 52%)}main{width:min(1180px,100%);margin:auto;display:grid;grid-template-columns:minmax(0,1fr) 286px;gap:18px}.card{border:1px solid #274468;border-radius:18px;background:rgba(5,12,25,.9);overflow:hidden;box-shadow:0 24px 80px #0008}header{padding:18px 20px;border-bottom:1px solid #203a5d}h1{font-size:20px;margin:0 0 6px}p{font-size:13px;line-height:1.55;color:#9fb6d5;margin:0}canvas,img{display:block;width:100%;aspect-ratio:32/21;object-fit:cover;background:#07101e}.bar{display:flex;gap:8px;align-items:center;padding:12px 16px;border-top:1px solid #203a5d;flex-wrap:wrap}.badge{padding:5px 9px;border-radius:999px;background:#102843;color:#9ed0ff;font-size:12px}.ok{background:#123a2c;color:#8ff0bf}.warn{background:#4b3012;color:#ffd188}.panel{padding:18px}.panel h2{font-size:15px;margin:0 0 14px}.metric{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #1d3351;font-size:13px}.metric span{color:#8ba4c6}.metric strong{text-align:right;word-break:break-all;font-weight:600}code{font-size:11px;color:#8fd5ff}@media(max-width:850px){main{grid-template-columns:1fr}.panel{order:-1}}</style></head>
<body><main><section class="card"><header><h1>URRF PBR Material Diversity · VSR Spatial WebGPU</h1><p>八个 GLB 候选、四张 PBR 纹理图、五个材质绑定进入同一接触场景；WebGPU 不可用时保留 CPU reference。</p></header><canvas id="gpu"></canvas><img id="fallback" src="${referencePath}" alt="CPU reference"><div class="bar"><span id="mode" class="badge">探测中</span><span id="receipt" class="badge">Receipt：—</span><span id="root" class="badge">Reality Root：${sourceRealityRoot.slice(0, 12)}</span></div></section><aside class="card panel"><h2>执行状态</h2><div class="metric"><span>选中资产</span><strong>${scene.nodes.length}</strong></div><div class="metric"><span>纹理 / 材质</span><strong>${scene.textures.length} / ${scene.materials.length}</strong></div><div class="metric"><span>Reality source root</span><strong><code>${sourceRealityRoot}</code></strong></div><div class="metric"><span>浏览器 API</span><strong id="capability">—</strong></div><div class="metric"><span>GPU frame root</span><strong><code id="frame">—</code></strong></div></aside></main>
<script src="../../../packages/world/visual-state-runtime/apps/spatial-v04/vsr-spatial-browser.js"></script><script>
const scene=${sceneJson};const options=${optionsJson};const sourceRealityRoot='${sourceRealityRoot}';const canvas=document.querySelector('#gpu'),fallback=document.querySelector('#fallback'),mode=document.querySelector('#mode'),capability=document.querySelector('#capability'),receipt=document.querySelector('#receipt'),frame=document.querySelector('#frame');
async function start(){const api=window.VSRSpatial3D;const probe=api.probeSpatialWebGPU();window.__URRF_LARGE_WORLD_PBR_MATERIAL_DIVERSITY_WEBGPU__={capability:probe,status:'PROBE_ONLY',sourceRealityRoot};capability.textContent=probe.available?'available':'unavailable';if(!probe.available){mode.textContent='CPU reference · 未执行 GPU';mode.classList.add('warn');return}try{const executor=await api.VSRSpatialWebGPUExecutor.create(canvas);const result=await executor.render(scene,options);window.__URRF_LARGE_WORLD_PBR_MATERIAL_DIVERSITY_WEBGPU__={capability:probe,status:'EXECUTED',sourceRealityRoot,frameRoot:result.frameRoot,receipt:result};fallback.style.display='none';mode.textContent='真实 WebGPU 执行';mode.classList.add('ok');receipt.textContent='Draws：'+result.drawCalls+' · Textures：'+result.textureUploads;frame.textContent=result.frameRoot}catch(error){window.__URRF_LARGE_WORLD_PBR_MATERIAL_DIVERSITY_WEBGPU__={capability:probe,status:'FAILED',sourceRealityRoot,error:String(error.message??error)};mode.textContent='WebGPU 失败：'+error.message;mode.classList.add('warn')}}start();
</script></body></html>`;
}

test('imports and renders a diverse multi-material PBR contact scene from large-world GLB candidates', async () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-large-world-pbr-material-diversity',
    seed: 'seed:urrf-large-world-pbr-material-diversity',
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
  const sourceScene = runtime.createSpatialScene({
    selection,
    scene_id: 'urrf-large-world-pbr-material-diversity-v01',
    visual_scale: 1,
    evidence_root: rootHash({stream_root: stream.stream_root, selection_root: selection.selection_root, renderer: 'vsr-ragf-pbr-material-diversity'})
  });
  assert.equal(verifyLargeWorldSpatialScene(sourceScene).valid, true);
  const bundle = createLargeWorldSpatialGlbBundle(sourceScene, {
    texture_profile: LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE,
    texture_size: 32
  });
  assert.equal(verifyLargeWorldSpatialGlbBundle(bundle, {sceneRoot: sourceScene.scene_root}).valid, true);
  assert.equal(bundle.bundle_root, createLargeWorldSpatialGlbBundle(sourceScene, {
    texture_profile: LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE,
    texture_size: 32
  }).bundle_root);
  const byMesh = new Map(bundle.assets.filter(entry => entry.record.metadata.lod === 0).map(entry => [entry.record.metadata.source_mesh_id, entry]));
  const terrain = [...byMesh.keys()].find(meshId => meshId.startsWith('mesh:chunk:'));
  const requested = [
    ['terrain', terrain, {translation: [-0.5, -2.8, -4.5], scale: [0.23, 0.23, 0.23]}],
    ['grove', 'mesh:large-world:prototype:grove', {translation: [-7, 0, 1.5], scale: [2.7, 2.7, 2.7]}],
    ['mine', 'mesh:large-world:prototype:mine', {translation: [0, 0, 1.5], scale: [2.7, 2.7, 2.7]}],
    ['ruin', 'mesh:large-world:prototype:ruin', {translation: [7, 0, 1.5], scale: [2.7, 2.7, 2.7]}],
    ['crystal', 'mesh:large-world:prototype:resource:crystal', {translation: [-7, 0, -5.5], scale: [2.8, 2.8, 2.8]}],
    ['iron', 'mesh:large-world:prototype:resource:iron', {translation: [-2.3, 0, -5.5], scale: [2.8, 2.8, 2.8]}],
    ['water', 'mesh:large-world:prototype:resource:water', {translation: [2.3, 0, -5.5], scale: [2.8, 2.8, 2.8]}],
    ['watchtower', 'mesh:large-world:prototype:watchtower', {translation: [7, 0, -5.5], scale: [2.5, 2.5, 2.5]}]
  ];
  assert.equal(requested.every(([, meshId]) => typeof meshId === 'string' && byMesh.has(meshId)), true);
  const selected = requested.map(([id, meshId, transform]) => ({id, transform, entry: byMesh.get(meshId)}));
  const catalog = bundle.assets.map(entry => entry.record);
  const byId = new Map(bundle.assets.map(entry => [entry.record.id, entry]));
  const totalBytes = catalog.reduce((sum, asset) => sum + asset.byteLength, 0);
  const streamer = new VSRSpatialAssetStreamer(catalog, asset => byId.get(asset.id).payload, {maxConcurrent: 4});
  const streamingReceipt = await streamer.acquire({
    activeCellIds: sourceScene.streaming.cells.map(cell => cell.id),
    requestedAssetIds: bundle.manifest.asset_ids,
    maxAssets: catalog.length,
    maxBytes: totalBytes,
    lease: false
  });
  assert.equal(verifySpatialAssetStreamingReceipt(streamingReceipt), true);
  assert.equal(streamingReceipt.readyAssetIds.length, catalog.length);
  const importedEntries = [];
  for (const selectedEntry of selected) {
    const imported = await importGlbToSpatialSceneAsync(selectedEntry.entry.payload, {
      sceneId: `pbr-diversity-import-${selectedEntry.id}`,
      sourceRoot: sourceScene.scene_root,
      imageDecoder: input => decodeGltfImageToSpatialTexture(input)
    });
    assert.equal(verifyGltfImportReceipt(imported.receipt), true);
    assert.equal(imported.receipt.textureCount, 4);
    assert.equal(imported.receipt.materialTextureBindingCount, 5);
    assert.equal(imported.receipt.warnings.length, 0);
    assert.deepEqual(imported.scene.textures.map(texture => texture.colorSpace), ['srgb', 'linear', 'linear', 'srgb']);
    importedEntries.push({id: selectedEntry.id, imported, transform: selectedEntry.transform, entry: selectedEntry.entry});
  }
  const contactScene = composePbrMaterialContactScene(importedEntries, sourceScene.scene_root);
  const renderOptions = {width: 640, height: 420, enableShadows: false, gpuDrivenCulling: true};
  const frame = compileSpatialFrame(contactScene, renderOptions);
  assert.equal(verifySpatialFrame(frame).ok, true);
  assert.ok(frame.stats.triangleCount > 0);
  assert.equal(frame.stats.materialTextureBindings, selected.length * 5);
  const rendered = renderSpatialReference(contactScene, renderOptions);
  assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);
  const repeated = renderSpatialReference(contactScene, renderOptions);
  assert.equal(repeated.pixelRoot, rendered.pixelRoot);
  const textureRoots = importedEntries.flatMap(entry => entry.imported.scene.textures.map(textureRoot));
  const materialRoots = importedEntries.map(entry => materialRoot(entry.imported.scene.materials));
  assert.ok(new Set(textureRoots).size >= selected.length);
  assert.equal(new Set(materialRoots).size, materialRoots.length);
  const report = {
    format: 'urrf.large-world-pbr-material-diversity-report.v0.1',
    world_id: sourceScene.large_world.world_id,
    scene_root: sourceScene.scene_root,
    selection_root: selection.selection_root,
    manifest_root: bundle.manifest.manifest_root,
    bundle_root: bundle.bundle_root,
    asset_count: bundle.manifest.asset_count,
    streamed_asset_count: streamingReceipt.readyAssetIds.length,
    total_bytes: totalBytes,
    selected_asset_count: selected.length,
    selected_assets: selected.map(entry => ({id: entry.id, asset_id: entry.entry.record.id, source_mesh_id: entry.entry.record.metadata.source_mesh_id, prototype_id: entry.entry.record.metadata.prototype_id})),
    texture_profile: bundle.manifest.texture_profile,
    texture_count_total: textureRoots.length,
    texture_roles_per_asset: ['base-color', 'normal', 'metallic-roughness', 'emissive'],
    texture_color_spaces_per_asset: ['srgb', 'linear', 'linear', 'srgb'],
    material_texture_bindings_total: frame.stats.materialTextureBindings,
    distinct_texture_roots: new Set(textureRoots).size,
    distinct_material_roots: new Set(materialRoots).size,
    imported_triangle_count: frame.stats.triangleCount,
    frame_root: frame.frameRoot,
    pixel_root: rendered.pixelRoot,
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', encoder_provider: 'RAGF', provider_can_write_authoritative_world_state: false, candidate_only: true, authoritative: false},
    notes: 'Candidate-only local material diversity contact scene. Eight large-world GLB assets are asynchronously decoded into a single VSR scene with four PBR maps and five material bindings per asset. Distinct texture/material roots and CPU reference pixels execute locally; target-device/GPU quality, BasisU supercompression, CDN delivery, and subjective AAA art direction remain unproven.'
  };
  report.report_root = rootHash(report);
  writeFileSync(join(outputDir, 'large-world-pbr-material-diversity-manifest.json'), `${JSON.stringify(bundle.manifest, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-pbr-material-diversity-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-pbr-material-diversity-reference.png'), rendered.png);
  const webgpuReportBase = {
    format: 'urrf.large-world-pbr-material-diversity-webgpu-report.v0.1',
    world_id: sourceScene.large_world.world_id,
    source_scene_root: sourceScene.scene_root,
    contact_source_reality_root: frame.sourceRealityRoot,
    selection_root: selection.selection_root,
    bundle_root: bundle.bundle_root,
    selected_asset_count: selected.length,
    texture_count: contactScene.textures.length,
    material_count: contactScene.materials.length,
    material_texture_bindings: frame.stats.materialTextureBindings,
    frame_root: frame.frameRoot,
    pixel_root: rendered.pixelRoot,
    draw_calls: frame.stats.visibleDraws,
    triangles: frame.stats.triangleCount,
    browser_execution: 'NOT_EXECUTED_IN_NODE',
    artifacts: {
      scene_json: 'large-world-pbr-material-diversity-scene.json',
      cpu_reference_png: 'large-world-pbr-material-diversity-reference.png',
      browser_html: 'large-world-pbr-material-diversity-webgpu.html',
      browser_receipt: 'large-world-pbr-material-diversity-webgpu-browser-receipt.json',
      browser_png: 'large-world-pbr-material-diversity-webgpu-browser.png'
    },
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', execution_owner: 'VSR', encoder_provider: 'RAGF', candidate_only: true, authoritative: false},
    notes: 'Candidate-only local Chromium WebGPU execution of the same multi-asset PBR contact scene. Browser receipt is host-specific and does not prove target-device performance, physical VRAM residency, BasisU supercompression, CDN delivery, or AAA art quality.'
  };
  const webgpuReport = {...webgpuReportBase, report_root: rootHash(webgpuReportBase)};
  writeFileSync(join(outputDir, 'large-world-pbr-material-diversity-scene.json'), `${JSON.stringify(contactScene)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-pbr-material-diversity-webgpu-report.json'), `${JSON.stringify(webgpuReport, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-pbr-material-diversity-webgpu.html'), browserPage(contactScene, frame.sourceRealityRoot, './large-world-pbr-material-diversity-reference.png', renderOptions), 'utf8');
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.match(webgpuReport.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'large-world-pbr-material-diversity-reference.png')).byteLength > 1000);
});

test('verifies the committed Chromium WebGPU receipt against the deterministic PBR contact frame', {skip: !existsSync(join(outputDir, 'large-world-pbr-material-diversity-webgpu-browser-receipt.json'))}, () => {
  const report = JSON.parse(readFileSync(join(outputDir, 'large-world-pbr-material-diversity-webgpu-report.json'), 'utf8'));
  const browserEvidence = JSON.parse(readFileSync(join(outputDir, 'large-world-pbr-material-diversity-webgpu-browser-receipt.json'), 'utf8'));
  assert.equal(browserEvidence.status, 'EXECUTED');
  assert.equal(browserEvidence.capability.available, true);
  assert.equal(browserEvidence.receipt.submitted, true);
  assert.equal(browserEvidence.receipt.deviceLost, false);
  assert.equal(browserEvidence.receipt.frameRoot, report.frame_root);
  assert.equal(browserEvidence.frame_root, report.frame_root);
  assert.equal(browserEvidence.source_reality_root, report.contact_source_reality_root);
  assert.equal(verifySpatialWebGPUReceipt(browserEvidence.receipt), true);
});
