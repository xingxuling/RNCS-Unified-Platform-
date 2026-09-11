import { createEntityCommandBatch, rootHash, assertEntityCommandBatch } from '@taowind/rncs-core-contract';
import {
  assertRclSpatialCommandPlan,
  assertRclPhysicalCommandProfile,
  RCL_PHYSICAL_COMMAND_PROFILE,
  RCL_SPATIAL_COMMAND_PLAN_FORMAT,
  RCL_SPATIAL_COMMAND_PLAN_VERSION,
} from '@taowind/rncs-rcl-control-plane';
import {
  createSpatialRealityEngineSession,
  createSpatialEngineProposalInput,
} from '@taowind/reality-engine-session/spatial';

export const RCL_RSR_SPATIAL_LOWERING_FORMAT = 'rncs.rcl-rsr-spatial-lowering.v0.1';
export const RCL_RSR_SPATIAL_LOWERING_VERSION = '0.1.0';
export const RSR_SPATIAL_COMMAND_PLAN_FORMAT = 'rncs.spatial-command-plan.v0.1';

const clone = value => value === undefined ? undefined : structuredClone(value);

function authorityPlanParts(authorityPlan) {
  const plan = authorityPlan?.plan ?? authorityPlan;
  const commandPlan = authorityPlan?.spatialCommandPlan ?? plan?.spatial_command_plan;
  const physicalCommandProfile = authorityPlan?.physicalCommandProfile ?? plan?.physical_command_profile ?? RCL_PHYSICAL_COMMAND_PROFILE;
  if (!plan || typeof plan !== 'object' || plan.source?.language !== 'RCL') throw new Error('RCL_RSR_SPATIAL_AUTHORITY_PLAN_REQUIRED');
  if (!commandPlan || typeof commandPlan !== 'object') throw new Error('RCL_RSR_SPATIAL_COMMAND_PLAN_REQUIRED');
  if (plan.source.rcl_spatial_command_plan_root !== commandPlan.root) throw new Error('RCL_RSR_SPATIAL_SOURCE_ROOT_MISMATCH');
  if (plan.source.rcl_physical_command_profile_root !== undefined && plan.source.rcl_physical_command_profile_root !== physicalCommandProfile.root) throw new Error('RCL_RSR_SPATIAL_PROFILE_ROOT_MISMATCH');
  if (authorityPlan?.stateRoot !== undefined && authorityPlan.stateRoot !== plan.source.rcl_native_state_root) throw new Error('RCL_RSR_SPATIAL_STATE_ROOT_MISMATCH');
  if (!(plan.authority_requirements ?? []).some(requirement => requirement.action === 'simulate_spatial_candidate' && requirement.scope === 'rncs.rsr.simulate')) throw new Error('RCL_RSR_SPATIAL_AUTHORITY_REQUIREMENT_MISSING');
  assertRclSpatialCommandPlan(commandPlan);
  assertRclPhysicalCommandProfile(physicalCommandProfile);
  return { plan, commandPlan, physicalCommandProfile };
}

function targetDescriptor(target) {
  if (!target) return null;
  const worldId = target.worldId ?? target.world_id;
  const generationRoot = target.generationRoot ?? target.generation_root;
  if (typeof worldId !== 'string' || worldId.length === 0) throw new Error('RCL_RSR_SPATIAL_TARGET_WORLD_REQUIRED');
  if (!Number.isSafeInteger(target.generation) || target.generation < 0) throw new Error('RCL_RSR_SPATIAL_TARGET_GENERATION_INVALID');
  if (typeof generationRoot !== 'string' || !/^[0-9a-f]{64}$/.test(generationRoot)) throw new Error('RCL_RSR_SPATIAL_TARGET_GENERATION_ROOT_INVALID');
  if (!Number.isSafeInteger(target.tick) || target.tick < 0) throw new Error('RCL_RSR_SPATIAL_TARGET_TICK_INVALID');
  return { world_id: worldId, generation: target.generation, generation_root: generationRoot, tick: target.tick };
}

function kernelCommandBatch(parts, target) {
  const targetValue = targetDescriptor(target);
  if (!targetValue) return null;
  const { plan, commandPlan, physicalCommandProfile } = parts;
  return createEntityCommandBatch({
    ...targetValue,
    source: {
      format: RCL_SPATIAL_COMMAND_PLAN_FORMAT,
      version: RCL_SPATIAL_COMMAND_PLAN_VERSION,
      plan_id: plan.plan_id,
      state_root: plan.source.rcl_native_state_root,
      command_plan_root: commandPlan.root,
    },
    profile: {
      format: physicalCommandProfile.format,
      version: physicalCommandProfile.version,
      domain: physicalCommandProfile.domain,
      root: physicalCommandProfile.root,
    },
    commands: clone(commandPlan.commands),
  });
}

