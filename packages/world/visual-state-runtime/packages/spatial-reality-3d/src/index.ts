import { cryptographicHash } from '../../spec/src/index.js';
import { encodePng, PixelSurface, parseColor } from '../../backend-canvas/src/index.js';

export const VSR_SPATIAL_REALITY_VERSION='0.8.0-alpha.1';
export const VSR_SPATIAL_SCENE_FORMAT='vsr.spatial-scene.v0.4' as const;
export const VSR_SPATIAL_FRAME_FORMAT='vsr.spatial-frame-plan.v0.4' as const;

export type Vec2=[number,number];
export type Vec3=[number,number,number];
export type Vec4=[number,number,number,number];
export type Mat4=[number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number];
export type VSRSpatialProjection='perspective'|'orthographic';
export type VSRSpatialLightKind='ambient'|'directional'|'point';
export type VSRSpatialQualityTier='economy'|'balanced'|'quality'|'cinematic';

export interface VSRSpatialTransform {translation?:Vec3;rotationEulerDeg?:Vec3;rotationQuaternion?:Vec4;scale?:Vec3}
export interface VSRSpatialMorphTarget {id?:string;positions:number[];normals?:number[];defaultWeight?:number}
export interface VSRSpatialSkin {id:string;joints:string[];inverseBindMatrices?:Mat4[]}
export interface VSRSpatialMesh {
  id:string;
  positions:number[];
  normals?:number[];
  uvs?:number[];
  indices:number[];
  jointIndices?:number[];
  jointWeights?:number[];
  morphTargets?:VSRSpatialMorphTarget[];
  topology?:'triangle-list';
}
export interface VSRSpatialMaterial {
  id:string;
  baseColor?:string;
  metallic?:number;
  roughness?:number;
  emissive?:string;
  emissiveStrength?:number;
  doubleSided?:boolean;
  opacity?:number;
  occlusionStrength?:number;
  clearcoat?:number;
  clearcoatRoughness?:number;
  ior?:number;
  baseColorTextureId?:string;
  metallicRoughnessTextureId?:string;
  normalTextureId?:string;
  occlusionTextureId?:string;
  emissiveTextureId?:string;
  normalScale?:number;
  alphaMode?:'OPAQUE'|'MASK'|'BLEND';
  alphaCutoff?:number;
}
export interface VSRSpatialTexture {
  id:string;
  width:number;
  height:number;
  pixels:number[];
  colorSpace?:'srgb'|'linear';
  wrapU?:'repeat'|'clamp';
  wrapV?:'repeat'|'clamp';
  filter?:'nearest'|'linear';
}
export type VSRSpatialAnimationPath='translation'|'rotationEulerDeg'|'rotationQuaternion'|'scale';
export type VSRSpatialAnimationValue=Vec3|Vec4;
export interface VSRSpatialAnimationChannel {nodeId:string;path:VSRSpatialAnimationPath;times:number[];values:VSRSpatialAnimationValue[];inTangents?:VSRSpatialAnimationValue[];outTangents?:VSRSpatialAnimationValue[];interpolation?:'LINEAR'|'STEP'|'CUBICSPLINE'}
export interface VSRSpatialAnimationClip {id:string;duration:number;channels:VSRSpatialAnimationChannel[]}
export type VSRSpatialAnimationBlendMode='override'|'additive';
export interface VSRSpatialAnimationLayer {clipId:string;timeSeconds:number;weight?:number;loop?:boolean;mode?:VSRSpatialAnimationBlendMode;nodeIds?:string[]}
export interface VSRSpatialAnimationGraphState {id:string;clipId:string;speed?:number;loop?:boolean;nodeIds?:string[]}
export interface VSRSpatialAnimationGraph {initialState:string;states:VSRSpatialAnimationGraphState[]}
export interface VSRSpatialAnimationGraphInput {graph:VSRSpatialAnimationGraph;stateId?:string;timeSeconds:number;transition?:{fromStateId:string;toStateId:string;progress:number}}
export interface VSRSpatialLOD {maxDistance:number;meshId:string}
export interface VSRSpatialNode {
  id:string;
  parentId?:string;
  meshId?:string;
  materialId?:string;
  transform?:VSRSpatialTransform;
  visible?:boolean;
  castShadow?:boolean;
  receiveShadow?:boolean;
  skinId?:string;
  morphWeights?:number[];
  lods?:VSRSpatialLOD[];
  tags?:string[];
}
export interface VSRSpatialCamera {
  id:string;
  transform:VSRSpatialTransform;
  projection:VSRSpatialProjection;
  fovYDeg?:number;
  orthoHeight?:number;
  near?:number;
  far?:number;
}
export interface VSRSpatialLight {
  id:string;
  kind:VSRSpatialLightKind;
  color?:string;
  intensity?:number;
  direction?:Vec3;
  position?:Vec3;
  range?:number;
  castShadow?:boolean;
}
export interface VSRSpatialRealityBinding {worldId:string;generation?:number;realityRoot?:string;evidenceRoot?:string}
export interface VSRSpatialScene3D {
  format:typeof VSR_SPATIAL_SCENE_FORMAT;
  sceneId:string;
  title?:string;
  background?:string;
  activeCameraId:string;
  meshes:VSRSpatialMesh[];
  materials:VSRSpatialMaterial[];
  textures?:VSRSpatialTexture[];
  animations?:VSRSpatialAnimationClip[];
  skins?:VSRSpatialSkin[];
  nodes:VSRSpatialNode[];
  cameras:VSRSpatialCamera[];
  lights:VSRSpatialLight[];
  reality?:VSRSpatialRealityBinding;
}
export interface VSRSpatialCompileOptions {
  width?:number;
  height?:number;
  qualityTier?:VSRSpatialQualityTier;
  enableShadows?:boolean;
  shadowMapSize?:number;
  maxLights?:number;
  lodBias?:number;
  animation?:{clipId:string;timeSeconds:number;loop?:boolean};
  animationLayers?:VSRSpatialAnimationLayer[];
  animationGraph?:VSRSpatialAnimationGraphInput;
}
export interface VSRSpatialResolvedBudget {
  qualityTier:VSRSpatialQualityTier;
  width:number;
  height:number;
  maxLights:number;
  shadowMapSize:number;
  shadows:boolean;
  lodBias:number;
}
export interface VSRSpatialMeshBounds {min:Vec3;max:Vec3;center:Vec3;radius:number}
export interface VSRSpatialDrawPacket {
  nodeId:string;
  meshId:string;
  materialId:string;
  worldMatrix:Mat4;
  worldBounds:VSRSpatialMeshBounds;
  distanceToCamera:number;
  lodLevel:number;
  indexCount:number;
  castShadow:boolean;
  receiveShadow:boolean;
  textureBindings:{baseColor?:string;metallicRoughness?:string;normal?:string;occlusion?:string;emissive?:string};
  skinId?:string;
  jointMatrices:Mat4[];
  morphWeights:number[];
  deformationRoot:string;
  packetRoot:string;
}
export interface VSRSpatialRenderPass {id:string;kind:'shadow-depth'|'scene-depth-color'|'tone-map';dependsOn:string[];resourceIds:string[]}
export interface VSRSpatialGPUResource {id:string;kind:'vertex-buffer'|'index-buffer'|'material-buffer'|'light-buffer'|'joint-buffer'|'morph-buffer'|'texture-2d'|'depth-texture'|'color-texture'|'shadow-texture';byteLength:number;format?:string;resourceRoot:string}
export interface VSRSpatialFrameStats {meshCount:number;nodeCount:number;textureCount:number;materialTextureBindings:number;animationClipCount:number;visibleDraws:number;culledDraws:number;triangleCount:number;lightCount:number;shadowCasterCount:number;skinnedDraws:number;morphedDraws:number;lodHistogram:Record<string,number>}
export interface VSRSpatialFramePlan {
  format:typeof VSR_SPATIAL_FRAME_FORMAT;
  version:string;
  sceneId:string;
  viewport:{width:number;height:number};
  budget:VSRSpatialResolvedBudget;
  camera:{id:string;viewMatrix:Mat4;projectionMatrix:Mat4;viewProjectionMatrix:Mat4;position:Vec3};
  drawPackets:VSRSpatialDrawPacket[];
  lights:VSRSpatialLight[];
  passes:VSRSpatialRenderPass[];
  resources:VSRSpatialGPUResource[];
  shaders:{vertex:string;fragment:string;shadowVertex:string;sourceRoot:string};
  stats:VSRSpatialFrameStats;
  sourceRealityRoot:string;
  geometryRoot:string;
  materialRoot:string;
  textureRoot:string;
  animationRoot:string;
  commandRoot:string;
  frameRoot:string;
}
export interface VSRSpatialFrameVerification {ok:boolean;diagnostics:string[]}
export interface VSRSpatialReferenceRender {png:Uint8Array;pixelRoot:string;framePlan:VSRSpatialFramePlan;depthRange:{min:number;max:number}}

const EPS=1e-9;
const clamp=(value:number,min:number,max:number):number=>Math.max(min,Math.min(max,value));
const add3=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub3=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const scale3=(a:Vec3,s:number):Vec3=>[a[0]*s,a[1]*s,a[2]*s];
const dot3=(a:Vec3,b:Vec3):number=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross3=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length3=(a:Vec3):number=>Math.hypot(a[0],a[1],a[2]);
const normalize3=(a:Vec3):Vec3=>{const l=length3(a);return l<EPS?[0,0,0]:[a[0]/l,a[1]/l,a[2]/l]};
const distance3=(a:Vec3,b:Vec3):number=>length3(sub3(a,b));
const radians=(deg:number):number=>deg*Math.PI/180;
const dot4=(a:Vec4,b:Vec4):number=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
const normalizeQuaternion=(value:Vec4):Vec4=>{const length=Math.hypot(value[0],value[1],value[2],value[3]);return length<EPS?[0,0,0,1]:[value[0]/length,value[1]/length,value[2]/length,value[3]/length]};

export function quaternionSlerp(a:Vec4,b:Vec4,t:number):Vec4{let end=normalizeQuaternion(b),start=normalizeQuaternion(a),cosine=dot4(start,end);if(cosine<0){end=[-end[0],-end[1],-end[2],-end[3]];cosine=-cosine}if(cosine>.9995)return normalizeQuaternion([start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t,start[2]+(end[2]-start[2])*t,start[3]+(end[3]-start[3])*t]);const angle=Math.acos(clamp(cosine,-1,1)),sinAngle=Math.sin(angle),aWeight=Math.sin((1-t)*angle)/sinAngle,bWeight=Math.sin(t*angle)/sinAngle;return normalizeQuaternion([start[0]*aWeight+end[0]*bWeight,start[1]*aWeight+end[1]*bWeight,start[2]*aWeight+end[2]*bWeight,start[3]*aWeight+end[3]*bWeight])}
function quaternionToMat4(value:Vec4):Mat4{const [x,y,z,w]=normalizeQuaternion(value),xx=x*x,yy=y*y,zz=z*z,xy=x*y,xz=x*z,yz=y*z,wx=w*x,wy=w*y,wz=w*z;return[1-2*(yy+zz),2*(xy-wz),2*(xz+wy),0,2*(xy+wz),1-2*(xx+zz),2*(yz-wx),0,2*(xz-wy),2*(yz+wx),1-2*(xx+yy),0,0,0,0,1]}

export function identityMat4():Mat4{return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}
export function multiplyMat4(a:Mat4,b:Mat4):Mat4{const out=new Array<number>(16).fill(0);for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(let k=0;k<4;k++)out[r*4+c]!+=a[r*4+k]!*b[k*4+c]!;return out as Mat4}
export function transformVec4(m:Mat4,v:Vec4):Vec4{return[
  m[0]*v[0]+m[1]*v[1]+m[2]*v[2]+m[3]*v[3],
  m[4]*v[0]+m[5]*v[1]+m[6]*v[2]+m[7]*v[3],
  m[8]*v[0]+m[9]*v[1]+m[10]*v[2]+m[11]*v[3],
  m[12]*v[0]+m[13]*v[1]+m[14]*v[2]+m[15]*v[3]
]}
export function transformPoint3(m:Mat4,p:Vec3):Vec3{const v=transformVec4(m,[p[0],p[1],p[2],1]),w=Math.abs(v[3])<EPS?1:v[3];return[v[0]/w,v[1]/w,v[2]/w]}
export function transformDirection3(m:Mat4,p:Vec3):Vec3{return normalize3([m[0]*p[0]+m[1]*p[1]+m[2]*p[2],m[4]*p[0]+m[5]*p[1]+m[6]*p[2],m[8]*p[0]+m[9]*p[1]+m[10]*p[2]])}

export function transformToMat4(transform:VSRSpatialTransform={}):Mat4{
  const [tx,ty,tz]=transform.translation??[0,0,0], [sx,sy,sz]=transform.scale??[1,1,1];
  const [rx,ry,rz]=(transform.rotationEulerDeg??[0,0,0]).map(radians) as Vec3;
  const cx=Math.cos(rx),sxv=Math.sin(rx),cy=Math.cos(ry),syv=Math.sin(ry),cz=Math.cos(rz),szv=Math.sin(rz);
  const mx:Mat4=[1,0,0,0,0,cx,-sxv,0,0,sxv,cx,0,0,0,0,1];
  const my:Mat4=[cy,0,syv,0,0,1,0,0,-syv,0,cy,0,0,0,0,1];
  const mz:Mat4=[cz,-szv,0,0,szv,cz,0,0,0,0,1,0,0,0,0,1];
  const scale:Mat4=[sx,0,0,0,0,sy,0,0,0,0,sz,0,0,0,0,1];
  const translation:Mat4=[1,0,0,tx,0,1,0,ty,0,0,1,tz,0,0,0,1];
  const rotation=transform.rotationQuaternion?quaternionToMat4(transform.rotationQuaternion):multiplyMat4(mz,multiplyMat4(my,mx));
  return multiplyMat4(translation,multiplyMat4(rotation,scale));
}
export function perspectiveMat4(fovYDeg:number,aspect:number,near:number,far:number):Mat4{const f=1/Math.tan(radians(fovYDeg)/2),nf=1/(near-far);return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,2*far*near*nf,0,0,-1,0]}
export function orthographicMat4(height:number,aspect:number,near:number,far:number):Mat4{const width=height*aspect;return[2/width,0,0,0,0,2/height,0,0,0,0,-2/(far-near),-(far+near)/(far-near),0,0,0,1]}
export function lookAtMat4(eye:Vec3,target:Vec3,up:Vec3=[0,1,0]):Mat4{const z=normalize3(sub3(eye,target)),x=normalize3(cross3(up,z)),y=cross3(z,x);return[x[0],x[1],x[2],-dot3(x,eye),y[0],y[1],y[2],-dot3(y,eye),z[0],z[1],z[2],-dot3(z,eye),0,0,0,1]}

