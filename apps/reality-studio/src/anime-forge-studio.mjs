import fs from 'node:fs';
import path from 'node:path';
import {compileAnimeSource,bindVoicePerformance,replaceDialogueTake,buildAnimeControlPlaneCandidate,buildAnimeEpisodeMedia} from '../../../packages/integration/rcl-anime-production-bridge/src/index.mjs';
import {bindCharacterAssetFamily,buildExposureSheet,buildProductionExposureSheets,canonicalCutRef,listProductionCuts,resolveProductionCut,validateAnimeProduction,validateExposureSheet,validateProductionExposureSheets,renderCut,renderProduction,replayCut,replayProduction} from '../../../packages/world/anime-production-runtime/src/index.mjs';
import {generateVoicePerformance,validateVoicePerformance} from '../../../packages/world/voice-performance-runtime/src/index.mjs';
import {createProductionSoundScene,createSoundScene,renderAudioScene,validateAudioScene} from '../../../packages/world/audio-scene-runtime/src/index.mjs';

const writeJson=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2))};
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const safeSegment=value=>String(value).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,80)||'anime-forge';
function assetFamilyEntries(families={}){const entries=[],seen=new Set();const visit=(value,name)=>{if(value?.family?.family_root){if(!seen.has(value.family.family_root)){seen.add(value.family.family_root);entries.push([name,value])}return}if(value&&typeof value==='object')for(const[key,child]of Object.entries(value))visit(child,`${name}-${key}`)};for(const[name,value]of Object.entries(families))visit(value,name);return entries}

function writeCompiledArtifacts(outDir,source,compiled){
  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,'source.anime.rcl'),source);
  writeJson(path.join(outDir,'production.ir.json'),compiled.production);
  writeJson(path.join(outDir,'source-map.json'),compiled.source_map);
  fs.writeFileSync(path.join(outDir,'program.rbc'),compiled.bytecode);
  fs.writeFileSync(path.join(outDir,'shadow.rcl'),compiled.shadow_rcl);
  for(const [familyName,family] of assetFamilyEntries(compiled.asset_families)){
    const familyDir=path.join(outDir,'assets',safeSegment(familyName));fs.mkdirSync(familyDir,{recursive:true});
    for(const [fileName,file] of Object.entries(family.files??{}))fs.writeFileSync(path.join(familyDir,fileName),file.content);
    writeJson(path.join(familyDir,'family.json'),family.family);
  }
  writeJson(path.join(outDir,'compile-report.json'),{
    format:'rncs.anime-compile-report.v0.1',compiled_root:compiled.compiled_root,
    production_root:compiled.production.production_root,bytecode_root:compiled.bytecode_root,
    bytecode_length:compiled.bytecode_length,source_root:compiled.source_root,
    asset_family_roots:Object.fromEntries(assetFamilyEntries(compiled.asset_families).map(([name,value])=>[name,value.family.family_root])),
    output:outDir,phase:'phase-4-media-closure',status:'active',next_phase:'human-direction-and-external-provider-quality',
  });
}

