import fs from 'node:fs';
import path from 'node:path';
import {ensureDir,sha256,writeJson,seal,BuildError} from './canonical.mjs';
import {createAssetDatabase,materializeDerivedAsset} from '@taowind/reality-studio-native/asset-database';

const MIME={'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.json':'application/json','.ttf':'font/ttf','.otf':'font/otf'};
const TEXT_EXTENSIONS=new Set(['.css','.glsl','.html','.js','.json','.mjs','.svg','.ts','.txt','.xml','.yaml','.yml']);
const extMime=p=>MIME[path.extname(p).toLowerCase()]??'application/octet-stream';
const assetBytes=file=>{
  const bytes=fs.readFileSync(file);
  if(!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()))return bytes;
  return Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n'),'utf8');
};
const copyAssetDeterministic=(src,dst)=>{ensureDir(path.dirname(dst));fs.writeFileSync(dst,assetBytes(src));fs.utimesSync(dst,new Date(0),new Date(0));return dst;};
const writeBytesDeterministic=(dst,bytes)=>{ensureDir(path.dirname(dst));fs.writeFileSync(dst,bytes);fs.utimesSync(dst,new Date(0),new Date(0));return dst;};
const dataUriBytes=(bytes,mime)=>`data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;

function candidateRoots(projectFile,record){
  const dir=path.dirname(projectFile),roots=[dir,path.join(dir,'assets')];
  if(record.preview_url){
    const normalized=record.preview_url.replaceAll('\\','/');
    const parts=normalized.split('/');
    if(parts[0]==='assets'&&parts.length>=2)roots.push(path.join(dir,'assets',parts[1]));
    roots.push(path.dirname(path.resolve(dir,record.preview_url)));
  }
  if(record.name)roots.push(path.join(dir,'assets',record.name));
  return [...new Set(roots.map(x=>path.resolve(x)))];
}

export function resolveAssetFile(projectFile,record,file){
  const attempts=[];
  if(file?.absolute_path)attempts.push(path.resolve(file.absolute_path));
  for(const root of candidateRoots(projectFile,record)){
    if(file?.path)attempts.push(path.resolve(root,file.path));
  }
  if(record.preview_url&&(file?.role==='preview'||file?.path===record.preview_url))attempts.unshift(path.resolve(path.dirname(projectFile),record.preview_url));
  for(const p of [...new Set(attempts)])if(fs.existsSync(p)&&fs.statSync(p).isFile())return{found:true,path:p,attempts};
  return{found:false,path:null,attempts};
}

function fallbackSvg(record){
  const color=record?.extensions?.visual?.color??'#72d7ff';const name=String(record?.name??record?.asset_id??'Asset').replace(/[&<>]/g,'');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#10263d"/></linearGradient></defs><rect width="128" height="128" rx="20" fill="#071426"/><circle cx="64" cy="54" r="30" fill="url(#g)"/><rect x="33" y="84" width="62" height="24" rx="12" fill="${color}" opacity=".8"/><text x="64" y="119" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#e8f6ff">${name}</text></svg>`;
}

function selectPrimary(record,resolved){
  const order=['sprite-sheet','concept-png','concept-svg','preview','icon'];
  for(const role of order){const hit=resolved.find(x=>x.role===role);if(hit)return hit;}
  return resolved.find(x=>x.mime.startsWith('image/'))??resolved[0]??null;
}

function materializeCacheArtifact(record,assetDatabase){
  if(!assetDatabase?.enabled||!['local-file','embedded'].includes(record?.source?.kind))return null;
  try{return materializeDerivedAsset(record,{cacheDir:assetDatabase.cache_dir,profile:assetDatabase.profile});}
  catch(error){if(['ASSET_SOURCE_NOT_MATERIALIZABLE','ASSET_SOURCE_FILE_MISSING'].includes(error.code))return null;throw error;}
}

function stableAssetChangePlan(plan){const stable=structuredClone(plan);for(const item of stable.items??[])delete item.cache;delete stable.plan_root;return seal(stable,'plan_root');}
function stableAssetDatabaseSync(result,plan,sourceRootIds,profiles,cacheIndex,artifactCount){return seal({format:'reality-build.asset-database-sync.v0.1',version:'0.1.0',plan_root:plan.plan_root,source_root_ids:sourceRootIds,profiles,operations:result.sync_receipt.operations,summary:{added:result.summary.added,changed:result.summary.changed,unchanged:result.summary.unchanged,missing:result.summary.missing,checked:result.summary.checked,cache_artifacts:artifactCount},cache_index_root:cacheIndex.index_root},'sync_root');}

