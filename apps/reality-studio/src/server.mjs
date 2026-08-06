import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProject,sealProject,validateProject} from './model.mjs';
import {migrateProject} from './migration.mjs';
import {compileAll} from './compiler.mjs';
import {StudioRuntime} from './runtime.mjs';
import {BehaviorSessionRegistry,compileBehaviorStudio} from './behavior-studio.mjs';
import {normalizeProgram,validateProgram} from '@taowind/reality-behavior-fabric';
import {UnifiedSessionRegistry,validateUnifiedProject,ensureUIInputProject} from './scene-studio.mjs';
import {AssetForgeRegistry} from './asset-forge.mjs';
import {AnimeForgeSessionRegistry} from './anime-forge-studio.mjs';
import {NativeVisualGenesisWorkspace} from './native-visual-genesis-studio.mjs';
import {CharacterGenomeSessionRegistry} from './character-genome-studio.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.wav':'audio/wav','.ogg':'audio/ogg','.mp3':'audio/mpeg','.mp4':'video/mp4','.woff2':'font/woff2','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.bin':'application/octet-stream','.ktx2':'image/ktx2'};
const send=(res,code,value,type='application/json; charset=utf-8')=>{
  res.writeHead(code,{'content-type':type,'cache-control':'no-store','access-control-allow-origin':'*'});
  res.end(Buffer.isBuffer(value)||typeof value==='string'?value:JSON.stringify(value,null,2));
};
const body=req=>new Promise((resolve,reject)=>{
  let s='';
  req.on('data',d=>{s+=d;if(s.length>20_000_000){reject(new Error('body too large'));req.destroy();}});
  req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e);}});
});

function loadSampleBehavior(){
  return JSON.parse(fs.readFileSync(path.join(root,'examples','冰境试炼.behavior.json'),'utf8'));
}
function loadSampleUnified(){
  return ensureUIInputProject(JSON.parse(fs.readFileSync(path.join(root,'examples','冰境试炼.unified-project.json'),'utf8')));
}

