import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {rootHash, verifyRepresentationPortfolio} from '@taowind/rncs-core-contract';
import {
  RealityRepresentationPortfolioRuntime,
  verifyPortfolioRuntimeSnapshot,
  verifyVisualEvidence
} from '@taowind/reality-representation-fabric';
import {
  LargeWorldRuntime,
  verifyMaterializationBatch,
  verifyStreamResolutionReceipt
} from '@taowind/large-world-runtime';
import {
  calculateMeshNormals,
  createCubeMesh,
  renderSpatialReference,
  resolveSpatialAssetStreaming,
  verifySpatialFrame,
  VSR_SPATIAL_SCENE_FORMAT
} from '@taowind/visual-state-runtime/spatial-reality-3d';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_PORTFOLIO_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_PORTFOLIO'));

const biomeColors = Object.freeze({
  coast: '#2b8cbe',
  desert: '#d9a441',
  forest: '#2f855a',
  grassland: '#79a83b',
  tundra: '#b9d4e8',
  wetland: '#3f7f73'
});

const proxyColors = Object.freeze({
  coast: '#1d4f69',
  desert: '#765b24',
  forest: '#214d36',
  grassland: '#4c6726',
  tundra: '#617481',
  wetland: '#2a514d'
});

function sceneFromChunks(region, chunks, selectedByChunk, evidenceRoot) {
  const meshes = [createCubeMesh('mesh:chunk-structure', 1)];
  const materials = [];
  const nodes = [];
  const cells = [];
  const assets = [];
  const materialIds = new Set();
  for (const chunk of chunks) {
    const selection = selectedByChunk.get(chunk.chunk_id);
    assert.ok(selection?.slot, `missing selection for ${chunk.chunk_id}`);
    const quality = selection.slot.quality_profile;
    const meshId = `mesh:${chunk.chunk_id}`;
    const nodeId = `node:${chunk.chunk_id}`;
    const cellId = `cell:${chunk.chunk_id}`;
    const source = chunk.mesh.positions;
    const scale = chunk.extent_mm.x / 1000 / chunk.sample_resolution;
    const positions = [];
    for (let index = 0; index < source.length; index += 3) {
      positions.push(source[index] * scale, source[index + 1] / 1000, source[index + 2] * scale);
    }
    const meshBase = {id: meshId, positions, indices: [...chunk.mesh.indices], topology: 'triangle-list'};
    meshes.push({...meshBase, normals: calculateMeshNormals(meshBase)});
    const materialId = `material:${quality.toLowerCase()}:${chunk.biome}`;
    if (!materialIds.has(materialId)) {
      materialIds.add(materialId);
      materials.push({
        id: materialId,
        baseColor: (quality === 'PROXY' ? proxyColors : biomeColors)[chunk.biome] ?? '#6b7280',
        roughness: quality === 'PROXY' ? 1 : .88,
        metallic: quality === 'PROXY' ? 0 : .04,
        doubleSided: true
      });
    }
    const worldX = chunk.coordinates.x * chunk.extent_mm.x / 1000;
    const worldZ = chunk.coordinates.z * chunk.extent_mm.z / 1000;
    const cellNodeIds = [nodeId];
    const structureMaterialId = `material:structure:${quality.toLowerCase()}`;
    if (!materialIds.has(structureMaterialId)) {
      materialIds.add(structureMaterialId);
      materials.push({
        id: structureMaterialId,
        baseColor: quality === 'PROXY' ? '#b7791f' : '#f6ad55',
        roughness: quality === 'PROXY' ? .92 : .58,
        metallic: quality === 'PROXY' ? .05 : .18,
        doubleSided: true
      });
    }
    nodes.push({
      id: nodeId,
      meshId,
      materialId,
      transform: {translation: [worldX, 0, worldZ]},
      castShadow: false,
      receiveShadow: true,
      representationSlotId: selection.slot.slot_id
    });
    for (const structure of chunk.structures ?? []) {
      const structureNodeId = `node:${structure.id}`;
      const size = structure.scale_mm / 1000;
      nodes.push({
        id: structureNodeId,
        meshId: 'mesh:chunk-structure',
        materialId: structureMaterialId,
        transform: {
          translation: [worldX + structure.local_position_mm.x / 1000, structure.local_position_mm.y / 1000 + size / 2, worldZ + structure.local_position_mm.z / 1000],
          scale: [size, size, size]
        },
        castShadow: false,
        receiveShadow: true,
        representationSlotId: selection.slot.slot_id,
        structureKind: structure.kind
      });
      cellNodeIds.push(structureNodeId);
    }
    cells.push({
      id: cellId,
      center: [worldX + chunk.extent_mm.x / 2000, 0, worldZ + chunk.extent_mm.z / 2000],
      radius: chunk.extent_mm.x / 1000,
      nodeIds: cellNodeIds
    });
    assets.push({
      id: `asset:${chunk.chunk_id}`,
      uri: `rncs://${chunk.chunk_id}/${selection.slot.quality_profile.toLowerCase()}`,
      sha256: chunk.content_root,
      byteLength: chunk.memory_bytes,
      kind: 'mesh',
      cellIds: [cellId],
      priority: quality === 'PROXY' ? 0 : 1,
      representationRoot: selection.slot.representation_root,
      portfolioRoot: selection.portfolio_root
    });
  }
  return {
    format: VSR_SPATIAL_SCENE_FORMAT,
    sceneId: 'urrf-large-world-portfolio-v01',
    background: '#07111e',
    activeCameraId: 'camera:world',
    meshes,
    materials,
    nodes,
    streaming: {worldId: region.world_id, cells},
    cameras: [{id: 'camera:world', projection: 'perspective', fovYDeg: 55, near: .1, far: 1000, transform: {translation: [0, 54, 190], rotationEulerDeg: [-18, 0, 0]}}],
    lights: [
      {id: 'ambient', kind: 'ambient', color: '#b8d4ff', intensity: .3},
      {id: 'sun', kind: 'directional', color: '#fff0ce', intensity: 1.8, direction: [-.45, -1, -.35], castShadow: false}
    ],
    reality: {worldId: region.world_id, generation: region.generation, realityRoot: region.world_root, evidenceRoot},
    assets
  };
}

