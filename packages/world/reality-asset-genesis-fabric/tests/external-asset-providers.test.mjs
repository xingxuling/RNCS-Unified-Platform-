import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeIntent, createGenome, seal} from '../src/index.mjs';
import {
  ASSET_PROVIDER_MANIFEST_FORMAT,
  AssetGenerationJob,
  createAssetGenerationJob,
  transitionAssetGenerationJob,
  validateAssetProviderManifest,
  normalizeAssetProviderResult
} from '../src/index.mjs';
import {
  auditExternalProviderLicenses,
  AssetProviderRegistry,
  createExternalAssetProviderAdapters,
  createInfinigenProvider,
  createMakeItAnimatableProvider,
  createMockAssetProvider,
  createSpark3DGSProvider,
  createTripoSFProvider,
  createTripoSRProvider,
  createTrellis2Provider,
  externalAssetProviderManifests
} from '../src/index.mjs';
import {createRepresentationRef} from '@taowind/rncs-core-contract';
import {
  createAssetCandidateFromProviderResult,
  createLivingAssetFamilyCandidate,
  createRNCSAssetCommitRequest,
  commitLivingAssetToRNCS,
  evaluateAssetProductionCourt
} from '../src/index.mjs';
import {
  createAssetEvidenceLedger,
  verifyAssetEvidenceLedger
} from '../src/index.mjs';
import {
  createLAFAssetPackageCandidate,
  validateLAFAssetPackageCandidate
} from '../src/index.mjs';
import {
  createVillageBlacksmithRequirement,
  createWorldAssetPlacementCandidate,
  resolveWorldAssetRequirement
} from '../src/index.mjs';

const intent = normalizeIntent({
  description: '一名需要进入村庄铁匠铺工作的三维铁匠角色。',
  asset_kind: 'character-3d',
  seed: 'blacksmith-seed',
  target_platforms: ['desktop', 'mobile'],
  required_outputs: ['mesh-glb']
});
const genome = createGenome(intent, {
  asset_id: 'asset:blacksmith',
  name: 'Village Blacksmith',
  tags: ['blacksmith']
});

function mockPipeline() {
  const provider = createMockAssetProvider();
  const execution = provider.generate({genome, asset_id: genome.identity.asset_id, seed: genome.seed});
  const candidate = createAssetCandidateFromProviderResult({
    result: execution.result,
    provider: execution.provider,
    job: execution.job,
    genome,
    assetIntent: intent
  });
  const court = evaluateAssetProductionCourt({candidate, provider: execution.provider, genome});
  return {provider, execution, candidate, court};
}

test('external manifests expose the six required provider organs', () => {
  const manifests = externalAssetProviderManifests();
  assert.equal(manifests.length, 6);
  assert.deepEqual(manifests.map(item => item.id).sort(), [
    'provider:external:infinigen',
    'provider:external:make-it-animatable',
    'provider:external:spark-2.1.0',
    'provider:external:trellis-2',
    'provider:external:triposf',
    'provider:external:triposr'
  ]);
  for (const manifest of manifests) {
    assert.equal(manifest.format, ASSET_PROVIDER_MANIFEST_FORMAT);
    assert.equal(validateAssetProviderManifest(manifest).valid, true);
    assert.equal(manifest.authority.owns_authoritative_world_state, false);
    assert.equal(manifest.authority.may_emit_candidate, true);
  }
});

test('provider capabilities preserve the intended architectural roles', () => {
  const byId = Object.fromEntries(externalAssetProviderManifests().map(item => [item.id, item]));
  assert.ok(byId['provider:external:trellis-2'].capabilities.includes('asset.generate.3d.production'));
  assert.ok(byId['provider:external:trellis-2'].capabilities.includes('asset.generate.pbr'));
  assert.ok(byId['provider:external:infinigen'].capabilities.includes('world.asset.environment'));
  assert.ok(byId['provider:external:make-it-animatable'].capabilities.includes('asset.skin.predict'));
  assert.ok(byId['provider:external:triposr'].capabilities.includes('asset.generate.3d.preview'));
  assert.ok(byId['provider:external:triposf'].capabilities.includes('asset.refine.geometry'));
  assert.ok(byId['provider:external:spark-2.1.0'].capabilities.includes('representation.visual.render'));
  assert.ok(byId['provider:external:spark-2.1.0'].capabilities.includes('asset.gaussian.build-lod'));
  assert.equal(byId['provider:external:triposr'].metadata.quality_tier, 'PREVIEW');
  assert.equal(byId['provider:external:triposf'].metadata.main_generator, false);
});

