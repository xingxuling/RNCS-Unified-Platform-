import { cryptographicHash } from '../../spec/src/index.js';
import type { Vec3, Vec4, VSRSpatialMaterial, VSRSpatialMesh, VSRSpatialNode, VSRSpatialScene3D } from './index.js';

export const VSR_GAUSSIAN_SPLAT_PAYLOAD_FORMAT = 'application/vnd.vsr.gaussian-splat.f32rgba.v0.1' as const;
export const VSR_GAUSSIAN_SPLAT_SCENE_FORMAT = 'vsr.spatial-gaussian-splat-scene.v0.1' as const;
export const VSR_GAUSSIAN_SPLAT_SCENE_VERSION = '0.1.0' as const;
export const VSR_GAUSSIAN_SPLAT_HEADER_BYTE_LENGTH = 16;
export const VSR_GAUSSIAN_SPLAT_RECORD_BYTE_LENGTH = 56;
export const VSR_GAUSSIAN_SPLAT_SOURCE_LIMIT = 1000000;
export const VSR_GAUSSIAN_SPLAT_RENDER_LIMIT = 8192;

type JsonRecord = Record<string, unknown>;

export interface VSRGaussianSplatRepresentationCandidate {
  format: 'vsr.non-mesh-representation-candidate.v0.1';
  version: '0.1.0';
  componentId: string;
  representationKind: 'gaussian-splat';
  profileId: string;
  payloadAssetIds: string[];
  sourcePayloadAssetIds?: string[];
  payloadFormat: string;
  payloadByteLength: number;
  elementCount: number;
  bounds: {min: Vec3; max: Vec3};
  manifestRoot: string;
  contentRoot: string;
  renderStatus: 'NOT_IMPLEMENTED';
  candidateOnly: true;
  authoritative: false;
  candidateRoot: string;
}

export interface VSRGaussianSplatPayloadAsset {
  id: string;
  kind?: string;
  format?: string;
  metadata?: JsonRecord;
}

export interface VSRGaussianSplatRecord {
  center: Vec3;
  scale: Vec3;
  rotationQuaternion: Vec4;
  color: [number, number, number, number];
}

export interface VSRGaussianSplatSpatialLoweringOptions {
  baseScene?: VSRSpatialScene3D;
  sceneId?: string;
  title?: string;
  origin?: Vec3;
  maxSplats?: number;
  sizeScale?: number;
  idPrefix?: string;
}

export interface VSRGaussianSplatSpatialSceneResult {
  format: typeof VSR_GAUSSIAN_SPLAT_SCENE_FORMAT;
  version: typeof VSR_GAUSSIAN_SPLAT_SCENE_VERSION;
  status: 'EXECUTED';
  renderStatus: 'CANDIDATE_CPU_GAUSSIAN_CROSS_BILLBOARD';
  componentId: string;
  sceneId: string;
  sourceCandidateRoot: string;
  contentRoot: string;
  bounds: {min: Vec3; max: Vec3};
  sourceElementCount: number;
  splatCount: number;
  renderableCount: number;
  maxSplats: number;
  truncated: boolean;
  sizeScale: number;
  origin: Vec3;
  splats: VSRGaussianSplatRecord[];
  meshId: string;
  meshRoot: string;
  scene: VSRSpatialScene3D;
  sceneRoot: string;
  splatRoot: string;
  candidateOnly: true;
  authoritative: false;
  root: string;
}

const EPS = 1e-9;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isRoot = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

function safePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.:-]+/g, '-').slice(0, 96) || 'gaussian-splat';
}

function validBounds(bounds: unknown): bounds is {min: Vec3; max: Vec3} {
  if (!bounds || typeof bounds !== 'object' || Array.isArray(bounds)) return false;
  const value = bounds as JsonRecord;
  const min = value.min;
  const max = value.max;
  return Array.isArray(min) && min.length === 3 && min.every(finite)
    && Array.isArray(max) && max.length === 3 && max.every(finite)
    && (min as number[]).every((component, index) => component < (max as number[])[index]!);
}

function candidateBase(candidate: VSRGaussianSplatRepresentationCandidate): Omit<VSRGaussianSplatRepresentationCandidate, 'candidateRoot'> {
  const {candidateRoot: _candidateRoot, ...base} = candidate;
  return base;
}

function sourcePayloadIds(candidate: VSRGaussianSplatRepresentationCandidate): string[] {
  const sourceIds = candidate.sourcePayloadAssetIds ?? candidate.payloadAssetIds;
  if (sourceIds.length !== candidate.payloadAssetIds.length || sourceIds.some(assetId => !nonEmpty(assetId)) || new Set(sourceIds).size !== sourceIds.length) throw new Error('VSR Gaussian logical payload binding is invalid.');
  return sourceIds;
}

