import { writeFileSync, mkdirSync } from 'node:fs';
import { VSRRuntimeSession, evaluateAt } from '../packages/core/src/index.js';
import { createDeviceProfile, projectDisplayForDevice, verifyDeviceProjectionSet } from '../packages/device-projection/src/index.js';
import { VSRInteractionController } from '../packages/interaction-runtime/src/index.js';
import type { VSRDocument } from '../packages/spec/src/index.js';

function percentile(samples:number[], q:number):number { const sorted=[...samples].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))]??0; }

const large:VSRDocument={specVersion:'0.1',metadata:{id:'alpha6-device-benchmark',title:'Alpha 6 Device Benchmark',duration:1,defaultFps:60,seed:6},canvas:{width:1440,height:900},nodes:Array.from({length:1050},(_,index)=>({id:`node-${index}`,type:'rect' as const,layout:{x:(index%50)*28,y:Math.floor(index/50)*28,width:24,height:24},appearance:{fill:{type:'solid' as const,color:'#4488ff'}}}))};
const source=evaluateAt({document:large,time:0}).displayState;
const profiles=[createDeviceProfile('desktop'),createDeviceProfile('mobile'),createDeviceProfile('tablet'),createDeviceProfile('xr')];
const deviceSamples:number[]=[];let finalVerification=true;
for(let run=0;run<120;run++){const start=performance.now();const projections=profiles.map(profile=>projectDisplayForDevice(source,profile,{invariant:{generation:1,realityRoot:'benchmark'}}));deviceSamples.push(performance.now()-start);finalVerification=verifyDeviceProjectionSet(projections).ok;}

const interactive:VSRDocument={specVersion:'0.1',metadata:{id:'alpha6-interaction-benchmark',title:'Alpha 6 Interaction Benchmark',duration:1,defaultFps:60,seed:6},canvas:{width:1200,height:800},variables:{count:0},nodes:[...Array.from({length:500},(_,index)=>({id:`static-${index}`,type:'rect' as const,layout:{x:(index%40)*28,y:Math.floor(index/40)*28,width:24,height:24},appearance:{fill:{type:'solid' as const,color:'#223344'}}})),{id:'button',type:'rect',layout:{x:20,y:720,width:160,height:48},appearance:{fill:{type:'solid',color:'#1768c8'}}},{id:'count',type:'text',layout:{x:200,y:720,width:200,height:48},content:{text:{binding:'vars.count'},fontSize:20}}],interactions:[{id:'increment',nodeId:'button',trigger:'click',action:{type:'setVariable',target:'count',value:{expression:'vars.count + 1'}}}]};
const runtime=new VSRRuntimeSession(interactive);const controller=new VSRInteractionController(interactive,runtime);const interactionSamples:number[]=[];
for(let run=0;run<300;run++){const start=performance.now();const proposal=controller.propose({format:'vsr.input-event.v0.1',inputId:`benchmark-${run}`,trigger:'click',nodeId:'button',logicalTime:0});controller.commit(proposal,{format:'vsr.interaction-authorization.v0.1',proposalHash:proposal.proposalHash,decision:'approved',authorityId:'benchmark-authority',logicalTime:0});interactionSamples.push(performance.now()-start);}
const finalCount=runtime.evaluate(0).state.variables.count;runtime.dispose();
const result={runtime:'vsr@0.1.0-alpha.12',node:process.version,platform:process.platform,deviceProjection:{nodes:1050,devices:4,runs:deviceSamples.length,medianMs:percentile(deviceSamples,.5),p95Ms:percentile(deviceSamples,.95),perDeviceMedianMs:percentile(deviceSamples,.5)/4,verification:finalVerification},interactionCommit:{nodes:502,runs:interactionSamples.length,medianMs:percentile(interactionSamples,.5),p95Ms:percentile(interactionSamples,.95),finalCount}};
mkdirSync('outputs',{recursive:true});writeFileSync('outputs/benchmark-device-interaction-alpha6.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
