import {randomUUID} from 'node:crypto';
import {
  BehaviorRuntime,
  normalizeProgram,
  validateProgram,
  createRsrCommandBatch,
  createVsrDocument,
  createStudioImport,
  createGatewayManifest,
  rootHash as behaviorRootHash,
  clone as behaviorClone
} from '@taowind/reality-behavior-fabric';

const providers={
  'experience.audio.emit':({inputs})=>({accepted:true,kind:'audio',...inputs}),
  'experience.effect.emit':({inputs})=>({accepted:true,kind:'effect',...inputs})
};

const deepClone=v=>structuredClone(v);
const ensureProgram=p=>p?.program_root?p:normalizeProgram(p);

export function createBehaviorBinding(program,{source='inline',sceneId='scene:main'}={}){
  const p=ensureProgram(program);
  const validation=validateProgram(p);
  return {
    binding_id:`behavior-binding:${p.identity.program_id}`,
    program_id:p.identity.program_id,
    title:p.identity.title,
    program_root:p.program_root,
    source,
    scene_id:sceneId,
    status:validation.valid?'ready':'invalid',
    validation,
    editor:{active_panel:'state-machine',selected_id:null,breakpoints:[],watch_expressions:['globals.score','entity:player.health']}
  };
}

export function createStateMachineGraph(program,machineId=null){
  const p=ensureProgram(program);
  const machine=p.state_machines.find(x=>x.machine_id===(machineId??p.state_machines[0]?.machine_id));
  if(!machine)return{kind:'state-machine',machine_id:null,nodes:[],edges:[]};
  const cols=Math.max(2,Math.ceil(Math.sqrt(machine.states.length||1)));
  const nodes=machine.states.map((state,i)=>({
    id:state.state_id,
    label:state.state_id,
    x:80+(i%cols)*210,
    y:70+Math.floor(i/cols)*150,
    initial:state.state_id===machine.initial_state,
    transition_count:(state.transitions??[]).length,
    on_enter_count:(state.on_enter??[]).length,
    on_tick_count:(state.on_tick??[]).length
  }));
  const edges=[];
  for(const state of machine.states??[])for(const transition of state.transitions??[])edges.push({
    id:transition.transition_id??`${state.state_id}->${transition.target}`,
    from:state.state_id,
    to:transition.target,
    priority:transition.priority??0,
    condition:transition.condition??null
  });
  return{kind:'state-machine',machine_id:machine.machine_id,entity_id:machine.entity_id,initial_state:machine.initial_state,nodes,edges};
}

function walkTree(node,parentId=null,out={nodes:[],edges:[]},depth=0,index={value:0}){
  if(!node)return out;
  const id=node.node_id??`node:${index.value++}`;
  out.nodes.push({id,label:node.name??node.type??id,type:node.type??'unknown',depth,parent_id:parentId});
  if(parentId)out.edges.push({from:parentId,to:id});
  const children=node.children??(node.child?[node.child]:[]);
  for(const child of children)walkTree(child,id,out,depth+1,index);
  return out;
}
export function createBehaviorTreeGraph(program,treeId=null){
  const p=ensureProgram(program);
  const tree=p.behavior_trees.find(x=>x.tree_id===(treeId??p.behavior_trees[0]?.tree_id));
  if(!tree)return{kind:'behavior-tree',tree_id:null,nodes:[],edges:[]};
  const out=walkTree(tree.root);
  const levels=new Map();
  for(const n of out.nodes){const arr=levels.get(n.depth)??[];arr.push(n);levels.set(n.depth,arr);}
  for(const [depth,nodes] of levels)nodes.forEach((n,i)=>{n.x=90+i*210;n.y=60+depth*130;});
  return{kind:'behavior-tree',tree_id:tree.tree_id,entity_id:tree.entity_id,...out};
}

