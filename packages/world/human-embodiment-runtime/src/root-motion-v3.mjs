import {sub,add,lerp3,clamp} from './math.mjs';
import {qIdentity,qConjugate,qMul,qSlerp} from './quaternion.mjs';
import {createPoseState} from './skeleton-v2.mjs';

export function extractRootMotion(skeleton,clip,{removeVertical=false}={}){
  const frames=[...clip.keyframes].sort((a,b)=>a.t-b.t); if(!frames.length)throw new Error('clip.keyframes required');
  const p0=frames[0].pose.rootPosition??[0,skeleton.profile.pelvisHeight,0], r0=frames[0].pose.rootRotation??qIdentity();
  const inv0=qConjugate(r0), trajectory=[], keyframes=[];
  for(const k of frames){
    const p=k.pose.rootPosition??p0, delta=sub(p,p0); if(removeVertical)delta[1]=0;
    const rotDelta=qMul(inv0,k.pose.rootRotation??r0); trajectory.push({t:k.t,position:delta,rotation:rotDelta});
    const inPlace=[p0[0],removeVertical?p[1]:p0[1],p0[2]];
    keyframes.push({t:k.t,pose:{...structuredClone(k.pose),rootPosition:inPlace,rootRotation:r0}});
  }
  return {clip:{...clip,keyframes,id:`${clip.id??'clip'}:in-place`},trajectory,origin:{position:p0,rotation:r0}};
}

export function sampleRootMotion(track,t){
  const frames=track.trajectory??track; if(!frames.length)return {position:[0,0,0],rotation:qIdentity()};
  if(t<=frames[0].t)return structuredClone(frames[0]); if(t>=frames.at(-1).t)return structuredClone(frames.at(-1));
  let a=frames[0],b=frames.at(-1);for(let i=0;i<frames.length-1;i++){if(t>=frames[i].t&&t<=frames[i+1].t){a=frames[i];b=frames[i+1];break}}
  const u=clamp((t-a.t)/(b.t-a.t),0,1); return {t,position:lerp3(a.position,b.position,u),rotation:qSlerp(a.rotation,b.rotation,u)};
}

export function applyRootMotionToPose(skeleton,pose,motion,{origin=[0,0,0]}={}){
  return createPoseState(skeleton,{...pose,rootPosition:add(origin,motion.position),rootRotation:qMul(pose.rootRotation??qIdentity(),motion.rotation)});
}
