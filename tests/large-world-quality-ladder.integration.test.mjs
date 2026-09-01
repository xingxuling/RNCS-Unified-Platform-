import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LargeWorldRuntime,
  LARGE_WORLD_SPATIAL_QUALITY_PROFILES,
  verifyLargeWorldSpatialScene,
  verifyPortfolioSelectionEnvelope
} from '@taowind/large-world-runtime';
import {renderSpatialReference, resolveSpatialAssetStreaming, verifySpatialFrame} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {verifyVisualEvidence} from '@taowind/reality-representation-fabric';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_QUALITY_LADDER_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_QUALITY_LADDER'));
const profiles = [...LARGE_WORLD_SPATIAL_QUALITY_PROFILES];

function countBy(values, field) {
  return Object.fromEntries(profiles.map(profile => [profile, values.filter(value => value[field] === profile).length]));
}

test('renders every bound large-world quality profile with deterministic visual evidence', () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-large-world-quality-ladder',
    seed: 'seed:urrf-large-world-quality-ladder',
    width: 5,
    depth: 5,
    chunkSize: 64,
    sampleResolution: 8,
    loadRadius: 1,
    unloadRadius: 1,
    maxActiveChunks: 9
  });
  const stream = runtime.observe({x: 0, z: 0});
  const active = runtime.listActiveChunks();
  assert.equal(active.length, 9);
  const region = runtime.getRegion();
  const reports = [];
  const qualitySelections = new Map();

  for (const profile of profiles) {
    const qualityByChunk = Object.fromEntries(active.map(chunk => [chunk.chunk_id, profile]));
    const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: qualityByChunk});
    assert.equal(verifyPortfolioSelectionEnvelope(selection).valid, true);
    assert.equal(selection.selections.every(row => row.selected_quality_profile === profile), true);
    qualitySelections.set(profile, selection);

    const scene = runtime.createSpatialScene({
      selection,
      scene_id: `urrf-large-world-quality-${profile.toLowerCase()}`,
      title: `URRF Large World · ${profile}`,
      visual_scale: 4,
      evidence_root: rootHash({stream_root: stream.stream_root, selection_root: selection.selection_root, quality_profile: profile})
    });
    assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);
    assert.equal(scene.large_world.quality_profile, profile);
    assert.deepEqual(scene.large_world.quality_profiles, [profile]);
    assert.equal(scene.large_world.representation_slots.every(row => row.selected_quality_profile === profile), true);

    const options = {
      width: 640,
      height: 360,
      enableShadows: profile === 'CINEMATIC',
      assetStreaming: resolveSpatialAssetStreaming(scene.assets, {
        activeCellIds: scene.streaming.cells.map(cell => cell.id),
        requestedAssetIds: scene.assets.map(asset => asset.id),
        maxAssets: scene.assets.length,
        maxBytes: scene.assets.reduce((sum, asset) => sum + asset.byteLength, 0)
      }),
      streaming: {
        loadRadius: 0,
        unloadRadius: 0,
        forcedCellIds: scene.streaming.cells.map(cell => cell.id)
      }
    };
    const rendered = renderSpatialReference(scene, options);
    const repeated = renderSpatialReference(scene, options);
    assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);
    assert.equal(rendered.pixelRoot, repeated.pixelRoot);
    assert.ok(rendered.png.byteLength > 1000);
    const imageName = `large-world-quality-${profile.toLowerCase()}.png`;
    writeFileSync(join(outputDir, imageName), rendered.png);

    const center = active.find(chunk => chunk.coordinates.x === 0 && chunk.coordinates.z === 0) ?? active[0];
    const centerSelection = selection.selections.find(row => row.chunk_id === center.chunk_id);
    const portfolio = runtime.getRepresentationPortfolio(center.chunk_id);
    const evidence = runtime.portfolioRuntime.recordVisualEvidence({
      portfolio_id: portfolio.portfolio_id,
      slot_id: centerSelection.selected_slot_id,
      evidence_id: `visual:urrf-large-world-quality:${profile.toLowerCase()}`,
      status: 'LOCAL_RENDERED',
      quality_status: 'OBSERVED_NOT_GRADED',
      width: rendered.framePlan.viewport.width,
      height: rendered.framePlan.viewport.height,
      png_bytes: rendered.png.byteLength,
      triangles: rendered.framePlan.stats.triangleCount,
      draw_calls: rendered.framePlan.stats.visibleDraws,
      pixel_root: rendered.pixelRoot,
      frame_root: rendered.framePlan.frameRoot,
      environment_root: rendered.framePlan.environmentRoot,
      diversity_observation: portfolio.slots.find(slot => slot.slot_id === centerSelection.selected_slot_id)?.diversity_axes,
      notes: 'Deterministic VSR CPU-reference lowering of the same RNCS active working set at a bound URRF quality profile; observed, not graded or promoted.'
    });
    assert.equal(verifyVisualEvidence(evidence).valid, true);
    reports.push({
      profile,
      quality_profile: scene.large_world.quality_profile,
      quality_profiles: scene.large_world.quality_profiles,
      image_path: imageName,
      image_bytes: rendered.png.byteLength,
      width: rendered.framePlan.viewport.width,
      height: rendered.framePlan.viewport.height,
      triangles: rendered.framePlan.stats.triangleCount,
      draw_calls: rendered.framePlan.stats.visibleDraws,
      frame_root: rendered.framePlan.frameRoot,
      pixel_root: rendered.pixelRoot,
      scene_root: scene.scene_root,
      selection_root: selection.selection_root,
      visual_evidence_root: evidence.evidence_root,
      candidate_only: scene.large_world.candidate_only,
      authoritative: scene.large_world.authoritative
    });
  }

  assert.deepEqual(reports.map(report => report.profile), profiles);
  assert.equal(new Set(reports.map(report => report.pixel_root)).size, profiles.length);
  assert.equal(reports.every(report => report.candidate_only && !report.authoritative), true);
  assert.ok(reports.find(report => report.profile === 'MOBILE').triangles < reports.find(report => report.profile === 'STANDARD').triangles);
  assert.ok(reports.find(report => report.profile === 'CINEMATIC').triangles > reports.find(report => report.profile === 'STANDARD').triangles);

  const reportBase = {
    format: 'urrf.large-world-quality-ladder-report.v0.1',
    version: '0.1.0',
    evidence_level: 'LOCAL_RUNTIME_AND_CPU_REFERENCE_RENDER',
    world_id: region.world_id,
    generation: region.generation,
    region_root: region.region_root,
    world_root: region.world_root,
    stream_root: stream.stream_root,
    active_chunk_count: active.length,
    bound_quality_profiles: profiles,
    quality_counts: Object.fromEntries(reports.map(report => [report.profile, countBy(qualitySelections.get(report.profile).selections, 'selected_quality_profile')])),
    renders: reports,
    authority: {canonical_owner: 'RNCS', representation_owner: 'URRF', execution_owner: 'VSR', candidate_only: true, authoritative: false, canonical_write_authorized: false},
    notes: 'This closes the local multi-quality lowering slice: PROXY/MOBILE/STANDARD/CINEMATIC each render from the same active RNCS chunks with distinct bounded geometry/material/presentation behavior. REFERENCE is intentionally unbound. Images are CPU-reference evidence, not a GPU/AAA quality grade, distributed streaming proof, or canonical-world promotion.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'quality-ladder-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  const readme = [
    '# URRF Large-World Quality Ladder — Local Evidence',
    '',
    `- world_root: \`${region.world_root}\``,
    `- stream_root: \`${stream.stream_root}\``,
    `- report_root: \`${report.report_root}\``,
    '- status: `LOCAL_RENDERED / OBSERVED_NOT_GRADED`',
    '',
    '| Profile | Triangles | Draw calls | PNG | Pixel root |',
    '|---|---:|---:|---|---|',
    ...reports.map(item => `| ${item.profile} | ${item.triangles} | ${item.draw_calls} | [${item.image_path}](./${item.image_path}) | \`${item.pixel_root}\` |`),
    '',
    'The four images are deterministic CPU-reference projections of one RNCS active working set. They demonstrate a runnable quality ladder and distinct candidate render outputs; they do not prove production GPU/WebGPU quality, subjective art direction, AAA assets, distributed failover, or canonical-world writes.'
  ];
  writeFileSync(join(outputDir, 'README.md'), `${readme.join('\n')}\n`, 'utf8');
  assert.ok(readFileSync(join(outputDir, 'quality-ladder-report.json')).byteLength > 2000);
  assert.ok(readFileSync(join(outputDir, 'README.md')).byteLength > 500);
});
