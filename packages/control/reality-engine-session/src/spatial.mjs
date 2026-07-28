import {
  rootHash,
} from '@taowind/rncs-core-contract';
import {
  SpatialEmbodimentWorld,
  spatialEmbodimentSnapshotToCausalDelta,
  verifySpatialEmbodimentSnapshot,
} from '@taowind/reality-simulation-runtime/spatial-embodiment';
import {
  createAuthoritativeStateFrame,
  verifyAuthoritativeStateFrame,
} from '@taowind/reality-simulation-runtime/network-reconciliation';
import {
  spatialEmbodimentSceneRoot,
  spatialEmbodimentSnapshotToVSRScene,
} from '@taowind/reality-simulation-runtime/spatial-embodiment-vsr';
import {
  compileSpatialFrame,
  verifySpatialFrame,
} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {
  networkPacketToTemporalState,
  verifyTemporalStatePacket,
} from '@taowind/visual-state-runtime/temporal-presentation';
import {
  createEngineProposalInput,
  RealityEngineSession,
  RealityEngineSessionError,
  verifyEngineSessionSnapshot,
  ZERO_ROOT,
} from './index.mjs';
import { createSpatialReplayBundle } from './spatial-replay.mjs';
import {
  createRealityRuntimeBinding,
  verifyRealityRuntimeBinding,
} from './runtime-binding.mjs';

export const SPATIAL_ENGINE_SESSION_FORMAT = 'rncs.spatial-engine-session.v0.1';
export const SPATIAL_ENGINE_SIMULATION_FORMAT = 'rncs.spatial-engine-simulation.v0.1';

const clone = value => value === undefined ? undefined : structuredClone(value);
const isRoot = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const requireCondition = (condition, code, details = null) => {
  if (!condition) throw new SpatialEngineSessionError(code, code, details);
};

export class SpatialEngineSessionError extends RealityEngineSessionError {
  constructor(code, message = code, details = null) {
    super(code, message, details);
    this.name = 'SpatialEngineSessionError';
  }
}

function rootOrHash(value, fallback) {
  return isRoot(value) ? value : rootHash(value ?? fallback);
}

function rncsSpatialStateRoot(snapshot) {
  return rootHash({
    format: 'rncs.rsr-spatial-state-root.v0.1',
    worldId: snapshot.worldId,
    tick: snapshot.tick,
    rsrStateRoot: snapshot.stateRoot,
  });
}

function commandRoot(commands) {
  return rootHash(commands.map(command => clone(command)));
}

function compactResourceReceipt(resource) {
  if (!resource) return null;
  const wal = resource.wal ?? resource;
  const succeeded = wal.succeeded ?? null;
  const checkpoint = wal.checkpoint ?? null;
  return {
    format: 'rcl.resource-wal.receipt-ref.v0.1',
    operation: resource.operation ?? null,
    succeeded_root: succeeded?.root ?? null,
    checkpoint_root: checkpoint?.root ?? null,
    wal_path: resource.walPath ?? null,
  };
}

function recordResourceOperation(resourceRuntime, type, input, fn) {
  if (!resourceRuntime) return { result: fn(), receipt: null };
  if (typeof resourceRuntime.recordOperation === 'function') {
    const value = resourceRuntime.recordOperation(type, input, fn);
    return {
      result: value?.result ?? value,
      receipt: compactResourceReceipt({ operation: type, wal: value?.wal, walPath: resourceRuntime.walPath }),
    };
  }
  throw new SpatialEngineSessionError('SPATIAL_RESOURCE_BOUNDARY_INVALID');
}

function normalizeFoundationTransition(value, expectedGenerationRoot) {
  if (!value) return null;
  const envelope = value.envelope ?? null;
  const roots = value.roots ?? {};
  const receiptRoot = roots.receiptRoot
    ?? roots.receipt_root
    ?? envelope?.foundation_governance?.nativeReceipt?.receiptRoot
    ?? null;
  requireCondition(isRoot(receiptRoot), 'SPATIAL_FOUNDATION_RECEIPT_REQUIRED');
  const foundationGenerationRoot = envelope?.base_generation?.generation_root;
  if (foundationGenerationRoot && expectedGenerationRoot) {
    requireCondition(
      foundationGenerationRoot === expectedGenerationRoot,
      'SPATIAL_FOUNDATION_BASE_ROOT_MISMATCH',
      { expected: expectedGenerationRoot, actual: foundationGenerationRoot },
    );
  }
  const governance = envelope?.foundation_governance
    ?? value.foundation_governance
    ?? null;
  requireCondition(governance && typeof governance === 'object', 'SPATIAL_FOUNDATION_GOVERNANCE_REQUIRED');
  return {
    format: String(value.format ?? 'rcl.foundation-bridge.value'),
    status: String(value.status ?? envelope?.phase ?? 'proposed'),
    proposalRoot: roots.proposalRoot ?? roots.proposal_root ?? envelope?.proposal_root ?? null,
    receiptRoot,
    finalStateRoot: roots.finalStateRoot ?? roots.final_state_root ?? governance.nativeReceipt?.finalStateRoot ?? null,
    semanticStateRoot: roots.semanticStateRoot ?? roots.semantic_state_root ?? null,
    governance: clone(governance),
  };
}

