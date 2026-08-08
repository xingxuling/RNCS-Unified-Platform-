import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {seal} from './canonical.mjs';

const require=createRequire(import.meta.url);
const FORMAT='rncs.svg-raster-provider-receipt.v0.1';
const BACKENDS=new Set(['librsvg','resvg-js']);
const RESVG_JS_PIN='2.6.2';

function fileRecord(file){const stat=fs.statSync(file),sha256=createHash('sha256').update(fs.readFileSync(file)).digest('hex');return{path:file,sha256,bytes:stat.size};}
function commandVersion(command,args){const result=spawnSync(command,args,{encoding:'utf8'});if(result.error?.code==='ENOENT')throw Object.assign(new Error(`SVG_RASTER_TOOL_NOT_FOUND:${command}`),{code:'SVG_RASTER_TOOL_NOT_FOUND',command});if(result.status!==0)throw Object.assign(new Error(`SVG_RASTER_TOOL_VERSION_FAILED:${command}:${result.stderr??result.stdout??''}`),{code:'SVG_RASTER_TOOL_VERSION_FAILED',command,status:result.status});return String(result.stdout||result.stderr||'').trim().split(/\r?\n/)[0]||'unknown';}

export function normalizeSvgRasterBackend(value=process.env.PHASE66_RASTER_BACKEND??'librsvg'){
  const backend=String(value||'librsvg').trim().toLowerCase();
  if(!BACKENDS.has(backend))throw Object.assign(new Error(`SVG_RASTER_BACKEND_UNSUPPORTED:${backend}`),{code:'SVG_RASTER_BACKEND_UNSUPPORTED',backend});
  return backend;
}

export function inspectSvgRasterBackend({backend=normalizeSvgRasterBackend(),rsvgPath=process.env.RSVG_CONVERT_PATH??'rsvg-convert'}={}){
  if(backend==='librsvg')return{backend,provider_id:'rncs.svg-raster.librsvg',version:commandVersion(rsvgPath,['--version']),command:rsvgPath,system_library_dependency:true,node_module:null,pinned_version:null,pin_match:true};
  let pkg,Resvg;
  try{pkg=require('@resvg/resvg-js/package.json');({Resvg}=require('@resvg/resvg-js'));}catch(error){throw Object.assign(new Error(`SVG_RASTER_RESVG_JS_MISSING:${error?.message??error}`),{code:'SVG_RASTER_RESVG_JS_MISSING',cause:error});}
  if(typeof Resvg!=='function')throw Object.assign(new Error('SVG_RASTER_RESVG_JS_API_INVALID'),{code:'SVG_RASTER_RESVG_JS_API_INVALID'});
  const version=String(pkg?.version??'unknown');
  return{backend,provider_id:'rncs.svg-raster.resvg-js',version,command:null,system_library_dependency:false,node_module:'@resvg/resvg-js',pinned_version:RESVG_JS_PIN,pin_match:version===RESVG_JS_PIN};
}

