import { rmSync } from 'node:fs';
for (const path of ['dist', 'outputs']) rmSync(path, { recursive: true, force: true });
