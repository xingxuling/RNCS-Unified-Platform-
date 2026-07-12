import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { RealityOneVSRSession, realityOneResultToLifecycleEvents } from '../packages/adapter-reality-one/src/index.js';

const input=JSON.parse(readFileSync('examples/reality-one-application-result.json','utf8')) as unknown;
const events=realityOneResultToLifecycleEvents(input,'benchmark:reality-one-live');
const rounds=100;
const durations:number[]=[];let resolved=0,reused=0,projected=0,skipped=0,items=0;let templateHash='';
const stats=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return{medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],minMs:sorted[0],maxMs:sorted.at(-1)};};
for(let round=0;round<rounds;round++){
  const session=new RealityOneVSRSession({profile:'desktop'});templateHash=session.evaluate().displayState.documentHash;
  for(const event of events){session.append(event);const started=performance.now();const result=session.evaluate();durations.push(performance.now()-started);resolved+=result.evaluationStats.resolvedNodeCount;reused+=result.evaluationStats.reusedResolvedNodeCount;projected+=result.evaluationStats.projectedNodeCount;skipped+=result.evaluationStats.skippedProjectionNodeCount;items+=result.displayState.items.length;}
  session.dispose();
}
const a=new RealityOneVSRSession({profile:'desktop'}).replay(events);const b=new RealityOneVSRSession({profile:'desktop'}).replay(events);
const samples=rounds*events.length;
const report={
  runtime:'0.1.0-alpha.12',node:process.version,platform:process.platform,rounds,eventsPerRound:events.length,samples,templateDocumentHash:templateHash,
  eventEvaluate:stats(durations),average:{resolvedNodes:resolved/samples,reusedNodes:reused/samples,projectedNodes:projected/samples,skippedProjectionNodes:skipped/samples,visibleItems:items/samples},
  deterministicReplay:{eventChainRoot:a.eventChainRoot===b.eventChainRoot,finalStateHash:a.finalStateHash===b.finalStateHash,finalDisplayHash:a.finalDisplayHash===b.finalDisplayHash},
  memory:process.memoryUsage()
};
mkdirSync('outputs',{recursive:true});writeFileSync('outputs/benchmark-reality-one-live-alpha6.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