export function cameraWorldMatrix(camera:VSRSpatialCamera):Mat4{return transformToMat4(camera.transform)}
export function cameraPosition(camera:VSRSpatialCamera):Vec3{return camera.transform.translation??[0,0,0]}
export function cameraForward(camera:VSRSpatialCamera):Vec3{return transformDirection3(cameraWorldMatrix(camera),[0,0,-1])}
export function cameraViewMatrix(camera:VSRSpatialCamera):Mat4{const eye=cameraPosition(camera),target=add3(eye,cameraForward(camera));return lookAtMat4(eye,target,[0,1,0])}

function validateMesh(mesh:VSRSpatialMesh):void{if(mesh.positions.length<9||mesh.positions.length%3!==0)throw new Error(`Mesh ${mesh.id} positions must contain XYZ triples.`);if(mesh.indices.length<3||mesh.indices.length%3!==0)throw new Error(`Mesh ${mesh.id} indices must contain triangle triples.`);const vertices=mesh.positions.length/3;for(const index of mesh.indices)if(!Number.isInteger(index)||index<0||index>=vertices)throw new Error(`Mesh ${mesh.id} has invalid index ${index}.`);if(mesh.normals&&mesh.normals.length!==mesh.positions.length)throw new Error(`Mesh ${mesh.id} normals length mismatch.`);if(mesh.uvs&&mesh.uvs.length!==vertices*2)throw new Error(`Mesh ${mesh.id} UV length mismatch.`);if(mesh.jointIndices&&mesh.jointIndices.length!==vertices*4)throw new Error(`Mesh ${mesh.id} joint index length mismatch.`);if(mesh.jointWeights&&mesh.jointWeights.length!==vertices*4)throw new Error(`Mesh ${mesh.id} joint weight length mismatch.`);for(const index of mesh.jointIndices??[])if(!Number.isInteger(index)||index<0)throw new Error(`Mesh ${mesh.id} has invalid joint index ${index}.`);for(const weight of mesh.jointWeights??[])if(!Number.isFinite(weight)||weight<0)throw new Error(`Mesh ${mesh.id} has invalid joint weight ${weight}.`);if((mesh.morphTargets?.length??0)>4)throw new Error(`Mesh ${mesh.id} supports at most four morph targets.`);for(const target of mesh.morphTargets??[]){if(target.positions.length!==mesh.positions.length)throw new Error(`Mesh ${mesh.id} morph target ${target.id??'unnamed'} position length mismatch.`);if(target.normals&&target.normals.length!==mesh.positions.length)throw new Error(`Mesh ${mesh.id} morph target ${target.id??'unnamed'} normal length mismatch.`)}}
export function calculateMeshNormals(mesh:VSRSpatialMesh):number[]{validateMesh({...mesh,normals:undefined});const normals=new Array<number>(mesh.positions.length).fill(0);for(let i=0;i<mesh.indices.length;i+=3){const ia=mesh.indices[i]!*3,ib=mesh.indices[i+1]!*3,ic=mesh.indices[i+2]!*3;const a:[number,number,number]=[mesh.positions[ia]!,mesh.positions[ia+1]!,mesh.positions[ia+2]!],b:[number,number,number]=[mesh.positions[ib]!,mesh.positions[ib+1]!,mesh.positions[ib+2]!],c:[number,number,number]=[mesh.positions[ic]!,mesh.positions[ic+1]!,mesh.positions[ic+2]!],n=cross3(sub3(b,a),sub3(c,a));for(const base of [ia,ib,ic]){normals[base]!+=n[0];normals[base+1]!+=n[1];normals[base+2]!+=n[2]}}for(let i=0;i<normals.length;i+=3){const n=normalize3([normals[i]!,normals[i+1]!,normals[i+2]!]);normals[i]=n[0];normals[i+1]=n[1];normals[i+2]=n[2]}return normals}
export function meshBounds(mesh:VSRSpatialMesh):VSRSpatialMeshBounds{validateMesh(mesh);let min:Vec3=[Infinity,Infinity,Infinity],max:Vec3=[-Infinity,-Infinity,-Infinity];for(let i=0;i<mesh.positions.length;i+=3){const x=mesh.positions[i]!,y=mesh.positions[i+1]!,z=mesh.positions[i+2]!;min=[Math.min(min[0],x),Math.min(min[1],y),Math.min(min[2],z)];max=[Math.max(max[0],x),Math.max(max[1],y),Math.max(max[2],z)]}const center:Vec3=[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2];let radius=0;for(let i=0;i<mesh.positions.length;i+=3)radius=Math.max(radius,distance3(center,[mesh.positions[i]!,mesh.positions[i+1]!,mesh.positions[i+2]!]));return{min,max,center,radius}}
function transformBounds(bounds:VSRSpatialMeshBounds,world:Mat4):VSRSpatialMeshBounds{const corners:Vec3[]=[];for(const x of [bounds.min[0],bounds.max[0]])for(const y of [bounds.min[1],bounds.max[1]])for(const z of [bounds.min[2],bounds.max[2]])corners.push(transformPoint3(world,[x,y,z]));let min:Vec3=[Infinity,Infinity,Infinity],max:Vec3=[-Infinity,-Infinity,-Infinity];for(const point of corners){min=[Math.min(min[0],point[0]),Math.min(min[1],point[1]),Math.min(min[2],point[2])];max=[Math.max(max[0],point[0]),Math.max(max[1],point[1]),Math.max(max[2],point[2])]}const center:Vec3=[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2],radius=Math.max(...corners.map(point=>distance3(point,center)));return{min,max,center,radius}}

export function createCubeMesh(id='mesh:cube',size=1):VSRSpatialMesh{const h=size/2,faces:Array<{normal:Vec3;vertices:Vec3[]}>= [
  {normal:[0,0,1],vertices:[[-h,-h,h],[h,-h,h],[h,h,h],[-h,h,h]]},
  {normal:[0,0,-1],vertices:[[h,-h,-h],[-h,-h,-h],[-h,h,-h],[h,h,-h]]},
  {normal:[0,1,0],vertices:[[-h,h,h],[h,h,h],[h,h,-h],[-h,h,-h]]},
  {normal:[0,-1,0],vertices:[[-h,-h,-h],[h,-h,-h],[h,-h,h],[-h,-h,h]]},
  {normal:[1,0,0],vertices:[[h,-h,h],[h,-h,-h],[h,h,-h],[h,h,h]]},
  {normal:[-1,0,0],vertices:[[-h,-h,-h],[-h,-h,h],[-h,h,h],[-h,h,-h]]},
];const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[];for(const face of faces){const offset=positions.length/3;for(const vertex of face.vertices){positions.push(...vertex);normals.push(...face.normal)}uvs.push(0,0,1,0,1,1,0,1);indices.push(offset,offset+1,offset+2,offset,offset+2,offset+3)}return{id,positions,normals,uvs,indices}}
export function createPlaneMesh(id='mesh:plane',width=10,depth=10):VSRSpatialMesh{return{id,positions:[-width/2,0,-depth/2,width/2,0,-depth/2,width/2,0,depth/2,-width/2,0,depth/2],normals:[0,1,0,0,1,0,0,1,0,0,1,0],uvs:[0,0,1,0,1,1,0,1],indices:[0,2,1,0,3,2]}}
export function createUVSphereMesh(id='mesh:sphere',radius=1,segments=20,rings=12):VSRSpatialMesh{segments=Math.max(3,Math.floor(segments));rings=Math.max(2,Math.floor(rings));const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[];for(let y=0;y<=rings;y++){const v=y/rings,phi=v*Math.PI;for(let x=0;x<=segments;x++){const u=x/segments,theta=u*Math.PI*2,n:Vec3=[Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta)];positions.push(n[0]*radius,n[1]*radius,n[2]*radius);normals.push(...n);uvs.push(u,1-v)}}for(let y=0;y<rings;y++)for(let x=0;x<segments;x++){const a=y*(segments+1)+x,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1)}return{id,positions,normals,uvs,indices}}

function sanitizeMaterial(material:VSRSpatialMaterial){return{
  id:material.id,
  baseColor:material.baseColor??'#b8c7e6',
  metallic:clamp(material.metallic??0,0,1),
  roughness:clamp(material.roughness??.6,.04,1),
  emissive:material.emissive??'#000000',
  emissiveStrength:Math.max(0,material.emissiveStrength??0),
  doubleSided:material.doubleSided??false,
  opacity:clamp(material.opacity??1,0,1),
  occlusionStrength:clamp(material.occlusionStrength??1,0,1),
  clearcoat:clamp(material.clearcoat??0,0,1),
  clearcoatRoughness:clamp(material.clearcoatRoughness??.12,.04,1),
  ior:clamp(material.ior??1.5,1,2.5),
  baseColorTextureId:material.baseColorTextureId,
  metallicRoughnessTextureId:material.metallicRoughnessTextureId,
  normalTextureId:material.normalTextureId,
  occlusionTextureId:material.occlusionTextureId,
  emissiveTextureId:material.emissiveTextureId,
  normalScale:Math.max(0,material.normalScale??1),
  alphaMode:material.alphaMode??'OPAQUE',
  alphaCutoff:clamp(material.alphaCutoff??.5,0,1)
}}
export function resolveSpatialBudget(options:VSRSpatialCompileOptions={}):VSRSpatialResolvedBudget{const qualityTier=options.qualityTier??'balanced',defaults={economy:{width:640,height:360,maxLights:4,shadowMapSize:128,shadows:false,lodBias:.8},balanced:{width:960,height:540,maxLights:8,shadowMapSize:256,shadows:true,lodBias:1},quality:{width:1280,height:720,maxLights:16,shadowMapSize:512,shadows:true,lodBias:1.2},cinematic:{width:1920,height:1080,maxLights:32,shadowMapSize:1024,shadows:true,lodBias:1.5}}[qualityTier];return{qualityTier,width:Math.max(16,Math.floor(options.width??defaults.width)),height:Math.max(16,Math.floor(options.height??defaults.height)),maxLights:Math.max(1,Math.floor(options.maxLights??defaults.maxLights)),shadowMapSize:Math.max(32,Math.floor(options.shadowMapSize??defaults.shadowMapSize)),shadows:options.enableShadows??defaults.shadows,lodBias:Math.max(.1,options.lodBias??defaults.lodBias)}}

function validateScene(scene:VSRSpatialScene3D):void{
  if(scene.format!==VSR_SPATIAL_SCENE_FORMAT)throw new Error(`Unsupported spatial scene format ${String(scene.format)}.`);
  const ids=new Set<string>();
  for(const mesh of scene.meshes){if(ids.has(mesh.id))throw new Error(`Duplicate mesh ${mesh.id}.`);ids.add(mesh.id);validateMesh(mesh)}
  for(const material of scene.materials)if(ids.has(material.id))throw new Error(`Duplicate id ${material.id}.`);else ids.add(material.id);
  for(const texture of scene.textures??[]){if(ids.has(texture.id))throw new Error(`Duplicate id ${texture.id}.`);ids.add(texture.id);if(texture.width<1||texture.height<1||texture.pixels.length!==texture.width*texture.height*4)throw new Error(`Texture ${texture.id} RGBA length mismatch.`)}
  for(const skin of scene.skins??[]){if(ids.has(skin.id))throw new Error(`Duplicate id ${skin.id}.`);ids.add(skin.id);if(!skin.joints.length)throw new Error(`Skin ${skin.id} must contain joints.`);if(skin.inverseBindMatrices&&skin.inverseBindMatrices.length!==skin.joints.length)throw new Error(`Skin ${skin.id} inverse bind matrix length mismatch.`)}
  for(const node of scene.nodes)if(ids.has(node.id))throw new Error(`Duplicate id ${node.id}.`);else ids.add(node.id);
  if(!scene.cameras.some(camera=>camera.id===scene.activeCameraId))throw new Error(`Missing active camera ${scene.activeCameraId}.`);
  const nodeIds=new Set(scene.nodes.map(node=>node.id)),textureIds=new Set((scene.textures??[]).map(texture=>texture.id)),skinIds=new Set((scene.skins??[]).map(skin=>skin.id));
  for(const skin of scene.skins??[])for(const joint of skin.joints)if(!nodeIds.has(joint))throw new Error(`Skin ${skin.id} missing joint ${joint}.`);
  for(const material of scene.materials){
    const bindings=[material.baseColorTextureId,material.metallicRoughnessTextureId,material.normalTextureId,material.occlusionTextureId,material.emissiveTextureId].filter((value):value is string=>Boolean(value));
    for(const textureId of bindings)if(!textureIds.has(textureId))throw new Error(`Material ${material.id} missing texture ${textureId}.`);
  }
  for(const node of scene.nodes){if(node.parentId&&!nodeIds.has(node.parentId))throw new Error(`Node ${node.id} missing parent ${node.parentId}.`);if(node.meshId&&!scene.meshes.some(mesh=>mesh.id===node.meshId))throw new Error(`Node ${node.id} missing mesh ${node.meshId}.`);if(node.materialId&&!scene.materials.some(material=>material.id===node.materialId))throw new Error(`Node ${node.id} missing material ${node.materialId}.`);if(node.skinId&&!skinIds.has(node.skinId))throw new Error(`Node ${node.id} missing skin ${node.skinId}.`)}
  const animationIds=new Set<string>();
  for(const clip of scene.animations??[]){if(animationIds.has(clip.id))throw new Error(`Duplicate animation ${clip.id}.`);animationIds.add(clip.id);if(!Number.isFinite(clip.duration)||clip.duration<0)throw new Error(`Animation ${clip.id} duration must be non-negative.`);for(const channel of clip.channels){if(!nodeIds.has(channel.nodeId))throw new Error(`Animation ${clip.id} missing node ${channel.nodeId}.`);const dimension=channel.path==='rotationQuaternion'?4:3;if(channel.times.length!==channel.values.length||!channel.times.length)throw new Error(`Animation ${clip.id} channel length mismatch.`);if(channel.interpolation==='CUBICSPLINE'&&(channel.inTangents?.length!==channel.values.length||channel.outTangents?.length!==channel.values.length))throw new Error(`Animation ${clip.id} cubic channel tangent length mismatch.`);for(let index=0;index<channel.times.length;index++){if(!Number.isFinite(channel.times[index]!)||(index>0&&channel.times[index]!<channel.times[index-1]!))throw new Error(`Animation ${clip.id} channel times must be finite and ordered.`);const value=channel.values[index]!;if(value.length!==dimension||value.some(component=>!Number.isFinite(component)))throw new Error(`Animation ${clip.id} channel value dimension mismatch.`);for(const tangent of [channel.inTangents?.[index],channel.outTangents?.[index]])if(tangent&&(tangent.length!==dimension||tangent.some(component=>!Number.isFinite(component))))throw new Error(`Animation ${clip.id} channel tangent dimension mismatch.`)}}}
}

