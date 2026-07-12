import { selectCandidates } from './capabilities.mjs';
import { seal, uniqueSorted, ICARError } from './canonical.mjs';
export function planIntent({intent,registry,hostGrants}){
 const steps=[]; const alternatives={};
 for(const goal of intent.goals){
  const candidates=selectCandidates(registry,goal,hostGrants); alternatives[goal.type]=candidates.map(c=>({capability_id:c.capability_id,score:c.score,available:c.available,missing:c.missing_host_requirements}));
  const selected=candidates.find(c=>c.available); if(!selected)throw new ICARError('NO_AVAILABLE_CAPABILITY',goal.type);
  steps.push({step_id:`step:${steps.length+1}`,goal,capability_id:selected.capability_id,provider:selected.provider,required_scopes:selected.required_scopes??[],host_requirements:selected.host_requirements??[],risk:selected.risk,reversible:selected.reversible,commit_phase:selected.commit_phase??'transaction',depends_on:[],cost:selected.cost,operation_template:selected.operation_template??null});
  if(goal.type==='artifact.report.generate')steps.push({step_id:`step:${steps.length+1}`,goal:{type:'artifact.report.attach'},capability_id:'laf.report.attach',provider:'laf-runtime',required_scopes:['artifact.write'],host_requirements:[],risk:'medium',reversible:true,commit_phase:'transaction',depends_on:[steps.at(-1).step_id],cost:{cpu_millis:2,memory_mb:2,network_kb:0},operation_template:{op:'set',path:'/semantics/values/generated_report',value_from_context:'report'}});
 }
 const progress=steps.find(s=>s.goal.type==='artifact.progress.target'),render=steps.find(s=>s.goal.type==='artifact.report.generate'),attach=steps.find(s=>s.goal.type==='artifact.report.attach'),notify=steps.find(s=>s.goal.type==='host.notification.emit');
 if(progress&&render&&!render.depends_on.includes(progress.step_id))render.depends_on.push(progress.step_id); if(attach&&notify&&!notify.depends_on.includes(attach.step_id))notify.depends_on.push(attach.step_id);
 const required_scopes=uniqueSorted(steps.flatMap(s=>s.required_scopes)); const required_host_capabilities=uniqueSorted(steps.flatMap(s=>s.host_requirements));
 const total_cost=steps.reduce((a,s)=>({cpu_millis:a.cpu_millis+(s.cost?.cpu_millis??0),memory_mb:a.memory_mb+(s.cost?.memory_mb??0),network_kb:a.network_kb+(s.cost?.network_kb??0)}),{cpu_millis:0,memory_mb:0,network_kb:0});
 return seal({format:'icar.capability-plan.v0.2',plan_id:`plan:${intent.intent_root.slice(0,20)}`,intent_root:intent.intent_root,steps,alternatives,required_scopes,required_host_capabilities,total_cost},'plan_root');
}
