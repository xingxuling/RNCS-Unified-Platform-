import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {clone,rootHash,seal} from './canonical.mjs';
import {canonicalCutRef,listProductionCuts} from './editorial.mjs';

const exact=(values)=>new Set(values.filter(value=>value!==null&&value!==undefined)).size<=1;
const safeRelative=(root,relative)=>{const absolute=path.resolve(root,relative),base=path.resolve(root);if(absolute!==base&&!absolute.startsWith(`${base}${path.sep}`))throw Object.assign(new Error(`ANIME_EVIDENCE_PATH_ESCAPE:${relative}`),{code:'ANIME_EVIDENCE_PATH_ESCAPE'});return absolute};
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

export function buildCharacterContinuityReport(production){
  const actors=new Map(),programmeCuts=listProductionCuts(production);
  for(const cut of programmeCuts)for(const layer of cut.character_layers??[]){if(!layer.actor_id)continue;const rows=actors.get(layer.actor_id)??[];rows.push({cut_ref:canonicalCutRef(cut),actor_id:layer.actor_id,asset_id:layer.asset_id??null,family_root:layer.family_root??null,asset_root:layer.asset_root??null,genome_root:layer.genome_root??null,identity_root:layer.identity_root??null,identity_signature_root:layer.identity_signature_root??null,palette_root:layer.palette_root??null,proportion_root:layer.proportion_root??null,appearance_root:layer.appearance_root??null});actors.set(layer.actor_id,rows)}
  const checks=[...actors].map(([actorId,rows])=>{const fields=['asset_id','family_root','asset_root','genome_root','identity_root','identity_signature_root','palette_root','proportion_root','appearance_root'],fieldChecks=Object.fromEntries(fields.map(field=>{const values=rows.map(item=>item[field]);return[field,values.every(value=>value!==null&&value!==undefined&&value!=='')&&exact(values)]})),spansProgramme=rows.length===programmeCuts.length,pass=Object.values(fieldChecks).every(Boolean);return{actor_id:actorId,cut_count:rows.length,spans_programme:spansProgramme,pass,field_checks:fieldChecks,cuts:rows}}),programmeContinuousActor=checks.some(item=>item.spans_programme&&item.pass);
  return seal({format:'rncs.anime-character-continuity-report.v0.1',version:'0.1.0-alpha.1',production_id:production.production_id,production_root:production.production_root,episode_intent_root:production.episode_intent_root,status:checks.length>0&&checks.every(item=>item.pass)&&programmeContinuousActor?'pass':'fail',programme_continuous_actor:programmeContinuousActor,stable_identity:checks.length>0&&checks.every(item=>item.field_checks.identity_root&&item.field_checks.identity_signature_root),stable_appearance:checks.length>0&&checks.every(item=>item.field_checks.palette_root&&item.field_checks.proportion_root&&item.field_checks.appearance_root),actors:checks,boundary:'exact rooted continuity for generated assets; human likeness and commercial character-design quality are not proven',report_root:''},'report_root');
}

function frameAt(manifest,cutRef,which){const frames=(manifest?.frames??[]).filter(item=>item.cut_ref===cutRef).sort((a,b)=>(a.global_frame_number??a.frame_number)-(b.global_frame_number??b.frame_number));return which==='first'?frames[0]:frames.at(-1)}

export function buildCutContinuityReport(production,manifest=null){
  const cuts=listProductionCuts(production),compositionByRef=new Map((production.composition_contract?.cut_contracts??[]).map(item=>[item.cut_ref,item])),seams=[];
  for(let index=1;index<cuts.length;index++){
    const before=cuts[index-1],after=cuts[index],beforeRef=canonicalCutRef(before),afterRef=canonicalCutRef(after),beforeActor=before.character_layers?.[0]??{},afterActor=after.character_layers?.[0]??{},beforeFrame=frameAt(manifest,beforeRef,'last'),afterFrame=frameAt(manifest,afterRef,'first'),beforeComposition=compositionByRef.get(beforeRef),afterComposition=compositionByRef.get(afterRef),checks={identity_root:(beforeFrame?.state_summary?.character_identity_root??beforeActor.identity_root)===(afterFrame?.state_summary?.character_identity_root??afterActor.identity_root),palette_root:(beforeFrame?.state_summary?.character_palette_root??beforeActor.palette_root)===(afterFrame?.state_summary?.character_palette_root??afterActor.palette_root),proportion_root:beforeActor.proportion_root===afterActor.proportion_root,resolution:before.resolution?.width===after.resolution?.width&&before.resolution?.height===after.resolution?.height,fps:before.fps===after.fps,colour_anchor:beforeComposition?.colour_anchor===afterComposition?.colour_anchor,exposure_anchor:beforeComposition?.exposure_anchor===afterComposition?.exposure_anchor,shot_change:before.layout!==after.layout,transition:after.transition?.type==='hard-cut'};seams.push({seam_id:`${beforeRef}->${afterRef}`,before_cut_ref:beforeRef,after_cut_ref:afterRef,checks,pass:Object.values(checks).every(Boolean),before_frame_root:beforeFrame?.render_output_root??null,after_frame_root:afterFrame?.render_output_root??null,visible_change:beforeFrame&&afterFrame?beforeFrame.render_output_root!==afterFrame.render_output_root:null})
  }
  return seal({format:'rncs.anime-cut-continuity-report.v0.1',version:'0.1.0-alpha.1',production_id:production.production_id,production_root:production.production_root,timeline_root:production.editorial_timeline?.timeline_root??null,status:seams.every(item=>item.pass&&item.visible_change!==false)?'pass':'fail',seam_count:seams.length,seams,boundary:'rooted technical seam checks; director and human visual acceptance remain separate',report_root:''},'report_root');
}

