import {rootHash,seal} from './canonical.mjs';

const FORMAT='rncs.anime-visual-grammar.v0.2';
const DEFAULT_GRAMMAR={
  format:FORMAT,
  version:'0.2.0-alpha.1',
  profile:'anime-native-geometric-truth-v0.1',
  geometry_precondition:{required:['continuous_morphology_field','canonical_surface_mesh','posed_surface_mesh'],reject_on_missing:true},
  visibility_precondition:{required:['VisibilityBuffer','DepthBuffer','SurfaceIdBuffer','RegionIdBuffer'],reject_on_missing:true},
  outline_policy:{source:'visible-surface-boundaries',method:'surface-id-and-visibility-discontinuity',width_px:2},
  fill_policy:{source:'region-material-and-normal',flat_shading:false,depth_cue:true},
  plane_hierarchy:['background','body-surface','garment-surface','hair-mass','face-feature','surface-outline'],
  face_feature_policy:{binding:'SurfaceAttachment',projection:'camera-after-pose',occlusion:'DepthBuffer-required'},
  hair_policy:{binding:'HairRoot-to-GuideCurve-to-MassEnvelope',root_preservation:true,occlusion:'depth-aware-layer'},
  lighting:{model:'deterministic-normal-ramp',key_direction:[-.35,.55,.74],ambient:.58,contrast:.42},
  depth_cues:{model:'DepthBuffer-and-normal',stylized_fog:false},
  stylization_order:['geometry','surface-continuity','skinning','camera-visibility','depth-cues','palette','outline','feature-ink']
};

export function createAnimeVisualGrammar(input={}){
  const grammar={...DEFAULT_GRAMMAR,...input,geometry_precondition:{...DEFAULT_GRAMMAR.geometry_precondition,...input.geometry_precondition},visibility_precondition:{...DEFAULT_GRAMMAR.visibility_precondition,...input.visibility_precondition},outline_policy:{...DEFAULT_GRAMMAR.outline_policy,...input.outline_policy},fill_policy:{...DEFAULT_GRAMMAR.fill_policy,...input.fill_policy},face_feature_policy:{...DEFAULT_GRAMMAR.face_feature_policy,...input.face_feature_policy},hair_policy:{...DEFAULT_GRAMMAR.hair_policy,...input.hair_policy},lighting:{...DEFAULT_GRAMMAR.lighting,...input.lighting},depth_cues:{...DEFAULT_GRAMMAR.depth_cues,...input.depth_cues}};
  return seal(grammar,'grammar_root');
}

export function validateAnimeVisualGrammar(grammar){
  const errors=[];
  if(grammar?.format!==FORMAT)errors.push('ANIME_GRAMMAR_FORMAT_INVALID');
  for(const key of ['geometry_precondition','visibility_precondition','face_feature_policy','hair_policy'])if(!grammar?.[key])errors.push(`ANIME_GRAMMAR_FIELD_MISSING:${key}`);
  if(grammar?.stylization_order?.indexOf('camera-visibility')<0||grammar?.stylization_order?.indexOf('palette')<0)errors.push('ANIME_GRAMMAR_STYLE_ORDER_INVALID');
  if((grammar?.stylization_order?.indexOf('camera-visibility')??0)>(grammar?.stylization_order?.indexOf('palette')??0))errors.push('ANIME_GRAMMAR_STYLE_BEFORE_VISIBILITY');
  return{valid:errors.length===0,errors,grammar_root:grammar?.grammar_root??null};
}

export {DEFAULT_GRAMMAR};
