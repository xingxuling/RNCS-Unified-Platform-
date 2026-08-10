import {clone,rootHash,seal,verifySeal} from './canonical.mjs';

export const ANIME_PROVIDER_MANIFEST_FORMAT='rncs.anime-provider-manifest.v0.1';
export const ANIME_PROVIDER_MANIFEST_VERSION='0.1.0-alpha.1';
export const ANIME_PROVIDER_ROLES=Object.freeze(['asset','frame-render','motion','voice','audio-mix','video-mux']);

const array=value=>Array.isArray(value)?clone(value):[];

export function createAnimeProviderManifest(input={}){
  const deterministic=input.determinism?.deterministic??input.deterministic??true;
  const manifest={
    format:ANIME_PROVIDER_MANIFEST_FORMAT,
    version:ANIME_PROVIDER_MANIFEST_VERSION,
    provider_id:String(input.provider_id??'rncs.anime-provider.unknown'),
    provider_version:String(input.provider_version??'0.1.0'),
    role:String(input.role??'asset'),
    display_name:String(input.display_name??input.provider_id??'Unnamed Anime Provider'),
    execution:{kind:String(input.execution?.kind??'builtin'),binary:input.execution?.binary??null,cpu:Boolean(input.execution?.cpu??true),gpu:Boolean(input.execution?.gpu??false),network:Boolean(input.execution?.network??false),platforms:array(input.execution?.platforms??['win32','linux','darwin'])},
    inputs:array(input.inputs),
    outputs:array(input.outputs),
    media:{produces_media:Boolean(input.media?.produces_media),media_types:array(input.media?.media_types),fixture:false,mock:false,...clone(input.media??{})},
    resolution:{minimum:clone(input.resolution?.minimum??{width:16,height:16}),maximum:clone(input.resolution?.maximum??{width:1920,height:1080}),supported:array(input.resolution?.supported)},
    frame_rate:{minimum:Number(input.frame_rate?.minimum??1),maximum:Number(input.frame_rate?.maximum??60),supported:array(input.frame_rate?.supported??[24])},
    determinism:{deterministic,seed_support:Boolean(input.determinism?.seed_support??deterministic),declaration:String(input.determinism?.declaration??(deterministic?'deterministic-for-sealed-inputs':'records-model-parameters-seed-and-input-root'))},
    character_continuity:{level:String(input.character_continuity?.level??'none'),identity_root_required:Boolean(input.character_continuity?.identity_root_required),cross_cut:Boolean(input.character_continuity?.cross_cut),cross_episode:Boolean(input.character_continuity?.cross_episode)},
    motion:{capabilities:array(input.motion?.capabilities),xsheet_track_required:Boolean(input.motion?.xsheet_track_required),binding_contract:clone(input.motion?.binding_contract??null)},
    resources:{cpu:String(input.resources?.cpu??'required'),gpu:String(input.resources?.gpu??'not-required'),memory_mb:Number(input.resources?.memory_mb??256),disk_mb:Number(input.resources?.disk_mb??64)},
    limits:{timeout_ms:Number(input.limits?.timeout_ms??120000),maximum_cost:Number(input.limits?.maximum_cost??0),cost_unit:String(input.limits?.cost_unit??'local-compute')},
    failures:array(input.failures??['UNAVAILABLE','INVALID_INPUT','TIMEOUT','EXECUTION_FAILED','OUTPUT_INVALID']),
    evidence:{outputs:array(input.evidence?.outputs??['provider-receipt']),tool_version:Boolean(input.evidence?.tool_version??true),input_root:Boolean(input.evidence?.input_root??true),output_root:Boolean(input.evidence?.output_root??true)},
    authority:{media_candidate_only:true,identity_write:false,episode_write:false,commit_write:false,...clone(input.authority??{})},
    quality_boundary:String(input.quality_boundary??'capability declaration only; acceptance requires output evidence'),
    manifest_root:'',
  };
  return seal(manifest,'manifest_root');
}

