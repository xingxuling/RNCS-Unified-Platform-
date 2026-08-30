# Spark 2.1.0 Representation Provider v0.1

状态：`CONTRACT_INTEGRATION_CANDIDATE`。本文记录仓库内的接口与边界，不宣称 Spark runtime、GPU、浏览器渲染、训练或重建已经运行。

## Archaeology baseline

- Candidate branch base: `origin/main-95` at `d345ecb9d8801a911f37534f40d7b9fdf5badb16`.
- Supplied archive: `C:\Users\User\Downloads\spark-2.1.0.zip`, SHA-256 `b84591632a623b9db9fa227473fa2ea03f48f03b3239caaa599d085962fdaed3`.
- Archive root license: MIT, Copyright © 2025 WORLD LABS TECHNOLOGIES, INC.
- Source-grounded capability boundary: Gaussian ingress/conversion, procedural splats, Dyno GPU graph, SplatEdit/SDF, `build-lod`, RAD/RADC packaging, visual render/stream/paged residency/raycast/XR/portal.
- Explicit non-claims: image-to-Gaussian training, COLMAP/SfM, camera-pose estimation, and complete semantic reconstruction are not supplied by this integration.

The supplied URRF document is treated as `CANDIDATE_ARCHITECTURE / DOC-ONLY`; it does not upgrade these local contracts to a universal reality engine claim.

## Owner and transition boundary

| Layer | Existing owner | Spark-related responsibility | Prohibited promotion |
|---|---|---|---|
| RNCS Core | canonical world state and authority | seals `RepresentationRef`, receives a later commit request | Provider/VSR/RSR authoritative mutation |
| RAGF | asset/representation candidate fabric | first-class external Spark provider manifest, result and candidate evidence | a second provider fabric or direct commit |
| VSR | visual/projection state | checks manifest/reference and creates a `NOT_EXECUTED` visual binding | semantic/physics/world truth |
| RSR | simulation/reconstruction observation boundary | emits ingress/raycast/bounds/LoD/residency observation candidates | canonical geometry, physics, semantic reconstruction, direct promotion |
| Spark | external Gaussian provider | source-referenced representation/visual capability | RNCS truth, authority or automatic runtime proof |

The only allowed path is:

`Provider Result -> Representation/Asset Candidate -> VSR or RSR Gate -> RNCS Court/Authority -> Commit Request -> authorized canonical mutation`.

No step above has been treated as a real Spark execution receipt.

## Representation contract

`rncs.representation-ref.v0.1` is generic across `gaussian-splats`, mesh, voxel, SDF, audio or later kinds. It requires:

- provider identity/root, content root, provenance and evidence;
- `RepresentationProfile` for encoding/fidelity/formats;
- `DetailPolicy` and `ResidencyPolicy` rather than a Spark-specific pager;
- `candidate_only: true`, `authoritative: false`, `commit_status: NOT_COMMITTED` and explicit authority scope.

Spark declares two source-grounded profiles (`PackedSplats`, `ExtSplats`) and describes hierarchy/paged residency as provider-owned implementation detail. Existing VSR spatial asset streaming remains the host-side asset-streaming mechanism; this change does not create a competing Fabric or replace Spark source.

## RCL classification and stress extraction

| Classification | Scope | Evidence / boundary |
|---|---|---|
| `RCL_NATIVE` | existing provider/evidence/authority separation | no new RCL primitive is claimed here |
| `RCL_LOWERING` | representation reference to VSR/Spark visual operations | Spark/WebGL/THREE.js/Dyno implementation remains below the semantic boundary |
| `RCL_GAP` | `RCL_GAP_REPRESENTATION_POLICY_V0_1` | governed representation transition with equivalence, detail and residency policy is not found as a single current RCL primitive |
| `NON_RCL_OWNER` | Spark renderer, splat pager, RAD/RADC encoding, GPU runtime | retained as external provider implementation |

No RCL Core source was changed. The gap record is:

```text
task: Spark 2.1 representation-provider integration
missing_capability: governed representation transition with equivalence/detail/residency policy
workaround: RNCS candidate RepresentationRef plus VSR visual and RSR observation consumers
donor: Spark 2.1 LoD hierarchy and paged residency structure
gap_type: primitive/profile/runtime-policy seam
generality: Gaussian, mesh, voxel, SDF and audio representations
candidate_absorption: NOT_APPLIED_TO_RCL_CORE
affected_k400_cells: UNMAPPED_PENDING_CANONICAL_MATRIX
```

This is a stress case and regression target, not a K400 PASS declaration.

## Evidence status

Local contract tests are recorded in `docs/verification/SPARK_REPRESENTATION_PROVIDER_LOCAL_CONTRACT_EVIDENCE_v0.1.md`. They establish source/build/contract behavior only. `Spark runtime`, a user-installed provider, WebGL/XR/GPU behavior, browser visual acceptance, asset licenses beyond Spark root code, source training/reconstruction, production deployment, CI, and RNCS authority approval remain `NOT_RUN` / `NOT_DEPLOYED` / `NOT_GRANTED` as applicable.
