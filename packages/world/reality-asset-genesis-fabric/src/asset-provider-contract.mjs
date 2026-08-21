import {clone, clamp, GenesisError, rootHash, seal, stableId} from './canonical.mjs';

export const ASSET_PROVIDER_CONTRACT_VERSION = '0.1.0';
export const ASSET_PROVIDER_MANIFEST_FORMAT = 'ragf.asset-provider-manifest.v0.1';
export const ASSET_GENERATION_JOB_FORMAT = 'ragf.asset-generation-job.v0.1';
export const ASSET_PROVIDER_RESULT_FORMAT = 'ragf.asset-provider-result.v0.1';
export const ASSET_PROVIDER_FAILURE_FORMAT = 'ragf.asset-provider-failure.v0.1';

export const JOB_STATES = Object.freeze([
  'QUEUED',
  'PREPARING',
  'RUNNING',
  'VALIDATING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
]);

export const PROVIDER_TYPES = Object.freeze([
  '3d-production',
  'procedural-environment',
  'rigging',
  '3d-preview',
  'geometry-refinement',
  'generic'
]);

export const EXECUTION_MODES = Object.freeze([
  'local',
  'remote',
  'external-process',
  'api',
  'container'
]);

export const LICENSE_STATUSES = Object.freeze([
  'VERIFIED',
  'PARTIAL',
  'UNVERIFIED',
  'RESTRICTED'
]);

const nonEmpty = (value, fallback) => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const uniqueSorted = values => [...new Set((values ?? []).map(value => String(value)).filter(Boolean))].sort();

const asLicenseRecord = license => {
  if (typeof license === 'string') {
    return {
      status: license === 'UNVERIFIED' ? 'UNVERIFIED' : 'VERIFIED',
      identifier: license,
      upstream_url: null,
      code_status: license === 'UNVERIFIED' ? 'UNVERIFIED' : 'VERIFIED',
      dependency_status: 'NOT_AUDITED',
      model_weights_status: 'NOT_AUDITED'
    };
  }
  const value = license ?? {};
  return {
    status: LICENSE_STATUSES.includes(value.status) ? value.status : 'UNVERIFIED',
    identifier: value.identifier ?? null,
    upstream_url: value.upstream_url ?? null,
    source_revision: value.source_revision ?? null,
    code_status: value.code_status ?? value.status ?? 'UNVERIFIED',
    dependency_status: value.dependency_status ?? 'NOT_AUDITED',
    model_weights_status: value.model_weights_status ?? 'NOT_AUDITED',
    data_status: value.data_status ?? 'NOT_AUDITED',
    notices_required: Boolean(value.notices_required ?? true),
    notes: value.notes ?? null
  };
};

export function createComputeRequirement(input = {}) {
  const requirement = {
    cpu: nonEmpty(input.cpu, 'unspecified'),
    ram: nonEmpty(input.ram, 'unspecified'),
    gpu: nonEmpty(input.gpu, 'unspecified'),
    vram: nonEmpty(input.vram, 'unspecified'),
    accelerator: nonEmpty(input.accelerator, 'unspecified'),
    estimated_duration: nonEmpty(input.estimated_duration, 'unspecified'),
    priority: clamp(input.priority ?? 5000),
    deadline: input.deadline ?? null
  };
  return seal({...requirement, compute_requirement_root: ''}, 'compute_requirement_root');
}

