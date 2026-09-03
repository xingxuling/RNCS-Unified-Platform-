import {existsSync, mkdirSync, mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  createUniversalArtAssetAssembly,
  createUniversalArtAssetEvidenceBundle,
  createUniversalArtAssetHoldoutReport,
  createUniversalArtAssetProfileCoverageReport,
  createUniversalArtAssetProviderPreflightReport,
  generateUniversalArtAssetBatch,
  generateUniversalArtAsset,
  lowerUniversalArtAssetAssemblyToVsr,
  materializeUniversalArtAssetVsrProjection,
  verifyUniversalArtAssetAssembly,
  verifyUniversalArtAssetBatch,
  verifyUniversalArtAssetHoldoutReport,
  verifyUniversalArtAssetProfileCoverageReport,
  verifyUniversalArtAssetProviderExecutionReceipt,
  verifyUniversalArtAssetProviderPreflightReport,
  verifyUniversalArtAssetVsrMaterialization,
  verifyUniversalArtAssetVsrProjection,
  verifyUniversalArtAssetForge
} from '@taowind/large-world-runtime';
import {
  VSRSpatialAssetStreamer,
  compileSpatialFrame,
  renderSpatialReference,
  verifySpatialAssetStreamingReceipt,
  verifySpatialFrame
} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {decodePng} from '@taowind/visual-state-runtime/backend-canvas';
import {
  bindExternalPbrChannelsToGltf,
  importGltfToSpatialSceneAsync,
  parseGlb,
  verifyGltfImportReceipt
} from '@taowind/visual-state-runtime/gltf-asset';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const evidenceDir = resolve(process.env.URRF_UNIVERSAL_ART_ASSET_FORGE_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_UNIVERSAL_ART_ASSET_FORGE'));

function composeUniversalArtAssetVsrScene(importedEntries, sourceRoot, worldId) {
  const scene = {
    format: 'vsr.spatial-scene.v0.4',
    sceneId: 'urrf-universal-art-asset-vsr-aggregate-v01',
    title: 'URRF Universal Art Asset VSR Aggregate',
    activeCameraId: 'camera:urrf-universal-art-aggregate',
    background: '#081421',
    environment: {diffuseColor: '#2b4668', specularColor: '#d6e7ff', intensity: 0.7},
    meshes: [],
    materials: [],
    textures: [],
    animations: [],
    skins: [],
    nodes: [],
    cameras: [{
      id: 'camera:urrf-universal-art-aggregate',
      projection: 'perspective',
      fovYDeg: 48,
      near: 0.1,
      far: 100,
      transform: {translation: [0, 1.3, 7.5], rotationEulerDeg: [-8, 0, 0]}
    }],
    lights: [
      {id: 'light:urrf-universal-art-ambient', kind: 'ambient', color: '#b8d9ff', intensity: 0.3},
      {id: 'light:urrf-universal-art-key', kind: 'directional', color: '#fff0cf', intensity: 1.8, direction: [-0.45, -1, -0.35], castShadow: false}
    ],
    reality: {worldId, realityRoot: sourceRoot}
  };
  for (const {asset, imported} of [...importedEntries].sort((a, b) => a.asset.metadata.asset_key.localeCompare(b.asset.metadata.asset_key))) {
    const prefix = `urrf-universal-art:${asset.metadata.asset_key}`;
    const meshIds = new Map(imported.scene.meshes.map((mesh, index) => [mesh.id, `${prefix}:mesh:${index}`]));
    const textureIds = new Map((imported.scene.textures ?? []).map((texture, index) => [texture.id, `${prefix}:texture:${index}`]));
    const materialIds = new Map(imported.scene.materials.map((material, index) => [material.id, `${prefix}:material:${index}`]));
    const nodeIds = new Map(imported.scene.nodes.map((node, index) => [node.id, `${prefix}:node:${index}`]));
    const skinIds = new Map((imported.scene.skins ?? []).map((skin, index) => [skin.id, `${prefix}:skin:${index}`]));
    const animationIds = new Map((imported.scene.animations ?? []).map((animation, index) => [animation.id, `${prefix}:animation:${index}`]));
    for (const mesh of imported.scene.meshes) scene.meshes.push({...structuredClone(mesh), id: meshIds.get(mesh.id)});
    for (const texture of imported.scene.textures ?? []) scene.textures.push({...structuredClone(texture), id: textureIds.get(texture.id)});
    for (const material of imported.scene.materials) {
      const remapped = {...structuredClone(material), id: materialIds.get(material.id)};
      for (const key of ['baseColorTextureId', 'metallicRoughnessTextureId', 'normalTextureId', 'occlusionTextureId', 'emissiveTextureId', 'lightmapTextureId', 'reactiveMaskTextureId']) {
        if (remapped[key]) remapped[key] = textureIds.get(remapped[key]) ?? remapped[key];
      }
      scene.materials.push(remapped);
    }
    for (const skin of imported.scene.skins ?? []) {
      scene.skins.push({...structuredClone(skin), id: skinIds.get(skin.id), joints: skin.joints.map(joint => nodeIds.get(joint) ?? joint)});
    }
    for (const animation of imported.scene.animations ?? []) {
      scene.animations.push({
        ...structuredClone(animation),
        id: animationIds.get(animation.id),
        channels: animation.channels.map(channel => ({...structuredClone(channel), nodeId: nodeIds.get(channel.nodeId) ?? channel.nodeId}))
      });
    }
    for (const node of imported.scene.nodes) {
      const remapped = {
        ...structuredClone(node),
        id: nodeIds.get(node.id),
        ...(node.parentId ? {parentId: nodeIds.get(node.parentId) ?? node.parentId} : {}),
        ...(node.meshId ? {meshId: meshIds.get(node.meshId) ?? node.meshId} : {}),
        ...(node.materialId ? {materialId: materialIds.get(node.materialId) ?? node.materialId} : {}),
        ...(node.skinId ? {skinId: skinIds.get(node.skinId) ?? node.skinId} : {})
      };
      if (!node.parentId) remapped.transform = {...(remapped.transform ?? {}), translation: [...asset.transform.translation_mm].map(value => value / 1000)};
      scene.nodes.push(remapped);
    }
  }
  return scene;
}

function universalArtAssetVsrBrowserPage(scene, referencePath, renderOptions, report) {
  const sceneJson = JSON.stringify(scene).replaceAll('<', '\\u003c');
  const optionsJson = JSON.stringify(renderOptions);
  const reportJson = JSON.stringify({frame_root: report.frame_root, source_reality_root: report.source_reality_root});
  const sustainedBudgetJson = JSON.stringify({
    sample_count: 12,
    warmup_frame_count: 1,
    max_wall_p95_us: 2500000,
    max_compile_p95_us: 1000000,
    max_encode_p95_us: 1500000,
    max_submit_p95_us: 1500000,
    max_texture_bytes_resident: 2000000,
    max_buffer_bytes_resident: 1000000,
    max_texture_evictions: 0,
    max_buffer_evictions: 0,
    max_frame_root_variants: 1,
    max_device_losses: 0
  });
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>URRF Universal Art Asset · VSR WebGPU</title>
<style>:root{font-family:Inter,"Noto Sans SC",system-ui,sans-serif;color:#e8f0ff;background:#050914;color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:24px;background:radial-gradient(circle at 20% 0,#173c63,#050914 52%)}main{width:min(1180px,100%);margin:auto;display:grid;grid-template-columns:minmax(0,1fr) 286px;gap:18px}.card{border:1px solid #274468;border-radius:18px;background:rgba(5,12,25,.9);overflow:hidden;box-shadow:0 24px 80px #0008}header{padding:18px 20px;border-bottom:1px solid #203a5d}h1{font-size:20px;margin:0 0 6px}p{font-size:13px;line-height:1.55;color:#9fb6d5;margin:0}canvas,img{display:block;width:100%;aspect-ratio:32/21;object-fit:cover;background:#07101e}.bar{display:flex;gap:8px;align-items:center;padding:12px 16px;border-top:1px solid #203a5d;flex-wrap:wrap}.badge{padding:5px 9px;border-radius:999px;background:#102843;color:#9ed0ff;font-size:12px}.ok{background:#123a2c;color:#8ff0bf}.warn{background:#4b3012;color:#ffd188}.panel{padding:18px}.panel h2{font-size:15px;margin:0 0 14px}.metric{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #1d3351;font-size:13px}.metric span{color:#8ba4c6}.metric strong{text-align:right;word-break:break-all;font-weight:600}code{font-size:11px;color:#8fd5ff}@media(max-width:850px){main{grid-template-columns:1fr}.panel{order:-1}}</style></head>
<body><main><section class="card"><header><h1>URRF Universal Art Asset · VSR Spatial WebGPU</h1><p>选定 GLB 与外部四通道 PBR 纹理已在 Node/VSR 中导入；本页验证浏览器 GPU 连续帧提交与资源预算。</p></header><canvas id="gpu" width="640" height="420"></canvas><img id="fallback" src="${referencePath}" alt="VSR CPU reference"><div class="bar"><span id="mode" class="badge">探测中</span><span id="receipt" class="badge">Receipt：—</span><span id="root" class="badge">Frame Root：${report.frame_root.slice(0, 12)}</span></div></section><aside class="card panel"><h2>执行状态</h2><div class="metric"><span>组合节点</span><strong>${scene.nodes.length}</strong></div><div class="metric"><span>纹理 / 材质</span><strong>${scene.textures.length} / ${scene.materials.length}</strong></div><div class="metric"><span>CPU frame root</span><strong><code>${report.frame_root}</code></strong></div><div class="metric"><span>浏览器 API</span><strong id="capability">—</strong></div><div class="metric"><span>GPU frame root</span><strong><code id="frame">—</code></strong></div></aside></main>
<script src="../../../packages/world/visual-state-runtime/apps/spatial-v04/vsr-spatial-browser.js"></script><script>
const scene=${sceneJson};const options=${optionsJson};const expected=${reportJson};const sustainedBudget=${sustainedBudgetJson};const canvas=document.querySelector('#gpu'),fallback=document.querySelector('#fallback'),mode=document.querySelector('#mode'),capability=document.querySelector('#capability'),receipt=document.querySelector('#receipt'),frame=document.querySelector('#frame');
function canonicalJson(value){if(value===null)return'null';if(value===true)return'true';if(value===false)return'false';if(typeof value==='number'){if(!Number.isSafeInteger(value))throw new Error('PERFORMANCE_ROOT_INTEGER_REQUIRED');return String(value)}if(typeof value==='string')return JSON.stringify(value);if(Array.isArray(value))return'['+value.map(canonicalJson).join(',')+']';if(typeof value==='object')return'{'+Object.keys(value).sort().map(key=>canonicalJson(key)+':'+canonicalJson(value[key])).join(',')+'}';throw new Error('PERFORMANCE_ROOT_TYPE_UNSUPPORTED')}
async function sha256Root(value){const bytes=new TextEncoder().encode(canonicalJson(value)),digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')}
function toUs(value){return Math.max(0,Math.round(Number(value??0)*1000))}
function percentile(sorted,quantile){return sorted[Math.min(sorted.length-1,Math.max(0,Math.ceil(sorted.length*quantile)-1))]??0}
function summarize(values){const sorted=[...values].sort((a,b)=>a-b);return{min:sorted[0]??0,p50:percentile(sorted,.5),p95:percentile(sorted,.95),max:sorted.at(-1)??0}}
function summarizeField(samples,field){return summarize(samples.map(sample=>sample[field]))}
function totalField(samples,field){return samples.reduce((total,sample)=>total+sample[field],0)}
function sustainedBase(samples){const warmup=samples.slice(0,sustainedBudget.warmup_frame_count),steady=samples.slice(sustainedBudget.warmup_frame_count),makeMetrics=entries=>({wall:summarizeField(entries,'wall_us'),compile:summarizeField(entries,'compile_us'),upload:summarizeField(entries,'upload_us'),encode:summarizeField(entries,'encode_us'),submit:summarizeField(entries,'submit_us')}),metrics_us=makeMetrics(samples),warmup_metrics_us=makeMetrics(warmup),steady_state_metrics_us=makeMetrics(steady),residency_bytes={texture:summarizeField(samples,'texture_bytes_resident'),buffer:summarizeField(samples,'buffer_bytes_resident')},frameRoots=[...new Set(samples.map(sample=>sample.frame_root))],receiptRoots=[...new Set(samples.map(sample=>sample.receipt_root))],checks={sample_count:samples.length===sustainedBudget.sample_count,wall_p95:metrics_us.wall.p95<=sustainedBudget.max_wall_p95_us,compile_p95:metrics_us.compile.p95<=sustainedBudget.max_compile_p95_us,encode_p95:metrics_us.encode.p95<=sustainedBudget.max_encode_p95_us,submit_p95:metrics_us.submit.p95<=sustainedBudget.max_submit_p95_us,texture_residency:residency_bytes.texture.max<=sustainedBudget.max_texture_bytes_resident,buffer_residency:residency_bytes.buffer.max<=sustainedBudget.max_buffer_bytes_resident,texture_evictions:samples.every(sample=>sample.texture_evictions<=sustainedBudget.max_texture_evictions),buffer_evictions:samples.every(sample=>sample.buffer_evictions<=sustainedBudget.max_buffer_evictions),frame_root_variants:frameRoots.length<=sustainedBudget.max_frame_root_variants,device_losses:samples.every(sample=>!sample.device_lost)};return{format:'urrf.universal-art-asset-vsr-webgpu-sustained-performance.v0.1',version:'0.1.0',sample_count:samples.length,warmup_frame_count:sustainedBudget.warmup_frame_count,steady_state_sample_count:steady.length,samples,metrics_us,warmup_metrics_us,steady_state_metrics_us,residency_bytes,transfer_totals:{texture_uploads:totalField(samples,'texture_uploads'),texture_evictions:totalField(samples,'texture_evictions'),buffer_uploads:totalField(samples,'buffer_uploads'),buffer_evictions:totalField(samples,'buffer_evictions')},steady_state_transfer_totals:{texture_uploads:totalField(steady,'texture_uploads'),texture_evictions:totalField(steady,'texture_evictions'),buffer_uploads:totalField(steady,'buffer_uploads'),buffer_evictions:totalField(steady,'buffer_evictions')},root_stability:{frame_root_variants:frameRoots,receipt_root_variants:receiptRoots,all_frame_roots_match_expected:samples.every(sample=>sample.frame_root===expected.frame_root)},submitted_count:samples.filter(sample=>sample.submitted).length,device_loss_count:samples.filter(sample=>sample.device_lost).length,budget:{...sustainedBudget},budget_checks:checks,budget_failures:Object.keys(checks).filter(key=>!checks[key]),budget_status:Object.values(checks).every(Boolean)?'PASS':'FAIL',performance_root:null}}
async function start(){const api=window.VSRSpatial3D;const probe=api.probeSpatialWebGPU();window.__URRF_UNIVERSAL_ART_ASSET_VSR_WEBGPU__={capability:probe,status:'PROBE_ONLY',sourceRealityRoot:expected.source_reality_root,expectedFrameRoot:expected.frame_root};capability.textContent=probe.available?'available':'unavailable';if(!probe.available){mode.textContent='CPU reference · 未执行 GPU';mode.classList.add('warn');return}try{const executor=await api.VSRSpatialWebGPUExecutor.create(canvas),samples=[];let lastReceipt=null;for(let index=0;index<sustainedBudget.sample_count;index++){const started=performance.now(),result=await executor.render(scene,options),wallMs=performance.now()-started;lastReceipt=result;samples.push({index,phase:index<sustainedBudget.warmup_frame_count?'warmup':'steady_state',wall_us:toUs(wallMs),compile_us:toUs(result.compileMs),upload_us:toUs(result.uploadMs),encode_us:toUs(result.encodeMs),submit_us:toUs(result.submitMs),frame_root:result.frameRoot,receipt_root:result.receiptRoot,submitted:Boolean(result.submitted),device_lost:Boolean(result.deviceLost),texture_bytes_resident:Math.round(result.textureBytesResident??0),texture_uploads:Math.round(result.textureUploads??0),texture_evictions:Math.round(result.textureEvictions??0),buffer_bytes_resident:Math.round(result.bufferBytesResident??0),buffer_uploads:Math.round(result.bufferUploads??0),buffer_evictions:Math.round(result.bufferEvictions??0)})}const base=sustainedBase(samples),{performance_root:_ignoredPerformanceRoot,...rootBase}=base,performanceRoot=await sha256Root(rootBase),sustained={...base,performance_root:performanceRoot},last=samples.at(-1);window.__URRF_UNIVERSAL_ART_ASSET_VSR_WEBGPU__={capability:probe,status:'EXECUTED',sourceRealityRoot:expected.source_reality_root,expectedFrameRoot:expected.frame_root,frameRoot:last.frame_root,receipt:lastReceipt,performanceRoot,sustained,budgetStatus:sustained.budget_status};fallback.style.display='none';mode.textContent='真实 WebGPU 连续执行 · '+sustained.budget_status;mode.classList.add(sustained.budget_status==='PASS'?'ok':'warn');receipt.textContent='Frames：'+sustained.sample_count+' · p95：'+(sustained.metrics_us.wall.p95/1000).toFixed(1)+'ms';frame.textContent=last.frame_root}catch(error){window.__URRF_UNIVERSAL_ART_ASSET_VSR_WEBGPU__={capability:probe,status:'FAILED',sourceRealityRoot:expected.source_reality_root,expectedFrameRoot:expected.frame_root,error:String(error.message??error)};mode.textContent='WebGPU 失败：'+error.message;mode.classList.add('warn')}}start();
</script></body></html>`;
}

test('URRF Universal Art Asset Forge emits a rooted candidate and closes AAA claims without required evidence', () => {
  const outDir = join(tmpdir(), 'taowind-urrf-universal-art-forge-v01');
  const result = generateUniversalArtAsset({
    description: '一名守护远古冰晶遗迹的三维女剑士，带有冰纹重甲和可回放攻击动作。',
    asset_profile: 'character',
    asset_kind: 'character-3d',
    quality_tier: 'AAA',
    seed: 'urrf-universal-art-asset-forge-integration',
    target_platforms: ['desktop', 'web'],
    constraints: {max_triangles: 2400, pbr_texture_size: 128}
  }, {outDir});
  assert.equal(result.execution.status, 'COMPLETED');
  assert.equal(result.workspaceVerification.valid, true);
  assert.equal(result.acceptance.status, 'BLOCKED');
  assert.equal(result.acceptance.aaa_verified, false);
  assert.equal(result.execution.file_inspection.status, 'PASS');
  assert.equal(result.execution.file_inspection.aggregates.lod_status, 'PASS');
  assert.equal(result.acceptance.failures.includes('topology_gate'), false);
  assert.equal(result.acceptance.failures.includes('uv_gate'), false);
  assert.equal(result.acceptance.failures.includes('normal_gate'), false);
  assert.equal(result.acceptance.failures.includes('lod_gate'), false);
  assert.equal(verifyUniversalArtAssetForge({
    forge: result.forge,
    genome: result.genome,
    acceptance: result.acceptance,
    evidenceLedger: result.evidenceLedger,
    fileInspection: result.execution.file_inspection
  }).valid, true);
  assert.equal(result.providerExecutionReceipt.status, 'CANDIDATE_PROVIDER_EXECUTION_PASS');
  assert.equal(verifyUniversalArtAssetProviderExecutionReceipt(result.providerExecutionReceipt, {
    genome: result.genome,
    resolution: result.resolution,
    execution: result.execution,
    workspaceVerification: result.workspaceVerification,
    candidate: result.candidate,
    acceptance: result.acceptance,
    evidenceLedger: result.evidenceLedger,
    fileInspection: result.fileInspection
  }).valid, true);

  const reportBase = {
    format: 'urrf.universal-art-asset-forge-report.v0.1',
    version: '0.1.0',
    status: result.status,
    execution: {
      mode: result.execution.mode,
      status: result.execution.status,
      provider_id: result.execution.provider_id,
      workspace_root: result.execution.workspace_root,
      workspace_verified: result.workspaceVerification.valid
    },
    roots: {
      genome_root: result.genome.genome_root,
      provider_resolution_root: result.resolution.resolution_root,
      workspace_root: result.workspace.workspace_root,
      candidate_root: result.candidate.candidate_root,
      acceptance_root: result.acceptance.acceptance_root,
      evidence_ledger_root: result.evidenceLedger.ledger_root,
      file_inspection_root: result.execution.file_inspection.inspection_root,
      forge_root: result.forge.forge_root
    },
    profile: result.genome.asset_profile,
    target_quality_tier: result.genome.quality_tier,
    metrics: result.acceptance.metrics,
    gates: Object.fromEntries(result.acceptance.gates.map(gate => [gate.gate, {status: gate.status, required: gate.required, reason: gate.reason}])),
    failures: result.acceptance.failures,
    authority: result.forge.authority,
    notes: 'Candidate-only local RAGF reference execution. The forge independently inspects generated GLB accessors, welded indexed topology, UVs, normals, material structure, the external four-map PBR pack, and a contiguous decreasing three-level LOD sequence; Provider provenance/license/quality/art-direction/human-review declarations cannot open their AAA gates, independent provenance/license, quality, and review receipts are absent, and AAA remains blocked on those evidence gates. It is not AAA production art proof or canonical RNCS mutation.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  const incompleteEvidenceBundle = createUniversalArtAssetEvidenceBundle({
    genome: result.genome,
    candidate: result.candidate,
    fileInspection: result.execution.file_inspection,
    providerId: result.execution.provider_id,
    targetPlatforms: result.genome.target_platforms
  });
  assert.equal(incompleteEvidenceBundle.status, 'INCOMPLETE');
  mkdirSync(evidenceDir, {recursive: true});
  writeFileSync(join(evidenceDir, 'universal-art-asset-forge-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-provider-execution.json'), `${JSON.stringify(result.providerExecutionReceipt, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-genome.json'), `${JSON.stringify(result.genome, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-acceptance.json'), `${JSON.stringify(result.acceptance, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-evidence-ledger.json'), `${JSON.stringify(result.evidenceLedger, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-file-inspection.json'), `${JSON.stringify(result.execution.file_inspection, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-evidence-bundle.json'), `${JSON.stringify(incompleteEvidenceBundle, null, 2)}\n`, 'utf8');
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
});

test('URRF holdout regression evaluates new seeds across the exercised profile set', () => {
  const baselineOutDir = join(tmpdir(), 'taowind-urrf-universal-art-holdout-baseline-v01');
  const holdoutOutDir = join(tmpdir(), 'taowind-urrf-universal-art-holdout-candidate-v01');
  const baseline = generateUniversalArtAssetBatch([
    {
      description: '一名守护古代冰晶遗迹的三维女剑士，穿着带有冰纹的重甲。',
      asset_profile: 'character',
      asset_kind: 'character-3d',
      quality_tier: 'AAA',
      asset_key: 'baseline-guardian-character',
      seed: 'urrf-holdout-baseline-character-seed',
      target_platforms: ['desktop', 'web'],
      constraints: {max_triangles: 2400, pbr_texture_size: 128}
    },
    {
      description: '一枚用于冰晶遗迹祭坛的三维古代护符。',
      asset_profile: 'prop',
      asset_kind: 'prop-3d',
      quality_tier: 'AAA',
      asset_key: 'baseline-ice-relic-prop',
      seed: 'urrf-holdout-baseline-prop-seed',
      target_platforms: ['desktop', 'web'],
      constraints: {max_triangles: 2400, pbr_texture_size: 128}
    }
  ], {outDir: baselineOutDir});
  const holdout = generateUniversalArtAssetBatch([
    {
      description: '一名在极光废墟巡逻的三维女守卫，穿着带有冰纹的轻型护甲。',
      asset_profile: 'character',
      asset_kind: 'character-3d',
      quality_tier: 'AAA',
      asset_key: 'holdout-aurora-guardian-character',
      seed: 'urrf-holdout-character-seed',
      target_platforms: ['desktop', 'web'],
      constraints: {max_triangles: 2400, pbr_texture_size: 128}
    },
    {
      description: '一枚用于荒原观测塔的三维晶体测距仪，具有可复用的材质与碰撞边界。',
      asset_profile: 'prop',
      asset_kind: 'prop-3d',
      quality_tier: 'AAA',
      asset_key: 'holdout-observatory-prop',
      seed: 'urrf-holdout-prop-seed',
      target_platforms: ['desktop', 'web'],
      constraints: {max_triangles: 2400, pbr_texture_size: 128}
    }
  ], {outDir: holdoutOutDir});
  const report = createUniversalArtAssetHoldoutReport({
    holdout_id: 'urrf-universal-art-holdout-integration-v01',
    batch: holdout,
    expected_profiles: ['character', 'prop'],
    baseline_roots: {
      batch_root: baseline.batch.batch_root,
      genome_roots: baseline.batch.assets.map(asset => asset.genome_root),
      candidate_roots: baseline.batch.assets.map(asset => asset.candidate_root),
      forge_roots: baseline.batch.assets.map(asset => asset.forge_root)
    }
  });
  assert.equal(report.status, 'CANDIDATE_HOLDOUT_PASS');
  assert.equal(report.summary.structural_pass_count, 2);
  assert.equal(report.summary.acceptance_pass_count, 0);
  assert.equal(report.checks.baseline_batch_root_distinct, true);
  assert.equal(report.checks.baseline_root_isolation, true);
  assert.deepEqual(report.coverage.missing_profiles, []);
  assert.equal(verifyUniversalArtAssetHoldoutReport(report, {batch: holdout}).valid, true);
  mkdirSync(evidenceDir, {recursive: true});
  writeFileSync(join(evidenceDir, 'universal-art-asset-holdout.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const tamperedBase = structuredClone(report);
  tamperedBase.assets[0].candidate_root = tamperedBase.assets[1].candidate_root;
  delete tamperedBase.holdout_root;
  const tamperedReport = {...tamperedBase, holdout_root: rootHash(tamperedBase)};
  assert.equal(verifyUniversalArtAssetHoldoutReport(tamperedReport, {batch: holdout}).valid, false);
});

test('URRF profile coverage exercises every asset family without silent Provider fallback', () => {
  const coverageOutDir = join(tmpdir(), 'taowind-urrf-universal-art-profile-coverage-v01');
  const profileInputs = [
    ['character', 'character-3d', '一名守护古代冰晶遗迹的三维女剑士。'],
    ['creature', 'creature-3d', '一头栖息在极寒遗迹中的三维冰晶巨兽。'],
    ['prop', 'prop-3d', '一枚用于冰晶遗迹祭坛的三维古代护符。'],
    ['vehicle', 'vehicle-3d', '一辆能够穿越冻原裂谷的三维远古装甲载具。'],
    ['structure', 'structure-3d', '一座带有风化石墙和入口拱门的三维遗迹建筑。'],
    ['environment', 'environment-3d', '一片包含冰原、遗迹和远景山脊的三维环境。'],
    ['vegetation', 'vegetation-3d', '一株生长在冰晶裂谷边缘的三维发光植物。'],
    ['resource', 'resource-3d', '一簇可用于世界资源节点的三维冰晶矿石。'],
    ['vfx', 'vfx-3d', '一组需要真实粒子材质和轨迹的三维魔法爆炸特效。']
  ].map(([asset_profile, asset_kind, description]) => ({
    asset_key: `profile-coverage-${asset_profile}`,
    asset_profile,
    asset_kind,
    description,
    quality_tier: 'AAA',
    seed: `urrf-profile-coverage-${asset_profile}-seed`,
    target_platforms: ['desktop', 'web'],
    constraints: {max_triangles: 2400, pbr_texture_size: 128}
  }));
  const entries = profileInputs.map((input, index) => ({
    input,
    result: generateUniversalArtAsset(input, {outDir: join(coverageOutDir, `${String(index).padStart(2, '0')}-${input.asset_profile}`)})
  }));
  const expectedProfiles = profileInputs.map(input => input.asset_profile);
  const expectedModes = {
    character: 'BUILTIN_REFERENCE',
    creature: 'EXTERNAL_CONTRACT_ONLY',
    prop: 'BUILTIN_REFERENCE',
    vehicle: 'EXTERNAL_CONTRACT_ONLY',
    structure: 'EXTERNAL_CONTRACT_ONLY',
    environment: 'EXTERNAL_CONTRACT_ONLY',
    vegetation: 'EXTERNAL_CONTRACT_ONLY',
    resource: 'EXTERNAL_CONTRACT_ONLY',
    vfx: 'UNRESOLVED'
  };
  const report = createUniversalArtAssetProfileCoverageReport({
    coverage_id: 'urrf-profile-coverage-integration-v01',
    entries,
    expected_profiles: expectedProfiles,
    expected_modes: expectedModes
  });
  assert.equal(report.status, 'CANDIDATE_PROFILE_COVERAGE_PASS');
  assert.equal(report.summary.pass_count, 9);
  assert.equal(report.summary.fail_count, 0);
  assert.equal(report.summary.mode_histogram.BUILTIN_REFERENCE, 2);
  assert.equal(report.summary.mode_histogram.EXTERNAL_CONTRACT_ONLY, 6);
  assert.equal(report.summary.mode_histogram.UNRESOLVED, 1);
  assert.deepEqual(report.coverage.missing_profiles, []);
  assert.deepEqual(report.coverage.unexpected_profiles, []);
  assert.equal(report.coverage.unique_genome_root_count, 9);
  assert.equal(report.coverage.unique_resolution_root_count, 9);
  assert.equal(report.entries.find(entry => entry.asset_profile === 'vfx').resolution.selected_provider_source, null);
  assert.equal(verifyUniversalArtAssetProfileCoverageReport(report).valid, true);
  assert.equal(verifyUniversalArtAssetProfileCoverageReport(report, {entries}).valid, true);
  mkdirSync(evidenceDir, {recursive: true});
  writeFileSync(join(evidenceDir, 'universal-art-asset-profile-coverage.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const tampered = structuredClone(report);
  tampered.entries.find(entry => entry.asset_profile === 'vfx').resolution.selected_provider_source = 'ragf-reference-provider';
  delete tampered.coverage_root;
  tampered.coverage_root = rootHash(tampered);
  assert.equal(verifyUniversalArtAssetProfileCoverageReport(tampered).valid, false);
  assert.equal(verifyUniversalArtAssetProfileCoverageReport(tampered, {entries}).valid, false);
});

test('URRF Provider preflight records route readiness, runtime binding, and release blockers', () => {
  const report = createUniversalArtAssetProviderPreflightReport({
    preflight_id: 'urrf-provider-preflight-integration-v01'
  });
  assert.equal(report.status, 'CANDIDATE_PROVIDER_PREFLIGHT_PASS');
  assert.equal(report.summary.profile_count, 9);
  assert.equal(report.summary.provider_count, 6);
  assert.equal(report.summary.route_histogram.BUILTIN_REFERENCE_READY, 2);
  assert.equal(report.summary.route_histogram.EXTERNAL_CONTRACT_ONLY, 6);
  assert.equal(report.summary.route_histogram.EXTERNAL_RUNTIME_BOUND, 0);
  assert.equal(report.summary.route_histogram.UNRESOLVED, 1);
  assert.equal(report.summary.provider_health_histogram.CONTRACT_ONLY, 6);
  assert.equal(report.summary.release_blocked_provider_count, 6);
  assert.equal(report.profile_routes.find(entry => entry.asset_profile === 'environment').route_status, 'EXTERNAL_CONTRACT_ONLY');
  assert.equal(report.profile_routes.find(entry => entry.asset_profile === 'vfx').selected_provider_id, null);
  assert.equal(report.profile_routes.find(entry => entry.asset_profile === 'vfx').selected_provider_source, null);
  assert.equal(report.execution_performed, false);
  assert.equal(report.aaa_ready, false);
  assert.equal(report.release_ready, false);
  assert.equal(verifyUniversalArtAssetProviderPreflightReport(report).valid, true);
  mkdirSync(evidenceDir, {recursive: true});
  writeFileSync(join(evidenceDir, 'universal-art-asset-provider-preflight.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const tampered = structuredClone(report);
  tampered.profile_routes.find(entry => entry.asset_profile === 'environment').route_status = 'BUILTIN_REFERENCE_READY';
  delete tampered.preflight_root;
  tampered.preflight_root = rootHash(tampered);
  assert.equal(verifyUniversalArtAssetProviderPreflightReport(tampered).valid, false);
});

test('URRF Universal Art Asset Forge isolates a multi-asset candidate batch and indexes reusable roots', async () => {
  const outDir = join(tmpdir(), 'taowind-urrf-universal-art-batch-v01');
  const result = generateUniversalArtAssetBatch([
    {
      description: '一名守护远古冰晶遗迹的三维女剑士，带有冰纹重甲和可回放攻击动作。',
      asset_profile: 'character',
      asset_kind: 'character-3d',
      quality_tier: 'AAA',
      asset_key: 'guardian-character',
      seed: 'urrf-universal-art-batch-character-integration',
      target_platforms: ['desktop', 'web'],
      constraints: {max_triangles: 2400, pbr_texture_size: 128}
    },
    {
      description: '一块可用于遗迹祭坛的冰晶能源核心道具，具有可复用的材质与碰撞边界。',
      asset_profile: 'prop',
      asset_kind: 'prop-3d',
      quality_tier: 'AAA',
      asset_key: 'ice-relic-prop',
      seed: 'urrf-universal-art-batch-prop-integration',
      target_platforms: ['desktop', 'web'],
      constraints: {max_triangles: 1600, pbr_texture_size: 128}
    }
  ], {outDir});
  assert.equal(result.batch.asset_count, 2);
  assert.equal(result.batch.status, 'BLOCKED');
  assert.equal(result.batch.summary.blocked_count, 2);
  assert.equal(result.batch.summary.acceptance_pass_count, 0);
  assert.ok(result.batch.summary.unique_artifact_root_count > 0);
  assert.equal(result.verification.valid, true);
  assert.equal(verifyUniversalArtAssetBatch(result.batch, {assetResults: result.assets}).valid, true);
  assert.equal(existsSync(join(outDir, 'assets', '001-guardian-character', 'universal-art-asset-forge.json')), true);
  assert.equal(existsSync(join(outDir, 'assets', '002-ice-relic-prop', 'universal-art-asset-forge.json')), true);

  mkdirSync(evidenceDir, {recursive: true});
  writeFileSync(join(evidenceDir, 'universal-art-asset-batch.json'), `${JSON.stringify(result.batch, null, 2)}\n`, 'utf8');
  assert.match(result.batch.batch_root, /^[a-f0-9]{64}$/);

  const assembly = createUniversalArtAssetAssembly({
    batch: result.batch,
    assetResults: result.assets,
    scene_id: 'urrf-universal-art-assembly-integration',
    world_id: 'world:urrf-universal-art-assembly-integration',
    placements_mm: [
      {asset_key: 'guardian-character', translation_mm: [1200, 0, -900]},
      {asset_key: 'ice-relic-prop', translation_mm: [-1200, 0, 900]}
    ],
    lod_by_asset: {'guardian-character': 0, 'ice-relic-prop': 1},
    load_radius: 72,
    unload_radius: 96
  });
  assert.equal(verifyUniversalArtAssetAssembly(assembly, {batch: result.batch, assetResults: result.assets}).valid, true);
  const projection = lowerUniversalArtAssetAssemblyToVsr(assembly);
  assert.equal(verifyUniversalArtAssetVsrProjection(projection, {assembly}).valid, true);
  const materialized = materializeUniversalArtAssetVsrProjection(projection, {assembly});
  assert.equal(materialized.materialization.status, 'READY_FOR_VSR_IMPORT');
  assert.equal(verifyUniversalArtAssetVsrMaterialization(materialized.materialization, {
    projection,
    assembly,
    payloads: materialized.payloads
  }).valid, true);
  const catalog = materialized.catalog;
  const payloads = materialized.payloads;
  const meshCatalog = catalog.filter(asset => asset.kind === 'mesh');
  const textureCatalog = catalog.filter(asset => asset.kind === 'texture');
  const importedSceneEntries = [];
  const streamer = new VSRSpatialAssetStreamer(catalog, asset => payloads.get(asset.id), {maxConcurrent: 2});
  const streamingReceipt = await streamer.acquire({
    activeCellIds: projection.streaming.cells.map(cell => cell.id),
    requestedAssetIds: meshCatalog.map(asset => asset.id),
    maxAssets: catalog.length,
    maxBytes: materialized.materialization.total_byte_length,
    lease: false
  });
  assert.equal(verifySpatialAssetStreamingReceipt(streamingReceipt), true);
  assert.deepEqual([...streamingReceipt.readyAssetIds].sort(), catalog.map(asset => asset.id).sort());
  const importedAssets = await Promise.all(projection.assets.map(async asset => {
    const meshBytes = streamer.get(asset.id);
    assert.ok(meshBytes);
    const parsed = parseGlb(meshBytes);
    const pbrChannels = asset.dependencies.map(dependencyId => {
      const dependency = projection.dependencies.find(entry => entry.id === dependencyId);
      assert.ok(dependency);
      const bytes = streamer.get(dependency.id);
      assert.ok(bytes);
      return {
        role: dependency.metadata.pbr_role,
        bytes,
        mimeType: dependency.format,
        colorSpace: dependency.metadata.pbr_role === 'normal' || dependency.metadata.pbr_role === 'occlusion-roughness-metallic' ? 'linear' : 'srgb',
        uri: dependency.uri
      };
    });
    const bound = bindExternalPbrChannelsToGltf(parsed.gltf, pbrChannels, {
      sourcePrefix: `urrf-external-pbr/${asset.metadata.asset_key}`
    });
    const imported = await importGltfToSpatialSceneAsync(bound.gltf, {
      sceneId: `urrf-universal-art-vsr-import-${asset.metadata.asset_key}`,
      sourceRoot: projection.assembly_root,
      buffers: {'buffer:0': parsed.binaryChunk},
      imageBytes: bound.imageBytes,
      imageDecoder: async ({id, bytes, image, sampler}) => {
        const decoded = decodePng(bytes);
        return {
          id,
          width: decoded.width,
          height: decoded.height,
          pixels: Array.from(decoded.data),
          colorSpace: image?.extras?.vsrColorSpace ?? 'srgb',
          filter: sampler?.minFilter === 9728 || sampler?.magFilter === 9728 ? 'nearest' : 'linear',
          wrapU: sampler?.wrapS === 33071 ? 'clamp' : 'repeat',
          wrapV: sampler?.wrapT === 33071 ? 'clamp' : 'repeat'
        };
      }
    });
    assert.equal(verifyGltfImportReceipt(imported.receipt), true);
    assert.ok(imported.scene.meshes.length > 0);
    assert.ok(imported.scene.materials.length > 0);
    assert.equal(imported.receipt.textureCount, 4);
    assert.equal(imported.receipt.materialTextureBindingCount, 5);
    const meshNode = imported.scene.nodes.find(node => node.meshId);
    assert.ok(meshNode);
    meshNode.transform = {...(meshNode.transform ?? {}), translation: [...asset.transform.translation]};
    const frame = compileSpatialFrame(imported.scene, {width: 160, height: 160, enableShadows: false});
    assert.equal(verifySpatialFrame(frame).ok, true);
    assert.ok(frame.stats.triangleCount > 0);
    const rendered = renderSpatialReference(imported.scene, {width: 160, height: 160, enableShadows: false});
    const renderedPng = decodePng(rendered.png);
    assert.equal(renderedPng.width, 160);
    assert.equal(renderedPng.height, 160);
    assert.equal(renderedPng.data.byteLength, 160 * 160 * 4);
    const background = renderedPng.data.slice(0, 3);
    const nonBackgroundPixelCount = Array.from({length: 160 * 160}, (_, index) => index)
      .filter(index => {
        const offset = index * 4;
        return renderedPng.data[offset] !== background[0]
          || renderedPng.data[offset + 1] !== background[1]
          || renderedPng.data[offset + 2] !== background[2];
      }).length;
    assert.ok(nonBackgroundPixelCount > 0);
    importedSceneEntries.push({asset, imported});
    return {
      id: asset.id,
      asset_key: asset.metadata.asset_key,
      selected_lod: asset.metadata.selected_lod,
      placement_mm: asset.transform.translation_mm,
      import_receipt_root: imported.receipt.receiptRoot,
      scene_root: imported.receipt.sceneRoot,
      frame_root: frame.frameRoot,
      mesh_count: imported.receipt.meshCount,
      texture_count: imported.receipt.textureCount,
      material_texture_binding_count: imported.receipt.materialTextureBindingCount,
      triangle_count: frame.stats.triangleCount,
      pbr_channel_count: pbrChannels.length,
      pbr_byte_length: pbrChannels.reduce((sum, channel) => sum + channel.bytes.byteLength, 0),
      rendered_png_byte_length: rendered.png.byteLength,
      rendered_pixel_root: rendered.pixelRoot,
      rendered_non_background_pixel_count: nonBackgroundPixelCount
    };
  }));
  const aggregateScene = composeUniversalArtAssetVsrScene(importedSceneEntries, assembly.assembly_root, projection.world_id);
  const aggregateRenderOptions = {width: 640, height: 420, enableShadows: false};
  const aggregateFrame = compileSpatialFrame(aggregateScene, aggregateRenderOptions);
  assert.equal(verifySpatialFrame(aggregateFrame).ok, true);
  assert.equal(aggregateFrame.stats.materialTextureBindings, 10);
  assert.equal(aggregateFrame.stats.triangleCount, importedAssets.reduce((sum, asset) => sum + asset.triangle_count, 0));
  const aggregateRendered = renderSpatialReference(aggregateScene, aggregateRenderOptions);
  const aggregatePng = decodePng(aggregateRendered.png);
  assert.equal(aggregatePng.width, 640);
  assert.equal(aggregatePng.height, 420);
  assert.equal(aggregatePng.data.byteLength, 640 * 420 * 4);
  assert.ok(aggregateRendered.pixelRoot);
  const aggregateBrowserReportBase = {
    format: 'urrf.universal-art-asset-vsr-webgpu-report.v0.1',
    version: '0.1.0',
    source_reality_root: aggregateFrame.sourceRealityRoot,
    assembly_root: assembly.assembly_root,
    projection_root: projection.projection_root,
    materialization_root: materialized.materialization.materialization_root,
    scene_id: aggregateScene.sceneId,
    world_id: aggregateScene.reality.worldId,
    asset_count: projection.assets.length,
    mesh_count: aggregateScene.meshes.length,
    texture_count: aggregateScene.textures.length,
    material_count: aggregateScene.materials.length,
    material_texture_bindings: aggregateFrame.stats.materialTextureBindings,
    triangle_count: aggregateFrame.stats.triangleCount,
    frame_root: aggregateFrame.frameRoot,
    pixel_root: aggregateRendered.pixelRoot,
    render_width: aggregatePng.width,
    render_height: aggregatePng.height,
    browser_execution: 'NOT_EXECUTED_IN_NODE',
    actual_gpu_execution: false,
    artifacts: {
      scene_json: 'universal-art-asset-vsr-aggregate-scene.json',
      cpu_reference_png: 'universal-art-asset-vsr-aggregate-cpu-reference.png',
      browser_html: 'universal-art-asset-vsr-webgpu.html',
      browser_receipt: 'universal-art-asset-vsr-webgpu-browser-receipt.json',
      browser_performance: 'universal-art-asset-vsr-webgpu-performance.json',
      browser_png: 'universal-art-asset-vsr-webgpu-browser.png'
    },
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', execution_owner: 'VSR', candidate_only: true, authoritative: false},
    notes: 'Candidate-only local browser execution seam for the dependency-complete universal art assembly. Node produced the aggregate scene and CPU reference; browser GPU submission and the 12-frame performance budget sample are independently run and recorded, and neither proves target-device performance or AAA art quality.'
  };
  const aggregateBrowserReport = {...aggregateBrowserReportBase, report_root: rootHash(aggregateBrowserReportBase)};
  writeFileSync(join(evidenceDir, 'universal-art-asset-vsr-aggregate-scene.json'), `${JSON.stringify(aggregateScene)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-vsr-aggregate-cpu-reference.png'), aggregateRendered.png);
  writeFileSync(join(evidenceDir, 'universal-art-asset-vsr-webgpu-report.json'), `${JSON.stringify(aggregateBrowserReport, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-vsr-webgpu.html'), universalArtAssetVsrBrowserPage(aggregateScene, './universal-art-asset-vsr-aggregate-cpu-reference.png', aggregateRenderOptions, aggregateBrowserReport), 'utf8');
  const importReportBase = {
    format: 'urrf.universal-art-asset-vsr-import-execution-report.v0.1',
    version: '0.1.0',
    execution_id: `urrf-universal-art-vsr-import:${materialized.materialization.materialization_root.slice(0, 24)}`,
    materialization_root: materialized.materialization.materialization_root,
    projection_root: projection.projection_root,
    assembly_root: assembly.assembly_root,
    scene_id: projection.scene_id,
    world_id: projection.world_id,
    status: 'CANDIDATE_LOCAL_CPU_PASS',
    runtime_consumer: 'VSR_GLTF_IMPORT',
    streaming_receipt_root: streamingReceipt.receiptRoot,
    asset_count: projection.assets.length,
    catalog_asset_count: catalog.length,
    streamed_asset_count: streamingReceipt.readyAssetIds.length,
    streamed_mesh_asset_count: streamingReceipt.readyAssetIds.filter(id => meshCatalog.some(asset => asset.id === id)).length,
    streamed_texture_asset_count: streamingReceipt.readyAssetIds.filter(id => textureCatalog.some(asset => asset.id === id)).length,
    imported_asset_count: importedAssets.length,
    frame_count: importedAssets.length,
    total_triangle_count: importedAssets.reduce((sum, asset) => sum + asset.triangle_count, 0),
    total_texture_count: importedAssets.reduce((sum, asset) => sum + asset.texture_count, 0),
    total_material_texture_binding_count: importedAssets.reduce((sum, asset) => sum + asset.material_texture_binding_count, 0),
    external_pbr_channel_count: materialized.materialization.dependencies.length,
    texture_decode_mode: 'node-png-decode',
    pbr_binding_mode: 'vsr-external-channel-adapter',
    render_mode: 'vsr-cpu-reference-raster',
    rendered_asset_count: importedAssets.filter(asset => asset.rendered_png_byte_length > 0).length,
    total_rendered_png_byte_length: importedAssets.reduce((sum, asset) => sum + asset.rendered_png_byte_length, 0),
    total_rendered_non_background_pixel_count: importedAssets.reduce((sum, asset) => sum + asset.rendered_non_background_pixel_count, 0),
    actual_gpu_execution: false,
    target_device_execution: false,
    assets: importedAssets,
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    authority: {
      canonical_owner: 'RNCS',
      representation_owner: 'URRF',
      provider_can_write_authoritative_world_state: false,
      provider_can_commit: false,
      acceptance_can_commit: false,
      rncs_authority_required: true
    }
  };
  const importReport = {...importReportBase, report_root: rootHash(importReportBase)};
  assert.equal(importReport.catalog_asset_count, 10);
  assert.equal(importReport.streamed_mesh_asset_count, 2);
  assert.equal(importReport.streamed_texture_asset_count, 8);
  assert.equal(importReport.external_pbr_channel_count, 8);
  assert.equal(importReport.total_texture_count, 8);
  assert.equal(importReport.total_material_texture_binding_count, 10);
  assert.equal(importReport.render_mode, 'vsr-cpu-reference-raster');
  assert.equal(importReport.rendered_asset_count, 2);
  assert.ok(importReport.total_rendered_png_byte_length > 0);
  assert.ok(importReport.total_rendered_non_background_pixel_count > 0);
  assert.equal(aggregateBrowserReport.asset_count, 2);
  assert.equal(aggregateBrowserReport.texture_count, 8);
  assert.equal(aggregateBrowserReport.material_texture_bindings, 10);
  assert.equal(aggregateBrowserReport.actual_gpu_execution, false);
  assert.equal(aggregateBrowserReport.artifacts.browser_performance, 'universal-art-asset-vsr-webgpu-performance.json');
  writeFileSync(join(evidenceDir, 'universal-art-asset-assembly.json'), `${JSON.stringify(assembly, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-vsr-projection.json'), `${JSON.stringify(projection, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-vsr-materialization.json'), `${JSON.stringify(materialized.materialization, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-vsr-import-execution.json'), `${JSON.stringify(importReport, null, 2)}\n`, 'utf8');
  assert.match(assembly.assembly_root, /^[a-f0-9]{64}$/);
  assert.match(projection.projection_root, /^[a-f0-9]{64}$/);
  assert.match(materialized.materialization.materialization_root, /^[a-f0-9]{64}$/);
  assert.match(importReport.report_root, /^[a-f0-9]{64}$/);
});
