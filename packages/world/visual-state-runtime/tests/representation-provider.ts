import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cryptographicHash } from '../packages/spec/src/index.js';
import {
  createSpark3DGSVisualBinding,
  createVsrNonMeshRepresentationComponentImportHandler,
  createVsrNonMeshRepresentationComponentImportHandlerSet,
  createVsrPbrMaterialComponentImportHandler,
  inspectVisualRepresentationProvider,
  verifyVsrPbrMaterialImportReceipt,
  verifyVsrNonMeshRepresentationImportReceipt,
  verifyVisualRepresentationBinding,
  VSR_PBR_MATERIAL_CHANNEL_ROLES,
  VSR_PBR_TEXTURE_PACK_FORMAT,
  VSR_NON_MESH_REPRESENTATION_MANIFEST_FORMAT,
  VSR_NON_MESH_REPRESENTATION_KINDS,
  type VSRNonMeshRepresentationAsset,
  type VSRRepresentationProviderManifest,
  type VSRRepresentationReference
} from '../packages/representation-provider/src/index.js';
import {
  lowerVsrPointCloudCandidateToSpatialScene,
  lowerVsrCurveCandidateToSpatialScene,
  lowerVsrGaussianSplatCandidateToSpatialScene,
  lowerVsrNeuralFieldCandidateToSpatialScene,
  lowerVsrSdfCandidateToSpatialScene,
  lowerVsrVoxelCandidateToSpatialScene,
  renderSpatialReference,
  verifyVsrCurveSpatialScene,
  verifyVsrVoxelSpatialScene,
  verifyVsrPointCloudSpatialScene,
  verifyVsrGaussianSplatSpatialScene,
  verifyVsrNeuralFieldSpatialScene,
  verifyVsrSdfSpatialScene,
  VSR_POINT_CLOUD_PAYLOAD_FORMAT,
  VSR_CURVE_PAYLOAD_FORMAT,
  VSR_GAUSSIAN_SPLAT_PAYLOAD_FORMAT,
  VSR_NEURAL_FIELD_PAYLOAD_FORMAT,
  VSR_SDF_PAYLOAD_FORMAT,
  VSR_VOXEL_PAYLOAD_FORMAT,
  type VSRPointCloudRepresentationCandidate,
  type VSRPointCloudSpatialSceneResult,
  type VSRCurveRepresentationCandidate,
  type VSRCurveSpatialSceneResult,
  type VSRGaussianSplatRepresentationCandidate,
  type VSRGaussianSplatSpatialSceneResult,
  type VSRNeuralFieldRepresentationCandidate,
  type VSRNeuralFieldSpatialSceneResult,
  type VSRSdfRepresentationCandidate,
  type VSRSdfSpatialSceneResult,
  type VSRVoxelRepresentationCandidate,
  type VSRVoxelSpatialSceneResult
} from '../packages/spatial-reality-3d/src/index.js';

const root = (char: string): string => char.repeat(64);

const sparkProvider = (): VSRRepresentationProviderManifest => ({
  id: 'provider:external:spark-2.1.0',
  version: '2.1.0',
  manifest_root: root('a'),
  runtimeStatus: 'CONTRACT_ONLY',
  capabilities: ['representation.visual.render', 'representation.visual.stream', 'representation.visual.paged-residency'],
  authority: { owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection', 'observation_candidate'] },
  representation: { kinds: ['gaussian-splats'], profiles: [{ profile_id: 'spark-rad-packed', formats: ['application/vnd.spark.rad'] }] }
});

const sparkReference = (): VSRRepresentationReference => ({
  format: 'rncs.representation-ref.v0.1',
  provider_id: 'provider:external:spark-2.1.0',
  provider_root: root('a'),
  representation_kind: 'gaussian-splats',
  representation_formats: ['application/vnd.spark.rad'],
  content_root: root('b'),
  representation_profile: { profile_id: 'spark-rad-packed', formats: ['application/vnd.spark.rad'] },
  detail_policy: { mode: 'hierarchical-lod', selectors: ['lod-tree'] },
  residency_policy: { mode: 'paged-lru', selectors: ['http-range'] },
  availability: 'CONTRACT_ONLY',
  authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
  authority: { provider_may_write_authoritative_world_state: false, rncs_authority_required: true },
  candidate_only: true,
  authoritative: false,
  representation_root: root('c')
});

const tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];
const test = (name: string, fn: () => void | Promise<void>): void => { tests.push({ name, fn }); };

test('Spark manifest is recognized as a visual-only representation provider', () => {
  const inspection = inspectVisualRepresentationProvider(sparkProvider());
  assert.equal(inspection.provider_id, 'provider:external:spark-2.1.0');
  assert.equal(inspection.runtime_status, 'CONTRACT_ONLY');
  assert.equal(inspection.authority.projection_only, true);
  assert.equal(inspection.authority.provider_can_write_authoritative_world_state, false);
  assert.ok(inspection.visual_capabilities.includes('representation.visual.render'));
});

test('Spark binding remains candidate-only and never invents runtime execution', () => {
  const binding = createSpark3DGSVisualBinding({ provider: sparkProvider(), reference: sparkReference() });
  assert.equal(binding.execution_status, 'NOT_EXECUTED');
  assert.equal(binding.reference.authoritative, false);
  assert.equal(binding.authority.rncs_authority_required, true);
  assert.equal(verifyVisualRepresentationBinding(binding), true);
});

