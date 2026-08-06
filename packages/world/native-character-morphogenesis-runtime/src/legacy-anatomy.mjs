import {createCharacterGenome} from '../../character-genome-runtime/src/index.mjs';
import {clone,clamp,deg,lerp,rootHash,rotateXZ,seal,stableId} from './canonical.mjs';

const FORMAT='rncs.native-character-anatomy-system.v0.1';
const defaultIdentity={
  seed:'lan-tianlin-character-v1',
  name:'Lan Tianlin',
  character_id:'lan-tianlin',
  identity_genome:{age_band:'young-adult',face_profile:'slender-angular',resting_expression:'calm-observant'},
  appearance:{hair_family:'black-wavy-medium',hair_color:'#11151d',eye_color:'#4f86c6',costume_family:'lan-default-v1',emblem_slot:'shenlin-original-v1',palette_family:'deep-blue-black-cool-silver'},
  body_parameters:{'body.shoulder_width':0.55,'body.height':0.58,'body.waist_taper':0.62,'body.leg_length':0.56},
  face_genome:{parameters:{'face.jaw_definition':0.62,'face.eye_spacing':0.48,'face.nose_bridge':0.56,'face.mouth_width':0.51,'face.head_body_ratio':0.58}}
};

const point=(x,y,z=0)=>[Number(x),Number(y),Number(z)];
const sideValue=(side,value)=>side==='left'?-value:value;

function createIdentity(input={}) {
  return createCharacterGenome({...clone(defaultIdentity),...clone(input),appearance:{...defaultIdentity.appearance,...clone(input.appearance??input.appearance_loadout??{})}}, {strict:true});
}

export function createCharacterVisualGenome(genome) {
  const appearance=genome.appearance_loadout??{};
  const data={
    format:'rncs.character-visual-genome.v0.2',
    version:'0.2.0-alpha.1',
    character_id:genome.character_id,
    genome_root:genome.genome_root,
    identity_root:genome.identity_root,
    identity_signature:{character_id:genome.character_id,topology_family:genome.topology_family,face_profile:genome.identity_genome.face_profile,palette_anchor:genome.identity_genome.palette_anchor},
    stable_palette:{skin:'#e7c9b8',hair:appearance.hair_color??'#11151d',ink:'#17202d',coat:'#1c3554',trim:'#c6d7de',eye:appearance.eye_color??'#4f86c6',accent:'#6aa7c6',shadow:'#7e8790'},
    body_proportions:{head_to_body:0.21,shoulder_width:0.44,neck_width:0.105,waist_width:0.24,pelvis_width:0.34,upper_arm_length:0.17,forearm_length:0.16,hand_length:0.085},
    facial_key_features:['balanced_cheek_planes','calm_sharp_eyes','straight_brow','short_nose_bridge','small_closed_mouth','defined_jaw'],
    hair_continuity:{family:appearance.hair_family,scalp_attached:true,primary_masses:3,secondary_locks:4},
    costume_continuity:{family:appearance.costume_family,emblem:appearance.emblem_slot,layered_collar:true},
    expression_states:['neutral','look-left','look-right','mild-concern','alert','blink','mouth-open','mouth-closed'],
    invariant_rules:['character_id_immutable','identity_root_immutable','palette_anchor_stable','face_landmark_order_stable','hair_scalp_attachment_required'],
    provenance:{source:'RNCS Character Genome',provider:'rncs.native-character-morphogenesis',seed:genome.lineage?.seed??null}
  };
  return seal(data,'visual_genome_root');
}

