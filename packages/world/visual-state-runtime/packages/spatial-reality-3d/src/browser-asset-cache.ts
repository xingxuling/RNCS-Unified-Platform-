import { cryptographicHash } from '../../spec/src/index.js';

export const VSR_BROWSER_ASSET_CACHE_FORMAT='vsr.browser-asset-cache.v0.1' as const;
export const VSR_BROWSER_ASSET_CACHE_VERSION='0.1.0' as const;

export interface VSRBrowserAssetDescriptor {id?:string;sha256:string;byteLength:number}
export interface VSRBrowserAssetCacheOptions {cacheName:string;revisionRoot?:string|null;maxBytes?:number;cacheStorage?:CacheStorage;cryptoApi?:Pick<Crypto,'subtle'>;origin?:string}
export interface VSRBrowserAssetCacheInspection {format:typeof VSR_BROWSER_ASSET_CACHE_FORMAT;version:typeof VSR_BROWSER_ASSET_CACHE_VERSION;cacheName:string;revisionRoot:string|null;available:boolean;manifestRoot?:string;bytesResident:number;cachedAssetIds:string[];cacheHits:number;cacheMisses:number;cacheEvictions:number;diagnostics:string[]}

interface BrowserCacheEntry {sha256:string;byteLength:number;lastAccess:number;assetIds:string[]}
interface BrowserCacheManifest {format:typeof VSR_BROWSER_ASSET_CACHE_FORMAT;version:typeof VSR_BROWSER_ASSET_CACHE_VERSION;revisionRoot:string|null;maxBytes:number;sequence:number;entries:BrowserCacheEntry[];diagnostics:string[];root:string}

const unique=(values:unknown[]):string[]=>[...new Set(values.map(String))].sort((a,b)=>a.localeCompare(b));
const bytesFrom=(value:Uint8Array|ArrayBuffer):Uint8Array=>value instanceof Uint8Array?new Uint8Array(value):new Uint8Array(value.slice(0));
const budgetOf=(value:number|undefined):number=>Number.isFinite(value)?Math.max(0,Math.floor(value!)):Number.MAX_SAFE_INTEGER;
const descriptorOf=(asset:VSRBrowserAssetDescriptor):VSRBrowserAssetDescriptor=>{const sha256=String(asset?.sha256??'').toLowerCase(),byteLength=asset?.byteLength;if(!/^[a-f0-9]{64}$/.test(sha256)||!Number.isSafeInteger(byteLength)||byteLength<0)throw new TypeError('VSR_BROWSER_ASSET_CACHE_ASSET_INVALID');return{...asset,sha256,byteLength}};

async function sha256(cryptoApi:Pick<Crypto,'subtle'>,bytes:Uint8Array):Promise<string>{const digest=new Uint8Array(await cryptoApi.subtle.digest('SHA-256',bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer));return[...digest].map(value=>value.toString(16).padStart(2,'0')).join('')}

function manifestBase(value:Omit<BrowserCacheManifest,'root'>):Omit<BrowserCacheManifest,'root'>{return value}
function verifyManifest(value:unknown):value is BrowserCacheManifest{
  if(!value||typeof value!=='object')return false;
  const candidate=value as Partial<BrowserCacheManifest>,base={...candidate};delete (base as Partial<BrowserCacheManifest>).root;
  if(candidate.format!==VSR_BROWSER_ASSET_CACHE_FORMAT||candidate.version!==VSR_BROWSER_ASSET_CACHE_VERSION||(!Number.isSafeInteger(candidate.maxBytes)||candidate.maxBytes!<0)||(!Number.isSafeInteger(candidate.sequence)||candidate.sequence!<0)||!Array.isArray(candidate.entries)||!Array.isArray(candidate.diagnostics)||typeof candidate.root!=='string'||typeof candidate.revisionRoot!=='string'&&candidate.revisionRoot!==null)return false;
  if(candidate.diagnostics.some(value=>typeof value!=='string')||candidate.entries.some(entry=>!entry||typeof entry.sha256!=='string'||!/^[a-f0-9]{64}$/.test(entry.sha256)||!Number.isSafeInteger(entry.byteLength)||entry.byteLength<0||!Number.isSafeInteger(entry.lastAccess)||entry.lastAccess<0||!Array.isArray(entry.assetIds)||entry.assetIds.some(assetId=>typeof assetId!=='string')))return false;
  try{return candidate.root===cryptographicHash(base)}catch{return false}
}

