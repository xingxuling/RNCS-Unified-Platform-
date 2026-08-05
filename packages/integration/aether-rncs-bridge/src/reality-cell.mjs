import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,rename,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {rootHash} from '@taowind/rncs-core-contract';
import {hash,makeObserverRelevanceView} from '@taowind/reality-network-runtime';
import {resolveSpatialAssetStreaming,VSRSpatialAssetStreamer,verifySpatialAssetStreamingReceipt} from '@taowind/visual-state-runtime/spatial-asset-streaming';
import {resolveSpatialStreaming} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {readKernelStateBatch} from './kernel-spatial-binding.mjs';

export const REALITY_CELL_FORMAT='rncs.reality-cell-state.v0.1';
export const REALITY_CELL_CATALOG_FORMAT='rncs.reality-cell-catalog.v0.1';
export const REALITY_CELL_VERSION='0.1.0';
export const REALITY_CELL_ASSET_CACHE_FORMAT='rncs.reality-cell-asset-cache.v0.1';

const clone=value=>structuredClone(value);
const uniqueSorted=values=>[...new Set((Array.isArray(values)?values:[]).map(String))].sort();
const finite=(value,fallback)=>Number.isFinite(value)?Number(value):fallback;
const integer=(value,fallback)=>Number.isSafeInteger(value)?value:fallback;
const fail=(condition,code)=>{if(!condition)throw new TypeError(code)};
const asVector=value=>Array.isArray(value)&&value.length===3?value.map(Number):value&&['x','y','z'].every(key=>Number.isFinite(value[key]))?[Number(value.x),Number(value.y),Number(value.z)]:null;
const distanceSquared=(a,b)=>{const dx=a[0]-b[0],dy=a[1]-b[1],dz=a[2]-b[2];return dx*dx+dy*dy+dz*dz};
const quantize=(value,scale)=>Math.round(finite(value,0)*scale);
const quantizedVector=(value,scale)=>asVector(value)?.map(component=>quantize(component,scale))??[0,0,0];
const worldVector=(value,scale)=>value.map(component=>component/scale);
const bytesSha256=bytes=>createHash('sha256').update(bytes).digest('hex');

function cloneAssetCatalog(value){
  const catalog=Array.isArray(value)?value:value?.catalog;
  fail(Array.isArray(catalog)&&catalog.length>0,'REALITY_CELL_ASSET_CATALOG_EMPTY');
  return catalog.map(asset=>({...asset,...(Array.isArray(asset.dependencies)?{dependencies:[...asset.dependencies]}:{}),...(Array.isArray(asset.cellIds)?{cellIds:[...asset.cellIds]}:{})}));
}

function assertAssetRuntime(runtime){
  fail(runtime&&typeof runtime.acquire==='function','REALITY_CELL_ASSET_RUNTIME_INVALID');
}

