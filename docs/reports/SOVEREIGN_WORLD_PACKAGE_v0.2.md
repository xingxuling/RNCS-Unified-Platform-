# Sovereign World Package v0.2 Verification Report

## 1. Completion Summary

This release closes one honest G1 vertical workflow across RCL, RNCS, and
zhinao. A real GameBrain module turns an evidence-backed utterance into a world
action through the five Foundation planes. Its provider simulation is bound to
a canonical RNCS proposal, explicit human authority, a 4R-gated commit,
deterministic replay, and authority-root rollback. The same evidence package
also binds a rendered spatial viewport, two network clients, disconnect
recovery, deterministic GLB/WAV assets, and four product targets.

- Status: `PASS`
- Package root: `14c0d4668eacb8b557d369990718925cd81f8e9576e9b4188ccb60729d3cc52d`
- Build ID: `build:b648ef29a7104ff65a6405f5`
- Product targets: `web-release`, `windows-portable`, `headless-server`, `replay-bundle`
- Regeneration: `npm run demo:beyond-engine:v02`
- Integration test: `npm run test:beyond-engine:v02`

## 2. Modified Repositories And Surfaces

### zhinao

- Canonicalized GameBrain proposal fields for direct RNCS Core consumption.
- Converted non-integer numbers to canonical decimal strings.
- Bound complete Foundation governance to the proposal input.
- Added a reusable provider lifecycle covering language, simulation, human
  approval, commit, replay, and rollback.

### RNCS Unified Platform

- Added the Sovereign World Package v0.2 runtime, demo, and integration test.
- Added real GLB and WAV MIME handling to Reality Build.
- Made headless startup execute the same trace, session identity, and initial
  checkpoint as the replay bundle.
- Added deterministic runtime evidence, headless-server, and replay-bundle
  build targets used by this workflow.

RCL source was not changed in this phase. The existing canonical Foundation
Contract and RNCS Foundation governance bridge remain the source boundary.

## 3. Integration Matrix

| Surface | Mode | Verified behavior | Evidence |
| --- | --- | --- | --- |
| Five Foundation cognitive planes | bridge | Utterance moves `subject-alpha` from shelter to farm before RNCS execution | Foundation run root |
| Foundation 4R governance | bridge | Explicit variables, uncertainty, provider boundary, authority, invariants, AIF, causal parents, evidence requirements enter proposal | RNCS proposal root |
| RNCS Proposal/Authority/Commit | native | Canonical proposal verifies and commits only after human approval | Commit root |
| Authority negative path | native | Commit before authorization is rejected | Counterfactual result |
| 4R negative path | native | Malformed invariant field is rejected by the commit gate | Counterfactual result |
| Two-client networking | native | Both clients reconverge after one client disconnects with an unacknowledged input | Network recovery root |
| Spatial viewport | projection | glTF-backed spatial scene renders a non-empty deterministic PNG | Pixel root |
| GLB model | asset | Valid glTF 2.0 binary is imported and baked as `model/gltf-binary` | Asset root and SHA-256 |
| PCM WAV | asset | Valid mono 16-bit WAV is imported and baked as `audio/wav` | Asset root and SHA-256 |
| Web/headless/replay runtime | native | All targets share the project root and runtime replay root | Build receipt and target roots |
| Complete 14+5+3+2 Native VM lowering | none | Not changed or claimed by this phase | Explicit limitation |
| Android APK/store signing | none | Not built by this workflow | Explicit limitation |

Projection and asset rows are intentionally not reported as native.

## 4. Test Results

| Suite | Passed | Skipped | Failed |
| --- | ---: | ---: | ---: |
| Sovereign World v0.2 integration | 2 | 0 | 0 |
| Beyond-engine v0.1 compatibility | 1 | 0 | 0 |
| Reality Build | 109 | 8 environment-dependent | 0 |
| Reality Network | 22 | 0 | 0 |
| Reality Studio | 210 | 0 | 0 |
| zhinao full serial suite | 152 across 23 files | 0 | 0 |
| Total | 496 | 8 | 0 |

The eight Build skips are native Windows/Go toolchain checks that the test
environment did not advertise. They are not code failures. The v0.2 test also
verifies that a missing GameBrain provider fails explicitly; in a single-repo
checkout the real cross-repo case is marked skipped rather than mocked.

## 5. Performance Snapshot

One local release run on 2026-07-17 recorded:

| Metric | Value |
| --- | ---: |
| RNCS Core proposal/commit | 13.335 ms |
| GameBrain plus spatial/network runtime | 2,254.721 ms |
| Four-target build | 1,021.026 ms |
| Replay plus headless process verification | 1,293.050 ms |
| RSS delta | 176,484,352 bytes |
| Provider calls | 1 |
| Network/Foundation events counted | 59 |
| Baked unique files | 8 |
| Baked unique bytes | 14,952 |

This is the first comparable v0.2 product baseline, so it is not used to claim
a percentage improvement over v0.1. Wall-clock and memory metrics are excluded
from deterministic roots.

## 6. Unfinished And Blocked

- Full 14+5+3+2 lowering through every RCL Native VM and self-host compiler
  stage remains incomplete and is not relabeled as native.
- The spatial viewport is a verified projection, not proof of a production
  editor matching every Godot or Unity authoring workflow.
- Windows portable output uses browser-host mode; `windows-native` was not part
  of this package.
- Android APK, store signing, consoles, and large multiplayer scale remain
  outside this G1 workflow.
- GitHub Actions may remain externally blocked by the account spending limit;
  local verification is complete.

## 7. Risk And Rollback

- GameBrain remains a versioned provider bridge so RNCS does not silently own
  or duplicate cognition authority.
- Provider receipts retain wall-clock audit timestamps, while semantic roots
  exclude those timestamps and bind stable before/after roots instead.
- GameBrain rollback restores the exact captured authority root and keeps both
  commit and rollback receipts.
- The implementation is isolated to new v0.2 entrypoints and additive Build
  targets. The v0.1 compatibility test remains green.

## 8. Branch And PR

- Branch: `codex/foundation-runtime-v01`
- RNCS PR: <https://github.com/xingxuling/RNCS-Unified-Platform-/pull/14>
- zhinao PR: <https://github.com/xingxuling/zhinao/pull/2>

## 9. Next Stage

Promote this G1 package into a Studio-authored workflow: bind the GLB asset to
an editable 3D scene node, compile the authored scene directly into the network
world, add live inspector/debug controls, and benchmark 10/50/100 concurrent
clients against the same authority and replay roots.