export function syncAssetDatabase({project,request}){
  const config=request?.asset_database;
  if(!config?.enabled)return{enabled:false,project,evidence:null,plan:null,sync_receipt:null,cache_index:null,cache_dir:null,profile:'runtime'};
  const database=createAssetDatabase(project,{cacheDir:config.cache_dir,profiles:config.profiles,clock:()=>request.build_time});
  const result=database.sync({sourceRoots:config.source_roots.length?config.source_roots:undefined,recursive:config.recursive,profiles:config.profiles,materialize:config.materialize});
  const sourceRootIds=result.project.assets.database?.source_root_ids??[],profiles=result.project.assets.database?.profiles??config.profiles,plan=stableAssetChangePlan(result.plan),observedArtifacts=result.artifacts.map(({asset_id,profile,status,cache_key,artifact_root,source_sha256,payload_sha256,size,kind,mime})=>({asset_id,profile,status,cache_key,artifact_root,source_sha256,payload_sha256,size,kind,mime})),artifacts=observedArtifacts.map(({status,...artifact})=>artifact),syncReceipt=stableAssetDatabaseSync(result,plan,sourceRootIds,profiles,result.cache_index,artifacts.length),stableProject=structuredClone(result.project);
  stableProject.assets.database={...(stableProject.assets.database??{}),last_plan_root:plan.plan_root,last_sync_root:syncReceipt.sync_root};
  const evidence=seal({format:'reality-build.asset-database-evidence.v0.1',version:'0.1.0',database_format:stableProject.assets.database?.format??null,database_version:stableProject.assets.database?.version??null,source_root_ids:sourceRootIds,profiles,plan_root:plan.plan_root,sync_root:syncReceipt.sync_root,cache_index_root:result.cache_index.index_root,summary:{added:result.summary.added,changed:result.summary.changed,unchanged:result.summary.unchanged,missing:result.summary.missing,checked:result.summary.checked,cache_artifacts:artifacts.length},asset_ids:stableProject.assets.order,artifacts},'database_root');
  return{enabled:true,project:stableProject,evidence,plan,sync_receipt:syncReceipt,cache_index:result.cache_index,cache_dir:config.cache_dir,profile:config.profiles[0]??'runtime',observation:{summary:result.summary,artifacts:observedArtifacts}};
}

export function assetDatabasePayload(assetDatabase,assetManifest=null){
  if(!assetDatabase?.enabled)return null;
  return{...assetDatabase.evidence,asset_manifest_root:assetManifest?.manifest_root??null};
}

export function publicAssetManifest(assetManifest){
  const publicManifest=structuredClone(assetManifest);
  for(const rec of Object.values(publicManifest.records??{}))for(const f of rec.files??[])f.embedded_uri=null;
  delete publicManifest.manifest_root;
  return seal(publicManifest,'manifest_root');
}

export function writeAssetDatabaseEvidence(dir,{assetDatabase,assetManifest=null}={}){
  if(!assetDatabase?.enabled)return[];
  const files=[['asset-database.json',assetDatabase.evidence],['asset-change-plan.json',assetDatabase.plan],['asset-database-sync.json',assetDatabase.sync_receipt],['asset-cache-index.json',assetDatabase.cache_index]];
  if(assetManifest)files.push(['asset-manifest.json',assetManifest]);
  for(const [name,value] of files)writeJson(path.join(dir,name),value);
  return files.map(([name])=>name);
}