// Keep source payloads content-addressed so memory eviction can be followed by a verified disk hit.
export function createRealityCellAssetCache(directory,{maxBytes=Number.MAX_SAFE_INTEGER}={}){
  fail(typeof directory==='string'&&directory.length>0,'REALITY_CELL_ASSET_CACHE_DIRECTORY_REQUIRED');
  const cacheDirectory=path.resolve(directory),manifestPath=path.join(cacheDirectory,'manifest.json'),budget=Number.isFinite(maxBytes)?Math.max(0,Math.floor(maxBytes)):Number.MAX_SAFE_INTEGER,entries=new Map();
  let readyPromise,mutationQueue=Promise.resolve(),sequence=0,cacheHits=0,cacheMisses=0,cacheEvictions=0,manifestRoot,diagnostics=[];
  const entryView=entry=>({sha256:entry.sha256,byteLength:entry.byteLength,lastAccess:entry.lastAccess,assetIds:uniqueSorted(entry.assetIds)});
  const manifestBase=()=>({format:REALITY_CELL_ASSET_CACHE_FORMAT,version:REALITY_CELL_VERSION,maxBytes:budget,sequence,entries:[...entries.values()].map(entryView).sort((a,b)=>a.sha256.localeCompare(b.sha256)),diagnostics:uniqueSorted(diagnostics)});
  const persistNow=async()=>{const base=manifestBase(),document={...base,root:rootHash(base)},temporary=`${manifestPath}.${process.pid}.${randomUUID()}.tmp`;await writeFile(temporary,JSON.stringify(document,null,2));await rename(temporary,manifestPath);manifestRoot=document.root};
  const mutate=operation=>{const next=mutationQueue.then(operation);mutationQueue=next.catch(()=>{});return next};
  const load=async()=>{
    if(readyPromise)return readyPromise;
    readyPromise=(async()=>{await mkdir(cacheDirectory,{recursive:true});try{
      const parsed=JSON.parse(await readFile(manifestPath,'utf8')),base={...parsed};delete base.root;
      if(parsed.format!==REALITY_CELL_ASSET_CACHE_FORMAT||parsed.version!==REALITY_CELL_VERSION||parsed.root!==rootHash(base))throw new Error('REALITY_CELL_ASSET_CACHE_MANIFEST_INVALID');
      sequence=Number.isSafeInteger(parsed.sequence)?parsed.sequence:0;manifestRoot=parsed.root;
       for(const entry of Array.isArray(parsed.entries)?parsed.entries:[]){if(!/^[a-f0-9]{64}$/i.test(entry.sha256)||!Number.isSafeInteger(entry.byteLength)||entry.byteLength<0)continue;entries.set(entry.sha256.toLowerCase(),{sha256:entry.sha256.toLowerCase(),byteLength:entry.byteLength,lastAccess:Number.isSafeInteger(entry.lastAccess)?entry.lastAccess:0,assetIds:uniqueSorted(entry.assetIds)})}
       if([...entries.values()].reduce((sum,entry)=>sum+entry.byteLength,0)>budget){await trim();await persistNow()}
    }catch(error){if(error?.code!=='ENOENT'){diagnostics.push(error instanceof Error?error.message:'REALITY_CELL_ASSET_CACHE_MANIFEST_INVALID');entries.clear();sequence=0;manifestRoot=undefined}}
    })();
    return readyPromise;
  };
  const filePath=sha256=>path.join(cacheDirectory,`${sha256}.bin`);
  const trim=async()=>{
    let bytesResident=[...entries.values()].reduce((sum,entry)=>sum+entry.byteLength,0);
    const candidates=[...entries.values()].sort((a,b)=>a.lastAccess-b.lastAccess||a.sha256.localeCompare(b.sha256));
    for(const entry of candidates){if(bytesResident<=budget)break;entries.delete(entry.sha256);bytesResident-=entry.byteLength;cacheEvictions++;try{await unlink(filePath(entry.sha256))}catch{}}
  };
  return {
    format:REALITY_CELL_ASSET_CACHE_FORMAT,
    directory:cacheDirectory,
    maxBytes:budget,
    ready:load,
    async read(asset){
      await load();
      const sha256=String(asset.sha256).toLowerCase(),entry=entries.get(sha256);
      if(!entry)return mutate(async()=>{cacheMisses++;return undefined});
      let bytes;
      try{bytes=new Uint8Array(await readFile(filePath(sha256)));if(bytes.byteLength!==asset.byteLength||bytesSha256(bytes)!==sha256)throw new Error('REALITY_CELL_ASSET_CACHE_PAYLOAD_INVALID')}
      catch(error){return mutate(async()=>{diagnostics.push(error instanceof Error?error.message:'REALITY_CELL_ASSET_CACHE_PAYLOAD_INVALID');entries.delete(sha256);cacheMisses++;try{await unlink(filePath(sha256))}catch{}await persistNow();return undefined})}
      return mutate(async()=>{const current=entries.get(sha256);if(!current){cacheMisses++;return undefined}current.lastAccess=++sequence;current.assetIds=uniqueSorted([...current.assetIds,asset.id]);cacheHits++;await persistNow();return bytes});
    },
    async write(asset,payload){
      await load();
      const bytes=payload instanceof Uint8Array?new Uint8Array(payload):new Uint8Array(payload),sha256=String(asset.sha256).toLowerCase();
      if(bytes.byteLength!==asset.byteLength||bytesSha256(bytes)!==sha256)throw new TypeError('REALITY_CELL_ASSET_CACHE_HASH_MISMATCH');
      const temporary=`${filePath(sha256)}.${process.pid}.${randomUUID()}.tmp`;await writeFile(temporary,bytes);try{await mutate(async()=>{await rename(temporary,filePath(sha256));entries.set(sha256,{sha256,byteLength:bytes.byteLength,lastAccess:++sequence,assetIds:[asset.id]});await trim();await persistNow()})}catch(error){try{await unlink(temporary)}catch{}throw error}
    },
    inspect(){return{format:REALITY_CELL_ASSET_CACHE_FORMAT,directory:cacheDirectory,maxBytes:budget,manifestRoot,bytesResident:[...entries.values()].reduce((sum,entry)=>sum+entry.byteLength,0),cachedAssetIds:uniqueSorted([...entries.values()].flatMap(entry=>entry.assetIds)),cacheHits,cacheMisses,cacheEvictions,diagnostics:uniqueSorted(diagnostics)}}
  };
}

const assetTextureKeys=['baseColorTextureId','metallicRoughnessTextureId','normalTextureId','occlusionTextureId','emissiveTextureId','lightmapTextureId','reactiveMaskTextureId'];

function assetFormat(asset){
  const metadata=asset?.metadata;
  if(asset?.format)return String(asset.format).toLowerCase();
  if(metadata&&typeof metadata==='object'&&metadata.format)return String(metadata.format).toLowerCase();
  const uri=String(asset?.uri??'').toLowerCase();
  return uri.endsWith('.glb')?'glb':uri.endsWith('.gltf')?'gltf':undefined;
}

function assetResourceUris(asset){
  const metadata=asset?.metadata;
  return [asset?.uri,metadata&&typeof metadata==='object'?metadata.resourceUri:undefined,metadata&&typeof metadata==='object'?metadata.uri:undefined].filter(value=>typeof value==='string'&&value.length>0);
}

function resolveGltfResource(rootAsset,catalog,receipt,runtime,reference){
  const value=String(reference),references=new Set([value]);
  try{references.add(new URL(value,rootAsset.uri).href)}catch{}
  const resource=[...catalog.values()].find(asset=>asset.id!==rootAsset.id&&assetResourceUris(asset).some(uri=>references.has(uri)));
  fail(resource&&receipt.readyAssetIds.includes(resource.id),'REALITY_CELL_GLTF_RESOURCE_NOT_READY');
  const bytes=runtime.get?.(resource.id);
  fail(bytes instanceof Uint8Array,'REALITY_CELL_GLTF_RESOURCE_BYTES_MISSING');
  return {asset:resource,bytes};
}

function parseGltfJson(bytes){
  try{return JSON.parse(new TextDecoder().decode(bytes))}
  catch(error){throw new TypeError(`REALITY_CELL_GLTF_JSON_INVALID:${error instanceof Error?error.message:String(error)}`)}
}

function decodeGltfExternalImage(input){
  if(input.mimeType!=='application/x-vsr-rgba+json'&&input.image?.mimeType!=='application/x-vsr-rgba+json')return undefined;
  const value=parseGltfJson(input.bytes),width=integer(value.width,0),height=integer(value.height,0),pixels=Array.isArray(value.pixels)?value.pixels.map(Number):[];
  fail(width>0&&height>0&&pixels.length===width*height*4,'REALITY_CELL_GLTF_IMAGE_INVALID');
  return {id:input.id,width,height,pixels,colorSpace:value.colorSpace==='linear'?'linear':'srgb',filter:'linear',wrapU:'repeat',wrapV:'repeat'};
}