function mergeGovernance(base, foundation, spatial) {
  const left = clone(base ?? {});
  const right = foundation?.governance ?? {};
  const list = (name) => [
    ...(Array.isArray(left[name]) ? left[name] : []),
    ...(Array.isArray(right[name]) ? right[name] : []),
    ...(Array.isArray(spatial[name]) ? spatial[name] : []),
  ];
  const uncertainty = right.uncertainty ?? left.uncertainty ?? spatial.uncertainty;
  const providerCapabilities = {
    ...(left.providerCapabilities ?? {}),
    ...(right.providerCapabilities ?? {}),
    ...(spatial.providerCapabilities ?? {}),
    required: [
      ...((left.providerCapabilities?.required ?? [])),
      ...((right.providerCapabilities?.required ?? [])),
      ...((spatial.providerCapabilities?.required ?? [])),
    ],
  };
  const adaptiveInvariantField = {
    ...(left.adaptiveInvariantField ?? {}),
    ...(right.adaptiveInvariantField ?? {}),
    ...(spatial.adaptiveInvariantField ?? {}),
    active: [
      ...((left.adaptiveInvariantField?.active ?? [])),
      ...((right.adaptiveInvariantField?.active ?? [])),
      ...((spatial.adaptiveInvariantField?.active ?? [])),
    ],
  };
  return {
    ...left,
    ...right,
    ...spatial,
    explicitVariables: list('explicitVariables'),
    uncertainty,
    providerCapabilities,
    authorityRequirements: list('authorityRequirements'),
    irreversibleEffects: list('irreversibleEffects'),
    invariants: list('invariants'),
    adaptiveInvariantField,
    causalParents: list('causalParents'),
    evidenceRequirements: list('evidenceRequirements'),
    ...(right.nativeReceipt ? { nativeReceipt: clone(right.nativeReceipt) } : {}),
    ...(right.semanticContract ? { semanticContract: clone(right.semanticContract) } : {}),
  };
}

function spatialGovernance(snapshot, plan, framePlan, foundation) {
  return {
    explicitVariables: [
      { name: 'rsr.world_id', value: snapshot.worldId },
      { name: 'rsr.before_state_root', value: snapshot.stateRoot },
      { name: 'rncs.before_state_root', value: rncsSpatialStateRoot(snapshot) },
      { name: 'rsr.command_root', value: plan.commandRoot },
      { name: 'rsr.step_ticks', value: plan.ticks },
      { name: 'vsr.frame_root', value: framePlan.frameRoot },
    ],
    uncertainty: {
      status: foundation ? 'bounded-by-rcl-foundation-and-deterministic-spatial-runtime' : 'bounded-by-deterministic-spatial-runtime',
      variables: [
        { name: 'physics', value: 'fixed-point-rsr' },
        { name: 'visual_frame', value: 'verified-vsr-plan' },
      ],
    },
    providerCapabilities: {
      required: [
        { provider: 'rsr.spatial-embodiment', capability: 'deterministic-step', mode: 'native', status: 'verified' },
        { provider: 'vsr.spatial-reality-3d', capability: 'compile-and-verify-frame', mode: 'native', status: 'verified' },
        ...(foundation ? [{ provider: foundation.format, capability: 'foundation-governance', mode: 'bridge', status: 'verified' }] : []),
      ],
      externalSideEffects: false,
    },
    authorityRequirements: [{ action: 'commit-spatial-world', scope: `reality:${snapshot.worldId}` }],
    irreversibleEffects: [{ effect: 'advance-spatial-generation', reversible: false, status: 'pending-authority' }],
    invariants: [
      { name: 'rsr-state-root-bound', expected: 'simulation.after_state_root equals committed spatial state root' },
      { name: 'vsr-frame-root-bound', expected: 'verified frame plan remains bound to simulated state root' },
      { name: 'candidate-inert-before-commit', expected: 'authoritative snapshot remains unchanged before commit' },
    ],
    adaptiveInvariantField: {
      version: '0.1.0',
      mode: 'spatial-runtime-and-authority-gate',
      active: ['state-root', 'frame-root', 'causal-evidence', 'resource-boundary'],
    },
    causalParents: [
      { kind: 'rsr-before-state', root: snapshot.stateRoot, relation: 'precedes' },
      { kind: 'rsr-command-set', root: plan.commandRoot, relation: 'causes' },
      { kind: 'vsr-frame-plan', root: framePlan.frameRoot, relation: 'projects' },
    ],
    evidenceRequirements: [
      { kind: 'rsr-spatial-snapshot', root: snapshot.stateRoot, required: true },
      { kind: 'vsr-spatial-frame', root: framePlan.frameRoot, required: true },
      ...(foundation ? [{ kind: 'rcl-foundation-native-receipt', root: foundation.receiptRoot, required: true }] : []),
    ],
  };
}

