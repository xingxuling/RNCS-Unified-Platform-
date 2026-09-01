import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
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
import {renderSpatialReference, resolveSpatialAssetStreaming, verifySpatialFrame} from '@taowind/visual-state-runtime/spatial-reality-3d';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_WORKING_SET_BUDGET_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_WORKING_SET_BUDGET'));
const costFields = ['CPU_MILLI', 'GPU_MILLI', 'NPU_MILLI', 'VRAM_MB', 'RAM_MB', 'STORAGE_KB', 'NETWORK_KB', 'ENERGY_MILLI'];

function addCosts(target, costs) {
  for (const field of costFields) target[field] += Number(costs?.[field] ?? 0);
  return target;
}

function zeroCosts() {
  return Object.fromEntries(costFields.map(field => [field, 0]));
}

function totalForProfile(runtime, chunks, profile) {
  return chunks.reduce((total, chunk) => {
    const portfolio = runtime.getRepresentationPortfolio(chunk.chunk_id);
    const slot = portfolio.slots.find(candidate => candidate.quality_profile === profile);
    assert.ok(slot, `missing ${profile} slot for ${chunk.chunk_id}`);
    return addCosts(total, slot.resource_costs);
  }, zeroCosts());
}

function qualityCounts(selection) {
  return Object.fromEntries(LARGE_WORLD_SPATIAL_QUALITY_PROFILES.map(profile => [
    profile,
    selection.selections.filter(row => row.selected_quality_profile === profile).length
  ]));
}

