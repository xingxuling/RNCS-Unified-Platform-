import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {seal,rootHash,StudioError} from './canonical.mjs';
import {AssetProductionSession,ASSET_PRODUCTION_VERSION} from '@taowind/reality-asset-genesis-fabric';

export const ASSET_FORGE_VERSION='1.5.0-alpha.1';
export const ASSET_FORGE_FORMAT='reality-studio.asset-forge-session.v1.5';
const deep=value=>structuredClone(value);
const safe=value=>String(value??'asset').replace(/[^a-zA-Z0-9:_-]/g,'-');

function selectedCandidate(production){
  const generation=production.current(),candidateId=production.selected_candidate_id??generation.workspace.recommended_candidate_id;
  const candidate=generation.workspace.candidates.find(item=>item.candidate_id===candidateId);
  const report=generation.workspace.reports.find(item=>item.candidate_id===candidateId);
  if(!candidate||!report)throw new StudioError('ASSET_FORGE_CANDIDATE_NOT_FOUND',candidateId);
  return {generation,candidate,report};
}

export function createAssetForgePreview(production,{includeRuntime=true}={}){
  const {generation,candidate,report}=selectedCandidate(production);
  const vsr=candidate.artifacts?.['vsr-spatial-asset']?.data??null;
  const rsr=candidate.artifacts?.['rsr-embodiment-profile']?.data??null;
  const prefab=candidate.artifacts?.['prefab-blueprint']?.data??null;
  const pbr=candidate.artifacts?.['pbr-texture-pack']?.metadata??null;
  const mesh=candidate.artifacts?.['mesh-glb']?.metadata??null;
  const manifest=seal({
    format:'reality-studio.asset-forge-preview.v1.5',version:ASSET_FORGE_VERSION,
    workspace_root:generation.workspace.workspace_root,candidate_id:candidate.candidate_id,candidate_root:candidate.candidate_root,variant:candidate.variant,
    asset:{asset_id:generation.workspace.genome.identity.asset_id,name:generation.workspace.genome.identity.name,kind:generation.workspace.genome.identity.kind},
    quality:{scores:deep(report.scores),eligible:report.eligible,issue_count:(report.issues??[]).length},
    visual:{mesh_root:candidate.artifacts?.['mesh-glb']?.root??null,vsr_adapter_root:candidate.artifacts?.['vsr-spatial-asset']?.root??null,material_root:candidate.artifacts?.['pbr-texture-pack']?.root??null,vertex_count:mesh?.vertex_count??0,triangle_count:mesh?.triangle_count??0,pbr_size:pbr?.size??0,pbr_files:(pbr?.files??[]).map(file=>({name:file.name,role:file.role,mime:file.mime,root:file.root}))},
    physical:{profile_root:candidate.artifacts?.['rsr-embodiment-profile']?.root??null,kind:rsr?.body?.kind??null,shape:rsr?.body?.shape??null,radius_mm:Math.round((rsr?.body?.radius??0)*1000),height_mm:Math.round((rsr?.body?.height??0)*1000),mass_milli:Math.round((rsr?.body?.mass??0)*1000)},
    prefab:{prefab_root:prefab?.prefab_root??null,component_count:prefab?.components?.length??0},
    source:{preview_html:path.join(generation.out_dir,'preview.html'),candidate_dir:path.join(generation.out_dir,'candidates',candidate.variant)},
    preview_root:''
  },'preview_root');
  if(!includeRuntime)return manifest;
  return {...manifest,runtime_payload:{mesh:deep(vsr?.mesh??null),material:deep(vsr?.material??null),node:deep(vsr?.node??null),physical:deep(rsr),prefab:deep(prefab),issues:deep(report.issues??[])}};
}

