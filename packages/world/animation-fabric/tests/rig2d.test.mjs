import test from 'node:test';import assert from 'node:assert/strict';
import {createRig2D,evaluateRig2D,skinMesh2D} from '../src/index.mjs';
const rig=createRig2D({id:'person',bones:[{id:'root',bind:{x:0,y:0}},{id:'arm',parentId:'root',bind:{x:1,y:0}}]});
test('2D rig creates deterministic rooted hierarchy',()=>{assert.equal(rig.format,'rncs.animation-rig2d.v0.1');assert.equal(rig.bones.length,2);assert.match(rig.rigRoot,/^[0-9a-f]{64}$/);});
test('2D FK propagates parent transforms',()=>{const e=evaluateRig2D(rig,{root:{x:2,y:3}});assert.equal(Math.round(e.world.arm[4]),3);assert.equal(Math.round(e.world.arm[5]),3);});
test('2D skinning applies weighted bone deformation',()=>{const mesh={id:'m',vertices:[{position:[1,0],weights:[{boneId:'arm',weight:1}]}]};const r=skinMesh2D(rig,mesh,{arm:{rotation:Math.PI/2}});assert.ok(Math.abs(r.vertices[0][0]-1)<1e-9);assert.ok(Math.abs(r.vertices[0][1])<1e-9);});
test('2D rig rejects duplicate bones',()=>assert.throws(()=>createRig2D({bones:[{id:'a'},{id:'a'}]}),/DUPLICATE/));
