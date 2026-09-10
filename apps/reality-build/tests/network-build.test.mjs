import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { createStudioNetworkWorld } from '../../../examples/studio-authored-network-world-v03/project.mjs';
import { HttpAuthorityClient } from '@taowind/reality-network-runtime';
import { buildProject, verifyBuild } from '../src/builder.mjs';
import { readJson, rootHash, verifySeal } from '../src/canonical.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function waitForHealth(url, child) {
  let lastError = null;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`headless server exited with ${child.exitCode}`);
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw lastError ?? new Error('headless server did not become healthy');
}

async function requestJson(url, method = 'GET', payload) {
  const response = await fetch(url, {
    method,
    headers: payload === undefined ? undefined : { 'content-type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

test('Reality Build carries the existing network compilation into a runnable local headless target', async () => {
  const { session, compilation } = createStudioNetworkWorld();
  const directory = fs.mkdtempSync(path.join(appRoot, 'output', 'network-build-test-'));
  const projectFile = path.join(directory, 'project.json');
  const outputDir = path.join(directory, 'output');
  fs.writeFileSync(projectFile, `${JSON.stringify(session.project)}\n`);
  let child = null;
  const port = 48000 + Math.floor(Math.random() * 1000);
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const build = buildProject({
      project_file: projectFile,
      output_dir: outputDir,
      targets: ['headless-server'],
      app: { app_id: 'com.taowind.networkbuild', title: 'Network Build Candidate', version_name: '0.1.0', version_code: 1 },
      build_time: '2026-09-10T00:00:00.000Z',
      runtime_trace: [{}, {}],
      spatial_trace: [],
    });
    const targetRoot = path.join(outputDir, 'headless-server');
    const networkArtifact = readJson(path.join(outputDir, 'network-world-compilation.json'));
    const targetNetworkArtifact = readJson(path.join(targetRoot, 'network-world-compilation.json'));
    const targetPackage = readJson(path.join(targetRoot, 'package.json'));
    const targetManifest = readJson(path.join(targetRoot, 'server-manifest.json'));
    const graph = readJson(path.join(outputDir, 'build-graph.json'));
    const receipt = readJson(path.join(outputDir, 'build-receipt.json'));

    assert.equal(build.verification.valid, true);
    assert.equal(verifyBuild(outputDir).valid, true);
    assert.equal(networkArtifact.compilation_root, compilation.compilation_root);
    assert.equal(targetNetworkArtifact.compilation_root, compilation.compilation_root);
    assert.equal(verifySeal(networkArtifact, 'compilation_root'), true);
    assert.equal(rootHash(networkArtifact.world_config), networkArtifact.world_config_root);
    assert.equal(receipt.network_compilation_root, compilation.compilation_root);
    assert.ok(receipt.core_files.some(file => file.path === 'network-world-compilation.json'));
    assert.equal(graph.nodes.some(node => node.id === 'network-compilation'), true);
    assert.equal(targetPackage.dependencies['@taowind/reality-network-runtime'], '^0.2.0-alpha.1');
    assert.deepEqual(targetManifest.network_endpoints, [
      '/network/health', '/network/join', '/network/input', '/network/tick',
      '/network/disconnect', '/network/reconnect', '/network/authority/health',
      '/network/authority/join', '/network/authority/input', '/network/authority/tick',
      '/network/authority/snapshot', '/network/authority/delta',
    ]);
    assert.equal(targetManifest.network_runtime_mode, 'loopback-local-candidate');

    child = spawn(process.execPath, ['server.mjs'], {
      cwd: targetRoot,
      env: { ...process.env, PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const health = await waitForHealth(baseUrl, child);
    assert.equal(health.deterministic, true);
    assert.equal(health.format, 'reality-build.headless-server.v0.2');

    const blue = await requestJson(`${baseUrl}/network/join`, 'POST', { slot_id: 'slot:blue', subject_id: 'subject:blue' });
    const red = await requestJson(`${baseUrl}/network/join`, 'POST', { slot_id: 'slot:red', subject_id: 'subject:red' });
    assert.equal(blue.playerId, 'blue');
    assert.equal(red.playerId, 'red');
    const input = await requestJson(`${baseUrl}/network/input`, 'POST', {
      player_id: 'blue',
      command: { type: 'move', x: 1_000_000, z: 0 },
    });
    assert.equal(input.playerId, 'blue');
    const tick = await requestJson(`${baseUrl}/network/tick`, 'POST', { ticks: 1 });
    assert.equal(tick.tick, 1);
    const networkHealth = await requestJson(`${baseUrl}/network/health`);
    assert.equal(networkHealth.source.compilationRoot, compilation.compilation_root);
    assert.equal(networkHealth.source.projectRoot, compilation.project_root);
    assert.equal(networkHealth.server.tick, 1);
    assert.equal(networkHealth.clients.blue.syncStatus, 'synchronized');
    assert.equal(networkHealth.clients.red.syncStatus, 'synchronized');

    const authorityClient = new HttpAuthorityClient({ baseUrl });
    const authorityJoin = await authorityClient.join({ slotId: 'slot:blue', subjectId: 'subject:blue' });
    const accepted = await authorityClient.submitInput({ type: 'move', x: -1_000_000, z: 0 });
    assert.equal(accepted.accepted, true);
    const authorityTick = await authorityClient.tick(1);
    assert.equal(authorityTick.reconciliation.converged, true);
    const authorityHealth = await authorityClient.health();
    assert.equal(authorityHealth.externalClients.blue.connected, true);
    assert.equal(authorityClient.metrics().syncStatus, 'synchronized');

    const networkFile = path.join(outputDir, 'network-world-compilation.json');
    const networkFileBytes = fs.readFileSync(networkFile);
    fs.appendFileSync(networkFile, '\n');
    assert.equal(verifyBuild(outputDir).valid, false);
    fs.writeFileSync(networkFile, networkFileBytes);
    assert.equal(verifyBuild(outputDir).valid, true);
    fs.rmSync(networkFile);
    assert.equal(verifyBuild(outputDir).valid, false);
  } finally {
    if (child) {
      child.kill('SIGTERM');
      await new Promise(resolve => child.once('exit', resolve));
    }
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

console.log('network build integration test: 1 PASS');
