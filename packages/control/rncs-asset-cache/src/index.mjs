import {createHash,randomUUID} from 'node:crypto';
import {mkdir,open,readFile,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
import {rootHash} from '@taowind/rncs-core-contract';
import {AtomicJsonStore} from '@taowind/rncs-durable-store';

export const RNCS_ASSET_CACHE_FORMAT='rncs.content-addressed-asset-cache.v0.1';
export const RNCS_ASSET_CACHE_VERSION='0.1.0';

const clone=value=>structuredClone(value);
const uniqueSorted=values=>[...new Set((Array.isArray(values)?values:[]).map(String))].sort();
const bytesSha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=(condition,code)=>{if(!condition)throw new TypeError(code)};

function normalizeBudget(value){
  return Number.isFinite(value)?Math.max(0,Math.floor(value)):Number.MAX_SAFE_INTEGER;
}

function normalizeAsset(asset,codePrefix){
  const sha256=String(asset?.sha256??'').toLowerCase(),byteLength=asset?.byteLength;
  if(!/^[a-f0-9]{64}$/.test(sha256)||!Number.isSafeInteger(byteLength)||byteLength<0)throw new TypeError(`${codePrefix}_ASSET_DESCRIPTOR_INVALID`);
  return {sha256,byteLength,assetId:String(asset?.id??'')};
}

function toBytes(payload){
  if(payload instanceof Uint8Array)return new Uint8Array(payload);
  if(payload instanceof ArrayBuffer)return new Uint8Array(payload.slice(0));
  if(ArrayBuffer.isView(payload))return new Uint8Array(payload.buffer.slice(payload.byteOffset,payload.byteOffset+payload.byteLength));
  return new Uint8Array(payload);
}

async function syncDirectory(directoryPath){
  let handle=null;
  try{
    handle=await open(directoryPath,'r');
    await handle.sync();
    return true;
  }catch(error){
    if(['EBADF','EISDIR','EINVAL','ENOTDIR','ENOTSUP','EPERM'].includes(error.code))return false;
    throw error;
  }finally{
    if(handle)await handle.close();
  }
}

async function writeBinaryAtomically(target,bytes){
  const temporary=`${target}.${process.pid}.${randomUUID()}.tmp`;
  let handle=null;
  try{
    handle=await open(temporary,'w');
    await handle.writeFile(bytes);
    await handle.sync();
  }finally{
    if(handle)await handle.close();
  }
  try{
    await rename(temporary,target);
    await syncDirectory(path.dirname(target));
  }finally{
    try{await unlink(temporary)}catch{}
  }
}

function manifestVerifier({format,version,codePrefix}){
  return value=>{
    const errors=[];
    if(value?.format!==format)errors.push(`${codePrefix}_MANIFEST_FORMAT_INVALID`);
    if(value?.version!==version)errors.push(`${codePrefix}_MANIFEST_VERSION_INVALID`);
    if(!Number.isSafeInteger(value?.maxBytes)||value.maxBytes<0)errors.push(`${codePrefix}_MANIFEST_BUDGET_INVALID`);
    if(!Number.isSafeInteger(value?.sequence)||value.sequence<0)errors.push(`${codePrefix}_MANIFEST_SEQUENCE_INVALID`);
    if(!Array.isArray(value?.entries))errors.push(`${codePrefix}_MANIFEST_ENTRIES_INVALID`);
    else for(const entry of value.entries){
      if(!/^[a-f0-9]{64}$/.test(String(entry?.sha256??''))||!Number.isSafeInteger(entry?.byteLength)||entry.byteLength<0||!Number.isSafeInteger(entry?.lastAccess)||entry.lastAccess<0||!Array.isArray(entry?.assetIds)||!entry.assetIds.every(assetId=>typeof assetId==='string')){
        errors.push(`${codePrefix}_MANIFEST_ENTRY_INVALID`);
        break;
      }
    }
    if(!Array.isArray(value?.diagnostics)||!value.diagnostics.every(diagnostic=>typeof diagnostic==='string'))errors.push(`${codePrefix}_MANIFEST_DIAGNOSTICS_INVALID`);
    const base=clone(value??{});delete base.root;
    try{if(typeof value?.root!=='string'||value.root!==rootHash(base))errors.push(`${codePrefix}_MANIFEST_INVALID`)}catch{errors.push(`${codePrefix}_MANIFEST_INVALID`)}
    return {valid:errors.length===0,errors:uniqueSorted(errors)};
  };
}

// This provider owns discardable bytes and cache receipts only. It never owns
// canonical world state, lease authority, asset selection, or commit authority.
export function createContentAddressedAssetCache(directory,{maxBytes=Number.MAX_SAFE_INTEGER,format=RNCS_ASSET_CACHE_FORMAT,version=RNCS_ASSET_CACHE_VERSION,codePrefix='RNCS_ASSET_CACHE'}={}){
  fail(typeof directory==='string'&&directory.length>0,`${codePrefix}_DIRECTORY_REQUIRED`);
  fail(typeof format==='string'&&format.length>0,`${codePrefix}_FORMAT_REQUIRED`);
  fail(typeof version==='string'&&version.length>0,`${codePrefix}_VERSION_REQUIRED`);
  const cacheDirectory=path.resolve(directory),manifestPath=path.join(cacheDirectory,'manifest.json'),budget=normalizeBudget(maxBytes),entries=new Map();
  const manifestStore=new AtomicJsonStore({filePath:manifestPath,verify:manifestVerifier({format,version,codePrefix}),valueRoot:value=>value?.root??null,codePrefix,invalidValueCode:`${codePrefix}_MANIFEST_INVALID`,primaryMissingCode:`${codePrefix}_MANIFEST_MISSING`,primaryInvalidCode:`${codePrefix}_MANIFEST_INVALID`});
  let readyPromise,mutationQueue=Promise.resolve(),sequence=0,cacheHits=0,cacheMisses=0,cacheEvictions=0,manifestRoot,diagnostics=[];
  const entryView=entry=>({sha256:entry.sha256,byteLength:entry.byteLength,lastAccess:entry.lastAccess,assetIds:uniqueSorted(entry.assetIds)});
  const manifestBase=()=>({format,version,maxBytes:budget,sequence,entries:[...entries.values()].map(entryView).sort((a,b)=>a.sha256.localeCompare(b.sha256)),diagnostics:uniqueSorted(diagnostics)});
  const persistNow=async()=>{const base=manifestBase(),document={...base,root:rootHash(base)};await manifestStore.save(document);manifestRoot=document.root};
  const mutate=operation=>{const next=mutationQueue.then(operation);mutationQueue=next.catch(()=>{});return next};
  const filePath=sha256=>path.join(cacheDirectory,`${sha256}.bin`);
  const trim=async()=>{
    let bytesResident=[...entries.values()].reduce((sum,entry)=>sum+entry.byteLength,0);
    const candidates=[...entries.values()].sort((a,b)=>a.lastAccess-b.lastAccess||a.sha256.localeCompare(b.sha256));
    for(const entry of candidates){
      if(bytesResident<=budget)break;
      entries.delete(entry.sha256);
      bytesResident-=entry.byteLength;
      cacheEvictions++;
      try{await unlink(filePath(entry.sha256))}catch{}
    }
  };
  const applyManifest=document=>{
    entries.clear();
    sequence=document.sequence;
    manifestRoot=document.root;
    diagnostics=uniqueSorted(document.diagnostics);
    for(const entry of document.entries)entries.set(entry.sha256.toLowerCase(),{sha256:entry.sha256.toLowerCase(),byteLength:entry.byteLength,lastAccess:entry.lastAccess,assetIds:uniqueSorted(entry.assetIds)});
  };
  const load=async()=>{
    if(readyPromise)return readyPromise;
    readyPromise=(async()=>{
      await mkdir(cacheDirectory,{recursive:true});
      const recovery=await manifestStore.recover();
      if(recovery.status==='RECOVERED'){
        applyManifest(recovery.value);
        if([...entries.values()].reduce((sum,entry)=>sum+entry.byteLength,0)>budget){await trim();await persistNow()}
      }else if(recovery.status==='CORRUPT'){
        diagnostics.push(...Object.values(recovery.diagnostics??{}).filter(value=>value&&value!=='MISSING'));
        entries.clear();
        sequence=0;
        manifestRoot=undefined;
      }
    })();
    return readyPromise;
  };
  return {
    format,
    version,
    directory:cacheDirectory,
    maxBytes:budget,
    ready:load,
    async read(asset){
      const expected=normalizeAsset(asset,codePrefix);
      await load();
      const entry=entries.get(expected.sha256);
      if(!entry)return mutate(async()=>{cacheMisses++;return undefined});
      let bytes;
      try{
        bytes=new Uint8Array(await readFile(filePath(expected.sha256)));
        if(bytes.byteLength!==expected.byteLength||bytesSha256(bytes)!==expected.sha256)throw new Error(`${codePrefix}_PAYLOAD_INVALID`);
      }catch(error){
        return mutate(async()=>{
          diagnostics.push(error?.code==='ENOENT'?`${codePrefix}_PAYLOAD_MISSING`:error instanceof Error?error.message:`${codePrefix}_PAYLOAD_INVALID`);
          entries.delete(expected.sha256);
          cacheMisses++;
          try{await unlink(filePath(expected.sha256))}catch{}
          await persistNow();
          return undefined;
        });
      }
      return mutate(async()=>{
        const current=entries.get(expected.sha256);
        if(!current){cacheMisses++;return undefined}
        current.lastAccess=++sequence;
        current.assetIds=uniqueSorted([...current.assetIds,expected.assetId]);
        cacheHits++;
        await persistNow();
        return bytes;
      });
    },
    async write(asset,payload){
      const expected=normalizeAsset(asset,codePrefix),bytes=toBytes(payload);
      await load();
      if(bytes.byteLength!==expected.byteLength||bytesSha256(bytes)!==expected.sha256)throw new TypeError(`${codePrefix}_HASH_MISMATCH`);
      await writeBinaryAtomically(filePath(expected.sha256),bytes);
      try{
        await mutate(async()=>{
          entries.set(expected.sha256,{sha256:expected.sha256,byteLength:bytes.byteLength,lastAccess:++sequence,assetIds:[expected.assetId]});
          await trim();
          await persistNow();
        });
      }catch(error){
        try{await unlink(filePath(expected.sha256))}catch{}
        throw error;
      }
    },
    inspect(){
      return {format,version,directory:cacheDirectory,maxBytes:budget,manifestRoot,bytesResident:[...entries.values()].reduce((sum,entry)=>sum+entry.byteLength,0),cachedAssetIds:uniqueSorted([...entries.values()].flatMap(entry=>entry.assetIds)),cacheHits,cacheMisses,cacheEvictions,diagnostics:uniqueSorted(diagnostics)};
    }
  };
}
