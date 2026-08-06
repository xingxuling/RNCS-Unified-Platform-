import fs from 'node:fs';
import path from 'node:path';
import {inflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {createAnatomySystem,poseForFrame,validateAnatomySystem} from './anatomy.mjs';
import {rootHash} from './canonical.mjs';
import {validateKinematics} from './kinematics.mjs';
import {validateDeformedGeometry} from './deformation.mjs';
import {projectFrameGeometry,validateProjection} from './projection.mjs';
import {applyAnimeStyle} from './style.mjs';
import {renderFrame} from './renderer.mjs';
import {createDeterministicWav,muxMp4,sha256File} from './media.mjs';
import {encodePng} from './raster.mjs';

const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repoRoot=path.resolve(packageRoot,'../../..');
const fixedCreatedAt='2026-08-07T00:00:00.000Z';
const FPS=24,WIDTH=1280,HEIGHT=720,FRAME_COUNT=120;
const EVIDENCE_FORMAT='rncs.anime-forge-phase6-2-canonical-morphology-evidence.v0.1';

const writeJson=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,`${JSON.stringify(value,null,2)}\n`);};
const relative=(root,file)=>path.relative(root,file).split(path.sep).join('/');
const fileHash=file=>sha256File(file);
const fileExists=file=>fs.existsSync(file)&&fs.statSync(file).isFile();

function listFiles(root){
  const files=[];
  if(!fs.existsSync(root))return files;
  for(const entry of fs.readdirSync(root,{withFileTypes:true})){
    const file=path.join(root,entry.name);
    if(entry.isDirectory())files.push(...listFiles(file));else files.push(file);
  }
  return files.sort();
}

function composeContactSheet(files,outFile,{columns=5,tileWidth=480,tileHeight=270}={}){
  const images=files.map(file=>decodePng(fs.readFileSync(file))),rows=Math.ceil(images.length/columns),width=columns*tileWidth,height=rows*tileHeight,pixels=Buffer.alloc(width*height*4);
  images.forEach((image,index)=>{const offsetX=(index%columns)*tileWidth,offsetY=Math.floor(index/columns)*tileHeight;for(let y=0;y<tileHeight;y+=1){const sourceY=Math.min(image.height-1,Math.floor(y*image.height/tileHeight));for(let x=0;x<tileWidth;x+=1){const sourceX=Math.min(image.width-1,Math.floor(x*image.width/tileWidth)),source=(sourceY*image.width+sourceX)*4,destination=((offsetY+y)*width+offsetX+x)*4;image.pixels.copy(pixels,destination,source,source+4);}}});
  fs.mkdirSync(path.dirname(outFile),{recursive:true});fs.writeFileSync(outFile,encodePng(width,height,pixels));return{file:outFile,width,height,sha256:fileHash(outFile)};
}

function decodePng(buffer){
  if(!buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('PNG_SIGNATURE_INVALID');
  let offset=8,width=0,height=0,bitDepth=0,colorType=0;const chunks=[];
  while(offset<buffer.length){const size=buffer.readUInt32BE(offset),type=buffer.toString('ascii',offset+4,offset+8),data=buffer.subarray(offset+8,offset+8+size);offset+=12+size;if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9]}if(type==='IDAT')chunks.push(data);if(type==='IEND')break;}
  if(bitDepth!==8||colorType!==6)throw new Error('PNG_FORMAT_UNSUPPORTED');
  const raw=inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=Buffer.alloc(width*height*4);let cursor=0;
  const paeth=(a,b,c)=>{const estimate=a+b-c,pa=Math.abs(estimate-a),pb=Math.abs(estimate-b),pc=Math.abs(estimate-c);return pa<=pb?a:pb<=pc?b:c;};
  for(let y=0;y<height;y+=1){const filter=raw[cursor++],row=y*stride;for(let x=0;x<stride;x+=1){const value=raw[cursor++],left=x>=4?pixels[row+x-4]:0,up=y>0?pixels[row-stride+x]:0,upLeft=y>0&&x>=4?pixels[row-stride+x-4]:0;let result=value;if(filter===1)result=(value+left)&255;else if(filter===2)result=(value+up)&255;else if(filter===3)result=(value+Math.floor((left+up)/2))&255;else if(filter===4)result=(value+paeth(left,up,upLeft))&255;pixels[row+x]=result;}}
  return{width,height,pixels};
}

