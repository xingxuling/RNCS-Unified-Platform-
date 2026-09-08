import {ContractError, rootHash, without} from './index.mjs';

export const REPRESENTATION_REF_FORMAT = 'rncs.representation-ref.v0.1';
export const REPRESENTATION_REF_VERSION = '0.1.0';
// Shared URRF family vocabulary, not a provider availability or quality claim.
// References remain extensible for provider-defined kinds; strict consumers can
// explicitly require a registered family using isRegisteredRepresentationKind.
export const REPRESENTATION_KINDS = Object.freeze([
  'world-proxy',
  'mesh',
  'gaussian-splats',
  'character-mesh',
  'layered-2d',
  'gaussian-character',
  'neural-visual',
  'cinematic-character'
]);

export function isRegisteredRepresentationKind(kind) {
  return typeof kind === 'string' && REPRESENTATION_KINDS.includes(kind);
}

export const REPRESENTATION_AUTHORITY_SCOPES = Object.freeze([
  'asset_generation_candidate',
  'representation_candidate',
  'visual_projection',
  'observation_candidate'
]);
export const REPRESENTATION_AVAILABILITY = Object.freeze([
  'CONTRACT_ONLY',
  'UNAVAILABLE',
  'CONFIGURED',
  'AVAILABLE',
  'EXECUTED'
]);

const keySort = (a, b) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
const clone = value => structuredClone(value);
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const fail = (condition, code) => { if (!condition) throw new ContractError(code); };
const strings = values => [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))].sort(keySort);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

function normalizeProfile(input = {}) {
  const value = record(input);
  const profile_id = String(value.profile_id ?? value.profileId ?? '');
  const formats = strings(value.formats ?? value.representation_formats);
  fail(profile_id, 'REPRESENTATION_PROFILE_ID_REQUIRED');
  fail(formats.length > 0, 'REPRESENTATION_PROFILE_FORMATS_REQUIRED');
  return {
    profile_id,
    encoding: String(value.encoding ?? 'provider-defined'),
    fidelity: String(value.fidelity ?? 'provider-defined'),
    precision: String(value.precision ?? 'provider-defined'),
    formats,
    metadata: clone(value.metadata ?? {})
  };
}

function normalizePolicy(input, label) {
  const value = record(input);
  return {
    mode: String(value.mode ?? 'provider-defined'),
    selectors: strings(value.selectors),
    budget: clone(value.budget ?? {}),
    metadata: clone(value.metadata ?? {}),
    policy_label: label
  };
}

function normalizeProvenance(input = {}) {
  const value = record(input);
  return {
    upstream_url: value.upstream_url ?? null,
    source_revision: value.source_revision ?? null,
    source_archive_sha256: value.source_archive_sha256 ?? null,
    generator_version: value.generator_version ?? null,
    parameters_root: value.parameters_root ?? null
  };
}

function normalizeEvidence(input = {}) {
  const value = record(input);
  return {
    provider_manifest_root: value.provider_manifest_root ?? null,
    provider_result_root: value.provider_result_root ?? null,
    runtime_receipt_root: value.runtime_receipt_root ?? null,
    notes: value.notes ?? null
  };
}

function normalizeScope(input) {
  const scope = strings(input);
  fail(scope.length > 0, 'REPRESENTATION_AUTHORITY_SCOPE_REQUIRED');
  fail(scope.every(value => REPRESENTATION_AUTHORITY_SCOPES.includes(value)), 'REPRESENTATION_AUTHORITY_SCOPE_INVALID');
  return scope;
}