test('AssetProviderRegistry performs capability negotiation without granting authority', () => {
  const registry = new AssetProviderRegistry(externalAssetProviderManifests());
  const production = registry.negotiate({
    capabilities: ['asset.generate.3d.production', 'asset.generate.mesh'],
    quality_tier: 'PRODUCTION'
  });
  assert.equal(production.eligible, true);
  assert.equal(production.selected_provider_id, 'provider:external:trellis-2');
  assert.equal(registry.findByCapability('asset.refine.geometry')[0].id, 'provider:external:triposf');
  assert.equal(registry.get('provider:external:trellis-2').authority.owns_authoritative_world_state, false);
});

test('license audit verifies upstream code licenses but blocks default commercial dependencies', () => {
  const audit = auditExternalProviderLicenses();
  assert.equal(audit.entries.length, 6);
  assert.deepEqual(Object.fromEntries(audit.entries.map(item => [item.provider_id, item.code_license])), {
    'provider:external:spark-2.1.0': 'MIT',
    'provider:external:trellis-2': 'MIT',
    'provider:external:infinigen': 'BSD-3-Clause',
    'provider:external:make-it-animatable': 'MIT',
    'provider:external:triposr': 'MIT',
    'provider:external:triposf': 'MIT'
  });
  assert.ok(audit.entries.every(item => item.default_commercial_release === false));
  assert.ok(audit.entries.every(item => item.blocked_reasons.includes('DEPENDENCY_LICENSE_AUDIT_REQUIRED')));
});

test('job lifecycle is explicit and rejects invalid transitions', () => {
  let job = createAssetGenerationJob({provider_id: 'provider:test', asset_id: 'asset:test', operation: 'generate'});
  job = transitionAssetGenerationJob(job, 'PREPARING');
  job = transitionAssetGenerationJob(job, 'RUNNING');
  job = transitionAssetGenerationJob(job, 'VALIDATING');
  job = transitionAssetGenerationJob(job, 'COMPLETED');
  assert.deepEqual(job.history.map(item => item.state), ['QUEUED', 'PREPARING', 'RUNNING', 'VALIDATING', 'COMPLETED']);
  assert.throws(() => transitionAssetGenerationJob(job, 'FAILED'), /ASSET_JOB_INVALID_TRANSITION/);
  const cancelled = new AssetGenerationJob({provider_id: 'provider:test'}).cancel('user-request');
  assert.equal(cancelled.state, 'CANCELLED');
});

test('external adapters are contract verified but do not claim runtime execution', () => {
  const adapters = createExternalAssetProviderAdapters();
  assert.equal(adapters.length, 6);
  for (const adapter of adapters) {
    assert.equal(adapter.healthCheck().status, 'CONTRACT_ONLY');
    const result = adapter.generate({asset_id: 'asset:test', seed: 'seed'});
    assert.equal(result.status, 'CONTRACT_VERIFIED_RUNTIME_NOT_EXECUTED');
    assert.equal(result.result, null);
    assert.equal(result.job.state, 'FAILED');
    assert.equal(result.failure.code, 'PROVIDER_RUNTIME_NOT_EXECUTED');
  }
});

test('named provider factories preserve provider identity', () => {
  assert.equal(createSpark3DGSProvider().manifest.id, 'provider:external:spark-2.1.0');
  assert.equal(createTrellis2Provider().manifest.id, 'provider:external:trellis-2');
  assert.equal(createInfinigenProvider().manifest.id, 'provider:external:infinigen');
  assert.equal(createMakeItAnimatableProvider().manifest.id, 'provider:external:make-it-animatable');
  assert.equal(createTripoSRProvider().manifest.id, 'provider:external:triposr');
  assert.equal(createTripoSFProvider().manifest.id, 'provider:external:triposf');
});

