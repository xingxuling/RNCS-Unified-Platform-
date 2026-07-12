import { semanticHash } from '../../spec/src/index.js';
import {
  POSITION_SCALE,
  ROTATION_SCALE,
  type RuntimeSpatialBody,
  type SpatialEmbodimentSnapshot,
  type SpatialFixtureSpec
} from '../../spatial-embodiment/src/index.js';
import {
  VSR_SPATIAL_SCENE_FORMAT,
  compileSpatialFrame,
  createCubeMesh,
  createPlaneMesh,
  createUVSphereMesh,
  renderSpatialReference,
  verifySpatialFrame,
  type VSRSpatialMaterial,
  type VSRSpatialMesh,
  type VSRSpatialNode,
  type VSRSpatialScene3D
} from './vsr-spatial-v04.js';

export const SPATIAL_EMBODIMENT_VSR_VERSION = '0.5.0-alpha.1';

export interface SpatialEmbodimentProjectionOptions {
  width?: number;
  height?: number;
  qualityTier?: 'economy' | 'balanced' | 'quality' | 'cinematic';
  cameraPosition?: [number, number, number];
  cameraRotationDeg?: [number, number, number];
  includeContacts?: boolean;
  includeSensoryEvents?: boolean;
}

export interface SpatialEmbodimentProjectionResult {
  format: 'rsr.spatial-embodiment-vsr-projection.v0.5';
  sourceStateRoot: string;
  sourceRealityRoot?: string;
  scene: VSRSpatialScene3D;
  framePlan: ReturnType<typeof compileSpatialFrame>;
  frameVerified: boolean;
  png: Uint8Array;
  pixelRoot: string;
  projectionRoot: string;
}

function materialFor(body: RuntimeSpatialBody): VSRSpatialMaterial {
  const grounded = body.grounded;
  if (body.kind === 'static') return { id: `material:${body.id}`, baseColor: '#334155', metallic: 0.05, roughness: 0.86 };
  if (body.kind === 'kinematic') return { id: `material:${body.id}`, baseColor: '#f59e0b', metallic: 0.1, roughness: 0.42 };
  return { id: `material:${body.id}`, baseColor: grounded ? '#22c55e' : '#3b82f6', metallic: 0.22, roughness: grounded ? 0.52 : 0.3 };
}

function fixtureNode(body: RuntimeSpatialBody, fixture: SpatialFixtureSpec, index: number): VSRSpatialNode {
  const position = fixture.localPosition ?? { x: 0, y: 0, z: 0 };
  const base = {
    id: `node:${body.id}:${fixture.id}`,
    parentId: `body:${body.id}`,
    materialId: `material:${body.id}`,
    transform: { translation: [position.x / POSITION_SCALE, position.y / POSITION_SCALE, position.z / POSITION_SCALE] as [number, number, number] },
    castShadow: true,
    receiveShadow: true,
    tags: ['rsr-body-fixture', fixture.bodyZone ?? 'body', ...(fixture.tags ?? [])]
  };
  if (fixture.shape.type === 'sphere') return { ...base, meshId: 'mesh:unit-sphere', transform: { ...base.transform, scale: [fixture.shape.radius * 2 / POSITION_SCALE, fixture.shape.radius * 2 / POSITION_SCALE, fixture.shape.radius * 2 / POSITION_SCALE] } };
  if (fixture.shape.type === 'capsule') return { ...base, meshId: 'mesh:unit-sphere', transform: { ...base.transform, scale: [fixture.shape.radius * 2 / POSITION_SCALE, (fixture.shape.halfHeight + fixture.shape.radius) * 2 / POSITION_SCALE, fixture.shape.radius * 2 / POSITION_SCALE] } };
  return { ...base, meshId: 'mesh:unit-cube', transform: { ...base.transform, scale: [fixture.shape.halfExtents.x * 2 / POSITION_SCALE, fixture.shape.halfExtents.y * 2 / POSITION_SCALE, fixture.shape.halfExtents.z * 2 / POSITION_SCALE] }, tags: [...base.tags, `fixture-index:${index}`] };
}

