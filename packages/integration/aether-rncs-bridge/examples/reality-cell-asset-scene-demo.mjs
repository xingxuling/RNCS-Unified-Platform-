import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {rootHash} from '@taowind/rncs-core-contract';
import {createKernel} from './kernel-spatial-binding-fixture.mjs';
import {createCellAssetCatalog,createCellAssetPayloads} from './reality-cell-asset-scene-fixture.mjs';
import {createRealityCellAssetRuntime,evictRealityCellAssets,projectKernelStateToRealityCell,releaseRealityCellAssets} from '../src/reality-cell.mjs';

const outDir=path.resolve(process.argv[2]??'outputs/reality-cell-asset-scene-v01'),payloadDir=path.join(outDir,'payloads');
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
],assetStreamingRequest={maxAssets:2,maxBytes:assetCatalog.reduce((sum,asset)=>sum+asset.byteLength,0)};
const runtime=createRealityCellAssetRuntime(assetCatalog,async asset=>readFile(payloadFiles.get(asset.id)),{maxConcurrent:2});
const result=await projectKernelStateToRealityCell(createKernel(),{cellCatalog,assetCatalog,assetStreamingRequest,assetRuntime:runtime,assetSceneAssetIds:['asset:mesh'],assetScenePlacements:{'asset:mesh':{translation:[0,1.5,0],scale:[1.5,1.5,1.5]}},observerPosition:[0,2,0],cameraPosition:[7,5,9],focusBodyIds:['body:crate'],causalBodyIds:['body:crate'],maxObjects:1,width:320,height:180,qualityTier:'balanced',gpuTextureBudgetBytes:4,gpuBufferBudgetBytes:4});
await writeFile(path.join(outDir,'reality-cell-state.json'),JSON.stringify(result.cellState,null,2));
await writeFile(path.join(outDir,'scene.vsr3d.json'),JSON.stringify(result.projection.scene,null,2));
await writeFile(path.join(outDir,'frame-plan.json'),JSON.stringify(result.projection.framePlan,null,2));
await writeFile(path.join(outDir,'asset-binding.json'),JSON.stringify(result.assetBinding,null,2));
await writeFile(path.join(outDir,'receipt.json'),JSON.stringify(result.assetBinding.receipt,null,2));
await writeFile(path.join(outDir,'reference.png'),result.projection.png);
const released=releaseRealityCellAssets(runtime,result.assetBinding.receipt),evicted=evictRealityCellAssets(runtime,result.assetBinding.receipt.leasedAssetIds),evidenceBase={format:'rncs.reality-cell-asset-scene-evidence.v0.1',worldId:result.snapshot.worldId,tick:result.snapshot.tick,verified:result.projection.frameVerified,activeCellIds:result.cellState.activeCellIds,assetIds:result.assetBinding.assetBindings.map(binding=>binding.assetId),roots:{cellStateRoot:result.cellState.root,assetStreamingRoot:result.cellState.assetStreaming.root,assetBindingRoot:result.assetBinding.bindingRoot,sceneRoot:result.roots.vsr_scene_root,frameRoot:result.roots.vsr_frame_root,pixelRoot:result.roots.vsr_pixel_root,receiptRoot:result.assetBinding.receipt.receiptRoot},counts:{sceneMeshes:result.projection.scene.meshes.length,sceneTextures:result.projection.scene.textures?.length??0,materialTextureBindings:result.projection.framePlan.stats.materialTextureBindings,visibleDraws:result.projection.framePlan.stats.visibleDraws,triangles:result.projection.framePlan.stats.triangleCount,bytesLoaded:result.assetBinding.receipt.bytesLoaded},lifecycle:{released,evicted,finalReady:runtime.inspect().readyAssetIds}};
await writeFile(path.join(outDir,'evidence.json'),JSON.stringify({...evidenceBase,evidenceRoot:rootHash(evidenceBase)},null,2));
console.log(JSON.stringify({outDir,format:evidenceBase.format,verified:evidenceBase.verified,assetIds:evidenceBase.assetIds,materialTextureBindings:evidenceBase.counts.materialTextureBindings,bytesLoaded:evidenceBase.counts.bytesLoaded,frameRoot:evidenceBase.roots.frameRoot,evidenceRoot:rootHash(evidenceBase)},null,2));
