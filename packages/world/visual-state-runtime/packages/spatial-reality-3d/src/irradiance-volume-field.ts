import { cryptographicHash } from '../../spec/src/index.js';
import {
  bakeSpatialIrradianceVolume,
  packSpatialIrradianceVolumeBuffer,
  sampleSpatialIrradianceVolume,
  sanitizeSpatialIrradianceVolume,
  spatialIrradianceVolumeSourceRoot,
  spatialIrradianceVolumeTopologyRoot,
  updateSpatialIrradianceVolume,
  verifySpatialIrradianceVolume,
  VSR_SPATIAL_IRRADIANCE_VOLUME_FORMAT
} from './irradiance-volume.js';
import type {
  VSRSpatialIrradianceVolume,
  VSRSpatialIrradianceVolumeBakeOptions,
  VSRSpatialIrradianceVolumeDimensions
} from './irradiance-volume.js';
import type { VSRSpatialScene3D, Vec3 } from './index.js';

export const VSR_SPATIAL_IRRADIANCE_VOLUME_FIELD_FORMAT='vsr.spatial-irradiance-volume-field.v0.1' as const;

export interface VSRSpatialIrradianceVolumeFieldVolume {
  id:string;
  cellId?:string;
  volume:VSRSpatialIrradianceVolume;
}

export interface VSRSpatialIrradianceVolumeFieldSettings {
  blendDistance:number;
  maxVolumes:number;
  maxSamples:number;
}

export interface VSRSpatialIrradianceVolumeField {
  format:typeof VSR_SPATIAL_IRRADIANCE_VOLUME_FIELD_FORMAT;
  version:'0.1.0';
  sceneId:string;
  sourceRoot:string;
  topologyRoot:string;
  settings:VSRSpatialIrradianceVolumeFieldSettings;
  volumes:VSRSpatialIrradianceVolumeFieldVolume[];
  root:string;
}

export interface VSRSpatialIrradianceVolumeFieldVolumeOptions extends VSRSpatialIrradianceVolumeBakeOptions {
  id:string;
  cellId?:string;
  boundsMin:Vec3;
  boundsMax:Vec3;
  dimensions?:VSRSpatialIrradianceVolumeDimensions;
}

export interface VSRSpatialIrradianceVolumeFieldBakeOptions {
  volumes:VSRSpatialIrradianceVolumeFieldVolumeOptions[];
  blendDistance?:number;
  maxVolumes?:number;
  maxSamples?:number;
}

export interface VSRSpatialIrradianceVolumeFieldUpdateOptions {
  updateAlpha?:number;
  blendWeight?:number;
  visibilitySamples?:number;
  shadowBias?:number;
}

const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,value));
const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const scale=(value:Vec3,factor:number):Vec3=>[value[0]*factor,value[1]*factor,value[2]*factor];
const distance3=(a:Vec3,b:Vec3):number=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const finiteVec3=(value:unknown):value is Vec3=>Array.isArray(value)&&value.length===3&&value.every(component=>typeof component==='number'&&Number.isFinite(component));
const zero:Vec3=[0,0,0];

