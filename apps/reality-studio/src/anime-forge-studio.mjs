import fs from 'node:fs';
import path from 'node:path';
import {compileAnimeSource,bindVoicePerformance,replaceDialogueTake,buildAnimeControlPlaneCandidate} from '../../../packages/integration/rcl-anime-production-bridge/src/index.mjs';
import {bindCharacterAssetFamily,buildExposureSheet,validateAnimeProduction,validateExposureSheet,renderCut,replayCut} from '../../../packages/world/anime-production-runtime/src/index.mjs';
import {generateVoicePerformance,validateVoicePerformance} from '../../../packages/world/voice-performance-runtime/src/index.mjs';
import {createSoundScene,renderAudioScene,validateAudioScene} from '../../../packages/world/audio-scene-runtime/src/index.mjs';

const writeJson=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2))};
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const safeSegment=value=>String(value).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,80)||'anime-forge';

function writeCompiledArtifacts(outDir,source,compiled){
  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,'source.anime.rcl'),source);
  writeJson(path.join(outDir,'production.ir.json'),compiled.production);
  writeJson(path.join(outDir,'source-map.json'),compiled.source_map);
  fs.writeFileSync(path.join(outDir,'program.rbc'),compiled.bytecode);
  fs.writeFileSync(path.join(outDir,'shadow.rcl'),compiled.shadow_rcl);
  for(const [familyName,family] of Object.entries(compiled.asset_families??{})){
    const familyDir=path.join(outDir,'assets',familyName);fs.mkdirSync(familyDir,{recursive:true});
    for(const [fileName,file] of Object.entries(family.files??{}))fs.writeFileSync(path.join(familyDir,fileName),file.content);
    writeJson(path.join(familyDir,'family.json'),family.family);
  }
  writeJson(path.join(outDir,'compile-report.json'),{
    format:'rncs.anime-compile-report.v0.1',compiled_root:compiled.compiled_root,
    production_root:compiled.production.production_root,bytecode_root:compiled.bytecode_root,
    bytecode_length:compiled.bytecode_length,source_root:compiled.source_root,
    asset_family_roots:Object.fromEntries(Object.entries(compiled.asset_families??{}).map(([name,value])=>[name,value.family.family_root])),
    output:outDir,phase:'phase-1-foundation-plus-phase-2-runtime-contracts',status:'active',next_phase:'provider-parity-and-editorial-expansion',
  });
}