function normalizePlan(snapshot, plan = {}) {
  const ticks = Number(plan.ticks ?? plan.stepTicks ?? 1);
  requireCondition(Number.isSafeInteger(ticks) && ticks > 0, 'SPATIAL_SIMULATION_TICKS_INVALID');
  const commands = clone(plan.commands ?? []);
  requireCondition(Array.isArray(commands), 'SPATIAL_COMMANDS_INVALID');
  for (const command of commands) {
    requireCondition(command && typeof command === 'object', 'SPATIAL_COMMAND_INVALID');
    requireCondition(typeof command.id === 'string' && command.id.length > 0, 'SPATIAL_COMMAND_ID_REQUIRED');
    requireCondition(Number.isSafeInteger(Number(command.tick)), 'SPATIAL_COMMAND_TICK_INVALID');
    requireCondition(
      command.tick > snapshot.tick && command.tick <= snapshot.tick + ticks,
      'SPATIAL_COMMAND_TICK_OUT_OF_RANGE',
      { tick: command.tick, beforeTick: snapshot.tick, ticks },
    );
  }
  return {
    format: 'rncs.spatial-command-plan.v0.1',
    worldId: snapshot.worldId,
    beforeTick: snapshot.tick,
    ticks,
    commands,
    commandRoot: commandRoot(commands),
  };
}

function spatialOperation(snapshot, plan) {
  return {
    op: 'rsr.spatial-step',
    target: `world:${snapshot.worldId}`,
    path: `/spatial/tick/${snapshot.tick + plan.ticks}`,
    before_root: snapshot.stateRoot,
    command_root: plan.commandRoot,
    ticks: plan.ticks,
    commands: clone(plan.commands),
  };
}

function spatialEvidence(snapshot, plan, foundation) {
  const nodes = [
    {
      evidence_id: `evidence:rsr-before:${snapshot.stateRoot.slice(0, 24)}`,
      kind: 'rsr-spatial-snapshot',
      source: 'rsr.spatial-embodiment',
      state_root: snapshot.stateRoot,
      tick: snapshot.tick,
    },
    {
      evidence_id: `evidence:rsr-commands:${plan.commandRoot.slice(0, 24)}`,
      kind: 'rsr-command-plan',
      source: 'rncs.spatial-engine-session',
      command_root: plan.commandRoot,
      ticks: plan.ticks,
    },
  ];
  if (foundation) nodes.push({
    evidence_id: `evidence:rcl-foundation:${foundation.receiptRoot.slice(0, 24)}`,
    kind: 'rcl-foundation-native-receipt',
    source: foundation.format,
    receipt_root: foundation.receiptRoot,
    proposal_root: foundation.proposalRoot,
    final_state_root: foundation.finalStateRoot,
    mode: 'bridge',
  });
  return { nodes, edges: nodes.map(node => ({ from: node.evidence_id, to: 'spatial-transition', relation: 'supports' })) };
}

function augmentProposalInput(input, snapshot, plan, foundation, framePlan) {
  const existingOperations = input.provisional_delta?.operations ?? [];
  const existingEvidence = input.evidence ?? { nodes: [], edges: [] };
  const existingCausalBasis = input.causal_basis ?? { events: [], rules: [], simulation_refs: [] };
  const spatial = spatialGovernance(snapshot, plan, framePlan, foundation);
  const governance = mergeGovernance(input.foundation_governance, foundation, spatial);
  const evidence = spatialEvidence(snapshot, plan, foundation);
  return {
    ...clone(input),
    provisional_delta: {
      ...(clone(input.provisional_delta) ?? {}),
      operations: [...existingOperations, spatialOperation(snapshot, plan)],
    },
    causal_basis: {
      ...clone(existingCausalBasis),
      events: [
        ...(existingCausalBasis.events ?? []),
        { event_id: `event:rsr-step:${plan.commandRoot.slice(0, 24)}`, kind: 'rsr-spatial-step', before_root: snapshot.stateRoot, command_root: plan.commandRoot },
      ],
      rules: [...(existingCausalBasis.rules ?? []), 'rsr.fixed-point-step', 'vsr.frame-root-binding'],
      simulation_refs: [...(existingCausalBasis.simulation_refs ?? []), snapshot.stateRoot],
    },
    evidence: {
      nodes: [...(existingEvidence.nodes ?? []), ...evidence.nodes],
      edges: [...(existingEvidence.edges ?? []), ...evidence.edges],
    },
    foundation_governance: governance,
    extensions: {
      ...(clone(input.extensions) ?? {}),
      spatial: {
        format: SPATIAL_ENGINE_SESSION_FORMAT,
        world_id: snapshot.worldId,
        before_state_root: snapshot.stateRoot,
        before_tick: snapshot.tick,
        ticks: plan.ticks,
        commands: clone(plan.commands),
        command_root: plan.commandRoot,
        frame_root_precommit: framePlan.frameRoot,
      },
      ...(foundation ? {
        rclFoundationNativeBridge: {
          format: foundation.format,
          status: foundation.status,
          receipt_root: foundation.receiptRoot,
          proposal_root: foundation.proposalRoot,
          final_state_root: foundation.finalStateRoot,
          semantic_state_root: foundation.semanticStateRoot,
        },
      } : {}),
    },
  };
}