function resolveGltfExternalResources(rootAsset,document,catalog,receipt,runtime){
  const buffers={},imageBytes={},resources=[];
  for(const buffer of document.buffers??[]){
    if(typeof buffer.uri!=='string'||buffer.uri.startsWith('data:'))continue;
    const resource=resolveGltfResource(rootAsset,catalog,receipt,runtime,buffer.uri);
    buffers[buffer.uri]=resource.bytes;resources.push({id:resource.asset.id,sha256:resource.asset.sha256,byteLength:resource.bytes.byteLength});
  }
  for(const image of document.images??[]){
    if(typeof image.uri!=='string'||image.uri.startsWith('data:'))continue;
    const resource=resolveGltfResource(rootAsset,catalog,receipt,runtime,image.uri);
    imageBytes[image.uri]=resource.bytes;resources.push({id:resource.asset.id,sha256:resource.asset.sha256,byteLength:resource.bytes.byteLength});
  }
  const uniqueResources=[...new Map(resources.map(resource=>[resource.id,resource])).values()].sort((a,b)=>a.id.localeCompare(b.id));
  return {buffers,imageBytes,resources:uniqueResources,resourceAssetIds:uniqueResources.map(resource=>resource.id)};
}

function remapAssetMaterial(material,prefix,textureIds){
  const result={...material,id:`${prefix}material:${material.id}`};
  for(const key of assetTextureKeys)if(result[key])result[key]=textureIds.get(result[key])??result[key];
  return result;
}

function mergeImportedAssetScene(baseScene,imported,asset,placement,resourceAssetIds=[]){
  const prefix=`cell-asset:${asset.id}:`,meshIds=new Map(imported.scene.meshes.map(mesh=>[mesh.id,`${prefix}mesh:${mesh.id}`])),textureIds=new Map((imported.scene.textures??[]).map(texture=>[texture.id,`${prefix}texture:${texture.id}`])),nodeIds=new Map(imported.scene.nodes.map(node=>[node.id,`${prefix}node:${node.id}`])),skinIds=new Map((imported.scene.skins??[]).map(skin=>[skin.id,`${prefix}skin:${skin.id}`])),materialIds=new Map(imported.scene.materials.map(material=>[material.id,`${prefix}material:${material.id}`])),animationIds=new Map((imported.scene.animations??[]).map(animation=>[animation.id,`${prefix}animation:${animation.id}`])),rootNodeIds=new Set(imported.scene.nodes.filter(node=>!node.parentId||!nodeIds.has(node.parentId)).map(node=>node.id));
  const nodes=imported.scene.nodes.map(node=>({...node,id:nodeIds.get(node.id),...(node.parentId?{parentId:nodeIds.get(node.parentId)}:{}),...(node.meshId?{meshId:meshIds.get(node.meshId)}:{}),...(node.materialId?{materialId:materialIds.get(node.materialId)}:{}),...(node.skinId?{skinId:skinIds.get(node.skinId)}:{}),tags:[...(node.tags??[]),`asset:${asset.id}`,...(rootNodeIds.has(node.id)?['asset-root']:[])],...(rootNodeIds.has(node.id)&&placement?{transform:{...(node.transform??{}),...placement}}:{})}));
  const materials=imported.scene.materials.map(material=>remapAssetMaterial(material,prefix,textureIds));
  const skins=(imported.scene.skins??[]).map(skin=>({...skin,id:skinIds.get(skin.id),joints:skin.joints.map(nodeId=>nodeIds.get(nodeId)??nodeId)}));
  const animations=(imported.scene.animations??[]).map(animation=>({...animation,id:animationIds.get(animation.id),channels:animation.channels.map(channel=>({...channel,nodeId:nodeIds.get(channel.nodeId)??channel.nodeId}))}));
  const lights=(imported.scene.lights??[]).map(light=>({...light,id:`${prefix}light:${light.id}`}));
  const assetNodeIds=nodes.map(node=>node.id).sort((a,b)=>a.localeCompare(b));
  const streamCells=(baseScene.streaming?.cells??[]).map(cell=>asset.cellIds?.includes(cell.id)?{...cell,nodeIds:uniqueSorted([...(cell.nodeIds??[]),...assetNodeIds])}:cell);
  const scene={...baseScene,meshes:[...baseScene.meshes,...imported.scene.meshes.map(mesh=>({...mesh,id:meshIds.get(mesh.id)}))],materials:[...baseScene.materials,...materials],textures:[...(baseScene.textures??[]),...(imported.scene.textures??[]).map(texture=>({...texture,id:textureIds.get(texture.id)}))],nodes:[...baseScene.nodes,...nodes],skins:[...(baseScene.skins??[]),...skins],animations:[...(baseScene.animations??[]),...animations],lights:[...baseScene.lights,...lights],...(baseScene.streaming?{streaming:{...baseScene.streaming,cells:streamCells}}:{})};
  const bindingBase={format:'rncs.reality-cell-asset-binding.v0.1',assetId:asset.id,assetFormat:assetFormat(asset),payloadRoot:asset.sha256,resourceAssetIds:uniqueSorted(resourceAssetIds),importReceiptRoot:imported.receipt.receiptRoot,meshIds:[...meshIds.values()].sort(),materialIds:[...materialIds.values()].sort(),textureIds:[...textureIds.values()].sort(),nodeIds:assetNodeIds};
  return {scene,binding:{...bindingBase,bindingRoot:rootHash(bindingBase)}};
}

