import {add3,clamp,rootHash,rotateEuler,scale3,seal,transformPoint} from './canonical.mjs';
import {boneMap} from './kinematics.mjs';

const point=(x,y,z=0)=>[Number(x),Number(y),Number(z)];

function capsuleContour(a,b,radius,segments=8){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,points=[];
  for(let index=0;index<=segments;index+=1){const angle=Math.atan2(-dy,-dx)+Math.PI*index/segments;points.push([a[0]+Math.cos(angle)*radius,a[1]+Math.sin(angle)*radius,(a[2]??0)]);}
  for(let index=0;index<=segments;index+=1){const angle=Math.atan2(dy,dx)+Math.PI*index/segments;points.push([b[0]+Math.cos(angle)*radius,b[1]+Math.sin(angle)*radius,(b[2]??0)]);}
  return points;
}

function polylineContour(points,radii){
  const left=[],right=[];
  for(let index=0;index<points.length;index+=1){
    const current=points[index],previous=points[Math.max(0,index-1)],next=points[Math.min(points.length-1,index+1)],dx=next[0]-previous[0],dy=next[1]-previous[1],length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,radius=Array.isArray(radii)?radii[index]??radii.at(-1):radii;
    left.push([current[0]+nx*radius,current[1]+ny*radius,current[2]??0]);right.unshift([current[0]-nx*radius,current[1]-ny*radius,current[2]??0]);
  }
  return [...left,...right];
}

function ellipseContour(center,radii,segments=18){const points=[];for(let index=0;index<segments;index+=1){const angle=(index/segments)*Math.PI*2;points.push([center[0]+Math.cos(angle)*radii[0],center[1]+Math.sin(angle)*radii[1],center[2]??0]);}return points;}
const primitive=(kind,id,layer,material,geometry,extra={})=>({kind,id,layer,material,...geometry,...extra});
const bonePoint=(bone,local)=>transformPoint(bone.world_transform,local);
const localEllipse=(bone,center,radii)=>ellipseContour(bonePoint(bone,center),radii);

function torsoContour(asset,bones){
  const left=[],right=[];
  for(const section of asset.surface_templates.torso_sections){const bone=bones.get(section.bone_id),center=bonePoint(bone,[0,section.local_y,0]);left.push(point(center[0]-section.radius_x,center[1],center[2]));right.unshift(point(center[0]+section.radius_x,center[1],center[2]));}
  return [...left,...right];
}

function offsetContour(points,scale=1.025){const center=points.reduce((sum,value)=>add3(sum,value),[0,0,0]).map(value=>value/points.length);return points.map(value=>[center[0]+(value[0]-center[0])*scale,center[1]+(value[1]-center[1])*scale,value[2]]);}