function payloadBytes(payloads: Map<string, Uint8Array>, asset: VSRGaussianSplatPayloadAsset): Uint8Array {
  const bytes = payloads.get(asset.id);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new Error(`VSR Gaussian payload ${asset.id} is missing or empty.`);
  return bytes;
}

function contentRoot(candidate: VSRGaussianSplatRepresentationCandidate, assets: VSRGaussianSplatPayloadAsset[], payloads: Map<string, Uint8Array>): string {
  const sourceIds = sourcePayloadIds(candidate);
  return cryptographicHash(candidate.payloadAssetIds.map((assetId, index) => {
    const matches = assets.filter(entry => entry.id === assetId);
    if (matches.length !== 1) throw new Error(`VSR Gaussian payload asset ${assetId} is missing or ambiguous.`);
    const bytes = payloadBytes(payloads, matches[0]!);
    return {assetId: sourceIds[index]!, byteLength: bytes.byteLength, byteRoot: cryptographicHash([...bytes])};
  }));
}

function mergePayload(candidate: VSRGaussianSplatRepresentationCandidate, assets: VSRGaussianSplatPayloadAsset[], payloads: Map<string, Uint8Array>): Uint8Array {
  const ordered = candidate.payloadAssetIds.map(assetId => {
    const matches = assets.filter(entry => entry.id === assetId);
    if (matches.length !== 1) throw new Error(`VSR Gaussian payload asset ${assetId} is missing or ambiguous.`);
    const asset = matches[0]!;
    if ((asset.format ?? asset.metadata?.format) !== candidate.payloadFormat) throw new Error(`VSR Gaussian payload ${assetId} format is not ${candidate.payloadFormat}.`);
    return payloadBytes(payloads, asset);
  });
  const byteLength = ordered.reduce((sum, page) => sum + page.byteLength, 0);
  if (byteLength !== candidate.payloadByteLength) throw new Error('VSR Gaussian payload byte length mismatch.');
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const page of ordered) {
    bytes.set(page, offset);
    offset += page.byteLength;
  }
  return bytes;
}

interface ValidatedPayload {
  bytes: Uint8Array;
  sourceElementCount: number;
}

function quaternion(value: Vec4): Vec4 {
  const length = Math.hypot(value[0], value[1], value[2], value[3]);
  if (!finite(length) || length <= EPS) throw new Error('VSR Gaussian rotation quaternion is invalid.');
  return [value[0] / length, value[1] / length, value[2] / length, value[3] / length];
}

function readSplat(view: DataView, offset: number, index: number, bounds: {min: Vec3; max: Vec3}): VSRGaussianSplatRecord {
  const center: Vec3 = [view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)];
  const scale: Vec3 = [view.getFloat32(offset + 12, true), view.getFloat32(offset + 16, true), view.getFloat32(offset + 20, true)];
  const rotationQuaternion = quaternion([view.getFloat32(offset + 24, true), view.getFloat32(offset + 28, true), view.getFloat32(offset + 32, true), view.getFloat32(offset + 36, true)]);
  const color: [number, number, number, number] = [view.getFloat32(offset + 40, true), view.getFloat32(offset + 44, true), view.getFloat32(offset + 48, true), view.getFloat32(offset + 52, true)];
  if (center.some(component => !finite(component)) || scale.some(component => !finite(component) || component <= EPS || component > 1000) || color.some(component => !finite(component) || component < 0 || component > 1)) throw new Error(`VSR Gaussian splat ${index} contains a non-finite or out-of-range value.`);
  const radius = Math.max(...scale);
  if (center.some((component, axis) => component < bounds.min[axis]! - radius || component > bounds.max[axis]! + radius)) throw new Error(`VSR Gaussian splat ${index} lies outside the declared bounds.`);
  return {center, scale, rotationQuaternion, color};
}

