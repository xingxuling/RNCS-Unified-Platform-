import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { DMLRuntime } from '../src/runtime.mjs';

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function createProject() {
  const root = tempDir('dml-v04-project-');
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'base.txt'), 'base\n', 'utf8');
  fs.writeFileSync(path.join(root, 'test.mjs'), "import fs from 'node:fs'; if (!fs.existsSync(new URL('./src/generated.txt', import.meta.url))) process.exit(2);\n", 'utf8');
  fs.writeFileSync(path.join(root, 'package.json'), `${JSON.stringify({ name: 'task-fixture', version: '1.0.0', type: 'module', scripts: { test: 'node test.mjs', build: 'node -e "console.log(\\\"built\\\")"' } }, null, 2)}\n`, 'utf8');
  return root;
}

test('Workbench message really writes and verifies a project file', async () => {
  const projectPath = createProject();
  const stateDir = tempDir('dml-v04-state-');
  const runtime = new DMLRuntime({ stateDir, projectPath });
  const result = await runtime.executeAsync({
    type: 'dml.message.send',
    project_ref: { project_id: 'project:vsr' },
    payload: { text: '创建文件 result.txt 内容：任务真的执行了', role: 'user', project_path: projectPath },
    authority: { max_risk: 'medium', require_reversible: true, approval_mode: 'when-required' },
  });
  assert.equal(result.result.task.status, 'completed');
  assert.equal(fs.readFileSync(path.join(projectPath, 'result.txt'), 'utf8'), '任务真的执行了');
  assert.equal(result.projection.state.active_task.status, 'completed');
  assert.equal(result.projection.state.goals[result.result.task.task_id].progress.current, 2);
});

test('package script is executed as a real process and evidence is recorded', async () => {
  const projectPath = createProject();
  const stateDir = tempDir('dml-v04-state-');
  const runtime = new DMLRuntime({ stateDir, projectPath });
  const result = await runtime.executeAsync({
    type: 'dml.task.execute',
    project_ref: { project_id: 'project:vsr' },
    payload: { instruction: '构建项目', script: 'build', project_path: projectPath },
    authority: { max_risk: 'medium', require_reversible: true, approval_mode: 'when-required' },
  });
  assert.equal(result.result.task.status, 'completed');
  const command = result.result.task.outputs.find((item) => item.type === 'package-script');
  assert.equal(command.status, 'passed');
  assert.equal(command.exit_code, 0);
  assert.ok(command.evidence_root);
});

test('code task modifies an isolated reality, runs tests, waits for owner, then adopts', async () => {
  const projectPath = createProject();
  const stateDir = tempDir('dml-v04-state-');
  const runtime = new DMLRuntime({ stateDir, projectPath });
  const first = await runtime.executeAsync({
    type: 'dml.task.execute',
    project_ref: { project_id: 'project:vsr' },
    payload: {
      instruction: '实现生成文件功能并通过测试',
      project_path: projectPath,
      patch_operations: [{ type: 'write', path: 'src/generated.txt', content: 'generated in isolated reality\n' }],
    },
    authority: { max_risk: 'medium', require_reversible: true, approval_mode: 'when-required' },
  });
  assert.equal(first.result.task.status, 'waiting_approval');
  assert.equal(fs.existsSync(path.join(projectPath, 'src', 'generated.txt')), false);
  const artifact = first.projection.state.artifacts.find((item) => item.goal_id === first.result.task.task_id);
  assert.ok(artifact?.branch_path);
  assert.equal(fs.readFileSync(path.join(artifact.branch_path, 'src', 'generated.txt'), 'utf8'), 'generated in isolated reality\n');

  const adopted = await runtime.executeAsync({
    type: 'dml.result.approve',
    project_ref: { project_id: 'project:vsr' },
    goal_ref: first.result.task.task_id,
    payload: { artifact_id: artifact.artifact_id },
    authority: { max_risk: 'high', require_reversible: false, approval_mode: 'always' },
  }, {
    approval: { decision: 'approved', approver_roles: ['owner'] },
  });
  assert.equal(adopted.result.task.status, 'completed');
  assert.equal(fs.readFileSync(path.join(projectPath, 'src', 'generated.txt'), 'utf8'), 'generated in isolated reality\n');
  assert.ok(adopted.result.result.result_root);
  assert.equal(adopted.projection.state.goals[first.result.task.task_id].status, 'completed');
});

test('unsafe task paths are denied without touching the filesystem', async () => {
  const projectPath = createProject();
  const stateDir = tempDir('dml-v04-state-');
  const runtime = new DMLRuntime({ stateDir, projectPath });
  const result = await runtime.executeAsync({
    type: 'dml.task.execute',
    project_ref: { project_id: 'project:vsr' },
    payload: { instruction: '创建文件 ../escape.txt 内容：denied', project_path: projectPath },
    authority: { max_risk: 'medium', require_reversible: true, approval_mode: 'when-required' },
  });
  assert.equal(result.result.task.status, 'failed');
  assert.equal(result.result.task.error.code, 'UNSAFE_TASK_PATH');
  assert.equal(fs.existsSync(path.join(projectPath, '..', 'escape.txt')), false);
});
