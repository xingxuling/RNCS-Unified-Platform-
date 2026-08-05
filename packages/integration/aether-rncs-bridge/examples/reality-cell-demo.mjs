import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {rootHash} from '@taowind/rncs-core-contract';
import {createKernel} from './kernel-spatial-binding-fixture.mjs';
import {projectKernelStateToRealityCell,verifyRealityCellState} from '../src/reality-cell.mjs';

const outDir=path.resolve(process.argv[2]??'outputs/reality-cell-v01');
await mkdir(outDir,{recursive:true});
const result=await projectKernelStateToRealityCell(createKernel(),{
  cellCatalog:[
    {id:'cell:near',center:[0,0,0],radius:4,bodyIds:['body:crate','body:ground'],priority:10},
    {id:'cell:far',center:[100,0,0],radius:4,nodeIds:[],priority:1}
  ],
  assetCatalog:[
    {id:'asset:shared',uri:'memory://shared',sha256:'0'.repeat(64),byteLength:4,kind:'texture',cellIds:['cell:near'],priority:4},
    {id:'asset:mesh',uri:'memory://mesh',sha256:'1'.repeat(64),byteLength:8,kind:'mesh',cellIds:['cell:near'],dependencies:['asset:shared'],priority:10},
    {id:'asset:far',uri:'memory://far',sha256:'2'.repeat(64),byteLength:20,kind:'mesh',cellIds:['cell:far'],priority:1}
  ],
  assetStreamingRequest:{residentAssetIds:['asset:shared'],maxAssets:2,maxBytes:12},
  observerPosition:[0,2,0],
  focusBodyIds:['body:crate'],
  causalBodyIds:['body:crate'],
  maxObjects:1,
  width:320,
  height:180,
  qualityTier:'balanced'
});
await writeFile(path.join(outDir,'reality-cell-state.json'),JSON.stringify(result.cellState,null,2));
await writeFile(path.join(outDir,'scene.vsr3d.json'),JSON.stringify(result.projection.scene,null,2));
await writeFile(path.join(outDir,'frame-plan.json'),JSON.stringify(result.projection.framePlan,null,2));
await writeFile(path.join(outDir,'reference.png'),result.projection.png);
const evidenceBase={format:'rncs.reality-cell-evidence.v0.1',worldId:result.snapshot.worldId,tick:result.snapshot.tick,verified:verifyRealityCellState(result.cellState).ok,frameVerified:result.projection.frameVerified,activeCellIds:result.cellState.activeCellIds,selectedCellIds:result.cellState.selectedCellIds,roots:result.roots,counts:{cells:result.cellState.cells.length,activeCells:result.cellState.activeCellIds.length,causalIslands:result.cellState.causalIslands.length,vsrDraws:result.projection.framePlan.stats.visibleDraws,assetRequired:result.cellState.assetStreaming.requiredAssetIds.length,assetResident:result.cellState.assetStreaming.residentAssetIds.length,assetQueued:result.cellState.assetStreaming.queuedAssetIds.length}};
await writeFile(path.join(outDir,'evidence.json'),JSON.stringify({...evidenceBase,evidenceRoot:rootHash(evidenceBase)},null,2));
console.log(JSON.stringify({outDir,format:'rncs.reality-cell-evidence.v0.1',activeCellIds:result.cellState.activeCellIds,selectedCellIds:result.cellState.selectedCellIds,frameVerified:result.projection.frameVerified,evidenceRoot:rootHash(evidenceBase)},null,2));