export function createRealityCellAssetRuntime(assetCatalog,loader,{maxConcurrent=4,cacheDirectory,cacheByteBudget=Number.MAX_SAFE_INTEGER}={}){
  fail(typeof loader==='function','REALITY_CELL_ASSET_LOADER_REQUIRED');
  const catalog=cloneAssetCatalog(assetCatalog),cache=typeof cacheDirectory==='string'&&cacheDirectory.length>0?createRealityCellAssetCache(cacheDirectory,{maxBytes:cacheByteBudget}):undefined,cachedLoader=async(asset,context)=>{const cached=await cache?.read(asset);if(cached)return cached;const bytes=await loader(asset,context);if(cache)await cache.write(asset,bytes);return bytes},streamer=new VSRSpatialAssetStreamer(catalog,cachedLoader,{maxConcurrent:Number.isFinite(maxConcurrent)?Math.max(1,Math.floor(maxConcurrent)):4});
  return {
    format:'rncs.reality-cell-asset-runtime.v0.1',
    catalog,
    streamer,
    cache,
    cacheReady:()=>cache?.ready()??Promise.resolve(),
    resolve:request=>resolveSpatialAssetStreaming(catalog,request),
    acquire:request=>streamer.acquire(request),
    prefetch:request=>streamer.prefetch(request),
    release:assetIds=>streamer.release(assetIds),
    evict:assetIds=>streamer.evict(assetIds),
    inspect:()=>({...streamer.inspect(),...(cache?{cache:cache.inspect()}: {})}),
    state:assetId=>streamer.state(assetId),
    get:assetId=>streamer.get(assetId)
  };
}

export async function bindRealityCellAssetScene(runtime,state,scene,{assetIds,placements={}}={}){
  assertAssetRuntime(runtime);
  const verification=verifyRealityCellState(state);
  fail(verification.ok,'REALITY_CELL_STATE_INVALID');
  fail(scene?.format,'REALITY_CELL_SCENE_INVALID');
  let receipt;
  try{
    receipt=await acquireRealityCellAssets(runtime,state);
    const catalog=new Map((runtime.catalog??[]).map(asset=>[asset.id,asset])),targets=Array.isArray(assetIds)?uniqueSorted(assetIds):receipt.readyAssetIds.filter(id=>['glb','gltf'].includes(assetFormat(catalog.get(id)))),gltf=targets.length?await import('@taowind/visual-state-runtime/gltf-asset'):undefined;
    let boundScene=clone(scene);const bindings=[];
    for(const id of targets){
      const asset=catalog.get(id),bytes=runtime.get?.(id);
      fail(asset&&receipt.readyAssetIds.includes(id),'REALITY_CELL_ASSET_NOT_READY');
      const format=assetFormat(asset);
      fail(['glb','gltf'].includes(format),'REALITY_CELL_ASSET_FORMAT_UNSUPPORTED');
      fail(bytes instanceof Uint8Array,'REALITY_CELL_ASSET_BYTES_MISSING');
      let imported,resourceAssetIds=[];
      if(format==='glb')imported=gltf.importGlbToSpatialScene(bytes,{sceneId:`cell-asset:${id}`,title:`Cell Asset ${id}`,defaultCamera:true,sourceRoot:asset.sha256});
      else{
        const document=parseGltfJson(bytes),external=resolveGltfExternalResources(asset,document,catalog,receipt,runtime);
        resourceAssetIds=external.resourceAssetIds;
        imported=await gltf.importGltfToSpatialSceneAsync(document,{sceneId:`cell-asset:${id}`,title:`Cell Asset ${id}`,defaultCamera:true,buffers:external.buffers,imageBytes:external.imageBytes,imageDecoder:decodeGltfExternalImage,sourceRoot:rootHash({assetRoot:asset.sha256,resources:external.resources})});
      }
      fail(gltf.verifyGltfImportReceipt(imported.receipt),'REALITY_CELL_GLTF_RECEIPT_INVALID');
      const merged=mergeImportedAssetScene(boundScene,imported,asset,placements?.[id],resourceAssetIds);
      boundScene=merged.scene;bindings.push(merged.binding);
    }
    const base={format:'rncs.reality-cell-asset-scene-binding.v0.1',cellStateRoot:state.root,assetStreamingRoot:state.assetStreaming.root,assetIds:bindings.map(binding=>binding.assetId).sort(),bindings};
    return {format:base.format,scene:boundScene,receipt,assetBindings:bindings,bindingRoot:rootHash(base)};
  }catch(error){
    if(receipt)releaseRealityCellAssets(runtime,receipt);
    throw error;
  }
}

// Acquire the next scene before releasing the current scene so a Cell transition has no empty ownership window.
export function createRealityCellAssetSceneRuntime(runtime){
  assertAssetRuntime(runtime);
  let active;
  return {
    format:'rncs.reality-cell-asset-scene-runtime.v0.1',
    runtime,
    async bind(state,scene,options={}){
      const next=await bindRealityCellAssetScene(runtime,state,scene,options),previous=active,released=previous?releaseRealityCellAssets(runtime,previous.receipt):[],evicted=evictRealityCellAssets(runtime,next.receipt.resolution.evictedAssetIds),lifecycleBase={format:'rncs.reality-cell-asset-transition.v0.1',previousBindingRoot:previous?.bindingRoot??null,bindingRoot:next.bindingRoot,previousCellStateRoot:previous?.cellStateRoot??null,cellStateRoot:state.root,assetIds:next.assetBindings.map(binding=>binding.assetId).sort(),releasedAssetIds:released,evictedAssetIds:evicted},lifecycle={...lifecycleBase,lifecycleRoot:rootHash(lifecycleBase)};
      active={...next,cellStateRoot:state.root,lifecycle};
      return active;
    },
    active:()=>active?clone(active):undefined,
    release(){
      if(!active){const base={format:'rncs.reality-cell-asset-transition.v0.1',active:false,releasedAssetIds:[],evictedAssetIds:[]};return {...base,lifecycleRoot:rootHash(base)}}
      const released=releaseRealityCellAssets(runtime,active.receipt),evicted=evictRealityCellAssets(runtime,active.receipt.leasedAssetIds),base={format:'rncs.reality-cell-asset-transition.v0.1',active:false,bindingRoot:active.bindingRoot,cellStateRoot:active.cellStateRoot,releasedAssetIds:released,evictedAssetIds:evicted};
      active=undefined;
      return {...base,lifecycleRoot:rootHash(base)};
    },
    inspect:()=>runtime.inspect()
  };
}

