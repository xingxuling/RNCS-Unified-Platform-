import { cryptographicHash, sha256Bytes } from '../../spec/src/index.js';

export const VSR_SPATIAL_ASSET_STREAMING_FORMAT='vsr.spatial-asset-streaming.v0.1' as const;
export const VSR_SPATIAL_ASSET_STREAMING_VERSION='0.1.0' as const;

export type VSRSpatialAssetKind='mesh'|'texture'|'material'|'animation'|'audio'|'shader'|'other';
export interface VSRSpatialAssetRecord {
  id:string;
  uri:string;
  sha256:string;
  byteLength:number;
  kind:VSRSpatialAssetKind;
  dependencies?:string[];
  cellIds?:string[];
  priority?:number;
}
export interface VSRSpatialAssetStreamingRequest {
  requestedAssetIds?:string[];
  activeCellIds?:string[];
  residentAssetIds?:string[];
  maxAssets?:number;
  maxBytes?:number;
}
export interface VSRSpatialAssetStreamingResolution {
  format:typeof VSR_SPATIAL_ASSET_STREAMING_FORMAT;
  version:typeof VSR_SPATIAL_ASSET_STREAMING_VERSION;
  activeCellIds:string[];
  requestedAssetIds:string[];
  requiredAssetIds:string[];
  residentAssetIds:string[];
  queuedAssetIds:string[];
  deferredAssetIds:string[];
  missingAssetIds:string[];
  evictedAssetIds:string[];
  bytesResident:number;
  bytesQueued:number;
  maxAssets:number;
  maxBytes:number;
  catalogRoot:string;
  requestRoot:string;
  diagnostics:string[];
  root:string;
}
export interface VSRSpatialAssetStreamingLoaderContext {
  asset:VSRSpatialAssetRecord;
  signal:AbortSignal;
  attempt:number;
}
export type VSRSpatialAssetPayload=Uint8Array|ArrayBuffer;
export type VSRSpatialAssetLoader=(asset:VSRSpatialAssetRecord,context:VSRSpatialAssetStreamingLoaderContext)=>VSRSpatialAssetPayload|Promise<VSRSpatialAssetPayload>;
export type VSRSpatialAssetState='idle'|'loading'|'ready'|'failed'|'blocked'|'evicted';
export interface VSRSpatialAssetStreamingOperation {
  assetId:string;
  status:'loaded'|'failed'|'blocked'|'evicted';
  byteLength?:number;
  sha256?:string;
  errorCode?:string;
  errorMessage?:string;
  attempt?:number;
}
export interface VSRSpatialAssetStreamingReceipt {
  format:typeof VSR_SPATIAL_ASSET_STREAMING_FORMAT;
  version:typeof VSR_SPATIAL_ASSET_STREAMING_VERSION;
  resolution:VSRSpatialAssetStreamingResolution;
  operations:VSRSpatialAssetStreamingOperation[];
  readyAssetIds:string[];
  failedAssetIds:string[];
  blockedAssetIds:string[];
  leasedAssetIds:string[];
  bytesLoaded:number;
  receiptRoot:string;
}

interface AssetState {status:VSRSpatialAssetState;bytes?:Uint8Array;errorCode?:string;errorMessage?:string;attempts:number;leases:number}

const orderedUnique=(values:string[]|undefined):string[]=>[...new Set((values??[]).filter(value=>typeof value==='string'&&value.length>0))];
const unique=(values:string[]|undefined):string[]=>orderedUnique(values).sort((a,b)=>a.localeCompare(b));
const finiteBudget=(value:number|undefined,fallback:number):number=>value===undefined||!Number.isFinite(value)?fallback:Math.max(0,Math.floor(value));
const assetView=(asset:VSRSpatialAssetRecord)=>({id:asset.id,uri:asset.uri,sha256:asset.sha256,byteLength:asset.byteLength,kind:asset.kind,dependencies:unique(asset.dependencies),cellIds:unique(asset.cellIds),priority:asset.priority??0});
const assertAsset=(asset:VSRSpatialAssetRecord):void=>{if(!asset.id||!asset.uri||!/^[a-f0-9]{64}$/i.test(asset.sha256)||!Number.isInteger(asset.byteLength)||asset.byteLength<0)throw new Error(`Invalid spatial asset record ${asset.id||'unknown'}.`)};

