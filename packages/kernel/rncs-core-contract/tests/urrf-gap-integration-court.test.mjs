import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  createURRFIntegrationCourtVerdict,
  createURRFGAPLedger,
  createURRFV03CoverageMatrix,
  verifyURRFIntegrationCourtVerdict,
  verifyURRFGAPLedger
} from '../src/index.mjs';

const entryInput = (gap_id, gap_type, task_refs, extra = {}) => ({
  gap_id,
  task_refs,
  gap_type,
  provider_id: extra.provider_id,
  missing_capability: extra.missing_capability ?? `missing ${gap_id}`,
  workaround: {
    owner_layer: extra.owner_layer ?? 'URRF candidate seam',
    language: 'JavaScript runtime',
    description: 'Candidate lowering is explicit and cannot promote RCL/RNCS truth.'
  },
  donor: {
    donor_id: extra.donor_id ?? `donor:${gap_id}`,
    owner_layer: extra.donor_layer ?? 'RAGF',
    advantage: 'Existing bounded contract and evidence path is reusable.',
    source_refs: ['packages/world/reality-asset-genesis-fabric/src/external-asset-providers.mjs'],
    evidence_refs: ['docs/verification/URRF_UNIVERSAL_ART_ASSET_FORGE/RCL_GAP_STRESS_EVIDENCE.md']
  },
  generality: extra.generality ?? 'CROSS_PROJECT',
  candidate_absorption: {
    status: gap_type === 'PROVIDER_GAP' ? 'NOT_APPLICABLE' : 'PENDING',
    primitive_candidates: gap_type === 'PROVIDER_GAP' ? [] : [`candidate primitive for ${gap_id}`],
    regression_cases: [`negative case for ${gap_id}`]
  },
  affected_k400_cells: task_refs.map(task => `K400:${task}:EVIDENCE`),
  evidence_refs: ['docs/verification/URRF_V03_COVERAGE_MATRIX/urrf-v03-coverage-matrix.json']
});

function gapLedger() {
  return createURRFGAPLedger({
    entries: [
      entryInput('gap:rcl-art-profile', 'RCL_GAP', ['URRF-25']),
      entryInput('gap:provider-transport', 'PROVIDER_GAP', ['URRF-11', 'URRF-12', 'URRF-13', 'URRF-14', 'URRF-15'], {provider_id: 'provider:physical-transport'}),
      entryInput('gap:provider-sensor', 'PROVIDER_GAP', ['URRF-24'], {provider_id: 'provider:physical-sensor', generality: 'HOST_LOCAL'}),
      entryInput('gap:mixed-aaa', 'MIXED', ['URRF-26'], {provider_id: 'provider:external-aaa'})
    ]
  });
}

test('URRF gap ledger classifies RCL, Provider and mixed gaps without authority escalation', () => {
  const ledger = gapLedger();
  assert.equal(verifyURRFGAPLedger(ledger).valid, true);
  assert.deepEqual(ledger.entries.map(entry => entry.gap_type), ['MIXED', 'PROVIDER_GAP', 'PROVIDER_GAP', 'RCL_GAP']);
  const schema = JSON.parse(fs.readFileSync(new URL('../schemas/urrf-gap-ledger.v0.1.schema.json', import.meta.url), 'utf8'));
  const validate = new Ajv2020({strict: false, allErrors: true}).compile(schema);
  assert.equal(validate(ledger), true, JSON.stringify(validate.errors));

  const tampered = structuredClone(ledger);
  tampered.entries[0].authority.provider_can_commit = true;
  assert.equal(verifyURRFGAPLedger(tampered).valid, false);
});

test('URRF Integration Court binds the coverage matrix and gap ledger as candidate-only evidence', () => {
  const matrix = createURRFV03CoverageMatrix();
  const ledger = gapLedger();
  const verdict = createURRFIntegrationCourtVerdict({matrix, gapLedger: ledger});
  assert.equal(verdict.status, 'CANDIDATE_LOCAL_ONLY');
  assert.equal(verifyURRFIntegrationCourtVerdict(verdict, {matrix, gapLedger: ledger}).valid, true);
  const schema = JSON.parse(fs.readFileSync(new URL('../schemas/urrf-integration-court-verdict.v0.1.schema.json', import.meta.url), 'utf8'));
  const validate = new Ajv2020({strict: false, allErrors: true}).compile(schema);
  assert.equal(validate(verdict), true, JSON.stringify(validate.errors));

  const tampered = structuredClone(verdict);
  tampered.decision = 'PROMOTE_RCL';
  assert.equal(verifyURRFIntegrationCourtVerdict(tampered, {matrix, gapLedger}).valid, false);
});
