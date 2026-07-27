import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs';import os from 'node:os';import {fileURLToPath} from 'node:url';
import {normalizeBuildRequest,buildProject,verifyBuild,createBuildGraph,readJson,createBuildIdentity,verifySeal} from '../src/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),projectFile=path.join(root,'examples','冰境试炼.unified-project.json'),project=readJson(projectFile);
function dir(){return fs.mkdtempSync(path.join(os.tmpdir(),'reality-build-'));}
function req(out,targets=['web-single']){return normalizeBuildRequest({project_file:projectFile,output_dir:out,targets,app:{app_id:'com.taowind.testgame',title:'测试游戏',version_name:'1.0.0',version_code:1},build_time:'2026-07-01T00:00:00.000Z'});}
test('构建图可验证',()=>{const r=req(dir()),id=createBuildIdentity(r,project),g=createBuildGraph(r,project,id);assert.ok(verifySeal(g,'graph_root'))});
test('构建图从验证开始',()=>{const r=req(dir()),g=createBuildGraph(r,project,createBuildIdentity(r,project));assert.equal(g.nodes[0].id,'validate')});
test('构建图包含能力预检',()=>{const r=req(dir()),g=createBuildGraph(r,project,createBuildIdentity(r,project));assert.equal(g.nodes[1].id,'preflight');assert.deepEqual(g.nodes[2].depends_on,['preflight'])});
test('构建图以收据结束',()=>{const r=req(dir()),g=createBuildGraph(r,project,createBuildIdentity(r,project));assert.equal(g.nodes.at(-1).id,'receipt')});
test('单目标构建成功',()=>{const out=dir(),b=buildProject(req(out));assert.equal(b.status,'built');assert.equal(b.targets.length,1)});
test('多目标构建成功',()=>{const out=dir(),b=buildProject(req(out,['web-release','web-single','windows-portable','android-project']));assert.equal(b.targets.length,4)});
test('构建后自校验成功',()=>{const out=dir();buildProject(req(out));assert.equal(verifyBuild(out).valid,true)});
test('第二次构建命中缓存',()=>{const out=dir(),r=req(out);buildProject(r);assert.equal(buildProject(r).cache_hit,true)});
test('构建收据可验证',()=>{const out=dir();buildProject(req(out));assert.ok(verifySeal(readJson(path.join(out,'build-receipt.json')),'receipt_root'))});
test('核心文件被记录',()=>{const out=dir(),b=buildProject(req(out));assert.ok(b.core_files.length>=12);assert.ok(b.core_files.some(file=>file.path==='runtime-evidence.json'));assert.ok(b.core_files.some(file=>file.path==='spatial-runtime.manifest.json'));assert.ok(fs.existsSync(path.join(out,'spatial-snapshot.json')))});
test('能力预检被保留',()=>{const out=dir();buildProject(req(out));const p=readJson(path.join(out,'build-preflight.json'));assert.equal(p.status,'ready');assert.ok(verifySeal(p,'preflight_root'))});
test('资产清单被保留',()=>{const out=dir();buildProject(req(out));assert.ok(fs.existsSync(path.join(out,'asset-manifest.json')))});
test('临时烘焙目录会清理',()=>{const out=dir();buildProject(req(out));assert.equal(fs.existsSync(path.join(out,'_bake')),false)});
test('篡改目标文件会被发现',()=>{const out=dir();buildProject(req(out));const f=fs.readdirSync(path.join(out,'web-single')).find(x=>x.endsWith('.html'));fs.appendFileSync(path.join(out,'web-single',f),'tamper');assert.equal(verifyBuild(out).valid,false)});
test('篡改核心文件会被发现',()=>{const out=dir();buildProject(req(out));fs.appendFileSync(path.join(out,'asset-manifest.json'),'x');assert.ok(verifyBuild(out).errors.some(x=>x.code==='CORE_FILE_HASH_MISMATCH'))});
test('缺失收据会失败',()=>assert.equal(verifyBuild(dir()).valid,false));
test('不同输出目录目标根一致',()=>{const a=buildProject(req(dir())),b=buildProject(req(dir()));assert.equal(a.targets[0].target_root,b.targets[0].target_root)});
test('不同输出目录构建键一致',()=>{const a=buildProject(req(dir())),b=buildProject(req(dir()));assert.equal(a.build_key,b.build_key)});
test('请求根可因路径不同而不同',()=>{const a=req(dir()),b=req(dir());assert.notEqual(a.request_root,b.request_root)});
test('语义请求根不受路径影响',()=>{const a=buildProject(req(dir())),b=buildProject(req(dir()));assert.equal(a.semantic_request_root,b.semantic_request_root)});
test('构建指标不进入确定性根',()=>{const out=dir(),b=buildProject(req(out));const before=b.receipt_root;const m=path.join(out,'build-metrics.json');fs.writeFileSync(m,'{}');assert.equal(verifyBuild(out).receipt.receipt_root,before)});
test('项目不存在时拒绝',()=>{const r=normalizeBuildRequest({project_file:path.join(dir(),'missing.json'),output_dir:dir(),targets:['web-single'],app:{app_id:'com.taowind.x',title:'x'}});assert.throws(()=>buildProject(r),/PROJECT_FILE_NOT_FOUND/)});
