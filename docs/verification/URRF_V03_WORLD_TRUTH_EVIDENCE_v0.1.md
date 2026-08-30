# URRF v0.3 World Truth Contract Evidence v0.1

Date: 2026-08-31

## Request and document boundary

User supplied `Universal_Reality_Representation_Fabric_通用现实表示织体与跨表示编译架构_v0.3_现实属性与世界定律补强版.md` and asked whether this route should continue from the v0.2 result.

The attached document is treated as a candidate architecture and validation route, not as proof that the second-world runtime already exists. Its P0/P1 minimum route asks for executable contracts for:

```text
WorldTime
WorldEvent
WorldFact
FactWorldTree
```

and a vertical path:

```text
authority-receipted mutation
→ Canonical Event Log
→ deterministic WorldState replay
→ Fact World Tree provenance
```

The implementation below is a bounded RNCS Core contract candidate. It does not claim distributed nodes, Lease/Fencing, transport, power, or production authority.

## Source and merge identity

- Repository: `xingxuling/RNCS-Unified-Platform-`
- Target branch: `main-95`
- Candidate branch: `codex/urrf-v03-world-truth-v01`
- Candidate base: GitHub `main-95` at `8ee104424fe0c2332419a0529721d060882465f3`
- Canonical owner: RNCS Core contract; URRF remains an RNCS subsystem, not a new canonical repository.

## Implemented contracts

`packages/kernel/rncs-core-contract/src/world-truth.mjs` adds:

- rooted `WorldTime` with separate epoch, logical clock, simulation tick, causal sequence, simulation rate, time scale, status and historical reference;
- authority-receipted `WorldEvent` with causal parents, mutation root, previous/next state roots and evidence reference;
- deterministic `Canonical Event Log` append and replay with causal/time ordering checks;
- `WorldFact` with source-event provenance and `canonical | candidate | disputed` confidence;
- `FactWorldTree` rebuild/verification that keeps `memory_world_tree_ref` explicitly null and never derives canonical fact from subject memory.

The four schemas are:

```text
packages/kernel/rncs-core-contract/schemas/world-time.v0.3.schema.json
packages/kernel/rncs-core-contract/schemas/world-event.v0.3.schema.json
packages/kernel/rncs-core-contract/schemas/world-fact.v0.3.schema.json
packages/kernel/rncs-core-contract/schemas/fact-world-tree.v0.3.schema.json
```

No function in this slice calls RNCS `commit`; an authority receipt is an explicit input and does not create authority by itself.

## Command and result

Command:

```text
npm run test:urrf-v03
```

Result: `PASS` (exit code `0`).

Passing groups:

- RNCS Core proposal/foundation/entity tests: `8 + 4 + 5 + 1 + 6 PASS`;
- v0.3 World Truth contract tests: `5/5 PASS`;
- repository-level v0.3 integration tests: `3/3 PASS`.

The integration fixture is `world:urrf-v03-integration`, branch `main`, with one authority-receipted `event:storm-power-loss`. The replayed state root equals the event log head state root, and the canonical fact `fact:city-without-power` cites that event as its source.

Deterministic fixture roots:

```text
world_time_root = fbc9914c907d916d1527e5638a94b55a81198606ba996307ef5ddd40605bff87
event_root      = ed0014ab0000a064073894abb60b1c03e9706419f6cc99b53955b5f9417afa3f
state_root      = 2aacf243158954d9196841dbb562f298ef25edfd54715c0fc596cb16babede1e
event_log_root  = d5b1ea7b99295d3629310ab9412262250a2d39cb3d01b947fcc97d1b0466f887
fact_root       = 50fc688a8636a5db9451c038ad8c2bf76a1629cae8982188a265734c29fc5cf3
fact_tree_root  = d02d73519de7c0fe577b971d65058da6dfb0f22bc62fb5c73caf0e7994db3d86
```

## What is proven

`URRF_V03_TRUTH_VERTICAL_CANDIDATE_PASS`:

- simulation time, logical event time and causal sequence remain distinct and deterministically rooted;
- a mutation cannot enter the event log without an explicit committed authority receipt;
- event replay rejects previous-state mismatch, next-state mismatch, duplicate causal order and non-monotonic world time;
- canonical facts carry source-event provenance and are separated from candidate facts;
- the Fact World Tree rejects missing source events and forbids a memory-tree reference in this canonical fact structure;
- tampering changes roots and fails verification.

## RCL/K400 and authority boundary

- RNCS owns world-time/event/fact identity and replay contract in this candidate slice.
- RCL remains the owner of governed change semantics; provider code is not allowed to rewrite canonical properties or event history.
- `RCL_GAP_SECOND_WORLD_RUNTIME_GOVERNANCE` remains `proposed_not_implemented`; no silent RCL bypass was introduced.
- K400 mapping remains `UNMAPPED_PENDING_CANONICAL_MATRIX`; these tests are bounded evidence, not a declaration of all nine or v0.3 distributed gates.
- No canonical RFE commit, authority promotion, production write, distributed consensus, or hardware/network proof was performed.

## Stress-field extraction

- `Stress Case`: same world state must survive replay while a tampered next-state root, duplicate event, missing causal parent, non-monotonic time, or missing fact source is rejected.
- `Donor Advantage`: existing RNCS content-addressed roots and authority-gated transition contract supply the reusable identity/evidence spine; no provider-specific world truth was copied into Core.
- `Regression Case`: the v0.2 Spark/Gaussian + Mesh focused suite still passes `5/5` at the root after the v0.3 export and contract additions; the full RAGF/VSR/RSR focused command exits `0` after installing the locked workspace dependencies.
- `Lowering / Provider Evidence`: none is claimed for this truth slice. The implementation is an RNCS contract/reference reducer; Physics, Thermal, Network, Transport, Power and database engines remain auxiliary providers or future gaps.

## Remaining v0.3 gates

`NOT_RUN` / `UNKNOWN`:

- PropertySet, Quantity/Unit/Dimension, Constitutive/Interaction/WorldLaw execution;
- Representation Flow Time, Reality Horizon, Interest Graph, Query Engine and Cognitive Streaming;
- RealityChunk snapshot/delta replication and cross-node Consistency/Lease/Fencing;
- Server migration/failover and split-brain fencing;
- Fiber/WiFi/Bluetooth transport profiles and fallback;
- Power Plane load shedding and multi-resource Governor;
- provider crash, network partition, stale lease, duplicate delta and cross-shard recovery tests;
- canonical RFE commit and production deployment.

This evidence therefore advances v0.3 from `DOC-ONLY` only to a bounded `P0/P1 TRUTH CONTRACT CANDIDATE`; it does not promote the whole v0.3 architecture.