export function createBodySurface(genome,visualGenome) {
  const landmarks={
    head_top:point(0,0.035),brow_line:point(0,0.145),eye_line:point(0,0.175),nose_axis:point(0,0.218),mouth_axis:point(0,0.262),chin:point(0,0.315),
    jaw_left:point(-0.115,0.267),jaw_right:point(0.115,0.267),neck_base:point(0,0.375),clavicle_left:point(-0.175,0.382),clavicle_right:point(0.175,0.382),
    sternum:point(0,0.438),ribcage_center:point(0,0.475),waist:point(0,0.585),pelvis_center:point(0,0.675),
    shoulder_left:point(-0.235,0.395),shoulder_right:point(0.235,0.395),elbow_left:point(-0.305,0.56,0.01),elbow_right:point(0.305,0.56,0.01),
    wrist_left:point(-0.275,0.72,0.02),wrist_right:point(0.275,0.72,0.02),hand_base_left:point(-0.27,0.755,0.03),hand_base_right:point(0.27,0.755,0.03)
  };
  const torsoSections=[
    {id:'shoulder-line',y:0.392,radius:0.24,depth:0.075},
    {id:'upper-ribcage',y:0.445,radius:0.225,depth:0.09},
    {id:'lower-ribcage',y:0.515,radius:0.19,depth:0.075},
    {id:'waist',y:0.585,radius:0.13,depth:0.055},
    {id:'pelvis-top',y:0.64,radius:0.18,depth:0.07},
    {id:'pelvis-base',y:0.715,radius:0.17,depth:0.075}
  ];
  const contourCurves=[
    {id:'head-outline',region:'head',kind:'bezier',points:[point(-.11,.16),point(-.14,.23),point(-.10,.305),point(0,.325),point(.10,.305),point(.14,.23),point(.11,.16)]},
    {id:'neck-left',region:'neck',kind:'bezier',points:[point(-.055,.30),point(-.065,.335),point(-.075,.36),point(-.10,.385)]},
    {id:'neck-right',region:'neck',kind:'bezier',points:[point(.055,.30),point(.065,.335),point(.075,.36),point(.10,.385)]},
    {id:'torso-left',region:'torso',kind:'spline',points:[point(-.24,.392),point(-.225,.47),point(-.19,.535),point(-.13,.585),point(-.18,.715)]},
    {id:'torso-right',region:'torso',kind:'spline',points:[point(.24,.392),point(.225,.47),point(.19,.535),point(.13,.585),point(.18,.715)]},
    {id:'arm-left',region:'upper-arm',kind:'capsule',points:[landmarks.shoulder_left,landmarks.elbow_left,landmarks.wrist_left]},
    {id:'arm-right',region:'upper-arm',kind:'capsule',points:[landmarks.shoulder_right,landmarks.elbow_right,landmarks.wrist_right]},
    {id:'pelvis',region:'pelvis',kind:'spline',points:[point(-.18,.64),point(-.21,.685),point(-.17,.735),point(0,.755),point(.17,.735),point(.21,.685),point(.18,.64)]}
  ];
  const surface={
    surface_format:'rncs.character-body-surface',version:'2.0.0-alpha.1',character_id:genome.character_id,visual_genome_root:visualGenome.visual_genome_root,
    coordinate_system:{name:'canonical-body',units:'normalized-body',origin:'pelvis-center',up:'positive-y',front:'positive-z'},
    body_landmarks:landmarks,contour_curves:contourCurves,silhouette_segments:['head','hair','neck','shoulder-girdle','torso','pelvis','upper-arm-left','upper-arm-right','forearm-left','forearm-right','hand-left','hand-right'],
    torso_surface:{method:'cross-section-spline',cross_sections:torsoSections,ribcage:{center:point(0,.475,.02),width:.225,height:.16,depth:.09},waist_narrowing:.42,twist_axis:'sternum-to-pelvis'},
    shoulder_caps:{left:{center:point(-.235,.4),radius:.065,blend_to:'clavicle-left'},right:{center:point(.235,.4),radius:.065,blend_to:'clavicle-right'},girdle_width:.48},
    upper_arm_surface:{left:{length:.18,radius_top:.052,radius_bottom:.044,soft_region:'deltoid'},right:{length:.18,radius_top:.052,radius_bottom:.044,soft_region:'deltoid'},method:'continuous-capsule-spline'},
    elbow_envelopes:{left:{center:landmarks.elbow_left,radius:.058,bulge:.022,blend_frames:6},right:{center:landmarks.elbow_right,radius:.058,bulge:.022,blend_frames:6},volume_preservation:.92},
    forearm_surface:{left:{length:.16,radius_top:.045,radius_bottom:.034},right:{length:.16,radius_top:.045,radius_bottom:.034},method:'tapered-capsule-spline'},
    wrist_transition:{radius:.032,blend:'cubic',line_continuity:true},
    hand_surface:{left:{palm_center:point(-.275,.755,.03),palm_width:.065,palm_length:.075,thumb_angle:-.65,finger_block_count:3},right:{palm_center:point(.275,.755,.03),palm_width:.065,palm_length:.075,thumb_angle:.65,finger_block_count:3},states:['open','relaxed','mild-tense'],angle_aware:true},
    neck_surface:{left:[point(-.055,.30),point(-.085,.365),point(-.12,.405)],right:[point(.055,.30),point(.085,.365),point(.12,.405)],depth:.06,shoulder_blend:true},
    head_surface:{method:'ellipsoid-with-cheek-planes',skull_center:point(0,.19,.015),radius_x:.145,radius_y:.16,depth:.13,jaw_width:.23,cheek_plane_left:point(-.085,.235,.10),cheek_plane_right:point(.085,.235,.10)},
    pelvis_surface:{method:'belted-ellipsoid',center:point(0,.68,-.005),width:.36,height:.12,depth:.075,hip_blend:true},
    deformation_regions:[{id:'neck-soft',type:'soft',weights:['neck','clavicle']},{id:'shoulder-cap',type:'soft',weights:['deltoid','girdle']},{id:'elbow-envelope-left',type:'soft',weights:['upper-arm-left','forearm-left']},{id:'elbow-envelope-right',type:'soft',weights:['upper-arm-right','forearm-right']},{id:'torso-twist',type:'soft',weights:['ribcage','waist','pelvis']},{id:'hand-palm',type:'soft',weights:['wrist','palm']}],
    rigid_regions:['skull-frame','sternum-emblem','palm-core'],soft_regions:['cheeks','neck','shoulder-caps','elbows','waist','hips','hair-locks'],
    overlap_rules:[{front:'face',behind:'back-hair',condition:'head-depth'},{front:'bangs',behind:'face',condition:'hairline-occlusion'},{front:'forearm',behind:'upper-arm',condition:'elbow-bend'},{front:'hand',behind:'forearm',condition:'wrist-transition'}],
    style_bindings:{contour:'stable-ink-after-surface',cel_bands:'three-band-after-surface',face:'canonical-feature-simplification',hair:'mass-first-highlight-second'},
    provenance:{source:'RNCS Character Genome',genome_root:genome.genome_root,visual_genome_root:visualGenome.visual_genome_root}
  };
  return seal(surface,'body_surface_root');
}

