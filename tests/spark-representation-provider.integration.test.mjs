import assert from 'node:assert/strict';
import test from 'node:test';
import {createRepresentationRef} from '../packages/kernel/rncs-core-contract/src/index.mjs';
import {
  createAssetCandidateFromProviderResult,
  createSpark3DGSProvider,
  normalizeAssetProviderResult
} from '../packages/world/reality-asset-genesis-fabric/src/index.mjs';
import {createSpark3DGSVisualBinding, verifyVisualRepresentationBinding} from '../packages/world/visual-state-runtime/dist/packages/representation-provider/src/index.js';
import {createRepresentationObservationCandidate, verifyRepresentationObservationCandidate} from '../packages/world/reality-simulation-runtime/dist/packages/representation-observation/src/index.js';

test('Spark contract flows through RAGF to visual binding and RSR observation without authority promotion', async () => {
  const provider = createSpark3DGSProvider().manifest;
  const reference = createRepresentationRef({
    provider_id: provider.id,
    provider_root: provider.manifest_root,
    representation_kind: 'gaussian-splats',
    representation_formats: ['application/vnd.spark.rad'],
    content_root: 'c'.repeat(64),
    representation_profile: {profile_id: 'spark.packed-splats', formats: ['application/vnd.spark.rad']},
    detail_policy: provider.representation.detail_policy,
    residency_policy: provider.representation.residency_policy,
    authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
    availability: 'CONTRACT_ONLY',
    provenance: {upstream_url: provider.upstream.url, source_revision: provider.upstream.revision, source_archive_sha256: provider.upstream.source_archive_sha256},
    evidence: {provider_manifest_root: provider.manifest_root, notes: 'cross-package contract fixture'}
  });
  const result = normalizeAssetProviderResult({
    asset_id: 'asset:spark-cross-package',
    format: 'application/vnd.spark.rad',
    files: [{name: 'fixture.rad', role: 'gaussian-rad', format: 'application/vnd.spark.rad', base64: Buffer.from('spark-cross-package').toString('base64')}],
    representation_refs: [reference],
    provenance: {upstream_url: provider.upstream.url, source_revision: provider.upstream.revision, generator_version: provider.version, seed: 'spark-cross-package'},
    license: provider.license
  }, {provider});
  const assetCandidate = createAssetCandidateFromProviderResult({result, provider});
  const visualBinding = createSpark3DGSVisualBinding({provider, reference: result.representation_refs[0]});
  const observation = createRepresentationObservationCandidate({reference: result.representation_refs[0], observation: {kind: 'lod', data: {selected_lod: 0}}});
  const vsr = await import('../packages/world/visual-state-runtime/src/unified-index.mjs');
  const rsr = await import('../packages/world/reality-simulation-runtime/src/unified-index.mjs');

  assert.equal(provider.authority.owns_authoritative_world_state, false);
  assert.equal(result.authoritative, false);
  assert.equal(assetCandidate.representation_refs[0].representation_root, reference.representation_root);
  assert.equal(visualBinding.execution_status, 'NOT_EXECUTED');
  assert.equal(verifyVisualRepresentationBinding(visualBinding), true);
  assert.equal(observation.canonical_state_proposal, null);
  assert.equal(observation.reconstruction_candidate, null);
  assert.equal(verifyRepresentationObservationCandidate(observation), true);
  assert.ok(vsr.health().protocols.includes('vsr.representation-provider.v0.1'));
  assert.equal(typeof (await vsr.representationProvider()).createSpark3DGSVisualBinding, 'function');
  assert.ok(rsr.health().protocols.includes('rsr.representation-observation.v0.1'));
  assert.equal(typeof (await rsr.representationObservation()).createRepresentationObservationCandidate, 'function');
});

test('Spark absent runtime stays contract-only and cannot fake a provider result', () => {
  const execution = createSpark3DGSProvider().generate({asset_id: 'asset:spark-no-runtime', seed: 'spark-no-runtime'});
  assert.equal(execution.status, 'CONTRACT_VERIFIED_RUNTIME_NOT_EXECUTED');
  assert.equal(execution.result, null);
  assert.equal(execution.failure.code, 'PROVIDER_RUNTIME_NOT_EXECUTED');
});
