import {add,sub,mul,len,norm} from './math.mjs';
import {clonePoseState,forwardKinematics} from './skeleton-v2.mjs';
import {solveMultiTargetIK,solveLimbIK} from './ik.mjs';
import {qFromTo,qConjugate,qRotateVec,qMul} from './quaternion.mjs';
import {enforceJointLimits} from './joint-limits-v3.mjs';

function average(vs){return vs.length?vs.reduce((a,b)=>add(a,b),[0,0,0]).map(v=>v/vs.length):[0,0,0]}

export function solveFullBodyIK(skeleton,inputState,targets={},opts={}){
  const {iterations=6,tolerance=0.008,rootGain=0.55,jointLimits=true}=opts; let state=clonePoseState(inputState),evidence=[];
  for(let iter=0;iter<iterations;iter++){
    let fk=forwardKinematics(skeleton,state); const rootErrors=[];
    const pairs=[['legL','ankleL'],['legR','ankleR'],['armL','wristL'],['armR','wristR']];
    for(const [limb,joint] of pairs)if(targets[limb])rootErrors.push(sub(targets[limb],fk.world[joint].position));
    if(targets.pelvis)rootErrors.push(sub(targets.pelvis,fk.world.pelvis.position));
    if(rootErrors.length){const delta=mul(average(rootErrors),rootGain/(1+iter*0.35));state.rootPosition=add(state.rootPosition,delta);}
    const limbTargets={};for(const k of ['legL','legR','armL','armR'])if(targets[k])limbTargets[k]=targets[k];
    if(Object.keys(limbTargets).length){const ik=solveMultiTargetIK(skeleton,state,limbTargets,{iterations:2,tolerance});state=ik.state;}
    // Chest/head directional constraints are solved as local orientation corrections after limb placement.
    fk=forwardKinematics(skeleton,state);
    if(targets.chestForward){const current=qRotateVec(fk.world.chest.rotation,[0,0,1]),desired=norm(targets.chestForward);const worldDelta=qFromTo(current,desired);const parentRot=fk.world.spine.rotation;const localDelta=qMul(qMul(qConjugate(parentRot),worldDelta),parentRot);state.localRotations.chest=qMul(localDelta,state.localRotations.chest);}
    fk=forwardKinematics(skeleton,state);
    if(targets.lookAt){const hp=fk.world.head.position,desired=norm(sub(targets.lookAt,hp)),current=qRotateVec(fk.world.head.rotation,[0,0,1]);const worldDelta=qFromTo(current,desired),parentRot=fk.world.neck.rotation,localDelta=qMul(qMul(qConjugate(parentRot),worldDelta),parentRot);state.localRotations.head=qMul(localDelta,state.localRotations.head);}
    if(jointLimits)state=enforceJointLimits(skeleton,state).state;
    fk=forwardKinematics(skeleton,state); const res={};
    for(const [limb,joint] of pairs)if(targets[limb])res[limb]=len(sub(fk.world[joint].position,targets[limb])); if(targets.pelvis)res.pelvis=len(sub(fk.world.pelvis.position,targets.pelvis));
    const maxResidual=Math.max(0,...Object.values(res));evidence.push({iteration:iter+1,residuals:res,maxResidual}); if(maxResidual<=tolerance)break;
  }
  const fk=forwardKinematics(skeleton,state), last=evidence.at(-1)??{maxResidual:0,residuals:{}}; return {state,fk,evidence,residuals:last.residuals,maxResidual:last.maxResidual,ok:last.maxResidual<=tolerance};
}

export function solveGroundedFullBodyPose(skeleton,state,{leftFoot,rightFoot,leftHand,rightHand,lookAt,chestForward}={},opts={}){
  return solveFullBodyIK(skeleton,state,{legL:leftFoot,legR:rightFoot,armL:leftHand,armR:rightHand,lookAt,chestForward},opts);
}
