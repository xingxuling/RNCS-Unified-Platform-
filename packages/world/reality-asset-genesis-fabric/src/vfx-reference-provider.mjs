import {createHash} from 'node:crypto';
import {createAssetProviderManifest} from './asset-provider-contract.mjs';
import {AssetProviderAdapter} from './external-asset-providers.mjs';
import {clone, GenesisError, rootHash, seal, stableId} from './canonical.mjs';
import {circle, encodePng, line, parseHex, polygon, rect, surface} from './png.mjs';

export const VFX_ASSET_CONTRACT_FORMAT = 'ragf.vfx-asset-contract.v0.1';
export const VFX_ASSET_CONTRACT_VERSION = '0.1.0';
export const VFX_PROVIDER_ID = 'provider:taowind:vfx-reference';
export const VFX_PROVIDER_RESULT_FORMAT = 'urrf.vfx-reference-bundle.v0.1';

export const VFX_REPRESENTATION_KINDS = Object.freeze([
  'particle',
  'volume',
  'flipbook',
  'curve'
]);

const VFX_KIND_TO_ROLE = Object.freeze({
  particle: 'vfx-particle',
  volume: 'vfx-volume',
  flipbook: 'vfx-flipbook',
  curve: 'vfx-curve'
});

const VFX_KIND_TO_FORMAT = Object.freeze({
  particle: 'application/vnd.urrf.vfx.particle+json',
  volume: 'application/vnd.urrf.vfx.volume+json',
  flipbook: 'image/png',
  curve: 'application/vnd.urrf.vfx.curve+json'
});

const VFX_KIND_TO_PROFILE = Object.freeze({
  particle: {profile_id: 'urrf.vfx.particle.fixed-step.v0.1', encoding: 'sparse-emitter-graph', fidelity: 'reference', precision: 'float32'},
  volume: {profile_id: 'urrf.vfx.volume.sparse-grid.v0.1', encoding: 'sparse-density-grid', fidelity: 'reference', precision: 'uint8-density'},
  flipbook: {profile_id: 'urrf.vfx.flipbook.rgba8.v0.1', encoding: 'rgba8-sprite-sheet', fidelity: 'reference', precision: 'uint8'},
  curve: {profile_id: 'urrf.vfx.curve.ribbon.v0.1', encoding: 'polyline-ribbon', fidelity: 'reference', precision: 'float32'}
});

const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = value => String(value ?? '').trim();
const hashBytes = value => createHash('sha256').update(value).digest('hex');

function sortedUnique(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(value => text(value).toLowerCase()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'en'));
}

