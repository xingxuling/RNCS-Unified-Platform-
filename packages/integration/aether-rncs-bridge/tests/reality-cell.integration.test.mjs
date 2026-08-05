import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import test from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifySpatialAssetStreamingReceipt} from '@taowind/visual-state-runtime/spatial-asset-streaming';
import {createKernel} from '../examples/kernel-spatial-binding-fixture.mjs';
import {createCellAssetCatalog,createCellAssetPayloads} from '../examples/reality-cell-asset-scene-fixture.mjs';
import {acquireRealityCellAssets,bindRealityCellAssetScene,createRealityCellAssetCache,createRealityCellAssetRuntime,createRealityCellAssetSceneRuntime,evictRealityCellAssets,prefetchRealityCellAssets,projectKernelStateToRealityCell,releaseRealityCellAssets,resolveRealityCellState,verifyRealityCellState} from '../src/reality-cell.mjs';

const cellCatalog=[
  {id:'cell:near',center:[0,0,0],radius:4,bodyIds:['body:crate','body:ground'],priority:10},
  {id:'cell:far',center:[100,0,0],radius:4,nodeIds:[],priority:1}
];
const assetCatalog=[
  {id:'asset:shared',uri:'memory://shared',sha256:'0'.repeat(64),byteLength:4,kind:'texture',cellIds:['cell:near'],priority:4},
  {id:'asset:mesh',uri:'memory://mesh',sha256:'1'.repeat(64),byteLength:8,kind:'mesh',cellIds:['cell:near'],dependencies:['asset:shared'],priority:10},
  {id:'asset:far',uri:'memory://far',sha256:'2'.repeat(64),byteLength:20,kind:'mesh',cellIds:['cell:far'],priority:1}
];
const payload=value=>new TextEncoder().encode(value);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const livePayloads=new Map([
  ['asset:shared',payload('shared')],
  ['asset:mesh',payload('mesh')],
  ['asset:far',payload('far')]
]);
const liveAssetCatalog=[
  {id:'asset:shared',uri:'memory://shared',sha256:digest(livePayloads.get('asset:shared')),byteLength:livePayloads.get('asset:shared').byteLength,kind:'texture',cellIds:['cell:near'],priority:4},
  {id:'asset:mesh',uri:'memory://mesh',sha256:digest(livePayloads.get('asset:mesh')),byteLength:livePayloads.get('asset:mesh').byteLength,kind:'mesh',cellIds:['cell:near'],dependencies:['asset:shared'],priority:10},
  {id:'asset:far',uri:'memory://far',sha256:digest(livePayloads.get('asset:far')),byteLength:livePayloads.get('asset:far').byteLength,kind:'mesh',cellIds:['cell:far'],priority:1}
];

test('Reality Cell binds causal, relevance, LWC, asset and VSR streaming roots',async()=>{
  const kernel=createKernel(),result=await projectKernelStateToRealityCell(kernel,{cellCatalog,assetCatalog,assetStreamingRequest:{residentAssetIds:['asset:shared'],maxAssets:2,maxBytes:12},observerPosition:[0,2,0],focusBodyIds:['body:crate'],causalBodyIds:['body:crate'],maxObjects:1,width:160,height:96,qualityTier:'economy'});
  assert.equal(verifyRealityCellState(result.cellState).ok,true);
  assert.equal(result.cellState.format,'rncs.reality-cell-state.v0.1');
  assert.deepEqual(result.cellState.activeCellIds,['cell:near']);
  assert.deepEqual(result.cellState.selectedCellIds,['cell:near']);
  assert.equal(result.cellState.relevance.requiredBodyIds.includes('body:crate'),true);
  assert.equal(result.cellState.causalIslands.length,2);
  assert.equal(result.cellState.cells.find(cell=>cell.id==='cell:near').lwc.localQ.length,3);
  assert.equal(result.projection.frameVerified,true);
  assert.deepEqual(result.projection.framePlan.streaming.activeCellIds,['cell:near']);
  assert.equal(result.projection.framePlan.streaming.root,result.cellState.vsr.resolutionRoot);
  assert.deepEqual(result.cellState.assetStreaming.activeCellIds,['cell:near']);
  assert.deepEqual(result.cellState.assetStreaming.requiredAssetIds,['asset:shared','asset:mesh']);
  assert.deepEqual(result.cellState.assetStreaming.residentAssetIds,['asset:shared']);
  assert.deepEqual(result.cellState.assetStreaming.queuedAssetIds,['asset:mesh']);
  assert.deepEqual(result.cellState.assetStreaming.evictedAssetIds,[]);
  assert.equal(result.projection.framePlan.assetStreaming.root,result.cellState.assetStreaming.root);
  assert.equal(result.roots.asset_streaming_root,result.cellState.assetStreaming.root);
  assert.equal(result.roots.cell_state_root,result.cellState.root);
  assert.equal(result.projection.framePlan.stats.activeCells,1);
  const tampered=structuredClone(result.cellState);tampered.assetStreaming.queuedAssetIds=[];
  assert.equal(verifyRealityCellState(tampered).ok,false);
  const malformed=structuredClone(result.cellState);malformed.assetStreaming={};
  assert.equal(verifyRealityCellState(malformed).ok,false);
});

