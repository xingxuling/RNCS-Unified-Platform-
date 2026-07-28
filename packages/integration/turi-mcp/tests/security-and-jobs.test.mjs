import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ArtifactStore } from '../src/artifacts/store.mjs';
import { JobManager, JobStore } from '../src/jobs/store.mjs';
import { createTuriService } from '../src/service.mjs';

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'turi-security-test-'));
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
const waitFor = async (check, timeoutMs = 2_000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('Timed out waiting for test state.');
};

test('HTTP origin and bearer boundaries reject unauthorized requests', async () => {
  const dataDir = tempDir();
  const service = await createTuriService({ config: { host: '127.0.0.1', port: 0, authMode: 'bearer', bearerToken: 'turi-test-bearer-token-123456789', allowedHosts: ['127.0.0.1'], allowedOrigins: ['http://localhost'], repoRoot, dataDir } });
  await service.start();
  try {
    const badOrigin = await fetch(service.mcpUrl, { headers: { Origin: 'https://evil.example' } });
    assert.equal(badOrigin.status, 403);
    const missingBearer = await fetch(service.mcpUrl);
    assert.equal(missingBearer.status, 401);
  } finally {
    await service.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

test('public wildcard host accepts cloud-assigned Host after TURI auth', async () => {
  const dataDir = tempDir();
  const service = await createTuriService({ config: { host: '0.0.0.0', port: 0, authMode: 'bearer', bearerToken: 'turi-public-test-bearer-token-123456789', allowedHosts: ['*'], allowedOrigins: ['https://chatgpt.com'], repoRoot, dataDir } });
  await service.start();
  try {
    const response = await fetch(service.mcpUrl, {
      method: 'POST',
      headers: { Authorization: 'Bearer turi-public-test-bearer-token-123456789', Origin: 'https://chatgpt.com', Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'public-host-test', version: '0.1.0' } } }),
    });
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('mcp-session-id'));
  } finally {
    await service.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

test('jobs and artifacts survive Windows-safe persisted identifiers', async () => {
  const dataDir = tempDir();
  try {
    const store = new JobStore(dataDir);
    const manager = new JobManager({ store, workflows: { quick: async (input, context) => { context.event('stage', { status: 'RUNNING' }); return { ok: true, input }; } }, maxTimeoutMs: 5_000 });
    const job = manager.start('quick', { value: 7 });
    await waitFor(() => store.get(job.jobId)?.status === 'SUCCEEDED');
    assert.equal(store.get(job.jobId).result.input.value, 7);
    assert.ok(fs.readdirSync(path.join(dataDir, 'jobs')).some((file) => file.endsWith('.json')));
    const reloaded = new JobStore(dataDir);
    assert.equal(reloaded.get(job.jobId).status, 'SUCCEEDED');

    const artifacts = new ArtifactStore(dataDir, 10_000);
    const artifact = artifacts.put({ hello: 'world' }, { name: 'test.json' });
    assert.deepEqual(artifacts.read(artifact.artifactId).metadata, artifact);
    assert.ok(fs.readdirSync(path.join(dataDir, 'artifacts')).some((file) => file.endsWith('.data')));
  } finally {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