export function createFaceRig(genome,visualGenome,bodySurface) {
  const data={
    rig_format:'rncs.character-face-rig',version:'2.0.0-alpha.1',character_id:genome.character_id,visual_genome_root:visualGenome.visual_genome_root,body_surface_root:bodySurface.body_surface_root,
    skull_frame:{center:point(0,.19,.015),axis_x:point(1,0,0),axis_y:point(0,1,0),axis_z:point(0,0,1),radius_x:.145,radius_y:.16},
    face_plane:{origin:point(0,.19,.125),normal:point(0,0,1),width:.22,height:.22},
    brow_line:{left:point(-.083,.15,.132),center:point(0,.145,.135),right:point(.083,.15,.132)},
    eye_line:{left:point(-.06,.178,.137),center:point(0,.175,.14),right:point(.06,.178,.137)},
    eye_socket_left:{center:point(-.06,.178,.14),width:.062,height:.032},eye_socket_right:{center:point(.06,.178,.14),width:.062,height:.032},
    pupil_anchor_left:point(-.06,.178,.154),pupil_anchor_right:point(.06,.178,.154),nose_bridge:[point(0,.175,.14),point(0,.215,.17)],nose_tip:point(0,.225,.183),
    mouth_axis:{left:point(-.052,.26,.145),center:point(0,.262,.15),right:point(.052,.26,.145)},upper_lip_curve:[point(-.052,.26,.145),point(0,.253,.155),point(.052,.26,.145)],lower_lip_curve:[point(-.052,.264,.145),point(0,.273,.15),point(.052,.264,.145)],
    jaw_curve:[point(-.11,.245,.105),point(-.09,.285,.11),point(0,.315,.11),point(.09,.285,.11),point(.11,.245,.105)],cheek_plane_left:[point(-.11,.205,.105),point(-.075,.235,.13),point(-.06,.275,.12)],cheek_plane_right:[point(.11,.205,.105),point(.075,.235,.13),point(.06,.275,.12)],
    ear_anchor_left:point(-.13,.22,.02),ear_anchor_right:point(.13,.22,.02),hairline:[point(-.125,.125,.06),point(-.06,.115,.105),point(0,.108,.13),point(.06,.115,.105),point(.125,.125,.06)],
    face_projection_rules:{space:'canonical-face-local',yaw_range_deg:[-78,78],pitch_range_deg:[-18,18],eye_visibility:'cosine-with-near-eye-priority',nose_depth:'bridge-and-tip',mouth_axis:'preserve-horizontal-order',cheek_volume:'ellipsoid-plane-blend'},
    anime_simplification_rules:{eye_shape:'almond-with-socket',nose:'bridge-plus-tip',mouth:'curve-or-viseme-aperture',jaw:'continuous-curve',minimum_feature_separation_px:4},
    viseme_bindings:{closed:{aperture:0,width:1},a:{aperture:.42,width:1.05},i:{aperture:.24,width:1.1},o:{aperture:.58,width:.92},u:{aperture:.48,width:.9},e:{aperture:.3,width:1.04}},
    expression_bindings:{neutral:{brow:0,mouth:0,cheek:0},'look-left':{brow:0,mouth:0,cheek:.02},'look-right':{brow:0,mouth:0,cheek:.02},'mild-concern':{brow:.16,mouth:.04,cheek:-.02},alert:{brow:.3,mouth:.07,cheek:.04},blink:{brow:0,mouth:0,cheek:0}},
    provenance:{source:'Character Body Surface 2.0',genome_root:genome.genome_root,body_surface_root:bodySurface.body_surface_root}
  };
  return seal(data,'face_rig_root');
}

