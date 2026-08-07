import {clone,clamp,add3,rootHash,seal,stableId} from './canonical.mjs';
import {buildContinuousMorphologyField,validateMorphologyField} from './morphology-field.mjs';
import {buildCanonicalSurfaceMesh,validateCanonicalSurfaceMesh} from './canonical-surface-mesh.mjs';
import {buildSurfaceAttachmentSet,validateSurfaceAttachmentSet} from './surface-attachments.mjs';
import {buildMorphologyCertificateV2,validateMorphologyCertificateV2,REQUIRED_GATES} from './morphology-certificate-v2.mjs';

const FORMAT='rncs.canonical-morphology-asset.v0.1';
const CERTIFICATE_FORMAT='rncs.morphology-certificate.v0.2';
const CORE_GATES=['proportion_valid','bone_length_valid','joint_limit_valid','surface_continuity_valid','face_surface_valid','feature_attachment_valid','scalp_attachment_valid','hair_overlap_valid','garment_attachment_valid','self_intersection_valid','silhouette_connected','camera_projection_valid'];

const bodyParameter=(genome,id,fallback)=>Number(genome?.morphology_genome?.body_parameters?.[id]??genome?.semantic_morph_graph?.parameters?.find(item=>item.parameter_id===id)?.normalized_value??fallback);
const faceParameter=(genome,id,fallback)=>Number(genome?.identity_genome?.identity_parameters?.[id]??genome?.semantic_morph_graph?.parameters?.find(item=>item.parameter_id===id)?.normalized_value??fallback);
const point=(x,y,z=0)=>[Number(x),Number(y),Number(z)];
const round=value=>Number(Number(value).toFixed(6));
const bone=(id,parent,length,axis,translation,limits={})=>({id,parent,length:round(length),axis:point(...axis),rest_local:{translation:point(...translation),rotation:{pitch:0,yaw:0,roll:0}},local_transform:{translation:point(...translation),rotation:{pitch:0,yaw:0,roll:0}},joint_limits:{pitch:limits.pitch??[-Math.PI/2,Math.PI/2],yaw:limits.yaw??[-Math.PI,Math.PI],roll:limits.roll??[-Math.PI/2,Math.PI/2]}});

export function createMorphologyLawSet(genome,{profile='anime-npr-clean-v0.1'}={}){
  const shoulder=bodyParameter(genome,'body.shoulder_width',.55),headRatio=bodyParameter(genome,'body.head_body_ratio',.52),neck=bodyParameter(genome,'body.neck_length',.54),limb=bodyParameter(genome,'body.limb_ratio',.56),torso=bodyParameter(genome,'body.torso_length',.5),jaw=faceParameter(genome,'face.jaw_width',.52);
  return seal({format:'rncs.morphology-law-set.v0.1',profile,units:'normalized-body',inputs:{shoulder_width:shoulder,head_body_ratio:headRatio,neck_length:neck,limb_ratio:limb,torso_length:torso,jaw_width:jaw},hard_constraints:{minimum_head_unit:.105,maximum_head_unit:.22,minimum_neck_length:.075,maximum_neck_length:.22,minimum_ribcage_height:.12,maximum_ribcage_height:.3,minimum_pelvis_height:.09,maximum_pelvis_height:.22,minimum_limb_length:.11,maximum_limb_length:.32,maximum_body_height:.92,minimum_body_height:.58,maximum_face_feature_depth:.18},anime_stylization_ranges:{head_to_body:[.18,.28],shoulder_to_head:[1.35,2.2],waist_to_shoulder:[.42,.78],hand_to_forearm:[.3,.72],jaw_rounding:[.25,.8]},relational_constraints:['head_center_above_neck_end','neck_end_inside_ribcage_girdle','shoulder_width_greater_than_neck_width','pelvis_width_less_than_shoulder_width','upper_arm_plus_forearm_reaches_below_pelvis','face_features_inside_skull_surface','garment_offset_positive'],symmetry_rules:{default:'bilateral',allowed_asymmetry:['pose','expression','gaze','secondary_motion'],identity_asymmetry_budget:.035},identity_invariants:['character_id','topology_family','identity_root','palette_anchor','face_feature_order','hair_root_topology'],derivation_coefficients:{head_unit_base:.105,head_unit_ratio:.055,shoulder_base:.17,shoulder_ratio:.1,torso_base:.12,torso_ratio:.08,limb_base:.12,limb_ratio:.09,depth_ratio:.45}},'law_root');
}