export class AnimeForgeSession{
  constructor({sessionId,source,compiled,outDir}){
    this.session_id=sessionId;this.source=source;this.compiled=compiled;this.out_dir=outDir;
    this.production=compiled.production;this.voice=null;this.last_render=null;this.last_audio=null;
    this.snapshots=new Map();writeCompiledArtifacts(outDir,source,compiled);
  }
  inspect(){
    const validation=validateAnimeProduction(this.production),cut=this.production.cut;
    return{session_id:this.session_id,phase:'phase-1-foundation-active',production_id:this.production.production_id,
      production_root:this.production.production_root,compiled_root:this.compiled.compiled_root,source_root:this.compiled.source_root,
      series:this.production.series,episode:this.production.episode,scene:this.production.scene,
      cut:{cut_id:cut.cut_id,duration:cut.duration,fps:cut.fps,resolution:cut.resolution,mode:cut.mode,frame_count:validation.frame_count},
      providers:this.production.provider_bindings,asset_family_roots:Object.fromEntries(Object.entries(this.compiled.asset_families??{}).map(([name,value])=>[name,value.family.family_root])),
      voice:this.voice?{bundle_root:this.voice.bundle.bundle_root,voice_identity:this.voice.bundle.voice_identity,duration_seconds:this.voice.bundle.duration_seconds}:null,
      render:this.last_render?.manifest?{sequence_root:this.last_render.manifest.sequence_root,rendered_frame_count:this.last_render.manifest.rendered_frame_count,quality:this.last_render.manifest.quality}:null,
      audio:this.last_audio?.report?{audio_root:this.last_audio.report.audio_root,master_root:this.last_audio.report.master_root}:null,
      validation,boundary:'reference providers and procedural renderer; external actor, GPU, and MP4 evidence remain separate gates',
    };
  }
  xsheet(){const sheet=buildExposureSheet(this.production.cut);writeJson(path.join(this.out_dir,'xsheet.json'),sheet);return sheet}
  voiceFor({dialogueId=null,voiceIdentity=null,text=null,emotion=null}={}){
    const dialogue=this.production.cut.dialogue_track.find(item=>item.dialogue_event_id===dialogueId)||this.production.cut.dialogue_track[0];
    if(!dialogue)throw Object.assign(new Error('DIALOGUE_EVENT_REQUIRED'),{code:'DIALOGUE_EVENT_REQUIRED'});
    const outDir=path.join(this.out_dir,'audio','voice');
    const generated=generateVoicePerformance({dialogue_event_id:dialogue.dialogue_event_id,character_id:dialogue.actor_id,voice_identity:voiceIdentity??dialogue.voice_identity,text:text??dialogue.text,language:'zh-CN',emotion:emotion??dialogue.emotion,start_seconds:dialogue.start_frame/this.production.cut.fps},{outDir});
    const replacing=Boolean(this.voice);this.voice=generated;this.production=replacing?replaceDialogueTake(this.production,{dialogueEventId:dialogue.dialogue_event_id,voiceBundle:generated.bundle}):bindVoicePerformance(this.production,generated.bundle);
    writeJson(path.join(this.out_dir,'production.voice-bound.ir.json'),this.production);writeJson(path.join(this.out_dir,'production.ir.json'),this.production);
    const activeTake=this.production.cut.voice_track.find(item=>item.dialogue_event_id===dialogue.dialogue_event_id&&item.active);return{bundle:generated.bundle,validation:validateVoicePerformance(generated.bundle),production_root:this.production.production_root,replaced:replacing,take_id:activeTake?.take_id??null};
  }
  render({quality='preview',maxFrames=null}={}){
    writeJson(path.join(this.out_dir,'production.ir.json'),this.production);
    this.last_render=renderCut(this.production,{outDir:path.join(this.out_dir,'render'),quality,maxFrames:maxFrames==null?null:Number(maxFrames)});
    return this.last_render;
  }
  mix(){
    const scene=createSoundScene({productionId:this.production.production_id,cut:this.production.cut,voiceBundle:this.voice?.bundle??null});
    this.last_audio=renderAudioScene(scene,{voiceWav:this.voice?.wav??null,outDir:path.join(this.out_dir,'render','audio')});
    return{scene, ...this.last_audio,validation:validateAudioScene(scene,this.last_audio.report)};
  }
  verify(){
    const renderDir=path.join(this.out_dir,'render'),manifestFile=path.join(renderDir,'frames-manifest.json'),xsheetFile=path.join(renderDir,'xsheet.json');
    const errors=[...validateAnimeProduction(this.production).errors],warnings=[...validateAnimeProduction(this.production).warnings];
    let manifest=null,xsheet=null;
    if(!fs.existsSync(manifestFile))errors.push('FRAME_MANIFEST_MISSING');else manifest=readJson(manifestFile);
    if(!fs.existsSync(xsheetFile))errors.push('XSHEET_MISSING');else xsheet=readJson(xsheetFile);
    if(manifest){if(manifest.rendered_frame_count!==manifest.expected_frame_count)errors.push('FRAME_COUNT_INCOMPLETE');for(const frame of manifest.frames??[])if(!fs.existsSync(path.join(renderDir,frame.filename)))errors.push(`FRAME_MISSING:${frame.frame_number}`)}
    const ledgerFile=path.join(renderDir,'evidence-ledger.json');if(!fs.existsSync(ledgerFile))errors.push('EVIDENCE_LEDGER_MISSING');else if(manifest&&readJson(ledgerFile).ledger_root!==manifest.evidence_ledger_root)errors.push('EVIDENCE_LEDGER_ROOT_MISMATCH');
    if(xsheet)errors.push(...validateExposureSheet(xsheet).errors);
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
    const renderDir=path.join(this.out_dir,'render'),manifest=readJson(path.join(renderDir,'frames-manifest.json')),result=replayCut(this.production,manifest);
    writeJson(path.join(this.out_dir,'replay-report.json'),result);return result;
  }
  async controlPlane(){const candidate=await buildAnimeControlPlaneCandidate(this.compiled,{verifyParity:false});writeJson(path.join(this.out_dir,'control-plane-candidate.json'),candidate);return candidate}
  bindCharacter({family,visualProfile,bodyProfile,actorId=null}={}){this.production=bindCharacterAssetFamily(this.production,family,{actorId,cutId:this.production.cut.cut_id,visualProfile,bodyProfile});writeJson(path.join(this.out_dir,'production.character-bound.ir.json'),this.production);writeJson(path.join(this.out_dir,'production.ir.json'),this.production);return{session_id:this.session_id,production_root:this.production.production_root,cut_id:this.production.cut.cut_id,character_id:family.character_id,family_root:family.family_root,identity_root:family.identity_root,identity_signature_root:family.identity_signature.signature_root}}
  snapshot(id='snapshot'){
    const snapshotId=safeSegment(id),value={format:'rncs.anime-snapshot.v0.1',snapshot_id:snapshotId,production:this.production,frames_manifest:fs.existsSync(path.join(this.out_dir,'render','frames-manifest.json'))?readJson(path.join(this.out_dir,'render','frames-manifest.json')):null};
    this.snapshots.set(snapshotId,value);writeJson(path.join(this.out_dir,'snapshots',`${snapshotId}.json`),value);return{ok:true,snapshot_id:snapshotId,snapshot:path.join(this.out_dir,'snapshots',`${snapshotId}.json`),production_root:this.production.production_root};
  }
  rollback(snapshotId){
    const value=this.snapshots.get(snapshotId)||readJson(path.join(this.out_dir,'snapshots',`${safeSegment(snapshotId)}.json`));this.production=value.production;this.voice=null;
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
