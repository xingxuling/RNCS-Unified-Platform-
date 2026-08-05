import {clone,rootHash,seal} from '../../reality-asset-genesis-fabric/src/canonical.mjs';

export const CHARACTER_GENOME_FORMAT='rncs.character-genome.v0.1';
export const CHARACTER_GENOME_VERSION='0.1.0-alpha.1';
export const SEMANTIC_MORPH_GRAPH_FORMAT='rncs.character-semantic-morph-graph.v0.1';
export const IDENTITY_SIGNATURE_FORMAT='rncs.character-identity-signature.v0.1';

const face=(id,region,def=.5,options={})=>({
  parameter_id:`face.${id}`,semantic_name:id,region,default:def,safe_min:options.min??.15,safe_max:options.max??.85,
  unit:'normalized',affected_morphs:options.morphs??[id],affected_bones:options.bones??[],dependent_parameters:options.depends??[],
  incompatible_parameters:options.incompatible??[],rebuild_scope:options.scope??['face_mesh','face_normals','face_lod','2d_face_projection','portrait_preview'],
  identity_weight:options.identity_weight??.8,silhouette_weight:options.silhouette_weight??.35,
  media_projection_policy:{native_2d:true,'2.5d':true,'3d-assisted-2d':true,game_runtime:true,closeup:options.closeup??true},
});

export const FACE_PARAMETER_DEFINITIONS=Object.freeze([
  face('face_width','face',.47,{identity_weight:.95,silhouette_weight:.8}),
  face('face_length','face',.56,{identity_weight:.95,silhouette_weight:.8}),
  face('forehead_height','forehead',.52),face('temple_width','temple',.46),
  face('cheek_width','cheek',.43),face('cheek_height','cheek',.55),
  face('jaw_width','jaw',.42,{identity_weight:1,silhouette_weight:.9}),
  face('jaw_angle','jaw',.62,{identity_weight:1,silhouette_weight:.8,depends:['face.jaw_width']}),
  face('jaw_definition','jaw',.62,{identity_weight:1,silhouette_weight:.7,depends:['face.jaw_angle']}),
  face('chin_length','chin',.52),face('chin_width','chin',.42),face('chin_projection','chin',.48),
  face('eye_size','eyes',.48,{min:.22,max:.75}),face('eye_spacing','eyes',.48,{min:.28,max:.7,identity_weight:.95}),
  face('eye_angle','eyes',.56),face('eye_depth','eyes',.48),
  face('brow_height','brows',.5),face('brow_angle','brows',.54),
  face('nose_bridge','nose',.56),face('nose_width','nose',.42),face('nose_length','nose',.5),
  face('mouth_width','mouth',.51,{min:.25,max:.72,depends:['face.jaw_width']}),
  face('upper_lip','mouth',.42,{min:.2,max:.7}),face('lower_lip','mouth',.46,{min:.2,max:.72}),
  face('lip_projection','mouth',.4,{min:.15,max:.68}),face('philtrum_length','mouth',.5),
  face('ear_height','ears',.5),face('ear_angle','ears',.46),
]);

export const BODY_PARAMETER_DEFINITIONS=Object.freeze([
  {parameter_id:'body.head_body_ratio',semantic_name:'head-body ratio',region:'body',default:.52,safe_min:.35,safe_max:.72,unit:'normalized',affected_morphs:['body_head_ratio'],affected_bones:['hips','spine','neck','head'],dependent_parameters:[],incompatible_parameters:[],rebuild_scope:['body_mesh','skeleton','collision','lod','cross_media_projection'],identity_weight:.9,silhouette_weight:1,media_projection_policy:{native_2d:true,'2.5d':true,'3d-assisted-2d':true,game_runtime:true,closeup:false}},
  {parameter_id:'body.shoulder_width',semantic_name:'shoulder width',region:'body',default:.55,safe_min:.28,safe_max:.76,unit:'normalized',affected_morphs:['shoulder_width'],affected_bones:['clavicle_l','clavicle_r'],dependent_parameters:[],incompatible_parameters:[],rebuild_scope:['body_mesh','costume_fit','collision','cross_media_projection'],identity_weight:.82,silhouette_weight:1,media_projection_policy:{native_2d:true,'2.5d':true,'3d-assisted-2d':true,game_runtime:true,closeup:false}},
  {parameter_id:'body.neck_length',semantic_name:'neck length',region:'body',default:.54,safe_min:.28,safe_max:.72,unit:'normalized',affected_morphs:['neck_length'],affected_bones:['neck','head'],dependent_parameters:[],incompatible_parameters:[],rebuild_scope:['body_mesh','skeleton','costume_fit','cross_media_projection'],identity_weight:.65,silhouette_weight:.55,media_projection_policy:{native_2d:true,'2.5d':true,'3d-assisted-2d':true,game_runtime:true,closeup:true}},
  {parameter_id:'body.limb_ratio',semantic_name:'limb ratio',region:'body',default:.56,safe_min:.32,safe_max:.72,unit:'normalized',affected_morphs:['limb_ratio'],affected_bones:['arm_l','arm_r','leg_l','leg_r'],dependent_parameters:[],incompatible_parameters:[],rebuild_scope:['body_mesh','skeleton','collision','retarget','cross_media_projection'],identity_weight:.72,silhouette_weight:.82,media_projection_policy:{native_2d:true,'2.5d':true,'3d-assisted-2d':true,game_runtime:true,closeup:false}},
  {parameter_id:'body.torso_length',semantic_name:'torso length',region:'body',default:.5,safe_min:.3,safe_max:.7,unit:'normalized',affected_morphs:['torso_length'],affected_bones:['hips','spine','chest'],dependent_parameters:[],incompatible_parameters:[],rebuild_scope:['body_mesh','skeleton','collision','costume_fit','cross_media_projection'],identity_weight:.72,silhouette_weight:.8,media_projection_policy:{native_2d:true,'2.5d':true,'3d-assisted-2d':true,game_runtime:true,closeup:false}},
]);

