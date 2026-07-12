import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {clone,seal,stableId,GenesisError} from './canonical.mjs';
import {generateAssetWorkspace,regenerateAssetWorkspace,verifyWorkspace} from './runtime.mjs';
import {createContinuityBundle,createCausalDelta} from './continuity.mjs';
import {createAssetFamily,createLineageGraph} from './lineage.mjs';
import {createStudioImport,createAuthorityRequest} from './adapters.mjs';

export const ASSET_PRODUCTION_VERSION='0.4.0-alpha.1';
export const ASSET_PRODUCTION_FORMAT='reality-asset.production-session.v0.4';

const deep=value=>structuredClone(value);
const mkdir=dir=>fs.mkdirSync(dir,{recursive:true});
const candidateFiles=candidate=>Object.values(candidate?.artifacts??{}).flatMap(artifact=>(artifact.files??[]).map(file=>({
  role:file.role,
  path:`candidates/${candidate.variant}/${file.name}`,
  mime:file.mime,
  sha256:file.root,
  size:file.size,
  variant:candidate.variant,
  lod:/lod(\d+)/.test(file.name)?Number(file.name.match(/lod(\d+)/)[1]):null
}))).sort((a,b)=>a.path.localeCompare(b.path));

function providerManifests(workspace,candidate){
  const allowed=new Set(candidate.provider_roots??[]);
  return (workspace.continuity_bundle?.provenance?.providers??[])
    .filter(provider=>allowed.size===0||allowed.has(provider.provider_root))
    .map(provider=>({provider_id:provider.provider_id,provider_root:provider.provider_root,mode:provider.mode,metadata:{license:provider.license??'unspecified'}}));
}

function selectedComparison(workspace,candidateId){
  const source=deep(workspace.comparison);
  delete source.comparison_root;
  source.version='0.4.0';
  source.recommended_candidate_id=candidateId;
  const rows=[...(source.rows??[])];
  rows.sort((a,b)=>Number(b.candidate_id===candidateId)-Number(a.candidate_id===candidateId)||b.rank_score-a.rank_score||a.candidate_id.localeCompare(b.candidate_id));
  source.rows=rows;
  if(!source.pareto_frontier?.includes(candidateId))source.pareto_frontier=[candidateId,...(source.pareto_frontier??[])];
  return seal({...source,comparison_root:''},'comparison_root');
}

export function evaluateProductionCandidate(workspace,candidateId){
  const candidate=workspace?.candidates?.find(item=>item.candidate_id===candidateId);
  const report=workspace?.reports?.find(item=>item.candidate_id===candidateId);
  if(!candidate||!report)throw new GenesisError('PRODUCTION_CANDIDATE_NOT_FOUND',candidateId);
  const mesh=candidate.artifacts?.['mesh-glb']?.metadata??null;
  const pbr=candidate.artifacts?.['pbr-texture-pack']?.metadata??null;
  const rig=candidate.artifacts?.['skeleton-rig']?.data??null;
  const animations=candidate.artifacts?.['animation-clips']?.data??null;
  const requiredRoles=String(workspace.genome?.identity?.kind).includes('3d')
    ?['mesh-glb','mesh-lod1-glb','mesh-lod2-glb','pbr-texture-pack','skeleton-rig','animation-clips','lod-manifest','collision-shape','vsr-spatial-asset','rsr-embodiment-profile','prefab-blueprint']
    :['concept-svg','sprite-sheet','sfx-wav','particle-preset','collision-shape'];
  const missingRoles=requiredRoles.filter(role=>!candidate.artifacts?.[role]);
  const gates={
    technical:report.scores.technical>=7000,
    semantic:report.scores.semantic>=7000,
    platform:report.scores.platform>=6500,
    production:report.scores.production>=6500,
    complete:missingRoles.length===0,
    geometry:String(workspace.genome?.identity?.kind).includes('3d')?Boolean(mesh?.glb_valid&&mesh.triangle_count>0):true,
    material:String(workspace.genome?.identity?.kind).includes('3d')?Boolean(pbr?.files?.length>=4):true,
    rig:String(workspace.genome?.identity?.kind).includes('3d')?Boolean((rig?.bones?.length??0)>0):true,
    animation:String(workspace.genome?.identity?.kind).includes('3d')?Boolean((animations?.clips?.length??0)>0):true,
    runtime:Boolean(candidate.artifacts?.['vsr-spatial-asset']&&candidate.artifacts?.['rsr-embodiment-profile']),
    provenance:Object.values(candidate.artifacts??{}).every(artifact=>artifact.provenance?.provider_root&&artifact.provenance?.license)
  };
  const pass=Object.values(gates).every(Boolean)&&report.eligible;
  return seal({
    format:'reality-asset.production-readiness.v0.4',version:ASSET_PRODUCTION_VERSION,
    candidate_id:candidate.candidate_id,candidate_root:candidate.candidate_root,variant:candidate.variant,
    score:deep(report.scores),eligible:report.eligible,pass,gates,missing_roles:missingRoles,
    statistics:{triangle_count:mesh?.triangle_count??0,bone_count:mesh?.bone_count??rig?.bones?.length??0,animation_count:mesh?.animation_count??animations?.clips?.length??0,pbr_size:pbr?.size??0,file_count:candidateFiles(candidate).length},
    issues:deep(report.issues??[]),readiness_root:''
  },'readiness_root');
}

