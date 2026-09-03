import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createUniversalArtAssetAssembly,
  createUniversalArtAssetEvidenceBundle,
  createUniversalArtAssetGenome,
  createUniversalArtAssetHoldoutReport,
  createUniversalArtAssetProfileCoverageReport,
  createUniversalArtAssetProviderPreflightReport,
  evaluateUniversalArtAssetAcceptance,
  generateUniversalArtAssetBatch,
  generateUniversalArtAsset,
  inspectUniversalArtAssetFiles,
  lowerUniversalArtAssetAssemblyToVsr,
  materializeUniversalArtAssetVsrProjection,
  resolveUniversalArtAssetProvider,
  verifyUniversalArtAssetAssembly,
  verifyUniversalArtAssetBatch,
  verifyUniversalArtAssetEvidenceBundle,
  verifyUniversalArtAssetHoldoutReport,
  verifyUniversalArtAssetProfileCoverageReport,
  verifyUniversalArtAssetProviderExecutionReceipt,
  replayUniversalArtAssetProviderExecution,
  verifyUniversalArtAssetProviderReplayReport,
  createUniversalArtAssetProviderPipelinePlan,
  verifyUniversalArtAssetProviderPipelinePlan,
  executeUniversalArtAssetProviderPipeline,
  verifyUniversalArtAssetProviderPipelineExecution,
  verifyUniversalArtAssetProviderPreflightReport,
  verifyUniversalArtAssetProvenanceLicenseReceipt,
  verifyUniversalArtAssetQualityProof,
  verifyUniversalArtAssetReviewReceipt,
  verifyUniversalArtAssetVsrMaterialization,
  verifyUniversalArtAssetVsrProjection,
  verifyUniversalArtAssetForge,
  verifyUniversalArtAssetGenome
} from '../src/index.mjs';
import {AssetProviderAdapter, createAssetProviderManifest, createMockAssetProvider, createTrellis2Provider, rootHash, seal} from '@taowind/reality-asset-genesis-fabric';

const characterInput = {
  description: '一名守护古代冰晶遗迹的三维女剑士，穿着带有冰纹的重甲。',
  asset_profile: 'character',
  asset_kind: 'character-3d',
  quality_tier: 'AAA',
  seed: 'universal-art-forge-character-seed',
  target_platforms: ['desktop', 'web'],
  constraints: {max_triangles: 2400, pbr_texture_size: 128}
};

function createReviewReceipt({result, reviewKind}) {
  const comparison = {
    comparison_root: rootHash({asset_id: result.genome.asset_id, review_kind: reviewKind, reference: 'test-reference'}),
    axes: [
      {axis: 'silhouette', status: 'PASS'},
      {axis: 'palette', status: 'PASS'}
    ]
  };
  return seal({
    format: 'urrf.universal-art-asset-review-receipt.v0.1',
    version: '0.1.0',
    review_kind: reviewKind,
    source: 'external-human-review',
    receipt_status: 'VERIFIED',
    decision: 'APPROVED',
    reviewer_id: reviewKind === 'ART_DIRECTION' ? 'human:art-director:test' : 'human:reviewer:test',
    reviewer_role: reviewKind === 'ART_DIRECTION' ? 'art-director' : 'external-art-reviewer',
    genome_root: result.genome.genome_root,
    candidate_root: result.candidate.candidate_root,
    file_inspection_root: result.fileInspection.inspection_root,
    reference_root: rootHash({asset_id: result.genome.asset_id, reference: 'test-reference'}),
    comparison,
    verifier: {
      kind: 'external-review-verifier',
      status: 'PASS',
      verifier_id: 'review-verifier:test',
      method: 'external-human-review-receipt-v0.1'
    },
    attestation: reviewKind === 'ART_DIRECTION' ? 'ART_DIRECTION_REVIEWED' : 'HUMAN_REVIEWED'
  }, 'receipt_root');
}

function createPipelineStageProvider({providerId, providerType, capabilities, outputs, roles}) {
  const manifest = createAssetProviderManifest({
    id: providerId,
    name: `Pipeline ${providerId}`,
    version: '0.1.0',
    providerType,
    capabilities,
    capability_descriptors: outputs.map(output => ({capability_id: capabilities[0], output, quality_tier: 'PRODUCTION'})),
    inputFormats: ['ragf.asset-genome.v0.3'],
    outputFormats: ['model/gltf-binary', 'application/json', 'image/png'],
    executionMode: 'local',
    hardwareRequirements: {cpu: 'any', ram: 'any', gpu: 'none', vram: 'none', accelerator: 'none'},
    license: {status: 'VERIFIED', identifier: 'Apache-2.0'},
    runtimeStatus: 'READY',
    upstream: {url: 'https://taowind.company', revision: 'pipeline-test'},
    metadata: {quality_tier: 'PRODUCTION', pipeline_test_provider: true}
  });
  return new AssetProviderAdapter(manifest, {
    runner: ({input, operation}) => ({
      asset_id: input.asset_id,
      format: 'pipeline-stage-output',
      files: roles.map(role => ({
        name: `${operation}/${role}.json`,
        path: `${operation}/${role}.json`,
        role,
        format: 'application/json',
        mime: 'application/json',
        base64: Buffer.from(`${providerId}:${operation}:${input.asset_id}:${role}`).toString('base64')
      })),
      geometry: {triangle_count: 1200},
      materials: {material_count: 1},
      generator_version: `pipeline-${providerId}`,
      seed: input.seed,
      evidence: {provider_success: true}
    })
  });
}

function createQualityProof({result, targetPlatform = 'desktop'}) {
  const inspection = result.fileInspection;
  const textureSize = Math.max(...inspection.pbr_pack.files.flatMap(file => [file.width, file.height]));
  const hardwareProfile = 'test-reference-renderer';
  return seal({
    format: 'urrf.universal-art-asset-quality-proof.v0.1',
    version: '0.1.0',
    source: 'external-quality-verifier',
    receipt_status: 'VERIFIED',
    decision: 'PASS',
    target_quality_tier: result.genome.quality_tier,
    genome_root: result.genome.genome_root,
    candidate_root: result.candidate.candidate_root,
    file_inspection_root: inspection.inspection_root,
    benchmark_root: rootHash({asset_id: result.genome.asset_id, targetPlatform, hardwareProfile}),
    hardware_profile: hardwareProfile,
    metrics: {
      lod0_triangle_count: inspection.lod.triangle_counts[0],
      texture_size: textureSize,
      pbr_channel_count: inspection.pbr_pack.texture_count,
      target_platform: targetPlatform
    },
    verifier: {
      kind: 'external-quality-verifier',
      status: 'PASS',
      verifier_id: 'quality-verifier:test',
      method: 'external-quality-proof-v0.1'
    }
  }, 'receipt_root');
}

