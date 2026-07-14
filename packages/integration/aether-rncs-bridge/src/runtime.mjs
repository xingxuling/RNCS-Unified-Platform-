import fs from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {
 createWorkspace,validateWorkspace,compileBranch,simulateBranch,compareBranches,
 createExecutionPlan,executePlan,createMergeProposal,createAuthorityRequest,
 issueAuthorityDecision,applyMergeProposal,createTransitionDraft,createStudioProjection,
 rootHash as branchHash
} from '@taowind/reality-branch-fabric';
import {hash as aafHash,sealPolicyBundle,sealApproval,evaluateAuthority} from '@taowind/agent-authority-fabric';
import {RealityStore,rootHash as rfeHash} from '@taowind/rfe-core-sdk';
import {RealityNetworkRuntime,createTwoPlayerWorldConfig} from '@taowind/reality-network-runtime';
import {TemporalPresentationBuffer,networkPacketToTemporalState,createTemporalCorrectionPlan} from '@taowind/visual-state-runtime/temporal-presentation';
import {BRIDGE_VERSION,BRIDGE_PROTOCOL,clone,root,id,validateCompilationPlan,assertCompilationPlan,migrateCompilationPlan} from './contracts.mjs';
import {compileNaturalLanguageToRNCS,compileCSLToRNCS,compileIALToRNCS} from './compiler.mjs';
import {createBehaviorRegistration,triggerAetherIslandBehavior,triggerBehavior} from './behavior.mjs';

