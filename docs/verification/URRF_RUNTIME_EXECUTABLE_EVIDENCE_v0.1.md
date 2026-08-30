# URRF Executable Representation Runtime Evidence v0.1

Date: 2026-08-31

## Request boundary

User priority: run the Universal Reality Representation Fabric first.

The supplied v0.3 document is treated as a candidate architecture and route, not as proof that a universal engine already exists. This slice therefore closes the provider-neutral representation runtime path before expanding the broader world-truth, distributed, power, or second-world layers.

## Source and ownership

- Repository: `xingxuling/RNCS-Unified-Platform-`
- Target branch: `main-95`
- Source before this slice: GitHub `main-95` merge commit `3cb58ccad5d28d175443989dc4c8f1dcf70fc5e6`.
- Candidate branch: `codex/urrf-runtime-v01`.
- Runtime package: `packages/world/reality-representation-fabric`.
- Canonical owner: RNCS owns `RealityObject` identity, `state_root`, `RepresentationRef`, authority, and transition semantics. URRF owns the provider-neutral registry, selection, materialization boundary, and derived active representation. VSR/RAGF/provider adapters remain auxiliary execution organs.

## Executable route

```text
RealityObject(state_root, content_root)
  -> verified RepresentationRef registry
  -> deterministic Detail + Residency selection
  -> provider-neutral materialization plan
  -> injected provider adapter or explicit NOT_EXECUTED
  -> sealed MaterializationReceipt
  -> candidate transition apply
  -> candidate rollback
```

The runtime never promotes a representation to canonical world truth. Every plan, receipt, and transition keeps `candidate_only=true`, `authoritative=false`, `commit_status=NOT_COMMITTED`, and `provider_can_write_authoritative_world_state=false`.

## Verification command

```text
npm run test:urrf-runtime
```

Expected bounded result from a fresh candidate worktree:

- URRF package runtime tests: `5/5 PASS`.
- VSR build prerequisite: `PASS`.
- Root integration: `1/1 PASS`.

The root integration registers the supplied Spark provider as contract-only and a generic Mesh provider with an injected VSR glTF CPU reference adapter. The adapter imports a one-triangle glTF fixture, verifies the import receipt, compiles and verifies a `64x64` spatial frame, and emits a real reference-render pixel root. The same `RealityObject` then selects the Mesh representation, records an `EXECUTED` receipt, keeps Spark explicitly `NOT_EXECUTED`, applies a Gaussian-to-Mesh candidate handoff, and rolls it back to the source representation.

## What is proven

`URRF_RUNTIME_GENERIC_EXECUTABLE_PASS`:

- Two different representation kinds can be registered against one stable `RealityObject` and one shared `content_root`.
- Detail and residency policies are retained as independent roots in the materialization plan.
- A provider-neutral adapter receives a read-only authority envelope and can return an output root that is sealed into a receipt.
- A provider without an adapter cannot fake execution; the runtime emits `NOT_EXECUTED` with `PROVIDER_RUNTIME_NOT_EXECUTED`.
- Candidate transitions use the existing RNCS transition contract, and the active derived representation can be applied and rolled back without changing the canonical object root.
- A fabric snapshot is sealed and exposes active representation state separately from canonical identity/state.

`URRF_VSR_MESH_REFERENCE_EXECUTED`:

- The Mesh adapter exercised the repository's glTF importer and VSR spatial reference renderer, not a mock output.
- glTF receipt and spatial frame verification passed before the materialization receipt was accepted.

## Explicit non-claims

- Spark `@sparkjsdev/spark` is not installed in the RNCS dependency graph; its provider remains contract-only in this run. No real RAD/RADC page stream, Spark browser/GPU, or asynchronous depth-readback proof is claimed.
- The Mesh path is the repository's injected CPU reference runtime, not a separate external Mesh provider or hardware-GPU certification.
- Selection has deterministic policy roots but no production cost model, virtual-memory paging, distributed residency, power governor, or multi-node authority lease yet.
- Transition equivalence is candidate-level identity/authority evidence; no collision, behavioral, temporal, or full physical equivalence is asserted.
- No canonical RNCS commit, authority promotion, production deployment, hosted CI success, or release claim was performed.

## RCL / K400 evidence boundary

- RCL/RNCS owner: representation identity, authority separation, state/content roots, transition, rollback, and evidence semantics.
- Auxiliary URRF runtime: provider registry, detail/residency choice, adapter invocation, and derived active representation.
- No silent RCL bypass was introduced. Provider adapters are explicitly prevented from asserting authoritative mutation.
- K400 mapping remains `UNMAPPED_PENDING_CANONICAL_MATRIX`; this focused runtime proof does not declare any K400 gate PASS.

## Next executable gate

Add a real provider-side streamed representation fixture (Spark RAD/RADC or an independently executed non-Gaussian provider), then bind its execution receipt into the same generic materialization and transition path. Keep distributed replication, property/law materialization, and production authority promotion as separate gates.
