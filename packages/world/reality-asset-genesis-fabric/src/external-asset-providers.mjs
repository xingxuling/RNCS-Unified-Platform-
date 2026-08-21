import {spawnSync} from 'node:child_process';
import {clone, GenesisError, seal} from './canonical.mjs';
import {
  ASSET_PROVIDER_CONTRACT_VERSION,
  AssetGenerationJob,
  createAssetProviderManifest,
  createProviderFailure,
  normalizeAssetProviderResult,
  validateAssetProviderManifest
} from './asset-provider-contract.mjs';

const UPSTREAMS = {
  trellis2: {
    url: 'https://github.com/microsoft/TRELLIS.2',
    license_url: 'https://github.com/microsoft/TRELLIS.2/blob/main/LICENSE',
    revision: '75fbf0183001ed9876c8dbb35de6b68552ee08bd',
    code_license: 'MIT'
  },
  infinigen: {
    url: 'https://github.com/princeton-vl/infinigen',
    license_url: 'https://github.com/princeton-vl/infinigen/blob/main/LICENSE',
    revision: '25a7d284dc21fdea6525cdfc6be4c10e4d79f28f',
    code_license: 'BSD-3-Clause'
  },
  makeItAnimatable: {
    url: 'https://github.com/jasongzy/Make-It-Animatable',
    license_url: 'https://github.com/jasongzy/Make-It-Animatable/blob/main/LICENSE',
    revision: 'd60cc7e01ff8da46448e458dbf450e8967b34e77',
    code_license: 'MIT'
  },
  triposr: {
    url: 'https://github.com/VAST-AI-Research/TripoSR',
    license_url: 'https://github.com/VAST-AI-Research/TripoSR/blob/main/LICENSE',
    revision: '107cefdc244c39106fa830359024f6a2f1c78871',
    code_license: 'MIT'
  },
  triposf: {
    url: 'https://github.com/VAST-AI-Research/TripoSF',
    license_url: 'https://github.com/VAST-AI-Research/TripoSF/blob/main/LICENSE',
    revision: 'b97b749aa5726fb64ceec359a4ef8e61e79279c7',
    code_license: 'MIT'
  }
};

const capability = (capability_id, output, quality_tier, extra = {}) => ({
  capability_id,
  output,
  quality_tier,
  ...extra
});

const license = (identifier, upstream, options = {}) => ({
  status: options.status ?? 'VERIFIED',
  identifier,
  upstream_url: upstream.license_url,
  source_revision: upstream.revision,
  code_status: 'VERIFIED',
  dependency_status: options.dependency_status ?? 'REQUIRES_AUDIT',
  model_weights_status: options.model_weights_status ?? 'REQUIRES_SEPARATE_AUDIT',
  data_status: options.data_status ?? 'REQUIRES_SEPARATE_AUDIT',
  notices_required: true,
  notes: options.notes ?? null
});

const commonPolicy = notes => ({
  default_release_dependency_allowed: false,
  dependency_audit: 'REQUIRED',
  model_weight_policy: 'USER_INSTALLED_OR_SEPARATELY_AUDITED',
  notes
});