test('Reality Cell transitions deterministically and rejects tampering',async()=>{
  const kernel=createKernel(),rsr=await (await import('@taowind/reality-simulation-runtime')).spatial(),vsr=await (await import('@taowind/reality-simulation-runtime')).spatialVsr(),batch=kernel.readStateBatch(),binding=rsr.materializeKernelStateBatch(batch),world=new rsr.SpatialEmbodimentWorld(binding.config),snapshot=world.snapshot(),scene=vsr.spatialEmbodimentSnapshotToVSRScene(snapshot,{cameraPosition:[0,2,0]}),assetRequest={residentAssetIds:['asset:shared'],maxAssets:2,maxBytes:12},first=resolveRealityCellState(snapshot,scene,{cellCatalog,assetCatalog,assetStreamingRequest:assetRequest,observerPosition:[0,2,0],relevanceRadius:3}),second=resolveRealityCellState(snapshot,scene,{cellCatalog,assetCatalog,assetStreamingRequest:assetRequest,observerPosition:[100,0,0],relevanceRadius:3,previousState:first});
  assert.equal(verifyRealityCellState(first).ok,true);
  assert.equal(verifyRealityCellState(second).ok,true);
  assert.deepEqual(first.activeCellIds,['cell:near']);
  assert.deepEqual(second.activeCellIds,['cell:far']);
  assert.deepEqual(second.enteredCellIds,['cell:far']);
  assert.deepEqual(second.exitedCellIds,['cell:near']);
  assert.deepEqual(second.assetStreaming.activeCellIds,['cell:far']);
  assert.deepEqual(second.assetStreaming.requiredAssetIds,['asset:far']);
  assert.deepEqual(second.assetStreaming.evictedAssetIds,['asset:shared']);
  assert.equal(first.root,resolveRealityCellState(snapshot,scene,{cellCatalog,assetCatalog,assetStreamingRequest:assetRequest,observerPosition:[0,2,0],relevanceRadius:3}).root);
  const tampered=structuredClone(first);tampered.cells.find(cell=>cell.state==='active').state='unloaded';
  assert.equal(verifyRealityCellState(tampered).ok,false);
});

