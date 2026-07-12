import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRelayServer } from '../src/relay/server.mjs';
import { randomToken } from '../src/shared/canonical.mjs';
import { requestSigningText } from '../src/shared/crypto.mjs';

async function makeDevice() {
  const pair = await crypto.webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  return {
    privateKey: pair.privateKey,
    publicJwk: await crypto.webcrypto.subtle.exportKey('jwk', pair.publicKey),
    deviceId: `browser:${randomToken(12)}`,
  };
}

async function signedDeviceHeaders(device, url, body = '') {
  const timestamp = String(Date.now());
  const nonce = randomToken(24);
  const text = requestSigningText({
    method: 'POST',
    pathWithQuery: `${url.pathname}${url.search}`,
    timestamp,
    nonce,
    body,
  });
  const signature = Buffer.from(await crypto.webcrypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    device.privateKey,
    Buffer.from(text),
  )).toString('base64url');
  return {
    'x-dml-device-id': device.deviceId,
    'x-dml-timestamp': timestamp,
    'x-dml-nonce': nonce,
    'x-dml-device-signature': signature,
  };
}

test('one-time login code registers a non-secret browser device and issues short grant', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dml-browser-auth-'));
  const relay = createRelayServer({
    stateDir: path.join(root, 'relay'),
    host: '127.0.0.1',
    port: 0,
    allowedOrigins: ['http://localhost:5173'],
    accessGrantTtlMs: 2_000,
  });
  const created = relay.store.createSession({ name: 'auth' });
  const info = await relay.listen();
  try {
    const base = `${info.url}/v1/sessions/${encodeURIComponent(created.session.session_id)}`;
    const device = await makeDevice();
    const exchange = await fetch(`${base}/auth/exchange`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
      body: JSON.stringify({
        login_code: created.credentials.browser_login_code,
        device_id: device.deviceId,
        public_key_jwk: device.publicJwk,
        label: '测试浏览器',
      }),
    });
    assert.equal(exchange.status, 200);
    const connected = await exchange.json();
    assert.equal(connected.status, 'connected');
    assert.equal(connected.grant.device_id, device.deviceId);
    assert.equal(connected.grant.origin, 'http://localhost:5173');
    assert.equal(typeof connected.access_token, 'string');

    const reused = await fetch(`${base}/auth/exchange`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
      body: JSON.stringify({
        login_code: created.credentials.browser_login_code,
        device_id: device.deviceId,
        public_key_jwk: device.publicJwk,
      }),
    });
    assert.equal(reused.status, 409);

    const projection = await fetch(`${base}/projection`, {
      headers: { authorization: `Bearer ${connected.access_token}`, origin: 'http://localhost:5173' },
    });
    assert.equal(projection.status, 200);

    const refreshUrl = new URL(`${base}/auth/refresh`);
    const body = '{}';
    const refresh = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:5173',
        ...(await signedDeviceHeaders(device, refreshUrl, body)),
      },
      body,
    });
    assert.equal(refresh.status, 200);
    const refreshed = await refresh.json();
    assert.notEqual(refreshed.access_token, connected.access_token);

    const revoke = await fetch(`${base}/auth/revoke`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${refreshed.access_token}`,
        'content-type': 'application/json',
        origin: 'http://localhost:5173',
      },
      body: JSON.stringify({ device_id: device.deviceId }),
    });
    assert.equal(revoke.status, 200);

    const denied = await fetch(`${base}/projection`, {
      headers: { authorization: `Bearer ${refreshed.access_token}`, origin: 'http://localhost:5173' },
    });
    assert.equal(denied.status, 401);
  } finally {
    await relay.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
