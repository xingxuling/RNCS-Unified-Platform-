import {clone, GenesisError, seal, stableId} from './canonical.mjs';
import {externalAssetProviderManifests} from './external-asset-providers.mjs';

export const ASSET_REQUIREMENT_FORMAT = 'ragf.asset-requirement.v0.1';

export function createWorldAssetRequirement(input = {}) {
  const role = String(input.role ?? input.functional_role ?? '').trim();
  if (!role) throw new GenesisError('WORLD_ASSET_ROLE_REQUIRED');
  const worldSeed = input.world_seed ?? input.worldSeed;
  if (!worldSeed) throw new GenesisError('WORLD_SEED_REQUIRED');
  const requirement = {
    format: ASSET_REQUIREMENT_FORMAT,
    version: '0.1.0',
    requirement_id: input.requirement_id ?? stableId('asset-requirement', {worldSeed, role, event: input.world_event ?? null}),
    source: input.source ?? 'ALWR.GameBrain',
    world_seed: clone(worldSeed),
    world_event: clone(input.world_event ?? {type: 'asset-needed', reason: 'world-state-requirement'}),
    role,
    asset_kind: input.asset_kind ?? 'character-3d',
    capabilities: [...new Set(input.capabilities ?? ['asset.generate.3d.production', 'asset.generate.mesh'])].sort(),
    post_capabilities: [...new Set(input.post_capabilities ?? [])].sort(),
    quality_tier: input.quality_tier ?? 'PRODUCTION',
    target_platforms: [...new Set(input.target_platforms ?? ['desktop', 'mobile', 'web'])].sort(),
    constraints: clone(input.constraints ?? {}),
    selection_policy: {
      prefer_procedural: Boolean(input.selection_policy?.prefer_procedural ?? false),
      allow_preview: Boolean(input.selection_policy?.allow_preview ?? false),
      require_seed_reproducibility: input.selection_policy?.require_seed_reproducibility ?? true,
      require_candidate_only: true
    },
    status: 'OPEN'
  };
  return seal({...requirement, requirement_root: ''}, 'requirement_root');
}

export function createVillageBlacksmithRequirement({worldSeed, constraints = {}, source = 'ALWR.GameBrain'} = {}) {
  return createWorldAssetRequirement({
    source,
    world_seed: typeof worldSeed === 'string' ? {seed: worldSeed} : worldSeed,
    world_event: {type: 'village-needs-role', village_role: 'blacksmith', trigger: 'settlement-genesis'},
    role: 'blacksmith',
    asset_kind: 'character-3d',
    capabilities: ['asset.generate.3d.production', 'asset.generate.mesh'],
    post_capabilities: ['asset.rig.predict', 'asset.skin.predict', 'asset.pose.initial'],
    quality_tier: 'PRODUCTION',
    constraints: {craft: 'forge', occupation: 'blacksmith', ...constraints}
  });
}

function capabilityMatches(manifest, requirement) {
  return requirement.capabilities.every(capability => manifest.capabilities.includes(capability));
}

export function resolveWorldAssetRequirement(requirement, manifests = externalAssetProviderManifests()) {
  if (!requirement?.requirement_root) throw new GenesisError('ASSET_REQUIREMENT_INVALID');
  const providerList = typeof manifests?.list === 'function' ? manifests.list() : manifests;
  const eligible = providerList.filter(manifest => capabilityMatches(manifest, requirement));
  const preview = requirement.selection_policy.allow_preview
    ? providerList.filter(manifest => manifest.capabilities.includes('asset.generate.3d.preview'))
    : [];
  const candidates = [...eligible, ...preview].filter((manifest, index, array) =>
    array.findIndex(item => item.id === manifest.id) === index
  );
  const selected = candidates.find(manifest => manifest.metadata?.quality_tier === requirement.quality_tier) ?? candidates[0] ?? null;
  return seal({
    format: 'ragf.asset-requirement-resolution.v0.1',
    version: '0.1.0',
    requirement_id: requirement.requirement_id,
    requirement_root: requirement.requirement_root,
    selected_provider_id: selected?.id ?? null,
    selected_provider_root: selected?.manifest_root ?? null,
    candidates: candidates.map(manifest => ({
      provider_id: manifest.id,
      provider_root: manifest.manifest_root,
      quality_tier: manifest.metadata?.quality_tier ?? 'UNKNOWN',
      capabilities: clone(manifest.capabilities),
      execution_mode: manifest.executionMode,
      runtime_status: manifest.runtimeStatus,
      commercial_release_allowed: manifest.commercialPolicy?.default_release_dependency_allowed === true
    })),
    unresolved: selected ? [] : requirement.capabilities,
    eligible: Boolean(selected),
    status: selected ? 'RESOLVED_TO_CANDIDATE_PROVIDER' : 'UNRESOLVED',
    resolution_root: ''
  }, 'resolution_root');
}

export function createWorldAssetPlacementCandidate({requirement, candidate, court, placement = {}} = {}) {
  if (!requirement?.requirement_root || !candidate?.candidate_root || !court?.court_root) {
    throw new GenesisError('WORLD_ASSET_PLACEMENT_INPUT_REQUIRED');
  }
  return seal({
    format: 'ragf.world-asset-placement-candidate.v0.1',
    version: '0.1.0',
    placement_id: stableId('world-asset-placement', {requirement: requirement.requirement_root, candidate: candidate.candidate_root, placement}),
    requirement_id: requirement.requirement_id,
    requirement_root: requirement.requirement_root,
    world_seed: clone(requirement.world_seed),
    role: requirement.role,
    candidate_id: candidate.candidate_id,
    candidate_root: candidate.candidate_root,
    court_root: court.court_root,
    transform: {
      position: placement.position ?? [0, 0, 0],
      rotation: placement.rotation ?? [0, 0, 0, 1],
      scale: placement.scale ?? [1, 1, 1]
    },
    authoritative_world_state_mutated: false,
    status: court.pass ? 'READY_FOR_WORLD_COMMIT' : 'REJECTED_BY_COURT',
    placement_root: ''
  }, 'placement_root');
}
