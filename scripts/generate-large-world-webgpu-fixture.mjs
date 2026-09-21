import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LargeWorldRuntime,
  verifyMaterializationBatch,
  verifyRuntimeSnapshot,
  verifyStreamResolutionReceipt
} from '@taowind/large-world-runtime';
import {
  calculateMeshNormals,
  compileSpatialFrame,
  resolveSpatialAssetStreaming,
  verifySpatialFrame,
  VSR_SPATIAL_SCENE_FORMAT
} from '@taowind/visual-state-runtime/spatial-reality-3d';

const biomeColors = {
  coast: '#2b8cbe',
  desert: '#d9a441',
  forest: '#2f855a',
  grassland: '#79a83b',
  tundra: '#b9d4e8',
  wetland: '#3f7f73'
};

function sceneFromChunks(region, chunks, materializationRoot) {
  const meshes = [];
  const materials = [];
  const nodes = [];
  const cells = [];
  const assets = [];
  for (const chunk of chunks) {
    const meshId = `mesh:${chunk.chunk_id}`;
    const nodeId = `node:${chunk.chunk_id}`;
    const cellId = `cell:${chunk.chunk_id}`;
    const source = chunk.mesh.positions;
    const scale = chunk.extent_mm.x / 1000 / chunk.sample_resolution;
    const positions = [];
    for (let index = 0; index < source.length; index += 3) {
      positions.push(source[index] * scale, source[index + 1] / 1000, source[index + 2] * scale);
    }
    const meshBase = {id: meshId, positions, indices: [...chunk.mesh.indices], topology: 'triangle-list'};
    const mesh = {...meshBase, normals: calculateMeshNormals(meshBase)};
    meshes.push(mesh);
    materials.push({
      id: `material:${chunk.biome}`,
      baseColor: biomeColors[chunk.biome] ?? '#6b7280',
      roughness: 0.88,
      doubleSided: true
    });
    nodes.push({
      id: nodeId,
      meshId,
      materialId: `material:${chunk.biome}`,
      transform: {
        translation: [
          chunk.coordinates.x * chunk.extent_mm.x / 1000,
          0,
          chunk.coordinates.z * chunk.extent_mm.z / 1000
        ]
      },
      castShadow: false,
      receiveShadow: true
    });
    cells.push({
      id: cellId,
      center: [
        chunk.coordinates.x * chunk.extent_mm.x / 1000 + chunk.extent_mm.x / 2000,
        0,
        chunk.coordinates.z * chunk.extent_mm.z / 1000 + chunk.extent_mm.z / 2000
      ],
      radius: chunk.extent_mm.x / 1000,
      nodeIds: [nodeId]
    });
    assets.push({
      id: `asset:${chunk.chunk_id}`,
      uri: `rncs://${chunk.chunk_id}`,
      sha256: chunk.content_root,
      byteLength: chunk.memory_bytes,
      kind: 'mesh',
      cellIds: [cellId],
      priority: 1
    });
  }
  return {
    format: VSR_SPATIAL_SCENE_FORMAT,
    sceneId: 'large-world-webgpu-v01',
    background: '#07111e',
    activeCameraId: 'camera:world',
    meshes,
    materials: [...new Map(materials.map(material => [material.id, material])).values()],
    nodes,
    streaming: {worldId: region.world_id, cells},
    cameras: [{
      id: 'camera:world',
      projection: 'perspective',
      fovYDeg: 55,
      near: 0.1,
      far: 2000,
      transform: {translation: [0, 140, 640], rotationEulerDeg: [-18, 0, 0]}
    }],
    lights: [
      {id: 'ambient', kind: 'ambient', color: '#b8d4ff', intensity: 0.28},
      {id: 'sun', kind: 'directional', color: '#fff0ce', intensity: 1.8, direction: [-0.45, -1, -0.35], castShadow: false}
    ],
    reality: {
      worldId: region.world_id,
      generation: region.generation,
      realityRoot: region.world_root,
      evidenceRoot: materializationRoot
    },
    assets
  };
}

const outDir = resolve(process.argv[2] ?? 'output/large-world-webgpu');
await mkdir(outDir, {recursive: true});

