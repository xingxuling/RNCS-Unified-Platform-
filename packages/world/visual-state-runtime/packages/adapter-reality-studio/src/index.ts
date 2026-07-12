import { evaluateAt, prepareDocument, VSRRuntimeSession, type VSREvaluateResult } from '../../core/src/index.js';
import { compileHybridRenderPlan, verifyHybridRenderPlan, type VSRHybridRenderPlan } from '../../backend-hybrid/src/index.js';
import { cryptographicHash, deepClone, type VSRDocument, type VSRNode, type VSRTrack, type VSRValue } from '../../spec/src/index.js';

export const VSR_REALITY_STUDIO_ADAPTER_VERSION = '0.1.0-alpha.12';
export type RealityStudioObjectType = 'player'|'platform'|'obstacle'|'core'|'exit'|'hazard'|'wall'|'checkpoint'|'movingPlatform'|'enemy'|'dynamicBox'|string;

export interface RealityStudioComponent {
  uid?: string;
  id: string;
  enabled: boolean;
  lifecycle: 'start'|'tick'|'collect'|'death'|'checkpoint'|'win'|'signal'|string;
  signal?: string;
  subject?: string;
  condition?: string;
  action: string;
  target?: string;
  value?: string;
  everyTicks?: number;
  once?: boolean;
  breakpoint?: boolean;
}

export interface RealityStudioObject {
  uid?: string;
  id: string;
  type: RealityStudioObjectType;
  parentId?: string|null;
  role?: string;
  tags?: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  layer?: number;
  color?: string;
  assetId?: string;
  text?: string;
  locked?: boolean;
  restitution?: number;
  friction?: number;
  motion?: { axis?: string; distance?: number; speed?: number };
  components?: RealityStudioComponent[];
  prefabUid?: string|null;
  prefabRevision?: number;
}

export interface RealityStudioPhysics { stepHz:number; gravityY:number; moveSpeed:number; jumpSpeed:number; maxSeconds:number; solverIterations?:number }
export interface RealityStudioScene {
  uid?: string;
  id: string;
  title: string;
  description?: string;
  background: string;
  blackboard?: Record<string, VSRValue>;
  physics: RealityStudioPhysics;
  camera?: { mode?:string; zoom?:number; smoothing?:number };
  autoNext?: boolean;
  objects: RealityStudioObject[];
  logic?: unknown[];
}

export interface RealityStudioProject {
  format: 'reality-studio.project.v0.1'|'reality-studio.project.v0.3'|'reality-studio.project.v0.4';
  version: string;
  projectUid?: string;
  projectId: string;
  title: string;
  description?: string;
  canvas: { width:number; height:number; background?:string; grid?:number };
  physics: RealityStudioPhysics;
  objects: RealityStudioObject[];
  activeSceneId?: string;
  assets?: unknown[];
  prefabs?: unknown[];
  scenes?: RealityStudioScene[];
  metadata?: { controls?:string; [key:string]:unknown };
}

export interface RealityStudioBridgeOptions { includeLabels?:boolean; includeHud?:boolean; activeSceneId?:string }
export interface RealityStudioVSRBridgeResult {
  format:'vsr.reality-studio-bridge.v0.1'; adapterVersion:string; sourceFormat:RealityStudioProject['format']; projectId:string;
  activeSceneId:string; projectRoot:string; sceneRoot:string; componentContractHash:string; document:VSRDocument;
  documentRoot:string; sourceDisplayHash:string; hybridPlan:VSRHybridRenderPlan; verification:{ok:boolean;diagnostics:string[]}; bridgeRoot:string;
}
export interface RealityStudioObjectPatch { objectId:string; objectUid?:string; set:{x?:number;y?:number;width?:number;height?:number;rotation?:number;opacity?:number;layer?:number;color?:string;locked?:boolean} }
export interface RealityStudioVSRPatch { format:'vsr.reality-studio-patch.v0.1'; adapterVersion:string; projectId:string; sceneId:string; baseProjectRoot:string; baseSceneRoot?:string; changes:RealityStudioObjectPatch[]; patchRoot:string }

