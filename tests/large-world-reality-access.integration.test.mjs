import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rootHash} from '@taowind/rncs-core-contract';
import {
  LargeWorldRuntime,
  verifyLargeWorldRealityAccessResolution,
  verifyLargeWorldSpatialScene,
  verifyPortfolioSelectionEnvelope
} from '@taowind/large-world-runtime';
import {compileSpatialFrame, renderSpatialReference, verifySpatialFrame} from '@taowind/visual-state-runtime/spatial-reality-3d';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(process.env.URRF_LARGE_WORLD_REALITY_ACCESS_OUT ?? join(rootDir, 'docs', 'verification', 'URRF_LARGE_WORLD_REALITY_ACCESS'));

test('executes URRF v0.3 Reality Access into a bounded visual world working set', () => {
  mkdirSync(outputDir, {recursive: true});
  const runtime = new LargeWorldRuntime({
    worldId: 'world:urrf-reality-access',
    seed: 'seed:urrf-reality-access',
    width: 5,
    depth: 5,
    chunkSize: 64,
    sampleResolution: 8,
    loadRadius: 0,
    unloadRadius: 1,
    maxActiveChunks: 3
  });
  const center = runtime.getChunk('chunk:world:urrf-reality-access:0:0');
  const target = runtime.getChunk('chunk:world:urrf-reality-access:1:0');
  assert.ok(center && target);
  const horizon = runtime.createRealityHorizon({
    subject_id: 'subject:camera',
    spatial: {radius: '220'},
    semantic: {tags: ['large-world']},
    permission_scope: ['public']
  });
  const graph = runtime.createRealityInterestGraph({
    subject_id: 'subject:camera',
    nodes: [
      {object_id: target.object_id, required: true, weights: {visual_interest: '100'}, reasons: ['camera-focus'], evidence_refs: [target.chunk_root]},
      {object_id: center.object_id, required: true, weights: {visual_interest: '90'}, reasons: ['camera-near'], evidence_refs: [center.chunk_root]}
    ]
  });
  const access = runtime.resolveRealityAccess({
    subject_id: 'subject:camera',
    observer: {x: 0, z: 0},
    horizon,
    interest_graph: graph,
    filters: {semantic: {tags: ['large-world']}, spatial: {origin: {x: 0, y: 0, z: 0}, radius: '220'}},
    limit: 8,
    capacity: 3
  });
  assert.equal(verifyLargeWorldRealityAccessResolution(access).valid, true);
  assert.equal(access.query_result.selected.length >= 2, true);
  assert.equal(access.selected_chunk_ids.includes(target.chunk_id), true);
  assert.equal(access.active_selected_chunk_ids.includes(target.chunk_id), true);
  assert.equal(access.stream_resolution.active_chunk_ids.length, 3);

  const selection = runtime.selectActiveRepresentationPortfolios({quality_profile: 'STANDARD'});
  assert.equal(verifyPortfolioSelectionEnvelope(selection).valid, true);
  const scene = runtime.createSpatialScene({
    scene_id: 'urrf-large-world-reality-access-v01',
    selection,
    camera: {translation: [32, 14, 78], rotationEulerDeg: [-18, 0, 0]},
    evidence_root: rootHash({access_root: access.resolution_root, selection_root: selection.selection_root})
  });
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);
  const frame = compileSpatialFrame(scene, {width: 320, height: 180, enableShadows: false});
  assert.equal(verifySpatialFrame(frame).ok, true);
  const rendered = renderSpatialReference(scene, {width: 320, height: 180, enableShadows: false});
  assert.equal(verifySpatialFrame(rendered.framePlan).ok, true);
  assert.equal(rendered.framePlan.sourceRealityRoot, frame.sourceRealityRoot);

  const reportBase = {
    format: 'urrf.large-world-reality-access-report.v0.1',
    world_id: access.world_id,
    region_root: access.region_root,
    world_root: access.world_root,
    horizon_root: access.horizon.horizon_root,
    interest_graph_root: access.interest_graph?.graph_root ?? null,
    query_root: access.query.query_root,
    query_result_root: access.query_result.result_root,
    working_set_root: access.working_set.working_set_root,
    access_resolution_root: access.resolution_root,
    selected_object_ids: access.selected_object_ids,
    selected_chunk_ids: access.selected_chunk_ids,
    active_selected_chunk_ids: access.active_selected_chunk_ids,
    active_chunk_ids: access.active_chunk_ids,
    stream_root: access.stream_root,
    selection_root: selection.selection_root,
    scene_root: scene.scene_root,
    frame_root: frame.frameRoot,
    pixel_root: rendered.pixelRoot,
    authority: {canonical_owner: 'RNCS', query_owner: 'RNCS', representation_owner: 'URRF', execution_owner: 'VSR', candidate_only: true, authoritative: false, canonical_state_mutated: false},
    notes: 'Candidate-only v0.3 Reality Access execution: each large-world chunk is query-indexed at its deterministic center, the interest-ranked CognitiveWorkingSet becomes forced chunk requests, and the resulting bounded stream lowers into a VSR scene. Query and stream candidates never mutate canonical world truth; permission/revalidation and real GPU or production-scale claims remain outside this evidence.'
  };
  const report = {...reportBase, report_root: rootHash(reportBase)};
  writeFileSync(join(outputDir, 'large-world-reality-access-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'large-world-reality-access.png'), rendered.png);
  assert.match(report.report_root, /^[a-f0-9]{64}$/);
  assert.ok(readFileSync(join(outputDir, 'large-world-reality-access-report.json')).byteLength > 1000);
  assert.ok(readFileSync(join(outputDir, 'large-world-reality-access.png')).byteLength > 1000);
});
