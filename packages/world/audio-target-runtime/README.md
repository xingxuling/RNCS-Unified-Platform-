# Audio Target Runtime

`@taowind/audio-target-runtime` is the shared candidate seam for explicit RNCS cue-to-file lowering.

It does not own world audio meaning. Behavior and RSR continue to own cue identity, timing, tick and spatial parameters. Reality Studio owns the authored `cue_id → asset_id → file_role → asset_sha256` binding. Reality Build owns target packaging and the admitted Web Audio Provider. The package only validates and compiles the sealed binding into a deterministic target plan and receipt shape.

The plan is fail-closed:

- an asset record, declared file role, audio MIME and exact SHA-256 must all match;
- missing assets, missing roles, non-audio files, hash mismatches and invalid or unsealed profiles remain blocked;
- no cue-name inference, first-audio-file inference or procedural fallback is performed by the shared layer.

The current provider is a local Web Audio candidate (`reality-build.web-audio-buffer`). A profile may additionally carry an explicit `spatial_policy.listener_id` (with RSR `position_scale` and `occlusion_mode`) to select an existing RSR listener; the Build host then lowers RSR position, gain, pitch, distance and occlusion fields into a Web Audio `PannerNode`/low-pass chain. The receipt distinguishes planned parameters from `spatial_parameters_forwarded=true`. Missing listeners or invalid policies fail closed. Before Web Audio decode, the browser target reuses the existing VSR `VSRSpatialAssetStreamer` for bound `kind: audio` bytes, including VSR SHA verification and asset receipt-root continuity; this is asset residency/loading reuse, not continuous audio streaming. The browser target also exposes `taowind.audio-target-provider-diagnostics.v0.1` for AudioContext state, resume results, decode latency, pending-load cleanup, source lifecycle and VSR asset-loading diagnostics; it does not silently add a max-voice, mixer, bus or authored concurrency policy. This proves target-provider lowering and lifecycle observation only; it does not prove audible output, spatial perceptual equivalence, latency curves, mixing quality, Android/native audio, physical-device behavior or human listening acceptance.

The browser and embedded Android WebView hosts also reuse the existing `createVSRBrowserAssetCache()` contract for these bound audio bytes. The cache is keyed by the existing app/project name and audio plan revision root, honors the existing `asset_cache.max_bytes` and `persist_accesses` policy, and exposes hit/miss/eviction/manifest diagnostics through the existing VSR inspection shape. This is cache residency reuse across a reload, not a new audio cache schema or a continuous/segmented stream policy; clean Chromium and API 35 WebView candidate receipts are kept separately from the generic VSR asset-residency evidence.

This is an auxiliary target-lowering package, not an RCL Core promotion. The open gap is tracked as `RCL_GAP_RNCS_AUDIO_TARGET_LOWERING`.