test('VSR rejects authoritative representation references and provider authority escalation', () => {
  const authoritative = { ...sparkReference(), authoritative: true } as unknown as VSRRepresentationReference;
  assert.throws(() => createSpark3DGSVisualBinding({ provider: sparkProvider(), reference: authoritative }), /VSR_REPRESENTATION_REF_CANNOT_BE_AUTHORITATIVE/);
  const escalated = { ...sparkProvider(), authority: { ...sparkProvider().authority, owns_authoritative_world_state: true } } as unknown as VSRRepresentationProviderManifest;
  assert.throws(() => inspectVisualRepresentationProvider(escalated), /VSR_REPRESENTATION_PROVIDER_AUTHORITY_ESCALATION/);
});

test('VSR binding integrity detects a visual binding mutation', () => {
  const binding = createSpark3DGSVisualBinding({ provider: sparkProvider(), reference: sparkReference() });
  binding.projection.detail_policy = { mode: 'tampered' };
  assert.equal(verifyVisualRepresentationBinding(binding), false);
});

test('non-mesh manifest schema pins the candidate-only authority boundary', () => {
  const schema = JSON.parse(readFileSync(fileURLToPath(new URL('../schemas/vsr-non-mesh-representation-manifest.v0.1.schema.json', import.meta.url)), 'utf8')) as Record<string, any>;
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.properties.format.const, VSR_NON_MESH_REPRESENTATION_MANIFEST_FORMAT);
  assert.equal(schema.properties.candidate_only.const, true);
  assert.equal(schema.properties.authoritative.const, false);
});

test('non-mesh importer factory binds every supported kind with an explicit verifier', () => {
  const handlers = createVsrNonMeshRepresentationComponentImportHandlerSet({handlerIdPrefix: 'test.non-mesh'});
  assert.deepEqual(Object.keys(handlers), [...VSR_NON_MESH_REPRESENTATION_KINDS]);
  assert.equal(new Set(Object.values(handlers).map(handler => handler.handler_id)).size, VSR_NON_MESH_REPRESENTATION_KINDS.length);
  for (const kind of VSR_NON_MESH_REPRESENTATION_KINDS) {
    assert.equal(handlers[kind]!.representation_kind, kind);
    assert.equal(handlers[kind]!.handler_id, `test.non-mesh.${kind}.v0.1`);
    assert.equal(typeof handlers[kind]!.compile, 'function');
    assert.equal(typeof handlers[kind]!.verify, 'function');
  }
});

test('VSR imports and verifies an RAGF four-channel PBR material candidate', async () => {
  const channelBytes = VSR_PBR_MATERIAL_CHANNEL_ROLES.map((_, index) => new Uint8Array([index + 1, 16 + index, 255 - index]));
  const physicalIds = VSR_PBR_MATERIAL_CHANNEL_ROLES.map(role => `physical:material:${role}`);
  const logicalIds = VSR_PBR_MATERIAL_CHANNEL_ROLES.map(role => `logical:material:${role}`);
  const metadataBase = {
    format: VSR_PBR_TEXTURE_PACK_FORMAT,
    asset_id: 'asset:material',
    variant: 'standard',
    size: 1,
    color_space: {
      'base-color': 'srgb',
      normal: 'linear',
      'occlusion-roughness-metallic': 'linear',
      emissive: 'srgb'
    },
    material_model: 'stylized-pbr-v0.4',
    variation: {seed: 17},
    files: VSR_PBR_MATERIAL_CHANNEL_ROLES.map((role, index) => ({
      name: `${role}.png`,
      role,
      mime: 'image/png',
      root: cryptographicHash(Buffer.from(channelBytes[index]!).toString('base64'))
    }))
  };
  const metadata = {...metadataBase, pack_root: cryptographicHash(metadataBase)};
  const metadataId = 'physical:material:metadata';
  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const assets = [
    {id: metadataId, kind: 'material', format: 'application/json', role: 'pbr-material-metadata'},
    ...physicalIds.map((id, index) => ({
      id,
      kind: 'texture',
      format: 'image/png',
      role: VSR_PBR_MATERIAL_CHANNEL_ROLES[index],
      metadata: {source_asset_id: logicalIds[index]}
    })),
    {id: 'physical:material:note', kind: 'other', format: 'text/plain'}
  ];
  const payloads = new Map<string, Uint8Array>([
    [metadataId, metadataBytes],
    ...physicalIds.map((id, index) => [id, channelBytes[index]!] as [string, Uint8Array]),
    ['physical:material:note', new Uint8Array([9])]
  ]);
  const handler = createVsrPbrMaterialComponentImportHandler({
    handlerId: 'vsr.pbr-material-regression.v0.1',
    requirePackMetadata: true
  });
  const result = await handler.compile({
    entry: {component_id: 'material', asset_id: 'asset:material', representation_kind: 'material', representation_profile: 'pbr-texture-pack'},
    assets,
    payloads
  });
  assert.deepEqual(result.candidate.channelAssetIds, physicalIds);
  assert.deepEqual(result.candidate.sourceChannelAssetIds, logicalIds);
  assert.equal(result.candidate.materialModel, 'stylized-pbr-v0.4');
  assert.equal(result.candidate.packRoot, metadata.pack_root);
  assert.equal(result.candidate.channelByteLengths.reduce((sum, value) => sum + value, 0), 12);
  assert.equal(result.metrics.pbr_channel_count, 4);
  assert.equal(result.metrics.pbr_metadata_present, 1);
  assert.equal(result.metrics.rendered, 0);
  assert.deepEqual(result.consumed_asset_ids, [metadataId, ...physicalIds]);
  assert.deepEqual(result.deferred_asset_ids, ['physical:material:note']);
  assert.equal(verifyVsrPbrMaterialImportReceipt(result.receipt, result.candidate), true);
  assert.equal(JSON.parse(readFileSync(fileURLToPath(new URL('../schemas/vsr-pbr-material-candidate.v0.1.schema.json', import.meta.url)), 'utf8')).properties.format.const, 'vsr.pbr-material-candidate.v0.1');
  assert.equal(JSON.parse(readFileSync(fileURLToPath(new URL('../schemas/vsr-pbr-material-import-receipt.v0.1.schema.json', import.meta.url)), 'utf8')).properties.format.const, 'vsr.pbr-material-import-receipt.v0.1');
  assert.equal(handler.verify({result}), true);

  const tampered = new Map(payloads);
  tampered.set(physicalIds[2]!, new Uint8Array([99, 16, 253]));
  await assert.rejects(
    () => handler.compile({entry: {component_id: 'material', asset_id: 'asset:material', representation_kind: 'material'}, assets, payloads: tampered}),
    /root does not match pack metadata/
  );
});

