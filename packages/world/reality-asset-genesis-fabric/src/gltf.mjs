import {rootHash,GenesisError} from './canonical.mjs';

const align4=n=>(n+3)&~3;
const componentBytes={5121:1,5123:2,5125:4,5126:4};
const typeCount={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};

export class GlbBuilder{
  constructor(){this.chunks=[];this.bufferViews=[];this.accessors=[];}
  addBuffer(buffer,{target=null}={}){
    const b=Buffer.isBuffer(buffer)?buffer:Buffer.from(buffer);const offset=this.chunks.reduce((n,x)=>n+x.length,0);const padded=Buffer.alloc(align4(b.length));b.copy(padded);this.chunks.push(padded);
    const view={buffer:0,byteOffset:offset,byteLength:b.length};if(target)view.target=target;this.bufferViews.push(view);return this.bufferViews.length-1;
  }
  addAccessor(buffer,{componentType,type,count,target=null,min=null,max=null,normalized=false}={}){
    const view=this.addBuffer(buffer,{target});const a={bufferView:view,componentType,count,type};if(min)a.min=min;if(max)a.max=max;if(normalized)a.normalized=true;this.accessors.push(a);return this.accessors.length-1;
  }
  binary(){return Buffer.concat(this.chunks);}
}
const floats=a=>{const b=Buffer.alloc(a.length*4);a.forEach((v,i)=>b.writeFloatLE(v,i*4));return b;};
const u16=a=>{const b=Buffer.alloc(a.length*2);a.forEach((v,i)=>b.writeUInt16LE(v,i*2));return b;};
const u32=a=>{const b=Buffer.alloc(a.length*4);a.forEach((v,i)=>b.writeUInt32LE(v,i*4));return b;};
export const encodeFloat32=floats;export const encodeUint16=u16;export const encodeUint32=u32;
export function minMax(values,size){const min=Array(size).fill(Infinity),max=Array(size).fill(-Infinity);for(let i=0;i<values.length;i+=size)for(let j=0;j<size;j++){min[j]=Math.min(min[j],values[i+j]);max[j]=Math.max(max[j],values[i+j]);}return{min,max};}
export function encodeGlb(json,binary=Buffer.alloc(0)){
  const jsonBytes=Buffer.from(JSON.stringify(json),'utf8'),jsonPad=Buffer.alloc(align4(jsonBytes.length),0x20);jsonBytes.copy(jsonPad);const binPad=Buffer.alloc(align4(binary.length));binary.copy(binPad);
  const total=12+8+jsonPad.length+(binPad.length?8+binPad.length:0),out=Buffer.alloc(total);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(total,8);let o=12;out.writeUInt32LE(jsonPad.length,o);out.writeUInt32LE(0x4e4f534a,o+4);jsonPad.copy(out,o+8);o+=8+jsonPad.length;if(binPad.length){out.writeUInt32LE(binPad.length,o);out.writeUInt32LE(0x004e4942,o+4);binPad.copy(out,o+8);}return out;
}
export function inspectGlb(buffer){
  const errors=[];if(!Buffer.isBuffer(buffer)||buffer.length<20)return{valid:false,errors:['GLB_TOO_SMALL']};if(buffer.readUInt32LE(0)!==0x46546c67)errors.push('GLB_MAGIC_INVALID');if(buffer.readUInt32LE(4)!==2)errors.push('GLB_VERSION_INVALID');if(buffer.readUInt32LE(8)!==buffer.length)errors.push('GLB_LENGTH_MISMATCH');let json=null;try{const len=buffer.readUInt32LE(12),type=buffer.readUInt32LE(16);if(type!==0x4e4f534a)errors.push('GLB_JSON_CHUNK_MISSING');else json=JSON.parse(buffer.subarray(20,20+len).toString('utf8').trim());}catch(e){errors.push(`GLB_JSON_INVALID:${e.message}`);}if(json){if(json.asset?.version!=='2.0')errors.push('GLTF_ASSET_VERSION_INVALID');for(const a of json.accessors??[]){const bytes=componentBytes[a.componentType]*typeCount[a.type]*a.count;if(!Number.isFinite(bytes))errors.push('GLTF_ACCESSOR_INVALID');}}
  return{valid:!errors.length,errors,json,root:rootHash(buffer.toString('base64')),mesh_count:json?.meshes?.length??0,node_count:json?.nodes?.length??0,skin_count:json?.skins?.length??0,animation_count:json?.animations?.length??0};
}
export function requireValidGlb(buffer){const r=inspectGlb(buffer);if(!r.valid)throw new GenesisError('GLB_INVALID',r.errors.join(','));return r;}
