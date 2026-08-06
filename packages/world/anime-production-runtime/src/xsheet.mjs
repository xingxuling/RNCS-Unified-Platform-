import {clone,rootHash,seal} from './canonical.mjs';
import {ANIME_XSHEET_FORMAT,normalizeCut} from './contracts.mjs';
import {ANIME_PRODUCTION_XSHEETS_FORMAT,canonicalCutRef,listProductionCuts} from './editorial.mjs';
import {resolveCompositionFrame} from './composition.mjs';
import {createAnimeRenderingProfile,resolveAnimeCamera} from '../../visual-state-runtime/src/anime-profile.mjs';
import {createAnimeSecondaryMotionProfile,resolveAnimeSecondaryMotion} from '../../reality-simulation-runtime/src/anime-motion.mjs';

const exposureSteps={on_ones:1,on_twos:2,on_threes:3,hold:Infinity,stepped:2};
const pad=n=>String(n).padStart(2,'0');
function timecode(frame,fps){const totalSeconds=Math.floor(frame/fps),hours=Math.floor(totalSeconds/3600),minutes=Math.floor(totalSeconds/60)%60,seconds=totalSeconds%60;return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frame%fps)}`}
function frameOf(value){if(typeof value==='number')return Math.round(value);const match=String(value??'').match(/(-?\d+(?:\.\d+)?)f/);return match?Math.round(Number(match[1])):Math.round(Number(value)||0)}
function atOrBefore(items,frame){return [...(items??[])].filter(item=>frameOf(item.frame??item.start_frame??item.start??0)<=frame).sort((a,b)=>frameOf(a.frame??a.start_frame??a.start??0)-frameOf(b.frame??b.start_frame??b.start??0)).at(-1)??null}
function activeRange(items,frame){return[...(items??[])].filter(item=>{const start=frameOf(item.start_frame??item.start??item.frame??0),end=item.end_frame===undefined&&item.end===undefined?start:frameOf(item.end_frame??item.end);return frame>=start&&frame<=end})}
function cameraState(cut,frame){
  const active=atOrBefore(cut.camera_track,frame);return{lens_mm:Number(active?.lens_mm??active?.lens??55),angle_deg:Number(active?.angle_deg??active?.angle??0),dolly:Number(active?.dolly??0),x:Number(active?.x??0),y:Number(active?.y??0),easing:active?.easing??'linear'};
}
function mouthState(cut,frame){const active=activeRange(cut.mouth_track,frame).at(-1);return active?.shape??active?.mouth_shape??'closed'}
function eyeState(cut,frame){const blink=activeRange(cut.blink_track,frame).at(-1);return blink?'closed':(atOrBefore(cut.facial_track,frame)?.eye_state??'open')}
function dialogueState(cut,frame){const active=activeRange(cut.dialogue_track,frame).at(-1);return active?{dialogue_event_id:active.dialogue_event_id,text:active.text,active:true}:null}

export function buildExposureSheet(input,{motionProfile=null,renderProfile=null,compositionContract=null}={}){
  const cut=normalizeCut(input),frameCount=Math.round(cut.duration*cut.fps),step=exposureSteps[cut.animation.exposure]??2,frames=[];
  motionProfile=motionProfile?.format?motionProfile:createAnimeSecondaryMotionProfile({hair:cut.animation.hair_secondary,coat:cut.animation.coat_secondary});
  renderProfile=renderProfile?.format?renderProfile:createAnimeRenderingProfile({fps:cut.fps,resolution:cut.resolution});
  const layerId=cut.character_layers[0]?.layer_id??(cut.character_layers[0]?.actor_id?`character:${cut.character_layers[0].actor_id}`:'character:unassigned');
  for(let frame=0;frame<frameCount;frame++){
    const pose=atOrBefore(cut.key_pose_track,frame),poseFrame=frameOf(pose?.frame??0),drawingFrame=step===Infinity?poseFrame:Math.floor(Math.max(0,frame-poseFrame)/step)*step+poseFrame;
    const drawingPose=atOrBefore(cut.key_pose_track,drawingFrame)??pose;
    const smear=activeRange(cut.effect_track,frame).find(item=>item.kind==='smear'||item.type==='smear');
    const impact=activeRange(cut.effect_track,frame).find(item=>item.kind==='impact'||item.type==='impact');
    const camera=resolveAnimeCamera(renderProfile,cut.camera_track,{frame,totalFrames:frameCount}),secondaryMotion=resolveAnimeSecondaryMotion(motionProfile,{frame}),composition=resolveCompositionFrame(compositionContract,cut,{frame,totalFrames:frameCount,camera,secondary:secondaryMotion});
    frames.push({frame_number:frame,timecode:timecode(frame,cut.fps),drawing_id:drawingPose?`${cut.cut_id}:drawing:${drawingPose.pose_id??drawingPose.pose??'hold'}:${drawingFrame}`:`${cut.cut_id}:drawing:hold:0`,key_pose_id:drawingPose?.pose_id??drawingPose?.pose??null,exposure_count:step===Infinity?Math.max(1,frame-(frames.at(-1)?.frame_number??frame)+1):step,layer_id:layerId,camera_state:camera,mouth_shape:mouthState(cut,frame),eye_state:eyeState(cut,frame),effect_state:{smear:Boolean(smear),impact:Boolean(impact),active:clone(activeRange(cut.effect_track,frame))},dialogue_state:dialogueState(cut,frame),secondary_motion_state:secondaryMotion,composition_state:composition,sound_cues:[...activeRange(cut.ambience_track,frame),...activeRange(cut.foley_track,frame),...activeRange(cut.sfx_track,frame)].map(item=>item.cue_id??item.sound??item.kind).filter(Boolean),composite_cues:clone(activeRange(cut.composite_track,frame)),animation_policy:{exposure:cut.animation.exposure,interpolation:'stepped',camera_only_motion:!pose,partial_animation:true}});
  }
  const result={format:ANIME_XSHEET_FORMAT,version:'0.1.0-alpha.1',cut_ref:canonicalCutRef(cut),cut_id:cut.cut_id,duration:cut.duration,fps:cut.fps,frame_count:frames.length,exposure_policy:clone(cut.animation),frames,finite_animation:{uses_exposure_steps:true,interpolation:'stepped',no_implicit_smoothing:true}};
  return seal(result,'xsheet_root');
}

export function buildProductionExposureSheets(production){
  const sheets=listProductionCuts(production).map(cut=>{const cutRef=canonicalCutRef(cut);return{cut_ref:cutRef,xsheet:buildExposureSheet(cut,{motionProfile:production.motion_profiles?.[cutRef],renderProfile:production.rendering_profiles?.[cutRef],compositionContract:production.composition_contract})}});
  return seal({format:ANIME_PRODUCTION_XSHEETS_FORMAT,version:'0.1.0-alpha.1',production_id:production.production_id,production_root:production.production_root,timeline_root:production.editorial_timeline?.timeline_root??null,cut_count:sheets.length,total_frame_count:sheets.reduce((sum,item)=>sum+item.xsheet.frame_count,0),sheets},'xsheets_root');
}

export function validateProductionExposureSheets(collection){
  const errors=[];
  if(collection?.format!==ANIME_PRODUCTION_XSHEETS_FORMAT)errors.push('PRODUCTION_XSHEETS_FORMAT_INVALID');
  if(collection?.cut_count!==collection?.sheets?.length)errors.push('PRODUCTION_XSHEETS_CUT_COUNT_MISMATCH');
  let total=0;const refs=new Set();
  for(const item of collection?.sheets??[]){if(refs.has(item.cut_ref))errors.push(`PRODUCTION_XSHEET_DUPLICATE:${item.cut_ref}`);refs.add(item.cut_ref);const validation=validateExposureSheet(item.xsheet);errors.push(...validation.errors.map(error=>`${item.cut_ref}:${error}`));total+=item.xsheet?.frame_count??0}
  if(total!==collection?.total_frame_count)errors.push('PRODUCTION_XSHEETS_FRAME_COUNT_MISMATCH');
  return{valid:errors.length===0,errors,xsheets_root:collection?.xsheets_root??null,total_frame_count:total};
}

export function validateExposureSheet(sheet){
  const errors=[];if(sheet?.format!==ANIME_XSHEET_FORMAT)errors.push('XSHEET_FORMAT_INVALID');if(sheet?.frame_count!==sheet?.frames?.length)errors.push('XSHEET_FRAME_COUNT_MISMATCH');for(const [index,frame] of (sheet?.frames??[]).entries()){if(frame.frame_number!==index)errors.push(`XSHEET_FRAME_ORDER:${index}`);if(!frame.drawing_id)errors.push(`XSHEET_DRAWING_MISSING:${index}`);if(frame.animation_policy?.interpolation!=='stepped')errors.push(`XSHEET_IMPLICIT_INTERPOLATION:${index}`);if(frame.secondary_motion_state?.frame!==index||!frame.secondary_motion_state?.motion_root)errors.push(`XSHEET_MOTION_ALIGNMENT:${index}`);if(frame.composition_state?.frame!==index||!frame.composition_state?.composition_state_root)errors.push(`XSHEET_COMPOSITION_ALIGNMENT:${index}`);if(frame.camera_state?.frame!==index)errors.push(`XSHEET_CAMERA_ALIGNMENT:${index}`)}return{valid:errors.length===0,errors,xsheet_root:sheet?.xsheet_root??null};
}
