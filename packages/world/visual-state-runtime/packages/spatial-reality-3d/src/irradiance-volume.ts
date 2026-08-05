import { cryptographicHash } from '../../spec/src/index.js';
import { meshBounds, multiplyMat4, transformPoint3, transformToMat4 } from './index.js';
import type {
  Mat4,
  VSRSpatialLight,
  VSRSpatialMaterial,
  VSRSpatialMesh,
  VSRSpatialNode,
  VSRSpatialResolvedEnvironment,
  VSRSpatialScene3D,
  VSRSpatialTexture,
  Vec3
} from './index.js';

export const VSR_SPATIAL_IRRADIANCE_VOLUME_FORMAT='vsr.spatial-irradiance-volume.v0.1' as const;

export type VSRSpatialIrradianceVolumeDimensions=[number,number,number];

export interface VSRSpatialIrradianceVolumeSample {
  diffuseColor:string;
  specularColor:string;
  intensity:number;
  visibility:number;
}

export interface VSRSpatialIrradianceVolumeSettings {
  boundsMin:Vec3;
  boundsMax:Vec3;
  dimensions:VSRSpatialIrradianceVolumeDimensions;
  blendWeight:number;
  updateAlpha:number;
  visibilitySamples:number;
  shadowBias:number;
}

export interface VSRSpatialIrradianceVolumeBakeOptions {
  boundsMin?:Vec3;
  boundsMax?:Vec3;
  dimensions?:VSRSpatialIrradianceVolumeDimensions;
  blendWeight?:number;
  updateAlpha?:number;
  visibilitySamples?:number;
  shadowBias?:number;
}

export interface VSRSpatialIrradianceVolume {
  format:typeof VSR_SPATIAL_IRRADIANCE_VOLUME_FORMAT;
  version:'0.1.0';
  sceneId:string;
  sourceRoot:string;
  topologyRoot:string;
  settings:VSRSpatialIrradianceVolumeSettings;
  samples:VSRSpatialIrradianceVolumeSample[];
  root:string;
}

type RGB=Vec3;
type Triangle={nodeId:string;triangleIndex:number;vertices:[Vec3,Vec3,Vec3]};
type EmissiveSource={center:Vec3;radiance:RGB};
type SceneWorlds=Map<string,Mat4>;

const EPS=1e-9;
const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,value));
const add=(a:RGB,b:RGB):RGB=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:RGB,b:RGB):RGB=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const scale=(a:RGB,value:number):RGB=>[a[0]*value,a[1]*value,a[2]*value];
const length=(a:RGB):number=>Math.hypot(a[0],a[1],a[2]);
const distance=(a:RGB,b:RGB):number=>length(sub(a,b));
const normalize=(a:RGB):RGB=>{const value=length(a);return value<EPS?[0,1,0]:scale(a,1/value)};

function color(value:string|undefined):RGB{
  const input=(value??'#000000').trim(),hex=input.match(/^#([0-9a-f]{3,8})$/i);
  if(hex){const raw=hex[1]!;if(raw.length===3||raw.length===4)return[parseInt(`${raw[0]}${raw[0]}`,16)/255,parseInt(`${raw[1]}${raw[1]}`,16)/255,parseInt(`${raw[2]}${raw[2]}`,16)/255];if(raw.length===6||raw.length===8)return[parseInt(raw.slice(0,2),16)/255,parseInt(raw.slice(2,4),16)/255,parseInt(raw.slice(4,6),16)/255]}
  const rgb=input.match(/^rgba?\(([^)]+)\)$/i);if(rgb){const values=rgb[1]!.split(',').map(Number);return[clamp((values[0]??0)/255,0,1),clamp((values[1]??0)/255,0,1),clamp((values[2]??0)/255,0,1)]}
  const named:Record<string,RGB>={black:[0,0,0],white:[1,1,1],red:[1,0,0],green:[0,.5,0],blue:[0,0,1],yellow:[1,1,0]};return named[input.toLowerCase()]??[0,0,0];
}

