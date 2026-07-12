#!/usr/bin/env node
import path from 'node:path';
import process from 'node:process';
import { RelayStore } from './store.mjs';
import { createRelayServer } from './server.mjs';

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function flag(name) {
  return process.argv.includes(name);
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function scopesArg(value) {
  if (!value) return undefined;
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

const command = process.argv[2] || 'help';
const stateDir = path.resolve(arg('--state', process.env.DML_RELAY_STATE || 'state/relay'));
const store = new RelayStore(stateDir);

if (command === 'create-session') {
  const result = store.createSession({ name: arg('--name', '数字蓝天机') });
  print({
    session_id: result.session.session_id,
    browser_login_code: result.credentials.browser_login_code,
    login_code_expires_at: result.credentials.login_code_expires_at,
    pair_code: result.credentials.pair_code,
    relay_public_key_pem: result.credentials.relay_public_key_pem,
    workbench_runtime_path: `/v1/sessions/${encodeURIComponent(result.session.session_id)}`,
    warning: 'login code 与 pair code 都只显示一次。浏览器登录后只持有短期授权。',
  });
  process.exit(0);
}

if (command === 'create-login-code') {
  const sessionId = arg('--session');
  if (!sessionId) throw new Error('--session is required');
  const ttlMinutes = Number(arg('--ttl-minutes', 10));
  const result = store.createLoginCode(sessionId, {
    ttlMs: ttlMinutes * 60 * 1000,
    scopes: scopesArg(arg('--scopes')),
    riskLimit: arg('--risk', 'high'),
    label: arg('--label', '浏览器设备'),
  });
  print({ session_id: sessionId, ...result, warning: 'login_code 只显示一次并且只能使用一次。' });
  process.exit(0);
}

if (command === 'devices') {
  const sessionId = arg('--session');
  if (!sessionId) throw new Error('--session is required');
  print({ session_id: sessionId, devices: store.listDevices(sessionId) });
  process.exit(0);
}

if (command === 'revoke-device') {
  const sessionId = arg('--session');
  const deviceId = arg('--device');
  if (!sessionId || !deviceId) throw new Error('--session and --device are required');
  print({ status: 'revoked', device: store.revokeDevice(sessionId, deviceId) });
  process.exit(0);
}

if (command === 'status') {
  const sessionId = arg('--session');
  if (!sessionId) throw new Error('--session is required');
  print(store.sessionStatus(sessionId));
  process.exit(0);
}

if (command === 'serve') {
  const allowedOrigins = String(arg('--origins', process.env.DML_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'))
    .split(',').map((item) => item.trim()).filter(Boolean);
  const relay = createRelayServer({
    stateDir,
    host: arg('--host', process.env.DML_RELAY_HOST || '127.0.0.1'),
    port: Number(arg('--port', process.env.PORT || 17901)),
    allowedOrigins,
    accessGrantTtlMs: Number(arg('--grant-ttl-ms', process.env.DML_GRANT_TTL_MS || 600_000)),
    allowLegacyBrowserTokens: flag('--allow-legacy-browser-token') || process.env.DML_ALLOW_LEGACY_BROWSER_TOKEN === '1',
  });
  const info = await relay.listen();
  print({ ...info, state_dir: stateDir, allowed_origins: allowedOrigins, protocol: 'dml.secure-relay.v0.3' });
  const stop = async () => { await relay.close(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
} else {
  process.stdout.write(`DML Secure Relay v0.3\n\nCommands:\n  create-session [--name NAME] [--state DIR]\n  create-login-code --session ID [--ttl-minutes 10] [--risk high] [--scopes LIST] [--label NAME]\n  devices --session ID [--state DIR]\n  revoke-device --session ID --device ID [--state DIR]\n  serve [--host HOST] [--port PORT] [--origins LIST] [--grant-ttl-ms MS] [--state DIR]\n  status --session ID [--state DIR]\n`);
}
