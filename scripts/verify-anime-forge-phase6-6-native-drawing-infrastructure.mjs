import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rootHash} from '../packages/world/native-character-morphogenesis-runtime/src/canonical.mjs';
import {RESVG_JS_PINNED_VERSION} from '../packages/world/native-character-morphogenesis-runtime/src/svg-raster-provider.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=process.argv.indexOf('--evidence');
const dir=arg>=0?path.resolve(process.argv[arg+1]):path.join(repoRoot,'evidence/anime-forge-phase6-6-native-drawing-infrastructure-v0.1');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const required=[
  'static-gates.json','frame-manifest.json','lower-body-certificate.json','episode.wav','episode.mp4','ffprobe-report.json',
  'backend-receipt.json','raster-provider-receipts.json','phase-status.json',
  'head-surface-evidence.json','face-surface-evidence.json','hair-surface-evidence.json','garment-surface-evidence.json','cel-shading-evidence.json','mesh-silhouette-evidence.json',
  'temporal-drawing-stability-evidence.json','temporal-evidence-bridge.json','direct-visual-bridge.json','evidence-ledger.json','evidence-summary.json'
];
const failures=[];
for(const name of required)if(!fs.existsSync(path.join(dir,name)))failures.push(`MISSING:${name}`);
const sameSet=(a,b)=>{const x=[...new Set(a)].sort(),y=[...new Set(b)].sort();return x.length===y.length&&x.every((value,index)=>value===y[index]);};
const validRasterBackend=(backend,version,pinned,pinMatch)=>backend==='librsvg'||(backend==='resvg-js'&&version===RESVG_JS_PINNED_VERSION&&pinned===RESVG_JS_PINNED_VERSION&&pinMatch===true);