function projectLawValue(id,requested,min,max,adjustments){
  if(!Number.isFinite(Number(min))||!Number.isFinite(Number(max))||min>max)throw Object.assign(new Error(`MORPHOLOGY_LAW_RANGE_INVALID:${id}`),{code:'MORPHOLOGY_LAW_RANGE_INVALID',id,min,max});
  const solved=clamp(Number(requested),Number(min),Number(max));
  if(Math.abs(solved-Number(requested))>1e-9)adjustments.push({parameter:id,requested:round(requested),solved:round(solved),reason:'relational-law-projection',allowed:{min:round(min),max:round(max)}});
  return solved;
}

function deriveProportionValues(coefficients,inputs){
  const headUnit=coefficients.head_unit_base+inputs.head_ratio*coefficients.head_unit_ratio;
  const headRadiusX=headUnit*(.84+.12*inputs.jaw),headRadiusY=headUnit*(1.02+.08*inputs.head_ratio),headDepth=headUnit*(.75+.18*inputs.head_ratio);
  const shoulderWidth=coefficients.shoulder_base+inputs.shoulder*coefficients.shoulder_ratio;
  const spineLength=coefficients.torso_base+inputs.torso*coefficients.torso_ratio;
  const ribcageHeight=.12+inputs.torso*.07,neckLength=.075+inputs.neck*.045,upperArmLength=coefficients.limb_base+inputs.limb*.09,forearmLength=.115+inputs.limb*.08,handLength=.045+inputs.limb*.025,pelvisHeight=.09+inputs.torso*.045;
  return{headUnit,headRadiusX,headRadiusY,headDepth,shoulderWidth,spineLength,ribcageHeight,neckLength,upperArmLength,forearmLength,handLength,pelvisHeight};
}

