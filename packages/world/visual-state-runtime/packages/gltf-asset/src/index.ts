import { cryptographicHash } from '../../spec/src/index.js';
import {
  VSR_SPATIAL_SCENE_FORMAT,
  compileSpatialFrame,
  composeSpatialSceneFragments,
  type Mat4,
  type Vec3,
  type Vec4,
  type VSRSpatialAnimationChannel,
  type VSRSpatialAnimationClip,
  type VSRSpatialAnimationPath,
  type VSRSpatialCamera,
  type VSRSpatialLight,
  type VSRSpatialMaterial,
  type VSRSpatialMesh,
  type VSRSpatialNode,
  type VSRSpatialScene3D,
  type VSRSpatialSkin,
  type VSRSpatialTexture,
  type VSRSpatialTextureLevel,
  type VSRSpatialTransform,
  identityMat4,
} from '../../spatial-reality-3d/src/index.js';

export const VSR_GLTF_ASSET_VERSION='0.2.0-alpha.1';
export const VSR_GLTF_IMPORT_FORMAT='vsr.gltf-import-receipt.v0.2' as const;

type Json=Record<string,any>;
export interface VSRGltfImageResolverInput {imageIndex:number;image:Json;id:string;sampler:Json}
export type VSRGltfImageResolver=(input:VSRGltfImageResolverInput)=>VSRSpatialTexture|undefined;
export interface VSRGltfImageDecoderInput extends VSRGltfImageResolverInput {bytes:Uint8Array;mimeType?:string}
export type VSRGltfImageDecoder=(input:VSRGltfImageDecoderInput)=>Promise<VSRSpatialTexture|undefined>;
export interface VSRGltfImportOptions {sceneId?:string;title?:string;buffers?:Record<string,Uint8Array>;imageBytes?:Record<string,Uint8Array>;defaultCamera?:boolean;imageResolver?:VSRGltfImageResolver;imageDecoder?:VSRGltfImageDecoder;sourceRoot?:string}
export interface VSRGltfImportReceipt {format:typeof VSR_GLTF_IMPORT_FORMAT;assetVersion:string;sceneId:string;meshCount:number;nodeCount:number;materialCount:number;textureCount:number;materialTextureBindingCount:number;animationCount:number;skinCount:number;morphTargetCount:number;sourceRoot:string;sceneRoot:string;warnings:string[];componentCount?:number;componentAssetIds?:string[];componentSceneRoots?:string[];compositionRoot?:string;receiptRoot:string}
export interface VSRGltfImportResult {scene:VSRSpatialScene3D;receipt:VSRGltfImportReceipt}
export interface VSRGlbParseResult {gltf:Json;binaryChunk?:Uint8Array}
export type VSRGltfTextureSourceKind='KHR_texture_basisu'|'EXT_texture_webp'|'source';
export interface VSRGltfTextureSource {imageIndex:number;kind:VSRGltfTextureSourceKind}
export type VSRExternalPbrChannelRole='base-color'|'normal'|'occlusion-roughness-metallic'|'emissive';
export interface VSRExternalPbrChannel {role:VSRExternalPbrChannelRole;bytes:Uint8Array;mimeType?:string;colorSpace?:'srgb'|'linear';uri?:string}
export interface VSRExternalPbrBinding {role:VSRExternalPbrChannelRole;materialIndex:number;imageIndex:number;textureIndex:number;uri:string;byteLength:number;colorSpace:'srgb'|'linear'}
export interface VSRExternalPbrBindingResult {gltf:Json;imageBytes:Record<string,Uint8Array>;bindings:VSRExternalPbrBinding[]}
export interface VSRGltfComponentAsset {id:string;kind?:string;format?:string;role?:string;uri?:string;metadata?:Json}
export interface VSRGltfComponentImportEntry {component_id?:string;representation_root?:string;[key:string]:unknown}
export interface VSRGltfComponentImportContext {entry:VSRGltfComponentImportEntry;assets:VSRGltfComponentAsset[];payloads:Map<string,Uint8Array>}
export interface VSRGltfComponentImportResult {status:'EXECUTED';scene:VSRSpatialScene3D;receipt:VSRGltfImportReceipt;output_root:string;consumed_asset_ids:string[];deferred_asset_ids:string[];metrics:Record<string,number>}
export interface VSRGltfComponentImportHandlerOptions {handlerId?:string;imageDecoder?:VSRGltfImageDecoder;sceneId?:(entry:VSRGltfComponentImportEntry,asset:VSRGltfComponentAsset)=>string;sourceRoot?:(entry:VSRGltfComponentImportEntry,asset:VSRGltfComponentAsset)=>string|undefined;requireExternalPbr?:boolean;consumeRigAnimation?:boolean;requireRigAnimation?:boolean;aggregateMeshAssets?:boolean;rigMeshAssetId?:string}
export interface VSRGltfComponentImportHandler {handler_id:string;compile:(context:VSRGltfComponentImportContext)=>Promise<VSRGltfComponentImportResult>;verify:(input:{result:VSRGltfComponentImportResult})=>boolean}
export const VSR_RIG_ANIMATION_IMPORT_FORMAT='vsr.rig-animation-import-receipt.v0.1' as const;
export type VSRRigAnimationRepresentationKind='rig'|'animation';
export interface VSRRigAnimationComponentImportReceipt {format:typeof VSR_RIG_ANIMATION_IMPORT_FORMAT;componentId:string;sceneId:string;representationKind:VSRRigAnimationRepresentationKind;resourceRoot:string;sceneRoot:string;nodeCount:number;rigBoneCount:number;animationClipCount:number;animationChannelCount:number;geometryFused?:boolean;geometryMeshCount?:number;externalPbrChannelCount?:number;externalPbrMaterialCount?:number;candidateOnly:true;authoritative:false;receiptRoot:string}
export interface VSRRigAnimationComponentImportResult {status:'EXECUTED';scene:VSRSpatialScene3D;receipt:VSRRigAnimationComponentImportReceipt;output_root:string;consumed_asset_ids:string[];deferred_asset_ids:string[];metrics:Record<string,number>}
export interface VSRRigAnimationComponentImportHandlerOptions {handlerId?:string;sceneId?:(entry:VSRGltfComponentImportEntry,asset:VSRGltfComponentAsset)=>string;requireRigForAnimation?:boolean;fuseGeometry?:boolean;geometryAssetId?:string;imageDecoder?:VSRGltfImageDecoder;fuseExternalPbr?:boolean;requireExternalPbr?:boolean}
export interface VSRRigAnimationComponentImportHandler {handler_id:string;compile:(context:VSRGltfComponentImportContext)=>Promise<VSRRigAnimationComponentImportResult>;verify:(input:{result:VSRRigAnimationComponentImportResult})=>boolean}
export const VSR_PARTICLE_IMPORT_FORMAT='vsr.particle-import-receipt.v0.1' as const;
export interface VSRParticleImportReceipt {format:typeof VSR_PARTICLE_IMPORT_FORMAT;componentId:string;sceneId:string;presetId:string;semanticEvent:string;presetRoot:string;effectRoot:string;emitterRoot:string;resourceRoot:string;maxParticles:number;candidateOnly:true;authoritative:false;receiptRoot:string}
export interface VSRParticleComponentImportResult {status:'EXECUTED';emitter:Json;receipt:VSRParticleImportReceipt;output_root:string;consumed_asset_ids:string[];deferred_asset_ids:string[];metrics:Record<string,number>}
export interface VSRParticleComponentImportHandlerOptions {handlerId?:string;sceneId?:(entry:VSRGltfComponentImportEntry,asset:VSRGltfComponentAsset)=>string}
export interface VSRParticleComponentImportHandler {handler_id:string;compile:(context:VSRGltfComponentImportContext)=>Promise<VSRParticleComponentImportResult>;verify:(input:{result:VSRParticleComponentImportResult})=>boolean}

const GLB_MAGIC=0x46546c67;
const GLB_VERSION=2;
const GLB_JSON_CHUNK=0x4e4f534a;
const GLB_BIN_CHUNK=0x004e4942;

const componentSize:Record<number,number>={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const componentCount:Record<string,number>={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
const readComponent=(view:DataView,offset:number,type:number):number=>{
  if(type===5120)return view.getInt8(offset);if(type===5121)return view.getUint8(offset);if(type===5122)return view.getInt16(offset,true);if(type===5123)return view.getUint16(offset,true);if(type===5125)return view.getUint32(offset,true);if(type===5126)return view.getFloat32(offset,true);throw new Error(`Unsupported glTF componentType ${type}.`);
};
function decodeDataUri(uri:string):Uint8Array{const match=/^data:([^;,]+)?(;base64)?,(.*)$/s.exec(uri);if(!match)throw new Error('Invalid data URI.');if(!match[2])return new TextEncoder().encode(decodeURIComponent(match[3]??''));const text=match[3]??'',decode=(globalThis as typeof globalThis&{atob?:(value:string)=>string}).atob;if(decode){const binary=decode(text),bytes=new Uint8Array(binary.length);for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);return bytes}return Uint8Array.from(Buffer.from(text,'base64'));}
function loadBuffers(gltf:Json,options:VSRGltfImportOptions):Uint8Array[]{return (gltf.buffers??[]).map((buffer:Json,index:number)=>{if(typeof buffer.uri==='string'){if(buffer.uri.startsWith('data:'))return decodeDataUri(buffer.uri);const value=options.buffers?.[buffer.uri];if(value)return value;throw new Error(`Missing external glTF buffer ${buffer.uri}.`)}const value=options.buffers?.[`buffer:${index}`];if(value)return value;throw new Error(`Missing binary glTF buffer ${index}.`)})}
function imageBytes(gltf:Json,imageIndex:number,buffers:Uint8Array[],options:VSRGltfImportOptions):Uint8Array|undefined{const image=gltf.images?.[imageIndex];if(typeof image?.uri==='string'){if(image.uri.startsWith('data:'))return decodeDataUri(image.uri);const external=options.imageBytes?.[image.uri];if(external)return external}if(image?.bufferView!==undefined){const view=gltf.bufferViews?.[image.bufferView],buffer=buffers[view?.buffer];if(!view||!buffer)throw new Error(`Missing glTF image bufferView ${String(image.bufferView)}.`);const start=view.byteOffset??0,end=start+(view.byteLength??0);if(start<0||end>buffer.byteLength)throw new Error(`glTF image bufferView ${String(image.bufferView)} exceeds its buffer.`);return buffer.slice(start,end)}return undefined}
export function parseGlb(input:ArrayBuffer|Uint8Array):VSRGlbParseResult{const bytes=input instanceof Uint8Array?input:new Uint8Array(input),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(bytes.byteLength<12)throw new Error('Invalid GLB: header is truncated.');if(view.getUint32(0,true)!==GLB_MAGIC)throw new Error('Invalid GLB: magic does not match glTF.');if(view.getUint32(4,true)!==GLB_VERSION)throw new Error(`Unsupported GLB version ${view.getUint32(4,true)}.`);const declaredLength=view.getUint32(8,true);if(declaredLength!==bytes.byteLength)throw new Error(`Invalid GLB: declared length ${declaredLength} does not match ${bytes.byteLength}.`);let offset=12,jsonText='',binaryChunk:Uint8Array|undefined;while(offset<declaredLength){if(offset+8>declaredLength)throw new Error('Invalid GLB: chunk header is truncated.');const chunkLength=view.getUint32(offset,true),chunkType=view.getUint32(offset+4,true),chunkStart=offset+8,chunkEnd=chunkStart+chunkLength;if(chunkEnd>declaredLength)throw new Error('Invalid GLB: chunk exceeds declared length.');if(chunkType===GLB_JSON_CHUNK){if(jsonText)throw new Error('Invalid GLB: multiple JSON chunks are not supported.');if(offset!==12)throw new Error('Invalid GLB: JSON chunk must be first.');jsonText=new TextDecoder().decode(bytes.subarray(chunkStart,chunkEnd)).replace(/\u0000+$/,'').trim()}else if(chunkType===GLB_BIN_CHUNK){if(binaryChunk)throw new Error('Invalid GLB: multiple BIN chunks are not supported.');binaryChunk=bytes.slice(chunkStart,chunkEnd)}offset=chunkEnd}if(!jsonText)throw new Error('Invalid GLB: JSON chunk is missing.');let gltf:Json;try{gltf=JSON.parse(jsonText)}catch(error){throw new Error(`Invalid GLB JSON: ${error instanceof Error?error.message:String(error)}`)}return{gltf,binaryChunk}}
function normalizedComponent(value:number,componentType:number):number{if(componentType===5121)return value/255;if(componentType===5123)return value/65535;if(componentType===5125)return value/4294967295;if(componentType===5120)return Math.max(value/127,-1);if(componentType===5122)return Math.max(value/32767,-1);return value}
function readAccessorData(gltf:Json,buffers:Uint8Array[],bufferView:Json|undefined,count:number,type:string,componentType:number,byteOffset=0,normalized=false):number[]{const components=componentCount[type],size=componentSize[componentType];if(!components||!size)throw new Error(`Unsupported accessor layout ${type}/${componentType}.`);if(!bufferView)return new Array<number>(count*components).fill(0);const buffer=buffers[bufferView.buffer];if(!buffer)throw new Error(`Missing glTF buffer ${bufferView.buffer}.`);const stride=bufferView.byteStride??components*size,base=(bufferView.byteOffset??0)+byteOffset,view=new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength),values:number[]=[];for(let item=0;item<count;item++)for(let component=0;component<components;component++){const value=readComponent(view,base+item*stride+component*size,componentType);values.push(normalized?normalizedComponent(value,componentType):value)}return values}
function accessorValues(gltf:Json,buffers:Uint8Array[],index:number):number[]{const accessor=gltf.accessors?.[index];if(!accessor)throw new Error(`Missing glTF accessor ${index}.`);const components=componentCount[accessor.type];if(!components)throw new Error(`Unsupported glTF accessor type ${accessor.type}.`);const values=readAccessorData(gltf,buffers,gltf.bufferViews?.[accessor.bufferView],accessor.count,accessor.type,accessor.componentType,accessor.byteOffset??0,Boolean(accessor.normalized)),sparse=accessor.sparse;if(!sparse)return values;const sparseIndicesView=gltf.bufferViews?.[sparse.indices?.bufferView],sparseValuesView=gltf.bufferViews?.[sparse.values?.bufferView],sparseCount=Number(sparse.count??0),indexType=Number(sparse.indices?.componentType);if(!sparseIndicesView||!sparseValuesView||!sparseCount)throw new Error(`Accessor ${index} sparse declaration is incomplete.`);const sparseIndices=readAccessorData(gltf,buffers,sparseIndicesView,sparseCount,'SCALAR',indexType,sparse.indices.byteOffset??0),sparseValues=readAccessorData(gltf,buffers,sparseValuesView,sparseCount,accessor.type,accessor.componentType,sparse.values.byteOffset??0,Boolean(accessor.normalized));for(let item=0;item<sparseCount;item++){const target=Math.trunc(sparseIndices[item]!);if(target<0||target>=accessor.count)throw new Error(`Accessor ${index} sparse index ${target} is out of range.`);for(let component=0;component<components;component++)values[target*components+component]=sparseValues[item*components+component]!}return values}
const colorHex=(value:number[]|undefined,fallback='#ffffff'):string=>{if(!value)return fallback;const c=value.map((entry,index)=>Math.max(0,Math.min(255,Math.round((index===3?entry:Math.pow(entry,1/2.2))*255))));return`#${c.slice(0,4).map(v=>v.toString(16).padStart(2,'0')).join('')}`};
function quaternionValue(q:number[]|undefined):Vec4|undefined{if(!q)return undefined;return[q[0]??0,q[1]??0,q[2]??0,q[3]??1]}
function matrixValue(matrix:number[]|undefined):Mat4|undefined{if(!matrix||matrix.length!==16)return undefined;return[matrix[0]!,matrix[4]!,matrix[8]!,matrix[12]!,matrix[1]!,matrix[5]!,matrix[9]!,matrix[13]!,matrix[2]!,matrix[6]!,matrix[10]!,matrix[14]!,matrix[3]!,matrix[7]!,matrix[11]!,matrix[15]!]}
function textureSampling(sampler:Json):Pick<VSRSpatialTexture,'wrapU'|'wrapV'|'filter'>{return{wrapU:sampler.wrapS===33071?'clamp':'repeat',wrapV:sampler.wrapT===33071?'clamp':'repeat',filter:sampler.magFilter===9728||sampler.minFilter===9728?'nearest':'linear'}}
export function resolveGltfTextureSource(texture:Json):VSRGltfTextureSource|undefined{const candidates:[[VSRGltfTextureSourceKind,unknown],[VSRGltfTextureSourceKind,unknown],[VSRGltfTextureSourceKind,unknown]]=[['KHR_texture_basisu',texture.extensions?.KHR_texture_basisu?.source],['EXT_texture_webp',texture.extensions?.EXT_texture_webp?.source],['source',texture.source]];for(const [kind,value] of candidates)if(Number.isInteger(value)&&Number(value)>=0)return{imageIndex:Number(value),kind};return undefined}
/**
 * Attach an independently materialized external PBR pack to a glTF material.
 * This is deliberately a representation/import adapter: it copies channel
 * bytes into the caller-owned imageBytes map and never writes a source GLB or
 * any canonical world state. The async importer remains responsible for
 * decoding those bytes into VSR RGBA textures.
 */
