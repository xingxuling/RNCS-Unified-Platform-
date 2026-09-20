import {sampleMotion} from './motion.mjs';
import {buildPose} from './skeleton.mjs';
import {evaluatePose} from './constraints.mjs';
export function evaluateMotion(motion,{samples=60,profile={}}={}){
  const frames=[],failures=[]; for(let i=0;i<=samples;i++){const t=i/samples,control=sampleMotion(motion,t),pose=buildPose(control),evaluation=evaluatePose({control,pose,final:i===samples,profile}); const row={t,control,pose,evaluation};frames.push(row);if(!evaluation.ok)failures.push(row)}
  return {ok:failures.length===0,samples:samples+1,frames,failures,summary:summarize(frames)};
}
function summarize(frames){
  let minMargin=Infinity,maxTrunk=0; const failed=new Set(); for(const f of frames){minMargin=Math.min(minMargin,f.evaluation.support.margin);maxTrunk=Math.max(maxTrunk,f.evaluation.trunkTiltDeg);for(const c of f.evaluation.checks)if(!c.ok)failed.add(c.id)}
  return {minSupportMargin:minMargin,maxTrunkTiltDeg:maxTrunk,failedChecks:[...failed]};
}