export const EXPRESSION_MORPHS=Object.freeze(['neutral','calm','puzzled','restrained_smile','focused','angry','sad','surprised']);
export const EYE_STATES=Object.freeze(['eye_open','eye_half','eye_closed','blink_left','blink_right','look_up','look_down','look_left','look_right']);
export const VISEME_MORPHS=Object.freeze(['closed','rest','A','I','U','E','O','M_B_P','F_V','L','S_Z','SH_CH','R','N_D_T']);

const providerReceipt=capability=>seal({provider_id:'ragf.character-genome-reference-provider',version:CHARACTER_GENOME_VERSION,mode:'reference-offline',capability,license:'Apache-2.0',authority:'candidate-only',quality:'reference-digital-actor-v0.1'},'receipt_root');
const topology=(id,{headBody,shoulders,body,age='young-adult',status='implemented'})=>seal({
  topology_family_id:id,version:CHARACTER_GENOME_VERSION,status,compatibility_range:{species:['human'],age:[age],media:['native-2d','2.5d','3d-assisted-2d','game-runtime']},
  proportions:{head_body_ratio:headBody,shoulder_scale:shoulders,body_profile:body},supported_morphs:FACE_PARAMETER_DEFINITIONS.map(item=>item.parameter_id),
  supported_rigs:['rncs.anime-humanoid-v0.1'],supported_costumes:['lan-default-v1','urban-field-v1','formal-judge-v1'],
  supported_hair:['black-wavy-medium','short-layered','long-straight','side-swept','high-ponytail','soft-bob'],supported_style_profiles:['anime-tv-reference-v0.1','anime-npr-clean-v0.1'],
  interfaces:{bone_naming:'rncs.anime-humanoid-v0.1',uv:'character-atlas-v0.1',material_slots:['skin','eyes','hair','inner','outer','lower','accessory'],hair_socket:'head',costume_sockets:['chest','hips','hands','feet'],eyes:'paired-sphere-v0.1',mouth:'jaw-mouth-cavity-v0.1',retarget:'rncs.humanoid-retarget-v0.1',collision:'rsr.character-semantic-fixtures.v0.1',lod:'character-identity-preserving-v0.1'},
  provider_receipt:providerReceipt(`topology.${id}`),license:'Apache-2.0',evidence:{definition_root:rootHash({id,headBody,shoulders,body,age,status}),generated_geometry_required:true},family_root:''
},'family_root');

export const TOPOLOGY_FAMILIES=Object.freeze({
  'young-male-slim':topology('young-male-slim',{headBody:7.3,shoulders:.95,body:'lean'}),
  'young-male-standard':topology('young-male-standard',{headBody:7.15,shoulders:1.05,body:'standard'}),
  'young-female-standard':topology('young-female-standard',{headBody:7.05,shoulders:.9,body:'standard'}),
  'youth-standard':topology('youth-standard',{headBody:6.75,shoulders:.84,body:'youth',age:'youth',status:'compatibility-entry'}),
});

