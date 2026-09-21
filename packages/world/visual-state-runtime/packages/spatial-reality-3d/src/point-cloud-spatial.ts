import { cryptographicHash } from '../../spec/src/index.js';
import type { Vec3, VSRSpatialMaterial, VSRSpatialMesh, VSRSpatialNode, VSRSpatialScene3D } from './index.js';

export const VSR_POINT_CLOUD_PAYLOAD_FORMAT = 'application/vnd.vsr.point-cloud.f32rgba.v0.1' as const;
export const VSR_POINT_CLOUD_SCENE_FORMAT = 'vsr.spatial-point-cloud-scene.v0.1' as const;
export const VSR_POINT_CLOUD_SCENE_VERSION = '0.1.0' as const;
export const VSR_POINT_CLOUD_RECORD_BYTE_LENGTH = 32;
export const VSR_POINT_CLOUD_INSTANCE_LIMIT = 8192;

type JsonRecord = Record<string, unknown>;

export interface VSRPointCloudRepresentationCandidate {
  format: 'vsr.non-mesh-representation-candidate.v0.1';
  version: '0.1.0';
  componentId: string;
  representationKind: 'point-cloud';
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

export interface VSRPointCloudPayloadAsset {
  id: string;
  kind?: string;
  format?: string;
  metadata?: JsonRecord;
}

export interface VSRPointCloudRecord {
  position: Vec3;
  color: [number, number, number, number];
  radius: number;
}

export interface VSRPointCloudSpatialLoweringOptions {
  baseScene?: VSRSpatialScene3D;
  sceneId?: string;
  title?: string;
  origin?: Vec3;
  maxPoints?: number;
  sizeScale?: number;
  idPrefix?: string;
}

export interface VSRPointCloudSpatialSceneResult {
  format: typeof VSR_POINT_CLOUD_SCENE_FORMAT;
  version: typeof VSR_POINT_CLOUD_SCENE_VERSION;
  status: 'EXECUTED';
  renderStatus: 'CANDIDATE_CPU_BILLBOARD';
  componentId: string;
  sceneId: string;
  sourceCandidateRoot: string;
  contentRoot: string;
  sourceElementCount: number;
  pointCount: number;
  renderableCount: number;
  origin: Vec3;
  maxPoints: number;
  points: VSRPointCloudRecord[];
  scene: VSRSpatialScene3D;
  sceneRoot: string;
  pointRoot: string;
  candidateOnly: true;
  authoritative: false;
  root: string;
}

const EPS = 1e-9;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const root = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

function hexColor(color: [number, number, number, number]): string {
  return `#${color.slice(0, 3).map(channel => Math.round(clamp(channel, 0, 1) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function safePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.:-]+/g, '-').slice(0, 96) || 'point-cloud';
}

function validBounds(bounds: unknown): bounds is {min: Vec3; max: Vec3} {
  if (!bounds || typeof bounds !== 'object') return false;
  const value = bounds as JsonRecord;
  const min = value.min;
  const max = value.max;
  return Array.isArray(min) && min.length === 3 && min.every(finite)
    && Array.isArray(max) && max.length === 3 && max.every(finite)
    && (min as number[]).every((component, index) => component < (max as number[])[index]!);
}

function candidateBase(candidate: VSRPointCloudRepresentationCandidate): Omit<VSRPointCloudRepresentationCandidate, 'candidateRoot'> {
  const {candidateRoot: _candidateRoot, ...base} = candidate;
  return base;
}

function sourcePayloadIds(candidate: VSRPointCloudRepresentationCandidate): string[] {
  const sourceIds = candidate.sourcePayloadAssetIds ?? candidate.payloadAssetIds;
  if (sourceIds.length !== candidate.payloadAssetIds.length || sourceIds.some(assetId => !nonEmpty(assetId)) || new Set(sourceIds).size !== sourceIds.length) throw new Error('VSR point-cloud logical payload binding is invalid.');
  return sourceIds;
}

function payloadBytes(payloads: Map<string, Uint8Array>, asset: VSRPointCloudPayloadAsset): Uint8Array {
  const bytes = payloads.get(asset.id);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new Error(`VSR point-cloud payload ${asset.id} is missing or empty.`);
  return bytes;
}

function contentRoot(candidate: VSRPointCloudRepresentationCandidate, assets: VSRPointCloudPayloadAsset[], payloads: Map<string, Uint8Array>): string {
  const sourceIds = sourcePayloadIds(candidate);
  return cryptographicHash(candidate.payloadAssetIds.map((assetId, index) => {
    const asset = assets.find(entry => entry.id === assetId);
    if (!asset) throw new Error(`VSR point-cloud payload asset ${assetId} is not declared.`);
    const bytes = payloadBytes(payloads, asset);
    return {assetId: sourceIds[index]!, byteLength: bytes.byteLength, byteRoot: cryptographicHash([...bytes])};
  }));
}

function validateCandidate(candidate: VSRPointCloudRepresentationCandidate, assets: VSRPointCloudPayloadAsset[], payloads: Map<string, Uint8Array>): {bytes: Uint8Array; sourceElementCount: number} {
  if (!candidate || candidate.format !== 'vsr.non-mesh-representation-candidate.v0.1' || candidate.version !== '0.1.0' || !nonEmpty(candidate.componentId) || candidate.representationKind !== 'point-cloud' || !nonEmpty(candidate.profileId) || !Array.isArray(candidate.payloadAssetIds) || candidate.payloadAssetIds.length < 1 || new Set(candidate.payloadAssetIds).size !== candidate.payloadAssetIds.length || candidate.payloadAssetIds.some(assetId => !nonEmpty(assetId)) || candidate.payloadFormat !== VSR_POINT_CLOUD_PAYLOAD_FORMAT || !Number.isSafeInteger(candidate.payloadByteLength) || candidate.payloadByteLength < VSR_POINT_CLOUD_RECORD_BYTE_LENGTH || !Number.isSafeInteger(candidate.elementCount) || candidate.elementCount < 1 || candidate.elementCount > 1000000 || candidate.payloadByteLength !== candidate.elementCount * VSR_POINT_CLOUD_RECORD_BYTE_LENGTH || !validBounds(candidate.bounds) || !root(candidate.manifestRoot) || !root(candidate.contentRoot) || candidate.renderStatus !== 'NOT_IMPLEMENTED' || candidate.candidateOnly !== true || candidate.authoritative !== false || !root(candidate.candidateRoot) || cryptographicHash(candidateBase(candidate)) !== candidate.candidateRoot) throw new Error('VSR point-cloud candidate contract or root is invalid.');
  sourcePayloadIds(candidate);
  if (contentRoot(candidate, assets, payloads) !== candidate.contentRoot) throw new Error('VSR point-cloud candidate content root mismatch.');
  const ordered = candidate.payloadAssetIds.map(assetId => payloadBytes(payloads, assets.find(asset => asset.id === assetId)!));
  const bytes = new Uint8Array(candidate.payloadByteLength);
  let offset = 0;
  for (const page of ordered) {
    bytes.set(page, offset);
    offset += page.byteLength;
  }
  return {bytes, sourceElementCount: candidate.elementCount};
}

function record(view: DataView, offset: number, bounds: {min: Vec3; max: Vec3}, index: number): VSRPointCloudRecord {
  const position: Vec3 = [view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)];
  const color: [number, number, number, number] = [view.getFloat32(offset + 12, true), view.getFloat32(offset + 16, true), view.getFloat32(offset + 20, true), view.getFloat32(offset + 24, true)];
  const radius = view.getFloat32(offset + 28, true);
  if (position.some(component => !finite(component)) || color.some(component => !finite(component) || component < 0 || component > 1) || !finite(radius) || radius <= EPS || radius > 1000) throw new Error(`VSR point-cloud record ${index} contains a non-finite or out-of-range value.`);
  if (position.some((component, axis) => component < bounds.min[axis]! - radius || component > bounds.max[axis]! + radius)) throw new Error(`VSR point-cloud record ${index} lies outside the declared bounds.`);
  return {position, color, radius};
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

function defaultScene(sceneId: string, title: string): VSRSpatialScene3D {
  return {
    format: 'vsr.spatial-scene.v0.4',
    sceneId,
    title,
    background: '#020611',
    environment: {diffuseColor: '#101d35', specularColor: '#ffffff', intensity: 0.5},
    activeCameraId: 'camera:point-cloud:main',
    meshes: [],
    materials: [],
    nodes: [],
    cameras: [{id: 'camera:point-cloud:main', projection: 'perspective', fovYDeg: 55, near: 0.01, far: 1000, transform: {translation: [0, 1.5, 6]}}],
    lights: [{id: 'light:point-cloud:ambient', kind: 'ambient', color: '#ffffff', intensity: 0.2}],
    reality: {worldId: `world:${sceneId}`, generation: 0, realityRoot: cryptographicHash({sceneId, purpose: 'spatial-point-cloud-candidate'})}
  };
}

function pointPayload(result: Pick<VSRPointCloudSpatialSceneResult, 'componentId' | 'sceneId' | 'sourceCandidateRoot' | 'contentRoot' | 'sourceElementCount' | 'maxPoints' | 'origin' | 'points'>): JsonRecord {
  return {format: VSR_POINT_CLOUD_SCENE_FORMAT, version: VSR_POINT_CLOUD_SCENE_VERSION, componentId: result.componentId, sceneId: result.sceneId, sourceCandidateRoot: result.sourceCandidateRoot, contentRoot: result.contentRoot, sourceElementCount: result.sourceElementCount, maxPoints: result.maxPoints, origin: result.origin, points: result.points};
}

export function lowerVsrPointCloudCandidateToSpatialScene(candidate: VSRPointCloudRepresentationCandidate, input: {assets: VSRPointCloudPayloadAsset[]; payloads: Map<string, Uint8Array>}, options: VSRPointCloudSpatialLoweringOptions = {}): VSRPointCloudSpatialSceneResult {
  const validation = validateCandidate(candidate, input.assets, input.payloads);
  const origin = options.origin ?? [0, 0, 0];
  if (!Array.isArray(origin) || origin.length !== 3 || origin.some(component => !finite(component))) throw new Error('VSR point-cloud origin must be a finite XYZ triple.');
  const maxPoints = Math.max(1, Math.min(VSR_POINT_CLOUD_INSTANCE_LIMIT, Math.floor(options.maxPoints ?? VSR_POINT_CLOUD_INSTANCE_LIMIT)));
  if (!Number.isSafeInteger(maxPoints)) throw new Error('VSR point-cloud maxPoints must be an integer.');
  const sizeScale = options.sizeScale ?? 1;
  if (!finite(sizeScale) || sizeScale <= EPS || sizeScale > 1000) throw new Error('VSR point-cloud sizeScale is outside its finite bounds.');
  const sceneId = options.sceneId?.trim() || options.baseScene?.sceneId || `point-cloud:${candidate.componentId}`;
  const namespace = safePart(options.idPrefix?.trim() || `point-cloud:${candidate.componentId}:${sceneId}`);
  const baseScene = options.baseScene ? {...options.baseScene, meshes: [...options.baseScene.meshes], materials: [...options.baseScene.materials], nodes: [...options.baseScene.nodes]} : defaultScene(sceneId, options.title?.trim() || `VSR point cloud: ${candidate.componentId}`);
  const meshId = `${namespace}:billboard-cross`;
  if (baseScene.meshes.some(mesh => mesh.id === meshId)) throw new Error(`VSR point-cloud mesh id ${meshId} already exists in the base scene.`);
  const view = new DataView(validation.bytes.buffer, validation.bytes.byteOffset, validation.bytes.byteLength);
  const points: VSRPointCloudRecord[] = [];
  const materials: VSRSpatialMaterial[] = [];
  const nodes: VSRSpatialNode[] = [];
  for (let index = 0; index < validation.sourceElementCount; index++) {
    const current = record(view, index * VSR_POINT_CLOUD_RECORD_BYTE_LENGTH, candidate.bounds, index);
    if (index >= maxPoints) continue;
    points.push(current);
    const id = `${namespace}:point:${index}`;
    const materialId = `${id}:material`;
    materials.push({id: materialId, baseColor: hexColor(current.color), emissive: hexColor(current.color), emissiveStrength: 1.3, roughness: 1, doubleSided: true, opacity: Math.max(EPS, current.color[3]), alphaMode: 'BLEND', alphaCutoff: 0.01, temporalReactive: 1});
    const position: Vec3 = [origin[0] + current.position[0], origin[1] + current.position[1], origin[2] + current.position[2]];
    const size = Math.max(EPS, current.radius * sizeScale);
    nodes.push({id, meshId, materialId, transform: {translation: position, scale: [size, size, size]}, visible: current.color[3] > EPS, castShadow: false, receiveShadow: false, tags: ['point-cloud', `point-cloud-component:${candidate.componentId}`]});
  }
  const scene: VSRSpatialScene3D = {...baseScene, sceneId, title: options.title?.trim() || baseScene.title, meshes: points.length ? [...baseScene.meshes, crossBillboardMesh(meshId)] : baseScene.meshes, materials: [...baseScene.materials, ...materials], nodes: [...baseScene.nodes, ...nodes], ...(baseScene.streaming ? {streaming: {...baseScene.streaming, persistentNodeIds: [...new Set([...(baseScene.streaming.persistentNodeIds ?? []), ...nodes.map(node => node.id)])]}} : {})};
  const resultBase = {format: VSR_POINT_CLOUD_SCENE_FORMAT, version: VSR_POINT_CLOUD_SCENE_VERSION, status: 'EXECUTED' as const, renderStatus: 'CANDIDATE_CPU_BILLBOARD' as const, componentId: candidate.componentId, sceneId, sourceCandidateRoot: candidate.candidateRoot, contentRoot: candidate.contentRoot, sourceElementCount: validation.sourceElementCount, pointCount: points.length, renderableCount: nodes.filter(node => node.visible !== false).length, origin: [...origin] as Vec3, maxPoints, points, scene, sceneRoot: cryptographicHash(scene), pointRoot: cryptographicHash(pointPayload({componentId: candidate.componentId, sceneId, sourceCandidateRoot: candidate.candidateRoot, contentRoot: candidate.contentRoot, sourceElementCount: validation.sourceElementCount, maxPoints, origin: [...origin] as Vec3, points}),), candidateOnly: true as const, authoritative: false as const};
  return {...resultBase, root: cryptographicHash(resultBase)};
}

export function verifyVsrPointCloudSpatialScene(result: VSRPointCloudSpatialSceneResult): boolean {
  try {
    if (!result || result.format !== VSR_POINT_CLOUD_SCENE_FORMAT || result.version !== VSR_POINT_CLOUD_SCENE_VERSION || result.status !== 'EXECUTED' || result.renderStatus !== 'CANDIDATE_CPU_BILLBOARD' || !nonEmpty(result.componentId) || !nonEmpty(result.sceneId) || !root(result.sourceCandidateRoot) || !root(result.contentRoot) || !Number.isSafeInteger(result.sourceElementCount) || result.sourceElementCount < 1 || !Number.isSafeInteger(result.pointCount) || result.pointCount !== result.points.length || result.pointCount < 0 || result.pointCount > result.maxPoints || !Number.isSafeInteger(result.maxPoints) || result.maxPoints < 1 || result.maxPoints > VSR_POINT_CLOUD_INSTANCE_LIMIT || !Array.isArray(result.origin) || result.origin.length !== 3 || result.origin.some(component => !finite(component)) || !Array.isArray(result.points) || result.renderableCount < 0 || result.renderableCount > result.pointCount || !root(result.sceneRoot) || !root(result.pointRoot) || !root(result.root) || result.candidateOnly !== true || result.authoritative !== false) return false;
    if (cryptographicHash(result.scene) !== result.sceneRoot) return false;
    if (cryptographicHash(pointPayload(result)) !== result.pointRoot) return false;
    const {root: _root, ...base} = result;
    return cryptographicHash(base) === result.root;
  } catch {
    return false;
  }
}
