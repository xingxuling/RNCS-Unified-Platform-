import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cryptographicHash } from '../dist/packages/spec/src/index.js';
import {
  VSR_SPATIAL_SCENE_FORMAT,
  compileSpatialFrame,
  createCubeMesh,
  generateSpatialHLODForStreamingCells,
  renderSpatialReference,
  verifySpatialFrame,
} from '../dist/packages/spatial-reality-3d/src/index.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(packageRoot, 'outputs', 'spatial-hlod-cell');
mkdirSync(outputDirectory, { recursive: true });

const sourceScene = {
  format: VSR_SPATIAL_SCENE_FORMAT,
  sceneId: 'spatial-hlod-cell-evidence',
  title: 'Cell-aware automatic HLOD generation',
  background: '#07101e',
  activeCameraId: 'camera:main',
  meshes: [createCubeMesh('mesh:source', 1)],
  materials: [{ id: 'material:source', baseColor: '#3b82f6', metallic: 0.25, roughness: 0.45 }],
  nodes: [
    { id: 'source:left', meshId: 'mesh:source', materialId: 'material:source', transform: { translation: [-1, 0, 0] } },
    { id: 'source:right', meshId: 'mesh:source', materialId: 'material:source', transform: { translation: [1, 0, 0] } },
  ],
  streaming: {
    worldId: 'world:spatial-hlod-cell-evidence',
    cells: [
      { id: 'cell:left', center: [-1, 0, 0], radius: 2, nodeIds: ['source:left'] },
      { id: 'cell:right', center: [1, 0, 0], radius: 2, nodeIds: ['source:right'] },
    ],
  },
  cameras: [{ id: 'camera:main', projection: 'perspective', fovYDeg: 55, near: 0.1, far: 100, transform: { translation: [0, 0, 3] } }],
  lights: [
    { id: 'light:ambient', kind: 'ambient', color: '#9bb7df', intensity: 0.35 },
    { id: 'light:sun', kind: 'directional', color: '#fff2d6', intensity: 1.8, direction: [-0.55, -1, -0.35], castShadow: false },
  ],
  reality: { worldId: 'world:spatial-hlod-cell-evidence', generation: 1 },
};

const generated = generateSpatialHLODForStreamingCells(sourceScene, {
  clusterIdPrefix: 'world:spatial-hlod-cell-evidence:auto',
  levels: [{ maxDistance: 4, maxTriangles: 8 }, { maxDistance: 20, maxTriangles: 4 }],
});
const nearScene = structuredClone(generated.scene);
const farScene = structuredClone(generated.scene);
nearScene.cameras[0].transform.translation = [0, 0, 3];
farScene.cameras[0].transform.translation = [0, 0, 8];
const nearOptions = { width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true, streaming: { loadRadius: 0, unloadRadius: 0, forcedCellIds: ['cell:left'] } };
const farOptions = { width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true, streaming: { loadRadius: 0, unloadRadius: 0, forcedCellIds: ['cell:left', 'cell:right'] } };
const near = compileSpatialFrame(nearScene, nearOptions);
const far = compileSpatialFrame(farScene, farOptions);
const nearRender = renderSpatialReference(nearScene, nearOptions);
const farRender = renderSpatialReference(farScene, farOptions);
const writeJson = (name, value) => writeFileSync(path.join(outputDirectory, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const writeBinary = (name, value) => writeFileSync(path.join(outputDirectory, name), value);
writeJson('source-scene.vsr3d.json', sourceScene);
writeJson('generated-scene.vsr3d.json', generated.scene);
writeJson('near-scene.vsr3d.json', nearScene);
writeJson('far-scene.vsr3d.json', farScene);
writeJson('near-options.json', nearOptions);
writeJson('far-options.json', farOptions);
writeJson('cell-generation-report.json', generated.report);
writeJson('near-frame-plan.json', near);
writeJson('far-frame-plan.json', far);
writeBinary('near-reference.png', nearRender.png);
writeBinary('far-reference.png', farRender.png);
const nearCluster = near.hlod?.clusters.find((cluster) => cluster.id.endsWith(':cell:left'));
const evidenceBase = {
  format: 'vsr.spatial-hlod-cell-evidence.v0.1',
  sceneId: sourceScene.sceneId,
  generationRoot: generated.report.root,
  catalogRoot: generated.report.catalogRoot,
  sourceRoot: generated.report.sourceRoot,
  cellIds: generated.report.cellIds,
  clusterReports: generated.report.clusters,
  near: {
    frameRoot: near.frameRoot,
    hlodRoot: near.hlod?.root,
    activeCellIds: near.streaming?.activeCellIds,
    selectedLevel: nearCluster?.selectedLevel,
    drawNodeIds: near.drawPackets.map((packet) => packet.nodeId),
    triangles: near.stats.triangleCount,
    pixelRoot: nearRender.pixelRoot,
  },
  far: {
    frameRoot: far.frameRoot,
    hlodRoot: far.hlod?.root,
    activeCellIds: far.streaming?.activeCellIds,
    selectedLevels: far.hlod?.clusters.map((cluster) => cluster.selectedLevel),
    drawNodeIds: far.drawPackets.map((packet) => packet.nodeId),
    triangles: far.stats.triangleCount,
    pixelRoot: farRender.pixelRoot,
  },
  verified: verifySpatialFrame(near).ok && verifySpatialFrame(far).ok,
};
const evidence = { ...evidenceBase, evidenceRoot: cryptographicHash(evidenceBase) };
writeJson('evidence.json', evidence);
console.log(JSON.stringify({ outputDirectory, verified: evidence.verified, generationRoot: generated.report.root, nearFrameRoot: near.frameRoot, farFrameRoot: far.frameRoot, nearCluster, farHlod: far.hlod, evidenceRoot: evidence.evidenceRoot }, null, 2));
