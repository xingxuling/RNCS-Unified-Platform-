import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';
import {readInvocationReceipts} from './receipts.mjs';
import {EXECUTION_TOOL_CATALOG,registerExecutionTools} from './execution-tools.mjs';
import {compileRclSource} from '@taowind/rncs-rcl-control-plane';

const objectPayload=z.object({}).passthrough();
const resultSchema=z.object({ok:z.boolean(),result:objectPayload});
const json=value=>JSON.stringify(value,null,2);
const normalizeObject=value=>{
 if(Array.isArray(value))return{count:value.length,items:value};
 if(value!==null&&typeof value==='object')return value;
 return{value};
};
const regularResult=value=>{
 const result=normalizeObject(value);
 const envelope={ok:true,result};
 return{structuredContent:envelope,content:[{type:'text',text:json(envelope)}]};
};
const failure=error=>({
 isError:true,
 content:[{type:'text',text:json({ok:false,error:{code:error?.code??'TOOL_ERROR',message:error?.message??String(error),details:error?.details}})}]
});
const safe=handler=>async(args,extra)=>{try{return await handler(args,extra);}catch(error){return failure(error);}};
const readAnnotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const candidateAnnotations={readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:false};
const authorityAnnotations={readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:false};
const destructiveAnnotations={readOnlyHint:false,destructiveHint:true,idempotentHint:false,openWorldHint:false};

export const TOOL_CATALOG=Object.freeze([
 {name:'taowind_server_info',level:'read'},
 {name:'search',level:'read'},
 {name:'fetch',level:'read'},
 {name:'rncs_list_runtimes',level:'read'},
 {name:'rncs_runtime_health',level:'read'},
 {name:'rncs_world_status',level:'read'},
 {name:'rncs_compile_plan',level:'read'},
 {name:'rncs_rcl_compile_execute',level:'read'},
 {name:'rncs_rcl_authority_workflow',level:'founder'},
 {name:'rncs_validate_plan',level:'read'},
 {name:'rncs_create_candidate',level:'candidate'},
 {name:'rncs_get_candidate',level:'read'},
 {name:'rncs_diff_candidate',level:'read'},
 {name:'rncs_simulate_candidate',level:'candidate'},
 {name:'rncs_candidate_workflow',level:'candidate'},
 {name:'rncs_history',level:'read'},
 {name:'rncs_invocation_receipts',level:'read'},
 {name:'rncs_authorize_candidate',level:'authority'},
 {name:'rncs_reject_candidate',level:'authority'},
 {name:'rncs_register_behavior',level:'authority'},
 {name:'rncs_set_behavior_enabled',level:'authority'},
 {name:'rncs_update_behavior',level:'authority'},
 {name:'rncs_merge_candidate',level:'founder'},
 {name:'rncs_materialize_rsr',level:'read'},
 {name:'rncs_run_loopback',level:'founder'},
 {name:'rncs_rollback_generation',level:'founder'},
 {name:'rncs_replay_generation',level:'founder'},
 {name:'rncs_authoritative_workflow',level:'founder'},
 {name:'rncs_runtime_action',level:'founder'},
 ...EXECUTION_TOOL_CATALOG
]);

export function getToolCatalog(config={}){
 return TOOL_CATALOG.filter(tool=>{
  if(tool.level==='read')return true;
  if(tool.level==='candidate')return Boolean(config.candidateWritesEnabled);
  if(tool.level==='authority'||tool.level==='founder')return Boolean(config.authorityWritesEnabled);
  if(tool.level==='execution-read'||tool.level==='execution'||tool.level==='provider')return Boolean(config.executionToolsEnabled);
  if(tool.level==='breakglass')return Boolean(config.executionShellEnabled);
  return false;
 });
}

