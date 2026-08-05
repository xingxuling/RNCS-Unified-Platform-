import { cryptographicHash } from '../../spec/src/index.js';
import {
  calculateMeshNormals,
  identityMat4,
  meshBounds,
  multiplyMat4,
  transformDirection3,
  transformPoint3,
  transformToMat4,
} from './index.js';
import type {
  Mat4,
  Vec3,
  VSRSpatialHLODCluster,
  VSRSpatialHLODLevel,
  VSRSpatialMesh,
  VSRSpatialNode,
  VSRSpatialScene3D,
} from './index.js';

export const VSR_SPATIAL_HLOD_GENERATION_FORMAT = 'vsr.spatial-hlod-generation.v0.1' as const;
export const VSR_SPATIAL_HLOD_CELL_GENERATION_FORMAT = 'vsr.spatial-hlod-cell-generation.v0.1' as const;

export interface VSRSpatialHLODGenerationLevel {
  maxDistance: number;
  maxTriangles?: number;
}

export interface VSRSpatialHLODGenerationOptions {
  clusterId?: string;
  sourceNodeIds?: string[];
  levels?: VSRSpatialHLODGenerationLevel[];
  proxyNodePrefix?: string;
  materialId?: string;
}

export interface VSRSpatialHLODGeneratedLevel {
  maxDistance: number;
  maxTriangles: number;
  meshId: string;
  nodeId: string;
  triangleCount: number;
  sourceTriangleCount: number;
}

export interface VSRSpatialHLODGenerationReport {
  format: typeof VSR_SPATIAL_HLOD_GENERATION_FORMAT;
  version: '0.1.0';
  sceneId: string;
  clusterId: string;
  sourceNodeIds: string[];
  sourceRoot: string;
  settings: {
    proxyNodePrefix: string;
    materialId?: string;
  };
  levels: VSRSpatialHLODGeneratedLevel[];
  root: string;
}

export interface VSRSpatialHLODGenerationResult {
  scene: VSRSpatialScene3D;
  cluster: VSRSpatialHLODCluster;
  generatedMeshes: VSRSpatialMesh[];
  generatedNodes: VSRSpatialNode[];
  report: VSRSpatialHLODGenerationReport;
}

export interface VSRSpatialHLODCellGenerationOptions extends Omit<VSRSpatialHLODGenerationOptions, 'clusterId' | 'sourceNodeIds'> {
  cellIds?: string[];
  clusterIdPrefix?: string;
}

export interface VSRSpatialHLODCellGenerationClusterReport {
  cellId: string;
  clusterId: string;
  sourceNodeIds: string[];
  generatedNodeIds: string[];
  reportRoot: string;
}

export interface VSRSpatialHLODCellGenerationReport {
  format: typeof VSR_SPATIAL_HLOD_CELL_GENERATION_FORMAT;
  version: '0.1.0';
  worldId: string;
  cellIds: string[];
  catalogRoot: string;
  sourceRoot: string;
  clusters: VSRSpatialHLODCellGenerationClusterReport[];
  root: string;
}

export interface VSRSpatialHLODCellGenerationResult {
  scene: VSRSpatialScene3D;
  reports: VSRSpatialHLODGenerationReport[];
  report: VSRSpatialHLODCellGenerationReport;
}

interface WorldTriangle {
  points: [Vec3, Vec3, Vec3];
  normal: Vec3;
}

interface VertexBucket {
  position: Vec3;
  normal: Vec3;
  count: number;
}

interface ProxyTriangle {
  indices: [number, number, number];
  area: number;
  order: number;
}

const EPS = 1e-9;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale3 = (a: Vec3, scale: number): Vec3 => [a[0] * scale, a[1] * scale, a[2] * scale];
const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length3 = (value: Vec3): number => Math.hypot(value[0], value[1], value[2]);
const normalize3 = (value: Vec3): Vec3 => {
  const length = length3(value);
  return length < EPS ? [0, 1, 0] : [value[0] / length, value[1] / length, value[2] / length];
};

