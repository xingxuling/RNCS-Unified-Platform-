import { realityRoot as rclRealityRoot } from '../../../languages/reality-computation-language/src/canonical.mjs';
import { newProposal, rootHash, verify } from '../../../kernel/rncs-core-contract/src/index.mjs';

export const RCL_GENOME_RNCS_BRIDGE_FORMAT = 'rncs.rcl-genome-evidence-bridge.v0.1';
export const RCL_GENOME_RNCS_BRIDGE_VERSION = '0.1.0-alpha.1';
export const RCL_GENOME_OBSERVATION_FORMAT = 'rcl.genome-observation.v0.1';
export const RCL_GENOME_ACCESS_TIERS = Object.freeze(['public', 'controlled', 'private', 'synthetic', 'unknown']);
export const RCL_GENOME_CLAIM_STATUSES = Object.freeze(['OBSERVED', 'ASSOCIATED', 'CAUSAL', 'PREDICTED', 'CONTRADICTED', 'UNKNOWN']);

export class RclGenomeRncsBridgeError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RclGenomeRncsBridgeError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details = {}) {
  throw new RclGenomeRncsBridgeError(code, message, details);
}

function text(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail('RNCS_GENOME_TEXT_REQUIRED', `${label} must be a non-empty string`);
  return value.trim();
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('RNCS_GENOME_OBJECT_REQUIRED', `${label} must be an object`);
  return value;
}

function hexRoot(value, label) {
  const root = text(value, label);
  if (!/^[a-f0-9]{64}$/.test(root)) fail('RNCS_GENOME_ROOT_INVALID', `${label} must be a lowercase SHA-256 root`);
  return root;
}

function stringArray(value, label) {
  if (!Array.isArray(value)) fail('RNCS_GENOME_ARRAY_REQUIRED', `${label} must be an array`);
  return value.map((item, index) => text(String(item), `${label}[${index}]`));
}

