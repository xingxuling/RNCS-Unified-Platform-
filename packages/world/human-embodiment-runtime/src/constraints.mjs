import {angleABC} from './math.mjs';
import {centerOfMass,trunkTiltDeg} from './biomechanics.mjs';
import {evaluateSupport} from './support.mjs';
import {JOINT_LIMITS} from './skeleton.mjs';

function rangeCheck(v,[lo,hi]){return v>=lo&&v<=hi}
export function evaluatePose({control,pose,final=false,profile={}}){
  const com=centerOfMass(pose),support=evaluateSupport(control,com);
  const kneeL=angleABC(pose.hipL,pose.kneeL,pose.ankleL),kneeR=angleABC(pose.hipR,pose.kneeR,pose.ankleR);
  const elbowL=angleABC(pose.shoulderL,pose.elbowL,pose.wristL),elbowR=angleABC(pose.shoulderR,pose.elbowR,pose.wristR);
  const trunk=trunkTiltDeg(pose); const lateralGap=control.rightFoot[0]-control.leftFoot[0];
  const crossing=lateralGap<(profile.minLateralGap??0.03);
  const footHeightTol=profile.footHeightTol??0.025;
  const leftContact=control.contacts?.[0]===false||Math.abs(control.leftFoot[1])<=footHeightTol;
  const rightContact=control.contacts?.[1]===false||Math.abs(control.rightFoot[1])<=footHeightTol;
  const guardThreshold=profile.guardThreshold??0.62;
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  const guardOk=!final||(dist(pose.wristL,pose.chest)<guardThreshold&&dist(pose.wristR,pose.chest)<guardThreshold);
  const checks=[
    {id:'support',label:'COM projection inside support polygon',ok:support.inside,value:support.margin},
    {id:'leg-crossing',label:'No leg crossing',ok:!crossing,value:lateralGap},
    {id:'foot-contact',label:'Declared foot contact matches floor',ok:leftContact&&rightContact,value:{left:leftContact,right:rightContact}},
    {id:'trunk-axis',label:'Trunk axis within limit',ok:trunk<=(profile.maxTrunkTiltDeg??15),value:trunk},
    {id:'knee-range',label:'Knees within configured range',ok:rangeCheck(kneeL,JOINT_LIMITS.kneeL)&&rangeCheck(kneeR,JOINT_LIMITS.kneeR),value:{left:kneeL,right:kneeR}},
    {id:'elbow-range',label:'Elbows within configured range',ok:rangeCheck(elbowL,JOINT_LIMITS.elbowL)&&rangeCheck(elbowR,JOINT_LIMITS.elbowR),value:{left:elbowL,right:elbowR}},
    {id:'return-guard',label:'Final frame returned to guard',ok:guardOk,value:final?guardOk:'process'}
  ];
  return {ok:checks.every(c=>c.ok),checks,com,support,jointAngles:{kneeL,kneeR,elbowL,elbowR},trunkTiltDeg:trunk};
}
