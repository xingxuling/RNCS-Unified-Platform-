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

`SPARK_RUNTIME_PARTIAL` / `BLOCKED`:

- No `@sparkjsdev/spark` package is installed in the RNCS workspace dependency graph.
- The supplied `spark-2.1.0.zip` was inspected as source/dist/type evidence (version 2.1.0, MIT, `three >=0.180.0` peer), but was not silently copied into the repository or treated as an installed runtime.
- The isolated external probe below verifies a synthetic PLY load/render/raycast route and a synthetic chunked `ReadableStream`; it does not verify a real RAD/RADC fixture, Spark paging, or the default asynchronous GPU depth-readback path.
- Consequently the Phase 0 runtime part is `PARTIAL`; no production, deployment, hardware-GPU, or CI success evidence is claimed.

The implementation itself records this boundary as `CONTRACT_VERIFIED_RUNTIME_NOT_EXECUTED` with failure code `PROVIDER_RUNTIME_NOT_EXECUTED` when the runtime is absent. The VSR binding likewise remains `execution_status: NOT_EXECUTED` in the contract test.

## RCL/K400 evidence boundary

- RCL owner: typed representation identity, authority, transition, equivalence, residency, and evidence semantics.
- Auxiliary provider: Spark remains a VSR visual representation provider; it does not own RNCS canonical reality or commit authority.
- Recorded gap: `RCL_GAP_REPRESENTATION_POLICY_V0_1` (representation-policy semantics are kept at the RNCS/RCL governance boundary; no silent backend bypass was introduced).
- K400 mapping: `UNMAPPED_PENDING_CANONICAL_MATRIX`; the focused run is not a declaration of any K400 gate PASS.
- Promotion/commit: no authority promotion, canonical commit, production write, or CI rerun was performed.

## Next executable gate

The isolated continuations below upgrade the bounded load/render/raycast portion and a synthetic chunked stream. A real RAD/page-stream fixture and the default asynchronous GPU depth-readback path are still open.

## Continuation: isolated Spark 2.1 browser proof

Date: 2026-08-31

This is an external-runtime probe, not a dependency or source change in the RNCS workspace. The package was unpacked into a temporary directory and was not copied into the repository.

### Inputs and environment

- Supplied archive: `C:\Users\User\Downloads\spark-2.1.0.zip`.
- Archive SHA-256: `b84591632a623b9db9fa227473fa2ea03f48f03b3239caaa599d085962fdaed3`.
- Provider package: `@sparkjsdev/spark@2.1.0`, MIT, peer `three >=0.180.0`.
- Peer package: `three@0.180.0`.
- Host runtime: Node `v24.15.0`; Playwright Node API `1.62.1`.
- Browser: Chrome for Testing `151.0.7922.34`, launched from the existing local Chromium cache.
- Context: `WebGL 2.0 (OpenGL ES 3.0 Chromium)`, renderer `WebKit WebGL` (headless SwiftShader).

### Minimal fixture and harness

The probe built an in-memory binary little-endian PLY with exactly one vertex and the 14 Gaussian fields (`x/y/z`, three scales, four quaternion fields, opacity and three DC color fields). It loaded the bytes through the actual browser Worker path:

```text
SplatMesh({fileBytes, fileType: "ply", nonLod: true, raycastable: true})
-> await mesh.initialized
-> SparkRenderer.update/render
```

The default `readRenderTargetPixelsAsync` depth-readback did not complete within the bounded headless run. For this one-splat case, the harness used a deterministic zero-depth readback only to provide the ordering input; the Spark Worker sort, packed texture generation, shader draw and pixel readback remained real. This is recorded as an explicit compatibility limitation, not as production GPU proof.

### Observed result

`RUNTIME_MINIMAL_LOAD_RENDER_RAYCAST_PASS`:

- Worker decode and initialization: `isInitialized=true`, `numSplats=1`, packed capacity `2048`.
- Spark update/sort stage: `activeSplats=1`, `currentNumSplats=1`, `displayNumSplats=1`, ordering texture length `16384`, generated target present, mesh generator present.
- Bounds: min `[-0.9882584527, -0.9882584527, -0.9882584527]`; max `[0.9882584527, 0.9882584527, 0.9882584527]`.
- Raycast: `1` hit at distance `4.0117411613`.
- GPU render pixels: `12160/16384` pixels differed from the `[16,32,48]` clear color; RGB sum `2432264`; center pixel `[128,128,128,255]`; max RGB `128`; all `16384` pixels had non-zero alpha.
- Renderer statistics: `1` render call and `2` triangles.
- Browser page errors: none; request failures: none. The only console entries were a favicon `404` and a non-fatal shader signed/unsigned warning.

### Continuation: synthetic chunked stream proof

The same 413-byte PLY fixture was delivered through Spark's `stream`/`streamLength` input as eight `ReadableStream` chunks (`[1, 7, 13, 29, 61, 97, 131, 74]` bytes). All eight chunks and all 413 bytes were consumed by the browser Worker decoder. A parallel direct-byte decode produced identical center, scale, quaternion, opacity and color values.

`RUNTIME_SYNTHETIC_STREAM_LOAD_RENDER_RAYCAST_PASS`:

- Stream decode and initialization: `isInitialized=true`, `numSplats=1`, `deliveredChunks=8`, `deliveredBytes=413`.
- Spark update/sort stage: `activeSplats=1`, `currentNumSplats=1`, `displayNumSplats=1`, ordering texture length `16384`.
- GPU render pixels: `16384/16384` pixels differed from the clear color; center pixel `[128,128,128,255]`; all `16384` pixels had non-zero alpha.
- Renderer statistics: `1` render call and `2` triangles.
- Raycast: `1` hit at distance `3.0117416382`.

