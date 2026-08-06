import {clone,rootHash,seal,stableId,nowIso,verifySeal} from './canonical.mjs';
import {buildEditorialTimeline,canonicalCutRef,listProductionCuts,resolveProductionCut,validateEditorialTimeline} from './editorial.mjs';
import {createEpisodeAuthorityContract,createEpisodeCompositionContract,validateEpisodeAuthorityContract,validateEpisodeCompositionContract} from './composition.mjs';
import {createBuiltinAnimeProviderManifests,validateAnimeProviderManifest} from './provider.mjs';

export const ANIME_PRODUCTION_IR_FORMAT='rncs.anime-production-ir.v0.1';
export const ANIME_PRODUCTION_IR_VERSION='0.1.0-alpha.1';
export const ANIME_XSHEET_FORMAT='rncs.anime-exposure-sheet.v0.1';
export const ANIME_FRAME_EVIDENCE_FORMAT='rncs.anime-frame-evidence.v0.1';
export const ANIME_RENDER_PROFILE='anime-tv-reference-v0.1';
export const ANIME_MODES=Object.freeze(['native-2d','2.5d','3d-assisted-2d']);
export const ANIME_QUALITY_PROFILES=Object.freeze({
  preview:{width:960,height:540},
  standard:{width:1280,height:720},
  final:{width:1920,height:1080},
});

const TRACKS=['camera_track','background_layers','character_layers','key_pose_track','inbetween_track','exposure_sheet','facial_track','gaze_track','blink_track','mouth_track','dialogue_track','voice_track','ambience_track','foley_track','sfx_track','music_track','lighting_track','effect_track','composite_track','correction_track','secondary_motion_track'];
const cloneArray=value=>Array.isArray(value)?clone(value):[];

export function normalizeResolution(value={}){
  if(typeof value==='string'){
    const match=value.match(/^(\d+)x(\d+)$/);if(match)return{width:Number(match[1]),height:Number(match[2])};
  }
  return{width:Number(value.width??1920),height:Number(value.height??1080)};
}

export function normalizeCut(input={}){
  const duration=Number(input.duration??5),fps=Number(input.fps??24),resolution=normalizeResolution(input.resolution);
  const cut={
    episode_id:String(input.episode_id??'EP01'),sequence_id:String(input.sequence_id??'SEQ01'),scene_id:String(input.scene_id??'Scene'),
    cut_id:String(input.cut_id??'S01'),duration,fps,resolution,layout:String(input.layout??'medium_close_up'),mode:String(input.mode??'native-2d'),
    camera_track:cloneArray(input.camera_track),background_layers:cloneArray(input.background_layers),character_layers:cloneArray(input.character_layers),
    key_pose_track:cloneArray(input.key_pose_track),inbetween_track:cloneArray(input.inbetween_track),exposure_sheet:cloneArray(input.exposure_sheet),
    facial_track:cloneArray(input.facial_track),gaze_track:cloneArray(input.gaze_track),blink_track:cloneArray(input.blink_track),mouth_track:cloneArray(input.mouth_track),
    dialogue_track:cloneArray(input.dialogue_track),voice_track:cloneArray(input.voice_track),ambience_track:cloneArray(input.ambience_track),foley_track:cloneArray(input.foley_track),
    sfx_track:cloneArray(input.sfx_track),music_track:cloneArray(input.music_track),lighting_track:cloneArray(input.lighting_track),effect_track:cloneArray(input.effect_track),
    composite_track:cloneArray(input.composite_track),correction_track:cloneArray(input.correction_track),
    secondary_motion_track:cloneArray(input.secondary_motion_track),
    animation:{exposure:input.animation?.exposure??'on_twos',hair_secondary:input.animation?.hair_secondary??'subtle',coat_secondary:input.animation?.coat_secondary??'subtle',...clone(input.animation??{})},
    transition:{type:String(input.transition?.type??'hard-cut'),duration_frames:Number(input.transition?.duration_frames??0)},
    editorial_index:Number(input.editorial_index??0),
    authority:{derived_from_episode:true,creative_authority:false,local_patch_scope:true,...clone(input.authority??{})},
    metadata:{...clone(input.metadata??{})},
  };
  return{...cut,cut_ref:canonicalCutRef({...cut,cut_ref:input.cut_ref})};
}

