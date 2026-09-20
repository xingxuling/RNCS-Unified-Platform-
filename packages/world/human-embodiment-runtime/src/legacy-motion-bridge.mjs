import {createCanonicalHumanSkeleton,createPoseState} from './skeleton-v2.mjs';
import {solveMultiTargetIK} from './ik.mjs';
import {qFromAxisAngle} from './quaternion.mjs';
import {rad} from './math.mjs';

export function controlToPoseState(control,profile={}){
  const skeleton=createCanonicalHumanSkeleton(profile);
  let state=createPoseState(skeleton,{rootPosition:[...control.pelvis],rootRotation:qFromAxisAngle([0,1,0],rad(control.torsoYaw??0))});
  const targets={legL:[control.leftFoot[0],control.leftFoot[1]+0.075,control.leftFoot[2]-0.055],legR:[control.rightFoot[0],control.rightFoot[1]+0.075,control.rightFoot[2]-0.055],armL:[...control.leftHand],armR:[...control.rightHand]};
  const solved=solveMultiTargetIK(skeleton,state,targets,{iterations:4,tolerance:0.012});
  return {skeleton,state:solved.state,fk:solved.fk,evidence:solved.evidence,ok:solved.ok};
}
