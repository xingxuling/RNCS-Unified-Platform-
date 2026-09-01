import {mkdirSync, mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  generateUniversalArtAsset,
  verifyUniversalArtAssetForge
} from '@taowind/large-world-runtime';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const evidenceDir = resolve(process.env.URRF_UNIVERSAL_ART_ASSET_FORGE_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_UNIVERSAL_ART_ASSET_FORGE'));

test('URRF Universal Art Asset Forge emits a rooted candidate and closes AAA claims without required evidence', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'urrf-universal-art-integration-'));
  const result = generateUniversalArtAsset({
    description: '一名守护远古冰晶遗迹的三维女剑士，带有冰纹重甲和可回放攻击动作。',
    asset_profile: 'character',
    asset_kind: 'character-3d',
    quality_tier: 'AAA',
    seed: 'urrf-universal-art-asset-forge-integration',
    target_platforms: ['desktop', 'web'],
    constraints: {max_triangles: 2400, pbr_texture_size: 128}
  }, {outDir});
  assert.equal(result.execution.status, 'COMPLETED');
  assert.equal(result.workspaceVerification.valid, true);
  assert.equal(result.acceptance.status, 'BLOCKED');
  assert.equal(result.acceptance.aaa_verified, false);
  assert.equal(result.execution.file_inspection.status, 'PASS');
  assert.equal(result.acceptance.failures.includes('topology_gate'), false);
  assert.equal(result.acceptance.failures.includes('uv_gate'), false);
  assert.equal(result.acceptance.failures.includes('normal_gate'), false);
  assert.equal(verifyUniversalArtAssetForge({
    forge: result.forge,
    genome: result.genome,
    acceptance: result.acceptance,
    evidenceLedger: result.evidenceLedger,
    fileInspection: result.execution.file_inspection
  }).valid, true);

  const reportBase = {
    format: 'urrf.universal-art-asset-forge-report.v0.1',
    version: '0.1.0',
    status: result.status,
    execution: {
      mode: result.execution.mode,
      status: result.execution.status,
      provider_id: result.execution.provider_id,
      workspace_root: result.execution.workspace_root,
      workspace_verified: result.workspaceVerification.valid
    },
    roots: {
      genome_root: result.genome.genome_root,
      provider_resolution_root: result.resolution.resolution_root,
      workspace_root: result.workspace.workspace_root,
      candidate_root: result.candidate.candidate_root,
      acceptance_root: result.acceptance.acceptance_root,
      evidence_ledger_root: result.evidenceLedger.ledger_root,
      file_inspection_root: result.execution.file_inspection.inspection_root,
      forge_root: result.forge.forge_root
    },
    profile: result.genome.asset_profile,
    target_quality_tier: result.genome.quality_tier,
    metrics: result.acceptance.metrics,
    gates: Object.fromEntries(result.acceptance.gates.map(gate => [gate.gate, {status: gate.status, required: gate.required, reason: gate.reason}])),
    failures: result.acceptance.failures,
    authority: result.forge.authority,
    notes: 'Candidate-only local RAGF reference execution. The forge independently inspects generated GLB accessors, welded indexed topology, UVs, normals, material structure and the external four-map PBR pack; AAA remains blocked on provenance/license, art-direction, quality-tier and human-review evidence. It is not AAA production art proof or canonical RNCS mutation.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  mkdirSync(evidenceDir, {recursive: true});
  writeFileSync(join(evidenceDir, 'universal-art-asset-forge-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-genome.json'), `${JSON.stringify(result.genome, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-acceptance.json'), `${JSON.stringify(result.acceptance, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-evidence-ledger.json'), `${JSON.stringify(result.evidenceLedger, null, 2)}\n`, 'utf8');
  writeFileSync(join(evidenceDir, 'universal-art-asset-file-inspection.json'), `${JSON.stringify(result.execution.file_inspection, null, 2)}\n`, 'utf8');
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
});
