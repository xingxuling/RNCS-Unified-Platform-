import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAuthorityLease, createRealityConsistencyProfile, rootHash, verifyRepresentationPortfolio} from '@taowind/rncs-core-contract';
import {RealityRepresentationPortfolioRuntime} from '@taowind/reality-representation-fabric';
import {
  LARGE_WORLD_CHUNK_FORMAT,
  LARGE_WORLD_PORTFOLIO_SELECTION_FORMAT,
  LARGE_WORLD_REGION_FORMAT,
  LARGE_WORLD_SPATIAL_SCENE_FORMAT,
  LARGE_WORLD_PROCEDURAL_PROVIDER_ID,
  LARGE_WORLD_WIREFRAME_PROVIDER_ID,
  LARGE_WORLD_SPATIAL_GLB_BUNDLE_FORMAT,
  LARGE_WORLD_SPATIAL_GLB_TEXTURE_PROFILE,
  LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE,
  LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE,
  LARGE_WORLD_SPATIAL_GLB_TEXTURE_RESIDENCY_PROFILE,
  LARGE_WORLD_TEXTURE_RESIDENCY_FORMAT,
  LargeWorldDurableStore,
  LargeWorldRuntime,
  createChunkRepresentationPortfolio,
  createLargeWorldSpatialScene,
  createLargeWorldSpatialGltfBundle,
  createLargeWorldSpatialGlbBundle,
  createLargeWorldRuntime,
  generateChunk,
  generateRegion,
  replayLargeWorldTrace,
  verifyChunk,
  verifyMaterializationBatch,
  verifyPortfolioSelectionEnvelope,
  verifyLargeWorldSpatialScene,
  verifyLargeWorldSpatialGltfBundle,
  verifyLargeWorldSpatialGlbBundle,
  resolveLargeWorldTextureResidency,
  verifyLargeWorldTextureResidency,
  verifyDurableBundle,
  verifyDurableRestoreReceipt,
  verifyDurableStoreReceipt,
  resolveReplicationConflict,
  verifyReplicationConflictDecision,
  verifyReplicationConflictReceipt,
  verifyReplicationDelta,
  verifyReplicationReceipt,
  verifyReplicationSnapshot,
  verifyRegion,
  verifyRuntimeSnapshot,
  verifyStreamResolutionReceipt
} from '../src/index.mjs';

test('generates the same chunk root for the same world seed and a different root for a different seed', () => {
  const a = generateChunk({worldId: 'world:test', seed: 'seed:same', x: 2, z: -1});
  const b = generateChunk({worldId: 'world:test', seed: 'seed:same', x: 2, z: -1});
  const c = generateChunk({worldId: 'world:test', seed: 'seed:other', x: 2, z: -1});
  assert.equal(a.format, LARGE_WORLD_CHUNK_FORMAT);
  assert.equal(a.chunk_root, b.chunk_root);
  assert.deepEqual(a.mesh, b.mesh);
  assert.notEqual(a.chunk_root, c.chunk_root);
  assert.equal(verifyChunk(a).valid, true);
});

test('generates and verifies a default 9 by 9 region with unique chunk roots', () => {
  const region = generateRegion({worldId: 'world:region-test', seed: 'seed:region'});
  assert.equal(region.format, LARGE_WORLD_REGION_FORMAT);
  assert.equal(region.chunks.length, 81);
  assert.equal(new Set(region.chunks.map(chunk => chunk.chunk_id)).size, 81);
  assert.equal(new Set(region.chunks.map(chunk => chunk.chunk_root)).size, 81);
  assert.equal(region.chunks.every(chunk => verifyChunk(chunk).valid), true);
  assert.equal(verifyRegion(region).valid, true);
});

test('shares terrain boundary samples between neighboring chunks', () => {
  const left = generateChunk({worldId: 'world:boundary', seed: 'seed:boundary', x: 0, z: 0, sampleResolution: 8});
  const right = generateChunk({worldId: 'world:boundary', seed: 'seed:boundary', x: 1, z: 0, sampleResolution: 8});
  const leftStride = 9 * 3;
  const rightStride = 9 * 3;
  for (let row = 0; row <= 8; row++) {
    const leftIndex = row * leftStride + 8 * 3 + 1;
    const rightIndex = row * rightStride + 0 * 3 + 1;
    assert.equal(left.mesh.positions[leftIndex], right.mesh.positions[rightIndex]);
  }
});

test('streams a bounded active working set with enter, exit, and hysteresis evidence', () => {
  const runtime = createLargeWorldRuntime({worldId: 'world:stream', seed: 'seed:stream', loadRadius: 1, unloadRadius: 2, maxActiveChunks: 12});
  const first = runtime.observe({x: 0, z: 0});
  assert.equal(first.active_chunk_ids.length, 9);
  assert.equal(first.entered_chunk_ids.length, 9);
  assert.equal(first.exited_chunk_ids.length, 0);
  assert.equal(first.working_set_bytes <= first.max_working_set_bytes, true);
  assert.equal(verifyStreamResolutionReceipt(first).valid, true);

  const held = runtime.observe({x: 256, z: 0});
  assert.equal(held.active_chunk_ids.includes('chunk:world:stream:0:0'), true);
  assert.equal(held.exited_chunk_ids.length, 0);
  assert.equal(verifyStreamResolutionReceipt(held).valid, true);

  const moved = runtime.observe({x: 1024, z: 1024});
  assert.equal(moved.active_chunk_ids.length <= 12, true);
  assert.equal(moved.exited_chunk_ids.length > 0, true);
  assert.equal(verifyStreamResolutionReceipt(moved).valid, true);
});

