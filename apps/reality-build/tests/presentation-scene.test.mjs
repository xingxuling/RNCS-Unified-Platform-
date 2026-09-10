import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpatialShowcaseScene,verifySpatialFrame} from '../../../packages/world/visual-state-runtime/dist/packages/spatial-reality-3d/src/index.js';
import {createSpatialPresentationCandidate,createSpatialSequenceFrameProjection,verifySpatialPresentationCandidate,verifySpatialSequenceFrameProjection} from '../src/presentation-candidate.mjs';
import {compileBoundPresentationScene} from '../src/runtime-evidence.mjs';
import {normalizeSequence,evaluateSequence} from '@taowind/reality-studio-native';

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

test('Reality Build lowers VSR animation layers through the same fixed Tick',()=>{
  const scene=structuredClone(createSpatialShowcaseScene()),node=scene.nodes.find(entry=>entry.meshId);
  assert.ok(node?.id);
  scene.animations=[
    {id:'candidate:walk',duration:1,channels:[{nodeId:node.id,path:'translation',times:[0,1],values:[[0,0,0],[.5,0,0]]}]},
    {id:'candidate:offset',duration:1,channels:[{nodeId:node.id,path:'translation',times:[0,1],values:[[0,0,0],[0,0,.5]]}]}
  ];
  const candidate=createSpatialPresentationCandidate({
    projectRoot:'project-root:animation-layers',scene,
    source:{kind:'vsr-animation-layer-lowering',scene_id:scene.sceneId},
    animationPolicy:{selection:'layers',tick_hz:60,speed:1,phase_seconds:0,loop:true,layers:[
      {clip_id:'candidate:walk',weight:.5,mode:'override'},
      {clip_id:'candidate:offset',weight:1,mode:'additive'}
    ]}
  });
  const project={spatial3d:{editor:{viewport:{width:640,height:360,quality_tier:'quality'}}}};
  const initial=compileBoundPresentationScene(project,{tick:0,bodies:[]},null,null,candidate);
  const advanced=compileBoundPresentationScene(project,{tick:15,bodies:[]},null,null,candidate);
  assert.equal(initial.animation_options.animationLayers.length,2);
  assert.equal(initial.animation_options.animationLayers[0].timeSeconds,0);
  assert.equal(advanced.animation_options.animationLayers[0].timeSeconds,.25);
  assert.equal(initial.frame_plan.stats.animationClipCount,2);
  assert.equal(initial.frame_plan.sourceRealityRoot,advanced.frame_plan.sourceRealityRoot);
  assert.notEqual(initial.frame_plan.animationRoot,advanced.frame_plan.animationRoot);
  assert.equal(advanced.animation_policy.selection,'layers');
});

test('Reality Build lowers a VSR animation graph and transition through the same fixed Tick',()=>{
  const scene=structuredClone(createSpatialShowcaseScene()),node=scene.nodes.find(entry=>entry.meshId);
  assert.ok(node?.id);
  scene.animations=[
    {id:'candidate:walk',duration:1,channels:[{nodeId:node.id,path:'translation',times:[0,1],values:[[0,0,0],[.5,0,0]]}]},
    {id:'candidate:run',duration:1,channels:[{nodeId:node.id,path:'translation',times:[0,1],values:[[0,0,0],[1,0,0]]}]}
  ];
  const candidate=createSpatialPresentationCandidate({
    projectRoot:'project-root:animation-graph',scene,
    source:{kind:'vsr-animation-graph-lowering',scene_id:scene.sceneId},
    animationPolicy:{selection:'graph',tick_hz:60,speed:1,phase_seconds:0,loop:true,state_id:'run',graph:{initial_state:'walk',states:[
      {id:'walk',clip_id:'candidate:walk',speed:1},
      {id:'run',clip_id:'candidate:run',speed:1.5}
    ]},transition:{from_state_id:'walk',to_state_id:'run',progress:.25}}
  });
  const project={spatial3d:{editor:{viewport:{width:640,height:360,quality_tier:'quality'}}}};
  const initial=compileBoundPresentationScene(project,{tick:0,bodies:[]},null,null,candidate);
  const advanced=compileBoundPresentationScene(project,{tick:15,bodies:[]},null,null,candidate);
  assert.equal(initial.animation_options.animationGraph.stateId,'run');
  assert.equal(initial.animation_options.animationGraph.transition.progress,.25);
  assert.equal(initial.animation_options.animationGraph.timeSeconds,0);
  assert.equal(advanced.animation_options.animationGraph.timeSeconds,.25);
  assert.equal(initial.frame_plan.stats.animationClipCount,2);
  assert.equal(initial.frame_plan.sourceRealityRoot,advanced.frame_plan.sourceRealityRoot);
  assert.notEqual(initial.frame_plan.animationRoot,advanced.frame_plan.animationRoot);
  assert.equal(advanced.animation_policy.selection,'graph');
});

