import {randomUUID} from 'node:crypto';
import {clone,seal,verifySeal,StudioError} from './canonical.mjs';
import {
  SPATIAL_EMBODIMENT_FORMAT,
  LEGACY_SPATIAL_EMBODIMENT_FORMAT,
  SPATIAL_EMBODIMENT_VERSION,
  SpatialEmbodimentWorld,
  toSpatialFixed,
  degrees,
  spatialEmbodimentSnapshotToCausalDelta
} from '../../../packages/world/reality-simulation-runtime/dist/packages/spatial-embodiment/src/index.js';
import {
  spatialEmbodimentSnapshotToVSRScene,
  projectSpatialEmbodiment,
  SPATIAL_EMBODIMENT_VSR_VERSION
} from '../../../packages/world/reality-simulation-runtime/dist/packages/spatial-embodiment-vsr/src/index.js';
import {
  compileSpatialFrame,
  verifySpatialFrame,
  VSR_SPATIAL_REALITY_VERSION
} from '../../../packages/world/visual-state-runtime/dist/packages/spatial-reality-3d/src/index.js';

export const SPATIAL_STUDIO_VERSION='1.4.0-alpha.1';
export const SPATIAL_WORKSPACE_FORMAT='reality-studio.spatial-workspace.v1.4';
export const SPATIAL_EDITOR_FORMAT='reality-studio.spatial-editor-state.v1.4';
const deep=v=>structuredClone(v);
const q=n=>Math.round(Number(n)||0);
const vec=(x=0,y=0,z=0)=>({x:q(x),y:q(y),z:q(z)});
const safeId=s=>String(s??'item').replace(/[^a-zA-Z0-9:_-]/g,'-');
const bodyIds=w=>new Set((w.bodies??[]).map(x=>x.id));
const fixtureIds=w=>new Set((w.bodies??[]).flatMap(b=>(b.fixtures??[]).map(f=>`${b.id}/${f.id}`)));

function defaultMaterials(){return[
  {id:'material:body',frictionQ:520000,restitutionQ:0,impactSound:'impact.body',impactHaptic:'haptic.body'},
  {id:'material:object',frictionQ:620000,restitutionQ:80000,impactSound:'impact.object',impactHaptic:'haptic.object'},
  {id:'material:metal',frictionQ:400000,restitutionQ:120000,impactSound:'impact.metal',impactHaptic:'haptic.metal'}
]}
function defaultWorld(worldId='world:studio-embodied'){
  return{
    format:SPATIAL_EMBODIMENT_FORMAT,
    worldId,
    stepHz:60,
    gravity:vec(0,-9810,0),
    floorY:0,
    velocityIterations:7,
    positionIterations:5,
    maxSubsteps:24,
    materials:defaultMaterials(),
    bodies:[
      {id:'avatar',kind:'dynamic',position:vec(-2800,1000,0),fixtures:[{id:'avatar:capsule',shape:{type:'capsule',radius:300,halfHeight:700},materialId:'material:body',bodyZone:'torso',tags:['subject-body']}],massQ:1000000,frictionQ:550000,allowSleep:false,tags:['subject-body','player']},
      {id:'crate-a',kind:'dynamic',position:vec(500,520,0),fixtures:[{id:'crate-a:shape',shape:{type:'box',halfExtents:vec(500,500,500)},materialId:'material:object',bodyZone:'object'}],massQ:1600000,tags:['prop']},
      {id:'orb',kind:'dynamic',position:vec(3000,1600,-1200),velocity:vec(-1800,300,900),fixtures:[{id:'orb:shape',shape:{type:'sphere',radius:360},materialId:'material:metal',bodyZone:'object'}],massQ:700000,bullet:true,tags:['prop','bullet']},
      {id:'pillar',kind:'static',position:vec(3600,1500,1000),fixtures:[{id:'pillar:shape',shape:{type:'box',halfExtents:vec(450,1500,450)},materialId:'material:object'}],tags:['environment']}
    ],
    characters:[{id:'subject:player',bodyId:'avatar',walkSpeed:4200,acceleration:18000,airControlQ:260000,jumpSpeed:5600,footstepDistance:620,leftFootZone:'foot.left',rightFootZone:'foot.right'}],
    joints:[],
    listeners:[{id:'listener:player',position:vec(-2800,1700,0),forward:vec(1000000,0,0),up:vec(0,1000000,0)}],
    reality:{generation:0,realityRoot:'rfe:uncommitted:studio-spatial',evidenceRoot:'rfe:evidence:uncommitted'}
  };
}

