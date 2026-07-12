import * as z from 'zod';

const objectPayload=z.object({}).passthrough();
const resultSchema=z.object({ok:z.boolean(),result:objectPayload});
const json=value=>JSON.stringify(value,null,2);
const normalizeObject=value=>Array.isArray(value)?{count:value.length,items:value}:value!==null&&typeof value==='object'?value:{value};
const regularResult=value=>{const result=normalizeObject(value);const envelope={ok:true,result};return{structuredContent:envelope,content:[{type:'text',text:json(envelope)}]};};
const failure=error=>({isError:true,content:[{type:'text',text:json({ok:false,error:{code:error?.code??'TOOL_ERROR',message:error?.message??String(error),details:error?.details}})}]});
const safe=handler=>async(args,extra)=>{try{return await handler(args,extra);}catch(error){return failure(error);}};
const register=(server,name,definition,handler)=>server.registerTool(name,{...definition,outputSchema:resultSchema},safe(async(args,extra)=>regularResult(await handler(args,extra))));
const readAnnotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const writeAnnotations={readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:false};
const destructiveAnnotations={readOnlyHint:false,destructiveHint:true,idempotentHint:false,openWorldHint:true};
const stateRootSchema=z.string().regex(/^[a-f0-9]{64}$/i);
const pathSchema=z.string().min(1).max(2_000);
const branchSchema=z.string().min(1).max(200);
const buildProfiles=z.enum(['node-test','node-build','python-test','gradle-test','android-debug','android-release','rncs-mcp-test','rncs-test','rsr-test','rsr-simulate','vsr-test','vsr-render-demo']);

export const EXECUTION_TOOL_CATALOG=Object.freeze([
 {name:'developer_execution_status',level:'execution-read'},
 {name:'workspace_list_files',level:'execution'},
 {name:'workspace_read_file',level:'execution'},
 {name:'workspace_write_file',level:'execution'},
 {name:'workspace_apply_patch',level:'execution'},
 {name:'workspace_remove_path',level:'execution'},
 {name:'workspace_export_artifact',level:'execution'},
 {name:'execution_run_command',level:'execution'},
 {name:'execution_run_shell',level:'breakglass'},
 {name:'execution_run_build',level:'execution'},
 {name:'git_status',level:'execution'},
 {name:'git_diff',level:'execution'},
 {name:'git_create_branch',level:'execution'},
 {name:'git_commit',level:'execution'},
 {name:'git_push',level:'provider'},
 {name:'github_create_pr',level:'provider'},
 {name:'github_trigger_workflow',level:'provider'},
 {name:'vercel_deploy',level:'provider'},
 {name:'vercel_get_deployment',level:'execution'},
 {name:'rsr_simulate',level:'execution'},
 {name:'vsr_render',level:'execution'},
 {name:'rncs_engineering_workflow',level:'provider'}
]);