function rncsHashable(value, path = 'value') {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('RNCS_GENOME_NUMBER_INVALID', `${path} must be finite`);
    return Number.isSafeInteger(value) ? value : value.toString();
  }
  if (Array.isArray(value)) return value.map((item, index) => rncsHashable(item, `${path}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rncsHashable(item, `${path}.${key}`)]));
  }
  fail('RNCS_GENOME_HASHABLE_INVALID', `${path} contains unsupported ${typeof value} data`);
}

function stableId(prefix, root, suffix = '') {
  return `${prefix}:${root.slice(0, 24)}${suffix ? `:${suffix}` : ''}`;
}

export function verifyRclGenomeObservation(observation) {
  if (!observation || typeof observation !== 'object' || Array.isArray(observation)) {
    return { valid: false, errors: ['GENOME_OBSERVATION_NOT_OBJECT'] };
  }
  const errors = [];
  try {
    if (observation.format !== RCL_GENOME_OBSERVATION_FORMAT) errors.push('GENOME_OBSERVATION_FORMAT_INVALID');
    const root = hexRoot(observation.observationRoot, 'observationRoot');
    const { observationRoot, ...payload } = observation;
    if (rclRealityRoot(payload) !== root) errors.push('GENOME_OBSERVATION_ROOT_MISMATCH');

    object(observation.locus, 'locus');
    object(observation.variant, 'variant');
    const governance = object(observation.governance, 'governance');
    const accessTier = text(governance.accessTier, 'governance.accessTier').toLowerCase();
    if (!RCL_GENOME_ACCESS_TIERS.includes(accessTier)) errors.push('GENOME_ACCESS_TIER_INVALID');

    if (!Array.isArray(observation.evidence)) errors.push('GENOME_EVIDENCE_ARRAY_REQUIRED');
    if (!Array.isArray(observation.claims)) errors.push('GENOME_CLAIMS_ARRAY_REQUIRED');
    if (Array.isArray(observation.evidence) && Array.isArray(observation.claims)) {
      const evidenceIds = new Set();
      for (const item of observation.evidence) {
        const row = object(item, 'evidence item');
        const id = text(row.id, 'evidence.id');
        if (evidenceIds.has(id)) errors.push('GENOME_EVIDENCE_ID_DUPLICATE');
        evidenceIds.add(id);
      }
      for (const item of observation.claims) {
        const claim = object(item, 'claim');
        const status = text(claim.status ?? 'UNKNOWN', 'claim.status').toUpperCase();
        if (!RCL_GENOME_CLAIM_STATUSES.includes(status)) errors.push('GENOME_CLAIM_STATUS_INVALID');
        const refs = Array.isArray(claim.evidenceRefs) ? claim.evidenceRefs.map(String) : [];
        if (refs.some(ref => !evidenceIds.has(ref))) errors.push('GENOME_CLAIM_EVIDENCE_REF_MISSING');
        if (['ASSOCIATED', 'CAUSAL', 'CONTRADICTED'].includes(status) && refs.length === 0) errors.push('GENOME_CLAIM_EVIDENCE_REQUIRED');
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? `${error.name}:${error.message}` : String(error));
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function buildGenomeEvidenceGraph(observations) {
  if (!Array.isArray(observations) || observations.length === 0) fail('RNCS_GENOME_OBSERVATIONS_REQUIRED', 'At least one Genome IR observation is required');
  const nodes = [];
  const edges = [];
  const roots = new Set();

  for (const observation of observations) {
    const check = verifyRclGenomeObservation(observation);
    if (!check.valid) fail('RNCS_GENOME_OBSERVATION_INVALID', `Invalid RCL Genome IR observation: ${check.errors.join(',')}`, { errors: check.errors });
    const root = observation.observationRoot;
    if (roots.has(root)) fail('RNCS_GENOME_OBSERVATION_DUPLICATE', `Duplicate Genome IR observation root: ${root}`);
    roots.add(root);

    const locus = observation.locus;
    const governance = observation.governance;
    const observationNodeId = stableId('genome-observation', root);
    nodes.push(rncsHashable({
      evidence_id: observationNodeId,
      kind: 'rcl-genome-observation',
      source: root,
      observation_root: root,
      observation_id: observation.observationId,
      sample_ref: observation.sampleRef,
      assembly: locus.assembly,
      contig: locus.contig,
      start: locus.start,
      end: locus.end,
      variant_type: observation.variant.type,
      access_tier: governance.accessTier,
      subject_risk: governance.subjectRisk,
    }, 'observation-node'));

    for (let index = 0; index < observation.evidence.length; index += 1) {
      const source = observation.evidence[index];
      const sourceNodeId = stableId('genome-source', root, String(index + 1));
      nodes.push(rncsHashable({
        evidence_id: sourceNodeId,
        kind: 'genome-source-evidence',
        source: source.source,
        source_type: source.sourceType,
        accession: source.accession,
        record_ref: source.recordRef,
        provenance_class: source.provenanceClass,
        confidence: source.confidence,
        rcl_evidence_id: source.id,
        observation_root: root,
      }, `source-node[${index}]`));
      edges.push({ from: sourceNodeId, to: observationNodeId, kind: 'supports-observation' });
    }

    for (let index = 0; index < observation.claims.length; index += 1) {
      const claim = observation.claims[index];
      const claimNodeId = stableId('genome-claim', root, String(index + 1));
      nodes.push(rncsHashable({
        evidence_id: claimNodeId,
        kind: 'genome-claim',
        source: root,
        rcl_claim_id: claim.id,
        subject: claim.subject,
        predicate: claim.predicate,
        object: claim.object,
        status: claim.status,
        confidence: claim.confidence,
        observation_root: root,
      }, `claim-node[${index}]`));
      edges.push({ from: observationNodeId, to: claimNodeId, kind: 'contains-claim' });
      for (const evidenceRef of claim.evidenceRefs ?? []) {
        const evidenceIndex = observation.evidence.findIndex(item => item.id === evidenceRef);
        if (evidenceIndex >= 0) {
          edges.push({
            from: stableId('genome-source', root, String(evidenceIndex + 1)),
            to: claimNodeId,
            kind: claim.status === 'CONTRADICTED' ? 'contradicts-claim' : 'supports-claim',
          });
        }
      }
    }
  }

  return Object.freeze({
    format: RCL_GENOME_RNCS_BRIDGE_FORMAT,
    version: RCL_GENOME_RNCS_BRIDGE_VERSION,
    observationRoots: Object.freeze([...roots]),
    evidence: Object.freeze({ nodes: Object.freeze(nodes), edges: Object.freeze(edges) }),
  });
}

export function createGenomeResearchProposal(observations, options = {}) {
  const graph = buildGenomeEvidenceGraph(observations);
  const accessTiers = [...new Set(observations.map(item => String(item.governance.accessTier).toLowerCase()))].sort();
  const assemblies = [...new Set(observations.map(item => String(item.locus.assembly)))].sort();
  const authorityRequirements = [...new Set(observations.flatMap(item => item.governance.authorityRequired ?? []).map(String))].sort();
  const claimStatuses = [...new Set(observations.flatMap(item => item.claims.map(claim => String(claim.status))))].sort();
  const requiresProtectedAuthority = accessTiers.some(tier => tier === 'controlled' || tier === 'private' || tier === 'unknown');

  const proposal = newProposal({
    transition_id: options.transitionId,
    reality_id: options.realityId ?? 'reality:genomics-research-evidence',
    base_generation: Number(options.baseGeneration ?? 0),
    base_generation_root: options.baseGenerationRoot ?? '0'.repeat(64),
    subject: {
      subject_id: options.subjectId ?? 'rcl-genome-research-bridge',
      kind: options.subjectKind ?? 'research-system',
      roles: options.roles ?? ['genomics-evidence-compiler'],
      responsibility_boundary: 'candidate-research-evidence-only',
    },
    intent: {
      source: 'rcl.genome-observation',
      goals: [{
        action: 'register-candidate-genomic-evidence',
        observation_roots: graph.observationRoots,
        claim_statuses: claimStatuses,
      }],
      constraints: [
        'association-not-causality',
        'source-provenance-bound',
        'genomic-access-tier-preserved',
        ...(requiresProtectedAuthority ? ['protected-genomic-data-requires-authority'] : []),
      ],
    },
    capability_plan: {
      capabilities: ['genomics.evidence.register'],
      host_bindings: [],
      required_scopes: authorityRequirements,
    },
    inputs: graph.observationRoots.map((root, index) => ({
      kind: 'rcl-genome-observation',
      root,
      sample_ref: String(observations[index].sampleRef),
      access_tier: String(observations[index].governance.accessTier),
    })),
    provisional_delta: {
      operations: graph.observationRoots.map((root, index) => ({
        op: 'register-candidate-evidence',
        path: `genomics.observations.${index}`,
        observation_root: root,
        access_tier: String(observations[index].governance.accessTier),
      })),
    },
    causal_basis: {
      events: [{ kind: 'evidence-import', source: 'rcl-genome-ir', count: graph.observationRoots.length }],
      rules: [{
        language: 'RCL',
        contract: RCL_GENOME_OBSERVATION_FORMAT,
        boundary: 'association-not-causality',
      }],
      simulation_refs: graph.observationRoots,
    },
    evidence: graph.evidence,
    foundation_governance: {
      explicitVariables: [
        { name: 'genomics.reference_assemblies', value: assemblies.join(',') },
        { name: 'genomics.access_tiers', value: accessTiers.join(',') },
        { name: 'genomics.observation_count', value: graph.observationRoots.length },
      ],
      uncertainty: {
        status: claimStatuses.includes('UNKNOWN') || claimStatuses.includes('PREDICTED') ? 'explicit-open-claims' : 'claim-status-bounded',
        variables: claimStatuses.map(status => ({ status })),
      },
      providerCapabilities: {
        required: [{ provider: 'rcl-genome-ir', capability: 'rooted-genomic-observation', status: 'verified-input' }],
        externalSideEffects: false,
      },
      authorityRequirements: authorityRequirements.map(scope => ({ action: 'use-genomic-evidence', scope, riskLevel: 'high' })),
      irreversibleEffects: [{ effect: 'none', reversible: true, status: 'proposal-only' }],
      invariants: [
        { name: 'rcl-observation-root-verified', expected: true },
        { name: 'association-not-causality', expected: true },
        { name: 'source-provenance-bound', expected: true },
        { name: 'genomic-access-tier-preserved', expected: true },
      ],
      adaptiveInvariantField: {
        version: '0.1.0',
        mode: 'genomic-evidence-gate',
        active: ['evidence', 'uncertainty', 'authority', 'causality-boundary'],
      },
      causalParents: graph.observationRoots.map(root => ({ root, relation: 'evidence-input' })),
      evidenceRequirements: graph.observationRoots.map(root => ({ kind: 'rcl-genome-observation', root, required: true })),
    },
    extensions: {
      rcl_genome: {
        bridge_format: graph.format,
        bridge_version: graph.version,
        observation_roots: graph.observationRoots,
        reference_assemblies: assemblies,
        access_tiers: accessTiers,
        protected_authority_required: requiresProtectedAuthority,
      },
    },
  });

  const check = verify(proposal);
  if (!check.valid) fail('RNCS_GENOME_PROPOSAL_INVALID', `RNCS rejected genome proposal: ${check.errors.join(',')}`, { errors: check.errors });
  return proposal;
}

export function genomeBridgeSummary(proposal) {
  const check = verify(proposal);
  if (!check.valid) fail('RNCS_GENOME_PROPOSAL_INVALID', `Cannot summarize invalid proposal: ${check.errors.join(',')}`);
  return Object.freeze({
    format: RCL_GENOME_RNCS_BRIDGE_FORMAT,
    proposalRoot: proposal.proposal_root,
    envelopeRoot: proposal.envelope_root,
    observationRoots: Object.freeze([...(proposal.extensions?.rcl_genome?.observation_roots ?? [])]),
    evidenceRoot: proposal.evidence.evidence_root,
    accessTiers: Object.freeze([...(proposal.extensions?.rcl_genome?.access_tiers ?? [])]),
    authorityStatus: proposal.authority.status,
    phase: proposal.phase,
    semanticRoot: rootHash({
      proposal_root: proposal.proposal_root,
      evidence_root: proposal.evidence.evidence_root,
      observation_roots: proposal.extensions?.rcl_genome?.observation_roots ?? [],
    }),
  });
}