const registerRegular=(server,name,config,handler)=>server.registerTool(
 name,
 {...config,outputSchema:resultSchema},
 safe(async(args,extra)=>regularResult(await handler(args,extra)))
);
const native=(gateway,action,payload={},options={})=>gateway.invoke('rncs.aetherworld-native',action,payload,options);
const stateRootSchema=z.string().regex(/^[a-f0-9]{64}$/i);
const approvalRolesSchema=z.array(z.string().min(1).max(64)).min(1).max(10);
const compactCandidateWorkflow=({plan,candidate,simulation,diff})=>({
 plan:{plan_id:plan.plan_id,source_root:plan.source?.source_root,language:plan.source?.language,artifact_count:plan.artifacts?.length??0,behavior_count:plan.behaviors?.length??0,acceptance_rules:plan.acceptance_rules},
 candidate:{candidate_id:candidate.candidate_id,status:candidate.status,baseline_generation:candidate.baseline_generation,baseline_revision:candidate.baseline_revision,baseline_root:candidate.baseline_root,impact_objects:candidate.impact_objects,risks:candidate.risks,rollback_point:candidate.rollback_point},
 simulation:{status:simulation.execution_receipt?.status,evidence_root:simulation.evidence_root,receipt_root:simulation.execution_receipt?.receipt_root??simulation.execution_receipt?.integrity_hash,comparison:simulation.comparison},
 diff
});
const assertCandidateEnabled=config=>{
 if(!config.candidateWritesEnabled)throw Object.assign(new Error('Candidate write tools are disabled by server policy.'),{code:'CANDIDATE_WRITES_DISABLED'});
};
const assertAuthorityEnabled=config=>{
 if(!config.authorityWritesEnabled)throw Object.assign(new Error('Authority write tools are disabled by server policy.'),{code:'AUTHORITY_WRITES_DISABLED'});
};
const assertExpectedState=async(gateway,config,{expected_state_root,expected_revision}={},action='authoritative action')=>{
 const current=await native(gateway,'worldStatus',{});
 if(config.requireStatePreconditions&&(expected_state_root===undefined||expected_revision===undefined)){
  throw Object.assign(new Error(`${action} requires expected_state_root and expected_revision from rncs_world_status.`),{code:'AUTHORITY_PRECONDITION_REQUIRED',details:{current}});
 }
 if(expected_state_root!==undefined&&current.state_root!==expected_state_root){
  throw Object.assign(new Error(`${action} rejected because state_root changed.`),{code:'STATE_ROOT_MISMATCH',details:{expected:expected_state_root,current:current.state_root}});
 }
 if(expected_revision!==undefined&&current.revision!==expected_revision){
  throw Object.assign(new Error(`${action} rejected because revision changed.`),{code:'REVISION_MISMATCH',details:{expected:expected_revision,current:current.revision}});
 }
 return current;
};
const assertUnchanged=(before,after,action='workflow')=>{
 if(before.revision!==after.revision||before.state_root!==after.state_root){
  throw Object.assign(new Error(`${action} observed an authoritative state change before commit.`),{code:'AUTHORITY_INVARIANT_VIOLATION',details:{before,after}});
 }
};
const readLikeRuntimeActions=new Set([
 'health','status','materialize','verify','validate','root','inspect','getSessionHealth','pullSnapshot','pullDelta',
 'worldStatus','history','getCandidate','diffCandidate','materializeRSR','validatePlan'
]);

