import {compileReality,compileRealityToBytecode,RCL_LANGUAGE_VERSION} from '@taowind/reality-computation-language';
import {createAnimeProduction,rootHash,clone} from '../../../world/anime-production-runtime/src/index.mjs';
import {generateAnimeCharacterFamily,generateAnimeBackgroundFamily,validateAnimeCharacterFamily,validateAnimeBackgroundFamily} from '../../../world/reality-asset-genesis-fabric/src/index.mjs';
import {buildMouthTrackFromVoice} from '../../../world/voice-performance-runtime/src/index.mjs';
import {createAnimeRenderingProfile} from '../../../world/visual-state-runtime/src/unified-index.mjs';
import {createAnimeSecondaryMotionProfile,createDirectorMotionOverride,applyDirectorMotionOverride} from '../../../world/reality-simulation-runtime/src/unified-index.mjs';
import {parseAnimeSource} from './parser.mjs';

export const RCL_ANIME_DIALECT_VERSION='0.1.0-alpha.1';
function safeName(value){return String(value).replace(/[^a-zA-Z0-9_]/g,'_').replace(/^\d/,'_')||'AnimeForge'}
function frameNumber(value){return Math.round(Number(value)||0)}
function compileCutNode(scene,cutNode,sourceMap){
  const actor=cutNode.metadata.actor??{},dialogues=actor.dialogues??[];
  cutNode.dialogue_track=dialogues.map(item=>({dialogue_event_id:item.dialogue_event_id,actor_id:item.actor_id,text:item.text,start_frame:frameNumber(item.start_frame),end_frame:frameNumber(item.start_frame)+Math.max(1,Math.round(cutNode.fps*1.1)),voice_identity:item.voice_identity,emotion:item.emotion,mouth:item.mouth,close_mouth_on_end:item.close_mouth_on_end,authority:'voice-performance-provider'}));
  cutNode.voice_track=cutNode.dialogue_track.map(item=>({dialogue_event_id:item.dialogue_event_id,voice_identity:item.voice_identity,take_id:`take:${item.dialogue_event_id}:v1`,active:true}));
  cutNode.mouth_track=[];
  for(const dialogue of cutNode.dialogue_track)cutNode.mouth_track.push({dialogue_event_id:dialogue.dialogue_event_id,start_frame:dialogue.start_frame,end_frame:dialogue.end_frame,shape:'automatic_viseme',authority:'voice-performance-provider'});
  cutNode.facial_track.push({frame:0,expression:'restrained_question',eye_state:'open'});
  cutNode.gaze_track=[...(cutNode.gaze_track??[])].map(item=>({target:item.target,start_frame:item.frame,authority:'director'}));
  cutNode.blink_track=[...(cutNode.blink_track??[])].map(item=>({frame:item.frame,duration_frames:2,authority:'director'}));
  cutNode.key_pose_track=[...(cutNode.key_pose_track??[])].sort((a,b)=>a.frame-b.frame);
  const fps=cutNode.fps||24;
  cutNode.camera_track=cutNode.camera_track.map(item=>({...item,start_frame:Math.round((item.start??0)*fps),end_frame:Math.round((item.end??cutNode.duration)*fps)}));
  for(const [index,pose] of cutNode.key_pose_track.entries())sourceMap[`cut.${cutNode.cut_id}.keypose.${pose.pose_id}`]={kind:'KeyPose',line:pose.source?.line??1,column:pose.source?.column??1,index};
  for(const dialogue of cutNode.dialogue_track)sourceMap[`cut.${cutNode.cut_id}.dialogue.${dialogue.dialogue_event_id}`]={kind:'Dialogue',line:actor.dialogues.find(item=>item.dialogue_event_id===dialogue.dialogue_event_id)?.source?.line??1,column:actor.dialogues.find(item=>item.dialogue_event_id===dialogue.dialogue_event_id)?.source?.column??1};
  delete cutNode.metadata.actor;
  return cutNode;
}