function loweringPayload(parts, target) {
  const { plan, commandPlan, physicalCommandProfile } = parts;
  const batch = kernelCommandBatch(parts, target);
  return {
    format: RCL_RSR_SPATIAL_LOWERING_FORMAT,
    version: RCL_RSR_SPATIAL_LOWERING_VERSION,
    source_plan_id: plan.plan_id,
    source_state_root: plan.source.rcl_native_state_root,
    source_command_plan_root: commandPlan.root,
    source_profile_root: physicalCommandProfile.root,
    profile: clone(physicalCommandProfile),
    target_format: RSR_SPATIAL_COMMAND_PLAN_FORMAT,
    target_command_root: rootHash(commandPlan.commands),
    commands: clone(commandPlan.commands),
    ...(batch ? { kernel_command_batch: batch } : {}),
    authority: {
      candidate_only: true,
      authoritative: false,
      canonical_write_authorized: false,
      commit_requires_explicit_rncs_authority: true,
    },
    boundaries: [
      'RCL native authority plan is the source declaration and evidence owner.',
      'RSR remains the authoritative spatial state executor after candidate simulation.',
      'This bridge does not create a dynamic-body heightfield path or device proof.',
    ],
  };
}

export function lowerRclSpatialCommandPlan(authorityPlan, { target = null } = {}) {
  const parts = authorityPlanParts(authorityPlan);
  const payload = loweringPayload(parts, target);
  return { ...payload, lowering_root: rootHash(payload) };
}

export function assertRclRsrSpatialLowering(lowering) {
  if (!lowering || lowering.format !== RCL_RSR_SPATIAL_LOWERING_FORMAT || lowering.version !== RCL_RSR_SPATIAL_LOWERING_VERSION) throw new Error('RCL_RSR_SPATIAL_LOWERING_FORMAT_INVALID');
  if (lowering.target_format !== RSR_SPATIAL_COMMAND_PLAN_FORMAT) throw new Error('RCL_RSR_SPATIAL_TARGET_FORMAT_INVALID');
  if (lowering.authority?.candidate_only !== true || lowering.authority?.authoritative !== false || lowering.authority?.canonical_write_authorized !== false || lowering.authority?.commit_requires_explicit_rncs_authority !== true) throw new Error('RCL_RSR_SPATIAL_AUTHORITY_BOUNDARY_INVALID');
  if (!Array.isArray(lowering.commands) || lowering.commands.length === 0) throw new Error('RCL_RSR_SPATIAL_COMMANDS_INVALID');
  assertRclPhysicalCommandProfile(lowering.profile);
  if (lowering.source_profile_root !== lowering.profile.root) throw new Error('RCL_RSR_SPATIAL_PROFILE_ROOT_MISMATCH');
  assertRclSpatialCommandPlan({
    format: RCL_SPATIAL_COMMAND_PLAN_FORMAT,
    version: RCL_SPATIAL_COMMAND_PLAN_VERSION,
    commands: lowering.commands,
    root: lowering.source_command_plan_root,
  });
  if (lowering.target_command_root !== rootHash(lowering.commands)) throw new Error('RCL_RSR_SPATIAL_TARGET_ROOT_MISMATCH');
  if (lowering.kernel_command_batch !== undefined) {
    assertEntityCommandBatch(lowering.kernel_command_batch);
    if (lowering.kernel_command_batch.source.plan_id !== lowering.source_plan_id) throw new Error('RCL_RSR_SPATIAL_KERNEL_PLAN_ID_MISMATCH');
    if (lowering.kernel_command_batch.source.state_root !== lowering.source_state_root) throw new Error('RCL_RSR_SPATIAL_KERNEL_STATE_ROOT_MISMATCH');
    if (lowering.kernel_command_batch.source.command_plan_root !== lowering.source_command_plan_root) throw new Error('RCL_RSR_SPATIAL_KERNEL_SOURCE_ROOT_MISMATCH');
    if (lowering.kernel_command_batch.profile.root !== lowering.profile.root) throw new Error('RCL_RSR_SPATIAL_KERNEL_PROFILE_ROOT_MISMATCH');
    if (lowering.kernel_command_batch.command_root !== lowering.target_command_root) throw new Error('RCL_RSR_SPATIAL_KERNEL_COMMAND_ROOT_MISMATCH');
    if (JSON.stringify(lowering.kernel_command_batch.commands) !== JSON.stringify(lowering.commands)) throw new Error('RCL_RSR_SPATIAL_KERNEL_COMMANDS_MISMATCH');
  }
  const payload = clone(lowering);
  delete payload.lowering_root;
  if (rootHash(payload) !== lowering.lowering_root) throw new Error('RCL_RSR_SPATIAL_LOWERING_ROOT_MISMATCH');
  return lowering;
}

