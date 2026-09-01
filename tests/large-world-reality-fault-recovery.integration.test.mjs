import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash, worldStateRoot} from '@taowind/rncs-core-contract';
import {
  LargeWorldRuntime,
  verifyLargeWorldMinimumRealityRecovery,
  verifyLargeWorldSpatialScene,
  verifyPortfolioSelectionEnvelope
} from '@taowind/large-world-runtime';
import {compileSpatialFrame, renderSpatialReference, verifySpatialFrame} from '@taowind/visual-state-runtime/spatial-reality-3d';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_REALITY_FAULT_RECOVERY_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_REALITY_FAULT_RECOVERY'));

function countBy(values, field) {
  return Object.fromEntries([...new Set(values.map(value => value[field]))].sort().map(key => [key, values.filter(value => value[field] === key).length]));
}

test('executes fault-aware minimum reality recovery into a deterministic VSR frame', () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-reality-fault-recovery',
    seed: 'seed:urrf-reality-fault-recovery',
    width: 5,
    depth: 5,
    chunkSize: 64,
    sampleResolution: 8,
    loadRadius: 1,
    unloadRadius: 1,
    maxActiveChunks: 9,
    nodeId: 'node:urrf-reality-fault-recovery'
  });
  const canonicalStateRoot = worldStateRoot(runtime.canonicalState);
  const worldRoot = runtime.getRegion().world_root;
  const fault = runtime.registerRealityFault({
    fault_id: 'fault:provider-gpu',
    fault_kind: 'PROVIDER_CRASH',
    severity: 92,
    affected_resources: ['GPU', 'NETWORK'],
    reason: 'visual provider unavailable; retain minimum reality'
  });
  const recovery = runtime.recoverMinimumReality({
    faults: [fault],
    power_profile: {
      power_state: 'BATTERY',
      grid_connected: false,
      battery_percent: 3,
      thermal_celsius_milli: 90000
    },
    resource_budget: {
      capacities: {CPU: 500, RAM: 500, ENERGY: 200},
      used: {CPU: 20, RAM: 20, ENERGY: 10}
    },
    required_layers: ['WORLD_PROXY', 'COLLISION', 'SEMANTIC'],
    available_layers: ['WORLD_PROXY'],
    position: {x: 0, z: 0},
    scene: {
      scene_id: 'urrf-large-world-reality-fault-recovery-v01',
      camera: {translation: [32, 14, 78], rotationEulerDeg: [-18, 0, 0]}
    }
  });
  assert.equal(verifyLargeWorldMinimumRealityRecovery(recovery).valid, true);
  assert.equal(verifyLargeWorldSpatialScene(recovery.scene).valid, true);
  assert.equal(verifyPortfolioSelectionEnvelope(recovery.selection).valid, true);
  assert.equal(recovery.recovery_status, 'RECOVERING');
  assert.equal(recovery.load_shedding_plan.power_mode, 'SURVIVAL');
  assert.equal(recovery.load_shedding_plan.load_shedding_level, 'SURVIVAL');
  assert.equal(recovery.selection.selections.every(row => row.selected_quality_profile === 'PROXY'), true);
  assert.equal(recovery.canonical_state_root, canonicalStateRoot);
  assert.equal(runtime.getRegion().world_root, worldRoot);
  assert.equal(worldStateRoot(runtime.canonicalState), canonicalStateRoot);

  const frame = compileSpatialFrame(recovery.scene, {width: 320, height: 180, enableShadows: false});
  const rendered = renderSpatialReference(recovery.scene, {width: 320, height: 180, enableShadows: false});
  assert.equal(verifySpatialFrame(frame).ok, true);
  assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);
  assert.match(frame.frameRoot, /^[a-f0-9]{64}$/);
  assert.match(rendered.pixelRoot, /^[a-f0-9]{64}$/);

  const reportBase = {
    format: 'urrf.large-world-reality-fault-recovery-report.v0.1',
    evidence_level: 'LOCAL_RUNTIME_AND_CONTRACT_TEST',
    world_id: runtime.options.worldId,
    node_id: runtime.nodeId,
    region_root: runtime.getRegion().region_root,
    world_root: worldRoot,
    canonical_state_root: canonicalStateRoot,
    recovery_root: recovery.recovery_root,
    fault_root: fault.fault_root,
    minimum_reality_root: recovery.minimum_reality.minimum_reality_root,
    load_shedding_plan_root: recovery.load_shedding_plan.plan_root,
    selection_root: recovery.selection.selection_root,
    scene_root: recovery.scene.scene_root,
    frame_root: frame.frameRoot,
    pixel_root: rendered.pixelRoot,
    recovery_status: recovery.recovery_status,
    power_mode: recovery.load_shedding_plan.power_mode,
    load_shedding_level: recovery.load_shedding_plan.load_shedding_level,
    active_chunk_count: recovery.active_chunk_ids.length,
    selected_quality_profiles: countBy(recovery.selection.selections, 'selected_quality_profile'),
    power_action_counts: countBy(recovery.load_shedding_plan.decisions, 'action'),
    canonical_world_root_unchanged: runtime.getRegion().world_root === worldRoot,
    canonical_state_root_unchanged: worldStateRoot(runtime.canonicalState) === canonicalStateRoot,
    authority: {
      canonical_owner: 'RNCS',
      representation_owner: 'URRF',
      execution_owner: 'VSR',
      provider_can_write_authoritative_world_state: false,
      canonical_write_authorized: false,
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    },
    notes: 'Candidate-only local recovery: a verified RNCS RealityFault, MinimumViableReality, Resource Governor plan, URRF proxy selection, and VSR CPU-reference frame share rooted evidence. This proves contract/runtime/frame behavior only; it does not prove distributed failover, physical power or thermal telemetry, provider restart, GPU execution, network delivery, production throughput, or AAA visual quality.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'reality-fault-recovery-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'reality-fault-recovery-proxy.png'), rendered.png);
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'reality-fault-recovery-report.json')).byteLength > 1200);
  assert.ok(readFileSync(join(outputDir, 'reality-fault-recovery-proxy.png')).byteLength > 1000);
});