export function createHairTopology(genome,visualGenome,faceRig) {
  const data={
    topology_format:'rncs.character-hair-topology',version:'2.0.0-alpha.1',character_id:genome.character_id,visual_genome_root:visualGenome.visual_genome_root,face_rig_root:faceRig.face_rig_root,
    scalp_anchors:[point(-.11,.135,.04),point(-.07,.115,.09),point(0,.105,.115),point(.07,.115,.09),point(.11,.135,.04),point(-.12,.205,.03),point(.12,.205,.03)],
    hairline_curve:[point(-.125,.13,.06),point(-.06,.112,.105),point(0,.105,.125),point(.06,.112,.105),point(.125,.13,.06)],
    main_hair_masses:[{id:'crown-mass',attach:'scalp-0..4',shape:'rounded-cap',silhouette:[point(-.15,.17,.0),point(-.16,.075,.0),point(-.08,.025,.01),point(0,.01,.02),point(.08,.025,.01),point(.16,.075,.0),point(.15,.17,.0)]},{id:'back-mass',attach:'scalp-0..6',shape:'rounded-curtain',silhouette:[point(-.16,.14,-.02),point(-.18,.28,-.015),point(-.12,.36,-.01),point(0,.38,-.005),point(.12,.36,-.01),point(.18,.28,-.015),point(.16,.14,-.02)]}],
    front_bangs_groups:[{id:'bang-left',attach:'scalp-1..2',shape:'soft-taper',points:[point(-.105,.112,.14),point(-.058,.105,.15),point(-.045,.155,.145),point(-.078,.168,.135)]},{id:'bang-center',attach:'scalp-2',shape:'soft-taper',points:[point(-.035,.105,.15),point(-.012,.102,.17),point(.012,.15,.17),point(.035,.11,.145)]},{id:'bang-right',attach:'scalp-2..3',shape:'soft-taper',points:[point(.035,.11,.145),point(.062,.105,.15),point(.08,.155,.145),point(.095,.115,.14)]}],
    side_locks:[{id:'side-left',attach:'scalp-5',points:[point(-.13,.16,.04),point(-.18,.23,.02),point(-.15,.34,.0),point(-.105,.285,.04)]},{id:'side-right',attach:'scalp-6',points:[point(.13,.16,.04),point(.18,.23,.02),point(.15,.34,.0),point(.105,.285,.04)]}],
    back_hair_groups:[{id:'back-left',attach:'scalp-0..2',silhouette:[point(-.15,.16,-.02),point(-.19,.25,-.02),point(-.15,.37,-.01),point(-.05,.35,0),point(-.09,.2,.02)]},{id:'back-right',attach:'scalp-2..4',silhouette:[point(.15,.16,-.02),point(.19,.25,-.02),point(.15,.37,-.01),point(.05,.35,0),point(.09,.2,.02)]}],
    silhouette_curves:['crown-mass','back-mass','side-left','side-right','bang-left','bang-center','bang-right'],
    overlap_order:['back-mass','back-left','back-right','head','side-left','side-right','face','bang-left','bang-center','bang-right','hair-highlight'],
    motion_chains:[{id:'side-lock-left',parent:'scalp-5',lag:.16,max_angle_deg:9,collision:'face-clearance'},{id:'side-lock-right',parent:'scalp-6',lag:.16,max_angle_deg:9,collision:'face-clearance'},{id:'bangs',parent:'scalp-1..3',lag:.09,max_angle_deg:5,collision:'forehead-only'},{id:'back-mass',parent:'scalp-0..6',lag:.2,max_angle_deg:7,collision:'body-clearance'}],
    lag_constraints:{max_frame_delta:8,max_screen_displacement:.035,settle_frames:12},collision_or_face_avoidance:{face_clearance:.018,eye_clearance:.012,mouth_clearance:.01,scalp_attachment_required:true},style_law_bindings:{mass:'rounded-anime-mass',line:'stable-contour',highlight:'single-following-band'},highlight_regions:['crown-left','bang-center-edge','side-lock-edge'],
    provenance:{source:'Face Rig 2.0 scalp anchors',genome_root:genome.genome_root,face_rig_root:faceRig.face_rig_root}
  };
  return seal(data,'hair_topology_root');
}

