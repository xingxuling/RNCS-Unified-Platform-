import {clone,rootHash,seal,verifySeal} from './canonical.mjs';

export const RAGF_MOTION_TRACK_FORMAT='ragf.anime-motion-track.v0.1';
export const RAGF_MOTION_TRACK_VERSION='0.1.0';
export const RAGF_MOTION_XSHEET_BINDING_FORMAT='rncs.ragf-motion-xsheet-binding.v0.1';
export const RAGF_MOTION_XSHEET_BINDING_VERSION='0.1.0-alpha.1';

const layers=['hair','coat','breathing','foreground'];
const requiredTracks=new Set(['secondary-motion.hair','secondary-motion.coat','secondary-motion.breathing','facial.blink']);
const limits={hair:[-12,12],coat:[-12,12],breathing:[-6,6],foreground:[-12,12]};
const numeric=value=>Number.isFinite(Number(value));
const clamp=(value,[min,max])=>Math.max(min,Math.min(max,Number(value)||0));

function failure(code,detail){const error=new Error(detail?`${code}:${detail}`:code);error.code=code;return error}
function assert(condition,code,detail){if(!condition)throw failure(code,detail)}

function validateXSheetInput(sheet){
  const errors=[];
  if(sheet?.format!=='rncs.anime-exposure-sheet.v0.1')errors.push('RAGF_XSHEET_FORMAT_INVALID');
  if(!verifySeal(sheet,'xsheet_root'))errors.push('RAGF_XSHEET_ROOT_INVALID');
  const frames=Array.isArray(sheet?.frames)?sheet.frames:[];
  if(sheet?.frame_count!==frames.length)errors.push('RAGF_XSHEET_FRAME_COUNT_INVALID');
  if(!(Number(sheet?.fps)>0))errors.push('RAGF_XSHEET_FPS_INVALID');
  for(const [index,frame] of frames.entries()){
    if(frame?.frame_number!==index)errors.push(`RAGF_XSHEET_FRAME_ORDER:${index}`);
    if(!frame?.drawing_id)errors.push(`RAGF_XSHEET_DRAWING_MISSING:${index}`);
    if(frame?.animation_policy?.interpolation!=='stepped')errors.push(`RAGF_XSHEET_INTERPOLATION_INVALID:${index}`);
  }
  return{valid:errors.length===0,errors,frames};
}

export function validateRagfMotionTrack(track){
  const errors=[];
  if(track?.format!==RAGF_MOTION_TRACK_FORMAT)errors.push('RAGF_MOTION_TRACK_FORMAT_INVALID');
  if(track?.version!==RAGF_MOTION_TRACK_VERSION)errors.push('RAGF_MOTION_TRACK_VERSION_INVALID');
  if(track?.deterministic!==true)errors.push('RAGF_MOTION_TRACK_NOT_DETERMINISTIC');
  if(!verifySeal(track,'motion_root'))errors.push('RAGF_MOTION_TRACK_ROOT_INVALID');
  if(!(Number(track?.fps)>0))errors.push('RAGF_MOTION_TRACK_FPS_INVALID');
  const frames=Array.isArray(track?.frames)?track.frames:[];
  if(frames.length<2||track?.frame_count!==frames.length)errors.push('RAGF_MOTION_TRACK_FRAME_COUNT_INVALID');
  const trackIds=new Set((Array.isArray(track?.tracks)?track.tracks:[]).map(item=>item?.track_id));
  for(const required of requiredTracks)if(!trackIds.has(required))errors.push(`RAGF_MOTION_TRACK_CHANNEL_MISSING:${required}`);
  for(const field of ['identity_root','palette_root','proportion_root','appearance_root'])if(!track?.[field])errors.push(`RAGF_MOTION_TRACK_CONTINUITY_ROOT_MISSING:${field}`);
  for(const [index,frame] of frames.entries()){
    if(frame?.frame_number!==index)errors.push(`RAGF_MOTION_TRACK_FRAME_ORDER:${index}`);
    if(!frame?.motion_state_root)errors.push(`RAGF_MOTION_TRACK_STATE_ROOT_MISSING:${index}`);
    if(!['open','blink','closed'].includes(frame?.eye_state))errors.push(`RAGF_MOTION_TRACK_EYE_STATE_INVALID:${index}`);
    const motion=frame?.secondary_motion;
    if(!motion||motion.frame!==index)errors.push(`RAGF_MOTION_TRACK_SECONDARY_FRAME_INVALID:${index}`);
    for(const layer of layers)if(!numeric(motion?.[layer]))errors.push(`RAGF_MOTION_TRACK_SECONDARY_VALUE_INVALID:${layer}:${index}`);
    if(frame?.motion_state_root&&rootHash({frame:index,eye_state:frame.eye_state,secondary_motion:motion})!==frame.motion_state_root)errors.push(`RAGF_MOTION_TRACK_STATE_ROOT_INVALID:${index}`);
  }
  return{valid:errors.length===0,errors,motion_root:track?.motion_root??null,frame_count:frames.length,fps:Number(track?.fps)||null};
}

