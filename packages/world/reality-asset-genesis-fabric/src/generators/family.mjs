import {seal,stableId,clone} from '../canonical.mjs';
import {isRiggedAssetKind,isStatic3dAssetKind,isCreatureAssetKind} from '../contracts.mjs';

export function generatePrefabBlueprint({genome,variant,context}){
  const assetId=genome.identity.asset_id;
  const rigged=isRiggedAssetKind(genome.identity.kind);
  const static3d=isStatic3dAssetKind(genome.identity.kind);
  const creature=isCreatureAssetKind(genome.identity.kind);
  const effectEvents=static3d?['spawn','impact','destroy']:['spawn','attack','hit'];
  const components=[
    {component_id:'visual',type:'mesh-renderer',bindings:{mesh_role:'mesh-glb',lod_role:'lod-manifest',material_role:'pbr-texture-pack'},cast_shadow:true,receive_shadow:true},
    ...(rigged?[{component_id:'animator',type:'skeletal-animator',bindings:{rig_role:'skeleton-rig',clips_role:'animation-clips',retarget_role:'retarget-profile'},default_state:'idle'}]:[]),
    {component_id:'body',type:'embodiment',bindings:{collision_role:'collision-shape',rsr_role:'rsr-embodiment-profile'}},
    {component_id:'effects',type:'semantic-effect-emitter',bindings:{particle_role:'particle-preset'},events:effectEvents},
    {component_id:'audio',type:'semantic-audio-emitter',bindings:{audio_role:'sfx-wav'},events:static3d?['impact','destroy']:['attack','hit']},
    {component_id:'projection',type:'observer-projection',bindings:{manifest_role:'projection-manifest',vsr_role:'vsr-spatial-asset'}}
  ];
  return seal({
    format:'reality-asset.prefab-blueprint.v0.3',version:'0.3.0',
    prefab_id:stableId('prefab',{assetId,variant,genome:genome.genome_root}),asset_id:assetId,variant,
    identity:{name:genome.identity.name,kind:genome.identity.kind,stable:true},
    hierarchy:{root:'entity-root',nodes:[
      {node_id:'entity-root',name:genome.identity.name,parent:null,components:components.map(x=>x.component_id)},
      ...(rigged&&!creature?[{node_id:'weapon-anchor',name:'weapon_r',parent:'entity-root',socket:'weapon_r',components:[]},{node_id:'effect-anchor',name:'vfx_head',parent:'entity-root',socket:'vfx_head',components:[]}]:creature?[{node_id:'effect-anchor',name:'vfx_head',parent:'entity-root',socket:'vfx_head',components:[]}]:[{node_id:'effect-anchor',name:'effect_anchor',parent:'entity-root',components:[]}])
    ]},
    components,
    dependencies:['mesh-glb','lod-manifest','pbr-texture-pack',...(rigged?['skeleton-rig','animation-clips','retarget-profile']:[]),'collision-shape','rsr-embodiment-profile','particle-preset','sfx-wav','projection-manifest','vsr-spatial-asset'],
    instancing:{allowed:true,shared_immutable_roles:['mesh-glb','pbr-texture-pack',...(rigged?['skeleton-rig','animation-clips']:[])],per_instance_state:['transform',...(rigged?['animation_state']:[]),'health','authority']},
    runtime_contract:{studio:'reality-studio.prefab.v1.4',vsr:'vsr.spatial-scene.v0.4',rsr:'rsr.spatial-embodiment-world.v0.6'},
    statistics:{triangles:context?.meshes?.[0]?.metadata?.triangle_count??0,bones:context?.rig?.bones?.length??0,clips:context?.animations?.clips?.length??0},
    prefab_root:''
  },'prefab_root');
}