test('VSR seals a non-mesh Gaussian payload package without claiming rendering', async () => {
  const payloads = new Map<string, Uint8Array>([
    ['asset:ruins:page0', new Uint8Array([1, 2, 3])],
    ['asset:ruins:page1', new Uint8Array([4, 5])]
  ]);
  const payloadAssetIds = [...payloads.keys()];
  const contentRoot = cryptographicHash(payloadAssetIds.map(assetId => {
    const bytes = payloads.get(assetId)!;
    return {assetId, byteLength: bytes.byteLength, byteRoot: cryptographicHash([...bytes])};
  }));
  const manifestBase = {
    format: VSR_NON_MESH_REPRESENTATION_MANIFEST_FORMAT,
    version: '0.1.0',
    component_id: 'ruins',
    asset_id: 'asset:ruins',
    representation_kind: 'gaussian-splats',
    profile_id: 'spark.ext-splats',
    payload_asset_ids: payloadAssetIds,
    payload_format: 'application/vnd.spark.rad',
    payload_byte_length: 5,
    element_count: 12,
    bounds: {min: [-1, -0.5, -2], max: [1, 2, 3]},
    content_root: contentRoot,
    candidate_only: true,
    authoritative: false
  };
  const manifest = {...manifestBase, manifest_root: cryptographicHash(manifestBase)};
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  const assets = [
    {id: 'asset:ruins:manifest', kind: 'representation-manifest', format: 'application/json', metadata: {role: 'representation-manifest'}},
    ...payloadAssetIds.map(id => ({id, kind: 'representation-data', format: 'application/vnd.spark.rad'})),
    {id: 'asset:ruins:note', kind: 'other', format: 'text/plain'}
  ] as VSRNonMeshRepresentationAsset[];
  const allPayloads = new Map(payloads);
  allPayloads.set('asset:ruins:manifest', manifestBytes);
  allPayloads.set('asset:ruins:note', new Uint8Array([9]));
  const context = {
    entry: {component_id: 'ruins', asset_id: 'asset:ruins', representation_kind: 'gaussian-splat'},
    assets,
    payloads: allPayloads
  };
  const handler = createVsrNonMeshRepresentationComponentImportHandler({
    representationKind: 'gaussian-splat',
    handlerId: 'vsr.gaussian-splat-component-import.v0.1'
  });
  const result = await handler.compile(context);
  assert.equal(result.candidate.representationKind, 'gaussian-splat');
  assert.equal(result.candidate.renderStatus, 'NOT_IMPLEMENTED');
  assert.equal(result.receipt.payloadFormat, 'application/vnd.spark.rad');
  assert.equal(result.receipt.payloadCount, 2);
  assert.equal(result.receipt.payloadByteLength, 5);
  assert.equal(result.receipt.elementCount, 12);
  assert.equal(result.metrics.rendered, 0);
  assert.deepEqual(result.consumed_asset_ids, ['asset:ruins:manifest', ...payloadAssetIds]);
  assert.deepEqual(result.deferred_asset_ids, ['asset:ruins:note']);
  assert.equal(verifyVsrNonMeshRepresentationImportReceipt(result.receipt, result.candidate), true);
  assert.equal(handler.verify({result}), true);

  const tamperedPayloads = new Map(allPayloads);
  tamperedPayloads.set('asset:ruins:page1', new Uint8Array([4, 5, 6]));
  await assert.rejects(
    () => handler.compile({...context, payloads: tamperedPayloads}),
    /content root mismatch|byte length mismatch/
  );
});

