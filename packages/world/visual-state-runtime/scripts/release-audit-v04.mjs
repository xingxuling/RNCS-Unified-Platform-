import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const required=[
  'README.md','RELEASE_NOTES.md','STATUS.md','RELEASE_MANIFEST.json','FILE_SHA256SUMS.txt',
  'schemas/vsr-spatial-scene.v0.4.schema.json','schemas/vsr-spatial-frame-plan.v0.4.schema.json',
  'packages/spatial-reality-3d/src/index.ts','packages/spatial-reality-3d-cli/src/cli.ts',
  'docs/NAMING_BOUNDARY_INVERSION_SPATIAL_REALITY_v0.4.md','docs/SPATIAL_REALITY_CONTRACT_v0.4.md',
  'docs/SPATIAL_REALITY_TEST_REPORT_v0.4.md','docs/IAL_VSR_v0.4_三维空间现实执行器_自执行提示词.md',
  'apps/spatial-v04/index.html','apps/spatial-v04/demo.js',
  'evidence/SPATIAL_REALITY_VALIDATION_v0.4.json','evidence/TESTS_v0.4.txt',
  'evidence/E2E_v0.4.txt','evidence/BENCHMARK_SPATIAL_REALITY_v0.4.json',
  'evidence/VSR_v0.4_三维空间现实执行器_验收预览.png',
  'outputs/spatial-reality-v04-verify/reference.png','outputs/spatial-reality-v04-verify/verification.json'
];
const failures=[];
for(const file of required) if(!existsSync(resolve(file))) failures.push(`missing:${file}`);
let validation={};
try{validation=JSON.parse(readFileSync(resolve('evidence/SPATIAL_REALITY_VALIDATION_v0.4.json'),'utf8'));}
catch{failures.push('validation-json');}
if(validation.tests?.total!==153) failures.push('tests-not-153');
if(validation.tests?.legacy!==120) failures.push('legacy-tests-not-120');
if(validation.tests?.spatial!==33) failures.push('spatial-tests-not-33');
if(!validation.verification?.ok) failures.push('spatial-verification');
if(validation.studioControls!==43) failures.push('studio-controls-not-43');
const testText=existsSync(resolve('evidence/TESTS_v0.4.txt'))?readFileSync(resolve('evidence/TESTS_v0.4.txt'),'utf8'):'';
if(!testText.includes('120/120 tests passed')) failures.push('legacy-test-log-missing-pass');
if(!testText.includes('VSR v0.4 spatial reality tests: 33/33 PASS')) failures.push('spatial-test-log-missing-pass');
let verification={};
try{verification=JSON.parse(readFileSync(resolve('outputs/spatial-reality-v04-verify/verification.json'),'utf8'));}
catch{failures.push('verification-json');}
if(verification.ok!==true) failures.push('verification-not-ok');
for(const key of ['frameRoot','pixelRoot']) if(!/^[a-f0-9]{64}$/.test(verification[key]??'')) failures.push(`root:${key}`);
const releaseAuditRoot=createHash('sha256').update(JSON.stringify({required,validation,frameRoot:verification.frameRoot,pixelRoot:verification.pixelRoot})).digest('hex');
console.log(JSON.stringify({ok:failures.length===0,failures,releaseAuditRoot,requiredFiles:required.length,tests:validation.tests,executionBoundary:validation.executionBoundary},null,2));
if(failures.length) process.exitCode=1;