test('Reality Build rejects malformed VSR layer and graph policies before lowering',()=>{
  const scene=structuredClone(createSpatialShowcaseScene()),node=scene.nodes.find(entry=>entry.meshId);
  assert.ok(node?.id);
  scene.animations=[{id:'candidate:walk',duration:1,channels:[{nodeId:node.id,path:'translation',times:[0,1],values:[[0,0,0],[.5,0,0]]}]}];
  const base={projectRoot:'project-root:animation-structured-negative',scene,source:{kind:'vsr-animation-structured-negative',scene_id:scene.sceneId}};
  assert.throws(()=>createSpatialPresentationCandidate({...base,animationPolicy:{selection:'layers',layers:[{clip_id:'candidate:walk',weight:2}]}}),error=>error?.code==='REALITY_BUILD_SPATIAL_PRESENTATION_ANIMATION_LAYER_WEIGHT_INVALID');
  assert.throws(()=>createSpatialPresentationCandidate({...base,animationPolicy:{selection:'graph',graph:{initial_state:'missing',states:[{id:'walk',clip_id:'candidate:walk'}]}}}),error=>error?.code==='REALITY_BUILD_SPATIAL_PRESENTATION_ANIMATION_GRAPH_INITIAL_STATE_INVALID');
});

test('Reality Build lowers a Studio evaluated Sequence frame through an explicit VSR binding',()=>{
  const scene=structuredClone(createSpatialShowcaseScene()),node=scene.nodes.find(entry=>entry.meshId);
  assert.ok(node?.id);
  scene.animations=[{id:'candidate:walk',duration:1,channels:[{nodeId:node.id,path:'translation',times:[0,1],values:[[0,0,0],[.5,0,0]]}]}];
  const sequence=normalizeSequence({sequence_id:'sequence:build-projection',fps:60,duration:1,tracks:[{track_id:'track:animation',type:'animation',clips:[{clip_id:'candidate:walk',start:0,duration:1,payload:{source:'studio-authored'}}]}]});
  const frame=evaluateSequence(sequence,.25,{previousTime:0});
  const projection=createSpatialSequenceFrameProjection({scene,sequence,frame,animationBindings:[{track_id:'track:animation',clip_id:'candidate:walk',node_ids:[node.id],weight:1,mode:'override',loop:true}]});
  const candidate=createSpatialPresentationCandidate({projectRoot:'project-root:sequence-frame',scene,source:{kind:'studio-sequence-frame-projection',sequence_id:sequence.sequence_id},sequenceFrameProjection:projection});
  const project={spatial3d:{editor:{viewport:{width:640,height:360,quality_tier:'quality'}}}};
  const result=compileBoundPresentationScene(project,{tick:0,bodies:[]},null,null,candidate);
  assert.equal(verifySpatialPresentationCandidate(candidate,{projectRoot:'project-root:sequence-frame'}),true);
  assert.equal(result.sequence_frame_projection.frame.frame_root,frame.frame_root);
  assert.equal(result.animation_options.animationLayers[0].timeSeconds,.25);
  assert.equal(result.animation_options.animationLayers[0].clipId,'candidate:walk');
  assert.equal(result.frame_plan.stats.animationClipCount,1);
  assert.ok(result.frame_plan.sourceRealityRoot);
  assert.ok(result.frame_plan.animationRoot);
  const nonCanonicalProjection={...projection,animation_layers:[{...projection.animation_layers[0],weight:'1'}]};
  assert.equal(verifySpatialSequenceFrameProjection(nonCanonicalProjection,scene),false);
});

