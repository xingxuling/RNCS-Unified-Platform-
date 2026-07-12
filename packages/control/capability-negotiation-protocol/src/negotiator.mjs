import { CNPError, seal, uniqueSorted } from './canonical.mjs';
import { normalizeProvider, normalizeRequest } from './contracts.mjs';
import { chooseProtocol, satisfies, compareVersions } from './semver.mjs';
const riskRank={low:0,medium:1,high:2,critical:3};
function objectContractCompatible(required={},provided={}){
 const failures=[];
 for(const [name,spec] of Object.entries(required)){
  const got=provided[name];
  if(spec?.required&&!got)failures.push(`missing-input:${name}`);
  if(got&&spec?.type&&got.type&&spec.type!==got.type)failures.push(`input-type:${name}:${got.type}->${spec.type}`);
 }
 return failures;
}
function evaluate(desc, goal, request, provider){
 const reasons=[]; const warnings=[];
 if(desc.status!=='available'||provider.status!=='available')reasons.push('provider-unavailable');
 if(!desc.fulfills.includes(goal.type))reasons.push('goal-not-fulfilled');
 const range=goal.version_range??'*'; if(!satisfies(desc.version,range))reasons.push(`version-not-satisfied:${range}`);
 const protocol=(()=>{try{return chooseProtocol(request.protocol_versions,desc.protocol_versions)}catch{return null}})(); if(!protocol)reasons.push('protocol-incompatible');
 const missingScopes=(desc.required_scopes??[]).filter(x=>!request.subject.scopes.includes(x)); if(missingScopes.length)reasons.push(`missing-scopes:${missingScopes.join(',')}`);
 const missingHost=(desc.host_requirements??[]).filter(x=>!request.host.capabilities.includes(x)); if(missingHost.length)reasons.push(`missing-host:${missingHost.join(',')}`);
 if(riskRank[desc.risk.level]>riskRank[request.policy.max_risk])reasons.push(`risk-exceeds:${desc.risk.level}`);
 if(request.policy.require_reversible&&!desc.reversible)reasons.push('not-reversible');
 if((desc.trust?.level??0)<request.policy.minimum_trust)reasons.push('trust-below-minimum');
 const produced=desc.evidence?.produces??[]; const missingEvidence=request.policy.required_evidence.filter(x=>!produced.includes(x)); if(missingEvidence.length)reasons.push(`missing-evidence:${missingEvidence.join(',')}`);
 const c=desc.cost??{}; for(const k of Object.keys(request.policy.cost_budget))if((c[k]??0)>request.policy.cost_budget[k])reasons.push(`cost-exceeds:${k}`);
 reasons.push(...objectContractCompatible(desc.inputs,goal.inputs??{}));
 if(!desc.reversible)warnings.push('irreversible'); if(desc.execution_phase==='post-commit')warnings.push('post-commit-side-effect');
 const riskPenalty=(riskRank[desc.risk.level]??2)*10000;
 const costScore=(c.cpu_millis??0)*10+(c.memory_mb??0)+(c.network_kb??0)*5+(c.monetary_microunits??0);
 const trustBonus=(desc.trust?.level??0)*100;
 const reversibleBonus=desc.reversible?200:0;
 const evidenceBonus=produced.filter(x=>request.policy.required_evidence.includes(x)).length*500;
 const versionParts=desc.version.split('.').map(x=>parseInt(x)||0); const versionBonus=versionParts[0]*100+versionParts[1]*10+versionParts[2];
 const score=1_000_000-riskPenalty-costScore+trustBonus+reversibleBonus+evidenceBonus+versionBonus-(reasons.length*1_000_000);
 return {capability_id:desc.capability_id,capability_version:desc.version,provider_id:desc.provider_id,protocol_version:protocol,eligible:reasons.length===0,rejection_reasons:reasons,warnings,score,score_components:{risk_penalty:riskPenalty,cost_score:costScore,trust_bonus:trustBonus,reversible_bonus:reversibleBonus,evidence_bonus:evidenceBonus,version_bonus:versionBonus},descriptor_root:desc.descriptor_root,execution_phase:desc.execution_phase,reversible:desc.reversible,risk:desc.risk,cost:desc.cost,required_scopes:desc.required_scopes,host_requirements:desc.host_requirements,evidence:desc.evidence,transport:desc.transport,inputs:desc.inputs,outputs:desc.outputs};
}
function resolveDependencies(selected, goals){
 const steps=[]; const produced=new Set();
 for(const goal of goals){
  const offer=selected.get(goal.goal_id??goal.type); if(!offer)continue;
  const depends=[];
  for(const [name,spec] of Object.entries(goal.inputs??{})) if(spec?.from_goal){const dep=steps.find(s=>s.goal_id===spec.from_goal); if(dep)depends.push(dep.step_id);}
  steps.push({step_id:`step:${steps.length+1}`,goal_id:goal.goal_id??goal.type,goal_type:goal.type,capability_id:offer.capability_id,capability_version:offer.capability_version,provider_id:offer.provider_id,protocol_version:offer.protocol_version,depends_on:uniqueSorted(depends),execution_phase:offer.execution_phase,reversible:offer.reversible,risk:offer.risk,cost:offer.cost,required_scopes:offer.required_scopes,host_requirements:offer.host_requirements,evidence:offer.evidence,descriptor_root:offer.descriptor_root,transport:offer.transport});
  Object.keys(offer.outputs??{}).forEach(x=>produced.add(x));
 }
 return steps;
}
export function negotiate({request,providers}){
 const req=normalizeRequest(request); const ps=providers.map(normalizeProvider);
 const offers={}; const selected=new Map();
 for(const goal of req.goals){
  const key=goal.goal_id??goal.type; const candidates=[];
  for(const p of ps)for(const d of p.capabilities)candidates.push(evaluate(d,goal,req,p));
  candidates.sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.score-a.score||compareVersions(b.capability_version,a.capability_version)||a.capability_id.localeCompare(b.capability_id)||a.provider_id.localeCompare(b.provider_id));
  offers[key]=candidates; const best=candidates.find(x=>x.eligible); if(best)selected.set(key,best);
 }
 const unresolved=req.goals.filter(g=>!selected.has(g.goal_id??g.type)).map(g=>g.goal_id??g.type);
 const steps=resolveDependencies(selected,req.goals);
 const total_cost=steps.reduce((a,s)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(s.cost?.[k]??0)])),{cpu_millis:0,memory_mb:0,network_kb:0,monetary_microunits:0});
 const plan=seal({format:'cnp.negotiation-plan.v0.1',request_id:req.request_id,request_root:req.request_root,provider_roots:ps.map(x=>x.provider_root).sort(),status:unresolved.length?'unsatisfied':'satisfied',unresolved_goals:unresolved,steps,total_cost,required_scopes:uniqueSorted(steps.flatMap(s=>s.required_scopes??[])),warnings:uniqueSorted(steps.flatMap(s=>(s.reversible?[]:['contains-irreversible-step'])))},'plan_root');
 return seal({format:'cnp.negotiation-result.v0.1',request:req,offers,plan},'negotiation_root');
}
export function explain(result){
 return Object.entries(result.offers).map(([goal,offers])=>({goal,selected:offers.find(x=>x.eligible)??null,rejected:offers.filter(x=>!x.eligible).map(x=>({capability_id:x.capability_id,provider_id:x.provider_id,reasons:x.rejection_reasons}))}));
}
