import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DMLRuntime, normalizeSemanticAction, validateWorkEvent } from '../src/index.mjs';

const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'dml-core-'));

test('semantic action is deterministic when fields are fixed', () => {
  const raw = {
    action_id: 'action:test', type: 'dml.goal.create', created_at: '2026-07-01T00:00:00.000Z',
    subject: { subject_id: 'subject:dml:test', kind: 'digital-mechanical-life', roles: ['collaborator'], scopes: [] },
    payload: { title: '测试', instruction: '执行测试' },
  };
  assert.equal(normalizeSemanticAction(raw).action_root, normalizeSemanticAction(raw).action_root);
});

test('CNP binding selects DML capability', () => {
  const runtime = new DMLRuntime({ stateDir: temp() });
  const compiled = runtime.compileIntent({ type: 'dml.goal.create', project_ref: { project_id: 'project:vsr' }, payload: { title: '测试', instruction: '测试任务' } });
  assert.equal(compiled.negotiation.plan.status, 'satisfied');
  assert.equal(compiled.negotiation.plan.steps[0].capability_id, 'dml.goal.create');
  assert.equal(compiled.authority.status, 'approved');
});

test('goal creation persists events and projection', () => {
  const stateDir = temp();
  const runtime = new DMLRuntime({ stateDir });
  const result = runtime.execute({ type: 'dml.goal.create', project_ref: { project_id: 'project:vsr' }, payload: { title: '测试目标', instruction: '完成一个测试目标' } });
  assert.equal(result.status, 'executed');
  assert.equal(result.projection.state.active_goal.title, '测试目标');
  assert.ok(runtime.readEvents().length >= 4);
  const restarted = new DMLRuntime({ stateDir });
  assert.equal(restarted.project().state.active_goal.title, '测试目标');
});

test('pause and resume are semantic actions, not domain endpoints', () => {
  const runtime = new DMLRuntime({ stateDir: temp() });
  const created = runtime.execute({ type: 'dml.goal.create', project_ref: { project_id: 'project:vsr' }, payload: { title: '目标', instruction: '继续' } });
  const goalId = created.projection.state.active_goal_id;
  const paused = runtime.execute({ type: 'dml.goal.pause', project_ref: { project_id: 'project:vsr' }, goal_ref: goalId, payload: { goal_id: goalId } });
  assert.equal(paused.projection.state.active_goal.status, 'paused');
  const resumed = runtime.execute({ type: 'dml.goal.resume', project_ref: { project_id: 'project:vsr' }, goal_ref: goalId, payload: { goal_id: goalId } });
  assert.equal(resumed.projection.state.active_goal.status, 'running');
});

test('formal result adoption requires AAF approval', () => {
  const runtime = new DMLRuntime({ stateDir: temp() });
  const demo = runtime.demo({ reset: true });
  const artifact = demo.state.right_context.artifacts[0];
  const pending = runtime.execute({ type: 'dml.result.approve', project_ref: { project_id: 'project:vsr' }, goal_ref: demo.state.active_goal_id, payload: { artifact_id: artifact.artifact_id } });
  assert.equal(pending.status, 'pending_approval');
  const approved = runtime.execute({ type: 'dml.result.approve', project_ref: { project_id: 'project:vsr' }, goal_ref: demo.state.active_goal_id, payload: { artifact_id: artifact.artifact_id } }, { approval: { decision: 'approved' } });
  assert.equal(approved.status, 'executed');
  assert.equal(approved.projection.state.active_goal.status, 'completed');
});

test('project inspection produces a real file snapshot', () => {
  const project = temp();
  fs.writeFileSync(path.join(project, 'a.txt'), 'hello');
  fs.mkdirSync(path.join(project, 'src'));
  fs.writeFileSync(path.join(project, 'src', 'b.js'), 'export const b=1;');
  const runtime = new DMLRuntime({ stateDir: temp() });
  const result = runtime.execute({ type: 'dml.project.inspect', project_ref: { project_id: 'project:test' }, payload: { path: project } });
  assert.equal(result.result.file_count, 2);
  assert.equal(result.projection.state.files.length, 2);
});

