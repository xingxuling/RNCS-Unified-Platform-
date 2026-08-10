# RCL Anime Production Bridge

Compatibility bridge for the RNCS Anime Forge v0.1 dialect. It parses Anime source, emits Anime Production IR, lowers the authoring source to valid RCL for the existing compiler, and exposes a CLI for the local reference pipeline.

The bridge does not own world authority. Its control-plane command produces a candidate plan only; RNCS/RCL remains the authority for simulation, commit and rollback.

## Commands

```text
npm test --workspace @taowind/rcl-anime-production-bridge
npm run demo:anime-forge
npm run anime:control-plane
```

The first sample is `examples/shenlinzhe-yanlv.rcl`. Its five-second Cut is the Phase 1 evidence case, not the total Anime Forge scope.

The Phase 3 sample is `examples/shenlinzhe-yanlv-editorial.rcl`. The compiler traverses every episode, scene and Cut, emits a sealed hard-cut editorial timeline, reuses RAGF families by asset ID and creates per-Cut VSR/RSR profiles. `inspect`, `select-cut`, `xsheet --cut`, `xsheet --all`, `render`, `mix`, `verify` and `replay` operate on this production contract.

Compiled RAGF Anime families are automatically resolved into per-Cut motion tracks by `src/ragf-motion-runtime.mjs`. Matching uses the derived `family_root` first, then asset and actor identity; invalid or ambiguous tracks fail closed. The built-in loopable motion contract uses an explicit `loop` policy with a declared cycle period, so long Cuts continue hair, coat, breathing and blink coverage on the destination timebase. `hold-last` remains available as an explicit compatibility policy for legacy tracks. The binding carries each Cut's RSR director overrides, records source-cycle coverage and never changes Episode authoring authority. Compile and media builds write `ragf-motion-runtime-binding-report.json`; `media`, `xsheet`, `render` and `replay` reuse the same binding path. The media build also records the binding root in its deterministic roots and Evidence Ledger.
