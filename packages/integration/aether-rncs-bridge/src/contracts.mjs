import {createHash} from 'node:crypto';
import {validateSemanticFidelityGate} from './semantic-fidelity.mjs';

export const BRIDGE_VERSION='0.2.0-alpha.1';
export const BRIDGE_PROTOCOL='rncs.aetherworld-native-runtime.v0.2';
export const PLAN_FORMAT='rncs.compilation-plan.v0.2';
export const PLAN_VERSION='0.2.0';
export const clone=value=>structuredClone(value);
export const digest=value=>createHash('sha256').update(JSON.stringify(value,Object.keys(value??{}).sort())).digest('hex');
export const canonical=value=>{
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return`[${value.map(canonical).join(',')}]`;
  return`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
};
export const root=value=>createHash('sha256').update(canonical(value)).digest('hex');
export const id=(prefix,value)=>`${prefix}:${root(value).slice(0,24)}`;
const required=['plan_id','subject','artifacts','behaviors','candidate_branch','authority_requirements','world_state_changes','simulation_requirements','projection_targets','evidence_requirements','rollback_policy','acceptance_rules'];
const arrays=['artifacts','behaviors','authority_requirements','world_state_changes','simulation_requirements','projection_targets','evidence_requirements','acceptance_rules'];
export function validateCompilationPlan(plan){
  const errors=[];
  if(plan?.format!==PLAN_FORMAT)errors.push('FORMAT_INVALID');
  if(plan?.version!==PLAN_VERSION)errors.push('VERSION_INVALID');
  for(const key of required)if(plan?.[key]===undefined)errors.push(`REQUIRED:${key}`);
  for(const key of arrays)if(!Array.isArray(plan?.[key]))errors.push(`ARRAY_REQUIRED:${key}`);
  if(!plan?.subject?.subject_id)errors.push('SUBJECT_ID_REQUIRED');
  if(!plan?.candidate_branch?.branch_id)errors.push('BRANCH_ID_REQUIRED');
  for(const change of plan?.world_state_changes??[]){
    if(!['set','remove','append','increment','merge'].includes(change.op))errors.push(`WORLD_CHANGE_OP_INVALID:${change.op}`);
    if(!/^world(?:\.[A-Za-z0-9_-]+)+$/.test(String(change.path??'')))errors.push(`WORLD_CHANGE_PATH_INVALID:${change.path}`);
    if(/(^|\.)(authority|generation|revision|state_root|evidence_root)(\.|$)/i.test(String(change.path)))errors.push(`DIRECT_AUTHORITY_WRITE_FORBIDDEN:${change.path}`);
    if(change.op!=='remove'&&change.value===undefined)errors.push(`WORLD_CHANGE_VALUE_REQUIRED:${change.path}`);
  }
  const actions=new Set((plan?.authority_requirements??[]).map(x=>x.action));
  for(const action of ['create_world_object','merge_candidate_branch','rollback_generation'])if(!actions.has(action))errors.push(`AUTHORITY_REQUIREMENT_MISSING:${action}`);
  if((plan?.behaviors?.length??0)>0&&!actions.has('register_behavior'))errors.push('AUTHORITY_REQUIREMENT_MISSING:register_behavior');
  const semanticFidelity=validateSemanticFidelityGate(plan);
  errors.push(...semanticFidelity.errors);
  return {valid:errors.length===0,errors,semanticFidelity};
}
export function assertCompilationPlan(plan){const r=validateCompilationPlan(plan);if(!r.valid)throw Object.assign(new Error(`COMPILATION_PLAN_INVALID:${r.errors.join(',')}`),{code:r.errors.some(error=>error.startsWith('SEMANTIC_FIDELITY'))?'SEMANTIC_COMPILATION_GATE_FAILED':'COMPILATION_PLAN_INVALID',details:r});return plan;}
export function migrateCompilationPlan(plan){
  if(plan?.format===PLAN_FORMAT)return assertCompilationPlan(clone(plan));
  if(plan?.format!=='rncs.compilation-plan.v0.1')throw new Error('PLAN_VERSION_UNSUPPORTED');
  const sourceText=plan.source?.digestBasis??plan.intent?.summary??'migrated plan';
  const migrated={
    format:PLAN_FORMAT,version:PLAN_VERSION,plan_id:id('plan',{sourceText}),
    source:{language:plan.source?.language??'UNKNOWN',version:plan.source?.version??'0.1',text:sourceText,source_root:root(sourceText)},
    subject:{subject_id:'subject:migrated',roles:['owner'],responsibility_boundary:'world-authority'},
    artifacts:(plan.artifacts??[]).map(x=>({...x,definition:x})),behaviors:(plan.behaviors??[]).map(x=>({behavior_id:x.id,version:'0.1.0',name:x.name,trigger:{event:'manual'},actions:x.actions??[]})),
    candidate_branch:{branch_id:plan.branches?.[0]?.id??id('branch',plan),baseline_generation:0,risk_level:'high',reason:'migrated-v0.1'},
    authority_requirements:[{action:'create_world_object',scope:'world.object.create',risk_level:'medium'},{action:'register_behavior',scope:'behavior.register',risk_level:'medium'},{action:'merge_candidate_branch',scope:'branch.merge',risk_level:'high'},{action:'rollback_generation',scope:'rfe.rollback',risk_level:'high'}],
    world_state_changes:[{op:'set',path:'world.objects',value:plan.artifacts??[]}],simulation_requirements:[{runtime:'rncs.rsr',mode:'candidate-isolated'}],projection_targets:plan.projections??['aetherworld'],evidence_requirements:[{kind:'migration-evidence'}],rollback_policy:{mode:'generation-restore',restore_baseline:true},acceptance_rules:[{rule:'candidate-before-commit'}]
  };
  return assertCompilationPlan(migrated);
}
