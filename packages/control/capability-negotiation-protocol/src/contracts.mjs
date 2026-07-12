import { CNPError, clone, seal, verifySeal, uniqueSorted } from './canonical.mjs';
import { parseVersion } from './semver.mjs';
const risks=['low','medium','high','critical'];
const phases=['transaction','post-commit','read-only'];
export function normalizeDescriptor(input){
 const d=clone(input);
 if(!d.capability_id||!d.version||!d.provider_id) throw new CNPError('DESCRIPTOR_REQUIRED','capability_id, version and provider_id are required');
 parseVersion(d.version);
 d.format='cnp.capability-descriptor.v0.1';
 d.protocol_versions=uniqueSorted(d.protocol_versions??['0.1.0']);
 d.fulfills=uniqueSorted(d.fulfills??[]);
 d.inputs=d.inputs??{}; d.outputs=d.outputs??{};
 d.required_scopes=uniqueSorted(d.required_scopes??[]);
 d.host_requirements=uniqueSorted(d.host_requirements??[]);
 d.constraints=d.constraints??{};
 d.risk=d.risk??{level:'medium',reasons:[]};
 if(typeof d.risk==='string')d.risk={level:d.risk,reasons:[]};
 if(!risks.includes(d.risk.level))throw new CNPError('INVALID_RISK',d.risk.level);
 d.reversible=Boolean(d.reversible);
 d.execution_phase=d.execution_phase??'transaction';
 if(!phases.includes(d.execution_phase))throw new CNPError('INVALID_EXECUTION_PHASE',d.execution_phase);
 d.side_effects=uniqueSorted(d.side_effects??[]);
 d.evidence=d.evidence??{produces:[],requires:[]};
 d.evidence.produces=uniqueSorted(d.evidence.produces??[]); d.evidence.requires=uniqueSorted(d.evidence.requires??[]);
 d.cost={cpu_millis:d.cost?.cpu_millis??0,memory_mb:d.cost?.memory_mb??0,network_kb:d.cost?.network_kb??0,monetary_microunits:d.cost?.monetary_microunits??0};
 d.trust=d.trust??{level:0,attestations:[]}; d.trust.attestations=uniqueSorted(d.trust.attestations??[]);
 d.transport=d.transport??{kind:'local'};
 d.status=d.status??'available';
 return seal(d,'descriptor_root');
}
export function validateDescriptor(d){
 const errors=[];
 try{const n=normalizeDescriptor(d); if(d.descriptor_root&&n.descriptor_root!==d.descriptor_root)errors.push('descriptor_root mismatch');}
 catch(e){errors.push(`${e.code??'ERROR'}: ${e.message}`);}
 return {valid:errors.length===0,errors};
}
export function normalizeProvider(input){
 const p=clone(input); if(!p.provider_id)throw new CNPError('PROVIDER_REQUIRED','provider_id is required');
 p.format='cnp.provider-manifest.v0.1'; p.protocol_versions=uniqueSorted(p.protocol_versions??['0.1.0']);
 p.capabilities=(p.capabilities??[]).map(x=>normalizeDescriptor({...x,provider_id:x.provider_id??p.provider_id,trust:x.trust??p.trust??{level:0,attestations:[]}})).sort((a,b)=>a.capability_id.localeCompare(b.capability_id)||a.version.localeCompare(b.version));
 p.transports=p.transports??[{kind:'local'}]; p.trust=p.trust??{level:0,attestations:[]}; p.status=p.status??'available';
 return seal(p,'provider_root');
}
export function validateProvider(p){try{const n=normalizeProvider(p);return{valid:!p.provider_root||p.provider_root===n.provider_root,errors:(!p.provider_root||p.provider_root===n.provider_root)?[]:['provider_root mismatch']};}catch(e){return{valid:false,errors:[`${e.code??'ERROR'}: ${e.message}`]};}}
export function normalizeRequest(input){
 const r=clone(input); if(!r.request_id||!r.subject||!Array.isArray(r.goals)||!r.goals.length)throw new CNPError('REQUEST_REQUIRED','request_id, subject and non-empty goals are required');
 r.format='cnp.negotiation-request.v0.1'; r.protocol_versions=uniqueSorted(r.protocol_versions??['0.1.0']);
 r.subject.scopes=uniqueSorted(r.subject.scopes??[]); r.host=r.host??{}; r.host.capabilities=uniqueSorted(r.host.capabilities??[]);
 r.policy=r.policy??{}; r.policy.max_risk=r.policy.max_risk??'high'; r.policy.require_reversible=Boolean(r.policy.require_reversible);
 r.policy.required_evidence=uniqueSorted(r.policy.required_evidence??[]); r.policy.minimum_trust=r.policy.minimum_trust??0;
 r.policy.cost_budget={cpu_millis:r.policy.cost_budget?.cpu_millis??2147483647,memory_mb:r.policy.cost_budget?.memory_mb??2147483647,network_kb:r.policy.cost_budget?.network_kb??2147483647,monetary_microunits:r.policy.cost_budget?.monetary_microunits??2147483647};
 r.constraints=r.constraints??{};
 return seal(r,'request_root');
}
export function validateRequest(r){try{const n=normalizeRequest(r);return{valid:!r.request_root||r.request_root===n.request_root,errors:(!r.request_root||r.request_root===n.request_root)?[]:['request_root mismatch']};}catch(e){return{valid:false,errors:[`${e.code??'ERROR'}: ${e.message}`]};}}