interface SelectedScene extends RealityStudioScene {}
function selectedScene(project:RealityStudioProject, requested?:string):SelectedScene {
  if(project.format==='reality-studio.project.v0.1') {
    if(!project.physics || !project.objects) throw new Error('Reality Studio v0.1 project requires physics and objects.');
    return { id:'default', title:project.title, background:project.canvas.background??'#07111f', physics:project.physics, objects:project.objects, description:project.description, blackboard:{} };
  }
  const sceneId=requested??project.activeSceneId??project.scenes?.[0]?.id;
  const scene=project.scenes?.find(entry=>entry.id===sceneId);
  if(!scene) throw new Error(`Reality Studio 场景不存在：${sceneId}`);
  return scene;
}

function hierarchyDiagnostics(scene:SelectedScene):string[] {
  const diagnostics:string[]=[];
  const byId=new Map(scene.objects.map(object=>[object.id,object]));
  for(const object of scene.objects){
    if(object.parentId!==null&&object.parentId!==undefined&&!byId.has(object.parentId)) diagnostics.push(`parent-missing:${scene.id}:${object.id}:${object.parentId}`);
    if(object.parentId===object.id) diagnostics.push(`parent-self:${scene.id}:${object.id}`);
    const seen=new Set<string>([object.id]); let cursor=object.parentId??null;
    while(cursor){ if(seen.has(cursor)){diagnostics.push(`parent-cycle:${scene.id}:${object.id}`);break;} seen.add(cursor); cursor=byId.get(cursor)?.parentId??null; }
  }
  return diagnostics;
}

export function validateRealityStudioProject(project:RealityStudioProject):{ok:boolean;diagnostics:string[]} {
  const diagnostics:string[]=[];
  if(!['reality-studio.project.v0.1','reality-studio.project.v0.3','reality-studio.project.v0.4'].includes(project.format)) diagnostics.push('unsupported-format');
  if(!project.projectId) diagnostics.push('project-id-required');
  if(!(project.canvas?.width>0&&project.canvas?.height>0)) diagnostics.push('invalid-canvas');
  const scenes=project.format==='reality-studio.project.v0.1'?[selectedScene(project)]:(project.scenes??[]);
  if(project.format!=='reality-studio.project.v0.1'&&!(project.scenes??[]).some(scene=>scene.id===project.activeSceneId)) diagnostics.push('active-scene-missing');
  for(const scene of scenes){
    if(!Number.isInteger(scene.physics?.stepHz)||scene.physics.stepHz<15||scene.physics.stepHz>240) diagnostics.push(`invalid-step-hz:${scene.id}`);
    const ids=new Set<string>(),uids=new Set<string>(); let players=0,exits=0,solids=0;
    for(const object of scene.objects??[]){
      if(ids.has(object.id)) diagnostics.push(`duplicate-object:${scene.id}:${object.id}`); ids.add(object.id);
      if(project.format==='reality-studio.project.v0.4'){
        if(!object.uid) diagnostics.push(`uid-required:${scene.id}:${object.id}`);
        else if(uids.has(object.uid)) diagnostics.push(`duplicate-uid:${scene.id}:${object.uid}`); else uids.add(object.uid);
      }
      if(!(object.width>0&&object.height>0)) diagnostics.push(`invalid-size:${scene.id}:${object.id}`);
      if(object.type==='player') players++; if(object.type==='exit') exits++; if(['platform','obstacle','wall','movingPlatform'].includes(object.type)) solids++;
      const componentIds=new Set<string>(),componentUids=new Set<string>();
      for(const component of object.components??[]){
        if(!component.id) diagnostics.push(`component-id-required:${object.id}`);
        else if(componentIds.has(component.id)) diagnostics.push(`duplicate-component:${object.id}:${component.id}`); else componentIds.add(component.id);
        if(project.format==='reality-studio.project.v0.4'&&component.uid){ if(componentUids.has(component.uid))diagnostics.push(`duplicate-component-uid:${object.id}:${component.uid}`); componentUids.add(component.uid); }
        if(!component.action) diagnostics.push(`component-action-required:${object.id}:${component.id}`);
      }
    }
    diagnostics.push(...hierarchyDiagnostics(scene));
    if(players!==1) diagnostics.push(`player-count:${scene.id}:${players}`);
    if(exits<1) diagnostics.push(`exit-required:${scene.id}`);
    if(solids<1) diagnostics.push(`solid-required:${scene.id}`);
  }
  return {ok:diagnostics.length===0,diagnostics};
}