test('Reality Cell asset runtime loads real payloads, leases, releases and evicts',async()=>{
  const kernel=createKernel(),rsr=await (await import('@taowind/reality-simulation-runtime')).spatial(),vsr=await (await import('@taowind/reality-simulation-runtime')).spatialVsr(),batch=kernel.readStateBatch(),binding=rsr.materializeKernelStateBatch(batch),world=new rsr.SpatialEmbodimentWorld(binding.config),snapshot=world.snapshot(),scene=vsr.spatialEmbodimentSnapshotToVSRScene(snapshot,{cameraPosition:[0,2,0]}),assetRequest={residentAssetIds:['asset:shared'],maxAssets:2,maxBytes:10},near=resolveRealityCellState(snapshot,scene,{cellCatalog,assetCatalog:liveAssetCatalog,assetStreamingRequest:assetRequest,observerPosition:[0,2,0],relevanceRadius:3}),starts=[];
  const runtime=createRealityCellAssetRuntime(liveAssetCatalog,async asset=>{starts.push(asset.id);await new Promise(resolve=>setTimeout(resolve,1));return livePayloads.get(asset.id)}, {maxConcurrent:2});
  const nearReceipt=await acquireRealityCellAssets(runtime,near);
  assert.equal(verifySpatialAssetStreamingReceipt(nearReceipt),true);
  assert.deepEqual(near.assetStreaming.residentAssetIds,['asset:shared']);
  assert.deepEqual(near.assetStreaming.queuedAssetIds,['asset:mesh']);
  assert.deepEqual(nearReceipt.readyAssetIds,['asset:shared','asset:mesh']);
  assert.deepEqual(nearReceipt.failedAssetIds,[]);
  assert.deepEqual(nearReceipt.blockedAssetIds,[]);
  assert.equal(nearReceipt.bytesLoaded,10);
  assert.deepEqual(starts,['asset:shared','asset:mesh']);
  assert.deepEqual(runtime.inspect().readyAssetIds,['asset:mesh','asset:shared']);
  assert.deepEqual(releaseRealityCellAssets(runtime,nearReceipt),['asset:mesh','asset:shared']);
  const far=resolveRealityCellState(snapshot,scene,{cellCatalog,assetCatalog:liveAssetCatalog,assetStreamingRequest:assetRequest,observerPosition:[100,0,0],relevanceRadius:3,previousState:near});
  const farReceipt=await acquireRealityCellAssets(runtime,far);
  assert.deepEqual(farReceipt.readyAssetIds,['asset:far']);
  assert.deepEqual(farReceipt.resolution.evictedAssetIds,['asset:mesh','asset:shared']);
  assert.deepEqual(farReceipt.failedAssetIds,[]);
  assert.deepEqual(farReceipt.blockedAssetIds,[]);
  assert.deepEqual(starts,['asset:shared','asset:mesh','asset:far']);
  assert.deepEqual(evictRealityCellAssets(runtime,farReceipt),['asset:mesh','asset:shared']);
  assert.deepEqual(runtime.inspect().readyAssetIds,['asset:far']);
  assert.deepEqual(evictRealityCellAssets(runtime,farReceipt),[]);
  assert.deepEqual(releaseRealityCellAssets(runtime,farReceipt),['asset:far']);
  assert.deepEqual(evictRealityCellAssets(runtime,farReceipt.leasedAssetIds),['asset:far']);
  assert.deepEqual(runtime.inspect().readyAssetIds,[]);
});

