import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {clone,now,rootHash,seal,StudioError} from './canonical.mjs';
import {BehaviorEditorSession} from './behavior-studio.mjs';
import {normalizeProgram,validateProgram,rootHash as behaviorRootHash} from '@taowind/reality-behavior-fabric';
import {compileStudioGPUFrame,serializeStudioGPUFrame,summarizeStudioGPUFrame,createGPUViewportManifest,GPU_STUDIO_VERSION} from './gpu-studio.mjs';
import {TILEMAP_VERSION,generateFrostTrialTileMap,validateTileMap,setTile,paintTiles,paintRect,floodFill,compileTileMapProjection,compileSceneNavigation,findPath,smoothPath,pathWorldPoints,worldToCell,navigationReceipt} from './tilemap-navigation.mjs';
import {UI_INPUT_VERSION,createDefaultUITree,createDefaultInputProfile,validateUITree,validateInputProfile,layoutUITree,routePointerEvent,moveUIFocus,InputActionRuntime,compileUIInputManifest} from './ui-input.mjs';
import {ASSET_CONTINUITY_VERSION,createLocalAssetRecord,createEmbeddedAssetRecord,reimportLocalAsset,importAssetSource,auditAssetContinuity,buildAssetDependencyGraph,createAssetContinuityLedger} from './asset-continuity.mjs';
import {SPATIAL_STUDIO_VERSION,createDefaultSpatialWorkspace,ensureSpatialWorkspace,sealSpatialWorkspace,validateSpatialWorkspace,SpatialStudioSession} from './spatial-studio.mjs';
import {createNetworkAuthoring,validateNetworkAuthoring,compileNetworkWorld} from './network-world-compiler.mjs';

export const UNIFIED_FORMAT='reality-studio.unified-project.v0.9';
export const UNIFIED_VERSION='0.9.0-alpha.1';
export const STUDIO_VERSION='1.5.0-alpha.1';
export const RUNTIME_TIMELINE_FORMAT='reality-studio.runtime-timeline.v1.0';
export const RUNTIME_TIMELINE_VERSION='1.0.0-alpha.1';
const sha256File=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const safeId=s=>String(s??'').replace(/[^a-zA-Z0-9:_-]/g,'-');
const deep=v=>structuredClone(v);
const sealMixed=(value,field)=>{const out=deep(value);delete out[field];out[field]=behaviorRootHash(out);return out;};
function createRuntimeTimeline({projectRoot,programRoot,initialStateRoot,initialTick=0}={}){
  return{format:RUNTIME_TIMELINE_FORMAT,version:RUNTIME_TIMELINE_VERSION,project_root:projectRoot,program_root:programRoot,initial:{tick:initialTick,state_root:initialStateRoot},entries:[],checkpoints:[],cursor:0};
}

export function createAssetRecord(bundle,{sourceRoot=null,importProposal=null,previewUrl=null}={}){
  const acceptedFormats=new Set(['reality-asset.continuity-bundle.v0.1','reality-asset.continuity-bundle.v0.2','reality-asset.continuity-bundle.v0.3']);
  if(!acceptedFormats.has(bundle?.format))throw new StudioError('ASSET_BUNDLE_FORMAT_INVALID',bundle?.format??'missing');
  const identity=bundle.asset_identity??{};
  if(!identity.asset_id)throw new StudioError('ASSET_ID_REQUIRED');
  const files=(bundle.files??[]).map(f=>({...deep(f),absolute_path:sourceRoot?path.resolve(sourceRoot,f.path):null}));
  return seal({
    format:'reality-studio.asset-record.v1.5',
    asset_id:identity.asset_id,
    name:identity.name??identity.asset_id,
    kind:identity.kind??'unknown',
    continuity_policy:identity.continuity_policy??'stable-identity',
    bundle_root:bundle.bundle_root,
    source:deep(bundle.source??{}),
    variants:deep(bundle.variants??{}),
    files,
    dependencies:deep(bundle.dependencies??[]),
    extensions:{...deep(bundle.extensions??{}),asset_forge:{bundle_format:bundle.format,source_root:sourceRoot?path.resolve(sourceRoot):null}},
    import_proposal:importProposal?deep(importProposal):null,
    preview_url:previewUrl,
    imported_at:now(),
    status:'ready'
  },'asset_root');
}

export function verifyAssetRecord(record,{strictFiles=false}={}){
  const errors=[],warnings=[];
  if(!record?.asset_id)errors.push({code:'ASSET_ID_REQUIRED'});
  if(!record?.bundle_root)errors.push({code:'BUNDLE_ROOT_REQUIRED'});
  for(const f of record?.files??[]){
    if(!f.path||!f.role)errors.push({code:'ASSET_FILE_INVALID',file:f});
    if(f.absolute_path){
      if(!fs.existsSync(f.absolute_path)){(strictFiles?errors:warnings).push({code:'ASSET_FILE_MISSING',path:f.absolute_path});continue;}
      const actual=sha256File(f.absolute_path);
      if(f.sha256&&actual!==f.sha256)errors.push({code:'ASSET_FILE_HASH_MISMATCH',path:f.absolute_path,expected:f.sha256,actual});
    }
  }
  return{valid:errors.length===0,errors,warnings};
}

export function createSceneNode({nodeId=null,name='节点',assetId=null,parentId=null,x=0,y=0,zIndex=0,entityId=null,components={},createdAt=null}={}){
  return{
    node_id:nodeId??`node:${randomUUID()}`,
    name,
    parent_id:parentId,
    transform:{x:Math.round(x),y:Math.round(y),rotation_mdeg:0,scale_x_milli:1000,scale_y_milli:1000},
    z_index:zIndex,
    visible:true,
    asset_id:assetId,
    behavior_binding:entityId?{entity_id:entityId,mode:'bidirectional'}:null,
    components:deep(components),
    metadata:{created_at:createdAt??now()}
  };
}

export function createSceneFromBehavior(program,{sceneId='scene:main',title='主场景',createdAt=null}={}){
  const p=program?.program_root?program:normalizeProgram(program);
  const nodes=(p.entities??[]).map((e,i)=>createSceneNode({
    nodeId:`node:${e.entity_id}`,
    name:e.entity_id,
    assetId:e.components?.asset_id??null,
    x:e.variables?.x??80+i*90,
    y:e.variables?.y??240,
    zIndex:i,
    entityId:e.entity_id,
    components:{collider:deep(e.components?.collider??null),tags:deep(e.tags??[])},
    createdAt
  }));
  return seal({format:'reality-studio.scene.v0.9',scene_id:sceneId,title,canvas:{width:640,height:360,background:'#071426',grid_size:16},tilemaps:[generateFrostTrialTileMap()],nodes,metadata:{behavior_program_id:p.identity.program_id,created_at:createdAt??now()}},'scene_root');
}

export function createUnifiedProject({title='冰境试炼统一制造项目',program,assets=[],projectId=null,createdAt=null}={}){
  const p=program?.program_root?program:normalizeProgram(program);
  const timestamp=createdAt??now(),scene=createSceneFromBehavior(p,{createdAt:timestamp});
  const registry=Object.fromEntries(assets.map(a=>[a.asset_id,deep(a)]));
  return sealMixed({
    format:UNIFIED_FORMAT,
    version:UNIFIED_VERSION,
    identity:{project_id:projectId??`unified-project:${randomUUID()}`,title,created_at:timestamp,updated_at:timestamp},
    active_scene_id:scene.scene_id,
    scenes:[scene],
    assets:{format:'reality-studio.asset-catalog.v1.3',version:ASSET_CONTINUITY_VERSION,registry,order:Object.keys(registry),import_roots:[],last_audit_root:null},
    behavior:{active_program_id:p.identity.program_id,programs:{[p.identity.program_id]:p}},
    ui:{active_ui_id:'ui:main',trees:{'ui:main':createDefaultUITree({width:scene.canvas.width,height:scene.canvas.height})}},
    input:{active_profile_id:'input:default',profiles:{'input:default':createDefaultInputProfile()}},
    spatial3d:createDefaultSpatialWorkspace({worldId:'world:studio-embodied'}),
    editor:{selected_node_id:scene.nodes[0]?.node_id??null,selected_ui_node_id:'ui:health',selected_spatial_body_id:'avatar',selected_spatial_joint_id:null,spatial_view_mode:'solid',active_tool:'select',snap_to_grid:true,grid_size:16,active_tilemap_id:scene.tilemaps?.[0]?.tilemap_id??null,active_tile_layer_id:'layer:terrain',selected_tile_id:2,tile_overlay:'navigation',ui_preview_device:'desktop',viewport:{zoom_milli:1000,pan_x:0,pan_y:0}},
    build:{targets:['web'],entry_scene_id:scene.scene_id,quality_profile:'balanced'},
    evidence:{events:[],project_root:''}
  },'project_root');
}