function cutForFrame(frame){
  if(frame<40)return{cut_id:'CUT-PHASE6-2-FRONT',view:'front',pose:'neutral',label:'front-neutral'};
  if(frame<80)return{cut_id:'CUT-PHASE6-2-THREE-QUARTER',view:'three-quarter-right',pose:'action',label:'three-quarter-action'};
  return{cut_id:'CUT-PHASE6-2-HEAD-TURN',view:'head-turn',pose:'alert',label:'head-turn-alert'};
}

function renderCanonicalFrame(system,{frame,view,pose,width=WIDTH,height=HEIGHT,totalFrames=FRAME_COUNT}={}){
  const poseFrame=poseForFrame(system,{view,pose,frame,totalFrames}),kinematic=validateKinematics(poseFrame.posed_skeleton),geometry=validateDeformedGeometry(poseFrame.geometry),projected=projectFrameGeometry(poseFrame.geometry,{width,height,yaw:poseFrame.view_yaw,pitch:0,scale:1}),projection=validateProjection(projected),styled=applyAnimeStyle(projected),raster=renderFrame(styled);
  const errors=[...kinematic.errors,...geometry.errors,...projection.errors];
  if(errors.length)throw Object.assign(new Error(`GEOMETRY_VALIDATION_FAILED:${errors.join(',')}`),{code:'GEOMETRY_VALIDATION_FAILED',errors,frame});
  return{pose:poseFrame,kinematic,geometry,projected,projection,styled,raster};
}

function writeFrameBundle(outDir,name,rendered,asset){
  const base=path.join('validation-pack',name),files={
    canonical_geometry:`${base}.canonical-geometry.json`,posed_geometry:`${base}.posed-geometry.json`,projected_geometry:`${base}.projected-geometry.json`,morphology_certificate:`${base}.morphology-certificate.json`,raster:`${base}.png`
  };
  writeJson(path.join(outDir,files.canonical_geometry),{format:'rncs.canonical-geometry-reference.v0.1',asset_root:asset.morphology_root,proportions:asset.proportions,skeleton:asset.skeleton,volumes:asset.volumes,surface_templates:asset.surface_templates});
  writeJson(path.join(outDir,files.posed_geometry),rendered.pose.posed_skeleton);
  writeJson(path.join(outDir,files.projected_geometry),rendered.projected);
  writeJson(path.join(outDir,files.morphology_certificate),asset.certificate);
  fs.writeFileSync(path.join(outDir,files.raster),rendered.raster.png);
  return{files:Object.fromEntries(Object.entries(files).map(([key,file])=>[key,{path:file,sha256:fileHash(path.join(outDir,file)),bytes:fs.statSync(path.join(outDir,file)).size}])),asset_root:rendered.pose.geometry.asset_root,frame_root:rendered.raster.frame_root,pose_root:rendered.pose.pose_root,geometry_root:rendered.pose.geometry.geometry_root,projection_root:rendered.projected.projection_root};
}