function sceneWorldMatrices(scene: VSRSpatialScene3D): Map<string, Mat4> {
  const byId = new Map(scene.nodes.map((node) => [node.id, node]));
  const cache = new Map<string, Mat4>();
  const visiting = new Set<string>();
  const resolve = (nodeId: string): Mat4 => {
    const cached = cache.get(nodeId);
    if (cached) return cached;
    if (visiting.has(nodeId)) throw new Error(`HLOD generation found a node hierarchy cycle at ${nodeId}.`);
    const node = byId.get(nodeId);
    if (!node) throw new Error(`HLOD generation references missing node ${nodeId}.`);
    visiting.add(nodeId);
    const local = transformToMat4(node.transform);
    const world = node.parentId ? multiplyMat4(resolve(node.parentId), local) : local;
    cache.set(nodeId, world);
    visiting.delete(nodeId);
    return world;
  };
  for (const node of scene.nodes) resolve(node.id);
  return cache;
}

function sourceTriangles(scene: VSRSpatialScene3D, sourceNodeIds: string[]): {
  triangles: WorldTriangle[];
  sourceTriangleCount: number;
  bounds: { min: Vec3; max: Vec3 };
  materialIds: string[];
  castShadow: boolean;
  receiveShadow: boolean;
} {
  const nodesById = new Map(scene.nodes.map((node) => [node.id, node]));
  const meshesById = new Map(scene.meshes.map((mesh) => [mesh.id, mesh]));
  const worlds = sceneWorldMatrices(scene);
  const triangles: WorldTriangle[] = [];
  const materialIds = new Set<string>();
  let min: Vec3 = [Infinity, Infinity, Infinity];
  let max: Vec3 = [-Infinity, -Infinity, -Infinity];
  let castShadow = false;
  let receiveShadow = false;
  for (const nodeId of sourceNodeIds) {
    const node = nodesById.get(nodeId);
    if (!node) throw new Error(`HLOD generation source node ${nodeId} does not exist.`);
    if (node.visible === false) throw new Error(`HLOD generation source node ${nodeId} is hidden.`);
    if (!node.meshId) throw new Error(`HLOD generation source node ${nodeId} has no mesh.`);
    if (node.skinId || node.morphWeights?.length || node.lods?.length) {
      throw new Error(`HLOD generation only accepts static source nodes; ${nodeId} has deformation or LOD state.`);
    }
    const mesh = meshesById.get(node.meshId);
    if (!mesh) throw new Error(`HLOD generation source node ${nodeId} references missing mesh ${node.meshId}.`);
    if (mesh.jointIndices || mesh.jointWeights || mesh.morphTargets?.length) {
      throw new Error(`HLOD generation only accepts static meshes; ${mesh.id} has deformation channels.`);
    }
    const world = worlds.get(nodeId) ?? identityMat4();
    const normals = mesh.normals ?? calculateMeshNormals(mesh);
    const sourceBounds = meshBounds(mesh);
    const corners = [
      [sourceBounds.min[0], sourceBounds.min[1], sourceBounds.min[2]],
      [sourceBounds.min[0], sourceBounds.min[1], sourceBounds.max[2]],
      [sourceBounds.min[0], sourceBounds.max[1], sourceBounds.min[2]],
      [sourceBounds.min[0], sourceBounds.max[1], sourceBounds.max[2]],
      [sourceBounds.max[0], sourceBounds.min[1], sourceBounds.min[2]],
      [sourceBounds.max[0], sourceBounds.min[1], sourceBounds.max[2]],
      [sourceBounds.max[0], sourceBounds.max[1], sourceBounds.min[2]],
      [sourceBounds.max[0], sourceBounds.max[1], sourceBounds.max[2]],
    ] as Vec3[];
    for (const corner of corners) {
      const point = transformPoint3(world, corner);
      min = [Math.min(min[0], point[0]), Math.min(min[1], point[1]), Math.min(min[2], point[2])];
      max = [Math.max(max[0], point[0]), Math.max(max[1], point[1]), Math.max(max[2], point[2])];
    }
    for (let index = 0; index < mesh.indices.length; index += 3) {
      const ia = mesh.indices[index]! * 3;
      const ib = mesh.indices[index + 1]! * 3;
      const ic = mesh.indices[index + 2]! * 3;
      const a = transformPoint3(world, [mesh.positions[ia]!, mesh.positions[ia + 1]!, mesh.positions[ia + 2]!]);
      const b = transformPoint3(world, [mesh.positions[ib]!, mesh.positions[ib + 1]!, mesh.positions[ib + 2]!]);
      const c = transformPoint3(world, [mesh.positions[ic]!, mesh.positions[ic + 1]!, mesh.positions[ic + 2]!]);
      const faceNormal = normalize3(cross3(sub3(b, a), sub3(c, a)));
      const averageNormal = normalize3(add3(
        add3(
          transformDirection3(world, [normals[ia]!, normals[ia + 1]!, normals[ia + 2]!]),
          transformDirection3(world, [normals[ib]!, normals[ib + 1]!, normals[ib + 2]!]),
        ),
        transformDirection3(world, [normals[ic]!, normals[ic + 1]!, normals[ic + 2]!]),
      ));
      triangles.push({ points: [a, b, c], normal: length3(averageNormal) < EPS ? faceNormal : averageNormal });
    }
    if (node.materialId) materialIds.add(node.materialId);
    castShadow ||= node.castShadow !== false;
    receiveShadow ||= node.receiveShadow !== false;
  }
  if (!triangles.length || !Number.isFinite(min[0]) || !Number.isFinite(max[0])) {
    throw new Error('HLOD generation found no source triangles.');
  }
  return { triangles, sourceTriangleCount: triangles.length, bounds: { min, max }, materialIds: [...materialIds].sort(), castShadow, receiveShadow };
}

