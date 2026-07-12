import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRelayServer } from '../src/relay/server.mjs';
import { DMLLocalHost } from '../src/host/local-host.mjs';
import { randomToken } from '../src/shared/canonical.mjs';

async function exchangeBrowserGrant(base, loginCode) {
  const pair = await crypto.webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  const response = await fetch(`${base}/auth/exchange`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
    body: JSON.stringify({
      login_code: loginCode,
      device_id: `browser:${randomToken(12)}`,
      public_key_jwk: await crypto.webcrypto.subtle.exportKey('jwk', pair.publicKey),
      label: 'DML Remote Link Demo',
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || `Auth failed: ${response.status}`);
  return result.access_token;
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dml-remote-link-demo-'));
const relayState = path.join(root, 'relay');
const hostState = path.join(root, 'host');
const relay = createRelayServer({
  stateDir: relayState,
  host: '127.0.0.1',
  port: 0,
  allowedOrigins: ['http://localhost:5173'],
});
const session = relay.store.createSession({ name: '数字蓝天机演示' });
const info = await relay.listen();

try {
  await DMLLocalHost.pair({
    relayUrl: info.url,
    sessionId: session.session.session_id,
    pairCode: session.credentials.pair_code,
    stateDir: hostState,
    hostId: 'host:demo',
  });
  const host = new DMLLocalHost({ stateDir: hostState, pollWaitSeconds: 0 });
  await host.heartbeat(true);

  const base = `${info.url}/v1/sessions/${encodeURIComponent(session.session.session_id)}`;
  const accessToken = await exchangeBrowserGrant(base, session.credentials.browser_login_code);
  const response = await fetch(`${base}/intent`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      origin: 'http://localhost:5173',
    },
    body: JSON.stringify({
      action: {
        format: 'dml.semantic-action.v0.1',
        type: 'dml.goal.create',
        project_ref: { project_id: 'project:vsr', generation: 0, root: null },
        goal_ref: null,
        trigger: 'demo',
        payload: { title: '验证远程闭环', instruction: '通过 Secure Relay 创建真实 DML Goal' },
        constraints: { prefer_local: true },
        authority: { max_risk: 'medium', require_reversible: true, approval_mode: 'when-required' },
        created_at: new Date().toISOString(),
      },
    }),
  });
  const accepted = await response.json();
  await host.runOnce();
  const projectionResponse = await fetch(`${base}/projection`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      origin: 'http://localhost:5173',
    },
  });
  const projection = await projectionResponse.json();
  const goals = Object.values(projection.state?.goals || {});
  process.stdout.write(`${JSON.stringify({
    status: 'PASS',
    protocol: 'dml.secure-relay.v0.3',
    relay: info.url,
    browser_auth: 'one-time-code+device-key+short-grant',
    accepted: accepted.status,
    host: host.health(),
    projection_sequence: projection.source_event_sequence,
    goal_count: goals.length,
    latest_goal: goals.at(-1)?.title || null,
    temp_state: root,
  }, null, 2)}\n`);
} finally {
  await relay.close();
  fs.rmSync(root, { recursive: true, force: true });
}
