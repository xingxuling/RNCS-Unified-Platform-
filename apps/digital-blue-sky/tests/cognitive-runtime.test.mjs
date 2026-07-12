import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { CognitiveLoop } from '../src/cognitive-loop.mjs';
import { CognitiveDMLRuntime as DMLRuntime } from '../src/cognitive-runtime-wrapper.mjs';

function temp(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function action(text, projectPath) {
  return {
    type: 'dml.message.send',
    project_ref: { project_id: 'project:test' },
    payload: { text, project_path: projectPath },
  };
}

test('cognitive loop uses a read-only tool before answering', async () => {
  const projectPath = temp('dml-cognitive-project');
  const stateDir = temp('dml-cognitive-state');
  fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify({ name: 'fixture', scripts: { test: 'node --test' } }));
  fs.writeFileSync(path.join(projectPath, 'README.md'), '# Fixture\n');
  let calls = 0;
  const loop = new CognitiveLoop({
    stateDir,
    projectPath,
    provider: async () => {
      calls += 1;
      if (calls === 1) return { content: '', json: { mode: 'tool', tool: 'project.summary', arguments: {}, reason: '需要项目事实' }, provider: 'fake', model: 'fake-model' };
      return { content: '', json: { mode: 'answer', answer: '这是一个名为 fixture 的 Node 项目。', remember: ['项目名是 fixture'] }, provider: 'fake', model: 'fake-model', receipt_root: 'receipt:test' };
    },
  });
  const result = await loop.handle({ text: '这个项目是什么？', projectId: 'project:test', projectPath });
  assert.equal(result.mode, 'answer');
  assert.match(result.answer, /fixture/);
  assert.equal(result.observations.length, 1);
  assert.equal(result.observations[0].tool, 'project.summary');
  assert.equal(loop.memory.publicState().fact_count, 1);
});

test('runtime answers a normal question without creating a task', async () => {
  const projectPath = temp('dml-question-project');
  const stateDir = temp('dml-question-state');
  fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify({ name: 'question-project', scripts: {} }));
  const runtime = new DMLRuntime({
    stateDir,
    projectPath,
    cognitiveProvider: async () => ({
      content: '',
      json: { mode: 'answer', answer: '当前项目可以正常读取，我没有创建任务。' },
      provider: 'fake',
      model: 'fake-model',
      receipt_root: 'receipt:answer',
    }),
  });
  const result = await runtime.executeAsync(action('当前项目能正常读取吗？', projectPath));
  assert.equal(result.result.mode, 'answer');
  assert.equal(runtime.activeTask, null);
  const messages = result.projection.state.messages;
  assert.equal(messages.at(-2).role, 'user');
  assert.equal(messages.at(-1).role, 'assistant');
  assert.match(messages.at(-1).text, /没有创建任务/);
});

test('runtime turns a cognitive task decision into a real file operation', async () => {
  const projectPath = temp('dml-task-project');
  const stateDir = temp('dml-task-state');
  fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify({ name: 'task-project', scripts: {} }));
  const runtime = new DMLRuntime({
    stateDir,
    projectPath,
    cognitiveProvider: async () => ({
      content: '',
      json: { mode: 'task', title: '写入结果文件', instruction: '创建文件 cognitive-result.txt 内容：认知任务已真实执行', reason: '用户明确要求修改项目' },
      provider: 'fake',
      model: 'fake-model',
      receipt_root: 'receipt:task',
    }),
  });
  const result = await runtime.executeAsync(action('帮我在项目里创建一个结果文件', projectPath));
  assert.equal(result.result.task.status, 'completed');
  assert.equal(fs.readFileSync(path.join(projectPath, 'cognitive-result.txt'), 'utf8'), '认知任务已真实执行');
  assert.equal(runtime.activeTask.status, 'completed');
});

test('without a model, built-in status questions still receive a factual answer', async () => {
  const projectPath = temp('dml-builtin-project');
  const stateDir = temp('dml-builtin-state');
  fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify({ name: 'builtin-project', scripts: {} }));
  const runtime = new DMLRuntime({ stateDir, projectPath });
  const result = await runtime.executeAsync(action('你能做什么？', projectPath));
  assert.equal(result.result.mode, 'answer');
  assert.match(result.result.answer, /读取项目/);
  assert.equal(runtime.activeTask, null);
});