test('VSR binds manifest logical pages to explicit physical directory assets', async () => {
  const sourcePayloadAssetIds = ['logical:ruins:page0', 'logical:ruins:page1'];
  const physicalPayloadAssetIds = ['urrf:resource:ruins:page0', 'urrf:resource:ruins:page1'];
  const payloadBytes = [new Uint8Array([11, 12, 13]), new Uint8Array([14, 15])];
  const contentRoot = cryptographicHash(sourcePayloadAssetIds.map((assetId, index) => ({
    assetId,
    byteLength: payloadBytes[index]!.byteLength,
    byteRoot: cryptographicHash([...payloadBytes[index]!])
  })));
  const manifestBase = {
    format: VSR_NON_MESH_REPRESENTATION_MANIFEST_FORMAT,
    version: '0.1.0',
    component_id: 'mapped-ruins',
    asset_id: 'asset:mapped-ruins',
    representation_kind: 'gaussian-splat',
    profile_id: 'spark.ext-splats',
    payload_asset_ids: sourcePayloadAssetIds,
    payload_format: 'application/vnd.spark.rad',
    payload_byte_length: 5,
    element_count: 12,
    bounds: {min: [-1, -1, -1], max: [1, 1, 1]},
    content_root: contentRoot,
    candidate_only: true,
    authoritative: false
  };
  const manifestAssetId = 'urrf:resource:mapped-ruins:manifest';
  const assets = [
    {id: manifestAssetId, kind: 'representation-manifest', format: 'application/json', metadata: {role: 'representation-manifest'}},
    ...physicalPayloadAssetIds.map((id, index) => ({
      id,
      kind: 'representation-data',
      format: 'application/vnd.spark.rad',
      metadata: {source_asset_id: sourcePayloadAssetIds[index]}
    }))
  ] as VSRNonMeshRepresentationAsset[];
  const payloads = new Map<string, Uint8Array>([
    [manifestAssetId, new TextEncoder().encode(JSON.stringify({...manifestBase, manifest_root: cryptographicHash(manifestBase)}))],
    [physicalPayloadAssetIds[0]!, payloadBytes[0]!],
    [physicalPayloadAssetIds[1]!, payloadBytes[1]!]
  ]);
  const handler = createVsrNonMeshRepresentationComponentImportHandler({representationKind: 'gaussian-splat', handlerId: 'vsr.gaussian-splat-logical-binding.v0.1'});
  const result = await handler.compile({entry: {component_id: 'mapped-ruins', asset_id: 'asset:mapped-ruins', representation_kind: 'gaussian-splat'}, assets, payloads});
  assert.deepEqual(result.candidate.payloadAssetIds, physicalPayloadAssetIds);
  assert.deepEqual(result.candidate.sourcePayloadAssetIds, sourcePayloadAssetIds);
  assert.deepEqual(result.consumed_asset_ids, [manifestAssetId, ...physicalPayloadAssetIds]);
  assert.equal(handler.verify({result}), true);

  const ambiguousAssets = assets.map(asset => asset.id === physicalPayloadAssetIds[1]
    ? {...asset, metadata: {source_asset_id: sourcePayloadAssetIds[0]}}
    : asset);
  await assert.rejects(
    () => handler.compile({entry: {component_id: 'mapped-ruins', asset_id: 'asset:mapped-ruins', representation_kind: 'gaussian-splat'}, assets: ambiguousAssets, payloads}),
    /ambiguous/
  );
});

test('VSR lowers a fixed-record point-cloud candidate into a rooted transparent scene', async () => {
  const bytes = new Uint8Array(4 * 32);
  const view = new DataView(bytes.buffer);
  const records = [
    [-0.35, 0, 0, 1, 0.2, 0.1, 0.95, 0.08],
    [0.35, 0, 0, 0.1, 0.7, 1, 0.9, 0.1],
    [0, 0.35, 0, 0.2, 1, 0.35, 0.85, 0.1],
    [0, -0.35, 0, 1, 0.55, 0.1, 0.8, 0.1]
  ];
  records.forEach((record, index) => record.forEach((value, field) => view.setFloat32(index * 32 + field * 4, value, true)));
  const pages = [bytes.slice(0, 64), bytes.slice(64)];
  const payloadAssetIds = ['asset:cloud:page0', 'asset:cloud:page1'];
  const contentRoot = cryptographicHash(payloadAssetIds.map((assetId, index) => ({assetId, byteLength: pages[index]!.byteLength, byteRoot: cryptographicHash([...pages[index]!])})));
  const manifestBase = {
    format: VSR_NON_MESH_REPRESENTATION_MANIFEST_FORMAT,
    version: '0.1.0',
    component_id: 'cloud',
    asset_id: 'asset:cloud',
    representation_kind: 'point-cloud',
    profile_id: 'vsr.point-cloud.f32rgba.v0.1',
    payload_asset_ids: payloadAssetIds,
    payload_format: VSR_POINT_CLOUD_PAYLOAD_FORMAT,
    payload_byte_length: bytes.byteLength,
    element_count: records.length,
    bounds: {min: [-1, -1, -1], max: [1, 1, 1]},
    content_root: contentRoot,
    candidate_only: true,
    authoritative: false
  };
  const assets = [
    {id: 'asset:cloud:manifest', kind: 'representation-manifest', format: 'application/json', metadata: {role: 'representation-manifest'}},
    ...payloadAssetIds.map(id => ({id, kind: 'representation-data', format: VSR_POINT_CLOUD_PAYLOAD_FORMAT})),
    {id: 'asset:cloud:note', kind: 'other', format: 'text/plain'}
  ] as VSRNonMeshRepresentationAsset[];
  const payloads = new Map<string, Uint8Array>([
    ['asset:cloud:manifest', new TextEncoder().encode(JSON.stringify({...manifestBase, manifest_root: cryptographicHash(manifestBase)}))],
    [payloadAssetIds[0]!, pages[0]!],
    [payloadAssetIds[1]!, pages[1]!],
    ['asset:cloud:note', new Uint8Array([9])]
  ]);
  const handler = createVsrNonMeshRepresentationComponentImportHandler({representationKind: 'point-cloud', handlerId: 'vsr.point-cloud-component-import.v0.1'});
  const result = await handler.compile({entry: {component_id: 'cloud', asset_id: 'asset:cloud', representation_kind: 'point-cloud'}, assets, payloads});
  const lowering = lowerVsrPointCloudCandidateToSpatialScene(result.candidate as VSRPointCloudRepresentationCandidate, {assets, payloads}, {sceneId: 'point-cloud-regression', sizeScale: 1, maxPoints: 4});
  const repeat = lowerVsrPointCloudCandidateToSpatialScene(result.candidate as VSRPointCloudRepresentationCandidate, {assets, payloads}, {sceneId: 'point-cloud-regression', sizeScale: 1, maxPoints: 4});
  const frame = renderSpatialReference(lowering.scene, {width: 96, height: 96, enableShadows: false, transparencyMode: 'weighted-blended-oit'});
  assert.equal(result.candidate.renderStatus, 'NOT_IMPLEMENTED');
  assert.equal(lowering.sourceElementCount, records.length);
  assert.equal(lowering.pointCount, records.length);
  assert.equal(lowering.scene.meshes.length, 1);
  assert.ok(lowering.renderableCount > 0);
  assert.ok(frame.framePlan.stats.visibleDraws > 0);
  assert.ok(frame.framePlan.stats.transparentDraws > 0);
  assert.equal(lowering.pointRoot, repeat.pointRoot);
  assert.equal(lowering.sceneRoot, repeat.sceneRoot);
  assert.equal(lowering.root, repeat.root);
  assert.equal(verifyVsrPointCloudSpatialScene(lowering), true);
  const tampered = structuredClone(lowering) as VSRPointCloudSpatialSceneResult;
  tampered.points[0]!.radius += 1;
  assert.equal(verifyVsrPointCloudSpatialScene(tampered), false);
});

