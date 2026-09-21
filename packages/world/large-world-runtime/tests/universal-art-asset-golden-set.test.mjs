import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  UNIVERSAL_ART_ASSET_PROFILES,
  createUniversalArtAssetGoldenSetContract,
  executeUniversalArtAssetGoldenSet,
  verifyUniversalArtAssetGoldenSetContract,
  verifyUniversalArtAssetGoldenSetReport
} from '../src/index.mjs';
import {rootHash} from '@taowind/reality-asset-genesis-fabric';

function schema(name) {
  return JSON.parse(fs.readFileSync(new URL(`../schemas/${name}`, import.meta.url), 'utf8'));
}

test('URRF golden-set contract has exactly nine profiles and three case classes per profile', () => {
  const contract = createUniversalArtAssetGoldenSetContract();
  const verification = verifyUniversalArtAssetGoldenSetContract(contract);
  assert.equal(verification.valid, true, verification.errors.join(','));
  assert.deepEqual(contract.profiles.map(profile => profile.asset_profile), UNIVERSAL_ART_ASSET_PROFILES);
  assert.equal(contract.summary.total_case_count, 27);
  assert.deepEqual(contract.profiles.flatMap(profile => Object.keys(profile.cases)), [
    ...Array.from({length: 9}, () => ['positive', 'boundary', 'open_domain_negative'])
  ].flat());

  const validate = new Ajv2020({strict: false, allErrors: true}).compile(schema('universal-art-asset-golden-set.v0.1.schema.json'));
  assert.equal(validate(contract), true, JSON.stringify(validate.errors));
});

test('URRF golden-set executes positive, boundary, replay, and open-domain fail-closed cases', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-golden-set-'));
  const result = executeUniversalArtAssetGoldenSet({outDir});
  const {contract, report} = result;
  assert.equal(report.status, 'CANDIDATE_GOLDEN_SET_PASS');
  assert.equal(report.execution_status, 'CANDIDATE_LOCAL_REFERENCE_EXECUTED');
  assert.equal(report.aaa_status, 'BLOCKED_EXTERNAL_ART_HUMAN_HARDWARE_EVIDENCE');
  assert.equal(report.ai_generate_status, 'BLOCKED_EXTERNAL_MODEL_NOT_RUN');
  assert.equal(report.summary.pass_count, 36);
  assert.equal(report.summary.fail_count, 0);
  assert.deepEqual(report.profiles, UNIVERSAL_ART_ASSET_PROFILES);
  assert.equal(report.positive.length, 9);
  assert.equal(report.boundary.length, 9);
  assert.equal(report.open_domain_negative.length, 9);
  assert.equal(report.deterministic_replay.length, 9);
  assert.equal(report.checks.positive_structural, true);
  assert.equal(report.checks.boundary_structural, true);
  assert.equal(report.checks.open_domain_fail_closed, true);
  assert.equal(report.checks.deterministic_replay, true);
  assert.equal(verifyUniversalArtAssetGoldenSetReport(report, {contract}).valid, true);

  const evidenceValidate = new Ajv2020({strict: false, allErrors: true}).compile(schema('universal-art-asset-golden-set-evidence.v0.1.schema.json'));
  assert.equal(evidenceValidate(report), true, JSON.stringify(evidenceValidate.errors));
  assert.ok(fs.existsSync(path.join(outDir, 'universal-art-asset-golden-set-contract.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'universal-art-asset-golden-set-evidence.json')));

  const tampered = structuredClone(report);
  tampered.open_domain_negative[0].error_code = 'PROVIDER_ACCEPTED_UNEXPECTEDLY';
  delete tampered.evidence_root;
  tampered.evidence_root = rootHash(tampered);
  assert.equal(verifyUniversalArtAssetGoldenSetReport(tampered, {contract}).valid, false);
});
