import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ensureDir,emptyDir,writeJson,fileManifest,seal,safeName,copyFileDeterministic,BuildError,sha256File} from './canonical.mjs';
import {assetRuntimeMap,copyBakedAssets,writeAssetDatabaseEvidence,assetDatabasePayload} from './assets.mjs';
import {runtimeEvidenceSummary} from './runtime-evidence.mjs';
import {buildBrowserBehaviorRuntime,buildBrowserRSRRuntime,buildBrowserSpatial3DRuntime,buildBrowserVSRRuntime,buildGameSource,renderIndexHtml} from './runtime-template.mjs';
import {compileWindowsNativeHost} from './native-host.mjs';
import {commandInvocation,findCommand,inspectToolchains} from './preflight.mjs';

function writeText(file,text){ensureDir(path.dirname(file));fs.writeFileSync(file,text);fs.utimesSync(file,new Date(0),new Date(0));return file;}
function buildDataSource(payload){return `window.__REALITY_BUILD__=${JSON.stringify(payload).replaceAll('<','\\u003c')};\n`;}
function manifestForTarget(dir,target,buildIdentity){
  const files=fileManifest(dir,{exclude:['target-receipt.json']});
  const receipt=seal({format:'reality-build.target-receipt.v0.2',version:'0.2.0-alpha.1',target,build_id:buildIdentity.build_id,build_key:buildIdentity.build_key,files},'target_root');
  writeJson(path.join(dir,'target-receipt.json'),receipt);return receipt;
}
function runtimePayload(project,assets,request,identity,target,runtimeEvidence,assetDatabase=null,publicAssetManifest=null){return{project:artifactProject(project),assets,asset_database:assetDatabasePayload(assetDatabase,publicAssetManifest),build:{format:'reality-build.runtime.v0.2',build_id:identity.build_id,build_key:identity.build_key,target,mode:request.mode,quality_profile:request.quality_profile,app:request.app,build_time:request.build_time},runtime_evidence:runtimeEvidenceSummary(runtimeEvidence),spatial_runtime:{state_root:runtimeEvidence?.spatial_snapshot?.stateRoot??null,causal_delta_root:runtimeEvidence?.spatial_causal_delta?.deltaRoot??null,manifest_root:runtimeEvidence?.spatial_runtime_manifest?.manifest_root??null,navigation_manifest_root:runtimeEvidence?.navigation_manifest?.manifest_root??null,manifest:runtimeEvidence?.spatial_runtime_manifest??null,snapshot:runtimeEvidence?.spatial_snapshot??null,navigation_manifest:runtimeEvidence?.navigation_manifest??null,world:runtimeEvidence?.spatial_world??null},spatial_3d_runtime:{preferred_backend:'webgpu',fallback_backend:'canvas2d-projective',initial_state_root:runtimeEvidence?.spatial_initial_snapshot?.stateRoot??null,world:runtimeEvidence?.spatial_world??null,snapshot:runtimeEvidence?.spatial_initial_snapshot??null,scene:runtimeEvidence?.spatial_scene??null,frame_plan:runtimeEvidence?.spatial_frame_plan??null,frame_root:runtimeEvidence?.spatial_frame_plan?.frameRoot??null},gpu_runtime:{preferred_backend:'webgpu',fallback_backend:'canvas2d',frame_plan_root:runtimeEvidence?.gpu_frame_plan?.framePlanRoot??runtimeEvidence?.gpu_frame_summary?.frame_plan_root??null,frame_summary_root:runtimeEvidence?.gpu_frame_summary?.summary_root??null,viewport_manifest_root:runtimeEvidence?.gpu_viewport_manifest?.manifest_root??null},gpu_frame_plan:runtimeEvidence?.gpu_frame_plan??null,gpu_frame_summary:runtimeEvidence?.gpu_frame_summary??null,gpu_viewport_manifest:runtimeEvidence?.gpu_viewport_manifest??null};}
function embeddedHtml({project,request,identity,assetManifest,publicAssetManifest,target,runtimeEvidence,assetDatabase}){const assets=assetRuntimeMap(assetManifest,{embedded:true});const payload=runtimePayload(project,assets,request,identity,target,runtimeEvidence,assetDatabase,publicAssetManifest);return renderIndexHtml({title:request.app.title,inline:true,runtimeSource:buildBrowserBehaviorRuntime(),rsrRuntimeSource:buildBrowserRSRRuntime(),spatial3dRuntimeSource:buildBrowserSpatial3DRuntime(),gpuRuntimeSource:buildBrowserVSRRuntime(),gameSource:buildGameSource(),payload});}
function writeTargetAssetEvidence(dir,assetDatabase,publicAssetManifest){writeAssetDatabaseEvidence(dir,{assetDatabase,assetManifest:publicAssetManifest});}
function artifactProject(project){const out=structuredClone(project);if(out.assets){out.assets.import_roots=[];for(const record of Object.values(out.assets.registry??{})){if(record.source){delete record.source.absolute_path;delete record.source.source_root;}for(const file of record.files??[])delete file.absolute_path;}}return out;}
function writeRuntimeEvidenceFiles(dir,runtimeEvidence){if(!runtimeEvidence)return;writeJson(path.join(dir,'runtime-evidence.json'),runtimeEvidence.evidence);writeJson(path.join(dir,'runtime-timeline.json'),runtimeEvidence.timeline);writeJson(path.join(dir,'runtime-replay.json'),runtimeEvidence.replay);writeJson(path.join(dir,'runtime-checkpoint.json'),runtimeEvidence.checkpoint);writeJson(path.join(dir,'spatial-initial-snapshot.json'),runtimeEvidence.spatial_initial_snapshot);writeJson(path.join(dir,'spatial-world.json'),runtimeEvidence.spatial_world);writeJson(path.join(dir,'spatial-scene.json'),runtimeEvidence.spatial_scene);writeJson(path.join(dir,'spatial-frame-plan.json'),runtimeEvidence.spatial_frame_plan);writeJson(path.join(dir,'spatial-snapshot.json'),runtimeEvidence.spatial_snapshot);writeJson(path.join(dir,'spatial-causal-delta.json'),runtimeEvidence.spatial_causal_delta);writeJson(path.join(dir,'spatial-runtime.manifest.json'),runtimeEvidence.spatial_runtime_manifest);if(runtimeEvidence.navigation_manifest)writeJson(path.join(dir,'tilemap-navigation.manifest.json'),runtimeEvidence.navigation_manifest);writeJson(path.join(dir,'gpu-frame-plan.json'),runtimeEvidence.gpu_frame_plan);writeJson(path.join(dir,'gpu-frame-summary.json'),runtimeEvidence.gpu_frame_summary);writeJson(path.join(dir,'gpu-viewport.manifest.json'),runtimeEvidence.gpu_viewport_manifest);}
function replayVerifierSource(){return `import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';
import{UnifiedManufacturingSession}from'@taowind/reality-studio-native';
const root=path.dirname(fileURLToPath(import.meta.url));
const project=JSON.parse(fs.readFileSync(path.join(root,'project.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(root,'runtime-evidence.json'),'utf8'));
const session=new UnifiedManufacturingSession(project,{sessionId:'build-runtime:'+evidence.build_id});
session.createRuntimeCheckpoint('build-initial');
for(const input of evidence.trace??[])session.step(input);
const replay=session.replayRuntime({verify:true});
const spatialSession=new UnifiedManufacturingSession(project,{sessionId:'build-spatial-replay:'+evidence.build_id});
for(const commands of evidence.spatial_trace??[])spatialSession.spatial.step({commands});
const spatialStateRoot=spatialSession.spatial.lastSnapshot.stateRoot;
const result={format:'reality-build.replay-verification.v0.2',build_id:evidence.build_id,evidence_root:evidence.evidence_root,expected_replay_root:evidence.replay_root,actual_replay_root:replay.replay_root,deterministic:replay.deterministic,expected_spatial_state_root:evidence.spatial_final_state_root,actual_spatial_state_root:spatialStateRoot,spatial_deterministic:evidence.spatial_deterministic===true&&spatialStateRoot===evidence.spatial_final_state_root,ok:replay.deterministic&&replay.replay_root===evidence.replay_root&&evidence.spatial_deterministic===true&&spatialStateRoot===evidence.spatial_final_state_root};
console.log(JSON.stringify(result,null,2));
if(!result.ok)process.exitCode=1;
`;}
function headlessServerSource(){return `import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';
import{createServer}from'node:http';
import{UnifiedManufacturingSession}from'@taowind/reality-studio-native';
const root=path.dirname(fileURLToPath(import.meta.url));
const project=JSON.parse(fs.readFileSync(path.join(root,'project.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(root,'runtime-evidence.json'),'utf8'));
const session=new UnifiedManufacturingSession(project,{sessionId:'build-runtime:'+evidence.build_id});
session.createRuntimeCheckpoint('build-initial');
for(const input of evidence.trace??[])session.step(input);
const send=(res,status,payload)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'});res.end(JSON.stringify(payload));};
const body=req=>new Promise((resolve,reject)=>{let data='';req.on('data',chunk=>data+=chunk);req.on('end',()=>{try{resolve(data?JSON.parse(data):{})}catch(error){reject(error)}});req.on('error',reject)});
const server=createServer(async(req,res)=>{try{const u=new URL(req.url??'/', 'http://127.0.0.1');
if(req.method==='GET'&&u.pathname==='/health')return send(res,200,{status:'healthy',format:'reality-build.headless-server.v0.2',build_id:evidence.build_id,project_root:project.project_root,replay_root:evidence.replay_root,deterministic:evidence.deterministic,spatial_state_root:session.spatial.lastSnapshot.stateRoot,spatial_deterministic:evidence.spatial_deterministic===true,tick:session.behavior.runtime.state.tick});
if(req.method==='GET'&&u.pathname==='/inspect')return send(res,200,session.inspect());
if(req.method==='GET'&&u.pathname==='/spatial-inspect')return send(res,200,session.spatial.inspect());
if(req.method==='GET'&&u.pathname==='/replay')return send(res,200,session.replayRuntime({verify:true}));
if(req.method==='POST'&&u.pathname==='/step')return send(res,200,session.step((await body(req)).input??{}));
if(req.method==='POST'&&u.pathname==='/spatial-step'){const input=await body(req);return send(res,200,session.spatial.step({commands:input.commands??[]}));}
return send(res,404,{error:'NOT_FOUND'});}catch(error){return send(res,400,{error:error.code??'HEADLESS_SERVER_ERROR',message:error.message})}});
server.listen(Number(process.env.PORT??4174),'127.0.0.1',()=>console.log('http://127.0.0.1:'+Number(process.env.PORT??4174)));
`;}

