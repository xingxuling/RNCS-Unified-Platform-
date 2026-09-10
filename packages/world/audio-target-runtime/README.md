# Audio Target Runtime

`@taowind/audio-target-runtime` is the shared candidate seam for explicit RNCS cue-to-file lowering.

It does not own world audio meaning. Behavior and RSR continue to own cue identity, timing, tick and spatial parameters. Reality Studio owns the authored `cue_id → asset_id → file_role → asset_sha256` binding. Reality Build owns target packaging and the admitted Web Audio Provider. The package only validates and compiles the sealed binding into a deterministic target plan and receipt shape.

The plan is fail-closed:

- an asset record, declared file role, audio MIME and exact SHA-256 must all match;
- missing assets, missing roles, non-audio files, hash mismatches and invalid or unsealed profiles remain blocked;
- no cue-name inference, first-audio-file inference or procedural fallback is performed by the shared layer.

The current provider is a local Web Audio candidate (`reality-build.web-audio-buffer`). A profile may additionally carry an explicit `spatial_policy.listener_id` (with RSR `position_scale` and `occlusion_mode`) to select an existing RSR listener; the Build host then lowers RSR position, gain, pitch, distance and occlusion fields into a Web Audio `PannerNode`/low-pass chain. The receipt distinguishes planned parameters from `spatial_parameters_forwarded=true`. Missing listeners or invalid policies fail closed. This proves target-provider lowering only; it does not prove audible output, spatial perceptual equivalence, latency, mixing quality, Android/native audio, physical-device behavior or human listening acceptance.

This is an auxiliary target-lowering package, not an RCL Core promotion. The open gap is tracked as `RCL_GAP_RNCS_AUDIO_TARGET_LOWERING`.
