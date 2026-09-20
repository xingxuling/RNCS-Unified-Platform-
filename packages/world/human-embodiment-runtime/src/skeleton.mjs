import {add,rotateX,rotateY,rad,solveTwoBone} from './math.mjs';

export const CANONICAL_DIMENSIONS={
  height:1.74,pelvisHeight:0.96,torso:0.50,neck:0.14,head:0.18,
  shoulderHalf:0.23,hipHalf:0.105,upperArm:0.30,forearm:0.28,thigh:0.48,shin:0.46,footLength:0.255,footWidth:0.095
};
export const BONE_EDGES=[
  ['pelvis','spine'],['spine','chest'],['chest','neck'],['neck','head'],
  ['chest','shoulderL'],['shoulderL','elbowL'],['elbowL','wristL'],
  ['chest','shoulderR'],['shoulderR','elbowR'],['elbowR','wristR'],
  ['pelvis','hipL'],['hipL','kneeL'],['kneeL','ankleL'],['ankleL','footL'],
  ['pelvis','hipR'],['hipR','kneeR'],['kneeR','ankleR'],['ankleR','footR']
];
export const JOINT_LIMITS={
  kneeL:[15,178],kneeR:[15,178],elbowL:[15,178],elbowR:[15,178]
};

export function defaultControl(){return {
  pelvis:[0,0.96,0],leftFoot:[-0.14,0,0.20],rightFoot:[0.14,0,-0.14],leftFootYaw:0,rightFootYaw:0,
  torsoYaw:0,torsoPitch:0,leftHand:[-0.17,1.33,0.31],rightHand:[0.17,1.28,0.25],headYaw:0,contacts:[true,true]
}}

export function buildPose(c,d=CANONICAL_DIMENSIONS){
  const p={}; p.pelvis=[...c.pelvis]; const yaw=rad(c.torsoYaw||0);
  p.chest=add(p.pelvis,rotateY(rotateX([0,d.torso,0],rad(c.torsoPitch||0)),yaw));
  p.spine=[(p.pelvis[0]+p.chest[0])/2,(p.pelvis[1]+p.chest[1])/2,(p.pelvis[2]+p.chest[2])/2];
  p.neck=add(p.chest,rotateY([0,d.neck,0],yaw)); p.head=add(p.neck,[0,d.head,0]);
  p.shoulderL=add(p.chest,rotateY([-d.shoulderHalf,0,0],yaw)); p.shoulderR=add(p.chest,rotateY([d.shoulderHalf,0,0],yaw));
  p.hipL=add(p.pelvis,rotateY([-d.hipHalf,-0.02,0],yaw)); p.hipR=add(p.pelvis,rotateY([d.hipHalf,-0.02,0],yaw));
  p.wristL=[...c.leftHand]; p.wristR=[...c.rightHand];
  p.elbowL=solveTwoBone(p.shoulderL,p.wristL,d.upperArm,d.forearm,[-0.2,-1,0.5]);
  p.elbowR=solveTwoBone(p.shoulderR,p.wristR,d.upperArm,d.forearm,[0.2,-1,0.5]);
  p.footL=[...c.leftFoot]; p.footR=[...c.rightFoot];
  p.ankleL=add(p.footL,[0,0.075,-0.055]); p.ankleR=add(p.footR,[0,0.075,-0.055]);
  p.kneeL=solveTwoBone(p.hipL,p.ankleL,d.thigh,d.shin,[0,-0.1,1]); p.kneeR=solveTwoBone(p.hipR,p.ankleR,d.thigh,d.shin,[0,-0.1,1]);
  return p;
}
