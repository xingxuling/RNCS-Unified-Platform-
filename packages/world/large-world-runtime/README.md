# Large World Runtime

`@taowind/large-world-runtime` is the first bounded large-world vertical slice for RNCS. It keeps the world body canonical in RNCS and treats URRF/VSR as representation and projection layers.

The runtime provides deterministic `WorldSeed → Region → Chunk` generation, integer-rooted terrain meshes, a bounded active chunk working set with load/unload hysteresis, URRF candidate materialization, canonical World Time/Event/Fact roots, replayable streaming evidence, and authority-gated Snapshot/Delta replication between isolated runtime instances. Each chunk exposes both a procedural-grid and a wireframe-grid representation candidate; either provider may remain contract-only or execute through an explicit adapter.

This alpha proves a 9×9 region by default, a deterministic two-instance replication loop, a JSON restart boundary that restores the replication idempotency ledger, a bounded authenticated packet link with loss/retry behavior, a deterministic same-base multi-writer conflict court, an atomic durable-bundle store with crash-point recovery, and an optional RNCS Consistency Profile with Authority Lease/Epoch/Fencing admission. It does not claim an MMO-scale distributed world, production network security, distributed consensus, GPU generation, external Spark execution, or production delivery.

## Replication boundary

```js
const base = target.exportReplicationSnapshot();
const delta = source.createReplicationDelta(base);
const receipt = target.applyReplicationDelta(delta, {
  authorityReceipt: {status: 'committed', receipt_root: '<64-hex-root>', epoch: 0}
});
```

`verifyReplicationSnapshot`, `verifyReplicationDelta`, and `verifyReplicationReceipt` seal the three envelopes. A delta is ordered by its base roots, rejects stale or out-of-order application, and is idempotent after the first application. `materializeActive({providerId: LARGE_WORLD_WIREFRAME_PROVIDER_ID})` selects the alternate representation candidate without changing canonical world state.

`exportDurableBundle()` packages the full replication snapshot and applied-delta receipts for a restart boundary. `restoreDurableBundle(bundle, {authorityReceipt})` only restores a pristine runtime after verifying every root and an explicit committed authority receipt; a restored receipt ledger continues to reject duplicate deltas.

`LargeWorldReplicationLink` wraps a transport with `register`, `send`, and optional `advance` methods. It seals packets with an HMAC tag, carries a monotonic sequence, sends authenticated acknowledgements, retries unacknowledged packets, and leaves base-root ordering to RNCS Delta application. The key is caller-supplied test/runtime configuration; it is not persisted in world state.

`resolveReplicationConflict([{delta, writerId, writerSequence}, ...])` sorts same-base candidates by the explicit `lexicographic-writer-priority` policy (`writer_id`, `writer_sequence`, `delta_root`) and returns a candidate-only decision. `applyReplicationConflict(...)` applies only the winner through the normal RNCS Delta gate, records an authoritative conflict receipt, and persists a loser decision so a rejected candidate cannot be applied directly after restart. This is a deterministic local policy, not a distributed consensus protocol.

## URRF representation portfolios

`getRepresentationPortfolio(chunkId)` lowers the chunk's existing URRF references into one canonical RNCS Representation Portfolio. The large-world runtime currently maps its procedural-grid reference to a `STANDARD` slot and its wireframe-grid reference to a `PROXY` slot, with biome/environment/material/style axes, integer resource costs, and a proxy minimum-reality fallback. `createChunkRepresentationPortfolio(chunk, {representationObject})` exposes the same lowering seam for callers that already hold a chunk and URRF object.

The portfolio is a candidate description for selection and projection. It does not mutate RNCS world truth, grant provider authority, or claim that the CPU-reference PNG is production GPU/WebGPU quality. A missing reference remains visible as an `INCOMPLETE` composition instead of being silently invented.

`selectActiveRepresentationPortfolios({qualityProfile, qualityByChunk, resourceBudget, resourceBudgetByChunk})` applies the URRF selector to the current bounded active working set and returns a rooted `rncs.large-world-portfolio-selection.v0.1` envelope. The envelope binds every row to the latest `stream_root`, preserves per-chunk selection roots, records minimum-reality fallbacks, and remains candidate-only.

For a fenced cross-node delta, configure the source with `consistencyProfile` and an active `authorityLease`, and configure the receiver with the same profile plus `acceptedAuthorityLease`. `createReplicationDelta(base, {targetNode})` carries the profile root, lease root, epoch, fencing token, source/target node and sequence. `applyReplicationDelta(delta, {authorityReceipt})` requires a committed authority receipt whose lease root and fencing token match the current lease; stale, expired, revoked or owner-mismatched leases fail before any world mutation.

`LargeWorldDurableStore({filePath})` writes a verified durable bundle to a same-directory temporary file, syncs the file, and atomically renames it into place. `save(..., {faultAt: 'after-temp-sync' | 'after-rename'})` is a test-only crash injector; `recover()` keeps a valid primary over an unfinished temporary write or promotes a valid temporary bundle when the primary is missing. Storage receipts are candidate-only and do not replace the committed authority required by `restoreDurableBundle`.
