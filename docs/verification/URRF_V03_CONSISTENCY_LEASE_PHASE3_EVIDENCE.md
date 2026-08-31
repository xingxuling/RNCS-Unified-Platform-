# URRF v0.3 Consistency and Lease Phase 3 Evidence

Status: `CANDIDATE / LOCAL_VERIFIED / NOT_PRODUCTION`

## Implemented surface

- RNCS `RealityConsistencyProfile` with six consistency modes, stale-read
  budget, conflict policy, lease/fencing requirements and retry policy.
- RNCS `AuthorityLease` with shard scope, semantic scope, owner node, epoch,
  fencing token, validity interval, renewal reference and explicit revocation.
- Version-rooted `RealityReplicationEnvelope` with message type, sequence,
  version roots, profile/lease roots and candidate-only authority boundaries.
- Large-world Snapshot/Delta replication can carry a profile and active lease.
  The receiver compares the incoming epoch/fencing token to its accepted lease,
  checks validity at the current world tick, binds a committed authority receipt,
  and rejects stale, expired, revoked or mismatched authority before mutation.
- Two isolated runtime nodes are exercised: a current lease applies once and a
  stale epoch is rejected without changing the receiver.

## Reproducible checks

```text
npm test --workspace @taowind/rncs-core-contract
npm test --workspace @taowind/large-world-runtime
npm run test:urrf-v03
npm run test:urrf-runtime
npm run test:large-world
```

Observed on 2026-08-31:

- RNCS Core Contract: `21/21 PASS` (including four Reality Distribution tests).
- Large-world package: `17/17 PASS` (including two-node lease/fencing test).
- v0.3 truth integration: `3/3 PASS`.
- URRF runtime: `11/11 PASS`; representation integration: `1/1 PASS`.
- Large-world root integration: `7/7 PASS`.
- Syntax and `git diff --check`: PASS.

## Evidence boundary

The lease is an RNCS admission contract and does not itself grant a commit. A
separate committed authority receipt remains required. This phase does not
claim distributed consensus, transport Fiber/WiFi/Bluetooth providers,
power/thermal governance, production hardware, or production CI execution.
