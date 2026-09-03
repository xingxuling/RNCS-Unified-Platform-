import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {
  AssetProviderAdapter,
  AssetProviderRegistry,
  auditExternalProviderLicenses,
  ProviderRegistry,
  createAssetCandidateFromProviderResult,
  createAssetEvidenceLedger,
  deriveGenomeFromIntent,
  evaluateAssetProductionCourt,
  externalAssetProviderManifests,
  generateAssetWorkspace,
  inspectGlb,
  inspectKtx2,
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
export const UNIVERSAL_ART_ASSET_FILE_INSPECTION_FORMAT = 'urrf.universal-art-asset-file-inspection.v0.1';
export const UNIVERSAL_ART_ASSET_REVIEW_RECEIPT_FORMAT = 'urrf.universal-art-asset-review-receipt.v0.1';
export const UNIVERSAL_ART_ASSET_QUALITY_PROOF_FORMAT = 'urrf.universal-art-asset-quality-proof.v0.1';
export const UNIVERSAL_ART_ASSET_PROVENANCE_LICENSE_RECEIPT_FORMAT = 'urrf.universal-art-asset-provenance-license-receipt.v0.1';
export const UNIVERSAL_ART_ASSET_EVIDENCE_BUNDLE_FORMAT = 'urrf.universal-art-asset-evidence-bundle.v0.1';
export const UNIVERSAL_ART_ASSET_BATCH_FORMAT = 'urrf.universal-art-asset-batch.v0.1';
export const UNIVERSAL_ART_ASSET_ASSEMBLY_FORMAT = 'urrf.universal-art-asset-assembly.v0.1';
export const UNIVERSAL_ART_ASSET_VSR_PROJECTION_FORMAT = 'urrf.universal-art-asset-vsr-projection.v0.1';
export const UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_FORMAT = 'urrf.universal-art-asset-vsr-materialization.v0.1';
export const UNIVERSAL_ART_ASSET_HOLDOUT_FORMAT = 'urrf.universal-art-asset-holdout.v0.1';
export const UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_FORMAT = 'urrf.universal-art-asset-profile-coverage.v0.1';
export const UNIVERSAL_ART_ASSET_PROVIDER_PREFLIGHT_FORMAT = 'urrf.universal-art-asset-provider-preflight.v0.1';
export const UNIVERSAL_ART_ASSET_PROVIDER_EXECUTION_FORMAT = 'urrf.universal-art-asset-provider-execution.v0.1';
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

const UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_MODES = Object.freeze([
  'BUILTIN_REFERENCE',
  'EXTERNAL_CONTRACT_ONLY',
  'EXTERNAL_EXECUTED',
  'INJECTED_EXECUTED',
  'UNRESOLVED',
  'INCONSISTENT'
]);

const UNIVERSAL_ART_ASSET_PROVIDER_PREFLIGHT_ROUTE_STATUSES = Object.freeze([
  'BUILTIN_REFERENCE_READY',
  'EXTERNAL_CONTRACT_ONLY',
  'EXTERNAL_RUNTIME_BOUND',
  'UNRESOLVED',
  'INCONSISTENT'
]);

const UNIVERSAL_ART_ASSET_REVIEW_KINDS = Object.freeze(['ART_DIRECTION', 'HUMAN_ART']);

const STATIC_GATES = Object.freeze([
  'intent_gate',
  'genome_gate',
  'provider_execution_gate',
  'geometry_gate',
  'topology_gate',
  'uv_gate',
  'normal_gate',
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
  const value = record(input);
  const assetKind = String(value.asset_kind ?? '').trim().toLowerCase();
  const raw = String(value.asset_profile ?? value.profile ?? PROFILE_ALIASES[assetKind] ?? (assetKind || 'prop')).trim().toLowerCase();
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
  const selectedProviderId = selectedManifest?.id ?? selectedManifest?.provider_id ?? null;
  const resolution = {
    format: UNIVERSAL_ART_ASSET_PROVIDER_RESOLUTION_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    asset_id: checkedGenome.asset_id,
    asset_profile: profile,
    genome_root: checkedGenome.genome_root,
    required_capabilities: clone(contract.required_capabilities),
    optional_capabilities: clone(contract.optional_capabilities),
    selected_provider_id: selectedProviderId ?? (typeof selected === 'string' ? selected : null),
    selected_provider_root: selectedManifest?.manifest_root ?? selectedManifest?.provider_root ?? null,
    selected_provider_source: selectedProviderId && builtin?.provider_id && selectedProviderId === builtin.provider_id
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

const GLB_COMPONENTS = Object.freeze({
  5120: {bytes: 1, read: (buffer, offset) => buffer.readInt8(offset), normalize: value => Math.max(-1, value / 127)},
  5121: {bytes: 1, read: (buffer, offset) => buffer.readUInt8(offset), normalize: value => value / 255},
  5122: {bytes: 2, read: (buffer, offset) => buffer.readInt16LE(offset), normalize: value => Math.max(-1, value / 32767)},
  5123: {bytes: 2, read: (buffer, offset) => buffer.readUInt16LE(offset), normalize: value => value / 65535},
  5125: {bytes: 4, read: (buffer, offset) => buffer.readUInt32LE(offset), normalize: value => value / 4294967295},
  5126: {bytes: 4, read: (buffer, offset) => buffer.readFloatLE(offset), normalize: value => value}
});

const GLB_ACCESSOR_COMPONENTS = Object.freeze({SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16});

function parseGlbForInspection(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer ?? []);
  const base = inspectGlb(bytes);
  const errors = [...(base.errors ?? [])];
  let binary = null;
  if (base.json) {
    const jsonLength = bytes.length >= 20 ? bytes.readUInt32LE(12) : 0;
    let cursor = 20 + jsonLength;
    while (cursor + 8 <= bytes.length) {
      const chunkLength = bytes.readUInt32LE(cursor);
      const chunkType = bytes.readUInt32LE(cursor + 4);
      const chunkEnd = cursor + 8 + chunkLength;
      if (chunkEnd > bytes.length) {
        errors.push('GLB_CHUNK_TRUNCATED');
        break;
      }
      if (chunkType === 0x004e4942) binary = bytes.subarray(cursor + 8, chunkEnd);
      cursor = chunkEnd;
    }
    if (!binary) errors.push('GLB_BINARY_CHUNK_MISSING');
    const declaredLength = Number(base.json.buffers?.[0]?.byteLength ?? 0);
    if (binary && declaredLength > binary.length) errors.push('GLB_BINARY_LENGTH_MISMATCH');
  }
  return {bytes, base, json: base.json, binary, errors};
}

function decodeGlbAccessor({json, binary, index}) {
  const accessor = json?.accessors?.[index];
  if (!accessor || !Number.isInteger(accessor.count) || accessor.count < 0) throw new Error(`ACCESSOR_INVALID:${index}`);
  if (accessor.sparse) throw new Error(`ACCESSOR_SPARSE_UNSUPPORTED:${index}`);
  const component = GLB_COMPONENTS[accessor.componentType];
  const componentCount = GLB_ACCESSOR_COMPONENTS[accessor.type];
  const view = json.bufferViews?.[accessor.bufferView];
  if (!component || !componentCount || !view || view.buffer !== 0) throw new Error(`ACCESSOR_LAYOUT_INVALID:${index}`);
  const elementBytes = component.bytes * componentCount;
  const stride = Number(view.byteStride ?? elementBytes);
  const viewOffset = Number(view.byteOffset ?? 0);
  const accessorOffset = Number(accessor.byteOffset ?? 0);
  if (!Number.isInteger(stride) || stride < elementBytes || !Number.isInteger(viewOffset) || !Number.isInteger(accessorOffset)) {
    throw new Error(`ACCESSOR_STRIDE_INVALID:${index}`);
  }
  const start = viewOffset + accessorOffset;
  const end = accessor.count ? start + (accessor.count - 1) * stride + elementBytes : start;
  if (start < 0 || end > binary.length) throw new Error(`ACCESSOR_BINARY_RANGE_INVALID:${index}`);
  const values = [];
  for (let row = 0; row < accessor.count; row++) {
    const rowValues = [];
    for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
      const offset = start + row * stride + componentIndex * component.bytes;
      const raw = component.read(binary, offset);
      rowValues.push(accessor.normalized ? component.normalize(raw) : raw);
    }
    values.push(rowValues);
  }
  return {accessor, values};
}

function vectorStats(values, size) {
  const min = Array(size).fill(Infinity);
  const max = Array(size).fill(-Infinity);
  let finite = true;
  for (const row of values) {
    if (!Array.isArray(row) || row.length !== size || row.some(value => !Number.isFinite(value))) finite = false;
    for (let index = 0; index < size; index++) {
      const value = Number(row?.[index]);
      if (Number.isFinite(value)) {
        min[index] = Math.min(min[index], value);
        max[index] = Math.max(max[index], value);
      }
    }
  }
  return {finite, min: min.map(value => Number.isFinite(value) ? value : null), max: max.map(value => Number.isFinite(value) ? value : null)};
}

function normalStats(values) {
  const lengths = values.map(value => Math.hypot(...value));
  const finite = values.length > 0 && lengths.every(value => Number.isFinite(value));
  const nonZero = finite && lengths.every(value => value > 0.000001);
  const unitLike = nonZero && lengths.every(value => value >= 0.5 && value <= 1.5);
  return {
    status: finite && nonZero && unitLike ? 'PASS' : 'FAIL',
    finite,
    non_zero: nonZero,
    unit_like: unitLike,
    min_length: lengths.length ? Math.min(...lengths) : null,
    max_length: lengths.length ? Math.max(...lengths) : null,
    method: 'FINITE_NONZERO_UNIT_NORMALS_V1'
  };
}

function uvStats(values) {
  const summary = vectorStats(values, 2);
  const spans = summary.finite ? summary.min.map((value, index) => summary.max[index] - value) : [0, 0];
  const covered = spans.some(value => Number.isFinite(value) && value > 0.000001);
  return {
    status: summary.finite && covered ? 'PASS' : 'FAIL',
    finite: summary.finite,
    min: summary.min,
    max: summary.max,
    span: spans,
    non_constant: covered,
    out_of_unit_range_count: values.reduce((count, row) => count + (row.some(value => value < 0 || value > 1) ? 1 : 0), 0),
    method: 'FINITE_NONCONSTANT_TEXCOORD_0_V1'
  };
}

function inspectPbrMaterial(material, json, binary, materialIndex) {
  const errors = [];
  const pbr = record(material?.pbrMetallicRoughness);
  const channels = [
    ['base-color', pbr.baseColorTexture],
    ['normal', material?.normalTexture],
    ['occlusion-roughness-metallic', pbr.metallicRoughnessTexture],
    ['emissive', material?.emissiveTexture]
  ];
  if (!pbr.baseColorTexture) errors.push('PBR_BASE_COLOR_TEXTURE_MISSING');
  if (!material?.normalTexture) errors.push('PBR_NORMAL_TEXTURE_MISSING');
  if (!pbr.metallicRoughnessTexture) errors.push('PBR_METALLIC_ROUGHNESS_TEXTURE_MISSING');
  if (!material?.occlusionTexture) errors.push('PBR_OCCLUSION_TEXTURE_MISSING');
  if (!material?.emissiveTexture) errors.push('PBR_EMISSIVE_TEXTURE_MISSING');
  const references = [];
  for (const [channel, reference] of channels) {
    if (!reference || !Number.isInteger(reference.index)) {
      errors.push(`PBR_TEXTURE_REFERENCE_INVALID:${channel}`);
      continue;
    }
    const texture = json.textures?.[reference.index];
    const sourceIndex = texture?.source;
    const image = Number.isInteger(sourceIndex) ? json.images?.[sourceIndex] : null;
    if (!texture || !Number.isInteger(sourceIndex) || !image) {
      errors.push(`PBR_TEXTURE_SOURCE_INVALID:${channel}`);
      continue;
    }
    if (!Number.isInteger(image.bufferView)) {
      errors.push(`PBR_IMAGE_NOT_EMBEDDED:${channel}`);
      continue;
    }
    const view = json.bufferViews?.[image.bufferView];
    const offset = Number(view?.byteOffset ?? 0);
    const length = Number(view?.byteLength ?? 0);
    if (!view || view.buffer !== 0 || !Number.isInteger(offset) || !Number.isInteger(length) || length < 1 || offset < 0 || offset + length > binary.length) {
      errors.push(`PBR_IMAGE_BUFFER_RANGE_INVALID:${channel}`);
      continue;
    }
    references.push({channel, texture_index: reference.index, image_index: sourceIndex, image_mime: image.mimeType ?? null, byte_length: length});
  }
  const uniqueTextureCount = new Set(references.map(reference => reference.texture_index)).size;
  return {
    status: errors.length === 0 && references.length === channels.length ? 'PASS' : 'FAIL',
    material_index: materialIndex,
    material_name: material?.name ?? null,
    channels: references,
    channel_count: references.length,
    unique_texture_count: uniqueTextureCount,
    errors,
    method: 'GLB_MATERIAL_TEXTURE_BINDING_V1'
  };
}

function inspectPbrMaterialStructure(material, materialIndex) {
  const errors = [];
  const pbr = record(material?.pbrMetallicRoughness);
  const baseColorFactor = Array.isArray(pbr.baseColorFactor) ? pbr.baseColorFactor : [];
  const emissiveFactor = Array.isArray(material?.emissiveFactor) ? material.emissiveFactor : [];
  if (baseColorFactor.length !== 4 || baseColorFactor.some(value => !Number.isFinite(value))) errors.push('PBR_BASE_COLOR_FACTOR_INVALID');
  if (!Number.isFinite(Number(pbr.metallicFactor)) || !Number.isFinite(Number(pbr.roughnessFactor))) errors.push('PBR_METALLIC_ROUGHNESS_FACTOR_INVALID');
  if (emissiveFactor.length && emissiveFactor.some(value => !Number.isFinite(value))) errors.push('PBR_EMISSIVE_FACTOR_INVALID');
  return {
    status: errors.length === 0 && Object.keys(pbr).length > 0 ? 'PASS' : 'FAIL',
    material_index: materialIndex,
    material_name: material?.name ?? null,
    base_color_factor: baseColorFactor,
    metallic_factor: pbr.metallicFactor ?? null,
    roughness_factor: pbr.roughnessFactor ?? null,
    emissive_factor: emissiveFactor,
    errors,
    method: 'GLB_PBR_MATERIAL_FACTOR_STRUCTURE_V1'
  };
}

function inspectPbr(json, binary, externalPbr = null) {
  const materials = Array.isArray(json?.materials) ? json.materials : [];
  const hasEmbeddedReferences = materials.some(material => Boolean(
    material?.pbrMetallicRoughness?.baseColorTexture ||
    material?.pbrMetallicRoughness?.metallicRoughnessTexture ||
    material?.normalTexture ||
    material?.occlusionTexture ||
    material?.emissiveTexture
  ));
  if (!hasEmbeddedReferences && externalPbr?.status === 'PASS') {
    const materialReports = materials.map((material, index) => inspectPbrMaterialStructure(material, index));
    const errors = materialReports.flatMap(report => report.errors);
    return {
      status: materialReports.length > 0 && materialReports.every(report => report.status === 'PASS') ? 'PASS' : 'FAIL',
      binding: 'external-pbr-pack',
      external_pack_root: externalPbr.pack_root ?? null,
      material_count: materials.length,
      texture_count: externalPbr.texture_count ?? externalPbr.files?.length ?? 0,
      embedded_image_count: (json?.images ?? []).filter(image => Number.isInteger(image.bufferView)).length,
      channels: clone(externalPbr.channels ?? []),
      materials: materialReports,
      errors,
      method: 'GLB_MATERIAL_WITH_EXTERNAL_PBR_PACK_BINDING_V1'
    };
  }
  const materialReports = materials.map((material, index) => inspectPbrMaterial(material, json, binary, index));
  const errors = materialReports.flatMap(report => report.errors);
  return {
    status: materialReports.length > 0 && materialReports.every(report => report.status === 'PASS') ? 'PASS' : 'FAIL',
    binding: 'embedded-glb',
    material_count: materials.length,
    texture_count: json?.textures?.length ?? 0,
    embedded_image_count: (json?.images ?? []).filter(image => Number.isInteger(image.bufferView)).length,
    channels: materialReports.flatMap(report => report.channels),
    materials: materialReports,
    errors,
    method: 'GLB_MATERIAL_TEXTURE_BINDING_V1'
  };
}

function topologyStats(positions, indices) {
  const coordinateValues = positions.flat();
  const finitePositions = coordinateValues.length > 0 && coordinateValues.every(value => Number.isFinite(value));
  const extent = finitePositions
    ? Math.max(1, ...positions.reduce((ranges, row) => row.map((value, index) => Math.max(ranges[index], Math.abs(value))), [0, 0, 0]))
    : 1;
  const weldTolerance = Math.max(0.0000001, extent * 0.000001);
  const weldMap = new Map();
  const weldedIds = [];
  for (const position of positions) {
    const key = position.map(value => Math.round(value / weldTolerance)).join(':');
    let welded = weldMap.get(key);
    if (welded === undefined) {
      welded = weldMap.size;
      weldMap.set(key, welded);
    }
    weldedIds.push(welded);
  }
  const edges = new Map();
  let invalidIndexCount = 0;
  let repeatedIndexTriangleCount = 0;
  let geometricDegenerateTriangleCount = 0;
  let nonDegenerateTriangleCount = 0;
  const edge = (a, b) => {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    edges.set(key, (edges.get(key) ?? 0) + 1);
  };
  const triangleCount = Math.floor(indices.length / 3);
  for (let offset = 0; offset < triangleCount * 3; offset += 3) {
    const raw = indices.slice(offset, offset + 3);
    if (raw.some(value => !Number.isInteger(value) || value < 0 || value >= positions.length)) {
      invalidIndexCount++;
      continue;
    }
    if (new Set(raw).size !== 3) repeatedIndexTriangleCount++;
    const triangle = raw.map(index => weldedIds[index]);
    const [a, b, c] = triangle;
    const degenerate = new Set(triangle).size < 3;
    if (!degenerate) {
      const p0 = positions[raw[0]], p1 = positions[raw[1]], p2 = positions[raw[2]];
      const ab = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
      const ac = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
      const cross = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
      if (Math.hypot(...cross) <= weldTolerance * weldTolerance) geometricDegenerateTriangleCount++;
    }
    if (degenerate) {
      geometricDegenerateTriangleCount++;
      continue;
    }
    nonDegenerateTriangleCount++;
    edge(a, b);
    edge(b, c);
    edge(c, a);
  }
  const boundaryEdgeCount = [...edges.values()].filter(count => count === 1).length;
  const nonManifoldEdgeCount = [...edges.values()].filter(count => count > 2).length;
  const degenerateRatio = triangleCount ? geometricDegenerateTriangleCount / triangleCount : 1;
  const manifold = finitePositions && indices.length > 0 && indices.length % 3 === 0 && invalidIndexCount === 0 &&
    repeatedIndexTriangleCount === 0 && nonDegenerateTriangleCount >= 4 && degenerateRatio <= 0.5 &&
    boundaryEdgeCount === 0 && nonManifoldEdgeCount === 0;
  return {
    status: manifold ? 'PASS' : 'FAIL',
    manifold,
    finite_positions: finitePositions,
    indexed_triangle_list: indices.length > 0 && indices.length % 3 === 0,
    vertex_count: positions.length,
    welded_vertex_count: weldMap.size,
    triangle_count: triangleCount,
    non_degenerate_triangle_count: nonDegenerateTriangleCount,
    degenerate_triangle_count: geometricDegenerateTriangleCount,
    degenerate_triangle_ratio: degenerateRatio,
    invalid_index_count: invalidIndexCount,
    repeated_index_triangle_count: repeatedIndexTriangleCount,
    edge_count: edges.size,
    boundary_edge_count: boundaryEdgeCount,
    non_manifold_edge_count: nonManifoldEdgeCount,
    weld_tolerance: weldTolerance,
    qualification: manifold && geometricDegenerateTriangleCount > 0
      ? 'MANIFOLD_AFTER_POSITION_WELD_WITH_GEOMETRIC_DEGENERATES'
      : manifold ? 'MANIFOLD_AFTER_POSITION_WELD' : 'NOT_MANIFOLD',
    method: 'INDEXED_TRIANGLE_POSITION_WELD_EDGE_AUDIT_V1'
  };
}

function inspectGlbPrimitive(json, binary, meshIndex, primitiveIndex, primitive) {
  const errors = [];
  const mode = primitive.mode ?? 4;
  if (mode !== 4) errors.push(`PRIMITIVE_MODE_UNSUPPORTED:${mode}`);
  const attributes = record(primitive.attributes);
  const requiredAttributes = ['POSITION', 'NORMAL', 'TEXCOORD_0'];
  for (const attribute of requiredAttributes) if (!Number.isInteger(attributes[attribute])) errors.push(`ATTRIBUTE_MISSING:${attribute}`);
  if (!Number.isInteger(primitive.indices)) errors.push('INDICES_MISSING');
  let positions = [], normals = [], uvs = [], indices = [];
  let positionAccessor = null, normalAccessor = null, uvAccessor = null, indexAccessor = null;
  try {
    if (Number.isInteger(attributes.POSITION)) {
      const decoded = decodeGlbAccessor({json, binary, index: attributes.POSITION});
      positionAccessor = decoded.accessor;
      positions = decoded.values;
    }
    if (Number.isInteger(attributes.NORMAL)) {
      const decoded = decodeGlbAccessor({json, binary, index: attributes.NORMAL});
      normalAccessor = decoded.accessor;
      normals = decoded.values;
    }
    if (Number.isInteger(attributes.TEXCOORD_0)) {
      const decoded = decodeGlbAccessor({json, binary, index: attributes.TEXCOORD_0});
      uvAccessor = decoded.accessor;
      uvs = decoded.values;
    }
    if (Number.isInteger(primitive.indices)) {
      const decoded = decodeGlbAccessor({json, binary, index: primitive.indices});
      indexAccessor = decoded.accessor;
      indices = decoded.values.flat();
    }
  } catch (error) {
    errors.push(error.message);
  }
  if (positionAccessor?.type !== 'VEC3') errors.push('POSITION_ACCESSOR_TYPE_INVALID');
  if (normalAccessor?.type !== 'VEC3') errors.push('NORMAL_ACCESSOR_TYPE_INVALID');
  if (uvAccessor?.type !== 'VEC2') errors.push('TEXCOORD_0_ACCESSOR_TYPE_INVALID');
  if (indexAccessor && !['SCALAR'].includes(indexAccessor.type)) errors.push('INDEX_ACCESSOR_TYPE_INVALID');
  if (indexAccessor && ![5121, 5123, 5125].includes(indexAccessor.componentType)) errors.push('INDEX_COMPONENT_TYPE_INVALID');
  const attributeCountsMatch = positions.length > 0 && positions.length === normals.length && positions.length === uvs.length;
  if (!attributeCountsMatch) errors.push('ATTRIBUTE_COUNTS_MISMATCH');
  const normal = normalStats(normals);
  const uv = uvStats(uvs);
  const topology = topologyStats(positions, indices);
  const geometry = {
    status: errors.length === 0 && positions.length > 0 && topology.finite_positions ? 'PASS' : 'FAIL',
    vertex_count: positions.length,
    triangle_count: Math.floor(indices.length / 3),
    attribute_counts_match: attributeCountsMatch,
    attributes: Object.keys(attributes).sort(),
    method: 'GLB_ACCESSOR_STRUCTURE_V1'
  };
  return {
    mesh_index: meshIndex,
    primitive_index: primitiveIndex,
    mode,
    valid: errors.length === 0 && geometry.status === 'PASS' && topology.status === 'PASS' && uv.status === 'PASS' && normal.status === 'PASS',
    errors,
    geometry,
    topology,
    uv,
    normals: normal
  };
}

function inspectGlbBuffer(buffer, {logicalPath = null, role = null, lod = null, externalPbr = null} = {}) {
  const parsed = parseGlbForInspection(buffer);
  const primitiveReports = [];
  for (const [meshIndex, mesh] of (parsed.json?.meshes ?? []).entries()) {
    for (const [primitiveIndex, primitive] of (mesh.primitives ?? []).entries()) {
      if (parsed.binary) primitiveReports.push(inspectGlbPrimitive(parsed.json, parsed.binary, meshIndex, primitiveIndex, primitive));
    }
  }
  if (!primitiveReports.length) parsed.errors.push('MESH_PRIMITIVE_MISSING');
  const all = key => primitiveReports.length > 0 && primitiveReports.every(report => report[key]?.status === 'PASS');
  const geometryStatus = parsed.errors.length === 0 && all('geometry') ? 'PASS' : 'FAIL';
  const topologyStatus = parsed.errors.length === 0 && all('topology') ? 'PASS' : 'FAIL';
  const uvStatus = parsed.errors.length === 0 && all('uv') ? 'PASS' : 'FAIL';
  const normalStatus = parsed.errors.length === 0 && all('normals') ? 'PASS' : 'FAIL';
  const pbr = parsed.json && parsed.binary ? inspectPbr(parsed.json, parsed.binary, externalPbr) : {status: 'FAIL', binding: 'unavailable', material_count: 0, texture_count: 0, embedded_image_count: 0, channels: [], materials: [], errors: ['PBR_INPUT_MISSING'], method: 'GLB_MATERIAL_TEXTURE_BINDING_V1'};
  const pbrStatus = parsed.errors.length === 0 && pbr.status === 'PASS' ? 'PASS' : 'FAIL';
  const primitiveErrors = primitiveReports.flatMap(report => report.errors);
  const triangleCount = primitiveReports.reduce((sum, report) => sum + report.geometry.triangle_count, 0);
  const vertexCount = primitiveReports.reduce((sum, report) => sum + report.geometry.vertex_count, 0);
  return {
    path: logicalPath,
    role,
    lod,
    exists: true,
    byte_length: Buffer.byteLength(buffer),
    file_root: parsed.base.root ?? rootHash(Buffer.from(buffer).toString('base64')),
    glb_valid: parsed.base.valid && parsed.errors.length === 0,
    valid: parsed.base.valid && parsed.errors.length === 0 && primitiveReports.length > 0 &&
      primitiveReports.every(report => report.valid) && pbrStatus === 'PASS',
    errors: [...parsed.errors, ...primitiveErrors, ...pbr.errors],
    mesh_count: parsed.base.mesh_count ?? 0,
    primitive_count: primitiveReports.length,
    vertex_count: vertexCount,
    triangle_count: triangleCount,
    geometry: {status: geometryStatus, method: 'GLB_ACCESSOR_STRUCTURE_V1'},
    topology: {status: topologyStatus, method: 'INDEXED_TRIANGLE_POSITION_WELD_EDGE_AUDIT_V1', primitives: primitiveReports.map(report => report.topology)},
    uv: {status: uvStatus, method: 'FINITE_NONCONSTANT_TEXCOORD_0_V1', primitives: primitiveReports.map(report => report.uv)},
    normals: {status: normalStatus, method: 'FINITE_NONZERO_UNIT_NORMALS_V1', primitives: primitiveReports.map(report => report.normals)},
    pbr: {...pbr, status: pbrStatus},
    primitives: primitiveReports
  };
}

function inferLod(value) {
  const match = String(value ?? '').match(/lod(\d+)/i);
  return match ? Number(match[1]) : null;
}

function inspectLodReports(reports) {
  if (!reports.length) {
    return {
      status: 'NOT_RUN',
      method: 'LOD_LEVEL_SEQUENCE_TRIANGLE_REDUCTION_AUDIT_V1',
      count: 0,
      levels: [],
      triangle_counts: [],
      reduction_ratios: [],
      errors: []
    };
  }
  const errors = [];
  const meshReports = reports.filter(report => report.lod !== null || String(report.role ?? '').toLowerCase().includes('mesh'));
  const byLevel = new Map();
  for (const report of meshReports) {
    if (!Number.isInteger(report.lod) || report.lod < 0) {
      errors.push(`LOD_LEVEL_INVALID:${report.path}`);
      continue;
    }
    if (byLevel.has(report.lod)) errors.push(`LOD_LEVEL_DUPLICATE:${report.lod}`);
    else byLevel.set(report.lod, report);
    if (!report.glb_valid) errors.push(`LOD_FILE_INVALID:${report.path}`);
  }
  const levels = [...byLevel.keys()].sort((left, right) => left - right);
  if (!levels.length) errors.push('LOD_LEVELS_MISSING');
  else {
    if (levels[0] !== 0) errors.push('LOD_BASE_LEVEL_MISSING');
    if (levels.length < 2) errors.push('LOD_REDUCTION_LEVEL_MISSING');
    for (let index = 1; index < levels.length; index += 1) {
      if (levels[index] !== levels[index - 1] + 1) errors.push(`LOD_LEVEL_GAP:${levels[index - 1]}:${levels[index]}`);
    }
  }
  const triangleCounts = levels.map(level => Number(byLevel.get(level)?.triangle_count ?? 0));
  const reductionRatios = [];
  for (let index = 1; index < triangleCounts.length; index += 1) {
    const previous = triangleCounts[index - 1];
    const current = triangleCounts[index];
    const ratio = previous > 0 ? current / previous : null;
    reductionRatios.push(ratio);
    if (!(previous > 0) || !(current > 0) || current >= previous) errors.push(`LOD_TRIANGLES_NOT_REDUCED:${levels[index - 1]}:${levels[index]}`);
  }
  return {
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    method: 'LOD_LEVEL_SEQUENCE_TRIANGLE_REDUCTION_AUDIT_V1',
    count: levels.length,
    levels,
    triangle_counts: triangleCounts,
    reduction_ratios: reductionRatios,
    errors
  };
}

function inspectionLogicalPath(baseDir, absolutePath, suppliedPath) {
  if (suppliedPath && !path.isAbsolute(String(suppliedPath))) return String(suppliedPath).replaceAll('\\', '/');
  if (baseDir) return path.relative(baseDir, absolutePath).replaceAll('\\', '/');
  return path.basename(absolutePath).replaceAll('\\', '/');
}

const PBR_TEXTURE_ROLES = Object.freeze(['base-color', 'normal', 'occlusion-roughness-metallic', 'emissive']);

function inspectTextureBytes(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer ?? []);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length >= 33 && pngSignature.equals(bytes.subarray(0, 8))) {
    const chunkLength = bytes.readUInt32BE(8);
    const chunkType = bytes.subarray(12, 16).toString('ascii');
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    return {
      status: chunkLength === 13 && chunkType === 'IHDR' && width > 0 && height > 0 ? 'PASS' : 'FAIL',
      format: 'image/png',
      width,
      height,
      byte_length: bytes.length,
      method: 'PNG_HEADER_STRUCTURE_V1'
    };
  }
  const ktx = inspectKtx2(bytes);
  if (ktx.levels?.length || bytes.length >= 12 && bytes.subarray(0, 12).toString('hex') === 'ab4b5458203230bb0d0a1a0a') {
    return {status: ktx.valid ? 'PASS' : 'FAIL', format: 'image/ktx2', width: ktx.width ?? null, height: ktx.height ?? null, byte_length: bytes.length, method: 'KTX2_HEADER_STRUCTURE_V1', errors: ktx.errors};
  }
  return {status: 'FAIL', format: null, width: null, height: null, byte_length: bytes.length, errors: ['TEXTURE_FORMAT_UNSUPPORTED'], method: 'TEXTURE_HEADER_STRUCTURE_V1'};
}

function inspectPbrPack({baseDir, files = [], metadata = null} = {}) {
  const requiredRoles = PBR_TEXTURE_ROLES;
  const reports = [];
  const errors = [];
  const byRole = new Map();
  for (const item of files) {
    const suppliedPath = String(item?.path ?? item?.name ?? '');
    const absolutePath = path.resolve(baseDir ?? process.cwd(), suppliedPath);
    const logicalPath = inspectionLogicalPath(baseDir, absolutePath, item?.logical_path ?? suppliedPath);
    const role = String(item?.role ?? '').toLowerCase();
    if (byRole.has(role)) errors.push(`PBR_DUPLICATE_ROLE:${role}`);
    if (!requiredRoles.includes(role)) {
      errors.push(`PBR_ROLE_UNSUPPORTED:${role || 'missing'}`);
      continue;
    }
    byRole.set(role, {item, absolutePath, logicalPath});
  }
  const metadataByRole = new Map((metadata?.files ?? []).map(file => [String(file.role ?? '').toLowerCase(), file]));
  for (const role of requiredRoles) {
    const entry = byRole.get(role);
    if (!entry || !fs.existsSync(entry.absolutePath)) {
      errors.push(`PBR_FILE_MISSING:${role}`);
      reports.push({path: entry?.logicalPath ?? role, role, exists: false, status: 'FAIL', errors: ['PBR_FILE_MISSING']});
      continue;
    }
    try {
      const bytes = fs.readFileSync(entry.absolutePath);
      const texture = inspectTextureBytes(bytes);
      const actualSha256 = createHash('sha256').update(bytes).digest('hex');
      const actualRoot = rootHash(bytes.toString('base64'));
      const expectedSha256 = entry.item?.expected_sha256 ?? null;
      const metadataFile = metadataByRole.get(role);
      const fileErrors = [...(texture.errors ?? [])];
      if (expectedSha256 && expectedSha256 !== actualSha256) fileErrors.push('PBR_FILE_SHA256_MISMATCH');
      if (metadataFile?.root && metadataFile.root !== actualRoot) fileErrors.push('PBR_FILE_ROOT_MISMATCH');
      reports.push({
        path: entry.logicalPath,
        role,
        exists: true,
        status: texture.status === 'PASS' && fileErrors.length === 0 ? 'PASS' : 'FAIL',
        format: texture.format,
        width: texture.width,
        height: texture.height,
        byte_length: bytes.length,
        sha256: actualSha256,
        file_root: actualRoot,
        errors: fileErrors,
        method: texture.method
      });
      errors.push(...fileErrors.map(error => `${role}:${error}`));
    } catch (error) {
      errors.push(`PBR_FILE_READ_FAILED:${role}:${error.message}`);
      reports.push({path: entry.logicalPath, role, exists: true, status: 'FAIL', errors: [`PBR_FILE_READ_FAILED:${error.message}`]});
    }
  }
  if (metadata) {
    const copy = clone(metadata);
    const actualPackRoot = copy.pack_root;
    delete copy.pack_root;
    if (!actualPackRoot || actualPackRoot !== rootHash(copy)) errors.push('PBR_PACK_ROOT_INVALID');
  }
  return {
    status: reports.length === requiredRoles.length && reports.every(report => report.status === 'PASS') && errors.length === 0 ? 'PASS' : 'FAIL',
    source: 'local-pbr-pack-inspector',
    pack_root: metadata?.pack_root ?? null,
    material_model: metadata?.material_model ?? null,
    texture_count: reports.filter(report => report.status === 'PASS').length,
    channels: reports.filter(report => report.status === 'PASS').map(report => ({role: report.role, path: report.path, file_root: report.file_root})),
    files: reports,
    errors,
    method: 'PBR_PACK_FILE_ROLE_ROOT_AUDIT_V1'
  };
}

