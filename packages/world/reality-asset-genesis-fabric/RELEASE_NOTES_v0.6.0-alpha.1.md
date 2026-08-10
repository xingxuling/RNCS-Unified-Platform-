# RAGF v0.6.0-alpha.1

## Native Anime Asset Family quality upgrade

RAGF's built-in Anime provider now emits a state-aware character family from one Character Genome. The family contains authored SVG model views and a real RGBA PNG front view. Expression, mouth shape, eye state, gaze and pose are part of the render input and the resulting state root.

The continuity contract keeps identity, palette, proportions and appearance roots stable while state-specific media roots may change. The provider receipt records both SVG and PNG media types and remains candidate-only.

The quality report rejects a missing, empty or unbound raster contract. This is still deterministic experimental reference media. It does not prove commercial Anime source-art quality, professional facial rigging, cloth or hair simulation, DCC parity, or licensed production art.

## Verification

```bash
node --test --test-concurrency=1 packages/world/reality-asset-genesis-fabric/tests/*.test.mjs
npm test --workspace @taowind/anime-production-runtime
```