function createProvenanceLicenseProof({result}) {
  const artifactRoots = Object.fromEntries(Object.entries(result.candidate.artifacts)
    .map(([role, artifact]) => [role, artifact.root]));
  return seal({
    format: 'urrf.universal-art-asset-provenance-license-receipt.v0.1',
    version: '0.1.0',
    source: 'external-provenance-license-auditor',
    receipt_status: 'VERIFIED',
    decision: 'PASS',
    audited_provider_id: result.execution.provider_id,
    genome_root: result.genome.genome_root,
    candidate_root: result.candidate.candidate_root,
    file_inspection_root: result.fileInspection.inspection_root,
    provenance: {
      upstream_url: 'builtin://taowind/reality-asset-genesis-fabric',
      source_revision: 'ragf-reference-workspace-v0.3',
      generator_version: 'ragf-reference-provider-v0.4',
      seed: result.genome.ragf_genome.seed
    },
    license: {
      status: 'VERIFIED',
      identifier: 'Apache-2.0',
      scope: 'generated-candidate-and-runtime-artifacts'
    },
    model_weights_audit: {
      status: 'PASS',
      mode: 'PROCEDURAL_NO_WEIGHTS'
    },
    artifact_roots: artifactRoots,
    verifier: {
      kind: 'external-provenance-license-auditor',
      status: 'PASS',
      verifier_id: 'provenance-license-auditor:test',
      method: 'external-provenance-license-receipt-v0.1'
    }
  }, 'receipt_root');
}

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

test('unknown asset kinds fail closed instead of silently becoming props', () => {
  assert.throws(() => createUniversalArtAssetGenome({
    description: '一个尚未注册资产族的实验对象。',
    asset_kind: 'unregistered-asset-3d',
    quality_tier: 'AAA',
    seed: 'universal-art-forge-unknown-asset-kind-seed'
  }), /UNIVERSAL_ART_ASSET_PROFILE_INVALID/);
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
  assert.equal(result.acceptance.metrics.quality_proof_status, 'NOT_RUN');
  assert.equal(result.execution.file_inspection.status, 'PASS');
  assert.equal(result.execution.file_inspection.aggregates.valid_file_count, 3);
  assert.equal(result.execution.file_inspection.aggregates.pbr_status, 'PASS');
  assert.equal(result.execution.file_inspection.aggregates.lod_status, 'PASS');
  assert.deepEqual(result.execution.file_inspection.lod.levels, [0, 1, 2]);
  assert.ok(result.execution.file_inspection.lod.triangle_counts[0] > result.execution.file_inspection.lod.triangle_counts[1]);
  assert.ok(result.execution.file_inspection.lod.triangle_counts[1] > result.execution.file_inspection.lod.triangle_counts[2]);
  assert.equal(result.acceptance.metrics.provenance_license_proof_status, 'NOT_RUN');
  assert.equal(verifyUniversalArtAssetForge({
    forge: result.forge,
    genome: result.genome,
    acceptance: result.acceptance,
    evidenceLedger: result.evidenceLedger,
    fileInspection: result.execution.file_inspection
  }).valid, true);
  assert.equal(result.providerExecutionReceipt.status, 'CANDIDATE_PROVIDER_EXECUTION_PASS');
  assert.equal(verifyUniversalArtAssetProviderExecutionReceipt(result.providerExecutionReceipt, {
    genome: result.genome,
    resolution: result.resolution,
    execution: result.execution,
    workspaceVerification: result.workspaceVerification,
    candidate: result.candidate,
    acceptance: result.acceptance,
    evidenceLedger: result.evidenceLedger,
    fileInspection: result.fileInspection
  }).valid, true);
  assert.ok(fs.existsSync(path.join(outDir, 'universal-art-asset-genome.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'universal-art-asset-acceptance.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'universal-art-asset-file-inspection.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'universal-art-asset-provider-execution.json')));
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
      pbr: {status: 'PASS'},
      lod: {status: 'PASS'},
      provenance: {status: 'PASS'},
      license: {status: 'PASS'}
    },
    fileInspection: inspection
  });
  assert.ok(acceptance.failures.includes('topology_gate'));
  assert.ok(acceptance.failures.includes('uv_gate'));
  assert.ok(acceptance.failures.includes('normal_gate'));
  assert.ok(acceptance.failures.includes('pbr_gate'));
  assert.ok(acceptance.failures.includes('lod_gate'));
});

test('local LOD inspection rejects duplicate or non-reducing levels despite Provider PASS evidence', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-lod-'));
  const result = generateUniversalArtAsset(characterInput, {outDir});
  const lod0 = path.join('candidates', result.candidate.variant, 'mesh', 'lod0.glb');
  const inspection = inspectUniversalArtAssetFiles({
    baseDir: outDir,
    files: [
      {path: lod0, role: 'mesh-glb', lod: 0},
      {path: lod0, role: 'mesh-lod1-glb', lod: 1}
    ]
  });
  assert.equal(inspection.lod.status, 'FAIL');
  assert.ok(inspection.lod.errors.includes('LOD_TRIANGLES_NOT_REDUCED:0:1'));
  assert.equal(inspection.aggregates.lod_status, 'FAIL');
  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome: result.genome,
    candidate: result.candidate,
    execution: {...result.execution, file_inspection: inspection},
    provider: result.execution.provider_id,
    providerEvidence: {lod: {status: 'PASS'}},
    fileInspection: inspection
  });
  assert.ok(acceptance.failures.includes('lod_gate'));
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
  assert.equal(result.providerExecutionReceipt.status, 'CANDIDATE_PROVIDER_EXECUTION_PASS');
  assert.equal(verifyUniversalArtAssetProviderExecutionReceipt(result.providerExecutionReceipt, {
    genome: result.genome,
    resolution: result.resolution,
    execution: result.execution,
    providerExecution: result.providerExecution,
    candidate: result.candidate,
    providerCourt: result.providerCourt,
    acceptance: result.acceptance,
    evidenceLedger: result.evidenceLedger,
    fileInspection: result.fileInspection,
    materialization: result.materialization,
    request: result.providerExecution.job.request
  }).valid, true);
  const tamperedReceipt = structuredClone(result.providerExecutionReceipt);
  tamperedReceipt.output.candidate_root = null;
  delete tamperedReceipt.execution_root;
  tamperedReceipt.execution_root = rootHash(tamperedReceipt);
  assert.equal(verifyUniversalArtAssetProviderExecutionReceipt(tamperedReceipt, {
    genome: result.genome,
    resolution: result.resolution,
    execution: result.execution,
    providerExecution: result.providerExecution,
    candidate: result.candidate,
    providerCourt: result.providerCourt,
    acceptance: result.acceptance,
    evidenceLedger: result.evidenceLedger,
    fileInspection: result.fileInspection,
    materialization: result.materialization,
    request: result.providerExecution.job.request
  }).valid, false);
  assert.ok(fs.existsSync(path.join(outDir, 'universal-art-asset-provider-execution.json')));
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
  assert.equal(result.providerExecutionReceipt.status, 'CANDIDATE_PROVIDER_EXECUTION_PASS');
  assert.equal(verifyUniversalArtAssetProviderExecutionReceipt(result.providerExecutionReceipt, {
    genome: result.genome,
    resolution: result.resolution,
    execution: result.execution,
    providerExecution: result.providerExecution,
    acceptance: result.acceptance,
    evidenceLedger: result.evidenceLedger,
    request: result.providerExecution.job.request
  }).valid, true);
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
  assert.equal(result.resolution.selected_provider_id, null);
  assert.equal(result.resolution.selected_provider_source, null);
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.candidate, null);
  assert.equal(result.acceptance.aaa_verified, false);
  assert.equal(result.providerExecutionReceipt.status, 'CANDIDATE_PROVIDER_EXECUTION_PASS');
  assert.equal(verifyUniversalArtAssetProviderExecutionReceipt(result.providerExecutionReceipt).valid, true);
});