export function createAssetProviderManifest(input = {}) {
  const id = nonEmpty(input.id ?? input.provider_id, '');
  if (!id) throw new GenesisError('ASSET_PROVIDER_ID_REQUIRED');
  const providerType = PROVIDER_TYPES.includes(input.providerType)
    ? input.providerType
    : 'generic';
  const license = asLicenseRecord(input.license);
  const capabilities = uniqueSorted(input.capabilities);
  if (!capabilities.length) throw new GenesisError('ASSET_PROVIDER_CAPABILITIES_REQUIRED', id);
  const manifest = {
    format: ASSET_PROVIDER_MANIFEST_FORMAT,
    contract_version: ASSET_PROVIDER_CONTRACT_VERSION,
    id,
    provider_id: id,
    name: nonEmpty(input.name, id),
    version: nonEmpty(input.version, 'unversioned'),
    providerType,
    capabilities,
    capability_descriptors: clone(input.capability_descriptors ?? []),
    inputFormats: uniqueSorted(input.inputFormats),
    outputFormats: uniqueSorted(input.outputFormats),
    executionMode: EXECUTION_MODES.includes(input.executionMode) ? input.executionMode : 'external-process',
    hardwareRequirements: clone(input.hardwareRequirements ?? {}),
    computeRequirement: createComputeRequirement(input.computeRequirement ?? input.hardwareRequirements ?? {}),
    license,
    commercialPolicy: {
      default_release_dependency_allowed: Boolean(input.commercialPolicy?.default_release_dependency_allowed ?? false),
      dependency_audit: input.commercialPolicy?.dependency_audit ?? 'REQUIRED',
      model_weight_policy: input.commercialPolicy?.model_weight_policy ?? 'USER_INSTALLED_OR_SEPARATELY_AUDITED',
      notes: input.commercialPolicy?.notes ?? null
    },
    provenancePolicy: {
      requires_source_url: input.provenancePolicy?.requires_source_url ?? true,
      requires_source_revision: input.provenancePolicy?.requires_source_revision ?? true,
      requires_generator_version: input.provenancePolicy?.requires_generator_version ?? true,
      requires_seed: input.provenancePolicy?.requires_seed ?? true,
      candidate_only: input.provenancePolicy?.candidate_only ?? true
    },
    runtimeStatus: input.runtimeStatus ?? 'CONTRACT_ONLY',
    upstream: clone(input.upstream ?? {}),
    command: clone(input.command ?? null),
    endpoint: input.endpoint ?? null,
    authority: {
      owns_asset_identity: false,
      owns_living_asset_family: false,
      owns_authoritative_world_state: false,
      may_emit_candidate: true
    },
    metadata: clone(input.metadata ?? {})
  };
  return seal({...manifest, manifest_root: ''}, 'manifest_root');
}

export function validateAssetProviderManifest(manifest) {
  const errors = [];
  if (manifest?.format !== ASSET_PROVIDER_MANIFEST_FORMAT) errors.push('FORMAT_INVALID');
  if (manifest?.contract_version !== ASSET_PROVIDER_CONTRACT_VERSION) errors.push('CONTRACT_VERSION_INVALID');
  for (const key of ['id', 'name', 'version', 'providerType', 'executionMode', 'manifest_root']) {
    if (manifest?.[key] === undefined || manifest?.[key] === null || manifest?.[key] === '') errors.push('MISSING:' + key);
  }
  if (!PROVIDER_TYPES.includes(manifest?.providerType)) errors.push('PROVIDER_TYPE_INVALID');
  if (!EXECUTION_MODES.includes(manifest?.executionMode)) errors.push('EXECUTION_MODE_INVALID');
  if (!Array.isArray(manifest?.capabilities) || !manifest.capabilities.length) errors.push('CAPABILITIES_REQUIRED');
  if (manifest?.authority?.owns_authoritative_world_state) errors.push('PROVIDER_AUTHORITY_ESCALATION');
  if (!LICENSE_STATUSES.includes(manifest?.license?.status)) errors.push('LICENSE_STATUS_INVALID');
  const copy = clone(manifest ?? {});
  const actual = copy.manifest_root;
  delete copy.manifest_root;
  if (actual !== rootHash(copy)) errors.push('MANIFEST_ROOT_MISMATCH');
  return {valid: errors.length === 0, errors};
}

export function createAssetGenerationJob(input = {}) {
  const providerId = input.provider_id ?? input.provider?.id ?? input.provider?.provider_id;
  if (!providerId) throw new GenesisError('ASSET_JOB_PROVIDER_REQUIRED');
  const job = {
    format: ASSET_GENERATION_JOB_FORMAT,
    version: ASSET_PROVIDER_CONTRACT_VERSION,
    job_id: input.job_id ?? stableId('asset-generation-job', {
      provider_id: providerId,
      asset_id: input.asset_id ?? input.genome?.identity?.asset_id ?? null,
      candidate_id: input.candidate_id ?? null,
      operation: input.operation ?? 'generate',
      seed: input.seed ?? input.genome?.seed ?? null
    }),
    provider_id: providerId,
    asset_id: input.asset_id ?? input.genome?.identity?.asset_id ?? null,
    candidate_id: input.candidate_id ?? null,
    operation: input.operation ?? 'generate',
    quality_tier: input.quality_tier ?? 'PRODUCTION',
    state: 'QUEUED',
    request: clone(input.request ?? {}),
    genome_root: input.genome?.genome_root ?? input.genome_root ?? null,
    seed: String(input.seed ?? input.genome?.seed ?? 'provider-seed'),
    compute_requirement: clone(input.compute_requirement ?? input.provider?.computeRequirement ?? createComputeRequirement()),
    history: [{state: 'QUEUED', detail: 'created'}],
    error: null,
    result_root: null,
    evidence_root: null
  };
  return seal({...job, job_root: ''}, 'job_root');
}

