import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createVfxReferenceProvider,
  deriveGenomeFromIntent,
  normalizeIntent,
  verifyRepresentationRef,
  verifyVfxAssetContract,
  VFX_PROVIDER_ID,
  VFX_REPRESENTATION_KINDS
} from '../src/index.mjs';

function createGenome(seed = 'vfx-reference-test-seed') {
  return deriveGenomeFromIntent(normalizeIntent({
    description: '一个包含粒子、体积、flipbook 和曲线轨迹的冰晶爆炸特效。',
    asset_kind: 'vfx-3d',
    target_platforms: ['desktop', 'mobile', 'web'],
    seed,
    constraints: {max_particles: 96}
  }));
}

function generate(seed) {
  const genome = createGenome(seed);
  const provider = createVfxReferenceProvider();
  return {
    genome,
    provider,
    execution: provider.generate({
      genome,
      asset_id: genome.identity.asset_id,
      quality_tier: 'PRODUCTION',
      seed: genome.seed,
      request: {
        representation_contract: {
          visual_effect: {required_kinds: [...VFX_REPRESENTATION_KINDS]}
        }
      }
    })
  };
}

test('VFX reference provider emits four typed representations without a mesh shortcut', () => {
  const {genome, provider, execution} = generate('vfx-reference-four-kinds');
  assert.equal(provider.manifest.id, VFX_PROVIDER_ID);
  assert.equal(execution.status, 'COMPLETED');
  assert.equal(execution.result.files.length, 6, 'four representations, flipbook metadata, and effect graph');
  assert.deepEqual(
    execution.result.representation_refs.map(reference => reference.representation_kind),
    [...VFX_REPRESENTATION_KINDS].sort()
  );
  assert.equal(execution.result.files.some(file => /glb|mesh/i.test(`${file.role}:${file.path}`)), false);
  assert.equal(execution.result.files.some(file => file.role === 'vfx-effect-graph'), true);
  assert.equal(execution.result.evidence.representation.status, 'PASS');
  assert.equal(execution.result.evidence.vsr_projection, 'PASS');
  assert.equal(execution.result.evidence.rsr_simulation, 'PASS');
  for (const reference of execution.result.representation_refs) assert.equal(verifyRepresentationRef(reference).valid, true);
  const contract = execution.result.format_output.vfx_contract;
  assert.equal(verifyVfxAssetContract(contract, {
    genome,
    artifactRoots: contract.artifact_roots,
    requiredKinds: VFX_REPRESENTATION_KINDS
  }).valid, true);
  assert.equal(contract.authority.canonical_owner, 'RNCS');
  assert.equal(contract.authority.provider_can_write_authoritative_world_state, false);
});

test('VFX reference output is deterministic and contract tampering fails closed', () => {
  const first = generate('vfx-reference-deterministic').execution;
  const second = generate('vfx-reference-deterministic').execution;
  assert.equal(first.result.result_root, second.result.result_root);
  assert.deepEqual(first.result.files.map(file => ({path: file.path, sha256: file.sha256})), second.result.files.map(file => ({path: file.path, sha256: file.sha256})));
  const tampered = structuredClone(first.result.format_output.vfx_contract);
  tampered.artifact_roles.particle = 'mesh-glb';
  assert.equal(verifyVfxAssetContract(tampered).valid, false);
});

test('VFX contract rejects a partial representation set', () => {
  const {genome, execution} = generate('vfx-reference-partial');
  const contract = structuredClone(execution.result.format_output.vfx_contract);
  contract.representation_kinds = ['particle'];
  assert.equal(verifyVfxAssetContract(contract, {genome, requiredKinds: VFX_REPRESENTATION_KINDS}).valid, false);
});
