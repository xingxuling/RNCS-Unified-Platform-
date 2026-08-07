import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem,poseForFrame} from '../src/anatomy.mjs';
import {skinCanonicalSurfaceMesh} from '../src/surface-skinning.mjs';
import {buildVisibilityBuffers,validateVisibilityBuffers} from '../src/native-visibility.mjs';

function frame(view='three-quarter-right'){
  const system=createAnatomySystem(),pose=poseForFrame(system,{view,pose:'neutral',frame:0,totalFrames:120}),asset=system.canonical_morphology_asset,mesh=skinCanonicalSurfaceMesh(asset.canonical_surface_mesh,{bind_transforms:asset.continuous_morphology_field.bone_transforms,posed_skeleton:pose.posed_skeleton,pose_root:pose.pose_root}),visibility=buildVisibilityBuffers({mesh,attachments:asset.surface_attachments,posed_skeleton:pose.posed_skeleton,camera:{width:160,height:90,yaw:pose.view_yaw,pitch:0,scale:1}});return{system,pose,asset,mesh,visibility};
}

test('native visibility kernel produces depth, surface, region, normal, and visibility buffers',()=>{
  const result=frame(),report=validateVisibilityBuffers(result.visibility);
  assert.equal(report.valid,true,report.errors.join(','));
  assert.ok(result.visibility.report.visible_pixel_count>0);
  assert.ok(result.visibility.report.rasterized_triangle_count>0);
  assert.ok(result.visibility.report.feature_samples.length>=10);
  assert.equal(typeof result.visibility.report.feature_occlusion_correctness,'boolean');
  assert.ok(result.visibility.report.coverage_closure);
  assert.equal(result.visibility.report.coverage_closure.unresolved,0);
  assert.equal(result.visibility.report.silhouette_disconnected_islands,0);
});

test('camera yaw yields measurable eye depth order rather than cosine-only visibility',()=>{
  const result=frame('three-quarter-right'),order=result.visibility.report.eye_depth_order_under_yaw;
  assert.ok(order);
  assert.ok(Math.abs(order.depth_delta)>1e-5,JSON.stringify(order));
});

test('visibility validator rejects empty or truncated buffers',()=>{
  const result=frame(),invalid={...result.visibility,DepthBuffer:new Float32Array(2)};
  const report=validateVisibilityBuffers(invalid);
  assert.equal(report.valid,false);
  assert.ok(report.errors.includes('VISIBILITY_BUFFER_INVALID:DepthBuffer'));
});
