#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {startStudioServer} from './server.mjs';
import {createProject,sealProject,validateProject} from './model.mjs';
import {migrateProject} from './migration.mjs';
import {compileAll} from './compiler.mjs';
import {StudioRuntime} from './runtime.mjs';
import {BehaviorEditorSession,compileBehaviorStudio} from './behavior-studio.mjs';
import {normalizeProgram,validateProgram} from '@taowind/reality-behavior-fabric';
import {UnifiedManufacturingSession,validateUnifiedProject,ensureUIInputProject,sealUnifiedProject} from './scene-studio.mjs';
import {importAssetSource,reimportLocalAsset,auditAssetContinuity,createAssetContinuityLedger} from './asset-continuity.mjs';
import {compileSceneNavigation,findPath,smoothPath,pathWorldPoints,worldToCell} from './tilemap-navigation.mjs';
import {layoutUITree} from './ui-input.mjs';
import {AssetForgeSession} from './asset-forge.mjs';

const args=process.argv.slice(2),cmd=args.shift()??'serve';
const opt=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;};
const loadProject=()=>JSON.parse(fs.readFileSync(path.resolve(opt('--project')),'utf8'));
const loadProgram=()=>JSON.parse(fs.readFileSync(path.resolve(opt('--program')),'utf8'));
const loadUnified=()=>JSON.parse(fs.readFileSync(path.resolve(opt('--project')),'utf8'));
const loadIntent=()=>JSON.parse(fs.readFileSync(path.resolve(opt('--intent')),'utf8'));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};

