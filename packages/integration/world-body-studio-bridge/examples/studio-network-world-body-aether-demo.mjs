import { createStudioNetworkWorld } from '../../../../examples/studio-authored-network-world-v03/project.mjs';
import { createRealityCellAssetRuntime } from '@taowind/aether-rncs-bridge';
import {
  compileStudioWorldBodyAetherProjection,
  compileStudioWorldBodyCandidate,
  inspectStudioWorldBodyAetherProjection,
  projectStudioWorldBodyCandidateToRealityCell,
  verifyStudioWorldBodyAetherProjection,
} from '../src/index.mjs';

const { session, compilation: networkCompilation, assetId } = createStudioNetworkWorld();
const bundle = compileStudioWorldBodyCandidate(session.project, { networkCompilation });
const inspection = inspectStudioWorldBodyAetherProjection(bundle);
const projection = compileStudioWorldBodyAetherProjection(bundle, { allowLossyProjection: true });
const bodyIds = projection.batch.entity_ids;
const sourceFile = session.project.assets.registry[assetId].files.find(file => file.mime === 'model/gltf-binary');
const assetBytes = Buffer.from(sourceFile.embedded_base64, 'base64');
const assetCatalog = [{ id: assetId, uri: `memory://${assetId}.glb`, format: 'glb', sha256: sourceFile.sha256, byteLength: assetBytes.length, kind: 'mesh', cellIds: ['cell:studio-world'], priority: 100 }];
const assetRuntime = createRealityCellAssetRuntime(assetCatalog, async () => new Uint8Array(assetBytes), { maxConcurrent: 2 });
const result = await projectStudioWorldBodyCandidateToRealityCell(bundle, {
  cellCatalog: [{ id: 'cell:studio-world', center: [0, 0, 0], radius: 1_000_000, bodyIds, priority: 10 }],
  assetRuntime,
  assetStreamingRequest: { maxAssets: 1, maxBytes: assetBytes.length },
  bindNetworkObserver: true,
  observerPosition: [0, 0, 0],
  cameraPosition: [7, 5, 9],
  maxObjects: 1,
  width: 320,
  height: 180,
  qualityTier: 'balanced',
});

if (!verifyStudioWorldBodyAetherProjection(result)) throw new Error('STUDIO_WB_AETHER_PROJECTION_RECEIPT_INVALID');
console.log(JSON.stringify({
  status: 'PASS_CANDIDATE_RUNTIME',
  authority: result.authority,
  sourceWorldBodyRoot: result.source.world_body_root,
  projectionRoot: result.projectionRoot,
  receiptRoot: result.receipt.receiptRoot,
  inspectionLossCodes: inspection.losses.map(loss => loss.code),
  runtimeLossCodes: result.losses.map(loss => loss.code),
  assetInstanceIds: result.runtime.assetBinding.assetBindings.map(binding => binding.instanceId ?? binding.assetId),
  networkObserver: { sessionId: result.networkBinding.sessionId, observerId: result.networkBinding.observerId, selectedBodyIds: result.runtime.cellState.relevanceView.selectedObjects.map(object => object.objectId) },
  runtimeRoots: result.runtime.roots,
  bodyCount: result.runtime.snapshot.bodies.length,
  activeCellIds: result.runtime.cellState.activeCellIds,
  frameRoot: result.runtime.projection.framePlan.frameRoot,
  pixelRoot: result.runtime.projection.pixelRoot,
}, null, 2));
assetRuntime.release(result.runtime.assetBinding.receipt.leasedAssetIds);
assetRuntime.evict(result.runtime.assetBinding.receipt.leasedAssetIds);