function parseNumbers(value:string|undefined):number[]{return String(value??'').split(',').map(Number).filter(Number.isFinite);}
function componentTracks(object:RealityStudioObject):VSRTrack[]{
  const tracks:VSRTrack[]=[];
  for(const component of object.components??[]){
    if(!component.enabled||component.lifecycle!=='tick'||component.once||!['*','',undefined].includes(component.subject)||!['true','tick >= 0','score >= 0'].includes(String(component.condition??'true').trim())) continue;
    const id=`component:${component.uid??component.id}`;
    if(component.action==='rotate'){
      const rate=Number(component.value??0); if(Number.isFinite(rate)) tracks.push({id,property:'transform.rotation',mode:'expression',expression:`${Number(object.rotation??0)} + time * ${rate}`});
    }else if(component.action==='pulse-opacity'){
      const [min=0.3,max=1,period=1]=parseNumbers(component.value); tracks.push({id,property:'appearance.opacity',mode:'expression',expression:`${min} + (${max}-${min}) * (sin(time * 6.283185307 / ${Math.max(.001,period)}) + 1) / 2`});
    }else if(component.action==='bob'){
      const values=String(component.value??'y,8,1').split(','); const axis=values[0]==='x'?'X':'Y'; const distance=Number(values[1]??8); const period=Math.max(.001,Number(values[2]??1));
      tracks.push({id,property:`transform.translate${axis}`,mode:'expression',expression:`sin(time * 6.283185307 / ${period}) * ${Number.isFinite(distance)?distance:8}`});
    }
  }
  return tracks;
}

function visualNode(object:RealityStudioObject):VSRNode {
  const base={
    id:`object:${object.id}`, name:object.id, parentId:object.parentId?`object:${object.parentId}`:undefined,
    layout:{x:object.x,y:object.y,width:object.width,height:object.height}, transform:{rotation:Number(object.rotation??0)},
    appearance:{fill:{type:'solid' as const,color:object.color??'#64748b'},opacity:Number(object.opacity??1)}, zIndex:Number(object.layer??0),
    tracks:componentTracks(object), tags:['reality-studio-object',`type:${object.type}`,`role:${object.role??object.type}`,...(object.tags??[]),object.locked?'locked':'editable'],
    data:{sourceId:object.id,sourceUid:object.uid??'',sourceType:object.type,sourceRole:object.role??object.type,locked:Boolean(object.locked),componentCount:(object.components??[]).length},
  };
  if(object.type==='core') return {...base,type:'ellipse'};
  return {...base,type:'rect',content:{cornerRadius:object.type==='exit'?Math.min(12,object.width/4):object.type==='checkpoint'?8:object.type==='player'?6:object.type==='hazard'?4:0}};
}

