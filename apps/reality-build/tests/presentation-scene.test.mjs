import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpatialShowcaseScene,verifySpatialFrame} from '../../../packages/world/visual-state-runtime/dist/packages/spatial-reality-3d/src/index.js';
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
