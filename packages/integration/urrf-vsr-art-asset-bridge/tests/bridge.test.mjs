import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createUrrfVsrArtAssetImportBinding,
  createUrrfVsrArtAssetImporters
} from '../src/index.mjs';
import {verifyUniversalArtAssetComponentRepresentationImportRegistry} from '@taowind/large-world-runtime';
import {rootHash} from '@taowind/rncs-core-contract';

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