export function validateAnimeProviderManifest(manifest){
  const errors=[];
  if(manifest?.format!==ANIME_PROVIDER_MANIFEST_FORMAT)errors.push('ANIME_PROVIDER_FORMAT_INVALID');
  if(!ANIME_PROVIDER_ROLES.includes(manifest?.role))errors.push(`ANIME_PROVIDER_ROLE_INVALID:${manifest?.role}`);
  for(const field of ['provider_id','provider_version','display_name'])if(!manifest?.[field])errors.push(`ANIME_PROVIDER_REQUIRED:${field}`);
  if(!(manifest?.inputs?.length>0))errors.push('ANIME_PROVIDER_INPUTS_REQUIRED');
  if(!(manifest?.outputs?.length>0))errors.push('ANIME_PROVIDER_OUTPUTS_REQUIRED');
  if(!(Number(manifest?.limits?.timeout_ms)>0))errors.push('ANIME_PROVIDER_TIMEOUT_INVALID');
  if(!(Number(manifest?.resources?.memory_mb)>=0))errors.push('ANIME_PROVIDER_MEMORY_INVALID');
  if(!Array.isArray(manifest?.failures)||manifest.failures.length<3)errors.push('ANIME_PROVIDER_FAILURES_INCOMPLETE');
  if(manifest?.media?.mock===true||manifest?.media?.fixture===true)errors.push('ANIME_PROVIDER_MOCK_OR_FIXTURE_FORBIDDEN');
  if(manifest?.media?.produces_media&&!(manifest.media.media_types?.length>0))errors.push('ANIME_PROVIDER_MEDIA_TYPES_REQUIRED');
  if(manifest?.determinism?.deterministic&&!manifest?.determinism?.seed_support)errors.push('ANIME_PROVIDER_DETERMINISTIC_SEED_REQUIRED');
  if(manifest?.authority?.identity_write||manifest?.authority?.episode_write||manifest?.authority?.commit_write)errors.push('ANIME_PROVIDER_AUTHORITY_ESCALATION');
  if(!verifySeal(manifest,'manifest_root'))errors.push('ANIME_PROVIDER_ROOT_INVALID');
  return{valid:errors.length===0,errors,manifest_root:manifest?.manifest_root??null,produces_media:Boolean(manifest?.media?.produces_media)};
}