const native=(gateway,action,payload={},options={})=>gateway.invoke('rncs.aetherworld-native',action,payload,options);
const execute=(gateway,action,payload={},options={})=>gateway.invoke('rncs.developer-execution',action,payload,{timeoutMs:options.timeoutMs??30*60_000,...options});
const assertExecutionEnabled=config=>{if(!config.executionToolsEnabled)throw Object.assign(new Error('Developer execution tools are disabled.'),{code:'EXECUTION_TOOLS_DISABLED'});};
const assertExpectedState=async(gateway,config,{expected_state_root,expected_revision}={},action='provider write')=>{
 const current=await native(gateway,'worldStatus',{});
 if(config.requireStatePreconditions&&(expected_state_root===undefined||expected_revision===undefined))throw Object.assign(new Error(`${action} requires expected_state_root and expected_revision from rncs_world_status.`),{code:'AUTHORITY_PRECONDITION_REQUIRED',details:{current}});
 if(expected_state_root!==undefined&&current.state_root!==expected_state_root)throw Object.assign(new Error(`${action} rejected because state_root changed.`),{code:'STATE_ROOT_MISMATCH',details:{expected:expected_state_root,current:current.state_root}});
 if(expected_revision!==undefined&&current.revision!==expected_revision)throw Object.assign(new Error(`${action} rejected because revision changed.`),{code:'REVISION_MISMATCH',details:{expected:expected_revision,current:current.revision}});
 return current;
};
const registerAuthorityReceipt=async(gateway,config,execution,before)=>{
 const summary={workflow_id:execution.workflow_id,status:execution.status,branch:execution.branch,commit:execution.commit?.stdout?.trim()||null,pull_request:execution.pull_request?.html_url||execution.pull_request?.url||null,deployment:execution.deployment?.url||execution.deployment?.id||null,tests:(execution.tests??[]).map(item=>({profile:item.profile,exit_code:item.result?.exit_code}))};
 const source=`登记一项已经真实完成的软件工程执行收据。工作流 ${summary.workflow_id}，状态 ${summary.status}，分支 ${summary.branch??'未创建'}，提交 ${summary.commit??'未提交'}，测试 ${JSON.stringify(summary.tests)}。该对象只记录工程事实与证据，不注册世界行为。`;
 const plan=await native(gateway,'compile',{source,language:'NATURAL_LANGUAGE',subjectId:config.founderSubjectId},{idempotencyKey:`engineering-receipt-plan:${summary.workflow_id}`});
 const candidate=await native(gateway,'createCandidate',{plan},{idempotencyKey:`engineering-receipt-candidate:${summary.workflow_id}`});
 const simulation=await native(gateway,'simulateCandidate',{candidateId:candidate.candidate_id},{idempotencyKey:`engineering-receipt-simulation:${summary.workflow_id}`});
 const authority=await native(gateway,'authorizeCandidate',{candidateId:candidate.candidate_id,approvalRoles:config.founderApprovalRoles});
 const decisions=(authority.decisions??[]).filter(item=>item.action!=='delete_world_object');
 if(!decisions.length||!decisions.every(item=>item.status==='approved'))throw Object.assign(new Error('AAF did not approve the engineering receipt candidate.'),{code:'AAF_APPROVAL_REQUIRED',details:{authority}});
 const current=await native(gateway,'worldStatus',{});
 if(current.state_root!==before.state_root||current.revision!==before.revision)throw Object.assign(new Error('Authoritative state changed before engineering receipt commit.'),{code:'AUTHORITY_INVARIANT_VIOLATION',details:{before,current}});
 const merge=await native(gateway,'mergeCandidate',{candidateId:candidate.candidate_id},{idempotencyKey:`engineering-receipt-merge:${summary.workflow_id}:${before.state_root}`});
 const after=await native(gateway,'worldStatus',{});
 return{summary,plan:{plan_id:plan.plan_id},candidate:{candidate_id:candidate.candidate_id},simulation:{status:simulation.execution_receipt?.status,evidence_root:simulation.evidence_root},authority:{authority_root:authority.authority_root,summary:authority.summary},merge,after};
};

