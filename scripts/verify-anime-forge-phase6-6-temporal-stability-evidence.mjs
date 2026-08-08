import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rootHash} from '../packages/world/native-character-morphogenesis-runtime/src/canonical.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),arg=process.argv.indexOf('--evidence'),dir=arg>=0?path.resolve(process.argv[arg+1]):path.join(repoRoot,'evidence/anime-forge-phase6-6-native-drawing-infrastructure-v0.1'),file=path.join(dir,'temporal-drawing-stability-evidence.json'),failures=[];
if(!fs.existsSync(file))failures.push('TEMPORAL_STABILITY_EVIDENCE_MISSING');
if(!failures.length){
  const data=JSON.parse(fs.readFileSync(file,'utf8')),report=data.report,summary=report?.summary;
  if(data.format!=='rncs.phase6-6-temporal-stability-evidence.v0.1')failures.push('TEMPORAL_STABILITY_EVIDENCE_FORMAT_INVALID');
  if(data.status!=='passed'||data.validation?.valid!==true)failures.push('TEMPORAL_STABILITY_EVIDENCE_STATUS_FAILED');
  if(data.frame_count!==120)failures.push('TEMPORAL_STABILITY_FRAME_COUNT_INVALID');
  if(data.svg_source!=='final-post-cage-post-presentation-episode-svg')failures.push('TEMPORAL_STABILITY_SOURCE_LAYER_INVALID');
  if(!data.frame_manifest_root)failures.push('TEMPORAL_STABILITY_FRAME_MANIFEST_ROOT_MISSING');
  if(report?.format!=='rncs.temporal-drawing-stability.v0.1'||!report.temporal_root||report.temporal_root!==rootHash({...report,temporal_root:''}))failures.push('TEMPORAL_STABILITY_REPORT_ROOT_INVALID');
  if(summary?.adjacent_same_cut_pair_count!==117)failures.push('TEMPORAL_STABILITY_PAIR_COUNT_INVALID');
  if(summary?.core_missing_count!==0)failures.push('TEMPORAL_STABILITY_CORE_MISSING');
  if(summary?.core_topology_change_count!==0)failures.push('TEMPORAL_STABILITY_CORE_TOPOLOGY_CHANGED');
  if(summary?.non_finite_geometry_count!==0)failures.push('TEMPORAL_STABILITY_NON_FINITE_GEOMETRY');
  if(!Number.isFinite(Number(summary?.max_core_normalized_displacement))||Number(summary.max_core_normalized_displacement)>Number(summary?.thresholds?.max_core_normalized_displacement??.10))failures.push('TEMPORAL_STABILITY_CORE_DISPLACEMENT_INVALID');
  if(!Number.isFinite(Number(summary?.mean_operation_churn_ratio))||Number(summary.mean_operation_churn_ratio)>Number(summary?.thresholds?.max_mean_operation_churn_ratio??.45))failures.push('TEMPORAL_STABILITY_OPERATION_CHURN_INVALID');
  if(!Number.isFinite(Number(summary?.cel_path_churn_count))||!Number.isFinite(Number(summary?.body_visibility_state_transition_count)))failures.push('TEMPORAL_STABILITY_AUXILIARY_MEASUREMENTS_INVALID');
  if(data.human_visual_acceptance!=='pending')failures.push('TEMPORAL_STABILITY_HUMAN_GATE_INVALID');
  if(data.evidence_root!==rootHash({...data,evidence_root:''}))failures.push('TEMPORAL_STABILITY_EVIDENCE_ROOT_MISMATCH');
}
console.log(JSON.stringify({format:'rncs.phase6-6-temporal-stability-verification.v0.1',passed:failures.length===0,failures,evidence_dir:dir},null,2));if(failures.length)process.exit(1);
