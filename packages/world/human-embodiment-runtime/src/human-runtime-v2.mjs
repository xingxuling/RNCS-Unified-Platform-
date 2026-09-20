import {createCanonicalHumanSkeleton,createPoseState,forwardKinematics} from './skeleton-v2.mjs';
import {solveLimbIK,solveMultiTargetIK} from './ik.mjs';
import {retargetPoseState,retargetPoseClip} from './retarget-v2.mjs';
import {samplePoseClip,resamplePoseClip} from './animation-v2.mjs';
import {buildRigBinding,inferGltfJointMap,poseToGltfNodeTransforms,buildSkinPalette} from './gltf-rig.mjs';

export function createHumanRuntime({profile={}}={}){
  const skeleton=createCanonicalHumanSkeleton(profile);
  return {
    protocol:'rncs.human-embodiment.v0.2',skeleton,
    createPose:opts=>createPoseState(skeleton,opts),
    fk:state=>forwardKinematics(skeleton,state),
    solveLimb:(state,limb,target,opts)=>solveLimbIK(skeleton,state,limb,target,opts),
    solveTargets:(state,targets,opts)=>solveMultiTargetIK(skeleton,state,targets,opts),
    sampleClip:(clip,t)=>samplePoseClip(skeleton,clip,t),
    resampleClip:(clip,opts)=>resamplePoseClip(skeleton,clip,opts),
    retargetPose:(state,targetProfile,opts)=>retargetPoseState(skeleton,state,targetProfile,opts),
    retargetClip:(clip,targetProfile,opts)=>retargetPoseClip(skeleton,clip,targetProfile,opts),
    gltf:{inferJointMap:inferGltfJointMap,buildBinding:buildRigBinding,poseToNodeTransforms:poseToGltfNodeTransforms,buildSkinPalette}
  };
}
