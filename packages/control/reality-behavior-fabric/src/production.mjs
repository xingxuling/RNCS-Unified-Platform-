import {clone,rootHash,stableId} from './canonical.mjs';
import {BehaviorRuntime} from './runtime.mjs';

const terminal=new Set(['completed','failed','cancelled']);

export class QuestRuntime {
  constructor(definitions=[], {subjectId='subject:world'}={}) {
    this.subject_id=subjectId;
    this.definitions=new Map(definitions.map(q=>[q.quest_id,clone(q)]));
    this.instances=new Map();
    this.events=[];
  }
  start(questId,{participants=[],context={}}={}) {
    const def=this.definitions.get(questId); if(!def) throw new Error(`QUEST_UNKNOWN:${questId}`);
    const id=stableId('quest-instance',{questId,participants:[...participants].sort(),sequence:this.instances.size});
    const instance={instance_id:id,quest_id:questId,status:'active',stage_index:0,participants:[...participants].sort(),context:clone(context),objectives:(def.stages?.[0]?.objectives??[]).map(o=>({...clone(o),progress:0,status:'active'})),started_sequence:this.events.length+1};
    this.instances.set(id,instance); this.#emit('quest.started',{instance_id:id,quest_id:questId}); return clone(instance);
  }
  apply(event,payload={}) {
    for(const instance of this.instances.values()) {
      if(terminal.has(instance.status)) continue;
      const def=this.definitions.get(instance.quest_id); const stage=def.stages?.[instance.stage_index]; if(!stage) continue;
      let changed=false;
      for(const objective of instance.objectives) {
        if(objective.status!=='active'||objective.event!==event) continue;
        if(objective.entity_id&&payload.entity_id!==objective.entity_id) continue;
        objective.progress=Math.min(Number(objective.target??1),objective.progress+Number(payload.amount??1));
        if(objective.progress>=Number(objective.target??1)) objective.status='completed'; changed=true;
        this.#emit('quest.objective.progressed',{instance_id:instance.instance_id,objective_id:objective.objective_id,progress:objective.progress,status:objective.status});
      }
      if(changed&&instance.objectives.every(o=>o.status==='completed')) {
        if(instance.stage_index+1<(def.stages?.length??0)) {
          instance.stage_index++; instance.objectives=(def.stages[instance.stage_index].objectives??[]).map(o=>({...clone(o),progress:0,status:'active'})); this.#emit('quest.stage.advanced',{instance_id:instance.instance_id,stage_index:instance.stage_index});
        } else {instance.status='completed'; this.#emit('quest.completed',{instance_id:instance.instance_id,quest_id:instance.quest_id});}
      }
    }
    return this.snapshot();
  }
  #emit(type,payload){this.events.push({sequence:this.events.length+1,type,...clone(payload)});}
  snapshot(){const instances=[...this.instances.values()].map(clone).sort((a,b)=>a.instance_id.localeCompare(b.instance_id));return{format:'reality-behavior.quest-snapshot.v0.9',subject_id:this.subject_id,instances,events:clone(this.events),quest_root:rootHash({subject_id:this.subject_id,instances,events:this.events})};}
  restore(snapshot){this.subject_id=snapshot.subject_id;this.instances=new Map(snapshot.instances.map(x=>[x.instance_id,clone(x)]));this.events=clone(snapshot.events??[]);return this.snapshot();}
}

export function runDeterministicReplay(program,inputs,{providers={},actor=null}={}) {
  const execute=()=>{const runtime=new BehaviorRuntime(program,{providers,actor});const roots=[];for(const input of inputs){const result=runtime.tick(input);roots.push(result.root);}return{final_root:runtime.stateRoot(),tick:runtime.state.tick,roots,trace_root:rootHash(runtime.exportTrace()),snapshot:runtime.snapshot()};};
  const first=execute(),second=execute();
  return {format:'reality-behavior.replay-receipt.v0.9',deterministic:first.final_root===second.final_root&&first.trace_root===second.trace_root,first,second,replay_root:rootHash({program_root:first.snapshot.program_root,inputs,first_root:first.final_root,second_root:second.final_root})};
}

export class CooperativeTaskRuntime {
  constructor({taskId,participants=[],requirements=[]}){this.task_id=taskId;this.participants=[...participants].sort();this.requirements=requirements.map(r=>({...clone(r),satisfied_by:[]}));this.events=[];this.status='active';}
  signal({participant_id,signal,value=true}){if(this.status!=='active')return this.snapshot();if(!this.participants.includes(participant_id))throw new Error(`TASK_PARTICIPANT_UNKNOWN:${participant_id}`);for(const r of this.requirements){if(r.signal===signal&&value&&!r.satisfied_by.includes(participant_id))r.satisfied_by.push(participant_id);r.satisfied_by.sort();}this.events.push({sequence:this.events.length+1,participant_id,signal,value});if(this.requirements.every(r=>r.satisfied_by.length>=Number(r.minimum_participants??1)))this.status='completed';return this.snapshot();}
  snapshot(){return{format:'reality-behavior.cooperative-task.v0.9',task_id:this.task_id,participants:clone(this.participants),requirements:clone(this.requirements),events:clone(this.events),status:this.status,task_root:rootHash({task_id:this.task_id,participants:this.participants,requirements:this.requirements,events:this.events,status:this.status})};}
}
