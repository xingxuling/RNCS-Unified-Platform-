import {sub,len} from './math.mjs';
import {qRotateVec} from './quaternion.mjs';

function capsuleFor(a,b,radius,id){const L=len(sub(b,a));return {id,kind:'capsule',a,b,radius,halfHeight:Math.max(0,(L-2*radius)/2)}}
export function toRsrSpatialEmbodimentV2({entityId='human',skeleton,fk,evaluation,contacts={left:true,right:true}}){
  const bodies=[];
  for(const j of skeleton.joints){if(!j.parent)continue;const a=fk.world[j.parent]?.position,b=fk.world[j.name]?.position;if(!a||!b)continue;const lname=j.name.toLowerCase();const radius=lname.includes('hip')||lname.includes('knee')?0.06:lname.includes('spine')||lname.includes('chest')?0.10:0.045;bodies.push(capsuleFor(a,b,radius,`${entityId}:${j.parent}-${j.name}`))}
  const footHalf=[Math.max(0.045,skeleton.profile.footForward*0.38),0.03,Math.max(0.11,skeleton.profile.footForward)];
  for(const side of ['L','R']){const w=fk.world[`foot${side}`];if(!w)continue;const f=qRotateVec(w.rotation,[0,0,1]);bodies.push({id:`${entityId}:foot${side}`,kind:'obb',center:w.position,halfExtents:footHalf,forward:f,rotation:w.rotation})}
  return {protocol:'rsr.spatial-embodiment.v0.6',extension:'her.pose-state.v0.2',entity_id:entityId,authority:'rncs.human-embodiment',root:{position:fk.world.pelvis.position,rotation:fk.world.pelvis.rotation},bodies,contacts:{left_foot:contacts.left!==false,right_foot:contacts.right!==false},derived:{center_of_mass:evaluation?.com??null,support_polygon:evaluation?.support?.polygon??null,valid:evaluation?.ok??null}};
}
