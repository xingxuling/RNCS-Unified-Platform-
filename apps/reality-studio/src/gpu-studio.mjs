import {compileRealtimeWebGPUFrame,verifyRealtimeWebGPUFrame,VSR_REALTIME_WEBGPU_VERSION} from '../../../packages/world/visual-state-runtime/dist/packages/realtime-webgpu/src/index.js';
import {seal} from './canonical.mjs';

export const GPU_STUDIO_FORMAT='reality-studio.gpu-viewport.v1.1';
export const GPU_STUDIO_VERSION='1.1.0-alpha.1';
const I=[1,0,0,0,1,0,0,0,1];
const deep=v=>structuredClone(v);
const pad=(n,l=8)=>String(n).padStart(l,'0');
const rgbaToHex=(r,g,b,a=255)=>`#${[r,g,b,a].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')}`;

function nodeVisual(node,asset){
  const id=String(node.asset_id??'');
  const tags=node.debug?.components?.tags??[];
  if(id.includes('gate')||asset?.kind==='environment-2d')return{type:'rect',width:62,height:88,anchorY:88,color:node.runtime?.open?'#22d3ee88':'#67e8f9cc',radius:10,tags:[...tags,'environment']};
  if(id.includes('key')||asset?.kind==='prop-2d')return{type:'ellipse',width:28,height:28,anchorY:14,color:node.runtime?.collected?'#fde68a33':'#fbbf24ff',radius:0,tags:[...tags,'collectible']};
  if(id.includes('guard')||tags.includes('enemy'))return{type:'ellipse',width:48,height:64,anchorY:64,color:(node.runtime?.health??1)<=0?'#47556966':'#a855f7ff',radius:0,tags:[...tags,'enemy']};
  return{type:'ellipse',width:48,height:64,anchorY:64,color:(node.runtime?.health??1)<=0?'#47556966':'#2563ebff',radius:0,tags:[...tags,'hero']};
}
function item({id,type='rect',x,y,width,height,color,opacity=1,order=0,tags=[],radius=0}){
  return{id,nodeId:id,type,orderKey:`${pad(order)}:${id}`,worldTransform:I,localBounds:{x,y,width,height},worldBounds:{x,y,width,height},opacity,appearance:{fill:{type:'solid',color},opacity},content:radius?{cornerRadius:radius}:{},sourceTrace:{},clipStack:[],tags};
}

export function sceneProjectionToVSRDisplayState(project,projection,{observer='player'}={}){
  const width=projection.canvas?.width??640,height=projection.canvas?.height??360;
  const items=[item({id:'studio:sky',x:0,y:0,width,height,color:projection.canvas?.background??'#071426',order:-1000,tags:['background']})];
  for(const tm of projection.tilemaps??[])for(const r of tm.rects??[])items.push(item({id:`tile:${r.rect_id}`,x:r.x,y:r.y,width:r.width,height:r.height,color:r.color,order:r.z_index??-100,tags:['tilemap',...(r.tags??[])]}));
  if(!(projection.tilemaps??[]).length){items.push(item({id:'studio:ground',x:0,y:height-60,width,height:60,color:'#17324cff',order:-50,tags:['ground']}));items.push(item({id:'studio:ground-rim',x:0,y:height-60,width,height:4,color:'#3b82f6aa',order:-49,tags:['decorative','particle']}));}
  for(const [index,node] of (projection.nodes??[]).entries()){
    if(node.visible===false)continue;
    const asset=project.assets?.registry?.[node.asset_id];
    const v=nodeVisual(node,asset),x=(node.transform?.x??0)-v.width/2,y=(node.transform?.y??0)-v.anchorY;
    items.push(item({id:node.node_id,type:v.type,x,y,width:v.width,height:v.height,color:v.color,order:index+node.z_index*100,tags:v.tags,radius:v.radius}));
    if(v.tags.includes('hero'))items.push(item({id:`${node.node_id}:glow`,type:'ellipse',x:x-10,y:y-8,width:v.width+20,height:v.height+18,color:'#38bdf822',opacity:.45,order:index+node.z_index*100-1,tags:['decorative','particle']}));
  }
  const victory=projection.globals?.victory===true;
  if(victory)items.push(item({id:'studio:victory-glow',type:'rect',x:170,y:115,width:300,height:105,color:'#22c55e44',opacity:.75,order:9000,tags:['overlay','decorative']}));
  return{
    documentId:`studio:${project.identity?.project_id??'project'}:${projection.scene_id}`,
    documentHash:`studio:${project.project_root}`,
    runtimeVersion:GPU_STUDIO_VERSION,time:Number(projection.tick??0)/20,frame:Number(projection.tick??0),
    viewport:{width,height,dpr:1},background:{type:'solid',color:projection.canvas?.background??'#071426'},items,diagnostics:[],
    semanticHash:`studio:${projection.projection_root}:${observer}`
  };
}

