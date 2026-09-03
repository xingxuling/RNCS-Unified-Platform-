import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {builtinProviders, generateAssetWorkspace, verifyWorkspace} from '../src/index.mjs';

const STATIC_KINDS = ['prop-3d', 'vehicle-3d', 'structure-3d', 'environment-3d', 'vegetation-3d', 'resource-3d'];

test('procedural 3D provider declares the supported static family boundary', () => {
  const provider = builtinProviders().find(candidate => candidate.provider_id === 'provider:taowind:procedural-3d');
  assert.ok(provider);
  assert.equal(provider.metadata.quality_profile, 'profile-aware-static-and-humanoid-v0.1');
  assert.deepEqual(provider.metadata.asset_family_profiles, ['character-3d', ...STATIC_KINDS]);
  assert.equal(provider.metadata.static_profile, 'family-static-v0.1');
});

test('static 3D family profiles generate bounded archetypes without fake rigging', () => {
  for (const kind of STATIC_KINDS) {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ragf-static-family-'));
    const workspace = generateAssetWorkspace({
      description: `static family fixture ${kind}`,
      asset_kind: kind,
      target_platforms: ['desktop', 'web'],
      seed: `static-family-${kind}`,
      constraints: {max_triangles: 2400, pbr_texture_size: 128}
    }, {outDir});
    const selected = workspace.candidates.find(candidate => candidate.candidate_id === workspace.recommended_candidate_id);
    const mesh = selected.artifacts['mesh-glb'].metadata;
    const rsr = selected.artifacts['rsr-embodiment-profile'].data;
    const collision = selected.artifacts['collision-shape'].data;
    const prefab = selected.artifacts['prefab-blueprint'].data;
    assert.equal(verifyWorkspace(workspace, {baseDir: outDir, verifyFiles: true}).valid, true, kind);
    assert.equal(mesh.asset_kind, kind);
    assert.equal(mesh.rigged, false);
    assert.equal(mesh.bone_count, 0);
    assert.equal(mesh.animation_count, 0);
    assert.deepEqual(selected.artifacts['vsr-spatial-asset'].data.runtime.skin.joints, []);
    assert.equal(rsr.body.runtime_kind, 'static');
    assert.equal(rsr.body.shape_spec.type, 'box');
    assert.deepEqual(rsr.body.center, collision.center);
    assert.deepEqual(rsr.body.halfExtents, collision.half_extents);
    for (const axis of [0, 1, 2]) {
      assert.ok(mesh.bounds.min[axis] >= rsr.body.center[axis] - rsr.body.halfExtents[axis] - 1e-6, `${kind} lower bound axis ${axis}`);
      assert.ok(mesh.bounds.max[axis] <= rsr.body.center[axis] + rsr.body.halfExtents[axis] + 1e-6, `${kind} upper bound axis ${axis}`);
    }
    assert.equal(selected.artifacts['lod-manifest'].data.policy.geometry, 'family-static-progressive-detail');
    assert.equal(prefab.components.some(component => component.component_id === 'animator'), false);
    assert.equal(selected.artifacts['skeleton-rig'], undefined);
    assert.equal(selected.artifacts['animation-clips'], undefined);
    assert.equal(selected.artifacts['retarget-profile'], undefined);
    const lodCounts = workspace.candidates
      .find(candidate => candidate.candidate_id === selected.candidate_id)
      .artifacts['lod-manifest'].data.levels.map(level => level.triangle_count);
    assert.ok(lodCounts[0] > lodCounts[1] && lodCounts[1] > lodCounts[2], `${kind} LOD counts ${lodCounts.join('/')}`);
  }
});

test('static family generation is deterministic across output directories', () => {
  for (const kind of STATIC_KINDS) {
    const input = {description: `deterministic static family ${kind}`, asset_kind: kind, seed: `deterministic-${kind}`};
    const first = generateAssetWorkspace(input, {outDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ragf-static-determinism-a-'))});
    const second = generateAssetWorkspace(input, {outDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ragf-static-determinism-b-'))});
    assert.equal(first.workspace_root, second.workspace_root, kind);
    assert.equal(first.asset_family.family_root, second.asset_family.family_root, kind);
  }
});