test('Reality Cell prefetches the next Cell without leasing it and promotes the hit',async()=>{
  const kernel=createKernel(),rsr=await (await import('@taowind/reality-simulation-runtime')).spatial(),vsr=await (await import('@taowind/reality-simulation-runtime')).spatialVsr(),batch=kernel.readStateBatch(),binding=rsr.materializeKernelStateBatch(batch),world=new rsr.SpatialEmbodimentWorld(binding.config),snapshot=world.snapshot(),scene=vsr.spatialEmbodimentSnapshotToVSRScene(snapshot,{cameraPosition:[0,2,0]}),starts=[];
  const runtime=createRealityCellAssetRuntime(liveAssetCatalog,async asset=>{starts.push(asset.id);return livePayloads.get(asset.id)},{maxConcurrent:2});
  const near=resolveRealityCellState(snapshot,scene,{cellCatalog,assetCatalog:liveAssetCatalog,assetStreamingRequest:{maxAssets:3,maxBytes:13,prefetchCellIds:['cell:far'],maxPrefetchAssets:1,maxPrefetchBytes:3},observerPosition:[0,2,0],relevanceRadius:3});
  assert.equal(verifyRealityCellState(near).ok,true);
  assert.deepEqual(near.assetStreaming.prefetchCellIds,['cell:far']);
  assert.deepEqual(near.assetStreaming.prefetchAssetIds,['asset:far']);
  assert.deepEqual(near.assetStreaming.prefetchQueuedAssetIds,['asset:far']);
  const prefetched=await prefetchRealityCellAssets(runtime,near);
  assert.deepEqual(prefetched.leasedAssetIds,[]);
  assert.deepEqual(prefetched.readyAssetIds,['asset:shared','asset:mesh','asset:far']);
  const active=await acquireRealityCellAssets(runtime,near);
  assert.deepEqual(active.operations,[]);
  assert.deepEqual(active.leasedAssetIds,['asset:shared','asset:mesh']);
  assert.deepEqual(starts,['asset:shared','asset:mesh','asset:far']);
  releaseRealityCellAssets(runtime,active);
  const far=resolveRealityCellState(snapshot,scene,{cellCatalog,assetCatalog:liveAssetCatalog,assetStreamingRequest:{maxAssets:3,maxBytes:13},observerPosition:[100,0,0],relevanceRadius:3,previousState:near});
  assert.deepEqual(far.assetStreaming.requiredAssetIds,['asset:far']);
  const promoted=await acquireRealityCellAssets(runtime,far);
  assert.deepEqual(promoted.operations,[]);
  assert.deepEqual(promoted.leasedAssetIds,['asset:far']);
  assert.deepEqual(promoted.resolution.evictedAssetIds,['asset:mesh','asset:shared']);
  evictRealityCellAssets(runtime,promoted.resolution.evictedAssetIds);
  assert.deepEqual(starts,['asset:shared','asset:mesh','asset:far']);
  releaseRealityCellAssets(runtime,promoted);
  assert.deepEqual(evictRealityCellAssets(runtime,promoted.leasedAssetIds),['asset:far']);
});

test('Reality Cell asset cache persists verified bytes and rehydrates a cold runtime',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'rncs-reality-cell-cache-'));
  try{
    let sourceReads=0;
    const runtime=createRealityCellAssetRuntime(liveAssetCatalog,async asset=>{sourceReads++;return livePayloads.get(asset.id)},{maxConcurrent:2,cacheDirectory:directory,cacheByteBudget:10});
    const kernel=createKernel(),rsr=await (await import('@taowind/reality-simulation-runtime')).spatial(),vsr=await (await import('@taowind/reality-simulation-runtime')).spatialVsr(),batch=kernel.readStateBatch(),binding=rsr.materializeKernelStateBatch(batch),world=new rsr.SpatialEmbodimentWorld(binding.config),snapshot=world.snapshot(),scene=vsr.spatialEmbodimentSnapshotToVSRScene(snapshot,{cameraPosition:[0,2,0]}),near=resolveRealityCellState(snapshot,scene,{cellCatalog,assetCatalog:liveAssetCatalog,assetStreamingRequest:{maxAssets:2,maxBytes:10},observerPosition:[0,2,0],relevanceRadius:3});
    const firstReceipt=await acquireRealityCellAssets(runtime,near);
    assert.deepEqual(firstReceipt.readyAssetIds,['asset:shared','asset:mesh']);
    assert.equal(sourceReads,2);
    assert.equal(runtime.inspect().cache.cacheMisses,2);
    assert.equal(runtime.inspect().cache.cacheHits,0);
    releaseRealityCellAssets(runtime,firstReceipt);
    evictRealityCellAssets(runtime,firstReceipt.leasedAssetIds);
    const coldRuntime=createRealityCellAssetRuntime(liveAssetCatalog,async()=>{throw new Error('REALITY_CELL_CACHE_SOURCE_READ_UNEXPECTED')},{maxConcurrent:2,cacheDirectory:directory,cacheByteBudget:10});
    await coldRuntime.cacheReady();
    const coldReceipt=await acquireRealityCellAssets(coldRuntime,near);
    assert.deepEqual(coldReceipt.readyAssetIds,['asset:shared','asset:mesh']);
    assert.equal(sourceReads,2);
    assert.equal(coldRuntime.inspect().cache.cacheHits,2);
    assert.equal(coldRuntime.inspect().cache.cacheMisses,0);
    assert.equal(coldRuntime.inspect().cache.bytesResident,10);
    releaseRealityCellAssets(coldRuntime,coldReceipt);
    evictRealityCellAssets(coldRuntime,coldReceipt.leasedAssetIds);
  }finally{await rm(directory,{recursive:true,force:true})}
});