function renderOptions(scene) {
  const assetStreaming = resolveSpatialAssetStreaming(scene.assets, {
    activeCellIds: scene.streaming.cells.map(cell => cell.id),
    requestedAssetIds: scene.assets.map(asset => asset.id),
    maxAssets: scene.assets.length,
    maxBytes: scene.assets.reduce((sum, asset) => sum + asset.byteLength, 0)
  });
  return {
    width: 640,
    height: 360,
    enableShadows: false,
    assetStreaming,
    streaming: {
      loadRadius: 0,
      unloadRadius: 0,
      forcedCellIds: scene.streaming.cells.map(cell => cell.id)
    }
  };
}

function renderRecord(id, rendered, imagePath, selections) {
  return {
    id,
    image_path: imagePath,
    image_bytes: rendered.png.byteLength,
    width: rendered.framePlan.viewport.width,
    height: rendered.framePlan.viewport.height,
    triangles: rendered.framePlan.stats.triangleCount,
    draw_calls: rendered.framePlan.stats.visibleDraws,
    frame_root: rendered.framePlan.frameRoot,
    geometry_root: rendered.framePlan.geometryRoot,
    material_root: rendered.framePlan.materialRoot,
    environment_root: rendered.framePlan.environmentRoot,
    pixel_root: rendered.pixelRoot,
    selection_root: rootHash([...selections.values()].map(selection => ({
      portfolio_root: selection.portfolio_root,
      slot_root: selection.selected_slot_root,
      selected_slot_id: selection.selected_slot_id,
      fallback_used: selection.fallback_used
    })))
  };
}

