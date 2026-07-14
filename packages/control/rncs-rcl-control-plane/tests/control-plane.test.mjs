import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildRclControlPlane,
  compileRclSource,
  compileRclAuthorityPlan,
  compileControlPlaneEdge,
  CONTROL_PLANE_EDGES,
  verifyLegacyManifestParity,
  replayCompiledControlPlane,
  compileRuntimeBundle,
  replayRuntimeBundle,
  createEmbeddedRuntimeBundle,
} from '../src/index.mjs';

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(packageRoot, '../../..');

test('RCL-native RNCS control plane compiles twelve semantic modules through eleven verified edges', () => {
  const result = buildRclControlPlane();
  assert.equal(Object.keys(result.modules).length, 12);
  assert.equal(result.edges.length, 11);
  assert.equal(result.allReady, true);
  assert.equal(result.allDeterministic, true);
  assert.equal(result.allReferenceParity, true);
  assert.equal(result.modules.core.id, 'rncs-core');
  assert.equal(result.modules.cnp.id, 'cnp');
  assert.equal(result.modules.laf.id, 'laf');
  assert.equal(result.modules.hnac.id, '@taowind/hnaf-hnac-host');
  assert.equal(result.modules.gateway.id, 'gateway');
  assert.equal(result.modules.aether_earth.id, 'aether-earth-runtime');
});

test('each RCL control-plane edge is exact Stage-5 RBC and executes in native VM', () => {
  for (const [from, to] of CONTROL_PLANE_EDGES) {
    const edge = compileControlPlaneEdge(from, to);
    assert.equal(edge.deterministic, true);
    assert.equal(edge.referenceParity, true);
    assert.equal(edge.moduleState[`${to}::module.ready`], true);
    assert.match(edge.compilerVm, /0\.6\.0-alpha\.1/);
  }
});

test('RCL module ids and versions preserve parity with existing RNCS manifests', () => {
  const result = verifyLegacyManifestParity(repoRoot);
  assert.equal(result.passed, true, JSON.stringify(result.checks, null, 2));
});

test('compiled RCL control-plane edges replay without the compiler and preserve state', () => {
  const result = buildRclControlPlane();
  const replay = replayCompiledControlPlane(result.compiledEdges);
  assert.equal(replay.edgeCount, 11);
  assert.equal(replay.finalState['cnp::module.ready'], true);
  assert.equal(replay.finalState['core::contract.evidence'], true);
});

test('RCL control-plane state root is deterministic', () => {
  const first = buildRclControlPlane();
  const second = buildRclControlPlane();
  assert.equal(first.stateRoot, second.stateRoot);
  assert.deepEqual(first.edges, second.edges);
});


test('AOT RCL control-plane bundle executes all twelve readiness contracts in one native VM process', () => {
  const bundle = compileRuntimeBundle();
  assert.equal(bundle.deterministic, true);
  assert.equal(bundle.referenceParity, true);
  const run = replayRuntimeBundle(bundle);
  assert.equal(run.state['rncs::core.ready'], true);
  assert.equal(run.state['rncs::rfe.ready'], true);
  assert.equal(run.state['rncs::aaf.ready'], true);
  assert.equal(run.state['rncs::branch.ready'], true);
  assert.equal(run.state['rncs::behavior.ready'], true);
  assert.equal(run.state['rncs::icar.ready'], true);
  assert.equal(run.state['rncs::cnp.ready'], true);
  assert.equal(run.state['rncs::laf.ready'], true);
  assert.equal(run.state['rncs::hnac.ready'], true);
  assert.equal(run.state['rncs::runtime_registry.ready'], true);
  assert.equal(run.state['rncs::gateway.ready'], true);
  assert.equal(run.state['rncs::aether_earth.ready'], true);
  assert.equal(run.state['rncs::control.long_lived_vm'], true);
  assert.equal(run.state['rncs::control.authoritative'], true);
});

test('current RCL source compiles and executes through the RNCS control-plane bridge', async () => {
  const result = await compileRclSource(`reality RncsNativeBridge {
    facet world.ready : Truth = true
    facet world.value : Number = 7
  }`);
  assert.equal(result.format, 'rncs.rcl-native-execution.v0.1');
  assert.equal(result.parity.ok, true);
  assert.equal(result.native.state['world.ready'], true);
  assert.equal(result.native.state['world.value'], 7);
  assert.ok(result.byteLength > 36);
  assert.ok(result.instructionCount > 0);
});