function fieldBase(field:VSRSpatialIrradianceVolumeField):Omit<VSRSpatialIrradianceVolumeField,'root'>{const {root:_root,...base}=field;return base}
function volumeEntries(field:VSRSpatialIrradianceVolumeField):VSRSpatialIrradianceVolumeFieldVolume[]{return field.volumes.map(entry=>({id:entry.id,...(entry.cellId?{cellId:entry.cellId}:{}),volume:sanitizeSpatialIrradianceVolume(entry.volume)!}))}
function validateVolumeOptions(options:VSRSpatialIrradianceVolumeFieldBakeOptions):void{
  if(!Array.isArray(options.volumes)||options.volumes.length<1)throw new Error('Irradiance volume field requires at least one volume.');
  if(options.volumes.length>8)throw new Error('Irradiance volume field supports at most eight volumes.');
  const ids=new Set<string>();
  for(const entry of options.volumes){
    if(!entry.id||ids.has(entry.id))throw new Error(`Duplicate irradiance volume field id ${entry.id||'unknown'}.`);
    ids.add(entry.id);
    if(!finiteVec3(entry.boundsMin)||!finiteVec3(entry.boundsMax)||entry.boundsMax.some((value,axis)=>value<=entry.boundsMin[axis]!))throw new Error(`Irradiance volume field bounds are invalid for ${entry.id}.`);
  }
}
function geometryWeight(position:Vec3,volume:VSRSpatialIrradianceVolume,blendDistance:number):{weight:number;position:Vec3}{
  const min=volume.settings.boundsMin,max=volume.settings.boundsMax,clamped:Vec3=[clamp(position[0],min[0],max[0]),clamp(position[1],min[1],max[1]),clamp(position[2],min[2],max[2])],distance=distance3(position,clamped),weight=distance<=1e-9?1:clamp(1-distance/Math.max(blendDistance,.001),0,1);return{weight,position:clamped};
}
function fieldFromEnvironment(environment:VSRSpatialIrradianceVolumeField|VSRSpatialIrradianceVolume|{irradianceVolumeField?:VSRSpatialIrradianceVolumeField;irradianceVolume?:VSRSpatialIrradianceVolume}|undefined):VSRSpatialIrradianceVolumeField|undefined{
  if(!environment)return undefined;
  if('format' in environment){if(environment.format===VSR_SPATIAL_IRRADIANCE_VOLUME_FIELD_FORMAT)return environment as VSRSpatialIrradianceVolumeField;if(environment.format===VSR_SPATIAL_IRRADIANCE_VOLUME_FORMAT)return undefined;return undefined}
  return environment.irradianceVolumeField;
}
function singleVolumeFromEnvironment(environment:VSRSpatialIrradianceVolume|VSRSpatialIrradianceVolumeField|{irradianceVolumeField?:VSRSpatialIrradianceVolumeField;irradianceVolume?:VSRSpatialIrradianceVolume}|undefined):VSRSpatialIrradianceVolume|undefined{
  if(!environment)return undefined;
  if('format' in environment)return environment.format===VSR_SPATIAL_IRRADIANCE_VOLUME_FORMAT?environment:undefined;
  return environment.irradianceVolume;
}

export function bakeSpatialIrradianceVolumeField(scene:VSRSpatialScene3D,options:VSRSpatialIrradianceVolumeFieldBakeOptions):VSRSpatialIrradianceVolumeField{
  validateVolumeOptions(options);
  const maxVolumes=clamp(Math.round(options.maxVolumes??options.volumes.length),1,8),blendDistance=clamp(Number.isFinite(options.blendDistance)?options.blendDistance??1:1,.001,10000),maxSamples=clamp(Math.round(options.maxSamples??4096),1,4096);
  if(options.volumes.length>maxVolumes)throw new Error(`Irradiance volume field received ${options.volumes.length} volumes but maxVolumes is ${maxVolumes}.`);
  const volumes=options.volumes.slice().sort((a,b)=>a.id.localeCompare(b.id)).map(entry=>({id:entry.id,...(entry.cellId?{cellId:entry.cellId}:{}),volume:bakeSpatialIrradianceVolume(scene,{...entry,boundsMin:entry.boundsMin,boundsMax:entry.boundsMax})}));
  const sampleCount=volumes.reduce((sum,entry)=>sum+entry.volume.samples.length,0);if(sampleCount>maxSamples)throw new Error(`Irradiance volume field sample budget ${sampleCount} exceeds ${maxSamples}.`);
  const sourceRoot=volumes[0]!.volume.sourceRoot,topologyRoot=volumes[0]!.volume.topologyRoot;if(volumes.some(entry=>entry.volume.sourceRoot!==sourceRoot||entry.volume.topologyRoot!==topologyRoot))throw new Error('Irradiance volume field roots are inconsistent.');
  const base={format:VSR_SPATIAL_IRRADIANCE_VOLUME_FIELD_FORMAT,version:'0.1.0' as const,sceneId:scene.sceneId,sourceRoot,topologyRoot,settings:{blendDistance,maxVolumes,maxSamples},volumes};return{...base,root:cryptographicHash(base)};
}