export function bakeAssets({project,projectFile,outDir,embed=false,missingPolicy='fallback',assetDatabase=null}){
  const store=ensureDir(path.join(outDir,'assets'));
  const records={},warnings=[],errors=[],allFiles=[];
  for(const assetId of project.assets?.order??Object.keys(project.assets?.registry??{})){
    const record=project.assets.registry[assetId];if(!record){errors.push({code:'ASSET_RECORD_MISSING',asset_id:assetId});continue;}
    const resolved=[];
    const declared=[...(record.files??[])];
    if(record.preview_url&&!declared.some(f=>f.path===record.preview_url))declared.unshift({role:'preview',path:record.preview_url,mime:extMime(record.preview_url),platforms:['all']});
    for(const f of declared){
      const cached=record.files?.[0]===f?materializeCacheArtifact(record,assetDatabase):null;
      const r=cached?{found:true,path:cached.payload_path,attempts:[]} : resolveAssetFile(projectFile,record,f);
      if(!r.found){warnings.push({code:'ASSET_FILE_UNRESOLVED',asset_id:assetId,role:f.role,path:f.path,attempts:r.attempts});continue;}
      const bytes=cached?fs.readFileSync(r.path):assetBytes(r.path),actual=sha256(bytes);if(f.sha256&&f.sha256!==actual){errors.push({code:'ASSET_HASH_MISMATCH',asset_id:assetId,path:f.path,expected:f.sha256,actual});continue;}
      const sourceName=f.path??record.preview_url??r.path,ext=path.extname(sourceName).toLowerCase()||path.extname(r.path).toLowerCase()||'.bin',destName=`${actual}${ext}`,dest=path.join(store,destName);if(!fs.existsSync(dest))writeBytesDeterministic(dest,bytes);
      const mime=f.mime??extMime(sourceName),row={role:f.role??'file',source_path:f.path??record.preview_url,source_kind:cached?'asset-database-cache':'file',cache_status:cached?.status??null,cache_key:cached?.cache_key??null,artifact_root:cached?.manifest?.artifact_root??null,store_path:`assets/${destName}`,mime,sha256:actual,size:bytes.length,platforms:f.platforms??['all'],embedded_uri:embed?dataUriBytes(bytes,mime):null};resolved.push(row);allFiles.push(row);
    }
    if(!resolved.some(x=>x.mime.startsWith('image/'))){
      if(missingPolicy==='error'){errors.push({code:'ASSET_VISUAL_MISSING',asset_id:assetId});}
      else{
        const svg=fallbackSvg(record),actual=sha256(svg),destName=`${actual}.svg`,dest=path.join(store,destName);if(!fs.existsSync(dest))writeBytesDeterministic(dest,Buffer.from(svg));
        const row={role:'fallback',source_path:null,store_path:`assets/${destName}`,mime:'image/svg+xml',sha256:actual,size:Buffer.byteLength(svg),platforms:['all'],embedded_uri:embed?`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`:null};resolved.push(row);allFiles.push(row);warnings.push({code:'ASSET_FALLBACK_GENERATED',asset_id:assetId});
      }
    }
    const primary=selectPrimary(record,resolved);
    records[assetId]={asset_id:assetId,name:record.name??assetId,kind:record.kind??'unknown',asset_root:record.asset_root??null,bundle_root:record.bundle_root??null,primary_visual:primary?{role:primary.role,path:primary.store_path,mime:primary.mime,sha256:primary.sha256,uri:primary.embedded_uri}:null,files:resolved};
  }
  const manifest=seal({format:'reality-build.asset-manifest.v0.1',version:'0.1.0',project_root:project.project_root,records,store:{algorithm:'sha256',file_count:new Set(allFiles.map(x=>x.store_path)).size},warnings,errors},'manifest_root');
  writeJson(path.join(outDir,'asset-manifest.json'),manifest);
  if(errors.length)throw new BuildError('ASSET_BAKE_FAILED','',manifest);
  return manifest;
}

export function copyBakedAssets(assetManifest,fromDir,toDir){
  const copied=[];for(const rec of Object.values(assetManifest.records))for(const f of rec.files){const src=path.join(fromDir,f.store_path),dst=path.join(toDir,f.store_path);if(!fs.existsSync(dst)){copyAssetDeterministic(src,dst);copied.push(f.store_path);}}
  return copied;
}

export function assetRuntimeMap(assetManifest,{embedded=false}={}){
  const out={};for(const [id,rec] of Object.entries(assetManifest.records)){const p=rec.primary_visual;out[id]={name:rec.name,kind:rec.kind,uri:p?(embedded?p.uri:p.path):'',sha256:p?.sha256??null};}return out;
}
