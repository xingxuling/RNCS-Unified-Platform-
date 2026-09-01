import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {
  AssetProviderAdapter,
  AssetProviderRegistry,
  ProviderRegistry,
  createAssetCandidateFromProviderResult,
  createAssetEvidenceLedger,
  deriveGenomeFromIntent,
  evaluateAssetProductionCourt,
  externalAssetProviderManifests,
  generateAssetWorkspace,
  normalizeIntent,
  rootHash,
  seal,
  stableId,
  validateGenome,
  validateIntent,
  verifyAssetEvidenceLedger,
  verifyWorkspace,
  builtinProviders,
  clone,
  GenesisError
} from '@taowind/reality-asset-genesis-fabric';

export const UNIVERSAL_ART_ASSET_FORGE_FORMAT = 'urrf.universal-art-asset-forge.v0.1';
export const UNIVERSAL_ART_ASSET_GENOME_FORMAT = 'urrf.universal-art-asset-genome.v0.1';
export const UNIVERSAL_ART_ASSET_PROVIDER_RESOLUTION_FORMAT = 'urrf.universal-art-asset-provider-resolution.v0.1';
export const UNIVERSAL_ART_ASSET_ACCEPTANCE_FORMAT = 'urrf.universal-art-asset-acceptance.v0.1';
export const UNIVERSAL_ART_ASSET_FORGE_VERSION = '0.1.0';

export const UNIVERSAL_ART_ASSET_PROFILES = Object.freeze([
  'character',
  'creature',
  'prop',
  'vehicle',
  'structure',
  'environment',
  'vegetation',
  'resource',
  'vfx'
]);

export const UNIVERSAL_ART_ASSET_QUALITY_TIERS = Object.freeze(['PREVIEW', 'PRODUCTION', 'AAA']);

const STATIC_GATES = Object.freeze([
  'intent_gate',
  'genome_gate',
  'provider_execution_gate',
  'geometry_gate',
  'topology_gate',
  'uv_gate',
  'pbr_gate',
  'lod_gate',
  'collision_gate',
  'platform_gate',
  'provenance_license_gate',
  'art_direction_gate',
  'runtime_projection_gate',
  'quality_tier_gate',
  'human_review_gate'
]);

const CHARACTER_GATES = Object.freeze([...STATIC_GATES, 'rig_gate', 'animation_gate']);

const PROFILE_CONTRACTS = Object.freeze({
  character: {
    asset_kind: 'character-3d',
    builtin_reference: true,
    required_capabilities: ['asset.generate.3d.production', 'asset.generate.mesh', 'asset.generate.pbr'],
    optional_capabilities: ['asset.rig.predict', 'asset.skin.predict', 'asset.pose.initial'],
    required_gates: CHARACTER_GATES,
    requires_rig: true,
    requires_animation: true
  },
  prop: {
    asset_kind: 'prop-3d',
    builtin_reference: true,
    required_capabilities: ['asset.generate.3d.production', 'asset.generate.mesh', 'asset.generate.pbr'],
    optional_capabilities: [],
    required_gates: STATIC_GATES,
    requires_rig: false,
    requires_animation: false
  },
  creature: {
    asset_kind: 'creature-3d',
    builtin_reference: false,
    required_capabilities: ['asset.generate.3d.production', 'asset.generate.mesh', 'asset.generate.pbr'],
    optional_capabilities: ['asset.rig.predict', 'asset.skin.predict', 'asset.pose.initial'],
    required_gates: CHARACTER_GATES,
    requires_rig: true,
    requires_animation: true
  },
  vehicle: {
    asset_kind: 'vehicle-3d',
    builtin_reference: false,
    required_capabilities: ['asset.generate.3d.production', 'asset.generate.mesh', 'asset.generate.pbr'],
    optional_capabilities: ['asset.refine.geometry'],
    required_gates: STATIC_GATES,
    requires_rig: false,
    requires_animation: false
  },
  structure: {
    asset_kind: 'structure-3d',
    builtin_reference: false,
    required_capabilities: ['world.asset.generate.procedural', 'world.asset.building'],
    optional_capabilities: ['asset.refine.geometry'],
    required_gates: STATIC_GATES,
    requires_rig: false,
    requires_animation: false
  },
  environment: {
    asset_kind: 'environment-3d',
    builtin_reference: false,
    required_capabilities: ['world.asset.generate.procedural', 'world.asset.environment'],
    optional_capabilities: ['world.asset.terrain', 'world.asset.vegetation', 'asset.refine.geometry'],
    required_gates: STATIC_GATES,
    requires_rig: false,
    requires_animation: false
  },
  vegetation: {
    asset_kind: 'vegetation-3d',
    builtin_reference: false,
    required_capabilities: ['world.asset.generate.procedural', 'world.asset.vegetation'],
    optional_capabilities: ['asset.refine.geometry'],
    required_gates: STATIC_GATES,
    requires_rig: false,
    requires_animation: false
  },
  resource: {
    asset_kind: 'resource-3d',
    builtin_reference: false,
    required_capabilities: ['world.asset.generate.procedural', 'world.asset.rock'],
    optional_capabilities: ['asset.refine.geometry'],
    required_gates: STATIC_GATES,
    requires_rig: false,
    requires_animation: false
  },
  vfx: {
    asset_kind: 'vfx-3d',
    builtin_reference: false,
    required_capabilities: ['asset.generate.vfx'],
    optional_capabilities: [],
    required_gates: STATIC_GATES,
    requires_rig: false,
    requires_animation: false
  }
});

const PROFILE_ALIASES = Object.freeze({
  'character-3d': 'character',
  'creature-3d': 'creature',
  'prop-3d': 'prop',
  'vehicle-3d': 'vehicle',
  'structure-3d': 'structure',
  'environment-3d': 'environment',
  'vegetation-3d': 'vegetation',
  'resource-3d': 'resource',
  'vfx-3d': 'vfx'
});

const PASS_STATUSES = new Set(['PASS', 'PASSED', 'VALID', 'VERIFIED', 'AVAILABLE', 'COMPLETED', 'READY']);

const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

function statusValue(value) {
  if (value === true) return 'PASS';
  if (value === false || value === null || value === undefined) return 'NOT_RUN';
  if (typeof value === 'object') return statusValue(value.status ?? value.result ?? value.outcome);
  return String(value).trim().toUpperCase() || 'NOT_RUN';
}

