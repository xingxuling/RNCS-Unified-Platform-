import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LargeWorldRuntime,
  LARGE_WORLD_SPATIAL_QUALITY_PROFILES,
  verifyLargeWorldSpatialScene,
  verifyPortfolioSelectionEnvelope
} from '@taowind/large-world-runtime';
import {
  compileSpatialFrame,
  renderSpatialReference,
  resolveSpatialAssetStreaming,
  verifySpatialFrame,
  verifySpatialWebGPUReceipt
} from '@taowind/visual-state-runtime/spatial-reality-3d';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_WORKING_SET_BUDGET_WEBGPU_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_WORKING_SET_BUDGET_WEBGPU'));
const receiptPath = join(outputDir, 'large-world-working-set-budget-webgpu-browser-receipt.json');
const costFields = ['CPU_MILLI', 'GPU_MILLI', 'NPU_MILLI', 'VRAM_MB', 'RAM_MB', 'STORAGE_KB', 'NETWORK_KB', 'ENERGY_MILLI'];

function zeroCosts() {
  return Object.fromEntries(costFields.map(field => [field, 0]));
}

function addCosts(target, costs) {
  for (const field of costFields) target[field] += Number(costs?.[field] ?? 0);
  return target;
}

function totalForProfile(runtime, chunks, profile) {
  return chunks.reduce((total, chunk) => {
    const slot = runtime.getRepresentationPortfolio(chunk.chunk_id).slots.find(candidate => candidate.quality_profile === profile);
    assert.ok(slot, `missing ${profile} slot for ${chunk.chunk_id}`);
    return addCosts(total, slot.resource_costs);
  }, zeroCosts());
}

