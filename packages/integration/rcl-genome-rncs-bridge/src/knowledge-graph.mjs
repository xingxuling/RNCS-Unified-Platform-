import { realityRoot as rclRealityRoot } from '../../../languages/reality-computation-language/src/canonical.mjs';
import { newProposal, rootHash, verify } from '../../../kernel/rncs-core-contract/src/index.mjs';

export const RCL_GENOME_KNOWLEDGE_GRAPH_FORMAT = 'rcl.genome-knowledge-graph.v0.1';
export const RNCS_GENOME_KNOWLEDGE_GRAPH_BRIDGE_FORMAT = 'rncs.rcl-genome-knowledge-graph-bridge.v0.1';
export const RNCS_GENOME_KNOWLEDGE_GRAPH_BRIDGE_VERSION = '0.1.0-alpha.1';

const ASSOCIATION_KIND = 'associated-with';
const CAUSAL_KIND = 'causes';

export class RclGenomeKnowledgeGraphBridgeError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RclGenomeKnowledgeGraphBridgeError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details = {}) {
  throw new RclGenomeKnowledgeGraphBridgeError(code, message, details);
}

function text(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail('RNCS_GENOME_GRAPH_TEXT_REQUIRED', `${label} must be a non-empty string`);
  return value.trim();
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('RNCS_GENOME_GRAPH_OBJECT_REQUIRED', `${label} must be an object`);
  return value;
}

function stringArray(value, label) {
  if (!Array.isArray(value)) fail('RNCS_GENOME_GRAPH_ARRAY_REQUIRED', `${label} must be an array`);
  return value.map((item, index) => text(String(item), `${label}[${index}]`));
}

