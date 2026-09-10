import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {AtomicJsonStore} from '../src/index.mjs';

const verify=value=>({valid:value?.format==='test.bundle.v0.1'&&typeof value?.root==='string',errors:['TEST_BUNDLE_INVALID']});
const bundle=(root,version)=>({format:'test.bundle.v0.1',root,version});

test('atomic JSON store syncs, promotes valid temp data and rejects corruption',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'rncs-durable-store-')),store=new AtomicJsonStore({filePath:join(directory,'state.json'),verify,valueRoot:value=>value.root,codePrefix:'TEST_DURABLE_STORE'});
  try{
    const first=bundle('root:first',1),second=bundle('root:second',2);
    const saved=await store.save(first);assert.equal(saved.atomicRename,true);assert.equal((await store.load()).root,'root:first');
    await assert.rejects(store.save(second,{faultAt:'after-temp-sync'}),/TEST_DURABLE_STORE_FAULT:after-temp-sync/);
    const primary=await store.recover();assert.equal(primary.source,'primary');assert.equal(primary.value.root,'root:first');
    await rm(store.filePath,{force:true});const promoted=await store.recover();assert.equal(promoted.source,'temporary_promoted');assert.equal(promoted.value.root,'root:second');
    await assert.rejects(store.save(first,{faultAt:'after-rename'}),/TEST_DURABLE_STORE_FAULT:after-rename/);assert.equal((await store.recover()).source,'primary');
    await (await import('node:fs/promises')).writeFile(store.filePath,'tampered','utf8');const corrupt=await store.recover();assert.equal(corrupt.status,'CORRUPT');assert.equal(corrupt.source,null);
  }finally{await rm(directory,{recursive:true,force:true});}
});