export function createDefaultSpatialWorkspace({worldId='world:studio-embodied'}={}){
  const world=defaultWorld(worldId);
  return seal({
    format:SPATIAL_WORKSPACE_FORMAT,
    version:SPATIAL_STUDIO_VERSION,
    active_world_id:world.worldId,
    worlds:{[world.worldId]:world},
    editor:{
      format:SPATIAL_EDITOR_FORMAT,
      selected_body_id:'avatar',selected_fixture_id:'avatar:capsule',selected_joint_id:null,selected_character_id:'subject:player',
      active_tool:'spatial-select',show_contacts:true,show_sensory:true,show_grid:true,
      camera:{position_milli:vec(7000,5000,9000),rotation_mdeg:vec(-18000,38000,0),fov_mdeg:52000},
      viewport:{width:960,height:540,quality_tier:'balanced'}
    }
  },'workspace_root');
}

export function sealSpatialWorkspace(workspace){
  const out=deep(workspace);delete out.workspace_root;
  for(const [id,world] of Object.entries(out.worlds??{})){
    const copy=deep(world);delete copy.world_root;copy.world_root=seal(copy,'world_root').world_root;out.worlds[id]=copy;
  }
  return seal(out,'workspace_root');
}

export function ensureSpatialWorkspace(project){
  const out=deep(project);
  if(!out.spatial3d)out.spatial3d=createDefaultSpatialWorkspace({worldId:`world:${safeId(out.identity?.project_id??'studio')}`});
  if(!out.editor)out.editor={};
  out.editor.selected_spatial_body_id??=out.spatial3d.editor?.selected_body_id??null;
  out.editor.selected_spatial_joint_id??=out.spatial3d.editor?.selected_joint_id??null;
  out.editor.spatial_view_mode??='solid';
  out.spatial3d=sealSpatialWorkspace(out.spatial3d);
  return out;
}

