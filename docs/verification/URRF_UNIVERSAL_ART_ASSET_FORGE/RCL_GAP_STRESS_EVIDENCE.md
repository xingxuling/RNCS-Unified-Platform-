# URRF Universal Art Asset Forge v0.1

## Status

`CANDIDATE_ONLY` / `AAA_NOT_PROVEN`

The forge now has a runnable Genome → Provider Resolution → Provider Job → Candidate → Production Court → AAA Acceptance → Evidence Ledger path. The committed report is deliberately `BLOCKED`: the deterministic RAGF reference provider produced real candidate files, but it did not supply all evidence required for an AAA production claim.

## RCL Gap

RCL currently does not own a proven universal art-asset primitive that directly expresses and executes all of the following as one canonical semantic:

- asset-family profiles spanning characters, creatures, props, vehicles, structures, environments, vegetation, resources and VFX;
- topology, UV, PBR surface, rig, animation, LOD, collision and target-platform contracts;
- Provider selection, external execution, source/model/weight/license provenance and safe result materialization;
- art-direction and human-review receipts as non-substitutable acceptance evidence.

The implementation therefore remains a downstream URRF/RNCS seam and records the missing capability instead of silently lowering it into another language or declaring RCL completion. Candidate absorption into RCL remains pending primitive/IR design, regression cases, K400 coverage and Integration Court decision.

## Stress Case

The same rooted forge contract was exercised against:

- a `character` profile using the existing deterministic RAGF 3D workspace;
- an `environment` profile whose Infinigen route resolves as `CONTRACT_ONLY` without silently executing;
- an injected Provider whose normalized result passes the existing Provider Job/Candidate/Production Court path;
- a `vehicle` profile with a contract-only TRELLIS.2 Provider, which fails closed as `PROVIDER_RUNTIME_NOT_EXECUTED`;
- a `vfx` profile with no matching Provider, which fails closed as `PROFILE_PROVIDER_UNRESOLVED` rather than borrowing a humanoid generator.

The negative cases are part of the contract: a provider result, a generated GLB, or a local browser/runtime receipt is not by itself AAA acceptance or RNCS authority.

## Donor Advantage and Reuse

`reality-asset-genesis-fabric` is the donor for Asset Intent/Genome, deterministic reference generation, Provider Adapter/Job lifecycle, external Provider manifests, Production Court and Evidence Ledger. The new URRF layer only adds the universal profile/representation/acceptance envelope and connects those existing contracts to the large-world runtime. VSR remains the lowering/runtime consumer; RNCS remains canonical world owner.

## Regression Evidence

- `npm test --workspace @taowind/large-world-runtime`: `46/46 PASS`.
- `npm run test:large-world-universal-art-asset-forge`: package `46/46 PASS`, integration `1/1 PASS`.
- Existing URRF composition tests remain in the same package suite and continue to pass.
- Schema JSON parse: `PASS` for `schemas/universal-art-asset-forge.v0.1.schema.json`.
- `git diff --check`: no whitespace errors; only existing Windows LF/CRLF conversion warnings are reported.

## K400 / Nine-Gate Snapshot

For the committed reference run, the forge has:

| Gate | Status | Evidence boundary |
|---|---|---|
| EXPRESS | EVIDENCED | Universal Genome and profile contract are rooted. |
| COMPILE | EVIDENCED | RAGF intent/genome and provider resolution compile. |
| LOWER | EVIDENCED | RAGF/VSR workspace and Provider Adapter paths are connected. |
| EXECUTE | EVIDENCED_CANDIDATE | Real local RAGF files and injected-provider job execution. |
| CORRECT | CANDIDATE | Roots, court, acceptance and ledger verify locally. |
| ROBUST | CANDIDATE | Missing runtime, missing profile and weakened evidence fail closed. |
| PERFORMANCE | NOT_RUN | No target-device or sustained AAA budget proof. |
| AI_GENERATE | NOT_PROVEN | No external model weights or real high-resolution AI generation were executed. |
| EVIDENCE | CANDIDATE | Report, Genome, Acceptance and Evidence Ledger are committed. |

## Next Promotion Blockers

1. Bind a real high-resolution Provider for at least one profile and execute it on the declared hardware.
2. Emit independently checkable topology and UV validation, plus complete PBR/LOD/platform metrics.
3. Add art-direction comparison and a human review receipt; neither may be synthesized by the Provider.
4. Audit dependencies, model weights, datasets and generated-asset licenses before any commercial release decision.
5. Repeat on a holdout asset set and submit the resulting Candidate Genome and regression evidence to Integration Court.
