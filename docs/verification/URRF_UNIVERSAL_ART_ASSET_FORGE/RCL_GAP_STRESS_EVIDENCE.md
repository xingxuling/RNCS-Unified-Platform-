# URRF Universal Art Asset Forge v0.1

## Status

`CANDIDATE_ONLY` / `AAA_NOT_PROVEN`

The forge now has a runnable Genome → Provider Resolution → Provider Job → Candidate → Production Court → local GLB/LOD inspection → unified independent evidence-bundle verification → AAA Acceptance → Evidence Ledger path. A candidate-only batch → assembly → VSR projection path now binds materialized GLB/PBR bytes, selected LODs, integer placements, cells, and cross-asset roots, then imports, CPU-rasterizes, and browser-GPU-renders an aggregate VSR scene. The browser fixture now also records a rooted 12-frame local budget sample with warmup/steady-state timings and VSR logical residency. The committed reports are deliberately `BLOCKED`: the deterministic RAGF reference provider produced structurally valid candidate files with bound PBR textures and a decreasing three-level LOD sequence, but it did not supply all evidence required for an AAA production claim.

## RCL Gap

RCL currently does not own a proven universal art-asset primitive that directly expresses and executes all of the following as one canonical semantic:

- asset-family profiles spanning characters, creatures, props, vehicles, structures, environments, vegetation, resources and VFX;
- topology, UV, normal, PBR surface, rig, animation, LOD, collision and target-platform contracts;
- Provider selection, external execution, source/model/weight/license provenance and safe result materialization;
- independently verified provenance/license, art-direction, human-review, and quality proofs as non-substitutable acceptance evidence.
- multi-asset isolation, per-asset acceptance accounting, unified evidence coverage, and cross-asset artifact-root indexing without granting a batch authority to deduplicate or write RNCS truth.
- binding materialized Forge files to a reusable multi-asset assembly and lowering selected LOD/placement/cell references into a VSR import seam without granting VSR or the Provider canonical RNCS write authority.
- materializing a dependency-complete VSR catalog from separate mesh and PBR files, preserving byte roots across the streamer, and adapting external PBR channels into a glTF material without mutating the source GLB.
- a canonical performance-evidence primitive that separates warmup from sustained frames, binds timing/resource budgets to the same scene/frame roots, and keeps local-host measurements distinct from target-device/physical-telemetry claims.

The implementation therefore remains a downstream URRF/RNCS seam and records the missing capability instead of silently lowering it into another language or declaring RCL completion. Candidate absorption into RCL remains pending primitive/IR design, regression cases, K400 coverage and Integration Court decision.

## Stress Case

The same rooted forge contract was exercised against:

- a `character` profile using the existing deterministic RAGF 3D workspace;
- an `environment` profile whose Infinigen route resolves as `CONTRACT_ONLY` without silently executing;
- an injected Provider whose normalized result passes the existing Provider Job/Candidate/Production Court path;
- a `vehicle` profile with a contract-only TRELLIS.2 Provider, which fails closed as `PROVIDER_RUNTIME_NOT_EXECUTED`;
- a `vfx` profile with no matching Provider, which fails closed as `PROFILE_PROVIDER_UNRESOLVED` rather than borrowing a humanoid generator.
- a two-asset `character` + `prop` batch, which emits isolated child Forge workspaces, per-asset summaries, and a cross-asset artifact-root index while remaining `BLOCKED` when both AAA candidates lack external proof;
- the same two-asset batch assembled with `lod0`/`lod1` selection, integer millimeter placements, rehashed GLB/PBR files, a cell map, and a rooted VSR asset-stream projection;
- the same assembly materialized eight external PBR PNG dependencies, streamed all ten mesh/texture records through VSR dependency closure, decoded the actual PNG bytes, bound four channels per material, compiled two verified local CPU frames, rendered both imported scenes through the VSR CPU reference raster into decoded 160x160 PNG outputs with pixel roots and non-background counts, and composed those scenes into one aggregate VSR scene that submitted successfully through local Chromium WebGPU;
- the same aggregate scene submitted 12 consecutive local Chromium WebGPU frames, with one warmup frame and 11 steady-state frames; all frame roots matched the CPU frame root, logical texture/buffer residency stayed at 655,372 / 116,360 bytes, and steady-state uploads/evictions stayed at zero;
- a four-receipt evidence bundle, which verifies coverage and exact roots when all receipts are present and fails closed after artifact-root tampering.

The negative cases are part of the contract: a Provider result, a generated GLB, a local browser/runtime receipt, an invalid LOD sequence, Provider provenance/license/`quality_tier` metadata, or Provider `art_direction`/`human_review` declarations are not by themselves AAA acceptance or RNCS authority. A malformed materialized GLB, an unbound PBR material, an unbound/non-external provenance/license, review, or quality receipt, a metric-mismatched quality proof, duplicate/non-reducing LOD geometry, stale or tampered assembly file bytes, unsafe assembly paths, invalid LOD/placement selections, a tampered VSR metadata root, a tampered evidence-bundle root, or a tampered cross-asset index cannot be rescued by Provider `PASS` declarations.

## Donor Advantage and Reuse

