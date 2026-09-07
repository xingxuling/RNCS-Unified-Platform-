import test from 'node:test';
import assert from 'node:assert/strict';
import { realityRoot as rclRealityRoot } from '../../../languages/reality-computation-language/src/canonical.mjs';
import {
  buildGenomeKnowledgeEvidenceGraph,
  createGenomeKnowledgeResearchProposal,
  genomeKnowledgeBridgeSummary,
  verifyRclGenomeKnowledgeGraph,
} from '../src/knowledge-graph.mjs';
import { verify } from '../../../kernel/rncs-core-contract/src/index.mjs';

function graph({ accessTier = 'public', authorityRequired = [], causal = false } = {}) {
  const evidence = [{
    id: 'evidence:e1',
    source: 'fixture-source',
    sourceType: causal ? 'experimental' : 'association',
    recordRef: 'fixture-record',
    accession: null,
    provenanceClass: 'declared',
    confidence: 0.88,
    payloadRoot: null,
    metadata: {},
  }];
  const entities = [
    { id: 'variant:v1', kind: 'variant', label: 'v1', referenceAssembly: 'GRCh38', identifiers: {}, attributes: {}, sourceRefs: ['fixture'] },
    { id: 'phenotype:p1', kind: 'phenotype', label: 'p1', referenceAssembly: null, identifiers: {}, attributes: {}, sourceRefs: ['fixture'] },
  ];
  const relation = causal
    ? {
        id: 'relation:r1', from: 'variant:v1', to: 'phenotype:p1', kind: 'causes', status: 'CAUSAL', confidence: 0.8,
        evidenceRefs: ['evidence:e1'], causalBasis: [{ method: 'fixture-intervention' }], context: {},
      }
    : {
        id: 'relation:r1', from: 'variant:v1', to: 'phenotype:p1', kind: 'associated-with', status: 'ASSOCIATED', confidence: 0.7,
        evidenceRefs: ['evidence:e1'], causalBasis: [], context: {},
      };
  const payload = {
    format: 'rcl.genome-knowledge-graph.v0.1',
    version: '0.1.0',
    graphId: 'fixture:graph',
    referenceAssemblies: ['GRCh38'],
    entities,
    relations: [relation],
    evidence,
    sourceObservationRoots: ['a'.repeat(64)],
    governance: {
      accessTiers: [accessTier],
      authorityRequired,
      candidateOnly: true,
      associationNotCausality: true,
    },
  };
  return { ...payload, graphRoot: rclRealityRoot(payload) };
}

test('RNCS verifies RCL Genome Knowledge Graph root and association boundary', () => {
  const value = graph();
  assert.equal(verifyRclGenomeKnowledgeGraph(value).valid, true);
  const compiled = buildGenomeKnowledgeEvidenceGraph(value);
  assert.equal(compiled.semanticSummary.entityCount, 2);
  assert.equal(compiled.semanticSummary.relationCount, 1);
  assert.equal(compiled.semanticSummary.associationRelationCount, 1);
  assert.equal(compiled.semanticSummary.causalRelationCount, 0);
});

test('RNCS Genome Knowledge proposal remains proposed and does not self-authorize or commit', () => {
  const proposal = createGenomeKnowledgeResearchProposal(graph());
  const check = verify(proposal);
  assert.equal(check.valid, true);
  assert.equal(proposal.phase, 'proposed');
  assert.equal(proposal.authority.status, 'pending');
  assert.equal(proposal.commit.status, 'not_committed');
  assert.equal(proposal.extensions.rcl_genome_knowledge.automatic_authorization, false);
  assert.equal(proposal.extensions.rcl_genome_knowledge.automatic_commit, false);
  const summary = genomeKnowledgeBridgeSummary(proposal);
  assert.equal(summary.graphRoot, graph().graphRoot);
});

test('RNCS preserves an explicit causal relation only when causal basis is present', () => {
  const proposal = createGenomeKnowledgeResearchProposal(graph({ causal: true }));
  assert.equal(verify(proposal).valid, true);
  assert.equal(proposal.extensions.rcl_genome_knowledge.semantic_summary.causalRelationCount, 1);
});

test('RNCS rejects protected Genome Knowledge Graph without declared authority scopes', () => {
  assert.throws(
    () => createGenomeKnowledgeResearchProposal(graph({ accessTier: 'private' })),
    /requires explicit authority scopes/,
  );
  const proposal = createGenomeKnowledgeResearchProposal(graph({
    accessTier: 'private',
    authorityRequired: ['subject.genome.read'],
  }));
  assert.equal(verify(proposal).valid, true);
  assert.deepEqual(proposal.capability_plan.required_scopes, ['subject.genome.read']);
});

test('RNCS rejects forged graph roots and association-causality violations', () => {
  const forged = { ...graph(), graphRoot: '0'.repeat(64) };
  assert.equal(verifyRclGenomeKnowledgeGraph(forged).valid, false);

  const invalid = graph();
  invalid.relations = [{ ...invalid.relations[0], status: 'CAUSAL' }];
  const { graphRoot: ignored, ...payload } = invalid;
  invalid.graphRoot = rclRealityRoot(payload);
  const check = verifyRclGenomeKnowledgeGraph(invalid);
  assert.equal(check.valid, false);
  assert.ok(check.errors.includes('GENOME_GRAPH_ASSOCIATION_CAUSALITY_VIOLATION'));
});
