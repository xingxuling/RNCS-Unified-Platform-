import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applySpatialIrradianceVolume,
  bakeSpatialIrradianceVolume,
  createSpatialShowcaseScene,
  renderSpatialReference,
  verifySpatialIrradianceVolume
} from '../dist/packages/spatial-reality-3d/src/index.js';

const outputRoot=resolve('outputs/spatial-irradiance-volume');
const bakePath=resolve(outputRoot,'irradiance-volume.json');
const evidencePath=resolve(outputRoot,'evidence.json');
const referencePath=resolve(outputRoot,'reference.png');
const sha256=(bytes)=>createHash('sha256').update(bytes).digest('hex');

mkdirSync(outputRoot,{recursive:true});
const scene=createSpatialShowcaseScene();
const generatedBake=bakeSpatialIrradianceVolume(scene,{dimensions:[4,3,4],visibilitySamples:4,shadowBias:.01,updateAlpha:.35});
writeFileSync(bakePath,JSON.stringify(generatedBake,null,2)+'\n');
const persistedBake=JSON.parse(readFileSync(bakePath,'utf8'));
const verification=verifySpatialIrradianceVolume(persistedBake);
if(!verification.ok)throw new Error(verification.diagnostics.join('; '));
const bakedScene=applySpatialIrradianceVolume(scene,persistedBake);
const reference=renderSpatialReference(bakedScene,{width:320,height:180,enableShadows:false});
writeFileSync(referencePath,reference.png);
const evidence={
  format:'vsr.spatial-irradiance-volume-evidence.v0.1',
  version:'0.1.0',
  sceneId:scene.sceneId,
  sourceRoot:persistedBake.sourceRoot,
  topologyRoot:persistedBake.topologyRoot,
  bakeRoot:persistedBake.root,
  dimensions:persistedBake.settings.dimensions,
  sampleCount:persistedBake.samples.length,
  persistedVerification:verification,
  appliedEnvironmentRoot:bakedScene.environment?.irradianceVolumeBakeRoot,
  pixelRoot:reference.pixelRoot,
  referencePngSha256:sha256(reference.png)
};
writeFileSync(evidencePath,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({ok:true,outputs:{bake:bakePath,evidence:evidencePath,reference:referencePath},...evidence},null,2));