const runtime = new LargeWorldRuntime({
  worldId: 'world:large-webgpu-integration',
  seed: 'seed:large-webgpu-integration',
  loadRadius: 1,
  unloadRadius: 2,
  maxActiveChunks: 9,
  materializeChunk: async ({chunk}) => ({
    status: 'EXECUTED',
    runtime: 'large-world-procedural-grid-reference',
    output_root: chunk.content_root,
    evidence_root: rootHash({chunk_root: chunk.chunk_root, renderer: 'vsr-spatial-webgpu-candidate'})
  })
});

runtime.recordWorldEvent({
  authorityReceipt: {status: 'committed', receipt_root: 'b'.repeat(64), decision_root: null, epoch: 0},
  mutation: {operations: [{op: 'set', path: 'weather', value: 'clear'}]},
  fact: {claim: {region_ready: true, projection_target: 'webgpu'}, authority_domain: 'world.region', confidence: 'canonical'}
});

const stream = runtime.observe({x: 0, z: 0});
assert.equal(stream.active_chunk_ids.length, 9);
assert.equal(verifyStreamResolutionReceipt(stream).valid, true);
const batch = await runtime.materializeActive();
assert.equal(batch.status, 'EXECUTED');
assert.equal(batch.receipts.length, 9);
assert.equal(verifyMaterializationBatch(batch).valid, true);

const canonicalBeforeProjection = runtime.snapshot();
assert.equal(verifyRuntimeSnapshot(canonicalBeforeProjection).valid, true);
assert.equal(canonicalBeforeProjection.canonical_state_mutated, false);
assert.equal(canonicalBeforeProjection.authority.provider_can_write_authoritative_world_state, false);

const region = runtime.getRegion();
const active = runtime.listActiveChunks();
const scene = sceneFromChunks(region, active, batch.materialization_root);
const assetStreaming = resolveSpatialAssetStreaming(scene.assets, {
  activeCellIds: scene.streaming.cells.map(cell => cell.id),
  requestedAssetIds: scene.assets.map(asset => asset.id),
  maxAssets: 9,
  maxBytes: scene.assets.reduce((sum, asset) => sum + asset.byteLength, 0)
});
const options = {
  width: 320,
  height: 180,
  qualityTier: 'balanced',
  enableShadows: false,
  assetStreaming,
  streaming: {
    loadRadius: 0,
    unloadRadius: 0,
    forcedCellIds: scene.streaming.cells.map(cell => cell.id)
  }
};
const frame = compileSpatialFrame(scene, options);
assert.equal(frame.stats.nodeCount, 9);
assert.equal(frame.stats.activeCells, 9);
assert.equal(frame.assetStreaming?.root, assetStreaming.root);
assert.equal(verifySpatialFrame(frame).ok, true);

const canonicalAfterCompile = runtime.snapshot();
assert.equal(canonicalAfterCompile.snapshot_root, canonicalBeforeProjection.snapshot_root);
assert.equal(canonicalAfterCompile.canonical_state_mutated, false);

const expected = {
  format: 'rncs.large-world-webgpu-fixture.v0.1',
  world_id: region.world_id,
  region_root: region.region_root,
  world_root: region.world_root,
  runtime_snapshot_root: canonicalBeforeProjection.snapshot_root,
  frame_root: frame.frameRoot,
  command_root: frame.commandRoot,
  geometry_root: frame.geometryRoot,
  material_root: frame.materialRoot,
  asset_streaming_root: assetStreaming.root,
  active_chunk_ids: stream.active_chunk_ids,
  materialization_root: batch.materialization_root,
  stats: frame.stats,
  authority: canonicalBeforeProjection.authority,
  canonical_state_mutated: canonicalBeforeProjection.canonical_state_mutated,
  canonical_snapshot_stable_after_compile: canonicalAfterCompile.snapshot_root === canonicalBeforeProjection.snapshot_root
};

await Promise.all([
  writeFile(resolve(outDir, 'scene.vsr3d.json'), `${JSON.stringify(scene, null, 2)}\n`, 'utf8'),
  writeFile(resolve(outDir, 'options.json'), `${JSON.stringify(options, null, 2)}\n`, 'utf8'),
  writeFile(resolve(outDir, 'expected.json'), `${JSON.stringify(expected, null, 2)}\n`, 'utf8')
]);

console.log(JSON.stringify({outDir, expected}, null, 2));
