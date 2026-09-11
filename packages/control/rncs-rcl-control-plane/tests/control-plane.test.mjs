import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildRclControlPlane,
  compileRclSource,
  compileRclTypedCandidate,
  verifyRclTypedCandidate,
  compileRclAuthorityPlan,
  compileControlPlaneEdge,
  CONTROL_PLANE_EDGES,
  verifyLegacyManifestParity,
  replayCompiledControlPlane,
  compileRuntimeBundle,
  replayRuntimeBundle,
  createEmbeddedRuntimeBundle,
  RCL_PHYSICAL_COMMAND_PROFILE_ROOT,
  rclSpatialCommandPlanRoot,
  verifyRclPhysicalCommandProfile,
  verifyRclSpatialCommandPlan,
} from '../src/index.mjs';

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(packageRoot, '../../..');
const COGNITION_SOURCE = `reality RncsCognitionAuthority {
  facet rncs.world.world_id : Text = "world:rcl-cognition"
  facet rncs.world.confidence : Number = 0.97
  facet greenhouse.light : Truth = false
  facet greenhouse.safe : Truth = true

  subject caretaker {
    facet actions : Number = 0
    warrant greenhouse.control on greenhouse
  }

  knowledge mind {
    claim operation_safe : Truth = greenhouse.safe
      confidence 0.99
      evidence "policy:greenhouse-safe"
      source "runtime:safety-state"
      scope "greenhouse"
      status observed
    preserve supported(mind.operation_safe, 0.95)
  }

  language command {
    utterance request = "open greenhouse light"
      speaker "operator"
      locale "en-US"
      channel "text"
      evidence "input:user-request"

    intent activate_light
      when contains(utterance_text(command.request), "open") and contains(utterance_text(command.request), "light")
      action "activate"
      target "greenhouse.light"
      confidence 0.97
      evidence "grammar:open-light"
      from command.request
      slot device = "light"

    preserve intent_confidence(command.activate_light) >= 0.90
  }

  understanding situation {
    hypothesis authorized_request : Truth =
      intent_matches(command.activate_light, "activate", "greenhouse.light") and knowledge_value(mind.operation_safe)
      confidence 0.96
      explanation "The request is safe and targets the greenhouse light."
      evidence "model:command-plus-safety"
      from command.activate_light, mind.operation_safe
      coverage 1.0
      coherence 0.98
    preserve understood(situation.authorized_request, 0.90)
  }

  creation solutions {
    candidate activate : Text = "activate"
      when understanding_value(situation.authorized_request)
      target "greenhouse.light"
      novelty 0.30
      utility 0.98
      feasibility 0.99
      risk 0.02
      evidence "strategy:direct-safe-action"
      based_on situation.authorized_request

    candidate clarify : Text = "ask-for-clarification"
      when true
      target "operator"
      novelty 0.20
      utility 0.25
      feasibility 1.0
      risk 0.01
      evidence "strategy:conservative-fallback"
      based_on command.activate_light

    select chosen from activate, clarify
    preserve creation_score(solutions.chosen) >= 0.80
  }

  learn mind
  interpret command
  understand situation
  create solutions
}`;

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
  assert.equal(result.format, 'rncs.rcl-native-execution.v0.2');
  assert.equal(result.compiler.kind, 'rcl-native-selfhost');
  assert.equal(result.compiler.artifact, 'selfhost/compiler.rbc');
  assert.match(result.compiler.artifactHash, /^[0-9a-f]{64}$/);
  assert.equal(result.compilerParity.ok, true);
  assert.equal(result.parity.ok, true);
  assert.match(result.native.nativeStateRoot, /^[0-9a-f]{64}$/);
  assert.equal(result.native.stateRoot, result.native.nativeStateRoot);
  assert.equal(result.native.stateRootVerified, true);
  assert.equal(result.native.state['world.ready'], true);
  assert.equal(result.native.state['world.value'], 7);
  assert.ok(result.byteLength > 36);
  assert.ok(result.instructionCount > 0);
});

