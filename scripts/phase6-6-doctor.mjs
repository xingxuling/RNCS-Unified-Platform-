#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inspectSvgRasterBackend,normalizeSvgRasterBackend} from '../packages/world/native-character-morphogenesis-runtime/src/svg-raster-provider.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const repoRoot=path.resolve(here,'..');
const arg=name=>{const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:null;};
const commandVersion=(command,args=['--version'])=>{const windowsScript=process.platform==='win32'&&/\.(?:cmd|bat)$/i.test(String(command));const result=spawnSync(command,args,{encoding:'utf8',shell:windowsScript});return{command,available:!result.error&&result.status===0,status:result.status,error:result.error?.code??null,version:String(result.stdout||result.stderr||'').trim().split(/\r?\n/)[0]||null};};
const resolveCommand=(envName,fallback,args=['--version'])=>{const command=process.env[envName]||fallback;return{env:envName,...commandVersion(command,args)};};
const resolveFirst=(envName,candidates,args=['--version'])=>{const configured=process.env[envName];if(configured)return{env:envName,...commandVersion(configured,args)};for(const candidate of candidates){const check=commandVersion(candidate,args);if(check.available)return{env:envName,...check};}return{env:envName,command:candidates[0],available:false,status:null,error:'ENOENT',version:null};};
const inspectRaster=()=>{const requested=arg('--raster-backend')??process.env.PHASE66_RASTER_BACKEND??undefined;let backend;try{backend=normalizeSvgRasterBackend(requested);}catch(error){return{backend:String(requested??'invalid'),available:false,error:error.code??error.message,provider_id:null,provider_version:null,pinned_provider_version:null,pin_match:false};}try{const info=inspectSvgRasterBackend({backend,rsvgPath:process.env.RSVG_CONVERT_PATH??'rsvg-convert'});return{...info,available:backend==='resvg-js'?info.pin_match===true:info.available!==false,error:backend==='resvg-js'&&info.pin_match!==true?'SVG_RASTER_RESVG_JS_VERSION_UNPINNED':null};}catch(error){return{backend,available:false,error:error.code??error.message,provider_id:null,provider_version:null,pinned_provider_version:backend==='resvg-js'?'2.6.2':null,pin_match:false};}};
const python=resolveFirst('PHASE66_PYTHON_PATH',process.platform==='win32'?['python.exe','python','py.exe','py']:['python3','python'],['--version']);
const playwright=python.available?(()=>{const result=spawnSync(python.command,['-c','import playwright; print("playwright")'],{encoding:'utf8'});return{available:!result.error&&result.status===0,status:result.status,error:result.error?.code??null,version:result.status===0?'installed':null};})():{available:false,status:null,error:'PYTHON_MISSING',version:null};
const chromium=python.available&&playwright.available?(()=>{const probe='import os,sys\nfrom playwright.sync_api import sync_playwright\nwith sync_playwright() as p:\n path=p.chromium.executable_path\n print(path)\n sys.exit(0 if path and os.path.isfile(path) else 2)';const result=spawnSync(python.command,['-c',probe],{encoding:'utf8'}),executable=String(result.stdout??'').trim().split(/\r?\n/).at(-1)||null;return{available:!result.error&&result.status===0&&Boolean(executable),status:result.status,error:result.error?.code??null,executable,exists:Boolean(executable&&fs.existsSync(executable))};})():{available:false,status:null,error:'PLAYWRIGHT_MISSING',executable:null,exists:false};
const raster=inspectRaster();
const checks={
  node:{required:true,...commandVersion(process.execPath,['--version'])},
  npm:{required:true,...resolveCommand('PHASE66_NPM_PATH',process.platform==='win32'?'npm.cmd':'npm',['--version'])},
  raster:{required:true,...raster},
  ffmpeg:{required:true,...resolveCommand('FFMPEG_PATH','ffmpeg',['-version'])},
  ffprobe:{required:true,...resolveCommand('FFPROBE_PATH','ffprobe',['-version'])},
};
const browserChecks={python,playwright,chromium,ready:python.available&&playwright.available&&chromium.available};
const requiredFiles=[
  'package.json','package-lock.json','packages/world/native-character-morphogenesis-runtime/package.json',
  'packages/world/native-character-morphogenesis-runtime/src/svg-raster-provider.mjs',
  'scripts/build-anime-forge-phase6-6-native-drawing-infrastructure.mjs','scripts/verify-anime-forge-phase6-6-native-drawing-infrastructure.mjs',
  'scripts/build-anime-forge-phase6-6-raster-parity-evidence.mjs','scripts/verify-anime-forge-phase6-6-raster-parity-evidence.mjs',
  'scripts/build-anime-forge-phase6-6-head-surface-evidence.mjs','scripts/build-anime-forge-phase6-6-face-surface-evidence.mjs','scripts/build-anime-forge-phase6-6-hair-surface-evidence.mjs','scripts/build-anime-forge-phase6-6-garment-surface-evidence.mjs','scripts/build-anime-forge-phase6-6-cel-shading-evidence.mjs','scripts/build-anime-forge-phase6-6-mesh-silhouette-evidence.mjs','scripts/build-anime-forge-phase6-6-temporal-stability-evidence.mjs',
  'apps/reality-studio/web/native-drawing-review.html','apps/reality-studio/web/native-drawing-review-model.js','apps/reality-studio/tests/browser_native_drawing_review_test.py',
];
const files=requiredFiles.map(relative=>({path:relative,exists:fs.existsSync(path.join(repoRoot,relative))}));
const nodeModules=fs.existsSync(path.join(repoRoot,'node_modules'));
const failures=[];
for(const [name,check] of Object.entries(checks))if(check.required&&!check.available)failures.push(`TOOL_MISSING:${name}:${check.command??check.error??'unavailable'}`);
for(const file of files)if(!file.exists)failures.push(`FILE_MISSING:${file.path}`);
const evidenceDir=path.resolve(arg('--evidence')??process.env.ANIME_PHASE6_6_EVIDENCE_DIR??path.join(repoRoot,'tmp/anime-forge-phase6-6-local-evidence'));
const report={
  format:'rncs.phase6-6-local-execution-doctor.v0.4',repo_root:repoRoot,platform:process.platform,arch:process.arch,raster_backend:raster.backend,tools:checks,browser_review:browserChecks,files,package_lock_present:files.find(file=>file.path==='package-lock.json')?.exists===true,node_modules_present:nodeModules,evidence_dir:evidenceDir,install_required:!nodeModules||!raster.available,ready:failures.length===0,full_local_validation_ready:failures.length===0&&browserChecks.ready,failures,browser_review_advice:browserChecks.ready?[]:['Install Python Playwright and its Chromium binary, or run the local runner with -Install. Skipping browser review downgrades the result to development-only.'],boundary:'Doctor selects the explicit raster backend. librsvg requires rsvg-convert; Windows resvg-js requires the exact @resvg/resvg-js 2.6.2 pin and does not require rsvg-convert. It validates local execution prerequisites only and does not prove engineering or visual acceptance.'
};
console.log(JSON.stringify(report,null,2));
if(!report.ready)process.exitCode=1;