export function realityStudioProjectToVSR(project:RealityStudioProject,options:RealityStudioBridgeOptions={}):VSRDocument {
  const validation=validateRealityStudioProject(project); if(!validation.ok) throw new Error(`Reality Studio 项目无效：${validation.diagnostics.join('；')}`);
  const scene=selectedScene(project,options.activeSceneId),nodes:VSRNode[]=[...scene.objects.map(visualNode)];
  if(options.includeLabels??true){
    for(const object of scene.objects) nodes.push({
      id:`label:${object.id}`,type:'text',parentId:`object:${object.id}`,layout:{x:0,y:-16,width:Math.max(80,object.width),height:14},
      appearance:{fill:{type:'solid',color:'#e2e8f0'}},content:{text:object.text||object.id,fontFamily:'VSR UI',fontSize:10,wrap:'none'},tags:['reality-studio-label'],
    });
  }
  if(options.includeHud??true){
    nodes.push({id:'studio:title',type:'text',layout:{x:16,y:12,width:project.canvas.width-32,height:28},appearance:{fill:{type:'solid',color:'#ffffff'}},content:{text:`${project.title} · ${scene.title}`,fontFamily:'VSR UI',fontSize:20,wrap:'none'},tags:['reality-studio-hud']});
    nodes.push({id:'studio:controls',type:'text',layout:{x:16,y:project.canvas.height-30,width:project.canvas.width-32,height:18},appearance:{fill:{type:'solid',color:'#94a3b8'}},content:{text:String(project.metadata?.controls??''),fontFamily:'VSR UI',fontSize:12,wrap:'none'},tags:['reality-studio-hud']});
  }
  const components=scene.objects.flatMap(object=>(object.components??[]).map(component=>({objectId:object.id,objectUid:object.uid??'',...component})));
  const blackboard=deepClone(scene.blackboard??{});
  return {
    specVersion:'0.1',runtimeTarget:'vsr@0.1.0-alpha.12',
    metadata:{id:`reality-studio:${project.projectId}:${scene.id}`,title:project.title,duration:scene.physics.maxSeconds,defaultFps:scene.physics.stepHz,seed:17,description:scene.description??project.description,authoringTool:`Reality Studio ${project.version} + VSR ${VSR_REALITY_STUDIO_ADAPTER_VERSION}`},
    canvas:{width:project.canvas.width,height:project.canvas.height,background:{type:'solid',color:scene.background},layoutMode:'fixed'},
    variables:{projectId:project.projectId,projectUid:project.projectUid??'',sceneId:scene.id,sceneUid:scene.uid??'',stepHz:scene.physics.stepHz,gravityY:scene.physics.gravityY,studio:{blackboard,lastSignal:null,signalCount:0}},
    nodes,
    extensions:{
      'reality-studio:project-root':cryptographicHash(project),'reality-studio:scene-root':cryptographicHash(scene),'reality-studio:component-contract':components,
      'reality-studio:component-contract-hash':cryptographicHash(components),'reality-studio:source-format':project.format,'reality-studio:blackboard':blackboard,
      'reality-studio:identity-contract':project.format==='reality-studio.project.v0.4'?'uid-parent-role-tags-v0.4':'scene-id-v0.3',
    },
  };
}

export function compileRealityStudioVSRBridge(project:RealityStudioProject,options:RealityStudioBridgeOptions={}):RealityStudioVSRBridgeResult {
  const scene=selectedScene(project,options.activeSceneId),document=realityStudioProjectToVSR(project,options),prepared=prepareDocument(document),state=evaluateAt({document:prepared,time:0}).displayState,hybridPlan=compileHybridRenderPlan(state),verification=verifyHybridRenderPlan(state,hybridPlan),projectRoot=cryptographicHash(project),sceneRoot=cryptographicHash(scene),componentContractHash=String(document.extensions?.['reality-studio:component-contract-hash']??'');
  const base={format:'vsr.reality-studio-bridge.v0.1' as const,adapterVersion:VSR_REALITY_STUDIO_ADAPTER_VERSION,sourceFormat:project.format,projectId:project.projectId,activeSceneId:scene.id,projectRoot,sceneRoot,componentContractHash,document,documentRoot:cryptographicHash(document),sourceDisplayHash:state.semanticHash,hybridPlan,verification};
  return {...base,bridgeRoot:cryptographicHash({...base,document:undefined,hybridPlanHash:hybridPlan.planHash})};
}

