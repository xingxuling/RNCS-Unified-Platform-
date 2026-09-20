import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCanonicalHumanSkeleton,createPoseState,forwardKinematics,
  solveLimbIK,solveMultiTargetIK,retargetPoseState,
  qFromAxisAngle,rad,
  inferGltfJointMap,buildRigBinding,poseToGltfNodeTransforms,buildSkinPalette,
  evaluatePoseV2,toRsrSpatialEmbodimentV2,toVsrDebugVisualV2,
  controlToPoseState,defaultControl
} from '../src/unified-index.mjs';

test('v0.2 canonical skeleton is internally height-consistent and FK deterministic',()=>{
  const s=createCanonicalHumanSkeleton(),state=createPoseState(s),a=forwardKinematics(s,state),b=forwardKinematics(s,state);
  assert.deepEqual(a.world,b.world);assert.ok(Math.abs(a.world.footL.position[1])<1e-9);assert.ok(Math.abs(a.world.head.position[1]-1.74)<1e-9);
});
test('quaternion local rotation propagates through FK',()=>{
  const s=createCanonicalHumanSkeleton(),state=createPoseState(s);state.localRotations.shoulderR=qFromAxisAngle([0,0,1],rad(90));const fk=forwardKinematics(s,state);assert.ok(fk.world.elbowR.position[1] > fk.world.shoulderR.position[1] + 0.25);
});
test('analytic two-bone IK reaches a reachable hand target',()=>{
  const s=createCanonicalHumanSkeleton(),state=createPoseState(s),target=[0.34,1.20,0.30];const r=solveLimbIK(s,state,'armR',target,{tolerance:1e-3});assert.ok(r.residual < 1e-3,`residual=${r.residual}`);
});
test('multi-target IK can place both ankles',()=>{
  const s=createCanonicalHumanSkeleton(),state=createPoseState(s),targets={legL:[-0.16,0.15,0.12],legR:[0.15,0.15,-0.08]};const r=solveMultiTargetIK(s,state,targets,{iterations:3,tolerance:0.004});assert.ok(r.evidence.every(e=>e.residual<0.004),JSON.stringify(r.evidence));
});
test('retarget preserves foot placements approximately across body proportions',()=>{
  const s=createCanonicalHumanSkeleton(),state=createPoseState(s);const moved=solveMultiTargetIK(s,state,{legL:[-0.18,0.10,0.22],legR:[0.16,0.10,-0.12]},{iterations:3,tolerance:0.004}).state;const r=retargetPoseState(s,moved,{height:1.86,pelvisHeight:1.05,thigh:0.49,shin:0.45},{footLock:true,tolerance:0.01});assert.ok(r.evidence.every(e=>e.residual<0.01),JSON.stringify(r.evidence));
});
test('gltf joint inference recognizes common Mixamo names and emits skin palette',()=>{
  const nodes=['Hips','Spine','Spine2','Neck','Head','LeftShoulder','LeftForeArm','LeftHand','RightShoulder','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase'].map(name=>({name:`mixamorig:${name}`}));const map=inferGltfJointMap(nodes);assert.equal(map.pelvis,0);assert.ok(map.ankleL!==undefined);const s=createCanonicalHumanSkeleton(),state=createPoseState(s),fk=forwardKinematics(s,state),binding=buildRigBinding({nodes,jointMap:map});const patch=poseToGltfNodeTransforms(binding,state),palette=buildSkinPalette(binding,fk);assert.ok(Object.keys(patch).length>=15);assert.ok(Object.keys(palette).length>=15);
});
test('v0.2 pose can feed RNCS RSR and VSR surfaces',()=>{
  const s=createCanonicalHumanSkeleton(),state=createPoseState(s),fk=forwardKinematics(s,state),evaluation=evaluatePoseV2({skeleton:s,state,fk,final:false});const rsr=toRsrSpatialEmbodimentV2({skeleton:s,fk,evaluation}),vsr=toVsrDebugVisualV2({skeleton:s,fk,evaluation});assert.equal(rsr.protocol,'rsr.spatial-embodiment.v0.6');assert.equal(vsr.protocol,'vsr.spatial-reality-3d.v0.7');assert.ok(rsr.bodies.length>=18);assert.ok(vsr.primitives.bones.length>=18);
});
test('legacy WanFeng control can lower into quaternion pose state',()=>{
  const c=defaultControl();const r=controlToPoseState(c);assert.equal(r.skeleton.id,'rncs.canonical-human.v0.2');assert.ok(r.fk.world.wristL.position.length===3);
});