test('VSR lowers an ordered fixed-record curve candidate into a rooted ribbon scene', async () => {
  const bytes = new Uint8Array(4 * 32);
  const view = new DataView(bytes.buffer);
  const records = [
    [-0.8, 0, 0, 0.35, 0.75, 1, 0.9, 0.04],
    [-0.3, 0.45, 0, 0.55, 0.35, 1, 0.86, 0.05],
    [0.3, 0.2, 0, 0.8, 0.2, 0.95, 0.82, 0.06],
    [0.8, 0.65, 0, 1, 0.55, 0.25, 0.78, 0.05]
  ];
  records.forEach((record, index) => record.forEach((value, field) => view.setFloat32(index * 32 + field * 4, value, true)));
  const pages = [bytes.slice(0, 32), bytes.slice(32, 96), bytes.slice(96)];
  const payloadAssetIds = ['asset:curve:page0', 'asset:curve:page1', 'asset:curve:page2'];
  const contentRoot = cryptographicHash(payloadAssetIds.map((assetId, index) => ({assetId, byteLength: pages[index]!.byteLength, byteRoot: cryptographicHash([...pages[index]!])})));
  const manifestBase = {
    format: VSR_NON_MESH_REPRESENTATION_MANIFEST_FORMAT,
    version: '0.1.0',
    component_id: 'trail',
    asset_id: 'asset:trail',
    representation_kind: 'curve',
    profile_id: 'vsr.curve.polyline.f32rgba.v0.1',
    payload_asset_ids: payloadAssetIds,
    payload_format: VSR_CURVE_PAYLOAD_FORMAT,
    payload_byte_length: bytes.byteLength,
    element_count: records.length,
    bounds: {min: [-1, -1, -1], max: [1, 1, 1]},
    content_root: contentRoot,
    candidate_only: true,
    authoritative: false
  };
  const assets = [
    {id: 'asset:curve:manifest', kind: 'representation-manifest', format: 'application/json', metadata: {role: 'representation-manifest'}},
    ...payloadAssetIds.map(id => ({id, kind: 'representation-data', format: VSR_CURVE_PAYLOAD_FORMAT})),
    {id: 'asset:curve:note', kind: 'other', format: 'text/plain'}
  ] as VSRNonMeshRepresentationAsset[];
  const payloads = new Map<string, Uint8Array>([
    ['asset:curve:manifest', new TextEncoder().encode(JSON.stringify({...manifestBase, manifest_root: cryptographicHash(manifestBase)}))],
    [payloadAssetIds[0]!, pages[0]!],
    [payloadAssetIds[1]!, pages[1]!],
    [payloadAssetIds[2]!, pages[2]!],
    ['asset:curve:note', new Uint8Array([9])]
  ]);
  const handler = createVsrNonMeshRepresentationComponentImportHandler({representationKind: 'curve', handlerId: 'vsr.curve-component-import.v0.1'});
  const result = await handler.compile({entry: {component_id: 'trail', asset_id: 'asset:trail', representation_kind: 'curve'}, assets, payloads});
  const lowering = lowerVsrCurveCandidateToSpatialScene(result.candidate as VSRCurveRepresentationCandidate, {assets, payloads}, {sceneId: 'curve-regression', sizeScale: 1, maxPoints: 4});
  const repeat = lowerVsrCurveCandidateToSpatialScene(result.candidate as VSRCurveRepresentationCandidate, {assets, payloads}, {sceneId: 'curve-regression', sizeScale: 1, maxPoints: 4});
  const frame = renderSpatialReference(lowering.scene, {width: 96, height: 96, enableShadows: false, transparencyMode: 'weighted-blended-oit'});
  assert.equal(result.candidate.renderStatus, 'NOT_IMPLEMENTED');
  assert.equal(lowering.sourceElementCount, records.length);
  assert.equal(lowering.pointCount, records.length);
  assert.equal(lowering.segmentCount, records.length - 1);
  assert.equal(lowering.scene.meshes.length, 1);
  assert.equal(lowering.scene.meshes[0]!.indices.length, 18);
  assert.equal(lowering.scene.nodes.length, 1);
  assert.equal(lowering.renderableCount, 1);
  assert.equal(frame.framePlan.stats.visibleDraws, 1);
  assert.ok(frame.framePlan.stats.transparentDraws > 0);
  assert.equal(lowering.curveRoot, repeat.curveRoot);
  assert.equal(lowering.sceneRoot, repeat.sceneRoot);
  assert.equal(lowering.root, repeat.root);
  assert.equal(verifyVsrCurveSpatialScene(lowering), true);
  const tampered = structuredClone(lowering) as VSRCurveSpatialSceneResult;
  tampered.points[1]!.position[1] += 0.2;
  assert.equal(verifyVsrCurveSpatialScene(tampered), false);
});