function decodePayload(bytes: Uint8Array, bounds: {min: Vec3; max: Vec3}): {sourceElementCount: number; view: DataView} {
  if (bytes.byteLength < VSR_GAUSSIAN_SPLAT_HEADER_BYTE_LENGTH) throw new Error('VSR Gaussian payload header is missing.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(0, true);
  const flags = [view.getUint32(4, true), view.getUint32(8, true), view.getUint32(12, true)];
  if (!Number.isSafeInteger(count) || count < 1 || count > VSR_GAUSSIAN_SPLAT_SOURCE_LIMIT || flags.some(flag => flag !== 0) || bytes.byteLength !== VSR_GAUSSIAN_SPLAT_HEADER_BYTE_LENGTH + count * VSR_GAUSSIAN_SPLAT_RECORD_BYTE_LENGTH) throw new Error('VSR Gaussian payload header or byte length is invalid.');
  for (let index = 0; index < count; index++) readSplat(view, VSR_GAUSSIAN_SPLAT_HEADER_BYTE_LENGTH + index * VSR_GAUSSIAN_SPLAT_RECORD_BYTE_LENGTH, index, bounds);
  return {sourceElementCount: count, view};
}

function validateCandidate(candidate: VSRGaussianSplatRepresentationCandidate, assets: VSRGaussianSplatPayloadAsset[], payloads: Map<string, Uint8Array>): ValidatedPayload {
  if (!candidate || candidate.format !== 'vsr.non-mesh-representation-candidate.v0.1' || candidate.version !== '0.1.0'
    || !nonEmpty(candidate.componentId) || candidate.representationKind !== 'gaussian-splat' || !nonEmpty(candidate.profileId)
    || !Array.isArray(candidate.payloadAssetIds) || candidate.payloadAssetIds.length < 1
    || new Set(candidate.payloadAssetIds).size !== candidate.payloadAssetIds.length || candidate.payloadAssetIds.some(assetId => !nonEmpty(assetId))
    || candidate.payloadFormat !== VSR_GAUSSIAN_SPLAT_PAYLOAD_FORMAT || !Number.isSafeInteger(candidate.payloadByteLength)
    || candidate.payloadByteLength < VSR_GAUSSIAN_SPLAT_HEADER_BYTE_LENGTH + VSR_GAUSSIAN_SPLAT_RECORD_BYTE_LENGTH
    || !Number.isSafeInteger(candidate.elementCount) || candidate.elementCount < 1 || candidate.elementCount > VSR_GAUSSIAN_SPLAT_SOURCE_LIMIT
    || !validBounds(candidate.bounds) || !isRoot(candidate.manifestRoot) || !isRoot(candidate.contentRoot)
    || candidate.renderStatus !== 'NOT_IMPLEMENTED' || candidate.candidateOnly !== true || candidate.authoritative !== false
    || !isRoot(candidate.candidateRoot) || cryptographicHash(candidateBase(candidate)) !== candidate.candidateRoot) throw new Error('VSR Gaussian candidate contract or root is invalid.');
  sourcePayloadIds(candidate);
  if (contentRoot(candidate, assets, payloads) !== candidate.contentRoot) throw new Error('VSR Gaussian candidate content root mismatch.');
  const bytes = mergePayload(candidate, assets, payloads);
  const decoded = decodePayload(bytes, candidate.bounds);
  if (candidate.elementCount !== decoded.sourceElementCount) throw new Error('VSR Gaussian candidate element count does not match its payload header.');
  return {bytes, sourceElementCount: decoded.sourceElementCount};
}

function crossBillboardMesh(id: string): VSRSpatialMesh {
  return {
    id,
    positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, 0, -1, -1, 0, -1, 1, 0, 1, 1, 0, 1, -1],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0],
    uvs: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1],
    indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7],
    topology: 'triangle-list'
  };
}

