import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { DMLRuntime } from '../src/runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..', '..', '..');
const vsrProject = path.join(packageRoot, 'projects', 'VSR_v0.4.0-alpha.1');

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('Workbench VSR message uses the built-in provider and reaches owner approval', async () => {
  const stateDir = tempDir('dml-v041-vsr-message-');
  const runtime = new DMLRuntime({ stateDir, projectPath: vsrProject });
  const response = await runtime.executeAsync({
    type: 'dml.message.send',
    project_ref: { project_id: 'project:vsr' },
    payload: {
      text: '继续升级 VSR 的光照系统，优先解决阴影抖动。',
      role: 'user',
      project_path: vsrProject,
    },
    authority: { max_risk: 'medium', require_reversible: true, approval_mode: 'when-required' },
  });

  assert.equal(response.result.task.status, 'waiting_approval');
  assert.equal(response.result.task.candidates[0].provider, 'dml.builtin-vsr-shadow-v0.4.2');
  assert.equal(response.projection.state.goals[response.result.task.task_id].status, 'waiting_approval');
  assert.equal(response.result.task.plan.operations.at(-1).status, 'waiting_approval');
});

test('legacy completed candidates are repaired to 6/7 and waiting approval', () => {
  const stateDir = tempDir('dml-v041-legacy-repair-');
  const first = new DMLRuntime({ stateDir, projectPath: vsrProject });
  const goalId = 'goal:legacy-progress';
  first.event({ type: 'goal.created', project_id: 'project:vsr', goal_id: goalId, message: '旧版 VSR 阴影任务', data: { title: '旧版 VSR 阴影任务', instruction: '继续升级 VSR 的光照系统，优先解决阴影抖动。' } });
  first.event({ type: 'plan.created', project_id: 'project:vsr', goal_id: goalId, message: '旧版计划', data: { steps: [
    { step_id: 'read-context', label: '读取', status: 'completed' },
    { step_id: 'inspect-problem', label: '检查', status: 'waiting' },
    { step_id: 'run-tests', label: '测试', status: 'waiting' },
    { step_id: 'produce-result', label: '结果', status: 'waiting' },
  ] } });
  first.event({ type: 'artifact.produced', project_id: 'project:vsr', goal_id: goalId, message: '稳定优先方案', data: { artifact_id: 'artifact:legacy', title: '稳定优先方案', status: 'candidate', root: 'legacy-root', branch_path: path.join(stateDir, 'branch'), source_path: vsrProject } });
  first.event({ type: 'approval.requested', project_id: 'project:vsr', goal_id: goalId, message: '是否采用？', data: { approval_id: 'approval:legacy', artifact_id: 'artifact:legacy', proposal_root: 'legacy-proposal' } });

  const repaired = new DMLRuntime({ stateDir, projectPath: vsrProject });
  const goal = repaired.project().state.goals[goalId];
  assert.equal(goal.status, 'waiting_approval');
  assert.equal(goal.progress.current, 6);
  assert.equal(goal.progress.total, 7);
  assert.equal(goal.progress.label, '6/7 步已完成');
  assert.equal(goal.steps.at(-1).step_id, 'approval');
  assert.equal(goal.steps.at(-1).status, 'waiting');
});

test('continue current task does not create a duplicate while approval is pending', async () => {
  const stateDir = tempDir('dml-v041-continue-');
  const runtime = new DMLRuntime({ stateDir, projectPath: vsrProject });
  const first = await runtime.executeAsync({
    type: 'dml.message.send',
    project_ref: { project_id: 'project:vsr' },
    payload: { text: '继续升级 VSR 的光照系统，优先解决阴影抖动。', role: 'user', project_path: vsrProject },
    authority: { max_risk: 'medium', require_reversible: true, approval_mode: 'when-required' },
  });
  const taskId = first.result.task.task_id;
  const continued = await runtime.executeAsync({
    type: 'dml.message.send',
    project_ref: { project_id: 'project:vsr' },
    payload: { text: '继续当前任务', role: 'user', project_path: vsrProject },
    authority: { max_risk: 'low', require_reversible: true, approval_mode: 'when-required' },
  });
  assert.equal(continued.result.task.task_id, taskId);
  assert.equal(continued.result.task.status, 'waiting_approval');
  assert.equal(runtime.project().state.active_goal_id, taskId);
});