function solveRelationalConstraints(raw,lawSet,inputs){
  const ranges=lawSet.anime_stylization_ranges,hard=lawSet.hard_constraints,adjustments=[];
  const values={...raw};
  values.headUnit=projectLawValue('head_unit',values.headUnit,hard.minimum_head_unit,hard.maximum_head_unit,adjustments);
  values.neckLength=projectLawValue('neck_length',values.neckLength,hard.minimum_neck_length,hard.maximum_neck_length??.22,adjustments);
  values.ribcageHeight=projectLawValue('ribcage_height',values.ribcageHeight,hard.minimum_ribcage_height,hard.maximum_ribcage_height??.3,adjustments);
  values.pelvisHeight=projectLawValue('pelvis_height',values.pelvisHeight,hard.minimum_pelvis_height,hard.maximum_pelvis_height??.22,adjustments);
  values.upperArmLength=projectLawValue('upper_arm_length',values.upperArmLength,hard.minimum_limb_length,hard.maximum_limb_length??.32,adjustments);
  values.forearmLength=projectLawValue('forearm_length',values.forearmLength,hard.minimum_limb_length,hard.maximum_limb_length??.32,adjustments);
  values.spineLength=projectLawValue('spine_length',values.spineLength,.1,.25,adjustments);
  const baseHeightWithoutHead=values.pelvisHeight+values.spineLength+values.ribcageHeight+values.neckLength,headScaleY=1.02+.08*inputs.head_ratio,minHeadToBody=ranges.head_to_body[0],requiredHeadUnit=minHeadToBody*baseHeightWithoutHead/(1-minHeadToBody*headScaleY*1.08);
  values.headUnit=projectLawValue('head_unit',Math.max(values.headUnit,requiredHeadUnit),hard.minimum_head_unit,hard.maximum_head_unit,adjustments);
  values.headRadiusX=values.headUnit*(.84+.12*inputs.jaw);
  values.headRadiusY=values.headUnit*(1.02+.08*inputs.head_ratio);
  values.headDepth=values.headUnit*(.75+.18*inputs.head_ratio);
  const headWidth=values.headRadiusX*2;
  values.shoulderWidth=projectLawValue('shoulder_width',values.shoulderWidth,headWidth*ranges.shoulder_to_head[0],headWidth*ranges.shoulder_to_head[1],adjustments);
  values.ribcageWidth=values.shoulderWidth*(1.02+.08*inputs.shoulder);
  values.waistWidth=projectLawValue('waist_width',values.shoulderWidth*(.48+.14*inputs.torso),values.shoulderWidth*ranges.waist_to_shoulder[0],values.shoulderWidth*ranges.waist_to_shoulder[1],adjustments);
  values.pelvisWidth=projectLawValue('pelvis_width',values.shoulderWidth*(.68+.12*inputs.jaw),values.shoulderWidth*.45,values.shoulderWidth*.78,adjustments);
  values.handLength=projectLawValue('hand_length',values.handLength,values.forearmLength*ranges.hand_to_forearm[0],values.forearmLength*ranges.hand_to_forearm[1],adjustments);
  let estimatedHeight=values.pelvisHeight+values.spineLength+values.ribcageHeight+values.neckLength+values.headRadiusY*1.08;
  if(estimatedHeight>hard.maximum_body_height){
    const projectedSpine=Math.max(.1,values.spineLength-(estimatedHeight-hard.maximum_body_height));
    if(projectedSpine!==values.spineLength)adjustments.push({parameter:'spine_length',requested:round(values.spineLength),solved:round(projectedSpine),reason:'body-height-upper-bound',allowed:{min:.1,max:.25}});
    values.spineLength=projectedSpine;
  }
  estimatedHeight=values.pelvisHeight+values.spineLength+values.ribcageHeight+values.neckLength+values.headRadiusY*1.08;
  if(estimatedHeight<hard.minimum_body_height){
    const projectedSpine=Math.min(.25,values.spineLength+(hard.minimum_body_height-estimatedHeight));
    if(projectedSpine!==values.spineLength)adjustments.push({parameter:'spine_length',requested:round(values.spineLength),solved:round(projectedSpine),reason:'body-height-lower-bound',allowed:{min:.1,max:.25}});
    values.spineLength=projectedSpine;
  }
  const shoulderToHead=values.shoulderWidth/headWidth,headToBody=values.headUnit/(values.pelvisHeight+values.spineLength+values.ribcageHeight+values.neckLength+values.headRadiusY*1.08),waistToShoulder=values.waistWidth/values.shoulderWidth,handToForearm=values.handLength/values.forearmLength;
  const relational_measurements={head_to_body:round(headToBody),shoulder_to_head:round(shoulderToHead),waist_to_shoulder:round(waistToShoulder),hand_to_forearm:round(handToForearm),shoulder_width_greater_than_neck_width:values.shoulderWidth>values.headRadiusX*.62,neck_end_inside_ribcage_girdle:values.neckLength<=values.ribcageHeight+values.headRadiusY,upper_arm_plus_forearm_reaches_below_pelvis:values.upperArmLength+values.forearmLength>=values.pelvisHeight+.15,pelvis_width_less_than_shoulder_width:values.pelvisWidth<values.shoulderWidth};
  const violations=[];
  const epsilon=1e-6;
  if(headToBody<ranges.head_to_body[0]-epsilon||headToBody>ranges.head_to_body[1]+epsilon)violations.push('head_to_body');
  if(shoulderToHead<ranges.shoulder_to_head[0]-epsilon||shoulderToHead>ranges.shoulder_to_head[1]+epsilon)violations.push('shoulder_to_head');
  if(waistToShoulder<ranges.waist_to_shoulder[0]-epsilon||waistToShoulder>ranges.waist_to_shoulder[1]+epsilon)violations.push('waist_to_shoulder');
  if(handToForearm<ranges.hand_to_forearm[0]-epsilon||handToForearm>ranges.hand_to_forearm[1]+epsilon)violations.push('hand_to_forearm');
  for(const [id,value] of Object.entries(relational_measurements))if(typeof value==='boolean'&&!value)violations.push(id);
  if(violations.length)throw Object.assign(new Error(`MORPHOLOGY_CONSTRAINTS_UNSATISFIABLE:${violations.join(',')}`),{code:'MORPHOLOGY_CONSTRAINTS_UNSATISFIABLE',violations,measurements:relational_measurements});
  return seal({format:'rncs.morphology-constraint-solution.v0.1',law_root:lawSet.law_root,solver:'deterministic-relational-projection',requested:inputs,solved:{...values},adjustments,measurements:relational_measurements,violations,rejection_policy:'unsatisfiable-relational-laws-reject'},'solution_root');
}

