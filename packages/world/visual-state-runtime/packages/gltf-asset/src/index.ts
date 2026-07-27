import { cryptographicHash } from '../../spec/src/index.js';
import {
  VSR_SPATIAL_SCENE_FORMAT,
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
  identityMat4,
} from '../../spatial-reality-3d/src/index.js';

export const VSR_GLTF_ASSET_VERSION='0.2.0-alpha.1';
export const VSR_GLTF_IMPORT_FORMAT='vsr.gltf-import-receipt.v0.2' as const;

type Json=Record<string,any>;
export interface VSRGltfImportOptions {sceneId?:string;title?:string;buffers?:Record<string,Uint8Array>;defaultCamera?:boolean}
export interface VSRGltfImportReceipt {format:typeof VSR_GLTF_IMPORT_FORMAT;assetVersion:string;sceneId:string;meshCount:number;nodeCount:number;materialCount:number;textureCount:number;materialTextureBindingCount:number;animationCount:number;skinCount:number;morphTargetCount:number;sourceRoot:string;sceneRoot:string;warnings:string[];receiptRoot:string}
export interface VSRGltfImportResult {scene:VSRSpatialScene3D;receipt:VSRGltfImportReceipt}

const componentSize:Record<number,number>={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const componentCount:Record<string,number>={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const readComponent=(view:DataView,offset:number,type:number):number=>{
  if(type===5120)return view.getInt8(offset);if(type===5121)return view.getUint8(offset);if(type===5122)return view.getInt16(offset,true);if(type===5123)return view.getUint16(offset,true);if(type===5125)return view.getUint32(offset,true);if(type===5126)return view.getFloat32(offset,true);throw new Error(`Unsupported glTF componentType ${type}.`);
};
function decodeDataUri(uri:string):Uint8Array{const match=/^data:([^;,]+)?(;base64)?,(.*)$/s.exec(uri);if(!match)throw new Error('Invalid data URI.');if(!match[2])return new TextEncoder().encode(decodeURIComponent(match[3]??''));const text=match[3]??'',decode=(globalThis as typeof globalThis&{atob?:(value:string)=>string}).atob;if(decode){const binary=decode(text),bytes=new Uint8Array(binary.length);for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);return bytes}return Uint8Array.from(Buffer.from(text,'base64'));}
function loadBuffers(gltf:Json,options:VSRGltfImportOptions):Uint8Array[]{return (gltf.buffers??[]).map((buffer:Json,index:number)=>{if(typeof buffer.uri==='string'){if(buffer.uri.startsWith('data:'))return decodeDataUri(buffer.uri);const value=options.buffers?.[buffer.uri];if(value)return value;throw new Error(`Missing external glTF buffer ${buffer.uri}.`)}const value=options.buffers?.[`buffer:${index}`];if(value)return value;throw new Error(`Missing binary glTF buffer ${index}.`)})}
function accessorValues(gltf:Json,buffers:Uint8Array[],index:number):number[]{const accessor=gltf.accessors?.[index];if(!accessor)throw new Error(`Missing glTF accessor ${index}.`);const bufferView=gltf.bufferViews?.[accessor.bufferView];if(!bufferView)throw new Error(`Accessor ${index} missing bufferView.`);const buffer=buffers[bufferView.buffer];if(!buffer)throw new Error(`Missing glTF buffer ${bufferView.buffer}.`);const count=componentCount[accessor.type];const size=componentSize[accessor.componentType];if(!count||!size)throw new Error(`Unsupported accessor layout ${accessor.type}/${accessor.componentType}.`);const stride=bufferView.byteStride??count*size,base=(bufferView.byteOffset??0)+(accessor.byteOffset??0),view=new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength),values:number[]=[];for(let item=0;item<accessor.count;item++)for(let component=0;component<count;component++)values.push(readComponent(view,base+item*stride+component*size,accessor.componentType));return values}
const colorHex=(value:number[]|undefined,fallback='#ffffff'):string=>{if(!value)return fallback;const c=value.map((entry,index)=>Math.max(0,Math.min(255,Math.round((index===3?entry:Math.pow(entry,1/2.2))*255))));return`#${c.slice(0,4).map(v=>v.toString(16).padStart(2,'0')).join('')}`};
function quaternionValue(q:number[]|undefined):Vec4|undefined{if(!q)return undefined;return[q[0]??0,q[1]??0,q[2]??0,q[3]??1]}
function textureFromImage(gltf:Json,imageIndex:number,id:string,warnings:string[],sampler:Json={}):VSRSpatialTexture|undefined{
  const image=gltf.images?.[imageIndex],raw=image?.extras?.vsrRGBA;
  if(raw&&Number.isInteger(raw.width)&&Number.isInteger(raw.height)&&Array.isArray(raw.pixels))return{id,width:raw.width,height:raw.height,pixels:raw.pixels,colorSpace:raw.colorSpace??'srgb',wrapU:sampler.wrapS===33071?'clamp':'repeat',wrapV:sampler.wrapT===33071?'clamp':'repeat',filter:sampler.magFilter===9728||sampler.minFilter===9728?'nearest':'linear'};
  warnings.push(`image:${imageIndex}:encoded-image-preserved-without-decoder`);return undefined
}
export function importGltfToSpatialScene(gltf:Json,options:VSRGltfImportOptions={}):VSRGltfImportResult{
  if(gltf.asset?.version!=='2.0')throw new Error(`Unsupported glTF version ${String(gltf.asset?.version)}.`);const buffers=loadBuffers(gltf,options),warnings:string[]=[],textures:VSRSpatialTexture[]=[],textureIds=new Map<number,string>();
  for(let index=0;index<(gltf.textures??[]).length;index++){const texture=gltf.textures[index],id=`texture:gltf:${index}`,loaded=textureFromImage(gltf,texture.source,id,warnings,gltf.samplers?.[texture.sampler]??{});if(loaded){textures.push(loaded);textureIds.set(index,id)}}
  const materials:VSRSpatialMaterial[]=(gltf.materials??[]).map((material:Json,index:number)=>{
    const pbr=material.pbrMetallicRoughness??{};
    return{
      id:`material:gltf:${index}`,
      baseColor:colorHex(pbr.baseColorFactor,'#ffffff'),
      metallic:pbr.metallicFactor??1,
      roughness:pbr.roughnessFactor??1,
      emissive:colorHex([...(material.emissiveFactor??[0,0,0]),1],'#000000'),
      emissiveStrength:material.extensions?.KHR_materials_emissive_strength?.emissiveStrength??1,
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
  const skins:VSRSpatialSkin[]=(gltf.skins??[]).map((skin:Json,index:number)=>{const joints=(skin.joints??[]).map((joint:number)=>`node:gltf:${joint}`),flat=skin.inverseBindMatrices===undefined?[]:accessorValues(gltf,buffers,skin.inverseBindMatrices),inverseBindMatrices=joints.map((_:string,jointIndex:number)=>(flat.length?flat.slice(jointIndex*16,jointIndex*16+16):identityMat4()) as Mat4);return{id:`skin:gltf:${index}`,joints,inverseBindMatrices}});
  const meshes:VSRSpatialMesh[]=[],primitiveMaterial=new Map<string,string>();for(let meshIndex=0;meshIndex<(gltf.meshes??[]).length;meshIndex++)for(let primitiveIndex=0;primitiveIndex<(gltf.meshes[meshIndex].primitives??[]).length;primitiveIndex++){const primitive=gltf.meshes[meshIndex].primitives[primitiveIndex];if((primitive.mode??4)!==4)throw new Error('Only glTF TRIANGLES primitives are supported.');const id=`mesh:gltf:${meshIndex}:${primitiveIndex}`,positions=accessorValues(gltf,buffers,primitive.attributes.POSITION),normals=primitive.attributes.NORMAL===undefined?undefined:accessorValues(gltf,buffers,primitive.attributes.NORMAL),uvs=primitive.attributes.TEXCOORD_0===undefined?undefined:accessorValues(gltf,buffers,primitive.attributes.TEXCOORD_0),indices=primitive.indices===undefined?Array.from({length:positions.length/3},(_,i)=>i):accessorValues(gltf,buffers,primitive.indices).map(Math.trunc),jointIndices=primitive.attributes.JOINTS_0===undefined?undefined:accessorValues(gltf,buffers,primitive.attributes.JOINTS_0).map(Math.trunc),jointWeights=primitive.attributes.WEIGHTS_0===undefined?undefined:accessorValues(gltf,buffers,primitive.attributes.WEIGHTS_0),morphTargets=(primitive.targets??[]).map((target:Json,targetIndex:number)=>({id:`morph:gltf:${meshIndex}:${primitiveIndex}:${targetIndex}`,positions:target.POSITION===undefined?new Array<number>(positions.length).fill(0):accessorValues(gltf,buffers,target.POSITION),normals:target.NORMAL===undefined?undefined:accessorValues(gltf,buffers,target.NORMAL),defaultWeight:gltf.meshes[meshIndex].weights?.[targetIndex]??0}));meshes.push({id,positions,normals,uvs,indices,jointIndices,jointWeights,morphTargets:morphTargets.length?morphTargets:undefined});primitiveMaterial.set(id,`material:gltf:${primitive.material??0}`)}
  const nodes:VSRSpatialNode[]=[];for(let nodeIndex=0;nodeIndex<(gltf.nodes??[]).length;nodeIndex++){const node=gltf.nodes[nodeIndex],base={id:`node:gltf:${nodeIndex}`,transform:{translation:node.translation as Vec3|undefined,rotationQuaternion:quaternionValue(node.rotation),scale:node.scale as Vec3|undefined}},skinId=node.skin===undefined?undefined:`skin:gltf:${node.skin}`,morphWeights=node.weights as number[]|undefined;const primitives=node.mesh===undefined?[]:(gltf.meshes[node.mesh]?.primitives??[]);if(primitives.length<=1){const meshId=node.mesh===undefined?undefined:`mesh:gltf:${node.mesh}:0`;nodes.push({...base,meshId,materialId:meshId?primitiveMaterial.get(meshId):undefined,skinId,morphWeights})}else{nodes.push({...base,skinId,morphWeights});for(let p=0;p<primitives.length;p++){const meshId=`mesh:gltf:${node.mesh}:${p}`;nodes.push({id:`node:gltf:${nodeIndex}:primitive:${p}`,parentId:base.id,meshId,materialId:primitiveMaterial.get(meshId),skinId,morphWeights})}}}
  for(let parent=0;parent<(gltf.nodes??[]).length;parent++)for(const child of gltf.nodes[parent].children??[]){const target=nodes.find(node=>node.id===`node:gltf:${child}`);if(target)target.parentId=`node:gltf:${parent}`}
  const cameras:VSRSpatialCamera[]=(gltf.cameras??[]).map((camera:Json,index:number)=>{const nodeIndex=(gltf.nodes??[]).findIndex((node:Json)=>node.camera===index),node=gltf.nodes?.[nodeIndex]??{};return{id:`camera:gltf:${index}`,projection:camera.type==='orthographic'?'orthographic':'perspective',fovYDeg:camera.perspective?.yfov===undefined?undefined:camera.perspective.yfov*180/Math.PI,orthoHeight:camera.orthographic?.ymag===undefined?undefined:camera.orthographic.ymag*2,near:camera.perspective?.znear??camera.orthographic?.znear??.1,far:camera.perspective?.zfar??camera.orthographic?.zfar??1000,transform:{translation:node.translation as Vec3|undefined,rotationQuaternion:quaternionValue(node.rotation),scale:node.scale as Vec3|undefined}}});if(!cameras.length&&options.defaultCamera!==false)cameras.push({id:'camera:gltf:default',projection:'perspective',fovYDeg:55,near:.1,far:1000,transform:{translation:[0,1.5,5]}});
  const punctual=gltf.extensions?.KHR_lights_punctual?.lights??[],lights:VSRSpatialLight[]=[{id:'light:gltf:ambient',kind:'ambient',color:'#ffffff',intensity:.12}];for(let nodeIndex=0;nodeIndex<(gltf.nodes??[]).length;nodeIndex++){const node=gltf.nodes[nodeIndex],lightIndex=node.extensions?.KHR_lights_punctual?.light;if(lightIndex===undefined)continue;const light=punctual[lightIndex]??{},kind=light.type==='directional'?'directional':'point';lights.push({id:`light:gltf:${lightIndex}`,kind,color:colorHex([...(light.color??[1,1,1]),1]),intensity:light.intensity??1,range:light.range,position:node.translation as Vec3|undefined,direction:kind==='directional'?[0,-1,0]:undefined,castShadow:true})}
  const animations:VSRSpatialAnimationClip[]=(gltf.animations??[]).map((animation:Json,animationIndex:number)=>{const channels:VSRSpatialAnimationChannel[]=[];let duration=0;for(const channel of animation.channels??[]){const sampler=animation.samplers[channel.sampler],times=accessorValues(gltf,buffers,sampler.input),flat=accessorValues(gltf,buffers,sampler.output),path=(channel.target.path==='rotation'?'rotationQuaternion':channel.target.path) as VSRSpatialAnimationPath;if(!['translation','rotationQuaternion','scale'].includes(path)){warnings.push(`animation:${animationIndex}:unsupported-path:${path}`);continue}const dimension=path==='rotationQuaternion'?4:3,interpolation=sampler.interpolation==='STEP'?'STEP':sampler.interpolation==='CUBICSPLINE'?'CUBICSPLINE':'LINEAR',values:(Vec3|Vec4)[]=[],inTangents:(Vec3|Vec4)[]=[],outTangents:(Vec3|Vec4)[]=[],valueOf=(raw:number[]):Vec3|Vec4=>dimension===4?raw as Vec4:raw as Vec3;if(interpolation==='CUBICSPLINE'){const stride=dimension*3;if(flat.length!==times.length*stride){warnings.push(`animation:${animationIndex}:invalid-cubic-output:${channel.target.path}`);continue}for(let index=0;index<times.length;index++){const base=index*stride;inTangents.push(valueOf(flat.slice(base,base+dimension)));values.push(valueOf(flat.slice(base+dimension,base+dimension*2)));outTangents.push(valueOf(flat.slice(base+dimension*2,base+stride)))}}else{if(flat.length!==times.length*dimension){warnings.push(`animation:${animationIndex}:invalid-output:${channel.target.path}`);continue}for(let index=0;index<times.length;index++)values.push(valueOf(flat.slice(index*dimension,index*dimension+dimension)))}duration=Math.max(duration,...times);channels.push({nodeId:`node:gltf:${channel.target.node}`,path,times,values,interpolation,...(interpolation==='CUBICSPLINE'?{inTangents,outTangents}:{})})}return{id:`animation:gltf:${animationIndex}`,duration,channels}});
  const sceneId=options.sceneId??`gltf:${cryptographicHash(gltf).slice(0,16)}`,scene:VSRSpatialScene3D={format:VSR_SPATIAL_SCENE_FORMAT,sceneId,title:options.title??gltf.scene?.name??'glTF 2.0 Asset',activeCameraId:cameras[0]!.id,meshes,materials,textures,animations,skins,nodes,cameras,lights,reality:{worldId:`world:${sceneId}`,realityRoot:cryptographicHash({asset:gltf.asset,scene:gltf.scene,nodes:gltf.nodes})}};
  const materialTextureBindingCount=materials.reduce((sum,material)=>sum+[material.baseColorTextureId,material.metallicRoughnessTextureId,material.normalTextureId,material.occlusionTextureId,material.emissiveTextureId].filter(Boolean).length,0),morphTargetCount=meshes.reduce((sum,mesh)=>sum+(mesh.morphTargets?.length??0),0),base={format:VSR_GLTF_IMPORT_FORMAT,assetVersion:VSR_GLTF_ASSET_VERSION,sceneId,meshCount:meshes.length,nodeCount:nodes.length,materialCount:materials.length,textureCount:textures.length,materialTextureBindingCount,animationCount:animations.length,skinCount:skins.length,morphTargetCount,sourceRoot:cryptographicHash(gltf),sceneRoot:cryptographicHash(scene),warnings};return{scene,receipt:{...base,receiptRoot:cryptographicHash(base)}};
}
export function verifyGltfImportReceipt(receipt:VSRGltfImportReceipt):boolean{const {receiptRoot,...base}=receipt;return cryptographicHash(base)===receiptRoot}