function lerpVec3(a:Vec3,b:Vec3,t:number):Vec3{return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
function hermiteVec3(a:Vec3,b:Vec3,outTangent:Vec3,inTangent:Vec3,t:number,span:number):Vec3{const t2=t*t,t3=t2*t,h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2,h11=t3-t2;return[h00*a[0]+h10*span*outTangent[0]+h01*b[0]+h11*span*inTangent[0],h00*a[1]+h10*span*outTangent[1]+h01*b[1]+h11*span*inTangent[1],h00*a[2]+h10*span*outTangent[2]+h01*b[2]+h11*span*inTangent[2]]}
function hermiteVec4(a:Vec4,b:Vec4,outTangent:Vec4,inTangent:Vec4,t:number,span:number):Vec4{const t2=t*t,t3=t2*t,h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2,h11=t3-t2;return[h00*a[0]+h10*span*outTangent[0]+h01*b[0]+h11*span*inTangent[0],h00*a[1]+h10*span*outTangent[1]+h01*b[1]+h11*span*inTangent[1],h00*a[2]+h10*span*outTangent[2]+h01*b[2]+h11*span*inTangent[2],h00*a[3]+h10*span*outTangent[3]+h01*b[3]+h11*span*inTangent[3]]}
function sampleAnimationValue(channel:VSRSpatialAnimationChannel,index:number,nextIndex:number,alpha:number,span:number):VSRSpatialAnimationValue{const a=channel.values[index]!,b=channel.values[nextIndex]!;if(channel.interpolation==='STEP')return channel.path==='rotationQuaternion'?normalizeQuaternion(a as Vec4):a;if(channel.path==='rotationQuaternion'){if(channel.interpolation==='CUBICSPLINE'&&channel.outTangents?.[index]&&channel.inTangents?.[nextIndex])return normalizeQuaternion(hermiteVec4(a as Vec4,b as Vec4,channel.outTangents[index] as Vec4,channel.inTangents[nextIndex] as Vec4,alpha,span));return quaternionSlerp(a as Vec4,b as Vec4,alpha)}if(channel.interpolation==='CUBICSPLINE'&&channel.outTangents?.[index]&&channel.inTangents?.[nextIndex])return hermiteVec3(a as Vec3,b as Vec3,channel.outTangents[index] as Vec3,channel.inTangents[nextIndex] as Vec3,alpha,span);return lerpVec3(a as Vec3,b as Vec3,alpha)}
export function sampleSpatialAnimation(scene:VSRSpatialScene3D,clipId:string,timeSeconds:number,loop=true):Map<string,VSRSpatialTransform>{const clip=(scene.animations??[]).find(entry=>entry.id===clipId);if(!clip)throw new Error(`Missing animation ${clipId}.`);const t=clip.duration>0?(loop?((timeSeconds%clip.duration)+clip.duration)%clip.duration:clamp(timeSeconds,0,clip.duration)):0,out=new Map<string,VSRSpatialTransform>();for(const channel of clip.channels){let index=0;while(index<channel.times.length-2&&t>=channel.times[index+1]!)index++;const nextIndex=Math.min(index+1,channel.times.length-1),aTime=channel.times[index]!,bTime=channel.times[nextIndex]!,span=Math.max(EPS,bTime-aTime),alpha=channel.interpolation==='STEP'?0:clamp((t-aTime)/span,0,1),value=sampleAnimationValue(channel,index,nextIndex,alpha,span),current=out.get(channel.nodeId)??{};if(channel.path==='translation')current.translation=value as Vec3;else if(channel.path==='scale')current.scale=value as Vec3;else if(channel.path==='rotationQuaternion')current.rotationQuaternion=value as Vec4;else current.rotationEulerDeg=value as Vec3;out.set(channel.nodeId,current)}return out}

type WeightedVec3={sum:Vec3;weight:number};
type WeightedQuaternion={entries:Array<{value:Vec4;weight:number}>};
interface AnimationBlendAccumulator {translation?:WeightedVec3;rotationEulerDeg?:WeightedVec3;rotationQuaternion?:WeightedQuaternion;scale?:WeightedVec3}
const zero3:Vec3=[0,0,0],one3:Vec3=[1,1,1],identityQuaternion:Vec4=[0,0,0,1];
function weightedVec3(accumulator:Map<string,AnimationBlendAccumulator>,nodeId:string,path:'translation'|'rotationEulerDeg'|'scale',value:Vec3,weight:number):void{const current=accumulator.get(nodeId)??{};const target=current[path]??{sum:[0,0,0] as Vec3,weight:0};target.sum=[target.sum[0]+value[0]*weight,target.sum[1]+value[1]*weight,target.sum[2]+value[2]*weight];target.weight+=weight;current[path]=target;accumulator.set(nodeId,current)}
function weightedQuaternion(accumulator:Map<string,AnimationBlendAccumulator>,nodeId:string,value:Vec4,weight:number):void{const current=accumulator.get(nodeId)??{},target=current.rotationQuaternion??{entries:[]};target.entries.push({value:normalizeQuaternion(value),weight});current.rotationQuaternion=target;accumulator.set(nodeId,current)}
function blendVec3(base:Vec3|undefined,target:WeightedVec3|undefined,defaultValue:Vec3):Vec3|undefined{if(!target||target.weight<=EPS)return undefined;const baseWeight=Math.max(0,1-target.weight),total=baseWeight+target.weight,source=base??defaultValue;return[(source[0]*baseWeight+target.sum[0])/total,(source[1]*baseWeight+target.sum[1])/total,(source[2]*baseWeight+target.sum[2])/total]}
function blendQuaternion(base:Vec4|undefined,target:WeightedQuaternion|undefined):Vec4|undefined{if(!target||!target.entries.length)return undefined;const weight=target.entries.reduce((sum,entry)=>sum+entry.weight,0),entries=[{value:normalizeQuaternion(base??identityQuaternion),weight:Math.max(0,1-weight)},...target.entries].filter(entry=>entry.weight>EPS);if(!entries.length)return undefined;let result=entries[0]!.value,total=entries[0]!.weight;for(const entry of entries.slice(1)){const alpha=entry.weight/(total+entry.weight);result=quaternionSlerp(result,entry.value,alpha);total+=entry.weight}return normalizeQuaternion(result)}
function quaternionMultiply(a:Vec4,b:Vec4):Vec4{return normalizeQuaternion([a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]])}
function quaternionInverse(value:Vec4):Vec4{const normalized=normalizeQuaternion(value);return[-normalized[0],-normalized[1],-normalized[2],normalized[3]]}
function masked(layer:VSRSpatialAnimationLayer,nodeId:string):boolean{return!layer.nodeIds||layer.nodeIds.includes(nodeId)}
function applyAdditiveTransform(result:VSRSpatialTransform,sample:VSRSpatialTransform,reference:VSRSpatialTransform,weight:number):void{if(sample.translation){const base=result.translation??zero3,rest=reference.translation??zero3;result.translation=[base[0]+(sample.translation[0]-rest[0])*weight,base[1]+(sample.translation[1]-rest[1])*weight,base[2]+(sample.translation[2]-rest[2])*weight]}if(sample.scale){const base=result.scale??one3,rest=reference.scale??one3;result.scale=base.map((value,index)=>value*((sample.scale as Vec3)[index]!/(Math.abs(rest[index]!)<EPS?1:rest[index]!))**weight) as Vec3}if(sample.rotationEulerDeg){const base=result.rotationEulerDeg??[0,0,0],rest=reference.rotationEulerDeg??[0,0,0];result.rotationEulerDeg=[base[0]+(sample.rotationEulerDeg[0]-rest[0])*weight,base[1]+(sample.rotationEulerDeg[1]-rest[1])*weight,base[2]+(sample.rotationEulerDeg[2]-rest[2])*weight];delete result.rotationQuaternion}if(sample.rotationQuaternion){const base=result.rotationQuaternion??identityQuaternion,rest=reference.rotationQuaternion??identityQuaternion,delta=quaternionMultiply(quaternionInverse(rest),sample.rotationQuaternion);result.rotationQuaternion=quaternionMultiply(base,quaternionSlerp(identityQuaternion,delta,weight));delete result.rotationEulerDeg}}
export function sampleSpatialAnimationLayers(scene:VSRSpatialScene3D,layers:VSRSpatialAnimationLayer[]):Map<string,VSRSpatialTransform>{const overrides=new Map<string,AnimationBlendAccumulator>(),additives=new Map<string,Array<{sample:VSRSpatialTransform;reference:VSRSpatialTransform;weight:number}>>();for(const layer of layers){const weight=clamp(layer.weight??1,0,1);if(weight<=EPS)continue;const sample=sampleSpatialAnimation(scene,layer.clipId,layer.timeSeconds,layer.loop??true),reference=layer.mode==='additive'?sampleSpatialAnimation(scene,layer.clipId,0,false):undefined;for(const [nodeId,transform] of sample){if(!masked(layer,nodeId))continue;if(layer.mode==='additive'){const list=additives.get(nodeId)??[];list.push({sample:transform,reference:reference?.get(nodeId)??{},weight});additives.set(nodeId,list);continue}if(transform.translation)weightedVec3(overrides,nodeId,'translation',transform.translation,weight);if(transform.rotationEulerDeg)weightedVec3(overrides,nodeId,'rotationEulerDeg',transform.rotationEulerDeg,weight);if(transform.rotationQuaternion)weightedQuaternion(overrides,nodeId,transform.rotationQuaternion,weight);if(transform.scale)weightedVec3(overrides,nodeId,'scale',transform.scale,weight)}}const nodeById=new Map(scene.nodes.map(node=>[node.id,node])),nodeIds=new Set([...overrides.keys(),...additives.keys()]),result=new Map<string,VSRSpatialTransform>();for(const nodeId of nodeIds){const base=nodeById.get(nodeId)?.transform??{},accumulator=overrides.get(nodeId),transform:VSRSpatialTransform={...base};const translation=blendVec3(base.translation,accumulator?.translation,zero3),rotationEulerDeg=blendVec3(base.rotationEulerDeg,accumulator?.rotationEulerDeg,zero3),scale=blendVec3(base.scale,accumulator?.scale,one3),rotationQuaternion=blendQuaternion(base.rotationQuaternion,accumulator?.rotationQuaternion);if(translation)transform.translation=translation;if(scale)transform.scale=scale;if(rotationQuaternion){transform.rotationQuaternion=rotationQuaternion;delete transform.rotationEulerDeg}else if(rotationEulerDeg){transform.rotationEulerDeg=rotationEulerDeg;delete transform.rotationQuaternion}for(const additive of additives.get(nodeId)??[])applyAdditiveTransform(transform,additive.sample,additive.reference,additive.weight);result.set(nodeId,transform)}return result}
export function sampleSpatialAnimationGraph(scene:VSRSpatialScene3D,input:VSRSpatialAnimationGraphInput):Map<string,VSRSpatialTransform>{const states=new Map(input.graph.states.map(state=>[state.id,state])),transition=input.transition;if(transition){const from=states.get(transition.fromStateId),to=states.get(transition.toStateId);if(!from||!to)throw new Error('Animation graph transition references an unknown state.');const progress=clamp(transition.progress,0,1),time=input.timeSeconds;return sampleSpatialAnimationLayers(scene,[{clipId:from.clipId,timeSeconds:time*(from.speed??1),loop:from.loop??true,weight:1-progress,nodeIds:from.nodeIds},{clipId:to.clipId,timeSeconds:time*(to.speed??1),loop:to.loop??true,weight:progress,nodeIds:to.nodeIds}])}const state=states.get(input.stateId??input.graph.initialState);if(!state)throw new Error(`Animation graph state ${input.stateId??input.graph.initialState} is missing.`);return sampleSpatialAnimationLayers(scene,[{clipId:state.clipId,timeSeconds:input.timeSeconds*(state.speed??1),loop:state.loop??true,nodeIds:state.nodeIds}])}

