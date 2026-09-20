import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProfessionalHumanSkeleton,createProfessionalPoseState,forwardKinematicsProfessional,
  computeLandmarks,centerOfMassProfessional,pelvisFrameFromLandmarks,
  anatomicalToRender,renderToAnatomical,createHumanRuntimeV4
} from '../src/unified-index.mjs';

test('v0.4 professional skeleton exposes dense anatomical hierarchy',()=>{
  const s=createProfessionalHumanSkeleton();
  assert.equal(s.id,'rncs.professional-human.v0.4');
  assert.ok(s.joints.length>=38,s.joints.length);
  for(const n of ['L5','T12','C7','SC_L','AC_L','GH_L','radioulnar_L','hip_L','subtalar_L','MTP1_L']) assert.ok(s.byName[n],n);
});
test('v0.4 anatomical frame uses anterior-superior-right convention and adapters are reversible',()=>{
  const p=[1,2,3];assert.deepEqual(renderToAnatomical(anatomicalToRender(p)),p);
});
test('v0.4 FK, landmarks and pelvis segment frame are finite',()=>{
  const s=createProfessionalHumanSkeleton(),state=createProfessionalPoseState(s),fk=forwardKinematicsProfessional(s,state),lm=computeLandmarks(s,fk);
  for(const n of ['ASIS_L','ASIS_R','PSIS_L','PSIS_R','acromionL','kneeLatL','ankleMedR']) assert.ok(lm[n]?.every(Number.isFinite),n);
  const f=pelvisFrameFromLandmarks(lm);assert.ok(f.axes.x.every(Number.isFinite));assert.ok(f.axes.y.every(Number.isFinite));assert.ok(f.axes.z.every(Number.isFinite));
});
test('v0.4 professional COM is segment based and finite',()=>{
  const s=createProfessionalHumanSkeleton(),state=createProfessionalPoseState(s),fk=forwardKinematicsProfessional(s,state),com=centerOfMassProfessional(s,fk);
  assert.equal(com.length,3);assert.ok(com.every(Number.isFinite));assert.ok(com[1]>0);
});
test('v0.4 runtime exposes anatomical analysis surfaces',()=>{
  const r=createHumanRuntimeV4(),state=r.createPose(),a=r.analyze(state);
  assert.equal(r.protocol,'rncs.human-embodiment.v0.4');assert.ok(a.landmarks.ASIS_L);assert.ok(a.jointCoordinateSystems.hip);assert.ok(a.limits.knee);
});