test('Spark manifest exposes a bounded Gaussian representation contract', () => {
  const manifest = createSpark3DGSProvider().manifest;
  assert.equal(manifest.providerType, 'representation');
  assert.equal(manifest.runtimeStatus, 'CONTRACT_ONLY');
  assert.deepEqual(manifest.representation.kinds, ['gaussian-splats']);
  assert.ok(manifest.authority.scope.includes('visual_projection'));
  assert.equal(manifest.authority.owns_authoritative_world_state, false);
  assert.ok(manifest.representation.profiles.some(profile => profile.profile_id === 'spark.packed-splats'));
  assert.ok(manifest.metadata.unsupported_claims.includes('COLMAP-or-SfM'));
  assert.equal(manifest.license.data_status, 'REMOTE_EXAMPLE_ASSETS_NOT_AUDITED');
});

test('Spark representation reference persists through the existing RAGF candidate path', () => {
  const provider = createSpark3DGSProvider().manifest;
  const reference = createRepresentationRef({
    provider_id: provider.id,
    provider_root: provider.manifest_root,
    representation_kind: 'gaussian-splats',
    representation_formats: ['application/vnd.spark.rad'],
    content_root: 'c'.repeat(64),
    representation_profile: {profile_id: 'spark.packed-splats', encoding: 'PackedSplats', formats: ['application/vnd.spark.rad']},
    detail_policy: provider.representation.detail_policy,
    residency_policy: provider.representation.residency_policy,
    authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
    availability: 'CONTRACT_ONLY',
    provenance: {upstream_url: provider.upstream.url, source_revision: provider.upstream.revision, source_archive_sha256: provider.upstream.source_archive_sha256},
    evidence: {provider_manifest_root: provider.manifest_root, notes: 'contract-only test fixture'}
  });
  const result = normalizeAssetProviderResult({
    asset_id: 'asset:spark-representation-fixture',
    format: 'application/vnd.spark.rad',
    files: [{name: 'fixture.rad', role: 'gaussian-rad', format: 'application/vnd.spark.rad', base64: Buffer.from('spark-contract-fixture').toString('base64')}],
    representation_refs: [reference],
    provenance: {upstream_url: provider.upstream.url, source_revision: provider.upstream.revision, generator_version: provider.version, seed: 'spark-contract-fixture'},
    license: provider.license
  }, {provider});
  const candidate = createAssetCandidateFromProviderResult({result, provider});
  assert.equal(result.authoritative, false);
  assert.equal(result.representation_refs[0].availability, 'CONTRACT_ONLY');
  assert.equal(candidate.authoritative, false);
  assert.equal(candidate.representation_refs[0].representation_root, reference.representation_root);
});

test('Spark absent runtime reports CONTRACT_ONLY instead of a false execution success', () => {
  const execution = createSpark3DGSProvider().generate({asset_id: 'asset:spark-runtime-absent', seed: 'spark-runtime-absent'});
  assert.equal(execution.status, 'CONTRACT_VERIFIED_RUNTIME_NOT_EXECUTED');
  assert.equal(execution.result, null);
  assert.equal(execution.job.state, 'FAILED');
  assert.equal(execution.failure.code, 'PROVIDER_RUNTIME_NOT_EXECUTED');
});

test('mock provider completes normalized result with provenance and evidence', () => {
  const {execution} = mockPipeline();
  assert.equal(execution.status, 'COMPLETED');
  assert.equal(execution.job.state, 'COMPLETED');
  assert.ok(execution.result.result_root.match(/^[a-f0-9]{64}$/));
  assert.ok(execution.result.files.length >= 8);
  assert.equal(execution.result.authoritative, false);
  assert.equal(execution.result.evidence.candidate_only, true);
  assert.equal(execution.result.provenance.seed, genome.seed);
  assert.equal(execution.result.license.status, 'VERIFIED');
});

test('provider success does not bypass the Production Court', () => {
  const {candidate, provider} = mockPipeline();
  const weak = seal({...candidate, provider_evidence: {provider_success: true}, candidate_root: ''}, 'candidate_root');
  const court = evaluateAssetProductionCourt({candidate: weak, provider, genome});
  assert.equal(court.pass, false);
  assert.ok(court.failures.includes('topology_gate'));
  assert.ok(court.failures.includes('rig_gate'));
  assert.ok(court.failures.includes('vsr_projection_gate'));
});