test('keeps forced chunks in the working set and records unknown force requests', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:force', seed: 'seed:force', loadRadius: 0, unloadRadius: 0, maxActiveChunks: 2});
  const region = runtime.getRegion();
  const far = region.chunks.find(chunk => chunk.coordinates.x === 4 && chunk.coordinates.z === 4);
  const resolution = runtime.observe({x: 0, z: 0, forcedChunkIds: [far.chunk_id, 'chunk:unknown']});
  assert.equal(resolution.active_chunk_ids.includes(far.chunk_id), true);
  assert.deepEqual(resolution.unknown_forced_chunk_ids, ['chunk:unknown']);
  assert.equal(resolution.diagnostics.includes('unknown-forced-chunk:chunk:unknown'), true);
});

test('materializes active chunks through URRF without granting canonical authority', async () => {
  const runtime = new LargeWorldRuntime({
    worldId: 'world:materialize',
    seed: 'seed:materialize',
    loadRadius: 0,
    maxActiveChunks: 1,
    materializeChunk: async ({chunk, authority}) => {
      assert.equal(authority.canonical_state_mutation_allowed, false);
      return {status: 'EXECUTED', runtime: 'procedural-grid-test', output_root: chunk.content_root, evidence_root: rootHash({chunk_root: chunk.chunk_root, provider: 'test'})};
    }
  });
  runtime.observe({x: 0, z: 0});
  const batch = await runtime.materializeActive();
  assert.equal(batch.status, 'EXECUTED');
  assert.equal(batch.receipts.length, 1);
  assert.equal(batch.receipts[0].status, 'EXECUTED');
  assert.equal(batch.canonical_state_mutated, false);
  assert.equal(verifyMaterializationBatch(batch).valid, true);
  const object = runtime.getRepresentationObject(batch.active_chunk_ids[0]);
  assert.equal(object.canonical_owner, 'RNCS');
  assert.equal(object.representation_owner, 'URRF');
  assert.equal(object.object_root.length, 64);
});

test('keeps contract-only materialization explicit when no adapter is present', async () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:contract', seed: 'seed:contract', loadRadius: 0, maxActiveChunks: 1});
  runtime.observe({x: 0, z: 0});
  const batch = await runtime.materializeActive();
  assert.equal(batch.status, 'NOT_EXECUTED');
  assert.equal(batch.receipts[0].status, 'NOT_EXECUTED');
  assert.equal(verifyMaterializationBatch(batch).valid, true);
});

test('keeps procedural and wireframe representations as separate URRF candidates', async () => {
  const runtime = new LargeWorldRuntime({
    worldId: 'world:providers',
    seed: 'seed:providers',
    loadRadius: 0,
    maxActiveChunks: 1,
    materializeWireframeChunk: async ({chunk, authority}) => {
      assert.equal(authority.canonical_state_mutation_allowed, false);
      return {status: 'EXECUTED', runtime: 'wireframe-grid-test', output_root: chunk.content_root, evidence_root: rootHash({chunk_root: chunk.chunk_root, provider: 'wireframe'})};
    }
  });
  const object = runtime.getRepresentationObject('chunk:world:providers:0:0');
  assert.deepEqual(object.representations.map(reference => reference.provider_id).sort(), [LARGE_WORLD_PROCEDURAL_PROVIDER_ID, LARGE_WORLD_WIREFRAME_PROVIDER_ID].sort());
  runtime.observe({x: 0, z: 0});
  const batch = await runtime.materializeActive({providerId: LARGE_WORLD_WIREFRAME_PROVIDER_ID});
  assert.equal(batch.receipts[0].provider_id, LARGE_WORLD_WIREFRAME_PROVIDER_ID);
  assert.equal(batch.receipts[0].chunk_id, 'chunk:world:providers:0:0');
  assert.equal(verifyMaterializationBatch(batch).valid, true);
});

test('lowers a streamed chunk into a URRF portfolio with budgeted minimum-reality fallback', async () => {
  const runtime = new LargeWorldRuntime({
    worldId: 'world:portfolio',
    seed: 'seed:portfolio',
    loadRadius: 0,
    maxActiveChunks: 1,
    materializeChunk: async ({chunk}) => ({
      status: 'EXECUTED',
      runtime: 'procedural-grid-portfolio-test',
      output_root: chunk.content_root,
      evidence_root: rootHash({chunk_root: chunk.chunk_root, provider: 'portfolio'})
    })
  });
  const chunk = runtime.getChunk('chunk:world:portfolio:0:0');
  const portfolio = runtime.getRepresentationPortfolio(chunk.chunk_id);
  assert.equal(verifyRepresentationPortfolio(portfolio).valid, true);
  assert.equal(portfolio.composition_result.composition_status, 'READY');
  assert.deepEqual(portfolio.slots.map(slot => slot.quality_profile), ['PROXY', 'STANDARD']);
  assert.equal(portfolio.slots.every(slot => slot.candidate_only && !slot.authoritative), true);
  const incomplete = createChunkRepresentationPortfolio(chunk, {
    representations: runtime.getRepresentationObject(chunk.chunk_id).representations.filter(reference => reference.provider_id !== LARGE_WORLD_WIREFRAME_PROVIDER_ID)
  });
  assert.equal(verifyRepresentationPortfolio(incomplete).valid, true);
  assert.equal(incomplete.composition_result.composition_status, 'INCOMPLETE');

  const portfolioRuntime = new RealityRepresentationPortfolioRuntime({fabric: runtime.fabric});
  portfolioRuntime.registerPortfolio(portfolio);
  const standard = portfolioRuntime.selectSlot({portfolio_id: portfolio.portfolio_id, quality_profile: 'STANDARD'});
  assert.equal(standard.slot.quality_profile, 'STANDARD');
  assert.equal(standard.fallback_used, false);

  const budget = {CPU_MILLI: 0, GPU_MILLI: 0, NPU_MILLI: 0, VRAM_MB: 0, RAM_MB: 0, STORAGE_KB: 0, NETWORK_KB: 0, ENERGY_MILLI: 0};
  const constrained = portfolioRuntime.selectSlot({portfolio_id: portfolio.portfolio_id, quality_profile: 'STANDARD', resource_budget: budget});
  assert.equal(constrained.slot.quality_profile, 'PROXY');
  assert.equal(constrained.fallback_used, true);
  assert.equal(constrained.reason_codes.includes('MINIMUM_REALITY_FALLBACK'), true);

  const materialized = await portfolioRuntime.materializeSlot({portfolio_id: portfolio.portfolio_id, quality_profile: 'STANDARD'});
  assert.equal(materialized.status, 'EXECUTED');
  assert.equal(materialized.canonical_write_authorized, false);
});

