import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rootHash} from '../packages/world/native-character-morphogenesis-runtime/src/canonical.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=process.argv.indexOf('--evidence');
const dir=arg>=0?path.resolve(process.argv[arg+1]):path.join(repoRoot,'evidence/anime-forge-phase6-6-native-drawing-infrastructure-v0.1');
const file=path.join(dir,'face-surface-evidence.json'),failures=[];
if(!fs.existsSync(file))failures.push('FACE_SURFACE_EVIDENCE_MISSING');
if(!failures.length){const data=JSON.parse(fs.readFileSync(file,'utf8'));if(data.format!=='rncs.phase6-6-face-surface-evidence.v0.1')failures.push('FACE_SURFACE_EVIDENCE_FORMAT_INVALID');if(data.status!=='passed')failures.push('FACE_SURFACE_EVIDENCE_STATUS_FAILED');if(data.entries?.length!==3)failures.push('FACE_SURFACE_VIEW_COUNT_INVALID');if(!data.entries?.every(entry=>entry.pass&&entry.canonical_mesh_root&&entry.surface_weighting_root&&entry.posed_mesh_root&&entry.visibility_root&&entry.face_surface_drawing_guide_root&&entry.legacy_drawing_ir_root&&entry.candidate_drawing_ir_root&&entry.legacy_drawing_ir_root!==entry.candidate_drawing_ir_root&&entry.nose_bound&&entry.mouth_bound&&entry.bound_face_operation_count>=4&&entry.legacy_bound_face_operation_count===0&&Object.values(entry.eyes??{}).every(eye=>eye.bound&&eye.entry_root)))failures.push('FACE_SURFACE_BINDING_INVALID');if(data.pose_delta?.changed!==true||!data.pose_delta?.neutral_guide_root||!data.pose_delta?.action_guide_root||data.pose_delta.neutral_guide_root===data.pose_delta.action_guide_root)failures.push('FACE_SURFACE_POSE_DELTA_INVALID');if(data.human_visual_acceptance!=='pending')failures.push('FACE_SURFACE_HUMAN_GATE_INVALID');if(data.evidence_root!==rootHash({...data,evidence_root:''}))failures.push('FACE_SURFACE_EVIDENCE_ROOT_MISMATCH');}
console.log(JSON.stringify({format:'rncs.phase6-6-face-surface-verification.v0.1',passed:failures.length===0,failures,evidence_dir:dir},null,2));if(failures.length)process.exit(1);
