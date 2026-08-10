# Anime Production Runtime

RNCS Anime Production IR, exposure-sheet/X-Sheet contract, deterministic frame evidence and reference Native2D/2.5D raster primitives.

The runtime keeps exposure policy explicit, records provider receipts, and writes an Evidence Ledger for every rendered sequence. It is a reference implementation with a clear boundary around commercial animation quality, GPU parity and external providers.

Phase 3 adds stable multi-Cut references, a sealed hard-cut editorial timeline, per-Cut X-Sheets and profiles, global frame scheduling, full-production manifests and deterministic production replay. Unsupported transitions, mixed master formats and silent actor identity/asset drift fail validation.

RAGF motion binding adds a derived runtime bridge from `ragf.anime-motion-track.v0.1` to the X-Sheet. The bridge maps source and destination timebases explicitly, carries the source motion-state roots and continuity roots, resolves blink into the X-Sheet eye track, and records bounded RSR-compatible director overrides. `Episode` remains authoritative; the binding only produces a replayable derived X-Sheet.

Cycle tracks now carry `ragf.anime-motion-quality-contract.v0.1`. The terminal cycle frame is checked against the first frame for each declared secondary-motion channel, with eye-state, required-track, variation and deterministic gates. The resulting `motion_quality_root` is copied into the derived X-Sheet binding and remains auditable in the bridge report.

The same binding now carries `motion_visual_quality_root`. RAGF frames include canonical RGBA8 pixel roots and adjacent-frame deltas; runtime validation recomputes the visual report, requires non-static active pixels and verifies the exact cycle endpoint. The binding frame map preserves the source `pixel_root`, so a derived X-Sheet can be traced back to actual source media rather than state metadata alone.

Use `buildExposureSheet(cut, {ragfMotionTrack, ragfMotionBindingOptions})` for one Cut or `buildProductionExposureSheets(production, {ragfMotionTracks})` for a programme. The executable evidence command is `npm run evidence:ragf-motion-binding --workspace @taowind/anime-production-runtime`. It emits real PNG frames, RAGF source media, bound X-Sheets, a binding ledger, replay results and SHA-256 evidence. The output is experimental candidate evidence, not commercial Anime quality or physical cloth/hair simulation proof.
