import {seal} from './canonical.mjs';

export const TARGET_FORMAT='rncs.character-design-target.v0.1';
export const PROFILE_FORMAT='rncs.semantic-morphology-profile.v0.1';

const range=(min,max)=>[Number(min),Number(max)];

export function createCharacterDesignTarget(input={}){
  return seal({
    format:TARGET_FORMAT,
    version:'0.1.0-alpha.1',
    target_id:input.target_id??'lan-tianlin-anime-readable-v0.1',
    authority:'art-direction-target-not-character-identity-authority',
    human_status:input.human_status??'pending',
    silhouette:{
      head_to_shoulder:input.silhouette?.head_to_shoulder??range(.46,.58),
      head_to_torso:input.silhouette?.head_to_torso??range(.30,.46),
      ribcage_to_shoulder:input.silhouette?.ribcage_to_shoulder??range(.72,.88),
      waist_to_shoulder:input.silhouette?.waist_to_shoulder??range(.48,.62),
      pelvis_to_shoulder:input.silhouette?.pelvis_to_shoulder??range(.56,.72),
      neck_to_head:input.silhouette?.neck_to_head??range(.24,.38)
    },
    face:{
      eye_spacing_to_head_width:input.face?.eye_spacing_to_head_width??range(.30,.44),
      eye_width_to_head_width:input.face?.eye_width_to_head_width??range(.085,.14),
      mouth_width_to_head_width:input.face?.mouth_width_to_head_width??range(.24,.36),
      jaw_to_head_width:input.face?.jaw_to_head_width??range(.62,.82),
      vertical_order:['brow','eye','nose','mouth','chin']
    },
    arm:{forearm_to_upper_radius:input.arm?.forearm_to_upper_radius??range(.68,.88),hand_to_forearm_length:input.arm?.hand_to_forearm_length??range(.34,.52)},
    hair:{minimum_mass_count:input.hair?.minimum_mass_count??4,maximum_root_distance:input.hair?.maximum_root_distance??.008,required_roles:['crown','fringe','side-left','side-right']},
    garment:{minimum_panel_count:input.garment?.minimum_panel_count??4,required_roles:['collar','torso','sleeve-left','sleeve-right']},
    readability:{large_form_before_detail:true,decorative_detail_requires_semantic_pass:true,forbidden:['floating-hair-mass','feature-outside-face','torso-single-blob','hand-unreadable-terminal']},
    target_root:''
  },'target_root');
}

export function createSemanticMorphologyProfile(targetInput={}){
  const target=targetInput?.format===TARGET_FORMAT?targetInput:createCharacterDesignTarget(targetInput);
  return seal({
    format:PROFILE_FORMAT,
    version:'0.1.0-alpha.1',
    profile_id:'anime-semantic-young-adult-v0.1',
    target_root:target.target_root,
    morphology_law_overrides:{
      hard_constraints:{minimum_head_unit:.075,maximum_head_unit:.16,minimum_body_height:.62,maximum_body_height:1.02},
      anime_stylization_ranges:{head_to_body:[.135,.19],shoulder_to_head:[1.75,2.15],waist_to_shoulder:[.48,.62],hand_to_forearm:[.34,.52]},
      derivation_coefficients:{head_unit_base:.082,head_unit_ratio:.035,shoulder_base:.20,shoulder_ratio:.12,torso_base:.16,torso_ratio:.12,limb_base:.14,limb_ratio:.10,depth_ratio:.45}
    },
    semantic_refinement:{ribcage_to_shoulder:.80,waist_to_shoulder:.55,pelvis_to_shoulder:.64,neck_to_head:.31,forearm_to_upper_radius:.78},
    region_intents:[
      ['skull_cap','head','primary-silhouette'],['forehead_band','head','face-frame'],['orbital_band','head','feature-readability'],['nose_region','head','depth-cue'],['mouth_region','head','expression'],['jaw_block','head','silhouette'],
      ['neck_column','torso','connection'],['clavicle_band','torso','shoulder-transition'],['ribcage_volume','torso','primary-volume'],['waist_taper','torso','separation'],['pelvis_bowl','torso','support'],
      ['deltoid_mass_left','arm-left','shoulder-transition'],['deltoid_mass_right','arm-right','shoulder-transition'],['upper_arm_taper_left','arm-left','limb-readability'],['upper_arm_taper_right','arm-right','limb-readability'],['forearm_taper_left','arm-left','limb-readability'],['forearm_taper_right','arm-right','limb-readability'],['palm_block_left','hand-left','terminal-readability'],['palm_block_right','hand-right','terminal-readability'],
      ['top_mass','hair','silhouette'],['fringe_mass','hair','face-framing'],['side_mass_left','hair','face-framing'],['side_mass_right','hair','face-framing'],
      ['collar_region','garment','neckline'],['torso_panel','garment','silhouette'],['sleeve_left','garment','arm-readability'],['sleeve_right','garment','arm-readability']
    ].map(([region_id,parent_region,silhouette_role])=>({region_id,parent_region,silhouette_role,priority:'semantic-readability',validation:'measured-before-style'})),
    profile_root:''
  },'profile_root');
}
