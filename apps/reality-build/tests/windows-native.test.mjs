import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs';import os from 'node:os';import {fileURLToPath} from 'node:url';
import {normalizeBuildRequest,buildProject,readJson,sha256File,compileWindowsNativeHost,windowsHostSource,inspectToolchains} from '../src/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),projectFile=path.join(root,'examples','冰境试炼.unified-project.json');
function dir(){return fs.mkdtempSync(path.join(os.tmpdir(),'rbf-win-'));}
const goAvailable=inspectToolchains().go.available;
test('Windows Host 源码嵌入应用而非外部 HTML',()=>{const s=windowsHostSource({html:'<h1>测试</h1>',title:'原生验收',appId:'com.taowind.native',buildId:'build:x'});assert.match(s,/appHTMLBase64/);assert.match(s,/windowsgui|MessageBoxW/);assert.doesNotMatch(s,/<h1>测试<\/h1>/)});
test('Go 可交叉编译 Windows GUI EXE',{skip:!goAvailable},()=>{const out=path.join(dir(),'host.exe');const r=compileWindowsNativeHost({html:'<!doctype html><title>x</title>',title:'x',appId:'com.taowind.x',buildId:'b',outFile:out});const b=fs.readFileSync(out);assert.equal(b.subarray(0,2).toString(),'MZ');assert.ok(r.size>500000)});
test('Windows Host 构建可复现',{skip:!goAvailable},()=>{const a=path.join(dir(),'a.exe'),b=path.join(dir(),'b.exe'),x={html:'<!doctype html><title>x</title>',title:'x',appId:'com.taowind.x',buildId:'b'};compileWindowsNativeHost({...x,outFile:a});compileWindowsNativeHost({...x,outFile:b});assert.equal(sha256File(a),sha256File(b))});
const out=goAvailable?dir():null,built=goAvailable?buildProject(normalizeBuildRequest({project_file:projectFile,output_dir:out,targets:['windows-native'],app:{app_id:'com.taowind.native',title:'原生目标',version_name:'0.2.0',version_code:2}})):null;
test('原生目标生成 EXE',{skip:!goAvailable},()=>{const f=path.join(out,'windows-native','原生目标.exe');assert.ok(fs.existsSync(f));assert.equal(fs.readFileSync(f).subarray(0,2).toString(),'MZ')});
test('原生目标无需 BAT',{skip:!goAvailable},()=>assert.equal(fs.readdirSync(path.join(out,'windows-native')).some(x=>x.endsWith('.bat')),false));
test('原生目标无需外部 HTML',{skip:!goAvailable},()=>assert.equal(fs.readdirSync(path.join(out,'windows-native')).some(x=>x.endsWith('.html')),false));
test('原生清单诚实声明系统浏览器渲染',{skip:!goAvailable},()=>{const m=readJson(path.join(out,'windows-native','app-manifest.json'));assert.equal(m.native_executable,true);assert.equal(m.render_backend,'system-browser-app-mode');assert.equal(m.external_node_required,false)});
test('原生目标收据通过',{skip:!goAvailable},()=>assert.equal(built.verification.valid,true));
