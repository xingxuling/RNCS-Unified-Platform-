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