export function solveProportions(genome,lawSet=createMorphologyLawSet(genome)){
  const coefficients=lawSet.derivation_coefficients,inputs={head_ratio:bodyParameter(genome,'body.head_body_ratio',.52),shoulder:bodyParameter(genome,'body.shoulder_width',.55),neck:bodyParameter(genome,'body.neck_length',.54),limb:bodyParameter(genome,'body.limb_ratio',.56),torso:bodyParameter(genome,'body.torso_length',.5),jaw:faceParameter(genome,'face.jaw_width',.52)},raw=deriveProportionValues(coefficients,inputs),constraintSolution=solveRelationalConstraints(raw,lawSet,inputs),solved=constraintSolution.solved;
  const headUnit=solved.headUnit,shoulderWidth=solved.shoulderWidth,spineLength=solved.spineLength,ribcageHeight=solved.ribcageHeight,neckLength=solved.neckLength,upperArmLength=solved.upperArmLength,forearmLength=solved.forearmLength,handLength=solved.handLength,pelvisHeight=solved.pelvisHeight,pelvisWidth=solved.pelvisWidth,ribcageWidth=solved.ribcageWidth,headRadiusX=solved.headRadiusX,headRadiusY=solved.headRadiusY,headDepth=solved.headDepth,shoulderY=pelvisHeight+spineLength+ribcageHeight*.76,ribBaseY=pelvisHeight+spineLength,neckBaseY=pelvisHeight+spineLength+ribcageHeight,headBaseY=neckBaseY+neckLength,height=headBaseY+headRadiusY*1.08;
  const result={format:'rncs.morphology-proportion-solution.v0.2',units:'normalized-body',coordinate_system:{origin:'pelvis-root',up:'positive-y',front:'positive-z'},head_unit:round(headUnit),height:round(height),constraint_solution:constraintSolution,landmarks:{pelvis_root:point(0,0,0),pelvis_center:point(0,pelvisHeight*.5,0),waist:point(0,pelvisHeight+spineLength*.55,0),ribcage_base:point(0,ribBaseY,0),ribcage_center:point(0,ribBaseY+ribcageHeight*.5,0),shoulder_line:point(0,shoulderY,0),neck_base:point(0,neckBaseY,0),head_base:point(0,headBaseY,0),head_center:point(0,headBaseY+headRadiusY*.64,0)},widths:{shoulder:round(shoulderWidth),ribcage:round(ribcageWidth),waist:round(solved.waistWidth),pelvis:round(pelvisWidth),neck:round(headRadiusX*.62)},bone_lengths:{pelvis:round(pelvisHeight),spine:round(spineLength),ribcage:round(ribcageHeight),neck:round(neckLength),clavicle:round(shoulderWidth*.52),upper_arm:round(upperArmLength),forearm:round(forearmLength),hand:round(handLength)},radii:{skull:[round(headRadiusX),round(headRadiusY),round(headDepth)],neck:[round(headRadiusX*.32),round(headRadiusX*.24)],ribcage:[round(ribcageWidth*.5),round(ribcageHeight*.5),round(ribcageWidth*.22)],pelvis:[round(pelvisWidth*.5),round(pelvisHeight*.5),round(ribcageWidth*.2)],upper_arm:round(headRadiusX*.25),forearm:round(headRadiusX*.21),elbow:round(headRadiusX*.28),hand:[round(headRadiusX*.27),round(handLength*.66)]},identity_drivers:{shoulder_width:inputs.shoulder,head_body_ratio:inputs.head_ratio,neck_length:inputs.neck,limb_ratio:inputs.limb,torso_length:inputs.torso,jaw_width:inputs.jaw}};
  return seal(result,'proportion_root');
}