const transitionTable = {
  QUEUED: ['PREPARING', 'CANCELLED', 'FAILED'],
  PREPARING: ['RUNNING', 'CANCELLED', 'FAILED'],
  RUNNING: ['VALIDATING', 'CANCELLED', 'FAILED'],
  VALIDATING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: []
};

export function transitionAssetGenerationJob(job, nextState, detail = {}) {
  if (!JOB_STATES.includes(nextState)) throw new GenesisError('ASSET_JOB_STATE_INVALID', nextState);
  if (!transitionTable[job?.state]?.includes(nextState)) {
    throw new GenesisError('ASSET_JOB_INVALID_TRANSITION', String(job?.state) + '->' + nextState);
  }
  const next = {
    ...clone(job),
    state: nextState,
    history: [...(job.history ?? []), {state: nextState, detail: clone(detail)}]
  };
  if (nextState === 'FAILED') next.error = clone(detail);
  if (nextState === 'CANCELLED') next.error = {code: 'CANCELLED', detail: clone(detail)};
  return seal({...next, job_root: ''}, 'job_root');
}

export function completeAssetGenerationJob(job, result) {
  const running = job.state === 'RUNNING' ? job : transitionAssetGenerationJob(job, 'RUNNING', {implicit: true});
  const validating = transitionAssetGenerationJob(running, 'VALIDATING', {result_root: result.result_root});
  const completed = transitionAssetGenerationJob(validating, 'COMPLETED', {result_root: result.result_root});
  return seal({...completed, result_root: result.result_root, evidence_root: result.evidence?.evidence_root ?? null, job_root: ''}, 'job_root');
}

export function failAssetGenerationJob(job, error) {
  const current = clone(job);
  if (current.state === 'FAILED') return current;
  if (current.state === 'CANCELLED' || current.state === 'COMPLETED') throw new GenesisError('ASSET_JOB_TERMINAL_STATE', current.state);
  return transitionAssetGenerationJob(current, 'FAILED', error);
}