export function buildWebRelease({project,request,identity,bakeDir,outRoot,assetManifest,publicAssetManifest,runtimeEvidence,assetDatabase}){
  const dir=emptyDir(path.join(outRoot,'web-release'));copyBakedAssets(assetManifest,bakeDir,dir);
  const assets=assetRuntimeMap(assetManifest,{embedded:false});const payload=runtimePayload(project,assets,request,identity,'web-release',runtimeEvidence,assetDatabase,publicAssetManifest);writeRuntimeEvidenceFiles(dir,runtimeEvidence);writeTargetAssetEvidence(dir,assetDatabase,publicAssetManifest);
  writeText(path.join(dir,'runtime.js'),buildBrowserBehaviorRuntime());writeText(path.join(dir,'rsr-runtime.js'),buildBrowserRSRRuntime());writeText(path.join(dir,'spatial3d-runtime.js'),buildBrowserSpatial3DRuntime());writeText(path.join(dir,'vsr-runtime.js'),buildBrowserVSRRuntime());writeText(path.join(dir,'game.js'),buildGameSource());writeText(path.join(dir,'build-data.js'),buildDataSource(payload));
  writeText(path.join(dir,'index.html'),renderIndexHtml({title:request.app.title,inline:false}));
  writeJson(path.join(dir,'manifest.webmanifest'),{name:request.app.title,short_name:request.app.title.slice(0,12),id:request.app.app_id,start_url:'./index.html',display:request.app.fullscreen?'fullscreen':'standalone',orientation:request.app.orientation,background_color:'#071426',theme_color:'#071426',version:request.app.version_name});
  writeText(path.join(dir,'service-worker.js'),`const CACHE='${identity.build_key.slice(0,20)}';const FILES=${JSON.stringify(['./','./index.html','./runtime.js','./rsr-runtime.js','./spatial3d-runtime.js','./vsr-runtime.js','./game.js','./build-data.js','./manifest.webmanifest','./runtime-evidence.json','./runtime-timeline.json','./runtime-replay.json','./runtime-checkpoint.json','./spatial-initial-snapshot.json','./spatial-world.json','./spatial-scene.json','./spatial-frame-plan.json','./spatial-snapshot.json','./spatial-causal-delta.json','./spatial-runtime.manifest.json','./gpu-frame-plan.json','./gpu-frame-summary.json','./gpu-viewport.manifest.json',...(runtimeEvidence?.navigation_manifest?['./tilemap-navigation.manifest.json']:[]),...Object.values(assetManifest.records).flatMap(r=>r.files.map(f=>'./'+f.store_path))])};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));\n`);
  writeText(path.join(dir,'serve.mjs'),`import http from'node:http';import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';const root=path.dirname(fileURLToPath(import.meta.url)),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.glb':'model/gltf-binary','.gltf':'model/gltf+json'};http.createServer((q,s)=>{const u=new URL(q.url,'http://x'),p=path.join(root,u.pathname==='/'?'index.html':u.pathname);if(!p.startsWith(root)||!fs.existsSync(p)){s.writeHead(404);return s.end('404')}s.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(s)}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'));\n`);
  writeText(path.join(dir,'启动本地预览.bat'),'@echo off\r\nchcp 65001 >nul\r\ncd /d "%~dp0"\r\nwhere node >nul 2>nul || (echo 缺少 Node.js，亦可直接部署此目录。 & pause & exit /b 1)\r\nnode serve.mjs\r\n');
  writeText(path.join(dir,'start-local-preview.sh'),'#!/usr/bin/env sh\ncd "$(dirname "$0")"\nnode serve.mjs\n');fs.chmodSync(path.join(dir,'start-local-preview.sh'),0o755);
  return{dir,receipt:manifestForTarget(dir,'web-release',identity)};
}

