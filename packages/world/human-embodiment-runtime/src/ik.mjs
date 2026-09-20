import {clonePoseState,forwardKinematics,getBindDirection} from './skeleton-v2.mjs';
import {solveTwoBone,sub,norm,len,add,mul} from './math.mjs';
import {qConjugate,qRotateVec,qFromTo,qIdentity} from './quaternion.mjs';

function localDirection(parentWorldRot,worldDir){return qRotateVec(qConjugate(parentWorldRot),worldDir)}

export function solveTwoBoneIK(skeleton,inputState,{root,mid,end,target,pole=[0,0,1],endRotation=null,tolerance=1e-4}={}){
  const state=clonePoseState(inputState);let fk=forwardKinematics(skeleton,state);
  const rp=fk.world[root].position,mp=fk.world[mid].position,ep=fk.world[end].position;
  const l1=len(sub(mp,rp)),l2=len(sub(ep,mp));
  const desiredMid=solveTwoBone(rp,target,l1,l2,pole);
  const rootParent=skeleton.byName[root].parent;
  const rootParentRot=rootParent?fk.world[rootParent].rotation:state.rootRotation;
  const bind1=getBindDirection(skeleton,root,mid);
  const desired1=localDirection(rootParentRot,norm(sub(desiredMid,rp)));
  state.localRotations[root]=qFromTo(bind1,desired1);
  fk=forwardKinematics(skeleton,state);
  const midParentRot=fk.world[root].rotation;
  const bind2=getBindDirection(skeleton,mid,end);
  const desired2=localDirection(midParentRot,norm(sub(target,fk.world[mid].position)));
  state.localRotations[mid]=qFromTo(bind2,desired2);
  if(endRotation) state.localRotations[end]=endRotation;
  fk=forwardKinematics(skeleton,state);
  const residual=len(sub(fk.world[end].position,target));
  return {state,fk,residual,ok:residual<=tolerance,target:[...target],chain:[root,mid,end]};
}

export function solveLimbIK(skeleton,state,limb,target,{pole,tolerance=2e-3}={}){
  const chains={
    armL:['shoulderL','elbowL','wristL'],armR:['shoulderR','elbowR','wristR'],
    legL:['hipL','kneeL','ankleL'],legR:['hipR','kneeR','ankleR']
  };
  const c=chains[limb];if(!c)throw new Error(`unknown limb ${limb}`);
  const defaults={armL:[-0.2,-1,0.5],armR:[0.2,-1,0.5],legL:[0,-0.1,1],legR:[0,-0.1,1]};
  return solveTwoBoneIK(skeleton,state,{root:c[0],mid:c[1],end:c[2],target,pole:pole??defaults[limb],tolerance});
}

export function solveMultiTargetIK(skeleton,inputState,targets,{iterations=3,tolerance=3e-3}={}){
  let state=clonePoseState(inputState),evidence=[];
  const order=['legL','legR','armL','armR'];
  for(let iter=0;iter<iterations;iter++){
    evidence=[];
    for(const limb of order){if(!targets[limb])continue;const r=solveLimbIK(skeleton,state,limb,targets[limb],{tolerance});state=r.state;evidence.push({limb,residual:r.residual,ok:r.ok})}
  }
  return {state,fk:forwardKinematics(skeleton,state),evidence,ok:evidence.every(e=>e.residual<=tolerance)};
}
