import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem,poseForFrame} from '../src/anatomy.mjs';
import {skinCanonicalSurfaceMesh,validateSkinnedSurfaceMesh} from '../src/surface-skinning.mjs';

function skin(system,pose){
  const asset=system.canonical_morphology_asset;
  return skinCanonicalSurfaceMesh(asset.canonical_surface_mesh,{bind_transforms:asset.continuous_morphology_field.bone_transforms,posed_skeleton:pose.posed_skeleton,pose_root:pose.pose_root});
}

test('surface skinning preserves canonical topology and bone weight invariants',()=>{
  const system=createAnatomySystem(),pose=poseForFrame(system,{view:'front',pose:'neutral',frame:0,totalFrames:120}),mesh=skin(system,pose),rest=system.canonical_morphology_asset.canonical_surface_mesh,report=validateSkinnedSurfaceMesh(mesh,rest);
  assert.equal(report.valid,true,report.errors.join(','));
  assert.ok(mesh.posed_mesh_root);
  assert.deepEqual(mesh.triangles,rest.triangles);
  assert.equal(mesh.vertices.length,rest.vertices.length);
  assert.equal(mesh.normals.length,rest.normals.length);
});

test('pose changes bone transforms and moves the posed surface without changing dimensions',()=>{
  const system=createAnatomySystem(),neutral=skin(system,poseForFrame(system,{view:'front',pose:'neutral',frame:0,totalFrames:120})),action=skin(system,poseForFrame(system,{view:'front',pose:'action',frame:72,totalFrames:120}));
  const moved=neutral.vertices.some((point,index)=>Math.hypot(point[0]-action.vertices[index][0],point[1]-action.vertices[index][1],point[2]-action.vertices[index][2])>.0001);
  assert.equal(moved,true);
  assert.deepEqual(neutral.triangles,action.triangles);
  assert.deepEqual(neutral.region_ids,action.region_ids);
});