export function compileStudioGPUFrame(project,projection,{quality='quality',observer='player',gpuTier=2}={}){
  const state=sceneProjectionToVSRDisplayState(project,projection,{observer});
  const player=projection.nodes?.find(n=>n.debug?.entity_id==='player'||n.node_id==='node:player');
  const door=projection.nodes?.find(n=>String(n.asset_id).includes('gate')||n.node_id==='node:door');
  const config={
    quality,observer:{id:`studio:${observer}`,purpose:observer},device:{class:'desktop',gpuTier},
    materials:[
      {id:'material:hero',baseColor:'#2563eb',emissive:'#38bdf8',emissiveStrength:.42,receivesLight:true,castsShadow:true,blend:'alpha'},
      {id:'material:goal',baseColor:'#67e8f9',emissive:'#22d3ee',emissiveStrength:.6,receivesLight:true,castsShadow:false,blend:'additive'},
      {id:'material:tilemap',baseColor:'#315c7a',emissive:'#0ea5e9',emissiveStrength:.08,receivesLight:true,castsShadow:false,blend:'alpha'}
    ],
    bindings:[{materialId:'material:hero',tags:['hero']},{materialId:'material:goal',tags:['environment']},{materialId:'material:tilemap',tags:['tilemap']}],
    lights:[
      {id:'ambient',kind:'ambient',color:'#bcd7ff',intensity:.18},
      {id:'player-light',kind:'point',color:'#60a5fa',intensity:1.8,x:player?.transform?.x??100,y:(player?.transform?.y??250)-30,radius:230,castsShadow:true},
      {id:'goal-light',kind:'point',color:'#22d3ee',intensity:door?.runtime?.open?3.2:1.7,x:door?.transform?.x??570,y:(door?.transform?.y??230)-35,radius:220}
    ],
    post:{bloom:quality==='economy'?0:.68,vignette:.15,exposure:.08,contrast:1.04,saturation:1.06,gamma:2.2,toneMap:'aces'}
  };
  const plan=compileRealtimeWebGPUFrame(state,config,undefined,{particleLimit:quality==='economy'?64:512});
  const verification=verifyRealtimeWebGPUFrame(plan);
  if(!verification.ok)throw new Error(`GPU_FRAME_INVALID:${verification.diagnostics.join(',')}`);
  return plan;
}

const b64=bytes=>Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength).toString('base64');
export function serializeStudioGPUFrame(plan){
  return{
    ...deep({...plan,atlas:{...plan.atlas,data:undefined},vertexData:undefined,lightData:undefined,tileData:undefined,particleData:undefined}),
    atlas:{...deep(plan.atlas),data_base64:b64(plan.atlas.data),data:undefined},
    vertex_data:Array.from(plan.vertexData),light_data:Array.from(plan.lightData),tile_data:Array.from(plan.tileData),particle_data:Array.from(plan.particleData),
    transport_format:'reality-studio.serialized-gpu-frame.v1.0'
  };
}

export function summarizeStudioGPUFrame(plan){
  return seal({format:'reality-studio.gpu-frame-summary.v1.1',version:GPU_STUDIO_VERSION,vsr_version:VSR_REALTIME_WEBGPU_VERSION,frame_plan_root:plan.framePlanRoot,resource_root:plan.resourceRoot,command_root:plan.commandRoot,source_display_hash:plan.sourceDisplayHash,visual_plan_root:plan.visualPlanRoot,visual_evidence_root:plan.visualEvidenceRoot,quality:plan.quality,viewport:deep(plan.viewport),stats:deep(plan.stats),passes:plan.passes.filter(p=>p.enabled).map(p=>p.id)},'summary_root');
}

export function createGPUViewportManifest(project,frameSummary,{fallback='canvas2d'}={}){
  return seal({format:'reality-studio.gpu-viewport-manifest.v1.1',version:GPU_STUDIO_VERSION,project_root:project.project_root,entry_scene_id:project.active_scene_id,preferred_backend:'webgpu',fallback_backend:fallback,vsr_requirement:'visual-state-runtime@^0.3.0',frame_summary:deep(frameSummary),capabilities:['gpu.viewport','gpu.tilemap-batching','gpu.tiled-lighting','gpu.particles','gpu.postprocess','gpu.frame-evidence','gpu.device-loss-fallback']},'manifest_root');
}
