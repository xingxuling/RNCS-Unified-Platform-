import { createHash } from 'node:crypto';
import { createRuntime as createAetherEarthRuntime } from '@taowind/aether-earth-runtime';
import { compileRclAuthorityPlan } from '@taowind/rncs-rcl-control-plane';
import { runAssetProductionStudioForge } from '../asset-production-studio-forge-v010/runtime.mjs';
import { runBehaviorSequencerWorld } from '../behavior-sequencer-v011/runtime.mjs';
import { runPlayableWorld } from '../playable-spatial-world-v08/runtime.mjs';

const rootHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

const RCL_WORLD_SOURCE = `reality BeyondEngineWorld {
  facet rncs.world.world_id : Text = "world:beyond-engine-v01"
  facet rncs.world.title : Text = "Beyond Engine Town"
  facet rncs.world.object.town.id : Text = "object:town"
  facet rncs.world.object.town.kind : Text = "town"
  facet rncs.world.object.town.position.x : Number = 0
  facet rncs.world.object.town.position.y : Number = 0
  facet rncs.world.object.town.position.z : Number = 0
  facet rncs.world.object.town.physical.body : Text = "static"
  facet rncs.world.object.town.physical.halfExtents.x : Number = 1200
  facet rncs.world.object.town.physical.halfExtents.y : Number = 100
  facet rncs.world.object.town.physical.halfExtents.z : Number = 1200
  facet rncs.world.behavior.steward.id : Text = "behavior:steward"
  facet rncs.world.behavior.steward.version : Text = "1.0.0"
  facet rncs.world.behavior.steward.enabled : Truth = true
  facet rncs.world.change.status.op : Text = "set"
  facet rncs.world.change.status.path : Text = "world.status"
  facet rncs.world.change.status.value : Text = "ready"
  facet world.ready : Truth = true
  facet world.status : Text = "draft"
  subject steward {
    warrant world.publish on world
  }
  emergence publish {
    cause steward
    when world.ready == true
    needs world.publish on world
    alter world.status <- "ready"
    preserve world.ready == true
    witness "beyond-engine:g1:publish"
  }
  foresee publish
  realize publish
}`;

export async function runBeyondEngineVerticalSlice({ outDir = 'artifacts/beyond-engine-vertical-slice-v01' } = {}) {
  const [assetForge, spatial, behavior] = await Promise.all([
    runAssetProductionStudioForge({ outDir: `${outDir}/asset-forge` }),
    runPlayableWorld(),
    Promise.resolve(runBehaviorSequencerWorld()),
  ]);

  const earth = createAetherEarthRuntime({ seed: 1908, organismCount: 100, knowledgeEntries: 512 });
  const earthAdvance = earth.advance(180, { crystalInterval: 60 });
  const earthReport = earth.report();
  const authority = await compileRclAuthorityPlan(RCL_WORLD_SOURCE, {
    subjectId: 'subject:town-steward',
    roles: ['world-founder', 'town-steward'],
    baselineGeneration: 0,
    riskLevel: 'high',
  });

  const evidence = {
    format: 'rncs.beyond-engine-vertical-slice-evidence.v0.1',
    versions: {
      rclEmbedded: authority.plan.source.version,
      rclCanonical: '0.94.0-alpha.1',
      rncs: '0.19.8-alpha.1',
      assetForge: assetForge.evidence.versions.ragf,
      spatial: spatial.versions,
      earth: '0.1.0-alpha.1',
      behavior: behavior.versions,
    },
    roots: {
      asset: assetForge.evidence.roots.acceptance,
      spatial: spatial.authorityRoot,
      earth: earthReport.realityRoot,
      rclBytecode: authority.plan.source.bytecode_hash,
      rclAuthority: authority.authorityEvidence?.root ?? authority.plan.source.rcl_authority_evidence_root,
      replay: behavior.replay.replay_root,
    },
    metrics: {
      generatedAssets: assetForge.evidence.statistics.candidate_count,
      spatialTick: spatial.tick,
      earthOrganisms: earthReport.organisms,
      earthDays: earthAdvance.day,
      earthCrystals: earthReport.crystals.length,
      rclObjects: authority.objects.length,
      rclBehaviors: authority.behaviors.length,
      rclOperations: authority.operations.length,
    },
    acceptance: {
      assetProducedAndAccepted: Object.values(assetForge.evidence.acceptance).every(Boolean),
      spatialNetworkConverges: Object.values(spatial.acceptance).every(Boolean),
      intelligentSubjectsEvolve: earthReport.organisms === 100 && earthAdvance.beforeRoot !== earthAdvance.afterRoot,
      rclNativeParity: authority.execution.parity?.ok === true && authority.plan.source.compiler_parity.ok === true,
      rclWorldPlanIsActionable: authority.objects.length === 1 && authority.behaviors.length === 1 && authority.operations.length === 1,
      behaviorReplayIsDeterministic: Object.values(behavior.acceptance).every(Boolean),
      evidenceRootsAreDistinct: new Set([
        assetForge.evidence.roots.acceptance,
        spatial.authorityRoot,
        earthReport.realityRoot,
        authority.authorityEvidence.root,
        behavior.replay.replay_root,
      ]).size === 5,
    },
  };
  evidence.composite_root = rootHash({ roots: evidence.roots, metrics: evidence.metrics });
  evidence.replay_invariant_root = rootHash({
    roots: {
      spatial: evidence.roots.spatial,
      earth: evidence.roots.earth,
      rclBytecode: evidence.roots.rclBytecode,
      rclAuthority: evidence.roots.rclAuthority,
      replay: evidence.roots.replay,
    },
    metrics: evidence.metrics,
  });
  return { evidence, assetPreviewPng: assetForge.png, spatialPreviewPng: spatial.png };
}
