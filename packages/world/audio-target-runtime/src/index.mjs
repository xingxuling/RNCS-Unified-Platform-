import {createHash} from 'node:crypto';

export const AUDIO_TARGET_FORMAT='rncs.audio-target-profile.v0.1';
export const AUDIO_TARGET_PLAN_FORMAT='rncs.audio-target-plan.v0.1';
export const AUDIO_TARGET_RECEIPT_FORMAT='rncs.audio-target-receipt.v0.1';
export const AUDIO_TARGET_VERSION='0.1.0-alpha.1';

const clone=value=>structuredClone(value);
const canonical=value=>Array.isArray(value)?value.map(canonical):(value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value);
const rootHash=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const seal=(value,field)=>{const output=clone(value);delete output[field];output[field]=rootHash(output);return output;};
const sha256=/^[0-9a-f]{64}$/i;
const audioMime=mime=>String(mime??'').toLowerCase().startsWith('audio/');

function normalizeBinding(binding,index){
  const value=binding??{};
  return{
    binding_id:String(value.binding_id??`audio-binding:${index}`),
    cue_id:String(value.cue_id??''),
    asset_id:String(value.asset_id??''),
    file_role:String(value.file_role??'audio-source'),
    asset_sha256:String(value.asset_sha256??'').toLowerCase()
  };
}

export function createAudioTargetProfile({bindings=[],fallback_policy='blocked'}={}){
  const normalized=bindings.map(normalizeBinding);
  const ids=new Set(),cues=new Set();
  for(const binding of normalized){
    if(ids.has(binding.binding_id))throw Object.assign(new Error(`AUDIO_TARGET_BINDING_DUPLICATE:${binding.binding_id}`),{code:'AUDIO_TARGET_BINDING_DUPLICATE'});
    if(cues.has(binding.cue_id))throw Object.assign(new Error(`AUDIO_TARGET_CUE_DUPLICATE:${binding.cue_id}`),{code:'AUDIO_TARGET_CUE_DUPLICATE'});
    ids.add(binding.binding_id);cues.add(binding.cue_id);
  }
  return seal({format:AUDIO_TARGET_FORMAT,version:AUDIO_TARGET_VERSION,fallback_policy:String(fallback_policy),bindings:normalized.sort((a,b)=>a.cue_id.localeCompare(b.cue_id)||a.binding_id.localeCompare(b.binding_id))},'profile_root');
}

export function verifyAudioTargetProfile(profile){
  const errors=[];
  if(profile?.format!==AUDIO_TARGET_FORMAT)errors.push({code:'AUDIO_TARGET_FORMAT_INVALID'});
  if(profile?.version!==AUDIO_TARGET_VERSION)errors.push({code:'AUDIO_TARGET_VERSION_INVALID'});
  if(!['blocked','procedural-explicit'].includes(profile?.fallback_policy))errors.push({code:'AUDIO_TARGET_FALLBACK_POLICY_INVALID'});
  const ids=new Set(),cues=new Set();
  for(const [index,binding] of (profile?.bindings??[]).entries()){
    const normalized=normalizeBinding(binding,index);
    if(!normalized.binding_id||!normalized.cue_id||!normalized.asset_id||!normalized.file_role)errors.push({code:'AUDIO_TARGET_BINDING_REQUIRED',index});
    if(!sha256.test(normalized.asset_sha256))errors.push({code:'AUDIO_TARGET_ASSET_HASH_INVALID',binding_id:normalized.binding_id});
    if(ids.has(normalized.binding_id))errors.push({code:'AUDIO_TARGET_BINDING_DUPLICATE',binding_id:normalized.binding_id});
    if(cues.has(normalized.cue_id))errors.push({code:'AUDIO_TARGET_CUE_DUPLICATE',cue_id:normalized.cue_id});
    ids.add(normalized.binding_id);cues.add(normalized.cue_id);
  }
  if(!profile?.profile_root)errors.push({code:'AUDIO_TARGET_PROFILE_ROOT_REQUIRED'});
  if(profile?.profile_root){const expected=clone(profile);delete expected.profile_root;if(rootHash(expected)!==profile.profile_root)errors.push({code:'AUDIO_TARGET_PROFILE_ROOT_MISMATCH'});}
  return{valid:errors.length===0,errors,profile_root:profile?.profile_root??null};
}

function blockedBinding(binding,status,reason){return{...binding,status,reason,uri:null,mime:null,size:null,asset_root:null};}

export function compileAudioTargetPlan(profile,{records={},embedded=false}={}){
  if(!profile)return null;
  const validation=verifyAudioTargetProfile(profile);
  if(!validation.valid)return seal({format:AUDIO_TARGET_PLAN_FORMAT,version:AUDIO_TARGET_VERSION,status:'invalid-profile',provider_id:'reality-build.web-audio-buffer',fallback_policy:profile.fallback_policy??'blocked',profile_root:profile.profile_root??null,bindings:[],summary:{declared:profile.bindings?.length??0,bound:0,blocked:profile.bindings?.length??0},validation},'plan_root');
  const bindings=[];
  for(const binding of profile.bindings??[]){
    const record=records?.[binding.asset_id];
    if(!record){bindings.push(blockedBinding(binding,'blocked-asset','asset record is not present in the target manifest'));continue;}
    const file=(record.files??[]).find(candidate=>candidate.role===binding.file_role);
    if(!file){bindings.push(blockedBinding(binding,'blocked-file','declared file role is not present in the target manifest'));continue;}
    if(!audioMime(file.mime)){bindings.push(blockedBinding(binding,'blocked-mime','declared file is not an audio target'));continue;}
    if(String(file.sha256??'').toLowerCase()!==binding.asset_sha256){bindings.push(blockedBinding(binding,'blocked-hash','declared file hash does not match the explicit binding'));continue;}
    bindings.push({
      ...binding,
      status:'bound',
      asset_root:record.asset_root??null,
      uri:embedded?(file.embedded_uri??file.store_path??null):(file.store_path??null),
      mime:file.mime??null,
      size:file.size??null
    });
  }
  const summary={declared:bindings.length,bound:bindings.filter(item=>item.status==='bound').length,blocked:bindings.filter(item=>item.status!=='bound').length};
  return seal({format:AUDIO_TARGET_PLAN_FORMAT,version:AUDIO_TARGET_VERSION,status:validation.valid?'ready':'invalid-profile',provider_id:'reality-build.web-audio-buffer',fallback_policy:profile.fallback_policy??'blocked',profile_root:profile.profile_root??null,bindings,summary,validation:validation.valid?null:validation},'plan_root');
}

export function audioTargetReceipt({plan,cue_id,tick=null,source_event_id=null,status=null,provider_id=null,reason=null}={}){
  const binding=(plan?.bindings??[]).find(item=>item.cue_id===String(cue_id));
  return seal({format:AUDIO_TARGET_RECEIPT_FORMAT,version:AUDIO_TARGET_VERSION,plan_root:plan?.plan_root??null,binding_id:binding?.binding_id??null,cue_id:String(cue_id??''),asset_id:binding?.asset_id??null,asset_sha256:binding?.asset_sha256??null,file_role:binding?.file_role??null,tick,source_event_id,status:status??(binding?.status??'blocked-binding'),provider_id,reason},'receipt_root');
}
