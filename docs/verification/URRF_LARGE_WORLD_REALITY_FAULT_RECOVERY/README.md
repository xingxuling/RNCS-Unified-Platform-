# URRF large-world minimum-reality recovery evidence

This slice closes the v0.3 fault-to-representation seam:

```text
RealityFault + PowerProfile + ResourceBudget
→ MinimumViableReality
→ RNCS LoadSheddingPlan
→ URRF PROXY portfolio selection
→ VSR spatial frame / CPU-reference pixels
```

`LargeWorldRuntime.recoverMinimumReality()` is a candidate-only orchestration
surface. RNCS contracts own fault, power, minimum-reality and load-shedding
semantics; LargeWorldRuntime only lowers the verified result into bounded
active chunks and proxy representations. The canonical world state and world
root remain unchanged.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | Existing RNCS v0.3 RealityFault, MinimumViableReality, Power, ResourceBudget, Demand and LoadSheddingPlan contracts are reused |
| COMPILE | PASS | Core, URRF fabric, LargeWorldRuntime and VSR build/integration checks |
| LOWER | PASS | Fault and power plans bind to active chunk proxy selections and a spatial scene |
| EXECUTE | PASS | A deterministic 5×5 world recovers through a 9-chunk bounded working set and renders a VSR CPU-reference frame |
| CORRECT | PASS | Fault, minimum, plan, selection, scene, frame and pixel roots verify; stale/cross-node inputs are rejected |
| ROBUST | PASS | GPU/provider fault, battery/thermal survival, missing layers, tampered recovery root and canonical immutability are covered |
| PERFORMANCE | CANDIDATE | Synthetic 5×5 region and 9 active chunks only; no distributed, hardware, GPU or production throughput claim |
| AI_GENERATE | NOT_DEPLOYED | No external generative provider was invoked |
| EVIDENCE | PASS | Content-addressed JSON report is paired with the rendered proxy PNG |

## RCL/RNCS stress extraction

- RCL gap: no new second owner was introduced; fault-aware orchestration is a
  runtime lowering around RNCS-owned contracts.
- Donor advantage: the existing resource-governor plan and large-world power
  lowering were reused, preserving explicit candidate IDs and proxy fallback.
- Stress case: a critical provider/GPU fault with battery and thermal pressure
  must retain `WORLD_PROXY` while accounting for missing collision/semantic
  layers.
- Regression case: existing LargeWorldRuntime streaming, portfolio, visual,
  replication, sovereignty and RealityChunk fabric tests remain green.

## Artifacts

- `reality-fault-recovery-report.json`
- `reality-fault-recovery-proxy.png`

The image is a deterministic CPU-reference projection demonstrating the
minimum-reality visual path. It is evidence of local contracts and lowering,
not AAA art quality or proof of real GPU/VRAM, thermal, network, provider
restart, failover, or production-scale execution.