function featurePrimitives(asset,bones,performance){
  const skull=bones.get('skull'),face=asset.surface_templates.face_surface,anchors=Object.fromEntries(Object.entries(face.feature_anchors).map(([id,local])=>[id,bonePoint(skull,local)])),jawLocal=[[-asset.proportions.radii.skull[0]*.74,-asset.proportions.radii.skull[1]*.22,.58*asset.proportions.radii.skull[2]],[-asset.proportions.radii.skull[0]*.6,-asset.proportions.radii.skull[1]*.5,.6*asset.proportions.radii.skull[2]],[0,-asset.proportions.radii.skull[1]*.66,.58*asset.proportions.radii.skull[2]],[asset.proportions.radii.skull[0]*.6,-asset.proportions.radii.skull[1]*.5,.6*asset.proportions.radii.skull[2]],[asset.proportions.radii.skull[0]*.74,-asset.proportions.radii.skull[1]*.22,.58*asset.proportions.radii.skull[2]]].map(local=>bonePoint(skull,local));
  const eyeScale=Math.max(.42,Math.abs(Math.cos(performance.joint_rotations?.skull?.yaw??0))),mouthOpen=performance.mouth!=='closed';
  return{anchors,primitives:[primitive('line','jaw','face-outline','ink',{points:jawLocal,width_role:'jaw'}),primitive('ellipse','left-eye','face-feature','eye',{center:anchors.left_eye,radii:[asset.proportions.radii.skull[0]*.18*eyeScale,asset.proportions.radii.skull[1]*.055]}),primitive('ellipse','right-eye','face-feature','eye',{center:anchors.right_eye,radii:[asset.proportions.radii.skull[0]*.18*eyeScale,asset.proportions.radii.skull[1]*.055]}),primitive('line','left-brow','face-feature','ink',{points:[add3(anchors.left_brow,[-asset.proportions.radii.skull[0]*.16,.012,0]),add3(anchors.left_brow,[asset.proportions.radii.skull[0]*.16,.006,0])]}),primitive('line','right-brow','face-feature','ink',{points:[add3(anchors.right_brow,[-asset.proportions.radii.skull[0]*.16,.006,0]),add3(anchors.right_brow,[asset.proportions.radii.skull[0]*.16,.012,0])]}),primitive('line','nose','face-feature','skin-shadow',{points:[anchors.nose_bridge,anchors.nose_tip]}),primitive('line','mouth-closed','face-feature','ink',{points:[anchors.mouth_left,anchors.mouth_center,anchors.mouth_right],visible:!mouthOpen}),primitive('ellipse','mouth-open','face-feature','ink',{center:anchors.mouth_center,radii:[asset.proportions.radii.skull[0]*.25,asset.proportions.radii.skull[1]*.09],visible:mouthOpen}),primitive('ellipse','mouth-open-inner','face-feature','mouth-inner',{center:add3(anchors.mouth_center,[0,.004,.003]),radii:[asset.proportions.radii.skull[0]*.15,asset.proportions.radii.skull[1]*.04],visible:mouthOpen})]};
}

function hairPrimitives(asset,bones,performance){
  const skull=bones.get('skull'),field=asset.surface_templates.hair_field,primitives=[];
  for(const mass of field.main_masses){
    const roots=mass.root_ids.map(id=>field.root_anchors.find(anchor=>anchor.anchor_id===id)).filter(Boolean),points=[];
    if(roots.length===1){
      points.push(bonePoint(skull,roots[0].local_root));
      for(const offset of (mass.local_offsets??[]).slice(1))points.push(bonePoint(skull,add3(roots[0].local_root,offset)));
    }else{
      for(const root of roots)points.push(bonePoint(skull,root.local_root));
    }
    if(points.length>=2){
      const center=points.reduce((sum,value)=>add3(sum,value),[0,0,0]).map(value=>value/points.length);
      const lag=Number(performance.secondary?.hair_lag??0),shift=[lag*.18,Math.abs(lag)*.08,0];
      let silhouette;
      if(mass.id==='crown'){
        const left=points[0],right=points.at(-1),topLeft=add3(left,[0,.055,0]),topRight=add3(right,[0,.055,0]),topCenter=add3(center,[0,.09,0]);
        silhouette=[...points,topRight,topCenter,topLeft];
      }else{
        const outer=points.map(value=>add3(center,scale3([value[0]-center[0],value[1]-center[1],value[2]-center[2]],1.08))),inner=points.slice().reverse().map(value=>add3(center,scale3([value[0]-center[0],value[1]-center[1],value[2]-center[2]],.82)));
        silhouette=[...outer,...inner];
      }
      primitives.push(primitive('polygon',`hair-${mass.id}`,'hair','hair',{points:silhouette.map((value,index)=>index<roots.length?value:add3(value,shift)),root_ids:mass.root_ids,secondary_motion_space:'scalp-local',root_preservation:true,lag}));
    }
  }
  const anchors=field.root_anchors.map(root=>({anchor_id:root.anchor_id,world_position:bonePoint(skull,root.local_root),surface_coordinates:root.surface_coordinates}));
  return{primitives,anchors};
}

