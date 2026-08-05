import {clone,rootHash,seal} from '../../reality-asset-genesis-fabric/src/canonical.mjs';
import {IDENTITY_SIGNATURE_FORMAT} from './catalog.mjs';

const vector=(genome,prefix)=>genome.semantic_morph_graph.parameters.filter(item=>item.parameter_id.startsWith(prefix)).sort((a,b)=>a.parameter_id.localeCompare(b.parameter_id)).map(item=>item.normalized_value);
const pick=(genome,ids)=>ids.map(id=>genome.semantic_morph_graph.parameters.find(item=>item.parameter_id===id)?.normalized_value??0);

export function createCharacterIdentitySignature(genome){
  const payload={format:IDENTITY_SIGNATURE_FORMAT,version:'0.1.0-alpha.1',character_id:genome.character_id,genome_id:genome.genome_id,identity_root:genome.identity_root,topology_family:genome.topology_family,face_proportion_vector:vector(genome,'face.'),body_proportion_vector:vector(genome,'body.'),silhouette_vector:pick(genome,['face.face_width','face.face_length','face.jaw_width','face.chin_width','body.head_body_ratio','body.shoulder_width','body.limb_ratio']),eye_signature:pick(genome,['face.eye_size','face.eye_spacing','face.eye_angle','face.eye_depth']),jaw_signature:pick(genome,['face.jaw_width','face.jaw_angle','face.jaw_definition','face.chin_length','face.chin_projection']),nose_signature:pick(genome,['face.nose_bridge','face.nose_width','face.nose_length']),mouth_signature:pick(genome,['face.mouth_width','face.upper_lip','face.lower_lip','face.lip_projection']),palette_anchor:genome.identity_genome.palette_anchor,canonical_landmarks:{eye_line:.69,nose_tip:.61,mouth_line:.55,chin:.47,shoulder_line:.39},immutable_identity_fields:clone(genome.identity_genome.immutable_fields),signature_root:''};
  return seal(payload,'signature_root');
}

function maxDelta(a=[],b=[]){let max=0,total=0,count=Math.max(a.length,b.length);for(let index=0;index<count;index++){const delta=Math.abs((a[index]??0)-(b[index]??0));max=Math.max(max,delta);total+=delta}return{max,mean:count?total/count:0}}

export function compareCharacterIdentitySignatures(before,after,{reason='continuity-check',maxDrift=.035}={}){
  const dimensions={face:maxDelta(before?.face_proportion_vector,after?.face_proportion_vector),body:maxDelta(before?.body_proportion_vector,after?.body_proportion_vector),silhouette:maxDelta(before?.silhouette_vector,after?.silhouette_vector),eye:maxDelta(before?.eye_signature,after?.eye_signature),jaw:maxDelta(before?.jaw_signature,after?.jaw_signature),nose:maxDelta(before?.nose_signature,after?.nose_signature),mouth:maxDelta(before?.mouth_signature,after?.mouth_signature)};
  const changed=Object.entries(dimensions).filter(([,value])=>value.max>1e-8).map(([name,value])=>({dimension:name,max_delta:value.max,mean_delta:value.mean})),identityMismatch=before?.character_id!==after?.character_id||before?.topology_family!==after?.topology_family,drift=Math.max(...Object.values(dimensions).map(value=>value.max),identityMismatch?1:0),status=drift<=maxDrift?'pass':drift<=maxDrift*2?'warning':'fail';
  return seal({format:'rncs.character-continuity-report.v0.1',version:'0.1.0-alpha.1',status,pass:status==='pass',reason,before_signature_root:before?.signature_root??null,after_signature_root:after?.signature_root??null,character_id:after?.character_id??before?.character_id??null,drift_score:drift,maximum_allowed_drift:maxDrift,changed_dimensions:changed,identity_mismatch:identityMismatch,rebuild_reason:changed.length?reason:null,report_root:''},'report_root');
}

export function createCrossMediaContinuityReport(signature,projections=[]){
  const checks=projections.map(item=>({mode:item.mode,identity_signature_root:item.identity_signature_root,pass:item.identity_signature_root===signature.signature_root,projection_root:item.projection_root??rootHash(item)}));
  return seal({format:'rncs.character-cross-media-continuity.v0.1',character_id:signature.character_id,identity_signature_root:signature.signature_root,status:checks.every(item=>item.pass)?'pass':'fail',checks,report_root:''},'report_root');
}