function objectNodes(document:VSRDocument):Map<string,VSRNode>{const result=new Map<string,VSRNode>();for(const node of document.nodes){const sourceId=node.data?.sourceId;if(typeof sourceId==='string'&&node.tags?.includes('reality-studio-object'))result.set(sourceId,node);}return result;}
export function createRealityStudioPatchFromVSRDocument(project:RealityStudioProject,document:VSRDocument,activeSceneId?:string):RealityStudioVSRPatch {
  const scene=selectedScene(project,activeSceneId),nodes=objectNodes(document),changes:RealityStudioObjectPatch[]=[];
  for(const object of scene.objects){
    const node=nodes.get(object.id); if(!node) continue;
    const fill=node.appearance?.fill?.type==='solid'?node.appearance.fill.color:undefined,set:RealityStudioObjectPatch['set']={};
    const candidates:Array<[keyof RealityStudioObjectPatch['set'],unknown,unknown]>=[['x',object.x,node.layout?.x],['y',object.y,node.layout?.y],['width',object.width,node.layout?.width],['height',object.height,node.layout?.height],['rotation',object.rotation??0,node.transform?.rotation??0],['opacity',object.opacity??1,node.appearance?.opacity??1],['layer',object.layer??0,node.zIndex??0],['color',object.color??'#64748b',fill],['locked',Boolean(object.locked),node.data?.locked]];
    for(const [key,before,after] of candidates) if(after!==undefined&&cryptographicHash(before)!==cryptographicHash(after)) (set as Record<string,unknown>)[key]=after;
    if(Object.keys(set).length) changes.push({objectId:object.id,objectUid:object.uid,set});
  }
  const base={format:'vsr.reality-studio-patch.v0.1' as const,adapterVersion:VSR_REALITY_STUDIO_ADAPTER_VERSION,projectId:project.projectId,sceneId:scene.id,baseProjectRoot:cryptographicHash(project),baseSceneRoot:cryptographicHash(scene),changes};
  return {...base,patchRoot:cryptographicHash(base)};
}

export function applyRealityStudioVSRPatch(project:RealityStudioProject,patch:RealityStudioVSRPatch):RealityStudioProject {
  if(patch.projectId!==project.projectId) throw new Error('Reality Studio patch project mismatch.');
  if(patch.baseProjectRoot!==cryptographicHash(project)) throw new Error('Reality Studio patch is stale.');
  const {patchRoot,...base}=patch; if(patchRoot!==cryptographicHash(base)) throw new Error('Reality Studio patch hash mismatch.');
  const next=deepClone(project),scene=selectedScene(next,patch.sceneId); if(patch.baseSceneRoot&&patch.baseSceneRoot!==cryptographicHash(scene)) throw new Error('Reality Studio patch scene is stale.');
  for(const change of patch.changes){const object=scene.objects.find(entry=>change.objectUid?entry.uid===change.objectUid:entry.id===change.objectId);if(!object)throw new Error(`Reality Studio patch object missing: ${change.objectId}`);Object.assign(object,deepClone(change.set));}
  return next;
}

export type RealityStudioLiveEventType='scene.activated'|'object.added'|'object.updated'|'object.removed'|'blackboard.set'|'signal.emitted'|'component.triggered';
export interface RealityStudioLiveEvent {
  format:'reality-studio.live-event.v0.4'; sessionId:string; projectId:string; sequence:number; type:RealityStudioLiveEventType; sceneId:string;
  payload:Record<string,unknown>; previousEventHash?:string; eventHash?:string;
}
export interface RealityStudioLiveManifest {
  format:'vsr.reality-studio-live-manifest.v0.1'; adapterVersion:string; sessionId:string; projectId:string; sceneId:string; sequence:number;
  eventChainRoot:string; projectRoot:string; sceneRoot:string; documentRoot:string; displayHash:string; rebuildCount:number; signalCount:number; manifestRoot:string;
}

