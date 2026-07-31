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
    const preflight = await fetch(service.mcpUrl, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type, mcp-session-id',
      },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost');
    assert.match(preflight.headers.get('access-control-allow-headers') ?? '', /Mcp-Session-Id/i);
    const deniedPreflight = await fetch(service.mcpUrl, { method: 'OPTIONS', headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' } });
    assert.equal(deniedPreflight.status, 403);
    await client.connect(transport);
    const health = await service.health();
    assert.equal(health.rcl.status, 'ready');
    assert.equal(health.rcl.rncsFusion.ok, true);
    assert.equal(health.rcl.rncsFusion.evidenceCurrent, true);
    assert.equal(health.rncs.status, 'healthy');
    assert.equal(health.rncs.runtimes.length, 17);
    const listed = await client.listTools();
    assert.equal(listed.tools.length, 103);
    assert.ok(listed.tools.some((item) => item.name === 'turi_server_info'));
    assert.ok(listed.tools.some((item) => item.name === 'turi_experience_record'));
    assert.ok(listed.tools.some((item) => item.name === 'updia_research_start'));
    assert.ok(listed.tools.some((item) => item.name === 'updia_research_status'));
    assert.ok(listed.tools.some((item) => item.name === 'turi_request_host_reasoning'));
    assert.ok(listed.tools.some((item) => item.name === 'turi_resume_with_host_contribution'));
    assert.ok(listed.tools.some((item) => item.name === 'turi_record_assisted_experience'));
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
    const semanticReject = await client.callTool({ name: 'turi_candidate_execute', arguments: { source: '防止 AI copilot 将微弱、含糊的脑信号扩张成不可逆操作；要求区分神经证据与 AI 先验，支持拒答、人工确认、回滚、漂移检测和身份锚点。' } });
    assert.equal(semanticReject.isError, true);
    assert.match(semanticReject.content.map((item) => item.text ?? '').join('\n'), /SEMANTIC_COMPILATION_GATE_FAILED/);
    const candidate = await client.callTool({ name: 'turi_candidate_execute', arguments: { source: '创建一座小型以太岛。岛上有两个玩家出生点、一扇可开关的门、一盏蓝色能量灯和一个感应区域。玩家进入感应区域时，门自动打开，灯光增强并产生环境声音。两个客户端必须看到一致的门状态和玩家位置。' } });
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

test('stateless Streamable HTTP works across serverless request boundaries', async () => {
  const dataDir = tempDir();
  const service = await createTuriService({ config: {
    host: '127.0.0.1',
    port: 0,
    authMode: 'none',
    allowedHosts: ['127.0.0.1'],
    allowedOrigins: ['http://localhost'],
    repoRoot,
    dataDir,
    statelessHttp: true,
  } });
  await service.start();
  const client = new Client({ name: 'turi-stateless-test', version: '0.1.0' });
  const transport = new StreamableHTTPClientTransport(new URL(service.mcpUrl));
  try {
    await client.connect(transport);
    assert.equal(transport.sessionId, undefined);
    const listed = await client.listTools();
    assert.equal(listed.tools.length, 103);
    const health = await client.callTool({ name: 'turi_health', arguments: {} });
    assert.equal(health.isError, undefined);
    assert.equal(health.structuredContent.data.turi.status, 'ok');
  } finally {
    await client.close().catch(() => {});
    await service.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
