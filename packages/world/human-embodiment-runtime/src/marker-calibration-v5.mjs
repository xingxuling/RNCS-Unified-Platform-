import {sub,add} from './math.mjs';
import {qRotateVec,qConjugate} from './quaternion.mjs';

export function calibrateMarkerOffsets(skeleton,fk,observedMarkers){const offsets={},residuals={};for(const [name,obs] of Object.entries(observedMarkers)){const def=skeleton.landmarks?.[name];if(!def)continue;const parent=fk.world[def.parent];if(!parent)continue;const worldDelta=sub(obs,parent.position),local=qRotateVec(qConjugate(parent.rotation),worldDelta);offsets[name]=local;const pred=add(parent.position,qRotateVec(parent.rotation,local));residuals[name]=Math.hypot(pred[0]-obs[0],pred[1]-obs[1],pred[2]-obs[2]);}return {offsets,residuals,rms:Math.sqrt(Object.values(residuals).reduce((s,x)=>s+x*x,0)/Math.max(1,Object.keys(residuals).length))};}
export function applyMarkerCalibration(skeleton,calibration){const out=structuredClone(skeleton);for(const [name,offset] of Object.entries(calibration.offsets??{}))if(out.landmarks?.[name])out.landmarks[name].offset=[...offset];return out;}
