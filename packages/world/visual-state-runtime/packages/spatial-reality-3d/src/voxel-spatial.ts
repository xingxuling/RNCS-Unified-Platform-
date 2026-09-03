import { cryptographicHash } from '../../spec/src/index.js';
import type { Vec3, VSRSpatialMaterial, VSRSpatialMesh, VSRSpatialNode, VSRSpatialScene3D } from './index.js';

export const VSR_VOXEL_PAYLOAD_FORMAT = 'application/vnd.vsr.voxel.u8rgba.v0.1' as const;
export const VSR_VOXEL_SCENE_FORMAT = 'vsr.spatial-voxel-scene.v0.1' as const;
export const VSR_VOXEL_SCENE_VERSION = '0.1.0' as const;
export const VSR_VOXEL_HEADER_BYTE_LENGTH = 16;
export const VSR_VOXEL_RECORD_BYTE_LENGTH = 4;
export const VSR_VOXEL_GRID_DIMENSION_LIMIT = 128;
export const VSR_VOXEL_SOURCE_LIMIT = 1048576;
export const VSR_VOXEL_RENDER_LIMIT = 4096;

type JsonRecord = Record<string, unknown>;

export interface VSRVoxelRepresentationCandidate {
  format: 'vsr.non-mesh-representation-candidate.v0.1';
  version: '0.1.0';
  componentId: string;
  representationKind: 'voxel';
  profileId: string;
  payloadAssetIds: string[];
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

export interface VSRVoxelPayloadAsset {
  id: string;
  kind?: string;
  format?: string;
  metadata?: JsonRecord;
}

export interface VSRVoxelColor {
  x: number;
  y: number;
  z: number;
  color: [number, number, number, number];
}

export interface VSRVoxelGrid {
  width: number;
  height: number;
  depth: number;
}

export interface VSRVoxelSpatialLoweringOptions {
  baseScene?: VSRSpatialScene3D;
  sceneId?: string;
  title?: string;
  origin?: Vec3;
  maxVoxels?: number;
  idPrefix?: string;
}

export interface VSRVoxelSpatialSceneResult {
  format: typeof VSR_VOXEL_SCENE_FORMAT;
  version: typeof VSR_VOXEL_SCENE_VERSION;
  status: 'EXECUTED';
  renderStatus: 'CANDIDATE_CPU_VOXEL_CUBES';
  componentId: string;
  sceneId: string;
  sourceCandidateRoot: string;
  contentRoot: string;
  bounds: {min: Vec3; max: Vec3};
  grid: VSRVoxelGrid;
  sourceElementCount: number;
  voxelCount: number;
  occupiedCount: number;
  renderableCount: number;
  origin: Vec3;
  maxVoxels: number;
  voxels: VSRVoxelColor[];
  scene: VSRSpatialScene3D;
  sceneRoot: string;
  voxelRoot: string;
  candidateOnly: true;
  authoritative: false;
  root: string;
}

const EPS = 1e-9;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isRoot = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function safePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.:-]+/g, '-').slice(0, 96) || 'voxel';
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

function candidateBase(candidate: VSRVoxelRepresentationCandidate): Omit<VSRVoxelRepresentationCandidate, 'candidateRoot'> {
  const {candidateRoot: _candidateRoot, ...base} = candidate;
  return base;
}

function payloadBytes(payloads: Map<string, Uint8Array>, asset: VSRVoxelPayloadAsset): Uint8Array {
  const bytes = payloads.get(asset.id);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new Error(`VSR voxel payload ${asset.id} is missing or empty.`);
  return bytes;
}

function contentRoot(candidate: VSRVoxelRepresentationCandidate, assets: VSRVoxelPayloadAsset[], payloads: Map<string, Uint8Array>): string {
  return cryptographicHash(candidate.payloadAssetIds.map(assetId => {
    const asset = assets.find(entry => entry.id === assetId);
    if (!asset) throw new Error(`VSR voxel payload asset ${assetId} is not declared.`);
    const bytes = payloadBytes(payloads, asset);
    return {assetId, byteLength: bytes.byteLength, byteRoot: cryptographicHash([...bytes])};
  }));
}

