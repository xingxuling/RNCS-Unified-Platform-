import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyRepresentationTransition,
  createRepresentationRef,
  createRepresentationTransitionCandidate,
  rootHash,
  rollbackRepresentationTransition,
  verifyRepresentationRef,
  verifyRepresentationTransition
} from '../packages/kernel/rncs-core-contract/src/index.mjs';
import {
  createAssetCandidateFromProviderResult,
  createSpark3DGSProvider,
  normalizeAssetProviderResult
} from '../packages/world/reality-asset-genesis-fabric/src/index.mjs';
import {createSpark3DGSVisualBinding, createVisualRepresentationBinding, verifyVisualRepresentationBinding} from '../packages/world/visual-state-runtime/dist/packages/representation-provider/src/index.js';
import {comparePerceptualPlans, compileVisualRealityPlan} from '../packages/world/visual-state-runtime/dist/packages/visual-reality-compiler/src/index.js';
import {importGltfToSpatialScene, verifyGltfImportReceipt} from '../packages/world/visual-state-runtime/dist/packages/gltf-asset/src/index.js';
import {compileSpatialFrame, renderSpatialReference, verifySpatialFrame} from '../packages/world/visual-state-runtime/dist/packages/spatial-reality-3d/src/index.js';
import {createRepresentationObservationCandidate, verifyRepresentationObservationCandidate} from '../packages/world/reality-simulation-runtime/dist/packages/representation-observation/src/index.js';

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
    asset: {version: '2.0', generator: 'URRF phase3 mesh runtime fixture'},
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

test('Mesh provider enters the generic RNCS/VSR representation path without Spark-specific core logic', () => {
  const spark = createSpark3DGSProvider().manifest;
  const mesh = {
    id: 'provider:external:gltf-mesh-0.2',
    version: '0.2.0',
    manifest_root: 'd'.repeat(64),
    runtimeStatus: 'CONTRACT_ONLY',
    capabilities: ['representation.visual.render', 'representation.visual.query'],
    authority: {
      owns_authoritative_world_state: false,
      scope: ['representation_candidate', 'visual_projection', 'observation_candidate']
    },
    representation: {
      kinds: ['mesh'],
      profiles: [{ profile_id: 'gltf.mesh', formats: ['model/gltf-binary'] }]
    }
  };
  const sparkReference = createRepresentationRef({
    provider_id: spark.id,
    provider_root: spark.manifest_root,
    representation_kind: 'gaussian-splats',
    representation_formats: ['application/vnd.spark.rad'],
    content_root: 'e'.repeat(64),
    representation_profile: { profile_id: 'spark.packed-splats', formats: ['application/vnd.spark.rad'] },
    detail_policy: spark.representation.detail_policy,
    residency_policy: spark.representation.residency_policy,
    authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
    availability: 'CONTRACT_ONLY'
  });
  const meshReference = createRepresentationRef({
    provider_id: mesh.id,
    provider_root: mesh.manifest_root,
    representation_kind: 'mesh',
    representation_formats: ['model/gltf-binary'],
    content_root: sparkReference.content_root,
    representation_profile: {
      profile_id: 'gltf.mesh',
      encoding: 'glTF 2.0',
      fidelity: 'high',
      precision: 'float32',
      formats: ['model/gltf-binary']
    },
    detail_policy: { mode: 'distance-lod', selectors: ['screen-space-size'] },
    residency_policy: { mode: 'asset-resident', selectors: ['vram-budget'] },
    authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
    availability: 'CONTRACT_ONLY'
  });
  const sparkBinding = createSpark3DGSVisualBinding({ provider: spark, reference: sparkReference });
  const meshBinding = createVisualRepresentationBinding({ provider: mesh, reference: meshReference });

  assert.equal(verifyRepresentationRef(sparkReference).valid, true);
  assert.equal(verifyRepresentationRef(meshReference).valid, true);
  assert.equal(sparkReference.content_root, meshReference.content_root);
  assert.notEqual(sparkReference.representation_kind, meshReference.representation_kind);
  assert.equal(sparkBinding.authority.projection_only, true);
  assert.equal(meshBinding.reference.representation_kind, 'mesh');
  assert.equal(meshBinding.execution_status, 'NOT_EXECUTED');
  assert.equal(meshBinding.authority.provider_can_write_authoritative_world_state, false);
  assert.equal(verifyVisualRepresentationBinding(meshBinding), true);
});

