import { rootHash, seal, uniqueSorted, ICARError } from './canonical.mjs';
function hostIds(host){return(host.capabilities??[]).map(x=>typeof x==='string'?x:x.id);}
export function verifyCapsule(capsule){
 const version=String(capsule.format_version??capsule.contract_version??'');
 if(!['0.5','0.4'].includes(version))throw new ICARError('HNAC_CONTRACT_UNSUPPORTED',version);
 const appId=capsule.app?.id??capsule.identity?.id; if(!appId)throw new ICARError('HNAC_CAPSULE_ID_REQUIRED');
 const caps=(capsule.capabilities??capsule.requests??[]).map(x=>({id:x.id,required:x.required!==false,scope:x.scope??'session'}));
 return seal({format:'icar.hnac-verification.v0.2',contract_version:version,app_id:appId,capabilities:caps,source_root:rootHash(capsule),signature_status:capsule.security?.signature??capsule.signature?.status??'optional'},'verification_root');
}
export function negotiateHosts({capsule,hosts,requiredHostCapabilities=[]}){
 const verification=verifyCapsule(capsule); const available=uniqueSorted(hosts.flatMap(hostIds));
 const capsuleRequired=verification.capabilities.filter(x=>x.required).map(x=>x.id);
 const required=uniqueSorted([...requiredHostCapabilities,...capsuleRequired]);
 const grants=required.filter(x=>available.includes(x)); const unresolved=required.filter(x=>!available.includes(x));
 return seal({format:'icar.host-negotiation.v0.2',status:unresolved.length?'blocked':'ready',verification,host_ids:hosts.map(h=>h.identity?.id??h.host_id??'unknown'),available,required,grants,unresolved,profile:'rncs-composite-host@0.5'},'negotiation_root');
}
export function hostStateReferences(hosts){return hosts.map((h,i)=>({kind:'host-state',source_format:'hnaf.portable-state.v0.5',host_id:h.identity?.id??h.host_id??`host:${i}`,replica_id:h.replica_id??`replica:${h.identity?.id??i}`,snapshot_sequence:Number(h.snapshot_sequence??0),state_root:h.state_root??rootHash({host:h.identity??h.host_id??i,state:h.state??{}}),schema_version:String(h.state_schema_version??'1'),partitions:h.state_partitions??['portable','device_private'],continuity_class:'replica_snapshot'}));}
export function emitNotification(negotiation,payload){if(negotiation.status!=='ready'||!negotiation.grants.includes('host.notification'))throw new ICARError('HOST_NOTIFICATION_NOT_GRANTED');return seal({format:'icar.host-receipt.v0.2',capability_id:'host.notification',status:'simulated-delivery',payload},'receipt_root');}