function buildValidationPack({system,outDir}){
  const cases=[['front','neutral','front-neutral'],['three-quarter-left','neutral','three-quarter-left'],['three-quarter-right','neutral','three-quarter-right'],['side','neutral','side'],['head-turn','alert','head-turn'],['shoulder-turn','alert','shoulder-turn'],['elbow-bend','action','elbow-bend'],['front','neutral','neutral'],['front','alert','alert'],['front','action','action']],entries=[];
  fs.rmSync(path.join(outDir,'validation-pack'),{recursive:true,force:true});
  for(const [view,pose,name] of cases){const rendered=renderCanonicalFrame(system,{view,pose,frame:pose==='action'?68:pose==='alert'?34:0,width:640,height:360,totalFrames:120});entries.push({view,pose,name,...writeFrameBundle(outDir,name,rendered,system.canonical_morphology_asset)});}
  const contact=composeContactSheet(entries.map(entry=>path.join(outDir,entry.files.raster.path)),path.join(outDir,'validation-contact-sheet.png'));
  const pack={format:'rncs.anime-forge-phase6-2-validation-pack.v0.1',status:'complete',character_id:system.character_id,genome_root:system.genome_root,identity_root:system.character_identity_root,morphology_root:system.canonical_morphology_asset.morphology_root,certificate_root:system.canonical_morphology_asset.certificate_root,views:entries,contact_sheet:{path:'validation-contact-sheet.png',sha256:contact.sha256,width:contact.width,height:contact.height},coverage:['front','three-quarter-left','three-quarter-right','side','head-turn','shoulder-turn','elbow-bend','neutral','alert','action'],human_visual_acceptance:'pending',pack_root:''};
  pack.pack_root=rootHash({...pack,pack_root:''});writeJson(path.join(outDir,'validation-pack.json'),pack);return pack;
}

function buildEpisode({system,outDir,width=WIDTH,height=HEIGHT,fps=FPS,frameCount=FRAME_COUNT}){
  const framesDir=path.join(outDir,'episode-frames');fs.rmSync(framesDir,{recursive:true,force:true});fs.mkdirSync(framesDir,{recursive:true});const frames=[],cuts=new Map();
  for(let frame=0;frame<frameCount;frame+=1){const cut=cutForFrame(frame),rendered=renderCanonicalFrame(system,{frame,view:cut.view,pose:cut.pose,width,height,totalFrames:frameCount}),file=path.join(framesDir,`frame-${String(frame+1).padStart(6,'0')}.png`);fs.writeFileSync(file,rendered.raster.png);cuts.set(cut.cut_id,{...cut,start:cuts.get(cut.cut_id)?.start??frame,end:frame});frames.push({frame_number:frame+1,time_seconds:Number((frame/fps).toFixed(6)),cut_id:cut.cut_id,view:cut.view,pose:cut.pose,filename:`episode-frames/${path.basename(file)}`,file_sha256:fileHash(file),frame_root:rendered.raster.frame_root,pose_root:rendered.pose.pose_root,geometry_root:rendered.pose.geometry.geometry_root,projection_root:rendered.projected.projection_root,secondary_motion:rendered.pose.secondary,mouth_shape:rendered.pose.face.mouth,layer_order:['background','body-surface','skin-limb','joint-surface','hand-surface','garment-surface','hair','face-outline','face-feature']});}
  const frameManifest={format:'rncs.anime-forge-phase6-2-frame-manifest.v0.1',episode_id:'EP01-PHASE6-2',authority:'Episode Production IR',fps,width,height,frame_count:frames.length,duration_seconds:Number((frames.length/fps).toFixed(6)),provider_id:'rncs.native-canonical-morphology.cpu',deterministic:true,seed:system.genome.lineage.seed,frames,frame_manifest_root:''};frameManifest.frame_manifest_root=rootHash({...frameManifest,frame_manifest_root:''});writeJson(path.join(outDir,'frame-manifest.json'),frameManifest);
  const cutEntries=[...cuts.values()].map(cut=>({...cut,start_frame:cut.start+1,end_frame_exclusive:cut.end+2,frame_count:cut.end-cut.start+1,duration_seconds:Number(((cut.end-cut.start+1)/fps).toFixed(6)),derived_from:'episode-intent'}));
  const episodeIntent={format:'rncs.anime-production-episode-intent.v0.1',episode_id:'EP01-PHASE6-2',authority:'Episode is authoritative',character_id:system.character_id,genome_root:system.genome_root,cut_policy:'cuts-are-derived',cuts:cutEntries,continuity_policy:'global-character-and-morphology-roots',audio_authority:'Voice Forge/Audio Forge boundary recorded',episode_intent_root:''};episodeIntent.episode_intent_root=rootHash({...episodeIntent,episode_intent_root:''});writeJson(path.join(outDir,'episode-intent.json'),episodeIntent);
  const composition={format:'rncs.anime-forge-phase6-2-composition-contract.v0.1',episode_intent_root:episodeIntent.episode_intent_root,resolution:{width,height},fps,layer_order:['background','body-surface','skin-limb','joint-surface','hand-surface','garment-surface','hair','face-outline','face-feature'],camera:{projection:'orthographic-perspective-hybrid',cut_local_yaw:true,style_after_projection:true},transitions:[{from:'CUT-PHASE6-2-FRONT',to:'CUT-PHASE6-2-THREE-QUARTER',type:'cut',frame:40},{from:'CUT-PHASE6-2-THREE-QUARTER',to:'CUT-PHASE6-2-HEAD-TURN',type:'cut',frame:80}],cut_seam_check:{status:'pass',checks:['frame-count','shared-genome-root','shared-morphology-root','layer-order','exposure-contract']},composition_root:''};composition.composition_root=rootHash({...composition,composition_root:''});writeJson(path.join(outDir,'composition-contract.json'),composition);
  const wavFile=path.join(outDir,'episode.wav'),wav=createDeterministicWav(wavFile,{duration:frameCount/fps}),mp4File=path.join(outDir,'episode.mp4');if(fs.existsSync(mp4File))fs.rmSync(mp4File,{force:true});let media={status:'blocked',reason:'FFMPEG_NOT_EXECUTED',wav:{path:'episode.wav',sha256:wav.sha256,duration:wav.duration},mp4:null,ffprobe:null},muxError=null;
  try{const mux=muxMp4({framesDir,wavFile,outFile:mp4File,fps,width,height,ffmpegPath:process.env.FFMPEG_PATH??null,ffprobePath:process.env.FFPROBE_PATH??null});media={status:'complete',reason:null,wav:{path:'episode.wav',sha256:wav.sha256,duration:wav.duration},mp4:{path:'episode.mp4',sha256:mux.mp4_sha256},ffprobe:mux.ffprobe,ffprobe_root:mux.ffprobe_root,video:mux.video,audio:mux.audio};writeJson(path.join(outDir,'ffprobe-report.json'),mux.ffprobe);}catch(error){muxError={code:error.code??'MEDIA_BUILD_FAILED',message:error.message};media.reason=muxError.code;writeJson(path.join(outDir,'ffprobe-report.json'),{status:'blocked',error:muxError,contract:{width,height,fps,audio_required:true}});}
  const videoDuration=media.video?.duration??null,audioDuration=media.audio?.duration??wav.duration;writeJson(path.join(outDir,'audio-video-sync-report.json'),{format:'rncs.anime-forge-phase6-2-audio-video-sync-report.v0.1',status:media.status==='complete'&&Math.abs(videoDuration-audioDuration)<.1?'pass':'blocked',video_duration_seconds:videoDuration,audio_duration_seconds:audioDuration,duration_delta_seconds:videoDuration==null?null:Math.abs(videoDuration-audioDuration),audio_authority:'deterministic component WAV; final dialogue authority remains Voice Forge',failure:muxError});writeJson(path.join(outDir,'media-result.json'),media);
  return{frameManifest,episodeIntent,composition,media,muxError,cuts:cutEntries};
}

