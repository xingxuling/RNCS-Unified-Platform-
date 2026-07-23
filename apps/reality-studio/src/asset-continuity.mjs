import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {clone,now,rootHash,seal,StudioError} from './canonical.mjs';

export const ASSET_CONTINUITY_VERSION='1.3.0-alpha.1';
export const ASSET_RECORD_FORMAT='reality-studio.asset-record.v1.3';
export const ASSET_LEDGER_FORMAT='reality-studio.asset-continuity-ledger.v1.3';

const MIME={
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml',
  '.wav':'audio/wav','.ogg':'audio/ogg','.mp3':'audio/mpeg','.flac':'audio/flac',
  '.json':'application/json','.yaml':'application/yaml','.yml':'application/yaml','.txt':'text/plain','.md':'text/markdown',
  '.glsl':'text/x-glsl','.wgsl':'text/x-wgsl','.js':'text/javascript','.mjs':'text/javascript','.ts':'text/typescript',
  '.ttf':'font/ttf','.otf':'font/otf','.woff':'font/woff','.woff2':'font/woff2',
  '.glb':'model/gltf-binary','.gltf':'model/gltf+json','.bin':'application/octet-stream',
  '.ktx2':'image/ktx2','.hdr':'image/vnd.radiance','.exr':'image/x-exr'
};
const EXTENSIONS=new Set(Object.keys(MIME).filter(ext=>ext!=='.bin'));
const DEPENDENCY_EXTENSIONS=new Set([...EXTENSIONS,'.bin']);
const VISUAL=new Set(['.png','.jpg','.jpeg','.webp','.gif','.svg']);
const AUDIO=new Set(['.wav','.ogg','.mp3','.flac']);
const TEXT=new Set(['.json','.yaml','.yml','.txt','.md','.glsl','.wgsl','.js','.mjs','.ts']);
const FONT=new Set(['.ttf','.otf','.woff','.woff2']);
const MODEL=new Set(['.glb','.gltf']);
const MATERIAL=new Set(['.ktx2','.hdr','.exr']);
const IGNORE=new Set(['node_modules','.git','dist','output','.cache','.idea','.vscode']);
const sha256Buffer=b=>createHash('sha256').update(b).digest('hex');
const sha256File=p=>sha256Buffer(fs.readFileSync(p));
const normalizePath=p=>String(p).replaceAll('\\','/');
const safeName=s=>String(s??'asset').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').trim()||'asset';

