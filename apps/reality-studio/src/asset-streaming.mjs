import fs from 'node:fs/promises';
import path from 'node:path';
import {buildAssetDependencyGraph} from './asset-continuity.mjs';
import {deriveAssetCacheKey} from './asset-database.mjs';
import {VSRSpatialAssetStreamer,resolveSpatialAssetStreaming} from '@taowind/visual-state-runtime/spatial-asset-streaming';

export const REALITY_STUDIO_ASSET_STREAMING_FORMAT='reality-studio.asset-streaming.v0.1';
const defaultCacheDir=()=>path.join(process.cwd(),'output','asset-cache');
const kindMap={
  'model-3d':'mesh',
  'texture-2d':'texture',
  'texture-3d':'texture',
  material:'material',
  animation:'animation',
  audio:'audio',
  shader:'shader'
};
const unique=values=>[...new Set((values??[]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
const payloadPath=(cacheDir,cacheKey)=>path.join(path.resolve(cacheDir),cacheKey.slice(0,2),cacheKey,'payload');
const cacheUri=(profile,cacheKey)=>`asset-cache://${profile}/${cacheKey}`;
const missingPayloadError=(asset,filePath,cause)=>Object.assign(new Error(`Cached payload is unavailable for ${asset.id}: ${filePath}`),{code:'ASSET_STREAM_PAYLOAD_MISSING',cause});

function assetIds(project){return project?.assets?.order?.length?project.assets.order:Object.keys(project?.assets?.registry??{}).sort((a,b)=>a.localeCompare(b))}

export function buildSpatialAssetCatalog(project,{cacheDir=defaultCacheDir(),profile='runtime',cellIdsByAssetId={},priorityByAssetId={}}={}){
  const registry=project?.assets?.registry??{},graph=buildAssetDependencyGraph(project),dependenciesById=new Map();
  for(const edge of graph.edges){const dependencies=dependenciesById.get(edge.from)??[];dependencies.push(edge.to);dependenciesById.set(edge.from,dependencies)}
  const catalog=[],payloadPaths=new Map();
  for(const id of assetIds(project)){
    const record=registry[id];if(!record?.asset_id||!record.source?.sha256)continue;
    const cacheKey=deriveAssetCacheKey(record,{profile}),filePath=payloadPath(cacheDir,cacheKey),size=Number(record.source.size??record.files?.[0]?.size??0);
    if(!Number.isInteger(size)||size<0)throw new Error(`Invalid asset byte length for ${id}.`);
    catalog.push({id:record.asset_id,uri:cacheUri(profile,cacheKey),sha256:record.source.sha256,byteLength:size,kind:kindMap[record.kind]??'other',dependencies:unique(dependenciesById.get(id)),cellIds:unique(cellIdsByAssetId[id]??[]),priority:Number.isFinite(priorityByAssetId[id])?Math.round(priorityByAssetId[id]):0});
    payloadPaths.set(record.asset_id,filePath);
  }
  return{format:REALITY_STUDIO_ASSET_STREAMING_FORMAT,version:'0.1.0',catalog,payloadPaths,catalogRoot:resolveSpatialAssetStreaming(catalog).catalogRoot,cacheDir:path.resolve(cacheDir),profile};
}

export function createAssetStreamingRuntime(project,{cacheDir=defaultCacheDir(),profile='runtime',maxConcurrent=4,loader=null,cellIdsByAssetId={},priorityByAssetId={}}={}){
  const prepared=buildSpatialAssetCatalog(project,{cacheDir,profile,cellIdsByAssetId,priorityByAssetId});
  const read=loader??(async asset=>{
    const filePath=prepared.payloadPaths.get(asset.id);if(!filePath)throw missingPayloadError(asset,'unknown');
    try{return new Uint8Array(await fs.readFile(filePath))}catch(error){throw missingPayloadError(asset,filePath,error)}
  });
  const streamer=new VSRSpatialAssetStreamer(prepared.catalog,read,{maxConcurrent});
  return{...prepared,streamer,resolve:request=>resolveSpatialAssetStreaming(prepared.catalog,request),stream:request=>streamer.acquire(request),inspect:()=>streamer.inspect()};
}

export async function streamSpatialAssets(project,request={},options={}){
  const runtime=createAssetStreamingRuntime(project,options),receipt=await runtime.stream(request);
  return{format:REALITY_STUDIO_ASSET_STREAMING_FORMAT,version:'0.1.0',catalogRoot:runtime.catalogRoot,resolution:receipt.resolution,receipt,inspection:runtime.inspect()};
}
