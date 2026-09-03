import { cryptographicHash } from '../../spec/src/index.js';
import type { Vec3, VSRSpatialMaterial, VSRSpatialMesh, VSRSpatialNode, VSRSpatialScene3D } from './index.js';

export const VSR_SDF_PAYLOAD_FORMAT = 'application/vnd.vsr.sdf.f32grid.v0.1' as const;
export const VSR_SDF_SCENE_FORMAT = 'vsr.spatial-sdf-scene.v0.1' as const;
export const VSR_SDF_SCENE_VERSION = '0.1.0' as const;
export const VSR_SDF_HEADER_BYTE_LENGTH = 16;
export const VSR_SDF_RECORD_BYTE_LENGTH = 4;
export const VSR_SDF_GRID_DIMENSION_LIMIT = 128;
export const VSR_SDF_SOURCE_LIMIT = 1048576;
export const VSR_SDF_TRIANGLE_LIMIT = 32768;

type JsonRecord = Record<string, unknown>;
type LocalCoord = [number, number, number];

export interface VSRSdfRepresentationCandidate {
  format: 'vsr.non-mesh-representation-candidate.v0.1';
  version: '0.1.0';
  componentId: string;
  representationKind: 'sdf';
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

export interface VSRSdfPayloadAsset {
  id: string;
  kind?: string;
  format?: string;
  metadata?: JsonRecord;
}

export interface VSRSdfSpatialLoweringOptions {
  baseScene?: VSRSpatialScene3D;
  sceneId?: string;
  title?: string;
  origin?: Vec3;
  maxTriangles?: number;
  baseColor?: string;
  idPrefix?: string;
}

export interface VSRSdfSpatialSceneResult {
  format: typeof VSR_SDF_SCENE_FORMAT;
  version: typeof VSR_SDF_SCENE_VERSION;
  status: 'EXECUTED';
  renderStatus: 'CANDIDATE_CPU_MARCHING_TETRAHEDRA';
  componentId: string;
  sceneId: string;
  sourceCandidateRoot: string;
  contentRoot: string;
  bounds: {min: Vec3; max: Vec3};
  grid: {width: number; height: number; depth: number};
  sourceElementCount: number;
  sourceCellCount: number;
  visitedCellCount: number;
  triangleCount: number;
  renderableCount: number;
  maxTriangles: number;
  truncated: boolean;
  origin: Vec3;
  meshId: string;
  meshRoot: string;
  scene: VSRSpatialScene3D;
  sceneRoot: string;
  sdfRoot: string;
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
  return value.replace(/[^a-zA-Z0-9_.:-]+/g, '-').slice(0, 96) || 'sdf';
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

function candidateBase(candidate: VSRSdfRepresentationCandidate): Omit<VSRSdfRepresentationCandidate, 'candidateRoot'> {
  const {candidateRoot: _candidateRoot, ...base} = candidate;
  return base;
}

function sourcePayloadIds(candidate: VSRSdfRepresentationCandidate): string[] {
  const sourceIds = candidate.sourcePayloadAssetIds ?? candidate.payloadAssetIds;
  if (sourceIds.length !== candidate.payloadAssetIds.length || sourceIds.some(assetId => !nonEmpty(assetId)) || new Set(sourceIds).size !== sourceIds.length) throw new Error('VSR SDF logical payload binding is invalid.');
  return sourceIds;
}

function payloadBytes(payloads: Map<string, Uint8Array>, asset: VSRSdfPayloadAsset): Uint8Array {
  const bytes = payloads.get(asset.id);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new Error(`VSR SDF payload ${asset.id} is missing or empty.`);
  return bytes;
}

function contentRoot(candidate: VSRSdfRepresentationCandidate, assets: VSRSdfPayloadAsset[], payloads: Map<string, Uint8Array>): string {
  const sourceIds = sourcePayloadIds(candidate);
  return cryptographicHash(candidate.payloadAssetIds.map((assetId, index) => {
    const matches = assets.filter(entry => entry.id === assetId);
    if (matches.length !== 1) throw new Error(`VSR SDF payload asset ${assetId} is missing or ambiguous.`);
    const bytes = payloadBytes(payloads, matches[0]!);
    return {assetId: sourceIds[index]!, byteLength: bytes.byteLength, byteRoot: cryptographicHash([...bytes])};
  }));
}

function mergePayload(candidate: VSRSdfRepresentationCandidate, assets: VSRSdfPayloadAsset[], payloads: Map<string, Uint8Array>): Uint8Array {
  const ordered = candidate.payloadAssetIds.map(assetId => {
    const matches = assets.filter(entry => entry.id === assetId);
    if (matches.length !== 1) throw new Error(`VSR SDF payload asset ${assetId} is missing or ambiguous.`);
    const asset = matches[0]!;
    if ((asset.format ?? asset.metadata?.format) !== candidate.payloadFormat) throw new Error(`VSR SDF payload ${assetId} format is not ${candidate.payloadFormat}.`);
    return payloadBytes(payloads, asset);
  });
  const byteLength = ordered.reduce((sum, page) => sum + page.byteLength, 0);
  if (byteLength !== candidate.payloadByteLength) throw new Error('VSR SDF payload byte length mismatch.');
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const page of ordered) {
    bytes.set(page, offset);
    offset += page.byteLength;
  }
  return bytes;
}

interface SdfGrid {
  width: number;
  height: number;
  depth: number;
}

interface ValidatedPayload {
  bytes: Uint8Array;
  grid: SdfGrid;
  sourceElementCount: number;
}

function decodeGrid(bytes: Uint8Array): {grid: SdfGrid; view: DataView} {
  if (bytes.byteLength < VSR_SDF_HEADER_BYTE_LENGTH) throw new Error('VSR SDF payload header is missing.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const grid = {width: view.getUint32(0, true), height: view.getUint32(4, true), depth: view.getUint32(8, true)};
  const flags = view.getUint32(12, true);
  if (!Number.isSafeInteger(grid.width) || !Number.isSafeInteger(grid.height) || !Number.isSafeInteger(grid.depth)
    || grid.width < 2 || grid.height < 2 || grid.depth < 2
    || grid.width > VSR_SDF_GRID_DIMENSION_LIMIT || grid.height > VSR_SDF_GRID_DIMENSION_LIMIT || grid.depth > VSR_SDF_GRID_DIMENSION_LIMIT
    || flags !== 0) throw new Error('VSR SDF grid header exceeds the bounded contract.');
  const count = grid.width * grid.height * grid.depth;
  if (count > VSR_SDF_SOURCE_LIMIT || bytes.byteLength !== VSR_SDF_HEADER_BYTE_LENGTH + count * VSR_SDF_RECORD_BYTE_LENGTH) throw new Error('VSR SDF payload length does not match its grid header.');
  for (let index = 0; index < count; index++) {
    const value = view.getFloat32(VSR_SDF_HEADER_BYTE_LENGTH + index * VSR_SDF_RECORD_BYTE_LENGTH, true);
    if (!finite(value) || Math.abs(value) > 1e9) throw new Error(`VSR SDF sample ${index} is non-finite or outside the bounded range.`);
  }
  return {grid, view};
}

function validateCandidate(candidate: VSRSdfRepresentationCandidate, assets: VSRSdfPayloadAsset[], payloads: Map<string, Uint8Array>): ValidatedPayload {
  if (!candidate || candidate.format !== 'vsr.non-mesh-representation-candidate.v0.1' || candidate.version !== '0.1.0'
    || !nonEmpty(candidate.componentId) || candidate.representationKind !== 'sdf' || !nonEmpty(candidate.profileId)
    || !Array.isArray(candidate.payloadAssetIds) || candidate.payloadAssetIds.length < 1
    || new Set(candidate.payloadAssetIds).size !== candidate.payloadAssetIds.length || candidate.payloadAssetIds.some(assetId => !nonEmpty(assetId))
    || candidate.payloadFormat !== VSR_SDF_PAYLOAD_FORMAT || !Number.isSafeInteger(candidate.payloadByteLength)
    || candidate.payloadByteLength < VSR_SDF_HEADER_BYTE_LENGTH + VSR_SDF_RECORD_BYTE_LENGTH
    || !Number.isSafeInteger(candidate.elementCount) || candidate.elementCount < 1 || candidate.elementCount > VSR_SDF_SOURCE_LIMIT
    || !validBounds(candidate.bounds) || !isRoot(candidate.manifestRoot) || !isRoot(candidate.contentRoot)
    || candidate.renderStatus !== 'NOT_IMPLEMENTED' || candidate.candidateOnly !== true || candidate.authoritative !== false
    || !isRoot(candidate.candidateRoot) || cryptographicHash(candidateBase(candidate)) !== candidate.candidateRoot) throw new Error('VSR SDF candidate contract or root is invalid.');
  sourcePayloadIds(candidate);
  if (contentRoot(candidate, assets, payloads) !== candidate.contentRoot) throw new Error('VSR SDF candidate content root mismatch.');
  const bytes = mergePayload(candidate, assets, payloads);
  const {grid, view} = decodeGrid(bytes);
  const sourceElementCount = grid.width * grid.height * grid.depth;
  if (candidate.elementCount !== sourceElementCount) throw new Error('VSR SDF candidate element count does not match its grid.');
  void view;
  return {bytes, grid, sourceElementCount};
}

function indexOf(grid: SdfGrid, x: number, y: number, z: number): number {
  return x + grid.width * (y + grid.height * z);
}

function vectorLength(value: Vec3): number {
  return Math.hypot(value[0], value[1], value[2]);
}

function normalize(value: Vec3, fallback: Vec3 = [0, 1, 0]): Vec3 {
  const length = vectorLength(value);
  return length > EPS ? [value[0] / length, value[1] / length, value[2] / length] : [...fallback] as Vec3;
}

function subtract(left: Vec3, right: Vec3): Vec3 {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function cross(left: Vec3, right: Vec3): Vec3 {
  return [left[1] * right[2] - left[2] * right[1], left[2] * right[0] - left[0] * right[2], left[0] * right[1] - left[1] * right[0]];
}

function dot(left: Vec3, right: Vec3): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function add(left: Vec3, right: Vec3): Vec3 {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

const CUBE_OFFSETS: readonly LocalCoord[] = Object.freeze([
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
]);
const TETRAHEDRA: readonly (readonly [number, number, number, number])[] = Object.freeze([
  [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6], [0, 5, 1, 6]
]);
const TETRA_EDGES: readonly (readonly [number, number])[] = Object.freeze([
  [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]
]);

interface SdfCorner {
  position: Vec3;
  local: LocalCoord;
  value: number;
}

interface SurfaceVertex {
  position: Vec3;
  normal: Vec3;
}

function trilinearGradient(values: readonly number[], local: LocalCoord, cell: Vec3): Vec3 {
  const [u, v, w] = local;
  const dx0 = values[1]! - values[0]!;
  const dx1 = values[2]! - values[3]!;
  const dx2 = values[5]! - values[4]!;
  const dx3 = values[6]! - values[7]!;
  const dy0 = values[3]! - values[0]!;
  const dy1 = values[2]! - values[1]!;
  const dy2 = values[7]! - values[4]!;
  const dy3 = values[6]! - values[5]!;
  const dz0 = values[4]! - values[0]!;
  const dz1 = values[5]! - values[1]!;
  const dz2 = values[7]! - values[3]!;
  const dz3 = values[6]! - values[2]!;
  return normalize([
    ((dx0 * (1 - v) + dx1 * v) * (1 - w) + (dx2 * (1 - v) + dx3 * v) * w) / cell[0],
    ((dy0 * (1 - u) + dy1 * u) * (1 - w) + (dy2 * (1 - u) + dy3 * u) * w) / cell[1],
    ((dz0 * (1 - u) + dz1 * u) * (1 - v) + (dz2 * (1 - u) + dz3 * u) * v) / cell[2]
  ]);
}

function interpolate(left: SdfCorner, right: SdfCorner, values: readonly number[], cell: Vec3): SurfaceVertex {
  const denominator = left.value - right.value;
  const amount = Math.abs(denominator) > EPS ? clamp(left.value / denominator, 0, 1) : 0.5;
  const position: Vec3 = [
    left.position[0] + (right.position[0] - left.position[0]) * amount,
    left.position[1] + (right.position[1] - left.position[1]) * amount,
    left.position[2] + (right.position[2] - left.position[2]) * amount
  ];
  const local: LocalCoord = [
    left.local[0] + (right.local[0] - left.local[0]) * amount,
    left.local[1] + (right.local[1] - left.local[1]) * amount,
    left.local[2] + (right.local[2] - left.local[2]) * amount
  ];
  return {position, normal: trilinearGradient(values, local, cell)};
}

function tetraPolygon(corners: readonly SdfCorner[], values: readonly number[], cell: Vec3): SurfaceVertex[] {
  const intersections: SurfaceVertex[] = [];
  for (const [leftIndex, rightIndex] of TETRA_EDGES) {
    const left = corners[leftIndex]!;
    const right = corners[rightIndex]!;
    if ((left.value < 0) !== (right.value < 0)) intersections.push(interpolate(left, right, values, cell));
  }
  if (intersections.length < 3) return [];
  const center = intersections.reduce<Vec3>((sum, entry) => add(sum, entry.position), [0, 0, 0]).map(value => value / intersections.length) as Vec3;
  const normal = normalize(intersections.reduce<Vec3>((sum, entry) => add(sum, entry.normal), [0, 0, 0]));
  const axis: Vec3 = Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const basisU = normalize(cross(axis, normal), [1, 0, 0]);
  const basisV = normalize(cross(normal, basisU), [0, 0, 1]);
  return [...intersections].sort((left, right) => {
    const leftDelta = subtract(left.position, center);
    const rightDelta = subtract(right.position, center);
    return Math.atan2(dot(leftDelta, basisV), dot(leftDelta, basisU)) - Math.atan2(dot(rightDelta, basisV), dot(rightDelta, basisU));
  });
}

function appendTriangle(
  triangle: readonly SurfaceVertex[],
  positions: number[],
  normals: number[],
  uvs: number[],
  indices: number[],
  bounds: {min: Vec3; max: Vec3}
): boolean {
  if (triangle.length !== 3) return false;
  let first = triangle[0]!;
  let second = triangle[1]!;
  let third = triangle[2]!;
  const face = cross(subtract(second.position, first.position), subtract(third.position, first.position));
  if (vectorLength(face) <= EPS) return false;
  const averageNormal = normalize(add(add(first.normal, second.normal), third.normal), normalize(face));
  if (dot(face, averageNormal) < 0) [second, third] = [third, second];
  const offset = positions.length / 3;
  for (const vertex of [first, second, third]) {
    positions.push(...vertex.position);
    normals.push(...vertex.normal);
    uvs.push(
      clamp((vertex.position[0] - bounds.min[0]) / (bounds.max[0] - bounds.min[0]), 0, 1),
      clamp((vertex.position[2] - bounds.min[2]) / (bounds.max[2] - bounds.min[2]), 0, 1)
    );
  }
  indices.push(offset, offset + 1, offset + 2);
  return true;
}

function defaultScene(sceneId: string, title: string): VSRSpatialScene3D {
  return {
    format: 'vsr.spatial-scene.v0.4',
    sceneId,
    title,
    background: '#020611',
    environment: {diffuseColor: '#101d35', specularColor: '#ffffff', intensity: 0.5},
    activeCameraId: 'camera:sdf:main',
    meshes: [],
    materials: [],
    nodes: [],
    cameras: [{id: 'camera:sdf:main', projection: 'perspective', fovYDeg: 55, near: 0.01, far: 1000, transform: {translation: [0, 1.5, 6]}}],
    lights: [{id: 'light:sdf:ambient', kind: 'ambient', color: '#ffffff', intensity: 0.2}],
    reality: {worldId: `world:${sceneId}`, generation: 0, realityRoot: cryptographicHash({sceneId, purpose: 'spatial-sdf-candidate'})}
  };
}

function sdfPayload(result: Pick<VSRSdfSpatialSceneResult, 'componentId' | 'sceneId' | 'sourceCandidateRoot' | 'contentRoot' | 'bounds' | 'grid' | 'sourceElementCount' | 'sourceCellCount' | 'visitedCellCount' | 'triangleCount' | 'renderableCount' | 'maxTriangles' | 'truncated' | 'origin' | 'meshId' | 'meshRoot'>): JsonRecord {
  return {
    format: VSR_SDF_SCENE_FORMAT,
    version: VSR_SDF_SCENE_VERSION,
    componentId: result.componentId,
    sceneId: result.sceneId,
    sourceCandidateRoot: result.sourceCandidateRoot,
    contentRoot: result.contentRoot,
    bounds: result.bounds,
    grid: result.grid,
    sourceElementCount: result.sourceElementCount,
    sourceCellCount: result.sourceCellCount,
    visitedCellCount: result.visitedCellCount,
    triangleCount: result.triangleCount,
    renderableCount: result.renderableCount,
    maxTriangles: result.maxTriangles,
    truncated: result.truncated,
    origin: result.origin,
    meshId: result.meshId,
    meshRoot: result.meshRoot
  };
}

export function lowerVsrSdfCandidateToSpatialScene(candidate: VSRSdfRepresentationCandidate, input: {assets: VSRSdfPayloadAsset[]; payloads: Map<string, Uint8Array>}, options: VSRSdfSpatialLoweringOptions = {}): VSRSdfSpatialSceneResult {
  const validation = validateCandidate(candidate, input.assets, input.payloads);
  const origin = options.origin ?? [0, 0, 0];
  if (!Array.isArray(origin) || origin.length !== 3 || origin.some(component => !finite(component))) throw new Error('VSR SDF origin must be a finite XYZ triple.');
  const maxTriangles = Math.max(1, Math.min(VSR_SDF_TRIANGLE_LIMIT, Math.floor(options.maxTriangles ?? VSR_SDF_TRIANGLE_LIMIT)));
  if (!Number.isSafeInteger(maxTriangles)) throw new Error('VSR SDF maxTriangles must be an integer.');
  const sceneId = options.sceneId?.trim() || options.baseScene?.sceneId || `sdf:${candidate.componentId}`;
  const namespace = safePart(options.idPrefix?.trim() || `sdf:${candidate.componentId}:${sceneId}`);
  const baseScene = options.baseScene ? {...options.baseScene, meshes: [...options.baseScene.meshes], materials: [...options.baseScene.materials], nodes: [...options.baseScene.nodes]} : defaultScene(sceneId, options.title?.trim() || `VSR SDF: ${candidate.componentId}`);
  const meshId = `${namespace}:surface`;
  const materialId = `${namespace}:material`;
  const nodeId = `${namespace}:surface-node`;
  if (baseScene.meshes.some(mesh => mesh.id === meshId)) throw new Error(`VSR SDF mesh id ${meshId} already exists in the base scene.`);
  if (baseScene.materials.some(material => material.id === materialId)) throw new Error(`VSR SDF material id ${materialId} already exists in the base scene.`);
  if (baseScene.nodes.some(node => node.id === nodeId)) throw new Error(`VSR SDF node id ${nodeId} already exists in the base scene.`);

  const {grid, view} = decodeGrid(validation.bytes);
  const step: Vec3 = [
    (candidate.bounds.max[0] - candidate.bounds.min[0]) / (grid.width - 1),
    (candidate.bounds.max[1] - candidate.bounds.min[1]) / (grid.height - 1),
    (candidate.bounds.max[2] - candidate.bounds.min[2]) / (grid.depth - 1)
  ];
  const worldMin: Vec3 = [candidate.bounds.min[0] + origin[0], candidate.bounds.min[1] + origin[1], candidate.bounds.min[2] + origin[2]];
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const sourceCellCount = (grid.width - 1) * (grid.height - 1) * (grid.depth - 1);
  let visitedCellCount = 0;
  let triangleCount = 0;
  let truncated = false;

  cellLoop: for (let z = 0; z < grid.depth - 1; z++) {
    for (let y = 0; y < grid.height - 1; y++) {
      for (let x = 0; x < grid.width - 1; x++) {
        visitedCellCount++;
        const values = CUBE_OFFSETS.map(([dx, dy, dz]) => view.getFloat32(VSR_SDF_HEADER_BYTE_LENGTH + indexOf(grid, x + dx, y + dy, z + dz) * VSR_SDF_RECORD_BYTE_LENGTH, true));
        const hasNegative = values.some(value => value < 0);
        const hasNonNegative = values.some(value => value >= 0);
        if (!hasNegative || !hasNonNegative) continue;
        const corners: SdfCorner[] = CUBE_OFFSETS.map(([dx, dy, dz], index) => ({
          position: [worldMin[0] + (x + dx) * step[0], worldMin[1] + (y + dy) * step[1], worldMin[2] + (z + dz) * step[2]],
          local: [dx, dy, dz],
          value: values[index]!
        }));
        for (const tetrahedron of TETRAHEDRA) {
          const tetraCorners = tetrahedron.map(index => corners[index]!);
          const polygon = tetraPolygon(tetraCorners, values, step);
          if (polygon.length < 3) continue;
          for (let index = 1; index < polygon.length - 1; index++) {
            if (triangleCount >= maxTriangles) {
              truncated = true;
              break cellLoop;
            }
            if (appendTriangle([polygon[0]!, polygon[index]!, polygon[index + 1]!], positions, normals, uvs, indices, {min: worldMin, max: [candidate.bounds.max[0] + origin[0], candidate.bounds.max[1] + origin[1], candidate.bounds.max[2] + origin[2]]})) triangleCount++;
          }
        }
      }
    }
  }
  if (triangleCount < 1) throw new Error('VSR SDF contains no bounded zero-crossing surface.');
  const mesh: VSRSpatialMesh = {id: meshId, positions, normals, uvs, indices, topology: 'triangle-list'};
  const material: VSRSpatialMaterial = {id: materialId, baseColor: options.baseColor?.trim() || '#8ab4ff', metallic: 0.08, roughness: 0.68, doubleSided: false};
  const node: VSRSpatialNode = {id: nodeId, meshId, materialId, visible: true, castShadow: true, receiveShadow: true, tags: ['sdf', `sdf-component:${candidate.componentId}`]};
  const scene: VSRSpatialScene3D = {...baseScene, sceneId, title: options.title?.trim() || baseScene.title, meshes: [...baseScene.meshes, mesh], materials: [...baseScene.materials, material], nodes: [...baseScene.nodes, node], ...(baseScene.streaming ? {streaming: {...baseScene.streaming, persistentNodeIds: [...new Set([...(baseScene.streaming.persistentNodeIds ?? []), nodeId])]}} : {})};
  const bounds = {min: [...candidate.bounds.min] as Vec3, max: [...candidate.bounds.max] as Vec3};
  const resultBase = {
    format: VSR_SDF_SCENE_FORMAT,
    version: VSR_SDF_SCENE_VERSION,
    status: 'EXECUTED' as const,
    renderStatus: 'CANDIDATE_CPU_MARCHING_TETRAHEDRA' as const,
    componentId: candidate.componentId,
    sceneId,
    sourceCandidateRoot: candidate.candidateRoot,
    contentRoot: candidate.contentRoot,
    bounds,
    grid: {...grid},
    sourceElementCount: validation.sourceElementCount,
    sourceCellCount,
    visitedCellCount,
    triangleCount,
    renderableCount: 1,
    maxTriangles,
    truncated,
    origin: [...origin] as Vec3,
    meshId,
    meshRoot: cryptographicHash(mesh),
    scene,
    sceneRoot: cryptographicHash(scene),
    sdfRoot: ''
  };
  const sdfRoot = cryptographicHash(sdfPayload(resultBase));
  const rooted = {...resultBase, sdfRoot, candidateOnly: true as const, authoritative: false as const};
  return {...rooted, root: cryptographicHash(rooted)};
}

export function verifyVsrSdfSpatialScene(result: VSRSdfSpatialSceneResult): boolean {
  try {
    if (!result || result.format !== VSR_SDF_SCENE_FORMAT || result.version !== VSR_SDF_SCENE_VERSION || result.status !== 'EXECUTED'
      || result.renderStatus !== 'CANDIDATE_CPU_MARCHING_TETRAHEDRA' || !nonEmpty(result.componentId) || !nonEmpty(result.sceneId)
      || !isRoot(result.sourceCandidateRoot) || !isRoot(result.contentRoot) || !validBounds(result.bounds)
      || !result.grid || !Number.isSafeInteger(result.grid.width) || !Number.isSafeInteger(result.grid.height) || !Number.isSafeInteger(result.grid.depth)
      || result.grid.width < 2 || result.grid.height < 2 || result.grid.depth < 2 || result.grid.width > VSR_SDF_GRID_DIMENSION_LIMIT || result.grid.height > VSR_SDF_GRID_DIMENSION_LIMIT || result.grid.depth > VSR_SDF_GRID_DIMENSION_LIMIT
      || !Number.isSafeInteger(result.sourceElementCount) || result.sourceElementCount !== result.grid.width * result.grid.height * result.grid.depth
      || !Number.isSafeInteger(result.sourceCellCount) || result.sourceCellCount !== (result.grid.width - 1) * (result.grid.height - 1) * (result.grid.depth - 1)
      || !Number.isSafeInteger(result.visitedCellCount) || result.visitedCellCount < 1 || result.visitedCellCount > result.sourceCellCount
      || !Number.isSafeInteger(result.triangleCount) || result.triangleCount < 1 || result.triangleCount > result.maxTriangles
      || !Number.isSafeInteger(result.renderableCount) || result.renderableCount !== 1
      || !Number.isSafeInteger(result.maxTriangles) || result.maxTriangles < 1 || result.maxTriangles > VSR_SDF_TRIANGLE_LIMIT
      || typeof result.truncated !== 'boolean' || (!result.truncated && result.visitedCellCount !== result.sourceCellCount)
      || !Array.isArray(result.origin) || result.origin.length !== 3 || result.origin.some(component => !finite(component))
      || !nonEmpty(result.meshId) || !isRoot(result.meshRoot) || !isRoot(result.sceneRoot) || !isRoot(result.sdfRoot) || !isRoot(result.root)
      || result.candidateOnly !== true || result.authoritative !== false) return false;
    const mesh = result.scene.meshes.find(entry => entry.id === result.meshId);
    const surfaceNodes = result.scene.nodes.filter(entry => entry.meshId === result.meshId);
    if (!mesh || cryptographicHash(mesh) !== result.meshRoot || mesh.indices.length !== result.triangleCount * 3 || mesh.positions.length !== result.triangleCount * 9 || mesh.normals?.length !== mesh.positions.length || mesh.uvs?.length !== result.triangleCount * 6 || surfaceNodes.length !== 1) return false;
    if (cryptographicHash(result.scene) !== result.sceneRoot) return false;
    const payload = sdfPayload(result);
    if (cryptographicHash(payload) !== result.sdfRoot) return false;
    const {root: _root, ...base} = result;
    return cryptographicHash(base) === result.root;
  } catch {
    return false;
  }
}