test('tampered event journal is detected', () => {
  const stateDir = temp();
  const runtime = new DMLRuntime({ stateDir });
  runtime.execute({ type: 'dml.goal.create', project_ref: { project_id: 'project:vsr' }, payload: { title: '目标', instruction: '测试' } });
  const file = path.join(stateDir, 'events.ndjson');
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  const event = JSON.parse(lines[0]);
  event.message = '被篡改';
  lines[0] = JSON.stringify(event);
  fs.writeFileSync(file, lines.join('\n') + '\n');
  assert.throws(() => new DMLRuntime({ stateDir }).readEvents(), /EVENT_JOURNAL_TAMPERED/);
});


test('development capability is advertised and requires async execution', async () => {
  const runtime = new DMLRuntime({ stateDir: temp() });
  const compiled = runtime.compileIntent({
    type: 'dml.development.run',
    project_ref: { project_id: 'project:vsr' },
    payload: { project_path: '/tmp/placeholder', task: '修复阴影抖动' },
  }, { capabilities: ['filesystem.read', 'filesystem.write', 'process.spawn'] });
  assert.equal(compiled.negotiation.plan.status, 'satisfied');
  assert.equal(compiled.negotiation.plan.steps[0].capability_id, 'dml.development.run');
  assert.throws(() => runtime.execute({
    type: 'dml.development.run',
    project_ref: { project_id: 'project:vsr' },
    payload: { project_path: '/tmp/placeholder' },
  }), (error) => error?.code === 'ASYNC_ACTION_REQUIRED');
});

test('learning, branch, experience and skill events enter the projection', () => {
  const runtime = new DMLRuntime({ stateDir: temp() });
  const projectId = 'project:vsr';
  const goalId = 'goal:test-learning';
  runtime.event({ type: 'goal.created', project_id: projectId, goal_id: goalId, message: '测试学习闭环', data: { title: '测试学习闭环', instruction: '测试' } });
  runtime.event({ type: 'learning.plan.created', project_id: projectId, goal_id: goalId, message: '计划', data: { learning_id: 'learning:1', topic: '阴影稳定', status: 'planned' } });
  runtime.event({ type: 'source.recorded', project_id: projectId, goal_id: goalId, message: '来源', data: { source_id: 'source:1', title: '源码', uri: 'file://source', content_hash: 'a'.repeat(64), trust_score: 0.9 } });
  runtime.event({ type: 'knowledge.claimed', project_id: projectId, goal_id: goalId, message: '声明', data: { claim_id: 'claim:1', statement: '纹素对齐有助于稳定', confidence: 0.9 } });
  runtime.event({ type: 'branch.created', project_id: projectId, goal_id: goalId, message: '分支', data: { branch_id: 'branch:1', label: '稳定优先', branch_path: '/tmp/b', source_path: '/tmp/s' } });
  runtime.event({ type: 'experience.recorded', project_id: projectId, goal_id: goalId, message: '经验', data: { episode_id: 'episode:1', lessons: ['先分支后提交'], evidence_root: 'b'.repeat(64) } });
  runtime.event({ type: 'skill.hypothesized', project_id: projectId, goal_id: goalId, message: '技能候选', data: { hypothesis_id: 'hypothesis:1', name: '阴影稳定', trigger_conditions: [], procedure: [], evidence_roots: [] } });
  const state = runtime.project().state;
  assert.equal(state.learning_plans.length, 1);
  assert.equal(state.sources.length, 1);
  assert.equal(state.knowledge_claims.length, 1);
  assert.equal(state.branches.length, 1);
  assert.equal(state.experiences.length, 1);
  assert.equal(state.skill_hypotheses.length, 1);
});
