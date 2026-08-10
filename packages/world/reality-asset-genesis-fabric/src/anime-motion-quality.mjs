export const RAGF_MOTION_QUALITY_FORMAT='ragf.anime-motion-quality.v0.1';
export const RAGF_MOTION_QUALITY_VERSION='0.1.0';
export const RAGF_MOTION_QUALITY_CONTRACT_FORMAT='ragf.anime-motion-quality-contract.v0.1';

const motionChannels=['hair','coat','breathing','foreground'];
const defaultTrackIds=['secondary-motion.hair','secondary-motion.coat','secondary-motion.breathing','facial.blink'];
const round=value=>Math.round(Number(value||0)*1000)/1000;
const number=value=>Number.isFinite(Number(value))?Number(value):0;

export function analyzeAnimeMotionTrack(track,{tolerance}={}){
  const frames=Array.isArray(track?.frames)?track.frames:[],loopMode=track?.loop_mode==='cycle'?'cycle':'hold',period=Math.max(0,Math.min(frames.length,Number(track?.loop_period_frames??frames.length))),active=frames.slice(0,loopMode==='cycle'?period:frames.length),first=active[0],last=active.at(-1),seamTolerance=Number.isFinite(Number(tolerance))?Math.max(0,Number(tolerance)):Math.max(0,Number(track?.quality_contract?.seam_tolerance??0.001)),channels=Object.fromEntries(motionChannels.map(layer=>{
    const firstValue=number(first?.secondary_motion?.[layer]),lastValue=number(last?.secondary_motion?.[layer]),delta=round(Math.abs(lastValue-firstValue));
    return[layer,{first:firstValue,last:lastValue,delta,within_tolerance:delta<=seamTolerance}];
  })),maxDelta=Object.values(channels).reduce((max,item)=>Math.max(max,item.delta),0),eyeStateMatch=Boolean(first&&last&&first.eye_state===last.eye_state),seamValid=loopMode!=='cycle'||Boolean(first&&last&&active.length>=2&&eyeStateMatch&&maxDelta<=seamTolerance),requiredTrackIds=Array.isArray(track?.quality_contract?.required_track_ids)&&track.quality_contract.required_track_ids.length?track.quality_contract.required_track_ids:defaultTrackIds,trackIds=new Set((Array.isArray(track?.tracks)?track.tracks:[]).map(item=>item?.track_id)),channelCoverage=requiredTrackIds.every(id=>trackIds.has(id)),motionStateRoots=new Set(active.map(frame=>frame?.motion_state_root).filter(Boolean)),varied=motionStateRoots.size>1,deterministic=track?.deterministic===true,valid=seamValid&&channelCoverage&&varied&&deterministic,qualityScore=(seamValid?4000:0)+(varied?3000:0)+(channelCoverage?2000:0)+(deterministic?1000:0);
  return{format:RAGF_MOTION_QUALITY_FORMAT,version:RAGF_MOTION_QUALITY_VERSION,status:valid?'pass':'fail',loop_mode:loopMode,loop_period_frames:Number(track?.loop_period_frames??0),active_frame_count:active.length,seam:{valid:seamValid,max_delta:maxDelta,eye_state_match:eyeStateMatch,tolerance:seamTolerance,channels},variation:{unique_motion_state_roots:motionStateRoots.size,valid:varied},channel_coverage:{required_track_ids:requiredTrackIds,available_track_ids:[...trackIds].sort(),valid:channelCoverage},deterministic,quality_score:qualityScore,boundary:'terminal cycle frame must match the first frame for every declared secondary-motion channel; deterministic experimental quality only'};
}
