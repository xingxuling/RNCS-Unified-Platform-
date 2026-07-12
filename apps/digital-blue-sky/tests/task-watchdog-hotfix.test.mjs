import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { DMLRuntime } from '../src/runtime.mjs';
import { createTaskContract, createTaskPlan, createTaskState } from '../src/task-contract.mjs';
import { persistTaskState } from '../src/task-executor.mjs';
import { runProjectScript } from '../src/experiment-runner.mjs';

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('interrupted running file task automatically resumes from the unfinished operation', async () => {
  const root = tempDir('dml-v042-recovery-project-');
  const stateDir = tempDir('dml-v042-recovery-state-');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', scripts: {} }), 'utf8');
  const action = {
    action_id: 'action:recovery-fixture',
    project_ref: { project_id: 'project:vsr' },
    payload: { instruction: '创建文件 recovered.txt 内容：恢复成功', project_path: root },
    constraints: { max_command_seconds: 10 },
  };
  const contract = createTaskContract({ action, projectPath: root, instruction: action.payload.instruction });
  const plan = createTaskPlan(contract, [
    { type: 'file.write', title: '写入 recovered.txt', path: 'recovered.txt', content: '恢复成功', status: 'running' },
    { type: 'file.verify', title: '验证 recovered.txt', path: 'recovered.txt' },
  ]);
  plan.operations[0].status = 'running';
  const state = createTaskState(contract, plan);
  state.status = 'running';
  state.active_operation_index = 0;
  persistTaskState(stateDir, state);

  const runtime = new DMLRuntime({ stateDir, projectPath: root });
  assert.equal(runtime.recoveryPending, true);
  const recovered = await runtime.resumePendingWork();
  assert.equal(recovered.task.status, 'completed');
  assert.equal(fs.readFileSync(path.join(root, 'recovered.txt'), 'utf8'), '恢复成功');
  assert.equal(runtime.project().state.active_goal.status, 'completed');
  assert.equal(runtime.project().state.active_goal.progress.label, '2/2 步已完成');
});

test('project script timeout always settles and returns structured evidence', async () => {
  const root = tempDir('dml-v042-timeout-project-');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: 'timeout-fixture',
    version: '1.0.0',
    scripts: { hang: 'node -e "setInterval(() => {}, 1000)"' },
  }), 'utf8');
  const started = Date.now();
  const receipt = await runProjectScript({ projectPath: root, script: 'hang', timeoutMs: 250 });
  assert.equal(receipt.status, 'failed');
  assert.equal(receipt.timed_out, true);
  assert.ok(receipt.evidence_root);
  assert.ok(Date.now() - started < 5000, `timeout did not settle: ${Date.now() - started}ms`);
});

test('a persisted failed candidate test is automatically retried once after the hotfix', async () => {
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const projectPath = path.join(packageRoot, 'projects', 'VSR_v0.4.0-alpha.1');
  const stateDir = tempDir('dml-v042-failed-test-recovery-');
  const runtime = new DMLRuntime({ stateDir, projectPath });
  const first = await runtime.executeAsync({
    type: 'dml.message.send',
    project_ref: { project_id: 'project:vsr' },
    payload: { text: '继续升级 VSR 的光照系统，优先解决阴影抖动。', role: 'user', project_path: projectPath },
    authority: { max_risk: 'medium', require_reversible: true, approval_mode: 'when-required' },
  });
  const task = first.result.task;
  const testOperation = task.plan.operations.find((operation) => operation.type === 'candidate.test');
  const presentOperation = task.plan.operations.find((operation) => operation.type === 'candidate.present');
  const adoptOperation = task.plan.operations.find((operation) => operation.type === 'candidate.adopt');
  testOperation.status = 'failed';
  testOperation.error = { code: 'PROJECT_SCRIPT_FAILED', message: '旧版结构化测试回写失败' };
  presentOperation.status = 'waiting';
  adoptOperation.status = 'waiting';
  task.status = 'failed';
  task.error = { ...testOperation.error, operation_id: testOperation.operation_id };
  task.recovery_attempts = 0;
  persistTaskState(stateDir, task);

  const restarted = new DMLRuntime({ stateDir, projectPath });
  const recovered = await restarted.resumePendingWork();
  assert.equal(recovered.task.status, 'waiting_approval');
  assert.equal(recovered.task.recovery_attempts, 1);
  assert.equal(recovered.task.plan.operations.find((operation) => operation.type === 'candidate.test').status, 'completed');
  assert.equal(recovered.task.plan.operations.find((operation) => operation.type === 'candidate.present').status, 'completed');
});