function worldMatrices(scene:VSRSpatialScene3D,overrides=new Map<string,VSRSpatialTransform>()):Map<string,Mat4>{const byId=new Map(scene.nodes.map(node=>[node.id,node])),cache=new Map<string,Mat4>(),visiting=new Set<string>();const resolve=(id:string):Mat4=>{const cached=cache.get(id);if(cached)return cached;if(visiting.has(id))throw new Error(`Node hierarchy cycle at ${id}.`);visiting.add(id);const node=byId.get(id)!,override=overrides.get(id)??{},effective={...node.transform,...override},local=transformToMat4(effective),world=node.parentId?multiplyMat4(resolve(node.parentId),local):local;cache.set(id,world);visiting.delete(id);return world};for(const node of scene.nodes)resolve(node.id);return cache}
function resolveSpatialMorphWeights(mesh:VSRSpatialMesh,node:VSRSpatialNode):number[]{return(mesh.morphTargets??[]).slice(0,4).map((target,index)=>clamp(node.morphWeights?.[index]??target.defaultWeight??0,-1,1))}
function resolveSpatialDeformation(mesh:VSRSpatialMesh,node:VSRSpatialNode,skinById:Map<string,VSRSpatialSkin>,world:Map<string,Mat4>):{skinId?:string;jointMatrices:Mat4[];morphWeights:number[];deformationRoot:string}{const skin=node.skinId?skinById.get(node.skinId):undefined,jointMatrices=skin?skin.joints.map((joint,index)=>multiplyMat4(world.get(joint)!,skin.inverseBindMatrices?.[index]??identityMat4())):[identityMat4()],morphWeights=resolveSpatialMorphWeights(mesh,node),base={skinId:skin?.id??null,jointMatrices,morphWeights};return{skinId:skin?.id,jointMatrices,morphWeights,deformationRoot:cryptographicHash(base)}}
function deformSpatialMesh(mesh:VSRSpatialMesh,packet:VSRSpatialDrawPacket):VSRSpatialMesh{const targets=mesh.morphTargets?.slice(0,4)??[],weights=packet.morphWeights,hasMorph=targets.some((target,index)=>Math.abs(weights[index]??0)>EPS),hasSkin=Boolean(packet.skinId),hasDeformation=hasMorph||hasSkin;if(!hasDeformation)return mesh;const positions=mesh.positions.slice(),normals=(mesh.normals??calculateMeshNormals({...mesh,morphTargets:undefined})).slice();for(let targetIndex=0;targetIndex<targets.length;targetIndex++){const weight=weights[targetIndex]??0;if(Math.abs(weight)<EPS)continue;const target=targets[targetIndex]!;for(let index=0;index<positions.length;index++)positions[index]!+=target.positions[index]!*weight;for(let index=0;index<(target.normals?.length??0);index++)normals[index]!+=target.normals![index]!*weight}if(hasSkin){for(let vertex=0;vertex<positions.length/3;vertex++){const position:Vec3=[positions[vertex*3]!,positions[vertex*3+1]!,positions[vertex*3+2]!],normal:Vec3=[normals[vertex*3]!,normals[vertex*3+1]!,normals[vertex*3+2]!],indices=mesh.jointIndices?.slice(vertex*4,vertex*4+4)??[0,0,0,0],jointWeights=mesh.jointWeights?.slice(vertex*4,vertex*4+4)??[1,0,0,0];let skinnedPosition:Vec3=[0,0,0],skinnedNormal:Vec3=[0,0,0];for(let influence=0;influence<4;influence++){const weight=jointWeights[influence]??0,matrix=packet.jointMatrices[indices[influence]??0]??identityMat4();if(weight<=EPS)continue;skinnedPosition=add3(skinnedPosition,scale3(transformPoint3(matrix,position),weight));skinnedNormal=add3(skinnedNormal,scale3(transformDirection3(matrix,normal),weight))}positions[vertex*3]=skinnedPosition[0];positions[vertex*3+1]=skinnedPosition[1];positions[vertex*3+2]=skinnedPosition[2];normals[vertex*3]=skinnedNormal[0];normals[vertex*3+1]=skinnedNormal[1];normals[vertex*3+2]=skinnedNormal[2]}}return{...mesh,positions,normals,morphTargets:undefined}}
function chooseLOD(node:VSRSpatialNode,distance:number,bias:number):{meshId:string|undefined;level:number}{const lods=[...(node.lods??[])].sort((a,b)=>a.maxDistance-b.maxDistance);for(let i=0;i<lods.length;i++)if(distance<=lods[i]!.maxDistance*bias)return{meshId:lods[i]!.meshId,level:i};return{meshId:node.meshId??lods.at(-1)?.meshId,level:lods.length}}
function sphereInFrustum(bounds:VSRSpatialMeshBounds,viewProjection:Mat4):boolean{const clip=transformVec4(viewProjection,[bounds.center[0],bounds.center[1],bounds.center[2],1]);if(clip[3]<=0)return false;const margin=bounds.radius*Math.max(Math.abs(viewProjection[0]),Math.abs(viewProjection[5]),1);return clip[0]>=-clip[3]-margin&&clip[0]<=clip[3]+margin&&clip[1]>=-clip[3]-margin&&clip[1]<=clip[3]+margin&&clip[2]>=-clip[3]-margin&&clip[2]<=clip[3]+margin}

export const VSR_SPATIAL_VERTEX_WGSL_V04=`struct Camera { viewProjection: mat4x4<f32>, cameraPosition:vec4<f32>, ambient:vec4<f32>, sunDirection:vec4<f32>, sunColor:vec4<f32> }; @group(0) @binding(0) var<uniform> camera: Camera; struct Object { world:mat4x4<f32> }; @group(1) @binding(0) var<uniform> object:Object; @group(1) @binding(1) var<storage,read> jointMatrices:array<mat4x4<f32>>; struct Deformation { skinEnabled:f32, vertexCount:f32, morphCount:f32, _pad:f32, morphWeights:vec4<f32> }; @group(1) @binding(2) var<uniform> deformation:Deformation; @group(1) @binding(3) var<storage,read> morphDeltas:array<vec4<f32>>; struct VSIn { @location(0) position:vec3<f32>, @location(1) normal:vec3<f32>, @location(2) uv:vec2<f32>, @location(3) joints:vec4<f32>, @location(4) weights:vec4<f32>, @builtin(vertex_index) vertexIndex:u32 }; struct VSOut { @builtin(position) position:vec4<f32>, @location(0) worldPosition:vec3<f32>, @location(1) normal:vec3<f32>, @location(2) uv:vec2<f32> }; fn morphPosition(position:vec3<f32>,vertexIndex:u32)->vec3<f32>{var result=position;let vertexCount=u32(deformation.vertexCount);for(var morph:u32=0u;morph<4u;morph=morph+1u){if(morph<u32(deformation.morphCount)){result=result+morphDeltas[morph*vertexCount+vertexIndex].xyz*deformation.morphWeights[morph];}}return result;} fn skinPosition(position:vec3<f32>,joints:vec4<f32>,weights:vec4<f32>)->vec3<f32>{if(deformation.skinEnabled<0.5){return position;}let total=weights.x+weights.y+weights.z+weights.w;if(total<=0.0001){return position;}return(jointMatrices[u32(joints.x)]*vec4<f32>(position,1.0)*weights.x+jointMatrices[u32(joints.y)]*vec4<f32>(position,1.0)*weights.y+jointMatrices[u32(joints.z)]*vec4<f32>(position,1.0)*weights.z+jointMatrices[u32(joints.w)]*vec4<f32>(position,1.0)*weights.w).xyz/total;} fn skinNormal(normal:vec3<f32>,joints:vec4<f32>,weights:vec4<f32>)->vec3<f32>{if(deformation.skinEnabled<0.5){return normal;}let total=weights.x+weights.y+weights.z+weights.w;if(total<=0.0001){return normal;}return normalize((jointMatrices[u32(joints.x)]*vec4<f32>(normal,0.0)*weights.x+jointMatrices[u32(joints.y)]*vec4<f32>(normal,0.0)*weights.y+jointMatrices[u32(joints.z)]*vec4<f32>(normal,0.0)*weights.z+jointMatrices[u32(joints.w)]*vec4<f32>(normal,0.0)*weights.w).xyz);} @vertex fn vs_main(input:VSIn)->VSOut{var out:VSOut;let localPosition=skinPosition(morphPosition(input.position,input.vertexIndex),input.joints,input.weights);let worldPosition=object.world*vec4<f32>(localPosition,1.0);out.position=camera.viewProjection*worldPosition;out.worldPosition=worldPosition.xyz;out.normal=normalize((object.world*vec4<f32>(skinNormal(input.normal,input.joints,input.weights),0.0)).xyz);out.uv=input.uv;return out;}`;
export const VSR_SPATIAL_FRAGMENT_WGSL_V04=`
 struct Camera { viewProjection: mat4x4<f32>, cameraPosition:vec4<f32>, ambient:vec4<f32>, sunDirection:vec4<f32>, sunColor:vec4<f32> };
 @group(0) @binding(0) var<uniform> camera: Camera;
 struct ShadowCamera { lightViewProjection:mat4x4<f32>, params:vec4<f32> };
 @group(0) @binding(1) var shadowSampler:sampler_comparison;
 @group(0) @binding(2) var shadowMap:texture_depth_2d;
 @group(0) @binding(3) var<uniform> shadowCamera:ShadowCamera;
 struct Material { baseColor: vec4<f32>, params:vec4<f32>, emissive:vec4<f32>, advanced:vec4<f32> };
 @group(2) @binding(0) var<uniform> material:Material;
 @group(2) @binding(1) var baseColorSampler:sampler;
 @group(2) @binding(2) var baseColorTexture:texture_2d<f32>;
 @group(2) @binding(3) var metallicRoughnessSampler:sampler;
 @group(2) @binding(4) var metallicRoughnessTexture:texture_2d<f32>;
 @group(2) @binding(5) var normalSampler:sampler;
 @group(2) @binding(6) var normalTexture:texture_2d<f32>;
 @group(2) @binding(7) var occlusionSampler:sampler;
 @group(2) @binding(8) var occlusionTexture:texture_2d<f32>;
 @group(2) @binding(9) var emissiveSampler:sampler;
 @group(2) @binding(10) var emissiveTexture:texture_2d<f32>;
 const PI:f32=3.14159265359;
fn distributionGGX(nDotH:f32,roughness:f32)->f32{let a=roughness*roughness;let a2=a*a;let d=nDotH*nDotH*(a2-1.0)+1.0;return a2/max(PI*d*d,0.000001);}
fn geometrySchlickGGX(nDotV:f32,roughness:f32)->f32{let r=roughness+1.0;let k=(r*r)/8.0;return nDotV/max(nDotV*(1.0-k)+k,0.000001);}
fn geometrySmith(nDotV:f32,nDotL:f32,roughness:f32)->f32{return geometrySchlickGGX(nDotV,roughness)*geometrySchlickGGX(nDotL,roughness);}
fn fresnelSchlick(cosTheta:f32,f0:vec3<f32>)->vec3<f32>{return f0+(vec3<f32>(1.0)-f0)*pow(clamp(1.0-cosTheta,0.0,1.0),5.0);}
 fn shadowVisibility(worldPosition:vec3<f32>)->f32{
   if(shadowCamera.params.x<0.5){return 1.0;}
   let clip=shadowCamera.lightViewProjection*vec4<f32>(worldPosition,1.0);if(clip.w<=0.0){return 1.0;}
   let uv=vec2<f32>(clip.x/clip.w*0.5+0.5,1.0-(clip.y/clip.w*0.5+0.5));if(any(uv<vec2<f32>(0.0))||any(uv>vec2<f32>(1.0))){return 1.0;}
   let depth=clip.z/clip.w*0.5+0.5;return mix(0.2,1.0,textureSampleCompare(shadowMap,shadowSampler,uv,depth-shadowCamera.params.y));
 }
 @fragment fn fs_main(@location(0) worldPosition:vec3<f32>,@location(1) normal:vec3<f32>,@location(2) uv:vec2<f32>)->@location(0) vec4<f32>{
   let n0=normalize(normal);let tangent=normalize(cross(select(vec3<f32>(1.0,0.0,0.0),vec3<f32>(0.0,1.0,0.0),abs(n0.y)>0.9),n0));let bitangent=normalize(cross(n0,tangent));let normalSample=textureSample(normalTexture,normalSampler,uv);let n=normalize(tangent*((normalSample.x*2.0-1.0))+bitangent*((normalSample.y*2.0-1.0))+n0*(normalSample.z*2.0-1.0));
   let baseSample=textureSample(baseColorTexture,baseColorSampler,uv);let baseColor=material.baseColor*baseSample;let metallicRoughness=textureSample(metallicRoughnessTexture,metallicRoughnessSampler,uv);let metallic=clamp(material.params.x*metallicRoughness.b,0.0,1.0);let roughness=max(material.params.y*metallicRoughness.g,0.04);let emissiveSample=textureSample(emissiveTexture,emissiveSampler,uv);let aoSample=textureSample(occlusionTexture,occlusionSampler,uv);
   let l=normalize(-camera.sunDirection.xyz);let v=normalize(camera.cameraPosition.xyz-worldPosition);let h=normalize(l+v);let emissiveStrength=material.params.z;let opacity=material.params.w*baseColor.a;
   let ao=mix(1.0,aoSample.r,material.advanced.x);let clearcoat=material.advanced.y;let clearcoatRoughness=max(material.advanced.z,0.04);let ior=max(material.advanced.w,1.0);
   let nDotL=max(dot(n,l),0.0);let nDotV=max(dot(n,v),0.0001);let nDotH=max(dot(n,h),0.0);let vDotH=max(dot(v,h),0.0);
   let dielectric=pow((ior-1.0)/(ior+1.0),2.0);let f0=mix(vec3<f32>(dielectric),baseColor.rgb,vec3<f32>(metallic));
   let f=fresnelSchlick(vDotH,f0);let d=distributionGGX(nDotH,roughness);let g=geometrySmith(nDotV,nDotL,roughness);
   let specular=f*(d*g/max(4.0*nDotV*nDotL,0.0001));let kd=(vec3<f32>(1.0)-f)*(1.0-metallic);let diffuse=kd*baseColor.rgb/PI;
   let coatF=fresnelSchlick(vDotH,vec3<f32>(0.04));let coatD=distributionGGX(nDotH,clearcoatRoughness);let coatG=geometrySmith(nDotV,nDotL,clearcoatRoughness);let coat=coatF*(coatD*coatG/max(4.0*nDotV*nDotL,0.0001))*clearcoat;
   let direct=(diffuse+specular+coat)*camera.sunColor.rgb*camera.sunColor.a*nDotL*shadowVisibility(worldPosition);
   let ambient=baseColor.rgb*camera.ambient.rgb*camera.ambient.a*ao;
   return vec4<f32>(ambient+direct+material.emissive.rgb*emissiveSample.rgb*emissiveStrength,opacity);
 }`;
export const VSR_SPATIAL_SHADOW_WGSL_V04=`struct ShadowCamera { lightViewProjection:mat4x4<f32> }; @group(0) @binding(0) var<uniform> shadowCamera:ShadowCamera; struct Object { world:mat4x4<f32> }; @group(1) @binding(0) var<uniform> object:Object; @group(1) @binding(1) var<storage,read> jointMatrices:array<mat4x4<f32>>; struct Deformation { skinEnabled:f32, vertexCount:f32, morphCount:f32, _pad:f32, morphWeights:vec4<f32> }; @group(1) @binding(2) var<uniform> deformation:Deformation; @group(1) @binding(3) var<storage,read> morphDeltas:array<vec4<f32>>; struct ShadowIn { @location(0) position:vec3<f32>, @location(3) joints:vec4<f32>, @location(4) weights:vec4<f32>, @builtin(vertex_index) vertexIndex:u32 }; fn morphPosition(position:vec3<f32>,vertexIndex:u32)->vec3<f32>{var result=position;let vertexCount=u32(deformation.vertexCount);for(var morph:u32=0u;morph<4u;morph=morph+1u){if(morph<u32(deformation.morphCount)){result=result+morphDeltas[morph*vertexCount+vertexIndex].xyz*deformation.morphWeights[morph];}}return result;} fn skinPosition(position:vec3<f32>,joints:vec4<f32>,weights:vec4<f32>)->vec3<f32>{if(deformation.skinEnabled<0.5){return position;}let total=weights.x+weights.y+weights.z+weights.w;if(total<=0.0001){return position;}return(jointMatrices[u32(joints.x)]*vec4<f32>(position,1.0)*weights.x+jointMatrices[u32(joints.y)]*vec4<f32>(position,1.0)*weights.y+jointMatrices[u32(joints.z)]*vec4<f32>(position,1.0)*weights.z+jointMatrices[u32(joints.w)]*vec4<f32>(position,1.0)*weights.w).xyz/total;} @vertex fn vs_shadow(input:ShadowIn)->@builtin(position) vec4<f32>{let localPosition=skinPosition(morphPosition(input.position,input.vertexIndex),input.joints,input.weights);return shadowCamera.lightViewProjection*object.world*vec4<f32>(localPosition,1.0);}`;

