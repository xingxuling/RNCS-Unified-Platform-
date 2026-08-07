import {distance2,rootHash} from './canonical.mjs';
import {projectPoint3} from './projection.mjs';

export const GEOMETRIC_TRUTH_METRICS=[
  'projected_head_to_shoulder_ratio','head_to_torso_ratio','neck_to_skull_connectivity','neck_to_ribcage_connectivity',
  'shoulder_symmetry_at_neutral','face_feature_surface_containment','eye_depth_order_under_yaw','nose_depth_relative_to_face',
  'mouth_plane_alignment','hair_root_to_scalp_distance','hair_mass_connected_to_root','hand_to_wrist_connectivity',
  'limb_surface_connected_components','whole_body_connected_components','surface_self_intersection_count',
  'silhouette_disconnected_islands','visible_feature_occlusion_correctness','projected_anatomical_ratio_validity'
];

const finite=value=>Number.isFinite(Number(value));
const finitePoint=value=>Array.isArray(value)&&value.length>=2&&value.every(finite);
const primitiveById=(projected,id)=>(projected?.primitives??[]).find(item=>item.id===id);

function bounds(item){
  if(!item)return null;
  const points=item.points??(item.center?[item.center]:[]);
  if(!points.length)return null;
  const xs=points.map(point=>Number(point[0])).filter(finite),ys=points.map(point=>Number(point[1])).filter(finite);
  if(item.center&&Array.isArray(item.radii)){
    xs.push(Number(item.center[0])-Number(item.radii[0]),Number(item.center[0])+Number(item.radii[0]));
    ys.push(Number(item.center[1])-Number(item.radii[1]),Number(item.center[1])+Number(item.radii[1]));
  }
  if(!xs.length||!ys.length)return null;
  return{left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
}

function metric(name,measurement,allowed,method,evidenceRoot,pass){
  return{metric:name,measurement,allowed,method,evidence_root:evidenceRoot,pass:Boolean(pass)};
}

function missingSurfaceMetric(name,mesh,allowed,method,evidenceRoot){
  return metric(name,{available:Boolean(mesh),value:mesh?undefined:null,required_representation:'canonical_surface_mesh'},allowed,method,evidenceRoot,Boolean(mesh));
}

function ratio(numerator,denominator){return finite(numerator)&&finite(denominator)&&Math.abs(Number(denominator))>1e-9?Number(numerator)/Number(denominator):null;}

function projectedLandmark(pose,projected,id){
  const value=pose?.landmarks?.[id];
  return finitePoint(value)?projectPoint3(value,projected?.camera??{}):null;
}

function ellipsoidContainment(local,[rx,ry,rz],center=[0,0,0]){
  if(!finitePoint(local)||!rx||!ry||!rz)return null;
  const dx=(local[0]-center[0])/rx,dy=(local[1]-center[1])/ry,dz=(local[2]-center[2])/rz;
  return dx*dx+dy*dy+dz*dz;
}

function faceContainment(asset){
  const face=asset?.surface_templates?.face_surface, radii=asset?.proportions?.radii?.skull;
  if(!face||!Array.isArray(radii))return{available:false,contained:0,total:0,ratio:null,values:[]};
  const center=[0,radii[1]*.64,0],values=Object.entries(face.feature_anchors??{}).map(([id,local])=>({id,value:ellipsoidContainment(local,radii,center)}));
  const contained=values.filter(item=>finite(item.value)&&item.value<=1).length;
  return{available:true,contained,total:values.length,ratio:values.length?contained/values.length:null,values};
}

function mouthAlignment(projected){
  const mouth=primitiveById(projected,'mouth-closed')??primitiveById(projected,'mouth-open');
  if(!mouth?.points?.length)return{available:false,deviation:null};
  const ys=mouth.points.map(point=>Number(point[1]));
  const center=ys.reduce((sum,value)=>sum+value,0)/ys.length;
  return{available:true,deviation:Math.max(...ys.map(value=>Math.abs(value-center))),point_count:ys.length};
}

function hairRootMeasurement(asset,geometry){
  const roots=geometry?.surfaces?.scalp_anchors??[],field=asset?.surface_templates?.hair_field;
  const distances=roots.map(root=>({anchor_id:root.anchor_id,distance:0,source:'legacy-contour-root-equals-scalp-anchor'}));
  return{available:Boolean(field&&roots.length),distances,max_distance:distances.length?Math.max(...distances.map(item=>item.distance)):null,root_count:distances.length};
}

function connectivityRepresentation(mesh,field){
  return{mesh_present:Boolean(mesh),field_present:Boolean(field),mesh_root:mesh?.mesh_root??null,field_root:field?.field_root??null};
}

export function measureGeometricTruth({asset,pose,geometry,projected,source_image=null,evidence_root=null}={}){
  const mesh=asset?.canonical_surface_mesh??asset?.canonical_mesh??null,field=asset?.continuous_morphology_field??asset?.anatomical_field??null;
  const root=evidence_root??rootHash({asset_root:asset?.morphology_root??null,pose_root:pose?.pose_root??null,projection_root:projected?.projection_root??null,source_image});
  const head=bounds(primitiveById(projected,'head-surface')),torso=bounds(primitiveById(projected,'garment-coat'));
  const leftShoulder=projectedLandmark(pose,projected,'shoulder_left'),rightShoulder=projectedLandmark(pose,projected,'shoulder_right');
  const shoulderDistance=leftShoulder&&rightShoulder?distance2(leftShoulder,rightShoulder):null;
  const headShoulderRatio=ratio(head?.width,shoulderDistance),headTorsoRatio=ratio(head?.height,torso?.height);
  const shoulderVerticalDelta=leftShoulder&&rightShoulder?Math.abs(leftShoulder[1]-rightShoulder[1]):null;
  const symmetryRatio=ratio(shoulderVerticalDelta,shoulderDistance);
  const containment=faceContainment(asset),mouth=mouthAlignment(projected),hair=hairRootMeasurement(asset,geometry),representation=connectivityRepresentation(mesh,field);
  const noseBridge=geometry?.surfaces?.face_anchors?.nose_bridge,noseTip=geometry?.surfaces?.face_anchors?.nose_tip,mouthCenter=geometry?.surfaces?.face_anchors?.mouth_center;
  const noseDepth=noseBridge&&noseTip&&mouthCenter?{nose_bridge_z:noseBridge[2],nose_tip_z:noseTip[2],mouth_z:mouthCenter[2],tip_minus_bridge:noseTip[2]-noseBridge[2],bridge_minus_mouth:noseBridge[2]-mouthCenter[2]}:{available:false};
  const noseDepthPass=noseDepth.available!==false&&noseDepth.tip_minus_bridge>=.002&&noseDepth.bridge_minus_mouth>=-.02;
  const ratioPass=headShoulderRatio!==null&&headShoulderRatio>=.35&&headShoulderRatio<=.82&&headTorsoRatio!==null&&headTorsoRatio>=.45&&headTorsoRatio<=.74;
  const metrics=[
    metric('projected_head_to_shoulder_ratio',{value:headShoulderRatio,head_width_px:head?.width??null,shoulder_distance_px:shoulderDistance},{min:.35,max:.82},'projected head-surface bounds divided by projected neutral shoulder landmark distance',root,headShoulderRatio!==null&&headShoulderRatio>=.35&&headShoulderRatio<=.82),
    metric('head_to_torso_ratio',{value:headTorsoRatio,head_height_px:head?.height??null,torso_height_px:torso?.height??null},{min:.45,max:.74},'projected head-surface height divided by garment torso bounds height',root,headTorsoRatio!==null&&headTorsoRatio>=.45&&headTorsoRatio<=.74),
    missingSurfaceMetric('neck_to_skull_connectivity',mesh,{required:'one_connected_surface_component'},'canonical mesh adjacency between neck and skull regions',root),
    missingSurfaceMetric('neck_to_ribcage_connectivity',mesh,{required:'one_connected_surface_component'},'canonical mesh adjacency between neck and ribcage regions',root),
    metric('shoulder_symmetry_at_neutral',{vertical_delta_px:shoulderVerticalDelta,separation_px:shoulderDistance,value:symmetryRatio},{max:.02},'neutral projected shoulder vertical delta divided by shoulder separation',root,symmetryRatio!==null&&symmetryRatio<=.02),
    metric('face_feature_surface_containment',containment,{min_ratio:.95,max_normalized_ellipsoid_value:1},'skull-local feature points evaluated against the canonical skull ellipsoid before projection',root,containment.available&&containment.ratio>=.95&&containment.values.every(item=>item.value<=1)),
    metric('eye_depth_order_under_yaw',{visibility_buffer_present:false,eye_depths:[geometry?.surfaces?.face_anchors?.left_eye?.[2]??null,geometry?.surfaces?.face_anchors?.right_eye?.[2]??null]}, {required:'measured_near_eye_and_far_eye'},'VisibilityBuffer and depth comparison under three-quarter yaw',root,Boolean(mesh&&projected?.visibility_buffer)),
    metric('nose_depth_relative_to_face',noseDepth,{tip_minus_bridge_min:.002,bridge_minus_mouth_min:-.02},'world-space face anchor depth ordering before camera projection',root,noseDepthPass),
    metric('mouth_plane_alignment',{...mouth,value:mouth.deviation},{max_deviation_px:4},'maximum mouth feature point deviation from its projected center plane',root,mouth.available&&mouth.deviation<=4),
    metric('hair_root_to_scalp_distance',hair,{max_distance:.008},'distance from each legacy hair root to its paired scalp anchor; a future field must replace this equality proxy',root,hair.available&&hair.max_distance<=.008),
    metric('hair_mass_connected_to_root',{field_present:Boolean(field),root_id_count:asset?.surface_templates?.hair_field?.root_anchors?.length??0,mass_count:asset?.surface_templates?.hair_field?.main_masses?.length??0},{required:'field_root_to_mass_connected_component'},'field topology and mesh adjacency from scalp roots to hair mass',root,Boolean(field&&mesh)),
    missingSurfaceMetric('hand_to_wrist_connectivity',mesh,{required:'hand_and_wrist_in_same_surface_component'},'canonical mesh adjacency from hand region to wrist region',root),
    missingSurfaceMetric('limb_surface_connected_components',mesh,{max_components:2},'connected-component count for left and right limb surface regions',root),
    missingSurfaceMetric('whole_body_connected_components',mesh,{max_components:1},'connected-component count for the full posed canonical surface',root),
    metric('surface_self_intersection_count',{mesh_present:Boolean(mesh),count:mesh?.topology_report?.surface_self_intersection_count??null},{max:0},'triangle-triangle and bounded field overlap checks on the canonical surface',root,Boolean(mesh&&Number(mesh.topology_report?.surface_self_intersection_count??Infinity)<=0)),
    metric('silhouette_disconnected_islands',{visibility_buffer_present:Boolean(projected?.visibility_buffer),islands:projected?.visibility_buffer?.silhouette_disconnected_islands??null},{max:0},'connected components of the visible silhouette mask after depth resolution',root,Boolean(projected?.visibility_buffer&&Number(projected.visibility_buffer.silhouette_disconnected_islands)<=0)),
    metric('visible_feature_occlusion_correctness',{visibility_buffer_present:Boolean(projected?.visibility_buffer),tested_features:['eyes','nose','mouth','hairline']},{required:'depth_and_surface_id_evidence'},'feature visibility compared against DepthBuffer, SurfaceIdBuffer, and RegionIdBuffer',root,Boolean(projected?.visibility_buffer?.feature_occlusion_correctness)),
    metric('projected_anatomical_ratio_validity',{head_to_shoulder:headShoulderRatio,head_to_torso:headTorsoRatio,shoulder_symmetry:symmetryRatio},{head_to_shoulder:[.35,.82],head_to_torso:[.45,.74],shoulder_symmetry:[0,.02]},'aggregate of measured projected anatomy ratios; no style factor is used',root,ratioPass)
  ];
  const red_metrics=metrics.filter(item=>!item.pass).map(item=>item.metric);
  return{format:'rncs.anime-forge-geometric-truth-measurements.v0.1',source:{kind:source_image?'phase6-2-human-rejection-fixture-plus-old-kernel':'old-kernel-output',image:source_image,asset_root:asset?.morphology_root??null,pose_root:pose?.pose_root??null,projection_root:projected?.projection_root??null},representation,metrics,red_metrics,status:red_metrics.length?'red':'green',evidence_root:root,measurement_policy:'missing-geometric-authority-is-a-measured-RED-result'};
}

export function validateGeometricTruthMeasurements(report){
  const errors=[];
  for(const name of GEOMETRIC_TRUTH_METRICS){const item=report?.metrics?.find(metricItem=>metricItem.metric===name);if(!item)errors.push(`METRIC_MISSING:${name}`);else for(const key of ['measurement','allowed','method','evidence_root','pass'])if(!(key in item))errors.push(`METRIC_FIELD_MISSING:${name}:${key}`);}
  if(!report?.evidence_root)errors.push('EVIDENCE_ROOT_MISSING');
  return{valid:errors.length===0,errors,status:report?.status??null,red_metrics:report?.red_metrics??[]};
}
