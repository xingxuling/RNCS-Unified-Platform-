import {clone,rootHash,seal,stableId} from '../../reality-asset-genesis-fabric/src/canonical.mjs';
import {CHARACTER_GENOME_FORMAT,CHARACTER_GENOME_VERSION,EXPRESSION_MORPHS,EYE_STATES,VISEME_MORPHS,createReferenceCharacterCatalog,getPaletteFamily,getTopologyFamily} from './catalog.mjs';
import {CharacterGenomeError,assertSolvedCharacterConstraints,createSemanticMorphParameterGraph,solveCharacterConstraints} from './constraints.mjs';

const DEFAULT_APPEARANCE={hair_family:'black-wavy-medium',hair_color:'#11151d',eye_style:'calm-sharp',brow_style:'restrained-straight',eye_color:'#4f86c6',costume_family:'lan-default-v1',accessory:null,weapon_slot:'weapon-back-right',emblem_slot:'shenlin-original-v1',palette_family:'deep-blue-black-cool-silver',costume_variant:'default'};

export function createCharacterGenome(input={},options={}){
  const seed=String(input.seed??input.lineage?.seed??'character-reference-v0.1'),name=String(input.name??input.identity_genome?.name??'Unnamed Actor');
  const topologyFamily=String(input.topology_family??'young-male-slim'),appearance={...DEFAULT_APPEARANCE,...clone(input.appearance_loadout??input.appearance??{})},palette=getPaletteFamily(appearance.palette_family);
  if(!palette)throw new CharacterGenomeError('PALETTE_FAMILY_UNKNOWN',appearance.palette_family);
  const graph=createSemanticMorphParameterGraph({...clone(input.parameters??{}),...clone(input.identity_parameters??{}),...clone(input.body_parameters??{}),...clone(input.face_genome?.parameters??{}),...clone(input.body_genome?.parameters??{})});
  const solved=solveCharacterConstraints(graph,{topologyFamily,hairFamily:appearance.hair_family,costumeFamily:appearance.costume_family,strict:options.strict!==false});
  assertSolvedCharacterConstraints(solved);
  const parameterValues=Object.fromEntries(solved.graph.parameters.map(item=>[item.parameter_id,item.normalized_value])),topology=getTopologyFamily(topologyFamily);
  const characterId=String(input.character_id??stableId('character',{name,seed}));
  const identityGenome={authority:'RNCS Character Genome',character_id:characterId,name,age_band:String(input.identity_genome?.age_band??input.age_band??'young-adult'),species_family:String(input.species_family??'human'),topology_family:topologyFamily,face_profile:String(input.identity_genome?.face_profile??'semantic-parameterized'),resting_expression:String(input.identity_genome?.resting_expression??'calm'),descriptors:clone(input.identity_genome?.descriptors??input.identity_descriptors??{}),identity_parameters:Object.fromEntries(Object.entries(parameterValues).filter(([key])=>key.startsWith('face.'))),immutable_fields:['character_id','species_family','topology_family','identity_parameters'],palette_anchor:String(input.identity_genome?.palette_anchor??appearance.eye_color)};
  const morphologyGenome={body_parameters:Object.fromEntries(Object.entries(parameterValues).filter(([key])=>key.startsWith('body.'))),topology_root:topology.family_root,skeleton_profile:'rncs.anime-humanoid-v0.1',semantic_parameter_graph_root:solved.graph.graph_root};
  const identityRoot=rootHash({identityGenome,morphologyGenome});
  const genome={
    format:CHARACTER_GENOME_FORMAT,version:CHARACTER_GENOME_VERSION,genome_id:String(input.genome_id??stableId('character-genome',{characterId,identityRoot,seed:input.seed??'reference'})),character_id:characterId,species_family:String(input.species_family??'human'),topology_family:topologyFamily,
    authority_layers:{identity:'identity_genome',morphology:'morphology_genome',appearance:'appearance_loadout',state:'state_overlays'},identity_genome:identityGenome,morphology_genome:morphologyGenome,body_genome:{...clone(input.body_genome??{}),parameters:morphologyGenome.body_parameters},face_genome:{...clone(input.face_genome??{}),parameters:identityGenome.identity_parameters},
    semantic_morph_graph:solved.graph,constraint_report:solved.report,identity_root:identityRoot,
    style_genome:{style_profile:String(input.style_genome?.style_profile??'anime-npr-clean-v0.1'),line_profile:String(input.style_genome?.line_profile??'stable-ink-v0.1'),palette:{...clone(palette.colors),hair:appearance.hair_color,eye:appearance.eye_color},material_language:String(input.style_genome?.material_language??'anime-npr-plus-stylized-pbr')},
    appearance_loadout:appearance,expression_profile:{profile_id:String(input.expression_profile??'lan-expression-v1'),morphs:[...EXPRESSION_MORPHS],eye_states:[...EYE_STATES],composition_policy:'identity-plus-expression'},
    voice_binding:{voice_identity:String(input.voice_binding?.voice_identity??input.voice??'voice:lan-tianlin-default'),authority:'Voice Forge',mouth_timeline_authority:'final-dialogue-audio',close_mouth_on_end:true,viseme_profile:String(input.voice_binding?.viseme_profile??'mandarin-anime-v1'),visemes:[...VISEME_MORPHS]},
    motion_profile:{profile_id:String(input.motion_profile??'restrained-young-actor-v1'),retarget_profile:'rncs.humanoid-retarget-v0.1',director_override:true,secondary_motion:{hair:'profile-bound',costume:'profile-bound'}},
    physical_profile:{body_type:'dynamic-character',collision_profile:'rsr.character-semantic-fixtures.v0.1',mass_kg:Number(input.physical_profile?.mass_kg??62),height_m:Number(input.physical_profile?.height_m??1.82),units:'SI'},
    state_overlays:{expression:'neutral',emotion_intensity:0,fatigue:0,injury:0,soiling:0,age_delta:0,combat_state:'idle',ability_state:'inactive',yanlv_state:'inactive',lighting_state:'neutral',...clone(input.state_overlays??{})},
    cross_media_policy:{modes:['native-2d','2.5d','3d-assisted-2d','game-runtime'],identity_anchor_required:true,shared_signature:identityRoot,closeup_face_lod:true,...clone(input.cross_media_policy??{})},
    continuity_contract:{lock_identity:true,allow:['hair_change','costume_change','palette_change','state_overlay'],deny:['character_id_change','topology_change_without_migration','face_drift','voice_identity_rewrite_by_asset_provider'],max_identity_drift:.035,cross_cut:true,cross_episode:true,...clone(input.continuity_contract??{})},
    provider_policy:{identity_authority:'RNCS Character Genome',identity_writers:['RNCS Character Genome'],allowed_providers:['ragf.character-genome-reference-provider'],provider_must_be_explicit:true,license_required:true,multiple_identity_writers:'deny',cloud_calls:'deny-by-default',...clone(input.provider_policy??{})},
    lineage:{seed,parents:clone(input.lineage?.parents??[]),source_assets:clone(input.lineage?.source_assets??[]),user_asset_paths:clone(input.lineage?.user_asset_paths??[]),core_package_contamination:'deny'},
    evidence_policy:{hash_algorithm:'sha256-rncs-canonical-v1',manifest:true,provider_receipts:true,build_receipt:true,continuity_report:true,negative_gates:true,...clone(input.evidence_policy??{})},
    reference_catalog_root:createReferenceCharacterCatalog().catalog_root,genome_root:''
  };
  return seal(genome,'genome_root');
}

