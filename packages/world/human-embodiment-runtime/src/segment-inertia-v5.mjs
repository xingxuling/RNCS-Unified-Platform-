import {segmentCenter} from './biomechanical-segments-v4.mjs';
import {len,sub} from './math.mjs';

export const DEFAULT_SEGMENT_MASS_FRACTIONS={pelvis:0.142,lumbar:0.080,thorax:0.165,headNeck:0.081,clavicle_L:0.002,clavicle_R:0.002,upperArm_L:0.028,upperArm_R:0.028,forearm_L:0.016,forearm_R:0.016,hand_L:0.006,hand_R:0.006,thigh_L:0.100,thigh_R:0.100,shank_L:0.0465,shank_R:0.0465,foot_L:0.0145,foot_R:0.0145};
const RADII={pelvis:[0.20,0.16,0.22],lumbar:[0.12,0.26,0.12],thorax:[0.18,0.28,0.20],headNeck:[0.14,0.18,0.14],upperArm:[0.07,0.28,0.07],forearm:[0.055,0.28,0.055],hand:[0.08,0.24,0.035],thigh:[0.10,0.30,0.10],shank:[0.075,0.30,0.075],foot:[0.12,0.05,0.30],clavicle:[0.04,0.24,0.04]};
function kind(name){return name.replace(/_[LR]$/,'')}
export function segmentInertiaTensors(skeleton,fk,{bodyMassKg=70,massFractions=DEFAULT_SEGMENT_MASS_FRACTIONS}={}){
  const out={};for(const seg of skeleton.segments){const a=fk.world[seg.proximal]?.position,b=fk.world[seg.distal]?.position;if(!a||!b)continue;const L=len(sub(b,a)),m=bodyMassKg*(massFractions[seg.name]??0),r=RADII[kind(seg.name)]??[0.08,0.25,0.08];const dims=[Math.max(0.02,L*r[0]),Math.max(0.02,L*r[1]),Math.max(0.02,L*r[2])];const [x,y,z]=dims;out[seg.name]={massKg:m,lengthM:L,center:segmentCenter(fk,seg,0.5),principalMomentsKgM2:[m*(y*y+z*z)/12,m*(x*x+z*z)/12,m*(x*x+y*y)/12],approximation:'axis-aligned-box-scaled-by-segment-length'};}return out;
}