export function createJointDeformation(bodySurface) {
  const joints=['neck','shoulder-left','shoulder-right','elbow-left','elbow-right','wrist-left','wrist-right'];
  const data={format:'rncs.joint-deformation-graph',version:'2.0.0-alpha.1',body_surface_root:bodySurface.body_surface_root,joints:joints.map(joint_id=>({joint_id,parent_segment:joint_id.startsWith('elbow')?'upper-arm':joint_id.startsWith('wrist')?'forearm':joint_id.startsWith('shoulder')?'ribcage':'torso',child_segment:joint_id.startsWith('elbow')?'forearm':joint_id.startsWith('wrist')?'hand':joint_id.startsWith('shoulder')?'upper-arm':'head',pivot:clone(bodySurface.body_landmarks[`${joint_id.replace('-','_')}`]??[0,.4,0]),bend_range:joint_id==='neck'?[-35,35]:joint_id.startsWith('wrist')?[-40,40]:[-115,115],volume_preservation_rule:{enabled:true,minimum:.88,bulge_weight:joint_id.startsWith('elbow')?.18:.1},contour_blend_rule:{method:'cubic-capsule',blend_frames:6,line_continuity:true},overlap_rule:{front_segment:joint_id.startsWith('wrist')?'hand':'child',behind_segment:'parent',seam_hidden:true},style_simplification_rule:'preserve-silhouette-before-cel-band',repair_rule:{local_only:true,expand_frames:4,root_scope:'joint-region'}})),invariants:['elbow_envelope_nonzero','volume_preservation_ge_0.88','contour_continuity','unaffected_region_preserved'],provenance:{body_surface_root:bodySurface.body_surface_root}};
  return seal(data,'joint_deformation_root');
}

