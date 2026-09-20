import test from 'node:test';import assert from 'node:assert/strict';
import {sampleCurve,morphPath,deformByBilinearCage,blendShape2D} from '../src/index.mjs';

test('linear curve samples deterministically',()=>assert.equal(sampleCurve({keys:[{time:0,value:0},{time:1,value:10}]},.25),2.5));
test('step curve holds previous key',()=>assert.equal(sampleCurve({keys:[{time:0,value:2,interpolation:'STEP'},{time:1,value:8}]},.9),2));
test('Hermite curve supports vector channels',()=>{const v=sampleCurve({keys:[{time:0,value:[0,0],outTangent:[2,0],interpolation:'HERMITE'},{time:1,value:[1,1],inTangent:[0,2]}]},.5);assert.equal(v.length,2);assert.ok(v.every(Number.isFinite));});
test('path morph preserves topology',()=>assert.deepEqual(morphPath([[0,0],[1,0]],[[0,1],[2,0]],.5),[[0,.5],[1.5,0]]));
test('bilinear cage deforms UV vertices',()=>assert.deepEqual(deformByBilinearCage([{uv:[.5,.5]}],[[0,0],[2,0],[2,2],[0,2]])[0],[1,1]));
test('blend shapes add weighted deltas',()=>assert.deepEqual(blendShape2D([[0,0]],[[[2,0]],[[0,2]]],[.5,.25]),[[1,.5]]));
