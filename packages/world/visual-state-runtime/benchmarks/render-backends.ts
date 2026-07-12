import { renderPng } from '../packages/backend-canvas/src/index.js';
import { compileWebGPUPlan, probeWebGPU } from '../packages/backend-webgpu/src/index.js';
import { evaluateAt, prepareDocument } from '../packages/core/src/index.js';
import { cryptographicHash, type VSRDocument } from '../packages/spec/src/index.js';

const columns=80,rows=45,count=columns*rows;
const document:VSRDocument={specVersion:'0.1',runtimeTarget:'vsr-render-backend-benchmark',metadata:{id:'render-backends',title:'Render Backends',duration:1,defaultFps:60,seed:9},canvas:{width:1280,height:720,background:{type:'solid',color:'#020617'}},nodes:Array.from({length:count},(_,index)=>({id:`cell-${index}`,type:'rect' as const,layout:{x:(index%columns)*16+1,y:Math.floor(index/columns)*16+1,width:14,height:14},appearance:{fill:{type:'solid' as const,color:index%3===0?'#2563eb':index%3===1?'#7c3aed':'#059669'}},content:{cornerRadius:2}}))};
const state=evaluateAt({document:prepareDocument(document),time:0}).displayState;
const samples:number[]=[];let plan=compileWebGPUPlan(state);
for(let i=0;i<100;i++){const started=performance.now();plan=compileWebGPUPlan(state);samples.push(performance.now()-started)}samples.sort((a,b)=>a-b);
const startedRaster=performance.now();const png=renderPng(state);const rasterMs=performance.now()-startedRaster;
const percentile=(fraction:number)=>samples[Math.min(samples.length-1,Math.floor(samples.length*fraction))]!;
console.log(JSON.stringify({format:'vsr.render-backend-benchmark.v0.1',runtime:'vsr@0.1.0-alpha.12',node:process.version,platform:process.platform,scene:{items:state.items.length,width:state.viewport.width,height:state.viewport.height},webgpu:{capability:probeWebGPU(),runs:samples.length,medianCompileMs:percentile(.5),p95CompileMs:percentile(.95),primitives:plan.stats.primitives,vertices:plan.stats.vertices,bytes:plan.stats.bytes,unsupported:plan.stats.unsupported,planHash:plan.planHash},softwareRaster:{ms:rasterMs,pngBytes:png.byteLength,pngHash:cryptographicHash([...png])}},null,2));
