#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { CognitiveDMLRuntime as DMLRuntime } from './cognitive-runtime-wrapper.mjs';

const args = process.argv.slice(2);
const command = args[0] || 'help';
const flag = (name, fallback = null) => {
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? true) : fallback;
};
const boolFlag = (name) => args.includes(name);
const stateDir = path.resolve(String(flag('--state', process.env.DML_STATE_DIR || 'state')));
const runtime = new DMLRuntime({ stateDir });
const print = (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);

try {
  if (command === 'health') print(runtime.health());
  else if (command === 'capabilities') print(runtime.describe());
  else if (command === 'project') print(runtime.project());
  else if (command === 'events') print(runtime.readEvents());
  else if (command === 'compile') {
    const file = flag('--file');
    if (!file) throw new Error('--file is required');
    print(runtime.compileIntent(JSON.parse(fs.readFileSync(path.resolve(String(file)), 'utf8'))));
  } else if (command === 'execute') {
    const file = flag('--file');
    if (!file) throw new Error('--file is required');
    const approval = boolFlag('--approve') ? { decision: 'approved' } : null;
    print(await runtime.executeAsync(JSON.parse(fs.readFileSync(path.resolve(String(file)), 'utf8')), { approval }));
  } else if (command === 'develop-vsr') {
    const projectPath = flag('--project-path');
    if (!projectPath) throw new Error('--project-path is required');
    print(await runtime.executeAsync({ type: 'dml.development.run', project_ref: { project_id: 'project:vsr' }, payload: { project_path: path.resolve(String(projectPath)), title: '升级 VSR 光照系统：解决阴影抖动', instruction: '继续升级 VSR 的光照系统，优先解决阴影抖动。' } }));
  } else if (command === 'demo') {
    print(runtime.demo({ reset: boolFlag('--reset'), projectPath: flag('--project-path') || null }));
  } else if (command === 'register-gateway') {
    const gatewayDir = flag('--gateway');
    if (!gatewayDir) throw new Error('--gateway <directory> is required');
    const script = fileURLToPath(new URL('../scripts/register-gateway.mjs', import.meta.url));
    const { spawnSync } = await import('node:child_process');
    const response = spawnSync(process.execPath, [script, String(gatewayDir)], { stdio: 'inherit' });
    process.exitCode = response.status || 0;
  } else {
    process.stdout.write(`DML Core Runtime v0.2.0-alpha.1\n\nCommands:\n  health\n  capabilities\n  project [--state DIR]\n  events [--state DIR]\n  compile --file ACTION.json\n  execute --file ACTION.json [--approve]\n  develop-vsr --project-path DIR
  demo [--reset] [--project-path DIR]\n  register-gateway --gateway DIR\n  serve: npm run serve\n`);
  }
} catch (error) {
  process.stderr.write(`${error.code || 'ERROR'}: ${error.message}\n`);
  process.exitCode = 1;
}