function bucketKey(point: Vec3, bounds: { min: Vec3; max: Vec3 }, cells: number): string {
  const coordinates = [0, 1, 2].map((axis) => {
    const extent = Math.max(bounds.max[axis]! - bounds.min[axis]!, EPS);
    return clamp(Math.floor(((point[axis]! - bounds.min[axis]!) / extent) * cells), 0, cells - 1);
  });
  return `${coordinates[0]}:${coordinates[1]}:${coordinates[2]}`;
}

function buildBoundsProxyMesh(id: string, bounds: { min: Vec3; max: Vec3 }, maxTriangles: number): VSRSpatialMesh {
  const center: Vec3 = [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  ];
  const extents: Vec3 = [
    Math.max(bounds.max[0] - bounds.min[0], 1e-4),
    Math.max(bounds.max[1] - bounds.min[1], 1e-4),
    Math.max(bounds.max[2] - bounds.min[2], 1e-4),
  ];
  const min: Vec3 = [center[0] - extents[0] / 2, center[1] - extents[1] / 2, center[2] - extents[2] / 2];
  const max: Vec3 = [center[0] + extents[0] / 2, center[1] + extents[1] / 2, center[2] + extents[2] / 2];
  const corners: Record<string, Vec3> = {
    nnn: [min[0], min[1], min[2]],
    nnp: [min[0], min[1], max[2]],
    npn: [min[0], max[1], min[2]],
    npp: [min[0], max[1], max[2]],
    pnn: [max[0], min[1], min[2]],
    pnp: [max[0], min[1], max[2]],
    ppn: [max[0], max[1], min[2]],
    ppp: [max[0], max[1], max[2]],
  };
  const faces: Array<{ normal: Vec3; triangles: Array<[Vec3, Vec3, Vec3]> }> = [
    { normal: [0, 0, 1], triangles: [[corners.nnp!, corners.pnp!, corners.ppp!], [corners.nnp!, corners.ppp!, corners.npp!]] },
    { normal: [0, 0, -1], triangles: [[corners.pnn!, corners.nnn!, corners.npn!], [corners.pnn!, corners.npn!, corners.ppn!]] },
    { normal: [0, 1, 0], triangles: [[corners.npp!, corners.ppp!, corners.ppn!], [corners.npp!, corners.ppn!, corners.npn!]] },
    { normal: [0, -1, 0], triangles: [[corners.nnn!, corners.pnn!, corners.pnp!], [corners.nnn!, corners.pnp!, corners.nnp!]] },
    { normal: [1, 0, 0], triangles: [[corners.pnp!, corners.pnn!, corners.ppn!], [corners.pnp!, corners.ppn!, corners.ppp!]] },
    { normal: [-1, 0, 0], triangles: [[corners.nnn!, corners.nnp!, corners.npp!], [corners.nnn!, corners.npp!, corners.npn!]] },
  ];
  const triangles: Array<{ points: [Vec3, Vec3, Vec3]; normal: Vec3 }> = [];
  if (maxTriangles <= 4) {
    const a = corners.nnn!;
    const b = corners.pnn!;
    const c = corners.npp!;
    const d = corners.pnp!;
    triangles.push({ points: [a, b, c], normal: [0, -1, 0] }, { points: [a, d, b], normal: [0, 0, -1] }, { points: [a, c, d], normal: [-1, 0, 0] }, { points: [b, d, c], normal: [1, 1, 1] });
  } else {
    for (let pass = 0; pass < 2 && triangles.length < maxTriangles; pass += 1) {
      for (const face of faces) {
        const triangle = face.triangles[pass];
        if (!triangle || triangles.length >= maxTriangles) continue;
        triangles.push({ points: triangle, normal: face.normal });
      }
    }
  }
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (const triangle of triangles) {
    const base = positions.length / 3;
    for (const point of triangle.points) {
      positions.push(...point);
      normals.push(...normalize3(cross3(sub3(triangle.points[1], triangle.points[0]), sub3(triangle.points[2], triangle.points[0]))));
      uvs.push(clamp((point[0] - min[0]) / extents[0], 0, 1), clamp((point[2] - min[2]) / extents[2], 0, 1));
    }
    indices.push(base, base + 1, base + 2);
  }
  return { id, positions, normals, uvs, indices };
}