export function buildHierarchicalSkeleton(proportions,lawSet){
  const p=proportions.landmarks,b=proportions.bone_lengths,side=proportions.widths.shoulder*.5;
  const bones=[
    bone('root',null,0,[0,1,0],[0,0,0],{yaw:[-Math.PI,Math.PI]}),
    bone('pelvis','root',b.pelvis,[0,1,0],[0,0,0]),
    bone('spine','pelvis',b.spine,[0,1,0],[0,b.pelvis,0],{roll:[-.25,.25]}),
    bone('ribcage','spine',b.ribcage,[0,1,0],[0,b.spine,0],{roll:[-.3,.3]}),
    bone('clavicle-left','ribcage',b.clavicle,[-1,0,0],[0,b.ribcage*.76,0],{roll:[-.35,.35]}),
    bone('shoulder-left','clavicle-left',0,[0,1,0],[-b.clavicle,0,0],{roll:[-.5,.5]}),
    bone('upper-arm-left','shoulder-left',b.upper_arm,[0,-1,0],[0,0,0],{roll:[-1.75,1.75],yaw:[-.65,.65]}),
    bone('elbow-left','upper-arm-left',0,[0,1,0],[0,-b.upper_arm,0],{roll:[-2.2,2.2]}),
    bone('forearm-left','elbow-left',b.forearm,[0,-1,0],[0,0,0],{roll:[-2.45,2.45],yaw:[-.5,.5]}),
    bone('wrist-left','forearm-left',0,[0,1,0],[0,-b.forearm,0],{roll:[-.7,.7]}),
    bone('hand-left','wrist-left',b.hand,[0,-1,0],[0,0,0],{roll:[-.7,.7]}),
    bone('clavicle-right','ribcage',b.clavicle,[1,0,0],[0,b.ribcage*.76,0],{roll:[-.35,.35]}),
    bone('shoulder-right','clavicle-right',0,[0,1,0],[b.clavicle,0,0],{roll:[-.5,.5]}),
    bone('upper-arm-right','shoulder-right',b.upper_arm,[0,-1,0],[0,0,0],{roll:[-1.75,1.75],yaw:[-.65,.65]}),
    bone('elbow-right','upper-arm-right',0,[0,1,0],[0,-b.upper_arm,0],{roll:[-2.2,2.2]}),
    bone('forearm-right','elbow-right',b.forearm,[0,-1,0],[0,0,0],{roll:[-2.45,2.45],yaw:[-.5,.5]}),
    bone('wrist-right','forearm-right',0,[0,1,0],[0,-b.forearm,0],{roll:[-.7,.7]}),
    bone('hand-right','wrist-right',b.hand,[0,-1,0],[0,0,0],{roll:[-.7,.7]}),
    bone('neck','ribcage',b.neck,[0,1,0],[0,b.ribcage,0],{pitch:[-.6,.6],yaw:[-.65,.65],roll:[-.45,.45]}),
    bone('skull','neck',0,[0,1,0],[0,b.neck,0],{pitch:[-.35,.35],yaw:[-1.45,1.45],roll:[-.35,.35]})
  ];
  return seal({format:'rncs.hierarchical-skeleton.v0.1',root_bone:'root',bone_order:bones.map(item=>item.id),bones,rest_pose:'canonical-neutral',bone_length_source:'Canonical Proportion Solver',joint_transform_policy:'pose-may-change-local-transform-not-length',law_root:lawSet.law_root,landmarks:p},'skeleton_root');
}

function volume(id,boneId,kind,dimensions,localCenter=[0,0,0],extra={}){return{id,bone_id:boneId,kind,dimensions,local_center:point(...localCenter),...extra};}

function scalpPoint(proportions,uv){const [rx,ry,depth]=proportions.radii.skull,u=clamp(uv[0]),v=clamp(uv[1]),theta=(u-.5)*Math.PI*1.65;return point(Math.sin(theta)*rx*.98,ry*(.32+(1-v)*.7),depth*(.5+.5*Math.cos(theta)));}