export function compileSpatialFrame(scene:VSRSpatialScene3D,options:VSRSpatialCompileOptions={}):VSRSpatialFramePlan{
  validateScene(scene);const budget=resolveSpatialBudget(options),animationOverrides=options.animationGraph?sampleSpatialAnimationGraph(scene,options.animationGraph):options.animationLayers?sampleSpatialAnimationLayers(scene,options.animationLayers):options.animation?sampleSpatialAnimation(scene,options.animation.clipId,options.animation.timeSeconds,options.animation.loop??true):new Map<string,VSRSpatialTransform>(),animationRoot=cryptographicHash({selection:options.animation??null,layers:options.animationLayers??null,graph:options.animationGraph??null,overrides:[...animationOverrides.entries()]}),camera=scene.cameras.find(entry=>entry.id===scene.activeCameraId)!,aspect=budget.width/budget.height,near=Math.max(.001,camera.near??.1),far=Math.max(near+.01,camera.far??1000),view=cameraViewMatrix(camera),projection=camera.projection==='orthographic'?orthographicMat4(camera.orthoHeight??10,aspect,near,far):perspectiveMat4(camera.fovYDeg??60,aspect,near,far),viewProjection=multiplyMat4(projection,view),cameraPos=cameraPosition(camera),world=worldMatrices(scene,animationOverrides),meshById=new Map(scene.meshes.map(mesh=>[mesh.id,mesh])),materialById=new Map(scene.materials.map(material=>[material.id,sanitizeMaterial(material)])),skinById=new Map((scene.skins??[]).map(skin=>[skin.id,skin]));
  const drawPackets:VSRSpatialDrawPacket[]=[];let culled=0;const lodHistogram:Record<string,number>={};
  for(const node of scene.nodes){if(node.visible===false||(!node.meshId&&!node.lods?.length))continue;const matrix=world.get(node.id)!,baseMeshId=node.meshId??node.lods?.[0]?.meshId,baseMesh=baseMeshId?meshById.get(baseMeshId):undefined;if(!baseMesh){culled++;continue}const baseWorldBounds=transformBounds(meshBounds(baseMesh),matrix),distance=distance3(cameraPos,baseWorldBounds.center),selected=chooseLOD(node,distance,budget.lodBias),mesh=selected.meshId?meshById.get(selected.meshId):undefined;if(!mesh){culled++;continue}const bounds=transformBounds(meshBounds(mesh),matrix);if(!sphereInFrustum(bounds,viewProjection)){culled++;continue}const materialId=node.materialId??scene.materials[0]?.id??'material:default';if(!materialById.has(materialId))materialById.set(materialId,sanitizeMaterial({id:materialId}));lodHistogram[String(selected.level)]=(lodHistogram[String(selected.level)]??0)+1;const material=materialById.get(materialId)!,textureBindings={baseColor:material.baseColorTextureId,metallicRoughness:material.metallicRoughnessTextureId,normal:material.normalTextureId,occlusion:material.occlusionTextureId,emissive:material.emissiveTextureId},deformation=resolveSpatialDeformation(mesh,node,skinById,world);const packetBase={nodeId:node.id,meshId:mesh.id,materialId,worldMatrix:matrix,worldBounds:bounds,distanceToCamera:distance,lodLevel:selected.level,indexCount:mesh.indices.length,castShadow:node.castShadow??true,receiveShadow:node.receiveShadow??true,textureBindings,...deformation};drawPackets.push({...packetBase,packetRoot:cryptographicHash(packetBase)})}
  const lights=scene.lights.slice(0,budget.maxLights).map(light=>({...light,color:light.color??'#ffffff',intensity:Math.max(0,light.intensity??1),range:Math.max(.001,light.range??10)}));
  const shadowCasterCount=drawPackets.filter(packet=>packet.castShadow).length,passes:VSRSpatialRenderPass[]=[];if(budget.shadows&&lights.some(light=>light.kind==='directional'&&light.castShadow)&&shadowCasterCount)passes.push({id:'shadow-depth',kind:'shadow-depth',dependsOn:[],resourceIds:['shadow-depth']});passes.push({id:'scene-depth-color',kind:'scene-depth-color',dependsOn:passes.length?['shadow-depth']:[],resourceIds:['scene-color','scene-depth',...(passes.length?['shadow-depth']:[])]},{id:'tone-map',kind:'tone-map',dependsOn:['scene-depth-color'],resourceIds:['scene-color','present-color']});
  const resources:VSRSpatialGPUResource[]=[],activeSkinIds=new Set(drawPackets.map(packet=>packet.skinId).filter((id):id is string=>Boolean(id)));for(const mesh of scene.meshes){const vertexCount=mesh.positions.length/3;resources.push({id:`mesh:${mesh.id}:vertices`,kind:'vertex-buffer',byteLength:vertexCount*16*4,resourceRoot:cryptographicHash({positions:mesh.positions,normals:mesh.normals??calculateMeshNormals(mesh),uvs:mesh.uvs??[],jointIndices:mesh.jointIndices??[],jointWeights:mesh.jointWeights??[],morphTargets:mesh.morphTargets??[]})},{id:`mesh:${mesh.id}:indices`,kind:'index-buffer',byteLength:mesh.indices.length*4,resourceRoot:cryptographicHash(mesh.indices)});if(mesh.morphTargets?.length)resources.push({id:`mesh:${mesh.id}:morphs`,kind:'morph-buffer',byteLength:mesh.morphTargets.length*vertexCount*4*4,resourceRoot:cryptographicHash(mesh.morphTargets)})}for(const skin of scene.skins??[])if(activeSkinIds.has(skin.id))resources.push({id:`skin:${skin.id}:joints`,kind:'joint-buffer',byteLength:skin.joints.length*64,resourceRoot:cryptographicHash(skin)});for(const texture of scene.textures??[])resources.push({id:`texture:${texture.id}`,kind:'texture-2d',byteLength:texture.pixels.length,format:'rgba8unorm',resourceRoot:cryptographicHash(texture)});resources.push({id:'materials',kind:'material-buffer',byteLength:materialById.size*64,resourceRoot:cryptographicHash([...materialById.values()])},{id:'lights',kind:'light-buffer',byteLength:lights.length*64,resourceRoot:cryptographicHash(lights)},{id:'scene-depth',kind:'depth-texture',byteLength:budget.width*budget.height*4,format:'depth24plus',resourceRoot:cryptographicHash({width:budget.width,height:budget.height,format:'depth24plus'})},{id:'scene-color',kind:'color-texture',byteLength:budget.width*budget.height*8,format:'rgba16float',resourceRoot:cryptographicHash({width:budget.width,height:budget.height,format:'rgba16float'})},{id:'present-color',kind:'color-texture',byteLength:budget.width*budget.height*4,format:'bgra8unorm',resourceRoot:cryptographicHash({width:budget.width,height:budget.height,format:'bgra8unorm'})});if(passes.some(pass=>pass.id==='shadow-depth'))resources.push({id:'shadow-depth',kind:'shadow-texture',byteLength:budget.shadowMapSize**2*4,format:'depth32float',resourceRoot:cryptographicHash({size:budget.shadowMapSize,format:'depth32float'})});
  const sourceRealityRoot=cryptographicHash({format:scene.format,sceneId:scene.sceneId,reality:scene.reality??null}),geometryRoot=cryptographicHash(scene.meshes.map(mesh=>({id:mesh.id,positions:mesh.positions,normals:mesh.normals??null,uvs:mesh.uvs??null,indices:mesh.indices,jointIndices:mesh.jointIndices??null,jointWeights:mesh.jointWeights??null,morphTargets:mesh.morphTargets??null}))),materialRoot=cryptographicHash([...materialById.values()]),textureRoot=cryptographicHash(scene.textures??[]),commandRoot=cryptographicHash({drawPackets,passes,lights,budget,textureRoot,animationRoot}),shaders={vertex:VSR_SPATIAL_VERTEX_WGSL_V04,fragment:VSR_SPATIAL_FRAGMENT_WGSL_V04,shadowVertex:VSR_SPATIAL_SHADOW_WGSL_V04,sourceRoot:cryptographicHash([VSR_SPATIAL_VERTEX_WGSL_V04,VSR_SPATIAL_FRAGMENT_WGSL_V04,VSR_SPATIAL_SHADOW_WGSL_V04])};const stats:VSRSpatialFrameStats={meshCount:scene.meshes.length,nodeCount:scene.nodes.length,textureCount:(scene.textures??[]).length,materialTextureBindings:drawPackets.reduce((sum,packet)=>sum+Object.values(packet.textureBindings).filter(Boolean).length,0),animationClipCount:(scene.animations??[]).length,visibleDraws:drawPackets.length,culledDraws:culled,triangleCount:drawPackets.reduce((sum,packet)=>sum+packet.indexCount/3,0),lightCount:lights.length,shadowCasterCount,skinnedDraws:drawPackets.filter(packet=>Boolean(packet.skinId)).length,morphedDraws:drawPackets.filter(packet=>packet.morphWeights.some(weight=>Math.abs(weight)>EPS)).length,lodHistogram};const base={format:VSR_SPATIAL_FRAME_FORMAT,version:VSR_SPATIAL_REALITY_VERSION,sceneId:scene.sceneId,viewport:{width:budget.width,height:budget.height},budget,camera:{id:camera.id,viewMatrix:view,projectionMatrix:projection,viewProjectionMatrix:viewProjection,position:cameraPos},drawPackets,lights,passes,resources,shaders,stats,sourceRealityRoot,geometryRoot,materialRoot,textureRoot,animationRoot,commandRoot};return{...base,frameRoot:cryptographicHash(base)}
}

export function verifySpatialFrame(plan:VSRSpatialFramePlan):VSRSpatialFrameVerification{const diagnostics:string[]=[];if(plan.format!==VSR_SPATIAL_FRAME_FORMAT)diagnostics.push('frame format mismatch');const resourceIds=new Set(plan.resources.map(resource=>resource.id));for(const pass of plan.passes){for(const dep of pass.dependsOn)if(!plan.passes.some(candidate=>candidate.id===dep))diagnostics.push(`pass ${pass.id} missing dependency ${dep}`);for(const id of pass.resourceIds)if(!resourceIds.has(id))diagnostics.push(`pass ${pass.id} missing resource ${id}`)}for(const packet of plan.drawPackets){const {packetRoot,...base}=packet;if(cryptographicHash(base)!==packetRoot)diagnostics.push(`draw packet ${packet.nodeId} root mismatch`)}const commandRoot=cryptographicHash({drawPackets:plan.drawPackets,passes:plan.passes,lights:plan.lights,budget:plan.budget,textureRoot:plan.textureRoot,animationRoot:plan.animationRoot});if(commandRoot!==plan.commandRoot)diagnostics.push('command root mismatch');const {frameRoot,...base}=plan;if(cryptographicHash(base)!==frameRoot)diagnostics.push('frame root mismatch');return{ok:diagnostics.length===0,diagnostics}}

