import path from 'node:path';
import {clone,rootHash,seal,verifySeal,BuildError,fixedIso,safeName} from './canonical.mjs';

export const BUILD_FORMAT='reality-build.request.v0.1';
export const BUILD_VERSION='0.2.0-alpha.1';
export const SUPPORTED_TARGETS=['web-release','web-single','windows-portable','windows-native','android-project','android-apk','headless-server','replay-bundle'];
export const TARGET_PROFILES={
  'web-release':{kind:'deployable-web-folder',requires:[],quality:['economy','balanced','quality','cinematic']},
  'web-single':{kind:'single-file-web',requires:[],quality:['economy','balanced','quality']},
  'windows-portable':{kind:'browser-host-portable',requires:['Windows 10+ and a modern browser'],quality:['economy','balanced','quality']},
  'windows-native':{kind:'native-windows-executable',requires:['Go build toolchain at build time','Windows 10+ and Edge/Chrome at runtime'],quality:['economy','balanced','quality']},
  'android-project':{kind:'android-studio-project',requires:['Android Studio or Gradle + Android SDK'],quality:['economy','balanced']},
  'android-apk':{kind:'compiled-signed-debug-apk',requires:['JDK 17+','Gradle','Android SDK 35'],quality:['economy','balanced']},
  'headless-server':{kind:'node-headless-server',requires:['Node.js 20+ and the Reality Studio package'],quality:['economy','balanced','quality','cinematic']},
  'replay-bundle':{kind:'deterministic-replay-bundle',requires:['Node.js 20+ and the Reality Studio package'],quality:['economy','balanced','quality','cinematic']}
};

function resolveProjectPath(value,projectFile){return path.resolve(path.dirname(projectFile),String(value));}
function normalizeSpatialTrace(input){
  const frames=Array.isArray(input)?input:[];
  return frames.map((frame,frameIndex)=>{
    const commands=Array.isArray(frame)?frame:(Array.isArray(frame?.commands)?frame.commands:[]);
    return commands.map((command,commandIndex)=>({...clone(command&&typeof command==='object'?command:{}),id:String(command?.id??`build-spatial-command:${frameIndex+1}:${commandIndex+1}`)}));
  });
}
function normalizeAssetDatabase(input,projectFile){
  const raw=input?.asset_database??input?.assetDatabase;
  if(!raw||raw.enabled===false)return{enabled:false,cache_dir:null,source_roots:[],profiles:['runtime'],recursive:true,materialize:true};
  const sourceRoots=Array.isArray(raw.source_roots??raw.sourceRoots)?(raw.source_roots??raw.sourceRoots).map(value=>resolveProjectPath(value,projectFile)):[];
  return{enabled:true,cache_dir:resolveProjectPath(raw.cache_dir??raw.cacheDir??'output/asset-cache',projectFile),source_roots:[...new Set(sourceRoots)].sort(),profiles:[...new Set((Array.isArray(raw.profiles)?raw.profiles:['runtime']).map(String))].sort(),recursive:raw.recursive!==false,materialize:raw.materialize!==false};
}

export function normalizeBuildRequest(input={}){
  const targets=[...new Set((input.targets??['web-release']).map(String))];
  const request={
    format:BUILD_FORMAT,version:BUILD_VERSION,
    project_file:path.resolve(String(input.project_file??input.projectFile??'')),
    output_dir:path.resolve(String(input.output_dir??input.outputDir??'output/build')),
    targets,
    mode:input.mode==='development'?'development':'release',
    quality_profile:String(input.quality_profile??input.qualityProfile??'balanced'),
    app:{
      app_id:String(input.app?.app_id??input.appId??'com.taowind.realityapp'),
      title:String(input.app?.title??input.title??'Reality Native Game'),
      version_name:String(input.app?.version_name??input.versionName??'0.1.0'),
      version_code:Number(input.app?.version_code??input.versionCode??1),
      orientation:String(input.app?.orientation??'landscape'),
      fullscreen:input.app?.fullscreen!==false
    },
    policy:{
      missing_asset:input.policy?.missing_asset??'fallback',
      embed_assets:input.policy?.embed_assets!==false,
      deterministic:input.policy?.deterministic!==false,
      fail_on_warning:input.policy?.fail_on_warning===true
    },
    asset_database:normalizeAssetDatabase(input,path.resolve(String(input.project_file??input.projectFile??''))),
    build_time:fixedIso(input.build_time??'2026-07-01T00:00:00.000Z'),
    runtime_trace:Array.isArray(input.runtime_trace)?clone(input.runtime_trace):[{},{}],
    spatial_trace:normalizeSpatialTrace(input.spatial_trace??input.spatialTrace),
    metadata:clone(input.metadata??{})
  };
  return seal(request,'request_root');
}