export function solveDeformation(asset,posedSkeleton,performance=posedSkeleton.performance??{}){
  const bones=boneMap(posedSkeleton),r=asset.proportions.radii,b=asset.proportions.bone_lengths,primitives=[],volumes=[];
  const addVolume=(id,kind,geometry,material='skin',layer='body-volume')=>{volumes.push({id,kind,...geometry});primitives.push(primitive(kind,id,layer,material,geometry));};
  const pelvis=bones.get('pelvis'),rib=bones.get('ribcage'),neck=bones.get('neck'),skull=bones.get('skull');
  addVolume('pelvis-surface','polygon',{points:torsoContour(asset,bones)},'body','body-surface');
  addVolume('garment-coat','polygon',{points:offsetContour(torsoContour(asset,bones),1.018)},'coat','garment-surface');
  addVolume('neck-surface','polygon',{points:capsuleContour(neck.world_start,skull.world_start,r.neck[0])},'skin','body-surface');
  addVolume('head-surface','polygon',{points:ellipseContour(bonePoint(skull,[0,r.skull[1]*.64,0]),[r.skull[0],r.skull[1]])},'skin','body-surface');
  for(const side of ['left','right']){const upper=bones.get(`upper-arm-${side}`),fore=bones.get(`forearm-${side}`),elbow=bones.get(`elbow-${side}`),hand=bones.get(`hand-${side}`),upperRadius=r.upper_arm,foreRadius=r.forearm,elbowRadius=r.elbow;
    addVolume(`skin-upper-arm-${side}`,'polygon',{points:capsuleContour(upper.world_start,upper.world_end,upperRadius)},'skin','skin-limb');
    addVolume(`skin-elbow-${side}`,'polygon',{points:ellipseContour(elbow.world_start,[elbowRadius,elbowRadius])},'skin-shadow','joint-surface');
    addVolume(`skin-forearm-${side}`,'polygon',{points:capsuleContour(fore.world_start,fore.world_end,foreRadius)},'skin','skin-limb');
    addVolume(`skin-hand-${side}`,'polygon',{points:capsuleContour(hand.world_start,hand.world_end,r.hand[0])},'skin','hand-surface');
    primitives.push(primitive('polygon',`garment-sleeve-${side}`,'garment-surface','coat',{points:polylineContour([upper.world_start,upper.world_end,fore.world_end],[upperRadius*1.2,(upperRadius+foreRadius)*.58,foreRadius*1.16]),continuity_group:`arm-${side}`}));
  }
  const face=featurePrimitives(asset,bones,performance);primitives.push(...face.primitives);
  const hair=hairPrimitives(asset,bones,performance);primitives.push(...hair.primitives);
  const poseRoot=posedSkeleton.pose_root,geometry={format:'rncs.posed-character-geometry.v0.1',asset_root:asset.morphology_root,pose_root:poseRoot,coordinate_system:asset.proportions.coordinate_system,bones:posedSkeleton.bones,volumes,surfaces:{primitives,face_anchors:face.anchors,scalp_anchors:hair.anchors},deformation:{solver:'rncs.canonical-volume-surface-deformation.v0.1',joint_continuity:true,volume_preservation:true,garment_offset_surface:true,face_surface_attached:true,scalp_roots_attached:true},performance};
  return seal(geometry,'geometry_root');
}

export function validateDeformedGeometry(geometry){const primitives=geometry?.surfaces?.primitives??[],errors=[];if(!primitives.some(item=>item.id==='head-surface'))errors.push('HEAD_SURFACE_MISSING');if(!primitives.some(item=>item.id==='garment-coat'))errors.push('GARMENT_SURFACE_MISSING');if(!geometry?.deformation?.joint_continuity)errors.push('JOINT_CONTINUITY_MISSING');if((geometry?.surfaces?.scalp_anchors??[]).some(anchor=>!anchor.world_position))errors.push('SCALP_WORLD_ATTACHMENT_MISSING');return{valid:errors.length===0,errors,geometry_root:geometry?.geometry_root??null};}
