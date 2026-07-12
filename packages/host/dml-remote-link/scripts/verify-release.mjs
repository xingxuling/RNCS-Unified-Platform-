import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'src/relay/server.mjs',
  'src/relay/store.mjs',
  'src/relay/cli.mjs',
  'src/host/local-host.mjs',
  'src/host/cli.mjs',
  'src/shared/protocol.mjs',
  'src/shared/grant.mjs',
  'config/host-policy.example.json',
  'config/cloudflared-config.example.yml',
  'scripts/setup-cloudflare-tunnel.ps1',
  'scripts/first-time-setup.ps1',
  'scripts/create-browser-code.ps1',
  '首次配置数字蓝天机远程链.bat',
  'README.md',
];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
const test = spawnSync(process.execPath, ['--test', '--test-concurrency=1', 'tests/*.test.mjs'], {
  cwd: root,
  shell: true,
  encoding: 'utf8',
});
const demo = spawnSync(process.execPath, ['scripts/demo.mjs'], {
  cwd: root,
  shell: true,
  encoding: 'utf8',
});
const result = {
  format: 'dml.remote-link-verification.v0.3',
  version: '0.3.0-alpha.1',
  required_files: { passed: missing.length === 0, missing },
  tests: { passed: test.status === 0, stdout: test.stdout, stderr: test.stderr },
  demo: { passed: demo.status === 0, stdout: demo.stdout, stderr: demo.stderr },
  passed: missing.length === 0 && test.status === 0 && demo.status === 0,
};
fs.mkdirSync(path.join(root, 'evidence'), { recursive: true });
fs.writeFileSync(path.join(root, 'evidence', 'VERIFICATION_v0.3.0-alpha.1.json'), `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(result.passed ? 0 : 1);
