import {clone,rootHash,seal,stableId} from './canonical.mjs';

const ALL_ROLES=['concept-svg','sprite-sheet','mesh-glb','mesh-lod1-glb','mesh-lod2-glb','pbr-texture-pack','skeleton-rig','animation-clips','retarget-profile','lod-manifest','sfx-wav','particle-preset','collision-shape','vsr-spatial-asset','rsr-embodiment-profile','projection-manifest','dependency-graph','prefab-blueprint'];
const IMPACT={
  description:ALL_ROLES,world_context:ALL_ROLES,functional_role:['concept-svg','sprite-sheet','mesh-glb','skeleton-rig','animation-clips','retarget-profile','projection-manifest','prefab-blueprint'],asset_kind:ALL_ROLES,
  'constraints.palette':['concept-svg','sprite-sheet','pbr-texture-pack','particle-preset','vsr-spatial-asset','projection-manifest','prefab-blueprint'],
  'constraints.style':['concept-svg','sprite-sheet','mesh-glb','pbr-texture-pack','projection-manifest','prefab-blueprint'],
  'constraints.max_triangles':['mesh-glb','mesh-lod1-glb','mesh-lod2-glb','lod-manifest','collision-shape','vsr-spatial-asset','projection-manifest','prefab-blueprint'],
  'constraints.lod_ratios':['mesh-glb','mesh-lod1-glb','mesh-lod2-glb','lod-manifest','projection-manifest','prefab-blueprint'],
  'constraints.pbr_texture_size':['pbr-texture-pack','vsr-spatial-asset','projection-manifest','prefab-blueprint'],
  'constraints.max_bones':['skeleton-rig','mesh-glb','animation-clips','retarget-profile','rsr-embodiment-profile','prefab-blueprint'],
  'constraints.animation_fps':['animation-clips','retarget-profile','prefab-blueprint'],
  target_platforms:['mesh-lod1-glb','mesh-lod2-glb','lod-manifest','pbr-texture-pack','projection-manifest','dependency-graph','prefab-blueprint','vsr-spatial-asset','rsr-embodiment-profile']
};
function leafPaths(value,prefix=''){if(value===null||typeof value!=='object'||Array.isArray(value))return[prefix];return Object.keys(value).flatMap(k=>leafPaths(value[k],prefix?`${prefix}.${k}`:k));}
function deepMerge(base,patch){if(patch===null||typeof patch!=='object'||Array.isArray(patch))return clone(patch);const out=clone(base??{});for(const [k,v] of Object.entries(patch))out[k]=v&&typeof v==='object'&&!Array.isArray(v)?deepMerge(out[k],v):clone(v);return out;}
export function createAssetFamily({genome,candidates,reports,comparison,continuity}){
  const reportById=new Map(reports.map(r=>[r.candidate_id,r]));
  const members=candidates.map(c=>({member_id:stableId('asset-family-member',{candidate:c.candidate_root}),variant:c.variant,candidate_id:c.candidate_id,candidate_root:c.candidate_root,selected:c.candidate_id===comparison.recommended_candidate_id,score:reportById.get(c.candidate_id)?.scores?.total??0,artifact_roles:Object.keys(c.artifacts).sort(),artifact_roots:Object.fromEntries(Object.entries(c.artifacts).map(([k,v])=>[k,v.root]))}));
  return seal({format:'reality-asset.family.v0.3',version:'0.3.0',family_id:stableId('asset-family',{asset:genome.identity.asset_id,genome:genome.genome_root}),asset_id:genome.identity.asset_id,name:genome.identity.name,kind:genome.identity.kind,genome_root:genome.genome_root,selected_candidate_id:comparison.recommended_candidate_id,members,shared_invariants:{identity:true,semantics:clone(genome.semantics),visual_language:{style:genome.visual.style,palette:clone(genome.visual.palette),silhouette:genome.visual.silhouette},continuity_bundle_root:continuity.bundle_root},family_root:''},'family_root');
}
export function createLineageGraph({intent,genome,assetFamily,continuity,previousWorkspace=null}){
  const nodes=[
    {node_id:`intent:${intent.intent_root}`,kind:'intent',root:intent.intent_root},
    {node_id:`genome:${genome.genome_root}`,kind:'genome',root:genome.genome_root},
    {node_id:`family:${assetFamily.family_root}`,kind:'asset-family',root:assetFamily.family_root},
    {node_id:`bundle:${continuity.bundle_root}`,kind:'continuity-bundle',root:continuity.bundle_root}
  ];
  const edges=[
    {from:nodes[0].node_id,to:nodes[1].node_id,relation:'compiled-to'},
    {from:nodes[1].node_id,to:nodes[2].node_id,relation:'instantiated-as-family'},
    {from:nodes[2].node_id,to:nodes[3].node_id,relation:'selected-and-sealed'}
  ];
  if(previousWorkspace?.workspace_root){nodes.push({node_id:`workspace:${previousWorkspace.workspace_root}`,kind:'previous-workspace',root:previousWorkspace.workspace_root});edges.push({from:`workspace:${previousWorkspace.workspace_root}`,to:nodes[0].node_id,relation:'regenerated-as'});}
  return seal({format:'reality-asset.lineage-graph.v0.3',version:'0.3.0',lineage_id:stableId('asset-lineage',{asset:genome.identity.asset_id,family:assetFamily.family_root,previous:previousWorkspace?.workspace_root??null}),asset_id:genome.identity.asset_id,nodes,edges,lineage_root:''},'lineage_root');
}
export function validateAssetFamily(family){const errors=[];if(family?.format!=='reality-asset.family.v0.3')errors.push('FORMAT_INVALID');if(!family?.asset_id)errors.push('ASSET_ID_REQUIRED');if(!family?.members?.length)errors.push('MEMBERS_REQUIRED');if(family?.members?.filter(x=>x.selected).length!==1)errors.push('SELECTED_MEMBER_INVALID');const x=clone(family),r=x.family_root;delete x.family_root;if(r!==rootHash(x))errors.push('FAMILY_ROOT_MISMATCH');return{valid:!errors.length,errors,member_count:family?.members?.length??0};}

