import {add,mul,sub,norm,dot,clamp,deg,projectXZ} from './math.mjs';

// Configurable approximate segment-mass model. It is a simulation default, not a clinical measurement model.
export const MASS_MODEL={
  pelvis:0.20,chest:0.24,head:0.08,shoulderL:0.02,shoulderR:0.02,elbowL:0.02,elbowR:0.02,
  wristL:0.01,wristR:0.01,hipL:0.08,hipR:0.08,kneeL:0.07,kneeR:0.07,ankleL:0.04,ankleR:0.04
};
export function centerOfMass(pose,weights=MASS_MODEL){
  let s=[0,0,0],total=0; for(const [k,w] of Object.entries(weights)){const p=pose[k]; if(!p)continue; s=add(s,mul(p,w)); total+=w}
  return total?s.map(v=>v/total):[0,0,0];
}
export function trunkTiltDeg(pose){const v=norm(sub(pose.chest,pose.pelvis));return deg(Math.acos(clamp(dot(v,[0,1,0]),-1,1)))}
export function comProjection(pose,weights){return projectXZ(centerOfMass(pose,weights))}