export function buildMorphologyVolumes(proportions,skeleton){
  const r=proportions.radii,b=proportions.bone_lengths;
  return [volume('pelvis-volume','pelvis','ellipsoid',{radii:r.pelvis},[0,b.pelvis*.5,0]),volume('ribcage-volume','ribcage','superellipsoid',{radii:r.ribcage},[0,b.ribcage*.5,0]),volume('neck-volume','neck','tapered-cylinder',{radius:r.neck,length:b.neck},[0,b.neck*.5,0]),volume('skull-volume','skull','ellipsoid',{radii:r.skull},[0,r.skull[1]*.64,0],{surface:'skull-local'}),volume('deltoid-left','shoulder-left','volume-cap',{radius:r.upper_arm*1.35},[0,0,0]),volume('deltoid-right','shoulder-right','volume-cap',{radius:r.upper_arm*1.35},[0,0,0]),volume('upper-arm-left','upper-arm-left','tapered-capsule',{length:b.upper_arm,radius_top:r.upper_arm*1.15,radius_bottom:r.upper_arm*.9},[0,-b.upper_arm*.5,0]),volume('upper-arm-right','upper-arm-right','tapered-capsule',{length:b.upper_arm,radius_top:r.upper_arm*1.15,radius_bottom:r.upper_arm*.9},[0,-b.upper_arm*.5,0]),volume('elbow-left','elbow-left','blended-volume',{radius:r.elbow,bulge:r.elbow*.36},[0,0,0],{continuity_group:'left-arm'}),volume('elbow-right','elbow-right','blended-volume',{radius:r.elbow,bulge:r.elbow*.36},[0,0,0],{continuity_group:'right-arm'}),volume('forearm-left','forearm-left','tapered-capsule',{length:b.forearm,radius_top:r.upper_arm*.95,radius_bottom:r.forearm},[0,-b.forearm*.5,0]),volume('forearm-right','forearm-right','tapered-capsule',{length:b.forearm,radius_top:r.upper_arm*.95,radius_bottom:r.forearm},[0,-b.forearm*.5,0]),volume('palm-left','hand-left','rounded-wedge',{radii:r.hand},[0,-b.hand*.45,0]),volume('palm-right','hand-right','rounded-wedge',{radii:r.hand},[0,-b.hand*.45,0])].map(item=>({...item,source:'canonical-anatomical-volume-layer'}));
}

export function buildSurfaceTemplates(genome,proportions,lawSet){
  const r=proportions.radii,b=proportions.bone_lengths,w=proportions.widths,p=proportions.landmarks;
  const face={format:'rncs.skull-local-face-surface.v0.1',skull_bone:'skull',origin:[0,r.skull[1]*.64,r.skull[2]*.78],normal:[0,0,1],feature_anchors:{left_brow:point(-r.skull[0]*.48,r.skull[1]*.22,r.skull[2]*.82),right_brow:point(r.skull[0]*.48,r.skull[1]*.22,r.skull[2]*.82),left_eye:point(-r.skull[0]*.42,r.skull[1]*.02,r.skull[2]*.88),right_eye:point(r.skull[0]*.42,r.skull[1]*.02,r.skull[2]*.88),nose_bridge:point(0,-r.skull[1]*.03,r.skull[2]*.92),nose_tip:point(0,-r.skull[1]*.22,r.skull[2]*1.02),mouth_left:point(-r.skull[0]*.34,-r.skull[1]*.35,r.skull[2]*.88),mouth_center:point(0,-r.skull[1]*.37,r.skull[2]*.9),mouth_right:point(r.skull[0]*.34,-r.skull[1]*.35,r.skull[2]*.88),chin:point(0,-r.skull[1]*.62,r.skull[2]*.62)},regions:{brow_surface:'skull-local',eye_sockets:'skull-local',cheek_planes:'skull-local',mouth_plane:'skull-local',jaw:'skull-local',ears:'skull-local'},feature_order:['brow','eye','nose','mouth','jaw'],allowed_depth:[r.skull[2]*.45,r.skull[2]*1.12]};
  const scalpUvs=[[.08,.1],[.25,.02],[.5,0],[.75,.02],[.92,.1],[.04,.55],[.96,.55]],scalp={format:'rncs.scalp-surface.v0.1',skull_bone:'skull',surface_type:'ellipsoid-parametric',tolerance:.008,uv_domain:{u:[0,1],v:[0,1]},anchors:scalpUvs.map((uv,index)=>({id:`scalp-${index}`,uv,local_position:scalpPoint(proportions,uv)})),root_policy:'hair-roots-must-reference-scalp-uv'};
  const torsoSections=[{id:'pelvis',bone_id:'pelvis',local_y:b.pelvis*.42,radius_x:w.pelvis*.5,radius_z:r.pelvis[2]},{id:'waist',bone_id:'spine',local_y:b.spine*.45,radius_x:w.waist*.5,radius_z:r.ribcage[2]*.7},{id:'lower-ribcage',bone_id:'ribcage',local_y:b.ribcage*.12,radius_x:w.ribcage*.5,radius_z:r.ribcage[2]},{id:'upper-ribcage',bone_id:'ribcage',local_y:b.ribcage*.72,radius_x:w.ribcage*.52,radius_z:r.ribcage[2]*1.05}];
  const hair={format:'rncs.scalp-hair-field.v0.1',root_anchors:scalp.anchors.map(anchor=>({anchor_id:anchor.id,surface_coordinates:{surface:'scalp',uv:anchor.uv},local_root:anchor.local_position})),main_masses:[{id:'crown',root_ids:['scalp-0','scalp-1','scalp-2','scalp-3','scalp-4'],local_offsets:[[-.035,.025,0],[-.02,.015,.006],[0,.012,.01],[.02,.015,.006],[.035,.025,0]],silhouette_policy:'surface-following-rounded-mass'},{id:'side-left',root_ids:['scalp-5'],local_offsets:[[-.025,-.025,0],[-.045,-.11,-.01],[-.03,-.19,0]],silhouette_policy:'surface-following-lock'},{id:'side-right',root_ids:['scalp-6'],local_offsets:[[.025,-.025,0],[.045,-.11,-.01],[.03,-.19,0]],silhouette_policy:'surface-following-lock'}],secondary_motion:{space:'scalp-local',max_root_displacement:.006,max_angle_deg:7,root_preservation:true}};
  const garment={format:'rncs.garment-offset-surface.v0.1',body_surface:'torso-sections',offset:.012,panels:[{id:'coat-front',anchor_ids:torsoSections.map(item=>item.id),layer:1,overlap:'collar-over-ribcage'},{id:'coat-sleeve-left',anchor_ids:['shoulder-left','upper-arm-left','forearm-left'],layer:1,overlap:'sleeve-over-skin'},{id:'coat-sleeve-right',anchor_ids:['shoulder-right','upper-arm-right','forearm-right'],layer:1,overlap:'sleeve-over-skin'}],secondary_deformation:{space:'body-local',breath_weight:.35,pose_weight:.65}};
  return{format:'rncs.canonical-surface-template-set.v0.1',coordinate_system:proportions.coordinate_system,torso_sections:torsoSections,face_surface:face,scalp_surface:scalp,hair_field:hair,garment_surface:garment,law_root:lawSet.law_root,genome_root:genome.genome_root,landmark_policy:{source:'proportion-solver',snapshot:{...p}}};
}