test('profile coverage preserves built-in and unresolved boundaries after resealing', () => {
  const characterOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-profile-coverage-character-'));
  const vfxInput = {
    description: '一个需要真实粒子材质和轨迹的魔法爆炸特效。',
    asset_profile: 'vfx',
    quality_tier: 'AAA',
    seed: 'universal-art-forge-profile-coverage-vfx-seed'
  };
  const character = generateUniversalArtAsset(characterInput, {outDir: characterOutDir});
  const vfxGenome = createUniversalArtAssetGenome(vfxInput);
  const vfx = generateUniversalArtAsset(vfxGenome, {
    outDir: fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-profile-coverage-vfx-'))
  });
  const entries = [
    {input: characterInput, result: character},
    {input: vfxGenome, result: vfx}
  ];
  const report = createUniversalArtAssetProfileCoverageReport({
    coverage_id: 'urrf-profile-coverage-unit-v01',
    entries,
    expected_profiles: ['character', 'vfx'],
    expected_modes: {character: 'BUILTIN_REFERENCE', vfx: 'UNRESOLVED'}
  });
  assert.equal(report.status, 'CANDIDATE_PROFILE_COVERAGE_PASS');
  assert.deepEqual(report.coverage.observed_profiles, ['character', 'vfx']);
  assert.equal(report.summary.mode_histogram.BUILTIN_REFERENCE, 1);
  assert.equal(report.summary.mode_histogram.UNRESOLVED, 1);
  assert.equal(verifyUniversalArtAssetProfileCoverageReport(report).valid, true);
  assert.equal(verifyUniversalArtAssetProfileCoverageReport(report, {entries}).valid, true);

  const tampered = structuredClone(report);
  tampered.entries[1].resolution.selected_provider_source = 'ragf-reference-provider';
  const resealedTamper = seal(tampered, 'coverage_root');
  assert.equal(verifyUniversalArtAssetProfileCoverageReport(resealedTamper).valid, false);
  assert.equal(verifyUniversalArtAssetProfileCoverageReport(resealedTamper, {entries}).valid, false);
});

test('provider preflight binds every URRF profile to health and fails closed on evidence-only tampering', () => {
  const report = createUniversalArtAssetProviderPreflightReport({
    preflight_id: 'urrf-provider-preflight-unit-v01'
  });
  assert.equal(report.status, 'CANDIDATE_PROVIDER_PREFLIGHT_PASS');
  assert.equal(report.execution_performed, false);
  assert.equal(report.aaa_ready, false);
  assert.equal(report.release_ready, false);
  assert.deepEqual(report.summary.route_histogram, {
    BUILTIN_REFERENCE_READY: 2,
    EXTERNAL_CONTRACT_ONLY: 6,
    EXTERNAL_RUNTIME_BOUND: 0,
    UNRESOLVED: 1,
    INCONSISTENT: 0
  });
  assert.deepEqual(report.summary.provider_health_histogram, {
    CONTRACT_ONLY: 6,
    EXECUTOR_INJECTED: 0,
    EXTERNAL_PROCESS: 0
  });
  assert.equal(report.summary.release_blocked_provider_count, 6);
  assert.equal(report.profile_routes.find(entry => entry.asset_profile === 'vfx').selected_provider_id, null);
  assert.equal(report.profile_routes.find(entry => entry.asset_profile === 'vfx').selected_provider_source, null);
  assert.equal(report.profile_routes.find(entry => entry.asset_profile === 'environment').route_status, 'EXTERNAL_CONTRACT_ONLY');
  assert.equal(verifyUniversalArtAssetProviderPreflightReport(report).valid, true);

  const sourceTamper = structuredClone(report);
  sourceTamper.profile_routes.find(entry => entry.asset_profile === 'environment').selected_provider_source = 'ragf-reference-provider';
  assert.equal(verifyUniversalArtAssetProviderPreflightReport(seal(sourceTamper, 'preflight_root')).valid, false);

  const checkTamper = structuredClone(report);
  checkTamper.profile_routes.find(entry => entry.asset_profile === 'environment').checks.no_silent_fallback = false;
  assert.equal(verifyUniversalArtAssetProviderPreflightReport(seal(checkTamper, 'preflight_root')).valid, false);

  const authorityTamper = structuredClone(report);
  authorityTamper.profile_routes.find(entry => entry.asset_profile === 'environment').checks.authority_boundary = false;
  assert.equal(verifyUniversalArtAssetProviderPreflightReport(seal(authorityTamper, 'preflight_root')).valid, false);

  const licenseTamper = structuredClone(report);
  licenseTamper.providers[0].license.dependency_status = 'VERIFIED';
  assert.equal(verifyUniversalArtAssetProviderPreflightReport(seal(licenseTamper, 'preflight_root')).valid, false);
});

test('provider preflight distinguishes an injected executor binding from execution and supports replay', () => {
  const providerId = 'provider:external:trellis-2';
  const providerRunners = {[providerId]: () => ({status: 'not-invoked-by-preflight'})};
  const report = createUniversalArtAssetProviderPreflightReport({
    preflight_id: 'urrf-provider-preflight-runner-unit-v01',
    provider_runners: providerRunners
  });
  assert.equal(report.execution_performed, false);
  assert.equal(report.summary.provider_health_histogram.EXECUTOR_INJECTED, 1);
  assert.equal(report.summary.route_histogram.EXTERNAL_RUNTIME_BOUND, 2);
  assert.equal(report.profile_routes.find(entry => entry.asset_profile === 'vehicle').route_status, 'EXTERNAL_RUNTIME_BOUND');
  assert.equal(verifyUniversalArtAssetProviderPreflightReport(report, {provider_runners: providerRunners}).valid, true);
  assert.equal(verifyUniversalArtAssetProviderPreflightReport(report).valid, false);
});