export function validateSpatialWorkspace(workspace){
  const errors=[],warnings=[];
  const need=(ok,code,path,details={})=>{if(!ok)errors.push({code,path,...details})};
  need(workspace?.format===SPATIAL_WORKSPACE_FORMAT,'SPATIAL_FORMAT_INVALID','spatial3d.format');
  need(workspace?.version===SPATIAL_STUDIO_VERSION,'SPATIAL_VERSION_INVALID','spatial3d.version');
  need(Boolean(workspace?.active_world_id),'SPATIAL_ACTIVE_WORLD_REQUIRED','spatial3d.active_world_id');
  const active=workspace?.worlds?.[workspace?.active_world_id];need(Boolean(active),'SPATIAL_ACTIVE_WORLD_MISSING','spatial3d.active_world_id');
  for(const [worldId,world] of Object.entries(workspace?.worlds??{})){
    need([SPATIAL_EMBODIMENT_FORMAT,LEGACY_SPATIAL_EMBODIMENT_FORMAT].includes(world?.format),'SPATIAL_WORLD_FORMAT_INVALID',`spatial3d.worlds.${worldId}.format`);
    need(world?.worldId===worldId,'SPATIAL_WORLD_ID_MISMATCH',`spatial3d.worlds.${worldId}.worldId`);
    need(Number.isInteger(world?.stepHz)&&world.stepHz>0,'SPATIAL_STEP_HZ_INVALID',`spatial3d.worlds.${worldId}.stepHz`);
    const bIds=bodyIds(world),fIds=fixtureIds(world);
    need(bIds.size===(world.bodies??[]).length,'SPATIAL_BODY_ID_DUPLICATE',`spatial3d.worlds.${worldId}.bodies`);
    need(fIds.size===(world.bodies??[]).reduce((n,b)=>n+(b.fixtures?.length??0),0),'SPATIAL_FIXTURE_ID_DUPLICATE',`spatial3d.worlds.${worldId}.bodies.fixtures`);
    for(const body of world.bodies??[]){
      need(['static','dynamic','kinematic'].includes(body.kind),'SPATIAL_BODY_KIND_INVALID',`spatial3d.worlds.${worldId}.bodies.${body.id}.kind`);
      need(Boolean(body.position),'SPATIAL_BODY_POSITION_REQUIRED',`spatial3d.worlds.${worldId}.bodies.${body.id}.position`);
      need((body.fixtures?.length??0)>0,'SPATIAL_BODY_FIXTURE_REQUIRED',`spatial3d.worlds.${worldId}.bodies.${body.id}.fixtures`);
      for(const fixture of body.fixtures??[]){
        const s=fixture.shape;need(Boolean(s),'SPATIAL_SHAPE_REQUIRED',`spatial3d.worlds.${worldId}.bodies.${body.id}.fixtures.${fixture.id}.shape`);
        if(s?.type==='sphere')need(s.radius>0,'SPATIAL_SPHERE_RADIUS_INVALID',`spatial3d.worlds.${worldId}.bodies.${body.id}.fixtures.${fixture.id}.shape.radius`);
        else if(s?.type==='capsule'){need(s.radius>0,'SPATIAL_CAPSULE_RADIUS_INVALID',`spatial3d.worlds.${worldId}.bodies.${body.id}.fixtures.${fixture.id}.shape.radius`);need(s.halfHeight>=0,'SPATIAL_CAPSULE_HEIGHT_INVALID',`spatial3d.worlds.${worldId}.bodies.${body.id}.fixtures.${fixture.id}.shape.halfHeight`)}
        else if(s?.type==='box')need(s.halfExtents&&s.halfExtents.x>0&&s.halfExtents.y>0&&s.halfExtents.z>0,'SPATIAL_BOX_EXTENTS_INVALID',`spatial3d.worlds.${worldId}.bodies.${body.id}.fixtures.${fixture.id}.shape.halfExtents`);
        else need(false,'SPATIAL_SHAPE_TYPE_INVALID',`spatial3d.worlds.${worldId}.bodies.${body.id}.fixtures.${fixture.id}.shape.type`);
      }
    }
    const chars=new Set();for(const c of world.characters??[]){need(!chars.has(c.id),'SPATIAL_CHARACTER_ID_DUPLICATE',`spatial3d.worlds.${worldId}.characters.${c.id}`);chars.add(c.id);need(bIds.has(c.bodyId),'SPATIAL_CHARACTER_BODY_MISSING',`spatial3d.worlds.${worldId}.characters.${c.id}.bodyId`)}
    const joints=new Set();for(const j of world.joints??[]){need(!joints.has(j.id),'SPATIAL_JOINT_ID_DUPLICATE',`spatial3d.worlds.${worldId}.joints.${j.id}`);joints.add(j.id);need(bIds.has(j.bodyA)&&bIds.has(j.bodyB),'SPATIAL_JOINT_BODY_MISSING',`spatial3d.worlds.${worldId}.joints.${j.id}`);need(j.bodyA!==j.bodyB,'SPATIAL_JOINT_SELF_REFERENCE',`spatial3d.worlds.${worldId}.joints.${j.id}`)}
    try{new SpatialEmbodimentWorld(world)}catch(error){errors.push({code:'SPATIAL_WORLD_RUNTIME_REJECTED',path:`spatial3d.worlds.${worldId}`,message:error.message})}
  }
  if(workspace?.workspace_root&&!verifySeal(workspace,'workspace_root'))warnings.push({code:'SPATIAL_WORKSPACE_ROOT_STALE',path:'spatial3d.workspace_root'});
  return{valid:errors.length===0,errors,warnings,world_count:Object.keys(workspace?.worlds??{}).length,body_count:active?.bodies?.length??0,joint_count:active?.joints?.length??0,character_count:active?.characters?.length??0,workspace_root:workspace?.workspace_root??null};
}

