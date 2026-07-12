# SKILL Delivery Speed v0.7

## Measurement boundary

- Baseline: v0.6 observational delivery record, `52.91` historical minutes and `1.435x` reported speedup.
- Current measurement: recoverable post-container-reset wall-clock interval from `2026-07-02T21:36:47+00:00` to `2026-07-02T22:39:04.461570+00:00`.
- Recoverable current active interval: **62.29 minutes** at this report snapshot.
- The pre-reset interval was lost with the container and is not reconstructed. Therefore current raw/adjusted values below are **upper bounds**, not exact end-to-end speedups.
- This is not a randomized A/B test.

## Stage record

| Stage | Observed minutes | Evidence / boundary |
|---|---:|---|
| Load Skill and baseline | 0.80 | Skill extraction and v0.6 archive restored before first bridge source write |
| Codebase archaeology | 0.18 | Baseline/entry/interface decision completed before executable contract implementation |
| Architecture and plan | 0.20 | Engineering contract and minimum modification surface fixed before compiler implementation |
| Core development | 2.80 | Contract/compiler/runtime/Gateway/cockpit reconstructed through first cockpit source timestamp |
| Test and repair | 18.23 | First RSR/VSR/Network split regression through post-review unified integration |
| Full regression and product builds | 2.93 | HNAC/HNAF, AetherFusion, CSL and product build overlap normalized from recorded logs |
| Documentation and release review | 8.52 | Test report and release verification timestamps |
| GitHub submission | 27.67 | Branch, Git tree commit and PR creation; includes connector safety retries |
| ZIP build and clean-extract verification | 1.58 | Candidate archive, Unicode-path fix, clean extraction and critical-runtime retest |

The stage rows are based on file/log/connector timestamps. Several test/build stages overlap, so their sum is not treated as a synthetic stopwatch total.

## Comparison

| Metric | Value |
|---|---:|
| historical baseline minutes | 52.91 |
| current recoverable active minutes | 62.29 |
| raw speedup upper bound | 0.849x |
| test-volume-adjusted speedup upper bound | 0.864x |
| exact adjusted speedup | Not estimable after the container reset |

The test-volume adjustment uses `52.91 × (1267 / 1246) ÷ current_minutes`. It only adjusts for direct test count and does not pretend that test count fully represents the larger v0.7 scope.

## Where time was saved

- Skill routing fixed the sequence: archaeology → architecture decision → engineering contract → implementation → review → release.
- Codebase archaeology prevented rebuilding RSR v0.7, Network v0.2 and VSR v0.6.
- Existing authoritative-state, reconciliation and temporal-presentation protocols were reused directly.
- Automated split regression isolated environment failures from feature failures.
- Release scripts made cleanliness and archive validation repeatable.

## Where time was not saved

- Full regression, frontend dependency installation and production builds remained bounded by tool execution.
- AetherFusion's legacy process-group runner hung in this CAAS environment and required the same 15 groups to be rerun separately.
- GitHub content writes were partially blocked by connector safety checks, adding retries and preventing a single atomic full-source tree upload.
- The earlier container reset forced a full rebuild and invalidated the original stopwatch.

## Conclusion

The fusion Skill clearly reduced architectural wandering and duplicate implementation, but this v0.7 task is broader than the v0.6 baseline and the recoverable wall-clock result does not support claiming a speedup above 1x. The honest measurable result is the upper-bound figures above, with exact adjusted speedup left unclaimed.