const requestKey=(origin:string,cacheName:string,suffix:string):Request=>new Request(`${origin.replace(/\/$/,'')}/__rncs_vsr_asset_cache__/${encodeURIComponent(cacheName)}/${suffix}`);

// Browser Cache Storage lowering for the same discardable-byte provider seam as
// the Node cache. It never owns VSR leases, canonical state, or authority.
export function createVSRBrowserAssetCache(options:VSRBrowserAssetCacheOptions){
  if(!options?.cacheName)throw new TypeError('VSR_BROWSER_ASSET_CACHE_NAME_REQUIRED');
  const cacheName=String(options.cacheName),revisionRoot=options.revisionRoot===undefined?null:options.revisionRoot===null?null:String(options.revisionRoot),maxBytes=budgetOf(options.maxBytes),storage=options.cacheStorage??(globalThis as typeof globalThis&{caches?:CacheStorage}).caches,cryptoApi=options.cryptoApi??(globalThis.crypto as Pick<Crypto,'subtle'>|undefined),origin=String(options.origin??(globalThis as typeof globalThis&{location?:Location}).location?.origin??'https://rncs.invalid'),entries=new Map<string,BrowserCacheEntry>();
  let cache:Cache|undefined,readyPromise:Promise<void>|undefined,mutationQueue=Promise.resolve(),sequence=0,manifestRoot:string|undefined,cacheHits=0,cacheMisses=0,cacheEvictions=0,diagnostics:string[]=[],available=Boolean(storage&&cryptoApi?.subtle);
  const payloadRequest=(sha256Value:string)=>requestKey(origin,cacheName,`${sha256Value}.bin`),manifestRequest=()=>requestKey(origin,cacheName,'manifest.json');
  const entryView=(entry:BrowserCacheEntry)=>({sha256:entry.sha256,byteLength:entry.byteLength,lastAccess:entry.lastAccess,assetIds:unique(entry.assetIds)});
  const base=():Omit<BrowserCacheManifest,'root'>=>({format:VSR_BROWSER_ASSET_CACHE_FORMAT,version:VSR_BROWSER_ASSET_CACHE_VERSION,revisionRoot,maxBytes,sequence,entries:[...entries.values()].map(entryView).sort((a,b)=>a.sha256.localeCompare(b.sha256)),diagnostics:unique(diagnostics)});
  const persist=async()=>{if(!cache)return;const document={...manifestBase(base()),root:cryptographicHash(base())} as BrowserCacheManifest;await cache.put(manifestRequest(),new Response(JSON.stringify(document),{status:200,headers:{'content-type':'application/json','x-rncs-root':document.root}}));manifestRoot=document.root};
  const mutate=(operation:()=>Promise<void>)=>{const next=mutationQueue.then(operation);mutationQueue=next.catch(()=>{});return next};
  const clearCache=async()=>{if(!cache)return;for(const request of await cache.keys())await cache.delete(request)};
  const applyManifest=(document:BrowserCacheManifest)=>{entries.clear();sequence=document.sequence;manifestRoot=document.root;diagnostics=unique(document.diagnostics);for(const entry of document.entries)entries.set(entry.sha256,{sha256:entry.sha256,byteLength:entry.byteLength,lastAccess:entry.lastAccess,assetIds:unique(entry.assetIds)})};
  const trim=async()=>{if(!cache)return;let bytesResident=[...entries.values()].reduce((sum,entry)=>sum+entry.byteLength,0);const candidates=[...entries.values()].sort((a,b)=>a.lastAccess-b.lastAccess||a.sha256.localeCompare(b.sha256));for(const entry of candidates){if(bytesResident<=maxBytes)break;entries.delete(entry.sha256);bytesResident-=entry.byteLength;cacheEvictions++;await cache.delete(payloadRequest(entry.sha256))}};
  const load=async()=>{if(readyPromise)return readyPromise;readyPromise=(async()=>{if(!available||!storage||!cryptoApi?.subtle){available=false;diagnostics.push('VSR_BROWSER_ASSET_CACHE_UNAVAILABLE');return}try{cache=await storage.open(cacheName);const response=await cache.match(manifestRequest());if(!response)return;const value=await response.json();if(!verifyManifest(value)){diagnostics.push('VSR_BROWSER_ASSET_CACHE_MANIFEST_INVALID');await clearCache();entries.clear();sequence=0;manifestRoot=undefined;await persist();return}if(value.revisionRoot!==revisionRoot){diagnostics.push(`VSR_BROWSER_ASSET_CACHE_REVISION_CHANGED:${value.revisionRoot??'none'}:${revisionRoot??'none'}`);await clearCache();entries.clear();sequence=0;manifestRoot=undefined;await persist();return}applyManifest(value);if([...entries.values()].reduce((sum,entry)=>sum+entry.byteLength,0)>maxBytes){await trim();await persist()}}catch(error){available=false;diagnostics.push(error instanceof Error?error.message:'VSR_BROWSER_ASSET_CACHE_OPEN_FAILED')}})();return readyPromise};
  return {
    format:VSR_BROWSER_ASSET_CACHE_FORMAT,
    version:VSR_BROWSER_ASSET_CACHE_VERSION,
    ready:load,
    async read(asset:VSRBrowserAssetDescriptor):Promise<Uint8Array|undefined>{const expected=descriptorOf(asset);await load();if(!available||!cache||!cryptoApi?.subtle){cacheMisses++;return undefined}const entry=entries.get(expected.sha256);if(!entry){cacheMisses++;return undefined}try{const response=await cache.match(payloadRequest(expected.sha256));if(!response)throw new Error('VSR_BROWSER_ASSET_CACHE_PAYLOAD_MISSING');const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.byteLength!==expected.byteLength||await sha256(cryptoApi,bytes)!==expected.sha256)throw new Error('VSR_BROWSER_ASSET_CACHE_PAYLOAD_INVALID');return mutate(async()=>{const current=entries.get(expected.sha256);if(!current){cacheMisses++;return}current.lastAccess=++sequence;current.assetIds=unique([...current.assetIds,String(expected.id??'')]);cacheHits++;await persist()}).then(()=>new Uint8Array(bytes))}catch(error){await mutate(async()=>{diagnostics.push(error instanceof Error?error.message:'VSR_BROWSER_ASSET_CACHE_PAYLOAD_INVALID');entries.delete(expected.sha256);cacheMisses++;await cache!.delete(payloadRequest(expected.sha256));await persist()});return undefined}},
    async write(asset:VSRBrowserAssetDescriptor,payload:Uint8Array|ArrayBuffer):Promise<void>{const expected=descriptorOf(asset),bytes=bytesFrom(payload);await load();if(!available||!cache||!cryptoApi?.subtle)return;if(bytes.byteLength!==expected.byteLength||await sha256(cryptoApi,bytes)!==expected.sha256){diagnostics.push('VSR_BROWSER_ASSET_CACHE_HASH_MISMATCH');return}try{const body=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;await cache.put(payloadRequest(expected.sha256),new Response(body,{status:200,headers:{'content-type':'application/octet-stream','x-rncs-sha256':expected.sha256}}));await mutate(async()=>{entries.set(expected.sha256,{sha256:expected.sha256,byteLength:bytes.byteLength,lastAccess:++sequence,assetIds:[String(expected.id??'')]});await trim();await persist()})}catch(error){diagnostics.push(error instanceof Error?error.message:'VSR_BROWSER_ASSET_CACHE_WRITE_FAILED')}},
    inspect():VSRBrowserAssetCacheInspection{return{format:VSR_BROWSER_ASSET_CACHE_FORMAT,version:VSR_BROWSER_ASSET_CACHE_VERSION,cacheName,revisionRoot,available,manifestRoot,bytesResident:[...entries.values()].reduce((sum,entry)=>sum+entry.byteLength,0),cachedAssetIds:unique([...entries.values()].flatMap(entry=>entry.assetIds)),cacheHits,cacheMisses,cacheEvictions,diagnostics:unique(diagnostics)}}
  };
}
