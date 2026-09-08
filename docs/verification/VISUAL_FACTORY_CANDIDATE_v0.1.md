# Visual Factory candidate v0.1

Base: RNCS origin/main-95 `35744cc`, fetched 2026-09-08. Branch: `codex/visual-factory-v01`.

## Reality audit and ownership

The initial RCL directory belongs to a different dirty product branch. Work is isolated in this RNCS worktree. Current upstream was fetched and open PRs inspected. Historical worktrees were not treated as current source. This checkout has no CURRENT-STATUS; RAGF STATUS.md, package manifests and source were inspected. Its status text predates the package version and is not new execution evidence. Actual OPP and DWAC repositories were discovered under the user's GitHub account, cloned and audited: OPP `168e55bd071fe63c24ee71cd43d1573770e884b2`, DWAC `73ded42`. OPP's six-protocol family uses RCP for capability declarations and RXP for exchanges.

Reuse: RNCS RepresentationRef and its candidate authority boundary; RAGF manifest identity, canonical sealing, task state machine; existing VSR presentation IR. No renderer, provider identity system or world authority is replaced. VSR retains presentation/time projection ownership; the new asset-generation IR is a candidate payload, with lossless VSR projection still missing.

## Implemented slice and remaining work

| Request | Local implementation | Unproven / missing |
|---|---|---|
| URRF families | Shared registry adds character-mesh, layered-2d, gaussian-character, neural-visual, cinematic-character; schemas and references updated | Family-specific renderer, Gaussian/neural runtime and cinematic quality |
| Visual IR | Versioned asset payload, JSON Schema, identity reference, geometry/material assignments, bone/layer graphs, provenance, byte artifacts, deterministic root | UV, skin weights, facial rig, temporal constraints, learned representation payload validation, lossless VSR lowering |
| OPP6 profile | Six operation declarations bound to manifest root; actual RCP/RXP wire export, verified by the upstream OPP Python schema/integrity validator | Live model discovery/handshake and upstream profile adoption; domain extension remains candidate |
| Factory | Deterministic provider selection, sequential stages, RAGF lifecycle, timeout/failure, replay, URRF references; actual RCL governed Host Call and DWAC local verification graph | Native RCL visual lowering, remote DWAC generation/transport, durable job recovery |
| Closed loop | Identity binding, indexed nondegenerate triangles, material references, acyclic graphs, SHA-256 byte verification, repeated local execution | Perceptual character identity, professional topology/material/rig quality, cross-view/frame visual consistency, hardware/model reproducibility |

Provider capability declarations are claims, not quality evidence. Test adapters for six operations produce fixture bytes, not six professional visual algorithms. The runnable demo executes RCL source through its JS reference runtime and existing Provider Runtime v2 policy, calls the local triangle-to-SVG provider, verifies bytes and repeats execution. No external model provider is invoked. Host adapters are trusted executable code: the in-process timeout aborts cooperatively and stops further stages, but cannot kill a non-cooperative adapter. Process isolation/durable lifecycle is a separate missing runtime capability. Plan bridge labels describe available adapters, not evidence that each adapter was invoked; separate RCL and DWAC receipts record actual invocations.

## Reproduce

```powershell
npm install --ignore-scripts --package-lock=false --no-audit --no-fund
npm test --workspace @taowind/rncs-core-contract
$env:OPP_SOURCE_ROOT='C:/path/to/OPP'
npm test --workspace @taowind/reality-asset-genesis-fabric
node packages/world/reality-asset-genesis-fabric/scripts/visual-factory-demo.mjs
python -B scripts/verify-visual-dwac.py --dwac-repo C:/path/to/DWAC --factory-result artifacts/visual-factory-v01/result.json --self-test --output artifacts/visual-factory-v01/dwac-bridge.json
```

Outputs under `artifacts/visual-factory-v01`: `preview.svg`, `plan.json`, `result.json`, `visual-factory.rcl`, `rcl-execution.json`, `opp-capabilities.json`, `dwac-bridge.json`. Each result binds plan, selected provider/profile, stage input/output, job history, verification and RepresentationRef. Demo result root: `cec955807b0d5f3d05642932620504ff4e331cffec515032daf8ab2fc574c24b`. The fixed OPP issue time is fixture input, not an external trusted timestamp.

Validation includes unknown capability rejection, duplicate providers, stale/tampered profiles, modified/resealed plans, identity drift, corrupt/missing/extra artifact bytes, degenerate/index-invalid geometry, cyclic bones/layers, timeout, unavailable adapters, nondeterministic replay, caller mutation, adapter-owned result mutation, and unique IDs for repeated operations. Full test counts and logs are recorded with the delivered evidence, not inferred from old STATUS.md.

