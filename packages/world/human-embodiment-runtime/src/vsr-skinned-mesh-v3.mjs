import {buildSkinPalette,poseToGltfNodeTransforms} from './gltf-rig.mjs';

export function toVsrSkinnedMeshFrameV3({entityId='human',binding,state,fk,meshId='mesh',materialId=null}={}){
  if(!binding)throw new Error('binding required'); const palette=buildSkinPalette(binding,fk),nodeTransforms=poseToGltfNodeTransforms(binding,state);
  return {protocol:'vsr.spatial-reality-3d.v0.7',extension:'her.skinned-mesh-frame.v0.3',entity_id:entityId,renderable:{kind:'skinned-mesh',mesh_id:meshId,material_id:materialId,rig_binding_format:binding.format,node_transforms:nodeTransforms,skin_palette:palette},evidence:{mapped_joint_count:Object.keys(binding.jointMap??{}).length,palette_count:Object.keys(palette).length}};
}

export function buildVsrSkinStreamV3({entityId='human',binding,frames,meshId='mesh'}={}){
  return {protocol:'vsr.temporal-presentation.v0.6',extension:'her.skin-stream.v0.3',entity_id:entityId,frames:frames.map(f=>({t:f.t,frame:toVsrSkinnedMeshFrameV3({entityId,binding,state:f.state??f.pose,fk:f.fk,meshId})}))};
}
