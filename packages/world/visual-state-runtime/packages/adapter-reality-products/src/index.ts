import { cryptographicHash } from '../../spec/src/index.js';
import type { VSRRealtimeGPUFramePlan } from '../../realtime-webgpu/src/index.js';

export interface VSRRealityStudioGPUViewportManifest {
  format:'vsr.reality-studio-gpu-viewport.v0.3';version:string;projectRoot:string;activeSceneId:string;
  sourceDisplayHash:string;framePlanRoot:string;quality:string;renderSize:{width:number;height:number};
  features:{tiledLighting:boolean;gpuParticles:boolean;postprocess:boolean;textureAtlas:boolean};
  fallback:'canvas-reference';manifestRoot:string;
}
export interface VSRRealityBuildGPURequirement {
  format:'vsr.reality-build-gpu-requirement.v0.3';version:string;projectRoot:string;framePlanRoot:string;
  preferredBackend:'webgpu';fallbackBackend:'canvas2d';secureContextRequired:boolean;
  browserRequirements:string[];artifactCapabilities:string[];requirementRoot:string;
}
function stringField(object:Record<string,unknown>,snake:string,camel:string,fallback:string):string{const value=object[snake]??object[camel];return typeof value==='string'?value:fallback;}
export function compileRealityStudioGPUViewport(project:unknown,plan:VSRRealtimeGPUFramePlan):VSRRealityStudioGPUViewportManifest{
  const root=project&&typeof project==='object'?project as Record<string,unknown>:{},projectRoot=stringField(root,'project_root','projectRoot',cryptographicHash(root)),activeSceneId=stringField(root,'active_scene_id','activeSceneId','scene:default');
  const base={format:'vsr.reality-studio-gpu-viewport.v0.3' as const,version:'0.3.0-alpha.1',projectRoot,activeSceneId,sourceDisplayHash:plan.sourceDisplayHash,framePlanRoot:plan.framePlanRoot,quality:plan.quality,renderSize:{width:plan.viewport.renderWidth,height:plan.viewport.renderHeight},features:{tiledLighting:plan.lights.length>0,gpuParticles:plan.particleSeeds.length>0,postprocess:plan.passes.some(pass=>pass.id==='postprocess'&&pass.enabled),textureAtlas:plan.atlas.regions.length>0},fallback:'canvas-reference' as const};return{...base,manifestRoot:cryptographicHash(base)};
}
export function compileRealityBuildGPURequirement(projectRoot:string,plan:VSRRealtimeGPUFramePlan):VSRRealityBuildGPURequirement{
  const base={format:'vsr.reality-build-gpu-requirement.v0.3' as const,version:'0.3.0-alpha.1',projectRoot,framePlanRoot:plan.framePlanRoot,preferredBackend:'webgpu' as const,fallbackBackend:'canvas2d' as const,secureContextRequired:true,browserRequirements:['navigator.gpu','WebGPU compute pass','rgba8unorm render attachment'],artifactCapabilities:['texture-atlas','tiled-light-culling','gpu-particles','postprocess','evidence-frame-receipt']};return{...base,requirementRoot:cryptographicHash(base)};
}
export function verifyRealityStudioGPUViewport(manifest:VSRRealityStudioGPUViewportManifest):boolean{const {manifestRoot,...base}=manifest;return cryptographicHash(base)===manifestRoot;}
export function verifyRealityBuildGPURequirement(requirement:VSRRealityBuildGPURequirement):boolean{const {requirementRoot,...base}=requirement;return cryptographicHash(base)===requirementRoot;}