export function inspectUniversalArtAssetFiles({baseDir = null, files = [], variant = null, pbrPack: pbrPackInput = null} = {}) {
  const resolvedBase = baseDir ? path.resolve(String(baseDir)) : null;
  const requested = Array.isArray(files) && files.length
    ? files
    : variant
      ? [0, 1, 2].map(lod => ({path: path.join('candidates', String(variant), 'mesh', `lod${lod}.glb`), role: lod === 0 ? 'mesh-glb' : `mesh-lod${lod}-glb`, lod}))
      : [];
  const pbrPack = pbrPackInput ? inspectPbrPack({baseDir: resolvedBase, files: pbrPackInput.files ?? [], metadata: pbrPackInput.metadata ?? null}) : null;
  const reports = requested.map((item, index) => {
    const suppliedPath = String(item?.path ?? item?.name ?? '');
    const absolutePath = path.resolve(resolvedBase ?? process.cwd(), suppliedPath);
    const logicalPath = inspectionLogicalPath(resolvedBase, absolutePath, item?.logical_path ?? suppliedPath);
    const lod = item?.lod ?? inferLod(logicalPath);
    if (!suppliedPath || !fs.existsSync(absolutePath)) {
      return {
        path: logicalPath || `file-${index}`,
        role: item?.role ?? null,
        lod,
        exists: false,
        glb_valid: false,
        errors: ['GLB_FILE_MISSING'],
        geometry: {status: 'FAIL'},
        topology: {status: 'FAIL'},
        uv: {status: 'FAIL'},
        normals: {status: 'FAIL'},
        pbr: {status: 'FAIL'}
      };
    }
    try {
      return inspectGlbBuffer(fs.readFileSync(absolutePath), {logicalPath, role: item?.role ?? null, lod, externalPbr: pbrPack});
    } catch (error) {
      return {
        path: logicalPath,
        role: item?.role ?? null,
        lod,
        exists: true,
        glb_valid: false,
        errors: [`GLB_FILE_READ_FAILED:${error.message}`],
        geometry: {status: 'FAIL'},
        topology: {status: 'FAIL'},
        uv: {status: 'FAIL'},
        normals: {status: 'FAIL'},
        pbr: {status: 'FAIL'}
      };
    }
  });
  const lod = inspectLodReports(reports);
  const aggregateStatus = key => reports.length > 0 && reports.every(report => report[key]?.status === 'PASS') ? 'PASS' : reports.length ? 'FAIL' : 'NOT_RUN';
  const inspection = {
    format: UNIVERSAL_ART_ASSET_FILE_INSPECTION_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    source: 'local-glb-inspector',
    method: 'urrf.glb-structural-inspector.v0.1',
    status: reports.length > 0 && reports.every(report => report.glb_valid && report.valid) && lod.status === 'PASS' && (!pbrPackInput || pbrPack?.status === 'PASS') ? 'PASS' : reports.length ? 'FAIL' : 'NOT_RUN',
    files: reports,
    lod,
    pbr_pack: pbrPack,
    aggregates: {
      geometry_status: aggregateStatus('geometry'),
      topology_status: aggregateStatus('topology'),
      uv_status: aggregateStatus('uv'),
      normal_status: aggregateStatus('normals'),
      pbr_status: reports.length > 0 && reports.every(report => report.pbr?.status === 'PASS') && (!pbrPackInput || pbrPack?.status === 'PASS') ? 'PASS' : reports.length ? 'FAIL' : 'NOT_RUN',
      lod_status: lod.status,
      lod_count: lod.count,
      lod_levels: lod.levels,
      lod_triangle_counts: lod.triangle_counts,
      triangle_count: reports.reduce((sum, report) => sum + Number(report.triangle_count ?? 0), 0),
      vertex_count: reports.reduce((sum, report) => sum + Number(report.vertex_count ?? 0), 0),
      file_count: reports.length,
      valid_file_count: reports.filter(report => report.glb_valid && report.valid).length
    },
    errors: [
      ...reports.flatMap(report => (report.errors ?? []).map(error => `${report.path}:${error}`)),
      ...lod.errors
    ],
    inspection_root: ''
  };
  return seal(inspection, 'inspection_root');
}

export function verifyUniversalArtAssetFileInspection(inspection) {
  const errors = [];
  if (!inspection || typeof inspection !== 'object' || Array.isArray(inspection)) return {valid: false, errors: ['INSPECTION_NOT_OBJECT']};
  if (inspection.format !== UNIVERSAL_ART_ASSET_FILE_INSPECTION_FORMAT) errors.push('FORMAT_INVALID');
  if (inspection.version !== UNIVERSAL_ART_ASSET_FORGE_VERSION) errors.push('VERSION_INVALID');
  if (!['PASS', 'FAIL', 'NOT_RUN'].includes(inspection.status)) errors.push('STATUS_INVALID');
  if (!Array.isArray(inspection.files)) errors.push('FILES_INVALID');
  const copy = clone(inspection);
  const actual = copy.inspection_root;
  delete copy.inspection_root;
  if (!actual || actual !== rootHash(copy)) errors.push('INSPECTION_ROOT_INVALID');
  return {valid: errors.length === 0, errors, inspection_root: inspection.inspection_root ?? null};
}

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHexRoot(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

/**
 * Verify an externally supplied art-direction or human-art review receipt.
 *
 * Provider evidence is intentionally not accepted here. The receipt must be
 * rooted, bound to the exact URRF genome/candidate/file inspection, identify a
 * reviewer and an external verifier, and carry a review-kind-specific
 * attestation. This verifies the contract and binding; it does not manufacture
 * a human decision or perform identity/key custody on behalf of the caller.
 */
export function verifyUniversalArtAssetReviewReceipt(receipt, {
  reviewKind = null,
  genomeRoot = null,
  candidateRoot = null,
  fileInspectionRoot
} = {}) {
  const errors = [];
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
    return {valid: false, errors: ['REVIEW_RECEIPT_NOT_OBJECT'], receipt_root: null};
  }
  try {
    if (receipt.format !== UNIVERSAL_ART_ASSET_REVIEW_RECEIPT_FORMAT) errors.push('FORMAT_INVALID');
    if (receipt.version !== UNIVERSAL_ART_ASSET_FORGE_VERSION) errors.push('VERSION_INVALID');
    if (!UNIVERSAL_ART_ASSET_REVIEW_KINDS.includes(receipt.review_kind)) errors.push('REVIEW_KIND_INVALID');
    if (reviewKind !== null && receipt.review_kind !== reviewKind) errors.push('REVIEW_KIND_MISMATCH');
    if (receipt.source !== 'external-human-review') errors.push('REVIEW_SOURCE_NOT_EXTERNAL');
    if (receipt.provider_id !== undefined) errors.push('PROVIDER_FIELD_FORBIDDEN');
    if (receipt.receipt_status !== 'VERIFIED') errors.push('REVIEW_RECEIPT_NOT_VERIFIED');
    if (receipt.decision !== 'APPROVED') errors.push('REVIEW_DECISION_NOT_APPROVED');
    if (!nonEmptyText(receipt.reviewer_id)) errors.push('REVIEWER_ID_MISSING');
    if (!nonEmptyText(receipt.reviewer_role)) errors.push('REVIEWER_ROLE_MISSING');
    if (!isHexRoot(receipt.genome_root)) errors.push('REVIEW_GENOME_ROOT_INVALID');
    if (genomeRoot !== null && receipt.genome_root !== genomeRoot) errors.push('REVIEW_GENOME_ROOT_MISMATCH');
    if (!isHexRoot(receipt.candidate_root)) errors.push('REVIEW_CANDIDATE_ROOT_INVALID');
    if (candidateRoot !== null && receipt.candidate_root !== candidateRoot) errors.push('REVIEW_CANDIDATE_ROOT_MISMATCH');
    if (fileInspectionRoot !== undefined) {
      const expectedInspectionRoot = fileInspectionRoot ?? null;
      if (receipt.file_inspection_root !== expectedInspectionRoot) errors.push('REVIEW_FILE_INSPECTION_ROOT_MISMATCH');
      if (receipt.file_inspection_root !== null && !isHexRoot(receipt.file_inspection_root)) errors.push('REVIEW_FILE_INSPECTION_ROOT_INVALID');
    } else if (receipt.file_inspection_root !== null && !isHexRoot(receipt.file_inspection_root)) {
      errors.push('REVIEW_FILE_INSPECTION_ROOT_INVALID');
    }
    if (!isHexRoot(receipt.reference_root)) errors.push('REVIEW_REFERENCE_ROOT_INVALID');
    const comparison = record(receipt.comparison);
    if (!isHexRoot(comparison.comparison_root)) errors.push('REVIEW_COMPARISON_ROOT_INVALID');
    if (!Array.isArray(comparison.axes) || comparison.axes.length === 0) {
      errors.push('REVIEW_COMPARISON_AXES_INVALID');
    } else {
      comparison.axes.forEach((axis, index) => {
        if (!nonEmptyText(axis?.axis)) errors.push(`REVIEW_AXIS_${index}_NAME_MISSING`);
        if (axis?.status !== 'PASS') errors.push(`REVIEW_AXIS_${index}_NOT_PASS`);
      });
    }
    const verifier = record(receipt.verifier);
    if (verifier.kind !== 'external-review-verifier') errors.push('REVIEW_VERIFIER_KIND_INVALID');
    if (verifier.status !== 'PASS') errors.push('REVIEW_VERIFIER_NOT_PASS');
    if (!nonEmptyText(verifier.verifier_id)) errors.push('REVIEW_VERIFIER_ID_MISSING');
    if (!nonEmptyText(verifier.method)) errors.push('REVIEW_VERIFIER_METHOD_MISSING');
    const expectedAttestation = receipt.review_kind === 'ART_DIRECTION' ? 'ART_DIRECTION_REVIEWED' : 'HUMAN_REVIEWED';
    if (receipt.attestation !== expectedAttestation) errors.push('REVIEW_ATTESTATION_INVALID');
    const copy = clone(receipt);
    const actual = copy.receipt_root;
    delete copy.receipt_root;
    if (!isHexRoot(actual) || actual !== rootHash(copy)) errors.push('REVIEW_RECEIPT_ROOT_INVALID');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root ?? null};
}

function localQualityMetrics(inspection) {
  const textureSizes = (inspection?.pbr_pack?.files ?? [])
    .flatMap(file => [Number(file.width ?? 0), Number(file.height ?? 0)])
    .filter(value => Number.isFinite(value) && value > 0);
  return {
    lod0_triangle_count: Number(inspection?.lod?.triangle_counts?.[0] ?? 0),
    texture_size: textureSizes.length ? Math.max(...textureSizes) : 0,
    pbr_channel_count: Number(inspection?.pbr_pack?.texture_count ?? 0)
  };
}

/**
 * Verify an externally supplied quality proof without treating Provider
 * quality metadata as an acceptance authority. The local inspection binding
 * makes the declared metrics auditable; the external verifier and hardware
 * profile remain an explicit boundary for target-quality/performance claims.
 */
export function verifyUniversalArtAssetQualityProof(receipt, {
  qualityTier = null,
  genomeRoot = null,
  candidateRoot = null,
  fileInspectionRoot,
  inspection = null,
  targetPlatforms = []
} = {}) {
  const errors = [];
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
    return {valid: false, errors: ['QUALITY_PROOF_NOT_OBJECT'], receipt_root: null};
  }
  try {
    if (receipt.format !== UNIVERSAL_ART_ASSET_QUALITY_PROOF_FORMAT) errors.push('FORMAT_INVALID');
    if (receipt.version !== UNIVERSAL_ART_ASSET_FORGE_VERSION) errors.push('VERSION_INVALID');
    if (receipt.source !== 'external-quality-verifier') errors.push('QUALITY_PROOF_SOURCE_NOT_EXTERNAL');
    if (receipt.provider_id !== undefined) errors.push('PROVIDER_FIELD_FORBIDDEN');
    if (receipt.receipt_status !== 'VERIFIED') errors.push('QUALITY_PROOF_NOT_VERIFIED');
    if (receipt.decision !== 'PASS') errors.push('QUALITY_PROOF_DECISION_NOT_PASS');
    if (!UNIVERSAL_ART_ASSET_QUALITY_TIERS.includes(receipt.target_quality_tier)) errors.push('QUALITY_TIER_INVALID');
    if (qualityTier !== null && receipt.target_quality_tier !== qualityTier) errors.push('QUALITY_TIER_MISMATCH');
    if (!isHexRoot(receipt.genome_root)) errors.push('QUALITY_GENOME_ROOT_INVALID');
    if (genomeRoot !== null && receipt.genome_root !== genomeRoot) errors.push('QUALITY_GENOME_ROOT_MISMATCH');
    if (!isHexRoot(receipt.candidate_root)) errors.push('QUALITY_CANDIDATE_ROOT_INVALID');
    if (candidateRoot !== null && receipt.candidate_root !== candidateRoot) errors.push('QUALITY_CANDIDATE_ROOT_MISMATCH');
    if (fileInspectionRoot !== undefined) {
      const expectedInspectionRoot = fileInspectionRoot ?? null;
      if (receipt.file_inspection_root !== expectedInspectionRoot) errors.push('QUALITY_FILE_INSPECTION_ROOT_MISMATCH');
      if (receipt.file_inspection_root !== null && !isHexRoot(receipt.file_inspection_root)) errors.push('QUALITY_FILE_INSPECTION_ROOT_INVALID');
    } else if (receipt.file_inspection_root !== null && !isHexRoot(receipt.file_inspection_root)) {
      errors.push('QUALITY_FILE_INSPECTION_ROOT_INVALID');
    }
    if (!isHexRoot(receipt.benchmark_root)) errors.push('QUALITY_BENCHMARK_ROOT_INVALID');
    if (!nonEmptyText(receipt.hardware_profile)) errors.push('QUALITY_HARDWARE_PROFILE_MISSING');
    const metrics = record(receipt.metrics);
    for (const key of ['lod0_triangle_count', 'texture_size', 'pbr_channel_count']) {
      if (!Number.isSafeInteger(metrics[key]) || metrics[key] < 0) errors.push(`QUALITY_METRIC_${key.toUpperCase()}_INVALID`);
    }
    if (!nonEmptyText(metrics.target_platform)) errors.push('QUALITY_TARGET_PLATFORM_MISSING');
    if (Array.isArray(targetPlatforms) && targetPlatforms.length && !targetPlatforms.includes(metrics.target_platform)) errors.push('QUALITY_TARGET_PLATFORM_MISMATCH');
    if (inspection) {
      const inspectionVerification = verifyUniversalArtAssetFileInspection(inspection);
      if (!inspectionVerification.valid || inspection.status !== 'PASS') errors.push('QUALITY_LOCAL_INSPECTION_NOT_PASS');
      const observed = localQualityMetrics(inspection);
      for (const key of ['lod0_triangle_count', 'texture_size', 'pbr_channel_count']) {
        if (metrics[key] !== observed[key]) errors.push(`QUALITY_METRIC_${key.toUpperCase()}_MISMATCH`);
      }
    }
    const verifier = record(receipt.verifier);
    if (verifier.kind !== 'external-quality-verifier') errors.push('QUALITY_VERIFIER_KIND_INVALID');
    if (verifier.status !== 'PASS') errors.push('QUALITY_VERIFIER_NOT_PASS');
    if (!nonEmptyText(verifier.verifier_id)) errors.push('QUALITY_VERIFIER_ID_MISSING');
    if (!nonEmptyText(verifier.method)) errors.push('QUALITY_VERIFIER_METHOD_MISSING');
    const copy = clone(receipt);
    const actual = copy.receipt_root;
    delete copy.receipt_root;
    if (!isHexRoot(actual) || actual !== rootHash(copy)) errors.push('QUALITY_PROOF_ROOT_INVALID');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root ?? null};
}

function artifactRootsForCandidate(candidate) {
  const artifacts = record(candidate?.artifacts);
  return Object.fromEntries(Object.entries(artifacts)
    .map(([role, artifact]) => [role, artifact?.root ?? null])
    .filter(([role]) => nonEmptyText(role))
    .sort(([left], [right]) => left.localeCompare(right, 'en')));
}

/**
 * Verify an independently supplied provenance and license audit receipt.
 *
 * Candidate/provider metadata remains useful for diagnosis, but it is not
 * acceptance authority for PRODUCTION or AAA. This receipt binds the audit
 * to the exact URRF Genome, Candidate, local file inspection, and every
 * materialized candidate artifact root. It records the audit boundary for
 * source revision, generator version, license scope, and model-weight mode;
 * it does not manufacture an external auditor, key custody, or legal opinion.
 */
export function verifyUniversalArtAssetProvenanceLicenseReceipt(receipt, {
  genomeRoot = null,
  candidateRoot = null,
  fileInspectionRoot,
  providerId = null,
  seed = null,
  artifactRoots = null
} = {}) {
  const errors = [];
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
    return {valid: false, errors: ['PROVENANCE_LICENSE_RECEIPT_NOT_OBJECT'], receipt_root: null};
  }
  try {
    if (receipt.format !== UNIVERSAL_ART_ASSET_PROVENANCE_LICENSE_RECEIPT_FORMAT) errors.push('FORMAT_INVALID');
    if (receipt.version !== UNIVERSAL_ART_ASSET_FORGE_VERSION) errors.push('VERSION_INVALID');
    if (receipt.source !== 'external-provenance-license-auditor') errors.push('PROVENANCE_LICENSE_SOURCE_NOT_EXTERNAL');
    if (receipt.provider_id !== undefined) errors.push('PROVIDER_FIELD_FORBIDDEN');
    if (!nonEmptyText(receipt.audited_provider_id)) errors.push('AUDITED_PROVIDER_ID_MISSING');
    if (providerId !== null && receipt.audited_provider_id !== providerId) errors.push('AUDITED_PROVIDER_ID_MISMATCH');
    if (receipt.receipt_status !== 'VERIFIED') errors.push('PROVENANCE_LICENSE_RECEIPT_NOT_VERIFIED');
    if (receipt.decision !== 'PASS') errors.push('PROVENANCE_LICENSE_DECISION_NOT_PASS');
    if (!isHexRoot(receipt.genome_root)) errors.push('PROVENANCE_LICENSE_GENOME_ROOT_INVALID');
    if (genomeRoot !== null && receipt.genome_root !== genomeRoot) errors.push('PROVENANCE_LICENSE_GENOME_ROOT_MISMATCH');
    if (!isHexRoot(receipt.candidate_root)) errors.push('PROVENANCE_LICENSE_CANDIDATE_ROOT_INVALID');
    if (candidateRoot !== null && receipt.candidate_root !== candidateRoot) errors.push('PROVENANCE_LICENSE_CANDIDATE_ROOT_MISMATCH');
    if (fileInspectionRoot !== undefined) {
      const expectedInspectionRoot = fileInspectionRoot ?? null;
      if (receipt.file_inspection_root !== expectedInspectionRoot) errors.push('PROVENANCE_LICENSE_FILE_INSPECTION_ROOT_MISMATCH');
      if (receipt.file_inspection_root !== null && !isHexRoot(receipt.file_inspection_root)) errors.push('PROVENANCE_LICENSE_FILE_INSPECTION_ROOT_INVALID');
    } else if (receipt.file_inspection_root !== null && !isHexRoot(receipt.file_inspection_root)) {
      errors.push('PROVENANCE_LICENSE_FILE_INSPECTION_ROOT_INVALID');
    }
    const provenance = record(receipt.provenance);
    for (const key of ['upstream_url', 'source_revision', 'generator_version', 'seed']) {
      if (!nonEmptyText(provenance[key])) errors.push(`PROVENANCE_${key.toUpperCase()}_MISSING`);
    }
    if (seed !== null && provenance.seed !== seed) errors.push('PROVENANCE_SEED_MISMATCH');
    const license = record(receipt.license);
    if (license.status !== 'VERIFIED') errors.push('LICENSE_NOT_VERIFIED');
    if (!nonEmptyText(license.identifier)) errors.push('LICENSE_IDENTIFIER_MISSING');
    if (!nonEmptyText(license.scope)) errors.push('LICENSE_SCOPE_MISSING');
    const modelWeightsAudit = record(receipt.model_weights_audit);
    if (modelWeightsAudit.status !== 'PASS') errors.push('MODEL_WEIGHTS_AUDIT_NOT_PASS');
    if (!nonEmptyText(modelWeightsAudit.mode)) errors.push('MODEL_WEIGHTS_AUDIT_MODE_MISSING');
    const declaredArtifactRoots = record(receipt.artifact_roots);
    const declaredEntries = Object.entries(declaredArtifactRoots);
    if (declaredEntries.length === 0) {
      errors.push('ARTIFACT_ROOTS_MISSING');
    } else {
      declaredEntries.forEach(([role, root]) => {
        if (!nonEmptyText(role)) errors.push('ARTIFACT_ROLE_INVALID');
        if (!isHexRoot(root)) errors.push(`ARTIFACT_ROOT_INVALID:${role}`);
      });
    }
    if (artifactRoots !== null && rootHash(declaredArtifactRoots) !== rootHash(artifactRoots)) errors.push('ARTIFACT_ROOTS_MISMATCH');
    const verifier = record(receipt.verifier);
    if (verifier.kind !== 'external-provenance-license-auditor') errors.push('PROVENANCE_LICENSE_VERIFIER_KIND_INVALID');
    if (verifier.status !== 'PASS') errors.push('PROVENANCE_LICENSE_VERIFIER_NOT_PASS');
    if (!nonEmptyText(verifier.verifier_id)) errors.push('PROVENANCE_LICENSE_VERIFIER_ID_MISSING');
    if (!nonEmptyText(verifier.method)) errors.push('PROVENANCE_LICENSE_VERIFIER_METHOD_MISSING');
    const copy = clone(receipt);
    const actual = copy.receipt_root;
    delete copy.receipt_root;
    if (!isHexRoot(actual) || actual !== rootHash(copy)) errors.push('PROVENANCE_LICENSE_RECEIPT_ROOT_INVALID');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root ?? null};
}

const UNIVERSAL_ART_ASSET_EVIDENCE_RECEIPT_KEYS = Object.freeze([
  'provenance_license',
  'art_direction',
  'quality',
  'human_review'
]);

/**
 * Verify a unified, candidate-only packet of independent AAA evidence. The
 * packet is a convenience boundary for submission and replay: each nested
 * receipt is still checked by its own verifier, and the packet cannot turn
 * Provider evidence into authority or authorize an RNCS canonical write.
 */
export function verifyUniversalArtAssetEvidenceBundle(bundle, {
  qualityTier = null,
  genomeRoot = null,
  candidateRoot = null,
  fileInspectionRoot,
  providerId = null,
  seed = null,
  artifactRoots = null,
  inspection = null,
  targetPlatforms = []
} = {}) {
  const errors = [];
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) {
    return {valid: false, errors: ['EVIDENCE_BUNDLE_NOT_OBJECT'], bundle_root: null};
  }
  try {
    if (bundle.format !== UNIVERSAL_ART_ASSET_EVIDENCE_BUNDLE_FORMAT) errors.push('FORMAT_INVALID');
    if (bundle.version !== UNIVERSAL_ART_ASSET_FORGE_VERSION) errors.push('VERSION_INVALID');
    if (bundle.source !== 'independent-evidence-bundle') errors.push('EVIDENCE_BUNDLE_SOURCE_INVALID');
    if (bundle.provider_id !== undefined) errors.push('PROVIDER_FIELD_FORBIDDEN');
    if (bundle.status !== 'VERIFIED') errors.push('EVIDENCE_BUNDLE_NOT_VERIFIED');
    if (bundle.decision !== 'PASS') errors.push('EVIDENCE_BUNDLE_DECISION_NOT_PASS');
    if (!isHexRoot(bundle.genome_root)) errors.push('EVIDENCE_BUNDLE_GENOME_ROOT_INVALID');
    if (genomeRoot !== null && bundle.genome_root !== genomeRoot) errors.push('EVIDENCE_BUNDLE_GENOME_ROOT_MISMATCH');
    if (!isHexRoot(bundle.candidate_root)) errors.push('EVIDENCE_BUNDLE_CANDIDATE_ROOT_INVALID');
    if (candidateRoot !== null && bundle.candidate_root !== candidateRoot) errors.push('EVIDENCE_BUNDLE_CANDIDATE_ROOT_MISMATCH');
    if (fileInspectionRoot !== undefined) {
      const expectedInspectionRoot = fileInspectionRoot ?? null;
      if (bundle.file_inspection_root !== expectedInspectionRoot) errors.push('EVIDENCE_BUNDLE_FILE_INSPECTION_ROOT_MISMATCH');
      if (bundle.file_inspection_root !== null && !isHexRoot(bundle.file_inspection_root)) errors.push('EVIDENCE_BUNDLE_FILE_INSPECTION_ROOT_INVALID');
    } else if (bundle.file_inspection_root !== null && !isHexRoot(bundle.file_inspection_root)) {
      errors.push('EVIDENCE_BUNDLE_FILE_INSPECTION_ROOT_INVALID');
    }
    const declaredArtifactRoots = record(bundle.artifact_roots);
    const declaredArtifactEntries = Object.entries(declaredArtifactRoots);
    if (declaredArtifactEntries.length === 0) {
      errors.push('EVIDENCE_BUNDLE_ARTIFACT_ROOTS_MISSING');
    } else {
      declaredArtifactEntries.forEach(([role, root]) => {
        if (!nonEmptyText(role)) errors.push('EVIDENCE_BUNDLE_ARTIFACT_ROLE_INVALID');
        if (!isHexRoot(root)) errors.push(`EVIDENCE_BUNDLE_ARTIFACT_ROOT_INVALID:${role}`);
      });
    }
    if (artifactRoots !== null && rootHash(declaredArtifactRoots) !== rootHash(artifactRoots)) errors.push('EVIDENCE_BUNDLE_ARTIFACT_ROOTS_MISMATCH');
    const receipts = record(bundle.receipts);
    const receiptVerifications = {
      provenance_license: verifyUniversalArtAssetProvenanceLicenseReceipt(receipts.provenance_license, {
        genomeRoot,
        candidateRoot,
        fileInspectionRoot,
        providerId,
        seed,
        artifactRoots
      }),
      art_direction: verifyUniversalArtAssetReviewReceipt(receipts.art_direction, {
        reviewKind: 'ART_DIRECTION',
        genomeRoot,
        candidateRoot,
        fileInspectionRoot
      }),
      quality: verifyUniversalArtAssetQualityProof(receipts.quality, {
        qualityTier,
        genomeRoot,
        candidateRoot,
        fileInspectionRoot,
        inspection,
        targetPlatforms
      }),
      human_review: verifyUniversalArtAssetReviewReceipt(receipts.human_review, {
        reviewKind: 'HUMAN_ART',
        genomeRoot,
        candidateRoot,
        fileInspectionRoot
      })
    };
    for (const key of UNIVERSAL_ART_ASSET_EVIDENCE_RECEIPT_KEYS) {
      const verification = receiptVerifications[key];
      if (!verification.valid) errors.push(...verification.errors.map(error => `${key.toUpperCase()}_${error}`));
    }
    const receiptRoots = record(bundle.receipt_roots);
    for (const key of UNIVERSAL_ART_ASSET_EVIDENCE_RECEIPT_KEYS) {
      const expectedRoot = receipts[key]?.receipt_root ?? null;
      if (receiptRoots[key] !== expectedRoot) errors.push(`EVIDENCE_BUNDLE_${key.toUpperCase()}_ROOT_MISMATCH`);
      if (receiptRoots[key] !== null && !isHexRoot(receiptRoots[key])) errors.push(`EVIDENCE_BUNDLE_${key.toUpperCase()}_ROOT_INVALID`);
    }
    const coverage = record(bundle.coverage);
    if (!Array.isArray(coverage.required_receipts) || UNIVERSAL_ART_ASSET_EVIDENCE_RECEIPT_KEYS.some(key => !coverage.required_receipts.includes(key))) errors.push('EVIDENCE_BUNDLE_REQUIRED_RECEIPTS_INVALID');
    const presentReceipts = UNIVERSAL_ART_ASSET_EVIDENCE_RECEIPT_KEYS.filter(key => receipts[key] && typeof receipts[key] === 'object');
    if (!Array.isArray(coverage.present_receipts) || rootHash(coverage.present_receipts) !== rootHash(presentReceipts)) errors.push('EVIDENCE_BUNDLE_PRESENT_RECEIPTS_MISMATCH');
    if (coverage.complete !== true) errors.push('EVIDENCE_BUNDLE_COVERAGE_INCOMPLETE');
    if (bundle.candidate_only !== true || bundle.authoritative !== false || bundle.canonical_write_authorized !== false) errors.push('EVIDENCE_BUNDLE_AUTHORITY_INVALID');
    if (bundle.authority?.provider_can_commit !== false || bundle.authority?.acceptance_can_commit !== false || bundle.authority?.rncs_authority_required !== true) errors.push('EVIDENCE_BUNDLE_PROVIDER_AUTHORITY_INVALID');
    const copy = clone(bundle);
    const actual = copy.bundle_root;
    delete copy.bundle_root;
    if (!isHexRoot(actual) || actual !== rootHash(copy)) errors.push('EVIDENCE_BUNDLE_ROOT_INVALID');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, bundle_root: bundle.bundle_root ?? null};
}

/**
 * Assemble the four independent AAA receipt types into one rooted packet.
 * Missing receipts yield an explicitly INCOMPLETE packet rather than a
 * synthetic pass, so callers can persist a work-in-progress submission.
 */
