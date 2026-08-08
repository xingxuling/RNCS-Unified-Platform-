import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inspectSvgRasterBackend,rasterizeSvgFile,validateSvgRasterReceipt,RESVG_JS_PINNED_VERSION} from '../packages/world/native-character-morphogenesis-runtime/src/svg-raster-provider.mjs';
import {sha256File} from '../packages/world/native-character-morphogenesis-runtime/src/media.mjs';
import {rootHash} from '../packages/world/native-character-morphogenesis-runtime/src/canonical.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=process.env.ANIME_PHASE6_6_EVIDENCE_DIR?path.resolve(process.env.ANIME_PHASE6_6_EVIDENCE_DIR):path.join(repoRoot,'evidence/anime-forge-phase6-6-native-drawing-infrastructure-v0.1');
const staticDir=path.join(outDir,'static-gates'),svgFile=path.join(staticDir,'front.svg'),baselinePng=path.join(staticDir,'front.png'),parityDir=path.join(outDir,'raster-parity'),candidatePng=path.join(parityDir,'front-resvg.png'),WIDTH=1280,HEIGHT=720,SSIM_THRESHOLD=.985;
const ffmpeg=process.env.FFMPEG_PATH??'ffmpeg';
const write=value=>{fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,'raster-provider-parity-evidence.json'),`${JSON.stringify(value,null,2)}\n`);};
function runSsim(reference,candidate){const result=spawnSync(ffmpeg,['-hide_banner','-i',reference,'-i',candidate,'-lavfi','[0:v][1:v]ssim','-f','null','-'],{encoding:'utf8'});if(result.error?.code==='ENOENT')throw Object.assign(new Error(`RASTER_PARITY_FFMPEG_MISSING:${ffmpeg}`),{code:'RASTER_PARITY_FFMPEG_MISSING'});if(result.status!==0)throw Object.assign(new Error(`RASTER_PARITY_FFMPEG_FAILED:${result.stderr??result.stdout??''}`),{code:'RASTER_PARITY_FFMPEG_FAILED',status:result.status});const text=String(result.stderr??'')+String(result.stdout??''),matches=[...text.matchAll(/All:([0-9]+(?:\.[0-9]+)?)/g)],value=matches.length?Number(matches.at(-1)[1]):NaN;if(!Number.isFinite(value))throw Object.assign(new Error('RASTER_PARITY_SSIM_PARSE_FAILED'),{code:'RASTER_PARITY_SSIM_PARSE_FAILED',text:text.slice(-4000)});return value;}

export function buildRasterProviderParityEvidence(){
  if(!fs.existsSync(svgFile)||!fs.existsSync(baselinePng))throw Object.assign(new Error('RASTER_PARITY_BASELINE_STATIC_GATE_MISSING'),{code:'RASTER_PARITY_BASELINE_STATIC_GATE_MISSING'});
  fs.mkdirSync(parityDir,{recursive:true});
  const provider=inspectSvgRasterBackend({backend:'resvg-js'});
  if(provider.version!==RESVG_JS_PINNED_VERSION||provider.pin_match!==true)throw Object.assign(new Error(`RASTER_PARITY_RESVG_VERSION_INVALID:${provider.version}`),{code:'RASTER_PARITY_RESVG_VERSION_INVALID'});
  const receipt=rasterizeSvgFile(svgFile,candidatePng,{provider,width:WIDTH,height:HEIGHT,logicalSvgPath:'static-gates/front.svg',logicalPngPath:'raster-parity/front-resvg.png'}),validation=validateSvgRasterReceipt(receipt);
  if(!validation.valid)throw Object.assign(new Error(`RASTER_PARITY_RESVG_RECEIPT_INVALID:${validation.errors.join(',')}`),{code:'RASTER_PARITY_RESVG_RECEIPT_INVALID',validation});
  const ssim=runSsim(baselinePng,candidatePng),pass=ssim>=SSIM_THRESHOLD,payload={format:'rncs.phase6-6-raster-provider-parity-evidence.v0.1',source_svg_sha256:sha256File(svgFile),baseline:{backend:'librsvg',png_sha256:sha256File(baselinePng),width:WIDTH,height:HEIGHT},candidate:{backend:'resvg-js',provider_version:provider.version,pinned_provider_version:RESVG_JS_PINNED_VERSION,png_sha256:sha256File(candidatePng),raster_receipt_root:receipt.receipt_root,width:WIDTH,height:HEIGHT},comparison:{metric:'ffmpeg-ssim-all',ssim_all:ssim,minimum:ssim>=SSIM_THRESHOLD?SSIM_THRESHOLD:SSIM_THRESHOLD,pass},authority_statement:'Raster parity compares two execution bodies over the same final RNCS SVG. Neither raster provider owns identity, canonical geometry, DrawingIR or art direction.',status:pass?'passed':'failed',human_visual_acceptance:'pending',evidence_root:''};payload.evidence_root=rootHash({...payload,evidence_root:''});write(payload);if(!pass)process.exitCode=1;return payload;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(buildRasterProviderParityEvidence(),null,2));