export function buildWebSingle({project,request,identity,outRoot,assetManifest,publicAssetManifest,runtimeEvidence,assetDatabase}){
  const dir=emptyDir(path.join(outRoot,'web-single'));const file=path.join(dir,`${safeName(request.app.title)}_单文件版.html`);writeText(file,embeddedHtml({project,request,identity,assetManifest,publicAssetManifest,target:'web-single',runtimeEvidence,assetDatabase}));
  return{dir,file,receipt:manifestForTarget(dir,'web-single',identity)};
}

export function buildWindowsPortable({project,request,identity,outRoot,assetManifest,publicAssetManifest,runtimeEvidence,assetDatabase}){
  const dir=emptyDir(path.join(outRoot,'windows-portable')),htmlName=`${safeName(request.app.title)}.html`;
  writeText(path.join(dir,htmlName),embeddedHtml({project,request,identity,assetManifest,publicAssetManifest,target:'windows-portable',runtimeEvidence,assetDatabase}));writeRuntimeEvidenceFiles(dir,runtimeEvidence);writeTargetAssetEvidence(dir,assetDatabase,publicAssetManifest);
  const bat=`@echo off\r\nchcp 65001 >nul\r\nsetlocal\r\ncd /d "%~dp0"\r\nset "APP=%CD%\\${htmlName}"\r\nwhere msedge >nul 2>nul && (start "" msedge --app="file:///%APP:\\=/%" & exit /b 0)\r\nwhere chrome >nul 2>nul && (start "" chrome --app="file:///%APP:\\=/%" & exit /b 0)\r\nstart "" "%APP%"\r\n`;
  writeText(path.join(dir,'启动游戏.bat'),bat);writeText(path.join(dir,'README_Windows便携版.txt'),`${request.app.title}\r\n\r\n双击“启动游戏.bat”即可运行。\r\n该兼容目标仍是浏览器宿主便携包；优先使用 windows-native 生成真正双击 EXE。\r\nBuild ID: ${identity.build_id}\r\n`);
  writeJson(path.join(dir,'app-manifest.json'),{format:'reality-build.windows-portable.v0.2',title:request.app.title,app_id:request.app.app_id,version:request.app.version_name,entry:htmlName,host:'system-browser-app-mode',native_executable:false,build_id:identity.build_id});
  return{dir,receipt:manifestForTarget(dir,'windows-portable',identity)};
}