export function bindExternalPbrChannelsToGltf(gltf:Json,channels:VSRExternalPbrChannel[],{materialIndex=0,sourcePrefix='vsr-external-pbr'}:{materialIndex?:number;sourcePrefix?:string}={}):VSRExternalPbrBindingResult{
  if(!gltf||typeof gltf!=='object'||!Array.isArray(channels)||channels.length===0)throw new Error('External PBR binding requires a glTF object and at least one channel.');
  const material=gltf.materials?.[materialIndex];if(!material||typeof material!=='object')throw new Error(`External PBR material ${materialIndex} is missing.`);
  const roles=new Set<VSRExternalPbrChannelRole>();for(const channel of channels){if(!channel||!['base-color','normal','occlusion-roughness-metallic','emissive'].includes(channel.role)||roles.has(channel.role)||!(channel.bytes instanceof Uint8Array)||channel.bytes.byteLength===0)throw new Error(`Invalid external PBR channel ${String(channel?.role)}.`);roles.add(channel.role)}
  const next=JSON.parse(JSON.stringify(gltf)) as Json,nextMaterial=next.materials[materialIndex] as Json,nextPbr=(nextMaterial.pbrMetallicRoughness??={}) as Json,nextImages=Array.isArray(next.images)?next.images:[],nextTextures=Array.isArray(next.textures)?next.textures:[],imageBytes:Record<string,Uint8Array>={},bindings:VSRExternalPbrBinding[]=[];
  for(const channel of channels){const imageIndex=nextImages.length,textureIndex=nextTextures.length,uri=channel.uri??`${sourcePrefix}/${channel.role}.png`,colorSpace=channel.colorSpace??(channel.role==='normal'||channel.role==='occlusion-roughness-metallic'?'linear':'srgb');nextImages.push({uri,mimeType:channel.mimeType??'image/png',extras:{vsrExternalPbrRole:channel.role,vsrColorSpace:colorSpace}});nextTextures.push({source:imageIndex});imageBytes[uri]=new Uint8Array(channel.bytes);if(channel.role==='base-color')nextPbr.baseColorTexture={index:textureIndex};else if(channel.role==='normal')nextMaterial.normalTexture={index:textureIndex};else if(channel.role==='occlusion-roughness-metallic'){nextPbr.metallicRoughnessTexture={index:textureIndex};nextMaterial.occlusionTexture={index:textureIndex}}else if(channel.role==='emissive')nextMaterial.emissiveTexture={index:textureIndex};bindings.push({role:channel.role,materialIndex,imageIndex,textureIndex,uri,byteLength:channel.bytes.byteLength,colorSpace})}
  next.images=nextImages;next.textures=nextTextures;return{gltf:next,imageBytes,bindings}
}
function componentPbrRole(asset:VSRGltfComponentAsset):VSRExternalPbrChannelRole|undefined{
  const value=String(asset.metadata?.pbr_role??asset.metadata?.pbrRole??asset.role??asset.metadata?.role??'').trim().toLowerCase().replace(/_/g,'-');
  if(['base-color','basecolor','pbr-base-color','albedo','pbr-albedo'].includes(value))return'base-color';
  if(['normal','pbr-normal'].includes(value))return'normal';
  if(['orm','pbr-orm','occlusion-roughness-metallic','metallic-roughness','occlusion-roughness-metallic-pack'].includes(value))return'occlusion-roughness-metallic';
  if(['emissive','pbr-emissive'].includes(value))return'emissive';
  return undefined;
}
function componentPbrMaterialIndex(asset:VSRGltfComponentAsset):number{
  const raw=asset.metadata?.material_index??asset.metadata?.materialIndex??asset.metadata?.material_id??asset.metadata?.materialId;
  if(raw===undefined||raw===null||raw==='')return 0;
  const index=Number(raw);if(!Number.isSafeInteger(index)||index<0)throw new Error(`VSR glTF component PBR material index ${String(raw)} is invalid.`);return index;
}
function componentAssetBytes(payloads:Map<string,Uint8Array>,asset:VSRGltfComponentAsset):Uint8Array{
  const bytes=payloads.get(asset.id);if(!(bytes instanceof Uint8Array)||bytes.byteLength===0)throw new Error(`VSR glTF component payload ${asset.id} is missing or empty.`);return bytes;
}
function componentAssetFormat(asset:VSRGltfComponentAsset):string{return String(asset.format??asset.metadata?.format??'').toLowerCase()}
function componentAssetUri(asset:VSRGltfComponentAsset,role:VSRExternalPbrChannelRole):string{return String(asset.uri??asset.metadata?.uri??`vsr-external-pbr/${asset.id}/${role}.png`)}
function componentTargetMeshAssetId(asset:VSRGltfComponentAsset,meshAssets:VSRGltfComponentAsset[],role:string):string{
  const raw=asset.metadata?.mesh_asset_id??asset.metadata?.meshAssetId??asset.metadata?.mesh_id??asset.metadata?.meshId??asset.metadata?.mesh_index??asset.metadata?.meshIndex;
  if(raw===undefined||raw===null||raw===''){if(meshAssets.length===1)return meshAssets[0]!.id;throw new Error(`VSR glTF component ${role} resource ${asset.id} must declare mesh_asset_id or mesh_index when multiple mesh assets are present.`)}
  if(typeof raw==='number'||(typeof raw==='string'&&/^\d+$/.test(raw))){const index=Number(raw);if(!Number.isSafeInteger(index)||index<0||index>=meshAssets.length)throw new Error(`VSR glTF component ${role} resource ${asset.id} mesh index is out of range.`);return meshAssets[index]!.id}
  const target=String(raw);if(!meshAssets.some(candidate=>candidate.id===target))throw new Error(`VSR glTF component ${role} resource ${asset.id} targets an unknown mesh asset.`);return target;
}
function componentAuxiliaryMeshAsset(binding:VSRComponentAuxiliaryBinding|undefined,meshAssets:VSRGltfComponentAsset[],explicitId:string|undefined):VSRGltfComponentAsset|undefined{
  if(!binding)return undefined;
  const raw=explicitId??binding.asset.metadata?.mesh_asset_id??binding.asset.metadata?.meshAssetId??binding.asset.metadata?.mesh_id??binding.asset.metadata?.meshId??binding.asset.metadata?.mesh_index??binding.asset.metadata?.meshIndex;
  if(raw===undefined||raw===null||raw===''){if(meshAssets.length===1)return meshAssets[0];throw new Error('VSR glTF component rig/animation binding requires an explicit rigMeshAssetId or mesh_asset_id with multiple mesh assets.')}
  if(typeof raw==='number'||(typeof raw==='string'&&/^\d+$/.test(raw))){const index=Number(raw);if(!Number.isSafeInteger(index)||index<0||index>=meshAssets.length)throw new Error('VSR glTF component rig/animation mesh index is out of range.');return meshAssets[index]}
  const target=meshAssets.find(asset=>asset.id===String(raw));if(!target)throw new Error(`VSR glTF component rig/animation targets unknown mesh asset ${String(raw)}.`);return target;
}
type VSRComponentAuxiliaryRole='rig'|'animation';
interface VSRComponentAuxiliaryBinding {asset:VSRGltfComponentAsset;bytes:Uint8Array}
function componentAuxiliaryRole(asset:VSRGltfComponentAsset):VSRComponentAuxiliaryRole|undefined{
  const value=String(asset.metadata?.role??asset.role??'').trim().toLowerCase().replace(/_/g,'-'),format=componentAssetFormat(asset);
  if(asset.kind==='animation'||value.includes('animation')||value.includes('motion')||value.includes('clip')||format.includes('animation'))return'animation';
  if(asset.kind==='rig'||value.includes('rig')||value.includes('skeleton')||format.includes('skeleton'))return'rig';
  return undefined;
}
function componentAuxiliaryAsset(assets:VSRGltfComponentAsset[],payloads:Map<string,Uint8Array>,role:VSRComponentAuxiliaryRole):VSRComponentAuxiliaryBinding|undefined{
  const candidates=assets.filter(asset=>componentAuxiliaryRole(asset)===role).sort((left,right)=>left.id.localeCompare(right.id));if(!candidates.length)return undefined;
  const first=candidates[0]!,bytes=componentAssetBytes(payloads,first),byteRoot=cryptographicHash([...bytes]);for(const candidate of candidates.slice(1)){if(cryptographicHash([...componentAssetBytes(payloads,candidate)])!==byteRoot)throw new Error(`VSR glTF component ${role} resources have conflicting payloads.`)}return{asset:first,bytes};
}
function componentJsonPayload(payloads:Map<string,Uint8Array>,asset:VSRGltfComponentAsset):Json{
  try{const value=JSON.parse(new TextDecoder().decode(componentAssetBytes(payloads,asset)));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('JSON root must be an object.');return value as Json}catch(error){throw new Error(`VSR glTF component ${roleForError(asset)} payload is invalid JSON: ${error instanceof Error?error.message:String(error)}`)}
}
function roleForError(asset:VSRGltfComponentAsset):string{return componentAuxiliaryRole(asset)??'auxiliary'}
function componentNameMatches(expected:string,actual:string,index:number):boolean{return expected===actual||(expected==='root'&&index===0&&actual==='Armature')}
function validateComponentRigAnimationBinding(gltf:Json,rig:Json,animation:Json,expectedAssetId?:string):{rigBoneCount:number;animationClipCount:number}{
  if(rig.format!=='reality-asset.skeleton-rig.v0.4'||!Array.isArray(rig.bones)||!rig.bones.length||typeof rig.rig_root!=='string'||!/^[0-9a-f]{64}$/i.test(rig.rig_root))throw new Error('VSR glTF component rig contract is invalid.');
  if(animation.format!=='reality-asset.animation-clips.v0.4'||!Array.isArray(animation.clips)||!animation.clips.length||typeof animation.clip_root!=='string'||!/^[0-9a-f]{64}$/i.test(animation.clip_root))throw new Error('VSR glTF component animation contract is invalid.');
  if(expectedAssetId&&rig.asset_id!==expectedAssetId)throw new Error('VSR glTF component rig asset identity is not bound.');
  if(expectedAssetId&&animation.asset_id!==expectedAssetId)throw new Error('VSR glTF component animation asset identity is not bound.');
  const skin=gltf.skins?.[0];if(!skin||!Array.isArray(skin.joints)||skin.joints.length!==rig.bones.length)throw new Error('VSR glTF component rig is not bound to the imported skin.');
  const jointNames=skin.joints.map((joint:number,index:number)=>String(gltf.nodes?.[joint]?.name??`node-${index}`));for(let index=0;index<rig.bones.length;index++){const bone=rig.bones[index];if(!bone||typeof bone.name!=='string'||!componentNameMatches(bone.name,jointNames[index]!,index))throw new Error(`VSR glTF component rig bone ${index} is not bound to the imported skin.`);if(bone.parent!==null&&typeof bone.parent!=='string')throw new Error(`VSR glTF component rig parent ${index} is invalid.`);if(typeof bone.parent==='string'&&!rig.bones.some((candidate:Json)=>candidate.name===bone.parent))throw new Error(`VSR glTF component rig parent ${bone.parent} is missing.`)}
  const gltfAnimations=Array.isArray(gltf.animations)?gltf.animations:[];for(const clip of animation.clips){if(!clip||typeof clip.name!=='string'||!Number.isFinite(Number(clip.duration))||!Array.isArray(clip.tracks))throw new Error('VSR glTF component animation clip contract is invalid.');const candidate=gltfAnimations.find((item:Json,index:number)=>String(item?.name??`clip-${index}`)===clip.name);if(!candidate)throw new Error(`VSR glTF component animation clip ${clip.name} is not embedded.`);for(const track of clip.tracks){if(!track||typeof track.bone!=='string'||!Array.isArray(track.times)||!Array.isArray(track.values))throw new Error(`VSR glTF component animation track ${clip.name} is invalid.`);const nodeIndex=(gltf.nodes??[]).findIndex((node:Json,index:number)=>componentNameMatches(track.bone,String(node?.name??''),index));if(nodeIndex<0)throw new Error(`VSR glTF component animation bone ${track.bone} is not embedded.`);const path=track.path==='rotation'?'rotation':track.path;if(!['translation','rotation','scale'].includes(path)||!(candidate.channels??[]).some((channel:Json)=>channel?.target?.node===nodeIndex&&channel?.target?.path===path))throw new Error(`VSR glTF component animation track ${clip.name}/${track.bone}/${String(track.path)} is not bound.`)}}
  return{rigBoneCount:rig.bones.length,animationClipCount:animation.clips.length};
}
type VSRGltfComponentPbrChannel={role:VSRExternalPbrChannelRole;materialIndex:number;asset:VSRGltfComponentAsset;bytes:Uint8Array};
type VSRGltfComponentPbrGroup={materialIndex:number;channels:VSRGltfComponentPbrChannel[]};
type VSRGltfComponentMeshImport={asset:VSRGltfComponentAsset;bytes:Uint8Array;parsed:VSRGlbParseResult;imported:VSRGltfImportResult;external:VSRGltfComponentPbrChannel[];externalGroups:VSRGltfComponentPbrGroup[]};
/**
 * Build a reusable component-level VSR importer for one or more mesh GLBs plus an
 * optional independently materialized four-channel PBR packs, one per glTF
 * material when material indices are declared. Multiple GLBs are imported
 * independently and then composed under isolated VSR namespaces. The handler is
 * deliberately structural: large-world orchestration owns coverage and
 * receipts, while this VSR adapter owns glTF/PBR interpretation only.
 */
