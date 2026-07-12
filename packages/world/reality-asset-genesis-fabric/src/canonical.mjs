import {createHash} from 'node:crypto';

export class GenesisError extends Error {
  constructor(code, detail='') { super(`${code}${detail ? `: ${detail}` : ''}`); this.name='GenesisError'; this.code=code; this.detail=detail; }
}

export function clone(value) { return structuredClone(value); }
function normalize(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new GenesisError('NON_FINITE_NUMBER');
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'object') {
    const out={};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) out[key]=normalize(value[key]);
    }
    return out;
  }
  throw new GenesisError('UNSUPPORTED_CANONICAL_TYPE', typeof value);
}
export function canonicalJson(value) { return JSON.stringify(normalize(value)); }
export function rootHash(value) { return createHash('sha256').update(canonicalJson(value)).digest('hex'); }
export function shortRoot(value, n=24) { return rootHash(value).slice(0,n); }
export function seal(value, field='root', omit=[]) {
  const out=clone(value); delete out[field]; for (const key of omit) delete out[key];
  const sealed=clone(value); sealed[field]=rootHash(out); return sealed;
}
export function verifySeal(value, field='root', omit=[]) {
  if (!value || typeof value !== 'object' || typeof value[field] !== 'string') return false;
  const out=clone(value); const actual=out[field]; delete out[field]; for (const key of omit) delete out[key];
  return actual===rootHash(out);
}
export function stableId(prefix, value) { return `${prefix}:${shortRoot(value)}`; }
export function nowIso() { return new Date().toISOString(); }
export function clamp(n,min=0,max=10000) { return Math.max(min,Math.min(max,Math.round(Number(n)||0))); }
export function seededRandom(seedText) {
  let state=parseInt(rootHash(seedText).slice(0,8),16)>>>0;
  return ()=>{ state=(Math.imul(state,1664525)+1013904223)>>>0; return state/0x100000000; };
}
