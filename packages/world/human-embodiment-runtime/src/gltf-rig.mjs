import {m4Mul} from './matrix4.mjs';

const ALIASES={
 pelvis:['pelvis','hips','hip','mixamorig:hips'],spine:['spine','spine1','mixamorig:spine'],chest:['chest','spine2','upperchest','mixamorig:spine2'],neck:['neck','mixamorig:neck'],head:['head','mixamorig:head'],
 shoulderL:['leftshoulder','shoulderl','mixamorig:leftshoulder'],elbowL:['leftforearm','elbow_l','leftelbow','mixamorig:leftforearm'],wristL:['lefthand','wrist_l','leftwrist','mixamorig:lefthand'],
 shoulderR:['rightshoulder','shoulderr','mixamorig:rightshoulder'],elbowR:['rightforearm','elbow_r','rightelbow','mixamorig:rightforearm'],wristR:['righthand','wrist_r','rightwrist','mixamorig:righthand'],
 hipL:['leftupleg','hip_l','mixamorig:leftupleg'],kneeL:['leftleg','knee_l','mixamorig:leftleg'],ankleL:['leftfoot','ankle_l','mixamorig:leftfoot'],footL:['lefttoebase','lefttoe','mixamorig:lefttoebase'],
 hipR:['rightupleg','hip_r','mixamorig:rightupleg'],kneeR:['rightleg','knee_r','mixamorig:rightleg'],ankleR:['rightfoot','ankle_r','mixamorig:rightfoot'],footR:['righttoebase','righttoe','mixamorig:righttoebase']
};
function canon(s){return String(s??'').toLowerCase().replace(/[^a-z0-9:]/g,'')}
export function inferGltfJointMap(nodes){const map={},used=new Set();for(const [rncs,aliases] of Object.entries(ALIASES)){const aset=aliases.map(canon);let best=-1,bestScore=-1;for(let i=0;i<nodes.length;i++){if(used.has(i))continue;const n=canon(nodes[i].name);let score=0;if(aset.includes(n))score=3;else if(aset.some(a=>n.endsWith(a)||n.includes(a)))score=2;else if(n.includes(canon(rncs)))score=1;if(score>bestScore){bestScore=score;best=i}}if(best>=0&&bestScore>0){map[rncs]=best;used.add(best)}}return map}
export function buildRigBinding({nodes,jointMap=inferGltfJointMap(nodes),inverseBindMatrices=[]}={}){return {format:'rncs.gltf-rig-binding.v0.2',jointMap,nodes,inverseBindMatrices}}
export function poseToGltfNodeTransforms(binding,state){const out={};for(const [rncs,nodeIndex] of Object.entries(binding.jointMap)){out[nodeIndex]={rotation:state.localRotations[rncs],translation:state.localTranslations?.[rncs]??[0,0,0]}}if(binding.jointMap.pelvis!==undefined)out[binding.jointMap.pelvis].translation=state.rootPosition;return out}
export function buildSkinPalette(binding,fk){const palette={};for(const [rncs,nodeIndex] of Object.entries(binding.jointMap)){const wm=fk.matrices[rncs];if(!wm)continue;const ibm=binding.inverseBindMatrices?.[nodeIndex];palette[nodeIndex]=ibm?m4Mul(wm,ibm):wm}return palette}