export class AnimeForgeSession{
  constructor({sessionId,source,compiled,outDir,mediaTools={}}){
    this.session_id=sessionId;this.source=source;this.compiled=compiled;this.out_dir=outDir;
    this.production=compiled.production;this.active_cut_ref=this.production.active_cut_ref;this.voices=new Map();this.voice=null;this.last_render=null;this.last_audio=null;this.last_media=null;this.media_tools=mediaTools;
    this.snapshots=new Map();writeCompiledArtifacts(outDir,source,compiled);
  }
  inspect(){
    const validation=validateAnimeProduction(this.production),cut=resolveProductionCut(this.production,this.active_cut_ref),cuts=listProductionCuts(this.production);
    const media=this.last_media,failedGates=media?Object.entries(media.ledger.gates).filter(([,passed])=>!passed).map(([gate])=>gate):['FINAL_MEDIA_NOT_BUILT'];
    const secondaryMotion=cuts.flatMap(item=>(item.secondary_motion_track??[]).map(track=>({cut_ref:canonicalCutRef(item),motion_id:track.override_id??track.motion_id??'secondary-motion',channels:Object.keys(track.channels??{}),start_frame:track.start_frame,end_frame:track.end_frame})));
    const providerManifests=media?.provider_set?.manifests??this.production.provider_manifests??[],providerStatus=item=>item.provider_id==='rncs.video-mux.ffmpeg'?(media?.mux?.report?.status??'not-run'):(media?'complete':item.role==='asset'?'compiled':'not-run');
    const cutIssues=media?.cut_continuity?.seams?.filter(item=>!item.pass||item.visible_change===false).length??0;
    const quality={episode_status:media?.status??'awaiting-media-build',playable:Boolean(media?.ok),final_media:media?.summary?.mp4??null,failures:failedGates,next_human_judgement:media?.ok?'Review character acting, art direction and experimental asset quality.':'Resolve the first failed media gate before human quality review.',provider_usage:providerManifests.map(item=>({provider_id:item.provider_id,role:item.role,produces_media:item.media?.produces_media===true,deterministic:item.determinism?.deterministic===true,status:providerStatus(item)})),asset_lineage:media?.provider_set?media.ledger.roots.asset_lineage_root:Object.fromEntries(assetFamilyEntries(this.compiled.asset_families).map(([name,value])=>[name,value.family.lineage_graph?.lineage_root??value.family.family_root])),character_continuity:media?.character_continuity?{status:media.character_continuity.status,report_root:media.character_continuity.report_root}:null,cut_continuity:media?.cut_continuity?{status:media.cut_continuity.status,issue_count:cutIssues,report_root:media.cut_continuity.report_root}:null,audio_video_sync:media?.sync?{status:media.sync.status,report_root:media.sync.report_root}:null,secondary_motion_tracks:secondaryMotion,mp4_build:media?{status:media.mux.report.status,code:media.mux.report.code,sha256:media.mux.report.output.sha256,ffprobe_valid:media.mux.probe_report?.validation?.valid===true}:null,evidence_ledger:media?{status:media.ledger.status,ledger_root:media.ledger.ledger_root}:null,boundary:'experimental built-in Anime assets and procedural performance; commercial broadcast quality and human acceptance are not proven'};
    return{session_id:this.session_id,phase:'phase-4-media-closure-active',production_id:this.production.production_id,
      production_root:this.production.production_root,compiled_root:this.compiled.compiled_root,source_root:this.compiled.source_root,
      series:this.production.series,episode:this.production.episode,scene:this.production.scene,
      active_cut_ref:this.active_cut_ref,cut:{cut_ref:canonicalCutRef(cut),cut_id:cut.cut_id,duration:cut.duration,fps:cut.fps,resolution:cut.resolution,mode:cut.mode,frame_count:Math.round(cut.duration*cut.fps)},cut_count:cuts.length,total_frame_count:validation.total_frame_count,
      cuts:cuts.map(item=>({cut_ref:canonicalCutRef(item),cut_id:item.cut_id,episode_id:item.episode_id,scene_id:item.scene_id,duration:item.duration,fps:item.fps,frame_count:Math.round(item.duration*item.fps),dialogue_count:item.dialogue_track.length})),editorial_timeline:this.production.editorial_timeline,
      providers:this.production.provider_bindings,asset_family_roots:Object.fromEntries(assetFamilyEntries(this.compiled.asset_families).map(([name,value])=>[name,value.family.family_root])),
      voice:this.voice?{bundle_root:this.voice.bundle.bundle_root,voice_identity:this.voice.bundle.voice_identity,duration_seconds:this.voice.bundle.duration_seconds}:null,voices:[...this.voices.values()].map(value=>({dialogue_event_id:value.bundle.dialogue_event_id,bundle_root:value.bundle.bundle_root,voice_identity:value.bundle.voice_identity,duration_seconds:value.bundle.duration_seconds})),
      render:this.last_render?.manifest?{sequence_root:this.last_render.manifest.sequence_root,rendered_frame_count:this.last_render.manifest.rendered_frame_count,quality:this.last_render.manifest.quality}:null,
      audio:this.last_audio?.report?{audio_root:this.last_audio.report.audio_root,master_root:this.last_audio.report.master_root}:null,
      quality,validation,boundary:quality.boundary,
    };
  }
  selectCut(selector){const cut=resolveProductionCut(this.production,selector);this.active_cut_ref=canonicalCutRef(cut);return{session_id:this.session_id,active_cut_ref:this.active_cut_ref,cut_id:cut.cut_id,production_root:this.production.production_root,episode_intent_root:this.production.episode_intent_root,authority:'inspection-only',production_mutated:false}}
  xsheet(selector=this.active_cut_ref){const cut=resolveProductionCut(this.production,selector),cutRef=canonicalCutRef(cut),sheet=buildExposureSheet(cut,{motionProfile:this.production.motion_profiles?.[cutRef],renderProfile:this.production.rendering_profiles?.[cutRef],compositionContract:this.production.composition_contract});writeJson(path.join(this.out_dir,'xsheets',`${safeSegment(cutRef)}.json`),sheet);return sheet}
  xsheets(){const sheets=buildProductionExposureSheets(this.production);writeJson(path.join(this.out_dir,'xsheets.json'),sheets);return sheets}
  voiceFor({dialogueId=null,voiceIdentity=null,text=null,emotion=null}={}){
    const cuts=listProductionCuts(this.production),located=dialogueId?cuts.map(cut=>({cut,dialogue:cut.dialogue_track.find(item=>item.dialogue_event_id===dialogueId)})).find(item=>item.dialogue):null,activeCut=resolveProductionCut(this.production,this.active_cut_ref),cut=located?.cut??activeCut,dialogue=located?.dialogue??activeCut.dialogue_track[0];
    if(!dialogue)throw Object.assign(new Error('DIALOGUE_EVENT_REQUIRED'),{code:'DIALOGUE_EVENT_REQUIRED'});
    const outDir=path.join(this.out_dir,'audio','voice',safeSegment(dialogue.dialogue_event_id));
    const generated=generateVoicePerformance({dialogue_event_id:dialogue.dialogue_event_id,character_id:dialogue.actor_id,voice_identity:voiceIdentity??dialogue.voice_identity,text:text??dialogue.text,language:'zh-CN',emotion:emotion??dialogue.emotion,start_seconds:dialogue.start_frame/cut.fps},{outDir});
    const replacing=this.voices.has(dialogue.dialogue_event_id);this.voice=generated;this.voices.set(dialogue.dialogue_event_id,generated);this.production=replacing?replaceDialogueTake(this.production,{dialogueEventId:dialogue.dialogue_event_id,voiceBundle:generated.bundle}):bindVoicePerformance(this.production,generated.bundle);this.last_media=null;
    writeJson(path.join(this.out_dir,'production.voice-bound.ir.json'),this.production);writeJson(path.join(this.out_dir,'production.ir.json'),this.production);
    const updatedCut=listProductionCuts(this.production).find(item=>item.dialogue_track.some(event=>event.dialogue_event_id===dialogue.dialogue_event_id)),activeTake=updatedCut?.voice_track.find(item=>item.dialogue_event_id===dialogue.dialogue_event_id&&item.active);return{bundle:generated.bundle,validation:validateVoicePerformance(generated.bundle),production_root:this.production.production_root,cut_ref:canonicalCutRef(updatedCut),replaced:replacing,take_id:activeTake?.take_id??null};
  }
  render({quality='preview',maxFrames=null}={}){
    writeJson(path.join(this.out_dir,'production.ir.json'),this.production);
    this.last_render=renderProduction(this.production,{outDir:path.join(this.out_dir,'render'),quality,maxFrames:maxFrames==null?null:Number(maxFrames)});
    return this.last_render;
  }
  mix(){
    const scene=createProductionSoundScene({production:this.production,voiceBundles:[...this.voices.values()].map(value=>value.bundle)}),voiceWavs=new Map([...this.voices].map(([id,value])=>[id,value.wav]));
    this.last_audio=renderAudioScene(scene,{voiceWavs,outDir:path.join(this.out_dir,'render','audio')});
    return{scene, ...this.last_audio,validation:validateAudioScene(scene,this.last_audio.report)};
  }
  buildMedia({quality='preview'}={}){
    this.last_media=buildAnimeEpisodeMedia({source:this.source,compiledInput:this.compiled,productionInput:this.production,voicePerformances:[...this.voices.values()],outDir:path.join(this.out_dir,'media'),quality,ffmpegPath:this.media_tools.ffmpegPath,ffprobePath:this.media_tools.ffprobePath});
    return{session_id:this.session_id,status:this.last_media.status,ok:this.last_media.ok,summary:this.last_media.summary,ledger:this.last_media.ledger,quality:this.inspect().quality};
  }
  verify(){
    const renderDir=path.join(this.out_dir,'render'),manifestFile=path.join(renderDir,'frames-manifest.json'),xsheetFile=path.join(renderDir,'xsheets.json');
    const errors=[...validateAnimeProduction(this.production).errors],warnings=[...validateAnimeProduction(this.production).warnings];
    let manifest=null,xsheet=null;
    if(!fs.existsSync(manifestFile))errors.push('FRAME_MANIFEST_MISSING');else manifest=readJson(manifestFile);
    if(!fs.existsSync(xsheetFile))errors.push('XSHEET_MISSING');else xsheet=readJson(xsheetFile);
    if(manifest){if(manifest.rendered_frame_count!==manifest.expected_frame_count)errors.push('FRAME_COUNT_INCOMPLETE');for(const frame of manifest.frames??[])if(!fs.existsSync(path.join(renderDir,frame.filename)))errors.push(`FRAME_MISSING:${frame.frame_number}`)}
    const ledgerFile=path.join(renderDir,'evidence-ledger.json');if(!fs.existsSync(ledgerFile))errors.push('EVIDENCE_LEDGER_MISSING');else if(manifest&&readJson(ledgerFile).ledger_root!==manifest.evidence_ledger_root)errors.push('EVIDENCE_LEDGER_ROOT_MISMATCH');
    if(xsheet)errors.push(...validateProductionExposureSheets(xsheet).errors);
    const audioReport=fs.existsSync(path.join(renderDir,'audio','audio-report.json'))?readJson(path.join(renderDir,'audio','audio-report.json')):null;
    if(audioReport){
      const audioSceneFile=path.join(renderDir,'audio','audio-scene.json');
      if(fs.existsSync(audioSceneFile)){const audioValidation=validateAudioScene(readJson(audioSceneFile),audioReport);if(!audioValidation.valid)errors.push(...audioValidation.errors)}
      else warnings.push('AUDIO_SCENE_MISSING');
    }
    const exportReport=fs.existsSync(path.join(renderDir,'export-report.json'))?readJson(path.join(renderDir,'export-report.json')):null;
    if(exportReport?.status==='blocked')warnings.push(exportReport.code);
    const result={format:'rncs.anime-verification-report.v0.1',ok:errors.length===0,errors,warnings,production_root:this.production.production_root,sequence_root:manifest?.sequence_root??null,audio_root:audioReport?.audio_root??null,export:exportReport,boundary:errors.length===0?'targeted reference verification; not commercial/clean-VM/GPU parity':'required evidence incomplete'};
    writeJson(path.join(this.out_dir,'verification-report.json'),result);return result;
  }
  replay(){
    const renderDir=path.join(this.out_dir,'render'),manifest=readJson(path.join(renderDir,'frames-manifest.json')),result=replayProduction(this.production,manifest);
    writeJson(path.join(this.out_dir,'replay-report.json'),result);return result;
  }
  async controlPlane(){const candidate=await buildAnimeControlPlaneCandidate({...this.compiled,production:this.production},{verifyParity:false});writeJson(path.join(this.out_dir,'control-plane-candidate.json'),candidate);return candidate}
  bindCharacter({family,visualProfile,bodyProfile,actorId=null,cutRef=null}={}){this.production=bindCharacterAssetFamily(this.production,family,{actorId,cutId:cutRef,visualProfile,bodyProfile});this.last_media=null;writeJson(path.join(this.out_dir,'production.character-bound.ir.json'),this.production);writeJson(path.join(this.out_dir,'production.ir.json'),this.production);return{session_id:this.session_id,production_root:this.production.production_root,active_cut_ref:this.active_cut_ref,character_id:family.character_id,family_root:family.family_root,identity_root:family.identity_root,identity_signature_root:family.identity_signature.signature_root}}
  snapshot(id='snapshot'){
    const snapshotId=safeSegment(id),value={format:'rncs.anime-snapshot.v0.1',snapshot_id:snapshotId,production:this.production,frames_manifest:fs.existsSync(path.join(this.out_dir,'render','frames-manifest.json'))?readJson(path.join(this.out_dir,'render','frames-manifest.json')):null};
    this.snapshots.set(snapshotId,value);writeJson(path.join(this.out_dir,'snapshots',`${snapshotId}.json`),value);return{ok:true,snapshot_id:snapshotId,snapshot:path.join(this.out_dir,'snapshots',`${snapshotId}.json`),production_root:this.production.production_root};
  }
  rollback(snapshotId){
    const value=this.snapshots.get(snapshotId)||readJson(path.join(this.out_dir,'snapshots',`${safeSegment(snapshotId)}.json`));this.production=value.production;this.active_cut_ref=this.production.active_cut_ref;this.voices.clear();this.voice=null;this.last_media=null;
    writeJson(path.join(this.out_dir,'production.ir.json'),this.production);const receipt={format:'rncs.anime-rollback-receipt.v0.1',snapshot_id:snapshotId,production_root:this.production.production_root,status:'restored-authoring-state',next_action:'re-render affected Cut',frames_preserved:false};writeJson(path.join(this.out_dir,'rollback-receipt.json'),receipt);return receipt;
  }
}

export class AnimeForgeSessionRegistry{
  constructor({dataDir,ffmpegPath=process.env.FFMPEG_PATH??'ffmpeg',ffprobePath=process.env.FFPROBE_PATH??'ffprobe'}){this.dataDir=dataDir;this.mediaTools={ffmpegPath,ffprobePath};this.sessions=new Map()}
  create(source){
    const compiled=compileAnimeSource(source),sessionId=`anime-${compiled.production.production_root.slice(0,16)}`,outDir=path.join(this.dataDir,'anime-forge',sessionId);
    const session=new AnimeForgeSession({sessionId,source,compiled,outDir,mediaTools:this.mediaTools});this.sessions.set(sessionId,session);return session;
  }
  get(sessionId){const session=this.sessions.get(String(sessionId));if(!session)throw Object.assign(new Error(`ANIME_SESSION_NOT_FOUND:${sessionId}`),{code:'ANIME_SESSION_NOT_FOUND'});return session}
}
