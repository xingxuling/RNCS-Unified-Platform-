import {distance3,rootHash,seal} from './canonical.mjs';

const FORMAT='rncs.field-guided-surface-weighting.v0.1';
const round=value=>Number(Number(value).toFixed(8));
const normalize=entries=>{const sum=entries.reduce((total,[,weight])=>total+Number(weight),0)||1;return Object.fromEntries(entries.map(([bone,weight])=>[bone,round(Number(weight)/sum)]));};
const primaryBone=weights=>Object.entries(weights??{}).sort((a,b)=>Number(b[1])-Number(a[1]))[0]?.[0]??null;
const sideOf=bone=>String(bone??'').endsWith('-left')?'left':String(bone??'').endsWith('-right')?'right':null;
const segmentOf=bone=>String(bone??'').replace(/-(left|right)$/,'');
const LEGAL_NEIGHBORS={
  skull:new Set(['skull','neck']),
  neck:new Set(['skull','neck','ribcage']),
  ribcage:new Set(['neck','ribcage','spine','shoulder']),
  spine:new Set(['ribcage','spine','pelvis']),
  pelvis:new Set(['spine','pelvis','hip']),
  shoulder:new Set(['ribcage','shoulder','upper-arm']),
  'upper-arm':new Set(['shoulder','upper-arm','elbow']),
  elbow:new Set(['upper-arm','elbow','forearm']),
  forearm:new Set(['elbow','forearm','hand']),
  hand:new Set(['forearm','hand']),
  hip:new Set(['pelvis','hip','thigh']),
  thigh:new Set(['hip','thigh','knee']),
  knee:new Set(['thigh','knee','shin']),
  shin:new Set(['knee','shin','foot']),
  foot:new Set(['shin','foot'])
};

export function anatomicalWeightCompatibility(primary,candidate){
  if(!primary||!candidate)return false;if(primary===candidate)return true;
  const pSegment=segmentOf(primary),cSegment=segmentOf(candidate),legal=LEGAL_NEIGHBORS[pSegment]??new Set([pSegment]);if(!legal.has(cSegment))return false;
  const pSide=sideOf(primary),cSide=sideOf(candidate);if(pSide&&cSide&&pSide!==cSide)return false;
  if(!pSide&&cSide){if(pSegment==='pelvis'&&cSegment==='hip')return true;if(pSegment==='ribcage'&&cSegment==='shoulder')return true;return false;}
  if(pSide&&!cSide){if(pSegment==='hip'&&cSegment==='pelvis')return true;if(pSegment==='shoulder'&&cSegment==='ribcage')return true;return false;}
  return true;
}

function fieldInfluence(vertex,descriptor,{padding=.025,falloff=2}={}){const extent=Math.max(Number(descriptor?.extent??.01),1e-6),radius=extent+Number(padding),distance=distance3(vertex,descriptor.rest_center??[0,0,0]);if(distance>radius)return 0;const normalized=Math.max(0,1-distance/radius);return Math.pow(normalized,Number(falloff));}