export function createTaoWindMcpServer({gateway,knowledge,config}){
 const tools=getToolCatalog(config);
 const profile=config.authorityWritesEnabled?'founder-authority':config.candidateWritesEnabled?'candidate':'read';
 const instructions=config.authorityWritesEnabled
  ?'TaoWind Reality MCP is a private founder-authority and engineering-execution entry to RNCS + Aetherworld. It can manage candidates and Generations, modify the bound project workspace, run builds and tests, operate GitHub/Vercel provider adapters, execute RSR simulations and VSR renders, and roll failed engineering workflows back. Break-glass shell exists only in explicitly enabled founder-unrestricted mode.'
  :'TaoWind Reality MCP is the candidate-safe ChatGPT entry to RNCS + Aetherworld. Prefer read tools first. Candidate tools may create and simulate isolated branches but cannot authorize, merge, rollback, replay, publish, execute shell commands, or write the authoritative world.';
 const server=new McpServer({name:'taowind-reality-mcp',version:config.version},{instructions});

 registerRegular(server,'taowind_server_info',{
  title:'TaoWind Reality MCP Server Info',
  description:'Return server version, deployment profile, authority boundary, knowledge index state, and exposed tools.',
  inputSchema:{},annotations:readAnnotations
 },async()=>({
  name:config.name,version:config.version,mcp_path:config.mcpPath,auth_mode:config.authMode,authority_profile:profile,
  safety_boundary:{read_tools:true,candidate_tools:config.candidateWritesEnabled,authority_tools:config.authorityWritesEnabled,declared_runtime_actions:config.authorityWritesEnabled,execution_tools:config.executionToolsEnabled,project_workspace_access:config.executionToolsEnabled,provider_writes:config.executionToolsEnabled,breakglass_shell:config.executionShellEnabled,state_preconditions:config.requireStatePreconditions},
  execution:{mode:config.executionMode,provider:config.executionProvider},
  founder_subject_id:config.authorityWritesEnabled?config.founderSubjectId:undefined,
  knowledge:knowledge.stats(),tool_count:tools.length,tools
 }));

 server.registerTool('search',{
  title:'Search TaoWind Knowledge',
  description:'Search authoritative RNCS/Aetherworld documentation, runtime manifests, release manifests, and verification reports.',
  inputSchema:{query:z.string().min(1).max(500),limit:z.number().int().min(1).max(20).optional()},
  outputSchema:z.object({results:z.array(z.object({id:z.string(),title:z.string(),url:z.string(),snippet:z.string().optional(),metadata:z.record(z.any()).optional()}))}),
  annotations:readAnnotations
 },safe(async({query,limit=8})=>{const value={results:knowledge.search(query,{limit})};return{structuredContent:value,content:[{type:'text',text:json(value)}]};}));

 server.registerTool('fetch',{
  title:'Fetch TaoWind Artifact',
  description:'Fetch a document returned by search using its opaque artifact id. Arbitrary filesystem paths are not accepted.',
  inputSchema:{id:z.string().min(1).max(200)},
  outputSchema:z.object({id:z.string(),title:z.string(),text:z.string(),url:z.string(),metadata:z.record(z.any()).optional()}),
  annotations:readAnnotations
 },safe(async({id})=>{const value=knowledge.fetch(id);return{structuredContent:value,content:[{type:'text',text:json(value)}]};}));

 registerRegular(server,'rncs_list_runtimes',{
  title:'List RNCS Runtimes',
  description:'List dynamically discovered Reality One Gateway runtimes, versions, declared actions, protocols, and dependency order.',
  inputSchema:{runtime_id:z.string().optional()},annotations:readAnnotations
 },async({runtime_id})=>{
  if(!gateway.registry)await gateway.discover();
  const registry=gateway.registry;
  const runtimes=runtime_id?registry.runtimes.filter(item=>item.runtime_id===runtime_id):registry.runtimes;
  return{format:registry.format,gateway_protocol:registry.gateway_protocol,registry_root:registry.registry_root,total_runtime_count:registry.runtimes.length,runtime_count:runtimes.length,runtime_order:registry.runtime_order.filter(id=>!runtime_id||id===runtime_id),runtimes};
 });

 registerRegular(server,'rncs_runtime_health',{
  title:'Check RNCS Runtime Health',description:'Run health checks for all discovered runtimes or one named runtime.',
  inputSchema:{runtime_id:z.string().optional()},annotations:readAnnotations
 },async({runtime_id})=>runtime_id?gateway.invoke(runtime_id,'health',{}):gateway.health());

 registerRegular(server,'rncs_world_status',{
  title:'Read Authoritative World Status',description:'Read the current formal Aetherworld generation, revision, state root, object counts, and network status without changing it.',
  inputSchema:{},annotations:readAnnotations
 },async()=>native(gateway,'worldStatus',{}));

 registerRegular(server,'rncs_compile_plan',{
  title:'Compile World Manufacturing Plan',description:'Compile Chinese natural language, CSL, or IAL into an RNCS compilation plan. Compilation is read-only.',
  inputSchema:{source:z.string().min(4).max(20_000),language:z.enum(['NATURAL_LANGUAGE','CSL','IAL']).optional(),subject_id:z.string().min(3).max(200).optional()},annotations:readAnnotations
 },async({source,language='NATURAL_LANGUAGE',subject_id=config.founderSubjectId})=>native(gateway,'compile',{source,language,subjectId:subject_id},{idempotencyKey:`compile:${language}:${subject_id}:${source}`}));

 registerRegular(server,'rncs_rcl_compile_execute',{
  title:'Compile and Execute RCL Natively',
  description:'Compile an RCL source program with the current RNCS RCL runtime, execute its RBC in the native VM, and optionally verify reference/native parity. This is read-only and never merges state into RNCS.',
  inputSchema:{source:z.string().min(1).max(20_000),verify_parity:z.boolean().optional(),timeout_ms:z.number().int().min(100).max(120_000).optional()},annotations:readAnnotations
 },async({source,verify_parity=true,timeout_ms=30_000})=>compileRclSource(source,{verifyParity:verify_parity,timeout:timeout_ms}));

 registerRegular(server,'rncs_validate_plan',{
  title:'Validate RNCS Compilation Plan',description:'Validate a previously compiled RNCS plan against the native runtime contract.',
  inputSchema:{plan:z.record(z.any())},annotations:readAnnotations
 },async({plan})=>native(gateway,'validatePlan',{plan}));

 if(config.candidateWritesEnabled){
  registerRegular(server,'rncs_create_candidate',{
   title:'Create Candidate Reality',description:'Create an isolated candidate branch from a valid plan.',
   inputSchema:{plan:z.record(z.any())},annotations:candidateAnnotations
  },async({plan})=>{assertCandidateEnabled(config);return native(gateway,'createCandidate',{plan},{idempotencyKey:`candidate:${plan.plan_id??json(plan)}`});});

  registerRegular(server,'rncs_simulate_candidate',{
   title:'Simulate Candidate Reality',description:'Run an isolated simulation and evidence generation for a candidate branch.',
   inputSchema:{candidate_id:z.string().min(1).max(300)},annotations:candidateAnnotations
  },async({candidate_id})=>{assertCandidateEnabled(config);return native(gateway,'simulateCandidate',{candidateId:candidate_id},{idempotencyKey:`simulate:${candidate_id}`});});

  registerRegular(server,'rncs_candidate_workflow',{
   title:'Compile, Branch, and Simulate',description:'Compile a request, create a candidate branch, simulate it, and return the diff without changing formal state.',
   inputSchema:{source:z.string().min(4).max(20_000),language:z.enum(['NATURAL_LANGUAGE','CSL','IAL']).optional(),subject_id:z.string().min(3).max(200).optional()},annotations:candidateAnnotations
  },async({source,language='NATURAL_LANGUAGE',subject_id=config.founderSubjectId})=>{
   assertCandidateEnabled(config);
   const before=await native(gateway,'worldStatus',{});
   const plan=await native(gateway,'compile',{source,language,subjectId:subject_id},{idempotencyKey:`workflow-compile:${language}:${subject_id}:${source}`});
   const candidate=await native(gateway,'createCandidate',{plan},{idempotencyKey:`workflow-candidate:${plan.plan_id}`});
   const simulation=await native(gateway,'simulateCandidate',{candidateId:candidate.candidate_id},{idempotencyKey:`workflow-simulate:${candidate.candidate_id}`});
   const diff=await native(gateway,'diffCandidate',{candidateId:candidate.candidate_id});
   const after=await native(gateway,'worldStatus',{});
   assertUnchanged(before,after,'candidate workflow');
   return{...compactCandidateWorkflow({plan,candidate,simulation,diff}),authority_invariant:{unchanged:true,before:{revision:before.revision,state_root:before.state_root},after:{revision:after.revision,state_root:after.state_root}}};
  });
 }

 registerRegular(server,'rncs_get_candidate',{
  title:'Read Candidate Reality',description:'Read a candidate branch by candidate id.',
  inputSchema:{candidate_id:z.string().min(1).max(300)},annotations:readAnnotations
 },async({candidate_id})=>native(gateway,'getCandidate',{candidateId:candidate_id}));

 registerRegular(server,'rncs_diff_candidate',{
  title:'Diff Candidate Reality',description:'Compare a candidate branch with its authoritative baseline.',
  inputSchema:{candidate_id:z.string().min(1).max(300)},annotations:readAnnotations
 },async({candidate_id})=>native(gateway,'diffCandidate',{candidateId:candidate_id}));

 registerRegular(server,'rncs_history',{
  title:'Read RNCS Generation History',description:'Read authoritative Aetherworld generation history and evidence roots.',
  inputSchema:{},annotations:readAnnotations
 },async()=>{const generations=await native(gateway,'history',{});return{generation_count:generations.length,generations};});

 registerRegular(server,'rncs_invocation_receipts',{
  title:'Read Gateway Invocation Receipts',description:'Read recent Reality One Gateway invocation receipts from the MCP gateway journal.',
  inputSchema:{limit:z.number().int().min(1).max(100).optional()},annotations:readAnnotations
 },async({limit=20})=>{const receipts=readInvocationReceipts(config.dataDir,{limit});return{receipt_count:receipts.length,receipts};});

 registerRegular(server,'rncs_materialize_rsr',{
  title:'Materialize Formal World to RSR',description:'Materialize the current or selected formal Generation into an RSR configuration without changing formal state.',
  inputSchema:{generation_id:z.string().min(1).max(300).optional()},annotations:readAnnotations
 },async({generation_id})=>native(gateway,'materializeRSR',{generationId:generation_id??null}));

 if(config.authorityWritesEnabled){
  registerRegular(server,'rncs_rcl_authority_workflow',{
   title:'Execute RCL as Authoritative RNCS State',
   description:'Compile RCL natively, verify reference/native parity, create and simulate an RNCS candidate, obtain AAF decisions, and optionally commit the resulting state through RFE. Requires fresh RNCS state preconditions for commit.',
   inputSchema:{source:z.string().min(1).max(20_000),commit:z.boolean().optional(),approval_roles:approvalRolesSchema.optional(),subject_id:z.string().min(3).max(200).optional(),roles:approvalRolesSchema.optional(),expected_state_root:stateRootSchema.optional(),expected_revision:z.number().int().min(0).optional(),verify_parity:z.boolean().optional(),timeout_ms:z.number().int().min(100).max(120_000).optional()},annotations:destructiveAnnotations
  },async({source,commit=true,approval_roles=config.founderApprovalRoles,subject_id=config.founderSubjectId,roles,expected_state_root,expected_revision,verify_parity=true,timeout_ms=30_000})=>{
   assertAuthorityEnabled(config);
   const before=await assertExpectedState(gateway,config,{expected_state_root,expected_revision},'RCL authority workflow');
   const result=await gateway.invoke('rncs.rcl-control','authorityWorkflow',{source,commit,approvalRoles:approval_roles,subjectId:subject_id,roles,expectedStateRoot:before.state_root,expectedRevision:before.revision,verifyParity:verify_parity,timeout:timeout_ms},{idempotencyKey:`rcl-authority:${source}:${before.state_root}:${commit}`});
   return{...result,authority_invariant:{before_state_root:before.state_root,before_revision:before.revision,commit_requested:commit}};
  });

  registerRegular(server,'rncs_authorize_candidate',{
   title:'Authorize Candidate Reality',description:'Issue AAF authority decisions for a simulated candidate using private founder roles.',
   inputSchema:{candidate_id:z.string().min(1).max(300),approval_roles:approvalRolesSchema.optional()},annotations:authorityAnnotations
  },async({candidate_id,approval_roles=config.founderApprovalRoles})=>{assertAuthorityEnabled(config);return native(gateway,'authorizeCandidate',{candidateId:candidate_id,approvalRoles:approval_roles});});

  registerRegular(server,'rncs_reject_candidate',{
   title:'Reject Candidate Reality',description:'Reject an isolated candidate and prevent it from being merged.',
   inputSchema:{candidate_id:z.string().min(1).max(300),reason:z.string().min(1).max(500).optional()},annotations:authorityAnnotations
  },async({candidate_id,reason='rejected-by-founder'})=>{assertAuthorityEnabled(config);return native(gateway,'rejectCandidate',{candidateId:candidate_id,reason});});

  registerRegular(server,'rncs_register_behavior',{
   title:'Register Candidate Behavior',description:'Register the candidate behavior program after AAF authorization.',
   inputSchema:{candidate_id:z.string().min(1).max(300)},annotations:authorityAnnotations
  },async({candidate_id})=>{assertAuthorityEnabled(config);return native(gateway,'registerBehavior',{candidateId:candidate_id});});

  registerRegular(server,'rncs_set_behavior_enabled',{
   title:'Enable or Disable Behavior',description:'Enable or disable a registered behavior program in the native runtime.',
   inputSchema:{behavior_id:z.string().min(1).max(300),enabled:z.boolean()},annotations:authorityAnnotations
  },async({behavior_id,enabled})=>{assertAuthorityEnabled(config);return native(gateway,'setBehaviorEnabled',{behaviorId:behavior_id,enabled});});

  registerRegular(server,'rncs_update_behavior',{
   title:'Update Behavior Program',description:'Hot-reload a registered behavior program. This changes runtime behavior state.',
   inputSchema:{behavior_id:z.string().min(1).max(300),program:z.record(z.any())},annotations:destructiveAnnotations
  },async({behavior_id,program})=>{assertAuthorityEnabled(config);return native(gateway,'updateBehavior',{behaviorId:behavior_id,program});});

  registerRegular(server,'rncs_merge_candidate',{
   title:'Merge Candidate into Formal World',description:'Merge an authorized and simulated candidate into the authoritative RFE world. Requires current state root and revision.',
   inputSchema:{candidate_id:z.string().min(1).max(300),expected_state_root:stateRootSchema.optional(),expected_revision:z.number().int().min(0).optional()},annotations:destructiveAnnotations
  },async({candidate_id,expected_state_root,expected_revision})=>{
   assertAuthorityEnabled(config);
   const before=await assertExpectedState(gateway,config,{expected_state_root,expected_revision},'merge candidate');
   const merge=await native(gateway,'mergeCandidate',{candidateId:candidate_id},{idempotencyKey:`merge:${candidate_id}:${before.state_root}`});
   const after=await native(gateway,'worldStatus',{});
   return{before,merge,after,changed:before.state_root!==after.state_root&&after.revision>before.revision};
  });

  registerRegular(server,'rncs_run_loopback',{
   title:'Run Authoritative Two-Client Loopback',description:'Run the native two-client world loopback and commit behavior evidence to RFE. Requires current state root and revision.',
   inputSchema:{ticks:z.number().int().min(1).max(10_000).optional(),session_id:z.string().min(1).max(300).optional(),expected_state_root:stateRootSchema.optional(),expected_revision:z.number().int().min(0).optional()},annotations:destructiveAnnotations
  },async({ticks=28,session_id,expected_state_root,expected_revision})=>{
   assertAuthorityEnabled(config);
   const before=await assertExpectedState(gateway,config,{expected_state_root,expected_revision},'run loopback');
   const loopback=await native(gateway,'runLoopback',{ticks,sessionId:session_id});
   const after=await native(gateway,'worldStatus',{});
   return{before,loopback,after};
  });

  registerRegular(server,'rncs_rollback_generation',{
   title:'Rollback to Generation',description:'Restore a previous Generation as a new authoritative Generation through AAF and RFE.',
   inputSchema:{generation_id:z.string().min(1).max(300),subject_id:z.string().min(3).max(200).optional(),approval_roles:approvalRolesSchema.optional(),expected_state_root:stateRootSchema.optional(),expected_revision:z.number().int().min(0).optional()},annotations:destructiveAnnotations
  },async({generation_id,subject_id=config.founderSubjectId,approval_roles=config.founderApprovalRoles,expected_state_root,expected_revision})=>{
   assertAuthorityEnabled(config);
   const before=await assertExpectedState(gateway,config,{expected_state_root,expected_revision},'rollback generation');
   const rollback=await native(gateway,'rollbackGeneration',{generationId:generation_id,subjectId:subject_id,approvalRoles:approval_roles},{idempotencyKey:`rollback:${generation_id}:${before.state_root}`});
   const after=await native(gateway,'worldStatus',{});
   return{before,rollback,after};
  });

  registerRegular(server,'rncs_replay_generation',{
   title:'Replay Generation',description:'Replay a selected historical Generation as a new authoritative Generation through AAF and RFE.',
   inputSchema:{generation_id:z.string().min(1).max(300),subject_id:z.string().min(3).max(200).optional(),approval_roles:approvalRolesSchema.optional(),expected_state_root:stateRootSchema.optional(),expected_revision:z.number().int().min(0).optional()},annotations:destructiveAnnotations
  },async({generation_id,subject_id=config.founderSubjectId,approval_roles=config.founderApprovalRoles,expected_state_root,expected_revision})=>{
   assertAuthorityEnabled(config);
   const before=await assertExpectedState(gateway,config,{expected_state_root,expected_revision},'replay generation');
   const replay=await native(gateway,'replayGeneration',{generationId:generation_id,subjectId:subject_id,approvalRoles:approval_roles},{idempotencyKey:`replay:${generation_id}:${before.state_root}`});
   const after=await native(gateway,'worldStatus',{});
   return{before,replay,after};
  });

  registerRegular(server,'rncs_authoritative_workflow',{
   title:'Compile, Simulate, Authorize, and Merge',
   description:'Private founder workflow that compiles a request, creates and simulates a candidate, authorizes it, registers behavior when required, and merges it into the formal world. Optionally runs two-client loopback evidence.',
   inputSchema:{source:z.string().min(4).max(20_000),language:z.enum(['NATURAL_LANGUAGE','CSL','IAL']).optional(),subject_id:z.string().min(3).max(200).optional(),approval_roles:approvalRolesSchema.optional(),run_loopback:z.boolean().optional()},annotations:destructiveAnnotations
  },async({source,language='NATURAL_LANGUAGE',subject_id=config.founderSubjectId,approval_roles=config.founderApprovalRoles,run_loopback=false})=>{
   assertAuthorityEnabled(config);
   const before=await native(gateway,'worldStatus',{});
   const plan=await native(gateway,'compile',{source,language,subjectId:subject_id},{idempotencyKey:`authoritative-compile:${language}:${subject_id}:${source}`});
   const candidate=await native(gateway,'createCandidate',{plan},{idempotencyKey:`authoritative-candidate:${plan.plan_id}`});
   const simulation=await native(gateway,'simulateCandidate',{candidateId:candidate.candidate_id},{idempotencyKey:`authoritative-simulate:${candidate.candidate_id}`});
   const authority=await native(gateway,'authorizeCandidate',{candidateId:candidate.candidate_id,approvalRoles:approval_roles});
   const requiredDecisions=(authority.decisions??[]).filter(item=>item.action!=='delete_world_object');
   if(!requiredDecisions.length||!requiredDecisions.every(item=>item.status==='approved'))throw Object.assign(new Error('AAF did not approve all required candidate actions.'),{code:'AAF_APPROVAL_REQUIRED',details:{authority}});
   let behavior=null;
   if(requiredDecisions.some(item=>item.action==='register_behavior'))behavior=await native(gateway,'registerBehavior',{candidateId:candidate.candidate_id});
   const beforeMerge=await native(gateway,'worldStatus',{});
   assertUnchanged(before,beforeMerge,'authoritative workflow');
   const merge=await native(gateway,'mergeCandidate',{candidateId:candidate.candidate_id},{idempotencyKey:`authoritative-merge:${candidate.candidate_id}:${before.state_root}`});
   const afterMerge=await native(gateway,'worldStatus',{});
   let loopback=null;
   if(run_loopback)loopback=await native(gateway,'runLoopback',{});
   const final=run_loopback?await native(gateway,'worldStatus',{}):afterMerge;
   return{format:'taowind.authoritative-workflow.v0.2',before,plan:{plan_id:plan.plan_id,source_root:plan.source?.source_root},candidate:{candidate_id:candidate.candidate_id,baseline_root:candidate.baseline_root},simulation:{status:simulation.execution_receipt?.status,evidence_root:simulation.evidence_root},authority:{summary:authority.summary,authority_root:authority.authority_root},behavior,merge,after_merge:afterMerge,loopback,final,changed:before.state_root!==afterMerge.state_root&&afterMerge.revision>before.revision};
  });

  registerRegular(server,'rncs_runtime_action',{
   title:'Invoke Declared RNCS Runtime Action',
   description:'Founder-only gateway to any action declared by one of the discovered RNCS/Aetherworld runtime manifests. It cannot execute undeclared actions. Project file, build, provider, and optional break-glass shell operations are exposed only through the dedicated Developer Execution Runtime tools and their configured worker boundary.',
   inputSchema:{runtime_id:z.string().min(1).max(200),action:z.string().min(1).max(200),payload:z.record(z.any()).optional(),idempotency_key:z.string().min(1).max(500).optional(),expected_state_root:stateRootSchema.optional(),expected_revision:z.number().int().min(0).optional()},annotations:destructiveAnnotations
  },async({runtime_id,action,payload={},idempotency_key,expected_state_root,expected_revision})=>{
   assertAuthorityEnabled(config);
   if(!gateway.registry)await gateway.discover();
   const manifest=gateway.require(runtime_id);
   if(!manifest.actions.includes(action))throw Object.assign(new Error(`Action ${action} is not declared by ${runtime_id}.`),{code:'RUNTIME_ACTION_NOT_DECLARED'});
   let before=null;
   if(!readLikeRuntimeActions.has(action))before=await assertExpectedState(gateway,config,{expected_state_root,expected_revision},`${runtime_id}:${action}`);
   const result=await gateway.invoke(runtime_id,action,payload,idempotency_key?{idempotencyKey:idempotency_key}:{});
   const after=before?await native(gateway,'worldStatus',{}):null;
   return{runtime_id,action,manifest_version:manifest.runtime_version,before,result:normalizeObject(result),after};
  });
 }

 registerExecutionTools(server,{gateway,config});
 return server;
}
