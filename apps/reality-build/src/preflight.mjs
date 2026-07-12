import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {seal,clone} from './canonical.mjs';

function executableCandidates(name){
  if(process.platform!=='win32')return[name];
  const ext=path.extname(name)?['']:String(process.env.PATHEXT??'.EXE;.CMD;.BAT;.COM').split(';');
  return ext.map(x=>name+(x||''));
}

export function findCommand(name,{env=process.env}={}){
  const override=env[`RBF_${String(name).toUpperCase().replaceAll('-','_')}_COMMAND`];
  if(override&&fs.existsSync(override))return path.resolve(override);
  const dirs=String(env.PATH??'').split(path.delimiter).filter(Boolean);
  for(const dir of dirs)for(const candidate of executableCandidates(name)){
    const full=path.join(dir,candidate);try{if(fs.statSync(full).isFile())return full;}catch{}
  }
  return null;
}

function firstLine(text){return String(text??'').trim().split(/\r?\n/).find(Boolean)??null;}
function probe(name,args=['--version'],options={}){
  const command=findCommand(name,options);if(!command)return{name,available:false,version:null};
  const r=spawnSync(command,args,{encoding:'utf8',timeout:5000,windowsHide:true,env:options.env??process.env});
  return{name,available:r.status===0||Boolean(r.stdout)||Boolean(r.stderr),version:firstLine(r.stdout)||firstLine(r.stderr),command};
}

function androidSdkRoot(env=process.env){
  const candidates=[env.RBF_ANDROID_SDK_ROOT,env.ANDROID_SDK_ROOT,env.ANDROID_HOME,
    process.platform==='win32'&&env.LOCALAPPDATA?path.join(env.LOCALAPPDATA,'Android','Sdk'):null,
    process.platform==='darwin'?path.join(os.homedir(),'Library','Android','sdk'):null,
    path.join(os.homedir(),'Android','Sdk'),'/opt/android-sdk','/usr/local/lib/android/sdk'].filter(Boolean);
  return candidates.find(p=>{try{return fs.statSync(p).isDirectory();}catch{return false;}})??null;
}

function findSdkTool(root,name){
  if(!root)return null;const exe=process.platform==='win32'?`${name}.bat`:name;
  const direct=[path.join(root,'platform-tools',process.platform==='win32'?`${name}.exe`:name),path.join(root,'cmdline-tools','latest','bin',exe),path.join(root,'tools','bin',exe)];
  for(const p of direct)if(fs.existsSync(p))return p;
  const buildTools=path.join(root,'build-tools');if(fs.existsSync(buildTools)){
    const versions=fs.readdirSync(buildTools).sort().reverse();for(const v of versions){const p=path.join(buildTools,v,process.platform==='win32'?`${name}.exe`:name);if(fs.existsSync(p))return p;}
  }
  return null;
}

export function inspectToolchains({env=process.env,includePaths=false}={}){
  const go=probe('go',['version'],{env}),java=probe('java',['-version'],{env}),gradle=probe('gradle',['--version'],{env});
  const sdkRoot=androidSdkRoot(env),apksigner=findSdkTool(sdkRoot,'apksigner'),adb=findSdkTool(sdkRoot,'adb');
  const clean=t=>includePaths?t:(({command,...rest})=>rest)(t);
  return{
    platform:{os:process.platform,arch:process.arch},
    go:clean(go),java:clean(java),gradle:clean(gradle),
    android_sdk:{available:Boolean(sdkRoot),root:includePaths?sdkRoot:undefined,apksigner:includePaths?apksigner:Boolean(apksigner),adb:includePaths?adb:Boolean(adb)}
  };
}

function declaredCapabilities(project,request){
  const explicit=[...(project?.capabilities??[]),...(request?.metadata?.required_capabilities??[])].map(String);
  const inferred=[];const text=JSON.stringify(project??{}).toLowerCase();
  for(const [needle,cap] of [['webgpu','graphics.webgpu'],['microphone','device.microphone'],['camera','device.camera'],['network','network.client'],['audio','experience.audio'],['haptic','experience.haptics']])if(text.includes(needle))inferred.push(cap);
  return[...new Set([...explicit,...inferred])].sort();
}

export function runBuildPreflight({request,project,env=process.env}={}){
  const tools=inspectToolchains({env,includePaths:false}),checks=[],warnings=[];
  const add=(target,capability,required,available,details={})=>checks.push({target,capability,required,available:Boolean(available),...details});
  for(const target of request.targets){
    if(target==='windows-native')add(target,'toolchain.go',true,tools.go.available,{version:tools.go.version});
    if(target==='android-apk'){
      add(target,'toolchain.java',true,tools.java.available,{version:tools.java.version});
      add(target,'toolchain.gradle',true,tools.gradle.available,{version:tools.gradle.version});
      add(target,'toolchain.android-sdk',true,tools.android_sdk.available);
    }
    if(target==='android-project'&&(!tools.java.available||!tools.android_sdk.available))warnings.push({code:'ANDROID_PROJECT_TOOLCHAIN_NOT_READY',target,missing:[!tools.java.available&&'java',!tools.android_sdk.available&&'android-sdk'].filter(Boolean)});
  }
  const blocked=checks.filter(x=>x.required&&!x.available);
  return seal({format:'reality-build.preflight.v0.2',version:'0.2.0-alpha.1',status:blocked.length?'blocked':'ready',targets:clone(request.targets),declared_capabilities:declaredCapabilities(project,request),checks,warnings,blocked},'preflight_root');
}

export function doctorReport(options={}){
  return{format:'reality-build.doctor.v0.2',version:'0.2.0-alpha.1',toolchains:inspectToolchains({...options,includePaths:true})};
}
