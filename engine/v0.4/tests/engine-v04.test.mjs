import test from 'node:test';
import assert from 'node:assert/strict';
import { rotationAxes, collideOBB } from '../rsr/oriented-box-sat.js';
import { distributionGGX, geometrySmith, fresnelSchlick } from '../vsr/ggx.js';
import { evaluatePBRLighting } from '../vsr/pbr-lighting.js';

test('OBB SAT rejects false AABB overlap',()=>{const axes=rotationAxes({x:0,y:45,z:0});const a={center:{x:0,y:1000,z:0},axes,halfExtents:{x:1000,y:100,z:100}};const b={center:{x:200,y:1000,z:200},axes,halfExtents:{x:1000,y:100,z:100}};assert.equal(collideOBB(a,b),undefined);});
test('GGX terms stay finite',()=>{for(const r of [.04,.2,.5,1]){assert.ok(Number.isFinite(distributionGGX(.75,r)));assert.ok(geometrySmith(.8,.65,r)>=0);}});
test('Fresnel approaches white at grazing angle',()=>{assert.ok(fresnelSchlick(0,[.04,.04,.04])[0]>.99);});
test('PBR evaluation is deterministic',()=>{const input={baseColor:[.8,.2,.1],metallic:.35,roughness:.4,ior:1.5,clearcoat:.2,clearcoatRoughness:.12,normal:[0,1,0],view:[0,1,1],light:[0,1,.5],radiance:[3,2.8,2.5]};assert.deepEqual(evaluatePBRLighting(input),evaluatePBRLighting(input));});
