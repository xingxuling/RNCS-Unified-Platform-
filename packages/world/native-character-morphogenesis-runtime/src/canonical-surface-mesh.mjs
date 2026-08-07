import {distance3,normalize3,rootHash,sub3,seal} from './canonical.mjs';
import {evaluateMorphologyField} from './morphology-field.mjs';

const MESH_FORMAT='rncs.canonical-surface-mesh.v0.1';
const cubeOffsets=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
const tetrahedra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
const tetraEdges=[[0,1],[1,2],[2,0],[0,3],[1,3],[2,3]];
const edgeKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
const finitePoint=value=>Array.isArray(value)&&value.length===3&&value.every(item=>Number.isFinite(Number(item)));
const clamp01=value=>Math.max(0,Math.min(1,Number(value)));

function resolutionFor(profile){
  if(typeof profile==='object'&&profile?.x&&profile?.y&&profile?.z)return{...profile};
  if(profile==='property')return{x:8,y:12,z:8};
  if(profile==='validation')return{x:24,y:36,z:20};
  if(profile==='high')return{x:30,y:44,z:24};
  return{x:14,y:22,z:12};
}

function fieldBounds(field){
  const fields=field?.fields??[],bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
  for(const item of fields){const center=item.rest_center,extent=Number(item.extent??.01)+Number(item.blend_radius??.01);for(let axis=0;axis<3;axis+=1){bounds.min[axis]=Math.min(bounds.min[axis],center[axis]-extent);bounds.max[axis]=Math.max(bounds.max[axis],center[axis]+extent);}}
  if(!fields.length)return{min:[-.3,-.05,-.2],max:[.3,.8,.2]};
  for(let axis=0;axis<3;axis+=1){bounds.min[axis]-=.012;bounds.max[axis]+=.012;}
  return bounds;
}

function gridPoint(bounds,resolution,x,y,z){return[bounds.min[0]+(bounds.max[0]-bounds.min[0])*(x/resolution.x),bounds.min[1]+(bounds.max[1]-bounds.min[1])*(y/resolution.y),bounds.min[2]+(bounds.max[2]-bounds.min[2])*(z/resolution.z)];}
function gridIndex(resolution,x,y,z){return(z*(resolution.y+1)+y)*(resolution.x+1)+x;}

function interpolate(a,b){
  const denominator=Number(a.sample.distance)-Number(b.sample.distance),t=Math.abs(denominator)<1e-12?.5:clamp01(Number(a.sample.distance)/denominator);
  return{point:[a.point[0]+(b.point[0]-a.point[0])*t,a.point[1]+(b.point[1]-a.point[1])*t,a.point[2]+(b.point[2]-a.point[2])*t],sample:a.sample};
}

function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}

function segmentTriangleHit(start,end,a,b,c){
  const epsilon=1e-8,direction=sub3(end,start),edge1=sub3(b,a),edge2=sub3(c,a),h=cross(direction,edge2),det=dot(edge1,h);
  if(Math.abs(det)<epsilon)return false;
  const inverse=1/det,s=sub3(start,a),u=inverse*dot(s,h);if(u<-epsilon||u>1+epsilon)return false;
  const q=cross(s,edge1),v=inverse*dot(direction,q);if(v<-epsilon||u+v>1+epsilon)return false;
  const t=inverse*dot(edge2,q);return t>=-epsilon&&t<=1+epsilon;
}

function triangleAabb(triangle,vertices){const points=triangle.map(index=>vertices[index]),min=[0,1,2].map(axis=>Math.min(...points.map(point=>point[axis]))),max=[0,1,2].map(axis=>Math.max(...points.map(point=>point[axis])));return{min,max};}
function aabbOverlap(a,b){return[0,1,2].every(axis=>a.min[axis]<=b.max[axis]+1e-9&&b.min[axis]<=a.max[axis]+1e-9);}

function countSurfaceIntersections(triangles,vertices){
  const boxes=triangles.map(triangle=>triangleAabb(triangle,vertices)),touches=(left,right)=>left.some(index=>right.includes(index));
  let count=0;
  for(let left=0;left<triangles.length;left+=1)for(let right=left+1;right<triangles.length;right+=1){
    if(touches(triangles[left],triangles[right])||!aabbOverlap(boxes[left],boxes[right]))continue;
    const a=triangles[left].map(index=>vertices[index]),b=triangles[right].map(index=>vertices[index]);
    if(segmentTriangleHit(a[0],a[1],...b)||segmentTriangleHit(a[1],a[2],...b)||segmentTriangleHit(a[2],a[0],...b)||segmentTriangleHit(b[0],b[1],...a)||segmentTriangleHit(b[1],b[2],...a)||segmentTriangleHit(b[2],b[0],...a))count+=1;
  }
  return count;
}