export function generateRetargetProfile({genome,variant,rig,animations}){
  const creature=isCreatureAssetKind(genome.identity.kind),canonical=creature?{pelvis:'pelvis',spine:'spine',chest:'chest',neck:'neck',head:'head',front_left_leg:'leg_front_l',front_right_leg:'leg_front_r',hind_left_leg:'leg_hind_l',hind_right_leg:'leg_hind_r',tail_base:'tail_base',tail_mid:'tail_mid',tail_tip:'tail_tip'}:{hips:'hips',spine:'spine',head:'head',left_arm:'arm_l',right_arm:'arm_r',left_leg:'leg_l',right_leg:'leg_r'};
  const available=new Set((rig?.bones??[]).map(x=>x.name));
  const bone_map=Object.fromEntries(Object.entries(canonical).filter(([,target])=>available.has(target)));
  return seal({
    format:'reality-asset.animation-retarget-profile.v0.3',version:'0.3.0',
    profile_id:stableId('retarget',{asset:genome.identity.asset_id,variant,rig:rig?.rig_root}),asset_id:genome.identity.asset_id,variant,
    source_profile:rig?.profile??(creature?'creature-quadruped-v0.1':'humanoid-rounded-v0.4'),canonical_profile:creature?'rncs.creature-quadruped.v0.1':'rncs.humanoid-rounded.v0.4',bone_map,
    required_bones:creature?['root','pelvis','spine','chest','neck','head']:['hips','spine','head'],optional_bones:creature?['leg_front_l','leg_front_r','leg_hind_l','leg_hind_r','tail_base','tail_mid','tail_tip']:['left_arm','right_arm','left_leg','right_leg'],
    sockets:clone(rig?.sockets??[]),
    scale_policy:{mode:creature?'normalized-length':'normalized-height',reference_height:creature?1.9:2.55,root_motion:'extract-horizontal'},
    rotation_policy:{coordinate_system:'right-handed-y-up',quaternion_order:'xyzw',preserve_joint_limits:true},
    clips:(animations?.clips??[]).map(c=>({name:c.name,duration:c.duration,loop:c.loop,semantic_events:clone(c.events??[]),retargetable:true})),
    compatibility:{accepted_sources:creature?['rncs.creature-quadruped.v0.1','quadruped-gait-v0.1']:['rncs.humanoid-rounded.v0.4','rncs.humanoid-lite.v0.3','mixamo-compatible','gltf-humanoid-lite'],target_runtime:'rsr.v0.6+'},
    retarget_root:''
  },'retarget_root');
}

export function generateProjectionManifest({genome,variant,context}){
  const assetId=genome.identity.asset_id;
  const rigged=isRiggedAssetKind(genome.identity.kind);
  const creature=isCreatureAssetKind(genome.identity.kind);
  return seal({
    format:'reality-asset.cross-media-projection-manifest.v0.3',version:'0.3.0',
    projection_family_id:stableId('projection-family',{assetId,variant,genome:genome.genome_root}),asset_id:assetId,variant,
    invariants:{identity:assetId,name:genome.identity.name,element:genome.semantics.element,faction:genome.semantics.faction,style:genome.visual.style,palette:clone(genome.visual.palette),silhouette:genome.visual.silhouette,telegraph_required:rigged},
    projections:creature?[
      {projection_id:'concept-creature-card',medium:'document',roles:['concept-svg'],interaction:'inspect',fidelity:'semantic'},
      {projection_id:'sprite-creature',medium:'2d-game',roles:['sprite-sheet','particle-preset','sfx-wav'],interaction:'play',fidelity:'realtime-low'},
      {projection_id:'realtime-creature',medium:'3d-game',roles:['mesh-glb','pbr-texture-pack','skeleton-rig','animation-clips','lod-manifest'],interaction:'embodied-quadruped',fidelity:variant==='cinematic'?'realtime-high':'realtime-balanced'},
      {projection_id:'xr-creature',medium:'xr',roles:['mesh-glb','pbr-texture-pack','vsr-spatial-asset','rsr-embodiment-profile','retarget-profile'],interaction:'spatial-embodied',fidelity:'device-negotiated'},
      {projection_id:'cinematic-creature',medium:'film-animation',roles:['mesh-glb','pbr-texture-pack','skeleton-rig','animation-clips'],interaction:'render-source',fidelity:'source-controlled'}
    ]:rigged?[
      {projection_id:'concept-card',medium:'document',roles:['concept-svg'],interaction:'inspect',fidelity:'semantic'},
      {projection_id:'sprite-avatar',medium:'2d-game',roles:['sprite-sheet','particle-preset','sfx-wav'],interaction:'play',fidelity:'realtime-low'},
      {projection_id:'realtime-avatar',medium:'3d-game',roles:['mesh-glb','pbr-texture-pack','skeleton-rig','animation-clips','lod-manifest'],interaction:'embodied',fidelity:variant==='cinematic'?'realtime-high':'realtime-balanced'},
      {projection_id:'xr-avatar',medium:'xr',roles:['mesh-glb','pbr-texture-pack','vsr-spatial-asset','rsr-embodiment-profile','retarget-profile'],interaction:'spatial-embodied',fidelity:'device-negotiated'},
      {projection_id:'cinematic-source',medium:'film-animation',roles:['mesh-glb','pbr-texture-pack','skeleton-rig','animation-clips'],interaction:'render-source',fidelity:'source-controlled'}
    ]:[
      {projection_id:'concept-card',medium:'document',roles:['concept-svg'],interaction:'inspect',fidelity:'semantic'},
      {projection_id:'sprite-asset',medium:'2d-game',roles:['sprite-sheet','particle-preset','sfx-wav'],interaction:'play',fidelity:'realtime-low'},
      {projection_id:'realtime-asset',medium:'3d-game',roles:['mesh-glb','pbr-texture-pack','lod-manifest'],interaction:'static-render',fidelity:variant==='cinematic'?'realtime-high':'realtime-balanced'},
      {projection_id:'xr-asset',medium:'xr',roles:['mesh-glb','pbr-texture-pack','vsr-spatial-asset','rsr-embodiment-profile'],interaction:'spatial-static',fidelity:'device-negotiated'},
      {projection_id:'cinematic-source',medium:'film-animation',roles:['mesh-glb','pbr-texture-pack'],interaction:'render-source',fidelity:'source-controlled'}
    ],
    equivalence_checks:creature?[
      {check:'stable-asset-id',required:true},{check:'palette-family',required:true},{check:'element-language',required:true},{check:'creature-archetype',required:true},{check:'gait-events',required:true}
    ]:rigged?[
      {check:'stable-asset-id',required:true},{check:'palette-family',required:true},{check:'element-language',required:true},{check:'attack-telegraph',required:true},{check:'semantic-sockets',required:true}
    ]:[
      {check:'stable-asset-id',required:true},{check:'palette-family',required:true},{check:'element-language',required:true},{check:'profile-archetype',required:true}
    ],
    runtime_stats:{triangles:context?.meshes?.[0]?.metadata?.triangle_count??0,pbr_size:context?.pbr?.metadata?.size??0},
    projection_root:''
  },'projection_root');
}

