import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cryptographicHash } from '../dist/packages/spec/src/index.js';
import {
  VSR_SPATIAL_SCENE_FORMAT,
  compileSpatialFrame,
  createCubeMesh,
  generateSpatialHLOD,
  renderSpatialReference,
  verifySpatialFrame,
} from '../dist/packages/spatial-reality-3d/src/index.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(packageRoot, 'outputs', 'spatial-hlod-auto');
mkdirSync(outputDirectory, { recursive: true });

const sourceScene = {
  format: VSR_SPATIAL_SCENE_FORMAT,
  sceneId: 'spatial-hlod-auto-evidence',
  title: 'Deterministic automatic HLOD generation',
  background: '#07101e',
  activeCameraId: 'camera:main',
  meshes: [createCubeMesh('mesh:source', 1)],
  materials: [{ id: 'material:source', baseColor: '#3b82f6', metallic: 0.25, roughness: 0.45 }],
  nodes: [
    { id: 'source:left', meshId: 'mesh:source', materialId: 'material:source', transform: { translation: [-1, 0, 0] } },
    { id: 'source:right', meshId: 'mesh:source', materialId: 'material:source', transform: { translation: [1, 0, 0] } },
  ],
  cameras: [{ id: 'camera:main', projection: 'perspective', fovYDeg: 55, near: 0.1, far: 100, transform: { translation: [0, 0, 3] } }],
  lights: [
    { id: 'light:ambient', kind: 'ambient', color: '#9bb7df', intensity: 0.35 },
    { id: 'light:sun', kind: 'directional', color: '#fff2d6', intensity: 1.8, direction: [-0.55, -1, -0.35], castShadow: false },
  ],
  reality: { worldId: 'world:spatial-hlod-auto-evidence', generation: 1 },
};

const generated = generateSpatialHLOD(sourceScene, {
  clusterId: 'cluster:auto-town',
  sourceNodeIds: ['source:left', 'source:right'],
  levels: [
    { maxDistance: 4, maxTriangles: 8 },
    { maxDistance: 12, maxTriangles: 4 },
  ],
});
const nearScene = structuredClone(generated.scene);
const farScene = structuredClone(generated.scene);
nearScene.cameras[0].transform.translation = [0, 0, 3];
farScene.cameras[0].transform.translation = [0, 0, 8];
const options = { width: 320, height: 180, enableShadows: false, gpuDrivenCulling: true };
const near = compileSpatialFrame(nearScene, options);
const far = compileSpatialFrame(farScene, options);
const nearRender = renderSpatialReference(nearScene, options);
const farRender = renderSpatialReference(farScene, options);
const writeJson = (name, value) => writeFileSync(path.join(outputDirectory, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const writeBinary = (name, value) => writeFileSync(path.join(outputDirectory, name), value);
writeJson('source-scene.vsr3d.json', sourceScene);
writeJson('generated-scene.vsr3d.json', generated.scene);
writeJson('near-scene.vsr3d.json', nearScene);
writeJson('far-scene.vsr3d.json', farScene);
writeJson('generation-report.json', generated.report);
writeJson('near-frame-plan.json', near);
writeJson('far-frame-plan.json', far);
writeBinary('near-reference.png', nearRender.png);
writeBinary('far-reference.png', farRender.png);
const evidenceBase = {
  format: 'vsr.spatial-hlod-generation-evidence.v0.1',
  sceneId: sourceScene.sceneId,
  generationRoot: generated.report.root,
  sourceRoot: generated.report.sourceRoot,
  sourceNodeIds: generated.report.sourceNodeIds,
  generatedNodeIds: generated.generatedNodes.map((node) => node.id),
  generatedMeshIds: generated.generatedMeshes.map((mesh) => mesh.id),
  levels: generated.report.levels,
  near: {
    frameRoot: near.frameRoot,
    hlodRoot: near.hlod?.root,
    selectedLevel: near.hlod?.clusters[0]?.selectedLevel,
    drawNodeIds: near.drawPackets.map((packet) => packet.nodeId),
    instanceNodeIds: near.drawPackets.flatMap((packet) => packet.instances?.map((instance) => instance.nodeId) ?? []),
    pixelRoot: nearRender.pixelRoot,
  },
  far: {
    frameRoot: far.frameRoot,
    hlodRoot: far.hlod?.root,
    selectedLevel: far.hlod?.clusters[0]?.selectedLevel,
    drawNodeIds: far.drawPackets.map((packet) => packet.nodeId),
    instanceNodeIds: far.drawPackets.flatMap((packet) => packet.instances?.map((instance) => instance.nodeId) ?? []),
    pixelRoot: farRender.pixelRoot,
  },
  verified: verifySpatialFrame(near).ok && verifySpatialFrame(far).ok,
};
const evidence = { ...evidenceBase, evidenceRoot: cryptographicHash(evidenceBase) };
writeJson('evidence.json', evidence);
console.log(JSON.stringify({ outputDirectory, verified: evidence.verified, generationRoot: generated.report.root, nearFrameRoot: near.frameRoot, farFrameRoot: far.frameRoot, nearHlod: near.hlod, farHlod: far.hlod, evidenceRoot: evidence.evidenceRoot }, null, 2));