export function createVsrGltfPbrComponentImportHandler(options:VSRGltfComponentImportHandlerOptions={}):VSRGltfComponentImportHandler{
  const handler_id=options.handlerId??'vsr.gltf-pbr-component-import.v0.1',roles:VSRExternalPbrChannelRole[]=['base-color','normal','occlusion-roughness-metallic','emissive'];
  return{
    handler_id,
    compile:async({entry,assets,payloads})=>{
      if(!Array.isArray(assets)||!(payloads instanceof Map))throw new Error('VSR glTF component import requires an asset list and payload map.');
      const meshAssets=assets.filter(asset=>asset.kind==='mesh'&&componentAssetFormat(asset)==='model/gltf-binary').sort((left,right)=>left.id.localeCompare(right.id));
      if(!meshAssets.length)throw new Error('VSR glTF component import requires a model/gltf-binary mesh asset.');
      const consumeRigAnimation=Boolean(options.consumeRigAnimation||options.requireRigAnimation),rig=componentAuxiliaryAsset(assets,payloads,'rig'),animation=componentAuxiliaryAsset(assets,payloads,'animation');
      if(options.requireRigAnimation&&(!rig||!animation))throw new Error('VSR glTF component import requires both rig and animation resources.');
      if(consumeRigAnimation&&(rig||animation)&&(!rig||!animation))throw new Error('VSR glTF component rig/animation resources are incomplete.');
      const meshAsset=meshAssets[0]!,selectedMeshAssets=options.aggregateMeshAssets===false?[meshAsset]:meshAssets,componentId=String(entry.component_id??meshAsset.id),sceneId=options.sceneId?.(entry,meshAsset)??`component-vsr-import-${componentId}`,sourceRoot=options.sourceRoot?.(entry,meshAsset)??entry.representation_root??cryptographicHash({componentId,meshAssets:selectedMeshAssets.map(asset=>({id:asset.id,byteRoot:cryptographicHash([...componentAssetBytes(payloads,asset)])}))}),grouped=new Map<string,Map<number,Map<VSRExternalPbrChannelRole,{asset:VSRGltfComponentAsset;bytes:Uint8Array}>>>();
      for(const asset of assets){const role=componentPbrRole(asset);if(!role||!(asset.kind==='texture'||componentAssetFormat(asset).startsWith('image/')))continue;const meshAssetId=componentTargetMeshAssetId(asset,selectedMeshAssets,'PBR'),materialIndex=componentPbrMaterialIndex(asset),bytes=componentAssetBytes(payloads,asset),meshGroups=grouped.get(meshAssetId)??new Map<number,Map<VSRExternalPbrChannelRole,{asset:VSRGltfComponentAsset;bytes:Uint8Array}>>(),materialGroup=meshGroups.get(materialIndex)??new Map<VSRExternalPbrChannelRole,{asset:VSRGltfComponentAsset;bytes:Uint8Array}>(),existing=materialGroup.get(role);if(existing){if(cryptographicHash([...existing.bytes])!==cryptographicHash([...bytes]))throw new Error(`VSR glTF component mesh ${meshAssetId} material ${materialIndex} PBR role ${role} has conflicting payloads.`);continue}materialGroup.set(role,{asset,bytes});meshGroups.set(materialIndex,materialGroup);grouped.set(meshAssetId,meshGroups)}
      const meshImports:Array<VSRGltfComponentMeshImport>=[];
      for(let meshIndex=0;meshIndex<selectedMeshAssets.length;meshIndex++){
        const currentMesh=selectedMeshAssets[meshIndex]!,meshBytes=componentAssetBytes(payloads,currentMesh),parsed=parseGlb(meshBytes),meshGroups=grouped.get(currentMesh.id)??new Map<number,Map<VSRExternalPbrChannelRole,{asset:VSRGltfComponentAsset;bytes:Uint8Array}>>(),externalGroups=[...meshGroups.entries()].sort(([left],[right])=>left-right).map(([materialIndex,materialGroup])=>{const channels=roles.flatMap(role=>{const value=materialGroup.get(role);return value?[{role,materialIndex,asset:value.asset,bytes:value.bytes}]:[]});if(channels.length!==roles.length)throw new Error(`VSR glTF component mesh ${currentMesh.id} material ${materialIndex} external PBR pack is incomplete: ${channels.length}/${roles.length} channels.`);return{materialIndex,channels}}),external=externalGroups.flatMap(group=>group.channels),materialCount=Array.isArray(parsed.gltf.materials)?parsed.gltf.materials.length:0;
        if(externalGroups.some(group=>group.materialIndex>=materialCount))throw new Error(`VSR glTF component mesh ${currentMesh.id} external PBR material index is out of range.`);
        if(options.requireExternalPbr&&(!externalGroups.length||externalGroups.length!==materialCount))throw new Error(`VSR glTF component mesh ${currentMesh.id} requires one complete external PBR pack per material: ${externalGroups.length}/${materialCount}.`);
        if(external.length&&!options.imageDecoder)throw new Error('VSR glTF component external PBR import requires an image decoder.');
        let importedGltf=parsed.gltf,externalImageBytes:Record<string,Uint8Array>={};for(const group of externalGroups){const bound=bindExternalPbrChannelsToGltf(importedGltf,group.channels.map(channel=>({role:channel.role,bytes:channel.bytes,mimeType:componentAssetFormat(channel.asset)||'image/png',colorSpace:channel.role==='normal'||channel.role==='occlusion-roughness-metallic'?'linear':'srgb',uri:componentAssetUri(channel.asset,channel.role)})),{materialIndex:group.materialIndex,sourcePrefix:`vsr-external-pbr/${componentId}/mesh-${meshIndex}/material-${group.materialIndex}`});importedGltf=bound.gltf;externalImageBytes={...externalImageBytes,...bound.imageBytes}}
        const imported=await importGltfToSpatialSceneAsync(importedGltf,{sceneId:selectedMeshAssets.length===1?sceneId:`${sceneId}:mesh:${meshIndex}`,sourceRoot:selectedMeshAssets.length===1?sourceRoot:cryptographicHash({sourceRoot,meshAssetId:currentMesh.id,meshRoot:cryptographicHash([...meshBytes])}),buffers:{'buffer:0':parsed.binaryChunk??new Uint8Array()},imageBytes:externalImageBytes,imageDecoder:options.imageDecoder});if(external.length&&imported.receipt.warnings.length)throw new Error(`VSR glTF component external PBR decode produced warnings: ${imported.receipt.warnings.join(';')}`);meshImports.push({asset:currentMesh,bytes:meshBytes,parsed,imported,external,externalGroups})
      }
      const auxiliaryMetrics=consumeRigAnimation&&rig&&animation?(()=>{const rigTarget=componentAuxiliaryMeshAsset(rig,selectedMeshAssets,options.rigMeshAssetId),animationTarget=componentAuxiliaryMeshAsset(animation,selectedMeshAssets,options.rigMeshAssetId);if(!rigTarget||!animationTarget||rigTarget.id!==animationTarget.id)throw new Error('VSR glTF component rig/animation resources must target the same mesh asset.');const target=meshImports.find(candidate=>candidate.asset.id===rigTarget.id);if(!target)throw new Error('VSR glTF component rig/animation target mesh was not imported.');return{...validateComponentRigAnimationBinding(target.parsed.gltf,componentJsonPayload(payloads,rig.asset),componentJsonPayload(payloads,animation.asset),typeof entry.asset_id==='string'?entry.asset_id:undefined),targetMeshAssetId:target.asset.id}})():{rigBoneCount:0,animationClipCount:0,targetMeshAssetId:undefined};
      if(consumeRigAnimation&&rig&&animation){const target=meshImports.find(candidate=>candidate.asset.id===auxiliaryMetrics.targetMeshAssetId)!;if(target.imported.receipt.skinCount<1||target.imported.receipt.animationCount<auxiliaryMetrics.animationClipCount)throw new Error('VSR glTF component rig/animation resources were not bound by the imported scene.')}
      const sceneResult=meshImports.length===1?{scene:meshImports[0]!.imported.scene,compositionRoot:undefined as string|undefined}:(()=>{const composed=composeSpatialSceneFragments(meshImports.map((candidate,index)=>({id:candidate.asset.id,scene:candidate.imported.scene,tags:[`vsr-component-mesh:${index}`,`mesh-asset:${candidate.asset.id}`]})),{sceneId,worldId:`world:${sceneId}`,realityRoot:sourceRoot});return{scene:composed.scene,compositionRoot:composed.receipt.receiptRoot}})(),scene=sceneResult.scene,allExternalGroups=meshImports.flatMap(candidate=>candidate.externalGroups),external=meshImports.flatMap(candidate=>candidate.external),singleReceipt=meshImports.length===1?meshImports[0]!.imported.receipt:undefined,aggregateReceiptBase=singleReceipt?undefined:{format:VSR_GLTF_IMPORT_FORMAT,assetVersion:VSR_GLTF_ASSET_VERSION,sceneId,meshCount:scene.meshes.length,nodeCount:scene.nodes.length,materialCount:scene.materials.length,textureCount:scene.textures?.length??0,materialTextureBindingCount:scene.materials.reduce((sum,material)=>sum+[material.baseColorTextureId,material.metallicRoughnessTextureId,material.normalTextureId,material.occlusionTextureId,material.emissiveTextureId].filter(Boolean).length,0),animationCount:scene.animations?.length??0,skinCount:scene.skins?.length??0,morphTargetCount:scene.meshes.reduce((sum,mesh)=>sum+(mesh.morphTargets?.length??0),0),sourceRoot,sceneRoot:cryptographicHash(scene),warnings:meshImports.flatMap(candidate=>candidate.imported.receipt.warnings),componentCount:meshImports.length,componentAssetIds:meshImports.map(candidate=>candidate.asset.id),componentSceneRoots:meshImports.map(candidate=>candidate.imported.receipt.sceneRoot),compositionRoot:sceneResult.compositionRoot},receipt=singleReceipt??{...aggregateReceiptBase!,receiptRoot:cryptographicHash(aggregateReceiptBase!)};
      const consumed_asset_ids=[...selectedMeshAssets.map(asset=>asset.id),...external.map(channel=>channel.asset.id),...(consumeRigAnimation&&rig&&animation?[rig.asset.id,animation.asset.id]:[])],consumed=new Set(consumed_asset_ids),deferred_asset_ids=assets.map(asset=>asset.id).filter(id=>!consumed.has(id));
      return{status:'EXECUTED',scene,receipt,output_root:receipt.sceneRoot,consumed_asset_ids,deferred_asset_ids,metrics:{mesh_count:receipt.meshCount,node_count:receipt.nodeCount,material_count:receipt.materialCount,texture_count:receipt.textureCount,material_texture_binding_count:receipt.materialTextureBindingCount,skin_count:receipt.skinCount,animation_count:receipt.animationCount,external_pbr_channel_count:external.length,external_pbr_material_count:allExternalGroups.length,external_pbr_binding_count:external.length,external_pbr_byte_length:external.reduce((sum,channel)=>sum+channel.bytes.byteLength,0),rig_bone_count:auxiliaryMetrics.rigBoneCount,animation_clip_count:auxiliaryMetrics.animationClipCount,warning_count:receipt.warnings.length}};
    },
    verify:({result})=>Boolean(result&&result.status==='EXECUTED'&&typeof result.output_root==='string'&&result.output_root.length===64&&result.output_root===result.receipt.sceneRoot&&cryptographicHash(result.scene)===result.receipt.sceneRoot&&verifyGltfImportReceipt(result.receipt))
  }
}

type VSRStandaloneRigBone={name:string;parent:string|null;translation:Vec3;rotation:Vec4};
type VSRStandaloneAnimationTrack={bone:string;path:VSRSpatialAnimationPath;times:number[];values:(Vec3|Vec4)[];interpolation:'LINEAR'|'STEP'};
type VSRStandaloneAnimationClip={name:string;duration:number;tracks:VSRStandaloneAnimationTrack[]};