test('Reality Cell asset cache enforces a deterministic LRU byte budget',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'rncs-reality-cell-cache-lru-'));
  try{
    const shared=liveAssetCatalog.find(asset=>asset.id==='asset:shared'),mesh=liveAssetCatalog.find(asset=>asset.id==='asset:mesh'),cache=createRealityCellAssetCache(directory,{maxBytes:shared.byteLength});
    await cache.write(shared,livePayloads.get(shared.id));
    await cache.write(mesh,livePayloads.get(mesh.id));
    assert.equal(await cache.read(shared),undefined);
    assert.deepEqual([...await cache.read(mesh)], [...livePayloads.get(mesh.id)]);
    const inspection=cache.inspect();
    assert.equal(inspection.cacheEvictions,1);
    assert.equal(inspection.cacheHits,1);
    assert.equal(inspection.cacheMisses,1);
    assert.equal(inspection.bytesResident,mesh.byteLength);
    assert.deepEqual(inspection.cachedAssetIds,['asset:mesh']);
    const reopened=createRealityCellAssetCache(directory,{maxBytes:0});
    await reopened.ready();
    assert.equal(reopened.inspect().bytesResident,0);
    assert.equal(reopened.inspect().cacheEvictions,1);
    assert.equal(await reopened.read(mesh),undefined);
  }finally{await rm(directory,{recursive:true,force:true})}
});

test('Reality Cell binds verified GLB payloads into VSR scene resources',async()=>{
  const payloads=createCellAssetPayloads(),catalog=createCellAssetCatalog(payloads),runtime=createRealityCellAssetRuntime(catalog,async asset=>{await new Promise(resolve=>setTimeout(resolve,1));return payloads.get(asset.id)},{maxConcurrent:2}),result=await projectKernelStateToRealityCell(createKernel(),{cellCatalog,assetCatalog:catalog,assetStreamingRequest:{maxAssets:2,maxBytes:catalog.reduce((sum,asset)=>sum+asset.byteLength,0)},assetRuntime:runtime,assetSceneAssetIds:['asset:mesh'],assetScenePlacements:{'asset:mesh':{translation:[0,1.5,0],scale:[1.5,1.5,1.5]}},observerPosition:[0,2,0],cameraPosition:[7,5,9],focusBodyIds:['body:crate'],causalBodyIds:['body:crate'],maxObjects:1,width:160,height:96,qualityTier:'economy'});
  assert.equal(verifyRealityCellState(result.cellState).ok,true);
  assert.ok(result.assetBinding);
  assert.equal(result.assetBinding.assetBindings.length,1);
  assert.deepEqual(result.assetBinding.assetBindings[0].assetId,'asset:mesh');
  assert.ok(result.assetBinding.scene.meshes.some(mesh=>mesh.id.startsWith('cell-asset:asset:mesh:')));
  assert.ok(result.assetBinding.scene.textures?.some(texture=>texture.id.startsWith('cell-asset:asset:mesh:')));
  assert.equal(result.projection.framePlan.assetStreaming.root,result.cellState.assetStreaming.root);
  assert.equal(result.projection.framePlan.stats.materialTextureBindings,1);
  assert.ok(result.projection.framePlan.stats.visibleDraws>=3);
  assert.equal(result.projection.frameVerified,true);
  assert.equal(result.roots.asset_binding_root,result.assetBinding.bindingRoot);
  assert.equal(verifySpatialAssetStreamingReceipt(result.assetBinding.receipt),true);
  assert.deepEqual(releaseRealityCellAssets(runtime,result.assetBinding.receipt),['asset:mesh','asset:shared']);
  assert.deepEqual(evictRealityCellAssets(runtime,result.assetBinding.receipt.leasedAssetIds),['asset:mesh','asset:shared']);
});

