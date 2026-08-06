import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';

const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repoRoot=path.resolve(packageRoot,'../../..');
const fixturePath=path.join(repoRoot,'evidence/anime-forge-phase6-2-canonical-morphology-v0.1/morphology-regression-fixture/fixture.json');
const evidenceRoot=path.dirname(path.dirname(fixturePath));
const morphologyPath=path.join(packageRoot,'src/canonical-morphology.mjs');
const anatomySource=fs.readFileSync(path.join(packageRoot,'src/anatomy.mjs'),'utf8');
const rendererSource=fs.readFileSync(path.join(packageRoot,'src/renderer.mjs'),'utf8');

async function evaluateRegression(){
  const fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8'));
  const failures=[];
  if(!fs.existsSync(fixturePath))failures.push('REGRESSION_FIXTURE_MISSING');
  if(!fs.existsSync(path.join(evidenceRoot,fixture.source_asset)))failures.push('REGRESSION_IMAGE_MISSING');
  const base=createAnatomySystem();
  const variant=createAnatomySystem({body_parameters:{'body.shoulder_width':.72,'body.head_body_ratio':.39,'body.torso_length':.66,'body.limb_ratio':.38},face_genome:{parameters:{'face.jaw_definition':.72,'face.eye_spacing':.35}}});
  if(JSON.stringify(base.body_surface.body_landmarks)===JSON.stringify(variant.body_surface.body_landmarks))failures.push('GENOME_DOES_NOT_DRIVE_GEOMETRY');
  if(/const headCenter=worldFromBody/.test(anatomySource)||/const leftElbow=worldFromBody/.test(anatomySource))failures.push('POSE_OWNS_BODY_LANDMARKS');
  if(/const faceP=/.test(rendererSource)||/headScale=/.test(rendererSource)||/elbowRadius=/.test(rendererSource)||/const palm=/.test(rendererSource))failures.push('RENDERER_OWNS_ANATOMY');
  if(!fs.existsSync(morphologyPath)){
    failures.push('CANONICAL_MORPHOLOGY_MODULE_MISSING');
  }else{
    const morphology=await import(pathToFileURL(morphologyPath));
    const asset=morphology.compileMorphology(base.genome,{profile:'anime-npr-clean-v0.1'});
    for(const key of ['genome_root','law_set','skeleton','volumes','surfaces','face_surface','scalp_surface','garment_surface','certificate'])if(!asset?.[key])failures.push(`CANONICAL_ASSET_MISSING:${key}`);
    if(asset?.certificate&&!morphology.validateMorphologyCertificate(asset.certificate).valid)failures.push('MORPHOLOGY_CERTIFICATE_INVALID');
  }
  return{fixture,failures};
}

test('supplied Phase 6.1 frame is a registered canonical morphology regression fixture',async()=>{
  const result=await evaluateRegression();
  assert.deepEqual(result.failures,[],`Phase 6.2 Geometry Validation failed for ${result.fixture.fixture_id}: ${result.failures.join(',')}`);
});

export {evaluateRegression};
