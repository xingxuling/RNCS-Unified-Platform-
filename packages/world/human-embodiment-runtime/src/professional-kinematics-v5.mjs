import {add,sub,len,norm,mul} from './math.mjs';
import {qConjugate,qMul,qRotateVec,qFromTo,qNormalize,qIdentity} from './quaternion.mjs';
import {createProfessionalPoseState,forwardKinematicsProfessional} from './anatomical-skeleton-v4.mjs';

export const PROFESSIONAL_CHAINS={
  armL:['GH_L','elbow_L','radioulnar_L','wrist_L'],
  armR:['GH_R','elbow_R','radioulnar_R','wrist_R'],
  legL:['hip_L','knee_L','ankle_L','subtalar_L','MTP1_L'],
  legR:['hip_R','knee_R','ankle_R','subtalar_R','MTP1_R']
};

function cloneState(state){return structuredClone(state)}
function parentWorldRotation(skeleton,fk,joint){const p=skeleton.byName[joint]?.parent;return p?fk.world[p].rotation:fk.state.rootRotation}

export function solveProfessionalChainCCD(skeleton,inputState,chain,target,{iterations=12,tolerance=0.005,maxStepDeg=18}={}){
  let state=cloneState(inputState),evidence=[];
  const end=chain.at(-1),rotatable=chain.slice(0,-1);
  for(let iter=0;iter<iterations;iter++){
    let fk=forwardKinematicsProfessional(skeleton,state);
    let residual=len(sub(fk.world[end].position,target));
    if(residual<=tolerance){evidence.push({iteration:iter,residual});break}
    for(let ci=rotatable.length-1;ci>=0;ci--){
      const j=rotatable[ci];fk=forwardKinematicsProfessional(skeleton,state);
      const jp=fk.world[j].position,ep=fk.world[end].position;
      const a=sub(ep,jp),b=sub(target,jp);if(len(a)<1e-8||len(b)<1e-8)continue;
      let delta=qFromTo(a,b);
      const angle=2*Math.acos(Math.max(-1,Math.min(1,Math.abs(delta[3]))))*180/Math.PI;
      if(angle>maxStepDeg){const axis=norm([delta[0],delta[1],delta[2]]);const h=maxStepDeg*Math.PI/360;delta=[axis[0]*Math.sin(h),axis[1]*Math.sin(h),axis[2]*Math.sin(h),Math.cos(h)]}
      const pr=parentWorldRotation(skeleton,fk,j),localDelta=qMul(qMul(qConjugate(pr),delta),pr);
      state.localRotations[j]=qNormalize(qMul(localDelta,state.localRotations[j]??qIdentity()));
    }
    fk=forwardKinematicsProfessional(skeleton,state);residual=len(sub(fk.world[end].position,target));evidence.push({iteration:iter+1,residual});
    if(residual<=tolerance)break;
  }
  const fk=forwardKinematicsProfessional(skeleton,state),residual=len(sub(fk.world[end].position,target));
  return {state,fk,residual,ok:residual<=tolerance,chain,target:[...target],evidence};
}

export function solveProfessionalFullBodyIK(skeleton,inputState,targets={},opts={}){
  let state=cloneState(inputState),evidence=[];
  const passes=opts.passes??4,tolerance=opts.tolerance??0.008;
  for(let pass=0;pass<passes;pass++){
    const passEvidence=[];
    for(const key of ['legL','legR','armL','armR']){
      if(!targets[key])continue;
      const r=solveProfessionalChainCCD(skeleton,state,PROFESSIONAL_CHAINS[key],targets[key],{iterations:opts.chainIterations??8,tolerance,maxStepDeg:opts.maxStepDeg??16});
      state=r.state;passEvidence.push({key,residual:r.residual,ok:r.ok});
    }
    if(targets.pelvis){const fk=forwardKinematicsProfessional(skeleton,state),d=sub(targets.pelvis,fk.world.pelvis.position);state.rootPosition=add(state.rootPosition,mul(d,opts.rootGain??0.7));}
    evidence.push({pass:pass+1,targets:passEvidence});
    if(passEvidence.length&&passEvidence.every(x=>x.residual<=tolerance))break;
  }
  const fk=forwardKinematicsProfessional(skeleton,state),residuals={};
  const ends={armL:'wrist_L',armR:'wrist_R',legL:'MTP1_L',legR:'MTP1_R'};
  for(const [key,end] of Object.entries(ends))if(targets[key])residuals[key]=len(sub(fk.world[end].position,targets[key]));
  if(targets.pelvis)residuals.pelvis=len(sub(fk.world.pelvis.position,targets.pelvis));
  const maxResidual=Math.max(0,...Object.values(residuals));
  return {state,fk,evidence,residuals,maxResidual,ok:maxResidual<=tolerance};
}

export function migrateLegacyPoseToProfessional(legacySkeleton,legacyState,professionalSkeleton,{scaleRoot=true}={}){
  const map={
    pelvis:'pelvis',chest:'T4',head:'head',shoulderL:'GH_L',elbowL:'elbow_L',wristL:'wrist_L',shoulderR:'GH_R',elbowR:'elbow_R',wristR:'wrist_R',
    hipL:'hip_L',kneeL:'knee_L',ankleL:'ankle_L',footL:'MTP1_L',hipR:'hip_R',kneeR:'knee_R',ankleR:'ankle_R',footR:'MTP1_R'
  };
  const sourceFk=legacySkeleton&&legacyState?importLegacyFk(legacySkeleton,legacyState):null;
  let state=createProfessionalPoseState(professionalSkeleton,{rootPosition:sourceFk?.world?.pelvis?.position??undefined,rootRotation:legacyState?.rootRotation??undefined});
  if(sourceFk){const targets={};for(const [oldName,newName] of Object.entries(map)){const p=sourceFk.world?.[oldName]?.position;if(!p)continue;if(newName==='wrist_L')targets.armL=p;else if(newName==='wrist_R')targets.armR=p;else if(newName==='MTP1_L')targets.legL=p;else if(newName==='MTP1_R')targets.legR=p;else if(newName==='pelvis')targets.pelvis=p;}state=solveProfessionalFullBodyIK(professionalSkeleton,state,targets,{passes:5,tolerance:0.02}).state;}
  return state;
}
function importLegacyFk(skeleton,state){
  const world={},queue=skeleton.joints;for(const j of queue){const lr=state.localRotations?.[j.name]??qIdentity(),lt=state.localTranslations?.[j.name]??[0,0,0];if(j.parent===null){const p=add(state.rootPosition,lt),r=qMul(state.rootRotation,lr);world[j.name]={position:p,rotation:r};}else{const p0=world[j.parent],off=add(j.bindOffset,lt);world[j.name]={position:add(p0.position,qRotateVec(p0.rotation,off)),rotation:qMul(p0.rotation,lr)};}}return {world};
}