function buildProjection(snapshot, projectionOptions) {
  const scene = spatialEmbodimentSnapshotToVSRScene(snapshot, projectionOptions);
  const framePlan = compileSpatialFrame(scene, projectionOptions);
  const verification = verifySpatialFrame(framePlan);
  requireCondition(verification.ok, 'SPATIAL_FRAME_INVALID', verification);
  return {
    scene,
    framePlan,
    frameVerification: verification,
    sceneRoot: spatialEmbodimentSceneRoot(scene),
    frameRoot: framePlan.frameRoot,
  };
}

function buildTemporalAuthority(snapshot, previousStateRoot, reason) {
  const authorityFrame = createAuthoritativeStateFrame(snapshot, { previousStateRoot, reason });
  const temporalPacket = networkPacketToTemporalState({
    rsrFrame: authorityFrame,
    worldId: authorityFrame.worldId,
    tick: authorityFrame.tick,
    stepHz: authorityFrame.stepHz,
  });
  requireCondition(verifyAuthoritativeStateFrame(authorityFrame), 'RSR_AUTHORITY_FRAME_INVALID');
  requireCondition(verifyTemporalStatePacket(temporalPacket), 'VSR_TEMPORAL_PACKET_INVALID');
  requireCondition(temporalPacket.sourceStateRoot === snapshot.stateRoot, 'VSR_TEMPORAL_STATE_ROOT_MISMATCH');
  requireCondition(temporalPacket.sourcePacketRoot === authorityFrame.frameRoot, 'VSR_TEMPORAL_AUTHORITY_ROOT_MISMATCH');
  const runtimeBinding = createRealityRuntimeBinding({ authorityFrame, temporalPacket });
  requireCondition(verifyRealityRuntimeBinding(runtimeBinding).valid, 'RNCS_RUNTIME_BINDING_INVALID');
  return { authorityFrame, temporalPacket, runtimeBinding };
}

function planFromInput(input, snapshot, fallback) {
  const spatial = input.extensions?.spatial ?? {};
  return normalizePlan(snapshot, {
    ticks: spatial.ticks ?? fallback.ticks,
    commands: spatial.commands ?? fallback.commands,
  });
}

export function createSpatialEngineProposalInput({
  snapshot,
  commands = [],
  ticks = 1,
  realityId = `reality:spatial:${snapshot?.worldId ?? 'world'}`,
  baseGeneration = snapshot?.reality?.generation ?? 0,
  baseGenerationRoot = snapshot?.reality?.realityRoot ?? ZERO_ROOT,
  transitionId = `transition:spatial:${snapshot?.stateRoot?.slice(0, 24) ?? 'unknown'}`,
  subject,
  foundationTransition = null,
  projectionOptions = {},
  ...rest
} = {}) {
  requireCondition(snapshot && verifySpatialEmbodimentSnapshot(snapshot), 'SPATIAL_INITIAL_SNAPSHOT_INVALID');
  const plan = normalizePlan(snapshot, { commands, ticks });
  const normalizedBaseGenerationRoot = rootOrHash(baseGenerationRoot, {
    format: 'rsr.spatial-generation-root.v0.1',
    worldId: snapshot.worldId,
    stateRoot: snapshot.stateRoot,
  });
  const foundation = normalizeFoundationTransition(foundationTransition, normalizedBaseGenerationRoot);
  const projection = buildProjection(snapshot, projectionOptions);
  const input = createEngineProposalInput({
    realityId,
    baseGeneration,
    baseGenerationRoot: normalizedBaseGenerationRoot,
    transitionId,
    subject: subject ?? { subject_id: 'subject:spatial-engine', kind: 'spatial-engine', roles: ['planner'] },
    operations: [],
    causalBasis: { events: [], rules: [], simulation_refs: [snapshot.stateRoot] },
    evidence: { nodes: [], edges: [] },
    foundationGovernance: {},
    extensions: {},
    ...rest,
  });
  return augmentProposalInput(input, snapshot, plan, foundation, projection.framePlan);
}

