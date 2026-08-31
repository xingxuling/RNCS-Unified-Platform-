# Large World Runtime

`@taowind/large-world-runtime` is the first bounded large-world vertical slice for RNCS. It keeps the world body canonical in RNCS and treats URRF/VSR as representation and projection layers.

The runtime provides deterministic `WorldSeed → Region → Chunk` generation, integer-rooted terrain meshes, a bounded active chunk working set with load/unload hysteresis, URRF candidate materialization, canonical World Time/Event/Fact roots, replayable streaming evidence, and authority-gated Snapshot/Delta replication between isolated runtime instances. Each chunk exposes both a procedural-grid and a wireframe-grid representation candidate; either provider may remain contract-only or execute through an explicit adapter.

This alpha proves a 9×9 region by default and a deterministic two-instance replication loop. It does not claim an MMO-scale distributed world, GPU generation, persistent storage, external Spark execution, or production delivery.

## Replication boundary

```js
const base = target.exportReplicationSnapshot();
const delta = source.createReplicationDelta(base);
const receipt = target.applyReplicationDelta(delta, {
  authorityReceipt: {status: 'committed', receipt_root: '<64-hex-root>', epoch: 0}
});
```

`verifyReplicationSnapshot`, `verifyReplicationDelta`, and `verifyReplicationReceipt` seal the three envelopes. A delta is ordered by its base roots, rejects stale or out-of-order application, and is idempotent after the first application. `materializeActive({providerId: LARGE_WORLD_WIREFRAME_PROVIDER_ID})` selects the alternate representation candidate without changing canonical world state.
