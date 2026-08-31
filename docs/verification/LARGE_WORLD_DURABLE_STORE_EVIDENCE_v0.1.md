# Large World Durable Store Evidence v0.1

## Scope

This ledger records a bounded local file adapter for verified RNCS durable bundles. It closes the temporary-file/rename and crash-point test gap without claiming a database or cross-process storage service.

## Implemented path

1. `LargeWorldDurableStore.save(bundle)` verifies the bundle, writes JSON beside the target as a temporary file, calls file sync, and atomically renames the temporary file into the target path.
2. `save(..., {faultAt: 'after-temp-sync' | 'after-rename'})` injects deterministic interruption points for tests; it is not an automatic production fault mechanism.
3. `recover()` prefers a valid primary bundle over an unfinished temporary file, or promotes a valid temporary file when the primary is missing.
4. Store receipts seal operation, source, bundle root, byte count, file sync, and directory-sync capability; storage receipts remain candidate-only and do not grant world authority.
5. `restoreDurableBundle` still requires a separate committed authority receipt before canonical state is restored.

## Verification command

```text
npm run test:large-world
```

Expected local evidence for this revision:

- Large-world package tests: 16/16 passing.
- Root integration tests: 7/7 passing.
- The store test proves a normal save/load, a crash after temporary-file sync with primary preservation, temporary promotion when primary is missing, and a crash after rename with primary recovery.

## Boundary

- The adapter uses the host filesystem and is single-process; it does not provide database transactions, cross-process leases, distributed locking, WAL replication, or cloud durability.
- Directory sync is reported as a capability in the receipt; file sync and atomic rename are required for a committed save.
- Recovery returns a verified bundle; canonical restore remains an explicit authority-gated runtime operation.

## RCL stress mapping

| Gate | Evidence | Status |
|---|---|---|
| EXPRESS / COMPILE | Durable store API and receipt schema | PASS (local candidate) |
| LOWER / EXECUTE | Bundle JSON through temp-file/rename adapter | PASS (local candidate) |
| CORRECT | Bundle root verification and primary/temp selection | PASS (local candidate) |
| ROBUST | Deterministic crash points and missing-primary promotion | PASS (bounded synthetic) |
| PERFORMANCE | Bounded local bundle and one-file replacement | PASS (bounded synthetic) |
| AI_GENERATE | Not exercised | NOT_RUN |
| EVIDENCE | This ledger plus package/root tests and post-merge rerun | CANDIDATE |

## Open gates

- Database-grade durability, cross-process locking, and production backup/restore.
- Production-authenticated network session and multi-writer coordination beyond bounded local policies.
- Target hardware/GPU performance and visual/manual play evidence.