export class SpatialRealityEngineSession {
  constructor({
    spatialConfig = null,
    worldConfig = null,
    spatialSnapshot = null,
    initialSnapshot = null,
    spatialWorld = null,
    spatialCommands = [],
    spatialTicks = 1,
    spatialProjectionOptions = {},
    foundationTransition = null,
    resourceRuntime = null,
    ...engineOptions
  } = {}) {
    const sourceWorld = spatialWorld
      ? SpatialEmbodimentWorld.fromSnapshot(spatialWorld.snapshot())
      : spatialSnapshot
        ? SpatialEmbodimentWorld.fromSnapshot(spatialSnapshot)
        : initialSnapshot
          ? SpatialEmbodimentWorld.fromSnapshot(initialSnapshot)
          : new SpatialEmbodimentWorld(spatialConfig ?? worldConfig);
    const initial = sourceWorld.snapshot();
    requireCondition(verifySpatialEmbodimentSnapshot(initial), 'SPATIAL_INITIAL_SNAPSHOT_INVALID');
    const generationRoot = rootOrHash(
      engineOptions.generationRoot ?? initial.reality.realityRoot,
      { format: 'rsr.spatial-generation-root.v0.1', worldId: initial.worldId, stateRoot: initial.stateRoot },
    );
    const stateRoot = engineOptions.stateRoot ?? rncsSpatialStateRoot(initial);
    requireCondition(stateRoot === rncsSpatialStateRoot(initial), 'SPATIAL_INITIAL_STATE_ROOT_MISMATCH');
    if (initial.reality.realityRoot && isRoot(initial.reality.realityRoot)) requireCondition(generationRoot === initial.reality.realityRoot, 'SPATIAL_INITIAL_GENERATION_ROOT_MISMATCH');
    this.engine = new RealityEngineSession({
      ...engineOptions,
      realityId: engineOptions.realityId ?? `reality:spatial:${initial.worldId}`,
      generation: engineOptions.generation ?? initial.reality.generation ?? 0,
      generationRoot,
      stateRoot,
    });
    this.world = sourceWorld;
    this.initialSnapshot = initial;
    this.beforeSpatialSnapshot = null;
    this.spatialProposal = null;
    this.spatialSimulation = null;
    this.spatialProjectionOptions = clone(spatialProjectionOptions);
    this.defaultSpatialPlan = { commands: clone(spatialCommands), ticks: spatialTicks };
    this.foundationTransition = foundationTransition;
    this.foundation = normalizeFoundationTransition(foundationTransition, this.engine.generation_root);
    this.resourceRuntime = resourceRuntime;
  }

  get session_id() { return this.engine.session_id; }
  get reality_id() { return this.engine.reality_id; }
  get subject() { return this.engine.subject; }
  get status() { return this.engine.status; }
  get generation() { return this.engine.generation; }
  get generation_root() { return this.engine.generation_root; }
  get state_root() { return this.engine.state_root; }
  get envelope() { return this.engine.envelope; }
  get candidate_root() { return this.engine.candidate_root; }

  propose(input = {}) {
    requireCondition(this.status === 'draft', 'SPATIAL_PROPOSAL_PHASE_INVALID');
    this.beforeSpatialSnapshot = this.world.snapshot();
    requireCondition(rncsSpatialStateRoot(this.beforeSpatialSnapshot) === this.engine.state_root, 'SPATIAL_ENGINE_BASE_STATE_MISMATCH');
    const plan = planFromInput(input, this.beforeSpatialSnapshot, this.defaultSpatialPlan);
    const preview = buildProjection(this.beforeSpatialSnapshot, this.spatialProjectionOptions);
    const foundation = normalizeFoundationTransition(
      this.foundationTransition,
      this.engine.generation_root,
    );
    const augmented = augmentProposalInput(input, this.beforeSpatialSnapshot, plan, foundation, preview.framePlan);
    this.spatialProposal = {
      plan,
      foundation,
      preview,
    };
    const proposal = this.engine.propose(augmented);
    return proposal;
  }