test('complete mock candidate passes all Production Court gates', () => {
  const {candidate, provider, court} = mockPipeline();
  assert.equal(court.status, 'PASS');
  assert.equal(court.pass, true);
  assert.equal(court.promotion_allowed, true);
  assert.ok(Object.values(court.gates).every(Boolean));
  assert.equal(candidate.authoritative, false);
  assert.equal(provider.manifest.authority.owns_authoritative_world_state, false);
});

test('Preview result is never promoted as Production', () => {
  const provider = createTripoSRProvider({runner: () => ({
    asset_id: genome.identity.asset_id,
    quality_tier: 'PREVIEW',
    files: [{name: 'preview.glb', role: 'mesh-glb', format: 'model/gltf-binary', base64: Buffer.from('preview').toString('base64')}],
    geometry: {triangle_count: 120, glb_valid: true, topology_status: 'manifold'},
    materials: {material_count: 1},
    pbr_channels: ['baseColor', 'normal', 'orm'],
    generator_version: 'triposr-test',
    parameters: {preview: true},
    seed: 'preview-seed',
    evidence: {
      provider_success: true,
      geometry: {status: 'PASS'},
      topology: {status: 'PASS'},
      material_pbr: {status: 'PASS'},
      collision: {status: 'PASS'},
      lod_platform: {status: 'PASS'},
      license: {status: 'PASS'},
      provenance: {status: 'PASS'},
      vsr_projection: 'PASS',
      rsr_simulation: 'PASS'
    }
  })});
  const execution = provider.generate({genome, asset_id: genome.identity.asset_id, quality_tier: 'PREVIEW', seed: 'preview-seed'});
  const candidate = createAssetCandidateFromProviderResult({result: execution.result, provider: execution.provider, job: execution.job, genome, assetIntent: intent});
  const court = evaluateAssetProductionCourt({candidate, provider: execution.provider, genome});
  assert.equal(candidate.quality_tier, 'PREVIEW');
  assert.equal(court.pass, false);
  assert.equal(court.gates.quality_tier_gate, false);
  assert.equal(court.status, 'FAIL');
});

test('Living Asset Family remains a candidate until RNCS authority approves commit', () => {
  const {candidate, court} = mockPipeline();
  const family = createLivingAssetFamilyCandidate({candidate, court, assetIntent: intent, genome});
  assert.equal(family.lifecycle, 'LIVING_ASSET_CANDIDATE');
  assert.equal(family.authoritative, false);
  assert.equal(family.rncs_commit_status, 'NOT_COMMITTED');
  const request = createRNCSAssetCommitRequest({livingAssetFamily: family, court});
  assert.equal(request.status, 'PROPOSED');
  assert.equal(request.provider_may_not_commit, true);
  assert.throws(() => commitLivingAssetToRNCS({livingAssetFamily: family, court}), /RNCS_AUTHORITY_APPROVAL_REQUIRED/);
  assert.equal(commitLivingAssetToRNCS({livingAssetFamily: family, court, authorityDecision: 'APPROVED'}).status, 'COMMITTED');
});

test('ALWR blacksmith requirement resolves through RAGF provider selection', () => {
  const requirement = createVillageBlacksmithRequirement({worldSeed: {seed: 'village-001', biome: 'snow'}});
  assert.equal(requirement.source, 'ALWR.GameBrain');
  assert.equal(requirement.role, 'blacksmith');
  assert.equal(requirement.selection_policy.require_candidate_only, true);
  assert.ok(requirement.post_capabilities.includes('asset.rig.predict'));
  const resolution = resolveWorldAssetRequirement(requirement);
  assert.equal(resolution.eligible, true);
  assert.equal(resolution.selected_provider_id, 'provider:external:trellis-2');
});