function buildProxyMesh(id: string, triangles: WorldTriangle[], bounds: { min: Vec3; max: Vec3 }, maxTriangles: number): VSRSpatialMesh {
  if (maxTriangles < 12) return buildBoundsProxyMesh(id, bounds, maxTriangles);
  const cells = Math.max(1, Math.ceil(Math.cbrt(Math.max(1, maxTriangles))));
  const buckets = new Map<string, VertexBucket>();
  const bucketIndices = new Map<string, number>();
  const triangleIndices: ProxyTriangle[] = [];
  const resolveVertex = (point: Vec3, normal: Vec3): number => {
    const key = bucketKey(point, bounds, cells);
    const existing = buckets.get(key);
    if (existing) {
      existing.position = add3(existing.position, point);
      existing.normal = add3(existing.normal, normal);
      existing.count += 1;
      return bucketIndices.get(key)!;
    }
    const next = buckets.size;
    buckets.set(key, { position: [...point], normal: [...normal], count: 1 });
    bucketIndices.set(key, next);
    return next;
  };
  for (const [order, triangle] of triangles.entries()) {
    const first = resolveVertex(triangle.points[0], triangle.normal);
    const second = resolveVertex(triangle.points[1], triangle.normal);
    const third = resolveVertex(triangle.points[2], triangle.normal);
    if (first === second || second === third || first === third) continue;
    const area = length3(cross3(sub3(triangle.points[1], triangle.points[0]), sub3(triangle.points[2], triangle.points[0])));
    if (area > EPS) triangleIndices.push({ indices: [first, second, third], area, order });
  }
  if (!triangleIndices.length) {
    const first = triangles[0]!;
    const area = length3(cross3(sub3(first.points[1], first.points[0]), sub3(first.points[2], first.points[0])));
    if (area <= EPS) throw new Error(`HLOD proxy mesh ${id} contains only degenerate triangles.`);
    triangleIndices.push({ indices: [0, 1, 2], area, order: 0 });
  }
  const selected = triangleIndices.length > maxTriangles
    ? [...triangleIndices].sort((a, b) => b.area - a.area || a.order - b.order).slice(0, maxTriangles).sort((a, b) => a.order - b.order)
    : triangleIndices;
  const remap = new Map<number, number>();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const keys = [...buckets.keys()];
  const extentX = Math.max(bounds.max[0] - bounds.min[0], EPS);
  const extentY = Math.max(bounds.max[1] - bounds.min[1], EPS);
  const extentZ = Math.max(bounds.max[2] - bounds.min[2], EPS);
  const addRemappedVertex = (bucketIndex: number): number => {
    const existing = remap.get(bucketIndex);
    if (existing !== undefined) return existing;
    const key = keys[bucketIndex];
    const bucket = key ? buckets.get(key) : undefined;
    if (!bucket) throw new Error(`HLOD proxy mesh ${id} lost vertex bucket ${bucketIndex}.`);
    const position = scale3(bucket.position, 1 / bucket.count);
    const normal = normalize3(bucket.normal);
    const uv: [number, number] = [
      clamp((position[0] - bounds.min[0]) / extentX, 0, 1),
      clamp((position[2] - bounds.min[2]) / extentZ, 0, 1),
    ];
    const next = positions.length / 3;
    remap.set(bucketIndex, next);
    positions.push(...position);
    normals.push(...normal);
    uvs.push(...uv);
    return next;
  };
  for (const triangle of selected) indices.push(...triangle.indices.map(addRemappedVertex));
  return { id, positions, normals, uvs, indices };
}