export function createUniversalArtAssetEvidenceBundle({
  genome,
  candidate,
  fileInspection = null,
  providerId = null,
  targetPlatforms = [],
  provenanceLicenseProof = null,
  artDirectionReview = null,
  qualityProof = null,
  humanReview = null
} = {}) {
  const selectedGenome = record(genome);
  const selectedCandidate = record(candidate);
  const artifactRoots = artifactRootsForCandidate(selectedCandidate);
  const receipts = {
    provenance_license: clone(provenanceLicenseProof),
    art_direction: clone(artDirectionReview),
    quality: clone(qualityProof),
    human_review: clone(humanReview)
  };
  const effectivePlatforms = Array.isArray(targetPlatforms) && targetPlatforms.length
    ? [...targetPlatforms]
    : [...(selectedGenome.target_platforms ?? [])];
  const binding = {
    qualityTier: selectedGenome.quality_tier ?? null,
    genomeRoot: selectedGenome.genome_root ?? null,
    candidateRoot: selectedCandidate.candidate_root ?? null,
    fileInspectionRoot: fileInspection?.inspection_root ?? null,
    providerId,
    seed: selectedGenome.ragf_genome?.seed ?? null,
    artifactRoots,
    inspection: fileInspection,
    targetPlatforms: effectivePlatforms
  };
  const componentVerification = [
    verifyUniversalArtAssetProvenanceLicenseReceipt(receipts.provenance_license, binding),
    verifyUniversalArtAssetReviewReceipt(receipts.art_direction, {reviewKind: 'ART_DIRECTION', ...binding}),
    verifyUniversalArtAssetQualityProof(receipts.quality, binding),
    verifyUniversalArtAssetReviewReceipt(receipts.human_review, {reviewKind: 'HUMAN_ART', ...binding})
  ];
  const complete = componentVerification.every(result => result.valid);
  return seal({
    format: UNIVERSAL_ART_ASSET_EVIDENCE_BUNDLE_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    source: 'independent-evidence-bundle',
    status: complete ? 'VERIFIED' : 'INCOMPLETE',
    decision: complete ? 'PASS' : 'BLOCKED',
    genome_root: selectedGenome.genome_root ?? null,
    candidate_root: selectedCandidate.candidate_root ?? null,
    file_inspection_root: fileInspection?.inspection_root ?? null,
    artifact_roots: artifactRoots,
    receipt_roots: Object.fromEntries(UNIVERSAL_ART_ASSET_EVIDENCE_RECEIPT_KEYS.map(key => [key, receipts[key]?.receipt_root ?? null])),
    receipts,
    coverage: {
      required_receipts: [...UNIVERSAL_ART_ASSET_EVIDENCE_RECEIPT_KEYS],
      present_receipts: UNIVERSAL_ART_ASSET_EVIDENCE_RECEIPT_KEYS.filter(key => receipts[key] && typeof receipts[key] === 'object'),
      complete
    },
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    authority: {
      provider_can_commit: false,
      acceptance_can_commit: false,
      rncs_authority_required: true,
      candidate_only: true,
      authoritative: false
    },
    bundle_root: ''
  }, 'bundle_root');
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
  fileInspection = null,
  artDirectionReview = null,
  humanReview = null,
  qualityProof = null,
  provenanceLicenseProof = null,
  evidenceBundle = null,
  runtimeEvidence = null
} = {}) {
  const genomeVerification = verifyUniversalArtAssetGenome(genome);
  if (!genomeVerification.valid) throw new GenesisError('UNIVERSAL_ART_ASSET_GENOME_INVALID', genomeVerification.errors.join(','));
  const required = new Set(genome.acceptance_contract.required_gates);
  const facts = candidateFacts({candidate, workspace, provider, providerEvidence: mergeRecord(providerEvidence, {runtime: runtimeEvidence})});
  const evidence = facts.providerEvidence;
  const localFileInspection = fileInspection ?? execution.file_inspection ?? null;
  const fileInspectionVerification = localFileInspection ? verifyUniversalArtAssetFileInspection(localFileInspection) : null;
  const localInspectionValid = Boolean(fileInspectionVerification?.valid);
  const localInspectionPass = key => localInspectionValid && localFileInspection?.status === 'PASS' && statusPass(localFileInspection?.aggregates?.[`${key}_status`]);
  const expectedProviderId = execution.provider_id ?? facts.providerManifest?.id ?? facts.providerManifest?.provider_id ?? null;
  const expectedArtifactRoots = artifactRootsForCandidate(facts.selected);
  const evidenceBundleVerification = verifyUniversalArtAssetEvidenceBundle(evidenceBundle, {
    qualityTier: genome.quality_tier,
    genomeRoot: genome.genome_root,
    candidateRoot: facts.selected?.candidate_root ?? null,
    fileInspectionRoot: localFileInspection?.inspection_root ?? null,
    providerId: expectedProviderId,
    seed: genome.ragf_genome.seed,
    artifactRoots: expectedArtifactRoots,
    inspection: localFileInspection,
    targetPlatforms: genome.target_platforms
  });
  const bundleReceipts = evidenceBundleVerification.valid ? record(evidenceBundle.receipts) : {};
  const effectiveArtDirectionReview = artDirectionReview ?? bundleReceipts.art_direction ?? null;
  const effectiveHumanReview = humanReview ?? bundleReceipts.human_review ?? null;
  const effectiveQualityProof = qualityProof ?? bundleReceipts.quality ?? null;
  const effectiveProvenanceLicenseProof = provenanceLicenseProof ?? bundleReceipts.provenance_license ?? null;
  const meshEvidence = explicitEvidence(evidence, ['geometry']);
  const topologyEvidence = explicitEvidence(evidence, ['topology']);
  const uvEvidence = explicitEvidence(evidence, ['uv', 'uv_unwrap']);
  const normalEvidence = explicitEvidence(evidence, ['normals', 'normal']);
  const pbrEvidence = explicitEvidence(evidence, ['material_pbr', 'pbr']);
  const lodEvidence = explicitEvidence(evidence, ['lod_platform', 'lod']);
  const collisionEvidence = explicitEvidence(evidence, ['collision']);
  const provenanceEvidence = explicitEvidence(evidence, ['provenance']);
  const licenseEvidence = explicitEvidence(evidence, ['license']);
  const reviewBinding = {
    genomeRoot: genome.genome_root,
    candidateRoot: facts.selected?.candidate_root ?? null,
    fileInspectionRoot: localFileInspection?.inspection_root ?? null
  };
  const artDirectionReviewVerification = verifyUniversalArtAssetReviewReceipt(effectiveArtDirectionReview, {
    reviewKind: 'ART_DIRECTION',
    ...reviewBinding
  });
  const humanReviewVerification = verifyUniversalArtAssetReviewReceipt(effectiveHumanReview, {
    reviewKind: 'HUMAN_ART',
    ...reviewBinding
  });
  const artDirectionReviewPass = Boolean(reviewBinding.candidateRoot) && artDirectionReviewVerification.valid;
  const humanReviewPass = Boolean(reviewBinding.candidateRoot) && humanReviewVerification.valid;
  const qualityProofVerification = verifyUniversalArtAssetQualityProof(effectiveQualityProof, {
    qualityTier: genome.quality_tier,
    genomeRoot: genome.genome_root,
    candidateRoot: facts.selected?.candidate_root ?? null,
    fileInspectionRoot: localFileInspection?.inspection_root ?? null,
    inspection: localFileInspection,
    targetPlatforms: genome.target_platforms
  });
  const qualityProofPass = Boolean(facts.selected?.candidate_root) && localInspectionValid && localFileInspection?.status === 'PASS' && qualityProofVerification.valid;
  const provenanceLicenseProofVerification = verifyUniversalArtAssetProvenanceLicenseReceipt(effectiveProvenanceLicenseProof, {
    genomeRoot: genome.genome_root,
    candidateRoot: facts.selected?.candidate_root ?? null,
    fileInspectionRoot: localFileInspection?.inspection_root ?? null,
    providerId: expectedProviderId,
    seed: genome.ragf_genome.seed,
    artifactRoots: expectedArtifactRoots
  });
  const provenanceLicenseProofPass = Boolean(facts.selected?.candidate_root) && provenanceLicenseProofVerification.valid;
  const runtimeProjectionEvidence = explicitEvidence(evidence, ['vsr_projection', 'representation']);
  const workspaceVerification = execution.workspace_verification ?? null;
  const executionPass = execution.status === 'COMPLETED' && (!workspaceVerification || workspaceVerification.valid === true);
  const runtimePass = runtimeProjectionEvidence.present
    ? runtimeProjectionEvidence.pass
    : Boolean(facts.workspaceReport?.runtime_validation?.valid === true);
  const pbrPass = (pbrEvidence.present ? pbrEvidence.pass : facts.pbrChannels >= 4) && facts.pbrChannels >= 3;
  const localGeometryPass = !localFileInspection || localInspectionPass('geometry');
  const localTopologyPass = !localFileInspection || localInspectionPass('topology');
  const localUvPass = !localFileInspection || localInspectionPass('uv');
  const localNormalPass = !localFileInspection || localInspectionPass('normal');
  const localPbrPass = !localFileInspection || localInspectionPass('pbr');
  const localLodPass = !localFileInspection || localInspectionPass('lod');
  const metadataProvenanceLicensePass = (provenanceEvidence.present ? provenanceEvidence.pass : facts.provenanceComplete) &&
    (licenseEvidence.present ? licenseEvidence.pass : (facts.licenseVerified || facts.providerManifestLicense));
  const provenanceLicenseCourtPass = courtGate(providerCourt, 'provenance_gate') !== false && courtGate(providerCourt, 'license_gate') !== false;
  const strictProvenanceLicense = genome.quality_tier !== 'PREVIEW';
  const provenanceLicensePass = (strictProvenanceLicense ? provenanceLicenseProofPass : (effectiveProvenanceLicenseProof ? provenanceLicenseProofPass : metadataProvenanceLicensePass)) && provenanceLicenseCourtPass;
  const gates = [
    makeGate('intent_gate', required.has('intent_gate'), Boolean(genome.ragf_intent?.intent_root), 'INTENT_NOT_ROOTED', 'RAGF intent'),
    makeGate('genome_gate', required.has('genome_gate'), genomeVerification.valid, 'GENOME_INVALID', 'URRF/RAGF genome verification'),
    makeGate('provider_execution_gate', required.has('provider_execution_gate'), executionPass, execution.failure?.code ?? 'PROVIDER_NOT_EXECUTED', execution.mode ?? 'provider lifecycle'),
    makeGate('geometry_gate', required.has('geometry_gate'), facts.meshValid && localGeometryPass && (meshEvidence.present ? meshEvidence.pass : true) && courtGate(providerCourt, 'geometry_gate') !== false, 'GEOMETRY_OUTPUT_INVALID_OR_MISSING', localFileInspection ? 'local GLB inspection' : meshEvidence.present ? 'provider evidence' : 'candidate metrics'),
    makeGate('topology_gate', required.has('topology_gate'), localTopologyPass && (topologyEvidence.present ? topologyEvidence.pass : localFileInspection ? true : statusPass(facts.mesh.topology_status)) && courtGate(providerCourt, 'topology_gate') !== false, 'TOPOLOGY_NOT_EXPLICITLY_VERIFIED', localFileInspection ? 'local GLB topology inspection' : topologyEvidence.present ? 'provider evidence' : 'candidate topology status'),
    makeGate('uv_gate', required.has('uv_gate'), localUvPass && (uvEvidence.present ? uvEvidence.pass : localFileInspection ? true : statusPass(facts.mesh.uv_status ?? facts.pbr.uv_status)), 'UV_NOT_EXPLICITLY_VERIFIED', localFileInspection ? 'local GLB UV inspection' : uvEvidence.present ? 'provider evidence' : 'candidate UV status'),
    makeGate('normal_gate', required.has('normal_gate'), localNormalPass && (normalEvidence.present ? normalEvidence.pass : localFileInspection ? true : statusPass(facts.mesh.normal_status)), 'NORMALS_NOT_EXPLICITLY_VERIFIED', localFileInspection ? 'local GLB normal inspection' : normalEvidence.present ? 'provider evidence' : 'candidate normal status'),
    makeGate('pbr_gate', required.has('pbr_gate'), localPbrPass && pbrPass && courtGate(providerCourt, 'material_pbr_gate') !== false, 'PBR_CHANNELS_OR_MATERIAL_BINDING_INCOMPLETE', localFileInspection ? 'local GLB material inspection' : pbrEvidence.present ? 'provider evidence' : 'candidate PBR metadata'),
    makeGate('rig_gate', required.has('rig_gate'), facts.rigPresent && (explicitEvidence(evidence, ['rig']).present ? explicitEvidence(evidence, ['rig']).pass : !facts.direct), 'RIG_MISSING_OR_NOT_VERIFIED', facts.rigPresent ? 'candidate artifact' : 'provider evidence'),
    makeGate('animation_gate', required.has('animation_gate'), facts.animationPresent && (explicitEvidence(evidence, ['animation']).present ? explicitEvidence(evidence, ['animation']).pass : !facts.direct), 'ANIMATION_MISSING_OR_NOT_VERIFIED', facts.animationPresent ? 'candidate artifact' : 'provider evidence'),
    makeGate('lod_gate', required.has('lod_gate'), localLodPass && (lodEvidence.present ? lodEvidence.pass : facts.lodPresent) && courtGate(providerCourt, 'lod_platform_budget_gate') !== false, 'LOD_OR_PLATFORM_BUDGET_NOT_VERIFIED', localFileInspection ? 'local LOD sequence inspection' : lodEvidence.present ? 'provider evidence' : 'candidate artifact'),
    makeGate('collision_gate', required.has('collision_gate'), (collisionEvidence.present ? collisionEvidence.pass : facts.collisionPresent) && courtGate(providerCourt, 'collision_gate') !== false, 'COLLISION_NOT_VERIFIED', collisionEvidence.present ? 'provider evidence' : 'candidate artifact'),
    makeGate('platform_gate', required.has('platform_gate'), Boolean(evidence.platform?.status ? statusPass(evidence.platform) : facts.workspaceReport?.scores?.platform >= 6500), 'TARGET_PLATFORM_NOT_VERIFIED', evidence.platform ? 'provider evidence' : 'workspace report'),
    makeGate('provenance_license_gate', required.has('provenance_license_gate'), provenanceLicensePass, strictProvenanceLicense ? 'INDEPENDENT_PROVENANCE_LICENSE_PROOF_REQUIRED' : 'PROVENANCE_OR_LICENSE_AUDIT_INCOMPLETE', strictProvenanceLicense || effectiveProvenanceLicenseProof ? 'external provenance/license audit receipt' : provenanceEvidence.present || licenseEvidence.present ? 'provider evidence' : 'candidate/provider metadata'),
    makeGate('art_direction_gate', required.has('art_direction_gate'), artDirectionReviewPass, 'ART_DIRECTION_REVIEW_REQUIRED', 'external art-direction review receipt'),
    makeGate('runtime_projection_gate', required.has('runtime_projection_gate'), runtimePass && courtGate(providerCourt, 'vsr_projection_gate') !== false, 'VSR_PROJECTION_NOT_EXECUTED_OR_VERIFIED', runtimeProjectionEvidence.present ? 'provider evidence' : 'workspace runtime report'),
    makeGate('quality_tier_gate', required.has('quality_tier_gate'), genome.quality_tier === 'PREVIEW' ? facts.candidateQualityTier === genome.quality_tier : qualityProofPass, 'QUALITY_PROOF_OR_LOCAL_INSPECTION_MISSING', genome.quality_tier === 'PREVIEW' ? 'candidate quality tier' : 'external quality proof + local inspection'),
    makeGate('human_review_gate', required.has('human_review_gate'), humanReviewPass, 'HUMAN_ART_REVIEW_REQUIRED', 'external human-art review receipt')
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
      collision_present: facts.collisionPresent,
      file_inspection_status: localFileInspection?.status ?? 'NOT_RUN',
      file_inspection_triangle_count: localFileInspection?.aggregates?.triangle_count ?? null,
      topology_status: localFileInspection?.aggregates?.topology_status ?? null,
      uv_status: localFileInspection?.aggregates?.uv_status ?? null,
      normal_status: localFileInspection?.aggregates?.normal_status ?? null,
      lod_inspection_status: localFileInspection?.aggregates?.lod_status ?? null,
      lod_count: localFileInspection?.aggregates?.lod_count ?? null,
      pbr_file_status: localFileInspection?.aggregates?.pbr_status ?? null,
      quality_proof_status: effectiveQualityProof ? (qualityProofVerification.valid ? 'PASS' : 'FAIL') : 'NOT_RUN',
      provenance_license_proof_status: effectiveProvenanceLicenseProof ? (provenanceLicenseProofVerification.valid ? 'PASS' : 'FAIL') : 'NOT_RUN',
      evidence_bundle_status: evidenceBundle ? (evidenceBundleVerification.valid ? 'PASS' : 'FAIL') : 'NOT_RUN'
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
      provider_evidence_root: evidence.evidence_root ?? rootHash(evidence),
      file_inspection: localFileInspection,
      file_inspection_verification: fileInspectionVerification,
      art_direction_review: effectiveArtDirectionReview,
      art_direction_review_verification: artDirectionReviewVerification,
      human_review: effectiveHumanReview,
      human_review_verification: humanReviewVerification,
      quality_proof: effectiveQualityProof,
      quality_proof_verification: qualityProofVerification,
      provenance_license_proof: effectiveProvenanceLicenseProof,
      provenance_license_proof_verification: provenanceLicenseProofVerification,
      evidence_bundle: evidenceBundle,
      evidence_bundle_verification: evidenceBundleVerification
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
      evidence_ledger_root: ledger.ledger_root,
      file_inspection_root: execution.file_inspection?.inspection_root ?? null
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
      file_inspection_root: execution.file_inspection?.inspection_root ?? null,
      failure_code: execution.failure?.code ?? null
    },
    candidate_root: candidate?.candidate_root ?? null,
    acceptance_root: acceptance.acceptance_root,
    evidence_ledger_root: ledger.ledger_root,
    file_inspection_root: execution.file_inspection?.inspection_root ?? null,
    output: {
      directory: outDir,
      genome: 'universal-art-asset-genome.json',
      provider_resolution: 'universal-art-asset-provider-resolution.json',
      acceptance: 'universal-art-asset-acceptance.json',
      evidence_ledger: 'universal-art-asset-evidence-ledger.json',
      file_inspection: execution.file_inspection ? 'universal-art-asset-file-inspection.json' : null,
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

function persistForge({outDir, genome, resolution, acceptance, evidence, forge, execution, candidate, providerResult = null, workspaceVerification = null, providerExecutionReceipt = null}) {
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
  if (execution.file_inspection) writeJson(outDir, 'universal-art-asset-file-inspection.json', execution.file_inspection);
  if (providerResult) writeJson(outDir, 'universal-art-asset-provider-result.json', providerResult);
  if (providerExecutionReceipt) writeJson(outDir, 'universal-art-asset-provider-execution.json', providerExecutionReceipt);
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
  const pbrArtifact = candidate?.artifacts?.['pbr-texture-pack'];
  const pbrPack = candidate?.variant && pbrArtifact
    ? {
      metadata: pbrArtifact.metadata ?? null,
      files: (pbrArtifact.files ?? [])
        .filter(file => PBR_TEXTURE_ROLES.includes(String(file.role ?? '').toLowerCase()))
        .map(file => ({
          path: path.join('candidates', candidate.variant, file.name),
          role: file.role,
          expected_sha256: file.root
        }))
    }
    : null;
  const fileInspection = candidate?.variant
    ? inspectUniversalArtAssetFiles({
      baseDir: outDir,
      files: [0, 1, 2].map(lod => ({
        path: path.join('candidates', candidate.variant, 'mesh', `lod${lod}.glb`),
        role: lod === 0 ? 'mesh-glb' : `mesh-lod${lod}-glb`,
        lod
      })),
      pbrPack
    })
    : null;
  const execution = {
    mode: 'RAGF_REFERENCE_WORKSPACE',
    status: workspaceVerification.valid ? 'COMPLETED' : 'FAILED',
    runtime_binding: 'BUILTIN_REFERENCE',
    provider_id: provider?.provider_id ?? null,
    provider_root: provider?.provider_root ?? null,
    workspace_root: workspace.workspace_root,
    workspace_verification: workspaceVerification,
    file_inspection: fileInspection,
    failure: workspaceVerification.valid ? null : {code: 'RAGF_WORKSPACE_VERIFICATION_FAILED', errors: workspaceVerification.errors}
  };
  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome,
    workspace,
    candidate,
    execution,
    provider,
    fileInspection,
    artDirectionReview: options.artDirectionReview ?? null,
    humanReview: options.humanReview ?? null,
    qualityProof: options.qualityProof ?? options.qualityReceipt ?? null,
    provenanceLicenseProof: options.provenanceLicenseProof ?? options.provenanceLicenseReceipt ?? null,
    evidenceBundle: options.evidenceBundle ?? options.evidenceBundleReceipt ?? null,
    runtimeEvidence: options.runtimeEvidence ?? null
  });
  const evidence = createLedger({genome, provider, candidate, acceptance});
  const providerExecutionReceipt = createUniversalArtAssetProviderExecutionReceipt({
    genome,
    resolution,
    execution,
    workspaceVerification,
    candidate,
    acceptance,
    evidenceLedger: evidence.ledger,
    fileInspection
  });
  const status = acceptance.pass ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED';
  const forge = forgeEnvelope({genome, resolution, execution, candidate, acceptance, ledger: evidence.ledger, outDir, status});
  persistForge({outDir, genome, resolution, acceptance, evidence, forge, execution, candidate, workspaceVerification, providerExecutionReceipt});
  return {status, forge, genome, resolution, execution, workspace, workspaceVerification, candidate, acceptance, fileInspection, evidenceLedger: evidence.ledger, evidenceVerification: evidence.verification, providerExecutionReceipt};
}

function generateWithProvider({genome, resolution, outDir, options, adapterInfo}) {
  const providerRequest = {
    format: UNIVERSAL_ART_ASSET_FORGE_FORMAT,
    universal_genome_root: genome.genome_root,
    asset_profile: genome.asset_profile,
    target_quality_tier: genome.quality_tier,
    representation_contract: genome.representation_contract
  };
  const execution = adapterInfo.adapter.generate({
    genome: genome.ragf_genome,
    asset_id: genome.asset_id,
    quality_tier: genome.quality_tier === 'AAA' ? 'PRODUCTION' : genome.quality_tier,
    seed: genome.ragf_genome.seed,
    request: providerRequest
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
  const glbFiles = materialization?.materialized?.filter(file => /\.glb$/i.test(file.path)) ?? [];
  const pbrFiles = materialization?.materialized?.filter(file => PBR_TEXTURE_ROLES.includes(String(file.role ?? '').toLowerCase())) ?? [];
  const pbrPack = pbrFiles.length
    ? {files: pbrFiles.map(file => ({path: file.path, role: file.role, expected_sha256: file.sha256}))}
    : null;
  const fileInspection = glbFiles.length
    ? inspectUniversalArtAssetFiles({baseDir: outDir, files: glbFiles.map(file => ({path: file.path, role: file.role, lod: inferLod(file.path)})), pbrPack})
    : null;
  const executionEnvelope = {
    mode: 'RAGF_EXTERNAL_PROVIDER',
    status: execution.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
    runtime_binding: adapterInfo.adapter.healthCheck().runtime,
    provider_id: execution.provider?.id ?? adapterInfo.manifest?.id ?? null,
    provider_root: execution.provider?.manifest_root ?? adapterInfo.manifest?.manifest_root ?? null,
    job: execution.job ?? null,
    failure: execution.failure ?? null,
    materialization,
    file_inspection: fileInspection
  };
  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome,
    candidate,
    execution: executionEnvelope,
    provider: execution.provider ?? adapterInfo.manifest,
    providerCourt,
    providerEvidence: options.providerEvidence ?? {},
    fileInspection,
    artDirectionReview: options.artDirectionReview ?? null,
    humanReview: options.humanReview ?? null,
    qualityProof: options.qualityProof ?? options.qualityReceipt ?? null,
    provenanceLicenseProof: options.provenanceLicenseProof ?? options.provenanceLicenseReceipt ?? null,
    evidenceBundle: options.evidenceBundle ?? options.evidenceBundleReceipt ?? null,
    runtimeEvidence: options.runtimeEvidence ?? null
  });
  const evidence = createLedger({genome, provider: execution.provider ?? adapterInfo.manifest, job: execution.job, result: execution.result, candidate, acceptance});
  const providerExecutionReceipt = createUniversalArtAssetProviderExecutionReceipt({
    genome,
    resolution,
    execution: executionEnvelope,
    providerExecution: execution,
    candidate,
    providerCourt,
    acceptance,
    evidenceLedger: evidence.ledger,
    fileInspection,
    materialization,
    request: providerRequest
  });
  const status = acceptance.pass ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED';
  const forge = forgeEnvelope({genome, resolution, execution: executionEnvelope, candidate, acceptance, ledger: evidence.ledger, outDir, status});
  persistForge({outDir, genome, resolution, acceptance, evidence, forge, execution: executionEnvelope, candidate, providerResult: execution.result, providerExecutionReceipt});
  return {status, forge, genome, resolution, execution: executionEnvelope, providerExecution: execution, candidate, providerCourt, acceptance, fileInspection, evidenceLedger: evidence.ledger, evidenceVerification: evidence.verification, materialization, providerExecutionReceipt};
}

function generateBlocked({genome, resolution, outDir, execution}) {
  const acceptance = evaluateUniversalArtAssetAcceptance({genome, execution});
  const evidence = createLedger({genome, provider: null, acceptance});
  const providerExecutionReceipt = createUniversalArtAssetProviderExecutionReceipt({
    genome,
    resolution,
    execution,
    acceptance,
    evidenceLedger: evidence.ledger
  });
  const forge = forgeEnvelope({genome, resolution, execution, candidate: null, acceptance, ledger: evidence.ledger, outDir, status: 'BLOCKED'});
  persistForge({outDir, genome, resolution, acceptance, evidence, forge, execution, candidate: null, providerExecutionReceipt});
  return {status: 'BLOCKED', forge, genome, resolution, execution, candidate: null, acceptance, fileInspection: null, evidenceLedger: evidence.ledger, evidenceVerification: evidence.verification, providerExecutionReceipt};
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

export function verifyUniversalArtAssetForge({forge, genome, acceptance, evidenceLedger, fileInspection} = {}) {
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
  if (fileInspection) {
    const result = verifyUniversalArtAssetFileInspection(fileInspection);
    if (!result.valid) errors.push(...result.errors.map(error => `FILE_INSPECTION_${error}`));
    if (forge?.file_inspection_root !== fileInspection.inspection_root) errors.push('FORGE_FILE_INSPECTION_ROOT_MISMATCH');
  }
  const copy = clone(forge ?? {});
  const actual = copy.forge_root;
  delete copy.forge_root;
  if (!actual || actual !== rootHash(copy)) errors.push('FORGE_ROOT_INVALID');
  return {valid: errors.length === 0, errors, forge_root: forge?.forge_root ?? null};
}

function universalArtAssetProviderExecutionSealedRoot(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const copy = clone(value);
  const actual = copy[field];
  delete copy[field];
  return isHexRoot(actual) && actual === rootHash(copy);
}

function universalArtAssetProviderExecutionRequest({genome, resolution, execution, request = null}) {
  return seal({
    format: 'urrf.universal-art-asset-provider-execution-request.v0.1',
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    asset_id: genome?.asset_id ?? null,
    asset_profile: genome?.asset_profile ?? null,
    quality_tier: genome?.quality_tier ?? null,
    seed: genome?.ragf_genome?.seed ?? genome?.seed ?? null,
    genome_root: genome?.genome_root ?? null,
    resolution_root: resolution?.resolution_root ?? null,
    provider_id: execution?.provider_id ?? resolution?.selected_provider_id ?? null,
    provider_root: execution?.provider_root ?? resolution?.selected_provider_root ?? null,
    provider_source: resolution?.selected_provider_source ?? null,
    payload: request === undefined ? null : clone(request),
    request_root: ''
  }, 'request_root');
}

function universalArtAssetProviderExecutionMaterialization(materialization) {
  if (!materialization || typeof materialization !== 'object' || Array.isArray(materialization)) {
    return {path: null, files: [], skipped: [], root: null};
  }
  const files = (Array.isArray(materialization.materialized) ? materialization.materialized : []).map(file => ({
    path: file?.path ?? null,
    role: file?.role ?? null,
    byte_length: file?.byte_length ?? null,
    sha256: file?.sha256 ?? null,
    declared_sha256: file?.declared_sha256 ?? null
  }));
  const skipped = (Array.isArray(materialization.skipped) ? materialization.skipped : []).map(file => ({
    path: file?.path ?? null,
    reason: file?.reason ?? null
  }));
  const base = {path: materialization.root ?? null, files, skipped};
  return {...base, root: rootHash(base)};
}

function universalArtAssetProviderExecutionRuntimeFacts({execution, providerExecution, workspaceVerification}) {
  const mode = execution?.mode ?? null;
  const status = execution?.status ?? null;
  const attempted = mode !== 'PROVIDER_RESOLUTION';
  const providerRuntimePerformed = mode === 'RAGF_EXTERNAL_PROVIDER'
    && providerExecution?.status === 'COMPLETED'
    && providerExecution?.job?.state === 'COMPLETED';
  const runtimeExecutionPerformed = mode === 'RAGF_REFERENCE_WORKSPACE'
    ? status === 'COMPLETED' && workspaceVerification?.valid !== false
    : providerRuntimePerformed;
  const expectedStatus = mode === 'RAGF_EXTERNAL_PROVIDER'
    ? providerExecution?.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED'
    : status;
  return {
    attempted,
    providerRuntimePerformed,
    runtimeExecutionPerformed,
    expectedStatus
  };
}

function universalArtAssetProviderExecutionOutput({execution, providerExecution, candidate, providerCourt, acceptance, evidenceLedger, fileInspection, materialization}) {
  const job = providerExecution?.job ?? null;
  const result = providerExecution?.result ?? null;
  const failure = providerExecution?.failure ?? execution?.failure ?? null;
  const materialized = universalArtAssetProviderExecutionMaterialization(materialization);
  const outputBase = {
    workspace_root: execution?.workspace_root ?? null,
    workspace_verified: execution?.workspace_verification?.valid ?? null,
    job_root: job?.job_root ?? null,
    result_root: result?.result_root ?? null,
    failure_code: failure?.code ?? null,
    failure_root: failure?.failure_root ?? null,
    candidate_root: candidate?.candidate_root ?? null,
    provider_court_root: providerCourt?.court_root ?? null,
    acceptance_root: acceptance?.acceptance_root ?? null,
    evidence_ledger_root: evidenceLedger?.ledger_root ?? null,
    file_inspection_root: fileInspection?.inspection_root ?? execution?.file_inspection?.inspection_root ?? null,
    materialization_path: materialized.path,
    materialization_root: materialized.root,
    materialized_file_count: materialized.files.length,
    materialized_file_roots: materialized.files,
    materialization_skipped: materialized.skipped,
    output_root: ''
  };
  return seal(outputBase, 'output_root');
}

function universalArtAssetProviderExecutionChecks({assetId, assetProfile, genomeRoot, resolutionRoot, providerId, providerRoot, providerSource, request, resolution, execution, providerExecution, failureInput = null, workspaceVerification, candidate, providerCourt, acceptance, evidenceLedger, fileInspection, materialization, output, top}) {
  const job = providerExecution?.job ?? null;
  const result = providerExecution?.result ?? null;
  const failure = failureInput ?? providerExecution?.failure ?? execution?.failure ?? null;
  const facts = universalArtAssetProviderExecutionRuntimeFacts({execution, providerExecution, workspaceVerification});
  const materialized = universalArtAssetProviderExecutionMaterialization(materialization);
  const requestCopy = request && typeof request === 'object' && !Array.isArray(request) ? clone(request) : null;
  if (requestCopy) delete requestCopy.request_root;
  const outputCopy = clone(output ?? {});
  const actualOutputRoot = outputCopy.output_root;
  delete outputCopy.output_root;
  const expectedJobIntegrity = execution?.mode === 'RAGF_EXTERNAL_PROVIDER'
    ? universalArtAssetProviderExecutionSealedRoot(job, 'job_root')
      && job.provider_id === providerId
      && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.state)
    : job === null;
  const expectedResultIntegrity = result === null
    ? facts.providerRuntimePerformed === false
    : universalArtAssetProviderExecutionSealedRoot(result, 'result_root')
      && result.provider_id === providerId
      && (providerRoot === null || result.provider_root === providerRoot)
      && (!job || job.result_root === result.result_root);
  const expectedFailureIntegrity = execution?.status === 'FAILED'
    ? nonEmptyText(failure?.code)
      && (failure?.failure_root
        ? universalArtAssetProviderExecutionSealedRoot(failure, 'failure_root')
        : execution?.mode !== 'RAGF_EXTERNAL_PROVIDER')
    : failure === null;
  const expectedMaterializationIntegrity = materialization === null || materialization === undefined
    ? output.materialization_root === null && output.materialized_file_roots.length === 0 && output.materialization_skipped.length === 0
    : materialized.root === output.materialization_root
      && rootHash(materialized.files) === rootHash(output.materialized_file_roots)
      && rootHash(materialized.skipped) === rootHash(output.materialization_skipped)
      && output.materialized_file_count === materialized.files.length
      && materialized.files.every(file => nonEmptyText(file.path) && isHexRoot(file.sha256));
  const expectedProviderBinding = request.provider_id === providerId
    && request.provider_root === providerRoot
    && request.provider_source === providerSource
    && (providerSource === null
      ? providerId === null && providerRoot === null
      : nonEmptyText(providerId) && isHexRoot(providerRoot))
    && (resolution
      ? request.provider_id === (resolution.selected_provider_id ?? null)
        && request.provider_root === (resolution.selected_provider_root ?? null)
        && request.resolution_root === resolution.resolution_root
      : true);
  const expectedCandidateBinding = output.candidate_root === (candidate?.candidate_root ?? null)
    && (facts.runtimeExecutionPerformed ? isHexRoot(output.candidate_root) : output.candidate_root === null);
  const expectedAcceptanceBinding = output.acceptance_root === (acceptance?.acceptance_root ?? output.acceptance_root)
    && isHexRoot(output.acceptance_root);
  const expectedEvidenceBinding = output.evidence_ledger_root === (evidenceLedger?.ledger_root ?? output.evidence_ledger_root)
    && isHexRoot(output.evidence_ledger_root);
  return {
    genome_binding: request.asset_id === assetId
      && request.asset_profile === assetProfile
      && request.genome_root === genomeRoot
      && isHexRoot(genomeRoot),
    resolution_binding: request.resolution_root === resolutionRoot && isHexRoot(resolutionRoot),
    provider_binding: expectedProviderBinding,
    request_integrity: universalArtAssetProviderExecutionSealedRoot(request, 'request_root')
      && requestCopy !== null
      && request.request_root === rootHash(requestCopy),
    job_integrity: expectedJobIntegrity,
    result_integrity: expectedResultIntegrity,
    failure_integrity: expectedFailureIntegrity,
    materialization_integrity: expectedMaterializationIntegrity,
    output_integrity: isHexRoot(actualOutputRoot) && actualOutputRoot === rootHash(outputCopy),
    candidate_binding: expectedCandidateBinding,
    acceptance_binding: expectedAcceptanceBinding,
    evidence_binding: expectedEvidenceBinding,
    execution_truthfulness: execution?.mode === 'RAGF_EXTERNAL_PROVIDER'
      ? execution.status === facts.expectedStatus
        && execution.attempted === facts.attempted
        && execution.runtime_execution_performed === facts.runtimeExecutionPerformed
        && execution.provider_runtime_performed === facts.providerRuntimePerformed
        && execution.job_state === (job?.state ?? null)
      : execution.status === facts.expectedStatus
        && execution.attempted === facts.attempted
        && execution.runtime_execution_performed === facts.runtimeExecutionPerformed
        && execution.provider_runtime_performed === facts.providerRuntimePerformed
        && execution.job_state === null,
    no_aaa_escalation: top.aaa_ready === false
      && top.release_ready === false
      && top.execution_performed === facts.runtimeExecutionPerformed,
    authority_boundary: top.candidate_only === true
      && top.authoritative === false
      && top.canonical_write_authorized === false
      && top.authority?.provider_can_write_authoritative_world_state === false
      && top.authority?.provider_can_commit === false
      && top.authority?.acceptance_can_commit === false
      && top.authority?.rncs_authority_required === true
  };
}