function liveEventHashInput(event:RealityStudioLiveEvent):Omit<RealityStudioLiveEvent,'eventHash'>{const {eventHash:_eventHash,...rest}=event;return rest;}
export function sealRealityStudioLiveEvent(event:RealityStudioLiveEvent,previousEventHash=''):RealityStudioLiveEvent {
  if(event.format!=='reality-studio.live-event.v0.4')throw new Error(`Unsupported Reality Studio live event: ${String(event.format)}`);
  if(event.sequence<1||!Number.isInteger(event.sequence))throw new Error('Reality Studio live event sequence must be a positive integer.');
  if(event.previousEventHash!==undefined&&event.previousEventHash!==previousEventHash)throw new Error('Reality Studio live event previous hash mismatch.');
  const sealed={...deepClone(event),previousEventHash:previousEventHash||undefined};const eventHash=cryptographicHash(liveEventHashInput(sealed));
  if(event.eventHash!==undefined&&event.eventHash!==eventHash)throw new Error('Reality Studio live event hash mismatch.');
  return {...sealed,eventHash};
}

function findSceneObject(scene:RealityStudioScene,payload:Record<string,unknown>):RealityStudioObject|undefined {const uid=typeof payload.objectUid==='string'?payload.objectUid:undefined,id=typeof payload.objectId==='string'?payload.objectId:undefined;return scene.objects.find(object=>uid?object.uid===uid:object.id===id);}