test('seals active per-chunk portfolio selections against the latest stream root', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:selection-envelope', seed: 'seed:selection-envelope', loadRadius: 1, maxActiveChunks: 9});
  const stream = runtime.observe({x: 0, z: 0});
  const center = runtime.listActiveChunks().find(chunk => chunk.coordinates.x === 0 && chunk.coordinates.z === 0);
  const qualityByChunk = Object.fromEntries(runtime.listActiveChunks().map(chunk => [chunk.chunk_id, chunk.chunk_id === center.chunk_id ? 'STANDARD' : 'PROXY']));
  const mixed = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: qualityByChunk});
  assert.equal(mixed.format, LARGE_WORLD_PORTFOLIO_SELECTION_FORMAT);
  assert.equal(verifyPortfolioSelectionEnvelope(mixed).valid, true);
  assert.equal(mixed.stream_root, stream.stream_root);
  assert.equal(mixed.selections.length, 9);
  assert.equal(mixed.fallback_count, 0);
  assert.equal(mixed.selections.filter(selection => selection.selected_quality_profile === 'STANDARD').length, 1);
  assert.equal(mixed.selections.filter(selection => selection.selected_quality_profile === 'PROXY').length, 8);
  assert.equal(mixed.selections.every(selection => selection.candidate_only && !selection.authoritative && !selection.canonical_write_authorized), true);

  const constrained = runtime.selectActiveRepresentationPortfolios({quality_profile: 'STANDARD', resource_budget: {CPU_MILLI: 0, GPU_MILLI: 0, VRAM_MB: 0, RAM_MB: 0, STORAGE_KB: 0, NETWORK_KB: 0, ENERGY_MILLI: 0, NPU_MILLI: 0}});
  assert.equal(verifyPortfolioSelectionEnvelope(constrained).valid, true);
  assert.equal(constrained.fallback_count, 9);
  assert.equal(constrained.selections.every(selection => selection.selected_quality_profile === 'PROXY' && selection.fallback_used), true);
});

test('lowers an active URRF portfolio selection into a rooted VSR spatial scene without authority escalation', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:spatial-lowering', seed: 'seed:spatial-lowering', width: 5, depth: 5, chunkSize: 64, sampleResolution: 8, loadRadius: 1, maxActiveChunks: 9});
  const stream = runtime.observe({x: 0, z: 0});
  const center = runtime.listActiveChunks().find(chunk => chunk.coordinates.x === 0 && chunk.coordinates.z === 0);
  const qualityByChunk = Object.fromEntries(runtime.listActiveChunks().map(chunk => [chunk.chunk_id, chunk.chunk_id === center.chunk_id ? 'STANDARD' : 'PROXY']));
  const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: qualityByChunk});
  const scene = runtime.createSpatialScene({selection, evidence_root: rootHash({stream_root: stream.stream_root, selection_root: selection.selection_root})});
  assert.equal(scene.large_world.format, LARGE_WORLD_SPATIAL_SCENE_FORMAT);
  assert.equal(scene.large_world.active_chunk_ids.length, 9);
  assert.equal(scene.large_world.representation_slots.filter(slot => slot.selected_quality_profile === 'STANDARD').length, 1);
  assert.equal(scene.large_world.representation_slots.filter(slot => slot.selected_quality_profile === 'PROXY').length, 8);
  assert.equal(scene.large_world.candidate_only, true);
  assert.equal(scene.large_world.authoritative, false);
  assert.equal(scene.large_world.canonical_write_authorized, false);
  assert.equal(scene.large_world.presentation_scale, 1);
  assert.equal(scene.reality.realityRoot, runtime.getRegion().world_root);
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);
  const repeat = createLargeWorldSpatialScene({region: runtime.getRegion(), selection, evidence_root: scene.reality.evidenceRoot});
  assert.equal(scene.scene_root, repeat.scene_root);
  const scaled = createLargeWorldSpatialScene({region: runtime.getRegion(), selection, visual_scale: 2, evidence_root: scene.reality.evidenceRoot});
  assert.equal(scaled.large_world.presentation_scale, 2);
  assert.notEqual(scaled.scene_root, scene.scene_root);
});

