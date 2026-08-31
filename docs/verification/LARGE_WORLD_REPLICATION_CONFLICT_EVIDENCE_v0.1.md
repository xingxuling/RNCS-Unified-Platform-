# Large World Replication Conflict Evidence v0.1

## Scope

This ledger records a bounded deterministic multi-writer policy for replication candidates that share the same RNCS base roots. It is a conflict court for one runtime, not distributed consensus or a production coordinator.

## Implemented path

1. Each candidate must carry an explicit `writer_id` and positive `writer_sequence`; its Delta is verified before entering the court.
2. Candidates must agree on world, region, and every base Snapshot/Time/Event/Fact/trace root and count.
3. The `lexicographic-writer-priority` policy orders candidates by `writer_id`, `writer_sequence`, then `delta_root`; the first candidate is the only winner.
4. The winner is applied through the existing authority-gated RNCS Delta path. Losers receive a durable `REJECTED_CONFLICT` decision and cannot be applied directly afterward.
5. The decision is candidate-only; the application returns a committed conflict receipt. Conflict decisions are carried in the durable bundle and survive a JSON restart.

## Verification command

```text
npm run test:large-world
```

Expected local evidence for this revision:

- Large-world package tests: 15/15 passing.
- Root integration tests: 5/5 passing.
- The conflict test proves input-order independence, deterministic writer priority, winner-only application, loser rejection, durable decision persistence, and duplicate re-application.

## Boundary

- The policy is a deterministic local tie-breaker, not quorum, consensus, leader election, clock synchronization, or Byzantine fault tolerance.
- Writer identity, sequence allocation, authority key custody, revocation, and production coordination remain external gates.
- It resolves same-base candidates only; causally unrelated or differently based candidates remain rejected for explicit reconciliation.

## RCL stress mapping

| Gate | Evidence | Status |
|---|---|---|
| EXPRESS / COMPILE | Candidate, decision, and receipt contracts | PASS (local candidate) |
| LOWER / EXECUTE | Winner lowered through RNCS Delta application | PASS (local candidate) |
| CORRECT | Same-base checks, deterministic ordering, winner/loser roots | PASS (local candidate) |
| ROBUST | Input-order permutation, loser replay rejection, JSON restart | PASS (bounded synthetic) |
| PERFORMANCE | Bounded candidate list and root computation | PASS (bounded synthetic) |
| AI_GENERATE | Not exercised | NOT_RUN |
| EVIDENCE | This ledger plus package/root tests and post-merge rerun | CANDIDATE |

## Open gates

- Production multi-writer coordination, writer identity/key lifecycle, and network session integration.
- Conflict policy for causally unrelated branches or richer merge semantics.
- Target hardware/GPU performance and visual/manual play evidence.
