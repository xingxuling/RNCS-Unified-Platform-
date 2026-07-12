#!/usr/bin/env node
import path from 'node:path';
import process from 'node:process';
import { CognitiveDMLRuntime as DMLRuntime } from './cognitive-runtime-wrapper.mjs';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', async () => {
  try {
    const request = JSON.parse(input.trim().split(/\r?\n/).filter(Boolean).at(-1) || '{}');
    const stateDir = process.env.DML_STATE_DIR || path.resolve('state');
    const runtime = new DMLRuntime({ stateDir });
    const action = request.action || request.method || 'health';
    const payload = request.payload || {};
    let result;
    if (action === 'health') result = runtime.health();
    else if (action === 'describe') result = runtime.describe();
    else if (action === 'compileIntent') result = runtime.compileIntent(payload.action || payload, payload.host || {});
    else if (action === 'execute') result = runtime.execute(payload.action || payload, payload.options || {});
    else if (action === 'project') result = runtime.project();
    else if (action === 'readEvents') result = runtime.readEvents();
    else if (action === 'demo') result = runtime.demo(payload);
    else throw Object.assign(new Error(`Unsupported DML action: ${action}`), { code: 'DML_ACTION_UNSUPPORTED' });
    process.stdout.write(`${JSON.stringify({ result })}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ error: { code: error.code || 'ERROR', message: error.message, details: error.details || null } })}\n`);
    process.exitCode = 1;
  }
});
