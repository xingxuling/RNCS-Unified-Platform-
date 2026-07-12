import { rootHash, seal, uniqueSorted, clone } from './canonical.mjs';
const builtins=[
 {capability_id:'laf.artifact.inspect',version:'1.0.0',provider:'icar-builtin',fulfills:['artifact.inspect'],required_scopes:['artifact.read'],host_requirements:[],risk:'low',reversible:true,cost:{cpu_millis:1,memory_mb:1,network_kb:0},operation_template:null},
 {capability_id:'laf.progress.set',version:'1.0.0',provider:'laf-runtime',fulfills:['artifact.progress.target'],required_scopes:['artifact.write'],host_requirements:['input.activate'],risk:'medium',reversible:true,cost:{cpu_millis:3,memory_mb:2,network_kb:0},operation_template:{op:'set',path:'/semantics/values/progress',value_from_goal:'value'}},
 {capability_id:'laf.summary.set',version:'1.0.0',provider:'laf-runtime',fulfills:['artifact.summary.set'],required_scopes:['artifact.write'],host_requirements:['input.text'],risk:'medium',reversible:true,cost:{cpu_millis:3,memory_mb:2,network_kb:0},operation_template:{op:'set',path:'/semantics/values/summary',value_from_goal:'value'}},
 {capability_id:'laf.milestone.append',version:'1.0.0',provider:'laf-runtime',fulfills:['artifact.milestone.append'],required_scopes:['artifact.write'],host_requirements:['input.text'],risk:'medium',reversible:true,cost:{cpu_millis:3,memory_mb:2,network_kb:0},operation_template:{op:'append',path:'/semantics/values/milestones',value_from_goal:'value'}},
 {capability_id:'laf.report.render',version:'1.0.0',provider:'icar-builtin',fulfills:['artifact.report.generate'],required_scopes:['artifact.read'],host_requirements:['display.text'],risk:'low',reversible:true,cost:{cpu_millis:2,memory_mb:2,network_kb:0},operation_template:null},
 {capability_id:'laf.report.attach',version:'1.0.0',provider:'laf-runtime',fulfills:['artifact.report.attach'],required_scopes:['artifact.write'],host_requirements:[],risk:'medium',reversible:true,cost:{cpu_millis:2,memory_mb:2,network_kb:0},operation_template:{op:'set',path:'/semantics/values/generated_report',value_from_context:'report'}},
 {capability_id:'hnac.notification.emit',version:'1.0.0',provider:'hnac-host',fulfills:['host.notification.emit'],required_scopes:['host.notify'],host_requirements:['host.notification'],risk:'medium',reversible:false,cost:{cpu_millis:1,memory_mb:1,network_kb:1},operation_template:null,commit_phase:'post-commit'}
];
function artifactCaps(artifact){return(artifact.affordances??[]).map(a=>({capability_id:`laf.affordance.${a.affordance_id}`,version:'1.0.0',provider:`artifact:${artifact.identity.artifact_id}`,fulfills:(a.intent_patterns??[]).length?a.intent_patterns:[`artifact.affordance.${a.affordance_id}`],required_scopes:a.required_scopes??[],host_requirements:(a.capability_requirements??[]).map(x=>x.id),risk:'medium',reversible:true,cost:{cpu_millis:3,memory_mb:2,network_kb:0},operation_template:null,affordance:a}));}
export function buildRegistry({artifact,providers=[]}){
 const entries=[...builtins,...artifactCaps(artifact),...providers].map(x=>clone(x));
 entries.sort((a,b)=>a.capability_id.localeCompare(b.capability_id));
 return seal({format:'icar.capability-registry.v0.2',entries,capability_ids:uniqueSorted(entries.map(x=>x.capability_id))},'registry_root');
}
export function selectCandidates(registry,goal,hostGrants){
 const riskScore={low:0,medium:20,high:100};
 return registry.entries.filter(c=>c.fulfills.includes(goal.type)).map(c=>{
  const missing=(c.host_requirements??[]).filter(x=>!hostGrants.includes(x));
  const score=(c.cost?.cpu_millis??0)+(c.cost?.network_kb??0)+(riskScore[c.risk]??50)+(missing.length*1000);
  return{...c,available:missing.length===0,missing_host_requirements:missing,score};
 }).sort((a,b)=>a.score-b.score||a.capability_id.localeCompare(b.capability_id));
}