test('VSR lowers a bounded RGBA voxel grid into rooted cube nodes', async () => {
  const bytes = new Uint8Array(16 + 8 * 4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 2, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, 2, true);
  const colors = [
    [70, 170, 255, 220], [0, 0, 0, 0], [80, 220, 180, 210], [0, 0, 0, 0],
    [255, 130, 70, 230], [0, 0, 0, 0], [190, 100, 255, 200], [0, 0, 0, 0]
  ];
  colors.forEach((color, index) => color.forEach((value, channel) => view.setUint8(16 + index * 4 + channel, value)));
  const pages = [bytes.slice(0, 24), bytes.slice(24)];
  const payloadAssetIds = ['asset:voxel:page0', 'asset:voxel:page1'];
  const contentRoot = cryptographicHash(payloadAssetIds.map((assetId, index) => ({assetId, byteLength: pages[index]!.byteLength, byteRoot: cryptographicHash([...pages[index]!])})));
  const manifestBase = {
    format: VSR_NON_MESH_REPRESENTATION_MANIFEST_FORMAT,
    version: '0.1.0',
    component_id: 'crystal-volume',
    asset_id: 'asset:crystal-volume',
    representation_kind: 'voxel',
    profile_id: 'vsr.voxel.u8rgba.v0.1',
    payload_asset_ids: payloadAssetIds,
    payload_format: VSR_VOXEL_PAYLOAD_FORMAT,
    payload_byte_length: bytes.byteLength,
    element_count: 8,
    bounds: {min: [-1, -1, -1], max: [1, 1, 1]},
    content_root: contentRoot,
    candidate_only: true,
    authoritative: false
  };
  const assets = [
    {id: 'asset:voxel:manifest', kind: 'representation-manifest', format: 'application/json', metadata: {role: 'representation-manifest'}},
    ...payloadAssetIds.map(id => ({id, kind: 'representation-data', format: VSR_VOXEL_PAYLOAD_FORMAT})),
    {id: 'asset:voxel:note', kind: 'other', format: 'text/plain'}
  ] as VSRNonMeshRepresentationAsset[];
  const payloads = new Map<string, Uint8Array>([
    ['asset:voxel:manifest', new TextEncoder().encode(JSON.stringify({...manifestBase, manifest_root: cryptographicHash(manifestBase)}))],
    [payloadAssetIds[0]!, pages[0]!],
    [payloadAssetIds[1]!, pages[1]!],
    ['asset:voxel:note', new Uint8Array([8])]
  ]);
  const handler = createVsrNonMeshRepresentationComponentImportHandler({representationKind: 'voxel', handlerId: 'vsr.voxel-component-import.v0.1'});
  const result = await handler.compile({entry: {component_id: 'crystal-volume', asset_id: 'asset:crystal-volume', representation_kind: 'voxel'}, assets, payloads});
  const lowering = lowerVsrVoxelCandidateToSpatialScene(result.candidate as VSRVoxelRepresentationCandidate, {assets, payloads}, {sceneId: 'voxel-regression', maxVoxels: 8});
  const repeat = lowerVsrVoxelCandidateToSpatialScene(result.candidate as VSRVoxelRepresentationCandidate, {assets, payloads}, {sceneId: 'voxel-regression', maxVoxels: 8});
  const frame = renderSpatialReference(lowering.scene, {width: 96, height: 96, enableShadows: false, transparencyMode: 'weighted-blended-oit'});
  assert.equal(result.candidate.renderStatus, 'NOT_IMPLEMENTED');
  assert.deepEqual(lowering.grid, {width: 2, height: 2, depth: 2});
  assert.equal(lowering.sourceElementCount, 8);
  assert.equal(lowering.voxelCount, 8);
  assert.equal(lowering.occupiedCount, 4);
  assert.equal(lowering.renderableCount, 4);
  assert.equal(lowering.scene.meshes.length, 1);
  assert.equal(lowering.scene.nodes.length, 4);
  assert.ok(frame.framePlan.stats.visibleDraws > 0);
  assert.ok(frame.framePlan.stats.transparentDraws > 0);
  assert.equal(lowering.voxelRoot, repeat.voxelRoot);
  assert.equal(lowering.sceneRoot, repeat.sceneRoot);
  assert.equal(lowering.root, repeat.root);
  assert.equal(verifyVsrVoxelSpatialScene(lowering), true);
  const tampered = structuredClone(lowering) as VSRVoxelSpatialSceneResult;
  tampered.voxels[0]!.x = 1;
  assert.equal(verifyVsrVoxelSpatialScene(tampered), false);
});

