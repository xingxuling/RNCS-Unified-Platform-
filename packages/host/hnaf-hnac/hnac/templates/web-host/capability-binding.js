import { verifyProviderRegistry, executeBrowserProviderChain } from './execution-fabric.js';
const textDecoder = new TextDecoder();
const clone = (value) => structuredClone(value);
const sortObject = (value) => Array.isArray(value) ? value.map(sortObject) : (value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])])) : value);
const canonicalText = (value) => JSON.stringify(sortObject(value));
const hex = (buffer) => [...new Uint8Array(buffer)].map((v) => v.toString(16).padStart(2, '0')).join('');
const hash = async (value) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalText(value))));
const parseFile = (files, path) => {
  const raw = files.get(path);
  if (!raw) throw new Error(`胶囊缺少能力绑定文件：${path}`);
  return JSON.parse(textDecoder.decode(raw));
};
const actorOf = (raw = {}) => ({
  subject_id: String(raw.subject_id ?? 'subject:web-user'), kind: String(raw.kind ?? 'human'),
  roles: [...new Set((raw.roles ?? ['owner']).map(String))].sort(), scopes: [...new Set((raw.scopes ?? ['*']).map(String))].sort(),
  responsibility_boundary: String(raw.responsibility_boundary ?? 'browser-session'),
});
const hostCaps = (host) => [...new Set([
  ...Object.keys(host.capabilities ?? {}), ...(host.interaction_modes ?? []).map((x) => `interaction.${x}`),
  ...(host.resources?.spatial ? ['projection.spatial'] : []), ...(host.resources?.screen_reader ? ['projection.screen-reader'] : []),
  ...(host.policies?.network_default === 'allow' ? ['network.https'] : []),
])].sort();
const invoke = async (base, runtimeId, action, payload) => {
  const root = base.replace(/\/$/, '');
  const url = root.endsWith('/api') ? `${root}/invoke` : `${root}/api/invoke`;
  const response = await fetch(url, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({runtime_id:runtimeId, action, payload}) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.error) throw new Error(`Gateway ${runtimeId}.${action} 失败：${result.error?.message ?? response.status}`);
  return result;
};
async function buildRequest({manifest, graph, intentId, host, actor, payload}) {
  const intent = graph.intents?.[intentId];
  if (!intent?.goal?.type) throw new Error(`AIP v0.7 意图没有能力目标：${intentId}`);
  const strategy = manifest.capability_binding.strategy ?? {};
  const requestId = (await hash({app_id:manifest.app.id, app_version:manifest.app.version, intent_id:intentId, host_id:host.id, subject_id:actor.subject_id, payload})).slice(0,24);
  return { request_id:`request:hnaf:${requestId}`, protocol_versions:['0.1.0'], subject:{subject_id:actor.subject_id,scopes:actor.scopes}, host:{host_id:host.id,capabilities:hostCaps(host)},
    goals:[{goal_id:`goal:${intentId}`,type:String(intent.goal.type),version_range:String(intent.goal.version_range ?? '*'),inputs:clone(intent.goal.inputs ?? {})}],
    policy:{max_risk:String(strategy.max_risk ?? intent.risk ?? 'high'),require_reversible:Boolean(strategy.require_reversible),required_evidence:[...new Set((intent.goal.required_evidence ?? []).map(String))].sort(),minimum_trust:Number(strategy.minimum_trust ?? 0),cost_budget:{cpu_millis:Number(strategy.cost_budget?.cpu_millis ?? 2147483647),memory_mb:Number(strategy.cost_budget?.memory_mb ?? 2147483647),network_kb:Number(strategy.cost_budget?.network_kb ?? 2147483647),monetary_microunits:Number(strategy.cost_budget?.monetary_microunits ?? 2147483647)}},
    constraints:{prefer_local:Boolean(strategy.prefer_local ?? true),offline_first:Boolean(strategy.offline_first ?? true),...clone(intent.goal.constraints ?? {})} };
}
async function seal(value, field) { const out=clone(value); delete out[field]; out[field]=await hash(out); return out; }
async function authorityNegotiation(request, negotiation, chain) {
  const goal=request.goals[0]; const steps=chain.map((offer,index)=>({step_id:`authorized-fallback:${index+1}`,goal_id:goal.goal_id,goal_type:goal.type,capability_id:offer.capability_id,capability_version:offer.capability_version,provider_id:offer.provider_id,protocol_version:offer.protocol_version,depends_on:[],execution_phase:offer.execution_phase ?? 'transaction',reversible:Boolean(offer.reversible),risk:clone(offer.risk ?? {level:'medium',reasons:[]}),cost:clone(offer.cost ?? {}),required_scopes:clone(offer.required_scopes ?? []),host_requirements:clone(offer.host_requirements ?? []),evidence:clone(offer.evidence ?? {}),descriptor_root:offer.descriptor_root,transport:clone(offer.transport ?? {kind:'local'})}));
  const keys=['cpu_millis','memory_mb','network_kb','monetary_microunits']; const total=Object.fromEntries(keys.map((key)=>[key,steps.reduce((n,s)=>n+Number(s.cost?.[key] ?? 0),0)]));
  const plan=await seal({format:'cnp.negotiation-plan.v0.1',request_id:request.request_id,request_root:negotiation.request.request_root,provider_roots:negotiation.plan.provider_roots ?? [],status:steps.length?'satisfied':'unsatisfied',unresolved_goals:steps.length?[]:[goal.goal_id],steps,total_cost:total,required_scopes:[...new Set(steps.flatMap((s)=>s.required_scopes ?? []))].sort(),warnings:[...new Set(steps.filter((s)=>!s.reversible).map(()=> 'contains-irreversible-step'))].sort()},'plan_root');
  return seal({format:'cnp.negotiation-result.v0.1',request:clone(negotiation.request),offers:clone(negotiation.offers ?? {}),plan},'negotiation_root');
}
async function makeEnvelope({manifest,intentId,intent,actor,payload,authorityPlan,host,bindingVersion='0.7'}) {
  const proposal={app_id:manifest.app.id,app_version:manifest.app.version,intent_id:intentId,goal:clone(intent.goal),payload:clone(payload),subject_id:actor.subject_id,host_id:host.id,authority_plan_root:authorityPlan.plan.plan_root};
  const proposalRoot=await hash(proposal), steps=authorityPlan.plan.steps ?? [];
  const envelope={format:'rncs.reality-transition-envelope.v0.1',contract_version:'0.1.0',transition_id:`transition:hnaf:${proposalRoot.slice(0,24)}`,phase:'proposed',proposal_root:proposalRoot,base_generation:{reality_id:`reality:hnaf:${manifest.app.id}`,generation:0,generation_root:'0'.repeat(64)},subject:{subject_id:actor.subject_id,kind:actor.kind,roles:actor.roles,responsibility_boundary:actor.responsibility_boundary},intent:{intent_id:intentId,source:'adaptive-interface',goals:[clone(intent.goal)],constraints:['capability-negotiation-required','authority-before-execution'],intent_root:await hash({intent_id:intentId,goal:intent.goal,payload})},capability_plan:{plan_id:`plan:hnaf:${authorityPlan.plan.plan_root.slice(0,24)}`,capabilities:steps.map((s)=>({capability_id:s.capability_id,provider:s.provider_id,required_scopes:s.required_scopes ?? [],risk:s.risk?.level ?? 'medium',reversible:Boolean(s.reversible),cost:s.cost ?? {}})),host_bindings:[{host_id:host.id}],required_scopes:authorityPlan.plan.required_scopes ?? [],plan_root:authorityPlan.plan.plan_root},inputs:[{kind:'intent-payload',id:intentId,root:await hash(payload)}],provisional_delta:{operations:[],provisional:true,delta_root:await hash([])},causal_basis:{events:[{event_id:`event:${proposalRoot.slice(0,16)}`,kind:'interface-intent-received'}],rules:[{rule_id:'cnp-before-execution',expression:'capability plan must be satisfied'},{rule_id:'aaf-before-execution',expression:'authority status must be approved'}],simulation_refs:[],causal_root:await hash({proposal_root:proposalRoot,host_id:host.id})},authority:{status:'pending',claims:[],constraints:[]},evidence:{nodes:[{evidence_id:'evidence:capability-plan',kind:'capability-plan',source:'CNP v0.1 through Reality One Gateway',content_root:authorityPlan.plan.plan_root}],edges:[],evidence_root:await hash(authorityPlan.plan)},commit:{status:'not_committed'},projections:[],host_state_refs:[],extensions:{hnaf:{binding_version:bindingVersion,proposal}}};
  envelope.envelope_root=await hash(envelope); return envelope;
}
function executeBuiltin(step, manifest, payload) {
  const handler=step.transport?.handler;
  if (handler === 'fail') throw new Error('Provider declared deterministic failure');
  if (handler === 'echo') return {echo:clone(payload)};
  if (handler === 'capsule.inspect') return {app:manifest.app,format_version:manifest.format_version,capability_binding:manifest.capability_binding};
  if (handler === 'state.increment') {
    const key=String(payload.key ?? 'counter'), amount=Number(payload.amount ?? 1), storageKey=`hnaf:v0.7:${manifest.app.id}:${key}`;
    const before=Number(localStorage.getItem(storageKey) ?? 0), after=before+amount; localStorage.setItem(storageKey,String(after));
    return {key,before,after,amount,state_root:null};
  }
  throw new Error(`网页宿主没有实现 Provider handler：${handler}`);
}
export async function bindAndExecuteIntent({manifest,files,graph,intentId,host,subject,payload={},gatewayUrl='./api',confirmHighRisk=async()=>false,emit=()=>{}}) {
  const section=manifest.capability_binding; if(!['0.7','0.8'].includes(section?.version))throw new Error('胶囊没有声明 capability_binding.version=0.7/0.8');
  const providerDoc=parseFile(files,section.providers), providers=Array.isArray(providerDoc)?providerDoc:providerDoc.providers, policyRaw=parseFile(files,section.authority_policy);
  const supplyChain = section.version==='0.8' ? await verifyProviderRegistry(providerDoc, manifest.execution_fabric?.require_signed_providers !== false) : null;
  const actor=actorOf(subject), request=await buildRequest({manifest,graph,intentId,host,actor,payload}); emit({phase:'capability.discovery',request_id:request.request_id});
  const negotiation=await invoke(gatewayUrl,'rncs.cnp','negotiate',{request,providers}); const goal=request.goals[0].goal_id;
  const chain=(negotiation.offers?.[goal] ?? []).filter((x)=>x.eligible).slice(0,Math.max(1,Number(section.strategy?.max_fallbacks ?? 2)+1));
  if(negotiation.plan?.status!=='satisfied'||!chain.length)throw new Error('CNP 没有找到满足目标的 Provider');
  const authorityPlan=await authorityNegotiation(request,negotiation,chain), intent=graph.intents[intentId], envelope=await makeEnvelope({manifest,intentId,intent,actor,payload,authorityPlan,host,bindingVersion:section.version});
  const policy=await invoke(gatewayUrl,'rncs.aaf','sealPolicy',{raw:policyRaw}); const now=new Date().toISOString();
  const evaluate=(approvals=[])=>invoke(gatewayUrl,'rncs.aaf','evaluate',{envelope,negotiation:authorityPlan,policy_bundle:policy,identity_scopes:actor.scopes,context:{now,environment:'web',request_id:`authority:${envelope.transition_id}`},approvals});
  let decision=await evaluate([]), approval=null; emit({phase:'authority.decision',status:decision.status,decision_root:decision.decision_root});
  if(decision.status==='pending_approval'){
    const allowed=await confirmHighRisk({intent,decision}); if(!allowed)return {status:'pending_approval',intent_id:intentId,authority:decision,envelope};
    approval=await invoke(gatewayUrl,'rncs.aaf','sealApproval',{raw:{approval_id:`approval:hnaf-web:${envelope.proposal_root.slice(0,24)}`,proposal_root:envelope.proposal_root,approver_id:actor.subject_id,approver_roles:actor.roles,decision:'approved',scopes:['*'],conditions:[{type:'explicit-interface-confirmation',intent_id:intentId}],issued_at:now,expires_at:'2099-01-01T00:00:00Z'}}); decision=await evaluate([approval]);
  }
  if(decision.status!=='approved')return {status:decision.status,intent_id:intentId,authority:decision,envelope};
  let attempts=[]; let output=null, selected=null; let idempotentReplay=false;
  if(section.version==='0.8'){
    const idempotencyKey=`web:${(await hash({app_id:manifest.app.id,intent_id:intentId,subject_id:actor.subject_id,payload})).slice(0,32)}`;
    const execution=await executeBrowserProviderChain({steps:authorityPlan.plan.steps,manifest,payload,policy:manifest.execution_fabric ?? {},idempotencyKey,gatewayUrl,emit});
    attempts=execution.attempts; output=execution.result; selected=execution.selected; idempotentReplay=Boolean(execution.idempotent_replay);
    if(execution.status==='failed')throw new Error('所有已授权、浏览器可执行的 Provider 均执行失败');
  }else{
    for(const step of authorityPlan.plan.steps){ try{output=executeBuiltin(step,manifest,payload);selected=step;attempts.push({provider_id:step.provider_id,capability_id:step.capability_id,status:'succeeded'});break;}catch(error){attempts.push({provider_id:step.provider_id,capability_id:step.capability_id,status:'failed',error:error.message});}}
    if(!selected)throw new Error('所有已授权 Provider 均执行失败');
  }
  if(output && 'state_root' in output)output.state_root=await hash({app_id:manifest.app.id,output});
  const rfeCommit=section.version==='0.8'&&manifest.execution_fabric?.commit_receipts_to_rfe?{status:'deferred',reason:'browser host has no authoritative RFE commit action; Desktop/Pocket native host must commit'}:null;
  const receipt=await seal({format:`hnaf.intent-execution-receipt.v${section.version}`,version:section.version,status:idempotentReplay?'idempotent-replay':'executed',intent_id:intentId,selected_provider:selected.provider_id,selected_capability:selected.capability_id,attempts,output,request_root:negotiation.request.request_root,plan_root:authorityPlan.plan.plan_root,decision_root:decision.decision_root,envelope_root:envelope.envelope_root,supply_chain:supplyChain,rfe_commit:rfeCommit,executed_at:new Date().toISOString(),backend:{negotiation:'reality-one-gateway',authority:'reality-one-gateway',execution:section.version==='0.8'?'hnaf-web-remote-fabric':'hnaf-web-builtin'}},'receipt_root');
  return {status:receipt.status,intent_id:intentId,binding:{request_root:negotiation.request.request_root,plan_root:authorityPlan.plan.plan_root,decision_root:decision.decision_root},authority:decision,approval,receipt,state:output};
}
