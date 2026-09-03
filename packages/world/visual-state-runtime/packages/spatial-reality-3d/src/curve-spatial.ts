import { cryptographicHash } from '../../spec/src/index.js';
import type { Vec3, VSRSpatialMaterial, VSRSpatialMesh, VSRSpatialNode, VSRSpatialScene3D } from './index.js';

export const VSR_CURVE_PAYLOAD_FORMAT = 'application/vnd.vsr.curve.polyline.f32rgba.v0.1' as const;
export const VSR_CURVE_SCENE_FORMAT = 'vsr.spatial-curve-scene.v0.1' as const;
export const VSR_CURVE_SCENE_VERSION = '0.1.0' as const;
export const VSR_CURVE_RECORD_BYTE_LENGTH = 32;
export const VSR_CURVE_POINT_LIMIT = 1000000;
export const VSR_CURVE_RENDER_POINT_LIMIT = 8192;

type JsonRecord = Record<string, unknown>;

export interface VSRCurveRepresentationCandidate {
  format: 'vsr.non-mesh-representation-candidate.v0.1';
  version: '0.1.0';
  componentId: string;
  representationKind: 'curve';
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

export interface VSRCurvePayloadAsset {
  id: string;
  kind?: string;
  format?: string;
  metadata?: JsonRecord;
}

export interface VSRCurvePoint {
  position: Vec3;
  color: [number, number, number, number];
  radius: number;
}

export interface VSRCurveSpatialLoweringOptions {
  baseScene?: VSRSpatialScene3D;
  sceneId?: string;
  title?: string;
  origin?: Vec3;
  maxPoints?: number;
  sizeScale?: number;
  idPrefix?: string;
}

export interface VSRCurveSpatialSceneResult {
  format: typeof VSR_CURVE_SCENE_FORMAT;
  version: typeof VSR_CURVE_SCENE_VERSION;
  status: 'EXECUTED';
  renderStatus: 'CANDIDATE_CPU_RIBBON';
  componentId: string;
  sceneId: string;
  sourceCandidateRoot: string;
  contentRoot: string;
  sourceElementCount: number;
  pointCount: number;
  segmentCount: number;
  renderableCount: number;
  origin: Vec3;
  maxPoints: number;
  points: VSRCurvePoint[];
  scene: VSRSpatialScene3D;
  sceneRoot: string;
  curveRoot: string;
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
  return value.replace(/[^a-zA-Z0-9_.:-]+/g, '-').slice(0, 96) || 'curve';
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

function candidateBase(candidate: VSRCurveRepresentationCandidate): Omit<VSRCurveRepresentationCandidate, 'candidateRoot'> {
  const {candidateRoot: _candidateRoot, ...base} = candidate;
  return base;
}

function payloadBytes(payloads: Map<string, Uint8Array>, asset: VSRCurvePayloadAsset): Uint8Array {
  const bytes = payloads.get(asset.id);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new Error(`VSR curve payload ${asset.id} is missing or empty.`);
  return bytes;
}

function contentRoot(candidate: VSRCurveRepresentationCandidate, assets: VSRCurvePayloadAsset[], payloads: Map<string, Uint8Array>): string {
  return cryptographicHash(candidate.payloadAssetIds.map(assetId => {
    const asset = assets.find(entry => entry.id === assetId);
    if (!asset) throw new Error(`VSR curve payload asset ${assetId} is not declared.`);
    const bytes = payloadBytes(payloads, asset);
    return {assetId, byteLength: bytes.byteLength, byteRoot: cryptographicHash([...bytes])};
  }));
}

function validateCandidate(candidate: VSRCurveRepresentationCandidate, assets: VSRCurvePayloadAsset[], payloads: Map<string, Uint8Array>): {bytes: Uint8Array; sourceElementCount: number} {
  if (!candidate || candidate.format !== 'vsr.non-mesh-representation-candidate.v0.1' || candidate.version !== '0.1.0' || !nonEmpty(candidate.componentId) || candidate.representationKind !== 'curve' || !nonEmpty(candidate.profileId) || !Array.isArray(candidate.payloadAssetIds) || candidate.payloadAssetIds.length < 1 || new Set(candidate.payloadAssetIds).size !== candidate.payloadAssetIds.length || candidate.payloadAssetIds.some(assetId => !nonEmpty(assetId)) || candidate.payloadFormat !== VSR_CURVE_PAYLOAD_FORMAT || !Number.isSafeInteger(candidate.payloadByteLength) || candidate.payloadByteLength < VSR_CURVE_RECORD_BYTE_LENGTH * 2 || candidate.payloadByteLength % VSR_CURVE_RECORD_BYTE_LENGTH !== 0 || !Number.isSafeInteger(candidate.elementCount) || candidate.elementCount < 2 || candidate.elementCount > VSR_CURVE_POINT_LIMIT || candidate.payloadByteLength !== candidate.elementCount * VSR_CURVE_RECORD_BYTE_LENGTH || !validBounds(candidate.bounds) || !isRoot(candidate.manifestRoot) || !isRoot(candidate.contentRoot) || candidate.renderStatus !== 'NOT_IMPLEMENTED' || candidate.candidateOnly !== true || candidate.authoritative !== false || !isRoot(candidate.candidateRoot) || cryptographicHash(candidateBase(candidate)) !== candidate.candidateRoot) throw new Error('VSR curve candidate contract or root is invalid.');
  if (contentRoot(candidate, assets, payloads) !== candidate.contentRoot) throw new Error('VSR curve candidate content root mismatch.');
  const ordered = candidate.payloadAssetIds.map(assetId => {
    const asset = assets.find(entry => entry.id === assetId);
    if (!asset || (asset.format ?? asset.metadata?.format) !== candidate.payloadFormat) throw new Error(`VSR curve payload ${assetId} format is not ${candidate.payloadFormat}.`);
    return payloadBytes(payloads, asset);
  });
  const bytes = new Uint8Array(candidate.payloadByteLength);
  let offset = 0;
  for (const page of ordered) {
    bytes.set(page, offset);
    offset += page.byteLength;
  }
  return {bytes, sourceElementCount: candidate.elementCount};
}

function readPoint(view: DataView, offset: number, bounds: {min: Vec3; max: Vec3}, index: number): VSRCurvePoint {
  const position: Vec3 = [view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)];
  const color: [number, number, number, number] = [view.getFloat32(offset + 12, true), view.getFloat32(offset + 16, true), view.getFloat32(offset + 20, true), view.getFloat32(offset + 24, true)];
  const radius = view.getFloat32(offset + 28, true);
  if (position.some(component => !finite(component)) || color.some(component => !finite(component) || component < 0 || component > 1) || !finite(radius) || radius <= EPS || radius > 1000) throw new Error(`VSR curve point ${index} contains a non-finite or out-of-range value.`);
  if (position.some((component, axis) => component < bounds.min[axis]! - radius || component > bounds.max[axis]! + radius)) throw new Error(`VSR curve point ${index} lies outside the declared bounds.`);
  return {position, color, radius};
}

function subtract(left: Vec3, right: Vec3): Vec3 {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function add(left: Vec3, right: Vec3): Vec3 {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

function scale(value: Vec3, amount: number): Vec3 {
  return [value[0] * amount, value[1] * amount, value[2] * amount];
}

function cross(left: Vec3, right: Vec3): Vec3 {
  return [left[1] * right[2] - left[2] * right[1], left[2] * right[0] - left[0] * right[2], left[0] * right[1] - left[1] * right[0]];
}

function normalize(value: Vec3, fallback: Vec3): Vec3 {
  const length = Math.hypot(value[0], value[1], value[2]);
  return length > EPS ? [value[0] / length, value[1] / length, value[2] / length] : fallback;
}

function tangentAt(points: VSRCurvePoint[], index: number): Vec3 {
  const previous = points[Math.max(0, index - 1)]!.position;
  const next = points[Math.min(points.length - 1, index + 1)]!.position;
  let tangent = subtract(next, previous);
  if (Math.hypot(tangent[0], tangent[1], tangent[2]) <= EPS && index + 1 < points.length) tangent = subtract(points[index + 1]!.position, points[index]!.position);
  if (Math.hypot(tangent[0], tangent[1], tangent[2]) <= EPS && index > 0) tangent = subtract(points[index]!.position, points[index - 1]!.position);
  return normalize(tangent, [0, 1, 0]);
}

function ribbonSide(tangent: Vec3): Vec3 {
  const reference: Vec3 = Math.abs(tangent[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  return normalize(cross(tangent, reference), [1, 0, 0]);
}

function ribbonMesh(id: string, points: VSRCurvePoint[], sizeScale: number): VSRSpatialMesh {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let distance = 0;
  for (let index = 0; index < points.length; index++) {
    if (index > 0) {
      const delta = subtract(points[index]!.position, points[index - 1]!.position);
      distance += Math.hypot(delta[0], delta[1], delta[2]);
    }
    const tangent = tangentAt(points, index);
    const side = ribbonSide(tangent);
    const normal = normalize(cross(side, tangent), [0, 1, 0]);
    const halfWidth = Math.max(EPS, points[index]!.radius * sizeScale);
    const left = add(points[index]!.position, scale(side, -halfWidth));
    const right = add(points[index]!.position, scale(side, halfWidth));
    positions.push(...left, ...right);
    normals.push(...normal, ...normal);
    uvs.push(distance, 0, distance, 1);
    if (index > 0) {
      const current = index * 2;
      const previous = current - 2;
      indices.push(previous, current, current + 1, previous, current + 1, previous + 1);
    }
  }
  return {id, positions, normals, uvs, indices, topology: 'triangle-list'};
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
    activeCameraId: 'camera:curve:main',
    meshes: [],
    materials: [],
    nodes: [],
    cameras: [{id: 'camera:curve:main', projection: 'perspective', fovYDeg: 55, near: 0.01, far: 1000, transform: {translation: [0, 1.5, 6]}}],
    lights: [{id: 'light:curve:ambient', kind: 'ambient', color: '#ffffff', intensity: 0.2}],
    reality: {worldId: `world:${sceneId}`, generation: 0, realityRoot: cryptographicHash({sceneId, purpose: 'spatial-curve-candidate'})}
  };
}

function curvePayload(result: Pick<VSRCurveSpatialSceneResult, 'componentId' | 'sceneId' | 'sourceCandidateRoot' | 'contentRoot' | 'sourceElementCount' | 'maxPoints' | 'origin' | 'points'>): JsonRecord {
  return {format: VSR_CURVE_SCENE_FORMAT, version: VSR_CURVE_SCENE_VERSION, componentId: result.componentId, sceneId: result.sceneId, sourceCandidateRoot: result.sourceCandidateRoot, contentRoot: result.contentRoot, sourceElementCount: result.sourceElementCount, maxPoints: result.maxPoints, origin: result.origin, points: result.points};
}

export function lowerVsrCurveCandidateToSpatialScene(candidate: VSRCurveRepresentationCandidate, input: {assets: VSRCurvePayloadAsset[]; payloads: Map<string, Uint8Array>}, options: VSRCurveSpatialLoweringOptions = {}): VSRCurveSpatialSceneResult {
  const validation = validateCandidate(candidate, input.assets, input.payloads);
  const origin = options.origin ?? [0, 0, 0];
  if (!Array.isArray(origin) || origin.length !== 3 || origin.some(component => !finite(component))) throw new Error('VSR curve origin must be a finite XYZ triple.');
  const maxPoints = Math.max(2, Math.min(VSR_CURVE_RENDER_POINT_LIMIT, Math.floor(options.maxPoints ?? VSR_CURVE_RENDER_POINT_LIMIT)));
  if (!Number.isSafeInteger(maxPoints)) throw new Error('VSR curve maxPoints must be an integer.');
  const sizeScale = options.sizeScale ?? 1;
  if (!finite(sizeScale) || sizeScale <= EPS || sizeScale > 1000) throw new Error('VSR curve sizeScale is outside its finite bounds.');
  const sceneId = options.sceneId?.trim() || options.baseScene?.sceneId || `curve:${candidate.componentId}`;
  const namespace = safePart(options.idPrefix?.trim() || `curve:${candidate.componentId}:${sceneId}`);
  const baseScene = options.baseScene ? {...options.baseScene, meshes: [...options.baseScene.meshes], materials: [...options.baseScene.materials], nodes: [...options.baseScene.nodes]} : defaultScene(sceneId, options.title?.trim() || `VSR curve: ${candidate.componentId}`);
  const meshId = `${namespace}:ribbon`;
  const materialId = `${namespace}:material`;
  const nodeId = `${namespace}:node`;
  if (baseScene.meshes.some(mesh => mesh.id === meshId) || baseScene.materials.some(material => material.id === materialId) || baseScene.nodes.some(node => node.id === nodeId)) throw new Error(`VSR curve namespace ${namespace} collides with the base scene.`);
  const view = new DataView(validation.bytes.buffer, validation.bytes.byteOffset, validation.bytes.byteLength);
  const points: VSRCurvePoint[] = [];
  for (let index = 0; index < validation.sourceElementCount && index < maxPoints; index++) points.push(readPoint(view, index * VSR_CURVE_RECORD_BYTE_LENGTH, candidate.bounds, index));
  const colorSum: [number, number, number, number] = [0, 0, 0, 0];
  for (const point of points) for (let channel = 0; channel < colorSum.length; channel++) colorSum[channel] = colorSum[channel]! + point.color[channel]!;
  const average = colorSum.map(value => value / Math.max(1, points.length)) as [number, number, number, number];
  const mesh = ribbonMesh(meshId, points, sizeScale);
  const material: VSRSpatialMaterial = {id: materialId, baseColor: hexColor(average), emissive: hexColor(average), emissiveStrength: 1.1, roughness: 0.7, doubleSided: true, opacity: Math.max(EPS, average[3]), alphaMode: average[3] < 0.999 ? 'BLEND' : 'OPAQUE', alphaCutoff: 0.01, temporalReactive: 1};
  const position: Vec3 = [...origin];
  const node: VSRSpatialNode = {id: nodeId, meshId, materialId, transform: {translation: position}, visible: average[3] > EPS, castShadow: false, receiveShadow: false, tags: ['curve', `curve-component:${candidate.componentId}`]};
  const scene: VSRSpatialScene3D = {...baseScene, sceneId, title: options.title?.trim() || baseScene.title, meshes: [...baseScene.meshes, mesh], materials: [...baseScene.materials, material], nodes: [...baseScene.nodes, node], ...(baseScene.streaming ? {streaming: {...baseScene.streaming, persistentNodeIds: [...new Set([...(baseScene.streaming.persistentNodeIds ?? []), node.id])]}} : {})};
  const resultBase = {format: VSR_CURVE_SCENE_FORMAT, version: VSR_CURVE_SCENE_VERSION, status: 'EXECUTED' as const, renderStatus: 'CANDIDATE_CPU_RIBBON' as const, componentId: candidate.componentId, sceneId, sourceCandidateRoot: candidate.candidateRoot, contentRoot: candidate.contentRoot, sourceElementCount: validation.sourceElementCount, pointCount: points.length, segmentCount: Math.max(0, points.length - 1), renderableCount: node.visible === false ? 0 : 1, origin: [...origin] as Vec3, maxPoints, points, scene, sceneRoot: cryptographicHash(scene), curveRoot: cryptographicHash(curvePayload({componentId: candidate.componentId, sceneId, sourceCandidateRoot: candidate.candidateRoot, contentRoot: candidate.contentRoot, sourceElementCount: validation.sourceElementCount, maxPoints, origin: [...origin] as Vec3, points})), candidateOnly: true as const, authoritative: false as const};
  return {...resultBase, root: cryptographicHash(resultBase)};
}

export function verifyVsrCurveSpatialScene(result: VSRCurveSpatialSceneResult): boolean {
  try {
    if (!result || result.format !== VSR_CURVE_SCENE_FORMAT || result.version !== VSR_CURVE_SCENE_VERSION || result.status !== 'EXECUTED' || result.renderStatus !== 'CANDIDATE_CPU_RIBBON' || !nonEmpty(result.componentId) || !nonEmpty(result.sceneId) || !isRoot(result.sourceCandidateRoot) || !isRoot(result.contentRoot) || !Number.isSafeInteger(result.sourceElementCount) || result.sourceElementCount < 2 || !Number.isSafeInteger(result.pointCount) || result.pointCount !== result.points.length || result.pointCount < 2 || result.pointCount > result.maxPoints || !Number.isSafeInteger(result.segmentCount) || result.segmentCount !== result.pointCount - 1 || !Number.isSafeInteger(result.maxPoints) || result.maxPoints < 2 || result.maxPoints > VSR_CURVE_RENDER_POINT_LIMIT || !Array.isArray(result.origin) || result.origin.length !== 3 || result.origin.some(component => !finite(component)) || !Array.isArray(result.points) || result.renderableCount < 0 || result.renderableCount > 1 || !isRoot(result.sceneRoot) || !isRoot(result.curveRoot) || !isRoot(result.root) || result.candidateOnly !== true || result.authoritative !== false) return false;
    if (cryptographicHash(result.scene) !== result.sceneRoot) return false;
    if (cryptographicHash(curvePayload(result)) !== result.curveRoot) return false;
    const {root: _root, ...base} = result;
    return cryptographicHash(base) === result.root;
  } catch {
    return false;
  }
}