function normalizeKinds(value, fallback = VFX_REPRESENTATION_KINDS) {
  const kinds = sortedUnique(value ?? fallback);
  if (!kinds.length || kinds.some(kind => !VFX_REPRESENTATION_KINDS.includes(kind))) {
    throw new GenesisError('VFX_REPRESENTATION_KINDS_INVALID', kinds.join(','));
  }
  return kinds;
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function fileRecord({path, role, format, bytes}) {
  return {
    path,
    name: path,
    role,
    format,
    mime: format,
    size: bytes.length,
    sha256: hashBytes(bytes),
    base64: bytes.toString('base64')
  };
}

function makeParticlePayload({genome, maxParticles}) {
  const palette = clone(genome.visual?.palette ?? []);
  return {
    format: 'rsr.vfx-particle-emitter.v0.1',
    version: VFX_ASSET_CONTRACT_VERSION,
    asset_id: genome.identity.asset_id,
    simulation: {
      mode: 'fixed-step-cpu-reference',
      time_step_seconds: 1 / 60,
      deterministic: true,
      seed: genome.seed
    },
    emitter: {
      shape: 'sphere',
      rate: 0,
      burst: Math.min(maxParticles, 64),
      lifetime_seconds: [0.18, 0.72],
      speed_meters_per_second: [1.4, 5.2],
      drag: 0.78,
      gravity_meters_per_second_squared: [0, 1.4, 0]
    },
    modules: [
      {module: 'size-over-life', curve: [[0, 0.15], [0.18, 1], [1, 0]]},
      {module: 'opacity-over-life', curve: [[0, 0], [0.08, 1], [1, 0]]},
      {module: 'color-over-life', colors: palette.slice(0, 3)},
      {module: 'collision', mode: 'candidate-only-ground-plane'}
    ],
    budget: {max_particles: maxParticles, cpu_reference: true}
  };
}

function makeVolumePayload({genome}) {
  return {
    format: 'vsr.vfx-volume-density-grid.v0.1',
    version: VFX_ASSET_CONTRACT_VERSION,
    asset_id: genome.identity.asset_id,
    grid: {
      dimensions: [16, 16, 16],
      voxel_size_meters: 0.125,
      encoding: 'sparse-density-u8',
      occupied_voxel_count: 448,
      density_range: [0, 255],
      bounds_meters: {min: [-1, -1, -1], max: [1, 1, 1]}
    },
    channels: ['density', 'temperature', 'emission'],
    sampling: {filter: 'trilinear', address: 'clamp', temporal: 'fixed-step'},
    runtime: {projection: 'vsr-volume', residency: 'paged', canonical_world_write: false}
  };
}

function makeFlipbookPayload({genome}) {
  const frameWidth = 32;
  const frameHeight = 32;
  const frameCount = 4;
  const canvas = surface(frameWidth * frameCount, frameHeight, [0, 0, 0, 0]);
  const [primary, white, accent, dark] = (genome.visual?.palette ?? ['#1c4fa3', '#f2f6ff', '#9ddcff', '#17305a']).map(parseHex);
  for (let frame = 0; frame < frameCount; frame += 1) {
    const ox = frame * frameWidth;
    const radius = 4 + frame * 2;
    circle(canvas, ox + 16, 16, radius, [...accent.slice(0, 3), Math.max(30, 230 - frame * 46)]);
    circle(canvas, ox + 16, 16, Math.max(1, radius - 3), [...white.slice(0, 3), Math.max(30, 220 - frame * 42)]);
    polygon(canvas, [[ox + 16, 2 + frame], [ox + 22, 14], [ox + 16, 30 - frame], [ox + 10, 14]], [...primary.slice(0, 3), 150]);
    rect(canvas, ox + 2, 2, 3, 3, [...dark.slice(0, 3), 180]);
  }
  return {
    png: encodePng(canvas.width, canvas.height, canvas.data),
    metadata: {
      format: 'vsr.vfx-flipbook.rgba8.v0.1',
      version: VFX_ASSET_CONTRACT_VERSION,
      asset_id: genome.identity.asset_id,
      frame_width: frameWidth,
      frame_height: frameHeight,
      frame_count: frameCount,
      duration_seconds: 0.24,
      playback: 'once',
      color_space: 'srgb-alpha',
      premultiplied_alpha: false
    }
  };
}

function makeCurvePayload({genome}) {
  const palette = clone(genome.visual?.palette ?? []);
  return {
    format: 'vsr.vfx-curve-ribbon.v0.1',
    version: VFX_ASSET_CONTRACT_VERSION,
    asset_id: genome.identity.asset_id,
    curve: {
      interpolation: 'catmull-rom',
      closed: false,
      points: [[0, 0, 0], [0.25, 0.35, 0], [0.52, 0.82, 0.12], [0.88, 1.18, 0.2]],
      widths_meters: [0.12, 0.1, 0.06, 0],
      colors: palette.slice(0, 3),
      uv_policy: 'arc-length'
    },
    runtime: {projection: 'vsr-curve-ribbon', tessellation: 'screen-space', canonical_world_write: false}
  };
}

function makeEffectGraph({genome, kinds, maxParticles}) {
  const nodes = [
    {node_id: 'event-source', kind: 'event', event: 'spawn'},
    ...kinds.map(kind => ({node_id: `${kind}-representation`, kind, role: VFX_KIND_TO_ROLE[kind]})),
    {node_id: 'runtime-projection', kind: 'vsr-projection', authority: 'candidate-only'}
  ];
  return {
    format: 'urrf.vfx-effect-graph.v0.1',
    version: VFX_ASSET_CONTRACT_VERSION,
    asset_id: genome.identity.asset_id,
    simulation: {clock: 'world-time-derived', step_seconds: 1 / 60, max_particles: maxParticles},
    nodes,
    edges: [
      {from: 'event-source', to: 'runtime-projection', signal: 'effect-trigger'},
      ...kinds.map(kind => ({from: 'runtime-projection', to: `${kind}-representation`, signal: 'project'}))
    ],
    failure_policy: 'fail-closed-preserve-event-and-last-valid-representation',
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', provider_can_write_authoritative_world_state: false}
  };
}

export function createVfxAssetContract({genome, kinds = VFX_REPRESENTATION_KINDS, artifactRoots = {}, maxParticles = null} = {}) {
  if (!genome?.identity?.asset_id || !genome?.genome_root) throw new GenesisError('VFX_GENOME_REQUIRED');
  const representationKinds = normalizeKinds(kinds);
  const particleBudget = Number(maxParticles ?? genome.budgets?.max_particles ?? 96);
  if (!Number.isSafeInteger(particleBudget) || particleBudget < 1) throw new GenesisError('VFX_PARTICLE_BUDGET_INVALID');
  const normalizedRoots = Object.fromEntries(Object.entries(record(artifactRoots))
    .filter(([role, value]) => text(role) && /^[a-f0-9]{64}$/u.test(String(value)))
    .sort(([left], [right]) => left.localeCompare(right, 'en')));
  return seal({
    format: VFX_ASSET_CONTRACT_FORMAT,
    version: VFX_ASSET_CONTRACT_VERSION,
    asset_id: genome.identity.asset_id,
    genome_root: genome.genome_root,
    representation_kinds: representationKinds,
    artifact_roles: Object.fromEntries(representationKinds.map(kind => [kind, VFX_KIND_TO_ROLE[kind]])),
    artifact_roots: normalizedRoots,
    effect_graph: {
      node_policy: 'one-runtime-projection-plus-one-node-per-representation',
      event_clock: 'world-time-derived',
      failure_policy: 'fail-closed-preserve-event-and-last-valid-representation'
    },
    simulation_budget: {
      max_particles: particleBudget,
      fixed_step_seconds: 1 / 60,
      max_volume_dimensions: [16, 16, 16],
      max_flipbook_frames: 4,
      max_curve_points: 64
    },
    platform_contract: {
      target_platforms: [...(genome.target_platforms ?? [])].sort(),
      supported: true,
      status: 'PASS'
    },
    runtime_contract: {
      vsr_projection_required: true,
      rsr_observation_candidate_allowed: true,
      canonical_world_write: false
    },
    authority: {
      canonical_owner: 'RNCS',
      representation_owner: 'URRF',
      provider_can_write_authoritative_world_state: false,
      provider_can_commit: false,
      candidate_only: true,
      authoritative: false
    },
    contract_root: ''
  }, 'contract_root');
}

export function verifyVfxAssetContract(contract, {genome = null, artifactRoots = null, requiredKinds = null} = {}) {
  const errors = [];
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) return {valid: false, errors: ['VFX_CONTRACT_NOT_OBJECT'], contract_root: null};
  try {
    if (contract.format !== VFX_ASSET_CONTRACT_FORMAT) errors.push('FORMAT_INVALID');
    if (contract.version !== VFX_ASSET_CONTRACT_VERSION) errors.push('VERSION_INVALID');
    if (genome && (contract.asset_id !== genome.identity?.asset_id || contract.genome_root !== genome.genome_root)) errors.push('GENOME_BINDING_INVALID');
    const kinds = normalizeKinds(contract.representation_kinds);
    if (requiredKinds !== null) {
      const expected = normalizeKinds(requiredKinds);
      if (expected.some(kind => !kinds.includes(kind))) errors.push('REQUIRED_REPRESENTATION_MISSING');
    }
    const roles = record(contract.artifact_roles);
    for (const kind of kinds) if (roles[kind] !== VFX_KIND_TO_ROLE[kind]) errors.push(`ARTIFACT_ROLE_MISMATCH:${kind}`);
    const roots = record(contract.artifact_roots);
    for (const kind of kinds) {
      const role = VFX_KIND_TO_ROLE[kind];
      if (!/^[a-f0-9]{64}$/u.test(String(roots[role] ?? ''))) errors.push(`ARTIFACT_ROOT_MISSING:${role}`);
    }
    if (artifactRoots !== null && rootHash(roots) !== rootHash(artifactRoots)) errors.push('ARTIFACT_ROOTS_MISMATCH');
    if (contract.effect_graph?.event_clock !== 'world-time-derived') errors.push('EFFECT_GRAPH_CLOCK_INVALID');
    if (contract.effect_graph?.failure_policy !== 'fail-closed-preserve-event-and-last-valid-representation') errors.push('EFFECT_GRAPH_FAILURE_POLICY_INVALID');
    if (contract.platform_contract?.supported !== true || contract.platform_contract?.status !== 'PASS') errors.push('PLATFORM_CONTRACT_INVALID');
    if (contract.runtime_contract?.vsr_projection_required !== true || contract.runtime_contract?.canonical_world_write !== false) errors.push('RUNTIME_CONTRACT_INVALID');
    if (contract.authority?.canonical_owner !== 'RNCS' || contract.authority?.representation_owner !== 'URRF' || contract.authority?.provider_can_write_authoritative_world_state !== false || contract.authority?.provider_can_commit !== false || contract.authority?.candidate_only !== true || contract.authority?.authoritative !== false) errors.push('AUTHORITY_INVALID');
    const copy = clone(contract);
    const actual = copy.contract_root;
    delete copy.contract_root;
    if (!/^[a-f0-9]{64}$/u.test(String(actual ?? '')) || actual !== rootHash(copy)) errors.push('CONTRACT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, contract_root: contract.contract_root ?? null};
}

function representationRef({provider, kind, contentRoot, fileFormat, genome, metadata}) {
  return {
    representation_id: stableId('urrf-vfx-representation', {asset_id: genome.identity.asset_id, kind, content_root: contentRoot}),
    provider_id: provider.id,
    provider_root: provider.manifest_root,
    representation_kind: kind,
    representation_formats: [fileFormat],
    content_root: contentRoot,
    availability: 'AVAILABLE',
    representation_profile: {
      ...clone(VFX_KIND_TO_PROFILE[kind]),
      formats: [fileFormat],
      metadata: clone(metadata ?? {})
    },
    detail_policy: {mode: 'bounded-budget', selectors: ['screen-space-size', 'distance', 'quality-tier'], budget: {provider_configured: false}},
    residency_policy: {mode: 'paged-streaming', selectors: ['interest', 'priority'], budget: {working_set: 'runtime-configured'}},
    authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
    provenance: {
      upstream_url: 'builtin://taowind/rncs-vfx-reference',
      source_revision: 'vfx-reference-v0.1',
      generator_version: 'rncs-vfx-reference-v0.1'
    },
    evidence: {provider_manifest_root: provider.manifest_root, notes: 'deterministic reference representation; not AAA evidence'}
  };
}

export function createVfxReferenceResult({genome, request = {}, provider} = {}) {
  if (!genome?.identity?.asset_id || !provider?.id || !provider?.manifest_root) throw new GenesisError('VFX_PROVIDER_INPUT_INVALID');
  const visualEffect = record(request.representation_contract?.visual_effect);
  const kinds = normalizeKinds(visualEffect.required_kinds ?? visualEffect.representation_kinds);
  const maxParticles = Math.min(Number(genome.budgets?.max_particles ?? 96), 96);
  if (!Number.isSafeInteger(maxParticles) || maxParticles < 1) throw new GenesisError('VFX_PARTICLE_BUDGET_INVALID');
  const payloads = {
    particle: makeParticlePayload({genome, maxParticles}),
    volume: makeVolumePayload({genome}),
    flipbook: makeFlipbookPayload({genome}),
    curve: makeCurvePayload({genome})
  };
  const files = [];
  const artifactRoots = {};
  const representationRefs = [];
  for (const kind of kinds) {
    const role = VFX_KIND_TO_ROLE[kind];
    const format = VFX_KIND_TO_FORMAT[kind];
    const bytes = kind === 'flipbook' ? payloads.flipbook.png : jsonBytes(payloads[kind]);
    const file = fileRecord({
      path: kind === 'particle' ? 'vfx/particle/emitter.json'
        : kind === 'volume' ? 'vfx/volume/grid.json'
          : kind === 'flipbook' ? 'vfx/flipbook/sheet.png'
            : 'vfx/curve/ribbon.json',
      role,
      format,
      bytes
    });
    files.push(file);
    artifactRoots[role] = rootHash({role, sha256: file.sha256, size: file.size, format});
    representationRefs.push(representationRef({
      provider,
      kind,
      contentRoot: file.sha256,
      fileFormat: format,
      genome,
      metadata: kind === 'flipbook'
        ? {frame_count: payloads.flipbook.metadata.frame_count, frame_size: [payloads.flipbook.metadata.frame_width, payloads.flipbook.metadata.frame_height]}
        : {payload_format: payloads[kind].format}
    }));
    if (kind === 'flipbook') {
      const metadataBytes = jsonBytes(payloads.flipbook.metadata);
      files.push(fileRecord({path: 'vfx/flipbook/metadata.json', role: 'vfx-flipbook-metadata', format: 'application/json', bytes: metadataBytes}));
    }
  }
  const effectGraph = makeEffectGraph({genome, kinds, maxParticles});
  const effectGraphBytes = jsonBytes(effectGraph);
  files.push(fileRecord({path: 'vfx/effect-graph.json', role: 'vfx-effect-graph', format: 'application/json', bytes: effectGraphBytes}));
  artifactRoots['vfx-effect-graph'] = rootHash({role: 'vfx-effect-graph', sha256: hashBytes(effectGraphBytes), size: effectGraphBytes.length, format: 'application/json'});
  const vfxContract = createVfxAssetContract({genome, kinds, artifactRoots, maxParticles});
  return {
    asset_id: genome.identity.asset_id,
    format_output: {
      format: VFX_PROVIDER_RESULT_FORMAT,
      vfx_contract: vfxContract,
      representation_kinds: kinds,
      artifact_roots: artifactRoots
    },
    files,
    representation_refs: representationRefs,
    geometry: {},
    materials: {material_model: 'unlit-vfx', material_count: 0},
    pbr_channels: [],
    source: {
      kind: 'deterministic-reference',
      canonical_semantics: 'RNCS',
      representation_materialization: 'URRF'
    },
    provenance: {
      upstream_url: 'builtin://taowind/rncs-vfx-reference',
      source_revision: 'vfx-reference-v0.1',
      generator_version: 'rncs-vfx-reference-v0.1',
      seed: genome.seed,
      weights_reference: null
    },
    license: {
      status: 'VERIFIED',
      identifier: 'Apache-2.0',
      upstream_url: 'builtin://taowind/rncs-vfx-reference',
      source_revision: 'vfx-reference-v0.1',
      code_status: 'VERIFIED',
      dependency_status: 'VERIFIED',
      model_weights_status: 'NOT_APPLICABLE',
      data_status: 'NOT_APPLICABLE'
    },
    generator_version: 'rncs-vfx-reference-v0.1',
    parameters: {representation_kinds: kinds, max_particles: maxParticles, deterministic: true, vfx_contract_root: vfxContract.contract_root},
    seed: genome.seed,
    evidence: {
      provider_success: true,
      representation: {status: 'PASS', representation_kinds: kinds, contract_root: vfxContract.contract_root},
      vsr_projection: 'PASS',
      rsr_simulation: 'PASS'
    },
    metrics: {
      deterministic: true,
      platform_status: 'PASS',
      representation_kind_count: kinds.length,
      particle_budget: maxParticles,
      flipbook_frame_count: kinds.includes('flipbook') ? payloads.flipbook.metadata.frame_count : 0,
      volume_voxel_count: kinds.includes('volume') ? payloads.volume.grid.occupied_voxel_count : 0,
      curve_point_count: kinds.includes('curve') ? payloads.curve.curve.points.length : 0,
      vfx_contract_root: vfxContract.contract_root
    },
    quality_tier: 'PRODUCTION'
  };
}

function createVfxReferenceManifest() {
  return createAssetProviderManifest({
    id: VFX_PROVIDER_ID,
    name: 'TaoWind URRF VFX Reference Provider v0.1',
    version: '0.1.0',
    providerType: 'representation',
    capabilities: VFX_REPRESENTATION_KINDS.flatMap(kind => [`asset.generate.vfx.${kind}`]).concat(['asset.generate.vfx']),
    capability_descriptors: [
      {capability_id: 'asset.generate.vfx', outputs: VFX_REPRESENTATION_KINDS.map(kind => VFX_KIND_TO_ROLE[kind]), quality_tier: 'PRODUCTION'},
      ...VFX_REPRESENTATION_KINDS.map(kind => ({capability_id: `asset.generate.vfx.${kind}`, outputs: [VFX_KIND_TO_ROLE[kind]], quality_tier: 'PRODUCTION'}))
    ],
    inputFormats: ['ragf.asset-genome.v0.3', 'urrf.universal-art-asset-genome.v0.1'],
    outputFormats: ['application/json', 'image/png', ...VFX_REPRESENTATION_KINDS.map(kind => VFX_KIND_TO_FORMAT[kind])],
    executionMode: 'local',
    hardwareRequirements: {cpu: 'any', ram: 'any', gpu: 'none', vram: 'none', accelerator: 'none'},
    license: {status: 'VERIFIED', identifier: 'Apache-2.0', code_status: 'VERIFIED', dependency_status: 'VERIFIED', model_weights_status: 'NOT_APPLICABLE', data_status: 'NOT_APPLICABLE', upstream_url: 'builtin://taowind/rncs-vfx-reference'},
    commercialPolicy: {default_release_dependency_allowed: false, dependency_audit: 'NOT_APPLICABLE', model_weight_policy: 'NO_EXTERNAL_WEIGHTS', notes: 'Reference candidate only; AAA release still requires independent art, quality, hardware, and provenance evidence.'},
    runtimeStatus: 'READY_REFERENCE',
    upstream: {url: 'builtin://taowind/rncs-vfx-reference', revision: 'vfx-reference-v0.1'},
    representation: {
      kinds: VFX_REPRESENTATION_KINDS,
      profiles: VFX_REPRESENTATION_KINDS.map(kind => ({...clone(VFX_KIND_TO_PROFILE[kind]), formats: [VFX_KIND_TO_FORMAT[kind]]})),
      detail_policy: {mode: 'bounded-budget', selectors: ['screen-space-size', 'distance', 'quality-tier']},
      residency_policy: {mode: 'paged-streaming', selectors: ['interest', 'priority']}
    },
    authority_scope: ['asset_generation_candidate', 'representation_candidate', 'visual_projection', 'observation_candidate'],
    metadata: {
      deterministic: true,
      offline: true,
      reference: true,
      quality_tier: 'PRODUCTION',
      asset_family_profiles: ['vfx-3d'],
      canonical_world_owner: 'RNCS',
      representation_owner: 'URRF',
      real_gpu_required: false,
      aaa_status: 'BLOCKED_EXTERNAL_ART_HUMAN_HARDWARE_EVIDENCE'
    }
  });
}

export function createVfxReferenceProvider() {
  const manifest = createVfxReferenceManifest();
  return new AssetProviderAdapter(manifest, {
    runner: ({input}) => createVfxReferenceResult({genome: input.genome, request: input.request, provider: manifest})
  });
}
