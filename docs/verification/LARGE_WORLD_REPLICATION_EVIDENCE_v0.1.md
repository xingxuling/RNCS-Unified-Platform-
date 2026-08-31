# Large World Replication and Alternate Representation Evidence v0.1

## Scope

This ledger records the next bounded vertical slice after the region, streaming, URRF, VSR, and WorldTruth runtime gates. The implementation remains candidate-only until an explicit committed authority receipt is supplied to the target runtime.

## Implemented path

1. Two isolated `LargeWorldRuntime` instances begin from the same deterministic region and replication snapshot.
2. The source advances canonical WorldTime and appends authority-gated WorldEvents and Facts.
3. `createReplicationDelta` emits only events, facts, stream trace entries, and target roots after the verified base prefix.
4. `applyReplicationDelta` checks world/region roots, base snapshot/event/time/fact/trace roots, ordered replay, target roots, and working-set bounds before mutating the target.
5. A second application of the same delta returns an explicit `DUPLICATE` receipt; an out-of-order delta is rejected by the base snapshot root gate.
6. The same Chunk registers procedural-grid and wireframe-grid URRF candidates. A wireframe adapter can be selected explicitly without gaining canonical world-state authority.

## Verification command

```text
npm run test:large-world
```

Expected local evidence for this revision:

- Large-world package tests: 13/13 passing.
- Root integration tests: 2/2 passing.
- The focused command also rebuilds the VSR package before running the integration tests.

## Authority boundary

- RNCS remains the owner of canonical world state, WorldTime, EventLog, and FactWorldTree.
- URRF providers own only representation candidates and visual projection.
- A replication delta is not self-authorizing. Target mutation requires an explicit `status: committed` authority receipt with a 64-character receipt root.
- Provider success, Snapshot/Delta creation, and local test execution do not prove human approval, distributed durability, GPU performance, external Spark execution, MMO scale, or production deployment.

## RCL stress mapping

| Gate | Evidence | Status |
|---|---|---|
| EXPRESS / COMPILE | Stable replication and provider envelopes with deterministic roots | PASS (local candidate) |
| LOWER / EXECUTE | RNCS truth lowered into two runtime instances and URRF provider adapters | PASS (local candidate) |
| CORRECT | Ordered event replay, target-root checks, alternate provider selection | PASS (local candidate) |
| ROBUST | Base mismatch, missing receipt, duplicate delta, and working-set checks | PASS (local candidate) |
| PERFORMANCE | Bounded 9x9 source region and max active chunk budget | PASS (bounded synthetic) |
| AI_GENERATE | Not exercised | NOT_RUN |
| EVIDENCE | This ledger plus package/root tests and post-merge rerun | CANDIDATE |

## Open gates

- Persistent storage and restart recovery for replication receipts.
- Network transport, authentication, packet loss, and multi-writer conflict policy.
- Target hardware/GPU performance and visual/manual play evidence.
- CI checks currently expose no executable steps in the repository workflow; local results must not be called CI proof.