  simulate({
    commands = null,
    ticks = null,
    targetGeneration,
    receiptRefs = [],
    networkCompilation,
    diagnostics = [],
    ...options
  } = {}) {
    requireCondition(this.status === 'proposed', 'SPATIAL_SIMULATION_PHASE_INVALID');
    const before = this.beforeSpatialSnapshot;
    const plan = normalizePlan(before, {
      commands: commands ?? this.spatialProposal?.plan.commands ?? this.defaultSpatialPlan.commands,
      ticks: ticks ?? this.spatialProposal?.plan.ticks ?? this.defaultSpatialPlan.ticks,
    });
    const resourceInput = { worldId: before.worldId, beforeStateRoot: before.stateRoot, commandRoot: plan.commandRoot, ticks: plan.ticks };
    const simulationRun = recordResourceOperation(this.resourceRuntime, 'spatial.simulation', resourceInput, () => {
      const candidateWorld = SpatialEmbodimentWorld.fromSnapshot(before);
      for (let index = 0; index < plan.ticks; index++) candidateWorld.step(plan.commands);
      return candidateWorld.snapshot();
    });
    const after = simulationRun.result;
    requireCondition(verifySpatialEmbodimentSnapshot(after), 'SPATIAL_SIMULATION_SNAPSHOT_INVALID');
    const projection = buildProjection(after, this.spatialProjectionOptions);
    const temporal = buildTemporalAuthority(after, before.stateRoot, 'candidate-simulation');
    const causalDelta = spatialEmbodimentSnapshotToCausalDelta(after, before.stateRoot);
    const afterStateRoot = rncsSpatialStateRoot(after);
    const allReceiptRefs = [
      ...clone(receiptRefs),
      { kind: 'rsr-causal-delta', root: causalDelta.deltaRoot },
      { kind: 'rsr-authoritative-state-frame', root: temporal.authorityFrame.frameRoot },
      { kind: 'vsr-frame-plan', root: projection.frameRoot },
      { kind: 'vsr-temporal-state-packet', root: temporal.temporalPacket.packetRoot },
      { kind: 'rncs-runtime-authority-presentation-binding', root: temporal.runtimeBinding.bindingRoot },
      ...(this.foundation ? [{ kind: 'rcl-foundation-native-receipt', root: this.foundation.receiptRoot }] : []),
      ...(simulationRun.receipt ? [{ kind: 'rcl-resource-wal', root: simulationRun.receipt.succeeded_root }] : []),
    ];
    const baseSimulation = this.engine.simulate({
      ...options,
      targetGeneration: targetGeneration ?? this.engine.generation + 1,
      afterStateRoot,
      outputs: [
        { kind: 'rsr-spatial-snapshot', root: after.stateRoot },
        { kind: 'rsr-authoritative-state-frame', root: temporal.authorityFrame.frameRoot },
        { kind: 'vsr-spatial-frame', root: projection.frameRoot },
        { kind: 'vsr-temporal-state-packet', root: temporal.temporalPacket.packetRoot },
        { kind: 'rncs-runtime-authority-presentation-binding', root: temporal.runtimeBinding.bindingRoot },
      ],
      receiptRefs: allReceiptRefs,
      networkCompilation,
      diagnostics: [...diagnostics, ...projection.frameVerification.diagnostics],
    });
    this.spatialSimulation = {
      format: SPATIAL_ENGINE_SIMULATION_FORMAT,
      engineSimulationRoot: baseSimulation.simulation_root,
      beforeStateRoot: rncsSpatialStateRoot(before),
      beforeRsrStateRoot: before.stateRoot,
      afterStateRoot,
      rsrAfterStateRoot: after.stateRoot,
      beforeTick: before.tick,
      afterTick: after.tick,
      targetGeneration: baseSimulation.target_generation,
      plan,
      snapshot: after,
      scene: projection.scene,
      sceneRoot: projection.sceneRoot,
      framePlan: projection.framePlan,
      frameRoot: projection.frameRoot,
      frameVerification: projection.frameVerification,
      authorityFrame: temporal.authorityFrame,
      temporalPacket: temporal.temporalPacket,
      runtimeBinding: temporal.runtimeBinding,
      causalDelta,
      resourceReceipt: simulationRun.receipt,
    };
    return {
      ...baseSimulation,
      spatial: this.spatialSimulation,
    };
  }

  authorize(options = {}) {
    return this.engine.authorize(options);
  }

  async commit({
    generation,
    generationRoot,
    receiptRefs = [],
    apply: externalApply = null,
    ...options
  } = {}) {
    requireCondition(this.status === 'authorized', 'SPATIAL_COMMIT_PHASE_INVALID');
    requireCondition(this.spatialSimulation, 'SPATIAL_COMMIT_SIMULATION_REQUIRED');
    const expectedRoot = this.spatialSimulation.afterStateRoot;
    const expectedGeneration = this.spatialSimulation.targetGeneration;
    if (generationRoot !== undefined) requireCondition(generationRoot === expectedRoot, 'SPATIAL_COMMIT_ROOT_MISMATCH');
    if (generation !== undefined) requireCondition(Number(generation) === expectedGeneration, 'SPATIAL_COMMIT_GENERATION_MISMATCH');
    const result = await this.engine.commit({
      ...options,
      ...(generation === undefined ? {} : { generation }),
      generationRoot: expectedRoot,
      receiptRefs: [
        ...clone(receiptRefs),
        { kind: 'rsr-authoritative-state-frame', root: this.spatialSimulation.authorityFrame.frameRoot },
        { kind: 'vsr-spatial-frame', root: this.spatialSimulation.frameRoot },
        { kind: 'vsr-temporal-state-packet', root: this.spatialSimulation.temporalPacket.packetRoot },
        { kind: 'rncs-runtime-authority-presentation-binding', root: this.spatialSimulation.runtimeBinding.bindingRoot },
        ...(this.foundation ? [{ kind: 'rcl-foundation-native-receipt', root: this.foundation.receiptRoot }] : []),
      ],
      apply: async context => {
        const authoritativeBefore = this.world.snapshot();
        requireCondition(authoritativeBefore.stateRoot === this.spatialSimulation.beforeRsrStateRoot, 'SPATIAL_AUTHORITATIVE_BASE_MISMATCH');
        const candidateWorld = SpatialEmbodimentWorld.fromSnapshot(authoritativeBefore);
        for (let index = 0; index < this.spatialSimulation.plan.ticks; index++) candidateWorld.step(this.spatialSimulation.plan.commands);
        const appliedSnapshot = candidateWorld.snapshot();
        requireCondition(appliedSnapshot.stateRoot === this.spatialSimulation.rsrAfterStateRoot, 'SPATIAL_APPLY_STATE_ROOT_MISMATCH');
        const appliedProjection = buildProjection(appliedSnapshot, this.spatialProjectionOptions);
        requireCondition(appliedProjection.frameRoot === this.spatialSimulation.frameRoot, 'SPATIAL_APPLY_FRAME_ROOT_MISMATCH');
        const appliedTemporal = buildTemporalAuthority(appliedSnapshot, authoritativeBefore.stateRoot, 'candidate-simulation');
        requireCondition(appliedTemporal.authorityFrame.frameRoot === this.spatialSimulation.authorityFrame.frameRoot, 'SPATIAL_APPLY_AUTHORITY_FRAME_ROOT_MISMATCH');
        requireCondition(appliedTemporal.temporalPacket.packetRoot === this.spatialSimulation.temporalPacket.packetRoot, 'SPATIAL_APPLY_TEMPORAL_PACKET_ROOT_MISMATCH');
        const resourceRun = recordResourceOperation(this.resourceRuntime, 'spatial.commit', {
          worldId: authoritativeBefore.worldId,
          beforeStateRoot: authoritativeBefore.stateRoot,
          afterStateRoot: expectedRoot,
          rsrAfterStateRoot: appliedSnapshot.stateRoot,
          authorityFrameRoot: appliedTemporal.authorityFrame.frameRoot,
          frameRoot: appliedProjection.frameRoot,
          temporalPacketRoot: appliedTemporal.temporalPacket.packetRoot,
          runtimeBindingRoot: appliedTemporal.runtimeBinding.bindingRoot,
        }, () => ({ stateRoot: appliedSnapshot.stateRoot, frameRoot: appliedProjection.frameRoot }));
        this.world = candidateWorld;
        const applied = {
          stateRoot: rncsSpatialStateRoot(appliedSnapshot),
          rsrStateRoot: appliedSnapshot.stateRoot,
          frameRoot: appliedProjection.frameRoot,
          snapshot: appliedSnapshot,
          scene: appliedProjection.scene,
          framePlan: appliedProjection.framePlan,
          authorityFrame: appliedTemporal.authorityFrame,
          temporalPacket: appliedTemporal.temporalPacket,
          runtimeBinding: appliedTemporal.runtimeBinding,
          resourceReceipt: resourceRun.receipt,
        };
        if (typeof externalApply === 'function') {
          const external = await externalApply({ ...context, spatial: clone(applied) });
          return { ...applied, external: clone(external) };
        }
        return applied;
      },
    });
    result.snapshot = this.snapshot();
    result.applied = clone(result.applied);
    return result;
  }