export function validateUnifiedProject(project){
  const errors=[],warnings=[];
  const need=(c,code,path)=>{if(!c)errors.push({code,path});};
  need(project?.format===UNIFIED_FORMAT,'FORMAT_INVALID','format');
  need(project?.version===UNIFIED_VERSION,'VERSION_INVALID','version');
  need(Array.isArray(project?.scenes),'SCENES_REQUIRED','scenes');
  const sceneIds=new Set(),nodeIds=new Set();
  for(const scene of project?.scenes??[]){
    if(sceneIds.has(scene.scene_id))errors.push({code:'SCENE_ID_DUPLICATE',path:scene.scene_id});sceneIds.add(scene.scene_id);
    for(const node of scene.nodes??[]){
      if(nodeIds.has(node.node_id))errors.push({code:'NODE_ID_DUPLICATE',path:node.node_id});nodeIds.add(node.node_id);
      if(node.asset_id&&!project.assets?.registry?.[node.asset_id])warnings.push({code:'NODE_ASSET_UNRESOLVED',path:node.node_id,asset_id:node.asset_id});
      if(node.parent_id&&!scene.nodes.some(n=>n.node_id===node.parent_id))errors.push({code:'NODE_PARENT_MISSING',path:node.node_id});
    }
    const tilemapIds=new Set();
    for(const tilemap of scene.tilemaps??[]){
      if(tilemapIds.has(tilemap.tilemap_id))errors.push({code:'TILEMAP_ID_DUPLICATE',path:tilemap.tilemap_id});tilemapIds.add(tilemap.tilemap_id);
      const tv=validateTileMap(tilemap);if(!tv.valid)errors.push({code:'TILEMAP_INVALID',path:tilemap.tilemap_id,details:tv});warnings.push(...tv.warnings.map(w=>({...w,tilemap_id:tilemap.tilemap_id})));
    }
  }
  need(sceneIds.has(project?.active_scene_id),'ACTIVE_SCENE_MISSING','active_scene_id');
  for(const p of Object.values(project?.behavior?.programs??{})){const v=validateProgram(p);if(!v.valid)errors.push({code:'BEHAVIOR_INVALID',details:v});}
  for(const [id,tree] of Object.entries(project?.ui?.trees??{})){const v=validateUITree(tree);if(!v.valid)errors.push({code:'UI_TREE_INVALID',path:id,details:v});warnings.push(...v.warnings.map(w=>({...w,ui_id:id})));}
  for(const [id,profile] of Object.entries(project?.input?.profiles??{})){const v=validateInputProfile(profile);if(!v.valid)errors.push({code:'INPUT_PROFILE_INVALID',path:id,details:v});warnings.push(...v.warnings.map(w=>({...w,profile_id:id})));}
  if(project?.ui&&!project.ui.trees?.[project.ui.active_ui_id])errors.push({code:'ACTIVE_UI_MISSING',path:'ui.active_ui_id'});
  if(project?.input&&!project.input.profiles?.[project.input.active_profile_id])errors.push({code:'ACTIVE_INPUT_PROFILE_MISSING',path:'input.active_profile_id'});
  const assetAudit=auditAssetContinuity(project,{strictFiles:false});warnings.push(...assetAudit.warnings);errors.push(...assetAudit.errors);
  const spatialValidation=validateSpatialWorkspace(project?.spatial3d);warnings.push(...spatialValidation.warnings);errors.push(...spatialValidation.errors);
  const networkValidation=validateNetworkAuthoring(project);warnings.push(...networkValidation.warnings);errors.push(...networkValidation.errors);
  return{valid:errors.length===0,errors,warnings,asset_audit_root:assetAudit.audit_root,spatial_workspace_root:project?.spatial3d?.workspace_root??null,spatial:spatialValidation,network:networkValidation};
}

function sealScene(scene){const out={...deep(scene)};out.tilemaps=(out.tilemaps??[]).map(t=>{const x=deep(t);delete x.tilemap_root;return seal(x,'tilemap_root')});return seal(out,'scene_root');}
export function sealUnifiedProject(project,{touch=false,timestamp=null}={}){const out=deep(project);if(touch)out.identity.updated_at=timestamp??now();out.scenes=out.scenes.map(sealScene);if(out.spatial3d)out.spatial3d=sealSpatialWorkspace(out.spatial3d);return sealMixed(out,'project_root');}
function sealProject(project,clock=now){return sealUnifiedProject(project,{touch:true,timestamp:clock()});}
export function ensureUIInputProject(project){
  const out=deep(project);const scene=out.scenes?.find(s=>s.scene_id===out.active_scene_id)??out.scenes?.[0];
  out.assets??={registry:{},order:[]};out.assets.format??='reality-studio.asset-catalog.v1.3';out.assets.version??=ASSET_CONTINUITY_VERSION;out.assets.import_roots??=[];out.assets.last_audit_root??=null;
  if(!out.ui)out.ui={active_ui_id:'ui:main',trees:{'ui:main':createDefaultUITree({width:scene?.canvas?.width??640,height:scene?.canvas?.height??360})}};
  if(!out.input)out.input={active_profile_id:'input:default',profiles:{'input:default':createDefaultInputProfile()}};
  out.editor??={};if(!out.editor.selected_ui_node_id)out.editor.selected_ui_node_id='ui:health';if(!out.editor.ui_preview_device)out.editor.ui_preview_device='desktop';
  const spatial=ensureSpatialWorkspace(out);
  return sealUnifiedProject(spatial,{touch:false});
}

function activeScene(project){return project.scenes.find(s=>s.scene_id===project.active_scene_id);}
function findNode(project,nodeId){for(const scene of project.scenes){const node=scene.nodes.find(n=>n.node_id===nodeId);if(node)return{scene,node};}return null;}

function syncProgramFromScene(project,program){
  const raw=deep(program);delete raw.program_root;
  const scene=activeScene(project);
  const byEntity=new Map((raw.entities??[]).map(e=>[e.entity_id,e]));
  for(const node of scene.nodes??[]){
    const entityId=node.behavior_binding?.entity_id;
    if(!entityId)continue;
    let entity=byEntity.get(entityId);
    if(!entity){entity={entity_id:entityId,tags:['scene-node'],variables:{},components:{}};raw.entities.push(entity);byEntity.set(entityId,entity);}
    entity.variables??={};entity.components??={};
    entity.variables.x=node.transform.x;entity.variables.y=node.transform.y;
    if(node.asset_id)entity.components.asset_id=node.asset_id;
    if(node.components?.collider)entity.components.collider=deep(node.components.collider);
  }
  return normalizeProgram(raw);
}