export function validateRagfMotionBinding(binding){
  const errors=[];
  if(binding?.format!==RAGF_MOTION_XSHEET_BINDING_FORMAT)errors.push('RAGF_MOTION_BINDING_FORMAT_INVALID');
  if(binding?.version!==RAGF_MOTION_XSHEET_BINDING_VERSION)errors.push('RAGF_MOTION_BINDING_VERSION_INVALID');
  if(!verifySeal(binding,'binding_root'))errors.push('RAGF_MOTION_BINDING_ROOT_INVALID');
  if(!binding?.original_xsheet_root||!binding?.bound_xsheet_root||!binding?.motion_root)errors.push('RAGF_MOTION_BINDING_ROOTS_MISSING');
  const map=Array.isArray(binding?.frame_map)?binding.frame_map:[];
  if(binding?.frame_count!==map.length)errors.push('RAGF_MOTION_BINDING_FRAME_COUNT_INVALID');
  for(const [index,item] of map.entries()){
    if(item?.target_frame!==index)errors.push(`RAGF_MOTION_BINDING_TARGET_ORDER:${index}`);
    if(!numeric(item?.source_frame)||item.source_frame<0)errors.push(`RAGF_MOTION_BINDING_SOURCE_FRAME_INVALID:${index}`);
    if(!item?.motion_state_root||!item?.bound_motion_root)errors.push(`RAGF_MOTION_BINDING_FRAME_ROOT_MISSING:${index}`);
  }
  if(binding?.authority!=='episode-derived-runtime'||binding?.creative_authority!==false)errors.push('RAGF_MOTION_BINDING_AUTHORITY_INVALID');
  return{valid:errors.length===0,errors,binding_root:binding?.binding_root??null,frame_count:map.length};
}

function normalizeOverride(override,index){
  const layer=String(override?.layer??'');
  assert(layers.includes(layer),'RAGF_MOTION_OVERRIDE_LAYER_UNSUPPORTED',layer);
  const start=Number(override?.start_frame??override?.start??0),end=Number(override?.end_frame??override?.end??start);
  assert(Number.isInteger(start)&&Number.isInteger(end)&&start>=0&&end>=start,'RAGF_MOTION_OVERRIDE_RANGE_INVALID',String(index));
  assert(!('authority' in (override??{}))||override.authority==='director','RAGF_MOTION_OVERRIDE_AUTHORITY_INVALID',String(index));
  assert(Boolean(override?.reason),'RAGF_MOTION_OVERRIDE_REASON_REQUIRED',String(index));
  const amplitude=Number(override?.amplitude??0),frequency=override?.frequency==null?null:Number(override.frequency),phase=override?.phase==null?null:Number(override.phase);
  assert(Number.isFinite(amplitude)&& (frequency===null||Number.isFinite(frequency)) && (phase===null||Number.isFinite(phase)),'RAGF_MOTION_OVERRIDE_VALUE_INVALID',String(index));
  return{override_id:String(override?.override_id??`motion:${layer}:${start}:${end}`),layer,start_frame:start,end_frame:end,amplitude,frequency,phase,mode:override?.mode==='replace'?'replace':'add',reason:String(override.reason),authority:'director'};
}

