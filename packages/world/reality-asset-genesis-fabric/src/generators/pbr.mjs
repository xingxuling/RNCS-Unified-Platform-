import {encodePng,parseHex} from '../png.mjs';
import {rootHash,seal} from '../canonical.mjs';

const TAU=Math.PI*2;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const mix=(a,b,t)=>a.map((value,index)=>value+(b[index]-value)*t);
const roundColor=color=>color.map(value=>Math.round(clamp(value,0,255)));
const seedFrom=value=>value.split('').reduce((seed,char,index)=>(seed+char.charCodeAt(0)*(index+11))%104729,17);
const hash2=(x,y,seed)=>((x*374761393+y*668265263+seed*1442695041)>>>0)/4294967296;

function image(size,pixel){
  const data=Buffer.alloc(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const value=pixel(x,y,size),index=(y*size+x)*4;
    data[index]=value[0];data[index+1]=value[1];data[index+2]=value[2];data[index+3]=value[3]??255;
  }
  return encodePng(size,size,data);
}

function materialPalette(genome){
  const palette=genome.visual.palette.map(parseHex);
  return{primary:palette[0]??[40,80,140,255],highlight:palette[1]??[235,245,255,255],accent:palette[2]??[120,220,255,255],shadow:palette[3]??[10,25,55,255]};
}

export function generatePbrTexturePack({genome,variant}){
  const size=Math.min(genome.budgets.pbr_texture_size,variant==='mobile'?128:variant==='cinematic'?512:256);
  const palette=materialPalette(genome),seed=seedFrom(`${genome.identity.asset_id}:${variant}`),metal=variant==='cinematic'?.42:.18;
  const base=image(size,(x,y,s)=>{
    const u=x/Math.max(1,s-1),v=y/Math.max(1,s-1),noise=hash2(x,y,seed),stripe=Math.sin((u*8+v*3+seed%17)*Math.PI)*.5+.5;
    let color=mix(palette.primary,palette.shadow,v*.34);
    color=mix(color,palette.highlight,(.08+stripe*.12)*(1-v*.4));
    if(((x*7+y*11+seed)%37)<3)color=mix(color,palette.accent,.72);
    if(noise>.985)color=mix(color,palette.highlight,.3);
    return roundColor(color);
  });
  const normal=image(size,(x,y,s)=>{
    const u=x/Math.max(1,s-1),v=y/Math.max(1,s-1),wave=Math.sin(u*TAU*6+seed*.01)*.5+Math.cos(v*TAU*9-seed*.013)*.5;
    const dx=Math.cos(u*TAU*6+seed*.01)*.045,dy=-Math.sin(v*TAU*9-seed*.013)*.045;
    return[clamp(128+dx*255,0,255),clamp(128+dy*255,0,255),clamp(255-wave*9,0,255),255].map(Math.round);
  });
  const orm=image(size,(x,y,s)=>{
    const u=x/Math.max(1,s-1),v=y/Math.max(1,s-1),edge=Math.min(u,1-u,v,1-v),variation=hash2(x,y,seed+31);
    const occlusion=clamp(150+edge*180,0,255),roughness=clamp((variant==='mobile'?205:variant==='cinematic'?112:154)+(variation-.5)*24+(Math.abs(.5-v)*26),0,255),metallic=clamp(metal*255+(u>.44&&u<.56?32:0),0,255);
    return[Math.round(occlusion),Math.round(roughness),Math.round(metallic),255];
  });
  const emissive=image(size,(x,y,s)=>{
    const u=x/Math.max(1,s-1),v=y/Math.max(1,s-1),line=Math.abs(Math.sin((u*10+v*4+seed%13)*Math.PI));
    const active=(v<.16&&line>.94)||((u>.46&&u<.54)&&v>.18&&v<.38)||(Math.abs(u-.5)<.06&&v>.78);
    return active?[...roundColor(palette.accent.slice(0,3)),255]:[0,0,0,255];
  });
  const files=[['base-color.png',base,'base-color'],['normal.png',normal,'normal'],['orm.png',orm,'occlusion-roughness-metallic'],['emissive.png',emissive,'emissive']].map(([name,buffer,role])=>({name,buffer,role,mime:'image/png',root:rootHash(buffer.toString('base64'))}));
  const metadata=seal({format:'reality-asset.pbr-texture-pack.v0.4',asset_id:genome.identity.asset_id,variant,size,color_space:{'base-color':'srgb',normal:'linear','occlusion-roughness-metallic':'linear',emissive:'srgb'},material_model:'stylized-pbr-v0.4',variation:{seed,base_color:'vertical-gradient-with-accent-inlays',normal:'procedural-fabric-and-panel-relief',orm:'edge-occlusion-and-material-zones',emissive:'accent-trim-and-face-markers'},files:files.map(({name,role,mime,root})=>({name,role,mime,root})),pack_root:''},'pack_root');
  return{files,metadata};
}
