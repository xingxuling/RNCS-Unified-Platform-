# URRF v0.2 Phase 0 Run Evidence v0.1

Date: 2026-08-31

## Request and document boundary

User request: run the first executable route described by `Universal_Reality_Representation_Fabric_通用现实表示织体与跨表示编译架构_v0.2.md`.

The attached document is treated as a candidate architecture and validation route, not as proof that a universal engine already exists. Its Phase 0 minimum route is:

```text
VSR -> Spark Provider -> load / render / stream / raycast
```

The current repository implementation exposes the RNCS/RAGF/VSR/RSR provider contract and an explicit runtime boundary. It must not be reported as Spark GPU execution when that runtime is absent.

## Source and merge identity

- Repository: `xingxuling/RNCS-Unified-Platform-`
- Target branch: `main-95`
- Verified source: GitHub merge commit `d142fc6523eca38b3933df13a77c02427c61d588`
- Local verification branch: `codex/urrf-v02-phase0-run-v01`
- The verified tree is the GitHub `main-95` tree after PR #76; no source change was required to execute the existing contract route.

## Command and result

Command:

```text
npm run test:spark-representation-provider
```

Result: `PASS` (exit code `0`). This command built the required workspace artifacts and then ran the focused integration entrypoint.

Passing groups from the fresh `main-95` worktree:

- RNCS Core representation reference: 4/4
- RAGF full workspace: 211/211
- VSR core: 122/122
- VSR spatial: 98/98
- VSR asset streaming: 6/6
- VSR representation provider: 4/4
- VSR glTF: 21/21
- VSR temporal: 11/11
- RSR core: 29/29
- RSR simulation: 11/11
- RSR constraint physics: 19/19
- RSR embodied dynamics: 30/30
- RSR experience fabric: 35/35
- RSR spatial embodiment: 64/64
- RSR network reconciliation: 7/7
- RSR representation observation: 3/3
- Root Spark integration: 2/2

The direct root test was first attempted before the workspace build and correctly failed because the VSR `dist` entrypoint was not present. After the formal build-backed script was run, the complete command passed. This is a build prerequisite observation, not a product-runtime failure.

## What is proven

`CONTRACT_INTEGRATION_PASS`:

- RNCS can hold a typed Gaussian `RepresentationRef` with RAD format, authority scopes, policies, provenance, and evidence.
- RAGF can normalize the supplied external-provider result and create an asset candidate.
- VSR can create a Spark visual binding while preserving the explicit execution status.
- RSR can create a bounded LoD/representation observation candidate without asserting canonical reality or reconstruction authority.
- Provider health and export surfaces are present, and the contract tests reject an authoritative-world-state claim.

## What is not proven

`SPARK_RUNTIME_NOT_EXECUTED` / `BLOCKED`:

- No `@sparkjsdev/spark` package is installed in the RNCS workspace dependency graph.
- The supplied `spark-2.1.0.zip` was inspected as source/dist/type evidence (version 2.1.0, MIT, `three >=0.180.0` peer), but was not silently copied into the repository or treated as an installed runtime.
- This host has no verified Spark browser harness, `three` peer installation, WebGL/WebGPU context, GPU render, RAD fixture load, page streaming, or raycast execution.
- Consequently the Phase 0 `load / render / stream / raycast` runtime part remains `NOT_EXECUTED`; no visual, GPU, production, deployment, or CI evidence is claimed.

The implementation itself records this boundary as `CONTRACT_VERIFIED_RUNTIME_NOT_EXECUTED` with failure code `PROVIDER_RUNTIME_NOT_EXECUTED` when the runtime is absent. The VSR binding likewise remains `execution_status: NOT_EXECUTED` in the contract test.

## RCL/K400 evidence boundary

- RCL owner: typed representation identity, authority, transition, equivalence, residency, and evidence semantics.
- Auxiliary provider: Spark remains a VSR visual representation provider; it does not own RNCS canonical reality or commit authority.
- Recorded gap: `RCL_GAP_REPRESENTATION_POLICY_V0_1` (representation-policy semantics are kept at the RNCS/RCL governance boundary; no silent backend bypass was introduced).
- K400 mapping: `UNMAPPED_PENDING_CANONICAL_MATRIX`; the focused run is not a declaration of any K400 gate PASS.
- Promotion/commit: no authority promotion, canonical commit, production write, or CI rerun was performed.

## Next executable gate

Install and pin Spark 2.1 plus its `three` peer, provide a real RAD fixture, and run a browser/WebGL or WebGPU harness that records load, render, page streaming, raycast, and rollback/equivalence evidence. Only that run can upgrade the runtime line from `NOT_EXECUTED` to a runtime-qualified result.