function catalogMap(catalog:VSRSpatialAssetRecord[]):Map<string,VSRSpatialAssetRecord>{
  const map=new Map<string,VSRSpatialAssetRecord>();
  for(const asset of catalog){assertAsset(asset);if(map.has(asset.id))throw new Error(`Duplicate spatial asset ${asset.id}.`);map.set(asset.id,asset)}
  return map;
}
function catalogRoot(catalog:VSRSpatialAssetRecord[]):string{return cryptographicHash(catalog.map(assetView).sort((a,b)=>a.id.localeCompare(b.id)))}
function dependencyClosure(catalog:Map<string,VSRSpatialAssetRecord>,roots:string[],diagnostics:string[]):{required:Set<string>;missing:Set<string>}{
  const required=new Set<string>(),missing=new Set<string>(),visiting=new Set<string>();
  const visit=(id:string):void=>{
    if(required.has(id))return;
    const asset=catalog.get(id);if(!asset){missing.add(id);required.add(id);return}
    if(visiting.has(id)){diagnostics.push(`dependency-cycle:${id}`);return}
    visiting.add(id);for(const dependency of unique(asset.dependencies))visit(dependency);visiting.delete(id);required.add(id);
  };
  for(const root of roots)visit(root);
  return{required,missing};
}
function dependencyFirstOrder(catalog:Map<string,VSRSpatialAssetRecord>,roots:string[],diagnostics:string[]):string[]{
  const visited=new Set<string>(),visiting=new Set<string>(),ordered:string[]=[];
  const visit=(id:string):void=>{if(visited.has(id)||!catalog.has(id))return;if(visiting.has(id)){diagnostics.push(`dependency-cycle:${id}`);return}visiting.add(id);for(const dependency of unique(catalog.get(id)!.dependencies))visit(dependency);visiting.delete(id);visited.add(id);ordered.push(id)};
  for(const id of roots)visit(id);
  return ordered;
}

export function resolveSpatialAssetStreaming(catalog:VSRSpatialAssetRecord[],request:VSRSpatialAssetStreamingRequest={}):VSRSpatialAssetStreamingResolution{
  const map=catalogMap(catalog),activeCellIds=unique(request.activeCellIds),explicit=unique(request.requestedAssetIds),cellRoots=[...map.values()].filter(asset=>asset.cellIds?.length&&asset.cellIds.some(cellId=>activeCellIds.includes(cellId))).sort((a,b)=>(b.priority??0)-(a.priority??0)||a.id.localeCompare(b.id)).map(asset=>asset.id),requestedAssetIds=unique([...explicit,...cellRoots]),diagnostics:string[]=[];
  const {required,missing}=dependencyClosure(map,requestedAssetIds,diagnostics),ordered=dependencyFirstOrder(map,requestedAssetIds,diagnostics),requiredAssetIds=[...required].sort((a,b)=>{const ai=ordered.indexOf(a),bi=ordered.indexOf(b);return(ai<0?Number.MAX_SAFE_INTEGER:ai)-(bi<0?Number.MAX_SAFE_INTEGER:bi)||a.localeCompare(b)}),residentCandidates=new Set(unique(request.residentAssetIds)),maxAssets=finiteBudget(request.maxAssets,Number.MAX_SAFE_INTEGER),maxBytes=finiteBudget(request.maxBytes,Number.MAX_SAFE_INTEGER);
  const residentAssetIds:string[]=[],queuedAssetIds:string[]=[],deferredAssetIds:string[]=[],evictedAssetIds:string[]=[];let bytesResident=0,bytesQueued=0,usedAssets=0,usedBytes=0;
  for(const id of ordered){const asset=map.get(id)!;if(missing.has(id))continue;const dependencies=unique(asset.dependencies);if(dependencies.some(dependency=>missing.has(dependency))){diagnostics.push(`blocked-by-missing:${id}`);continue}const fits=usedAssets+1<=maxAssets&&usedBytes+asset.byteLength<=maxBytes;if(fits){usedAssets++;usedBytes+=asset.byteLength;if(residentCandidates.has(id)){residentAssetIds.push(id);bytesResident+=asset.byteLength}else{queuedAssetIds.push(id);bytesQueued+=asset.byteLength}}else if(residentCandidates.has(id)){evictedAssetIds.push(id)}else deferredAssetIds.push(id)}
  for(const id of residentCandidates)if(!required.has(id)&&map.has(id))evictedAssetIds.push(id);
  const base={format:VSR_SPATIAL_ASSET_STREAMING_FORMAT,version:VSR_SPATIAL_ASSET_STREAMING_VERSION,activeCellIds,requestedAssetIds,requiredAssetIds,residentAssetIds:unique(residentAssetIds),queuedAssetIds:unique(queuedAssetIds),deferredAssetIds:unique(deferredAssetIds),missingAssetIds:unique([...missing]),evictedAssetIds:unique(evictedAssetIds),bytesResident,bytesQueued,maxAssets,maxBytes,catalogRoot:catalogRoot(catalog),requestRoot:cryptographicHash({requestedAssetIds,activeCellIds,residentAssetIds:unique([...residentCandidates]),maxAssets,maxBytes}),diagnostics:unique(diagnostics)};
  return{...base,residentAssetIds:orderedUnique(residentAssetIds),queuedAssetIds:orderedUnique(queuedAssetIds),deferredAssetIds:orderedUnique(deferredAssetIds),root:cryptographicHash({...base,residentAssetIds:orderedUnique(residentAssetIds),queuedAssetIds:orderedUnique(queuedAssetIds),deferredAssetIds:orderedUnique(deferredAssetIds)})};
}