export function validateBuildRequest(r){
  const errors=[],warnings=[];const need=(c,code,path,details={})=>{if(!c)errors.push({code,path,...details});};
  need(r?.format===BUILD_FORMAT,'FORMAT_INVALID','format');need(r?.version===BUILD_VERSION,'VERSION_INVALID','version');
  need(Boolean(r?.project_file),'PROJECT_FILE_REQUIRED','project_file');need(Boolean(r?.output_dir),'OUTPUT_DIR_REQUIRED','output_dir');
  need(Array.isArray(r?.targets)&&r.targets.length>0,'TARGETS_REQUIRED','targets');
  for(const t of r?.targets??[])if(!SUPPORTED_TARGETS.includes(t))errors.push({code:'TARGET_UNSUPPORTED',path:'targets',target:t});
  need(['development','release'].includes(r?.mode),'MODE_INVALID','mode');
  need(['economy','balanced','quality','cinematic'].includes(r?.quality_profile),'QUALITY_INVALID','quality_profile');
  need(/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(r?.app?.app_id??''),'APP_ID_INVALID','app.app_id');
  need(Number.isInteger(r?.app?.version_code)&&r.app.version_code>0,'VERSION_CODE_INVALID','app.version_code');
  need(Array.isArray(r?.runtime_trace),'RUNTIME_TRACE_INVALID','runtime_trace');
  need(Array.isArray(r?.spatial_trace),'SPATIAL_TRACE_INVALID','spatial_trace');
  if(r?.asset_database?.enabled){
    need(Boolean(r.asset_database.cache_dir),'ASSET_DATABASE_CACHE_DIR_REQUIRED','asset_database.cache_dir');
    need(Array.isArray(r.asset_database.source_roots),'ASSET_DATABASE_SOURCE_ROOTS_INVALID','asset_database.source_roots');
    need(Array.isArray(r.asset_database.profiles)&&r.asset_database.profiles.length>0,'ASSET_DATABASE_PROFILES_INVALID','asset_database.profiles');
    for(const profile of r.asset_database.profiles)if(!/^[A-Za-z0-9._-]+$/.test(profile))errors.push({code:'ASSET_DATABASE_PROFILE_INVALID',path:'asset_database.profiles',profile});
  }
  if(r?.targets?.some(t=>t==='android-project'||t==='android-apk')&&r.quality_profile==='cinematic')warnings.push({code:'ANDROID_CINEMATIC_DOWNGRADED',path:'quality_profile',to:'quality'});
  if(!verifySeal(r,'request_root'))errors.push({code:'REQUEST_ROOT_MISMATCH',path:'request_root'});
  return{valid:errors.length===0,errors,warnings};
}

export function validateUnifiedProject(project){
  const errors=[],warnings=[];const need=(c,code,path,details={})=>{if(!c)errors.push({code,path,...details});};
  need(project?.format==='reality-studio.unified-project.v0.9','PROJECT_FORMAT_INVALID','format');
  need(project?.version==='0.9.0-alpha.1','PROJECT_VERSION_INVALID','version');
  need(Boolean(project?.identity?.project_id),'PROJECT_ID_REQUIRED','identity.project_id');
  need(Array.isArray(project?.scenes)&&project.scenes.length>0,'SCENES_REQUIRED','scenes');
  const sceneIds=new Set();for(const s of project?.scenes??[]){if(sceneIds.has(s.scene_id))errors.push({code:'SCENE_DUPLICATE',path:s.scene_id});sceneIds.add(s.scene_id);if(!Array.isArray(s.nodes))errors.push({code:'NODES_REQUIRED',path:s.scene_id});}
  need(sceneIds.has(project?.active_scene_id),'ACTIVE_SCENE_INVALID','active_scene_id');
  const assetIds=new Set(Object.keys(project?.assets?.registry??{}));for(const s of project?.scenes??[])for(const n of s.nodes??[])if(n.asset_id&&!assetIds.has(n.asset_id))warnings.push({code:'NODE_ASSET_UNRESOLVED',path:n.node_id,asset_id:n.asset_id});
  const programs=project?.behavior?.programs??{};need(Boolean(project?.behavior?.active_program_id),'ACTIVE_PROGRAM_REQUIRED','behavior.active_program_id');need(Boolean(programs[project?.behavior?.active_program_id]),'ACTIVE_PROGRAM_MISSING','behavior.active_program_id');
  if(typeof project?.project_root!=='string'||project.project_root.length<32)warnings.push({code:'PROJECT_ROOT_WEAK_OR_MISSING',path:'project_root'});
  return{valid:errors.length===0,errors,warnings,counts:{scenes:project?.scenes?.length??0,nodes:(project?.scenes??[]).reduce((n,s)=>n+(s.nodes?.length??0),0),assets:assetIds.size,programs:Object.keys(programs).length}};
}

export function createBuildIdentity(request,project,inputs={}){
  const semantic={fabric_version:BUILD_VERSION,project_root:project.project_root??rootHash(project),targets:request.targets,mode:request.mode,quality_profile:request.quality_profile,app:request.app,policy:request.policy,asset_database:{enabled:request.asset_database?.enabled===true,source_roots:request.asset_database?.source_roots??[],profiles:request.asset_database?.profiles??['runtime'],recursive:request.asset_database?.recursive!==false,materialize:request.asset_database?.materialize!==false,database_root:inputs.asset_database_root??null},build_time:request.build_time,runtime_trace:request.runtime_trace,spatial_trace:request.spatial_trace,metadata:request.metadata};
  const semantic_request_root=rootHash(semantic),value={semantic_request_root,...semantic};
  return{build_id:`build:${rootHash(value).slice(0,24)}`,build_key:rootHash(value),semantic_request_root,safe_title:safeName(request.app.title),project_root:semantic.project_root};
}

export function assertRequest(request){const v=validateBuildRequest(request);if(!v.valid)throw new BuildError('BUILD_REQUEST_INVALID','',v);return request;}
export function assertProject(project){const v=validateUnifiedProject(project);if(!v.valid)throw new BuildError('UNIFIED_PROJECT_INVALID','',v);return project;}