export function realityCellAssetRequest(state,overrides={}){
  const verification=verifyRealityCellState(state);
  fail(verification.ok,'REALITY_CELL_STATE_INVALID');
  const plan=state.assetStreaming;
  fail(plan&&Array.isArray(plan.activeCellIds)&&Array.isArray(plan.requestedAssetIds),'REALITY_CELL_ASSET_PLAN_MISSING');
  const extra=overrides&&typeof overrides==='object'?overrides:{};
  const prefetchCellIds=Array.isArray(extra.prefetchCellIds)?[...extra.prefetchCellIds]:[...(plan.prefetchCellIds??[])],prefetchAssetIds=Array.isArray(extra.prefetchAssetIds)?[...extra.prefetchAssetIds]:[...(plan.prefetchAssetIds??[])],hasPrefetch=prefetchCellIds.length>0||prefetchAssetIds.length>0;
  return {
    ...extra,
    activeCellIds:[...plan.activeCellIds],
    requestedAssetIds:Array.isArray(extra.requestedAssetIds)?[...extra.requestedAssetIds]:[...plan.requestedAssetIds],
    residentAssetIds:[...plan.residentAssetIds],
    maxAssets:extra.maxAssets??plan.maxAssets,
    maxBytes:extra.maxBytes??plan.maxBytes,
    ...(hasPrefetch?{prefetchCellIds,prefetchAssetIds,maxPrefetchAssets:extra.maxPrefetchAssets??plan.maxPrefetchAssets,maxPrefetchBytes:extra.maxPrefetchBytes??plan.maxPrefetchBytes}: {})
  };
}

export async function acquireRealityCellAssets(runtime,state,overrides={}){
  assertAssetRuntime(runtime);
  const receipt=await runtime.acquire(realityCellAssetRequest(state,overrides));
  fail(verifySpatialAssetStreamingReceipt(receipt),'REALITY_CELL_ASSET_RECEIPT_INVALID');
  return receipt;
}

export async function prefetchRealityCellAssets(runtime,state,overrides={}){
  fail(runtime&&typeof runtime.prefetch==='function','REALITY_CELL_ASSET_RUNTIME_PREFETCH_UNAVAILABLE');
  const receipt=await runtime.prefetch(realityCellAssetRequest(state,overrides));
  fail(verifySpatialAssetStreamingReceipt(receipt),'REALITY_CELL_ASSET_PREFETCH_RECEIPT_INVALID');
  return receipt;
}

export function releaseRealityCellAssets(runtime,receiptOrAssetIds){
  fail(runtime&&typeof runtime.release==='function','REALITY_CELL_ASSET_RUNTIME_RELEASE_UNAVAILABLE');
  const assetIds=Array.isArray(receiptOrAssetIds)?receiptOrAssetIds:receiptOrAssetIds?.leasedAssetIds;
  fail(Array.isArray(assetIds),'REALITY_CELL_ASSET_LEASES_INVALID');
  return runtime.release([...assetIds]);
}

export function evictRealityCellAssets(runtime,receiptOrStateOrAssetIds){
  fail(runtime&&typeof runtime.evict==='function','REALITY_CELL_ASSET_RUNTIME_EVICT_UNAVAILABLE');
  const assetIds=Array.isArray(receiptOrStateOrAssetIds)?receiptOrStateOrAssetIds:receiptOrStateOrAssetIds?.resolution?.evictedAssetIds??receiptOrStateOrAssetIds?.assetStreaming?.evictedAssetIds;
  fail(Array.isArray(assetIds),'REALITY_CELL_ASSET_EVICTION_INVALID');
  return runtime.evict([...assetIds]);
}

function cellCenter(cell){return asVector(cell.center??cell.position)??[0,0,0]}

function nodeBodyId(node,bodyIds){
  const candidates=[node.id,...(node.tags??[])];
  for(const bodyId of bodyIds){
    if(candidates.includes(`body:${bodyId}`)||candidates.some(value=>value===`node:${bodyId}`||value.startsWith(`node:${bodyId}:`)))return bodyId;
  }
  return undefined;
}

function bodyNodeIds(scene,bodyIds){
  const ids=new Set(bodyIds);
  return scene.nodes.filter(node=>nodeBodyId(node,ids)).map(node=>node.id).sort();
}

function normalizeCellCatalog(snapshot,scene,options,coordinateScale){
  const bodyMap=new Map((snapshot.bodies??[]).map(body=>[body.id,body]));
  const sceneNodeIds=new Set((scene.nodes??[]).map(node=>node.id));
  const rawCells=(Array.isArray(options.cellCatalog)?options.cellCatalog:options.cellCatalog?.cells)??options.cells??scene.streaming?.cells??[];
  fail(Array.isArray(rawCells)&&rawCells.length>0,'REALITY_CELL_CATALOG_EMPTY');
  const defaultLoadRadius=Math.max(0,finite(options.loadRadius,64));
  const defaultUnloadRadius=Math.max(defaultLoadRadius,finite(options.unloadRadius,defaultLoadRadius*1.25));
  const cells=rawCells.map(raw=>{
    const id=String(raw.id??'');
    const center=cellCenter(raw),radius=Math.max(0,finite(raw.radius,0));
    fail(id,'REALITY_CELL_ID_REQUIRED');fail(radius>0,'REALITY_CELL_RADIUS_INVALID');
    const explicitBodies=raw.bodyIds===undefined?null:uniqueSorted(raw.bodyIds);
    for(const bodyId of explicitBodies??[])fail(bodyMap.has(bodyId),'REALITY_CELL_BODY_UNKNOWN');
    const bodyIds=explicitBodies??[...bodyMap.values()].filter(body=>distanceSquared([body.position.x/snapshot.positionScale,body.position.y/snapshot.positionScale,body.position.z/snapshot.positionScale],center)<=radius*radius).map(body=>body.id).sort();
    const explicitNodes=raw.nodeIds===undefined?null:uniqueSorted(raw.nodeIds);
    for(const nodeId of explicitNodes??[])fail(sceneNodeIds.has(nodeId),'REALITY_CELL_NODE_UNKNOWN');
    const nodeIds=explicitNodes??bodyNodeIds(scene,bodyIds);
    const loadRadius=Math.max(0,finite(raw.loadRadius,defaultLoadRadius)),unloadRadius=Math.max(loadRadius,finite(raw.unloadRadius,defaultUnloadRadius));
    const cell={id,centerQ:quantizedVector(center,coordinateScale),radiusQ:quantize(radius,coordinateScale),nodeIds,bodyIds,priority:Math.round(finite(raw.priority,0)),loadRadiusQ:quantize(loadRadius,coordinateScale),unloadRadiusQ:quantize(unloadRadius,coordinateScale)};
    return cell;
  }).sort((a,b)=>a.id.localeCompare(b.id));
  fail(new Set(cells.map(cell=>cell.id)).size===cells.length,'REALITY_CELL_ID_DUPLICATE');
  const persistentNodeIds=uniqueSorted(options.persistentNodeIds??scene.streaming?.persistentNodeIds??scene.nodes.filter(node=>node.id==='ground').map(node=>node.id));
  for(const nodeId of persistentNodeIds)fail(sceneNodeIds.has(nodeId),'REALITY_CELL_PERSISTENT_NODE_UNKNOWN');
  return {coordinateScale,cells,persistentNodeIds,catalogRoot:rootHash({format:REALITY_CELL_CATALOG_FORMAT,version:REALITY_CELL_VERSION,worldId:snapshot.worldId,coordinateScale,cells,persistentNodeIds})};
}