function buildUniversalArtAssetProviderExecutionReceipt({genome, resolution, execution, providerExecution = null, workspaceVerification = null, candidate = null, providerCourt = null, acceptance = null, evidenceLedger = null, fileInspection = null, materialization = null, request = null} = {}) {
  if (!genome || !resolution || !execution) throw new GenesisError('UNIVERSAL_ART_ASSET_PROVIDER_EXECUTION_INPUT_REQUIRED');
  const provider = providerExecution?.provider ?? null;
  const providerId = execution.provider_id ?? provider?.id ?? provider?.provider_id ?? resolution.selected_provider_id ?? null;
  const providerRoot = execution.provider_root ?? provider?.manifest_root ?? provider?.provider_root ?? resolution.selected_provider_root ?? null;
  const providerSource = resolution.selected_provider_source ?? null;
  const normalizedExecution = {
    mode: execution.mode ?? null,
    status: execution.status ?? null,
    provider_id: providerId,
    provider_root: providerRoot,
    provider_source: providerSource,
    runtime_binding: execution.runtime_binding ?? (execution.mode === 'RAGF_REFERENCE_WORKSPACE' ? 'BUILTIN_REFERENCE' : execution.mode === 'PROVIDER_RESOLUTION' ? 'UNRESOLVED' : null),
    attempted: false,
    runtime_execution_performed: false,
    provider_runtime_performed: false,
    job_state: providerExecution?.job?.state ?? null,
    failure_code: providerExecution?.failure?.code ?? execution.failure?.code ?? null
  };
  const facts = universalArtAssetProviderExecutionRuntimeFacts({execution: normalizedExecution, providerExecution, workspaceVerification});
  normalizedExecution.attempted = facts.attempted;
  normalizedExecution.runtime_execution_performed = facts.runtimeExecutionPerformed;
  normalizedExecution.provider_runtime_performed = facts.providerRuntimePerformed;
  const executionRequest = universalArtAssetProviderExecutionRequest({genome, resolution, execution: normalizedExecution, request});
  const output = universalArtAssetProviderExecutionOutput({execution, providerExecution, candidate, providerCourt, acceptance, evidenceLedger, fileInspection, materialization});
  const top = {
    aaa_ready: false,
    release_ready: false,
    execution_performed: facts.runtimeExecutionPerformed,
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    authority: {
      provider_can_write_authoritative_world_state: false,
      provider_can_commit: false,
      acceptance_can_commit: false,
      rncs_authority_required: true
    }
  };
  const checks = universalArtAssetProviderExecutionChecks({
    assetId: genome.asset_id,
    assetProfile: genome.asset_profile,
    genomeRoot: genome.genome_root,
    resolutionRoot: resolution.resolution_root,
    providerId,
    providerRoot,
    providerSource,
    request: executionRequest,
    resolution,
    execution: normalizedExecution,
    providerExecution,
    failureInput: providerExecution?.failure ?? execution.failure ?? null,
    workspaceVerification,
    candidate,
    providerCourt,
    acceptance,
    evidenceLedger,
    fileInspection,
    materialization,
    output,
    top
  });
  const receipt = {
    format: UNIVERSAL_ART_ASSET_PROVIDER_EXECUTION_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    execution_id: stableId('urrf-universal-art-asset-provider-execution', {
      request_root: executionRequest.request_root,
      output_root: output.output_root,
      status: normalizedExecution.status
    }),
    source: 'urrf-provider-execution-evaluator',
    asset_id: genome.asset_id,
    asset_profile: genome.asset_profile,
    quality_tier: genome.quality_tier,
    genome_root: genome.genome_root,
    resolution_root: resolution.resolution_root,
    provider_id: providerId,
    provider_root: providerRoot,
    provider_source: providerSource,
    request: executionRequest,
    execution: normalizedExecution,
    output,
    replay: {
      input_root: executionRequest.request_root,
      output_root: output.output_root,
      status: 'NOT_RUN',
      deterministic_claim: 'NOT_PROVEN',
      provider_runtime_replay_required: normalizedExecution.mode === 'RAGF_EXTERNAL_PROVIDER',
      replay_authority: 'PROVIDER_RUNTIME_REQUIRED'
    },
    checks,
    status: Object.values(checks).every(Boolean) ? 'CANDIDATE_PROVIDER_EXECUTION_PASS' : 'CANDIDATE_PROVIDER_EXECUTION_FAIL',
    execution_attempted: facts.attempted,
    execution_performed: facts.runtimeExecutionPerformed,
    provider_runtime_performed: facts.providerRuntimePerformed,
    aaa_ready: false,
    release_ready: false,
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
    execution_root: ''
  };
  return seal(receipt, 'execution_root');
}

/**
 * Seal the exact URRF Provider request, Job/Result/Failure roots and local
 * materialization outcome. A valid receipt can describe a blocked execution;
 * receipt validity never means the Provider produced AAA art.
 */
export function createUniversalArtAssetProviderExecutionReceipt(input = {}) {
  return buildUniversalArtAssetProviderExecutionReceipt(input);
}

/**
 * Verify an execution receipt. Supplying the original generation objects adds
 * exact replay of the receipt content; without them, the persisted receipt is
 * still checked for internal roots, bindings, and fail-closed status.
 */
export function verifyUniversalArtAssetProviderExecutionReceipt(receipt, {
  genome = null,
  resolution = null,
  execution = null,
  providerExecution = null,
  workspaceVerification = null,
  candidate = null,
  providerCourt = null,
  acceptance = null,
  evidenceLedger = null,
  fileInspection = null,
  materialization = null,
  request = null
} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) return {valid: false, errors: ['PROVIDER_EXECUTION_RECEIPT_NOT_OBJECT'], execution_root: null};
  try {
    check(receipt.format === UNIVERSAL_ART_ASSET_PROVIDER_EXECUTION_FORMAT, 'PROVIDER_EXECUTION_RECEIPT_FORMAT_INVALID');
    check(receipt.version === UNIVERSAL_ART_ASSET_FORGE_VERSION, 'PROVIDER_EXECUTION_RECEIPT_VERSION_INVALID');
    check(nonEmptyText(receipt.execution_id), 'PROVIDER_EXECUTION_RECEIPT_ID_MISSING');
    check(receipt.source === 'urrf-provider-execution-evaluator', 'PROVIDER_EXECUTION_RECEIPT_SOURCE_INVALID');
    check(UNIVERSAL_ART_ASSET_PROFILES.includes(receipt.asset_profile), 'PROVIDER_EXECUTION_RECEIPT_PROFILE_INVALID');
    check(nonEmptyText(receipt.asset_id), 'PROVIDER_EXECUTION_RECEIPT_ASSET_ID_INVALID');
    check(isHexRoot(receipt.genome_root) && isHexRoot(receipt.resolution_root), 'PROVIDER_EXECUTION_RECEIPT_ROOT_INVALID');
    check(receipt.provider_id === null || nonEmptyText(receipt.provider_id), 'PROVIDER_EXECUTION_RECEIPT_PROVIDER_ID_INVALID');
    check(receipt.provider_root === null || isHexRoot(receipt.provider_root), 'PROVIDER_EXECUTION_RECEIPT_PROVIDER_ROOT_INVALID');
    check(receipt.provider_source === null || ['ragf-reference-provider', 'external-provider-contract', 'injected-provider'].includes(receipt.provider_source), 'PROVIDER_EXECUTION_RECEIPT_PROVIDER_SOURCE_INVALID');
    const requestRecord = record(receipt.request);
    const output = record(receipt.output);
    const executionRecord = record(receipt.execution);
    check(universalArtAssetProviderExecutionSealedRoot(requestRecord, 'request_root'), 'PROVIDER_EXECUTION_RECEIPT_REQUEST_ROOT_INVALID');
    check(universalArtAssetProviderExecutionSealedRoot(output, 'output_root'), 'PROVIDER_EXECUTION_RECEIPT_OUTPUT_ROOT_INVALID');
    check(requestRecord.asset_id === receipt.asset_id
      && requestRecord.asset_profile === receipt.asset_profile
      && requestRecord.genome_root === receipt.genome_root
      && requestRecord.resolution_root === receipt.resolution_root, 'PROVIDER_EXECUTION_RECEIPT_REQUEST_BINDING_INVALID');
    check(requestRecord.provider_id === receipt.provider_id
      && requestRecord.provider_root === receipt.provider_root
      && requestRecord.provider_source === receipt.provider_source, 'PROVIDER_EXECUTION_RECEIPT_REQUEST_PROVIDER_INVALID');
    check(receipt.replay?.input_root === requestRecord.request_root
      && receipt.replay?.output_root === output.output_root
      && receipt.replay?.status === 'NOT_RUN'
      && receipt.replay?.deterministic_claim === 'NOT_PROVEN'
      && receipt.replay?.replay_authority === 'PROVIDER_RUNTIME_REQUIRED', 'PROVIDER_EXECUTION_RECEIPT_REPLAY_BOUNDARY_INVALID');
    check(receipt.replay?.provider_runtime_replay_required === (executionRecord.mode === 'RAGF_EXTERNAL_PROVIDER'), 'PROVIDER_EXECUTION_RECEIPT_REPLAY_REQUIREMENT_INVALID');
    check(['RAGF_REFERENCE_WORKSPACE', 'RAGF_EXTERNAL_PROVIDER', 'PROVIDER_RESOLUTION'].includes(executionRecord.mode), 'PROVIDER_EXECUTION_RECEIPT_MODE_INVALID');
    check(['COMPLETED', 'FAILED'].includes(executionRecord.status), 'PROVIDER_EXECUTION_RECEIPT_STATUS_INVALID');
    check(['BUILTIN_REFERENCE', 'CONTRACT_ONLY', 'EXECUTOR_INJECTED', 'EXTERNAL_PROCESS', 'UNRESOLVED', null].includes(executionRecord.runtime_binding), 'PROVIDER_EXECUTION_RECEIPT_RUNTIME_BINDING_INVALID');
    check(typeof receipt.execution_attempted === 'boolean'
      && typeof receipt.execution_performed === 'boolean'
      && typeof receipt.provider_runtime_performed === 'boolean', 'PROVIDER_EXECUTION_RECEIPT_EXECUTION_FLAGS_INVALID');
    const job = output.job_root === null ? null : {job_root: output.job_root, provider_id: receipt.provider_id, state: executionRecord.job_state, result_root: output.result_root};
    const result = output.result_root === null ? null : {result_root: output.result_root, provider_id: receipt.provider_id, provider_root: receipt.provider_root};
    const failure = output.failure_code === null ? null : {code: output.failure_code, failure_root: output.failure_root};
    const facts = universalArtAssetProviderExecutionRuntimeFacts({
      execution: executionRecord,
      providerExecution: {status: executionRecord.status, job},
      workspaceVerification: {valid: output.workspace_verified}
    });
    const materializationBase = {
      path: output.materialization_path,
      files: output.materialized_file_roots,
      skipped: output.materialization_skipped
    };
    const materializationIntegrity = output.materialization_root === null
      ? output.materialized_file_roots.length === 0 && output.materialization_skipped.length === 0
      : isHexRoot(output.materialization_root)
        && output.materialization_root === rootHash(materializationBase)
        && output.materialized_file_count === output.materialized_file_roots.length
        && output.materialized_file_roots.every(file => nonEmptyText(file?.path) && isHexRoot(file?.sha256));
    const expectedChecks = {
      genome_binding: requestRecord.asset_id === receipt.asset_id
        && requestRecord.asset_profile === receipt.asset_profile
        && requestRecord.genome_root === receipt.genome_root
        && isHexRoot(receipt.genome_root),
      resolution_binding: requestRecord.resolution_root === receipt.resolution_root && isHexRoot(receipt.resolution_root),
      provider_binding: requestRecord.provider_id === receipt.provider_id
        && requestRecord.provider_root === receipt.provider_root
        && requestRecord.provider_source === receipt.provider_source
        && (receipt.provider_source === null
          ? receipt.provider_id === null && receipt.provider_root === null
          : nonEmptyText(receipt.provider_id) && isHexRoot(receipt.provider_root)),
      request_integrity: universalArtAssetProviderExecutionSealedRoot(requestRecord, 'request_root'),
      job_integrity: executionRecord.mode === 'RAGF_EXTERNAL_PROVIDER'
        ? isHexRoot(output.job_root) && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(executionRecord.job_state)
        : output.job_root === null,
      result_integrity: output.result_root === null
        ? facts.providerRuntimePerformed === false
        : isHexRoot(output.result_root) && facts.providerRuntimePerformed === true,
      failure_integrity: executionRecord.status === 'FAILED'
        ? nonEmptyText(output.failure_code)
          && (executionRecord.mode === 'RAGF_EXTERNAL_PROVIDER'
            ? isHexRoot(output.failure_root)
            : output.failure_root === null || isHexRoot(output.failure_root))
        : output.failure_code === null && output.failure_root === null,
      materialization_integrity: materializationIntegrity,
      output_integrity: universalArtAssetProviderExecutionSealedRoot(output, 'output_root'),
      candidate_binding: output.candidate_root === null
        ? facts.runtimeExecutionPerformed === false
        : facts.runtimeExecutionPerformed === true && isHexRoot(output.candidate_root),
      acceptance_binding: isHexRoot(output.acceptance_root),
      evidence_binding: isHexRoot(output.evidence_ledger_root),
      execution_truthfulness: executionRecord.status === facts.expectedStatus
        && receipt.execution_attempted === facts.attempted
        && receipt.execution_performed === facts.runtimeExecutionPerformed
        && receipt.provider_runtime_performed === facts.providerRuntimePerformed
        && executionRecord.attempted === facts.attempted
        && executionRecord.runtime_execution_performed === facts.runtimeExecutionPerformed
        && executionRecord.provider_runtime_performed === facts.providerRuntimePerformed
        && executionRecord.job_state === (job?.state ?? null),
      no_aaa_escalation: receipt.aaa_ready === false
        && receipt.release_ready === false
        && receipt.execution_performed === facts.runtimeExecutionPerformed,
      authority_boundary: receipt.candidate_only === true
        && receipt.authoritative === false
        && receipt.canonical_write_authorized === false
        && receipt.authority?.canonical_owner === 'RNCS'
        && receipt.authority?.representation_owner === 'URRF'
        && receipt.authority?.provider_can_write_authoritative_world_state === false
        && receipt.authority?.provider_can_commit === false
        && receipt.authority?.acceptance_can_commit === false
        && receipt.authority?.rncs_authority_required === true
    };
    const receiptChecks = record(receipt.checks);
    check(Object.keys(expectedChecks).every(key => typeof receiptChecks[key] === 'boolean'), 'PROVIDER_EXECUTION_RECEIPT_CHECKS_INVALID');
    for (const [key, value] of Object.entries(expectedChecks)) check(receiptChecks[key] === value, `PROVIDER_EXECUTION_RECEIPT_CHECK_${key.toUpperCase()}_MISMATCH`);
    const expectedStatus = Object.values(expectedChecks).every(Boolean) ? 'CANDIDATE_PROVIDER_EXECUTION_PASS' : 'CANDIDATE_PROVIDER_EXECUTION_FAIL';
    check(receipt.status === expectedStatus, 'PROVIDER_EXECUTION_RECEIPT_STATUS_MISMATCH');
    const copy = clone(receipt);
    const actual = copy.execution_root;
    delete copy.execution_root;
    check(isHexRoot(actual) && actual === rootHash(copy), 'PROVIDER_EXECUTION_RECEIPT_ROOT_INVALID');
    const completeReplay = genome && resolution && execution;
    if (completeReplay) {
      const expectedReceipt = buildUniversalArtAssetProviderExecutionReceipt({
        genome,
        resolution,
        execution,
        providerExecution,
        workspaceVerification,
        candidate,
        providerCourt,
        acceptance,
        evidenceLedger,
        fileInspection,
        materialization,
        request
      });
      delete expectedReceipt.execution_root;
      check(rootHash(copy) === rootHash(expectedReceipt), 'PROVIDER_EXECUTION_RECEIPT_CONTENT_MISMATCH');
    }
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, execution_root: receipt.execution_root ?? null};
}

function batchAssetKey(input, index) {
  const raw = String(record(input).asset_key ?? record(input).assetKey ?? record(input).name ?? `asset-${index + 1}`).trim();
  return raw || `asset-${index + 1}`;
}

function batchAssetDirectoryName(assetKey, index) {
  const slug = String(assetKey)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `asset-${index + 1}`;
  return `${String(index + 1).padStart(3, '0')}-${slug}`;
}

function artifactRootIndexForBatchAssets(assets) {
  const index = {};
  for (const asset of assets ?? []) {
    const artifactRoots = record(asset.artifact_roots);
    for (const [role, root] of Object.entries(artifactRoots)) {
      if (!isHexRoot(root)) continue;
      index[root] ??= [];
      index[root].push({asset_key: asset.asset_key, role});
    }
  }
  return Object.fromEntries(Object.entries(index)
    .sort(([left], [right]) => left.localeCompare(right, 'en'))
    .map(([root, references]) => [
      root,
      references.sort((left, right) => `${left.asset_key}:${left.role}`.localeCompare(`${right.asset_key}:${right.role}`, 'en'))
    ]));
}

function universalArtAssetBatchSummary(entry, index) {
  const result = entry.result;
  return {
    asset_key: entry.asset_key,
    index,
    output_directory: entry.output_directory,
    asset_id: result.genome?.asset_id ?? null,
    asset_profile: result.genome?.asset_profile ?? null,
    quality_tier: result.genome?.quality_tier ?? null,
    status: result.status ?? 'BLOCKED',
    acceptance_pass: result.acceptance?.pass === true,
    genome_root: result.genome?.genome_root ?? null,
    candidate_root: result.candidate?.candidate_root ?? null,
    acceptance_root: result.acceptance?.acceptance_root ?? null,
    forge_root: result.forge?.forge_root ?? null,
    artifact_roots: artifactRootsForCandidate(result.candidate),
    failures: [...(result.acceptance?.failures ?? [])]
  };
}

/**
 * Generate several URRF art-asset candidates in one candidate-only batch.
 * Each asset keeps an isolated output directory and full Forge result while
 * the batch adds a rooted summary and cross-asset artifact-root index for
 * later composition/deduplication. Provider execution, acceptance, and RNCS
 * authority remain per-asset boundaries; the batch never writes canonical
 * world truth.
 */
export function generateUniversalArtAssetBatch(inputs = [], options = {}) {
  const requests = Array.isArray(inputs) ? inputs : record(inputs).assets ?? record(inputs).requests;
  if (!Array.isArray(requests) || requests.length === 0 || requests.length > 64 || requests.some(input => !input || typeof input !== 'object' || Array.isArray(input))) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_BATCH_INPUT_INVALID');
  }
  const outDir = ensureOutputDir(options.outDir);
  const keys = requests.map((input, index) => batchAssetKey(input, index));
  if (new Set(keys).size !== keys.length) throw new GenesisError('UNIVERSAL_ART_ASSET_BATCH_DUPLICATE_ASSET_KEY');
  const sharedOptions = {...options};
  delete sharedOptions.outDir;
  delete sharedOptions.assetOptions;
  delete sharedOptions.asset_options;
  const assetOptions = options.assetOptions ?? options.asset_options ?? null;
  const assets = requests.map((input, index) => {
    const assetKey = keys[index];
    const perAssetOptions = Array.isArray(assetOptions)
      ? record(assetOptions[index])
      : record(assetOptions?.[assetKey] ?? assetOptions?.[index]);
    const outputDirectory = path.join(outDir, 'assets', batchAssetDirectoryName(assetKey, index));
    const result = generateUniversalArtAsset(input, {
      ...sharedOptions,
      ...perAssetOptions,
      outDir: outputDirectory
    });
    return {asset_key: assetKey, index, output_directory: outputDirectory, result};
  });
  const summaries = assets.map(universalArtAssetBatchSummary);
  const artifactRootIndex = artifactRootIndexForBatchAssets(summaries);
  const acceptancePassCount = summaries.filter(asset => asset.acceptance_pass).length;
  const readyCount = summaries.filter(asset => asset.status === 'READY_FOR_HUMAN_REVIEW').length;
  const blockedCount = summaries.length - readyCount;
  const batchStatus = acceptancePassCount === summaries.length ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED';
  const batch = seal({
    format: UNIVERSAL_ART_ASSET_BATCH_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    batch_id: stableId('urrf-universal-art-asset-batch', {
      assets: summaries.map(asset => ({asset_key: asset.asset_key, genome_root: asset.genome_root}))
    }),
    output_directory: outDir,
    asset_count: summaries.length,
    assets: summaries,
    summary: {
      asset_count: summaries.length,
      ready_count: readyCount,
      blocked_count: blockedCount,
      acceptance_pass_count: acceptancePassCount,
      all_acceptance_pass: acceptancePassCount === summaries.length,
      unique_artifact_root_count: Object.keys(artifactRootIndex).length
    },
    artifact_root_index: artifactRootIndex,
    status: batchStatus,
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
    batch_root: ''
  }, 'batch_root');
  const verification = verifyUniversalArtAssetBatch(batch, {assetResults: assets});
  if (!verification.valid) throw new GenesisError('UNIVERSAL_ART_ASSET_BATCH_INVALID', verification.errors.join(','));
  return {status: batchStatus, batch, assets, verification};
}

/**
 * Verify a batch envelope and, when supplied, each embedded Forge result.
 * Cross-asset artifact roots are checked as an index only; sharing a root is
 * evidence of reusable content, not an automatic promotion or dedup write.
 */
