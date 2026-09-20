import test from 'node:test';import assert from 'node:assert/strict';
import {evaluate2DChannel} from '../src/index.mjs';

test('2D channel can drive bone curve into skinned mesh',()=>{const channel={domain:'2d',channel_id:'hero',local_time:.5,progress:.5,spec:{domain:'2d',curves:{'arm.rotation':{keys:[{time:0,value:0},{time:1,value:Math.PI}]}},rig:{id:'r',bones:[{id:'root'},{id:'arm',parentId:'root',bind:{x:1,y:0}}]},mesh:{id:'m',vertices:[{position:[2,0],weights:[{boneId:'arm',weight:1}]}]}}};const r=evaluate2DChannel(channel);assert.ok(r.rigResult);assert.ok(r.rigResult.vertices[0].every(Number.isFinite));assert.match(r.stateRoot,/^[0-9a-f]{64}$/);});

test('2D channel blend-shape path remains candidate-only',()=>{const r=evaluate2DChannel({domain:'2d',channel_id:'face',local_time:0,spec:{domain:'2d',blendShapes:{base:[[0,0],[1,0]],targets:[[[0,.2],[1,.2]]],weights:[.5]}}});assert.deepEqual(r.blendResult,[[0,.1],[1,.1]]);assert.equal(r.candidate_only,true);});
