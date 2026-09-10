import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createStudioNetworkWorld } from '../../../examples/studio-authored-network-world-v03/project.mjs';
import {
  compileStudioWorldBodyCandidate,
} from '@taowind/world-body-studio-bridge';
import {
  createWorldBodyRealityBuildPresentationCandidate,
  verifyWorldBodyBuildPresentationCandidate,
} from '../src/world-body-candidate.mjs';
import { createWorldBodyEventRuntime } from '@taowind/world-body-ir/event-runtime';
import { buildProject, verifyBuild } from '../src/builder.mjs';
import { readJson } from '../src/canonical.mjs';

test('Reality Build consumes the same World Body candidate through its existing presentation binding seam', () => {
  const { session, compilation: networkCompilation } = createStudioNetworkWorld();
  const candidate = compileStudioWorldBodyCandidate(session.project, { networkCompilation });
  const presentationCandidate = createWorldBodyRealityBuildPresentationCandidate({
    project: session.project,
    candidate,
    presentationScene: session.exportArtifacts().spatial_scene,
  });
  assert.equal(verifyWorldBodyBuildPresentationCandidate(presentationCandidate), true);
  assert.equal(presentationCandidate.presentation.bindings.length, 6);
  assert.equal(presentationCandidate.presentation.unmapped_bodies.length, 0);

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'reality-build-world-body-'));
  const projectFile = path.join(directory, 'candidate-project.json');
  const outputDir = path.join(directory, 'output');
  fs.writeFileSync(projectFile, `${JSON.stringify(session.project)}\n`);
  const build = buildProject({
    project_file: projectFile,
    output_dir: outputDir,
    targets: ['web-release'],
    app: { app_id: 'com.taowind.worldbodybuild', title: 'World Body Build Candidate', version_name: '0.1.0', version_code: 1 },
    build_time: '2026-09-10T00:00:00.000Z',
    runtime_trace: [{}, {}],
    spatial_trace: [],
    presentation_candidate: presentationCandidate,
  });
  const evidence = readJson(path.join(outputDir, 'runtime-evidence.json'));
  assert.equal(build.verification.valid, true);
  assert.equal(verifyBuild(outputDir).valid, true);
  assert.equal(evidence.presentation_scene_bound, true);
  assert.equal(evidence.presentation_scene_source_root, presentationCandidate.presentation.presentation_source_root);
  assert.equal(evidence.presentation_binding_count, 6);
  assert.ok(evidence.presentation_scene_frame_root);
});

test('Reality Build candidate binding fails closed when a World Body has no presentation node', () => {
  const { session, compilation: networkCompilation } = createStudioNetworkWorld();
  const candidate = compileStudioWorldBodyCandidate(session.project, { networkCompilation });
  const scene = session.exportArtifacts().spatial_scene;
  scene.nodes = scene.nodes.filter(node => node.id !== 'body:orb');
  assert.throws(
    () => createWorldBodyRealityBuildPresentationCandidate({ project: session.project, candidate, presentationScene: scene }),
    error => error.code === 'REALITY_BUILD_WORLD_BODY_PRESENTATION_UNMAPPED',
  );
});

test('Reality Build carries explicit World Body event delivery into the candidate runtime boundary', () => {
  const { session, compilation: networkCompilation } = createStudioNetworkWorld();
  const event = {
    id: 'event:studio:contact:1:0',
    source: 'interaction',
    kind: 'contact-begin',
    tick: 1,
    sequence: 0,
    sourceAuthorityRoot: session.project.project_root,
    exactlyOnceKey: `${session.project.project_root}:1:0`,
    routes: [{ id: 'route:audio:hero-contact', consumer: 'audio', target: 'audio:hero-contact' }],
  };
  const candidate = compileStudioWorldBodyCandidate(session.project, { networkCompilation, events: [event] });
  const eventRuntime = createWorldBodyEventRuntime({ ir: candidate.worldBody.ir });
  assert.equal(eventRuntime.dispatchTick(1).receipts[0].status, 'blocked-provider');
  eventRuntime.setProvider('audio', { providerId: 'test-audio-provider', deliver: () => ({ status: 'delivered' }) });
  assert.equal(eventRuntime.dispatchTick(1).receipts[0].status, 'delivered');
  assert.equal(eventRuntime.dispatchTick(1).receipts[0].status, 'duplicate-suppressed');

  const presentationCandidate = createWorldBodyRealityBuildPresentationCandidate({
    project: session.project,
    candidate,
    presentationScene: session.exportArtifacts().spatial_scene,
  });
  assert.equal(verifyWorldBodyBuildPresentationCandidate(presentationCandidate), true);
  assert.equal(presentationCandidate.presentation.event_delivery_plan.deliveries.length, 1);

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'reality-build-world-body-events-'));
  const projectFile = path.join(directory, 'candidate-project.json');
  const outputDir = path.join(directory, 'output');
  fs.writeFileSync(projectFile, `${JSON.stringify(session.project)}\n`);
  const build = buildProject({
    project_file: projectFile,
    output_dir: outputDir,
    targets: ['web-release'],
    app: { app_id: 'com.taowind.worldbodyevents', title: 'World Body Event Build Candidate', version_name: '0.1.0', version_code: 1 },
    build_time: '2026-09-10T00:00:00.000Z',
    runtime_trace: [{}, {}],
    spatial_trace: [],
    presentation_candidate: presentationCandidate,
  });
  const evidence = readJson(path.join(outputDir, 'runtime-evidence.json'));
  const browserData = fs.readFileSync(path.join(outputDir, 'web-release', 'build-data.js'), 'utf8');
  const browserRuntime = fs.readFileSync(path.join(outputDir, 'web-release', 'game.js'), 'utf8');
  assert.equal(build.verification.valid, true);
  assert.equal(verifyBuild(outputDir).valid, true);
  assert.equal(evidence.presentation_event_delivery_count, 1);
  assert.ok(evidence.presentation_event_delivery_plan_root);
  assert.deepEqual(evidence.presentation_event_consumer_counts, { audio: 1 });
  assert.match(browserData, /world_body_event_delivery_plan/);
  assert.match(browserRuntime, /dispatchWorldBodyEventTick/);
  assert.match(browserRuntime, /blocked-provider/);
});