function addEdge(adjacency,a,b,edgeIds,edgeId){
  if(!a||!b||a===b||!adjacency.has(a)||!adjacency.has(b))return;
  adjacency.get(a).add(b);adjacency.get(b).add(a);edgeIds.push(String(edgeId));
}

function deriveCausalIslands(snapshot,cells){
  const bodyIds=(snapshot.bodies??[]).map(body=>body.id).sort(),adjacency=new Map(bodyIds.map(id=>[id,new Set()])),edgeIds=[];
  for(const joint of snapshot.joints??[])if(joint.enabled!==false)addEdge(adjacency,joint.bodyA,joint.bodyB,edgeIds,joint.id);
  for(const contact of snapshot.contacts??[])if(!contact.sensor&&contact.bodyB!=='__floor__')addEdge(adjacency,contact.bodyA,contact.bodyB,edgeIds,contact.id);
  const seen=new Set(),islands=[];
  for(const start of bodyIds){if(seen.has(start))continue;const queue=[start],members=[];seen.add(start);while(queue.length){const id=queue.shift();members.push(id);for(const next of [...adjacency.get(id)].sort())if(!seen.has(next)){seen.add(next);queue.push(next)}}members.sort();const edges=edgeIds.filter(edgeId=>{const joint=(snapshot.joints??[]).find(value=>value.id===edgeId),contact=(snapshot.contacts??[]).find(value=>value.id===edgeId);return Boolean(joint&&members.includes(joint.bodyA)&&members.includes(joint.bodyB)||contact&&!contact.sensor&&members.includes(contact.bodyA)&&members.includes(contact.bodyB))}).sort();const root=rootHash({bodyIds:members,edgeIds:edges});islands.push({id:`island:${root.slice(0,16)}`,bodyIds:members,edgeIds,root,cellIds:cells.filter(cell=>cell.bodyIds.some(bodyId=>members.includes(bodyId))).map(cell=>cell.id).sort()})}
  return islands.sort((a,b)=>a.id.localeCompare(b.id));
}

function lwcFromQuantized(positionQ,coordinateScale,sectorSizeQ){
  const sector=positionQ.map(value=>Math.floor(value/sectorSizeQ));
  return {sector,localQ:positionQ.map((value,index)=>value-sector[index]*sectorSizeQ)};
}

function cellIdsForBodies(cells,bodyIds){const wanted=new Set(bodyIds);return cells.filter(cell=>cell.bodyIds.some(bodyId=>wanted.has(bodyId))).map(cell=>cell.id).sort()}

function stateBase(state){const copy=clone(state);delete copy.stateRoot;delete copy.root;delete copy.vsr;delete copy.relevanceView;return copy}

export function verifyRealityCellState(state){
  if(!state||typeof state!=='object')return {ok:false,diagnostics:['state invalid']};
  const diagnostics=[];
  if(state.format!==REALITY_CELL_FORMAT)diagnostics.push('format mismatch');
  if(state.version!==REALITY_CELL_VERSION)diagnostics.push('version mismatch');
  if(!state.stateRoot||!state.root)diagnostics.push('root missing');
  const catalogCells=state.cells?.map(cell=>({id:cell.id,centerQ:cell.centerQ,radiusQ:cell.radiusQ,nodeIds:cell.nodeIds,bodyIds:cell.bodyIds,priority:cell.priority,loadRadiusQ:cell.loadRadiusQ,unloadRadiusQ:cell.unloadRadiusQ}));
  if(state.catalogRoot!==rootHash({format:REALITY_CELL_CATALOG_FORMAT,version:REALITY_CELL_VERSION,worldId:state.worldId,coordinateScale:state.coordinate?.scale,cells:catalogCells,persistentNodeIds:state.persistentNodeIds}))diagnostics.push('catalog root mismatch');
  const expectedCausalRoot=rootHash({format:'rncs.reality-cell-causality.v0.1',version:REALITY_CELL_VERSION,islands:(state.causalIslands??[]).map(island=>({id:island.id,bodyIds:island.bodyIds,edgeIds:island.edgeIds,root:island.root}))});
  if(state.causalRoot!==expectedCausalRoot)diagnostics.push('causal root mismatch');
  const expectedVsrConfigRoot=rootHash({worldId:state.worldId,cells:(state.cells??[]).map(cell=>({id:cell.id,centerQ:cell.centerQ,radiusQ:cell.radiusQ,nodeIds:cell.nodeIds,loadRadiusQ:cell.loadRadiusQ,unloadRadiusQ:cell.unloadRadiusQ,priority:cell.priority})),persistentNodeIds:state.persistentNodeIds});
  if(state.vsrConfigRoot!==expectedVsrConfigRoot)diagnostics.push('vsr config root mismatch');
  if(state.assetStreaming){
    if(state.vsr?.assetStreaming?.root!==state.assetStreaming.root)diagnostics.push('asset streaming root mismatch');
    if(!Array.isArray(state.assetStreaming.activeCellIds)||!state.assetStreaming.activeCellIds.every(id=>(state.activeCellIds??[]).includes(id)))diagnostics.push('asset streaming active cells mismatch');
  }
  if(state.relevanceView){const {viewRoot,...viewBase}=state.relevanceView;if(viewRoot!==hash(viewBase)||viewRoot!==state.relevance?.viewRoot)diagnostics.push('relevance view root mismatch')}
  const expectedStateRoot=rootHash(stateBase(state));
  if(state.stateRoot!==expectedStateRoot)diagnostics.push('state root mismatch');
  if(state.root!==rootHash({...stateBase(state),stateRoot:state.stateRoot}))diagnostics.push('root mismatch');
  const allowed=new Set(state.cells?.map(cell=>cell.id)??[]);
  for(const id of [...(state.activeCellIds??[]),...(state.forcedCellIds??[]),...(state.enteredCellIds??[]),...(state.exitedCellIds??[])])if(!allowed.has(id))diagnostics.push(`unknown cell ${id}`);
  return {ok:diagnostics.length===0,diagnostics};
}