function browserPage(scene, options, referencePath, selection) {
  const sceneJson = JSON.stringify(scene).replaceAll('<', '\\u003c');
  const {__frameRoot, ...renderOptions} = options;
  const optionsJson = JSON.stringify(renderOptions);
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>URRF Working Set Budget · WebGPU</title>
<style>:root{font-family:Inter,"Noto Sans SC",system-ui,sans-serif;color:#e8f0ff;background:#050914;color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:24px;background:radial-gradient(circle at 20% 0,#173c63,#050914 52%)}main{width:min(1200px,100%);margin:auto;display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px}.card{border:1px solid #274468;border-radius:18px;background:rgba(5,12,25,.9);overflow:hidden;box-shadow:0 24px 80px #0008}header{padding:18px 20px;border-bottom:1px solid #203a5d}h1{font-size:20px;margin:0 0 6px}p{font-size:13px;line-height:1.55;color:#9fb6d5;margin:0}canvas,img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#07101e}.bar{display:flex;gap:8px;align-items:center;padding:12px 16px;border-top:1px solid #203a5d;flex-wrap:wrap}.badge{padding:5px 9px;border-radius:999px;background:#102843;color:#9ed0ff;font-size:12px}.ok{background:#123a2c;color:#8ff0bf}.warn{background:#4b3012;color:#ffd188}.panel{padding:18px}.panel h2{font-size:15px;margin:0 0 14px}.metric{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #1d3351;font-size:13px}.metric span{color:#8ba4c6}.metric strong{text-align:right;word-break:break-all;font-weight:600}code{font-size:11px;color:#8fd5ff}@media(max-width:850px){main{grid-template-columns:1fr}.panel{order:-1}}</style></head>
<body><main><section class="card"><header><h1>URRF Working Set Budget · VSR Spatial WebGPU</h1><p>RNCS active working set → aggregate budget allocator → URRF mixed quality → VSR WebGPU。</p></header><canvas id="gpu" width="960" height="540"></canvas><img id="fallback" src="${referencePath}" alt="CPU reference"><div class="bar"><span id="mode" class="badge">探测中</span><span id="receipt" class="badge">Receipt：—</span><span id="root" class="badge">Scene Root：${scene.scene_root.slice(0, 12)}</span></div></section><aside class="card panel"><h2>执行状态</h2><div class="metric"><span>活动 chunk</span><strong>${scene.large_world.active_chunk_ids.length}</strong></div><div class="metric"><span>质量组合</span><strong>${scene.large_world.quality_profiles.join(' / ')}</strong></div><div class="metric"><span>GPU 预算</span><strong>${selection.working_set_budget?.available?.GPU_MILLI ?? '—'}</strong></div><div class="metric"><span>场景根</span><strong><code>${scene.scene_root}</code></strong></div><div class="metric"><span>浏览器 API</span><strong id="capability">—</strong></div><div class="metric"><span>GPU frame root</span><strong><code id="frame">—</code></strong></div></aside></main>
<script src="../../../packages/world/visual-state-runtime/apps/spatial-v04/vsr-spatial-browser.js"></script><script>
const scene=${sceneJson};const options=${optionsJson};const canvas=document.querySelector('#gpu'),fallback=document.querySelector('#fallback'),mode=document.querySelector('#mode'),capability=document.querySelector('#capability'),receipt=document.querySelector('#receipt'),frame=document.querySelector('#frame');
async function start(){const api=window.VSRSpatial3D;const probe=api.probeSpatialWebGPU();window.__URRF_LARGE_WORLD_WORKING_SET_WEBGPU__={capability:probe,status:'PROBE_ONLY',sceneRoot:scene.scene_root,frameRoot:${JSON.stringify(__frameRoot ?? null)}};capability.textContent=probe.available?'available':'unavailable';if(!probe.available){mode.textContent='CPU reference · 未执行 GPU';mode.classList.add('warn');return}try{const executor=await api.VSRSpatialWebGPUExecutor.create(canvas);const result=await executor.render(scene,options);window.__URRF_LARGE_WORLD_WORKING_SET_WEBGPU__={capability:probe,status:'EXECUTED',sceneRoot:scene.scene_root,frameRoot:${JSON.stringify(__frameRoot ?? null)},receipt:result};fallback.style.display='none';mode.textContent='真实 WebGPU 执行';mode.classList.add('ok');receipt.textContent='Draws：'+result.drawCalls+' · Triangles：'+result.triangles;frame.textContent=result.frameRoot;executor.destroy()}catch(error){window.__URRF_LARGE_WORLD_WORKING_SET_WEBGPU__={capability:probe,status:'FAILED',sceneRoot:scene.scene_root,frameRoot:${JSON.stringify(__frameRoot ?? null)},error:String(error.message??error)};mode.textContent='WebGPU 失败：'+error.message;mode.classList.add('warn')}}start();
</script></body></html>`;
}

test('prepares a budgeted mixed-quality scene and verifies the local browser receipt when present', () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-large-world-working-set-budget-webgpu',
    seed: 'seed:urrf-large-world-working-set-budget-webgpu',
    width: 5,
    depth: 5,
    chunkSize: 64,
    sampleResolution: 8,
    loadRadius: 1,
    unloadRadius: 1,
    maxActiveChunks: 9
  });
  const stream = runtime.observe({x: 0, z: 0});
  const active = runtime.listActiveChunks();
  assert.equal(active.length, 9);
  const cinematicCosts = totalForProfile(runtime, active, 'CINEMATIC');
  const proxyCosts = totalForProfile(runtime, active, 'PROXY');
  const gpuBudget = proxyCosts.GPU_MILLI + Math.floor((cinematicCosts.GPU_MILLI - proxyCosts.GPU_MILLI) / 2);
  const center = active.find(chunk => chunk.coordinates.x === 0 && chunk.coordinates.z === 0) ?? active[0];
  const selection = runtime.selectActiveRepresentationPortfolios({
    quality_profile: 'CINEMATIC',
    working_set_resource_budget: {GPU: gpuBudget},
    working_set_minimum_quality_by_chunk: {[center.chunk_id]: 'STANDARD'},
    working_set_priority_by_chunk: {[center.chunk_id]: 100}
  });
  assert.equal(verifyPortfolioSelectionEnvelope(selection).valid, true);
  assert.equal(selection.working_set_budget_status, 'DOWNGRADED_TO_FIT');
  assert.equal(selection.selections.find(row => row.chunk_id === center.chunk_id).selected_quality_profile, 'CINEMATIC');
  const scene = runtime.createSpatialScene({
    selection,
    scene_id: 'urrf-large-world-working-set-budget-webgpu-v01',
    title: 'URRF Large World · Working Set Budget WebGPU',
    visual_scale: 4,
    evidence_root: rootHash({stream_root: stream.stream_root, selection_root: selection.selection_root, renderer: 'vsr-spatial-webgpu-working-set-budget'})
  });
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);
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
  const rendered = renderSpatialReference(scene, options);
  assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);
  assert.ok(rendered.png.byteLength > 1000);
  writeFileSync(join(outputDir, 'large-world-working-set-budget-webgpu-reference.png'), rendered.png);
  writeFileSync(join(outputDir, 'large-world-working-set-budget-webgpu-scene.json'), `${JSON.stringify(scene, null, 2)}\n`, 'utf8');
  const browserOptions = {...options, __frameRoot: frame.frameRoot};
  writeFileSync(join(outputDir, 'large-world-working-set-budget-webgpu.html'), browserPage(scene, browserOptions, './large-world-working-set-budget-webgpu-reference.png', selection), 'utf8');

  let browser = null;
  if (existsSync(receiptPath)) {
    browser = JSON.parse(readFileSync(receiptPath, 'utf8'));
    assert.equal(browser.status, 'EXECUTED');
    assert.equal(browser.capability?.available, true);
    assert.equal(browser.receipt?.submitted, true);
    assert.equal(browser.receipt?.deviceLost, false);
    assert.equal(browser.receipt?.frameRoot, frame.frameRoot);
    assert.equal(verifySpatialWebGPUReceipt(browser.receipt), true);
  }
  const reportBase = {
    format: 'urrf.large-world-working-set-budget-webgpu-report.v0.1',
    version: '0.1.0',
    evidence_level: browser ? 'LOCAL_RUNTIME_CPU_REFERENCE_AND_CHROMIUM_WEBGPU' : 'LOCAL_RUNTIME_AND_CPU_REFERENCE_RENDER',
    world_id: scene.large_world.world_id,
    region_root: scene.large_world.region_root,
    stream_root: stream.stream_root,
    selection_root: selection.selection_root,
    scene_root: scene.scene_root,
    frame_root: frame.frameRoot,
    geometry_root: frame.geometryRoot,
    material_root: frame.materialRoot,
    environment_root: frame.environmentRoot,
    pixel_root: rendered.pixelRoot,
    active_chunks: active.length,
    quality_profiles: scene.large_world.quality_profiles,
    quality_counts: Object.fromEntries(LARGE_WORLD_SPATIAL_QUALITY_PROFILES.map(profile => [profile, selection.selections.filter(row => row.selected_quality_profile === profile).length])),
    working_set_budget: selection.working_set_budget,
    working_set_budget_root: selection.working_set_budget_root,
    working_set_budget_status: selection.working_set_budget_status,
    working_set_resource_costs: selection.working_set_resource_costs,
    working_set_resource_remaining: selection.working_set_resource_remaining,
    working_set_downgrade_count: selection.working_set_downgrade_count,
    cpu_reference: {image_path: 'large-world-working-set-budget-webgpu-reference.png', image_bytes: rendered.png.byteLength, width: rendered.framePlan.viewport.width, height: rendered.framePlan.viewport.height, triangles: frame.stats.triangleCount, draw_calls: frame.stats.visibleDraws, frame_root: frame.frameRoot, pixel_root: rendered.pixelRoot},
    browser_execution: browser ? 'EXECUTED' : 'NOT_EXECUTED',
    browser_receipt: browser ? {path: 'large-world-working-set-budget-webgpu-browser-receipt.json', frame_root: browser.receipt.frameRoot, draw_calls: browser.receipt.drawCalls, triangles: browser.receipt.triangles, receipt_root: browser.receipt.receiptRoot, submitted: browser.receipt.submitted, device_lost: browser.receipt.deviceLost} : null,
    artifacts: {scene_json: 'large-world-working-set-budget-webgpu-scene.json', html: 'large-world-working-set-budget-webgpu.html', cpu_reference_png: 'large-world-working-set-budget-webgpu-reference.png', browser_receipt: 'large-world-working-set-budget-webgpu-browser-receipt.json', browser_png: 'large-world-working-set-budget-webgpu-browser.png'},
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', execution_owner: 'VSR', browser_executor: 'Chromium', candidate_only: true, authoritative: false, canonical_write_authorized: false},
    notes: 'The same rooted mixed-quality working-set selection is lowered to a VSR CPU reference and, when the committed local receipt is present, an actual Chromium WebGPU executor. This is machine-local execution evidence; it is not a target-device performance grade, distributed scheduler proof, AAA asset claim, or canonical-world write.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'large-world-working-set-budget-webgpu-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  assert.ok(existsSync(join(outputDir, 'large-world-working-set-budget-webgpu.html')));
  assert.ok(readFileSync(join(outputDir, 'large-world-working-set-budget-webgpu-report.json')).byteLength > 2500);
});
