import {compileReality,compileRealityToBytecode,RCL_LANGUAGE_VERSION} from '@taowind/reality-computation-language';
import {assertValidAnimeProduction,canonicalCutRef,createAnimeProduction,listProductionCuts,replaceProductionCutData,rootHash,clone} from '../../../world/anime-production-runtime/src/index.mjs';
import {generateAnimeCharacterFamily,generateAnimeBackgroundFamily,validateAnimeCharacterFamily,validateAnimeBackgroundFamily} from '../../../world/reality-asset-genesis-fabric/src/index.mjs';
import {createCharacterGenome,createCharacterIdentitySignature,validateCharacterGenome} from '../../../world/character-genome-runtime/src/index.mjs';
import {buildMouthTrackFromVoice} from '../../../world/voice-performance-runtime/src/index.mjs';
import {createAnimeRenderingProfile} from '../../../world/visual-state-runtime/src/unified-index.mjs';
import {createAnimeSecondaryMotionProfile,createDirectorMotionOverride,applyDirectorMotionOverride} from '../../../world/reality-simulation-runtime/src/unified-index.mjs';
import {parseAnimeSource} from './parser.mjs';

export const RCL_ANIME_DIALECT_VERSION='0.1.0-alpha.1';
function safeName(value){return String(value).replace(/[^a-zA-Z0-9_]/g,'_').replace(/^\d/,'_')||'AnimeForge'}
function frameNumber(value){return Math.round(Number(value)||0)}
function compileCutNode(scene,cutNode,sourceMap){
  const actors=cutNode.metadata.actors?.length?cutNode.metadata.actors:(cutNode.metadata.actor?[cutNode.metadata.actor]:[]),dialogues=actors.flatMap(actor=>actor.dialogues??[]),cutRef=canonicalCutRef(cutNode);
  cutNode.dialogue_track=dialogues.map(item=>({dialogue_event_id:item.dialogue_event_id,actor_id:item.actor_id,text:item.text,start_frame:frameNumber(item.start_frame),end_frame:frameNumber(item.start_frame)+Math.max(1,Math.round(cutNode.fps*1.1)),voice_identity:item.voice_identity,emotion:item.emotion,mouth:item.mouth,close_mouth_on_end:item.close_mouth_on_end,authority:'voice-performance-provider'}));
  cutNode.voice_track=cutNode.dialogue_track.map(item=>({dialogue_event_id:item.dialogue_event_id,voice_identity:item.voice_identity,take_id:`take:${item.dialogue_event_id}:intent`,active:true}));
  cutNode.mouth_track=[];
  for(const dialogue of cutNode.dialogue_track)cutNode.mouth_track.push({dialogue_event_id:dialogue.dialogue_event_id,start_frame:dialogue.start_frame,end_frame:dialogue.end_frame,shape:'automatic_viseme',authority:'voice-performance-provider'});
  cutNode.facial_track.push({frame:0,expression:'restrained_question',eye_state:'open'});
  cutNode.gaze_track=[...(cutNode.gaze_track??[])].map(item=>({target:item.target,start_frame:item.frame,authority:'director'}));
  cutNode.blink_track=[...(cutNode.blink_track??[])].map(item=>({frame:item.frame,duration_frames:2,authority:'director'}));
  cutNode.key_pose_track=[...(cutNode.key_pose_track??[])].sort((a,b)=>a.frame-b.frame);
  const fps=cutNode.fps||24;
  cutNode.camera_track=cutNode.camera_track.map(item=>({...item,start_frame:Math.round((item.start??0)*fps),end_frame:Math.round((item.end??cutNode.duration)*fps)}));
  const lastFrame=Math.max(0,Math.round(cutNode.duration*fps)-1);
  if(!cutNode.composite_track.length)cutNode.composite_track.push({composite_id:`composite:${cutRef}`,start_frame:0,end_frame:lastFrame,layers:['background','atmosphere','character','foreground','effects','lighting','correction'],opacity:{atmosphere:.34,foreground:.78,effects:.72},crop:'programme-canvas',mask:'bounded-layer-masks',authority:'episode-composition-contract'});
  if(!cutNode.effect_track.length)cutNode.effect_track.push({effect_id:`effect:${cutRef}:cold-wind`,kind:'wind-particles',start_frame:0,end_frame:lastFrame,intensity:.42,authority:'episode-intent'});
  cutNode.metadata={...cutNode.metadata,exposure_anchor:'cold-overcast-v1',colour_anchor:'shenlin-cold-court-v1'};
  for(const [index,pose] of cutNode.key_pose_track.entries()){
    const location={kind:'KeyPose',line:pose.source?.line??1,column:pose.source?.column??1,index};sourceMap[`cuts.${cutRef}.keypose.${pose.pose_id}`]=location;sourceMap[`cut.${cutNode.cut_id}.keypose.${pose.pose_id}`]??=location;
  }
  for(const dialogue of cutNode.dialogue_track){
    const parsed=dialogues.find(item=>item.dialogue_event_id===dialogue.dialogue_event_id),location={kind:'Dialogue',line:parsed?.source?.line??1,column:parsed?.source?.column??1};sourceMap[`cuts.${cutRef}.dialogue.${dialogue.dialogue_event_id}`]=location;sourceMap[`cut.${cutNode.cut_id}.dialogue.${dialogue.dialogue_event_id}`]??=location;
  }
  delete cutNode.metadata.actor;delete cutNode.metadata.actors;
  return cutNode;
}

