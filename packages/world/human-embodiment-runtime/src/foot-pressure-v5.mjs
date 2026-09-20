import {convexHull,pointInPolygon,polygonMargin} from './geometry.mjs';
import {projectXZ,distance2} from './math.mjs';

export function footContactPatch(landmarks,side){
  const names=[`heel${side}`,`MTP1${side}`,`MTP5${side}`],pts=names.map(n=>landmarks[n]).filter(Boolean).map(projectXZ);
  if(landmarks[`MTP1${side}`]){const p=projectXZ(landmarks[`MTP1${side}`]);pts.push([p[0]+0.04,p[1]]);}
  return convexHull(pts);
}

function barycentricWeights(point,points){
  const eps=1e-6,inv=points.map(p=>1/(distance2(point,p)+eps)),sum=inv.reduce((a,b)=>a+b,0);return inv.map(v=>v/sum);
}

export function estimateFootPressure({landmarks,com,totalLoadN=700,leftLoadFraction=0.5}={}){
  const out={};const pcom=projectXZ(com);for(const [side,frac] of [['L',leftLoadFraction],['R',1-leftLoadFraction]]){
    const patch=footContactPatch(landmarks,side),anchors=[landmarks[`heel${side}`],landmarks[`MTP1${side}`],landmarks[`MTP5${side}`]].filter(Boolean).map(projectXZ),loadN=totalLoadN*frac;
    if(!anchors.length){out[side]={loadN:0,cop:null,pressures:[],patch:[]};continue}
    const weights=barycentricWeights(pcom,anchors),pressures=anchors.map((p,i)=>({point:p,loadN:loadN*weights[i],fraction:weights[i]}));
    const cop=[pressures.reduce((s,x)=>s+x.point[0]*x.fraction,0),pressures.reduce((s,x)=>s+x.point[1]*x.fraction,0)];
    out[side]={loadN,cop,pressures,patch,inside:pointInPolygon(cop,patch),margin:polygonMargin(cop,patch)};
  }return {comProjection:pcom,feet:out,totalLoadN};
}

export function estimateGlobalCOP(pressure){const items=Object.values(pressure.feet).filter(x=>x.cop&&x.loadN>0),sum=items.reduce((s,x)=>s+x.loadN,0);if(!sum)return null;return [items.reduce((s,x)=>s+x.cop[0]*x.loadN,0)/sum,items.reduce((s,x)=>s+x.cop[1]*x.loadN,0)/sum];}