const payloadBytes=(payload:VSRSpatialAssetPayload):Uint8Array=>payload instanceof Uint8Array?new Uint8Array(payload):new Uint8Array(payload);
const errorInfo=(error:unknown):{code:string;message:string}=>{const value=error as {code?:unknown;message?:unknown};return{code:typeof value?.code==='string'?value.code:'VSR_ASSET_LOAD_FAILED',message:typeof value?.message==='string'?value.message:String(error)}};

export class VSRSpatialAssetStreamer{
  private readonly catalog:Map<string,VSRSpatialAssetRecord>;
  private readonly loader:VSRSpatialAssetLoader;
  private readonly maxConcurrent:number;
  private readonly states=new Map<string,AssetState>();
  constructor(catalog:VSRSpatialAssetRecord[],loader:VSRSpatialAssetLoader,{maxConcurrent=4}:{maxConcurrent?:number}={}){
    this.catalog=catalogMap(catalog);this.loader=loader;this.maxConcurrent=Math.max(1,Math.floor(maxConcurrent));for(const id of this.catalog.keys())this.states.set(id,{status:'idle',attempts:0,leases:0});
  }
  state(assetId:string):VSRSpatialAssetState{return this.states.get(assetId)?.status??'evicted'}
  get(assetId:string):Uint8Array|undefined{const bytes=this.states.get(assetId)?.bytes;return bytes?new Uint8Array(bytes):undefined}
  inspect():{format:typeof VSR_SPATIAL_ASSET_STREAMING_FORMAT;catalogRoot:string;maxConcurrent:number;readyAssetIds:string[];bytesResident:number;states:Record<string,VSRSpatialAssetState>}{
    const ready=[...this.states.entries()].filter(([,state])=>state.status==='ready').map(([id])=>id).sort((a,b)=>a.localeCompare(b));return{format:VSR_SPATIAL_ASSET_STREAMING_FORMAT,catalogRoot:catalogRoot([...this.catalog.values()]),maxConcurrent:this.maxConcurrent,readyAssetIds:ready,bytesResident:ready.reduce((sum,id)=>sum+(this.catalog.get(id)?.byteLength??0),0),states:Object.fromEntries([...this.states.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([id,state])=>[id,state.status]))};
  }
  async acquire(request:VSRSpatialAssetStreamingRequest={}):Promise<VSRSpatialAssetStreamingReceipt>{
    const resolution=resolveSpatialAssetStreaming([...this.catalog.values()],{...request,residentAssetIds:[...this.states.entries()].filter(([,state])=>state.status==='ready').map(([id])=>id)}),operations:VSRSpatialAssetStreamingOperation[]=[];
    for(const id of resolution.queuedAssetIds){const state=this.states.get(id)!;if(state.status==='failed'||state.status==='blocked'||state.status==='evicted')state.status='idle'}
    const pending=new Set(resolution.queuedAssetIds),blocked=new Set<string>();let bytesLoaded=0;
    while(pending.size){
      const newlyBlocked=[...pending].filter(id=>unique(this.catalog.get(id)?.dependencies).some(dependency=>resolution.missingAssetIds.includes(dependency)||this.states.get(dependency)?.status==='failed'||blocked.has(dependency)));
      for(const id of newlyBlocked){pending.delete(id);blocked.add(id);const state=this.states.get(id)!;state.status='blocked';operations.push({assetId:id,status:'blocked',errorCode:'VSR_ASSET_DEPENDENCY_BLOCKED',errorMessage:'Dependency failed or is missing.'})}
      const loadable=[...pending].filter(id=>unique(this.catalog.get(id)?.dependencies).every(dependency=>this.states.get(dependency)?.status==='ready')).slice(0,this.maxConcurrent);
      if(!loadable.length){for(const id of pending){blocked.add(id);const state=this.states.get(id)!;state.status='blocked';operations.push({assetId:id,status:'blocked',errorCode:'VSR_ASSET_DEPENDENCY_UNRESOLVED',errorMessage:'Dependency did not become ready.'})}pending.clear();break}
      for(const id of loadable){pending.delete(id);this.states.get(id)!.status='loading'}
      const results=await Promise.all(loadable.map(async id=>{const state=this.states.get(id)!,asset=this.catalog.get(id)!;state.attempts++;const controller=new AbortController();try{const bytes=payloadBytes(await this.loader(asset,{asset,signal:controller.signal,attempt:state.attempts})),actual=sha256Bytes(bytes);if(actual.toLowerCase()!==asset.sha256.toLowerCase()){const error=Object.assign(new Error(`SHA-256 mismatch for ${id}.`),{code:'VSR_ASSET_HASH_MISMATCH'});throw error}state.bytes=bytes;state.status='ready';return{assetId:id,status:'loaded' as const,byteLength:bytes.byteLength,sha256:actual,attempt:state.attempts}}catch(error){const info=errorInfo(error);state.status='failed';state.bytes=undefined;state.errorCode=info.code;state.errorMessage=info.message;return{assetId:id,status:'failed' as const,errorCode:info.code,errorMessage:info.message,attempt:state.attempts}}}));
      for(const result of results){operations.push(result);if(result.status==='loaded')bytesLoaded+=result.byteLength??0}
    }
    const finalResolution=resolveSpatialAssetStreaming([...this.catalog.values()],{...request,residentAssetIds:[...this.states.entries()].filter(([,state])=>state.status==='ready').map(([id])=>id)});
    const leasedAssetIds=finalResolution.residentAssetIds.filter(id=>{const state=this.states.get(id)!;state.leases++;return true}),failedAssetIds=operations.filter(operation=>operation.status==='failed').map(operation=>operation.assetId).sort((a,b)=>a.localeCompare(b)),blockedAssetIds=operations.filter(operation=>operation.status==='blocked').map(operation=>operation.assetId).sort((a,b)=>a.localeCompare(b)),base={format:VSR_SPATIAL_ASSET_STREAMING_FORMAT,version:VSR_SPATIAL_ASSET_STREAMING_VERSION,resolution:finalResolution,operations,readyAssetIds:finalResolution.residentAssetIds,failedAssetIds,blockedAssetIds,leasedAssetIds,bytesLoaded};return{...base,receiptRoot:cryptographicHash(base)};
  }
  release(assetIds:string[]):string[]{const {required}=dependencyClosure(this.catalog,unique(assetIds),[]),released:string[]=[];for(const id of required){const state=this.states.get(id);if(state&&state.leases>0){state.leases--;released.push(id)}}return released.sort((a,b)=>a.localeCompare(b))}
  evict(assetIds?:string[]):string[]{const candidates=assetIds?unique(assetIds):[...this.states.keys()].sort((a,b)=>a.localeCompare(b)),evicted:string[]=[];for(const id of candidates){const state=this.states.get(id);if(!state||state.status!=='ready'||state.leases>0)continue;state.status='evicted';state.bytes=undefined;evicted.push(id)}return evicted}
}

export function verifySpatialAssetStreamingReceipt(receipt:VSRSpatialAssetStreamingReceipt):boolean{const {receiptRoot,...base}=receipt;return cryptographicHash(base)===receiptRoot&&receipt.resolution.root===cryptographicHash({...receipt.resolution,...{root:undefined}})}