export function createBuiltinAnimeProviderManifests(){
  const common={resolution:{supported:[{width:960,height:540},{width:1280,height:720},{width:1920,height:1080}]},frame_rate:{supported:[24]},determinism:{deterministic:true,seed_support:true}};
  return[
    createAnimeProviderManifest({...common,provider_id:'ragf.anime-builtin-generator',display_name:'RAGF Built-in Anime Asset Generator',role:'asset',inputs:['character-genome','episode-intent','seed','motion-config'],outputs:['anime-character-family','anime-background-family','svg-model-sheets','png-character-media','png-character-sequence','motion-track.json','asset-quality-report'],media:{produces_media:true,media_types:['image/svg+xml','image/png','image/png-sequence','application/json']},character_continuity:{level:'identity-root-appearance-root-and-motion-track',identity_root_required:true,cross_cut:true,cross_episode:true},motion:{capabilities:['pose-library','expression-library','layered-2d-rig','state-driven-raster','deterministic-motion-sequence','secondary-motion-track','blink','breathing','hair-sway','coat-sway'],xsheet_track_required:true,binding_contract:{format:'rncs.ragf-motion-xsheet-binding.v0.1',mapping:'floor-by-timebase',authority:'episode-derived-runtime'}},resources:{cpu:'required',gpu:'not-required',memory_mb:256,disk_mb:96},limits:{timeout_ms:30000,maximum_cost:0},evidence:{outputs:['provider-receipt','asset-lineage','quality-report','media-roots','motion-track','frame-roots','temporal-variation']},quality_boundary:'deterministic experimental Anime assets with reference secondary motion; commercial source-art quality and physical simulation not proven'}),
    createAnimeProviderManifest({...common,provider_id:'vsr.anime-builtin-rasterizer',display_name:'VSR Built-in Anime Raster Provider',role:'frame-render',inputs:['anime-production-ir','xsheet','asset-families','composition-contract'],outputs:['png-frame-sequence','frame-manifest','render-receipts'],media:{produces_media:true,media_types:['image/png','image/png-sequence']},character_continuity:{level:'bound-family-root',identity_root_required:true,cross_cut:true,cross_episode:false},motion:{capabilities:['stepped-pose','camera','viseme','blink','layered-composition'],xsheet_track_required:true},resources:{cpu:'required',gpu:'not-required',memory_mb:512,disk_mb:2048},limits:{timeout_ms:900000,maximum_cost:0},evidence:{outputs:['frame-manifest','frame-receipts','layer-roots','sequence-root']},quality_boundary:'deterministic CPU experimental Anime raster; GPU and commercial final quality not proven'}),
    createAnimeProviderManifest({...common,provider_id:'rsr.anime-secondary-motion-reference',display_name:'RSR Anime Secondary Motion',role:'motion',inputs:['motion-profile','xsheet-frame','director-overrides'],outputs:['resolved-motion-track'],media:{produces_media:false,media_types:[]},character_continuity:{level:'asset-root-preserving',identity_root_required:false,cross_cut:true,cross_episode:false},motion:{capabilities:['hair','coat','breathing','camera-ease','foreground-parallax'],xsheet_track_required:true},resources:{cpu:'required',gpu:'not-required',memory_mb:32,disk_mb:1},limits:{timeout_ms:30000,maximum_cost:0},evidence:{outputs:['motion-root','override-receipts']},quality_boundary:'bounded procedural secondary motion; physical cloth and hair are not claimed'}),
    createAnimeProviderManifest({provider_id:'taowind.voice-forge.reference-synthetic-v0.1',display_name:'Voice Forge Reference Synthetic Provider',role:'voice',execution:{kind:'builtin',cpu:true,gpu:false,network:false},inputs:['dialogue-intent','voice-identity','seed'],outputs:['pcm-wav','phoneme-timeline','viseme-timeline','voice-receipt'],media:{produces_media:true,media_types:['audio/wav']},resolution:{supported:[]},frame_rate:{minimum:1,maximum:192000,supported:[22050]},determinism:{deterministic:true,seed_support:true},character_continuity:{level:'voice-identity-root',identity_root_required:true,cross_cut:true,cross_episode:true},motion:{capabilities:['viseme-driver'],xsheet_track_required:true},resources:{cpu:'required',gpu:'not-required',memory_mb:128,disk_mb:64},limits:{timeout_ms:30000,maximum_cost:0},evidence:{outputs:['voice-bundle','waveform-report','audio-root']},quality_boundary:'non-silent synthetic reference performance; licensed human performance not proven'}),
    createAnimeProviderManifest({provider_id:'taowind.audio-forge.reference-mixer-v0.1',display_name:'Audio Forge Reference Mixer',role:'audio-mix',execution:{kind:'builtin',cpu:true,gpu:false,network:false},inputs:['audio-scene-ir','voice-wavs','sound-cues'],outputs:['master-wav','audio-stems','mix-report'],media:{produces_media:true,media_types:['audio/wav']},resolution:{supported:[]},frame_rate:{minimum:1,maximum:192000,supported:[22050]},determinism:{deterministic:true,seed_support:true},character_continuity:{level:'dialogue-event-authority',identity_root_required:false,cross_cut:true,cross_episode:false},motion:{capabilities:[]},resources:{cpu:'required',gpu:'not-required',memory_mb:256,disk_mb:512},limits:{timeout_ms:120000,maximum_cost:0},evidence:{outputs:['audio-scene','mix-report','master-root','stem-roots']},quality_boundary:'deterministic reference mix; professional sound-stage mastering not proven'}),
  ];
}

export async function executeProviderFallback(providers,operation,{timeoutMs=120000,accept=result=>result?.ok===true}={}){
  const attempts=[];
  for(const provider of providers){
    const id=provider?.manifest?.provider_id??provider?.provider_id??'unknown-provider',declaredTimeout=Number(provider?.manifest?.limits?.timeout_ms??provider?.limits?.timeout_ms??timeoutMs),effectiveTimeout=Math.max(1,Math.min(Number(timeoutMs)||120000,declaredTimeout>0?declaredTimeout:120000));
    let timer;
    try{
      const result=await Promise.race([Promise.resolve().then(()=>operation(provider)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error(`PROVIDER_TIMEOUT:${id}`),{code:'PROVIDER_TIMEOUT'})),effectiveTimeout)})]);
      if(timer)clearTimeout(timer);
      attempts.push({provider_id:id,status:accept(result)?'accepted':'rejected',timeout_ms:effectiveTimeout,result_root:rootHash(result??null)});
      if(accept(result))return{ok:true,provider_id:id,result,attempts};
    }catch(error){if(timer)clearTimeout(timer);attempts.push({provider_id:id,status:error.code==='PROVIDER_TIMEOUT'?'timeout':'failed',timeout_ms:effectiveTimeout,code:error.code??'PROVIDER_FAILED',message:error.message})}
  }
  return{ok:false,code:'PROVIDER_CHAIN_EXHAUSTED',attempts};
}
