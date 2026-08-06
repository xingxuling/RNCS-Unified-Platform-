# Phase 5B External Execution Handoff

This is a blocked handoff, not a completion report and not a merge request for Phase 5B completion.

## Required external dependency

Provide one of the following before the next execution attempt:

1. A Linux + NVIDIA CUDA worker with a supported ComfyUI installation, the exact model checkpoint, its model-file hashes, license text, workflow/API JSON, and a writable evidence output directory; or
2. An approved remote ComfyUI/GPU Provider endpoint with explicit URL/configuration, model/version/license/fee terms, and permission to retain local evidence.

The external environment must be able to consume the pending character reference pack only after human approval, then run the 2-second Smoke Shot before the 6-second Quality Shot.

## Next real gate

The first allowed external run is Smoke Shot only:

- 2 seconds;
- 48 frames or the model's native equivalent;
- 480P or the lowest reliable resolution;
- one character and simple motion;
- fixed or slight push camera;
- Provider Execution Receipt, raw output root, native specification, runtime, GPU, peak VRAM, and failure classification.

No Quality Shot, Patch, candidate selection, or Episode commit is allowed when Smoke Shot fails.

## Explicit no-go conditions

- Do not use the FFmpeg smoke MP4 as a visual-model candidate.
- Do not mark `human_character_acceptance` or `human_visual_acceptance` as accepted without user review.
- Do not download a checkpoint whose exact license and source revision are not recorded.
- Do not place model weights, API keys, or remote credentials in Git or evidence.
- Do not merge this branch as “Phase 5B complete” while `MODEL_EXECUTION_UNAVAILABLE` remains.
