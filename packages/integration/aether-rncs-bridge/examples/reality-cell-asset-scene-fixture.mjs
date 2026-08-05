import {createHash} from 'node:crypto';

const align4=value=>Math.ceil(value/4)*4;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const DEFAULT_PIXELS=[255,80,40,255,40,180,255,255,40,180,255,255,255,80,40,255];

function writeChunk(target,offset,type,bytes){
  const view=new DataView(target.buffer,target.byteOffset,target.byteLength);
  view.setUint32(offset,bytes.byteLength,true);view.setUint32(offset+4,type,true);target.set(bytes,offset+8);
}

export function createCellAssetGlb({pixels=DEFAULT_PIXELS}={}){
  const positions=new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),normals=new Float32Array([0,0,1,0,0,1,0,0,1,0,0,1]),uvs=new Float32Array([0,0,1,0,1,1,0,1]),indices=new Uint16Array([0,1,2,0,2,3]),binary=new Uint8Array(140);
  binary.set(new Uint8Array(positions.buffer),0);binary.set(new Uint8Array(normals.buffer),48);binary.set(new Uint8Array(uvs.buffer),96);binary.set(new Uint8Array(indices.buffer),128);
  const gltf={asset:{version:'2.0',generator:'RNCS Reality Cell asset fixture'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'cell-asset-plane',mesh:0}],meshes:[{name:'cell-asset-plane',primitives:[{attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},indices:3,material:0}]}],buffers:[{byteLength:binary.byteLength}],bufferViews:[{buffer:0,byteOffset:0,byteLength:48},{buffer:0,byteOffset:48,byteLength:48},{buffer:0,byteOffset:96,byteLength:32},{buffer:0,byteOffset:128,byteLength:12}],accessors:[{bufferView:0,componentType:5126,count:4,type:'VEC3'},{bufferView:1,componentType:5126,count:4,type:'VEC3'},{bufferView:2,componentType:5126,count:4,type:'VEC2'},{bufferView:3,componentType:5123,count:6,type:'SCALAR'}],images:[{mimeType:'application/x-vsr-rgba',extras:{vsrRGBA:{width:2,height:2,colorSpace:'srgb',pixels:[...(Array.isArray(pixels)&&pixels.length===16?pixels:DEFAULT_PIXELS)]}}}],samplers:[{magFilter:9729,minFilter:9729}],textures:[{sampler:0,source:0}],materials:[{name:'cell-asset-material',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],baseColorTexture:{index:0},metallicFactor:.15,roughnessFactor:.35}}]};
  const jsonBytes=new TextEncoder().encode(JSON.stringify(gltf)),jsonChunk=new Uint8Array(align4(jsonBytes.byteLength));jsonChunk.fill(0x20);jsonChunk.set(jsonBytes);const binaryChunk=new Uint8Array(align4(binary.byteLength));binaryChunk.set(binary);const total=12+8+jsonChunk.byteLength+8+binaryChunk.byteLength,output=new Uint8Array(total),header=new DataView(output.buffer);header.setUint32(0,0x46546c67,true);header.setUint32(4,2,true);header.setUint32(8,total,true);writeChunk(output,12,0x4e4f534a,jsonChunk);writeChunk(output,12+8+jsonChunk.byteLength,0x004e4942,binaryChunk);return output;
}

export function createCellAssetGltf({pixels=[40,120,255,255,255,220,40,255,255,220,40,255,40,120,255,255]}={}){
  const glb=createCellAssetGlb({pixels}),view=new DataView(glb.buffer,glb.byteOffset,glb.byteLength),jsonLength=view.getUint32(12,true),jsonStart=20,jsonEnd=jsonStart+jsonLength,binaryHeader=jsonEnd,binaryLength=view.getUint32(binaryHeader,true),binaryStart=binaryHeader+8,gltf=JSON.parse(new TextDecoder().decode(glb.subarray(jsonStart,jsonEnd)).trim());
  gltf.buffers[0]={...gltf.buffers[0],uri:'scene.bin'};gltf.images=[{uri:'plane.rgba.json',mimeType:'application/x-vsr-rgba+json'}];
  return {json:new TextEncoder().encode(JSON.stringify(gltf)),binary:glb.slice(binaryStart,binaryStart+binaryLength),image:new TextEncoder().encode(JSON.stringify({width:2,height:2,colorSpace:'srgb',pixels}))};
}

export function createCellAssetPayloads(){const far=createCellAssetGltf();return new Map([['asset:shared',new TextEncoder().encode('shared')],['asset:mesh',createCellAssetGlb()],['asset:far-gltf',far.json],['asset:far-gltf-bin',far.binary],['asset:far-gltf-image',far.image]]);}

export function createCellAssetCatalog(payloads=createCellAssetPayloads()){
  const shared=payloads.get('asset:shared'),mesh=payloads.get('asset:mesh'),farGltf=payloads.get('asset:far-gltf'),farBin=payloads.get('asset:far-gltf-bin'),farImage=payloads.get('asset:far-gltf-image');
  return[
    {id:'asset:shared',uri:'memory://shared',sha256:digest(shared),byteLength:shared.byteLength,kind:'other',cellIds:['cell:near'],priority:4},
    {id:'asset:mesh',uri:'memory://mesh.glb',format:'glb',sha256:digest(mesh),byteLength:mesh.byteLength,kind:'mesh',cellIds:['cell:near'],dependencies:['asset:shared'],priority:10},
    {id:'asset:far-gltf',uri:'memory://far/scene.gltf',format:'gltf',sha256:digest(farGltf),byteLength:farGltf.byteLength,kind:'mesh',cellIds:['cell:far'],dependencies:['asset:far-gltf-bin','asset:far-gltf-image'],priority:10},
    {id:'asset:far-gltf-bin',uri:'memory://far/scene.bin',sha256:digest(farBin),byteLength:farBin.byteLength,kind:'other',priority:9},
    {id:'asset:far-gltf-image',uri:'memory://far/plane.rgba.json',sha256:digest(farImage),byteLength:farImage.byteLength,kind:'texture',priority:9}
  ];
}