export function generateDependencyGraph({genome,variant}){
  const rigged=isRiggedAssetKind(genome.identity.kind);
  const nodes=[
    ['concept-svg','visual'],['sprite-sheet','visual'],['mesh-glb','geometry'],['mesh-lod1-glb','geometry'],['mesh-lod2-glb','geometry'],['pbr-texture-pack','material'],
    ['skeleton-rig','rig'],['animation-clips','motion'],['retarget-profile','motion'],['lod-manifest','optimization'],['collision-shape','physics'],['particle-preset','effects'],['sfx-wav','audio'],
    ['vsr-spatial-asset','adapter'],['rsr-embodiment-profile','adapter'],['projection-manifest','projection'],['prefab-blueprint','assembly']
  ].filter(([role])=>rigged||!['skeleton-rig','animation-clips','retarget-profile'].includes(role)).map(([role,domain])=>({node_id:`role:${role}`,role,domain}));
  const edge=(from,to,reason)=>({from:`role:${from}`,to:`role:${to}`,reason});
  const edges=[
    edge('mesh-glb','mesh-lod1-glb','geometry-simplification'),edge('mesh-glb','mesh-lod2-glb','geometry-simplification'),edge('mesh-glb','lod-manifest','lod-index'),
    edge('skeleton-rig','mesh-glb','skin-binding'),edge('skeleton-rig','animation-clips','joint-targets'),edge('skeleton-rig','retarget-profile','bone-map'),
    edge('mesh-glb','vsr-spatial-asset','render-adapter'),edge('pbr-texture-pack','vsr-spatial-asset','material-adapter'),edge('skeleton-rig','rsr-embodiment-profile','body-adapter'),
    edge('concept-svg','projection-manifest','identity-projection'),edge('sprite-sheet','projection-manifest','2d-projection'),edge('mesh-glb','projection-manifest','3d-projection'),
    edge('projection-manifest','prefab-blueprint','projection-component'),edge('mesh-glb','prefab-blueprint','visual-component'),edge('pbr-texture-pack','prefab-blueprint','material-component'),
    edge('animation-clips','prefab-blueprint','animator-component'),edge('collision-shape','prefab-blueprint','body-component'),edge('particle-preset','prefab-blueprint','effect-component'),edge('sfx-wav','prefab-blueprint','audio-component')
  ].filter(item=>rigged||(!item.from.includes('skeleton-rig')&&!item.to.includes('skeleton-rig')&&!item.from.includes('animation-clips')&&!item.to.includes('animation-clips')&&!item.from.includes('retarget-profile')&&!item.to.includes('retarget-profile')));
  return seal({
    format:'reality-asset.dependency-graph.v0.3',version:'0.3.0',graph_id:stableId('asset-dependency',{asset:genome.identity.asset_id,variant}),asset_id:genome.identity.asset_id,variant,nodes,edges,
    change_impact:{
      palette:['concept-svg','sprite-sheet','pbr-texture-pack','particle-preset','vsr-spatial-asset','projection-manifest','prefab-blueprint'],
      geometry:['mesh-glb','mesh-lod1-glb','mesh-lod2-glb','lod-manifest','collision-shape','vsr-spatial-asset','projection-manifest','prefab-blueprint'],
      rig:rigged?['skeleton-rig','mesh-glb','animation-clips','retarget-profile','rsr-embodiment-profile','prefab-blueprint']:['mesh-glb','rsr-embodiment-profile','prefab-blueprint'],
      animation:rigged?['animation-clips','retarget-profile','prefab-blueprint']:[],
      platform:['lod-manifest','pbr-texture-pack','projection-manifest','prefab-blueprint','vsr-spatial-asset','rsr-embodiment-profile']
    },
    graph_root:''
  },'graph_root');
}