export function createShoulderTorsoPelvis(bodySurface) {
  return seal({format:'rncs.shoulder-torso-pelvis-structure',version:'2.0.0-alpha.1',body_surface_root:bodySurface.body_surface_root,clavicle_layer:{left:bodySurface.body_landmarks.clavicle_left,right:bodySurface.body_landmarks.clavicle_right,depth:.105},shoulder_girdle:{center:bodySurface.body_landmarks.ribcage_center,width:.48,rotation_coupling:.36},ribcage_volume:bodySurface.torso_surface.ribcage,waist_narrowing:bodySurface.torso_surface.waist_narrowing,pelvis_base:bodySurface.pelvis_surface,torso_twist_relation:{sternum_to_pelvis:true,max_degrees:18,weight_transfer:.42},transitions:['neck-to-clavicle','clavicle-to-shoulder-cap','shoulder-to-ribcage','ribcage-to-waist','waist-to-pelvis'],provenance:{body_surface_root:bodySurface.body_surface_root}},'shoulder_torso_pelvis_root');
}

export function createHandAbstraction(bodySurface) {
  return seal({format:'rncs.hand-abstraction',version:'1.0.0-alpha.1',body_surface_root:bodySurface.body_surface_root,states:{open:{palm:.8,thumb:.9,finger_spread:.7},relaxed:{palm:.9,thumb:.65,finger_spread:.28},'mild-tense':{palm:1,thumb:.8,finger_spread:.12}},geometry:{palm_mass:'rounded-quad',thumb_indication:'tapered-wedge',finger_block_simplification:'three-ridged-fan',minimum_finger_separation:.008},angle_rules:{front:'fan-visible',three_quarter:'near-finger-priority',side:'thumb-and-palm-priority'},provenance:{body_surface_root:bodySurface.body_surface_root}},'hand_abstraction_root');
}

export function createAnatomySystem(input={}) {
  const genome=createIdentity(input),visualGenome=createCharacterVisualGenome(genome),bodySurface=createBodySurface(genome,visualGenome),faceRig=createFaceRig(genome,visualGenome,bodySurface),hairTopology=createHairTopology(genome,visualGenome,faceRig),shoulderTorsoPelvis=createShoulderTorsoPelvis(bodySurface),jointDeformation=createJointDeformation(bodySurface),handAbstraction=createHandAbstraction(bodySurface);
  const system={format:FORMAT,version:'0.1.0-alpha.1',character_id:genome.character_id,genome_root:genome.genome_root,character_identity_root:genome.identity_root,visual_genome_root:visualGenome.visual_genome_root,body_surface_root:bodySurface.body_surface_root,face_rig_root:faceRig.face_rig_root,hair_topology_root:hairTopology.hair_topology_root,shoulder_torso_pelvis_root:shoulderTorsoPelvis.shoulder_torso_pelvis_root,joint_deformation_root:jointDeformation.joint_deformation_root,hand_abstraction_root:handAbstraction.hand_abstraction_root,genome,visual_genome:visualGenome,body_surface:bodySurface,face_rig:faceRig,hair_topology:hairTopology,shoulder_torso_pelvis:shoulderTorsoPelvis,joint_deformation:jointDeformation,hand_abstraction:handAbstraction,anatomy_system_root:''};
  return seal(system,'anatomy_system_root');
}

const viewYaw={front:0,'three-quarter-left':-34,'three-quarter-right':34,side:78,'head-turn':28,'shoulder-turn':22,'elbow-bend':0};
const poseModes={neutral:{body_yaw:0,head_yaw:0,left_elbow:-8,right_elbow:8,weight:.5,expression:'neutral'},alert:{body_yaw:0,head_yaw:8,left_elbow:-12,right_elbow:12,weight:.46,expression:'alert'},action:{body_yaw:-8,head_yaw:18,left_elbow:-42,right_elbow:24,weight:.37,expression:'mild-concern'}};

function worldFromBody(pointValue,bodyYaw) { return rotateXZ(pointValue,bodyYaw); }
function add(a,b) { return [a[0]+b[0],a[1]+b[1],(a[2]??0)+(b[2]??0)]; }
function faceWorld(headCenter,local,headYaw,bodyYaw) { return add(headCenter,worldFromBody(rotateXZ(local,headYaw),bodyYaw)); }