  rollback(options = {}) {
    return this.engine.rollback(options);
  }

  spatialSnapshot() {
    return this.world.snapshot();
  }

  createReplayBundle(options = {}) {
    return createSpatialReplayBundle({
      ...options,
      initialSnapshot: this.world.snapshot(),
      projectionOptions: options.projectionOptions ?? this.spatialProjectionOptions,
      branchId: options.branchId ?? `branch:${this.session_id}:replay`,
      metadata: {
        session_id: this.session_id,
        reality_id: this.reality_id,
        source_state_root: this.engine.state_root,
        foundation_receipt_root: this.foundation?.receiptRoot ?? null,
        ...(options.metadata ?? {}),
      },
    });
  }

  snapshot() {
    const base = this.engine.snapshot();
    const authoritativeSnapshot = this.world.snapshot();
    const spatial = {
      format: SPATIAL_ENGINE_SESSION_FORMAT,
      initial_state_root: this.initialSnapshot.stateRoot,
      authoritative_snapshot: authoritativeSnapshot,
      proposal: this.spatialProposal
        ? { plan: clone(this.spatialProposal.plan), preview: { sceneRoot: this.spatialProposal.preview.sceneRoot, frameRoot: this.spatialProposal.preview.frameRoot } }
        : null,
      simulation: this.spatialSimulation ? {
        ...clone(this.spatialSimulation),
        scene: clone(this.spatialSimulation.scene),
        framePlan: clone(this.spatialSimulation.framePlan),
      } : null,
      foundation: clone(this.foundation),
    };
    const snapshotRootPayload = {
      format: 'rncs.spatial-engine-session-root.v0.1',
      session_id: base.session_id,
      status: base.status,
      generation: base.generation,
      generation_root: base.generation_root,
      state_root: base.state_root,
      candidate_root: base.candidate_root,
      proposal_root: base.envelope?.proposal_root ?? null,
      authority_root: base.envelope?.authority?.decision_root ?? null,
      commit_root: base.envelope?.commit?.commit_root ?? null,
      authoritative_rsr_state_root: authoritativeSnapshot.stateRoot,
      simulated_rsr_state_root: this.spatialSimulation?.rsrAfterStateRoot ?? null,
      authority_frame_root: this.spatialSimulation?.authorityFrame?.frameRoot ?? null,
      frame_root: this.spatialSimulation?.frameRoot ?? null,
      temporal_packet_root: this.spatialSimulation?.temporalPacket?.packetRoot ?? null,
      runtime_binding_root: this.spatialSimulation?.runtimeBinding?.bindingRoot ?? null,
      foundation_receipt_root: this.foundation?.receiptRoot ?? null,
    };
    const snapshot = { ...base, spatial, session_root_payload: snapshotRootPayload };
    snapshot.session_root = rootHash(snapshotRootPayload);
    return snapshot;
  }

