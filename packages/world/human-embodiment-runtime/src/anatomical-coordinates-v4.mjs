import {norm,sub} from './math.mjs';

// Anatomical/ISB-like frame: [anterior, superior, right]
// RNCS/VSR render frame used by earlier prototypes: [right, superior, anterior]
export const anatomicalToRender=([x,y,z])=>[z,y,x];
export const renderToAnatomical=([x,y,z])=>[z,y,x];

export function makeSegmentFrame(origin,anterior,superior,right){
  return {origin:[...origin],axes:{x:norm(anterior),y:norm(superior),z:norm(right)},convention:'ISB-aligned'};
}

export function pelvisFrameFromLandmarks(lm){
  const midA=lm.ASIS_L.map((v,i)=>(v+lm.ASIS_R[i])/2),midP=lm.PSIS_L.map((v,i)=>(v+lm.PSIS_R[i])/2);
  const right=norm(sub(lm.ASIS_R,lm.ASIS_L)),anterior=norm(sub(midA,midP));
  const superior=norm([right[1]*anterior[2]-right[2]*anterior[1],right[2]*anterior[0]-right[0]*anterior[2],right[0]*anterior[1]-right[1]*anterior[0]]);
  return makeSegmentFrame(midA,anterior,superior,right);
}