export function buildWindowsNative({project,request,identity,outRoot,assetManifest,publicAssetManifest,runtimeEvidence,assetDatabase}){
  const dir=emptyDir(path.join(outRoot,'windows-native')),exeName=`${safeName(request.app.title)}.exe`,outFile=path.join(dir,exeName);
  const html=embeddedHtml({project,request,identity,assetManifest,publicAssetManifest,target:'windows-native',runtimeEvidence,assetDatabase});writeRuntimeEvidenceFiles(dir,runtimeEvidence);
  const compiled=compileWindowsNativeHost({html,title:request.app.title,appId:request.app.app_id,buildId:identity.build_id,outFile});
  writeJson(path.join(dir,'app-manifest.json'),{format:'reality-build.windows-native.v0.2',title:request.app.title,app_id:request.app.app_id,version:request.app.version_name,entry:exeName,native_executable:true,architecture:'x86_64',render_backend:'system-browser-app-mode',payload:'embedded-html',external_node_required:false,external_script_required:false,build_id:identity.build_id,executable_sha256:compiled.sha256});
  writeText(path.join(dir,'README_Windows原生版.txt'),`${request.app.title}\r\n\r\n直接双击 ${exeName}。\r\n无需 BAT、无需 Node.js；EXE 内嵌完整应用并使用系统 Edge/Chrome 应用窗口呈现。\r\n若系统浏览器不可用，会调用默认浏览器并写入启动错误日志。\r\nBuild ID: ${identity.build_id}\r\n`);
  return{dir,receipt:manifestForTarget(dir,'windows-native',identity)};
}

