import { normalizeDescriptor, normalizeProvider } from './contracts.mjs';
export function fromIcarCapability(entry){
 return normalizeDescriptor({capability_id:entry.capability_id,version:entry.version??'1.0.0',provider_id:entry.provider??'icar-legacy',fulfills:entry.fulfills??[],inputs:{},outputs:{},required_scopes:entry.required_scopes??[],host_requirements:entry.host_requirements??[],risk:{level:entry.risk??'medium',reasons:['imported-from-icar-v0.5']},reversible:Boolean(entry.reversible),execution_phase:entry.commit_phase??'transaction',cost:entry.cost??{},transport:{kind:'local'},metadata:{source_format:'icar.capability-registry.v0.2',operation_template:entry.operation_template??null}});
}
export function providerFromIcarRegistry(registry,providerId='icar-v0.5-import'){
 return normalizeProvider({provider_id:providerId,protocol_versions:['0.1.0'],capabilities:(registry.entries??[]).map(fromIcarCapability),metadata:{source_registry_root:registry.registry_root??null}});
}
export function fromLafAffordance(artifact, affordance){
 return normalizeDescriptor({capability_id:`laf.${artifact.identity?.artifact_id??'artifact'}.${affordance.affordance_id}`,version:'1.0.0',provider_id:`laf:${artifact.identity?.artifact_id??'artifact'}`,fulfills:affordance.intent_patterns??[],inputs:{artifact_id:{type:'string',required:true}},outputs:{artifact_revision:{type:'string'}},required_scopes:affordance.required_scopes??[],host_requirements:(affordance.capability_requirements??[]).map(x=>x.id??x),risk:{level:'medium',reasons:['artifact-mutation']},reversible:true,execution_phase:'transaction',evidence:{produces:['laf.revision'],requires:[]},transport:{kind:'local'},metadata:{affordance}});
}
export function providerFromLaf(artifact){return normalizeProvider({provider_id:`laf:${artifact.identity?.artifact_id??'artifact'}`,capabilities:(artifact.affordances??[]).map(a=>fromLafAffordance(artifact,a))});}
export function fromHnacManifest(manifest){
 const capsuleId=manifest.identity?.capsule_id??manifest.capsule_id??manifest.app?.id??'capsule';
 const providerId=`hnac:${capsuleId}`;
 const explicit=manifest.provided_capabilities??manifest.exports?.capabilities??[];
 let caps;
 if(explicit.length){
  caps=explicit.map(c=>typeof c==='string'?normalizeDescriptor({capability_id:c,version:manifest.version??manifest.app?.version??'1.0.0',provider_id:providerId,fulfills:[c],transport:{kind:'hnac',capsule_id:capsuleId},risk:{level:'medium',reasons:['hnac-export']}}):normalizeDescriptor({...c,capability_id:c.capability_id??c.id,provider_id:c.provider_id??providerId,version:c.version??manifest.version??manifest.app?.version??'1.0.0',transport:c.transport??{kind:'hnac',capsule_id:capsuleId}}));
 }else{
  const requirements=(manifest.capabilities??[]).map(c=>typeof c==='string'?c:c.id).filter(Boolean);
  const appId=manifest.app?.id??capsuleId;
  caps=[normalizeDescriptor({capability_id:`hnac.app.${appId}.run`,version:manifest.app?.version??manifest.version??'1.0.0',provider_id:providerId,fulfills:['application.run',`application.run.${appId}`],inputs:{intent:{type:'object',required:false}},outputs:{application_result:{type:'object'}},required_scopes:[],host_requirements:requirements,risk:{level:'medium',reasons:['application-execution']},reversible:false,execution_phase:'transaction',evidence:{produces:['application.result'],requires:[]},transport:{kind:'hnac',capsule_id:capsuleId,entrypoint:manifest.execution?.primary?.entry??null},metadata:{source_format:manifest.format??manifest.format_version??'hnac',required_host_capabilities:requirements}})];
 }
 return normalizeProvider({provider_id:providerId,capabilities:caps,metadata:{source_format:manifest.format??manifest.format_version??'hnac'}});
}
