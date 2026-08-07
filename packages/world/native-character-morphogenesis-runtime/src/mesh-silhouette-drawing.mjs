import {rootHash,seal} from './canonical.mjs';

const FORMAT='rncs.mesh-silhouette-drawing-guide.v0.1';
const round=value=>Number(Number(value).toFixed(3));
const key=point=>`${point[0]},${point[1]}`;

const GROUPS={
  'arm-left':new Set(['shoulder-left','upper-arm-left','elbow-left','forearm-left','wrist-left']),
  'arm-right':new Set(['shoulder-right','upper-arm-right','elbow-right','forearm-right','wrist-right']),
  'leg-left':new Set(['hip-left','thigh-left','knee-left','shin-left','ankle-left']),
  'leg-right':new Set(['hip-right','thigh-right','knee-right','shin-right','ankle-right']),
  'foot-left':new Set(['foot-left']),
  'foot-right':new Set(['foot-right'])
};

function semanticRegionGroup(mesh,triangle){
  const regionVotes=new Map();for(const vertexIndex of triangle??[]){const region=String(mesh?.region_ids?.[vertexIndex]??'').toLowerCase(),weights=mesh?.bone_weights?.[vertexIndex]??{},side=Object.keys(weights).find(id=>id.endsWith('-left'))?'left':Object.keys(weights).find(id=>id.endsWith('-right'))?'right':null;if(!side)continue;let family=null;if(region.includes('foot'))family='foot';else if(/hip|thigh|knee|shin|ankle/.test(region))family='leg';else if(/deltoid|shoulder|upper_arm|upper-arm|elbow|forearm|wrist/.test(region))family='arm';if(family)regionVotes.set(`${family}-${side}`,(regionVotes.get(`${family}-${side}`)??0)+1);}
  let best=null,votes=0;for(const [group,count] of regionVotes)if(count>votes){best=group;votes=count;}return votes>=2?best:null;
}
function triangleGroup(mesh,triangle){
  const semantic=semanticRegionGroup(mesh,triangle);if(semantic)return semantic;
  const totals=new Map();
  for(const vertexIndex of triangle??[]){for(const [bone,weight] of Object.entries(mesh?.bone_weights?.[vertexIndex]??{})){for(const [group,bones] of Object.entries(GROUPS))if(bones.has(bone))totals.set(group,(totals.get(group)??0)+Number(weight));}}
  let best=null,bestWeight=0;for(const [group,weight] of totals)if(weight>bestWeight){best=group;bestWeight=weight;}return bestWeight>.04?best:null;
}

function masksFromVisibility(frame){
  const visibility=frame?.visibility,mesh=frame?.posed_mesh,width=Number(visibility?.width??0),height=Number(visibility?.height??0),size=width*height;
  if(!width||!height||!mesh?.triangles?.length||!visibility?.SurfaceIdBuffer)throw Object.assign(new Error('MESH_SILHOUETTE_VISIBILITY_REQUIRED'),{code:'MESH_SILHOUETTE_VISIBILITY_REQUIRED'});
  const triangleGroups=mesh.triangles.map(triangle=>triangleGroup(mesh,triangle)),masks=Object.fromEntries(Object.keys(GROUPS).map(group=>[group,new Uint8Array(size)]));
  for(let pixel=0;pixel<size;pixel+=1){if(!visibility.VisibilityBuffer?.[pixel])continue;const triangleIndex=Number(visibility.SurfaceIdBuffer[pixel]),group=triangleGroups[triangleIndex];if(group&&masks[group])masks[group][pixel]=1;}
  return{width,height,masks,triangleGroups};
}