export function buildHeadlessServer({project,request,identity,outRoot,runtimeEvidence,assetDatabase,publicAssetManifest}){
  const dir=emptyDir(path.join(outRoot,'headless-server'));writeJson(path.join(dir,'project.json'),artifactProject(project));writeRuntimeEvidenceFiles(dir,runtimeEvidence);writeTargetAssetEvidence(dir,assetDatabase,publicAssetManifest);writeText(path.join(dir,'server.mjs'),headlessServerSource());writeText(path.join(dir,'verify-replay.mjs'),replayVerifierSource());writeJson(path.join(dir,'package.json'),{name:`${safeName(request.app.title,'reality-app').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-headless-server`,version:request.app.version_name,private:true,type:'module',scripts:{start:'node server.mjs',verify:'node verify-replay.mjs'},dependencies:{'@taowind/reality-studio-native':'^1.6.0-alpha.1'}});writeJson(path.join(dir,'server-manifest.json'),seal({format:'reality-build.headless-server-manifest.v0.2',version:'0.2.0-alpha.1',build_id:identity.build_id,project_root:project.project_root,entry:'server.mjs',verification_entry:'verify-replay.mjs',health_endpoint:'/health',inspect_endpoint:'/inspect',spatial_inspect_endpoint:'/spatial-inspect',step_endpoint:'/step',spatial_step_endpoint:'/spatial-step',replay_endpoint:'/replay',runtime_evidence:runtimeEvidenceSummary(runtimeEvidence),spatial_runtime_manifest_root:runtimeEvidence.spatial_runtime_manifest?.manifest_root??null,gpu_frame_plan_root:runtimeEvidence.evidence.gpu_frame_plan_root,gpu_frame_summary_root:runtimeEvidence.evidence.gpu_frame_summary_root,gpu_viewport_manifest_root:runtimeEvidence.evidence.gpu_viewport_manifest_root,navigation_manifest_root:runtimeEvidence.navigation_manifest?.manifest_root??null,asset_database_root:assetDatabase?.evidence?.database_root??null},'manifest_root'));writeText(path.join(dir,'README.md'),`# ${request.app.title} Headless Server\n\nRun npm install, then npm start. The server exposes /health, /inspect, /spatial-inspect, /step, /spatial-step, and /replay.\n`);return{dir,receipt:manifestForTarget(dir,'headless-server',identity)};
}

