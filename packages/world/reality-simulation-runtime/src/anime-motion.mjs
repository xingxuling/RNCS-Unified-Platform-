import {createHash} from 'node:crypto';

export const RSR_ANIME_SECONDARY_MOTION_FORMAT='rsr.anime-secondary-motion-profile.v0.1';
export const RSR_ANIME_SECONDARY_MOTION_VERSION='0.1.0-alpha.1';

function normalize(value){
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?(Object.is(value,-0)?0:value):null;
  if(Array.isArray(value))return value.map(normalize);
  if(value&&typeof value==='object'){const out={};for(const key of Object.keys(value).sort())if(value[key]!==undefined)out[key]=normalize(value[key]);return out}
  return String(value);
}
const rootHash=value=>createHash('sha256').update(JSON.stringify(normalize(value))).digest('hex');
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function createAnimeSecondaryMotionProfile({profileId='anime-secondary-reference',seed='rsr-anime-reference-v0.1',hair='subtle',coat='subtle',breathing='subtle',foreground='subtle',directorOverrides=[]}={}){
  const profile={format:RSR_ANIME_SECONDARY_MOTION_FORMAT,version:RSR_ANIME_SECONDARY_MOTION_VERSION,profile_id:profileId,seed,layer_bindings:{hair:{mode:hair,amplitude:hair==='none'?0:.9,frequency:.27,phase:.11},coat:{mode:coat,amplitude:coat==='none'?0:1.2,frequency:.19,phase:.7},breathing:{mode:breathing,amplitude:breathing==='none'?0:1.35,frequency:.075,phase:.4},foreground:{mode:foreground,amplitude:foreground==='none'?0:1.8,frequency:.035,phase:.2}},director_overrides:[...(directorOverrides??[])],override_policy:{authority:'director',bounded:true,requires_frame_range:true,requires_reason:true,unknown_layer:'reject'},continuity:{stable_asset_identity:true,deterministic_seed:true},quality_boundary:'reference secondary motion; physical cloth/hair simulation not claimed'};
  return{...profile,profile_root:rootHash(profile)};
}

export function createDirectorMotionOverride({layer,startFrame,endFrame,amplitude,frequency=null,phase=null,reason='director-timing'}={}){
  if(!layer)throw Object.assign(new Error('RSR_MOTION_LAYER_REQUIRED'),{code:'RSR_MOTION_LAYER_REQUIRED'});
  if(!Number.isFinite(Number(startFrame))||!Number.isFinite(Number(endFrame))||Number(endFrame)<Number(startFrame))throw Object.assign(new Error('RSR_MOTION_RANGE_INVALID'),{code:'RSR_MOTION_RANGE_INVALID'});
  if(!reason)throw Object.assign(new Error('RSR_MOTION_REASON_REQUIRED'),{code:'RSR_MOTION_REASON_REQUIRED'});
  return{override_id:`motion:${layer}:${startFrame}:${endFrame}`,layer,start_frame:Number(startFrame),end_frame:Number(endFrame),amplitude:Number(amplitude??1),frequency:frequency==null?null:Number(frequency),phase:phase==null?null:Number(phase),reason,authority:'director'};
}

export function applyDirectorMotionOverride(profile,override){
  if(!['hair','coat','breathing','foreground'].includes(override?.layer))throw Object.assign(new Error(`RSR_MOTION_LAYER_UNSUPPORTED:${override?.layer}`),{code:'RSR_MOTION_LAYER_UNSUPPORTED'});
  const next={...profile,director_overrides:[...(profile.director_overrides??[]),{...override}]};delete next.profile_root;return{...next,profile_root:rootHash(next)};
}

export function resolveAnimeSecondaryMotion(profile,{frame=0}={}){
  const base={};for(const [layer,settings] of Object.entries(profile?.layer_bindings??{})){const override=[...(profile.director_overrides??[])].filter(item=>item.layer===layer&&frame>=item.start_frame&&frame<=item.end_frame).at(-1);const amplitude=Number(override?.amplitude??settings.amplitude??0),frequency=Number(override?.frequency??settings.frequency??0),phase=Number(override?.phase??settings.phase??0);base[layer]=Math.sin(frame*frequency+phase)*amplitude;base[`${layer}_override`]=override?override.override_id:null}
  const values={hair:clamp(base.hair??0,-12,12),coat:clamp(base.coat??0,-12,12),breathing:clamp(base.breathing??0,-6,6),foreground:clamp(base.foreground??0,-12,12),hair_override:base.hair_override,coat_override:base.coat_override,breathing_override:base.breathing_override,foreground_override:base.foreground_override,profile_root:profile?.profile_root??null,frame,authority:'director-overridable-reference'};return{...values,motion_root:rootHash(values)};
}

export function validateAnimeSecondaryMotionProfile(profile){const errors=[];if(profile?.format!==RSR_ANIME_SECONDARY_MOTION_FORMAT)errors.push('RSR_ANIME_MOTION_FORMAT_INVALID');if(profile?.version!==RSR_ANIME_SECONDARY_MOTION_VERSION)errors.push('RSR_ANIME_MOTION_VERSION_INVALID');if(!profile?.profile_root)errors.push('RSR_ANIME_MOTION_ROOT_MISSING');for(const layer of ['hair','coat','breathing','foreground'])if(!profile?.layer_bindings?.[layer])errors.push(`RSR_ANIME_MOTION_BINDING_MISSING:${layer}`);for(const item of profile?.director_overrides??[]){if(!['hair','coat','breathing','foreground'].includes(item.layer))errors.push(`RSR_ANIME_MOTION_LAYER:${item.layer}`);if(item.end_frame<item.start_frame)errors.push(`RSR_ANIME_MOTION_RANGE:${item.override_id}`);if(item.authority!=='director')errors.push(`RSR_ANIME_MOTION_AUTHORITY:${item.override_id}`)}return{valid:errors.length===0,errors,profile_root:profile?.profile_root??null};}