test('VSR lowers a fixed-grid SDF into a rooted surface mesh with logical page binding', async () => {
  const gridSize = 5;
  const bytes = new Uint8Array(16 + gridSize * gridSize * gridSize * 4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, gridSize, true);
  view.setUint32(4, gridSize, true);
  view.setUint32(8, gridSize, true);
  for (let z = 0; z < gridSize; z++) {
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const px = -1 + (2 * x) / (gridSize - 1);
        const py = -1 + (2 * y) / (gridSize - 1);
        const pz = -1 + (2 * z) / (gridSize - 1);
        const distance = Math.hypot(px, py, pz) - 0.7;
        view.setFloat32(16 + (x + gridSize * (y + gridSize * z)) * 4, distance, true);
      }
    }
  }
  const pages = [bytes.slice(0, 220), bytes.slice(220)];
  const sourcePayloadAssetIds = ['logical:sdf:page0', 'logical:sdf:page1'];
  const payloadAssetIds = ['physical:sdf:page0', 'physical:sdf:page1'];
  const contentRoot = cryptographicHash(sourcePayloadAssetIds.map((assetId, index) => ({assetId, byteLength: pages[index]!.byteLength, byteRoot: cryptographicHash([...pages[index]!])})));
  const candidateBase = {
    format: 'vsr.non-mesh-representation-candidate.v0.1' as const,
    version: '0.1.0' as const,
    componentId: 'sdf-orb',
    representationKind: 'sdf' as const,
    profileId: 'vsr.sdf.f32grid.v0.1',
    payloadAssetIds,
    sourcePayloadAssetIds,
    payloadFormat: VSR_SDF_PAYLOAD_FORMAT,
    payloadByteLength: bytes.byteLength,
    elementCount: gridSize * gridSize * gridSize,
    bounds: {min: [-1, -1, -1] as [number, number, number], max: [1, 1, 1] as [number, number, number]},
    manifestRoot: root('c'),
    contentRoot,
    renderStatus: 'NOT_IMPLEMENTED' as const,
    candidateOnly: true as const,
    authoritative: false as const
  };
  const candidate = {...candidateBase, candidateRoot: cryptographicHash(candidateBase)} as VSRSdfRepresentationCandidate;
  const assets = payloadAssetIds.map((id, index) => ({id, kind: 'representation-data', format: VSR_SDF_PAYLOAD_FORMAT, metadata: {source_asset_id: sourcePayloadAssetIds[index]}})) as VSRNonMeshRepresentationAsset[];
  const payloads = new Map<string, Uint8Array>([[payloadAssetIds[0]!, pages[0]!], [payloadAssetIds[1]!, pages[1]!]]);
  const lowering = lowerVsrSdfCandidateToSpatialScene(candidate, {assets, payloads}, {sceneId: 'sdf-regression', maxTriangles: 1024});
  const repeat = lowerVsrSdfCandidateToSpatialScene(candidate, {assets, payloads}, {sceneId: 'sdf-regression', maxTriangles: 1024});
  const frame = renderSpatialReference(lowering.scene, {width: 96, height: 96, enableShadows: false});
  assert.equal(lowering.renderStatus, 'CANDIDATE_CPU_MARCHING_TETRAHEDRA');
  assert.deepEqual(lowering.grid, {width: gridSize, height: gridSize, depth: gridSize});
  assert.equal(lowering.sourceElementCount, 125);
  assert.equal(lowering.sourceCellCount, 64);
  assert.ok(lowering.triangleCount > 0);
  assert.equal(lowering.scene.meshes.length, 1);
  assert.equal(lowering.scene.nodes.length, 1);
  assert.ok(frame.framePlan.stats.visibleDraws > 0);
  assert.equal(lowering.meshRoot, repeat.meshRoot);
  assert.equal(lowering.sceneRoot, repeat.sceneRoot);
  assert.equal(lowering.root, repeat.root);
  assert.equal(verifyVsrSdfSpatialScene(lowering), true);
  const tampered = structuredClone(lowering) as VSRSdfSpatialSceneResult;
  tampered.scene.meshes[0]!.positions[0]! += 0.1;
  assert.equal(verifyVsrSdfSpatialScene(tampered), false);
});

test('VSR decodes bounded Gaussian records into a rooted transparent billboard candidate', async () => {
  const records = [
    [0, 0, 0, 0.45, 0.3, 0.2, 0, 0, 0, 1, 0.95, 0.25, 0.1, 0.72],
    [-0.45, 0.1, 0, 0.2, 0.35, 0.25, 0, 0.15, 0, 0.9887, 0.1, 0.55, 1, 0.58],
    [0.4, -0.1, -0.1, 0.25, 0.18, 0.4, 0.15, 0, 0, 0.9887, 0.15, 0.75, 1, 0.64]
  ];
  const bytes = new Uint8Array(16 + records.length * 56);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, records.length, true);
  records.forEach((record, index) => record.forEach((value, field) => view.setFloat32(16 + index * 56 + field * 4, value, true)));
  const pages = [bytes.slice(0, 100), bytes.slice(100)];
  const sourcePayloadAssetIds = ['logical:splats:page0', 'logical:splats:page1'];
  const payloadAssetIds = ['physical:splats:page0', 'physical:splats:page1'];
  const contentRoot = cryptographicHash(sourcePayloadAssetIds.map((assetId, index) => ({assetId, byteLength: pages[index]!.byteLength, byteRoot: cryptographicHash([...pages[index]!])})));
  const candidateBase = {
    format: 'vsr.non-mesh-representation-candidate.v0.1' as const,
    version: '0.1.0' as const,
    componentId: 'splat-cluster',
    representationKind: 'gaussian-splat' as const,
    profileId: 'vsr.gaussian-splat.f32rgba.v0.1',
    payloadAssetIds,
    sourcePayloadAssetIds,
    payloadFormat: VSR_GAUSSIAN_SPLAT_PAYLOAD_FORMAT,
    payloadByteLength: bytes.byteLength,
    elementCount: records.length,
    bounds: {min: [-1, -1, -1] as [number, number, number], max: [1, 1, 1] as [number, number, number]},
    manifestRoot: root('d'),
    contentRoot,
    renderStatus: 'NOT_IMPLEMENTED' as const,
    candidateOnly: true as const,
    authoritative: false as const
  };
  const candidate = {...candidateBase, candidateRoot: cryptographicHash(candidateBase)} as VSRGaussianSplatRepresentationCandidate;
  const assets = payloadAssetIds.map((id, index) => ({id, kind: 'representation-data', format: VSR_GAUSSIAN_SPLAT_PAYLOAD_FORMAT, metadata: {source_asset_id: sourcePayloadAssetIds[index]}})) as VSRNonMeshRepresentationAsset[];
  const payloads = new Map<string, Uint8Array>([[payloadAssetIds[0]!, pages[0]!], [payloadAssetIds[1]!, pages[1]!]]);
  const lowering = lowerVsrGaussianSplatCandidateToSpatialScene(candidate, {assets, payloads}, {sceneId: 'gaussian-regression', maxSplats: 3});
  const repeat = lowerVsrGaussianSplatCandidateToSpatialScene(candidate, {assets, payloads}, {sceneId: 'gaussian-regression', maxSplats: 3});
  const frame = renderSpatialReference(lowering.scene, {width: 96, height: 96, enableShadows: false, transparencyMode: 'weighted-blended-oit'});
  assert.equal(lowering.renderStatus, 'CANDIDATE_CPU_GAUSSIAN_CROSS_BILLBOARD');
  assert.equal(lowering.sourceElementCount, records.length);
  assert.equal(lowering.splatCount, records.length);
  assert.equal(lowering.renderableCount, records.length);
  assert.equal(lowering.scene.meshes.length, 1);
  assert.equal(lowering.scene.nodes.length, records.length);
  assert.equal(frame.framePlan.stats.visibleDraws, records.length);
  assert.equal(frame.framePlan.stats.transparentDraws, records.length);
  assert.equal(lowering.meshRoot, repeat.meshRoot);
  assert.equal(lowering.sceneRoot, repeat.sceneRoot);
  assert.equal(lowering.root, repeat.root);
  assert.equal(verifyVsrGaussianSplatSpatialScene(lowering), true);
  const tampered = structuredClone(lowering) as VSRGaussianSplatSpatialSceneResult;
  tampered.splats[0]!.center[0] += 0.1;
  assert.equal(verifyVsrGaussianSplatSpatialScene(tampered), false);
});

