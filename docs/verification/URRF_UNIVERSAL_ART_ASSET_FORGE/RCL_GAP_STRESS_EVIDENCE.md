# URRF Universal Art Asset Forge v0.1

## Status

`CANDIDATE_ONLY` / `AAA_NOT_PROVEN`

The forge now has a runnable Genome → Provider Resolution → Provider Job → Candidate → Production Court → local GLB inspection → AAA Acceptance → Evidence Ledger path. The committed report is deliberately `BLOCKED`: the deterministic RAGF reference provider produced structurally valid candidate files with bound PBR textures, but it did not supply all evidence required for an AAA production claim.

## RCL Gap

RCL currently does not own a proven universal art-asset primitive that directly expresses and executes all of the following as one canonical semantic:

- asset-family profiles spanning characters, creatures, props, vehicles, structures, environments, vegetation, resources and VFX;
- topology, UV, normal, PBR surface, rig, animation, LOD, collision and target-platform contracts;
- Provider selection, external execution, source/model/weight/license provenance and safe result materialization;
- independently verified art-direction and human-review receipts as non-substitutable acceptance evidence.

The implementation therefore remains a downstream URRF/RNCS seam and records the missing capability instead of silently lowering it into another language or declaring RCL completion. Candidate absorption into RCL remains pending primitive/IR design, regression cases, K400 coverage and Integration Court decision.

## Stress Case

The same rooted forge contract was exercised against:

- a `character` profile using the existing deterministic RAGF 3D workspace;
- an `environment` profile whose Infinigen route resolves as `CONTRACT_ONLY` without silently executing;
- an injected Provider whose normalized result passes the existing Provider Job/Candidate/Production Court path;
- a `vehicle` profile with a contract-only TRELLIS.2 Provider, which fails closed as `PROVIDER_RUNTIME_NOT_EXECUTED`;
- a `vfx` profile with no matching Provider, which fails closed as `PROFILE_PROVIDER_UNRESOLVED` rather than borrowing a humanoid generator.

The negative cases are part of the contract: a Provider result, a generated GLB, a local browser/runtime receipt, or Provider `art_direction`/`human_review` declarations are not by themselves AAA acceptance or RNCS authority. A malformed materialized GLB, an unbound PBR material, an unbound review receipt, or a review receipt with a non-external verifier cannot be rescued by Provider `PASS` declarations.

## Donor Advantage and Reuse

`reality-asset-genesis-fabric` is the donor for Asset Intent/Genome, deterministic reference generation, Provider Adapter/Job lifecycle, external Provider manifests, Production Court and Evidence Ledger. The new URRF layer only adds the universal profile/representation/acceptance envelope and connects those existing contracts to the large-world runtime. VSR remains the lowering/runtime consumer; RNCS remains canonical world owner.

## Regression Evidence

- `npm test --workspace @taowind/large-world-runtime`: `49/49 PASS`.
- `npm run test:large-world-universal-art-asset-forge`: package `49/49 PASS`, integration `1/1 PASS`.
- Existing URRF composition tests remain in the same package suite and continue to pass.
- RAGF full package regression: `212/212 PASS`; the Forge-side PBR audit validates the external four-map pack and GLB material structure without coupling palette changes to mesh roots.
- Schema validation: `PASS` for the Forge, persisted GLB inspection, and independent review-receipt schemas; generated Forge, inspection, and review receipts validate with Draft 2020-12.
- `git diff --check`: no whitespace errors; only existing Windows LF/CRLF conversion warnings are reported.

## K400 / Nine-Gate Snapshot

For the committed reference run, the forge has:

| Gate | Status | Evidence boundary |
|---|---|---|
| EXPRESS | EVIDENCED | Universal Genome and profile contract are rooted. |
| COMPILE | EVIDENCED | RAGF intent/genome and provider resolution compile. |
| LOWER | EVIDENCED | RAGF/VSR workspace and Provider Adapter paths are connected. |
| EXECUTE | EVIDENCED_CANDIDATE | Real local RAGF files, GLB inspection and injected-provider job execution. |
| CORRECT | CANDIDATE | Roots, court, acceptance and ledger verify locally. |
| ROBUST | CANDIDATE | Missing runtime, missing profile and weakened evidence fail closed. |
| PERFORMANCE | NOT_RUN | No target-device or sustained AAA budget proof. |
| AI_GENERATE | NOT_PROVEN | No external model weights or real high-resolution AI generation were executed. |
| EVIDENCE | CANDIDATE | Report, Genome, Acceptance, GLB inspection and Evidence Ledger are committed. |

## Next Promotion Blockers

1. Bind a real high-resolution Provider for at least one profile and execute it on the declared hardware.
2. Complete PBR/LOD/platform metrics on a real high-resolution Provider output and inspect every materialized LOD.
3. Supply independently authored art-direction and human-art review receipts bound to the candidate and file-inspection roots; neither may be synthesized by the Provider. The current verifier checks the receipt contract and external-verifier declaration but does not prove reviewer identity or key custody.
4. Audit dependencies, model weights, datasets and generated-asset licenses before any commercial release decision.
5. Repeat on a holdout asset set and submit the resulting Candidate Genome and regression evidence to Integration Court.