export function buildProductionFromAst(ast){
  const episode=ast.episodes[0];if(!episode||episode.scenes.length===0)throw new Error('ANIME_SCENE_REQUIRED');
  const scene=episode.scenes[0],cutNode=scene.cuts[0];if(!cutNode)throw new Error('ANIME_CUT_REQUIRED');
  const cut=compileCutNode(scene,clone({...cutNode,fps:cutNode.fps===24?(scene.settings.fps??24):cutNode.fps,resolution:cutNode.resolution?.width===1920&&cutNode.resolution?.height===1080?(scene.settings.resolution??cutNode.resolution):cutNode.resolution}),ast.sourceMap);
  if(cut.background_layers.length===0)cut.background_layers.push({layer_id:'background:unnamed-city',asset_id:'background:unnamed-city',mode:'2.5d',depth:0.4,parallax:0.08});
  const actorId=cut.character_layers[0]?.actor_id??'蓝天临',characterAsset=generateAnimeCharacterFamily({assetId:cut.character_layers[0]?.asset_id??`character:${actorId}`,name:actorId}),backgroundAsset=generateAnimeBackgroundFamily({assetId:'background:unnamed-city',name:'无名城审判台'}),characterValidation=validateAnimeCharacterFamily(characterAsset.family),backgroundValidation=validateAnimeBackgroundFamily(backgroundAsset.family);if(!characterValidation.valid||!backgroundValidation.valid)throw Object.assign(new Error('RAGF_ANIME_FAMILY_INVALID'),{code:'RAGF_ANIME_FAMILY_INVALID',details:{character:characterValidation,background:backgroundValidation}});
  const renderingProfile=createAnimeRenderingProfile({profileId:`${ast.name}.${episode.episode_id}.${cut.cut_id}`,fps:cut.fps,resolution:cut.resolution,style:scene.settings.style??'japanese_tv_anime'});
  let motionProfile=createAnimeSecondaryMotionProfile({profileId:`${ast.name}.${episode.episode_id}.${cut.cut_id}`,hair:cut.animation.hair_secondary,coat:cut.animation.coat_secondary});
  for(const override of cut.secondary_motion_track??[]){const applied=createDirectorMotionOverride({...override,startFrame:override.start_frame,endFrame:override.end_frame});motionProfile=applyDirectorMotionOverride(motionProfile,applied);if(override.source)ast.sourceMap[`cut.${cut.cut_id}.motion.${applied.override_id}`]={kind:'SecondaryMotionOverride',line:override.source.line,column:override.source.column}}
  const production=createAnimeProduction({series:ast.name,episode:episode.episode_id,sequence:'SEQ01',scene:scene.scene_id,cut,asset_bindings:{character:{[actorId]:{asset_id:characterAsset.family.identity.asset_id,family_root:characterAsset.family.family_root,provider:characterAsset.family.provider}},background:{'unnamed-city':{asset_id:backgroundAsset.family.identity.asset_id,family_root:backgroundAsset.family.family_root,provider:backgroundAsset.family.provider}}},provider_bindings:{asset:'ragf.anime-reference-provider',voice:'taowind.voice-forge.reference',audio:'taowind.audio-forge.reference',render:'taowind.vsr.anime-reference-renderer',motion:'taowind.rsr.director-overridable-reference'},rendering_profile:renderingProfile,motion_profile:motionProfile,continuity_contract:{stable_identity:true,asset_roots:{character:characterAsset.family.family_root,background:backgroundAsset.family.family_root},voice_identity:cut.voice_track[0]?.voice_identity??null},quality_profile:{name:'anime-tv-reference-v0.1',level:'reference-not-commercial'},source_map:ast.sourceMap});
  return{production,asset_families:{character:characterAsset,background:backgroundAsset}};
}

export function buildShadowRcl(production){
  const cut=production.cut,name=safeName(`AnimeForge_${production.series}_${production.episode}`),dialogue=cut.dialogue_track[0];
  const values=[
    `facet anime.production_id : Text = ${JSON.stringify(production.production_id)}`,
    `facet anime.series : Text = ${JSON.stringify(production.series)}`,
    `facet anime.episode : Text = ${JSON.stringify(production.episode)}`,
    `facet anime.cut_id : Text = ${JSON.stringify(cut.cut_id)}`,
    `facet anime.cut.duration : Number = ${cut.duration}`,
    `facet anime.cut.fps : Number = ${cut.fps}`,
    `facet anime.cut.frame_count : Number = ${Math.round(cut.duration*cut.fps)}`,
    `facet anime.cut.mode : Text = ${JSON.stringify(cut.mode)}`,
    `facet anime.cut.dialogue_event_id : Text = ${JSON.stringify(dialogue?.dialogue_event_id??'none')}`,
  ];
  return{source:`reality ${name} {\n  ${values.join('\n  ')}\n}`,name,fields:values.length};
}

