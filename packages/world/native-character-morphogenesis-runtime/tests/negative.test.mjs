import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createAnatomySystem,validateAnatomySystem} from '../src/anatomy.mjs';

test('tampered scalp anchors and body surface roots fail validation',()=>{
  const system=createAnatomySystem(),tampered=JSON.parse(JSON.stringify(system));tampered.hair_topology.scalp_anchors=[];tampered.body_surface.body_landmarks.elbow_left=null;
  const result=validateAnatomySystem(tampered);assert.equal(result.valid,false);assert.ok(result.errors.includes('SCALP_ANCHORS_INSUFFICIENT'));assert.ok(result.errors.includes('LANDMARK_MISSING:elbow_left'));assert.ok(result.errors.includes('ROOT_MISMATCH:hair_topology'));
});

test('required schema contracts remain present and versioned',()=>{
  const root=fileURLToPath(new URL('..',import.meta.url)),files=['character-body-surface.v2.schema.json','character-face-rig.v2.schema.json','character-hair-topology.v2.schema.json','anime-provider-manifest.v0.1.schema.json'];
  for(const file of files){const schema=JSON.parse(fs.readFileSync(path.join(root,'schemas',file),'utf8'));assert.equal(schema.type,'object');assert.ok(schema.$id);assert.ok(schema.required.length>=4);}
});
