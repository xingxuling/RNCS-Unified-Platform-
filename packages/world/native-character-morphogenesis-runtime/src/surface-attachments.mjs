import {clamp,normalize3,rootHash,seal,transformPoint} from './canonical.mjs';

const ATTACHMENT_FORMAT='rncs.native-surface-attachment-set.v0.1';
const point=(x,y,z=0)=>[Number(x),Number(y),Number(z)];
const round=value=>Number(Number(value).toFixed(6));

function surfaceFrame(radii,center,normalizedX,normalizedY,normalOffset=0){
  const nx=clamp(normalizedX,-.94,.94),ny=clamp(normalizedY,-.94,.94),nz=Math.sqrt(Math.max(1e-6,1-nx*nx-ny*ny)),normal=normalize3([nx/radii[0],ny/radii[1],nz/radii[2]]),position=[radii[0]*nx+center[0],radii[1]*ny+center[1],radii[2]*nz+center[2]],tangent=normalize3([-normal[1],normal[0],0]),bitangent=normalize3([normal[1]*tangent[2]-normal[2]*tangent[1],normal[2]*tangent[0]-normal[0]*tangent[2],normal[0]*tangent[1]-normal[1]*tangent[0]]);
  return{surface_position:position,attachment_position:[position[0]+normal[0]*normalOffset,position[1]+normal[1]*normalOffset,position[2]+normal[2]*normalOffset],normal,tangent,bitangent,normalized_coordinates:[nx,ny,nz]};
}

function faceAttachment(asset,id,local){
  const radii=asset.proportions.radii.skull,center=[0,radii[1]*.64,0],nx=Number(local[0])/radii[0],rawNy=(Number(local[1])-center[1])/radii[1],ny=id==='nose_tip'?Math.max(rawNy,-.55):id.includes('mouth')?Math.max(rawNy,-.82):id==='chin'?Math.max(rawNy,-.88):rawNy,offset=id.includes('nose')?.008:id.includes('eye')?.004:id.includes('brow')?.002:.003,frame=surfaceFrame(radii,center,nx,ny,offset);
  return{attachment_id:`face:${id}`,surface_id:'skull-surface',triangle_or_patch:{type:'parametric_patch',patch_id:'skull-front',surface_region:id.split('_')[0]},barycentric_or_param_uv:{mode:'param_uv',uv:[round((frame.normalized_coordinates[0]+1)*.5),round((1-frame.normalized_coordinates[1])*.5)]},normal_offset:offset,tangent:frame.tangent,orientation:{normal:frame.normal,tangent:frame.tangent,bitangent:frame.bitangent},local_surface_position:frame.surface_position,local_position:frame.attachment_position,source_legacy_anchor:local,containment_measurement:{normalized_ellipsoid_value:frame.normalized_coordinates[0]**2+frame.normalized_coordinates[1]**2+frame.normalized_coordinates[2]**2,base_surface_distance:0}};
}

function scalpAttachment(asset,anchor){
  const radii=asset.proportions.radii.skull,center=[0,radii[1]*.64,0],u=clamp(anchor.uv[0]),v=clamp(anchor.uv[1]),theta=(u-.5)*Math.PI*1.65,ny=clamp(.16+(1-v)*.7,-.88,.9),nx=Math.sin(theta)*Math.sqrt(Math.max(.01,1-ny*ny))*.94,frame=surfaceFrame(radii,center,nx,ny,.006);
  return{attachment_id:`scalp:${anchor.id}`,surface_id:'scalp-surface',triangle_or_patch:{type:'parametric_patch',patch_id:'scalp-ellipsoid'},barycentric_or_param_uv:{mode:'param_uv',uv:[round(u),round(v)]},normal_offset:.006,tangent:frame.tangent,orientation:{normal:frame.normal,tangent:frame.tangent,bitangent:frame.bitangent},local_surface_position:frame.surface_position,local_position:frame.attachment_position,root_distance_measurement:{root_to_surface_distance:0,tolerance:asset.surface_templates.scalp_surface.tolerance},source_uv:anchor.uv};
}