export function createAnimeProduction(input={}){
  const rawCuts=Array.isArray(input.cuts)&&input.cuts.length?input.cuts:[input.cut??{}];
  const cuts=rawCuts.map((raw,index)=>normalizeCut({...raw,editorial_index:raw?.editorial_index??index}));
  const provisionalId=String(input.production_id??stableId('anime-production',{series:input.series??'Untitled',episode:input.episode??cuts[0]?.episode_id??'EP01',cuts:cuts.map(canonicalCutRef)}));
  const activeCut=resolveProductionCut({cuts,active_cut_ref:input.active_cut_ref},input.active_cut_ref??cuts[0]?.cut_ref);
  const activeCutRef=canonicalCutRef(activeCut);
  const renderingProfiles=clone(input.rendering_profiles??{}),motionProfiles=clone(input.motion_profiles??{});
  for(const cut of cuts){
    const cutRef=canonicalCutRef(cut);
    if(!renderingProfiles[cutRef]&&input.rendering_profile)renderingProfiles[cutRef]=clone(input.rendering_profile);
    if(!motionProfiles[cutRef]&&input.motion_profile)motionProfiles[cutRef]=clone(input.motion_profile);
  }
  const editorialTimeline=buildEditorialTimeline(cuts,{productionId:provisionalId,transitionPolicy:input.editorial_timeline?.transition_policy??'hard-cut'});
  const episodeIntentRoot=String(input.episode_intent_root??rootHash({series:input.series??'Untitled Series',episode:input.episode??cuts[0]?.episode_id??'EP01',cut_refs:cuts.map(canonicalCutRef)}));
  const authorityContract=createEpisodeAuthorityContract({episode_id:input.episode??cuts[0]?.episode_id??'EP01',source_intent_root:episodeIntentRoot});
  const compositionContract=createEpisodeCompositionContract({production_id:provisionalId,cuts,editorial_timeline:editorialTimeline,rendering_profiles:renderingProfiles,rendering_profile:input.rendering_profile});
  const providerManifests=clone(input.provider_manifests??createBuiltinAnimeProviderManifests());
  const production={
    format:ANIME_PRODUCTION_IR_FORMAT,version:ANIME_PRODUCTION_IR_VERSION,
    production_id:provisionalId,
    series:String(input.series??'Untitled Series'),episode:String(input.episode??cuts[0]?.episode_id??'EP01'),sequence:String(input.sequence??cuts[0]?.sequence_id??'SEQ01'),scene:String(input.scene??cuts[0]?.scene_id??'Scene'),
    cuts,active_cut_ref:activeCutRef,cut:clone(activeCut),editorial_timeline:editorialTimeline,
    episode_intent_root:episodeIntentRoot,authority_contract:authorityContract,composition_contract:compositionContract,
    asset_bindings:clone(input.asset_bindings??{}),provider_bindings:clone(input.provider_bindings??{}),
    provider_manifests:providerManifests,provider_manifest_root:rootHash(providerManifests.map(item=>item.manifest_root)),
    continuity_contract:{stable_identity:true,asset_roots:clone(input.continuity_contract?.asset_roots??{}),voice_identity:input.continuity_contract?.voice_identity??null, ...clone(input.continuity_contract??{})},
    quality_profile:{name:input.quality_profile?.name??ANIME_RENDER_PROFILE,level:input.quality_profile?.level??'reference',line_stability:'deterministic',shadow_bands:3,...clone(input.quality_profile??{})},
    rendering_profiles:renderingProfiles,motion_profiles:motionProfiles,
    rendering_profile:clone(renderingProfiles[activeCutRef]??input.rendering_profile??{}),motion_profile:clone(motionProfiles[activeCutRef]??input.motion_profile??{}),
    evidence_policy:{frame_receipts:true,provider_receipts:true,hash_algorithm:'sha256-rncs-canonical-v1',...clone(input.evidence_policy??{})},
    export_policy:{frame_sequence:true,audio_stems:true,master_audio:true,video_format:'mp4',video_codec:'h264',audio_codec:'aac',...clone(input.export_policy??{})},
    created_at:String(input.created_at??nowIso()),source_map:clone(input.source_map??{}),
  };
  return seal(production,'production_root',['created_at']);
}

