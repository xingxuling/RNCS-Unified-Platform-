import { cryptographicHash } from '../../spec/src/index.js';
import type {
  VSRSpatialCamera,
  VSRSpatialMaterial,
  VSRSpatialMesh,
  VSRSpatialNode,
  VSRSpatialRealityBinding,
  VSRSpatialScene3D,
  VSRSpatialStreamingCell,
  VSRSpatialTransform,
  Vec3
} from './index.js';

export const VSR_RAGF_SPATIAL_ADAPTER_FORMAT = 'ragf.vsr-spatial-asset.v0.4' as const;
export const VSR_RAGF_SPATIAL_COMPILATION_FORMAT = 'vsr.ragf-spatial-compilation.v0.1' as const;

export interface VSRRagfSpatialAssetAdapter {
  format: typeof VSR_RAGF_SPATIAL_ADAPTER_FORMAT;
  version: '0.4.0';
  asset_id: string;
  variant: string;
  mesh: VSRSpatialMesh;
  lods?: Array<{ lod: number; meshId: string; maxDistance: number; mesh: VSRSpatialMesh; sourceRoot?: string }>;
  material: VSRSpatialMaterial;
  node: VSRSpatialNode;
  source?: { asset_id?: string; mesh_roots?: string[]; lod_manifest_root?: string | null; pbr_root?: string | null; asset_root?: string | null };
  compatibility: { target_format: 'vsr.spatial-scene.v0.4'; minimum_runtime?: string };
  adapter_root: string;
}

export interface VSRRagfSpatialCompileOptions {
  sceneId?: string;
  worldId?: string;
  generation?: number;
  realityRoot?: string;
  evidenceRoot?: string;
  title?: string;
  background?: string;
  transform?: VSRSpatialTransform;
  camera?: Partial<VSRSpatialCamera>;
  cell?: { id: string; center: Vec3; radius: number; loadRadius?: number; unloadRadius?: number; priority?: number };
}

export interface VSRRagfSpatialCompilation {
  format: typeof VSR_RAGF_SPATIAL_COMPILATION_FORMAT;
  version: '0.1.0';
  assetId: string;
  variant: string;
  adapterRoot: string;
  scene: VSRSpatialScene3D;
  sceneRoot: string;
  nodeId: string;
  meshIds: string[];
  lodLevels: number;
  root: string;
}

function fail(condition: unknown, code: string): asserts condition {
  if (!condition) throw new Error(code);
}

function cloneMesh(mesh: VSRSpatialMesh, id: string): VSRSpatialMesh {
  fail(mesh && typeof mesh === 'object', 'VSR_RAGF_MESH_REQUIRED');
  fail(Array.isArray(mesh.positions) && Array.isArray(mesh.indices), 'VSR_RAGF_MESH_GEOMETRY_REQUIRED');
  return {
    ...mesh,
    id,
    positions: [...mesh.positions],
    ...(mesh.normals ? { normals: [...mesh.normals] } : {}),
    ...(mesh.uvs ? { uvs: [...mesh.uvs] } : {}),
    ...(mesh.uvs1 ? { uvs1: [...mesh.uvs1] } : {}),
    indices: [...mesh.indices],
    ...(mesh.jointIndices ? { jointIndices: [...mesh.jointIndices] } : {}),
    ...(mesh.jointWeights ? { jointWeights: [...mesh.jointWeights] } : {})
  };
}

function cloneTransform(transform: VSRSpatialTransform | undefined): VSRSpatialTransform {
  return {
    ...transform,
    ...(transform?.matrix ? { matrix: [...transform.matrix] as VSRSpatialTransform['matrix'] } : {}),
    ...(transform?.translation ? { translation: [...transform.translation] as Vec3 } : {}),
    ...(transform?.rotationEulerDeg ? { rotationEulerDeg: [...transform.rotationEulerDeg] as Vec3 } : {}),
    ...(transform?.rotationQuaternion ? { rotationQuaternion: [...transform.rotationQuaternion] } : {}),
    ...(transform?.scale ? { scale: [...transform.scale] as Vec3 } : {})
  };
}

function cloneNode(node: VSRSpatialNode, fallbackMeshId: string, materialId: string, transform?: VSRSpatialTransform): VSRSpatialNode {
  const lods = node.lods?.map(lod => ({ maxDistance: lod.maxDistance, meshId: lod.meshId }));
  return {
    ...node,
    id: node.id,
    meshId: node.meshId ?? fallbackMeshId,
    materialId: node.materialId ?? materialId,
    ...(lods ? { lods } : {}),
    ...(transform ? { transform: cloneTransform(transform) } : { transform: cloneTransform(node.transform) }),
    ...(node.tags ? { tags: [...node.tags] } : {})
  };
}

function cameraFor(options: VSRRagfSpatialCompileOptions, sceneId: string): VSRSpatialCamera {
  const cameraId = options.camera?.id ?? `camera:${sceneId}`;
  return {
    id: cameraId,
    projection: options.camera?.projection ?? 'perspective',
    transform: cloneTransform(options.camera?.transform ?? { translation: [0, 1.35, 5] }),
    ...(options.camera?.fovYDeg !== undefined ? { fovYDeg: options.camera.fovYDeg } : { fovYDeg: 58 }),
    ...(options.camera?.orthoHeight !== undefined ? { orthoHeight: options.camera.orthoHeight } : {}),
    near: options.camera?.near ?? 0.05,
    far: options.camera?.far ?? 5000
  };
}