test('VSR evaluates a bounded neural-field MLP into a rooted surface candidate', async () => {
  const parameters = new Float32Array(132);
  parameters[0] = 8;
  parameters[64] = 1;
  parameters[129] = 0.5;
  parameters[130] = -0.5;
  parameters[131] = 0.25;
  const bytes = new Uint8Array(16 + parameters.length * 4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 3, true);
  view.setUint32(4, 16, true);
  view.setUint32(8, 4, true);
  view.setUint32(12, 1, true);
  parameters.forEach((value, index) => view.setFloat32(16 + index * 4, value, true));
  const pages = [bytes.slice(0, 180), bytes.slice(180)];
  const sourcePayloadAssetIds = ['logical:field:page0', 'logical:field:page1'];
  const payloadAssetIds = ['physical:field:page0', 'physical:field:page1'];
  const contentRoot = cryptographicHash(sourcePayloadAssetIds.map((assetId, index) => ({assetId, byteLength: pages[index]!.byteLength, byteRoot: cryptographicHash([...pages[index]!])})));
  const candidateBase = {
    format: 'vsr.non-mesh-representation-candidate.v0.1' as const,
    version: '0.1.0' as const,
    componentId: 'neural-plane',
    representationKind: 'neural-field' as const,
    profileId: 'vsr.neural-field.mlp3x16x4.f32.v0.1',
    payloadAssetIds,
    sourcePayloadAssetIds,
    payloadFormat: VSR_NEURAL_FIELD_PAYLOAD_FORMAT,
    payloadByteLength: bytes.byteLength,
    elementCount: parameters.length,
    bounds: {min: [-1, -1, -1] as [number, number, number], max: [1, 1, 1] as [number, number, number]},
    manifestRoot: root('e'),
    contentRoot,
    renderStatus: 'NOT_IMPLEMENTED' as const,
    candidateOnly: true as const,
    authoritative: false as const
  };
  const candidate = {...candidateBase, candidateRoot: cryptographicHash(candidateBase)} as VSRNeuralFieldRepresentationCandidate;
  const assets = payloadAssetIds.map((id, index) => ({id, kind: 'representation-data', format: VSR_NEURAL_FIELD_PAYLOAD_FORMAT, metadata: {source_asset_id: sourcePayloadAssetIds[index]}})) as VSRNonMeshRepresentationAsset[];
  const payloads = new Map<string, Uint8Array>([[payloadAssetIds[0]!, pages[0]!], [payloadAssetIds[1]!, pages[1]!]]);
  const lowering = lowerVsrNeuralFieldCandidateToSpatialScene(candidate, {assets, payloads}, {sceneId: 'neural-field-regression', sampleResolution: 9, maxTriangles: 256});
  const repeat = lowerVsrNeuralFieldCandidateToSpatialScene(candidate, {assets, payloads}, {sceneId: 'neural-field-regression', sampleResolution: 9, maxTriangles: 256});
  const frame = renderSpatialReference(lowering.scene, {width: 96, height: 96, enableShadows: false});
  assert.equal(lowering.renderStatus, 'CANDIDATE_CPU_NEURAL_FIELD_SURFACE');
  assert.equal(lowering.parameterCount, parameters.length);
  assert.equal(lowering.sampleResolution, 9);
  assert.equal(lowering.sampleCount, 729);
  assert.ok(lowering.triangleCount > 0);
  assert.equal(lowering.renderableCount, 1);
  assert.equal(lowering.scene.meshes.length, 1);
  assert.equal(lowering.scene.nodes.length, 1);
  assert.equal(frame.framePlan.stats.visibleDraws, 1);
  assert.equal(lowering.meshRoot, repeat.meshRoot);
  assert.equal(lowering.sceneRoot, repeat.sceneRoot);
  assert.equal(lowering.root, repeat.root);
  assert.equal(verifyVsrNeuralFieldSpatialScene(lowering), true);
  const tampered = structuredClone(lowering) as VSRNeuralFieldSpatialSceneResult;
  tampered.sampleResolution = 8;
  assert.equal(verifyVsrNeuralFieldSpatialScene(tampered), false);
});

let passed = 0;
for (const entry of tests) {
  try { await entry.fn(); passed++; console.log(`PASS ${entry.name}`); }
  catch (error) { console.error(`FAIL ${entry.name}`); throw error; }
}
console.log(`VSR representation provider tests: ${passed}/${tests.length} PASS`);