export function materializeCandidateSelection(workspace,candidateId,{previewPath='preview.html'}={}){
  const candidate=workspace?.candidates?.find(item=>item.candidate_id===candidateId);
  const report=workspace?.reports?.find(item=>item.candidate_id===candidateId);
  if(!candidate||!report)throw new GenesisError('PRODUCTION_CANDIDATE_NOT_FOUND',candidateId);
  const readiness=evaluateProductionCandidate(workspace,candidateId);
  if(!readiness.pass)throw new GenesisError('PRODUCTION_CANDIDATE_NOT_READY',JSON.stringify({candidate_id:candidateId,gates:readiness.gates,issues:readiness.issues}));
  const comparison=selectedComparison(workspace,candidateId);
  const continuityBundle=createContinuityBundle({intent:workspace.intent,genome:workspace.genome,plan:workspace.plan,candidate,validation:report,comparison,files:candidateFiles(candidate),providers:providerManifests(workspace,candidate)});
  const assetFamily=createAssetFamily({genome:workspace.genome,candidates:workspace.candidates,reports:workspace.reports,comparison,continuity:continuityBundle});
  const lineageGraph=createLineageGraph({intent:workspace.intent,genome:workspace.genome,assetFamily,continuity:continuityBundle});
  const causalDelta=createCausalDelta({intent:workspace.intent,genome:workspace.genome,plan:workspace.plan,candidate,validation:report,continuity:continuityBundle});
  const studioImport=createStudioImport({workspace,continuityBundle,assetFamily,lineageGraph,previewPath});
  const authorityRequest=createAuthorityRequest({intent:workspace.intent,continuityBundle,causalDelta});
  return {candidate,report,readiness,comparison,continuity_bundle:continuityBundle,asset_family:assetFamily,lineage_graph:lineageGraph,causal_delta:causalDelta,studio_import:studioImport,authority_request:authorityRequest};
}