export function compileRagfSpatialAsset(adapter: VSRRagfSpatialAssetAdapter, options: VSRRagfSpatialCompileOptions = {}): VSRRagfSpatialCompilation {
  fail(adapter?.format === VSR_RAGF_SPATIAL_ADAPTER_FORMAT, 'VSR_RAGF_ADAPTER_FORMAT_INVALID');
  fail(adapter.version === '0.4.0', 'VSR_RAGF_ADAPTER_VERSION_INVALID');
  fail(typeof adapter.asset_id === 'string' && adapter.asset_id.length > 0, 'VSR_RAGF_ASSET_ID_REQUIRED');
  fail(adapter.compatibility?.target_format === 'vsr.spatial-scene.v0.4', 'VSR_RAGF_TARGET_FORMAT_INVALID');
  fail(typeof adapter.adapter_root === 'string' && /^[a-f0-9]{64}$/i.test(adapter.adapter_root), 'VSR_RAGF_ADAPTER_ROOT_INVALID');

  const sceneId = options.sceneId ?? `scene:${adapter.asset_id}:${adapter.variant}`;
  const suppliedLevels = adapter.lods?.length
    ? adapter.lods
    : [{ lod: 0, meshId: adapter.mesh.id, maxDistance: 72, mesh: adapter.mesh }];
  const levels = [...suppliedLevels].sort((a, b) => a.lod - b.lod);
  const meshesById = new Map<string, VSRSpatialMesh>();
  meshesById.set(adapter.mesh.id, cloneMesh(adapter.mesh, adapter.mesh.id));
  for (const level of levels) meshesById.set(level.meshId, cloneMesh(level.mesh, level.meshId));
  const meshIds = [...meshesById.keys()].sort((a, b) => a.localeCompare(b));
  const fallbackMeshId = levels.at(-1)?.meshId ?? adapter.mesh.id;
  const node = cloneNode(adapter.node, fallbackMeshId, adapter.material.id, options.transform);
  const adapterLods = levels.filter(level => level.lod < levels.at(-1)!.lod).map(level => ({ maxDistance: level.maxDistance, meshId: level.meshId }));
  if (!node.lods?.length && adapterLods.length) node.lods = adapterLods;
  fail(meshesById.has(node.meshId!), 'VSR_RAGF_NODE_MESH_MISSING');
  for (const lod of node.lods ?? []) fail(meshesById.has(lod.meshId), 'VSR_RAGF_LOD_MESH_MISSING');

  const camera = cameraFor(options, sceneId);
  const evidenceRoot = options.evidenceRoot ?? adapter.source?.lod_manifest_root ?? undefined;
  const reality: VSRSpatialRealityBinding = {
    worldId: options.worldId ?? `world:${adapter.asset_id}`,
    ...(options.generation !== undefined ? { generation: options.generation } : {}),
    realityRoot: options.realityRoot ?? adapter.source?.asset_root ?? adapter.adapter_root,
    ...(evidenceRoot ? { evidenceRoot } : {})
  };
  const cell: VSRSpatialStreamingCell | undefined = options.cell ? {
    id: options.cell.id,
    center: [...options.cell.center] as Vec3,
    radius: options.cell.radius,
    nodeIds: [node.id],
    ...(options.cell.loadRadius !== undefined ? { loadRadius: options.cell.loadRadius } : {}),
    ...(options.cell.unloadRadius !== undefined ? { unloadRadius: options.cell.unloadRadius } : {}),
    ...(options.cell.priority !== undefined ? { priority: options.cell.priority } : {})
  } : undefined;
  const scene: VSRSpatialScene3D = {
    format: 'vsr.spatial-scene.v0.4',
    sceneId,
    title: options.title ?? `${adapter.asset_id} ${adapter.variant}`,
    background: options.background ?? '#07111f',
    ...(cell ? { streaming: { worldId: reality.worldId, cells: [cell] } } : {}),
    activeCameraId: camera.id,
    meshes: meshIds.map(id => meshesById.get(id)! ),
    materials: [{ ...adapter.material, id: adapter.material.id }],
    nodes: [node],
    cameras: [camera],
    lights: [
      { id: `ambient:${sceneId}`, kind: 'ambient', color: '#ffffff', intensity: 0.38 },
      { id: `key:${sceneId}`, kind: 'directional', color: '#d7ecff', direction: [-0.35, -0.8, -0.45], intensity: 1.2, castShadow: true }
    ],
    reality
  };
  const base = {
    format: VSR_RAGF_SPATIAL_COMPILATION_FORMAT,
    version: '0.1.0' as const,
    assetId: adapter.asset_id,
    variant: adapter.variant,
    adapterRoot: adapter.adapter_root,
    scene,
    sceneRoot: cryptographicHash(scene),
    nodeId: node.id,
    meshIds,
    lodLevels: levels.length
  };
  return { ...base, root: cryptographicHash(base) };
}
