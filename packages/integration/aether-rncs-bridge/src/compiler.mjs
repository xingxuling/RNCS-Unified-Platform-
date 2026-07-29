import {PLAN_FORMAT,PLAN_VERSION,assertCompilationPlan,root,id} from './contracts.mjs';
import {AETHER_ISLAND_COMPILER_PROFILE,createSemanticFidelityGate} from './semantic-fidelity.mjs';

export const sampleObjects=[
 {id:'island:aether-small',kind:'island',name:'小型以太岛',position:{x:0,y:0,z:0},physical:{body:'static',halfExtents:{x:8000,y:500,z:8000}}},
 {id:'spawn:blue',kind:'spawn-point',name:'蓝方出生点',position:{x:-2500,y:900,z:-1200}},
 {id:'spawn:red',kind:'spawn-point',name:'红方出生点',position:{x:2500,y:900,z:1200}},
 {id:'door:aether',kind:'door',name:'以太门',position:{x:0,y:1000,z:0},physical:{body:'kinematic',halfExtents:{x:900,y:1000,z:180}},state:{open:false}},
 {id:'lamp:blue-energy',kind:'light',name:'蓝色能量灯',position:{x:0,y:2600,z:-400},state:{intensity:1,color:'#2788ff'}},
 {id:'zone:door-sensor',kind:'sensor-zone',name:'门前感应区',position:{x:-1200,y:900,z:-1200},physical:{body:'static',halfExtents:{x:700,y:900,z:700},sensor:true}}
];
const behavior={
 behavior_id:'behavior:aether-island-sensor-v1',version:'1.0.0',name:'以太岛感应联动',
 trigger:{event:'player.entered-zone',zone_id:'zone:door-sensor'},
 actions:[
  {type:'set',target:'entity:door.open',value:true},
  {type:'set',target:'entity:lamp.intensity',value:2},
  {type:'set',target:'globals.ambient_sound',value:'playing'},
  {type:'call',capability_id:'rsr.authority-command',inputs:{command:'open-door'}},
  {type:'call',capability_id:'vsr.presentation-event',inputs:{event:'energy-light-boost'}},
  {type:'call',capability_id:'audio.environment.emit',inputs:{cue:'aether-island-awaken'}}
 ]
};
export function compileNaturalLanguageToRNCS(source,{subjectId='subject:aetherworld-user',roles=['owner'],baselineGeneration=0,language='NATURAL_LANGUAGE',languageVersion='zh-v1'}={}){
 if(typeof source!=='string'||source.trim().length<4)throw new Error('SOURCE_TEXT_REQUIRED');
 const text=source.normalize('NFKC').trim();const planId=id('plan',{text,baselineGeneration,language});
 const plan={
  format:PLAN_FORMAT,version:PLAN_VERSION,plan_id:planId,
  source:{language,version:languageVersion,text,source_root:root(text),compiler_profile:AETHER_ISLAND_COMPILER_PROFILE},
  subject:{subject_id:subjectId,roles,responsibility_boundary:'world-authority'},
  artifacts:sampleObjects.map(x=>({id:x.id,kind:x.kind,name:x.name,definition:x})),
  behaviors:[behavior],
  candidate_branch:{branch_id:`branch:${planId.split(':').at(-1)}`,baseline_generation:baselineGeneration,risk_level:'high',reason:'world-manufacturing-must-be-simulated-before-authority-commit'},
  authority_requirements:[
   {action:'create_world_object',scope:'world.object.create',risk_level:'medium'},
   {action:'modify_object_property',scope:'world.object.write',risk_level:'medium'},
   {action:'delete_world_object',scope:'world.object.delete',risk_level:'critical'},
   {action:'register_behavior',scope:'behavior.register',risk_level:'medium'},
   {action:'modify_physics_parameter',scope:'physics.write',risk_level:'high'},
   {action:'modify_multiplayer_authority_state',scope:'network.authority.write',risk_level:'high'},
   {action:'merge_candidate_branch',scope:'branch.merge',risk_level:'high'},
   {action:'rollback_generation',scope:'rfe.rollback',risk_level:'high'}
  ],
  world_state_changes:[
   {op:'set',path:'world.world_id',value:'world:aether-island'},
   {op:'set',path:'world.title',value:'响应玩家的以太岛'},
   {op:'set',path:'world.objects',value:sampleObjects},
   {op:'set',path:'world.behaviors',value:[{behavior_id:behavior.behavior_id,version:behavior.version,enabled:true}]},
   {op:'set',path:'world.network.mode',value:'server-authoritative-two-client'},
   {op:'set',path:'world.projection.mode',value:'vsr-temporal-independent'}
  ],
  simulation_requirements:[{runtime:'rncs.rsr',mode:'candidate-isolated',fixed_step_hz:60},{runtime:'rncs.network',clients:2,transport:'loopback'},{runtime:'rncs.vsr',interpolation_delay_ticks:1}],
  projection_targets:['aetherworld','reality-studio','rncs.vsr'],
  evidence_requirements:[{kind:'compilation-plan-root'},{kind:'rbf-simulation-receipt'},{kind:'aaf-decision'},{kind:'behavior-causal-delta'},{kind:'rfe-commit-receipt'},{kind:'rsr-authority-frame'},{kind:'network-two-client-convergence'},{kind:'vsr-presentation-root'}],
  rollback_policy:{mode:'generation-restore',restore_baseline:true,retain_evidence:true},
  acceptance_rules:[{rule:'candidate-before-commit'},{rule:'all-mutating-actions-authorized'},{rule:'behavior-is-runtime-registered'},{rule:'two-clients-converge-on-authority-root'},{rule:'authority-root-not-equal-presentation-root'},{rule:'rollback-and-replay-restore-state'}]
 };
 plan.semantic_fidelity=createSemanticFidelityGate(plan);
 if(plan.semantic_fidelity.status!=='passed')throw Object.assign(new Error(`SEMANTIC_COMPILATION_GATE_FAILED:${plan.semantic_fidelity.reasonCodes.join(',')}`),{code:'SEMANTIC_COMPILATION_GATE_FAILED',details:plan.semantic_fidelity});
 return assertCompilationPlan(plan);
}
export const compileCSLToRNCS=(source,options={})=>compileNaturalLanguageToRNCS(source,{...options,roles:['owner','csl-author'],language:'CSL',languageVersion:options.version??'v0.8'});
export const compileIALToRNCS=(source,options={})=>compileNaturalLanguageToRNCS(source,{...options,roles:['owner','ial-author'],language:'IAL',languageVersion:options.version??'ial-v1'});
