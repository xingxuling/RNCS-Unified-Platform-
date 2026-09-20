import {BONE_EDGES} from './skeleton.mjs';
export function toVsrDebugVisual({entityId='human',pose,evaluation}){
  return {
    protocol:'vsr.spatial-reality-3d.v0.7',entity_id:`${entityId}:debug`,
    primitives:{
      joints:Object.entries(pose).map(([name,position])=>({kind:'sphere',name,position,radius:0.018})),
      bones:BONE_EDGES.filter(([a,b])=>pose[a]&&pose[b]).map(([a,b])=>({kind:'line',name:`${a}-${b}`,from:pose[a],to:pose[b]})),
      com:evaluation?{kind:'sphere',name:'com',position:evaluation.com,radius:0.03}:null,
      support:evaluation?{kind:'polygon',name:'support',points:evaluation.support.polygon.map(([x,z])=>[x,0.002,z])}:null
    }
  };
}
export function toGltfJointPatch(pose,jointMap={}){
  return Object.entries(jointMap).flatMap(([poseName,gltfNode])=>pose[poseName]?[{node:gltfNode,translation:pose[poseName]}]:[]);
}
