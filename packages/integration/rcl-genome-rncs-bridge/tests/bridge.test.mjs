import test from 'node:test';
import assert from 'node:assert/strict';

import { realityRoot as rclRealityRoot } from '../../../languages/reality-computation-language/src/canonical.mjs';
import { verify } from '../../../kernel/rncs-core-contract/src/index.mjs';
import {
  buildGenomeEvidenceGraph,
  createGenomeResearchProposal,
  genomeBridgeSummary,
  verifyRclGenomeObservation,
} from '../src/index.mjs';

function observation({ accessTier = 'synthetic', status = 'ASSOCIATED' } = {}) {
  const payload = {
    format: 'rcl.genome-observation.v0.1',
    version: '0.1.0',
    observationId: `synthetic:chr1:100:A:G:${accessTier}:${status}`,
    sampleRef: 'sample:synthetic-001',
    specimenRef: null,
    locus: {
      assembly: 'GRCh38',
      contig: 'chr1',
      start: 100,
      end: 100,
      coordinateSystem: '1-based-closed',
    },
    variant: {
      id: 'variant:synthetic-001',
      ref: 'A',
      alts: ['G'],
      type: 'snv',
    },
    genotype: {
      alleles: [0, 1],
      phased: false,
      ploidy: 2,
      phaseSet: null,
    },
    quality: {
      score: 50.5,
      filters: ['PASS'],
      info: { synthetic: true },
    },
    evidence: [{
      id: 'e1',
      source: 'synthetic-fixture',
      sourceType: 'test-record',
      accession: null,
      uri: null,
      recordRef: 'synthetic-record-1',
      provenanceClass: 'repository-test',
      confidence: 0.95,
    }],
    claims: [{
      id: 'c1',
      subject: 'variant',
      predicate: 'trait_relation',
      object: 'synthetic-trait',
      status,
      confidence: 0.6,
      evidenceRefs: ['e1'],
    }],
    governance: {
      accessTier,
      consentBasis: 'not-applicable-test-fixture',
      subjectRisk: 'genomic-identifiability',
      authorityRequired: accessTier === 'controlled' ? ['dataset:controlled-demo'] : [],
    },
    foundation: {
      domains: ['genetic', 'quantitative', 'knowledge', 'scientific'],
      crossDomainAxes: ['causality-evidence', 'authority-boundary'],
    },
  };
  return { ...payload, observationRoot: rclRealityRoot(payload) };
}

test('bridge verifies RCL Genome IR roots with RCL canonical semantics', () => {
  const obs = observation();
  assert.deepEqual(verifyRclGenomeObservation(obs), { valid: true, errors: [] });
  const forged = { ...obs, observationRoot: '0'.repeat(64) };
  assert.equal(verifyRclGenomeObservation(forged).valid, false);
});

test('evidence graph preserves association status and converts floats to RNCS-hashable strings', () => {
  const graph = buildGenomeEvidenceGraph([observation()]);
  const claim = graph.evidence.nodes.find(node => node.kind === 'genome-claim');
  const source = graph.evidence.nodes.find(node => node.kind === 'genome-source-evidence');
  assert.equal(claim.status, 'ASSOCIATED');
  assert.equal(claim.confidence, '0.6');
  assert.equal(source.confidence, '0.95');
  assert.equal(graph.evidence.edges.some(edge => edge.kind === 'supports-claim'), true);
});

test('synthetic Genome IR compiles into a valid proposal that remains uncommitted', () => {
  const proposal = createGenomeResearchProposal([observation()]);
  assert.equal(verify(proposal).valid, true);
  assert.equal(proposal.phase, 'proposed');
  assert.equal(proposal.authority.status, 'pending');
  assert.equal(proposal.intent.constraints.includes('association-not-causality'), true);
  assert.equal(proposal.foundation_governance.invariants.some(item => item.name === 'association-not-causality'), true);
  assert.equal(proposal.extensions.rcl_genome.access_tiers[0], 'synthetic');
  assert.equal(proposal.evidence.nodes.some(node => node.kind === 'genome-claim' && node.status === 'ASSOCIATED'), true);
});

test('controlled Genome IR carries authority requirements into RNCS governance', () => {
  const proposal = createGenomeResearchProposal([observation({ accessTier: 'controlled' })]);
  assert.equal(verify(proposal).valid, true);
  assert.equal(proposal.intent.constraints.includes('protected-genomic-data-requires-authority'), true);
  assert.equal(proposal.extensions.rcl_genome.protected_authority_required, true);
  assert.deepEqual(proposal.capability_plan.required_scopes, ['dataset:controlled-demo']);
  assert.equal(proposal.foundation_governance.authorityRequirements[0].scope, 'dataset:controlled-demo');
});

test('bridge summary is rooted and keeps the proposal in candidate state', () => {
  const proposal = createGenomeResearchProposal([observation({ status: 'PREDICTED' })]);
  const summary = genomeBridgeSummary(proposal);
  assert.match(summary.semanticRoot, /^[a-f0-9]{64}$/);
  assert.equal(summary.phase, 'proposed');
  assert.equal(summary.authorityStatus, 'pending');
  assert.equal(summary.observationRoots.length, 1);
  assert.equal(proposal.foundation_governance.uncertainty.status, 'explicit-open-claims');
});