export function createRuleGraph(program){
  const p=ensureProgram(program);
  const events=[...new Set((p.rules??[]).map(r=>r.event))].sort();
  const eventNodes=events.map((event,i)=>({id:`event:${event}`,kind:'event',label:event,x:60,y:50+i*100}));
  const ruleNodes=(p.rules??[]).map((r,i)=>({id:r.rule_id,kind:'rule',label:r.rule_id,event:r.event,x:330,y:50+i*100,actions:(r.actions??[]).length,priority:r.priority??0}));
  const capIds=[...new Set((p.rules??[]).flatMap(r=>(r.actions??[]).filter(a=>a.type==='call').map(a=>a.capability_id)))];
  const capNodes=capIds.map((id,i)=>({id:`cap:${id}`,kind:'capability',label:id,x:650,y:50+i*100}));
  const edges=[];
  for(const r of p.rules??[]){edges.push({from:`event:${r.event}`,to:r.rule_id,kind:'trigger'});for(const a of r.actions??[])if(a.type==='call')edges.push({from:r.rule_id,to:`cap:${a.capability_id}`,kind:'invoke'});}
  return{kind:'rule-graph',nodes:[...eventNodes,...ruleNodes,...capNodes],edges};
}

function applyPatch(value,patch){
  const root=deepClone(value);
  const parts=String(patch.path??'').split('.').filter(Boolean);
  if(!parts.length)throw new Error('PATCH_PATH_REQUIRED');
  let cur=root;
  for(let i=0;i<parts.length-1;i++){
    const key=/^\d+$/.test(parts[i])?Number(parts[i]):parts[i];
    if(cur[key]===undefined)cur[key]={};
    cur=cur[key];
  }
  const last=/^\d+$/.test(parts.at(-1))?Number(parts.at(-1)):parts.at(-1);
  if(patch.op==='set')cur[last]=deepClone(patch.value);
  else if(patch.op==='remove')Array.isArray(cur)?cur.splice(last,1):delete cur[last];
  else if(patch.op==='append'){
    if(!Array.isArray(cur[last]))cur[last]=[];
    cur[last].push(deepClone(patch.value));
  } else throw new Error(`PATCH_OP_UNSUPPORTED:${patch.op}`);
  return root;
}

