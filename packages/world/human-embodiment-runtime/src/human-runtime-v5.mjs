import {createProfessionalHumanSkeleton,createProfessionalPoseState,forwardKinematicsProfessional,computeLandmarks} from './anatomical-skeleton-v4.mjs';
import {solveProfessionalFullBodyIK,solveProfessionalChainCCD,PROFESSIONAL_CHAINS} from './professional-kinematics-v5.mjs';
import {applyScapulohumeralRhythm,distributeHumeralElevation} from './scapulohumeral-rhythm-v5.mjs';
import {applyKneeCoupling,kneeCouplingFromFlexion} from './knee-coupled-motion-v5.mjs';
import {centerOfMassProfessional} from './biomechanical-segments-v4.mjs';
import {estimateFootPressure,estimateGlobalCOP} from './foot-pressure-v5.mjs';
import {segmentInertiaTensors} from './segment-inertia-v5.mjs';
import {calibrateAnthropometryFromLandmarks} from './anthropometry-calibration-v5.mjs';
import {calibrateMarkerOffsets,applyMarkerCalibration} from './marker-calibration-v5.mjs';
import {parseTRC,writeTRC,toOpenSimMarkerSet,fromC3DDecoded} from './opensim-trc-bridge-v5.mjs';

export function createHumanRuntimeV5(profile={}){
  let skeleton=createProfessionalHumanSkeleton(profile);
  return {
    protocol:'rncs.human-embodiment.v0.5',
    get skeleton(){return skeleton},
    createPose:(o={})=>createProfessionalPoseState(skeleton,o),
    fk:s=>forwardKinematicsProfessional(skeleton,s),
    solveFullBody:(s,t,o={})=>solveProfessionalFullBodyIK(skeleton,s,t,o),
    solveChain:(s,c,t,o={})=>solveProfessionalChainCCD(skeleton,s,Array.isArray(c)?c:PROFESSIONAL_CHAINS[c],t,o),
    applyShoulderRhythm:(s,side,e,o={})=>applyScapulohumeralRhythm(skeleton,s,side,e,o),
    shoulderRhythm:distributeHumeralElevation,
    applyKneeCoupling:(s,side,f,o={})=>applyKneeCoupling(s,side,f,o),
    kneeCoupling:kneeCouplingFromFlexion,
    analyze:(s,{bodyMassKg=70,totalLoadN=bodyMassKg*9.80665,leftLoadFraction=0.5}={})=>{
      const fk=forwardKinematicsProfessional(skeleton,s),landmarks=computeLandmarks(skeleton,fk),com=centerOfMassProfessional(skeleton,fk),pressure=estimateFootPressure({landmarks,com,totalLoadN,leftLoadFraction});
      return {fk,landmarks,com,pressure,globalCOP:estimateGlobalCOP(pressure),inertia:segmentInertiaTensors(skeleton,fk,{bodyMassKg})};
    },
    calibrateAnthropometry:(markers,o={})=>calibrateAnthropometryFromLandmarks(markers,o),
    calibrateMarkers:(state,observed)=>{const fk=forwardKinematicsProfessional(skeleton,state),c=calibrateMarkerOffsets(skeleton,fk,observed);skeleton=applyMarkerCalibration(skeleton,c);return c;},
    io:{parseTRC,writeTRC,toOpenSimMarkerSet:()=>toOpenSimMarkerSet(skeleton),fromC3DDecoded}
  };
}
