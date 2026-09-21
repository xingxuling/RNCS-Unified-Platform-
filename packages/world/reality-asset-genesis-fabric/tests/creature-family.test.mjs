import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {builtinProviders,generateAssetWorkspace,inspectGlb,verifyWorkspace} from '../src/index.mjs';

function createCreature(outDir){
  return generateAssetWorkspace({
    description:'一只冰属性四足狼兽',
    asset_kind:'creature-3d',
    target_platforms:['desktop','web'],
    seed:'creature-quadruped-family-test',
    constraints:{max_triangles:2400,pbr_texture_size:128}
  },{outDir});
}

test('procedural 3D provider declares the creature profile explicitly',()=>{
  const provider=builtinProviders().find(candidate=>candidate.provider_id==='provider:taowind:procedural-3d');
  assert.ok(provider);
  assert.equal(provider.metadata.quality_profile,'profile-aware-static-humanoid-creature-v0.1');
  assert.ok(provider.metadata.asset_family_profiles.includes('creature-3d'));
  for(const capabilityId of ['asset.generate.mesh-glb','asset.generate.skeleton-rig','asset.generate.animation-clips','asset.generate.retarget-profile']){
    assert.ok(provider.capabilities.find(capability=>capability.capability_id===capabilityId).asset_kinds.includes('creature-3d'),capabilityId);
  }
});

test('creature workspace emits a quadruped GLB and matching runtime contracts',()=>{
  const outDir=fs.mkdtempSync(path.join(os.tmpdir(),'ragf-creature-family-'));
  const workspace=createCreature(outDir);
  const selected=workspace.candidates.find(candidate=>candidate.candidate_id===workspace.recommended_candidate_id);
  const mesh=selected.artifacts['mesh-glb'].metadata;
  const rig=selected.artifacts['skeleton-rig'].data;
  const clips=selected.artifacts['animation-clips'].data;
  const rsr=selected.artifacts['rsr-embodiment-profile'].data;
  const collision=selected.artifacts['collision-shape'].data;
  const prefab=selected.artifacts['prefab-blueprint'].data;
  const projection=selected.artifacts['projection-manifest'].data;
  const glb=inspectGlb(fs.readFileSync(path.join(outDir,'candidates',selected.variant,'mesh','lod0.glb')));
  assert.equal(verifyWorkspace(workspace,{baseDir:outDir,verifyFiles:true}).valid,true);
  assert.equal(workspace.genome.physical.embodiment_profile,'creature-quadruped-v0.1');
  assert.equal(mesh.quality_profile,'creature-quadruped-v0.1-balanced');
  assert.equal(mesh.bone_count,13);
  assert.equal(mesh.animation_count,4);
  assert.equal(glb.skin_count,1);
  assert.equal(glb.animation_count,4);
  assert.equal(glb.node_count,14);
  assert.equal(rig.profile,'creature-quadruped-v0.1');
  assert.deepEqual(rig.bones.slice(0,6).map(bone=>bone.name),['root','pelvis','spine','chest','neck','head']);
  assert.deepEqual(clips.clips.map(clip=>clip.name),['idle','move','attack','hit']);
  assert.ok(clips.clips.find(clip=>clip.name==='move').events.some(event=>event.type==='footstep'));
  assert.equal(rsr.body.kind,'creature');
  assert.equal(rsr.body.shape_spec.type,'box');
  assert.equal(rsr.movement.gait,'quadruped');
  assert.equal(collision.authoring.fit,'creature-quadruped-v0.1');
  for(const axis of [0,1,2]){
    assert.ok(mesh.bounds.min[axis]>=collision.center[axis]-collision.half_extents[axis]-1e-6,`lower bound ${axis}`);
    assert.ok(mesh.bounds.max[axis]<=collision.center[axis]+collision.half_extents[axis]+1e-6,`upper bound ${axis}`);
  }
  assert.ok(prefab.components.some(component=>component.component_id==='animator'));
  assert.equal(prefab.hierarchy.nodes.some(node=>node.node_id==='weapon-anchor'),false);
  assert.ok(projection.projections.some(item=>item.projection_id==='realtime-creature'));
  assert.ok(selected.artifacts['sprite-sheet'].metadata.profile==='creature-quadruped');
});

test('creature family roots are deterministic across output directories',()=>{
  const first=createCreature(fs.mkdtempSync(path.join(os.tmpdir(),'ragf-creature-determinism-a-')));
  const second=createCreature(fs.mkdtempSync(path.join(os.tmpdir(),'ragf-creature-determinism-b-')));
  assert.equal(first.workspace_root,second.workspace_root);
  assert.equal(first.asset_family.family_root,second.asset_family.family_root);
  assert.equal(first.candidates[0].candidate_root,second.candidates[0].candidate_root);
});
