import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE,
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
  VSRSpatialWebGPUExecutor,
  applySpatialTextureResidency,
  verifySpatialAssetStreamingReceipt,
  verifySpatialWebGPUReceipt
} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {decodeGltfImageToSpatialTexture, importGlbToSpatialSceneAsync, verifyGltfImportReceipt} from '@taowind/visual-state-runtime/gltf-asset';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_TEXTURE_RESIDENCY_WEBGPU_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_TEXTURE_RESIDENCY_WEBGPU'));

function lowerTextureSet(scene, textureResidency, input) {
  const maps = textureResidency.maps;
  const plans = maps.map(map => resolveLargeWorldTextureResidency({...textureResidency, ...map, levels: map.levels}, input));
  const selections = scene.textures.map((texture, index) => applySpatialTextureResidency(texture, {selectedLevel: plans[index].selected_level, residentLevels: plans[index].resident_levels, planRoot: plans[index].root}));
  return {scene: {...scene, textures: selections.map(selection => selection.texture)}, plans, receipts: selections.map(selection => selection.receipt)};
}

function configurePresentation(scene) {
  return {
    ...scene,
    background: '#07111e',
    cameras: scene.cameras.map((camera, index) => index === 0 ? {...camera, transform: {translation: [32, 14, 78], rotationEulerDeg: [-18, 0, 0]}} : camera),
    lights: [
      {id: 'light:webgpu:ambient', kind: 'ambient', color: '#d9e7ff', intensity: .35},
      {id: 'light:webgpu:sun', kind: 'directional', color: '#fff0ce', intensity: 1.2, direction: [-.45, -1, -.35], castShadow: false}
    ]
  };
}

function fakeWebGPU(textureDescriptors, calls) {
  const resource = kind => {const id = `${kind}:${calls.length}`; return {id, createView: () => ({id: `view:${id}`}), destroy: () => calls.push(`destroy:${id}`)};};
  const device = {
    lost: new Promise(() => {}),
    createShaderModule: ({code}) => {calls.push(`shader:${code.includes('vs_fullscreen') ? 'tone' : code.includes('textureSampleCompare') ? 'scene' : code.includes('cs_cull') ? 'cull' : 'shadow'}`); return {code};},
    createRenderPipeline: descriptor => {calls.push(`pipeline:${descriptor.vertex.entryPoint}`); return {getBindGroupLayout: index => ({index}), descriptor};},
    createBindGroupLayout: descriptor => {calls.push(`compute-layout:${descriptor.entries.length}`); return {descriptor};},
    createPipelineLayout: descriptor => {calls.push(`pipeline-layout:${descriptor.bindGroupLayouts.length}`); return {descriptor};},
    createComputePipeline: descriptor => {calls.push(`compute:${descriptor.compute.entryPoint}`); return {getBindGroupLayout: index => ({index}), descriptor};},
    createBuffer: descriptor => {calls.push(`buffer:${descriptor.size}`); return resource('buffer');},
    createTexture: descriptor => {textureDescriptors.push({format: descriptor.format, mipLevelCount: descriptor.mipLevelCount, size: [...descriptor.size]}); calls.push(`texture:${descriptor.format}`); return resource('texture');},
    createSampler: () => {calls.push('sampler'); return resource('sampler');},
    createBindGroup: descriptor => {calls.push(`bind:${descriptor.entries.length}`); return resource('bind');},
    createCommandEncoder: () => ({
      beginComputePass: () => ({setPipeline: pipeline => calls.push(`use:${pipeline.descriptor.compute.entryPoint}`), setBindGroup: () => {}, dispatchWorkgroups: count => calls.push(`dispatch:${count}`), end: () => calls.push('end-compute')}),
      beginRenderPass: descriptor => {calls.push(`pass:${descriptor.colorAttachments.length ? 'scene' : 'shadow'}`); return {setPipeline: () => calls.push('set-pipeline'), setBindGroup: index => calls.push(`set-group:${index}`), setVertexBuffer: () => {}, setIndexBuffer: () => {}, drawIndexed: (_indexCount, instanceCount) => calls.push(`draw:${instanceCount}`), drawIndexedIndirect: () => calls.push('draw-indirect'), draw: vertexCount => calls.push(`draw:${vertexCount}`), end: () => calls.push('end-pass')};},
      finish: () => ({})
    }),
    queue: {writeBuffer: () => {}, writeTexture: () => calls.push('write-texture'), submit: () => calls.push('submit'), onSubmittedWorkDone: async () => {}}
  };
  return device;
}