export function verifyRclRsrSpatialLowering(lowering) {
  try {
    assertRclRsrSpatialLowering(lowering);
    return true;
  } catch {
    return false;
  }
}

function ticksForCommands(snapshot, commands) {
  const beforeTick = Number(snapshot?.tick ?? 0);
  return Math.max(1, ...commands.map(command => command.tick - beforeTick));
}

function targetFromRuntime({ snapshot = null, spatialConfig = null } = {}) {
  const reality = snapshot?.reality ?? spatialConfig?.reality ?? {};
  return {
    worldId: snapshot?.worldId ?? spatialConfig?.worldId,
    generation: Number(reality.generation ?? 0),
    generationRoot: reality.realityRoot ?? '0'.repeat(64),
    tick: Number(snapshot?.tick ?? 0),
  };
}

export function createRclSpatialRealityEngineSession({ authorityPlan, spatialTicks = null, ...options } = {}) {
  if (options.spatialCommands !== undefined) throw new Error('RCL_RSR_SPATIAL_COMMANDS_OVERRIDE_FORBIDDEN');
  const sourcePlan = authorityPlan?.plan ?? authorityPlan;
  const beforeSnapshot = options.spatialSnapshot ?? options.initialSnapshot ?? null;
  const lowering = lowerRclSpatialCommandPlan(authorityPlan, { target: targetFromRuntime({ snapshot: beforeSnapshot, spatialConfig: options.spatialConfig }) });
  const ticks = spatialTicks ?? ticksForCommands(beforeSnapshot, lowering.commands);
  const session = createSpatialRealityEngineSession({
    ...options,
    realityId: options.realityId ?? `reality:rcl:${sourcePlan.plan_id}`,
    spatialCommands: clone(lowering.kernel_command_batch?.commands ?? lowering.commands),
    spatialTicks: ticks,
  });
  return { session, lowering };
}

export function createRclSpatialEngineProposalInput({
  authorityPlan,
  snapshot,
  ticks = null,
  realityId = null,
  baseGeneration = null,
  baseGenerationRoot = null,
  transitionId = null,
  subject = null,
  foundationTransition = null,
  projectionOptions = {},
  extensions = {},
  ...rest
} = {}) {
  const parts = authorityPlanParts(authorityPlan);
  const lowering = lowerRclSpatialCommandPlan(authorityPlan, { target: targetFromRuntime({ snapshot }) });
  const sourcePlan = parts.plan;
  const resolvedTicks = ticks ?? ticksForCommands(snapshot, lowering.commands);
  return createSpatialEngineProposalInput({
    ...rest,
    snapshot,
    commands: clone(lowering.commands),
    ticks: resolvedTicks,
    realityId: realityId ?? `reality:rcl:${sourcePlan.plan_id}`,
    baseGeneration: baseGeneration ?? sourcePlan.candidate_branch?.baseline_generation ?? snapshot?.reality?.generation ?? 0,
    baseGenerationRoot: baseGenerationRoot ?? snapshot?.reality?.realityRoot,
    transitionId: transitionId ?? `transition:rcl-spatial:${sourcePlan.plan_id}`,
    subject: subject ?? sourcePlan.subject,
    foundationTransition,
    projectionOptions,
    extensions: {
      ...clone(extensions),
      rclSpatialCommandLowering: clone({
        format: lowering.format,
        version: lowering.version,
        lowering_root: lowering.lowering_root,
        source_plan_id: lowering.source_plan_id,
        source_state_root: lowering.source_state_root,
        source_command_plan_root: lowering.source_command_plan_root,
        target_command_root: lowering.target_command_root,
        kernel_command_batch_root: lowering.kernel_command_batch?.batch_root ?? null,
      }),
    },
  });
}
