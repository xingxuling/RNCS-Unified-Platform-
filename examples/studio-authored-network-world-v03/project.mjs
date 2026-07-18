import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  UnifiedManufacturingSession,
  createUnifiedProject,
} from '../../apps/reality-studio/src/scene-studio.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const behaviorFile = path.resolve(here, '../../apps/reality-studio/examples/冰境试炼.behavior.json');
const FIXED_TIME = '2026-07-18T00:00:00.000Z';

export function createMinimalNetworkGlb() {
  const binary = Buffer.alloc(44);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) => binary.writeFloatLE(value, index * 4));
  [0, 1, 2].forEach((value, index) => binary.writeUInt16LE(value, 36 + index * 2));
  const gltf = {
    asset: { version: '2.0', generator: 'TaoWind Studio Network Fixture' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'Sovereign Player Mesh', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.16, 0.72, 1, 1], metallicFactor: 0.15, roughnessFactor: 0.45 } }],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36, target: 34962 },
      { buffer: 0, byteOffset: 36, byteLength: 6, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1, -1, 0], max: [1, 1, 0] },
      { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR', min: [0], max: [2] },
    ],
  };
  const json = Buffer.from(JSON.stringify(gltf), 'utf8');
  const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  const totalLength = 12 + 8 + paddedJson.length + 8 + binary.length;
  const output = Buffer.alloc(totalLength);
  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(totalLength, 8);
  output.writeUInt32LE(paddedJson.length, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  paddedJson.copy(output, 20);
  const binaryHeader = 20 + paddedJson.length;
  output.writeUInt32LE(binary.length, binaryHeader);
  output.writeUInt32LE(0x004e4942, binaryHeader + 4);
  binary.copy(output, binaryHeader + 8);
  return output;
}

export function createStudioNetworkWorld({ transport = {} } = {}) {
  const program = JSON.parse(fs.readFileSync(behaviorFile, 'utf8'));
  const project = createUnifiedProject({
    title: 'Studio Authored Sovereign Network World',
    program,
    projectId: 'unified-project:studio-authored-network-v03',
    createdAt: FIXED_TIME,
  });
  const session = new UnifiedManufacturingSession(project, {
    sessionId: 'studio:network-fixture',
    clock: () => FIXED_TIME,
  });
  const glb = createMinimalNetworkGlb();
  const assetId = 'asset:studio-network-player';
  session.importEmbeddedAsset({
    name: 'studio-network-player.glb',
    mime: 'model/gltf-binary',
    dataBase64: glb.toString('base64'),
  }, { assetId, importedAt: FIXED_TIME });

  const players = [
    { color: 'blue', x: -2500, z: -1200 },
    { color: 'red', x: 2500, z: 1200 },
  ];
  const slots = [];
  const nodeIds = {};
  for (const player of players) {
    const bodyId = `studio-player-${player.color}`;
    const characterId = `studio-character:${player.color}`;
    session.addAssetNode({
      assetId,
      x: player.x / 10,
      y: player.z / 10,
      name: `Network Player ${player.color}`,
      bindEntity: false,
      nodeId: `node:studio-player-${player.color}`,
    });
    const nodeId = session.project.editor.selected_node_id;
    session.spatialAddBody({
      id: bodyId,
      name: `Network Player ${player.color}`,
      kind: 'dynamic',
      shape: 'capsule',
      position: { x: player.x, y: 1100, z: player.z },
      radius: 350,
      halfHeight: 700,
      tags: ['player', player.color, 'studio-authored'],
    });
    session.spatialPatchBody(bodyId, { fixedRotation: true });
    session.spatialUpsertCharacter({
      id: characterId,
      bodyId,
      walkSpeed: 6000,
      acceleration: 32000,
      jumpSpeed: 6500,
    });
    const node = session.project.scenes[0].nodes.find(item => item.node_id === nodeId);
    session.patchNode(nodeId, {
      components: {
        ...node.components,
        spatial_body_id: bodyId,
        spatial_character_id: characterId,
        spatial_scale_milli: 700,
      },
    });
    nodeIds[player.color] = nodeId;
    slots.push({
      slotId: `slot:${player.color}`,
      subjectId: `subject:${player.color}`,
      playerId: player.color,
      characterId,
      bodyId,
      sceneNodeId: nodeId,
      actions: ['move', 'jump', 'impulse'],
    });
  }
  session.networkConfigure({
    playerSlots: slots,
    transport: {
      seed: 37,
      fixedLatencyTicks: 0,
      jitterTicks: 0,
      lossRatePpm: 0,
      duplicateRatePpm: 0,
      reorderRatePpm: 0,
      ...transport,
    },
  });
  return {
    session,
    compilation: session.networkCompile(),
    glb,
    assetId,
    nodeIds,
    slotIds: slots.map(slot => slot.slotId),
  };
}
