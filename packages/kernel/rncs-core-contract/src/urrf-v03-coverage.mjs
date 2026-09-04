import {rootHash, without} from './index.mjs';

export const URRF_V03_COVERAGE_FORMAT = 'rncs.urrf-v03-coverage-matrix.v0.1';
export const URRF_V03_COVERAGE_VERSION = '0.1.0';
export const URRF_V03_COVERAGE_STATUSES = Object.freeze([
  'CANDIDATE_LOCAL_VERIFIED',
  'CANDIDATE_LOCAL_PARTIAL',
  'BLOCKED_NOT_RUN',
  'NOT_IMPLEMENTED'
]);
export const URRF_K400_GATES = Object.freeze([
  'EXPRESS',
  'COMPILE',
  'LOWER',
  'EXECUTE',
  'CORRECT',
  'ROBUST',
  'PERFORMANCE',
  'AI_GENERATE',
  'EVIDENCE'
]);

const candidate = 'CANDIDATE_LOCAL_VERIFIED';
const partial = 'CANDIDATE_LOCAL_PARTIAL';
const blocked = 'BLOCKED_NOT_RUN';
const notImplemented = 'NOT_IMPLEMENTED';

const core = 'packages/kernel/rncs-core-contract';
const urrf = 'packages/world/reality-representation-fabric';
const largeWorld = 'packages/world/large-world-runtime';
const ragf = 'packages/world/reality-asset-genesis-fabric';
const evidence = 'docs/verification';

const ref = (source_refs, schema_refs, test_refs, evidence_refs, k400_gates, negative_cases, remaining = []) => ({
  source_refs,
  schema_refs,
  test_refs,
  evidence_refs,
  k400_gates,
  negative_cases,
  remaining
});

const criterion = (ordinal, title, requirement, status, refs, extra = {}) => ({
  criterion_id: `URRF-${String(ordinal).padStart(2, '0')}`,
  ordinal,
  title,
  requirement,
  canonical_owner: extra.canonical_owner ?? 'RNCS',
  representation_owner: extra.representation_owner ?? 'URRF',
  status,
  evidence_level: status === candidate ? 'LOCAL_TEST_AND_ROOT_EVIDENCE' : status === partial ? 'LOCAL_BOUNDED_EVIDENCE' : 'EXPLICIT_GAP_OR_BLOCKER',
  ...refs,
  ...(extra.gap ? {gap: extra.gap} : {}),
  ...(extra.boundary ? {boundary: extra.boundary} : {})
});