function rncsHashable(value, path = 'value') {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('RNCS_GENOME_GRAPH_NUMBER_INVALID', `${path} must be finite`);
    return Number.isSafeInteger(value) ? value : value.toString();
  }
  if (Array.isArray(value)) return value.map((item, index) => rncsHashable(item, `${path}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rncsHashable(item, `${path}.${key}`)]));
  }
  fail('RNCS_GENOME_GRAPH_HASHABLE_INVALID', `${path} contains unsupported ${typeof value} data`);
}

function stableId(prefix, root, suffix = '') {
  return `${prefix}:${root.slice(0, 20)}${suffix ? `:${suffix}` : ''}`;
}

export function verifyRclGenomeKnowledgeGraph(graph) {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) return { valid: false, errors: ['GENOME_GRAPH_NOT_OBJECT'] };
  const errors = [];
  try {
    if (graph.format !== RCL_GENOME_KNOWLEDGE_GRAPH_FORMAT) errors.push('GENOME_GRAPH_FORMAT_INVALID');
    const graphRoot = text(graph.graphRoot, 'graphRoot');
    if (!/^[a-f0-9]{64}$/.test(graphRoot)) errors.push('GENOME_GRAPH_ROOT_INVALID');
    const { graphRoot: ignored, ...payload } = graph;
    if (rclRealityRoot(payload) !== graphRoot) errors.push('GENOME_GRAPH_ROOT_MISMATCH');

    if (!Array.isArray(graph.entities)) errors.push('GENOME_GRAPH_ENTITIES_ARRAY_REQUIRED');
    if (!Array.isArray(graph.relations)) errors.push('GENOME_GRAPH_RELATIONS_ARRAY_REQUIRED');
    if (!Array.isArray(graph.evidence)) errors.push('GENOME_GRAPH_EVIDENCE_ARRAY_REQUIRED');

    const entityIds = new Set();
    for (const entity of graph.entities ?? []) {
      const row = object(entity, 'genome entity');
      const id = text(row.id, 'genome entity id');
      if (entityIds.has(id)) errors.push('GENOME_GRAPH_ENTITY_ID_DUPLICATE');
      entityIds.add(id);
    }
    const evidenceIds = new Set();
    for (const evidence of graph.evidence ?? []) {
      const row = object(evidence, 'genome evidence');
      const id = text(row.id, 'genome evidence id');
      if (evidenceIds.has(id)) errors.push('GENOME_GRAPH_EVIDENCE_ID_DUPLICATE');
      evidenceIds.add(id);
    }
    const relationIds = new Set();
    for (const relation of graph.relations ?? []) {
      const row = object(relation, 'genome relation');
      const id = text(row.id, 'genome relation id');
      if (relationIds.has(id)) errors.push('GENOME_GRAPH_RELATION_ID_DUPLICATE');
      relationIds.add(id);
      if (!entityIds.has(String(row.from))) errors.push('GENOME_GRAPH_RELATION_FROM_MISSING');
      if (!entityIds.has(String(row.to))) errors.push('GENOME_GRAPH_RELATION_TO_MISSING');
      const refs = Array.isArray(row.evidenceRefs) ? row.evidenceRefs.map(String) : [];
      if (refs.some(ref => !evidenceIds.has(ref))) errors.push('GENOME_GRAPH_RELATION_EVIDENCE_MISSING');
      const status = String(row.status ?? 'UNKNOWN').toUpperCase();
      const kind = String(row.kind ?? '');
      if (kind === ASSOCIATION_KIND && status === 'CAUSAL') errors.push('GENOME_GRAPH_ASSOCIATION_CAUSALITY_VIOLATION');
      if (status === 'CAUSAL' && (kind !== CAUSAL_KIND || refs.length === 0 || !Array.isArray(row.causalBasis) || row.causalBasis.length === 0)) {
        errors.push('GENOME_GRAPH_CAUSAL_BASIS_REQUIRED');
      }
    }
    if (graph.governance?.associationNotCausality !== true) errors.push('GENOME_GRAPH_ASSOCIATION_BOUNDARY_REQUIRED');
  } catch (error) {
    errors.push(error instanceof Error ? `${error.name}:${error.message}` : String(error));
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function buildGenomeKnowledgeEvidenceGraph(graph) {
  const check = verifyRclGenomeKnowledgeGraph(graph);
  if (!check.valid) fail('RNCS_GENOME_GRAPH_INVALID', `Invalid RCL Genome Knowledge Graph: ${check.errors.join(',')}`, { errors: check.errors });
  const root = graph.graphRoot;
  const nodes = [];
  const edges = [];
  const entityNodeById = new Map();
  const evidenceNodeById = new Map();

  for (let index = 0; index < graph.entities.length; index += 1) {
    const entity = graph.entities[index];
    const nodeId = stableId('genome-entity', root, String(index + 1));
    entityNodeById.set(entity.id, nodeId);
    nodes.push(rncsHashable({
      evidence_id: nodeId,
      kind: `genome-entity:${entity.kind}`,
      source: root,
      graph_root: root,
      entity_id: entity.id,
      label: entity.label,
      reference_assembly: entity.referenceAssembly,
      identifiers: entity.identifiers,
      attributes: entity.attributes,
      source_refs: entity.sourceRefs,
    }, `entity[${index}]`));
  }

  for (let index = 0; index < graph.evidence.length; index += 1) {
    const evidence = graph.evidence[index];
    const nodeId = stableId('genome-evidence', root, String(index + 1));
    evidenceNodeById.set(evidence.id, nodeId);
    nodes.push(rncsHashable({
      evidence_id: nodeId,
      kind: 'genome-source-evidence',
      source: evidence.source,
      graph_root: root,
      rcl_evidence_id: evidence.id,
      source_type: evidence.sourceType,
      record_ref: evidence.recordRef,
      accession: evidence.accession,
      provenance_class: evidence.provenanceClass,
      confidence: evidence.confidence,
      payload_root: evidence.payloadRoot,
      metadata: evidence.metadata,
    }, `evidence[${index}]`));
  }

  for (let index = 0; index < graph.relations.length; index += 1) {
    const relation = graph.relations[index];
    const relationNodeId = stableId('genome-relation', root, String(index + 1));
    nodes.push(rncsHashable({
      evidence_id: relationNodeId,
      kind: `genome-relation:${relation.kind}`,
      source: root,
      graph_root: root,
      rcl_relation_id: relation.id,
      from_entity: relation.from,
      to_entity: relation.to,
      relation_kind: relation.kind,
      status: relation.status,
      confidence: relation.confidence,
      causal_basis: relation.causalBasis,
      context: relation.context,
    }, `relation[${index}]`));
    edges.push({ from: entityNodeById.get(relation.from), to: relationNodeId, kind: 'relation-from' });
    edges.push({ from: relationNodeId, to: entityNodeById.get(relation.to), kind: 'relation-to' });
    for (const evidenceRef of relation.evidenceRefs) {
      edges.push({
        from: evidenceNodeById.get(evidenceRef),
        to: relationNodeId,
        kind: relation.status === 'CONTRADICTED' ? 'contradicts-relation' : 'supports-relation',
      });
    }
  }

  return Object.freeze({
    format: RNCS_GENOME_KNOWLEDGE_GRAPH_BRIDGE_FORMAT,
    version: RNCS_GENOME_KNOWLEDGE_GRAPH_BRIDGE_VERSION,
    graphRoot: root,
    graphId: graph.graphId,
    evidence: Object.freeze({ nodes: Object.freeze(nodes), edges: Object.freeze(edges) }),
    semanticSummary: Object.freeze({
      entityCount: graph.entities.length,
      relationCount: graph.relations.length,
      evidenceCount: graph.evidence.length,
      referenceAssemblies: Object.freeze([...graph.referenceAssemblies]),
      accessTiers: Object.freeze([...(graph.governance?.accessTiers ?? [])]),
      causalRelationCount: graph.relations.filter(item => item.kind === CAUSAL_KIND && item.status === 'CAUSAL').length,
      associationRelationCount: graph.relations.filter(item => item.kind === ASSOCIATION_KIND).length,
    }),
  });
}

export function createGenomeKnowledgeResearchProposal(graph, options = {}) {
  const compiled = buildGenomeKnowledgeEvidenceGraph(graph);
  const governance = graph.governance ?? {};
  const accessTiers = stringArray(governance.accessTiers ?? ['unknown'], 'governance.accessTiers');
  const authorityScopes = stringArray(governance.authorityRequired ?? [], 'governance.authorityRequired');
  const protectedData = accessTiers.some(tier => ['controlled', 'private', 'unknown'].includes(tier));
  if (protectedData && authorityScopes.length === 0) {
    fail('RNCS_GENOME_GRAPH_AUTHORITY_REQUIRED', 'Protected Genome Knowledge Graph requires explicit authority scopes before proposal creation', { accessTiers });
  }

  const proposal = newProposal({
    transition_id: options.transitionId,
    reality_id: options.realityId ?? 'reality:genomics-knowledge-evidence',
    base_generation: Number(options.baseGeneration ?? 0),
    base_generation_root: options.baseGenerationRoot ?? '0'.repeat(64),
    subject: {
      subject_id: options.subjectId ?? 'rcl-genome-knowledge-bridge',
      kind: options.subjectKind ?? 'research-system',
      roles: options.roles ?? ['genome-knowledge-evidence-compiler'],
      responsibility_boundary: 'candidate-evidence-registration-only',
    },
    intent: {
      source: RCL_GENOME_KNOWLEDGE_GRAPH_FORMAT,
      goals: [{
        action: 'register-candidate-genome-knowledge-graph',
        graph_root: compiled.graphRoot,
        entity_count: compiled.semanticSummary.entityCount,
        relation_count: compiled.semanticSummary.relationCount,
      }],
      constraints: [
        'association-not-causality',
        'causal-edge-requires-explicit-basis',
        'source-provenance-bound',
        'genomic-access-tier-preserved',
        ...(protectedData ? ['protected-genomic-data-requires-authority'] : []),
      ],
    },
    capability_plan: {
      capabilities: ['genomics.knowledge-graph.register'],
      host_bindings: [],
      required_scopes: authorityScopes,
    },
    inputs: [{
      kind: 'rcl-genome-knowledge-graph',
      root: compiled.graphRoot,
      graph_id: compiled.graphId,
      access_tiers: accessTiers,
    }],
    provisional_delta: {
      operations: [{
        op: 'register-candidate-evidence-graph',
        path: 'genomics.knowledge_graph',
        graph_root: compiled.graphRoot,
        entity_count: compiled.semanticSummary.entityCount,
        relation_count: compiled.semanticSummary.relationCount,
      }],
    },
    causal_basis: {
      events: [{ kind: 'evidence-graph-import', source: RCL_GENOME_KNOWLEDGE_GRAPH_FORMAT }],
      rules: [{
        language: 'RCL',
        contract: RCL_GENOME_KNOWLEDGE_GRAPH_FORMAT,
        association_boundary: 'association-not-causality',
        causal_boundary: 'explicit-causes-edge-with-causal-basis',
      }],
      simulation_refs: [compiled.graphRoot],
    },
    evidence: compiled.evidence,
    foundation_governance: {
      explicitVariables: [
        { name: 'genomics.graph_root', value: compiled.graphRoot },
        { name: 'genomics.entity_count', value: compiled.semanticSummary.entityCount },
        { name: 'genomics.relation_count', value: compiled.semanticSummary.relationCount },
        { name: 'genomics.causal_relation_count', value: compiled.semanticSummary.causalRelationCount },
        { name: 'genomics.association_relation_count', value: compiled.semanticSummary.associationRelationCount },
      ],
      uncertainty: {
        status: graph.relations.some(item => ['PREDICTED', 'UNKNOWN'].includes(item.status)) ? 'explicit-open-relations' : 'relation-status-bounded',
        variables: graph.relations.filter(item => ['PREDICTED', 'UNKNOWN'].includes(item.status)).map(item => ({ relation: item.id, status: item.status })),
      },
      providerCapabilities: {
        required: [{ provider: 'rcl-genome-knowledge-graph', capability: 'rooted-genome-knowledge-graph', status: 'verified-input' }],
        externalSideEffects: false,
      },
      authorityRequirements: authorityScopes.map(scope => ({ action: 'use-genome-knowledge-evidence', scope, riskLevel: 'high' })),
      irreversibleEffects: [{ effect: 'none', reversible: true, status: 'proposal-only' }],
      invariants: [
        { name: 'rcl-graph-root-verified', expected: true },
        { name: 'association-not-causality', expected: true },
        { name: 'causal-edge-requires-explicit-basis', expected: true },
        { name: 'source-provenance-bound', expected: true },
        { name: 'genomic-access-tier-preserved', expected: true },
      ],
      adaptiveInvariantField: {
        version: '0.1.0',
        mode: 'genome-knowledge-evidence-gate',
        active: ['evidence', 'causality', 'uncertainty', 'authority'],
      },
      causalParents: [{ root: compiled.graphRoot, relation: 'evidence-input' }],
      evidenceRequirements: [{ kind: 'rcl-genome-knowledge-graph', root: compiled.graphRoot, required: true }],
    },
    extensions: {
      rcl_genome_knowledge: {
        bridge_format: RNCS_GENOME_KNOWLEDGE_GRAPH_BRIDGE_FORMAT,
        bridge_version: RNCS_GENOME_KNOWLEDGE_GRAPH_BRIDGE_VERSION,
        graph_root: compiled.graphRoot,
        graph_id: compiled.graphId,
        semantic_summary: rncsHashable(compiled.semanticSummary),
        candidate_only: true,
        automatic_authorization: false,
        automatic_commit: false,
      },
    },
  });

  const check = verify(proposal);
  if (!check.valid) fail('RNCS_GENOME_GRAPH_PROPOSAL_INVALID', `RNCS rejected Genome Knowledge Graph proposal: ${check.errors.join(',')}`, { errors: check.errors });
  return proposal;
}

export function genomeKnowledgeBridgeSummary(proposal) {
  const check = verify(proposal);
  if (!check.valid) fail('RNCS_GENOME_GRAPH_PROPOSAL_INVALID', `Cannot summarize invalid proposal: ${check.errors.join(',')}`);
  const extension = proposal.extensions?.rcl_genome_knowledge ?? {};
  return Object.freeze({
    format: RNCS_GENOME_KNOWLEDGE_GRAPH_BRIDGE_FORMAT,
    proposalRoot: proposal.proposal_root,
    envelopeRoot: proposal.envelope_root,
    evidenceRoot: proposal.evidence.evidence_root,
    graphRoot: extension.graph_root ?? null,
    graphId: extension.graph_id ?? null,
    semanticSummary: extension.semantic_summary ?? null,
    phase: proposal.phase,
    authorityStatus: proposal.authority.status,
    semanticRoot: rootHash({
      proposal_root: proposal.proposal_root,
      evidence_root: proposal.evidence.evidence_root,
      graph_root: extension.graph_root ?? null,
    }),
  });
}
