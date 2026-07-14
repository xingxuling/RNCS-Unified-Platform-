import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AetherworldRNCSNativeRuntime } from '../src/index.mjs';

const source = '创建一座小型以太岛。岛上有两个玩家出生点、一扇可开关的门、一盏蓝色能量灯和一个感应区域。玩家进入感应区域时，门自动打开，灯光增强并产生环境声音。两个客户端必须看到一致的门状态和玩家位置。';

test('tampered persisted candidate records are rejected before rehydration', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'candidate-integrity-'));
  const runtime = new AetherworldRNCSNativeRuntime({ dataDir });
  runtime.createCandidate({ plan: runtime.compile({ source }) });
  const recordsPath = path.join(dataDir, 'candidate-records.json');
  const records = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
  records[0].status = 'authorized';
  fs.writeFileSync(recordsPath, `${JSON.stringify(records, null, 2)}\n`);
  assert.throws(
    () => new AetherworldRNCSNativeRuntime({ dataDir }),
    error => error.code === 'CANDIDATE_RECORD_SEAL_MISMATCH',
  );
});
