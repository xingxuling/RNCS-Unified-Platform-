import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpatialShowcaseScene,verifySpatialFrame} from '../../../packages/world/visual-state-runtime/dist/packages/spatial-reality-3d/src/index.js';
import {createSpatialPresentationCandidate} from '../src/presentation-candidate.mjs';
import {compileBoundPresentationScene} from '../src/runtime-evidence.mjs';

test('Reality Build binds external VSR presentation scene to authoritative RSR body',()=>{
  const scene=createSpatialShowcaseScene();
  const node=scene.nodes[0];
  assert.ok(node?.id);
  const project={spatial3d:{
    presentation_scene:scene,
    presentation_source_root:'dwac:test:external-vsr-scene',
    presentation_bindings:[{body_id:'avatar',node_id:node.id,position_scale:1000}],
    editor:{viewport:{width:640,height:360,quality_tier:'quality'}}
  }};
  const snapshot={bodies:[{id:'avatar',position:{x:1500,y:2500,z:-500},rotationDeg:{x:0,y:90000,z:0}}]};
  const result=compileBoundPresentationScene(project,snapshot,null,null);
  assert.equal(result.bound,true);
  assert.equal(result.binding_count,1);
  assert.equal(result.source_root,'dwac:test:external-vsr-scene');
  const bound=result.scene.nodes.find(item=>item.id===node.id);
  assert.deepEqual(bound.transform.translation,[1.5,2.5,-0.5]);
  assert.deepEqual(bound.transform.rotationEulerDeg,[0,90,0]);
  assert.equal(verifySpatialFrame(result.frame_plan).ok,true);
  assert.ok(result.frame_plan.frameRoot);
});

test('Reality Build preserves legacy spatial projection when no presentation scene is bound',()=>{
  const fallbackScene={sceneId:'fallback'};
  const fallbackFrame={frameRoot:'fallback-frame'};
  const result=compileBoundPresentationScene({spatial3d:{}},{bodies:[]},fallbackScene,fallbackFrame);
  assert.equal(result.bound,false);
  assert.equal(result.scene,fallbackScene);
  assert.equal(result.frame_plan,fallbackFrame);
});

test('Reality Build lowers candidate animation on the authoritative spatial tick',()=>{
  const scene=structuredClone(createSpatialShowcaseScene()),node=scene.nodes.find(entry=>entry.meshId);
  assert.ok(node?.id);
  scene.animations=[{id:'candidate:walk',duration:1,channels:[{nodeId:node.id,path:'translation',times:[0,1],values:[[0,0,0],[.5,0,0]]}]}];
  const candidate=createSpatialPresentationCandidate({
    projectRoot:'project-root:animation-candidate',
    scene,
    source:{kind:'vsr-animation-target-lowering',scene_id:scene.sceneId},
    animationPolicy:{clip_id:'candidate:walk',tick_hz:60,speed:1,phase_seconds:0,loop:true},
  });
  const project={spatial3d:{editor:{viewport:{width:640,height:360,quality_tier:'quality'}}}};
  const initial=compileBoundPresentationScene(project,{tick:0,bodies:[]},null,null,candidate);
  const advanced=compileBoundPresentationScene(project,{tick:15,bodies:[]},null,null,candidate);
  assert.equal(initial.bound,true);
  assert.equal(initial.animation_options.animation.timeSeconds,0);
  assert.equal(advanced.animation_options.animation.timeSeconds,.25);
  assert.equal(initial.frame_plan.stats.animationClipCount,1);
  assert.equal(initial.frame_plan.sourceRealityRoot,advanced.frame_plan.sourceRealityRoot);
  assert.notEqual(initial.frame_plan.animationRoot,advanced.frame_plan.animationRoot);
  assert.notEqual(initial.frame_plan.frameRoot,advanced.frame_plan.frameRoot);
  assert.equal(advanced.animation_policy.clip_id,'candidate:walk');
});

test('Reality Build rejects animation policies that cannot be lowered deterministically',()=>{
  const scene=structuredClone(createSpatialShowcaseScene()),node=scene.nodes.find(entry=>entry.meshId);
  assert.ok(node?.id);
  scene.animations=[{id:'candidate:walk',duration:1,channels:[{nodeId:node.id,path:'translation',times:[0,1],values:[[0,0,0],[.5,0,0]]}]}];
  const base={projectRoot:'project-root:animation-negative',scene,source:{kind:'vsr-animation-target-lowering',scene_id:scene.sceneId}};
  assert.throws(()=>createSpatialPresentationCandidate({...base,animationPolicy:{mode:'wall-clock',clip_id:'candidate:walk'}}),error=>error?.code==='REALITY_BUILD_SPATIAL_PRESENTATION_ANIMATION_MODE_UNSUPPORTED');
  assert.throws(()=>createSpatialPresentationCandidate({...base,animationPolicy:{clip_id:'candidate:missing'}}),error=>error?.code==='REALITY_BUILD_SPATIAL_PRESENTATION_ANIMATION_CLIP_MISSING');
});
