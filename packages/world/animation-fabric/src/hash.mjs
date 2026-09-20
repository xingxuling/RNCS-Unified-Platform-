import {createHash} from 'node:crypto';

export function canonical(value){
  if(Array.isArray(value)) return value.map(canonical);
  if(value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
  return value;
}
export function rootHash(value){return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');}
export const clone=value=>structuredClone(value);
export function assert(condition,code){if(!condition)throw new Error(code);}
export const finite=value=>Number.isFinite(Number(value));
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
