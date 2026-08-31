# Large World Runtime

`@taowind/large-world-runtime` is the first bounded large-world vertical slice for RNCS. It keeps the world body canonical in RNCS and treats URRF/VSR as representation and projection layers.

The runtime provides deterministic `WorldSeed → Region → Chunk` generation, integer-rooted terrain meshes, a bounded active chunk working set with load/unload hysteresis, URRF candidate materialization, canonical World Time/Event/Fact roots, replayable streaming evidence, and authority-gated Snapshot/Delta replication between isolated runtime instances. Each chunk exposes both a procedural-grid and a wireframe-grid representation candidate; either provider may remain contract-only or execute through an explicit adapter.

This alpha proves a 9×9 region by default, a deterministic two-instance replication loop, a JSON restart boundary that restores the replication idempotency ledger, a bounded authenticated packet link with loss/retry behavior, and a deterministic same-base multi-writer conflict court. It does not claim an MMO-scale distributed world, production network security, consensus, GPU generation, external Spark execution, or production delivery.

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
