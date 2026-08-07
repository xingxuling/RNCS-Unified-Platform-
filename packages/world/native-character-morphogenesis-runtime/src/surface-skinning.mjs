import {normalize3,rootHash,rotateEuler,seal,sub3,transformPoint} from './canonical.mjs';

const SKIN_FORMAT='rncs.posed-canonical-surface-mesh.v0.1';
const zeroRotation={pitch:0,yaw:0,roll:0};

function inverseRotate(value,rotation={}){
  let[x,y,z]=value,pitch=Number(rotation.pitch??0),yaw=Number(rotation.yaw??0),roll=Number(rotation.roll??0),c=Math.cos(-roll),s=Math.sin(-roll);[x,y]=[x*c-y*s,x*s+y*c];c=Math.cos(-yaw);s=Math.sin(-yaw);[x,z]=[x*c-z*s,x*s+z*c];c=Math.cos(-pitch);s=Math.sin(-pitch);[y,z]=[y*c-z*s,y*s+z*c];return[x,y,z];
}

function inverseTransform(transform,value){return inverseRotate(sub3(value,transform?.position??[0,0,0]),transform?.rotation??zeroRotation);}
function weighted(values,weights){return values.reduce((sum,value,index)=>[sum[0]+value[0]*weights[index],sum[1]+value[1]*weights[index],sum[2]+value[2]*weights[index]],[0,0,0]);}

function normalizeWeights(weights){const entries=Object.entries(weights??{}).filter(([,value])=>Number(value)>0),sum=entries.reduce((total,[,value])=>total+Number(value),0)||1;return Object.fromEntries(entries.map(([bone,value])=>[bone,Number(value)/sum]));}

export function skinCanonicalSurfaceMesh(mesh,{bind_transforms={},posed_skeleton=null,pose_root=null}={}){
  const posedTransforms=Object.fromEntries((posed_skeleton?.bones??[]).map(bone=>[bone.id,bone.world_transform])),vertices=[],normals=[],boneWeights=[];
  for(let index=0;index<(mesh?.vertices??[]).length;index+=1){
    const weights=normalizeWeights(mesh.bone_weights[index]),positions=[],rotatedNormals=[],normalizedValues=Object.values(weights),bones=Object.keys(weights);
    for(const boneId of bones){const bind=bind_transforms[boneId]??{position:[0,0,0],rotation:zeroRotation},posed=posedTransforms[boneId]??bind,local=inverseTransform(bind,mesh.vertices[index]),normalLocal=inverseRotate(mesh.normals[index]??[0,1,0],bind.rotation??zeroRotation);positions.push(transformPoint(posed,local));rotatedNormals.push(rotateEuler(normalLocal,posed.rotation??zeroRotation));}
    vertices.push(weighted(positions,normalizedValues));normals.push(normalize3(weighted(rotatedNormals,normalizedValues)));boneWeights.push(weights);
  }
  const base={format:SKIN_FORMAT,version:'0.1.0-alpha.1',rest_mesh_root:mesh?.mesh_root??null,pose_root,algorithm:'deterministic-cpu-linear-blend-skinning',vertices,normals,triangles:mesh?.triangles??[],region_ids:mesh?.region_ids??[],material_ids:mesh?.material_ids??[],bone_weights:boneWeights,surface_groups:mesh?.surface_groups??[],adjacency:mesh?.adjacency??[],boundary_edges:mesh?.boundary_edges??[],connected_components:mesh?.connected_components??[],topology_report:mesh?.topology_report??{},posed_mesh_root:''};
  return seal(base,'posed_mesh_root');
}

export function validateSkinnedSurfaceMesh(mesh,restMesh=null){
  const errors=[],vertexCount=mesh?.vertices?.length??0;
  if(!vertexCount)errors.push('POSED_MESH_VERTICES_EMPTY');
  if(mesh?.triangles?.length!==restMesh?.triangles?.length)errors.push('POSED_MESH_TRIANGLE_TOPOLOGY_CHANGED');
  if(mesh?.vertices?.some(point=>!Array.isArray(point)||point.length!==3||point.some(value=>!Number.isFinite(Number(value)))))errors.push('POSED_MESH_VERTEX_INVALID');
  if(mesh?.normals?.length!==vertexCount)errors.push('POSED_MESH_NORMAL_CARDINALITY_INVALID');
  if(mesh?.bone_weights?.some(weights=>{const values=Object.values(weights??{}).map(Number),sum=values.reduce((total,value)=>total+value,0);return !values.length||Math.abs(sum-1)>1e-6;}))errors.push('POSED_MESH_BONE_WEIGHTS_INVALID');
  return{valid:errors.length===0,errors,posed_mesh_root:mesh?.posed_mesh_root??null,rest_mesh_root:mesh?.rest_mesh_root??null};
}
