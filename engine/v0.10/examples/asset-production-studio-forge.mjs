import fs from 'node:fs';
import path from 'node:path';
import {UnifiedManufacturingSession,AssetForgeSession} from '@taowind/reality-studio-native';

export async function runAssetForge({project,intent,outDir}){
  const manufacturing=new UnifiedManufacturingSession(project);
  const forge=new AssetForgeSession(manufacturing,intent,{outDir:path.join(outDir,'production')});
  const generated=forge.generate();
  const cinematic=generated.production.candidates.find(item=>item.variant==='cinematic');
  forge.select(cinematic.candidate_id,{reason:'director-review'});
  const initialAssetId=generated.production.asset.asset_id;
  forge.regenerate({constraints:{palette:['#295fd0','#f8fbff','#71e3ff','#111a38']}},{label:'art-direction-pass'});
  const next=forge.production.current().workspace.candidates.find(item=>item.variant==='cinematic');
  forge.select(next.candidate_id,{reason:'post-regeneration-review'});
  const accepted=forge.acceptIntoProject({x:230,y:128,z:18});
  const projection=manufacturing.spatialProjection({width:384,height:216,qualityTier:'quality'});
  const artifacts=forge.exportArtifacts();
  const acceptance={
    threeCandidates:generated.production.candidates.length===3,
    identityPreserved:forge.inspect().production.asset.asset_id===initialAssetId,
    studioAccepted:forge.inspect().status==='accepted',
    rsrEmbodiment:Boolean(accepted.accepted.spatial_body_id&&accepted.accepted.spatial_character_id),
    vsrProjection:Boolean(projection.pixel_root&&projection.png_base64.length>100),
    rootsSeparated:new Set([artifacts.manifest.manifest_root,manufacturing.project.project_root,projection.frame_plan.frameRoot]).size===3
  };
  return {acceptance,artifacts,project:manufacturing.project,png:Buffer.from(projection.png_base64,'base64')};
}
