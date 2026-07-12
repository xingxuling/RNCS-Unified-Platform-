import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { VSRRuntimeSession } from '../packages/core/src/index.js';
import { sealInteractionAuthorization, VSRInteractionController } from '../packages/interaction-runtime/src/index.js';
import { VSRSharedRealityCoordinator, VSRSharedRealityReplica } from '../packages/shared-coordination/src/index.js';
import { cryptographicHash, documentHash, type VSRDocument } from '../packages/spec/src/index.js';

const runs=500;
const document:VSRDocument={specVersion:'0.1',metadata:{id:'shared-benchmark',title:'Shared Benchmark',duration:60,defaultFps:60,seed:71},canvas:{width:320,height:180},variables:{count:0},nodes:[{id:'counter',type:'rect',layout:{x:20,y:20,width:100,height:50},appearance:{fill:{type:'solid',color:'#4488ff'}}}],interactions:[{id:'increment',nodeId:'counter',trigger:'click',action:{type:'setVariable',target:'count',value:{expression:'vars.count + 1'}}}]};
const runtime=new VSRRuntimeSession(document);const controller=new VSRInteractionController(document,runtime);const coordinator=new VSRSharedRealityCoordinator({sessionId:'benchmark:shared',documentHash:documentHash(document),initialVariables:document.variables});
const samples:number[]=[];
for(let index=0;index<runs;index++){
  const input={format:'vsr.input-event.v0.1' as const,inputId:`bench-${index}`,trigger:'click' as const,nodeId:'counter',logicalTime:index/60,observerId:'observer:bench',deviceId:'device:bench'};
  const proposal=controller.propose(input,{eventChainRoot:coordinator.cursor().eventRoot});
  const authorization=sealInteractionAuthorization({format:'vsr.interaction-authorization.v0.1',proposalHash:proposal.proposalHash,decision:'approved',authorityId:'authority:bench',logicalTime:input.logicalTime,evidenceRoot:cryptographicHash({index})});
  const local=controller.commit(proposal,authorization);
  const cursor=coordinator.cursor();const started=performance.now();const result=coordinator.submit({format:'vsr.shared-interaction-candidate.v0.1',candidateId:`candidate:${index}`,sessionId:'benchmark:shared',replicaId:'replica:primary',baseSequence:cursor.sequence,baseEventRoot:cursor.eventRoot,logicalTime:input.logicalTime,proposal,authorization,receipt:local.receipt});samples.push(performance.now()-started);if(!result.ok)throw new Error(`Commit ${index} rejected: ${result.code}`);
}
runtime.dispose();samples.sort((a,b)=>a-b);
const replicas=Array.from({length:4},(_,index)=>new VSRSharedRealityReplica({replicaId:`replica:${index}`,sessionId:'benchmark:shared',documentHash:documentHash(document),initialVariables:document.variables}));
const syncStarted=performance.now();for(const replica of replicas)replica.applyBatch(coordinator.eventsAfter(replica.cursor()));const syncDurationMs=performance.now()-syncStarted;
const result={format:'vsr.shared-coordination-benchmark.v0.1',runtime:'vsr@0.1.0-alpha.12',runs,medianCommitMs:samples[Math.floor(samples.length*.5)],p95CommitMs:samples[Math.floor(samples.length*.95)],maxCommitMs:samples.at(-1),events:coordinator.cursor().sequence,eventRoot:coordinator.cursor().eventRoot,finalStateHash:coordinator.snapshot().stateHash,finalCount:coordinator.snapshot().variables.count,replicas:replicas.length,fullReplayTotalMs:syncDurationMs,perReplicaReplayMs:syncDurationMs/replicas.length,replicaAgreement:replicas.every(replica=>replica.cursor().eventRoot===coordinator.cursor().eventRoot&&replica.state().count===runs)};
mkdirSync('outputs',{recursive:true});writeFileSync(resolve('outputs/benchmark-shared-coordination.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
