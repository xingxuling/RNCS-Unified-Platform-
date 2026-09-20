import {BONE_EDGES} from './skeleton.mjs';
import {sub,len,lerp3} from './math.mjs';

function capsuleFor(a,b,radius,id){const L=len(sub(b,a));return {id,kind:'capsule',a,b,radius,halfHeight:Math.max(0,(L-2*radius)/2)}}
export function toRsrSpatialEmbodiment({entityId='human',pose,control,evaluation}){
  const bodies=[]; for(const [a,b] of BONE_EDGES){if(!pose[a]||!pose[b])continue; const radius=(a.includes('pelvis')||a.includes('chest'))?0.10:(a.includes('hip')||a.includes('knee'))?0.06:0.045;bodies.push(capsuleFor(pose[a],pose[b],radius,`${entityId}:${a}-${b}`))}
  bodies.push({id:`${entityId}:footL`,kind:'obb',center:pose.footL,halfExtents:[0.05,0.03,0.13],yawDeg:control.leftFootYaw||0});
  bodies.push({id:`${entityId}:footR`,kind:'obb',center:pose.footR,halfExtents:[0.05,0.03,0.13],yawDeg:control.rightFootYaw||0});
  return {
    protocol:'rsr.spatial-embodiment.v0.6',entity_id:entityId,authority:'rncs.human-embodiment',
    root:{position:pose.pelvis,forward_yaw_deg:control.torsoYaw||0},bodies,
    contacts:{left_foot:control.contacts?.[0]!==false,right_foot:control.contacts?.[1]!==false},
    derived:{center_of_mass:evaluation?.com??null,support_polygon:evaluation?.support?.polygon??null,valid:evaluation?.ok??null}
  };
}
export function rsrConstraintHints(evaluation){return {deterministic:true,contact_stabilization:true,friction_warm_start:true,sleep_allowed:false,fail_closed:!evaluation.ok}}
