# Audio Target Runtime

`@taowind/audio-target-runtime` is the shared candidate seam for explicit RNCS cue-to-file lowering.

It does not own world audio meaning. Behavior and RSR continue to own cue identity, timing, tick and spatial parameters. Reality Studio owns the authored `cue_id → asset_id → file_role → asset_sha256` binding. Reality Build owns target packaging and the admitted Web Audio Provider. The package only validates and compiles the sealed binding into a deterministic target plan and receipt shape.

The plan is fail-closed:

- an asset record, declared file role, audio MIME and exact SHA-256 must all match;
- missing assets, missing roles, non-audio files, hash mismatches and invalid or unsealed profiles remain blocked;
- no cue-name inference, first-audio-file inference or procedural fallback is performed by the shared layer.

The current provider is a local Web Audio candidate (`reality-build.web-audio-buffer`). Its browser receipt proves file request, decode scheduling and target identity only. It does not prove audible output, spatialization, latency, mixing quality, Android/native audio, physical-device behavior or human listening acceptance.

This is an auxiliary target-lowering package, not an RCL Core promotion. The open gap is tracked as `RCL_GAP_RNCS_AUDIO_TARGET_LOWERING`.
