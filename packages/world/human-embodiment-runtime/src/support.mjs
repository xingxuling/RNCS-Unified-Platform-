import {rad,projectXZ} from './math.mjs';
import {convexHull,pointInPolygon,polygonMargin} from './geometry.mjs';
import {CANONICAL_DIMENSIONS} from './skeleton.mjs';

function footCorners(center,yawDeg,length,width){
  const a=rad(yawDeg||0),c=Math.cos(a),s=Math.sin(a),hx=width/2,hz=length/2;
  return [[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]].map(([x,z])=>[center[0]+x*c+z*s,center[2]-x*s+z*c]);
}
export function supportPolygon(control,d=CANONICAL_DIMENSIONS){
  const pts=[];
  if(control.contacts?.[0]!==false) pts.push(...footCorners(control.leftFoot,control.leftFootYaw,d.footLength,d.footWidth));
  if(control.contacts?.[1]!==false) pts.push(...footCorners(control.rightFoot,control.rightFootYaw,d.footLength,d.footWidth));
  return convexHull(pts);
}
export function evaluateSupport(control,com3,d=CANONICAL_DIMENSIONS){
  const poly=supportPolygon(control,d),p=projectXZ(com3); const margin=polygonMargin(p,poly); return {polygon:poly,projection:p,inside:pointInPolygon(p,poly),margin};
}