export function applyFieldGuidedSurfaceWeights(mesh,field,{maxInfluences=4,padding=.025,falloff=2,primaryBias=1.35,minWeight=.015}={}){
  if(!mesh?.vertices?.length||!Array.isArray(mesh?.bone_weights)||mesh.bone_weights.length!==mesh.vertices.length)throw Object.assign(new Error('SURFACE_WEIGHTING_MESH_INVALID'),{code:'SURFACE_WEIGHTING_MESH_INVALID'});
  const descriptors=(field?.fields??[]).filter(item=>item?.attached_bone&&Array.isArray(item?.rest_center)&&item.rest_center.length===3),boneWeights=[],sourcePrimaryBones=[],multiInfluenceVertices=0,maxObservedInfluences=0;let rejectedIncompatibleInfluences=0,verticesWithRejectedInfluences=0;
  for(let index=0;index<mesh.vertices.length;index+=1){const vertex=mesh.vertices[index],original=mesh.bone_weights[index]??{},primary=primaryBone(original),scores=new Map();sourcePrimaryBones.push(primary);if(primary)scores.set(primary,Number(primaryBias));let rejectedHere=0;
    for(const descriptor of descriptors){const influence=fieldInfluence(vertex,descriptor,{padding,falloff});if(influence<=0)continue;if(primary&&!anatomicalWeightCompatibility(primary,descriptor.attached_bone)){rejectedIncompatibleInfluences+=1;rejectedHere+=1;continue;}const prior=scores.get(descriptor.attached_bone)??0;scores.set(descriptor.attached_bone,Math.max(prior,influence));}
    if(rejectedHere)verticesWithRejectedInfluences+=1;
    let entries=[...scores.entries()].filter(([,weight])=>Number(weight)>0).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,Math.max(1,Number(maxInfluences)));if(primary&&!entries.some(([bone])=>bone===primary)){entries=entries.slice(0,Math.max(0,Number(maxInfluences)-1));entries.unshift([primary,Number(primaryBias)]);}let normalized=normalize(entries),filtered=Object.entries(normalized).filter(([,weight])=>Number(weight)>=Number(minWeight));if(!filtered.length&&primary)filtered=[[primary,1]];normalized=normalize(filtered);const count=Object.keys(normalized).length;if(count>1)multiInfluenceVertices+=1;maxObservedInfluences=Math.max(maxObservedInfluences,count);boneWeights.push(normalized);}
  const weighting={format:FORMAT,version:'0.2.0-alpha.1',field_root:field?.field_root??null,source_mesh_root:mesh.mesh_root,policy:{max_influences:Number(maxInfluences),padding:Number(padding),falloff:Number(falloff),primary_bias:Number(primaryBias),min_weight:Number(minWeight),compatibility:'hierarchical-anatomical-chain-v0.1',cross_side_limb_influence:'forbidden',central_trunk_bilateral_transition:['pelvis→hip-left/right','ribcage→shoulder-left/right']},vertex_count:mesh.vertices.length,multi_influence_vertices:multiInfluenceVertices,multi_influence_ratio:round(multiInfluenceVertices/Math.max(1,mesh.vertices.length)),max_observed_influences:maxObservedInfluences,rejected_incompatible_influences:rejectedIncompatibleInfluences,vertices_with_rejected_influences:verticesWithRejectedInfluences,weighting_root:''};weighting.weighting_root=rootHash({...weighting,weighting_root:''});const weighted=seal({...mesh,version:'0.3.0-alpha.1',source_mesh_root:mesh.mesh_root,source_primary_bones:sourcePrimaryBones,bone_weights:boneWeights,surface_weighting:weighting,surface_weighting_root:weighting.weighting_root,mesh_root:''},'mesh_root');return weighted;
}

export function validateFieldGuidedSurfaceWeights(mesh,{requireMultiInfluence=false,requireCompatibilityEvidence=false}={}){const errors=[],weights=mesh?.bone_weights??[],sourcePrimaryBones=mesh?.source_primary_bones??[];if(mesh?.surface_weighting?.format!==FORMAT)errors.push('SURFACE_WEIGHTING_RECEIPT_MISSING');if(weights.length!==(mesh?.vertices?.length??0))errors.push('SURFACE_WEIGHTING_CARDINALITY_INVALID');if(sourcePrimaryBones.length!==weights.length)errors.push('SURFACE_WEIGHTING_PRIMARY_BONE_CARDINALITY_INVALID');for(let index=0;index<weights.length;index+=1){const entries=Object.entries(weights[index]??{}),sum=entries.reduce((total,[,weight])=>total+Number(weight),0),primary=sourcePrimaryBones[index];if(!entries.length||entries.length>Number(mesh?.surface_weighting?.policy?.max_influences??4)||entries.some(([,weight])=>!Number.isFinite(Number(weight))||Number(weight)<0||Number(weight)>1)||Math.abs(sum-1)>1e-6)errors.push(`SURFACE_WEIGHTING_INVALID:${index}`);if(primary&&entries.some(([bone])=>!anatomicalWeightCompatibility(primary,bone)))errors.push(`SURFACE_WEIGHTING_CROSS_CHAIN_INVALID:${index}:${primary}`);}if(requireMultiInfluence&&Number(mesh?.surface_weighting?.multi_influence_vertices??0)<=0)errors.push('SURFACE_WEIGHTING_NO_MULTI_INFLUENCE_VERTICES');if(requireCompatibilityEvidence&&(mesh?.surface_weighting?.policy?.compatibility!=='hierarchical-anatomical-chain-v0.1'||!Number.isFinite(Number(mesh?.surface_weighting?.rejected_incompatible_influences))))errors.push('SURFACE_WEIGHTING_COMPATIBILITY_EVIDENCE_MISSING');return{valid:errors.length===0,errors,mesh_root:mesh?.mesh_root??null,weighting_root:mesh?.surface_weighting_root??null,multi_influence_vertices:mesh?.surface_weighting?.multi_influence_vertices??0,multi_influence_ratio:mesh?.surface_weighting?.multi_influence_ratio??0,max_observed_influences:mesh?.surface_weighting?.max_observed_influences??0,rejected_incompatible_influences:mesh?.surface_weighting?.rejected_incompatible_influences??0,vertices_with_rejected_influences:mesh?.surface_weighting?.vertices_with_rejected_influences??0};}
