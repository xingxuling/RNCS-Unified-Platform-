import {rootHash,GenesisError} from './canonical.mjs';

const align4=n=>(n+3)&~3;
const componentBytes={5121:1,5123:2,5125:4,5126:4};
const typeCount={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const KTX2_IDENTIFIER=Buffer.from([0xab,0x4b,0x54,0x58,0x20,0x32,0x30,0xbb,0x0d,0x0a,0x1a,0x0a]);

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

/**
 * Encode a deterministic native RGBA8 KTX2 mip container.  This is the
 * portable baseline for progressive texture residency; BasisU supercompression
 * remains an explicit host/provider boundary and is not silently claimed here.
 */
export function encodeKtx2Rgba8(levels,{colorSpace='srgb'}={}){
  if(!Array.isArray(levels)||!levels.length)throw new GenesisError('KTX2_LEVELS_REQUIRED','at least one mip level is required');
  const normalized=levels.map((level,index)=>{
    const width=Number(level?.width),height=Number(level?.height),pixels=Buffer.from(level?.pixels??[]),expectedWidth=Math.max(1,Math.floor(Number(levels[0]?.width))>>index),expectedHeight=Math.max(1,Math.floor(Number(levels[0]?.height))>>index);
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw new GenesisError('KTX2_DIMENSIONS_INVALID',`level ${index} dimensions are invalid`);
    if(width!==expectedWidth||height!==expectedHeight)throw new GenesisError('KTX2_MIP_DIMENSIONS_INVALID',`level ${index} dimensions must be ${expectedWidth}x${expectedHeight}`);
    if(pixels.length!==width*height*4)throw new GenesisError('KTX2_RGBA8_LENGTH_INVALID',`level ${index} payload length is invalid`);
    return{width,height,pixels};
  });
  const width=normalized[0].width,height=normalized[0].height,levelCount=normalized.length,headerLength=80+levelCount*24,dataOffset=align4(headerLength),totalLength=dataOffset+normalized.reduce((sum,level)=>sum+align4(level.pixels.length),0),out=Buffer.alloc(totalLength);
  KTX2_IDENTIFIER.copy(out,0);
  out.writeUInt32LE(colorSpace==='linear'?37:43,12);
  out.writeUInt32LE(1,16);
  out.writeUInt32LE(width,20);out.writeUInt32LE(height,24);out.writeUInt32LE(0,28);out.writeUInt32LE(0,32);out.writeUInt32LE(1,36);out.writeUInt32LE(levelCount,40);out.writeUInt32LE(0,44);
  let offset=dataOffset;
  normalized.forEach((level,index)=>{const entry=80+index*24;out.writeBigUInt64LE(BigInt(offset),entry);out.writeBigUInt64LE(BigInt(level.pixels.length),entry+8);out.writeBigUInt64LE(BigInt(level.pixels.length),entry+16);level.pixels.copy(out,offset);offset+=align4(level.pixels.length)});
  return out;
}

/** Inspect the portable RGBA8 KTX2 subset emitted by encodeKtx2Rgba8. */
export function inspectKtx2(buffer){
  const errors=[],bytes=Buffer.isBuffer(buffer)?buffer:Buffer.from(buffer??[]);
  if(bytes.length<104||!KTX2_IDENTIFIER.equals(bytes.subarray(0,12)))return{valid:false,errors:['KTX2_HEADER_INVALID'],root:rootHash(bytes.toString('base64'))};
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),vkFormat=view.getUint32(12,true),typeSize=view.getUint32(16,true),width=view.getUint32(20,true),height=view.getUint32(24,true),depth=view.getUint32(28,true),layers=view.getUint32(32,true),faces=view.getUint32(36,true),levelCount=view.getUint32(40,true),supercompression=view.getUint32(44,true);
  if(vkFormat!==37&&vkFormat!==43)errors.push('KTX2_VK_FORMAT_UNSUPPORTED');
  if(typeSize!==1||!width||!height||depth>1||layers>1||faces!==1||!levelCount)errors.push('KTX2_DIMENSIONS_INVALID');
  const levels=[];
  for(let index=0;index<levelCount;index++){
    const entry=80+index*24;
    if(entry+24>bytes.length){errors.push('KTX2_LEVEL_INDEX_TRUNCATED');break}
    const offset=Number(view.getBigUint64(entry,true)),length=Number(view.getBigUint64(entry+8,true)),uncompressedLength=Number(view.getBigUint64(entry+16,true)),expectedWidth=Math.max(1,width>>index),expectedHeight=Math.max(1,height>>index),expectedLength=expectedWidth*expectedHeight*4;
    if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||!Number.isSafeInteger(uncompressedLength)||offset<0||length<expectedLength||uncompressedLength!==length||offset+length>bytes.length)errors.push(`KTX2_LEVEL_INVALID:${index}`);
    levels.push({level:index,width:expectedWidth,height:expectedHeight,byteOffset:offset,byteLength:length,uncompressedByteLength:uncompressedLength});
  }
  if(supercompression!==0)errors.push('KTX2_SUPERCOMPRESSION_UNSUPPORTED');
  return{valid:errors.length===0,errors,width,height,level_count:levelCount,color_space:vkFormat===43?'srgb':'linear',supercompression,levels,root:rootHash(bytes.toString('base64'))};
}