export function updateSpatialIrradianceVolumeField(scene:VSRSpatialScene3D,previous:VSRSpatialIrradianceVolumeField,options:VSRSpatialIrradianceVolumeFieldUpdateOptions={}):VSRSpatialIrradianceVolumeField{
  const verification=verifySpatialIrradianceVolumeField(previous);if(!verification.ok)throw new Error(verification.diagnostics.join('; '));if(previous.sceneId!==scene.sceneId)throw new Error(`Irradiance volume field scene ${previous.sceneId} does not match ${scene.sceneId}.`);
  const volumes=previous.volumes.map(entry=>({id:entry.id,...(entry.cellId?{cellId:entry.cellId}:{}),volume:updateSpatialIrradianceVolume(scene,entry.volume,options)}));if(volumes.some(entry=>entry.volume.topologyRoot!==previous.topologyRoot))throw new Error('Irradiance volume field topology root mismatch.');
  const base={...fieldBase(previous),sourceRoot:volumes[0]!.volume.sourceRoot,topologyRoot:previous.topologyRoot,volumes};return{...base,root:cryptographicHash(base)};
}

export function verifySpatialIrradianceVolumeField(field:VSRSpatialIrradianceVolumeField):{ok:boolean;diagnostics:string[]}{
  const diagnostics:string[]=[];if(field.format!==VSR_SPATIAL_IRRADIANCE_VOLUME_FIELD_FORMAT)diagnostics.push('irradiance volume field format mismatch');if(field.version!=='0.1.0')diagnostics.push('irradiance volume field version mismatch');if(!field.sceneId)diagnostics.push('irradiance volume field sceneId is missing');if(!/^[a-f0-9]{64}$/.test(field.sourceRoot)||!/^[a-f0-9]{64}$/.test(field.topologyRoot)||!/^[a-f0-9]{64}$/.test(field.root))diagnostics.push('irradiance volume field root is invalid');const settings=field.settings;if(!settings||!Number.isFinite(settings.blendDistance)||settings.blendDistance<=0||!Number.isInteger(settings.maxVolumes)||settings.maxVolumes<1||settings.maxVolumes>8||!Number.isInteger(settings.maxSamples)||settings.maxSamples<1||settings.maxSamples>4096)diagnostics.push('irradiance volume field settings are invalid');if(!Array.isArray(field.volumes)||field.volumes.length<1||field.volumes.length>(settings?.maxVolumes??0))diagnostics.push('irradiance volume field volume count is invalid');const ids=new Set<string>();let sampleCount=0;for(const entry of field.volumes??[]){if(!entry.id||ids.has(entry.id))diagnostics.push('irradiance volume field ids are invalid');ids.add(entry.id);const result=verifySpatialIrradianceVolume(entry.volume);if(!result.ok)diagnostics.push(...result.diagnostics.map(diagnostic=>`${entry.id}:${diagnostic}`));if(entry.volume.sceneId!==field.sceneId||entry.volume.sourceRoot!==field.sourceRoot||entry.volume.topologyRoot!==field.topologyRoot)diagnostics.push(`${entry.id}:volume roots do not match field`);sampleCount+=entry.volume.samples.length}if(sampleCount>(settings?.maxSamples??0))diagnostics.push('irradiance volume field sample budget is exceeded');if(cryptographicHash(fieldBase(field))!==field.root)diagnostics.push('irradiance volume field root mismatch');return{ok:diagnostics.length===0,diagnostics};
}

export function applySpatialIrradianceVolumeField(scene:VSRSpatialScene3D,field:VSRSpatialIrradianceVolumeField):VSRSpatialScene3D{
  const verification=verifySpatialIrradianceVolumeField(field);if(!verification.ok)throw new Error(verification.diagnostics.join('; '));if(field.sceneId!==scene.sceneId)throw new Error(`Irradiance volume field scene ${field.sceneId} does not match ${scene.sceneId}.`);if(field.sourceRoot!==spatialIrradianceVolumeSourceRoot(scene)||field.topologyRoot!==spatialIrradianceVolumeTopologyRoot(scene))throw new Error('Irradiance volume field source or topology root mismatch.');return{...scene,environment:{...(scene.environment??{}),irradianceVolumeField:sanitizeSpatialIrradianceVolumeField(field),irradianceVolumeFieldRoot:field.root}};
}

