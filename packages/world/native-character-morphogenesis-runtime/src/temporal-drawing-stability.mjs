import {rootHash,seal} from './canonical.mjs';

const FORMAT='rncs.temporal-drawing-stability.v0.1';
const DEFAULT_CORE_IDS=['head','garment-body','neck','hair-crown','hair-fringe','collar-left','collar-right','center-seam'];
const numberPattern=/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;
const commandPattern=/[MLCZmlcz]/g;
const finite=value=>Number.isFinite(Number(value));
const mean=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
const percentile=(values,p)=>{if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b),index=Math.min(sorted.length-1,Math.max(0,Math.ceil(sorted.length*p)-1));return sorted[index];};

function geometry(op){
  if(!op)return null;
  if(op.kind==='path'){const values=(String(op.d??'').match(numberPattern)??[]).map(Number),commands=(String(op.d??'').match(commandPattern)??[]).join('').toUpperCase();return{kind:'path',topology:`path:${commands}:${values.length}`,values};}
  if(op.kind==='line')return{kind:'line',topology:'line:4',values:[...(op.a??[]),...(op.b??[])].map(Number)};
  if(op.kind==='ellipse')return{kind:'ellipse',topology:'ellipse:4',values:[op.cx,op.cy,op.rx,op.ry].map(Number)};
  return{kind:String(op.kind??'unknown'),topology:`${op.kind??'unknown'}:0`,values:[]};
}
function normalizedDistance(a,b,width,height){if(!a||!b||a.topology!==b.topology||a.values.length!==b.values.length)return null;if(a.values.some(v=>!finite(v))||b.values.some(v=>!finite(v)))return NaN;const diag=Math.max(1,Math.hypot(Number(width??1),Number(height??1))),sum=a.values.reduce((total,value,index)=>total+(Number(value)-Number(b.values[index]))**2,0),rms=Math.sqrt(sum/Math.max(1,a.values.length));return rms/diag;}
function symmetricDifference(a,b){const out=[];for(const value of a)if(!b.has(value))out.push(value);for(const value of b)if(!a.has(value))out.push(value);return out;}
function isCel(id){return String(id).startsWith('cel-shadow-')||String(id).startsWith('cel-highlight-');}

function comparePair(previous,current,{coreIds,width,height}={}){
  const a=new Map((previous.ir?.operations??[]).map(op=>[op.id,op])),b=new Map((current.ir?.operations??[]).map(op=>[op.id,op])),idsA=new Set(a.keys()),idsB=new Set(b.keys()),births=[...idsB].filter(id=>!idsA.has(id)),deaths=[...idsA].filter(id=>!idsB.has(id)),coreMissing=[],coreTopologyChanges=[],coreDisplacements=[],nonFinite=[];
  for(const id of coreIds){const left=a.get(id),right=b.get(id);if(!left||!right){coreMissing.push(id);continue;}const ga=geometry(left),gb=geometry(right);if(ga.topology!==gb.topology){coreTopologyChanges.push(id);continue;}const distance=normalizedDistance(ga,gb,width,height);if(Number.isNaN(distance)){nonFinite.push(id);continue;}if(distance!==null)coreDisplacements.push({id,value:distance});}
  const occludedA=new Set(previous.ir?.mesh_silhouette_occluded_groups??[]),occludedB=new Set(current.ir?.mesh_silhouette_occluded_groups??[]),visibilityTransitions=symmetricDifference(occludedA,occludedB),union=new Set([...idsA,...idsB]),celBirths=births.filter(isCel),celDeaths=deaths.filter(isCel);
  return{from_frame:previous.frame_number,to_frame:current.frame_number,cut_id:current.cut_id,birth_count:births.length,death_count:deaths.length,operation_churn_ratio:(births.length+deaths.length)/Math.max(1,union.size),cel_birth_count:celBirths.length,cel_death_count:celDeaths.length,core_missing_ids:coreMissing,core_topology_change_ids:coreTopologyChanges,non_finite_core_ids:nonFinite,core_displacements:coreDisplacements,max_core_displacement:Math.max(0,...coreDisplacements.map(item=>item.value)),visibility_state_transition_groups:visibilityTransitions,pair_root:rootHash({from_frame:previous.frame_number,to_frame:current.frame_number,cut_id:current.cut_id,births,deaths,coreMissing,coreTopologyChanges,nonFinite,coreDisplacements,visibilityTransitions})};
}

