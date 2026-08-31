import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LargeWorldRuntime,
  verifyLargeWorldSpatialScene,
  verifyPortfolioSelectionEnvelope
} from '@taowind/large-world-runtime';
import {
  compileSpatialFrame,
  probeSpatialWebGPU,
  renderSpatialReference,
  resolveSpatialAssetStreaming,
  verifySpatialFrame,
  verifySpatialWebGPUReceipt
} from '@taowind/visual-state-runtime/spatial-reality-3d';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_WEBGPU_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_WEBGPU'));

function browserPage(scene, referencePath, assetStreaming) {
  const sceneJson = JSON.stringify(scene).replaceAll('<', '\\u003c');
  const options = JSON.stringify({
    width: 960,
    height: 540,
    qualityTier: 'quality',
    enableShadows: true,
    gpuDrivenCulling: true,
    assetStreaming,
    streaming: {loadRadius: 0, unloadRadius: 0, forcedCellIds: scene.streaming.cells.map(cell => cell.id)},
    postProcess: {exposure: .1, contrast: 1.05, saturation: 1.08, vignette: .16, bloomThreshold: 1.1, bloomIntensity: .18, bloomRadius: 1.4, ssaoIntensity: .32, ssaoRadius: 2.4, ssgiIntensity: .28, ssgiRadius: 3, ssgiSteps: 6, ssgiThickness: .12}
  });
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>URRF Large World · VSR WebGPU</title>
<style>:root{font-family:Inter,"Noto Sans SC",system-ui,sans-serif;color:#e8f0ff;background:#050914;color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:24px;background:radial-gradient(circle at 20% 0,#173c63,#050914 52%)}main{width:min(1200px,100%);margin:auto;display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px}.card{border:1px solid #274468;border-radius:18px;background:rgba(5,12,25,.9);overflow:hidden;box-shadow:0 24px 80px #0008}header{padding:18px 20px;border-bottom:1px solid #203a5d}h1{font-size:20px;margin:0 0 6px}p{font-size:13px;line-height:1.55;color:#9fb6d5;margin:0}canvas,img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#07101e}.bar{display:flex;gap:8px;align-items:center;padding:12px 16px;border-top:1px solid #203a5d;flex-wrap:wrap}.badge{padding:5px 9px;border-radius:999px;background:#102843;color:#9ed0ff;font-size:12px}.ok{background:#123a2c;color:#8ff0bf}.warn{background:#4b3012;color:#ffd188}.panel{padding:18px}.panel h2{font-size:15px;margin:0 0 14px}.metric{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #1d3351;font-size:13px}.metric span{color:#8ba4c6}.metric strong{text-align:right;word-break:break-all;font-weight:600}code{font-size:11px;color:#8fd5ff}@media(max-width:850px){main{grid-template-columns:1fr}.panel{order:-1}}</style></head>
<body><main><section class="card"><header><h1>URRF Large World · VSR Spatial WebGPU</h1><p>RNCS active chunk selection → URRF portfolio → VSR spatial scene。WebGPU 不可用时只显示已生成的 CPU reference。</p></header><canvas id="gpu"></canvas><img id="fallback" src="${referencePath}" alt="CPU reference"><div class="bar"><span id="mode" class="badge">探测中</span><span id="receipt" class="badge">Receipt：—</span><span id="root" class="badge">Scene Root：${scene.scene_root.slice(0, 12)}</span></div></section><aside class="card panel"><h2>执行状态</h2><div class="metric"><span>活动 chunk</span><strong>${scene.large_world.active_chunk_ids.length}</strong></div><div class="metric"><span>标准 / 代理</span><strong>${scene.large_world.representation_slots.filter(slot => slot.selected_quality_profile === 'STANDARD').length} / ${scene.large_world.representation_slots.filter(slot => slot.selected_quality_profile === 'PROXY').length}</strong></div><div class="metric"><span>场景根</span><strong><code>${scene.scene_root}</code></strong></div><div class="metric"><span>现实根</span><strong><code>${scene.reality.realityRoot}</code></strong></div><div class="metric"><span>浏览器 API</span><strong id="capability">—</strong></div><div class="metric"><span>GPU frame root</span><strong><code id="frame">—</code></strong></div></aside></main>
<script src="../../../packages/world/visual-state-runtime/apps/spatial-v04/vsr-spatial-browser.js"></script><script>
const scene=${sceneJson};const options=${options};const canvas=document.querySelector('#gpu'),fallback=document.querySelector('#fallback'),mode=document.querySelector('#mode'),capability=document.querySelector('#capability'),receipt=document.querySelector('#receipt'),frame=document.querySelector('#frame');
async function start(){const api=window.VSRSpatial3D;const probe=api.probeSpatialWebGPU();window.__URRF_LARGE_WORLD_WEBGPU__={capability:probe,status:'PROBE_ONLY'};capability.textContent=probe.available?'available':'unavailable';if(!probe.available){mode.textContent='CPU reference · 未执行 GPU';mode.classList.add('warn');return}try{const executor=await api.VSRSpatialWebGPUExecutor.create(canvas);const result=await executor.render(scene,options);window.__URRF_LARGE_WORLD_WEBGPU__={capability:probe,status:'EXECUTED',receipt:result};fallback.style.display='none';mode.textContent='真实 WebGPU 执行';mode.classList.add('ok');receipt.textContent='Draws：'+result.drawCalls+' · Triangles：'+result.triangles;frame.textContent=result.frameRoot}catch(error){window.__URRF_LARGE_WORLD_WEBGPU__={capability:probe,status:'FAILED',error:String(error.message??error)};mode.textContent='WebGPU 失败：'+error.message;mode.classList.add('warn')}}start();
</script></body></html>`;
}

test('lowers the active URRF large-world portfolio into a verified VSR spatial frame and browser payload', () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-large-world-webgpu',
    seed: 'seed:urrf-large-world-webgpu',
    width: 9,
    depth: 9,
    chunkSize: 64,
    sampleResolution: 16,
    loadRadius: 1,
    unloadRadius: 2,
    maxActiveChunks: 9
  });
  const stream = runtime.observe({x: 0, z: 0});
  const active = runtime.listActiveChunks();
  const center = active.find(chunk => chunk.coordinates.x === 0 && chunk.coordinates.z === 0) ?? active[0];
  const showcaseChunk = active.slice().sort((a, b) => {
    const contentDelta = (b.structures.length + b.resources.length) - (a.structures.length + a.resources.length);
    return contentDelta || (a.chunk_id === center.chunk_id ? -1 : b.chunk_id === center.chunk_id ? 1 : a.chunk_id.localeCompare(b.chunk_id));
  })[0] ?? center;
  const standardChunkIds = new Set(active.slice().sort((a, b) => {
    const contentDelta = (b.structures.length + b.resources.length) - (a.structures.length + a.resources.length);
    return contentDelta || (a.chunk_id === center.chunk_id ? -1 : b.chunk_id === center.chunk_id ? 1 : a.chunk_id.localeCompare(b.chunk_id));
  }).slice(0, 3).map(chunk => chunk.chunk_id));
  const qualityByChunk = Object.fromEntries(active.map(chunk => [chunk.chunk_id, standardChunkIds.has(chunk.chunk_id) ? 'STANDARD' : 'PROXY']));
  const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: qualityByChunk});
  const showcaseCenterX = Number(showcaseChunk.origin_mm.x) / 1000 + Number(showcaseChunk.extent_mm.x) / 2000;
  const showcaseCenterZ = Number(showcaseChunk.origin_mm.z) / 1000 + Number(showcaseChunk.extent_mm.z) / 2000;
  assert.equal(verifyPortfolioSelectionEnvelope(selection).valid, true);
  const scene = runtime.createSpatialScene({
    selection,
    scene_id: 'urrf-large-world-webgpu-v01',
    visual_scale: 2.8,
    camera: {translation: [showcaseCenterX, 18, showcaseCenterZ + 18], rotationEulerDeg: [-24, 0, 0]},
    evidence_root: rootHash({stream_root: stream.stream_root, selection_root: selection.selection_root, renderer: 'vsr-spatial'})
  });
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);
  assert.equal(scene.large_world.presentation_scale, 2.8);
  assert.equal(scene.large_world.visual_prototype_profile, 'large-world.visual-prototypes.v0.1');
  assert.ok(scene.large_world.visual_prototype_ids.length >= 5);
  const assetStreaming = resolveSpatialAssetStreaming(scene.assets, {
    activeCellIds: scene.streaming.cells.map(cell => cell.id),
    requestedAssetIds: scene.assets.map(asset => asset.id),
    maxAssets: scene.assets.length,
    maxBytes: scene.assets.reduce((sum, asset) => sum + asset.byteLength, 0)
  });
  const options = {
    width: 960,
    height: 540,
    qualityTier: 'quality',
    enableShadows: true,
    gpuDrivenCulling: true,
    assetStreaming,
    streaming: {loadRadius: 0, unloadRadius: 0, forcedCellIds: scene.streaming.cells.map(cell => cell.id)},
    postProcess: {exposure: .1, contrast: 1.05, saturation: 1.08, vignette: .16, bloomThreshold: 1.1, bloomIntensity: .18, bloomRadius: 1.4, ssaoIntensity: .32, ssaoRadius: 2.4, ssgiIntensity: .28, ssgiRadius: 3, ssgiSteps: 6, ssgiThickness: .12}
  };
  const frame = compileSpatialFrame(scene, options);
  assert.equal(verifySpatialFrame(frame).ok, true);
  assert.equal(frame.stats.activeCells, active.length);
  assert.equal(frame.stats.gpuDrivenDraws, frame.stats.visibleDraws);
  assert.ok(frame.stats.triangleCount > 1000);
  const repeat = compileSpatialFrame(scene, options);
  assert.equal(frame.frameRoot, repeat.frameRoot);
  const rendered = renderSpatialReference(scene, options);
  assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);
  assert.ok(rendered.png.byteLength > 1000);
  const probe = probeSpatialWebGPU();
  const scenePath = join(outputDir, 'large-world-spatial-scene.json');
  const referencePath = join(outputDir, 'large-world-spatial-reference.png');
  const reportPath = join(outputDir, 'large-world-webgpu-report.json');
  const htmlPath = join(outputDir, 'large-world-webgpu.html');
  writeFileSync(scenePath, `${JSON.stringify(scene, null, 2)}\n`, 'utf8');
  writeFileSync(referencePath, rendered.png);
  const report = {
    format: 'urrf.large-world-webgpu-report.v0.1',
    world_id: scene.large_world.world_id,
    region_root: scene.large_world.region_root,
    selection_root: selection.selection_root,
    scene_root: scene.scene_root,
    frame_root: frame.frameRoot,
    geometry_root: frame.geometryRoot,
    material_root: frame.materialRoot,
    environment_root: frame.environmentRoot,
    pixel_root: rendered.pixelRoot,
    active_chunks: active.length,
    standard_chunks: selection.selections.filter(row => row.selected_quality_profile === 'STANDARD').length,
    proxy_chunks: selection.selections.filter(row => row.selected_quality_profile === 'PROXY').length,
    presentation_scale: scene.large_world.presentation_scale,
    visual_prototype_profile: scene.large_world.visual_prototype_profile,
    visual_prototype_ids: scene.large_world.visual_prototype_ids,
    draw_calls: frame.stats.visibleDraws,
    triangles: frame.stats.triangleCount,
    gpu_driven_draws: frame.stats.gpuDrivenDraws,
    active_cells: frame.stats.activeCells,
    browser_probe: probe,
    browser_execution: 'NOT_EXECUTED_IN_NODE',
    artifacts: {scene_json: 'large-world-spatial-scene.json', cpu_reference_png: 'large-world-spatial-reference.png', browser_html: 'large-world-webgpu.html', browser_receipt: 'large-world-webgpu-browser-receipt.json', browser_png: 'large-world-webgpu-browser.png'},
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', provider_can_write_authoritative_world_state: false, candidate_only: true, authoritative: false},
    notes: 'The scene is a browser-consumable VSR spatial lowering of an RNCS active working set. The PNG is a deterministic CPU reference; browser WebGPU execution requires a secure-context host with navigator.gpu and is never inferred from this Node run.'
  };
  report.report_root = rootHash({
    format: report.format,
    world_id: report.world_id,
    region_root: report.region_root,
    selection_root: report.selection_root,
    scene_root: report.scene_root,
    frame_root: report.frame_root,
    geometry_root: report.geometry_root,
    material_root: report.material_root,
    environment_root: report.environment_root,
    pixel_root: report.pixel_root,
    active_chunks: report.active_chunks,
    standard_chunks: report.standard_chunks,
    proxy_chunks: report.proxy_chunks,
    presentation_scale: String(report.presentation_scale),
    visual_prototype_profile: report.visual_prototype_profile,
    visual_prototype_ids: report.visual_prototype_ids,
    draw_calls: report.draw_calls,
    triangles: report.triangles,
    gpu_driven_draws: report.gpu_driven_draws,
    active_cells: report.active_cells,
    browser_execution: report.browser_execution,
    authority: report.authority
  });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(htmlPath, browserPage(scene, './large-world-spatial-reference.png', assetStreaming), 'utf8');
  assert.equal(frame.stats.gpuDrivenDraws, frame.stats.visibleDraws);
  assert.ok(report.report_root.length === 64);
});

test('verifies the committed Chromium WebGPU receipt against the deterministic lowering frame', () => {
  const report = JSON.parse(readFileSync(join(outputDir, 'large-world-webgpu-report.json'), 'utf8'));
  const browserEvidence = JSON.parse(readFileSync(join(outputDir, 'large-world-webgpu-browser-receipt.json'), 'utf8'));
  assert.equal(browserEvidence.status, 'EXECUTED');
  assert.equal(browserEvidence.capability.available, true);
  assert.equal(browserEvidence.receipt.submitted, true);
  assert.equal(browserEvidence.receipt.deviceLost, false);
  assert.equal(browserEvidence.receipt.frameRoot, report.frame_root);
  assert.equal(verifySpatialWebGPUReceipt(browserEvidence.receipt), true);
});