function defaultLevels(sourceTriangleCount: number, radius: number): VSRSpatialHLODGenerationLevel[] {
  return [
    { maxDistance: Math.max(8, radius * 4), maxTriangles: Math.max(4, Math.ceil(sourceTriangleCount * 0.35)) },
    { maxDistance: Math.max(24, radius * 12), maxTriangles: Math.max(4, Math.ceil(sourceTriangleCount * 0.1)) },
  ];
}

function cloneCluster(cluster: VSRSpatialHLODCluster): VSRSpatialHLODCluster {
  return { id: cluster.id, sourceNodeIds: [...cluster.sourceNodeIds], levels: cluster.levels.map((level) => ({ maxDistance: level.maxDistance, proxyNodeIds: [...level.proxyNodeIds] })) };
}

function isStaticHLODSourceCandidate(node: VSRSpatialNode, meshesById: Map<string, VSRSpatialMesh>): boolean {
  if (node.visible === false || !node.meshId || node.skinId || node.morphWeights?.length || node.lods?.length || node.tags?.includes('hlod-generated')) return false;
  const mesh = meshesById.get(node.meshId);
  return Boolean(mesh && !mesh.jointIndices && !mesh.jointWeights && !mesh.morphTargets?.length);
}

export function generateSpatialHLOD(scene: VSRSpatialScene3D, options: VSRSpatialHLODGenerationOptions = {}): VSRSpatialHLODGenerationResult {
  const clusterId = options.clusterId?.trim() || 'hlod:auto';
  if (scene.hlod?.clusters.some((cluster) => cluster.id === clusterId)) throw new Error(`HLOD cluster ${clusterId} already exists.`);
  const nodesById = new Map(scene.nodes.map((node) => [node.id, node]));
  const meshesById = new Map(scene.meshes.map((mesh) => [mesh.id, mesh]));
  const sourceNodeIds = [...new Set(options.sourceNodeIds?.length ? options.sourceNodeIds : scene.nodes
    .filter((node) => isStaticHLODSourceCandidate(node, meshesById))
    .map((node) => node.id))];
  if (!sourceNodeIds.length) throw new Error('HLOD generation requires at least one static source node.');
  for (const nodeId of sourceNodeIds) if (!nodesById.has(nodeId)) throw new Error(`HLOD generation source node ${nodeId} does not exist.`);
  const source = sourceTriangles(scene, sourceNodeIds);
  const radius = Math.max(EPS, Math.hypot(
    source.bounds.max[0] - source.bounds.min[0],
    source.bounds.max[1] - source.bounds.min[1],
    source.bounds.max[2] - source.bounds.min[2],
  ) / 2);
  const levels = options.levels?.length ? options.levels.map((level) => ({ ...level })) : defaultLevels(source.sourceTriangleCount, radius);
  if (!levels.length) throw new Error('HLOD generation requires at least one proxy level.');
  for (let index = 0; index < levels.length; index += 1) {
    const level = levels[index]!;
    if (!Number.isFinite(level.maxDistance) || level.maxDistance <= 0) throw new Error(`HLOD generation level ${index} maxDistance is invalid.`);
    if (index > 0 && level.maxDistance <= levels[index - 1]!.maxDistance) throw new Error('HLOD generation levels must be ordered by maxDistance.');
    if (level.maxTriangles !== undefined && (!Number.isFinite(level.maxTriangles) || level.maxTriangles < 4)) throw new Error(`HLOD generation level ${index} maxTriangles must be at least 4.`);
  }
  const proxyNodePrefix = options.proxyNodePrefix?.trim() || `${clusterId}:proxy`;
  const materialId = options.materialId ?? source.materialIds[0];
  if (materialId && !scene.materials.some((material) => material.id === materialId)) throw new Error(`HLOD generation material ${materialId} does not exist.`);
  const usedNodeIds = new Set(scene.nodes.map((node) => node.id));
  const usedMeshIds = new Set(scene.meshes.map((mesh) => mesh.id));
  const generatedMeshes: VSRSpatialMesh[] = [];
  const generatedNodes: VSRSpatialNode[] = [];
  const generatedLevels: VSRSpatialHLODGeneratedLevel[] = [];
  const proxyNodeIds: string[] = [];
  const makeUnique = (base: string, used: Set<string>): string => {
    let candidate = base;
    let suffix = 1;
    while (used.has(candidate)) candidate = `${base}:${suffix++}`;
    used.add(candidate);
    return candidate;
  };
  for (const [index, level] of levels.entries()) {
    const maxTriangles = Math.max(4, Math.floor(level.maxTriangles ?? Math.max(4, Math.ceil(source.sourceTriangleCount * (index === 0 ? 0.35 : 0.1)))));
    const nodeId = makeUnique(`${proxyNodePrefix}:level:${index}`, usedNodeIds);
    const meshId = makeUnique(`${nodeId}:mesh`, usedMeshIds);
    const mesh = buildProxyMesh(meshId, source.triangles, source.bounds, maxTriangles);
    const node: VSRSpatialNode = {
      id: nodeId,
      meshId,
      materialId,
      transform: { matrix: identityMat4() },
      visible: true,
      castShadow: source.castShadow,
      receiveShadow: source.receiveShadow,
      tags: ['hlod-generated', `hlod-cluster:${clusterId}`, `hlod-level:${index}`],
    };
    generatedMeshes.push(mesh);
    generatedNodes.push(node);
    proxyNodeIds.push(nodeId);
    generatedLevels.push({ maxDistance: level.maxDistance, maxTriangles, meshId, nodeId, triangleCount: mesh.indices.length / 3, sourceTriangleCount: source.sourceTriangleCount });
  }
  const cluster: VSRSpatialHLODCluster = { id: clusterId, sourceNodeIds, levels: generatedLevels.map((level) => ({ maxDistance: level.maxDistance, proxyNodeIds: [level.nodeId] })) as VSRSpatialHLODLevel[] };
  const sourceRoot = cryptographicHash({
    sceneId: scene.sceneId,
    sourceNodeIds,
    sources: sourceNodeIds.map((nodeId) => {
      const node = nodesById.get(nodeId)!;
      const mesh = scene.meshes.find((entry) => entry.id === node.meshId)!;
      return { node, mesh };
    }),
  });
  const reportBase = {
    format: VSR_SPATIAL_HLOD_GENERATION_FORMAT,
    version: '0.1.0' as const,
    sceneId: scene.sceneId,
    clusterId,
    sourceNodeIds,
    sourceRoot,
    settings: { proxyNodePrefix, ...(materialId ? { materialId } : {}) },
    levels: generatedLevels,
  };
  const report: VSRSpatialHLODGenerationReport = { ...reportBase, root: cryptographicHash(reportBase) };
  const nextScene: VSRSpatialScene3D = {
    ...scene,
    meshes: [...scene.meshes, ...generatedMeshes],
    nodes: [...scene.nodes, ...generatedNodes],
    hlod: { clusters: [...(scene.hlod?.clusters ?? []).map(cloneCluster), cluster] },
  };
  return { scene: nextScene, cluster, generatedMeshes, generatedNodes, report };
}

