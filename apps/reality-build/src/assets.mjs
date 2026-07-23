import fs from 'node:fs';
import path from 'node:path';
import {ensureDir,sha256,writeJson,seal,BuildError,safeName} from './canonical.mjs';

const MIME={'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.json':'application/json','.ttf':'font/ttf','.otf':'font/otf'};
const TEXT_EXTENSIONS=new Set(['.css','.glsl','.html','.js','.json','.mjs','.svg','.ts','.txt','.xml','.yaml','.yml']);
const extMime=p=>MIME[path.extname(p).toLowerCase()]??'application/octet-stream';
const assetBytes=file=>{
  const bytes=fs.readFileSync(file);
  if(!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()))return bytes;
  return Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n'),'utf8');
};
const assetHash=file=>sha256(assetBytes(file));
const copyAssetDeterministic=(src,dst)=>{ensureDir(path.dirname(dst));fs.writeFileSync(dst,assetBytes(src));fs.utimesSync(dst,new Date(0),new Date(0));return dst;};
const dataUri=(file,mime=extMime(file))=>`data:${mime};base64,${assetBytes(file).toString('base64')}`;

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

export function bakeAssets({project,projectFile,outDir,embed=false,missingPolicy='fallback'}){
  const store=ensureDir(path.join(outDir,'assets'));
  const records={},warnings=[],errors=[],allFiles=[];
  for(const assetId of project.assets?.order??Object.keys(project.assets?.registry??{})){
    const record=project.assets.registry[assetId];if(!record){errors.push({code:'ASSET_RECORD_MISSING',asset_id:assetId});continue;}
    const resolved=[];
    const declared=[...(record.files??[])];
    if(record.preview_url&&!declared.some(f=>f.path===record.preview_url))declared.unshift({role:'preview',path:record.preview_url,mime:extMime(record.preview_url),platforms:['all']});
    for(const f of declared){
      const r=resolveAssetFile(projectFile,record,f);
      if(!r.found){warnings.push({code:'ASSET_FILE_UNRESOLVED',asset_id:assetId,role:f.role,path:f.path,attempts:r.attempts});continue;}
      const actual=assetHash(r.path);if(f.sha256&&f.sha256!==actual){errors.push({code:'ASSET_HASH_MISMATCH',asset_id:assetId,path:f.path,expected:f.sha256,actual});continue;}
      const bytes=assetBytes(r.path),ext=path.extname(r.path).toLowerCase()||'.bin',destName=`${actual}${ext}`,dest=path.join(store,destName);if(!fs.existsSync(dest))copyAssetDeterministic(r.path,dest);
      const row={role:f.role??'file',source_path:f.path??record.preview_url,store_path:`assets/${destName}`,mime:f.mime??extMime(r.path),sha256:actual,size:bytes.length,platforms:f.platforms??['all'],embedded_uri:embed?dataUri(r.path,f.mime??extMime(r.path)):null};resolved.push(row);allFiles.push(row);
    }
    if(!resolved.some(x=>x.mime.startsWith('image/'))){
      if(missingPolicy==='error'){errors.push({code:'ASSET_VISUAL_MISSING',asset_id:assetId});}
      else{
        const svg=fallbackSvg(record),actual=sha256(svg),destName=`${actual}.svg`,dest=path.join(store,destName);if(!fs.existsSync(dest)){fs.writeFileSync(dest,svg);fs.utimesSync(dest,new Date(0),new Date(0));}
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
