import assert from 'node:assert/strict';
import test from 'node:test';
import {LargeWorldRuntime, verifyLargeWorldSpatialScene, verifyPortfolioSelectionEnvelope} from '../src/index.mjs';

test('changes large-world representation cost and behavior with independent causal/physical detail', () => {
  const runtime = new LargeWorldRuntime({
    worldId: 'world:causal-physical-test',
    seed: 'seed:causal-physical-test',
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
  const budget = {CPU_MILLI: 200, GPU_MILLI: 100, RAM_MB: 512, VRAM_MB: 64, STORAGE_KB: 1024, NETWORK_KB: 1024, ENERGY_MILLI: 512};
  const lowProfiles = Object.fromEntries(active.map(chunk => [chunk.chunk_id, runtime.createCausalPhysicalProfile({
    profile_id: `profile:low:${chunk.chunk_id}`,
    chunk_id: chunk.chunk_id,
    demand: {task: 'far navigation', interaction_probability: 0, risk: 0, observation: 0, authority: 0, event_intensity: 0}
  })]));
  const highProfiles = Object.fromEntries(active.map(chunk => [chunk.chunk_id, runtime.createCausalPhysicalProfile({
    profile_id: `profile:high:${chunk.chunk_id}`,
    chunk_id: chunk.chunk_id,
    demand: {task: 'combat collision', interaction_probability: 90, risk: 80, observation: 90, authority: 80, event_intensity: 90}
  })]));
  const low = runtime.selectActiveRepresentationPortfolios({quality_profile: 'STANDARD', resource_budget: budget, causal_physical_profile_by_chunk: lowProfiles});
  const high = runtime.selectActiveRepresentationPortfolios({quality_profile: 'STANDARD', resource_budget: budget, causal_physical_profile_by_chunk: highProfiles});
  assert.equal(verifyPortfolioSelectionEnvelope(low).valid, true);
  assert.equal(verifyPortfolioSelectionEnvelope(high).valid, true);
  assert.equal(low.causal_physical_ready_count, active.length);
  assert.equal(high.causal_physical_ready_count, active.length);
  assert.equal(low.causal_physical_blocked_count, 0);
  assert.equal(high.causal_physical_blocked_count, 0);
  assert.equal(low.selections.every(row => row.causal_physical_causal_level === 'C0' && row.causal_physical_physical_level === 'P0'), true);
  assert.equal(high.selections.every(row => row.causal_physical_causal_level === 'C5' && row.causal_physical_physical_level === 'P5'), true);
  assert.equal(low.selections.every(row => row.selected_quality_profile === 'STANDARD'), true);
  assert.equal(high.selections.every(row => row.selected_quality_profile === 'PROXY'), true);
  assert.equal(low.selections[0].causal_physical_effective_resource_budget.CPU_MILLI, 190);
  assert.equal(high.selections[0].causal_physical_effective_resource_budget.CPU_MILLI, 0);
  assert.notEqual(low.selection_root, high.selection_root);
  const tampered = structuredClone(high);
  tampered.causal_physical_profile_roots[tampered.active_chunk_ids[0]] = 'f'.repeat(64);
  assert.equal(verifyPortfolioSelectionEnvelope(tampered).valid, false);
  const lowScene = runtime.createSpatialScene({selection: low, scene_id: 'scene:causal-physical:low'});
  const highScene = runtime.createSpatialScene({selection: high, scene_id: 'scene:causal-physical:high'});
  assert.equal(verifyLargeWorldSpatialScene(lowScene).valid, true);
  assert.equal(verifyLargeWorldSpatialScene(highScene).valid, true);
  assert.equal(lowScene.large_world.causal_physical_ready_count, active.length);
  assert.equal(highScene.large_world.causal_physical_ready_count, active.length);
  assert.equal(runtime.getRegion().world_root, worldRoot);
});
