# Anime Forge Phase 5B Environment Audit

Audit date: 2026-08-07
Repository baseline: `4d42442855a371903563f644b0f24ee9a9defc4d`
Worktree: `C:\Users\User\Documents\RCL\_worktrees\rncs-anime-forge-phase5b-real-execution-v01`

## Machine facts

- Windows 11 Home, build `26200`.
- AMD Ryzen AI 7 350, 8 cores / 16 logical processors.
- 23.29 GB visible RAM; 3.68 GB was free at audit time. Free RAM is transient and excluded from deterministic roots.
- AMD Radeon 860M Graphics, driver `32.0.22024.3004`, reported adapter RAM `512 MiB`. This is shared adapter memory, not a qualified dedicated video-memory budget.
- No NVIDIA driver, `nvidia-smi`, `nvcc`, or CUDA runtime was found.
- PyTorch `2.10.0+cpu`; `torch.cuda.is_available()` is `false` and device count is `0`.
- C: had 307.9 GB free at audit time. Free disk is transient and excluded from deterministic roots.

## Toolchain

Python `3.11.6`, Node `24.15.0`, npm `11.12.1`, and Git `2.55.0.windows.2` are available.

The existing `C:\Users\User\Documents\ComfyUI` path contains only data directories (`models`, `custom_nodes`, `input`, `output`, `user`). No ComfyUI server executable, model checkpoint, or installed custom node was found. No ComfyUI health query or workflow submission was attempted.

No remote GPU, Comfy Cloud, visual Provider API, or Provider secret configuration was found. Secret values were not read.

## FFmpeg gate

FFmpeg was installed through the trusted `winget` package `Gyan.FFmpeg.Shared` version `9.0`. The package installer hash reported by `winget` was verified before extraction. The installed binary hashes and machine-local paths are recorded in [environment-audit.json](./environment-audit.json).

The independent smoke test used a real PNG sequence and the existing real WAV, then produced an H.264/AAC MP4. `ffprobe` verified 48 video frames at 24 fps, 2.000 seconds, 960x540, and a 2.000-second AAC audio stream. The resulting file is only a media-toolchain test; it is not a visual-model result and must not be used as Phase 5B candidate media.

## Gate decision

`FFMPEG_UNAVAILABLE` is cleared. The actual Phase 5B blocker is `MODEL_EXECUTION_UNAVAILABLE`: there is no compatible local GPU/runtime, no ComfyUI server plus model, and no approved remote Provider. Because no real external frames exist, Smoke Shot, Quality Shot, Patch, human review package, and Episode candidate media were not generated.

This report intentionally does not include a deterministic Episode/Candidate root. The transient machine facts and the local FFmpeg installation must never become authoritative Episode or Evidence Ledger inputs.