export function buildReplayBundle({project,request,identity,outRoot,runtimeEvidence,assetDatabase,publicAssetManifest}){
  const dir=emptyDir(path.join(outRoot,'replay-bundle'));writeJson(path.join(dir,'project.json'),artifactProject(project));writeRuntimeEvidenceFiles(dir,runtimeEvidence);writeTargetAssetEvidence(dir,assetDatabase,publicAssetManifest);writeText(path.join(dir,'verify-replay.mjs'),replayVerifierSource());writeJson(path.join(dir,'replay-manifest.json'),seal({format:'reality-build.replay-bundle-manifest.v0.2',version:'0.2.0-alpha.1',build_id:identity.build_id,project_root:project.project_root,entry:'verify-replay.mjs',runtime_evidence:runtimeEvidenceSummary(runtimeEvidence),spatial_runtime_manifest_root:runtimeEvidence.spatial_runtime_manifest?.manifest_root??null,gpu_frame_plan_root:runtimeEvidence.evidence.gpu_frame_plan_root,gpu_frame_summary_root:runtimeEvidence.evidence.gpu_frame_summary_root,gpu_viewport_manifest_root:runtimeEvidence.evidence.gpu_viewport_manifest_root,navigation_manifest_root:runtimeEvidence.navigation_manifest?.manifest_root??null,asset_database_root:assetDatabase?.evidence?.database_root??null,files:['project.json','runtime-evidence.json','runtime-timeline.json','runtime-replay.json','runtime-checkpoint.json','spatial-snapshot.json','spatial-causal-delta.json','spatial-runtime.manifest.json','gpu-frame-plan.json','gpu-frame-summary.json','gpu-viewport.manifest.json',...(runtimeEvidence.navigation_manifest?['tilemap-navigation.manifest.json']:[]),'verify-replay.mjs']},'manifest_root'));return{dir,receipt:manifestForTarget(dir,'replay-bundle',identity)};
}

function javaPackagePath(appId){return appId.split('.').join('/');}
function xmlEscape(value){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}