export function verifyUniversalArtAssetBatch(batch, {assetResults = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!batch || typeof batch !== 'object' || Array.isArray(batch)) return {valid: false, errors: ['BATCH_NOT_OBJECT'], batch_root: null};
  try {
    check(batch.format === UNIVERSAL_ART_ASSET_BATCH_FORMAT, 'BATCH_FORMAT_INVALID');
    check(batch.version === UNIVERSAL_ART_ASSET_FORGE_VERSION, 'BATCH_VERSION_INVALID');
    check(nonEmptyText(batch.batch_id), 'BATCH_ID_MISSING');
    check(nonEmptyText(batch.output_directory), 'BATCH_OUTPUT_DIRECTORY_MISSING');
    check(Array.isArray(batch.assets) && batch.assets.length > 0 && batch.assets.length <= 64, 'BATCH_ASSETS_INVALID');
    const assets = Array.isArray(batch.assets) ? batch.assets : [];
    check(batch.asset_count === assets.length, 'BATCH_ASSET_COUNT_MISMATCH');
    const keys = assets.map(asset => asset?.asset_key);
    check(keys.every(nonEmptyText) && new Set(keys).size === keys.length, 'BATCH_ASSET_KEYS_INVALID');
    const indexes = assets.map(asset => asset?.index);
    check(indexes.every(index => Number.isSafeInteger(index) && index >= 0 && index < assets.length) && new Set(indexes).size === assets.length && [...indexes].sort((left, right) => left - right).every((index, position) => index === position), 'BATCH_ASSET_INDEX_SET_INVALID');
    const readyCount = assets.filter(asset => asset?.status === 'READY_FOR_HUMAN_REVIEW').length;
    const blockedCount = assets.filter(asset => asset?.status === 'BLOCKED').length;
    const acceptancePassCount = assets.filter(asset => asset?.acceptance_pass === true).length;
    check(readyCount + blockedCount === assets.length, 'BATCH_ASSET_STATUS_INVALID');
    check(batch.summary?.asset_count === assets.length, 'BATCH_SUMMARY_ASSET_COUNT_MISMATCH');
    check(batch.summary?.ready_count === readyCount, 'BATCH_READY_COUNT_MISMATCH');
    check(batch.summary?.blocked_count === blockedCount, 'BATCH_BLOCKED_COUNT_MISMATCH');
    check(batch.summary?.acceptance_pass_count === acceptancePassCount, 'BATCH_ACCEPTANCE_COUNT_MISMATCH');
    check(batch.summary?.all_acceptance_pass === (acceptancePassCount === assets.length), 'BATCH_ACCEPTANCE_STATUS_MISMATCH');
    check(batch.status === (acceptancePassCount === assets.length ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED'), 'BATCH_STATUS_MISMATCH');
    for (const asset of assets) {
      check(Number.isSafeInteger(asset?.index) && asset.index >= 0 && asset.index < assets.length, `BATCH_ASSET_INDEX_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(isHexRoot(asset?.genome_root), `BATCH_GENOME_ROOT_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(asset?.candidate_root === null || isHexRoot(asset?.candidate_root), `BATCH_CANDIDATE_ROOT_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(isHexRoot(asset?.acceptance_root), `BATCH_ACCEPTANCE_ROOT_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(isHexRoot(asset?.forge_root), `BATCH_FORGE_ROOT_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(['PREVIEW', 'PRODUCTION', 'AAA'].includes(asset?.quality_tier), `BATCH_QUALITY_TIER_INVALID:${asset?.asset_key ?? 'unknown'}`);
      const artifactRoots = record(asset.artifact_roots);
      for (const [role, root] of Object.entries(artifactRoots)) {
        check(nonEmptyText(role) && isHexRoot(root), `BATCH_ARTIFACT_ROOT_INVALID:${asset?.asset_key ?? 'unknown'}:${role}`);
      }
    }
    const expectedArtifactRootIndex = artifactRootIndexForBatchAssets(assets);
    check(batch.summary?.unique_artifact_root_count === Object.keys(expectedArtifactRootIndex).length, 'BATCH_UNIQUE_ARTIFACT_ROOT_COUNT_MISMATCH');
    check(rootHash(record(batch.artifact_root_index)) === rootHash(expectedArtifactRootIndex), 'BATCH_ARTIFACT_ROOT_INDEX_MISMATCH');
    if (assetResults !== null) {
      check(Array.isArray(assetResults) && assetResults.length === assets.length, 'BATCH_ASSET_RESULTS_INVALID');
      const resultEntries = new Map((Array.isArray(assetResults) ? assetResults : []).map(entry => [entry?.asset_key, entry]));
      for (const summary of assets) {
        const entry = resultEntries.get(summary.asset_key);
        const result = entry?.result ?? null;
        if (!result) {
          errors.push(`BATCH_ASSET_RESULT_MISSING:${summary.asset_key}`);
          continue;
        }
        const forgeVerification = verifyUniversalArtAssetForge({
          forge: result.forge,
          genome: result.genome,
          acceptance: result.acceptance,
          evidenceLedger: result.evidenceLedger,
          fileInspection: result.fileInspection
        });
        if (!forgeVerification.valid) errors.push(...forgeVerification.errors.map(error => `BATCH_${summary.asset_key}_${error}`));
        check(result.status === summary.status, `BATCH_RESULT_STATUS_MISMATCH:${summary.asset_key}`);
        check(result.acceptance?.pass === summary.acceptance_pass, `BATCH_RESULT_ACCEPTANCE_MISMATCH:${summary.asset_key}`);
        check(result.genome?.genome_root === summary.genome_root, `BATCH_RESULT_GENOME_ROOT_MISMATCH:${summary.asset_key}`);
        check((result.candidate?.candidate_root ?? null) === summary.candidate_root, `BATCH_RESULT_CANDIDATE_ROOT_MISMATCH:${summary.asset_key}`);
        check(result.acceptance?.acceptance_root === summary.acceptance_root, `BATCH_RESULT_ACCEPTANCE_ROOT_MISMATCH:${summary.asset_key}`);
        check(result.forge?.forge_root === summary.forge_root, `BATCH_RESULT_FORGE_ROOT_MISMATCH:${summary.asset_key}`);
        check(rootHash(record(summary.artifact_roots)) === rootHash(artifactRootsForCandidate(result.candidate)), `BATCH_RESULT_ARTIFACT_ROOTS_MISMATCH:${summary.asset_key}`);
      }
    }
    check(batch.candidate_only === true && batch.authoritative === false && batch.canonical_write_authorized === false, 'BATCH_AUTHORITY_INVALID');
    check(batch.authority?.canonical_owner === 'RNCS' && batch.authority?.representation_owner === 'URRF', 'BATCH_OWNER_INVALID');
    check(batch.authority?.provider_can_write_authoritative_world_state === false && batch.authority?.provider_can_commit === false && batch.authority?.acceptance_can_commit === false && batch.authority?.rncs_authority_required === true, 'BATCH_PROVIDER_AUTHORITY_INVALID');
    const copy = clone(batch);
    const actual = copy.batch_root;
    delete copy.batch_root;
    check(isHexRoot(actual) && actual === rootHash(copy), 'BATCH_ROOT_INVALID');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, batch_root: batch.batch_root ?? null};
}

function normalizeUniversalArtAssetHoldoutProfiles(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > UNIVERSAL_ART_ASSET_PROFILES.length) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_HOLDOUT_PROFILES_INVALID');
  }
  const profiles = [...new Set(value.map(profile => String(profile).trim().toLowerCase()))].sort((left, right) => left.localeCompare(right, 'en'));
  if (profiles.length === 0 || profiles.some(profile => !UNIVERSAL_ART_ASSET_PROFILES.includes(profile))) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_HOLDOUT_PROFILE_INVALID');
  }
  return profiles;
}

function normalizeUniversalArtAssetHoldoutRootList(value, field) {
  const roots = value === undefined || value === null ? [] : value;
  if (!Array.isArray(roots)) throw new GenesisError('UNIVERSAL_ART_ASSET_HOLDOUT_ROOT_LIST_INVALID', field);
  const normalized = [...new Set(roots.map(root => String(root)))].sort((left, right) => left.localeCompare(right, 'en'));
  if (normalized.some(root => !isHexRoot(root))) throw new GenesisError('UNIVERSAL_ART_ASSET_HOLDOUT_ROOT_INVALID', field);
  return normalized;
}

function normalizeUniversalArtAssetHoldoutBaselineRoots(value = {}) {
  const source = record(value);
  const batchRoot = source.batch_root ?? source.batchRoot ?? null;
  if (!isHexRoot(batchRoot)) throw new GenesisError('UNIVERSAL_ART_ASSET_HOLDOUT_BASELINE_BATCH_ROOT_REQUIRED');
  return {
    batch_root: batchRoot,
    genome_roots: normalizeUniversalArtAssetHoldoutRootList(source.genome_roots ?? source.genomeRoots, 'genome_roots'),
    candidate_roots: normalizeUniversalArtAssetHoldoutRootList(source.candidate_roots ?? source.candidateRoots, 'candidate_roots'),
    forge_roots: normalizeUniversalArtAssetHoldoutRootList(source.forge_roots ?? source.forgeRoots, 'forge_roots')
  };
}

function universalArtAssetHoldoutBatchInput(batch, assetResults = null) {
  const {envelope, assetResults: embeddedResults} = universalArtAssetAssemblyBatchInput(batch, assetResults);
  if (envelope?.format !== UNIVERSAL_ART_ASSET_BATCH_FORMAT) throw new GenesisError('UNIVERSAL_ART_ASSET_HOLDOUT_BATCH_INVALID');
  const entries = Array.isArray(assetResults) ? assetResults : embeddedResults;
  if (!Array.isArray(entries) || entries.length !== envelope.assets?.length) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_HOLDOUT_ASSET_RESULTS_REQUIRED');
  }
  return {envelope, entries};
}

function universalArtAssetHoldoutMetric(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function universalArtAssetHoldoutAssetSummary(entry, index) {
  const selected = record(entry);
  const result = record(selected.result);
  const genome = record(result.genome);
  const candidate = record(result.candidate);
  const acceptance = record(result.acceptance);
  const inspection = result.fileInspection ?? result.execution?.file_inspection ?? null;
  const inspectionRecord = record(inspection);
  const aggregates = record(inspectionRecord.aggregates);
  const inspectionVerification = verifyUniversalArtAssetFileInspection(inspection);
  const structuralChecks = {
    candidate_root: isHexRoot(candidate.candidate_root),
    file_inspection: inspectionVerification.valid && inspectionRecord.status === 'PASS',
    geometry: statusPass(aggregates.geometry_status),
    topology: statusPass(aggregates.topology_status),
    uv: statusPass(aggregates.uv_status),
    normal: statusPass(aggregates.normal_status),
    pbr: statusPass(aggregates.pbr_status),
    lod: statusPass(aggregates.lod_status)
  };
  return {
    asset_key: String(selected.asset_key ?? ''),
    index,
    asset_id: genome.asset_id ?? null,
    asset_profile: genome.asset_profile ?? null,
    quality_tier: genome.quality_tier ?? null,
    status: result.status ?? 'BLOCKED',
    structural_pass: Object.values(structuralChecks).every(Boolean),
    structural_checks: structuralChecks,
    structural_failures: Object.keys(structuralChecks).filter(key => !structuralChecks[key]),
    acceptance_pass: acceptance.pass === true,
    genome_root: genome.genome_root ?? null,
    candidate_root: candidate.candidate_root ?? null,
    forge_root: result.forge?.forge_root ?? null,
    file_inspection_root: inspectionRecord.inspection_root ?? null,
    triangle_count: universalArtAssetHoldoutMetric(aggregates.triangle_count),
    lod_count: universalArtAssetHoldoutMetric(aggregates.lod_count),
    pbr_channel_count: universalArtAssetHoldoutMetric(inspectionRecord.pbr_pack?.texture_count),
    acceptance_failures: [...(Array.isArray(acceptance.failures) ? acceptance.failures : [])].map(String)
  };
}

function universalArtAssetHoldoutRootOverlap(assets, baseline) {
  const baselineRoots = new Set([
    baseline.batch_root,
    ...baseline.genome_roots,
    ...baseline.candidate_roots,
    ...baseline.forge_roots
  ].filter(isHexRoot));
  const holdoutRoots = assets.flatMap(asset => [asset.genome_root, asset.candidate_root, asset.forge_root]).filter(isHexRoot);
  return [...new Set(holdoutRoots.filter(root => baselineRoots.has(root)))].sort((left, right) => left.localeCompare(right, 'en'));
}

function universalArtAssetHoldoutRootSet(assets, field) {
  return assets.map(asset => asset[field]).filter(isHexRoot);
}

function universalArtAssetHoldoutUniqueRoots(assets, field) {
  const roots = universalArtAssetHoldoutRootSet(assets, field);
  return roots.length === assets.length && new Set(roots).size === assets.length;
}

function buildUniversalArtAssetHoldoutReport({holdoutId = null, batch, assetResults = null, expectedProfiles, baselineRoots} = {}) {
  const {envelope, entries} = universalArtAssetHoldoutBatchInput(batch, assetResults);
  const expected = normalizeUniversalArtAssetHoldoutProfiles(expectedProfiles);
  const baseline = normalizeUniversalArtAssetHoldoutBaselineRoots(baselineRoots);
  const assets = entries.map((entry, index) => universalArtAssetHoldoutAssetSummary(entry, index));
  const batchAssets = Array.isArray(envelope.assets) ? envelope.assets : [];
  if (assets.some((asset, index) => !nonEmptyText(asset.asset_key) || asset.asset_key !== batchAssets[index]?.asset_key)) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_HOLDOUT_ASSET_BINDING_INVALID');
  }
  const observed = [...new Set(assets.map(asset => asset.asset_profile).filter(nonEmptyText))].sort((left, right) => left.localeCompare(right, 'en'));
  const missing = expected.filter(profile => !observed.includes(profile));
  const rootOverlap = universalArtAssetHoldoutRootOverlap(assets, baseline);
  const batchVerification = verifyUniversalArtAssetBatch(envelope, {assetResults: entries});
  const checks = {
    batch_verification: batchVerification.valid,
    asset_count: assets.length > 0 && assets.length === envelope.asset_count,
    asset_keys_unique: assets.every(asset => nonEmptyText(asset.asset_key)) && new Set(assets.map(asset => asset.asset_key)).size === assets.length,
    expected_profile_coverage: expected.length > 0 && missing.length === 0,
    unique_genome_roots: universalArtAssetHoldoutUniqueRoots(assets, 'genome_root'),
    unique_candidate_roots: universalArtAssetHoldoutUniqueRoots(assets, 'candidate_root'),
    unique_forge_roots: universalArtAssetHoldoutUniqueRoots(assets, 'forge_root'),
    structural_inspection: assets.length > 0 && assets.every(asset => asset.structural_pass),
    baseline_batch_root_distinct: envelope.batch_root !== baseline.batch_root,
    baseline_root_isolation: rootOverlap.length === 0
  };
  const status = Object.values(checks).every(Boolean) ? 'CANDIDATE_HOLDOUT_PASS' : 'CANDIDATE_HOLDOUT_FAIL';
  const resolvedHoldoutId = holdoutId === null || holdoutId === undefined
    ? stableId('urrf-universal-art-asset-holdout', {batch_root: envelope.batch_root, expected_profiles: expected, baseline_roots: baseline})
    : String(holdoutId).trim();
  if (!nonEmptyText(resolvedHoldoutId)) throw new GenesisError('UNIVERSAL_ART_ASSET_HOLDOUT_ID_INVALID');
  return {
    format: UNIVERSAL_ART_ASSET_HOLDOUT_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    holdout_id: resolvedHoldoutId,
    source: 'urrf-holdout-evaluator',
    batch_root: envelope.batch_root,
    baseline_roots: baseline,
    asset_count: assets.length,
    assets,
    summary: {
      asset_count: assets.length,
      structural_pass_count: assets.filter(asset => asset.structural_pass).length,
      acceptance_pass_count: assets.filter(asset => asset.acceptance_pass).length,
      blocked_count: assets.filter(asset => asset.status === 'BLOCKED').length
    },
    coverage: {
      expected_profiles: expected,
      observed_profiles: observed,
      missing_profiles: missing,
      unique_genome_root_count: new Set(universalArtAssetHoldoutRootSet(assets, 'genome_root')).size,
      unique_candidate_root_count: new Set(universalArtAssetHoldoutRootSet(assets, 'candidate_root')).size,
      unique_forge_root_count: new Set(universalArtAssetHoldoutRootSet(assets, 'forge_root')).size,
      baseline_overlap_roots: rootOverlap
    },
    checks,
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
    holdout_root: ''
  };
}

/**
 * Evaluate a new-seed asset batch against an explicit baseline batch.
 * A passing holdout report means that the candidate-only structural and root
 * regression protocol passed; it never upgrades a blocked AAA acceptance.
 */
export function createUniversalArtAssetHoldoutReport({holdout_id = null, holdoutId = null, batch, assetResults = null, expected_profiles = null, expectedProfiles = null, baseline_roots = null, baselineRoots = null} = {}) {
  const base = buildUniversalArtAssetHoldoutReport({
    holdoutId: holdout_id ?? holdoutId,
    batch,
    assetResults,
    expectedProfiles: expected_profiles ?? expectedProfiles,
    baselineRoots: baseline_roots ?? baselineRoots
  });
  return seal(base, 'holdout_root');
}

/**
 * Verify a persisted holdout report and, when supplied, recompute it from the
 * actual batch/results so a self-resealed summary cannot hide root reuse.
 */
export function verifyUniversalArtAssetHoldoutReport(report, {batch = null, assetResults = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!report || typeof report !== 'object' || Array.isArray(report)) return {valid: false, errors: ['HOLDOUT_REPORT_NOT_OBJECT'], holdout_root: null};
  try {
    check(report.format === UNIVERSAL_ART_ASSET_HOLDOUT_FORMAT, 'HOLDOUT_FORMAT_INVALID');
    check(report.version === UNIVERSAL_ART_ASSET_FORGE_VERSION, 'HOLDOUT_VERSION_INVALID');
    check(nonEmptyText(report.holdout_id), 'HOLDOUT_ID_MISSING');
    check(report.source === 'urrf-holdout-evaluator', 'HOLDOUT_SOURCE_INVALID');
    check(isHexRoot(report.batch_root), 'HOLDOUT_BATCH_ROOT_INVALID');
    const assets = Array.isArray(report.assets) ? report.assets : [];
    check(assets.length > 0 && assets.length <= 64, 'HOLDOUT_ASSETS_INVALID');
    check(report.asset_count === assets.length, 'HOLDOUT_ASSET_COUNT_MISMATCH');
    const indexes = assets.map(asset => asset?.index);
    check(indexes.every(index => Number.isSafeInteger(index) && index >= 0 && index < assets.length) && new Set(indexes).size === assets.length && [...indexes].sort((left, right) => left - right).every((index, position) => index === position), 'HOLDOUT_ASSET_INDEX_SET_INVALID');
    const keys = assets.map(asset => asset?.asset_key);
    check(keys.every(nonEmptyText) && new Set(keys).size === assets.length, 'HOLDOUT_ASSET_KEYS_INVALID');
    for (const asset of assets) {
      check(nonEmptyText(asset?.asset_id), `HOLDOUT_ASSET_ID_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(UNIVERSAL_ART_ASSET_PROFILES.includes(asset?.asset_profile), `HOLDOUT_ASSET_PROFILE_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(UNIVERSAL_ART_ASSET_QUALITY_TIERS.includes(asset?.quality_tier), `HOLDOUT_ASSET_QUALITY_TIER_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(['BLOCKED', 'READY_FOR_HUMAN_REVIEW'].includes(asset?.status), `HOLDOUT_ASSET_STATUS_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(typeof asset?.structural_pass === 'boolean', `HOLDOUT_ASSET_STRUCTURAL_STATUS_INVALID:${asset?.asset_key ?? 'unknown'}`);
      const structuralChecks = record(asset?.structural_checks);
      const structuralCheckKeys = ['candidate_root', 'file_inspection', 'geometry', 'topology', 'uv', 'normal', 'pbr', 'lod'];
      check(structuralCheckKeys.every(key => typeof structuralChecks[key] === 'boolean'), `HOLDOUT_ASSET_STRUCTURAL_CHECKS_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(asset?.structural_pass === structuralCheckKeys.every(key => structuralChecks[key] === true), `HOLDOUT_ASSET_STRUCTURAL_STATUS_MISMATCH:${asset?.asset_key ?? 'unknown'}`);
      const structuralFailures = structuralCheckKeys.filter(key => structuralChecks[key] !== true);
      check(rootHash(structuralFailures) === rootHash(asset?.structural_failures ?? []), `HOLDOUT_ASSET_STRUCTURAL_FAILURES_MISMATCH:${asset?.asset_key ?? 'unknown'}`);
      check(isHexRoot(asset?.genome_root), `HOLDOUT_ASSET_GENOME_ROOT_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(asset?.candidate_root === null || isHexRoot(asset?.candidate_root), `HOLDOUT_ASSET_CANDIDATE_ROOT_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(isHexRoot(asset?.forge_root), `HOLDOUT_ASSET_FORGE_ROOT_INVALID:${asset?.asset_key ?? 'unknown'}`);
      check(asset?.file_inspection_root === null || isHexRoot(asset?.file_inspection_root), `HOLDOUT_ASSET_INSPECTION_ROOT_INVALID:${asset?.asset_key ?? 'unknown'}`);
    }
    const expected = normalizeUniversalArtAssetHoldoutProfiles(report.coverage?.expected_profiles);
    const observed = [...new Set(assets.map(asset => asset.asset_profile))].sort((left, right) => left.localeCompare(right, 'en'));
    const missing = expected.filter(profile => !observed.includes(profile));
    check(rootHash(observed) === rootHash(report.coverage?.observed_profiles ?? []), 'HOLDOUT_OBSERVED_PROFILES_MISMATCH');
    check(rootHash(missing) === rootHash(report.coverage?.missing_profiles ?? []), 'HOLDOUT_MISSING_PROFILES_MISMATCH');
    const baseline = normalizeUniversalArtAssetHoldoutBaselineRoots(report.baseline_roots);
    const overlap = universalArtAssetHoldoutRootOverlap(assets, baseline);
    check(rootHash(overlap) === rootHash(report.coverage?.baseline_overlap_roots ?? []), 'HOLDOUT_BASELINE_OVERLAP_MISMATCH');
    check(report.summary?.asset_count === assets.length, 'HOLDOUT_SUMMARY_ASSET_COUNT_MISMATCH');
    check(report.summary?.structural_pass_count === assets.filter(asset => asset.structural_pass).length, 'HOLDOUT_SUMMARY_STRUCTURAL_COUNT_MISMATCH');
    check(report.summary?.acceptance_pass_count === assets.filter(asset => asset.acceptance_pass === true).length, 'HOLDOUT_SUMMARY_ACCEPTANCE_COUNT_MISMATCH');
    check(report.summary?.blocked_count === assets.filter(asset => asset.status === 'BLOCKED').length, 'HOLDOUT_SUMMARY_BLOCKED_COUNT_MISMATCH');
    check(report.coverage?.unique_genome_root_count === new Set(universalArtAssetHoldoutRootSet(assets, 'genome_root')).size, 'HOLDOUT_UNIQUE_GENOME_ROOT_COUNT_MISMATCH');
    check(report.coverage?.unique_candidate_root_count === new Set(universalArtAssetHoldoutRootSet(assets, 'candidate_root')).size, 'HOLDOUT_UNIQUE_CANDIDATE_ROOT_COUNT_MISMATCH');
    check(report.coverage?.unique_forge_root_count === new Set(universalArtAssetHoldoutRootSet(assets, 'forge_root')).size, 'HOLDOUT_UNIQUE_FORGE_ROOT_COUNT_MISMATCH');
    const checks = record(report.checks);
    const checkNames = ['batch_verification', 'asset_count', 'asset_keys_unique', 'expected_profile_coverage', 'unique_genome_roots', 'unique_candidate_roots', 'unique_forge_roots', 'structural_inspection', 'baseline_batch_root_distinct', 'baseline_root_isolation'];
    check(checkNames.every(key => typeof checks[key] === 'boolean'), 'HOLDOUT_CHECKS_INVALID');
    const expectedChecks = {
      asset_count: assets.length > 0 && report.asset_count === assets.length,
      asset_keys_unique: keys.every(nonEmptyText) && new Set(keys).size === assets.length,
      expected_profile_coverage: expected.length > 0 && missing.length === 0,
      unique_genome_roots: universalArtAssetHoldoutUniqueRoots(assets, 'genome_root'),
      unique_candidate_roots: universalArtAssetHoldoutUniqueRoots(assets, 'candidate_root'),
      unique_forge_roots: universalArtAssetHoldoutUniqueRoots(assets, 'forge_root'),
      structural_inspection: assets.length > 0 && assets.every(asset => asset.structural_pass),
      baseline_batch_root_distinct: report.batch_root !== baseline.batch_root,
      baseline_root_isolation: overlap.length === 0
    };
    for (const [key, value] of Object.entries(expectedChecks)) check(checks[key] === value, `HOLDOUT_CHECK_${key.toUpperCase()}_MISMATCH`);
    check(checks.batch_verification === true, 'HOLDOUT_BATCH_VERIFICATION_NOT_PASS');
    const expectedStatus = Object.values(checks).every(Boolean) ? 'CANDIDATE_HOLDOUT_PASS' : 'CANDIDATE_HOLDOUT_FAIL';
    check(report.status === expectedStatus, 'HOLDOUT_STATUS_MISMATCH');
    check(report.candidate_only === true && report.authoritative === false && report.canonical_write_authorized === false, 'HOLDOUT_AUTHORITY_INVALID');
    check(report.authority?.canonical_owner === 'RNCS' && report.authority?.representation_owner === 'URRF', 'HOLDOUT_OWNER_INVALID');
    check(report.authority?.provider_can_write_authoritative_world_state === false && report.authority?.provider_can_commit === false && report.authority?.acceptance_can_commit === false && report.authority?.rncs_authority_required === true, 'HOLDOUT_PROVIDER_AUTHORITY_INVALID');
    const copy = clone(report);
    const actual = copy.holdout_root;
    delete copy.holdout_root;
    check(isHexRoot(actual) && actual === rootHash(copy), 'HOLDOUT_ROOT_INVALID');
    if (batch !== null || assetResults !== null) {
      const expectedReport = buildUniversalArtAssetHoldoutReport({
        holdoutId: report.holdout_id,
        batch,
        assetResults,
        expectedProfiles: expected,
        baselineRoots: baseline
      });
      delete expectedReport.holdout_root;
      check(rootHash(copy) === rootHash(expectedReport), 'HOLDOUT_CONTENT_MISMATCH');
    }
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, holdout_root: report.holdout_root ?? null};
}

function normalizeUniversalArtAssetProfileCoverageProfiles(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > UNIVERSAL_ART_ASSET_PROFILES.length) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_PROFILES_INVALID');
  }
  const raw = value.map(profile => String(profile).trim().toLowerCase());
  const profiles = UNIVERSAL_ART_ASSET_PROFILES.filter(profile => raw.includes(profile));
  if (profiles.length !== raw.length || new Set(raw).size !== raw.length) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_PROFILE_INVALID');
  }
  return profiles;
}

function normalizeUniversalArtAssetProfileCoverageMode(value) {
  const mode = String(value ?? '').trim().toUpperCase();
  if (!UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_MODES.includes(mode)) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_MODE_INVALID', mode);
  }
  return mode;
}

function normalizeUniversalArtAssetProfileCoverageExpectedModes(value, profiles) {
  const source = record(value);
  const unknown = Object.keys(source).filter(profile => !profiles.includes(profile));
  if (unknown.length) throw new GenesisError('UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_EXPECTED_MODE_PROFILE_INVALID', unknown.join(','));
  return Object.fromEntries(profiles
    .filter(profile => source[profile] !== undefined)
    .map(profile => [profile, normalizeUniversalArtAssetProfileCoverageMode(source[profile])]));
}

function universalArtAssetProfileCoverageDefaultMode(profile, resolution = null) {
  if (profileContract(profile).builtin_reference) return 'BUILTIN_REFERENCE';
  if (resolution && resolution.eligible === false) return 'UNRESOLVED';
  if (profile === 'vfx' && resolution === null) return 'UNRESOLVED';
  return 'EXTERNAL_CONTRACT_ONLY';
}

function universalArtAssetProfileCoverageInputProfile(input) {
  const value = record(input);
  const hasProfileCue = value.asset_profile !== undefined || value.profile !== undefined || value.asset_kind !== undefined;
  return hasProfileCue ? normalizeProfile(value) : null;
}

function universalArtAssetProfileCoverageObservedMode(entry) {
  const resolution = record(entry?.resolution);
  const execution = record(entry?.execution);
  const candidate = record(entry?.candidate);
  const selectedProviderId = nonEmptyText(resolution.selected_provider_id) ? resolution.selected_provider_id : null;
  const selectedProviderSource = resolution.selected_provider_source ?? null;
  const candidatePresent = candidate.present === true;
  const executionStatus = execution.status ?? null;
  const failureCode = execution.failure_code ?? null;
  if (selectedProviderSource === 'ragf-reference-provider'
    && resolution.runtime_status === 'READY_REFERENCE'
    && executionStatus === 'COMPLETED'
    && execution.provider_id === selectedProviderId
    && candidatePresent) return 'BUILTIN_REFERENCE';
  if (selectedProviderSource === 'external-provider-contract'
    && nonEmptyText(selectedProviderId)
    && resolution.runtime_status === 'CONTRACT_ONLY'
    && executionStatus === 'FAILED'
    && execution.provider_id === null
    && failureCode === 'PROFILE_PROVIDER_RUNTIME_NOT_BOUND'
    && !candidatePresent) return 'EXTERNAL_CONTRACT_ONLY';
  if (selectedProviderSource === 'external-provider-contract'
    && nonEmptyText(selectedProviderId)
    && executionStatus === 'COMPLETED'
    && nonEmptyText(execution.provider_id)
    && candidatePresent) return 'EXTERNAL_EXECUTED';
  if (selectedProviderSource === 'injected-provider'
    && nonEmptyText(selectedProviderId)
    && executionStatus === 'COMPLETED'
    && nonEmptyText(execution.provider_id)
    && candidatePresent) return 'INJECTED_EXECUTED';
  if (selectedProviderId === null
    && selectedProviderSource === null
    && resolution.eligible === false
    && resolution.runtime_status === 'UNRESOLVED'
    && executionStatus === 'FAILED'
    && execution.provider_id === null
    && failureCode === 'PROFILE_PROVIDER_UNRESOLVED'
    && !candidatePresent) return 'UNRESOLVED';
  return 'INCONSISTENT';
}

function universalArtAssetProfileCoverageEntryChecks(entry, expectedMode) {
  const resolution = record(entry?.resolution);
  const execution = record(entry?.execution);
  const candidate = record(entry?.candidate);
  const authority = record(entry?.authority);
  const observedMode = universalArtAssetProfileCoverageObservedMode(entry);
  const profile = entry?.asset_profile ?? null;
  const resolutionIntegrity = resolution.format === UNIVERSAL_ART_ASSET_PROVIDER_RESOLUTION_FORMAT
    && resolution.version === UNIVERSAL_ART_ASSET_FORGE_VERSION
    && isHexRoot(resolution.resolution_root)
    && resolution.asset_id === entry?.asset_id
    && resolution.asset_profile === profile
    && resolution.genome_root === entry?.genome_root;
  const candidateBinding = typeof candidate.present === 'boolean'
    && (candidate.present ? isHexRoot(candidate.candidate_root) : candidate.candidate_root === null);
  const authorityBoundary = authority.candidate_only === true
    && authority.authoritative === false
    && authority.canonical_write_authorized === false
    && authority.provider_can_write_authoritative_world_state === false
    && authority.provider_can_commit === false
    && authority.acceptance_can_commit === false
    && authority.rncs_authority_required === true;
  const checks = {
    profile_binding: nonEmptyText(entry?.requested_profile)
      && entry.requested_profile === profile
      && entry.forge_asset_profile === profile
      && resolution.asset_profile === profile,
    genome_binding: isHexRoot(entry?.genome_root)
      && entry.forge_genome_root === entry.genome_root
      && resolution.genome_root === entry.genome_root,
    resolution_integrity: resolutionIntegrity,
    candidate_binding: candidateBinding,
    expected_mode: observedMode === expectedMode,
    no_silent_fallback: observedMode !== 'INCONSISTENT' && observedMode === expectedMode,
    authority_boundary: authorityBoundary
  };
  return {observedMode, checks, pass: Object.values(checks).every(Boolean)};
}

function universalArtAssetProfileCoverageRootCount(entries, field) {
  const roots = entries.map(entry => entry?.[field]).filter(isHexRoot);
  return new Set(roots).size;
}

function universalArtAssetProfileCoverageGlobalChecks(entries, expectedProfiles, observedProfiles, missingProfiles, unexpectedProfiles) {
  const entryChecks = entries.map(entry => entry?.checks ?? {});
  return {
    entry_count: entries.length === expectedProfiles.length,
    profile_coverage: entries.length === expectedProfiles.length
      && observedProfiles.length === expectedProfiles.length
      && missingProfiles.length === 0
      && unexpectedProfiles.length === 0,
    unique_profiles: observedProfiles.length === entries.length,
    unique_genome_roots: entries.length > 0
      && entries.every(entry => isHexRoot(entry?.genome_root))
      && universalArtAssetProfileCoverageRootCount(entries, 'genome_root') === entries.length,
    unique_resolution_roots: entries.length > 0
      && entries.every(entry => isHexRoot(entry?.resolution_root))
      && universalArtAssetProfileCoverageRootCount(entries, 'resolution_root') === entries.length,
    entry_checks: entries.length > 0 && entries.every(entry => entry?.pass === true),
    no_silent_fallback: entries.length > 0 && entryChecks.every(checks => checks.no_silent_fallback === true),
    authority_boundary: entries.length > 0 && entryChecks.every(checks => checks.authority_boundary === true)
  };
}

function universalArtAssetProfileCoverageModeHistogram(entries) {
  return Object.fromEntries(UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_MODES.map(mode => [
    mode,
    entries.filter(entry => entry?.observed_mode === mode).length
  ]));
}

function buildUniversalArtAssetProfileCoverageEntry(entry, index, expectedMode) {
  const selected = record(entry);
  const input = record(selected.input);
  const result = record(selected.result);
  const genome = record(result.genome);
  const resolution = record(result.resolution);
  const execution = record(result.execution);
  const forge = record(result.forge);
  const candidate = record(result.candidate);
  const profile = genome.asset_profile ?? null;
  if (!UNIVERSAL_ART_ASSET_PROFILES.includes(profile)) throw new GenesisError('UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_PROFILE_INVALID', profile);
  const candidatePresent = result.candidate !== null && result.candidate !== undefined && typeof result.candidate === 'object' && !Array.isArray(result.candidate);
  const summary = {
    index,
    asset_key: nonEmptyText(selected.asset_key ?? input.asset_key) ? String(selected.asset_key ?? input.asset_key) : null,
    asset_id: genome.asset_id ?? null,
    asset_profile: profile,
    requested_profile: universalArtAssetProfileCoverageInputProfile(input),
    status: result.status ?? 'BLOCKED',
    genome_root: genome.genome_root ?? null,
    forge_asset_profile: forge.asset_profile ?? null,
    forge_genome_root: forge.genome_root ?? null,
    resolution_root: resolution.resolution_root ?? null,
    resolution: {
      format: resolution.format ?? null,
      version: resolution.version ?? null,
      asset_id: resolution.asset_id ?? null,
      asset_profile: resolution.asset_profile ?? null,
      genome_root: resolution.genome_root ?? null,
      resolution_root: resolution.resolution_root ?? null,
      selected_provider_id: resolution.selected_provider_id ?? null,
      selected_provider_root: resolution.selected_provider_root ?? null,
      selected_provider_source: resolution.selected_provider_source ?? null,
      eligible: resolution.eligible ?? null,
      runtime_status: resolution.runtime_status ?? null
    },
    execution: {
      mode: execution.mode ?? null,
      status: execution.status ?? null,
      provider_id: execution.provider_id ?? null,
      failure_code: execution.failure?.code ?? null
    },
    candidate: {
      present: candidatePresent,
      candidate_root: candidate.candidate_root ?? null
    },
    authority: {
      candidate_only: forge.candidate_only ?? null,
      authoritative: forge.authoritative ?? null,
      canonical_write_authorized: forge.canonical_write_authorized ?? null,
      provider_can_write_authoritative_world_state: forge.authority?.provider_can_write_authoritative_world_state ?? null,
      provider_can_commit: forge.authority?.provider_can_commit ?? null,
      acceptance_can_commit: forge.authority?.acceptance_can_commit ?? null,
      rncs_authority_required: forge.authority?.rncs_authority_required ?? null
    },
    expected_mode: expectedMode,
    observed_mode: null,
    checks: {},
    pass: false
  };
  const checked = universalArtAssetProfileCoverageEntryChecks(summary, expectedMode);
  summary.observed_mode = checked.observedMode;
  summary.checks = checked.checks;
  summary.pass = checked.pass;
  return summary;
}

function buildUniversalArtAssetProfileCoverageReport({coverageId = null, entries, expectedProfiles, expectedModes = {}} = {}) {
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > 64) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_ENTRIES_INVALID');
  }
  const profiles = normalizeUniversalArtAssetProfileCoverageProfiles(expectedProfiles);
  const explicitModes = normalizeUniversalArtAssetProfileCoverageExpectedModes(expectedModes, profiles);
  const profilesForEntries = entries.map(entry => {
    const result = record(entry?.result);
    const profile = record(result.genome).asset_profile ?? universalArtAssetProfileCoverageInputProfile(entry?.input);
    if (!UNIVERSAL_ART_ASSET_PROFILES.includes(profile)) throw new GenesisError('UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_PROFILE_INVALID', profile);
    return profile;
  });
  const resolvedModes = Object.fromEntries(profiles.map(profile => {
    const entryIndex = profilesForEntries.indexOf(profile);
    const resolution = entryIndex >= 0 ? record(entries[entryIndex]?.result?.resolution) : null;
    return [profile, explicitModes[profile] ?? universalArtAssetProfileCoverageDefaultMode(profile, resolution)];
  }));
  const summaries = entries.map((entry, index) => {
    const profile = profilesForEntries[index];
    const expectedMode = resolvedModes[profile] ?? universalArtAssetProfileCoverageDefaultMode(profile, record(entry?.result?.resolution));
    return buildUniversalArtAssetProfileCoverageEntry(entry, index, expectedMode);
  });
  const observedProfiles = [...new Set(summaries.map(entry => entry.asset_profile))]
    .sort((left, right) => UNIVERSAL_ART_ASSET_PROFILES.indexOf(left) - UNIVERSAL_ART_ASSET_PROFILES.indexOf(right));
  const missingProfiles = profiles.filter(profile => !observedProfiles.includes(profile));
  const unexpectedProfiles = observedProfiles.filter(profile => !profiles.includes(profile));
  const checks = universalArtAssetProfileCoverageGlobalChecks(summaries, profiles, observedProfiles, missingProfiles, unexpectedProfiles);
  const resolvedCoverageId = coverageId === null || coverageId === undefined
    ? stableId('urrf-universal-art-asset-profile-coverage', {
      expected_profiles: profiles,
      expected_modes: resolvedModes,
      roots: summaries.map(entry => ({profile: entry.asset_profile, genome_root: entry.genome_root, resolution_root: entry.resolution_root}))
    })
    : String(coverageId).trim();
  if (!nonEmptyText(resolvedCoverageId)) throw new GenesisError('UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_ID_INVALID');
  return {
    format: UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    coverage_id: resolvedCoverageId,
    source: 'urrf-profile-coverage-evaluator',
    expected_profiles: profiles,
    expected_modes: resolvedModes,
    entries: summaries,
    summary: {
      profile_count: summaries.length,
      pass_count: summaries.filter(entry => entry.pass).length,
      fail_count: summaries.filter(entry => !entry.pass).length,
      mode_histogram: universalArtAssetProfileCoverageModeHistogram(summaries)
    },
    coverage: {
      expected_profile_count: profiles.length,
      observed_profile_count: observedProfiles.length,
      expected_profiles: profiles,
      observed_profiles: observedProfiles,
      missing_profiles: missingProfiles,
      unexpected_profiles: unexpectedProfiles,
      unique_genome_root_count: universalArtAssetProfileCoverageRootCount(summaries, 'genome_root'),
      unique_resolution_root_count: universalArtAssetProfileCoverageRootCount(summaries, 'resolution_root')
    },
    checks,
    status: Object.values(checks).every(Boolean) ? 'CANDIDATE_PROFILE_COVERAGE_PASS' : 'CANDIDATE_PROFILE_COVERAGE_FAIL',
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
    coverage_root: ''
  };
}

/**
 * Summarize every exercised URRF profile while preserving the distinction
 * between a built-in reference, an unbound external contract, an executed
 * Provider, and an unresolved capability. This is coverage evidence only;
 * it cannot grant AAA acceptance or RNCS write authority.
 */
export function createUniversalArtAssetProfileCoverageReport({coverage_id = null, coverageId = null, entries = [], expected_profiles = null, expectedProfiles = null, expected_modes = null, expectedModes = null} = {}) {
  const base = buildUniversalArtAssetProfileCoverageReport({
    coverageId: coverage_id ?? coverageId,
    entries,
    expectedProfiles: expected_profiles ?? expectedProfiles,
    expectedModes: expected_modes ?? expectedModes ?? {}
  });
  return seal(base, 'coverage_root');
}

/**
 * Verify persisted profile coverage and optionally recompute it from the
 * source results so a resealed summary cannot hide a silent Provider fallback.
 */
export function verifyUniversalArtAssetProfileCoverageReport(report, {entries = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!report || typeof report !== 'object' || Array.isArray(report)) return {valid: false, errors: ['PROFILE_COVERAGE_REPORT_NOT_OBJECT'], coverage_root: null};
  try {
    check(report.format === UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_FORMAT, 'PROFILE_COVERAGE_FORMAT_INVALID');
    check(report.version === UNIVERSAL_ART_ASSET_FORGE_VERSION, 'PROFILE_COVERAGE_VERSION_INVALID');
    check(nonEmptyText(report.coverage_id), 'PROFILE_COVERAGE_ID_MISSING');
    check(report.source === 'urrf-profile-coverage-evaluator', 'PROFILE_COVERAGE_SOURCE_INVALID');
    const expectedProfiles = normalizeUniversalArtAssetProfileCoverageProfiles(report.expected_profiles);
    const expectedModes = normalizeUniversalArtAssetProfileCoverageExpectedModes(report.expected_modes, expectedProfiles);
    check(rootHash(expectedModes) === rootHash(report.expected_modes ?? {}), 'PROFILE_COVERAGE_EXPECTED_MODES_MISMATCH');
    const summaries = Array.isArray(report.entries) ? report.entries : [];
    check(summaries.length > 0 && summaries.length <= 64, 'PROFILE_COVERAGE_ENTRIES_INVALID');
    check(summaries.every((entry, index) => entry?.index === index), 'PROFILE_COVERAGE_ENTRY_INDEX_INVALID');
    const keys = summaries.map(entry => entry?.asset_key).filter(nonEmptyText);
    check(keys.length === new Set(keys).size, 'PROFILE_COVERAGE_ASSET_KEYS_INVALID');
    for (const entry of summaries) {
      const profile = entry?.asset_profile;
      check(UNIVERSAL_ART_ASSET_PROFILES.includes(profile), `PROFILE_COVERAGE_ENTRY_PROFILE_INVALID:${entry?.index ?? 'unknown'}`);
      check(nonEmptyText(entry?.asset_id), `PROFILE_COVERAGE_ENTRY_ASSET_ID_INVALID:${entry?.index ?? 'unknown'}`);
      check(entry?.requested_profile === null || UNIVERSAL_ART_ASSET_PROFILES.includes(entry?.requested_profile), `PROFILE_COVERAGE_ENTRY_REQUESTED_PROFILE_INVALID:${entry?.index ?? 'unknown'}`);
      check(isHexRoot(entry?.genome_root), `PROFILE_COVERAGE_ENTRY_GENOME_ROOT_INVALID:${entry?.index ?? 'unknown'}`);
      check(isHexRoot(entry?.forge_genome_root), `PROFILE_COVERAGE_ENTRY_FORGE_GENOME_ROOT_INVALID:${entry?.index ?? 'unknown'}`);
      check(isHexRoot(entry?.resolution_root), `PROFILE_COVERAGE_ENTRY_RESOLUTION_ROOT_INVALID:${entry?.index ?? 'unknown'}`);
      check(['BLOCKED', 'READY_FOR_HUMAN_REVIEW'].includes(entry?.status ?? 'BLOCKED') || entry?.status === undefined, `PROFILE_COVERAGE_ENTRY_STATUS_INVALID:${entry?.index ?? 'unknown'}`);
      check(UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_MODES.includes(entry?.expected_mode), `PROFILE_COVERAGE_ENTRY_EXPECTED_MODE_INVALID:${entry?.index ?? 'unknown'}`);
      check(UNIVERSAL_ART_ASSET_PROFILE_COVERAGE_MODES.includes(entry?.observed_mode), `PROFILE_COVERAGE_ENTRY_OBSERVED_MODE_INVALID:${entry?.index ?? 'unknown'}`);
      const candidate = record(entry?.candidate);
      check(typeof candidate.present === 'boolean', `PROFILE_COVERAGE_ENTRY_CANDIDATE_STATUS_INVALID:${entry?.index ?? 'unknown'}`);
      check(candidate.present ? isHexRoot(candidate.candidate_root) : candidate.candidate_root === null, `PROFILE_COVERAGE_ENTRY_CANDIDATE_ROOT_INVALID:${entry?.index ?? 'unknown'}`);
      const checks = record(entry?.checks);
      const expectedMode = expectedModes[profile] ?? entry?.expected_mode ?? universalArtAssetProfileCoverageDefaultMode(profile, record(entry?.resolution));
      const recomputed = universalArtAssetProfileCoverageEntryChecks(entry, expectedMode);
      check(entry?.expected_mode === expectedMode, `PROFILE_COVERAGE_ENTRY_EXPECTED_MODE_MISMATCH:${entry?.index ?? 'unknown'}`);
      check(entry?.observed_mode === recomputed.observedMode, `PROFILE_COVERAGE_ENTRY_OBSERVED_MODE_MISMATCH:${entry?.index ?? 'unknown'}`);
      for (const [key, value] of Object.entries(recomputed.checks)) check(checks[key] === value, `PROFILE_COVERAGE_ENTRY_CHECK_${key.toUpperCase()}_MISMATCH:${entry?.index ?? 'unknown'}`);
      check(entry?.pass === recomputed.pass, `PROFILE_COVERAGE_ENTRY_STATUS_MISMATCH:${entry?.index ?? 'unknown'}`);
    }
    const observedProfiles = [...new Set(summaries.map(entry => entry?.asset_profile).filter(profile => UNIVERSAL_ART_ASSET_PROFILES.includes(profile)))]
      .sort((left, right) => UNIVERSAL_ART_ASSET_PROFILES.indexOf(left) - UNIVERSAL_ART_ASSET_PROFILES.indexOf(right));
    const missingProfiles = expectedProfiles.filter(profile => !observedProfiles.includes(profile));
    const unexpectedProfiles = observedProfiles.filter(profile => !expectedProfiles.includes(profile));
    check(rootHash(observedProfiles) === rootHash(report.coverage?.observed_profiles ?? []), 'PROFILE_COVERAGE_OBSERVED_PROFILES_MISMATCH');
    check(rootHash(missingProfiles) === rootHash(report.coverage?.missing_profiles ?? []), 'PROFILE_COVERAGE_MISSING_PROFILES_MISMATCH');
    check(rootHash(unexpectedProfiles) === rootHash(report.coverage?.unexpected_profiles ?? []), 'PROFILE_COVERAGE_UNEXPECTED_PROFILES_MISMATCH');
    check(report.coverage?.expected_profile_count === expectedProfiles.length, 'PROFILE_COVERAGE_EXPECTED_PROFILE_COUNT_MISMATCH');
    check(report.coverage?.observed_profile_count === observedProfiles.length, 'PROFILE_COVERAGE_OBSERVED_PROFILE_COUNT_MISMATCH');
    check(report.coverage?.unique_genome_root_count === universalArtAssetProfileCoverageRootCount(summaries, 'genome_root'), 'PROFILE_COVERAGE_UNIQUE_GENOME_ROOT_COUNT_MISMATCH');
    check(report.coverage?.unique_resolution_root_count === universalArtAssetProfileCoverageRootCount(summaries, 'resolution_root'), 'PROFILE_COVERAGE_UNIQUE_RESOLUTION_ROOT_COUNT_MISMATCH');
    check(report.summary?.profile_count === summaries.length, 'PROFILE_COVERAGE_SUMMARY_PROFILE_COUNT_MISMATCH');
    check(report.summary?.pass_count === summaries.filter(entry => entry.pass === true).length, 'PROFILE_COVERAGE_SUMMARY_PASS_COUNT_MISMATCH');
    check(report.summary?.fail_count === summaries.filter(entry => entry.pass !== true).length, 'PROFILE_COVERAGE_SUMMARY_FAIL_COUNT_MISMATCH');
    check(rootHash(report.summary?.mode_histogram ?? {}) === rootHash(universalArtAssetProfileCoverageModeHistogram(summaries)), 'PROFILE_COVERAGE_MODE_HISTOGRAM_MISMATCH');
    const expectedChecks = universalArtAssetProfileCoverageGlobalChecks(summaries, expectedProfiles, observedProfiles, missingProfiles, unexpectedProfiles);
    const checkNames = Object.keys(expectedChecks);
    const reportChecks = record(report.checks);
    check(checkNames.every(key => typeof reportChecks[key] === 'boolean'), 'PROFILE_COVERAGE_CHECKS_INVALID');
    for (const key of checkNames) check(reportChecks[key] === expectedChecks[key], `PROFILE_COVERAGE_CHECK_${key.toUpperCase()}_MISMATCH`);
    const expectedStatus = Object.values(reportChecks).every(Boolean) ? 'CANDIDATE_PROFILE_COVERAGE_PASS' : 'CANDIDATE_PROFILE_COVERAGE_FAIL';
    check(report.status === expectedStatus, 'PROFILE_COVERAGE_STATUS_MISMATCH');
    check(report.candidate_only === true && report.authoritative === false && report.canonical_write_authorized === false, 'PROFILE_COVERAGE_AUTHORITY_INVALID');
    check(report.authority?.canonical_owner === 'RNCS' && report.authority?.representation_owner === 'URRF', 'PROFILE_COVERAGE_OWNER_INVALID');
    check(report.authority?.provider_can_write_authoritative_world_state === false && report.authority?.provider_can_commit === false && report.authority?.acceptance_can_commit === false && report.authority?.rncs_authority_required === true, 'PROFILE_COVERAGE_PROVIDER_AUTHORITY_INVALID');
    const copy = clone(report);
    const actual = copy.coverage_root;
    delete copy.coverage_root;
    check(isHexRoot(actual) && actual === rootHash(copy), 'PROFILE_COVERAGE_ROOT_INVALID');
    if (entries !== null) {
      const expectedReport = buildUniversalArtAssetProfileCoverageReport({
        coverageId: report.coverage_id,
        entries,
        expectedProfiles,
        expectedModes
      });
      delete expectedReport.coverage_root;
      check(rootHash(copy) === rootHash(expectedReport), 'PROFILE_COVERAGE_CONTENT_MISMATCH');
    }
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, coverage_root: report.coverage_root ?? null};
}

function normalizeUniversalArtAssetProviderPreflightProfiles(value) {
  if (value === undefined || value === null) return [...UNIVERSAL_ART_ASSET_PROFILES];
  return normalizeUniversalArtAssetProfileCoverageProfiles(value);
}

function universalArtAssetProviderPreflightManifests(providers = []) {
  const supplied = Array.isArray(providers) ? providers : [];
  return new AssetProviderRegistry([...externalAssetProviderManifests(), ...supplied]).list();
}

function universalArtAssetProviderPreflightRunner(runners, providerId) {
  const source = record(runners);
  return typeof source[providerId] === 'function' ? source[providerId] : null;
}

function universalArtAssetProviderPreflightCommandConfigured(manifest) {
  if (Array.isArray(manifest?.command)) return manifest.command.length > 0 && nonEmptyText(manifest.command[0]);
  return nonEmptyText(manifest?.command);
}

function universalArtAssetProviderPreflightExpectedHealth(manifest, runner) {
  if (runner) return {status: 'AVAILABLE', runtime: 'EXECUTOR_INJECTED'};
  if (universalArtAssetProviderPreflightCommandConfigured(manifest)) return {status: 'CONFIGURED', runtime: 'EXTERNAL_PROCESS'};
  return {status: manifest?.runtimeStatus ?? null, runtime: 'CONTRACT_ONLY'};
}

function universalArtAssetProviderPreflightProfileBindings(manifest, profiles) {
  const capabilities = new Set(Array.isArray(manifest?.capabilities) ? manifest.capabilities : []);
  return profiles.filter(profile => profileContract(profile).required_capabilities.every(capability => capabilities.has(capability)));
}

function universalArtAssetProviderPreflightProviderEntry(manifest, profiles, runners, licenseEntry) {
  const runner = universalArtAssetProviderPreflightRunner(runners, manifest.id);
  const adapter = new AssetProviderAdapter(manifest, {runner});
  const health = adapter.healthCheck();
  const expectedHealth = universalArtAssetProviderPreflightExpectedHealth(manifest, runner);
  const license = record(licenseEntry);
  const profileBindings = universalArtAssetProviderPreflightProfileBindings(manifest, profiles);
  const checks = {
    provider_root: isHexRoot(manifest.manifest_root),
    health_truthfulness: health.status === expectedHealth.status && health.runtime === expectedHealth.runtime,
    license_audit_binding: license.provider_id === manifest.id
      && license.manifest_valid === true
      && license.license_status === manifest.license?.status
      && license.dependency_status === manifest.license?.dependency_status
      && license.model_weights_status === manifest.license?.model_weights_status,
    profile_binding: profileBindings.every(profile => profileContract(profile).required_capabilities.every(capability => (manifest.capabilities ?? []).includes(capability))),
    authority_boundary: manifest.metadata?.authoritative !== true
  };
  return {
    provider_id: manifest.id,
    provider_root: manifest.manifest_root ?? null,
    name: manifest.name ?? null,
    version: manifest.version ?? null,
    provider_type: manifest.providerType ?? null,
    execution_mode: manifest.executionMode ?? null,
    declared_runtime_status: manifest.runtimeStatus ?? null,
    health: {
      status: health.status ?? null,
      runtime: health.runtime ?? null
    },
    runtime_binding: health.runtime ?? null,
    runner_supplied: Boolean(runner),
    command_configured: universalArtAssetProviderPreflightCommandConfigured(manifest),
    capabilities: clone(manifest.capabilities ?? []),
    profile_bindings: profileBindings,
    license: {
      code_status: manifest.license?.code_status ?? null,
      dependency_status: manifest.license?.dependency_status ?? null,
      model_weights_status: manifest.license?.model_weights_status ?? null,
      data_status: manifest.license?.data_status ?? null,
      default_commercial_release: license.default_commercial_release ?? false,
      blocked_reasons: clone(license.blocked_reasons ?? [])
    },
    authoritative: manifest.metadata?.authoritative ?? false,
    checks,
    pass: Object.values(checks).every(Boolean)
  };
}

function universalArtAssetProviderPreflightExpectedHealthFromEntry(entry) {
  if (entry?.runner_supplied === true) return {status: 'AVAILABLE', runtime: 'EXECUTOR_INJECTED'};
  if (entry?.command_configured === true) return {status: 'CONFIGURED', runtime: 'EXTERNAL_PROCESS'};
  return {status: entry?.declared_runtime_status ?? null, runtime: 'CONTRACT_ONLY'};
}

function universalArtAssetProviderPreflightExpectedProfileBindings(entry, profiles) {
  const capabilities = new Set(Array.isArray(entry?.capabilities) ? entry.capabilities : []);
  return profiles.filter(profile => profileContract(profile).required_capabilities.every(capability => capabilities.has(capability)));
}

function universalArtAssetProviderPreflightExpectedRouteStatusFromEntry(entry, provider) {
  if (entry?.selected_provider_source === 'ragf-reference-provider'
    && entry.runtime_status === 'READY_REFERENCE'
    && nonEmptyText(entry.selected_provider_id)) return 'BUILTIN_REFERENCE_READY';
  if (entry?.selected_provider_source === 'external-provider-contract' && provider) {
    if (!['CONTRACT_ONLY', 'EXECUTOR_INJECTED', 'EXTERNAL_PROCESS'].includes(provider.runtime_binding)) return 'INCONSISTENT';
    return provider.runtime_binding === 'CONTRACT_ONLY' ? 'EXTERNAL_CONTRACT_ONLY' : 'EXTERNAL_RUNTIME_BOUND';
  }
  if (entry?.selected_provider_id === null
    && entry.selected_provider_root === null
    && entry.selected_provider_source === null
    && entry.eligible === false
    && entry.runtime_status === 'UNRESOLVED') return 'UNRESOLVED';
  return 'INCONSISTENT';
}

function universalArtAssetProviderPreflightRouteChecksFromEntry(entry, providerEntries, profiles) {
  const provider = providerEntries.find(candidate => candidate.provider_id === entry?.selected_provider_id) ?? null;
  const contract = profileContract(entry?.asset_profile);
  const expectedStatus = universalArtAssetProviderPreflightExpectedRouteStatusFromEntry(entry, provider);
  const providerBinding = expectedStatus === 'BUILTIN_REFERENCE_READY'
    ? isHexRoot(entry.selected_provider_root)
      && entry.selected_provider_id === 'provider:taowind:procedural-3d'
      && provider === null
    : expectedStatus === 'EXTERNAL_CONTRACT_ONLY' || expectedStatus === 'EXTERNAL_RUNTIME_BOUND'
      ? Boolean(provider)
        && provider.provider_id === entry.selected_provider_id
        && provider.provider_root === entry.selected_provider_root
      : expectedStatus === 'UNRESOLVED'
        ? entry.selected_provider_id === null
          && entry.selected_provider_root === null
          && entry.selected_provider_source === null
        : false;
  const runtimeTruthfulness = expectedStatus === 'BUILTIN_REFERENCE_READY'
    ? entry.selected_provider_source === 'ragf-reference-provider'
      && entry.runtime_status === 'READY_REFERENCE'
      && provider === null
    : expectedStatus === 'EXTERNAL_CONTRACT_ONLY'
      ? entry.selected_provider_source === 'external-provider-contract'
        && entry.runtime_status === 'CONTRACT_ONLY'
        && provider?.runtime_binding === 'CONTRACT_ONLY'
        && provider.runner_supplied === false
        && provider.command_configured === false
      : expectedStatus === 'EXTERNAL_RUNTIME_BOUND'
        ? entry.selected_provider_source === 'external-provider-contract'
          && provider?.runtime_binding !== 'CONTRACT_ONLY'
          && (provider?.runner_supplied === true || provider?.command_configured === true)
        : expectedStatus === 'UNRESOLVED'
          ? entry.selected_provider_id === null
            && entry.selected_provider_source === null
            && entry.eligible === false
            && entry.runtime_status === 'UNRESOLVED'
          : false;
  const noSilentFallback = expectedStatus !== 'INCONSISTENT'
    && ((expectedStatus === 'BUILTIN_REFERENCE_READY' && entry.selected_provider_source === 'ragf-reference-provider')
      || ((expectedStatus === 'EXTERNAL_CONTRACT_ONLY' || expectedStatus === 'EXTERNAL_RUNTIME_BOUND')
        && entry.selected_provider_source === 'external-provider-contract'
        && nonEmptyText(entry.selected_provider_id))
      || (expectedStatus === 'UNRESOLVED'
        && entry.selected_provider_id === null
        && entry.selected_provider_root === null
        && entry.selected_provider_source === null));
  return {
    expectedStatus,
    checks: {
      profile_binding: rootHash(entry.required_capabilities ?? []) === rootHash(contract.required_capabilities),
      resolution_root: isHexRoot(entry.resolution_root),
      provider_binding: providerBinding,
      runtime_truthfulness: runtimeTruthfulness,
      no_silent_fallback: noSilentFallback,
      authority_boundary: true
    }
  };
}

function universalArtAssetProviderPreflightRouteStatus({resolution, provider}) {
  if (resolution?.selected_provider_source === 'ragf-reference-provider'
    && resolution.runtime_status === 'READY_REFERENCE'
    && nonEmptyText(resolution.selected_provider_id)) return 'BUILTIN_REFERENCE_READY';
  if (resolution?.selected_provider_source === 'external-provider-contract' && provider) {
    return provider.runtime_binding === 'CONTRACT_ONLY' ? 'EXTERNAL_CONTRACT_ONLY' : 'EXTERNAL_RUNTIME_BOUND';
  }
  if (resolution?.selected_provider_id === null && resolution.selected_provider_source === null && resolution.eligible === false) return 'UNRESOLVED';
  return 'INCONSISTENT';
}

function universalArtAssetProviderPreflightRouteEntry({profile, providerEntries, manifests}) {
  const contract = profileContract(profile);
  const genome = createUniversalArtAssetGenome({
    description: `URRF provider preflight probe for ${profile}`,
    asset_profile: profile,
    asset_kind: contract.asset_kind,
    quality_tier: 'AAA',
    seed: `urrf-provider-preflight-${profile}-seed`,
    target_platforms: ['desktop', 'web']
  });
  const resolution = resolveUniversalArtAssetProvider({genome, providers: manifests});
  const provider = providerEntries.find(entry => entry.provider_id === resolution.selected_provider_id) ?? null;
  const routeStatus = universalArtAssetProviderPreflightRouteStatus({resolution, provider});
  const selectedProviderId = resolution.selected_provider_id ?? null;
  const selectedProviderSource = resolution.selected_provider_source ?? null;
  const resolutionRoot = resolution.resolution_root ?? null;
  const providerBinding = routeStatus === 'BUILTIN_REFERENCE_READY'
    ? isHexRoot(resolution.selected_provider_root)
      && selectedProviderId === 'provider:taowind:procedural-3d'
    : routeStatus === 'EXTERNAL_CONTRACT_ONLY' || routeStatus === 'EXTERNAL_RUNTIME_BOUND'
      ? Boolean(provider)
        && provider.provider_root === resolution.selected_provider_root
        && provider.provider_id === selectedProviderId
      : routeStatus === 'UNRESOLVED'
        ? selectedProviderId === null && selectedProviderSource === null
        : false;
  const runtimeTruthfulness = routeStatus === 'BUILTIN_REFERENCE_READY'
    ? selectedProviderSource === 'ragf-reference-provider' && resolution.runtime_status === 'READY_REFERENCE' && provider === null
    : routeStatus === 'EXTERNAL_CONTRACT_ONLY'
      ? selectedProviderSource === 'external-provider-contract'
        && resolution.runtime_status === 'CONTRACT_ONLY'
        && provider?.runtime_binding === 'CONTRACT_ONLY'
        && provider.runner_supplied === false
        && provider.command_configured === false
      : routeStatus === 'EXTERNAL_RUNTIME_BOUND'
        ? selectedProviderSource === 'external-provider-contract'
          && provider?.runtime_binding !== 'CONTRACT_ONLY'
          && (provider?.runner_supplied === true || provider?.command_configured === true)
        : routeStatus === 'UNRESOLVED'
          ? selectedProviderId === null
            && selectedProviderSource === null
            && resolution.eligible === false
            && resolution.runtime_status === 'UNRESOLVED'
          : false;
  const noSilentFallback = routeStatus !== 'INCONSISTENT'
    && ((routeStatus === 'BUILTIN_REFERENCE_READY' && selectedProviderSource === 'ragf-reference-provider')
      || ((routeStatus === 'EXTERNAL_CONTRACT_ONLY' || routeStatus === 'EXTERNAL_RUNTIME_BOUND') && selectedProviderSource === 'external-provider-contract')
      || (routeStatus === 'UNRESOLVED' && selectedProviderId === null && selectedProviderSource === null));
  const checks = {
    profile_binding: resolution.asset_profile === profile
      && rootHash(resolution.required_capabilities ?? []) === rootHash(contract.required_capabilities),
    resolution_root: resolution.format === UNIVERSAL_ART_ASSET_PROVIDER_RESOLUTION_FORMAT
      && resolution.version === UNIVERSAL_ART_ASSET_FORGE_VERSION
      && isHexRoot(resolutionRoot)
      && (() => {
        const copy = clone(resolution);
        delete copy.resolution_root;
        return rootHash(copy) === resolutionRoot;
      })(),
    provider_binding: providerBinding,
    runtime_truthfulness: runtimeTruthfulness,
    no_silent_fallback: noSilentFallback,
    authority_boundary: resolution.authority?.provider_can_write_authoritative_world_state === false
      && resolution.authority?.candidate_only === true
      && resolution.authority?.authoritative === false
      && resolution.authority?.rncs_authority_required === true
  };
  return {
    index: 0,
    asset_profile: profile,
    asset_id: genome.asset_id,
    genome_root: genome.genome_root,
    required_capabilities: clone(contract.required_capabilities),
    resolution_root: resolutionRoot,
    selected_provider_id: selectedProviderId,
    selected_provider_root: resolution.selected_provider_root ?? null,
    selected_provider_source: selectedProviderSource,
    eligible: resolution.eligible,
    runtime_status: resolution.runtime_status,
    provider_health: provider
      ? {status: provider.health.status, runtime: provider.health.runtime, runtime_binding: provider.runtime_binding}
      : null,
    route_status: routeStatus,
    checks,
    pass: Object.values(checks).every(Boolean)
  };
}

function universalArtAssetProviderPreflightRouteEntries(profiles, providerEntries, manifests) {
  return profiles.map((profile, index) => ({
    ...universalArtAssetProviderPreflightRouteEntry({profile, providerEntries, manifests}),
    index
  }));
}

function universalArtAssetProviderPreflightHistogram(entries, field, values) {
  return Object.fromEntries(values.map(value => [value, entries.filter(entry => entry?.[field] === value).length]));
}

function buildUniversalArtAssetProviderPreflightReport({preflightId = null, profiles = null, providers = [], providerRunners = {}} = {}) {
  const expectedProfiles = normalizeUniversalArtAssetProviderPreflightProfiles(profiles);
  const manifests = universalArtAssetProviderPreflightManifests(providers);
  const licenseAudit = auditExternalProviderLicenses(manifests);
  const licenseEntries = new Map((licenseAudit.entries ?? []).map(entry => [entry.provider_id, entry]));
  const providerEntries = manifests.map(manifest => universalArtAssetProviderPreflightProviderEntry(manifest, expectedProfiles, providerRunners, licenseEntries.get(manifest.id)));
  const routeEntries = universalArtAssetProviderPreflightRouteEntries(expectedProfiles, providerEntries, manifests);
  const checks = {
    profile_coverage: routeEntries.length === expectedProfiles.length
      && new Set(routeEntries.map(entry => entry.asset_profile)).size === expectedProfiles.length,
    unique_profile_routes: new Set(routeEntries.map(entry => entry.asset_profile)).size === routeEntries.length,
    profile_resolution_roots: routeEntries.length > 0
      && routeEntries.every(entry => isHexRoot(entry.resolution_root))
      && new Set(routeEntries.map(entry => entry.resolution_root)).size === routeEntries.length,
    provider_manifest_roots: providerEntries.every(entry => isHexRoot(entry.provider_root))
      && new Set(providerEntries.map(entry => entry.provider_root)).size === providerEntries.length,
    provider_health_truthfulness: providerEntries.every(entry => entry.pass),
    license_audit_root: isHexRoot(licenseAudit.audit_root),
    no_silent_external_execution: routeEntries.every(entry => entry.checks.no_silent_fallback),
    authority_boundary: routeEntries.every(entry => entry.checks.authority_boundary)
      && providerEntries.every(entry => entry.authoritative === false)
  };
  const resolvedPreflightId = preflightId === null || preflightId === undefined
    ? stableId('urrf-universal-art-asset-provider-preflight', {
      profiles: expectedProfiles,
      provider_roots: providerEntries.map(entry => entry.provider_root),
      resolution_roots: routeEntries.map(entry => entry.resolution_root),
      health: providerEntries.map(entry => ({provider_id: entry.provider_id, status: entry.health.status, runtime: entry.health.runtime}))
    })
    : String(preflightId).trim();
  if (!nonEmptyText(resolvedPreflightId)) throw new GenesisError('UNIVERSAL_ART_ASSET_PROVIDER_PREFLIGHT_ID_INVALID');
  return {
    format: UNIVERSAL_ART_ASSET_PROVIDER_PREFLIGHT_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    preflight_id: resolvedPreflightId,
    source: 'urrf-provider-preflight-evaluator',
    expected_profiles: expectedProfiles,
    providers: providerEntries,
    profile_routes: routeEntries,
    license_audit_root: licenseAudit.audit_root,
    summary: {
      profile_count: routeEntries.length,
      provider_count: providerEntries.length,
      route_histogram: universalArtAssetProviderPreflightHistogram(routeEntries, 'route_status', UNIVERSAL_ART_ASSET_PROVIDER_PREFLIGHT_ROUTE_STATUSES),
      provider_health_histogram: universalArtAssetProviderPreflightHistogram(providerEntries, 'runtime_binding', ['CONTRACT_ONLY', 'EXECUTOR_INJECTED', 'EXTERNAL_PROCESS']),
      release_blocked_provider_count: providerEntries.filter(entry => entry.license.default_commercial_release !== true).length
    },
    checks,
    status: Object.values(checks).every(Boolean) ? 'CANDIDATE_PROVIDER_PREFLIGHT_PASS' : 'CANDIDATE_PROVIDER_PREFLIGHT_FAIL',
    execution_performed: false,
    aaa_ready: false,
    release_ready: false,
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
    preflight_root: ''
  };
}

/**
 * Inspect Provider manifests, runtime binding and license blockers together
 * with every URRF profile route. Preflight never invokes a Provider and never
 * turns readiness into an AAA or RNCS authority decision.
 */
export function createUniversalArtAssetProviderPreflightReport({preflight_id = null, preflightId = null, profiles = null, providers = [], provider_runners = null, providerRunners = null} = {}) {
  const base = buildUniversalArtAssetProviderPreflightReport({
    preflightId: preflight_id ?? preflightId,
    profiles,
    providers,
    providerRunners: provider_runners ?? providerRunners ?? {}
  });
  return seal(base, 'preflight_root');
}

/**
 * Verify a persisted Provider preflight. Optional runtime inputs allow the
 * caller to recompute the report when custom manifests or runners were used.
 */
export function verifyUniversalArtAssetProviderPreflightReport(report, {profiles = null, providers = null, provider_runners = null, providerRunners = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!report || typeof report !== 'object' || Array.isArray(report)) return {valid: false, errors: ['PROVIDER_PREFLIGHT_REPORT_NOT_OBJECT'], preflight_root: null};
  try {
    check(report.format === UNIVERSAL_ART_ASSET_PROVIDER_PREFLIGHT_FORMAT, 'PROVIDER_PREFLIGHT_FORMAT_INVALID');
    check(report.version === UNIVERSAL_ART_ASSET_FORGE_VERSION, 'PROVIDER_PREFLIGHT_VERSION_INVALID');
    check(nonEmptyText(report.preflight_id), 'PROVIDER_PREFLIGHT_ID_MISSING');
    check(report.source === 'urrf-provider-preflight-evaluator', 'PROVIDER_PREFLIGHT_SOURCE_INVALID');
    const expectedProfiles = normalizeUniversalArtAssetProviderPreflightProfiles(report.expected_profiles);
    const providerEntries = Array.isArray(report.providers) ? report.providers : [];
    const routeEntries = Array.isArray(report.profile_routes) ? report.profile_routes : [];
    check(routeEntries.length === expectedProfiles.length, 'PROVIDER_PREFLIGHT_PROFILE_ROUTE_COUNT_INVALID');
    check(routeEntries.every((entry, index) => entry?.index === index), 'PROVIDER_PREFLIGHT_ROUTE_INDEX_INVALID');
    check(routeEntries.every(entry => expectedProfiles.includes(entry?.asset_profile)), 'PROVIDER_PREFLIGHT_ROUTE_PROFILE_INVALID');
    check(new Set(routeEntries.map(entry => entry?.asset_profile)).size === routeEntries.length, 'PROVIDER_PREFLIGHT_ROUTE_PROFILE_DUPLICATE');
    check(providerEntries.every(entry => nonEmptyText(entry?.provider_id) && isHexRoot(entry?.provider_root)), 'PROVIDER_PREFLIGHT_PROVIDER_INVALID');
    check(new Set(providerEntries.map(entry => entry?.provider_id)).size === providerEntries.length, 'PROVIDER_PREFLIGHT_PROVIDER_DUPLICATE');
    check(new Set(providerEntries.map(entry => entry?.provider_root)).size === providerEntries.length, 'PROVIDER_PREFLIGHT_PROVIDER_ROOT_DUPLICATE');
    for (const entry of providerEntries) {
      const checks = record(entry.checks);
      check(typeof entry.pass === 'boolean', `PROVIDER_PREFLIGHT_PROVIDER_PASS_INVALID:${entry?.provider_id ?? 'unknown'}`);
      check(Object.values(checks).every(value => typeof value === 'boolean'), `PROVIDER_PREFLIGHT_PROVIDER_CHECKS_INVALID:${entry?.provider_id ?? 'unknown'}`);
      check(entry.authoritative === false, `PROVIDER_PREFLIGHT_PROVIDER_AUTHORITY_INVALID:${entry?.provider_id ?? 'unknown'}`);
      const expectedHealth = universalArtAssetProviderPreflightExpectedHealthFromEntry(entry);
      const expectedBindings = universalArtAssetProviderPreflightExpectedProfileBindings(entry, expectedProfiles);
      const expectedProviderChecks = {
        provider_root: isHexRoot(entry.provider_root),
        health_truthfulness: entry.health?.status === expectedHealth.status
          && entry.health?.runtime === expectedHealth.runtime
          && entry.runtime_binding === expectedHealth.runtime,
        license_audit_binding: checks.license_audit_binding === true,
        profile_binding: rootHash(entry.profile_bindings ?? []) === rootHash(expectedBindings),
        authority_boundary: entry.authoritative === false
      };
      for (const [key, value] of Object.entries(expectedProviderChecks)) {
        check(checks[key] === value, `PROVIDER_PREFLIGHT_PROVIDER_CHECK_${key.toUpperCase()}_MISMATCH:${entry?.provider_id ?? 'unknown'}`);
      }
      check(entry.pass === Object.values(checks).every(Boolean), `PROVIDER_PREFLIGHT_PROVIDER_PASS_MISMATCH:${entry?.provider_id ?? 'unknown'}`);
    }
    for (const entry of routeEntries) {
      check(nonEmptyText(entry?.asset_profile), `PROVIDER_PREFLIGHT_ROUTE_PROFILE_MISSING:${entry?.index ?? 'unknown'}`);
      check(nonEmptyText(entry?.asset_id), `PROVIDER_PREFLIGHT_ROUTE_ASSET_ID_INVALID:${entry?.index ?? 'unknown'}`);
      check(isHexRoot(entry?.genome_root) && isHexRoot(entry?.resolution_root), `PROVIDER_PREFLIGHT_ROUTE_ROOT_INVALID:${entry?.index ?? 'unknown'}`);
      check(entry?.selected_provider_id === null || nonEmptyText(entry?.selected_provider_id), `PROVIDER_PREFLIGHT_ROUTE_PROVIDER_ID_INVALID:${entry?.index ?? 'unknown'}`);
      check(entry?.selected_provider_root === null || isHexRoot(entry?.selected_provider_root), `PROVIDER_PREFLIGHT_ROUTE_PROVIDER_ROOT_INVALID:${entry?.index ?? 'unknown'}`);
      check(entry?.selected_provider_source === null || ['ragf-reference-provider', 'external-provider-contract', 'injected-provider'].includes(entry.selected_provider_source), `PROVIDER_PREFLIGHT_ROUTE_SOURCE_INVALID:${entry?.index ?? 'unknown'}`);
      check(UNIVERSAL_ART_ASSET_PROVIDER_PREFLIGHT_ROUTE_STATUSES.includes(entry?.route_status), `PROVIDER_PREFLIGHT_ROUTE_STATUS_INVALID:${entry?.index ?? 'unknown'}`);
      const provider = providerEntries.find(candidate => candidate.provider_id === entry.selected_provider_id) ?? null;
      const expected = universalArtAssetProviderPreflightRouteChecksFromEntry(entry, providerEntries, expectedProfiles);
      check(entry.route_status === expected.expectedStatus, `PROVIDER_PREFLIGHT_ROUTE_STATUS_MISMATCH:${entry?.index ?? 'unknown'}`);
      for (const [key, value] of Object.entries(expected.checks)) {
        check(entry?.checks?.[key] === value, `PROVIDER_PREFLIGHT_ROUTE_CHECK_${key.toUpperCase()}_MISMATCH:${entry?.index ?? 'unknown'}`);
      }
      const expectedProviderHealth = provider
        ? {status: provider.health?.status ?? null, runtime: provider.health?.runtime ?? null, runtime_binding: provider.runtime_binding ?? null}
        : null;
      check(rootHash(entry.provider_health ?? null) === rootHash(expectedProviderHealth), `PROVIDER_PREFLIGHT_ROUTE_HEALTH_MISMATCH:${entry?.index ?? 'unknown'}`);
      check(entry?.pass === Object.values(record(entry.checks)).every(Boolean), `PROVIDER_PREFLIGHT_ROUTE_PASS_INVALID:${entry?.index ?? 'unknown'}`);
    }
    const expectedChecks = {
      profile_coverage: routeEntries.length === expectedProfiles.length
        && new Set(routeEntries.map(entry => entry.asset_profile)).size === expectedProfiles.length,
      unique_profile_routes: new Set(routeEntries.map(entry => entry.asset_profile)).size === routeEntries.length,
      profile_resolution_roots: routeEntries.length > 0
        && routeEntries.every(entry => isHexRoot(entry.resolution_root))
        && new Set(routeEntries.map(entry => entry.resolution_root)).size === routeEntries.length,
      provider_manifest_roots: providerEntries.every(entry => isHexRoot(entry.provider_root))
        && new Set(providerEntries.map(entry => entry.provider_root)).size === providerEntries.length,
      provider_health_truthfulness: providerEntries.every(entry => entry.pass),
      license_audit_root: isHexRoot(report.license_audit_root),
      no_silent_external_execution: routeEntries.every(entry => entry.checks?.no_silent_fallback === true),
      authority_boundary: routeEntries.every(entry => entry.checks?.authority_boundary === true)
        && providerEntries.every(entry => entry.authoritative === false)
    };
    const reportChecks = record(report.checks);
    check(Object.keys(expectedChecks).every(key => typeof reportChecks[key] === 'boolean'), 'PROVIDER_PREFLIGHT_CHECKS_INVALID');
    for (const [key, value] of Object.entries(expectedChecks)) check(reportChecks[key] === value, `PROVIDER_PREFLIGHT_CHECK_${key.toUpperCase()}_MISMATCH`);
    const expectedStatus = Object.values(expectedChecks).every(Boolean) ? 'CANDIDATE_PROVIDER_PREFLIGHT_PASS' : 'CANDIDATE_PROVIDER_PREFLIGHT_FAIL';
    check(report.status === expectedStatus, 'PROVIDER_PREFLIGHT_STATUS_MISMATCH');
    check(rootHash(universalArtAssetProviderPreflightHistogram(routeEntries, 'route_status', UNIVERSAL_ART_ASSET_PROVIDER_PREFLIGHT_ROUTE_STATUSES)) === rootHash(report.summary?.route_histogram ?? {}), 'PROVIDER_PREFLIGHT_ROUTE_HISTOGRAM_MISMATCH');
    check(rootHash(universalArtAssetProviderPreflightHistogram(providerEntries, 'runtime_binding', ['CONTRACT_ONLY', 'EXECUTOR_INJECTED', 'EXTERNAL_PROCESS'])) === rootHash(report.summary?.provider_health_histogram ?? {}), 'PROVIDER_PREFLIGHT_HEALTH_HISTOGRAM_MISMATCH');
    check(report.summary?.profile_count === routeEntries.length, 'PROVIDER_PREFLIGHT_SUMMARY_PROFILE_COUNT_MISMATCH');
    check(report.summary?.provider_count === providerEntries.length, 'PROVIDER_PREFLIGHT_SUMMARY_PROVIDER_COUNT_MISMATCH');
    check(report.summary?.release_blocked_provider_count === providerEntries.filter(entry => entry.license?.default_commercial_release !== true).length, 'PROVIDER_PREFLIGHT_SUMMARY_RELEASE_BLOCKED_COUNT_MISMATCH');
    check(report.execution_performed === false && report.aaa_ready === false && report.release_ready === false, 'PROVIDER_PREFLIGHT_READINESS_ESCALATION');
    check(report.candidate_only === true && report.authoritative === false && report.canonical_write_authorized === false, 'PROVIDER_PREFLIGHT_AUTHORITY_INVALID');
    check(report.authority?.canonical_owner === 'RNCS' && report.authority?.representation_owner === 'URRF', 'PROVIDER_PREFLIGHT_OWNER_INVALID');
    check(report.authority?.provider_can_write_authoritative_world_state === false && report.authority?.provider_can_commit === false && report.authority?.acceptance_can_commit === false && report.authority?.rncs_authority_required === true, 'PROVIDER_PREFLIGHT_PROVIDER_AUTHORITY_INVALID');
    const copy = clone(report);
    const actual = copy.preflight_root;
    delete copy.preflight_root;
    check(isHexRoot(actual) && actual === rootHash(copy), 'PROVIDER_PREFLIGHT_ROOT_INVALID');
    const replayRequested = providers !== null || profiles !== null || provider_runners !== null || providerRunners !== null;
    const expectedReport = buildUniversalArtAssetProviderPreflightReport({
      preflightId: report.preflight_id,
      profiles: profiles ?? expectedProfiles,
      providers: providers ?? [],
      providerRunners: provider_runners ?? providerRunners ?? {}
    });
    delete expectedReport.preflight_root;
    if (replayRequested) {
      check(rootHash(copy) === rootHash(expectedReport), 'PROVIDER_PREFLIGHT_CONTENT_MISMATCH');
    } else {
      const defaultProviderIdentityRoot = rootHash(expectedReport.providers.map(entry => ({provider_id: entry.provider_id, provider_root: entry.provider_root})));
      const reportProviderIdentityRoot = rootHash(providerEntries.map(entry => ({provider_id: entry.provider_id, provider_root: entry.provider_root})));
      check(reportProviderIdentityRoot === defaultProviderIdentityRoot, 'PROVIDER_PREFLIGHT_REPLAY_INPUTS_REQUIRED');
      if (reportProviderIdentityRoot === defaultProviderIdentityRoot) {
        check(rootHash(copy) === rootHash(expectedReport), 'PROVIDER_PREFLIGHT_CONTENT_MISMATCH');
      }
    }
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, preflight_root: report.preflight_root ?? null};
}

function universalArtAssetAssemblyBatchInput(batch, assetResults = null) {
  const value = record(batch);
  const envelope = value.format === UNIVERSAL_ART_ASSET_BATCH_FORMAT ? value : record(value.batch);
  const embeddedResults = Array.isArray(assetResults)
    ? assetResults
    : value.format === UNIVERSAL_ART_ASSET_BATCH_FORMAT
      ? null
      : value.assets;
  return {envelope, assetResults: embeddedResults};
}

function universalArtAssetAssemblyLodRole(lod) {
  return lod === 0 ? 'mesh-glb' : `mesh-lod${lod}-glb`;
}

function universalArtAssetAssemblyPlacementVector(raw, assetKey) {
  const value = Array.isArray(raw)
    ? raw
    : record(raw).translation_mm ?? record(raw).translationMm ?? record(raw).position_mm ?? record(raw).positionMm;
  const vector = Array.isArray(value) ? value.map(Number) : [];
  if (vector.length !== 3 || vector.some(component => !Number.isSafeInteger(component) || Math.abs(component) > 1000000)) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_PLACEMENT_INVALID', assetKey);
  }
  return vector;
}

function universalArtAssetAssemblyDefaultPlacement(index, count) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / columns);
  return [
    (index % columns) * 6000 - Math.floor((columns - 1) * 6000 / 2),
    0,
    Math.floor(index / columns) * 6000 - Math.floor((rows - 1) * 6000 / 2)
  ];
}

