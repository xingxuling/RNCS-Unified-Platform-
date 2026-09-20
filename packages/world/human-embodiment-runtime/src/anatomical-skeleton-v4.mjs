import {qIdentity,qNormalize,qMul,qRotateVec} from './quaternion.mjs';
import {add} from './math.mjs';
import {m4FromRT,m4Mul} from './matrix4.mjs';

// Anatomical frame follows the ISB-style reporting convention used by this module:
// +X anterior, +Y superior/cranial, +Z subject-right. Right-handed.
// Render/native engines may use another frame; use anatomical-coordinates-v4.mjs adapters.
export const ANATOMICAL_FRAME={handedness:'right',x:'+anterior',y:'+superior',z:'+subject-right',units:'m'};

export const DEFAULT_ANATOMICAL_PROFILE={
  height:1.74,
  pelvisWidth:0.23,pelvisDepth:0.18,pelvisHeight:0.16,
  lumbarLength:0.20,thoracicLength:0.30,cervicalLength:0.12,headLength:0.22,
  shoulderWidth:0.42,clavicleLength:0.14,scapulaOffsetPosterior:0.055,
  upperArmLength:0.30,forearmLength:0.26,handLength:0.19,
  thighLength:0.45,shankLength:0.42,footLength:0.26,footWidth:0.095,heelHeight:0.07,
  toeLength:0.075
};

function scaledProfile(input={}){
  const d={...DEFAULT_ANATOMICAL_PROFILE,...input};
  if(input.height && !Object.keys(input).some(k=>k!=='height')){
    const s=input.height/DEFAULT_ANATOMICAL_PROFILE.height;
    for(const k of Object.keys(d)) if(k!=='height') d[k]*=s;
  }
  return d;
}

function J(name,parent,bindOffset,kind='joint',meta={}){return {name,parent,bindOffset,kind,...meta}}