function certificateFor(asset,options={}){return buildMorphologyCertificateV2(asset,options);}

export function validateMorphologyCertificate(certificate){
  if(certificate?.format===CERTIFICATE_FORMAT)return validateMorphologyCertificateV2(certificate);
  const gates=certificate?.gates??{},failures=[...new Set([...(certificate?.failures??[]),...CORE_GATES.filter(key=>gates[key]!==true)])];
  return{valid:Boolean(certificate&&failures.length===0),failures,gates};
}

export function compileMorphology(genome,morphologyProfile={}){
  if(!genome?.genome_root)throw Object.assign(new Error('MORPHOLOGY_GENOME_REQUIRED'),{code:'MORPHOLOGY_GENOME_REQUIRED'});
  const lawSet=createMorphologyLawSet(genome,morphologyProfile),proportions=solveProportions(genome,lawSet),skeleton=buildHierarchicalSkeleton(proportions,lawSet),volumes=buildMorphologyVolumes(proportions,skeleton),surfaceTemplates=buildSurfaceTemplates(genome,proportions,lawSet),continuousMorphologyField=buildContinuousMorphologyField({proportions,skeleton,volumes,genome_root:genome.genome_root,law_root:lawSet.law_root}),fieldValidation=validateMorphologyField(continuousMorphologyField);
  if(!fieldValidation.valid)throw Object.assign(new Error(`MORPHOLOGY_FIELD_REJECTED:${fieldValidation.errors.join(',')}`),{code:'MORPHOLOGY_FIELD_REJECTED',fieldValidation});
  const meshProfile=morphologyProfile.surface_resolution??'property',canonicalSurfaceMesh=meshProfile==='none'?null:buildCanonicalSurfaceMesh({field:continuousMorphologyField,profile:meshProfile}),meshValidation=canonicalSurfaceMesh?validateCanonicalSurfaceMesh(canonicalSurfaceMesh):{valid:false,errors:['MESH_BUILD_DEFERRED'],mesh_root:null};
  if(canonicalSurfaceMesh&&!meshValidation.valid)throw Object.assign(new Error(`MORPHOLOGY_MESH_REJECTED:${meshValidation.errors.join(',')}`),{code:'MORPHOLOGY_MESH_REJECTED',meshValidation});
  const baseWithoutAttachments={format:FORMAT,version:'0.1.0-alpha.1',character_id:genome.character_id,genome_root:genome.genome_root,identity_root:genome.identity_root,profile:morphologyProfile.profile??'anime-npr-clean-v0.1',law_set:lawSet,proportions,skeleton,volumes,continuous_morphology_field:continuousMorphologyField,field_validation:fieldValidation,canonical_surface_mesh:canonicalSurfaceMesh,mesh_validation:meshValidation,mesh_profile:meshProfile,surface_templates:surfaceTemplates,surfaces:surfaceTemplates,face_surface:surfaceTemplates.face_surface,scalp_surface:surfaceTemplates.scalp_surface,garment_surface:surfaceTemplates.garment_surface,identity_invariants:{character_id:genome.character_id,topology_family:genome.topology_family,genome_root:genome.genome_root,face_feature_order:surfaceTemplates.face_surface.feature_order,hair_root_count:surfaceTemplates.hair_field.root_anchors.length},morphology_root:''};
  const preAttachmentRoot=rootHash(baseWithoutAttachments),surfaceAttachments=buildSurfaceAttachmentSet({...baseWithoutAttachments,morphology_root:preAttachmentRoot}),attachmentValidation=validateSurfaceAttachmentSet(surfaceAttachments,{asset:{...baseWithoutAttachments,morphology_root:preAttachmentRoot}});
  if(!attachmentValidation.valid)throw Object.assign(new Error(`MORPHOLOGY_ATTACHMENT_REJECTED:${attachmentValidation.errors.join(',')}`),{code:'MORPHOLOGY_ATTACHMENT_REJECTED',attachmentValidation});
  const base={...baseWithoutAttachments,surface_attachments:surfaceAttachments,attachment_validation:attachmentValidation},assetRoot=rootHash({...base,morphology_root:''}),asset={...base,morphology_root:assetRoot},certificateMode=morphologyProfile.certificate_mode??'canonical',certificateOptions=certificateMode==='property'?{raster_width:32,raster_height:18,validation_mode:'property'}:{},certificate=certificateFor(asset,certificateOptions),sealedAsset={...asset,certificate,certificate_root:certificate.certificate_root};
  const validation=validateMorphologyCertificate(certificate);if(!validation.valid)throw Object.assign(new Error(`MORPHOLOGY_CERTIFICATE_REJECTED:${validation.failures.join(',')}`),{code:'MORPHOLOGY_CERTIFICATE_REJECTED',certificate,validation});
  return sealedAsset;
}

