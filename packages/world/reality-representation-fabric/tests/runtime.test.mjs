import assert from 'node:assert/strict';
import test from 'node:test';
import {createRepresentationRef, rootHash} from '@taowind/rncs-core-contract';
import {
  RealityRepresentationFabric,
  URRF_MATERIALIZATION_RECEIPT_FORMAT,
  verifyFabricSnapshot,
  verifyMaterializationPlan,
  verifyMaterializationReceipt
} from '../src/index.mjs';

const providerRoot = value => value.repeat(64);

function provider(id, root, kinds, materialize) {
  return {
    manifest: {
      id,
      version: 'test',
      manifest_root: providerRoot(root),
      runtimeStatus: materialize ? 'AVAILABLE' : 'CONTRACT_ONLY',
      capabilities: ['representation.visual.render'],
      authority: {owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection']},
      representation: {kinds, profiles: kinds.map(kind => ({profile_id: `${kind}.test`, formats: [`application/${kind}`]}))}
    },
    ...(materialize ? {materialize} : {})
  };
}

function reference({provider_id, provider_root, kind, content_root, availability = 'CONTRACT_ONLY'}) {
  return createRepresentationRef({
    provider_id,
    provider_root,
    representation_kind: kind,
    representation_formats: [`application/${kind}`],
    content_root,
    representation_profile: {profile_id: `${kind}.test`, formats: [`application/${kind}`]},
    detail_policy: {mode: kind === 'mesh' ? 'distance-lod' : 'hierarchical-lod', selectors: ['screen-space-size']},
    residency_policy: {mode: kind === 'mesh' ? 'asset-resident' : 'paged-streaming', selectors: ['working-set']},
    authority_scope: ['representation_candidate', 'visual_projection'],
    availability
  });
}

test('registers two representations and selects a provider-backed plan with independent policies', () => {
  const mesh = provider('provider:test:mesh', 'a', ['mesh'], async () => ({status: 'EXECUTED', output_root: 'b'.repeat(64), runtime: 'mesh-test'}));
  const spark = provider('provider:test:spark', 'c', ['gaussian-splats']);
  const fabric = new RealityRepresentationFabric({providers: [mesh, spark]});
  const contentRoot = 'd'.repeat(64);
  const object = fabric.registerRealityObject({object_id: 'reality-object:test', state_root: 'e'.repeat(64), representations: [
    reference({provider_id: mesh.manifest.id, provider_root: mesh.manifest.manifest_root, kind: 'mesh', content_root: contentRoot, availability: 'AVAILABLE'}),
    reference({provider_id: spark.manifest.id, provider_root: spark.manifest.manifest_root, kind: 'gaussian-splats', content_root: contentRoot})
  ]});
  assert.equal(object.canonical_owner, 'RNCS');
  assert.equal(object.representation_owner, 'URRF');
  const plan = fabric.selectRepresentation({object_id: object.object_id, representation_kind: 'mesh', detail_mode: 'distance-lod', residency_mode: 'asset-resident', resource_budget: {vram_mb: 128}});
  assert.equal(plan.representation.representation_kind, 'mesh');
  assert.equal(plan.resource_decision.detail_policy_root, rootHash(plan.detail_policy));
  assert.equal(plan.resource_decision.residency_policy_root, rootHash(plan.residency_policy));
  assert.equal(verifyMaterializationPlan(plan).valid, true);
});

test('executes an injected provider without granting canonical authority and records a sealed receipt', async () => {
  let observed;
  const mesh = provider('provider:test:mesh-exec', 'f', ['mesh'], async input => {
    observed = input;
    return {status: 'EXECUTED', output_root: '1'.repeat(64), evidence_root: '2'.repeat(64), runtime: 'mesh-reference'};
  });
  const fabric = new RealityRepresentationFabric({providers: [mesh]});
  const ref = reference({provider_id: mesh.manifest.id, provider_root: mesh.manifest.manifest_root, kind: 'mesh', content_root: '3'.repeat(64), availability: 'AVAILABLE'});
  const object = fabric.registerRealityObject({object_id: 'reality-object:exec', state_root: '4'.repeat(64), representations: [ref]});
  const receipt = await fabric.materialize({object_id: object.object_id, representation_kind: 'mesh'}, {context: {viewport: 'test'}});
  assert.equal(receipt.format, URRF_MATERIALIZATION_RECEIPT_FORMAT);
  assert.equal(receipt.status, 'EXECUTED');
  assert.equal(receipt.output_root, '1'.repeat(64));
  assert.equal(receipt.canonical_state_mutated, false);
  assert.equal(receipt.authority.provider_can_write_authoritative_world_state, false);
  assert.equal(observed.authority.canonical_state_mutation_allowed, false);
  assert.equal(verifyMaterializationReceipt(receipt).valid, true);
});

test('keeps a contract-only provider explicit when no runtime adapter is registered', async () => {
  const spark = provider('provider:test:spark-contract', '5', ['gaussian-splats']);
  const fabric = new RealityRepresentationFabric({providers: [spark]});
  const ref = reference({provider_id: spark.manifest.id, provider_root: spark.manifest.manifest_root, kind: 'gaussian-splats', content_root: '6'.repeat(64)});
  const object = fabric.registerRealityObject({object_id: 'reality-object:contract', state_root: '7'.repeat(64), representations: [ref]});
  const receipt = await fabric.materialize({object_id: object.object_id, representation_kind: 'gaussian-splats'});
  assert.equal(receipt.status, 'NOT_EXECUTED');
  assert.equal(receipt.failure.code, 'PROVIDER_RUNTIME_NOT_EXECUTED');
  assert.equal(verifyMaterializationReceipt(receipt).valid, true);
});

test('applies and rolls back a candidate transition while preserving the canonical object root', async () => {
  const sourceProvider = provider('provider:test:source', '8', ['gaussian-splats']);
  const targetProvider = provider('provider:test:target', '9', ['mesh'], async () => ({status: 'EXECUTED', output_root: 'a'.repeat(64)}));
  const fabric = new RealityRepresentationFabric({providers: [sourceProvider, targetProvider]});
  const contentRoot = 'b'.repeat(64);
  const source = reference({provider_id: sourceProvider.manifest.id, provider_root: sourceProvider.manifest.manifest_root, kind: 'gaussian-splats', content_root: contentRoot});
  const target = reference({provider_id: targetProvider.manifest.id, provider_root: targetProvider.manifest.manifest_root, kind: 'mesh', content_root: contentRoot, availability: 'AVAILABLE'});
  const object = fabric.registerRealityObject({object_id: 'reality-object:transition', state_root: 'c'.repeat(64), representations: [source, target]});
  const receipt = await fabric.materialize({object_id: object.object_id, representation_kind: 'mesh'});
  const candidate = fabric.createTransitionCandidate({object_id: object.object_id, source_representation_id: source.representation_id, target_representation_id: target.representation_id, materialization_receipt: receipt});
  const applied = fabric.applyTransition(candidate);
  assert.equal(applied.phase, 'applied');
  assert.equal(fabric.getRealityObject(object.object_id).active_representation_root, target.representation_root);
  assert.equal(fabric.getRealityObject(object.object_id).object_root, object.object_root);
  const rolledBack = fabric.rollbackTransition(applied);
  assert.equal(rolledBack.phase, 'rolled_back');
  assert.equal(fabric.getRealityObject(object.object_id).active_representation_root, source.representation_root);
  assert.equal(rolledBack.runtime_evidence.target_materialization_receipt_root, receipt.receipt_root);
});

test('snapshot is sealed and exposes the active derived representation separately from canonical state', () => {
  const mesh = provider('provider:test:snapshot', 'd', ['mesh']);
  const fabric = new RealityRepresentationFabric({providers: [mesh]});
  const ref = reference({provider_id: mesh.manifest.id, provider_root: mesh.manifest.manifest_root, kind: 'mesh', content_root: 'e'.repeat(64)});
  fabric.registerRealityObject({object_id: 'reality-object:snapshot', state_root: 'f'.repeat(64), representations: [ref]});
  const snapshot = fabric.snapshot();
  assert.equal(verifyFabricSnapshot(snapshot), true);
  assert.equal(snapshot.objects[0].state_root, 'f'.repeat(64));
  assert.equal(snapshot.active_representations[0].representation_root, ref.representation_root);
});
