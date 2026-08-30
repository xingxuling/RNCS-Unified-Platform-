import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRepresentationRef,
  rootHash,
  verifyRepresentationTransition
} from '../packages/kernel/rncs-core-contract/src/index.mjs';
import {createSpark3DGSProvider} from '../packages/world/reality-asset-genesis-fabric/src/index.mjs';
import {RealityRepresentationFabric, verifyFabricSnapshot, verifyMaterializationReceipt} from '../packages/world/reality-representation-fabric/src/index.mjs';
import {importGltfToSpatialScene, verifyGltfImportReceipt} from '../packages/world/visual-state-runtime/dist/packages/gltf-asset/src/index.js';
import {renderSpatialReference, verifySpatialFrame} from '../packages/world/visual-state-runtime/dist/packages/spatial-reality-3d/src/index.js';

function meshGltfFixture() {
  const positions = new Float32Array([-0.7, -0.6, 0, 0.7, -0.6, 0, 0, 0.8, 0]);
  const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  const indices = new Uint16Array([0, 1, 2]);
  const chunks = [positions, normals, indices];
  const offsets = [];
  let length = 0;
  for (const chunk of chunks) {
    while (length % 4) length++;
    offsets.push(length);
    length += chunk.byteLength;
  }
  const binary = Buffer.alloc(length);
  chunks.forEach((chunk, index) => Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength).copy(binary, offsets[index]));
  return {
    asset: {version: '2.0', generator: 'URRF generic runtime fixture'},
    buffers: [{byteLength: binary.length, uri: `data:application/octet-stream;base64,${binary.toString('base64')}`}],
    bufferViews: chunks.map((chunk, index) => ({buffer: 0, byteOffset: offsets[index], byteLength: chunk.byteLength})),
    accessors: [
      {bufferView: 0, componentType: 5126, count: 3, type: 'VEC3'},
      {bufferView: 1, componentType: 5126, count: 3, type: 'VEC3'},
      {bufferView: 2, componentType: 5123, count: 3, type: 'SCALAR'}
    ],
    materials: [{pbrMetallicRoughness: {baseColorFactor: [0.2, 0.7, 1, 1], metallicFactor: 0.1, roughnessFactor: 0.65}}],
    meshes: [{primitives: [{attributes: {POSITION: 0, NORMAL: 1}, indices: 2, material: 0}]}],
    nodes: [{mesh: 0}],
    scenes: [{nodes: [0]}],
    scene: 0
  };
}

test('URRF routes one RealityObject through contract-only Spark and executable Mesh reference materialization', async () => {
  const spark = createSpark3DGSProvider().manifest;
  const mesh = {
    id: 'provider:reference:gltf-mesh',
    version: '0.1.0',
    manifest_root: 'd'.repeat(64),
    runtimeStatus: 'AVAILABLE',
    capabilities: ['representation.visual.render', 'representation.visual.query'],
    authority: {owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection', 'observation_candidate']},
    representation: {kinds: ['mesh'], profiles: [{profile_id: 'gltf.mesh', formats: ['model/gltf-binary']}]}
  };
  const contentRoot = rootHash({asset: 'urrf-runtime-fixture', version: 1});
  const source = createRepresentationRef({
    provider_id: spark.id,
    provider_root: spark.manifest_root,
    representation_kind: 'gaussian-splats',
    representation_formats: ['application/vnd.spark.rad'],
    content_root: contentRoot,
    representation_profile: {profile_id: 'spark.packed-splats', formats: ['application/vnd.spark.rad']},
    detail_policy: spark.representation.detail_policy,
    residency_policy: spark.representation.residency_policy,
    authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
    availability: 'CONTRACT_ONLY'
  });
  const target = createRepresentationRef({
    provider_id: mesh.id,
    provider_root: mesh.manifest_root,
    representation_kind: 'mesh',
    representation_formats: ['model/gltf-binary'],
    content_root: contentRoot,
    representation_profile: {profile_id: 'gltf.mesh', encoding: 'glTF 2.0', fidelity: 'reference', precision: 'float32', formats: ['model/gltf-binary']},
    detail_policy: {mode: 'distance-lod', selectors: ['screen-space-size', 'triangle-budget']},
    residency_policy: {mode: 'asset-resident', selectors: ['vram-budget']},
    authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
    availability: 'AVAILABLE'
  });
  let executions = 0;
  const fabric = new RealityRepresentationFabric({
    providers: [
      {manifest: spark},
      {manifest: mesh, materialize: async ({reference, authority}) => {
        executions++;
        assert.equal(reference.representation_kind, 'mesh');
        assert.equal(authority.canonical_state_mutation_allowed, false);
        const imported = importGltfToSpatialScene(meshGltfFixture(), {sceneId: 'scene:urrf-runtime'});
        assert.equal(verifyGltfImportReceipt(imported.receipt), true);
        const rendered = renderSpatialReference(imported.scene, {width: 64, height: 64, enableShadows: false});
        assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);
        return {
          status: 'EXECUTED',
          runtime: 'vsr-spatial-reference',
          output_root: rendered.framePlan.frameRoot,
          evidence_root: rootHash({scene_root: imported.receipt.sceneRoot, receipt_root: imported.receipt.receiptRoot, frame_root: rendered.framePlan.frameRoot, pixel_root: rendered.pixelRoot})
        };
      }}
    ]
  });
  const object = fabric.registerRealityObject({object_id: 'reality-object:urrf-runtime', state_root: 'e'.repeat(64), representations: [source, target]});
  const meshPlan = fabric.selectRepresentation({object_id: object.object_id, representation_kind: 'mesh', detail_mode: 'distance-lod', residency_mode: 'asset-resident', resource_budget: {vram_mb: 128}});
  const meshReceipt = await fabric.materialize(meshPlan);
  assert.equal(meshReceipt.status, 'EXECUTED');
  assert.equal(meshReceipt.runtime, 'vsr-spatial-reference');
  assert.equal(meshReceipt.representation_root, target.representation_root);
  assert.equal(verifyMaterializationReceipt(meshReceipt).valid, true);
  assert.equal(executions, 1);

  const sparkReceipt = await fabric.materialize({object_id: object.object_id, representation_kind: 'gaussian-splats'});
  assert.equal(sparkReceipt.status, 'NOT_EXECUTED');
  assert.equal(sparkReceipt.failure.code, 'PROVIDER_RUNTIME_NOT_EXECUTED');
  assert.equal(verifyMaterializationReceipt(sparkReceipt).valid, true);

  const candidate = fabric.createTransitionCandidate({
    object_id: object.object_id,
    source_representation_id: source.representation_id,
    target_representation_id: target.representation_id,
    materialization_receipt: meshReceipt,
    transition_id: 'transition:urrf-runtime:spark-to-mesh'
  });
  assert.equal(verifyRepresentationTransition(candidate).valid, true);
  const applied = fabric.applyTransition(candidate);
  assert.equal(applied.phase, 'applied');
  assert.equal(fabric.getRealityObject(object.object_id).active_representation_root, target.representation_root);
  assert.equal(fabric.getRealityObject(object.object_id).object_root, object.object_root);
  const rolledBack = fabric.rollbackTransition(applied);
  assert.equal(rolledBack.phase, 'rolled_back');
  assert.equal(fabric.getRealityObject(object.object_id).active_representation_root, source.representation_root);
  assert.equal(rolledBack.runtime_evidence.target_materialization_receipt_root, meshReceipt.receipt_root);
  const snapshot = fabric.snapshot();
  assert.equal(verifyFabricSnapshot(snapshot), true);
});
