import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createTuriService } from '../src/service.mjs';

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'turi-http-test-'));
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');

test('Streamable HTTP exposes MCP initialize, tools, resources, and candidate E2E', async () => {
  const dataDir = tempDir();
  const service = await createTuriService({ config: { host: '127.0.0.1', port: 0, authMode: 'none', allowedHosts: ['127.0.0.1'], allowedOrigins: ['http://localhost'], repoRoot, dataDir } });
  await service.start();
  const client = new Client({ name: 'turi-integration-test', version: '0.1.0' });
  const transport = new StreamableHTTPClientTransport(new URL(service.mcpUrl));
  try {
    const protectedResource = await fetch(`${service.url}/.well-known/oauth-protected-resource/mcp`);
    assert.equal(protectedResource.status, 200);
    assert.deepEqual(await protectedResource.json(), { resource: service.mcpUrl });
    const rootProtectedResource = await fetch(`${service.url}/.well-known/oauth-protected-resource`);
    assert.equal(rootProtectedResource.status, 200);
    assert.deepEqual(await rootProtectedResource.json(), { resource: service.mcpUrl });
    await client.connect(transport);
    const health = await service.health();
    assert.equal(health.rcl.status, 'ready');
    assert.equal(health.rcl.rncsFusion.ok, true);
    assert.equal(health.rcl.rncsFusion.evidenceCurrent, true);
    assert.equal(health.rncs.status, 'healthy');
    assert.equal(health.rncs.runtimes.length, 17);
    const listed = await client.listTools();
    assert.equal(listed.tools.length, 98);
    assert.ok(listed.tools.some((item) => item.name === 'turi_server_info'));
    assert.ok(listed.tools.some((item) => item.name === 'turi_experience_record'));
    const info = await client.callTool({ name: 'turi_server_info', arguments: {} });
    assert.equal(info.isError, undefined);
    const evidenceResource = await client.readResource({ uri: `turi://evidence/${encodeURIComponent(info.structuredContent.receipt.receiptId)}` });
    assert.ok(evidenceResource.contents[0].text.includes('turi.evidence-receipt.v0.1'));
    const artifact = service.artifacts.put({ source: 'resource-test' }, { name: 'resource-test.json' });
    const artifactResource = await client.readResource({ uri: `turi://artifacts/${encodeURIComponent(artifact.artifactId)}` });
    assert.ok(artifactResource.contents[0].text.includes(artifact.artifactId));
    const persistedJob = service.jobs.store.create('resource-test', { ok: true });
    const jobResource = await client.readResource({ uri: `turi://jobs/${encodeURIComponent(persistedJob.jobId)}` });
    assert.ok(jobResource.contents[0].text.includes(persistedJob.jobId));
    const search = await client.callTool({ name: 'turi_capability_search', arguments: { query: 'subject_create', limit: 5 } });
    assert.equal(search.isError, undefined);
    assert.match(search.content[0].text, /updia\.subject_create/);
    const unsupported = await client.callTool({ name: 'turi_capability_invoke', arguments: { capabilityId: 'updia.subject_create', input: {} } });
    assert.equal(unsupported.isError, true);
    assert.match(unsupported.content[0].text, /CAPABILITY_NOT_IMPLEMENTED/);
    const resources = await client.listResources();
    assert.ok(resources.resources.some((item) => item.uri === 'turi://server/info'));
    const serverInfo = await client.readResource({ uri: 'turi://server/info' });
    assert.ok(serverInfo.contents.length >= 1);
    const candidate = await client.callTool({ name: 'turi_candidate_execute', arguments: { source: '创建一座小型以太岛。' } });
    assert.equal(candidate.isError, undefined);
    const text = candidate.content.map((item) => item.text ?? '').join('\n');
    assert.match(text, /turi\.candidate-workflow\.v0\.1/);
    assert.match(text, /unchanged/);
  } finally {
    await client.close().catch(() => {});
    await service.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