export function normalizeAssetProviderResult(raw = {}, {job, provider, stage = null} = {}) {
  const providerId = provider?.id ?? provider?.provider_id ?? job?.provider_id ?? raw.provider_id;
  if (!providerId) throw new GenesisError('ASSET_RESULT_PROVIDER_REQUIRED');
  const rawFiles = raw.files ?? raw.artifact?.files ?? [];
  const files = rawFiles.map((file, index) => {
    const content = file.content ?? file.base64 ?? null;
    const size = Number(file.size ?? (content ? Buffer.from(content, 'base64').byteLength : 0));
    return {
      path: nonEmpty(file.path ?? file.name, 'asset/file-' + index),
      name: nonEmpty(file.name ?? file.path, 'file-' + index),
      role: nonEmpty(file.role ?? file.format, 'asset-output'),
      format: nonEmpty(file.format ?? file.mime, 'application/octet-stream'),
      mime: file.mime ?? null,
      size,
      sha256: file.sha256 ?? rootHash({path: file.path ?? file.name, content, size}),
      content,
      uri: file.uri ?? null
    };
  });
  const license = asLicenseRecord(raw.license ?? provider?.license);
  const result = {
    format: ASSET_PROVIDER_RESULT_FORMAT,
    version: ASSET_PROVIDER_CONTRACT_VERSION,
    provider_id: providerId,
    provider_root: provider?.manifest_root ?? raw.provider_root ?? null,
    asset_id: raw.asset_id ?? job?.asset_id ?? null,
    candidate_id: raw.candidate_id ?? job?.candidate_id ?? stableId('asset-candidate', {providerId, job: job?.job_id, files}),
    stage: stage ?? raw.stage ?? job?.quality_tier ?? 'PRODUCTION',
    quality_tier: raw.quality_tier ?? job?.quality_tier ?? 'PRODUCTION',
    files,
    format_output: raw.format ?? raw.format_output ?? 'glTF/GLB',
    metadata: clone(raw.metadata ?? {}),
    geometry: clone(raw.geometry ?? raw.metadata?.geometry ?? {}),
    materials: clone(raw.materials ?? raw.metadata?.materials ?? {}),
    pbr_channels: uniqueSorted(raw.pbr_channels ?? raw.materials?.pbr_channels ?? ['baseColor', 'normal', 'orm', 'emissive']),
    source: clone(raw.source ?? {}),
    provenance: {
      provider_id: providerId,
      provider_root: provider?.manifest_root ?? raw.provenance?.provider_root ?? null,
      upstream_url: raw.provenance?.upstream_url ?? provider?.upstream?.url ?? null,
      source_revision: raw.provenance?.source_revision ?? provider?.upstream?.revision ?? null,
      generator_version: raw.provenance?.generator_version ?? provider?.version ?? null,
      parameters: clone(raw.provenance?.parameters ?? raw.parameters ?? {}),
      seed: String(raw.provenance?.seed ?? job?.seed ?? raw.seed ?? 'provider-seed'),
      weights_reference: raw.provenance?.weights_reference ?? null
    },
    license,
    generator_version: raw.generator_version ?? provider?.version ?? null,
    parameters: clone(raw.parameters ?? {}),
    seed: String(raw.seed ?? job?.seed ?? 'provider-seed'),
    evidence: {
      provider_success: raw.evidence?.provider_success ?? true,
      candidate_only: true,
      geometry: clone(raw.evidence?.geometry ?? {}),
      topology: clone(raw.evidence?.topology ?? {}),
      material_pbr: clone(raw.evidence?.material_pbr ?? {}),
      rig: clone(raw.evidence?.rig ?? {}),
      animation: clone(raw.evidence?.animation ?? {}),
      collision: clone(raw.evidence?.collision ?? {}),
      lod_platform: clone(raw.evidence?.lod_platform ?? {}),
      license: clone(raw.evidence?.license ?? {}),
      provenance: clone(raw.evidence?.provenance ?? {}),
      vsr_projection: raw.evidence?.vsr_projection ?? 'UNVERIFIED',
      rsr_simulation: raw.evidence?.rsr_simulation ?? 'UNVERIFIED',
      evidence_root: raw.evidence?.evidence_root ?? null
    },
    metrics: clone(raw.metrics ?? {}),
    warnings: [...(raw.warnings ?? [])],
    authoritative: false
  };
  const evidence = {...result.evidence};
  if (!evidence.evidence_root) evidence.evidence_root = rootHash(evidence);
  result.evidence = evidence;
  return seal({...result, result_root: ''}, 'result_root');
}

export function createProviderFailure({provider, job, code, detail = null, retryable = false} = {}) {
  return seal({
    format: ASSET_PROVIDER_FAILURE_FORMAT,
    version: ASSET_PROVIDER_CONTRACT_VERSION,
    provider_id: provider?.id ?? provider?.provider_id ?? job?.provider_id ?? null,
    job_id: job?.job_id ?? null,
    code: nonEmpty(code, 'PROVIDER_FAILED'),
    detail: clone(detail),
    retryable: Boolean(retryable),
    candidate_only: true,
    authoritative: false,
    failure_root: ''
  }, 'failure_root');
}

export class AssetGenerationJob {
  constructor(input = {}) {
    this.value = createAssetGenerationJob(input);
  }

  transition(state, detail = {}) {
    this.value = transitionAssetGenerationJob(this.value, state, detail);
    return this.snapshot();
  }

  complete(result) {
    this.value = completeAssetGenerationJob(this.value, result);
    return this.snapshot();
  }

  fail(error) {
    this.value = failAssetGenerationJob(this.value, error);
    return this.snapshot();
  }

  cancel(detail = 'cancelled') {
    if (!['QUEUED', 'PREPARING', 'RUNNING'].includes(this.value.state)) {
      throw new GenesisError('ASSET_JOB_NOT_CANCELLABLE', this.value.state);
    }
    this.value = transitionAssetGenerationJob(this.value, 'CANCELLED', detail);
    return this.snapshot();
  }

  snapshot() {
    return clone(this.value);
  }
}
