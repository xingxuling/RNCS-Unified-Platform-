import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startStudioServer } from '../src/server.mjs';

const post = (url, route, body) => fetch(url + route, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
}).then(async response => ({ response, body: await response.json() }));

test('server exposes Reality Graph adapter, controls, evidence, and verified viewport', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reality-studio-graph-'));
  const { server, url } = await startStudioServer({ port: 0, dataDir });
  try {
    let result = await post(url, '/api/reality-studio/session/new', { session_id: 'test:http-reality-graph' });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.format, 'taowind.reality-studio-adapter.v0.1');
    assert.equal(result.body.runtime.status, 'healthy');
    assert.equal(result.body.graph.nodes.length, 14);
    assert.equal(result.body.commit_gate.production_promotion_permitted, false);

    result = await post(url, '/api/reality-studio/session/command', {
      session_id: result.body.session_id,
      command: 'step',
      behavior_input: { move_right: true },
      network_input: { player_id: 'blue', command: { type: 'move', x: 1000000, z: 0 } },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.runtime.tick, 1);
    assert.equal(result.body.runtime.clients.blue.syncStatus, 'synchronized');
    assert.ok(result.body.evidence.ledger_root);
    assert.equal(result.body.integration.entry_count, 1);
    assert.equal(result.body.integration.entries[0].network_input_present, true);

    const sessionId = result.body.session_id;
    result = await post(url, '/api/reality-studio/session/command', { session_id: sessionId, command: 'snapshot', label: 'http-snapshot' });
    assert.equal(result.body.snapshots.length, 1);
    assert.ok(result.body.snapshots[0].snapshot_root);

    result = await post(url, '/api/reality-studio/session/command', { session_id: sessionId, command: 'replay', verify: true });
    assert.equal(result.body.replay.deterministic, true);
    assert.equal(result.body.replay.status, 'verified');
    assert.equal(result.body.replay.scope, 'isolated-behavior-network-replay');
    assert.equal(result.body.replay.canonical_state_mutated, false);
    assert.equal(result.body.replay.active_runtime_unchanged, true);
    assert.ok(result.body.replay.replay_root);

    result = await post(url, '/api/reality-studio/session/viewport', { session_id: sessionId });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.viewport.frame_verified, true);
    assert.match(result.body.viewport_png_data_url, /^data:image\/png;base64,/);
    assert.deepEqual(Buffer.from(result.body.viewport_png_data_url.split(',')[1], 'base64').subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