test('Reality Cell scene runtime transitions GLB bindings and evicts old Cell assets',async()=>{
  const payloads=createCellAssetPayloads(),catalog=createCellAssetCatalog(payloads),runtime=createRealityCellAssetRuntime(catalog,async asset=>{await new Promise(resolve=>setTimeout(resolve,1));return payloads.get(asset.id)},{maxConcurrent:2}),sceneRuntime=createRealityCellAssetSceneRuntime(runtime),maxBytes=catalog.reduce((sum,asset)=>sum+asset.byteLength,0),near=await projectKernelStateToRealityCell(createKernel(),{cellCatalog,assetCatalog:catalog,assetStreamingRequest:{maxAssets:3,maxBytes},assetSceneRuntime:sceneRuntime,assetSceneAssetIds:['asset:mesh'],assetScenePlacements:{'asset:mesh':{translation:[0,1.5,0],scale:[1.5,1.5,1.5]}},observerPosition:[0,2,0],cameraPosition:[7,5,9],focusBodyIds:['body:crate'],causalBodyIds:['body:crate'],maxObjects:1,width:160,height:96,qualityTier:'economy'});
  assert.deepEqual(near.cellState.activeCellIds,['cell:near']);
  assert.equal(near.projection.frameVerified,true);
  assert.deepEqual(near.assetBinding.assetBindings.map(binding=>binding.assetId),['asset:mesh']);
  assert.deepEqual(near.assetBinding.lifecycle.releasedAssetIds,[]);
  assert.deepEqual(near.assetBinding.lifecycle.evictedAssetIds,[]);
  const far=await projectKernelStateToRealityCell(createKernel(),{cellCatalog,assetCatalog:catalog,assetStreamingRequest:{maxAssets:3,maxBytes},previousState:near.cellState,assetSceneRuntime:sceneRuntime,assetSceneAssetIds:['asset:far-gltf'],assetScenePlacements:{'asset:far-gltf':{translation:[100,1.5,0],scale:[1.5,1.5,1.5]}},observerPosition:[100,2,0],cameraPosition:[107,5,9],maxObjects:1,width:160,height:96,qualityTier:'economy'});
  assert.deepEqual(far.cellState.activeCellIds,['cell:far']);
  assert.deepEqual(far.cellState.exitedCellIds,['cell:near']);
  assert.deepEqual(far.cellState.enteredCellIds,['cell:far']);
  assert.deepEqual(far.assetBinding.assetBindings.map(binding=>binding.assetId),['asset:far-gltf']);
  assert.equal(far.assetBinding.assetBindings[0].assetFormat,'gltf');
  assert.deepEqual(far.assetBinding.assetBindings[0].resourceAssetIds,['asset:far-gltf-bin','asset:far-gltf-image']);
  assert.deepEqual(far.assetBinding.lifecycle.releasedAssetIds,['asset:mesh','asset:shared']);
  assert.deepEqual(far.assetBinding.lifecycle.evictedAssetIds,['asset:mesh','asset:shared']);
  assert.notEqual(far.projection.framePlan.frameRoot,near.projection.framePlan.frameRoot);
  assert.equal(far.projection.framePlan.stats.materialTextureBindings,1);
  assert.equal(far.projection.frameVerified,true);
  assert.equal(sceneRuntime.active().bindingRoot,far.assetBinding.bindingRoot);
  assert.deepEqual(sceneRuntime.release().evictedAssetIds,['asset:far-gltf','asset:far-gltf-bin','asset:far-gltf-image']);
  assert.deepEqual(runtime.inspect().readyAssetIds,[]);
});
