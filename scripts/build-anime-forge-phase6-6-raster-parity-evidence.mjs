import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inspectSvgRasterBackend,rasterizeSvgFile,validateSvgRasterReceipt,RESVG_JS_PINNED_VERSION} from '../packages/world/native-character-morphogenesis-runtime/src/svg-raster-provider.mjs';
import {sha256File} from '../packages/world/native-character-morphogenesis-runtime/src/media.mjs';
import {rootHash} from '../packages/world/native-character-morphogenesis-runtime/src/canonical.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=process.env.ANIME_PHASE6_6_EVIDENCE_DIR?path.resolve(process.env.ANIME_PHASE6_6_EVIDENCE_DIR):path.join(repoRoot,'evidence/anime-forge-phase6-6-native-drawing-infrastructure-v0.1');
const staticDir=path.join(outDir,'static-gates'),svgFile=path.join(staticDir,'front.svg'),parityDir=path.join(outDir,'raster-parity'),librsvgPng=path.join(parityDir,'front-librsvg.png'),resvgPng=path.join(parityDir,'front-resvg.png'),WIDTH=1280,HEIGHT=720,SSIM_THRESHOLD=.985;
const ffmpeg=process.env.FFMPEG_PATH??'ffmpeg';
const logical=file=>path.relative(outDir,file).split(path.sep).join('/');
const write=value=>{fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,'raster-parity-evidence.json'),`${JSON.stringify(value,null,2)}\n`);};
function runSsim(reference,candidate){const result=spawnSync(ffmpeg,['-hide_banner','-i',reference,'-i',candidate,'-lavfi','[0:v][1:v]ssim','-f','null','-'],{encoding:'utf8'});if(result.error?.code==='ENOENT')throw Object.assign(new Error(`RASTER_PARITY_FFMPEG_MISSING:${ffmpeg}`),{code:'RASTER_PARITY_FFMPEG_MISSING'});if(result.status!==0)throw Object.assign(new Error(`RASTER_PARITY_FFMPEG_FAILED:${result.stderr??result.stdout??''}`),{code:'RASTER_PARITY_FFMPEG_FAILED',status:result.status});const text=String(result.stderr??'')+String(result.stdout??''),matches=[...text.matchAll(/All:([0-9]+(?:\.[0-9]+)?)/g)],value=matches.length?Number(matches.at(-1)[1]):NaN;if(!Number.isFinite(value))throw Object.assign(new Error('RASTER_PARITY_SSIM_PARSE_FAILED'),{code:'RASTER_PARITY_SSIM_PARSE_FAILED',text:text.slice(-4000)});return value;}

export function buildRasterProviderParityEvidence(){
  if(!fs.existsSync(svgFile))throw Object.assign(new Error('RASTER_PARITY_BASELINE_STATIC_GATE_MISSING'),{code:'RASTER_PARITY_BASELINE_STATIC_GATE_MISSING'});
  fs.mkdirSync(parityDir,{recursive:true});
  const librsvg=inspectSvgRasterBackend({backend:'librsvg'}),resvg=inspectSvgRasterBackend({backend:'resvg-js'});
  if(resvg.version!==RESVG_JS_PINNED_VERSION||resvg.pin_match!==true)throw Object.assign(new Error(`RASTER_PARITY_RESVG_VERSION_INVALID:${resvg.version}`),{code:'RASTER_PARITY_RESVG_VERSION_INVALID'});
  const librsvgReceipt=rasterizeSvgFile(svgFile,librsvgPng,{provider:librsvg,width:WIDTH,height:HEIGHT,logicalSvgPath:'static-gates/front.svg',logicalPngPath:'raster-parity/front-librsvg.png'}),resvgReceipt=rasterizeSvgFile(svgFile,resvgPng,{provider:resvg,width:WIDTH,height:HEIGHT,logicalSvgPath:'static-gates/front.svg',logicalPngPath:'raster-parity/front-resvg.png'});
  for(const [name,receipt] of [['librsvg',librsvgReceipt],['resvg-js',resvgReceipt]]){const validation=validateSvgRasterReceipt(receipt);if(!validation.valid)throw Object.assign(new Error(`RASTER_PARITY_${name.toUpperCase()}_RECEIPT_INVALID:${validation.errors.join(',')}`),{code:'RASTER_PARITY_RECEIPT_INVALID',validation});}
  const ssim=runSsim(librsvgPng,resvgPng),passed=ssim>=SSIM_THRESHOLD,payload={format:'rncs.phase6-6-raster-parity-evidence.v0.1',source_svg_sha256:sha256File(svgFile),librsvg_png_sha256:sha256File(librsvgPng),resvg_png_sha256:sha256File(resvgPng),librsvg_version:librsvg.version,resvg_version:resvg.version,baseline:{backend:'librsvg',provider_id:librsvg.provider_id,provider_version:librsvg.version,receipt_root:librsvgReceipt.receipt_root,width:WIDTH,height:HEIGHT},candidate:{backend:'resvg-js',provider_id:resvg.provider_id,provider_version:resvg.version,pinned_provider_version:RESVG_JS_PINNED_VERSION,receipt_root:resvgReceipt.receipt_root,width:WIDTH,height:HEIGHT},SSIM:ssim,ssim_all:ssim,threshold:SSIM_THRESHOLD,comparison:{metric:'ffmpeg-ssim-all',ssim_all:ssim,minimum:SSIM_THRESHOLD,pass:passed},passed,status:passed?'passed':'failed',authority_statement:'Raster parity compares two execution bodies over the same final RNCS SVG. Neither raster provider owns identity, canonical geometry, DrawingIR or art direction.',human_visual_acceptance:'pending',evidence_root:''};payload.evidence_root=rootHash({...payload,evidence_root:''});write(payload);if(!passed)process.exitCode=1;return payload;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(buildRasterProviderParityEvidence(),null,2));
