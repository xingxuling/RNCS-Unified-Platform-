import { encodePng, parseColor, PixelSurface, rasterizeDisplayState, type VSRRasterResourceInput } from '../../backend-canvas/src/index.js';
import { compileHybridRenderPlan, type VSRHybridRenderPlan } from '../../backend-hybrid/src/index.js';
import { compileWebGPUPlan, type VSRWebGPUPlan, type VSRWebGPUResourceInput } from '../../backend-webgpu/src/index.js';
import { cryptographicHash, semanticHash, type VSRDisplayItem, type VSRDisplayState, type VSRRect } from '../../spec/src/index.js';

export const VSR_VISUAL_REALITY_COMPILER_VERSION='0.3.0-alpha.1';
export type VSRQualityTier='economy'|'balanced'|'quality'|'cinematic';
export type VSRObserverPurpose='player'|'debugger'|'auditor'|'accessibility';
export type VSRLightKind='ambient'|'directional'|'point';
export type VSRToneMap='none'|'reinhard'|'aces';
export type VSRMaterialBlend='opaque'|'alpha'|'additive';

export interface VSRVisualMaterial {
  id:string;
  baseColor?:string;
  emissive?:string;
  emissiveStrength?:number;
  opacity?:number;
  roughness?:number;
  metallic?:number;
  receivesLight?:boolean;
  castsShadow?:boolean;
  blend?:VSRMaterialBlend;
}
export interface VSRMaterialBinding { materialId:string; nodeIds?:string[]; tags?:string[] }
export interface VSRVisualLight {
  id:string; kind:VSRLightKind; color:string; intensity:number;
  x?:number; y?:number; radius?:number; directionX?:number; directionY?:number;
  castsShadow?:boolean; priority?:number;
}
export interface VSRPostProcessConfig {
  enabled?:boolean; exposure?:number; contrast?:number; saturation?:number; gamma?:number;
  toneMap?:VSRToneMap; bloom?:number; bloomRadius?:number; vignette?:number;
  chromaticAberration?:number; grain?:number;
}
export interface VSRVisualRealityConfig {
  quality?:VSRQualityTier;
  observer?:{id:string;purpose:VSRObserverPurpose};
  device?:{class:'desktop'|'mobile'|'tablet'|'xr'|'server';gpuTier?:0|1|2|3};
  materials?:VSRVisualMaterial[];
  bindings?:VSRMaterialBinding[];
  lights?:VSRVisualLight[];
  post?:VSRPostProcessConfig;
  renderScale?:number;
  particleBudget?:number;
  lightTileSize?:number;
  allowDecorativeDegradation?:boolean;
}
export interface VSRResolvedBudget {
  quality:VSRQualityTier; renderScale:number; maxLights:number; maxShadowLights:number;
  particleBudget:number; bloom:boolean; bloomRadius:number; lightTileSize:number;
  occlusionCulling:boolean; lodMinPixels:number;
}
export interface VSRRenderPass {
  id:string; kind:'projection'|'visibility'|'shadow'|'opaque'|'lighting'|'transparent'|'emissive'|'particles'|'postprocess'|'composite'|'evidence';
  reads:string[]; writes:string[]; dependsOn:string[]; enabled:boolean; reason?:string;
  itemIds?:string[]; lightIds?:string[];
}
export interface VSRRenderBatch {
  id:string; key:string; materialId:string; itemType:string; blend:VSRMaterialBlend; itemIds:string[];
  instances:number; estimatedVertices:number; orderMin:number; orderMax:number;
}
export interface VSRLightTile { x:number;y:number;width:number;height:number;lightIds:string[] }
export interface VSRShaderModule {id:string;language:'wgsl';stage:'vertex'|'fragment'|'compute';source:string;sourceHash:string}
export interface VSRRenderResource {id:string;format:'rgba8unorm'|'rgba16float'|'r8unorm'|'depth24plus';transient:boolean;firstPass:number;lastPass:number;aliasGroup:string}
export interface VSRVisibilityRecord { itemId:string; visible:boolean; reason:'visible'|'viewport-culled'|'occluded'|'lod-degraded'; projectedPixels:number }
export interface VSRVisualRealityStats {
  sourceItems:number;visibleItems:number;culledItems:number;occludedItems:number;degradedItems:number;
  batches:number;instances:number;estimatedVertices:number;lights:number;shadowLights:number;lightTiles:number;
  gpuCoverage:number;softwareItems:number;passes:number;enabledPasses:number;
}
export interface VSRVisualRealityPlan {
  format:'vsr.visual-reality-plan.v0.2'; compilerVersion:string; sourceDisplayHash:string;
  observer:{id:string;purpose:VSRObserverPurpose}; device:{class:string;gpuTier:number}; budget:VSRResolvedBudget;
  viewport:{width:number;height:number;renderWidth:number;renderHeight:number;dpr:number};
  materials:VSRVisualMaterial[]; materialAssignments:Record<string,string>; lights:VSRVisualLight[];
  visibility:VSRVisibilityRecord[]; batches:VSRRenderBatch[]; lightTiles:VSRLightTile[]; passes:VSRRenderPass[];
  shaderModules:VSRShaderModule[]; resources:VSRRenderResource[];
  webgpuPlan:VSRWebGPUPlan; hybridPlan:VSRHybridRenderPlan; stats:VSRVisualRealityStats;
  semanticInvariant:{preservedItemIds:string[];degradedDecorativeItemIds:string[];sourceRealityHash:string};
  planRoot:string; evidenceRoot:string;
}
export interface VSRPlanVerification {ok:boolean;diagnostics:string[]}
export interface VSRPerceptualEquivalenceReport {ok:boolean;sharedSourceReality:boolean;missingSemanticItems:string[];allowedDecorativeDifferences:string[];reportRoot:string}
export interface VSRReferenceRenderResult {png:Uint8Array;plan:VSRVisualRealityPlan;pixelRoot:string}

