# URRF Large-World Portfolio — Phase 1 Evidence

## Scope

This phase connects the existing RNCS large-world region/chunk stream to the v0.3 Representation Portfolio contract. Every active chunk is lowered into a candidate-only portfolio with a `STANDARD` procedural-grid slot and a `PROXY` wireframe-grid slot when both URRF references are present. The same portfolio runtime then selects a requested quality under a resource budget and preserves the minimum-reality proxy when the budget is zero.

## Local verification

| Gate | Result | Evidence |
|---|---|---|
| RNCS chunk/region generation and stream regression | PASS | `npm test --workspace @taowind/large-world-runtime` — 18/18 |
| Chunk-to-portfolio contract | PASS | 9 active portfolios; all `READY`; `verifyRepresentationPortfolio` true |
| Quality selection | PASS | mixed view selects `STANDARD` for the center and `PROXY` for 8 outer chunks |
| Budget fallback | PASS | zero-budget view selects `PROXY` for all 9 chunks with `MINIMUM_REALITY_FALLBACK` |
| URRF materialization bridge | PASS | candidate adapter executed without canonical write authorization |
| VSR spatial render | PASS | two deterministic 640×360 CPU-reference PNGs; repeated mixed render pixel root identical |
| Visual evidence envelope | PASS | three `LOCAL_RENDERED / OBSERVED_NOT_GRADED` evidence roots verify |
| Production/remote visual grade | NOT RUN | GPU/WebGPU/browser/device/subjective grade not claimed |
| GitHub CI | BLOCKED | `engine-reference` workflow is externally blocked before steps by the observed billing/spending-limit gate |

## Sealed roots

- `world_root`: `e8c28e751ac1d75267d24be97fa0bb34137441d0e4ac83081684e68d330d2af4`
- `region_root`: `bb0c72ffb027d373c08aed18172430023fd0ae4e245366debfa8852024d78f3d`
- `stream_root`: `fe468b3982f44162b404f3826e8bf613a08e99c91b50d06b6238bb1402e33cf4`
- `materialization_root`: `2eeca64a497bd5fab0299f1cdb113e43993d2dd20732413734fc317ac41f9b5a`
- `portfolio_runtime_root`: `826fb4094ec7531d9ff939c28c7adfe4c732de541cdb81a39873efad0797c09f`
- `report_root`: `0a172e1b185bcbc75629bc4de05e0f8e1b74e998c25ccd3700264bb36d634b08`

Artifacts are in [`docs/verification/URRF_LARGE_WORLD_PORTFOLIO`](./URRF_LARGE_WORLD_PORTFOLIO), including the report, README, and the mixed-quality and proxy-fallback PNGs.

## Authority and RCL stress accounting

- **Canonical owner:** RNCS owns world seed, region/chunk truth, streaming state, and materialization truth.
- **Representation owner:** URRF owns candidate references, portfolio composition, selection, and visual evidence envelopes.
- **RCL gap:** no existing generic RCL primitive was found that expresses a per-object quality ladder plus multi-axis representation/resource selection; the gap is recorded as a candidate lowering seam, not a silent bypass.
- **Donor advantage:** the existing URRF v0.3 portfolio contract and Reality Representation Portfolio Runtime supply the reusable slot, composition, fallback, and evidence semantics.
- **Stress case:** 9 active chunks share one bounded working set while each carries two representation candidates and independent selection roots.
- **Regression case:** existing large-world generation, boundary, stream hysteresis, materialization, replication, durable-store, conflict, and tamper tests remain green (18/18 package tests plus the existing 7 integration tests when run in the full large-world suite).
- **Lowering evidence:** `createChunkRepresentationPortfolio` and `LargeWorldRuntime.getRepresentationPortfolio` lower chunk URRF references without granting provider authority or mutating canonical state.
- **Candidate genome:** `{object_id, canonical_state_root, content_root, slots:[quality_profile, representation_root, diversity_axes, render_profile, resource_costs, fallback_slot_id], composition, portfolio_root}`.

This is a runnable integration candidate, not a claim that a production MMO-scale world or AAA visual renderer is complete.
