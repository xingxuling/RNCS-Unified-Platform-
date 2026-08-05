import {assertProgram,createSnapshot,normalizeProgram,verifySnapshot} from './contracts.mjs';
import {BehaviorError,clamp,clone,createPrng,deepGet,deepSet,rootHash,seal,stableId} from './canonical.mjs';
import {evalCondition,evalValue} from './expression.mjs';
import {DeterministicEventBus} from './event-bus.mjs';
import {AuthorityResolver} from './authority.mjs';
import {initializeMachines,tickStateMachine,transitionStateMachine} from './state-machine.mjs';
import {initializeTrees,tickBehaviorTree} from './behavior-tree.mjs';
import {applyRules} from './rules.mjs';
import {RealityScheduler} from './reality-scheduler.mjs';

function initialEntity(e){return{entity_id:e.entity_id,prefab_id:e.prefab_id??null,tags:[...(e.tags??[])],active:e.active!==false,alive:e.alive!==false,variables:clone(e.variables??{}),components:clone(e.components??{}),created_tick:0};}
function initialState(program){const entities={};for(const e of program.entities??[])entities[e.entity_id]=initialEntity(e);return{tick:0,time:0,globals:clone(program.globals??{}),entities,machines:initializeMachines(program),trees:initializeTrees(program),rule_memory:{},input:{},previous_input:{},events_processed:0,command_log:[],input_log:[],proposals:[],diagnostics:[],hot_reload_count:0};}
function splitTarget(target,ctx){
  if(target.startsWith('globals.'))return{root:ctx.state.globals,path:target.slice(8),trace:target};
  if(target.startsWith('self.')){const e=ctx.state.entities[ctx.entityId];return{root:e?.variables,path:target.slice(5),trace:`entity:${ctx.entityId}.${target.slice(5)}`};}
  if(target.startsWith('entity:')){const rest=target.slice(7),dot=rest.indexOf('.'),id=dot<0?rest:rest.slice(0,dot),path=dot<0?'':rest.slice(dot+1);return{root:ctx.state.entities[id]?.variables,path,trace:`entity:${id}.${path}`};}
  if(target.startsWith('component:')){const rest=target.slice(10),dot=rest.indexOf('.'),id=dot<0?ctx.entityId:rest.slice(0,dot),path=dot<0?rest:rest.slice(dot+1);return{root:ctx.state.entities[id]?.components,path,trace:`component:${id}.${path}`};}
  return{root:ctx.state.globals,path:target,trace:`globals.${target}`};
}
export class BehaviorRuntime{
  constructor(program,{actor=null,maxEventsPerTick=1000,providers={}}={}){
    this.program=assertProgram(program?.program_root?program:normalizeProgram(program));this.state=initialState(this.program);this.bus=new DeterministicEventBus();this.prng=createPrng(this.program.seed);this.authority=new AuthorityResolver(this.program);this.actor=actor??{subject_id:'subject:runtime',roles:['runtime'],scopes:['gameplay.*','behavior.*']};this.maxEventsPerTick=maxEventsPerTick;this.providers=new Map(Object.entries(providers));this.traceEntries=[];this.breakpoints=new Set();this.paused=false;this.changedPaths=new Set();this.lastRoot=this.stateRoot();this.initialProgram=clone(this.program);
    for(const m of this.program.state_machines??[]){const def=m.states.find(x=>x.state_id===m.initial_state);this.executeActions(def?.on_enter??[],this.context(m.entity_id,null));}
  }
  context(entityId,event){return{runtime:this,state:this.state,entityId,event,random:()=>this.prng.next()};}
  tickScheduled(input={}, {taskId='behavior.tick',authority='simulation',evidenceKind='behavior.state-root'}={}){
    const scheduler=new RealityScheduler({authorityLevel:authority,snapshot:()=>this.snapshot(),restore:snapshot=>this.restore(snapshot),stateRoot:()=>this.stateRoot()});
    scheduler.registerTask({task_id:taskId,system_id:'behavior-runtime.tick',reads:['behavior.input','behavior.program'],writes:['behavior.state','behavior.trace'],authority,budget:{max_operations:1},rollback:'snapshot',evidence:{policy:'required',required:[evidenceKind]}},({context})=>{
      const result=this.tick(context.input??{});
      return{operations:1,reads:['behavior.input','behavior.program'],writes:['behavior.state','behavior.trace'],evidence:[{kind:evidenceKind,root:result.root}],result};
    });
    return scheduler.run({tick:this.state.tick+1,context:{input}});
  }
  stateRoot(){return rootHash({program_root:this.program.program_root,state:this.state,prng_state:this.prng.state,bus:this.bus.snapshot()});}
  trace(type,payload={}){const entry={sequence:this.traceEntries.length+1,tick:this.state.tick,time:this.state.time,type,...clone(payload)};this.traceEntries.push(entry);if(this.breakpoints.has(type)){this.paused=true;entry.breakpoint=true;}return entry;}
  addBreakpoint(type){this.breakpoints.add(type);}removeBreakpoint(type){this.breakpoints.delete(type);}resume(){this.paused=false;}
  getValue(ref,ctx){return evalValue(ref,ctx);}setTarget(target,value,ctx){const s=splitTarget(target,ctx);if(!s.root)throw new BehaviorError('TARGET_ENTITY_MISSING',target);deepSet(s.root,s.path,value);this.changedPaths.add(s.trace);return value;}
  executeActions(actions,ctx){for(const action of actions??[]){if(this.paused)break;this.executeAction(action,ctx);}}
  executeAction(action,ctx){
    if(!action||typeof action!=='object')return;const type=action.type;
    if(type==='set'){this.setTarget(action.target,evalValue(action.value,ctx),ctx);return;}
    if(type==='add'){const s=splitTarget(action.target,ctx),old=Number(deepGet(s.root,s.path)??0),value=old+Number(evalValue(action.value,ctx)??0);deepSet(s.root,s.path,value);this.changedPaths.add(s.trace);return;}
    if(type==='multiply'){const s=splitTarget(action.target,ctx),old=Number(deepGet(s.root,s.path)??0),value=old*Number(evalValue(action.value,ctx)??1);deepSet(s.root,s.path,value);this.changedPaths.add(s.trace);return;}
    if(type==='clamp'){const s=splitTarget(action.target,ctx),old=Number(deepGet(s.root,s.path)??0),value=clamp(old,Number(evalValue(action.min,ctx)),Number(evalValue(action.max,ctx)));deepSet(s.root,s.path,value);this.changedPaths.add(s.trace);return;}
    if(type==='emit'){this.bus.emit(action.event,evalValue(action.payload??{},ctx),{phase:action.phase,priority:action.priority,source:ctx.entityId??'behavior',target:action.target??null});return;}
    if(type==='schedule'){this.bus.schedule(this.state.tick+Number(evalValue(action.delay_ticks??1,ctx)),action.event,evalValue(action.payload??{},ctx),{phase:action.phase,source:ctx.entityId??'behavior'});return;}
    if(type==='transition'){transitionStateMachine(this,action.machine_id,action.target,{event:ctx.event,reason:'action'});return;}
    if(type==='if'){this.executeActions(evalCondition(action.condition,ctx)?action.then:action.else,ctx);return;}
    if(type==='destroy'){const id=String(evalValue(action.entity_id??ctx.entityId,ctx));if(this.state.entities[id]){this.state.entities[id].alive=false;this.state.entities[id].active=false;this.bus.emit('entity.destroyed',{entity_id:id},{phase:'post',source:ctx.entityId??'behavior'});}return;}
    if(type==='spawn'){this.spawn(action.prefab_id,evalValue(action.overrides??{},ctx));return;}
    if(type==='move_toward'){
      const id=String(evalValue(action.entity_id??ctx.entityId,ctx)),targetId=String(evalValue(action.target_entity_id,ctx)),e=this.state.entities[id]?.variables,t=this.state.entities[targetId]?.variables;if(!e||!t)return;const dx=Number(t.x??0)-Number(e.x??0),dy=Number(t.y??0)-Number(e.y??0),d=Math.hypot(dx,dy)||1,s=Number(evalValue(action.speed,ctx)??1);e.x=Number(e.x??0)+dx/d*s;e.y=Number(e.y??0)+dy/d*s;this.changedPaths.add(`entity:${id}.position`);return;
    }
    if(type==='damage'){const id=String(evalValue(action.entity_id,ctx)),amount=Number(evalValue(action.amount,ctx)??0),e=this.state.entities[id];if(!e)return;e.variables.health=Math.max(0,Number(e.variables.health??0)-amount);this.bus.emit('entity.damaged',{entity_id:id,amount,health:e.variables.health,source_entity_id:ctx.entityId},{phase:'post',source:ctx.entityId??'behavior',target:id});if(e.variables.health<=0)this.bus.emit('entity.health.depleted',{entity_id:id},{phase:'post',source:ctx.entityId??'behavior',target:id});return;}
    if(type==='call'){this.callCapability(action.capability_id,evalValue(action.inputs??{},ctx),ctx);return;}
    if(type==='trace'){this.trace(action.name??'behavior.trace',{entity_id:ctx.entityId,data:evalValue(action.data??{},ctx)});return;}
    if(type==='stop'){this.paused=true;this.trace('runtime.paused',{reason:action.reason??'action'});return;}
    throw new BehaviorError('ACTION_UNSUPPORTED',type);
  }
  callCapability(capabilityId,inputs,ctx){
    const decision=this.authority.decide(capabilityId,this.actor,{tick:this.state.tick,entity_id:ctx.entityId});
    this.trace('capability.decision',{capability_id:capabilityId,decision:decision.decision,reason:decision.reason});
    if(decision.decision==='deny'){this.state.diagnostics.push({tick:this.state.tick,code:'CAPABILITY_DENIED',capability_id:capabilityId,reason:decision.reason});return{status:'denied'};}
    if(decision.decision==='require_approval'){const proposal=this.authority.proposal(capabilityId,this.actor,inputs,decision);this.state.proposals.push(proposal);this.bus.emit('authority.proposal',{proposal_root:proposal.request_root,capability_id:capabilityId},{phase:'evidence'});return{status:'proposed',proposal};}
    const provider=this.providers.get(capabilityId);let result;
    if(provider)result=provider({runtime:this,inputs:clone(inputs),context:ctx});else result={accepted:true,inputs};
    this.state.command_log.push({tick:this.state.tick,capability_id:capabilityId,inputs:clone(inputs),result:clone(result)});this.bus.emit('capability.executed',{capability_id:capabilityId,result},{phase:'post',source:ctx.entityId??'behavior'});return{status:'executed',result};
  }
  spawn(prefabId,overrides={}){const p=this.program.prefabs.find(x=>x.prefab_id===prefabId);if(!p)throw new BehaviorError('PREFAB_UNKNOWN',prefabId);const id=overrides.entity_id??stableId('entity',{prefabId,tick:this.state.tick,seq:Object.keys(this.state.entities).length});const e=initialEntity({...p.entity,entity_id:id});Object.assign(e.variables,clone(overrides.variables??{}));this.state.entities[id]=e;this.bus.emit('entity.spawned',{entity_id:id,prefab_id:prefabId},{phase:'post'});return e;}
  processEvent(event){
    this.state.events_processed++;this.trace('event.processed',{event_id:event.event_id,event_type:event.type,source:event.source,target:event.target});applyRules(this,event);
  }
  tick(input={}){
    if(this.paused)return{paused:true,tick:this.state.tick,root:this.stateRoot()};
    this.changedPaths.clear();this.state.previous_input=clone(this.state.input);this.state.input=clone(input);this.state.tick++;this.state.time=this.state.tick/this.program.tick_rate;this.state.input_log.push({tick:this.state.tick,input:clone(input)});this.bus.activateScheduled(this.state.tick);
    this.bus.emit('input',{...clone(input)},{phase:'input',source:'host'});this.bus.emit('tick',{tick:this.state.tick,dt:1/this.program.tick_rate},{phase:'simulation',source:'scheduler'});
    for(const m of this.program.state_machines??[])tickStateMachine(this,m.machine_id,{type:'tick',payload:{tick:this.state.tick}});
    for(const t of this.program.behavior_trees??[])tickBehaviorTree(this,t.tree_id,{type:'tick',payload:{tick:this.state.tick}});
    let processed=0;while(true){const events=this.bus.drain();if(!events.length)break;for(const e of events){this.processEvent(e);if(++processed>this.maxEventsPerTick)throw new BehaviorError('EVENT_LIMIT_EXCEEDED',String(this.maxEventsPerTick));}}
    const root=this.stateRoot();this.trace('tick.committed',{root,changed_paths:[...this.changedPaths].sort()});this.lastRoot=root;return{paused:false,tick:this.state.tick,time:this.state.time,root,events:processed,changed_paths:[...this.changedPaths]};
  }
  run(ticks,inputProvider=()=>({})){const results=[];for(let i=0;i<ticks&&!this.paused;i++)results.push(this.tick(inputProvider(this.state.tick+1,this)));return results;}
  snapshot(){return createSnapshot({program_root:this.program.program_root,tick:this.state.tick,state:clone(this.state),prng_state:this.prng.state,bus:this.bus.snapshot(),trace_length:this.traceEntries.length});}
  restore(snapshot){if(!verifySnapshot(snapshot))throw new BehaviorError('SNAPSHOT_INVALID');if(snapshot.program_root!==this.program.program_root)throw new BehaviorError('SNAPSHOT_PROGRAM_MISMATCH');this.state=clone(snapshot.state);this.prng.state=snapshot.prng_state;this.bus.restore(snapshot.bus);this.traceEntries=this.traceEntries.slice(0,snapshot.trace_length??0);this.lastRoot=this.stateRoot();return this.lastRoot;}
  hotReload(nextProgram){
    const p=assertProgram(nextProgram?.program_root?nextProgram:normalizeProgram(nextProgram)),old=this.program;const preserved={entities:0,machines:0};
    const nextState=initialState(p);for(const[id,e]of Object.entries(nextState.entities)){if(this.state.entities[id]){e.variables={...e.variables,...clone(this.state.entities[id].variables)};e.components={...e.components,...clone(this.state.entities[id].components)};e.alive=this.state.entities[id].alive;e.active=this.state.entities[id].active;preserved.entities++;}}
    for(const[id,m]of Object.entries(nextState.machines)){const oldM=this.state.machines[id],def=p.state_machines.find(x=>x.machine_id===id);if(oldM&&def?.states.some(s=>s.state_id===oldM.state)){nextState.machines[id]=clone(oldM);preserved.machines++;}}
    nextState.tick=this.state.tick;nextState.time=this.state.time;nextState.globals={...nextState.globals,...clone(this.state.globals)};nextState.input=clone(this.state.input);nextState.previous_input=clone(this.state.previous_input);nextState.input_log=clone(this.state.input_log);nextState.command_log=clone(this.state.command_log);nextState.proposals=clone(this.state.proposals);nextState.hot_reload_count=this.state.hot_reload_count+1;
    this.program=p;this.state=nextState;this.authority=new AuthorityResolver(p);this.trace('program.hot_reload',{from_root:old.program_root,to_root:p.program_root,preserved});return{program_root:p.program_root,preserved};
  }
  exportTrace(){return seal({format:'reality-behavior.trace.v0.1',version:'0.1.0',program_root:this.program.program_root,state_root:this.stateRoot(),entries:clone(this.traceEntries)},'trace_root');}
  causalDelta(baseRoot='0'.repeat(64)){return seal({format:'rfe.behavior-causal-delta.v0.1',version:'0.1.0',delta_id:stableId('behavior-delta',{program:this.program.program_root,tick:this.state.tick,state:this.stateRoot()}),program_root:this.program.program_root,base_generation_root:baseRoot,tick:this.state.tick,state_root:this.stateRoot(),changed_paths:[...new Set(this.traceEntries.flatMap(x=>x.changed_paths??[]))].sort(),events:this.traceEntries.filter(x=>['rule.fired','machine.transition','capability.decision','program.hot_reload'].includes(x.type)),authority_proposals:clone(this.state.proposals),status:'candidate'},'delta_root');}
}
export function replayProgram(program,inputLog,{providers={}}={}){const r=new BehaviorRuntime(program,{providers});for(const row of inputLog)r.tick(row.input);return r;}