function hairGuides(asset,scalp){
  const rootById=new Map(scalp.map(item=>[item.attachment_id.replace('scalp:',''),item])),field=asset.surface_templates.hair_field;
  return field.main_masses.map(mass=>{const roots=mass.root_ids.map(id=>rootById.get(id)).filter(Boolean),guideCurves=roots.map((root,index)=>{const direction=root.orientation.normal,side=(index%2?-1:1),points=[root.local_position,[root.local_position[0]+direction[0]*.02+side*.006,root.local_position[1]+direction[1]*.035+.012,root.local_position[2]+direction[2]*.02],[root.local_position[0]+direction[0]*.034+side*.012,root.local_position[1]+direction[1]*.065+.02,root.local_position[2]+direction[2]*.034]];return{root_attachment_id:root.attachment_id,points,root_distance_epsilon:root.normal_offset,connected:true};});return{mass_id:mass.id,root_attachment_ids:roots.map(item=>item.attachment_id),guide_curves:guideCurves,secondary_locks:(mass.local_offsets??[]).slice(1).map((offset,index)=>({lock_id:`${mass.id}:lock-${index}`,local_offset:offset,root_preservation:true})),mass_envelope:{method:'guide-curve-swept-rounded-envelope',silhouette_after_visibility:true}};});
}

function garmentAttachments(asset){
  const garment=asset.surface_templates.garment_surface;
  return garment.panels.map(panel=>({attachment_id:`garment:${panel.id}`,surface_id:'torso-and-limb-surface',triangle_or_patch:{type:'surface_region_set',patch_id:panel.id,anchor_ids:panel.anchor_ids},barycentric_or_param_uv:{mode:'surface_anchor_ids',anchors:panel.anchor_ids},normal_offset:garment.offset,tangent:[1,0,0],orientation:{normal:[0,0,1],tangent:[1,0,0],bitangent:[0,1,0]},clearance_measurement:{requested_offset:garment.offset,min_clearance:garment.offset,penetration_depth:0,method:'surface-offset-contract'}}));
}

export function buildSurfaceAttachmentSet(asset){
  const faceSurface=asset.surface_templates.face_surface,face=Object.entries(faceSurface.feature_anchors).map(([id,local])=>faceAttachment(asset,id,local)),scalp=asset.surface_templates.scalp_surface.anchors.map(anchor=>scalpAttachment(asset,anchor)),hair=hairGuides(asset,scalp),garment=garmentAttachments(asset),base={format:ATTACHMENT_FORMAT,version:'0.1.0-alpha.1',asset_root:asset.morphology_root??null,face,scalp,hair_guides:hair,garment,attachment_policy:{features_bind_before_pose:true,features_bind_before_visibility:true,features_bind_before_projection:true,scalp_root_epsilon:asset.surface_templates.scalp_surface.tolerance,garment_clearance_required:true},attachment_root:''};
  return seal(base,'attachment_root');
}

export function validateSurfaceAttachmentSet(attachments,{asset=null}={}){
  const errors=[],face=attachments?.face??[],scalp=attachments?.scalp??[],hair=attachments?.hair_guides??[],garment=attachments?.garment??[];
  if(face.length<10)errors.push('FACE_ATTACHMENT_COUNT_LOW');
  if(face.some(item=>item.surface_id!=='skull-surface'||item.containment_measurement?.normalized_ellipsoid_value>1.001))errors.push('FACE_ATTACHMENT_CONTAINMENT_INVALID');
  if(scalp.length<6||scalp.some(item=>item.root_distance_measurement?.root_to_surface_distance>item.root_distance_measurement?.tolerance))errors.push('SCALP_ATTACHMENT_DISTANCE_INVALID');
  if(hair.some(mass=>mass.guide_curves.some(curve=>!curve.connected||curve.points.length<3)))errors.push('HAIR_GUIDE_DISCONNECTED');
  if(garment.length<3||garment.some(item=>item.clearance_measurement?.penetration_depth>0||item.clearance_measurement?.min_clearance<=0))errors.push('GARMENT_ATTACHMENT_INVALID');
  const report={format:'rncs.native-surface-attachment-validation.v0.1',attachment_root:attachments?.attachment_root??null,face_feature_containment_valid:!errors.includes('FACE_ATTACHMENT_CONTAINMENT_INVALID'),scalp_attachment_valid:!errors.includes('SCALP_ATTACHMENT_DISTANCE_INVALID'),hair_root_distance_valid:!errors.includes('HAIR_GUIDE_DISCONNECTED'),garment_attachment_valid:!errors.includes('GARMENT_ATTACHMENT_INVALID'),garment_penetration_valid:garment.every(item=>item.clearance_measurement?.penetration_depth<=0),errors};
  return{...report,valid:errors.length===0,validation_root:rootHash(report)};
}

export function transformAttachment(attachment,boneTransform){
  if(!boneTransform)return attachment.local_position;
  return transformPoint({position:boneTransform.position??[0,0,0],rotation:boneTransform.rotation??{}},attachment.local_position);
}
