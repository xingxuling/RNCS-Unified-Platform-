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