export function createRepresentationRef(input = {}) {
  const value = record(input);
  fail(value.authoritative !== true, 'REPRESENTATION_REF_CANNOT_BE_AUTHORITATIVE');
  fail(value.candidate_only !== false, 'REPRESENTATION_REF_MUST_BE_CANDIDATE_ONLY');
  fail(value.authority?.provider_may_write_authoritative_world_state !== true, 'REPRESENTATION_PROVIDER_AUTHORITY_ESCALATION');
  const provider_id = String(value.provider_id ?? '');
  const provider_root = String(value.provider_root ?? value.provider_manifest_root ?? '');
  const representation_kind = String(value.representation_kind ?? value.kind ?? '');
  const representation_formats = strings(value.representation_formats ?? value.formats);
  const content_root = String(value.content_root ?? value.asset_root ?? '');
  const authority_scope = normalizeScope(value.authority_scope ?? value.authority?.scope ?? ['representation_candidate']);
  const availability = String(value.availability ?? value.runtime_status ?? 'CONTRACT_ONLY');
  fail(provider_id, 'REPRESENTATION_PROVIDER_ID_REQUIRED');
  fail(hex64(provider_root), 'REPRESENTATION_PROVIDER_ROOT_INVALID');
  fail(representation_kind, 'REPRESENTATION_KIND_REQUIRED');
  fail(representation_formats.length > 0, 'REPRESENTATION_FORMATS_REQUIRED');
  fail(hex64(content_root), 'REPRESENTATION_CONTENT_ROOT_INVALID');
  fail(REPRESENTATION_AVAILABILITY.includes(availability), 'REPRESENTATION_AVAILABILITY_INVALID');
  const representation_profile = normalizeProfile(value.representation_profile ?? value.profile ?? {});
  const detail_policy = normalizePolicy(value.detail_policy, 'detail');
  const residency_policy = normalizePolicy(value.residency_policy, 'residency');
  const idSeed = {provider_id, provider_root, representation_kind, representation_formats, content_root, representation_profile, detail_policy, residency_policy};
  const representation_id = String(value.representation_id ?? value.id ?? `representation:${rootHash(idSeed).slice(0, 24)}`);
  fail(representation_id, 'REPRESENTATION_ID_REQUIRED');
  const base = {
    format: REPRESENTATION_REF_FORMAT,
    version: REPRESENTATION_REF_VERSION,
    representation_id,
    provider_id,
    provider_root,
    representation_kind,
    representation_formats,
    content_root,
    source_uri: value.source_uri ?? value.uri ?? null,
    representation_profile,
    detail_policy,
    residency_policy,
    availability,
    authority_scope,
    authority: {
      provider_may_write_authoritative_world_state: false,
      rncs_authority_required: true
    },
    provenance: normalizeProvenance(value.provenance),
    evidence: normalizeEvidence(value.evidence),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, representation_root: rootHash(base)};
}

export function verifyRepresentationRef(reference) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!reference || typeof reference !== 'object') return {valid: false, errors: ['REPRESENTATION_REF_NOT_OBJECT']};
  try {
    check(reference.format === REPRESENTATION_REF_FORMAT, 'REPRESENTATION_REF_FORMAT_INVALID');
    check(reference.version === REPRESENTATION_REF_VERSION, 'REPRESENTATION_REF_VERSION_INVALID');
    check(typeof reference.representation_id === 'string' && reference.representation_id.length > 0, 'REPRESENTATION_ID_REQUIRED');
    check(typeof reference.provider_id === 'string' && reference.provider_id.length > 0, 'REPRESENTATION_PROVIDER_ID_REQUIRED');
    check(hex64(reference.provider_root), 'REPRESENTATION_PROVIDER_ROOT_INVALID');
    check(typeof reference.representation_kind === 'string' && reference.representation_kind.length > 0, 'REPRESENTATION_KIND_REQUIRED');
    check(Array.isArray(reference.representation_formats) && reference.representation_formats.length > 0, 'REPRESENTATION_FORMATS_REQUIRED');
    check(hex64(reference.content_root), 'REPRESENTATION_CONTENT_ROOT_INVALID');
    check(REPRESENTATION_AVAILABILITY.includes(reference.availability), 'REPRESENTATION_AVAILABILITY_INVALID');
    check(Array.isArray(reference.authority_scope) && reference.authority_scope.length > 0 && reference.authority_scope.every(scope => REPRESENTATION_AUTHORITY_SCOPES.includes(scope)), 'REPRESENTATION_AUTHORITY_SCOPE_INVALID');
    check(reference.authority?.provider_may_write_authoritative_world_state === false, 'REPRESENTATION_PROVIDER_AUTHORITY_ESCALATION');
    check(reference.authority?.rncs_authority_required === true, 'REPRESENTATION_RNCS_AUTHORITY_REQUIRED');
    check(reference.candidate_only === true, 'REPRESENTATION_REF_MUST_BE_CANDIDATE_ONLY');
    check(reference.authoritative === false, 'REPRESENTATION_REF_CANNOT_BE_AUTHORITATIVE');
    check(reference.commit_status === 'NOT_COMMITTED', 'REPRESENTATION_COMMIT_STATUS_INVALID');
    check(typeof reference.representation_profile?.profile_id === 'string' && reference.representation_profile.profile_id.length > 0, 'REPRESENTATION_PROFILE_ID_REQUIRED');
    check(Array.isArray(reference.representation_profile?.formats) && reference.representation_profile.formats.length > 0, 'REPRESENTATION_PROFILE_FORMATS_REQUIRED');
    check(typeof reference.detail_policy?.mode === 'string', 'REPRESENTATION_DETAIL_POLICY_INVALID');
    check(typeof reference.residency_policy?.mode === 'string', 'REPRESENTATION_RESIDENCY_POLICY_INVALID');
    check(hex64(reference.representation_root), 'REPRESENTATION_ROOT_INVALID');
    check(rootHash(without(reference, 'representation_root')) === reference.representation_root, 'REPRESENTATION_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`REPRESENTATION_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, representation_root: reference.representation_root};
}