function mergePayload(candidate: VSRVoxelRepresentationCandidate, assets: VSRVoxelPayloadAsset[], payloads: Map<string, Uint8Array>): Uint8Array {
  const ordered = candidate.payloadAssetIds.map(assetId => {
    const asset = assets.find(entry => entry.id === assetId);
    if (!asset || (asset.format ?? asset.metadata?.format) !== candidate.payloadFormat) throw new Error(`VSR voxel payload ${assetId} format is not ${candidate.payloadFormat}.`);
    return payloadBytes(payloads, asset);
  });
  const bytes = new Uint8Array(candidate.payloadByteLength);
  let offset = 0;
  for (const page of ordered) {
    bytes.set(page, offset);
    offset += page.byteLength;
  }
  return bytes;
}

function gridFromPayload(bytes: Uint8Array): VSRVoxelGrid {
  if (bytes.byteLength < VSR_VOXEL_HEADER_BYTE_LENGTH) throw new Error('VSR voxel payload header is missing.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const grid = {width: view.getUint32(0, true), height: view.getUint32(4, true), depth: view.getUint32(8, true)};
  if (!Number.isSafeInteger(grid.width) || !Number.isSafeInteger(grid.height) || !Number.isSafeInteger(grid.depth) || grid.width < 1 || grid.height < 1 || grid.depth < 1 || grid.width > VSR_VOXEL_GRID_DIMENSION_LIMIT || grid.height > VSR_VOXEL_GRID_DIMENSION_LIMIT || grid.depth > VSR_VOXEL_GRID_DIMENSION_LIMIT) throw new Error('VSR voxel grid dimensions exceed the bounded contract.');
  const count = grid.width * grid.height * grid.depth;
  if (count > VSR_VOXEL_SOURCE_LIMIT || bytes.byteLength !== VSR_VOXEL_HEADER_BYTE_LENGTH + count * VSR_VOXEL_RECORD_BYTE_LENGTH) throw new Error('VSR voxel payload length does not match its grid header.');
  return grid;
}

function validateCandidate(candidate: VSRVoxelRepresentationCandidate, assets: VSRVoxelPayloadAsset[], payloads: Map<string, Uint8Array>): {bytes: Uint8Array; grid: VSRVoxelGrid; sourceElementCount: number} {
  if (!candidate || candidate.format !== 'vsr.non-mesh-representation-candidate.v0.1' || candidate.version !== '0.1.0' || !nonEmpty(candidate.componentId) || candidate.representationKind !== 'voxel' || !nonEmpty(candidate.profileId) || !Array.isArray(candidate.payloadAssetIds) || candidate.payloadAssetIds.length < 1 || new Set(candidate.payloadAssetIds).size !== candidate.payloadAssetIds.length || candidate.payloadAssetIds.some(assetId => !nonEmpty(assetId)) || candidate.payloadFormat !== VSR_VOXEL_PAYLOAD_FORMAT || !Number.isSafeInteger(candidate.payloadByteLength) || candidate.payloadByteLength < VSR_VOXEL_HEADER_BYTE_LENGTH + VSR_VOXEL_RECORD_BYTE_LENGTH || !Number.isSafeInteger(candidate.elementCount) || candidate.elementCount < 1 || candidate.elementCount > VSR_VOXEL_SOURCE_LIMIT || !validBounds(candidate.bounds) || !isRoot(candidate.manifestRoot) || !isRoot(candidate.contentRoot) || candidate.renderStatus !== 'NOT_IMPLEMENTED' || candidate.candidateOnly !== true || candidate.authoritative !== false || !isRoot(candidate.candidateRoot) || cryptographicHash(candidateBase(candidate)) !== candidate.candidateRoot) throw new Error('VSR voxel candidate contract or root is invalid.');
  if (contentRoot(candidate, assets, payloads) !== candidate.contentRoot) throw new Error('VSR voxel candidate content root mismatch.');
  const bytes = mergePayload(candidate, assets, payloads);
  const grid = gridFromPayload(bytes);
  const sourceElementCount = grid.width * grid.height * grid.depth;
  if (candidate.elementCount !== sourceElementCount) throw new Error('VSR voxel candidate element count does not match its grid.');
  return {bytes, grid, sourceElementCount};
}

function cubeMesh(id: string): VSRSpatialMesh {
  const faces: Array<{normal: Vec3; vertices: Vec3[]}> = [
    {normal: [0, 0, 1], vertices: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]]},
    {normal: [0, 0, -1], vertices: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]]},
    {normal: [0, 1, 0], vertices: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]]},
    {normal: [0, -1, 0], vertices: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]]},
    {normal: [1, 0, 0], vertices: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]]},
    {normal: [-1, 0, 0], vertices: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]]}
  ];
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (const face of faces) {
    const offset = positions.length / 3;
    for (const vertex of face.vertices) {
      positions.push(...vertex);
      normals.push(...face.normal);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  return {id, positions, normals, uvs, indices, topology: 'triangle-list'};
}

function hexColor(color: [number, number, number, number]): string {
  return `#${color.slice(0, 3).map(channel => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')}`;
}

function defaultScene(sceneId: string, title: string): VSRSpatialScene3D {
  return {
    format: 'vsr.spatial-scene.v0.4',
    sceneId,
    title,
    background: '#020611',
    environment: {diffuseColor: '#101d35', specularColor: '#ffffff', intensity: 0.5},
    activeCameraId: 'camera:voxel:main',
    meshes: [],
    materials: [],
    nodes: [],
    cameras: [{id: 'camera:voxel:main', projection: 'perspective', fovYDeg: 55, near: 0.01, far: 1000, transform: {translation: [0, 1.5, 6]}}],
    lights: [{id: 'light:voxel:ambient', kind: 'ambient', color: '#ffffff', intensity: 0.2}],
    reality: {worldId: `world:${sceneId}`, generation: 0, realityRoot: cryptographicHash({sceneId, purpose: 'spatial-voxel-candidate'})}
  };
}

function voxelPayload(result: Pick<VSRVoxelSpatialSceneResult, 'componentId' | 'sceneId' | 'sourceCandidateRoot' | 'contentRoot' | 'bounds' | 'grid' | 'sourceElementCount' | 'maxVoxels' | 'origin' | 'voxels'>): JsonRecord {
  return {format: VSR_VOXEL_SCENE_FORMAT, version: VSR_VOXEL_SCENE_VERSION, componentId: result.componentId, sceneId: result.sceneId, sourceCandidateRoot: result.sourceCandidateRoot, contentRoot: result.contentRoot, bounds: result.bounds, grid: result.grid, sourceElementCount: result.sourceElementCount, maxVoxels: result.maxVoxels, origin: result.origin, voxels: result.voxels};
}

export function lowerVsrVoxelCandidateToSpatialScene(candidate: VSRVoxelRepresentationCandidate, input: {assets: VSRVoxelPayloadAsset[]; payloads: Map<string, Uint8Array>}, options: VSRVoxelSpatialLoweringOptions = {}): VSRVoxelSpatialSceneResult {
  const validation = validateCandidate(candidate, input.assets, input.payloads);
  const origin = options.origin ?? [0, 0, 0];
  if (!Array.isArray(origin) || origin.length !== 3 || origin.some(component => !finite(component))) throw new Error('VSR voxel origin must be a finite XYZ triple.');
  const maxVoxels = Math.max(1, Math.min(VSR_VOXEL_RENDER_LIMIT, Math.floor(options.maxVoxels ?? VSR_VOXEL_RENDER_LIMIT)));
  if (!Number.isSafeInteger(maxVoxels)) throw new Error('VSR voxel maxVoxels must be an integer.');
  const sceneId = options.sceneId?.trim() || options.baseScene?.sceneId || `voxel:${candidate.componentId}`;
  const namespace = safePart(options.idPrefix?.trim() || `voxel:${candidate.componentId}:${sceneId}`);
  const baseScene = options.baseScene ? {...options.baseScene, meshes: [...options.baseScene.meshes], materials: [...options.baseScene.materials], nodes: [...options.baseScene.nodes]} : defaultScene(sceneId, options.title?.trim() || `VSR voxel: ${candidate.componentId}`);
  const meshId = `${namespace}:cube`;
  if (baseScene.meshes.some(mesh => mesh.id === meshId)) throw new Error(`VSR voxel mesh id ${meshId} already exists in the base scene.`);
  const view = new DataView(validation.bytes.buffer, validation.bytes.byteOffset, validation.bytes.byteLength);
  const cell: Vec3 = [(candidate.bounds.max[0] - candidate.bounds.min[0]) / validation.grid.width, (candidate.bounds.max[1] - candidate.bounds.min[1]) / validation.grid.height, (candidate.bounds.max[2] - candidate.bounds.min[2]) / validation.grid.depth];
  const voxels: VSRVoxelColor[] = [];
  const materials: VSRSpatialMaterial[] = [];
  const nodes: VSRSpatialNode[] = [];
  const materialsByKey = new Map<string, string>();
  for (let index = 0; index < validation.sourceElementCount && index < maxVoxels; index++) {
    const x = index % validation.grid.width;
    const y = Math.floor(index / validation.grid.width) % validation.grid.height;
    const z = Math.floor(index / (validation.grid.width * validation.grid.height));
    const offset = VSR_VOXEL_HEADER_BYTE_LENGTH + index * VSR_VOXEL_RECORD_BYTE_LENGTH;
    const color: [number, number, number, number] = [view.getUint8(offset) / 255, view.getUint8(offset + 1) / 255, view.getUint8(offset + 2) / 255, view.getUint8(offset + 3) / 255];
    const voxel = {x, y, z, color};
    voxels.push(voxel);
    if (color[3] <= EPS) continue;
    const colorHex = hexColor(color);
    const materialKey = `${colorHex}:${color[3].toFixed(6)}`;
    let materialId = materialsByKey.get(materialKey);
    if (!materialId) {
      materialId = `${namespace}:material:${materialsByKey.size}`;
      materialsByKey.set(materialKey, materialId);
      materials.push({id: materialId, baseColor: colorHex, emissive: colorHex, emissiveStrength: 0.45, roughness: 0.8, doubleSided: true, opacity: color[3], alphaMode: color[3] < 0.999 ? 'BLEND' : 'OPAQUE', alphaCutoff: 0.01, temporalReactive: 1});
    }
    const nodeId = `${namespace}:voxel:${index}`;
    if (baseScene.nodes.some(node => node.id === nodeId)) throw new Error(`VSR voxel node id ${nodeId} already exists in the base scene.`);
    nodes.push({id: nodeId, meshId, materialId, transform: {translation: [origin[0] + candidate.bounds.min[0] + (x + 0.5) * cell[0], origin[1] + candidate.bounds.min[1] + (y + 0.5) * cell[1], origin[2] + candidate.bounds.min[2] + (z + 0.5) * cell[2]], scale: cell}, visible: true, castShadow: false, receiveShadow: false, tags: ['voxel', `voxel-component:${candidate.componentId}`]});
  }
  const scene: VSRSpatialScene3D = {...baseScene, sceneId, title: options.title?.trim() || baseScene.title, meshes: voxels.length ? [...baseScene.meshes, cubeMesh(meshId)] : baseScene.meshes, materials: [...baseScene.materials, ...materials], nodes: [...baseScene.nodes, ...nodes], ...(baseScene.streaming ? {streaming: {...baseScene.streaming, persistentNodeIds: [...new Set([...(baseScene.streaming.persistentNodeIds ?? []), ...nodes.map(node => node.id)])]}} : {})};
  const resultBase = {format: VSR_VOXEL_SCENE_FORMAT, version: VSR_VOXEL_SCENE_VERSION, status: 'EXECUTED' as const, renderStatus: 'CANDIDATE_CPU_VOXEL_CUBES' as const, componentId: candidate.componentId, sceneId, sourceCandidateRoot: candidate.candidateRoot, contentRoot: candidate.contentRoot, bounds: {min: [...candidate.bounds.min] as Vec3, max: [...candidate.bounds.max] as Vec3}, grid: {...validation.grid}, sourceElementCount: validation.sourceElementCount, voxelCount: voxels.length, occupiedCount: nodes.length, renderableCount: nodes.length, origin: [...origin] as Vec3, maxVoxels, voxels, scene, sceneRoot: cryptographicHash(scene), voxelRoot: cryptographicHash(voxelPayload({componentId: candidate.componentId, sceneId, sourceCandidateRoot: candidate.candidateRoot, contentRoot: candidate.contentRoot, bounds: {min: [...candidate.bounds.min] as Vec3, max: [...candidate.bounds.max] as Vec3}, grid: {...validation.grid}, sourceElementCount: validation.sourceElementCount, maxVoxels, origin: [...origin] as Vec3, voxels})), candidateOnly: true as const, authoritative: false as const};
  return {...resultBase, root: cryptographicHash(resultBase)};
}

export function verifyVsrVoxelSpatialScene(result: VSRVoxelSpatialSceneResult): boolean {
  try {
    if (!result || result.format !== VSR_VOXEL_SCENE_FORMAT || result.version !== VSR_VOXEL_SCENE_VERSION || result.status !== 'EXECUTED' || result.renderStatus !== 'CANDIDATE_CPU_VOXEL_CUBES' || !nonEmpty(result.componentId) || !nonEmpty(result.sceneId) || !isRoot(result.sourceCandidateRoot) || !isRoot(result.contentRoot) || !validBounds(result.bounds) || !result.grid || !Number.isSafeInteger(result.grid.width) || !Number.isSafeInteger(result.grid.height) || !Number.isSafeInteger(result.grid.depth) || result.grid.width < 1 || result.grid.height < 1 || result.grid.depth < 1 || result.grid.width * result.grid.height * result.grid.depth !== result.sourceElementCount || !Number.isSafeInteger(result.sourceElementCount) || result.sourceElementCount < 1 || !Number.isSafeInteger(result.voxelCount) || result.voxelCount !== result.voxels.length || result.voxelCount < 0 || result.voxelCount > result.maxVoxels || !Number.isSafeInteger(result.maxVoxels) || result.maxVoxels < 1 || result.maxVoxels > VSR_VOXEL_RENDER_LIMIT || !Array.isArray(result.origin) || result.origin.length !== 3 || result.origin.some(component => !finite(component)) || !Array.isArray(result.voxels) || !Number.isSafeInteger(result.occupiedCount) || result.occupiedCount !== result.renderableCount || result.renderableCount < 0 || result.renderableCount > result.voxelCount || !isRoot(result.sceneRoot) || !isRoot(result.voxelRoot) || !isRoot(result.root) || result.candidateOnly !== true || result.authoritative !== false) return false;
    if (cryptographicHash(result.scene) !== result.sceneRoot) return false;
    if (cryptographicHash(voxelPayload(result)) !== result.voxelRoot) return false;
    const {root: _root, ...base} = result;
    return cryptographicHash(base) === result.root;
  } catch {
    return false;
  }
}
