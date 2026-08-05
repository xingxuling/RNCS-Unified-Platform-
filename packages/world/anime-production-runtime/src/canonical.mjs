import {createHash} from 'node:crypto';

export function clone(value){return structuredClone(value)}
function normalize(value){
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number'){if(!Number.isFinite(value))throw new TypeError('ANIME_CANONICAL_NON_FINITE');return Object.is(value,-0)?0:value}
  if(Array.isArray(value))return value.map(normalize);
  if(value&&typeof value==='object'){
    const out={};
    for(const key of Object.keys(value).sort())if(value[key]!==undefined)out[key]=normalize(value[key]);
    return out;
  }
  throw new TypeError(`ANIME_CANONICAL_UNSUPPORTED:${typeof value}`);
}
export function canonicalJson(value){return JSON.stringify(normalize(value))}
export function rootHash(value){return createHash('sha256').update(canonicalJson(value)).digest('hex')}
export function shortRoot(value,length=24){return rootHash(value).slice(0,length)}
export function stableId(prefix,value){return `${prefix}:${shortRoot(value)}`}
export function seal(value,field='root',omit=[]){const out=clone(value);delete out[field];for(const key of omit)delete out[key];return{...clone(value),[field]:rootHash(out)}}
export function verifySeal(value,field='root',omit=[]){if(!value||typeof value!=='object'||typeof value[field]!=='string')return false;const out=clone(value),actual=out[field];delete out[field];for(const key of omit)delete out[key];return actual===rootHash(out)}
export function nowIso(){return new Date().toISOString()}