test('Reality Build rejects ambiguous Sequence ownership and missing explicit VSR bindings',()=>{
  const scene=structuredClone(createSpatialShowcaseScene()),node=scene.nodes.find(entry=>entry.meshId);
  assert.ok(node?.id);
  scene.animations=[{id:'candidate:walk',duration:1,channels:[{nodeId:node.id,path:'translation',times:[0,1],values:[[0,0,0],[.5,0,0]]}]}];
  const sequence=normalizeSequence({sequence_id:'sequence:negative',fps:60,duration:1,tracks:[{track_id:'track:animation',type:'animation',clips:[{clip_id:'candidate:walk',start:0,duration:1,payload:{}}]}]});
  const frame=evaluateSequence(sequence,.25);
  assert.throws(()=>createSpatialSequenceFrameProjection({scene,sequence,frame}),error=>error?.code==='REALITY_BUILD_SEQUENCE_ANIMATION_BINDING_MISSING');
  const projection=createSpatialSequenceFrameProjection({scene,sequence,frame,animationBindings:[{track_id:'track:animation',clip_id:'candidate:walk',node_ids:[node.id]}]});
  assert.throws(()=>createSpatialPresentationCandidate({projectRoot:'project-root:sequence-conflict',scene,source:{kind:'sequence-conflict'},animationPolicy:{clip_id:'candidate:walk'},sequenceFrameProjection:projection}),error=>error?.code==='REALITY_BUILD_PRESENTATION_ANIMATION_OWNER_CONFLICT');
});

test('Reality Build lowers a Studio camera cut through an explicit VSR camera binding',()=>{
  const scene=structuredClone(createSpatialShowcaseScene());
  scene.cameras.push({id:'camera:alternate',projection:'perspective',fovYDeg:42,near:.1,far:100,transform:{translation:[2,2,4],rotationEulerDeg:[-10,18,0]}});
  const sequence=normalizeSequence({sequence_id:'sequence:camera-projection',fps:60,duration:2,tracks:[{track_id:'track:camera',type:'camera',clips:[{clip_id:'camera:alternate-shot',start:0,duration:2,payload:{kind:'camera-cut',camera_id:'camera:alternate'}}]}]});
  const frame=evaluateSequence(sequence,.25,{previousTime:0});
  const projection=createSpatialSequenceFrameProjection({scene,sequence,frame,cameraBindings:[{track_id:'track:camera',clip_id:'camera:alternate-shot',camera_id:'camera:alternate'}]});
  const candidate=createSpatialPresentationCandidate({projectRoot:'project-root:camera-frame',scene,source:{kind:'studio-sequence-camera-projection',sequence_id:sequence.sequence_id},sequenceFrameProjection:projection});
  const result=compileBoundPresentationScene({spatial3d:{editor:{viewport:{width:640,height:360,quality_tier:'quality'}}}},{tick:0,bodies:[]},null,null,candidate);
  assert.equal(verifySpatialPresentationCandidate(candidate,{projectRoot:'project-root:camera-frame'}),true);
  assert.equal(projection.camera_binding.camera_id,'camera:alternate');
  assert.equal(result.scene.activeCameraId,'camera:alternate');
  assert.equal(result.frame_plan.camera.id,'camera:alternate');
  assert.equal(result.sequence_frame_projection.camera_binding.track_id,'track:camera');
});
