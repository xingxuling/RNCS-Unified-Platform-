# Phase 6.6 Verification Matrix

| Gate | Evidence | Pass condition | Current state |
|---|---|---|---|
| Drawing authority | `AnimeDrawingIR.backend_contract` | identity/geometry/raster authority are false | candidate implemented |
| Bezier representation | DrawingIR tests | at least one cubic path and backend-neutral layer semantics | candidate implemented |
| Drawing mesh | `DrawingMeshIR` | 3×3 cage, normalized weights, valid triangles | candidate implemented |
| Cage safety | deformation tests | zero triangle inversions or explicit rejection | candidate implemented |
| Lower-body authority | `LowerBodyMorphologyCertificate` | bilateral bone + field + mesh evidence | candidate implemented |
| Identity continuity | before/after roots | identity_root and genome_root unchanged | test written |
| Full-body fail closed | negative test | upper-body-only asset throws `FULL_BODY_CANONICAL_LOWER_BODY_REQUIRED` | test written |
| Full-body drawing | drawing certificate | two canonical legs and two feet, ankle attachment, taper, hierarchy | test written |
| Lower-body performance | Performance/FK | only full-body skeleton activates hip/knee/ankle rotations; bone lengths invariant | candidate implemented |
| Vector raster | backend receipt | SVG/librsvg executes at 1280×720 | blocked before runner start |
| 120-frame media | frame manifest | 120 frames, 24 fps, 5 seconds, root chain complete | blocked before runner start |
| FFmpeg closure | ffprobe | H.264 + AAC and expected dimensions/timing | blocked before runner start |
| Evidence Ledger | verifier | ledger root re-computes and binds lower-body/backend/media roots | verifier written |
| Human visual review | real MP4 / representative frames | user accepts or requests revision | pending artifact |
| Commercial quality | production review | explicit human approval + rights/quality evidence | not proven |

## Current external blocker

GitHub check annotation currently states that the job was not started because recent account payments failed or the Actions spending limit must be increased. The local container also has no external network access and the available uploaded repository ZIP predates the native morphogenesis runtime.

Therefore the correct current state is **candidate-unverified**, not failed and not passed.