function statusPass(value) {
  return PASS_STATUSES.has(statusValue(value));
}

function normalizeProfile(input = {}) {
  const raw = String(input.asset_profile ?? input.profile ?? PROFILE_ALIASES[String(input.asset_kind ?? '').toLowerCase()] ?? 'prop').trim().toLowerCase();
  if (!UNIVERSAL_ART_ASSET_PROFILES.includes(raw)) throw new GenesisError('UNIVERSAL_ART_ASSET_PROFILE_INVALID', raw);
  return raw;
}

function normalizeQualityTier(input = {}) {
  const raw = String(input.quality_tier ?? input.qualityTier ?? input.target_quality ?? input.targetQuality ?? 'AAA').trim().toUpperCase();
  if (!UNIVERSAL_ART_ASSET_QUALITY_TIERS.includes(raw)) throw new GenesisError('UNIVERSAL_ART_ASSET_QUALITY_TIER_INVALID', raw);
  return raw;
}

function profileContract(profile) {
  const contract = PROFILE_CONTRACTS[profile];
  if (!contract) throw new GenesisError('UNIVERSAL_ART_ASSET_PROFILE_INVALID', profile);
  return contract;
}

function mergeRecord(base, patch) {
  const out = clone(base ?? {});
  for (const [key, value] of Object.entries(record(patch))) {
    if (value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
      out[key] = mergeRecord(out[key], value);
    } else {
      out[key] = clone(value);
    }
  }
  return out;
}

function requiredGatesFor(profile, overrides = {}) {
  const contract = profileContract(profile);
  const source = Array.isArray(overrides.required_gates) && overrides.required_gates.length
    ? overrides.required_gates
    : contract.required_gates;
  const allowed = new Set([...STATIC_GATES, 'rig_gate', 'animation_gate']);
  const gates = [...new Set(source.map(String).filter(gate => allowed.has(gate)))];
  if (!gates.length) throw new GenesisError('UNIVERSAL_ART_ASSET_REQUIRED_GATES_EMPTY');
  return gates;
}

function defaultRepresentationContract(profile, intent) {
  const character = profileContract(profile).requires_rig;
  return {
    geometry: {
      representation: 'mesh',
      topology: 'manifold-or-provider-declared-exception',
      normals: 'consistent',
      bounds: 'finite',
      watertight_required: profile !== 'vfx'
    },
    surface: {
      material_model: 'metallic-roughness',
      channels: ['base-color', 'normal', 'occlusion-roughness-metallic', 'emissive'],
      uv_required: true,
      max_texture_size: intent.constraints.max_texture_size,
      pbr_texture_size: intent.constraints.pbr_texture_size
    },
    rig_motion: {
      rig_required: character,
      animation_required: profileContract(profile).requires_animation,
      max_bones: intent.constraints.max_bones,
      animation_fps: intent.constraints.animation_fps
    },
    lod: {
      levels_required: String(intent.asset_kind).includes('3d') ? 3 : 1,
      ratios: clone(intent.constraints.lod_ratios)
    },
    runtime: {
      target_platforms: clone(intent.target_platforms),
      vsr_projection_required: true,
      canonical_world_write: false
    }
  };
}

export function createUniversalArtAssetGenome(input = {}) {
  const profile = normalizeProfile(input);
  const qualityTier = normalizeQualityTier(input);
  const contract = profileContract(profile);
  const assetKind = String(input.asset_kind ?? contract.asset_kind).trim();
  const extensions = mergeRecord(input.extensions, {
    urrf_universal: {
      asset_profile: profile,
      quality_tier: qualityTier,
      generator_format: UNIVERSAL_ART_ASSET_FORGE_FORMAT
    }
  });
  const intent = normalizeIntent({...clone(input), asset_kind: assetKind, extensions});
  const ragfGenome = deriveGenomeFromIntent(intent);
  const requiredGates = requiredGatesFor(profile, input.acceptance_contract ?? {});
  const representationContract = mergeRecord(defaultRepresentationContract(profile, intent), input.representation_contract);
  representationContract.runtime = {
    ...record(representationContract.runtime),
    canonical_world_write: false
  };
  const acceptanceOverrides = record(input.acceptance_contract);
  const genome = {
    format: UNIVERSAL_ART_ASSET_GENOME_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    genome_id: stableId('urrf-universal-art-asset-genome', {intent: intent.intent_root, profile, qualityTier}),
    asset_id: ragfGenome.identity.asset_id,
    asset_profile: profile,
    asset_kind: assetKind,
    quality_tier: qualityTier,
    display_name: ragfGenome.identity.name,
    description: intent.description,
    intent_root: intent.intent_root,
    ragf_intent: intent,
    ragf_genome: ragfGenome,
    semantic_genome: {
      identity: clone(ragfGenome.identity),
      semantics: clone(ragfGenome.semantics),
      visual: clone(ragfGenome.visual),
      behavior: clone(ragfGenome.behavior),
      physical: clone(ragfGenome.physical)
    },
    representation_contract: representationContract,
    provider_contract: {
      required_capabilities: clone(input.provider_contract?.required_capabilities ?? contract.required_capabilities),
      optional_capabilities: clone(input.provider_contract?.optional_capabilities ?? contract.optional_capabilities),
      candidate_only: true,
      external_provider_may_be_unavailable: true
    },
    acceptance_contract: {
      target_quality_tier: qualityTier,
      required_gates: requiredGates,
      human_art_review_required: true,
      holdout_required: true,
      no_provider_success_shortcut: true,
      notes: clone(acceptanceOverrides.notes ?? null)
    },
    target_platforms: clone(intent.target_platforms),
    budgets: clone(ragfGenome.budgets),
    provenance_contract: {
      source_reference_required: true,
      provider_id_required: true,
      generator_version_required: true,
      seed_required: true,
      license_record_required: true,
      model_weights_audit_required: true
    },
    authority: {
      canonical_owner: 'RNCS',
      representation_owner: 'URRF',
      provider_can_write_authoritative_world_state: false,
      candidate_only: true,
      authoritative: false,
      canonical_write_authorized: false,
      rncs_authority_required: true
    },
    genome_root: ''
  };
  return seal(genome, 'genome_root');
}

