import {BehaviorError,clone,rootHash,seal,verifySeal} from './canonical.mjs';

export const REALITY_SCHEDULER_FORMAT='reality.scheduler.task-graph.v0.1';
export const REALITY_SCHEDULER_RECEIPT_FORMAT='reality.scheduler.receipt.v0.1';
const AUTHORITY_RANK={read:0,candidate:1,simulation:2,authority:3};
const list=value=>[...new Set((Array.isArray(value)?value:[]).map(String))].sort();
const overlap=(left,right)=>{const values=new Set(left);return right.some(value=>values.has(value));};
const fail=(condition,code,detail='')=>{if(!condition)throw new BehaviorError(code,detail);};

function normalizeBudget(input={}){
  const maxOperations=Number(input.max_operations??input.maxOperations??10000);
  fail(Number.isSafeInteger(maxOperations)&&maxOperations>0,'TASK_BUDGET_INVALID','max_operations');
  return{max_operations:maxOperations};
}

function normalizeRetry(input={}){
  const maxAttempts=Number(input.max_attempts??input.maxAttempts??1);
  fail(Number.isSafeInteger(maxAttempts)&&maxAttempts>0,'TASK_RETRY_INVALID','max_attempts');
  return{max_attempts:maxAttempts};
}

function normalizeRollback(input='none'){
  const mode=typeof input==='string'?input:String(input?.mode??'none');
  fail(['none','snapshot'].includes(mode),'TASK_ROLLBACK_INVALID',mode);
  return{mode};
}

function normalizeEvidence(input={}){
  const evidence=typeof input==='string'?{policy:input}:input??{};
  const policy=String(evidence.policy??'optional');
  fail(['none','optional','required'].includes(policy),'TASK_EVIDENCE_POLICY_INVALID',policy);
  return{policy,required:list(evidence.required??evidence.required_kinds)};
}

export function normalizeTask(input={}){
  const taskId=String(input.task_id??input.taskId??'');
  fail(taskId,'TASK_ID_REQUIRED');
  const authority=String(input.authority??'simulation');
  fail(Object.hasOwn(AUTHORITY_RANK,authority),'TASK_AUTHORITY_INVALID',authority);
  const task={
    format:REALITY_SCHEDULER_FORMAT,
    version:'0.1.0',
    task_id:taskId,
    system_id:String(input.system_id??input.systemId??taskId),
    priority:Number.isSafeInteger(input.priority)?input.priority:0,
    prerequisites:list(input.prerequisites),
    input_roots:list(input.input_roots??input.inputRoots),
    reads:list(input.reads??input.read_set),
    writes:list(input.writes??input.write_set),
    authority,
    budget:normalizeBudget(input.budget),
    retry:normalizeRetry(input.retry),
    rollback:normalizeRollback(input.rollback),
    evidence:normalizeEvidence(input.evidence),
    metadata:clone(input.metadata??{})
  };
  return seal(task,'task_root');
}

export function verifyTask(task){
  return Boolean(task&&task.format===REALITY_SCHEDULER_FORMAT&&task.version==='0.1.0'&&verifySeal(task,'task_root'));
}

function resourcesConflict(left,right){
  return overlap(left.writes,right.writes)||overlap(left.writes,right.reads)||overlap(right.writes,left.reads);
}

function dependsOn(dependencies,start,target,seen=new Set()){
  if(start===target)return true;
  if(seen.has(start))return false;
  seen.add(start);
  return [...(dependencies.get(start)??[])].some(parent=>dependsOn(dependencies,parent,target,seen));
}

function evidenceKinds(evidence){
  if(Array.isArray(evidence))return evidence.map(item=>typeof item==='string'?item:item?.kind).filter(Boolean).map(String);
  if(evidence&&typeof evidence==='object')return[evidence.kind??evidence.evidence_kind].filter(Boolean).map(String);
  return[];
}