function standaloneFiniteVector(value:unknown,length:number,field:string):number[]{
  if(!Array.isArray(value)||value.length!==length||value.some(component=>typeof component!=='number'||!Number.isFinite(component)))throw new Error(`VSR rig/animation ${field} must be a finite ${length}-component vector.`);
  return value.map(component=>Number(component));
}
function standaloneAssetId(entry:VSRGltfComponentImportEntry,fallback:string):string{const value=String(entry.component_id??entry.componentId??fallback).trim();if(!value)throw new Error('VSR rig/animation component id is required.');return value}
function standaloneRepresentationKind(entry:VSRGltfComponentImportEntry):VSRRigAnimationRepresentationKind{const value=String(entry.representation_kind??entry.representationKind??'').trim().toLowerCase();if(value!=='rig'&&value!=='animation')throw new Error(`VSR rig/animation handler does not support representation kind ${value||'missing'}.`);return value}
function standalonePayloadJson(payloads:Map<string,Uint8Array>,asset:VSRGltfComponentAsset):Json{try{const value=JSON.parse(new TextDecoder().decode(componentAssetBytes(payloads,asset)));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('JSON root must be an object.');return value as Json}catch(error){throw new Error(`VSR rig/animation ${roleForError(asset)} payload is invalid JSON: ${error instanceof Error?error.message:String(error)}`)}}
function standaloneRig(rig:Json,expectedAssetId?:string):VSRStandaloneRigBone[]{
  if(rig.format!=='reality-asset.skeleton-rig.v0.4'||!Array.isArray(rig.bones)||!rig.bones.length||typeof rig.rig_root!=='string'||!/^[0-9a-f]{64}$/i.test(rig.rig_root))throw new Error('VSR rig/animation rig contract is invalid.');
  if(expectedAssetId&&rig.asset_id!==expectedAssetId)throw new Error('VSR rig/animation rig asset identity is not bound.');
  if(rig.metrics?.bone_count!==undefined&&Number(rig.metrics.bone_count)!==rig.bones.length)throw new Error('VSR rig/animation rig bone metric is inconsistent.');
  if(rig.limits?.max_bones!==undefined&&(!Number.isSafeInteger(Number(rig.limits.max_bones))||Number(rig.limits.max_bones)<rig.bones.length))throw new Error('VSR rig/animation rig exceeds its declared bone budget.');
  const names=new Set<string>(),bones:VSRStandaloneRigBone[]=[];let rootCount=0;
  for(let index=0;index<rig.bones.length;index++){
    const bone=rig.bones[index];if(!bone||typeof bone.name!=='string'||!bone.name.trim()||names.has(bone.name))throw new Error(`VSR rig/animation rig bone ${index} has an invalid or duplicate name.`);names.add(bone.name);
    if(bone.parent!==null&&typeof bone.parent!=='string')throw new Error(`VSR rig/animation rig parent ${bone.name} is invalid.`);if(bone.parent===null)rootCount++;
    const rest=bone.rest;if(!rest||typeof rest!=='object')throw new Error(`VSR rig/animation rig bone ${bone.name} has no rest transform.`);
    const translation=standaloneFiniteVector(rest.translation,3,`rig bone ${bone.name} translation`) as Vec3,rotation=standaloneFiniteVector(rest.rotation,4,`rig bone ${bone.name} rotation`) as Vec4;
    bones.push({name:bone.name,parent:bone.parent,translation,rotation});
  }
  if(rootCount!==1)throw new Error('VSR rig/animation rig must contain exactly one root bone.');
  for(const bone of bones){if(bone.parent!==null&&!names.has(bone.parent))throw new Error(`VSR rig/animation rig parent ${bone.parent} is missing.`);const seen=new Set<string>();let cursor:VSRStandaloneRigBone|undefined=bone;while(cursor){if(seen.has(cursor.name))throw new Error(`VSR rig/animation rig hierarchy cycles at ${cursor.name}.`);seen.add(cursor.name);if(cursor.parent===null)break;cursor=bones.find(candidate=>candidate.name===cursor!.parent)}}
  return bones;
}
function standaloneAnimation(animation:Json,expectedAssetId?:string,rigNames?:Set<string>):VSRStandaloneAnimationClip[]{
  if(animation.format!=='reality-asset.animation-clips.v0.4'||!Array.isArray(animation.clips)||!animation.clips.length||typeof animation.clip_root!=='string'||!/^[0-9a-f]{64}$/i.test(animation.clip_root))throw new Error('VSR rig/animation animation contract is invalid.');
  if(expectedAssetId&&animation.asset_id!==expectedAssetId)throw new Error('VSR rig/animation animation asset identity is not bound.');
  const clipNames=new Set<string>(),clips:VSRStandaloneAnimationClip[]=[];
  for(let clipIndex=0;clipIndex<animation.clips.length;clipIndex++){
    const clip=animation.clips[clipIndex];if(!clip||typeof clip.name!=='string'||!clip.name.trim()||clipNames.has(clip.name))throw new Error(`VSR rig/animation clip ${clipIndex} has an invalid or duplicate name.`);clipNames.add(clip.name);
    if(typeof clip.duration!=='number'||!Number.isFinite(clip.duration)||clip.duration<0||!Array.isArray(clip.tracks)||!clip.tracks.length)throw new Error(`VSR rig/animation clip ${clip.name} contract is invalid.`);
    const trackKeys=new Set<string>(),tracks:VSRStandaloneAnimationTrack[]=[];
    for(let trackIndex=0;trackIndex<clip.tracks.length;trackIndex++){
      const track=clip.tracks[trackIndex];if(!track||typeof track.bone!=='string'||!track.bone.trim()||!Array.isArray(track.times)||!Array.isArray(track.values)||track.times.length!==track.values.length||!track.times.length)throw new Error(`VSR rig/animation track ${clip.name}/${trackIndex} contract is invalid.`);
      if(rigNames&&!rigNames.has(track.bone))throw new Error(`VSR rig/animation track ${clip.name}/${track.bone} references an unknown rig bone.`);
      const rawPath=String(track.path??'').trim();let path:VSRSpatialAnimationPath,dimension:number;
      if(rawPath==='translation'){path='translation';dimension=3}else if(rawPath==='scale'){path='scale';dimension=3}else if(rawPath==='rotation'||rawPath==='rotationQuaternion'){path='rotationQuaternion';dimension=4}else if(rawPath==='rotationEulerDeg'){path='rotationEulerDeg';dimension=3}else throw new Error(`VSR rig/animation track ${clip.name}/${track.bone} has unsupported path ${rawPath||'missing'}.`);
      const key=`${track.bone}:${path}`;if(trackKeys.has(key))throw new Error(`VSR rig/animation clip ${clip.name} contains duplicate track ${key}.`);trackKeys.add(key);
      const times=track.times.map((time:unknown,index:number)=>{if(typeof time!=='number'||!Number.isFinite(time)||time<0||(index>0&&time<track.times[index-1]))throw new Error(`VSR rig/animation track ${clip.name}/${track.bone} times are invalid.`);if(time>clip.duration)throw new Error(`VSR rig/animation track ${clip.name}/${track.bone} exceeds clip duration.`);return time});
      const values=track.values.map((value:unknown)=>standaloneFiniteVector(value,dimension,`track ${clip.name}/${track.bone} value`) as Vec3|Vec4);
      const interpolation=String(track.interpolation??'LINEAR').trim().toUpperCase();if(interpolation!=='LINEAR'&&interpolation!=='STEP')throw new Error(`VSR rig/animation track ${clip.name}/${track.bone} interpolation ${interpolation} requires an explicit VSR tangent representation.`);
      tracks.push({bone:track.bone,path,times,values,interpolation});
    }
    clips.push({name:clip.name,duration:clip.duration,tracks});
  }
  return clips;
}
function standaloneRigNodes(componentId:string,bones:VSRStandaloneRigBone[]):{nodes:VSRSpatialNode[];skin:VSRSpatialSkin}{
  const ids=new Map(bones.map((bone,index)=>[bone.name,`rig:${componentId}:bone:${index}`])),nodes=bones.map(bone=>({id:ids.get(bone.name)!,...(bone.parent===null?{}:{parentId:ids.get(bone.parent)!}),transform:{translation:bone.translation,rotationQuaternion:bone.rotation},tags:['vsr-rig-bone',`rig-bone:${bone.name}`]} as VSRSpatialNode));return{nodes,skin:{id:`skin:${componentId}:rig`,joints:nodes.map(node=>node.id)}}
}
function standaloneAnimationNodes(componentId:string,clips:VSRStandaloneAnimationClip[],rig?:{nodes:VSRSpatialNode[];skin:VSRSpatialSkin}):{nodes:VSRSpatialNode[];skin?:VSRSpatialSkin}{
  if(rig)return rig;
  const names=[...new Set(clips.flatMap(clip=>clip.tracks.map(track=>track.bone)))].sort((left,right)=>left.localeCompare(right)),nodes=names.map((name,index)=>({id:`animation:${componentId}:bone:${index}`,transform:{},tags:['vsr-animation-bone',`animation-bone:${name}`]} as VSRSpatialNode));return{nodes}
}
function validateStandaloneRigGeometryBinding(gltf:Json,bones:VSRStandaloneRigBone[]):void{
  const skin=gltf.skins?.[0];if(!skin||!Array.isArray(skin.joints)||skin.joints.length!==bones.length)throw new Error('VSR rig/animation geometry fusion requires a skin with one joint per rig bone.');
  const parentByNode=new Map<number,number>();for(let nodeIndex=0;nodeIndex<(gltf.nodes??[]).length;nodeIndex++){const children=gltf.nodes?.[nodeIndex]?.children;if(!Array.isArray(children))continue;for(const child of children){if(!Number.isSafeInteger(child)||child<0||child>=(gltf.nodes??[]).length||parentByNode.has(child))throw new Error('VSR rig/animation geometry fusion has an invalid or multiply-parented node hierarchy.');parentByNode.set(child,nodeIndex)}}
  const jointSet=new Set<number>();for(let index=0;index<skin.joints.length;index++){const joint=skin.joints[index];if(!Number.isSafeInteger(joint)||joint<0||joint>=((gltf.nodes??[]).length)||jointSet.has(joint)){throw new Error(`VSR rig/animation geometry fusion joint ${index} is invalid or duplicated.`)}jointSet.add(joint);const node=gltf.nodes?.[joint];const actualName=String(node?.name??`node-${index}`);if(!componentNameMatches(bones[index]!.name,actualName,index))throw new Error(`VSR rig/animation geometry fusion bone ${bones[index]!.name} is not bound to joint ${index}.`)}
  for(let index=0;index<bones.length;index++){const bone=bones[index]!,parentIndex=parentByNode.get(skin.joints[index]!);if(bone.parent===null){if(parentIndex!==undefined&&jointSet.has(parentIndex))throw new Error(`VSR rig/animation geometry fusion root bone ${bone.name} has a joint parent.`);continue}if(parentIndex===undefined||!jointSet.has(parentIndex))throw new Error(`VSR rig/animation geometry fusion bone ${bone.name} has no matching joint parent.`);const actualParentName=String(gltf.nodes?.[parentIndex]?.name??'');if(!componentNameMatches(bone.parent,actualParentName,skin.joints.indexOf(parentIndex)))throw new Error(`VSR rig/animation geometry fusion bone ${bone.name} parent is not bound.`)}
}
function standaloneSpatialScene(componentId:string,sceneId:string,kind:VSRRigAnimationRepresentationKind,resourceRoot:string,nodes:VSRSpatialNode[],skin:VSRSpatialSkin|undefined,animations:VSRSpatialAnimationClip[]):VSRSpatialScene3D{
  const cameraId=`camera:${componentId}:${kind}`;return{format:VSR_SPATIAL_SCENE_FORMAT,sceneId,title:`VSR ${kind} component ${componentId}`,background:'#0b1020',activeCameraId:cameraId,meshes:[],materials:[],textures:[],animations,skins:skin?[skin]:[],nodes,cameras:[{id:cameraId,transform:{translation:[0,1.2,5]},projection:'perspective',fovYDeg:60,near:.01,far:1000}],lights:[{id:`light:${componentId}:ambient`,kind:'ambient',color:'#ffffff',intensity:.35},{id:`light:${componentId}:key`,kind:'directional',color:'#ffffff',intensity:1,direction:[-.35,-1,-.25]}],reality:{worldId:`world:${sceneId}`,realityRoot:resourceRoot}};
}
function standaloneResourceRoot(componentId:string,kind:VSRRigAnimationRepresentationKind,bindings:Array<{asset:VSRGltfComponentAsset;bytes:Uint8Array}>):{root:string;byteLength:number}{const resources=bindings.map(({asset,bytes})=>({assetId:asset.id,byteLength:bytes.byteLength,byteRoot:cryptographicHash([...bytes])}));return{root:cryptographicHash({componentId,representationKind:kind,resources}),byteLength:resources.reduce((sum,resource)=>sum+resource.byteLength,0)}}
type VSRRigAnimationReceiptBase=Omit<VSRRigAnimationComponentImportReceipt,'receiptRoot'>;
function standaloneReceiptBase(input:{componentId:string;sceneId:string;kind:VSRRigAnimationRepresentationKind;resourceRoot:string;scene:VSRSpatialScene3D;rigBoneCount:number;animationClipCount:number;animationChannelCount:number;geometryFused?:boolean;geometryMeshCount?:number;externalPbrChannelCount?:number;externalPbrMaterialCount?:number}):VSRRigAnimationReceiptBase{return{format:VSR_RIG_ANIMATION_IMPORT_FORMAT,componentId:input.componentId,sceneId:input.sceneId,representationKind:input.kind,resourceRoot:input.resourceRoot,sceneRoot:cryptographicHash(input.scene),nodeCount:input.scene.nodes.length,rigBoneCount:input.rigBoneCount,animationClipCount:input.animationClipCount,animationChannelCount:input.animationChannelCount,geometryFused:input.geometryFused??false,geometryMeshCount:input.geometryMeshCount??0,externalPbrChannelCount:input.externalPbrChannelCount??0,externalPbrMaterialCount:input.externalPbrMaterialCount??0,candidateOnly:true,authoritative:false}}
export function verifyVsrRigAnimationImportReceipt(receipt:VSRRigAnimationComponentImportReceipt,scene?:VSRSpatialScene3D):boolean{
  try{
    if(!receipt||receipt.format!==VSR_RIG_ANIMATION_IMPORT_FORMAT||!receipt.componentId||!receipt.sceneId||(receipt.representationKind!=='rig'&&receipt.representationKind!=='animation')||![receipt.resourceRoot,receipt.sceneRoot,receipt.receiptRoot].every(root=>/^[a-f0-9]{64}$/i.test(root))||![receipt.nodeCount,receipt.rigBoneCount,receipt.animationClipCount,receipt.animationChannelCount].every(value=>Number.isSafeInteger(value)&&value>=0)||receipt.nodeCount<1||(receipt.geometryFused!==undefined&&typeof receipt.geometryFused!=='boolean')||(receipt.geometryMeshCount!==undefined&&(!Number.isSafeInteger(receipt.geometryMeshCount)||receipt.geometryMeshCount<0))||(receipt.externalPbrChannelCount!==undefined&&(!Number.isSafeInteger(receipt.externalPbrChannelCount)||receipt.externalPbrChannelCount<0))||(receipt.externalPbrMaterialCount!==undefined&&(!Number.isSafeInteger(receipt.externalPbrMaterialCount)||receipt.externalPbrMaterialCount<0))||receipt.geometryFused===true&&(!Number.isSafeInteger(receipt.geometryMeshCount)||(receipt.geometryMeshCount??0)<1)||receipt.geometryFused!==true&&(receipt.geometryMeshCount??0)!==0||receipt.geometryFused!==true&&((receipt.externalPbrChannelCount??0)!==0||(receipt.externalPbrMaterialCount??0)!==0)||receipt.candidateOnly!==true||receipt.authoritative!==false)return false;
    const{receiptRoot,...base}=receipt;if(cryptographicHash(base)!==receiptRoot)return false;
    if(scene){compileSpatialFrame(scene,{width:1,height:1,enableShadows:false});if(scene.format!==VSR_SPATIAL_SCENE_FORMAT||scene.sceneId!==receipt.sceneId||cryptographicHash(scene)!==receipt.sceneRoot||scene.meshes.length!==(receipt.geometryFused===true?receipt.geometryMeshCount:0)||scene.nodes.length!==receipt.nodeCount||(scene.skins?.[0]?.joints.length??0)!==receipt.rigBoneCount||(scene.animations??[]).length!==receipt.animationClipCount||(scene.animations??[]).reduce((sum,clip)=>sum+clip.channels.length,0)!==receipt.animationChannelCount)return false;if(receipt.representationKind==='rig'&&receipt.animationClipCount!==0)return false;if(receipt.representationKind==='animation'&&receipt.animationClipCount<1)return false}
    return true;
  }catch{return false}
}
function standaloneCoverageValid(result:VSRRigAnimationComponentImportResult):boolean{const consumed=result.consumed_asset_ids,deferred=result.deferred_asset_ids;if(!Array.isArray(consumed)||!Array.isArray(deferred)||consumed.some(id=>typeof id!=='string'||!id)||deferred.some(id=>typeof id!=='string'||!id)||new Set(consumed).size!==consumed.length||new Set(deferred).size!==deferred.length||consumed.some(id=>deferred.includes(id)))return false;return true}
/**
 * Import standalone RAGF rig or animation JSON into a bone-only VSR scene.
 * The result is a candidate representation: it is executable and verifiable,
 * but it never mutates RNCS state or claims AAA fidelity.
 */
