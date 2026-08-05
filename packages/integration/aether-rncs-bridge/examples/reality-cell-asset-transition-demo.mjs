import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {rootHash} from '@taowind/rncs-core-contract';
import {createKernel} from './kernel-spatial-binding-fixture.mjs';
import {createCellAssetCatalog,createCellAssetPayloads} from './reality-cell-asset-scene-fixture.mjs';
import {createRealityCellAssetRuntime,createRealityCellAssetSceneRuntime,projectKernelStateToRealityCell} from '../src/reality-cell.mjs';

const outDir=path.resolve(process.argv[2]??'outputs/reality-cell-asset-transition-v01'),payloadDir=path.join(outDir,'payloads'),cacheDir=path.join(outDir,'cache');
await mkdir(payloadDir,{recursive:true});
await mkdir(path.join(payloadDir,'far'),{recursive:true});
const payloads=createCellAssetPayloads(),payloadFiles=new Map([
  ['asset:shared',path.join(payloadDir,'shared.bin')],
  ['asset:mesh',path.join(payloadDir,'mesh.glb')],
  ['asset:far-gltf',path.join(payloadDir,'far','scene.gltf')],
  ['asset:far-gltf-bin',path.join(payloadDir,'far','scene.bin')],
  ['asset:far-gltf-image',path.join(payloadDir,'far','plane.rgba.json')]
]);
for(const [id,bytes] of payloads)await writeFile(payloadFiles.get(id),bytes);
const assetCatalog=createCellAssetCatalog(payloads),cellCatalog=[
  {id:'cell:near',center:[0,0,0],radius:4,bodyIds:['body:crate','body:ground'],priority:10},
  {id:'cell:far',center:[100,0,0],radius:4,nodeIds:[],priority:1}
],maxBytes=assetCatalog.reduce((sum,asset)=>sum+asset.byteLength,0);
let sourceReads=0;
const runtime=createRealityCellAssetRuntime(assetCatalog,async asset=>{sourceReads++;return readFile(payloadFiles.get(asset.id))},{maxConcurrent:2,cacheDirectory:cacheDir,cacheByteBudget:maxBytes}),sceneRuntime=createRealityCellAssetSceneRuntime(runtime);
const near=await projectKernelStateToRealityCell(createKernel(),{cellCatalog,assetCatalog,assetStreamingRequest:{maxAssets:5,maxBytes,prefetchCellIds:['cell:far'],maxPrefetchAssets:3,maxPrefetchBytes:maxBytes},assetSceneRuntime:sceneRuntime,assetSceneAssetIds:['asset:mesh'],assetScenePlacements:{'asset:mesh':{translation:[0,1.5,0],scale:[1.5,1.5,1.5]}},observerPosition:[0,2,0],cameraPosition:[7,5,9],focusBodyIds:['body:crate'],causalBodyIds:['body:crate'],maxObjects:1,width:320,height:180,qualityTier:'balanced',gpuTextureBudgetBytes:4,gpuBufferBudgetBytes:4});
const far=await projectKernelStateToRealityCell(createKernel(),{cellCatalog,assetCatalog,assetStreamingRequest:{maxAssets:5,maxBytes},previousState:near.cellState,assetSceneRuntime:sceneRuntime,assetSceneAssetIds:['asset:far-gltf'],assetScenePlacements:{'asset:far-gltf':{translation:[100,1.5,0],scale:[1.5,1.5,1.5]}},observerPosition:[100,2,0],cameraPosition:[107,5,9],maxObjects:1,width:320,height:180,qualityTier:'balanced',gpuTextureBudgetBytes:4,gpuBufferBudgetBytes:4});
const nearAgain=await projectKernelStateToRealityCell(createKernel(),{cellCatalog,assetCatalog,assetStreamingRequest:{maxAssets:5,maxBytes},previousState:far.cellState,assetSceneRuntime:sceneRuntime,assetSceneAssetIds:['asset:mesh'],assetScenePlacements:{'asset:mesh':{translation:[0,1.5,0],scale:[1.5,1.5,1.5]}},observerPosition:[0,2,0],cameraPosition:[7,5,9],focusBodyIds:['body:crate'],causalBodyIds:['body:crate'],maxObjects:1,width:320,height:180,qualityTier:'balanced',gpuTextureBudgetBytes:4,gpuBufferBudgetBytes:4});
const finalRelease=sceneRuntime.release();
const writeResult=async(prefix,result)=>{
  const dir=path.join(outDir,prefix);await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'cell-state.json'),JSON.stringify(result.cellState,null,2));
  await writeFile(path.join(dir,'scene.vsr3d.json'),JSON.stringify(result.projection.scene,null,2));
  await writeFile(path.join(dir,'frame-plan.json'),JSON.stringify(result.projection.framePlan,null,2));
  await writeFile(path.join(dir,'asset-binding.json'),JSON.stringify(result.assetBinding,null,2));
  await writeFile(path.join(dir,'reference.png'),result.projection.png);
};
await writeResult('near',near);await writeResult('far',far);await writeResult('near-again',nearAgain);
const evidenceBase={format:'rncs.reality-cell-asset-transition-evidence.v0.3',verified:near.projection.frameVerified&&far.projection.frameVerified&&nearAgain.projection.frameVerified,states:{near:{activeCellIds:near.cellState.activeCellIds,assetIds:near.assetBinding.assetBindings.map(binding=>binding.assetId),prefetchAssetIds:near.cellState.assetStreaming.prefetchAssetIds??[],prefetchResidentAssetIds:near.cellState.assetStreaming.prefetchResidentAssetIds??[],prefetchLoadedAssetIds:near.assetBinding.receipt.resolution.prefetchResidentAssetIds??[],frameRoot:near.projection.framePlan.frameRoot,bindingRoot:near.assetBinding.bindingRoot,lifecycle:near.assetBinding.lifecycle},far:{activeCellIds:far.cellState.activeCellIds,assetIds:far.assetBinding.assetBindings.map(binding=>binding.assetId),prefetchAssetIds:far.cellState.assetStreaming.prefetchAssetIds??[],frameRoot:far.projection.framePlan.frameRoot,bindingRoot:far.assetBinding.bindingRoot,lifecycle:far.assetBinding.lifecycle},nearAgain:{activeCellIds:nearAgain.cellState.activeCellIds,assetIds:nearAgain.assetBinding.assetBindings.map(binding=>binding.assetId),prefetchAssetIds:nearAgain.cellState.assetStreaming.prefetchAssetIds??[],frameRoot:nearAgain.projection.framePlan.frameRoot,bindingRoot:nearAgain.assetBinding.bindingRoot,lifecycle:nearAgain.assetBinding.lifecycle}},finalRelease,cache:runtime.inspect().cache,sourceReads,roots:{nearCellStateRoot:near.cellState.root,farCellStateRoot:far.cellState.root,nearAgainCellStateRoot:nearAgain.cellState.root,nearFrameRoot:near.projection.framePlan.frameRoot,farFrameRoot:far.projection.framePlan.frameRoot,nearAgainFrameRoot:nearAgain.projection.framePlan.frameRoot,nearTransitionRoot:near.assetBinding.lifecycle.lifecycleRoot,farTransitionRoot:far.assetBinding.lifecycle.lifecycleRoot,nearAgainTransitionRoot:nearAgain.assetBinding.lifecycle.lifecycleRoot},counts:{nearDraws:near.projection.framePlan.stats.visibleDraws,farDraws:far.projection.framePlan.stats.visibleDraws,nearAgainDraws:nearAgain.projection.framePlan.stats.visibleDraws,nearTriangles:near.projection.framePlan.stats.triangleCount,farTriangles:far.projection.framePlan.stats.triangleCount,nearAgainTriangles:nearAgain.projection.framePlan.stats.triangleCount}};
await writeFile(path.join(outDir,'evidence.json'),JSON.stringify({...evidenceBase,evidenceRoot:rootHash(evidenceBase)},null,2));
console.log(JSON.stringify({outDir,format:evidenceBase.format,verified:evidenceBase.verified,nearFrameRoot:evidenceBase.roots.nearFrameRoot,farFrameRoot:evidenceBase.roots.farFrameRoot,nearAgainFrameRoot:evidenceBase.roots.nearAgainFrameRoot,farEvicted:evidenceBase.states.far.lifecycle.evictedAssetIds,nearAgainReleased:evidenceBase.states.nearAgain.lifecycle.releasedAssetIds,sourceReads,cache:evidenceBase.cache,finalReady:runtime.inspect().readyAssetIds,evidenceRoot:rootHash(evidenceBase)},null,2));