export function analyzeTemporalDrawingStability(sequence,{coreIds=DEFAULT_CORE_IDS,maxCoreDisplacement=.14,maxMeanOperationChurn=.40}={}){
  if(!Array.isArray(sequence)||sequence.length<2)throw Object.assign(new Error('TEMPORAL_DRAWING_SEQUENCE_TOO_SHORT'),{code:'TEMPORAL_DRAWING_SEQUENCE_TOO_SHORT'});
  const ordered=[...sequence].sort((a,b)=>Number(a.frame_number)-Number(b.frame_number)),width=ordered[0]?.ir?.width??1,height=ordered[0]?.ir?.height??1,pairs=[];
  for(let index=1;index<ordered.length;index++){const previous=ordered[index-1],current=ordered[index];if(previous.cut_id!==current.cut_id)continue;pairs.push(comparePair(previous,current,{coreIds,width,height}));}
  const displacements=pairs.flatMap(pair=>pair.core_displacements.map(item=>item.value)),coreMissingCount=pairs.reduce((sum,pair)=>sum+pair.core_missing_ids.length,0),coreTopologyChangeCount=pairs.reduce((sum,pair)=>sum+pair.core_topology_change_ids.length,0),nonFiniteGeometryCount=pairs.reduce((sum,pair)=>sum+pair.non_finite_core_ids.length,0),visibilityTransitionCount=pairs.reduce((sum,pair)=>sum+pair.visibility_state_transition_groups.length,0),celChurnCount=pairs.reduce((sum,pair)=>sum+pair.cel_birth_count+pair.cel_death_count,0),meanChurn=mean(pairs.map(pair=>pair.operation_churn_ratio)),maxDisplacement=Math.max(0,...displacements),summary={frame_count:ordered.length,adjacent_same_cut_pair_count:pairs.length,core_operation_ids:[...coreIds],core_missing_count:coreMissingCount,core_topology_change_count:coreTopologyChangeCount,non_finite_geometry_count:nonFiniteGeometryCount,max_core_normalized_displacement:maxDisplacement,p95_core_normalized_displacement:percentile(displacements,.95),mean_operation_churn_ratio:meanChurn,p95_operation_churn_ratio:percentile(pairs.map(pair=>pair.operation_churn_ratio),.95),cel_path_churn_count:celChurnCount,body_visibility_state_transition_count:visibilityTransitionCount,thresholds:{max_core_normalized_displacement:Number(maxCoreDisplacement),max_mean_operation_churn_ratio:Number(maxMeanOperationChurn)}};
  const failures=[];if(!pairs.length)failures.push('TEMPORAL_DRAWING_NO_SAME_CUT_PAIRS');if(coreMissingCount)failures.push('TEMPORAL_DRAWING_CORE_OPERATION_MISSING');if(coreTopologyChangeCount)failures.push('TEMPORAL_DRAWING_CORE_TOPOLOGY_CHANGED');if(nonFiniteGeometryCount)failures.push('TEMPORAL_DRAWING_NON_FINITE_GEOMETRY');if(maxDisplacement>Number(maxCoreDisplacement))failures.push('TEMPORAL_DRAWING_CORE_TELEPORT');if(meanChurn>Number(maxMeanOperationChurn))failures.push('TEMPORAL_DRAWING_OPERATION_CHURN_HIGH');
  const base={format:FORMAT,version:'0.1.0-alpha.1',measurement_space:'final-anime-drawing-ir-normalized-by-canvas-diagonal',cut_boundary_policy:'do-not-compare-across-cuts',cel_churn_policy:'measure-not-artificially-suppress',visibility_transition_policy:'measure-canonical-occlusion-state-transitions',summary,pairs,failures,passed:failures.length===0,temporal_root:''};return seal(base,'temporal_root');
}

export function validateTemporalDrawingStability(report,{requirePass=true}={}){const errors=[];if(report?.format!==FORMAT)errors.push('TEMPORAL_DRAWING_FORMAT_INVALID');if(!report?.temporal_root||!report?.summary)errors.push('TEMPORAL_DRAWING_ROOT_CHAIN_MISSING');if(!Number.isFinite(Number(report?.summary?.max_core_normalized_displacement))||!Number.isFinite(Number(report?.summary?.mean_operation_churn_ratio)))errors.push('TEMPORAL_DRAWING_MEASUREMENTS_INVALID');if(requirePass&&report?.passed!==true)errors.push(...(report?.failures??['TEMPORAL_DRAWING_FAILED']));return{valid:errors.length===0,errors,temporal_root:report?.temporal_root??null,summary:report?.summary??null};}

export const DEFAULT_TEMPORAL_CORE_OPERATION_IDS=Object.freeze([...DEFAULT_CORE_IDS]);