async function compileVsrRigAnimationGeometryFusion({entry,assets,payloads,options}:{entry:VSRGltfComponentImportEntry;assets:VSRGltfComponentAsset[];payloads:Map<string,Uint8Array>;options:VSRRigAnimationComponentImportHandlerOptions}):Promise<VSRRigAnimationComponentImportResult>{
  const kind=standaloneRepresentationKind(entry),meshAssets=assets.filter(asset=>asset.kind==='mesh'&&componentAssetFormat(asset)==='model/gltf-binary').sort((left,right)=>left.id.localeCompare(right.id)),rigCandidates=assets.filter(asset=>componentAuxiliaryRole(asset)==='rig'),animationCandidates=assets.filter(asset=>componentAuxiliaryRole(asset)==='animation'),stageKey=(asset:VSRGltfComponentAsset):string=>String(asset.metadata?.stage_id??asset.metadata?.stageId??'').trim(),stageRank=(stage:string):number=>Math.max(0,...assets.filter(asset=>stageKey(asset)===stage).map(asset=>Number(String(asset.metadata?.relative_path??'').match(/stages[\\/](\d+)-/)?.[1]??0))),explicitMesh=options.geometryAssetId===undefined?undefined:meshAssets.find(asset=>asset.id===options.geometryAssetId),candidateStages=[...new Set(meshAssets.map(stageKey))].filter(stage=>rigCandidates.some(asset=>stageKey(asset)===stage)&&(kind==='rig'||animationCandidates.some(asset=>stageKey(asset)===stage))).sort((left,right)=>stageRank(left)-stageRank(right)||left.localeCompare(right)),selectedStage=explicitMesh?stageKey(explicitMesh):candidateStages.at(-1),stageAssets=selectedStage===undefined?assets:assets.filter(asset=>stageKey(asset)===selectedStage),rigBinding=componentAuxiliaryAsset(stageAssets,payloads,'rig'),animationBinding=componentAuxiliaryAsset(stageAssets,payloads,'animation'),selectedMeshAssets=explicitMesh?[explicitMesh]:meshAssets.filter(asset=>stageKey(asset)===selectedStage);
  if(options.geometryAssetId!==undefined&&!explicitMesh)throw new Error(`VSR rig/animation geometry fusion geometry asset ${options.geometryAssetId} is not a model/gltf-binary mesh resource.`);
  if(selectedMeshAssets.length!==1)throw new Error(`VSR rig/animation geometry fusion requires exactly one model/gltf-binary mesh asset after explicit/stage binding, received ${selectedMeshAssets.length}.`);
  const meshAsset=selectedMeshAssets[0]!;
  if(!rigBinding)throw new Error('VSR rig/animation geometry fusion requires a rig resource.');
  if(kind==='animation'&&!animationBinding)throw new Error('VSR rig/animation geometry fusion requires an animation resource.');
  const componentId=standaloneAssetId(entry,meshAsset.id),sceneId=String(options.sceneId?.(entry,meshAsset)??`component-vsr-fused-${kind}-${componentId}`).trim();if(!sceneId)throw new Error('VSR rig/animation geometry fusion scene id is required.');
  const expectedAssetId=typeof entry.asset_id==='string'?entry.asset_id:typeof entry.assetId==='string'?entry.assetId:undefined,meshBytes=componentAssetBytes(payloads,meshAsset),parsed=parseGlb(meshBytes),rigPayload=standalonePayloadJson(payloads,rigBinding.asset),rig=standaloneRig(rigPayload,expectedAssetId),geometryAssetId=parsed.gltf.extras?.ragf?.asset_id;
  if(expectedAssetId&&typeof geometryAssetId==='string'&&geometryAssetId!==expectedAssetId)throw new Error('VSR rig/animation geometry asset identity is not bound.');
  validateStandaloneRigGeometryBinding(parsed.gltf,rig);
  const animationPayload=kind==='animation'?standalonePayloadJson(payloads,animationBinding!.asset):undefined,animation=animationPayload?standaloneAnimation(animationPayload,expectedAssetId,new Set(rig.map(bone=>bone.name))):undefined;
  if(kind==='animation')validateComponentRigAnimationBinding(parsed.gltf,rigPayload,animationPayload!,expectedAssetId);
  const sourceRoot=cryptographicHash({componentId,meshAssetId:meshAsset.id,meshRoot:cryptographicHash([...meshBytes])});
  let importedScene:VSRSpatialScene3D,consumedAssetIds:string[]=[meshAsset.id],externalPbrChannelCount=0,externalPbrMaterialCount=0,externalPbrByteLength=0;
  if(options.fuseExternalPbr){
    const pbrHandler=createVsrGltfPbrComponentImportHandler({imageDecoder:options.imageDecoder,requireExternalPbr:options.requireExternalPbr,consumeRigAnimation:kind==='animation',requireRigAnimation:kind==='animation',aggregateMeshAssets:false,rigMeshAssetId:meshAsset.id,sceneId:()=>sceneId,sourceRoot:()=>sourceRoot});
    const pbrResult=await pbrHandler.compile({entry,assets:stageAssets,payloads});
    if(!pbrHandler.verify({result:pbrResult}))throw new Error('VSR rig/animation geometry fusion received an unverified glTF/PBR result.');
    importedScene=pbrResult.scene;
    consumedAssetIds=[...pbrResult.consumed_asset_ids];
    externalPbrChannelCount=Number(pbrResult.metrics.external_pbr_channel_count??0);
    externalPbrMaterialCount=Number(pbrResult.metrics.external_pbr_material_count??0);
    externalPbrByteLength=Number(pbrResult.metrics.external_pbr_byte_length??0);
  }else{
    importedScene=(await importGlbToSpatialSceneAsync(meshBytes,{sceneId,sourceRoot,imageDecoder:options.imageDecoder})).scene;
  }
  if(kind==='animation'&&(importedScene.animations?.length??0)<animation!.length)throw new Error('VSR rig/animation geometry fusion imported fewer animation clips than the external manifest.');
  if(kind==='rig')importedScene={...importedScene,animations:[]};
  for(const assetId of [rigBinding.asset.id,...(kind==='animation'?[animationBinding!.asset.id]:[])])if(!consumedAssetIds.includes(assetId))consumedAssetIds.push(assetId);
  const bindings=consumedAssetIds.map(assetId=>{const asset=assets.find(candidate=>candidate.id===assetId);if(!asset)throw new Error(`VSR rig/animation geometry fusion consumed unknown asset ${assetId}.`);return{asset,bytes:componentAssetBytes(payloads,asset)}}),resource=standaloneResourceRoot(componentId,kind,bindings),scene=importedScene,animationClipCount=scene.animations?.length??0,animationChannelCount=scene.animations?.reduce((sum,clip)=>sum+clip.channels.length,0)??0,base=standaloneReceiptBase({componentId,sceneId,kind,resourceRoot:resource.root,scene,rigBoneCount:rig.length,animationClipCount,animationChannelCount,geometryFused:true,geometryMeshCount:scene.meshes.length,externalPbrChannelCount,externalPbrMaterialCount}),receipt={...base,receiptRoot:cryptographicHash(base)},consumed_asset_ids=bindings.map(binding=>binding.asset.id),consumed=new Set(consumed_asset_ids),deferred_asset_ids=assets.map(asset=>asset.id).filter(id=>!consumed.has(id));
  return{status:'EXECUTED',scene,receipt,output_root:receipt.sceneRoot,consumed_asset_ids,deferred_asset_ids,metrics:{geometry_fused:1,mesh_count:receipt.geometryMeshCount??0,external_pbr_channel_count:receipt.externalPbrChannelCount??0,external_pbr_material_count:receipt.externalPbrMaterialCount??0,external_pbr_binding_count:receipt.externalPbrChannelCount??0,external_pbr_byte_length:externalPbrByteLength,node_count:receipt.nodeCount,rig_bone_count:receipt.rigBoneCount,animation_clip_count:receipt.animationClipCount,animation_channel_count:receipt.animationChannelCount,rig_bound:1,resource_count:bindings.length,resource_byte_length:resource.byteLength}};
}
export function createVsrRigAnimationComponentImportHandler(options:VSRRigAnimationComponentImportHandlerOptions={}):VSRRigAnimationComponentImportHandler{
  const handler_id=options.handlerId??'vsr.rig-animation-component-import.v0.1';
  return{handler_id,compile:async({entry,assets,payloads})=>{
    if(!Array.isArray(assets)||!(payloads instanceof Map))throw new Error('VSR rig/animation component import requires an asset list and payload map.');
    if(assets.some(asset=>!asset||typeof asset.id!=='string'||!asset.id.trim())||new Set(assets.map(asset=>asset.id)).size!==assets.length)throw new Error('VSR rig/animation component asset IDs must be unique and non-empty.');
    if(options.fuseGeometry)return compileVsrRigAnimationGeometryFusion({entry,assets,payloads,options});
    const kind=standaloneRepresentationKind(entry),rigBinding=componentAuxiliaryAsset(assets,payloads,'rig'),animationBinding=componentAuxiliaryAsset(assets,payloads,'animation');
    if(kind==='rig'&&!rigBinding)throw new Error('VSR rig/animation rig import requires a rig resource.');
    if(kind==='animation'&&!animationBinding)throw new Error('VSR rig/animation animation import requires an animation resource.');
    if(kind==='animation'&&options.requireRigForAnimation&&!rigBinding)throw new Error('VSR rig/animation animation import requires a rig resource for binding.');
    const componentId=standaloneAssetId(entry,(kind==='rig'?rigBinding!:animationBinding!).asset.id),primary=kind==='rig'?rigBinding!.asset:animationBinding!.asset,sceneId=String(options.sceneId?.(entry,primary)??`component-vsr-import-${kind}-${componentId}`).trim();if(!sceneId)throw new Error('VSR rig/animation scene id is required.');
    const expectedAssetId=typeof entry.asset_id==='string'?entry.asset_id:typeof entry.assetId==='string'?entry.assetId:undefined,rigPayload=rigBinding?standalonePayloadJson(payloads,rigBinding.asset):undefined,animationPayload=kind==='animation'&&animationBinding?standalonePayloadJson(payloads,animationBinding.asset):undefined,rig=rigPayload?standaloneRig(rigPayload,expectedAssetId):undefined,animation=animationPayload?standaloneAnimation(animationPayload,expectedAssetId,rig?new Set(rig.map(bone=>bone.name)):undefined):undefined;
    if(rigPayload&&animationPayload&&typeof rigPayload.asset_id==='string'&&typeof animationPayload.asset_id==='string'&&rigPayload.asset_id!==animationPayload.asset_id)throw new Error('VSR rig/animation auxiliary asset identities conflict.');
    const bindings=kind==='rig'?[rigBinding!]:rig?[rigBinding!,animationBinding!]:[animationBinding!],resource=standaloneResourceRoot(componentId,kind,bindings),rigScene=rig?standaloneRigNodes(componentId,rig):undefined,animationNodes=standaloneAnimationNodes(componentId,animation??[],rigScene),nodes=animationNodes.nodes,skin=animationNodes.skin,animationClips=(animation??[]).map((clip,clipIndex)=>({id:`animation:${componentId}:clip:${clipIndex}`,duration:clip.duration,channels:clip.tracks.map(track=>{const node=nodes.find(candidate=>candidate.tags?.includes(`animation-bone:${track.bone}`)||candidate.tags?.includes(`rig-bone:${track.bone}`));if(!node)throw new Error(`VSR rig/animation node ${track.bone} is missing.`);return{nodeId:node.id,path:track.path,times:track.times,values:track.values,interpolation:track.interpolation}})})),scene=standaloneSpatialScene(componentId,sceneId,kind,resource.root,nodes,skin,animationClips),base=standaloneReceiptBase({componentId,sceneId,kind,resourceRoot:resource.root,scene,rigBoneCount:rig?.length??0,animationClipCount:animationClips.length,animationChannelCount:animationClips.reduce((sum,clip)=>sum+clip.channels.length,0)}),receipt={...base,receiptRoot:cryptographicHash(base)},consumed_asset_ids=bindings.map(binding=>binding.asset.id),consumed=new Set(consumed_asset_ids),deferred_asset_ids=assets.map(asset=>asset.id).filter(id=>!consumed.has(id));
    return{status:'EXECUTED',scene,receipt,output_root:receipt.sceneRoot,consumed_asset_ids,deferred_asset_ids,metrics:{geometry_fused:0,mesh_count:0,node_count:receipt.nodeCount,rig_bone_count:receipt.rigBoneCount,animation_clip_count:receipt.animationClipCount,animation_channel_count:receipt.animationChannelCount,rig_bound:rig?1:0,resource_count:bindings.length,resource_byte_length:resource.byteLength}};
  },verify:({result})=>Boolean(result&&result.status==='EXECUTED'&&result.output_root===result.receipt.sceneRoot&&standaloneCoverageValid(result)&&verifyVsrRigAnimationImportReceipt(result.receipt,result.scene)&&result.metrics.geometry_fused===(result.receipt.geometryFused===true?1:0)&&result.metrics.mesh_count===(result.receipt.geometryMeshCount??0)&&result.metrics.node_count===result.receipt.nodeCount&&result.metrics.rig_bone_count===result.receipt.rigBoneCount&&result.metrics.animation_clip_count===result.receipt.animationClipCount&&result.metrics.animation_channel_count===result.receipt.animationChannelCount)}
}

