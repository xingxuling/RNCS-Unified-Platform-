import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {rootHash} from '@taowind/rncs-core-contract';
import {createKernel} from './kernel-spatial-binding-fixture.mjs';
import {acquireRealityCellAssets,createRealityCellAssetRuntime,evictRealityCellAssets,projectKernelStateToRealityCell,releaseRealityCellAssets,resolveRealityCellState,verifyRealityCellState} from '../src/reality-cell.mjs';

const outDir=path.resolve(process.argv[2]??'outputs/reality-cell-assets-v01'),cacheDir=path.join(outDir,'cache');
await mkdir(cacheDir,{recursive:true});
const payloads=new Map([
  ['asset:shared',new TextEncoder().encode('shared')],
  ['asset:mesh',new TextEncoder().encode('mesh')],
  ['asset:far',new TextEncoder().encode('far')]
]);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=new Map([...payloads].map(([id,bytes])=>[id,path.join(cacheDir,`${id.replaceAll(':','-')}.bin`)]));
for(const [id,bytes] of payloads)await writeFile(files.get(id),bytes);
const assetCatalog=[
  {id:'asset:shared',uri:'memory://shared',sha256:digest(payloads.get('asset:shared')),byteLength:payloads.get('asset:shared').byteLength,kind:'texture',cellIds:['cell:near'],priority:4},
  {id:'asset:mesh',uri:'memory://mesh',sha256:digest(payloads.get('asset:mesh')),byteLength:payloads.get('asset:mesh').byteLength,kind:'mesh',cellIds:['cell:near'],dependencies:['asset:shared'],priority:10},
  {id:'asset:far',uri:'memory://far',sha256:digest(payloads.get('asset:far')),byteLength:payloads.get('asset:far').byteLength,kind:'mesh',cellIds:['cell:far'],priority:1}
];
const cellCatalog=[
  {id:'cell:near',center:[0,0,0],radius:4,bodyIds:['body:crate','body:ground'],priority:10},
  {id:'cell:far',center:[100,0,0],radius:4,nodeIds:[],priority:1}
];
const assetStreamingRequest={residentAssetIds:['asset:shared'],maxAssets:2,maxBytes:10};
const near=await projectKernelStateToRealityCell(createKernel(),{cellCatalog,assetCatalog,assetStreamingRequest,observerPosition:[0,2,0],focusBodyIds:['body:crate'],causalBodyIds:['body:crate'],maxObjects:1,width:320,height:180,qualityTier:'balanced'});
const runtime=createRealityCellAssetRuntime(assetCatalog,async asset=>readFile(files.get(asset.id)),{maxConcurrent:2});
const nearReceipt=await acquireRealityCellAssets(runtime,near.cellState);
const nearReleased=releaseRealityCellAssets(runtime,nearReceipt);
const farState=resolveRealityCellState(near.snapshot,near.projection.scene,{cellCatalog,assetCatalog,assetStreamingRequest,observerPosition:[100,0,0],relevanceRadius:3,previousState:near.cellState});
const farReceipt=await acquireRealityCellAssets(runtime,farState);
const nearEvicted=evictRealityCellAssets(runtime,farReceipt);
const farReleased=releaseRealityCellAssets(runtime,farReceipt);
const farEvicted=evictRealityCellAssets(runtime,farReceipt.leasedAssetIds);
await writeFile(path.join(outDir,'near-cell-state.json'),JSON.stringify(near.cellState,null,2));
await writeFile(path.join(outDir,'far-cell-state.json'),JSON.stringify(farState,null,2));
await writeFile(path.join(outDir,'near-receipt.json'),JSON.stringify(nearReceipt,null,2));
await writeFile(path.join(outDir,'far-receipt.json'),JSON.stringify(farReceipt,null,2));
const evidenceBase={format:'rncs.reality-cell-asset-runtime-evidence.v0.1',worldId:near.snapshot.worldId,tick:near.snapshot.tick,cellStatesVerified:verifyRealityCellState(near.cellState).ok&&verifyRealityCellState(farState).ok,near:{activeCellIds:near.cellState.activeCellIds,requiredAssetIds:near.cellState.assetStreaming.requiredAssetIds,loadedAssetIds:nearReceipt.readyAssetIds,bytesLoaded:nearReceipt.bytesLoaded,receiptRoot:nearReceipt.receiptRoot},far:{activeCellIds:farState.activeCellIds,requiredAssetIds:farState.assetStreaming.requiredAssetIds,loadedAssetIds:farReceipt.readyAssetIds,bytesLoaded:farReceipt.bytesLoaded,evictedAssetIds:farReceipt.resolution.evictedAssetIds,receiptRoot:farReceipt.receiptRoot},leases:{nearReleased,farReleased},eviction:{nearEvicted,farEvicted},runtime:runtime.inspect(),roots:{nearCellState:near.cellState.root,farCellState:farState.root,nearAssetPlan:near.cellState.assetStreaming.root,farAssetPlan:farState.assetStreaming.root}};
await writeFile(path.join(outDir,'evidence.json'),JSON.stringify({...evidenceBase,evidenceRoot:rootHash(evidenceBase)},null,2));
console.log(JSON.stringify({outDir,format:evidenceBase.format,cellStatesVerified:evidenceBase.cellStatesVerified,nearLoaded:nearReceipt.readyAssetIds,farLoaded:farReceipt.readyAssetIds,evicted:farReceipt.resolution.evictedAssetIds,finalReady:runtime.inspect().readyAssetIds,evidenceRoot:rootHash(evidenceBase)},null,2));
