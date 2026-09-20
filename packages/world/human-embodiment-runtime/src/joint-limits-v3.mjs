import {clamp, dot, norm, rad, deg} from './math.mjs';
import {qIdentity,qNormalize,qMul,qConjugate,qFromAxisAngle} from './quaternion.mjs';

export const DEFAULT_JOINT_LIMITS={
  pelvis:{swingDeg:25,twistDeg:35}, spine:{swingDeg:22,twistDeg:30}, chest:{swingDeg:28,twistDeg:40}, neck:{swingDeg:45,twistDeg:60},
  shoulderL:{swingDeg:125,twistDeg:105}, shoulderR:{swingDeg:125,twistDeg:105},
  elbowL:{swingDeg:150,twistDeg:90}, elbowR:{swingDeg:150,twistDeg:90},
  wristL:{swingDeg:75,twistDeg:90}, wristR:{swingDeg:75,twistDeg:90},
  hipL:{swingDeg:100,twistDeg:55}, hipR:{swingDeg:100,twistDeg:55},
  kneeL:{swingDeg:155,twistDeg:18}, kneeR:{swingDeg:155,twistDeg:18},
  ankleL:{swingDeg:55,twistDeg:35}, ankleR:{swingDeg:55,twistDeg:35},
  footL:{swingDeg:35,twistDeg:35}, footR:{swingDeg:35,twistDeg:35}
};
export function qToAxisAngle(q){const n=qNormalize(q),w=clamp(n[3],-1,1),angle=2*Math.acos(w),s=Math.sqrt(Math.max(0,1-w*w));if(s<1e-8)return {axis:[1,0,0],angle:0};return {axis:[n[0]/s,n[1]/s,n[2]/s],angle};}
export function swingTwistDecompose(q,twistAxis=[0,1,0]){const axis=norm(twistAxis),v=[q[0],q[1],q[2]],proj=axis.map(x=>x*dot(v,axis));const twist=qNormalize([proj[0],proj[1],proj[2],q[3]]),swing=qNormalize(qMul(q,qConjugate(twist)));return {swing,twist};}
function signedTwistAngle(twist,axis){const aa=qToAxisAngle(twist),sign=dot(aa.axis,norm(axis))>=0?1:-1;let a=aa.angle*sign;if(a>Math.PI)a-=2*Math.PI;if(a<-Math.PI)a+=2*Math.PI;return a;}
export function clampSwingTwist(q,{twistAxis=[0,1,0],swingDeg=180,twistDeg=180}={}){const {swing,twist}=swingTwistDecompose(q,twistAxis),saa=qToAxisAngle(swing),maxSwing=rad(swingDeg),swAngle=Math.min(saa.angle,maxSwing),clampedSwing=swAngle<1e-9?qIdentity():qFromAxisAngle(saa.axis,swAngle),tw=signedTwistAngle(twist,twistAxis),maxTw=rad(twistDeg),clampedTwist=qFromAxisAngle(twistAxis,clamp(tw,-maxTw,maxTw)),out=qNormalize(qMul(clampedSwing,clampedTwist));return {rotation:out,changed:saa.angle>maxSwing+1e-7||Math.abs(tw)>maxTw+1e-7,evidence:{swingDeg:deg(saa.angle),twistDeg:deg(tw),maxSwingDeg:swingDeg,maxTwistDeg:twistDeg}};}
function axisForJoint(skeleton,name){const children=skeleton.joints.filter(j=>j.parent===name);if(children.length)return norm(children[0].bindOffset);const j=skeleton.byName[name];return j?.bindOffset?norm(j.bindOffset):[0,1,0];}
export function enforceJointLimits(skeleton,inputState,{limits=DEFAULT_JOINT_LIMITS}={}){const state=structuredClone(inputState),evidence=[];for(const joint of skeleton.joints){const lim=limits[joint.name];if(!lim)continue;const axis=axisForJoint(skeleton,joint.name),r=clampSwingTwist(state.localRotations[joint.name],{twistAxis:axis,...lim});state.localRotations[joint.name]=r.rotation;evidence.push({joint:joint.name,...r.evidence,changed:r.changed});}return {state,evidence,changed:evidence.some(e=>e.changed)};}
export function inspectJointLimits(skeleton,state,{limits=DEFAULT_JOINT_LIMITS}={}){const evidence=[];for(const joint of skeleton.joints){const lim=limits[joint.name];if(!lim)continue;const axis=axisForJoint(skeleton,joint.name),r=clampSwingTwist(state.localRotations[joint.name],{twistAxis:axis,...lim});evidence.push({joint:joint.name,ok:!r.changed,...r.evidence});}return {ok:evidence.every(e=>e.ok),evidence};}
