import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applySpatialIrradianceVolumeField,
  bakeSpatialIrradianceVolumeField,
  createSpatialShowcaseScene,
  renderSpatialReference,
  verifySpatialIrradianceVolumeField
} from '../dist/packages/spatial-reality-3d/src/index.js';

const outputRoot=resolve('outputs/spatial-irradiance-volume-field');
const fieldPath=resolve(outputRoot,'irradiance-volume-field.json');
const evidencePath=resolve(outputRoot,'evidence.json');
const referencePath=resolve(outputRoot,'reference.png');
const sha256=(bytes)=>createHash('sha256').update(bytes).digest('hex');

mkdirSync(outputRoot,{recursive:true});
const scene=createSpatialShowcaseScene();
const nodeIds=scene.nodes.map(node=>node.id);
scene.streaming={worldId:'world:spatial-showcase-field',cells:[
  {id:'cell:left',center:[-2.5,0,0],radius:8,nodeIds},
  {id:'cell:right',center:[2.5,0,0],radius:8,nodeIds}
]};
const generatedField=bakeSpatialIrradianceVolumeField(scene,{blendDistance:1,maxVolumes:4,maxSamples:128,volumes:[
  {id:'volume:left',cellId:'cell:left',boundsMin:[-5,-1,-5],boundsMax:[0,3,5],dimensions:[3,2,3],visibilitySamples:4,shadowBias:.01},
  {id:'volume:right',cellId:'cell:right',boundsMin:[0,-1,-5],boundsMax:[5,3,5],dimensions:[3,2,3],visibilitySamples:4,shadowBias:.01,blendWeight:.55}
]});
writeFileSync(fieldPath,JSON.stringify(generatedField,null,2)+'\n');
const persistedField=JSON.parse(readFileSync(fieldPath,'utf8'));
const verification=verifySpatialIrradianceVolumeField(persistedField);
if(!verification.ok)throw new Error(verification.diagnostics.join('; '));
const appliedScene=applySpatialIrradianceVolumeField(scene,persistedField);
const reference=renderSpatialReference(appliedScene,{width:320,height:180,enableShadows:false,streaming:{loadRadius:0,unloadRadius:0,forcedCellIds:['cell:left','cell:right']}});
writeFileSync(referencePath,reference.png);
const evidence={
  format:'vsr.spatial-irradiance-volume-field-evidence.v0.1',
  version:'0.1.0',
  sceneId:scene.sceneId,
  sourceRoot:persistedField.sourceRoot,
  topologyRoot:persistedField.topologyRoot,
  fieldRoot:persistedField.root,
  volumeCount:persistedField.volumes.length,
  sampleCount:persistedField.volumes.reduce((sum,entry)=>sum+entry.volume.samples.length,0),
  volumeIds:persistedField.volumes.map(entry=>entry.id),
  persistedVerification:verification,
  appliedEnvironmentRoot:appliedScene.environment?.irradianceVolumeFieldRoot,
  selectedEnvironmentRoot:reference.framePlan.environment.irradianceVolumeFieldRoot,
  activeCellIds:reference.framePlan.streaming?.activeCellIds??[],
  pixelRoot:reference.pixelRoot,
  referencePngSha256:sha256(reference.png)
};
writeFileSync(evidencePath,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({ok:true,outputs:{field:fieldPath,evidence:evidencePath,reference:referencePath},...evidence},null,2));
