import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultControl,buildPose,evaluatePose,evaluateMotion,toRsrSpatialEmbodiment,toVsrDebugVisual} from '../src/unified-index.mjs';

test('canonical guard produces deterministic pose and adapters',()=>{
  const c=defaultControl(),p=buildPose(c),e=evaluatePose({control:c,pose:p,final:true});
  assert.equal(Array.isArray(p.pelvis),true); assert.equal(e.support.polygon.length>=4,true);
  const rsr=toRsrSpatialEmbodiment({pose:p,control:c,evaluation:e}); const vsr=toVsrDebugVisual({pose:p,evaluation:e});
  assert.equal(rsr.protocol,'rsr.spatial-embodiment.v0.6'); assert.equal(vsr.protocol,'vsr.spatial-reality-3d.v0.7');
  assert.equal(rsr.bodies.length>10,true); assert.equal(vsr.primitives.bones.length>10,true);
});
test('crossed legs fail closed',()=>{
  const c=defaultControl(); c.leftFoot=[0.18,0,0.2]; c.rightFoot=[0.10,0,-0.1]; const p=buildPose(c),e=evaluatePose({control:c,pose:p});
  assert.equal(e.checks.find(x=>x.id==='leg-crossing').ok,false); assert.equal(e.ok,false);
});
test('motion evaluation returns per-frame evidence',()=>{
  const a=defaultControl(),b=defaultControl(); b.pelvis=[0.02,.96,.04];
  const motion={id:'test',keyframes:[{t:0,control:a},{t:1,control:b}]}; const r=evaluateMotion(motion,{samples:10});
  assert.equal(r.frames.length,11); assert.equal(typeof r.summary.minSupportMargin,'number');
});