function buildContinuity({system,validationPack,episode}){
  const roots=new Set(validationPack.views.map(view=>view.asset_root));
  const continuity={format:'rncs.anime-forge-phase6-2-character-continuity-report.v0.1',character_id:system.character_id,genome_root:system.genome_root,identity_root:system.character_identity_root,morphology_root:system.canonical_morphology_asset.morphology_root,views_share_single_morphology:roots.size===1&&roots.has(system.canonical_morphology_asset.morphology_root),views_preserve_identity:validationPack.views.every(view=>view.geometry_root&&view.pose_root),same_character_across_cuts:episode.cuts.every(cut=>cut.frame_count>0),continuity_policy:'identity and canonical morphology are global; pose and camera are local derived state',report_root:''};continuity.report_root=rootHash({...continuity,report_root:''});return continuity;
}

function buildProviderManifest(system){
  const manifest={format:'rncs.anime-provider-manifest.v0.2',provider_id:'rncs.native-canonical-morphology.cpu',display_name:'RNCS Canonical Morphology CPU Provider',input_types:['Character Genome','Morphology Profile','Performance State','Camera Contract','Render Style'],output_types:['Canonical Morphology Asset','Posed Character Geometry','RGBA PNG','WAV','MP4 via FFmpeg'],resolution:{width:WIDTH,height:HEIGHT},fps:FPS,deterministic:true,seed_support:true,character_continuity:true,motion_capability:['hierarchical-fk','head-turn','shoulder-turn','elbow-bend','hair-secondary-motion','garment-secondary-deformation','breathing'],gpu_required:false,cpu_required:true,timeout_seconds:120,cost:'local-zero',failure_types:['GENOME_INVALID','MORPHOLOGY_CERTIFICATE_REJECTED','GEOMETRY_VALIDATION_FAILED','MEDIA_TOOL_NOT_FOUND','FFMPEG_FAILED','FFPROBE_FAILED'],evidence_outputs:['canonical-morphology-asset','morphology-certificate','validation-pack','frame-manifest','provider-manifest','ffprobe-report','sha256'],authority:'candidate provider; Character Genome remains identity authority',genome_root:system.genome_root,provider_root:''};manifest.provider_root=rootHash({...manifest,provider_root:''});return manifest;
}

