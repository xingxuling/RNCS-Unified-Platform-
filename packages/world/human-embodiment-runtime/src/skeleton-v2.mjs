import {qIdentity,qMul,qRotateVec,qNormalize} from './quaternion.mjs';
import {add} from './math.mjs';
import {m4FromRT,m4Mul,m4Identity} from './matrix4.mjs';

export const DEFAULT_HUMAN_PROFILE={
  height:1.74,pelvisHeight:0.99,hipHalf:0.105,shoulderHalf:0.22,
  spine1:0.22,spine2:0.24,neck:0.11,head:0.18,
  upperArm:0.29,forearm:0.26,thigh:0.45,shin:0.42,ankleToFoot:0.10,footForward:0.12
};

export function createCanonicalHumanSkeleton(profile={}){
  const d={...DEFAULT_HUMAN_PROFILE,...profile};
  const joints=[
    {name:'pelvis',parent:null,bindOffset:[0,0,0]},
    {name:'spine',parent:'pelvis',bindOffset:[0,d.spine1,0]},
    {name:'chest',parent:'spine',bindOffset:[0,d.spine2,0]},
    {name:'neck',parent:'chest',bindOffset:[0,d.neck,0]},
    {name:'head',parent:'neck',bindOffset:[0,d.head,0]},
    {name:'shoulderL',parent:'chest',bindOffset:[-d.shoulderHalf,0,0]},
    {name:'elbowL',parent:'shoulderL',bindOffset:[-d.upperArm,0,0]},
    {name:'wristL',parent:'elbowL',bindOffset:[-d.forearm,0,0]},
    {name:'shoulderR',parent:'chest',bindOffset:[d.shoulderHalf,0,0]},
    {name:'elbowR',parent:'shoulderR',bindOffset:[d.upperArm,0,0]},
    {name:'wristR',parent:'elbowR',bindOffset:[d.forearm,0,0]},
    {name:'hipL',parent:'pelvis',bindOffset:[-d.hipHalf,-0.02,0]},
    {name:'kneeL',parent:'hipL',bindOffset:[0,-d.thigh,0]},
    {name:'ankleL',parent:'kneeL',bindOffset:[0,-d.shin,0]},
    {name:'footL',parent:'ankleL',bindOffset:[0,-d.ankleToFoot,d.footForward]},
    {name:'hipR',parent:'pelvis',bindOffset:[d.hipHalf,-0.02,0]},
    {name:'kneeR',parent:'hipR',bindOffset:[0,-d.thigh,0]},
    {name:'ankleR',parent:'kneeR',bindOffset:[0,-d.shin,0]},
    {name:'footR',parent:'ankleR',bindOffset:[0,-d.ankleToFoot,d.footForward]}
  ];
  const byName=Object.fromEntries(joints.map((j,i)=>[j.name,{...j,index:i}]));
  return {id:'rncs.canonical-human.v0.2',profile:d,joints,byName,root:'pelvis'};
}

export function createPoseState(skeleton,{rootPosition=[0,skeleton.profile.pelvisHeight,0],rootRotation=qIdentity(),localRotations={},localTranslations={}}={}){
  const rotations={},translations={};
  for(const j of skeleton.joints){rotations[j.name]=qNormalize(localRotations[j.name]??qIdentity());translations[j.name]=localTranslations[j.name]??[0,0,0]}
  return {rootPosition:[...rootPosition],rootRotation:qNormalize(rootRotation),localRotations:rotations,localTranslations:translations};
}

export function forwardKinematics(skeleton,state){
  const world={},matrices={};
  for(const joint of skeleton.joints){
    if(joint.parent===null){
      const localT=state.localTranslations?.[joint.name]??[0,0,0];
      const pos=add(state.rootPosition,localT),rot=qMul(state.rootRotation,state.localRotations[joint.name]??qIdentity());
      world[joint.name]={position:pos,rotation:rot};matrices[joint.name]=m4FromRT(rot,pos);continue;
    }
    const parent=world[joint.parent],parentM=matrices[joint.parent];
    const extra=state.localTranslations?.[joint.name]??[0,0,0];
    const localOffset=add(joint.bindOffset,extra);
    const pos=add(parent.position,qRotateVec(parent.rotation,localOffset));
    const rot=qMul(parent.rotation,state.localRotations[joint.name]??qIdentity());
    world[joint.name]={position:pos,rotation:rot};
    matrices[joint.name]=m4Mul(parentM,m4FromRT(state.localRotations[joint.name]??qIdentity(),localOffset));
  }
  return {world,matrices,state,skeleton};
}

export function clonePoseState(state){return structuredClone(state)}
export function getBindDirection(skeleton,parent,child){const c=skeleton.byName[child];if(!c||c.parent!==parent)throw new Error(`${child} is not child of ${parent}`);return c.bindOffset}
