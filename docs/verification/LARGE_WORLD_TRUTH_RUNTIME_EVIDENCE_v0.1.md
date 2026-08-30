# Large World Truth Runtime Evidence v0.1

Date: 2026-08-31

## Scope

This continuation closes the next executable contract after the bounded region/chunk slice: canonical World Time, authority-gated World Events, and Fact World Tree roots are now attached to the same deterministic region runtime.

The supplied URRF v0.3 document remains a candidate architecture. This evidence records a single-region executable gate, not a completed distributed second-world runtime.

## Source and target

- Repository: `xingxuling/RNCS-Unified-Platform-`
- Base: GitHub `main-95` merge `7dac48a09423b44f771c90906b7fb6328abbafbd`
- Candidate branch: `codex/large-world-truth-v01`
- Canonical truth owner: RNCS
- Representation owner: URRF
- Visual projection owner: VSR

## Executed route

```text
Region world root
  -> WorldTime v0.3
  -> explicit committed authority receipt
  -> WorldEvent mutation + causal parent
  -> Canonical Event Log replay
  -> Fact World Tree rebuild
  -> bounded stream resolution
  -> URRF materialization candidate
  -> VSR CPU reference projection
```

The runtime refuses to create a canonical world event unless the caller supplies an explicit committed authority receipt. Representation adapters still receive `canonical_state_mutation_allowed=false` and cannot promote their output into world truth.

## Verification

Command:

```text
npm run test:large-world
```

Result: `PASS` (exit code `0`).

- Large World Runtime package: `11/11 PASS`.
- World Time root advancement and verification: pass.
- Authority-gated World Event and causal replay: pass.
- Fact World Tree canonical fact source-event binding: pass.
- Rejection without explicit committed authority receipt: pass.
- 9×9 region, bounded stream, URRF materialization and VSR CPU render integration: `1/1 PASS`.
- Repeated VSR render pixel root: stable.

## What is proven

`LARGE_WORLD_TRUTH_BINDING_PASS`:

- Generated region identity remains separate from mutable canonical state roots.
- World time advances with integer logical/simulation/causal clocks and sealed roots.
- Every recorded event carries a committed authority receipt, previous/next state roots, and causal parent ordering.
- Event-log replay recomputes the canonical state root; tampering is rejected by the existing RNCS world-truth contract.
- Facts are separate from representations and are rebuilt into a Fact World Tree whose source events are explicit.
- Snapshot evidence binds region, world time, event-log, fact-tree and URRF fabric roots without allowing a provider write to canonical state.

## Open gates

`CANDIDATE_ONLY` / `NOT_PROVEN`:

- No multi-node replication, authority lease renewal/fencing, shard handoff, transport QoS, power governor, persistent storage, or production deployment was exercised.
- The authority receipt in the test is a deterministic fixture; no live human signer or external authority service was used.
- The VSR path is CPU reference rendering, not GPU hardware or MMO-scale performance proof.
- Spark remains an explicit contract-only provider unless its external runtime is separately installed and executed.
- K400 mapping remains `UNMAPPED_PENDING_CANONICAL_MATRIX`; this run does not declare a K400 gate PASS.

## Next executable gate

Add snapshot/delta replication with version-root and idempotency checks across two isolated runtime instances, then introduce a second representation provider while preserving the World Time/Event/Fact authority boundary.