export function verifyUniversalArtAssetGenome(genome) {
  const errors = [];
  if (!genome || typeof genome !== 'object' || Array.isArray(genome)) return {valid: false, errors: ['UNIVERSAL_ART_ASSET_GENOME_NOT_OBJECT']};
  try {
    if (genome.format !== UNIVERSAL_ART_ASSET_GENOME_FORMAT) errors.push('FORMAT_INVALID');
    if (genome.version !== UNIVERSAL_ART_ASSET_FORGE_VERSION) errors.push('VERSION_INVALID');
    if (!UNIVERSAL_ART_ASSET_PROFILES.includes(genome.asset_profile)) errors.push('PROFILE_INVALID');
    if (!UNIVERSAL_ART_ASSET_QUALITY_TIERS.includes(genome.quality_tier)) errors.push('QUALITY_TIER_INVALID');
    const intentValidation = validateIntent(genome.ragf_intent);
    if (!intentValidation.valid) errors.push(...intentValidation.errors.map(error => `RAGF_INTENT_${error}`));
    const genomeValidation = validateGenome(genome.ragf_genome);
    if (!genomeValidation.valid) errors.push(...genomeValidation.errors.map(error => `RAGF_GENOME_${error}`));
    if (genome.intent_root !== genome.ragf_intent?.intent_root) errors.push('INTENT_ROOT_MISMATCH');
    if (genome.ragf_genome?.intent_root !== genome.intent_root) errors.push('RAGF_GENOME_INTENT_ROOT_MISMATCH');
    if (genome.asset_id !== genome.ragf_genome?.identity?.asset_id) errors.push('ASSET_ID_MISMATCH');
    const expectedGates = new Set(profileContract(genome.asset_profile).required_gates);
    const actualGates = new Set(genome.acceptance_contract?.required_gates ?? []);
    if (![...expectedGates].every(gate => actualGates.has(gate))) errors.push('ACCEPTANCE_GATES_WEAKENED');
    if (genome.acceptance_contract?.target_quality_tier !== genome.quality_tier) errors.push('ACCEPTANCE_QUALITY_TIER_MISMATCH');
    if (genome.acceptance_contract?.human_art_review_required !== true || genome.acceptance_contract?.holdout_required !== true || genome.acceptance_contract?.no_provider_success_shortcut !== true) errors.push('ACCEPTANCE_POLICY_WEAKENED');
    if (genome.representation_contract?.runtime?.canonical_world_write !== false) errors.push('REPRESENTATION_CANONICAL_WRITE_ESCALATION');
    if (genome.authority?.provider_can_write_authoritative_world_state !== false) errors.push('PROVIDER_AUTHORITY_ESCALATION');
    if (genome.authority?.canonical_write_authorized !== false) errors.push('CANONICAL_WRITE_AUTHORITY_ESCALATION');
    if (genome.authority?.candidate_only !== true || genome.authority?.authoritative !== false) errors.push('AUTHORITY_BOUNDARY_INVALID');
    const copy = clone(genome);
    const actual = copy.genome_root;
    delete copy.genome_root;
    if (!actual || actual !== rootHash(copy)) errors.push('GENOME_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, genome_root: genome.genome_root ?? null};
}

function builtinProviderSummary() {
  const provider = builtinProviders().find(item => item.provider_id === 'provider:taowind:procedural-3d');
  return provider ? {
    provider_id: provider.provider_id,
    provider_root: provider.provider_root,
    mode: provider.mode,
    runtime_status: 'READY_REFERENCE',
    quality_tier: 'REFERENCE',
    capabilities: provider.capabilities.map(item => item.capability_id).sort()
  } : null;
}

export function resolveUniversalArtAssetProvider({genome, provider_id = null, providerId = null, provider = null, providers = []} = {}) {
  const checkedGenome = genome?.format === UNIVERSAL_ART_ASSET_GENOME_FORMAT ? genome : createUniversalArtAssetGenome(genome ?? {});
  const profile = checkedGenome.asset_profile;
  const contract = profileContract(profile);
  const suppliedManifest = provider?.manifest ?? (provider?.format === 'ragf.asset-provider-manifest.v0.1' ? provider : null);
  const explicitId = String(provider_id ?? providerId ?? suppliedManifest?.id ?? '').trim() || null;
  const externalRegistry = new AssetProviderRegistry([...externalAssetProviderManifests(), ...providers]);
  const externalNegotiation = externalRegistry.negotiate({
    capabilities: contract.required_capabilities,
    quality_tier: checkedGenome.quality_tier === 'PREVIEW' ? 'PREVIEW' : 'PRODUCTION',
    allow_preview: checkedGenome.quality_tier === 'PREVIEW'
  });
  const explicit = suppliedManifest ?? (explicitId ? externalRegistry.get(explicitId) : null);
  const explicitCapabilityGap = explicit
    ? contract.required_capabilities.filter(capability => !(explicit.capabilities ?? []).includes(capability))
    : [];
  const builtin = !explicitId && contract.builtin_reference ? builtinProviderSummary() : null;
  const candidates = externalNegotiation.candidates.map(candidate => ({...candidate, source: 'external-provider-contract'}));
  if (explicit) candidates.unshift({
    provider_id: explicit.id ?? explicit.provider_id,
    provider_root: explicit.manifest_root ?? explicit.provider_root ?? null,
    mode: explicit.executionMode ?? explicit.mode ?? null,
    runtime_status: explicit.runtimeStatus ?? explicit.runtime_status ?? null,
    quality_tier: explicit.metadata?.quality_tier ?? 'PRODUCTION',
    capabilities: clone(explicit.capabilities ?? []),
    source: 'injected-provider'
  });
  if (builtin) candidates.unshift({...builtin, source: 'ragf-reference-provider'});
  const selected = explicitId
    ? (explicitCapabilityGap.length ? null : explicit)
    : (builtin ?? (externalNegotiation.eligible ? externalNegotiation.selected_provider_id : null));
  const selectedManifest = typeof selected === 'object' ? selected : (selected ? externalRegistry.get(selected) : null);
  const resolution = {
    format: UNIVERSAL_ART_ASSET_PROVIDER_RESOLUTION_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    asset_id: checkedGenome.asset_id,
    asset_profile: profile,
    genome_root: checkedGenome.genome_root,
    required_capabilities: clone(contract.required_capabilities),
    optional_capabilities: clone(contract.optional_capabilities),
    selected_provider_id: selectedManifest?.id ?? selectedManifest?.provider_id ?? (typeof selected === 'string' ? selected : null),
    selected_provider_root: selectedManifest?.manifest_root ?? selectedManifest?.provider_root ?? null,
    selected_provider_source: (selectedManifest?.id ?? selectedManifest?.provider_id) === builtin?.provider_id
      ? 'ragf-reference-provider'
      : suppliedManifest
        ? 'injected-provider'
        : selectedManifest
          ? 'external-provider-contract'
          : null,
    candidates,
    unresolved: selectedManifest ? [] : [...new Set([...contract.required_capabilities, ...explicitCapabilityGap])],
    capability_gap: explicitCapabilityGap,
    eligible: Boolean(selectedManifest),
    runtime_status: selectedManifest?.runtimeStatus ?? selectedManifest?.runtime_status ?? (builtin ? 'READY_REFERENCE' : 'UNRESOLVED'),
    authority: {
      provider_can_write_authoritative_world_state: false,
      candidate_only: true,
      authoritative: false,
      rncs_authority_required: true
    },
    resolution_root: ''
  };
  return seal(resolution, 'resolution_root');
}

function resolveProviderAdapter({genome, options, resolution}) {
  const supplied = options.providerAdapter ?? options.provider ?? null;
  if (supplied && typeof supplied.generate === 'function' && supplied.manifest) {
    return {adapter: supplied, manifest: clone(supplied.manifest), source: 'injected-adapter'};
  }
  if (supplied?.manifest && typeof supplied.generate !== 'function') {
    const adapter = new AssetProviderAdapter(supplied.manifest, {runner: options.providerRunner ?? null, timeout: options.providerTimeout ?? 60000});
    return {adapter, manifest: clone(adapter.manifest), source: 'injected-manifest'};
  }
  if (supplied?.format === 'ragf.asset-provider-manifest.v0.1') {
    const adapter = new AssetProviderAdapter(supplied, {runner: options.providerRunner ?? null, timeout: options.providerTimeout ?? 60000});
    return {adapter, manifest: clone(adapter.manifest), source: 'injected-manifest'};
  }
  const explicitId = String(options.provider_id ?? options.providerId ?? '').trim();
  if (explicitId) {
    const manifests = [...externalAssetProviderManifests(), ...(Array.isArray(options.providers) ? options.providers : [])];
    const manifest = manifests.find(item => item.id === explicitId || item.provider_id === explicitId);
    if (!manifest) throw new GenesisError('UNIVERSAL_ART_ASSET_PROVIDER_NOT_FOUND', explicitId);
    const adapter = new AssetProviderAdapter(manifest, {
      runner: options.providerRunners?.[explicitId] ?? options.providerRunner ?? null,
      timeout: options.providerTimeout ?? 60000
    });
    return {adapter, manifest: clone(adapter.manifest), source: 'resolved-external-provider'};
  }
  if (resolution.selected_provider_source === 'external-provider-contract' && resolution.selected_provider_id) {
    const manifest = [...externalAssetProviderManifests(), ...(Array.isArray(options.providers) ? options.providers : [])]
      .find(item => item.id === resolution.selected_provider_id || item.provider_id === resolution.selected_provider_id);
    if (manifest && (options.executeResolvedExternalProvider === true || options.providerRunner)) {
      const adapter = new AssetProviderAdapter(manifest, {runner: options.providerRunner ?? null, timeout: options.providerTimeout ?? 60000});
      return {adapter, manifest: clone(adapter.manifest), source: 'resolved-external-provider'};
    }
  }
  return null;
}

function fileRoles(candidate, artifacts) {
  const source = candidate?.files ?? Object.values(artifacts ?? {}).flatMap(artifact => artifact?.files ?? []);
  return source.map(file => String(file.role ?? file.path ?? file.name ?? '').toLowerCase()).filter(Boolean);
}

function hasRole(roles, names) {
  return names.some(name => roles.some(role => role === name || role.includes(name)));
}

function evidenceValue(evidence, keys) {
  for (const key of keys) {
    const value = evidence?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function explicitEvidence(evidence, keys) {
  const value = evidenceValue(evidence, keys);
  return {present: value !== null, pass: statusPass(value), status: statusValue(value), value};
}

function candidateFacts({candidate, workspace, provider, providerEvidence = {}} = {}) {
  const selected = candidate ?? workspace?.candidates?.find(item => item.candidate_id === workspace.recommended_candidate_id) ?? null;
  const artifacts = selected?.artifacts ?? {};
  const direct = Boolean(selected?.format === 'ragf.asset-candidate.v0.1');
  const meshArtifact = artifacts['mesh-glb'];
  const pbrArtifact = artifacts['pbr-texture-pack'];
  const mesh = direct ? record(selected.geometry) : record(meshArtifact?.metadata);
  const pbr = direct ? record(selected.materials) : record(pbrArtifact?.metadata);
  const roles = fileRoles(direct ? selected : null, artifacts);
  const providerEvidenceMerged = mergeRecord(direct ? selected.provider_evidence : {}, providerEvidence);
  const workspaceReport = workspace?.reports?.find(report => report.candidate_id === selected?.candidate_id) ?? null;
  const providerManifest = provider?.manifest ?? provider ?? null;
  const provenance = direct ? record(selected.provenance) : {};
  const license = direct ? record(selected.license) : {};
  return {
    selected,
    artifacts,
    roles,
    mesh,
    pbr,
    providerEvidence: providerEvidenceMerged,
    workspaceReport,
    providerManifest,
    candidateQualityTier: selected?.quality_tier ?? null,
    meshValid: Boolean(meshArtifact || (mesh.glb_valid !== false && Number(mesh.triangle_count ?? 0) > 0)) && mesh.glb_valid !== false && Number(mesh.triangle_count ?? 0) > 0,
    triangleCount: Number(mesh.triangle_count ?? 0),
    pbrChannels: direct ? (selected?.pbr_channels?.length ?? 0) : Number(pbr.files?.length ?? pbr.channel_count ?? 0),
    pbrModel: pbr.material_model ?? pbr.pbr_model ?? null,
    rigPresent: Boolean(artifacts['skeleton-rig']) || hasRole(roles, ['skeleton-rig', 'rig-candidate', 'rig']),
    animationPresent: Boolean(artifacts['animation-clips']) || hasRole(roles, ['animation-clips', 'animations']),
    lodPresent: Boolean(artifacts['lod-manifest']) || hasRole(roles, ['mesh-lod1-glb', 'mesh-lod2-glb', 'lod-manifest']),
    collisionPresent: Boolean(artifacts['collision-shape']) || hasRole(roles, ['collision-shape', 'collision']),
    provenanceComplete: Boolean(
      provenance.provider_id &&
      provenance.upstream_url &&
      provenance.source_revision &&
      provenance.generator_version &&
      provenance.seed
    ),
    licenseVerified: license.status === 'VERIFIED' && Boolean(license.identifier),
    providerManifestLicense: providerManifest?.license?.status === 'VERIFIED' || providerManifest?.metadata?.license === 'Apache-2.0',
    direct
  };
}

function courtGate(providerCourt, name) {
  if (!providerCourt?.gates || providerCourt.gates[name] === undefined) return null;
  return Boolean(providerCourt.gates[name]);
}

function makeGate(name, required, pass, reason, source) {
  return {
    gate: name,
    required,
    status: required ? (pass ? 'PASS' : 'FAIL') : 'NOT_REQUIRED',
    pass: required ? Boolean(pass) : true,
    reason: required && !pass ? reason : null,
    source: source ?? 'derived'
  };
}

export function evaluateUniversalArtAssetAcceptance({
  genome,
  candidate = null,
  workspace = null,
  execution = {},
  provider = null,
  providerCourt = null,
  providerEvidence = {},
  humanReview = null,
  runtimeEvidence = null
} = {}) {
  const genomeVerification = verifyUniversalArtAssetGenome(genome);
  if (!genomeVerification.valid) throw new GenesisError('UNIVERSAL_ART_ASSET_GENOME_INVALID', genomeVerification.errors.join(','));
  const required = new Set(genome.acceptance_contract.required_gates);
  const facts = candidateFacts({candidate, workspace, provider, providerEvidence: mergeRecord(providerEvidence, {runtime: runtimeEvidence})});
  const evidence = facts.providerEvidence;
  const meshEvidence = explicitEvidence(evidence, ['geometry']);
  const topologyEvidence = explicitEvidence(evidence, ['topology']);
  const uvEvidence = explicitEvidence(evidence, ['uv', 'uv_unwrap']);
  const pbrEvidence = explicitEvidence(evidence, ['material_pbr', 'pbr']);
  const lodEvidence = explicitEvidence(evidence, ['lod_platform', 'lod']);
  const collisionEvidence = explicitEvidence(evidence, ['collision']);
  const provenanceEvidence = explicitEvidence(evidence, ['provenance']);
  const licenseEvidence = explicitEvidence(evidence, ['license']);
  const artDirectionEvidence = explicitEvidence(evidence, ['art_direction', 'artDirection']);
  const humanReviewEvidence = explicitEvidence(humanReview ?? evidence, ['human_review', 'humanReview']);
  const runtimeProjectionEvidence = explicitEvidence(evidence, ['vsr_projection', 'representation']);
  const qualityEvidence = explicitEvidence(evidence, ['quality_tier', 'quality']);
  const workspaceVerification = execution.workspace_verification ?? null;
  const executionPass = execution.status === 'COMPLETED' && (!workspaceVerification || workspaceVerification.valid === true);
  const runtimePass = runtimeProjectionEvidence.present
    ? runtimeProjectionEvidence.pass
    : Boolean(facts.workspaceReport?.runtime_validation?.valid === true);
  const pbrPass = (pbrEvidence.present ? pbrEvidence.pass : facts.pbrChannels >= 4) && facts.pbrChannels >= 3;
  const gates = [
    makeGate('intent_gate', required.has('intent_gate'), Boolean(genome.ragf_intent?.intent_root), 'INTENT_NOT_ROOTED', 'RAGF intent'),
    makeGate('genome_gate', required.has('genome_gate'), genomeVerification.valid, 'GENOME_INVALID', 'URRF/RAGF genome verification'),
    makeGate('provider_execution_gate', required.has('provider_execution_gate'), executionPass, execution.failure?.code ?? 'PROVIDER_NOT_EXECUTED', execution.mode ?? 'provider lifecycle'),
    makeGate('geometry_gate', required.has('geometry_gate'), facts.meshValid && (meshEvidence.present ? meshEvidence.pass : true) && courtGate(providerCourt, 'geometry_gate') !== false, 'GEOMETRY_OUTPUT_INVALID_OR_MISSING', meshEvidence.present ? 'provider evidence' : 'candidate metrics'),
    makeGate('topology_gate', required.has('topology_gate'), (topologyEvidence.present ? topologyEvidence.pass : statusPass(facts.mesh.topology_status)) && courtGate(providerCourt, 'topology_gate') !== false, 'TOPOLOGY_NOT_EXPLICITLY_VERIFIED', topologyEvidence.present ? 'provider evidence' : 'candidate topology status'),
    makeGate('uv_gate', required.has('uv_gate'), (uvEvidence.present ? uvEvidence.pass : statusPass(facts.mesh.uv_status ?? facts.pbr.uv_status)), 'UV_NOT_EXPLICITLY_VERIFIED', uvEvidence.present ? 'provider evidence' : 'candidate UV status'),
    makeGate('pbr_gate', required.has('pbr_gate'), pbrPass && courtGate(providerCourt, 'material_pbr_gate') !== false, 'PBR_CHANNELS_OR_MATERIAL_BINDING_INCOMPLETE', pbrEvidence.present ? 'provider evidence' : 'candidate PBR metadata'),
    makeGate('rig_gate', required.has('rig_gate'), facts.rigPresent && (explicitEvidence(evidence, ['rig']).present ? explicitEvidence(evidence, ['rig']).pass : !facts.direct), 'RIG_MISSING_OR_NOT_VERIFIED', facts.rigPresent ? 'candidate artifact' : 'provider evidence'),
    makeGate('animation_gate', required.has('animation_gate'), facts.animationPresent && (explicitEvidence(evidence, ['animation']).present ? explicitEvidence(evidence, ['animation']).pass : !facts.direct), 'ANIMATION_MISSING_OR_NOT_VERIFIED', facts.animationPresent ? 'candidate artifact' : 'provider evidence'),
    makeGate('lod_gate', required.has('lod_gate'), (lodEvidence.present ? lodEvidence.pass : facts.lodPresent) && courtGate(providerCourt, 'lod_platform_budget_gate') !== false, 'LOD_OR_PLATFORM_BUDGET_NOT_VERIFIED', lodEvidence.present ? 'provider evidence' : 'candidate artifact'),
    makeGate('collision_gate', required.has('collision_gate'), (collisionEvidence.present ? collisionEvidence.pass : facts.collisionPresent) && courtGate(providerCourt, 'collision_gate') !== false, 'COLLISION_NOT_VERIFIED', collisionEvidence.present ? 'provider evidence' : 'candidate artifact'),
    makeGate('platform_gate', required.has('platform_gate'), Boolean(evidence.platform?.status ? statusPass(evidence.platform) : facts.workspaceReport?.scores?.platform >= 6500), 'TARGET_PLATFORM_NOT_VERIFIED', evidence.platform ? 'provider evidence' : 'workspace report'),
    makeGate('provenance_license_gate', required.has('provenance_license_gate'), (provenanceEvidence.present ? provenanceEvidence.pass : facts.provenanceComplete) && (licenseEvidence.present ? licenseEvidence.pass : (facts.licenseVerified || facts.providerManifestLicense)) && courtGate(providerCourt, 'provenance_gate') !== false && courtGate(providerCourt, 'license_gate') !== false, 'PROVENANCE_OR_LICENSE_AUDIT_INCOMPLETE', provenanceEvidence.present || licenseEvidence.present ? 'provider evidence' : 'candidate/provider metadata'),
    makeGate('art_direction_gate', required.has('art_direction_gate'), artDirectionEvidence.present && artDirectionEvidence.pass, 'ART_DIRECTION_REVIEW_REQUIRED', 'explicit art-direction evidence'),
    makeGate('runtime_projection_gate', required.has('runtime_projection_gate'), runtimePass && courtGate(providerCourt, 'vsr_projection_gate') !== false, 'VSR_PROJECTION_NOT_EXECUTED_OR_VERIFIED', runtimeProjectionEvidence.present ? 'provider evidence' : 'workspace runtime report'),
    makeGate('quality_tier_gate', required.has('quality_tier_gate'), (qualityEvidence.present ? qualityEvidence.pass : facts.candidateQualityTier === genome.quality_tier) && (genome.quality_tier !== 'AAA' || qualityEvidence.present), 'AAA_QUALITY_NOT_PROVEN', qualityEvidence.present ? 'explicit provider quality evidence' : 'candidate quality tier'),
    makeGate('human_review_gate', required.has('human_review_gate'), humanReviewEvidence.present && humanReviewEvidence.pass, 'HUMAN_ART_REVIEW_REQUIRED', 'explicit human review receipt')
  ];
  const failures = gates.filter(gate => !gate.pass).map(gate => gate.gate);
  const pass = failures.length === 0;
  const acceptance = {
    format: UNIVERSAL_ART_ASSET_ACCEPTANCE_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    asset_id: genome.asset_id,
    asset_profile: genome.asset_profile,
    target_quality_tier: genome.quality_tier,
    genome_root: genome.genome_root,
    candidate_root: facts.selected?.candidate_root ?? null,
    provider_id: facts.providerManifest?.id ?? facts.providerManifest?.provider_id ?? null,
    gates,
    required_gates: [...required],
    failures,
    pass,
    aaa_verified: pass && genome.quality_tier === 'AAA',
    status: pass ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED',
    metrics: {
      triangle_count: facts.triangleCount,
      pbr_channel_count: facts.pbrChannels,
      pbr_model: facts.pbrModel,
      rig_present: facts.rigPresent,
      animation_present: facts.animationPresent,
      lod_present: facts.lodPresent,
      collision_present: facts.collisionPresent
    },
    authority: {
      provider_can_commit: false,
      acceptance_can_commit: false,
      rncs_authority_required: true,
      candidate_only: true,
      authoritative: false
    },
    evidence: {
      genome_verification: genomeVerification,
      provider_court_root: providerCourt?.court_root ?? null,
      workspace_verification: workspaceVerification,
      provider_evidence_root: evidence.evidence_root ?? rootHash(evidence)
    },
    acceptance_root: ''
  };
  return seal(acceptance, 'acceptance_root');
}

function ledgerProvider(provider) {
  if (!provider) return null;
  return {
    id: provider.id ?? provider.provider_id ?? null,
    provider_id: provider.id ?? provider.provider_id ?? null,
    manifest_root: provider.manifest_root ?? provider.provider_root ?? null
  };
}

function createLedger({genome, provider, job = null, result = null, candidate = null, acceptance}) {
  const ledger = createAssetEvidenceLedger({
    assetIntent: genome.ragf_intent,
    genome: genome.ragf_genome,
    provider: ledgerProvider(provider),
    job,
    result,
    candidate,
    court: {...acceptance, court_root: acceptance.acceptance_root}
  });
  const verification = verifyAssetEvidenceLedger(ledger);
  if (!verification.valid) throw new GenesisError('UNIVERSAL_ART_ASSET_EVIDENCE_LEDGER_INVALID', verification.errors.join(','));
  return {ledger, verification};
}

function ensureOutputDir(outDir) {
  if (!outDir) throw new GenesisError('UNIVERSAL_ART_ASSET_OUT_DIR_REQUIRED');
  const resolved = path.resolve(String(outDir));
  fs.mkdirSync(resolved, {recursive: true});
  return resolved;
}

function writeJson(outDir, name, value) {
  const target = path.join(outDir, name);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return target;
}

function materializeProviderFiles(outDir, result) {
  const root = path.join(outDir, 'provider-output');
  fs.mkdirSync(root, {recursive: true});
  const materialized = [];
  const skipped = [];
  for (const file of result?.files ?? []) {
    const relative = String(file.path ?? file.name ?? '').replace(/^[/\\]+/, '');
    if (!relative || relative.includes('..')) throw new GenesisError('UNIVERSAL_ART_ASSET_PROVIDER_OUTPUT_PATH_INVALID', relative);
    const target = path.resolve(root, relative);
    const rootPrefix = `${path.resolve(root)}${path.sep}`;
    if (!target.startsWith(rootPrefix)) throw new GenesisError('UNIVERSAL_ART_ASSET_PROVIDER_OUTPUT_PATH_INVALID', relative);
    if (!file.content) {
      skipped.push({path: relative, reason: 'CONTENT_NOT_INCLUDED'});
      continue;
    }
    const bytes = Buffer.from(String(file.content), 'base64');
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, bytes);
    materialized.push({
      path: path.relative(outDir, target).replaceAll('\\', '/'),
      role: file.role ?? null,
      byte_length: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      declared_sha256: file.sha256 ?? null
    });
  }
  return {root: path.relative(outDir, root).replaceAll('\\', '/'), materialized, skipped};
}

function forgeEnvelope({genome, resolution, execution, candidate, acceptance, ledger, outDir, status}) {
  return seal({
    format: UNIVERSAL_ART_ASSET_FORGE_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    forge_id: stableId('urrf-universal-art-asset-forge', {
      genome_root: genome.genome_root,
      candidate_root: candidate?.candidate_root ?? null,
      acceptance_root: acceptance.acceptance_root,
      evidence_ledger_root: ledger.ledger_root
    }),
    asset_id: genome.asset_id,
    asset_profile: genome.asset_profile,
    quality_tier: genome.quality_tier,
    genome_root: genome.genome_root,
    provider_resolution_root: resolution.resolution_root,
    execution: {
      mode: execution.mode,
      status: execution.status,
      provider_id: execution.provider_id ?? null,
      provider_root: execution.provider_root ?? null,
      workspace_root: execution.workspace_root ?? null,
      candidate_root: candidate?.candidate_root ?? null,
      failure_code: execution.failure?.code ?? null
    },
    candidate_root: candidate?.candidate_root ?? null,
    acceptance_root: acceptance.acceptance_root,
    evidence_ledger_root: ledger.ledger_root,
    output: {
      directory: outDir,
      genome: 'universal-art-asset-genome.json',
      provider_resolution: 'universal-art-asset-provider-resolution.json',
      acceptance: 'universal-art-asset-acceptance.json',
      evidence_ledger: 'universal-art-asset-evidence-ledger.json',
      workspace: execution.workspace_root ? 'workspace.json' : null
    },
    status,
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    authority: {
      canonical_owner: 'RNCS',
      representation_owner: 'URRF',
      provider_can_write_authoritative_world_state: false,
      provider_can_commit: false,
      acceptance_can_commit: false,
      rncs_authority_required: true
    },
    forge_root: ''
  }, 'forge_root');
}

function persistForge({outDir, genome, resolution, acceptance, evidence, forge, execution, candidate, providerResult = null, workspaceVerification = null}) {
  writeJson(outDir, 'universal-art-asset-genome.json', genome);
  writeJson(outDir, 'universal-art-asset-provider-resolution.json', resolution);
  writeJson(outDir, 'universal-art-asset-acceptance.json', acceptance);
  writeJson(outDir, 'universal-art-asset-evidence-ledger.json', evidence.ledger);
  writeJson(outDir, 'universal-art-asset-forge.json', forge);
  writeJson(outDir, 'universal-art-asset-execution.json', {
    ...execution,
    candidate_root: candidate?.candidate_root ?? null,
    workspace_verification: workspaceVerification
  });
  if (providerResult) writeJson(outDir, 'universal-art-asset-provider-result.json', providerResult);
}

function generateWithReferenceWorkspace({genome, resolution, outDir, options}) {
  const providers = Array.isArray(options.workspaceProviders) ? options.workspaceProviders : [];
  const workspace = generateAssetWorkspace(genome.ragf_intent, {
    outDir,
    providers,
    previousWorkspace: options.previousWorkspace ?? null,
    regenerationPlan: options.regenerationPlan ?? null
  });
  const workspaceVerification = verifyWorkspace(workspace, {baseDir: outDir, verifyFiles: options.verifyFiles !== false});
  const candidate = workspace.candidates.find(item => item.candidate_id === workspace.recommended_candidate_id) ?? null;
  const providerRegistry = new ProviderRegistry([...builtinProviders(), ...providers]);
  const provider = candidate?.provider_roots?.map(root => providerRegistry.list().find(item => item.provider_root === root)).find(Boolean) ?? null;
  const execution = {
    mode: 'RAGF_REFERENCE_WORKSPACE',
    status: workspaceVerification.valid ? 'COMPLETED' : 'FAILED',
    provider_id: provider?.provider_id ?? null,
    provider_root: provider?.provider_root ?? null,
    workspace_root: workspace.workspace_root,
    workspace_verification: workspaceVerification,
    failure: workspaceVerification.valid ? null : {code: 'RAGF_WORKSPACE_VERIFICATION_FAILED', errors: workspaceVerification.errors}
  };
  const acceptance = evaluateUniversalArtAssetAcceptance({genome, workspace, candidate, execution, provider});
  const evidence = createLedger({genome, provider, candidate, acceptance});
  const status = acceptance.pass ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED';
  const forge = forgeEnvelope({genome, resolution, execution, candidate, acceptance, ledger: evidence.ledger, outDir, status});
  persistForge({outDir, genome, resolution, acceptance, evidence, forge, execution, candidate, workspaceVerification});
  return {status, forge, genome, resolution, execution, workspace, workspaceVerification, candidate, acceptance, evidenceLedger: evidence.ledger, evidenceVerification: evidence.verification};
}

function generateWithProvider({genome, resolution, outDir, options, adapterInfo}) {
  const execution = adapterInfo.adapter.generate({
    genome: genome.ragf_genome,
    asset_id: genome.asset_id,
    quality_tier: genome.quality_tier === 'AAA' ? 'PRODUCTION' : genome.quality_tier,
    seed: genome.ragf_genome.seed,
    request: {
      format: UNIVERSAL_ART_ASSET_FORGE_FORMAT,
      universal_genome_root: genome.genome_root,
      asset_profile: genome.asset_profile,
      target_quality_tier: genome.quality_tier,
      representation_contract: genome.representation_contract
    }
  });
  let candidate = null;
  let providerCourt = null;
  if (execution.result) {
    candidate = createAssetCandidateFromProviderResult({
      result: execution.result,
      provider: execution.provider,
      job: execution.job,
      genome: genome.ragf_genome,
      assetIntent: genome.ragf_intent
    });
    providerCourt = evaluateAssetProductionCourt({candidate, provider: execution.provider, genome: genome.ragf_genome});
  }
  const materialization = execution.result ? materializeProviderFiles(outDir, execution.result) : null;
  const executionEnvelope = {
    mode: 'RAGF_EXTERNAL_PROVIDER',
    status: execution.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
    provider_id: execution.provider?.id ?? adapterInfo.manifest?.id ?? null,
    provider_root: execution.provider?.manifest_root ?? adapterInfo.manifest?.manifest_root ?? null,
    job: execution.job ?? null,
    failure: execution.failure ?? null,
    materialization
  };
  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome,
    candidate,
    execution: executionEnvelope,
    provider: execution.provider ?? adapterInfo.manifest,
    providerCourt,
    providerEvidence: options.providerEvidence ?? {},
    humanReview: options.humanReview ?? null,
    runtimeEvidence: options.runtimeEvidence ?? null
  });
  const evidence = createLedger({genome, provider: execution.provider ?? adapterInfo.manifest, job: execution.job, result: execution.result, candidate, acceptance});
  const status = acceptance.pass ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED';
  const forge = forgeEnvelope({genome, resolution, execution: executionEnvelope, candidate, acceptance, ledger: evidence.ledger, outDir, status});
  persistForge({outDir, genome, resolution, acceptance, evidence, forge, execution: executionEnvelope, candidate, providerResult: execution.result});
  return {status, forge, genome, resolution, execution: executionEnvelope, providerExecution: execution, candidate, providerCourt, acceptance, evidenceLedger: evidence.ledger, evidenceVerification: evidence.verification, materialization};
}

function generateBlocked({genome, resolution, outDir, execution}) {
  const acceptance = evaluateUniversalArtAssetAcceptance({genome, execution});
  const evidence = createLedger({genome, provider: null, acceptance});
  const forge = forgeEnvelope({genome, resolution, execution, candidate: null, acceptance, ledger: evidence.ledger, outDir, status: 'BLOCKED'});
  persistForge({outDir, genome, resolution, acceptance, evidence, forge, execution, candidate: null});
  return {status: 'BLOCKED', forge, genome, resolution, execution, candidate: null, acceptance, evidenceLedger: evidence.ledger, evidenceVerification: evidence.verification};
}

export function generateUniversalArtAsset(input = {}, options = {}) {
  const outDir = ensureOutputDir(options.outDir);
  const genome = input.format === UNIVERSAL_ART_ASSET_GENOME_FORMAT ? clone(input) : createUniversalArtAssetGenome(input);
  const genomeVerification = verifyUniversalArtAssetGenome(genome);
  if (!genomeVerification.valid) throw new GenesisError('UNIVERSAL_ART_ASSET_GENOME_INVALID', genomeVerification.errors.join(','));
  const resolution = resolveUniversalArtAssetProvider({
    genome,
    provider_id: options.provider_id ?? options.providerId,
    provider: options.providerAdapter ?? options.provider ?? null,
    providers: options.providers ?? []
  });
  const adapterInfo = resolveProviderAdapter({genome, options, resolution});
  if (adapterInfo) {
    const missingCapabilities = profileContract(genome.asset_profile).required_capabilities
      .filter(capability => !(adapterInfo.manifest.capabilities ?? []).includes(capability));
    if (missingCapabilities.length) {
      return generateBlocked({
        genome,
        resolution,
        outDir,
        execution: {
          mode: 'PROVIDER_RESOLUTION',
          status: 'FAILED',
          provider_id: adapterInfo.manifest.id ?? adapterInfo.manifest.provider_id ?? null,
          provider_root: adapterInfo.manifest.manifest_root ?? adapterInfo.manifest.provider_root ?? null,
          failure: {code: 'PROVIDER_CAPABILITY_MISMATCH', detail: missingCapabilities}
        }
      });
    }
    return generateWithProvider({genome, resolution, outDir, options, adapterInfo});
  }
  if (PROFILE_CONTRACTS[genome.asset_profile]?.builtin_reference) return generateWithReferenceWorkspace({genome, resolution, outDir, options});
  return generateBlocked({
    genome,
    resolution,
    outDir,
    execution: {
      mode: 'PROVIDER_RESOLUTION',
      status: 'FAILED',
      failure: {
        code: resolution.eligible ? 'PROFILE_PROVIDER_RUNTIME_NOT_BOUND' : 'PROFILE_PROVIDER_UNRESOLVED',
        detail: resolution.unresolved
      }
    }
  });
}

export function verifyUniversalArtAssetForge({forge, genome, acceptance, evidenceLedger} = {}) {
  const errors = [];
  if (forge?.format !== UNIVERSAL_ART_ASSET_FORGE_FORMAT) errors.push('FORGE_FORMAT_INVALID');
  if (forge?.version !== UNIVERSAL_ART_ASSET_FORGE_VERSION) errors.push('FORGE_VERSION_INVALID');
  if (forge?.candidate_only !== true || forge?.authoritative !== false || forge?.canonical_write_authorized !== false) errors.push('FORGE_AUTHORITY_INVALID');
  if (forge?.authority?.provider_can_write_authoritative_world_state !== false || forge?.authority?.provider_can_commit !== false) errors.push('FORGE_PROVIDER_AUTHORITY_INVALID');
  if (genome) {
    const result = verifyUniversalArtAssetGenome(genome);
    if (!result.valid) errors.push(...result.errors.map(error => `GENOME_${error}`));
    if (forge?.genome_root !== genome.genome_root) errors.push('FORGE_GENOME_ROOT_MISMATCH');
  }
  if (acceptance) {
    const copy = clone(acceptance);
    const actual = copy.acceptance_root;
    delete copy.acceptance_root;
    if (!actual || actual !== rootHash(copy)) errors.push('ACCEPTANCE_ROOT_INVALID');
    if (forge?.acceptance_root !== actual) errors.push('FORGE_ACCEPTANCE_ROOT_MISMATCH');
  }
  if (evidenceLedger) {
    const result = verifyAssetEvidenceLedger(evidenceLedger);
    if (!result.valid) errors.push(...result.errors.map(error => `EVIDENCE_${error}`));
    if (forge?.evidence_ledger_root !== evidenceLedger.ledger_root) errors.push('FORGE_EVIDENCE_ROOT_MISMATCH');
  }
  const copy = clone(forge ?? {});
  const actual = copy.forge_root;
  delete copy.forge_root;
  if (!actual || actual !== rootHash(copy)) errors.push('FORGE_ROOT_INVALID');
  return {valid: errors.length === 0, errors, forge_root: forge?.forge_root ?? null};
}
