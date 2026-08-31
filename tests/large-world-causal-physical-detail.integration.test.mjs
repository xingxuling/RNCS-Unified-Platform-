import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {LargeWorldRuntime, verifyLargeWorldSpatialScene, verifyPortfolioSelectionEnvelope} from '@taowind/large-world-runtime';
import {compileSpatialFrame, renderSpatialReference, verifySpatialFrame} from '@taowind/visual-state-runtime/spatial-reality-3d';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_CAUSAL_PHYSICAL_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_CAUSAL_PHYSICAL_DETAIL'));

test('executes causal/physical detail lowering into different large-world costs and views', () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-causal-physical-detail',
    seed: 'seed:urrf-causal-physical-detail',
    width: 5,
    depth: 5,
    chunkSize: 64,
    sampleResolution: 8,
    loadRadius: 1,
    unloadRadius: 1,
    maxActiveChunks: 9
  });
  runtime.observe({x: 0, z: 0});
  const active = runtime.listActiveChunks();
  const worldRoot = runtime.getRegion().world_root;
  const resourceBudget = {CPU_MILLI: 200, GPU_MILLI: 100, RAM_MB: 512, VRAM_MB: 64, STORAGE_KB: 1024, NETWORK_KB: 1024, ENERGY_MILLI: 512};
  const lowProfiles = Object.fromEntries(active.map(chunk => [chunk.chunk_id, runtime.createCausalPhysicalProfile({
    profile_id: `profile:low:${chunk.chunk_id}`,
    chunk_id: chunk.chunk_id,
    demand: {task: 'far navigation', interaction_probability: 0, risk: 0, observation: 0, authority: 0, event_intensity: 0},
    evidence_refs: [chunk.chunk_root]
  })]));
  const highProfiles = Object.fromEntries(active.map(chunk => [chunk.chunk_id, runtime.createCausalPhysicalProfile({
    profile_id: `profile:high:${chunk.chunk_id}`,
    chunk_id: chunk.chunk_id,
    demand: {task: 'combat collision', interaction_probability: 90, risk: 80, observation: 90, authority: 80, event_intensity: 90},
    evidence_refs: [chunk.chunk_root]
  })]));
  const low = runtime.selectActiveRepresentationPortfolios({quality_profile: 'STANDARD', resource_budget: resourceBudget, causal_physical_profile_by_chunk: lowProfiles});
  const high = runtime.selectActiveRepresentationPortfolios({quality_profile: 'STANDARD', resource_budget: resourceBudget, causal_physical_profile_by_chunk: highProfiles});
  assert.equal(verifyPortfolioSelectionEnvelope(low).valid, true);
  assert.equal(verifyPortfolioSelectionEnvelope(high).valid, true);
  assert.equal(low.selections.every(row => row.selected_quality_profile === 'STANDARD'), true);
  assert.equal(high.selections.every(row => row.selected_quality_profile === 'PROXY'), true);
  assert.equal(low.selections.every(row => row.causal_physical_resource_status === 'ADMITTED'), true);
  assert.equal(high.selections.every(row => row.causal_physical_resource_status === 'ADMITTED'), true);
  assert.equal(low.selections[0].causal_physical_effective_resource_budget.CPU_MILLI, 190);
  assert.equal(high.selections[0].causal_physical_effective_resource_budget.CPU_MILLI, 0);
  assert.notEqual(low.selection_root, high.selection_root);

  const camera = {translation: [32, 14, 78], rotationEulerDeg: [-18, 0, 0]};
  const lowScene = runtime.createSpatialScene({selection: low, scene_id: 'urrf-causal-physical-detail-low', camera});
  const highScene = runtime.createSpatialScene({selection: high, scene_id: 'urrf-causal-physical-detail-high', camera});
  assert.equal(verifyLargeWorldSpatialScene(lowScene).valid, true);
  assert.equal(verifyLargeWorldSpatialScene(highScene).valid, true);
  const lowRenderOptions = {width: 320, height: 180, enableShadows: false, streaming: {loadRadius: 0, unloadRadius: 0, forcedCellIds: lowScene.streaming.cells.map(cell => cell.id)}};
  const highRenderOptions = {width: 320, height: 180, enableShadows: false, streaming: {loadRadius: 0, unloadRadius: 0, forcedCellIds: highScene.streaming.cells.map(cell => cell.id)}};
  const lowFrame = compileSpatialFrame(lowScene, lowRenderOptions);
  const highFrame = compileSpatialFrame(highScene, highRenderOptions);
  const lowRendered = renderSpatialReference(lowScene, lowRenderOptions);
  const highRendered = renderSpatialReference(highScene, highRenderOptions);
  assert.equal(verifySpatialFrame(lowFrame).ok, true);
  assert.equal(verifySpatialFrame(highFrame).ok, true);
  assert.equal(verifySpatialFrame(lowRendered.framePlan).ok, true);
  assert.equal(verifySpatialFrame(highRendered.framePlan).ok, true);
  assert.notEqual(lowRendered.pixelRoot, highRendered.pixelRoot);
  assert.equal(runtime.getRegion().world_root, worldRoot);

  const reportBase = {
    format: 'urrf.large-world-causal-physical-detail-report.v0.1',
    world_id: runtime.options.worldId,
    region_root: runtime.getRegion().region_root,
    world_root: worldRoot,
    active_chunk_ids: active.map(chunk => chunk.chunk_id).sort(),
    low_detail: {
      selection_root: low.selection_root,
      scene_root: lowScene.scene_root,
      frame_root: lowFrame.frameRoot,
      pixel_root: lowRendered.pixelRoot,
      causal_level: low.selections[0].causal_physical_causal_level,
      physical_level: low.selections[0].causal_physical_physical_level,
      selected_quality_profiles: [...new Set(low.selections.map(row => row.selected_quality_profile))],
      resource_costs: low.selections[0].causal_physical_resource_costs
    },
    high_detail: {
      selection_root: high.selection_root,
      scene_root: highScene.scene_root,
      frame_root: highFrame.frameRoot,
      pixel_root: highRendered.pixelRoot,
      causal_level: high.selections[0].causal_physical_causal_level,
      physical_level: high.selections[0].causal_physical_physical_level,
      selected_quality_profiles: [...new Set(high.selections.map(row => row.selected_quality_profile))],
      resource_costs: high.selections[0].causal_physical_resource_costs
    },
    authority: {
      canonical_owner: 'RNCS',
      representation_owner: 'URRF',
      execution_owner: 'VSR',
      canonical_state_mutated: false,
      canonical_write_authorized: false,
      candidate_only: true,
      commit_status: 'NOT_COMMITTED'
    },
    notes: 'Candidate-only local causal/physical lowering. Demand selects independent C/P levels; the derived execution policy and resource costs consume the same visual budget so high-risk interaction falls back to minimum-reality proxy. The CPU-reference views demonstrate a deterministic selection/render difference, not production physics, real GPU telemetry, or AAA visual quality.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'large-world-causal-physical-detail-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-causal-physical-detail-low.png'), lowRendered.png);
  writeFileSync(join(outputDir, 'large-world-causal-physical-detail-high.png'), highRendered.png);
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'large-world-causal-physical-detail-report.json')).byteLength > 1000);
  assert.ok(readFileSync(join(outputDir, 'large-world-causal-physical-detail-low.png')).byteLength > 1000);
  assert.ok(readFileSync(join(outputDir, 'large-world-causal-physical-detail-high.png')).byteLength > 1000);
});
