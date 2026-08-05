import fs from 'node:fs';
import path from 'node:path';
import {compileAnimeSource,bindVoicePerformance,replaceDialogueTake,buildAnimeControlPlaneCandidate} from '../../../packages/integration/rcl-anime-production-bridge/src/index.mjs';
import {bindCharacterAssetFamily,buildExposureSheet,buildProductionExposureSheets,canonicalCutRef,createAnimeProduction,listProductionCuts,resolveProductionCut,validateAnimeProduction,validateExposureSheet,validateProductionExposureSheets,renderCut,renderProduction,replayCut,replayProduction} from '../../../packages/world/anime-production-runtime/src/index.mjs';
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
    output:outDir,phase:'phase-3-editorial-kernel',status:'active',next_phase:'external-provider-and-commercial-quality-parity',
  });
}

export class AnimeForgeSession{
  constructor({sessionId,source,compiled,outDir}){
    this.session_id=sessionId;this.source=source;this.compiled=compiled;this.out_dir=outDir;
    this.production=compiled.production;this.active_cut_ref=this.production.active_cut_ref;this.voices=new Map();this.voice=null;this.last_render=null;this.last_audio=null;
    this.snapshots=new Map();writeCompiledArtifacts(outDir,source,compiled);
  }
  inspect(){
    const validation=validateAnimeProduction(this.production),cut=resolveProductionCut(this.production,this.active_cut_ref),cuts=listProductionCuts(this.production);
    return{session_id:this.session_id,phase:'phase-3-editorial-kernel-active',production_id:this.production.production_id,
      production_root:this.production.production_root,compiled_root:this.compiled.compiled_root,source_root:this.compiled.source_root,
      series:this.production.series,episode:this.production.episode,scene:this.production.scene,
      active_cut_ref:this.active_cut_ref,cut:{cut_ref:canonicalCutRef(cut),cut_id:cut.cut_id,duration:cut.duration,fps:cut.fps,resolution:cut.resolution,mode:cut.mode,frame_count:Math.round(cut.duration*cut.fps)},cut_count:cuts.length,total_frame_count:validation.total_frame_count,
      cuts:cuts.map(item=>({cut_ref:canonicalCutRef(item),cut_id:item.cut_id,episode_id:item.episode_id,scene_id:item.scene_id,duration:item.duration,fps:item.fps,frame_count:Math.round(item.duration*item.fps),dialogue_count:item.dialogue_track.length})),editorial_timeline:this.production.editorial_timeline,
      providers:this.production.provider_bindings,asset_family_roots:Object.fromEntries(assetFamilyEntries(this.compiled.asset_families).map(([name,value])=>[name,value.family.family_root])),
      voice:this.voice?{bundle_root:this.voice.bundle.bundle_root,voice_identity:this.voice.bundle.voice_identity,duration_seconds:this.voice.bundle.duration_seconds}:null,voices:[...this.voices.values()].map(value=>({dialogue_event_id:value.bundle.dialogue_event_id,bundle_root:value.bundle.bundle_root,voice_identity:value.bundle.voice_identity,duration_seconds:value.bundle.duration_seconds})),
      render:this.last_render?.manifest?{sequence_root:this.last_render.manifest.sequence_root,rendered_frame_count:this.last_render.manifest.rendered_frame_count,quality:this.last_render.manifest.quality}:null,
      audio:this.last_audio?.report?{audio_root:this.last_audio.report.audio_root,master_root:this.last_audio.report.master_root}:null,
      validation,boundary:'reference providers and procedural renderer; external actor, GPU, and MP4 evidence remain separate gates',
    };
  }
  selectCut(selector){const cut=resolveProductionCut(this.production,selector);this.active_cut_ref=canonicalCutRef(cut);this.production=createAnimeProduction({...this.production,active_cut_ref:this.active_cut_ref,created_at:this.production.created_at});writeJson(path.join(this.out_dir,'production.ir.json'),this.production);return{session_id:this.session_id,active_cut_ref:this.active_cut_ref,cut_id:cut.cut_id,production_root:this.production.production_root}}
  xsheet(selector=this.active_cut_ref){const cut=resolveProductionCut(this.production,selector),sheet=buildExposureSheet(cut);writeJson(path.join(this.out_dir,'xsheets',`${safeSegment(canonicalCutRef(cut))}.json`),sheet);return sheet}
  xsheets(){const sheets=buildProductionExposureSheets(this.production);writeJson(path.join(this.out_dir,'xsheets.json'),sheets);return sheets}
  voiceFor({dialogueId=null,voiceIdentity=null,text=null,emotion=null}={}){
    const cuts=listProductionCuts(this.production),located=dialogueId?cuts.map(cut=>({cut,dialogue:cut.dialogue_track.find(item=>item.dialogue_event_id===dialogueId)})).find(item=>item.dialogue):null,activeCut=resolveProductionCut(this.production,this.active_cut_ref),cut=located?.cut??activeCut,dialogue=located?.dialogue??activeCut.dialogue_track[0];
    if(!dialogue)throw Object.assign(new Error('DIALOGUE_EVENT_REQUIRED'),{code:'DIALOGUE_EVENT_REQUIRED'});
    const outDir=path.join(this.out_dir,'audio','voice',safeSegment(dialogue.dialogue_event_id));
    const generated=generateVoicePerformance({dialogue_event_id:dialogue.dialogue_event_id,character_id:dialogue.actor_id,voice_identity:voiceIdentity??dialogue.voice_identity,text:text??dialogue.text,language:'zh-CN',emotion:emotion??dialogue.emotion,start_seconds:dialogue.start_frame/cut.fps},{outDir});
    const replacing=this.voices.has(dialogue.dialogue_event_id);this.voice=generated;this.voices.set(dialogue.dialogue_event_id,generated);this.production=replacing?replaceDialogueTake(this.production,{dialogueEventId:dialogue.dialogue_event_id,voiceBundle:generated.bundle}):bindVoicePerformance(this.production,generated.bundle);
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
  bindCharacter({family,visualProfile,bodyProfile,actorId=null,cutRef=null}={}){this.production=bindCharacterAssetFamily(this.production,family,{actorId,cutId:cutRef,visualProfile,bodyProfile});writeJson(path.join(this.out_dir,'production.character-bound.ir.json'),this.production);writeJson(path.join(this.out_dir,'production.ir.json'),this.production);return{session_id:this.session_id,production_root:this.production.production_root,active_cut_ref:this.active_cut_ref,character_id:family.character_id,family_root:family.family_root,identity_root:family.identity_root,identity_signature_root:family.identity_signature.signature_root}}
  snapshot(id='snapshot'){
    const snapshotId=safeSegment(id),value={format:'rncs.anime-snapshot.v0.1',snapshot_id:snapshotId,production:this.production,frames_manifest:fs.existsSync(path.join(this.out_dir,'render','frames-manifest.json'))?readJson(path.join(this.out_dir,'render','frames-manifest.json')):null};
    this.snapshots.set(snapshotId,value);writeJson(path.join(this.out_dir,'snapshots',`${snapshotId}.json`),value);return{ok:true,snapshot_id:snapshotId,snapshot:path.join(this.out_dir,'snapshots',`${snapshotId}.json`),production_root:this.production.production_root};
  }
  rollback(snapshotId){
    const value=this.snapshots.get(snapshotId)||readJson(path.join(this.out_dir,'snapshots',`${safeSegment(snapshotId)}.json`));this.production=value.production;this.active_cut_ref=this.production.active_cut_ref;this.voices.clear();this.voice=null;
    writeJson(path.join(this.out_dir,'production.ir.json'),this.production);const receipt={format:'rncs.anime-rollback-receipt.v0.1',snapshot_id:snapshotId,production_root:this.production.production_root,status:'restored-authoring-state',next_action:'re-render affected Cut',frames_preserved:false};writeJson(path.join(this.out_dir,'rollback-receipt.json'),receipt);return receipt;
  }
}

export class AnimeForgeSessionRegistry{
  constructor({dataDir}){this.dataDir=dataDir;this.sessions=new Map()}
  create(source){
    const compiled=compileAnimeSource(source),sessionId=`anime-${compiled.production.production_root.slice(0,16)}`,outDir=path.join(this.dataDir,'anime-forge',sessionId);
    const session=new AnimeForgeSession({sessionId,source,compiled,outDir});this.sessions.set(sessionId,session);return session;
  }
  get(sessionId){const session=this.sessions.get(String(sessionId));if(!session)throw Object.assign(new Error(`ANIME_SESSION_NOT_FOUND:${sessionId}`),{code:'ANIME_SESSION_NOT_FOUND'});return session}
}
