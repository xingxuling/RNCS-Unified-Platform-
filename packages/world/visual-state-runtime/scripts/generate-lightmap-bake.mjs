import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applySpatialLightmapBake,
  bakeSpatialLightmap,
  createSpatialShowcaseScene,
  renderSpatialReference,
  verifySpatialLightmapBake
} from '../dist/packages/spatial-reality-3d/src/index.js';

const outputRoot=resolve('outputs/spatial-lightmap-bake');
const bakePath=resolve(outputRoot,'lightmap-bake.json');
const evidencePath=resolve(outputRoot,'evidence.json');
const referencePath=resolve(outputRoot,'reference.png');
const sha256=(bytes)=>createHash('sha256').update(bytes).digest('hex');

mkdirSync(outputRoot,{recursive:true});
const scene=createSpatialShowcaseScene();
const generatedBake=bakeSpatialLightmap(scene,{width:128,height:128,padding:1,maxTriangles:4096,visibilitySamples:4,shadowBias:.001,dilation:1});
writeFileSync(bakePath,JSON.stringify(generatedBake,null,2)+'\n');
const persistedBake=JSON.parse(readFileSync(bakePath,'utf8'));
const verification=verifySpatialLightmapBake(persistedBake);
if(!verification.ok)throw new Error(verification.diagnostics.join('; '));
const bakedScene=applySpatialLightmapBake(scene,persistedBake);
const reference=renderSpatialReference(bakedScene,{width:320,height:180,enableShadows:false});
writeFileSync(referencePath,reference.png);
const evidence={
  format:'vsr.spatial-lightmap-bake-evidence.v0.1',
  version:'0.1.0',
  sceneId:scene.sceneId,
  sourceRoot:persistedBake.sourceRoot,
  bakeRoot:persistedBake.root,
  atlas:{width:persistedBake.texture.width,height:persistedBake.texture.height},
  chartCount:persistedBake.charts.length,
  bakedMeshCount:persistedBake.meshes.length,
  bakedMaterialCount:persistedBake.materials.length,
  visibilitySamples:persistedBake.settings.visibilitySamples,
  shadowBias:persistedBake.settings.shadowBias,
  dilation:persistedBake.settings.dilation,
  persistedVerification:verification,
  appliedLightmapRoot:bakedScene.environment?.lightmapBakeRoot,
  geometryRoot:reference.framePlan.geometryRoot,
  materialRoot:reference.framePlan.materialRoot,
  textureRoot:reference.framePlan.textureRoot,
  pixelRoot:reference.pixelRoot,
  referencePngSha256:sha256(reference.png)
};
writeFileSync(evidencePath,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({ok:true,outputs:{bake:bakePath,evidence:evidencePath,reference:referencePath},...evidence},null,2));