export function resolveRealityCellState(snapshot,scene,options={}){
  fail(snapshot?.worldId,'REALITY_CELL_SNAPSHOT_INVALID');
  fail(scene?.format,'REALITY_CELL_SCENE_INVALID');
  const positionScale=Math.max(1,integer(snapshot.positionScale,1000)),coordinateScale=Math.max(1,integer(options.coordinateScale,positionScale)),sectorSize=Math.max(1,finite(options.sectorSize,1024)),sectorSizeQ=Math.max(1,Math.round(sectorSize*coordinateScale));
  const catalog=normalizeCellCatalog(snapshot,scene,options,coordinateScale),cells=catalog.cells,islands=deriveCausalIslands(snapshot,cells),islandByBody=new Map(islands.flatMap(island=>island.bodyIds.map(bodyId=>[bodyId,island])));
  const observerWorld=asVector(options.observerPosition??options.cameraPosition??scene.cameras?.find(camera=>camera.id===scene.activeCameraId)?.transform?.translation)??[0,0,0];
  const observerQ=quantizedVector(observerWorld,coordinateScale),normalizedObserver=worldVector(observerQ,coordinateScale),observerRsrQ=normalizedObserver.map(value=>Math.round(value*positionScale));
  const observerId=String(options.observerId??'observer:reality-cell'),relevanceRadius=options.relevanceRadius===null?null:Math.max(0,finite(options.relevanceRadius,options.loadRadius??64)),relevanceRadiusQ=relevanceRadius===null?null:Math.round(relevanceRadius*positionScale);
  const focusBodyIds=uniqueSorted(options.focusBodyIds),causalBodyIds=uniqueSorted(options.causalBodyIds),relevance=makeObserverRelevanceView(snapshot,{sessionId:String(options.sessionId??`session:${snapshot.worldId}`),observerId,position:{x:observerRsrQ[0],y:observerRsrQ[1],z:observerRsrQ[2]},radius:relevanceRadiusQ,semanticTags:options.semanticTags,causalBodyIds,focusBodyIds,maxObjects:options.maxObjects,minPriority:options.minPriority});
  const selectedBodyIds=relevance.selectedObjects.map(object=>object.objectId).sort(),requiredBodyIds=relevance.priorities.filter(item=>item.required).map(item=>item.objectId).sort(),causalExpansion=new Set([...causalBodyIds,...requiredBodyIds]);
  for(const bodyId of [...causalExpansion])for(const body of islandByBody.get(bodyId)?.bodyIds??[])causalExpansion.add(body);
  const selectedCellIds=cellIdsForBodies(cells,selectedBodyIds),expandedCellIds=cellIdsForBodies(cells,[...causalExpansion]),forcedCellIds=uniqueSorted([...(options.forcedCellIds??[]),...selectedCellIds,...expandedCellIds]);
  const vsrCells=cells.map(cell=>({id:cell.id,center:worldVector(cell.centerQ,coordinateScale),radius:cell.radiusQ/coordinateScale,nodeIds:[...cell.nodeIds],loadRadius:cell.loadRadiusQ/coordinateScale,unloadRadius:cell.unloadRadiusQ/coordinateScale,priority:cell.priority})),streamingScene={...scene,streaming:{worldId:snapshot.worldId,cells:vsrCells,persistentNodeIds:catalog.persistentNodeIds}},previousActiveCellIds=uniqueSorted(options.previousState?.activeCellIds??options.previousActiveCellIds),streamingOptions={previousActiveCellIds,forcedCellIds,loadRadius:Math.max(0,finite(options.loadRadius,64)),unloadRadius:Math.max(Math.max(0,finite(options.loadRadius,64)),finite(options.unloadRadius,Math.max(0,finite(options.loadRadius,64))*1.25))},resolution=resolveSpatialStreaming(streamingScene,normalizedObserver,streamingOptions),previousCells=new Map((options.previousState?.cells??[]).map(cell=>[cell.id,cell])),cellStates=cells.map(cell=>{const active=resolution.activeCellIds.includes(cell.id),previous=previousCells.get(cell.id),previousState=previous?.state??'unloaded',nextState=active?'active':'unloaded',transition=previousState===nextState?'retain':nextState==='active'?'enter':'exit',causalIslandIds=islands.filter(island=>island.cellIds.includes(cell.id)).map(island=>island.id).sort();return{id:cell.id,state:nextState,transition,reason:forcedCellIds.includes(cell.id)?'relevance-or-causal':active?'observer-radius':'outside-observer-radius',centerQ:cell.centerQ,radiusQ:cell.radiusQ,loadRadiusQ:cell.loadRadiusQ,unloadRadiusQ:cell.unloadRadiusQ,priority:cell.priority,nodeIds:cell.nodeIds,bodyIds:cell.bodyIds,causalIslandIds,lwc:lwcFromQuantized(cell.centerQ,coordinateScale,sectorSizeQ)}});
  const rawAssetCatalog=Array.isArray(options.assetCatalog)?options.assetCatalog:options.assetCatalog?.catalog??[],assetRequest=options.assetStreamingRequest&&typeof options.assetStreamingRequest==='object'?options.assetStreamingRequest:{},prefetchCellIds=uniqueSorted(assetRequest.prefetchCellIds??options.prefetchCellIds),assetStreaming=rawAssetCatalog.length?resolveSpatialAssetStreaming(rawAssetCatalog,{...assetRequest,activeCellIds:resolution.activeCellIds,...(prefetchCellIds.length?{prefetchCellIds}: {})}):undefined;
  const relevanceSummary={sourceStateRoot:relevance.sourceStateRoot,authorityFrameRoot:relevance.authorityFrameRoot,viewRoot:relevance.viewRoot,selectedBodyIds,requiredBodyIds,selectedCellIds,omittedBodyIds:relevance.omittedBodyIds,missingRequiredBodyIds:relevance.missingRequiredBodyIds,summary:relevance.summary};
  const causalRoot=rootHash({format:'rncs.reality-cell-causality.v0.1',version:REALITY_CELL_VERSION,islands:islands.map(island=>({id:island.id,bodyIds:island.bodyIds,edgeIds:island.edgeIds,root:island.root}))});
  const vsrConfigRoot=rootHash({worldId:snapshot.worldId,cells:cells.map(cell=>({id:cell.id,centerQ:cell.centerQ,radiusQ:cell.radiusQ,nodeIds:cell.nodeIds,loadRadiusQ:cell.loadRadiusQ,unloadRadiusQ:cell.unloadRadiusQ,priority:cell.priority})),persistentNodeIds:catalog.persistentNodeIds});
  const base={format:REALITY_CELL_FORMAT,version:REALITY_CELL_VERSION,worldId:snapshot.worldId,tick:snapshot.tick,coordinate:{scale:coordinateScale,sectorSizeQ},observer:{id:observerId,positionQ:observerQ,rsrPositionQ:observerRsrQ,lwc:lwcFromQuantized(observerQ,coordinateScale,sectorSizeQ),relevanceRadiusQ},persistentNodeIds:catalog.persistentNodeIds,cells:cellStates,causalIslands:islands,activeCellIds:resolution.activeCellIds,enteredCellIds:resolution.enteredCellIds,exitedCellIds:resolution.exitedCellIds,forcedCellIds,selectedCellIds,relevance:relevanceSummary,catalogRoot:catalog.catalogRoot,causalRoot,vsrConfigRoot,vsrResolutionRoot:resolution.root,...(assetStreaming?{assetStreaming}:{})};
  const state={...base,stateRoot:rootHash(base)};
  return {...state,root:rootHash({...base,stateRoot:state.stateRoot}),vsr:{config:streamingScene.streaming,options:streamingOptions,resolution,configRoot:vsrConfigRoot,resolutionRoot:resolution.root,...(assetStreaming?{assetStreaming}:{})},relevanceView:relevance};
}

