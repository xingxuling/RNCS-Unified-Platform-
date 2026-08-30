# RAGF External Asset Provider Fabric v0.1

本模块把外部 3D 项目接入为 Provider / Organ，不把它们变成 RNCS Core 的权威来源。

## Authority chain

Asset Intent → Asset Genome → Capability Negotiation → Provider Selection → Asset Generation Job → Asset Provider Result → Asset Candidate → RNCS Asset Production Court → VSR Projection Gate / RSR Simulation Gate → Living Asset Family Candidate → RNCS Integration Court → Commit Request。

Provider success is evidence input, not RNCS success.

## Provider contract

asset-provider-manifest.v0.1.schema.json 固化：

- id、name、provider version、provider type；
- capabilities、input formats、output formats；
- local / remote / external-process / api / container execution mode；
- hardware requirements 与 ComputeRequirement；
- license、commercial policy、provenance policy；
- runtime status 与 upstream revision；
- provider authority 必须是 candidate-only，不能拥有 authoritative world state。

AssetGenerationJob 状态只允许：

QUEUED → PREPARING → RUNNING → VALIDATING → COMPLETED

任意执行阶段可以进入 FAILED/CANCELLED；终态不能被静默改写。

## Provider organs

- TRELLIS.2：production image-to-3D、mesh、PBR；默认运行状态为 CONTRACT_ONLY。
- Infinigen：terrain、vegetation、rock、building、room、furniture、environment；seed 与 procedural parameters 必须保留。
- Make-It-Animatable：rig、skin、initial pose；Rig Quality Gate 与 Animation Smoke Test 必须通过。
- TripoSR：PREVIEW 3D；不能把 preview candidate 标记为 production。
- TripoSF：geometry refinement；不是主 generator。
- Spark 2.1.0：Gaussian representation ingress/conversion、procedural splat、SDF edit、LoD build、RAD/RADC packaging，以及纯视觉的 render/stream/paged residency/raycast/XR/portal capability。它通过现有 Provider Fabric 产出 `RepresentationRef` candidate；不拥有 canonical world state，也不被标记为已执行 runtime。

当前仓库只提交 adapter、manifest、contract、test runner seam 和 provenance，不 vendoring 外部 Python/CUDA/Blender/model weights。

`RepresentationRef` 是 RNCS Core 密封的 candidate-only 引用，可携带 representation kind/profile、detail policy、residency policy、provider/provenance/evidence root。VSR 只把它消费成 visual binding；RSR 只能提出 ingress/raycast/bounds/LoD/residency observation candidate。二者都不能把 Spark 输出升级成 canonical geometry、physics、semantic state 或世界提交。

## Production Court

Court 至少检查 Geometry、Topology、Material/PBR、Rig、Animation、Collision、LOD/Platform Budget、License、Provenance、VSR Projection、RSR Simulation 与 Quality Tier。

失败结果只能是 Reject / Regenerate / Repair。只有 Court PASS、商业依赖审计通过并且 RNCS authority 明确批准，才可以生成 commit request。

## ALWR boundary

GameBrain/ALWR 只产生 ragf.asset-requirement.v0.1。例如 village needs blacksmith 会产生 world seed、world event、role、capabilities 与 quality tier；RAGF 返回 placement candidate，不直接修改 authoritative world state。

RAGF 通过 laf-bridge.mjs 生成 LAF package binding candidate，记录 artifact root、content root、文件清单和 evidence ledger root；这一步仍然要求 LAF runtime 验证与 RNCS commit，不把候选绑定误称为已提交的 LAF authoritative artifact。

## Runtime boundary

在没有用户提供的 external process、model weights、GPU runtime 或 worker 时，adapter 返回：

CONTRACT_VERIFIED_RUNTIME_NOT_EXECUTED

这不是 PROVIDER VERIFIED，也不是 PRODUCTION PASS。
