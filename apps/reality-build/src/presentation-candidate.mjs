import {rootHash,sha256} from './canonical.mjs';

export const REALITY_BUILD_SPATIAL_PRESENTATION_FORMAT = 'reality-build.spatial-presentation-candidate.v0.1';
export const REALITY_BUILD_SPATIAL_PRESENTATION_VERSION = '0.1.0-alpha.1';
export const REALITY_BUILD_SPATIAL_ASSET_BUNDLE_FORMAT = 'reality-build.spatial-asset-bundle.v0.1';
export const REALITY_BUILD_SPATIAL_ASSET_BUNDLE_VERSION = '0.1.0-alpha.1';
const CANDIDATE_AUTHORITY = 'candidate-build-presentation-only';

export class RealityBuildSpatialPresentationCandidateError extends Error {
  constructor(code, message, details = undefined) {
    super(`${code}: ${message}`);
    this.name = 'RealityBuildSpatialPresentationCandidateError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details = undefined) {
  throw new RealityBuildSpatialPresentationCandidateError(code, message, details);
}

function clone(value) {
  return structuredClone(value);
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function payloadBytes(value) {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return null;
}

function decodePayload(value) {
  if (typeof value !== 'string' || Buffer.from(value, 'base64').toString('base64') !== value) return null;
  return new Uint8Array(Buffer.from(value, 'base64'));
}

function normalizeAssetBundle(assetBundle) {
  if (assetBundle?.format === REALITY_BUILD_SPATIAL_ASSET_BUNDLE_FORMAT) {
    if (!verifySpatialAssetBundle(assetBundle)) fail('REALITY_BUILD_SPATIAL_ASSET_BUNDLE_INVALID', 'Presentation asset bundle seal is invalid');
    return clone(assetBundle);
  }
  if (!isRecord(assetBundle) || !isRecord(assetBundle.manifest) || !Array.isArray(assetBundle.assets)) {
    fail('REALITY_BUILD_SPATIAL_ASSET_BUNDLE_INVALID', 'Presentation asset bundle requires a provider manifest and asset entries');
  }
  const assets = assetBundle.assets.map((entry, index) => {
    const record = isRecord(entry?.record) ? clone(entry.record) : null;
    const bytes = payloadBytes(entry?.payload) ?? decodePayload(entry?.payload_base64);
    if (!record || !String(record.id ?? '').trim() || !bytes) fail('REALITY_BUILD_SPATIAL_ASSET_ENTRY_INVALID', `Presentation asset ${index} is missing a record or byte payload`);
    if (record.byteLength !== bytes.byteLength || String(record.sha256 ?? '').toLowerCase() !== sha256(bytes)) {
      fail('REALITY_BUILD_SPATIAL_ASSET_PAYLOAD_MISMATCH', `Presentation asset ${record.id} does not match its declared length or SHA-256`);
    }
    return {record, payload_base64: Buffer.from(bytes).toString('base64')};
  }).sort((a, b) => String(a.record.id).localeCompare(String(b.record.id)));
  const base = {
    format: REALITY_BUILD_SPATIAL_ASSET_BUNDLE_FORMAT,
    version: REALITY_BUILD_SPATIAL_ASSET_BUNDLE_VERSION,
    provider_format: String(assetBundle.format ?? ''),
    provider_version: String(assetBundle.version ?? ''),
    provider_bundle_root: String(assetBundle.bundle_root ?? ''),
    manifest: clone(assetBundle.manifest),
    assets
  };
  if (!base.provider_format || !base.provider_version || !base.provider_bundle_root) fail('REALITY_BUILD_SPATIAL_ASSET_PROVIDER_ROOT_REQUIRED', 'Presentation asset bundle must retain the provider format, version, and bundle root');
  return {...base, asset_bundle_root: rootHash(base)};
}

export function verifySpatialAssetBundle(value) {
  try {
    if (!isRecord(value) || value.format !== REALITY_BUILD_SPATIAL_ASSET_BUNDLE_FORMAT || value.version !== REALITY_BUILD_SPATIAL_ASSET_BUNDLE_VERSION || !isRecord(value.manifest) || !Array.isArray(value.assets)) return false;
    const {asset_bundle_root: assetBundleRoot, ...base} = value;
    if (typeof assetBundleRoot !== 'string' || rootHash(base) !== assetBundleRoot) return false;
    const ids = new Set();
    for (const entry of value.assets) {
      const record = entry?.record;
      const bytes = decodePayload(entry?.payload_base64);
      if (!isRecord(record) || !String(record.id ?? '').trim() || ids.has(record.id) || !bytes) return false;
      if (record.byteLength !== bytes.byteLength || String(record.sha256 ?? '').toLowerCase() !== sha256(bytes)) return false;
      ids.add(record.id);
    }
    return Boolean(value.provider_format && value.provider_version && value.provider_bundle_root);
  } catch {
    return false;
  }
}

export function spatialAssetBundlePayloads(candidate) {
  const bundle = candidate?.presentation?.asset_bundle;
  if (!bundle) return null;
  if (!verifySpatialAssetBundle(bundle)) fail('REALITY_BUILD_SPATIAL_ASSET_BUNDLE_SEAL_INVALID', 'Presentation asset bundle seal or payload hash is invalid');
  return bundle.assets.map(entry => ({record: clone(entry.record), bytes: new Uint8Array(Buffer.from(entry.payload_base64, 'base64'))}));
}

function normalizeScene(scene) {
  if (!isRecord(scene) || scene.format !== 'vsr.spatial-scene.v0.4' || !Array.isArray(scene.nodes)) {
    fail('REALITY_BUILD_SPATIAL_PRESENTATION_SCENE_INVALID', 'Build presentation candidate requires a VSR spatial scene with nodes');
  }
  const nodeIds = new Set();
  for (const [index, node] of scene.nodes.entries()) {
    const nodeId = String(node?.id ?? '').trim();
    if (!nodeId) fail('REALITY_BUILD_SPATIAL_PRESENTATION_NODE_ID_INVALID', `VSR node ${index} has no id`);
    if (nodeIds.has(nodeId)) fail('REALITY_BUILD_SPATIAL_PRESENTATION_NODE_DUPLICATE', `VSR node id ${nodeId} is duplicated`);
    nodeIds.add(nodeId);
  }
  return {scene: clone(scene), nodeIds};
}

/**
 * Derive an explicit candidate-only provider-record to world-mesh plan. The
 * provider metadata is used only to name the source mesh; records that do not
 * identify a mesh present in the scene (for example a showcase asset) remain
 * packaged but are deliberately not bound implicitly.
 */
export function createSpatialAssetBindingPlan({scene, assetBundle} = {}) {
  const normalizedScene = normalizeScene(scene).scene;
  const normalizedBundle = normalizeAssetBundle(assetBundle);
  const meshIds = new Set((normalizedScene.meshes ?? []).map(mesh => String(mesh?.id ?? '')).filter(Boolean));
  const nodeIdsByMesh = new Map();
  for (const node of normalizedScene.nodes) {
    const meshId = String(node?.meshId ?? '').trim();
    if (!meshId || !meshIds.has(meshId)) continue;
    const list = nodeIdsByMesh.get(meshId) ?? [];
    list.push(String(node.id));
    nodeIdsByMesh.set(meshId, list);
  }
  const groups = new Map();
  for (const entry of normalizedBundle.assets) {
    const record = entry.record;
    const sourceMeshId = String(record.metadata?.source_mesh_id ?? '').trim();
    const lod = Number(record.metadata?.lod);
    if (!sourceMeshId || !meshIds.has(sourceMeshId) || !Number.isInteger(lod) || lod < 0 || !(nodeIdsByMesh.get(sourceMeshId)?.length)) continue;
    const group = groups.get(sourceMeshId) ?? {mode: 'replace-mesh', source_mesh_id: sourceMeshId, node_ids: [...new Set(nodeIdsByMesh.get(sourceMeshId))].sort(), assets: []};
    group.assets.push({asset_id: String(record.id), lod, cell_ids: [...new Set(record.cellIds ?? [])].map(String).sort()});
    groups.set(sourceMeshId, group);
  }
  return [...groups.values()].sort((a, b) => a.source_mesh_id.localeCompare(b.source_mesh_id)).map(group => ({
    ...group,
    assets: group.assets.sort((a, b) => a.lod - b.lod || a.asset_id.localeCompare(b.asset_id)),
  }));
}

function normalizeAssetBindings(bindings, scene, assetBundle) {
  if (bindings === undefined || (Array.isArray(bindings) && bindings.length === 0)) return [];
  if (!Array.isArray(bindings)) fail('REALITY_BUILD_SPATIAL_PRESENTATION_ASSET_BINDINGS_INVALID', 'Presentation asset bindings must be an array');
  if (!assetBundle) fail('REALITY_BUILD_SPATIAL_PRESENTATION_ASSET_BUNDLE_REQUIRED', 'Presentation asset bindings require an asset bundle');
  const sceneMeshIds = new Set((scene.meshes ?? []).map(mesh => String(mesh?.id ?? '')).filter(Boolean));
  const sceneNodes = new Map(scene.nodes.map(node => [String(node.id), node]));
  const records = new Map(assetBundle.assets.map(entry => [String(entry.record.id), entry.record]));
  const sourceMeshIds = new Set();
  const assetIds = new Set();
  return bindings.map((binding, index) => {
    if (!isRecord(binding)) fail('REALITY_BUILD_SPATIAL_PRESENTATION_ASSET_BINDING_INVALID', `Presentation asset binding ${index} is not an object`);
    const mode = String(binding.mode ?? 'replace-mesh');
    const sourceMeshId = String(binding.source_mesh_id ?? binding.sourceMeshId ?? '').trim();
    const nodeIds = [...new Set((binding.node_ids ?? binding.nodeIds ?? []).map(String))].sort();
    if (mode !== 'replace-mesh') fail('REALITY_BUILD_SPATIAL_PRESENTATION_ASSET_BINDING_MODE_UNSUPPORTED', `Presentation asset binding ${index} must use replace-mesh`);
    if (!sourceMeshId || !sceneMeshIds.has(sourceMeshId)) fail('REALITY_BUILD_SPATIAL_PRESENTATION_ASSET_BINDING_SOURCE_MISSING', `Presentation asset binding ${index} names an unknown source mesh`);
    if (sourceMeshIds.has(sourceMeshId)) fail('REALITY_BUILD_SPATIAL_PRESENTATION_ASSET_BINDING_DUPLICATE_SOURCE', `Presentation source mesh ${sourceMeshId} is bound more than once`);
    if (!nodeIds.length) fail('REALITY_BUILD_SPATIAL_PRESENTATION_ASSET_BINDING_NODES_REQUIRED', `Presentation asset binding ${index} needs target nodes`);
    for (const nodeId of nodeIds) if (!sceneNodes.has(nodeId) || sceneNodes.get(nodeId)?.meshId !== sourceMeshId) fail('REALITY_BUILD_SPATIAL_PRESENTATION_ASSET_BINDING_NODE_MISMATCH', `Presentation asset binding ${index} targets a node outside ${sourceMeshId}`);
    if (!Array.isArray(binding.assets) || !binding.assets.length) fail('REALITY_BUILD_SPATIAL_PRESENTATION_ASSET_BINDING_ASSETS_REQUIRED', `Presentation asset binding ${index} needs provider assets`);
    const assets = binding.assets.map((asset, assetIndex) => {
      const assetId = String(asset?.asset_id ?? asset?.assetId ?? '').trim();
      const lod = Number(asset?.lod);
      const record = records.get(assetId);
      if (!assetId || !record || assetIds.has(assetId)) fail('REALITY_BUILD_SPATIAL_PRESENTATION_ASSET_BINDING_ASSET_INVALID', `Presentation asset binding ${index} asset ${assetIndex} is invalid or duplicated`);
      if (!Number.isInteger(lod) || lod < 0 || String(record.metadata?.source_mesh_id ?? '') !== sourceMeshId || Number(record.metadata?.lod) !== lod) fail('REALITY_BUILD_SPATIAL_PRESENTATION_ASSET_BINDING_RECORD_MISMATCH', `Presentation asset binding ${index} asset ${assetId} does not match its provider metadata`);
      assetIds.add(assetId);
      return {asset_id: assetId, lod, cell_ids: [...new Set((asset.cell_ids ?? asset.cellIds ?? record.cellIds ?? []).map(String))].sort()};
    }).sort((a, b) => a.lod - b.lod || a.asset_id.localeCompare(b.asset_id));
    sourceMeshIds.add(sourceMeshId);
    return {...clone(binding), mode, source_mesh_id: sourceMeshId, node_ids: nodeIds, assets};
  }).sort((a, b) => a.source_mesh_id.localeCompare(b.source_mesh_id));
}

function normalizeBindings(bindings, nodeIds) {
  if (!Array.isArray(bindings)) fail('REALITY_BUILD_SPATIAL_PRESENTATION_BINDINGS_INVALID', 'Presentation bindings must be an array');
  const bodyIds = new Set();
  const normalized = [];
  for (const [index, binding] of bindings.entries()) {
    if (!isRecord(binding)) fail('REALITY_BUILD_SPATIAL_PRESENTATION_BINDING_INVALID', `Presentation binding ${index} is not an object`);
    const bodyId = String(binding.body_id ?? binding.bodyId ?? '').trim();
    const nodeId = String(binding.node_id ?? binding.nodeId ?? '').trim();
    const positionScale = Number(binding.position_scale ?? binding.positionScale ?? 1000);
    if (!bodyId || !nodeId) fail('REALITY_BUILD_SPATIAL_PRESENTATION_BINDING_ID_INVALID', `Presentation binding ${index} needs body_id and node_id`);
    if (bodyIds.has(bodyId)) fail('REALITY_BUILD_SPATIAL_PRESENTATION_BINDING_DUPLICATE_BODY', `Presentation body ${bodyId} is bound more than once`);
    if (!nodeIds.has(nodeId)) fail('REALITY_BUILD_SPATIAL_PRESENTATION_BINDING_NODE_MISSING', `Presentation node ${nodeId} does not exist`);
    if (!Number.isFinite(positionScale) || positionScale <= 0) fail('REALITY_BUILD_SPATIAL_PRESENTATION_BINDING_SCALE_INVALID', `Presentation binding ${index} has an invalid position scale`);
    bodyIds.add(bodyId);
    normalized.push({
      ...clone(binding),
      body_id: bodyId,
      node_id: nodeId,
      position_scale: positionScale,
    });
  }
  return normalized;
}

export function createSpatialPresentationCandidate({projectRoot, scene, source, bindings = [], assetBundle = null, assetBindings = []} = {}) {
  const normalizedProjectRoot = String(projectRoot ?? '').trim();
  if (!normalizedProjectRoot) fail('REALITY_BUILD_SPATIAL_PRESENTATION_PROJECT_ROOT_INVALID', 'Build presentation candidate requires a project root');
  if (!isRecord(source)) fail('REALITY_BUILD_SPATIAL_PRESENTATION_SOURCE_INVALID', 'Build presentation candidate requires a structured source reference');
  const normalizedScene = normalizeScene(scene);
  const normalizedBindings = normalizeBindings(bindings, normalizedScene.nodeIds);
  const normalizedAssetBundle = assetBundle === null || assetBundle === undefined ? null : normalizeAssetBundle(assetBundle);
  const normalizedAssetBindings = normalizeAssetBindings(assetBindings, normalizedScene.scene, normalizedAssetBundle);
  const sourceBase = {
    format: REALITY_BUILD_SPATIAL_PRESENTATION_FORMAT,
    version: REALITY_BUILD_SPATIAL_PRESENTATION_VERSION,
    authority: CANDIDATE_AUTHORITY,
    project_root: normalizedProjectRoot,
    source: clone(source),
    scene_root: rootHash(normalizedScene.scene),
    bindings: normalizedBindings,
    ...(normalizedAssetBundle ? {asset_bundle: normalizedAssetBundle} : {}),
    ...(normalizedAssetBindings.length ? {asset_bindings: normalizedAssetBindings} : {})
  };
  const presentationSourceRoot = rootHash(sourceBase);
  const presentation = {
    ...sourceBase,
    scene: normalizedScene.scene,
    presentation_source_root: presentationSourceRoot,
    presentation_root: rootHash({...sourceBase, presentation_source_root: presentationSourceRoot}),
  };
  return {
    format: REALITY_BUILD_SPATIAL_PRESENTATION_FORMAT,
    version: REALITY_BUILD_SPATIAL_PRESENTATION_VERSION,
    authority: CANDIDATE_AUTHORITY,
    presentation,
  };
}

export function verifySpatialPresentationCandidate(value, {projectRoot = null} = {}) {
  try {
    if (!value || value.format !== REALITY_BUILD_SPATIAL_PRESENTATION_FORMAT || value.version !== REALITY_BUILD_SPATIAL_PRESENTATION_VERSION || value.authority !== CANDIDATE_AUTHORITY) return false;
    const presentation = value.presentation;
    if (!isRecord(presentation) || presentation.format !== REALITY_BUILD_SPATIAL_PRESENTATION_FORMAT || presentation.version !== REALITY_BUILD_SPATIAL_PRESENTATION_VERSION || presentation.authority !== CANDIDATE_AUTHORITY) return false;
    if (typeof presentation.project_root !== 'string' || !presentation.project_root.trim()) return false;
    if (projectRoot !== null && presentation.project_root !== projectRoot) return false;
    const {presentation_root: presentationRoot, scene, ...presentationBase} = presentation;
    if (!presentationRoot || !scene || rootHash(presentationBase) !== presentationRoot) return false;
    if (!isRecord(presentationBase.source) || !Array.isArray(presentationBase.bindings)) return false;
    if (presentationBase.asset_bundle !== undefined && !verifySpatialAssetBundle(presentationBase.asset_bundle)) return false;
    const normalizedScene = normalizeScene(scene);
    if (rootHash(scene) !== presentationBase.scene_root) return false;
    if (presentation.presentation_source_root !== rootHash({...presentationBase, presentation_source_root: undefined})) return false;
    if (presentationBase.asset_bindings !== undefined) {
      const normalizedAssetBindings = normalizeAssetBindings(presentationBase.asset_bindings, normalizedScene.scene, presentationBase.asset_bundle);
      if (normalizedAssetBindings.some((binding, index) => rootHash(binding) !== rootHash(presentationBase.asset_bindings[index]))) return false;
    }
    return normalizeBindings(presentationBase.bindings, normalizedScene.nodeIds).every((binding, index) => rootHash(binding) === rootHash(presentationBase.bindings[index]));
  } catch {
    return false;
  }
}
