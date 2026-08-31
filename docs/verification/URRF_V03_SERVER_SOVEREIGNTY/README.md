# URRF v0.3 Server Pseudo-Sovereignty Evidence

This slice exercises the v0.3 section 19 boundary:

```text
City Shard execution lease
→ source failure/revocation
→ newer target epoch + fencing token
→ durable snapshot hydration
→ old-writer rejection
```

The implementation is a bounded local candidate. It does not claim a legal or
political sovereignty model, distributed consensus, production cryptography,
network-partition proof, or automatic authority promotion.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | Six-level Server Pseudo-Sovereignty profile with territory, scopes, lease, epoch, resources, peers and migration/failover policy |
| COMPILE | PASS | RNCS Core contract, Large World Runtime and repository integration suites |
| LOWER | PASS | A City Shard profile lowers into source/target lease-bound migration and handoff records |
| EXECUTE | PASS | Standby runtime hydrates from a durable source bundle under a newer lease |
| CORRECT | PASS | Source and target snapshot roots and canonical world root remain equal after handoff |
| ROBUST | PASS | Missing revocation, stale epoch and stale fencing are rejected; tampering changes sealed roots |
| PERFORMANCE | CANDIDATE | 5×5 synthetic region; no distributed-scale timing claim |
| AI_GENERATE | NOT_DEPLOYED | No external generative provider invoked |
| EVIDENCE | PASS | Rooted JSON report records lease, migration, revocation, restore and handoff roots |

## Authority boundary

RNCS remains the canonical world owner. The server/shard profile only describes
temporary, lease-scoped, revocable execution authority. The handoff receipt
records candidate control-plane hydration; it does not grant canonical write
authority. The durable restore itself still requires an explicit committed
authority receipt, and the old lease is fenced by a strictly newer epoch and
fencing token.

Artifact:

- `server-pseudo-sovereignty-report.json`
