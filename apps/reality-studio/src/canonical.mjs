import {createHash,randomUUID} from 'node:crypto';
export class StudioError extends Error{constructor(code,message='',details={}){super(`${code}${message?`: ${message}`:''}`);this.code=code;this.details=details}}
const cmp=(a,b)=>Buffer.compare(Buffer.from(a,'utf8'),Buffer.from(b,'utf8'));
export function canonicalJson(v){
 if(v===null)return'null'; if(v===true)return'true'; if(v===false)return'false';
 if(typeof v==='number'){if(!Number.isSafeInteger(v))throw new StudioError('STUDIO_FLOAT_FORBIDDEN','Use integer or decimal string');return String(v)}
 if(typeof v==='string')return JSON.stringify(v);
 if(Array.isArray(v))return`[${v.map(canonicalJson).join(',')}]`;
 if(v&&typeof v==='object')return`{${Object.keys(v).sort(cmp).map(k=>`${canonicalJson(k)}:${canonicalJson(v[k])}`).join(',')}}`;
 throw new StudioError('STUDIO_CANONICAL_UNSUPPORTED',typeof v)
}
export const rootHash=v=>createHash('sha256').update(canonicalJson(v),'utf8').digest('hex');
export const clone=v=>structuredClone(v);
export const now=()=>new Date().toISOString();
export const uid=(prefix='id')=>`${prefix}:${randomUUID()}`;
export function seal(value,field){const out=clone(value);delete out[field];out[field]=rootHash(out);return out}
export function verifySeal(value,field){if(!value||typeof value!=='object')return false;const copy=clone(value),actual=copy[field];delete copy[field];return actual===rootHash(copy)}