export function externalAssetProviderManifests() {
  return [
    createAssetProviderManifest({
      id: 'provider:external:trellis-2',
      name: 'Microsoft TRELLIS.2',
      version: 'main',
      providerType: '3d-production',
      capabilities: ['asset.generate.3d.production', 'asset.generate.mesh', 'asset.generate.pbr'],
      capability_descriptors: [
        capability('asset.generate.3d.production', 'glb+pbr', 'PRODUCTION'),
        capability('asset.generate.mesh', 'glb', 'PRODUCTION'),
        capability('asset.generate.pbr', 'pbr-channel-pack', 'PRODUCTION')
      ],
      inputFormats: ['image/jpeg', 'image/png', 'ragf.asset-genome.v0.3', 'ragf.asset-intent.v0.3'],
      outputFormats: ['model/gltf-binary', 'image/png', 'application/json'],
      executionMode: 'external-process',
      hardwareRequirements: {cpu: '8+ cores', ram: '32GB+', gpu: 'CUDA', vram: '24GB+', accelerator: 'NVIDIA CUDA'},
      license: license('MIT', UPSTREAMS.trellis2, {notes: 'Repository code license verified; dependencies and model weights stay external.'}),
      commercialPolicy: commonPolicy('Do not vendor the model or dependency stack into RNCS Core.'),
      runtimeStatus: 'CONTRACT_ONLY',
      upstream: UPSTREAMS.trellis2,
      metadata: {quality_tier: 'PRODUCTION', authoritative: false, weights_bundled: false}
    }),
    createAssetProviderManifest({
      id: 'provider:external:infinigen',
      name: 'Princeton Infinigen',
      version: 'main',
      providerType: 'procedural-environment',
      capabilities: ['world.asset.generate.procedural', 'world.asset.terrain', 'world.asset.vegetation', 'world.asset.rock', 'world.asset.building', 'world.asset.room', 'world.asset.furniture', 'world.asset.environment'],
      capability_descriptors: [
        capability('world.asset.generate.procedural', 'asset-family', 'PRODUCTION'),
        capability('world.asset.terrain', 'glb+placement', 'PRODUCTION'),
        capability('world.asset.vegetation', 'glb+placement', 'PRODUCTION'),
        capability('world.asset.rock', 'glb+placement', 'PRODUCTION'),
        capability('world.asset.building', 'glb+placement', 'PRODUCTION'),
        capability('world.asset.room', 'glb+placement', 'PRODUCTION'),
        capability('world.asset.furniture', 'glb+placement', 'PRODUCTION'),
        capability('world.asset.environment', 'environment-family', 'PRODUCTION')
      ],
      inputFormats: ['ragf.asset-genome.v0.3', 'ragf.asset-intent.v0.3', 'ragf.world-seed.v0.1'],
      outputFormats: ['model/gltf-binary', 'application/json', 'ragf.asset-family.v0.1'],
      executionMode: 'external-process',
      hardwareRequirements: {cpu: '8+ cores', ram: '32GB+', gpu: 'CUDA', vram: '12GB+', accelerator: 'NVIDIA CUDA + Blender'},
      license: license('BSD-3-Clause', UPSTREAMS.infinigen, {notes: 'Procedural output remains a candidate with seed and dependency provenance.'}),
      commercialPolicy: commonPolicy('Blender and Python dependency licenses require a separate release audit.'),
      runtimeStatus: 'CONTRACT_ONLY',
      upstream: UPSTREAMS.infinigen,
      metadata: {quality_tier: 'PRODUCTION', procedural: true, seed_required: true}
    }),
    createAssetProviderManifest({
      id: 'provider:external:make-it-animatable',
      name: 'Make-It-Animatable',
      version: 'main',
      providerType: 'rigging',
      capabilities: ['asset.rig.predict', 'asset.skin.predict', 'asset.pose.initial'],
      capability_descriptors: [
        capability('asset.rig.predict', 'rig-candidate', 'PRODUCTION'),
        capability('asset.skin.predict', 'skin-candidate', 'PRODUCTION'),
        capability('asset.pose.initial', 'pose-candidate', 'PRODUCTION')
      ],
      inputFormats: ['model/gltf-binary', 'model/obj', 'ragf.asset-genome.v0.3'],
      outputFormats: ['model/gltf-binary', 'application/json'],
      executionMode: 'external-process',
      hardwareRequirements: {cpu: '8+ cores', ram: '16GB+', gpu: 'CUDA', vram: '12GB+', accelerator: 'PyTorch + Blender/FBX2glTF'},
      license: license('MIT', UPSTREAMS.makeItAnimatable, {notes: 'Repository code is MIT; model/data/dependency terms remain separately audited.'}),
      commercialPolicy: commonPolicy('Do not bundle Mixamo/Hugging Face data or weights without separate review.'),
      runtimeStatus: 'CONTRACT_ONLY',
      upstream: UPSTREAMS.makeItAnimatable,
      metadata: {quality_tier: 'PRODUCTION', candidate_outputs: ['rig', 'skin', 'pose']}
    }),
    createAssetProviderManifest({
      id: 'provider:external:triposr',
      name: 'TripoSR',
      version: 'main',
      providerType: '3d-preview',
      capabilities: ['asset.generate.3d.preview', 'asset.generate.mesh'],
      capability_descriptors: [
        capability('asset.generate.3d.preview', 'glb', 'PREVIEW'),
        capability('asset.generate.mesh', 'glb', 'PREVIEW')
      ],
      inputFormats: ['image/jpeg', 'image/png', 'ragf.asset-genome.v0.3'],
      outputFormats: ['model/gltf-binary', 'application/json'],
      executionMode: 'external-process',
      hardwareRequirements: {cpu: '4+ cores', ram: '16GB+', gpu: 'CUDA', vram: '8GB+', accelerator: 'NVIDIA CUDA'},
      license: license('MIT', UPSTREAMS.triposr, {notes: 'Preview output cannot be promoted without Production Court validation.'}),
      commercialPolicy: commonPolicy('Preview is never marked production-ready by Provider success alone.'),
      runtimeStatus: 'CONTRACT_ONLY',
      upstream: UPSTREAMS.triposr,
      metadata: {quality_tier: 'PREVIEW', promotion_target: 'provider:external:trellis-2'}
    }),
    createAssetProviderManifest({
      id: 'provider:external:triposf',
      name: 'TripoSF',
      version: 'main',
      providerType: 'geometry-refinement',
      capabilities: ['asset.refine.geometry'],
      capability_descriptors: [
        capability('asset.refine.geometry', 'refined-glb', 'PRODUCTION')
      ],
      inputFormats: ['model/gltf-binary', 'model/obj', 'ragf.asset-candidate.v0.1'],
      outputFormats: ['model/gltf-binary', 'application/json'],
      executionMode: 'external-process',
      hardwareRequirements: {cpu: '8+ cores', ram: '32GB+', gpu: 'CUDA', vram: '24GB+', accelerator: 'NVIDIA CUDA'},
      license: license('MIT', UPSTREAMS.triposf, {notes: 'Refinement only; it does not own Asset Genome or Living Asset identity.'}),
      commercialPolicy: commonPolicy('Refinement dependencies and weights remain user-installed and audited separately.'),
      runtimeStatus: 'CONTRACT_ONLY',
      upstream: UPSTREAMS.triposf,
      metadata: {quality_tier: 'PRODUCTION', role: 'geometry-refiner', main_generator: false}
    })
  ];
}