export function poseForFrame(system,{view='front',pose='neutral',frame=0,totalFrames=120}={}) {
  const progress=clamp(totalFrames<=1?0:Number(frame)/Number(totalFrames-1)),mode=poseModes[pose]??poseModes.neutral,shotRise=clamp((progress-.18)/.34),settle=clamp((progress-.72)/.28),breathing=Math.sin(progress*Math.PI*5)*.004,turn=mode.body_yaw+Math.sin(progress*Math.PI*2)*3,viewAngle=deg(viewYaw[view]??0),headTurn=deg(mode.head_yaw+(view==='head-turn'?28*Math.sin(progress*Math.PI):0)+(view==='front'?12*shotRise:0));
  const headCenter=worldFromBody(point(0,.19+breathing,0.02),turn),shoulderLeft=worldFromBody(point(-.235,.4,0),turn),shoulderRight=worldFromBody(point(.235,.4,0),turn),ribcage=worldFromBody(point(0,.475,.02),turn),waist=worldFromBody(point(0,.585,0),turn),pelvis=worldFromBody(point(0,.68,0),turn);
  const actionLift=pose==='action'?shotRise*.07:0, leftElbow=worldFromBody(point(-.30,.56-actionLift,.015),turn),rightElbow=worldFromBody(point(.30,.56-actionLift*.3,.015),turn);
  const leftWrist=worldFromBody(point(-.27,.72-actionLift*.75,.025),turn),rightWrist=worldFromBody(point(.27,.72-actionLift*.32,.025),turn);
  const localFaceAnchors={left_eye:point(-.06,-.012,.12),right_eye:point(.06,-.012,.12),left_brow:point(-.06,-.04,.115),right_brow:point(.06,-.04,.115),nose_bridge:point(0,.018,.135),nose_tip:point(0,.045,.16),mouth_left:point(-.052,.075,.125),mouth_center:point(0,.077,.13),mouth_right:point(.052,.075,.125),chin:point(0,.13,.08)};
  const face={head_center:headCenter,head_yaw:headTurn,local_anchors:localFaceAnchors,anchors:Object.fromEntries(Object.entries(localFaceAnchors).map(([name,local])=>[name,faceWorld(headCenter,local,headTurn,turn)])),expression:mode.expression,gaze:view==='three-quarter-left'?'left':view==='three-quarter-right'?'right':view==='head-turn'?'right':'center',blink:pose==='action'&&frame%37===0,mouth:pose==='action'&&frame%19<7?'o':'closed'};
  const secondary={hair_lag:Math.sin(progress*Math.PI*2+1)*.012+((pose==='action'?shotRise:0)*.018),costume_lag:Math.sin(progress*Math.PI*2)*.008,breath:breathing,overshoot:settle<1?Math.sin((settle)*Math.PI)*.01:0};
  const root=stableId('pose',{system:system.anatomy_system_root,frame,view,pose});
  return {format:'rncs.native-character-pose.v0.1',frame,total_frames:totalFrames,view,pose,progress,body_yaw:turn,view_yaw:viewAngle,head_yaw:headTurn,weight_shift:lerp(mode.weight,.5,settle),landmarks:{head_center:headCenter,shoulder_left:shoulderLeft,shoulder_right:shoulderRight,ribcage_center:ribcage,waist,pelvis_center:pelvis,elbow_left:leftElbow,elbow_right:rightElbow,wrist_left:leftWrist,wrist_right:rightWrist,hand_base_left:leftWrist,hand_base_right:rightWrist},segments:{left_upper_arm:[shoulderLeft,leftElbow],right_upper_arm:[shoulderRight,rightElbow],left_forearm:[leftElbow,leftWrist],right_forearm:[rightElbow,rightWrist]},face,secondary,skeleton:{root:pelvis,spine:[pelvis,waist,ribcage],neck:[ribcage,headCenter],head:headCenter},joint_angles:{'elbow-left':mode.left_elbow+(pose==='action'?shotRise*28:0),'elbow-right':mode.right_elbow,'shoulder-left':pose==='action'?shotRise*22:0,'shoulder-right':pose==='action'?shotRise*8:0},pose_root:root};
}