test('Gaussian-to-mesh transition keeps identity, records independent equivalence and rolls back', () => {
  const spark = createSpark3DGSProvider().manifest;
  const mesh = {
    id: 'provider:external:gltf-mesh-0.2',
    version: '0.2.0',
    manifest_root: 'd'.repeat(64),
    runtimeStatus: 'CONTRACT_ONLY',
    capabilities: ['representation.visual.render', 'representation.visual.query'],
    authority: {
      owns_authoritative_world_state: false,
      scope: ['representation_candidate', 'visual_projection', 'observation_candidate']
    },
    representation: {kinds: ['mesh'], profiles: [{profile_id: 'gltf.mesh', formats: ['model/gltf-binary']}]}
  };
  const source = createRepresentationRef({
    provider_id: spark.id,
    provider_root: spark.manifest_root,
    representation_kind: 'gaussian-splats',
    representation_formats: ['application/vnd.spark.rad'],
    content_root: 'f'.repeat(64),
    representation_profile: {profile_id: 'spark.ext-splats', formats: ['application/vnd.spark.rad']},
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
    content_root: source.content_root,
    representation_profile: {profile_id: 'gltf.mesh', formats: ['model/gltf-binary']},
    detail_policy: {mode: 'distance-lod', selectors: ['screen-space-size', 'triangle-budget']},
    residency_policy: {mode: 'asset-resident', selectors: ['vram-budget']},
    authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
    availability: 'CONTRACT_ONLY'
  });
  const state = {
    documentId: 'urrf-phase3-fixture',
    documentHash: 'a'.repeat(64),
    runtimeVersion: '0.8.0',
    time: 0,
    frame: 0,
    viewport: {width: 64, height: 64, dpr: 1},
    items: [{
      id: 'object:phase3-fixture',
      nodeId: 'object:phase3-fixture',
      type: 'rect',
      orderKey: 'order:0',
      worldTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      localBounds: {x: 8, y: 8, width: 32, height: 32},
      worldBounds: {x: 8, y: 8, width: 32, height: 32},
      opacity: 1,
      appearance: {fill: {type: 'solid', color: '#ffffff'}, opacity: 1},
      content: {},
      tags: ['semantic']
    }],
    diagnostics: [],
    semanticHash: 'b'.repeat(64)
  };
  const gaussianPlan = compileVisualRealityPlan(state, {quality: 'quality', observer: {id: 'observer:gaussian', purpose: 'player'}, device: {class: 'desktop', gpuTier: 2}});
  const meshPlan = compileVisualRealityPlan(state, {quality: 'economy', observer: {id: 'observer:mesh', purpose: 'player'}, device: {class: 'mobile', gpuTier: 1}});
  const perceptualReport = comparePerceptualPlans(gaussianPlan, meshPlan);
  assert.equal(perceptualReport.ok, true);
  assert.equal(perceptualReport.sharedSourceReality, true);
  const transition = createRepresentationTransitionCandidate({
    transition_id: 'transition:phase3:gaussian-mesh',
    operation: 'handoff',
    object_id: 'reality-object:phase3-fixture',
    branch: 'main',
    state_root: rootHash({object_id: 'reality-object:phase3-fixture', semantic: state.semanticHash}),
    source_representation: source,
    target_representation: target,
    equivalence: {
      identity: {status: 'PASS', evidence_root: rootHash({content_root: source.content_root, object_id: 'reality-object:phase3-fixture'})},
      authority: 'PASS',
      constraint: 'UNKNOWN',
      semantic: 'PASS',
      spatial: 'PASS',
      perceptual: {status: 'PASS', evidence_root: perceptualReport.reportRoot},
      behavioral: 'NOT_RUN',
      temporal: 'NOT_RUN',
      task: 'PASS'
    },
    resource_decision: {
      mode: 'handoff',
      selected_representation_root: target.representation_root,
      resource_budget: {working_set: 'mesh-resident', vram_mb: 128},
      reason: 'mobile edit task selects the mesh candidate under the declared budget'
    }
  });
  assert.equal(verifyRepresentationTransition(transition).valid, true);
  const applied = applyRepresentationTransition(transition);
  assert.equal(applied.active_representation_root, target.representation_root);
  assert.equal(applied.commit_status, 'NOT_COMMITTED');
  const rolledBack = rollbackRepresentationTransition(applied, 'resource budget changed');
  assert.equal(verifyRepresentationTransition(rolledBack).valid, true);
  assert.equal(rolledBack.active_representation_root, source.representation_root);
  assert.equal(rolledBack.rollback.status, 'ROLLED_BACK');
  assert.equal(rolledBack.authority.provider_can_write_authoritative_world_state, false);
});

test('Mesh glTF implementation executes a bounded reference frame without promoting provider authority', () => {
  const provider = {
    id: 'provider:external:gltf-mesh-0.2',
    version: '0.2.0',
    manifest_root: 'd'.repeat(64),
    runtimeStatus: 'CONTRACT_ONLY',
    capabilities: ['representation.visual.render', 'representation.visual.query'],
    authority: {owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection', 'observation_candidate']},
    representation: {kinds: ['mesh'], profiles: [{profile_id: 'gltf.mesh', formats: ['model/gltf+json']}]}
  };
  const imported = importGltfToSpatialScene(meshGltfFixture(), {sceneId: 'urrf-phase3-mesh-runtime'});
  assert.equal(verifyGltfImportReceipt(imported.receipt), true);
  assert.equal(imported.scene.meshes.length, 1);
  const frame = compileSpatialFrame(imported.scene, {width: 64, height: 64, enableShadows: false});
  assert.equal(verifySpatialFrame(frame).ok, true);
  const rendered = renderSpatialReference(imported.scene, {width: 64, height: 64, enableShadows: false});
  assert.equal(rendered.framePlan.frameRoot, frame.frameRoot);
  assert.equal(rendered.framePlan.stats.meshCount, 1);
  assert.equal(rendered.framePlan.stats.triangleCount, 1);
  assert.ok(rendered.png.length > 100);
  assert.deepEqual([...rendered.png.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const reference = createRepresentationRef({
    provider_id: provider.id,
    provider_root: provider.manifest_root,
    representation_kind: 'mesh',
    representation_formats: ['model/gltf+json'],
    content_root: imported.receipt.sceneRoot,
    representation_profile: {profile_id: 'gltf.mesh', formats: ['model/gltf+json']},
    detail_policy: {mode: 'distance-lod', selectors: ['screen-space-size']},
    residency_policy: {mode: 'asset-resident', selectors: ['vram-budget']},
    authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
    availability: 'CONTRACT_ONLY',
    evidence: {provider_manifest_root: provider.manifest_root, provider_result_root: imported.receipt.receiptRoot, notes: 'VSR reference runtime only'}
  });
  const binding = createVisualRepresentationBinding({provider, reference});
  assert.equal(verifyRepresentationRef(reference).valid, true);
  assert.equal(verifyVisualRepresentationBinding(binding), true);
  assert.equal(binding.execution_status, 'NOT_EXECUTED');
  assert.equal(binding.authority.provider_can_write_authoritative_world_state, false);
});
