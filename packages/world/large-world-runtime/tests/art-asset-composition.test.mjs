import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LARGE_WORLD_ART_ASSET_COMPOSITION_FORMAT,
  createLargeWorldArtAssetComposition,
  createLargeWorldArtAssetCompositionScene,
  createLargeWorldSpatialGlbBundle,
  lowerLargeWorldArtAssetComposition,
  verifyLargeWorldArtAssetComposition,
  verifyLargeWorldSpatialGlbBundle,
  verifyLargeWorldSpatialScene
} from '../src/index.mjs';

const grove = (overrides = {}) => ({
  name: 'Grove', asset_key: 'grove', seed: 'seed:grove', semantic_kind: 'structure',
  biome: 'forest', style_id: 'natural', quality_profile: 'STANDARD',
  parts: [{part_id: 'canopy', role: 'canopy', geometry_kind: 'grove'}],
  ...overrides
});

test('roots a normalized multi-part art asset and preserves candidate-only authority', () => {
  const composition = createLargeWorldArtAssetComposition({
    name: 'Industrial Shrine', asset_key: 'shrine', seed: 'seed:shrine', semantic_kind: 'hybrid',
    biome: 'desert', style_id: 'industrial', quality_profile: 'CINEMATIC',
    parts: [
      {part_id: 'spark', role: 'power-crystal', geometry_kind: 'resource:crystal', offset_mm: [0, 650, 0], scale_milli: [900, 900, 900]},
      {part_id: 'core', role: 'foundation', geometry_kind: 'shrine'},
      {part_id: 'ore', role: 'reinforcement', geometry_kind: 'resource:iron', offset_mm: [520, 0, 180], variant: 1}
    ]
  });
  assert.equal(composition.format, LARGE_WORLD_ART_ASSET_COMPOSITION_FORMAT);
  assert.deepEqual(composition.recipe.parts.map(part => part.part_id), ['core', 'ore', 'spark']);
  assert.equal(composition.candidate_only, true);
  assert.equal(composition.authoritative, false);
  assert.equal(composition.canonical_write_authorized, false);
  assert.equal(verifyLargeWorldArtAssetComposition(composition).valid, true);

  const fragment = lowerLargeWorldArtAssetComposition(composition);
  assert.equal(fragment.nodes.length, 3);
  assert.equal(fragment.meshes.length, 3);
  assert.equal(fragment.materials.length, 3);
  assert.equal(fragment.authoritative, false);
  assert.equal(fragment.authority.provider_can_write_authoritative_world_state, false);
});

test('composes assets into a rooted scene, deduplicates shared geometry, and lowers to GLB', () => {
  const compositions = [
    grove(),
    grove({name: 'Arcane Grove', asset_key: 'grove-arcane', seed: 'seed:grove-arcane', biome: 'tundra', style_id: 'arcane'}),
    {name: 'Shrine', asset_key: 'shrine', seed: 'seed:shrine', semantic_kind: 'hybrid', biome: 'desert', style_id: 'industrial', quality_profile: 'CINEMATIC', parts: [
      {part_id: 'core', geometry_kind: 'shrine'},
      {part_id: 'spark', geometry_kind: 'resource:crystal', offset_mm: [0, 650, 0], scale_milli: [900, 900, 900]}
    ]}
  ].map(createLargeWorldArtAssetComposition);
  const scene = createLargeWorldArtAssetCompositionScene({
    compositions,
    scene_id: 'urrf-art-asset-composition-unit',
    world_id: 'world:urrf-art-asset-composition-unit',
    placements_mm: compositions.map((composition, index) => ({asset_id: composition.asset_id, translation_mm: [index * 5000, 0, 0]}))
  });
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);
  assert.equal(scene.nodes.length, 4);
  assert.equal(scene.materials.length, 4);
  assert.equal(scene.meshes.length, 3, 'the two grove assets must share one deterministic mesh prototype');
  assert.equal(scene.large_world.active_chunk_ids.length, 3);
  assert.equal(scene.large_world.candidate_only, true);
  assert.equal(scene.large_world.authoritative, false);

  const bundle = createLargeWorldSpatialGlbBundle(scene);
  assert.equal(verifyLargeWorldSpatialGlbBundle(bundle, {sceneRoot: scene.scene_root}).valid, true);
  assert.equal(bundle.manifest.mesh_count, scene.meshes.length);
  assert.equal(bundle.manifest.asset_count, scene.meshes.length * 3);
  assert.equal(bundle.bundle_root, createLargeWorldSpatialGlbBundle(scene).bundle_root);
});

test('art asset scene composition is deterministic and rejects malformed roots or placement references', () => {
  const composition = createLargeWorldArtAssetComposition(grove());
  const input = {compositions: [composition], scene_id: 'urrf-deterministic-scene'};
  const first = createLargeWorldArtAssetCompositionScene(input);
  const second = createLargeWorldArtAssetCompositionScene(input);
  assert.deepEqual(first, second);

  const tampered = structuredClone(composition);
  tampered.recipe.parts[0].scale_milli[0] = 2000;
  assert.equal(verifyLargeWorldArtAssetComposition(tampered).valid, false);
  assert.throws(() => createLargeWorldArtAssetComposition({
    ...grove(), parts: new Array(9).fill(null).map((_, index) => ({part_id: `p-${index}`, geometry_kind: 'grove'}))
  }), /LARGE_WORLD_ART_ASSET_PART_COUNT_INVALID/);
  assert.throws(() => createLargeWorldArtAssetCompositionScene({
    compositions: [composition], placements_mm: [{asset_id: 'art-asset:unknown', translation_mm: [0, 0, 0]}]
  }), /LARGE_WORLD_ART_ASSET_SCENE_UNKNOWN_PLACEMENT/);
});