function universalArtAssetAssemblyPlacementMap(assets, placementsInput) {
  const keys = new Set(assets.map(asset => asset.asset_key));
  const placements = new Map();
  const add = (assetKey, raw) => {
    const key = String(assetKey ?? '').trim();
    if (!keys.has(key)) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_UNKNOWN_PLACEMENT', key);
    if (placements.has(key)) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_DUPLICATE_PLACEMENT', key);
    placements.set(key, universalArtAssetAssemblyPlacementVector(raw, key));
  };
  if (Array.isArray(placementsInput)) {
    for (const raw of placementsInput) {
      const placement = record(raw);
      add(placement.asset_key ?? placement.assetKey, placement);
    }
  } else {
    for (const [assetKey, raw] of Object.entries(record(placementsInput))) add(assetKey, raw);
  }
  return new Map(assets.map((asset, index) => [
    asset.asset_key,
    placements.get(asset.asset_key) ?? universalArtAssetAssemblyDefaultPlacement(index, assets.length)
  ]));
}

function universalArtAssetAssemblyLodMap(assets, defaultLod, lodByAsset) {
  const fallback = Number(defaultLod ?? 0);
  const lookup = record(lodByAsset);
  const resolve = (asset, index) => {
    const raw = lookup[asset.asset_key] ?? lookup[String(index)] ?? fallback;
    const value = Number(record(raw).lod ?? raw);
    if (!Number.isSafeInteger(value) || value < 0 || value > 32) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_LOD_INVALID', asset.asset_key);
    return value;
  };
  return new Map(assets.map((asset, index) => [asset.asset_key, resolve(asset, index)]));
}

