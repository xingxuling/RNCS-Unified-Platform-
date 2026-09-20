import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCanonicalHumanSkeleton,createPoseState,forwardKinematics,
  qFromAxisAngle,rad,inspectJointLimits,enforceJointLimits,
  solveFullBodyIK,extractRootMotion,sampleRootMotion,
  buildFootPlantTrack,solveFootPlantFrame,
  importMediaPipePoseSequence,parseBvh,
  buildRigBinding,toVsrSkinnedMeshFrameV3,toWorldBodyIRV3,
  createHumanRuntimeV3,evaluatePoseV2
} from '../src/unified-index.mjs';

test('v0.3 joint swing/twist limits fail closed and clamp an extreme shoulder rotation',()=>{
  const s=createCanonicalHumanSkeleton(),state=createPoseState(s);
  state.localRotations.shoulderR=qFromAxisAngle([0,0,1],rad(175));
  const before=inspectJointLimits(s,state);assert.equal(before.ok,false);
  const fixed=enforceJointLimits(s,state);assert.equal(fixed.changed,true);
  const after=inspectJointLimits(s,fixed.state);assert.equal(after.ok,true);
});

test('v0.3 full-body solver coordinates both feet and both hands',()=>{
  const s=createCanonicalHumanSkeleton(),state=createPoseState(s);
  const targets={legL:[-0.16,0.10,0.16],legR:[0.16,0.10,-0.08],armL:[-0.42,1.20,0.18],armR:[0.42,1.20,0.18]};
  const r=solveFullBodyIK(s,state,targets,{iterations:8,tolerance:0.015,rootGain:0.15,jointLimits:false});
  assert.ok(r.maxResidual<0.02,JSON.stringify(r.evidence.at(-1)));
});

test('v0.3 root motion extraction separates trajectory from in-place clip',()=>{
  const s=createCanonicalHumanSkeleton();
  const clip={id:'walk',duration:1,keyframes:[
    {t:0,pose:createPoseState(s,{rootPosition:[0,0.99,0]})},
    {t:1,pose:createPoseState(s,{rootPosition:[0.4,0.99,0.8]})}
  ]};
  const r=extractRootMotion(s,clip);assert.deepEqual(r.trajectory[0].position,[0,0,0]);
  assert.ok(Math.abs(r.trajectory[1].position[0]-0.4)<1e-9);assert.ok(Math.abs(r.clip.keyframes[1].pose.rootPosition[0])<1e-9);
  const mid=sampleRootMotion(r,0.5);assert.ok(Math.abs(mid.position[2]-0.4)<1e-9);
});

test('v0.3 foot plant locks a declared ankle contact while root drifts',()=>{
  const s=createCanonicalHumanSkeleton(),a=createPoseState(s),b=createPoseState(s,{rootPosition:[0.08,0.99,0.10]});
  const frames=[{t:0,pose:a},{t:0.1,pose:b}],track=buildFootPlantTrack(s,frames,{heightThreshold:0.2,speedThreshold:10});
  assert.equal(track[0].contacts.left,true); assert.ok(track[0].locks.left);
  const r=solveFootPlantFrame(s,b,{contacts:{left:true,right:false},locks:{left:track[0].locks.left,right:null}},{tolerance:0.02,rootCompensation:0.5,limitJoints:false});
  assert.ok(r.residuals.left<0.03,JSON.stringify(r.residuals));
});

function mpFrame(dx=0){
  const a=Array.from({length:33},()=>({x:0,y:0,z:0,visibility:1}));
  const set=(i,x,y,z=0)=>a[i]={x:x+dx,y,z,visibility:1};
  set(0,0,0.08);set(11,-0.16,0.28);set(12,0.16,0.28);set(13,-0.29,0.48);set(14,0.29,0.48);set(15,-0.34,0.68);set(16,0.34,0.68);
  set(23,-0.09,0.55);set(24,0.09,0.55);set(25,-0.10,0.77);set(26,0.10,0.77);set(27,-0.10,0.98);set(28,0.10,0.98);set(29,-0.10,1.0);set(30,0.10,1.0);set(31,-0.10,1.01,0.08);set(32,0.10,1.01,0.08);return a;
}

test('v0.3 MediaPipe landmark sequence imports into RNCS pose clip',()=>{
  const r=importMediaPipePoseSequence([mpFrame(0),mpFrame(0.01)],{fps:30});
  assert.equal(r.format,'rncs.mocap.mediapipe.v0.3');assert.equal(r.clip.keyframes.length,2);assert.ok(r.clip.keyframes[0].pose.localRotations.shoulderL);
});

test('v0.3 minimal BVH parser preserves hierarchy, channels and frame data',()=>{
  const text=`HIERARCHY
ROOT Hips
{
OFFSET 0 0 0
CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation
JOINT Chest
{
OFFSET 0 10 0
CHANNELS 3 Zrotation Xrotation Yrotation
End Site
{
OFFSET 0 10 0
}
}
}
MOTION
Frames: 2
Frame Time: 0.0333333
0 0 0 0 0 0 0 0 0
1 0 0 5 0 0 0 0 0`;
  const r=parseBvh(text);assert.equal(r.frameCount,2);assert.equal(r.joints.length,2);assert.equal(r.frames[1][0],1);
});

test('v0.3 VSR skinned frame and World Body IR emit native RNCS surfaces',()=>{
  const s=createCanonicalHumanSkeleton(),state=createPoseState(s),fk=forwardKinematics(s,state);
  const names=['Hips','Spine','Spine2','Neck','Head','LeftShoulder','LeftForeArm','LeftHand','RightShoulder','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase'].map(name=>({name:`mixamorig:${name}`}));
  const binding=buildRigBinding({nodes:names}); const frame=toVsrSkinnedMeshFrameV3({binding,state,fk,meshId:'avatar'});assert.equal(frame.extension,'her.skinned-mesh-frame.v0.3');assert.ok(frame.evidence.palette_count>=15);
  const evaluation=evaluatePoseV2({skeleton:s,state,fk});const body=toWorldBodyIRV3({skeleton:s,state,fk,evaluation});assert.equal(body.format,'rncs.world-body-ir.human.v0.3');assert.equal(body.joints.length,19);
});

test('v0.3 runtime exposes whole-body, mocap, foot-plant and world-body surfaces',()=>{
  const r=createHumanRuntimeV3();assert.equal(r.protocol,'rncs.human-embodiment.v0.3');assert.equal(typeof r.solveFullBody,'function');assert.equal(typeof r.mocap.mediaPipeSequence,'function');assert.equal(typeof r.footPlant.solve,'function');assert.equal(typeof r.worldBodyIR,'function');
});
