import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const nativeDir = path.join(root, 'native');
const result = spawnSync('make', ['-C', nativeDir], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