test('provider execution replay compares bound output roots and fails closed for nondeterminism or missing runtime', () => {
  const reference = generateUniversalArtAsset(characterInput, {
    outDir: fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-replay-reference-first-'))
  });
  const referenceReplay = replayUniversalArtAssetProviderExecution({
    receipt: reference.providerExecutionReceipt,
    genome: reference.genome,
    replayOutDir: fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-replay-reference-second-'))
  });
  assert.equal(referenceReplay.report.status, 'CANDIDATE_PROVIDER_REPLAY_PASS');
  assert.equal(referenceReplay.report.deterministic_claim, 'BOUNDED_OUTPUT_ROOT_EQUALITY');
  assert.equal(referenceReplay.report.comparison.output_root_match, true);
  assert.equal(verifyUniversalArtAssetProviderReplayReport(referenceReplay.report, {
    receipt: reference.providerExecutionReceipt,
    replayReceipt: referenceReplay.replayReceipt,
    genome: reference.genome
  }).valid, true);

  let invocation = 0;
  const nondeterministicProvider = createMockAssetProvider({
    runner: ({input}) => {
      invocation += 1;
      const content = Buffer.from(`nondeterministic-${invocation}`).toString('base64');
      return {
        asset_id: input.asset_id,
        quality_tier: input.quality_tier,
        files: [{name: 'mesh/lod0.glb', path: 'mesh/lod0.glb', role: 'mesh-glb', format: 'model/gltf-binary', base64: content}],
        geometry: {triangle_count: 1, glb_valid: true},
        pbr_channels: [],
        evidence: {provider_success: true}
      };
    }
  });
  const nondeterministic = generateUniversalArtAsset(characterInput, {
    outDir: fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-replay-nondeterministic-first-')),
    provider: nondeterministicProvider
  });
  const nondeterministicReplay = replayUniversalArtAssetProviderExecution({
    receipt: nondeterministic.providerExecutionReceipt,
    genome: nondeterministic.genome,
    options: {provider: nondeterministicProvider},
    replayOutDir: fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-replay-nondeterministic-second-'))
  });
  assert.equal(nondeterministicReplay.report.status, 'CANDIDATE_PROVIDER_REPLAY_FAIL');
  assert.equal(nondeterministicReplay.report.deterministic_claim, 'NOT_PROVEN');
  assert.equal(nondeterministicReplay.report.comparison.output_root_match, false);
  assert.equal(verifyUniversalArtAssetProviderReplayReport(nondeterministicReplay.report, {
    receipt: nondeterministic.providerExecutionReceipt,
    replayReceipt: nondeterministicReplay.replayReceipt,
    genome: nondeterministic.genome
  }).valid, true);

  const contract = generateUniversalArtAsset({
    description: '一辆用于重建遗迹运输的三维载具。',
    asset_profile: 'vehicle',
    asset_kind: 'vehicle-3d',
    quality_tier: 'AAA',
    seed: 'universal-art-replay-contract-seed'
  }, {
    outDir: fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-replay-contract-first-')),
    provider: createTrellis2Provider()
  });
  const contractReplay = replayUniversalArtAssetProviderExecution({
    receipt: contract.providerExecutionReceipt,
    genome: contract.genome,
    options: {provider: createTrellis2Provider()},
    replayOutDir: fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-replay-contract-second-'))
  });
  assert.equal(contractReplay.report.status, 'CANDIDATE_PROVIDER_REPLAY_NOT_RUN');
  assert.equal(contractReplay.report.provider_runtime_performed, false);
  assert.equal(verifyUniversalArtAssetProviderReplayReport(contractReplay.report, {
    receipt: contract.providerExecutionReceipt,
    replayReceipt: contractReplay.replayReceipt,
    genome: contract.genome
  }).valid, true);
});

test('provider pipeline plan composes profile stages without executing or escalating authority', () => {
  const inputs = [
    {asset_profile: 'character', asset_kind: 'character-3d', description: 'pipeline character', seed: 'pipeline-character-seed'},
    {asset_profile: 'creature', asset_kind: 'creature-3d', description: 'pipeline creature', seed: 'pipeline-creature-seed'},
    {asset_profile: 'prop', asset_kind: 'prop-3d', description: 'pipeline prop', seed: 'pipeline-prop-seed'},
    {asset_profile: 'vehicle', asset_kind: 'vehicle-3d', description: 'pipeline vehicle', seed: 'pipeline-vehicle-seed'},
    {asset_profile: 'structure', asset_kind: 'structure-3d', description: 'pipeline structure', seed: 'pipeline-structure-seed'},
    {asset_profile: 'environment', asset_kind: 'environment-3d', description: 'pipeline environment', seed: 'pipeline-environment-seed'},
    {asset_profile: 'vegetation', asset_kind: 'vegetation-3d', description: 'pipeline vegetation', seed: 'pipeline-vegetation-seed'},
    {asset_profile: 'resource', asset_kind: 'resource-3d', description: 'pipeline resource', seed: 'pipeline-resource-seed'},
    {asset_profile: 'vfx', asset_kind: 'vfx-3d', description: 'pipeline vfx', seed: 'pipeline-vfx-seed'}
  ];
  const plans = inputs.map(input => createUniversalArtAssetProviderPipelinePlan({
    genome: createUniversalArtAssetGenome({...input, quality_tier: 'AAA'})
  }));
  assert.equal(plans.length, 9);
  assert.equal(plans.filter(plan => plan.status === 'CANDIDATE_PROVIDER_PIPELINE_PLANNED').length, 7);
  assert.equal(plans.filter(plan => plan.status === 'CANDIDATE_PROVIDER_PIPELINE_BLOCKED').length, 2);
  const character = plans.find(plan => plan.asset_profile === 'character');
  assert.equal(character.runtime_ready, true);
  assert.deepEqual(character.stages.map(stage => stage.stage_id), ['base_generation', 'rigging_animation']);
  assert.equal(character.stages[0].route_status, 'BUILTIN_REFERENCE');
  assert.equal(character.stages[1].route_status, 'BUILTIN_REFERENCE');
  const creature = plans.find(plan => plan.asset_profile === 'creature');
  assert.equal(creature.stages[1].route_status, 'EXTERNAL_CONTRACT_ONLY');
  assert.ok(creature.stages[1].failure_reasons.includes('OUTPUT_CONTRACT_MISSING:animation-clips'));
  const vfx = plans.find(plan => plan.asset_profile === 'vfx');
  assert.equal(vfx.stages[0].route_status, 'UNRESOLVED');
  assert.ok(vfx.required_stage_blockers.some(blocker => blocker.stage_id === 'base_generation'));
  for (const plan of plans) {
    assert.equal(plan.execution_performed, false);
    assert.equal(plan.candidate_only, true);
    assert.equal(plan.authoritative, false);
    assert.equal(verifyUniversalArtAssetProviderPipelinePlan(plan).valid, true);
  }

  const mock = createMockAssetProvider();
  const injectedGenome = createUniversalArtAssetGenome({
    description: 'pipeline injected prop',
    asset_profile: 'prop',
    asset_kind: 'prop-3d',
    quality_tier: 'AAA',
    seed: 'pipeline-injected-prop-seed'
  });
  const injectedPlan = createUniversalArtAssetProviderPipelinePlan({genome: injectedGenome, provider: mock});
  assert.equal(injectedPlan.stages[0].route_status, 'INJECTED_RUNTIME_BOUND');
  assert.equal(injectedPlan.runtime_ready, true);
  assert.equal(verifyUniversalArtAssetProviderPipelinePlan(injectedPlan, {genome: injectedGenome, provider: mock}).valid, true);
});

