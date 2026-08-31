# Large World Durable Recovery Evidence v0.1

## Scope

This ledger closes the first persistence boundary for the bounded large-world runtime. It covers a serialized restart boundary, not a production database or network service.

## Implemented path

1. A runtime exports a durable bundle containing the complete RNCS replication snapshot and the applied Delta receipts used for duplicate detection.
2. The bundle is JSON round-tripped to model process/storage serialization.
3. A fresh, pristine runtime verifies the bundle and requires a separate committed authority receipt before restoring canonical state, WorldTime, EventLog, FactWorldTree, stream state, and the replication ledger.
4. After restore, the same Delta is rejected as `DUPLICATE`, proving the idempotency ledger survived the restart boundary.
5. Restore refuses a non-pristine target, preventing an implicit overwrite of an already-running canonical world.

## Verification command

```text
npm run test:large-world
```

Expected local evidence for this revision:

- Large-world package tests: 16/16 passing.
- Root integration tests: 7/7 passing.
- Replication, restore, and alternate URRF representation all run in the same focused command.

## Authority and durability boundary

- RNCS remains the owner of restored canonical world state and truth roots.
- Bundle export is candidate evidence; restore is a canonical mutation and requires an explicit committed authority receipt.
- The JSON round trip and bounded file-store test prove local serialization, temporary-file/rename behavior, and injected crash-point recovery only. They do not prove database recovery, transport authentication, multi-writer conflict resolution, or production operations.

## RCL stress mapping

| Gate | Evidence | Status |
|---|---|---|
| EXPRESS / COMPILE | Durable bundle, restore receipt, and root references | PASS (local candidate) |
| LOWER / EXECUTE | JSON restart boundary into a fresh runtime | PASS (local candidate) |
| CORRECT | Snapshot root, WorldTruth roots, and duplicate Delta replay | PASS (local candidate) |
| ROBUST | Missing receipt and non-pristine restore rejection | PASS (local candidate) |
| PERFORMANCE | Bounded 9x9 region and small serialized fixture | PASS (bounded synthetic) |
| AI_GENERATE | Not exercised | NOT_RUN |
| EVIDENCE | This ledger plus package/root tests and post-merge rerun | CANDIDATE |

## Open gates

- Database-grade durability, cross-process locking, and crash recovery beyond the bounded local file adapter.
- Production-authenticated network session and multi-writer coordination beyond the bounded deterministic conflict court (packet link and conflict policy are covered separately in their transport/conflict ledgers).
- Target hardware/GPU performance and visual/manual play evidence.
