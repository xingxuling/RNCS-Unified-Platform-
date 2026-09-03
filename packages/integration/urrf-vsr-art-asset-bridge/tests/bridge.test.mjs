import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createUrrfVsrArtAssetImportBinding,
  createUrrfVsrArtAssetImporters,
  createUrrfVsrArtAssetSpatialImporters
} from '../src/index.mjs';
import {verifyUniversalArtAssetComponentRepresentationImportRegistry} from '@taowind/large-world-runtime';
import {rootHash} from '@taowind/rncs-core-contract';
import {VSR_PBR_MATERIAL_CHANNEL_ROLES} from '@taowind/visual-state-runtime/representation-provider';

test('bridge binds every current URRF representation kind to a distinct VSR handler', () => {
  const importers = createUrrfVsrArtAssetImporters({handlerIdPrefix: 'test.bridge'});
  const kinds = Object.keys(importers).sort();
  assert.deepEqual(kinds, ['animation', 'curve', 'gaussian-splat', 'material', 'mesh', 'neural-field', 'particle', 'point-cloud', 'rig', 'sdf', 'voxel']);
  assert.equal(new Set(Object.values(importers).map(handler => handler.handler_id)).size, kinds.length);
  assert.equal(Object.values(importers).every(handler => handler.representation_kind), true);
  const binding = createUrrfVsrArtAssetImportBinding({handlerIdPrefix: 'test.binding'});
  assert.equal(binding.format, 'urrf.vsr-art-asset-component-bridge.v0.1');
  assert.deepEqual(binding.representation_kinds.sort(), kinds);
  assert.equal(verifyUniversalArtAssetComponentRepresentationImportRegistry(binding.registry).valid, true);
});

test('bridge exposes a verified non-mesh result only after the VSR verifier passes', async () => {
  const verified = [];
  const importers = createUrrfVsrArtAssetImporters({
    handlerIdPrefix: 'test.result',
    onVerifiedResult: value => verified.push(value)
  });
  const payload = new Uint8Array([1, 2, 3, 4]);
  const payloadRoot = rootHash([{assetId: 'logical:payload', byteLength: payload.byteLength, byteRoot: rootHash([...payload])}]);
  const manifestBase = {
    format: 'vsr.non-mesh-representation-manifest.v0.1',
    version: '0.1.0',
    component_id: 'component:sdf',
    asset_id: 'logical:sdf',
    representation_kind: 'sdf',
    profile_id: 'test.sdf',
    payload_asset_ids: ['logical:payload'],
    payload_format: 'application/octet-stream',
    payload_byte_length: payload.byteLength,
    element_count: 1,
    bounds: {min: [0, 0, 0], max: [1, 1, 1]},
    content_root: payloadRoot,
    candidate_only: true,
    authoritative: false
  };
  const manifest = {...manifestBase, manifest_root: rootHash(manifestBase)};
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  const assets = [
    {id: 'physical:manifest', kind: 'representation-manifest', format: 'application/vnd.vsr.non-mesh-manifest+json'},
    {id: 'physical:payload', kind: 'representation-payload', format: 'application/octet-stream', metadata: {source_asset_id: 'logical:payload'}}
  ];
  const result = await importers.sdf.compile({
    entry: {component_id: 'component:sdf', asset_id: 'logical:sdf', representation_kind: 'sdf'},
    assets,
    payloads: new Map([['physical:manifest', manifestBytes], ['physical:payload', payload]])
  });
  assert.equal(verified.length, 0);
  assert.equal(await importers.sdf.verify({result}), true);
  assert.equal(verified.length, 1);
  assert.equal(verified[0].representation_kind, 'sdf');
  assert.equal(verified[0].component_id, 'component:sdf');
  assert.equal(verified[0].result.candidate.representationKind, 'sdf');
});

test('bridge routes a standalone four-channel PBR pack through the material candidate handler', async () => {
  const importers = createUrrfVsrArtAssetImporters({handlerIdPrefix: 'test.material'});
  const assets = VSR_PBR_MATERIAL_CHANNEL_ROLES.map((role, index) => ({
    id: `physical:material:${index}`,
    kind: 'texture',
    format: 'image/png',
    role
  }));
  const payloads = new Map(assets.map((asset, index) => [asset.id, new Uint8Array([index + 1, 2, 3])]));
  const result = await importers.material.compile({
    entry: {component_id: 'component:material', asset_id: 'asset:material', representation_kind: 'material', representation_profile: 'pbr-texture-pack'},
    assets,
    payloads
  });
  assert.equal(result.candidate.format, 'vsr.pbr-material-candidate.v0.1');
  assert.equal(result.candidate.representationKind, 'material');
  assert.equal(result.metrics.pbr_channel_count, 4);
  assert.equal(result.metrics.rendered, 0);
  assert.equal(await importers.material.verify({result}), true);
});

test('explicit spatial mode lowers a verified fixed point-cloud candidate', async () => {
  const bytes = new Uint8Array(32);
  const view = new DataView(bytes.buffer);
  view.setFloat32(0, 0, true);
  view.setFloat32(4, 0, true);
  view.setFloat32(8, 0, true);
  view.setFloat32(12, 1, true);
  view.setFloat32(16, 0.25, true);
  view.setFloat32(20, 0.1, true);
  view.setFloat32(24, 1, true);
  view.setFloat32(28, 0.1, true);
  const payloadRoot = rootHash([{assetId: 'logical:point-page', byteLength: bytes.byteLength, byteRoot: rootHash([...bytes])}]);
  const manifestBase = {
    format: 'vsr.non-mesh-representation-manifest.v0.1',
    version: '0.1.0',
    component_id: 'component:points',
    asset_id: 'logical:points',
    representation_kind: 'point-cloud',
    profile_id: 'vsr.point-cloud.f32rgba.v0.1',
    payload_asset_ids: ['logical:point-page'],
    payload_format: 'application/vnd.vsr.point-cloud.f32rgba.v0.1',
    payload_byte_length: bytes.byteLength,
    element_count: 1,
    bounds: {min: [-1, -1, -1], max: [1, 1, 1]},
    content_root: payloadRoot,
    candidate_only: true,
    authoritative: false
  };
  const manifest = {...manifestBase, manifest_root: rootHash(manifestBase)};
  const handler = createUrrfVsrArtAssetSpatialImporters({
    handlerIdPrefix: 'test.spatial',
    spatial: {'point-cloud': {sceneId: 'scene:points', maxPoints: 1, sizeScale: 1}}
  })['point-cloud'];
  const result = await handler.compile({
    entry: {component_id: 'component:points', asset_id: 'logical:points', representation_kind: 'point-cloud'},
    assets: [
      {id: 'physical:manifest', kind: 'representation-manifest', format: 'application/vnd.vsr.non-mesh-manifest+json'},
      {id: 'physical:point-page', kind: 'representation-payload', format: 'application/vnd.vsr.point-cloud.f32rgba.v0.1', metadata: {source_asset_id: 'logical:point-page'}}
    ],
    payloads: new Map([
      ['physical:manifest', new TextEncoder().encode(JSON.stringify(manifest))],
      ['physical:point-page', bytes]
    ])
  });
  assert.equal(result.spatial.renderStatus, 'CANDIDATE_CPU_BILLBOARD');
  assert.equal(result.spatial.pointCount, 1);
  assert.equal(result.output_root, result.spatial.root);
  assert.equal(result.metrics.rendered, 1);
  assert.equal(await handler.verify({result}), true);
});