function mergeShape(shape,patch){
  if(!patch)return deep(shape);
  const type=patch.type??shape?.type??'box';
  if(type==='sphere')return{type,radius:q(patch.radius??shape?.radius??500)};
  if(type==='capsule')return{type,radius:q(patch.radius??shape?.radius??300),halfHeight:q(patch.halfHeight??shape?.halfHeight??700)};
  return{type:'box',halfExtents:{...deep(shape?.halfExtents??vec(500,500,500)),...deep(patch.halfExtents??{})}};
}
function mergeBody(body,patch={}){
  const out={...deep(body),...deep(patch)};
  for(const k of ['position','rotationDeg','velocity','angularVelocityDeg'])if(patch[k])out[k]={...deep(body[k]??vec()),...deep(patch[k])};
  if(patch.fixtures)out.fixtures=deep(patch.fixtures);
  return out;
}

export class SpatialStudioSession{
  constructor(workspace){
    const validation=validateSpatialWorkspace(workspace);if(!validation.valid)throw new StudioError('SPATIAL_WORKSPACE_INVALID','',validation);
    this.workspace=sealSpatialWorkspace(workspace);this.events=[];this.snapshots=[];this.resetRuntime();
  }
  get config(){return this.workspace.worlds[this.workspace.active_world_id]}
  record(type,data={}){this.events.push({sequence:this.events.length+1,type,...deep(data)});if(this.events.length>300)this.events.shift()}
  syncWorkspace(){this.workspace=sealSpatialWorkspace(this.workspace);}
  resetRuntime(){this.world=new SpatialEmbodimentWorld(this.config);this.lastSnapshot=this.world.snapshot();this.lastProjection=null;this.record('spatial.runtime-reset',{state_root:this.lastSnapshot.stateRoot});return this.lastSnapshot}
  rebuild(){this.syncWorkspace();return this.resetRuntime()}
  selectBody(bodyId){if(bodyId&&!this.config.bodies.some(b=>b.id===bodyId))throw new StudioError('SPATIAL_BODY_NOT_FOUND',bodyId);this.workspace.editor.selected_body_id=bodyId;const body=this.config.bodies.find(b=>b.id===bodyId);this.workspace.editor.selected_fixture_id=body?.fixtures?.[0]?.id??null;this.workspace.editor.selected_joint_id=null;this.syncWorkspace();return this.inspect()}
  selectJoint(jointId){if(jointId&&!this.config.joints?.some(j=>j.id===jointId))throw new StudioError('SPATIAL_JOINT_NOT_FOUND',jointId);this.workspace.editor.selected_joint_id=jointId;if(jointId)this.workspace.editor.selected_body_id=null;this.syncWorkspace();return this.inspect()}
  addBody({id=null,name=null,kind='dynamic',shape='box',position=vec(0,1000,0),size=vec(500,500,500),radius=400,halfHeight=650,materialId='material:object',tags=[]}={}){
    const bodyId=id??`body:${safeId(name??kind)}:${randomUUID().slice(0,8)}`;if(this.config.bodies.some(b=>b.id===bodyId))throw new StudioError('SPATIAL_BODY_ID_DUPLICATE',bodyId);
    const fixtureShape=shape==='sphere'?{type:'sphere',radius:q(radius)}:shape==='capsule'?{type:'capsule',radius:q(radius),halfHeight:q(halfHeight)}:{type:'box',halfExtents:vec(size.x,size.y,size.z)};
    const body={id:bodyId,kind,position:vec(position.x,position.y,position.z),fixtures:[{id:`${bodyId}:shape`,shape:fixtureShape,materialId,bodyZone:kind==='dynamic'?'object':'environment'}],massQ:kind==='dynamic'?1000000:undefined,tags:[...tags]};
    this.config.bodies.push(body);this.workspace.editor.selected_body_id=bodyId;this.workspace.editor.selected_fixture_id=body.fixtures[0].id;this.record('spatial.body-added',{body_id:bodyId,kind,shape});this.rebuild();return this.inspect()}
  patchBody(bodyId,patch={}){const i=this.config.bodies.findIndex(b=>b.id===bodyId);if(i<0)throw new StudioError('SPATIAL_BODY_NOT_FOUND',bodyId);this.config.bodies[i]=mergeBody(this.config.bodies[i],patch);this.record('spatial.body-patched',{body_id:bodyId,patch});this.rebuild();return this.inspect()}
  patchFixture(bodyId,fixtureId,patch={}){const body=this.config.bodies.find(b=>b.id===bodyId);if(!body)throw new StudioError('SPATIAL_BODY_NOT_FOUND',bodyId);const i=body.fixtures.findIndex(f=>f.id===fixtureId);if(i<0)throw new StudioError('SPATIAL_FIXTURE_NOT_FOUND',fixtureId);const current=body.fixtures[i];body.fixtures[i]={...deep(current),...deep(patch),shape:mergeShape(current.shape,patch.shape)};this.record('spatial.fixture-patched',{body_id:bodyId,fixture_id:fixtureId,patch});this.rebuild();return this.inspect()}
  removeBody(bodyId){const i=this.config.bodies.findIndex(b=>b.id===bodyId);if(i<0)throw new StudioError('SPATIAL_BODY_NOT_FOUND',bodyId);this.config.bodies.splice(i,1);this.config.characters=(this.config.characters??[]).filter(c=>c.bodyId!==bodyId);this.config.joints=(this.config.joints??[]).filter(j=>j.bodyA!==bodyId&&j.bodyB!==bodyId);this.workspace.editor.selected_body_id=this.config.bodies[0]?.id??null;this.workspace.editor.selected_joint_id=null;this.record('spatial.body-removed',{body_id:bodyId});this.rebuild();return this.inspect()}
  addJoint({id=null,type='distance',bodyA,bodyB,restLength=1800,axis=vec(0,0,1000000)}={}){if(!bodyA||!bodyB)throw new StudioError('SPATIAL_JOINT_BODIES_REQUIRED');if(bodyA===bodyB)throw new StudioError('SPATIAL_JOINT_SELF_REFERENCE',bodyA);const ids=bodyIds(this.config);if(!ids.has(bodyA)||!ids.has(bodyB))throw new StudioError('SPATIAL_JOINT_BODY_MISSING');const jointId=id??`joint:${safeId(bodyA)}:${safeId(bodyB)}:${randomUUID().slice(0,6)}`;let joint;if(type==='ball')joint={id:jointId,type,bodyA,bodyB,localAnchorA:vec(),localAnchorB:vec(),stiffnessQ:900000,dampingQ:320000,breakForce:800000};else if(type==='hinge')joint={id:jointId,type,bodyA,bodyB,localAnchorA:vec(),localAnchorB:vec(),axis:vec(axis.x,axis.y,axis.z),motorSpeedDeg:0,maxMotorTorque:4500,lowerAngleDeg:-90000,upperAngleDeg:90000,breakForce:800000};else joint={id:jointId,type:'distance',bodyA,bodyB,restLength:q(restLength),stiffnessQ:850000,dampingQ:260000,breakForce:900000};this.config.joints??=[];this.config.joints.push(joint);this.workspace.editor.selected_joint_id=jointId;this.workspace.editor.selected_body_id=null;this.record('spatial.joint-added',{joint_id:jointId,type:joint.type,bodyA,bodyB});this.rebuild();return this.inspect()}
  patchJoint(jointId,patch={}){const i=(this.config.joints??[]).findIndex(j=>j.id===jointId);if(i<0)throw new StudioError('SPATIAL_JOINT_NOT_FOUND',jointId);this.config.joints[i]={...deep(this.config.joints[i]),...deep(patch)};this.record('spatial.joint-patched',{joint_id:jointId,patch});this.rebuild();return this.inspect()}
  removeJoint(jointId){const i=(this.config.joints??[]).findIndex(j=>j.id===jointId);if(i<0)throw new StudioError('SPATIAL_JOINT_NOT_FOUND',jointId);this.config.joints.splice(i,1);this.workspace.editor.selected_joint_id=null;this.record('spatial.joint-removed',{joint_id:jointId});this.rebuild();return this.inspect()}
  upsertCharacter(spec){if(!spec?.id||!spec?.bodyId)throw new StudioError('SPATIAL_CHARACTER_INVALID');if(!this.config.bodies.some(b=>b.id===spec.bodyId))throw new StudioError('SPATIAL_CHARACTER_BODY_MISSING',spec.bodyId);this.config.characters??=[];const i=this.config.characters.findIndex(c=>c.id===spec.id),next={walkSpeed:4200,acceleration:18000,airControlQ:260000,jumpSpeed:5600,footstepDistance:620,leftFootZone:'foot.left',rightFootZone:'foot.right',...deep(spec)};if(i<0)this.config.characters.push(next);else this.config.characters[i]=next;this.workspace.editor.selected_character_id=next.id;this.record('spatial.character-upserted',{character_id:next.id,body_id:next.bodyId});this.rebuild();return this.inspect()}
  setCamera({positionMilli,rotationMdeg,fovMdeg,qualityTier,width,height,showContacts,showSensory,showGrid}={}){const e=this.workspace.editor;if(positionMilli)e.camera.position_milli={...e.camera.position_milli,...deep(positionMilli)};if(rotationMdeg)e.camera.rotation_mdeg={...e.camera.rotation_mdeg,...deep(rotationMdeg)};if(fovMdeg!==undefined)e.camera.fov_mdeg=q(fovMdeg);if(qualityTier)e.viewport.quality_tier=qualityTier;if(width)e.viewport.width=Math.max(160,q(width));if(height)e.viewport.height=Math.max(90,q(height));if(showContacts!==undefined)e.show_contacts=Boolean(showContacts);if(showSensory!==undefined)e.show_sensory=Boolean(showSensory);if(showGrid!==undefined)e.show_grid=Boolean(showGrid);this.syncWorkspace();this.record('spatial.camera-changed',{camera:e.camera,viewport:e.viewport});return this.inspect()}
  command(command){const next={...deep(command),id:command.id??`command:${randomUUID()}`,tick:command.tick??this.world.tick+1};const result=this.world.step([next]);this.lastSnapshot=result.snapshot;this.record('spatial.command',{command:next,event_count:result.events.length,state_root:this.lastSnapshot.stateRoot});return this.inspect()}
  step({commands=[]}={}){const normalized=commands.map(c=>({...deep(c),id:c.id??`command:${randomUUID()}`,tick:c.tick??this.world.tick+1}));const result=this.world.step(normalized);this.lastSnapshot=result.snapshot;this.record('spatial.step',{tick:this.lastSnapshot.tick,commands:normalized.length,events:result.events.length,state_root:this.lastSnapshot.stateRoot});return this.inspect()}
  run({ticks=1,commands=[]}={}){for(let i=0;i<Math.max(0,q(ticks));i++)this.step({commands});return this.inspect()}
  reset(){this.resetRuntime();return this.inspect()}
  createSnapshot(label='snapshot'){const snapshot=deep(this.lastSnapshot),entry={snapshot_id:`spatial-snapshot:${randomUUID()}`,label,tick:snapshot.tick,state_root:snapshot.stateRoot,snapshot};this.snapshots.push(entry);if(this.snapshots.length>50)this.snapshots.shift();this.record('spatial.snapshot-created',{snapshot_id:entry.snapshot_id,tick:entry.tick,state_root:entry.state_root});return entry}
  restoreSnapshot(snapshotId){const entry=this.snapshots.find(s=>s.snapshot_id===snapshotId);if(!entry)throw new StudioError('SPATIAL_SNAPSHOT_NOT_FOUND',snapshotId);this.world=SpatialEmbodimentWorld.fromSnapshot(entry.snapshot);this.lastSnapshot=this.world.snapshot();this.record('spatial.snapshot-restored',{snapshot_id:snapshotId,tick:this.lastSnapshot.tick,state_root:this.lastSnapshot.stateRoot});return this.inspect()}
  compileFrame({width=null,height=null,qualityTier=null,includeContacts=null,includeSensoryEvents=null}={}){const e=this.workspace.editor,position=e.camera.position_milli,rotation=e.camera.rotation_mdeg;const scene=spatialEmbodimentSnapshotToVSRScene(this.lastSnapshot,{cameraPosition:[position.x/1000,position.y/1000,position.z/1000],cameraRotationDeg:[rotation.x/1000,rotation.y/1000,rotation.z/1000],includeContacts:includeContacts??e.show_contacts,includeSensoryEvents:includeSensoryEvents??e.show_sensory});const framePlan=compileSpatialFrame(scene,{width:width??e.viewport.width,height:height??e.viewport.height,qualityTier:qualityTier??e.viewport.quality_tier,enableShadows:true});const verification=verifySpatialFrame(framePlan);if(!verification.ok)throw new StudioError('SPATIAL_FRAME_INVALID','',verification);this.lastProjection={scene,framePlan,verification};return this.lastProjection}
  renderReference({width=480,height=270,qualityTier='balanced'}={}){const e=this.workspace.editor,position=e.camera.position_milli,rotation=e.camera.rotation_mdeg;const result=projectSpatialEmbodiment(this.lastSnapshot,{width,height,qualityTier,cameraPosition:[position.x/1000,position.y/1000,position.z/1000],cameraRotationDeg:[rotation.x/1000,rotation.y/1000,rotation.z/1000],includeContacts:e.show_contacts,includeSensoryEvents:e.show_sensory});this.lastProjection={scene:result.scene,framePlan:result.framePlan,verification:{ok:result.frameVerified,diagnostics:[]},pixelRoot:result.pixelRoot,projectionRoot:result.projectionRoot};return result}
  causalDelta(baseRealityRoot=this.config.reality?.realityRoot??'rfe:uncommitted'){return spatialEmbodimentSnapshotToCausalDelta(this.lastSnapshot,baseRealityRoot)}
  inspect(){const selectedBody=this.config.bodies.find(b=>b.id===this.workspace.editor.selected_body_id)??null,selectedJoint=(this.config.joints??[]).find(j=>j.id===this.workspace.editor.selected_joint_id)??null;const frame=this.compileFrame();return{format:'reality-studio.spatial-session.v1.4',version:SPATIAL_STUDIO_VERSION,workspace:deep(this.workspace),validation:validateSpatialWorkspace(this.workspace),config:deep(this.config),snapshot:deep(this.lastSnapshot),selected_body:deep(selectedBody),selected_joint:deep(selectedJoint),frame:{frame_root:frame.framePlan.frameRoot,command_root:frame.framePlan.commandRoot,geometry_root:frame.framePlan.geometryRoot,material_root:frame.framePlan.materialRoot,stats:deep(frame.framePlan.stats),viewport:deep(frame.framePlan.viewport),verified:frame.verification.ok},causal_delta:this.causalDelta(),snapshots:this.snapshots.map(({snapshot,...x})=>deep(x)),event_tail:deep(this.events.slice(-80)),versions:{studio:SPATIAL_STUDIO_VERSION,rsr:SPATIAL_EMBODIMENT_VERSION,rsr_vsr:SPATIAL_EMBODIMENT_VSR_VERSION,vsr:VSR_SPATIAL_REALITY_VERSION}}}
  exportArtifacts(){const frame=this.compileFrame(),delta=this.causalDelta(),manifest=createSpatialRuntimeManifest({workspace:this.workspace,snapshot:this.lastSnapshot,framePlan:frame.framePlan,causalDelta:delta});return{spatial_workspace:deep(this.workspace),spatial_world:deep(this.config),spatial_snapshot:deep(this.lastSnapshot),spatial_scene:deep(frame.scene),spatial_frame_plan:deep(frame.framePlan),spatial_causal_delta:delta,spatial_runtime_manifest:manifest}}
}

export function createSpatialRuntimeManifest({workspace,snapshot,framePlan,causalDelta}){
  return seal({format:'reality-studio.spatial-runtime-manifest.v1.4',version:SPATIAL_STUDIO_VERSION,workspace_root:workspace.workspace_root,world_id:snapshot.worldId,source_reality_root:snapshot.reality.realityRoot??null,source_generation:snapshot.reality.generation??null,state_root:snapshot.stateRoot,body_root:snapshot.bodyRoot,contact_root:snapshot.contactRoot,character_root:snapshot.characterRoot,sensory_root:snapshot.sensoryRoot,joint_root:snapshot.jointRoot,frame_root:framePlan.frameRoot,causal_delta_root:causalDelta.deltaRoot,requirements:{rsr:`${SPATIAL_EMBODIMENT_VERSION}`,vsr:`${VSR_SPATIAL_REALITY_VERSION}`},capabilities:['spatial.body.edit','spatial.fixture.edit','spatial.character.control','spatial.joint.edit','spatial.simulate','spatial.audio-events','spatial.haptic-events','spatial.vsr-project','spatial.rfe-causal-delta']},'manifest_root');
}
