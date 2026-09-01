import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createUniversalArtAssetGenome,
  evaluateUniversalArtAssetAcceptance,
  generateUniversalArtAsset,
  inspectUniversalArtAssetFiles,
  resolveUniversalArtAssetProvider,
  verifyUniversalArtAssetForge,
  verifyUniversalArtAssetGenome
} from '../src/index.mjs';
import {createMockAssetProvider, createTrellis2Provider} from '@taowind/reality-asset-genesis-fabric';

const characterInput = {
  description: '一名守护古代冰晶遗迹的三维女剑士，穿着带有冰纹的重甲。',
  asset_profile: 'character',
  asset_kind: 'character-3d',
  quality_tier: 'AAA',
  seed: 'universal-art-forge-character-seed',
  target_platforms: ['desktop', 'web'],
  constraints: {max_triangles: 2400, pbr_texture_size: 128}
};

test('universal art genome reuses RAGF intent/genome and seals a broader profile contract', () => {
  const genome = createUniversalArtAssetGenome(characterInput);
  assert.equal(verifyUniversalArtAssetGenome(genome).valid, true);
  assert.equal(genome.asset_profile, 'character');
  assert.equal(genome.ragf_genome.identity.asset_id, genome.asset_id);
  assert.ok(genome.representation_contract.surface.channels.includes('normal'));
  assert.ok(genome.acceptance_contract.required_gates.includes('rig_gate'));
  assert.equal(genome.authority.provider_can_write_authoritative_world_state, false);

  const tampered = structuredClone(genome);
  tampered.representation_contract.surface.pbr_texture_size = 4096;
  assert.equal(verifyUniversalArtAssetGenome(tampered).valid, false);
});

test('provider resolution exposes external environment capability without silently executing it', () => {
  const genome = createUniversalArtAssetGenome({
    description: '一片可探索的远古湿地环境。',
    asset_profile: 'environment',
    quality_tier: 'AAA',
    seed: 'universal-art-forge-environment-seed'
  });
  const resolution = resolveUniversalArtAssetProvider({genome});
  assert.equal(resolution.eligible, true);
  assert.equal(resolution.selected_provider_id, 'provider:external:infinigen');
  assert.equal(resolution.runtime_status, 'CONTRACT_ONLY');
  assert.equal(resolution.authority.provider_can_write_authoritative_world_state, false);
});

test('built-in RAGF workspace produces real candidate files and local structure gates', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-reference-'));
  const result = generateUniversalArtAsset(characterInput, {outDir});
  assert.equal(result.execution.status, 'COMPLETED');
  assert.equal(result.workspaceVerification.valid, true);
  assert.equal(result.candidate.authoritative, undefined);
  assert.equal(result.acceptance.status, 'BLOCKED');
  assert.equal(result.acceptance.failures.includes('topology_gate'), false);
  assert.equal(result.acceptance.failures.includes('uv_gate'), false);
  assert.equal(result.acceptance.failures.includes('normal_gate'), false);
  assert.ok(result.acceptance.failures.includes('art_direction_gate'));
  assert.ok(result.acceptance.failures.includes('human_review_gate'));
  assert.ok(result.acceptance.failures.includes('quality_tier_gate'));
  assert.equal(result.execution.file_inspection.status, 'PASS');
  assert.equal(result.execution.file_inspection.aggregates.valid_file_count, 3);
  assert.equal(result.execution.file_inspection.aggregates.pbr_status, 'PASS');
  assert.equal(verifyUniversalArtAssetForge({
    forge: result.forge,
    genome: result.genome,
    acceptance: result.acceptance,
    evidenceLedger: result.evidenceLedger,
    fileInspection: result.execution.file_inspection
  }).valid, true);
  assert.ok(fs.existsSync(path.join(outDir, 'universal-art-asset-genome.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'universal-art-asset-acceptance.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'universal-art-asset-file-inspection.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'candidates', 'cinematic', 'mesh', 'lod0.glb')));
});

test('invalid local GLB inspection cannot be overridden by provider declarations', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-invalid-glb-'));
  fs.writeFileSync(path.join(outDir, 'broken.glb'), Buffer.from('not-a-glb'));
  const inspection = inspectUniversalArtAssetFiles({
    baseDir: outDir,
    files: [{path: 'broken.glb', role: 'mesh-glb', lod: 0}]
  });
  assert.equal(inspection.status, 'FAIL');
  assert.equal(inspection.aggregates.topology_status, 'FAIL');
  assert.equal(inspection.aggregates.uv_status, 'FAIL');
  assert.equal(inspection.aggregates.normal_status, 'FAIL');
  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome: createUniversalArtAssetGenome(characterInput),
    execution: {mode: 'RAGF_EXTERNAL_PROVIDER', status: 'COMPLETED'},
    providerEvidence: {
      geometry: {status: 'PASS'},
      topology: {status: 'PASS'},
      uv: {status: 'PASS'},
      normal: {status: 'PASS'},
      pbr: {status: 'PASS'}
    },
    fileInspection: inspection
  });
  assert.ok(acceptance.failures.includes('topology_gate'));
  assert.ok(acceptance.failures.includes('uv_gate'));
  assert.ok(acceptance.failures.includes('normal_gate'));
  assert.ok(acceptance.failures.includes('pbr_gate'));
});