function buildTopology(triangles,vertices){
  const neighbors=Array.from({length:vertices.length},()=>new Set()),edgeCounts=new Map(),triangleNeighbors=Array.from({length:triangles.length},()=>new Set());
  for(let triangleIndex=0;triangleIndex<triangles.length;triangleIndex+=1){const triangle=triangles[triangleIndex];for(const [a,b] of [[triangle[0],triangle[1]],[triangle[1],triangle[2]],[triangle[2],triangle[0]]]){neighbors[a].add(b);neighbors[b].add(a);const key=edgeKey(a,b);const entry=edgeCounts.get(key)??{a,b,count:0,triangles:[]};entry.count+=1;entry.triangles.push(triangleIndex);edgeCounts.set(key,entry);}}
  for(const edge of edgeCounts.values())for(const left of edge.triangles)for(const right of edge.triangles)if(left!==right)triangleNeighbors[left].add(right);
  const visited=new Set(),components=[];
  for(let index=0;index<triangles.length;index+=1){if(visited.has(index))continue;const queue=[index],triangleIndices=[],vertexSet=new Set();visited.add(index);while(queue.length){const current=queue.shift();triangleIndices.push(current);for(const vertex of triangles[current])vertexSet.add(vertex);for(const next of triangleNeighbors[current])if(!visited.has(next)){visited.add(next);queue.push(next);}}components.push({component_id:`surface-component-${components.length}`,triangle_indices:triangleIndices.sort((a,b)=>a-b),vertex_indices:[...vertexSet].sort((a,b)=>a-b)});}
  const boundaryEdges=[...edgeCounts.values()].filter(edge=>edge.count===1).map(edge=>[edge.a,edge.b]);
  return{adjacency:neighbors.map(set=>[...set].sort((a,b)=>a-b)),boundary_edges:boundaryEdges,connected_components:components,edge_count:edgeCounts.size,non_manifold_edges:[...edgeCounts.values()].filter(edge=>edge.count>2).map(edge=>[edge.a,edge.b])};
}

function normalFor(field,point,step){
  const epsilon=Math.max(step*.35,.0005),x=evaluateMorphologyField(field,[point[0]+epsilon,point[1],point[2]]).distance-evaluateMorphologyField(field,[point[0]-epsilon,point[1],point[2]]).distance,y=evaluateMorphologyField(field,[point[0],point[1]+epsilon,point[2]]).distance-evaluateMorphologyField(field,[point[0],point[1]-epsilon,point[2]]).distance,z=evaluateMorphologyField(field,[point[0],point[1],point[2]+epsilon]).distance-evaluateMorphologyField(field,[point[0],point[1],point[2]-epsilon]).distance;
  return normalize3([x,y,z]);
}

