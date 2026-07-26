import { spawnSync } from 'node:child_process';
import { mkdirSync, cpSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let compilerPath;
try {
  compilerPath = require.resolve('typescript/bin/tsc');
} catch {
  console.error('VSR_BUILD_TYPESCRIPT_MISSING: run `npm ci` from the RNCS repository root.');
  process.exit(1);
}
const result = spawnSync(process.execPath, [compilerPath, '-p', 'tsconfig.json'], {
  cwd: packageRoot,
  stdio: 'inherit'
});
if (result.error) {
  console.error(`VSR_BUILD_TYPESCRIPT_SPAWN_FAILED: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);
mkdirSync(path.join(packageRoot, 'dist/apps/studio'), { recursive: true });
cpSync(path.join(packageRoot, 'apps/studio'), path.join(packageRoot, 'dist/apps/studio'), { recursive: true });
mkdirSync(path.join(packageRoot, 'dist/apps/webgpu-v03'), { recursive: true });
cpSync(path.join(packageRoot, 'apps/webgpu-v03'), path.join(packageRoot, 'dist/apps/webgpu-v03'), { recursive: true });
mkdirSync(path.join(packageRoot, 'dist/apps/spatial-v04'), { recursive: true });
cpSync(path.join(packageRoot, 'apps/spatial-v04'), path.join(packageRoot, 'dist/apps/spatial-v04'), { recursive: true });
mkdirSync(path.join(packageRoot, 'dist/schemas'), { recursive: true });
cpSync(path.join(packageRoot, 'schemas'), path.join(packageRoot, 'dist/schemas'), { recursive: true });
console.log('VSR build complete.');