function particleAssetRole(asset:VSRGltfComponentAsset):boolean{
  const role=String(asset.metadata?.role??asset.metadata?.particle_role??asset.metadata?.particleRole??asset.role??'').trim().toLowerCase().replace(/_/g,'-'),format=componentAssetFormat(asset);
  return asset.kind==='particle'||role.includes('particle')||role.includes('effect-preset')||(!role&&asset.metadata?.representation_kind==='particle'&&format==='application/json');
}
function particleAssetBinding(assets:VSRGltfComponentAsset[],payloads:Map<string,Uint8Array>):{asset:VSRGltfComponentAsset;bytes:Uint8Array}|undefined{
  const candidates=assets.filter(particleAssetRole).sort((left,right)=>left.id.localeCompare(right.id));if(!candidates.length)return undefined;
  const first=candidates[0]!,bytes=componentAssetBytes(payloads,first),byteRoot=cryptographicHash([...bytes]);for(const candidate of candidates.slice(1)){if(cryptographicHash([...componentAssetBytes(payloads,candidate)])!==byteRoot)throw new Error('VSR particle component resources have conflicting payloads.')}return{asset:first,bytes};
}
function particleNumber(value:unknown,field:string,min=-Infinity,max=Infinity):number{const result=Number(value);if(!Number.isFinite(result)||result<min||result>max)throw new Error(`VSR particle ${field} must be finite and within bounds.`);return result}
function particleRange(value:unknown,field:string,min=0):[number,number]{if(!Array.isArray(value)||value.length!==2)throw new Error(`VSR particle ${field} must be a two-value range.`);const result=[particleNumber(value[0],`${field}[0]`,min),particleNumber(value[1],`${field}[1]`,min)] as [number,number];if(result[1]<result[0])throw new Error(`VSR particle ${field} must be ordered.`);return result}
function particleCurve(value:unknown,field:string,color=false):Array<[number,number|string]>{if(!Array.isArray(value)||value.length<2)throw new Error(`VSR particle ${field} must contain at least two points.`);let previous=-Infinity;return value.map((point,index)=>{if(!Array.isArray(point)||point.length!==2)throw new Error(`VSR particle ${field}[${index}] must be a time/value pair.`);const time=particleNumber(point[0],`${field}[${index}].time`,0,1);if(time<previous)throw new Error(`VSR particle ${field} times must be ordered.`);previous=time;if(color){if(typeof point[1]!=='string'||!/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(point[1]))throw new Error(`VSR particle ${field}[${index}] color is invalid.`);return[time,point[1]]}return[time,particleNumber(point[1],`${field}[${index}].value`,0)]})}
function particlePreset(payload:Json,expectedAssetId?:string):{presetRoot:string;effectRoot:string;maxParticles:number}{
  if(payload.format!=='rsr.particle-preset.v0.4'||payload.version!=='0.1.0'||typeof payload.preset_id!=='string'||!payload.preset_id.trim()||typeof payload.asset_id!=='string'||!payload.asset_id.trim()||typeof payload.variant!=='string'||!payload.variant.trim()||typeof payload.semantic_event!=='string'||!payload.semantic_event.trim())throw new Error('VSR particle preset contract is invalid.');
  if(expectedAssetId&&payload.asset_id!==expectedAssetId)throw new Error('VSR particle preset asset identity is not bound.');
  if(typeof payload.effect_root!=='string'||!/^[0-9a-f]{64}$/i.test(payload.effect_root))throw new Error('VSR particle preset effect root is invalid.');
  const copy=JSON.parse(JSON.stringify(payload));delete copy.effect_root;if(cryptographicHash(copy)!==payload.effect_root)throw new Error('VSR particle preset effect root mismatch.');
  const emitter=payload.emitter;if(!emitter||typeof emitter!=='object'||Array.isArray(emitter)||typeof emitter.shape!=='string'||!emitter.shape.trim())throw new Error('VSR particle emitter contract is invalid.');
  const maxParticles=particleNumber(payload.budget?.max_particles,'budget.max_particles',1,1000000);if(!Number.isSafeInteger(maxParticles))throw new Error('VSR particle budget.max_particles must be an integer.');
  const burst=particleNumber(emitter.burst,'emitter.burst',0,maxParticles);if(!Number.isSafeInteger(burst))throw new Error('VSR particle emitter.burst must be an integer.');particleNumber(emitter.rate,'emitter.rate',0);particleRange(emitter.lifetime,'emitter.lifetime',0);particleRange(emitter.speed,'emitter.speed',0);particleRange(emitter.angle_degrees,'emitter.angle_degrees',-Infinity);particleRange(emitter.gravity,'emitter.gravity');particleNumber(emitter.drag,'emitter.drag',0,1);
  if(!payload.budget||typeof payload.budget.quality!=='string'||!payload.budget.quality.trim())throw new Error('VSR particle budget quality is invalid.');
  particleCurve(payload.curves?.size,'curves.size');particleCurve(payload.curves?.opacity,'curves.opacity');particleCurve(payload.curves?.color,'curves.color',true);
  return{presetRoot:cryptographicHash(payload),effectRoot:payload.effect_root,maxParticles};
}
function particleResourceRoot(componentId:string,binding:{asset:VSRGltfComponentAsset;bytes:Uint8Array}):string{return cryptographicHash({componentId,representationKind:'particle',resources:[{assetId:binding.asset.id,byteLength:binding.bytes.byteLength,byteRoot:cryptographicHash([...binding.bytes])}]})}
function particleCoverageValid(result:VSRParticleComponentImportResult):boolean{const consumed=result.consumed_asset_ids,deferred=result.deferred_asset_ids;if(!Array.isArray(consumed)||!Array.isArray(deferred)||consumed.some(id=>typeof id!=='string'||!id)||deferred.some(id=>typeof id!=='string'||!id)||new Set(consumed).size!==consumed.length||new Set(deferred).size!==deferred.length||consumed.some(id=>deferred.includes(id)))return false;return true}
function particleEmitterRoot(emitter:Json):string{const copy=JSON.parse(JSON.stringify(emitter));delete copy.emitterRoot;return cryptographicHash(copy)}
export function verifyVsrParticleImportReceipt(receipt:VSRParticleImportReceipt,emitter?:Json):boolean{
  try{
    if(!receipt||receipt.format!==VSR_PARTICLE_IMPORT_FORMAT||!receipt.componentId||!receipt.sceneId||!receipt.presetId||!receipt.semanticEvent||![receipt.presetRoot,receipt.effectRoot,receipt.emitterRoot,receipt.resourceRoot,receipt.receiptRoot].every(root=>/^[a-f0-9]{64}$/i.test(root))||!Number.isSafeInteger(receipt.maxParticles)||receipt.maxParticles<1||receipt.candidateOnly!==true||receipt.authoritative!==false)return false;
    const{receiptRoot,...base}=receipt;if(cryptographicHash(base)!==receiptRoot)return false;
    if(emitter){if(emitter.format!=='vsr.particle-emitter.v0.1'||emitter.version!=='0.1.0'||emitter.componentId!==receipt.componentId||emitter.presetId!==receipt.presetId||emitter.semanticEvent!==receipt.semanticEvent||emitter.sourceEffectRoot!==receipt.effectRoot||emitter.candidateOnly!==true||emitter.authoritative!==false||particleEmitterRoot(emitter)!==receipt.emitterRoot)return false}
    return true;
  }catch{return false}
}
/**
 * Import an RAGF particle preset into a normalized VSR effect-emitter
 * candidate. This validates and materializes effect semantics; it does not
 * claim a spatial mesh, target-device particle quality, or AAA approval.
 */
