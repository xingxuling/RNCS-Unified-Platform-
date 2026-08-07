import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rootHash} from '../packages/world/native-character-morphogenesis-runtime/src/canonical.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=process.argv.indexOf('--evidence');
const dir=arg>=0?path.resolve(process.argv[arg+1]):path.join(repoRoot,'evidence/anime-forge-phase6-6-native-drawing-infrastructure-v0.1');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const required=['static-gates.json','frame-manifest.json','lower-body-certificate.json','episode.wav','episode.mp4','ffprobe-report.json','backend-receipt.json','phase-status.json','evidence-ledger.json','evidence-summary.json'];
const failures=[];
for(const name of required)if(!fs.existsSync(path.join(dir,name)))failures.push(`MISSING:${name}`);

if(!failures.length){
  const gates=read('static-gates.json'),frames=read('frame-manifest.json'),lower=read('lower-body-certificate.json'),backend=read('backend-receipt.json'),status=read('phase-status.json'),ledger=read('evidence-ledger.json'),summary=read('evidence-summary.json');
  if(gates.status!=='passed'||gates.entries?.length!==3)failures.push('STATIC_VECTOR_GATES_FAILED');
  if(gates.lower_body_status!=='represented-in-canonical-morphology-v0.2-candidate'||!gates.lower_body_certificate_root)failures.push('STATIC_LOWER_BODY_EVIDENCE_MISSING');
  if(!Number.isFinite(Number(gates.presentation_translate_y)))failures.push('STATIC_PRESENTATION_TRANSFORM_MISSING');
  if(!gates.entries.every(entry=>entry.svg?.sha256&&entry.vector_png?.sha256&&entry.phase6_5_baseline?.sha256&&entry.drawing_mesh?.sha256&&entry.drawing_mesh_root&&entry.deformed_mesh_root&&entry.deformed_drawing_ir_root&&entry.presentation_source_root&&entry.presentation_transform?.format==='rncs.drawing-presentation-transform.v0.1'&&entry.final_drawing_ir_root&&entry.full_body_drawing_certificate_root))failures.push('STATIC_AB_MESH_OR_PRESENTATION_EVIDENCE_INCOMPLETE');
  if(frames.frame_count!==120||frames.width!==1280||frames.height!==720||frames.frames?.length!==120)failures.push('FRAME_MANIFEST_INVALID');
  if(frames.drawing_backend!=='fullbody-bezier+quadratic-cage'||frames.deformation_backend!=='rncs.quadratic-3x3-drawing-cage.v0.1'||frames.presentation_backend!=='rncs.drawing-presentation-transform.v0.1'||frames.raster_backend!=='librsvg')failures.push('VECTOR_DEFORMATION_PRESENTATION_BACKEND_CONTRACT_INVALID');
  if(frames.lower_body_status!=='represented-in-canonical-morphology-v0.2-candidate'||!frames.lower_body_certificate_root)failures.push('FRAME_LOWER_BODY_STATUS_INVALID');
  if(!frames.frames.every(frame=>frame.lower_body_status==='represented-in-canonical-morphology-v0.2-candidate'&&frame.full_body_drawing_certificate_root&&frame.drawing_mesh_root&&frame.deformed_mesh_root&&frame.deformation_controls_root&&frame.deformed_drawing_ir_root&&frame.presentation_source_root===frame.deformed_drawing_ir_root&&frame.presentation_transform?.format==='rncs.drawing-presentation-transform.v0.1'&&frame.final_drawing_ir_root&&frame.file?.sha256))failures.push('FRAME_ROOT_CHAIN_INCOMPLETE');
  if(lower.failures?.length||!lower.certificate_root||!Object.values(lower.gates??{}).every(gate=>gate?.pass===true&&gate.measurement!==undefined&&gate.method&&gate.evidence_root))failures.push('LOWER_BODY_CERTIFICATE_INVALID');
  if(backend.supersample_factor!==2||backend.external_visual_model!==false||backend.drawing_mesh_ir!=='rncs.anime-drawing-mesh-ir.v0.1'||backend.deformation_backend!=='rncs.quadratic-3x3-drawing-cage.v0.1'||backend.presentation_backend!=='rncs.drawing-presentation-transform.v0.1'||backend.presentation_transform?.translate_y!==summary.presentation_translate_y)failures.push('BACKEND_RECEIPT_INVALID');
  if(status.lower_body_status!=='represented-in-canonical-morphology-v0.2-candidate'||status.human_visual_acceptance!=='pending'||status.creative_production_review!=='pending-human-review')failures.push('HUMAN_OR_LOWER_BODY_GATE_INVALID');
  if(summary.lower_body_certificate_root!==ledger.lower_body_certificate_root||summary.mp4_sha256!==ledger.media_sha256)failures.push('SUMMARY_LEDGER_BINDING_MISMATCH');
  if(ledger.ledger_root!==rootHash({...ledger,ledger_root:''}))failures.push('LEDGER_ROOT_MISMATCH');
}

console.log(JSON.stringify({format:'rncs.phase6-6-verification.v0.3',passed:failures.length===0,failures,evidence_dir:dir},null,2));
if(failures.length)process.exit(1);
