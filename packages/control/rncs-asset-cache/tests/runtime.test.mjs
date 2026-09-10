import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createContentAddressedAssetCache} from '../src/index.mjs';

const sha256=payload=>createHash('sha256').update(payload).digest('hex');
const asset=(id,payload)=>({id,sha256:sha256(payload),byteLength:payload.byteLength});

test('content-addressed cache persists verified bytes and rehydrates cold',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'rncs-asset-cache-')),payload=new TextEncoder().encode('mesh-payload'),descriptor=asset('asset:mesh',payload);
  try{
    const cache=createContentAddressedAssetCache(directory);
    await cache.ready();
    assert.equal(await cache.read(descriptor),undefined);
    await cache.write(descriptor,payload);
    assert.deepEqual([...await cache.read(descriptor)],[...payload]);
    assert.equal(cache.inspect().cacheHits,1);
    const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));
    assert.equal(manifest.format,'rncs.content-addressed-asset-cache.v0.1');
    assert.equal(typeof manifest.root,'string');
    const cold=createContentAddressedAssetCache(directory);
    await cold.ready();
    assert.deepEqual([...await cold.read(descriptor)],[...payload]);
    assert.equal(cold.inspect().cacheHits,1);
  }finally{await rm(directory,{recursive:true,force:true})}
});

test('cache rejects bad writes and drops a tampered payload before rehydrate',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'rncs-asset-cache-tamper-')),payload=new TextEncoder().encode('verified'),descriptor=asset('asset:verified',payload);
  try{
    const cache=createContentAddressedAssetCache(directory);
    await assert.rejects(cache.write(descriptor,new TextEncoder().encode('tampered')),/RNCS_ASSET_CACHE_HASH_MISMATCH/);
    await cache.write(descriptor,payload);
    await writeFile(join(directory,`${descriptor.sha256}.bin`),new TextEncoder().encode('tampered'));
    assert.equal(await cache.read(descriptor),undefined);
    assert.equal(cache.inspect().cacheMisses,1);
    assert.ok(cache.inspect().diagnostics.some(value=>value.includes('RNCS_ASSET_CACHE_PAYLOAD_INVALID')));
  }finally{await rm(directory,{recursive:true,force:true})}
});

test('cache rejects a tampered manifest root before rehydrate',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'rncs-asset-cache-manifest-')),payload=new TextEncoder().encode('manifest-bound'),descriptor=asset('asset:manifest',payload);
  try{
    const cache=createContentAddressedAssetCache(directory);
    await cache.write(descriptor,payload);
    const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));
    manifest.sequence++;
    await writeFile(join(directory,'manifest.json'),JSON.stringify(manifest));
    const cold=createContentAddressedAssetCache(directory);
    await cold.ready();
    assert.equal(await cold.read(descriptor),undefined);
    assert.ok(cold.inspect().diagnostics.some(value=>value.includes('RNCS_ASSET_CACHE_MANIFEST_INVALID')));
  }finally{await rm(directory,{recursive:true,force:true})}
});

test('cache trims deterministically by resident byte budget',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'rncs-asset-cache-lru-')),first=new TextEncoder().encode('first'),second=new TextEncoder().encode('second'),one=asset('asset:first',first),two=asset('asset:second',second);
  try{
    const cache=createContentAddressedAssetCache(directory,{maxBytes:second.byteLength});
    await cache.write(one,first);
    await cache.write(two,second);
    assert.equal(await cache.read(one),undefined);
    assert.deepEqual([...await cache.read(two)],[...second]);
    const inspection=cache.inspect();
    assert.equal(inspection.cacheEvictions,1);
    assert.equal(inspection.cacheHits,1);
    assert.equal(inspection.cacheMisses,1);
    assert.deepEqual(inspection.cachedAssetIds,['asset:second']);
    assert.equal(inspection.bytesResident,second.byteLength);
  }finally{await rm(directory,{recursive:true,force:true})}
});