function hexColor(color: [number, number, number, number]): string {
  return `#${color.slice(0, 3).map(channel => Math.round(clamp(channel, 0, 1) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function defaultScene(sceneId: string, title: string): VSRSpatialScene3D {
  return {
    format: 'vsr.spatial-scene.v0.4',
    sceneId,
    title,
    background: '#020611',
    environment: {diffuseColor: '#101d35', specularColor: '#ffffff', intensity: 0.5},
    activeCameraId: 'camera:gaussian-splat:main',
    meshes: [],
    materials: [],
    nodes: [],
    cameras: [{id: 'camera:gaussian-splat:main', projection: 'perspective', fovYDeg: 55, near: 0.01, far: 1000, transform: {translation: [0, 1.5, 6]}}],
    lights: [{id: 'light:gaussian-splat:ambient', kind: 'ambient', color: '#ffffff', intensity: 0.2}],
    reality: {worldId: `world:${sceneId}`, generation: 0, realityRoot: cryptographicHash({sceneId, purpose: 'spatial-gaussian-splat-candidate'})}
  };
}

function splatPayload(result: Pick<VSRGaussianSplatSpatialSceneResult, 'componentId' | 'sceneId' | 'sourceCandidateRoot' | 'contentRoot' | 'bounds' | 'sourceElementCount' | 'maxSplats' | 'truncated' | 'sizeScale' | 'origin' | 'splats' | 'meshId' | 'meshRoot'>): JsonRecord {
  return {
    format: VSR_GAUSSIAN_SPLAT_SCENE_FORMAT,
    version: VSR_GAUSSIAN_SPLAT_SCENE_VERSION,
    componentId: result.componentId,
    sceneId: result.sceneId,
    sourceCandidateRoot: result.sourceCandidateRoot,
    contentRoot: result.contentRoot,
    bounds: result.bounds,
    sourceElementCount: result.sourceElementCount,
    maxSplats: result.maxSplats,
    truncated: result.truncated,
    sizeScale: result.sizeScale,
    origin: result.origin,
    splats: result.splats,
    meshId: result.meshId,
    meshRoot: result.meshRoot
  };
}

export function lowerVsrGaussianSplatCandidateToSpatialScene(candidate: VSRGaussianSplatRepresentationCandidate, input: {assets: VSRGaussianSplatPayloadAsset[]; payloads: Map<string, Uint8Array>}, options: VSRGaussianSplatSpatialLoweringOptions = {}): VSRGaussianSplatSpatialSceneResult {
  const validation = validateCandidate(candidate, input.assets, input.payloads);
  const origin = options.origin ?? [0, 0, 0];
  if (!Array.isArray(origin) || origin.length !== 3 || origin.some(component => !finite(component))) throw new Error('VSR Gaussian origin must be a finite XYZ triple.');
  const maxSplats = Math.max(1, Math.min(VSR_GAUSSIAN_SPLAT_RENDER_LIMIT, Math.floor(options.maxSplats ?? VSR_GAUSSIAN_SPLAT_RENDER_LIMIT)));
  if (!Number.isSafeInteger(maxSplats)) throw new Error('VSR Gaussian maxSplats must be an integer.');
  const sizeScale = options.sizeScale ?? 1;
  if (!finite(sizeScale) || sizeScale <= EPS || sizeScale > 1000) throw new Error('VSR Gaussian sizeScale is outside its finite bounds.');
  const sceneId = options.sceneId?.trim() || options.baseScene?.sceneId || `gaussian-splat:${candidate.componentId}`;
  const namespace = safePart(options.idPrefix?.trim() || `gaussian-splat:${candidate.componentId}:${sceneId}`);
  const baseScene = options.baseScene ? {...options.baseScene, meshes: [...options.baseScene.meshes], materials: [...options.baseScene.materials], nodes: [...options.baseScene.nodes]} : defaultScene(sceneId, options.title?.trim() || `VSR Gaussian splats: ${candidate.componentId}`);
  const meshId = `${namespace}:billboard-cross`;
  if (baseScene.meshes.some(mesh => mesh.id === meshId)) throw new Error(`VSR Gaussian mesh id ${meshId} already exists in the base scene.`);
  const view = decodePayload(validation.bytes, candidate.bounds).view;
  const splats: VSRGaussianSplatRecord[] = [];
  const materials: VSRSpatialMaterial[] = [];
  const nodes: VSRSpatialNode[] = [];
  const materialsByKey = new Map<string, string>();
  for (let index = 0; index < validation.sourceElementCount && index < maxSplats; index++) {
    const splat = readSplat(view, VSR_GAUSSIAN_SPLAT_HEADER_BYTE_LENGTH + index * VSR_GAUSSIAN_SPLAT_RECORD_BYTE_LENGTH, index, candidate.bounds);
    splats.push(splat);
    const colorHex = hexColor(splat.color);
    const materialKey = `${colorHex}:${splat.color[3].toFixed(6)}`;
    let materialId = materialsByKey.get(materialKey);
    if (!materialId) {
      materialId = `${namespace}:material:${materialsByKey.size}`;
      materialsByKey.set(materialKey, materialId);
      materials.push({id: materialId, baseColor: colorHex, emissive: colorHex, emissiveStrength: 0.75, roughness: 1, doubleSided: true, opacity: Math.max(EPS, splat.color[3]), alphaMode: 'BLEND', alphaCutoff: 0.01, temporalReactive: 1});
    }
    const nodeId = `${namespace}:splat:${index}`;
    if (baseScene.nodes.some(node => node.id === nodeId)) throw new Error(`VSR Gaussian node id ${nodeId} already exists in the base scene.`);
    nodes.push({id: nodeId, meshId, materialId, transform: {translation: [origin[0] + splat.center[0], origin[1] + splat.center[1], origin[2] + splat.center[2]], scale: splat.scale.map(value => value * sizeScale) as Vec3, rotationQuaternion: [...splat.rotationQuaternion] as Vec4}, visible: splat.color[3] > EPS, castShadow: false, receiveShadow: false, tags: ['gaussian-splat', `gaussian-component:${candidate.componentId}`]});
  }
  const scene: VSRSpatialScene3D = {...baseScene, sceneId, title: options.title?.trim() || baseScene.title, meshes: splats.length ? [...baseScene.meshes, crossBillboardMesh(meshId)] : baseScene.meshes, materials: [...baseScene.materials, ...materials], nodes: [...baseScene.nodes, ...nodes], ...(baseScene.streaming ? {streaming: {...baseScene.streaming, persistentNodeIds: [...new Set([...(baseScene.streaming.persistentNodeIds ?? []), ...nodes.map(node => node.id)])]}} : {})};
  const truncated = splats.length < validation.sourceElementCount;
  const mesh = scene.meshes.find(entry => entry.id === meshId)!;
  const resultBase = {format: VSR_GAUSSIAN_SPLAT_SCENE_FORMAT, version: VSR_GAUSSIAN_SPLAT_SCENE_VERSION, status: 'EXECUTED' as const, renderStatus: 'CANDIDATE_CPU_GAUSSIAN_CROSS_BILLBOARD' as const, componentId: candidate.componentId, sceneId, sourceCandidateRoot: candidate.candidateRoot, contentRoot: candidate.contentRoot, bounds: {min: [...candidate.bounds.min] as Vec3, max: [...candidate.bounds.max] as Vec3}, sourceElementCount: validation.sourceElementCount, splatCount: splats.length, renderableCount: nodes.filter(node => node.visible !== false).length, maxSplats, truncated, sizeScale, origin: [...origin] as Vec3, splats, meshId, meshRoot: cryptographicHash(mesh), scene, sceneRoot: cryptographicHash(scene), splatRoot: ''};
  const splatRoot = cryptographicHash(splatPayload(resultBase));
  const rooted = {...resultBase, splatRoot, candidateOnly: true as const, authoritative: false as const};
  return {...rooted, root: cryptographicHash(rooted)};
}

export function verifyVsrGaussianSplatSpatialScene(result: VSRGaussianSplatSpatialSceneResult): boolean {
  try {
    if (!result || result.format !== VSR_GAUSSIAN_SPLAT_SCENE_FORMAT || result.version !== VSR_GAUSSIAN_SPLAT_SCENE_VERSION || result.status !== 'EXECUTED'
      || result.renderStatus !== 'CANDIDATE_CPU_GAUSSIAN_CROSS_BILLBOARD' || !nonEmpty(result.componentId) || !nonEmpty(result.sceneId)
      || !isRoot(result.sourceCandidateRoot) || !isRoot(result.contentRoot) || !validBounds(result.bounds)
      || !Number.isSafeInteger(result.sourceElementCount) || result.sourceElementCount < 1 || result.sourceElementCount > VSR_GAUSSIAN_SPLAT_SOURCE_LIMIT
      || !Number.isSafeInteger(result.splatCount) || result.splatCount !== result.splats.length || result.splatCount < 1 || result.splatCount > result.maxSplats
      || !Number.isSafeInteger(result.renderableCount) || result.renderableCount < 0 || result.renderableCount > result.splatCount
      || !Number.isSafeInteger(result.maxSplats) || result.maxSplats < 1 || result.maxSplats > VSR_GAUSSIAN_SPLAT_RENDER_LIMIT
      || result.truncated !== (result.splatCount < result.sourceElementCount) || !finite(result.sizeScale) || result.sizeScale <= EPS || result.sizeScale > 1000
      || !Array.isArray(result.origin) || result.origin.length !== 3 || result.origin.some(component => !finite(component))
      || !nonEmpty(result.meshId) || !isRoot(result.meshRoot) || !isRoot(result.sceneRoot) || !isRoot(result.splatRoot) || !isRoot(result.root)
      || result.candidateOnly !== true || result.authoritative !== false) return false;
    const mesh = result.scene.meshes.find(entry => entry.id === result.meshId);
    const nodes = result.scene.nodes.filter(entry => entry.meshId === result.meshId);
    if (!mesh || cryptographicHash(mesh) !== result.meshRoot || mesh.indices.length !== 12 || mesh.positions.length !== 24 || mesh.normals?.length !== 24 || mesh.uvs?.length !== 16 || nodes.length !== result.splatCount) return false;
    if (cryptographicHash(result.scene) !== result.sceneRoot) return false;
    if (cryptographicHash(splatPayload(result)) !== result.splatRoot) return false;
    const {root: _root, ...base} = result;
    return cryptographicHash(base) === result.root;
  } catch {
    return false;
  }
}