export async function startStudioServer({host='127.0.0.1',port=17608,dataDir=path.join(root,'output/server'),ffmpegPath=process.env.FFMPEG_PATH??'ffmpeg',ffprobePath=process.env.FFPROBE_PATH??'ffprobe',nativeVisualEvidenceDir=process.env.RNCS_PHASE6_NATIVE_EVIDENCE??path.resolve(root,'../../evidence/anime-forge-phase6-native-visual-v0.1')}={}){
  const runtime=await new StudioRuntime({dataDir}).init();
  const behaviorSessions=new BehaviorSessionRegistry();
  const unifiedSessions=new UnifiedSessionRegistry();
  const assetForgeSessions=new AssetForgeRegistry();
  const animeForgeSessions=new AnimeForgeSessionRegistry({dataDir,ffmpegPath,ffprobePath});
  const nativeVisualWorkspace=new NativeVisualGenesisWorkspace({evidenceDir:nativeVisualEvidenceDir});
  const characterSample=fs.readFileSync(path.resolve(root,'../../packages/integration/rcl-character-genome-bridge/examples/lan-tianlin.character.rcl'),'utf8');
  const characterGenomeSessions=new CharacterGenomeSessionRegistry({dataDir,sampleSource:characterSample});
  const server=http.createServer(async(req,res)=>{
    try{
      const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);
      if(req.method==='OPTIONS')return send(res,204,'','text/plain');
      if(req.method==='GET'&&u.pathname==='/api/health')return send(res,200,{...(await runtime.health()),studio_version:'1.6.0-alpha.1',behavior_native:true,scene_asset_behavior_unified:true,webgpu_viewport:true,tilemap_native:true,navigation_native:true,ui_native:true,input_native:true,runtime_timeline:true,runtime_replay:true,runtime_time_travel:true,live_update_native:true,live_update_version:'0.1.0-alpha.1',asset_continuity_native:true,asset_reimport:true,dependency_graph:true,asset_ledger:true,asset_database:true,asset_incremental_cache:true,asset_change_plan:true,asset_watch:true,asset_streaming_native:true,asset_streaming_receipts:true,spatial_editor:true,spatial_bodies:true,spatial_characters:true,spatial_joints:true,spatial_audio_events:true,spatial_haptic_events:true,keyboard_input:true,gamepad_input:true,touch_input:true,asset_forge_native:true,ragf_version:'0.5.0-alpha.1',asset_candidate_review:true,targeted_asset_regeneration:true,asset_acceptance_to_scene:true,vsr_version:'0.8.0-alpha.1',rsr_version:'0.9.0-alpha.1',anime_forge_native:true,anime_forge_phase:'phase-4-media-closure-active',anime_forge_visual_phase:'phase-5-visual-body-replacement-blocked',anime_forge_visual_provider:'rncs.visual.local-diffusion-video-worker',anime_forge_human_visual_acceptance:'pending',anime_forge_mp4:'real-ffmpeg-fail-closed',anime_forge_phase6_native_visual_workspace:true,anime_forge_phase6_native_visual_evidence:nativeVisualWorkspace.available()?'available':'missing',anime_forge_phase6_native_visual_status:nativeVisualWorkspace.inspect().first_screen?.episode_playable?'complete':'blocked',anime_forge_phase6_native_visual_human_acceptance:nativeVisualWorkspace.inspect().first_screen?.human_visual_acceptance??'pending',anime_forge_phase6_native_visual_commercial_quality:nativeVisualWorkspace.inspect().phase_status?.commercial_anime_quality??'not-proven',character_genome_forge_native:true,character_genome_version:'0.1.0-alpha.1',character_genome_reference_provider:true});
      if(req.method==='GET'&&u.pathname==='/api/project/new')return send(res,200,createProject({}));
      if(req.method==='POST'&&u.pathname==='/api/project/validate'){const b=await body(req);return send(res,200,validateProject(b.project??b));}
      if(req.method==='POST'&&u.pathname==='/api/project/seal'){const b=await body(req);return send(res,200,sealProject(b.project??b));}
      if(req.method==='POST'&&u.pathname==='/api/project/migrate'){const b=await body(req);return send(res,200,migrateProject(b.project??b));}
      if(req.method==='POST'&&u.pathname==='/api/project/compile'){const b=await body(req);return send(res,200,compileAll(sealProject(b.project??b),b.options??{}));}
      if(req.method==='POST'&&u.pathname==='/api/branches/evaluate'){const b=await body(req);return send(res,200,await runtime.evaluateBranches(sealProject(b.project),b.options??{}));}
      if(req.method==='POST'&&u.pathname==='/api/branches/propose'){const b=await body(req);return send(res,200,await runtime.proposeBranch(sealProject(b.project),b.options??{}));}
      if(req.method==='POST'&&u.pathname==='/api/branches/adopt'){const b=await body(req);return send(res,200,await runtime.adoptBranch(sealProject(b.project),b.options??{}));}
      if(req.method==='POST'&&u.pathname==='/api/branches/commit'){const b=await body(req);return send(res,200,await runtime.commitBranch(sealProject(b.project),b.options??{}));}
      if(req.method==='POST'&&u.pathname==='/api/runtime/preview'){const b=await body(req);return send(res,200,await runtime.preview(sealProject(b.project),b.options??{}));}
      if(req.method==='POST'&&u.pathname==='/api/runtime/commit'){const b=await body(req);return send(res,200,await runtime.commit(sealProject(b.project),b.options??{}));}

      if(req.method==='GET'&&u.pathname==='/api/behavior/sample')return send(res,200,loadSampleBehavior());
      if(req.method==='POST'&&u.pathname==='/api/behavior/validate'){
        const b=await body(req);const p=b.program?.program_root?b.program:normalizeProgram(b.program??b);return send(res,200,validateProgram(p));
      }
      if(req.method==='POST'&&u.pathname==='/api/behavior/compile'){
        const b=await body(req);return send(res,200,compileBehaviorStudio(b.program??b));
      }
      if(req.method==='POST'&&u.pathname==='/api/behavior/session/new'){
        const b=await body(req);const session=behaviorSessions.create(b.program??loadSampleBehavior());return send(res,200,session.inspect());
      }
      if(req.method==='POST'&&u.pathname==='/api/behavior/session/inspect'){
        const b=await body(req);return send(res,200,behaviorSessions.get(b.session_id).inspect());
      }
      if(req.method==='POST'&&u.pathname==='/api/behavior/session/step'){
        const b=await body(req);return send(res,200,behaviorSessions.get(b.session_id).step(b.input??{}));
      }
      if(req.method==='POST'&&u.pathname==='/api/behavior/session/run'){
        const b=await body(req);return send(res,200,behaviorSessions.get(b.session_id).run({ticks:Number(b.ticks??1),inputs:b.inputs??[]}));
      }
      if(req.method==='POST'&&u.pathname==='/api/behavior/session/command'){
        const b=await body(req),s=behaviorSessions.get(b.session_id),cmd=b.command;let result;
        if(cmd==='pause')result=s.pause();
        else if(cmd==='resume')result=s.resume();
        else if(cmd==='reset')result=s.reset();
        else if(cmd==='undo')result=s.undo();
        else if(cmd==='redo')result=s.redo();
        else if(cmd==='breakpoint-add')result=s.addBreakpoint(b.type);
        else if(cmd==='breakpoint-remove')result=s.removeBreakpoint(b.type);
        else if(cmd==='snapshot')result=s.createSnapshot(b.label??'snapshot');
        else if(cmd==='restore')result=s.restoreSnapshot(b.snapshot_id);
        else if(cmd==='hot-reload')result=s.replaceProgram(b.program,{preserveState:b.preserve_state!==false});
        else if(cmd==='patch')result=s.patch(b.patches??[],{preserveState:b.preserve_state!==false});
        else throw Object.assign(new Error(`COMMAND_UNKNOWN:${cmd}`),{code:'COMMAND_UNKNOWN'});
        return send(res,200,result);
      }
      if(req.method==='POST'&&u.pathname==='/api/behavior/session/export'){
        const b=await body(req);return send(res,200,behaviorSessions.get(b.session_id).exportArtifacts());
      }

      if(req.method==='GET'&&u.pathname==='/api/unified/sample')return send(res,200,loadSampleUnified());
      if(req.method==='POST'&&u.pathname==='/api/unified/validate'){const b=await body(req);return send(res,200,validateUnifiedProject(b.project??b));}
      if(req.method==='POST'&&u.pathname==='/api/unified/session/new'){const b=await body(req);return send(res,200,unifiedSessions.create(b.project??loadSampleUnified()).inspect());}
      if(req.method==='POST'&&u.pathname==='/api/unified/session/inspect'){const b=await body(req);return send(res,200,unifiedSessions.get(b.session_id).inspect());}
      if(req.method==='POST'&&u.pathname==='/api/unified/session/command'){
        const b=await body(req),s=unifiedSessions.get(b.session_id);let result;
        if(b.command==='select')result=s.select(b.node_id);
        else if(b.command==='add-asset-node')result=s.addAssetNode({assetId:b.asset_id,x:b.x,y:b.y,name:b.name,bindEntity:b.bind_entity!==false});
        else if(b.command==='patch-node')result=s.patchNode(b.node_id,b.patch??{});
        else if(b.command==='move-node')result=s.moveNode(b.node_id,{x:b.x,y:b.y,snap:b.snap!==false});
        else if(b.command==='remove-node')result=s.removeNode(b.node_id);
        else if(b.command==='step')result=s.step(b.input??{});
        else if(b.command==='run')result=s.run({ticks:Number(b.ticks??1),inputs:b.inputs??[]});
        else if(b.command==='runtime-checkpoint')result=s.createRuntimeCheckpoint(b.label??'checkpoint');else if(b.command==='runtime-restore')result=s.restoreRuntimeCheckpoint(b.checkpoint_id);else if(b.command==='runtime-replay')result=s.replayRuntime({toTick:b.to_tick,verify:b.verify!==false});else if(b.command==='runtime-seek')result=s.seekRuntime({tick:b.tick??b.to_tick??0});else if(b.command==='pause')result=s.pause();
        else if(b.command==='reset')result=s.reset();
        else if(b.command==='undo')result=s.undo();
        else if(b.command==='redo')result=s.redo();
        else if(b.command==='replace-behavior')result=s.replaceBehavior(b.program,{preserveState:b.preserve_state!==false});
        else if(b.command==='live-update-propose')result=s.proposeLiveUpdate({patches:b.patches??[],preserveState:b.preserve_state!==false,metadata:b.metadata??{}});
        else if(b.command==='live-update-authorize')result=s.authorizeLiveUpdate({candidateId:b.candidate_id,resolver:b.resolver,claims:b.claims??[],constraints:b.constraints??[],reason:b.reason??''});
        else if(b.command==='live-update-commit')result=await s.commitLiveUpdate({candidateId:b.candidate_id,confirmed:b.confirmed===true,receiptRefs:b.receipt_refs??[]});
        else if(b.command==='live-update-rollback')result=s.rollbackLiveUpdate({candidateId:b.candidate_id,reason:b.reason??'candidate-withdrawn'});
        else if(b.command==='live-update'){
          if(b.phase==='propose')result=s.proposeLiveUpdate({patches:b.patches??[],preserveState:b.preserve_state!==false,metadata:b.metadata??{}});
          else if(b.phase==='authorize')result=s.authorizeLiveUpdate({candidateId:b.candidate_id,resolver:b.resolver,claims:b.claims??[],constraints:b.constraints??[],reason:b.reason??''});
          else if(b.phase==='commit')result=await s.commitLiveUpdate({candidateId:b.candidate_id,confirmed:b.confirmed===true,receiptRefs:b.receipt_refs??[]});
          else if(b.phase==='rollback')result=s.rollbackLiveUpdate({candidateId:b.candidate_id,reason:b.reason??'candidate-withdrawn'});
          else throw Object.assign(new Error(`LIVE_UPDATE_PHASE_UNKNOWN:${b.phase}`),{code:'LIVE_UPDATE_PHASE_UNKNOWN'});
        }
        else if(b.command==='import-asset')result=s.importAsset(b.bundle,{sourceRoot:b.source_root,importProposal:b.import_proposal,previewUrl:b.preview_url,strictFiles:b.strict_files===true});
        else if(b.command==='import-local-asset')result=s.importLocalAsset(b.file_path,{sourceRoot:b.source_root,name:b.name,previewUrl:b.preview_url});
        else if(b.command==='import-embedded-asset')result=s.importEmbeddedAsset(b.file??b,{assetId:b.asset_id});
        else if(b.command==='import-asset-source')result=s.importAssetSource(b.source,{sourceRoot:b.source_root,recursive:b.recursive!==false});
        else if(b.command==='reimport-asset')result=s.reimportAsset(b.asset_id,{strict:b.strict!==false});
        else if(b.command==='reimport-all-assets')result=s.reimportAllAssets({strict:b.strict===true});
         else if(b.command==='audit-assets')result=s.auditAssets({strictFiles:b.strict_files===true});
         else if(b.command==='asset-dependency-graph')result=s.assetDependencyGraph();
         else if(b.command==='asset-ledger')result=s.assetLedger({strictFiles:b.strict_files===true});
         else if(b.command==='asset-database-plan')result=s.assetDatabasePlan({cacheDir:b.cache_dir,sourceRoots:b.source_roots,recursive:b.recursive!==false,profiles:b.profiles??['runtime']});
         else if(b.command==='asset-database-sync')result=s.assetDatabaseSync({cacheDir:b.cache_dir,sourceRoots:b.source_roots,recursive:b.recursive!==false,profiles:b.profiles??['runtime'],materialize:b.materialize!==false});
         else if(b.command==='asset-stream')result=await s.assetStreaming({cacheDir:b.cache_dir,profile:b.profile??'runtime',maxConcurrent:Number(b.max_concurrent??4),request:b.request??{requestedAssetIds:b.requested_asset_ids??[],activeCellIds:b.active_cell_ids??[],maxAssets:b.max_assets,maxBytes:b.max_bytes}});
        else if(b.command==='gpu-options')result=s.setGPUOptions({quality:b.quality,observer:b.observer,gpu_tier:b.gpu_tier,enabled:b.enabled});
        else if(b.command==='tile-edit')result=s.editTile({operation:b.operation,layerId:b.layer_id,x:b.x,y:b.y,tileId:b.tile_id,cells:b.cells??[],rect:b.rect??null});
        else if(b.command==='tile-tool')result=s.setTileTool({layerId:b.layer_id,tileId:b.tile_id,overlay:b.overlay,tool:b.tool});
        else if(b.command==='navigation-query')result=s.queryPath({start:b.start,end:b.end,startNodeId:b.start_node_id,endNodeId:b.end_node_id,allowDiagonal:b.allow_diagonal===true,smooth:b.smooth!==false,excludeNodeIds:b.exclude_node_ids??[]});
        else if(b.command==='navigation-target')result=s.setNavigationTarget({nodeId:b.node_id,x:b.x,y:b.y,speedMilli:b.speed_milli,allowDiagonal:b.allow_diagonal===true});
        else if(b.command==='navigation-clear')result=s.clearNavigationTarget(b.node_id);
        else if(b.command==='ui-select')result=s.selectUINode(b.ui_node_id);
        else if(b.command==='ui-patch')result=s.patchUINode(b.ui_node_id,b.patch??{});
        else if(b.command==='ui-add')result=s.addUINode({parentId:b.parent_id,node:b.node});
        else if(b.command==='ui-remove')result=s.removeUINode(b.ui_node_id);
        else if(b.command==='ui-event')result=s.dispatchUIEvent({type:b.type,x:b.x,y:b.y,touch:b.touch===true});
        else if(b.command==='ui-focus')result=s.moveFocus(b.direction);
        else if(b.command==='input-sample')result=s.sampleInput(b.raw??{});
        else if(b.command==='input-rebind')result=s.setInputBinding({action:b.action,binding:b.binding,replace:b.replace===true});
        else if(b.command==='spatial-select-body')result=s.spatialSelectBody(b.body_id);
        else if(b.command==='spatial-select-joint')result=s.spatialSelectJoint(b.joint_id);
        else if(b.command==='spatial-add-body')result=s.spatialAddBody(b.options??b.body??{});
        else if(b.command==='spatial-patch-body')result=s.spatialPatchBody(b.body_id,b.patch??{});
        else if(b.command==='spatial-patch-fixture')result=s.spatialPatchFixture(b.body_id,b.fixture_id,b.patch??{});
        else if(b.command==='spatial-remove-body')result=s.spatialRemoveBody(b.body_id);
        else if(b.command==='spatial-add-joint')result=s.spatialAddJoint(b.options??b.joint??{});
        else if(b.command==='spatial-patch-joint')result=s.spatialPatchJoint(b.joint_id,b.patch??{});
        else if(b.command==='spatial-remove-joint')result=s.spatialRemoveJoint(b.joint_id);
        else if(b.command==='spatial-character')result=s.spatialUpsertCharacter(b.spec??b.character??{});
        else if(b.command==='spatial-camera')result=s.spatialSetCamera(b.options??{});
        else if(b.command==='spatial-command')result=s.spatialCommand(b.spatial_command??b.payload??{});
        else if(b.command==='spatial-step')result=s.spatialStep({commands:b.commands??[]});
        else if(b.command==='spatial-run')result=s.spatialRun({ticks:Number(b.ticks??1),commands:b.commands??[]});
        else if(b.command==='spatial-reset')result=s.spatialReset();
        else if(b.command==='spatial-snapshot')result=s.spatialSnapshot(b.label??'snapshot');
        else if(b.command==='spatial-restore')result=s.spatialRestore(b.snapshot_id);
        else if(b.command==='spatial-projection')result=s.spatialProjection({width:Number(b.width??480),height:Number(b.height??270),qualityTier:b.quality_tier??'balanced'});
        else if(b.command==='sequence-seek')result=s.sequenceSeek(Number(b.time??0));
        else if(b.command==='sequence-step')result=s.sequenceStep(Number(b.frames??1));
        else if(b.command==='sequence-play')result=s.sequencePlay(Number(b.frames??1));
        else if(b.command==='sequence-add-clip')result=s.sequenceAddClip({trackId:b.track_id,clip:b.clip});
        else if(b.command==='sequence-snapshot')result=s.sequenceSnapshot(b.label??'snapshot');
        else if(b.command==='sequence-restore')result=s.sequenceRestore(b.label);
        else throw Object.assign(new Error(`COMMAND_UNKNOWN:${b.command}`),{code:'COMMAND_UNKNOWN'});
        return send(res,200,result);
      }
      if(req.method==='POST'&&u.pathname==='/api/unified/session/export'){const b=await body(req);return send(res,200,unifiedSessions.get(b.session_id).exportArtifacts());}
      if(req.method==='POST'&&u.pathname==='/api/unified/session/gpu-frame'){const b=await body(req),s=unifiedSessions.get(b.session_id);return send(res,200,s.compileGPUFrame({quality:b.quality,observer:b.observer,gpu_tier:b.gpu_tier,serialized:true}));}

      if(req.method==='POST'&&u.pathname==='/api/asset-forge/session/new'){
        const b=await body(req),manufacturing=unifiedSessions.get(b.unified_session_id),token=String(b.name??b.intent?.description??'asset').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,48)||'asset';
        const outDir=path.resolve(b.out_dir??path.join(dataDir,'asset-forge',`${Date.now()}-${token}`));
        const session=assetForgeSessions.create(manufacturing,b.intent,{outDir,providers:b.providers??[]});return send(res,200,session.inspect());
      }
      if(req.method==='POST'&&u.pathname==='/api/asset-forge/session/inspect'){const b=await body(req);return send(res,200,assetForgeSessions.get(b.forge_id).inspect());}
      if(req.method==='POST'&&u.pathname==='/api/asset-forge/session/generate'){const b=await body(req);return send(res,200,assetForgeSessions.get(b.forge_id).generate());}
      if(req.method==='POST'&&u.pathname==='/api/asset-forge/session/select'){const b=await body(req);return send(res,200,assetForgeSessions.get(b.forge_id).select(b.candidate_id,{reason:b.reason??'api-selection'}));}
      if(req.method==='POST'&&u.pathname==='/api/asset-forge/session/regenerate'){const b=await body(req);return send(res,200,assetForgeSessions.get(b.forge_id).regenerate(b.patch??{}, {label:b.label??'api-targeted-regeneration'}));}
      if(req.method==='POST'&&u.pathname==='/api/asset-forge/session/preview'){const b=await body(req);return send(res,200,assetForgeSessions.get(b.forge_id).preview({includeRuntime:b.include_runtime!==false}));}
      if(req.method==='POST'&&u.pathname==='/api/asset-forge/session/accept'){const b=await body(req);return send(res,200,assetForgeSessions.get(b.forge_id).acceptIntoProject({x:Number(b.x??160),y:Number(b.y??160),z:Number(b.z??0),name:b.name??null,bindEntity:b.bind_entity!==false,addSpatial:b.add_spatial!==false}));}
      if(req.method==='POST'&&u.pathname==='/api/asset-forge/session/export'){const b=await body(req);return send(res,200,assetForgeSessions.get(b.forge_id).exportArtifacts());}

      if(req.method==='GET'&&u.pathname==='/api/anime-forge/sample')return send(res,200,{source:fs.readFileSync(path.resolve(root,'../../packages/integration/rcl-anime-production-bridge/examples/shenlinzhe-yanlv-micro-episode.rcl'),'utf8')});
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/compile'){
        const b=await body(req),source=String(b.source??'');if(!source.trim())return send(res,422,{ok:false,diagnostics:[{code:'ANIME_SOURCE_REQUIRED',message:'Anime source is required'}]});
        const session=animeForgeSessions.create(source);return send(res,200,{ok:true,...session.inspect()});
      }
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/session/inspect'){const b=await body(req);return send(res,200,animeForgeSessions.get(b.session_id).inspect());}
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/visual-quality'){const b=await body(req),session=animeForgeSessions.get(b.session_id),workspace=session.visualQuality();return send(res,200,{ok:true,...workspace,candidate_review:session.visualCandidateReview(workspace)});}
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/visual-candidate-action'){const b=await body(req),session=animeForgeSessions.get(b.session_id);return send(res,200,session.visualCandidateAction(String(b.action??'')));}
      if(req.method==='GET'&&u.pathname==='/api/anime-forge/native-visual-workspace'){
        const command=String(u.searchParams.get('command')??'inspect'),result=nativeVisualWorkspace.command(command,{disclosure:u.searchParams.get('disclosure')??'summary',frame:Number(u.searchParams.get('frame')??0),layer:u.searchParams.get('layer')??'color',viewport:u.searchParams.get('viewport')??'desktop'});
        return send(res,200,{ok:true,...result});
      }
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/native-visual-workspace'){
        const b=await body(req),result=nativeVisualWorkspace.command(String(b.command??'inspect'),{...b,disclosure:b.disclosure??'summary',frame:Number(b.frame??0),layer:b.layer??'color',viewport:b.viewport??'desktop'});
        return send(res,200,{ok:true,...result});
      }
      if(req.method==='GET'&&u.pathname==='/api/anime-forge/native-visual-workspace/asset'){
        const file=nativeVisualWorkspace.asset(u.searchParams.get('path')),type=mime[path.extname(file)]??'application/octet-stream';
        return send(res,200,fs.readFileSync(file),type);
      }
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/select-cut'){const b=await body(req),session=animeForgeSessions.get(b.session_id),selection=session.selectCut(b.cut_ref??b.cut_id);return send(res,200,{ok:true,...selection,session:session.inspect()});}
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/xsheet'){const b=await body(req);const session=animeForgeSessions.get(b.session_id);return send(res,200,{ok:true,...session.inspect(),xsheet:session.xsheet(b.cut_ref??b.cut_id)});}
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/xsheets'){const b=await body(req);const session=animeForgeSessions.get(b.session_id);return send(res,200,{ok:true,session_id:session.session_id,xsheets:session.xsheets()});}
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/voice'){
        const b=await body(req),session=animeForgeSessions.get(b.session_id),result=session.voiceFor({dialogueId:b.dialogue_id,voiceIdentity:b.voice_identity,text:b.text,emotion:b.emotion});
        return send(res,200,{ok:result.validation.valid,session_id:session.session_id,production_root:result.production_root,cut_ref:result.cut_ref,replaced:result.replaced,take_id:result.take_id,voice:{bundle_root:result.bundle.bundle_root,voice_identity:result.bundle.voice_identity,duration_seconds:result.bundle.duration_seconds,viseme_count:result.bundle.viseme_timeline.length},validation:result.validation});
      }
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/render'){
        const b=await body(req),session=animeForgeSessions.get(b.session_id),result=session.render({quality:String(b.quality??'preview'),maxFrames:b.max_frames==null?null:Number(b.max_frames)}),first=result.manifest.frames[0],previewPath=first?path.join(session.out_dir,'render',first.filename):null;
        return send(res,200,{ok:true,session_id:session.session_id,production_root:session.production.production_root,sequence_root:result.manifest.sequence_root,manifest:{quality:result.manifest.quality,width:result.manifest.width,height:result.manifest.height,cut_count:result.manifest.cut_count,expected_frame_count:result.manifest.expected_frame_count,rendered_frame_count:result.manifest.rendered_frame_count,deterministic:result.manifest.deterministic,status:result.manifest.status},preview_frame:previewPath&&fs.existsSync(previewPath)?`data:image/png;base64,${fs.readFileSync(previewPath).toString('base64')}`:null});
      }
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/mix'){const b=await body(req),session=animeForgeSessions.get(b.session_id),result=session.mix();return send(res,200,{ok:result.validation.valid,session_id:session.session_id,audio_root:result.report.audio_root,master_root:result.report.master_root,stems:result.report.stems,validation:result.validation});}
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/media'){const b=await body(req),session=animeForgeSessions.get(b.session_id),result=session.buildMedia({quality:String(b.quality??'preview')}),base=`/api/anime-forge/media/${encodeURIComponent(session.session_id)}`,frames=session.last_media?.rendered?.manifest?.frames??[],posterFrame=frames[Math.min(frames.length-1,Math.max(0,Math.round((session.last_media?.rendered?.manifest?.fps??24)*4)))],posterFile=posterFrame?path.join(session.out_dir,'media','render',posterFrame.filename):null,previewFrame=posterFile&&fs.existsSync(posterFile)?`data:image/png;base64,${fs.readFileSync(posterFile).toString('base64')}`:null;return send(res,200,{...result,media_url:result.ok?`${base}/episode.mp4`:null,preview_frame:previewFrame,evidence_ledger_url:`${base}/evidence-ledger.json`,ffprobe_report_url:result.ok?`${base}/ffprobe-report.json`:null});}
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/verify'){const b=await body(req);return send(res,200,animeForgeSessions.get(b.session_id).verify());}
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/replay'){const b=await body(req),result=animeForgeSessions.get(b.session_id).replay();return send(res,200,result);}
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/control-plane'){const b=await body(req),result=await animeForgeSessions.get(b.session_id).controlPlane();return send(res,200,{ok:true,format:result.format,status:result.status,candidate_root:result.candidate_root,plan_id:result.plan_id,candidate_branch:result.candidate_branch,state_root:result.state_root,authority_requirements:result.authority_requirements,evidence_requirements:result.evidence_requirements,commit_permitted:result.commit_permitted});}
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/snapshot'){const b=await body(req);return send(res,200,animeForgeSessions.get(b.session_id).snapshot(b.id??'snapshot'));}
      if(req.method==='POST'&&u.pathname==='/api/anime-forge/rollback'){const b=await body(req);return send(res,200,animeForgeSessions.get(b.session_id).rollback(b.snapshot_id));}
      const animeMediaMatch=u.pathname.match(/^\/api\/anime-forge\/media\/([^/]+)\/(episode\.mp4|episode\.wav|evidence-ledger\.json|ffprobe-report\.json|build-summary\.json)$/);if(req.method==='GET'&&animeMediaMatch){const session=animeForgeSessions.get(decodeURIComponent(animeMediaMatch[1])),file=path.join(session.out_dir,'media',animeMediaMatch[2]);if(!fs.existsSync(file))return send(res,404,{error:{code:'ANIME_MEDIA_NOT_BUILT',message:'Requested media evidence is not available'}});return send(res,200,fs.readFileSync(file),mime[path.extname(file)]??'application/octet-stream');}

      if(req.method==='GET'&&u.pathname==='/api/character-genome/sample')return send(res,200,{source:characterSample,catalog:characterGenomeSessions.catalog()});
      if(req.method==='POST'&&u.pathname==='/api/character-genome/session/new'){const b=await body(req),session=characterGenomeSessions.create(String(b.source??characterSample));return send(res,200,{ok:true,...session.inspect()});}
      if(req.method==='POST'&&u.pathname==='/api/character-genome/session/inspect'){const b=await body(req);return send(res,200,{ok:true,...characterGenomeSessions.get(b.session_id).inspect()});}
      if(req.method==='POST'&&u.pathname==='/api/character-genome/session/command'){
        const b=await body(req),session=characterGenomeSessions.get(b.session_id);let result;
        if(b.command==='patch')result=session.patch(String(b.path),b.value);else if(b.command==='random')result=session.randomize();else if(b.command==='lock')result=session.setLock(String(b.parameter),b.locked!==false);else if(b.command==='symmetry')result=session.setSymmetry(b.enabled!==false);else if(b.command==='undo')result=session.undo();else if(b.command==='redo')result=session.redo();else if(b.command==='snapshot')result=session.snapshot(b.id??'snapshot');else if(b.command==='compare')result=session.compare(b.snapshot_id);else if(b.command==='rollback')result=session.rollback(b.snapshot_id);else if(b.command==='abort')result=session.abort();else if(b.command==='commit')result=session.commit({libraryDir:path.resolve(b.library_dir??path.join(dataDir,'character-library')),approved:b.approved===true});else if(b.command==='export')result=session.exportArtifacts();else throw Object.assign(new Error(`CHARACTER_COMMAND_UNKNOWN:${b.command}`),{code:'CHARACTER_COMMAND_UNKNOWN'});return send(res,200,{ok:true,...result});
      }
      if(req.method==='POST'&&u.pathname==='/api/character-genome/send-to-anime'){const b=await body(req),character=characterGenomeSessions.get(b.session_id),anime=animeForgeSessions.get(b.anime_session_id),result=anime.bindCharacter({...character.animeBinding(),actorId:b.actor_id??null});return send(res,200,{ok:true,...result});}

      if(req.method==='GET'&&u.pathname==='/favicon.ico')return send(res,204,'','image/x-icon');
      const rel=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1));
      const p=path.resolve(root,'web',rel);
      if(p.startsWith(path.resolve(root,'web'))&&fs.existsSync(p)&&fs.statSync(p).isFile())return send(res,200,fs.readFileSync(p),mime[path.extname(p)]??'application/octet-stream');
      return send(res,404,{error:'not found'});
    }catch(e){send(res,500,{error:{code:e.code??'ERROR',message:e.message,details:e.details??{}}});}
  });
  await new Promise(r=>server.listen(port,host,r));
  return{server,url:`http://${host}:${server.address().port}`,runtime,behaviorSessions,unifiedSessions,assetForgeSessions,animeForgeSessions,nativeVisualWorkspace,characterGenomeSessions};
}
