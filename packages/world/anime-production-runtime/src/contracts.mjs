import {clone,rootHash,seal,stableId,nowIso,verifySeal} from './canonical.mjs';

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
    cut_id:String(input.cut_id??'S01'),duration,fps,resolution,layout:String(input.layout??'medium_close_up'),mode:String(input.mode??'native-2d'),
    camera_track:cloneArray(input.camera_track),background_layers:cloneArray(input.background_layers),character_layers:cloneArray(input.character_layers),
    key_pose_track:cloneArray(input.key_pose_track),inbetween_track:cloneArray(input.inbetween_track),exposure_sheet:cloneArray(input.exposure_sheet),
    facial_track:cloneArray(input.facial_track),gaze_track:cloneArray(input.gaze_track),blink_track:cloneArray(input.blink_track),mouth_track:cloneArray(input.mouth_track),
    dialogue_track:cloneArray(input.dialogue_track),voice_track:cloneArray(input.voice_track),ambience_track:cloneArray(input.ambience_track),foley_track:cloneArray(input.foley_track),
    sfx_track:cloneArray(input.sfx_track),music_track:cloneArray(input.music_track),lighting_track:cloneArray(input.lighting_track),effect_track:cloneArray(input.effect_track),
    composite_track:cloneArray(input.composite_track),correction_track:cloneArray(input.correction_track),
    secondary_motion_track:cloneArray(input.secondary_motion_track),
    animation:{exposure:input.animation?.exposure??'on_twos',hair_secondary:input.animation?.hair_secondary??'subtle',coat_secondary:input.animation?.coat_secondary??'subtle',...clone(input.animation??{})},
    metadata:{...clone(input.metadata??{})},
  };
  return cut;
}

export function createAnimeProduction(input={}){
  const cut=normalizeCut(input.cut??{});
  const production={
    format:ANIME_PRODUCTION_IR_FORMAT,version:ANIME_PRODUCTION_IR_VERSION,
    production_id:String(input.production_id??stableId('anime-production',{series:input.series??'Untitled',episode:input.episode??'EP01',cut:cut.cut_id})),
    series:String(input.series??'Untitled Series'),episode:String(input.episode??'EP01'),sequence:String(input.sequence??'SEQ01'),scene:String(input.scene??'Scene'),cut,
    asset_bindings:clone(input.asset_bindings??{}),provider_bindings:clone(input.provider_bindings??{}),
    continuity_contract:{stable_identity:true,asset_roots:clone(input.continuity_contract?.asset_roots??{}),voice_identity:input.continuity_contract?.voice_identity??null, ...clone(input.continuity_contract??{})},
    quality_profile:{name:input.quality_profile?.name??ANIME_RENDER_PROFILE,level:input.quality_profile?.level??'reference',line_stability:'deterministic',shadow_bands:3,...clone(input.quality_profile??{})},
    rendering_profile:clone(input.rendering_profile??{}),motion_profile:clone(input.motion_profile??{}),
    evidence_policy:{frame_receipts:true,provider_receipts:true,hash_algorithm:'sha256-rncs-canonical-v1',...clone(input.evidence_policy??{})},
    export_policy:{frame_sequence:true,audio_stems:true,master_audio:true,video_format:'mp4',video_codec:'h264',audio_codec:'aac',...clone(input.export_policy??{})},
    created_at:String(input.created_at??nowIso()),source_map:clone(input.source_map??{}),
  };
  return seal(production,'production_root',['created_at']);
}

