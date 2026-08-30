import assert from 'node:assert/strict';
import test from 'node:test';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LargeWorldRuntime,
  verifyMaterializationBatch,
  verifyStreamResolutionReceipt
} from '@taowind/large-world-runtime';
import {
  calculateMeshNormals,
  compileSpatialFrame,
  renderSpatialReference,
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
    materials.push({id: `material:${chunk.biome}`, baseColor: biomeColors[chunk.biome] ?? '#6b7280', roughness: .88, doubleSided: true});
    nodes.push({id: nodeId, meshId, materialId: `material:${chunk.biome}`, transform: {translation: [chunk.coordinates.x * chunk.extent_mm.x / 1000, 0, chunk.coordinates.z * chunk.extent_mm.z / 1000]}, castShadow: false, receiveShadow: true});
    cells.push({id: cellId, center: [chunk.coordinates.x * chunk.extent_mm.x / 1000 + chunk.extent_mm.x / 2000, 0, chunk.coordinates.z * chunk.extent_mm.z / 1000 + chunk.extent_mm.z / 2000], radius: chunk.extent_mm.x / 1000, nodeIds: [nodeId]});
    assets.push({id: `asset:${chunk.chunk_id}`, uri: `rncs://${chunk.chunk_id}`, sha256: chunk.content_root, byteLength: chunk.memory_bytes, kind: 'mesh', cellIds: [cellId], priority: 1});
  }
  return {
    format: VSR_SPATIAL_SCENE_FORMAT,
    sceneId: 'large-world-region-v01',
    background: '#07111e',
    activeCameraId: 'camera:world',
    meshes,
    materials: [...new Map(materials.map(material => [material.id, material])).values()],
    nodes,
    streaming: {worldId: region.world_id, cells},
    cameras: [{id: 'camera:world', projection: 'perspective', fovYDeg: 55, near: .1, far: 2000, transform: {translation: [0, 140, 640], rotationEulerDeg: [-18, 0, 0]}}],
    lights: [{id: 'ambient', kind: 'ambient', color: '#b8d4ff', intensity: .28}, {id: 'sun', kind: 'directional', color: '#fff0ce', intensity: 1.8, direction: [-.45, -1, -.35], castShadow: false}],
    reality: {worldId: region.world_id, generation: region.generation, realityRoot: region.world_root, evidenceRoot: materializationRoot},
    assets
  };
}

test('generates a 9x9 RNCS region, materializes the active 3D working set, and renders it through VSR CPU reference', async () => {
  const runtime = new LargeWorldRuntime({
    worldId: 'world:large-integration',
    seed: 'seed:large-integration',
    loadRadius: 1,
    unloadRadius: 2,
    maxActiveChunks: 9,
    materializeChunk: async ({chunk}) => ({status: 'EXECUTED', runtime: 'large-world-procedural-grid-reference', output_root: chunk.content_root, evidence_root: rootHash({chunk_root: chunk.chunk_root, renderer: 'vsr-cpu-reference'})})
  });
  const truth = runtime.recordWorldEvent({
    authorityReceipt: {status: 'committed', receipt_root: 'a'.repeat(64), decision_root: null, epoch: 0},
    mutation: {operations: [{op: 'set', path: 'weather', value: 'clear'}]},
    fact: {claim: {region_ready: true}, authority_domain: 'world.region', confidence: 'canonical'}
  });
  assert.equal(runtime.verify().world_truth.event_log.valid, true);
  assert.equal(runtime.verify().world_truth.fact_tree.valid, true);
  assert.equal(truth.event.world_time.simulation_tick, 1);
  const stream = runtime.observe({x: 0, z: 0});
  assert.equal(stream.active_chunk_ids.length, 9);
  assert.equal(verifyStreamResolutionReceipt(stream).valid, true);
  const batch = await runtime.materializeActive();
  assert.equal(batch.status, 'EXECUTED');
  assert.equal(batch.receipts.length, 9);
  assert.equal(verifyMaterializationBatch(batch).valid, true);

  const region = runtime.getRegion();
  const active = runtime.listActiveChunks();
  const scene = sceneFromChunks(region, active, batch.materialization_root);
  const assetStreaming = resolveSpatialAssetStreaming(scene.assets, {
    activeCellIds: scene.streaming.cells.map(cell => cell.id),
    requestedAssetIds: scene.assets.map(asset => asset.id),
    maxAssets: 9,
    maxBytes: scene.assets.reduce((sum, asset) => sum + asset.byteLength, 0)
  });
  const options = {width: 256, height: 144, enableShadows: false, assetStreaming, streaming: {loadRadius: 0, unloadRadius: 0, forcedCellIds: scene.streaming.cells.map(cell => cell.id)}};
  const frame = compileSpatialFrame(scene, options);
  assert.equal(frame.stats.nodeCount, 9);
  assert.equal(frame.stats.activeCells, 9);
  assert.equal(frame.assetStreaming?.root, assetStreaming.root);
  assert.equal(verifySpatialFrame(frame).ok, true);
  const rendered = renderSpatialReference(scene, options);
  const repeated = renderSpatialReference(scene, options);
  assert.equal(rendered.pixelRoot, repeated.pixelRoot);
  assert.equal(rendered.framePlan.sourceRealityRoot, frame.sourceRealityRoot);
  assert.match(rendered.pixelRoot, /^[a-f0-9]{64}$/);
});
