import {createProfessionalHumanSkeleton,createProfessionalPoseState,forwardKinematicsProfessional,computeLandmarks} from './anatomical-skeleton-v4.mjs';
import {centerOfMassProfessional} from './biomechanical-segments-v4.mjs';
import {JOINT_COORDINATE_SYSTEMS,DEFAULT_PROFESSIONAL_LIMITS} from './joint-coordinate-systems-v4.mjs';
import {pelvisFrameFromLandmarks} from './anatomical-coordinates-v4.mjs';

export function createHumanRuntimeV4(profile={}){
  const skeleton=createProfessionalHumanSkeleton(profile);
  return {
    protocol:'rncs.human-embodiment.v0.4',skeleton,
    createPose:(opts={})=>createProfessionalPoseState(skeleton,opts),
    fk:(state)=>forwardKinematicsProfessional(skeleton,state),
    analyze:(state)=>{
      const fk=forwardKinematicsProfessional(skeleton,state),landmarks=computeLandmarks(skeleton,fk),com=centerOfMassProfessional(skeleton,fk);
      return {fk,landmarks,com,pelvisFrame:pelvisFrameFromLandmarks(landmarks),jointCoordinateSystems:JOINT_COORDINATE_SYSTEMS,limits:DEFAULT_PROFESSIONAL_LIMITS};
    }
  };
}