const DEFAULT_MATERIAL:VSRVisualMaterial={id:'material:default',roughness:.8,metallic:0,receivesLight:true,castsShadow:true,blend:'alpha'};
const BUDGETS:Record<VSRQualityTier,Omit<VSRResolvedBudget,'quality'>>={
  economy:{renderScale:.75,maxLights:4,maxShadowLights:0,particleBudget:256,bloom:false,bloomRadius:0,lightTileSize:96,occlusionCulling:true,lodMinPixels:6},
  balanced:{renderScale:1,maxLights:8,maxShadowLights:2,particleBudget:1024,bloom:true,bloomRadius:3,lightTileSize:64,occlusionCulling:true,lodMinPixels:2},
  quality:{renderScale:1,maxLights:16,maxShadowLights:4,particleBudget:4096,bloom:true,bloomRadius:5,lightTileSize:48,occlusionCulling:true,lodMinPixels:.5},
  cinematic:{renderScale:1,maxLights:32,maxShadowLights:8,particleBudget:16384,bloom:true,bloomRadius:7,lightTileSize:32,occlusionCulling:false,lodMinPixels:0}
};
function clamp(value:number,min:number,max:number):number{return Math.max(min,Math.min(max,value));}
function intersects(a:VSRRect,b:VSRRect):boolean{return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}
function contains(a:VSRRect,b:VSRRect):boolean{return a.x<=b.x&&a.y<=b.y&&a.x+a.width>=b.x+b.width&&a.y+a.height>=b.y+b.height;}
function isOpaqueCover(item:VSRDisplayItem):boolean{return item.type==='rect'&&item.opacity>=.999&&item.appearance.fill?.type==='solid'&&(item.appearance.blendMode??'normal')==='normal'&&!item.appearance.shadow;}
function itemOrder(item:VSRDisplayItem,index:number):number{const parsed=Number(item.orderKey.split(':').at(-1));return Number.isFinite(parsed)?parsed:index;}
function projectedPixels(item:VSRDisplayItem):number{return Math.max(0,item.worldBounds.width)*Math.max(0,item.worldBounds.height)*Math.max(0,item.opacity);}
function resolveQuality(config:VSRVisualRealityConfig):VSRQualityTier{
  if(config.quality)return config.quality;
  const gpu=config.device?.gpuTier??1,device=config.device?.class??'desktop';
  if(device==='server'||gpu===0)return'economy';if(device==='mobile'||gpu===1)return'balanced';if(gpu===3)return'cinematic';return'quality';
}
export function resolveRenderBudget(config:VSRVisualRealityConfig={}):VSRResolvedBudget{
  const quality=resolveQuality(config),base=BUDGETS[quality];
  return{quality,...base,renderScale:clamp(config.renderScale??base.renderScale,.25,2),particleBudget:Math.max(0,Math.floor(config.particleBudget??base.particleBudget)),lightTileSize:Math.max(16,Math.floor(config.lightTileSize??base.lightTileSize))};
}

