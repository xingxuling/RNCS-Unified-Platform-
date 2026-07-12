import {clone,seal,stableId} from './canonical.mjs';
const RISK={low:1,medium:2,high:3,critical:4};
const matchesScope=(granted,needed)=>granted==='*'||granted===needed||(granted.endsWith('.*')&&needed.startsWith(granted.slice(0,-1)));
export class AuthorityResolver{
  constructor(program){this.program=program;this.capabilities=new Map((program.capabilities??[]).map(x=>[x.capability_id,x]));}
  decide(capabilityId,actor={subject_id:'subject:runtime',scopes:['gameplay.*'],roles:['runtime']},context={}){
    const capability=this.capabilities.get(capabilityId);if(!capability)return{decision:'deny',reason:'CAPABILITY_UNKNOWN'};
    const needed=capability.required_scopes??[];if(!needed.every(s=>(actor.scopes??[]).some(g=>matchesScope(g,s))))return{decision:'deny',reason:'SCOPE_MISSING',needed};
    const policies=[...(this.program.authority?.policies??[])].sort((a,b)=>(b.priority??0)-(a.priority??0));let decision=this.program.authority?.default_effect??'deny',matched=null;
    for(const p of policies){if(p.capabilities&&!p.capabilities.includes('*')&&!p.capabilities.includes(capabilityId))continue;if(p.roles_any&&!p.roles_any.some(r=>(actor.roles??[]).includes(r)))continue;if(p.risk_at_least&&RISK[capability.risk??'low']<RISK[p.risk_at_least])continue;if(p.risk_at_most&&RISK[capability.risk??'low']>RISK[p.risk_at_most])continue;decision=p.effect;matched=p;break;}
    if(decision==='allow'&&capability.irreversible&&matched?.require_approval_for_irreversible)decision='require_approval';
    return{decision,reason:matched?.policy_id??'DEFAULT_POLICY',capability:clone(capability)};
  }
  proposal(capabilityId,actor,inputs,decision){return seal({format:'agent-authority.action-request.v0.1',version:'0.1.0',request_id:stableId('behavior-authority',{capabilityId,actor,inputs}),subject:clone(actor),action:{capability_id:capabilityId,inputs:clone(inputs)},decision:clone(decision),status:'proposed'},'request_root');}
}
