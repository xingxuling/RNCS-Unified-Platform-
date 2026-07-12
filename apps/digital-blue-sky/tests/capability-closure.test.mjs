import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { CapabilityClosure, selectRelevantSkills } from '../src/capability-closure.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dml-v03-'));
  const state = path.join(root, '.state');
  const files = [
    'packages/spatial-reality-3d/src/index.ts',
    'tests/spatial-reality-3d.ts',
    'benchmarks/spatial-reality-3d.ts',
  ];
  for (const relative of files) {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `// ${relative}\n`, 'utf8');
  }
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    scripts: {
      'dml:shadow-matrix': 'node --version',
      'test:spatial-3d': 'node --version',
    },
  }), 'utf8');
  return { root, state };
}

test('capability scanner recognizes the built-in VSR provider and real tests', () => {
  const { root, state } = fixture();
  const closure = new CapabilityClosure({ stateDir: state, projectPath: root });
  const registry = closure.scan({ projectPath: root, projection: { state: { skills: [] } } });
  assert.equal(registry.format, 'dml.capability-registry.v0.4');
  assert.equal(closure.capability('filesystem.write').available, true);
  assert.equal(closure.capability('project.test').available, true);
  assert.equal(closure.capability('code.provider.vsr-shadow').available, true);
  assert.equal(registry.registry_root.length, 64);
});

test('specialized VSR task is executable while a generic code task reports the agent gap', () => {
  const { root, state } = fixture();
  const closure = new CapabilityClosure({ stateDir: state, projectPath: root });
  closure.scan({ projectPath: root, projection: { state: { skills: [] } } });
  const specialized = closure.buildPlan('继续升级 VSR 光照系统，优先解决阴影抖动。');
  assert.equal(specialized.executable, true);
  assert.equal(specialized.specialized_provider, 'dml.builtin-vsr-shadow-v0.4');

  const generic = closure.buildPlan('重构一个完全无关的数据库模块');
  assert.equal(generic.executable, false);
  assert.ok(generic.missing_capabilities.includes('code.agent.authorized'));
});

test('failure diagnosis and skill selection are persisted inputs to replanning', () => {
  const { root, state } = fixture();
  const closure = new CapabilityClosure({ stateDir: state, projectPath: root });
  const diagnosis = closure.diagnose(Object.assign(new Error('temporarily busy'), { code: 'EBUSY' }), 'verify');
  assert.equal(diagnosis.retryable, true);
  assert.equal(diagnosis.kind, 'transient');
  const selected = selectRelevantSkills('修复方向光阴影抖动', [
    { skill_id: 'skill:shadow', name: '阴影抖动诊断', level: '已验证', applicability: ['方向光阴影'] },
  ]);
  assert.equal(selected[0].skill_id, 'skill:shadow');
});