export function buildProductionFromAst(ast){
  if(!ast.episodes.length||!ast.episodes.some(episode=>episode.scenes.length))throw new Error('ANIME_SCENE_REQUIRED');
  const cuts=[],renderingProfiles={},motionProfiles={},characterAssets=new Map(),characterGenomes=new Map(),characterSignatures=new Map(),backgroundAssets=new Map(),characterBindings={},backgroundBindings={},assetRoots={};let editorialIndex=0;
  for(const [episodeIndex,episode] of ast.episodes.entries())for(const [sceneIndex,scene] of episode.scenes.entries())for(const cutNode of scene.cuts){
    const sequenceId=`SEQ${String(sceneIndex+1).padStart(2,'0')}`,cut=compileCutNode(scene,clone({...cutNode,episode_id:episode.episode_id,sequence_id:sequenceId,scene_id:scene.scene_id,editorial_index:editorialIndex,fps:cutNode.fps===24?(scene.settings.fps??24):cutNode.fps,resolution:cutNode.resolution?.width===1920&&cutNode.resolution?.height===1080?(scene.settings.resolution??cutNode.resolution):cutNode.resolution}),ast.sourceMap);
    if(cut.background_layers.length===0)cut.background_layers.push({layer_id:'background:unnamed-city',asset_id:'background:unnamed-city',mode:'2.5d',depth:0.4,parallax:0.08});
    for(const layer of cut.character_layers){
      const assetId=layer.asset_id??`character:${layer.actor_id}`;
      if(!characterAssets.has(assetId)){
        const genome=createCharacterGenome({character_id:assetId,name:layer.actor_id,seed:`anime-forge:${assetId}`,state_overlays:{expression:'neutral',combat_state:'restrained-stand'}}),genomeValidation=validateCharacterGenome(genome);if(!genomeValidation.valid)throw Object.assign(new Error('RAGF_CHARACTER_GENOME_INVALID'),{code:'RAGF_CHARACTER_GENOME_INVALID',details:genomeValidation});
        const signature=createCharacterIdentitySignature(genome);characterGenomes.set(assetId,genome);characterSignatures.set(assetId,signature);characterAssets.set(assetId,generateAnimeCharacterFamily({assetId,name:layer.actor_id,genome,identitySignature:signature,seed:genome.lineage.seed}));
      }
      const generated=characterAssets.get(assetId),genome=characterGenomes.get(assetId),signature=characterSignatures.get(assetId),validation=validateAnimeCharacterFamily(generated.family);if(!validation.valid)throw Object.assign(new Error('RAGF_ANIME_FAMILY_INVALID'),{code:'RAGF_ANIME_FAMILY_INVALID',details:{character:validation}});
      layer.asset_id=generated.family.identity.asset_id;layer.family_root=generated.family.family_root;layer.asset_root=generated.family.asset_root;layer.genome_root=genome.genome_root;layer.identity_root=genome.identity_root;layer.identity_signature_root=signature.signature_root;layer.palette_root=generated.family.palette_root;layer.proportion_root=generated.family.proportion_root;layer.appearance_root=generated.family.continuity_bundle.appearance_root;
      characterBindings[layer.actor_id]={format:'rncs.anime-character-asset-binding.v0.1',actor_id:layer.actor_id,character_id:genome.character_id,asset_id:generated.family.identity.asset_id,asset_family_id:generated.family.family_root,family_root:generated.family.family_root,asset_root:generated.family.asset_root,genome_root:genome.genome_root,identity_root:genome.identity_root,identity_signature_root:signature.signature_root,palette_root:generated.family.palette_root,proportion_root:generated.family.proportion_root,appearance_root:generated.family.continuity_bundle.appearance_root,topology_family:genome.topology_family,appearance:generated.family.appearance,palette:generated.family.palette,proportions:generated.family.proportions,face_features:generated.family.face_features,quality:generated.family.quality,provider:{id:generated.family.provider.id,receipt_root:generated.family.provider_receipt.receipt_root,license:generated.family.provider.license},authority:{identity:'RNCS Character Genome',presentation:'Anime Forge',identity_mutation:'forbidden'}};characterBindings[layer.actor_id].binding_root=rootHash(characterBindings[layer.actor_id]);assetRoots[`character:${layer.actor_id}`]=generated.family.family_root;
    }
    for(const layer of cut.background_layers){
      const assetId=layer.asset_id??'background:unnamed-city';if(!backgroundAssets.has(assetId))backgroundAssets.set(assetId,generateAnimeBackgroundFamily({assetId,name:scene.scene_id}));
      const generated=backgroundAssets.get(assetId),validation=validateAnimeBackgroundFamily(generated.family);if(!validation.valid)throw Object.assign(new Error('RAGF_ANIME_FAMILY_INVALID'),{code:'RAGF_ANIME_FAMILY_INVALID',details:{background:validation}});
      layer.asset_id=generated.family.identity.asset_id;layer.family_root=generated.family.family_root;backgroundBindings[assetId]={asset_id:generated.family.identity.asset_id,family_root:generated.family.family_root,provider:generated.family.provider};assetRoots[`background:${assetId}`]=generated.family.family_root;
    }
    const cutRef=canonicalCutRef(cut);renderingProfiles[cutRef]=createAnimeRenderingProfile({profileId:`${ast.name}.${episode.episode_id}.${cut.cut_id}`,fps:cut.fps,resolution:cut.resolution,style:scene.settings.style??'japanese_tv_anime',colourAnchor:cut.metadata?.colour_anchor??'programme-neutral-v1',exposureAnchor:cut.metadata?.exposure_anchor??'programme-reference-v1'});
    let motionProfile=createAnimeSecondaryMotionProfile({profileId:`${ast.name}.${episode.episode_id}.${cut.cut_id}`,hair:cut.animation.hair_secondary,coat:cut.animation.coat_secondary});
    for(const override of cut.secondary_motion_track??[]){const applied=createDirectorMotionOverride({...override,startFrame:override.start_frame,endFrame:override.end_frame});motionProfile=applyDirectorMotionOverride(motionProfile,applied);if(override.source){const location={kind:'SecondaryMotionOverride',line:override.source.line,column:override.source.column};ast.sourceMap[`cuts.${cutRef}.motion.${applied.override_id}`]=location;ast.sourceMap[`cut.${cut.cut_id}.motion.${applied.override_id}`]??=location}}
    motionProfiles[cutRef]=motionProfile;cuts.push(cut);editorialIndex++;
  }
  if(!cuts.length)throw new Error('ANIME_CUT_REQUIRED');
  const firstCharacter=characterAssets.values().next().value??null,firstBackground=backgroundAssets.values().next().value??null;
  if(firstCharacter)assetRoots.character=firstCharacter.family.family_root;if(firstBackground)assetRoots.background=firstBackground.family.family_root;
  const production=createAnimeProduction({series:ast.name,episode:cuts[0].episode_id,sequence:cuts[0].sequence_id,scene:cuts[0].scene_id,cuts,episode_intent_root:ast.sourceRoot,asset_bindings:{character:characterBindings,background:backgroundBindings},provider_bindings:{asset:'ragf.anime-builtin-generator',voice:'taowind.voice-forge.reference-synthetic-v0.1',audio:'taowind.audio-forge.reference-mixer-v0.1',render:'vsr.anime-builtin-rasterizer',motion:'rsr.anime-secondary-motion-reference'},rendering_profiles:renderingProfiles,motion_profiles:motionProfiles,continuity_contract:{stable_identity:true,asset_roots:assetRoots,character_identity_roots:Object.fromEntries(Object.entries(characterBindings).map(([actor,binding])=>[actor,binding.identity_root])),character_signature_roots:Object.fromEntries(Object.entries(characterBindings).map(([actor,binding])=>[actor,binding.identity_signature_root])),character_palette_roots:Object.fromEntries(Object.entries(characterBindings).map(([actor,binding])=>[actor,binding.palette_root])),character_proportion_roots:Object.fromEntries(Object.entries(characterBindings).map(([actor,binding])=>[actor,binding.proportion_root])),voice_identity:cuts.flatMap(cut=>cut.voice_track)[0]?.voice_identity??null},quality_profile:{name:'anime-tv-reference-v0.1',level:'experimental-built-in-anime'},source_map:ast.sourceMap});
  assertValidAnimeProduction(production);
  return{production,asset_families:{character:firstCharacter,background:firstBackground,characters:Object.fromEntries(characterAssets),backgrounds:Object.fromEntries(backgroundAssets),character_genomes:Object.fromEntries(characterGenomes),character_signatures:Object.fromEntries(characterSignatures)}};
}

