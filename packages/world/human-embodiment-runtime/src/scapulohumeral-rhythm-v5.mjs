import {qFromAxisAngle,qMul,qIdentity} from './quaternion.mjs';

export const DEFAULT_SCAPULOHUMERAL_MODEL={
  onsetDeg:25,
  scapulaFractionAfterOnset:1/3,
  clavicleFractionOfScapula:0.35,
  maxScapulaUpwardRotationDeg:60,
  maxClavicleElevationDeg:25,
  posteriorTiltGain:0.18
};

export function distributeHumeralElevation(totalElevationDeg,model={}){
  const m={...DEFAUL_SCAPULOHUMERAL_MODEL,...model},e=Math.max(0,totalElevationDeg);
  const active=Math.max(0,e-m.onsetDeg),scap=Math.min(m.maxScapulaUpwardRotationDeg,active*m.scapulaFractionAfterOnset);
  const clav=Math.min(m.maxClavicleElevationDeg,scap*m.clavicleFractionOfScapula),gh=Math.max(0,e-scap-clav*0.15);
  return {totalElevationDeg:e,glenohumeralDeg:gh,scapularUpwardRotationDeg:scap,clavicularElevationDeg:clav,scapularPosteriorTiltDeg:scap*m.posteriorTiltGain,model:m};
}

export function applyScapulohumeralRhythm(skeleton,inputState,side,totalElevationDeg,{planeDeg=0,axialRotationDeg=0,model={}}={}){
  const state=structuredClone(inputState),r=distributeHumeralElevation(totalElevationDeg,model),sgn=side==='L'?-1:1;
  // Anatomical frame: +X anterior, +Y superior, +Z subject-right.
  state.localRotations[`SC_${side}`]=qFromAxisAngle([1,0,0],sgn*r.clavicularElevationDeg*Math.PI/180);
  state.localRotations[`AC_${side}`]=qMul(qFromAxisAngle([1,0,0],sgn*r.scapularUpwardRotationDeg*Math.PI/180),qFromAxisAngle([0,0,1],r.scapularPosteriorTiltDeg*Math.PI/180));
  const plane=qFromAxisAngle([0,1,0],planeDeg*Math.PI/180),elev=qFromAxisAngle([0,0,sgn],r.glenohumeralDeg*Math.PI/180),axial=qFromAxisAngle([0,1,0],axialRotationDeg*Math.PI/180);
  state.localRotations[`GH_${side}`]=qMul(qMul(plane,elev),axial);
  return {state,rhytm:r};
}