interface ScreenVertex {x:number;y:number;depth:number;world:Vec3;normal:Vec3;uv:Vec2;invW:number}
interface ShadowContext {size:number;depth:Float32Array;viewProjection:Mat4;bias:number}
function materialColor(color:string):Vec3{const parsed=parseColor(color);return[parsed[0]/255,parsed[1]/255,parsed[2]/255]}
const mix3=(a:Vec3,b:Vec3,t:number):Vec3=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const mul3=(a:Vec3,b:Vec3):Vec3=>[a[0]*b[0],a[1]*b[1],a[2]*b[2]];
export function distributionGGX(nDotH:number,roughness:number):number{const a=Math.max(.04,roughness)**2,a2=a*a,d=nDotH*nDotH*(a2-1)+1;return a2/Math.max(Math.PI*d*d,1e-9)}
export function geometrySchlickGGX(nDotV:number,roughness:number):number{const r=Math.max(.04,roughness)+1,k=r*r/8;return nDotV/Math.max(nDotV*(1-k)+k,1e-9)}
export function geometrySmith(nDotV:number,nDotL:number,roughness:number):number{return geometrySchlickGGX(nDotV,roughness)*geometrySchlickGGX(nDotL,roughness)}
export function fresnelSchlick(cosTheta:number,f0:Vec3):Vec3{const factor=Math.pow(clamp(1-cosTheta,0,1),5);return[f0[0]+(1-f0[0])*factor,f0[1]+(1-f0[1])*factor,f0[2]+(1-f0[2])*factor]}
export interface VSRPBRLightingInput{baseColor:Vec3;metallic:number;roughness:number;ior:number;clearcoat:number;clearcoatRoughness:number;normal:Vec3;view:Vec3;light:Vec3;radiance:Vec3}
export function evaluatePBRLighting(input:VSRPBRLightingInput):Vec3{const n=normalize3(input.normal),v=normalize3(input.view),l=normalize3(input.light),h=normalize3(add3(v,l)),nDotL=Math.max(0,dot3(n,l)),nDotV=Math.max(.0001,dot3(n,v)),nDotH=Math.max(0,dot3(n,h)),vDotH=Math.max(0,dot3(v,h)),metallic=clamp(input.metallic,0,1),roughness=clamp(input.roughness,.04,1),dielectric=Math.pow((clamp(input.ior,1,2.5)-1)/(clamp(input.ior,1,2.5)+1),2),f0=mix3([dielectric,dielectric,dielectric],input.baseColor,metallic),f=fresnelSchlick(vDotH,f0),d=distributionGGX(nDotH,roughness),g=geometrySmith(nDotV,nDotL,roughness),specular=scale3(f,d*g/Math.max(4*nDotV*nDotL,.0001)),kd=scale3([1-f[0],1-f[1],1-f[2]],1-metallic),diffuse=scale3(mul3(kd,input.baseColor),1/Math.PI),coatRoughness=clamp(input.clearcoatRoughness,.04,1),coatF=fresnelSchlick(vDotH,[.04,.04,.04]),coat=scale3(coatF,distributionGGX(nDotH,coatRoughness)*geometrySmith(nDotV,nDotL,coatRoughness)/Math.max(4*nDotV*nDotL,.0001)*clamp(input.clearcoat,0,1));return scale3(mul3(add3(add3(diffuse,specular),coat),input.radiance),nDotL)}
function linearToSrgb(value:number):number{return value<=.0031308?12.92*value:1.055*Math.pow(value,1/2.4)-.055}
function aces(value:number):number{const a=2.51,b=.03,c=2.43,d=.59,e=.14;return clamp((value*(a*value+b))/(value*(c*value+d)+e),0,1)}
function edge(a:ScreenVertex,b:ScreenVertex,x:number,y:number):number{return(x-a.x)*(b.y-a.y)-(y-a.y)*(b.x-a.x)}
function projectVertex(position:Vec3,normal:Vec3,uv:Vec2,world:Mat4,viewProjection:Mat4,width:number,height:number):ScreenVertex|null{const world4=transformVec4(world,[...position,1]),clip=transformVec4(viewProjection,world4);if(clip[3]<=EPS)return null;const invW=1/clip[3],ndcX=clip[0]*invW,ndcY=clip[1]*invW,ndcZ=clip[2]*invW;return{x:(ndcX*.5+.5)*(width-1),y:(1-(ndcY*.5+.5))*(height-1),depth:ndcZ*.5+.5,world:[world4[0],world4[1],world4[2]],normal:transformDirection3(world,normal),uv,invW}}
export interface VSRSpatialShadowCamera {size:number;viewProjection:Mat4;bias:number}
export function resolveSpatialShadowCamera(plan:VSRSpatialFramePlan):VSRSpatialShadowCamera|undefined{const light=plan.lights.find(entry=>entry.kind==='directional'&&entry.castShadow),packets=plan.drawPackets.filter(packet=>packet.castShadow);if(!plan.budget.shadows||!light||!packets.length)return undefined;let min:Vec3=[Infinity,Infinity,Infinity],max:Vec3=[-Infinity,-Infinity,-Infinity];for(const packet of packets){min=[Math.min(min[0],packet.worldBounds.min[0]),Math.min(min[1],packet.worldBounds.min[1]),Math.min(min[2],packet.worldBounds.min[2])];max=[Math.max(max[0],packet.worldBounds.max[0]),Math.max(max[1],packet.worldBounds.max[1]),Math.max(max[2],packet.worldBounds.max[2])]}const center:Vec3=[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2],radius=Math.max(1,distance3(min,max)/2),direction=normalize3(light.direction??[-.5,-1,-.35]),eye=sub3(center,scale3(direction,radius*2.5)),view=lookAtMat4(eye,center,[0,1,0]),projection=orthographicMat4(radius*2.4,1,.01,radius*6);return{size:plan.budget.shadowMapSize,viewProjection:multiplyMat4(projection,view),bias:.0025}}
function buildShadow(scene:VSRSpatialScene3D,plan:VSRSpatialFramePlan,meshById:Map<string,VSRSpatialMesh>):ShadowContext|undefined{const camera=resolveSpatialShadowCamera(plan);if(!camera)return undefined;const depth=new Float32Array(camera.size*camera.size);depth.fill(Infinity);for(const packet of plan.drawPackets.filter(entry=>entry.castShadow)){const mesh=deformSpatialMesh(meshById.get(packet.meshId)!,packet);for(let i=0;i<mesh.indices.length;i+=3){const vertices=[] as ScreenVertex[];for(const index of [mesh.indices[i]!,mesh.indices[i+1]!,mesh.indices[i+2]!]){const base=index*3,v=projectVertex([mesh.positions[base]!,mesh.positions[base+1]!,mesh.positions[base+2]!],[0,1,0],[0,0],packet.worldMatrix,camera.viewProjection,camera.size,camera.size);if(v)vertices.push(v)}if(vertices.length!==3)continue;const [a,b,c]=vertices as [ScreenVertex,ScreenVertex,ScreenVertex],area=edge(a,b,c.x,c.y);if(Math.abs(area)<EPS)continue;const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(camera.size-1,Math.ceil(Math.max(a.x,b.x,c.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(camera.size-1,Math.ceil(Math.max(a.y,b.y,c.y)));for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const px=x+.5,py=y+.5,w0=edge(b,c,px,py)/area,w1=edge(c,a,px,py)/area,w2=1-w0-w1;if(w0<0||w1<0||w2<0)continue;const z=w0*a.depth+w1*b.depth+w2*c.depth,idx=y*camera.size+x;if(z<depth[idx]!)depth[idx]=z}}}return{size:camera.size,depth,viewProjection:camera.viewProjection,bias:camera.bias}}
function shadowFactor(context:ShadowContext|undefined,world:Vec3):number{if(!context)return 1;const clip=transformVec4(context.viewProjection,[...world,1]);if(clip[3]<=0)return 1;const x=(clip[0]/clip[3]*.5+.5)*(context.size-1),y=(1-(clip[1]/clip[3]*.5+.5))*(context.size-1),z=clip[2]/clip[3]*.5+.5;if(x<0||y<0||x>=context.size||y>=context.size)return 1;let lit=0,samples=0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const sx=Math.max(0,Math.min(context.size-1,Math.round(x)+ox)),sy=Math.max(0,Math.min(context.size-1,Math.round(y)+oy)),stored=context.depth[sy*context.size+sx]!;lit+=z-context.bias<=stored?1:.2;samples++}return lit/samples}
function textureTexel(texture:VSRSpatialTexture,x:number,y:number,colorSpace:'srgb'|'linear'):Vec4{
  const ix=Math.max(0,Math.min(texture.width-1,x)),iy=Math.max(0,Math.min(texture.height-1,y)),index=(iy*texture.width+ix)*4,toLinear=(value:number):number=>colorSpace==='linear'?value:Math.pow(value,2.2);
  return[toLinear((texture.pixels[index]??255)/255),toLinear((texture.pixels[index+1]??255)/255),toLinear((texture.pixels[index+2]??255)/255),(texture.pixels[index+3]??255)/255]
}
export function sampleSpatialTexture(texture:VSRSpatialTexture,uv:Vec2,colorSpace:texturespace=texture.colorSpace??'srgb'):Vec4{
  const wrap=(value:number,mode:'repeat'|'clamp'):number=>mode==='repeat'?((value%1)+1)%1:clamp(value,0,1),u=wrap(uv[0],texture.wrapU??'repeat'),v=wrap(uv[1],texture.wrapV??'repeat'),fx=u*(texture.width-1),fy=(1-v)*(texture.height-1);
  if((texture.filter??'nearest')==='nearest')return textureTexel(texture,Math.round(fx),Math.round(fy),colorSpace);
  const x0=Math.floor(fx),y0=Math.floor(fy),x1=Math.min(texture.width-1,x0+1),y1=Math.min(texture.height-1,y0+1),tx=fx-x0,ty=fy-y0;
  const a=textureTexel(texture,x0,y0,colorSpace),b=textureTexel(texture,x1,y0,colorSpace),c=textureTexel(texture,x0,y1,colorSpace),d=textureTexel(texture,x1,y1,colorSpace),mix=(p:number,q:number,t:number)=>p+(q-p)*t;
  return[0,1,2,3].map(channel=>mix(mix(a[channel]!,b[channel]!,tx),mix(c[channel]!,d[channel]!,tx),ty)) as Vec4
}
type texturespace='srgb'|'linear';
interface SampledSpatialMaterial{baseColor:Vec3;metallic:number;roughness:number;emissive:Vec3;occlusion:number;normal:Vec3;opacity:number;discarded:boolean}
function triangleTangentFrame(a:ScreenVertex,b:ScreenVertex,c:ScreenVertex,normal:Vec3):{tangent:Vec3;bitangent:Vec3}{
  const edge1=sub3(b.world,a.world),edge2=sub3(c.world,a.world),du1=b.uv[0]-a.uv[0],dv1=b.uv[1]-a.uv[1],du2=c.uv[0]-a.uv[0],dv2=c.uv[1]-a.uv[1],det=du1*dv2-du2*dv1;
  if(Math.abs(det)<EPS){const axis=Math.abs(normal[1])<.95?[0,1,0] as Vec3:[1,0,0] as Vec3,tangent=normalize3(cross3(axis,normal));return{tangent,bitangent:normalize3(cross3(normal,tangent))}}
  const inv=1/det,tangent=normalize3(sub3(scale3(edge1,dv2*inv),scale3(edge2,dv1*inv))),bitangent=normalize3(sub3(scale3(edge2,du1*inv),scale3(edge1,du2*inv)));
  return{tangent,bitangent}
}
function sampleSpatialMaterial(material:VSRSpatialMaterial,textures:Map<string,VSRSpatialTexture>,uv:Vec2,geometricNormal:Vec3,tangent:Vec3,bitangent:Vec3):SampledSpatialMaterial{
  const m=sanitizeMaterial(material),baseFactor=materialColor(m.baseColor),baseTexture=m.baseColorTextureId?textures.get(m.baseColorTextureId):undefined,baseSample=baseTexture?sampleSpatialTexture(baseTexture,uv,'srgb'):[1,1,1,1] as Vec4;
  let metallic=m.metallic,roughness=m.roughness;if(m.metallicRoughnessTextureId){const texture=textures.get(m.metallicRoughnessTextureId);if(texture){const sample=sampleSpatialTexture(texture,uv,'linear');roughness=clamp(roughness*sample[1],.04,1);metallic=clamp(metallic*sample[2],0,1)}}
  let occlusion=1;if(m.occlusionTextureId){const texture=textures.get(m.occlusionTextureId);if(texture){const sample=sampleSpatialTexture(texture,uv,'linear');occlusion=1-m.occlusionStrength*(1-sample[0])}}
  const emissiveFactor=materialColor(m.emissive),emissiveTexture=m.emissiveTextureId?textures.get(m.emissiveTextureId):undefined,emissiveSample=emissiveTexture?sampleSpatialTexture(emissiveTexture,uv,'srgb'):[1,1,1,1] as Vec4;
  let normal=normalize3(geometricNormal);if(m.normalTextureId){const texture=textures.get(m.normalTextureId);if(texture){const sample=sampleSpatialTexture(texture,uv,'linear'),local=normalize3([(sample[0]*2-1)*m.normalScale,(sample[1]*2-1)*m.normalScale,sample[2]*2-1]);normal=normalize3(add3(add3(scale3(tangent,local[0]),scale3(bitangent,local[1])),scale3(normal,local[2])))}}
  const opacity=clamp(m.opacity*baseSample[3],0,1),discarded=m.alphaMode==='MASK'&&opacity<m.alphaCutoff;
  return{baseColor:mul3(baseFactor,[baseSample[0],baseSample[1],baseSample[2]]),metallic,roughness,emissive:scale3(mul3(emissiveFactor,[emissiveSample[0],emissiveSample[1],emissiveSample[2]]),m.emissiveStrength),occlusion,normal,opacity:m.alphaMode==='MASK'?1:opacity,discarded}
}
function shade(material:VSRSpatialMaterial,sample:SampledSpatialMaterial,world:Vec3,camera:Vec3,lights:VSRSpatialLight[],shadow:ShadowContext|undefined,receiveShadow:boolean):Vec3{
  const m=sanitizeMaterial(material),v=normalize3(sub3(camera,world));let color:Vec3=[sample.emissive[0],sample.emissive[1],sample.emissive[2]];
  for(const light of lights){const lc=materialColor(light.color??'#ffffff'),intensity=Math.max(0,light.intensity??1);if(light.kind==='ambient'){color=add3(color,scale3(mul3(sample.baseColor,lc),intensity*sample.occlusion));continue}let l:Vec3,attenuation=1;if(light.kind==='directional')l=normalize3(scale3(light.direction??[-.4,-1,-.3],-1));else{const delta=sub3(light.position??[0,2,0],world),distance=Math.max(.001,length3(delta));l=scale3(delta,1/distance);const range=Math.max(.001,light.range??10);attenuation=Math.pow(clamp(1-distance/range,0,1),2)}const visibility=receiveShadow&&light.kind==='directional'&&light.castShadow?shadowFactor(shadow,world):1,direct=evaluatePBRLighting({baseColor:sample.baseColor,metallic:sample.metallic,roughness:sample.roughness,ior:m.ior,clearcoat:m.clearcoat,clearcoatRoughness:m.clearcoatRoughness,normal:sample.normal,view:v,light:l,radiance:scale3(lc,intensity*attenuation*visibility)});color=add3(color,direct)}return color
}

export function renderSpatialReference(scene:VSRSpatialScene3D,options:VSRSpatialCompileOptions={}):VSRSpatialReferenceRender{
  const plan=compileSpatialFrame(scene,options),verification=verifySpatialFrame(plan);if(!verification.ok)throw new Error(verification.diagnostics.join('; '));
  const width=plan.viewport.width,height=plan.viewport.height,color=new Float32Array(width*height*4),depth=new Float32Array(width*height);depth.fill(Infinity);const bg=parseColor(scene.background??'#0b1020');
  for(let i=0;i<width*height;i++){color[i*4]=bg[0]/255;color[i*4+1]=bg[1]/255;color[i*4+2]=bg[2]/255;color[i*4+3]=1}
  const meshById=new Map(scene.meshes.map(mesh=>[mesh.id,{...mesh,normals:mesh.normals??calculateMeshNormals(mesh)}])),materialById=new Map(scene.materials.map(material=>[material.id,material])),textureById=new Map((scene.textures??[]).map(texture=>[texture.id,texture])),shadow=buildShadow(scene,plan,new Map([...meshById.entries()].map(([id,mesh])=>[id,mesh])));
  for(const packet of [...plan.drawPackets].sort((a,b)=>a.distanceToCamera-b.distanceToCamera||a.nodeId.localeCompare(b.nodeId))){
    const mesh=deformSpatialMesh(meshById.get(packet.meshId)!,packet),material=materialById.get(packet.materialId)??{id:packet.materialId},sanitized=sanitizeMaterial(material);
    for(let i=0;i<mesh.indices.length;i+=3){
      const vertices=[] as ScreenVertex[];for(const index of [mesh.indices[i]!,mesh.indices[i+1]!,mesh.indices[i+2]!]){const p=index*3,n=index*3,v=projectVertex([mesh.positions[p]!,mesh.positions[p+1]!,mesh.positions[p+2]!],[mesh.normals![n]!,mesh.normals![n+1]!,mesh.normals![n+2]!],[mesh.uvs?.[index*2]??0,mesh.uvs?.[index*2+1]??0],packet.worldMatrix,plan.camera.viewProjectionMatrix,width,height);if(v)vertices.push(v)}
      if(vertices.length!==3)continue;const [a,b,c]=vertices as [ScreenVertex,ScreenVertex,ScreenVertex],area=edge(a,b,c.x,c.y);if(Math.abs(area)<EPS)continue;if(area<0&&!sanitized.doubleSided)continue;
      const faceNormal=normalize3(cross3(sub3(b.world,a.world),sub3(c.world,a.world))),basis=triangleTangentFrame(a,b,c,faceNormal),minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(width-1,Math.ceil(Math.max(a.x,b.x,c.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(height-1,Math.ceil(Math.max(a.y,b.y,c.y)));
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
        const px=x+.5,py=y+.5,w0=edge(b,c,px,py)/area,w1=edge(c,a,px,py)/area,w2=1-w0-w1;if(w0<0||w1<0||w2<0)continue;const inv=w0*a.invW+w1*b.invW+w2*c.invW;if(inv<=0)continue;
        const p0=w0*a.invW/inv,p1=w1*b.invW/inv,p2=w2*c.invW/inv,z=p0*a.depth+p1*b.depth+p2*c.depth,index=y*width+x;if(z<0||z>1||z>=depth[index]!)continue;
        const world:Vec3=[p0*a.world[0]+p1*b.world[0]+p2*c.world[0],p0*a.world[1]+p1*b.world[1]+p2*c.world[1],p0*a.world[2]+p1*b.world[2]+p2*c.world[2]],normal=normalize3([p0*a.normal[0]+p1*b.normal[0]+p2*c.normal[0],p0*a.normal[1]+p1*b.normal[1]+p2*c.normal[1],p0*a.normal[2]+p1*b.normal[2]+p2*c.normal[2]]),uv:Vec2=[p0*a.uv[0]+p1*b.uv[0]+p2*c.uv[0],p0*a.uv[1]+p1*b.uv[1]+p2*c.uv[1]],sample=sampleSpatialMaterial(material,textureById,uv,normal,basis.tangent,basis.bitangent);if(sample.discarded)continue;
        depth[index]=z;const rgb=shade(material,sample,world,plan.camera.position,plan.lights,shadow,packet.receiveShadow),opacity=sample.opacity;color[index*4]=rgb[0]*opacity+color[index*4]!*(1-opacity);color[index*4+1]=rgb[1]*opacity+color[index*4+1]!*(1-opacity);color[index*4+2]=rgb[2]*opacity+color[index*4+2]!*(1-opacity);color[index*4+3]=1
      }
    }
  }
  const surface=new PixelSurface(width,height);let minDepth=Infinity,maxDepth=-Infinity;for(let i=0;i<width*height;i++){const d=depth[i]!;if(Number.isFinite(d)){minDepth=Math.min(minDepth,d);maxDepth=Math.max(maxDepth,d)}surface.data[i*4]=Math.round(clamp(linearToSrgb(aces(color[i*4]!)),0,1)*255);surface.data[i*4+1]=Math.round(clamp(linearToSrgb(aces(color[i*4+1]!)),0,1)*255);surface.data[i*4+2]=Math.round(clamp(linearToSrgb(aces(color[i*4+2]!)),0,1)*255);surface.data[i*4+3]=255}
  const png=encodePng(surface,{compressionLevel:6});return{png,pixelRoot:cryptographicHash([...surface.data]),framePlan:plan,depthRange:{min:Number.isFinite(minDepth)?minDepth:1,max:Number.isFinite(maxDepth)?maxDepth:1}}
}

export interface VSRSpatialWebGPUCapabilities {format:'vsr.spatial-webgpu-capabilities.v0.4';available:boolean;secureContext:boolean;reason?:string}
export interface VSRSpatialWebGPUReceipt {format:'vsr.spatial-webgpu-receipt.v0.4';frameRoot:string;sceneId:string;adapterName:string;drawCalls:number;triangles:number;submitted:boolean;deviceLost:boolean;compileMs:number;uploadMs:number;encodeMs:number;submitMs:number;materialTextureBindings?:number;shadowPasses?:number;receiptRoot:string}
export interface VSRSpatialWebGPUOptions {powerPreference?:'low-power'|'high-performance';alphaMode?:'opaque'|'premultiplied'}

function transposeMat4(matrix:Mat4):Float32Array{return new Float32Array([matrix[0],matrix[4],matrix[8],matrix[12],matrix[1],matrix[5],matrix[9],matrix[13],matrix[2],matrix[6],matrix[10],matrix[14],matrix[3],matrix[7],matrix[11],matrix[15]])}
export function packSpatialVertexBuffer(mesh:VSRSpatialMesh):Float32Array{validateMesh(mesh);const normals=mesh.normals??calculateMeshNormals(mesh),uvs=mesh.uvs??new Array<number>(mesh.positions.length/3*2).fill(0),vertices=mesh.positions.length/3,joints=mesh.jointIndices??new Array<number>(vertices*4).fill(0),weights=mesh.jointWeights??Array.from({length:vertices*4},(_,index)=>index%4===0?1:0),out=new Float32Array(vertices*16);for(let index=0;index<vertices;index++){const base=index*16;out[base]=mesh.positions[index*3]!;out[base+1]=mesh.positions[index*3+1]!;out[base+2]=mesh.positions[index*3+2]!;out[base+3]=normals[index*3]!;out[base+4]=normals[index*3+1]!;out[base+5]=normals[index*3+2]!;out[base+6]=uvs[index*2]??0;out[base+7]=uvs[index*2+1]??0;out[base+8]=joints[index*4]??0;out[base+9]=joints[index*4+1]??0;out[base+10]=joints[index*4+2]??0;out[base+11]=joints[index*4+3]??0;out[base+12]=weights[index*4]??1;out[base+13]=weights[index*4+1]??0;out[base+14]=weights[index*4+2]??0;out[base+15]=weights[index*4+3]??0}return out}
export function packSpatialIndexBuffer(mesh:VSRSpatialMesh):Uint32Array{validateMesh(mesh);return new Uint32Array(mesh.indices)}
export function packSpatialObjectUniform(packet:VSRSpatialDrawPacket):Float32Array{return transposeMat4(packet.worldMatrix)}
export function packSpatialJointBuffer(packet:VSRSpatialDrawPacket):Float32Array{const joints=packet.jointMatrices.length?packet.jointMatrices:[identityMat4()],out=new Float32Array(joints.length*16);for(let index=0;index<joints.length;index++)out.set(transposeMat4(joints[index]!),index*16);return out}
export function packSpatialMorphBuffer(mesh:VSRSpatialMesh):Float32Array{const targets=mesh.morphTargets??[],vertices=mesh.positions.length/3,out=new Float32Array(Math.max(4,targets.length*vertices*4));for(let targetIndex=0;targetIndex<targets.length;targetIndex++){const target=targets[targetIndex]!;for(let vertex=0;vertex<vertices;vertex++){const source=vertex*3,destination=(targetIndex*vertices+vertex)*4;out[destination]=target.positions[source]??0;out[destination+1]=target.positions[source+1]??0;out[destination+2]=target.positions[source+2]??0;out[destination+3]=0}}return out}
export function packSpatialDeformationUniform(packet:VSRSpatialDrawPacket,vertexCount:number,morphCount:number):Float32Array{return new Float32Array([packet.skinId?1:0,vertexCount,morphCount,0,...packet.morphWeights.slice(0,4),...new Array<number>(Math.max(0,4-packet.morphWeights.length)).fill(0)])}
export function packSpatialMaterialUniform(material:VSRSpatialMaterial):Float32Array{const m=sanitizeMaterial(material),base=parseColor(m.baseColor),emissive=parseColor(m.emissive);return new Float32Array([base[0]/255,base[1]/255,base[2]/255,base[3]/255,m.metallic,m.roughness,m.emissiveStrength,m.opacity,emissive[0]/255,emissive[1]/255,emissive[2]/255,emissive[3]/255,m.occlusionStrength,m.clearcoat,m.clearcoatRoughness,m.ior])}
export function packSpatialShadowUniform(camera:VSRSpatialShadowCamera|undefined):Float32Array{const matrix=transposeMat4(camera?.viewProjection??identityMat4());return new Float32Array([...matrix,camera?1:0,camera?.bias??0,camera?1/camera.size:0,0])}
export function packSpatialCameraUniform(plan:VSRSpatialFramePlan):Float32Array{const ambient=plan.lights.find(light=>light.kind==='ambient'),sun=plan.lights.find(light=>light.kind==='directional'),ambientColor=materialColor(ambient?.color??'#ffffff'),sunColor=materialColor(sun?.color??'#ffffff'),sunDirection=normalize3(sun?.direction??[-.4,-1,-.3]),matrix=transposeMat4(plan.camera.viewProjectionMatrix),out=new Float32Array(32);out.set(matrix,0);out.set([...plan.camera.position,1],16);out.set([...ambientColor,ambient?.intensity??.12],20);out.set([...sunDirection,0],24);out.set([...sunColor,sun?.intensity??1],28);return out}
export function probeSpatialWebGPU():VSRSpatialWebGPUCapabilities{const secure=typeof window==='undefined'||window.isSecureContext,nav=(typeof navigator==='undefined'?{}:navigator) as Navigator&{gpu?:unknown};return nav.gpu?{format:'vsr.spatial-webgpu-capabilities.v0.4',available:true,secureContext:secure}:{format:'vsr.spatial-webgpu-capabilities.v0.4',available:false,secureContext:secure,reason:'navigator.gpu unavailable'}}

const GPU_BUFFER_USAGE={COPY_DST:0x08,INDEX:0x10,VERTEX:0x20,UNIFORM:0x40,STORAGE:0x80};
const GPU_TEXTURE_USAGE={COPY_DST:0x02,TEXTURE_BINDING:0x04,RENDER_ATTACHMENT:0x10};
const now=():number=>typeof performance!=='undefined'?performance.now():Date.now();

export class VSRSpatialWebGPUExecutor{
  readonly canvas:HTMLCanvasElement;readonly adapter:any;readonly device:any;readonly context:any;readonly format:string;
  private pipeline:any;private shadowPipeline:any;private depthTexture:any;private shadowTexture:any;private depthSize='';private shadowSize=0;private shadowSampler:any;private shadowUniformBuffer:any;private lost=false;private adapterName='unknown';private meshBuffers=new Map<string,{vertex:any;index:any;indexCount:number;root:string}>();private materialBuffers=new Map<string,{buffer:any;root:string}>();private objectBuffers=new Map<string,any>();private deformationBuffers=new Map<string,{joint:any;morph:any;uniform:any;root:string}>();private textures=new Map<string,{texture:any;root:string}>();private samplers=new Map<string,any>();private cameraBuffer:any;
  private constructor(canvas:HTMLCanvasElement,adapter:any,device:any,context:any,format:string){this.canvas=canvas;this.adapter=adapter;this.device=device;this.context=context;this.format=format;this.adapterName=String(adapter?.info?.description??adapter?.name??'unknown');void device.lost?.then?.(()=>{this.lost=true})}
  static fromDevice(canvas:HTMLCanvasElement,adapter:any,device:any,context:any,format:string):VSRSpatialWebGPUExecutor{return new VSRSpatialWebGPUExecutor(canvas,adapter,device,context,format)}
  static async create(canvas:HTMLCanvasElement,options:VSRSpatialWebGPUOptions={}):Promise<VSRSpatialWebGPUExecutor>{const nav=navigator as Navigator&{gpu?:{requestAdapter:(options?:Record<string,unknown>)=>Promise<any>;getPreferredCanvasFormat:()=>string}};if(!nav.gpu)throw new Error('WebGPU unavailable: navigator.gpu is missing.');const adapter=await nav.gpu.requestAdapter({powerPreference:options.powerPreference??'high-performance'});if(!adapter)throw new Error('WebGPU adapter unavailable.');const device=await adapter.requestDevice(),context=canvas.getContext('webgpu') as any;if(!context)throw new Error('Unable to acquire webgpu canvas context.');const format=nav.gpu.getPreferredCanvasFormat();context.configure({device,format,alphaMode:options.alphaMode??'opaque'});return new VSRSpatialWebGPUExecutor(canvas,adapter,device,context,format)}
  isLost():boolean{return this.lost}
  private ensurePipeline():any{if(this.pipeline)return this.pipeline;const module=this.device.createShaderModule({code:`${VSR_SPATIAL_VERTEX_WGSL_V04}\n${VSR_SPATIAL_FRAGMENT_WGSL_V04}`});this.pipeline=this.device.createRenderPipeline({layout:'auto',vertex:{module,entryPoint:'vs_main',buffers:[{arrayStride:64,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x3'},{shaderLocation:2,offset:24,format:'float32x2'},{shaderLocation:3,offset:32,format:'float32x4'},{shaderLocation:4,offset:48,format:'float32x4'}]}]},fragment:{module,entryPoint:'fs_main',targets:[{format:this.format}]},primitive:{topology:'triangle-list',frontFace:'ccw',cullMode:'back'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'}});return this.pipeline}
  private ensureShadowPipeline():any{if(this.shadowPipeline)return this.shadowPipeline;const module=this.device.createShaderModule({code:VSR_SPATIAL_SHADOW_WGSL_V04});this.shadowPipeline=this.device.createRenderPipeline({layout:'auto',vertex:{module,entryPoint:'vs_shadow',buffers:[{arrayStride:64,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:3,offset:32,format:'float32x4'},{shaderLocation:4,offset:48,format:'float32x4'}]}]},primitive:{topology:'triangle-list',frontFace:'ccw',cullMode:'back'},depthStencil:{format:'depth32float',depthWriteEnabled:true,depthCompare:'less'}});return this.shadowPipeline}
  private uploadBuffer(data:ArrayBufferView,usage:number):any{const size=Math.max(4,Math.ceil(data.byteLength/4)*4),buffer=this.device.createBuffer({size,usage:usage|GPU_BUFFER_USAGE.COPY_DST});if(data.byteLength)this.device.queue.writeBuffer(buffer,0,data.buffer,data.byteOffset,data.byteLength);return buffer}
  private mesh(scene:VSRSpatialScene3D,meshId:string):{vertex:any;index:any;indexCount:number;root:string}{const source=scene.meshes.find(mesh=>mesh.id===meshId);if(!source)throw new Error(`Missing mesh ${meshId}`);const root=cryptographicHash(source),cached=this.meshBuffers.get(meshId);if(cached?.root===root)return cached;cached?.vertex.destroy?.();cached?.index.destroy?.();const value={vertex:this.uploadBuffer(packSpatialVertexBuffer(source),GPU_BUFFER_USAGE.VERTEX),index:this.uploadBuffer(packSpatialIndexBuffer(source),GPU_BUFFER_USAGE.INDEX),indexCount:source.indices.length,root};this.meshBuffers.set(meshId,value);return value}
  private material(scene:VSRSpatialScene3D,materialId:string):any{const source=scene.materials.find(material=>material.id===materialId)??{id:materialId},root=cryptographicHash(source),cached=this.materialBuffers.get(materialId);if(cached?.root===root)return cached.buffer;cached?.buffer.destroy?.();const buffer=this.uploadBuffer(packSpatialMaterialUniform(source),GPU_BUFFER_USAGE.UNIFORM);this.materialBuffers.set(materialId,{buffer,root});return buffer}
  private ensureFrameBuffers(plan:VSRSpatialFramePlan):void{const cameraBytes=packSpatialCameraUniform(plan);if(!this.cameraBuffer)this.cameraBuffer=this.uploadBuffer(cameraBytes,GPU_BUFFER_USAGE.UNIFORM);else this.device.queue.writeBuffer(this.cameraBuffer,0,cameraBytes.buffer,cameraBytes.byteOffset,cameraBytes.byteLength);const size=`${plan.viewport.width}x${plan.viewport.height}`;if(size!==this.depthSize){this.depthTexture?.destroy?.();this.depthTexture=this.device.createTexture({size:[plan.viewport.width,plan.viewport.height,1],format:'depth24plus',usage:GPU_TEXTURE_USAGE.RENDER_ATTACHMENT|GPU_TEXTURE_USAGE.TEXTURE_BINDING});this.depthSize=size}const shadowCamera=resolveSpatialShadowCamera(plan),shadowSize=shadowCamera?.size??Math.max(1,plan.budget.shadowMapSize);if(shadowSize!==this.shadowSize){this.shadowTexture?.destroy?.();this.shadowTexture=this.device.createTexture({size:[shadowSize,shadowSize,1],format:'depth32float',usage:GPU_TEXTURE_USAGE.RENDER_ATTACHMENT|GPU_TEXTURE_USAGE.TEXTURE_BINDING});this.shadowSize=shadowSize}const shadowBytes=packSpatialShadowUniform(shadowCamera);if(!this.shadowUniformBuffer)this.shadowUniformBuffer=this.uploadBuffer(shadowBytes,GPU_BUFFER_USAGE.UNIFORM);else this.device.queue.writeBuffer(this.shadowUniformBuffer,0,shadowBytes.buffer,shadowBytes.byteOffset,shadowBytes.byteLength);if(!this.shadowSampler)this.shadowSampler=this.device.createSampler({compare:'less',magFilter:'linear',minFilter:'linear',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'})}
  private textureResource(scene:VSRSpatialScene3D,textureId:string|undefined,fallback:'base'|'metallic-roughness'|'normal'|'occlusion'|'emissive'):{view:any;sampler:any}{const source=textureId?scene.textures?.find(texture=>texture.id===textureId):undefined,key=source?`texture:${source.id}:${fallback}`:`fallback:${fallback}`,width=source?.width??1,height=source?.height??1,root=cryptographicHash(source??{fallback}),cached=this.textures.get(key);let texture=cached?.texture;if(!cached||cached.root!==root){cached?.texture.destroy?.();texture=this.device.createTexture({size:[width,height,1],format:(fallback==='base'||fallback==='emissive')?'rgba8unorm-srgb':'rgba8unorm',usage:GPU_TEXTURE_USAGE.COPY_DST|GPU_TEXTURE_USAGE.TEXTURE_BINDING});const pixels=source?source.pixels:fallback==='normal'?[128,128,255,255]:fallback==='metallic-roughness'?[255,255,0,255]:[255,255,255,255],bytesPerRow=Math.max(256,Math.ceil(width*4/256)*256),data=new Uint8Array(bytesPerRow*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const sourceIndex=(y*width+x)*4,dataIndex=y*bytesPerRow+x*4;data[dataIndex]=pixels[sourceIndex]??255;data[dataIndex+1]=pixels[sourceIndex+1]??255;data[dataIndex+2]=pixels[sourceIndex+2]??255;data[dataIndex+3]=pixels[sourceIndex+3]??255}this.device.queue.writeTexture({texture},data,{bytesPerRow,rowsPerImage:height},[width,height,1]);this.textures.set(key,{texture,root})}const filter=source?.filter??'nearest',samplerKey=source?`${source.id}:${filter}:${source.wrapU??'repeat'}:${source.wrapV??'repeat'}`:`fallback:${fallback}`;let sampler=this.samplers.get(samplerKey);if(!sampler){sampler=this.device.createSampler({magFilter:filter==='nearest'?'nearest':'linear',minFilter:filter==='nearest'?'nearest':'linear',addressModeU:source?.wrapU==='clamp'?'clamp-to-edge':'repeat',addressModeV:source?.wrapV==='clamp'?'clamp-to-edge':'repeat'});this.samplers.set(samplerKey,sampler)}return{view:texture!.createView(),sampler}}
  private objectBuffer(packet:VSRSpatialDrawPacket):any{const data=packSpatialObjectUniform(packet);let buffer=this.objectBuffers.get(packet.nodeId);if(!buffer){buffer=this.uploadBuffer(data,GPU_BUFFER_USAGE.UNIFORM);this.objectBuffers.set(packet.nodeId,buffer)}else this.device.queue.writeBuffer(buffer,0,data.buffer,data.byteOffset,data.byteLength);return buffer}
  private deformation(scene:VSRSpatialScene3D,packet:VSRSpatialDrawPacket):{joint:any;morph:any;uniform:any}{const mesh=scene.meshes.find(entry=>entry.id===packet.meshId);if(!mesh)throw new Error(`Missing mesh ${packet.meshId}`);const root=cryptographicHash({deformation:packet.deformationRoot,morphTargets:mesh.morphTargets??[]}),cached=this.deformationBuffers.get(packet.nodeId);if(cached?.root===root)return cached;cached?.joint.destroy?.();cached?.morph.destroy?.();cached?.uniform.destroy?.();const joint=this.uploadBuffer(packSpatialJointBuffer(packet),GPU_BUFFER_USAGE.STORAGE),morph=this.uploadBuffer(packSpatialMorphBuffer(mesh),GPU_BUFFER_USAGE.STORAGE),uniform=this.uploadBuffer(packSpatialDeformationUniform(packet,mesh.positions.length/3,mesh.morphTargets?.length??0),GPU_BUFFER_USAGE.UNIFORM),value={joint,morph,uniform,root};this.deformationBuffers.set(packet.nodeId,value);return value}
  private objectGroup(pipeline:any,buffer:any,deformation:{joint:any;morph:any;uniform:any}):any{return this.device.createBindGroup({layout:pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:{buffer}},{binding:1,resource:{buffer:deformation.joint}},{binding:2,resource:{buffer:deformation.uniform}},{binding:3,resource:{buffer:deformation.morph}}]})}
  private materialGroup(pipeline:any,scene:VSRSpatialScene3D,packet:VSRSpatialDrawPacket):any{const material=scene.materials.find(entry=>entry.id===packet.materialId),base=this.textureResource(scene,material?.baseColorTextureId,'base'),metallicRoughness=this.textureResource(scene,material?.metallicRoughnessTextureId,'metallic-roughness'),normal=this.textureResource(scene,material?.normalTextureId,'normal'),occlusion=this.textureResource(scene,material?.occlusionTextureId,'occlusion'),emissive=this.textureResource(scene,material?.emissiveTextureId,'emissive');return this.device.createBindGroup({layout:pipeline.getBindGroupLayout(2),entries:[{binding:0,resource:{buffer:this.material(scene,packet.materialId)}},{binding:1,resource:base.sampler},{binding:2,resource:base.view},{binding:3,resource:metallicRoughness.sampler},{binding:4,resource:metallicRoughness.view},{binding:5,resource:normal.sampler},{binding:6,resource:normal.view},{binding:7,resource:occlusion.sampler},{binding:8,resource:occlusion.view},{binding:9,resource:emissive.sampler},{binding:10,resource:emissive.view}]})}
  async render(scene:VSRSpatialScene3D,options:VSRSpatialCompileOptions={}):Promise<VSRSpatialWebGPUReceipt>{const compileStart=now(),plan=compileSpatialFrame(scene,options),verification=verifySpatialFrame(plan);if(!verification.ok)throw new Error(verification.diagnostics.join('; '));const compileMs=now()-compileStart;if(this.lost)throw new Error('WebGPU device is lost.');this.canvas.width=plan.viewport.width;this.canvas.height=plan.viewport.height;const pipeline=this.ensurePipeline(),shadowCamera=resolveSpatialShadowCamera(plan),uploadStart=now();this.ensureFrameBuffers(plan);const cameraGroup=this.device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.cameraBuffer}},{binding:1,resource:this.shadowSampler},{binding:2,resource:this.shadowTexture.createView()},{binding:3,resource:{buffer:this.shadowUniformBuffer}}]});const uploadMs=now()-uploadStart,encodeStart=now(),encoder=this.device.createCommandEncoder();if(shadowCamera){const shadowPipeline=this.ensureShadowPipeline(),shadowGroup=this.device.createBindGroup({layout:shadowPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.shadowUniformBuffer}}]}),shadowPass=encoder.beginRenderPass({colorAttachments:[],depthStencilAttachment:{view:this.shadowTexture.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});shadowPass.setPipeline(shadowPipeline);shadowPass.setBindGroup(0,shadowGroup);for(const packet of plan.drawPackets.filter(entry=>entry.castShadow)){const mesh=this.mesh(scene,packet.meshId),objectBuffer=this.objectBuffer(packet),deformation=this.deformation(scene,packet);shadowPass.setBindGroup(1,this.objectGroup(shadowPipeline,objectBuffer,deformation));shadowPass.setVertexBuffer(0,mesh.vertex);shadowPass.setIndexBuffer(mesh.index,'uint32');shadowPass.drawIndexed(mesh.indexCount,1,0,0,0)}shadowPass.end()}const pass=encoder.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.02,g:.035,b:.075,a:1},loadOp:'clear',storeOp:'store'}],depthStencilAttachment:{view:this.depthTexture.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});pass.setPipeline(pipeline);pass.setBindGroup(0,cameraGroup);for(const packet of plan.drawPackets){const mesh=this.mesh(scene,packet.meshId),objectBuffer=this.objectBuffer(packet),deformation=this.deformation(scene,packet);pass.setBindGroup(1,this.objectGroup(pipeline,objectBuffer,deformation));pass.setBindGroup(2,this.materialGroup(pipeline,scene,packet));pass.setVertexBuffer(0,mesh.vertex);pass.setIndexBuffer(mesh.index,'uint32');pass.drawIndexed(mesh.indexCount,1,0,0,0)}pass.end();const commands=encoder.finish(),encodeMs=now()-encodeStart,submitStart=now();this.device.queue.submit([commands]);await this.device.queue.onSubmittedWorkDone?.();const submitMs=now()-submitStart,base={format:'vsr.spatial-webgpu-receipt.v0.4' as const,frameRoot:plan.frameRoot,sceneId:scene.sceneId,adapterName:this.adapterName,drawCalls:plan.drawPackets.length,triangles:plan.stats.triangleCount,submitted:true,deviceLost:this.lost,compileMs,uploadMs,encodeMs,submitMs,materialTextureBindings:plan.stats.materialTextureBindings,shadowPasses:shadowCamera?1:0};return{...base,receiptRoot:cryptographicHash(base)}}
  destroy():void{for(const mesh of this.meshBuffers.values()){mesh.vertex.destroy?.();mesh.index.destroy?.()}for(const material of this.materialBuffers.values())material.buffer.destroy?.();for(const buffer of this.objectBuffers.values())buffer.destroy?.();for(const deformation of this.deformationBuffers.values()){deformation.joint.destroy?.();deformation.morph.destroy?.();deformation.uniform.destroy?.()}for(const entry of this.textures.values())entry.texture.destroy?.();this.cameraBuffer?.destroy?.();this.shadowUniformBuffer?.destroy?.();this.depthTexture?.destroy?.();this.shadowTexture?.destroy?.();this.meshBuffers.clear();this.materialBuffers.clear();this.objectBuffers.clear();this.deformationBuffers.clear();this.textures.clear();this.samplers.clear();this.pipeline=undefined;this.shadowPipeline=undefined}
}