export function validateCharacterGenome(genome){
  const errors=[],warnings=[];
  if(genome?.format!==CHARACTER_GENOME_FORMAT)errors.push('CHARACTER_GENOME_FORMAT_INVALID');
  for(const key of ['genome_id','character_id','topology_family','identity_genome','morphology_genome','appearance_loadout','semantic_morph_graph','identity_root','genome_root'])if(!genome?.[key])errors.push(`CHARACTER_GENOME_REQUIRED:${key}`);
  const copy=clone(genome),actual=copy.genome_root;delete copy.genome_root;if(actual!==rootHash(copy))errors.push('CHARACTER_GENOME_ROOT_MISMATCH');
  if(genome?.identity_genome?.character_id!==genome?.character_id)errors.push('CHARACTER_ID_AUTHORITY_MISMATCH');
  if(genome?.identity_root!==rootHash({identityGenome:genome?.identity_genome,morphologyGenome:genome?.morphology_genome}))errors.push('IDENTITY_ROOT_MISMATCH');
  if((genome?.semantic_morph_graph?.parameters??[]).filter(item=>item.parameter_id.startsWith('face.')).length<24)errors.push('FACE_PARAMETER_COUNT_INSUFFICIENT');
  if((genome?.expression_profile?.morphs??[]).length<8)errors.push('EXPRESSION_COUNT_INSUFFICIENT');
  if((genome?.voice_binding?.visemes??[]).length<12)errors.push('VISEME_COUNT_INSUFFICIENT');
  if(genome?.voice_binding?.close_mouth_on_end!==true)errors.push('VISEME_CLOSE_MOUTH_POLICY_REQUIRED');
  if(genome?.constraint_report?.valid!==true)errors.push('CHARACTER_CONSTRAINT_REPORT_INVALID');
  if(!genome?.provider_policy?.license_required)errors.push('PROVIDER_LICENSE_POLICY_REQUIRED');
  if(genome?.provider_policy?.identity_authority!=='RNCS Character Genome')errors.push('CHARACTER_IDENTITY_AUTHORITY_INVALID');
  if((genome?.provider_policy?.identity_writers??[]).length!==1||genome?.provider_policy?.identity_writers?.[0]!=='RNCS Character Genome')errors.push('MULTIPLE_IDENTITY_WRITERS_DENIED');
  if(genome?.provider_policy?.provider_must_be_explicit!==true)errors.push('EXPLICIT_PROVIDER_REQUIRED');
  if(genome?.voice_binding?.close_mouth_on_end!==true)errors.push('VISEME_CLOSE_MOUTH_REQUIRED');
  if(genome?.continuity_contract?.lock_identity!==true)errors.push('IDENTITY_CONTINUITY_LOCK_REQUIRED');
  if((genome?.lineage?.user_asset_paths??[]).some(value=>String(value).includes('packages/world/character-genome-runtime')))errors.push('USER_ASSET_CORE_PACKAGE_CONTAMINATION');
  if(getTopologyFamily(genome?.topology_family)?.status==='compatibility-entry')warnings.push('TOPOLOGY_COMPATIBILITY_ENTRY');
  return{valid:errors.length===0,errors,warnings,genome_root:genome?.genome_root??null,identity_root:genome?.identity_root??null,face_parameter_count:(genome?.semantic_morph_graph?.parameters??[]).filter(item=>item.parameter_id.startsWith('face.')).length,expression_count:genome?.expression_profile?.morphs?.length??0,viseme_count:genome?.voice_binding?.visemes?.length??0};
}

export function assertValidCharacterGenome(genome){const result=validateCharacterGenome(genome);if(!result.valid)throw new CharacterGenomeError('CHARACTER_GENOME_INVALID',result.errors.join(','),result);return genome}

export function applyAppearanceLoadout(genome,patch={}){
  const next=createCharacterGenome({...clone(genome),appearance_loadout:{...clone(genome.appearance_loadout),...clone(patch)},genome_id:genome.genome_id,character_id:genome.character_id,seed:genome.lineage.seed},{strict:true});
  if(next.identity_root!==genome.identity_root)throw new CharacterGenomeError('APPEARANCE_CHANGED_IDENTITY','Appearance update changed identity root');
  return next;
}

export function applyStateOverlay(genome,patch={}){
  const next=clone(genome);next.state_overlays={...next.state_overlays,...clone(patch)};next.genome_root='';return seal(next,'genome_root');
}
