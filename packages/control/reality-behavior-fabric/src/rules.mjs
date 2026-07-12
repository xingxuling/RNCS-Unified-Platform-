import {evalCondition} from './expression.mjs';
export function matchingRules(program,eventType){return(program.rules??[]).filter(r=>r.event===eventType||r.event==='*').sort((a,b)=>(b.priority??0)-(a.priority??0)||(a.rule_id??'').localeCompare(b.rule_id??''));}
export function applyRules(runtime,event){
  for(const rule of matchingRules(runtime.program,event.type)){
    if(rule.once&&runtime.state.rule_memory[rule.rule_id]?.fired)continue;
    const entityId=rule.entity_id??event.target??event.payload?.entity_id??null;const ctx=runtime.context(entityId,event);
    if(!evalCondition(rule.condition,ctx))continue;
    runtime.executeActions(rule.actions??[],ctx);runtime.state.rule_memory[rule.rule_id]={fired:true,last_tick:runtime.state.tick,count:(runtime.state.rule_memory[rule.rule_id]?.count??0)+1};
    runtime.trace('rule.fired',{rule_id:rule.rule_id,event:event.type,entity_id:entityId});
  }
}