export function buildShadowRcl(production){
  const cut=production.cut,name=safeName(`AnimeForge_${production.series}_${production.episode}`),dialogue=cut.dialogue_track[0];
  const values=[
    `facet anime.production_id : Text = ${JSON.stringify(production.production_id)}`,
    `facet anime.series : Text = ${JSON.stringify(production.series)}`,
    `facet anime.episode : Text = ${JSON.stringify(production.episode)}`,
    `facet anime.cut_count : Number = ${production.cuts?.length??1}`,
    `facet anime.total_frame_count : Number = ${production.editorial_timeline?.total_frame_count??Math.round(cut.duration*cut.fps)}`,
    `facet anime.timeline_root : Text = ${JSON.stringify(production.editorial_timeline?.timeline_root??'none')}`,
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
  const next=clone(production),located=findDialogueCut(next,voiceBundle.dialogue_event_id);if(voiceBundle.dialogue_event_id&&!located)throw Object.assign(new Error(`DIALOGUE_EVENT_NOT_FOUND:${voiceBundle.dialogue_event_id}`),{code:'DIALOGUE_EVENT_NOT_FOUND'});const cut=located?.cut??listProductionCuts(next)[0],dialogue=located?.dialogue??cut?.dialogue_track?.[0];
  if(!dialogue)throw Object.assign(new Error('DIALOGUE_EVENT_REQUIRED'),{code:'DIALOGUE_EVENT_REQUIRED'});
  const startSeconds=dialogue.start_frame/cut.fps,closeFrame=Math.ceil((startSeconds+voiceBundle.duration_seconds)*cut.fps);
  cut.voice_track=cut.voice_track.map(item=>item.dialogue_event_id===dialogue.dialogue_event_id?{...item,active:false}:item);cut.voice_track.push({dialogue_event_id:dialogue.dialogue_event_id,voice_identity:voiceBundle.voice_identity,take_id:`take:${dialogue.dialogue_event_id}:v1`,voice_root:voiceBundle.bundle_root,active:true});cut.mouth_track=cut.mouth_track.filter(item=>item.dialogue_event_id!==dialogue.dialogue_event_id);cut.mouth_track.push(...buildMouthTrackFromVoice(voiceBundle,{fps:cut.fps,closeFrame}));dialogue.end_frame=closeFrame;dialogue.voice_bundle_root=voiceBundle.bundle_root;dialogue.mouth_authority='final-dialogue-audio';return createAnimeProduction({...replaceProductionCutData(next,cut),created_at:next.created_at});
}

export function replaceDialogueTake(production,{dialogueEventId,voiceBundle}){
  const next=clone(production),located=findDialogueCut(next,dialogueEventId);if(!located)throw new Error(`DIALOGUE_EVENT_NOT_FOUND:${dialogueEventId}`);const{cut,dialogue}=located;
  const active=cut.voice_track.filter(item=>item.dialogue_event_id===dialogueEventId);for(const item of active)item.active=false;
  const takeNumber=cut.voice_track.filter(item=>item.dialogue_event_id===dialogueEventId&&item.voice_root).length+1,startSeconds=dialogue.start_frame/cut.fps,closeFrame=Math.ceil((startSeconds+Number(voiceBundle.duration_seconds??1.1))*cut.fps);
  cut.voice_track.push({dialogue_event_id:dialogueEventId,voice_identity:voiceBundle.voice_identity,take_id:`take:${dialogueEventId}:v${takeNumber}`,voice_root:voiceBundle.bundle_root,active:true});cut.mouth_track=cut.mouth_track.filter(item=>item.dialogue_event_id!==dialogueEventId);cut.mouth_track.push(...buildMouthTrackFromVoice(voiceBundle,{fps:cut.fps,closeFrame}));dialogue.voice_bundle_root=voiceBundle.bundle_root;dialogue.end_frame=closeFrame;dialogue.mouth_authority='final-dialogue-audio';
  return createAnimeProduction({...replaceProductionCutData(next,cut),created_at:next.created_at});
}

function findDialogueCut(production,dialogueEventId){for(const cut of listProductionCuts(production)){const dialogue=cut.dialogue_track.find(item=>item.dialogue_event_id===dialogueEventId);if(dialogue)return{cut,dialogue}}return null}
