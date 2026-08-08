#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repoRoot=path.resolve(here,'..');
const arg=name=>{const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:null;};
const commandVersion=(command,args=['--version'])=>{const result=spawnSync(command,args,{encoding:'utf8'});return{command,available:!result.error&&result.status===0,status:result.status,error:result.error?.code??null,version:String(result.stdout||result.stderr||'').trim().split(/\r?\n/)[0]||null};};
const resolveCommand=(envName,fallback,args=['--version'])=>{const command=process.env[envName]||fallback;return{env:envName,...commandVersion(command,args)};};
const checks={
  node:{required:true,...commandVersion(process.execPath,['--version'])},
  npm:{required:true,...resolveCommand('PHASE66_NPM_PATH',process.platform==='win32'?'npm.cmd':'npm',['--version'])},
  rsvg:{required:true,...resolveCommand('RSVG_CONVERT_PATH','rsvg-convert',['--version'])},
  ffmpeg:{required:true,...resolveCommand('FFMPEG_PATH','ffmpeg',['-version'])},
  ffprobe:{required:true,...resolveCommand('FFPROBE_PATH','ffprobe',['-version'])},
};
const requiredFiles=[
  'package.json',
  'packages/world/native-character-morphogenesis-runtime/package.json',
  'scripts/build-anime-forge-phase6-6-native-drawing-infrastructure.mjs',
  'scripts/verify-anime-forge-phase6-6-native-drawing-infrastructure.mjs',
  'scripts/build-anime-forge-phase6-6-head-surface-evidence.mjs',
  'scripts/build-anime-forge-phase6-6-face-surface-evidence.mjs',
  'scripts/build-anime-forge-phase6-6-hair-surface-evidence.mjs',
  'scripts/build-anime-forge-phase6-6-garment-surface-evidence.mjs',
  'scripts/build-anime-forge-phase6-6-cel-shading-evidence.mjs',
  'scripts/build-anime-forge-phase6-6-mesh-silhouette-evidence.mjs',
  'scripts/build-anime-forge-phase6-6-temporal-stability-evidence.mjs',
  'apps/reality-studio/web/native-drawing-review.html',
  'apps/reality-studio/web/native-drawing-review-model.js',
];
const files=requiredFiles.map(relative=>({path:relative,exists:fs.existsSync(path.join(repoRoot,relative))}));
const packageLock=fs.existsSync(path.join(repoRoot,'package-lock.json'));
const nodeModules=fs.existsSync(path.join(repoRoot,'node_modules'));
const failures=[];
for(const [name,check] of Object.entries(checks))if(check.required&&!check.available)failures.push(`TOOL_MISSING:${name}:${check.command}`);
for(const file of files)if(!file.exists)failures.push(`FILE_MISSING:${file.path}`);
if(!packageLock)failures.push('PACKAGE_LOCK_MISSING');
const evidenceDir=path.resolve(arg('--evidence')??process.env.ANIME_PHASE6_6_EVIDENCE_DIR??path.join(repoRoot,'tmp/anime-forge-phase6-6-local-evidence'));
const report={
  format:'rncs.phase6-6-local-execution-doctor.v0.1',
  repo_root:repoRoot,
  platform:process.platform,
  arch:process.arch,
  tools:checks,
  files,
  package_lock_present:packageLock,
  node_modules_present:nodeModules,
  evidence_dir:evidenceDir,
  install_required:!nodeModules,
  ready:failures.length===0,
  failures,
  boundary:'Doctor validates local execution prerequisites only. It does not prove Phase 6.6 engineering or visual acceptance.'
};
console.log(JSON.stringify(report,null,2));
if(!report.ready)process.exitCode=1;