export function generateAndroidProject({dir,project,request,identity,assetManifest,publicAssetManifest,runtimeEvidence,assetDatabase,target='android-project'}){
  emptyDir(dir);const appDir=path.join(dir,'app'),assetsDir=ensureDir(path.join(appDir,'src/main/assets'));
  writeText(path.join(assetsDir,'index.html'),embeddedHtml({project,request,identity,assetManifest,publicAssetManifest,target,runtimeEvidence,assetDatabase}));writeRuntimeEvidenceFiles(assetsDir,runtimeEvidence);writeTargetAssetEvidence(assetsDir,assetDatabase,publicAssetManifest);
  writeText(path.join(dir,'settings.gradle'),`pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }\ndependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }\nrootProject.name='${safeName(request.app.title,'RealityApp').replaceAll("'",'')}'\ninclude ':app'\n`);
  writeText(path.join(dir,'build.gradle'),`plugins { id 'com.android.application' version '8.5.2' apply false }\n`);
  writeText(path.join(dir,'gradle.properties'),'org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true\n');
  writeText(path.join(appDir,'build.gradle'),`plugins { id 'com.android.application' }\n\nandroid { namespace '${request.app.app_id}'; compileSdk 35\n defaultConfig { applicationId '${request.app.app_id}'; minSdk 24; targetSdk 35; versionCode ${request.app.version_code}; versionName '${request.app.version_name}' }\n buildTypes { debug { debuggable true } release { minifyEnabled false; proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro' } }\n}\n`);
  writeText(path.join(appDir,'proguard-rules.pro'),'# Reality Build Fabric Android host\n');
  const manifest=`<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:theme="@style/AppTheme" android:label="@string/app_name" android:allowBackup="false" android:usesCleartextTraffic="false" android:hardwareAccelerated="true"><activity android:name=".MainActivity" android:screenOrientation="${request.app.orientation==='portrait'?'portrait':'landscape'}" android:configChanges="keyboardHidden|orientation|screenSize" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>`;
  writeText(path.join(appDir,'src/main/AndroidManifest.xml'),manifest);
  const javaDir=ensureDir(path.join(appDir,'src/main/java',javaPackagePath(request.app.app_id)));
  writeText(path.join(javaDir,'MainActivity.java'),`package ${request.app.app_id};\nimport android.app.Activity;import android.os.Bundle;import android.view.View;import android.webkit.WebChromeClient;import android.webkit.WebSettings;import android.webkit.WebView;\npublic class MainActivity extends Activity{private WebView web;@Override public void onCreate(Bundle b){super.onCreate(b);${request.app.fullscreen?'getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);':''}web=new WebView(this);WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(true);s.setMediaPlaybackRequiresUserGesture(false);web.setWebChromeClient(new WebChromeClient());web.loadUrl("file:///android_asset/index.html");setContentView(web);}@Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}}\n`);
  writeText(path.join(appDir,'src/main/res/values/strings.xml'),`<resources><string name="app_name">${xmlEscape(request.app.title)}</string></resources>`);
  writeText(path.join(appDir,'src/main/res/values/styles.xml'),'<resources><style name="AppTheme" parent="android:style/Theme.Material.Light.NoActionBar"><item name="android:fontFamily">sans</item><item name="android:colorAccent">#67E8F9</item><item name="android:windowFullscreen">true</item><item name="android:windowActionModeOverlay">true</item></style></resources>');
  writeText(path.join(dir,'构建调试APK.bat'),'@echo off\r\nchcp 65001 >nul\r\ncd /d "%~dp0"\r\nwhere gradle >nul 2>nul || (echo 未找到 Gradle。请用 Android Studio 打开本目录，或安装 Gradle。 & pause & exit /b 1)\r\ngradle --no-daemon app:assembleDebug\r\nif errorlevel 1 (pause & exit /b 1)\r\necho APK: app\\build\\outputs\\apk\\debug\\app-debug.apk\r\npause\r\n');
  writeText(path.join(dir,'build-debug-apk.sh'),'#!/usr/bin/env sh\nset -eu\ncd "$(dirname "$0")"\ngradle --no-daemon app:assembleDebug\necho "APK: app/build/outputs/apk/debug/app-debug.apk"\n');fs.chmodSync(path.join(dir,'build-debug-apk.sh'),0o755);
  writeText(path.join(dir,'README_Android构建.md'),`# ${request.app.title} Android 工程\n\n- JDK 17+\n- Android SDK 35\n- Gradle / Android Studio\n- 双击“构建调试APK.bat”或在 Android Studio 执行 Build APK(s)\n\n调试 APK 由 Android Gradle Plugin 自动使用调试密钥签名。\nBuild ID: \`${identity.build_id}\`\n`);
  return dir;
}

export function buildAndroidProject(ctx){
  const dir=path.join(ctx.outRoot,'android-project');generateAndroidProject({...ctx,dir,target:'android-project'});
  writeJson(path.join(dir,'android-build-manifest.json'),{format:'reality-build.android-project.v0.2',app_id:ctx.request.app.app_id,version_name:ctx.request.app.version_name,version_code:ctx.request.app.version_code,min_sdk:24,target_sdk:35,compile_sdk:35,entry:'app/src/main/assets/index.html',artifact_status:'source-project',apk_built:false,automatic_build_script:true,build_id:ctx.identity.build_id});
  return{dir,receipt:manifestForTarget(dir,'android-project',ctx.identity)};
}

