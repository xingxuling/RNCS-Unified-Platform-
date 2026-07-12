import { createHash } from 'node:crypto';
export class ICARError extends Error { constructor(code, message=''){ super(message ? `${code}: ${message}` : code); this.code=code; } }
const keySort=(a,b)=>Buffer.compare(Buffer.from(a,'utf8'),Buffer.from(b,'utf8'));
export function canonicalJson(v){
  if(v===null)return'null'; if(v===true)return'true'; if(v===false)return'false';
  if(typeof v==='number'){ if(!Number.isSafeInteger(v))throw new ICARError('ICAR_HASH_FLOAT_FORBIDDEN'); return String(v); }
  if(typeof v==='string')return JSON.stringify(v);
  if(Array.isArray(v))return`[${v.map(canonicalJson).join(',')}]`;
  if(v&&typeof v==='object')return`{${Object.keys(v).sort(keySort).map(k=>`${canonicalJson(k)}:${canonicalJson(v[k])}`).join(',')}}`;
  throw new ICARError('ICAR_HASH_TYPE_UNSUPPORTED',typeof v);
}
export const rootHash=v=>createHash('sha256').update(canonicalJson(v)).digest('hex');
export const clone=v=>structuredClone(v);
export const seal=(v,field='integrity_root')=>{const o=clone(v);delete o[field];o[field]=rootHash(o);return o};
export const verifySeal=(v,field='integrity_root')=>Boolean(v&&v[field]===rootHash(Object.fromEntries(Object.entries(v).filter(([k])=>k!==field))));
export const uniqueSorted=a=>[...new Set(a.map(String))].sort(keySort);
export const now=()=>new Date().toISOString();
