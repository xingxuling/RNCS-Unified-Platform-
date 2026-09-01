# URRF v0.3 RealityChunk Replication Fabric Evidence

This slice lowers the existing authenticated replication semantics to the
RealityChunk channel:

```text
RealityChunk Delta
→ authenticated packet
→ deliberate loss + retry
→ stale-base RESYNC_REQUIRED
→ parent snapshot
→ automatic delta replay
→ APPLIED / DUPLICATE acknowledgement
```

The channel carries candidate state only. RNCS remains the canonical world and
chunk owner; transport receipts do not grant provider or replica write
authority.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | Chunk packet, ack, snapshot receipt and delta contracts |
| COMPILE | PASS | Core 48/48 and LargeWorldRuntime 34/34 suites |
| LOWER | PASS | Existing authenticated HMAC/ack/retry pattern is reused for chunk payloads |
| EXECUTE | PASS | Two isolated runtimes exchange a delta through a lossy deterministic transport |
| CORRECT | PASS | Packet/ack roots, parent versions and final replica roots verify |
| ROBUST | PASS | Tampering, packet loss, stale base, resync and duplicate replay are covered |
| PERFORMANCE | CANDIDATE | 5×5 synthetic region; no production network throughput claim |
| AI_GENERATE | NOT_DEPLOYED | No external generative provider was invoked |
| EVIDENCE | PASS | Rooted JSON report records packet, resync and receipt roots |

## RCL/RNCS stress extraction

- RCL gap: no second world-truth owner was introduced; the fabric is a bounded
  RNCS/URRF lowering around existing runtime state.
- Donor advantage: existing HMAC, ack/retry, deterministic packet roots and
  runtime idempotency ledger were reused.
- Stress case: a stale candidate replica requires a base snapshot before the
  original delta can be replayed.
- Regression case: the pre-existing LargeWorldRuntime replication, visual and
  sovereignty tests remain green with the new packet channel.

Artifact:

- `reality-chunk-fabric-report.json`

This is local runtime evidence, not proof of distributed consensus, production
transport, hardware rendering, or provider authority.
