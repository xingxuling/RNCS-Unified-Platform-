import {createHumanRuntimeV5} from '../human-runtime-v5.mjs';

export function createHumanEmbodimentV5Bridge({profile={}}={}){
  const runtime=createHumanRuntimeV5(profile);
  return async function invoke(action,payload={}){
    if(action==='health') return {ok:true,runtime_id:'rncs.human-embodiment',version:'0.5.0-alpha.1',protocol:runtime.protocol,capabilities:['professional-fullbody-ik','scapulohumeral-rhythm','knee-coupled-motion','foot-cop-pressure','segment-inertia','anthropometry-calibration','marker-calibration','opensim-trc-bridge-candidate']};
    if(action==='solveProfessionalFullBodyIKV5'){const state=runtime.createPose(payload.state??{}),result=runtime.solveFullBody(state,payload.targets??{},payload.options??{});return {ok:result.ok,result};}
    if(action==='applyScapulohumeralRhythmV5'){const state=runtime.createPose(payload.state??{});return {ok:true,result:runtime.applyShoulderRhythm(state,payload.side??'R',payload.elevationDeg??0,payload.options??{})};}
    if(action==='applyKneeCouplingV5'){const state=runtime.createPose(payload.state??{});return {ok:true,result:runtime.applyKneeCoupling(state,payload.side??'R',payload.flexionDeg??0,payload.options??{})};}
    if(action==='analyzeFootPressureV5'){const state=runtime.createPose(payload.state??{});return {ok:true,result:runtime.analyze(state,payload.options??{})};}
    if(action==='calibrateAnthropometryV5') return {ok:true,result:runtime.calibrateAnthropometry(payload.markers??{},payload.options??{})};
    if(action==='parseTRCV5') return {ok:true,result:runtime.io.parseTRC(payload.text??'')};
    if(action==='buildOpenSimMarkerSetV5') return {ok:true,result:runtime.io.toOpenSimMarkerSet()};
    throw new Error(`HER_V5_ACTION_UNSUPPORTED:${action}`);
  };
}
export default createHumanEmbodimentV5Bridge;
