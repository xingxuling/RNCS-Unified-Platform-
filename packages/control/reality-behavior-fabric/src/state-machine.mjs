import {evalCondition} from './expression.mjs';

export function initializeMachines(program){
  const out={};for(const m of program.state_machines??[])out[m.machine_id]={machine_id:m.machine_id,entity_id:m.entity_id,state:m.initial_state,entered_tick:0,transition_count:0};return out;
}
export function machineDefinition(program,id){return(program.state_machines??[]).find(x=>x.machine_id===id);}
export function currentStateDefinition(program,machineState){return machineDefinition(program,machineState.machine_id)?.states?.find(x=>x.state_id===machineState.state);}
export function tickStateMachine(runtime,machineId,event){
  const ms=runtime.state.machines[machineId],def=machineDefinition(runtime.program,machineId);if(!ms||!def)return;
  const stateDef=def.states.find(x=>x.state_id===ms.state);if(!stateDef)return;
  const ctx=runtime.context(def.entity_id,event);
  runtime.executeActions(stateDef.on_tick??[],ctx);
  const transitions=[...(stateDef.transitions??[])].sort((a,b)=>(b.priority??0)-(a.priority??0));
  for(const t of transitions){if(evalCondition(t.condition,ctx)){transitionStateMachine(runtime,machineId,t.target,{event,actions:t.actions??[],reason:t.transition_id??'condition'});break;}}
}
export function transitionStateMachine(runtime,machineId,target,{event=null,actions=[],reason='explicit'}={}){
  const ms=runtime.state.machines[machineId],def=machineDefinition(runtime.program,machineId);if(!ms||!def)return false;
  const targetDef=def.states.find(x=>x.state_id===target);if(!targetDef)return false;if(ms.state===target)return true;
  const oldDef=def.states.find(x=>x.state_id===ms.state);const ctx=runtime.context(def.entity_id,event);
  runtime.executeActions(oldDef?.on_exit??[],ctx);runtime.executeActions(actions,ctx);
  const from=ms.state;ms.state=target;ms.entered_tick=runtime.state.tick;ms.transition_count++;
  runtime.executeActions(targetDef.on_enter??[],runtime.context(def.entity_id,event));
  runtime.trace('machine.transition',{machine_id:machineId,entity_id:def.entity_id,from,to:target,reason});
  runtime.bus.emit('machine.transition',{machine_id:machineId,entity_id:def.entity_id,from,to:target,reason},{phase:'post',source:machineId});
  return true;
}