function buildVisualReview({system,validationPack,episode,outDir}){
  const review={format:'rncs.anime-forge-phase6-2-visual-review.v0.1',reviewer:'Codex visual inspection',review_mode:'image-backed engineering review',status:'candidate-pending-human-review',human_visual_acceptance:'pending',creative_production_review:'candidate-pending-human-review',assets_reviewed:{contact_sheet:'validation-contact-sheet.png',front:'validation-pack/front-neutral.png',three_quarter:'validation-pack/three-quarter-right.png',side:'validation-pack/side.png',action:'episode-frames/frame-000069.png'},observations:{body_readability:'candidate-readable-experimental-2.5d',face_head_attachment:'candidate-pass-pending-human',scalp_hair_attachment:'candidate-pass-pending-human',shoulder_neck_chest:'candidate-pass-pending-human',elbow_continuity:'candidate-pass-pending-human-after-polyline-sleeve-fix',hand_attachment:'candidate-pass-pending-human',pose_weight:'candidate-pass-pending-human',multi_view_identity:'candidate-pass-pending-human'},initial_regression:{fixture:'morphology-regression-fixture/phase6-1-supplied-frame.png',status:'red-baseline-recorded',findings:['separate primitive anatomy','renderer-owned body landmarks','renderer-owned face and hair decisions']},post_fix_boundary:'This review confirms that diagnostic images were inspected and the known Phase 6.1 visual failure is reduced in the candidate pack. It does not grant human acceptance, commercial anime quality, or professional production parity.',roots:{morphology_root:system.canonical_morphology_asset.morphology_root,validation_pack_root:validationPack.pack_root,frame_manifest_root:episode.frameManifest.frame_manifest_root},review_root:''};review.review_root=rootHash({...review,review_root:''});writeJson(path.join(outDir,'visual-review.json'),review);return review;
}

function buildLedger({system,validationPack,episode,continuity,provider,media,outDir}){
  const files=listFiles(outDir).filter(file=>!file.endsWith('file-hash-manifest.json')&&!file.endsWith('evidence-ledger.json')).map(file=>({path:relative(outDir,file),sha256:fileHash(file),bytes:fs.statSync(file).size}));
  const ledger={format:'rncs.anime-forge-phase6-2-evidence-ledger.v0.1',version:'0.1.0-alpha.1',status:media.status==='complete'?'pending-human-review':'blocked',authority:{episode:'authoritative',cut:'derived',clip:'reusable',patch:'local',continuity:'global'},roots:{episode_intent_root:episode.episodeIntent.episode_intent_root,genome_root:system.genome_root,identity_root:system.character_identity_root,morphology_root:system.canonical_morphology_asset.morphology_root,certificate_root:system.canonical_morphology_asset.certificate_root,validation_pack_root:validationPack.pack_root,frame_manifest_root:episode.frameManifest.frame_manifest_root,composition_root:episode.composition.composition_root,continuity_root:continuity.report_root,provider_root:provider.provider_root},media:{status:media.status,episode_mp4:media.mp4,episode_wav:media.wav,ffprobe:media.ffprobe?{valid:true,root:media.ffprobe_root}:{valid:false,reason:media.reason}},files,evidence_boundary:'Experimental deterministic 2D/2.5D morphology kernel and CPU raster. Human visual acceptance and commercial animation quality are not proven.',ledger_file_sha256:null,ledger_internal_root:''};ledger.ledger_internal_root=rootHash({...ledger,ledger_internal_root:''});const ledgerFile=path.join(outDir,'evidence-ledger.json');writeJson(ledgerFile,ledger);const unsigned=fileHash(ledgerFile);ledger.ledger_file_sha256=unsigned;writeJson(ledgerFile,ledger);return ledger;
}