  verify() {
    return verifySpatialEngineSessionSnapshot(this.snapshot());
  }
}

export function verifySpatialEngineSessionSnapshot(snapshot) {
  const errors = [];
  const base = verifyEngineSessionSnapshot(snapshot);
  if (!base.valid) errors.push(...base.errors);
  const spatial = snapshot?.spatial;
  if (!spatial || spatial.format !== SPATIAL_ENGINE_SESSION_FORMAT) errors.push('SPATIAL_SESSION_FORMAT_INVALID');
  const checkSnapshot = candidate => {
    if (!candidate || !verifySpatialEmbodimentSnapshot(candidate)) errors.push('SPATIAL_SNAPSHOT_INVALID');
  };
  checkSnapshot(spatial?.authoritative_snapshot);
  if (spatial?.simulation) {
    checkSnapshot(spatial.simulation.snapshot);
    const frameVerification = spatial.simulation.framePlan
      ? verifySpatialFrame(spatial.simulation.framePlan)
      : { ok: false, diagnostics: ['frame plan missing'] };
    if (!frameVerification.ok) errors.push(...frameVerification.diagnostics.map(code => `SPATIAL_FRAME_INVALID:${code}`));
    if (!spatial.simulation.scene || spatialEmbodimentSceneRoot(spatial.simulation.scene) !== spatial.simulation.sceneRoot) errors.push('SPATIAL_SCENE_ROOT_MISMATCH');
    if (spatial.simulation.framePlan?.frameRoot !== spatial.simulation.frameRoot) errors.push('SPATIAL_FRAME_ROOT_MISMATCH');
    if (spatial.simulation.snapshot?.stateRoot !== spatial.simulation.rsrAfterStateRoot) errors.push('SPATIAL_AFTER_STATE_ROOT_MISMATCH');
    if (!spatial.simulation.authorityFrame || !verifyAuthoritativeStateFrame(spatial.simulation.authorityFrame)) errors.push('RSR_AUTHORITY_FRAME_INVALID');
    if (!spatial.simulation.temporalPacket || !verifyTemporalStatePacket(spatial.simulation.temporalPacket)) errors.push('VSR_TEMPORAL_PACKET_INVALID');
    const runtimeBindingVerification = spatial.simulation.runtimeBinding
      ? verifyRealityRuntimeBinding(spatial.simulation.runtimeBinding)
      : { valid: false, errors: ['missing'] };
    if (!runtimeBindingVerification.valid) errors.push(...runtimeBindingVerification.errors);
    if (spatial.simulation.authorityFrame?.sourceStateRoot !== spatial.simulation.rsrAfterStateRoot) errors.push('RSR_AUTHORITY_FRAME_STATE_ROOT_MISMATCH');
    if (spatial.simulation.temporalPacket?.sourceStateRoot !== spatial.simulation.rsrAfterStateRoot) errors.push('VSR_TEMPORAL_STATE_ROOT_MISMATCH');
    if (spatial.simulation.temporalPacket?.sourcePacketRoot !== spatial.simulation.authorityFrame?.frameRoot) errors.push('VSR_TEMPORAL_AUTHORITY_ROOT_MISMATCH');
    if (spatial.simulation.runtimeBinding?.stateRoot !== spatial.simulation.rsrAfterStateRoot) errors.push('RNCS_RUNTIME_BINDING_STATE_ROOT_MISMATCH');
    if (spatial.simulation.runtimeBinding?.bindingRoot !== snapshot?.session_root_payload?.runtime_binding_root) errors.push('RNCS_RUNTIME_BINDING_ROOT_MISMATCH');
    if (spatial.simulation.authorityFrame?.previousStateRoot !== spatial.simulation.beforeRsrStateRoot) errors.push('RSR_AUTHORITY_FRAME_PREVIOUS_ROOT_MISMATCH');
  }
  if (snapshot?.status === 'committed' && (!spatial?.authoritative_snapshot || rncsSpatialStateRoot(spatial.authoritative_snapshot) !== snapshot.state_root)) errors.push('SPATIAL_COMMITTED_STATE_ROOT_MISMATCH');
  return { valid: errors.length === 0, errors, session_root: snapshot?.session_root ?? null, state_root: spatial?.authoritative_snapshot?.stateRoot ?? null, frame_root: spatial?.simulation?.frameRoot ?? null };
}

export function createSpatialRealityEngineSession(options = {}) {
  return new SpatialRealityEngineSession(options);
}

export {
  createEngineProposalInput,
  createSpatialRealityEngineSession as createRealityEngineSession,
  verifySpatialEngineSessionSnapshot as verifyEngineSessionSnapshot,
};

export {
  createSpatialReplayBundle,
  verifySpatialReplayBundle,
  replaySpatialReplayBundle,
  createSpatialReplayBranch,
  compareSpatialReplayBranches,
} from './spatial-replay.mjs';