test('materializes a deterministic glTF and inline texture candidate bundle without escalating authority', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:gltf-provider', seed: 'seed:gltf-provider', width: 5, depth: 5, chunkSize: 64, sampleResolution: 8, loadRadius: 1, maxActiveChunks: 9});
  runtime.observe({x: 0, z: 0});
  const active = runtime.listActiveChunks();
  const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: Object.fromEntries(active.map(chunk => [chunk.chunk_id, 'STANDARD']))});
  const scene = runtime.createSpatialScene({selection, evidence_root: rootHash({selection_root: selection.selection_root, renderer: 'gltf-provider-test'})});
  const bundle = createLargeWorldSpatialGltfBundle(scene);
  const verification = verifyLargeWorldSpatialGltfBundle(bundle, {sceneRoot: scene.scene_root});
  assert.equal(verification.valid, true);
  assert.equal(bundle.manifest.mesh_count, scene.meshes.length);
  assert.equal(bundle.manifest.asset_count, scene.meshes.length * 3);
  assert.equal(bundle.manifest.texture_count, bundle.manifest.asset_count);
  assert.equal(bundle.assets.every(entry => entry.record.metadata.candidate_only && !entry.record.metadata.authoritative), true);
  assert.equal(bundle.assets.every(entry => entry.gltf.asset.version === '2.0'), true);
  for (const meshId of scene.meshes.map(mesh => mesh.id)) {
    const triangles = bundle.assets.filter(entry => entry.record.metadata.source_mesh_id === meshId).sort((a, b) => a.record.metadata.lod - b.record.metadata.lod).map(entry => entry.record.metadata.triangle_count);
    assert.equal(triangles.length, 3);
    assert.equal(triangles[0] >= triangles[1] && triangles[1] >= triangles[2], true);
  }
  const repeat = createLargeWorldSpatialGltfBundle(scene);
  assert.equal(bundle.bundle_root, repeat.bundle_root);
  const tampered = structuredClone(bundle);
  tampered.assets[0].payload[0] ^= 1;
  assert.equal(verifyLargeWorldSpatialGltfBundle(tampered, {sceneRoot: scene.scene_root}).valid, false);
});

test('materializes deterministic RAGF-encoded binary GLB assets without escalating authority', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:glb-provider', seed: 'seed:glb-provider', width: 5, depth: 5, chunkSize: 64, sampleResolution: 8, loadRadius: 1, maxActiveChunks: 9});
  runtime.observe({x: 0, z: 0});
  const active = runtime.listActiveChunks();
  const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: Object.fromEntries(active.map(chunk => [chunk.chunk_id, 'STANDARD']))});
  const scene = runtime.createSpatialScene({selection, evidence_root: rootHash({selection_root: selection.selection_root, renderer: 'glb-provider-test'})});
  const bundle = createLargeWorldSpatialGlbBundle(scene);
  const verification = verifyLargeWorldSpatialGlbBundle(bundle, {sceneRoot: scene.scene_root});
  assert.equal(verification.valid, true);
  assert.equal(bundle.format, LARGE_WORLD_SPATIAL_GLB_BUNDLE_FORMAT);
  assert.equal(bundle.manifest.mesh_count, scene.meshes.length);
  assert.equal(bundle.manifest.asset_count, scene.meshes.length * 3);
  assert.equal(bundle.manifest.texture_profile, LARGE_WORLD_SPATIAL_GLB_TEXTURE_PROFILE);
  assert.equal(bundle.assets.every(entry => entry.record.format === 'model/gltf-binary'), true);
  assert.equal(bundle.assets.every(entry => entry.record.metadata.candidate_only && !entry.record.metadata.authoritative), true);
  assert.equal(bundle.assets.every(entry => entry.payload[0] === 0x67 && entry.payload[1] === 0x6c && entry.payload[2] === 0x54 && entry.payload[3] === 0x46), true);
  assert.equal(bundle.assets.every(entry => entry.gltf.asset.version === '2.0' && entry.gltf.images[0].mimeType === 'image/png'), true);
  const repeat = createLargeWorldSpatialGlbBundle(scene);
  assert.equal(bundle.bundle_root, repeat.bundle_root);
  assert.equal(bundle.assets[0].record.sha256, repeat.assets[0].record.sha256);
  const tampered = structuredClone(bundle);
  tampered.assets[0].payload[0] ^= 1;
  assert.equal(verifyLargeWorldSpatialGlbBundle(tampered, {sceneRoot: scene.scene_root}).valid, false);
});

test('materializes mipped KTX2 GLB assets with explicit progressive texture residency', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:ktx2-provider', seed: 'seed:ktx2-provider', width: 5, depth: 5, chunkSize: 64, sampleResolution: 8, loadRadius: 1, maxActiveChunks: 9});
  runtime.observe({x: 0, z: 0});
  const active = runtime.listActiveChunks();
  const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: Object.fromEntries(active.map(chunk => [chunk.chunk_id, 'STANDARD']))});
  const scene = runtime.createSpatialScene({selection, evidence_root: rootHash({selection_root: selection.selection_root, renderer: 'ktx2-provider-test'})});
  const bundle = createLargeWorldSpatialGlbBundle(scene, {texture_profile: LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE, texture_size: 32});
  assert.equal(verifyLargeWorldSpatialGlbBundle(bundle, {sceneRoot: scene.scene_root}).valid, true);
  assert.equal(bundle.manifest.texture_profile, LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE);
  assert.equal(bundle.manifest.texture_residency_profile, LARGE_WORLD_SPATIAL_GLB_TEXTURE_RESIDENCY_PROFILE);
  const worldAsset = bundle.assets.find(entry => entry.record.metadata.asset_role === undefined);
  assert.ok(worldAsset);
  assert.equal(worldAsset.gltf.images[0].mimeType, 'image/ktx2');
  assert.equal(worldAsset.gltf.textures[0].extensions.KHR_texture_basisu.source, 0);
  assert.equal(worldAsset.record.metadata.texture_level_count, 6);
  assert.equal(worldAsset.record.metadata.texture_residency.levels.length, 6);
  assert.equal(worldAsset.record.metadata.texture_residency.levels[0].residency_tier, 'vram');
  assert.equal(worldAsset.record.metadata.texture_residency.levels[5].residency_tier, 'ram');
  assert.equal(bundle.bundle_root, createLargeWorldSpatialGlbBundle(scene, {texture_profile: LARGE_WORLD_SPATIAL_GLB_KTX2_TEXTURE_PROFILE, texture_size: 32}).bundle_root);
  const tampered = structuredClone(bundle);
  tampered.assets[0].payload[140] ^= 1;
  assert.equal(verifyLargeWorldSpatialGlbBundle(tampered, {sceneRoot: scene.scene_root}).valid, false);
});

