import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createCharacterGenome, createCharacterVisualGenome, validateCharacterVisualGenome, morphogenizeVisualGenome, validateBodyGraph,
  createPerformancePlan, samplePerformanceFrame, validatePerformancePlan, createSceneStructureField, resolveSceneFrame, validateSceneStructureField,
  createStyleLawSet, validateStyleLawSet, renderNativeFrame, writeNativeFrameArtifacts, detectVisualResiduals, createVisualRepairCandidate,
  validateRepairCandidate, createNativeVisualGenesisBundle, rootHash
} from '../src/index.mjs';

function fixtures() {
  const genome = createCharacterGenome({seed: 'phase6-test', name: 'Phase Six Actor', body_parameters: {'body.shoulder_width': .61}, identity_parameters: {'face.eye_size': .52}});
  const visual = createCharacterVisualGenome({genome});
  const body = morphogenizeVisualGenome(visual);
  const performance = createPerformancePlan({fps: 24, frameCount: 120, shotId: 'test-shot'});
  const scene = createSceneStructureField({shotId: 'test-shot'});
  const style = createStyleLawSet({visualGenome: visual});
  return {genome, visual, body, performance, scene, style};
}

test('Visual Genome validates and changes body geometry without changing identity authority', () => {
  const {genome, visual, body} = fixtures();
  assert.equal(validateCharacterVisualGenome(visual).valid, true);
  assert.equal(validateBodyGraph(body).valid, true);
  const alteredGenome = createCharacterGenome({seed: 'phase6-test', name: 'Phase Six Actor', body_parameters: {'body.shoulder_width': .61}, identity_parameters: {'face.eye_size': .52}});
  const alteredVisual = createCharacterVisualGenome({genome: alteredGenome, visualPatch: {shoulder_width: .42}});
  const alteredBody = morphogenizeVisualGenome(alteredVisual);
  assert.equal(genome.character_id, alteredGenome.character_id);
  assert.equal(genome.identity_root, alteredGenome.identity_root);
  assert.notEqual(body.body_graph_root, alteredBody.body_graph_root);
  assert.equal(body.identity_root, alteredBody.identity_root);
});

test('Body Graph closes skeleton, topology, face, hair, costume and deformation dependencies', () => {
  const {body} = fixtures();
  const result = validateBodyGraph(body);
  assert.equal(result.valid, true);
  assert.ok(result.bone_count >= 12);
  assert.ok(result.region_count >= 8);
  assert.ok(body.facial_rig.anchors.left_eye);
  assert.ok(body.hair_rig.groups.length >= 5);
  assert.ok(body.costume_rig.panels.length >= 5);
});

test('Performance has preparation, rise, action, deceleration, overshoot and settle with typed secondary motion', () => {
  const {performance} = fixtures();
  assert.equal(validatePerformancePlan(performance).valid, true);
  const phases = new Set([0, 20, 50, 80, 96, 115].map(frame => samplePerformanceFrame(performance, frame).phase));
  for (const phase of ['prep', 'rise', 'main-action', 'decelerate', 'overshoot', 'settle']) assert.ok(phases.has(phase), phase);
  const early = samplePerformanceFrame(performance, 25), action = samplePerformanceFrame(performance, 75);
  assert.ok(action.pose.head_yaw > early.pose.head_yaw);
  assert.notEqual(early.secondary_motion_root, action.secondary_motion_root);
  assert.ok(action.motion_vector.head_yaw > 0);
});

test('Scene and style compile perspective, contact, occlusion, camera and cel laws', () => {
  const {scene, style, visual} = fixtures();
  assert.equal(validateSceneStructureField(scene).valid, true);
  assert.equal(validateStyleLawSet(style).valid, true);
  assert.equal(resolveSceneFrame(scene, 0).camera.frame, 0);
  const active = resolveSceneFrame(scene, 70);
  assert.ok(active.occlusion.some(item => item.active));
  assert.ok(active.contact.valid);
  assert.equal(style.identity_anchor_root, visual.identity_root);
});

test('Native renderer emits nonblank color, depth, mask, line and light evidence', () => {
  const {body, performance, scene, style} = fixtures();
  const frame = renderNativeFrame({body, performance: samplePerformanceFrame(performance, 70), scene, style, frameNumber: 70, width: 320, height: 180});
  assert.equal(frame.surface.color.length, 320 * 180 * 4);
  assert.ok(frame.surface.color.some(value => value !== 0));
  assert.ok(frame.surface.depth.some(value => value !== 0));
  assert.ok(frame.surface.mask.some(value => value !== 0));
  assert.ok(frame.surface.line.some(value => value !== 0));
  assert.ok(frame.surface.light.some(value => value !== 0));
  assert.equal(frame.frame_state.occlusion_active, true);
});

test('Repair feedback creates a bounded candidate and preserves unrelated frames', () => {
  const {body} = fixtures();
  const baseFrames = [...Array(120).keys()].map(frame_number => ({frame_number, frame_root: rootHash({frame_number, body: body.body_graph_root})}));
  const residual = detectVisualResiduals({body, frames: baseFrames});
  assert.equal(residual.status, 'repairable');
  const {candidate, candidateBody} = createVisualRepairCandidate({body, residualReport: residual, frameRange: [55, 86]});
  const candidateFrames = baseFrames.filter(item => item.frame_number >= 55 && item.frame_number <= 86).map(item => ({frame_number: item.frame_number, frame_root: rootHash({frame_number: item.frame_number, body: candidateBody.body_graph_root})}));
  const validation = validateRepairCandidate({body, candidate: {...candidate, candidateBody}, baseFrames, candidateFrames});
  assert.equal(validation.valid, true);
  assert.equal(candidate.roots_unchanged.character_identity, true);
  assert.ok(validation.changed_frames.length > 0);
});

test('Bundle preserves RNCS roots and authority fields', () => {
  const {visual, body, performance, scene, style} = fixtures();
  const bundle = createNativeVisualGenesisBundle({episodeIntentRoot: rootHash('episode'), characterVisualGenome: visual, bodyGraph: body, performancePlan: performance, sceneField: scene, styleLawSet: style, renderPlan: {render_plan_root: rootHash('render')}});
  assert.equal(bundle.format, 'rncs.native-visual-genesis-bundle.v0.1');
  assert.equal(bundle.authority, 'RNCS');
  assert.ok(bundle.bundle_root);
});

test('Frame artifacts can be written to an isolated output directory', () => {
  const {body, performance, scene, style} = fixtures();
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rncs-native-frame-'));
  const rendered = renderNativeFrame({body, performance: samplePerformanceFrame(performance, 0), scene, style, frameNumber: 0, width: 96, height: 54});
  const files = writeNativeFrameArtifacts({outDir, frameNumber: 0, rendered});
  for (const file of Object.values(files)) assert.equal(fs.existsSync(file), true);
  fs.rmSync(outDir, {recursive: true, force: true});
});