function encodeColor(value:RGB,scaleValue:number):string{return`#${value.map(channel=>Math.round(clamp(channel/Math.max(scaleValue,1),0,1)*255).toString(16).padStart(2,'0')).join('')}`}
function finiteVec3(value:unknown):value is Vec3{return Array.isArray(value)&&value.length===3&&value.every(component=>typeof component==='number'&&Number.isFinite(component))}
function colorString(value:string):boolean{return/^#[0-9a-f]{6}$/i.test(value)}
function identityMat4():Mat4{return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}

function worldMatrices(scene:VSRSpatialScene3D):SceneWorlds{
  const byId=new Map(scene.nodes.map(node=>[node.id,node])),cache=new Map<string,Mat4>(),visiting=new Set<string>();
  const resolve=(id:string):Mat4=>{const cached=cache.get(id);if(cached)return cached;if(visiting.has(id))throw new Error(`Node hierarchy cycle at ${id}.`);const node=byId.get(id);if(!node)throw new Error(`Missing node ${id}.`);visiting.add(id);const local=transformToMat4(node.transform??{}),world=node.parentId?multiplyMat4(resolve(node.parentId),local):local;cache.set(id,world);visiting.delete(id);return world};
  for(const node of scene.nodes)resolve(node.id);return cache;
}

function transformBounds(mesh:VSRSpatialMesh,world:Mat4):{min:Vec3;max:Vec3;center:Vec3}{
  const local=meshBounds(mesh),corners:Vec3[]=([[local.min[0],local.min[1],local.min[2]],[local.max[0],local.min[1],local.min[2]],[local.min[0],local.max[1],local.min[2]],[local.max[0],local.max[1],local.min[2]],[local.min[0],local.min[1],local.max[2]],[local.max[0],local.min[1],local.max[2]],[local.min[0],local.max[1],local.max[2]],[local.max[0],local.max[1],local.max[2]]] as Vec3[]).map(corner=>transformPoint3(world,corner));
  const min:Vec3=[Infinity,Infinity,Infinity],max:Vec3=[-Infinity,-Infinity,-Infinity];for(const corner of corners)for(let axis=0;axis<3;axis++){min[axis]=Math.min(min[axis]!,corner[axis]!);max[axis]=Math.max(max[axis]!,corner[axis]!)}return{min,max,center:[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2]};
}

function sceneBounds(scene:VSRSpatialScene3D,worlds:SceneWorlds):{min:Vec3;max:Vec3}{
  const min:Vec3=[Infinity,Infinity,Infinity],max:Vec3=[-Infinity,-Infinity,-Infinity];
  for(const node of scene.nodes){if(node.visible===false||!node.meshId)continue;const mesh=scene.meshes.find(entry=>entry.id===node.meshId);if(!mesh)continue;const bounds=transformBounds(mesh,worlds.get(node.id)??identityMat4());for(let axis=0;axis<3;axis++){min[axis]=Math.min(min[axis]!,bounds.min[axis]!);max[axis]=Math.max(max[axis]!,bounds.max[axis]!)}}
  if(min.some(value=>!Number.isFinite(value)))return{min:[-1,-1,-1],max:[1,1,1]};const extent:Vec3=[Math.max(max[0]-min[0],.5),Math.max(max[1]-min[1],.5),Math.max(max[2]-min[2],.5)],padding=Math.max(.25,Math.max(...extent)*.05);return{min:[min[0]-padding,min[1]-padding,min[2]-padding],max:[max[0]+padding,max[1]+padding,max[2]+padding]};
}

function resolveDimensions(value:VSRSpatialIrradianceVolumeDimensions|undefined):VSRSpatialIrradianceVolumeDimensions{
  const dimensions:[number,number,number]=[value?.[0]??4,value?.[1]??3,value?.[2]??4].map(entry=>clamp(Math.round(entry),2,16)) as [number,number,number];
  if(dimensions.some(entry=>!Number.isFinite(entry)))throw new Error('Irradiance volume dimensions must be finite.');
  while(dimensions[0]*dimensions[1]*dimensions[2]>512){const axis=dimensions[0]>=dimensions[1]&&dimensions[0]>=dimensions[2]?0:dimensions[1]>=dimensions[2]?1:2;if(dimensions[axis]<=2)break;dimensions[axis]!--}
  return dimensions;
}

function resolveSettings(scene:VSRSpatialScene3D,options:VSRSpatialIrradianceVolumeBakeOptions):VSRSpatialIrradianceVolumeSettings{
  const bounds=sceneBounds(scene,worldMatrices(scene)),boundsMin=options.boundsMin?[...options.boundsMin] as Vec3:bounds.min,boundsMax=options.boundsMax?[...options.boundsMax] as Vec3:bounds.max;
  if(!finiteVec3(boundsMin)||!finiteVec3(boundsMax)||boundsMax.some((value,axis)=>value<=boundsMin[axis]!))throw new Error('Irradiance volume bounds must be finite and have positive extent.');
  return{boundsMin,boundsMax,dimensions:resolveDimensions(options.dimensions),blendWeight:clamp(Number.isFinite(options.blendWeight)?options.blendWeight??1:1,0,1),updateAlpha:clamp(Number.isFinite(options.updateAlpha)?options.updateAlpha??.35:.35,.05,1),visibilitySamples:clamp(Number.isFinite(options.visibilitySamples)?Math.round(options.visibilitySamples??4):4,1,4),shadowBias:clamp(Number.isFinite(options.shadowBias)?options.shadowBias??.01:.01,.0001,1)};
}

function baseEnvironment(scene:VSRSpatialScene3D):Record<string,unknown>{
  const environment=scene.environment??{},texture=environment.textureId?scene.textures?.find(entry=>entry.id===environment.textureId):undefined;return{diffuseColor:environment.diffuseColor??null,specularColor:environment.specularColor??null,intensity:environment.intensity??1,textureId:environment.textureId??null,texture:texture??null,probes:environment.probes??[]};
}
function sourceRepresentation(scene:VSRSpatialScene3D):Record<string,unknown>{const environment=scene.environment??{};return{format:scene.format,sceneId:scene.sceneId,reality:scene.reality??null,meshes:scene.meshes,materials:scene.materials,nodes:scene.nodes,lights:scene.lights,environment:baseEnvironment(scene),textures:environment.textureId?scene.textures?.filter(texture=>texture.id===environment.textureId)??[]:[]}}
function topologyRepresentation(scene:VSRSpatialScene3D):Record<string,unknown>{return{format:scene.format,sceneId:scene.sceneId,reality:scene.reality??null,meshes:scene.meshes,materials:scene.materials,nodes:scene.nodes}}
function sourceRoot(scene:VSRSpatialScene3D):string{return cryptographicHash(sourceRepresentation(scene))}
function topologyRoot(scene:VSRSpatialScene3D):string{return cryptographicHash(topologyRepresentation(scene))}
export function spatialIrradianceVolumeSourceRoot(scene:VSRSpatialScene3D):string{assertScene(scene);return sourceRoot(scene)}
export function spatialIrradianceVolumeTopologyRoot(scene:VSRSpatialScene3D):string{assertScene(scene);return topologyRoot(scene)}

function occluders(scene:VSRSpatialScene3D,worlds:SceneWorlds):Triangle[]{const result:Triangle[]=[];for(const node of scene.nodes){if(node.visible===false||!node.meshId||node.castShadow===false)continue;const mesh=scene.meshes.find(entry=>entry.id===node.meshId),material=scene.materials.find(entry=>entry.id===node.materialId)??scene.materials[0];if(!mesh||material?.alphaMode==='BLEND')continue;const world=worlds.get(node.id)??identityMat4();for(let triangleIndex=0;triangleIndex<mesh.indices.length/3;triangleIndex++){const indices=[mesh.indices[triangleIndex*3]!,mesh.indices[triangleIndex*3+1]!,mesh.indices[triangleIndex*3+2]!],vertices=indices.map(index=>transformPoint3(world,[mesh.positions[index*3]!,mesh.positions[index*3+1]!,mesh.positions[index*3+2]!] as Vec3)) as [Vec3,Vec3,Vec3];if(length(sub(vertices[1],vertices[0]))>EPS&&length(sub(vertices[2],vertices[0]))>EPS)result.push({nodeId:node.id,triangleIndex,vertices});if(result.length>=4096)return result}}return result}
function dot(a:RGB,b:RGB):number{return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function cross(a:RGB,b:RGB):RGB{return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function rayIntersects(origin:Vec3,direction:Vec3,maxDistance:number,triangle:Triangle,bias:number):boolean{const [a,b,c]=triangle.vertices,edge1=sub(b,a),edge2=sub(c,a),h=cross(direction,edge2),det=dot(edge1,h);if(Math.abs(det)<EPS)return false;const inverseDet=1/det,s=sub(origin,a),u=inverseDet*dot(s,h);if(u<-EPS||u>1+EPS)return false;const q=cross(s,edge1),v=inverseDet*dot(direction,q),distanceAlongRay=inverseDet*dot(edge2,q);return v>=-EPS&&u+v<=1+EPS&&distanceAlongRay>bias&&distanceAlongRay<maxDistance-bias}
function visibility(position:Vec3,direction:Vec3,maxDistance:number,samples:number,bias:number,geometry:Triangle[]):number{const offsets:Vec3[]=[[0,0,0],[bias*4,0,0],[0,bias*4,0],[0,0,bias*4]],count=Math.max(1,Math.min(4,samples));let visible=0;for(const offset of offsets.slice(0,count)){const origin:additiveVec3=[position[0]+offset[0],position[1]+offset[1],position[2]+offset[2]];let blocked=false;for(const triangle of geometry){if(rayIntersects(origin,direction,maxDistance,triangle,bias)){blocked=true;break}}if(!blocked)visible++}return visible/count}
type additiveVec3=Vec3;

function textureAverage(texture:VSRSpatialTexture|undefined):RGB|undefined{if(!texture||texture.pixels.length<4)return undefined;const total=Math.floor(texture.pixels.length/4),sum:RGB=[0,0,0];for(let index=0;index<total;index++){sum[0]+=(texture.pixels[index*4]??0)/255;sum[1]+=(texture.pixels[index*4+1]??0)/255;sum[2]+=(texture.pixels[index*4+2]??0)/255}return scale(sum,1/Math.max(1,total))}
function lightDirection(light:VSRSpatialLight,position:Vec3):{direction:Vec3;distance:number}{if(light.kind==='directional'){return{direction:normalize(scale(light.direction??[-.4,-1,-.3],-1)),distance:1e6}}const delta=sub(light.position??[0,2,0],position),distanceValue=Math.max(EPS,length(delta));return{direction:scale(delta,1/distanceValue),distance:distanceValue}}
function emissiveSources(scene:VSRSpatialScene3D,worlds:SceneWorlds):EmissiveSource[]{return scene.nodes.flatMap(node=>{if(node.visible===false||!node.meshId)return[];const mesh=scene.meshes.find(entry=>entry.id===node.meshId),material=node.materialId?scene.materials.find(entry=>entry.id===node.materialId):undefined;if(!mesh||!material||(material.emissiveStrength??0)<=0)return[];return[{center:transformBounds(mesh,worlds.get(node.id)??identityMat4()).center,radiance:scale(color(material.emissive),Math.max(0,material.emissiveStrength??0))}]})}

function irradianceAt(scene:VSRSpatialScene3D,position:Vec3,settings:VSRSpatialIrradianceVolumeSettings,geometry:Triangle,allGeometry:Triangle[],sources:EmissiveSource[]):VSRSpatialIrradianceVolumeSample{
  const environment=scene.environment??{},environmentTexture=environment.textureId?scene.textures?.find(texture=>texture.id===environment.textureId):undefined,environmentColor=textureAverage(environmentTexture),environmentDiffuse=scale(environmentColor??color(environment.diffuseColor),clamp(environment.intensity??1,0,32)),environmentSpecular=scale(environmentColor??color(environment.specularColor),clamp(environment.intensity??1,0,32));let diffuse=environmentDiffuse,specular=environmentSpecular,totalVisibility=0,visibilityCount=0;
  for(const light of scene.lights.slice(0,32)){const lightColor=color(light.color??'#ffffff'),intensity=Math.max(0,light.intensity??1);if(light.kind==='ambient'){diffuse=add(diffuse,scale(lightColor,intensity));specular=add(specular,scale(lightColor,intensity*.35));continue}const target=lightDirection(light,position),attenuation=light.kind==='directional'?1:Math.pow(clamp(1-distance(position,light.position??[0,2,0])/Math.max(.001,light.range??10),0,1),2),visible=visibility(position,target.direction,target.distance,settings.visibilitySamples,settings.shadowBias,allGeometry);totalVisibility+=visible;visibilityCount++;diffuse=add(diffuse,scale(lightColor,intensity*attenuation*(light.kind==='directional'?.45:.5)*visible));specular=add(specular,scale(lightColor,intensity*attenuation*(light.kind==='directional'?.2:.25)*visible))}
  for(const source of sources){const influence=1/(1+distance(position,source.center));diffuse=add(diffuse,scale(source.radiance,influence*.5));specular=add(specular,scale(source.radiance,influence*.15))}
  const radianceScale=Math.max(1,...diffuse,...specular),confidence=visibilityCount?clamp(totalVisibility/visibilityCount,0,1):1;return{diffuseColor:encodeColor(diffuse,radianceScale),specularColor:encodeColor(specular,radianceScale),intensity:radianceScale,visibility:confidence};
}

function gridPosition(settings:VSRSpatialIrradianceVolumeSettings,x:number,y:number,z:number):Vec3{const [nx,ny,nz]=settings.dimensions;return[settings.boundsMin[0]+(settings.boundsMax[0]-settings.boundsMin[0])*(nx<=1?0:x/(nx-1)),settings.boundsMin[1]+(settings.boundsMax[1]-settings.boundsMin[1])*(ny<=1?0:y/(ny-1)),settings.boundsMin[2]+(settings.boundsMax[2]-settings.boundsMin[2])*(nz<=1?0:z/(nz-1))]}
function bakeSamples(scene:VSRSpatialScene3D,settings:VSRSpatialIrradianceVolumeSettings):VSRSpatialIrradianceVolumeSample[]{const worlds=worldMatrices(scene),geometry=occluders(scene,worlds),sources=emissiveSources(scene,worlds),samples:VSRSpatialIrradianceVolumeSample[]=[];for(let z=0;z<settings.dimensions[2];z++)for(let y=0;y<settings.dimensions[1];y++)for(let x=0;x<settings.dimensions[0];x++)samples.push(irradianceAt(scene,gridPosition(settings,x,y,z),settings,geometry[0]??{nodeId:'',triangleIndex:-1,vertices:[[0,0,0],[1,0,0],[0,1,0]]},geometry,sources));return samples}

function assertScene(scene:VSRSpatialScene3D):void{if(scene.format!=='vsr.spatial-scene.v0.4')throw new Error(`Unsupported spatial scene format ${String(scene.format)}.`);if(!scene.sceneId)throw new Error('Irradiance volume sceneId is required.');if(!Array.isArray(scene.meshes)||!Array.isArray(scene.nodes)||!Array.isArray(scene.materials)||!Array.isArray(scene.lights))throw new Error('Irradiance volume scene collections are invalid.')}

export function bakeSpatialIrradianceVolume(scene:VSRSpatialScene3D,options:VSRSpatialIrradianceVolumeBakeOptions={}):VSRSpatialIrradianceVolume{assertScene(scene);const settings=resolveSettings(scene,options),base={format:VSR_SPATIAL_IRRADIANCE_VOLUME_FORMAT,version:'0.1.0' as const,sceneId:scene.sceneId,sourceRoot:sourceRoot(scene),topologyRoot:topologyRoot(scene),settings,samples:bakeSamples(scene,settings)};return{...base,root:cryptographicHash(base)}}

function decodeSample(sample:VSRSpatialIrradianceVolumeSample):{diffuse:RGB;specular:RGB}{const intensity=Math.max(0,Number.isFinite(sample.intensity)?sample.intensity:0)*clamp(Number.isFinite(sample.visibility)?sample.visibility:0,0,1);return{diffuse:scale(color(sample.diffuseColor),intensity),specular:scale(color(sample.specularColor),intensity)}}
function encodeRadiance(diffuse:RGB,specular:RGB,visibilityValue:number):VSRSpatialIrradianceVolumeSample{const intensity=Math.max(1,...diffuse,...specular);return{diffuseColor:encodeColor(diffuse,intensity),specularColor:encodeColor(specular,intensity),intensity,visibility:clamp(visibilityValue,0,1)}}

export function updateSpatialIrradianceVolume(scene:VSRSpatialScene3D,previous:VSRSpatialIrradianceVolume,options:VSRSpatialIrradianceVolumeBakeOptions={}):VSRSpatialIrradianceVolume{assertScene(scene);const verification=verifySpatialIrradianceVolume(previous);if(!verification.ok)throw new Error(verification.diagnostics.join('; '));if(previous.sceneId!==scene.sceneId)throw new Error(`Irradiance volume scene ${previous.sceneId} does not match ${scene.sceneId}.`);if(topologyRoot(scene)!==previous.topologyRoot)throw new Error('Irradiance volume topology root mismatch.');const current=bakeSpatialIrradianceVolume(scene,{boundsMin:previous.settings.boundsMin,boundsMax:previous.settings.boundsMax,dimensions:previous.settings.dimensions,blendWeight:options.blendWeight??previous.settings.blendWeight,updateAlpha:options.updateAlpha??previous.settings.updateAlpha,visibilitySamples:options.visibilitySamples??previous.settings.visibilitySamples,shadowBias:options.shadowBias??previous.settings.shadowBias}),alpha=clamp(options.updateAlpha??previous.settings.updateAlpha,.05,1),samples=current.samples.map((sample,index)=>{const previousSample=previous.samples[index]!;const old=decodeSample(previousSample),next=decodeSample(sample);return encodeRadiance(add(scale(old.diffuse,1-alpha),scale(next.diffuse,alpha)),add(scale(old.specular,1-alpha),scale(next.specular,alpha)),previousSample.visibility+(sample.visibility-previousSample.visibility)*alpha)}),{root:_currentRoot,...currentBase}=current,base={...currentBase,settings:{...current.settings,updateAlpha:alpha},samples};return{...base,root:cryptographicHash(base)}}

export function verifySpatialIrradianceVolume(volume:VSRSpatialIrradianceVolume):{ok:boolean;diagnostics:string[]}{const diagnostics:string[]=[];if(volume.format!==VSR_SPATIAL_IRRADIANCE_VOLUME_FORMAT)diagnostics.push('irradiance volume format mismatch');if(volume.version!=='0.1.0')diagnostics.push('irradiance volume version mismatch');if(!volume.sceneId)diagnostics.push('irradiance volume sceneId is missing');for(const root of [volume.sourceRoot,volume.topologyRoot,volume.root])if(!/^[a-f0-9]{64}$/.test(root))diagnostics.push('irradiance volume root is invalid');const settings=volume.settings;if(!settings||!finiteVec3(settings.boundsMin)||!finiteVec3(settings.boundsMax)||settings.boundsMax.some((value,axis)=>value<=settings.boundsMin[axis]!))diagnostics.push('irradiance volume bounds are invalid');if(!settings?.dimensions||settings.dimensions.length!==3||settings.dimensions.some(value=>!Number.isInteger(value)||value<2||value>16)||settings.dimensions.reduce((product,value)=>product*value,1)>512)diagnostics.push('irradiance volume dimensions are invalid');if(!settings||!Number.isFinite(settings.blendWeight)||settings.blendWeight<0||settings.blendWeight>1)diagnostics.push('irradiance volume blend weight is invalid');if(!settings||!Number.isFinite(settings.updateAlpha)||settings.updateAlpha<.05||settings.updateAlpha>1)diagnostics.push('irradiance volume update alpha is invalid');if(!settings||!Number.isInteger(settings.visibilitySamples)||settings.visibilitySamples<1||settings.visibilitySamples>4)diagnostics.push('irradiance volume visibility sample count is invalid');if(!settings||!Number.isFinite(settings.shadowBias)||settings.shadowBias<=0||settings.shadowBias>1)diagnostics.push('irradiance volume shadow bias is invalid');const expectedCount=settings?.dimensions?.reduce((product,value)=>product*value,1)??0;if(volume.samples.length!==expectedCount)diagnostics.push('irradiance volume sample count does not match dimensions');if(volume.samples.some(sample=>!colorString(sample.diffuseColor)||!colorString(sample.specularColor)||!Number.isFinite(sample.intensity)||sample.intensity<0||sample.intensity>64||!Number.isFinite(sample.visibility)||sample.visibility<0||sample.visibility>1))diagnostics.push('irradiance volume contains an invalid sample');const {root,...base}=volume;if(cryptographicHash(base)!==root)diagnostics.push('irradiance volume root mismatch');return{ok:diagnostics.length===0,diagnostics}}

export function applySpatialIrradianceVolume(scene:VSRSpatialScene3D,volume:VSRSpatialIrradianceVolume):VSRSpatialScene3D{const verification=verifySpatialIrradianceVolume(volume);if(!verification.ok)throw new Error(verification.diagnostics.join('; '));if(volume.sceneId!==scene.sceneId)throw new Error(`Irradiance volume scene ${volume.sceneId} does not match ${scene.sceneId}.`);if(sourceRoot(scene)!==volume.sourceRoot)throw new Error('Irradiance volume source root mismatch.');return{...scene,environment:{...(scene.environment??{}),irradianceVolume:sanitizeSpatialIrradianceVolume(volume),irradianceVolumeBakeRoot:volume.root}}}

export function sanitizeSpatialIrradianceVolume(volume:VSRSpatialIrradianceVolume|undefined):VSRSpatialIrradianceVolume|undefined{if(!volume||!verifySpatialIrradianceVolume(volume).ok)return undefined;return{...volume,settings:{...volume.settings,boundsMin:[...volume.settings.boundsMin] as Vec3,boundsMax:[...volume.settings.boundsMax] as Vec3,dimensions:[...volume.settings.dimensions] as VSRSpatialIrradianceVolumeDimensions},samples:volume.samples.map(sample=>({...sample}))}}

function volumeFromEnvironment(environment:{irradianceVolume?:VSRSpatialIrradianceVolume}|VSRSpatialIrradianceVolume|undefined):VSRSpatialIrradianceVolume|undefined{if(!environment)return undefined;if('format' in environment)return environment.format===VSR_SPATIAL_IRRADIANCE_VOLUME_FORMAT?environment:undefined;return environment.irradianceVolume}
function volumeSample(volume:VSRSpatialIrradianceVolume,position:Vec3):{sample:VSRSpatialIrradianceVolumeSample;weight:number}|undefined{const settings=volume.settings,[nx,ny,nz]=settings.dimensions;const normalized=[(position[0]-settings.boundsMin[0])/(settings.boundsMax[0]-settings.boundsMin[0]),(position[1]-settings.boundsMin[1])/(settings.boundsMax[1]-settings.boundsMin[1]),(position[2]-settings.boundsMin[2])/(settings.boundsMax[2]-settings.boundsMin[2])];if(normalized.some(value=>value<0||value>1))return undefined;const coordinates=normalized.map((value,axis)=>{const size=settings.dimensions[axis]!;return{low:Math.min(size-1,Math.floor(value*(size-1))),high:Math.min(size-1,Math.ceil(value*(size-1))),weight:value*(size-1)-Math.floor(value*(size-1))}}),diffuse:[number,number,number]=[0,0,0],specular:[number,number,number]=[0,0,0];let visibilityValue=0;for(const z of [0,1])for(const y of [0,1])for(const x of [0,1]){const coordinateX=x?coordinates[0]!.high:coordinates[0]!.low,coordinateY=y?coordinates[1]!.high:coordinates[1]!.low,coordinateZ=z?coordinates[2]!.high:coordinates[2]!.low,weight=(x?coordinates[0]!.weight:1-coordinates[0]!.weight)*(y?coordinates[1]!.weight:1-coordinates[1]!.weight)*(z?coordinates[2]!.weight:1-coordinates[2]!.weight),sample=volume.samples[coordinateX+nx*(coordinateY+ny*coordinateZ)]!,decoded=decodeSample(sample);diffuse[0]+=decoded.diffuse[0]*weight;diffuse[1]+=decoded.diffuse[1]*weight;diffuse[2]+=decoded.diffuse[2]*weight;specular[0]+=decoded.specular[0]*weight;specular[1]+=decoded.specular[1]*weight;specular[2]+=decoded.specular[2]*weight;visibilityValue+=sample.visibility*weight}return{sample:encodeRadiance(diffuse,specular,visibilityValue),weight:clamp(settings.blendWeight,0,1)}}

export function sampleSpatialIrradianceVolume(volume:VSRSpatialIrradianceVolume|undefined,worldPosition:Vec3,fallbackDiffuse:Vec3,fallbackSpecular:Vec3):{diffuse:Vec3;specular:Vec3}{const sampled=volume?volumeSample(volume,worldPosition):undefined;if(!sampled)return{diffuse:fallbackDiffuse,specular:fallbackSpecular};const decoded=decodeSample(sampled.sample),weight=sampled.weight;return{diffuse:[fallbackDiffuse[0]+(decoded.diffuse[0]-fallbackDiffuse[0])*weight,fallbackDiffuse[1]+(decoded.diffuse[1]-fallbackDiffuse[1])*weight,fallbackDiffuse[2]+(decoded.diffuse[2]-fallbackDiffuse[2])*weight],specular:[fallbackSpecular[0]+(decoded.specular[0]-fallbackSpecular[0])*weight,fallbackSpecular[1]+(decoded.specular[1]-fallbackSpecular[1])*weight,fallbackSpecular[2]+(decoded.specular[2]-fallbackSpecular[2])*weight]}}

export function packSpatialIrradianceVolumeBuffer(environment:{irradianceVolume?:VSRSpatialIrradianceVolume}|VSRSpatialIrradianceVolume|undefined):Float32Array{const volume=volumeFromEnvironment(environment),settings=volume?.settings,dimensions=settings?.dimensions??[0,0,0],samples=volume?.samples??[],out=new Float32Array(16+8*Math.max(1,samples.length));if(settings){out.set([...settings.boundsMin,0],0);out.set([...settings.boundsMax,0],4);out.set([...dimensions,samples.length],8);out.set([settings.blendWeight,0,0,0],12);for(const [index,sample] of samples.entries()){const decoded=decodeSample(sample),base=16+index*8;out.set([...color(sample.diffuseColor),decoded.diffuse.reduce((sum,value)=>sum+value,0)>0?sample.intensity*sample.visibility:0],base);out.set([...color(sample.specularColor),sample.intensity*sample.visibility],base+4)}}return out}