export function createSceneProjection(project,behaviorInspection,{observer='player',navigationPositions={}}={}){
  const scene=activeScene(project),state=behaviorInspection?.runtime??{};
  const nodes=(scene.nodes??[]).filter(n=>n.visible!==false).map(n=>{
    const entityId=n.behavior_binding?.entity_id;
    const runtimeEntity=entityId?state.entities?.[entityId]?.variables:null,nav=navigationPositions[n.node_id];
    return{
      node_id:n.node_id,name:n.name,asset_id:n.asset_id,z_index:n.z_index,
      transform:{...deep(n.transform),x:nav?.x??runtimeEntity?.x??n.transform.x,y:nav?.y??runtimeEntity?.y??n.transform.y},
      visible:n.visible!==false,
      runtime:{health:runtimeEntity?.health,open:runtimeEntity?.open,collected:runtimeEntity?.collected,has_key:runtimeEntity?.has_key,navigation:nav?deep(nav):undefined},
      debug:observer==='debugger'?{entity_id:entityId,components:deep(n.components),binding:n.behavior_binding}:undefined
    };
  }).sort((a,b)=>a.z_index-b.z_index||a.node_id.localeCompare(b.node_id));
  const tilemaps=(scene.tilemaps??[]).map(t=>compileTileMapProjection(t,{includeKinds:['visual']}));
  return sealMixed({format:'reality-studio.scene-projection.v1.1',observer,scene_id:scene.scene_id,canvas:deep(scene.canvas),tick:state.tick??0,tilemaps,nodes,globals:deep(state.globals??{}),project_root:project.project_root,behavior_state_root:state.state_root??null},'projection_root');
}