export class AssetProductionSession{
  constructor(intent,{rootDir,providers=[],sessionId=null}={}){
    if(!rootDir)throw new GenesisError('PRODUCTION_ROOT_REQUIRED');
    this.session_id=sessionId??`asset-production:${randomUUID()}`;
    this.root_dir=path.resolve(rootDir);mkdir(this.root_dir);
    this.intent=deep(intent);this.providers=providers;
    this.generations=[];this.selected_candidate_id=null;this.selection_receipt=null;this.acceptance=null;
  }
  current(){const generation=this.generations.at(-1);if(!generation)throw new GenesisError('PRODUCTION_NOT_GENERATED');return generation;}
  generate({label='initial'}={}){
    const number=this.generations.length+1,outDir=path.join(this.root_dir,`generation-${String(number).padStart(3,'0')}`);
    const workspace=generateAssetWorkspace(this.intent,{outDir,providers:this.providers});
    const verification=verifyWorkspace(workspace,{baseDir:outDir,verifyFiles:true});
    if(!verification.valid)throw new GenesisError('PRODUCTION_WORKSPACE_INVALID',verification.errors.join(','));
    this.selected_candidate_id=workspace.recommended_candidate_id;
    this.selection_receipt=null;this.acceptance=null;
    this.generations.push({number,label,out_dir:outDir,workspace,verification});
    return this.inspect();
  }
  select(candidateId,{reason='manual-selection'}={}){
    const generation=this.current(),readiness=evaluateProductionCandidate(generation.workspace,candidateId);
    if(!readiness.pass)throw new GenesisError('PRODUCTION_CANDIDATE_NOT_READY',candidateId);
    this.selected_candidate_id=candidateId;this.acceptance=null;
    this.selection_receipt=seal({format:'reality-asset.selection-receipt.v0.4',version:ASSET_PRODUCTION_VERSION,receipt_id:stableId('asset-selection',{session:this.session_id,workspace:generation.workspace.workspace_root,candidate:candidateId}),session_id:this.session_id,workspace_root:generation.workspace.workspace_root,candidate_id:candidateId,candidate_root:generation.workspace.candidates.find(c=>c.candidate_id===candidateId).candidate_root,variant:readiness.variant,reason,readiness_root:readiness.readiness_root,receipt_root:''},'receipt_root');
    return this.inspect();
  }
  regenerate(patch,{label='targeted-regeneration'}={}){
    const previous=this.current(),number=this.generations.length+1,outDir=path.join(this.root_dir,`generation-${String(number).padStart(3,'0')}`);
    const workspace=regenerateAssetWorkspace(previous.workspace,patch,{outDir,providers:this.providers});
    const verification=verifyWorkspace(workspace,{baseDir:outDir,verifyFiles:true});
    if(!verification.valid)throw new GenesisError('PRODUCTION_WORKSPACE_INVALID',verification.errors.join(','));
    this.intent=deep(workspace.intent);this.selected_candidate_id=workspace.recommended_candidate_id;this.selection_receipt=null;this.acceptance=null;
    this.generations.push({number,label,out_dir:outDir,workspace,verification,patch:deep(patch)});
    return this.inspect();
  }
  accept({candidateId=this.selected_candidate_id,previewPath='preview.html',reason='approved-for-studio'}={}){
    const generation=this.current(),selection=materializeCandidateSelection(generation.workspace,candidateId,{previewPath});
    const receipt=seal({format:'reality-asset.production-acceptance.v0.4',version:ASSET_PRODUCTION_VERSION,acceptance_id:stableId('asset-production-acceptance',{session:this.session_id,workspace:generation.workspace.workspace_root,candidate:candidateId,bundle:selection.continuity_bundle.bundle_root}),session_id:this.session_id,generation:generation.number,workspace_root:generation.workspace.workspace_root,candidate_id:candidateId,candidate_root:selection.candidate.candidate_root,variant:selection.candidate.variant,reason,readiness_root:selection.readiness.readiness_root,bundle_root:selection.continuity_bundle.bundle_root,family_root:selection.asset_family.family_root,lineage_root:selection.lineage_graph.lineage_root,studio_import_root:selection.studio_import.import_root,authority_request_root:selection.authority_request.request_root,status:'accepted',receipt_root:''},'receipt_root');
    this.selected_candidate_id=candidateId;this.acceptance={...selection,receipt};return this.exportArtifacts();
  }
  exportArtifacts(){
    const generation=this.current(),selection=this.acceptance??materializeCandidateSelection(generation.workspace,this.selected_candidate_id??generation.workspace.recommended_candidate_id);
    const manifest=seal({format:'reality-asset.production-manifest.v0.4',version:ASSET_PRODUCTION_VERSION,session_id:this.session_id,generation:generation.number,workspace_root:generation.workspace.workspace_root,asset_id:generation.workspace.genome.identity.asset_id,candidate_id:selection.candidate.candidate_id,variant:selection.candidate.variant,readiness_root:selection.readiness.readiness_root,bundle_root:selection.continuity_bundle.bundle_root,family_root:selection.asset_family.family_root,lineage_root:selection.lineage_graph.lineage_root,roles:Object.keys(selection.candidate.artifacts).sort(),files:candidateFiles(selection.candidate),manifest_root:''},'manifest_root');
    return {production_manifest:manifest,acceptance_receipt:this.acceptance?.receipt??null,selection_receipt:this.selection_receipt,readiness:selection.readiness,continuity_bundle:selection.continuity_bundle,asset_family:selection.asset_family,lineage_graph:selection.lineage_graph,causal_delta:selection.causal_delta,studio_import:selection.studio_import,authority_request:selection.authority_request,workspace:generation.workspace};
  }
  inspect(){
    const generation=this.generations.at(-1);if(!generation)return{format:ASSET_PRODUCTION_FORMAT,version:ASSET_PRODUCTION_VERSION,session_id:this.session_id,status:'new',generations:[],selected_candidate_id:null};
    const workspace=generation.workspace,selected=this.selected_candidate_id??workspace.recommended_candidate_id;
    return seal({format:ASSET_PRODUCTION_FORMAT,version:ASSET_PRODUCTION_VERSION,session_id:this.session_id,status:this.acceptance?'accepted':'review',root_dir:this.root_dir,generation:generation.number,generations:this.generations.map(item=>({number:item.number,label:item.label,out_dir:item.out_dir,workspace_root:item.workspace.workspace_root,regeneration_plan_root:item.workspace.regeneration_plan?.plan_root??null,regeneration_receipt_root:item.workspace.regeneration_receipt?.receipt_root??null})),asset:{asset_id:workspace.genome.identity.asset_id,name:workspace.genome.identity.name,kind:workspace.genome.identity.kind},workspace_root:workspace.workspace_root,recommended_candidate_id:workspace.recommended_candidate_id,selected_candidate_id:selected,candidates:workspace.candidates.map(candidate=>evaluateProductionCandidate(workspace,candidate.candidate_id)),selection_receipt:clone(this.selection_receipt),acceptance_receipt:clone(this.acceptance?.receipt??null),session_root:''},'session_root');
  }
}