export async function projectKernelStateToRealityCell(source,{query={},...options}={}){
  const batch=readKernelStateBatch(source,query),rsr=await (await import('@taowind/reality-simulation-runtime')).spatial(),vsr=await (await import('@taowind/reality-simulation-runtime')).spatialVsr();
  const binding=rsr.materializeKernelStateBatch(batch,options),world=new rsr.SpatialEmbodimentWorld(binding.config);
  if((options.advance_ticks??0)>0)world.run(Math.floor(options.advance_ticks),options.commands??[]);
  const snapshot=world.snapshot(),projectionOptions={...options,cameraPosition:options.cameraPosition??options.observerPosition??[7,5,9]},baseScene=vsr.spatialEmbodimentSnapshotToVSRScene(snapshot,projectionOptions),cellState=resolveRealityCellState(snapshot,baseScene,projectionOptions),streamingScene={...baseScene,streaming:cellState.vsr.config},assetBinding=options.assetSceneRuntime?await options.assetSceneRuntime.bind(cellState,streamingScene,{assetIds:options.assetSceneAssetIds,placements:options.assetScenePlacements}):options.assetRuntime?await bindRealityCellAssetScene(options.assetRuntime,cellState,streamingScene,{assetIds:options.assetSceneAssetIds,placements:options.assetScenePlacements}):undefined,projection=vsr.projectSpatialEmbodiment(snapshot,{...projectionOptions,sceneOverride:assetBinding?.scene??streamingScene,streaming:cellState.vsr.config,streamingOptions:cellState.vsr.options,assetStreaming:cellState.assetStreaming});
  const roots={kernel_state_root:batch.state_root,kernel_batch_root:batch.batch_root,binding_root:binding.binding_root,rsr_state_root:snapshot.stateRoot,rsr_body_root:snapshot.bodyRoot,cell_state_root:cellState.root,vsr_scene_root:vsr.spatialEmbodimentSceneRoot(projection.scene),vsr_frame_root:projection.framePlan.frameRoot,vsr_pixel_root:projection.pixelRoot,...(cellState.assetStreaming?{asset_streaming_root:cellState.assetStreaming.root}:{}),...(assetBinding?{asset_binding_root:assetBinding.bindingRoot}:{}),...(assetBinding?.lifecycle?{asset_transition_root:assetBinding.lifecycle.lifecycleRoot}:{})};
  const base={format:'rncs.kernel-rsr-vsr-reality-cell.v0.1',version:REALITY_CELL_VERSION,roots};
  return {...base,binding,snapshot,cellState,projection,assetBinding,binding_root:rootHash(base)};
}
