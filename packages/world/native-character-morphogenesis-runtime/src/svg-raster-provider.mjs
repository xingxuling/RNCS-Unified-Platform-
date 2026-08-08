import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {rootHash,seal} from './canonical.mjs';

const require=createRequire(import.meta.url);
const FORMAT='rncs.svg-raster-provider-receipt.v0.1';
const BACKENDS=new Set(['librsvg','resvg-js']);

function sha256LikeRecord(file){const stat=fs.statSync(file);return{path:file,bytes:stat.size};}
function commandVersion(command,args){const result=spawnSync(command,args,{encoding:'utf8'});if(result.error?.code==='ENOENT')throw Object.assign(new Error(`SVG_RASTER_TOOL_NOT_FOUND:${command}`),{code:'SVG_RASTER_TOOL_NOT_FOUND',command});if(result.status!==0)throw Object.assign(new Error(`SVG_RASTER_TOOL_VERSION_FAILED:${command}:${result.stderr??result.stdout??''}`),{code:'SVG_RASTER_TOOL_VERSION_FAILED',command,status:result.status});return String(result.stdout||result.stderr||'').trim().split(/\r?\n/)[0]||'unknown';}

export function normalizeSvgRasterBackend(value=process.env.PHASE66_RASTER_BACKEND??'librsvg'){
  const backend=String(value||'librsvg').trim().toLowerCase();
  if(!BACKENDS.has(backend))throw Object.assign(new Error(`SVG_RASTER_BACKEND_UNSUPPORTED:${backend}`),{code:'SVG_RASTER_BACKEND_UNSUPPORTED',backend});
  return backend;
}

export function inspectSvgRasterBackend({backend=normalizeSvgRasterBackend(),rsvgPath=process.env.RSVG_CONVERT_PATH??'rsvg-convert'}={}){
  if(backend==='librsvg')return{backend,provider_id:'rncs.svg-raster.librsvg',version:commandVersion(rsvgPath,['--version']),command:rsvgPath,system_library_dependency:true,node_module:null};
  let pkg,Resvg;
  try{pkg=require('@resvg/resvg-js/package.json');({Resvg}=require('@resvg/resvg-js'));}catch(error){throw Object.assign(new Error(`SVG_RASTER_RESVG_JS_MISSING:${error?.message??error}`),{code:'SVG_RASTER_RESVG_JS_MISSING',cause:error});}
  if(typeof Resvg!=='function')throw Object.assign(new Error('SVG_RASTER_RESVG_JS_API_INVALID'),{code:'SVG_RASTER_RESVG_JS_API_INVALID'});
  return{backend,provider_id:'rncs.svg-raster.resvg-js',version:String(pkg?.version??'unknown'),command:null,system_library_dependency:false,node_module:'@resvg/resvg-js'};
}

export function rasterizeSvgFile(svgFile,pngFile,{backend=normalizeSvgRasterBackend(),width,height,rsvgPath=process.env.RSVG_CONVERT_PATH??'rsvg-convert'}={}){
  const w=Number(width),h=Number(height);
  if(!Number.isInteger(w)||w<=0||!Number.isInteger(h)||h<=0)throw Object.assign(new Error(`SVG_RASTER_DIMENSIONS_INVALID:${width}x${height}`),{code:'SVG_RASTER_DIMENSIONS_INVALID'});
  const provider=inspectSvgRasterBackend({backend,rsvgPath});
  if(backend==='librsvg'){
    const result=spawnSync(rsvgPath,['--width',String(w),'--height',String(h),'--output',pngFile,svgFile],{encoding:'utf8'});
    if(result.error?.code==='ENOENT')throw Object.assign(new Error(`SVG_RASTER_TOOL_NOT_FOUND:${rsvgPath}`),{code:'SVG_RASTER_TOOL_NOT_FOUND'});
    if(result.status!==0)throw Object.assign(new Error(`SVG_RASTER_LIBRSVG_FAILED:${result.stderr??result.stdout??''}`),{code:'SVG_RASTER_LIBRSVG_FAILED',status:result.status});
  }else{
    const {Resvg}=require('@resvg/resvg-js');
    const svg=fs.readFileSync(svgFile);
    const resvg=new Resvg(svg,{fitTo:{mode:'width',value:w}});
    const rendered=resvg.render();
    if(Number(rendered.width)!==w||Number(rendered.height)!==h)throw Object.assign(new Error(`SVG_RASTER_RESVG_DIMENSION_MISMATCH:${rendered.width}x${rendered.height}:${w}x${h}`),{code:'SVG_RASTER_RESVG_DIMENSION_MISMATCH'});
    fs.writeFileSync(pngFile,rendered.asPng());
  }
  if(!fs.existsSync(pngFile)||fs.statSync(pngFile).size<=0)throw Object.assign(new Error(`SVG_RASTER_OUTPUT_MISSING:${pngFile}`),{code:'SVG_RASTER_OUTPUT_MISSING'});
  const receipt={format:FORMAT,version:'0.1.0-alpha.1',backend,provider_id:provider.provider_id,provider_version:provider.version,system_library_dependency:provider.system_library_dependency,node_module:provider.node_module,svg_file:svgFile,png_file:pngFile,width:w,height:h,output:sha256LikeRecord(pngFile),authority:{identity:false,canonical_geometry:false,drawing_ir:false,art_direction:false},receipt_root:''};
  return seal(receipt,'receipt_root');
}

export function validateSvgRasterReceipt(receipt,{allowedBackends=['librsvg','resvg-js']}={}){
  const errors=[];
  if(receipt?.format!==FORMAT)errors.push('SVG_RASTER_RECEIPT_FORMAT_INVALID');
  if(!allowedBackends.includes(receipt?.backend))errors.push(`SVG_RASTER_RECEIPT_BACKEND_INVALID:${receipt?.backend}`);
  if(!receipt?.provider_id||!receipt?.provider_version||!receipt?.receipt_root)errors.push('SVG_RASTER_RECEIPT_ROOT_CHAIN_MISSING');
  if(!Number.isInteger(Number(receipt?.width))||Number(receipt.width)<=0||!Number.isInteger(Number(receipt?.height))||Number(receipt.height)<=0)errors.push('SVG_RASTER_RECEIPT_DIMENSIONS_INVALID');
  if(Number(receipt?.output?.bytes??0)<=0)errors.push('SVG_RASTER_RECEIPT_OUTPUT_INVALID');
  if(receipt?.authority?.identity!==false||receipt?.authority?.canonical_geometry!==false||receipt?.authority?.drawing_ir!==false||receipt?.authority?.art_direction!==false)errors.push('SVG_RASTER_RECEIPT_AUTHORITY_INVALID');
  return{valid:errors.length===0,errors,receipt_root:receipt?.receipt_root??null,backend:receipt?.backend??null};
}

export const SVG_RASTER_PROVIDER_FORMAT=FORMAT;
export const SVG_RASTER_BACKENDS=Object.freeze([...BACKENDS]);
