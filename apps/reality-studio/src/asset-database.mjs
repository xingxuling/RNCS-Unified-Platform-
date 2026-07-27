import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {clone,now,rootHash,seal,StudioError} from './canonical.mjs';
import {createLocalAssetRecord,scanAssetFiles} from './asset-continuity.mjs';

export const ASSET_DATABASE_VERSION='1.4.0-alpha.1';
export const ASSET_DATABASE_FORMAT='reality-studio.asset-database.v1.4';
export const ASSET_CHANGE_PLAN_FORMAT='reality-studio.asset-change-plan.v1.4';
export const ASSET_DERIVED_ARTIFACT_FORMAT='reality-studio.asset-derived-artifact.v1.4';
export const ASSET_CACHE_INDEX_FORMAT='reality-studio.asset-cache-index.v1.4';

const sha256=value=>createHash('sha256').update(value).digest('hex');
const normalizePath=value=>String(value).replaceAll('\\','/');
const normalizeRelative=value=>normalizePath(value).replace(/^\.\//,'').toLowerCase();
const unique=values=>[...new Set((values??[]).filter(Boolean).map(value=>path.resolve(value)))].sort((a,b)=>normalizePath(a).localeCompare(normalizePath(b)));
const safeProfile=value=>{
  const profile=String(value??'runtime');
  if(!/^[a-zA-Z0-9._-]+$/.test(profile))throw new StudioError('ASSET_PROFILE_INVALID',profile);
  return profile;
};
const safeCacheKey=value=>{
  if(!/^[a-f0-9]{64}$/.test(String(value)))throw new StudioError('ASSET_CACHE_KEY_INVALID',String(value));
  return String(value);
};
const isInside=(child,parent)=>{const relative=path.relative(path.resolve(parent),path.resolve(child));return relative===''||(!relative.startsWith(`..${path.sep}`)&&relative!=='..'&&!path.isAbsolute(relative))};
const fileSha256=filePath=>createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
const fileInfo=filePath=>{const stat=fs.statSync(filePath);return{sha256:fileSha256(filePath),size:stat.size,mtime_ms:Math.trunc(stat.mtimeMs)}};
const writeJson=(filePath,value)=>{fs.mkdirSync(path.dirname(filePath),{recursive:true});fs.writeFileSync(filePath,JSON.stringify(value,null,2)+'\n');};

function sourceIdentity(relativePath){return normalizeRelative(relativePath)}
function sourceRecordKey(sourceRoot,relativePath){return `${normalizePath(path.resolve(sourceRoot)).toLowerCase()}::${sourceIdentity(relativePath)}`}
function sourceRootId(sourceRoot){return sha256(normalizePath(path.resolve(sourceRoot))).slice(0,24)}
function publicSourceKey(item){return `${sourceRootId(item.source_root)}::${sourceIdentity(item.relative_path)}`}
function fallbackAssetId(relativePath){return `asset:local:${sha256(sourceIdentity(relativePath)).slice(0,24)}`}
function recordKey(record){
  const source=record?.source;
  if(source?.kind!=='local-file'||!source.relative_path)return null;
  return sourceRecordKey(source.source_root??path.dirname(source.absolute_path??'.'),source.relative_path);
}
function profileList(profiles){
  const values=Array.isArray(profiles)&&profiles.length?profiles:['runtime'];
  return [...new Set(values.map(safeProfile))].sort((a,b)=>a.localeCompare(b));
}
function sourceRootsFor(project,sourceRoots){
  const roots=sourceRoots??project?.assets?.import_roots??[];
  return unique(roots);
}
function cacheEntryDir(cacheDir,cacheKey){const key=safeCacheKey(cacheKey);return path.join(path.resolve(cacheDir),key.slice(0,2),key)}
function cacheManifestPath(cacheDir,cacheKey){return path.join(cacheEntryDir(cacheDir,cacheKey),'manifest.json')}
function cachePayloadPath(cacheDir,cacheKey){return path.join(cacheEntryDir(cacheDir,cacheKey),'payload')}
function readCacheManifest(cacheDir,cacheKey){
  const manifestPath=cacheManifestPath(cacheDir,cacheKey),payloadPath=cachePayloadPath(cacheDir,cacheKey);
  if(!fs.existsSync(manifestPath)||!fs.existsSync(payloadPath))return null;
  try{
    const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    if(manifest.cache_key!==cacheKey||manifest.payload?.sha256!==fileSha256(payloadPath))return null;
    return{manifest,manifest_path:manifestPath,payload_path:payloadPath};
  }catch{return null}
}
function loadCacheIndex(cacheDir){
  const filePath=path.join(path.resolve(cacheDir),'index.json');
  if(!fs.existsSync(filePath))return{format:ASSET_CACHE_INDEX_FORMAT,version:ASSET_DATABASE_VERSION,entries:[],index_root:null};
  try{return JSON.parse(fs.readFileSync(filePath,'utf8'))}catch(e){throw new StudioError('ASSET_CACHE_INDEX_INVALID',filePath,{cause:e.message})}
}
function saveCacheIndex(cacheDir,entries){
  const values=Object.values(entries).sort((a,b)=>`${a.asset_id}:${a.profile}`.localeCompare(`${b.asset_id}:${b.profile}`));
  const index=seal({format:ASSET_CACHE_INDEX_FORMAT,version:ASSET_DATABASE_VERSION,entries:values},'index_root');
  writeJson(path.join(path.resolve(cacheDir),'index.json'),index);
  return index;
}

export function deriveAssetCacheKey(record,{profile='runtime'}={}){
  const p=safeProfile(profile),source=record?.source??{},file=record?.files?.[0]??{};
  if(!record?.asset_id||!source.sha256)throw new StudioError('ASSET_CACHE_INPUT_INVALID',record?.asset_id??'unknown');
  return rootHash({format:ASSET_DERIVED_ARTIFACT_FORMAT,version:ASSET_DATABASE_VERSION,asset_id:record.asset_id,source_sha256:source.sha256,importer:source.importer??null,profile:p,kind:record.kind??'unknown',mime:file.mime??null,size:file.size??source.size??0,dependencies:(record.dependencies??[]).map(dep=>({kind:dep.kind??null,path:dep.path??null,asset_id:dep.asset_id??null,root:dep.root??null}))});
}

export function materializeDerivedAsset(record,{cacheDir,profile='runtime'}={}){
  if(!cacheDir)throw new StudioError('ASSET_CACHE_DIR_REQUIRED');
  const p=safeProfile(profile),cacheKey=deriveAssetCacheKey(record,{profile:p}),existing=readCacheManifest(cacheDir,cacheKey);
  if(existing)return{status:'hit',cache_key:cacheKey,profile:p,...existing};
  let payload;
  if(record.source?.kind==='local-file'){
    const sourcePath=record.source.absolute_path;
    if(!sourcePath||!fs.existsSync(sourcePath))throw new StudioError('ASSET_SOURCE_FILE_MISSING',sourcePath??'');
    payload=fs.readFileSync(sourcePath);
  }else if(record.source?.kind==='embedded'&&record.files?.[0]?.embedded_base64)payload=Buffer.from(record.files[0].embedded_base64,'base64');
  else throw new StudioError('ASSET_SOURCE_NOT_MATERIALIZABLE',record.asset_id??'unknown');
  const entryDir=cacheEntryDir(cacheDir,cacheKey),payloadPath=cachePayloadPath(cacheDir,cacheKey),manifestPath=cacheManifestPath(cacheDir,cacheKey);
  if(fs.existsSync(entryDir))fs.rmSync(entryDir,{recursive:true,force:true});
  fs.mkdirSync(entryDir,{recursive:true});
  const tempPath=`${payloadPath}.tmp-${process.pid}`;
  fs.writeFileSync(tempPath,payload);fs.renameSync(tempPath,payloadPath);
  const manifest=seal({format:ASSET_DERIVED_ARTIFACT_FORMAT,version:ASSET_DATABASE_VERSION,cache_key:cacheKey,asset_id:record.asset_id,profile:p,source_sha256:record.source.sha256,kind:record.kind??'unknown',mime:record.files?.[0]?.mime??null,payload:{path:'payload',sha256:fileSha256(payloadPath),size:payload.length},dependencies:clone(record.dependencies??[])},'artifact_root');
  writeJson(manifestPath,manifest);
  return{status:'built',cache_key:cacheKey,profile:p,manifest,manifest_path:manifestPath,payload_path:payloadPath};
}

function publicItem(item){
  const {absolute_path,source_root,previous,...out}=item;
  out.source_root_id=sourceRootId(source_root);out.source_key=publicSourceKey(item);return out;
}

export class AssetDatabase{
  constructor(project,{cacheDir=path.join(process.cwd(),'output','asset-cache'),clock=now,profiles=['runtime']}={}){
    this.project=clone(project??{assets:{registry:{},order:[],import_roots:[]}});
    this.cacheDir=path.resolve(cacheDir);this.clock=typeof clock==='function'?clock:now;this.profiles=profileList(profiles);this.lastPlanRoot=null;
  }

  _recordsBySource(){
    const records=new Map();
    for(const record of Object.values(this.project.assets?.registry??{})){const key=recordKey(record);if(key)records.set(key,record)}
    return records;
  }

  _collect({sourceRoots,recursive=true,profiles=this.profiles}={}){
    const roots=sourceRootsFor(this.project,sourceRoots),wantedProfiles=profileList(profiles),records=this._recordsBySource(),discovered=[],seen=new Set();
    for(const root of roots){
      if(!fs.existsSync(root))continue;
      for(const absolutePath of scanAssetFiles(root,{recursive})){
        if(isInside(absolutePath,this.cacheDir))continue;
        const relativePath=normalizePath(path.relative(root,absolutePath)||path.basename(absolutePath)),key=sourceRecordKey(root,relativePath),info=(()=>{try{return fileInfo(absolutePath)}catch{return null}})();if(!info)continue;const previous=records.get(key)??null;
        const assetId=previous?.asset_id??fallbackAssetId(relativePath),status=!previous?'added':previous.source?.sha256===info.sha256?'unchanged':'changed',cache={};
        const candidate={asset_id:assetId,source_key:key,relative_path:relativePath,status,previous_root:previous?.asset_root??null,source_sha256:previous?.source?.sha256??null,actual_sha256:info.sha256,size:info.size,cache};
        for(const profile of wantedProfiles){const estimated={asset_id:assetId,kind:previous?.kind??'unknown',source:{sha256:info.sha256,importer:previous?.source?.importer??null,size:info.size},files:[{mime:previous?.files?.[0]?.mime??null,size:info.size}],dependencies:previous?.dependencies??[]};const cacheKey=deriveAssetCacheKey(estimated,{profile}),hit=readCacheManifest(this.cacheDir,cacheKey);cache[profile]={cache_key:cacheKey,status:hit?'hit':'miss',artifact_root:hit?.manifest?.artifact_root??null}}
        discovered.push({...candidate,absolute_path:absolutePath,source_root:root,previous});seen.add(key);
      }
    }
    const missing=[];
    for(const [key,previous] of records){const root=path.resolve(previous.source.source_root??path.dirname(previous.source.absolute_path??'.'));if(!roots.includes(root)||seen.has(key))continue;missing.push({asset_id:previous.asset_id,source_key:key,relative_path:previous.source.relative_path,status:'missing',previous_root:previous.asset_root,source_sha256:previous.source.sha256,actual_sha256:null,size:previous.source.size??0,cache:{},source_root:root,previous})}
    const items=[...discovered,...missing].sort((a,b)=>a.source_key.localeCompare(b.source_key));
    const plan=seal({format:ASSET_CHANGE_PLAN_FORMAT,version:ASSET_DATABASE_VERSION,source_root_ids:roots.map(sourceRootId),recursive:Boolean(recursive),profiles:wantedProfiles,items:items.map(publicItem)},'plan_root');
    return{roots,profiles:wantedProfiles,items,plan};
  }

  plan(options={}){const result=this._collect(options);this.lastPlanRoot=result.plan.plan_root;return result.plan}

  sync({sourceRoots,recursive=true,profiles=this.profiles,materialize=true}={}){
    const collected=this._collect({sourceRoots,recursive,profiles}),next=clone(this.project);next.assets??={registry:{},order:[],import_roots:[]};next.assets.registry??={};next.assets.order??=[];next.assets.import_roots??=[];
    const cacheEntries=Object.fromEntries(loadCacheIndex(this.cacheDir).entries.map(entry=>[`${entry.asset_id}:${entry.profile}`,entry])),receipts=[],artifacts=[];let added=0,changed=0,unchanged=0,missing=0;
    for(const item of collected.items){
      let record=item.previous??null;
      if(item.status==='added'||item.status==='changed'){
        record=createLocalAssetRecord(item.absolute_path,{sourceRoot:item.source_root,previousRecord:item.previous??null,importedAt:this.clock()});next.assets.registry[record.asset_id]=record;if(!next.assets.order.includes(record.asset_id))next.assets.order.push(record.asset_id);if(item.status==='added')added++;else changed++;
      }else if(item.status==='unchanged'){record=next.assets.registry[item.asset_id]??record;unchanged++;}
      else if(item.status==='missing'&&record){const updated=clone(record);updated.status='missing';updated.import_state={...(updated.import_state??{}),last_checked_at:this.clock(),stale:true};next.assets.registry[record.asset_id]=updated;missing++;}
      if(record&&item.status!=='missing'&&materialize){for(const profile of collected.profiles){const artifact=materializeDerivedAsset(record,{cacheDir:this.cacheDir,profile});artifacts.push({asset_id:record.asset_id,...artifact});cacheEntries[`${record.asset_id}:${profile}`]={asset_id:record.asset_id,profile,cache_key:artifact.cache_key,artifact_root:artifact.manifest.artifact_root,source_sha256:record.source.sha256,payload_sha256:artifact.manifest.payload.sha256,size:artifact.manifest.payload.size,kind:record.kind??'unknown',mime:artifact.manifest.mime??null};}}
      receipts.push({asset_id:item.asset_id,status:item.status,source_key:item.source_key,source_root:item.source_root,relative_path:item.relative_path,previous_root:item.previous_root,next_root:record?.asset_root??null});
    }
    next.assets.import_roots=[...new Set([...next.assets.import_roots,...collected.roots])].sort((a,b)=>normalizePath(a).localeCompare(normalizePath(b)));
    const cacheIndex=materialize?saveCacheIndex(this.cacheDir,cacheEntries):loadCacheIndex(this.cacheDir),summary={added,changed,unchanged,missing,checked:collected.items.length,cache_artifacts:artifacts.length,cache_hits:artifacts.filter(a=>a.status==='hit').length,cache_builds:artifacts.filter(a=>a.status==='built').length};
    const syncReceipt=seal({format:'reality-studio.asset-database-sync.v1.4',version:ASSET_DATABASE_VERSION,plan_root:collected.plan.plan_root,source_root_ids:collected.roots.map(sourceRootId),profiles:collected.profiles,operations:receipts.map(({asset_id,status,source_key,previous_root,next_root,source_root,relative_path})=>({asset_id,status,source_key:`${sourceRootId(source_root)}::${sourceIdentity(relative_path)}`,previous_root,next_root})),summary,cache_index_root:cacheIndex.index_root},'sync_root');
    next.assets.database={format:ASSET_DATABASE_FORMAT,version:ASSET_DATABASE_VERSION,cache_namespace:'content-addressed',profiles:collected.profiles,source_root_ids:collected.roots.map(sourceRootId),last_plan_root:collected.plan.plan_root,last_sync_root:syncReceipt.sync_root,updated_at:this.clock()};
    this.project=next;this.lastPlanRoot=collected.plan.plan_root;
    return{project:clone(next),plan:collected.plan,sync_receipt:syncReceipt,summary,artifacts:artifacts.map(({manifest_path,payload_path,...artifact})=>artifact),cache_index:cacheIndex};
  }

  inspect(){
    const index=loadCacheIndex(this.cacheDir);
    return{format:ASSET_DATABASE_FORMAT,version:ASSET_DATABASE_VERSION,cache_dir:this.cacheDir,profiles:this.profiles,project_root:this.project.project_root??null,asset_count:this.project.assets?.order?.length??0,cache_index_root:index.index_root??null,cache_entries:index.entries.length,last_plan_root:this.lastPlanRoot??this.project.assets?.database?.last_plan_root??null};
  }

  watch(options={}){return new AssetDatabaseWatcher(this,options)}
}

export function createAssetDatabase(project,options={}){return new AssetDatabase(project,options)}

export class AssetDatabaseWatcher{
  constructor(database,{sourceRoots,recursive=true,intervalMs=1000,autoSync=false,onPlan=null,onSync=null}={}){
    this.database=database;this.sourceRoots=sourceRoots;this.recursive=Boolean(recursive);this.intervalMs=Math.max(100,Math.round(intervalMs));this.autoSync=Boolean(autoSync);this.onPlan=onPlan;this.onSync=onSync;this.running=false;this.watchers=[];this.timer=null;this.debounce=null;this.busy=false;this.lastPlanRoot=null;
  }
  async poll({force=false}={}){
    if(this.busy)return{changed:false,busy:true,plan:null,synced:null};
    this.busy=true;
    try{
      const plan=this.database._collect({sourceRoots:this.sourceRoots,recursive:this.recursive,profiles:this.database.profiles}).plan,changed=force||plan.plan_root!==this.lastPlanRoot;this.lastPlanRoot=plan.plan_root;
      if(!changed)return{changed:false,busy:false,plan,synced:null};
      if(typeof this.onPlan==='function')await this.onPlan(plan);
      let synced=null;if(this.autoSync){synced=this.database.sync({sourceRoots:this.sourceRoots,recursive:this.recursive,profiles:this.database.profiles});if(typeof this.onSync==='function')await this.onSync(synced)}
      return{changed:true,busy:false,plan,synced};
    }finally{this.busy=false}
  }
  _schedule(){if(this.debounce)clearTimeout(this.debounce);this.debounce=setTimeout(()=>{this.debounce=null;void this.poll()},Math.min(this.intervalMs,250))}
  start(){
    if(this.running)return this;
    const roots=sourceRootsFor(this.database.project,this.sourceRoots);for(const root of roots){if(!fs.existsSync(root))throw new StudioError('ASSET_WATCH_ROOT_MISSING',root);try{this.watchers.push(fs.watch(root,{recursive:this.recursive},()=>this._schedule()))}catch{this.watchers.push(fs.watch(root,()=>this._schedule()))}}
    this.timer=setInterval(()=>{void this.poll()},this.intervalMs);this.timer.unref?.();this.running=true;return this;
  }
  stop(){for(const watcher of this.watchers)watcher.close();this.watchers=[];if(this.timer)clearInterval(this.timer);if(this.debounce)clearTimeout(this.debounce);this.timer=null;this.debounce=null;this.running=false;return this}
  inspect(){return{running:this.running,recursive:this.recursive,interval_ms:this.intervalMs,auto_sync:this.autoSync,last_plan_root:this.lastPlanRoot,watch_root_count:this.watchers.length}}
}
