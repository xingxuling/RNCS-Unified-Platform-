import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {UnifiedManufacturingSession,ensureUIInputProject} from '../src/scene-studio.mjs';
import {ASSET_DATABASE_VERSION,createAssetDatabase,deriveAssetCacheKey} from '../src/asset-database.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sample=()=>ensureUIInputProject(JSON.parse(fs.readFileSync(path.join(root,'examples','冰境试炼.unified-project.json'),'utf8')));
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'reality-studio-asset-db-'));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);return file};
const cachePayload=(cacheDir,key)=>path.join(cacheDir,key.slice(0,2),key,'payload');

test('asset database exposes a versioned incremental contract',()=>assert.equal(ASSET_DATABASE_VERSION,'1.4.0-alpha.1'));

test('change plan distinguishes added and unchanged sources',()=>{
  const d=temp(),cache=path.join(d,'cache');write(path.join(d,'hero.png'),'one');
  const db=createAssetDatabase(sample(),{cacheDir:cache,profiles:['runtime','preview']});
  const first=db.plan({sourceRoots:[d]});
  assert.equal(first.items.length,1);assert.equal(first.source_root_ids.length,1);assert.equal(first.items[0].status,'added');assert.equal(first.items[0].cache.runtime.status,'miss');assert.equal(first.items[0].source_root,undefined);assert.equal(first.items[0].previous,undefined);assert.match(first.items[0].source_key,/^[a-f0-9]{24}::/);
  const synced=db.sync({sourceRoots:[d],profiles:['runtime','preview']});
  assert.equal(synced.summary.added,1);assert.equal(synced.summary.cache_builds,2);assert.ok(synced.sync_receipt.sync_root);
  const second=db.plan({sourceRoots:[d]});
  assert.equal(second.items[0].status,'unchanged');assert.equal(second.items[0].cache.runtime.status,'hit');
});

test('sync materializes content-addressed payloads and reuses cache hits',()=>{
  const d=temp(),cache=path.join(d,'cache'),file=write(path.join(d,'nested','sound.wav'),'wave');
  const db=createAssetDatabase(sample(),{cacheDir:cache});
  const first=db.sync({sourceRoots:[d]});const record=first.project.assets.registry[first.project.assets.order.at(-1)];
  const key=deriveAssetCacheKey(record,{profile:'runtime'});
  assert.equal(first.artifacts[0].status,'built');assert.ok(fs.existsSync(cachePayload(cache,key)));assert.equal(fs.readFileSync(cachePayload(cache,key),'utf8'),'wave');
  const second=db.sync({sourceRoots:[d]});
  assert.equal(second.summary.unchanged,1);assert.equal(second.summary.cache_hits,1);assert.equal(second.artifacts[0].status,'hit');assert.equal(second.project.assets.registry[record.asset_id].asset_id,record.asset_id);
  assert.ok(fs.existsSync(file));
});

test('changed source preserves identity, advances generation and creates a new cache key',()=>{
  const d=temp(),cache=path.join(d,'cache'),file=write(path.join(d,'hero.glb'),'v1'),db=createAssetDatabase(sample(),{cacheDir:cache});
  const first=db.sync({sourceRoots:[d]}),old=first.project.assets.registry[first.project.assets.order.at(-1)],oldKey=deriveAssetCacheKey(old);
  write(file,'v2');const second=db.sync({sourceRoots:[d]}),next=second.project.assets.registry[old.asset_id],newKey=deriveAssetCacheKey(next);
  assert.equal(second.summary.changed,1);assert.equal(next.asset_id,old.asset_id);assert.equal(next.import_state.generation,2);assert.notEqual(newKey,oldKey);assert.ok(fs.existsSync(cachePayload(cache,oldKey)));assert.ok(fs.existsSync(cachePayload(cache,newKey)));
});

test('removed source is retained as a missing record instead of silently deleted',()=>{
  const d=temp(),file=write(path.join(d,'removed.png'),'x'),db=createAssetDatabase(sample(),{cacheDir:path.join(d,'cache')});
  const first=db.sync({sourceRoots:[d]}),id=first.project.assets.order.at(-1);fs.unlinkSync(file);
  const second=db.sync({sourceRoots:[d]});
  assert.equal(second.summary.missing,1);assert.equal(second.project.assets.registry[id].status,'missing');assert.ok(second.project.assets.order.includes(id));
});

test('watcher emits only a new plan and supports a safe manual poll',async()=>{
  const d=temp(),db=createAssetDatabase(sample(),{cacheDir:path.join(d,'cache')}),events=[];
  write(path.join(d,'a.json'),'{}');const watcher=db.watch({sourceRoots:[d],onPlan:plan=>events.push(plan.plan_root)});
  const first=await watcher.poll({force:true});assert.equal(first.changed,true);assert.equal(events.length,1);
  const quiet=await watcher.poll();assert.equal(quiet.changed,false);write(path.join(d,'b.png'),'b');
  const second=await watcher.poll();assert.equal(second.changed,true);assert.equal(events.length,2);watcher.stop();assert.equal(watcher.inspect().running,false);
});

test('unified session and export bind the database root into the build',()=>{
  const d=temp(),sourceRoot=path.join(d,'sources'),cache=path.join(d,'cache');write(path.join(sourceRoot,'mesh.glb'),'mesh');
  const session=new UnifiedManufacturingSession(sample()),result=session.assetDatabaseSync({sourceRoots:[sourceRoot],cacheDir:cache,profiles:['runtime','preview']});
  assert.equal(result.asset_database_summary.added,1);assert.equal(result.assets.count,5);assert.equal(result.assets.database.version,ASSET_DATABASE_VERSION);assert.ok(result.asset_database_sync.sync_root);
  const exported=session.exportArtifacts();assert.ok(exported.asset_database.database_root);assert.ok(exported.asset_manifest.asset_database_root);assert.ok(exported.build_plan.files.includes('asset-database.json'));
});