export function bindCharacterAssetFamily(production,family,{actorId=null,cutId=null,visualProfile=null,bodyProfile=null}={}){
  if(family?.format!=='ragf.character-asset-family.v0.1'||!verifySeal(family,'family_root'))throw Object.assign(new Error('ANIME_CHARACTER_FAMILY_INVALID'),{code:'ANIME_CHARACTER_FAMILY_INVALID'});
  if(!family?.quality?.valid||family?.continuity?.status!=='pass')throw Object.assign(new Error('ANIME_CHARACTER_FAMILY_QUALITY_REQUIRED'),{code:'ANIME_CHARACTER_FAMILY_QUALITY_REQUIRED'});
  const next=clone(production),targetCut=cutId?resolveProductionCut(next,cutId):resolveProductionCut(next),resolvedActor=actorId??targetCut.character_layers[0]?.actor_id;if(!resolvedActor)throw Object.assign(new Error('ANIME_CHARACTER_ACTOR_REQUIRED'),{code:'ANIME_CHARACTER_ACTOR_REQUIRED'});
  const binding={format:'rncs.anime-character-asset-binding.v0.1',actor_id:resolvedActor,character_id:family.character_id,asset_id:family.character_id,asset_family_id:family.asset_family_id,family_root:family.family_root,asset_root:family.asset_root,genome_root:family.genome_root,identity_root:family.identity_root,identity_signature_root:family.identity_signature.signature_root,topology_family:family.topology_family,appearance:clone(family.appearance??{}),palette:clone(family.palette??{}),proportions:clone(family.proportions??{}),modes:clone(family.cross_media?.modes??[]),provider:{id:family.provider_receipt.provider_id,receipt_root:family.provider_receipt.receipt_root,license:family.license},runtime_profiles:{vsr:visualProfile?.profile_root??family.runtime_profiles?.vsr?.profile_root??null,rsr:bodyProfile?.profile_root??family.runtime_profiles?.rsr?.profile_root??null},authority:{identity:'RNCS Character Genome',presentation:'Anime Forge',identity_mutation:'forbidden'}};binding.binding_root=rootHash(binding);
  const selectedRef=cutId?canonicalCutRef(targetCut):null;
  next.asset_bindings.character={...(next.asset_bindings.character??{}),[resolvedActor]:binding};
  next.cuts=listProductionCuts(next).map(cut=>{
    if(selectedRef&&canonicalCutRef(cut)!==selectedRef)return cut;
    if(!cut.character_layers.some(layer=>layer.actor_id===resolvedActor))return cut;
    return{...cut,character_layers:cut.character_layers.map(layer=>layer.actor_id===resolvedActor?{...layer,asset_id:family.character_id,asset_family_id:family.asset_family_id,family_root:family.family_root,identity_root:family.identity_root,identity_signature_root:family.identity_signature.signature_root,mode:cut.mode}:layer)};
  });
  next.provider_bindings.asset=family.provider_receipt.provider_id;next.continuity_contract={...next.continuity_contract,stable_identity:true,asset_roots:{...(next.continuity_contract.asset_roots??{}),character:family.family_root,[`character:${resolvedActor}`]:family.family_root},character_identity_roots:{...(next.continuity_contract.character_identity_roots??{}),[resolvedActor]:family.identity_root},character_signature_roots:{...(next.continuity_contract.character_signature_roots??{}),[resolvedActor]:family.identity_signature.signature_root}};return createAnimeProduction({...next,created_at:next.created_at});
}

