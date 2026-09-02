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
  if (execution.file_inspection) writeJson(outDir, 'universal-art-asset-file-inspection.json', execution.file_inspection);
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
  const status = acceptance.pass ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED';
  const forge = forgeEnvelope({genome, resolution, execution, candidate, acceptance, ledger: evidence.ledger, outDir, status});
  persistForge({outDir, genome, resolution, acceptance, evidence, forge, execution, candidate, workspaceVerification});
  return {status, forge, genome, resolution, execution, workspace, workspaceVerification, candidate, acceptance, fileInspection, evidenceLedger: evidence.ledger, evidenceVerification: evidence.verification};
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
  const status = acceptance.pass ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED';
  const forge = forgeEnvelope({genome, resolution, execution: executionEnvelope, candidate, acceptance, ledger: evidence.ledger, outDir, status});
  persistForge({outDir, genome, resolution, acceptance, evidence, forge, execution: executionEnvelope, candidate, providerResult: execution.result});
  return {status, forge, genome, resolution, execution: executionEnvelope, providerExecution: execution, candidate, providerCourt, acceptance, fileInspection, evidenceLedger: evidence.ledger, evidenceVerification: evidence.verification, materialization};
}

function generateBlocked({genome, resolution, outDir, execution}) {
  const acceptance = evaluateUniversalArtAssetAcceptance({genome, execution});
  const evidence = createLedger({genome, provider: null, acceptance});
  const forge = forgeEnvelope({genome, resolution, execution, candidate: null, acceptance, ledger: evidence.ledger, outDir, status: 'BLOCKED'});
  persistForge({outDir, genome, resolution, acceptance, evidence, forge, execution, candidate: null});
  return {status: 'BLOCKED', forge, genome, resolution, execution, candidate: null, acceptance, fileInspection: null, evidenceLedger: evidence.ledger, evidenceVerification: evidence.verification};
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
