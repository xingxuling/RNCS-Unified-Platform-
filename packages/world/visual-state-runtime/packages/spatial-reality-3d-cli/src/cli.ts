#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  compileSpatialFrame,
  createSpatialShowcaseScene,
  renderSpatialReference,
  verifySpatialFrame,
  type VSRSpatialScene3D,
} from '../../spatial-reality-3d/src/index.js';

function writeJson(path:string,value:unknown):void{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2))}
function load(path:string):VSRSpatialScene3D{return JSON.parse(readFileSync(resolve(path),'utf8')) as VSRSpatialScene3D}
function usage():string{return`VSR Spatial Reality CLI v0.4

命令：
  demo [outDir]
  verify [outDir]
  plan <scene.json> [out.json]
  render <scene.json> [out.png]
`}

const [command,...args]=process.argv.slice(2);
try{
  if(!command||command==='help'||command==='--help'){console.log(usage());process.exit(0)}
  if(command==='demo'||command==='verify'){
    const outDir=resolve(args[0]??(command==='demo'?'outputs/spatial-reality-v04':'outputs/spatial-reality-v04-verify'));
    mkdirSync(outDir,{recursive:true});
    const scene=createSpatialShowcaseScene();
    const plan=compileSpatialFrame(scene,{width:640,height:360,qualityTier:'quality',shadowMapSize:256});
    const verification=verifySpatialFrame(plan);
    const render=renderSpatialReference(scene,{width:640,height:360,qualityTier:'quality',shadowMapSize:256});
    writeJson(resolve(outDir,'scene.vsr3d.json'),scene);
    writeJson(resolve(outDir,'frame-plan.json'),plan);
    writeFileSync(resolve(outDir,'reference.png'),render.png);
    const repeated=compileSpatialFrame(scene,{width:640,height:360,qualityTier:'quality',shadowMapSize:256});
    const report={ok:verification.ok&&plan.frameRoot===repeated.frameRoot&&render.png.byteLength>1000,verification,sceneId:scene.sceneId,frameRoot:plan.frameRoot,pixelRoot:render.pixelRoot,stats:plan.stats,depthRange:render.depthRange,outputs:{scene:'scene.vsr3d.json',plan:'frame-plan.json',png:'reference.png'}};
    writeJson(resolve(outDir,'verification.json'),report);
    console.log(JSON.stringify(report,null,2));
    if(command==='verify'&&!report.ok)process.exitCode=2;
    process.exit(0);
  }
  if(command==='plan'){
    const scenePath=args[0];if(!scenePath)throw new Error('缺少 scene.json');
    const out=resolve(args[1]??'outputs/spatial-frame-plan.json'),plan=compileSpatialFrame(load(scenePath));writeJson(out,plan);console.log(JSON.stringify({ok:true,out,frameRoot:plan.frameRoot,stats:plan.stats},null,2));process.exit(0);
  }
  if(command==='render'){
    const scenePath=args[0];if(!scenePath)throw new Error('缺少 scene.json');
    const out=resolve(args[1]??'outputs/spatial-reference.png'),render=renderSpatialReference(load(scenePath));mkdirSync(dirname(out),{recursive:true});writeFileSync(out,render.png);console.log(JSON.stringify({ok:true,out,pixelRoot:render.pixelRoot,frameRoot:render.framePlan.frameRoot,stats:render.framePlan.stats},null,2));process.exit(0);
  }
  throw new Error(`未知命令：${command}`);
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1}
