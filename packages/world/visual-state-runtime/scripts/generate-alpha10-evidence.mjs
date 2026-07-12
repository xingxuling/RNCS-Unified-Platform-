import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { compileRealityStudioVSRBridge } from '../dist/packages/adapter-reality-studio/src/index.js';
import { evaluateAt } from '../dist/packages/core/src/index.js';
import { renderPng } from '../dist/packages/backend-canvas/src/index.js';
import { cryptographicHash } from '../dist/packages/spec/src/index.js';

mkdirSync('evidence',{recursive:true});mkdirSync('outputs/alpha10-rendering',{recursive:true});
const benchmark=spawnSync(process.execPath,['dist/benchmarks/hybrid-resources.js'],{encoding:'utf8'});if(benchmark.status!==0)throw new Error(benchmark.stderr||benchmark.stdout);const benchmarkJson=JSON.parse(benchmark.stdout);writeFileSync('evidence/ALPHA10_HYBRID_BENCHMARK.json',JSON.stringify(benchmarkJson,null,2));
const project=JSON.parse(readFileSync('examples/reality-studio-first-leap.project.json','utf8')),bridge=compileRealityStudioVSRBridge(project,{includeHud:false}),state=evaluateAt({document:bridge.document,time:0}).displayState,png=renderPng(state);writeFileSync('outputs/alpha10-rendering/reality-studio-vsr.png',png);writeFileSync('outputs/alpha10-rendering/reality-studio-scene.vsr.json',JSON.stringify(bridge.document,null,2));writeFileSync('outputs/alpha10-rendering/reality-studio-hybrid-plan.json',JSON.stringify(bridge.hybridPlan,(_key,value)=>value instanceof Uint8Array||value instanceof Float32Array?Array.from(value):value,2));
const cli={projectRealityStudio:true,hybridPlan:true,schemas:['hybrid-plan','reality-studio-bridge']};const evidence={format:'vsr.alpha10.evidence.v0.1',runtime:'vsr@0.1.0-alpha.10',node:process.version,platform:process.platform,benchmark:benchmarkJson,realityStudio:{projectRoot:bridge.projectRoot,documentRoot:bridge.documentRoot,bridgeRoot:bridge.bridgeRoot,sourceDisplayHash:bridge.sourceDisplayHash,verification:bridge.verification,hybridStats:bridge.hybridPlan.stats,pngHash:cryptographicHash([...png])},cli};writeFileSync('evidence/ALPHA10_INTEGRATION.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify({ok:true,evidence,outputs:['evidence/ALPHA10_HYBRID_BENCHMARK.json','evidence/ALPHA10_INTEGRATION.json','outputs/alpha10-rendering/reality-studio-vsr.png']},null,2));