export function auditExternalProviderLicenses(manifests = externalAssetProviderManifests()) {
  const entries = manifests.map(manifest => {
    const validation = validateAssetProviderManifest(manifest);
    const licenseRecord = manifest.license ?? {};
    const blockedReasons = [];
    if (licenseRecord.status !== 'VERIFIED') blockedReasons.push('UPSTREAM_CODE_LICENSE_NOT_VERIFIED');
    if (licenseRecord.dependency_status !== 'VERIFIED') blockedReasons.push('DEPENDENCY_LICENSE_AUDIT_REQUIRED');
    if (licenseRecord.model_weights_status !== 'VERIFIED') blockedReasons.push('MODEL_WEIGHT_LICENSE_AUDIT_REQUIRED');
    if (manifest.commercialPolicy?.default_release_dependency_allowed !== true) blockedReasons.push('DEFAULT_COMMERCIAL_DEPENDENCY_DISABLED');
    return {
      provider_id: manifest.id,
      name: manifest.name,
      upstream_url: manifest.upstream?.url ?? null,
      license_url: licenseRecord.upstream_url ?? null,
      code_license: licenseRecord.identifier ?? 'UNVERIFIED',
      license_status: licenseRecord.status,
      dependency_status: licenseRecord.dependency_status,
      model_weights_status: licenseRecord.model_weights_status,
      default_commercial_release: blockedReasons.length === 0,
      blocked_reasons: blockedReasons,
      manifest_valid: validation.valid,
      manifest_errors: validation.errors
    };
  });
  return seal({
    format: 'ragf.asset-provider-license-audit.v0.1',
    version: ASSET_PROVIDER_CONTRACT_VERSION,
    policy: {
      no_unverified_license_in_default_release: true,
      no_external_dependency_vendoring_in_rncs_core: true,
      model_weights_require_separate_audit: true
    },
    entries,
    audit_root: ''
  }, 'audit_root');
}

