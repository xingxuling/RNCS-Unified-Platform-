import crypto from 'node:crypto';
import {projectPoint3} from './projection.mjs';
import {rootHash,rotateEuler,transformPoint} from './canonical.mjs';

const VISIBILITY_FORMAT='rncs.native-visibility-buffer.v0.1';
const indexAt=(x,y,width)=>y*width+x;
const typedBufferRoot=value=>crypto.createHash('sha256').update(Buffer.from(value.buffer,value.byteOffset,value.byteLength)).digest('hex');

function barycentric(point,a,b,c){
  const denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
  if(Math.abs(denominator)<1e-9)return null;
  const u=((b[1]-c[1])*(point[0]-c[0])+(c[0]-b[0])*(point[1]-c[1]))/denominator,v=((c[1]-a[1])*(point[0]-c[0])+(a[0]-c[0])*(point[1]-c[1]))/denominator,w=1-u-v;
  return[u,v,w];
}

function finiteDepth(value){return Number.isFinite(Number(value));}

function neighborhoodDepth(depth,x,y,width,height,radius=2){
  let best=-Infinity;for(let dy=-radius;dy<=radius;dy+=1)for(let dx=-radius;dx<=radius;dx+=1){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;best=Math.max(best,Number(depth[indexAt(nx,ny,width)]));}return best;
}

function featureWorldPosition(attachment,posedSkeleton){
  const skull=posedSkeleton?.bones?.find(bone=>bone.id==='skull');
  return transformPoint(skull?.world_transform??{position:[0,0,0],rotation:{}},attachment.local_position);
}

function visibleSilhouetteCount(visible,width,height){
  const visited=new Uint8Array(visible.length),components=[];
  for(let y=0;y<height;y+=1)for(let x=0;x<width;x+=1){const start=indexAt(x,y,width);if(!visible[start]||visited[start])continue;const queue=[start],pixels=[];visited[start]=1;while(queue.length){const current=queue.shift(),cx=current%width,cy=Math.floor(current/width);pixels.push(current);for(const [nx,ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]]){if(nx<0||ny<0||nx>=width||ny>=height)continue;const next=indexAt(nx,ny,width);if(visible[next]&&!visited[next]){visited[next]=1;queue.push(next);}}}components.push(pixels);}
  return components;
}

function exteriorInvisibleMask(visible,width,height){
  const exterior=new Uint8Array(width*height),queue=[];const enqueue=pixel=>{if(!visible[pixel]&&!exterior[pixel]){exterior[pixel]=1;queue.push(pixel);}};for(let x=0;x<width;x+=1){enqueue(indexAt(x,0,width));enqueue(indexAt(x,height-1,width));}for(let y=1;y<height-1;y+=1){enqueue(indexAt(0,y,width));enqueue(indexAt(width-1,y,width));}for(let cursor=0;cursor<queue.length;cursor+=1){const current=queue[cursor],cx=current%width,cy=Math.floor(current/width);for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;enqueue(indexAt(nx,ny,width));}}return exterior;
}

function closeInteriorCoverage(visible,depth,surfaceId,regionId,normal,width,height,{maxRadius=3,maxIterations=2}={}){
  let filled=0,thinCrackFilled=0,iterations=0;const copySurface=(pixel,source)=>{visible[pixel]=1;depth[pixel]=depth[source];surfaceId[pixel]=surfaceId[source];regionId[pixel]=regionId[source];normal[pixel*3]=normal[source*3];normal[pixel*3+1]=normal[source*3+1];normal[pixel*3+2]=normal[source*3+2];};
  for(let iteration=0;iteration<maxIterations;iteration+=1){const crackUpdates=[];for(let y=1;y<height-1;y+=1)for(let x=1;x<width-1;x+=1){const pixel=indexAt(x,y,width);if(visible[pixel])continue;let count=0,source=null;for(let dy=-1;dy<=1;dy+=1)for(let dx=-1;dx<=1;dx+=1){if(!dx&&!dy)continue;const candidate=indexAt(x+dx,y+dy,width);if(visible[candidate]&&finiteDepth(depth[candidate])){count++;source??=candidate;}}if(count>=5&&source!==null)crackUpdates.push([pixel,source]);}for(const [pixel,source] of crackUpdates)copySurface(pixel,source);if(crackUpdates.length)thinCrackFilled+=crackUpdates.length;
    const exterior=exteriorInvisibleMask(visible,width,height),candidates=[];for(let y=1;y<height-1;y+=1)for(let x=1;x<width-1;x+=1){const pixel=indexAt(x,y,width);if(!visible[pixel]&&!exterior[pixel])candidates.push([x,y,pixel]);}const updates=[];for(const [x,y,pixel] of candidates){let source=null;for(let radius=1;radius<=maxRadius&&!source;radius+=1)for(let dy=-radius;dy<=radius&&!source;dy+=1)for(let dx=-radius;dx<=radius;dx+=1){if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const candidate=indexAt(nx,ny,width);if(visible[candidate]&&finiteDepth(depth[candidate])){source=candidate;break;}}if(source!==null)updates.push([pixel,source]);}for(const [pixel,source] of updates)copySurface(pixel,source);if(!crackUpdates.length&&!updates.length)break;filled+=updates.length;iterations+=1;}
  const finalExterior=exteriorInvisibleMask(visible,width,height),unresolved=Array.from({length:width*height},(_,pixel)=>!visible[pixel]&&!finalExterior[pixel]).filter(Boolean).length;return{filled,thin_crack_filled:thinCrackFilled,iterations,unresolved,max_radius:maxRadius};
}