function verifyApkStructure(file){const data=fs.readFileSync(file);return data.length>4&&data[0]===0x50&&data[1]===0x4b;}
export function buildAndroidApk(ctx){
  const dir=emptyDir(path.join(ctx.outRoot,'android-apk')),projectDir=path.join(ctx.outRoot,'_android-apk-project');generateAndroidProject({...ctx,dir:projectDir,target:'android-apk'});
  const gradle=findCommand('gradle');if(!gradle){fs.rmSync(projectDir,{recursive:true,force:true});throw new BuildError('ANDROID_GRADLE_UNAVAILABLE','Gradle command not found');}
  const invocation=commandInvocation(gradle,['--no-daemon','app:assembleDebug']);
  const r=spawnSync(invocation.command,invocation.args,{cwd:projectDir,encoding:'utf8',windowsHide:true,timeout:10*60*1000,env:process.env});
  if(r.status!==0){fs.rmSync(projectDir,{recursive:true,force:true});throw new BuildError('ANDROID_APK_BUILD_FAILED',String(r.stderr||r.stdout||`exit ${r.status}`));}
  const sourceApk=path.join(projectDir,'app','build','outputs','apk','debug','app-debug.apk');if(!fs.existsSync(sourceApk)){fs.rmSync(projectDir,{recursive:true,force:true});throw new BuildError('ANDROID_APK_NOT_PRODUCED',sourceApk);}
  const apkName=`${safeName(ctx.request.app.title)}-${ctx.request.app.version_name}-debug.apk`,apkFile=path.join(dir,apkName);copyFileDeterministic(sourceApk,apkFile);
  if(!verifyApkStructure(apkFile)){fs.rmSync(projectDir,{recursive:true,force:true});throw new BuildError('ANDROID_APK_INVALID_ZIP',apkFile);}
  const tools=inspectToolchains({includePaths:true});let signatureVerification={status:'not-run',reason:'apksigner-unavailable'};
  if(tools.android_sdk.apksigner){const vr=spawnSync(tools.android_sdk.apksigner,['verify','--verbose',apkFile],{encoding:'utf8',windowsHide:true});signatureVerification={status:vr.status===0?'verified':'failed',output:String(vr.stdout||vr.stderr||'').trim().slice(0,2000)};if(vr.status!==0){fs.rmSync(projectDir,{recursive:true,force:true});throw new BuildError('ANDROID_APK_SIGNATURE_INVALID',signatureVerification.output);}}
  writeJson(path.join(dir,'android-build-manifest.json'),{format:'reality-build.android-apk.v0.2',app_id:ctx.request.app.app_id,version_name:ctx.request.app.version_name,version_code:ctx.request.app.version_code,variant:'debug',artifact:apkName,artifact_status:'compiled',apk_built:true,signed:true,signing_identity:'android-debug-keystore',signature_verification:signatureVerification,sha256:sha256File(apkFile),build_id:ctx.identity.build_id});
  writeText(path.join(dir,'README_Android_APK.txt'),`${ctx.request.app.title}\r\n\r\n${apkName} 已由 Gradle 编译，并使用 Android 调试密钥自动签名。\r\n适用于设备验收；商店发布仍需正式发布密钥与 AAB。\r\n`);
  fs.rmSync(projectDir,{recursive:true,force:true});
  return{dir,receipt:manifestForTarget(dir,'android-apk',ctx.identity)};
}

export const TARGET_BUILDERS={'web-release':buildWebRelease,'web-single':buildWebSingle,'windows-portable':buildWindowsPortable,'windows-native':buildWindowsNative,'android-project':buildAndroidProject,'android-apk':buildAndroidApk,'headless-server':buildHeadlessServer,'replay-bundle':buildReplayBundle};