export function validateFrameSequenceIntegrity(manifest,{rootDir=null}={}){
  const errors=[],frames=manifest?.frames??[],cutRefs=new Set(),renderRoots=new Set(),dimensions=new Set();
  if(manifest?.rendered_frame_count!==frames.length)errors.push('FRAME_MANIFEST_RENDERED_COUNT_MISMATCH');
  if(manifest?.status==='complete'&&manifest?.expected_frame_count!==frames.length)errors.push('FRAME_SEQUENCE_INCOMPLETE');
  for(const [index,frame] of frames.entries()){
    if((frame.global_frame_number??frame.frame_number)!==index)errors.push(`FRAME_SEQUENCE_ORDER:${index}`);
    if(!frame.cut_ref)errors.push(`FRAME_CUT_REF_MISSING:${index}`);else cutRefs.add(frame.cut_ref);
    if(!frame.render_output_root)errors.push(`FRAME_MEDIA_ROOT_MISSING:${index}`);else renderRoots.add(frame.render_output_root);
    if(rootDir){const file=safeRelative(rootDir,frame.filename);if(!fs.existsSync(file)){errors.push(`FRAME_FILE_MISSING:${index}`);continue}const bytes=fs.readFileSync(file);if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))errors.push(`FRAME_PNG_INVALID:${index}`);if(bytes.length>=24){const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);dimensions.add(`${width}x${height}`);if(width!==manifest.width||height!==manifest.height)errors.push(`FRAME_DIMENSION_MISMATCH:${index}`)}if(rootHash(bytes.toString('base64'))!==frame.render_output_root)errors.push(`FRAME_MEDIA_ROOT_MISMATCH:${index}`)}
  }
  if(frames.length>1&&renderRoots.size<Math.min(3,frames.length))errors.push('FRAME_SEQUENCE_SINGLE_PLACEHOLDER_REPEAT');
  if(cutRefs.size!==(manifest?.cut_count??cutRefs.size))errors.push('FRAME_CUT_COVERAGE_MISMATCH');
  if(dimensions.size>1)errors.push('FRAME_DIMENSIONS_INCONSISTENT');
  return seal({format:'rncs.anime-frame-integrity-report.v0.1',version:'0.1.0-alpha.1',status:errors.length?'fail':'pass',errors,frame_count:frames.length,expected_frame_count:manifest?.expected_frame_count??null,cut_count:cutRefs.size,cut_refs:[...cutRefs],unique_frame_root_count:renderRoots.size,visual_variation_ratio:frames.length?renderRoots.size/frames.length:0,dimensions:[...dimensions],single_placeholder_repeat:frames.length>1&&renderRoots.size<Math.min(3,frames.length),sequence_root:manifest?.sequence_root??null,report_root:''},'report_root');
}

export function createAudioVideoSyncReport({production,frameManifest,audioReport,probeReport}){
  const expected=Number(production?.editorial_timeline?.total_duration_seconds??0),frameDuration=Number(frameManifest?.rendered_frame_count??0)/Number(frameManifest?.fps??1),audioDuration=Number(audioReport?.duration_seconds??0),videoDuration=Number(probeReport?.video?.duration_seconds??probeReport?.format?.duration_seconds??0),containerDuration=Number(probeReport?.format?.duration_seconds??videoDuration),frameTolerance=1/Math.max(1,Number(frameManifest?.fps??24)),audioTolerance=.08,checks={timeline_to_frames:Math.abs(expected-frameDuration)<=frameTolerance,timeline_to_audio:Math.abs(expected-audioDuration)<=audioTolerance,timeline_to_video:Math.abs(expected-videoDuration)<=Math.max(frameTolerance,.08),container_duration:Math.abs(expected-containerDuration)<=.12,audio_stream:Boolean(probeReport?.audio),video_stream:Boolean(probeReport?.video),frame_count:Number(probeReport?.video?.frame_count??0)===Number(frameManifest?.expected_frame_count??0)};
  return seal({format:'rncs.anime-audio-video-sync-report.v0.1',version:'0.1.0-alpha.1',production_root:production?.production_root??null,timeline_root:production?.editorial_timeline?.timeline_root??null,status:Object.values(checks).every(Boolean)?'pass':'fail',checks,tolerance:{frame_seconds:frameTolerance,audio_seconds:audioTolerance,container_seconds:.12},duration_seconds:{expected,frames:frameDuration,audio:audioDuration,video:videoDuration,container:containerDuration},frame_count:{expected:frameManifest?.expected_frame_count??null,probed:probeReport?.video?.frame_count??null},report_root:''},'report_root');
}

export function createSha256Inventory(rootDir,relativeFiles){
  const files=[...new Set(relativeFiles)].sort().map(relative=>{const file=safeRelative(rootDir,relative),bytes=fs.readFileSync(file);return{path:String(relative).replaceAll('\\','/'),bytes:bytes.length,sha256:sha256(bytes)}}),inventory={format:'rncs.sha256-inventory.v0.1',algorithm:'sha256',files,inventory_root:''};return seal(inventory,'inventory_root');
}