export function bindCharacterAssetFamily(production,family,{actorId=null,cutId=null,visualProfile=null,bodyProfile=null}={}){
  if(family?.format!=='ragf.character-asset-family.v0.1'||!verifySeal(family,'family_root'))throw Object.assign(new Error('ANIME_CHARACTER_FAMILY_INVALID'),{code:'ANIME_CHARACTER_FAMILY_INVALID'});
  if(!family?.quality?.valid||family?.continuity?.status!=='pass')throw Object.assign(new Error('ANIME_CHARACTER_FAMILY_QUALITY_REQUIRED'),{code:'ANIME_CHARACTER_FAMILY_QUALITY_REQUIRED'});
  if(cutId&&production?.cut?.cut_id!==cutId)throw Object.assign(new Error(`ANIME_CUT_NOT_FOUND:${cutId}`),{code:'ANIME_CUT_NOT_FOUND'});
  const next=clone(production),resolvedActor=actorId??next.cut.character_layers[0]?.actor_id;if(!resolvedActor)throw Object.assign(new Error('ANIME_CHARACTER_ACTOR_REQUIRED'),{code:'ANIME_CHARACTER_ACTOR_REQUIRED'});
  const binding={format:'rncs.anime-character-asset-binding.v0.1',actor_id:resolvedActor,character_id:family.character_id,asset_id:family.character_id,asset_family_id:family.asset_family_id,family_root:family.family_root,asset_root:family.asset_root,genome_root:family.genome_root,identity_root:family.identity_root,identity_signature_root:family.identity_signature.signature_root,topology_family:family.topology_family,appearance:clone(family.appearance??{}),palette:clone(family.palette??{}),proportions:clone(family.proportions??{}),modes:clone(family.cross_media?.modes??[]),provider:{id:family.provider_receipt.provider_id,receipt_root:family.provider_receipt.receipt_root,license:family.license},runtime_profiles:{vsr:visualProfile?.profile_root??family.runtime_profiles?.vsr?.profile_root??null,rsr:bodyProfile?.profile_root??family.runtime_profiles?.rsr?.profile_root??null},authority:{identity:'RNCS Character Genome',presentation:'Anime Forge',identity_mutation:'forbidden'}};binding.binding_root=rootHash(binding);
  next.asset_bindings.character={...(next.asset_bindings.character??{}),[resolvedActor]:binding};next.cut.character_layers=next.cut.character_layers.map(layer=>layer.actor_id===resolvedActor?{...layer,asset_id:family.character_id,asset_family_id:family.asset_family_id,family_root:family.family_root,identity_root:family.identity_root,identity_signature_root:family.identity_signature.signature_root,mode:next.cut.mode}:layer);next.provider_bindings.asset=family.provider_receipt.provider_id;next.continuity_contract={...next.continuity_contract,stable_identity:true,asset_roots:{...(next.continuity_contract.asset_roots??{}),character:family.family_root},character_identity_roots:{...(next.continuity_contract.character_identity_roots??{}),[resolvedActor]:family.identity_root},character_signature_roots:{...(next.continuity_contract.character_signature_roots??{}),[resolvedActor]:family.identity_signature.signature_root}};return createAnimeProduction({...next,created_at:next.created_at});
}

export function validateAnimeProduction(production){
  const errors=[],warnings=[];
  if(production?.format!==ANIME_PRODUCTION_IR_FORMAT)errors.push('PRODUCTION_FORMAT_INVALID');
  if(!production?.production_id)errors.push('PRODUCTION_ID_REQUIRED');
  const cut=production?.cut;
  if(!cut?.cut_id)errors.push('CUT_ID_REQUIRED');
  if(!(Number(cut?.duration)>0))errors.push('CUT_DURATION_INVALID');
  if(!(Number(cut?.fps)>0))errors.push('CUT_FPS_INVALID');
  const resolution=normalizeResolution(cut?.resolution);
  if(resolution.width<16||resolution.height<16)errors.push('CUT_RESOLUTION_INVALID');
  if(!ANIME_MODES.includes(cut?.mode))errors.push(`CUT_MODE_UNSUPPORTED:${cut?.mode}`);
  if(!['on_ones','on_twos','on_threes','hold','stepped'].includes(cut?.animation?.exposure))errors.push('EXPOSURE_MODE_INVALID');
  const frameCount=Math.round(Number(cut?.duration||0)*Number(cut?.fps||0));
  if(frameCount<1)errors.push('FRAME_COUNT_INVALID');
  if((cut?.dialogue_track??[]).length>1)warnings.push('MULTIPLE_DIALOGUE_EVENTS_REQUIRE_AUTHORITY_CHECK');
  if(!cut?.character_layers?.length)warnings.push('CHARACTER_LAYER_MISSING');
  if(!cut?.background_layers?.length)warnings.push('BACKGROUND_LAYER_MISSING');
  if(!production?.source_map||Object.keys(production.source_map).length===0)warnings.push('SOURCE_MAP_EMPTY');
  if(!production?.rendering_profile?.format)warnings.push('VSR_ANIME_PROFILE_MISSING');
  if(!production?.motion_profile?.format)warnings.push('RSR_ANIME_MOTION_PROFILE_MISSING');
  return{valid:errors.length===0,errors,warnings,frame_count:frameCount,production_root:production?.production_root??null};
}

export function assertValidAnimeProduction(production){const result=validateAnimeProduction(production);if(!result.valid)throw Object.assign(new Error(result.errors.join(',')),{code:'ANIME_PRODUCTION_INVALID',details:result});return production}

export function createFrameEvidence({production,cut,frameNumber,state,assetRoots={},providerReceipts=[],renderReceipt}){
  const payload={format:ANIME_FRAME_EVIDENCE_FORMAT,version:'0.1.0-alpha.1',frame_id:`${cut.cut_id}:f${String(frameNumber).padStart(4,'0')}`,cut_id:cut.cut_id,frame_number:frameNumber,state_root:rootHash(state),asset_roots:clone(assetRoots),provider_receipts:clone(providerReceipts),render_receipt:clone(renderReceipt),production_root:production.production_root};
  return seal(payload,'evidence_root');
}

export function createProviderReceipt({provider_id,version='0.1.0',capability,mode='reference',input_root,output_root,authority='candidate'}){
  return seal({provider_id,version,capability,mode,input_root:input_root??null,output_root:output_root??null,authority,quality_boundary:mode==='reference'?'deterministic reference provider':'external provider evidence required'},'receipt_root');
}

export function normalizeTrackNames(cut){return Object.fromEntries(TRACKS.map(name=>[name,cut?.[name]?.length??0]))}
