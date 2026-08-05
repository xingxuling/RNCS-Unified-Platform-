import {clone,rootHash,seal} from './canonical.mjs';

export const ANIME_EDITORIAL_TIMELINE_FORMAT='rncs.anime-editorial-timeline.v0.1';
export const ANIME_PRODUCTION_XSHEETS_FORMAT='rncs.anime-production-xsheets.v0.1';

export function canonicalCutRef(cut={}){
  if(cut.cut_ref)return String(cut.cut_ref);
  return `${cut.episode_id??'EP01'}/${cut.scene_id??'Scene'}/${cut.cut_id??'S01'}`;
}

export function listProductionCuts(production={}){
  const cuts=Array.isArray(production.cuts)&&production.cuts.length?production.cuts:(production.cut?[production.cut]:[]);
  return cuts.map(cut=>clone(cut));
}

export function resolveProductionCut(production,selector=null){
  const cuts=listProductionCuts(production);
  if(!cuts.length)throw Object.assign(new Error('ANIME_CUT_REQUIRED'),{code:'ANIME_CUT_REQUIRED'});
  const requested=selector??production.active_cut_ref??production.cut?.cut_ref??production.cut?.cut_id??cuts[0].cut_ref??cuts[0].cut_id;
  const byRef=cuts.find(cut=>canonicalCutRef(cut)===requested);
  if(byRef)return byRef;
  const byId=cuts.filter(cut=>cut.cut_id===requested);
  if(byId.length>1)throw Object.assign(new Error(`ANIME_CUT_SELECTOR_AMBIGUOUS:${requested}`),{code:'ANIME_CUT_SELECTOR_AMBIGUOUS',details:{selector:requested,cut_refs:byId.map(canonicalCutRef)}});
  if(byId.length===1)return byId[0];
  throw Object.assign(new Error(`ANIME_CUT_NOT_FOUND:${requested}`),{code:'ANIME_CUT_NOT_FOUND',details:{selector:requested}});
}

export function replaceProductionCutData(production,cut){
  const next=clone(production),cutRef=canonicalCutRef(cut),cuts=listProductionCuts(next),index=cuts.findIndex(item=>canonicalCutRef(item)===cutRef);
  if(index<0)throw Object.assign(new Error(`ANIME_CUT_NOT_FOUND:${cutRef}`),{code:'ANIME_CUT_NOT_FOUND'});
  cuts[index]={...clone(cut),cut_ref:cutRef};
  next.cuts=cuts;
  if(canonicalCutRef(next.cut??{})===cutRef||next.active_cut_ref===cutRef)next.cut=clone(cuts[index]);
  return next;
}

export function buildEditorialTimeline(cuts,{productionId='anime-production',transitionPolicy='hard-cut'}={}){
  let cursor=0;
  const entries=cuts.map((raw,index)=>{
    const cut=clone(raw),frameCount=Math.round(Number(cut.duration)*Number(cut.fps)),cutRef=canonicalCutRef(cut),entry={
      ordinal:index,
      cut_ref:cutRef,
      cut_id:cut.cut_id,
      episode_id:cut.episode_id??'EP01',
      sequence_id:cut.sequence_id??'SEQ01',
      scene_id:cut.scene_id??'Scene',
      mode:cut.mode,
      fps:Number(cut.fps),
      resolution:clone(cut.resolution),
      local_frame_count:frameCount,
      global_start_frame:cursor,
      global_end_frame_exclusive:cursor+frameCount,
      transition_in:index===0?{type:'program-start',duration_frames:0}:{type:cut.transition?.type??transitionPolicy,duration_frames:Number(cut.transition?.duration_frames??0)},
      transition_out:{type:cuts[index+1]?.transition?.type??(index===cuts.length-1?'program-end':transitionPolicy),duration_frames:Number(cuts[index+1]?.transition?.duration_frames??0)},
    };
    cursor+=frameCount;
    return entry;
  });
  const first=entries[0]??null,timeline={
    format:ANIME_EDITORIAL_TIMELINE_FORMAT,
    version:'0.1.0-alpha.1',
    production_id:productionId,
    cut_order:entries.map(entry=>entry.cut_ref),
    entries,
    cut_count:entries.length,
    master_fps:first?.fps??24,
    master_resolution:first?.resolution??{width:1920,height:1080},
    total_frame_count:cursor,
    total_duration_seconds:first?cursor/first.fps:0,
    transition_policy:transitionPolicy,
    render_strategy:'deterministic-hard-cut-concatenation',
  };
  return seal(timeline,'timeline_root');
}

export function validateEditorialTimeline(timeline,cuts=[]){
  const errors=[];
  if(timeline?.format!==ANIME_EDITORIAL_TIMELINE_FORMAT)errors.push('EDITORIAL_TIMELINE_FORMAT_INVALID');
  const entries=timeline?.entries??[];
  if(entries.length!==cuts.length)errors.push('EDITORIAL_CUT_COUNT_MISMATCH');
  const refs=new Set();let cursor=0;
  for(const [index,entry] of entries.entries()){
    if(refs.has(entry.cut_ref))errors.push(`EDITORIAL_CUT_REF_DUPLICATE:${entry.cut_ref}`);refs.add(entry.cut_ref);
    if(entry.ordinal!==index)errors.push(`EDITORIAL_ORDINAL_INVALID:${entry.cut_ref}`);
    if(entry.global_start_frame!==cursor)errors.push(`EDITORIAL_GAP_OR_OVERLAP:${entry.cut_ref}`);
    if(entry.global_end_frame_exclusive-entry.global_start_frame!==entry.local_frame_count)errors.push(`EDITORIAL_FRAME_RANGE_INVALID:${entry.cut_ref}`);
    if(index>0&&entry.transition_in?.type!=='hard-cut')errors.push(`EDITORIAL_TRANSITION_UNSUPPORTED:${entry.cut_ref}:${entry.transition_in?.type}`);
    cursor=entry.global_end_frame_exclusive;
  }
  if(cursor!==timeline?.total_frame_count)errors.push('EDITORIAL_TOTAL_FRAME_COUNT_MISMATCH');
  if(entries.some(entry=>entry.fps!==timeline.master_fps))errors.push('EDITORIAL_MASTER_FPS_MISMATCH');
  if(entries.some(entry=>entry.resolution?.width!==timeline.master_resolution?.width||entry.resolution?.height!==timeline.master_resolution?.height))errors.push('EDITORIAL_MASTER_RESOLUTION_MISMATCH');
  return{valid:errors.length===0,errors,timeline_root:timeline?.timeline_root??null,total_frame_count:cursor,cut_count:entries.length};
}

export function analyzeEditorialImpact(before,after){
  const previous=new Map(listProductionCuts(before).map(cut=>[canonicalCutRef(cut),rootHash(cut)]));
  const current=new Map(listProductionCuts(after).map(cut=>[canonicalCutRef(cut),rootHash(cut)]));
  const refs=[...new Set([...previous.keys(),...current.keys()])],affected=refs.filter(ref=>previous.get(ref)!==current.get(ref)),preserved=refs.filter(ref=>previous.get(ref)===current.get(ref));
  const result={format:'rncs.anime-editorial-impact.v0.1',before_root:before?.production_root??null,after_root:after?.production_root??null,affected_cut_refs:affected,preserved_cut_refs:preserved,requires_full_rebuild:affected.length===refs.length,policy:'rerender affected Cuts; preserve sealed unaffected Cut manifests'};
  return{...result,impact_root:rootHash(result)};
}
