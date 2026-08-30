import { semanticHash } from '../../spec/src/index.js';

export const RSR_REPRESENTATION_OBSERVATION_CANDIDATE_FORMAT = 'rsr.representation-observation-candidate.v0.1' as const;

type JsonRecord = Record<string, unknown>;

export interface RSRRepresentationReference {
  format: 'rncs.representation-ref.v0.1';
  provider_id: string;
  provider_root: string;
  representation_kind: string;
  content_root: string;
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

export interface RSRRepresentationObservationCandidate {
  format: typeof RSR_REPRESENTATION_OBSERVATION_CANDIDATE_FORMAT;
  version: '0.1.0';
  representation_candidate: {
    provider_id: string;
    provider_root: string;
    representation_root: string;
    representation_kind: string;
    content_root: string;
    availability: string;
  };
  observation: {
    kind: 'ingress' | 'raycast' | 'bounds' | 'lod' | 'residency';
    data: JsonRecord;
  };
  reconstruction_candidate: null;
  canonical_state_proposal: null;
  authority: {
    provider_can_write_authoritative_world_state: false;
    rsr_can_promote_without_independent_evidence: false;
    rncs_authority_required: true;
  };
  candidate_only: true;
  authoritative: false;
  commit_status: 'NOT_COMMITTED';
  observation_root: string;
}

const allowedObservationKinds = new Set(['ingress', 'raycast', 'bounds', 'lod', 'residency']);
function fail(condition: unknown, code: string): asserts condition { if (!condition) throw new Error(code); }
const root = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const record = (value: unknown): JsonRecord => value && typeof value === 'object' && !Array.isArray(value) ? structuredClone(value) as JsonRecord : {};

function validateObservationReference(reference: RSRRepresentationReference): void {
  fail(reference?.format === 'rncs.representation-ref.v0.1', 'RSR_REPRESENTATION_REF_FORMAT_INVALID');
  fail(typeof reference.provider_id === 'string' && reference.provider_id.length > 0, 'RSR_REPRESENTATION_PROVIDER_ID_REQUIRED');
  fail(root(reference.provider_root), 'RSR_REPRESENTATION_PROVIDER_ROOT_INVALID');
  fail(root(reference.content_root), 'RSR_REPRESENTATION_CONTENT_ROOT_INVALID');
  fail(root(reference.representation_root), 'RSR_REPRESENTATION_ROOT_INVALID');
  fail(reference.candidate_only === true, 'RSR_REPRESENTATION_REF_MUST_BE_CANDIDATE_ONLY');
  fail(reference.authoritative === false, 'RSR_REPRESENTATION_REF_CANNOT_BE_AUTHORITATIVE');
  fail(reference.authority?.provider_may_write_authoritative_world_state === false, 'RSR_REPRESENTATION_PROVIDER_AUTHORITY_ESCALATION');
  fail(reference.authority?.rncs_authority_required === true, 'RSR_REPRESENTATION_RNCS_AUTHORITY_REQUIRED');
  fail(Array.isArray(reference.authority_scope) && reference.authority_scope.includes('observation_candidate'), 'RSR_REPRESENTATION_REF_OBSERVATION_SCOPE_REQUIRED');
}

export function createRepresentationObservationCandidate(input: {
  reference: RSRRepresentationReference;
  observation?: { kind?: 'ingress' | 'raycast' | 'bounds' | 'lod' | 'residency'; data?: JsonRecord };
  canonical_state_proposal?: unknown;
  reconstruction_candidate?: unknown;
  promote_to_canonical?: unknown;
}): RSRRepresentationObservationCandidate {
  fail(input?.canonical_state_proposal === undefined, 'RSR_REPRESENTATION_CANONICAL_PROMOTION_FORBIDDEN');
  fail(input?.reconstruction_candidate === undefined, 'RSR_REPRESENTATION_RECONSTRUCTION_IR_FORBIDDEN');
  fail(input?.promote_to_canonical === undefined, 'RSR_REPRESENTATION_CANONICAL_PROMOTION_FORBIDDEN');
  const reference = input.reference;
  validateObservationReference(reference);
  const observationKind = input.observation?.kind ?? 'ingress';
  fail(allowedObservationKinds.has(observationKind), 'RSR_REPRESENTATION_OBSERVATION_KIND_INVALID');
  const base = {
    format: RSR_REPRESENTATION_OBSERVATION_CANDIDATE_FORMAT,
    version: '0.1.0' as const,
    representation_candidate: {
      provider_id: reference.provider_id,
      provider_root: reference.provider_root,
      representation_root: reference.representation_root,
      representation_kind: reference.representation_kind,
      content_root: reference.content_root,
      availability: reference.availability
    },
    observation: { kind: observationKind, data: record(input.observation?.data) },
    reconstruction_candidate: null,
    canonical_state_proposal: null,
    authority: {
      provider_can_write_authoritative_world_state: false as const,
      rsr_can_promote_without_independent_evidence: false as const,
      rncs_authority_required: true as const
    },
    candidate_only: true as const,
    authoritative: false as const,
    commit_status: 'NOT_COMMITTED' as const
  };
  return { ...base, observation_root: semanticHash(base) };
}

export function verifyRepresentationObservationCandidate(candidate: RSRRepresentationObservationCandidate): boolean {
  try {
    fail(candidate?.format === RSR_REPRESENTATION_OBSERVATION_CANDIDATE_FORMAT, 'RSR_REPRESENTATION_OBSERVATION_FORMAT_INVALID');
    fail(candidate.version === '0.1.0', 'RSR_REPRESENTATION_OBSERVATION_VERSION_INVALID');
    fail(root(candidate.representation_candidate?.representation_root), 'RSR_REPRESENTATION_ROOT_INVALID');
    fail(allowedObservationKinds.has(candidate.observation?.kind), 'RSR_REPRESENTATION_OBSERVATION_KIND_INVALID');
    fail(candidate.reconstruction_candidate === null, 'RSR_REPRESENTATION_RECONSTRUCTION_IR_FORBIDDEN');
    fail(candidate.canonical_state_proposal === null, 'RSR_REPRESENTATION_CANONICAL_PROMOTION_FORBIDDEN');
    fail(candidate.candidate_only === true && candidate.authoritative === false, 'RSR_REPRESENTATION_AUTHORITY_BOUNDARY_INVALID');
    fail(candidate.commit_status === 'NOT_COMMITTED', 'RSR_REPRESENTATION_COMMIT_STATUS_INVALID');
    fail(candidate.authority?.provider_can_write_authoritative_world_state === false, 'RSR_REPRESENTATION_PROVIDER_AUTHORITY_ESCALATION');
    fail(candidate.authority?.rsr_can_promote_without_independent_evidence === false, 'RSR_REPRESENTATION_RSR_PROMOTION_FORBIDDEN');
    fail(candidate.authority?.rncs_authority_required === true, 'RSR_REPRESENTATION_RNCS_AUTHORITY_REQUIRED');
    const { observation_root: _observationRoot, ...base } = candidate;
    return semanticHash(base) === candidate.observation_root;
  } catch {
    return false;
  }
}
