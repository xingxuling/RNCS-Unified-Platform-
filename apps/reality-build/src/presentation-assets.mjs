import fs from 'node:fs';
import path from 'node:path';
import {rootHash,writeJson,ensureDir} from './canonical.mjs';
import {spatialAssetBundlePayloads} from './presentation-candidate.mjs';

export const REALITY_BUILD_SPATIAL_PAYLOAD_FORMAT = 'reality-build.spatial-presentation-payloads.v0.1';
export const REALITY_BUILD_SPATIAL_PAYLOAD_VERSION = '0.1.0-alpha.1';

function extension(record) {
  const format = String(record?.format ?? '').toLowerCase();
  if (format === 'model/gltf-binary') return 'glb';
  if (format === 'model/gltf+json') return 'gltf';
  return 'bin';
}

function writePayload(file, bytes) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, Buffer.from(bytes));
  fs.utimesSync(file, new Date(0), new Date(0));
}

/**
 * Materialize a candidate-only presentation bundle into a target payload map.
 * The provider record identity is retained; only the target transport URI is
 * added. This does not import the payload into the VSR scene.
 */
export function materializeSpatialAssetPayloads(candidate, {targetRoot = null, embedded = false} = {}) {
  const sourceBundle = candidate?.presentation?.asset_bundle;
  if (!sourceBundle) return null;
  const entries = spatialAssetBundlePayloads(candidate);
  const payloads = [];
  const files = [];
  let byteLength = 0;
  for (const {record, bytes} of entries) {
    const relativePath = `assets/spatial/${record.sha256}.${extension(record)}`;
    if (targetRoot) {
      writePayload(path.join(targetRoot, relativePath), bytes);
      files.push(relativePath);
    }
    const payload = {
      id: record.id,
      sha256: record.sha256,
      byteLength: bytes.byteLength,
      ...(embedded ? {base64: Buffer.from(bytes).toString('base64')} : {uri: `./${relativePath}`})
    };
    payloads.push(payload);
    byteLength += bytes.byteLength;
  }
  const base = {
    format: REALITY_BUILD_SPATIAL_PAYLOAD_FORMAT,
    version: REALITY_BUILD_SPATIAL_PAYLOAD_VERSION,
    provider_format: sourceBundle.provider_format,
    provider_version: sourceBundle.provider_version,
    provider_bundle_root: sourceBundle.provider_bundle_root,
    source_asset_bundle_root: sourceBundle.asset_bundle_root,
    asset_bindings: candidate?.presentation?.asset_bindings ?? [],
    catalog: entries.map(entry => entry.record),
    payloads,
    payload_count: payloads.length,
    byte_length: byteLength,
    files: files.sort()
  };
  return {...base, payload_root: rootHash(base)};
}

export function writeSpatialAssetPayloadManifest(targetRoot, payloads) {
  if (!payloads) return null;
  return writeJson(path.join(targetRoot, 'spatial-asset-payload-manifest.json'), payloads);
}
