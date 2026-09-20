import {qSlerp,qIdentity} from './quaternion.mjs';
import {lerp3,lerp,clamp} from './math.mjs';
import {createPoseState} from './skeleton-v2.mjs';

export function samplePoseClip(skeleton,clip,t){
  const frames=[...clip.keyframes].sort((a,b)=>a.t-b.t);if(!frames.length)throw new Error('clip.keyframes required');
  if(t<=frames[0].t)return createPoseState(skeleton,frames[0].pose);
  if(t>=frames.at(-1).t)return createPoseState(skeleton,frames.at(-1).pose);
  let a,b;for(let i=0;i<frames.length-1;i++)if(t>=frames[i].t&&t<=frames[i+1].t){a=frames[i];b=frames[i+1];break}
  const u=clamp((t-a.t)/(b.t-a.t),0,1),names=skeleton.joints.map(j=>j.name),localRotations={};
  for(const n of names)localRotations[n]=qSlerp(a.pose.localRotations?.[n]??qIdentity(),b.pose.localRotations?.[n]??qIdentity(),u);
  return createPoseState(skeleton,{rootPosition:lerp3(a.pose.rootPosition,b.pose.rootPosition,u),rootRotation:qSlerp(a.pose.rootRotation??qIdentity(),b.pose.rootRotation??qIdentity(),u),localRotations});
}

export function resamplePoseClip(skeleton,clip,{fps=60,duration=clip.duration??1}={}){const out=[];const n=Math.max(1,Math.round(duration*fps));for(let i=0;i<=n;i++){const t=(i/n)*duration;out.push({t,pose:samplePoseClip(skeleton,clip,t)})}return {id:clip.id,duration,fps,frames:out}}
