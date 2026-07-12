import { AetherEarthRuntime } from './runtime.mjs';
export { AetherEarthRuntime };
export { createEarthGrid, createOrganisms, advanceWorldDay, seasonAt, CLIMATES, ACTIONS } from './world.mjs';
export { Rclpedia, generateSeedEntries } from './encyclopedia.mjs';
export { compressReality, restoreReality, compactHistory } from './compression.mjs';
export { selectCrystalCandidate, buildCrystalSource, crystallizeCollective } from './crystallization.mjs';
export { DeterministicRandom } from './prng.mjs';
export { canonicalize, canonicalJson, realityRoot } from './canonical.mjs';

export function health() {
  return {
    status: 'ok',
    runtime: 'rncs.aether-earth',
    version: '0.1.0-alpha.1',
    grid: '16x16',
    organisms: 100,
    rclpediaSeedEntries: 512,
    capabilities: ['earth-sandbox', 'small-data-organisms', 'rclpedia', 'time-acceleration', 'reality-compression', 'collective-crystallization'],
  };
}

export function createRuntime(options = {}) {
  return new AetherEarthRuntime(options);
}