export function compileAnimeSource(source){
  const ast=parseAnimeSource(source),built=buildProductionFromAst(ast),production=built.production,shadow=buildShadowRcl(production),rclProgram=compileReality(shadow.source),bytecode=compileRealityToBytecode(shadow.source);
  const compiled={format:'rcl.anime-compiled-program.v0.1',version:RCL_ANIME_DIALECT_VERSION,dialect:'rcl-anime-compatibility-bridge',rcl_language_version:RCL_LANGUAGE_VERSION,source_root:ast.sourceRoot,production,source_map:clone(ast.sourceMap),shadow_rcl:shadow.source,shadow_program_root:rclProgram.programRoot,bytecode_length:bytecode.length,bytecode_root:rootHash([...bytecode]),bytecode:Buffer.from(bytecode),diagnostics:[],compiler:{kind:'rcl-anime-bridge',authority:'RNCS',external_provider_authority:false}};
  const rootInput={...compiled,production:{...compiled.production},asset_families:built.asset_families,bytecode:Buffer.from(bytecode).toString('base64')};delete rootInput.production.created_at;
  return{...compiled,asset_families:built.asset_families,compiled_root:rootHash(rootInput)};
}

export function tryCompileAnimeSource(source){try{return{ok:true,...compileAnimeSource(source)}}catch(error){return{ok:false,diagnostics:[{code:error.code??'ANIME_COMPILE_FAILURE',message:error.message,location:error.location??null,details:error.details??{}}]}}}

export function bindVoicePerformance(production,voiceBundle){
  const next=clone(production),dialogue=next.cut.dialogue_track.find(item=>item.dialogue_event_id===voiceBundle.dialogue_event_id)??next.cut.dialogue_track[0];
  if(!dialogue)throw Object.assign(new Error('DIALOGUE_EVENT_REQUIRED'),{code:'DIALOGUE_EVENT_REQUIRED'});
  const startSeconds=dialogue.start_frame/next.cut.fps,closeFrame=Math.ceil((startSeconds+voiceBundle.duration_seconds)*next.cut.fps);
  next.cut.voice_track=next.cut.voice_track.map(item=>({...item,active:false}));next.cut.voice_track.push({dialogue_event_id:dialogue.dialogue_event_id,voice_identity:voiceBundle.voice_identity,take_id:`take:${dialogue.dialogue_event_id}:v1`,voice_root:voiceBundle.bundle_root,active:true});next.cut.mouth_track=buildMouthTrackFromVoice(voiceBundle,{fps:next.cut.fps,closeFrame});dialogue.end_frame=closeFrame;dialogue.voice_bundle_root=voiceBundle.bundle_root;dialogue.mouth_authority='final-dialogue-audio';return createAnimeProduction({...next,created_at:next.created_at});
}

export function replaceDialogueTake(production,{dialogueEventId,voiceBundle}){
  const next=clone(production),dialogue=next.cut.dialogue_track.find(item=>item.dialogue_event_id===dialogueEventId);if(!dialogue)throw new Error(`DIALOGUE_EVENT_NOT_FOUND:${dialogueEventId}`);
  const active=next.cut.voice_track.filter(item=>item.dialogue_event_id===dialogueEventId);for(const item of active)item.active=false;
  const takeNumber=next.cut.voice_track.filter(item=>item.dialogue_event_id===dialogueEventId&&item.voice_root).length+1,startSeconds=dialogue.start_frame/next.cut.fps,closeFrame=Math.ceil((startSeconds+Number(voiceBundle.duration_seconds??1.1))*next.cut.fps);
  next.cut.voice_track.push({dialogue_event_id:dialogueEventId,voice_identity:voiceBundle.voice_identity,take_id:`take:${dialogueEventId}:v${takeNumber}`,voice_root:voiceBundle.bundle_root,active:true});next.cut.mouth_track=next.cut.mouth_track.filter(item=>item.dialogue_event_id!==dialogueEventId);next.cut.mouth_track.push(...buildMouthTrackFromVoice(voiceBundle,{fps:next.cut.fps,closeFrame}));dialogue.voice_bundle_root=voiceBundle.bundle_root;dialogue.end_frame=closeFrame;dialogue.mouth_authority='final-dialogue-audio';
  return createAnimeProduction({...next,created_at:next.created_at});
}