export function sanitizeSpatialIrradianceVolumeField(field:VSRSpatialIrradianceVolumeField|undefined):VSRSpatialIrradianceVolumeField|undefined{if(!field||!verifySpatialIrradianceVolumeField(field).ok)return undefined;return{...field,settings:{...field.settings},volumes:volumeEntries(field)}}
export function selectSpatialIrradianceVolumeField(field:VSRSpatialIrradianceVolumeField|undefined,activeCellIds?:string[]):VSRSpatialIrradianceVolumeField|undefined{if(!field)return undefined;if(activeCellIds===undefined)return field;const active=new Set(activeCellIds),volumes=field.volumes.filter(entry=>!entry.cellId||active.has(entry.cellId)).slice(0,field.settings.maxVolumes);if(!volumes.length)return undefined;const selected={...field,volumes:volumes.map(entry=>({...entry,volume:{...entry.volume,settings:{...entry.volume.settings,boundsMin:[...entry.volume.settings.boundsMin] as Vec3,boundsMax:[...entry.volume.settings.boundsMax] as Vec3,dimensions:[...entry.volume.settings.dimensions] as VSRSpatialIrradianceVolumeDimensions},samples:entry.volume.samples.map(sample=>({...sample}))}}))};return{...selected,root:cryptographicHash(fieldBase(selected))}}

export function sampleSpatialIrradianceVolumeField(field:VSRSpatialIrradianceVolumeField|undefined,worldPosition:Vec3,fallbackDiffuse:Vec3,fallbackSpecular:Vec3):{diffuse:Vec3;specular:Vec3}{
  if(!field||!field.volumes.length)return{diffuse:fallbackDiffuse,specular:fallbackSpecular};let weightedDiffuse:Vec3=[0,0,0],weightedSpecular:Vec3=[0,0,0],total=0;for(const entry of field.volumes){const geometry=geometryWeight(worldPosition,entry.volume,field.settings.blendDistance),effective=geometry.weight*clamp(entry.volume.settings.blendWeight,0,1);if(effective<=0)continue;const sample=sampleSpatialIrradianceVolume(entry.volume,geometry.position,zero,zero);weightedDiffuse=add(weightedDiffuse,scale(sample.diffuse,effective));weightedSpecular=add(weightedSpecular,scale(sample.specular,effective));total+=effective}if(total<=1e-9)return{diffuse:fallbackDiffuse,specular:fallbackSpecular};const diffuse=scale(weightedDiffuse,1/total),specular=scale(weightedSpecular,1/total),blend=clamp(total,0,1);return{diffuse:[fallbackDiffuse[0]+(diffuse[0]-fallbackDiffuse[0])*blend,fallbackDiffuse[1]+(diffuse[1]-fallbackDiffuse[1])*blend,fallbackDiffuse[2]+(diffuse[2]-fallbackDiffuse[2])*blend],specular:[fallbackSpecular[0]+(specular[0]-fallbackSpecular[0])*blend,fallbackSpecular[1]+(specular[1]-fallbackSpecular[1])*blend,fallbackSpecular[2]+(specular[2]-fallbackSpecular[2])*blend]};
}

export function packSpatialIrradianceVolumeFieldBuffer(environment:VSRSpatialIrradianceVolumeField|VSRSpatialIrradianceVolume|{irradianceVolumeField?:VSRSpatialIrradianceVolumeField;irradianceVolume?:VSRSpatialIrradianceVolume}|undefined):Float32Array{
  const field=fieldFromEnvironment(environment),single=singleVolumeFromEnvironment(environment),volumes=field?.volumes??(single?[{id:'volume:default',volume:single}]:[]),sampleCount=volumes.reduce((sum,entry)=>sum+entry.volume.samples.length,0),volumeCount=volumes.length,out=new Float32Array(4+16*Math.max(1,volumeCount)+8*Math.max(1,sampleCount));out.set([volumeCount,sampleCount,field?.settings.blendDistance??0,0],0);let sampleOffset=0;for(const [index,entry] of volumes.entries()){const base=4+index*16,settings=entry.volume.settings,dimensions=settings.dimensions,packed=packSpatialIrradianceVolumeBuffer(entry.volume);out.set([...settings.boundsMin,0],base);out.set([...settings.boundsMax,0],base+4);out.set([...dimensions,sampleOffset],base+8);out.set([settings.blendWeight,settings.shadowBias,0,0],base+12);out.set(packed.subarray(16),4+16*volumeCount+sampleOffset*8);sampleOffset+=entry.volume.samples.length}return out;
}
