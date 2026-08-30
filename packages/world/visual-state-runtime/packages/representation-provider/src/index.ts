import { cryptographicHash } from '../../spec/src/index.js';

export const VSR_REPRESENTATION_PROVIDER_BINDING_FORMAT = 'vsr.representation-provider-binding.v0.1' as const;
export const VSR_SPARK_3DGS_PROVIDER_ID = 'provider:external:spark-2.1.0' as const;

type JsonRecord = Record<string, unknown>;

export interface VSRRepresentationProviderManifest {
  id: string;
  version: string;
  manifest_root: string;
  runtimeStatus: string;
  capabilities: string[];
  authority: {
    owns_authoritative_world_state: false;
    scope: string[];
  };
  representation: {
    kinds: string[];
    profiles?: Array<{ profile_id: string; formats?: string[]; [key: string]: unknown }>;
    detail_policy?: JsonRecord | null;
    residency_policy?: JsonRecord | null;
  };
}

export interface VSRRepresentationReference {
  format: 'rncs.representation-ref.v0.1';
  provider_id: string;
  provider_root: string;
  representation_kind: string;
  representation_formats: string[];
  content_root: string;
  representation_profile: { profile_id: string; formats: string[]; [key: string]: unknown };
  detail_policy: JsonRecord;
  residency_policy: JsonRecord;
  availability: string;
  authority_scope: string[];
  authority: {
    provider_may_write_authoritative_world_state: false;
    rncs_authority_required: true;
  };
  candidate_only: true;
  authoritative: false;
  representation_root: string;
  [key: string]: unknown;
}

export interface VSRVisualRepresentationProviderInspection {
  format: 'vsr.representation-provider-inspection.v0.1';
  provider_id: string;
  provider_root: string;
  runtime_status: string;
  representation_kinds: string[];
  visual_capabilities: string[];
  authority: {
    projection_only: true;
    provider_can_write_authoritative_world_state: false;
    rncs_authority_required: true;
  };
  inspection_root: string;
}

export interface VSRVisualRepresentationBinding {
  format: typeof VSR_REPRESENTATION_PROVIDER_BINDING_FORMAT;
  version: '0.1.0';
  provider: {
    id: string;
    manifest_root: string;
    runtime_status: string;
    visual_capabilities: string[];
  };
  reference: VSRRepresentationReference;
  projection: {
    representation_kind: string;
    representation_formats: string[];
    representation_profile: JsonRecord;
    detail_policy: JsonRecord;
    residency_policy: JsonRecord;
  };
  execution_status: 'NOT_EXECUTED';
  authority: {
    projection_only: true;
    provider_can_write_authoritative_world_state: false;
    rncs_authority_required: true;
  };
  binding_root: string;
}

function fail(condition: unknown, code: string): asserts condition {
  if (!condition) throw new Error(code);
}

const isHexRoot = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const strings = (value: unknown): string[] => [...new Set((Array.isArray(value) ? value : []).map(item => String(item)).filter(Boolean))].sort();
const clone = <T>(value: T): T => structuredClone(value);
const asRecord = (value: unknown): JsonRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};

export function inspectVisualRepresentationProvider(provider: VSRRepresentationProviderManifest): VSRVisualRepresentationProviderInspection {
  const authority = asRecord(provider?.authority);
  const representation = asRecord(provider?.representation);
  const capabilities = strings(provider?.capabilities);
  const scope = strings(authority.scope);
  const representationKinds = strings(representation.kinds);
  fail(typeof provider?.id === 'string' && provider.id.length > 0, 'VSR_REPRESENTATION_PROVIDER_ID_REQUIRED');
  fail(isHexRoot(provider.manifest_root), 'VSR_REPRESENTATION_PROVIDER_ROOT_INVALID');
  fail(typeof provider.runtimeStatus === 'string' && provider.runtimeStatus.length > 0, 'VSR_REPRESENTATION_PROVIDER_RUNTIME_STATUS_REQUIRED');
  fail(authority.owns_authoritative_world_state === false, 'VSR_REPRESENTATION_PROVIDER_AUTHORITY_ESCALATION');
  fail(scope.includes('visual_projection'), 'VSR_REPRESENTATION_PROVIDER_VISUAL_SCOPE_REQUIRED');
  fail(capabilities.includes('representation.visual.render'), 'VSR_REPRESENTATION_PROVIDER_RENDER_CAPABILITY_REQUIRED');
  fail(representationKinds.length > 0, 'VSR_REPRESENTATION_PROVIDER_KIND_REQUIRED');
  const base = {
    format: 'vsr.representation-provider-inspection.v0.1' as const,
    provider_id: provider.id,
    provider_root: provider.manifest_root,
    runtime_status: provider.runtimeStatus,
    representation_kinds: representationKinds,
    visual_capabilities: capabilities.filter(capability => capability.startsWith('representation.visual.')),
    authority: {
      projection_only: true as const,
      provider_can_write_authoritative_world_state: false as const,
      rncs_authority_required: true as const
    }
  };
  return { ...base, inspection_root: cryptographicHash(base) };
}

