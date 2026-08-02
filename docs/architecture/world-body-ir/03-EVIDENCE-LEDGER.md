# Evidence Ledger

Generate the sealed ledger from source:

```bash
npm run evidence:world-body
```

Committed deterministic evidence lives in `docs/verification/world-body-v0.1/`:

| Evidence | Current result | Meaning |
| --- | --- | --- |
| `codegen-evidence.json` | PASS | declaration recompiles to the committed seven-artifact manifest |
| `formal-proof-bundles.json` | 43 PASS, 0 FAIL, 3 UNVERIFIED | all executable RSR/VSR/WB reference theorems pass; three external claims stay open |
| `rcl-kernel-evidence.json` | PASS | the exercised RCL subset compiles and has reference/native-VM state-root parity |
| `production-differential.json` | 12 PASS, 0 FAIL | selected real RSR/VSR production path refines declared observables |
| `external-boundaries.json` | UNVERIFIED | real GPU/pixels, external physics, lossy network, providers, and target hardware remain open |
| `world-body-evidence-ledger.json` | sealed | claim-to-evidence index and maturity decision |
| `validation-summary.json` | PASS_WITH_EXTERNAL_BOUNDARIES | compact machine-readable result |

`docs/verification/world-body-v0.1/VALIDATION.md` records the broader package and release checks from the candidate run. It is a run record, not part of the deterministic sealed theorem ledger.

Maturity is computed, not handwritten:

- executable reference theorem failure -> `Blocked`;
- incomplete executable reference closure -> `Candidate`;
- exactly one sealed, domain-consistent RSR, VSR, and WORLD_BODY bundle, each closing executable levels L1-L5 -> `F4 Verified`;
- sealed partial production differential, or sealed full differential with open external coverage -> `F4.5 Partial Production Parity`;
- sealed `FULL_PRODUCTION_DIFFERENTIAL` plus one unique sealed `EXTERNAL_BACKEND` PASS for every named required gate (full World Body native VM, external physics, real distributed network, production assets, target GPU/pixels, and target hardware) -> `F5 Differentially Verified`.

Current verdict: **F4.5 Partial Production Parity**.
