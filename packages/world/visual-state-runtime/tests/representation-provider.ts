import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cryptographicHash } from '../packages/spec/src/index.js';
import {
  createSpark3DGSVisualBinding,
  createVsrNonMeshRepresentationComponentImportHandler,
  createVsrNonMeshRepresentationComponentImportHandlerSet,
  inspectVisualRepresentationProvider,
  verifyVsrNonMeshRepresentationImportReceipt,
  verifyVisualRepresentationBinding,
  VSR_NON_MESH_REPRESENTATION_MANIFEST_FORMAT,
  VSR_NON_MESH_REPRESENTATION_KINDS,
  type VSRNonMeshRepresentationAsset,
  type VSRRepresentationProviderManifest,
  type VSRRepresentationReference
} from '../packages/representation-provider/src/index.js';
import {
  lowerVsrPointCloudCandidateToSpatialScene,
  lowerVsrCurveCandidateToSpatialScene,
  lowerVsrVoxelCandidateToSpatialScene,
  renderSpatialReference,
  verifyVsrCurveSpatialScene,
  verifyVsrVoxelSpatialScene,
  verifyVsrPointCloudSpatialScene,
  VSR_POINT_CLOUD_PAYLOAD_FORMAT,
  VSR_CURVE_PAYLOAD_FORMAT,
  VSR_VOXEL_PAYLOAD_FORMAT,
  type VSRPointCloudRepresentationCandidate,
  type VSRPointCloudSpatialSceneResult,
  type VSRCurveRepresentationCandidate,
  type VSRCurveSpatialSceneResult,
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

let passed = 0;
for (const entry of tests) {
  try { await entry.fn(); passed++; console.log(`PASS ${entry.name}`); }
  catch (error) { console.error(`FAIL ${entry.name}`); throw error; }
}
console.log(`VSR representation provider tests: ${passed}/${tests.length} PASS`);