export function validateAnimeProduction(production){
  const errors=[],warnings=[];
  if(production?.format!==ANIME_PRODUCTION_IR_FORMAT)errors.push('PRODUCTION_FORMAT_INVALID');
  if(!production?.production_id)errors.push('PRODUCTION_ID_REQUIRED');
  if(!production?.episode_intent_root)errors.push('EPISODE_INTENT_ROOT_REQUIRED');
  const authorityValidation=validateEpisodeAuthorityContract(production?.authority_contract);errors.push(...authorityValidation.errors);
  const compositionValidation=validateEpisodeCompositionContract(production?.composition_contract,production);errors.push(...compositionValidation.errors);
  for(const manifest of production?.provider_manifests??[]){const validation=validateAnimeProviderManifest(manifest);errors.push(...validation.errors.map(error=>`${manifest?.provider_id??'unknown'}:${error}`))}
  if(production?.provider_manifest_root!==rootHash((production?.provider_manifests??[]).map(item=>item.manifest_root)))errors.push('PROVIDER_MANIFEST_ROOT_MISMATCH');
  const cuts=listProductionCuts(production),cutSummaries=[],dialogueIds=new Set(),identityByActor=new Map(),familyByActor=new Map();
  if(!cuts.length)errors.push('CUT_REQUIRED');
  for(const cut of cuts){
    const cutRef=canonicalCutRef(cut),resolution=normalizeResolution(cut?.resolution),frameCount=Math.round(Number(cut?.duration||0)*Number(cut?.fps||0));
    if(!cut?.cut_id)errors.push(`CUT_ID_REQUIRED:${cutRef}`);
    if(!(Number(cut?.duration)>0))errors.push(`CUT_DURATION_INVALID:${cutRef}`);
    if(!(Number(cut?.fps)>0))errors.push(`CUT_FPS_INVALID:${cutRef}`);
    if(resolution.width<16||resolution.height<16)errors.push(`CUT_RESOLUTION_INVALID:${cutRef}`);
    if(!ANIME_MODES.includes(cut?.mode))errors.push(`CUT_MODE_UNSUPPORTED:${cutRef}:${cut?.mode}`);
    if(cut?.authority?.derived_from_episode!==true||cut?.authority?.creative_authority!==false)errors.push(`CUT_AUTHORITY_INVALID:${cutRef}`);
    if(!['on_ones','on_twos','on_threes','hold','stepped'].includes(cut?.animation?.exposure))errors.push(`EXPOSURE_MODE_INVALID:${cutRef}`);
    if(frameCount<1)errors.push(`FRAME_COUNT_INVALID:${cutRef}`);
    for(const event of cut.dialogue_track??[]){if(dialogueIds.has(event.dialogue_event_id))errors.push(`DIALOGUE_EVENT_ID_DUPLICATE:${event.dialogue_event_id}`);dialogueIds.add(event.dialogue_event_id)}
    if(!cut?.character_layers?.length)warnings.push(`CHARACTER_LAYER_MISSING:${cutRef}`);
    if(!cut?.background_layers?.length)warnings.push(`BACKGROUND_LAYER_MISSING:${cutRef}`);
    for(const layer of cut.character_layers??[]){
      const actor=layer.actor_id;if(!actor)continue;
      const identity=layer.identity_root??layer.identity_signature_root??null,family=layer.family_root??layer.asset_family_id??layer.asset_id??null;
      if(identity&&identityByActor.has(actor)&&identityByActor.get(actor)!==identity)errors.push(`CHARACTER_IDENTITY_DRIFT:${actor}:${cutRef}`);
      if(family&&familyByActor.has(actor)&&familyByActor.get(actor)!==family)errors.push(`CHARACTER_ASSET_DRIFT:${actor}:${cutRef}`);
      if(identity)identityByActor.set(actor,identity);if(family)familyByActor.set(actor,family);
    }
    if(!production?.rendering_profiles?.[cutRef]?.format)warnings.push(`VSR_ANIME_PROFILE_MISSING:${cutRef}`);
    if(!production?.motion_profiles?.[cutRef]?.format)warnings.push(`RSR_ANIME_MOTION_PROFILE_MISSING:${cutRef}`);
    cutSummaries.push({cut_ref:cutRef,frame_count:frameCount,duration:cut.duration,fps:cut.fps});
  }
  const timelineValidation=validateEditorialTimeline(production?.editorial_timeline,cuts);errors.push(...timelineValidation.errors);
  try{const active=resolveProductionCut(production);if(canonicalCutRef(active)!==canonicalCutRef(production?.cut??{}))errors.push('ACTIVE_CUT_COMPATIBILITY_MISMATCH')}catch(error){errors.push(error.code??error.message)}
  if(!production?.source_map||Object.keys(production.source_map).length===0)warnings.push('SOURCE_MAP_EMPTY');
  return{valid:errors.length===0,errors:[...new Set(errors)],warnings:[...new Set(warnings)],frame_count:cutSummaries.find(item=>item.cut_ref===production?.active_cut_ref)?.frame_count??cutSummaries[0]?.frame_count??0,total_frame_count:timelineValidation.total_frame_count,cut_count:cuts.length,cuts:cutSummaries,production_root:production?.production_root??null,timeline_root:production?.editorial_timeline?.timeline_root??null};
}

export function assertValidAnimeProduction(production){const result=validateAnimeProduction(production);if(!result.valid)throw Object.assign(new Error(result.errors.join(',')),{code:'ANIME_PRODUCTION_INVALID',details:result});return production}

export function createFrameEvidence({production,cut,frameNumber,state,assetRoots={},providerReceipts=[],renderReceipt}){
  const cutRef=canonicalCutRef(cut),payload={format:ANIME_FRAME_EVIDENCE_FORMAT,version:'0.1.0-alpha.1',frame_id:`${cutRef}:f${String(frameNumber).padStart(4,'0')}`,cut_ref:cutRef,cut_id:cut.cut_id,frame_number:frameNumber,state_root:rootHash(state),asset_roots:clone(assetRoots),provider_receipts:clone(providerReceipts),render_receipt:clone(renderReceipt),production_root:production.production_root};
  return seal(payload,'evidence_root');
}

export function createProviderReceipt({provider_id,version='0.1.0',capability,mode='reference',input_root,output_root,authority='candidate'}){
  return seal({provider_id,version,capability,mode,input_root:input_root??null,output_root:output_root??null,authority,quality_boundary:mode==='reference'?'deterministic reference provider':'external provider evidence required'},'receipt_root');
}

export function normalizeTrackNames(cut){return Object.fromEntries(TRACKS.map(name=>[name,cut?.[name]?.length??0]))}