test('resolves candidate texture mip residency from distance and screen coverage', () => {
  const residency = {format: LARGE_WORLD_SPATIAL_GLB_TEXTURE_RESIDENCY_PROFILE, promotion: 'screen-coverage-and-distance', release: 'cell-unload-hysteresis', levels: [
    {level: 0, width: 32, height: 32, byteLength: 4096, residency_tier: 'vram'},
    {level: 1, width: 16, height: 16, byteLength: 1024, residency_tier: 'ram'},
    {level: 2, width: 8, height: 8, byteLength: 256, residency_tier: 'ram'},
    {level: 3, width: 4, height: 4, byteLength: 64, residency_tier: 'ram'},
    {level: 4, width: 2, height: 2, byteLength: 16, residency_tier: 'ram'},
    {level: 5, width: 1, height: 1, byteLength: 4, residency_tier: 'ram'}
  ]};
  const near = resolveLargeWorldTextureResidency(residency, {distance_m: 18, screen_coverage_percent: 92});
  const far = resolveLargeWorldTextureResidency(residency, {distance_m: 260, screen_coverage_percent: 12});
  assert.equal(near.format, LARGE_WORLD_TEXTURE_RESIDENCY_FORMAT);
  assert.equal(near.selected_level, 0);
  assert.deepEqual(near.prefetch_levels, [1, 2, 3, 4, 5]);
  assert.deepEqual(near.deferred_levels, []);
  assert.equal(far.selected_level, 2);
  assert.deepEqual(far.resident_levels, [2]);
  assert.deepEqual(far.deferred_levels, [0, 1]);
  assert.equal(verifyLargeWorldTextureResidency(near), true);
  assert.equal(verifyLargeWorldTextureResidency(far), true);
  const tampered = {...far, selected_level: 1};
  assert.equal(verifyLargeWorldTextureResidency(tampered), false);
});

test('materializes a four-map PBR KTX2 GLB candidate with explicit material bindings', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:pbr-ktx2-provider', seed: 'seed:pbr-ktx2-provider', width: 5, depth: 5, chunkSize: 64, sampleResolution: 8, loadRadius: 1, maxActiveChunks: 9});
  runtime.observe({x: 0, z: 0});
  const active = runtime.listActiveChunks();
  const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: Object.fromEntries(active.map(chunk => [chunk.chunk_id, 'STANDARD']))});
  const scene = runtime.createSpatialScene({selection, evidence_root: rootHash({selection_root: selection.selection_root, renderer: 'pbr-ktx2-provider-test'})});
  const bundle = createLargeWorldSpatialGlbBundle(scene, {texture_profile: LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE, texture_size: 32});
  assert.equal(verifyLargeWorldSpatialGlbBundle(bundle, {sceneRoot: scene.scene_root}).valid, true);
  const asset = bundle.assets.find(entry => entry.record.metadata.asset_role === undefined);
  assert.ok(asset);
  assert.equal(asset.record.metadata.texture_count, 4);
  assert.deepEqual(asset.record.metadata.texture_roles, ['base-color', 'normal', 'metallic-roughness', 'emissive']);
  assert.deepEqual(asset.record.metadata.texture_color_spaces, ['srgb', 'linear', 'linear', 'srgb']);
  assert.equal(asset.gltf.images.length, 4);
  assert.equal(asset.gltf.textures.length, 4);
  assert.deepEqual(asset.gltf.images.map(image => image.extras.color_space), ['srgb', 'linear', 'linear', 'srgb']);
  assert.equal(asset.gltf.materials[0].pbrMetallicRoughness.metallicRoughnessTexture.index, 2);
  assert.equal(asset.gltf.materials[0].normalTexture.index, 1);
  assert.equal(asset.gltf.materials[0].occlusionTexture.index, 2);
  assert.equal(asset.gltf.materials[0].emissiveTexture.index, 3);
  assert.equal(asset.record.metadata.texture_residency.maps.length, 4);
  assert.equal(bundle.bundle_root, createLargeWorldSpatialGlbBundle(scene, {texture_profile: LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE, texture_size: 32}).bundle_root);
});

test('can attach a real RAGF procedural-3d showcase candidate without changing world truth', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:ragf-showcase', seed: 'seed:ragf-showcase', width: 5, depth: 5, chunkSize: 64, sampleResolution: 8, loadRadius: 1, maxActiveChunks: 9});
  runtime.observe({x: 0, z: 0});
  const active = runtime.listActiveChunks();
  const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: Object.fromEntries(active.map(chunk => [chunk.chunk_id, 'STANDARD']))});
  const scene = runtime.createSpatialScene({selection, evidence_root: rootHash({selection_root: selection.selection_root, renderer: 'ragf-showcase-test'})});
  const bundle = createLargeWorldSpatialGlbBundle(scene, {includeRagfShowcase: true});
  assert.equal(verifyLargeWorldSpatialGlbBundle(bundle, {sceneRoot: scene.scene_root}).valid, true);
  const showcase = bundle.assets.find(entry => entry.record.metadata.asset_role === 'ragf-showcase');
  assert.ok(showcase);
  assert.equal(bundle.manifest.provider_asset_count, 1);
  assert.ok(showcase.record.metadata.triangle_count > 700);
  assert.equal(showcase.record.metadata.texture_count, 4);
  assert.equal(showcase.gltf.skins?.length, 1);
  assert.equal(showcase.gltf.animations?.length, 4);
  assert.equal(showcase.gltf.images?.length, 4);
  assert.equal(showcase.record.metadata.candidate_only, true);
  assert.equal(showcase.record.metadata.authoritative, false);
  assert.equal(bundle.bundle_root, createLargeWorldSpatialGlbBundle(scene, {includeRagfShowcase: true}).bundle_root);
});