export function applyMorphologyRepair(asset,{region='elbow-left',reason='local-contour-repair'}={}){
  const next=clone(asset),target=next.volumes.find(item=>item.id===region);if(!target)throw Object.assign(new Error(`MORPHOLOGY_REGION_UNKNOWN:${region}`),{code:'MORPHOLOGY_REGION_UNKNOWN'});const baseBulge=Number(target.dimensions.bulge??target.dimensions.radius??.01),bulgeDelta=.016;target.dimensions={...target.dimensions,bulge:baseBulge+bulgeDelta};target.repair={region,reason,local_only:true,base_bulge:baseBulge,bulge_delta:bulgeDelta};next.repair={region,reason,authority:'local-patch',global_continuity_preserved:true,bulge_delta:bulgeDelta};next.morphology_root='';const root=rootHash({...next,morphology_root:'',certificate:undefined,certificate_root:undefined});delete next.certificate;delete next.certificate_root;next.morphology_root=root;const certificate=certificateFor(next);next.certificate=certificate;next.certificate_root=certificate.certificate_root;return next;
}

export function scalpLocalPoint(asset,uv){const skull=asset.proportions.radii.skull;return point(Math.sin((clamp(uv[0])-.5)*Math.PI*1.65)*skull[0]*.98,skull[1]*(.32+(1-clamp(uv[1]))*.7),skull[2]*(.5+.5*Math.cos((clamp(uv[0])-.5)*Math.PI*1.65)));}

export function morphologySummary(asset){return{format:asset.format,character_id:asset.character_id,genome_root:asset.genome_root,morphology_root:asset.morphology_root,certificate_root:asset.certificate_root,law_root:asset.law_set.law_root,skeleton_root:asset.skeleton.skeleton_root,proportion_root:asset.proportions.proportion_root,core_gates:asset.certificate.gates};}
