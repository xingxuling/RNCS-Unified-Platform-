import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applySpatialIrradianceProbeBake,
  bakeSpatialIrradianceProbes,
  createSpatialShowcaseScene,
  renderSpatialReference,
  verifySpatialIrradianceProbeBake
} from '../dist/packages/spatial-reality-3d/src/index.js';

const outputRoot=resolve('outputs/spatial-irradiance-probe-bake');
const bakePath=resolve(outputRoot,'probe-bake.json');
const evidencePath=resolve(outputRoot,'evidence.json');
const referencePath=resolve(outputRoot,'reference.png');
const sha256=(bytes)=>createHash('sha256').update(bytes).digest('hex');

mkdirSync(outputRoot,{recursive:true});
const scene=createSpatialShowcaseScene();
const generatedBake=bakeSpatialIrradianceProbes(scene,{count:4,idPrefix:'showcase'});
writeFileSync(bakePath,JSON.stringify(generatedBake,null,2)+'\n');
const persistedBake=JSON.parse(readFileSync(bakePath,'utf8'));
const verification=verifySpatialIrradianceProbeBake(persistedBake);
if(!verification.ok)throw new Error(verification.diagnostics.join('; '));
const bakedScene=applySpatialIrradianceProbeBake(scene,persistedBake);
const reference=renderSpatialReference(bakedScene,{width:320,height:180,enableShadows:false});
writeFileSync(referencePath,reference.png);
const evidence={
  format:'vsr.spatial-irradiance-bake-evidence.v0.1',
  version:'0.1.0',
  sceneId:scene.sceneId,
  sourceRoot:persistedBake.sourceRoot,
  bakeRoot:persistedBake.root,
  probeCount:persistedBake.probes.length,
  persistedVerification:verification,
  appliedEnvironmentRoot:bakedScene.environment?.irradianceBakeRoot,
  pixelRoot:reference.pixelRoot,
  referencePngSha256:sha256(reference.png)
};
writeFileSync(evidencePath,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({ok:true,outputs:{bake:bakePath,evidence:evidencePath,reference:referencePath},...evidence},null,2));