export class AssetForgeSession{
  constructor(manufacturingSession,intent,{outDir,providers=[],forgeId=null}={}){
    if(!manufacturingSession)throw new StudioError('ASSET_FORGE_MANUFACTURING_SESSION_REQUIRED');
    if(!outDir)throw new StudioError('ASSET_FORGE_OUTPUT_REQUIRED');
    this.forge_id=forgeId??`asset-forge:${randomUUID()}`;
    this.manufacturing=manufacturingSession;
    this.production=new AssetProductionSession(intent,{rootDir:outDir,providers,sessionId:`production:${this.forge_id}`});
    this.status='new';this.accepted=null;this.events=[];
  }
  record(type,data={}){this.events.push({sequence:this.events.length+1,type,...deep(data)});if(this.events.length>200)this.events.shift();}
  generate(){const result=this.production.generate();this.status='review';this.record('forge.generated',{workspace_root:result.workspace_root,candidates:result.candidates.length});return this.inspect();}
  select(candidateId,{reason='studio-selection'}={}){const result=this.production.select(candidateId,{reason});this.status='review';this.record('forge.candidate-selected',{candidate_id:candidateId,reason});return this.inspect();}
  regenerate(patch,{label='studio-targeted-regeneration'}={}){const result=this.production.regenerate(patch,{label});this.status='review';this.accepted=null;this.record('forge.regenerated',{workspace_root:result.workspace_root,generation:result.generation,patch});return this.inspect();}
  preview(options={}){return createAssetForgePreview(this.production,options);}
  acceptIntoProject({x=160,y=160,z=0,name=null,bindEntity=true,addSpatial=true}={}){
    const artifacts=this.production.accept({reason:'accepted-in-reality-studio'}),generation=this.production.current(),preview=this.preview();
    const bundle=artifacts.continuity_bundle,assetId=bundle.asset_identity.asset_id;
    this.manufacturing.importAsset(bundle,{sourceRoot:generation.out_dir,importProposal:artifacts.studio_import,previewUrl:preview.source.preview_html,strictFiles:true});
    const sceneBefore=this.manufacturing.project.scenes.find(scene=>scene.scene_id===this.manufacturing.project.active_scene_id).nodes.length;
    this.manufacturing.addAssetNode({assetId,x,y,name:name??bundle.asset_identity.name,bindEntity});
    const scene=this.manufacturing.project.scenes.find(item=>item.scene_id===this.manufacturing.project.active_scene_id),node=scene.nodes.at(-1);
    let spatialBodyId=null,spatialCharacterId=null;
    if(addSpatial&&String(bundle.asset_identity.kind).includes('3d')){
      const profile=artifacts.production_manifest&&artifacts.workspace.candidates.find(c=>c.candidate_id===artifacts.production_manifest.candidate_id)?.artifacts?.['rsr-embodiment-profile']?.data;
      if(profile){
        const suffix=safe(assetId.split(':').at(-1)),bodyId=`body:asset:${suffix}:${sceneBefore+1}`;
        const radius=Math.max(50,Math.round((profile.body?.radius??.3)*1000));
        const height=Math.max(radius*2,Math.round((profile.body?.height??2.55)*1000));
        this.manufacturing.spatialAddBody({id:bodyId,name:bundle.asset_identity.name,kind:'dynamic',shape:'capsule',position:{x:Math.round(x*10),y:Math.round(height/2),z:Math.round(z*10)},radius,halfHeight:Math.max(0,Math.round(height/2-radius)),tags:['ragf-generated',assetId]});
        spatialBodyId=bodyId;
        if(profile.body?.kind==='character'){
          spatialCharacterId=`character:asset:${suffix}:${sceneBefore+1}`;
          this.manufacturing.spatialUpsertCharacter({id:spatialCharacterId,bodyId,walkSpeed:Math.round((profile.movement?.max_speed??6)*1000),acceleration:Math.round((profile.movement?.acceleration??24)*1000),jumpSpeed:Math.round((profile.movement?.jump_speed??7.5)*1000)});
        }
        this.manufacturing.patchNode(node.node_id,{components:{...(node.components??{}),ragf_prefab_root:artifacts.production_manifest?.manifest_root??null,spatial_body_id:spatialBodyId,spatial_character_id:spatialCharacterId,asset_forge_id:this.forge_id}});
      }
    }
    this.accepted=seal({format:'reality-studio.asset-forge-acceptance.v1.5',version:ASSET_FORGE_VERSION,forge_id:this.forge_id,production_acceptance_root:artifacts.acceptance_receipt?.receipt_root??null,asset_id:assetId,asset_root:this.manufacturing.project.assets.registry[assetId].asset_root,node_id:node.node_id,spatial_body_id:spatialBodyId,spatial_character_id:spatialCharacterId,project_root:this.manufacturing.project.project_root,preview_root:preview.preview_root,status:'accepted',acceptance_root:''},'acceptance_root');
    this.status='accepted';this.record('forge.accepted',{asset_id:assetId,node_id:node.node_id,spatial_body_id:spatialBodyId});return this.inspect();
  }
  exportArtifacts(){
    const production=this.production.exportArtifacts(),preview=this.preview({includeRuntime:false});
    const manifest=seal({format:'reality-studio.asset-forge-manifest.v1.5',version:ASSET_FORGE_VERSION,forge_id:this.forge_id,production_version:ASSET_PRODUCTION_VERSION,production_manifest_root:production.production_manifest.manifest_root,preview_root:preview.preview_root,acceptance_root:this.accepted?.acceptance_root??null,project_root:this.manufacturing.project.project_root,manifest_root:''},'manifest_root');
    return {manifest,preview,acceptance:this.accepted,production};
  }
  inspect(){
    const production=this.production.inspect();
    return seal({format:ASSET_FORGE_FORMAT,version:ASSET_FORGE_VERSION,forge_id:this.forge_id,status:this.status,production,preview:this.status==='new'?null:this.preview({includeRuntime:false}),accepted:deep(this.accepted),project:{project_root:this.manufacturing.project.project_root,asset_count:this.manufacturing.project.assets.order.length,scene_node_count:this.manufacturing.project.scenes.find(scene=>scene.scene_id===this.manufacturing.project.active_scene_id).nodes.length,spatial_body_count:this.manufacturing.spatial.config.bodies.length},event_tail:deep(this.events.slice(-80)),forge_root:''},'forge_root');
  }
}

export class AssetForgeRegistry{
  constructor(){this.sessions=new Map();}
  create(manufacturingSession,intent,options){const session=new AssetForgeSession(manufacturingSession,intent,options);this.sessions.set(session.forge_id,session);return session;}
  get(id){const session=this.sessions.get(id);if(!session)throw new StudioError('ASSET_FORGE_SESSION_NOT_FOUND',id);return session;}
}