export function generateSpatialHLODForStreamingCells(scene: VSRSpatialScene3D, options: VSRSpatialHLODCellGenerationOptions = {}): VSRSpatialHLODCellGenerationResult {
  const streaming = scene.streaming;
  if (!streaming) throw new Error('Cell-aware HLOD generation requires scene.streaming.');
  const cellsById = new Map(streaming.cells.map((cell) => [cell.id, cell]));
  const requestedCellIds = options.cellIds?.length ? [...new Set(options.cellIds)] : streaming.cells.map((cell) => cell.id).sort();
  for (const cellId of requestedCellIds) if (!cellsById.has(cellId)) throw new Error(`Cell-aware HLOD generation references missing cell ${cellId}.`);
  const meshesById = new Map(scene.meshes.map((mesh) => [mesh.id, mesh]));
  const owners = new Map<string, string>();
  const reports: VSRSpatialHLODGenerationReport[] = [];
  const clusterReports: VSRSpatialHLODCellGenerationClusterReport[] = [];
  let nextScene = scene;
  const prefix = options.clusterIdPrefix?.trim() || `${streaming.worldId}:hlod`;
  for (const cellId of requestedCellIds.sort()) {
    const cell = cellsById.get(cellId)!;
    const sourceNodeIds = [...new Set(cell.nodeIds.filter((nodeId) => isStaticHLODSourceCandidate(nextScene.nodes.find((node) => node.id === nodeId) ?? { id: nodeId }, meshesById)))].sort();
    if (!sourceNodeIds.length) continue;
    for (const nodeId of sourceNodeIds) {
      const owner = owners.get(nodeId);
      if (owner && owner !== cellId) throw new Error(`Cell-aware HLOD source node ${nodeId} belongs to both ${owner} and ${cellId}.`);
      owners.set(nodeId, cellId);
    }
    const generated = generateSpatialHLOD(nextScene, { ...options, clusterId: `${prefix}:${cellId}`, sourceNodeIds });
    reports.push(generated.report);
    clusterReports.push({ cellId, clusterId: generated.report.clusterId, sourceNodeIds, generatedNodeIds: generated.generatedNodes.map((node) => node.id), reportRoot: generated.report.root });
    const generatedNodeIds = generated.generatedNodes.map((node) => node.id);
    nextScene = {
      ...generated.scene,
      streaming: {
        ...generated.scene.streaming!,
        cells: generated.scene.streaming!.cells.map((entry) => entry.id === cellId ? { ...entry, nodeIds: [...new Set([...entry.nodeIds, ...generatedNodeIds])].sort() } : { ...entry, nodeIds: [...entry.nodeIds] }),
      },
    };
  }
  const finalCellsById = new Map(nextScene.streaming!.cells.map((cell) => [cell.id, cell]));
  const catalog = requestedCellIds.map((cellId) => {
    const cell = finalCellsById.get(cellId)!;
    return { id: cell.id, center: cell.center, radius: cell.radius, loadRadius: cell.loadRadius ?? null, unloadRadius: cell.unloadRadius ?? null, priority: cell.priority ?? null, nodeIds: [...cell.nodeIds].sort() };
  });
  const catalogRoot = cryptographicHash({ format: VSR_SPATIAL_HLOD_CELL_GENERATION_FORMAT, worldId: streaming.worldId, cells: catalog });
  const sourceRoot = cryptographicHash({ format: VSR_SPATIAL_HLOD_CELL_GENERATION_FORMAT, worldId: streaming.worldId, catalogRoot, clusters: reports.map((report) => ({ clusterId: report.clusterId, sourceRoot: report.sourceRoot })) });
  const reportBase = { format: VSR_SPATIAL_HLOD_CELL_GENERATION_FORMAT, version: '0.1.0' as const, worldId: streaming.worldId, cellIds: requestedCellIds, catalogRoot, sourceRoot, clusters: clusterReports };
  return { scene: nextScene, reports, report: { ...reportBase, root: cryptographicHash(reportBase) } };
}
