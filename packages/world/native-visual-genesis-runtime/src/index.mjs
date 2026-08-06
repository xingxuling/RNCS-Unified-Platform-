export * from './canonical.mjs';
export * from './visual-genome.mjs';
export * from './morphogenesis.mjs';
export * from './performance.mjs';
export * from './scene.mjs';
export * from './style.mjs';
export * from './renderer.mjs';
export * from './feedback.mjs';
export * from './media.mjs';
export * from './build.mjs';
export {createCharacterGenome, validateCharacterGenome, assertValidCharacterGenome} from '../../character-genome-runtime/src/contracts.mjs';

import {lifecycleFields, NATIVE_VISUAL_VERSION, seal} from './canonical.mjs';

export function createNativeVisualGenesisBundle({episodeIntentRoot, characterVisualGenome, bodyGraph, performancePlan, sceneField, styleLawSet, renderPlan}) {
  return seal({format: 'rncs.native-visual-genesis-bundle.v0.1', version: NATIVE_VISUAL_VERSION, episode_intent_root: episodeIntentRoot, character_visual_genome: characterVisualGenome, body_graph: bodyGraph, performance_plan: performancePlan, scene_field: sceneField, style_law_set: styleLawSet, render_plan: renderPlan, ...lifecycleFields({provenance: {source: 'Native Visual Genesis Kernel', episode_intent_root: episodeIntentRoot}, dependencies: [episodeIntentRoot, characterVisualGenome?.visual_genome_root, bodyGraph?.body_graph_root, performancePlan?.performance_root, sceneField?.scene_root, styleLawSet?.style_root, renderPlan?.render_plan_root].filter(Boolean), authority: 'RNCS native visual derived bundle', rollback: 'restore-episode-intent-root'}), authority: 'RNCS', bundle_root: ''}, 'bundle_root');
}
