import {BehaviorError,clone,rootHash,seal,stableId,verifySeal} from './canonical.mjs';

export const FORMATS={
 program:'reality-behavior.program.v0.1',snapshot:'reality-behavior.snapshot.v0.1',trace:'reality-behavior.trace.v0.1',
 workspace:'reality-behavior.workspace.v0.1',delta:'rfe.behavior-causal-delta.v0.1',studio:'reality-studio.behavior-import.v0.1'
};
const arr=v=>Array.isArray(v)?v:[];
const uniq=(items,key)=>{const seen=new Set(),dups=[];for(const x of items){const id=x?.[key];if(!id)continue;if(seen.has(id))dups.push(id);seen.add(id);}return dups;};
export function normalizeProgram(input={}){
  const identity={program_id:input.identity?.program_id??stableId('behavior-program',{title:input.identity?.title??'未命名行为程序'}),title:input.identity?.title??'未命名行为程序',description:input.identity?.description??'',version:input.identity?.version??'0.1.0'};
  const p={
    format:FORMATS.program,version:'0.1.0',identity,seed:String(input.seed??identity.program_id),tick_rate:Number(input.tick_rate??60),
    input_actions:arr(input.input_actions),globals:clone(input.globals??{}),entities:arr(input.entities),prefabs:arr(input.prefabs),
    state_machines:arr(input.state_machines),behavior_trees:arr(input.behavior_trees),rules:arr(input.rules),capabilities:arr(input.capabilities),
    authority:clone(input.authority??{default_effect:'deny',policies:[]}),systems:arr(input.systems),metadata:clone(input.metadata??{})
  };
  return seal(p,'program_root');
}
export function validateProgram(program){
  const errors=[],warnings=[];const need=(c,code,path)=>{if(!c)errors.push({code,path});};
  need(program?.format===FORMATS.program,'FORMAT_INVALID','format');need(program?.version==='0.1.0','VERSION_INVALID','version');
  need(Boolean(program?.identity?.program_id),'PROGRAM_ID_REQUIRED','identity.program_id');need(Number.isInteger(program?.tick_rate)&&program.tick_rate>0&&program.tick_rate<=1000,'TICK_RATE_INVALID','tick_rate');
  for(const [name,key] of [['entities','entity_id'],['prefabs','prefab_id'],['state_machines','machine_id'],['behavior_trees','tree_id'],['rules','rule_id'],['capabilities','capability_id']]){
    need(Array.isArray(program?.[name]),`${name.toUpperCase()}_ARRAY_REQUIRED`,name);for(const d of uniq(arr(program?.[name]),key))errors.push({code:'DUPLICATE_ID',path:name,detail:d});
  }
  const entityIds=new Set(arr(program?.entities).map(x=>x.entity_id));const machineIds=new Set(arr(program?.state_machines).map(x=>x.machine_id));const treeIds=new Set(arr(program?.behavior_trees).map(x=>x.tree_id));const capIds=new Set(arr(program?.capabilities).map(x=>x.capability_id));
  for(const e of arr(program?.entities)){need(Boolean(e.entity_id),'ENTITY_ID_REQUIRED','entities');if(e.machine_id&&!machineIds.has(e.machine_id))errors.push({code:'MACHINE_UNKNOWN',path:e.entity_id,detail:e.machine_id});if(e.tree_id&&!treeIds.has(e.tree_id))errors.push({code:'TREE_UNKNOWN',path:e.entity_id,detail:e.tree_id});}
  for(const m of arr(program?.state_machines)){need(entityIds.has(m.entity_id),'MACHINE_ENTITY_UNKNOWN',m.machine_id);need(Boolean(m.initial_state),'MACHINE_INITIAL_REQUIRED',m.machine_id);const states=new Set(arr(m.states).map(x=>x.state_id));need(states.has(m.initial_state),'MACHINE_INITIAL_UNKNOWN',m.machine_id);for(const s of arr(m.states))for(const t of arr(s.transitions))if(!states.has(t.target))errors.push({code:'TRANSITION_TARGET_UNKNOWN',path:`${m.machine_id}.${s.state_id}`,detail:t.target});}
  for(const t of arr(program?.behavior_trees)){need(entityIds.has(t.entity_id),'TREE_ENTITY_UNKNOWN',t.tree_id);need(Boolean(t.root),'TREE_ROOT_REQUIRED',t.tree_id);}
  const validateActions=(actions,path)=>{for(const a of arr(actions)){if(a.type==='call'&&!capIds.has(a.capability_id))errors.push({code:'CAPABILITY_UNKNOWN',path,detail:a.capability_id});}};
  for(const r of arr(program?.rules)){need(Boolean(r.event),'RULE_EVENT_REQUIRED',r.rule_id);validateActions(r.actions,`rules.${r.rule_id}`);}
  for(const m of arr(program?.state_machines))for(const s of arr(m.states)){validateActions(s.on_enter,`${m.machine_id}.${s.state_id}.on_enter`);validateActions(s.on_tick,`${m.machine_id}.${s.state_id}.on_tick`);validateActions(s.on_exit,`${m.machine_id}.${s.state_id}.on_exit`);for(const t of arr(s.transitions))validateActions(t.actions,`${m.machine_id}.${s.state_id}.transition`);}
  if(!verifySeal(program,'program_root'))errors.push({code:'PROGRAM_ROOT_MISMATCH',path:'program_root'});
  if(program?.authority?.default_effect!=='deny')warnings.push({code:'AUTHORITY_DEFAULT_NOT_DENY',path:'authority.default_effect'});
  return{valid:errors.length===0,errors,warnings,counts:{entities:entityIds.size,machines:machineIds.size,trees:treeIds.size,rules:arr(program?.rules).length,capabilities:capIds.size}};
}
export function assertProgram(program){const v=validateProgram(program);if(!v.valid)throw new BehaviorError('PROGRAM_INVALID',JSON.stringify(v.errors));return program;}
export function createSnapshot(payload){return seal({format:FORMATS.snapshot,version:'0.1.0',...clone(payload)},'snapshot_root');}
export function verifySnapshot(s){return s?.format===FORMATS.snapshot&&verifySeal(s,'snapshot_root');}