function validateReference(reference: VSRRepresentationReference, inspection: VSRVisualRepresentationProviderInspection): void {
  fail(reference?.format === 'rncs.representation-ref.v0.1', 'VSR_REPRESENTATION_REF_FORMAT_INVALID');
  fail(reference.provider_id === inspection.provider_id, 'VSR_REPRESENTATION_PROVIDER_ID_MISMATCH');
  fail(reference.provider_root === inspection.provider_root, 'VSR_REPRESENTATION_PROVIDER_ROOT_MISMATCH');
  fail(isHexRoot(reference.content_root), 'VSR_REPRESENTATION_CONTENT_ROOT_INVALID');
  fail(isHexRoot(reference.representation_root), 'VSR_REPRESENTATION_ROOT_INVALID');
  fail(reference.candidate_only === true, 'VSR_REPRESENTATION_REF_MUST_BE_CANDIDATE_ONLY');
  fail(reference.authoritative === false, 'VSR_REPRESENTATION_REF_CANNOT_BE_AUTHORITATIVE');
  fail(reference.authority?.provider_may_write_authoritative_world_state === false, 'VSR_REPRESENTATION_PROVIDER_AUTHORITY_ESCALATION');
  fail(reference.authority?.rncs_authority_required === true, 'VSR_REPRESENTATION_RNCS_AUTHORITY_REQUIRED');
  fail(strings(reference.authority_scope).includes('visual_projection'), 'VSR_REPRESENTATION_REF_VISUAL_SCOPE_REQUIRED');
  fail(inspection.representation_kinds.includes(reference.representation_kind), 'VSR_REPRESENTATION_KIND_UNSUPPORTED');
  fail(strings(reference.representation_formats).length > 0, 'VSR_REPRESENTATION_FORMAT_REQUIRED');
  fail(typeof reference.representation_profile?.profile_id === 'string' && reference.representation_profile.profile_id.length > 0, 'VSR_REPRESENTATION_PROFILE_REQUIRED');
}

export function createVisualRepresentationBinding({ provider, reference }: { provider: VSRRepresentationProviderManifest; reference: VSRRepresentationReference }): VSRVisualRepresentationBinding {
  const inspection = inspectVisualRepresentationProvider(provider);
  validateReference(reference, inspection);
  const base = {
    format: VSR_REPRESENTATION_PROVIDER_BINDING_FORMAT,
    version: '0.1.0' as const,
    provider: {
      id: inspection.provider_id,
      manifest_root: inspection.provider_root,
      runtime_status: inspection.runtime_status,
      visual_capabilities: inspection.visual_capabilities
    },
    reference: clone(reference),
    projection: {
      representation_kind: reference.representation_kind,
      representation_formats: strings(reference.representation_formats),
      representation_profile: clone(reference.representation_profile) as JsonRecord,
      detail_policy: clone(reference.detail_policy),
      residency_policy: clone(reference.residency_policy)
    },
    execution_status: 'NOT_EXECUTED' as const,
    authority: inspection.authority
  };
  return { ...base, binding_root: cryptographicHash(base) };
}

export function createSpark3DGSVisualBinding({ provider, reference }: { provider: VSRRepresentationProviderManifest; reference: VSRRepresentationReference }): VSRVisualRepresentationBinding {
  fail(provider?.id === VSR_SPARK_3DGS_PROVIDER_ID, 'VSR_SPARK_PROVIDER_ID_REQUIRED');
  fail(reference?.representation_kind === 'gaussian-splats', 'VSR_SPARK_GAUSSIAN_REPRESENTATION_REQUIRED');
  return createVisualRepresentationBinding({ provider, reference });
}

export function verifyVisualRepresentationBinding(binding: VSRVisualRepresentationBinding): boolean {
  try {
    fail(binding?.format === VSR_REPRESENTATION_PROVIDER_BINDING_FORMAT, 'VSR_REPRESENTATION_BINDING_FORMAT_INVALID');
    fail(binding.version === '0.1.0', 'VSR_REPRESENTATION_BINDING_VERSION_INVALID');
    fail(binding.execution_status === 'NOT_EXECUTED', 'VSR_REPRESENTATION_EXECUTION_STATUS_INVALID');
    fail(binding.authority?.projection_only === true, 'VSR_REPRESENTATION_PROJECTION_ONLY_REQUIRED');
    fail(binding.authority?.provider_can_write_authoritative_world_state === false, 'VSR_REPRESENTATION_PROVIDER_AUTHORITY_ESCALATION');
    fail(binding.authority?.rncs_authority_required === true, 'VSR_REPRESENTATION_RNCS_AUTHORITY_REQUIRED');
    fail(isHexRoot(binding.binding_root), 'VSR_REPRESENTATION_BINDING_ROOT_INVALID');
    const { binding_root: _bindingRoot, ...base } = binding;
    return cryptographicHash(base) === binding.binding_root;
  } catch {
    return false;
  }
}
