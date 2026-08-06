import {clone,rootHash,seal,verifySeal} from './canonical.mjs';
import {canonicalCutRef,listProductionCuts} from './editorial.mjs';

export const ANIME_EPISODE_AUTHORITY_FORMAT='rncs.anime-episode-authority.v0.1';
export const ANIME_COMPOSITION_CONTRACT_FORMAT='rncs.anime-composition-camera-contract.v0.1';
export const ANIME_LAYER_ORDER=Object.freeze(['background','atmosphere','character','foreground','effects','lighting','correction']);

export function createEpisodeAuthorityContract(input={}){
  return seal({format:ANIME_EPISODE_AUTHORITY_FORMAT,version:'0.1.0-alpha.1',episode_authoritative:true,cut_derived:true,clip_reusable:true,patch_local:true,continuity_global:true,cut_operations:['browse','qa','local-repair','evidence-locate','clip-extract'],cut_write_authority:false,provider_write_authority:false,source_intent_root:input.source_intent_root??null,episode_id:String(input.episode_id??'EP01'),authority_root:''},'authority_root');
}

export function createEpisodeCompositionContract(input={}){
  const cuts=listProductionCuts(input),first=cuts[0]??{},fps=Number(input?.editorial_timeline?.master_fps??first.fps??24),resolution=clone(input?.editorial_timeline?.master_resolution??first.resolution??{width:960,height:540});
  const cutContracts=cuts.map((cut,index)=>{const cutRef=canonicalCutRef(cut),profile=input?.rendering_profiles?.[cutRef]??input?.rendering_profile??{};return{cut_ref:cutRef,ordinal:index,layout:cut.layout??'medium_close_up',camera_track_root:rootHash(cut.camera_track??[]),composite_track_root:rootHash(cut.composite_track??[]),transition_in:index===0?'program-start':cut.transition?.type??'hard-cut',exposure_anchor:String(cut.metadata?.exposure_anchor??profile.exposure?.anchor??'programme-reference-v1'),colour_anchor:String(cut.metadata?.colour_anchor??profile.compositing?.colour_anchor??'programme-neutral-v1')}});
  return seal({format:ANIME_COMPOSITION_CONTRACT_FORMAT,version:'0.1.0-alpha.1',production_id:input?.production_id??null,output:{width:Number(resolution.width),height:Number(resolution.height),fps,color_space:'srgb',pixel_format:'rgba8',alpha_mode:'straight'},layer_order:[...ANIME_LAYER_ORDER],layers:{background:{opacity:1,crop:'canvas',mask:null},atmosphere:{opacity:.34,crop:'canvas',mask:'depth-fade'},character:{opacity:1,crop:'safe-area',mask:null},foreground:{opacity:.78,crop:'canvas',mask:'edge-occlusion'},effects:{opacity:.72,crop:'canvas',mask:'additive-bounded'},lighting:{opacity:.24,crop:'canvas',mask:'key-light'},correction:{opacity:1,crop:'canvas',mask:'programme-grade'}},camera:{coordinate_space:'anime-canvas-960x540',transform_order:['layout-scale','dolly','pan','secondary-ease'],explicit_easing:true},transitions:{supported:['program-start','hard-cut','program-end'],unsupported_policy:'reject'},seam_policy:{identity:'exact-root',palette:'exact-root',resolution:'exact',fps:'exact',colour_anchor:'exact',exposure_anchor:'exact',shot_change:'required'},cut_contracts:cutContracts,composition_root:''},'composition_root');
}

export function validateEpisodeAuthorityContract(contract){
  const errors=[];if(contract?.format!==ANIME_EPISODE_AUTHORITY_FORMAT)errors.push('EPISODE_AUTHORITY_FORMAT_INVALID');for(const key of ['episode_authoritative','cut_derived','clip_reusable','patch_local','continuity_global'])if(contract?.[key]!==true)errors.push(`EPISODE_AUTHORITY_INVARIANT:${key}`);if(contract?.cut_write_authority!==false||contract?.provider_write_authority!==false)errors.push('EPISODE_AUTHORITY_ESCALATION');if(!verifySeal(contract,'authority_root'))errors.push('EPISODE_AUTHORITY_ROOT_INVALID');return{valid:errors.length===0,errors,authority_root:contract?.authority_root??null};
}

export function validateEpisodeCompositionContract(contract,production={}){
  const errors=[];if(contract?.format!==ANIME_COMPOSITION_CONTRACT_FORMAT)errors.push('COMPOSITION_FORMAT_INVALID');if(!verifySeal(contract,'composition_root'))errors.push('COMPOSITION_ROOT_INVALID');if(contract?.output?.fps!==production?.editorial_timeline?.master_fps)errors.push('COMPOSITION_FPS_MISMATCH');if(contract?.output?.width!==production?.editorial_timeline?.master_resolution?.width||contract?.output?.height!==production?.editorial_timeline?.master_resolution?.height)errors.push('COMPOSITION_RESOLUTION_MISMATCH');if(JSON.stringify(contract?.layer_order)!==JSON.stringify(ANIME_LAYER_ORDER))errors.push('COMPOSITION_LAYER_ORDER_INVALID');const refs=new Set(listProductionCuts(production).map(canonicalCutRef));for(const item of contract?.cut_contracts??[]){if(!refs.has(item.cut_ref))errors.push(`COMPOSITION_CUT_UNKNOWN:${item.cut_ref}`);if(!contract.transitions.supported.includes(item.transition_in))errors.push(`COMPOSITION_TRANSITION_UNSUPPORTED:${item.cut_ref}:${item.transition_in}`)}if((contract?.cut_contracts?.length??0)!==refs.size)errors.push('COMPOSITION_CUT_COUNT_MISMATCH');return{valid:errors.length===0,errors,composition_root:contract?.composition_root??null};
}

export function resolveCompositionFrame(contract,cut,{frame=0,totalFrames=1,camera={},secondary={}}={}){
  const cutRef=canonicalCutRef(cut),cutContract=contract?.cut_contracts?.find(item=>item.cut_ref===cutRef),progress=frame/Math.max(1,totalFrames-1),foregroundParallax=Number(camera.x??0)*-1.7+Number(secondary.foreground??0);
  const state={cut_ref:cutRef,frame,progress,layout:cutContract?.layout??cut.layout??'medium_close_up',layer_order:clone(contract?.layer_order??ANIME_LAYER_ORDER),layers:clone(contract?.layers??{}),camera:clone(camera),foreground_parallax:foregroundParallax,colour_anchor:cutContract?.colour_anchor??'shenlin-cold-court-v1',exposure_anchor:cutContract?.exposure_anchor??'cold-overcast-v1'};
  return{...state,composition_state_root:rootHash(state)};
}