export function createProfessionalHumanSkeleton(profile={}){
  const d=scaledProfile(profile), L=-1,R=1;
  const joints=[
    J('pelvis',null,[0,0,0],'joint',{jcs:'pelvis'}),
    J('L5','pelvis',[0,d.lumbarLength*0.20,0],'joint',{jcs:'lumbar'}),
    J('L3','L5',[0,d.lumbarLength*0.30,0],'joint',{jcs:'lumbar'}),
    J('L1','L3',[0,d.lumbarLength*0.30,0],'joint',{jcs:'lumbar'}),
    J('T12','L1',[0,d.lumbarLength*0.20,0],'joint',{jcs:'thoracic'}),
    J('T8','T12',[0,d.thoracicLength*0.34,0],'joint',{jcs:'thoracic'}),
    J('T4','T8',[0,d.thoracicLength*0.33,0],'joint',{jcs:'thoracic'}),
    J('C7','T4',[0,d.thoracicLength*0.33,0],'joint',{jcs:'cervical'}),
    J('C3','C7',[0,d.cervicalLength*0.48,0],'joint',{jcs:'cervical'}),
    J('head','C3',[0,d.cervicalLength*0.52+d.headLength*0.42,0],'joint',{jcs:'head'}),
  ];
  for(const [side,sgn] of [['L',L],['R',R]]){
    joints.push(
      J(`SC_${side}`,'T4',[0,0,sgn*d.shoulderWidth*0.18],'joint',{jcs:'sternoclavicular',side}),
      J(`AC_${side}`,`SC_${side}`,[-d.clavicleLength*0.06,0,sgn*d.clavicleLength],'joint',{jcs:'acromioclavicular',side}),
      J(`scapula_${side}`,`AC_${side}`,[-d.scapulaOffsetPosterior,0,sgn*d.shoulderWidth*0.06],'virtual',{side}),
      J(`GH_${side}`,`AC_${side}`,[0,-0.025,sgn*d.shoulderWidth*0.08],'joint',{jcs:'glenohumeral',side}),
      J(`elbow_${side}`,`GH_${side}`,[0,-d.upperArmLength,0],'joint',{jcs:'elbow',side}),
      J(`radioulnar_${side}`,`elbow_${side}`,[0,-d.forearmLength*0.45,0],'joint',{jcs:'radioulnar',side}),
      J(`wrist_${side}`,`radioulnar_${side}`,[0,-d.forearmLength*0.55,0],'joint',{jcs:'wrist',side}),
      J(`hand_${side}`,`wrist_${side}`,[d.handLength*0.45,0,0],'segment-center',{side}),
      J(`middleMCP_${side}`,`wrist_${side}`,[d.handLength*0.72,0,0],'landmark',{side}),
      J(`middleTip_${side}`,`middleMCP_${side}`,[d.handLength*0.28,0,0],'landmark',{side})
    );
    joints.push(
      J(`hip_${side}`,'pelvis',[0,-d.pelvisHeight*0.28,sgn*d.pelvisWidth*0.43],'joint',{jcs:'hip',side}),
      J(`knee_${side}`,`hip_${side}`,[0,-d.thighLength,0],'joint',{jcs:'knee',side}),
      J(`ankle_${side}`,`knee_${side}`,[0,-d.shankLength,0],'joint',{jcs:'ankle',side}),
      J(`subtalar_${side}`,`ankle_${side}`,[d.footLength*0.10,-d.heelHeight*0.45,0],'joint',{jcs:'subtalar',side}),
      J(`heel_${side}`,`subtalar_${side}`,[-d.footLength*0.22,-d.heelHeight*0.55,0],'landmark',{side}),
      J(`MTP1_${side}`,`subtalar_${side}`,[d.footLength*0.72,0,sgn*-d.footWidth*0.28],'joint',{jcs:'mtp',side}),
      J(`MTP5_${side}`,`subtalar_${side}`,[d.footLength*0.70,0,sgn*d.footWidth*0.33],'landmark',{side}),
      J(`hallux_${side}`,`MTP1_${side}`,[d.toeLength,0,0],'landmark',{side})
    );
  }
  const byName=Object.fromEntries(joints.map((j,i)=>[j.name,{...j,index:i}]));
  const landmarks=buildAnatomicalLandmarkDefinitions(d);
  const segments=buildSegmentDefinitions();
  return {id:'rncs.professional-human.v0.4',standard:'ISB-aligned-simulation-rig',frame:ANATOMICAL_FRAME,profile:d,joints,byName,root:'pelvis',landmarks,segments};
}

export function createProfessionalPoseState(skeleton,{rootPosition=[0,skeleton.profile.thighLength+skeleton.profile.shankLength+skeleton.profile.pelvisHeight*0.5,0],rootRotation=qIdentity(),localRotations={},localTranslations={}}={}){
  const rotations={},translations={};
  for(const j of skeleton.joints){rotations[j.name]=qNormalize(localRotations[j.name]??qIdentity());translations[j.name]=localTranslations[j.name]??[0,0,0]}
  return {rootPosition:[...rootPosition],rootRotation:qNormalize(rootRotation),localRotations:rotations,localTranslations:translations,frame:skeleton.frame};
}

export function forwardKinematicsProfessional(skeleton,state){
  const world={},matrices={};
  for(const joint of skeleton.joints){
    const lr=state.localRotations[joint.name]??qIdentity(),lt=state.localTranslations?.[joint.name]??[0,0,0];
    if(joint.parent===null){
      const p=add(state.rootPosition,lt),r=qMul(state.rootRotation,lr);world[joint.name]={position:p,rotation:r};matrices[joint.name]=m4FromRT(r,p);continue;
    }
    const parent=world[joint.parent],pm=matrices[joint.parent];
    const off=add(joint.bindOffset,lt),p=add(parent.position,qRotateVec(parent.rotation,off)),r=qMul(parent.rotation,lr);
    world[joint.name]={position:p,rotation:r};matrices[joint.name]=m4Mul(pm,m4FromRT(lr,off));
  }
  return {world,matrices,state,skeleton};
}