test('snapshot and replay seal deterministic streaming evidence', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:replay', seed: 'seed:replay', loadRadius: 1, maxActiveChunks: 9});
  runtime.observe({x: 0, z: 0});
  runtime.observe({x: 400, z: 0});
  runtime.observe({x: 900, z: 700, forcedChunkIds: ['chunk:world:replay:1:1']});
  const snapshot = runtime.snapshot();
  assert.equal(verifyRuntimeSnapshot(snapshot).valid, true);
  const replay = runtime.replay();
  assert.equal(replay.ok, true);
  assert.equal(replay.replay_root.length, 64);
  assert.equal(replayLargeWorldTrace({worldId: 'world:replay', seed: 'seed:replay', loadRadius: 1, maxActiveChunks: 9}, runtime.trace).ok, true);
});

test('binds canonical world time, authority-gated events, and Fact World Tree roots', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:truth', seed: 'seed:truth', loadRadius: 0, maxActiveChunks: 1});
  const authorityReceipt = {status: 'committed', receipt_root: 'a'.repeat(64), decision_root: null, epoch: 0};
  const first = runtime.recordWorldEvent({
    authorityReceipt,
    subjects: ['subject:weather-system'],
    objects: ['object:region'],
    mutation: {operations: [{op: 'set', path: 'weather', value: 'rain'}]},
    fact: {claim: {weather: 'rain'}, authority_domain: 'world.weather', confidence: 'canonical'}
  });
  assert.equal(first.event.world_time.simulation_tick, 1);
  assert.equal(first.event.authority_receipt.status, 'committed');
  assert.equal(first.canonical_state_mutated, true);
  assert.equal(first.fact.source_events.includes(first.event.event_id), true);
  assert.equal(runtime.eventLog.event_count, 1);
  assert.equal(runtime.factTree.canonical_facts.length, 1);
  assert.equal(runtime.verify().world_truth.time.valid, true);
  assert.equal(runtime.verify().world_truth.event_log.valid, true);
  assert.equal(runtime.verify().world_truth.fact_tree.valid, true);

  const second = runtime.recordWorldEvent({
    authorityReceipt,
    mutation: {operations: [{op: 'set', path: 'weather', value: 'clear'}]}
  });
  assert.ok(second.world_time.simulation_tick > first.world_time.simulation_tick);
  assert.equal(runtime.eventLog.event_count, 2);
  assert.equal(runtime.eventLog.head_event_id, second.event.event_id);
  assert.equal(runtime.verify().world_truth.event_log.valid, true);
  const snapshot = runtime.snapshot();
  assert.equal(snapshot.event_log_root, runtime.eventLog.log_root);
  assert.equal(snapshot.fact_tree_root, runtime.factTree.tree_root);
  assert.equal(verifyRuntimeSnapshot(snapshot).valid, true);
});

test('does not create a canonical world event without an explicit committed authority receipt', () => {
  const runtime = new LargeWorldRuntime({worldId: 'world:truth-gate', seed: 'seed:truth-gate'});
  assert.throws(() => runtime.recordWorldEvent({mutation: {operations: [{op: 'set', path: 'weather', value: 'storm'}]}}), /LARGE_WORLD_EVENT_AUTHORITY_RECEIPT_REQUIRED/);
  assert.equal(runtime.eventLog.event_count, 0);
});

test('replicates deterministic world truth between isolated instances with idempotent deltas', () => {
  const options = {worldId: 'world:replication', seed: 'seed:replication', loadRadius: 0, maxActiveChunks: 2};
  const source = new LargeWorldRuntime(options);
  const target = new LargeWorldRuntime(options);
  const baseSnapshot = target.exportReplicationSnapshot();
  assert.equal(verifyReplicationSnapshot(baseSnapshot).valid, true);

  source.observe({x: 0, z: 0});
  const authorityReceipt = {status: 'committed', receipt_root: 'a'.repeat(64), decision_root: null, epoch: 0};
  source.recordWorldEvent({
    authorityReceipt,
    mutation: {operations: [{op: 'set', path: 'weather', value: 'rain'}]},
    fact: {claim: {weather: 'rain'}, authority_domain: 'world.weather', confidence: 'canonical'}
  });
  const firstDelta = source.createReplicationDelta(baseSnapshot);
  assert.equal(firstDelta.events.length, 1);
  assert.equal(firstDelta.facts.length, 1);
  assert.equal(verifyReplicationDelta(firstDelta).valid, true);
  assert.throws(() => target.applyReplicationDelta(firstDelta), /LARGE_WORLD_REPLICATION_AUTHORITY_RECEIPT_REQUIRED/);

  const firstReceipt = target.applyReplicationDelta(firstDelta, {authorityReceipt});
  assert.equal(firstReceipt.status, 'APPLIED');
  assert.equal(verifyReplicationReceipt(firstReceipt).valid, true);
  assert.equal(source.exportReplicationSnapshot().snapshot_root, target.exportReplicationSnapshot().snapshot_root);

  source.recordWorldEvent({authorityReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'clear'}]}});
  const clearDelta = source.createReplicationDelta(target.exportReplicationSnapshot());
  const sourceBeforeStorm = source.exportReplicationSnapshot();
  source.recordWorldEvent({authorityReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'storm'}]}});
  const stormDelta = source.createReplicationDelta(sourceBeforeStorm);
  assert.equal(stormDelta.events.length, 1);
  assert.throws(() => target.applyReplicationDelta(stormDelta, {authorityReceipt}), /LARGE_WORLD_REPLICATION_BASE_SNAPSHOT_MISMATCH/);
  const clearReceipt = target.applyReplicationDelta(clearDelta, {authorityReceipt});
  assert.equal(clearReceipt.status, 'APPLIED');
  const secondReceipt = target.applyReplicationDelta(stormDelta, {authorityReceipt});
  assert.equal(secondReceipt.status, 'APPLIED');
  assert.equal(source.exportReplicationSnapshot().snapshot_root, target.exportReplicationSnapshot().snapshot_root);
  const duplicate = target.applyReplicationDelta(stormDelta, {authorityReceipt});
  assert.equal(duplicate.status, 'DUPLICATE');
  assert.equal(verifyReplicationReceipt(duplicate).valid, true);
});

