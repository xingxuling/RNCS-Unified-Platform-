# Large World → RSR Terrain Bridge

`@taowind/large-world-rsr-bridge` is the narrow candidate adapter between the existing Large World Runtime and the existing Kernel → RSR spatial runtime.

It reuses:

- Large World `chunk.mesh.positions` as the only terrain sample owner;
- Large World `origin_mm`, `extent_mm`, `chunk_root`, `state_root`, `content_root`, `region_root`, `world_root`, and verified streaming `stream_root`;
- the existing `rncs.entity-state-batch.v0.1` Kernel contract;
- the existing RSR Kernel materializer and bounded fixed-point `heightfield` fixture.

The bridge does not generate terrain, mutate a canonical world, change the active working set, or make a provider authoritative. `createLargeWorldRsrTerrainCandidate()` requires a verified region and a verified stream resolution plus its `rncs.large-world-stream-transition.v0.1` receipt, lowers only selected active chunks, and returns a candidate-only state batch plus source-root bindings. A static RSR terrain body is emitted per chunk; its body position is the chunk origin and its row-major fixed-point height samples are extracted from the existing Large World grid mesh.

The RSR runtime remains the physical owner. The adapter is deliberately not a dependency of Large World Runtime and does not implement collision, ray casts, terrain streaming, or a second terrain generator. RSR now exposes a bounded authored-surface ray, bounded authored-triangle sphere sweep, and bounded upright-capsule-vs-triangle sweep for the lowered fixture; the adapter only reaches those existing runtime paths. The current RSR heightfield implementation is still a bounded single-support/AABB collision candidate, not a complete terrain contact manifold, dynamic terrain path, or production device path.

`planLargeWorldRsrTerrainResidency()` can now preflight the verified candidate against an explicit physical budget for managed bodies, fixtures, and heightfield samples. `applyLargeWorldRsrTerrainCandidate()` accepts the same budget, blocks with no RSR mutation when the candidate is over budget, and binds a `rncs.large-world-rsr-terrain-residency-admission.v0.1` receipt into successful transitions. The source stream's rooted enter/retain/release and budget-eviction decision remains visible in the admission and physical transition; the bridge does not invent a second eviction policy.

`applyLargeWorldRsrTerrainCandidate()` applies the verified batch to an existing RSR world through the generic managed-static-body residency transition. It requires the candidate tick to equal the current RSR tick, removes exited terrain bodies, admits entered terrain bodies, preserves the other runtime bodies, clears invalid contact/support caches, and returns a separately rooted transition receipt. The operation remains candidate-only and does not grant canonical-write authority.

The bridge still does not own stream policy: the caller/Large World runtime supplies each verified stream envelope and remains the terrain/active-set owner. This closes only the local lowering-to-budgeted-residency execution seam; the budget gate is an admission guard, not an automatic stream eviction scheduler. `RCL_GAP_RNCS_LARGE_WORLD_PHYSICAL_TERRAIN_LOWERING` remains open for production-scale residency scheduling, dynamic terrain, complete contact manifolds, device evidence, and canonical promotion.
