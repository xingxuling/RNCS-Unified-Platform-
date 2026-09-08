import {createHash} from 'node:crypto';
import {clone,seal,verifySeal,GenesisError} from './canonical.mjs';
import {isRegisteredRepresentationKind} from '@taowind/rncs-core-contract';

export const VISUAL_IR_FORMAT='ragf.visual-ir.v0.1';
const text=v=>typeof v==='string'&&v.trim().length>0;
const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const list=(v,name,errors)=>{if(!Array.isArray(v)){errors.push(`${name}_ARRAY_REQUIRED`);return [];}return v;};
function graph(items,name,errors){
 const ids=new Set();for(const item of items){if(!text(item?.id)||ids.has(item.id))errors.push(`${name}_ID_INVALID`);ids.add(item?.id);}
 const parents=new Map(items.map(x=>[x?.id,x?.parent_id]));
 for(const item of items){if(item?.parent_id!==null&&!ids.has(item?.parent_id))errors.push(`${name}_PARENT_INVALID`);const seen=new Set();let id=item?.id;while(id!=null&&parents.has(id)){if(seen.has(id)){errors.push(`${name}_CYCLE`);break;}seen.add(id);id=parents.get(id);}}
}
export function createVisualIR(input={}){
 const ir=seal({format:VISUAL_IR_FORMAT,character_id:input.character_id,identity_root:input.identity_root,representation_kind:input.representation_kind,geometry:clone(input.geometry??{vertices:[],triangles:[],material_ids:[]}),materials:clone(input.materials??[]),skeleton:clone(input.skeleton??{bones:[]}),layers:clone(input.layers??[]),provenance:clone(input.provenance??{}),artifacts:clone(input.artifacts??[])},'visual_ir_root');
 const result=validateVisualIR(ir);if(!result.valid)throw new GenesisError('VISUAL_IR_INVALID',result.errors.join(','));return ir;
}
export function validateVisualIR(ir){
 const errors=[];
 if(ir?.format!==VISUAL_IR_FORMAT)errors.push('FORMAT_INVALID');
 if(!text(ir?.character_id))errors.push('CHARACTER_ID_REQUIRED');if(!hash(ir?.identity_root))errors.push('IDENTITY_ROOT_INVALID');
 if(!isRegisteredRepresentationKind(ir?.representation_kind))errors.push('REPRESENTATION_KIND_INVALID');
 try{if(!verifySeal(ir,'visual_ir_root'))errors.push('VISUAL_IR_ROOT_MISMATCH');}catch{errors.push('VISUAL_IR_ROOT_MISMATCH');}
 const vertices=list(ir?.geometry?.vertices,'VERTICES',errors),triangles=list(ir?.geometry?.triangles,'TRIANGLES',errors),assignments=list(ir?.geometry?.material_ids,'MATERIAL_ASSIGNMENTS',errors);
 for(const v of vertices)if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))errors.push('VERTEX_INVALID');
 for(const t of triangles){if(!Array.isArray(t)||t.length!==3||!t.every(i=>Number.isInteger(i)&&i>=0&&i<vertices.length)||new Set(t).size!==3){errors.push('TRIANGLE_INVALID');continue;}const [a,b,c]=t.map(i=>vertices[i]);if([a,b,c].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite))){const u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(!cross.every(Number.isFinite)||cross.every(x=>x===0))errors.push('TRIANGLE_DEGENERATE');}}
 if(ir?.representation_kind==='character-mesh'&&(!vertices.length||!triangles.length))errors.push('MESH_GEOMETRY_REQUIRED');
 const materials=list(ir?.materials,'MATERIALS',errors),materialIds=new Set();for(const m of materials){if(!text(m?.id)||materialIds.has(m.id))errors.push('MATERIAL_ID_INVALID');materialIds.add(m?.id);}
 if(assignments.length!==triangles.length||assignments.some(id=>!materialIds.has(id)))errors.push('MATERIAL_ASSIGNMENT_INVALID');
 graph(list(ir?.skeleton?.bones,'BONES',errors),'BONE',errors);graph(list(ir?.layers,'LAYERS',errors),'LAYER',errors);
 if(!text(ir?.provenance?.seed)||!text(ir?.provenance?.generator)||!text(ir?.provenance?.version))errors.push('PROVENANCE_REQUIRED');
 const ids=new Set();for(const a of list(ir?.artifacts,'ARTIFACTS',errors)){if(!text(a?.id)||ids.has(a.id)||!hash(a?.sha256)||!Number.isSafeInteger(a?.byte_length)||a.byte_length<0)errors.push('ARTIFACT_INVALID');ids.add(a?.id);}
 return {valid:errors.length===0,errors:[...new Set(errors)]};
}
export function verifyVisualArtifacts(ir,artifacts=[]){
 const errors=[...validateVisualIR(ir).errors], supplied=new Map();
 for(const a of list(artifacts,'SUPPLIED_ARTIFACTS',errors)){if(!text(a?.id)||supplied.has(a.id))errors.push('SUPPLIED_ARTIFACT_ID_INVALID');supplied.set(a?.id,a);}
 for(const expected of Array.isArray(ir?.artifacts)?ir.artifacts:[]){const actual=supplied.get(expected?.id);if(!actual){errors.push(`ARTIFACT_MISSING:${expected?.id}`);continue;}if(typeof actual.bytes!=='string'&&!(actual.bytes instanceof Uint8Array)){errors.push(`ARTIFACT_BYTES_REQUIRED:${expected.id}`);continue;}const bytes=Buffer.from(actual.bytes);if(bytes.length!==expected.byte_length||createHash('sha256').update(bytes).digest('hex')!==expected.sha256)errors.push(`ARTIFACT_CONTENT_MISMATCH:${expected.id}`);supplied.delete(expected.id);}
 if(supplied.size)errors.push('UNDECLARED_ARTIFACT');
 return seal({format:'ragf.visual-verification.v0.1',visual_ir_root:ir?.visual_ir_root??null,valid:errors.length===0,errors:[...new Set(errors)],identity_evidence:'REFERENCE_BINDING_ONLY',perceptual_consistency:'NOT_EVALUATED',reproducibility:'CONTENT_INTEGRITY_ONLY',authority:'CANDIDATE_ONLY'},'verification_root');
}