test('world placement candidate is sealed and does not mutate world authority', () => {
  const {candidate, court} = mockPipeline();
  const requirement = createVillageBlacksmithRequirement({worldSeed: 'village-002'});
  const placement = createWorldAssetPlacementCandidate({
    requirement,
    candidate,
    court,
    placement: {position: [4, 0, -2]}
  });
  assert.equal(placement.status, 'READY_FOR_WORLD_COMMIT');
  assert.equal(placement.authoritative_world_state_mutated, false);
  assert.ok(placement.placement_root.match(/^[a-f0-9]{64}$/));
});

test('Evidence Ledger binds provider, job, result, court and authority boundary', () => {
  const {provider, execution, candidate, court} = mockPipeline();
  const requirement = createVillageBlacksmithRequirement({worldSeed: 'village-003'});
  const ledger = createAssetEvidenceLedger({
    assetIntent: intent,
    genome,
    requirement,
    provider,
    job: execution.job,
    result: execution.result,
    candidate,
    court
  });
  assert.equal(verifyAssetEvidenceLedger(ledger).valid, true);
  assert.equal(ledger.status, 'RECORDED');
  assert.equal(ledger.authority.provider_can_write_authoritative_world_state, false);
  assert.equal(ledger.entries.find(item => item.evidence_id === 'production-court').status, 'PASS');
  assert.equal(ledger.roots.candidate_root, candidate.candidate_root);
});

test('RAGF candidate closes into a LAF package binding candidate without mutating LAF authority', () => {
  const {provider, execution, candidate, court} = mockPipeline();
  const family = createLivingAssetFamilyCandidate({candidate, court, assetIntent: intent, genome});
  const ledger = createAssetEvidenceLedger({
    assetIntent: intent,
    genome,
    provider,
    job: execution.job,
    result: execution.result,
    candidate,
    court
  });
  const binding = createLAFAssetPackageCandidate({candidate, court, livingAssetFamily: family, evidenceLedger: ledger});
  assert.equal(binding.laf_target, 'laf.package.v1');
  assert.equal(binding.status, 'CANDIDATE_FOR_LAF_BINDING');
  assert.equal(binding.authority.provider_can_bind_authoritative_laf, false);
  assert.equal(validateLAFAssetPackageCandidate(binding).valid, true);
});

test('schemas for the new contracts are present and declare the authority boundary', () => {
  const names = [
    'asset-provider-manifest.v0.1.schema.json',
    'asset-generation-job.v0.1.schema.json',
    'asset-provider-result.v0.1.schema.json',
    'asset-production-court.v0.1.schema.json',
    'asset-requirement.v0.1.schema.json',
    'asset-evidence-ledger.v0.1.schema.json'
  ];
  for (const name of names) {
    const schema = JSON.parse(fs.readFileSync(new URL('../schemas/' + name, import.meta.url), 'utf8'));
    assert.ok(schema.required.length > 0);
  }
  const providerSchema = JSON.parse(fs.readFileSync(new URL('../schemas/asset-provider-manifest.v0.1.schema.json', import.meta.url), 'utf8'));
  assert.equal(providerSchema.properties.authority.properties.owns_authoritative_world_state.const, false);
  const resultSchema = JSON.parse(fs.readFileSync(new URL('../schemas/asset-provider-result.v0.1.schema.json', import.meta.url), 'utf8'));
  assert.equal(resultSchema.properties.representation_refs.items.$ref, '../../../kernel/rncs-core-contract/schemas/representation-reference.v0.1.schema.json');
});

test('standalone result normalization records warnings instead of asserting provider authority', () => {
  const result = normalizeAssetProviderResult({
    provider_id: 'provider:test',
    files: [{name: 'x.glb', role: 'mesh-glb', format: 'model/gltf-binary', base64: Buffer.from('x').toString('base64')}],
    warnings: ['runtime-evidence-not-present'],
    provenance: {upstream_url: 'https://example.invalid/provider', source_revision: 'test', generator_version: '0.1.0', seed: 's'},
    license: {status: 'UNVERIFIED', identifier: null}
  }, {provider: {id: 'provider:test', manifest_root: 'a'.repeat(64), version: '0.1.0'}});
  assert.equal(result.authoritative, false);
  assert.deepEqual(result.warnings, ['runtime-evidence-not-present']);
  assert.equal(result.license.status, 'UNVERIFIED');
  assert.equal(result.evidence.candidate_only, true);
});