export function createVsrParticleComponentImportHandler(options:VSRParticleComponentImportHandlerOptions={}):VSRParticleComponentImportHandler{
  const handler_id=options.handlerId??'vsr.particle-component-import.v0.1';
  return{handler_id,compile:async({entry,assets,payloads})=>{
    if(!Array.isArray(assets)||!(payloads instanceof Map))throw new Error('VSR particle component import requires an asset list and payload map.');
    if(assets.some(asset=>!asset||typeof asset.id!=='string'||!asset.id.trim())||new Set(assets.map(asset=>asset.id)).size!==assets.length)throw new Error('VSR particle component asset IDs must be unique and non-empty.');
    const binding=particleAssetBinding(assets,payloads);if(!binding)throw new Error('VSR particle component import requires a particle preset resource.');
    const componentId=standaloneAssetId(entry,binding.asset.id),sceneId=String(options.sceneId?.(entry,binding.asset)??`component-vsr-particle-import-${componentId}`).trim();if(!sceneId)throw new Error('VSR particle scene id is required.');
    const expectedAssetId=typeof entry.asset_id==='string'?entry.asset_id:typeof entry.assetId==='string'?entry.assetId:undefined,payload=componentJsonPayload(payloads,binding.asset),validated=particlePreset(payload,expectedAssetId),emitterBase={format:'vsr.particle-emitter.v0.1',version:'0.1.0',componentId,presetId:payload.preset_id,assetId:payload.asset_id,variant:payload.variant,semanticEvent:payload.semantic_event,emitter:{shape:payload.emitter.shape,burst:payload.emitter.burst,rate:payload.emitter.rate,lifetime:payload.emitter.lifetime,speed:payload.emitter.speed,angle_degrees:payload.emitter.angle_degrees,gravity:payload.emitter.gravity,drag:payload.emitter.drag},curves:{size:payload.curves.size,opacity:payload.curves.opacity,color:payload.curves.color},budget:{max_particles:validated.maxParticles,quality:payload.budget.quality},sourceEffectRoot:validated.effectRoot,candidateOnly:true,authoritative:false},emitter={...emitterBase,emitterRoot:particleEmitterRoot(emitterBase)},resourceRoot=particleResourceRoot(componentId,binding),receiptBase:Omit<VSRParticleImportReceipt,'receiptRoot'>={format:VSR_PARTICLE_IMPORT_FORMAT,componentId,sceneId,presetId:payload.preset_id,semanticEvent:payload.semantic_event,presetRoot:validated.presetRoot,effectRoot:validated.effectRoot,emitterRoot:emitter.emitterRoot,resourceRoot,maxParticles:validated.maxParticles,candidateOnly:true,authoritative:false},receipt={...receiptBase,receiptRoot:cryptographicHash(receiptBase)},consumed_asset_ids=[binding.asset.id],consumed=new Set(consumed_asset_ids),deferred_asset_ids=assets.map(asset=>asset.id).filter(id=>!consumed.has(id));
    return{status:'EXECUTED',emitter,receipt,output_root:receipt.emitterRoot,consumed_asset_ids,deferred_asset_ids,metrics:{emitter_count:1,particle_max:receipt.maxParticles,burst_count:payload.emitter.burst,curve_channel_count:3,resource_count:1,resource_byte_length:binding.bytes.byteLength,semantic_event_bound:1}};
  },verify:({result})=>Boolean(result&&result.status==='EXECUTED'&&result.output_root===result.receipt.emitterRoot&&particleCoverageValid(result)&&verifyVsrParticleImportReceipt(result.receipt,result.emitter)&&result.metrics.emitter_count===1&&result.metrics.particle_max===result.receipt.maxParticles)}
}
function textureFromImage(gltf:Json,imageIndex:number,id:string,warnings:string[],sampler:Json={},resolver?:VSRGltfImageResolver):VSRSpatialTexture|undefined{
  const image=gltf.images?.[imageIndex];const resolved=resolver?.({imageIndex,image,id,sampler});if(resolved)return{...resolved,id};
  const raw=image?.extras?.vsrRGBA;
  if(raw&&Number.isInteger(raw.width)&&Number.isInteger(raw.height)&&Array.isArray(raw.pixels))return{id,width:raw.width,height:raw.height,pixels:raw.pixels,colorSpace:raw.colorSpace??'srgb',...textureSampling(sampler)};
  warnings.push(`image:${imageIndex}:encoded-image-preserved-without-decoder`);return undefined
}
const KTX2_IDENTIFIER=[0xab,0x4b,0x54,0x58,0x20,0x32,0x30,0xbb,0x0d,0x0a,0x1a,0x0a];
export function decodeKtx2ToSpatialTexture(input:ArrayBuffer|Uint8Array,id='texture:ktx2'):VSRSpatialTexture{const bytes=input instanceof Uint8Array?input:new Uint8Array(input),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(bytes.byteLength<104||!KTX2_IDENTIFIER.every((value,index)=>bytes[index]===value))throw new Error('Invalid KTX2 identifier.');const vkFormat=view.getUint32(12,true),typeSize=view.getUint32(16,true),width=view.getUint32(20,true),height=view.getUint32(24,true),depth=view.getUint32(28,true),layers=view.getUint32(32,true),faces=view.getUint32(36,true),levelCount=Math.max(1,view.getUint32(40,true)),supercompression=view.getUint32(44,true);if(!width||!height||depth>1||layers>1||faces!==1||typeSize!==1)throw new Error('Unsupported KTX2 dimensions or texel type.');if(vkFormat!==37&&vkFormat!==43)throw new Error(`KTX2 format ${vkFormat} requires a BasisU or host transcoder.`);if(supercompression!==0)throw new Error(`KTX2 supercompression ${supercompression} requires a BasisU or host transcoder.`);const levels:VSRSpatialTextureLevel[]=[];for(let level=0;level<levelCount;level++){const entry=80+level*24;if(entry+24>bytes.byteLength)throw new Error('KTX2 level index is truncated.');const offset=Number(view.getBigUint64(entry,true)),length=Number(view.getBigUint64(entry+8,true)),expectedWidth=Math.max(1,width>>level),expectedHeight=Math.max(1,height>>level),expectedLength=expectedWidth*expectedHeight*4;if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<expectedLength||offset+expectedLength>bytes.byteLength)throw new Error(`KTX2 level ${level} payload is truncated.`);levels.push({width:expectedWidth,height:expectedHeight,pixels:Array.from(bytes.subarray(offset,offset+expectedLength)),colorSpace:vkFormat===43?'srgb':'linear',filter:'linear'})}const [base,...mipmaps]=levels;return{id,width:base!.width,height:base!.height,pixels:base!.pixels,colorSpace:base!.colorSpace,mipmaps:mipmaps.length?mipmaps:undefined,filter:'linear',wrapU:'repeat',wrapV:'repeat'} }
export async function decodeGltfImageToSpatialTexture(input:VSRGltfImageDecoderInput):Promise<VSRSpatialTexture>{
  if(input.mimeType==='image/ktx2'||input.image?.mimeType==='image/ktx2')return decodeKtx2ToSpatialTexture(input.bytes,input.id);
  if(typeof Blob!=='function'||typeof createImageBitmap!=='function')throw new Error('glTF image decoding requires Blob and createImageBitmap.');
  const bytes=input.bytes.slice().buffer as ArrayBuffer,blob=new Blob([bytes],{type:input.mimeType??input.image?.mimeType??'application/octet-stream'}),bitmap=await createImageBitmap(blob);
  try{
    const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(bitmap.width,bitmap.height):(()=>{if(typeof document==='undefined')throw new Error('glTF image decoding requires OffscreenCanvas or document.');const element=document.createElement('canvas');element.width=bitmap.width;element.height=bitmap.height;return element})();
    const context=canvas.getContext('2d',{willReadFrequently:true}) as CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D|null;if(!context)throw new Error('glTF image decoder could not create a 2D context.');context.drawImage(bitmap,0,0);const pixels=Array.from(context.getImageData(0,0,bitmap.width,bitmap.height).data);return{id:input.id,width:bitmap.width,height:bitmap.height,pixels,...textureSampling(input.sampler)};
  }finally{bitmap.close()}
}
export function importGltfToSpatialScene(gltf:Json,options:VSRGltfImportOptions={}):VSRGltfImportResult{
  if(gltf.asset?.version!=='2.0')throw new Error(`Unsupported glTF version ${String(gltf.asset?.version)}.`);const buffers=loadBuffers(gltf,options),warnings:string[]=[],textures:VSRSpatialTexture[]=[],textureIds=new Map<number,string>();
  for(let index=0;index<(gltf.textures??[]).length;index++){const texture=gltf.textures[index],source=resolveGltfTextureSource(texture),id=`texture:gltf:${index}`;if(!source){warnings.push(`texture:${index}:missing-image-source`);continue}const loaded=textureFromImage(gltf,source.imageIndex,id,warnings,gltf.samplers?.[texture.sampler]??{},options.imageResolver);if(loaded){textures.push(loaded);textureIds.set(index,id)}}
  const materials:VSRSpatialMaterial[]=(gltf.materials??[]).map((material:Json,index:number)=>{
    const pbr=material.pbrMetallicRoughness??{};
    return{
      id:`material:gltf:${index}`,
      baseColor:colorHex(pbr.baseColorFactor,'#ffffff'),
      metallic:pbr.metallicFactor??1,
      roughness:pbr.roughnessFactor??1,
      emissive:colorHex([...(material.emissiveFactor??[0,0,0]),1],'#000000'),
      emissiveStrength:material.extensions?.KHR_materials_emissive_strength?.emissiveStrength??1,
      clearcoat:material.extensions?.KHR_materials_clearcoat?.clearcoatFactor??0,
      clearcoatRoughness:material.extensions?.KHR_materials_clearcoat?.clearcoatRoughnessFactor??.12,
      ior:material.extensions?.KHR_materials_ior?.ior??1.5,
      doubleSided:material.doubleSided??false,
      opacity:pbr.baseColorFactor?.[3]??1,
      baseColorTextureId:textureIds.get(pbr.baseColorTexture?.index),
      metallicRoughnessTextureId:textureIds.get(pbr.metallicRoughnessTexture?.index),
      normalTextureId:textureIds.get(material.normalTexture?.index),
      normalScale:material.normalTexture?.scale??1,
      occlusionTextureId:textureIds.get(material.occlusionTexture?.index),
      occlusionStrength:material.occlusionTexture?.strength??1,
      emissiveTextureId:textureIds.get(material.emissiveTexture?.index),
      alphaMode:material.alphaMode??'OPAQUE',
      alphaCutoff:material.alphaCutoff??.5
    }
  });if(!materials.length)materials.push({id:'material:gltf:default'});
  const skins:VSRSpatialSkin[]=(gltf.skins??[]).map((skin:Json,index:number)=>{const joints=(skin.joints??[]).map((joint:number)=>`node:gltf:${joint}`),flat=skin.inverseBindMatrices===undefined?[]:accessorValues(gltf,buffers,skin.inverseBindMatrices),inverseBindMatrices=joints.map((_:string,jointIndex:number)=>flat.length?matrixValue(flat.slice(jointIndex*16,jointIndex*16+16))??identityMat4():identityMat4());return{id:`skin:gltf:${index}`,joints,inverseBindMatrices}});
  const meshes:VSRSpatialMesh[]=[],primitiveMaterial=new Map<string,string>();for(let meshIndex=0;meshIndex<(gltf.meshes??[]).length;meshIndex++)for(let primitiveIndex=0;primitiveIndex<(gltf.meshes[meshIndex].primitives??[]).length;primitiveIndex++){const primitive=gltf.meshes[meshIndex].primitives[primitiveIndex];if((primitive.mode??4)!==4)throw new Error('Only glTF TRIANGLES primitives are supported.');const id=`mesh:gltf:${meshIndex}:${primitiveIndex}`,positions=accessorValues(gltf,buffers,primitive.attributes.POSITION),normals=primitive.attributes.NORMAL===undefined?undefined:accessorValues(gltf,buffers,primitive.attributes.NORMAL),uvs=primitive.attributes.TEXCOORD_0===undefined?undefined:accessorValues(gltf,buffers,primitive.attributes.TEXCOORD_0),uvs1=primitive.attributes.TEXCOORD_1===undefined?undefined:accessorValues(gltf,buffers,primitive.attributes.TEXCOORD_1),indices=primitive.indices===undefined?Array.from({length:positions.length/3},(_,i)=>i):accessorValues(gltf,buffers,primitive.indices).map(Math.trunc),jointIndices=primitive.attributes.JOINTS_0===undefined?undefined:accessorValues(gltf,buffers,primitive.attributes.JOINTS_0).map(Math.trunc),jointWeights=primitive.attributes.WEIGHTS_0===undefined?undefined:accessorValues(gltf,buffers,primitive.attributes.WEIGHTS_0),morphTargets=(primitive.targets??[]).map((target:Json,targetIndex:number)=>({id:`morph:gltf:${meshIndex}:${primitiveIndex}:${targetIndex}`,positions:target.POSITION===undefined?new Array<number>(positions.length).fill(0):accessorValues(gltf,buffers,target.POSITION),normals:target.NORMAL===undefined?undefined:accessorValues(gltf,buffers,target.NORMAL),defaultWeight:gltf.meshes[meshIndex].weights?.[targetIndex]??0}));meshes.push({id,positions,normals,uvs,uvs1,indices,jointIndices,jointWeights,morphTargets:morphTargets.length?morphTargets:undefined});primitiveMaterial.set(id,`material:gltf:${primitive.material??0}`)}
  const nodes:VSRSpatialNode[]=[];for(let nodeIndex=0;nodeIndex<(gltf.nodes??[]).length;nodeIndex++){const node=gltf.nodes[nodeIndex],base={id:`node:gltf:${nodeIndex}`,transform:{...(matrixValue(node.matrix) ? {matrix:matrixValue(node.matrix)} : {}),translation:node.translation as Vec3|undefined,rotationQuaternion:quaternionValue(node.rotation),scale:node.scale as Vec3|undefined}},skinId=node.skin===undefined?undefined:`skin:gltf:${node.skin}`,morphWeights=node.weights as number[]|undefined;const primitives=node.mesh===undefined?[]:(gltf.meshes[node.mesh]?.primitives??[]);if(primitives.length<=1){const meshId=node.mesh===undefined?undefined:`mesh:gltf:${node.mesh}:0`;nodes.push({...base,meshId,materialId:meshId?primitiveMaterial.get(meshId):undefined,skinId,morphWeights})}else{nodes.push({...base,skinId,morphWeights});for(let p=0;p<primitives.length;p++){const meshId=`mesh:gltf:${node.mesh}:${p}`;nodes.push({id:`node:gltf:${nodeIndex}:primitive:${p}`,parentId:base.id,meshId,materialId:primitiveMaterial.get(meshId),skinId,morphWeights})}}}
  for(let parent=0;parent<(gltf.nodes??[]).length;parent++)for(const child of gltf.nodes[parent].children??[]){const target=nodes.find(node=>node.id===`node:gltf:${child}`);if(target)target.parentId=`node:gltf:${parent}`}
  const cameras:VSRSpatialCamera[]=(gltf.cameras??[]).map((camera:Json,index:number)=>{const nodeIndex=(gltf.nodes??[]).findIndex((node:Json)=>node.camera===index),node=gltf.nodes?.[nodeIndex]??{};return{id:`camera:gltf:${index}`,projection:camera.type==='orthographic'?'orthographic':'perspective',fovYDeg:camera.perspective?.yfov===undefined?undefined:camera.perspective.yfov*180/Math.PI,orthoHeight:camera.orthographic?.ymag===undefined?undefined:camera.orthographic.ymag*2,near:camera.perspective?.znear??camera.orthographic?.znear??.1,far:camera.perspective?.zfar??camera.orthographic?.zfar??1000,transform:{translation:node.translation as Vec3|undefined,rotationQuaternion:quaternionValue(node.rotation),scale:node.scale as Vec3|undefined}}});if(!cameras.length&&options.defaultCamera!==false)cameras.push({id:'camera:gltf:default',projection:'perspective',fovYDeg:55,near:.1,far:1000,transform:{translation:[0,1.5,5]}});
  const punctual=gltf.extensions?.KHR_lights_punctual?.lights??[],lights:VSRSpatialLight[]=[{id:'light:gltf:ambient',kind:'ambient',color:'#ffffff',intensity:.12}];for(let nodeIndex=0;nodeIndex<(gltf.nodes??[]).length;nodeIndex++){const node=gltf.nodes[nodeIndex],lightIndex=node.extensions?.KHR_lights_punctual?.light;if(lightIndex===undefined)continue;const light=punctual[lightIndex]??{},kind=light.type==='directional'?'directional':'point';lights.push({id:`light:gltf:${lightIndex}`,kind,color:colorHex([...(light.color??[1,1,1]),1]),intensity:light.intensity??1,range:light.range,position:node.translation as Vec3|undefined,direction:kind==='directional'?[0,-1,0]:undefined,castShadow:true})}
  const animations:VSRSpatialAnimationClip[]=(gltf.animations??[]).map((animation:Json,animationIndex:number)=>{const channels:VSRSpatialAnimationChannel[]=[];let duration=0;for(const channel of animation.channels??[]){const sampler=animation.samplers[channel.sampler],times=accessorValues(gltf,buffers,sampler.input),flat=accessorValues(gltf,buffers,sampler.output),path=(channel.target.path==='rotation'?'rotationQuaternion':channel.target.path) as VSRSpatialAnimationPath;if(!['translation','rotationQuaternion','scale'].includes(path)){warnings.push(`animation:${animationIndex}:unsupported-path:${path}`);continue}const dimension=path==='rotationQuaternion'?4:3,interpolation=sampler.interpolation==='STEP'?'STEP':sampler.interpolation==='CUBICSPLINE'?'CUBICSPLINE':'LINEAR',values:(Vec3|Vec4)[]=[],inTangents:(Vec3|Vec4)[]=[],outTangents:(Vec3|Vec4)[]=[],valueOf=(raw:number[]):Vec3|Vec4=>dimension===4?raw as Vec4:raw as Vec3;if(interpolation==='CUBICSPLINE'){const stride=dimension*3;if(flat.length!==times.length*stride){warnings.push(`animation:${animationIndex}:invalid-cubic-output:${channel.target.path}`);continue}for(let index=0;index<times.length;index++){const base=index*stride;inTangents.push(valueOf(flat.slice(base,base+dimension)));values.push(valueOf(flat.slice(base+dimension,base+dimension*2)));outTangents.push(valueOf(flat.slice(base+dimension*2,base+stride)))}}else{if(flat.length!==times.length*dimension){warnings.push(`animation:${animationIndex}:invalid-output:${channel.target.path}`);continue}for(let index=0;index<times.length;index++)values.push(valueOf(flat.slice(index*dimension,index*dimension+dimension)))}duration=Math.max(duration,...times);channels.push({nodeId:`node:gltf:${channel.target.node}`,path,times,values,interpolation,...(interpolation==='CUBICSPLINE'?{inTangents,outTangents}:{})})}return{id:`animation:gltf:${animationIndex}`,duration,channels}});
  const sourceRoot=options.sourceRoot??cryptographicHash(gltf),sceneId=options.sceneId??`gltf:${sourceRoot.slice(0,16)}`,scene:VSRSpatialScene3D={format:VSR_SPATIAL_SCENE_FORMAT,sceneId,title:options.title??gltf.scene?.name??'glTF 2.0 Asset',activeCameraId:cameras[0]!.id,meshes,materials,textures,animations,skins,nodes,cameras,lights,reality:{worldId:`world:${sceneId}`,realityRoot:cryptographicHash({asset:gltf.asset,scene:gltf.scene,nodes:gltf.nodes,sourceRoot})}};
  const materialTextureBindingCount=materials.reduce((sum,material)=>sum+[material.baseColorTextureId,material.metallicRoughnessTextureId,material.normalTextureId,material.occlusionTextureId,material.emissiveTextureId].filter(Boolean).length,0),morphTargetCount=meshes.reduce((sum,mesh)=>sum+(mesh.morphTargets?.length??0),0),base={format:VSR_GLTF_IMPORT_FORMAT,assetVersion:VSR_GLTF_ASSET_VERSION,sceneId,meshCount:meshes.length,nodeCount:nodes.length,materialCount:materials.length,textureCount:textures.length,materialTextureBindingCount,animationCount:animations.length,skinCount:skins.length,morphTargetCount,sourceRoot,sceneRoot:cryptographicHash(scene),warnings};return{scene,receipt:{...base,receiptRoot:cryptographicHash(base)}};
}
export function importGlbToSpatialScene(input:ArrayBuffer|Uint8Array,options:VSRGltfImportOptions={}):VSRGltfImportResult{const parsed=parseGlb(input),buffers={...(options.buffers??{})};if(parsed.binaryChunk&&!buffers['buffer:0'])buffers['buffer:0']=parsed.binaryChunk;const binaryRoot=parsed.binaryChunk?cryptographicHash([...parsed.binaryChunk]):cryptographicHash([]),sourceRoot=options.sourceRoot??cryptographicHash({gltf:parsed.gltf,binaryRoot});return importGltfToSpatialScene(parsed.gltf,{...options,buffers,sourceRoot})}
export async function importGltfToSpatialSceneAsync(gltf:Json,options:VSRGltfImportOptions={}):Promise<VSRGltfImportResult>{const buffers=loadBuffers(gltf,options),decoded=new Map<number,VSRSpatialTexture>(),imageRoots:[number,string][]=[];if(options.imageDecoder)for(const texture of gltf.textures??[]){const source=resolveGltfTextureSource(texture);if(!source||!Number.isInteger(source.imageIndex)||decoded.has(source.imageIndex))continue;const imageIndex=source.imageIndex,image=gltf.images?.[imageIndex],bytes=imageBytes(gltf,imageIndex,buffers,options);if(!image||!bytes)continue;const id=`texture:gltf:${imageIndex}`,sampler=gltf.samplers?.[texture.sampler]??{},resolved=await options.imageDecoder({imageIndex,image,id,sampler,bytes,mimeType:image.mimeType});if(resolved){decoded.set(imageIndex,resolved);imageRoots.push([imageIndex,cryptographicHash([...bytes])])}}const sourceRoot=options.sourceRoot??(imageRoots.length?cryptographicHash({gltf,imageRoots}):cryptographicHash(gltf));return importGltfToSpatialScene(gltf,{...options,sourceRoot,imageResolver:input=>decoded.get(input.imageIndex)??options.imageResolver?.(input)})}
export async function importGlbToSpatialSceneAsync(input:ArrayBuffer|Uint8Array,options:VSRGltfImportOptions={}):Promise<VSRGltfImportResult>{const parsed=parseGlb(input),buffers={...(options.buffers??{})};if(parsed.binaryChunk&&!buffers['buffer:0'])buffers['buffer:0']=parsed.binaryChunk;const binaryRoot=parsed.binaryChunk?cryptographicHash([...parsed.binaryChunk]):cryptographicHash([]),sourceRoot=options.sourceRoot??cryptographicHash({gltf:parsed.gltf,binaryRoot});return importGltfToSpatialSceneAsync(parsed.gltf,{...options,buffers,sourceRoot})}
export function verifyGltfImportReceipt(receipt:VSRGltfImportReceipt):boolean{const {receiptRoot,...base}=receipt;return cryptographicHash(base)===receiptRoot}

