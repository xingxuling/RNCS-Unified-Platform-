import assert from 'node:assert/strict';
import test from 'node:test';
import {worldStateRoot} from '@taowind/rncs-core-contract';
import {
  LargeWorldRuntime,
  verifyLargeWorldMinimumRealityRecovery,
  verifyLargeWorldSpatialScene,
  verifyPortfolioSelectionEnvelope
} from '../src/index.mjs';

const options = {
  worldId: 'world:reality-fault-recovery',
  seed: 'seed:reality-fault-recovery',
  width: 5,
  depth: 5,
  chunkSize: 64,
  sampleResolution: 8,
  loadRadius: 1,
  unloadRadius: 1,
  maxActiveChunks: 9,
  nodeId: 'node:reality-fault-recovery'
};

test('recovers a minimum viable reality under fault and power pressure without mutating world truth', () => {
  const runtime = new LargeWorldRuntime(options);
  const canonicalStateRoot = worldStateRoot(runtime.canonicalState);
  const worldRoot = runtime.getRegion().world_root;
  const fault = runtime.registerRealityFault({
    fault_id: 'fault:gpu-memory',
    fault_kind: 'GPU_MEMORY_PRESSURE',
    severity: 90,
    affected_resources: ['GPU', 'VRAM'],
    reason: 'GPU residency pressure requires proxy lowering'
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
    position: {x: 0, z: 0}
  });

  assert.equal(verifyLargeWorldMinimumRealityRecovery(recovery).valid, true);
  assert.equal(verifyLargeWorldSpatialScene(recovery.scene).valid, true);
  assert.equal(verifyPortfolioSelectionEnvelope(recovery.selection).valid, true);
  assert.equal(recovery.recovery_status, 'RECOVERING');
  assert.equal(recovery.load_shedding_plan.power_mode, 'SURVIVAL');
  assert.equal(recovery.load_shedding_plan.load_shedding_level, 'SURVIVAL');
  assert.deepEqual(recovery.fault_roots, [fault.fault_root]);
  assert.equal(recovery.selection.selections.every(row => row.selected_quality_profile === 'PROXY'), true);
  assert.equal(recovery.canonical_state_root, canonicalStateRoot);
  assert.equal(runtime.getRegion().world_root, worldRoot);
  assert.equal(worldStateRoot(runtime.canonicalState), canonicalStateRoot);
  assert.equal(runtime.getMinimumReality().minimum_reality_root, recovery.minimum_reality.minimum_reality_root);

  const tampered = structuredClone(recovery);
  tampered.recovery_root = '0'.repeat(64);
  assert.equal(verifyLargeWorldMinimumRealityRecovery(tampered).valid, false);

  const recoveredFault = runtime.clearRealityFault(fault.fault_id, 31);
  assert.equal(recoveredFault.status, 'RECOVERED');
  const ready = runtime.recoverMinimumReality({faults: [], position: {x: 0, z: 0}});
  assert.equal(verifyLargeWorldMinimumRealityRecovery(ready).valid, true);
  assert.equal(ready.recovery_status, 'READY');
  assert.equal(ready.fault_roots.length, 0);
  assert.equal(ready.load_shedding_plan.power_mode, 'CONSTRAINED');
  assert.equal(ready.selection.selections.every(row => row.selected_quality_profile === 'PROXY'), true);
  assert.equal(worldStateRoot(runtime.canonicalState), canonicalStateRoot);
});

test('rejects stale canonical roots and cross-node fault inputs', () => {
  const runtime = new LargeWorldRuntime(options);
  assert.throws(
    () => runtime.createMinimumViableReality({canonical_state_root: '0'.repeat(64)}),
    /LARGE_WORLD_MINIMUM_REALITY_CANONICAL_ROOT_STALE/
  );
  assert.throws(
    () => runtime.registerRealityFault({fault_id: 'fault:other-node', node_id: 'node:other', fault_kind: 'NODE_CRASH', reason: 'foreign'}),
    /LARGE_WORLD_REALITY_FAULT_NODE_ID_MISMATCH/
  );
  assert.throws(
    () => runtime.recoverMinimumReality({resource_budget: {node_id: 'node:other'}}),
    /LARGE_WORLD_MINIMUM_REALITY_RESOURCE_BUDGET_NODE_ID_MISMATCH/
  );
});

console.log('reality fault recovery tests: 2 PASS');
