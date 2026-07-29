import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AetherworldRNCSNativeRuntime, compileNaturalLanguageToRNCS, validateCompilationPlan } from '../src/index.mjs';

const canonicalSource = '创建一座小型以太岛。岛上有两个玩家出生点、一扇可开关的门、一盏蓝色能量灯和一个感应区域。玩家进入感应区域时，门自动打开，灯光增强并产生环境声音。两个客户端必须看到一致的门状态和玩家位置。';
const bciSource = '防止 AI copilot 将微弱、含糊的脑信号扩张成不可逆操作；要求区分神经证据与 AI 先验，支持拒答、人工确认、回滚、漂移检测和身份锚点。';
const runtime = () => new AetherworldRNCSNativeRuntime({ dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'rncs-semantic-gate-')) });

test('semantic gate rejects a foreign-domain prompt before candidate creation', () => {
  const rncs = runtime();
  const before = rncs.health().candidates;
  assert.throws(
    () => rncs.compile({ source: bciSource }),
    (error) => error.code === 'SEMANTIC_COMPILATION_GATE_FAILED'
      && error.details?.defaultTemplateFallbackDetected === true
      && error.details?.sourceDomain === 'neural-intent-protocol',
  );
  assert.equal(rncs.health().candidates, before);
  assert.equal(rncs.worldStatus().world_id, 'world:empty');
});

test('semantic gate accepts the fully specified Aether Island source and allows isolated simulation', async () => {
  const rncs = runtime();
  const plan = rncs.compile({ source: canonicalSource });
  assert.equal(plan.semantic_fidelity.status, 'passed');
  assert.equal(plan.semantic_fidelity.scoreBps, 10_000);
  assert.deepEqual(plan.semantic_fidelity.unexplainedOutputConcepts, []);
  const candidate = rncs.createCandidate({ plan });
  const simulation = await rncs.simulateCandidate({ candidateId: candidate.candidate_id });
  assert.equal(simulation.execution_receipt.status, 'completed');
});

test('semantic gate detects source tampering after compilation', () => {
  const plan = compileNaturalLanguageToRNCS(canonicalSource);
  plan.source.text = bciSource;
  const validation = validateCompilationPlan(plan);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('SEMANTIC_FIDELITY_GATE_STALE_OR_TAMPERED'));
  assert.ok(validation.errors.includes('SEMANTIC_FIDELITY_GATE_FAILED'));
});
