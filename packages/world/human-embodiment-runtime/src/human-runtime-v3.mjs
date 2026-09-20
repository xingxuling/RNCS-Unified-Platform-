import {createCanonicalHumanSkeleton,createPoseState,forwardKinematics} from './skeleton-v2.mjs';
import {solveFullBodyIK,solveGroundedFullBodyPose} from './fullbody-ik-v3.mjs';
import {enforceJointLimits,inspectJointLimits} from './joint-limits-v3.mjs';
import {extractRootMotion,sampleRootMotion,applyRootMotionToPose} from './root-motion-v3.mjs';
import {detectFootContacts,buildFootPlantTrack,solveFootPlantFrame,stabilizeFootPlants} from './foot-plant-v3.mjs';
import {importMediaPipePoseSequence,mediaPipeFrameToWorld,parseBvh,importBvhToPoseClip} from './mocap-import-v3.mjs';
import {calibrateMediaPipeSequence,comparePoseStates,comparePoseClips} from './calibration-v3.mjs';
import {toVsrSkinnedMeshFrameV3,buildVsrSkinStreamV3} from './vsr-skinned-mesh-v3.mjs';
import {toWorldBodyIRV3} from './world-body-ir-v3.mjs';
import {buildRigBinding,inferGltfJointMap,buildSkinPalette,poseToGltfNodeTransforms} from './gltf-rig.mjs';

export function createHumanRuntimeV3({profile={}}={}){
  const skeleton=createCanonicalHumanSkeleton(profile);
  return {protocol:'rncs.human-embodiment.v0.3',skeleton,
    createPose:opts=>createPoseState(skeleton,opts),fk:state=>forwardKinematics(skeleton,state),
    solveFullBody:(state,targets,opts)=>solveFullBodyIK(skeleton,state,targets,opts),solveGrounded:(state,targets,opts)=>solveGroundedFullBodyPose(skeleton,state,targets,opts),
    jointLimits:{enforce:(state,opts)=>enforceJointLimits(skeleton,state,opts),inspect:(state,opts)=>inspectJointLimits(skeleton,state,opts)},
    rootMotion:{extract:(clip,opts)=>extractRootMotion(skeleton,clip,opts),sample:sampleRootMotion,apply:(pose,motion,opts)=>applyRootMotionToPose(skeleton,pose,motion,opts)},
    footPlant:{detect:(frames,opts)=>detectFootContacts(skeleton,frames,opts),track:(frames,opts)=>buildFootPlantTrack(skeleton,frames,opts),solve:(state,plant,opts)=>solveFootPlantFrame(skeleton,state,plant,opts),stabilize:(clip,opts)=>stabilizeFootPlants(skeleton,clip,opts)},
    mocap:{mediaPipeFrame:(f,opts)=>mediaPipeFrameToWorld(f,{targetHeight:skeleton.profile.height,...opts}),mediaPipeSequence:(f,opts)=>importMediaPipePoseSequence(f,{profile:skeleton.profile,...opts}),parseBvh,bvh:(text,opts)=>importBvhToPoseClip(text,{profile:skeleton.profile,...opts})},
    calibration:{mediaPipe:(f,opts)=>calibrateMediaPipeSequence(f,{profile:skeleton.profile,...opts}),comparePose:(a,b)=>comparePoseStates(skeleton,a,b),compareClips:(a,b,opts)=>comparePoseClips(skeleton,a,b,opts)},
    gltf:{inferJointMap:inferGltfJointMap,buildBinding:buildRigBinding,buildSkinPalette,poseToNodeTransforms:poseToGltfNodeTransforms,toVsrSkinnedFrame:args=>toVsrSkinnedMeshFrameV3(args),buildVsrSkinStream:buildVsrSkinStreamV3},
    worldBodyIR:(state,fk,evaluation,entityId='human')=>toWorldBodyIRV3({entityId,skeleton,state,fk,evaluation})
  };
}
