import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs';import os from 'node:os';import {fileURLToPath} from 'node:url';
import {normalizeBuildRequest,readJson,runBuildPreflight,doctorReport,verifySeal} from '../src/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),projectFile=path.join(root,'examples','冰境试炼.unified-project.json'),project=readJson(projectFile);
function request(targets){return normalizeBuildRequest({project_file:projectFile,output_dir:path.join(os.tmpdir(),'rbf-preflight'),targets,app:{app_id:'com.taowind.preflight',title:'预检'}})}
test('Web 构建无需外部工具链',()=>{const p=runBuildPreflight({request:request(['web-single']),project,env:{PATH:''}});assert.equal(p.status,'ready');assert.equal(p.blocked.length,0)});
test('预检结果可验证',()=>assert.ok(verifySeal(runBuildPreflight({request:request(['web-single']),project}),'preflight_root')));
test('Windows 原生要求 Go',()=>{const p=runBuildPreflight({request:request(['windows-native']),project,env:{PATH:''}});assert.equal(p.status,'blocked');assert.ok(p.blocked.some(x=>x.capability==='toolchain.go'))});
test('当前环境可构建 Windows 原生目标',()=>{const p=runBuildPreflight({request:request(['windows-native']),project});assert.equal(p.status,'ready')});
test('Android APK 缺工具链时阻止构建',()=>{const empty=fs.mkdtempSync(path.join(os.tmpdir(),'rbf-empty-'));const p=runBuildPreflight({request:request(['android-apk']),project,env:{PATH:'',ANDROID_SDK_ROOT:empty}});assert.equal(p.status,'blocked');assert.ok(p.blocked.length>=2)});
test('Android 工程仅给工具链警告',()=>{const p=runBuildPreflight({request:request(['android-project']),project,env:{PATH:''}});assert.equal(p.status,'ready');assert.ok(p.warnings.some(x=>x.code==='ANDROID_PROJECT_TOOLCHAIN_NOT_READY'))});
test('Doctor 暴露平台和工具链',()=>{const d=doctorReport();assert.equal(d.format,'reality-build.doctor.v0.2');assert.ok(d.toolchains.platform.os);assert.equal(typeof d.toolchains.go.available,'boolean')});