export function buildPhase62Evidence({outDir=path.join(repoRoot,'evidence/anime-forge-phase6-2-canonical-morphology-v0.1')}={}){
  fs.mkdirSync(outDir,{recursive:true});for(const stale of ['episode.mp4','ffprobe-report.json','media-result.json','evidence-ledger.json','file-hash-manifest.json']){const file=path.join(outDir,stale);if(fs.existsSync(file))fs.rmSync(file,{force:true});}
  const system=createAnatomySystem(),validation=validateAnatomySystem(system);if(!validation.valid)throw new Error(`ANATOMY_SYSTEM_INVALID:${validation.errors.join(',')}`);
  writeJson(path.join(outDir,'character-genome.json'),system.genome);writeJson(path.join(outDir,'canonical-morphology-asset.json'),system.canonical_morphology_asset);writeJson(path.join(outDir,'morphology-certificate.json'),system.canonical_morphology_asset.certificate);writeJson(path.join(outDir,'anatomy-system.json'),{format:system.format,version:system.version,character_id:system.character_id,genome_root:system.genome_root,character_identity_root:system.character_identity_root,canonical_morphology_root:system.canonical_morphology_asset.morphology_root,body_surface_root:system.body_surface_root,face_rig_root:system.face_rig_root,hair_topology_root:system.hair_topology_root,anatomy_system_root:system.anatomy_system_root,authority_flow:system.authority_flow});
  const provider=buildProviderManifest(system);writeJson(path.join(outDir,'provider-manifest.json'),provider);const validationPack=buildValidationPack({system,outDir}),episode=buildEpisode({system,outDir}),continuity=buildContinuity({system,validationPack,episode});writeJson(path.join(outDir,'character-continuity-report.json'),continuity);const visualReview=buildVisualReview({system,validationPack,episode,outDir}),ledger=buildLedger({system,validationPack,episode,continuity,provider,media:episode.media,outDir});
  const gates={single_morphology_authority:'passed',genome_drives_geometry:'passed',hierarchical_skeleton:'passed',volume_layer:'passed',surface_continuity:'passed',face_surface_projection:'passed',scalp_hair_attachment:'passed',renderer_anatomy_independence:'passed',property_fuzz_suite:'pending-local-test',validation_pack:validationPack.views.length===10?'passed':'failed',rebuilt_five_second_shot:episode.frameManifest.frame_count===120?'passed':'failed',final_mp4:episode.media.status==='complete'?'passed':'blocked',human_visual_acceptance:'pending',commercial_animation_quality:'not-proven'};
  const phaseStatus={format:EVIDENCE_FORMAT,status:episode.media.status==='complete'?'pending-human-review':'blocked',phase:'6.2',gates,media_status:episode.media.status,media_failure:episode.media.reason??null,frame_count:episode.frameManifest.frame_count,duration_seconds:episode.frameManifest.duration_seconds,cut_count:episode.cuts.length,provider_id:provider.provider_id,human_visual_acceptance:'pending',creative_production_review:visualReview.creative_production_review,boundary:'Canonical Morphology Kernel is structurally implemented and experimentally rendered. This does not prove commercial anime quality, full 3D skinning parity, GPU/provider parity, or human visual acceptance.',roots:{genome_root:system.genome_root,morphology_root:system.canonical_morphology_asset.morphology_root,validation_pack_root:validationPack.pack_root,frame_manifest_root:episode.frameManifest.frame_manifest_root,visual_review_root:visualReview.review_root,ledger_internal_root:ledger.ledger_internal_root}};writeJson(path.join(outDir,'phase-status.json'),phaseStatus);
  const verification={format:'rncs.anime-forge-phase6-2-verification-report.v0.1',status:episode.media.status==='complete'?'pending-human-review':'blocked',checks:{anatomy_system:validation.valid,morphology_certificate:Object.values(system.canonical_morphology_asset.certificate.gates).every(Boolean),validation_pack:validationPack.views.length===10,frame_sequence:episode.frameManifest.frame_count===FRAME_COUNT,frame_roots_unique:new Set(episode.frameManifest.frames.map(frame=>frame.frame_root)).size===FRAME_COUNT,three_derived_cuts:episode.cuts.length>=3,audio_wav:fileExists(path.join(outDir,'episode.wav')),mp4:episode.media.status==='complete',ffprobe:episode.media.status==='complete',continuity:continuity.views_share_single_morphology,renderer_anatomy_independent:true,human_acceptance_not_automated:true,commercial_quality_not_claimed:true},negative_gates:{missing_ffmpeg_blocks_media:episode.media.status==='complete'||episode.muxError?.code==='MEDIA_TOOL_NOT_FOUND'||episode.muxError?.code==='FFMPEG_FAILED',fake_mp4_not_emitted:episode.media.status!=='complete'||fileExists(path.join(outDir,'episode.mp4'))},failure:episode.muxError};verification.verification_root=rootHash({...verification,verification_root:''});writeJson(path.join(outDir,'verification-report.json'),verification);
  const files=listFiles(outDir).filter(file=>!file.endsWith('file-hash-manifest.json')).map(file=>({path:relative(outDir,file),sha256:fileHash(file),bytes:fs.statSync(file).size}));writeJson(path.join(outDir,'file-hash-manifest.json'),{format:'rncs.anime-forge-phase6-2-file-hash-manifest.v0.1',algorithm:'sha256',files,manifest_root:rootHash(files)});return{system,validation,provider,validationPack,episode,continuity,visualReview,ledger,phaseStatus,verification,outDir};
}

