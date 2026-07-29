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
