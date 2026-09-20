import {lerp,lerp3,smoothstep} from './math.mjs';

function interp(a,b,t){const s=smoothstep(t);return {
  pelvis:lerp3(a.pelvis,b.pelvis,s),leftFoot:lerp3(a.leftFoot,b.leftFoot,s),rightFoot:lerp3(a.rightFoot,b.rightFoot,s),
  leftFootYaw:lerp(a.leftFootYaw||0,b.leftFootYaw||0,s),rightFootYaw:lerp(a.rightFootYaw||0,b.rightFootYaw||0,s),
  torsoYaw:lerp(a.torsoYaw,b.torsoYaw,s),torsoPitch:lerp(a.torsoPitch,b.torsoPitch,s),leftHand:lerp3(a.leftHand,b.leftHand,s),rightHand:lerp3(a.rightHand,b.rightHand,s),
  headYaw:lerp(a.headYaw||0,b.headYaw||0,s),contacts:s<0.5?(a.contacts||[true,true]):(b.contacts||[true,true])
}}
export function sampleMotion(motion,t){
  const f=motion.keyframes;if(!f?.length)throw new Error('motion.keyframes required'); if(t<=f[0].t)return structuredClone(f[0].control);if(t>=f.at(-1).t)return structuredClone(f.at(-1).control);
  for(let i=0;i<f.length-1;i++){if(t>=f[i].t&&t<=f[i+1].t)return interp(f[i].control,f[i+1].control,(t-f[i].t)/(f[i+1].t-f[i].t)}return structuredClone(f.at(-1).control)
}
export function normalizeMotion(motion){return {...motion,keyframes:[...motion.keyframes].sort((a,b)=>a.t-b.t)}}
