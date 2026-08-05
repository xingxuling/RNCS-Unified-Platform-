import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateAssetWorkspace, verifySeal, verifyWorkspace } from '../packages/world/reality-asset-genesis-fabric/src/index.mjs';
import { compileRagfSpatialAsset, compileSpatialFrame, verifySpatialFrame } from '../packages/world/visual-state-runtime/dist/packages/spatial-reality-3d/src/index.js';
import { materializeRagfEmbodimentProfile, SpatialEmbodimentWorld, verifyRagfEmbodimentMaterialization } from '../packages/world/reality-simulation-runtime/dist/packages/spatial-embodiment/src/index.js';

test('RAGF selected candidate binds to current VSR and RSR runtimes', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rncs-ragf-world-'));
  const workspace = generateAssetWorkspace({
    description: 'Create a 3D ice swordswoman for a streamed embodied world.',
    subject_id: 'subject:integration',
    asset_kind: 'character-3d',
    target_platforms: ['desktop', 'web', 'xr'],
    constraints: { max_triangles: 2400, pbr_texture_size: 128, max_bones: 64 }
  }, { outDir });
  assert.equal(verifyWorkspace(workspace, { baseDir: outDir, verifyFiles: true }).valid, true);
  const selected = workspace.candidates.find(candidate => candidate.candidate_id === workspace.recommended_candidate_id);
  assert.ok(selected);
  const vsrAdapter = selected.artifacts['vsr-spatial-asset'].data;
  const rsrProfile = selected.artifacts['rsr-embodiment-profile'].data;
  assert.equal(verifySeal(vsrAdapter, 'adapter_root'), true);
  assert.equal(verifySeal(rsrProfile, 'profile_root'), true);
  assert.equal(vsrAdapter.asset_id, workspace.genome.identity.asset_id);
  assert.equal(rsrProfile.asset_id, workspace.genome.identity.asset_id);

  const compiled = compileRagfSpatialAsset(vsrAdapter, {
    worldId: 'world:ragf-integration',
    generation: 1,
    realityRoot: workspace.workspace_root,
    evidenceRoot: workspace.continuity_bundle.bundle_root,
    cell: { id: 'cell:asset', center: [0, 0, 0], radius: 4 }
  });
  const frame = compileSpatialFrame(compiled.scene, {
    width: 160,
    height: 90,
    enableShadows: false,
    streaming: { loadRadius: 0, unloadRadius: 0, forcedCellIds: ['cell:asset'] }
  });
  assert.equal(compiled.assetId, workspace.genome.identity.asset_id);
  assert.equal(compiled.adapterRoot, vsrAdapter.adapter_root);
  assert.equal(compiled.lodLevels, 3);
  assert.equal(frame.streaming?.activeCellIds[0], 'cell:asset');
  assert.ok(frame.stats.triangleCount > 0);
  assert.equal(verifySpatialFrame(frame).ok, true);

  const materialization = materializeRagfEmbodimentProfile(rsrProfile, { worldId: 'world:ragf-integration', generation: 1 });
  assert.equal(materialization.source.profileRoot, rsrProfile.profile_root);
  assert.equal(materialization.config.reality?.realityRoot, rsrProfile.profile_root);
  assert.equal(materialization.config.bodies[0]?.fixtures[0]?.shape.type, 'capsule');
  assert.equal(verifyRagfEmbodimentMaterialization(materialization), true);
  const snapshot = new SpatialEmbodimentWorld(materialization.config).run(45, [{ id: 'walk', tick: 1, type: 'move-character', characterId: materialization.characterId, direction: { x: 1_000_000, y: 0, z: 0 } }]);
  assert.equal(snapshot.worldId, 'world:ragf-integration');
  assert.equal(snapshot.reality.realityRoot, rsrProfile.profile_root);
  assert.ok(snapshot.bodies[0].position.x > 0);
});
