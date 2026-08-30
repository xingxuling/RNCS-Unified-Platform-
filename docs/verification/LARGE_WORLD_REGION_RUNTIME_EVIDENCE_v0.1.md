# Large World Region Runtime Evidence v0.1

Date: 2026-08-31

## Request and document boundary

User request: continue the Universal Reality Representation Fabric route and first make the general reality representation fabric executable enough to support a large 3D world.

The supplied URRF v0.3 document is treated as a candidate architecture and staged validation route. This change implements the first bounded region/chunk slice; it is not a claim that the complete v0.3 distributed second-world runtime already exists.

## Source and target

- Repository: `xingxuling/RNCS-Unified-Platform-`
- Target GitHub branch: `main-95`
- Base source: `origin/main-95` at `a517e5a3e4d9b9b036acfce9540ed3cb9443bf7c`
- Candidate branch: `codex/large-world-region-v01`
- Canonical owner: RNCS
- Representation owner: URRF
- Presentation provider: VSR

## Executed route

```text
WorldSeed
  -> deterministic 9x9 Region (81 Chunk bodies)
  -> integer-rooted terrain grid / structures / resources
  -> bounded active working set with load/unload hysteresis
  -> URRF mesh representation references and materialization receipts
  -> VSR spatial scene and CPU reference render
  -> snapshot/replay root comparison
```

The world body remains canonical RNCS data. URRF only selects/materializes candidate representations, and VSR only projects the active working set.

## Verification commands and results

Command:

```text
npm run test:large-world
```

Result: `PASS` (exit code `0`).

Evidence observed in the run:

- Large World Runtime package: `9/9 PASS`.
- Deterministic same-seed chunk/region roots and different-seed divergence: pass.
- Default region: `81` unique chunks with verified chunk roots: pass.
- Neighboring chunk terrain edge continuity: pass.
- Bounded streaming working set and hysteresis: pass.
- Forced/unknown chunk requests are explicit: pass.
- URRF active-chunk materialization with `canonical_state_mutated=false`: pass.
- Contract-only provider without an adapter remains `NOT_EXECUTED`: pass.
- Snapshot and replay stream roots: pass.
- VSR build: pass.
- Root RNCS → URRF → VSR integration: `1/1 PASS`.
- VSR CPU reference render is deterministic across repeated renders: pass.

Regression commands:

```text
npm run test:urrf-runtime
npm run test:urrf-v03
```

Both commands passed after materializing the sparse-checkout test entrypoints. Existing URRF runtime, RNCS representation/world-truth, and VSR-backed integration behavior remained green.

## What is proven

`LARGE_WORLD_REGION_RUNTIME_PASS`:

- A seed and integer chunk coordinates deterministically produce a sealed terrain mesh descriptor, biome, structures, resources, state root, content root, and chunk root.
- A default 9×9 region can be generated and verified without loading all chunks into the active presentation working set.
- Active chunks are bounded by count and estimated memory budget, with explicit enter/exit/eviction diagnostics.
- The active chunk set can be represented through the generic URRF provider contract and materialized through an injected candidate adapter without granting provider authority over canonical world state.
- The active set can be lowered into a VSR spatial scene and rendered by the repository's CPU reference renderer; frame and pixel roots are stable on repeat.
- A stream trace can be replayed on a fresh runtime and compared by sealed stream roots.

## Explicit non-claims and open gates

`CANDIDATE_ONLY` / `NOT_PROVEN`:

- This is a bounded 9×9 region vertical slice, not an infinite or MMO-scale world.
- No GPU terrain generation, WebGPU hardware result, distributed shard, replication, authority lease/fencing, persistent event/fact tree, canonical world time, cross-node transport, power governor, or production deployment was exercised here.
- The procedural adapter returns a sealed candidate output root; it does not create an external Spark runtime receipt. Spark remains contract-only unless its separately supplied runtime is installed and executed.
- VSR rendering is CPU reference evidence. It is not a GPU performance or device-compatibility claim.
- `RealityChunk` v0.3 fields such as delta replication, consistency profiles, leases, and transport/power profiles remain follow-up work; this slice records the chunk identity/state/content and bounded residency foundation only.
- No canonical world commit, authority promotion, push-to-release, or hosted CI success is implied by local tests.

## RCL and K400 boundary

- RCL/RNCS owns world identity, deterministic chunk state, roots, and authority boundary.
- URRF owns representation reference selection, residency/detail policies, and candidate materialization receipts.
- VSR owns visual projection and CPU/GPU lowering.
- No silent RCL bypass was introduced. Professional runtime implementation remains an auxiliary/provider boundary.
- K400 mapping: `UNMAPPED_PENDING_CANONICAL_MATRIX`; this evidence does not declare any K400 gate PASS.

## Next executable gate

Add canonical World Time/Event/Fact roots to the region runtime, then exercise a second representation provider and snapshot/delta replication across two isolated runtime instances before widening the region scale.