test('executes URRF selected mip resources through the VSR WebGPU executor seam', async () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({worldId: 'world:urrf-large-world-texture-residency-webgpu', seed: 'seed:urrf-large-world-texture-residency-webgpu', width: 5, depth: 5, chunkSize: 64, sampleResolution: 8, loadRadius: 1, unloadRadius: 2, maxActiveChunks: 9});
  const stream = runtime.observe({x: 0, z: 0});
  const active = runtime.listActiveChunks();
  const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: Object.fromEntries(active.map(chunk => [chunk.chunk_id, 'STANDARD']))});
  assert.equal(verifyPortfolioSelectionEnvelope(selection).valid, true);
  const scene = runtime.createSpatialScene({selection, scene_id: 'urrf-large-world-texture-residency-webgpu-v01', visual_scale: 1, evidence_root: rootHash({stream_root: stream.stream_root, selection_root: selection.selection_root, renderer: 'vsr-webgpu-pbr-mip-execution'})});
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);
  const bundle = createLargeWorldSpatialGlbBundle(scene, {texture_profile: LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE, texture_size: 32});
  assert.equal(verifyLargeWorldSpatialGlbBundle(bundle, {sceneRoot: scene.scene_root}).valid, true);
  const byId = new Map(bundle.assets.map(entry => [entry.record.id, entry]));
  const catalog = bundle.assets.map(entry => entry.record);
  const totalBytes = catalog.reduce((sum, asset) => sum + asset.byteLength, 0);
  const streamer = new VSRSpatialAssetStreamer(catalog, asset => byId.get(asset.id).payload, {maxConcurrent: 4});
  const streamingReceipt = await streamer.acquire({activeCellIds: scene.streaming.cells.map(cell => cell.id), requestedAssetIds: bundle.manifest.asset_ids, maxAssets: catalog.length, maxBytes: totalBytes, lease: false});
  assert.equal(verifySpatialAssetStreamingReceipt(streamingReceipt), true);
  assert.equal(streamingReceipt.readyAssetIds.length, catalog.length);
  const sourceEntry = bundle.assets.find(entry => entry.record.metadata.lod === 0);
  assert.ok(sourceEntry);
  const textureResidency = sourceEntry.record.metadata.texture_residency;
  const imported = await importGlbToSpatialSceneAsync(sourceEntry.payload, {sceneId: 'urrf-large-world-texture-residency-webgpu-import-v01', sourceRoot: scene.scene_root, imageDecoder: input => decodeGltfImageToSpatialTexture(input)});
  assert.equal(verifyGltfImportReceipt(imported.receipt), true);
  assert.equal(imported.receipt.textureCount, 4);
  assert.equal(imported.receipt.materialTextureBindingCount, 5);
  const near = lowerTextureSet(imported.scene, textureResidency, {distance_m: 18, screen_coverage_percent: 92});
  const far = lowerTextureSet(imported.scene, textureResidency, {distance_m: 260, screen_coverage_percent: 12});
  assert.equal(near.plans.every(plan => verifyLargeWorldTextureResidency(plan) && plan.selected_level === 0), true);
  assert.equal(far.plans.every(plan => verifyLargeWorldTextureResidency(plan) && plan.selected_level === 2), true);
  assert.equal(near.receipts.every(receipt => receipt.selectedLevel === 0), true);
  assert.equal(far.receipts.every(receipt => receipt.selectedLevel === 2), true);
  const calls = [], textureDescriptors = [], device = fakeWebGPU(textureDescriptors, calls), canvas = {width: 0, height: 0}, context = {getCurrentTexture: () => ({createView: () => ({id: 'present-view'})})};
  const executor = VSRSpatialWebGPUExecutor.fromDevice(canvas, {}, device, context, 'bgra8unorm');
  const nearReceipt = await executor.render(configurePresentation(near.scene), {width: 64, height: 64, enableShadows: false, gpuDrivenCulling: true});
  const nearTextureDescriptors = textureDescriptors.slice();
  const farReceipt = await executor.render(configurePresentation(far.scene), {width: 64, height: 64, enableShadows: false, gpuDrivenCulling: true});
  const farTextureDescriptors = textureDescriptors.slice(nearTextureDescriptors.length);
  assert.equal(verifySpatialWebGPUReceipt(nearReceipt), true);
  assert.equal(verifySpatialWebGPUReceipt(farReceipt), true);
  assert.equal(nearReceipt.submitted, true);
  assert.equal(farReceipt.submitted, true);
  assert.ok((nearReceipt.textureUploads ?? 0) >= 4);
  assert.ok((farReceipt.textureUploads ?? 0) >= 4);
  assert.ok((nearReceipt.textureBytesResident ?? 0) > (farReceipt.textureBytesResident ?? 0));
  assert.ok(nearTextureDescriptors.filter(entry => entry.size[0] === 32 && entry.size[1] === 32 && entry.mipLevelCount === 1).length >= 4);
  assert.ok(farTextureDescriptors.filter(entry => entry.size[0] === 8 && entry.size[1] === 8 && entry.mipLevelCount === 1).length >= 4);
  assert.equal(nearReceipt.materialTextureBindings, 5);
  assert.equal(farReceipt.materialTextureBindings, 5);
  assert.equal(nearReceipt.frameRoot !== farReceipt.frameRoot, true);
  const reportBase = {
    format: 'urrf.large-world-texture-residency-webgpu-report.v0.1',
    world_id: scene.large_world.world_id,
    scene_root: scene.scene_root,
    selection_root: selection.selection_root,
    manifest_root: bundle.manifest.manifest_root,
    bundle_root: bundle.bundle_root,
    source_asset_id: sourceEntry.record.id,
    source_texture_level_count: sourceEntry.record.metadata.texture_level_count,
    source_texture_byte_length: sourceEntry.record.metadata.texture_byte_length,
    near: {selected_levels: near.plans.map(plan => plan.selected_level), receipt_roots: near.receipts.map(receipt => receipt.root), frame_root: nearReceipt.frameRoot, texture_bytes_resident: nearReceipt.textureBytesResident, texture_uploads: nearReceipt.textureUploads, material_texture_bindings: nearReceipt.materialTextureBindings, texture_descriptors: nearTextureDescriptors.filter(entry => entry.size[0] === 32 && entry.size[1] === 32).map(entry => ({format: entry.format, size: entry.size, mip_level_count: entry.mipLevelCount}))},
    far: {selected_levels: far.plans.map(plan => plan.selected_level), receipt_roots: far.receipts.map(receipt => receipt.root), frame_root: farReceipt.frameRoot, texture_bytes_resident: farReceipt.textureBytesResident, texture_uploads: farReceipt.textureUploads, material_texture_bindings: farReceipt.materialTextureBindings, texture_descriptors: farTextureDescriptors.filter(entry => entry.size[0] === 8 && entry.size[1] === 8).map(entry => ({format: entry.format, size: entry.size, mip_level_count: entry.mipLevelCount}))},
    imported_gltf_receipt_root: imported.receipt.receiptRoot,
    streaming_root: streamingReceipt.resolution.root,
    streaming_receipt_root: streamingReceipt.receiptRoot,
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', execution_owner: 'VSR', encoder_provider: 'RAGF', fake_device_only: true, candidate_only: true, authoritative: false},
    notes: 'Candidate-only fake-device execution proves that selected URRF mip resources reach the VSR WebGPU executor and reduce uploaded texture bytes from near mip0 to far mip2. This is not real GPU/VRAM, target-device timing, BasisU transcoding, CDN delivery, or production-scale evidence.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'large-world-texture-residency-webgpu-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'large-world-texture-residency-webgpu-report.json')).byteLength > 1000);
  executor.destroy();
});