test('provider pipeline executor runs injected stages, chains roots, and remains candidate-only', () => {
  const baseProvider = createPipelineStageProvider({
    providerId: 'provider:test:pipeline-base',
    providerType: '3d-production',
    capabilities: ['asset.generate.3d.production', 'asset.generate.mesh', 'asset.generate.pbr'],
    outputs: ['mesh-glb', 'pbr-texture-pack'],
    roles: ['mesh-glb', 'pbr-base-color']
  });
  const rigProvider = createPipelineStageProvider({
    providerId: 'provider:test:pipeline-rig',
    providerType: 'rigging',
    capabilities: ['asset.rig.predict', 'asset.pose.initial'],
    outputs: ['rig-candidate', 'animation-clips'],
    roles: ['rig-candidate', 'animation-clips']
  });
  const genome = createUniversalArtAssetGenome({
    description: 'pipeline executor character',
    asset_profile: 'character',
    asset_kind: 'character-3d',
    quality_tier: 'AAA',
    seed: 'pipeline-executor-character-seed'
  });
  const plan = createUniversalArtAssetProviderPipelinePlan({genome, provider: baseProvider, providers: [rigProvider]});
  assert.equal(plan.status, 'CANDIDATE_PROVIDER_PIPELINE_PLANNED');
  assert.deepEqual(plan.stages.map(stage => stage.route_status), ['INJECTED_RUNTIME_BOUND', 'INJECTED_RUNTIME_BOUND']);
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-pipeline-execution-'));
  const run = executeUniversalArtAssetProviderPipeline({genome, plan, provider: baseProvider, providers: [rigProvider], outDir});
  assert.equal(run.status, 'CANDIDATE_PROVIDER_PIPELINE_EXECUTED');
  assert.deepEqual(run.execution.stages.map(stage => stage.status), ['COMPLETED', 'COMPLETED']);
  assert.equal(run.execution.stages[1].request.input_stage_id, 'base_generation');
  assert.equal(run.execution.stages[1].request.input_result_root, run.execution.stages[0].output.result_root);
  assert.equal(run.execution.stages[1].request.input_output_root, run.execution.stages[0].output.output_root);
  assert.equal(run.execution.stages.every(stage => stage.execution_performed), true);
  assert.equal(run.execution.output.composed_file_roots.length, 4);
  assert.equal(run.execution.candidate_only, true);
  assert.equal(run.execution.authoritative, false);
  assert.equal(run.execution.authority.provider_can_write_authoritative_world_state, false);
  assert.equal(verifyUniversalArtAssetProviderPipelineExecution(run.execution, {plan, genome}).valid, true);

  const tampered = JSON.parse(JSON.stringify(run.execution));
  tampered.stages[1].request.input_result_root = 'f'.repeat(64);
  assert.equal(verifyUniversalArtAssetProviderPipelineExecution(tampered, {plan, genome}).valid, false);
});

test('provider pipeline executor stays blocked when a planned provider is contract-only', () => {
  const manifest = createAssetProviderManifest({
    id: 'provider:test:pipeline-contract-only',
    name: 'Pipeline Contract-Only Provider',
    version: '0.1.0',
    providerType: '3d-production',
    capabilities: ['asset.generate.3d.production', 'asset.generate.mesh', 'asset.generate.pbr'],
    capability_descriptors: [
      {capability_id: 'asset.generate.3d.production', output: 'mesh-glb', quality_tier: 'PRODUCTION'},
      {capability_id: 'asset.generate.mesh', output: 'mesh-glb', quality_tier: 'PRODUCTION'},
      {capability_id: 'asset.generate.pbr', output: 'pbr-texture-pack', quality_tier: 'PRODUCTION'}
    ],
    inputFormats: ['ragf.asset-genome.v0.3'],
    outputFormats: ['model/gltf-binary'],
    executionMode: 'local',
    hardwareRequirements: {cpu: 'any', ram: 'any', gpu: 'none', vram: 'none', accelerator: 'none'},
    license: {status: 'VERIFIED', identifier: 'Apache-2.0'},
    runtimeStatus: 'READY',
    upstream: {url: 'https://taowind.company', revision: 'pipeline-contract-only-test'},
    metadata: {quality_tier: 'PRODUCTION'}
  });
  const genome = createUniversalArtAssetGenome({
    description: 'pipeline contract-only prop',
    asset_profile: 'prop',
    asset_kind: 'prop-3d',
    quality_tier: 'AAA',
    seed: 'pipeline-contract-only-seed'
  });
  const plan = createUniversalArtAssetProviderPipelinePlan({genome, provider: manifest});
  assert.equal(plan.status, 'CANDIDATE_PROVIDER_PIPELINE_PLANNED');
  assert.equal(plan.stages[0].route_status, 'INJECTED_CONTRACT_ONLY');
  const run = executeUniversalArtAssetProviderPipeline({genome, plan, provider: manifest});
  assert.equal(run.status, 'CANDIDATE_PROVIDER_PIPELINE_BLOCKED');
  assert.equal(run.execution.stages[0].status, 'CONTRACT_ONLY');
  assert.equal(run.execution.stages[0].execution_performed, false);
  assert.equal(run.execution.stages[0].failure_code, 'PROVIDER_RUNTIME_NOT_EXECUTED');
  assert.equal(verifyUniversalArtAssetProviderPipelineExecution(run.execution, {plan, genome}).valid, true);
});

test('acceptance gate cannot be passed by provider success alone', () => {
  const genome = createUniversalArtAssetGenome(characterInput);
  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome,
    execution: {mode: 'RAGF_EXTERNAL_PROVIDER', status: 'COMPLETED'},
    providerEvidence: {
      provider_success: true,
      art_direction: {status: 'PASS'},
      human_review: {status: 'PASS'},
      provenance: {status: 'PASS'},
      license: {status: 'PASS'},
      quality_tier: {status: 'PASS'}
    }
  });
  assert.equal(acceptance.status, 'BLOCKED');
  assert.ok(acceptance.failures.includes('geometry_gate'));
  assert.ok(acceptance.failures.includes('provenance_license_gate'));
  assert.ok(acceptance.failures.includes('art_direction_gate'));
  assert.ok(acceptance.failures.includes('human_review_gate'));
  assert.ok(acceptance.failures.includes('quality_tier_gate'));
});