test('allocates a bounded large-world working set by total resource budget', () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-large-world-working-set-budget',
    seed: 'seed:urrf-large-world-working-set-budget',
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
  const beforeWorldRoot = runtime.getRegion().world_root;
  const cinematic = runtime.selectActiveRepresentationPortfolios({quality_profile: 'CINEMATIC'});
  assert.equal(verifyPortfolioSelectionEnvelope(cinematic).valid, true);
  assert.equal(cinematic.selections.every(row => row.selected_quality_profile === 'CINEMATIC'), true);
  const cinematicCosts = totalForProfile(runtime, active, 'CINEMATIC');
  const proxyCosts = totalForProfile(runtime, active, 'PROXY');
  const gpuBudget = proxyCosts.GPU_MILLI + Math.floor((cinematicCosts.GPU_MILLI - proxyCosts.GPU_MILLI) / 2);
  const center = active.find(chunk => chunk.coordinates.x === 0 && chunk.coordinates.z === 0) ?? active[0];

  const fitSelection = runtime.selectActiveRepresentationPortfolios({
    quality_profile: 'CINEMATIC',
    working_set_resource_budget: {GPU: gpuBudget},
    working_set_minimum_quality_by_chunk: {[center.chunk_id]: 'STANDARD'},
    working_set_priority_by_chunk: {[center.chunk_id]: 100}
  });
  assert.equal(verifyPortfolioSelectionEnvelope(fitSelection).valid, true);
  assert.equal(fitSelection.working_set_budget_status, 'DOWNGRADED_TO_FIT');
  assert.ok(fitSelection.working_set_downgrade_count > 0);
  assert.equal(fitSelection.working_set_initial_resource_costs.GPU_MILLI, cinematicCosts.GPU_MILLI);
  assert.ok(fitSelection.working_set_resource_costs.GPU_MILLI <= gpuBudget);
  assert.equal(fitSelection.working_set_resource_remaining.GPU_MILLI, gpuBudget - fitSelection.working_set_resource_costs.GPU_MILLI);
  assert.equal(fitSelection.selections.find(row => row.chunk_id === center.chunk_id).selected_quality_profile, 'CINEMATIC');
  assert.equal(fitSelection.working_set_downgrade_chunk_ids.includes(center.chunk_id), false);
  assert.equal(fitSelection.selections.every(row => row.working_set_requested_quality_profile === 'CINEMATIC'), true);
  assert.equal(runtime.getRegion().world_root, beforeWorldRoot);
  const tamperedFit = structuredClone(fitSelection);
  tamperedFit.working_set_resource_costs.GPU_MILLI += 1;
  assert.equal(verifyPortfolioSelectionEnvelope(tamperedFit).valid, false);

  const fitScene = runtime.createSpatialScene({
    selection: fitSelection,
    scene_id: 'urrf-large-world-working-set-budget-fit',
    title: 'URRF Large World · Budget Fit',
    visual_scale: 4,
    evidence_root: rootHash({stream_root: stream.stream_root, selection_root: fitSelection.selection_root, budget: gpuBudget})
  });
  assert.equal(verifyLargeWorldSpatialScene(fitScene).valid, true);
  assert.deepEqual(fitScene.large_world.quality_profiles, ['MOBILE', 'STANDARD', 'CINEMATIC']);
  const renderOptions = {
    width: 640,
    height: 360,
    enableShadows: true,
    assetStreaming: resolveSpatialAssetStreaming(fitScene.assets, {
      activeCellIds: fitScene.streaming.cells.map(cell => cell.id),
      requestedAssetIds: fitScene.assets.map(asset => asset.id),
      maxAssets: fitScene.assets.length,
      maxBytes: fitScene.assets.reduce((sum, asset) => sum + asset.byteLength, 0)
    }),
    streaming: {
      loadRadius: 0,
      unloadRadius: 0,
      forcedCellIds: fitScene.streaming.cells.map(cell => cell.id)
    }
  };
  const rendered = renderSpatialReference(fitScene, renderOptions);
  assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);
  assert.ok(rendered.png.byteLength > 1000);
  writeFileSync(join(outputDir, 'large-world-working-set-budget-fit.png'), rendered.png);

  const minimumOverBudget = runtime.selectActiveRepresentationPortfolios({
    quality_profile: 'CINEMATIC',
    working_set_resource_budget: {GPU: Math.max(0, proxyCosts.GPU_MILLI - 1)}
  });
  assert.equal(verifyPortfolioSelectionEnvelope(minimumOverBudget).valid, true);
  assert.equal(minimumOverBudget.working_set_budget_status, 'MINIMUM_REALITY_OVER_BUDGET');
  assert.equal(minimumOverBudget.selections.every(row => row.selected_quality_profile === 'PROXY'), true);
  assert.equal(minimumOverBudget.working_set_resource_costs.GPU_MILLI, proxyCosts.GPU_MILLI);
  assert.equal(minimumOverBudget.working_set_resource_remaining.GPU_MILLI, -1);
  assert.equal(runtime.getRegion().world_root, beforeWorldRoot);

  const region = runtime.getRegion();
  const reportBase = {
    format: 'urrf.large-world-working-set-budget-report.v0.1',
    version: '0.1.0',
    evidence_level: 'LOCAL_RUNTIME_AND_CPU_REFERENCE_RENDER',
    world_id: region.world_id,
    generation: region.generation,
    region_root: region.region_root,
    world_root: region.world_root,
    stream_root: stream.stream_root,
    active_chunk_count: active.length,
    budget: fitSelection.working_set_budget,
    budget_root: fitSelection.working_set_budget_root,
    policy: fitSelection.working_set_quality_policy,
    fit_selection_root: fitSelection.selection_root,
    fit_status: fitSelection.working_set_budget_status,
    fit_downgrade_count: fitSelection.working_set_downgrade_count,
    fit_quality_counts: qualityCounts(fitSelection),
    fit_resource_costs: fitSelection.working_set_resource_costs,
    fit_resource_remaining: fitSelection.working_set_resource_remaining,
    minimum_selection_root: minimumOverBudget.selection_root,
    minimum_status: minimumOverBudget.working_set_budget_status,
    minimum_quality_counts: qualityCounts(minimumOverBudget),
    minimum_resource_costs: minimumOverBudget.working_set_resource_costs,
    minimum_resource_remaining: minimumOverBudget.working_set_resource_remaining,
    render: {
      image_path: 'large-world-working-set-budget-fit.png',
      image_bytes: rendered.png.byteLength,
      width: rendered.framePlan.viewport.width,
      height: rendered.framePlan.viewport.height,
      triangles: rendered.framePlan.stats.triangleCount,
      draw_calls: rendered.framePlan.stats.visibleDraws,
      frame_root: rendered.framePlan.frameRoot,
      pixel_root: rendered.pixelRoot
    },
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', execution_owner: 'VSR', candidate_only: true, authoritative: false, canonical_write_authorized: false},
    notes: 'The bounded allocator lowers a CINEMATIC request to a deterministic mixed-quality working set under an aggregate GPU budget, protects a high-priority center chunk at CINEMATIC and keeps a declared STANDARD minimum. A second run demonstrates MINIMUM_REALITY_OVER_BUDGET when even PROXY cannot fit. The image is CPU-reference evidence, not a GPU/AAA quality grade or canonical-world promotion.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'working-set-budget-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const readme = [
    '# URRF Large-World Working-Set Budget — Local Evidence',
    '',
    `- world_root: \`${region.world_root}\``,
    `- stream_root: \`${stream.stream_root}\``,
    `- budget_root: \`${fitSelection.working_set_budget_root}\``,
    `- report_root: \`${report.report_root}\``,
    `- fit status: \`${fitSelection.working_set_budget_status}\``,
    `- minimum status: \`${minimumOverBudget.working_set_budget_status}\``,
    '',
    '| Case | Status | Quality counts | GPU cost / budget | Evidence |',
    '|---|---|---|---:|---|',
    `| budget fit | ${fitSelection.working_set_budget_status} | ${JSON.stringify(qualityCounts(fitSelection))} | ${fitSelection.working_set_resource_costs.GPU_MILLI} / ${gpuBudget} | [PNG](./large-world-working-set-budget-fit.png) |`,
    `| minimum reality | ${minimumOverBudget.working_set_budget_status} | ${JSON.stringify(qualityCounts(minimumOverBudget))} | ${minimumOverBudget.working_set_resource_costs.GPU_MILLI} / ${minimumOverBudget.working_set_budget.available.GPU_MILLI} | selection envelope |`,
    '',
    'This is local deterministic runtime evidence for aggregate active-working-set allocation. It proves explicit costs, priorities, minimum-quality policy, downgrade reasons and fail-closed over-budget status; it does not prove production GPU/WebGPU performance, distributed streaming, subjective art quality, AAA assets, or canonical-world writes.'
  ];
  writeFileSync(join(outputDir, 'README.md'), `${readme.join('\n')}\n`, 'utf8');
  assert.ok(readFileSync(join(outputDir, 'working-set-budget-report.json')).byteLength > 3000);
  assert.ok(readFileSync(join(outputDir, 'README.md')).byteLength > 700);
});
