import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { UpdiaAdapter } from '../src/adapters/updia.mjs';
import { ReceiptStore, createEvidenceReceipt } from '../src/evidence/receipt.mjs';

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'turi-test-'));

test('EvidenceReceipt hashes and persists the execution boundary', () => {
  const dataDir = tempDir();
  try {
    const manifest = { capabilityId: 'test.capability', implementation: 'adapter', evidenceLevel: 'executed' };
    const receipt = createEvidenceReceipt(manifest, { b: 2, a: 1 }, { ok: true }, { stateRootBefore: 'root:a', stateRootAfter: 'root:b', candidateId: 'candidate:1', revision: 2, warnings: ['bounded'] });
    assert.equal(receipt.format, 'turi.evidence-receipt.v0.1');
    assert.match(receipt.inputHash, /^sha256:[0-9a-f]{64}$/);
    assert.match(receipt.outputHash, /^sha256:[0-9a-f]{64}$/);
    const store = new ReceiptStore(dataDir);
    store.save(receipt);
    assert.deepEqual(store.get(receipt.receiptId), receipt);
    assert.equal(store.list(10).length, 1);
  } finally {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

test('UPDIA adapter maps only real bridge methods and strips undefined fields', async () => {
  const calls = [];
  const adapter = new UpdiaAdapter({ config: {}, invokeBridge: async (method, params) => { calls.push({ method, params }); return { method, params }; } });
  await adapter.think({ goal: '检查世界状态' });
  await adapter.memoryWriteCandidate({ statement: '门是关闭的', claimType: 'state', sourceRefs: ['receipt:1'] });
  await adapter.actionPropose({ turnId: 'turn:1', tool: 'rncs_status', arguments: {}, agentMode: 'ask' });
  await adapter.actionResultIngest({ permitId: 'permit:1', ok: true });
  await adapter.learnFromResult({ turnId: 'turn:1', success: true });
  assert.deepEqual(calls.map((item) => item.method), ['generate', 'knowledge_writeback', 'adjudicate_action', 'record_execution', 'feedback']);
  for (const call of calls) {
    assert.equal(JSON.stringify(call.params).includes('undefined'), false);
    assert.equal(Object.values(call.params).some((value) => value === undefined), false);
    assert.equal(Object.hasOwn(call.params, 'confirmation_token'), false);
  }
});

test('UPDIA configuration requires a bootstrap or persisted checkpoint', () => {
  const dataDir = tempDir();
  try {
    const adapter = new UpdiaAdapter({ config: { updiaEntry: path.join(dataDir, 'cli.mjs'), updiaStateDir: dataDir } });
    assert.equal(adapter.configured(), false);
    fs.writeFileSync(path.join(dataDir, 'checkpoint.json'), JSON.stringify({
      format: 'updia.subject-checkpoint.v6.2',
      identityRoot: 'a'.repeat(64),
      lineageId: 'updia-lineage:test',
    }), 'utf8');
    fs.writeFileSync(path.join(dataDir, 'cli.mjs'), '// test entry\n', 'utf8');
    assert.equal(adapter.configured(), true);
  } finally {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

test('UPDIA adapter calls a protected remote HTTP bridge with a validated envelope', async () => {
  const calls = [];
  const adapter = new UpdiaAdapter({
    config: {
      updiaBridgeUrl: 'https://updia.example.test',
      updiaBridgeToken: 'test-updia-bridge-token-0123456789',
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      const request = JSON.parse(options.body);
      return new Response(JSON.stringify({
        id: request.id,
        ok: true,
        result: { packet: { packetId: 'packet:test' }, trace: { traceId: 'trace:test' } },
        error: null,
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });
  const result = await adapter.memorySearch({ query: '真实 UPDIA 知识检索', retrievalBudget: 5 });
  assert.equal(result.packet.packetId, 'packet:test');
  assert.equal(calls[0].url, 'https://updia.example.test/invoke');
  assert.equal(calls[0].options.headers.authorization, 'Bearer test-updia-bridge-token-0123456789');
  assert.equal(JSON.parse(calls[0].options.body).method, 'knowledge_query');
});

test('UPDIA adapter resolves and caches a fresh allow-listed bridge discovery route', async () => {
  const discoveryUrl = 'https://discovery.example.test/updia-route.json';
  const bridgeUrl = 'https://current-updia-route.trycloudflare.com';
  let discoveryCalls = 0;
  let bridgeCalls = 0;
  const adapter = new UpdiaAdapter({
    config: {
      updiaBridgeDiscoveryUrl: discoveryUrl,
      updiaBridgeAllowedHostSuffixes: ['.trycloudflare.com'],
      updiaBridgeDiscoveryCacheMs: 60_000,
    },
    fetchImpl: async (url, options) => {
      if (url === discoveryUrl) {
        discoveryCalls += 1;
        const route = {
          format: 'taowind.updia-bridge-route.v0.1',
          url: bridgeUrl,
          updatedAt: new Date(Date.now() - 1_000).toISOString(),
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        };
        return new Response(JSON.stringify({ files: { 'updia-bridge-route.json': { content: JSON.stringify(route) } } }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      bridgeCalls += 1;
      assert.equal(url, `${bridgeUrl}/invoke`);
      const request = JSON.parse(options.body);
      return new Response(JSON.stringify({ id: request.id, ok: true, result: { packet: { packetId: `packet:${bridgeCalls}` } }, error: null }), { status: 200 });
    },
  });
  assert.equal(adapter.configurationStatus().mode, 'remote-discovery');
  assert.equal((await adapter.memorySearch({ query: 'first' })).packet.packetId, 'packet:1');
  assert.equal((await adapter.memorySearch({ query: 'second' })).packet.packetId, 'packet:2');
  assert.equal(discoveryCalls, 1);
  assert.equal(bridgeCalls, 2);
});

test('UPDIA adapter rejects expired and non-allow-listed discovery routes', async (t) => {
  const discoveryUrl = 'https://discovery.example.test/updia-route.json';
  await t.test('expired route', async () => {
    const adapter = new UpdiaAdapter({
      config: { updiaBridgeDiscoveryUrl: discoveryUrl, updiaBridgeAllowedHostSuffixes: ['.trycloudflare.com'] },
      fetchImpl: async () => new Response(JSON.stringify({
        format: 'taowind.updia-bridge-route.v0.1',
        url: 'https://expired.trycloudflare.com',
        updatedAt: new Date(Date.now() - 120_000).toISOString(),
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      }), { status: 200 }),
    });
    await assert.rejects(() => adapter.memorySearch({ query: 'expired' }), (error) => error.code === 'UPDIA_BRIDGE_DISCOVERY_EXPIRED');
  });
  await t.test('disallowed host', async () => {
    const adapter = new UpdiaAdapter({
      config: { updiaBridgeDiscoveryUrl: discoveryUrl, updiaBridgeAllowedHostSuffixes: ['.trycloudflare.com'] },
      fetchImpl: async () => new Response(JSON.stringify({
        format: 'taowind.updia-bridge-route.v0.1',
        url: 'https://127.0.0.1:8788',
        updatedAt: new Date(Date.now() - 1_000).toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }), { status: 200 }),
    });
    await assert.rejects(() => adapter.memorySearch({ query: 'ssrf' }), (error) => error.code === 'UPDIA_BRIDGE_DISCOVERY_TARGET_REJECTED');
  });
});

test('UPDIA adapter submits long generation as an async bridge job and polls its result', async () => {
  const calls = [];
  let requestId;
  let pollCount = 0;
  const adapter = new UpdiaAdapter({
    config: {
      updiaBridgeUrl: 'https://updia.example.test',
      updiaBridgeAsync: true,
      updiaBridgePollMs: 100,
      updiaDefaultMaxTokens: 256,
      updiaDefaultModel: 'qwen3.5:latest',
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (options.method === 'POST') {
        const request = JSON.parse(options.body);
        requestId = request.id;
        assert.equal(options.headers.prefer, 'respond-async');
        assert.equal(request.method, 'generate');
        assert.equal(request.params.model, 'qwen3.5:latest');
        assert.equal(request.params.maxTokens, 256);
        assert.equal(request.params.think, false);
        return new Response(JSON.stringify({
          id: requestId,
          ok: true,
          result: {
            format: 'updia.http-bridge-async-job.v0.1',
            jobId: 'updia-job:test',
            status: 'queued',
            pollPath: '/jobs/updia-job%3Atest',
            pollAfterMs: 1,
          },
          error: null,
        }), { status: 202, headers: { 'content-type': 'application/json' } });
      }
      pollCount += 1;
      const completed = pollCount > 1;
      return new Response(JSON.stringify({
        format: 'updia.http-bridge-async-job.v0.1',
        jobId: 'updia-job:test',
        requestId,
        method: 'generate',
        status: completed ? 'completed' : 'running',
        ...(completed ? {
          response: {
            id: requestId,
            ok: true,
            result: { content: 'grounded answer', route: { provider: 'ollama' } },
            error: null,
          },
        } : {}),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  const result = await adapter.think({ goal: '研究一个需要真实模型推理的问题' });
  assert.equal(result.content, 'grounded answer');
  assert.equal(result.route.provider, 'ollama');
  assert.equal(pollCount, 2);
  assert.equal(calls[1].url, 'https://updia.example.test/jobs/updia-job%3Atest');
});

test('UPDIA adapter exposes a bridge-owned research job for stateless MCP polling', async () => {
  const calls = [];
  const adapter = new UpdiaAdapter({
    config: {
      updiaBridgeUrl: 'https://updia.example.test',
      updiaDefaultMaxTokens: 256,
      updiaDefaultModel: 'qwen3.5:latest',
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/invoke')) {
        const request = JSON.parse(options.body);
        if (request.method === 'knowledge_query') {
          return new Response(JSON.stringify({
            id: request.id,
            ok: true,
            result: { packet: { packetId: 'packet:research', claims: [{ claimId: 'claim:1', statement: 'evidence', claimType: 'fact', sourceRefs: ['source:1'], confidence: 0.9 }] } },
            error: null,
          }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        assert.equal(request.method, 'generate');
        assert.equal(options.headers.prefer, 'respond-async');
        assert.equal(request.params.think, false);
        return new Response(JSON.stringify({
          id: request.id,
          ok: true,
          result: { format: 'updia.http-bridge-async-job.v0.1', jobId: 'updia-job:research', status: 'queued', pollPath: '/jobs/updia-job%3Aresearch', pollAfterMs: 1000 },
          error: null,
        }), { status: 202, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        format: 'updia.http-bridge-async-job.v0.1',
        jobId: 'updia-job:research',
        requestId: 'bridge-request',
        status: 'completed',
        createdAt: '2026-07-29T00:00:00.000Z',
        updatedAt: '2026-07-29T00:01:00.000Z',
        response: { id: 'bridge-request', ok: true, result: { content: 'final grounded research', route: { provider: 'ollama', model: 'qwen3.5:latest' } }, error: null },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  const started = await adapter.researchStart({ question: '三个核心问题', retrievalBudget: 8, budget: 256 });
  assert.equal(started.jobId, 'updia-job:research');
  assert.equal(started.sourceEvidence.packet.packetId, 'packet:research');
  assert.equal(started.knownFacts[0].sourceRefs[0], 'source:1');
  const completed = await adapter.researchStatus({ jobId: started.jobId });
  assert.equal(completed.status, 'completed');
  assert.equal(completed.result.content, 'final grounded research');
  assert.equal(calls[2].url, 'https://updia.example.test/jobs/updia-job%3Aresearch');
});