function boundaryEdges(mask,width,height){
  const edges=[],inside=(x,y)=>x>=0&&y>=0&&x<width&&y<height&&mask[y*width+x]===1;
  for(let y=0;y<height;y+=1)for(let x=0;x<width;x+=1){if(!inside(x,y))continue;if(!inside(x,y-1))edges.push([[x,y],[x+1,y]]);if(!inside(x+1,y))edges.push([[x+1,y],[x+1,y+1]]);if(!inside(x,y+1))edges.push([[x+1,y+1],[x,y+1]]);if(!inside(x-1,y))edges.push([[x,y+1],[x,y]]);}
  return edges;
}
function stitchLoops(edges){
  const outgoing=new Map();for(const edge of edges){const k=key(edge[0]),list=outgoing.get(k)??[];list.push(edge);outgoing.set(k,list);}for(const list of outgoing.values())list.sort((a,b)=>key(a[1]).localeCompare(key(b[1])));
  const used=new Set(),edgeId=edge=>`${key(edge[0])}>${key(edge[1])}`,loops=[];for(const edge of edges){if(used.has(edgeId(edge)))continue;const start=edge[0],loop=[start];let current=edge,guard=0;while(current&&guard++<edges.length+8){const id=edgeId(current);if(used.has(id))break;used.add(id);loop.push(current[1]);if(key(current[1])===key(start))break;const candidates=(outgoing.get(key(current[1]))??[]).filter(item=>!used.has(edgeId(item)));current=candidates[0]??null;}if(loop.length>=4&&key(loop[0])===key(loop.at(-1)))loops.push(loop.slice(0,-1));}return loops;
}
function polygonArea(points){let area=0;for(let i=0;i<points.length;i+=1){const a=points[i],b=points[(i+1)%points.length];area+=a[0]*b[1]-b[0]*a[1];}return area*.5;}
function bounds(points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return{left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}
function perpendicularDistance(point,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],den=Math.hypot(dx,dy)||1;return Math.abs(dy*point[0]-dx*point[1]+b[0]*a[1]-b[1]*a[0])/den;}
function rdp(points,epsilon){if(points.length<=2)return points;let index=0,max=0;for(let i=1;i<points.length-1;i+=1){const value=perpendicularDistance(points[i],points[0],points.at(-1));if(value>max){index=i;max=value;}}if(max>epsilon){const left=rdp(points.slice(0,index+1),epsilon),right=rdp(points.slice(index),epsilon);return[...left.slice(0,-1),...right];}return[points[0],points.at(-1)];}
function simplifyClosed(points,epsilon=1.35){if(points.length<8)return points.map(p=>p.map(round));const anchor=points.reduce((best,p,i)=>p[0]+p[1]<points[best][0]+points[best][1]?i:best,0),rotated=[...points.slice(anchor),...points.slice(0,anchor),points[anchor]],simplified=rdp(rotated,epsilon).slice(0,-1);return(simplified.length>=6?simplified:points.filter((_,i)=>i%Math.max(1,Math.floor(points.length/12))===0)).map(p=>p.map(round));}
function expandContour(points,factor=1){if(factor===1)return points;const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cy=points.reduce((s,p)=>s+p[1],0)/points.length;return points.map(([x,y])=>[round(cx+(x-cx)*factor),round(cy+(y-cy)*factor)]);}
function guideFor(group,mask,width,height,{epsilon=1.35,expand=1}={}){const pixels=mask.reduce((sum,value)=>sum+value,0);if(!pixels)return null;const loops=stitchLoops(boundaryEdges(mask,width,height));if(!loops.length)return null;const loop=[...loops].sort((a,b)=>Math.abs(polygonArea(b))-Math.abs(polygonArea(a)))[0],contour=expandContour(simplifyClosed(loop,epsilon),expand),box=bounds(contour);if(contour.length<6||box.width<2||box.height<2)return null;return{group,source_pixel_count:pixels,raw_boundary_points:loop.length,contour,area:round(Math.abs(polygonArea(contour))),bounds:box,guide_root:rootHash({group,source_pixel_count:pixels,contour,bounds:box})};}

export function buildMeshSilhouetteDrawingGuide(frame,{epsilon=1.35,garmentExpansion=1.075,legExpansion=1.045}={}){const{width,height,masks}=masksFromVisibility(frame),guides={};for(const group of Object.keys(GROUPS)){const expand=group.startsWith('arm-')?garmentExpansion:group.startsWith('leg-')?legExpansion:1,g=guideFor(group,masks[group],width,height,{epsilon,expand});if(g)guides[group]=g;}const required=['arm-left','arm-right','leg-left','leg-right','foot-left','foot-right'],missing=required.filter(id=>!guides[id]),base={format:FORMAT,version:'0.1.0-alpha.1',native_surface_root:frame?.native_surface_root??null,posed_mesh_root:frame?.posed_mesh?.posed_mesh_root??null,visibility_root:frame?.visibility?.visibility_root??null,canonical_mesh_root:frame?.canonical_mesh_root??frame?.asset?.canonical_surface_mesh?.mesh_root??null,weighted_mesh_root:frame?.mesh_root??null,surface_weighting_root:frame?.surface_weighting_root??null,width,height,classification_policy:'semantic-region-first-bone-weight-fallback',extraction_policy:'visible-surface-id-boundary-largest-loop-rdp',guides,required_groups:required,missing_groups:missing,guide_set_root:''};return seal(base,'guide_set_root');}
export function validateMeshSilhouetteDrawingGuide(guide,{requireFullBody=true}={}){const errors=[];if(guide?.format!==FORMAT)errors.push('MESH_SILHOUETTE_FORMAT_INVALID');if(!guide?.posed_mesh_root||!guide?.visibility_root||!guide?.guide_set_root)errors.push('MESH_SILHOUETTE_ROOT_CHAIN_MISSING');if(requireFullBody&&guide?.missing_groups?.length)errors.push(`MESH_SILHOUETTE_REQUIRED_GROUPS_MISSING:${guide.missing_groups.join(',')}`);for(const [id,item] of Object.entries(guide?.guides??{})){if(!item.guide_root||!Array.isArray(item.contour)||item.contour.length<6)errors.push(`MESH_SILHOUETTE_GUIDE_INVALID:${id}`);if(!Number.isFinite(item.area)||item.area<=0)errors.push(`MESH_SILHOUETTE_AREA_INVALID:${id}`);}return{valid:errors.length===0,errors,guide_set_root:guide?.guide_set_root??null,missing_groups:guide?.missing_groups??[]};}
