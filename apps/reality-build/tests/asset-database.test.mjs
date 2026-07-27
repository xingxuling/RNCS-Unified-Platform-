import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildProject,normalizeBuildRequest,readJson,verifyBuild,verifySeal,syncAssetDatabase,bakeAssets} from '../src/index.mjs';

const root=path.resolve(import.meta.dirname,'..');
const projectFile=path.join(root,'examples','冰境试炼.unified-project.json');
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'reality-build-asset-database-'));

test('Asset Database 同步产出可消费的缓存制品',()=>{
  const dir=temp(),sourceRoot=path.join(dir,'assets'),cacheDir=path.join(dir,'cache'),fixture=path.join(sourceRoot,'hero.svg');
  fs.mkdirSync(sourceRoot,{recursive:true});fs.writeFileSync(fixture,'<svg xmlns="http://www.w3.org/2000/svg"/>\n');
  const project={project_root:'project-root',assets:{order:[],registry:{},import_roots:[]}},request=normalizeBuildRequest({project_file:path.join(dir,'project.json'),output_dir:path.join(dir,'out'),asset_database:{enabled:true,cache_dir:cacheDir,source_roots:[sourceRoot]}});
  const first=syncAssetDatabase({project,request}),manifestA=bakeAssets({project:first.project,projectFile:projectFile,outDir:path.join(dir,'bake-a'),embed:false,assetDatabase:first});
  const second=syncAssetDatabase({project,request}),manifestB=bakeAssets({project:second.project,projectFile:projectFile,outDir:path.join(dir,'bake-b'),embed:false,assetDatabase:second});
  assert.equal(first.observation.summary.cache_builds,1);
  assert.equal(second.observation.summary.cache_hits,1);
  assert.equal(verifySeal(first.evidence,'database_root'),true);
  const rowA=Object.values(manifestA.records)[0].files[0],rowB=Object.values(manifestB.records)[0].files[0];
  assert.equal(rowA.source_kind,'asset-database-cache');assert.equal(rowA.cache_status,'hit');assert.equal(rowB.cache_status,'hit');assert.equal(rowA.sha256,rowB.sha256);
});

test('构建目标携带 Asset Database 证据',()=>{
  const out=temp(),cacheDir=path.join(out,'shared-cache');
  const request=normalizeBuildRequest({project_file:projectFile,output_dir:out,targets:['web-release','web-single','windows-portable','android-project','headless-server','replay-bundle'],asset_database:{enabled:true,cache_dir:cacheDir,source_roots:['assets']},app:{app_id:'com.taowind.assetdatabase',title:'Asset Database Evidence',version_name:'1.0.0',version_code:1},build_time:'2026-07-20T00:00:00.000Z'});
  const built=buildProject(request),database=readJson(path.join(out,'asset-database.json')),files=Object.values(database.summary);
  assert.equal(verifyBuild(out).valid,true);assert.equal(verifySeal(database,'database_root'),true);assert.ok(database.artifacts.length>0);assert.ok(files.length>0);
  assert.ok(built.core_files.some(file=>file.path==='asset-database.json'));
  for(const target of ['web-release','windows-portable','headless-server','replay-bundle'])assert.ok(fs.existsSync(path.join(out,target,'asset-database.json')));
  assert.ok(fs.existsSync(path.join(out,'android-project','app','src','main','assets','asset-database.json')));
  const artifactProject=readJson(path.join(out,'headless-server','project.json'));assert.deepEqual(artifactProject.assets.import_roots,[]);for(const record of Object.values(artifactProject.assets.registry))assert.equal(record.source?.absolute_path,undefined);
  const single=fs.readdirSync(path.join(out,'web-single')).find(file=>file.endsWith('.html'));
  assert.match(fs.readFileSync(path.join(out,'web-single',single),'utf8'),/asset_database/);
});

test('同一构建请求在缓存命中后保持构建根稳定',()=>{
  const rootDir=temp(),out=path.join(rootDir,'output'),cacheDir=path.join(rootDir,'cache');
  const request=normalizeBuildRequest({project_file:projectFile,output_dir:out,targets:['web-release'],asset_database:{enabled:true,cache_dir:cacheDir,source_roots:['assets']},app:{app_id:'com.taowind.assetrepeat',title:'Asset Repeat',version_name:'1.0.0',version_code:1},build_time:'2026-07-20T00:00:00.000Z'});
  const first=buildProject(request),second=buildProject(request);
  assert.equal(first.build_key,second.build_key);assert.equal(second.cache_hit,true);assert.equal(verifyBuild(out).valid,true);
});
