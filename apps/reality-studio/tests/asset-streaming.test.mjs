import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ensureUIInputProject} from '../src/scene-studio.mjs';
import {createAssetDatabase} from '../src/asset-database.mjs';
import {createAssetStreamingRuntime,streamSpatialAssets} from '../src/asset-streaming.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sample=()=>ensureUIInputProject(JSON.parse(fs.readFileSync(path.join(root,'examples','冰境试炼.unified-project.json'),'utf8')));
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'reality-studio-asset-stream-'));

test('asset database cache payloads stream into VSR receipts',async()=>{
  const dir=temp(),sourceRoot=path.join(dir,'sources'),cacheDir=path.join(dir,'cache');fs.mkdirSync(sourceRoot,{recursive:true});fs.writeFileSync(path.join(sourceRoot,'stream.glb'),'runtime-payload');
  const synced=createAssetDatabase(sample(),{cacheDir}).sync({sourceRoots:[sourceRoot]}),assetId=synced.project.assets.order.at(-1),runtime=createAssetStreamingRuntime(synced.project,{cacheDir,maxConcurrent:2});
  assert.equal(runtime.catalog.find(asset=>asset.id===assetId)?.kind,'mesh');assert.match(runtime.catalog.find(asset=>asset.id===assetId)?.uri??'',/^asset-cache:\/\/runtime\//);
  const result=await runtime.stream({requestedAssetIds:[assetId]});
  assert.deepEqual(result.readyAssetIds,[assetId]);assert.deepEqual(result.failedAssetIds,[]);assert.equal(new TextDecoder().decode(runtime.streamer.get(assetId)),'runtime-payload');assert.equal(result.receiptRoot.length,64);
});

test('missing cache payload remains explicit runtime failure evidence',async()=>{
  const dir=temp(),sourceRoot=path.join(dir,'sources'),cacheDir=path.join(dir,'cache');fs.mkdirSync(sourceRoot,{recursive:true});fs.writeFileSync(path.join(sourceRoot,'missing.glb'),'payload');
  const synced=createAssetDatabase(sample(),{cacheDir}).sync({sourceRoots:[sourceRoot]}),assetId=synced.project.assets.order.at(-1),runtime=createAssetStreamingRuntime(synced.project,{cacheDir});
  const prepared=runtime.catalog.find(asset=>asset.id===assetId);assert.ok(prepared);const key=prepared.uri.split('/').at(-1);fs.rmSync(path.join(cacheDir,key.slice(0,2),key,'payload'));
  const result=await streamSpatialAssets(synced.project,{requestedAssetIds:[assetId]},{cacheDir});
  assert.deepEqual(result.receipt.failedAssetIds,[assetId]);assert.equal(result.receipt.operations[0].errorCode,'ASSET_STREAM_PAYLOAD_MISSING');assert.equal(result.inspection.states[assetId],'failed');
});