export function validateLineageGraph(graph){const errors=[];if(graph?.format!=='reality-asset.lineage-graph.v0.3')errors.push('FORMAT_INVALID');if(!graph?.asset_id)errors.push('ASSET_ID_REQUIRED');if((graph?.nodes?.length??0)<4)errors.push('NODES_INCOMPLETE');if((graph?.edges?.length??0)<3)errors.push('EDGES_INCOMPLETE');const x=clone(graph),r=x.lineage_root;delete x.lineage_root;if(r!==rootHash(x))errors.push('LINEAGE_ROOT_MISMATCH');return{valid:!errors.length,errors,node_count:graph?.nodes?.length??0,edge_count:graph?.edges?.length??0};}

export function planIncrementalRegeneration(workspace,patch){const changed_paths=leafPaths(patch).filter(Boolean).sort(),impacted=new Set();for(const p of changed_paths){let matched=false;for(const [key,roles] of Object.entries(IMPACT))if(p===key||p.startsWith(`${key}.`)||key.startsWith(`${p}.`)){roles.forEach(r=>impacted.add(r));matched=true;}if(!matched)ALL_ROLES.forEach(r=>impacted.add(r));}const required=new Set(workspace?.genome?.required_outputs??ALL_ROLES),impacted_roles=[...impacted].filter(r=>required.has(r)).sort(),reusable_roles=[...required].filter(r=>!impacted.has(r)).sort();return seal({format:'reality-asset.incremental-regeneration-plan.v0.3',version:'0.3.0',plan_id:stableId('asset-regeneration',{workspace:workspace?.workspace_root,patch}),source_workspace_root:workspace?.workspace_root??null,asset_id:workspace?.genome?.identity?.asset_id??null,patch:clone(patch),changed_paths,impacted_roles,reusable_roles,execution_mode:'selective-provider-rebuild',identity_policy:'preserve-stable-asset-id',plan_root:''},'plan_root');}
export function applyIntentPatch(workspace,patch){const source=clone(workspace.intent);for(const k of ['format','version','intent_root'])delete source[k];source.extensions=deepMerge(source.extensions??{},{asset_id:workspace.genome.identity.asset_id,previous_workspace_root:workspace.workspace_root});return deepMerge(source,patch);}
export function createRegenerationReceipt({previousWorkspace,nextWorkspace,plan}){const prev=previousWorkspace.candidates.find(c=>c.candidate_id===previousWorkspace.recommended_candidate_id),next=nextWorkspace.candidates.find(c=>c.candidate_id===nextWorkspace.recommended_candidate_id),roles=[...new Set([...Object.keys(prev?.artifacts??{}),...Object.keys(next?.artifacts??{})])].sort(),comparisons=roles.map(role=>({role,previous_root:prev?.artifacts?.[role]?.root??null,next_root:next?.artifacts?.[role]?.root??null,unchanged:prev?.artifacts?.[role]?.root===next?.artifacts?.[role]?.root,planned_reusable:plan.reusable_roles.includes(role),planned_impacted:plan.impacted_roles.includes(role)}));return seal({format:'reality-asset.regeneration-receipt.v0.3',version:'0.3.0',receipt_id:stableId('regeneration-receipt',{previous:previousWorkspace.workspace_root,next:nextWorkspace.workspace_root,plan:plan.plan_root}),asset_id:nextWorkspace.genome.identity.asset_id,previous_workspace_root:previousWorkspace.workspace_root,next_workspace_root:nextWorkspace.workspace_root,plan_root:plan.plan_root,comparisons,reused_by_content_root:comparisons.filter(x=>x.unchanged).map(x=>x.role),changed_roles:comparisons.filter(x=>!x.unchanged).map(x=>x.role),receipt_root:''},'receipt_root');}
