#!/usr/bin/env node
import path from 'node:path';
import process from 'node:process';
import { DMLLocalHost } from './local-host.mjs';

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

const command = process.argv[2] || 'help';
const stateDir = path.resolve(arg('--state', process.env.DML_HOST_STATE || 'state/host'));

if (command === 'pair') {
  const relayUrl = arg('--relay', process.env.DML_RELAY_URL);
  const sessionId = arg('--session', process.env.DML_SESSION_ID);
  const pairCode = arg('--code', process.env.DML_PAIR_CODE);
  if (!relayUrl || !sessionId || !pairCode) throw new Error('--relay, --session and --code are required');
  if (!relayUrl.startsWith('https://') && !process.argv.includes('--allow-http')) {
    throw new Error('Production pairing requires HTTPS. Use --allow-http only for local development.');
  }
  const result = await DMLLocalHost.pair({
    relayUrl,
    sessionId,
    pairCode,
    stateDir,
    hostId: arg('--host-id', null),
  });
  print(result);
  process.exit(0);
}

if (command === 'run') {
  const host = new DMLLocalHost({
    stateDir,
    policyFile: arg('--policy', process.env.DML_HOST_POLICY || null),
    dmlStateDir: arg('--dml-state', process.env.DML_CORE_STATE || null),
    pollWaitSeconds: Number(arg('--poll-wait', 20)),
  });
  print({ status: 'starting', ...host.health(), config: { ...host.config(), relay_public_key_pem: '[stored]' } });
  const controller = new AbortController();
  const stop = () => { controller.abort(); host.stop(); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  await host.run({
    signal: controller.signal,
    onStatus: (event) => print(event),
  });
  process.exit(0);
}

if (command === 'status') {
  const host = new DMLLocalHost({ stateDir, policyFile: arg('--policy', null) });
  print({ ...host.health(), config: { ...host.config(), relay_public_key_pem: '[stored]' } });
  process.exit(0);
}

process.stdout.write(`DML Local Host v0.3\n\nCommands:\n  pair --relay URL --session ID --code CODE [--allow-http] [--state DIR]\n  run [--policy FILE] [--state DIR] [--dml-state DIR]\n  status [--state DIR]\n`);
