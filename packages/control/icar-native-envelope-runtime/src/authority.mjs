import { seal } from './canonical.mjs';
const has=(actor,scope)=>actor?.role==='owner'||(actor?.scopes??[]).includes('*')||(actor?.scopes??[]).includes(scope);
export function resolveAuthority({plan,actor,hostNegotiation,policy={}}){
 const scope_decisions=plan.required_scopes.map(scope=>({scope,granted:has(actor,scope)})); const host_decisions=plan.required_host_capabilities.map(capability=>({capability,granted:hostNegotiation.grants.includes(capability)}));
 const denied=[...scope_decisions.filter(x=>!x.granted).map(x=>`scope:${x.scope}`),...host_decisions.filter(x=>!x.granted).map(x=>`host:${x.capability}`)];
 const highRisk=plan.steps.filter(s=>s.risk==='high').map(s=>s.step_id); if(highRisk.length&&!policy.allow_high_risk)denied.push(...highRisk.map(x=>`risk:${x}`));
 return seal({format:'icar.authority-resolution.v0.2',actor:{subject_id:actor.subject_id??actor.id,role:actor.role,scopes:actor.scopes??[]},plan_root:plan.plan_root,scope_decisions,host_decisions,status:denied.length?'denied':'approved',denied,approval_mode:policy.approval_mode??'explicit-or-owner'},'authority_root');
}