test('fences a two-node replication delta with an active lease and rejects a stale epoch', () => {
  const world = {worldId: 'world:lease-fenced', seed: 'seed:lease-fenced', loadRadius: 0, maxActiveChunks: 1};
  const profile = createRealityConsistencyProfile({
    profile_id: 'consistency:simulation',
    mode: 'causal',
    stale_read_budget_ms: 500,
    conflict_policy: 'reject-stale',
    evidence_refs: ['evidence:lease-fenced']
  });
  const currentLease = createAuthorityLease({
    authority_id: 'authority:world',
    shard_id: 'shard:lease-fenced',
    semantic_scope: 'simulation',
    owner_node: 'node:source',
    epoch: 7,
    fencing_token: 99,
    valid_from_tick: 0,
    valid_until_tick: 100,
    provenance_ref: 'urn:test:lease',
    authority_ref: 'urn:test:authority',
    evidence_refs: ['evidence:lease']
  });
  const source = new LargeWorldRuntime({...world, nodeId: 'node:source', shardId: currentLease.shard_id, consistencyProfile: profile, authorityLease: currentLease});
  const target = new LargeWorldRuntime({...world, nodeId: 'node:target', shardId: currentLease.shard_id, consistencyProfile: profile, acceptedAuthorityLease: currentLease});
  const base = target.exportReplicationSnapshot();
  const authorityReceipt = {
    status: 'committed',
    receipt_root: 'a'.repeat(64),
    lease_root: currentLease.lease_root,
    fencing_token: currentLease.fencing_token,
    authority_id: currentLease.authority_id
  };
  source.recordWorldEvent({authorityReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'rain'}]}});
  const delta = source.createReplicationDelta(base, {targetNode: target.nodeId, sequence: 1});
  assert.equal(verifyReplicationDelta(delta).valid, true);
  const receipt = target.applyReplicationDelta(delta, {authorityReceipt});
  assert.equal(receipt.status, 'APPLIED');
  assert.equal(receipt.authority_lease_root, currentLease.lease_root);
  assert.equal(verifyReplicationReceipt(receipt).valid, true);

  const staleLease = createAuthorityLease({...currentLease, epoch: 6, fencing_token: 98});
  const staleSource = new LargeWorldRuntime({...world, nodeId: 'node:source', shardId: currentLease.shard_id, consistencyProfile: profile, authorityLease: staleLease});
  const staleTarget = new LargeWorldRuntime({...world, nodeId: 'node:target', shardId: currentLease.shard_id, consistencyProfile: profile, acceptedAuthorityLease: currentLease});
  const staleBase = staleTarget.exportReplicationSnapshot();
  const staleAuthorityReceipt = {...authorityReceipt, lease_root: staleLease.lease_root, fencing_token: staleLease.fencing_token};
  staleSource.recordWorldEvent({authorityReceipt: staleAuthorityReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'storm'}]}});
  const staleDelta = staleSource.createReplicationDelta(staleBase, {targetNode: staleTarget.nodeId, sequence: 1});
  assert.throws(() => staleTarget.applyReplicationDelta(staleDelta, {authorityReceipt: staleAuthorityReceipt}), /LARGE_WORLD_REPLICATION_LEASE_ADMISSION_FAILED/);
});

test('round-trips a durable bundle across a fresh runtime and preserves the replication ledger', () => {
  const options = {worldId: 'world:durable', seed: 'seed:durable', loadRadius: 0, maxActiveChunks: 1};
  const source = new LargeWorldRuntime(options);
  const target = new LargeWorldRuntime(options);
  const base = target.exportReplicationSnapshot();
  const authorityReceipt = {status: 'committed', receipt_root: 'a'.repeat(64), decision_root: null, epoch: 0};
  source.recordWorldEvent({authorityReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'rain'}]}});
  const delta = source.createReplicationDelta(base);
  target.applyReplicationDelta(delta, {authorityReceipt});
  const bundle = JSON.parse(JSON.stringify(target.exportDurableBundle()));
  assert.equal(verifyDurableBundle(bundle).valid, true);

  const restarted = new LargeWorldRuntime(options);
  assert.throws(() => restarted.restoreDurableBundle(bundle), /LARGE_WORLD_REPLICATION_AUTHORITY_RECEIPT_REQUIRED/);
  const restoreReceipt = restarted.restoreDurableBundle(bundle, {authorityReceipt: {status: 'committed', receipt_root: 'b'.repeat(64), decision_root: null, epoch: 0}});
  assert.equal(restoreReceipt.status, 'RESTORED');
  assert.equal(verifyDurableRestoreReceipt(restoreReceipt).valid, true);
  assert.equal(restarted.exportReplicationSnapshot().snapshot_root, target.exportReplicationSnapshot().snapshot_root);
  const duplicate = restarted.applyReplicationDelta(delta, {authorityReceipt});
  assert.equal(duplicate.status, 'DUPLICATE');
  assert.equal(verifyReplicationReceipt(duplicate).valid, true);
});