export class RealityScheduler{
  constructor({authorityLevel='simulation',snapshot=()=>null,restore=()=>{},stateRoot=()=>null}={}){
    fail(Object.hasOwn(AUTHORITY_RANK,authorityLevel),'SCHEDULER_AUTHORITY_INVALID',authorityLevel);
    this.authority_level=authorityLevel;
    this.snapshot=snapshot;
    this.restore=restore;
    this.stateRoot=stateRoot;
    this.tasks=new Map();
    this.handlers=new Map();
    this.compiled=null;
  }
  registerTask(input,handler){
    fail(typeof handler==='function','TASK_HANDLER_REQUIRED',String(input?.task_id??input?.taskId??''));
    const task=normalizeTask(input);
    fail(!this.tasks.has(task.task_id),'TASK_DUPLICATE',task.task_id);
    this.tasks.set(task.task_id,task);
    this.handlers.set(task.task_id,handler);
    this.compiled=null;
    return clone(task);
  }
  removeTask(taskId){this.tasks.delete(String(taskId));this.handlers.delete(String(taskId));this.compiled=null;}
  compile(){
    const tasks=[...this.tasks.values()];
    const byId=new Map(tasks.map(task=>[task.task_id,task]));
    const dependencies=new Map(tasks.map(task=>[task.task_id,new Set(task.prerequisites)]));
    for(const task of tasks)for(const parent of task.prerequisites)fail(byId.has(parent),'TASK_PREREQUISITE_UNKNOWN',`${task.task_id}:${parent}`);
    for(let i=0;i<tasks.length;i++)for(let j=i+1;j<tasks.length;j++){
      const left=tasks[i],right=tasks[j];
      if(resourcesConflict(left,right)&&!dependsOn(dependencies,left.task_id,right.task_id)&&!dependsOn(dependencies,right.task_id,left.task_id))throw new BehaviorError('TASK_RESOURCE_ORDER_REQUIRED',`${left.task_id}:${right.task_id}`);
    }
    const indegree=new Map(tasks.map(task=>[task.task_id,task.prerequisites.length]));
    const dependents=new Map(tasks.map(task=>[task.task_id,[]]));
    for(const task of tasks)for(const parent of task.prerequisites)dependents.get(parent).push(task.task_id);
    const ready=tasks.filter(task=>indegree.get(task.task_id)===0).map(task=>task.task_id);
    const compare=(a,b)=>{const left=byId.get(a),right=byId.get(b);return right.priority-left.priority||a.localeCompare(b);};
    ready.sort(compare);
    const order=[];
    while(ready.length){const id=ready.shift();order.push(id);for(const child of dependents.get(id).sort())if(indegree.set(child,indegree.get(child)-1).get(child)===0){ready.push(child);ready.sort(compare);}}
    fail(order.length===tasks.length,'TASK_GRAPH_CYCLE');
    const graph={format:REALITY_SCHEDULER_FORMAT,version:'0.1.0',tasks:tasks.slice().sort((a,b)=>a.task_id.localeCompare(b.task_id)),edges:tasks.flatMap(task=>task.prerequisites.map(parent=>({from:parent,to:task.task_id}))).sort((a,b)=>a.from.localeCompare(b.from)||a.to.localeCompare(b.to)),order};
    this.compiled={...graph,graph_root:rootHash(graph)};
    return clone(this.compiled);
  }
  run({tick=0,context={},continueOnFailure=false}={}){
    const graph=this.compile(),byId=new Map([...this.tasks.values()].map(task=>[task.task_id,task])),receipts=[];
    let status='completed',failedTaskId=null;
    for(const taskId of graph.order){
      const task=byId.get(taskId),handler=this.handlers.get(taskId),beforeRoot=this.stateRoot();
      const missingInputs=task.input_roots.filter(root=>!(context.input_roots??context.inputRoots??[]).includes(root));
      if(AUTHORITY_RANK[this.authority_level]<AUTHORITY_RANK[task.authority]||missingInputs.length){
        const blocked={task_id:task.task_id,status:'blocked',reason:missingInputs.length?'INPUT_ROOT_MISSING':'AUTHORITY_INSUFFICIENT',missing_input_roots:missingInputs,before_root:beforeRoot,after_root:beforeRoot};
        receipts.push(blocked);status='blocked';failedTaskId??=task.task_id;if(!continueOnFailure)break;continue;
      }
      const rollbackSnapshot=task.rollback.mode==='snapshot'?this.snapshot():null;
      let attempts=0,result=null,error=null;
      while(attempts<task.retry.max_attempts){
        attempts++;
        try{
          result=handler({task:clone(task),context,tick,attempt:attempts,read_set:clone(task.reads),write_set:clone(task.writes)});
          fail(!(result&&typeof result.then==='function'),'TASK_HANDLER_ASYNC',task.task_id);
          result=result??{};
          const operations=Number(result.operations??1);
          fail(Number.isSafeInteger(operations)&&operations>=0&&operations<=task.budget.max_operations,'TASK_BUDGET_EXCEEDED',task.task_id);
          const actualReads=list(result.reads??task.reads),actualWrites=list(result.writes??task.writes);
          fail(actualReads.every(path=>task.reads.includes(path)),'TASK_READ_SET_VIOLATION',task.task_id);
          fail(actualWrites.every(path=>task.writes.includes(path)),'TASK_WRITE_SET_VIOLATION',task.task_id);
          const required=task.evidence.required;
          const provided=evidenceKinds(result.evidence);
          fail(task.evidence.policy!=='required'||required.every(kind=>provided.includes(kind)),'TASK_EVIDENCE_REQUIRED',`${task.task_id}:${required.filter(kind=>!provided.includes(kind)).join(',')}`);
          break;
        }catch(caught){error=caught;result=null;}
      }
      if(error){
        let rolledBack=false;
        if(rollbackSnapshot!==null){this.restore(rollbackSnapshot);rolledBack=true;}
        const failed={task_id:task.task_id,status:'failed',attempts,error:{code:error.code??'TASK_EXECUTION_FAILED',message:error.message},rolled_back:rolledBack,before_root:beforeRoot,after_root:this.stateRoot()};
        receipts.push(failed);status='failed';failedTaskId??=task.task_id;if(!continueOnFailure)break;continue;
      }
      const afterRoot=this.stateRoot();
      receipts.push({task_id:task.task_id,status:'executed',attempts,operations:Number(result?.operations??1),before_root:beforeRoot,after_root:afterRoot,evidence_root:rootHash(result?.evidence??null),result:clone(result??{})});
    }
    const execution={format:REALITY_SCHEDULER_RECEIPT_FORMAT,version:'0.1.0',graph_root:graph.graph_root,tick:Number(tick),authority:this.authority_level,status,order:graph.order,receipts,failed_task_id:failedTaskId};
    return seal(execution,'execution_root');
  }
}