function asWebGPUResources(input?:VSRRasterResourceInput):VSRWebGPUResourceInput|undefined{return input instanceof Map?{images:input}:input;}
function materialFor(item:VSRDisplayItem,materials:Map<string,VSRVisualMaterial>,bindings:VSRMaterialBinding[]):VSRVisualMaterial{
  for(const binding of bindings){if(binding.nodeIds?.includes(item.nodeId)||binding.nodeIds?.includes(item.id)||binding.tags?.some(tag=>item.tags?.includes(tag)))return materials.get(binding.materialId)??DEFAULT_MATERIAL;}
  const extensionMaterial=typeof item.content.materialId==='string'?item.content.materialId:undefined;
  return extensionMaterial?materials.get(extensionMaterial)??DEFAULT_MATERIAL:DEFAULT_MATERIAL;
}
function blendFor(item:VSRDisplayItem,material:VSRVisualMaterial):VSRMaterialBlend{
  if(material.blend)return material.blend;if((item.appearance.blendMode??'normal')==='additive')return'additive';return item.opacity>=.999?'opaque':'alpha';
}
function clipKey(item:VSRDisplayItem):string{return(item.clipStack??[]).map(clip=>`${clip.worldBounds.x},${clip.worldBounds.y},${clip.worldBounds.width},${clip.worldBounds.height}`).join('|')||'none';}
function stableNoise(seed:number):number{let x=seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)%1000003)/1000003;}
function lightIntersectsTile(light:VSRVisualLight,tile:VSRRect):boolean{
  if(light.kind==='ambient'||light.kind==='directional')return true;const radius=Math.max(0,light.radius??0),cx=clamp(light.x??0,tile.x,tile.x+tile.width),cy=clamp(light.y??0,tile.y,tile.y+tile.height),dx=(light.x??0)-cx,dy=(light.y??0)-cy;return dx*dx+dy*dy<=radius*radius;
}
function buildShaderModules():VSRShaderModule[]{
  const modules:Array<Omit<VSRShaderModule,'sourceHash'>>=[
    {id:'shader:geometry-vs',language:'wgsl',stage:'vertex',source:'struct VOut { @builtin(position) position: vec4f, @location(0) uv: vec2f, @location(1) color: vec4f }; @vertex fn main(@location(0) position: vec2f, @location(1) uv: vec2f, @location(2) color: vec4f) -> VOut { var o:VOut; o.position=vec4f(position,0.0,1.0); o.uv=uv; o.color=color; return o; }'},
    {id:'shader:material-fs',language:'wgsl',stage:'fragment',source:'struct Material { baseColor:vec4f, emissive:vec4f, params:vec4f }; @fragment fn main(@location(0) uv:vec2f,@location(1) color:vec4f)->@location(0) vec4f { return color; }'},
    {id:'shader:tiled-lighting-cs',language:'wgsl',stage:'compute',source:'@compute @workgroup_size(8,8,1) fn main(@builtin(global_invocation_id) id:vec3u) { _ = id; }'},
    {id:'shader:post-fs',language:'wgsl',stage:'fragment',source:'@fragment fn main(@location(0) uv:vec2f)->@location(0) vec4f { return vec4f(uv,0.0,1.0); }'}
  ];return modules.map(module=>({...module,sourceHash:cryptographicHash(module.source)}));
}
function buildRenderResources(passes:VSRRenderPass[]):VSRRenderResource[]{
  const specs:Array<{id:string;format:VSRRenderResource['format'];transient:boolean;aliasGroup:string}>=[
    {id:'Color',format:'rgba8unorm',transient:true,aliasGroup:'color-a'},{id:'Coverage',format:'r8unorm',transient:true,aliasGroup:'mask-a'},{id:'ShadowMask',format:'r8unorm',transient:true,aliasGroup:'mask-a'},
    {id:'LitColor',format:'rgba16float',transient:true,aliasGroup:'color-b'},{id:'CompositedColor',format:'rgba16float',transient:true,aliasGroup:'color-a'},{id:'EmissiveColor',format:'rgba16float',transient:true,aliasGroup:'color-b'},
    {id:'ParticleColor',format:'rgba16float',transient:true,aliasGroup:'color-b'},{id:'PostColor',format:'rgba16float',transient:true,aliasGroup:'color-b'},{id:'FinalColor',format:'rgba8unorm',transient:false,aliasGroup:'final'}
  ];return specs.map(spec=>{const uses=passes.flatMap((pass,index)=>(pass.reads.includes(spec.id)||pass.writes.includes(spec.id))?[index]:[]);return{...spec,firstPass:uses.length?Math.min(...uses):-1,lastPass:uses.length?Math.max(...uses):-1};});
}
function buildPasses(visible:VSRDisplayItem[],assignments:Record<string,string>,materials:Map<string,VSRVisualMaterial>,lights:VSRVisualLight[],post:VSRPostProcessConfig,budget:VSRResolvedBudget):VSRRenderPass[]{
  const opaque=visible.filter(item=>blendFor(item,materials.get(assignments[item.id]!)??DEFAULT_MATERIAL)==='opaque').map(item=>item.id);
  const transparent=visible.filter(item=>blendFor(item,materials.get(assignments[item.id]!)??DEFAULT_MATERIAL)!=='opaque').map(item=>item.id);
  const emissive=visible.filter(item=>(materials.get(assignments[item.id]!)?.emissiveStrength??0)>0).map(item=>item.id);
  const particles=visible.filter(item=>item.tags?.includes('particle')).map(item=>item.id).slice(0,budget.particleBudget);
  const shadowLights=lights.filter(light=>light.castsShadow).slice(0,budget.maxShadowLights).map(light=>light.id);
  const pp=post.enabled!==false&&(Boolean(post.bloom&&budget.bloom)||Boolean(post.vignette)||Boolean(post.chromaticAberration)||Boolean(post.grain)||Boolean(post.exposure)||Boolean(post.contrast)||Boolean(post.saturation)||Boolean(post.gamma)||Boolean(post.toneMap&&post.toneMap!=='none'));
  return[
    {id:'pass:projection',kind:'projection',reads:['DisplayState'],writes:['ProjectedItems'],dependsOn:[],enabled:true},
    {id:'pass:visibility',kind:'visibility',reads:['ProjectedItems'],writes:['VisibleItems'],dependsOn:['pass:projection'],enabled:true,itemIds:visible.map(item=>item.id)},
    {id:'pass:shadow',kind:'shadow',reads:['VisibleItems','Lights'],writes:['ShadowMask'],dependsOn:['pass:visibility'],enabled:shadowLights.length>0,reason:shadowLights.length?'shadow-casting-lights':'budget-or-scene-disabled',lightIds:shadowLights},
    {id:'pass:opaque',kind:'opaque',reads:['VisibleItems','Materials'],writes:['Color','Coverage'],dependsOn:['pass:visibility'],enabled:opaque.length>0,itemIds:opaque},
    {id:'pass:lighting',kind:'lighting',reads:['Color','Coverage','Lights','ShadowMask'],writes:['LitColor'],dependsOn:['pass:opaque','pass:shadow'],enabled:lights.length>0,lightIds:lights.map(light=>light.id)},
    {id:'pass:transparent',kind:'transparent',reads:['VisibleItems','LitColor'],writes:['CompositedColor'],dependsOn:['pass:lighting'],enabled:transparent.length>0,itemIds:transparent},
    {id:'pass:emissive',kind:'emissive',reads:['VisibleItems','Materials'],writes:['EmissiveColor'],dependsOn:['pass:transparent'],enabled:emissive.length>0,itemIds:emissive},
    {id:'pass:particles',kind:'particles',reads:['VisibleItems'],writes:['ParticleColor'],dependsOn:['pass:transparent'],enabled:particles.length>0,itemIds:particles},
    {id:'pass:postprocess',kind:'postprocess',reads:['CompositedColor','EmissiveColor','ParticleColor'],writes:['PostColor'],dependsOn:['pass:emissive','pass:particles'],enabled:pp,reason:pp?'configured':'no-active-effects'},
    {id:'pass:composite',kind:'composite',reads:[pp?'PostColor':'CompositedColor'],writes:['FinalColor'],dependsOn:[pp?'pass:postprocess':'pass:transparent'],enabled:true},
    {id:'pass:evidence',kind:'evidence',reads:['FinalColor','RenderPlan'],writes:['ProjectionEvidence'],dependsOn:['pass:composite'],enabled:true}
  ];
}
export function compileVisualRealityPlan(state:VSRDisplayState,config:VSRVisualRealityConfig={},resources?:VSRRasterResourceInput):VSRVisualRealityPlan{
  const budget=resolveRenderBudget(config),viewport:VSRRect={x:0,y:0,width:state.viewport.width,height:state.viewport.height};
  const materialList=[DEFAULT_MATERIAL,...(config.materials??[]).filter(material=>material.id!==DEFAULT_MATERIAL.id)];const materials=new Map(materialList.map(material=>[material.id,material]));
  const bindings=config.bindings??[],assignments:Record<string,string>={};for(const item of state.items)assignments[item.id]=materialFor(item,materials,bindings).id;
  const visibility:VSRVisibilityRecord[]=state.items.map(item=>({itemId:item.id,visible:true,reason:'visible',projectedPixels:projectedPixels(item)}));
  for(let i=0;i<state.items.length;i++){const item=state.items[i]!,record=visibility[i]!;if(!intersects(item.worldBounds,viewport)){record.visible=false;record.reason='viewport-culled';continue;}if(record.projectedPixels<budget.lodMinPixels&&config.allowDecorativeDegradation!==false&&(item.tags?.includes('decorative')||item.tags?.includes('particle'))){record.visible=false;record.reason='lod-degraded';}}
  if(budget.occlusionCulling){const covers:VSRRect[]=[];for(let i=state.items.length-1;i>=0;i--){const item=state.items[i]!,record=visibility[i]!;if(!record.visible)continue;if(covers.some(cover=>contains(cover,item.worldBounds))&&item.type!=='text'){record.visible=false;record.reason='occluded';continue;}if(isOpaqueCover(item))covers.push(item.worldBounds);}}
  const visible=state.items.filter((_item,index)=>visibility[index]!.visible);const batches:VSRRenderBatch[]=[];
  visible.forEach((item,index)=>{const material=materials.get(assignments[item.id]!)??DEFAULT_MATERIAL,blend=blendFor(item,material),key=[item.type,material.id,blend,clipKey(item)].join('|'),order=itemOrder(item,index);let batch=batches.at(-1);if(!batch||batch.key!==key){batch={id:`batch:${semanticHash(`${key}:${batches.length}`).slice(-12)}`,key,materialId:material.id,itemType:item.type,blend,itemIds:[],instances:0,estimatedVertices:0,orderMin:order,orderMax:order};batches.push(batch);}batch.itemIds.push(item.id);batch.instances++;batch.estimatedVertices+=item.type==='path'?18:item.type==='line'?6:6;batch.orderMax=order;});
  const lights=[...(config.lights??[])].sort((a,b)=>(b.priority??0)-(a.priority??0)||a.id.localeCompare(b.id)).slice(0,budget.maxLights);const lightTiles:VSRLightTile[]=[];
  for(let y=0;y<state.viewport.height;y+=budget.lightTileSize)for(let x=0;x<state.viewport.width;x+=budget.lightTileSize){const tile={x,y,width:Math.min(budget.lightTileSize,state.viewport.width-x),height:Math.min(budget.lightTileSize,state.viewport.height-y)};const lightIds=lights.filter(light=>lightIntersectsTile(light,tile)).map(light=>light.id);if(lightIds.length)lightTiles.push({...tile,lightIds});}
  const post:VSRPostProcessConfig={enabled:true,exposure:0,contrast:1,saturation:1,gamma:2.2,toneMap:'aces',bloom:budget.bloom?.7:0,bloomRadius:budget.bloomRadius,vignette:.12,...config.post};
  const passes=buildPasses(visible,assignments,materials,lights,post,budget),shaderModules=buildShaderModules(),renderResources=buildRenderResources(passes);const backendResources=asWebGPUResources(resources),webgpuPlan=compileWebGPUPlan({...state,items:visible},backendResources),hybridPlan=compileHybridRenderPlan({...state,items:visible},backendResources);
  const decorative=visibility.filter(record=>record.reason==='lod-degraded').map(record=>record.itemId),preserved=visibility.filter(record=>record.visible).map(record=>record.itemId);
  const stats:VSRVisualRealityStats={sourceItems:state.items.length,visibleItems:visible.length,culledItems:visibility.filter(record=>record.reason==='viewport-culled').length,occludedItems:visibility.filter(record=>record.reason==='occluded').length,degradedItems:decorative.length,batches:batches.length,instances:visible.length,estimatedVertices:batches.reduce((sum,batch)=>sum+batch.estimatedVertices,0),lights:lights.length,shadowLights:lights.filter(light=>light.castsShadow).slice(0,budget.maxShadowLights).length,lightTiles:lightTiles.length,gpuCoverage:hybridPlan.stats.gpuCoverage,softwareItems:hybridPlan.stats.softwareItems,passes:passes.length,enabledPasses:passes.filter(pass=>pass.enabled).length};
  const sourceRealityHash=cryptographicHash({documentId:state.documentId,documentHash:state.documentHash,time:state.time,frame:state.frame,sourceDisplayHash:state.semanticHash});
  const semanticInvariant={preservedItemIds:preserved,degradedDecorativeItemIds:decorative,sourceRealityHash};
  const planView:Omit<VSRVisualRealityPlan,'webgpuPlan'|'hybridPlan'|'planRoot'|'evidenceRoot'>={format:'vsr.visual-reality-plan.v0.2',compilerVersion:VSR_VISUAL_REALITY_COMPILER_VERSION,sourceDisplayHash:state.semanticHash,observer:{id:config.observer?.id??'observer:default',purpose:config.observer?.purpose??'player'},device:{class:config.device?.class??'desktop',gpuTier:config.device?.gpuTier??2},budget,viewport:{width:state.viewport.width,height:state.viewport.height,renderWidth:Math.max(1,Math.round(state.viewport.width*budget.renderScale)),renderHeight:Math.max(1,Math.round(state.viewport.height*budget.renderScale)),dpr:state.viewport.dpr},materials:materialList,materialAssignments:assignments,lights,visibility,batches,lightTiles,passes,shaderModules,resources:renderResources,stats,semanticInvariant};
  const planRoot=cryptographicHash(planView),evidenceRoot=cryptographicHash({sourceRealityHash,planRoot,observer:planView.observer,device:planView.device,budget,stats});
  return{...planView,webgpuPlan,hybridPlan,planRoot,evidenceRoot};
}
export function verifyVisualRealityPlan(state:VSRDisplayState,plan:VSRVisualRealityPlan):VSRPlanVerification{
  const diagnostics:string[]=[];if(plan.sourceDisplayHash!==state.semanticHash)diagnostics.push('source-display-hash-mismatch');
  const ids=new Set(state.items.map(item=>item.id));for(const record of plan.visibility)if(!ids.has(record.itemId))diagnostics.push(`unknown-visibility-item:${record.itemId}`);
  const visible=plan.visibility.filter(record=>record.visible).map(record=>record.itemId),batched=plan.batches.flatMap(batch=>batch.itemIds);if(new Set(batched).size!==batched.length)diagnostics.push('duplicate-batched-item');for(const id of visible)if(!batched.includes(id))diagnostics.push(`visible-item-not-batched:${id}`);for(const id of batched)if(!visible.includes(id))diagnostics.push(`hidden-item-batched:${id}`);
  for(const pass of plan.passes)for(const dependency of pass.dependsOn)if(!plan.passes.some(candidate=>candidate.id===dependency))diagnostics.push(`missing-pass-dependency:${pass.id}:${dependency}`);
  if(plan.stats.visibleItems!==visible.length)diagnostics.push('visible-stat-mismatch');if(plan.stats.batches!==plan.batches.length)diagnostics.push('batch-stat-mismatch');if(plan.stats.lights!==plan.lights.length)diagnostics.push('light-stat-mismatch');
  const expectedEvidence=cryptographicHash({sourceRealityHash:plan.semanticInvariant.sourceRealityHash,planRoot:plan.planRoot,observer:plan.observer,device:plan.device,budget:plan.budget,stats:plan.stats});if(expectedEvidence!==plan.evidenceRoot)diagnostics.push('evidence-root-mismatch');
  return{ok:diagnostics.length===0,diagnostics};
}
export function comparePerceptualPlans(a:VSRVisualRealityPlan,b:VSRVisualRealityPlan):VSRPerceptualEquivalenceReport{
  const sharedSourceReality=a.semanticInvariant.sourceRealityHash===b.semanticInvariant.sourceRealityHash;const required=new Set([...a.semanticInvariant.preservedItemIds,...b.semanticInvariant.preservedItemIds]);const missing=[...required].filter(id=>!a.semanticInvariant.preservedItemIds.includes(id)||!b.semanticInvariant.preservedItemIds.includes(id)).filter(id=>!a.semanticInvariant.degradedDecorativeItemIds.includes(id)&&!b.semanticInvariant.degradedDecorativeItemIds.includes(id));const allowed=[...new Set([...a.semanticInvariant.degradedDecorativeItemIds,...b.semanticInvariant.degradedDecorativeItemIds])].sort();const view={sharedSourceReality,missingSemanticItems:missing.sort(),allowedDecorativeDifferences:allowed};return{ok:sharedSourceReality&&missing.length===0,...view,reportRoot:cryptographicHash(view)};
}
function cloneSurface(surface:PixelSurface):PixelSurface{const copy=new PixelSurface(surface.width,surface.height);copy.data.set(surface.data);return copy;}
function blurSurface(source:PixelSurface,radius:number):PixelSurface{
  const r=Math.max(0,Math.min(16,Math.floor(radius)));if(!r)return cloneSurface(source);const temp=new Float64Array(source.data.length),out=new PixelSurface(source.width,source.height),w=source.width,h=source.height,window=r*2+1;
  for(let y=0;y<h;y++)for(let channel=0;channel<4;channel++){let sum=0;for(let x=-r;x<=r;x++){const sx=clamp(x,0,w-1);sum+=source.data[(y*w+sx)*4+channel]!;}for(let x=0;x<w;x++){temp[(y*w+x)*4+channel]=sum/window;const remove=clamp(x-r,0,w-1),add=clamp(x+r+1,0,w-1);sum+=source.data[(y*w+add)*4+channel]!-source.data[(y*w+remove)*4+channel]!;}}
  for(let x=0;x<w;x++)for(let channel=0;channel<4;channel++){let sum=0;for(let y=-r;y<=r;y++){const sy=clamp(y,0,h-1);sum+=temp[(sy*w+x)*4+channel]!;}for(let y=0;y<h;y++){out.data[(y*w+x)*4+channel]=clamp(sum/window,0,255);const remove=clamp(y-r,0,h-1),add=clamp(y+r+1,0,h-1);sum+=temp[(add*w+x)*4+channel]!-temp[(remove*w+x)*4+channel]!;}}
  return out;
}
function toneMap(value:number,mode:VSRToneMap):number{if(mode==='none')return value;if(mode==='reinhard')return value/(1+value);const a=2.51,b=.03,c=2.43,d=.59,e=.14;return clamp((value*(a*value+b))/(value*(c*value+d)+e),0,1);}
function applyLightingAndPost(base:PixelSurface,plan:VSRVisualRealityPlan,post:VSRPostProcessConfig):PixelSurface{
  const out=cloneSurface(base),w=base.width,h=base.height,ambient=plan.lights.filter(light=>light.kind==='ambient'),directional=plan.lights.filter(light=>light.kind==='directional'),points=plan.lights.filter(light=>light.kind==='point');
  const ambientRgb=ambient.reduce((sum,light)=>{const c=parseColor(light.color),k=Math.max(0,light.intensity);return[sum[0]+c[0]/255*k,sum[1]+c[1]/255*k,sum[2]+c[2]/255*k] as [number,number,number];},[.12,.12,.12] as [number,number,number]);const directionalEnergy=directional.reduce((sum,light)=>sum+Math.max(0,light.intensity),0);
  const exposure=Math.pow(2,post.exposure??0),contrast=post.contrast??1,saturation=post.saturation??1,gamma=Math.max(.1,post.gamma??2.2),mode=post.toneMap??'aces',vignette=clamp(post.vignette??0,0,1),grain=clamp(post.grain??0,0,1),aberration=Math.max(0,Math.round(post.chromaticAberration??0));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(base.data[i+3]===0)continue;let lr=ambientRgb[0]+directionalEnergy*.2,lg=ambientRgb[1]+directionalEnergy*.2,lb=ambientRgb[2]+directionalEnergy*.2;for(const light of points){const dx=x-(light.x??0),dy=y-(light.y??0),radius=Math.max(1,light.radius??1),distance=Math.sqrt(dx*dx+dy*dy);if(distance>=radius)continue;const attenuation=(1-distance/radius)**2*Math.max(0,light.intensity),c=parseColor(light.color);lr+=c[0]/255*attenuation;lg+=c[1]/255*attenuation;lb+=c[2]/255*attenuation;}const redIndex=(y*w+clamp(x+aberration,0,w-1))*4,blueIndex=(y*w+clamp(x-aberration,0,w-1))*4;let r=(base.data[redIndex]!/255)*Math.max(.05,lr),g=(base.data[i+1]!/255)*Math.max(.05,lg),b=(base.data[blueIndex+2]!/255)*Math.max(.05,lb);r*=exposure;g*=exposure;b*=exposure;r=toneMap(r,mode);g=toneMap(g,mode);b=toneMap(b,mode);const luminance=r*.2126+g*.7152+b*.0722;r=luminance+(r-luminance)*saturation;g=luminance+(g-luminance)*saturation;b=luminance+(b-luminance)*saturation;r=(r-.5)*contrast+.5;g=(g-.5)*contrast+.5;b=(b-.5)*contrast+.5;const nx=(x/(Math.max(1,w-1)))*2-1,ny=(y/(Math.max(1,h-1)))*2-1,v=1-vignette*clamp((nx*nx+ny*ny-.15)/1.85,0,1),n=(stableNoise(i^plan.planRoot.length)-.5)*grain*.12;r=(r*v+n)**(1/gamma);g=(g*v+n)**(1/gamma);b=(b*v+n)**(1/gamma);out.data[i]=clamp(r*255,0,255);out.data[i+1]=clamp(g*255,0,255);out.data[i+2]=clamp(b*255,0,255);}
  const bloomStrength=plan.budget.bloom?clamp(post.bloom??0,0,2):0;if(bloomStrength>0){const bright=new PixelSurface(w,h);for(let i=0;i<base.data.length;i+=4){const lum=(out.data[i]!*0.2126+out.data[i+1]!*0.7152+out.data[i+2]!*0.0722)/255;if(lum>.62){const scale=(lum-.62)/.38;bright.data[i]=out.data[i]!;bright.data[i+1]=out.data[i+1]!;bright.data[i+2]=out.data[i+2]!;bright.data[i+3]=clamp(scale*255,0,255);}}const blurred=blurSurface(bright,post.bloomRadius??plan.budget.bloomRadius);for(let i=0;i<out.data.length;i+=4){const alpha=blurred.data[i+3]!/255*bloomStrength;out.data[i]=clamp(out.data[i]!+blurred.data[i]!*alpha,0,255);out.data[i+1]=clamp(out.data[i+1]!+blurred.data[i+1]!*alpha,0,255);out.data[i+2]=clamp(out.data[i+2]!+blurred.data[i+2]!*alpha,0,255);}}
  return out;
}
function compositeUnder(over:PixelSurface,under:PixelSurface):PixelSurface{
  const out=cloneSurface(under);for(let i=0;i<out.data.length;i+=4){const sa=over.data[i+3]!/255,da=out.data[i+3]!/255,oa=sa+da*(1-sa);if(oa<=0)continue;for(let c=0;c<3;c++)out.data[i+c]=clamp((over.data[i+c]!*sa+out.data[i+c]!*da*(1-sa))/oa,0,255);out.data[i+3]=clamp(oa*255,0,255);}return out;
}
function materializedItems(state:VSRDisplayState,plan:VSRVisualRealityPlan):VSRDisplayItem[]{const materials=new Map(plan.materials.map(material=>[material.id,material]));return state.items.map(item=>{const material=materials.get(plan.materialAssignments[item.id]??'material:default')??DEFAULT_MATERIAL,appearance={...item.appearance};if(material.baseColor)appearance.fill={type:'solid',color:material.baseColor};if(material.opacity!==undefined)appearance.opacity=material.opacity;if(material.blend==='additive')appearance.blendMode='additive';return{...item,appearance,opacity:item.opacity*(material.opacity??1)};});}
function shadowSurface(state:VSRDisplayState,plan:VSRVisualRealityPlan):PixelSurface|undefined{
  const shadowLight=plan.lights.find(light=>light.castsShadow);if(!shadowLight||plan.budget.maxShadowLights<=0)return undefined;const materials=new Map(plan.materials.map(material=>[material.id,material])),visible=new Set(plan.visibility.filter(record=>record.visible).map(record=>record.itemId));const dx=shadowLight.kind==='directional'?-(shadowLight.directionX??-1)*8:6,dy=shadowLight.kind==='directional'?-(shadowLight.directionY??-1)*8:8;const items=state.items.filter(item=>visible.has(item.id)&&(materials.get(plan.materialAssignments[item.id]??'material:default')?.castsShadow??true)&&item.type!=='text').map(item=>({...item,worldTransform:[item.worldTransform[0],item.worldTransform[1],item.worldTransform[2]+dx,item.worldTransform[3],item.worldTransform[4],item.worldTransform[5]+dy,item.worldTransform[6],item.worldTransform[7],item.worldTransform[8]] as typeof item.worldTransform,appearance:{...item.appearance,fill:{type:'solid' as const,color:'#00000099'},stroke:undefined,shadow:undefined},opacity:item.opacity*.45}));return items.length?rasterizeDisplayState({...state,items,background:{type:'solid',color:'#00000000'}}):undefined;
}
export function renderVisualRealityReference(state:VSRDisplayState,config:VSRVisualRealityConfig={},resources?:VSRRasterResourceInput):VSRReferenceRenderResult{
  const plan=compileVisualRealityPlan(state,config,resources);const visible=new Set(plan.visibility.filter(record=>record.visible).map(record=>record.itemId)),items=materializedItems(state,plan).filter(item=>visible.has(item.id)),projected:{state:VSRDisplayState;resources?:VSRRasterResourceInput}={state:{...state,items},resources};const foreground=rasterizeDisplayState(projected.state,projected.resources),shadow=shadowSurface(projected.state,plan),base=shadow?compositeUnder(foreground,shadow):foreground;const final=applyLightingAndPost(base,plan,{enabled:true,exposure:0,contrast:1.04,saturation:1.05,gamma:2.2,toneMap:'aces',bloom:plan.budget.bloom?.65:0,bloomRadius:plan.budget.bloomRadius,vignette:.12,...config.post});const png=encodePng(final,{compressionLevel:6});return{png,plan,pixelRoot:cryptographicHash([...final.data])};
}
