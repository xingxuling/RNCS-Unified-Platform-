import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRelayServer } from '../src/relay/server.mjs';
import { DMLLocalHost } from '../src/host/local-host.mjs';
import { randomToken } from '../src/shared/canonical.mjs';
import { signRequest } from '../src/shared/crypto.mjs';

async function browserGrant(base, loginCode, origin = 'http://localhost:5173') {
  const pair = await crypto.webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const deviceId = `browser:${randomToken(12)}`;
  const response = await fetch(`${base}/auth/exchange`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({
      login_code: loginCode,
      device_id: deviceId,
      public_key_jwk: await crypto.webcrypto.subtle.exportKey('jwk', pair.publicKey),
      label: 'E2E Browser',
    }),
  });
  assert.equal(response.status, 200);
  return response.json();
}

test('Lovable semantic action reaches local DML Core and returns a real projection', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dml-remote-e2e-'));
  const relay = createRelayServer({
    stateDir: path.join(root, 'relay'),
    host: '127.0.0.1',
    port: 0,
    allowedOrigins: ['http://localhost:5173'],
  });
  const created = relay.store.createSession({ name: 'e2e' });
  const info = await relay.listen();
  try {
    await DMLLocalHost.pair({
      relayUrl: info.url,
      sessionId: created.session.session_id,
      pairCode: created.credentials.pair_code,
      stateDir: path.join(root, 'host'),
      hostId: 'host:e2e',
    });
    const host = new DMLLocalHost({ stateDir: path.join(root, 'host'), pollWaitSeconds: 0 });
    await host.heartbeat(true);
    const base = `${info.url}/v1/sessions/${encodeURIComponent(created.session.session_id)}`;

    const unauthorized = await fetch(`${base}/projection`);
    assert.equal(unauthorized.status, 401);

    const deniedOrigin = await fetch(`${base}/auth/exchange`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: '{}',
    });
    assert.equal(deniedOrigin.status, 403);

    const auth = await browserGrant(base, created.credentials.browser_login_code);
    const intent = await fetch(`${base}/intent`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${auth.access_token}`,
        'content-type': 'application/json',
        origin: 'http://localhost:5173',
      },
      body: JSON.stringify({ action: {
        type: 'dml.goal.create',
        project_ref: { project_id: 'project:vsr', generation: 0, root: null },
        payload: { title: '真实远程任务', instruction: '验证 Relay 到 DML Core 的闭环' },
        authority: { max_risk: 'medium', require_reversible: true, approval_mode: 'when-required' },
      } }),
    });
    assert.equal(intent.status, 202);
    const accepted = await intent.json();
    assert.equal(accepted.status, 'accepted');

    const cycle = await host.runOnce();
    assert.equal(cycle.actions, 1);

    const projectionResponse = await fetch(`${base}/projection`, {
      headers: { authorization: `Bearer ${auth.access_token}`, origin: 'http://localhost:5173' },
    });
    assert.equal(projectionResponse.status, 200);
    const projection = await projectionResponse.json();
    const goals = Object.values(projection.state.goals || {});
    assert.equal(goals.some((goal) => goal.title === '真实远程任务'), true);
    assert.equal(relay.store.sessionStatus(created.session.session_id).completed_actions, 1);
  } finally {
    await relay.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('relay rejects replayed signed host request nonce', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dml-replay-e2e-'));
  const relay = createRelayServer({ stateDir: path.join(root, 'relay'), host: '127.0.0.1', port: 0 });
  const created = relay.store.createSession({ name: 'replay' });
  const info = await relay.listen();
  try {
    await DMLLocalHost.pair({
      relayUrl: info.url,
      sessionId: created.session.session_id,
      pairCode: created.credentials.pair_code,
      stateDir: path.join(root, 'host'),
      hostId: 'host:replay',
    });
    const host = new DMLLocalHost({ stateDir: path.join(root, 'host'), pollWaitSeconds: 0 });
    const config = host.config();
    const url = new URL(`${info.url}/v1/sessions/${encodeURIComponent(created.session.session_id)}/host/actions?after=0&wait=0`);
    const timestamp = String(Date.now());
    const nonce = `fixed-${randomToken(18)}`;
    const request = { method: 'GET', pathWithQuery: `${url.pathname}${url.search}`, timestamp, nonce, body: '' };
    const signature = signRequest(host.state.keys.privateKeyPem, request);
    const headers = {
      'x-dml-host-id': config.host_id,
      'x-dml-timestamp': timestamp,
      'x-dml-nonce': nonce,
      'x-dml-signature': signature,
    };
    const first = await fetch(url, { headers });
    const second = await fetch(url, { headers });
    assert.equal(first.status, 200);
    assert.equal(second.status, 409);
    assert.equal((await second.json()).error.code, 'REQUEST_REPLAYED');
  } finally {
    await relay.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
