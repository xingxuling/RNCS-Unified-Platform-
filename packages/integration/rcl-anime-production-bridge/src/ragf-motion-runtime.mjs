import {canonicalCutRef,listProductionCuts,rootHash,seal,validateRagfMotionTrack} from '../../../world/anime-production-runtime/src/index.mjs';

export const RAGF_MOTION_RUNTIME_BINDING_FORMAT='rncs.ragf-motion-runtime-binding-report.v0.1';
export const RAGF_MOTION_RUNTIME_BINDING_VERSION='0.1.0-alpha.1';
export const RAGF_MOTION_RUNTIME_BINDING_OPTIONS=Object.freeze({missing_frame_policy:'hold-last'});

function collectFamilies(input={}){
  const source=input?.asset_families??input?.families??input,entries=[],seen=new Set();
  const visit=(value,name)=>{
    const family=value?.family?.family_root?value.family:value?.family_root?value:null;
    if(family?.family_root){
      if(!seen.has(family.family_root)){seen.add(family.family_root);entries.push({name,family,wrapper:value})}
      return;
    }
    if(value&&typeof value==='object'&&!Array.isArray(value))for(const [key,child] of Object.entries(value))visit(child,`${name}-${key}`);
  };
  if(source&&typeof source==='object')for(const [name,value] of Object.entries(source))visit(value,name);
  return entries;
}

function familyKeys(family){
  return new Set([
    family.family_root,
    family.asset_family_id,
    family.identity?.asset_id,
    family.identity?.character_id,
    family.character_id,
    family.identity?.name,
    family.name,
  ].filter(Boolean).map(String));
}

function matchScore(layer,family){
  const layerFamilyRoot=layer?.family_root??layer?.asset_family_id;
  if(layerFamilyRoot&&family.family_root===layerFamilyRoot)return 0;
  if(layer?.asset_id&&familyKeys(family).has(String(layer.asset_id)))return 1;
  if(layer?.actor_id&&familyKeys(family).has(String(layer.actor_id)))return 2;
  return null;
}

function failure(code,details){
  const error=new Error(details?`${code}:${details}`:code);error.code=code;error.details=details;return error;
}

export function deriveRagfMotionBindingOptions(compiledOrFamilies,{production=compiledOrFamilies?.production??null}={}){
  if(!production)throw failure('RAGF_MOTION_PRODUCTION_REQUIRED');
  const options={};
  for(const cut of listProductionCuts(production)){
    const cutRef=canonicalCutRef(cut),profile=production.motion_profiles?.[cutRef]??production.motion_profile;
    options[cutRef]={...RAGF_MOTION_RUNTIME_BINDING_OPTIONS,director_overrides:structuredClone(profile?.director_overrides??[])};
  }
  return options;
}

function resolveBindings(compiledOrFamilies,{production=compiledOrFamilies?.production??null,strict=true}={}){
  if(!production)throw failure('RAGF_MOTION_PRODUCTION_REQUIRED');
  const families=collectFamilies(compiledOrFamilies),errors=[],motionFamilies=[];
  const bindingOptions=deriveRagfMotionBindingOptions(compiledOrFamilies,{production});
  for(const entry of families){
    if(!entry.family.motion_track)continue;
    const validation=validateRagfMotionTrack(entry.family.motion_track);
    if(!validation.valid){errors.push({code:'RAGF_MOTION_TRACK_INVALID',family_root:entry.family.family_root,name:entry.name,details:validation.errors});continue}
    motionFamilies.push({...entry,validation});
  }
  const bindings=[],tracks={};
  for(const cut of listProductionCuts(production)){
    const candidates=[];
    for(const layer of cut.character_layers??[]){
      for(const entry of motionFamilies){
        const score=matchScore(layer,entry.family);if(score!==null)candidates.push({score,entry,layer});
      }
    }
    if(!candidates.length)continue;
    const bestScore=Math.min(...candidates.map(item=>item.score)),best=candidates.filter(item=>item.score===bestScore),roots=[...new Set(best.map(item=>item.entry.family.motion_track.motion_root))];
    if(roots.length>1){errors.push({code:'RAGF_MOTION_TRACK_AMBIGUOUS',cut_ref:canonicalCutRef(cut),motion_roots:roots});continue}
    const selected=best[0],cutRef=canonicalCutRef(cut),family=selected.entry.family,track=family.motion_track;
    tracks[cutRef]=track;
    const cutOptions=bindingOptions[cutRef]??RAGF_MOTION_RUNTIME_BINDING_OPTIONS;
    bindings.push({cut_ref:cutRef,cut_id:cut.cut_id,actor_id:selected.layer.actor_id??null,match:selected.score===0?'family_root':selected.score===1?'asset_id':'actor_id',family_root:family.family_root,asset_id:family.identity?.asset_id??null,motion_root:track.motion_root,identity_root:track.identity_root,palette_root:track.palette_root,proportion_root:track.proportion_root,appearance_root:track.appearance_root,fps:track.fps,frame_count:track.frame_count,channels:track.tracks.map(item=>item.track_id),continuity:track.continuity,director_override_ids:cutOptions.director_overrides.map(item=>item.override_id??null).filter(Boolean),authority:'episode-derived-runtime',creative_authority:false});
  }
  bindings.sort((a,b)=>a.cut_ref.localeCompare(b.cut_ref));
  const orderedTracks=Object.fromEntries(bindings.map(item=>[item.cut_ref,tracks[item.cut_ref]]));
  const cutRefs=listProductionCuts(production).map(cut=>canonicalCutRef(cut)),boundRefs=new Set(bindings.map(item=>item.cut_ref));
  const report=seal({format:RAGF_MOTION_RUNTIME_BINDING_FORMAT,version:RAGF_MOTION_RUNTIME_BINDING_VERSION,production_root:production.production_root,compiled_root:compiledOrFamilies?.compiled_root??null,authority:'episode-derived-runtime',creative_authority:false,binding_options:RAGF_MOTION_RUNTIME_BINDING_OPTIONS,director_overrides:Object.fromEntries(bindings.map(item=>[item.cut_ref,item.director_override_ids])),cut_count:cutRefs.length,bound_cut_count:bindings.length,coverage:cutRefs.length?bindings.length/cutRefs.length:1,coverage_complete:bindings.length===cutRefs.length,binding_roots:bindings.map(item=>({cut_ref:item.cut_ref,motion_root:item.motion_root,family_root:item.family_root})),bindings,missing_cut_refs:cutRefs.filter(ref=>!boundRefs.has(ref)),errors,status:errors.length?'blocked':'pass',boundary:'RAGF motion is automatically derived from compiled asset families; Episode remains creative authority and commercial physical simulation is not claimed',report_root:''},'report_root');
  if(strict&&errors.length)throw failure('RAGF_MOTION_RUNTIME_BINDING_BLOCKED',rootHash(errors));
  return{tracks:orderedTracks,report,families,bindings};
}

export function deriveRagfMotionTracks(compiledOrFamilies,options={}){return resolveBindings(compiledOrFamilies,options).tracks}
export function buildRagfMotionBindingReport(compiledOrFamilies,options={}){return resolveBindings(compiledOrFamilies,options).report}
