# RNCS Large World WebGPU Gate v0.1

Date: 2026-08-31

## Scope

This gate closes the specific gap between the new RNCS Large World Region/Truth runtime and the already-existing VSR spatial WebGPU executor.

It does **not** introduce WebGPU as a canonical RNCS truth mechanism. Canonical ownership remains:

- RNCS: world identity, canonical state, World Time, World Event/Fact truth and authority.
- URRF: representation selection/materialization.
- VSR: visual projection.
- WebGPU: VSR lowering / auxiliary execution runtime.

The provider projection is required to keep `provider_can_write_authoritative_world_state=false` and `canonical_state_mutated=false`.

## Diagnosis

Current `main-95` already contains and has prior real-Chromium evidence for `VSRSpatialWebGPUExecutor`, including submitted frames with `deviceLost=false`, material texture bindings, GPU shadow maps and bounded OIT/SSGI/irradiance/temporal paths.

The newly added `tests/large-world-runtime.integration.test.mjs`, however, still proves its 9x9-region projection with `renderSpatialReference`, i.e. the deterministic CPU reference renderer. The missing connection is therefore **Large World -> VSR Spatial WebGPU**, not a missing WebGPU backend.

## Candidate route added

```text
RNCS LargeWorldRuntime
  -> 9x9 deterministic region
  -> 9 active chunks
  -> authority-gated World Event / Fact truth
  -> URRF materialization receipts
  -> VSR spatial scene + asset-streaming frame plan
  -> VSRSpatialWebGPUExecutor
  -> real browser GPU submission receipt + screenshot hash
```

Files:

- `scripts/generate-large-world-webgpu-fixture.mjs`
- `apps/reality-studio/tests/browser_large_world_webgpu_test.py`

The fixture generator asserts that the RNCS runtime snapshot is unchanged by representation/frame compilation and that provider authoritative-world write capability stays false.

The browser gate requires:

- `navigator.gpu` available;
- a real `GPUAdapter`;
- successful `VSRSpatialWebGPUExecutor.create(canvas)`;
- `receipt.submitted === true`;
- `receipt.deviceLost === false`;
- WebGPU `frameRoot` equal to the deterministic VSR frame-plan root;
- valid WebGPU receipt root;
- the same nine-chunk asset-streaming root;
- non-zero draw calls and triangles;
- no page, request, WGSL, pipeline or command-buffer errors;
- a non-empty screenshot with SHA-256 evidence.

## Execution command

```text
python apps/reality-studio/tests/browser_large_world_webgpu_test.py
```

The script first builds VSR and generates a fresh Large World fixture from repository code, then launches Chromium/Chrome through Playwright and writes:

```text
output/playwright/RNCS_LARGE_WORLD_WEBGPU.json
output/playwright/RNCS_LARGE_WORLD_WEBGPU.png
```

On success the evidence status is:

```text
RNCS_LARGE_WORLD_WEBGPU_PROJECTION_PASS
```

## Current evidence boundary

`HARNESS_READY_FRESH_BROWSER_RUN_PENDING`.

The current chat execution host cannot be used as the fresh browser proof because its installed Chromium is governed by a managed `URLBlocklist=["*"]`, which blocks the localhost Reality Studio page before WebGPU execution. The connected Developer Execution Runtime was also unavailable during this attempt with an upstream `502`.

This host limitation is not treated as a product-runtime failure and no new WebGPU PASS is claimed from it. Existing VSR real-Chromium evidence remains valid only for its previously recorded bounded paths until this new Large World gate is executed on a browser host that permits localhost navigation.

## RCL / K400 boundary

No new RCL semantic gap is required for this connection. WebGPU is a professional lowering/runtime organ under VSR, while RNCS/RCL retain identity, authority, evidence and commit semantics. No silent RCL bypass was introduced.

K400 remains unmapped for this focused gate; a successful browser projection is not a K400 PASS declaration.
