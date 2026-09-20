import {assert,clone,rootHash} from './hash.mjs';

const PRESENTATION=new Set(['camera','animation','dialogue','audio','effect','light']);
const AUTHORITY=new Set(['behavior','quest','network','physics','branch']);

export function verifyStudioSequenceFrame(frame){
  const errors=[];if(frame?.format!=='reality-studio.sequence-frame.v1.6')errors.push('ANIMATION_SEQUENCE_FRAME_FORMAT_INVALID');if(typeof frame?.frame_root!=='string')errors.push('ANIMATION_SEQUENCE_FRAME_ROOT_REQUIRED');if(!Array.isArray(frame?.presentation_state))errors.push('ANIMATION_SEQUENCE_PRESENTATION_REQUIRED');if((frame?.presentation_state??[]).some(x=>!PRESENTATION.has(x.track_type)))errors.push('ANIMATION_SEQUENCE_PRESENTATION_TRACK_INVALID');if((frame?.authority_events??[]).some(x=>!AUTHORITY.has(x.track_type)))errors.push('ANIMATION_SEQUENCE_AUTHORITY_TRACK_INVALID');return {ok:errors.length===0,errors};
}

function explicitAnimationSpec(entry){
  const payload=entry.payload??{},spec=payload.animation_fabric??payload.animationFabric??null;
  if(spec)return clone(spec);
  if(payload.animation?.domain)return {...clone(payload.animation),nodeId:payload.node_id??payload.animation.nodeId??null};
  return null;
}

export function lowerStudioSequenceFrame(frame,{strict=true}={}){
  const check=verifyStudioSequenceFrame(frame);assert(check.ok,`ANIMATION_SEQUENCE_FRAME_INVALID:${check.errors.join(',')}`);const channels=[],unlowered=[];
  for(const entry of frame.presentation_state){
    if(entry.track_type!=='animation'){unlowered.push({track_type:entry.track_type,clip_id:entry.clip_id,reason:'OWNED_BY_OTHER_PRESENTATION_RUNTIME'});continue;}
    const spec=explicitAnimationSpec(entry);if(!spec){unlowered.push({track_type:'animation',clip_id:entry.clip_id,reason:'EXPLICIT_ANIMATION_FABRIC_DOMAIN_REQUIRED'});continue;}
    const domain=String(spec.domain??'').toLowerCase();if(!['2d','3d'].includes(domain)){if(strict)throw new Error(`ANIMATION_DOMAIN_INVALID:${domain}`);unlowered.push({track_type:'animation',clip_id:entry.clip_id,reason:'DOMAIN_INVALID'});continue;}
    assert(spec.authoritative!==true&&spec.canonical_state_mutation!==true,'ANIMATION_AUTHORITY_ESCALATION_REJECTED');
    channels.push({channel_id:String(spec.channel_id??entry.clip_id),domain,track_id:entry.track_id,clip_id:entry.clip_id,local_time:Number(entry.local_time??0),progress:Number(entry.progress??0),node_id:spec.nodeId??spec.node_id??null,spec});
  }
  const base={format:'rncs.animation-fabric.sequence-frame.v0.1',source_format:frame.format,source_frame_root:frame.frame_root,source_presentation_root:frame.presentation_root??null,source_authority_root:frame.authority_root??null,time:Number(frame.time??0),channels,unlowered,candidate_only:true,authoritative:false,canonical_state_mutated:false};return {...base,animation_frame_root:rootHash(base)};
}
