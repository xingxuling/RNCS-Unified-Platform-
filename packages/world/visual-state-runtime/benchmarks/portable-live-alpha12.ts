import { readFileSync } from 'node:fs';
import { VSRRuntimeSession } from '../packages/core/src/index.js';
import type { VSRDocument } from '../packages/spec/src/index.js';
import { createVSRHNACSnapshot, exportVSRHNACBundle, mergeHNACPortableStates, sealHNACPortableState } from '../packages/adapter-hnac-state/src/index.js';
import { RealityStudioLiveVSRSession, type RealityStudioLiveEvent, type RealityStudioProject } from '../packages/adapter-reality-studio/src/index.js';
import { RealityOneVSRGatewayBridge, RealityOneVSRSession, type RealityOneGatewayTransport } from '../packages/adapter-reality-one/src/index.js';

function stats(values:number[]){const sorted=[...values].sort((a,b)=>a-b);return{runs:values.length,medianMs:sorted[Math.floor(sorted.length*.5)]!,p95Ms:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]!,maxMs:sorted.at(-1)!};}
const hello=JSON.parse(readFileSync('examples/hello-title.vsr.json','utf8')) as VSRDocument;
const project=JSON.parse(readFileSync('examples/reality-studio-reality-graph-v04.project.json','utf8')) as RealityStudioProject;

const stateRuntime=new VSRRuntimeSession(hello);const stateSamples:number[]=[];
for(let index=0;index<500;index++){stateRuntime.replaceVariables({counter:index,profile:{mode:index%2?'planner':'viewer'}});const start=performance.now();const snapshot=createVSRHNACSnapshot(hello,stateRuntime,{appId:'vsr-alpha12',replicaId:'benchmark',generation:index});exportVSRHNACBundle(snapshot);stateSamples.push(performance.now()-start);}stateRuntime.dispose();

const live=new RealityStudioLiveVSRSession(project,'studio-live:benchmark');const liveSamples:number[]=[];
for(let index=1;index<=500;index++){const event:RealityStudioLiveEvent={format:'reality-studio.live-event.v0.4',sessionId:'studio-live:benchmark',projectId:project.projectId,sequence:index,type:'blackboard.set',sceneId:'first-leap',payload:{key:'energy',value:index}};const start=performance.now();live.append(event);liveSamples.push(performance.now()-start);}const liveManifest=live.manifest();live.dispose();

const structural=new RealityStudioLiveVSRSession(project,'studio-structural:benchmark');const structuralSamples:number[]=[];
for(let index=1;index<=30;index++){const event:RealityStudioLiveEvent={format:'reality-studio.live-event.v0.4',sessionId:'studio-structural:benchmark',projectId:project.projectId,sequence:index,type:'object.updated',sceneId:'first-leap',payload:{objectUid:'obj-0xnzhd9',set:{x:70+index}}};const start=performance.now();structural.append(event);structuralSamples.push(performance.now()-start);}const structuralManifest=structural.manifest();structural.dispose();

const make=(portable:Record<string,unknown>)=>sealHNACPortableState({format:'hnaf.portable-state.v0.5',app_id:'vsr-alpha12',schema_version:'1.0',partitions:{portable:portable as never,device_private:{},secret:{},cache:{}}});
const base=make({score:1,mode:'base'}),local=make({score:2,mode:'base',local:true}),incoming=make({score:3,mode:'remote',incoming:true}),mergeSamples:number[]=[];
let conflictCount=0;for(let index=0;index<500;index++){const start=performance.now();const result=mergeHNACPortableStates(base,local,incoming);mergeSamples.push(performance.now()-start);conflictCount=result.conflicts.length;}

const gatewaySamples:number[]=[];let gatewayRoot='';
const transport:RealityOneGatewayTransport={async getState(){return{}},async preview(){return{status:'ready',steps:[]}},async execute(){return{status:'committed',receipt:{finalGlobalRoot:'benchmark-global-root'},advanced:{status:'committed',intent:{source:'benchmark'},plan:{steps:[]},authority:{status:'approved'},execution:{stepReceipts:[],executionRoot:'benchmark-exec'},artifact:{identity:{title:'Benchmark'},semantic:{fields:{progress:{value:100},status:{value:'done'},generated_report:{value:'ok'}}}},atomicReceipt:{status:'committed',finalGlobalRoot:'benchmark-global-root'},applicationResultHash:'benchmark-app'}}}};
for(let index=0;index<50;index++){const session=new RealityOneVSRSession();session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:`gateway:benchmark:${index}`,sequence:1,type:'intent.received',payload:{intentText:'benchmark'}});session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:`gateway:benchmark:${index}`,sequence:2,type:'intent.understood',payload:{intentText:'benchmark',steps:[]}});session.append({format:'reality-one.lifecycle-event.v0.1',sessionId:`gateway:benchmark:${index}`,sequence:3,type:'authority.requested',payload:{}});const proposal=session.proposeInteraction({format:'vsr.input-event.v0.1',inputId:`approve:${index}`,nodeId:'authority-approve',trigger:'click',logicalTime:0});const bridge=new RealityOneVSRGatewayBridge(session,transport);const start=performance.now();const receipt=await bridge.submitAuthorityInteraction(proposal,{format:'vsr.interaction-authorization.v0.1',proposalHash:proposal.proposalHash,decision:'approved',authorityId:'benchmark',grantedScopes:['*'],logicalTime:0});gatewaySamples.push(performance.now()-start);gatewayRoot=receipt.receiptRoot;session.dispose();}

console.log(JSON.stringify({format:'vsr.alpha12-benchmark.v0.1',node:process.version,platform:process.platform,hnacSnapshotAndExport:stats(stateSamples),studioBlackboardLiveEvent:stats(liveSamples),studioStructuralLiveEvent:stats(structuralSamples),hnacThreeWayMerge:stats(mergeSamples),gatewayAuthorityRoundTripInMemory:stats(gatewaySamples),evidence:{liveEventChainRoot:liveManifest.eventChainRoot,liveSequence:liveManifest.sequence,structuralProjectRoot:structuralManifest.projectRoot,structuralRebuilds:structuralManifest.rebuildCount,mergeConflicts:conflictCount,gatewayReceiptRoot:gatewayRoot}},null,2));