export function buildVisibilityBuffers({mesh,attachments=null,posed_skeleton=null,camera={}}={}){
  const width=Number(camera.width??320),height=Number(camera.height??180),normalizedCamera={width,height,yaw:Number(camera.yaw??0),pitch:Number(camera.pitch??0),scale:Number(camera.scale??1),projection:'orthographic-depth-buffer'},screenVertices=(mesh?.vertices??[]).map(point=>projectPoint3(point,normalizedCamera)),depth=new Float32Array(width*height);depth.fill(-Infinity);const visible=new Uint8Array(width*height),surfaceId=new Int32Array(width*height);surfaceId.fill(-1);const regionId=new Array(width*height).fill(null),normal=new Float32Array(width*height*3),backfaceTriangles=[],clippedTriangles=[],rasterizedTriangles=[];
  for(let triangleIndex=0;triangleIndex<(mesh?.triangles??[]).length;triangleIndex+=1){
    const triangle=mesh.triangles[triangleIndex],projected=triangle.map(index=>screenVertices[index]);if(projected.some(point=>!point||point.some(value=>!Number.isFinite(Number(value))))){clippedTriangles.push(triangleIndex);continue;}
    const area=(projected[1][0]-projected[0][0])*(projected[2][1]-projected[0][1])-(projected[1][1]-projected[0][1])*(projected[2][0]-projected[0][0]);if(Math.abs(area)<1e-8){clippedTriangles.push(triangleIndex);continue;}if(area<0)backfaceTriangles.push(triangleIndex);
    const left=Math.max(0,Math.floor(Math.min(...projected.map(point=>point[0])))),right=Math.min(width-1,Math.ceil(Math.max(...projected.map(point=>point[0])))),top=Math.max(0,Math.floor(Math.min(...projected.map(point=>point[1])))),bottom=Math.min(height-1,Math.ceil(Math.max(...projected.map(point=>point[1]))));
    if(left>right||top>bottom){clippedTriangles.push(triangleIndex);continue;}
    let touched=false;for(let y=top;y<=bottom;y+=1)for(let x=left;x<=right;x+=1){const weights=barycentric([x+.5,y+.5],projected[0],projected[1],projected[2]);if(!weights||weights.some(value=>value<-1e-6))continue;const pixel=indexAt(x,y,width),candidateDepth=weights[0]*projected[0][2]+weights[1]*projected[1][2]+weights[2]*projected[2][2];if(candidateDepth<=depth[pixel])continue;depth[pixel]=candidateDepth;visible[pixel]=1;surfaceId[pixel]=triangleIndex;regionId[pixel]=mesh.region_ids?.[triangle[0]]??'unassigned';const vertexNormals=triangle.map(index=>mesh.normals?.[index]??[0,1,0]);normal[pixel*3]=weights[0]*vertexNormals[0][0]+weights[1]*vertexNormals[1][0]+weights[2]*vertexNormals[2][0];normal[pixel*3+1]=weights[0]*vertexNormals[0][1]+weights[1]*vertexNormals[1][1]+weights[2]*vertexNormals[2][1];normal[pixel*3+2]=weights[0]*vertexNormals[0][2]+weights[1]*vertexNormals[1][2]+weights[2]*vertexNormals[2][2];touched=true;}
    if(touched)rasterizedTriangles.push(triangleIndex);
  }
  const minSilhouettePixels=4,rawSilhouetteComponents=visibleSilhouetteCount(visible,width,height),rasterSpecks=rawSilhouetteComponents.filter(component=>component.length<minSilhouettePixels);for(const component of rasterSpecks)for(const pixel of component){visible[pixel]=0;depth[pixel]=-Infinity;surfaceId[pixel]=-1;regionId[pixel]=null;normal[pixel*3]=0;normal[pixel*3+1]=0;normal[pixel*3+2]=0;}const coverageClosure=closeInteriorCoverage(visible,depth,surfaceId,regionId,normal,width,height),featureSamples=[];for(const attachment of attachments?.face??[]){const world=featureWorldPosition(attachment,posed_skeleton),projectedPoint=projectPoint3(world,normalizedCamera),x=Math.round(projectedPoint[0]),y=Math.round(projectedPoint[1]),pixel=x>=0&&y>=0&&x<width&&y<height?indexAt(x,y,width):null,directDepth=pixel===null?-Infinity:depth[pixel],bufferDepth=finiteDepth(directDepth)?directDepth:pixel===null?-Infinity:neighborhoodDepth(depth,x,y,width,height,4),cameraNormal=rotateEuler(attachment.orientation?.normal??[0,0,1],{yaw:-normalizedCamera.yaw,pitch:-normalizedCamera.pitch}),backfaceOccluded=cameraNormal[2]<-.05,depthOccluded=finiteDepth(bufferDepth)&&projectedPoint[2]<bufferDepth-.025,featureVisible=pixel!==null&&finiteDepth(bufferDepth)&&projectedPoint[2]>=bufferDepth-.025&&!backfaceOccluded,outOfView=pixel===null,occluded=Boolean(!featureVisible&&(depthOccluded||backfaceOccluded)),unresolved=Boolean(!featureVisible&&!outOfView&&!occluded);featureSamples.push({attachment_id:attachment.attachment_id,screen_position:projectedPoint,pixel,buffer_depth:bufferDepth,direct_buffer_depth:directDepth,feature_depth:projectedPoint[2],camera_normal:cameraNormal,sample_radius:finiteDepth(directDepth)?0:4,visible:featureVisible,occluded,out_of_view:outOfView,unresolved,occlusion_reason:featureVisible?'visible':outOfView?'out-of-view':depthOccluded?'depth-buffer':backfaceOccluded?'backface':'unresolved'});}
  const eyes=featureSamples.filter(item=>item.attachment_id.endsWith('left_eye')||item.attachment_id.endsWith('right_eye')),silhouetteComponents=visibleSilhouetteCount(visible,width,height),silhouetteStats=silhouetteComponents.map(component=>{const xs=component.map(pixel=>pixel%width),ys=component.map(pixel=>Math.floor(pixel/width));return{pixel_count:component.length,bounds:{left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)}};}),rasterSpeckStats=rasterSpecks.map(component=>{const xs=component.map(pixel=>pixel%width),ys=component.map(pixel=>Math.floor(pixel/width));return{pixel_count:component.length,bounds:{left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)}};}),report={format:'rncs.visibility-report.v0.1',width,height,depth_compare:'maximum_camera_depth',backface_policy:'two-sided-raster-with-backface-diagnostic',raster_speck_policy:{minimum_component_pixels:minSilhouettePixels,action:'drop-isolated-subpixel-raster-specks-before-silhouette-measurement'},coverage_closure:coverageClosure,backface_triangle_count:backfaceTriangles.length,backface_triangles:backfaceTriangles,clipped_triangle_count:clippedTriangles.length,clipped_triangles:clippedTriangles,rasterized_triangle_count:rasterizedTriangles.length,visible_pixel_count:visible.reduce((sum,value)=>sum+value,0),silhouette_disconnected_islands:Math.max(0,silhouetteComponents.length-1),silhouette_component_count:silhouetteComponents.length,silhouette_components:silhouetteStats,raster_speck_components:rasterSpeckStats,feature_occlusion_correctness:featureSamples.length>0&&featureSamples.every(item=>item.visible||item.occluded||item.out_of_view),feature_samples:featureSamples,eye_depth_order_under_yaw:eyes.length===2?{left_depth:eyes.find(item=>item.attachment_id.endsWith('left_eye'))?.feature_depth??null,right_depth:eyes.find(item=>item.attachment_id.endsWith('right_eye'))?.feature_depth??null,depth_delta:(eyes.find(item=>item.attachment_id.endsWith('left_eye'))?.feature_depth??0)-(eyes.find(item=>item.attachment_id.endsWith('right_eye'))?.feature_depth??0)}:null};
  const base={format:VISIBILITY_FORMAT,version:'0.1.0-alpha.1',width,height,camera:normalizedCamera,mesh_root:mesh?.posed_mesh_root??mesh?.mesh_root??null,VisibilityBuffer:visible,DepthBuffer:depth,SurfaceIdBuffer:surfaceId,RegionIdBuffer:regionId,NormalBuffer:normal,screen_vertices:screenVertices,report,visibility_root:''},buffer_roots={VisibilityBuffer:typedBufferRoot(visible),DepthBuffer:typedBufferRoot(depth),SurfaceIdBuffer:typedBufferRoot(surfaceId),RegionIdBuffer:rootHash(regionId),NormalBuffer:typedBufferRoot(normal)},visibilityRoot=rootHash({format:base.format,version:base.version,width,height,camera:normalizedCamera,mesh_root:base.mesh_root,screen_vertices:screenVertices,report,buffer_roots,visibility_root:''});
  return{...base,buffer_roots,visibility_root:visibilityRoot};
}

export function validateVisibilityBuffers(buffers){
  const errors=[],size=Number(buffers?.width??0)*Number(buffers?.height??0);
  for(const key of ['VisibilityBuffer','DepthBuffer','SurfaceIdBuffer','RegionIdBuffer','NormalBuffer'])if(!buffers?.[key]||buffers[key].length!==(key==='NormalBuffer'?size*3:size))errors.push(`VISIBILITY_BUFFER_INVALID:${key}`);
  if(!buffers?.report?.visible_pixel_count)errors.push('VISIBILITY_EMPTY');
  if(!buffers?.visibility_root)errors.push('VISIBILITY_ROOT_MISSING');
  return{valid:errors.length===0,errors,visibility_root:buffers?.visibility_root??null,report:buffers?.report??null};
}