test('atomically stores a durable bundle and recovers faulted temp writes', async () => {
  const options = {worldId: 'world:durable-store', seed: 'seed:durable-store', loadRadius: 0, maxActiveChunks: 1};
  const runtime = new LargeWorldRuntime(options);
  const authorityReceipt = {status: 'committed', receipt_root: 'a'.repeat(64), decision_root: null, epoch: 0};
  runtime.recordWorldEvent({authorityReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'rain'}]}});
  const firstBundle = runtime.exportDurableBundle();
  const directory = await mkdtemp(join(tmpdir(), 'rncs-large-world-store-'));
  const store = new LargeWorldDurableStore({filePath: join(directory, 'world.bundle.json')});
  try {
    const saveReceipt = await store.save(firstBundle);
    assert.equal(verifyDurableStoreReceipt(saveReceipt).valid, true);
    assert.equal((await store.load()).bundle_root, firstBundle.bundle_root);

    runtime.recordWorldEvent({authorityReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'storm'}]}});
    const secondBundle = runtime.exportDurableBundle();
    await assert.rejects(store.save(secondBundle, {faultAt: 'after-temp-sync'}), /LARGE_WORLD_DURABLE_STORE_FAULT:after-temp-sync/);
    const primaryRecovery = await store.recover();
    assert.equal(primaryRecovery.source, 'primary');
    assert.equal(primaryRecovery.bundle.bundle_root, firstBundle.bundle_root);
    assert.equal(verifyDurableStoreReceipt(primaryRecovery.receipt).valid, true);

    await rm(store.filePath, {force: true});
    const temporaryRecovery = await store.recover();
    assert.equal(temporaryRecovery.source, 'temporary_promoted');
    assert.equal(temporaryRecovery.bundle.bundle_root, secondBundle.bundle_root);
    assert.equal(verifyDurableStoreReceipt(temporaryRecovery.receipt).valid, true);
    assert.equal((await store.load()).bundle_root, secondBundle.bundle_root);

    await assert.rejects(store.save(secondBundle, {faultAt: 'after-rename'}), /LARGE_WORLD_DURABLE_STORE_FAULT:after-rename/);
    const renameRecovery = await store.recover();
    assert.equal(renameRecovery.source, 'primary');
    assert.equal(renameRecovery.bundle.bundle_root, secondBundle.bundle_root);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

test('resolves same-base multi-writer deltas deterministically and persists the loser gate', () => {
  const options = {worldId: 'world:conflict', seed: 'seed:conflict', loadRadius: 0, maxActiveChunks: 1};
  const sourceA = new LargeWorldRuntime(options);
  const sourceB = new LargeWorldRuntime(options);
  const target = new LargeWorldRuntime(options);
  const base = target.exportReplicationSnapshot();
  const writerReceipt = {status: 'committed', receipt_root: 'c'.repeat(64), decision_root: null, epoch: 0};
  sourceA.recordWorldEvent({authorityReceipt: writerReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'rain'}]}});
  sourceB.recordWorldEvent({authorityReceipt: writerReceipt, mutation: {operations: [{op: 'set', path: 'weather', value: 'storm'}]}});
  const deltaA = sourceA.createReplicationDelta(base, {deltaId: 'delta:writer-a'});
  const deltaB = sourceB.createReplicationDelta(base, {deltaId: 'delta:writer-b'});
  const candidates = [
    {delta: deltaB, writerId: 'writer-b', writerSequence: 1},
    {delta: deltaA, writerId: 'writer-a', writerSequence: 1}
  ];
  const reversedDecision = resolveReplicationConflict(candidates);
  const forwardDecision = resolveReplicationConflict([...candidates].reverse());
  assert.equal(reversedDecision.decision_root, forwardDecision.decision_root);
  assert.equal(reversedDecision.winner_delta_root, deltaA.delta_root);
  assert.deepEqual(reversedDecision.rejected_delta_roots, [deltaB.delta_root]);
  assert.equal(verifyReplicationConflictDecision(reversedDecision).valid, true);

  const courtReceipt = {status: 'committed', receipt_root: 'd'.repeat(64), decision_root: reversedDecision.decision_root, epoch: 1};
  const conflictReceipt = target.applyReplicationConflict(candidates, {authorityReceipt: courtReceipt});
  assert.equal(conflictReceipt.status, 'APPLIED');
  assert.equal(verifyReplicationConflictReceipt(conflictReceipt).valid, true);
  assert.equal(target.eventLog.event_count, 1);
  assert.equal(target.canonicalState.weather, 'rain');
  assert.throws(() => target.applyReplicationDelta(deltaB, {authorityReceipt: courtReceipt}), /LARGE_WORLD_REPLICATION_CONFLICT_LOSER/);

  const bundle = JSON.parse(JSON.stringify(target.exportDurableBundle()));
  assert.equal(bundle.replication_conflict_decisions.length, 1);
  const restarted = new LargeWorldRuntime(options);
  restarted.restoreDurableBundle(bundle, {authorityReceipt: courtReceipt});
  assert.throws(() => restarted.applyReplicationDelta(deltaB, {authorityReceipt: courtReceipt}), /LARGE_WORLD_REPLICATION_CONFLICT_LOSER/);
  const duplicate = target.applyReplicationConflict([...candidates].reverse(), {authorityReceipt: courtReceipt});
  assert.equal(duplicate.status, 'DUPLICATE');
  assert.equal(verifyReplicationConflictReceipt(duplicate).valid, true);
});

test('rejects invalid world dimensions and verifies tamper evidence', () => {
  assert.throws(() => generateRegion({width: 0}), /LARGE_WORLD_INTEGER_INVALID/);
  const region = generateRegion({worldId: 'world:tamper', seed: 'seed:tamper'});
  const tampered = structuredClone(region);
  tampered.chunks[0].biome = 'tampered';
  assert.equal(verifyRegion(tampered).valid, false);
});
