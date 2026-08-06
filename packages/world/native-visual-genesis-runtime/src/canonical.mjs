export {clone, canonicalJson, rootHash, shortRoot, seal, verifySeal, stableId, clamp, seededRandom} from '../../reality-asset-genesis-fabric/src/canonical.mjs';

export const NATIVE_VISUAL_VERSION = '0.1.0-alpha.1';
export const NATIVE_VISUAL_AUTHORITY = 'RNCS';

export function lifecycleFields({provenance={}, dependencies=[], authority='derived', rollback='restore-parent-root'}={}) {
  return {
    provenance,
    dependencies,
    lifecycle: 'derived',
    authority,
    rollback: {strategy: rollback, parent_roots: dependencies.map(item => typeof item === 'string' ? item : item.root).filter(Boolean)}
  };
}
