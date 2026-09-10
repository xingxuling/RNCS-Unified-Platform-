import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs';import {fileURLToPath} from 'node:url';
import {ensureUIInputProject} from '@taowind/reality-studio-native';
import {createBuildUIInputRuntime,validateBuildUIInput,verifySeal,readJson} from '../src/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),projectFile=path.join(root,'examples','冰境试炼.unified-project.json'),project=ensureUIInputProject(readJson(projectFile));

test('Build 复用 Studio UI/Input 项目并完成验证',()=>{const result=validateBuildUIInput(project);assert.equal(result.valid,true);assert.equal(result.configured,true);assert.equal(result.tree_count,1);assert.equal(result.profile_count,1)});
test('Build UI/Input lowering 生成可验证布局、manifest 与根',()=>{const payload=createBuildUIInputRuntime(project);assert.ok(payload);assert.equal(payload.format,'reality-build.ui-input-runtime.v0.1');assert.equal(payload.layout.nodes.length,13);assert.equal(payload.layout.focus_order.length,3);assert.ok(payload.manifest.manifest_root);assert.ok(payload.lowering_root);assert.ok(verifySeal(payload,'runtime_root'))});
test('没有 UI/Input 的旧项目保持兼容',()=>{const legacy=readJson(projectFile);const result=validateBuildUIInput(legacy);assert.equal(result.configured,false);assert.equal(result.valid,true);assert.equal(createBuildUIInputRuntime(legacy),null)});
test('UI 与 Input 只配置一侧时失败闭合',()=>{const partial=structuredClone(project);delete partial.input;const result=validateBuildUIInput(partial);assert.equal(result.valid,false);assert.ok(result.errors.some(error=>error.code==='INPUT_PROFILE_SECTION_REQUIRED'));assert.throws(()=>createBuildUIInputRuntime(partial),/UI_INPUT_INVALID/)});