test('streams active chunks through per-chunk URRF portfolios and renders deterministic mixed-quality region evidence', async () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-large-world-portfolio',
    seed: 'seed:urrf-large-world-portfolio',
    width: 9,
    depth: 9,
    chunkSize: 64,
    sampleResolution: 8,
    loadRadius: 1,
    unloadRadius: 2,
    maxActiveChunks: 9,
    materializeChunk: async ({chunk}) => ({
      status: 'EXECUTED',
      runtime: 'large-world-portfolio-cpu-reference',
      output_root: chunk.content_root,
      evidence_root: rootHash({chunk_root: chunk.chunk_root, renderer: 'vsr-cpu-reference'})
    })
  });
  const stream = runtime.observe({x: 0, z: 0});
  assert.equal(stream.active_chunk_ids.length, 9);
  assert.equal(verifyStreamResolutionReceipt(stream).valid, true);
  const batch = await runtime.materializeActive();
  assert.equal(batch.status, 'EXECUTED');
  assert.equal(batch.receipts.length, 9);
  assert.equal(verifyMaterializationBatch(batch).valid, true);

  const region = runtime.getRegion();
  const active = runtime.listActiveChunks();
  const portfolioRuntime = new RealityRepresentationPortfolioRuntime({fabric: runtime.fabric});
  const portfolios = active.map(chunk => runtime.getRepresentationPortfolio(chunk.chunk_id));
  for (const portfolio of portfolios) {
    assert.equal(verifyRepresentationPortfolio(portfolio).valid, true);
    assert.equal(portfolio.composition_result.composition_status, 'READY');
    portfolioRuntime.registerPortfolio(portfolio);
  }
  assert.equal(portfolioRuntime.listPortfolios().length, active.length);

  const center = active.find(chunk => chunk.coordinates.x === 0 && chunk.coordinates.z === 0) ?? active[0];
  const mixedSelections = new Map();
  for (const chunk of active) {
    const portfolio = portfolios.find(item => item.object_id === chunk.object_id);
    const request = chunk.chunk_id === center.chunk_id
      ? {portfolio_id: portfolio.portfolio_id, quality_profile: 'STANDARD'}
      : {portfolio_id: portfolio.portfolio_id, quality_profile: 'PROXY'};
    mixedSelections.set(chunk.chunk_id, portfolioRuntime.selectSlot(request));
  }
  assert.equal([...mixedSelections.values()].filter(selection => selection.slot.quality_profile === 'STANDARD').length, 1);
  assert.equal([...mixedSelections.values()].filter(selection => selection.slot.quality_profile === 'PROXY').length, 8);

  const zeroBudget = {CPU_MILLI: 0, GPU_MILLI: 0, NPU_MILLI: 0, VRAM_MB: 0, RAM_MB: 0, STORAGE_KB: 0, NETWORK_KB: 0, ENERGY_MILLI: 0};
  const constrainedSelections = new Map(active.map(chunk => {
    const portfolio = portfolios.find(item => item.object_id === chunk.object_id);
    return [chunk.chunk_id, portfolioRuntime.selectSlot({portfolio_id: portfolio.portfolio_id, quality_profile: 'STANDARD', resource_budget: zeroBudget})];
  }));
  assert.equal([...constrainedSelections.values()].every(selection => selection.slot.quality_profile === 'PROXY'), true);
  assert.equal([...constrainedSelections.values()].every(selection => selection.fallback_used === true), true);

  const mixedScene = sceneFromChunks(region, active, mixedSelections, rootHash({stream_root: stream.stream_root, materialization_root: batch.materialization_root, mode: 'mixed'}));
  const mixedOptions = renderOptions(mixedScene);
  const mixedFrame = renderSpatialReference(mixedScene, mixedOptions);
  const mixedRepeat = renderSpatialReference(mixedScene, mixedOptions);
  assert.equal(verifySpatialFrame(mixedFrame.framePlan).ok, true);
  assert.equal(mixedFrame.pixelRoot, mixedRepeat.pixelRoot);
  const mixedImagePath = join(outputDir, 'large-world-region-mixed.png');
  writeFileSync(mixedImagePath, mixedFrame.png);

  const constrainedScene = sceneFromChunks(region, active, constrainedSelections, rootHash({stream_root: stream.stream_root, materialization_root: batch.materialization_root, mode: 'constrained'}));
  const constrainedOptions = renderOptions(constrainedScene);
  const constrainedFrame = renderSpatialReference(constrainedScene, constrainedOptions);
  assert.equal(verifySpatialFrame(constrainedFrame.framePlan).ok, true);
  const constrainedImagePath = join(outputDir, 'large-world-region-proxy-fallback.png');
  writeFileSync(constrainedImagePath, constrainedFrame.png);
  assert.notEqual(mixedFrame.pixelRoot, constrainedFrame.pixelRoot);

  const centerPortfolio = portfolios.find(item => item.object_id === center.object_id);
  const centerSelection = mixedSelections.get(center.chunk_id);
  const edgeChunk = active.find(chunk => chunk.chunk_id !== center.chunk_id);
  const edgePortfolio = portfolios.find(item => item.object_id === edgeChunk.object_id);
  const edgeSelection = mixedSelections.get(edgeChunk.chunk_id);
  const visualEvidence = [];
  for (const [label, portfolio, selection, rendered] of [
    ['mixed-standard', centerPortfolio, centerSelection, mixedFrame],
    ['mixed-proxy', edgePortfolio, edgeSelection, mixedFrame],
    ['budget-fallback-proxy', edgePortfolio, constrainedSelections.get(edgeChunk.chunk_id), constrainedFrame]
  ]) {
    const evidence = portfolioRuntime.recordVisualEvidence({
      portfolio_id: portfolio.portfolio_id,
      slot_id: selection.selected_slot_id,
      evidence_id: `visual:urrf-large-world:${label}`,
      status: 'LOCAL_RENDERED',
      quality_status: 'OBSERVED_NOT_GRADED',
      width: rendered.framePlan.viewport.width,
      height: rendered.framePlan.viewport.height,
      png_bytes: rendered.png.byteLength,
      triangles: rendered.framePlan.stats.triangleCount,
      draw_calls: rendered.framePlan.stats.visibleDraws,
      pixel_root: rendered.pixelRoot,
      frame_root: rendered.framePlan.frameRoot,
      environment_root: rendered.framePlan.environmentRoot,
      diversity_observation: selection.slot.diversity_axes,
      notes: 'Deterministic VSR CPU-reference projection of an RNCS active chunk working set; visual quality is observed but not graded or promoted.'
    });
    assert.equal(verifyVisualEvidence(evidence).valid, true);
    visualEvidence.push(evidence);
  }
  const runtimeVerification = portfolioRuntime.verify();
  assert.equal(runtimeVerification.valid, true);
  assert.equal(verifyPortfolioRuntimeSnapshot(runtimeVerification.snapshot), true);

  const selections = active.map(chunk => {
    const selection = mixedSelections.get(chunk.chunk_id);
    const constrained = constrainedSelections.get(chunk.chunk_id);
    return {
      chunk_id: chunk.chunk_id,
      coordinates: chunk.coordinates,
      portfolio_id: selection.portfolio_id,
      portfolio_root: selection.portfolio_root,
      selected_slot_id: selection.selected_slot_id,
      selected_quality_profile: selection.slot.quality_profile,
      selected_slot_root: selection.selected_slot_root,
      selected_representation_root: selection.slot.representation_root,
      fallback_used: selection.fallback_used,
      selection_root: selection.selection_root,
      constrained_slot_id: constrained.selected_slot_id,
      constrained_quality_profile: constrained.slot.quality_profile,
      constrained_fallback_used: constrained.fallback_used,
      constrained_selection_root: constrained.selection_root
    };
  });
  const renderSamples = [
    renderRecord('mixed', mixedFrame, 'large-world-region-mixed.png', mixedSelections),
    renderRecord('proxy-fallback', constrainedFrame, 'large-world-region-proxy-fallback.png', constrainedSelections)
  ];
  const report = {
    format: 'urrf.large-world-portfolio-report.v0.1',
    version: '0.1.0',
    world_id: region.world_id,
    generation: region.generation,
    region_root: region.region_root,
    world_root: region.world_root,
    stream_root: stream.stream_root,
    materialization_root: batch.materialization_root,
    active_chunk_count: active.length,
    portfolio_count: portfolios.length,
    portfolio_roots: portfolios.map(portfolio => portfolio.portfolio_root).sort(),
    composition_statuses: portfolios.map(portfolio => portfolio.composition_result.composition_status),
    quality_counts: {
      mixed: {PROXY: 8, STANDARD: 1},
      constrained: {PROXY: 9, STANDARD: 0}
    },
    selections,
    render_samples: renderSamples,
    visual_evidence_roots: visualEvidence.map(evidence => evidence.evidence_root),
    runtime_root: runtimeVerification.snapshot.runtime_root,
    status: 'LOCAL_RENDERED_OBSERVED_NOT_GRADED',
    authority: {canonical_write_authorized: false, candidate_only: true, authoritative: false},
    notes: 'The render is a deterministic VSR CPU-reference projection of the RNCS active working set. It demonstrates per-chunk URRF portfolio selection and minimum-reality fallback; it does not prove production GPU/WebGPU quality, MMO-scale streaming, browser delivery, subjective art direction, or canonical-world promotion.',
    report_root: null
  };
  delete report.report_root;
  report.report_root = rootHash(report);
  writeFileSync(join(outputDir, 'large-world-portfolio-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const readme = [
    '# URRF Large-World Portfolio — Local Evidence',
    '',
    `- world_root: \`${region.world_root}\``,
    `- stream_root: \`${stream.stream_root}\``,
    `- materialization_root: \`${batch.materialization_root}\``,
    `- portfolio_count: ${portfolios.length} (one candidate portfolio per active chunk)`,
    `- report_root: \`${report.report_root}\``,
    '- status: `LOCAL_RENDERED / OBSERVED_NOT_GRADED`',
    '',
    '| Sample | Active chunks | Selected profiles | PNG | Pixel root | Frame root |',
    '|---|---:|---|---|---|---|',
    `| mixed | ${active.length} | PROXY×8 + STANDARD×1 | [large-world-region-mixed.png](./large-world-region-mixed.png) | \`${mixedFrame.pixelRoot}\` | \`${mixedFrame.framePlan.frameRoot}\` |`,
    `| proxy-fallback | ${active.length} | PROXY×9 (zero-budget fallback) | [large-world-region-proxy-fallback.png](./large-world-region-proxy-fallback.png) | \`${constrainedFrame.pixelRoot}\` | \`${constrainedFrame.framePlan.frameRoot}\` |`,
    '',
    'Each chunk portfolio contains the bound PROXY/MOBILE/STANDARD/CINEMATIC candidate ladder when both URRF references are present. This sample deliberately selects STANDARD and PROXY to demonstrate mixed-quality and minimum-reality fallback receipts; RNCS retains canonical world-state authority.',
    '',
    'The PNGs are deterministic CPU-reference projections. They are evidence of a runnable multi-region integration, not a production renderer-quality grade.'
  ];
  writeFileSync(join(outputDir, 'README.md'), `${readme.join('\n')}\n`, 'utf8');
  assert.equal(report.active_chunk_count, 9);
  assert.equal(report.portfolio_count, 9);
  assert.equal(new Set(report.composition_statuses).size, 1);
});
