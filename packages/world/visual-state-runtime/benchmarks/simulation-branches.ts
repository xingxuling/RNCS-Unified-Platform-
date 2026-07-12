import { readFileSync } from 'node:fs';
import { replaySimulation, type SimulationWorldConfig } from '../packages/simulation-core/src/index.js';
import { simulateBranchSet, type VSRSimulationBranchPlan } from '../packages/simulation-branch/src/index.js';
import { SimulationBranchVSRBridge, createSimulationBranchObserverProfile } from '../packages/simulation-branch-vsr/src/index.js';
import { cryptographicHash } from '../packages/spec/src/index.js';

const config=JSON.parse(readFileSync('examples/simulation-assets/falling-box.world.json','utf8')) as SimulationWorldConfig;
const base=replaySimulation(config,30);
const root=cryptographicHash('benchmark:reality');
const plans:VSRSimulationBranchPlan[]=[
  {format:'vsr.simulation-branch-plan.v0.1',branchId:'baseline',label:'baseline',createdBy:'benchmark',logicalTime:1,baseRealityRoot:root,steps:90,commands:[]},
  {format:'vsr.simulation-branch-plan.v0.1',branchId:'impulse',label:'impulse',createdBy:'benchmark',logicalTime:1,baseRealityRoot:root,steps:90,commands:[{id:'impulse',tick:40,type:'apply-impulse',bodyId:'falling-box',impulse:{x:180000,y:-120000}}]},
  {format:'vsr.simulation-branch-plan.v0.1',branchId:'brake',label:'brake',createdBy:'benchmark',logicalTime:1,baseRealityRoot:root,steps:90,commands:[{id:'brake',tick:50,type:'set-velocity',bodyId:'falling-box',velocity:{x:0,y:0}}]},
];
const percentile=(values:number[],fraction:number)=>values[Math.min(values.length-1,Math.floor(values.length*fraction))]!;
const branchSamples:number[]=[];
let set=simulateBranchSet(base,plans);
for(let round=0;round<60;round++){const started=performance.now();set=simulateBranchSet(base,plans);branchSamples.push(performance.now()-started)}
branchSamples.sort((a,b)=>a-b);
const projectionSamples:number[]=[];
let projectionRoot='';
const observerProfiles=[createSimulationBranchObserverProfile('viewer'),createSimulationBranchObserverProfile('planner'),createSimulationBranchObserverProfile('auditor')];
for(let round=0;round<30;round++){const started=performance.now();const bridge=new SimulationBranchVSRBridge(set,{width:960,height:540});const projected=bridge.render(observerProfiles,['desktop','mobile','xr'],{rasterize:false});projectionRoot=cryptographicHash({document:projected.sourceDocumentHash,views:projected.views.map(view=>view.devices.map(device=>device.manifest.projectedDisplayHash))});projectionSamples.push(performance.now()-started)}
projectionSamples.sort((a,b)=>a-b);
const rasterStarted=performance.now();const rasterBridge=new SimulationBranchVSRBridge(set,{width:960,height:540});const rasterized=rasterBridge.render([createSimulationBranchObserverProfile('planner')],['desktop']);const rasterMs=performance.now()-rasterStarted;const renderRoot=Object.values(rasterized.views[0]!.pngHashByDevice)[0]!;
console.log(JSON.stringify({
  format:'vsr.simulation-branch-benchmark.v0.1',runtime:'vsr@0.1.0-alpha.12',node:process.version,platform:process.platform,
  branchSimulation:{branches:3,stepsPerBranch:90,runs:branchSamples.length,medianMs:percentile(branchSamples,.5),p95Ms:percentile(branchSamples,.95),setRoot:set.setRoot},
  projection:{observers:3,devices:3,runs:projectionSamples.length,medianMs:percentile(projectionSamples,.5),p95Ms:percentile(projectionSamples,.95),projectionRoot},
  raster:{observers:1,devices:1,ms:rasterMs,renderRoot},
},null,2));