export class BehaviorEditorSession{
  constructor(program,{sessionId=null}={}){
    this.session_id=sessionId??`behavior-session:${randomUUID()}`;
    this.program=ensureProgram(program);
    this.runtime=new BehaviorRuntime(this.program,{providers});
    this.history=[behaviorClone(this.program)];
    this.history_index=0;
    this.snapshots=new Map();
    this.status='stopped';
    this.last_result=null;
  }
  validation(){return validateProgram(this.program);}
  replaceProgram(program,{preserveState=true,recordHistory=true}={}){
    const next=ensureProgram(program);
    const validation=validateProgram(next);
    if(!validation.valid)throw Object.assign(new Error('BEHAVIOR_PROGRAM_INVALID'),{code:'BEHAVIOR_PROGRAM_INVALID',details:validation});
    if(preserveState)this.runtime.hotReload(next);else this.runtime=new BehaviorRuntime(next,{providers});
    this.program=next;
    if(recordHistory){this.history=this.history.slice(0,this.history_index+1);this.history.push(behaviorClone(next));this.history_index=this.history.length-1;}
    return this.inspect();
  }
  patch(patches,{preserveState=true}={}){
    let raw=behaviorClone(this.program);delete raw.program_root;
    for(const patch of patches??[])raw=applyPatch(raw,patch);
    return this.replaceProgram(normalizeProgram(raw),{preserveState,recordHistory:true});
  }
  undo(){if(this.history_index<=0)return this.inspect();this.history_index--;return this.replaceProgram(this.history[this.history_index],{preserveState:true,recordHistory:false});}
  redo(){if(this.history_index>=this.history.length-1)return this.inspect();this.history_index++;return this.replaceProgram(this.history[this.history_index],{preserveState:true,recordHistory:false});}
  reset(){this.runtime=new BehaviorRuntime(this.program,{providers});this.status='stopped';this.last_result=null;return this.inspect();}
  step(input={}){this.status='paused';this.runtime.resume();this.last_result=this.runtime.tick(input);this.runtime.paused=true;return this.inspect();}
  run({ticks=1,inputProvider=null,inputs=[]}={}){
    this.status='running';this.runtime.resume();const results=[];
    for(let i=0;i<ticks&&!this.runtime.paused;i++){
      const input=inputs[i]??(typeof inputProvider==='function'?inputProvider(this.runtime.state.tick+1,this.runtime):{});
      results.push(this.runtime.tick(input));
    }
    this.status=this.runtime.paused?'paused':'stopped';this.last_result=results.at(-1)??null;return this.inspect();
  }
  pause(){this.runtime.paused=true;this.status='paused';return this.inspect();}
  resume(){this.runtime.resume();this.status='running';return this.inspect();}
  addBreakpoint(type){this.runtime.addBreakpoint(type);return this.inspect();}
  removeBreakpoint(type){this.runtime.removeBreakpoint(type);return this.inspect();}
  createSnapshot(label='snapshot'){
    const snapshot=this.runtime.snapshot();const id=`${label}:${snapshot.tick}:${snapshot.snapshot_root.slice(0,12)}`;this.snapshots.set(id,snapshot);return{id,snapshot,session:this.inspect()};
  }
  restoreSnapshot(id){const snapshot=this.snapshots.get(id);if(!snapshot)throw Object.assign(new Error('SNAPSHOT_NOT_FOUND'),{code:'SNAPSHOT_NOT_FOUND'});this.runtime.restore(snapshot);this.status='paused';return this.inspect();}
  exportArtifacts(){return{
    rsr_command_batch:createRsrCommandBatch(this.runtime),
    vsr_player:createVsrDocument(this.runtime,{observer:'player'}),
    vsr_debugger:createVsrDocument(this.runtime,{observer:'debugger'}),
    studio_import:createStudioImport(this.runtime,{trace:'trace.json'}),
    gateway_manifest:createGatewayManifest(),
    trace:this.runtime.exportTrace(),
    causal_delta:this.runtime.causalDelta()
  };}
  inspect(){
    const state=this.runtime.state;
    return{
      format:'reality-studio.behavior-session.v0.8',
      session_id:this.session_id,
      status:this.status,
      validation:this.validation(),
      program:{identity:this.program.identity,program_root:this.program.program_root,tick_rate:this.program.tick_rate,counts:{entities:this.program.entities.length,machines:this.program.state_machines.length,trees:this.program.behavior_trees.length,rules:this.program.rules.length,capabilities:this.program.capabilities.length}},
      runtime:{tick:state.tick,time:state.time,state_root:this.runtime.stateRoot(),globals:deepClone(state.globals),entities:deepClone(state.entities),machines:deepClone(state.machines),trees:deepClone(state.trees),paused:this.runtime.paused,proposals:deepClone(state.proposals),diagnostics:deepClone(state.diagnostics),commands:state.command_log.length,events_processed:state.events_processed},
      editor:{history_index:this.history_index,history_length:this.history.length,can_undo:this.history_index>0,can_redo:this.history_index<this.history.length-1,breakpoints:[...this.runtime.breakpoints],snapshots:[...this.snapshots.keys()]},
      graphs:{rules:createRuleGraph(this.program),state_machine:createStateMachineGraph(this.program),behavior_tree:createBehaviorTreeGraph(this.program)},
      trace_tail:this.runtime.traceEntries.slice(-80),
      last_result:deepClone(this.last_result)
    };
  }
}

export class BehaviorSessionRegistry{
  constructor(){this.sessions=new Map();}
  create(program){const s=new BehaviorEditorSession(program);this.sessions.set(s.session_id,s);return s;}
  get(id){const s=this.sessions.get(id);if(!s)throw Object.assign(new Error('BEHAVIOR_SESSION_NOT_FOUND'),{code:'BEHAVIOR_SESSION_NOT_FOUND'});return s;}
  delete(id){return this.sessions.delete(id);}
}

export function compileBehaviorStudio(program){
  const p=ensureProgram(program);
  const validation=validateProgram(p);
  return{
    format:'reality-studio.behavior-compilation.v0.8',
    program:p,
    validation,
    binding:createBehaviorBinding(p),
    graphs:{rules:createRuleGraph(p),state_machine:createStateMachineGraph(p),behavior_tree:createBehaviorTreeGraph(p)},
    compilation_root:behaviorRootHash({program_root:p.program_root,validation,graphs:{rules:createRuleGraph(p),state_machine:createStateMachineGraph(p),behavior_tree:createBehaviorTreeGraph(p)}})
  };
}
