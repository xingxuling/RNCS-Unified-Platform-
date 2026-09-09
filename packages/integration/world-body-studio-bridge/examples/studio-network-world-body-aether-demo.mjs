import { createStudioNetworkWorld } from '../../../../examples/studio-authored-network-world-v03/project.mjs';
import {
  compileStudioWorldBodyAetherProjection,
  compileStudioWorldBodyCandidate,
  inspectStudioWorldBodyAetherProjection,
  projectStudioWorldBodyCandidateToRealityCell,
  verifyStudioWorldBodyAetherProjection,
} from '../src/index.mjs';

const { session, compilation: networkCompilation } = createStudioNetworkWorld();
const bundle = compileStudioWorldBodyCandidate(session.project, { networkCompilation });
const inspection = inspectStudioWorldBodyAetherProjection(bundle);
const projection = compileStudioWorldBodyAetherProjection(bundle, { allowLossyProjection: true });
const bodyIds = projection.batch.entity_ids;
const result = await projectStudioWorldBodyCandidateToRealityCell(bundle, {
  allowLossyProjection: true,
  cellCatalog: [{ id: 'cell:studio-world', center: [0, 0, 0], radius: 1_000_000, bodyIds, priority: 10 }],
  observerPosition: [0, 0, 0],
  cameraPosition: [7, 5, 9],
  focusBodyIds: bodyIds,
  causalBodyIds: bodyIds,
  maxObjects: bodyIds.length,
  width: 320,
  height: 180,
  qualityTier: 'balanced',
});

if (!verifyStudioWorldBodyAetherProjection(result)) throw new Error('STUDIO_WB_AETHER_PROJECTION_RECEIPT_INVALID');
console.log(JSON.stringify({
  status: 'PASS_CANDIDATE_LOSSY_RUNTIME',
  authority: result.authority,
  sourceWorldBodyRoot: result.source.world_body_root,
  projectionRoot: result.projectionRoot,
  receiptRoot: result.receipt.receiptRoot,
  lossCodes: inspection.losses.map(loss => loss.code),
  runtimeRoots: result.runtime.roots,
  bodyCount: result.runtime.snapshot.bodies.length,
  activeCellIds: result.runtime.cellState.activeCellIds,
  frameRoot: result.runtime.projection.framePlan.frameRoot,
  pixelRoot: result.runtime.projection.pixelRoot,
}, null, 2));
