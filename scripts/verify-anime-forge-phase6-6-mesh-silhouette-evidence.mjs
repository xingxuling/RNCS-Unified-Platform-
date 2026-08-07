import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rootHash} from '../packages/world/native-character-morphogenesis-runtime/src/canonical.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),arg=process.argv.indexOf('--evidence'),dir=arg>=0?path.resolve(process.argv[arg+1]):path.join(repoRoot,'evidence/anime-forge-phase6-6-native-drawing-infrastructure-v0.1'),file=path.join(dir,'mesh-silhouette-evidence.json'),failures=[];
if(!fs.existsSync(file))failures.push('MESH_SILHOUETTE_EVIDENCE_MISSING');
if(!failures.length){
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  if(data.format!=='rncs.phase6-6-mesh-silhouette-evidence.v0.5')failures.push('MESH_SILHOUETTE_EVIDENCE_FORMAT_INVALID');
  if(data.status!=='passed')failures.push('MESH_SILHOUETTE_EVIDENCE_STATUS_FAILED');
  if(data.visibility_contract!=='canonical-present-visible-or-occluded'||data.required_semantic_groups?.length!==10)failures.push('MESH_SILHOUETTE_VISIBILITY_CONTRACT_INVALID');
  if(data.entries?.length!==3)failures.push('MESH_SILHOUETTE_VIEW_COUNT_INVALID');
  if(!data.entries?.every(entry=>entry.canonical_mesh_root&&entry.weighted_mesh_root&&entry.surface_weighting_root&&entry.posed_mesh_root&&entry.visibility_root&&entry.mesh_silhouette_guide_root&&entry.legacy_drawing_ir_root&&entry.candidate_drawing_ir_root&&entry.legacy_drawing_ir_root!==entry.candidate_drawing_ir_root&&entry.resolved_semantic_group_count===10&&entry.missing_canonical_groups?.length===0&&entry.comparisons?.length===10&&entry.comparisons.every(item=>item.pass&&item.canonical_triangle_count>0&&['visible','occluded'].includes(item.state)&&(item.state==='visible'?(item.changed&&item.bound&&item.rendered_operation_count>=1):item.rendered_operation_count===0))&&Array.isArray(entry.extra_visible_parts)&&entry.extra_visible_parts.every(item=>item.group&&item.guide_root&&item.part_root&&item.path_root)))failures.push('MESH_SILHOUETTE_VISIBILITY_OR_BINDING_INVALID');
  if(data.pose_delta?.changed!==true||!data.pose_delta?.neutral_guide_root||!data.pose_delta?.action_guide_root||data.pose_delta.neutral_guide_root===data.pose_delta.action_guide_root||!data.pose_delta?.neutral_part_counts||!data.pose_delta?.action_part_counts||!Array.isArray(data.pose_delta?.neutral_occluded_groups)||!Array.isArray(data.pose_delta?.action_occluded_groups))failures.push('MESH_SILHOUETTE_POSE_DELTA_INVALID');
  if(data.root_chain?.stable_across_views!==true||!data.root_chain?.canonical_mesh_root||!data.root_chain?.surface_weighting_root)failures.push('MESH_SILHOUETTE_AUTHORITY_ROOT_DRIFT');
  if(data.human_visual_acceptance!=='pending')failures.push('MESH_SILHOUETTE_HUMAN_GATE_INVALID');
  if(data.evidence_root!==rootHash({...data,evidence_root:''}))failures.push('MESH_SILHOUETTE_EVIDENCE_ROOT_MISMATCH');
}
console.log(JSON.stringify({format:'rncs.phase6-6-mesh-silhouette-verification.v0.5',passed:failures.length===0,failures,evidence_dir:dir},null,2));if(failures.length)process.exit(1);