if(!failures.length){
  const gates=read('static-gates.json'),frames=read('frame-manifest.json'),lower=read('lower-body-certificate.json'),backend=read('backend-receipt.json'),raster=read('raster-provider-receipts.json'),status=read('phase-status.json'),head=read('head-surface-evidence.json'),face=read('face-surface-evidence.json'),hair=read('hair-surface-evidence.json'),garment=read('garment-surface-evidence.json'),cel=read('cel-shading-evidence.json'),mesh=read('mesh-silhouette-evidence.json'),temporal=read('temporal-drawing-stability-evidence.json'),temporalBridge=read('temporal-evidence-bridge.json'),bridge=read('direct-visual-bridge.json'),ledger=read('evidence-ledger.json'),summary=read('evidence-summary.json');

  // Static Front / 3/4 / Side evidence.
  if(gates.status!=='passed'||gates.entries?.length!==3)failures.push('STATIC_VECTOR_GATES_FAILED');
  if(gates.lower_body_status!=='represented-in-canonical-morphology-v0.2-candidate'||!gates.lower_body_certificate_root)failures.push('STATIC_LOWER_BODY_EVIDENCE_MISSING');
  if(gates.surface_weighting_backend!=='rncs.field-guided-surface-weighting.v0.1')failures.push('STATIC_SURFACE_WEIGHTING_BACKEND_MISSING');
  if(!Number.isFinite(Number(gates.presentation_translate_y)))failures.push('STATIC_PRESENTATION_TRANSFORM_MISSING');
  if(!['librsvg','resvg-js'].includes(gates.raster_backend)||!gates.raster_provider_id||!gates.raster_provider_version)failures.push('STATIC_RASTER_PROVIDER_MISSING');
  if(!gates.entries?.every(entry=>entry.svg?.sha256&&entry.vector_png?.sha256&&entry.vector_png?.raster_receipt_root&&entry.vector_png?.raster_backend===gates.raster_backend&&entry.vector_png?.raster_provider_version===gates.raster_provider_version&&entry.phase6_5_baseline?.sha256&&entry.drawing_mesh?.sha256&&entry.canonical_mesh_root&&entry.weighted_mesh_root&&entry.weighted_mesh_root!==entry.canonical_mesh_root&&entry.surface_weighting_root&&Number(entry.multi_influence_ratio)>0&&entry.drawing_mesh_root&&entry.deformed_mesh_root&&entry.deformed_drawing_ir_root&&entry.presentation_source_root&&entry.presentation_transform?.format==='rncs.drawing-presentation-transform.v0.1'&&entry.final_drawing_ir_root&&entry.full_body_drawing_certificate_root))failures.push('STATIC_AB_WEIGHTING_MESH_PRESENTATION_OR_RASTER_EVIDENCE_INCOMPLETE');

  // 120-frame final drawing sequence.
  if(frames.frame_count!==120||frames.width!==1280||frames.height!==720||frames.fps!==24||frames.frames?.length!==120)failures.push('FRAME_MANIFEST_INVALID');
  if(frames.surface_weighting_backend!=='rncs.field-guided-surface-weighting.v0.1'||!frames.surface_weighting_root||frames.drawing_backend!=='fullbody-bezier+quadratic-cage'||frames.deformation_backend!=='rncs.quadratic-3x3-drawing-cage.v0.1'||frames.presentation_backend!=='rncs.drawing-presentation-transform.v0.1')failures.push('WEIGHTING_VECTOR_DEFORMATION_PRESENTATION_BACKEND_CONTRACT_INVALID');
  if(!['librsvg','resvg-js'].includes(frames.raster_backend)||!frames.raster_provider_id||!frames.raster_provider_version)failures.push('FRAME_RASTER_PROVIDER_INVALID');
  if(frames.lower_body_status!=='represented-in-canonical-morphology-v0.2-candidate'||!frames.lower_body_certificate_root)failures.push('FRAME_LOWER_BODY_STATUS_INVALID');
  if(!frames.frames?.every(frame=>frame.lower_body_status==='represented-in-canonical-morphology-v0.2-candidate'&&frame.canonical_mesh_root&&frame.weighted_mesh_root&&frame.weighted_mesh_root!==frame.canonical_mesh_root&&frame.surface_weighting_root===frames.surface_weighting_root&&Number(frame.multi_influence_ratio)>0&&frame.full_body_drawing_certificate_root&&frame.drawing_mesh_root&&frame.deformed_mesh_root&&frame.deformation_controls_root&&frame.deformed_drawing_ir_root&&frame.presentation_source_root===frame.deformed_drawing_ir_root&&frame.presentation_transform?.format==='rncs.drawing-presentation-transform.v0.1'&&frame.final_drawing_ir_root&&frame.file?.sha256&&frame.file?.raster_receipt_root&&frame.file?.raster_backend===frames.raster_backend&&frame.file?.raster_provider_version===frames.raster_provider_version))failures.push('FRAME_ROOT_OR_RASTER_CHAIN_INCOMPLETE');

  // Raster provider is an explicit execution body, not an implementation detail.
  const observedRasterRoots=[...(gates.entries??[]).map(entry=>entry.vector_png?.raster_receipt_root),...(frames.frames??[]).map(frame=>frame.file?.raster_receipt_root)].filter(Boolean),expectedRasterCount=(gates.entries?.length??0)+(frames.frames?.length??0);
  if(raster.format!=='rncs.phase6-6-raster-provider-receipts.v0.1'||!['librsvg','resvg-js'].includes(raster.backend)||!raster.provider_id||!raster.provider_version||!raster.receipt_set_root)failures.push('RASTER_PROVIDER_RECEIPT_SET_INVALID');
  if(Number(raster.receipt_count)!==expectedRasterCount||raster.receipt_roots?.length!==expectedRasterCount||new Set(raster.receipt_roots??[]).size!==expectedRasterCount)failures.push('RASTER_PROVIDER_RECEIPT_COUNT_INVALID');
  if(raster.receipt_set_root!==rootHash(raster.receipt_roots??[])||!sameSet(observedRasterRoots,raster.receipt_roots??[]))failures.push('RASTER_PROVIDER_RECEIPT_SET_MISMATCH');
  if(raster.backend==='resvg-js'&&!validRasterBackend(raster.backend,raster.provider_version,raster.pinned_provider_version,raster.pin_match))failures.push('RASTER_PROVIDER_RESVG_PIN_INVALID');
  if(raster.backend==='librsvg'&&raster.pin_match!==true)failures.push('RASTER_PROVIDER_LIBRSVG_STATE_INVALID');

  // Lower-body measured certificate remains mandatory.
  if(lower.failures?.length||!lower.certificate_root||!Object.values(lower.gates??{}).every(gate=>gate?.pass===true&&gate.measurement!==undefined&&gate.method&&gate.evidence_root))failures.push('LOWER_BODY_CERTIFICATE_INVALID');

  // Backend receipt must agree with manifests and remain non-authoritative.
  if(backend.format!=='rncs.native-drawing-backend-receipt.v0.5'||backend.supersample_factor!==2||backend.external_visual_model!==false||backend.surface_weighting_backend!=='rncs.field-guided-surface-weighting.v0.1'||backend.surface_weighting_root!==frames.surface_weighting_root||backend.drawing_mesh_ir!=='rncs.anime-drawing-mesh-ir.v0.1'||backend.deformation_backend!=='rncs.quadratic-3x3-drawing-cage.v0.1'||backend.presentation_backend!=='rncs.drawing-presentation-transform.v0.1'||backend.presentation_transform?.translate_y!==summary.presentation_translate_y)failures.push('BACKEND_RECEIPT_CORE_INVALID');
  if(backend.raster_backend!==frames.raster_backend||backend.raster_backend!==gates.raster_backend||backend.raster_backend!==raster.backend||backend.raster_provider_id!==raster.provider_id||backend.raster_backend_version!==raster.provider_version||backend.raster_provider_receipt_set_root!==raster.receipt_set_root||Number(backend.raster_provider_receipt_count)!==expectedRasterCount)failures.push('BACKEND_RASTER_PROVIDER_BINDING_INVALID');
  if(!validRasterBackend(backend.raster_backend,backend.raster_backend_version,backend.raster_provider_pinned_version,backend.raster_provider_pin_match))failures.push('BACKEND_RASTER_PROVIDER_VERSION_INVALID');
  if(backend.backend_authority?.identity!==false||backend.backend_authority?.geometry!==false||backend.backend_authority?.art_direction!==false||backend.backend_authority?.drawing_ir!==false)failures.push('BACKEND_AUTHORITY_INVALID');

  // Human boundary stays pending regardless of engineering evidence.
  if(status.lower_body_status!=='represented-in-canonical-morphology-v0.2-candidate'||status.human_visual_acceptance!=='pending'||status.creative_production_review!=='pending-human-review'||status.commercial_anime_quality!=='not-proven')failures.push('HUMAN_OR_LOWER_BODY_GATE_INVALID');
  if(status.raster_backend!==raster.backend||status.raster_provider_version!==raster.provider_version)failures.push('STATUS_RASTER_PROVIDER_MISMATCH');

  // Six direct spatial proofs.
  for(const [name,value] of Object.entries({head,face,hair,garment,cel,mesh}))if(value.status!=='passed'||value.human_visual_acceptance!=='pending'||value.evidence_root!==rootHash({...value,evidence_root:''}))failures.push(`DIRECT_VISUAL_EVIDENCE_INVALID:${name}`);
  if(bridge.format!=='rncs.phase6-6-direct-visual-bridge.v0.4'||bridge.human_visual_acceptance!=='pending'||bridge.head_surface_evidence_root!==head.evidence_root||bridge.face_surface_evidence_root!==face.evidence_root||bridge.hair_surface_evidence_root!==hair.evidence_root||bridge.garment_surface_evidence_root!==garment.evidence_root||bridge.cel_shading_evidence_root!==cel.evidence_root||bridge.mesh_silhouette_evidence_root!==mesh.evidence_root||bridge.bridge_root!==rootHash({...bridge,bridge_root:''}))failures.push('DIRECT_VISUAL_BRIDGE_INVALID');

  // Temporal proof is a separate axis from spatial visual evidence.
  if(temporal.status!=='passed'||temporal.human_visual_acceptance!=='pending'||temporal.validation?.valid!==true||temporal.evidence_root!==rootHash({...temporal,evidence_root:''})||!temporal.report?.temporal_root)failures.push('TEMPORAL_DRAWING_STABILITY_INVALID');
  if(temporalBridge.format!=='rncs.phase6-6-temporal-evidence-bridge.v0.1'||temporalBridge.temporal_drawing_stability_evidence_root!==temporal.evidence_root||temporalBridge.temporal_report_root!==temporal.report.temporal_root||temporalBridge.bridge_root!==rootHash({...temporalBridge,bridge_root:''}))failures.push('TEMPORAL_EVIDENCE_BRIDGE_INVALID');

  // Ledger binds geometry/deformation/raster/spatial/temporal/media roots.
  if(ledger.head_surface_evidence_root!==head.evidence_root||ledger.face_surface_evidence_root!==face.evidence_root||ledger.hair_surface_evidence_root!==hair.evidence_root||ledger.garment_surface_evidence_root!==garment.evidence_root||ledger.cel_shading_evidence_root!==cel.evidence_root||ledger.mesh_silhouette_evidence_root!==mesh.evidence_root||ledger.direct_visual_bridge_root!==bridge.bridge_root)failures.push('LEDGER_DIRECT_VISUAL_ROOT_MISMATCH');
  if(ledger.temporal_drawing_stability_evidence_root!==temporal.evidence_root||ledger.temporal_report_root!==temporal.report.temporal_root||ledger.temporal_evidence_bridge_root!==temporalBridge.bridge_root)failures.push('LEDGER_TEMPORAL_ROOT_MISMATCH');
  if(ledger.raster_provider_receipt_set_root!==raster.receipt_set_root||ledger.backend_receipt_root!==backend.receipt_root||ledger.frame_manifest_root!==frames.manifest_root||ledger.static_gate_root!==gates.manifest_root||ledger.surface_weighting_root!==frames.surface_weighting_root)failures.push('LEDGER_ENGINEERING_ROOT_MISMATCH');
  if(ledger.ledger_root!==rootHash({...ledger,ledger_root:''}))failures.push('LEDGER_ROOT_MISMATCH');

  // Summary is a view over the same Ledger, never a second authority.
  if(summary.head_surface_evidence_root!==ledger.head_surface_evidence_root||summary.face_surface_evidence_root!==ledger.face_surface_evidence_root||summary.hair_surface_evidence_root!==ledger.hair_surface_evidence_root||summary.garment_surface_evidence_root!==ledger.garment_surface_evidence_root||summary.cel_shading_evidence_root!==ledger.cel_shading_evidence_root||summary.mesh_silhouette_evidence_root!==ledger.mesh_silhouette_evidence_root||summary.direct_visual_bridge_root!==ledger.direct_visual_bridge_root||summary.temporal_drawing_stability_evidence_root!==ledger.temporal_drawing_stability_evidence_root||summary.temporal_report_root!==ledger.temporal_report_root||summary.temporal_evidence_bridge_root!==ledger.temporal_evidence_bridge_root||summary.ledger_root!==ledger.ledger_root)failures.push('SUMMARY_VISUAL_TEMPORAL_ROOT_MISMATCH');
  if(summary.lower_body_certificate_root!==ledger.lower_body_certificate_root||summary.surface_weighting_root!==ledger.surface_weighting_root||summary.mp4_sha256!==ledger.media_sha256||summary.raster_provider_receipt_set_root!==ledger.raster_provider_receipt_set_root)failures.push('SUMMARY_LEDGER_BINDING_MISMATCH');
  if(summary.raster_backend!==raster.backend||summary.raster_provider_id!==raster.provider_id||summary.raster_backend_version!==raster.provider_version||summary.provider!==frames.provider_id)failures.push('SUMMARY_RASTER_PROVIDER_MISMATCH');
}

console.log(JSON.stringify({format:'rncs.phase6-6-verification.v0.10',passed:failures.length===0,failures,evidence_dir:dir},null,2));
if(failures.length)process.exit(1);