export function spatialEmbodimentSnapshotToVSRScene(snapshot: SpatialEmbodimentSnapshot, options: SpatialEmbodimentProjectionOptions = {}): VSRSpatialScene3D {
  const meshes: VSRSpatialMesh[] = [createCubeMesh('mesh:unit-cube', 1), createUVSphereMesh('mesh:unit-sphere', 0.5, 20, 12), createPlaneMesh('mesh:ground', 30, 30)];
  const materials: VSRSpatialMaterial[] = [
    { id: 'material:ground', baseColor: '#1e293b', metallic: 0.02, roughness: 0.92, doubleSided: true },
    { id: 'material:contact', baseColor: '#f43f5e', emissive: '#fb7185', emissiveStrength: 0.8, roughness: 0.25 },
    { id: 'material:audio', baseColor: '#22d3ee', emissive: '#67e8f9', emissiveStrength: 0.7, roughness: 0.2 },
    { id: 'material:haptic', baseColor: '#a78bfa', emissive: '#c4b5fd', emissiveStrength: 0.65, roughness: 0.25 },
    ...snapshot.bodies.map(materialFor)
  ];
  const nodes: VSRSpatialNode[] = [{ id: 'ground', meshId: 'mesh:ground', materialId: 'material:ground', transform: { translation: [0, snapshot.floorY / POSITION_SCALE, 0] }, castShadow: false, receiveShadow: true }];
  for (const body of snapshot.bodies) {
    nodes.push({ id: `body:${body.id}`, transform: { translation: [body.position.x / POSITION_SCALE, body.position.y / POSITION_SCALE, body.position.z / POSITION_SCALE], rotationEulerDeg: [body.rotationDeg.x / ROTATION_SCALE, body.rotationDeg.y / ROTATION_SCALE, body.rotationDeg.z / ROTATION_SCALE] }, tags: ['rsr-body', body.kind, body.grounded ? 'grounded' : 'airborne'] });
    body.fixtures.forEach((fixture, index) => nodes.push(fixtureNode(body, fixture, index)));
  }
  if (options.includeContacts ?? true) for (const [index, contact] of snapshot.contacts.entries()) nodes.push({ id: `contact:${index}`, meshId: 'mesh:unit-sphere', materialId: 'material:contact', transform: { translation: [contact.point.x / POSITION_SCALE, contact.point.y / POSITION_SCALE, contact.point.z / POSITION_SCALE], scale: [0.1, 0.1, 0.1] }, castShadow: false, tags: ['contact', contact.sensor ? 'sensor' : 'solid'] });
  if (options.includeSensoryEvents ?? true) {
    const sensory = snapshot.events.filter(e => e.kind === 'spatial-audio' || e.kind === 'haptic').slice(-24);
    sensory.forEach((event, index) => {
      const position = event.kind === 'spatial-audio' ? event.position : snapshot.bodies.find(body => body.id === event.bodyId)?.position ?? { x: 0, y: 0, z: 0 };
      nodes.push({ id: `sensory:${index}:${event.id}`, meshId: 'mesh:unit-sphere', materialId: event.kind === 'spatial-audio' ? 'material:audio' : 'material:haptic', transform: { translation: [position.x / POSITION_SCALE, position.y / POSITION_SCALE + 0.2, position.z / POSITION_SCALE], scale: [0.07, 0.07, 0.07] }, castShadow: false, tags: ['sensory', event.kind] });
    });
  }
  const scene: VSRSpatialScene3D = {
    format: VSR_SPATIAL_SCENE_FORMAT,
    sceneId: `rsr-spatial:${snapshot.worldId}:${snapshot.tick}`,
    title: `RSR v0.5 三维具身现实 · ${snapshot.worldId}`,
    background: '#07111f',
    activeCameraId: 'camera:observer',
    meshes,
    materials,
    nodes,
    cameras: [{ id: 'camera:observer', projection: 'perspective', fovYDeg: 52, near: 0.05, far: 200, transform: { translation: options.cameraPosition ?? [7, 5, 9], rotationEulerDeg: options.cameraRotationDeg ?? [-18, 38, 0] } }],
    lights: [
      { id: 'light:ambient', kind: 'ambient', color: '#94a3b8', intensity: 0.18 },
      { id: 'light:sun', kind: 'directional', color: '#fff4db', intensity: 2.2, direction: [-0.5, -1, -0.35], castShadow: true },
      { id: 'light:fill', kind: 'point', color: '#60a5fa', intensity: 5, position: [-3, 4, 4], range: 12 }
    ],
    reality: { worldId: snapshot.worldId, generation: snapshot.reality.generation, realityRoot: snapshot.reality.realityRoot ?? snapshot.stateRoot, evidenceRoot: snapshot.stateRoot }
  };
  return scene;
}

export function projectSpatialEmbodiment(snapshot: SpatialEmbodimentSnapshot, options: SpatialEmbodimentProjectionOptions = {}): SpatialEmbodimentProjectionResult {
  const scene = spatialEmbodimentSnapshotToVSRScene(snapshot, options);
  const rendered = renderSpatialReference(scene, { width: options.width ?? 960, height: options.height ?? 540, qualityTier: options.qualityTier ?? 'balanced', enableShadows: true });
  const verification = verifySpatialFrame(rendered.framePlan);
  const base = { format: 'rsr.spatial-embodiment-vsr-projection.v0.5' as const, sourceStateRoot: snapshot.stateRoot, sourceRealityRoot: snapshot.reality.realityRoot, sceneRoot: semanticHash(scene), frameRoot: rendered.framePlan.frameRoot, pixelRoot: rendered.pixelRoot };
  return { format: base.format, sourceStateRoot: snapshot.stateRoot, sourceRealityRoot: snapshot.reality.realityRoot, scene, framePlan: rendered.framePlan, frameVerified: verification.ok, png: rendered.png, pixelRoot: rendered.pixelRoot, projectionRoot: semanticHash(base) };
}
