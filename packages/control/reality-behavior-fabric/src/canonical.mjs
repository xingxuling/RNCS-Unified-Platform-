import {createHash} from 'node:crypto';

export class BehaviorError extends Error {
  constructor(code, detail='') { super(`${code}${detail ? `: ${detail}` : ''}`); this.name='BehaviorError'; this.code=code; this.detail=detail; }
}
export const clone=value=>structuredClone(value);
function normalize(value){
  if(value===null||typeof value==='string'||typeof value==='boolean') return value;
  if(typeof value==='number'){
    if(!Number.isFinite(value)) throw new BehaviorError('NON_FINITE_NUMBER');
    return Object.is(value,-0)?0:Number(value.toFixed(9));
  }
  if(Array.isArray(value)) return value.map(normalize);
  if(typeof value==='object'){
    const out={};
    for(const key of Object.keys(value).sort()) if(value[key]!==undefined) out[key]=normalize(value[key]);
    return out;
  }
  throw new BehaviorError('UNSUPPORTED_CANONICAL_TYPE',typeof value);
}
export const canonicalJson=value=>JSON.stringify(normalize(value));
export const rootHash=value=>createHash('sha256').update(canonicalJson(value)).digest('hex');
export const shortRoot=(value,n=24)=>rootHash(value).slice(0,n);
export function seal(value,field='root',omit=[]){const out=clone(value);delete out[field];for(const k of omit)delete out[k];const sealed=clone(value);sealed[field]=rootHash(out);return sealed;}
export function verifySeal(value,field='root',omit=[]){if(!value||typeof value!=='object'||typeof value[field]!=='string')return false;const out=clone(value),actual=out[field];delete out[field];for(const k of omit)delete out[k];return actual===rootHash(out);}
export const stableId=(prefix,value)=>`${prefix}:${shortRoot(value)}`;
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
export function deepGet(obj,path){
  if(path===''||path===undefined||path===null) return obj;
  const parts=Array.isArray(path)?path:String(path).split('.').filter(Boolean);
  let cur=obj; for(const p of parts){if(cur===null||cur===undefined)return undefined;cur=cur[p];} return cur;
}
export function deepSet(obj,path,value){
  const parts=Array.isArray(path)?path:String(path).split('.').filter(Boolean); if(!parts.length) throw new BehaviorError('PATH_REQUIRED');
  let cur=obj; for(let i=0;i<parts.length-1;i++){const p=parts[i];if(!cur[p]||typeof cur[p]!=='object')cur[p]={};cur=cur[p];}cur[parts.at(-1)]=clone(value);return obj;
}
export function deepDelete(obj,path){const parts=String(path).split('.').filter(Boolean);let cur=obj;for(let i=0;i<parts.length-1;i++){cur=cur?.[parts[i]];if(!cur)return false;}return delete cur[parts.at(-1)];}
export function createPrng(seedText){
  let state=parseInt(rootHash(seedText).slice(0,8),16)>>>0;
  return {next(){state=(Math.imul(state,1664525)+1013904223)>>>0;return state/0x100000000;},int(min,max){return Math.floor(this.next()*(max-min+1))+min;},get state(){return state;},set state(v){state=Number(v)>>>0;}};
}
export const nowIso=()=>new Date().toISOString();