export class RealityStudioLiveVSRSession {
  private project:RealityStudioProject;
  private sceneId:string;
  private runtime:VSRRuntimeSession;
  private document:VSRDocument;
  private events:RealityStudioLiveEvent[]=[];
  private chainRoot='';
  private rebuildCount=0;
  private signalCount=0;
  readonly sessionId:string;
  constructor(project:RealityStudioProject,sessionId=`studio-live:${project.projectId}`,sceneId?:string){
    const validation=validateRealityStudioProject(project);if(!validation.ok)throw new Error(`Reality Studio 项目无效：${validation.diagnostics.join('；')}`);
    this.project=deepClone(project);this.sceneId=sceneId??project.activeSceneId??selectedScene(project).id;this.sessionId=sessionId;this.document=realityStudioProjectToVSR(this.project,{activeSceneId:this.sceneId});this.runtime=new VSRRuntimeSession(this.document,{width:this.document.canvas.width,height:this.document.canvas.height});
  }
  currentProject():RealityStudioProject{return deepClone(this.project)}
  currentDocument():VSRDocument{return deepClone(this.document)}
  eventLog():RealityStudioLiveEvent[]{return deepClone(this.events)}
  eventChainRoot():string{return this.chainRoot}
  evaluate(time=this.runtime.clock.time):VSREvaluateResult{return this.runtime.evaluate(time)}
  private rebuild():void{const time=this.runtime.clock.time;this.runtime.dispose();this.document=realityStudioProjectToVSR(this.project,{activeSceneId:this.sceneId});this.runtime=new VSRRuntimeSession(this.document,{width:this.document.canvas.width,height:this.document.canvas.height});this.runtime.clock.seek(time);this.rebuildCount++;}
  private updateStudioVariables(lastSignal?:Record<string,VSRValue>):void{const scene=selectedScene(this.project,this.sceneId);this.runtime.setVariables({studio:{blackboard:deepClone(scene.blackboard??{}),lastSignal:lastSignal??null,signalCount:this.signalCount}});}
  append(event:RealityStudioLiveEvent):RealityStudioLiveManifest {
    if(event.sessionId!==this.sessionId)throw new Error('Reality Studio live session mismatch.');
    if(event.projectId!==this.project.projectId)throw new Error('Reality Studio live project mismatch.');
    const expected=this.events.length+1;
    if(event.sequence!==expected)throw new Error(`Reality Studio live sequence mismatch: expected ${expected}, received ${event.sequence}.`);
    const sealed=sealRealityStudioLiveEvent(event,this.chainRoot),payload=sealed.payload,candidate=deepClone(this.project);
    let nextSceneId=this.sceneId,needsRebuild=false,nextSignalCount=this.signalCount,lastSignal:Record<string,VSRValue>|undefined;
    if(sealed.type==='scene.activated'){
      nextSceneId=String(payload.sceneId??sealed.sceneId);selectedScene(candidate,nextSceneId);candidate.activeSceneId=nextSceneId;needsRebuild=true;
    }else{
      const scene=selectedScene(candidate,sealed.sceneId);
      if(scene.id!==this.sceneId)throw new Error(`Reality Studio live event targets inactive scene: ${scene.id}`);
      if(sealed.type==='object.added'){
        const object=deepClone(payload.object as RealityStudioObject);
        if(!object?.id)throw new Error('object.added requires payload.object.');
        if(scene.objects.some(entry=>entry.id===object.id||Boolean(object.uid&&entry.uid===object.uid)))throw new Error(`Reality Studio object already exists: ${object.id}`);
        scene.objects.push(object);needsRebuild=true;
      }else if(sealed.type==='object.updated'){
        const object=findSceneObject(scene,payload);if(!object)throw new Error('Reality Studio live object not found.');
        const set=payload.set;if(!set||typeof set!=='object'||Array.isArray(set))throw new Error('object.updated requires payload.set.');
        Object.assign(object,deepClone(set as Partial<RealityStudioObject>));needsRebuild=true;
      }else if(sealed.type==='object.removed'){
        const object=findSceneObject(scene,payload);if(!object)throw new Error('Reality Studio live object not found.');
        if(scene.objects.some(entry=>entry.parentId===object.id))throw new Error('Reality Studio live removal would orphan child objects.');
        scene.objects=scene.objects.filter(entry=>entry!==object);needsRebuild=true;
      }else if(sealed.type==='blackboard.set'){
        const key=String(payload.key??'');if(!key)throw new Error('blackboard.set requires key.');
        scene.blackboard={...(scene.blackboard??{}),[key]:deepClone(payload.value as VSRValue)};
      }else if(sealed.type==='signal.emitted'||sealed.type==='component.triggered'){
        nextSignalCount++;
        lastSignal={type:sealed.type,signal:String(payload.signal??''),subject:String(payload.subject??''),payload:deepClone((payload.payload??{}) as Record<string,VSRValue>),sequence:sealed.sequence};
      }
    }
    const validation=validateRealityStudioProject(candidate);
    if(!validation.ok)throw new Error(`Reality Studio live event would violate project contract: ${validation.diagnostics.join('; ')}`);
    this.project=candidate;this.sceneId=nextSceneId;this.signalCount=nextSignalCount;
    if(needsRebuild)this.rebuild();else this.updateStudioVariables(lastSignal);
    this.events.push(sealed);this.chainRoot=sealed.eventHash!;
    return this.manifest();
  }
  manifest():RealityStudioLiveManifest {
    const scene=selectedScene(this.project,this.sceneId),evaluation=this.evaluate(),base={format:'vsr.reality-studio-live-manifest.v0.1' as const,adapterVersion:VSR_REALITY_STUDIO_ADAPTER_VERSION,sessionId:this.sessionId,projectId:this.project.projectId,sceneId:this.sceneId,sequence:this.events.length,eventChainRoot:this.chainRoot,projectRoot:cryptographicHash(this.project),sceneRoot:cryptographicHash(scene),documentRoot:cryptographicHash(this.document),displayHash:evaluation.displayState.semanticHash,rebuildCount:this.rebuildCount,signalCount:this.signalCount};
    return {...base,manifestRoot:cryptographicHash(base)};
  }
  dispose():void{this.runtime.dispose()}
}