test('RCL native state compiles into an RNCS authority plan without authority metadata writes', async () => {
  const result = await compileRclAuthorityPlan(`reality RncsAuthoritySource {
    facet rncs.world.world_id : Text = "world:aether-island"
    facet rncs.world.title : Text = "RCL authoritative title"
    facet rncs.world.rcl_marker : Truth = true
  }`);
  assert.equal(result.format, 'rncs.rcl-authority-plan.v0.1');
  assert.equal(result.execution.parity.ok, true);
  assert.deepEqual(result.changes.map(change => change.path), ['world.rcl_marker', 'world.title', 'world.world_id']);
  assert.ok(result.plan.authority_requirements.some(item => item.action === 'merge_candidate_branch'));
  assert.ok(!result.changes.some(change => /authority|generation|revision|state_root|evidence_root/i.test(change.path)));
});

test('RCL native object and behavior facets lower into RNCS semantic collections', async () => {
  const result = await compileRclAuthorityPlan(`reality RncsObjectAuthority {
    facet rncs.world.world_id : Text = "world:rcl-object"
    facet rncs.world.object.island.id : Text = "island:rcl"
    facet rncs.world.object.island.kind : Text = "island"
    facet rncs.world.object.island.position.x : Number = 0
    facet rncs.world.object.island.position.y : Number = -500
    facet rncs.world.object.island.position.z : Number = 0
    facet rncs.world.object.island.physical.body : Text = "static"
    facet rncs.world.object.island.physical.halfExtents.x : Number = 100
    facet rncs.world.object.island.physical.halfExtents.y : Number = 10
    facet rncs.world.object.island.physical.halfExtents.z : Number = 100
    facet rncs.world.behavior.sensor.id : Text = "behavior:rcl-sensor"
    facet rncs.world.behavior.sensor.version : Text = "1.0.0"
    facet rncs.world.behavior.sensor.enabled : Truth = true
  }`);
  assert.equal(result.execution.parity.ok, true);
  assert.equal(result.plan.artifacts[0].definition.physical.halfExtents.x, 100);
  assert.equal(result.plan.behaviors[0].behavior_id, 'behavior:rcl-sensor');
  assert.deepEqual(result.changes.map(change => change.path), ['world.behaviors', 'world.objects', 'world.world_id']);
  assert.ok(result.plan.authority_requirements.some(item => item.action === 'modify_object_property'));
  assert.ok(result.plan.authority_requirements.some(item => item.action === 'register_behavior'));
});

test('RCL native change facets lower into ordered RNCS candidate operations', async () => {
  const result = await compileRclAuthorityPlan(`reality RncsOperationAuthority {
    facet rncs.world.world_id : Text = "world:rcl-operations"
    facet rncs.world.change.title.op : Text = "set"
    facet rncs.world.change.title.path : Text = "world.title"
    facet rncs.world.change.title.value : Text = "operation title"
    facet rncs.world.change.count.op : Text = "increment"
    facet rncs.world.change.count.path : Text = "world.count"
    facet rncs.world.change.count.value : Number = 2
    facet rncs.world.change.tag.op : Text = "append"
    facet rncs.world.change.tag.path : Text = "world.tags"
    facet rncs.world.change.tag.value : Text = "rcl"
    facet rncs.world.change.old.op : Text = "remove"
    facet rncs.world.change.old.path : Text = "world.old"
  }
  `);
  assert.equal(result.execution.parity.ok, true);
  assert.deepEqual(result.operations.map(operation => operation.op), ['increment', 'remove', 'append', 'set']);
  assert.deepEqual(result.operations.map(operation => operation.path), ['world.count', 'world.old', 'world.tags', 'world.title']);
  assert.equal(result.operations[0].operation_id, 'rcl-change:count');
  assert.ok(result.plan.authority_requirements.some(item => item.action === 'merge_candidate_branch'));
});


test('embedded AOT control plane reuses one long-lived native VM process', async () => {
  const bundle = compileRuntimeBundle();
  const vm = createEmbeddedRuntimeBundle(bundle);
  await vm.ready;
  const pid = vm.process.pid;
  const first = await vm.run({ resetState: true });
  const second = await vm.run();
  assert.equal(vm.process.pid, pid);
  assert.equal(first.result.state['rncs::gateway.ready'], true);
  assert.equal(second.result.state['rncs::control.provider_abi'], true);
  assert.ok(second.daemonElapsedMs < 10);
  await vm.close();
});
