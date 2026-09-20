import {createCanonicalHumanSkeleton,createPoseState,forwardKinematics} from './skeleton-v2.mjs';
import {solveMultiTargetIK} from './ik.mjs';
import {mul} from './math.mjs';

export function retargetPoseState(sourceSkeleton,sourceState,targetProfile={},opts={}){
  const targetSkeleton=createCanonicalHumanSkeleton(targetProfile);
  const hScale=(targetSkeleton.profile.height??1.74)/(sourceSkeleton.profile.height??1.74);
  const localRotations={};for(const j of targetSkeleton.joints)localRotations[j.name]=sourceState.localRotations?.[j.name]??[0,0,0,1];
  let targetState=createPoseState(targetSkeleton,{rootPosition:mul(sourceState.rootPosition,hScale),rootRotation:sourceState.rootRotation,localRotations});
  const sfk=forwardKinematics(sourceSkeleton,sourceState);
  const targets={};
  if(opts.footLock!==false){targets.legL=mul(sfk.world.ankleL.position,hScale);targets.legR=mul(sfk.world.ankleR.position,hScale)}
  if(opts.handLock){targets.armL=mul(sfk.world.wristL.position,hScale);targets.armR=mul(sfk.world.wristR.position,hScale)}
  const solved=solveMultiTargetIK(targetSkeleton,targetState,targets,{iterations:opts.iterations??3,tolerance:opts.tolerance??0.006});
  return {skeleton:targetSkeleton,state:solved.state,fk:solved.fk,evidence:solved.evidence,ok:solved.ok,scale:hScale};
}

export function retargetPoseClip(sourceSkeleton,clip,targetProfile={},opts={}){
  const targetSkeleton=createCanonicalHumanSkeleton(targetProfile),keyframes=[],evidence=[];
  for(const k of clip.keyframes){const src=createPoseState(sourceSkeleton,k.pose);const r=retargetPoseState(sourceSkeleton,src,targetProfile,opts);keyframes.push({t:k.t,pose:r.state});evidence.push({t:k.t,evidence:r.evidence,ok:r.ok})}
  return {skeleton:targetSkeleton,clip:{...clip,keyframes,retarget:{targetProfile,options:opts}},evidence,ok:evidence.every(e=>e.ok)};
}
