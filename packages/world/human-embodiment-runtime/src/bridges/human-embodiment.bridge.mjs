import {buildPose,defaultControl} from '../skeleton.mjs';
import {evaluatePose} from '../constraints.mjs';
import {evaluateMotion} from '../validator.mjs';
import {retargetMotion} from '../retarget.mjs';
import {toRsrSpatialEmbodiment} from '../rsr-adapter.mjs';
import {toVsrDebugVisual} from '../vsr-adapter.mjs';
import {createCanonicalHumanSkeleton,createPoseState,forwardKinematics} from '../skeleton-v2.mjs';
import {solveLimbIK,solveMultiTargetIK} from '../ik.mjs';
import {retargetPoseState,retargetPoseClip} from '../retarget-v2.mjs';
import {samplePoseClip} from '../animation-v2.mjs';
import {evaluatePoseV2} from '../constraints-v2.mjs';
import {inferGltfJointMap,buildRigBinding,poseToGltfNodeTransforms,buildSkinPalette} from '../gltf-rig.mjs';
import {toRsrSpatialEmbodimentV2} from '../rsr-adapter-v2.mjs';
import {toVsrDebugVisualV2} from '../vsr-adapter-v2.mjs';
import {solveFullBodyIK} from '../fullbody-ik-v3.mjs';
import {enforceJointLimits,inspectJointLimits} from '../joint-limits-v3.mjs';
import {extractRootMotion} from '../root-motion-v3.mjs';
import {detectFootContacts,solveFootPlantFrame} from '../foot-plant-v3.mjs';
import {importMediaPipePoseSequence,parseBvh,importBvhToPoseClip} from '../mocap-import-v3.mjs';
import {calibrateMediaPipeSequence} from '../calibration-v3.mjs';
import {toVsrSkinnedMeshFrameV3} from '../vsr-skinned-mesh-v3.mjs';
import {toWorldBodyIRV3} from '../world-body-ir-v3.mjs';
import {createProfessionalHumanSkeleton,createProfessionalPoseState,forwardKinematicsProfessional,computeLandmarks} from '../anatomical-skeleton-v4.mjs';
import {centerOfMassProfessional} from '../biomechanical-segments-v4.mjs';
import {JOINT_COORDINATE_SYSTEMS,DEFAULT_PROFESSIONAL_LIMITS} from '../joint-coordinate-systems-v4.mjs';
import {pelvisFrameFromLandmarks} from '../anatomical-coordinates-v4.mjs';