test('tampered external PBR pack cannot satisfy the local material gate', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-pbr-tamper-'));
  const result = generateUniversalArtAsset(characterInput, {outDir});
  const variant = result.candidate.variant;
  const pbrArtifact = result.candidate.artifacts['pbr-texture-pack'];
  const pbrFiles = pbrArtifact.files
    .filter(file => ['base-color', 'normal', 'occlusion-roughness-metallic', 'emissive'].includes(file.role))
    .map(file => ({path: path.join('candidates', variant, file.name), role: file.role, expected_sha256: file.root}));
  fs.appendFileSync(path.join(outDir, 'candidates', variant, 'pbr', 'base-color.png'), 'tamper');
  const inspection = inspectUniversalArtAssetFiles({
    baseDir: outDir,
    files: [{path: path.join('candidates', variant, 'mesh', 'lod0.glb'), role: 'mesh-glb', lod: 0}],
    pbrPack: {metadata: pbrArtifact.metadata, files: pbrFiles}
  });
  assert.equal(inspection.pbr_pack.status, 'FAIL');
  assert.equal(inspection.aggregates.pbr_status, 'FAIL');
  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome: result.genome,
    candidate: result.candidate,
    execution: {...result.execution, file_inspection: inspection},
    provider: result.execution.provider_id,
    fileInspection: inspection
  });
  assert.ok(acceptance.failures.includes('pbr_gate'));
});

test('injected provider is normalized through job, candidate, court and evidence ledger', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-mock-'));
  const result = generateUniversalArtAsset(characterInput, {
    outDir,
    provider: createMockAssetProvider()
  });
  assert.equal(result.execution.status, 'COMPLETED');
  assert.equal(result.providerExecution.job.state, 'COMPLETED');
  assert.equal(result.providerCourt.pass, true);
  assert.equal(result.candidate.authoritative, false);
  assert.equal(result.candidate.candidate_only, true);
  assert.equal(result.evidenceVerification.valid, true);
  assert.equal(result.acceptance.status, 'BLOCKED', 'mock provider evidence is not an AAA art-review receipt');
  assert.ok(result.acceptance.failures.includes('pbr_gate'));
  assert.equal(result.resolution.selected_provider_id, 'provider:test:asset-mock');
  assert.equal(verifyUniversalArtAssetForge({
    forge: result.forge,
    genome: result.genome,
    acceptance: result.acceptance,
    evidenceLedger: result.evidenceLedger,
    fileInspection: result.execution.file_inspection
  }).valid, true);
});

test('contract-only provider failure is visible and does not become a fake generation success', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-contract-'));
  const result = generateUniversalArtAsset({
    description: '一辆可变形的远古装甲载具。',
    asset_profile: 'vehicle',
    asset_kind: 'vehicle-3d',
    quality_tier: 'AAA',
    seed: 'universal-art-forge-vehicle-seed'
  }, {outDir, provider: createTrellis2Provider()});
  assert.equal(result.execution.status, 'FAILED');
  assert.equal(result.execution.failure.code, 'PROVIDER_RUNTIME_NOT_EXECUTED');
  assert.equal(result.candidate, null);
  assert.equal(result.acceptance.status, 'BLOCKED');
  assert.ok(result.acceptance.failures.includes('provider_execution_gate'));
  assert.equal(result.forge.authoritative, false);
});

test('unsupported profile fails closed instead of borrowing a humanoid generator', () => {
  const genome = createUniversalArtAssetGenome({
    description: '一个需要真实粒子材质和轨迹的魔法爆炸特效。',
    asset_profile: 'vfx',
    quality_tier: 'AAA',
    seed: 'universal-art-forge-vfx-seed'
  });
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-unresolved-'));
  const result = generateUniversalArtAsset(genome, {outDir});
  assert.equal(result.execution.failure.code, 'PROFILE_PROVIDER_UNRESOLVED');
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.candidate, null);
  assert.equal(result.acceptance.aaa_verified, false);
});

test('acceptance gate cannot be passed by provider success alone', () => {
  const genome = createUniversalArtAssetGenome(characterInput);
  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome,
    execution: {mode: 'RAGF_EXTERNAL_PROVIDER', status: 'COMPLETED'},
    providerEvidence: {provider_success: true}
  });
  assert.equal(acceptance.status, 'BLOCKED');
  assert.ok(acceptance.failures.includes('geometry_gate'));
  assert.ok(acceptance.failures.includes('human_review_gate'));
});