export function projectPoint(pointValue,{width=1280,height=720,cameraYaw=0,scale=1}={}) {
  const rotated=rotateXZ(pointValue,-cameraYaw),depth=rotated[2]??0,perspective=1/(1+depth*.24),x=.5+rotated[0]*1.26*perspective*scale,y=.055+rotated[1]*.9*scale;
  return [Math.round(x*width),Math.round(y*height),depth];
}

export function applyLocalRepair(system,{region='elbow-left',reason='elbow contour continuity'}={}) {
  const next=clone(system),body=clone(next.body_surface),joints=clone(next.joint_deformation);
  const side=region==='elbow-right'?'right':'left';
  const envelope=body.elbow_envelopes[side]??body.elbow_envelopes.left;
  envelope.bulge=Number(envelope.bulge??0)+.016;
  envelope.volume_preservation=.96;
  envelope.repair_reason=reason;
  body.elbow_envelopes[side]=envelope;
  body.deformation_regions=body.deformation_regions.map(item=>item.id===`elbow-envelope-${side}`?{...item,repair:'local-envelope-expanded'}:item);
  body.body_surface_root='';
  next.body_surface=seal(body,'body_surface_root');
  joints.body_surface_root=next.body_surface.body_surface_root;
  joints.joints=joints.joints.map(item=>item.joint_id===region?{...item,volume_preservation_rule:{...item.volume_preservation_rule,minimum:.94},repair_rule:{...item.repair_rule,applied:true,reason}}:item);
  joints.joint_deformation_root='';
  next.joint_deformation=seal(joints,'joint_deformation_root');
  next.body_surface_root=next.body_surface.body_surface_root;
  next.joint_deformation_root=next.joint_deformation.joint_deformation_root;
  next.anatomy_system_root='';
  return seal(next,'anatomy_system_root');
}

export function validateAnatomySystem(system) {
  const errors=[],required=['genome_root','character_identity_root','visual_genome_root','body_surface_root','face_rig_root','hair_topology_root','shoulder_torso_pelvis_root','joint_deformation_root','hand_abstraction_root'];for(const key of required)if(!system?.[key])errors.push(`ROOT_MISSING:${key}`);
  const sealed=[['visual_genome','visual_genome_root'],['body_surface','body_surface_root'],['face_rig','face_rig_root'],['hair_topology','hair_topology_root'],['shoulder_torso_pelvis','shoulder_torso_pelvis_root'],['joint_deformation','joint_deformation_root'],['hand_abstraction','hand_abstraction_root']];for(const [name,key] of sealed){const value=system?.[name];if(value&&value[key]!==rootHash({...value,[key]:''}))errors.push(`ROOT_MISMATCH:${name}`);}
  const landmarks=system?.body_surface?.body_landmarks??{};for(const key of ['head_top','brow_line','eye_line','nose_axis','mouth_axis','chin','jaw_left','jaw_right','neck_base','clavicle_left','clavicle_right','sternum','ribcage_center','waist','pelvis_center','shoulder_left','shoulder_right','elbow_left','elbow_right','wrist_left','wrist_right','hand_base_left','hand_base_right'])if(!landmarks[key])errors.push(`LANDMARK_MISSING:${key}`);
  if((system?.hair_topology?.scalp_anchors??[]).length<6)errors.push('SCALP_ANCHORS_INSUFFICIENT');if((system?.face_rig?.viseme_bindings&&Object.keys(system.face_rig.viseme_bindings).length<4))errors.push('VISEME_BINDINGS_INSUFFICIENT');if((system?.joint_deformation?.joints??[]).length<7)errors.push('JOINT_GRAPH_INSUFFICIENT');return{valid:errors.length===0,errors,character_identity_root:system?.character_identity_root??null,body_surface_root:system?.body_surface_root??null,face_rig_root:system?.face_rig_root??null,hair_topology_root:system?.hair_topology_root??null};
}