export class AssetProviderRegistry {
  constructor(providers = []) {
    this.providers = new Map();
    for (const provider of providers) this.register(provider);
  }

  register(provider) {
    const validation = validateAssetProviderManifest(provider);
    if (!validation.valid) throw new GenesisError('ASSET_PROVIDER_MANIFEST_INVALID', validation.errors.join(','));
    this.providers.set(provider.id, clone(provider));
    return this;
  }

  list() {
    return [...this.providers.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  get(providerId) {
    return clone(this.providers.get(providerId) ?? null);
  }

  findByCapability(capabilityId) {
    return this.list().filter(provider => provider.capabilities.includes(capabilityId));
  }

  negotiate(requirement = {}) {
    const capabilities = [...new Set(requirement.capabilities ?? [])];
    const candidates = this.list().filter(provider =>
      capabilities.every(capabilityId => provider.capabilities.includes(capabilityId)) &&
      (requirement.quality_tier === undefined ||
        provider.metadata?.quality_tier === requirement.quality_tier ||
        (requirement.allow_preview && provider.metadata?.quality_tier === 'PREVIEW'))
    );
    const selected = candidates[0] ?? null;
    return seal({
      format: 'ragf.asset-provider-negotiation.v0.1',
      version: '0.1.0',
      required_capabilities: capabilities,
      quality_tier: requirement.quality_tier ?? null,
      selected_provider_id: selected?.id ?? null,
      selected_provider_root: selected?.manifest_root ?? null,
      candidates: candidates.map(provider => ({
        provider_id: provider.id,
        provider_root: provider.manifest_root,
        provider_type: provider.providerType,
        quality_tier: provider.metadata?.quality_tier ?? null,
        runtime_status: provider.runtimeStatus
      })),
      unresolved: selected ? [] : capabilities,
      eligible: Boolean(selected),
      negotiation_root: ''
    }, 'negotiation_root');
  }
}

function runCommand(command, request, timeout = 60000) {
  const parts = Array.isArray(command) ? command : [command];
  if (!parts[0]) throw new GenesisError('ASSET_PROVIDER_COMMAND_REQUIRED');
  const result = spawnSync(parts[0], parts.slice(1), {
    input: JSON.stringify(request),
    encoding: 'utf8',
    timeout,
    maxBuffer: 128 * 1024 * 1024
  });
  if (result.error) throw new GenesisError('ASSET_PROVIDER_EXECUTION_FAILED', result.error.message);
  if (result.status !== 0) throw new GenesisError('ASSET_PROVIDER_NONZERO', String(result.stderr ?? '').slice(0, 2000));
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new GenesisError('ASSET_PROVIDER_INVALID_JSON', error.message);
  }
}

export class AssetProviderAdapter {
  constructor(manifest, {runner = null, timeout = 60000} = {}) {
    const validation = validateAssetProviderManifest(manifest);
    if (!validation.valid) throw new GenesisError('ASSET_PROVIDER_MANIFEST_INVALID', validation.errors.join(','));
    this.manifest = clone(manifest);
    this.runner = runner;
    this.timeout = timeout;
  }

  healthCheck() {
    if (this.runner) return {status: 'AVAILABLE', runtime: 'EXECUTOR_INJECTED', provider_id: this.manifest.id};
    if (this.manifest.command) return {status: 'CONFIGURED', runtime: 'EXTERNAL_PROCESS', provider_id: this.manifest.id};
    return {status: this.manifest.runtimeStatus, runtime: 'CONTRACT_ONLY', provider_id: this.manifest.id};
  }

  prepare(input = {}) {
    return {
      provider_id: this.manifest.id,
      manifest_root: this.manifest.manifest_root,
      operation: input.operation ?? 'generate',
      prepared: true,
      runtime: this.healthCheck().runtime,
      compute_requirement: clone(this.manifest.computeRequirement)
    };
  }