export const HAIR_FAMILIES=Object.freeze([
  {id:'black-wavy-medium',label:'Black Wavy Medium',geometry:'layered-wave',segments:7,hairline:'soft-m',secondary_motion:'restrained-medium',compatible_topologies:Object.keys(TOPOLOGY_FAMILIES)},
  {id:'short-layered',label:'Short Layered',geometry:'short-layers',segments:5,hairline:'natural',secondary_motion:'short-stable',compatible_topologies:Object.keys(TOPOLOGY_FAMILIES)},
  {id:'long-straight',label:'Long Straight',geometry:'long-panels',segments:8,hairline:'center-soft',secondary_motion:'long-damped',compatible_topologies:Object.keys(TOPOLOGY_FAMILIES)},
  {id:'side-swept',label:'Side Swept',geometry:'side-sweep',segments:6,hairline:'asymmetric',secondary_motion:'side-damped',compatible_topologies:Object.keys(TOPOLOGY_FAMILIES)},
  {id:'high-ponytail',label:'High Ponytail',geometry:'ponytail',segments:7,hairline:'pulled',secondary_motion:'ponytail-chain',compatible_topologies:['young-male-slim','young-male-standard','young-female-standard']},
  {id:'soft-bob',label:'Soft Bob',geometry:'bob-shell',segments:6,hairline:'soft-round',secondary_motion:'bob-damped',compatible_topologies:['young-female-standard','youth-standard','young-male-slim']},
]);

export const COSTUME_FAMILIES=Object.freeze([
  {id:'lan-default-v1',label:'Lan Modern Long Coat',parts:['inner','outer-long-coat','lower-slim','boots'],cloth_profile:'restrained-long-coat',palette_slots:['base','secondary','trim','emblem'],compatible_topologies:['young-male-slim','young-male-standard']},
  {id:'urban-field-v1',label:'Urban Field Set',parts:['inner','short-jacket','utility-lower','boots'],cloth_profile:'short-jacket',palette_slots:['base','secondary','trim'],compatible_topologies:Object.keys(TOPOLOGY_FAMILIES)},
  {id:'formal-judge-v1',label:'Formal Judge Set',parts:['inner-high-neck','formal-outer','straight-lower','shoes'],cloth_profile:'formal-damped',palette_slots:['base','secondary','trim','emblem'],compatible_topologies:Object.keys(TOPOLOGY_FAMILIES)},
]);

export const PALETTE_FAMILIES=Object.freeze([
  {id:'deep-blue-black-cool-silver',colors:{skin:'#d8c7bd',hair:'#11151d',eye:'#4f86c6',base:'#101827',secondary:'#253653',trim:'#b9c6d8',emblem:'#5d91ce'}},
  {id:'graphite-red-white',colors:{skin:'#d6c2b8',hair:'#17171a',eye:'#985044',base:'#202127',secondary:'#542b31',trim:'#e0e2e5',emblem:'#b75a62'}},
  {id:'forest-black-pale-gold',colors:{skin:'#d8c5b9',hair:'#141914',eye:'#66805b',base:'#15201b',secondary:'#263a31',trim:'#d3c79e',emblem:'#a99552'}},
]);
export const EYE_STYLES=Object.freeze(['calm-sharp','soft-almond','focused-narrow','clear-round']);
export const BROW_STYLES=Object.freeze(['restrained-straight','soft-arc','focused-angle','youth-natural']);
export const EMBLEM_SLOTS=Object.freeze(['shenlin-original-v1','taowind-line-v1','blue-axis-v1']);
export const WEAPON_SLOTS=Object.freeze(['weapon-back-right','weapon-hip-left']);

export function createReferenceCharacterCatalog(){
  return seal({format:'ragf.character-reference-catalog.v0.1',version:CHARACTER_GENOME_VERSION,topologies:clone(TOPOLOGY_FAMILIES),hair:clone(HAIR_FAMILIES),costumes:clone(COSTUME_FAMILIES),palettes:clone(PALETTE_FAMILIES),eyes:[...EYE_STYLES],brows:[...BROW_STYLES],emblems:[...EMBLEM_SLOTS],weapon_slots:[...WEAPON_SLOTS],provider_receipt:providerReceipt('character.reference-catalog'),catalog_root:''},'catalog_root');
}

export function getTopologyFamily(id){return clone(TOPOLOGY_FAMILIES[id]??null)}
export function getHairFamily(id){return clone(HAIR_FAMILIES.find(item=>item.id===id)??null)}
export function getCostumeFamily(id){return clone(COSTUME_FAMILIES.find(item=>item.id===id)??null)}
export function getPaletteFamily(id){return clone(PALETTE_FAMILIES.find(item=>item.id===id)??null)}