function resolveOverride(value,override,frame){
  if(!override)return{value,override_id:null};
  const next=override.mode==='replace'||override.frequency!==null||override.phase!==null?Math.sin(frame*(override.frequency??0)+(override.phase??0))*override.amplitude:value+override.amplitude;
  return{value:next,override_id:override.override_id};
}

function resolveSourceFrame(track,sheet,targetFrame,frameOffset,missingFramePolicy){
  const raw=(targetFrame-frameOffset)*Number(track.fps)/Number(sheet.fps);
  let source=Math.floor(raw+1e-9);
  if(source<0){if(missingFramePolicy==='hold-first')source=0;else throw failure('RAGF_MOTION_FRAME_UNMAPPED',`${targetFrame}:before-track`)}
  if(source>=track.frames.length){if(missingFramePolicy==='hold-last')source=track.frames.length-1;else throw failure('RAGF_MOTION_FRAME_UNMAPPED',`${targetFrame}:after-track`)}
  return{sourceIndex:source,sourceFrame:track.frames[source]};
}

function bindFrame(track,sourceFrame,targetFrame,directorOverrides){
  const rawMotion=sourceFrame.secondary_motion;
  const resolved={frame:targetFrame,source_frame_number:sourceFrame.frame_number,hair:0,coat:0,breathing:0,foreground:0};
  for(const layer of layers){
    const base=Number(rawMotion?.[layer]??0),active=directorOverrides.filter(item=>item.layer===layer&&targetFrame>=item.start_frame&&targetFrame<=item.end_frame).at(-1),result=resolveOverride(base,active,targetFrame);resolved[layer]=clamp(result.value,limits[layer]);resolved[`${layer}_override`]=result.override_id;
  }
  const secondaryMotion={...resolved,profile_root:track.motion_root,authority:'ragf-track-bound-rsr',motion_source:'ragf.anime-motion-track.v0.1'};
  secondaryMotion.motion_root=rootHash(secondaryMotion);
  const eyeState=sourceFrame.eye_state==='blink'||sourceFrame.eye_state==='closed'?'closed':'open';
  const ragfState=seal({format:'rncs.ragf-motion-state.v0.1',version:'0.1.0-alpha.1',source_track_root:track.motion_root,source_frame_number:sourceFrame.frame_number,target_frame_number:targetFrame,source_time_seconds:sourceFrame.time_seconds??null,file:sourceFrame.file??null,motion_state_root:sourceFrame.motion_state_root,eye_state:sourceFrame.eye_state,secondary_motion:clone(rawMotion),bound_secondary_motion_root:secondaryMotion.motion_root,authority:'episode-derived-runtime',binding_state_root:''},'binding_state_root');
  return{eyeState,secondaryMotion,ragfState};
}

