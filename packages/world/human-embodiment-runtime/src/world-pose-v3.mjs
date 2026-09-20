import {norm,sub} from './math.mjs';
import {createPoseState,forwardKinematics} from './skeleton-v2.mjs';
import {qFromTo,qConjugate,qMul,qRotateVec,qIdentity} from './quaternion.mjs';

export function worldJointsToPose(skeleton,worldPositions,{rootRotation=qIdentity(),rootPosition=null}={}){
  const state=createPoseState(skeleton,{rootPosition:rootPosition??worldPositions.pelvis??[0,skeleton.profile.pelvisHeight,0],rootRotation});
  let fk=forwardKinematics(skeleton,state);
  for(const joint of skeleton.joints){
    const children=skeleton.joints.filter(x=>x.parent===joint.name); if(!children.length)continue;
    const child=children.find(c=>worldPositions[c.name])??children[0]; if(!worldPositions[joint.name]||!worldPositions[child.name])continue;
    const desiredWorld=norm(sub(worldPositions[child.name],worldPositions[joint.name]));
    const parentRot=joint.parent?fk.world[joint.parent].rotation:state.rootRotation;
    const desiredLocal=qRotateVec(qConjugate(parentRot),desiredWorld); state.localRotations[joint.name]=qFromTo(child.bindOffset,desiredLocal); fk=forwardKinematics(skeleton,state);
  }
  return {state,fk};
}

export function poseToWorldJointMap(skeleton,state){const fk=forwardKinematics(skeleton,state);return Object.fromEntries(Object.entries(fk.world).map(([k,v])=>[k,[...v.position]]));}
