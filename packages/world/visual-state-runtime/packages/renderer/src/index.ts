import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { evaluateAt, prepareDocument } from '../../core/src/index.js';
import { loadRasterResources, renderPng } from '../../backend-canvas/src/index.js';
import { semanticHash, type VSRContext, type VSRDocument } from '../../spec/src/index.js';

export interface VSRFrameManifestEntry { frameIndex:number; time:number; filename:string; byteSize:number; contentHash:string; semanticHash:string }
export interface VSRFrameManifest { version:string; documentId:string; documentHash:string; fps:number; start:number; end:number; width:number; height:number; frames:VSRFrameManifestEntry[] }
export interface VSRResourceOptions { assetBaseDir?:string; strictResources?:boolean }
export interface VSRRenderRangeOptions extends VSRResourceOptions { start:number; end:number; fps:number; outDir:string; context?:Partial<VSRContext>; onProgress?:(completed:number,total:number)=>void; signal?:{aborted:boolean} }

export function renderFrame(document:VSRDocument,time:number,outPath:string,context:Partial<VSRContext>={},resourceOptions:VSRResourceOptions={}):VSRFrameManifestEntry {
  const result=evaluateAt({document,time,context}); const resources=loadRasterResources(document.assets,resourceOptions.assetBaseDir??process.cwd(),resourceOptions.strictResources??false);const bytes=renderPng(result.displayState,resources); const absolute=resolve(outPath);mkdirSync(dirname(absolute),{recursive:true});writeFileSync(absolute,bytes);
  return {frameIndex:Math.round(time*(context.fps??document.metadata.defaultFps)),time,filename:absolute,byteSize:bytes.byteLength,contentHash:semanticHash([...bytes]),semanticHash:result.semanticHash};
}

export function renderRange(document:VSRDocument,options:VSRRenderRangeOptions):VSRFrameManifest {
  if(options.end<options.start)throw new Error('Render end must be >= start.');if(options.fps<=0)throw new Error('FPS must be > 0.');
  const prepared=prepareDocument(document);const resources=loadRasterResources(document.assets,options.assetBaseDir??process.cwd(),options.strictResources??false);const total=Math.max(1,Math.floor((options.end-options.start)*options.fps+1e-9)+1);const outDir=resolve(options.outDir);mkdirSync(outDir,{recursive:true});const frames:VSRFrameManifestEntry[]=[];
  for(let i=0;i<total;i++){if(options.signal?.aborted)throw new Error('Render cancelled.');const time=options.start+i/options.fps;const result=evaluateAt({document:prepared,time,context:{...options.context,fps:options.fps}});const bytes=renderPng(result.displayState,resources);const filename=join(outDir,`frame_${String(i).padStart(6,'0')}.png`);writeFileSync(filename,bytes);frames.push({frameIndex:i,time,filename,byteSize:bytes.byteLength,contentHash:semanticHash([...bytes]),semanticHash:result.semanticHash});options.onProgress?.(i+1,total)}
  const context={width:options.context?.width??document.canvas.width,height:options.context?.height??document.canvas.height};const manifest:VSRFrameManifest={version:'0.1',documentId:document.metadata.id,documentHash:prepared.documentHash,fps:options.fps,start:options.start,end:options.end,width:context.width,height:context.height,frames};writeFileSync(join(outDir,'frames-manifest.json'),JSON.stringify(manifest,null,2));return manifest;
}

export function ffmpegAvailable():boolean { const r=spawnSync('ffmpeg',['-version'],{encoding:'utf8'});return r.status===0 }
export function encodeVideo(manifestPath:string,outputPath:string,format:'mp4'|'webm'='mp4'):string {
  const manifest=JSON.parse(readFileSync(manifestPath,'utf8')) as VSRFrameManifest;
  return encodeVideoFromManifest(manifest,outputPath,format);
}

export function encodeVideoFromManifest(manifest:VSRFrameManifest,outputPath:string,format:'mp4'|'webm'='mp4'):string {
  if(!ffmpegAvailable())throw new Error('FFmpeg 不可用；图片序列已保留。');if(!manifest.frames.length)throw new Error('Manifest contains no frames.');
  const first=manifest.frames[0]!.filename;const dir=dirname(first);const pattern=join(dir,'frame_%06d.png');const output=resolve(outputPath);mkdirSync(dirname(output),{recursive:true});
  const args=format==='mp4'?['-y','-framerate',String(manifest.fps),'-i',pattern,'-c:v','libx264','-pix_fmt','yuv420p',output]:['-y','-framerate',String(manifest.fps),'-i',pattern,'-c:v','libvpx-vp9','-pix_fmt','yuva420p',output];
  const result=spawnSync('ffmpeg',args,{encoding:'utf8'});if(result.status!==0)throw new Error(`FFmpeg 编码失败：${String(result.stderr??'').slice(-2000)}`);if(!existsSync(output))throw new Error('FFmpeg 未生成输出文件。');return output;
}