export function bindRagfMotionTrackToXSheet(xsheet,track,{frame_offset=0,frameOffset=null,missing_frame_policy='strict',missingFramePolicy=null,director_overrides=[],directorOverrides=null}={}){
  const sheetValidation=validateXSheetInput(xsheet);assert(sheetValidation.valid,'RAGF_XSHEET_INVALID',sheetValidation.errors.join(','));
  const trackValidation=validateRagfMotionTrack(track);assert(trackValidation.valid,'RAGF_MOTION_TRACK_INVALID',trackValidation.errors.join(','));
  const offset=Number(frameOffset??frame_offset),policy=missingFramePolicy??missing_frame_policy;
  assert(Number.isInteger(offset)&&offset>=0,'RAGF_MOTION_FRAME_OFFSET_INVALID');
  assert(['strict','hold-first','hold-last'].includes(policy),'RAGF_MOTION_MISSING_FRAME_POLICY_INVALID',String(policy));
  const overrides=[...(directorOverrides??director_overrides??[])].map(normalizeOverride),frames=[],frameMap=[];
  for(const frame of sheetValidation.frames){
    const {sourceIndex,sourceFrame}=resolveSourceFrame(track,xsheet,frame.frame_number,offset,policy),resolved=bindFrame(track,sourceFrame,frame.frame_number,overrides),next={...clone(frame),eye_state:resolved.eyeState,secondary_motion_state:resolved.secondaryMotion,ragf_motion_state:resolved.ragfState,motion_source:'ragf.anime-motion-track.v0.1'};
    frames.push(next);frameMap.push({target_frame:frame.frame_number,source_frame:sourceIndex,source_file:sourceFrame.file??null,motion_state_root:sourceFrame.motion_state_root,bound_motion_root:resolved.secondaryMotion.motion_root,eye_state:resolved.eyeState,binding_state_root:resolved.ragfState.binding_state_root});
  }
  const boundXsheet=seal({...clone(xsheet),frames,ragf_motion_source:'ragf.anime-motion-track.v0.1',ragf_motion_track_root:track.motion_root,ragf_motion_binding:{format:RAGF_MOTION_XSHEET_BINDING_FORMAT,version:RAGF_MOTION_XSHEET_BINDING_VERSION,source_fps:Number(track.fps),destination_fps:Number(xsheet.fps),frame_offset:offset,missing_frame_policy:policy,mapping:'floor-by-timebase',authority:'episode-derived-runtime'}},'xsheet_root');
  const binding=seal({format:RAGF_MOTION_XSHEET_BINDING_FORMAT,version:RAGF_MOTION_XSHEET_BINDING_VERSION,cut_ref:xsheet.cut_ref,cut_id:xsheet.cut_id,original_xsheet_root:xsheet.xsheet_root,bound_xsheet_root:boundXsheet.xsheet_root,motion_root:track.motion_root,source_fps:Number(track.fps),destination_fps:Number(xsheet.fps),frame_offset:offset,missing_frame_policy:policy,mapping:'floor-by-timebase',frame_count:frames.length,source_frame_count:track.frame_count,frame_map:frameMap,director_overrides:clone(overrides),continuity:{identity_root:track.identity_root,palette_root:track.palette_root,proportion_root:track.proportion_root,appearance_root:track.appearance_root,stable_identity:track.continuity?.stable_identity===true,stable_palette:track.continuity?.stable_palette===true,stable_proportions:track.continuity?.stable_proportions===true,stable_appearance:track.continuity?.stable_appearance===true},deterministic:track.deterministic===true,authority:'episode-derived-runtime',creative_authority:false,boundary:'RAGF motion is a derived runtime track; Episode remains creative authority and commercial physical simulation is not claimed'},'binding_root');
  return{xsheet:boundXsheet,binding};
}

export function replayRagfMotionBinding(xsheet,track,binding){
  const validation=validateRagfMotionBinding(binding);if(!validation.valid)return{valid:false,errors:validation.errors,binding_root:binding?.binding_root??null};
  try{
    const replay=bindRagfMotionTrackToXSheet(xsheet,track,{frame_offset:binding.frame_offset,missing_frame_policy:binding.missing_frame_policy,director_overrides:binding.director_overrides});
    const errors=[];if(replay.binding.binding_root!==binding.binding_root)errors.push('RAGF_MOTION_REPLAY_BINDING_ROOT_MISMATCH');if(replay.xsheet.xsheet_root!==binding.bound_xsheet_root)errors.push('RAGF_MOTION_REPLAY_XSHEET_ROOT_MISMATCH');return{valid:errors.length===0,errors,binding_root:replay.binding.binding_root,xsheet_root:replay.xsheet.xsheet_root,frame_count:replay.xsheet.frame_count};
  }catch(error){return{valid:false,errors:[error.code??error.message]};}
}