export type VSRSpatialAssetComposeMode='append'|'replace-mesh';
export interface VSRSpatialAssetComposeOptions {
  assetId:string;
  instanceId?:string;
  idPrefix?:string;
  mode?:VSRSpatialAssetComposeMode;
  sourceMeshId?:string;
  targetNodeIds?:string[];
  placement?:VSRSpatialTransform;
  cellIds?:string[];
  payloadRoot?:string;
  assetFormat?:string;
  resourceAssetIds?:string[];
}
export interface VSRSpatialAssetBinding {
  format:'vsr.spatial-asset-binding.v0.1';
  version:'0.1.0';
  mode:VSRSpatialAssetComposeMode;
  assetId:string;
  instanceId?:string;
  assetFormat?:string;
  payloadRoot?:string;
  sourceMeshId?:string;
  resourceAssetIds:string[];
  importReceiptRoot:string;
  meshIds:string[];
  materialIds:string[];
  textureIds:string[];
  nodeIds:string[];
  supportNodeIds?:string[];
  boundNodeIds:string[];
  bindingRoot:string;
}
export interface VSRSpatialAssetComposeResult {scene:VSRSpatialScene3D;binding:VSRSpatialAssetBinding}

const importedAssetTextureKeys=['baseColorTextureId','metallicRoughnessTextureId','normalTextureId','occlusionTextureId','emissiveTextureId','lightmapTextureId','reactiveMaskTextureId'] as const;
const uniqueSortedStrings=(values:unknown[]):string[]=>[...new Set(values.filter(value=>typeof value==='string'&&value.length>0) as string[])].sort((a,b)=>a.localeCompare(b));

function isIdentityTransform(transform:VSRSpatialTransform|undefined):boolean{
  if(!transform)return true;
  const identity=identityMat4();
  if(transform.matrix?.some((value,index)=>value!==identity[index]))return false;
  if(transform.translation?.some(value=>value!==0))return false;
  if(transform.rotationEulerDeg?.some(value=>value!==0))return false;
  if(transform.rotationQuaternion?.some((value,index)=>value!==[0,0,0,1][index]))return false;
  if(transform.scale?.some(value=>value!==1))return false;
  return true;
}

function remapImportedMaterial(material:VSRSpatialMaterial,prefix:string,textureIds:Map<string,string>):VSRSpatialMaterial{
  const result={...material,id:`${prefix}material:${material.id}`};
  for(const key of importedAssetTextureKeys)if(result[key])result[key]=textureIds.get(result[key]!)??result[key];
  return result;
}

/**
 * Compose a verified imported asset into a VSR scene without granting the
 * asset authority over world state. Append mode preserves the imported node
 * hierarchy; replace-mesh mode reuses existing world nodes and swaps only
 * their presentation mesh/material references.
 */
export function composeImportedSpatialScene(baseScene:VSRSpatialScene3D,imported:VSRGltfImportResult,options:VSRSpatialAssetComposeOptions):VSRSpatialAssetComposeResult{
  if(!baseScene||baseScene.format!==VSR_SPATIAL_SCENE_FORMAT)throw new TypeError('VSR_SPATIAL_ASSET_BASE_SCENE_INVALID');
  if(!imported?.scene||!verifyGltfImportReceipt(imported.receipt))throw new TypeError('VSR_SPATIAL_ASSET_IMPORT_RECEIPT_INVALID');
  const assetId=String(options?.assetId??'').trim();if(!assetId)throw new TypeError('VSR_SPATIAL_ASSET_ID_REQUIRED');
  const mode=options.mode??'append',instanceId=String(options.instanceId??assetId),prefix=String(options.idPrefix??`asset:${instanceId}:`);
  const meshIds=new Map(imported.scene.meshes.map(mesh=>[mesh.id,`${prefix}mesh:${mesh.id}`]));
  const textureIds=new Map((imported.scene.textures??[]).map(texture=>[texture.id,`${prefix}texture:${texture.id}`]));
  const nodeIds=new Map(imported.scene.nodes.map(node=>[node.id,`${prefix}node:${node.id}`]));
  const skinIds=new Map((imported.scene.skins??[]).map(skin=>[skin.id,`${prefix}skin:${skin.id}`]));
  const materialIds=new Map(imported.scene.materials.map(material=>[material.id,`${prefix}material:${material.id}`]));
  const animationIds=new Map((imported.scene.animations??[]).map(animation=>[animation.id,`${prefix}animation:${animation.id}`]));
  const importedRootNodeIds=new Set(imported.scene.nodes.filter(node=>!node.parentId||!nodeIds.has(node.parentId)).map(node=>node.id));
  const importedNodes=imported.scene.nodes.map(node=>({...node,id:nodeIds.get(node.id)!,...(node.parentId?{parentId:nodeIds.get(node.parentId)}:{}),...(node.meshId?{meshId:meshIds.get(node.meshId)}:{}),...(node.materialId?{materialId:materialIds.get(node.materialId)}:{}),...(node.skinId?{skinId:skinIds.get(node.skinId)}:{}),tags:[...(node.tags??[]),`asset:${assetId}`,...(importedRootNodeIds.has(node.id)?['asset-root']:[])],...(importedRootNodeIds.has(node.id)&&options.placement?{transform:{...(node.transform??{}),...options.placement}}:{})}));
  const materials=imported.scene.materials.map(material=>remapImportedMaterial(material,prefix,textureIds));
  const skins=(imported.scene.skins??[]).map(skin=>({...skin,id:skinIds.get(skin.id)!,joints:skin.joints.map(nodeId=>nodeIds.get(nodeId)??nodeId)}));
  const animations=(imported.scene.animations??[]).map(animation=>({...animation,id:animationIds.get(animation.id)!,channels:animation.channels.map(channel=>({...channel,nodeId:nodeIds.get(channel.nodeId)??channel.nodeId}))}));
  const lights=(imported.scene.lights??[]).map(light=>({...light,id:`${prefix}light:${light.id}`}));
  const importedNodeIds=importedNodes.map(node=>node.id).sort((a,b)=>a.localeCompare(b));
  let scene:VSRSpatialScene3D;
  let boundNodeIds:string[]=[];
  let supportNodeIds:string[]=[];
  let sourceMeshId=options.sourceMeshId?String(options.sourceMeshId):undefined;
  if(mode==='replace-mesh'){
    if(!sourceMeshId)throw new TypeError('VSR_SPATIAL_ASSET_SOURCE_MESH_REQUIRED');
    if(imported.scene.meshes.length!==1)throw new TypeError('VSR_SPATIAL_ASSET_REPLACE_MESH_REQUIRES_ONE_IMPORTED_MESH');
    const targetIds=new Set((options.targetNodeIds??[]).map(String));
    const targets=baseScene.nodes.filter(node=>node.meshId===sourceMeshId&&(!targetIds.size||targetIds.has(node.id)));
    if(!targets.length)throw new TypeError('VSR_SPATIAL_ASSET_REPLACE_TARGET_MISSING');
    const importedMesh=imported.scene.meshes[0]!;
    const replacementMeshId=meshIds.get(importedMesh.id)!;
    const renderNodes=imported.scene.nodes.filter(node=>node.meshId===importedMesh.id);
    const renderNode=renderNodes[0];
    const hasPresentationDeformation=Boolean(imported.scene.skins?.length||imported.scene.animations?.length||renderNode?.morphWeights?.length);
    if(hasPresentationDeformation&&renderNodes.length!==1)throw new TypeError('VSR_SPATIAL_ASSET_REPLACE_DEFORMED_ASSET_REQUIRES_ONE_RENDER_NODE');
    if(hasPresentationDeformation&&!renderNode)throw new TypeError('VSR_SPATIAL_ASSET_REPLACE_DEFORMED_RENDER_NODE_MISSING');
    if(hasPresentationDeformation&&!isIdentityTransform(renderNode?.transform))throw new TypeError('VSR_SPATIAL_ASSET_REPLACE_DEFORMED_RENDER_TRANSFORM_UNSUPPORTED');
    const importedMaterialId=renderNode?.materialId;
    const replacementMaterialId=importedMaterialId?materialIds.get(importedMaterialId):undefined;
    boundNodeIds=targets.map(node=>node.id).sort((a,b)=>a.localeCompare(b));
    const targetSet=new Set(boundNodeIds);
    const targetNodeId=boundNodeIds[0];
    const importedNodeId=(nodeId:string):string=>nodeId===renderNode?.id?targetNodeId!:nodeIds.get(nodeId)!;
    const supportNodes=hasPresentationDeformation?imported.scene.nodes.filter(node=>node.id!==renderNode?.id).map(node=>({...node,id:nodeIds.get(node.id)!,...(node.parentId?{parentId:importedNodeId(node.parentId)}:{parentId:targetNodeId}),...(node.meshId?{meshId:meshIds.get(node.meshId)}:{}),...(node.materialId?{materialId:materialIds.get(node.materialId)}:{}),...(node.skinId?{skinId:skinIds.get(node.skinId)}:{}),tags:uniqueSortedStrings([...(node.tags??[]),`asset:${assetId}`,...(importedRootNodeIds.has(node.id)?['asset-support-root']:[])])})):[];
    supportNodeIds=supportNodes.map(node=>node.id).sort((a,b)=>a.localeCompare(b));
    const replacementSkinId=renderNode?.skinId?skinIds.get(renderNode.skinId):undefined;
    const replacedNodes=baseScene.nodes.map(node=>targetSet.has(node.id)?{...node,meshId:replacementMeshId,...(replacementMaterialId?{materialId:replacementMaterialId}:{}),...(replacementSkinId?{skinId:replacementSkinId}:{}),...(renderNode?.morphWeights?{morphWeights:[...renderNode.morphWeights]}:{}),tags:uniqueSortedStrings([...(node.tags??[]),`asset:${assetId}`,'asset-replacement'])}:node);
    const replacedAnimations=(imported.scene.animations??[]).map(animation=>({...animation,id:animationIds.get(animation.id)!,channels:animation.channels.map(channel=>({...channel,nodeId:importedNodeId(channel.nodeId)}))}));
    scene={...baseScene,meshes:[...baseScene.meshes,...imported.scene.meshes.map(mesh=>({...mesh,id:meshIds.get(mesh.id)!}))],materials:[...baseScene.materials,...materials],textures:[...(baseScene.textures??[]),...(imported.scene.textures??[]).map(texture=>({...texture,id:textureIds.get(texture.id)!}))],nodes:[...replacedNodes,...supportNodes],skins:[...(baseScene.skins??[]),...skins],animations:[...(baseScene.animations??[]),...replacedAnimations],lights:[...(baseScene.lights??[]),...lights]};
  }else if(mode==='append'){
    const streamCells=(baseScene.streaming?.cells??[]).map(cell=>options.cellIds?.includes(cell.id)?{...cell,nodeIds:uniqueSortedStrings([...(cell.nodeIds??[]),...importedNodeIds])}:cell);
    scene={...baseScene,meshes:[...baseScene.meshes,...imported.scene.meshes.map(mesh=>({...mesh,id:meshIds.get(mesh.id)!}))],materials:[...baseScene.materials,...materials],textures:[...(baseScene.textures??[]),...(imported.scene.textures??[]).map(texture=>({...texture,id:textureIds.get(texture.id)!}))],nodes:[...baseScene.nodes,...importedNodes],skins:[...(baseScene.skins??[]),...skins],animations:[...(baseScene.animations??[]),...animations],lights:[...(baseScene.lights??[]),...lights],...(baseScene.streaming?{streaming:{...baseScene.streaming,cells:streamCells}}:{})};
  }else throw new TypeError(`VSR_SPATIAL_ASSET_COMPOSE_MODE_UNSUPPORTED:${String(mode)}`);
  const bindingBase={format:'vsr.spatial-asset-binding.v0.1' as const,version:'0.1.0' as const,mode,assetId,...(instanceId===assetId?{}:{instanceId}),...(options.assetFormat?{assetFormat:String(options.assetFormat)}:{}),...(options.payloadRoot?{payloadRoot:String(options.payloadRoot)}:{}),...(sourceMeshId?{sourceMeshId}:{}),resourceAssetIds:uniqueSortedStrings(options.resourceAssetIds??[]),importReceiptRoot:imported.receipt.receiptRoot,meshIds:[...meshIds.values()].sort((a,b)=>a.localeCompare(b)),materialIds:[...materialIds.values()].sort((a,b)=>a.localeCompare(b)),textureIds:[...textureIds.values()].sort((a,b)=>a.localeCompare(b)),nodeIds:mode==='append'?importedNodeIds:[],...(supportNodeIds.length?{supportNodeIds}:{}),boundNodeIds};
  return {scene,binding:{...bindingBase,bindingRoot:cryptographicHash(bindingBase)}};
}

export function computeSpatialAssetBindingRoot(bindings:VSRSpatialAssetBinding[]):string{return cryptographicHash(bindings.map(binding=>binding.bindingRoot).sort((a,b)=>a.localeCompare(b)))}
