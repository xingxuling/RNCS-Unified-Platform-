import { evaluateAt, prepareDocument, VSRRuntimeSession } from '../packages/core/src/index.js';
import { VSRNullBackend } from '../packages/backend-null/src/index.js';
import type { VSRDocument } from '../packages/spec/src/index.js';

const count=1000;
const dynamicCount=Math.floor(count/10);
const document:VSRDocument={
  specVersion:'0.1',
  metadata:{id:'benchmark-1000',title:'1000 Node Incremental Benchmark',duration:10,defaultFps:60,seed:88},
  canvas:{width:1920,height:1080,background:{type:'solid',color:'#080d16'}},
  nodes:Array.from({length:count},(_,index)=>({
    id:`node-${index}`,
    type:index%5===0?'ellipse':'rect',
    layout:{x:(index%50)*38,y:Math.floor(index/50)*38,width:30,height:30},
    appearance:{fill:{type:'solid',color:index%2?'#2b8cff':'#70e0ff'},opacity:.8},
    tracks:index%10===0?[{id:`track-${index}`,property:'transform.translateY',mode:'expression',expression:`sin(time * ${(index%9)+1}) * 8`}]:undefined
  }))
};

const stats=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return{medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],minMs:sorted[0],maxMs:sorted.at(-1)};};
const prepared=prepareDocument(document),backend=new VSRNullBackend(),full:number[]=[],incremental:number[]=[],renders:number[]=[];const session=new VSRRuntimeSession(document);session.evaluate(0);
let reused=0,resolved=0,projected=0,skippedProjection=0,reusedDisplay=0;
for(let index=0;index<30;index++){
  const time=index/10;let started=performance.now();const fullResult=evaluateAt({document:prepared,time});full.push(performance.now()-started);
  started=performance.now();const incrementalResult=session.evaluate(time);incremental.push(performance.now()-started);reused+=incrementalResult.evaluationStats.reusedResolvedNodeCount;resolved+=incrementalResult.evaluationStats.resolvedNodeCount;projected+=incrementalResult.evaluationStats.projectedNodeCount;skippedProjection+=incrementalResult.evaluationStats.skippedProjectionNodeCount;reusedDisplay+=incrementalResult.evaluationStats.reusedDisplayItemCount;
  started=performance.now();backend.render(fullResult.displayState);renders.push(performance.now()-started);
}
console.log(JSON.stringify({
  runtime:'0.1.0-alpha.5',node:process.version,platform:process.platform,nodes:count,dynamicNodes:dynamicCount,runs:30,
  fullEvaluateAt:stats(full),incrementalSession:stats(incremental),nullBackend:stats(renders),
  incrementalReuse:{averageResolved:resolved/30,averageReused:reused/30,reuseRatio:reused/(reused+resolved),averageProjected:projected/30,averageSkippedProjectionNodes:skippedProjection/30,averageReusedDisplayItems:reusedDisplay/30},
  dependencyGraph:{variablePaths:prepared.dependencyGraph.variableToNodes.size,contextPaths:prepared.dependencyGraph.contextToNodes.size,timeDependentNodes:prepared.dependencyGraph.timeDependentNodes.size,layoutDependentNodes:prepared.dependencyGraph.layoutDependentNodes.size},
  memory:process.memoryUsage()
},null,2));
