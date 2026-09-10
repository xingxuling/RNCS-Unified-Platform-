import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {createLargeWorldRuntime, createLargeWorldSpatialGlbBundle, verifyLargeWorldSpatialScene, verifyLargeWorldSpatialGlbBundle} from '@taowind/large-world-runtime';
import {createStudioNetworkWorld} from '../../../examples/studio-authored-network-world-v03/project.mjs';
import {
  createSpatialAssetBindingPlan,
  createSpatialPresentationCandidate,
  verifySpatialPresentationCandidate,
} from '../src/presentation-candidate.mjs';
import {buildProject, verifyBuild} from '../src/builder.mjs';
import {readJson, rootHash} from '../src/canonical.mjs';

test('Reality Build consumes an existing Large World VSR scene through the generic presentation seam', () => {
  const {session} = createStudioNetworkWorld();
  const runtime = createLargeWorldRuntime({
    worldId: 'world:large-build-candidate',
    seed: 'bridge-seed',
    width: 3,
    depth: 3,
    maxActiveChunks: 4,
  });
  runtime.observe({position: {x: 0, z: 0}});
  const selection = runtime.selectActiveRepresentationPortfolios({quality_profile: 'MOBILE'});
  const scene = runtime.createSpatialScene({selection});
  assert.equal(verifyLargeWorldSpatialScene(scene).valid, true);
  const region = runtime.getRegion();
  const spatialAssetBundle = createLargeWorldSpatialGlbBundle(scene);
  assert.equal(verifyLargeWorldSpatialGlbBundle(spatialAssetBundle, {sceneRoot: scene.scene_root}).valid, true);
  const assetBindings = createSpatialAssetBindingPlan({scene, assetBundle: spatialAssetBundle});
  assert.ok(assetBindings.length > 0);
  assert.ok(assetBindings.every(binding => binding.assets.length === 3 && binding.node_ids.length > 0));
  const presentationCandidate = createSpatialPresentationCandidate({
    projectRoot: session.project.project_root,
    scene,
    source: {
      kind: 'large-world-runtime',
      world_id: scene.large_world.world_id,
      generation: scene.large_world.generation,
      region_root: scene.large_world.region_root,
      world_root: scene.large_world.world_root,
      selection_root: selection.selection_root,
      source_region_root: region.region_root,
    },
    assetBundle: spatialAssetBundle,
    assetBindings,
  });
  assert.equal(verifySpatialPresentationCandidate(presentationCandidate), true);
  const payloadTampered = structuredClone(presentationCandidate);
  const encoded = payloadTampered.presentation.asset_bundle.assets[0].payload_base64;
  payloadTampered.presentation.asset_bundle.assets[0].payload_base64 = `${encoded[0] === 'A' ? 'B' : 'A'}${encoded.slice(1)}`;
  assert.equal(verifySpatialPresentationCandidate(payloadTampered), false);
  assert.equal(presentationCandidate.presentation.bindings.length, 0);

  const tampered = structuredClone(presentationCandidate);
  tampered.presentation.scene.nodes[0].id = `${tampered.presentation.scene.nodes[0].id}:tampered`;
  assert.equal(verifySpatialPresentationCandidate(tampered), false);

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'reality-build-large-world-'));
  const projectFile = path.join(directory, 'candidate-project.json');
  const outputDir = path.join(directory, 'output');
  fs.writeFileSync(projectFile, `${JSON.stringify(session.project)}\n`);
  const build = buildProject({
    project_file: projectFile,
    output_dir: outputDir,
    targets: ['web-release', 'web-single'],
    app: {app_id: 'com.taowind.largeworldbuild', title: 'Large World Build Candidate', version_name: '0.1.0', version_code: 1},
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
  assert.equal(evidence.presentation_binding_count, 0);
  assert.equal(evidence.presentation_asset_binding_count, assetBindings.length);
  assert.ok(evidence.presentation_scene_frame_root);
  assert.ok(evidence.presentation_asset_streaming_root);
  assert.equal(evidence.presentation_asset_requested_count, 4);
  assert.equal(evidence.presentation_asset_missing_count, 0);
  assert.equal(evidence.presentation_asset_bundle_root, presentationCandidate.presentation.asset_bundle.asset_bundle_root);
  assert.equal(evidence.presentation_asset_provider_bundle_root, spatialAssetBundle.bundle_root);
  assert.equal(evidence.presentation_asset_payload_count, spatialAssetBundle.assets.length);
  assert.equal(evidence.presentation_asset_payload_bytes, spatialAssetBundle.assets.reduce((sum, entry) => sum + entry.record.byteLength, 0));
  const payloadManifest = readJson(path.join(outputDir, 'web-release', 'spatial-asset-payload-manifest.json'));
  const {payload_root: payloadRoot, ...payloadManifestBase} = payloadManifest;
  assert.equal(payloadRoot, rootHash(payloadManifestBase));
  assert.equal(payloadManifest.source_asset_bundle_root, presentationCandidate.presentation.asset_bundle.asset_bundle_root);
  assert.equal(payloadManifest.asset_bindings.length, assetBindings.length);
  assert.equal(payloadManifest.payload_count, spatialAssetBundle.assets.length);
  assert.equal(payloadManifest.payloads.length, spatialAssetBundle.assets.length);
  assert.equal(payloadManifest.payloads.every(payload => fs.existsSync(path.join(outputDir, 'web-release', payload.uri.slice(2)))), true);
  const singleHtml = fs.readFileSync(path.join(outputDir, 'web-single', 'Large World Build Candidate_单文件版.html'), 'utf8');
  assert.match(singleHtml, /reality-build\.spatial-presentation-payloads\.v0\.1/);
  assert.match(singleHtml, /"base64":"[A-Za-z0-9+/]+=*/);
});

test('Reality Build rejects a self-sealed presentation candidate from another project', () => {
  const {session} = createStudioNetworkWorld();
  const runtime = createLargeWorldRuntime({worldId: 'world:large-build-root-check', seed: 'root-check', width: 3, depth: 3, maxActiveChunks: 1});
  runtime.observe({position: {x: 0, z: 0}});
  const selection = runtime.selectActiveRepresentationPortfolios({quality_profile: 'MOBILE'});
  const scene = runtime.createSpatialScene({selection});
  const candidate = createSpatialPresentationCandidate({
    projectRoot: 'project-root:other',
    scene,
    source: {kind: 'large-world-runtime', world_id: scene.large_world.world_id, world_root: scene.large_world.world_root},
  });
  assert.equal(verifySpatialPresentationCandidate(candidate), true);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'reality-build-large-world-root-'));
  const projectFile = path.join(directory, 'candidate-project.json');
  fs.writeFileSync(projectFile, `${JSON.stringify(session.project)}\n`);
  assert.throws(
    () => buildProject({project_file: projectFile, output_dir: path.join(directory, 'output'), targets: ['web-release'], presentation_candidate: candidate}),
    error => error.code === 'PRESENTATION_CANDIDATE_PROJECT_ROOT_MISMATCH',
  );
});

console.log('large-world presentation candidate tests: 2 PASS');