  execute(operation, input = {}) {
    const job = new AssetGenerationJob({
      provider: this.manifest,
      provider_id: this.manifest.id,
      asset_id: input.asset_id ?? input.genome?.identity?.asset_id,
      candidate_id: input.candidate_id,
      operation,
      quality_tier: input.quality_tier ?? this.manifest.metadata?.quality_tier ?? 'PRODUCTION',
      genome: input.genome,
      request: input.request,
      seed: input.seed
    });
    try {
      job.transition('PREPARING', {manifest_root: this.manifest.manifest_root});
      job.transition('RUNNING', {operation});
      let raw;
      if (this.runner) {
        raw = this.runner({operation, provider: clone(this.manifest), job: job.snapshot(), input: clone(input)});
      } else if (this.manifest.command) {
        raw = runCommand(this.manifest.command, {operation, provider: this.manifest, job: job.snapshot(), input}, this.timeout);
      } else {
        const failure = createProviderFailure({
          provider: this.manifest,
          job: job.snapshot(),
          code: 'PROVIDER_RUNTIME_NOT_EXECUTED',
          detail: 'Contract verified; no local command, runner, model weights or GPU runtime was supplied.',
          retryable: false
        });
        job.fail({code: failure.code, failure_root: failure.failure_root});
        return {
          status: 'CONTRACT_VERIFIED_RUNTIME_NOT_EXECUTED',
          provider: clone(this.manifest),
          job: job.snapshot(),
          result: null,
          failure
        };
      }
      const result = normalizeAssetProviderResult(raw, {
        job: job.snapshot(),
        provider: this.manifest,
        stage: input.stage ?? operation
      });
      job.complete(result);
      return {status: 'COMPLETED', provider: clone(this.manifest), job: job.snapshot(), result, failure: null};
    } catch (error) {
      const failure = createProviderFailure({
        provider: this.manifest,
        job: job.snapshot(),
        code: error.code ?? 'PROVIDER_EXECUTION_FAILED',
        detail: error.detail ?? error.message,
        retryable: false
      });
      if (!['FAILED', 'CANCELLED', 'COMPLETED'].includes(job.snapshot().state)) {
        job.fail({code: failure.code, failure_root: failure.failure_root});
      }
      return {status: 'FAILED', provider: clone(this.manifest), job: job.snapshot(), result: null, failure};
    }
  }

  generate(input = {}) {
    return this.execute('generate', input);
  }

  refine(input = {}) {
    return this.execute('refine', input);
  }

  validate(input = {}) {
    return this.execute('validate', input);
  }

