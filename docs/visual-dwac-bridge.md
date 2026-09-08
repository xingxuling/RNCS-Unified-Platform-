# Visual Factory to DWAC local verification bridge

`scripts/verify-visual-dwac.py` consumes an actual RAGF Visual Factory result and its artifact files. It imports an explicitly selected DWAC checkout and executes DWAC's existing `ArtifactGraph`, `ArtifactOperationWorker`, `WorkerBus`, scheduler and content-addressed operation receipts. It does not copy or vendor DWAC source.

The audited donor is DWAC commit `73ded42` (full commit and selected source digests are recorded at execution). `CURRENT-STATUS.md` identifies the operation-binding graph path as available, with explicit host providers retaining execution and acceptance responsibility. The bridge uses that existing path without adding another scheduler or assigning visual semantics to DWAC.

## Executed dataflow

1. `verify-visual-output` passes exact factory-result bytes and actual artifact bytes through a DWAC operation contract into a local RNCS provider. The provider invokes the existing Node Visual IR/artifact validator. It checks the factory result seal, candidate status, receipt seals, terminal output-root binding, IR seal, and actual artifact byte length/digest. The external plan is identified by `plan_root`; this bridge does not independently load or re-execute that plan.
2. DWAC checks the provider result with explicit type-sensitive operation result checks. Its CAS operation plan binds the full input payload and exact source-file digest.
3. `accept-visual-binding` receives the verified visual root and source digest through DWAC's existing direct-dependency selectors. DWAC verifies the upstream result hash before this downstream operation executes.
4. The evidence embeds the graph result, CAS receipt records and their plans, because the temporary CAS directory is removed after the run. CAS locators in those records describe the original local run and are not persistent download URLs.

The negative self-test alters supplied artifact bytes in memory. The real verification operation rejects the mismatch; DWAC reports `EXECUTION_ERROR` for that unit and `DEPENDENCY_FAILED` for acceptance. The source artifact is preserved.

## Reproduction

From the RNCS checkout after generating `artifacts/visual-factory-v01/result.json` and `preview.svg`:

```powershell
python scripts/verify-visual-dwac.py --dwac-repo C:/Users/User/Documents/RCL/_worktrees/dwac-visual-source-audit-v01 --factory-result artifacts/visual-factory-v01/result.json --self-test --output artifacts/visual-factory-v01/dwac-bridge.json
```

`--artifact-dir` defaults to the factory result directory. Artifact IDs are interpreted as relative file paths within that directory; resolved paths outside it are rejected. All declared artifact bytes must exist, and this bridge requires at least one actual artifact. `--node` selects a compatible local Node executable. Python uses DWAC directly from the supplied checkout, so DWAC runtime dependencies must be available to that interpreter.

## Scope, ownership and gaps

This is actual local DWAC operation-graph execution over RNCS-generated visual bytes. DWAC owns scheduling, operation binding and receipts; the RNCS RAGF provider owns visual payload validation. RCL canonical decisions and promotion remain outside this local bridge. The `PASS` evidence status means the expected positive and negative test outcomes occurred, not a K400 all-gate ruling.

The existing DWAC `TimeFragmentRemoteArtWorkerProjection` is incompatible with arbitrary Visual Factory plans: it expects `REFERENCE_WAVE_BOUND_TO_ART_PROVIDER_RUNNER`, four fixed game slots, four reference views for each character asset, and specific `trellis2` / `make-it-animatable` / `ozz-animation` / `meshoptimizer` / `ktx-software` pipelines and worker labels. The bridge does not fabricate those references or relabel local validation as remote art generation.

Open gaps remain: generic Visual Factory stage-to-DWAC remote-art packet mapping, external worker/OPP6 execution, VSR lossless projection, perceptual acceptance and target hardware evidence. No model generation, remote/GPU execution, full-quality rendering, production deployment, canonical promotion or RCL-native execution is claimed by this script.

No root license grant was located in the audited DWAC checkout. This bridge is an external-path local interoperability test, with no donor source copied into RNCS; redistribution or absorption requires a separate license decision.
