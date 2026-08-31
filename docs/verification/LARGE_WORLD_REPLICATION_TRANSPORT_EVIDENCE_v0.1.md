# Large World Replication Transport Evidence v0.1

## Scope

This ledger records a bounded authenticated packet link around the RNCS Snapshot/Delta protocol. It is a deterministic transport fixture, not a production network deployment.

## Implemented path

1. A Delta is sealed into a packet with channel, sender, recipient, monotonic sequence, packet root, and HMAC-SHA256 authentication tag.
2. The link requires an explicit committed authority receipt before sending a mutation-capable Delta to the target.
3. The injected transport can drop packets; unacknowledged packets remain pending and are retried with the same packet identity.
4. The target validates the HMAC and route, applies the Delta through RNCS base-root gates, and returns an authenticated `APPLIED`, `DUPLICATE`, or `REJECTED` acknowledgement.
5. A duplicate packet is idempotent because the target replication ledger returns `DUPLICATE`; tampered authentication tags are rejected before application.

## Verification command

```text
npm run test:large-world
```

Expected local evidence for this revision:

- Large-world package tests: 14/14 passing.
- Root integration tests: 5/5 passing.
- The transport tests deterministically drop the first packet, retry, converge, exercise a duplicate packet, and return an authenticated rejection for a stale base.

## Boundary

- HMAC key custody, rotation, replay windows, TLS/session establishment, endpoint identity, and authorization policy remain outside this bounded link.
- The transport link does not own canonical state; RNCS Delta application remains the only world-state mutation path.
- Local deterministic loss/retry is not proof of internet reliability, adversarial security, multi-writer conflict resolution, or production operations.

## RCL stress mapping

| Gate | Evidence | Status |
|---|---|---|
| EXPRESS / COMPILE | Packet, Ack, and route envelope contracts | PASS (local candidate) |
| LOWER / EXECUTE | RNCS Delta over injected loss/retry transport | PASS (local candidate) |
| CORRECT | HMAC/root validation, ordered base roots, duplicate idempotency | PASS (local candidate) |
| ROBUST | First-packet loss, tampered tag, and rejected apply path | PASS (bounded synthetic) |
| PERFORMANCE | Small packet fixture and bounded retry queue | PASS (bounded synthetic) |
| AI_GENERATE | Not exercised | NOT_RUN |
| EVIDENCE | This ledger plus package/root tests and post-merge rerun | CANDIDATE |

## Open gates

- Production key custody/rotation and authenticated network session integration.
- Multi-writer conflict policy and durable replay windows.
- Target hardware/GPU performance and visual/manual play evidence.
