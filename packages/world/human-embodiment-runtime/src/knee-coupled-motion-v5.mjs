import {qFromAxisAngle,qMul} from './quaternion.mjs';

export const DEFAULT_KNEE_COUPLING={enabled:true,screwHomeWindowDeg:20,maxAxialRotationDeg:10,translationPerDegMm:0.08};
export function kneeCouplingFromFlexion(flexionDeg,side='R',model={}){
  const m={...DEFAULT_KNEE_COUPLING,...model};if(!m.enabled)return {flexionDeg,axialRotationDeg:0,anteriorTranslationMm:0,model:m};
  const f=Math.max(0,Math.min(145,flexionDeg)),window=Math.max(0,Math.min(1,(m.screwHomeWindowDeg-f)/m.screwHomeWindowDeg));
  const externalAtExtension=m.maxAxialRotationDeg*window*(side==='R'?1:-1),translation=(m.screwHomeWindowDeg-Math.min(f,m.screwHomeWindowDeg))*m.translationPerDegMm;
  return {flexionDeg:f,axialRotationDeg:externalAtExtension,anteriorTranslationMm:translation,model:m};
}
export function applyKneeCoupling(state,side,flexionDeg,{model={}}={}){
  const out=structuredClone(state),c=kneeCouplingFromFlexion(flexionDeg,side,model),sgn=side==='R'?1:-1;
  const flex=qFromAxisAngle([0,0,1],-flexionDeg*Math.PI/180),axial=qFromAxisAngle([0,1,0],c.axialRotationDeg*Math.PI/180);out.localRotations[`knee_${side}`]=qMul(flex,axial);
  out.localTranslations[`knee_${side}`]=[(c.anteriorTranslationMm/1000),0,0];
  return {state:out,coupling:c};
}