export function registerExecutionTools(server,{gateway,config}){
 if(!config.executionToolsEnabled)return;
 register(server,'developer_execution_status',{title:'Developer Execution Status',description:'Read the Developer Execution Runtime provider, workspace, command profiles, GitHub/Vercel configuration state, and shell boundary.',inputSchema:{},annotations:readAnnotations},async()=>execute(gateway,'status',{}));
 register(server,'workspace_list_files',{title:'List Project Workspace Files',description:'List files under the bound engineering workspace. Secret-bearing paths are omitted and paths cannot escape the project root.',inputSchema:{path:pathSchema.optional(),max_entries:z.number().int().min(1).max(5_000).optional()},annotations:readAnnotations},async payload=>execute(gateway,'listFiles',payload));
 register(server,'workspace_read_file',{title:'Read Project File',description:'Read a text or base64 file inside the bound project workspace. Secret paths and symlink escapes are rejected.',inputSchema:{path:pathSchema,max_bytes:z.number().int().min(1).max(5_000_000).optional(),encoding:z.enum(['utf8','base64']).optional()},annotations:readAnnotations},async payload=>execute(gateway,'readFile',payload));
 register(server,'workspace_write_file',{title:'Write Project File',description:'Atomically create or replace a file inside the bound project workspace.',inputSchema:{path:pathSchema,content:z.string().max(5_000_000),encoding:z.enum(['utf8','base64']).optional(),create:z.boolean().optional()},annotations:writeAnnotations},async payload=>{assertExecutionEnabled(config);return execute(gateway,'writeFile',payload);});
 register(server,'workspace_apply_patch',{title:'Apply Exact Project Patch',description:'Apply exact search-and-replace edits to one project file. The operation fails if context occurrence counts do not match.',inputSchema:{path:pathSchema,replacements:z.array(z.object({search:z.string().min(1),replace:z.string(),expected_occurrences:z.number().int().min(1).optional(),all:z.boolean().optional()})).min(1).max(100)},annotations:writeAnnotations},async payload=>execute(gateway,'applyPatch',payload));
 register(server,'workspace_remove_path',{title:'Remove Project Path',description:'Remove a file or explicitly recursive directory inside the bound workspace.',inputSchema:{path:pathSchema,recursive:z.boolean().optional()},annotations:destructiveAnnotations},async payload=>execute(gateway,'removePath',payload));
 register(server,'workspace_export_artifact',{title:'Export Build Artifact',description:'Export a file or a secret-filtered directory archive from the engineering workspace. Remote workers return an expiring opaque download URL suitable for APKs, ZIPs, renders, and reports.',inputSchema:{path:pathSchema,filename:z.string().min(1).max(200).optional()},annotations:readAnnotations},async payload=>execute(gateway,'exportArtifact',payload,{timeoutMs:10*60_000}));
 register(server,'execution_run_command',{title:'Run Project Command',description:'Execute an argv-based command inside the dedicated engineering workspace without shell expansion. Allowed executables depend on the execution mode.',inputSchema:{executable:z.string().min(1).max(500),args:z.array(z.string().max(10_000)).max(200).optional(),cwd:pathSchema.optional(),timeout_ms:z.number().int().min(100).max(1_800_000).optional(),allow_failure:z.boolean().optional(),stdin:z.string().max(1_000_000).optional()},annotations:destructiveAnnotations},async payload=>execute(gateway,'runCommand',payload,{timeoutMs:payload.timeout_ms??30*60_000}));
 if(config.executionShellEnabled)register(server,'execution_run_shell',{title:'Run Founder Break-glass Shell',description:'Execute a shell script inside a dedicated isolated execution worker. This tool exists only in founder-unrestricted mode with explicit shell enablement.',inputSchema:{script:z.string().min(1).max(100_000),cwd:pathSchema.optional(),timeout_ms:z.number().int().min(100).max(1_800_000).optional(),allow_failure:z.boolean().optional()},annotations:destructiveAnnotations},async payload=>execute(gateway,'runShell',payload,{timeoutMs:payload.timeout_ms??30*60_000}));
 register(server,'execution_run_build',{title:'Run Declared Build Profile',description:'Run a declared Node, Python, Gradle, Android, RNCS, RSR, or VSR build/test profile in the engineering worker.',inputSchema:{profile:buildProfiles,cwd:pathSchema.optional(),extra_args:z.array(z.string()).max(100).optional(),timeout_ms:z.number().int().min(100).max(1_800_000).optional()},annotations:destructiveAnnotations},async payload=>execute(gateway,'runBuild',payload,{timeoutMs:payload.timeout_ms??30*60_000}));
 register(server,'git_status',{title:'Git Status',description:'Read short Git status in the bound project.',inputSchema:{cwd:pathSchema.optional()},annotations:readAnnotations},async payload=>execute(gateway,'gitStatus',payload));
 register(server,'git_diff',{title:'Git Diff',description:'Read working-tree or staged Git diff in the bound project.',inputSchema:{cwd:pathSchema.optional(),staged:z.boolean().optional()},annotations:readAnnotations},async payload=>execute(gateway,'gitDiff',payload));
 register(server,'git_create_branch',{title:'Create Git Task Branch',description:'Create and switch to a task branch in the bound repository.',inputSchema:{branch:branchSchema,cwd:pathSchema.optional(),start_point:z.string().max(200).optional()},annotations:writeAnnotations},async payload=>execute(gateway,'gitCreateBranch',payload));
 register(server,'git_commit',{title:'Commit Project Changes',description:'Stage selected project paths and create a real Git commit.',inputSchema:{message:z.string().min(1).max(500),paths:z.array(pathSchema).min(1).max(500).optional(),cwd:pathSchema.optional()},annotations:destructiveAnnotations},async payload=>execute(gateway,'gitCommit',payload));
 register(server,'git_push',{title:'Push Git Branch',description:'Push a task branch to an already configured remote. Requires fresh RNCS authority state preconditions.',inputSchema:{remote:z.string().min(1).max(100).optional(),branch:branchSchema,set_upstream:z.boolean().optional(),force_with_lease:z.boolean().optional(),cwd:pathSchema.optional(),expected_state_root:stateRootSchema.optional(),expected_revision:z.number().int().min(0).optional()},annotations:destructiveAnnotations},async({expected_state_root,expected_revision,...payload})=>{await assertExpectedState(gateway,config,{expected_state_root,expected_revision},'git push');return execute(gateway,'gitPush',payload);});
 register(server,'github_create_pr',{title:'Create GitHub Pull Request',description:'Create a pull request through the configured least-privilege GitHub provider adapter.',inputSchema:{head:branchSchema,base:branchSchema.optional(),title:z.string().min(1).max(500),body:z.string().max(20_000).optional(),draft:z.boolean().optional(),expected_state_root:stateRootSchema.optional(),expected_revision:z.number().int().min(0).optional()},annotations:destructiveAnnotations},async({expected_state_root,expected_revision,...payload})=>{await assertExpectedState(gateway,config,{expected_state_root,expected_revision},'create GitHub PR');return execute(gateway,'githubCreatePullRequest',payload);});
 register(server,'github_trigger_workflow',{title:'Trigger GitHub Workflow',description:'Trigger a configured GitHub Actions workflow for CI, Android builds, release packaging, or deployment.',inputSchema:{workflow_id:z.string().min(1).max(300),ref:branchSchema.optional(),inputs:z.record(z.string()).optional(),expected_state_root:stateRootSchema.optional(),expected_revision:z.number().int().min(0).optional()},annotations:destructiveAnnotations},async({expected_state_root,expected_revision,...payload})=>{await assertExpectedState(gateway,config,{expected_state_root,expected_revision},'trigger GitHub workflow');return execute(gateway,'githubTriggerWorkflow',payload);});
 register(server,'vercel_deploy',{title:'Deploy Vercel Revision',description:'Trigger a Vercel preview or production deployment through a configured deploy hook or Vercel provider token.',inputSchema:{ref:branchSchema.optional(),name:z.string().max(200).optional(),environment:z.enum(['preview','production']).optional(),meta:z.record(z.any()).optional(),expected_state_root:stateRootSchema.optional(),expected_revision:z.number().int().min(0).optional()},annotations:destructiveAnnotations},async({expected_state_root,expected_revision,...payload})=>{await assertExpectedState(gateway,config,{expected_state_root,expected_revision},'Vercel deploy');return execute(gateway,'vercelDeploy',payload);});
 register(server,'vercel_get_deployment',{title:'Read Vercel Deployment',description:'Read a Vercel deployment status using the configured provider adapter.',inputSchema:{deployment_id:z.string().min(1).max(300)},annotations:readAnnotations},async payload=>execute(gateway,'vercelGetDeployment',payload));
 register(server,'rsr_simulate',{title:'Run Real RSR Simulation',description:'Build and run the actual Reality Simulation Runtime simulation CLI in the engineering worker and return logs and receipts.',inputSchema:{cwd:pathSchema.optional(),timeout_ms:z.number().int().min(100).max(1_800_000).optional()},annotations:destructiveAnnotations},async payload=>execute(gateway,'rsrSimulate',payload,{timeoutMs:payload.timeout_ms??30*60_000}));
 register(server,'vsr_render',{title:'Run Real VSR Render',description:'Build the actual Visual State Runtime and render a frame to an artifact in the engineering workspace.',inputSchema:{scene:pathSchema.optional(),time:z.number().finite().optional(),out:pathSchema.optional(),cwd:pathSchema.optional(),timeout_ms:z.number().int().min(100).max(1_800_000).optional()},annotations:destructiveAnnotations},async payload=>execute(gateway,'vsrRender',payload,{timeoutMs:payload.timeout_ms??30*60_000}));
 register(server,'rncs_engineering_workflow',{title:'Execute Full RNCS Engineering Workflow',description:'Create a Git task branch, modify real source files, run declared tests/builds, commit, optionally push/create PR/deploy, roll back local changes on failure, then record the successful engineering receipt as a new authoritative RNCS Generation.',inputSchema:{branch:branchSchema,changes:z.array(z.union([z.object({path:pathSchema,content:z.string().max(5_000_000),encoding:z.enum(['utf8','base64']).optional()}),z.object({path:pathSchema,replacements:z.array(z.object({search:z.string().min(1),replace:z.string(),expected_occurrences:z.number().int().min(1).optional(),all:z.boolean().optional()})).min(1).max(100)})])).min(1).max(500),test_profiles:z.array(buildProfiles).max(30).optional(),commit_message:z.string().min(1).max(500),push:z.boolean().optional(),create_pr:z.boolean().optional(),pr:z.object({base:branchSchema.optional(),title:z.string().max(500).optional(),body:z.string().max(20_000).optional(),draft:z.boolean().optional()}).optional(),deploy:z.boolean().optional(),deployment:z.object({ref:branchSchema.optional(),name:z.string().max(200).optional(),environment:z.enum(['preview','production']).optional(),meta:z.record(z.any()).optional()}).optional(),allow_dirty:z.boolean().optional(),rollback_on_failure:z.boolean().optional(),record_authority:z.boolean().optional(),expected_state_root:stateRootSchema.optional(),expected_revision:z.number().int().min(0).optional()},annotations:destructiveAnnotations},async({expected_state_root,expected_revision,record_authority=true,...payload})=>{
  const before=await assertExpectedState(gateway,config,{expected_state_root,expected_revision},'RNCS engineering workflow');
  const execution=await execute(gateway,'engineeringWorkflow',payload,{timeoutMs:30*60_000});
  const authority=record_authority?await registerAuthorityReceipt(gateway,config,execution,before):null;
  return{format:'taowind.rncs-engineering-workflow.v0.1',before,execution,authority,after:authority?.after??await native(gateway,'worldStatus',{})};
 });
}