const ZERO='0'.repeat(64);
const riskRank={low:1,medium:2,high:3,critical:4};
const now=()=>new Date().toISOString();
const ensureDir=p=>(fs.mkdirSync(p,{recursive:true}),p);
function writeJsonAtomic(file,value){const temp=`${file}.tmp-${process.pid}-${Date.now()}`;ensureDir(path.dirname(file));fs.writeFileSync(temp,`${JSON.stringify(value,null,2)}\n`);fs.renameSync(temp,file);}
const emptyState=()=>({world:{world_id:'world:empty',title:'未制造世界',objects:[],behaviors:[],network:{mode:'offline'},projection:{mode:'none'}}});
function box(bodyId,kind,position,halfExtents,extra={}){const fixture={id:`fixture:${bodyId}`,shape:{type:'box',halfExtents}};if(extra.sensor)fixture.sensor=true;return{id:bodyId,kind,position,fixtures:[fixture],...extra};}
function declaredBody(object){
 const physical=object?.physical;
 const halfExtents=physical?.halfExtents;
 if(!physical||!halfExtents||typeof halfExtents!=='object')return null;
 const position=object.position??{x:0,y:0,z:0};
 return box(object.id,physical.body??'static',position,halfExtents,{tags:[object.kind].filter(Boolean),sensor:Boolean(physical.sensor)});
}
function nestedGet(value,path){return String(path??'').split('.').filter(Boolean).reduce((cursor,part)=>cursor?.[part],value);}
function nestedSet(target,path,value){const parts=String(path??'').split('.').filter(Boolean);if(!parts.length||parts.some(part=>['__proto__','prototype','constructor'].includes(part)))throw new Error('RCL_BEHAVIOR_TARGET_INVALID');let cursor=target;for(const part of parts.slice(0,-1)){if(!cursor[part]||typeof cursor[part]!=='object'||Array.isArray(cursor[part]))cursor[part]={};cursor=cursor[part];}cursor[parts.at(-1)]=clone(value);}
function objectById(state,objectId){return(state.world.objects??[]).find(object=>object.id===objectId);}
function behaviorById(state,behaviorId){return(state.world.behaviors??[]).find(behavior=>behavior.behavior_id===behaviorId);}
function projectBehaviorStateToWorld(before,execution){
 const state=clone(before);const changedPaths=[];
 for(const changedPath of execution.delta.changed_paths??[]){
  let source;let target;
  if(changedPath.startsWith('globals.world.')){
   const pathName=changedPath.slice('globals.'.length);source=nestedGet(execution.state.globals,pathName);target={kind:'world',path:pathName.slice('world.'.length)};
  }else if(changedPath.startsWith('globals.objects.')){
   const [, , objectId, ...parts]=changedPath.split('.');source=nestedGet(execution.state.globals,`objects.${objectId}.${parts.join('.')}`);target={kind:'object',objectId,path:parts.join('.')};
  }else if(changedPath.startsWith('globals.behaviors.')){
   const [, , behaviorId, ...parts]=changedPath.split('.');source=nestedGet(execution.state.globals,`behaviors.${behaviorId}.${parts.join('.')}`);target={kind:'behavior',behaviorId,path:parts.join('.')};
  }else if(changedPath.startsWith('entity:')){
   const rest=changedPath.slice('entity:'.length);const dot=rest.indexOf('.');const objectId=dot<0?rest:rest.slice(0,dot);const pathName=dot<0?'':rest.slice(dot+1);source=nestedGet(execution.state.entities?.[objectId]?.variables,pathName);target={kind:'object',objectId,path:`state.${pathName}`};
  }else if(changedPath.startsWith('component:')){
   const rest=changedPath.slice('component:'.length);const dot=rest.indexOf('.');const objectId=dot<0?rest:rest.slice(0,dot);const pathName=dot<0?'':rest.slice(dot+1);source=nestedGet(execution.state.entities?.[objectId]?.components,pathName);target={kind:'object',objectId,path:`state.components.${pathName}`};
  }else if(changedPath.startsWith('globals.')){
   const pathName=changedPath.slice('globals.'.length);source=nestedGet(execution.state.globals,pathName);target={kind:'world',path:`runtime.behavior_globals.${pathName}`};
  }
  if(source===undefined||!target)continue;
  if(target.kind==='world'){
   nestedSet(state.world,target.path,source);changedPaths.push(`world.${target.path}`);
  }else if(target.kind==='object'){
   const object=objectById(state,target.objectId);if(!object)throw Object.assign(new Error(`RCL_BEHAVIOR_OBJECT_TARGET_MISSING:${target.objectId}`),{code:'RCL_BEHAVIOR_OBJECT_TARGET_MISSING'});nestedSet(object,target.path,source);changedPaths.push(`world.objects.${target.objectId}.${target.path}`);
  }else if(target.kind==='behavior'){
   const behavior=behaviorById(state,target.behaviorId);if(!behavior)throw Object.assign(new Error(`RCL_BEHAVIOR_BEHAVIOR_TARGET_MISSING:${target.behaviorId}`),{code:'RCL_BEHAVIOR_BEHAVIOR_TARGET_MISSING'});nestedSet(behavior,target.path,source);changedPaths.push(`world.behaviors.${target.behaviorId}.${target.path}`);
  }
 }
 return {state,changedPaths:changedPaths.sort()};
}
function worldConfigFromState(state){
 const base=createTwoPlayerWorldConfig({worldId:state.world.world_id,stepHz:60});
 const declared=(state.world.objects??[]).map(declaredBody).filter(Boolean);
 const fallback=state.world.world_id==='world:aether-island'?[box('island:aether-small','static',{x:0,y:-500,z:0},{x:8000,y:500,z:8000}),box('door:aether','kinematic',{x:0,y:1000,z:0},{x:900,y:1000,z:180},{tags:['door']}),box('zone:door-sensor','static',{x:-1200,y:900,z:-1200},{x:700,y:900,z:700},{tags:['sensor'],sensor:true})]:[];
 const bodies=new Map(base.bodies.filter(x=>x.id!=='ground').map(x=>[x.id,x]));
 for(const body of [...fallback,...declared])bodies.set(body.id,body);
 base.bodies=[...bodies.values()];
 return base;
}
function currentWorld(store){return store.getFact('world:root','world.snapshot')?.value??emptyState();}
function rclAuthorityStateRoot(value){return createHash('sha256').update(JSON.stringify(value),'utf8').digest('hex');}
function assertRclAuthorityStateBinding(state,candidate){
 const source=candidate?.plan?.source;
 if(source?.language!=='RCL')return null;
 const expectedNativeStateRoot=source.rcl_native_state_root;
 if(typeof expectedNativeStateRoot!=='string'||!/^[0-9a-f]{64}$/.test(expectedNativeStateRoot))throw Object.assign(new Error('RCL_NATIVE_AUTHORITY_STATE_ROOT_MISSING'),{code:'RCL_NATIVE_AUTHORITY_STATE_ROOT_MISSING'});
 const domainState=state?.world?.rcl?.state??{};
 const expectedDomainStateRoot=source.rcl_domain_state_root??null;
 const actualDomainStateRoot=expectedDomainStateRoot===null?null:rclAuthorityStateRoot(domainState);
 if(expectedDomainStateRoot!==actualDomainStateRoot)throw Object.assign(new Error('RCL_AUTHORITY_DOMAIN_STATE_ROOT_MISMATCH'),{code:'RCL_AUTHORITY_DOMAIN_STATE_ROOT_MISMATCH',details:{expected:expectedDomainStateRoot,actual:actualDomainStateRoot}});
  const authorityEvidence=assertRclAuthorityEvidenceBinding(candidate);
  return {nativeStateRoot:expectedNativeStateRoot,domainStateRoot:actualDomainStateRoot,authorityEvidenceRoot:authorityEvidence?.root??null,authorityContinuityVerified:authorityEvidence?.verified??false};
}
function assertRclAuthorityEvidenceBinding(candidate){
  const source=candidate?.plan?.source;
  if(source?.language!=='RCL')return null;
  const evidence=candidate.plan.rcl_authority_evidence??null;
  const expectedRoot=source.rcl_authority_evidence_root??null;
  if(!evidence){if(expectedRoot!==null)throw Object.assign(new Error('RCL_AUTHORITY_EVIDENCE_MISSING'),{code:'RCL_AUTHORITY_EVIDENCE_MISSING'});return null;}
  if(typeof evidence.root!=='string'||expectedRoot!==evidence.root)throw Object.assign(new Error('RCL_AUTHORITY_EVIDENCE_ROOT_MISMATCH'),{code:'RCL_AUTHORITY_EVIDENCE_ROOT_MISMATCH',details:{expected:expectedRoot,actual:evidence.root??null}});
  const unsigned={...evidence};delete unsigned.root;
  const actualRoot=rclAuthorityStateRoot(unsigned);
  if(actualRoot!==evidence.root)throw Object.assign(new Error('RCL_AUTHORITY_EVIDENCE_SEAL_MISMATCH'),{code:'RCL_AUTHORITY_EVIDENCE_SEAL_MISMATCH',details:{expected:evidence.root,actual:actualRoot}});
  if(evidence.state_root!==source.rcl_native_state_root)throw Object.assign(new Error('RCL_AUTHORITY_EVIDENCE_STATE_ROOT_MISMATCH'),{code:'RCL_AUTHORITY_EVIDENCE_STATE_ROOT_MISMATCH'});
  if(!Array.isArray(evidence.transitions)||evidence.raw_transition_count!==evidence.transitions.length)throw Object.assign(new Error('RCL_AUTHORITY_EVIDENCE_TRANSITIONS_INVALID'),{code:'RCL_AUTHORITY_EVIDENCE_TRANSITIONS_INVALID'});
  const requiredScopes=new Set();
  for(const transition of evidence.transitions){
   const subjectId=transition?.subject?.subject_id;
   const capabilities=Array.isArray(transition?.capability_plan?.capabilities)?transition.capability_plan.capabilities:[];
   for(const need of transition?.intent?.constraints??[]){
    const scope=`${need.capability}@${need.target}`;requiredScopes.add(scope);
    const backed=capabilities.some(warrant=>warrant?.capability===need.capability&&warrant?.target===need.target&&(!warrant.subject||warrant.subject===subjectId));
    if(!backed)throw Object.assign(new Error('RCL_AUTHORITY_CONTINUITY_UNBACKED_NEED'),{code:'RCL_AUTHORITY_CONTINUITY_UNBACKED_NEED',details:{transition:transition?.extensions?.rcl?.after_root??null,scope}});
   }
  }
  return {root:evidence.root,requiredScopes:[...requiredScopes].sort(),transitions:evidence.transitions.length,verified:true};
}
function rclRequiredScopes(plan,req){
  if(req.action!=='authorize_rcl_transition')return [req.scope];
  const continuity=assertRclAuthorityEvidenceBinding({plan});
  return [...new Set([req.scope,...(continuity?.requiredScopes??[])])];
}
function makePolicy(){return sealPolicyBundle({bundle_id:'policy:aetherworld-native-v0.2',default_effect:'deny',policies:[
 {policy_id:'deny-critical',effect:'deny',priority:100,match:{risk_at_least:'critical'}},
 {policy_id:'high-requires-two',effect:'require_approval',priority:90,match:{risk_at_least:'high'},approval:{roles:['owner','security'],quorum:2}},
 {policy_id:'allow-owner-medium',effect:'allow',priority:50,match:{roles_any:['owner'],scopes_any:['world.*','behavior.*','physics.*','network.*','branch.*','rfe.*'],risk_at_most:'medium'},obligations:[{type:'evidence-required'}]}
]});}
function rclBehaviorActionList(definition){
 const declared=definition.actions??definition.action;
 if(Array.isArray(declared))return declared;
 if(declared&&typeof declared==='object'&&typeof declared.type==='string')return[declared];
 if(declared&&typeof declared==='object')return Object.entries(declared).sort(([a],[b])=>a.localeCompare(b)).map(([actionId,action])=>({...action,action_id:actionId}));
 return[];
}
function rclBehaviorCapabilityList(definition){
 const declared=definition.capabilities??definition.capability;
 if(Array.isArray(declared))return declared;
 if(declared&&typeof declared==='object'&&((declared.capability_id??declared.id)||declared.required_scope||declared.required_scopes))return[declared];
 if(declared&&typeof declared==='object')return Object.entries(declared).sort(([a],[b])=>a.localeCompare(b)).map(([capabilityId,capability])=>({...capability,capability_id:capability.capability_id??capability.id??capabilityId}));
 return[];
}
function rclBehaviorProgram(definition={}){
 const event=definition.trigger?.event??definition.event;
 const programId=definition.behavior_id??definition.id;
 if(typeof event!=='string'||!event||typeof programId!=='string'||!programId)return null;
 const actions=rclBehaviorActionList(definition);
 const declaredCapabilities=rclBehaviorCapabilityList(definition);
 const capabilityMap=new Map(declaredCapabilities.map(capability=>[capability.capability_id??capability.id,capability]));
 const lowered=[];const usedCapabilities=[];
 for(const action of actions){
  if(!action||typeof action!=='object'||!['set','add','multiply','clamp','emit','call'].includes(action.type))return null;
  const capability=capabilityMap.get(action.capability_id??action.capability?.capability_id??action.capability?.id);
  const capabilityId=action.capability_id??action.capability?.capability_id??action.capability?.id;
  if(['set','add','multiply','clamp'].includes(action.type)&&(typeof action.target!=='string'||!action.target||action.value===undefined&&action.type!=='clamp'||action.type==='clamp'&&(action.min===undefined||action.max===undefined)))return null;
  if(action.type==='emit'&&(typeof action.event!=='string'||!action.event))return null;
  if(action.type==='call'&&typeof capabilityId!=='string')return null;
  if(action.type!=='emit'&&typeof capabilityId!=='string')return null;
  const loweredAction={type:action.type};
  for(const key of ['target','value','min','max','event','payload','phase','priority','inputs'])if(action[key]!==undefined)loweredAction[key]=clone(action[key]);
  if(action.type==='call')loweredAction.capability_id=capabilityId;
  lowered.push(loweredAction);
  if(typeof capabilityId==='string'){
   usedCapabilities.push(capabilityId);
   if(action.type!=='call')lowered.push({type:'call',capability_id:capabilityId,inputs:clone(action.inputs??capability?.inputs??{})});
  }
 }
 const capabilities=[];
 for(const capabilityId of [...new Set(usedCapabilities)].sort()){
  const capability=capabilityMap.get(capabilityId);const scopes=capability?.required_scopes??(capability?.required_scope??capability?.scope?[capability.required_scope??capability.scope]:[]);
  if(!Array.isArray(scopes)||!scopes.length||scopes.some(scope=>typeof scope!=='string'||!scope))return null;
  capabilities.push({capability_id:capabilityId,required_scopes:[...scopes],risk:capability.risk??'medium',irreversible:Boolean(capability.irreversible)});
 }
 if(!lowered.length||!capabilities.length)return null;
 return {identity:{program_id:programId,title:definition.name??programId,description:definition.description??'RCL-authored RNCS behavior',version:definition.version??'0.1.0'},seed:`rcl:${programId}`,tick_rate:Number(definition.tick_rate??60),globals:clone(definition.globals??{}),entities:[],state_machines:[],behavior_trees:[],rules:[{rule_id:`rule:${programId}:${event}`,event,actions:lowered}],capabilities,authority:{default_effect:'deny',policies:[{policy_id:`policy:${programId}`,effect:'allow',priority:10,roles_any:['runtime'],capabilities:capabilities.map(capability=>capability.capability_id),risk_at_most:capabilities.reduce((max,capability)=>riskRank[capability.risk]>riskRank[max]?capability.risk:max,'low')}]},metadata:{source_language:'RCL',authority_boundary:'rncs-world-state',rcl_action_count:actions.length}};
}
function behaviorProviders(calls){return{'rsr.authority-command':({inputs})=>(calls.push({provider:'rsr',inputs}),{accepted:true}),'vsr.presentation-event':({inputs})=>(calls.push({provider:'vsr',inputs}),{accepted:true}),'audio.environment.emit':({inputs})=>(calls.push({provider:'audio',inputs}),{accepted:true})};}
function makeEnvelope(plan,req){
  const requiredScopes=rclRequiredScopes(plan,req);
  const envelope={format:'rncs.reality-transition-envelope.v0.1',contract_version:'0.1.0',transition_id:id('transition',{plan:plan.plan_id,action:req.action}),phase:'proposed',base_generation:{reality_id:'world:aether-island',generation:plan.candidate_branch?.baseline_generation??0,generation_root:ZERO},subject:clone(plan.subject),intent:{intent_id:id('intent',plan.plan_id),source:plan.source?.text??'',goals:[{type:req.action}],constraints:['candidate-before-commit']},capability_plan:{plan_id:plan.plan_id,capabilities:[{capability_id:req.action,risk:req.risk_level,reversible:req.action!=='delete_world_object'}],required_scopes:requiredScopes},inputs:[],provisional_delta:{operations:clone(plan.world_state_changes??[]),provisional:true},causal_basis:{rules:[{rule_id:'candidate-first'}]},authority:{status:'pending',claims:[],constraints:[]},evidence:{nodes:[{evidence_id:'plan',kind:'compilation-plan',content_root:root(plan)}],edges:[]},commit:{status:'not_committed'},projections:[],proposal_root:root({plan_id:plan.plan_id,action:req.action})};
 envelope.envelope_root=aafHash(envelope);return envelope;
}
function authorizeRequirement(plan,req,approvalRoles=[]){
  const requiredScopes=rclRequiredScopes(plan,req);
  const envelope=makeEnvelope(plan,req);
  const negotiation={plan:{steps:[{step_id:`step:${req.action}`,capability_id:req.action,required_scopes:requiredScopes,risk:{level:req.risk_level},reversible:req.action!=='delete_world_object',execution_phase:'transaction',cost:{monetary_microunits:0}}]}};
 const issued=new Date();const expires=new Date(issued.getTime()+60*60*1000);
 const approvals=approvalRoles.map((role,index)=>sealApproval({approval_id:`approval:${req.action}:${index}`,proposal_root:envelope.proposal_root,approver_id:`subject:${role}:${index}`,approver_roles:[role],decision:'approved',issued_at:issued.toISOString(),expires_at:expires.toISOString()}));
  const result=evaluateAuthority({envelope,negotiation,policy_bundle:makePolicy(),approvals,identity_scopes:requiredScopes,context:{now:issued.toISOString(),environment:'local',request_id:id('request',req)}});
 const outcome=result.status==='approved'?'allow':result.status==='denied'?'deny':'require_approval';return {action:req.action,scope:req.scope,risk_level:req.risk_level,outcome,status:result.status,reason:result.reason,authority_subject:plan.subject.subject_id,expiry:expires.toISOString(),evidence:{decision_root:result.decision_root,policy_bundle_root:result.request.policy_bundle_root},decision:result};
}
function authorityBindingForCandidate(candidate,context={}){
 if(!candidate?.plan)return null;
  const binding={format:'rncs.rcl-authority-binding.v0.2',plan_root:root(candidate.plan),candidate_root:candidate.compiled?.state_root??null,aaf_authority_root:candidate.authority?.authority_root??null,baseline_root:candidate.baseline_root??null,baseline_revision:candidate.baseline_revision??null,rcl_authority_evidence_root:candidate.plan.source?.rcl_authority_evidence_root??null,rbf_proposal_root:context.proposal?.proposal_root??null,rbf_authority_request_root:context.request?.request_root??null,rbf_authority_decision_root:context.decision?.decision_root??null,rbf_transition_root:context.transition?.envelope_root??null};
 return {...binding,binding_root:root(binding)};
}