Local verification: RAGF **233/233**, no skips, exit 0; core package all suites exit 0, including 48 final node:test cases and 7 representation-reference cases; existing RCL Provider Runtime v2 regression 7/7. RAGF final test log is `artifacts/visual-factory-v01/ragf-tests.log`. Actual OPP validator accepted all 7 Unicode test envelopes and rejected all 7 ID-tampered envelopes; requires Python with jsonschema and the explicitly selected OPP checkout. Actual DWAC WorkerBus/ArtifactGraph/CAS verification returned CANDIDATE → CANDIDATE; tampered bytes produced EXECUTION_ERROR → DEPENDENCY_FAILED. Saved result/receipt seals and URRF references independently verified. `git diff --check` passed. Independent Draft 2020-12 validation accepted demo input/output Visual IR and the capability profile; actual OPP validation accepted both saved demo envelopes. Evidence: wire-validation.json. This covers these documents, not exhaustive schema-language equivalence. No performance gate is inferred from test duration.

## RCL stress and gap ledger

```text
task: URRF / Visual IR / OPP6 / Visual Factory
gap_id: RCL_GAP_VISUAL_FACTORY_LOWERING_V01
missing_capability: native typed visual production lowering, remote visual generation and durable worker lifecycle
workaround: RNCS candidate asset IR + existing RAGF mechanisms + RCL JS reference Host Call + DWAC local verification sidecar
donor: VSR spec; RAGF job/manifest; RNCS representation-ref; OPP RCP/RXP; DWAC ArtifactOperationWorker; RCL Provider Runtime v2
donor_advantage: projection IR, provider/evidence binding, wire validation, dependency-failure propagation and governed host invocation
gap_type: IR / Profile / Runtime integration
generality: multi-format visual assets and staged provider workflows
candidate_absorption: NOT_APPLIED_TO_RCL_CORE
affected_k400_cells: K055 windows/media; K395 rncs-runtime/media; K396 rncs-runtime/automation; K397 rncs-runtime/security-sensitive
stress_cases: cross-stage identity drift; stale capability declarations; mutable replay artifacts; uncooperative provider timeout
regressions: visual-factory.test.mjs; visual-ir.test.mjs; representation-ref.mjs
lowering_provider_evidence: RCL JS reference Host Call to actual local SVG provider; actual OPP schema validation; actual DWAC local verification graph
```

Canonical K400 mapping was retrieved from xingxuling/RCL at a7d6f7b0844323df50c91fd807ad3ee76e24f90d, src/universal-program-stress.mjs (Git blob cda97a5606256df201d04edc899e75f3317e3921). Its environment-major 20×20 rule maps this stress to K055 windows/media, K395 rncs-runtime/media, K396 rncs-runtime/automation and K397 rncs-runtime/security-sensitive. These are proposed workload mappings; every canonical gate remains UNVERIFIED, and local observations below do not alter the upstream ledger. Nine independent gate statuses: EXPRESS=CANDIDATE_ASSET_IR_AND_RCL_HOST_CALL; COMPILE=NATIVE_NOT_RUN; LOWER=REFERENCE_HOST_ADAPTER_ONLY; EXECUTE=LOCAL_SVG_AND_DWAC_VERIFICATION; CORRECT=LOCAL_CONTRACT_TESTS_ONLY; ROBUST=BOUNDED_NEGATIVE_TESTS_ONLY; PERFORMANCE=NOT_RUN; AI_GENERATE=NOT_RUN; EVIDENCE=LOCAL_RECEIPTS_ONLY. No overall K400 promotion.

License audit: original changes reuse Apache-2.0 repository code and Node built-ins; one existing RCL workspace dependency was declared, with no new third-party package, donor source copy, model weights or training data. OPP/DWAC GitHub metadata did not identify a license: they remain explicitly selected external checkouts used for local interoperability, not vendored or redistributed. Existing provider license strings are not re-audited by this work. No external model/commercial rights claim.

Integration review found and fixed asynchronous plan/result mutation, repeated-stage job-ID collisions, and RCL outer-timeout cancellation propagation, with dedicated regressions. Status is `LOCAL_CANDIDATE_EXECUTED`, not full infrastructure VERIFIED. Merge, hosted CI, post-merge verification, deployment, RCL promotion and human visual acceptance remain NOT_RUN / NOT_GRANTED.
