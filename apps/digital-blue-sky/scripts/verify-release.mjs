#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'README.md', 'STATUS.md', 'package.json',
  'src/runtime.mjs', 'src/task-contract.mjs', 'src/task-planner.mjs',
  'src/task-executor.mjs', 'src/model-agent-provider.mjs', 'src/cognitive-provider.mjs', 'src/cognitive-memory.mjs', 'src/cognitive-tools.mjs', 'src/cognitive-loop.mjs', 'src/cognitive-runtime-wrapper.mjs', 'src/web-host.mjs',
  'schemas/dml-semantic-action.v0.4.schema.json',
  'schemas/dml-work-event.v0.4.schema.json',
  'schemas/dml-workbench-projection.v0.4.schema.json', 'schemas/dml-workbench-projection.v0.5.schema.json',
  'schemas/dml-task-contract.v0.4.schema.json',
  'schemas/dml-task-plan.v0.4.schema.json',
  'schemas/dml-task-result.v0.4.schema.json',
  'integration/hnaf/digital-blue-tianji-workbench.aip.v0.7.json',
  'integration/reality-one/dml.runtime.template.json',
  'web/index.html',
];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
for (const file of required.filter((file) => file.endsWith('.json'))) {
  if (fs.existsSync(path.join(root, file))) JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}
const assetsDir = path.join(root, 'web', 'assets');
const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir).filter((name) => fs.statSync(path.join(assetsDir, name)).isFile()) : [];
if (assets.length === 0) missing.push('web/assets/*');
const result = {
  status: missing.length ? 'FAIL' : 'PASS',
  runtime_version: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version,
  protocols: ['dml.semantic-action.v0.4', 'dml.work-event.v0.4', 'dml.workbench-projection.v0.5', 'dml.task-contract.v0.4'],
  required_files: required.length,
  workbench_assets: assets.length,
  missing,
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (missing.length) process.exitCode = 1;
