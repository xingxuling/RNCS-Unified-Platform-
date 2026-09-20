import {add,mul} from './math.mjs';

// Generic adult simulation defaults. Values are intentionally configurable and are NOT clinical measurements.
// Mass fractions roughly follow conventional segmental biomechanics practice, then normalized at runtime.
export const SEGMENT_MASS_FRACTIONS={
  pelvis:0.142,lumbar:0.080,thorax:0.165,headNeck:0.081,
  upperArm_L:0.028,upperArm_R:0.028,forearm_L:0.016,forearm_R:0.016,hand_L:0.006,hand_R:0.006,
  thigh_L:0.100,thigh_R:0.100,shank_L:0.0465,shank_R:0.0465,foot_L:0.0145,foot_R:0.0145,
  clavicle_L:0.002,clavicle_R:0.002
};

export function segmentCenter(fk,segment,ratio=0.5){const a=fk.world[segment.proximal]?.position,b=fk.world[segment.distal]?.position;if(!a||!b)return null;return add(a,mul(b.map((v,i)=>v-a[i]),ratio))}
export function centerOfMassProfessional(skeleton,fk,masses=SEGMENT_MASS_FRACTIONS){
  let sum=[0,0,0],total=0;
  for(const seg of skeleton.segments){const w=masses[seg.name]??0,c=segmentCenter(fk,seg,0.5);if(!c||w<=0)continue;sum=add(sum,mul(c,w));total+=w}
  return total?sum.map(v=>v/total):[0,0,0];
}