test('independent review receipts bind exact roots and remain separate from Provider evidence', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-review-'));
  const result = generateUniversalArtAsset(characterInput, {outDir});
  const artDirectionReview = createReviewReceipt({result, reviewKind: 'ART_DIRECTION'});
  const humanReview = createReviewReceipt({result, reviewKind: 'HUMAN_ART'});
  assert.equal(verifyUniversalArtAssetReviewReceipt(artDirectionReview, {
    reviewKind: 'ART_DIRECTION',
    genomeRoot: result.genome.genome_root,
    candidateRoot: result.candidate.candidate_root,
    fileInspectionRoot: result.fileInspection.inspection_root
  }).valid, true);
  assert.equal(verifyUniversalArtAssetReviewReceipt(humanReview, {
    reviewKind: 'HUMAN_ART',
    genomeRoot: result.genome.genome_root,
    candidateRoot: result.candidate.candidate_root,
    fileInspectionRoot: result.fileInspection.inspection_root
  }).valid, true);

  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome: result.genome,
    workspace: result.workspace,
    candidate: result.candidate,
    execution: result.execution,
    provider: result.execution.provider_id,
    fileInspection: result.fileInspection,
    providerEvidence: {
      art_direction: {status: 'PASS'},
      human_review: {status: 'PASS'}
    },
    artDirectionReview,
    humanReview
  });
  const gates = new Map(acceptance.gates.map(gate => [gate.gate, gate]));
  assert.equal(gates.get('art_direction_gate').status, 'PASS');
  assert.equal(gates.get('human_review_gate').status, 'PASS');
  assert.equal(acceptance.failures.includes('art_direction_gate'), false);
  assert.equal(acceptance.failures.includes('human_review_gate'), false);
  assert.equal(acceptance.evidence.art_direction_review_verification.valid, true);
  assert.equal(acceptance.evidence.human_review_verification.valid, true);

  const tampered = structuredClone(artDirectionReview);
  tampered.candidate_root = '0'.repeat(64);
  assert.equal(verifyUniversalArtAssetReviewReceipt(tampered, {
    reviewKind: 'ART_DIRECTION',
    genomeRoot: result.genome.genome_root,
    candidateRoot: result.candidate.candidate_root,
    fileInspectionRoot: result.fileInspection.inspection_root
  }).valid, false);
  const providerDeclaration = {status: 'PASS', receipt_status: 'VERIFIED', decision: 'APPROVED'};
  const declarationOnly = evaluateUniversalArtAssetAcceptance({
    genome: result.genome,
    workspace: result.workspace,
    candidate: result.candidate,
    execution: result.execution,
    provider: result.execution.provider_id,
    fileInspection: result.fileInspection,
    providerEvidence: {art_direction: providerDeclaration, human_review: providerDeclaration}
  });
  assert.ok(declarationOnly.failures.includes('art_direction_gate'));
  assert.ok(declarationOnly.failures.includes('human_review_gate'));
});

test('quality tier requires an independently verified proof bound to local inspection metrics', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-quality-'));
  const result = generateUniversalArtAsset(characterInput, {outDir});
  const qualityProof = createQualityProof({result});
  assert.equal(verifyUniversalArtAssetQualityProof(qualityProof, {
    qualityTier: result.genome.quality_tier,
    genomeRoot: result.genome.genome_root,
    candidateRoot: result.candidate.candidate_root,
    fileInspectionRoot: result.fileInspection.inspection_root,
    inspection: result.fileInspection,
    targetPlatforms: result.genome.target_platforms
  }).valid, true);

  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome: result.genome,
    workspace: result.workspace,
    candidate: result.candidate,
    execution: result.execution,
    provider: result.execution.provider_id,
    fileInspection: result.fileInspection,
    providerEvidence: {quality_tier: {status: 'PASS'}},
    qualityProof
  });
  const qualityGate = acceptance.gates.find(gate => gate.gate === 'quality_tier_gate');
  assert.equal(qualityGate.status, 'PASS');
  assert.equal(acceptance.failures.includes('quality_tier_gate'), false);
  assert.equal(acceptance.evidence.quality_proof_verification.valid, true);

  const tampered = structuredClone(qualityProof);
  tampered.metrics.texture_size += 1;
  assert.equal(verifyUniversalArtAssetQualityProof(tampered, {
    qualityTier: result.genome.quality_tier,
    genomeRoot: result.genome.genome_root,
    candidateRoot: result.candidate.candidate_root,
    fileInspectionRoot: result.fileInspection.inspection_root,
    inspection: result.fileInspection,
    targetPlatforms: result.genome.target_platforms
  }).valid, false);
});

test('AAA provenance and license gate requires an independent audit bound to every candidate artifact root', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-provenance-'));
  const result = generateUniversalArtAsset(characterInput, {outDir});
  const proof = createProvenanceLicenseProof({result});
  const binding = {
    genomeRoot: result.genome.genome_root,
    candidateRoot: result.candidate.candidate_root,
    fileInspectionRoot: result.fileInspection.inspection_root,
    providerId: result.execution.provider_id,
    seed: result.genome.ragf_genome.seed,
    artifactRoots: Object.fromEntries(Object.entries(result.candidate.artifacts).map(([role, artifact]) => [role, artifact.root]))
  };
  assert.equal(verifyUniversalArtAssetProvenanceLicenseReceipt(proof, binding).valid, true);

  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome: result.genome,
    workspace: result.workspace,
    candidate: result.candidate,
    execution: result.execution,
    provider: result.execution.provider_id,
    fileInspection: result.fileInspection,
    providerEvidence: {
      provenance: {status: 'PASS'},
      license: {status: 'PASS'}
    },
    provenanceLicenseProof: proof
  });
  const gate = acceptance.gates.find(item => item.gate === 'provenance_license_gate');
  assert.equal(gate.status, 'PASS');
  assert.equal(acceptance.failures.includes('provenance_license_gate'), false);
  assert.equal(acceptance.metrics.provenance_license_proof_status, 'PASS');
  assert.equal(acceptance.evidence.provenance_license_proof_verification.valid, true);

  const tampered = structuredClone(proof);
  tampered.provenance.seed = `${tampered.provenance.seed}-tampered`;
  assert.equal(verifyUniversalArtAssetProvenanceLicenseReceipt(tampered, binding).valid, false);

  const tamperedArtifact = structuredClone(proof);
  tamperedArtifact.artifact_roots['mesh-glb'] = '0'.repeat(64);
  const resealedArtifactTamper = seal(tamperedArtifact, 'receipt_root');
  assert.equal(verifyUniversalArtAssetProvenanceLicenseReceipt(resealedArtifactTamper, binding).valid, false);
});

test('unified independent evidence bundle feeds the four AAA evidence gates without granting authority', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-evidence-bundle-'));
  const result = generateUniversalArtAsset(characterInput, {outDir});
  const provenanceLicenseProof = createProvenanceLicenseProof({result});
  const artDirectionReview = createReviewReceipt({result, reviewKind: 'ART_DIRECTION'});
  const humanReview = createReviewReceipt({result, reviewKind: 'HUMAN_ART'});
  const qualityProof = createQualityProof({result});
  const bundle = createUniversalArtAssetEvidenceBundle({
    genome: result.genome,
    candidate: result.candidate,
    fileInspection: result.fileInspection,
    providerId: result.execution.provider_id,
    targetPlatforms: result.genome.target_platforms,
    provenanceLicenseProof,
    artDirectionReview,
    qualityProof,
    humanReview
  });
  const binding = {
    qualityTier: result.genome.quality_tier,
    genomeRoot: result.genome.genome_root,
    candidateRoot: result.candidate.candidate_root,
    fileInspectionRoot: result.fileInspection.inspection_root,
    providerId: result.execution.provider_id,
    seed: result.genome.ragf_genome.seed,
    artifactRoots: Object.fromEntries(Object.entries(result.candidate.artifacts).map(([role, artifact]) => [role, artifact.root])),
    inspection: result.fileInspection,
    targetPlatforms: result.genome.target_platforms
  };
  assert.equal(bundle.status, 'VERIFIED');
  assert.equal(verifyUniversalArtAssetEvidenceBundle(bundle, binding).valid, true);

  const acceptance = evaluateUniversalArtAssetAcceptance({
    genome: result.genome,
    workspace: result.workspace,
    candidate: result.candidate,
    execution: result.execution,
    provider: result.execution.provider_id,
    fileInspection: result.fileInspection,
    providerEvidence: {
      provenance: {status: 'PASS'},
      license: {status: 'PASS'},
      art_direction: {status: 'PASS'},
      human_review: {status: 'PASS'},
      quality_tier: {status: 'PASS'}
    },
    evidenceBundle: bundle
  });
  const gates = new Map(acceptance.gates.map(gate => [gate.gate, gate]));
  for (const gateName of ['provenance_license_gate', 'art_direction_gate', 'quality_tier_gate', 'human_review_gate']) {
    assert.equal(gates.get(gateName).status, 'PASS', gateName);
  }
  assert.equal(acceptance.metrics.evidence_bundle_status, 'PASS');
  assert.equal(acceptance.evidence.evidence_bundle_verification.valid, true);

  const tampered = structuredClone(bundle);
  tampered.artifact_roots['mesh-glb'] = '0'.repeat(64);
  const resealedTamper = seal(tampered, 'bundle_root');
  assert.equal(verifyUniversalArtAssetEvidenceBundle(resealedTamper, binding).valid, false);
});