export function rasterizeSvgFile(svgFile,pngFile,{backend=null,provider=null,width,height,rsvgPath=process.env.RSVG_CONVERT_PATH??'rsvg-convert'}={}){
  const w=Number(width),h=Number(height),resolvedBackend=backend?normalizeSvgRasterBackend(backend):provider?.backend?normalizeSvgRasterBackend(provider.backend):normalizeSvgRasterBackend();
  if(!Number.isInteger(w)||w<=0||!Number.isInteger(h)||h<=0)throw Object.assign(new Error(`SVG_RASTER_DIMENSIONS_INVALID:${width}x${height}`),{code:'SVG_RASTER_DIMENSIONS_INVALID'});
  const resolvedProvider=provider??inspectSvgRasterBackend({backend:resolvedBackend,rsvgPath});
  if(resolvedProvider.backend!==resolvedBackend)throw Object.assign(new Error(`SVG_RASTER_PROVIDER_BACKEND_MISMATCH:${resolvedProvider.backend}:${resolvedBackend}`),{code:'SVG_RASTER_PROVIDER_BACKEND_MISMATCH'});
  if(resolvedBackend==='resvg-js'&&!resolvedProvider.pin_match)throw Object.assign(new Error(`SVG_RASTER_RESVG_JS_VERSION_UNPINNED:${resolvedProvider.version}:expected:${RESVG_JS_PIN}`),{code:'SVG_RASTER_RESVG_JS_VERSION_UNPINNED',provider:resolvedProvider});
  if(resolvedBackend==='librsvg'){
    const command=resolvedProvider.command??rsvgPath,result=spawnSync(command,['--width',String(w),'--height',String(h),'--output',pngFile,svgFile],{encoding:'utf8'});
    if(result.error?.code==='ENOENT')throw Object.assign(new Error(`SVG_RASTER_TOOL_NOT_FOUND:${command}`),{code:'SVG_RASTER_TOOL_NOT_FOUND'});
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
  const receipt={format:FORMAT,version:'0.1.0-alpha.1',backend:resolvedBackend,provider_id:resolvedProvider.provider_id,provider_version:resolvedProvider.version,pinned_provider_version:resolvedProvider.pinned_version,pin_match:resolvedProvider.pin_match,system_library_dependency:resolvedProvider.system_library_dependency,node_module:resolvedProvider.node_module,svg_file:svgFile,png_file:pngFile,width:w,height:h,output:fileRecord(pngFile),authority:{identity:false,canonical_geometry:false,drawing_ir:false,art_direction:false},receipt_root:''};
  return seal(receipt,'receipt_root');
}

export function validateSvgRasterReceipt(receipt,{allowedBackends=['librsvg','resvg-js']}={}){
  const errors=[];
  if(receipt?.format!==FORMAT)errors.push('SVG_RASTER_RECEIPT_FORMAT_INVALID');
  if(!allowedBackends.includes(receipt?.backend))errors.push(`SVG_RASTER_RECEIPT_BACKEND_INVALID:${receipt?.backend}`);
  if(!receipt?.provider_id||!receipt?.provider_version||!receipt?.receipt_root)errors.push('SVG_RASTER_RECEIPT_ROOT_CHAIN_MISSING');
  if(receipt?.backend==='resvg-js'&&(receipt?.provider_version!==RESVG_JS_PIN||receipt?.pinned_provider_version!==RESVG_JS_PIN||receipt?.pin_match!==true))errors.push(`SVG_RASTER_RESVG_JS_VERSION_INVALID:${receipt?.provider_version}`);
  if(!Number.isInteger(Number(receipt?.width))||Number(receipt.width)<=0||!Number.isInteger(Number(receipt?.height))||Number(receipt.height)<=0)errors.push('SVG_RASTER_RECEIPT_DIMENSIONS_INVALID');
  if(Number(receipt?.output?.bytes??0)<=0||!/^[a-f0-9]{64}$/i.test(String(receipt?.output?.sha256??'')))errors.push('SVG_RASTER_RECEIPT_OUTPUT_INVALID');
  if(receipt?.authority?.identity!==false||receipt?.authority?.canonical_geometry!==false||receipt?.authority?.drawing_ir!==false||receipt?.authority?.art_direction!==false)errors.push('SVG_RASTER_RECEIPT_AUTHORITY_INVALID');
  return{valid:errors.length===0,errors,receipt_root:receipt?.receipt_root??null,backend:receipt?.backend??null,provider_version:receipt?.provider_version??null,output_sha256:receipt?.output?.sha256??null};
}

export const SVG_RASTER_PROVIDER_FORMAT=FORMAT;
export const SVG_RASTER_BACKENDS=Object.freeze([...BACKENDS]);
export const RESVG_JS_PINNED_VERSION=RESVG_JS_PIN;
