import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rootHash} from '../packages/world/native-character-morphogenesis-runtime/src/canonical.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=process.argv.indexOf('--evidence');
const dir=arg>=0?path.resolve(process.argv[arg+1]):path.join(repoRoot,'evidence/anime-forge-phase6-6-native-drawing-infrastructure-v0.1');
const file=path.join(dir,'hair-surface-evidence.json'),failures=[];
if(!fs.existsSync(file))failures.push('HAIR_SURFACE_EVIDENCE_MISSING');
if(!failures.length){const data=JSON.parse(fs.readFileSync(file,'utf8'));if(data.format!=='rncs.phase6-6-hair-surface-evidence.v0.1')failures.push('HAIR_SURFACE_EVIDENCE_FORMAT_INVALID');if(data.status!=='passed')failures.push('HAIR_SURFACE_EVIDENCE_STATUS_FAILED');if(data.entries?.length!==3)failures.push('HAIR_SURFACE_VIEW_COUNT_INVALID');if(!data.entries?.every(entry=>entry.pass&&entry.canonical_mesh_root&&entry.surface_weighting_root&&entry.pose_root&&entry.visibility_root&&entry.hair_surface_drawing_guide_root&&entry.scalp_attachment_root&&entry.roots_preserved&&entry.legacy_drawing_ir_root&&entry.candidate_drawing_ir_root&&entry.legacy_drawing_ir_root!==entry.candidate_drawing_ir_root&&entry.highlight_bound&&entry.comparisons?.length>=3&&entry.comparisons.every(item=>item.changed&&item.bound&&item.hair_surface_contour_root&&item.root_attachment_ids?.length)))failures.push('HAIR_SURFACE_BINDING_INVALID');if(data.secondary_motion?.scalp_screen_roots_stable!==true||data.secondary_motion?.crown_contour_changed!==true||data.secondary_motion?.roots_preserved!==true||!data.secondary_motion?.zero_guide_root||!data.secondary_motion?.lagged_guide_root||data.secondary_motion.zero_guide_root===data.secondary_motion.lagged_guide_root)failures.push('HAIR_SURFACE_SECONDARY_MOTION_INVALID');if(data.human_visual_acceptance!=='pending')failures.push('HAIR_SURFACE_HUMAN_GATE_INVALID');if(data.evidence_root!==rootHash({...data,evidence_root:''}))failures.push('HAIR_SURFACE_EVIDENCE_ROOT_MISMATCH');}
console.log(JSON.stringify({format:'rncs.phase6-6-hair-surface-verification.v0.1',passed:failures.length===0,failures,evidence_dir:dir},null,2));if(failures.length)process.exit(1);