test('batch Forge isolates multiple assets and verifies a cross-asset artifact root index', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-batch-'));
  const batch = generateUniversalArtAssetBatch([
    {...characterInput, asset_key: 'guardian-character'},
    {
      ...characterInput,
      asset_key: 'ice-relic-prop',
      description: '一枚用于冰晶遗迹祭坛的三维古代护符。',
      asset_profile: 'prop',
      asset_kind: 'prop-3d',
      seed: 'universal-art-forge-prop-batch-seed'
    }
  ], {outDir});
  assert.equal(batch.assets.length, 2);
  assert.equal(batch.batch.status, 'BLOCKED');
  assert.equal(batch.batch.summary.asset_count, 2);
  assert.equal(batch.batch.summary.blocked_count, 2);
  assert.equal(batch.batch.summary.acceptance_pass_count, 0);
  assert.ok(batch.batch.summary.unique_artifact_root_count > 0);
  assert.equal(batch.verification.valid, true);
  assert.equal(verifyUniversalArtAssetBatch(batch.batch, {assetResults: batch.assets}).valid, true);
  assert.ok(fs.existsSync(path.join(outDir, 'assets', '001-guardian-character', 'universal-art-asset-forge.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'assets', '002-ice-relic-prop', 'universal-art-asset-forge.json')));

  const tampered = structuredClone(batch.batch);
  tampered.artifact_root_index = {};
  assert.equal(verifyUniversalArtAssetBatch(tampered).valid, false);

  const tamperedSummary = structuredClone(batch.batch);
  const firstAsset = tamperedSummary.assets[0];
  const oldRoot = firstAsset.artifact_roots['mesh-glb'];
  const replacementRoot = firstAsset.artifact_roots['mesh-lod1-glb'];
  firstAsset.artifact_roots['mesh-glb'] = replacementRoot;
  tamperedSummary.artifact_root_index[oldRoot] = tamperedSummary.artifact_root_index[oldRoot].filter(reference => !(reference.asset_key === firstAsset.asset_key && reference.role === 'mesh-glb'));
  if (tamperedSummary.artifact_root_index[oldRoot].length === 0) delete tamperedSummary.artifact_root_index[oldRoot];
  tamperedSummary.artifact_root_index[replacementRoot].push({asset_key: firstAsset.asset_key, role: 'mesh-glb'});
  tamperedSummary.artifact_root_index[replacementRoot].sort((left, right) => `${left.asset_key}:${left.role}`.localeCompare(`${right.asset_key}:${right.role}`, 'en'));
  tamperedSummary.summary.unique_artifact_root_count = Object.keys(tamperedSummary.artifact_root_index).length;
  const resealedSummaryTamper = seal(tamperedSummary, 'batch_root');
  assert.equal(verifyUniversalArtAssetBatch(resealedSummaryTamper, {assetResults: batch.assets}).valid, false);
  assert.throws(() => generateUniversalArtAssetBatch([
    {...characterInput, asset_key: 'duplicate'},
    {...characterInput, asset_key: 'duplicate', seed: 'duplicate-seed-2'}
  ], {outDir: fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-batch-duplicate-'))}), /UNIVERSAL_ART_ASSET_BATCH_DUPLICATE_ASSET_KEY/);
});

test('holdout report binds new-seed structural candidates and fails closed on root reuse', () => {
  const baseline = generateUniversalArtAssetBatch([
    {...characterInput, asset_key: 'baseline-guardian-character', seed: 'universal-art-forge-holdout-baseline-character-seed'},
    {
      ...characterInput,
      asset_key: 'baseline-ice-relic-prop',
      description: '一枚用于冰晶遗迹祭坛的三维古代护符。',
      asset_profile: 'prop',
      asset_kind: 'prop-3d',
      seed: 'universal-art-forge-holdout-baseline-prop-seed'
    }
  ], {outDir: fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-holdout-baseline-'))});
  const holdout = generateUniversalArtAssetBatch([
    {
      ...characterInput,
      asset_key: 'holdout-aurora-guardian-character',
      description: '一名在极光废墟巡逻的三维女守卫，穿着带有冰纹的轻型护甲。',
      seed: 'universal-art-forge-holdout-character-seed'
    },
    {
      ...characterInput,
      asset_key: 'holdout-observatory-prop',
      description: '一枚用于荒原观测塔的三维晶体测距仪，具有可复用的材质与碰撞边界。',
      asset_profile: 'prop',
      asset_kind: 'prop-3d',
      seed: 'universal-art-forge-holdout-prop-seed'
    }
  ], {outDir: fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-holdout-candidate-'))});
  const report = createUniversalArtAssetHoldoutReport({
    holdout_id: 'urrf-holdout-unit-v01',
    batch: holdout,
    expected_profiles: ['character', 'prop'],
    baseline_roots: {
      batch_root: baseline.batch.batch_root,
      genome_roots: baseline.batch.assets.map(asset => asset.genome_root),
      candidate_roots: baseline.batch.assets.map(asset => asset.candidate_root),
      forge_roots: baseline.batch.assets.map(asset => asset.forge_root)
    }
  });
  assert.equal(report.status, 'CANDIDATE_HOLDOUT_PASS');
  assert.equal(report.summary.structural_pass_count, 2);
  assert.equal(report.summary.acceptance_pass_count, 0);
  assert.deepEqual(report.coverage.observed_profiles, ['character', 'prop']);
  assert.deepEqual(report.coverage.missing_profiles, []);
  assert.equal(report.coverage.baseline_overlap_roots.length, 0);
  assert.equal(verifyUniversalArtAssetHoldoutReport(report).valid, true);
  assert.equal(verifyUniversalArtAssetHoldoutReport(report, {batch: holdout}).valid, true);

  const tampered = structuredClone(report);
  tampered.assets[0].candidate_root = tampered.assets[1].candidate_root;
  const resealedTamper = seal(tampered, 'holdout_root');
  assert.equal(verifyUniversalArtAssetHoldoutReport(resealedTamper).valid, false);
  assert.equal(verifyUniversalArtAssetHoldoutReport(resealedTamper, {batch: holdout}).valid, false);
  assert.throws(() => createUniversalArtAssetHoldoutReport({
    batch: holdout,
    expected_profiles: ['character', 'prop'],
    baseline_roots: {}
  }), /UNIVERSAL_ART_ASSET_HOLDOUT_BASELINE_BATCH_ROOT_REQUIRED/);
});

test('assembly binds materialized batch GLBs and lowers selected LODs into a VSR projection envelope', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-universal-art-assembly-'));
  const batch = generateUniversalArtAssetBatch([
    {...characterInput, asset_key: 'guardian-character', seed: 'universal-art-forge-assembly-character-seed'},
    {
      ...characterInput,
      asset_key: 'ice-relic-prop',
      description: '一枚用于冰晶遗迹祭坛的三维古代护符。',
      asset_profile: 'prop',
      asset_kind: 'prop-3d',
      seed: 'universal-art-forge-assembly-prop-seed'
    }
  ], {outDir});
  const assembly = createUniversalArtAssetAssembly({
    batch: batch.batch,
    assetResults: batch.assets,
    scene_id: 'urrf-universal-art-assembly-unit',
    world_id: 'world:urrf-universal-art-assembly-unit',
    placements_mm: [
      {asset_key: 'guardian-character', translation_mm: [1200, 0, -900]},
      {asset_key: 'ice-relic-prop', translation_mm: [-1200, 0, 900]}
    ],
    lod_by_asset: {'guardian-character': 0, 'ice-relic-prop': 1},
    load_radius: 72,
    unload_radius: 96
  });
  assert.equal(assembly.asset_count, 2);
  assert.equal(assembly.status, 'BLOCKED');
  assert.deepEqual(assembly.assets.map(asset => asset.selected_lod), [0, 1]);
  assert.equal(assembly.assets[0].source.mesh.format, 'model/gltf-binary');
  assert.equal(assembly.assets[0].source.pbr.channels.length, 4);
  assert.equal(verifyUniversalArtAssetAssembly(assembly, {batch: batch.batch, assetResults: batch.assets}).valid, true);

  const projection = lowerUniversalArtAssetAssemblyToVsr(assembly);
  assert.equal(projection.format, 'urrf.universal-art-asset-vsr-projection.v0.1');
  assert.equal(projection.asset_count, 2);
  assert.equal(projection.dependency_count, 8);
  assert.equal(projection.assets[0].dependencies.length, 4);
  assert.equal(projection.dependencies.filter(asset => asset.kind === 'texture').length, 8);
  assert.equal(projection.assets[0].transform.translation[0], 1.2);
  assert.equal(projection.assets[1].transform.translation[2], 0.9);
  assert.equal(projection.assets[0].sha256, assembly.assets[0].source.mesh.sha256);
  assert.notEqual(projection.assets[0].sha256, assembly.assets[0].source.mesh.file_root);
  assert.equal(verifyUniversalArtAssetVsrProjection(projection, {assembly}).valid, true);
  assert.equal(projection.authoritative, false);
  assert.equal(projection.authority.provider_can_write_authoritative_world_state, false);

  const materialized = materializeUniversalArtAssetVsrProjection(projection, {assembly});
  assert.equal(materialized.materialization.status, 'READY_FOR_VSR_IMPORT');
  assert.equal(materialized.materialization.dependency_count, 8);
  assert.equal(materialized.payloads.size, projection.assets.length + projection.dependencies.length);
  assert.equal(materialized.catalog.length, projection.assets.length + projection.dependencies.length);
  assert.equal(materialized.materialization.total_byte_length, [...materialized.payloads.values()].reduce((sum, bytes) => sum + bytes.byteLength, 0));
  assert.equal(verifyUniversalArtAssetVsrMaterialization(materialized.materialization, {
    projection,
    assembly,
    payloads: materialized.payloads
  }).valid, true);
  const tamperedPayloads = new Map(materialized.payloads);
  const tamperedBytes = Uint8Array.from(tamperedPayloads.get(projection.assets[0].id));
  tamperedBytes[0] ^= 1;
  tamperedPayloads.set(projection.assets[0].id, tamperedBytes);
  assert.equal(verifyUniversalArtAssetVsrMaterialization(materialized.materialization, {
    projection,
    assembly,
    payloads: tamperedPayloads
  }).valid, false);
  const tamperedPbrPayloads = new Map(materialized.payloads);
  const pbrDependency = projection.dependencies.find(asset => asset.metadata.pbr_role === 'normal');
  assert.ok(pbrDependency);
  const tamperedPbrBytes = Uint8Array.from(tamperedPbrPayloads.get(pbrDependency.id));
  tamperedPbrBytes[0] ^= 1;
  tamperedPbrPayloads.set(pbrDependency.id, tamperedPbrBytes);
  assert.equal(verifyUniversalArtAssetVsrMaterialization(materialized.materialization, {
    projection,
    assembly,
    payloads: tamperedPbrPayloads
  }).valid, false);
  assert.throws(() => materializeUniversalArtAssetVsrProjection(projection, {assembly, max_total_bytes: 1}), /UNIVERSAL_ART_ASSET_VSR_MATERIALIZATION_BUDGET_EXCEEDED/);

  const tampered = structuredClone(assembly);
  tampered.assets[0].source.mesh.file_root = '0'.repeat(64);
  tampered.assets[0] = seal(tampered.assets[0], 'asset_root');
  const resealedTamper = seal(tampered, 'assembly_root');
  assert.equal(verifyUniversalArtAssetAssembly(resealedTamper, {batch: batch.batch, assetResults: batch.assets}).valid, false);
  const tamperedProjection = structuredClone(projection);
  tamperedProjection.assets[0].metadata.batch_root = '0'.repeat(64);
  assert.equal(verifyUniversalArtAssetVsrProjection(tamperedProjection, {assembly}).valid, false);
  const tamperedProjectionPayload = structuredClone(projection);
  tamperedProjectionPayload.assets[0].sha256 = '0'.repeat(64);
  const resealedProjectionPayload = seal(tamperedProjectionPayload, 'projection_root');
  assert.equal(verifyUniversalArtAssetVsrProjection(resealedProjectionPayload, {assembly}).valid, false);

  const meshPath = path.resolve(assembly.assets[0].source.output_directory, assembly.assets[0].source.mesh.relative_path);
  const originalMesh = fs.readFileSync(meshPath);
  const changedMesh = Buffer.from(originalMesh);
  changedMesh[changedMesh.length - 1] ^= 1;
  fs.writeFileSync(meshPath, changedMesh);
  try {
    assert.equal(verifyUniversalArtAssetAssembly(assembly, {batch: batch.batch, assetResults: batch.assets}).valid, false);
  } finally {
    fs.writeFileSync(meshPath, originalMesh);
  }
  assert.throws(() => createUniversalArtAssetAssembly({
    batch: batch.batch,
    assetResults: batch.assets,
    placements_mm: [{asset_key: 'guardian-character', translation_mm: [1000001, 0, 0]}]
  }), /UNIVERSAL_ART_ASSET_ASSEMBLY_PLACEMENT_INVALID/);
  assert.throws(() => createUniversalArtAssetAssembly({
    batch: batch.batch,
    assetResults: batch.assets,
    lod_by_asset: {'guardian-character': 4}
  }), /UNIVERSAL_ART_ASSET_ASSEMBLY_LOD_FILE_INVALID/);
});