try{
  if(cmd==='serve'){
    const {url}=await startStudioServer({port:Number(opt('--port')??17608),host:opt('--host')??'127.0.0.1'});console.log(`Reality Studio v1.5 Asset Forge Native Manufacturing: ${url}`);
  }else if(cmd==='new'){
    const p=sealProject(createProject({title:opt('--title')??'RNCS原生项目'}));const out=path.resolve(opt('--out')??'reality-studio-v08-project.json');write(out,p);console.log(out);
  }else if(cmd==='validate'){
    const r=validateProject(loadProject());console.log(JSON.stringify(r,null,2));if(!r.valid)process.exitCode=1;
  }else if(cmd==='migrate'){
    const p=migrateProject(loadProject()),out=path.resolve(opt('--out')??'migrated.reality-project.json');write(out,p);console.log(out);
  }else if(cmd==='compile'){
    const p=sealProject(loadProject()),out=path.resolve(opt('--out')??'output/compiled'),c=compileAll(p);fs.mkdirSync(out,{recursive:true});for(const [k,v] of Object.entries({compilation:c,'artifact.laf':c.laf,'providers':c.providers,'cnp-request':c.cnp_request,'policy-bundle':c.policy_bundle,'pipeline-input':c.pipeline_input}))write(path.join(out,`${k}.json`),v);console.log(JSON.stringify({out,compilation_root:c.compilation_root},null,2));
  }else if(cmd==='branch-evaluate'||cmd==='branch-adopt'||cmd==='branch-commit'){
    const p=sealProject(loadProject()),r=await new StudioRuntime({}).init(),v=cmd==='branch-evaluate'?await r.evaluateBranches(p):cmd==='branch-adopt'?await r.adoptBranch(p,{branchId:opt('--branch')}):await r.commitBranch(p,{branchId:opt('--branch'),resetStore:args.includes('--reset-store')});console.log(JSON.stringify(v,null,2));
  }else if(cmd==='health'){
    const r=await new StudioRuntime({}).init();console.log(JSON.stringify(await r.health(),null,2));
  }else if(cmd==='preview'||cmd==='commit'){
    const p=sealProject(loadProject()),r=await new StudioRuntime({}).init(),v=cmd==='preview'?await r.preview(p):await r.commit(p,{resetStore:args.includes('--reset-store')});console.log(JSON.stringify(v,null,2));
  }else if(cmd==='behavior-validate'){
    const p=normalizeProgram(loadProgram()),v=validateProgram(p);console.log(JSON.stringify(v,null,2));if(!v.valid)process.exitCode=1;
  }else if(cmd==='behavior-compile'){
    const c=compileBehaviorStudio(loadProgram()),out=path.resolve(opt('--out')??'output/behavior-compilation.json');write(out,c);console.log(JSON.stringify({out,compilation_root:c.compilation_root},null,2));
  }else if(cmd==='behavior-demo'){
    const session=new BehaviorEditorSession(loadProgram()),ticks=Number(opt('--ticks')??240);
    for(let i=0;i<ticks;i++){
      const p=session.runtime.state.entities.player?.variables??{},e=session.runtime.state.entities.enemy?.variables??{},input={};
      if(!p.has_key)input.move_right=true;else if((e.health??0)>0){const dx=e.x-p.x;if(Math.abs(dx)>50)input[dx>0?'move_right':'move_left']=true;else if((p.attack_cooldown??0)<=0)input.attack=true;}else input.move_right=true;
      session.step(input);session.runtime.paused=false;if(session.runtime.state.globals.victory)break;
    }
    const out=path.resolve(opt('--out')??'output/behavior-demo');fs.mkdirSync(out,{recursive:true});write(path.join(out,'session.json'),session.inspect());const artifacts=session.exportArtifacts();for(const[k,v]of Object.entries(artifacts))write(path.join(out,`${k}.json`),v);console.log(JSON.stringify({out,tick:session.runtime.state.tick,victory:session.runtime.state.globals.victory,state_root:session.runtime.stateRoot()},null,2));
  }else if(cmd==='asset-forge-demo'){
    const out=path.resolve(opt('--out')??'output/asset-forge-demo'),manufacturing=new UnifiedManufacturingSession(loadUnified()),forge=new AssetForgeSession(manufacturing,loadIntent(),{outDir:path.join(out,'production')});
    forge.generate();
    const variant=opt('--variant');if(variant){const candidate=forge.production.current().workspace.candidates.find(item=>item.variant===variant);if(!candidate)throw Object.assign(new Error(`variant not found: ${variant}`),{code:'ASSET_FORGE_VARIANT_NOT_FOUND'});forge.select(candidate.candidate_id,{reason:'cli-variant-selection'});}
    const palette=opt('--palette');if(palette)forge.regenerate({constraints:{palette:palette.split(',').map(value=>value.trim()).filter(Boolean)}},{label:'cli-palette-regeneration'});
    const preview=forge.preview(),accepted=forge.acceptIntoProject({x:Number(opt('--x')??160),y:Number(opt('--y')??160),z:Number(opt('--z')??0)}),artifacts=forge.exportArtifacts();
    fs.mkdirSync(out,{recursive:true});write(path.join(out,'forge-session.json'),accepted);write(path.join(out,'forge-preview.json'),{...preview,runtime_payload:undefined});write(path.join(out,'forge-manifest.json'),artifacts.manifest);write(path.join(out,'forge-acceptance.json'),artifacts.acceptance);write(path.join(out,'production-manifest.json'),artifacts.production.production_manifest);write(path.join(out,'project.unified-project.json'),manufacturing.project);write(path.join(out,'spatial-workspace.json'),manufacturing.spatial.exportArtifacts());
    console.log(JSON.stringify({out,forge_id:forge.forge_id,status:accepted.status,asset_id:artifacts.acceptance.asset_id,node_id:artifacts.acceptance.node_id,spatial_body_id:artifacts.acceptance.spatial_body_id,spatial_character_id:artifacts.acceptance.spatial_character_id,preview_root:artifacts.preview.preview_root,manifest_root:artifacts.manifest.manifest_root,project_root:manufacturing.project.project_root},null,2));
  }else if(cmd==='asset-import'){
    const input=ensureUIInputProject(loadUnified()),source=opt('--source');if(!source)throw Object.assign(new Error('--source required'),{code:'ASSET_SOURCE_REQUIRED'});const batch=importAssetSource(source,{sourceRoot:opt('--source-root'),existingRecords:input.assets.registry,recursive:!args.includes('--no-recursive')});for(const rec of batch.records){input.assets.registry[rec.asset_id]=rec;if(!input.assets.order.includes(rec.asset_id))input.assets.order.push(rec.asset_id)}if(!input.assets.import_roots.includes(batch.source_root))input.assets.import_roots.push(batch.source_root);const project=sealUnifiedProject(input,{touch:true}),out=path.resolve(opt('--out')??'output/project-with-assets.unified-project.json');write(out,project);console.log(JSON.stringify({out,source_root:batch.source_root,imported:batch.records.length,asset_ids:batch.records.map(r=>r.asset_id),receipt_root:batch.receipt.receipt_root,project_root:project.project_root},null,2));
  }else if(cmd==='asset-reimport'){
    const input=ensureUIInputProject(loadUnified()),target=opt('--asset'),all=args.includes('--all');if(!target&&!all)throw Object.assign(new Error('--asset or --all required'),{code:'ASSET_REIMPORT_TARGET_REQUIRED'});const ids=all?input.assets.order:[target],receipts=[];for(const id of ids){const rec=input.assets.registry[id];if(!rec)throw Object.assign(new Error(id),{code:'ASSET_NOT_FOUND'});if(rec.source?.kind!=='local-file'){receipts.push({asset_id:id,status:'skipped',reason:'not-local-file'});continue}const r=reimportLocalAsset(rec,{strict:!args.includes('--allow-missing')});input.assets.registry[id]=r.record;receipts.push(r.receipt)}const project=sealUnifiedProject(input,{touch:true}),out=path.resolve(opt('--out')??'output/project-reimported.unified-project.json');write(out,project);console.log(JSON.stringify({out,checked:receipts.length,changed:receipts.filter(r=>r.status==='changed').length,receipts,project_root:project.project_root},null,2));
  }else if(cmd==='asset-audit'){
    const project=ensureUIInputProject(loadUnified()),audit=auditAssetContinuity(project,{strictFiles:args.includes('--strict-files')});console.log(JSON.stringify(audit,null,2));if(!audit.valid)process.exitCode=1;
  }else if(cmd==='asset-ledger'){
    const project=ensureUIInputProject(loadUnified()),ledger=createAssetContinuityLedger(project,{strictFiles:args.includes('--strict-files')}),out=path.resolve(opt('--out')??'output/asset-continuity-ledger.json');write(out,ledger);console.log(JSON.stringify({out,ledger_root:ledger.ledger_root,summary:ledger.audit.summary},null,2));
  }else if(cmd==='unified-validate'){
    const v=validateUnifiedProject(loadUnified());console.log(JSON.stringify(v,null,2));if(!v.valid)process.exitCode=1;
  }else if(cmd==='gpu-frame'){
    const session=new UnifiedManufacturingSession(loadUnified()),quality=opt('--quality')??'quality',result=session.compileGPUFrame({quality,observer:opt('--observer')??'player',serialized:true}),out=path.resolve(opt('--out')??'output/gpu-frame.json');write(out,result);console.log(JSON.stringify({out,quality,frame_plan_root:result.summary.frame_plan_root,stats:result.summary.stats,compile_ms:result.compile_ms},null,2));
  }else if(cmd==='ui-layout'){
    const session=new UnifiedManufacturingSession(loadUnified()),width=Number(opt('--width')??640),height=Number(opt('--height')??360),touch=args.includes('--touch'),layout=session.compileUILayout({width,height,touch}),out=path.resolve(opt('--out')??'output/ui-layout.json');write(out,layout);console.log(JSON.stringify({out,width,height,touch,nodes:layout.nodes.length,focusable:layout.focus_order.length,layout_root:layout.layout_root},null,2));
  }else if(cmd==='navigation-path'){
    const session=new UnifiedManufacturingSession(loadUnified()),scene=session.project.scenes.find(s=>s.scene_id===session.project.active_scene_id),nav=compileSceneNavigation(scene,{positions:session.navigation.positions,excludeNodeIds:Object.keys(session.navigation.positions)}),tilemap=nav.tilemap;
    const start={x:Number(opt('--start-x')??70),y:Number(opt('--start-y')??270)},end={x:Number(opt('--end-x')??570),y:Number(opt('--end-y')??230)};
    let result=findPath(nav.grid,worldToCell(tilemap,start.x,start.y),worldToCell(tilemap,end.x,end.y),{});result=smoothPath(nav.grid,result);const out=path.resolve(opt('--out')??'output/navigation-path.json');write(out,{path:result,world_points:pathWorldPoints(tilemap,result),navigation_root:nav.grid.navigation_root});console.log(JSON.stringify({out,status:result.status,cells:result.cells.length,cost:result.cost,path_root:result.path_root},null,2));
  }else if(cmd==='spatial-validate'){
    const session=new UnifiedManufacturingSession(loadUnified()),v=session.inspect().spatial.validation;console.log(JSON.stringify(v,null,2));if(!v.valid)process.exitCode=1;
  }else if(cmd==='spatial-demo'){
    const session=new UnifiedManufacturingSession(loadUnified()),ticks=Number(opt('--ticks')??180),character=opt('--character')??'subject:player';
    for(let i=0;i<ticks;i++){const commands=[];if(i<90)commands.push({type:'move-character',characterId:character,direction:{x:1000000,y:0,z:250000},speedQ:1000000});if(i===45)commands.push({type:'jump-character',characterId:character});session.spatialStep({commands});}
    const out=path.resolve(opt('--out')??'output/spatial-demo');fs.mkdirSync(out,{recursive:true});const artifacts=session.spatial.exportArtifacts();for(const[k,v]of Object.entries(artifacts))write(path.join(out,`${k}.json`),v);const projection=session.spatialProjection({width:Number(opt('--width')??480),height:Number(opt('--height')??270),qualityTier:opt('--quality')??'balanced'});fs.writeFileSync(path.join(out,'spatial-reference.png'),Buffer.from(projection.png_base64,'base64'));write(path.join(out,'spatial-projection.json'),{...projection,png_base64:undefined});console.log(JSON.stringify({out,tick:artifacts.spatial_snapshot.tick,state_root:artifacts.spatial_snapshot.stateRoot,frame_root:artifacts.spatial_frame_plan.frameRoot,pixel_root:projection.pixel_root},null,2));
  }else if(cmd==='spatial-frame'){
    const session=new UnifiedManufacturingSession(loadUnified()),projection=session.spatialProjection({width:Number(opt('--width')??480),height:Number(opt('--height')??270),qualityTier:opt('--quality')??'balanced'}),out=path.resolve(opt('--out')??'output/spatial-frame.png');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,Buffer.from(projection.png_base64,'base64'));write(out+'.json',{...projection,png_base64:undefined});console.log(JSON.stringify({out,pixel_root:projection.pixel_root,projection_root:projection.projection_root,frame_root:projection.frame_plan.frameRoot},null,2));
  }else if(cmd==='unified-demo'){
    const session=new UnifiedManufacturingSession(loadUnified()),ticks=Number(opt('--ticks')??240);
    for(let i=0;i<ticks;i++){
      const r=session.behavior.runtime.state,p=r.entities.player?.variables??{},e=r.entities.enemy?.variables??{},input={};
      if(!p.has_key)input.move_right=true;else if((e.health??0)>0){const dx=e.x-p.x;if(Math.abs(dx)>50)input[dx>0?'move_right':'move_left']=true;else if((p.attack_cooldown??0)<=0)input.attack=true;}else input.move_right=true;
      session.step(input);session.behavior.runtime.paused=false;if(r.globals.victory)break;
    }
    const out=path.resolve(opt('--out')??'output/unified-demo');fs.mkdirSync(out,{recursive:true});const artifacts=session.exportArtifacts();for(const[k,v]of Object.entries(artifacts))write(path.join(out,`${k}.json`),v);write(path.join(out,'session.json'),session.inspect());console.log(JSON.stringify({out,tick:session.behavior.runtime.state.tick,victory:session.behavior.runtime.state.globals.victory,project_root:session.project.project_root,projection_root:artifacts.scene_player.projection_root},null,2));
  }else if(cmd==='runtime-timeline-demo'){
    const session=new UnifiedManufacturingSession(loadUnified()),ticks=Math.max(1,Number(opt('--ticks')??24));
    for(let i=0;i<ticks;i++)session.step({move_right:i%2===0,move_left:i%2===1});
    const midpoint=Math.floor(ticks/2);session.seekRuntime({tick:midpoint});session.step({attack:true});
    const checkpoint=session.createRuntimeCheckpoint('cli-demo'),artifacts=session.exportArtifacts(),out=path.resolve(opt('--out')??'output/runtime-timeline-demo');fs.mkdirSync(out,{recursive:true});
    for(const[k,v]of Object.entries(artifacts))write(path.join(out,k+'.json'),v);write(path.join(out,'session.json'),session.inspect());
    console.log(JSON.stringify({out,tick:session.behavior.runtime.state.tick,timeline_entries:artifacts.runtime_timeline.entries.length,timeline_cursor:artifacts.runtime_timeline.cursor,replay_root:artifacts.runtime_replay.replay_root,deterministic:artifacts.runtime_replay.deterministic,checkpoint_id:checkpoint.runtime_checkpoint.checkpoint_id},null,2));
  }else{
     console.error('Usage: reality-studio-native serve|new|validate|migrate|compile|branch-evaluate|branch-adopt|branch-commit|health|preview|commit|behavior-validate|behavior-compile|behavior-demo|asset-forge-demo|asset-import|asset-reimport|asset-audit|asset-ledger|unified-validate|gpu-frame|ui-layout|navigation-path|spatial-validate|spatial-demo|spatial-frame|unified-demo|runtime-timeline-demo');process.exitCode=2;
  }
}catch(e){console.error(JSON.stringify({error:{code:e.code??'ERROR',message:e.message,details:e.details??{}}},null,2));process.exitCode=1;}