export const URRF_V03_SUCCESS_CRITERIA = Object.freeze([
  criterion(1, 'Unified WorldTime', 'WorldTime separates epoch, logical time, simulation tick, causal sequence and historical reference.', candidate, ref(
    [`${core}/src/world-truth.mjs`],
    [`${core}/schemas/world-time.v0.3.schema.json`],
    [`${core}/tests/world-truth.mjs`, 'tests/urrf-v03-world-truth.integration.test.mjs'],
    [`${evidence}/URRF_V03_WORLD_TRUTH_EVIDENCE_v0.1.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'EVIDENCE'],
    ['non-monotonic world time', 'duplicate causal sequence']
  )),
  criterion(2, 'Canonical Event Replay', 'World events append to a canonical log and replay deterministically to the same state root.', candidate, ref(
    [`${core}/src/world-truth.mjs`],
    [`${core}/schemas/world-event.v0.3.schema.json`],
    [`${core}/tests/world-truth.mjs`, 'tests/urrf-v03-world-truth.integration.test.mjs'],
    [`${evidence}/URRF_V03_WORLD_TRUTH_EVIDENCE_v0.1.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['missing causal parent', 'previous-state mismatch', 'next-state mismatch', 'duplicate event']
  )),
  criterion(3, 'Fact Provenance', 'WorldFact and FactWorldTree retain source-event provenance and separate canonical facts from memory references.', candidate, ref(
    [`${core}/src/world-truth.mjs`],
    [`${core}/schemas/world-fact.v0.3.schema.json`, `${core}/schemas/fact-world-tree.v0.3.schema.json`, `${core}/schemas/fact-world-tree-ref.v0.3.schema.json`],
    [`${core}/tests/world-truth.mjs`, 'tests/urrf-v03-world-truth.integration.test.mjs'],
    [`${evidence}/URRF_V03_WORLD_TRUTH_EVIDENCE_v0.1.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'EVIDENCE'],
    ['missing source event', 'memory-tree reference in canonical fact']
  )),
  criterion(4, 'Multiple Representations', 'One RealityObject may bind multiple rooted representations and a bounded quality portfolio.', candidate, ref(
    [`${core}/src/representation-ref.mjs`, `${core}/src/representation-portfolio.mjs`, `${urrf}/src/index.mjs`, `${urrf}/src/portfolio-runtime.mjs`, `${ragf}/src/vfx-reference-provider.mjs`, `${largeWorld}/src/universal-art-asset-golden-set.mjs`],
    [`${core}/schemas/representation-reference.v0.1.schema.json`, `${core}/schemas/representation-portfolio.v0.3.schema.json`, `${core}/schemas/representation-slot.v0.3.schema.json`, `${ragf}/schemas/vfx-asset-contract.v0.1.schema.json`, `${largeWorld}/schemas/universal-art-asset-golden-set.v0.1.schema.json`, `${largeWorld}/schemas/universal-art-asset-golden-set-evidence.v0.1.schema.json`],
    [`${core}/tests/representation-portfolio.mjs`, `${urrf}/tests/portfolio-runtime.test.mjs`, `${urrf}/tests/runtime.test.mjs`, `${ragf}/tests/vfx-reference-provider.test.mjs`, `${largeWorld}/tests/universal-art-asset-golden-set.test.mjs`],
    [`${evidence}/URRF_V03_VISUAL_PORTFOLIO_PHASE6_EVIDENCE.md`, `${evidence}/URRF_UNIVERSAL_ART_ASSET_FORGE/universal-art-asset-golden-set-evidence.json`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'PERFORMANCE', 'EVIDENCE'],
    ['missing required slot', 'duplicate representation root', 'provider-owned canonical state']
  )),
  criterion(5, 'Representation Flow Time', 'Representation flow time is distinct from historical WorldTime and is bounded by interpolation, prediction and error budgets.', candidate, ref(
    [`${core}/src/representation-flow.mjs`, `${urrf}/src/index.mjs`],
    [`${core}/schemas/representation-flow.v0.3.schema.json`, `${core}/schemas/representation-flow-sample.v0.3.schema.json`],
    [`${core}/tests/representation-flow.mjs`, `${urrf}/tests/flow-time.test.mjs`],
    [`${evidence}/URRF_REPRESENTATION_FLOW_TIME/representation-flow-time-report.json`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['unregistered flow', 'stale sample', 'prediction error over budget']
  )),
  criterion(6, 'Independent Detail Axes', 'Visual, physical, causal, semantic, behavioral, audio, temporal, cognitive and flow detail axes can be lowered independently.', candidate, ref(
    [`${core}/src/reality-access.mjs`, `${urrf}/src/index.mjs`],
    [`${core}/schemas/reality-horizon.v0.3.schema.json`, `${core}/schemas/reality-interest-graph.v0.3.schema.json`],
    [`${core}/tests/reality-access.mjs`, `${urrf}/tests/access-query-runtime.test.mjs`],
    [`${evidence}/URRF_V03_REALITY_ACCESS_PHASE2_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'PERFORMANCE', 'EVIDENCE'],
    ['axis root tampering', 'invalid detail vector', 'physical detail silently replacing visual detail']
  )),
  criterion(7, 'Causal and Physical Levels', 'Causal and physical levels affect execution demand and interaction behavior while remaining candidate lowering data.', candidate, ref(
    [`${core}/src/causal-physical.mjs`, `${urrf}/src/index.mjs`, `${largeWorld}/src/index.mjs`],
    [`${core}/schemas/causal-physical-profile.v0.3.schema.json`],
    [`${core}/tests/causal-physical.mjs`, `${urrf}/tests/causal-physical.test.mjs`, `${largeWorld}/tests/causal-physical.test.mjs`],
    [`${evidence}/URRF_LARGE_WORLD_CAUSAL_PHYSICAL_DETAIL/README.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'PERFORMANCE', 'EVIDENCE'],
    ['invalid causal/physical level', 'collision demand omitted from lowering']
  )),
  criterion(8, 'Horizon and Interest Cognitive Streaming', 'RealityHorizon and InterestGraph bound cognitive working sets without granting query or provider mutation authority.', candidate, ref(
    [`${core}/src/reality-access.mjs`, `${urrf}/src/index.mjs`],
    [`${core}/schemas/reality-horizon.v0.3.schema.json`, `${core}/schemas/reality-interest-graph.v0.3.schema.json`],
    [`${core}/tests/reality-access.mjs`, `${urrf}/tests/access-query-runtime.test.mjs`],
    [`${evidence}/URRF_V03_REALITY_ACCESS_PHASE2_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['permission filtered object', 'working-set capacity overflow', 'missing required interest node']
  )),
  criterion(9, 'Reality Query', 'Spatial, semantic, state, relation, temporal and permission filters form a rooted candidate query result.', candidate, ref(
    [`${core}/src/reality-access.mjs`, `${urrf}/src/index.mjs`],
    [`${core}/schemas/reality-horizon.v0.3.schema.json`, `${core}/schemas/reality-interest-graph.v0.3.schema.json`],
    [`${core}/tests/reality-access.mjs`, `${urrf}/tests/access-query-runtime.test.mjs`],
    [`${evidence}/URRF_V03_REALITY_ACCESS_PHASE2_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'EVIDENCE'],
    ['private object leakage', 'invalid state operator', 'temporal range mismatch']
  )),
  criterion(10, 'Snapshot and Delta', 'RealityChunk and replication paths carry rooted snapshots, deltas, receipts and deterministic conflict inputs.', candidate, ref(
    [`${core}/src/reality-chunk.mjs`, `${core}/src/reality-distribution.mjs`, `${largeWorld}/src/index.mjs`, `${largeWorld}/src/multi-process-replication.mjs`],
    [`${core}/schemas/reality-chunk.v0.3.schema.json`, `${core}/schemas/reality-chunk-delta.v0.3.schema.json`, `${core}/schemas/reality-replication-envelope.v0.3.schema.json`],
    [`${core}/tests/reality-chunk.mjs`, `${core}/tests/reality-distribution.mjs`, `${largeWorld}/tests/reality-chunk.test.mjs`, `${largeWorld}/tests/reality-chunk-fabric.test.mjs`, `${largeWorld}/tests/multi-process-replication.test.mjs`],
    [`${evidence}/URRF_LARGE_WORLD_REALITY_CHUNK/README.md`, `${evidence}/URRF_V03_CONSISTENCY_LEASE_PHASE3_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['duplicate delta', 'base snapshot mismatch', 'tampered payload root'],
    ['cross-host process/network partition replay is not yet evidenced']
  ), {boundary: 'Local runtime objects and independent child-process replay; not production network replication.'}),
  criterion(11, 'Consistency Lease and Fencing', 'Two runtime nodes reject stale epoch, expired lease and stale fencing writes before canonical mutation.', partial, ref(
    [`${core}/src/reality-distribution.mjs`, `${core}/src/reality-chunk.mjs`, `${largeWorld}/src/index.mjs`, `${largeWorld}/src/multi-process-replication.mjs`],
    [`${core}/schemas/reality-consistency-profile.v0.3.schema.json`, `${core}/schemas/authority-lease.v0.3.schema.json`, `${core}/schemas/reality-replication-envelope.v0.3.schema.json`],
    [`${core}/tests/reality-distribution.mjs`, `${largeWorld}/tests/reality-chunk-fabric.test.mjs`, `${largeWorld}/tests/server-sovereignty.test.mjs`, `${largeWorld}/tests/multi-process-replication.test.mjs`],
    [`${evidence}/URRF_V03_CONSISTENCY_LEASE_PHASE3_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['stale epoch', 'stale fencing token', 'expired lease', 'revoked lease'],
    ['network partition and production consensus proof']
  ), {boundary: 'Independent local child processes are tested; distributed consensus and cross-host networking are not claimed.'}),
  criterion(12, 'Migration and Failover', 'Server pseudo-sovereignty can transfer a durable bundle and fence the source candidate on failover.', partial, ref(
    [`${core}/src/server-sovereignty.mjs`, `${largeWorld}/src/index.mjs`, `${largeWorld}/src/multi-process-replication.mjs`],
    [`${core}/schemas/server-pseudo-sovereignty.v0.3.schema.json`, `${core}/schemas/server-sovereignty-migration.v0.3.schema.json`],
    [`${core}/tests/server-sovereignty.mjs`, `${largeWorld}/tests/server-sovereignty.test.mjs`, `${largeWorld}/tests/multi-process-replication.test.mjs`],
    [`${evidence}/URRF_V03_SERVER_SOVEREIGNTY/README.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['source lease not revoked', 'target bundle root mismatch', 'stale writer after failover'],
    ['cross-host persistent store and production failover drill']
  ), {boundary: 'Local durable-bundle candidate across independent child processes, not an HA consensus cluster.'}),
  criterion(13, 'Fiber QoS', 'Fiber transport profile expresses bandwidth, latency, reliability, freshness, loss mode and authority requirements.', partial, ref(
    [`${core}/src/reality-transport.mjs`, `${urrf}/src/transport-runtime.mjs`],
    [`${core}/schemas/reality-transport-profile.v0.3.schema.json`],
    [`${core}/tests/reality-transport.mjs`, `${urrf}/tests/transport-runtime.test.mjs`],
    [`${evidence}/URRF_V03_TRANSPORT_PHASE4_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'EVIDENCE'],
    ['payload root mismatch', 'sequence regression', 'authority receipt missing'],
    ['physical Fiber link and production QoS telemetry']
  ), {boundary: 'Profile and deterministic runtime only; no physical link execution.'}),
  criterion(14, 'WiFi Discovery and Roaming', 'WiFi-style discovery, association, roaming and fallback remain explicit candidate transport decisions.', partial, ref(
    [`${core}/src/reality-transport.mjs`, `${urrf}/src/transport-runtime.mjs`],
    [`${core}/schemas/reality-transport-profile.v0.3.schema.json`],
    [`${core}/tests/reality-transport.mjs`, `${urrf}/tests/transport-runtime.test.mjs`],
    [`${evidence}/URRF_V03_TRANSPORT_PHASE4_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['unknown node', 'coverage loss', 'roaming target unavailable'],
    ['real radio discovery, roaming and packet-loss measurements']
  ), {boundary: 'WiFi-like contract, not radio operation.'}),
  criterion(15, 'Bluetooth Organ Link', 'Bluetooth-style low-power pairing binds device identity and capability scope without granting canonical write authority.', partial, ref(
    [`${core}/src/reality-transport.mjs`, `${urrf}/src/transport-runtime.mjs`],
    [`${core}/schemas/reality-transport-profile.v0.3.schema.json`],
    [`${core}/tests/reality-transport.mjs`, `${urrf}/tests/transport-runtime.test.mjs`],
    [`${evidence}/URRF_V03_TRANSPORT_PHASE4_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['pairing scope escalation', 'device identity mismatch', 'state sequence regression'],
    ['real Bluetooth pairing and device compatibility evidence']
  ), {boundary: 'Bluetooth-like Organ Link candidate, not physical pairing.'}),
  criterion(16, 'Power Load Shedding', 'Power profiles and load-shedding plans protect authority, control and minimum reality before reducing soft representations.', candidate, ref(
    [`${core}/src/reality-power.mjs`, `${urrf}/src/resource-governor-runtime.mjs`, `${largeWorld}/src/index.mjs`],
    [`${core}/schemas/reality-power-profile.v0.3.schema.json`, `${core}/schemas/reality-resource-budget.v0.3.schema.json`],
    [`${core}/tests/reality-power.mjs`, `${urrf}/tests/resource-governor-runtime.test.mjs`, `${largeWorld}/tests/reality-fault-recovery.test.mjs`],
    [`${evidence}/URRF_V03_POWER_GOVERNOR_PHASE5_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['battery critical', 'thermal pressure', 'power loss', 'minimum reality omitted']
  )),
  criterion(17, 'Resource Governor', 'CPU/GPU/NPU/VRAM/RAM/storage/network/energy and simulation budgets admit or lower candidate work deterministically.', candidate, ref(
    [`${core}/src/reality-power.mjs`, `${urrf}/src/resource-governor-runtime.mjs`],
    [`${core}/schemas/reality-resource-budget.v0.3.schema.json`],
    [`${core}/tests/reality-power.mjs`, `${urrf}/tests/resource-governor-runtime.test.mjs`],
    [`${evidence}/URRF_V03_POWER_GOVERNOR_PHASE5_EVIDENCE.md`, `${evidence}/URRF_LARGE_WORLD_WORKING_SET_BUDGET/README.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'PERFORMANCE', 'EVIDENCE'],
    ['resource deficit', 'negative available budget', 'soft work displacing authority work']
  )),
  criterion(18, 'Faults Preserve Minimum Reality', 'Provider, network, GPU-memory, battery, thermal and power faults preserve a rooted minimum-reality recovery chain.', candidate, ref(
    [`${core}/src/reality-power.mjs`, `${largeWorld}/src/index.mjs`],
    [`${core}/schemas/reality-power-profile.v0.3.schema.json`, `${core}/schemas/reality-resource-budget.v0.3.schema.json`],
    [`${core}/tests/reality-power.mjs`, `${largeWorld}/tests/reality-fault-recovery.test.mjs`],
    [`${evidence}/URRF_V03_POWER_GOVERNOR_PHASE5_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['provider crash', 'GPU memory pressure', 'battery at survival level', 'thermal fault'],
    ['physical power/thermal sensor and OS enforcement']
  )),
  criterion(19, 'Evidence and Rollback', 'Roots, receipts, candidate ledgers and rollback/fencing records make candidate transitions auditable and reversible.', candidate, ref(
    [`${core}/src/reality-distribution.mjs`, `${core}/src/reality-chunk.mjs`, `${largeWorld}/src/multi-process-replication.mjs`, `${ragf}/src/asset-evidence-ledger.mjs`, `${ragf}/src/trellis2-local-provider.mjs`, `${largeWorld}/src/universal-art-asset-golden-set.mjs`],
    [`${core}/schemas/evidence-graph.v0.1.schema.json`, `${core}/schemas/reality-replication-envelope.v0.3.schema.json`, `${largeWorld}/schemas/multi-process-replication-evidence.v0.1.schema.json`, `${ragf}/schemas/asset-evidence-ledger.v0.1.schema.json`, `${largeWorld}/schemas/universal-art-asset-golden-set.v0.1.schema.json`, `${largeWorld}/schemas/universal-art-asset-golden-set-evidence.v0.1.schema.json`],
    [`${core}/tests/reality-distribution.mjs`, `${largeWorld}/tests/reality-fault-recovery.test.mjs`, `${largeWorld}/tests/multi-process-replication.test.mjs`, `${ragf}/tests/external-asset-providers.test.mjs`, `${largeWorld}/tests/universal-art-asset-golden-set.test.mjs`],
    [`${evidence}/URRF_V03_CONSISTENCY_LEASE_PHASE3_EVIDENCE.md`, `${evidence}/URRF_UNIVERSAL_ART_ASSET_FORGE/RCL_GAP_STRESS_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['tampered root', 'stale receipt', 'rollback without authority', 'provider failure without evidence']
  )),
  criterion(20, 'Property and Law Query Versioning', 'PropertySet and LawBindings expose rooted, versioned quantity and law queries for URRF lowering.', candidate, ref(
    [`${core}/src/reality-property.mjs`, `${urrf}/src/index.mjs`],
    [`${core}/schemas/reality-quantity.v0.3.schema.json`, `${core}/schemas/reality-property-set.v0.3.schema.json`, `${core}/schemas/reality-law-bindings.v0.3.schema.json`],
    [`${core}/tests/reality-property.mjs`, `${urrf}/tests/property-law-runtime.test.mjs`],
    [`${evidence}/URRF_V03_PROPERTY_LAW_PHASE1_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'EVIDENCE'],
    ['unknown property', 'unknown law', 'property root mismatch']
  )),
  criterion(21, 'Dimensional Rejection', 'RealityQuantity rejects invalid units, dimensions and illegal arithmetic rather than silently coercing values.', candidate, ref(
    [`${core}/src/reality-property.mjs`],
    [`${core}/schemas/reality-quantity.v0.3.schema.json`],
    [`${core}/tests/reality-property.mjs`],
    [`${evidence}/URRF_V03_PROPERTY_LAW_PHASE1_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['length plus mass', 'unit/dimension mismatch', 'non-finite quantity']
  )),
  criterion(22, 'Same Property at Two Physics Levels', 'A property remains one RNCS-owned semantic while causal and physical profiles change the execution level.', candidate, ref(
    [`${core}/src/reality-property.mjs`, `${core}/src/causal-physical.mjs`, `${urrf}/src/index.mjs`],
    [`${core}/schemas/reality-property-set.v0.3.schema.json`, `${core}/schemas/causal-physical-profile.v0.3.schema.json`],
    [`${core}/tests/reality-property.mjs`, `${core}/tests/causal-physical.mjs`, `${urrf}/tests/property-law-runtime.test.mjs`, `${urrf}/tests/causal-physical.test.mjs`],
    [`${evidence}/URRF_V03_PROPERTY_LAW_PHASE1_EVIDENCE.md`, `${evidence}/URRF_LARGE_WORLD_CAUSAL_PHYSICAL_DETAIL/README.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'EVIDENCE'],
    ['physics level changes canonical property root', 'provider invents second property owner']
  )),
  criterion(23, 'Provider Cannot Rewrite Canonical Property', 'Provider materialization and prediction can emit candidates but cannot mutate RNCS canonical property or law roots.', candidate, ref(
    [`${urrf}/src/index.mjs`, `${core}/src/reality-property.mjs`],
    [`${core}/schemas/reality-property-transition.v0.3.schema.json`, `${core}/schemas/reality-property-set.v0.3.schema.json`, `${core}/schemas/reality-law-bindings.v0.3.schema.json`],
    [`${urrf}/tests/property-law-runtime.test.mjs`],
    [`${evidence}/URRF_V03_PROPERTY_LAW_PHASE1_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['provider property mutation attempt', 'canonical state root changed during materialization']
  )),
  criterion(24, 'Sensor Inference Candidate Gate', 'Sensor or inference-derived properties remain candidates until an explicit RNCS acceptance gate promotes them.', candidate, ref(
    [`${core}/src/reality-sensor-inference.mjs`, `${core}/src/reality-property.mjs`, `${core}/src/reality-distribution.mjs`, `${urrf}/src/index.mjs`],
    [`${core}/schemas/reality-sensor-inference-candidate.v0.3.schema.json`, `${core}/schemas/reality-sensor-inference-acceptance.v0.3.schema.json`, `${core}/schemas/reality-property-set.v0.3.schema.json`, `${core}/schemas/authority-lease.v0.3.schema.json`],
    [`${core}/tests/sensor-inference.test.mjs`, 'packages/kernel/rncs-core-contract/tests/urrf-v03-coverage-matrix.test.mjs'],
    [`${evidence}/URRF_V03_SENSOR_INFERENCE_EVIDENCE.md`, `${evidence}/URRF_UNIVERSAL_ART_ASSET_FORGE/RCL_GAP_STRESS_EVIDENCE.md`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'EVIDENCE'],
    ['unverified sensor inference promotion', 'provider inference directly mutates canonical property'],
    ['externally authenticated authority signature/replay and physical sensor calibration']
  ), {
    gap: {
      gap_type: 'URRF_GAP',
      id: 'URRF_GAP_SENSOR_INFERENCE_ACCEPTANCE',
      status: 'CANDIDATE_LOCAL_VERIFIED',
      owner: 'RNCS/RCL boundary',
      resolution: 'Calibrated observation, candidate inference, lease-bound RNCS acceptance and explicit canonical promotion are locally verified.'
    },
    boundary: 'Local calibrated candidate, lease-bound synthetic RNCS acceptance and explicit promotion are verified; external authority signatures, physical sensor replay and production sensor hardware are not claimed.'
  }),
  criterion(25, 'RCL Gap versus Provider Gap', 'The coverage ledger distinguishes missing RCL semantic primitives from unavailable or unaudited provider/runtime capability.', partial, ref(
    [`${core}/src/reality-property.mjs`, `${core}/src/reality-transport.mjs`, `${core}/src/urrf-gap-integration-court.mjs`, `${largeWorld}/src/multi-process-replication.mjs`, `${ragf}/src/external-asset-providers.mjs`, `${ragf}/src/trellis2-local-provider.mjs`, `${largeWorld}/src/universal-art-asset-golden-set.mjs`],
    [`${core}/schemas/reality-transport-profile.v0.3.schema.json`, `${core}/schemas/urrf-gap-ledger.v0.1.schema.json`, `${core}/schemas/urrf-integration-court-verdict.v0.1.schema.json`, `${largeWorld}/schemas/universal-art-asset-golden-set.v0.1.schema.json`, `${largeWorld}/schemas/universal-art-asset-golden-set-evidence.v0.1.schema.json`],
    ['packages/kernel/rncs-core-contract/tests/urrf-v03-coverage-matrix.test.mjs', `${core}/tests/urrf-gap-integration-court.test.mjs`, `${largeWorld}/tests/multi-process-replication.test.mjs`, `${ragf}/tests/external-asset-providers.test.mjs`, `${largeWorld}/tests/universal-art-asset-golden-set.test.mjs`, 'tests/large-world-universal-art-asset-forge.integration.test.mjs'],
    [`${evidence}/URRF_UNIVERSAL_ART_ASSET_FORGE/RCL_GAP_STRESS_EVIDENCE.md`, `${evidence}/URRF_V03_TRANSPORT_PHASE4_EVIDENCE.md`, `${evidence}/URRF_UNIVERSAL_ART_ASSET_FORGE/urrf-gap-ledger.json`, `${evidence}/URRF_UNIVERSAL_ART_ASSET_FORGE/urrf-integration-court-verdict.json`, `${evidence}/URRF_UNIVERSAL_ART_ASSET_FORGE/universal-art-asset-golden-set-evidence.json`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EVIDENCE'],
    ['silent language bypass', 'provider output treated as authority', 'missing RCL primitive mislabeled as runtime outage'],
    ['automated donor search across external projects and independently authorized or human Integration Court promotion']
  ), {
    gap: {
      gap_type: 'MIXED',
      status: 'PARTIAL',
      policy: 'No silent RCL bypass; provider/runtime gaps remain auxiliary.'
    }
  }),
  criterion(26, 'Honest Status and AAA Boundary', 'Every result reports bounded status and keeps AAA production blocked until external model, hardware, provenance and human evidence exist.', candidate, ref(
    [`${ragf}/src/trellis2-local-provider.mjs`, `${ragf}/src/vfx-reference-provider.mjs`, `${ragf}/src/production-court.mjs`, `${ragf}/src/asset-evidence-ledger.mjs`, `${largeWorld}/src/universal-art-asset-forge.mjs`, `${largeWorld}/src/universal-art-asset-golden-set.mjs`, `${largeWorld}/src/multi-process-replication.mjs`],
    [`${ragf}/schemas/asset-provider-manifest.v0.1.schema.json`, `${ragf}/schemas/asset-provider-result.v0.1.schema.json`, `${ragf}/schemas/vfx-asset-contract.v0.1.schema.json`, `${ragf}/schemas/asset-production-court.v0.1.schema.json`, `${largeWorld}/schemas/multi-process-replication-evidence.v0.1.schema.json`, `${largeWorld}/schemas/universal-art-asset-golden-set.v0.1.schema.json`, `${largeWorld}/schemas/universal-art-asset-golden-set-evidence.v0.1.schema.json`],
    [`${ragf}/tests/external-asset-providers.test.mjs`, `${ragf}/tests/vfx-reference-provider.test.mjs`, `${ragf}/tests/runtime.test.mjs`, `${largeWorld}/tests/universal-art-asset-forge.test.mjs`, `${largeWorld}/tests/universal-art-asset-golden-set.test.mjs`, `${largeWorld}/tests/multi-process-replication.test.mjs`],
    [`${evidence}/URRF_UNIVERSAL_ART_ASSET_FORGE/RCL_GAP_STRESS_EVIDENCE.md`, `${evidence}/URRF_V03_POWER_GOVERNOR_PHASE5_EVIDENCE.md`, `${evidence}/URRF_UNIVERSAL_ART_ASSET_FORGE/universal-art-asset-golden-set-evidence.json`],
    ['EXPRESS', 'COMPILE', 'LOWER', 'EXECUTE', 'CORRECT', 'ROBUST', 'PERFORMANCE', 'AI_GENERATE', 'EVIDENCE'],
    ['contract-only provider reported as executed', 'candidate reported as AAA', 'missing hardware evidence reported as pass']
  ), {
    boundary: 'Current host has no CUDA/NVIDIA GPU, TRELLIS.2 weights or real Provider; AI_GENERATE and production AAA remain blocked.'
  })
]);

const gateStatus = (gate, status, refs, remaining = []) => ({gate, status, ...refs, remaining});

export const URRF_V03_K400_GATE_STATUS = Object.freeze([
  gateStatus('EXPRESS', candidate, {
    source_refs: [`${core}/src/world-truth.mjs`, `${core}/src/reality-property.mjs`, `${core}/src/reality-transport.mjs`],
    test_refs: [`${core}/tests/world-truth.mjs`, `${core}/tests/reality-property.mjs`, `${core}/tests/reality-transport.mjs`]
  }),
  gateStatus('COMPILE', candidate, {
    source_refs: [`${core}/src/index.mjs`, `${urrf}/src/index.mjs`, `${ragf}/src/index.mjs`, `${largeWorld}/src/multi-process-replication.mjs`],
    test_refs: [`${core}/tests/v03-schemas.mjs`, `${ragf}/tests/external-asset-providers.test.mjs`, `${largeWorld}/tests/multi-process-replication.test.mjs`]
  }),
  gateStatus('LOWER', candidate, {
    source_refs: [`${urrf}/src/index.mjs`, `${largeWorld}/src/index.mjs`, `${largeWorld}/src/multi-process-replication.mjs`, `${ragf}/src/trellis2-local-provider.mjs`],
    test_refs: [`${urrf}/tests/runtime.test.mjs`, `${largeWorld}/tests/runtime.test.mjs`, `${largeWorld}/tests/multi-process-replication.test.mjs`]
  }),
  gateStatus('EXECUTE', partial, {
    source_refs: [`${urrf}/src/transport-runtime.mjs`, `${urrf}/src/resource-governor-runtime.mjs`, `${largeWorld}/src/multi-process-replication.mjs`, `${ragf}/src/trellis2-local-provider.mjs`],
    test_refs: [`${urrf}/tests/transport-runtime.test.mjs`, `${largeWorld}/tests/multi-process-replication.test.mjs`, `${ragf}/tests/external-asset-providers.test.mjs`]
  }, ['real multi-host/network and hardware execution']),
  gateStatus('CORRECT', candidate, {
    source_refs: [`${core}/src/reality-property.mjs`, `${core}/src/reality-distribution.mjs`, `${ragf}/src/production-court.mjs`],
    test_refs: [`${core}/tests/reality-property.mjs`, `${core}/tests/reality-distribution.mjs`, `${ragf}/tests/external-asset-providers.test.mjs`]
  }),
  gateStatus('ROBUST', partial, {
    source_refs: [`${core}/src/reality-power.mjs`, `${core}/src/server-sovereignty.mjs`, `${largeWorld}/src/index.mjs`, `${largeWorld}/src/multi-process-replication.mjs`],
    test_refs: [`${largeWorld}/tests/reality-fault-recovery.test.mjs`, `${largeWorld}/tests/server-sovereignty.test.mjs`, `${largeWorld}/tests/multi-process-replication.test.mjs`]
  }, ['network partition, multi-host restart and hardware fault drills']),
  gateStatus('PERFORMANCE', partial, {
    source_refs: [`${urrf}/src/resource-governor-runtime.mjs`, `${largeWorld}/src/index.mjs`],
    test_refs: [`${urrf}/tests/resource-governor-runtime.test.mjs`, `${largeWorld}/tests/runtime.test.mjs`]
  }, ['target-device performance budget and GPU/VRAM measurements']),
  gateStatus('AI_GENERATE', blocked, {
    source_refs: [`${ragf}/src/external-asset-providers.mjs`, `${ragf}/src/trellis2-local-provider.mjs`],
    test_refs: [`${ragf}/tests/external-asset-providers.test.mjs`]
  }, ['TRELLIS.2 weights', 'CUDA/NVIDIA GPU', 'real Provider execution', 'AAA art and human acceptance']),
  gateStatus('EVIDENCE', candidate, {
    source_refs: [`${ragf}/src/asset-evidence-ledger.mjs`, `${core}/src/reality-chunk.mjs`, `${core}/src/urrf-gap-integration-court.mjs`, `${largeWorld}/src/multi-process-replication.mjs`, `${largeWorld}/src/universal-art-asset-golden-set.mjs`, `${core}/src/urrf-v03-coverage.mjs`],
    test_refs: ['packages/kernel/rncs-core-contract/tests/urrf-v03-coverage-matrix.test.mjs', `${core}/tests/urrf-gap-integration-court.test.mjs`, `${ragf}/tests/external-asset-providers.test.mjs`, `${largeWorld}/tests/multi-process-replication.test.mjs`, `${largeWorld}/tests/universal-art-asset-golden-set.test.mjs`, 'tests/large-world-universal-art-asset-forge.integration.test.mjs']
  })
]);

const rooted = (value, field) => ({...value, [field]: rootHash(without(value, field))});

export function createURRFV03CoverageMatrix({observed_on = '2026-09-05', repository = 'RNCS-Unified-Platform-'} = {}) {
  const criteria = URRF_V03_SUCCESS_CRITERIA.map(item => structuredClone(item));
  const gates = URRF_V03_K400_GATE_STATUS.map(item => structuredClone(item));
  return rooted({
    format: URRF_V03_COVERAGE_FORMAT,
    version: URRF_V03_COVERAGE_VERSION,
    repository,
    observed_on,
    authority: {
      canonical_owner: 'RNCS',
      rcl_semantic_owner: 'RCL',
      representation_owner: 'URRF',
      provider_can_emit_candidate: true,
      provider_can_write_authoritative_world_state: false
    },
    status_vocabulary: [...URRF_V03_COVERAGE_STATUSES],
    k400_gates: [...URRF_K400_GATES],
    criteria,
    gate_status: gates,
    summary: {
      criterion_count: criteria.length,
      criterion_status_counts: Object.fromEntries(URRF_V03_COVERAGE_STATUSES.map(status => [status, criteria.filter(item => item.status === status).length])),
      k400_gate_status_counts: Object.fromEntries(URRF_V03_COVERAGE_STATUSES.map(status => [status, gates.filter(item => item.status === status).length])),
      aaa_release_status: 'BLOCKED_EXTERNAL_ART_HUMAN_HARDWARE_EVIDENCE',
      ai_generate_status: 'BLOCKED_NOT_RUN'
    },
    coverage_root: ''
  }, 'coverage_root');
}

export function verifyURRFV03CoverageMatrix(matrix) {
  const errors = [];
  if (matrix?.format !== URRF_V03_COVERAGE_FORMAT) errors.push('FORMAT_INVALID');
  if (matrix?.version !== URRF_V03_COVERAGE_VERSION) errors.push('VERSION_INVALID');
  if (!Array.isArray(matrix?.criteria) || matrix.criteria.length !== 26) errors.push('CRITERIA_COUNT_INVALID');
  const criterionIds = (matrix?.criteria ?? []).map(item => item?.criterion_id);
  if (new Set(criterionIds).size !== criterionIds.length || criterionIds.some((id, index) => id !== `URRF-${String(index + 1).padStart(2, '0')}`)) errors.push('CRITERIA_ID_ORDER_INVALID');
  if (!Array.isArray(matrix?.gate_status) || matrix.gate_status.length !== URRF_K400_GATES.length) errors.push('K400_GATE_COUNT_INVALID');
  const gateIds = (matrix?.gate_status ?? []).map(item => item?.gate);
  if (JSON.stringify(gateIds) !== JSON.stringify([...URRF_K400_GATES])) errors.push('K400_GATE_ORDER_INVALID');
  if (matrix?.authority?.canonical_owner !== 'RNCS' || matrix?.authority?.rcl_semantic_owner !== 'RCL' || matrix?.authority?.representation_owner !== 'URRF') errors.push('AUTHORITY_OWNERSHIP_INVALID');
  for (const item of matrix?.criteria ?? []) {
    if (!URRF_V03_COVERAGE_STATUSES.includes(item.status)) errors.push(`STATUS_INVALID:${item.criterion_id}`);
    for (const field of ['source_refs', 'schema_refs', 'test_refs', 'evidence_refs', 'k400_gates', 'negative_cases']) {
      if (!Array.isArray(item[field]) || item[field].length === 0) errors.push(`REFERENCES_MISSING:${item.criterion_id}:${field}`);
    }
  }
  for (const item of matrix?.gate_status ?? []) {
    if (!URRF_V03_COVERAGE_STATUSES.includes(item.status)) errors.push(`GATE_STATUS_INVALID:${item.gate}`);
    for (const field of ['source_refs', 'test_refs']) if (!Array.isArray(item[field]) || item[field].length === 0) errors.push(`GATE_REFERENCES_MISSING:${item.gate}:${field}`);
  }
  try {
    if (rootHash(without(matrix, 'coverage_root')) !== matrix.coverage_root) errors.push('COVERAGE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`ROOT_VERIFY_EXCEPTION:${error.code ?? error.message}`);
  }
  return {valid: errors.length === 0, errors, coverage_root: matrix?.coverage_root ?? null};
}