export function assetMime(filePath){return MIME[path.extname(filePath).toLowerCase()]??'application/octet-stream'}
export function inferAssetKind(filePath,mime=assetMime(filePath)){
  const ext=path.extname(filePath).toLowerCase();
  if(VISUAL.has(ext))return ext==='.svg'?'vector-2d':'texture-2d';
  if(AUDIO.has(ext))return 'audio';
  if(MODEL.has(ext))return 'model-3d';
  if(MATERIAL.has(ext))return 'texture-3d';
  if(FONT.has(ext))return 'font';
  if(ext==='.json')return 'structured-data';
  if(ext==='.glsl'||ext==='.wgsl')return 'shader';
  if(TEXT.has(ext)||mime.startsWith('text/'))return 'text';
  return 'binary';
}
export function inferAssetRole(filePath){
  const ext=path.extname(filePath).toLowerCase();
  if(VISUAL.has(ext))return ext==='.svg'?'vector-source':'visual-source';
  if(AUDIO.has(ext))return 'audio-source';
  if(MODEL.has(ext))return 'mesh-source';
  if(MATERIAL.has(ext))return 'material-source';
  if(FONT.has(ext))return 'font-source';
  if(ext==='.json')return 'data-source';
  if(ext==='.glsl'||ext==='.wgsl')return 'shader-source';
  return 'source';
}
function sourceKey(filePath,sourceRoot){
  const absolute=path.resolve(filePath),root=sourceRoot?path.resolve(sourceRoot):path.dirname(absolute);
  return normalizePath(path.relative(root,absolute)||path.basename(absolute)).toLowerCase();
}
function stableAssetId(filePath,sourceRoot){
  const key=sourceKey(filePath,sourceRoot);return `asset:local:${createHash('sha256').update(key).digest('hex').slice(0,24)}`;
}
function dependencyStrings(value,out=new Set()){
  if(typeof value==='string'){
    const clean=value.split(/[?#]/)[0];const ext=path.extname(clean).toLowerCase();
    if(DEPENDENCY_EXTENSIONS.has(ext))out.add(normalizePath(clean));
  }else if(Array.isArray(value))for(const item of value)dependencyStrings(item,out);
  else if(value&&typeof value==='object')for(const item of Object.values(value))dependencyStrings(item,out);
  return out;
}
function inferDependencies(filePath,buffer){
  const ext=path.extname(filePath).toLowerCase();const deps=[];
  if(ext==='.json'||ext==='.gltf'){
    try{const parsed=JSON.parse(buffer.toString('utf8'));for(const p of dependencyStrings(parsed))deps.push({kind:'file',path:p});}
    catch{ /* validation reports invalid JSON separately */ }
  }
  return deps.sort((a,b)=>a.path.localeCompare(b.path));
}
function previewFor(filePath,mime,{previewUrl=null,embeddedDataUrl=null}={}){
  if(previewUrl)return previewUrl;
  if(embeddedDataUrl&&mime.startsWith('image/'))return embeddedDataUrl;
  if(mime.startsWith('image/'))return normalizePath(filePath);
  return null;
}
function sourceStat(filePath){const s=fs.statSync(filePath);return{size:s.size,mtime_ms:Math.trunc(s.mtimeMs)}}

export function createLocalAssetRecord(filePath,{sourceRoot=null,assetId=null,name=null,previousRecord=null,previewUrl=null,copyPath=null}={}){
  const absolute=path.resolve(filePath);if(!fs.existsSync(absolute)||!fs.statSync(absolute).isFile())throw new StudioError('ASSET_SOURCE_FILE_MISSING',absolute);
  const ext=path.extname(absolute).toLowerCase();if(!EXTENSIONS.has(ext))throw new StudioError('ASSET_EXTENSION_UNSUPPORTED',ext,{supported:[...EXTENSIONS]});
  const buffer=fs.readFileSync(absolute),mime=assetMime(absolute),hash=sha256Buffer(buffer),stat=sourceStat(absolute),root=sourceRoot?path.resolve(sourceRoot):path.dirname(absolute),relative=normalizePath(path.relative(root,absolute)||path.basename(absolute));
  const prior=previousRecord??null,id=assetId??prior?.asset_id??stableAssetId(absolute,root),generation=Math.max(1,Number(prior?.import_state?.generation??0)+(prior?1:0));
  const history=[...(prior?.import_state?.history??[])];if(prior?.asset_root)history.push({generation:prior.import_state?.generation??1,asset_root:prior.asset_root,source_sha256:prior.source?.sha256??null,recorded_at:prior.import_state?.last_imported_at??prior.imported_at??now()});
  const raw={
    format:ASSET_RECORD_FORMAT,asset_id:id,name:name??prior?.name??path.basename(absolute,ext),kind:inferAssetKind(absolute,mime),continuity_policy:'stable-source-identity',
    source:{kind:'local-file',absolute_path:absolute,source_root:root,relative_path:relative,sha256:hash,size:stat.size,mtime_ms:stat.mtime_ms,extension:ext,importer:{id:'reality-studio.native-file-importer',version:ASSET_CONTINUITY_VERSION}},
    variants:prior?.variants??{selected:'source',available:['source']},
    files:[{role:inferAssetRole(absolute),path:copyPath??relative,mime,sha256:hash,size:stat.size,absolute_path:absolute,platforms:['desktop','mobile','web']}],
    dependencies:inferDependencies(absolute,buffer),extensions:{...(prior?.extensions??{}),asset_continuity:{source_key:sourceKey(absolute,root),content_addressed:true,reimportable:true}},
    preview_url:previewFor(copyPath??relative,mime,{previewUrl}),imported_at:prior?.imported_at??now(),status:'ready',
    import_state:{generation,first_imported_at:prior?.import_state?.first_imported_at??prior?.imported_at??now(),last_imported_at:now(),source_fingerprint:rootHash({relative_path:relative,sha256:hash,size:stat.size}),changed:prior?prior.source?.sha256!==hash:true,stale:false,history:history.slice(-20)}
  };
  return seal(raw,'asset_root');
}

export function createEmbeddedAssetRecord({name,mime='application/octet-stream',dataBase64,dataUrl=null},{assetId=null,previousRecord=null,importedAt=null}={}){
  if(!name||!dataBase64)throw new StudioError('EMBEDDED_ASSET_DATA_REQUIRED');const buffer=Buffer.from(dataBase64,'base64'),hash=sha256Buffer(buffer),ext=path.extname(name).toLowerCase();
  if(!EXTENSIONS.has(ext))throw new StudioError('ASSET_EXTENSION_UNSUPPORTED',ext);
  const id=assetId??previousRecord?.asset_id??`asset:embedded:${createHash('sha256').update(name.toLowerCase()).digest('hex').slice(0,24)}`;
  const timestamp=importedAt??now();
  return seal({format:ASSET_RECORD_FORMAT,asset_id:id,name:previousRecord?.name??path.basename(name,ext),kind:inferAssetKind(name,mime),continuity_policy:'stable-embedded-identity',source:{kind:'embedded',relative_path:safeName(name),sha256:hash,size:buffer.length,extension:ext,importer:{id:'reality-studio.browser-importer',version:ASSET_CONTINUITY_VERSION}},variants:{selected:'embedded',available:['embedded']},files:[{role:inferAssetRole(name),path:safeName(name),mime,sha256:hash,size:buffer.length,absolute_path:null,platforms:['desktop','mobile','web'],embedded_base64:dataBase64}],dependencies:inferDependencies(name,buffer),extensions:{asset_continuity:{content_addressed:true,reimportable:false}},preview_url:previewFor(name,mime,{embeddedDataUrl:dataUrl}),imported_at:previousRecord?.imported_at??timestamp,status:'ready',import_state:{generation:(previousRecord?.import_state?.generation??0)+1,first_imported_at:previousRecord?.import_state?.first_imported_at??timestamp,last_imported_at:timestamp,source_fingerprint:hash,changed:previousRecord?previousRecord.source?.sha256!==hash:true,stale:false,history:[]}},'asset_root');
}

export function reimportLocalAsset(record,{strict=true}={}){
  if(record?.source?.kind!=='local-file')throw new StudioError('ASSET_NOT_REIMPORTABLE',record?.asset_id??'unknown');const p=record.source.absolute_path;
  if(!p||!fs.existsSync(p)){if(strict)throw new StudioError('ASSET_SOURCE_FILE_MISSING',p??'');return{changed:false,record:{...clone(record),status:'missing'},receipt:seal({format:'reality-studio.asset-reimport-receipt.v1.3',asset_id:record.asset_id,status:'missing',source_path:p??null,checked_at:now()},'receipt_root')}}
  const actual=sha256File(p);if(actual===record.source.sha256){const next=clone(record);next.import_state={...next.import_state,last_checked_at:now(),changed:false,stale:false};next.status='ready';const sealed=seal(next,'asset_root');return{changed:false,record:sealed,receipt:seal({format:'reality-studio.asset-reimport-receipt.v1.3',asset_id:record.asset_id,status:'unchanged',source_sha256:actual,generation:record.import_state?.generation??1,checked_at:now()},'receipt_root')}}
  const next=createLocalAssetRecord(p,{sourceRoot:record.source.source_root,assetId:record.asset_id,name:record.name,previousRecord:record,previewUrl:record.preview_url});return{changed:true,record:next,receipt:seal({format:'reality-studio.asset-reimport-receipt.v1.3',asset_id:record.asset_id,status:'changed',previous_root:record.asset_root,next_root:next.asset_root,previous_sha256:record.source.sha256,next_sha256:next.source.sha256,generation:next.import_state.generation,checked_at:now()},'receipt_root')};
}

export function scanAssetFiles(source,{recursive=true}={}){
  const absolute=path.resolve(source);if(!fs.existsSync(absolute))throw new StudioError('ASSET_SOURCE_MISSING',absolute);const out=[];
  const walk=p=>{const st=fs.statSync(p);if(st.isFile()){if(EXTENSIONS.has(path.extname(p).toLowerCase()))out.push(path.resolve(p));return;}if(!st.isDirectory())return;for(const e of fs.readdirSync(p,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){if(IGNORE.has(e.name)||e.name.startsWith('.'))continue;const n=path.join(p,e.name);if(e.isDirectory()){if(recursive)walk(n)}else walk(n)}};
  walk(absolute);return out.sort((a,b)=>normalizePath(a).localeCompare(normalizePath(b)));
}

export function importAssetSource(source,{sourceRoot=null,existingRecords={},recursive=true}={}){
  const absolute=path.resolve(source),root=sourceRoot?path.resolve(sourceRoot):(fs.statSync(absolute).isDirectory()?absolute:path.dirname(absolute));const files=scanAssetFiles(absolute,{recursive});const bySource=new Map(Object.values(existingRecords??{}).filter(r=>r?.source?.relative_path).map(r=>[normalizePath(r.source.relative_path).toLowerCase(),r]));
  const records=files.map(p=>createLocalAssetRecord(p,{sourceRoot:root,previousRecord:bySource.get(sourceKey(p,root))??null}));
  return{source_root:root,records,receipt:seal({format:'reality-studio.asset-import-batch-receipt.v1.3',source_root:root,file_count:files.length,asset_ids:records.map(r=>r.asset_id),imported_at:now()},'receipt_root')};
}

function assetFileIndex(project){const map=new Map();for(const id of project?.assets?.order??Object.keys(project?.assets?.registry??{})){const r=project.assets.registry[id];for(const f of r?.files??[]){for(const key of [f.path,r.source?.relative_path].filter(Boolean))map.set(normalizePath(key).toLowerCase(),id)}}return map}
export function buildAssetDependencyGraph(project){
  const ids=project?.assets?.order??Object.keys(project?.assets?.registry??{}),registry=project?.assets?.registry??{},fileIndex=assetFileIndex(project),nodes=ids.map(id=>({asset_id:id,name:registry[id]?.name??id,kind:registry[id]?.kind??'unknown',asset_root:registry[id]?.asset_root??null})),edges=[],missing=[],external=[];
  for(const id of ids){const r=registry[id];for(const dep of r?.dependencies??[]){let target=dep.asset_id??null;if(!target&&dep.path)target=fileIndex.get(normalizePath(dep.path).toLowerCase())??null;if(target&&registry[target])edges.push({from:id,to:target,kind:dep.kind??'asset'});else if(dep.asset_id||dep.path)missing.push({from:id,dependency:clone(dep)});else if(dep.root)external.push({from:id,kind:dep.kind??'external-root',root:dep.root})}}
  const usage=[];for(const scene of project?.scenes??[])for(const node of scene.nodes??[])if(node.asset_id)usage.push({scene_id:scene.scene_id,node_id:node.node_id,asset_id:node.asset_id,resolved:Boolean(registry[node.asset_id])});
  const incoming=Object.fromEntries(ids.map(id=>[id,0]));for(const e of edges)incoming[e.to]=(incoming[e.to]??0)+1;for(const u of usage)if(u.resolved)incoming[u.asset_id]=(incoming[u.asset_id]??0)+1;
  const graph={format:'reality-studio.asset-dependency-graph.v1.3',nodes,edges:edges.sort((a,b)=>`${a.from}:${a.to}`.localeCompare(`${b.from}:${b.to}`)),usage:usage.sort((a,b)=>`${a.scene_id}:${a.node_id}`.localeCompare(`${b.scene_id}:${b.node_id}`)),missing,external:external.sort((a,b)=>`${a.from}:${a.kind}:${a.root}`.localeCompare(`${b.from}:${b.kind}:${b.root}`)),orphans:ids.filter(id=>(incoming[id]??0)===0)};
  return seal(graph,'graph_root');
}

export function auditAssetContinuity(project,{strictFiles=false}={}){
  const errors=[],warnings=[],items=[],registry=project?.assets?.registry??{},ids=project?.assets?.order??Object.keys(registry);
  for(const id of ids){const r=registry[id];if(!r){errors.push({code:'ASSET_REGISTRY_ENTRY_MISSING',asset_id:id});continue;}const item={asset_id:id,status:r.status??'unknown',asset_root:r.asset_root??null,source_kind:r.source?.kind??'unknown',source_sha256:r.source?.sha256??null,actual_sha256:null,stale:false,missing:false};
    if(r.source?.kind==='local-file'){
      const p=r.source.absolute_path;if(!p||!fs.existsSync(p)){item.missing=true;(strictFiles?errors:warnings).push({code:'ASSET_SOURCE_FILE_MISSING',asset_id:id,path:p??null});}
      else{item.actual_sha256=sha256File(p);item.stale=item.actual_sha256!==r.source.sha256;if(item.stale)warnings.push({code:'ASSET_SOURCE_STALE',asset_id:id,expected:r.source.sha256,actual:item.actual_sha256,path:p});}
    }
    for(const f of r.files??[])if(f.absolute_path&&!fs.existsSync(f.absolute_path))(strictFiles?errors:warnings).push({code:'ASSET_FILE_MISSING',asset_id:id,path:f.absolute_path});items.push(item);
  }
  const graph=buildAssetDependencyGraph(project);for(const m of graph.missing)warnings.push({code:'ASSET_DEPENDENCY_UNRESOLVED',...m});for(const u of graph.usage)if(!u.resolved)warnings.push({code:'SCENE_ASSET_UNRESOLVED',scene_id:u.scene_id,node_id:u.node_id,asset_id:u.asset_id});for(const id of graph.orphans)warnings.push({code:'ASSET_ORPHAN',asset_id:id});
  return seal({format:'reality-studio.asset-continuity-audit.v1.3',valid:errors.length===0,strict_files:Boolean(strictFiles),summary:{assets:ids.length,local:items.filter(i=>i.source_kind==='local-file').length,embedded:items.filter(i=>i.source_kind==='embedded').length,stale:items.filter(i=>i.stale).length,missing:items.filter(i=>i.missing).length,dependencies:graph.edges.length,unresolved_dependencies:graph.missing.length,scene_usages:graph.usage.length,orphans:graph.orphans.length,errors:errors.length,warnings:warnings.length},items,errors,warnings,graph_root:graph.graph_root,audited_at:now()},'audit_root');
}

export function createAssetContinuityLedger(project,{strictFiles=false}={}){
  const graph=buildAssetDependencyGraph(project),audit=auditAssetContinuity(project,{strictFiles}),assets=(project?.assets?.order??[]).map(id=>{const r=project.assets.registry[id];return{asset_id:id,name:r.name,kind:r.kind,asset_root:r.asset_root,source_kind:r.source?.kind??null,source_sha256:r.source?.sha256??null,generation:r.import_state?.generation??1,status:r.status??'unknown'}});
  return seal({format:ASSET_LEDGER_FORMAT,version:ASSET_CONTINUITY_VERSION,project_root:project?.project_root??null,assets,dependency_graph:graph,audit,generated_at:now()},'ledger_root');
}