export class UnifiedManufacturingSession{
  constructor(project,{sessionId=null,clock=now}={}){
    project=ensureUIInputProject(project);
    const validation=validateUnifiedProject(project);if(!validation.valid)throw new StudioError('UNIFIED_PROJECT_INVALID','',validation);
    this.session_id=sessionId??`unified-session:${randomUUID()}`;this.clock=typeof clock==='function'?clock:now;
    this.project=sealUnifiedProject(project,{touch:false});
    const program=this.project.behavior.programs[this.project.behavior.active_program_id];
    this.behavior=new BehaviorEditorSession(program);
    this.history=[deep(this.project)];this.history_index=0;
    this.status='editing';this.events=[];
    this.timelineInitialSnapshot=this.behavior.runtime.snapshot();
    this.runtimeTimeline=createRuntimeTimeline({projectRoot:this.project.project_root,programRoot:this.behavior.program.program_root,initialStateRoot:this.behavior.runtime.stateRoot(),initialTick:this.behavior.runtime.state.tick});
    this.runtimeCheckpoints=new Map();
    this.gpu={enabled:true,quality:this.project.build?.quality_profile??'quality',observer:'player',gpu_tier:2,last_summary:null,last_compile_ms:0,frame_compiles:0};
    const scene=activeScene(this.project);this.navigation={version:TILEMAP_VERSION,active_tilemap_id:this.project.editor.active_tilemap_id??scene.tilemaps?.[0]?.tilemap_id??null,positions:{},targets:{},paths:{},queries:0,last_receipt:null};
    for(const n of scene.nodes??[])if(n.components?.navigation_agent){this.navigation.positions[n.node_id]={x:n.transform.x,y:n.transform.y,status:'idle',speed_milli:n.components.navigation_agent.speed_milli??2400};const t=n.components.navigation_agent.target;if(t)this.navigation.targets[n.node_id]={x:Math.round(t.x),y:Math.round(t.y),allow_diagonal:Boolean(n.components.navigation_agent.allow_diagonal)}}
    const profile=this.project.input?.profiles?.[this.project.input.active_profile_id]??createDefaultInputProfile();this.inputRuntime=new InputActionRuntime(profile);this.uiState={focus_id:this.project.editor.selected_ui_node_id??null,last_event:null,last_layout:null,device:{touch:false,kind:'desktop',safe_area:{left:0,top:0,right:0,bottom:0}},events:[]};
    this.spatial=new SpatialStudioSession(this.project.spatial3d);
  }
  record(type,data={}){this.events.push({sequence:this.events.length+1,time:this.clock(),type,...deep(data)});if(this.events.length>500)this.events.shift();}
  timelineView(){return seal(this.runtimeTimeline,'timeline_root');}
  resetRuntimeTimeline(){this.timelineInitialSnapshot=this.behavior.runtime.snapshot();this.runtimeTimeline=createRuntimeTimeline({projectRoot:this.project.project_root,programRoot:this.behavior.program.program_root,initialStateRoot:this.behavior.runtime.stateRoot(),initialTick:this.behavior.runtime.state.tick});this.runtimeCheckpoints.clear();}
  recordRuntimeStep({input,beforeStateRoot,beforeTick,beforeProjectionRoot}={}){
    const runtime=this.behavior.inspect().runtime,projection=createSceneProjection(this.project,this.behavior.inspect(),{observer:'debugger',navigationPositions:this.navigation.positions});
    const entries=this.runtimeTimeline.entries.slice(0,this.runtimeTimeline.cursor);
    const entry={sequence:entries.length+1,tick:runtime.tick,input:deep(input??{}),before_tick:beforeTick,before_state_root:beforeStateRoot,after_state_root:runtime.state_root,after_projection_root:projection.projection_root,before_projection_root:beforeProjectionRoot??null,changed_paths:deep(this.behavior.last_result?.changed_paths??[]),events:runtime.events_processed};
    entries.push(entry);this.runtimeTimeline.entries=entries;this.runtimeTimeline.cursor=entries.length;
    return entry;
  }
  checkpoint({record=true}={}){if(this.spatial)this.project.spatial3d=deep(this.spatial.workspace);this.project=sealProject(this.project,this.clock);if(record){this.history=this.history.slice(0,this.history_index+1);this.history.push(deep(this.project));this.history_index=this.history.length-1;this.resetRuntimeTimeline();}return this.inspect();}
  importAsset(bundle,options={}){
    const rec=createAssetRecord(bundle,options);const v=verifyAssetRecord(rec,{strictFiles:options.strictFiles??false});if(!v.valid)throw new StudioError('ASSET_IMPORT_INVALID','',v);
    this.project.assets.registry[rec.asset_id]=rec;if(!this.project.assets.order.includes(rec.asset_id))this.project.assets.order.push(rec.asset_id);
    this.record('asset.imported',{asset_id:rec.asset_id,asset_root:rec.asset_root});return this.checkpoint();
  }
  importLocalAsset(filePath,options={}){
    const existing=Object.values(this.project.assets.registry).find(r=>r?.source?.kind==='local-file'&&path.resolve(r.source.absolute_path??'')===path.resolve(filePath));
    const rec=createLocalAssetRecord(filePath,{...options,previousRecord:options.previousRecord??existing??null});this.project.assets.registry[rec.asset_id]=rec;if(!this.project.assets.order.includes(rec.asset_id))this.project.assets.order.push(rec.asset_id);
    const root=rec.source?.source_root;if(root&&!this.project.assets.import_roots.includes(root))this.project.assets.import_roots.push(root);this.record(existing?'asset.reimported':'asset.local-imported',{asset_id:rec.asset_id,asset_root:rec.asset_root,source_path:rec.source.absolute_path,generation:rec.import_state.generation});return this.checkpoint();
  }
  importEmbeddedAsset(file,options={}){
    const rec=createEmbeddedAssetRecord(file,options);this.project.assets.registry[rec.asset_id]=rec;if(!this.project.assets.order.includes(rec.asset_id))this.project.assets.order.push(rec.asset_id);this.record('asset.embedded-imported',{asset_id:rec.asset_id,asset_root:rec.asset_root,size:rec.source.size});return this.checkpoint();
  }
  importAssetSource(source,options={}){
    const batch=importAssetSource(source,{...options,existingRecords:this.project.assets.registry});for(const rec of batch.records){this.project.assets.registry[rec.asset_id]=rec;if(!this.project.assets.order.includes(rec.asset_id))this.project.assets.order.push(rec.asset_id)}if(!this.project.assets.import_roots.includes(batch.source_root))this.project.assets.import_roots.push(batch.source_root);this.record('asset.batch-imported',{source_root:batch.source_root,count:batch.records.length,receipt_root:batch.receipt.receipt_root});const inspection=this.checkpoint();return{...inspection,asset_import_receipt:batch.receipt};
  }
  reimportAsset(assetId,{strict=true}={}){
    const current=this.project.assets.registry[assetId];if(!current)throw new StudioError('ASSET_NOT_FOUND',assetId);const result=reimportLocalAsset(current,{strict});this.project.assets.registry[assetId]=result.record;this.record('asset.reimport-checked',{asset_id:assetId,status:result.receipt.status,changed:result.changed,receipt_root:result.receipt.receipt_root});const inspection=this.checkpoint();return{...inspection,asset_reimport_receipt:result.receipt};
  }
  reimportAllAssets({strict=false}={}){
    const receipts=[];let changed=0,missing=0;for(const id of this.project.assets.order){const rec=this.project.assets.registry[id];if(rec?.source?.kind!=='local-file')continue;try{const r=reimportLocalAsset(rec,{strict});this.project.assets.registry[id]=r.record;receipts.push(r.receipt);if(r.changed)changed++;if(r.receipt.status==='missing')missing++;}catch(e){receipts.push({asset_id:id,status:'error',code:e.code??'ERROR',message:e.message});if(strict)throw e}}this.record('asset.reimport-all',{checked:receipts.length,changed,missing});const inspection=this.checkpoint();return{...inspection,asset_reimport_summary:{checked:receipts.length,changed,missing,receipts}};
  }
  auditAssets({strictFiles=false}={}){const audit=auditAssetContinuity(this.project,{strictFiles});this.project.assets.last_audit_root=audit.audit_root;this.record('asset.audit',{audit_root:audit.audit_root,summary:audit.summary});return audit;}
  assetDependencyGraph(){return buildAssetDependencyGraph(this.project);}
  assetLedger({strictFiles=false}={}){return createAssetContinuityLedger(this.project,{strictFiles});}
  spatialSelectBody(bodyId){const result=this.spatial.selectBody(bodyId);this.project.spatial3d=deep(this.spatial.workspace);this.project.editor.selected_spatial_body_id=bodyId;this.project.editor.selected_spatial_joint_id=null;this.record('spatial.body-selected',{body_id:bodyId});return this.checkpoint({record:false});}
  spatialSelectJoint(jointId){this.spatial.selectJoint(jointId);this.project.spatial3d=deep(this.spatial.workspace);this.project.editor.selected_spatial_joint_id=jointId;this.project.editor.selected_spatial_body_id=null;this.record('spatial.joint-selected',{joint_id:jointId});return this.checkpoint({record:false});}
  spatialAddBody(options={}){const result=this.spatial.addBody(options);this.project.spatial3d=deep(this.spatial.workspace);this.project.editor.selected_spatial_body_id=result.selected_body?.id??this.spatial.workspace.editor.selected_body_id;this.record('spatial.body-added',{body_id:this.project.editor.selected_spatial_body_id});return this.checkpoint();}
  spatialPatchBody(bodyId,patch={}){this.spatial.patchBody(bodyId,patch);this.project.spatial3d=deep(this.spatial.workspace);this.record('spatial.body-patched',{body_id:bodyId});return this.checkpoint();}
  spatialPatchFixture(bodyId,fixtureId,patch={}){this.spatial.patchFixture(bodyId,fixtureId,patch);this.project.spatial3d=deep(this.spatial.workspace);this.record('spatial.fixture-patched',{body_id:bodyId,fixture_id:fixtureId});return this.checkpoint();}
  spatialRemoveBody(bodyId){this.spatial.removeBody(bodyId);this.project.spatial3d=deep(this.spatial.workspace);this.project.editor.selected_spatial_body_id=this.spatial.workspace.editor.selected_body_id;this.record('spatial.body-removed',{body_id:bodyId});return this.checkpoint();}
  spatialAddJoint(options={}){const result=this.spatial.addJoint(options);this.project.spatial3d=deep(this.spatial.workspace);this.project.editor.selected_spatial_joint_id=result.selected_joint?.id??this.spatial.workspace.editor.selected_joint_id;this.project.editor.selected_spatial_body_id=null;this.record('spatial.joint-added',{joint_id:this.project.editor.selected_spatial_joint_id});return this.checkpoint();}
  spatialPatchJoint(jointId,patch={}){this.spatial.patchJoint(jointId,patch);this.project.spatial3d=deep(this.spatial.workspace);this.record('spatial.joint-patched',{joint_id:jointId});return this.checkpoint();}
  spatialRemoveJoint(jointId){this.spatial.removeJoint(jointId);this.project.spatial3d=deep(this.spatial.workspace);this.project.editor.selected_spatial_joint_id=null;this.record('spatial.joint-removed',{joint_id:jointId});return this.checkpoint();}
  spatialUpsertCharacter(spec){this.spatial.upsertCharacter(spec);this.project.spatial3d=deep(this.spatial.workspace);this.record('spatial.character-upserted',{character_id:spec.id,body_id:spec.bodyId});return this.checkpoint();}
  networkConfigure(options={}){this.project.network=createNetworkAuthoring(this.project,options);this.record('network.authoring-configured',{world_id:this.project.network.world_id,player_slots:this.project.network.player_slots.length,authoring_root:this.project.network.authoring_root});return this.checkpoint();}
  networkCompile(options={}){return compileNetworkWorld(this.project,options);}
  spatialSetCamera(options={}){this.spatial.setCamera(options);this.project.spatial3d=deep(this.spatial.workspace);this.record('spatial.camera-changed');return this.checkpoint({record:false});}
  spatialCommand(command){const result=this.spatial.command(command);this.record('spatial.command',{type:command.type,tick:result.snapshot.tick});return this.inspect();}
  spatialStep(options={}){const result=this.spatial.step(options);this.record('spatial.step',{tick:result.snapshot.tick});return this.inspect();}
  spatialRun(options={}){const result=this.spatial.run(options);this.record('spatial.run',{tick:result.snapshot.tick,ticks:options.ticks??1});return this.inspect();}
  spatialReset(){this.spatial.reset();this.record('spatial.reset');return this.inspect();}
  spatialSnapshot(label='snapshot'){const entry=this.spatial.createSnapshot(label);this.record('spatial.snapshot-created',{snapshot_id:entry.snapshot_id});return{...this.inspect(),spatial_snapshot_receipt:entry};}
  spatialRestore(snapshotId){this.spatial.restoreSnapshot(snapshotId);this.record('spatial.snapshot-restored',{snapshot_id:snapshotId});return this.inspect();}
  spatialProjection(options={}){const result=this.spatial.renderReference(options);return{format:result.format,source_state_root:result.sourceStateRoot,source_reality_root:result.sourceRealityRoot,scene:result.scene,frame_plan:result.framePlan,frame_verified:result.frameVerified,pixel_root:result.pixelRoot,projection_root:result.projectionRoot,png_base64:Buffer.from(result.png).toString('base64')};}
  activeTileMap(){const scene=activeScene(this.project);return (scene.tilemaps??[]).find(t=>t.tilemap_id===this.navigation.active_tilemap_id)??scene.tilemaps?.[0]??null;}
  editTile({operation='paint',layerId=null,x=0,y=0,tileId=null,cells=[],rect=null}={}){
    const scene=activeScene(this.project),i=(scene.tilemaps??[]).findIndex(t=>t.tilemap_id===this.navigation.active_tilemap_id);if(i<0)throw new StudioError('TILEMAP_NOT_FOUND',this.navigation.active_tilemap_id);
    let t=scene.tilemaps[i],lid=layerId??this.project.editor.active_tile_layer_id??'layer:terrain',tid=tileId??this.project.editor.selected_tile_id??2;
    if(operation==='paint')t=setTile(t,{layerId:lid,x:Math.round(x),y:Math.round(y),tileId:tid});
    else if(operation==='erase')t=setTile(t,{layerId:lid,x:Math.round(x),y:Math.round(y),tileId:0});
    else if(operation==='cells')t=paintTiles(t,{layerId:lid,cells,tileId:tid});
    else if(operation==='rect')t=paintRect(t,{layerId:lid,...rect,tileId:tid});
    else if(operation==='fill')t=floodFill(t,{layerId:lid,x:Math.round(x),y:Math.round(y),tileId:tid});
    else throw new StudioError('TILEMAP_OPERATION_UNKNOWN',operation);
    scene.tilemaps[i]=t;this.navigation.paths={};for(const target of Object.values(this.navigation.targets))target.path_id=null;this.record('tilemap.edited',{tilemap_id:t.tilemap_id,operation:operation,layer_id:lid,tile_id:operation==='erase'?0:tid,x,y});return this.checkpoint();
  }
  setTileTool({layerId,tileId,overlay,tool}={}){if(layerId!==undefined)this.project.editor.active_tile_layer_id=layerId;if(tileId!==undefined)this.project.editor.selected_tile_id=Math.max(0,Math.round(tileId));if(overlay!==undefined)this.project.editor.tile_overlay=String(overlay);if(tool!==undefined)this.project.editor.active_tool=String(tool);this.record('tilemap.tool-changed',{layer_id:this.project.editor.active_tile_layer_id,tile_id:this.project.editor.selected_tile_id,overlay:this.project.editor.tile_overlay,tool:this.project.editor.active_tool});return this.checkpoint({record:false});}
  queryPath({start,end,startNodeId=null,endNodeId=null,allowDiagonal=false,smooth=true,excludeNodeIds=[]}={}){
    const scene=activeScene(this.project),tilemap=this.activeTileMap();if(!tilemap)throw new StudioError('SCENE_TILEMAP_REQUIRED');
    const pos=id=>this.navigation.positions[id]??findNode(this.project,id)?.node?.transform;
    const a=startNodeId?pos(startNodeId):start,b=endNodeId?pos(endNodeId):end;if(!a||!b)throw new StudioError('NAVIGATION_ENDPOINT_REQUIRED');
    const nav=compileSceneNavigation(scene,{positions:this.navigation.positions,excludeNodeIds:[...excludeNodeIds,...[startNodeId,endNodeId].filter(Boolean)],allowDiagonal});
    let path=findPath(nav.grid,worldToCell(tilemap,a.x,a.y),worldToCell(tilemap,b.x,b.y),{allowDiagonal});if(smooth)path=smoothPath(nav.grid,path);const points=pathWorldPoints(tilemap,path);this.navigation.queries++;const id=`path:${this.navigation.queries}`;this.navigation.paths[id]={path_id:id,...deep(path),world_points:points,start_node_id:startNodeId,end_node_id:endNodeId};this.navigation.last_receipt=navigationReceipt({sceneId:scene.scene_id,tilemap,grid:nav.grid,paths:[path],agents:Object.entries(this.navigation.targets).map(([node_id,t])=>({node_id,target:t}))});this.record('navigation.path-queried',{path_id:id,status:path.status,cells:path.cells.length,cost:path.cost});return{id,path:this.navigation.paths[id],grid_root:nav.grid.navigation_root,receipt:this.navigation.last_receipt};
  }
  setNavigationTarget({nodeId,x,y,speedMilli=null,allowDiagonal=false}={}){const found=findNode(this.project,nodeId);if(!found)throw new StudioError('NODE_NOT_FOUND',nodeId);const current=this.navigation.positions[nodeId]??{x:found.node.transform.x,y:found.node.transform.y,status:'idle',speed_milli:2400};if(speedMilli!==null)current.speed_milli=Math.max(100,Math.round(speedMilli));this.navigation.positions[nodeId]=current;this.navigation.targets[nodeId]={x:Math.round(x),y:Math.round(y),allow_diagonal:Boolean(allowDiagonal),path_id:null,waypoint:0};current.status='pathing';this.record('navigation.target-set',{node_id:nodeId,target:this.navigation.targets[nodeId]});return this.inspect();}
  clearNavigationTarget(nodeId){delete this.navigation.targets[nodeId];if(this.navigation.positions[nodeId])this.navigation.positions[nodeId].status='idle';this.record('navigation.target-cleared',{node_id:nodeId});return this.inspect();}
  stepNavigation(){
    const scene=activeScene(this.project),tilemap=this.activeTileMap();if(!tilemap)return;
    for(const [nodeId,target] of Object.entries(this.navigation.targets)){
      const found=findNode(this.project,nodeId);if(!found)continue;
      const p=this.navigation.positions[nodeId]??{x:found.node.transform.x,y:found.node.transform.y,status:'pathing',speed_milli:2400};
      let cached=target.path_id?this.navigation.paths[target.path_id]:null;
      if(!cached){
        const q=this.queryPath({start:p,end:target,startNodeId:nodeId,allowDiagonal:target.allow_diagonal,smooth:true,excludeNodeIds:[nodeId]});
        cached=q.path;target.path_id=q.id;target.waypoint=0;
      }
      const points=cached?.world_points??[];
      if(cached?.status!=='ok'||points.length<1){p.status='blocked';this.navigation.positions[nodeId]=p;continue;}
      while(target.waypoint<points.length-1&&Math.hypot(points[target.waypoint].x-p.x,points[target.waypoint].y-p.y)<=2)target.waypoint++;
      const next=points[target.waypoint]??target,dx=next.x-p.x,dy=next.y-p.y,dist=Math.hypot(dx,dy),step=Math.max(1,Math.floor((p.speed_milli??2400)/1000));
      if(dist<=step){p.x=next.x;p.y=next.y;if(target.waypoint<points.length-1)target.waypoint++;}
      else{p.x=Math.round(p.x+dx/dist*step);p.y=Math.round(p.y+dy/dist*step)}
      if(Math.hypot(target.x-p.x,target.y-p.y)<=Math.max(2,step)){p.x=target.x;p.y=target.y;p.status='arrived';delete this.navigation.targets[nodeId];this.record('navigation.arrived',{node_id:nodeId,x:p.x,y:p.y});}else p.status='moving';
      this.navigation.positions[nodeId]=p;
    }
    const tile=this.activeTileMap(),nav=compileSceneNavigation(scene,{positions:this.navigation.positions,excludeNodeIds:Object.keys(this.navigation.positions)});this.navigation.last_receipt=navigationReceipt({sceneId:scene.scene_id,tilemap:tile,grid:nav.grid,paths:Object.values(this.navigation.paths),agents:Object.entries(this.navigation.positions).map(([node_id,p])=>({node_id,...p,target:this.navigation.targets[node_id]??null}))});
  }
  addAssetNode({assetId,x=160,y=160,name=null,bindEntity=true,nodeId=null,entityId=null}={}){
    const asset=this.project.assets.registry[assetId];if(!asset)throw new StudioError('ASSET_NOT_FOUND',assetId);
    const boundEntityId=bindEntity?(entityId??`entity:${safeId(assetId.split(':').at(-1))}:${this.project.scenes[0].nodes.length+1}`):null;
    const node=createSceneNode({nodeId,name:name??asset.name,assetId,x,y,zIndex:activeScene(this.project).nodes.length,entityId:boundEntityId,components:{asset_kind:asset.kind},createdAt:this.clock()});
    activeScene(this.project).nodes.push(node);this.project.editor.selected_node_id=node.node_id;
    if(boundEntityId){const program=this.project.behavior.programs[this.project.behavior.active_program_id];const next=syncProgramFromScene(this.project,program);this.project.behavior.programs[next.identity.program_id]=next;this.behavior.replaceProgram(next,{preserveState:true});}
    this.record('scene.node-added',{node_id:node.node_id,asset_id:assetId,entity_id:boundEntityId});return this.checkpoint();
  }
  patchNode(nodeId,patch={}){
    const found=findNode(this.project,nodeId);if(!found)throw new StudioError('NODE_NOT_FOUND',nodeId);
    if(patch.transform)found.node.transform={...found.node.transform,...deep(patch.transform)};
    for(const k of ['name','visible','z_index','asset_id','behavior_binding','components'])if(k in patch)found.node[k]=deep(patch[k]);
    const program=this.project.behavior.programs[this.project.behavior.active_program_id];const next=syncProgramFromScene(this.project,program);this.project.behavior.programs[next.identity.program_id]=next;this.behavior.replaceProgram(next,{preserveState:true});
    this.record('scene.node-patched',{node_id:nodeId,patch});return this.checkpoint();
  }
  moveNode(nodeId,{x,y,snap=true}={}){
    const g=this.project.editor.grid_size??16;const tx=snap?Math.round(x/g)*g:Math.round(x),ty=snap?Math.round(y/g)*g:Math.round(y);
    return this.patchNode(nodeId,{transform:{x:tx,y:ty}});
  }
  removeNode(nodeId){
    const scene=activeScene(this.project),i=scene.nodes.findIndex(n=>n.node_id===nodeId);if(i<0)throw new StudioError('NODE_NOT_FOUND',nodeId);
    const [node]=scene.nodes.splice(i,1);if(this.project.editor.selected_node_id===nodeId)this.project.editor.selected_node_id=scene.nodes[0]?.node_id??null;
    this.record('scene.node-removed',{node_id:nodeId,asset_id:node.asset_id});return this.checkpoint();
  }
  select(nodeId){if(nodeId&&!findNode(this.project,nodeId))throw new StudioError('NODE_NOT_FOUND',nodeId);this.project.editor.selected_node_id=nodeId;return this.inspect();}
  replaceBehavior(program,{preserveState=true}={}){const next=program?.program_root?program:normalizeProgram(program);this.behavior.replaceProgram(next,{preserveState});this.project.behavior.programs[next.identity.program_id]=next;this.project.behavior.active_program_id=next.identity.program_id;this.record('behavior.replaced',{program_root:next.program_root});return this.checkpoint();}
  activeUITree(){return this.project.ui?.trees?.[this.project.ui.active_ui_id]??null;}
  activeInputProfile(){return this.project.input?.profiles?.[this.project.input.active_profile_id]??null;}
  compileUILayout({width=null,height=null,touch=null,safeArea=null}={}){const tree=this.activeUITree();if(!tree)return null;const scene=activeScene(this.project),runtime=this.behavior.inspect().runtime,data={project:{title:this.project.identity.title},globals:runtime.globals??{},entities:Object.fromEntries(Object.entries(runtime.entities??{}).map(([k,v])=>[k,v.variables??{}])),device:{touch:touch??this.uiState.device.touch,kind:this.uiState.device.kind}};const layout=layoutUITree(tree,{width:width??scene.canvas.width,height:height??scene.canvas.height,safe_area:safeArea??this.uiState.device.safe_area,data});this.uiState.last_layout=layout;return layout;}
  selectUINode(nodeId){const tree=this.activeUITree();if(nodeId&&!tree?.nodes?.some(n=>n.ui_node_id===nodeId))throw new StudioError('UI_NODE_NOT_FOUND',nodeId);this.project.editor.selected_ui_node_id=nodeId;this.uiState.focus_id=nodeId;return this.inspect();}
  patchUINode(nodeId,patch={}){const tree=this.activeUITree(),i=tree?.nodes?.findIndex(n=>n.ui_node_id===nodeId)??-1;if(i<0)throw new StudioError('UI_NODE_NOT_FOUND',nodeId);const raw=deep(tree);delete raw.ui_root;raw.nodes[i]={...raw.nodes[i],...deep(patch)};for(const k of ['anchors','offsets','min_size','style','layout','bindings','events','navigation'])if(patch[k])raw.nodes[i][k]={...(tree.nodes[i][k]??{}),...deep(patch[k])};this.project.ui.trees[tree.ui_id]=seal(raw,'ui_root');this.record('ui.node-patched',{ui_node_id:nodeId,patch});return this.checkpoint();}
  addUINode({parentId=null,node=null}={}){const tree=this.activeUITree();if(!tree)throw new StudioError('UI_TREE_REQUIRED');const parent=tree.nodes.find(n=>n.ui_node_id===(parentId??tree.root_id));if(!parent)throw new StudioError('UI_PARENT_MISSING',parentId);const id=node?.ui_node_id??`ui:node:${randomUUID()}`,raw=deep(tree);delete raw.ui_root;const p=raw.nodes.find(n=>n.ui_node_id===parent.ui_node_id);p.children??=[];p.children.push(id);raw.nodes.push({ui_node_id:id,type:node?.type??'Label',name:node?.name??'新控件',parent_id:p.ui_node_id,visible:true,enabled:true,focus_mode:'none',mouse_filter:'ignore',z_index:0,anchors:{left:0,top:0,right:0,bottom:0},offsets:{left:20,top:20,right:140,bottom:56},min_size:{width:0,height:0},style:{},layout:{mode:'manual',gap:8,padding:{left:0,top:0,right:0,bottom:0}},bindings:{},events:{},children:[],text:'新控件',...deep(node)});this.project.ui.trees[tree.ui_id]=seal(raw,'ui_root');this.project.editor.selected_ui_node_id=id;this.record('ui.node-added',{ui_node_id:id,parent_id:p.ui_node_id});return this.checkpoint();}
  removeUINode(nodeId){const tree=this.activeUITree();if(nodeId===tree?.root_id)throw new StudioError('UI_ROOT_REMOVE_FORBIDDEN');const raw=deep(tree);delete raw.ui_root;const ids=new Set([nodeId]);let changed=true;while(changed){changed=false;for(const n of raw.nodes)if(n.parent_id&&ids.has(n.parent_id)&&!ids.has(n.ui_node_id)){ids.add(n.ui_node_id);changed=true}}raw.nodes=raw.nodes.filter(n=>!ids.has(n.ui_node_id));for(const n of raw.nodes)n.children=(n.children??[]).filter(id=>!ids.has(id));this.project.ui.trees[tree.ui_id]=seal(raw,'ui_root');this.project.editor.selected_ui_node_id=tree.root_id;this.record('ui.node-removed',{ui_node_id:nodeId,count:ids.size});return this.checkpoint();}
  setInputBinding({action,binding,replace=false}={}){const profile=this.inputRuntime.rebind(action,binding,{replace});this.project.input.profiles[profile.profile_id]=profile;this.record('input.binding-changed',{action,binding,replace});return this.checkpoint();}
  sampleInput(raw={}){const frame=this.inputRuntime.sample(raw);this.record('input.sampled',{frame_root:frame.frame_root,devices:frame.devices});return frame;}
  dispatchUIEvent(event={}){const layout=this.compileUILayout({touch:event.touch});const routed=routePointerEvent(layout,event);this.uiState.last_event=routed;if(routed.target_id)this.uiState.focus_id=routed.target_id;this.uiState.events.push(routed);if(this.uiState.events.length>200)this.uiState.events.shift();this.record('ui.event',{target_id:routed.target_id,action:routed.action,type:routed.type});return routed;}
  moveFocus(direction){const layout=this.compileUILayout();this.uiState.focus_id=moveUIFocus(layout,this.uiState.focus_id,direction);this.record('ui.focus-moved',{direction,focus_id:this.uiState.focus_id});return this.inspect();}
  undo(){if(this.history_index<=0)return this.inspect();this.history_index--;this.project=deep(this.history[this.history_index]);const p=this.project.behavior.programs[this.project.behavior.active_program_id];this.behavior.replaceProgram(p,{preserveState:true,recordHistory:false});this.spatial=new SpatialStudioSession(this.project.spatial3d);this.resetRuntimeTimeline();this.record('editor.undo');return this.inspect();}
  redo(){if(this.history_index>=this.history.length-1)return this.inspect();this.history_index++;this.project=deep(this.history[this.history_index]);const p=this.project.behavior.programs[this.project.behavior.active_program_id];this.behavior.replaceProgram(p,{preserveState:true,recordHistory:false});this.spatial=new SpatialStudioSession(this.project.spatial3d);this.resetRuntimeTimeline();this.record('editor.redo');return this.inspect();}
  step(input={}){this.status='paused';const before=this.behavior.inspect().runtime,beforeProjection=createSceneProjection(this.project,this.behavior.inspect(),{observer:'debugger',navigationPositions:this.navigation.positions});this.stepNavigation();let actions=input;if(input?.raw||input?.keys||input?.gamepads||input?.touches){const frame=this.sampleInput(input.raw??input);actions=this.inputRuntime.actionBooleans(frame);for(const d of ['left','right','up','down'])if(frame.actions?.[`ui_${d}`]?.just_pressed)this.uiState.focus_id=moveUIFocus(this.compileUILayout(),this.uiState.focus_id,d);if(frame.actions?.ui_accept?.just_pressed&&this.uiState.focus_id){const node=this.activeUITree()?.nodes?.find(n=>n.ui_node_id===this.uiState.focus_id),action=node?.events?.pressed;if(action)actions[action]=true;}}this.behavior.step(actions);const entry=this.recordRuntimeStep({input:actions,beforeStateRoot:before.state_root,beforeTick:before.tick,beforeProjectionRoot:beforeProjection.projection_root});this.record('runtime.step',{tick:this.behavior.runtime.state.tick,input:actions,timeline_sequence:entry.sequence});return this.inspect();}
  run({ticks=1,inputs=[]}={}){this.status='running';const limit=Math.max(0,Math.round(ticks));for(let i=0;i<limit;i++)this.step(inputs[i]??{});this.status='paused';this.record('runtime.run',{ticks:limit,final_tick:this.behavior.runtime.state.tick,timeline_cursor:this.runtimeTimeline.cursor});return this.inspect();}
  pause(){this.behavior.pause();this.status='paused';return this.inspect();}
  reset(){this.behavior.reset();this.status='editing';this.navigation.positions={};this.navigation.targets={};this.navigation.paths={};for(const n of activeScene(this.project).nodes??[])if(n.components?.navigation_agent)this.navigation.positions[n.node_id]={x:n.transform.x,y:n.transform.y,status:'idle',speed_milli:n.components.navigation_agent.speed_milli??2400};this.inputRuntime.reset();this.uiState.last_event=null;this.uiState.events=[];this.spatial.reset();this.resetRuntimeTimeline();this.record('runtime.reset');return this.inspect();}
  _replayRuntime(toTick=null){
    const target=toTick===null||toTick===undefined?Infinity:Math.max(0,Math.round(Number(toTick)));
    const entries=this.runtimeTimeline.entries.slice(0,this.runtimeTimeline.cursor).filter(entry=>entry.tick<=target);
    const replay=new BehaviorEditorSession(this.behavior.program,{sessionId:`replay:${this.session_id}`});
    replay.runtime.restore(this.timelineInitialSnapshot);
    const checks=[];
    for(const entry of entries){replay.step(entry.input);checks.push({sequence:entry.sequence,tick:entry.tick,expected_state_root:entry.after_state_root,actual_state_root:replay.runtime.stateRoot(),match:replay.runtime.stateRoot()===entry.after_state_root});}
    return{target_tick:entries.at(-1)?.tick??this.runtimeTimeline.initial.tick,entries,replay,checks,final_state_root:replay.runtime.stateRoot()};
  }
  replayRuntime({toTick=null,verify=true}={}){
    const result=this._replayRuntime(toTick),expected=result.entries.at(-1)?.after_state_root??this.runtimeTimeline.initial.state_root,checks=verify?result.checks:[],deterministic=result.final_state_root===expected&&checks.every(check=>check.match);
    return seal({format:'reality-studio.runtime-replay.v1.0',version:RUNTIME_TIMELINE_VERSION,session_id:this.session_id,project_root:this.project.project_root,program_root:this.behavior.program.program_root,timeline_root:this.timelineView().timeline_root,initial_state_root:this.runtimeTimeline.initial.state_root,target_tick:result.target_tick,replayed_entries:result.entries.length,expected_state_root:expected,actual_state_root:result.final_state_root,deterministic,checks},'replay_root');
  }
  seekRuntime({tick=0}={}){
    const result=this._replayRuntime(tick),replaySnapshot=result.replay.runtime.snapshot();this.behavior.runtime.restore(replaySnapshot);this.behavior.status='paused';this.status='paused';this.runtimeTimeline.cursor=result.entries.length;const receipt=this.replayRuntime({toTick:tick,verify:true});this.record('runtime.seek',{tick:result.target_tick,cursor:this.runtimeTimeline.cursor,replay_root:receipt.replay_root});return{...this.inspect(),runtime_replay:receipt};
  }
  createRuntimeCheckpoint(label='checkpoint'){
     const snapshot=this.behavior.runtime.snapshot(),sequence=this.runtimeTimeline.cursor,checkpointId='checkpoint:'+this.session_id+':'+sequence+':'+this.behavior.runtime.state.tick,receipt=seal({format:'reality-studio.runtime-checkpoint.v1.0',version:RUNTIME_TIMELINE_VERSION,session_id:this.session_id,checkpoint_id:checkpointId,label:String(label),sequence,tick:this.behavior.runtime.state.tick,state_root:this.behavior.runtime.stateRoot(),project_root:this.project.project_root,program_root:this.behavior.program.program_root},'checkpoint_root');
     this.runtimeCheckpoints.set(checkpointId,{snapshot,navigation:deep(this.navigation),receipt});
     this.runtimeTimeline.checkpoints.push(receipt);if(this.runtimeTimeline.checkpoints.length>50)this.runtimeTimeline.checkpoints.shift();this.record('runtime.checkpoint-created',{checkpoint_id:checkpointId,tick:receipt.tick,state_root:receipt.state_root});return{...this.inspect(),runtime_checkpoint:receipt};
  }
  restoreRuntimeCheckpoint(checkpointId){
    const entry=this.runtimeCheckpoints.get(checkpointId);if(!entry)throw new StudioError('RUNTIME_CHECKPOINT_NOT_FOUND',checkpointId);this.behavior.runtime.restore(entry.snapshot);this.navigation=deep(entry.navigation);this.behavior.status='paused';this.status='paused';this.runtimeTimeline.cursor=entry.receipt.sequence;this.record('runtime.checkpoint-restored',{checkpoint_id:checkpointId,tick:this.behavior.runtime.state.tick,state_root:this.behavior.runtime.stateRoot()});return{...this.inspect(),runtime_checkpoint:{...entry.receipt,checkpoint_id:checkpointId,restored_state_root:this.behavior.runtime.stateRoot()}};
  }
  setGPUOptions(options={}){
    const allowed=new Set(['economy','balanced','quality','cinematic']);
    if(options.quality!==undefined){if(!allowed.has(options.quality))throw new StudioError('GPU_QUALITY_INVALID',String(options.quality));this.gpu.quality=options.quality;}
    if(options.observer!==undefined)this.gpu.observer=String(options.observer);
    if(options.gpu_tier!==undefined)this.gpu.gpu_tier=Math.max(0,Math.min(3,Number(options.gpu_tier)||0));
    if(options.enabled!==undefined)this.gpu.enabled=Boolean(options.enabled);
    this.record('gpu.viewport-options',{quality:this.gpu.quality,observer:this.gpu.observer,gpu_tier:this.gpu.gpu_tier,enabled:this.gpu.enabled});
    return this.inspect();
  }
  compileGPUFrame(options={}){
    const start=performance.now();
    const observer=options.observer??this.gpu.observer,quality=options.quality??this.gpu.quality,gpuTier=options.gpu_tier??this.gpu.gpu_tier;
    const projection=createSceneProjection(this.project,this.behavior.inspect(),{observer,navigationPositions:this.navigation.positions});
    const plan=compileStudioGPUFrame(this.project,projection,{quality,observer,gpuTier});
    const summary=summarizeStudioGPUFrame(plan);
    this.gpu.last_summary=summary;this.gpu.last_compile_ms=performance.now()-start;this.gpu.frame_compiles++;
    return{summary,manifest:createGPUViewportManifest(this.project,summary),frame:options.serialized===false?plan:serializeStudioGPUFrame(plan),compile_ms:this.gpu.last_compile_ms};
  }
  exportArtifacts(){
    const behavior=this.behavior.exportArtifacts();const player=createSceneProjection(this.project,this.behavior.inspect(),{observer:'player',navigationPositions:this.navigation.positions}),debuggerView=createSceneProjection(this.project,this.behavior.inspect(),{observer:'debugger',navigationPositions:this.navigation.positions});
     const gpu=this.compileGPUFrame({serialized:false});const spatial=this.spatial.exportArtifacts();const runtimeTimeline=this.timelineView(),runtimeReplay=this.replayRuntime({verify:true}),networkCompilation=this.project.network?this.networkCompile():null;
    const assetLedger=this.assetLedger({strictFiles:false});const assetManifest=seal({format:'reality-studio.asset-manifest.v1.3',assets:this.project.assets.order.map(id=>this.project.assets.registry[id]),asset_ledger_root:assetLedger.ledger_root,dependency_graph_root:assetLedger.dependency_graph.graph_root,audit_root:assetLedger.audit.audit_root,project_root:this.project.project_root},'manifest_root');
     const gateway=seal({format:'reality-one.runtime-manifest.v0.3',runtime_id:'rncs.reality-studio-unified-world',version:STUDIO_VERSION,entry:'runtime/project.json',capabilities:['scene.instantiate','asset.resolve','behavior.execute','projection.render','gpu.viewport','gpu.frame-evidence','ui.layout','ui.focus','input.actions','input.gamepad','input.touch','runtime.timeline','runtime.replay','runtime.seek','runtime.checkpoint','spatial.body.edit','spatial.character.control','spatial.joint.edit','spatial.simulate','spatial.audio-events','spatial.haptic-events','spatial.vsr-project','network.player-slot.bind','network.world.compile'],dependencies:['rncs.behavior@^0.1.0','rncs.rsr@^0.5.0','rncs.vsr@^0.4.0','rncs.network@^0.2.0']},'manifest_root');
    const nav=this.activeTileMap()?compileSceneNavigation(activeScene(this.project),{positions:this.navigation.positions,excludeNodeIds:Object.keys(this.navigation.positions)}):null;
    const tilemapManifest=nav?seal({format:'reality-studio.tilemap-navigation-manifest.v1.1',version:TILEMAP_VERSION,project_root:this.project.project_root,tilemap:deep(nav.tilemap),collision:deep(nav.collision),navigation_grid:deep(nav.grid),receipt:deep(this.navigation.last_receipt)},'manifest_root'):null;
    const uiLayout=this.compileUILayout(),uiInputManifest=compileUIInputManifest({projectRoot:this.project.project_root,tree:this.activeUITree(),profile:this.activeInputProfile(),layout:uiLayout});
     const buildFiles=['project.json','scene-player.json','scene-debugger.json','behavior.json','assets.json','asset-continuity-ledger.json','gateway.runtime.json','runtime-timeline.json','runtime-replay.json','gpu-viewport.manifest.json','gpu-frame-summary.json','tilemap-navigation.manifest.json','ui-input.manifest.json','spatial-workspace.json','spatial-world.json','spatial-snapshot.json','spatial-frame-plan.json','spatial-runtime.manifest.json','web-preview.html'];if(networkCompilation)buildFiles.push('network-world-compilation.json');
     const build=seal({format:'reality-studio.web-build-plan.v1.2',project_root:this.project.project_root,entry_scene_id:this.project.active_scene_id,files:buildFiles,targets:deep(this.project.build.targets),gpu:{preferred_backend:'webgpu',fallback_backend:'canvas2d',frame_plan_root:gpu.summary.frame_plan_root},ui_input:{manifest_root:uiInputManifest.manifest_root},network:networkCompilation?{compilation_root:networkCompilation.compilation_root,world_config_root:networkCompilation.world_config_root,player_slots:networkCompilation.counts.player_slots}:null},'build_root');
     return{project:this.project,scene_player:player,scene_debugger:debuggerView,behavior_program:this.behavior.program,behavior_runtime:behavior,runtime_timeline:runtimeTimeline,runtime_replay:runtimeReplay,asset_manifest:assetManifest,asset_continuity_ledger:assetLedger,gateway_manifest:gateway,build_plan:build,gpu_viewport_manifest:gpu.manifest,gpu_frame_summary:gpu.summary,tilemap_navigation_manifest:tilemapManifest,ui_input_manifest:uiInputManifest,ui_layout:uiLayout,input_profile:this.activeInputProfile(),network_world_compilation:networkCompilation,...spatial,editor_events:deep(this.events)};
  }
  inspect(){
    const b=this.behavior.inspect(),scene=activeScene(this.project),selected=findNode(this.project,this.project.editor.selected_node_id)?.node??null;
    const timeline=this.timelineView(),networkValidation=validateNetworkAuthoring(this.project),networkCompilation=networkValidation.configured&&networkValidation.valid?compileNetworkWorld(this.project):null;
    return{
      format:'reality-studio.unified-session.v1.0',session_id:this.session_id,status:this.status,
      validation:validateUnifiedProject(this.project),
      project:{identity:deep(this.project.identity),project_root:this.project.project_root,active_scene_id:this.project.active_scene_id},
      project_full:deep(this.project),
      scene:{...deep(scene),projection:createSceneProjection(this.project,b,{observer:'debugger',navigationPositions:this.navigation.positions})},
      assets:{version:ASSET_CONTINUITY_VERSION,count:this.project.assets.order.length,items:this.project.assets.order.map(id=>this.project.assets.registry[id]),import_roots:deep(this.project.assets.import_roots??[]),last_audit_root:this.project.assets.last_audit_root??null,dependency_graph:this.assetDependencyGraph(),audit:auditAssetContinuity(this.project,{strictFiles:false})},
      behavior:b,timeline,runtime_timeline:timeline,
      gpu:{version:GPU_STUDIO_VERSION,...deep(this.gpu)},
      navigation:{...deep(this.navigation),tilemap_count:scene.tilemaps?.length??0,active_tilemap:this.activeTileMap()?{tilemap_id:this.activeTileMap().tilemap_id,tilemap_root:this.activeTileMap().tilemap_root,width:this.activeTileMap().width,height:this.activeTileMap().height,cell_size:this.activeTileMap().cell_size}:null},
      ui:{version:UI_INPUT_VERSION,tree:deep(this.activeUITree()),layout:deep(this.compileUILayout()),focus_id:this.uiState.focus_id,last_event:deep(this.uiState.last_event),event_tail:deep(this.uiState.events.slice(-50))},
      input:{version:UI_INPUT_VERSION,profile:deep(this.activeInputProfile()),last_frame:deep(this.inputRuntime.last)},
      spatial:this.spatial.inspect(),
      network:{configured:networkValidation.configured,authoring:deep(this.project.network??null),validation:networkValidation,compilation:networkCompilation?{compilation_root:networkCompilation.compilation_root,world_config_root:networkCompilation.world_config_root,project_root:networkCompilation.project_root,player_slots:networkCompilation.counts.player_slots,asset_bindings:networkCompilation.counts.asset_bindings}:null},
      editor:{...deep(this.project.editor),selected_node:deep(selected),selected_ui_node:deep(this.activeUITree()?.nodes?.find(n=>n.ui_node_id===this.project.editor.selected_ui_node_id)??null),history_index:this.history_index,history_length:this.history.length,can_undo:this.history_index>0,can_redo:this.history_index<this.history.length-1},
      event_tail:this.events.slice(-100)
    };
  }
}

export class UnifiedSessionRegistry{
  constructor(){this.sessions=new Map();}
  create(project){const s=new UnifiedManufacturingSession(project);this.sessions.set(s.session_id,s);return s;}
  get(id){const s=this.sessions.get(id);if(!s)throw new StudioError('UNIFIED_SESSION_NOT_FOUND',id);return s;}
}
