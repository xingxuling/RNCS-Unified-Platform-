import crypto from 'node:crypto';
import fs from 'node:fs';

export class LAFError extends Error {}
export const FORMAT='laf.artifact.v1';
export const VERSION='1.0.0';
export const ZERO_ROOT='0'.repeat(64);

function encode(v){
  if(v===null)return'null';
  if(v===true)return'true';
  if(v===false)return'false';
  if(typeof v==='number'){
    if(!Number.isSafeInteger(v))throw new LAFError('LAF_HASH_FLOAT_FORBIDDEN: use integer or decimal string');
    return String(v);
  }
  if(typeof v==='string')return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(encode).join(',')+']';
  if(typeof v==='object'){
    const keys=Object.keys(v).sort((a,b)=>Buffer.compare(Buffer.from(a,'utf8'),Buffer.from(b,'utf8')));
    return '{'+keys.map(k=>encode(k)+':'+encode(v[k])).join(',')+'}';
  }
  throw new LAFError(`LAF_HASH_TYPE_UNSUPPORTED:${typeof v}`);
}
export const canonicalJson=encode;
export const rootHash=v=>crypto.createHash('sha256').update(encode(v),'utf8').digest('hex');
export const isHex64=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const clone=v=>structuredClone(v);

export function componentRoots(a){
 return {
  semantic_root:rootHash(a.semantics), authority_root:rootHash(a.authority),
  affordance_root:rootHash(a.affordances), capability_root:rootHash(a.capabilities),
  projection_root:rootHash(a.projections), host_state_root:rootHash(a.host_state_refs),
 };
}
export function revisionPayload(a,roots=componentRoots(a)){
 const c=a.continuity.current;
 return {artifact_id:a.identity.artifact_id,revision:c.revision,parent_revision_root:c.parent_revision_root??null,branch:c.branch,binding_status:c.binding_status,authoritative_generation:c.authoritative_generation,committed_transition_ref:c.committed_transition_ref??null,...roots};
}
export function artifactPayload(a){const o=clone(a);delete o.evidence;return o;}
export function validateArtifact(a){
 const errors=[]; const check=(c,x)=>{if(!c)errors.push(x)};
 if(!a||typeof a!=='object')return{valid:false,errors:['ARTIFACT_NOT_OBJECT']};
 check(a.format===FORMAT,'FORMAT_INVALID');check(a.laf_version===VERSION,'VERSION_INVALID');
 try{
  check(Boolean(a.identity.artifact_id),'ARTIFACT_ID_REQUIRED');check(Boolean(a.identity.kind),'KIND_REQUIRED');check(Boolean(a.identity.title),'TITLE_REQUIRED');
  const c=a.continuity.current,g=c.authoritative_generation;
  check(Number.isSafeInteger(c.revision)&&c.revision>=0,'REVISION_INVALID');check(isHex64(c.revision_root),'REVISION_ROOT_INVALID');
  check(Boolean(g.reality_id),'REALITY_ID_REQUIRED');check(Number.isSafeInteger(g.generation)&&g.generation>=0,'GENERATION_INVALID');check(isHex64(g.generation_root),'GENERATION_ROOT_INVALID');
  check(['unbound','bound'].includes(c.binding_status),'BINDING_STATUS_INVALID');
  if(c.binding_status==='bound')check(Boolean(c.committed_transition_ref),'BOUND_TRANSITION_REF_REQUIRED');
  for(const ref of a.host_state_refs??[]){check(!('generation'in ref),'HOST_STATE_MUST_NOT_DECLARE_GENERATION');check('snapshot_sequence'in ref,'HOST_STATE_SNAPSHOT_SEQUENCE_REQUIRED');}
  const roots=componentRoots(a);for(const[k,v]of Object.entries(roots))check(a.evidence?.[k]===v,`${k.toUpperCase()}_MISMATCH`);
  check(rootHash(revisionPayload(a,roots))===c.revision_root,'REVISION_ROOT_MISMATCH');
  check(rootHash(artifactPayload(a))===a.evidence?.artifact_root,'ARTIFACT_ROOT_MISMATCH');
  check(a.continuity.branches?.[c.branch]===c.revision_root,'BRANCH_HEAD_MISMATCH');
 }catch(e){errors.push(`VALIDATE_EXCEPTION:${e.constructor.name}:${e.message}`)}
 return{valid:errors.length===0,errors,artifact_root:a.evidence?.artifact_root,revision_root:a.continuity?.current?.revision_root};
}
export function readArtifact(path){return JSON.parse(fs.readFileSync(path,'utf8'));}
