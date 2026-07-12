import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {UnifiedManufacturingSession,AssetForgeSession} from '@taowind/reality-studio-native';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const load=name=>JSON.parse(fs.readFileSync(path.join(root,'apps/reality-studio/examples',name),'utf8'));

export async function runAssetProductionStudioForge({outDir=path.join(root,'artifacts/asset-production-studio-forge-v010')}={}){
  fs.rmSync(outDir,{recursive:true,force:true});fs.mkdirSync(outDir,{recursive:true});
  const manufacturing=new UnifiedManufacturingSession(load('冰境试炼.unified-project.json'));
  const forge=new AssetForgeSession(manufacturing,load('霜璃.asset-intent.json'),{outDir:path.join(outDir,'production')});
  const generated=forge.generate(),initialAssetId=generated.production.asset.asset_id;
  const cinematic=generated.production.candidates.find(item=>item.variant==='cinematic');forge.select(cinematic.candidate_id,{reason:'v0.10-cinematic-review'});
  const firstPreview=forge.preview({includeRuntime:false}),firstMeshRoot=firstPreview.visual.mesh_root;
  const regenerated=forge.regenerate({constraints:{palette:['#295fd0','#f8fbff','#71e3ff','#111a38']}},{label:'v0.10-art-direction-pass'});
  const regeneratedCinematic=forge.production.current().workspace.candidates.find(item=>item.variant==='cinematic');forge.select(regeneratedCinematic.candidate_id,{reason:'v0.10-post-regeneration-review'});
  const secondPreview=forge.preview(),accepted=forge.acceptIntoProject({x:230,y:128,z:18});
  const characterId=accepted.accepted.spatial_character_id;
  for(let tick=0;tick<24;tick++){
    const commands=[{type:'move-character',characterId,direction:{x:1000000,y:0,z:180000},speedQ:1000000}];
    if(tick===8)commands.push({type:'jump-character',characterId});
    manufacturing.spatialStep({commands});
  }
  const projection=manufacturing.spatialProjection({width:384,height:216,qualityTier:'quality'}),artifacts=forge.exportArtifacts(),session=forge.inspect();
  const acceptance={
    threeCandidateProduction:generated.production.candidates.length===3&&generated.production.candidates.every(item=>item.pass),
    candidateReview:generated.production.selected_candidate_id!==cinematic.candidate_id&&firstPreview.variant==='cinematic',
    targetedRegeneration:regenerated.production.generation===2&&Boolean(regenerated.production.generations[1].regeneration_receipt_root),
    identityPreserved:regenerated.production.asset.asset_id===initialAssetId,
    unaffectedGeometryReused:firstMeshRoot===secondPreview.visual.mesh_root,
    acceptedIntoStudio:session.status==='accepted'&&session.project.asset_count===5,
    sceneInstantiation:Boolean(accepted.accepted.node_id),
    rsrEmbodiment:Boolean(accepted.accepted.spatial_body_id&&accepted.accepted.spatial_character_id),
    vsrProjection:Boolean(projection.pixel_root&&projection.png_base64?.length>100),
    evidenceRootsSeparated:new Set([artifacts.production.production_manifest.manifest_root,artifacts.preview.preview_root,artifacts.acceptance.acceptance_root,manufacturing.project.project_root,projection.frame_plan.frameRoot]).size===5
  };
  const evidence={
    format:'rncs.asset-production-studio-forge-evidence.v0.10',version:'0.10.0-alpha.1',
    versions:{ragf:'0.4.0-alpha.1',reality_studio:'1.5.0-alpha.1',rsr:'0.9.0-alpha.1',vsr:'0.8.0-alpha.1'},
    forge_id:forge.forge_id,asset_id:initialAssetId,generation:session.production.generation,selected_variant:session.preview.variant,
    roots:{production:artifacts.production.production_manifest.manifest_root,preview:artifacts.preview.preview_root,acceptance:artifacts.acceptance.acceptance_root,project:manufacturing.project.project_root,spatial_state:manufacturing.spatial.lastSnapshot.stateRoot,frame:projection.frame_plan.frameRoot,pixel:projection.pixel_root},
    created:{node_id:accepted.accepted.node_id,spatial_body_id:accepted.accepted.spatial_body_id,spatial_character_id:accepted.accepted.spatial_character_id},
    statistics:{candidate_count:generated.production.candidates.length,triangle_count:secondPreview.visual.triangle_count,pbr_file_count:secondPreview.visual.pbr_files.length,project_asset_count:session.project.asset_count,scene_node_count:session.project.scene_node_count,spatial_body_count:session.project.spatial_body_count},
    acceptance
  };
  return {evidence,png:Buffer.from(projection.png_base64,'base64'),artifacts,project:manufacturing.project};
}
