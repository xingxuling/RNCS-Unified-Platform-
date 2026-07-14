# Cross-repository canonical source matrix

This matrix is the migration boundary for the RNCS, RCL and zhinao repositories. It records which repository owns each artifact and which copies are snapshots or downstream extensions.

| Artifact | Canonical source | RNCS embedded path | zhinao path | Current relation |
| --- | --- | --- | --- | --- |
| RCL language core | `xingxuling/RCL@main` | `packages/languages/reality-computation-language` | `vendor/rcl` | RNCS contains a downstream extension delta; zhinao is a vendored snapshot. Byte identity is not currently claimed. |
| RNCS suite contract | `xingxuling/RNCS-Unified-Platform-@main-95` | root `package.json`, `rncs.modules.json`, `VERSION-MANIFEST-v0.19.8.json` | consumed by bridge fixtures | RNCS-owned release metadata; downstream consumers must record the imported commit. |
| GameBrain bridge | `xingxuling/zhinao@tarot` | integration fixtures and adapters | `src/rcl-native`, `src/rncs` | zhinao-owned application/runtime integration; provider realization remains explicit opt-in. |

## Required synchronization rule

A change to the canonical RCL source must either:

1. update the RNCS embedded copy and zhinao vendor in the same migration; or
2. update their provenance files to declare the exact pending delta and keep the downstream verification gate red for byte-identity claims.

The current release uses option 2 for the embedded RCL extension delta and the zhinao Stage39 snapshot. See `VERSION-CONTRACT.json` and the downstream vendor contract for the exact boundary.