test('typed RCL candidate keeps the typed link rooted without entering native authority compilation', async () => {
  const typeModuleSources = {
    'core.rcltype': `module core
export record SpatialCommand<T> {
  id: Text
  payload: T
}`,
  };
  const source = `reality TypedCandidate {
    facet rncs.world.ready : Truth = true
    facet app.command : core.SpatialCommand<Text> = { id: "command-1", payload: "patch-heightfield" }
  }`;
  const candidate = await compileRclTypedCandidate(source, { typeModuleSources });
  assert.equal(candidate.format, 'rncs.rcl-typed-native-candidate.v0.1');
  assert.equal(candidate.status, 'CANDIDATE_EXECUTION_VERIFIED');
  assert.equal(candidate.authority.native_authority_plan, 'NOT_COMPILED_BY_TYPED_LINK');
  assert.equal(candidate.authority.candidate_only, true);
  assert.equal(candidate.authority.canonical_write_authorized, false);
  assert.equal(candidate.source.type_module_root, candidate.typed_link.type_modules.ir_root);
  assert.equal(candidate.roots.typed_link_root, candidate.typed_link.link_root);
  assert.deepEqual(verifyRclTypedCandidate(candidate, { source }), { ok: true, errors: [] });

  const tampered = structuredClone(candidate);
  tampered.roots.native_state_root = '0'.repeat(64);
  assert.ok(verifyRclTypedCandidate(tampered, { source }).errors.includes('RCL_TYPED_CANDIDATE_ROOT_MISMATCH'));
});

test('Energy authority state passes semantic native parity through the RNCS compiler', async () => {
  const result = await compileRclSource(`reality RncsNativeEnergy {
    energy grid {
      reservoir source : Energy = joules(100)
      reservoir load : Energy = joules(0)
      flow charge from source to load amount joules(40) efficiency 0.9 evidence "meter"
      preserve grid.source >= joules(0)
      witness "rcl:energy"
    }
    energize grid
  }`);
  assert.equal(result.compiler.kind, 'rcl-native-selfhost');
  assert.equal(result.compilerParity.ok, true);
  assert.equal(result.parity.ok, true);
  assert.equal(result.native.state['grid.source'].value, 60);
  assert.equal(result.native.state['grid.load'].value, 36);
});

test('Energy domain state becomes an RNCS authority change with provenance', async () => {
  const result = await compileRclAuthorityPlan(`reality RncsEnergyAuthority {
    facet rncs.world.world_id : Text = "world:rcl-energy"
    energy grid {
      reservoir source : Energy = joules(100)
      reservoir load : Energy = joules(0)
      flow charge from source to load amount joules(40) efficiency 0.9 evidence "meter"
      preserve grid.source >= joules(0)
      witness "rcl:energy"
    }
    energize grid
  }`);
  const domainChange = result.changes.find(change => change.path === 'world.rcl.state');
  assert.ok(domainChange);
  assert.equal(domainChange.value['grid.source'].value, 60);
  assert.equal(domainChange.value['grid.load'].value, 36);
  assert.match(result.domainStateRoot, /^[0-9a-f]{64}$/);
  assert.equal(result.plan.source.rcl_native_state_root, result.execution.native.nativeStateRoot);
  assert.ok(result.plan.evidence_requirements.some(item => item.kind === 'rcl-native-authority-state' && item.root === result.execution.native.nativeStateRoot && item.verified === true));
  assert.equal(result.plan.source.rcl_domain_state_root, result.domainStateRoot);
  assert.equal(result.plan.evidence_requirements.some(item => item.kind === 'rcl-native-domain-state' && item.root === result.domainStateRoot), true);
  assert.ok(result.plan.authority_requirements.some(item => item.action === 'commit_rcl_domain_state' && item.scope === 'world.rcl.write'));
});

test('Cognition and creation state pass native parity through the RNCS compiler', async () => {
  const result = await compileRclSource(COGNITION_SOURCE);
  assert.equal(result.compiler.kind, 'rcl-native-selfhost');
  assert.equal(result.compilerParity.ok, true);
  assert.equal(result.parity.ok, true);
  assert.equal(result.parity.checks.rawRoots, true);
  assert.deepEqual(result.native.state['command.activate_light'].slots, { device: 'light' });
  assert.equal(result.native.state['solutions.chosen'].status, 'selected');
});