export function buildCanonicalSurfaceMesh({field,profile='preview'}={}){
  const resolution=resolutionFor(profile),bounds=fieldBounds(field),sampleResolution=[(bounds.max[0]-bounds.min[0])/resolution.x,(bounds.max[1]-bounds.min[1])/resolution.y,(bounds.max[2]-bounds.min[2])/resolution.z],samples=new Array((resolution.x+1)*(resolution.y+1)*(resolution.z+1));
  for(let z=0;z<=resolution.z;z+=1)for(let y=0;y<=resolution.y;y+=1)for(let x=0;x<=resolution.x;x+=1){const pointValue=gridPoint(bounds,resolution,x,y,z);const grid_id=gridIndex(resolution,x,y,z);samples[grid_id]={point:pointValue,sample:evaluateMorphologyField(field,pointValue),grid_id};}
  const vertices=[],normals=[],region_ids=[],material_ids=[],bone_weights=[],vertexMap=new Map(),triangles=[];
  const vertexFor=(a,b)=>{const key=edgeKey(a.grid_id,b.grid_id);if(vertexMap.has(key))return vertexMap.get(key);const value=interpolate(a,b),index=vertices.length;vertices.push(value.point);region_ids.push(value.sample.semantic_region??'unassigned');material_ids.push(value.sample.material_region??'unassigned');bone_weights.push(value.sample.attached_bone?{[value.sample.attached_bone]:1}:{});vertexMap.set(key,index);return index;};
  const addTetra=(tetra)=>{const crossings=[];for(const [left,right] of tetraEdges){const a=tetra[left],b=tetra[right],aInside=Number(a.sample.distance)<=0,bInside=Number(b.sample.distance)<=0;if(aInside!==bInside)crossings.push(vertexFor(a,b));}const unique=[...new Set(crossings)];if(unique.length===3)triangles.push(unique);else if(unique.length===4)triangles.push([unique[0],unique[1],unique[2]],[unique[0],unique[2],unique[3]]);};
  for(let z=0;z<resolution.z;z+=1)for(let y=0;y<resolution.y;y+=1)for(let x=0;x<resolution.x;x+=1){const cube=cubeOffsets.map(([dx,dy,dz])=>samples[gridIndex(resolution,x+dx,y+dy,z+dz)]);for(const tetraIndices of tetrahedra)addTetra(tetraIndices.map(index=>cube[index]));}
  for(const pointValue of vertices)normals.push(normalFor(field,pointValue,Math.min(...sampleResolution)));
  const topology=buildTopology(triangles,vertices),groups=new Map();for(let index=0;index<triangles.length;index+=1){const region=region_ids[triangles[index][0]]??'unassigned',group=groups.get(region)??{surface_group_id:region,region_id:region,triangle_indices:[]};group.triangle_indices.push(index);groups.set(region,group);}
  const topologyReport={method:'marching-tetrahedra-deterministic-cpu',surface_self_intersection_count:countSurfaceIntersections(triangles,vertices),manifold:topology.boundary_edges.length===0&&topology.non_manifold_edges.length===0,bounded_nonmanifold:topology.boundary_edges.length>0||topology.non_manifold_edges.length>0,boundary_edge_count:topology.boundary_edges.length,non_manifold_edge_count:topology.non_manifold_edges.length,triangle_count:triangles.length,vertex_count:vertices.length};
  const base={format:MESH_FORMAT,version:'0.1.0-alpha.1',units:'normalized-body',camera_independent:true,resolution_independent:true,style_independent:true,field_root:field?.field_root??null,mesh_root:'',bounds,resolution,vertices,normals,triangles,region_ids,bone_weights,material_ids,surface_groups:[...groups.values()],adjacency:topology.adjacency,boundary_edges:topology.boundary_edges,connected_components:topology.connected_components,mesh_root_source:'canonical-field-extraction',topology_report:topologyReport};
  return seal(base,'mesh_root');
}

export function validateCanonicalSurfaceMesh(mesh){
  const errors=[],vertices=mesh?.vertices??[],triangles=mesh?.triangles??[];
  if(!vertices.length)errors.push('MESH_VERTICES_EMPTY');
  if(!triangles.length)errors.push('MESH_TRIANGLES_EMPTY');
  if(vertices.some(pointValue=>!finitePoint(pointValue)))errors.push('MESH_VERTEX_INVALID');
  for(const triangle of triangles)if(!Array.isArray(triangle)||triangle.length!==3||triangle.some(index=>!Number.isInteger(index)||index<0||index>=vertices.length))errors.push('MESH_TRIANGLE_INVALID');
  if(!Array.isArray(mesh?.normals)||mesh.normals.length!==vertices.length)errors.push('MESH_NORMAL_CARDINALITY_INVALID');
  if(!Array.isArray(mesh?.bone_weights)||mesh.bone_weights.length!==vertices.length)errors.push('MESH_BONE_WEIGHT_CARDINALITY_INVALID');
  if(!Array.isArray(mesh?.connected_components)||mesh.connected_components.length!==1)errors.push('MESH_CONNECTED_COMPONENTS_INVALID');
  const weightsValid=mesh?.bone_weights?.every(weights=>{const values=Object.values(weights??{}).map(Number),sum=values.reduce((total,value)=>total+value,0);return values.length>0&&values.every(value=>value>=0&&value<=1)&&Math.abs(sum-1)<1e-6;});
  if(!weightsValid)errors.push('MESH_BONE_WEIGHTS_INVALID');
  return{valid:errors.length===0,errors,mesh_root:mesh?.mesh_root??null,topology_report:mesh?.topology_report??null};
}
