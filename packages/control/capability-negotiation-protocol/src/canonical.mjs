import crypto from 'node:crypto';

export class CNPError extends Error {
  constructor(code, message, details={}) { super(message); this.name='CNPError'; this.code=code; this.details=details; }
}
export function clone(x){ return structuredClone(x); }
export function assertJsonValue(value, path='$') {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new CNPError('NON_INTEGER_NUMBER', `Only safe integers are allowed at ${path}`);
    return;
  }
  if (Array.isArray(value)) { value.forEach((v,i)=>assertJsonValue(v,`${path}[${i}]`)); return; }
  if (typeof value === 'object') {
    for (const [k,v] of Object.entries(value)) {
      if (v === undefined) throw new CNPError('UNDEFINED_VALUE', `Undefined value at ${path}.${k}`);
      assertJsonValue(v,`${path}.${k}`);
    }
    return;
  }
  throw new CNPError('UNSUPPORTED_JSON_TYPE', `Unsupported type at ${path}`);
}
export function canonicalize(value){
  assertJsonValue(value);
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const keys=Object.keys(value).sort();
  return `{${keys.map(k=>`${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
}
export function hash(value){ return crypto.createHash('sha256').update(canonicalize(value)).digest('hex'); }
export function rootOf(value, omit=[]){ const copy=clone(value); for(const k of omit) delete copy[k]; return hash(copy); }
export function seal(value, field){ const copy=clone(value); copy[field]=rootOf(copy,[field]); return copy; }
export function verifySeal(value, field){ return typeof value?.[field]==='string' && value[field]===rootOf(value,[field]); }
export function uniqueSorted(xs){ return [...new Set(xs)].sort(); }