test('Cognition state becomes an RNCS authority change with native evidence', async () => {
  const result = await compileRclAuthorityPlan(COGNITION_SOURCE);
  const domainChange = result.changes.find(change => change.path === 'world.rcl.state');
  assert.ok(domainChange);
  assert.deepEqual(domainChange.value['command.activate_light'].slots, { device: 'light' });
  assert.equal(domainChange.value['command.activate_light'].confidence, '0.97');
  assert.equal(domainChange.value['solutions.chosen'].status, 'selected');
  assert.equal(result.changes.find(change => change.path === 'world.confidence')?.value, '0.97');
  assert.match(result.domainStateRoot, /^[0-9a-f]{64}$/);
  assert.equal(result.knowledgeGraph.format, 'rcl.knowledge-authority-graph.v0.1');
  assert.equal(result.knowledgeGraph.claims.length, 1);
  assert.equal(result.knowledgeGraph.claims[0].path, 'mind.operation_safe');
  assert.equal(result.knowledgeGraph.claims[0].evidence[0], 'policy:greenhouse-safe');
  assert.equal(result.knowledgeGraph.evidence_nodes[0].kind, 'rcl-evidence-reference');
  assert.match(result.knowledgeGraph.root, /^[0-9a-f]{64}$/);
  assert.equal(result.plan.source.rcl_knowledge_graph_root, result.knowledgeGraph.root);
  assert.ok(result.plan.authority_requirements.some(item => item.action === 'commit_rcl_knowledge' && item.scope === 'world.rcl.knowledge.write'));
  assert.ok(result.plan.evidence_requirements.some(item => item.kind === 'rcl-native-knowledge-graph' && item.root === result.knowledgeGraph.root));
  assert.equal(result.plan.source.rcl_domain_state_root, result.domainStateRoot);
  assert.ok(result.plan.evidence_requirements.some(item => item.kind === 'rcl-native-domain-state' && item.root === result.domainStateRoot));
  assert.ok(result.plan.authority_requirements.some(item => item.action === 'commit_rcl_domain_state' && item.scope === 'world.rcl.write'));
  assert.equal(result.authorityEvidence.format, 'rcl.native-authority-evidence.v0.1');
  assert.match(result.authorityEvidence.root, /^[0-9a-f]{64}$/);
  assert.equal(result.plan.source.rcl_authority_evidence_root, result.authorityEvidence.root);
  assert.ok(result.plan.authority_requirements.some(item => item.action === 'authorize_rcl_transition' && item.scope === 'world.rcl.authority'));
  assert.ok(result.plan.acceptance_rules.some(item => item.rule === 'rcl-authority-continuity-bound'));
  assert.ok(result.authorityEvidence.transitions.length >= 4);
  assert.ok(result.authorityEvidence.transitions.every(item => item.subject?.subject_id && Array.isArray(item.capability_plan?.required_scopes)));
});

