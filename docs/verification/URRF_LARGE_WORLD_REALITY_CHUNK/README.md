# URRF v0.3 Large-World RealityChunk Evidence

This slice runs the document's RealityChunk v0.3 path:

```text
RNCS canonical chunk
→ content-addressed RealityChunk snapshot
→ parent-version-bound delta
→ isolated target replica
→ idempotent duplicate receipt
```

The replica is explicitly a candidate. It does not acquire canonical write
authority, and the canonical LargeWorldRuntime chunk remains unchanged.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | RealityChunk v0.3 contract, delta and receipt schemas |
| COMPILE | PASS | RNCS Core and LargeWorldRuntime test suites |
| LOWER | PASS | LargeWorldRuntime exposes snapshot/delta/replica APIs |
| EXECUTE | PASS | Two isolated local runtimes exchange one chunk delta |
| CORRECT | PASS | Base/target/version/delta/receipt roots verify; world root is unchanged |
| ROBUST | PASS | Stale parent, wrong target node, tampered delta and duplicate replay are covered |
| PERFORMANCE | CANDIDATE | 5×5 synthetic region; no distributed-scale timing claim |
| AI_GENERATE | NOT_DEPLOYED | No external generative provider was invoked |
| EVIDENCE | PASS | Rooted JSON report records all chunk and receipt roots |

Artifact:

- `reality-chunk-replication-report.json`

The JSON report is local runtime evidence only. It is not proof of distributed
consensus, production transport, hardware rendering, or provider authority.

## RCL/RNCS stress extraction

- RCL gap: no new RCL core primitive was silently invented; RealityChunk remains
  an RNCS/URRF contract lowered into the existing LargeWorldRuntime.
- Donor advantage: existing deterministic chunk roots, world-state roots and
  replication idempotency ledger were reused instead of creating a second world
  truth owner.
- Stress case: one chunk crosses a parent-version boundary, is applied as a
  candidate replica, then is replayed as a duplicate and checked for tampering.
- Regression case: Core contract tests and the 32-test LargeWorldRuntime suite
  remain green alongside the new cross-runtime integration test.