export function verifySpatialWebGPUReceipt(receipt:VSRSpatialWebGPUReceipt):boolean{const {receiptRoot,...base}=receipt;return cryptographicHash(base)===receiptRoot}

export function createSpatialShowcaseScene():VSRSpatialScene3D{return{format:VSR_SPATIAL_SCENE_FORMAT,sceneId:'spatial-showcase',title:'VSR v0.4 三维空间现实',background:'#07101e',activeCameraId:'camera:main',meshes:[createCubeMesh('mesh:cube',1),createPlaneMesh('mesh:ground',9,9),createUVSphereMesh('mesh:sphere',.7,24,16),createCubeMesh('mesh:cube-low',1)],materials:[{id:'mat:blue-metal',baseColor:'#3b82f6',metallic:.72,roughness:.24},{id:'mat:red',baseColor:'#ef4444',metallic:.08,roughness:.45},{id:'mat:ground',baseColor:'#253449',metallic:.05,roughness:.85,doubleSided:true},{id:'mat:emissive',baseColor:'#5eead4',metallic:.2,roughness:.3,emissive:'#14b8a6',emissiveStrength:.25}],nodes:[{id:'ground',meshId:'mesh:ground',materialId:'mat:ground',receiveShadow:true,castShadow:false},{id:'cube-a',meshId:'mesh:cube',materialId:'mat:blue-metal',transform:{translation:[-1.5,.65,0],rotationEulerDeg:[0,28,0]},lods:[{maxDistance:8,meshId:'mesh:cube'},{maxDistance:100,meshId:'mesh:cube-low'}]},{id:'sphere-a',meshId:'mesh:sphere',materialId:'mat:red',transform:{translation:[0,.8,-.6]}},{id:'cube-b',meshId:'mesh:cube',materialId:'mat:emissive',transform:{translation:[1.6,.55,.5],rotationEulerDeg:[10,-22,8],scale:[.8,1.1,.8]}},{id:'child-cube',parentId:'cube-b',meshId:'mesh:cube',materialId:'mat:blue-metal',transform:{translation:[0,1.25,0],scale:[.35,.35,.35]}}],cameras:[{id:'camera:main',projection:'perspective',fovYDeg:52,near:.1,far:100,transform:{translation:[4.8,3.4,6.4],rotationEulerDeg:[-18,36,0]}}],lights:[{id:'light:ambient',kind:'ambient',color:'#7c9bc4',intensity:.16},{id:'light:sun',kind:'directional',color:'#fff2d6',intensity:2.1,direction:[-.55,-1,-.35],castShadow:true},{id:'light:fill',kind:'point',color:'#60a5fa',intensity:5,position:[-2.8,2.4,2.5],range:7}],reality:{worldId:'world:spatial-showcase',generation:1,realityRoot:cryptographicHash({world:'spatial-showcase',generation:1})}}}
