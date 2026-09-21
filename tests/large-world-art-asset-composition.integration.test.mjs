import {mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LARGE_WORLD_ART_ASSET_COMPOSITION_FORMAT,
  LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE,
  createLargeWorldArtAssetComposition,
  createLargeWorldArtAssetCompositionScene,
  createLargeWorldSpatialGlbBundle,
  lowerLargeWorldArtAssetComposition,
  verifyLargeWorldArtAssetComposition,
  verifyLargeWorldSpatialGlbBundle,
  verifyLargeWorldSpatialScene
} from '@taowind/large-world-runtime';
import {compileSpatialFrame, renderSpatialReference, verifySpatialFrame} from '@taowind/visual-state-runtime/spatial-reality-3d';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDir = resolve(process.env.URRF_LARGE_WORLD_ART_ASSET_COMPOSITION_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_ART_ASSET_COMPOSITION'));

test('composes reusable URRF art recipes across geometry, material, style and multi-part axes', () => {
  mkdirSync(outputDir, {recursive: true});
  const recipes = [
    {
      name: 'Forest Natural Grove', asset_key: 'grove-forest-natural', seed: 'seed:grove-forest',
      semantic_kind: 'structure', biome: 'forest', style_id: 'natural', quality_profile: 'STANDARD',
      parts: [{part_id: 'canopy', role: 'canopy', geometry_kind: 'grove', scale_milli: [3200, 3200, 3200], variant: 0}]
    },
    {
      name: 'Tundra Arcane Grove', asset_key: 'grove-tundra-arcane', seed: 'seed:grove-tundra',
      semantic_kind: 'structure', biome: 'tundra', style_id: 'arcane', quality_profile: 'CINEMATIC',
      parts: [{part_id: 'canopy', role: 'canopy', geometry_kind: 'grove', scale_milli: [3000, 3000, 3000], variant: 3}]
    },
    {
      name: 'Desert Industrial Shrine', asset_key: 'shrine-desert-industrial', seed: 'seed:shrine-desert',
      semantic_kind: 'hybrid', biome: 'desert', style_id: 'industrial', quality_profile: 'CINEMATIC',
      parts: [
        {part_id: 'core', role: 'foundation', geometry_kind: 'shrine', scale_milli: [2700, 2700, 2700]},
        {part_id: 'spark', role: 'power-crystal', geometry_kind: 'resource:crystal', offset_mm: [0, 650, 0], scale_milli: [900, 900, 900], variant: 2},
        {part_id: 'ore', role: 'reinforcement', geometry_kind: 'resource:iron', offset_mm: [520, 0, 180], scale_milli: [700, 700, 700], variant: 1}
      ]
    },
    {
      name: 'Wetland Ancient Ruin', asset_key: 'ruin-wetland-ancient', seed: 'seed:ruin-wetland',
      semantic_kind: 'hybrid', biome: 'wetland', style_id: 'ancient', quality_profile: 'STANDARD',
      parts: [
        {part_id: 'walls', role: 'broken-walls', geometry_kind: 'ruin', scale_milli: [2800, 2800, 2800]},
        {part_id: 'pool', role: 'water-memory', geometry_kind: 'resource:water', offset_mm: [0, 420, 0], scale_milli: [900, 900, 900], variant: 1},
        {part_id: 'salt', role: 'salt-growth', geometry_kind: 'resource:salt', offset_mm: [-560, 0, 220], scale_milli: [700, 700, 700], variant: 2}
      ]
    },
    {
      name: 'Coast Mobile Watchtower', asset_key: 'watchtower-coast-mobile', seed: 'seed:watchtower-coast',
      semantic_kind: 'structure', biome: 'coast', style_id: 'industrial', quality_profile: 'MOBILE',
      parts: [{part_id: 'tower', role: 'lookout', geometry_kind: 'watchtower', scale_milli: [2800, 2800, 2800], rotation_deg: [0, 25, 0], variant: 4}]
    }
  ];
  const compositions = recipes.map(recipe => createLargeWorldArtAssetComposition(recipe));
  const verifications = compositions.map(composition => verifyLargeWorldArtAssetComposition(composition));
  assert.equal(compositions.every(composition => composition.format === LARGE_WORLD_ART_ASSET_COMPOSITION_FORMAT), true);
  assert.equal(verifications.every(result => result.valid), true);
  assert.equal(new Set(compositions.map(composition => composition.composition_root)).size, compositions.length);
  assert.deepEqual(compositions[0].recipe.parts[0].geometry_kind, compositions[1].recipe.parts[0].geometry_kind);
  assert.notEqual(compositions[0].composition_root, compositions[1].composition_root);

  const fragments = compositions.map(composition => lowerLargeWorldArtAssetComposition(composition));
  assert.equal(fragments.every(fragment => fragment.candidate_only && !fragment.authoritative && !fragment.canonical_write_authorized), true);
  assert.equal(fragments.every(fragment => fragment.fragment_root && /^[a-f0-9]{64}$/.test(fragment.fragment_root)), true);
  assert.equal(fragments[2].nodes.length, 3);
  assert.equal(fragments[3].nodes.length, 3);
  assert.notEqual(fragments[0].materials[0].baseColor, fragments[1].materials[0].baseColor, 'same grove geometry must admit different style/biome material candidates');

  const sourceRoot = rootHash({format: LARGE_WORLD_ART_ASSET_COMPOSITION_FORMAT, compositions: compositions.map(composition => composition.composition_root)});
  const layout = [[-5000, 0, 2000], [0, 0, 2000], [5000, 0, 2000], [-2500, 0, -3500], [2500, 0, -3500]];
  const scene = createLargeWorldArtAssetCompositionScene({
    compositions,
    source_reality_root: sourceRoot,
    scene_id: 'urrf-large-world-art-asset-composition-v01',
    title: 'URRF Art Asset Composition Contact Sheet',
    camera: {translation: [0, 8, 20], rotationEulerDeg: [-17, 0, 0]},
    placements_mm: compositions.map((composition, index) => ({asset_id: composition.asset_id, translation_mm: layout[index]}))
  });
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);
  const renderOptions = {width: 960, height: 560, enableShadows: false, gpuDrivenCulling: true};
  const frame = compileSpatialFrame(scene, renderOptions);
  assert.equal(verifySpatialFrame(frame).ok, true);
  assert.ok(frame.stats.triangleCount > 0);
  assert.equal(frame.stats.visibleDraws, scene.nodes.length);
  const rendered = renderSpatialReference(scene, renderOptions);
  const repeated = renderSpatialReference(scene, renderOptions);
  assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);
  assert.equal(rendered.pixelRoot, repeated.pixelRoot);
  assert.ok(rendered.png.byteLength > 1000);

  const glbBundle = createLargeWorldSpatialGlbBundle(scene, {
    texture_profile: LARGE_WORLD_SPATIAL_GLB_KTX2_PBR_TEXTURE_PROFILE,
    texture_size: 16
  });
  assert.equal(verifyLargeWorldSpatialGlbBundle(glbBundle, {sceneRoot: scene.scene_root}).valid, true);
  assert.equal(glbBundle.manifest.mesh_count, scene.meshes.length);
  assert.equal(glbBundle.manifest.asset_count, scene.meshes.length * 3);
  const glbLod0 = glbBundle.assets.filter(entry => entry.record.metadata.lod === 0);
  for (const [index, entry] of glbLod0.entries()) {
    const safeMeshId = String(entry.record.metadata.source_mesh_id).replace(/[^a-z0-9_-]+/gi, '_');
    writeFileSync(join(outputDir, `large-world-art-asset-composition-${String(index + 1).padStart(2, '0')}-${safeMeshId}-lod0.glb`), Buffer.from(entry.payload));
  }

  const report = {
    format: 'urrf.large-world-art-asset-composition-report.v0.1',
    composition_format: LARGE_WORLD_ART_ASSET_COMPOSITION_FORMAT,
    source_root: sourceRoot,
    asset_count: compositions.length,
    part_count: compositions.reduce((sum, composition) => sum + composition.recipe.parts.length, 0),
    distinct_geometry_axes: [...new Set(compositions.flatMap(composition => composition.axes.geometry))].sort(),
    distinct_material_axes: [...new Set(compositions.map(composition => composition.axes.material))].sort(),
    distinct_style_axes: [...new Set(compositions.map(composition => composition.axes.style))].sort(),
    compositions: compositions.map((composition, index) => ({
      asset_id: composition.asset_id,
      composition_root: composition.composition_root,
      fragment_root: fragments[index].fragment_root,
      name: composition.recipe.name,
      semantic_kind: composition.recipe.semantic_kind,
      biome: composition.recipe.biome,
      style_id: composition.recipe.style_id,
      quality_profile: composition.recipe.quality_profile,
      part_count: composition.recipe.parts.length,
      geometry: composition.axes.geometry,
      material_ids: fragments[index].materials.map(material => material.id),
      mesh_ids: fragments[index].meshes.map(mesh => mesh.id)
    })),
    scene: {scene_id: scene.sceneId, scene_root: scene.scene_root, node_count: scene.nodes.length, mesh_count: scene.meshes.length, material_count: scene.materials.length},
    frame_root: frame.frameRoot,
    pixel_root: rendered.pixelRoot,
    triangles: frame.stats.triangleCount,
    draw_calls: frame.stats.visibleDraws,
    glb: {bundle_root: glbBundle.bundle_root, manifest_root: glbBundle.manifest.manifest_root, asset_count: glbBundle.assets.length, lod0_count: glbLod0.length, texture_profile: glbBundle.manifest.texture_profile},
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', lowering_runtime: 'VSR', provider_can_write_authoritative_world_state: false, candidate_only: true, authoritative: false},
    notes: 'Candidate-only local composition proof. Existing deterministic low-poly large-world prototypes are reused across explicit geometry/material/style/biome/quality axes, including multi-part hybrid assets. The public composition scene is lowered into PBR KTX2 GLB candidates and CPU reference pixels execute deterministically. A separate browser receipt records one real Chromium WebGPU submission for this scene; target-device performance, photorealism, generated high-resolution textures, and AAA art direction remain unproven.'
  };
  report.report_root = rootHash(report);
  writeFileSync(join(outputDir, 'large-world-art-asset-composition-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-art-asset-composition-scene.json'), `${JSON.stringify(scene)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-art-asset-composition-glb-manifest.json'), `${JSON.stringify(glbBundle.manifest, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-art-asset-composition-reference.png'), rendered.png);
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
});
