import {encodePng,parseHex} from '../png.mjs';import {rootHash,seal} from '../canonical.mjs';
function image(size,pixel){const data=Buffer.alloc(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,v=pixel(x,y,size);data[i]=v[0];data[i+1]=v[1];data[i+2]=v[2];data[i+3]=v[3]??255;}return encodePng(size,size,data);}
export function generatePbrTexturePack({genome,variant}){
 const size=Math.min(genome.budgets.pbr_texture_size,variant==='mobile'?64:variant==='cinematic'?256:128),[p,w,a,d]=genome.visual.palette.map(parseHex);
 const base=image(size,(x,y,s)=>{const t=(x+y)/(2*s),c=t<.55?p:a;return[c[0],c[1],c[2],255]});
 const normal=image(size,()=>[128,128,255,255]);const rough=variant==='mobile'?210:variant==='cinematic'?110:155,metal=variant==='cinematic'?90:35;
 const orm=image(size,()=>[255,rough,metal,255]);const emissive=image(size,(x,y,s)=>((x-y+s)%Math.max(4,Math.floor(s/8))===0?[a[0],a[1],a[2],255]:[0,0,0,255]));
 const files=[['base-color.png',base,'base-color'],['normal.png',normal,'normal'],['orm.png',orm,'occlusion-roughness-metallic'],['emissive.png',emissive,'emissive']].map(([name,buffer,role])=>({name,buffer,role,mime:'image/png',root:rootHash(buffer.toString('base64'))}));
 const metadata=seal({format:'reality-asset.pbr-texture-pack.v0.3',asset_id:genome.identity.asset_id,variant,size,color_space:{'base-color':'srgb',normal:'linear','occlusion-roughness-metallic':'linear',emissive:'srgb'},files:files.map(({name,role,mime,root})=>({name,role,mime,root})),pack_root:''},'pack_root');return{files,metadata};
}
