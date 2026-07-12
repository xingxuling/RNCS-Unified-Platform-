import {createHash, randomUUID} from 'node:crypto';
export class GatewayError extends Error { constructor(code,message=code,details={}){super(message);this.name='GatewayError';this.code=code;this.details=details;} }
const sort=(a,b)=>a<b?-1:a>b?1:0;
export const clone=x=>structuredClone(x);
export function canonicalJson(v){
  if(v===null)return 'null'; if(v===true)return 'true'; if(v===false)return 'false';
  if(typeof v==='string')return JSON.stringify(v);
  if(typeof v==='number'){if(!Number.isFinite(v))throw new GatewayError('CANONICAL_NON_FINITE');if(Object.is(v,-0))return '0';return JSON.stringify(v);}
  if(Array.isArray(v))return `[${v.map(canonicalJson).join(',')}]`;
  if(v&&typeof v==='object')return `{${Object.keys(v).sort(sort).map(k=>`${canonicalJson(k)}:${canonicalJson(v[k])}`).join(',')}}`;
  throw new GatewayError('CANONICAL_UNSUPPORTED',typeof v);
}
export const hash=v=>createHash('sha256').update(canonicalJson(v)).digest('hex');
export function seal(v,field){const o=clone(v);delete o[field];o[field]=hash(o);return o;}
export function verifySeal(v,field){if(!v||typeof v[field]!=='string')return false;const o=clone(v);delete o[field];return hash(o)===v[field];}
export const id=prefix=>`${prefix}:${randomUUID()}`;
export const now=()=>new Date().toISOString();