`reality-asset-genesis-fabric` is the donor for Asset Intent/Genome, deterministic reference generation, Provider Adapter/Job lifecycle, external Provider manifests, Production Court and Evidence Ledger. The new URRF layer only adds the universal profile/representation/acceptance envelope, independent evidence-bundle coordination, batch indexing, and the explicit batch-to-assembly-to-VSR reference seam on top of those existing contracts. VSR remains the lowering/runtime consumer; RNCS remains canonical world owner.

## Regression Evidence

- `node --test packages/world/large-world-runtime/tests/universal-art-asset-forge.test.mjs`: `16/16 PASS`.
- `npm run test:gltf --workspace @taowind/visual-state-runtime`: `22/22 PASS`, including the external PBR binding adapter.
- `npm test --workspace @taowind/large-world-runtime`: `55/55 PASS`.
- `npm run test:large-world-universal-art-asset-forge`: package `55/55 PASS`, integration `2/2 PASS`.
- `python tests/large_world_universal_art_asset_forge_webgpu_browser_test.py`: actual local Chromium WebGPU `EXECUTED`, 12/12 frames submitted, device lost `false`, 2 draw calls, 1,444 triangles, 8 texture resources, and 10 material texture bindings; all GPU/CPU frame roots match, the performance budget is `PASS`, and the persisted performance root re-verifies.
- Existing URRF composition tests remain in the same package suite and continue to pass.
- RAGF full package regression: `212/212 PASS`; the Forge-side PBR audit validates the external four-map pack and GLB material structure without coupling palette changes to mesh roots.
- Schema validation: `PASS` for 15 schemas covering the Forge, persisted forge report, GLB inspection, independent provenance/license, review-receipt, quality-proof, evidence-bundle, batch, assembly, VSR projection, VSR payload materialization, VSR import-execution, VSR WebGPU report, VSR browser-receipt, and the sustained WebGPU performance envelope; generated envelopes validate with Draft 2020-12 and their roots reverify.
- Persisted evidence audit: `PASS` for the file-inspection, incomplete evidence-bundle, batch, assembly, VSR projection, VSR payload materialization, VSR import-execution, aggregate scene/CPU reference, VSR WebGPU report, Chromium browser-receipt, and sustained-performance packets; mesh/PBR payload roots, streamer receipt root, import roots, CPU frame roots, browser GPU receipt root, performance root, and CPU/GPU frame-root equality reverify, while the incomplete bundle remains fail-closed.
- `git diff --check`: no whitespace errors; only existing Windows LF/CRLF conversion warnings are reported.

## K400 / Nine-Gate Snapshot

For the committed reference run, the forge has:

| Gate | Status | Evidence boundary |
|---|---|---|
| EXPRESS | EVIDENCED | Universal Genome and profile contract are rooted. |
| COMPILE | EVIDENCED | RAGF intent/genome and provider resolution compile. |
| LOWER | EVIDENCED | RAGF/VSR workspace, Provider Adapter, multi-asset assembly, dependency-complete PBR catalog, and VSR projection paths are connected. |
| EXECUTE | EVIDENCED_CANDIDATE | Real local GLB/PBR files are rehashed and streamed; VSR GLB import, actual PNG decode, four-channel material binding, two local CPU frame compiles, two decoded CPU reference-raster outputs, and 12 actual local Chromium WebGPU submissions. Target-device execution remains open. |
| CORRECT | CANDIDATE | Roots, court, acceptance and ledger verify locally. |
| ROBUST | CANDIDATE | Missing runtime, missing profile and weakened evidence fail closed. |
| PERFORMANCE | EVIDENCED_CANDIDATE | 12-frame local Chromium WebGPU sample passes explicit timing, logical residency, no-eviction, and frame-root budgets; target-device, driver matrix, physical VRAM, and AAA budget proof remain open. |
| AI_GENERATE | NOT_PROVEN | No external model weights or real high-resolution AI generation were executed. |
| EVIDENCE | CANDIDATE | Report, Genome, Acceptance, GLB inspection, Evidence Ledger, multi-asset batch, assembly, dependency-complete VSR projection/materialization, CPU import report, browser receipt, sustained-performance report, and an explicit `INCOMPLETE` evidence-bundle packet are committed; no real approvals are present. |

## Next Promotion Blockers

1. Bind a real high-resolution Provider for at least one profile and execute it on the declared hardware.
2. Complete PBR/platform metrics on a real high-resolution Provider output and inspect every materialized LOD; the current local structural LOD audit is not device performance proof.
3. Supply independently authored provenance/license, art-direction, human-art, and quality-proof receipts bound to the candidate and file-inspection roots; none may be synthesized by the Provider. The current verifiers check contract/root/metric bindings and external-verifier declarations but do not prove legal clearance, reviewer identity, key custody, or target-device performance.
4. Audit dependencies, model weights, datasets and generated-asset licenses before any commercial release decision.
5. Repeat on a holdout asset set and submit the resulting Candidate Genome and regression evidence to Integration Court.
6. Execute the produced VSR projection through the target GPU/device path and independently verify material residency, scene correctness, frame budget, and production delivery; the current browser receipt and 12-frame performance packet prove only one local Chromium GPU host with VSR logical residency and CPU/GPU frame-root equality, not target-device performance, driver coverage, physical VRAM, or production delivery.