export function buildAnatomicalLandmarkDefinitions(d){
  return {
    ASIS_L:{parent:'pelvis',offset:[d.pelvisDepth*0.40,0,-d.pelvisWidth*0.46]},
    ASIS_R:{parent:'pelvis',offset:[d.pelvisDepth*0.40,0,d.pelvisWidth*0.46]},
    PSIS_L:{parent:'pelvis',offset:[-d.pelvisDepth*0.36,0,-d.pelvisWidth*0.42]},
    PSIS_R:{parent:'pelvis',offset:[-d.pelvisDepth*0.36,0,d.pelvisWidth*0.42]},
    IJ:{parent:'T4',offset:[d.pelvisDepth*0.32,0,0]},
    PX:{parent:'T12',offset:[d.pelvisDepth*0.30,0,0]},
    C7:{parent:'C7',offset:[0,0,0]},
    vertex:{parent:'head',offset:[0,d.headLength*0.58,0]},
    tragionL:{parent:'head',offset:[0,0,-0.075]},tragionR:{parent:'head',offset:[0,0,0.075]},
    acromionL:{parent:'AC_L',offset:[0,0,0]},acromionR:{parent:'AC_R',offset:[0,0,0]},
    elbowLatL:{parent:'elbow_L',offset:[0,0,-0.035]},elbowMedL:{parent:'elbow_L',offset:[0,0,0.035]},
    elbowLatR:{parent:'elbow_R',offset:[0,0,0.035]},elbowMedR:{parent:'elbow_R',offset:[0,0,-0.035]},
    wristRadL:{parent:'wrist_L',offset:[0,0,-0.025]},wristUlnL:{parent:'wrist_L',offset:[0,0,0.025]},
    wristRadR:{parent:'wrist_R',offset:[0,0,0.025]},wristUlnR:{parent:'wrist_R',offset:[0,0,-0.025]},
    kneeLatL:{parent:'knee_L',offset:[0,0,-0.045]},kneeMedL:{parent:'knee_L',offset:[0,0,0.045]},
    kneeLatR:{parent:'knee_R',offset:[0,0,0.045]},kneeMedR:{parent:'knee_R',offset:[0,0,-0.045]},
    ankleLatL:{parent:'ankle_L',offset:[0,0,-0.035]},ankleMedL:{parent:'ankle_L',offset:[0,0,0.030]},
    ankleLatR:{parent:'ankle_R',offset:[0,0,0.035]},ankleMedR:{parent:'ankle_R',offset:[0,0,-0.030]},
    heelL:{parent:'heel_L',offset:[0,0,0]},heelR:{parent:'heel_R',offset:[0,0,0]},
    MTP1L:{parent:'MTP1_L',offset:[0,0,0]},MTP1R:{parent:'MTP1_R',offset:[0,0,0]},
    MTP5L:{parent:'MTP5_L',offset:[0,0,0]},MTP5R:{parent:'MTP5_R',offset:[0,0,0]}
  };
}

export function buildSegmentDefinitions(){
  return [
    {name:'pelvis',proximal:'pelvis',distal:'L5'},
    {name:'lumbar',proximal:'L5',distal:'T12'},
    {name:'thorax',proximal:'T12',distal:'C7'},
    {name:'headNeck',proximal:'C7',distal:'head'},
    ...['L','R'].flatMap(s=>[
      {name:`clavicle_${s}`,proximal:`SC_${s}`,distal:`AC_${s}`},
      {name:`upperArm_${s}`,proximal:`GH_${s}`,distal:`elbow_${s}`},
      {name:`forearm_${s}`,proximal:`elbow_${s}`,distal:`wrist_${s}`},
      {name:`hand_${s}`,proximal:`wrist_${s}`,distal:`middleMCP_${s}`},
      {name:`thigh_${s}`,proximal:`hip_${s}`,distal:`knee_${s}`},
      {name:`shank_${s}`,proximal:`knee_${s}`,distal:`ankle_${s}`},
      {name:`foot_${s}`,proximal:`ankle_${s}`,distal:`MTP1_${s}`}
    ])
  ];
}

export function computeLandmarks(skeleton,fk){
  const out={};
  for(const [name,lm] of Object.entries(skeleton.landmarks)){
    const p=fk.world[lm.parent];if(!p)continue;
    out[name]=add(p.position,qRotateVec(p.rotation,lm.offset));
  }
  return out;
}