function universalArtAssetAssemblyRelativePath(value, code, assetKey) {
  const relative = String(value ?? '').replaceAll('\\', '/');
  const segments = relative.split('/');
  if (!nonEmptyText(relative) || relative.startsWith('/') || path.isAbsolute(relative) || segments.includes('..')) {
    throw new GenesisError(code, assetKey);
  }
  return relative;
}

function universalArtAssetAssemblyFileRoot(filePath, declaredRoot, byteLength, assetKey, codePrefix) {
  if (!isHexRoot(declaredRoot) || !Number.isSafeInteger(Number(byteLength)) || Number(byteLength) < 0) {
    throw new GenesisError(`${codePrefix}_DECLARATION_INVALID`, assetKey);
  }
  if (!fs.existsSync(filePath)) throw new GenesisError(`${codePrefix}_FILE_MISSING`, assetKey);
  const bytes = fs.readFileSync(filePath);
  if (bytes.byteLength !== Number(byteLength)) throw new GenesisError(`${codePrefix}_BYTE_LENGTH_MISMATCH`, assetKey);
  const actualSha256 = createHash('sha256').update(bytes).digest('hex');
  const actualRoot = rootHash(bytes.toString('base64'));
  if (actualRoot !== declaredRoot) throw new GenesisError(`${codePrefix}_ROOT_MISMATCH`, assetKey);
  return {root: actualRoot, sha256: actualSha256, byte_length: bytes.byteLength};
}

function universalArtAssetAssemblySourceFromResult(entry, selectedLod) {
  const assetKey = String(entry?.asset_key ?? '').trim();
  const result = record(entry?.result);
  const inspection = result.fileInspection ?? result.execution?.file_inspection;
  const candidate = record(result.candidate);
  const outputDirectory = path.resolve(String(entry?.output_directory ?? ''));
  if (!nonEmptyText(entry?.output_directory)) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_OUTPUT_DIRECTORY_MISSING', assetKey);
  const role = universalArtAssetAssemblyLodRole(selectedLod);
  const files = Array.isArray(inspection?.files) ? inspection.files : [];
  const file = files.find(item => Number(item?.lod) === selectedLod && item?.role === role)
    ?? files.find(item => Number(item?.lod) === selectedLod && String(item?.path ?? '').toLowerCase().endsWith('.glb'));
  if (!file || file.valid !== true || file.glb_valid !== true) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_LOD_FILE_INVALID', assetKey);
  const relativeMeshPath = universalArtAssetAssemblyRelativePath(file.path, 'UNIVERSAL_ART_ASSET_ASSEMBLY_MESH_PATH_INVALID', assetKey);
  const absoluteMeshPath = path.resolve(outputDirectory, relativeMeshPath);
  const outputPrefix = `${outputDirectory}${path.sep}`;
  if (!absoluteMeshPath.startsWith(outputPrefix)) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_MESH_PATH_INVALID', assetKey);
  const meshFileEvidence = universalArtAssetAssemblyFileRoot(absoluteMeshPath, file.file_root, file.byte_length, assetKey, 'UNIVERSAL_ART_ASSET_ASSEMBLY_MESH');
  const artifact = record(candidate.artifacts?.[role]);
  if (!isHexRoot(artifact.root)) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_CANDIDATE_ARTIFACT_ROOT_INVALID', assetKey);
  const artifactFile = (Array.isArray(artifact.files) ? artifact.files : [])
    .find(item => item?.role === role || String(item?.name ?? '').toLowerCase().endsWith(`lod${selectedLod}.glb`));
  if (!isHexRoot(artifactFile?.root)) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_CANDIDATE_FILE_ROOT_INVALID', assetKey);
  const pbrPack = record(inspection?.pbr_pack);
  if (!isHexRoot(pbrPack.pack_root ?? pbrPack.external_pack_root ?? pbrPack.root)) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_PBR_PACK_ROOT_INVALID', assetKey);
  const channels = (Array.isArray(pbrPack.files) ? pbrPack.files : [])
    .filter(channel => channel?.status === 'PASS')
    .map(channel => {
      const relativePath = universalArtAssetAssemblyRelativePath(channel.path, 'UNIVERSAL_ART_ASSET_ASSEMBLY_PBR_PATH_INVALID', assetKey);
      const absolutePath = path.resolve(outputDirectory, relativePath);
      if (!absolutePath.startsWith(outputPrefix)) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_PBR_PATH_INVALID', assetKey);
      const channelFileEvidence = universalArtAssetAssemblyFileRoot(absolutePath, channel.file_root, channel.byte_length, assetKey, 'UNIVERSAL_ART_ASSET_ASSEMBLY_PBR');
      return {
        role: String(channel.role),
        relative_path: relativePath,
        file_root: channelFileEvidence.root,
        sha256: channelFileEvidence.sha256,
        byte_length: channelFileEvidence.byte_length,
        mime: channel.mime ?? 'image/png'
      };
    })
    .sort((left, right) => left.role.localeCompare(right.role, 'en'));
  if (channels.length < 4) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_PBR_CHANNELS_INCOMPLETE', assetKey);
  return {
    output_directory: outputDirectory,
    mesh: {
      role,
      relative_path: relativeMeshPath,
      format: file.mime ?? 'model/gltf-binary',
      file_root: meshFileEvidence.root,
      sha256: meshFileEvidence.sha256,
      byte_length: meshFileEvidence.byte_length,
      candidate_artifact_root: artifact.root,
      candidate_file_root: artifactFile.root
    },
    pbr: {
      pack_root: pbrPack.pack_root ?? pbrPack.external_pack_root ?? pbrPack.root,
      texture_count: Number(pbrPack.texture_count ?? channels.length),
      channels
    }
  };
}

function universalArtAssetAssemblyAsset(entry, summary, placementMm, selectedLod) {
  const source = universalArtAssetAssemblySourceFromResult(entry, selectedLod);
  return seal({
    asset_key: summary.asset_key,
    index: summary.index,
    asset_id: summary.asset_id,
    asset_profile: summary.asset_profile,
    quality_tier: summary.quality_tier,
    status: summary.status,
    acceptance_pass: summary.acceptance_pass === true,
    genome_root: summary.genome_root,
    candidate_root: summary.candidate_root,
    acceptance_root: summary.acceptance_root,
    forge_root: summary.forge_root,
    selected_lod: selectedLod,
    placement_mm: [...placementMm],
    cell_id: `cell:${summary.asset_key}`,
    priority: Math.max(1, 1000 - Number(summary.index ?? 0)),
    failures: [...(summary.failures ?? [])],
    source,
    asset_root: ''
  }, 'asset_root');
}

function universalArtAssetAssemblyArtifactRootIndex(assets) {
  const index = {};
  for (const asset of assets ?? []) {
    const selectedLod = Number(asset.selected_lod);
    const roots = [
      [asset.source?.mesh?.candidate_artifact_root, `mesh-lod${selectedLod}-artifact`],
      [asset.source?.mesh?.file_root, `mesh-lod${selectedLod}-file`],
      [asset.source?.pbr?.pack_root, 'pbr-texture-pack']
    ];
    for (const [root, role] of roots) {
      if (!isHexRoot(root)) continue;
      index[root] ??= [];
      index[root].push({asset_key: asset.asset_key, role});
    }
  }
  return Object.fromEntries(Object.entries(index)
    .sort(([left], [right]) => left.localeCompare(right, 'en'))
    .map(([root, references]) => [
      root,
      references.sort((left, right) => `${left.asset_key}:${left.role}`.localeCompare(`${right.asset_key}:${right.role}`, 'en'))
    ]));
}

/**
 * Bind materialized Universal Art Forge candidates into one candidate-only
 * assembly. This is the missing seam between the multi-asset Forge and VSR:
 * it selects already inspected GLB/PBR files, records exact roots and integer
 * millimeter placements, and never merges bytes or writes RNCS world truth.
 */
export function createUniversalArtAssetAssembly({
  batch,
  assetResults = null,
  assets = null,
  placements_mm = null,
  placementsMm = null,
  default_lod = null,
  defaultLod = 0,
  lod_by_asset = null,
  lodByAsset = null,
  scene_id = null,
  sceneId = null,
  world_id = null,
  worldId = null,
  source_reality_root = null,
  sourceRealityRoot = null,
  load_radius = null,
  loadRadius = 64,
  unload_radius = null,
  unloadRadius = 80
} = {}) {
  const suppliedResults = assetResults ?? assets;
  const input = universalArtAssetAssemblyBatchInput(batch, suppliedResults);
  if (input.envelope.format !== UNIVERSAL_ART_ASSET_BATCH_FORMAT) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_BATCH_INVALID');
  if (!Array.isArray(input.assetResults) || input.assetResults.length === 0 || input.assetResults.some(entry => !record(entry).result)) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_RESULTS_REQUIRED');
  }
  const batchVerification = verifyUniversalArtAssetBatch(input.envelope, {assetResults: input.assetResults});
  if (!batchVerification.valid) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_BATCH_INVALID', batchVerification.errors.join(','));
  const summaries = input.envelope.assets.map(asset => clone(asset));
  const resultEntries = new Map(input.assetResults.map(entry => [entry.asset_key, entry]));
  const placementInput = placements_mm ?? placementsMm;
  const placementMap = universalArtAssetAssemblyPlacementMap(summaries, placementInput);
  const lodMap = universalArtAssetAssemblyLodMap(summaries, default_lod ?? defaultLod, lod_by_asset ?? lodByAsset);
  const assemblyAssets = summaries.map(summary => {
    const entry = resultEntries.get(summary.asset_key);
    if (!entry) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_RESULT_MISSING', summary.asset_key);
    return universalArtAssetAssemblyAsset(entry, summary, placementMap.get(summary.asset_key), lodMap.get(summary.asset_key));
  });
  const maxLod = Math.max(...assemblyAssets.map(asset => asset.selected_lod));
  const placementRoot = rootHash({
    batch_root: input.envelope.batch_root,
    placements: assemblyAssets.map(asset => ({asset_key: asset.asset_key, placement_mm: asset.placement_mm}))
  });
  const selectedLodHistogram = {};
  for (const asset of assemblyAssets) selectedLodHistogram[String(asset.selected_lod)] = (selectedLodHistogram[String(asset.selected_lod)] ?? 0) + 1;
  const loadRadiusValue = Number(load_radius ?? loadRadius);
  const unloadRadiusValue = Number(unload_radius ?? unloadRadius);
  if (!Number.isFinite(loadRadiusValue) || loadRadiusValue < 0 || !Number.isFinite(unloadRadiusValue) || unloadRadiusValue < loadRadiusValue) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_STREAMING_RADIUS_INVALID');
  }
  const sourceRoot = source_reality_root ?? sourceRealityRoot ?? input.envelope.batch_root;
  if (!isHexRoot(sourceRoot)) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_SOURCE_ROOT_INVALID');
  const resolvedSceneId = String(scene_id ?? sceneId ?? `urrf-universal-art-assembly:${placementRoot.slice(0, 16)}`).trim();
  const resolvedWorldId = String(world_id ?? worldId ?? 'world:urrf-universal-art-assembly').trim();
  if (!nonEmptyText(resolvedSceneId) || !nonEmptyText(resolvedWorldId)) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_ID_INVALID');
  return seal({
    format: UNIVERSAL_ART_ASSET_ASSEMBLY_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    assembly_id: stableId('urrf-universal-art-asset-assembly', {
      batch_root: input.envelope.batch_root,
      scene_id: resolvedSceneId,
      placement_root: placementRoot,
      assets: assemblyAssets.map(asset => ({asset_key: asset.asset_key, asset_root: asset.asset_root, selected_lod: asset.selected_lod}))
    }),
    batch_root: input.envelope.batch_root,
    source_reality_root: sourceRoot,
    scene_id: resolvedSceneId,
    world_id: resolvedWorldId,
    placement_root: placementRoot,
    asset_count: assemblyAssets.length,
    status: input.envelope.status,
    lod_policy: {
      selection_mode: 'preselected-local-inspection',
      default_lod: Number(default_lod ?? defaultLod),
      max_lod: maxLod
    },
    streaming: {
      load_radius: loadRadiusValue,
      unload_radius: unloadRadiusValue
    },
    assets: assemblyAssets,
    artifact_root_index: universalArtAssetAssemblyArtifactRootIndex(assemblyAssets),
    summary: {
      asset_count: assemblyAssets.length,
      blocked_count: assemblyAssets.filter(asset => asset.status === 'BLOCKED').length,
      ready_count: assemblyAssets.filter(asset => asset.status === 'READY_FOR_HUMAN_REVIEW').length,
      acceptance_pass_count: assemblyAssets.filter(asset => asset.acceptance_pass).length,
      selected_lod_histogram: selectedLodHistogram
    },
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
    assembly_root: ''
  }, 'assembly_root');
}

/**
 * Verify assembly roots and, when supplied, re-bind the assembly to the
 * original batch results and current bytes on disk.
 */
export function verifyUniversalArtAssetAssembly(assembly, {batch = null, assetResults = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!assembly || typeof assembly !== 'object' || Array.isArray(assembly)) return {valid: false, errors: ['ASSEMBLY_NOT_OBJECT'], assembly_root: null};
  try {
    check(assembly.format === UNIVERSAL_ART_ASSET_ASSEMBLY_FORMAT, 'ASSEMBLY_FORMAT_INVALID');
    check(assembly.version === UNIVERSAL_ART_ASSET_FORGE_VERSION, 'ASSEMBLY_VERSION_INVALID');
    check(nonEmptyText(assembly.assembly_id), 'ASSEMBLY_ID_MISSING');
    check(isHexRoot(assembly.batch_root), 'ASSEMBLY_BATCH_ROOT_INVALID');
    check(isHexRoot(assembly.source_reality_root), 'ASSEMBLY_SOURCE_ROOT_INVALID');
    check(nonEmptyText(assembly.scene_id) && nonEmptyText(assembly.world_id), 'ASSEMBLY_SCENE_ID_INVALID');
    check(isHexRoot(assembly.placement_root), 'ASSEMBLY_PLACEMENT_ROOT_INVALID');
    check(Array.isArray(assembly.assets) && assembly.assets.length > 0 && assembly.assets.length <= 64, 'ASSEMBLY_ASSETS_INVALID');
    const assemblyAssets = Array.isArray(assembly.assets) ? assembly.assets : [];
    check(assembly.asset_count === assemblyAssets.length, 'ASSEMBLY_ASSET_COUNT_MISMATCH');
    const keys = assemblyAssets.map(asset => asset?.asset_key);
    const indexes = assemblyAssets.map(asset => asset?.index);
    check(keys.every(nonEmptyText) && new Set(keys).size === keys.length, 'ASSEMBLY_ASSET_KEYS_INVALID');
    check(indexes.every(index => Number.isSafeInteger(index) && index >= 0 && index < assemblyAssets.length) && new Set(indexes).size === assemblyAssets.length && [...indexes].sort((left, right) => left - right).every((index, position) => index === position), 'ASSEMBLY_ASSET_INDEX_SET_INVALID');
    const batchInput = batch === null ? null : universalArtAssetAssemblyBatchInput(batch, assetResults);
    if (batchInput) {
      const batchVerification = verifyUniversalArtAssetBatch(batchInput.envelope, {assetResults: batchInput.assetResults});
      if (!batchVerification.valid) errors.push(...batchVerification.errors.map(error => `ASSEMBLY_BATCH_${error}`));
      check(assembly.batch_root === batchInput.envelope.batch_root, 'ASSEMBLY_BATCH_ROOT_MISMATCH');
      check(assemblyAssets.length === (batchInput.envelope.assets ?? []).length, 'ASSEMBLY_BATCH_ASSET_COUNT_MISMATCH');
    }
    if (assetResults !== null && !batchInput) errors.push('ASSEMBLY_BATCH_CONTEXT_REQUIRED');
    const summaryByKey = new Map((batchInput?.envelope.assets ?? []).map(asset => [asset.asset_key, asset]));
    let acceptancePassCount = 0;
    let blockedCount = 0;
    let readyCount = 0;
    let maxLod = 0;
    for (const asset of assemblyAssets) {
      const key = asset?.asset_key ?? 'unknown';
      const summary = summaryByKey.get(key);
      if (batchInput && !summary) {
        errors.push(`ASSEMBLY_BATCH_ASSET_MISSING:${key}`);
        continue;
      }
      if (summary) {
        for (const field of ['index', 'asset_id', 'asset_profile', 'quality_tier', 'status', 'genome_root', 'candidate_root', 'acceptance_root', 'forge_root']) {
          check(asset[field] === summary[field], `ASSEMBLY_${field.toUpperCase()}_MISMATCH:${key}`);
        }
        check(asset.acceptance_pass === (summary.acceptance_pass === true), `ASSEMBLY_ACCEPTANCE_STATUS_MISMATCH:${key}`);
      }
      check(isHexRoot(asset.asset_root), `ASSEMBLY_ASSET_ROOT_INVALID:${key}`);
      const assetCopy = clone(asset);
      const assetRoot = assetCopy.asset_root;
      delete assetCopy.asset_root;
      check(assetRoot === rootHash(assetCopy), `ASSEMBLY_ASSET_ROOT_MISMATCH:${key}`);
      check(Number.isSafeInteger(asset.selected_lod) && asset.selected_lod >= 0 && asset.selected_lod <= 32, `ASSEMBLY_LOD_INVALID:${key}`);
      maxLod = Math.max(maxLod, Number(asset.selected_lod ?? 0));
      check(Array.isArray(asset.placement_mm) && asset.placement_mm.length === 3 && asset.placement_mm.every(component => Number.isSafeInteger(component) && Math.abs(component) <= 1000000), `ASSEMBLY_PLACEMENT_INVALID:${key}`);
      check(nonEmptyText(asset.cell_id) && asset.cell_id === `cell:${key}`, `ASSEMBLY_CELL_INVALID:${key}`);
      check(Number.isSafeInteger(asset.priority) && asset.priority > 0, `ASSEMBLY_PRIORITY_INVALID:${key}`);
      const source = record(asset.source);
      const mesh = record(source.mesh);
      const pbr = record(source.pbr);
      check(nonEmptyText(source.output_directory), `ASSEMBLY_OUTPUT_DIRECTORY_MISSING:${key}`);
      check(mesh.role === universalArtAssetAssemblyLodRole(asset.selected_lod), `ASSEMBLY_MESH_ROLE_INVALID:${key}`);
      check(mesh.format === 'model/gltf-binary', `ASSEMBLY_MESH_FORMAT_INVALID:${key}`);
      check(nonEmptyText(mesh.relative_path) && !mesh.relative_path.startsWith('/') && !path.isAbsolute(mesh.relative_path) && !String(mesh.relative_path).split('/').includes('..'), `ASSEMBLY_MESH_PATH_INVALID:${key}`);
      check(isHexRoot(mesh.file_root) && isHexRoot(mesh.sha256) && Number.isSafeInteger(mesh.byte_length) && mesh.byte_length > 0, `ASSEMBLY_MESH_BINDING_INVALID:${key}`);
      check(isHexRoot(mesh.candidate_artifact_root) && isHexRoot(mesh.candidate_file_root), `ASSEMBLY_CANDIDATE_MESH_ROOT_INVALID:${key}`);
      check(isHexRoot(pbr.pack_root) && Number.isSafeInteger(pbr.texture_count) && pbr.texture_count >= 4, `ASSEMBLY_PBR_PACK_INVALID:${key}`);
      check(Array.isArray(pbr.channels) && pbr.channels.length >= 4, `ASSEMBLY_PBR_CHANNELS_INVALID:${key}`);
      for (const channel of pbr.channels ?? []) {
        check(nonEmptyText(channel?.role) && nonEmptyText(channel?.relative_path) && isHexRoot(channel?.file_root) && isHexRoot(channel?.sha256) && Number.isSafeInteger(channel?.byte_length) && channel.byte_length > 0, `ASSEMBLY_PBR_CHANNEL_INVALID:${key}`);
      }
      if (assetResults !== null && summary) {
        const entry = batchInput.assetResults.find(candidate => candidate?.asset_key === key);
        if (!entry) {
          errors.push(`ASSEMBLY_RESULT_MISSING:${key}`);
        } else {
          try {
            const expected = universalArtAssetAssemblyAsset(entry, summary, asset.placement_mm, asset.selected_lod);
            check(expected.asset_root === asset.asset_root, `ASSEMBLY_RESULT_BINDING_MISMATCH:${key}`);
          } catch (error) {
            errors.push(`ASSEMBLY_RESULT_BINDING_EXCEPTION:${key}:${error.message}`);
          }
        }
      }
      if (asset.status === 'BLOCKED') blockedCount++;
      if (asset.status === 'READY_FOR_HUMAN_REVIEW') readyCount++;
      if (asset.acceptance_pass) acceptancePassCount++;
    }
    const placementRoot = rootHash({
      batch_root: assembly.batch_root,
      placements: assemblyAssets.map(asset => ({asset_key: asset.asset_key, placement_mm: asset.placement_mm}))
    });
    check(assembly.placement_root === placementRoot, 'ASSEMBLY_PLACEMENT_ROOT_MISMATCH');
    check(assembly.lod_policy?.selection_mode === 'preselected-local-inspection', 'ASSEMBLY_LOD_POLICY_INVALID');
    check(assembly.lod_policy?.max_lod === maxLod, 'ASSEMBLY_MAX_LOD_MISMATCH');
    check(assembly.streaming && Number.isFinite(assembly.streaming.load_radius) && assembly.streaming.load_radius >= 0 && Number.isFinite(assembly.streaming.unload_radius) && assembly.streaming.unload_radius >= assembly.streaming.load_radius, 'ASSEMBLY_STREAMING_INVALID');
    check(rootHash(record(assembly.artifact_root_index)) === rootHash(universalArtAssetAssemblyArtifactRootIndex(assemblyAssets)), 'ASSEMBLY_ARTIFACT_ROOT_INDEX_MISMATCH');
    check(assembly.summary?.asset_count === assemblyAssets.length, 'ASSEMBLY_SUMMARY_ASSET_COUNT_MISMATCH');
    check(assembly.summary?.blocked_count === blockedCount, 'ASSEMBLY_BLOCKED_COUNT_MISMATCH');
    check(assembly.summary?.ready_count === readyCount, 'ASSEMBLY_READY_COUNT_MISMATCH');
    check(assembly.summary?.acceptance_pass_count === acceptancePassCount, 'ASSEMBLY_ACCEPTANCE_COUNT_MISMATCH');
    check(assembly.status === (acceptancePassCount === assemblyAssets.length ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED'), 'ASSEMBLY_STATUS_MISMATCH');
    check(assembly.candidate_only === true && assembly.authoritative === false && assembly.canonical_write_authorized === false, 'ASSEMBLY_AUTHORITY_INVALID');
    check(assembly.authority?.canonical_owner === 'RNCS' && assembly.authority?.representation_owner === 'URRF', 'ASSEMBLY_OWNER_INVALID');
    check(assembly.authority?.provider_can_write_authoritative_world_state === false && assembly.authority?.provider_can_commit === false && assembly.authority?.acceptance_can_commit === false && assembly.authority?.rncs_authority_required === true, 'ASSEMBLY_PROVIDER_AUTHORITY_INVALID');
    const copy = clone(assembly);
    const actual = copy.assembly_root;
    delete copy.assembly_root;
    check(isHexRoot(actual) && actual === rootHash(copy), 'ASSEMBLY_ROOT_INVALID');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, assembly_root: assembly.assembly_root ?? null};
}

/**
 * Lower the verified assembly into a VSR asset-stream reference envelope.
 * The URI is a candidate-provider seam; the local path and byte root remain
 * explicit so a later VSR importer can perform the actual file/GPU work.
 */
const UNIVERSAL_ART_ASSET_VSR_PBR_ROLES = Object.freeze(['base-color', 'normal', 'occlusion-roughness-metallic', 'emissive']);

function universalArtAssetVsrPbrDependencyId(assetId, role) {
  return `${assetId}:pbr:${encodeURIComponent(String(role))}`;
}

function universalArtAssetVsrPbrDependency(meshAsset, sourceAsset, channel) {
  const role = String(channel?.role ?? '');
  return {
    id: universalArtAssetVsrPbrDependencyId(meshAsset.id, role),
    uri: `urrf+candidate://${encodeURIComponent(sourceAsset.asset_id)}/pbr/${encodeURIComponent(role)}`,
    format: channel.mime ?? 'image/png',
    sha256: channel.sha256,
    byteLength: channel.byte_length,
    kind: 'texture',
    cellIds: [sourceAsset.cell_id],
    priority: sourceAsset.priority,
    metadata: {
      assembly_root: meshAsset.metadata.assembly_root,
      batch_root: meshAsset.metadata.batch_root,
      asset_key: sourceAsset.asset_key,
      asset_id: sourceAsset.asset_id,
      candidate_root: sourceAsset.candidate_root,
      pbr_pack_root: sourceAsset.source.pbr.pack_root,
      pbr_role: role,
      file_root: channel.file_root,
      relative_path: channel.relative_path,
      output_directory: sourceAsset.source.output_directory,
      candidate_only: true,
      authoritative: false
    }
  };
}

export function lowerUniversalArtAssetAssemblyToVsr(input = {}, options = {}) {
  const value = record(input);
  const assembly = value.format === UNIVERSAL_ART_ASSET_ASSEMBLY_FORMAT
    ? clone(value)
    : createUniversalArtAssetAssembly({...value, ...record(options)});
  const verification = verifyUniversalArtAssetAssembly(assembly);
  if (!verification.valid) throw new GenesisError('UNIVERSAL_ART_ASSET_ASSEMBLY_INVALID', verification.errors.join(','));
  const assets = assembly.assets.map(asset => {
    const id = `asset:urrf:${asset.asset_key}:lod${asset.selected_lod}`;
    return {
      id,
      uri: `urrf+candidate://${encodeURIComponent(asset.asset_id)}/lod${asset.selected_lod}`,
      format: 'model/gltf-binary',
      sha256: asset.source.mesh.sha256,
      byteLength: asset.source.mesh.byte_length,
      kind: 'mesh',
      dependencies: (asset.source.pbr?.channels ?? []).map(channel => universalArtAssetVsrPbrDependencyId(id, channel.role)),
      cellIds: [asset.cell_id],
      priority: asset.priority,
      transform: {
        translation: asset.placement_mm.map(component => component / 1000),
        translation_mm: [...asset.placement_mm]
      },
      metadata: {
        assembly_root: assembly.assembly_root,
        batch_root: assembly.batch_root,
        asset_key: asset.asset_key,
        asset_id: asset.asset_id,
        candidate_root: asset.candidate_root,
        candidate_artifact_root: asset.source.mesh.candidate_artifact_root,
        candidate_file_root: asset.source.mesh.candidate_file_root,
        file_root: asset.source.mesh.file_root,
        relative_path: asset.source.mesh.relative_path,
        output_directory: asset.source.output_directory,
         selected_lod: asset.selected_lod,
         quality_tier: asset.quality_tier,
         pbr_pack_root: asset.source.pbr.pack_root,
         pbr_channel_count: asset.source.pbr.channels.length,
         candidate_only: true,
         authoritative: false
       }
     };
  });
  const dependencies = assembly.assets.flatMap((sourceAsset, index) => (sourceAsset.source.pbr?.channels ?? [])
    .map(channel => universalArtAssetVsrPbrDependency(assets[index], sourceAsset, channel)));
  const cells = assembly.assets.map((asset, index) => ({
    id: asset.cell_id,
    center: [asset.placement_mm[0] / 1000, asset.placement_mm[1] / 1000, asset.placement_mm[2] / 1000],
    radius: 3.5,
    assetIds: [assets[index].id],
    loadRadius: assembly.streaming.load_radius,
    unloadRadius: assembly.streaming.unload_radius,
    priority: asset.priority
  }));
  const base = {
    format: UNIVERSAL_ART_ASSET_VSR_PROJECTION_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    projection_id: stableId('urrf-universal-art-asset-vsr-projection', {
      assembly_root: assembly.assembly_root,
      assets: assets.map(asset => asset.id),
      dependencies: dependencies.map(asset => ({id: asset.id, sha256: asset.sha256, file_root: asset.metadata.file_root}))
    }),
    assembly_root: assembly.assembly_root,
    batch_root: assembly.batch_root,
    source_reality_root: assembly.source_reality_root,
    placement_root: assembly.placement_root,
    scene_id: assembly.scene_id,
    world_id: assembly.world_id,
    status: assembly.status,
    runtime_consumer: 'VSR_GLTF_IMPORT',
    asset_count: assets.length,
    assets,
    dependency_count: dependencies.length,
    dependencies,
    streaming: {
      world_id: assembly.world_id,
      cells,
      persistentAssetIds: []
    },
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
    }
  };
  return {...base, projection_root: rootHash(base)};
}

export function verifyUniversalArtAssetVsrProjection(projection, {assembly = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!projection || typeof projection !== 'object' || Array.isArray(projection)) return {valid: false, errors: ['VSR_PROJECTION_NOT_OBJECT'], projection_root: null};
  try {
    check(projection.format === UNIVERSAL_ART_ASSET_VSR_PROJECTION_FORMAT, 'VSR_PROJECTION_FORMAT_INVALID');
    check(projection.version === UNIVERSAL_ART_ASSET_FORGE_VERSION, 'VSR_PROJECTION_VERSION_INVALID');
    check(nonEmptyText(projection.projection_id), 'VSR_PROJECTION_ID_MISSING');
    for (const field of ['assembly_root', 'batch_root', 'source_reality_root', 'placement_root']) check(isHexRoot(projection[field]), `VSR_PROJECTION_${field.toUpperCase()}_INVALID`);
    check(nonEmptyText(projection.scene_id) && nonEmptyText(projection.world_id), 'VSR_PROJECTION_SCENE_INVALID');
    check(projection.runtime_consumer === 'VSR_GLTF_IMPORT', 'VSR_PROJECTION_RUNTIME_CONSUMER_INVALID');
    check(Array.isArray(projection.assets) && projection.assets.length > 0 && projection.assets.length <= 64, 'VSR_PROJECTION_ASSETS_INVALID');
    const assets = Array.isArray(projection.assets) ? projection.assets : [];
    check(projection.asset_count === assets.length, 'VSR_PROJECTION_ASSET_COUNT_MISMATCH');
    check(Array.isArray(projection.dependencies) && projection.dependencies.length >= assets.length * 4 && projection.dependencies.length <= 256, 'VSR_PROJECTION_DEPENDENCIES_INVALID');
    const dependencies = Array.isArray(projection.dependencies) ? projection.dependencies : [];
    check(projection.dependency_count === dependencies.length, 'VSR_PROJECTION_DEPENDENCY_COUNT_MISMATCH');
    const ids = assets.map(asset => asset?.id);
    check(ids.every(nonEmptyText) && new Set(ids).size === ids.length, 'VSR_PROJECTION_ASSET_IDS_INVALID');
    const dependencyIds = dependencies.map(asset => asset?.id);
    check(dependencyIds.every(nonEmptyText) && new Set(dependencyIds).size === dependencyIds.length, 'VSR_PROJECTION_DEPENDENCY_IDS_INVALID');
    const cells = Array.isArray(projection.streaming?.cells) ? projection.streaming.cells : [];
    const cellsById = new Map(cells.map(cell => [cell?.id, cell]));
    const dependenciesById = new Map(dependencies.map(asset => [asset?.id, asset]));
    check(projection.streaming?.world_id === projection.world_id, 'VSR_PROJECTION_STREAMING_WORLD_MISMATCH');
    check(cells.every(cell => nonEmptyText(cell?.id) && Array.isArray(cell?.assetIds) && cell.assetIds.length === 1 && Number.isFinite(cell?.radius) && cell.radius > 0 && Number.isFinite(cell?.loadRadius) && cell.loadRadius >= 0 && Number.isFinite(cell?.unloadRadius) && cell.unloadRadius >= cell.loadRadius), 'VSR_PROJECTION_STREAMING_CELL_INVALID');
    check(new Set(cells.map(cell => cell?.id)).size === cells.length, 'VSR_PROJECTION_STREAMING_CELL_IDS_INVALID');
    check(Array.isArray(projection.streaming?.persistentAssetIds), 'VSR_PROJECTION_PERSISTENT_ASSETS_INVALID');
    const assemblyAssetsByKey = assembly && Array.isArray(assembly.assets)
      ? new Map(assembly.assets.map(asset => [asset.asset_key, asset]))
      : null;
    for (const asset of assets) {
      const metadata = record(asset.metadata);
      const cellIds = Array.isArray(asset.cellIds) ? asset.cellIds : [];
      check(asset.format === 'model/gltf-binary' && asset.kind === 'mesh', `VSR_PROJECTION_ASSET_RECORD_INVALID:${asset?.id ?? 'unknown'}`);
      check(isHexRoot(asset.sha256) && Number.isSafeInteger(asset.byteLength) && asset.byteLength > 0, `VSR_PROJECTION_ASSET_PAYLOAD_INVALID:${asset?.id ?? 'unknown'}`);
      const assetDependencies = Array.isArray(asset.dependencies) ? asset.dependencies : [];
      check(assetDependencies.length >= 4 && assetDependencies.every(dependencyId => dependenciesById.has(dependencyId)), `VSR_PROJECTION_ASSET_DEPENDENCIES_INVALID:${asset?.id ?? 'unknown'}`);
      check(cellIds.length === 1 && cellsById.has(cellIds[0]), `VSR_PROJECTION_ASSET_CELL_INVALID:${asset?.id ?? 'unknown'}`);
      check(metadata.assembly_root === projection.assembly_root && metadata.batch_root === projection.batch_root, `VSR_PROJECTION_ASSET_ROOT_BINDING_INVALID:${asset?.id ?? 'unknown'}`);
      check(isHexRoot(metadata.candidate_root) && isHexRoot(metadata.candidate_artifact_root) && isHexRoot(metadata.candidate_file_root) && isHexRoot(metadata.file_root), `VSR_PROJECTION_ASSET_CANDIDATE_ROOT_INVALID:${asset?.id ?? 'unknown'}`);
      check(Number.isSafeInteger(metadata.selected_lod) && metadata.selected_lod >= 0, `VSR_PROJECTION_ASSET_LOD_INVALID:${asset?.id ?? 'unknown'}`);
      check(isHexRoot(metadata.pbr_pack_root) && Number.isSafeInteger(metadata.pbr_channel_count) && metadata.pbr_channel_count === assetDependencies.length, `VSR_PROJECTION_ASSET_PBR_METADATA_INVALID:${asset?.id ?? 'unknown'}`);
      check(Array.isArray(asset.transform?.translation) && asset.transform.translation.length === 3 && asset.transform.translation.every(Number.isFinite), `VSR_PROJECTION_ASSET_TRANSFORM_INVALID:${asset?.id ?? 'unknown'}`);
      check(Array.isArray(asset.transform?.translation_mm) && asset.transform.translation_mm.length === 3 && asset.transform.translation_mm.every(component => Number.isSafeInteger(component)), `VSR_PROJECTION_ASSET_MM_TRANSFORM_INVALID:${asset?.id ?? 'unknown'}`);
      const cell = cellsById.get(cellIds[0]);
      check(Array.isArray(cell?.assetIds) && cell.assetIds.includes(asset.id), `VSR_PROJECTION_CELL_ASSET_MISMATCH:${asset?.id ?? 'unknown'}`);
      if (assemblyAssetsByKey) {
        const sourceAsset = assemblyAssetsByKey.get(metadata.asset_key);
        check(Boolean(sourceAsset), `VSR_PROJECTION_ASSEMBLY_ASSET_MISSING:${asset?.id ?? 'unknown'}`);
        if (sourceAsset) {
          check(asset.id === `asset:urrf:${sourceAsset.asset_key}:lod${sourceAsset.selected_lod}`, `VSR_PROJECTION_ASSET_ID_BINDING_INVALID:${asset?.id ?? 'unknown'}`);
          check(asset.uri === `urrf+candidate://${encodeURIComponent(sourceAsset.asset_id)}/lod${sourceAsset.selected_lod}`, `VSR_PROJECTION_ASSET_URI_BINDING_INVALID:${asset?.id ?? 'unknown'}`);
          check(asset.sha256 === sourceAsset.source?.mesh?.sha256 && asset.byteLength === sourceAsset.source?.mesh?.byte_length, `VSR_PROJECTION_ASSET_PAYLOAD_BINDING_INVALID:${asset?.id ?? 'unknown'}`);
           check(asset.priority === sourceAsset.priority && cellIds[0] === sourceAsset.cell_id, `VSR_PROJECTION_ASSET_STREAM_BINDING_INVALID:${asset?.id ?? 'unknown'}`);
           check(metadata.asset_id === sourceAsset.asset_id && metadata.candidate_root === sourceAsset.candidate_root && metadata.candidate_artifact_root === sourceAsset.source?.mesh?.candidate_artifact_root && metadata.candidate_file_root === sourceAsset.source?.mesh?.candidate_file_root && metadata.file_root === sourceAsset.source?.mesh?.file_root && metadata.relative_path === sourceAsset.source?.mesh?.relative_path && metadata.output_directory === sourceAsset.source?.output_directory && metadata.selected_lod === sourceAsset.selected_lod && metadata.quality_tier === sourceAsset.quality_tier && metadata.pbr_pack_root === sourceAsset.source?.pbr?.pack_root && metadata.pbr_channel_count === sourceAsset.source?.pbr?.channels?.length, `VSR_PROJECTION_ASSET_METADATA_BINDING_INVALID:${asset?.id ?? 'unknown'}`);
           const expectedDependencyIds = (sourceAsset.source?.pbr?.channels ?? []).map(channel => universalArtAssetVsrPbrDependencyId(asset.id, channel.role));
           check(JSON.stringify(assetDependencies) === JSON.stringify(expectedDependencyIds), `VSR_PROJECTION_ASSET_PBR_DEPENDENCY_BINDING_INVALID:${asset?.id ?? 'unknown'}`);
           check(JSON.stringify(asset.transform?.translation_mm) === JSON.stringify(sourceAsset.placement_mm), `VSR_PROJECTION_ASSET_PLACEMENT_BINDING_INVALID:${asset?.id ?? 'unknown'}`);
          check(JSON.stringify(asset.transform?.translation) === JSON.stringify(sourceAsset.placement_mm.map(component => component / 1000)), `VSR_PROJECTION_ASSET_METER_BINDING_INVALID:${asset?.id ?? 'unknown'}`);
          check(JSON.stringify(cell?.center) === JSON.stringify(sourceAsset.placement_mm.map(component => component / 1000)), `VSR_PROJECTION_CELL_CENTER_BINDING_INVALID:${asset?.id ?? 'unknown'}`);
        }
      }
    }
    for (const dependency of dependencies) {
      const id = dependency?.id ?? 'unknown';
      const metadata = record(dependency?.metadata);
      const cellIds = Array.isArray(dependency?.cellIds) ? dependency.cellIds : [];
      check(dependency?.kind === 'texture' && nonEmptyText(dependency?.format) && String(dependency.format).startsWith('image/'), `VSR_PROJECTION_DEPENDENCY_RECORD_INVALID:${id}`);
      check(isHexRoot(dependency?.sha256) && Number.isSafeInteger(dependency?.byteLength) && dependency.byteLength > 0, `VSR_PROJECTION_DEPENDENCY_PAYLOAD_INVALID:${id}`);
      check(cellIds.length === 1 && cellsById.has(cellIds[0]), `VSR_PROJECTION_DEPENDENCY_CELL_INVALID:${id}`);
      check(isHexRoot(metadata.assembly_root) && metadata.assembly_root === projection.assembly_root && isHexRoot(metadata.batch_root) && metadata.batch_root === projection.batch_root, `VSR_PROJECTION_DEPENDENCY_ROOT_BINDING_INVALID:${id}`);
      check(isHexRoot(metadata.candidate_root) && isHexRoot(metadata.pbr_pack_root) && isHexRoot(metadata.file_root) && nonEmptyText(metadata.pbr_role) && UNIVERSAL_ART_ASSET_VSR_PBR_ROLES.includes(metadata.pbr_role), `VSR_PROJECTION_DEPENDENCY_METADATA_INVALID:${id}`);
      check(nonEmptyText(metadata.relative_path) && nonEmptyText(metadata.output_directory), `VSR_PROJECTION_DEPENDENCY_PATH_INVALID:${id}`);
      const cell = cellsById.get(cellIds[0]);
      check(Array.isArray(cell?.assetIds) && cell.assetIds.some(assetId => assetId === id || assets.some(asset => asset.id === assetId && asset.dependencies?.includes(id))), `VSR_PROJECTION_DEPENDENCY_CELL_ASSET_MISMATCH:${id}`);
      if (assemblyAssetsByKey) {
        const sourceAsset = assemblyAssetsByKey.get(metadata.asset_key);
        const sourceChannel = sourceAsset?.source?.pbr?.channels?.find(channel => channel.role === metadata.pbr_role);
        check(Boolean(sourceAsset && sourceChannel), `VSR_PROJECTION_ASSEMBLY_DEPENDENCY_MISSING:${id}`);
        if (sourceAsset && sourceChannel) {
          const meshAsset = assets.find(asset => asset.metadata?.asset_key === sourceAsset.asset_key);
          check(Boolean(meshAsset) && id === universalArtAssetVsrPbrDependencyId(meshAsset.id, sourceChannel.role), `VSR_PROJECTION_DEPENDENCY_ID_BINDING_INVALID:${id}`);
          check(dependency.uri === `urrf+candidate://${encodeURIComponent(sourceAsset.asset_id)}/pbr/${encodeURIComponent(sourceChannel.role)}` && dependency.sha256 === sourceChannel.sha256 && dependency.byteLength === sourceChannel.byte_length && metadata.pbr_pack_root === sourceAsset.source.pbr.pack_root && metadata.file_root === sourceChannel.file_root && metadata.relative_path === sourceChannel.relative_path && metadata.output_directory === sourceAsset.source.output_directory && cellIds[0] === sourceAsset.cell_id && dependency.priority === sourceAsset.priority, `VSR_PROJECTION_DEPENDENCY_SOURCE_BINDING_INVALID:${id}`);
        }
      }
    }
    check(cells.length === assets.length, 'VSR_PROJECTION_CELL_COUNT_MISMATCH');
    check(projection.candidate_only === true && projection.authoritative === false && projection.canonical_write_authorized === false, 'VSR_PROJECTION_AUTHORITY_INVALID');
    check(projection.authority?.canonical_owner === 'RNCS' && projection.authority?.representation_owner === 'URRF', 'VSR_PROJECTION_OWNER_INVALID');
    check(projection.authority?.provider_can_write_authoritative_world_state === false && projection.authority?.provider_can_commit === false && projection.authority?.acceptance_can_commit === false && projection.authority?.rncs_authority_required === true, 'VSR_PROJECTION_PROVIDER_AUTHORITY_INVALID');
    if (assembly !== null) {
      const assemblyVerification = verifyUniversalArtAssetAssembly(assembly);
      if (!assemblyVerification.valid) errors.push(...assemblyVerification.errors.map(error => `VSR_PROJECTION_ASSEMBLY_${error}`));
      check(projection.assembly_root === assembly.assembly_root, 'VSR_PROJECTION_ASSEMBLY_ROOT_MISMATCH');
      check(projection.batch_root === assembly.batch_root, 'VSR_PROJECTION_BATCH_ROOT_MISMATCH');
      check(projection.source_reality_root === assembly.source_reality_root, 'VSR_PROJECTION_SOURCE_ROOT_MISMATCH');
      check(projection.placement_root === assembly.placement_root, 'VSR_PROJECTION_PLACEMENT_ROOT_MISMATCH');
      check(projection.scene_id === assembly.scene_id && projection.world_id === assembly.world_id && projection.status === assembly.status, 'VSR_PROJECTION_SCENE_BINDING_MISMATCH');
    }
    const copy = clone(projection);
    const actual = copy.projection_root;
    delete copy.projection_root;
    check(isHexRoot(actual) && actual === rootHash(copy), 'VSR_PROJECTION_ROOT_INVALID');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, projection_root: projection.projection_root ?? null};
}

function universalArtAssetVsrPayloadBytes(value, assetId) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0));
  if (ArrayBuffer.isView(value)) return Uint8Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_PAYLOAD_INVALID', assetId);
}