export function createHumanEmbodimentBridge(){
  return async function handle(action,payload={}){
    if(action==='health') return {ok:true,runtime_id:'rncs.human-embodiment',version:'0.4.0-alpha.1',capabilities:['quaternion-local-pose','fk','analytic-two-bone-ik','multi-target-ik','fullbody-ik','swing-twist-joint-limits','root-motion','foot-plant','mediapipe-import','bvh-parse','bvh-import','motion-calibration','retarget-foot-lock','gltf-rig-binding','vsr-skinned-frame','world-body-ir','rsr-v0.6','vsr-v0.7','professional-anatomical-rig','isb-aligned-frame','anatomical-landmarks','segment-frames','professional-com']};

    // v0.1 compatibility surface
    if(action==='loadSkeleton') return {ok:true,control:defaultControl()};
    if(action==='evaluatePose') {const control=payload.control??defaultControl(),pose=buildPose(control),evaluation=evaluatePose({control,pose,final:!!payload.final,profile:payload.profile??{}});return {ok:evaluation.ok,pose,evaluation};}
    if(action==='evaluateMotion') {const result=evaluateMotion(payload.motion,{samples:payload.samples??60,profile:payload.profile??{}});return {ok:result.ok,result};}
    if(action==='retargetMotion') return {ok:true,motion:retargetMotion(payload.motion,payload.target??{})};
    if(action==='buildSpatialEmbodiment') {const control=payload.control??defaultControl(),pose=buildPose(control),evaluation=evaluatePose({control,pose,final:!!payload.final});return {ok:evaluation.ok,spatial:toRsrSpatialEmbodiment({entityId:payload.entityId??'human',pose,control,evaluation})};}
    if(action==='buildVisualPose') {const control=payload.control??defaultControl(),pose=buildPose(control),evaluation=evaluatePose({control,pose,final:!!payload.final});return {ok:evaluation.ok,visual:toVsrDebugVisual({entityId:payload.entityId??'human',pose,evaluation})};}

    // v0.2 native pose surface
    if(action==='createCanonicalSkeleton'){const skeleton=createCanonicalHumanSkeleton(payload.profile??{});return {ok:true,skeleton};}
    if(action==='forwardKinematics') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),fk=forwardKinematics(skeleton,state);return {ok:true,skeleton,state,fk};}
    if(action==='solveLimbIK') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),result=solveLimbIK(skeleton,state,payload.limb,payload.target,payload.options??{});return {ok:result.ok,result};}
    if(action==='solveMultiTargetIK') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),result=solveMultiTargetIK(skeleton,state,payload.targets??{},payload.options??{});return {ok:result.ok,result};}
    if(action==='evaluatePoseV2') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),fk=forwardKinematics(skeleton,state),evaluation=evaluatePoseV2({skeleton,state,fk,final:!!payload.final,profile:payload.validationProfile??{},contacts:payload.contacts??{left:true,right:true}});return {ok:evaluation.ok,skeleton,state,fk,evaluation};}
    if(action==='retargetPoseV2') {const sourceSkeleton=createCanonicalHumanSkeleton(payload.sourceProfile??{}),sourceState=createPoseState(sourceSkeleton,payload.state??{}),result=retargetPoseState(sourceSkeleton,sourceState,payload.targetProfile??{},payload.options??{});return {ok:result.ok,result};}
    if(action==='retargetClipV2') {const sourceSkeleton=createCanonicalHumanSkeleton(payload.sourceProfile??{}),result=retargetPoseClip(sourceSkeleton,payload.clip,payload.targetProfile??{},payload.options??{});return {ok:result.ok,result};}
    if(action==='sampleClipV2') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=samplePoseClip(skeleton,payload.clip,payload.t??0);const fk=forwardKinematics(skeleton,state);return {ok:true,state,fk};}
    if(action==='bindGltfRig') {const jointMap=payload.jointMap??inferGltfJointMap(payload.nodes??[]);const binding=buildRigBinding({nodes:payload.nodes??[],jointMap,inverseBindMatrices:payload.inverseBindMatrices??[]});return {ok:true,binding};}
    if(action==='buildGltfPosePatch') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),fk=forwardKinematics(skeleton,state),binding=buildRigBinding({nodes:payload.nodes??[],jointMap:payload.jointMap,inverseBindMatrices:payload.inverseBindMatrices??[]});return {ok:true,nodeTransforms:poseToGltfNodeTransforms(binding,state),skinPalette:buildSkinPalette(binding,fk)};}
    if(action==='buildSpatialEmbodimentV2') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),fk=forwardKinematics(skeleton,state),evaluation=evaluatePoseV2({skeleton,state,fk,final:!!payload.final,profile:payload.validationProfile??{},contacts:payload.contacts??{left:true,right:true}});return {ok:evaluation.ok,spatial:toRsrSpatialEmbodimentV2({entityId:payload.entityId??'human',skeleton,fk,evaluation,contacts:payload.contacts??{left:true,right:true}})};}
    if(action==='buildVisualPoseV2') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),fk=forwardKinematics(skeleton,state),evaluation=evaluatePoseV2({skeleton,state,fk,final:!!payload.final,profile:payload.validationProfile??{},contacts:payload.contacts??{left:true,right:true}});return {ok:evaluation.ok,visual:toVsrDebugVisualV2({entityId:payload.entityId??'human',skeleton,fk,evaluation})};}

    // v0.3 whole-body / contact / mocap surface
    if(action==='solveFullBodyIKV3') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),result=solveFullBodyIK(skeleton,state,payload.targets??{},payload.options??{});return {ok:result.ok,result};}
    if(action==='enforceJointLimitsV3') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),result=enforceJointLimits(skeleton,state,payload.options??{});return {ok:true,result};}
    if(action==='inspectJointLimitsV3') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),result=inspectJointLimits(skeleton,state,payload.options??{});return {ok:result.ok,result};}
    if(action==='extractRootMotionV3') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),result=extractRootMotion(skeleton,payload.clip,payload.options??{});return {ok:true,result};}
    if(action==='detectFootContactsV3') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),result=detectFootContacts(skeleton,payload.frames??[],payload.options??{});return {ok:true,result:result.map(x=>({t:x.t,contacts:x.contacts}))};}
    if(action==='solveFootPlantV3') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),result=solveFootPlantFrame(skeleton,state,payload.plant??{},payload.options??{});return {ok:result.ok,result};}
    if(action==='importMediaPipeV3') {const result=importMediaPipePoseSequence(payload.frames??[],{profile:payload.profile??{},fps:payload.fps??30,...(payload.options??{})});return {ok:true,result};}
    if(action==='parseBvhV3') {const result=parseBvh(payload.text??'');return {ok:true,result};}
    if(action==='importBvhV3') {const result=importBvhToPoseClip(payload.text??'',{profile:payload.profile??{},...(payload.options??{})});return {ok:true,result};}
    if(action==='calibrateMediaPipeV3') {const result=calibrateMediaPipeSequence(payload.frames??[],{profile:payload.profile??{},fps:payload.fps??30,...(payload.options??{})});return {ok:true,result};}
    if(action==='buildVsrSkinnedFrameV3') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),fk=forwardKinematics(skeleton,state),binding=buildRigBinding({nodes:payload.nodes??[],jointMap:payload.jointMap,inverseBindMatrices:payload.inverseBindMatrices??[]});const frame=toVsrSkinnedMeshFrameV3({entityId:payload.entityId??'human',binding,state,fk,meshId:payload.meshId??'mesh',materialId:payload.materialId??null});return {ok:true,frame};}
    if(action==='buildWorldBodyIRV3') {const skeleton=createCanonicalHumanSkeleton(payload.profile??{}),state=createPoseState(skeleton,payload.state??{}),fk=forwardKinematics(skeleton,state),evaluation=evaluatePoseV2({skeleton,state,fk,final:!!payload.final,profile:payload.validationProfile??{},contacts:payload.contacts??{left:true,right:true}});const body=toWorldBodyIRV3({entityId:payload.entityId??'human',skeleton,state,fk,evaluation});return {ok:evaluation.ok,body};}

    // v0.4 professional anatomical / biomechanics surface
    if(action==='createProfessionalSkeletonV4'){const skeleton=createProfessionalHumanSkeleton(payload.profile??{});return {ok:true,skeleton};}
    if(action==='analyzeProfessionalPoseV4'){
      const skeleton=createProfessionalHumanSkeleton(payload.profile??{}),state=createProfessionalPoseState(skeleton,payload.state??{}),fk=forwardKinematicsProfessional(skeleton,state),landmarks=computeLandmarks(skeleton,fk),com=centerOfMassProfessional(skeleton,fk),pelvisFrame=pelvisFrameFromLandmarks(landmarks);
      return {ok:true,skeleton,state,fk,landmarks,com,pelvisFrame,jointCoordinateSystems:JOINT_COORDINATE_SYSTEMS,limits:DEFAULT_PROFESSIONAL_LIMITS};
    }

    throw new Error(`unsupported action: ${action}`);
  }
}
export default createHumanEmbodimentBridge;