export class AetherworldRNCSNativeRuntime{
 constructor({dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'aether-rncs-native-'))}={}){
  this.dataDir=ensureDir(path.resolve(dataDir));this.storePath=path.join(this.dataDir,'rfe-store');
  this.store=fs.existsSync(path.join(this.storePath,'store.json'))?new RealityStore(this.storePath):RealityStore.init(this.storePath,{worldId:'world:aetherworld-rncs',branchId:'branch:main'});
 this.candidateStorePath=path.join(this.dataDir,'candidate-records.json');this.candidates=new Map();this.loadCandidates();this.behaviors=new Map();this.network=new RealityNetworkRuntime();this.evidence=[];this.sessions=new Map();this.ensureWorldRoot();this.hydrateBehaviors();
 }
 loadCandidates(){if(!fs.existsSync(this.candidateStorePath))return;const records=JSON.parse(fs.readFileSync(this.candidateStorePath,'utf8'));if(!Array.isArray(records))throw new Error('CANDIDATE_STORE_INVALID');for(const record of records){if(record?.candidate_id&&record.workspace&&record.compiled)this.candidates.set(record.candidate_id,record);}}
 persistCandidates(){writeJsonAtomic(this.candidateStorePath,[...this.candidates.values()].map(clone));}
 refreshStore(){if(fs.existsSync(path.join(this.storePath,'store.json')))this.store=new RealityStore(this.storePath);this.hydrateBehaviors();}
 hydrateBehaviors(){for(const definition of currentWorld(this.store).world?.behaviors??[]){if(!definition?.program||this.behaviors.has(definition.behavior_id))continue;const calls=[];const registration=createBehaviorRegistration({program:definition.program,providers:behaviorProviders(calls)});registration.enabled=definition.enabled!==false;registration.provider_calls=calls;this.behaviors.set(registration.behavior_id,registration);}}
 ensureWorldRoot(){if(this.store.getIdentity('world:root'))return;this.store.commit({actor:'subject:rncs-bootstrap',intent:{kind:'initialize-world-root'},authority:{status:'approved',resolver:'bootstrap'},operations:[{op:'createIdentity',identity:{id:'world:root',kind:'world-root',metadata:{title:'Aetherworld RNCS World Root'}}},{op:'setFact',fact:{subject:'world:root',predicate:'world.snapshot',value:emptyState()}}],evidence:[{kind:'bootstrap'}]});}
 health(){this.refreshStore();const generation=this.store.currentGeneration();return{status:'ok',runtime_id:'rncs.aetherworld-native',version:BRIDGE_VERSION,protocol:BRIDGE_PROTOCOL,providers:{rbf:'0.2.0-alpha.1',aaf:'0.1.0',behavior:'0.1.0-alpha.1',rfe:'0.1.0',rsr:'0.9.0-alpha.1',network:'0.2.0-alpha.1',vsr:'0.8.0-alpha.1'},generation:generation.generationId,revision:generation.realityRevision,state_root:generation.integrityHash,candidates:this.candidates.size,behaviors:this.behaviors.size,sessions:this.sessions.size,degraded:false};}
 compile({source,language='NATURAL_LANGUAGE',subjectId='subject:aetherworld-user'}={}){const baseline=this.store.currentGeneration().realityRevision;const options={subjectId,baselineGeneration:baseline};const plan=language==='CSL'?compileCSLToRNCS(source,options):language==='IAL'?compileIALToRNCS(source,options):compileNaturalLanguageToRNCS(source,options);assertCompilationPlan(plan);return plan;}
 validatePlan({plan}={}){return validateCompilationPlan(plan);}
 migratePlan({plan}={}){return migrateCompilationPlan(plan);}
 createCandidate({plan}={}){
  assertCompilationPlan(plan);const base=currentWorld(this.store);const generation=this.store.currentGeneration();
  const requestedWorldId=plan.world_state_changes.find(change=>change.op==='set'&&change.path==='world.world_id')?.value;
  const invariantWorldId=requestedWorldId??base.world.world_id;
  const invariants=invariantWorldId&&invariantWorldId!=='world:empty'?[{path:'world.world_id',operator:'equals',value:invariantWorldId,code:'WORLD_ID_REQUIRED'}]:[];
  const branch={branch_id:plan.candidate_branch.branch_id,parent_branch_id:'branch:main',label:'Aetherworld候选现实',hypothesis:plan.source?.text??'Aetherworld world manufacturing',assumptions:[{claim:'所有正式变化必须经过AAF与RFE',uncertainty:0}],operations:plan.world_state_changes.map((change,index)=>({operation_id:`operation:${index+1}`,op:change.op,path:change.path,value:clone(change.value),capability_id:`rncs.${plan.authority_requirements[Math.min(index,plan.authority_requirements.length-1)]?.action??'world-change'}`,reversible:true,impact:{benefit:5000,cost:500,risk:plan.candidate_branch.risk_level==='high'?3200:1200,confidence_delta:1000,duration:500}})),constraints:{max_risk:10000,min_confidence:1000},invariants,predicted_metrics:{confidence:2000},tags:['aetherworld','native-runtime','candidate-only']};
  const workspace=createWorkspace({reality_id:'world:aetherworld-rncs',base_generation:generation.realityRevision,base_generation_root:generation.integrityHash,base_branch_id:'branch:main',project_root:branchHash(plan),base_state:base,branches:[branch]});
  const validation=validateWorkspace(workspace);if(!validation.valid)throw new Error(`CANDIDATE_WORKSPACE_INVALID:${validation.errors.join(',')}`);
  const compiled=compileBranch(workspace,branch.branch_id);const record={format:'rncs.reality-candidate.v0.2',candidate_id:id('candidate',{plan:plan.plan_id,root:compiled.state_root}),plan,workspace,compiled,baseline_generation:generation.generationId,baseline_revision:generation.realityRevision,baseline_root:generation.integrityHash,impact_objects:plan.artifacts.map(x=>x.id),expected_changes:compiled.diff,risks:plan.authority_requirements.filter(x=>(riskRank[x.risk_level]??0)>=3),simulation:null,authority:null,status:'candidate',mergeable:false,rollback_point:{generation_id:generation.generationId,generation_root:generation.integrityHash,revision:generation.realityRevision},created_at:now()};
  this.candidates.set(record.candidate_id,record);this.persistCandidates();return this.publicCandidate(record);
 }
 publicCandidate(record){const out=clone(record);out.candidate_root=record.compiled?.state_root??null;delete out.workspace;delete out.compiled;return out;}
 requireCandidate(candidateId){const record=this.candidates.get(candidateId);if(!record)throw new Error('CANDIDATE_NOT_FOUND');return record;}
 getCandidate({candidateId}={}){return this.publicCandidate(this.requireCandidate(candidateId));}
 diffCandidate({candidateId}={}){const r=this.requireCandidate(candidateId);return{candidate_id:candidateId,baseline_root:r.baseline_root,candidate_root:r.compiled.state_root,diff:clone(r.compiled.diff)};}
 async simulateCandidate({candidateId}={}){const r=this.requireCandidate(candidateId);const simulation=simulateBranch(r.workspace,r.plan.candidate_branch.branch_id);const executionPlan=createExecutionPlan(r.workspace,simulation);const execution=await executePlan(r.workspace.base_state,executionPlan);const comparison=compareBranches(r.workspace);r.simulation={simulation,execution_receipt:execution.receipt,execution_state:execution.state,comparison,studio_projection:createStudioProjection(r.workspace,comparison),evidence_root:root({simulation,receipt:execution.receipt})};r.status=execution.receipt.status==='completed'?'simulated':'simulation_failed';r.mergeable=r.status==='simulated';this.persistCandidates();return clone(r.simulation);}
 authorizeCandidate({candidateId,approvalRoles=['owner','security']}={}){const r=this.requireCandidate(candidateId);const decisions=r.plan.authority_requirements.map(req=>authorizeRequirement(r.plan,req,approvalRoles));r.authority={format:'rncs.aaf-action-decisions.v0.2',decisions,summary:{allow:decisions.filter(x=>x.status==='approved'&&(riskRank[x.risk_level]??0)<=2).length,require_approval:decisions.filter(x=>x.status==='pending_approval').length,approved:decisions.filter(x=>x.status==='approved').length,deny:decisions.filter(x=>x.status==='denied').length},authority_root:root(decisions)};r.mergeable=Boolean(r.simulation)&&decisions.filter(x=>x.action!=='delete_world_object').every(x=>x.status==='approved');r.status=r.mergeable?'authorized':decisions.some(x=>x.status==='denied'&&x.action!=='delete_world_object')?'denied':'approval_required';this.persistCandidates();return clone(r.authority);}
 rejectCandidate({candidateId,reason='rejected-by-authority'}={}){const r=this.requireCandidate(candidateId);r.status='rejected';r.mergeable=false;r.rejection={reason,at:now()};this.persistCandidates();return this.publicCandidate(r);}
 registerBehavior({candidateId,behaviorDefinition=null}={}){const r=this.requireCandidate(candidateId);if(!r.authority?.decisions?.some(x=>x.action==='register_behavior'&&x.status==='approved'))throw new Error('BEHAVIOR_AUTHORITY_REQUIRED');const definition=behaviorDefinition??(r.plan.source?.language==='RCL'?r.plan.behaviors?.find(item=>rclBehaviorProgram(item)):null);const program=r.plan.source?.language==='RCL'?rclBehaviorProgram(definition):null;if(r.plan.source?.language==='RCL'&&!program)throw Object.assign(new Error('RCL_BEHAVIOR_PROGRAM_REQUIRED'),{code:'RCL_BEHAVIOR_PROGRAM_REQUIRED'});const calls=[];const registration=createBehaviorRegistration({program,providers:behaviorProviders(calls)});registration.provider_calls=calls;this.behaviors.set(registration.behavior_id,registration);return{behavior_id:registration.behavior_id,version:registration.version,enabled:registration.enabled,program_root:registration.program_root,program:clone(registration.program),validation:registration.validation};}
 setBehaviorEnabled({behaviorId,enabled}={}){const b=this.behaviors.get(behaviorId);if(!b)throw new Error('BEHAVIOR_NOT_FOUND');b.enabled=Boolean(enabled);return{behavior_id:behaviorId,enabled:b.enabled};}
 updateBehavior({behaviorId,program}={}){const b=this.behaviors.get(behaviorId);if(!b)throw new Error('BEHAVIOR_NOT_FOUND');const result=b.runtime.hotReload(program);b.program=b.runtime.program;b.version=b.program.identity.version;b.program_root=b.program.program_root;return result;}
 commitStateToRFE(state,{candidate,behaviorEvidence=[],authorityContext={}}={}){const operations=[];const identities=new Set(this.store.materialize().identities.map(x=>x.id));for(const object of state.world.objects??[]){if(!identities.has(object.id)){const metadata=object.name===undefined?{}:{name:object.name};operations.push({op:'createIdentity',identity:{id:object.id,kind:object.kind,metadata}});identities.add(object.id);}operations.push({op:'setFact',fact:{subject:object.id,predicate:'world.object.definition',value:object}});}for(const behavior of state.world.behaviors??[]){if(!identities.has(behavior.behavior_id)){const metadata=behavior.version===undefined?{}:{version:behavior.version};operations.push({op:'createIdentity',identity:{id:behavior.behavior_id,kind:'behavior-program',metadata}});identities.add(behavior.behavior_id);}operations.push({op:'setFact',fact:{subject:behavior.behavior_id,predicate:'behavior.registration',value:behavior}});}operations.push({op:'setFact',fact:{subject:'world:root',predicate:'world.snapshot',value:state}},{op:'setFact',fact:{subject:'world:root',predicate:'world.last_plan',value:{plan_id:candidate?.plan?.plan_id,candidate_id:candidate?.candidate_id}}});const source=candidate?.plan?.source;const rclAuthorityState=assertRclAuthorityStateBinding(state,candidate);const authorityBinding=authorityBindingForCandidate(candidate,authorityContext);const authorityChain=authorityContext.proposal?{format:'rncs.rbf-authority-chain.v0.1',proposal_root:authorityContext.proposal.proposal_root,request_root:authorityContext.request?.request_root??null,decision_root:authorityContext.decision?.decision_root??null,transition_root:authorityContext.transition?.envelope_root??null}:null;const bindingEvidence=authorityBinding?[{kind:'rncs.rcl-authority-binding',root:authorityBinding.binding_root}]:[];const authorityChainEvidence=authorityChain?[{kind:'rncs.rbf-authority-chain',root:root(authorityChain)}]:[];const rclCompilerEvidence=source?.language==='RCL'&&source.compiler?.artifactHash?[{kind:'rcl-native-selfhost-compiler',root:source.compiler.artifactHash},{kind:'rcl-native-compiler-parity',root:root(source.compiler_parity??{})}]:[];const rclEvidence=source?.language==='RCL'?[{kind:'rcl-native-bytecode',root:source.bytecode_hash??source.source_root},{kind:'rcl-native-authority-state',root:rclAuthorityState?.nativeStateRoot??source.rcl_native_state_root,domain_state_root:rclAuthorityState?.domainStateRoot??null},{kind:'rcl-native-parity',root:root({bytecode_hash:source.bytecode_hash,bytecode_version:source.bytecode_version,instruction_count:source.instruction_count,verified:true})},{kind:'rcl-authority-plan',root:root(candidate.plan)}]:[];const commit=this.store.commit({actor:candidate?.plan?.subject?.subject_id??'subject:rncs-runtime',intent:{kind:'merge-aetherworld-candidate',plan_id:candidate?.plan?.plan_id},authority:{status:'approved',resolver:'aaf:authority-fabric:v0.1',decision_root:candidate?.authority?.authority_root,binding_root:authorityBinding?.binding_root??null,rcl_native_state_root:rclAuthorityState?.nativeStateRoot??null,rcl_domain_state_root:rclAuthorityState?.domainStateRoot??null,rbf_proposal_root:authorityChain?.proposal_root??null,rbf_authority_request_root:authorityChain?.request_root??null,rbf_authority_decision_root:authorityChain?.decision_root??null,rbf_transition_root:authorityChain?.transition_root??null},operations,evidence:[{kind:'candidate',root:root(candidate?.candidate_id??'')},{kind:'simulation',root:candidate?.simulation?.evidence_root},...bindingEvidence,...authorityChainEvidence,...rclCompilerEvidence,...rclEvidence,...behaviorEvidence]});return {...commit,authority_binding:authorityBinding,authority_chain:authorityChain,rcl_authority_state:rclAuthorityState};}
 async mergeCandidate({candidateId}={}){const r=this.requireCandidate(candidateId);if(!r.simulation)throw new Error('SIMULATION_REQUIRED');if(!r.authority||!r.authority.decisions.filter(x=>x.action!=='delete_world_object').every(x=>x.status==='approved'))throw new Error('AAF_APPROVAL_REQUIRED');if(!r.mergeable)throw new Error('CANDIDATE_NOT_MERGEABLE');const current=this.store.currentGeneration();if(current.integrityHash!==r.baseline_root||current.realityRevision!==r.baseline_revision)throw Object.assign(new Error('CANDIDATE_BASELINE_STALE'),{code:'CANDIDATE_BASELINE_STALE',details:{candidate:{revision:r.baseline_revision,state_root:r.baseline_root},current:{revision:current.realityRevision,state_root:current.integrityHash}}});const source=r.plan.source;const rclDefinition=source?.language==='RCL'?r.plan.behaviors?.find(item=>rclBehaviorProgram(item)):null;let behavior=null;const shouldRegisterDefaultBehavior=source?.language!=='RCL'&&r.plan.behaviors?.length;if(shouldRegisterDefaultBehavior){behavior=this.behaviors.get('behavior:aether-island-sensor-v1');if(!behavior)this.registerBehavior({candidateId});behavior=this.behaviors.get('behavior:aether-island-sensor-v1');}else if(rclDefinition){behavior=this.registerBehavior({candidateId,behaviorDefinition:rclDefinition});}const executionPlan=createExecutionPlan(r.workspace,r.simulation.simulation);const execution=await executePlan(r.workspace.base_state,executionPlan);const comparison=compareBranches(r.workspace);const proposal=createMergeProposal(r.workspace,comparison,r.plan.candidate_branch.branch_id,{execution_receipt:execution.receipt});const request=createAuthorityRequest(proposal);const decision=issueAuthorityDecision(request,{decision:'approved',authority_subject:r.plan.subject.subject_id});const merged=applyMergeProposal(r.workspace.base_state,proposal,{current_generation_root:r.baseline_root,authority_decision:decision});if(behavior&&source?.language==='RCL'){merged.state.world.behaviors=(merged.state.world.behaviors??[]).map(definition=>definition.behavior_id===behavior.behavior_id?{...definition,executable:true,program_root:behavior.program_root,program:clone(behavior.program)}:definition);merged.state_root=branchHash(merged.state);}const rclAuthorityState=assertRclAuthorityStateBinding(merged.state,r);const transition=createTransitionDraft(r.workspace,proposal,{authority_decision:decision});const behaviorEvidence=behavior?[{kind:'behavior-program',root:behavior.program_root}]:[];const commit=this.commitStateToRFE(merged.state,{candidate:r,behaviorEvidence,authorityContext:{proposal,request,decision,transition}});const rclNativeEvidence=source?.language==='RCL'?{bytecode_hash:source.bytecode_hash,bytecode_version:source.bytecode_version,instruction_count:source.instruction_count,native_state_root:rclAuthorityState?.nativeStateRoot??source.rcl_native_state_root,native_state_root_verified:true,domain_state_root:rclAuthorityState?.domainStateRoot??null,parity_verified:true,compiler_kind:source.compiler?.kind??null,compiler_artifact_hash:source.compiler?.artifactHash??null,compiler_parity_verified:source.compiler_parity?.ok===true,knowledge_graph_root:source?.rcl_knowledge_graph_root??null,knowledge_claim_count:r.plan.rcl_knowledge_graph?.claims?.length??0,knowledge_evidence_reference_count:r.plan.rcl_knowledge_graph?.evidence_nodes?.length??0,knowledge_dependency_edge_count:r.plan.rcl_knowledge_graph?.dependency_edges?.length??0,behavior_program_root:behavior?.program_root??null}:null;r.status='merged';r.mergeable=false;r.merge={merged_state_root:merged.state_root,transition_root:transition.envelope_root,generation:commit.generation,revision:commit.generation.realityRevision,snapshot:{generation_id:commit.generation.generationId,state:clone(merged.state)},evidence:{rfe_commit_receipt:commit.receipt,authority_decision:decision,execution_receipt:execution.receipt,authority_binding:commit.authority_binding,authority_chain:commit.authority_chain,rcl_native_evidence:rclNativeEvidence}};this.evidence.push(r.merge.evidence);this.persistCandidates();return clone(r.merge);}
 executeBehavior({behaviorId,event='tick',payload={}}={}){
  this.refreshStore();
  const registration=this.behaviors.get(behaviorId);
  if(!registration)throw Object.assign(new Error('BEHAVIOR_NOT_FOUND'),{code:'BEHAVIOR_NOT_FOUND'});
  const before=currentWorld(this.store);
  const execution=triggerBehavior(registration,event,payload);
  const projection=projectBehaviorStateToWorld(before,execution);
  const beforeRoot=root(before),afterRoot=root(projection.state);
  const record={behavior_id:behaviorId,event,payload:clone(payload),program_root:registration.program_root,behavior_state_root:root(execution.state),causal_delta:execution.delta,trace:execution.trace,tick:execution.tick,world_before_root:beforeRoot,world_after_root:afterRoot,world_changed_paths:projection.changedPaths};
  const operations=[];
  if(beforeRoot!==afterRoot)operations.push({op:'setFact',fact:{subject:'world:root',predicate:'world.snapshot',value:projection.state}});
  operations.push({op:'setFact',fact:{subject:behaviorId,predicate:'behavior.last_execution',value:record}});
  const commit=this.store.commit({actor:'subject:behavior-runtime',intent:{kind:'execute-rcl-behavior',behavior_id:behaviorId,event},authority:{status:'approved',resolver:'aaf:authority-fabric:v0.1',program_root:registration.program_root},operations,evidence:[{kind:'rcl-behavior-program',root:registration.program_root},{kind:'rcl-behavior-causal-delta',root:root(execution.delta)},{kind:'rcl-behavior-world-delta',root:root({before:beforeRoot,after:afterRoot,paths:projection.changedPaths})},{kind:'rcl-behavior-execution-trace',root:root(execution.trace)}]});
  const result={format:'rncs.rcl-behavior-execution.v0.1',behavior_id:behaviorId,event,program_root:registration.program_root,execution:{state_root:root(execution.state),tick:execution.tick,changed_paths:execution.tick.changed_paths,causal_delta:execution.delta,trace:execution.trace,world_state_root:afterRoot,world_changed_paths:projection.changedPaths},generation:commit.generation,receipt:commit.receipt};
  this.evidence.push(result);return result;
 }
 worldSnapshot({generationId=null}={}){const state=generationId?this.worldAtGeneration(generationId):currentWorld(this.store);const generation=generationId?this.store.loadGeneration(generationId):this.store.currentGeneration();return{format:'rncs.world-snapshot.v0.1',generation_id:generation.generationId,revision:generation.realityRevision,state_root:root(state),state};}
 materializeRSR({generationId=null}={}){const state=generationId?this.worldAtGeneration(generationId):currentWorld(this.store);const config=worldConfigFromState(state);return{format:'rncs.rsr-materialization.v0.2',generation_id:generationId??this.store.currentGeneration().generationId,world_id:config.worldId,physical_entity_count:config.bodies.length,config,materialization_root:rfeHash(config)};}
 worldAtGeneration(generationId){return this.store.getFact('world:root','world.snapshot',{generationId})?.value??emptyState();}
 commitBehaviorExecution({registration,behavior,authority,projection,networkHealth}){
  const state=clone(currentWorld(this.store));
  for(const object of state.world.objects??[]){if(object.id==='door:aether')object.state={...(object.state??{}),open:Boolean(behavior.state.entities.door.variables.open)};if(object.id==='lamp:blue-energy')object.state={...(object.state??{}),intensity:behavior.state.entities.lamp.variables.intensity};}
  state.world.runtime={...(state.world.runtime??{}),ambient_sound:behavior.state.globals.ambient_sound,last_event:{type:'player.entered-zone',behavior_id:registration.behavior_id,authority_root:authority.stateRoot,presentation_root:projection.frameRoot,at:now()}};
  const commit=this.store.commit({actor:'subject:behavior-runtime',intent:{kind:'execute-reality-behavior',behavior_id:registration.behavior_id,event:'player.entered-zone'},authority:{status:'approved',resolver:'reality-behavior-fabric',program_root:registration.program_root},operations:[{op:'setFact',fact:{subject:'world:root',predicate:'world.snapshot',value:state}},{op:'setFact',fact:{subject:registration.behavior_id,predicate:'behavior.last_execution',value:{causal_delta:behavior.delta,trace:behavior.trace,provider_calls:registration.provider_calls,authority_root:authority.stateRoot,presentation_root:projection.frameRoot,network_converged:networkHealth.clients.blue.clientStateRoot===networkHealth.server.stateRoot&&networkHealth.clients.red.clientStateRoot===networkHealth.server.stateRoot}}}],evidence:[{kind:'behavior-causal-delta',root:root(behavior.delta)},{kind:'rsr-authority-frame',root:authority.stateRoot},{kind:'vsr-presentation-frame',root:projection.frameRoot},{kind:'network-two-client-convergence',root:root(networkHealth)}]});
  return {generation:commit.generation,receipt:commit.receipt,state};
 }
 async runLoopback({ticks=28,sessionId=`session:aether-island:${Date.now()}`}={}){const state=currentWorld(this.store);if(state.world.world_id!=='world:aether-island')throw new Error('FORMAL_WORLD_NOT_COMMITTED');const config=worldConfigFromState(state);await this.network.createSession({sessionId,worldConfig:config,network:{seed:707,fixedLatencyTicks:1,jitterTicks:1}});await this.network.joinSession({sessionId,subjectId:'subject:blue',playerId:'blue',characterId:'character:blue',bodyId:'player-blue'});await this.network.joinSession({sessionId,subjectId:'subject:red',playerId:'red',characterId:'character:red',bodyId:'player-red'});const before=this.network.pullSnapshot({sessionId,reason:'before-loopback'}),sensor={center:{x:-1200,z:-1200},halfExtents:{x:700,z:700}};let enteredPosition=null;const captureEntry=packet=>{const candidate=packet.objects.find(x=>x.objectId==='player-blue');if(candidate&&Math.abs(candidate.position.x-sensor.center.x)<=sensor.halfExtents.x&&Math.abs(candidate.position.z-sensor.center.z)<=sensor.halfExtents.z)enteredPosition=clone(candidate.position);};captureEntry(before);for(let i=0;i<ticks;i++){this.network.submitInput({sessionId,playerId:'blue',command:{type:'move',x:1000000,z:0}});if(i%2===0)this.network.submitInput({sessionId,playerId:'red',command:{type:'move',x:-500000,z:0}});const tickResult=this.network.advanceServerTick({sessionId});captureEntry(tickResult.snapshot);}for(let i=0;i<8;i++){const tickResult=this.network.advanceServerTick({sessionId});captureEntry(tickResult.snapshot);}const ctx=this.network.require(sessionId);let authority=ctx.server.pullSnapshot('before-behavior');const blue=authority.objects.find(x=>x.objectId==='player-blue');if(!enteredPosition)throw new Error(`SENSOR_ZONE_NOT_ENTERED:${JSON.stringify(blue?.position)}`);const registration=this.behaviors.get('behavior:aether-island-sensor-v1');if(!registration)throw new Error('BEHAVIOR_NOT_REGISTERED');const behavior=triggerAetherIslandBehavior(registration,{player_id:'blue',zone_id:'zone:door-sensor',authority_position:enteredPosition});ctx.server.rsrWorld.step([{id:'command:open-aether-door',tick:ctx.server.rsrWorld.tick+1,type:'teleport',bodyId:'door:aether',position:{x:0,y:2600,z:0}}]);ctx.server.lastSnapshot=ctx.server.rsrWorld.snapshot();ctx.server.snapshots.set(ctx.server.rsrWorld.tick,ctx.server.lastSnapshot);ctx.server.authorityHistory.push(ctx.server.lastSnapshot);authority=ctx.server.pullSnapshot('behavior-authority-update');for(const playerId of ['blue','red'])ctx.clients.get(playerId).reconcile(authority);const health=this.network.getSessionHealth({sessionId});const temporal=new TemporalPresentationBuffer({interpolationDelayTicks:1,maximumExtrapolationTicks:4});temporal.push(networkPacketToTemporalState(before));temporal.push(networkPacketToTemporalState(authority));const frame=temporal.sampleFrame(authority.tick);const projectedBlue=frame.objects.find(x=>x.objectId==='player-blue');const authorityBlue=authority.objects.find(x=>x.objectId==='player-blue');const correction=projectedBlue&&authorityBlue?createTemporalCorrectionPlan(projectedBlue,{...authorityBlue,rotationDeg:authorityBlue.rotationDeg??authorityBlue.rotation??{x:0,y:0,z:0},angularVelocityDeg:authorityBlue.angularVelocityDeg??{x:0,y:0,z:0}},{softThreshold:10,snapThreshold:4000,blendTicks:4}):null;const rfeEvent=this.commitBehaviorExecution({registration,behavior,authority,projection:frame,networkHealth:health});const result={format:'rncs.aether-island-loopback-evidence.v0.2',session_id:sessionId,clients:['blue','red'],ticks:authority.tick,sensor_entered:true,door_state:behavior.state.entities.door.variables.open,light_intensity:behavior.state.entities.lamp.variables.intensity,ambient_sound:behavior.state.globals.ambient_sound,behavior:{behavior_id:registration.behavior_id,version:registration.version,program_root:registration.program_root,causal_delta:behavior.delta,provider_calls:clone(registration.provider_calls)},authority:{state_root:authority.stateRoot,position:authorityBlue?.position,door_position:authority.objects.find(x=>x.objectId==='door:aether')?.position,rsr_protocol:authority.rsrAuthorityProtocol},network:{latency_ticks:1,client_blue_root:health.clients.blue.clientStateRoot,client_red_root:health.clients.red.clientStateRoot,server_root:health.server.stateRoot,converged:health.clients.blue.clientStateRoot===health.server.stateRoot&&health.clients.red.clientStateRoot===health.server.stateRoot},projection:{presentation_root:frame.frameRoot,authority_root:frame.authorityStateRoot,position:projectedBlue?.position,interpolation_delay_ticks:1,correction_state:correction?.mode??'none',authority_presentation_separated:frame.frameRoot!==frame.authorityStateRoot},rfe_event:{generation_id:rfeEvent.generation.generationId,revision:rfeEvent.generation.realityRevision,state_root:rfeEvent.generation.integrityHash,evidence_root:rfeEvent.generation.evidenceRoot,receipt_root:rfeEvent.receipt.integrityHash},evidence_root:root({authority,frame,behavior:behavior.delta,health,rfe:rfeEvent.receipt.integrityHash})};this.sessions.set(sessionId,result);return result;}
 history(){const dir=path.join(this.storePath,'generations');return fs.readdirSync(dir).filter(x=>!x.startsWith('.')).map(x=>this.store.loadGeneration(decodeURIComponent(x))).sort((a,b)=>a.realityRevision-b.realityRevision).map(g=>({generation_id:g.generationId,revision:g.realityRevision,state_root:g.integrityHash,semantic_root:g.semanticRoot,evidence_root:g.evidenceRoot,parent:g.parentGenerationId,world:this.worldAtGeneration(g.generationId).world.world_id}));}
 restoreGeneration({generationId,reason='rollback',subjectId='subject:aetherworld-user',approvalRoles=['owner','security']}={}){const target=this.store.loadGeneration(generationId);const state=this.worldAtGeneration(generationId);const action=reason==='replay'?'replay_generation':'rollback_generation';const req={action,scope:reason==='replay'?'rfe.replay':'rfe.rollback',risk_level:'high'};const authPlan={plan_id:id('plan:restore',{generationId,reason}),source:{text:`${reason}:${generationId}`},subject:{subject_id:subjectId,roles:approvalRoles},candidate_branch:{baseline_generation:this.store.currentGeneration().realityRevision},world_state_changes:[{op:'set',path:'world.snapshot',value:state}]};const authority=authorizeRequirement(authPlan,req,approvalRoles);if(authority.status!=='approved')throw new Error(`AAF_${action.toUpperCase()}_${authority.status.toUpperCase()}`);const result=this.store.commit({actor:subjectId,intent:{kind:reason,target_generation:generationId},authority:{status:'approved',resolver:'aaf:authority-fabric:v0.1',decision_root:authority.evidence.decision_root},operations:[{op:'setFact',fact:{subject:'world:root',predicate:'world.snapshot',value:state}},{op:'setFact',fact:{subject:'world:root',predicate:'world.restore_source',value:{generation_id:generationId,state_root:target.integrityHash,reason}}}],evidence:[{kind:'generation-restore',target:generationId},{kind:'aaf-decision',root:authority.evidence.decision_root,action}]});return{restored_from:generationId,new_generation:result.generation,state,receipt:result.receipt,authority};}
 rollbackGeneration(payload={}){return this.restoreGeneration({...payload,reason:'rollback'});}
 replayGeneration(payload={}){return this.restoreGeneration({...payload,reason:'replay'});}
 worldStatus(){this.refreshStore();const g=this.store.currentGeneration(),state=currentWorld(this.store),sessions=[...this.sessions.values()];return{generation:g.generationId,revision:g.realityRevision,state_root:g.integrityHash,evidence_root:g.evidenceRoot,world_id:state.world.world_id,object_count:state.world.objects?.length??0,behavior_count:state.world.behaviors?.length??0,physical_entity_count:state.world.world_id==='world:aether-island'?worldConfigFromState(state).bodies.length:0,online_subjects:sessions.at(-1)?.clients?.length??0,network_status:sessions.length?'active':'idle'};}
 async runEndToEnd({source='创建一座小型以太岛。岛上有两个玩家出生点、一扇可开关的门、一盏蓝色能量灯和一个感应区域。玩家进入感应区域时，门自动打开，灯光增强并产生环境声音。两个客户端必须看到一致的门状态和玩家位置。'}={}){const before=this.store.currentGeneration();const plan=this.compile({source});const candidate=this.createCandidate({plan});const simulation=await this.simulateCandidate({candidateId:candidate.candidate_id});const authority=this.authorizeCandidate({candidateId:candidate.candidate_id,approvalRoles:['owner','security']});const behavior=this.registerBehavior({candidateId:candidate.candidate_id});const merge=await this.mergeCandidate({candidateId:candidate.candidate_id});const loopback=await this.runLoopback();const rollback=this.rollbackGeneration({generationId:before.generationId});const afterRollback=this.worldStatus();const replay=this.replayGeneration({generationId:merge.generation.generationId});const afterReplay=this.worldStatus();return{format:'rncs.aetherworld-native-e2e.v0.2',plan,candidate,simulation,authority,behavior,merge,loopback,rollback:{new_generation:rollback.new_generation,world:afterRollback.world_id,authority:rollback.authority},replay:{new_generation:replay.new_generation,world:afterReplay.world_id,authority:replay.authority},history:this.history(),acceptance:{compiled:validateCompilationPlan(plan).valid,candidate_created:true,simulated:simulation.execution_receipt.status==='completed',authorized:authority.decisions.filter(x=>x.action!=='delete_world_object').every(x=>x.status==='approved'),behavior_registered:behavior.enabled,rfe_generation:merge.generation.realityRevision>before.realityRevision,rsr_materialized:this.materializeRSR().physical_entity_count>0,two_clients_converged:loopback.network.converged,authority_projection_separated:loopback.projection.authority_presentation_separated,rollback_empty:afterRollback.world_id==='world:empty',replay_restored:afterReplay.world_id==='world:aether-island'},evidence_root:root({merge:merge.evidence,loopback:loopback.evidence_root})};}
 async invoke(action,payload={}){if(action==='health')return this.health();if(typeof this[action]!=='function')throw new Error(`ACTION_NOT_SUPPORTED:${action}`);return this[action](payload);}
}
function candidateRecordSeal(record){const unsigned=clone(record);delete unsigned.record_seal;return root(unsigned);}
function sealCandidateRecord(record){const sealed={...record};sealed.record_seal=candidateRecordSeal(sealed);return sealed;}
function assertCandidateRecordSeal(record){if(typeof record?.record_seal!=='string')throw Object.assign(new Error('CANDIDATE_RECORD_SEAL_REQUIRED'),{code:'CANDIDATE_RECORD_SEAL_REQUIRED'});const actual=candidateRecordSeal(record);if(actual!==record.record_seal)throw Object.assign(new Error('CANDIDATE_RECORD_SEAL_MISMATCH'),{code:'CANDIDATE_RECORD_SEAL_MISMATCH',details:{candidateId:record.candidate_id,expected:record.record_seal,actual}});return record;}
const nativeLoadCandidates=AetherworldRNCSNativeRuntime.prototype.loadCandidates;
AetherworldRNCSNativeRuntime.prototype.loadCandidates=function(){
 if(fs.existsSync(this.candidateStorePath)){
  const records=JSON.parse(fs.readFileSync(this.candidateStorePath,'utf8'));
  if(!Array.isArray(records))throw Object.assign(new Error('CANDIDATE_STORE_INVALID'),{code:'CANDIDATE_STORE_INVALID'});
  for(const record of records)assertCandidateRecordSeal(record);
 }
 return nativeLoadCandidates.call(this);
};
const nativePersistCandidates=AetherworldRNCSNativeRuntime.prototype.persistCandidates;
AetherworldRNCSNativeRuntime.prototype.persistCandidates=function(){
 for(const record of this.candidates.values())Object.assign(record,sealCandidateRecord(record));
 return nativePersistCandidates.call(this);
};
const nativeRequireCandidate=AetherworldRNCSNativeRuntime.prototype.requireCandidate;
AetherworldRNCSNativeRuntime.prototype.requireCandidate=function(candidateId){return assertCandidateRecordSeal(nativeRequireCandidate.call(this,candidateId));};
const nativeMergeCandidate=AetherworldRNCSNativeRuntime.prototype.mergeCandidate;
AetherworldRNCSNativeRuntime.prototype.mergeCandidate=async function(payload={}){
 const result=await nativeMergeCandidate.call(this,payload);
 const record=this.requireCandidate(payload.candidateId);
 if(record.plan?.source?.language==='RCL'){
  const evidenceRoot=record.plan.source.rcl_authority_evidence_root??null;
  const evidence={...(result.evidence?.rcl_native_evidence??{}),authority_evidence_root:evidenceRoot,authority_continuity_verified:Boolean(record.plan.rcl_authority_evidence)};
  result.evidence={...result.evidence,rcl_native_evidence:evidence};
  if(record.merge?.evidence){record.merge.evidence.rcl_native_evidence=evidence;this.persistCandidates();}
 }
 return result;
};
export const createNativeRuntime=options=>new AetherworldRNCSNativeRuntime(options);