function universalArtAssetVsrPayloadMap(payloads) {
  if (payloads instanceof Map) return payloads;
  if (payloads && typeof payloads.get === 'function') return payloads;
  if (payloads && typeof payloads === 'object' && !Array.isArray(payloads)) return new Map(Object.entries(payloads));
  throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_PAYLOADS_INVALID');
}

function universalArtAssetVsrMaterializationPath(metadata, assetId) {
  const outputDirectory = path.resolve(String(metadata?.output_directory ?? ''));
  if (!nonEmptyText(metadata?.output_directory)) throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_OUTPUT_DIRECTORY_MISSING', assetId);
  const relativePath = universalArtAssetAssemblyRelativePath(metadata.relative_path, 'UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_PATH_INVALID', assetId);
  const absolutePath = path.resolve(outputDirectory, relativePath);
  const outputPrefix = `${outputDirectory}${path.sep}`;
  if (!absolutePath.startsWith(outputPrefix)) throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_PATH_INVALID', assetId);
  return {outputDirectory, relativePath, absolutePath};
}

function materializeUniversalArtAssetVsrPayload(source, readFile, payloads) {
  const id = source.id;
  const location = universalArtAssetVsrMaterializationPath(source.metadata, id);
  let raw;
  try {
    raw = readFile(location.absolutePath);
  } catch (error) {
    throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_FILE_READ_FAILED', `${id}:${error.message}`);
  }
  const bytes = universalArtAssetVsrPayloadBytes(raw, id);
  const actualSha256 = createHash('sha256').update(bytes).digest('hex');
  const actualFileRoot = rootHash(Buffer.from(bytes).toString('base64'));
  if (bytes.byteLength !== source.byteLength) throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_BYTE_LENGTH_MISMATCH', id);
  if (actualSha256 !== source.sha256) throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_SHA256_MISMATCH', id);
  if (actualFileRoot !== source.metadata.file_root) throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_FILE_ROOT_MISMATCH', id);
  payloads.set(id, bytes);
  const materialized = {
    id,
    uri: source.uri,
    format: source.format,
    kind: source.kind,
    sha256: actualSha256,
    byte_length: bytes.byteLength,
    file_root: actualFileRoot,
    relative_path: location.relativePath,
    output_directory: location.outputDirectory,
    cell_ids: [...source.cellIds],
    priority: source.priority,
    status: 'MATERIALIZED'
  };
  if (source.kind === 'mesh') {
    materialized.selected_lod = source.metadata.selected_lod;
    materialized.dependencies = [...(source.dependencies ?? [])];
  } else {
    materialized.role = source.metadata.pbr_role;
    materialized.pbr_pack_root = source.metadata.pbr_pack_root;
  }
  return materialized;
}

/**
 * Read the verified projection's selected GLBs and external PBR channels into
 * bounded local payloads. This is the file/materialization seam consumed by a
 * VSR streamer; it does not import, upload, render, merge meshes, or mutate
 * RNCS canonical state.
 */
export function materializeUniversalArtAssetVsrProjection(projection, {
  assembly = null,
  max_total_bytes = null,
  maxTotalBytes = 268435456,
  readFile = filePath => fs.readFileSync(filePath)
} = {}) {
  const projectionVerification = verifyUniversalArtAssetVsrProjection(projection, {assembly});
  if (!projectionVerification.valid) throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_PROJECTION_INVALID', projectionVerification.errors.join(','));
  if (typeof readFile !== 'function') throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_READER_INVALID');
  const totalBudget = Number(max_total_bytes ?? maxTotalBytes);
  if (!Number.isSafeInteger(totalBudget) || totalBudget <= 0) throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_BUDGET_INVALID');
  const sourceAssets = [...projection.assets, ...projection.dependencies];
  const declaredTotal = sourceAssets.reduce((sum, asset) => sum + Number(asset.byteLength ?? 0), 0);
  if (!Number.isSafeInteger(declaredTotal) || declaredTotal <= 0 || declaredTotal > totalBudget) throw new GenesisError('UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_BUDGET_EXCEEDED');
  const payloads = new Map();
  const assets = projection.assets.map(asset => materializeUniversalArtAssetVsrPayload(asset, readFile, payloads));
  const dependencies = projection.dependencies.map(asset => materializeUniversalArtAssetVsrPayload(asset, readFile, payloads));
  const materializedPayloads = [...assets, ...dependencies];
  const base = {
    format: UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_FORMAT,
    version: UNIVERSAL_ART_ASSET_FORGE_VERSION,
    materialization_id: stableId('urrf-universal-art-asset-vsr-materialization', {
      projection_root: projection.projection_root,
      payloads: materializedPayloads.map(asset => ({id: asset.id, sha256: asset.sha256, file_root: asset.file_root}))
    }),
    projection_root: projection.projection_root,
    assembly_root: projection.assembly_root,
    batch_root: projection.batch_root,
    source_reality_root: projection.source_reality_root,
    placement_root: projection.placement_root,
    streaming_root: rootHash(projection.streaming),
    scene_id: projection.scene_id,
    world_id: projection.world_id,
    source_status: projection.status,
    status: 'READY_FOR_VSR_IMPORT',
    runtime_consumer: projection.runtime_consumer,
    asset_count: assets.length,
    assets,
    dependency_count: dependencies.length,
    dependencies,
    total_byte_length: materializedPayloads.reduce((sum, asset) => sum + asset.byte_length, 0),
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
    }
  };
  const materialization = seal({...base, materialization_root: ''}, 'materialization_root');
  return {materialization, catalog: [...projection.dependencies, ...projection.assets].map(asset => clone(asset)), payloads};
}

export function verifyUniversalArtAssetVsrMaterialization(materialization, {projection = null, assembly = null, payloads = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!materialization || typeof materialization !== 'object' || Array.isArray(materialization)) return {valid: false, errors: ['VSR_MATERIALIZATION_NOT_OBJECT'], materialization_root: null};
  try {
    check(materialization.format === UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_FORMAT, 'VSR_MATERIALIZATION_FORMAT_INVALID');
    check(materialization.version === UNIVERSAL_ART_ASSET_FORGE_VERSION, 'VSR_MATERIALIZATION_VERSION_INVALID');
    check(nonEmptyText(materialization.materialization_id), 'VSR_MATERIALIZATION_ID_MISSING');
    for (const field of ['projection_root', 'assembly_root', 'batch_root', 'source_reality_root', 'placement_root', 'streaming_root']) check(isHexRoot(materialization[field]), `VSR_MATERIALIZATION_${field.toUpperCase()}_INVALID`);
    check(nonEmptyText(materialization.scene_id) && nonEmptyText(materialization.world_id), 'VSR_MATERIALIZATION_SCENE_INVALID');
    check(materialization.source_status === 'BLOCKED' || materialization.source_status === 'READY_FOR_HUMAN_REVIEW', 'VSR_MATERIALIZATION_SOURCE_STATUS_INVALID');
    check(materialization.status === 'READY_FOR_VSR_IMPORT', 'VSR_MATERIALIZATION_STATUS_INVALID');
    check(materialization.runtime_consumer === 'VSR_GLTF_IMPORT', 'VSR_MATERIALIZATION_RUNTIME_CONSUMER_INVALID');
    check(Array.isArray(materialization.assets) && materialization.assets.length > 0 && materialization.assets.length <= 64, 'VSR_MATERIALIZATION_ASSETS_INVALID');
    const assets = Array.isArray(materialization.assets) ? materialization.assets : [];
    check(materialization.asset_count === assets.length, 'VSR_MATERIALIZATION_ASSET_COUNT_MISMATCH');
    check(Array.isArray(materialization.dependencies) && materialization.dependencies.length >= assets.length * 4 && materialization.dependencies.length <= 256, 'VSR_MATERIALIZATION_DEPENDENCIES_INVALID');
    const dependencies = Array.isArray(materialization.dependencies) ? materialization.dependencies : [];
    check(materialization.dependency_count === dependencies.length, 'VSR_MATERIALIZATION_DEPENDENCY_COUNT_MISMATCH');
    check(Number.isSafeInteger(materialization.total_byte_length) && materialization.total_byte_length > 0, 'VSR_MATERIALIZATION_TOTAL_BYTES_INVALID');
    const ids = [...assets, ...dependencies].map(asset => asset?.id);
    check(ids.every(nonEmptyText) && new Set(ids).size === ids.length, 'VSR_MATERIALIZATION_PAYLOAD_IDS_INVALID');
    const projectionAssetsById = projection && Array.isArray(projection.assets) ? new Map(projection.assets.map(asset => [asset.id, asset])) : null;
    const projectionDependenciesById = projection && Array.isArray(projection.dependencies) ? new Map(projection.dependencies.map(asset => [asset.id, asset])) : null;
    if (projection !== null) {
      const projectionVerification = verifyUniversalArtAssetVsrProjection(projection, {assembly});
      if (!projectionVerification.valid) errors.push(...projectionVerification.errors.map(error => `VSR_MATERIALIZATION_PROJECTION_${error}`));
      check(materialization.projection_root === projection.projection_root, 'VSR_MATERIALIZATION_PROJECTION_ROOT_MISMATCH');
      check(materialization.assembly_root === projection.assembly_root && materialization.batch_root === projection.batch_root, 'VSR_MATERIALIZATION_PROJECTION_BATCH_BINDING_MISMATCH');
      check(materialization.source_reality_root === projection.source_reality_root && materialization.placement_root === projection.placement_root, 'VSR_MATERIALIZATION_PROJECTION_SOURCE_BINDING_MISMATCH');
      check(materialization.scene_id === projection.scene_id && materialization.world_id === projection.world_id && materialization.source_status === projection.status, 'VSR_MATERIALIZATION_PROJECTION_SCENE_MISMATCH');
      check(materialization.streaming_root === rootHash(projection.streaming), 'VSR_MATERIALIZATION_STREAMING_ROOT_MISMATCH');
      check(materialization.dependency_count === projection.dependency_count, 'VSR_MATERIALIZATION_PROJECTION_DEPENDENCY_COUNT_MISMATCH');
    }
    const suppliedPayloads = payloads === null ? null : universalArtAssetVsrPayloadMap(payloads);
    let totalBytes = 0;
    for (const asset of assets) {
      const id = asset?.id ?? 'unknown';
      check(nonEmptyText(asset?.uri) && asset?.format === 'model/gltf-binary' && asset?.kind === 'mesh', `VSR_MATERIALIZATION_ASSET_RECORD_INVALID:${id}`);
      check(isHexRoot(asset?.sha256) && Number.isSafeInteger(asset?.byte_length) && asset.byte_length > 0, `VSR_MATERIALIZATION_ASSET_PAYLOAD_INVALID:${id}`);
      check(isHexRoot(asset?.file_root), `VSR_MATERIALIZATION_ASSET_FILE_ROOT_INVALID:${id}`);
      check(nonEmptyText(asset?.relative_path) && !String(asset.relative_path).startsWith('/') && !String(asset.relative_path).split('/').includes('..'), `VSR_MATERIALIZATION_ASSET_PATH_INVALID:${id}`);
      check(nonEmptyText(asset?.output_directory), `VSR_MATERIALIZATION_ASSET_OUTPUT_DIRECTORY_INVALID:${id}`);
      check(Number.isSafeInteger(asset?.selected_lod) && asset.selected_lod >= 0 && asset.selected_lod <= 32, `VSR_MATERIALIZATION_ASSET_LOD_INVALID:${id}`);
      check(Array.isArray(asset?.dependencies) && asset.dependencies.length >= 4 && asset.dependencies.every(dependencyId => dependencies.some(dependency => dependency.id === dependencyId)), `VSR_MATERIALIZATION_ASSET_DEPENDENCIES_INVALID:${id}`);
      check(Array.isArray(asset?.cell_ids) && asset.cell_ids.length === 1 && asset.cell_ids.every(nonEmptyText), `VSR_MATERIALIZATION_ASSET_CELL_INVALID:${id}`);
      check(Number.isSafeInteger(asset?.priority) && asset.priority > 0, `VSR_MATERIALIZATION_ASSET_PRIORITY_INVALID:${id}`);
      check(asset?.status === 'MATERIALIZED', `VSR_MATERIALIZATION_ASSET_STATUS_INVALID:${id}`);
      totalBytes += Number(asset?.byte_length ?? 0);
      const source = projectionAssetsById?.get(id);
      if (source) {
        check(asset.uri === source.uri && asset.byte_length === source.byteLength && asset.sha256 === source.sha256, `VSR_MATERIALIZATION_PROJECTION_ASSET_BINDING_INVALID:${id}`);
        check(asset.file_root === source.metadata?.file_root && asset.relative_path === source.metadata?.relative_path && asset.output_directory === source.metadata?.output_directory, `VSR_MATERIALIZATION_PROJECTION_FILE_BINDING_INVALID:${id}`);
        check(asset.selected_lod === source.metadata?.selected_lod && JSON.stringify(asset.dependencies) === JSON.stringify(source.dependencies) && JSON.stringify(asset.cell_ids) === JSON.stringify(source.cellIds) && asset.priority === source.priority, `VSR_MATERIALIZATION_PROJECTION_STREAM_BINDING_INVALID:${id}`);
      } else if (projectionAssetsById) {
        errors.push(`VSR_MATERIALIZATION_PROJECTION_ASSET_MISSING:${id}`);
      }
    }
    for (const dependency of dependencies) {
      const id = dependency?.id ?? 'unknown';
      check(nonEmptyText(dependency?.uri) && dependency?.kind === 'texture' && nonEmptyText(dependency?.format) && String(dependency.format).startsWith('image/'), `VSR_MATERIALIZATION_DEPENDENCY_RECORD_INVALID:${id}`);
      check(isHexRoot(dependency?.sha256) && Number.isSafeInteger(dependency?.byte_length) && dependency.byte_length > 0, `VSR_MATERIALIZATION_DEPENDENCY_PAYLOAD_INVALID:${id}`);
      check(isHexRoot(dependency?.file_root), `VSR_MATERIALIZATION_DEPENDENCY_FILE_ROOT_INVALID:${id}`);
      check(nonEmptyText(dependency?.role) && UNIVERSAL_ART_ASSET_VSR_PBR_ROLES.includes(dependency.role) && isHexRoot(dependency?.pbr_pack_root), `VSR_MATERIALIZATION_DEPENDENCY_PBR_METADATA_INVALID:${id}`);
      check(nonEmptyText(dependency?.relative_path) && !String(dependency.relative_path).startsWith('/') && !String(dependency.relative_path).split('/').includes('..'), `VSR_MATERIALIZATION_DEPENDENCY_PATH_INVALID:${id}`);
      check(nonEmptyText(dependency?.output_directory), `VSR_MATERIALIZATION_DEPENDENCY_OUTPUT_DIRECTORY_INVALID:${id}`);
      check(Array.isArray(dependency?.cell_ids) && dependency.cell_ids.length === 1 && dependency.cell_ids.every(nonEmptyText), `VSR_MATERIALIZATION_DEPENDENCY_CELL_INVALID:${id}`);
      check(Number.isSafeInteger(dependency?.priority) && dependency.priority > 0, `VSR_MATERIALIZATION_DEPENDENCY_PRIORITY_INVALID:${id}`);
      check(dependency?.status === 'MATERIALIZED', `VSR_MATERIALIZATION_DEPENDENCY_STATUS_INVALID:${id}`);
      totalBytes += Number(dependency?.byte_length ?? 0);
      const source = projectionDependenciesById?.get(id);
      if (source) {
        check(dependency.uri === source.uri && dependency.format === source.format && dependency.byte_length === source.byteLength && dependency.sha256 === source.sha256, `VSR_MATERIALIZATION_PROJECTION_DEPENDENCY_BINDING_INVALID:${id}`);
        check(dependency.file_root === source.metadata?.file_root && dependency.role === source.metadata?.pbr_role && dependency.pbr_pack_root === source.metadata?.pbr_pack_root && dependency.relative_path === source.metadata?.relative_path && dependency.output_directory === source.metadata?.output_directory, `VSR_MATERIALIZATION_PROJECTION_DEPENDENCY_FILE_BINDING_INVALID:${id}`);
        check(JSON.stringify(dependency.cell_ids) === JSON.stringify(source.cellIds) && dependency.priority === source.priority, `VSR_MATERIALIZATION_PROJECTION_DEPENDENCY_STREAM_BINDING_INVALID:${id}`);
      } else if (projectionDependenciesById) {
        errors.push(`VSR_MATERIALIZATION_PROJECTION_DEPENDENCY_MISSING:${id}`);
      }
    }
    if (suppliedPayloads) {
      for (const asset of [...assets, ...dependencies]) {
        const id = asset?.id ?? 'unknown';
        if (!suppliedPayloads.has(id)) {
          errors.push(`VSR_MATERIALIZATION_PAYLOAD_MISSING:${id}`);
          continue;
        }
        try {
          const bytes = universalArtAssetVsrPayloadBytes(suppliedPayloads.get(id), id);
          check(bytes.byteLength === asset.byte_length, `VSR_MATERIALIZATION_PAYLOAD_BYTE_LENGTH_MISMATCH:${id}`);
          check(createHash('sha256').update(bytes).digest('hex') === asset.sha256, `VSR_MATERIALIZATION_PAYLOAD_SHA256_MISMATCH:${id}`);
          check(rootHash(Buffer.from(bytes).toString('base64')) === asset.file_root, `VSR_MATERIALIZATION_PAYLOAD_FILE_ROOT_MISMATCH:${id}`);
        } catch (error) {
          errors.push(`VSR_MATERIALIZATION_PAYLOAD_EXCEPTION:${id}:${error.message}`);
        }
      }
    }
    check(materialization.total_byte_length === totalBytes, 'VSR_MATERIALIZATION_TOTAL_BYTES_MISMATCH');
    check(materialization.candidate_only === true && materialization.authoritative === false && materialization.canonical_write_authorized === false, 'VSR_MATERIALIZATION_AUTHORITY_INVALID');
    check(materialization.authority?.canonical_owner === 'RNCS' && materialization.authority?.representation_owner === 'URRF', 'VSR_MATERIALIZATION_OWNER_INVALID');
    check(materialization.authority?.provider_can_write_authoritative_world_state === false && materialization.authority?.provider_can_commit === false && materialization.authority?.acceptance_can_commit === false && materialization.authority?.rncs_authority_required === true, 'VSR_MATERIALIZATION_PROVIDER_AUTHORITY_INVALID');
    const copy = clone(materialization);
    const actual = copy.materialization_root;
    delete copy.materialization_root;
    check(isHexRoot(actual) && actual === rootHash(copy), 'VSR_MATERIALIZATION_ROOT_INVALID');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, materialization_root: materialization.materialization_root ?? null};
}