  cancel(job) {
    return {status: 'CANCELLED', job: new AssetGenerationJob({provider: this.manifest, job_id: job?.job_id ?? undefined}).cancel('adapter-cancelled')};
  }
}

export function createExternalAssetProviderAdapters({manifests = externalAssetProviderManifests(), runners = {}} = {}) {
  return manifests.map(manifest => new AssetProviderAdapter(manifest, {runner: runners[manifest.id] ?? null}));
}

const providerFactory = (id, options = {}) => {
  const manifest = externalAssetProviderManifests().find(item => item.id === id);
  if (!manifest) throw new GenesisError('ASSET_PROVIDER_NOT_FOUND', id);
  return new AssetProviderAdapter(manifest, options);
};

export function createTrellis2Provider(options = {}) {
  return providerFactory('provider:external:trellis-2', options);
}

export function createInfinigenProvider(options = {}) {
  return providerFactory('provider:external:infinigen', options);
}

export function createMakeItAnimatableProvider(options = {}) {
  return providerFactory('provider:external:make-it-animatable', options);
}

export function createTripoSRProvider(options = {}) {
  return providerFactory('provider:external:triposr', options);
}

export function createTripoSFProvider(options = {}) {
  return providerFactory('provider:external:triposf', options);
}

export function createMockAssetProvider({provider_id = 'provider:test:asset-mock', runner = null} = {}) {
  const manifest = createAssetProviderManifest({
    id: provider_id,
    name: 'RAGF Contract Mock Asset Provider',
    version: '0.1.0',
    providerType: '3d-production',
    capabilities: ['asset.generate.3d.production', 'asset.generate.mesh', 'asset.generate.pbr', 'asset.rig.predict', 'asset.refine.geometry'],
    inputFormats: ['ragf.asset-genome.v0.3'],
    outputFormats: ['model/gltf-binary', 'application/json'],
    executionMode: 'local',
    hardwareRequirements: {cpu: 'any', ram: 'any', gpu: 'none', vram: 'none', accelerator: 'none'},
    license: {status: 'VERIFIED', identifier: 'Apache-2.0', code_status: 'VERIFIED', dependency_status: 'VERIFIED', model_weights_status: 'VERIFIED', data_status: 'VERIFIED', upstream_url: 'https://taowind.company'},
    commercialPolicy: {default_release_dependency_allowed: true, dependency_audit: 'VERIFIED', model_weight_policy: 'NO_EXTERNAL_WEIGHTS'},
    runtimeStatus: 'READY',
    upstream: {url: 'https://taowind.company', revision: 'local-test'},
    metadata: {quality_tier: 'PRODUCTION', test_provider: true}
  });
  const defaultRunner = ({operation, input}) => {
    const assetId = input.asset_id ?? input.genome?.identity?.asset_id ?? 'asset:test';
    const text = Buffer.from('RAGF-MOCK-' + operation + '-' + assetId).toString('base64');
    const files = [
      {name: 'mesh/lod0.glb', path: 'mesh/lod0.glb', role: 'mesh-glb', format: 'model/gltf-binary', mime: 'model/gltf-binary', base64: text, size: Buffer.from(text, 'base64').length},
      {name: 'mesh/lod1.glb', path: 'mesh/lod1.glb', role: 'mesh-lod1-glb', format: 'model/gltf-binary', mime: 'model/gltf-binary', base64: text, size: Buffer.from(text, 'base64').length},
      {name: 'mesh/lod2.glb', path: 'mesh/lod2.glb', role: 'mesh-lod2-glb', format: 'model/gltf-binary', mime: 'model/gltf-binary', base64: text, size: Buffer.from(text, 'base64').length},
      {name: 'pbr/base-color.png', path: 'pbr/base-color.png', role: 'pbr-base-color', format: 'image/png', mime: 'image/png', base64: text},
      {name: 'pbr/normal.png', path: 'pbr/normal.png', role: 'pbr-normal', format: 'image/png', mime: 'image/png', base64: text},
      {name: 'pbr/orm.png', path: 'pbr/orm.png', role: 'pbr-orm', format: 'image/png', mime: 'image/png', base64: text},
      {name: 'pbr/emissive.png', path: 'pbr/emissive.png', role: 'pbr-emissive', format: 'image/png', mime: 'image/png', base64: text},
      {name: 'rig/rig.json', path: 'rig/rig.json', role: 'rig-candidate', format: 'application/json', mime: 'application/json', base64: text}
    ];
    return {
      asset_id: assetId,
      format: 'glTF/GLB',
      quality_tier: input.quality_tier ?? 'PRODUCTION',
      files,
      geometry: {triangle_count: 1200, topology_status: 'manifold', vertex_count: 720, glb_valid: true},
      materials: {material_count: 1, pbr_model: 'metallic-roughness'},
      pbr_channels: ['baseColor', 'normal', 'orm', 'emissive'],
      generator_version: 'ragf-mock-0.1.0',
      parameters: {operation},
      seed: input.seed ?? input.genome?.seed ?? 'mock-seed',
      evidence: {
        provider_success: true,
        geometry: {status: 'PASS', triangle_count: 1200},
        topology: {status: 'PASS', manifold: true},
        material_pbr: {status: 'PASS', channels: 4},
        rig: {status: 'PASS', bone_count: 8},
        animation: {status: 'PASS', clip_count: 4, smoke_test: true},
        collision: {status: 'PASS', shape: 'capsule'},
        lod_platform: {status: 'PASS', lod_count: 3},
        license: {status: 'PASS'},
        provenance: {status: 'PASS'},
        vsr_projection: 'PASS',
        rsr_simulation: 'PASS'
      },
      metrics: {latency_ms: 1, deterministic: true}
    };
  };
  return new AssetProviderAdapter(manifest, {runner: runner ?? defaultRunner});
}