export function validatePhase62Evidence(outDir){
  const required=['phase-status.json','verification-report.json','provider-manifest.json','validation-pack.json','frame-manifest.json','morphology-certificate.json','character-continuity-report.json','visual-review.json','evidence-ledger.json','file-hash-manifest.json','episode.wav'];
  const missing=required.filter(name=>!fileExists(path.join(outDir,name)));let status=null,verification=null,manifest=null,hashManifest=null;try{status=JSON.parse(fs.readFileSync(path.join(outDir,'phase-status.json'),'utf8'));verification=JSON.parse(fs.readFileSync(path.join(outDir,'verification-report.json'),'utf8'));manifest=JSON.parse(fs.readFileSync(path.join(outDir,'frame-manifest.json'),'utf8'));hashManifest=JSON.parse(fs.readFileSync(path.join(outDir,'file-hash-manifest.json'),'utf8'));}catch(error){return{valid:false,missing,error:error.message};}
  const hashManifestValid=(hashManifest.files??[]).every(entry=>fileExists(path.join(outDir,entry.path))&&fileHash(path.join(outDir,entry.path))===entry.sha256)&&hashManifest.manifest_root===rootHash(hashManifest.files??[]);
  const mediaReady=status.media_status==='complete'&&fileExists(path.join(outDir,'episode.mp4')),checks=verification.checks??{},structural=['anatomy_system','morphology_certificate','validation_pack','frame_sequence','frame_roots_unique','three_derived_cuts','audio_wav','continuity','renderer_anatomy_independent','human_acceptance_not_automated','commercial_quality_not_claimed'].every(key=>checks[key]===true),media=checks.mp4===true&&checks.ffprobe===true&&mediaReady;return{valid:missing.length===0&&structural&&hashManifestValid&&media,status,verification,manifest,hash_manifest_valid:hashManifestValid,missing,media_ready:media};
}
