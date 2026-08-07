import {rootHash,rotateEuler,seal} from './canonical.mjs';

const round=value=>Number(Number(value).toFixed(4));
const withOffset=(camera,base)=>Object.prototype.hasOwnProperty.call(camera??{},'offset_y')?{...base,offset_y:Number(camera.offset_y??0)}:base;

export function projectPoint3(pointValue,camera={}){
  const yaw=Number(camera.yaw??camera.camera_yaw??0),pitch=Number(camera.pitch??camera.camera_pitch??0),rotated=rotateEuler(pointValue,{yaw:-yaw,pitch:-pitch}),depth=rotated[2]??0,perspective=1/(1+depth*.18),scale=Number(camera.scale??1),offsetY=Number(camera.offset_y??camera.offsetY??0),x=.5+rotated[0]*1.34*perspective*scale,y=.78+offsetY-rotated[1]*.88*scale,width=Number(camera.width??1280),height=Number(camera.height??720);
  return[round(x*width),round(y*height),round(depth)];
}

function projectPrimitive(item,camera){
  if(item.visible===false)return null;
  if(item.kind==='polygon'||item.kind==='line')return{...item,points:item.points.map(point=>projectPoint3(point,camera))};
  if(item.kind==='ellipse'){
    const center=projectPoint3(item.center,camera),xRadius=Math.abs(projectPoint3([item.center[0]+item.radii[0],item.center[1],item.center[2]??0],camera)[0]-center[0]),yRadius=Math.abs(projectPoint3([item.center[0],item.center[1]+item.radii[1],item.center[2]??0],camera)[1]-center[1]);
    return{...item,center,radii:[round(xRadius),round(yRadius)]};
  }
  return{...item};
}

export function projectFrameGeometry(geometry,camera={}){
  const normalized=withOffset(camera,{width:Number(camera.width??1280),height:Number(camera.height??720),yaw:Number(camera.yaw??0),pitch:Number(camera.pitch??0),scale:Number(camera.scale??1),projection:'orthographic-perspective-hybrid'});
  const primitives=(geometry?.surfaces?.primitives??[]).map(item=>projectPrimitive(item,normalized)).filter(Boolean),projected={format:'rncs.projected-frame-geometry.v0.1',source_geometry_root:geometry?.geometry_root??null,pose_root:geometry?.pose_root??null,asset_root:geometry?.asset_root??null,camera:normalized,performance:geometry?.performance??null,primitives,face_anchors:Object.fromEntries(Object.entries(geometry?.surfaces?.face_anchors??{}).map(([id,point])=>[id,projectPoint3(point,normalized)])),scalp_anchors:(geometry?.surfaces?.scalp_anchors??[]).map(anchor=>({...anchor,projected_position:projectPoint3(anchor.world_position,normalized)})),projection_policy:'camera-only-projection-before-style'};
  return seal(projected,'projection_root');
}

export function validateProjection(projected){const errors=[];if(!projected?.camera)errors.push('CAMERA_MISSING');if(!projected?.primitives?.length)errors.push('PROJECTED_PRIMITIVES_EMPTY');for(const primitive of projected?.primitives??[])if(primitive.kind==='polygon'&&primitive.points.some(point=>point.some(value=>!Number.isFinite(value))))errors.push(`PROJECTED_POINT_INVALID:${primitive.id}`);return{valid:errors.length===0,errors,projection_root:projected?.projection_root??null};}
