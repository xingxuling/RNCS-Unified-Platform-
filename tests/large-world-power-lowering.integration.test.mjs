import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRealityPowerProfile, createRealityResourceBudget, rootHash, verifyRealityLoadSheddingPlan} from '@taowind/rncs-core-contract';
import {RealityResourceGovernor} from '@taowind/reality-representation-fabric';
import {
  LargeWorldRuntime,
  verifyLargeWorldSpatialScene,
  verifyPortfolioSelectionEnvelope
} from '@taowind/large-world-runtime';
import {compileSpatialFrame, renderSpatialReference, verifySpatialFrame} from '@taowind/visual-state-runtime/spatial-reality-3d';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_POWER_LOWERING_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_POWER_LOWERING'));

function countBy(values, field) {
  return Object.fromEntries([...new Set(values.map(value => value[field]))].sort().map(key => [key, values.filter(value => value[field] === key).length]));
}

test('executes the URRF Power Plane into bounded large-world proxy selections and VSR frames', () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-power-lowering',
    seed: 'seed:urrf-power-lowering',
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
  const worldRoot = runtime.getRegion().world_root;
  const power = createRealityPowerProfile({
    node_id: 'node:urrf-power-lowering',
    power_state: 'battery',
    grid_connected: false,
    battery_percent: 18,
    thermal_celsius_milli: 55000
  });
  const budget = createRealityResourceBudget({
    node_id: 'node:urrf-power-lowering',
    power_profile_root: power.power_root,
    capacities: {CPU: 1000, GPU: 1000, VRAM: 1000, RAM: 1000, NETWORK: 1000, ENERGY: 1000},
    used: {CPU: 100, ENERGY: 100}
  });
  const governor = new RealityResourceGovernor({nodeId: 'node:urrf-power-lowering', tick: 11, powerProfile: power, resourceBudget: budget});
  for (const [index, chunk] of active.entries()) governor.submitDemand({
    candidate_id: `visual:${chunk.chunk_id}`,
    candidate_kind: 'visual',
    priority: index === 0 ? 90 : 70,
    resource_costs: {GPU: 400, VRAM: 400, NETWORK: 50}
  });
  const plan = governor.plan({planId: 'plan:urrf-power-lowering'});
  assert.equal(verifyRealityLoadSheddingPlan(plan).valid, true);

  const standardSelection = runtime.selectActiveRepresentationPortfolios({quality_profile: 'STANDARD'});
  const loweredSelection = runtime.selectActiveRepresentationPortfolios({quality_profile: 'STANDARD', resource_governor_plan: plan});
  assert.equal(verifyPortfolioSelectionEnvelope(standardSelection).valid, true);
  assert.equal(verifyPortfolioSelectionEnvelope(loweredSelection).valid, true);
  assert.equal(standardSelection.stream_root, stream.stream_root);
  assert.equal(loweredSelection.stream_root, stream.stream_root);
  assert.equal(loweredSelection.resource_governor_plan_root, plan.plan_root);
  assert.equal(loweredSelection.resource_governor_power_mode, 'CONSTRAINED');
  assert.equal(loweredSelection.resource_governor_load_shedding_level, 'MODERATE');
  assert.equal(loweredSelection.unbound_governor_chunk_ids.length, 0);
  assert.equal(standardSelection.power_downgrade_count, 0);
  assert.equal(loweredSelection.power_downgrade_count, active.length);
  assert.equal(loweredSelection.selections.every(row => row.selected_quality_profile === 'PROXY' && row.power_decision_bound === true), true);
  assert.equal(runtime.getRegion().world_root, worldRoot);

  const standardScene = runtime.createSpatialScene({
    scene_id: 'urrf-large-world-power-lowering-standard-v01',
    selection: standardSelection,
    camera: {translation: [32, 14, 78], rotationEulerDeg: [-18, 0, 0]},
    evidence_root: rootHash({stream_root: stream.stream_root, selection_root: standardSelection.selection_root, mode: 'standard'})
  });
  const loweredScene = runtime.createSpatialScene({
    scene_id: 'urrf-large-world-power-lowering-proxy-v01',
    selection: loweredSelection,
    camera: {translation: [32, 14, 78], rotationEulerDeg: [-18, 0, 0]},
    evidence_root: rootHash({stream_root: stream.stream_root, selection_root: loweredSelection.selection_root, plan_root: plan.plan_root, mode: 'power-lowered'})
  });
  assert.equal(verifyLargeWorldSpatialScene(standardScene).valid, true);
  assert.equal(verifyLargeWorldSpatialScene(loweredScene).valid, true);
  const standardFrame = compileSpatialFrame(standardScene, {width: 320, height: 180, enableShadows: false});
  const loweredFrame = compileSpatialFrame(loweredScene, {width: 320, height: 180, enableShadows: false});
  const standardRendered = renderSpatialReference(standardScene, {width: 320, height: 180, enableShadows: false});
  const loweredRendered = renderSpatialReference(loweredScene, {width: 320, height: 180, enableShadows: false});
  assert.equal(verifySpatialFrame(standardFrame).ok, true);
  assert.equal(verifySpatialFrame(loweredFrame).ok, true);
  assert.equal(verifySpatialFrame(standardRendered.framePlan).ok, true);
  assert.equal(verifySpatialFrame(loweredRendered.framePlan).ok, true);
  assert.notEqual(standardRendered.pixelRoot, loweredRendered.pixelRoot);

  const reportBase = {
    format: 'urrf.large-world-power-lowering-report.v0.1',
    world_id: runtime.options.worldId,
    region_root: runtime.getRegion().region_root,
    world_root: worldRoot,
    stream_root: stream.stream_root,
    active_chunk_ids: active.map(chunk => chunk.chunk_id).sort(),
    resource_governor: {
      plan_root: plan.plan_root,
      power_profile_root: plan.power_profile_root,
      resource_budget_root: plan.resource_budget_root,
      power_mode: plan.power_mode,
      load_shedding_level: plan.load_shedding_level,
      decision_count: plan.decisions.length,
      action_counts: countBy(plan.decisions, 'action')
    },
    standard: {
      selection_root: standardSelection.selection_root,
      scene_root: standardScene.scene_root,
      frame_root: standardFrame.frameRoot,
      pixel_root: standardRendered.pixelRoot,
      selected_quality_profiles: countBy(standardSelection.selections, 'selected_quality_profile')
    },
    power_lowered: {
      selection_root: loweredSelection.selection_root,
      scene_root: loweredScene.scene_root,
      frame_root: loweredFrame.frameRoot,
      pixel_root: loweredRendered.pixelRoot,
      selected_quality_profiles: countBy(loweredSelection.selections, 'selected_quality_profile'),
      power_downgrade_count: loweredSelection.power_downgrade_count,
      unbound_governor_chunk_ids: loweredSelection.unbound_governor_chunk_ids
    },
    authority: {
      canonical_owner: 'RNCS',
      representation_owner: 'URRF',
      execution_owner: 'VSR',
      governor_candidate_only: plan.candidate_only,
      selection_candidate_only: loweredSelection.candidate_only,
      canonical_write_authorized: false,
      canonical_state_mutated: false
    },
    notes: 'Candidate-only local Power Plane lowering: a verified RNCS Resource Governor plan binds explicit visual chunk demands and maps pressure actions to the URRF PROXY minimum-reality slot. The VSR CPU-reference frames show a deterministic standard-versus-proxy difference; this does not prove real GPU/VRAM telemetry, offload execution, frequency control, CDN delivery, production-scale throughput, or AAA visual quality.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'large-world-power-lowering-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-power-lowering-standard.png'), standardRendered.png);
  writeFileSync(join(outputDir, 'large-world-power-lowering-proxy.png'), loweredRendered.png);
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'large-world-power-lowering-report.json')).byteLength > 1000);
  assert.ok(readFileSync(join(outputDir, 'large-world-power-lowering-standard.png')).byteLength > 1000);
  assert.ok(readFileSync(join(outputDir, 'large-world-power-lowering-proxy.png')).byteLength > 1000);
});