### Continuation: second-provider generic contract gate

The Phase 2 contract gate was exercised with a second, non-Gaussian `mesh` provider (`provider:external:gltf-mesh-0.2`). The test used the existing generic RNCS `createRepresentationRef` and VSR `createVisualRepresentationBinding` paths; no Spark- or Mesh-specific branch was added to RNCS Core.

`SECOND_PROVIDER_GENERIC_CONTRACT_PASS`:

- RNCS verified both the Spark Gaussian reference and the Mesh reference with the same `content_root` while keeping distinct provider IDs, representation kinds and profiles.
- VSR accepted the Mesh manifest through the generic projection-only binding; `execution_status=NOT_EXECUTED`, `provider_can_write_authoritative_world_state=false`, and binding integrity verification passed.
- Verification command after rebuilding VSR: `node --test tests/spark-representation-provider.integration.test.mjs` -> `3/3 PASS` (the existing two Spark cases plus the Mesh case).
- This is a contract/identity gate only. It does not claim a Mesh GPU/browser provider runtime, cross-representation transition, equivalence proof or rollback.

### Continuation: cross-representation transition candidate

The next Phase 3 gate uses the generic RNCS representation-transition contract together with the existing VSR perceptual-plan comparator. It is deliberately candidate-only: applying the transition changes only the candidate's active representation root, and does not call RNCS `commit` or mutate canonical reality.

`PHASE3_CROSS_REPRESENTATION_CANDIDATE_PASS`:

- `createRepresentationTransitionCandidate` accepted the same `content_root` and stable object/state identity for the Spark Gaussian and Mesh references.
- VSR compiled two deterministic plans under different quality/device resource policies, and `comparePerceptualPlans` returned `ok=true` with `sharedSourceReality=true`; its report root was bound into the transition's perceptual evidence.
- `applyRepresentationTransition` selected the Mesh candidate under the declared working-set budget while preserving `commit_status=NOT_COMMITTED` and provider write authority `false`.
- `rollbackRepresentationTransition` restored the Gaussian source root and sealed `rollback.status=ROLLED_BACK`, still with no canonical commit.
- RNCS contract suite after the change: `representation transition tests: 5/5 PASS`; focused cross-package command after rebuilding VSR: `node --test tests/spark-representation-provider.integration.test.mjs` -> `4/4 PASS`.
- This is a deterministic contract/equivalence-plan candidate gate. It is not a Mesh runtime receipt, a geometry conversion, a collision/behavior equivalence proof, or a canonical-state transition.

### Continuation: bounded Mesh reference runtime

The repository already contains a glTF importer and VSR spatial reference renderer. I ran the same one-triangle glTF fixture used by the new integration probe through that path and then bound its sealed scene root to the generic Mesh `RepresentationRef`.

`MESH_REFERENCE_RUNTIME_PASS`:

- glTF import receipt verified; one Mesh and one triangle were materialized.
- VSR spatial frame verification passed at `64x64` with shadows disabled; the CPU reference renderer emitted a valid PNG and a stable pixel root.
- Observed roots: `sceneRoot=133b65520077c287cdb79ea8dfc91f649b8ecce01e270856126c065064e9ea5f`, `receiptRoot=261bd6b12ad18158da01e9ec4d69294530f2843a868ce2978f558f45a29932f0`, `frameRoot=64649713e385ba14240ce6ba6a1115106c76eafb805132b2dc2e22830bc9a7c1`, `pixelRoot=52ae4f50cfa7f80b213d71eb9c7a51db51eff9791207fb726af0a3c3f9e72d5e`.
- The provider binding still reports `execution_status=NOT_EXECUTED`; this run proves the local VSR Mesh implementation/reference path, not an independent external Mesh Provider execution receipt or GPU/browser provider handoff.

### Remaining gates

- `REAL_RAD_PAGE_STREAM_NOT_EXECUTED`: the synthetic chunked PLY stream passed, but no real `.rad`/`.radc` fixture or Spark page-stream input was supplied, so production-format streaming/paging remains open.
- `SECOND_PROVIDER_RUNTIME_NOT_EXECUTED`: the generic Mesh contract and local VSR reference implementation passed, but no separate Mesh provider execution receipt or GPU/browser provider handoff has been produced.
- `CROSS_REPRESENTATION_RUNTIME_NOT_EXECUTED`: the candidate transition, VSR perceptual comparator and rollback contract pass, but no provider-side Gaussian-to-Mesh materialization or target-runtime handoff has executed.
- `CROSS_REPRESENTATION_DOMAIN_EQUIVALENCE_PARTIAL`: identity, authority, perceptual-plan and resource-policy evidence pass for the fixture; constraint, behavioral and temporal equivalence remain `UNKNOWN` / `NOT_RUN`.
- `ASYNC_DEPTH_READBACK_BLOCKED`: the standard async depth-readback path needs a follow-up on a non-headless/browser-GPU environment; the zero-depth adapter is bounded evidence for a one-splat ordering case only.
- `RNCS_WORKSPACE_RUNTIME_NOT_INSTALLED`: the repository still intentionally has no Spark dependency; its contract test remains `CONTRACT_VERIFIED_RUNTIME_NOT_EXECUTED` when run without the external package.
- No production deployment, CI success, GPU hardware certification, canonical-state mutation, authority promotion or canonical commit was performed.

The RCL owner, auxiliary Spark provider boundary, `RCL_GAP_REPRESENTATION_POLICY_V0_1`, and `UNMAPPED_PENDING_CANONICAL_MATRIX` status remain unchanged.