test('RCL native state compiles into an RNCS authority plan without authority metadata writes', async () => {
  const result = await compileRclAuthorityPlan(`reality RncsAuthoritySource {
    facet rncs.world.world_id : Text = "world:aether-island"
    facet rncs.world.title : Text = "RCL authoritative title"
    facet rncs.world.rcl_marker : Truth = true
  }`);
  assert.equal(result.format, 'rncs.rcl-authority-plan.v0.1');
  assert.equal(result.execution.parity.ok, true);
  assert.equal(result.plan.source.compiler.kind, 'rcl-native-selfhost');
  assert.equal(result.plan.source.compiler_parity.ok, true);
  assert.equal(result.plan.evidence_requirements[0].kind, 'rcl-native-selfhost-compiler');
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

test('RCL native spatial command facets lower into a rooted RSR command plan', async () => {
  const result = await compileRclAuthorityPlan(`reality RncsSpatialCommandAuthority {
    facet rncs.world.world_id : Text = "world:rcl-terrain"
    facet rncs.spatial.command.raise.type : Text = "patch-heightfield"
    facet rncs.spatial.command.raise.id : Text = "command:rcl-raise"
    facet rncs.spatial.command.raise.tick : Number = 1
    facet rncs.spatial.command.raise.body_id : Text = "terrain"
    facet rncs.spatial.command.raise.fixture_id : Text = "terrain:heightfield"
    facet rncs.spatial.command.raise.indices : Sequence = sequence_append(empty_sequence(), 4)
    facet rncs.spatial.command.raise.heights : Sequence = sequence_append(empty_sequence(), 600)
  }`);
  assert.equal(result.execution.parity.ok, true);
  assert.equal(result.spatialCommandPlan.format, 'rncs.rcl-spatial-command-plan.v0.1');
  assert.equal(result.spatialCommandPlan.commands.length, 1);
  assert.deepEqual(result.spatialCommandPlan.commands[0], {
    id: 'command:rcl-raise',
    tick: 1,
    type: 'patch-heightfield',
    bodyId: 'terrain',
    fixtureId: 'terrain:heightfield',
    samples: [{ index: 4, height: 600 }],
  });
  assert.equal(result.spatialCommandPlan.root, rclSpatialCommandPlanRoot(result.spatialCommandPlan.commands));
  assert.equal(verifyRclSpatialCommandPlan(result.spatialCommandPlan), true);
  assert.equal(result.physicalCommandProfile.root, RCL_PHYSICAL_COMMAND_PROFILE_ROOT);
  assert.equal(verifyRclPhysicalCommandProfile(result.physicalCommandProfile), true);
  assert.equal(result.plan.source.rcl_spatial_command_plan_root, result.spatialCommandPlan.root);
  assert.equal(result.plan.source.rcl_physical_command_profile_root, result.physicalCommandProfile.root);
  assert.equal(result.plan.simulation_requirements.find(item => item.runtime === 'rncs.rsr').spatial_command_plan_root, result.spatialCommandPlan.root);
  assert.ok(result.plan.authority_requirements.some(item => item.action === 'simulate_spatial_candidate' && item.scope === 'rncs.rsr.simulate'));
  assert.ok(result.plan.evidence_requirements.some(item => item.kind === 'rcl-spatial-command-plan' && item.root === result.spatialCommandPlan.root));
});

test('RCL physical command profile covers correction and replay velocity commands', async () => {
  const result = await compileRclAuthorityPlan(`reality RclPhysicalCorrection {
    facet rncs.world.world_id : Text = "world:rcl-correction"
    facet rncs.spatial.command.correct.type : Text = "set-velocity"
    facet rncs.spatial.command.correct.id : Text = "command:rcl-correction"
    facet rncs.spatial.command.correct.tick : Number = 3
    facet rncs.spatial.command.correct.body_id : Text = "avatar"
    facet rncs.spatial.command.correct.velocity_x : Number = 120
    facet rncs.spatial.command.correct.velocity_y : Number = 0
    facet rncs.spatial.command.correct.velocity_z : Number = -40
  }`);
  assert.deepEqual(result.spatialCommandPlan.commands, [{
    id: 'command:rcl-correction',
    tick: 3,
    type: 'set-velocity',
    bodyId: 'avatar',
    velocity: { x: 120, y: 0, z: -40 },
  }]);
  assert.deepEqual(result.physicalCommandProfile.command_families.find(family => family.id === 'correction-replay')?.command_types, ['set-velocity']);
  assert.equal(result.plan.simulation_requirements.find(item => item.runtime === 'rncs.rsr').physical_command_profile_root, result.physicalCommandProfile.root);
});

test('RCL spatial command lowering fails closed on mismatched sample vectors', async () => {
  await assert.rejects(
    () => compileRclAuthorityPlan(`reality InvalidRclSpatialCommand {
      facet rncs.world.world_id : Text = "world:rcl-terrain-invalid"
      facet rncs.spatial.command.bad.type : Text = "patch-heightfield"
      facet rncs.spatial.command.bad.id : Text = "command:rcl-invalid"
      facet rncs.spatial.command.bad.tick : Number = 1
      facet rncs.spatial.command.bad.body_id : Text = "terrain"
      facet rncs.spatial.command.bad.fixture_id : Text = "terrain:heightfield"
      facet rncs.spatial.command.bad.indices : Sequence = sequence_append(empty_sequence(), 4)
      facet rncs.spatial.command.bad.heights : Sequence = empty_sequence()
    }`),
    error => error.message === 'RCL_RNCS_SPATIAL_COMMAND_SAMPLES_INVALID:bad',
  );
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
