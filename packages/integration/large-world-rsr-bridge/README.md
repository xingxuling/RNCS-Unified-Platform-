# Large World → RSR Terrain Bridge

`@taowind/large-world-rsr-bridge` is the narrow candidate adapter between the existing Large World Runtime and the existing Kernel → RSR spatial runtime.

It reuses:

- Large World `chunk.mesh.positions` as the only terrain sample owner;
- Large World `origin_mm`, `extent_mm`, `chunk_root`, `state_root`, `content_root`, `region_root`, `world_root`, and verified streaming `stream_root`;
- the existing `rncs.entity-state-batch.v0.1` Kernel contract;
- the existing RSR Kernel materializer and bounded fixed-point `heightfield` fixture.

The bridge does not generate terrain, mutate a canonical world, change the active working set, or make a provider authoritative. `createLargeWorldRsrTerrainCandidate()` requires a verified region and a verified stream resolution, lowers only selected active chunks, and returns a candidate-only state batch plus source-root bindings. A static RSR terrain body is emitted per chunk; its body position is the chunk origin and its row-major fixed-point height samples are extracted from the existing Large World grid mesh.

The RSR runtime remains the physical owner. The adapter is deliberately not a dependency of Large World Runtime and does not implement collision, ray casts, terrain streaming, or a second terrain generator. The current RSR heightfield implementation is a bounded single-support/AABB candidate, not a complete terrain contact manifold or production device path.

This package closes only the explicit lowering seam. It does not close `RCL_GAP_RNCS_LARGE_WORLD_PHYSICAL_TERRAIN_LOWERING` as a production capability, and its output remains `candidate_only=true`, `authoritative=false`, `canonical_write_authorized=false`, and `commit_status=NOT_COMMITTED`.

The current candidate does not yet own stream enter/exit reconciliation for RSR terrain bodies. A caller must supply the verified stream envelope for each lowering run and remains responsible for any explicit candidate-world lifecycle around the resulting body set.
